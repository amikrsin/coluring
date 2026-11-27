import { SEED_PACKS, SEED_SHEETS } from '../src/data/seed-data';
import rawCatalogJson from '../src/data/catalog.json';
import { getLineArtSvg } from '../src/data/line-art';
import { generateColoringPdfBytes } from '../src/utils/pdf-generator';
import { getText, isValidLocale } from '../src/i18n/translations';
import {
  ColoringSheet,
  Locale,
  PackWithSheets,
  PaperSize,
  StaticCatalogDocument,
} from '../src/types';

/**
 * Minimal Cloudflare Workers binding interfaces so TypeScript compiles cleanly
 * without requiring @cloudflare/workers-types during Vite SPA builds.
 */
export interface R2ObjectBodyLike {
  body: ReadableStream | null;
  httpEtag?: string;
  httpMetadata?: {
    contentType?: string;
    contentDisposition?: string;
  };
}

export interface R2PutOptionsLike {
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
    contentDisposition?: string;
  };
}

export interface R2BucketLike {
  get(key: string): Promise<R2ObjectBodyLike | null>;
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string | Blob,
    options?: R2PutOptionsLike
  ): Promise<unknown>;
}

export interface KVNamespaceLike {
  get(key: string, type?: 'text' | 'json'): Promise<any>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

export interface AssetsFetcherLike {
  fetch(request: Request): Promise<Response>;
}

export interface CloudflareEnv {
  ASSETS?: AssetsFetcherLike;
  COLORING_BUCKET?: R2BucketLike;
  COLORING_KV?: KVNamespaceLike;
  DB?: D1DatabaseLike;
  PUBLIC_ORIGIN?: string;
  ADMIN_PIN?: string;
  ADMIN_SESSION_SECRET?: string;
}

interface DynamicMetric {
  viewsDelta: number;
  upvotesDelta: number;
  downvotesDelta: number;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const MAX_CATALOG_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_WEBP_BYTES = 3 * 1024 * 1024; // 3 MB
const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Edge isolate fallback cache when KV/D1 are not yet bound
const memoryMetrics = new Map<string, DynamicMetric>();
let schemaReadyPromise: Promise<void> | null = null;
let ephemeralSigningKey: string | null = null;

function getEphemeralSigningKey(): string {
  if (!ephemeralSigningKey) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    ephemeralSigningKey = bytesToHex(bytes);
  }
  return ephemeralSigningKey;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const out = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecodeToString(b64url: string): string {
  const padded = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(padLen));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function decodeBase64Bytes(base64: string, maxBytes: number): Uint8Array | null {
  const clean = base64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
  if (!clean || clean.length > Math.ceil(maxBytes * 1.4)) {
    return null;
  }
  try {
    const binary = atob(clean);
    if (binary.length === 0 || binary.length > maxBytes) {
      return null;
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function isValidWebpBytes(bytes: Uint8Array): boolean {
  // RIFF....WEBP magic header
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

function isValidPdfBytes(bytes: Uint8Array): boolean {
  // %PDF- magic header
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

async function sha256Bytes(text: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

async function derivePbkdf2HashHex(pin: string, saltHex: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const saltBytes = hexToBytes(saltHex);
  const saltBuffer = new ArrayBuffer(saltBytes.byteLength);
  new Uint8Array(saltBuffer).set(saltBytes);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

async function hmacSignHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message)
  );
  return bytesToHex(new Uint8Array(sig));
}

async function ensureD1Schema(db: D1DatabaseLike): Promise<void> {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await db
        .prepare(
          `CREATE TABLE IF NOT EXISTS catalog_state (
            id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`
        )
        .run();
      await db
        .prepare(
          `CREATE TABLE IF NOT EXISTS admin_auth (
            id TEXT PRIMARY KEY,
            pin_hash TEXT NOT NULL,
            pin_salt TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`
        )
        .run();
      await db
        .prepare(
          `CREATE TABLE IF NOT EXISTS sheet_metrics (
            id TEXT PRIMARY KEY,
            views_delta INTEGER NOT NULL DEFAULT 0,
            upvotes_delta INTEGER NOT NULL DEFAULT 0,
            downvotes_delta INTEGER NOT NULL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`
        )
        .run();
    })().catch((err) => {
      schemaReadyPromise = null;
      throw err;
    });
  }
  await schemaReadyPromise;
}

async function getClaimedAdminAuth(
  env: CloudflareEnv
): Promise<{ pin_hash: string; pin_salt: string } | null> {
  if (!env.DB) return null;
  await ensureD1Schema(env.DB);
  return env.DB.prepare('SELECT pin_hash, pin_salt FROM admin_auth WHERE id = ?')
    .bind('primary')
    .first<{ pin_hash: string; pin_salt: string }>();
}

async function getTokenSigningSecret(env: CloudflareEnv): Promise<string> {
  if (env.ADMIN_SESSION_SECRET?.trim()) {
    return env.ADMIN_SESSION_SECRET.trim();
  }
  if (env.ADMIN_PIN?.trim()) {
    return `colorworld-pin-v1:${env.ADMIN_PIN.trim()}`;
  }
  const claimed = await getClaimedAdminAuth(env);
  if (claimed?.pin_hash) {
    return `colorworld-claimed-v1:${claimed.pin_hash}`;
  }
  return getEphemeralSigningKey();
}

async function issueAdminToken(
  env: CloudflareEnv
): Promise<{ token: string; expiresAt: number }> {
  const now = Date.now();
  const expiresAt = now + TOKEN_TTL_MS;
  const payloadB64 = base64UrlEncode(
    JSON.stringify({ role: 'admin', iat: now, exp: expiresAt })
  );
  const secret = await getTokenSigningSecret(env);
  const sigHex = await hmacSignHex(secret, payloadB64);
  return { token: `${payloadB64}.${sigHex}`, expiresAt };
}

async function verifyAdminBearerToken(
  request: Request,
  env: CloudflareEnv
): Promise<boolean> {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7).trim();
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return false;

  const payloadB64 = token.slice(0, dotIdx);
  const providedSigHex = token.slice(dotIdx + 1);
  if (!/^[a-f0-9]{64}$/i.test(providedSigHex)) return false;

  const secret = await getTokenSigningSecret(env);
  const expectedSigHex = await hmacSignHex(secret, payloadB64);
  if (!constantTimeEqual(hexToBytes(providedSigHex), hexToBytes(expectedSigHex))) {
    return false;
  }

  try {
    const parsed = JSON.parse(base64UrlDecodeToString(payloadB64)) as {
      role?: string;
      exp?: number;
    };
    return parsed.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function isSafeCatalogAssetUrl(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/')) {
    return !trimmed.startsWith('//') && !trimmed.includes('..');
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateCatalogDocument(raw: unknown): StaticCatalogDocument | null {
  if (!raw || typeof raw !== 'object') return null;
  const doc = raw as Partial<StaticCatalogDocument>;
  if (!Array.isArray(doc.sheets) || !Array.isArray(doc.categories)) {
    return null;
  }

  for (const s of doc.sheets) {
    if (!s || typeof s !== 'object') return null;
    if (typeof s.slug !== 'string' || !s.slug.trim()) return null;
    if (typeof s.title !== 'string' || !s.title.trim()) return null;
    if (
      !isSafeCatalogAssetUrl(s.previewWebpUrl) ||
      !isSafeCatalogAssetUrl(s.pdfUrl) ||
      (s.pdfLetterUrl !== undefined && !isSafeCatalogAssetUrl(s.pdfLetterUrl)) ||
      (s.lineArtUrl !== undefined && !isSafeCatalogAssetUrl(s.lineArtUrl)) ||
      (s.sourcePdfUrl !== undefined && !isSafeCatalogAssetUrl(s.sourcePdfUrl))
    ) {
      return null;
    }
  }

  return {
    version: typeof doc.version === 'number' && Number.isFinite(doc.version) ? doc.version : 1,
    updatedAt: new Date().toISOString(),
    defaultR2BaseUrl:
      typeof doc.defaultR2BaseUrl === 'string' && isSafeCatalogAssetUrl(doc.defaultR2BaseUrl)
        ? doc.defaultR2BaseUrl
        : '',
    categories: doc.categories,
    holidayTicker: Array.isArray(doc.holidayTicker) ? doc.holidayTicker : [],
    sheets: doc.sheets,
  };
}

function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
  allowPublicCors = true
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  };
  if (allowPublicCors) {
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function adminJsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {}
): Response {
  // Never set wildcard CORS on authenticated admin routes
  return jsonResponse(
    data,
    status,
    { 'Cache-Control': 'no-store', ...extraHeaders },
    false
  );
}

async function getMetricDelta(env: CloudflareEnv, id: string): Promise<DynamicMetric> {
  if (env.DB) {
    try {
      await ensureD1Schema(env.DB);
      const row = await env.DB.prepare(
        'SELECT views_delta, upvotes_delta, downvotes_delta FROM sheet_metrics WHERE id = ?'
      )
        .bind(id)
        .first<{ views_delta: number; upvotes_delta: number; downvotes_delta: number }>();
      if (row) {
        return {
          viewsDelta: Number(row.views_delta) || 0,
          upvotesDelta: Number(row.upvotes_delta) || 0,
          downvotesDelta: Number(row.downvotes_delta) || 0,
        };
      }
    } catch {
      // Fallback to KV/memory if table not initialized yet
    }
  }

  if (env.COLORING_KV) {
    try {
      const raw = await env.COLORING_KV.get(`metric:${id}`, 'json');
      if (raw) return raw as DynamicMetric;
    } catch {
      // Fallback to isolate memory
    }
  }

  return memoryMetrics.get(id) || { viewsDelta: 0, upvotesDelta: 0, downvotesDelta: 0 };
}

async function incrementMetric(
  env: CloudflareEnv,
  id: string,
  field: 'viewsDelta' | 'upvotesDelta' | 'downvotesDelta'
): Promise<DynamicMetric> {
  const current = await getMetricDelta(env, id);
  const next: DynamicMetric = {
    ...current,
    [field]: current[field] + 1,
  };
  memoryMetrics.set(id, next);

  if (env.DB) {
    try {
      await ensureD1Schema(env.DB);
      await env.DB.prepare(
        `INSERT INTO sheet_metrics (id, views_delta, upvotes_delta, downvotes_delta, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           views_delta = excluded.views_delta,
           upvotes_delta = excluded.upvotes_delta,
           downvotes_delta = excluded.downvotes_delta,
           updated_at = CURRENT_TIMESTAMP`
      )
        .bind(id, next.viewsDelta, next.upvotesDelta, next.downvotesDelta)
        .run();
    } catch {
      // Non-fatal fallback
    }
  }

  if (env.COLORING_KV) {
    try {
      await env.COLORING_KV.put(`metric:${id}`, JSON.stringify(next));
    } catch {
      // Non-fatal fallback
    }
  }

  return next;
}

async function hydrateCatalog(env: CloudflareEnv): Promise<{
  sheets: ColoringSheet[];
  packs: PackWithSheets[];
}> {
  const sheets = await Promise.all(
    SEED_SHEETS.map(async (sheet) => {
      const delta = await getMetricDelta(env, sheet.id);
      return {
        ...sheet,
        views: sheet.views + delta.viewsDelta,
        upvotes: sheet.upvotes + delta.upvotesDelta,
        downvotes: sheet.downvotes + delta.downvotesDelta,
      };
    })
  );

  const sheetMap = new Map(sheets.map((s) => [s.id, s]));

  const packs: PackWithSheets[] = await Promise.all(
    SEED_PACKS.map(async (pack) => {
      const delta = await getMetricDelta(env, `pack:${pack.slug}`);
      const packSheets = pack.sheetIds
        .map((sid) => sheetMap.get(sid))
        .filter((s): s is ColoringSheet => Boolean(s));

      return {
        ...pack,
        views: pack.views + delta.viewsDelta,
        upvotes: pack.upvotes + delta.upvotesDelta,
        downvotes: pack.downvotes + delta.downvotesDelta,
        sheets: packSheets,
      };
    })
  );

  return { sheets, packs };
}

function guessContentType(key: string): string {
  if (key.endsWith('.pdf')) return 'application/pdf';
  if (key.endsWith('.webp')) return 'image/webp';
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) return 'image/jpeg';
  if (key.endsWith('.svg')) return 'image/svg+xml; charset=utf-8';
  return 'application/octet-stream';
}

export async function handleEdgeRequest(
  request: Request,
  env: CloudflareEnv = {}
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    if (path.startsWith('/api/admin/')) {
      return new Response(null, { status: 204 });
    }
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // 0. Cloud Status (tells /admin whether Cloudflare D1 & R2 bindings are live)
  if (path === '/api/cloud-status' && request.method === 'GET') {
    const d1Bound = Boolean(env.DB);
    const r2Bound = Boolean(env.COLORING_BUCKET);
    const pinConfigured = Boolean(env.ADMIN_PIN?.trim());
    let adminClaimed = false;
    if (d1Bound && !pinConfigured) {
      try {
        adminClaimed = Boolean(await getClaimedAdminAuth(env));
      } catch {
        adminClaimed = false;
      }
    }
    return adminJsonResponse({
      d1Bound,
      r2Bound,
      pinConfigured,
      adminClaimed,
      needsFirstRunClaim: (d1Bound || r2Bound) && !pinConfigured && !adminClaimed,
    });
  }

  // 0b. Public Live Catalog Document from Cloudflare D1 (falls back to static catalog.json)
  if (path === '/api/catalog-doc' && request.method === 'GET') {
    const fallbackDoc = rawCatalogJson as StaticCatalogDocument;

    if (env.DB) {
      try {
        await ensureD1Schema(env.DB);
        const row = await env.DB.prepare(
          'SELECT payload, updated_at FROM catalog_state WHERE id = ?'
        )
          .bind('main')
          .first<{ payload: string; updated_at: string }>();

        if (row?.payload) {
          const parsed = JSON.parse(row.payload) as StaticCatalogDocument;
          if (parsed && Array.isArray(parsed.sheets) && Array.isArray(parsed.categories)) {
            return jsonResponse(
              { catalog: parsed, source: 'cloudflare-d1', updatedAt: row.updated_at },
              200,
              { 'Cache-Control': 'no-cache' }
            );
          }
        } else {
          // Seed D1 on first read so subsequent reads & edits operate directly on D1
          await env.DB.prepare(
            `INSERT OR IGNORE INTO catalog_state (id, payload, updated_at)
             VALUES (?, ?, CURRENT_TIMESTAMP)`
          )
            .bind('main', JSON.stringify(fallbackDoc))
            .run();

          return jsonResponse(
            { catalog: fallbackDoc, source: 'cloudflare-d1', seeded: true },
            200,
            { 'Cache-Control': 'no-cache' }
          );
        }
      } catch {
        // Gracefully fall back to bundled static catalog.json
      }
    }

    return jsonResponse(
      { catalog: fallbackDoc, source: 'static-json' },
      200,
      { 'Cache-Control': 'no-cache' }
    );
  }

  // 0c. First-Run Admin PIN Claim (only when ADMIN_PIN secret is unset & D1 is bound & unclaimed)
  if (path === '/api/admin/claim' && request.method === 'POST') {
    if (env.ADMIN_PIN?.trim()) {
      return adminJsonResponse(
        { error: 'Admin PIN is already configured via Cloudflare Secrets.' },
        409
      );
    }
    if (!env.DB) {
      return adminJsonResponse(
        { error: 'Cloudflare D1 database binding (DB) is required to claim an admin PIN.' },
        503
      );
    }

    let body: { pin?: string };
    try {
      body = (await request.json()) as { pin?: string };
    } catch {
      return adminJsonResponse({ error: 'Invalid JSON body.' }, 400);
    }

    const pin = typeof body.pin === 'string' ? body.pin.trim() : '';
    if (pin.length < 6 || pin.length > 64) {
      return adminJsonResponse(
        { error: 'Choose an Admin PIN between 6 and 64 characters.' },
        400
      );
    }

    await ensureD1Schema(env.DB);
    const existing = await getClaimedAdminAuth(env);
    if (existing) {
      return adminJsonResponse(
        { error: 'Admin PIN has already been claimed. Please sign in.' },
        409
      );
    }

    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    const saltHex = bytesToHex(saltBytes);
    const hashHex = await derivePbkdf2HashHex(pin, saltHex);

    await env.DB.prepare(
      `INSERT OR IGNORE INTO admin_auth (id, pin_hash, pin_salt, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
    )
      .bind('primary', hashHex, saltHex)
      .run();

    const stored = await getClaimedAdminAuth(env);
    if (!stored || stored.pin_hash !== hashHex) {
      return adminJsonResponse(
        { error: 'Admin PIN was already claimed by another request.' },
        409
      );
    }

    const session = await issueAdminToken(env);
    return adminJsonResponse({ ok: true, ...session }, 201);
  }

  // 0d. Server-Verified Admin Login (validates against ADMIN_PIN secret or D1 PBKDF2 hash)
  if (path === '/api/admin/login' && request.method === 'POST') {
    let body: { pin?: string };
    try {
      body = (await request.json()) as { pin?: string };
    } catch {
      return adminJsonResponse({ error: 'Invalid JSON body.' }, 400);
    }

    const pin = typeof body.pin === 'string' ? body.pin.trim() : '';
    if (!pin) {
      return adminJsonResponse({ error: 'PIN is required.' }, 400);
    }

    const envPin = env.ADMIN_PIN?.trim();
    if (envPin) {
      const [providedDigest, expectedDigest] = await Promise.all([
        sha256Bytes(pin),
        sha256Bytes(envPin),
      ]);
      if (!constantTimeEqual(providedDigest, expectedDigest)) {
        return adminJsonResponse({ error: 'Incorrect Admin PIN.' }, 401);
      }
      const session = await issueAdminToken(env);
      return adminJsonResponse({ ok: true, ...session });
    }

    if (env.DB) {
      const claimed = await getClaimedAdminAuth(env);
      if (!claimed) {
        return adminJsonResponse(
          { error: 'Admin PIN has not been set up yet.', needsClaim: true },
          403
        );
      }
      const computedHex = await derivePbkdf2HashHex(pin, claimed.pin_salt);
      if (!constantTimeEqual(hexToBytes(computedHex), hexToBytes(claimed.pin_hash))) {
        return adminJsonResponse({ error: 'Incorrect Admin PIN.' }, 401);
      }
      const session = await issueAdminToken(env);
      return adminJsonResponse({ ok: true, ...session });
    }

    return adminJsonResponse(
      { error: 'Cloudflare D1/R2 admin auth is not configured in this environment.' },
      503
    );
  }

  // 0e. Authenticated Save Catalog to Cloudflare D1: PUT /api/admin/catalog
  if (path === '/api/admin/catalog' && request.method === 'PUT') {
    if (!(await verifyAdminBearerToken(request, env))) {
      return adminJsonResponse({ error: 'Unauthorized. Please sign in to /admin.' }, 401);
    }
    if (!env.DB) {
      return adminJsonResponse(
        { error: 'Cloudflare D1 binding (DB) is not attached to this Worker.' },
        503
      );
    }

    const rawText = await request.text();
    if (rawText.length > MAX_CATALOG_BYTES) {
      return adminJsonResponse({ error: 'Catalog payload exceeds 2 MB limit.' }, 413);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return adminJsonResponse({ error: 'Invalid catalog JSON.' }, 400);
    }

    const validated = validateCatalogDocument(parsed);
    if (!validated) {
      return adminJsonResponse(
        { error: 'Catalog payload failed validation (invalid sheet fields or unsafe URL).' },
        400
      );
    }

    await ensureD1Schema(env.DB);
    await env.DB.prepare(
      `INSERT INTO catalog_state (id, payload, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         payload = excluded.payload,
         updated_at = CURRENT_TIMESTAMP`
    )
      .bind('main', JSON.stringify(validated))
      .run();

    return adminJsonResponse({
      ok: true,
      updatedAt: validated.updatedAt,
      sheetCount: validated.sheets.length,
    });
  }

  // 0f. Authenticated Direct Upload to Bound Cloudflare R2: POST /api/admin/upload
  if (path === '/api/admin/upload' && request.method === 'POST') {
    if (!(await verifyAdminBearerToken(request, env))) {
      return adminJsonResponse({ error: 'Unauthorized. Please sign in to /admin.' }, 401);
    }
    if (!env.COLORING_BUCKET) {
      return adminJsonResponse(
        { error: 'Cloudflare R2 binding (COLORING_BUCKET) is not attached to this Worker.' },
        503
      );
    }

    let body: {
      categorySlug?: string;
      slug?: string;
      webpBase64?: string;
      pdfBase64?: string;
    };
    try {
      body = (await request.json()) as {
        categorySlug?: string;
        slug?: string;
        webpBase64?: string;
        pdfBase64?: string;
      };
    } catch {
      return adminJsonResponse({ error: 'Invalid JSON upload payload.' }, 400);
    }

    const categorySlug = (body.categorySlug || 'general').trim().toLowerCase();
    const slug = (body.slug || '').trim().toLowerCase();

    if (!SLUG_RE.test(categorySlug) || !SLUG_RE.test(slug)) {
      return adminJsonResponse(
        { error: 'Invalid category or sheet slug (lowercase letters, numbers, and hyphens only).' },
        400
      );
    }

    const webpBytes = body.webpBase64
      ? decodeBase64Bytes(body.webpBase64, MAX_WEBP_BYTES)
      : null;
    const pdfBytes = body.pdfBase64
      ? decodeBase64Bytes(body.pdfBase64, MAX_PDF_BYTES)
      : null;

    if (!webpBytes || !isValidWebpBytes(webpBytes)) {
      return adminJsonResponse(
        { error: 'Invalid or oversized WebP preview payload (max 3 MB).' },
        400
      );
    }
    if (!pdfBytes || !isValidPdfBytes(pdfBytes)) {
      return adminJsonResponse(
        { error: 'Invalid or oversized PDF payload (max 15 MB).' },
        400
      );
    }

    const webpKey = `webp/${categorySlug}/${slug}.webp`;
    const pdfKey = `pdf/${categorySlug}/${slug}.pdf`;

    await env.COLORING_BUCKET.put(webpKey, webpBytes, {
      httpMetadata: {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    await env.COLORING_BUCKET.put(pdfKey, pdfBytes, {
      httpMetadata: {
        contentType: 'application/pdf',
        cacheControl: 'public, max-age=31536000, immutable',
        contentDisposition: `attachment; filename="colorworld-${slug}.pdf"`,
      },
    });

    const previewWebpUrl = `/cdn/${webpKey}`;
    const pdfUrl = `/cdn/${pdfKey}`;

    return adminJsonResponse({
      ok: true,
      previewWebpUrl,
      pdfUrl,
      pdfLetterUrl: pdfUrl,
      webpKey,
      pdfKey,
    });
  }

  // 1. Cloudflare R2 CDN Proxy Route: GET / HEAD /cdn/*
  if (path.startsWith('/cdn/') && (request.method === 'GET' || request.method === 'HEAD')) {
    const objectKey = path.replace(/^\/cdn\//, '').replace(/^\/+/, '');
    if (!objectKey || objectKey.includes('..') || objectKey.includes('\\')) {
      return jsonResponse({ error: 'Invalid asset path' }, 400);
    }

    // Stream directly from Cloudflare R2 binding if configured & present
    if (env.COLORING_BUCKET) {
      const r2Object = await env.COLORING_BUCKET.get(objectKey);
      if (r2Object && r2Object.body) {
        const headers = new Headers();
        headers.set(
          'Content-Type',
          r2Object.httpMetadata?.contentType || guessContentType(objectKey)
        );
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');
        if (r2Object.httpEtag) {
          headers.set('ETag', r2Object.httpEtag);
        }
        if (objectKey.endsWith('.pdf')) {
          const rawName = objectKey.split('/').pop() || 'coloring-page.pdf';
          const safeFilename = rawName.replace(/[^a-zA-Z0-9._-]/g, '-') || 'coloring-page.pdf';
          headers.set('Content-Disposition', `attachment; filename="${safeFilename}"`);
        }
        return new Response(r2Object.body, { status: 200, headers });
      }
    }

    // Dynamic fallback generator (works for staging & local preview before R2 assets are uploaded)
    const pdfMatch = objectKey.match(/^pdfs\/(a4|letter)\/([a-z0-9-]+)\.pdf$/i);
    if (pdfMatch) {
      const paperSize = pdfMatch[1].toLowerCase() as PaperSize;
      const sheetId = pdfMatch[2];
      const sheet = SEED_SHEETS.find((s) => s.id === sheetId);
      const title = sheet ? sheet.title.en : 'ColorWorld Printable Sheet';
      const pdfBytes = generateColoringPdfBytes(sheetId, title, paperSize);
      const pdfBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;

      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="colorworld-${sheetId}-${paperSize}.pdf"`,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
          'X-ColorWorld-Storage': env.COLORING_BUCKET ? 'r2-fallback-vector' : 'edge-vector-pdf',
        },
      });
    }

    const artMatch = objectKey.match(/^(lineart|thumbs)\/([a-z0-9-]+)\.(svg|png|webp)$/i);
    if (artMatch) {
      const sheetId = artMatch[2];
      const svg = getLineArtSvg(sheetId);
      return new Response(svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return jsonResponse({ error: 'Asset not found in R2 bucket', key: objectKey }, 404);
  }

  // 2. GET /api/catalog?locale=en&category=...&q=...
  if (path === '/api/catalog' && request.method === 'GET') {
    const localeParam = url.searchParams.get('locale') || 'en';
    const locale: Locale = isValidLocale(localeParam) ? localeParam : 'en';
    const category = (url.searchParams.get('category') || '').trim().toLowerCase();
    const query = (url.searchParams.get('q') || '').trim().toLowerCase();

    const { sheets, packs } = await hydrateCatalog(env);

    const filteredPacks = packs.filter((pack) => {
      const matchesCat = !category || category === 'all' || pack.category === category;
      if (!matchesCat) return false;
      if (!query) return true;

      const haystack = [
        getText(pack.title, locale),
        pack.title.en,
        getText(pack.subtitle, locale),
        pack.category,
        ...pack.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    const filteredSheets = sheets.filter((sheet) => {
      const matchesCat = !category || category === 'all' || sheet.category === category;
      if (!matchesCat) return false;
      if (!query) return true;

      const haystack = [
        getText(sheet.title, locale),
        sheet.title.en,
        sheet.category,
        ...sheet.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    const trendingPacks = [...packs]
      .sort((a, b) => b.weeklyGrowthPct - a.weeklyGrowthPct)
      .slice(0, 8);

    const newSheets = [...sheets]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);

    const topSheets = [...sheets]
      .sort(
        (a, b) =>
          b.upvotes - b.downvotes + b.views * 0.02 - (a.upvotes - a.downvotes + a.views * 0.02)
      )
      .map((s, idx) => ({ ...s, rank: idx + 1 }));

    return jsonResponse(
      {
        locale,
        packs: filteredPacks,
        sheets: filteredSheets,
        trendingPacks,
        newSheets,
        topSheets,
        totalSheets: sheets.length,
        totalPacks: packs.length,
        source: env.COLORING_BUCKET || env.DB ? 'cloudflare-r2-d1' : 'local-r2-emulator',
      },
      200,
      { 'Cache-Control': 'public, max-age=60' }
    );
  }

  // 3. GET /api/trending
  if (path === '/api/trending' && request.method === 'GET') {
    const { packs, sheets } = await hydrateCatalog(env);
    const trendingPacks = [...packs]
      .sort((a, b) => b.weeklyGrowthPct - a.weeklyGrowthPct)
      .slice(0, 8);
    const trendingSheets = [...sheets]
      .sort((a, b) => b.weeklyGrowthPct - a.weeklyGrowthPct)
      .slice(0, 8);
    return jsonResponse({ trendingPacks, trendingSheets });
  }

  // 4. GET /api/packs/:slug
  const packMatch = path.match(/^\/api\/packs\/([a-z0-9-]+)$/i);
  if (packMatch && request.method === 'GET') {
    const slug = packMatch[1];
    const { packs } = await hydrateCatalog(env);
    const pack = packs.find((p) => p.slug === slug);
    if (!pack) return jsonResponse({ error: 'Pack not found' }, 404);
    const related = packs.filter((p) => p.slug !== slug).slice(0, 4);
    return jsonResponse({ pack, related });
  }

  // 5. POST /api/sheets/:id/view
  const viewMatch = path.match(/^\/api\/sheets\/([a-z0-9:-]+)\/view$/i);
  if (viewMatch && request.method === 'POST') {
    const id = viewMatch[1];
    const delta = await incrementMetric(env, id, 'viewsDelta');
    const baseSheet = SEED_SHEETS.find((s) => s.id === id);
    const basePack = SEED_PACKS.find((p) => `pack:${p.slug}` === id);
    const baseViews = baseSheet?.views ?? basePack?.views ?? 0;
    return jsonResponse({ id, views: baseViews + delta.viewsDelta });
  }

  // 6. POST /api/sheets/:id/vote
  const voteMatch = path.match(/^\/api\/sheets\/([a-z0-9:-]+)\/vote$/i);
  if (voteMatch && request.method === 'POST') {
    const id = voteMatch[1];
    let direction: 'up' | 'down' = 'up';
    try {
      const body = (await request.json()) as { direction?: string };
      if (body?.direction === 'down') direction = 'down';
    } catch {
      // default up
    }

    const delta = await incrementMetric(
      env,
      id,
      direction === 'up' ? 'upvotesDelta' : 'downvotesDelta'
    );
    const baseSheet = SEED_SHEETS.find((s) => s.id === id);
    const basePack = SEED_PACKS.find((p) => `pack:${p.slug}` === id);

    return jsonResponse({
      id,
      upvotes: (baseSheet?.upvotes ?? basePack?.upvotes ?? 0) + delta.upvotesDelta,
      downvotes: (baseSheet?.downvotes ?? basePack?.downvotes ?? 0) + delta.downvotesDelta,
    });
  }

  if (env.ASSETS) {
    return env.ASSETS.fetch(request);
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

export default {
  async fetch(request: Request, env: CloudflareEnv): Promise<Response> {
    return handleEdgeRequest(request, env);
  },
};
