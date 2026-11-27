import { SEED_PACKS, SEED_SHEETS } from '../src/data/seed-data';
import { getLineArtSvg } from '../src/data/line-art';
import { generateColoringPdfBytes } from '../src/utils/pdf-generator';
import { getText, isValidLocale } from '../src/i18n/translations';
import { ColoringSheet, Locale, PackWithSheets, PaperSize } from '../src/types';

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

export interface R2BucketLike {
  get(key: string): Promise<R2ObjectBodyLike | null>;
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

export interface CloudflareEnv {
  COLORING_BUCKET?: R2BucketLike;
  COLORING_KV?: KVNamespaceLike;
  DB?: D1DatabaseLike;
  PUBLIC_ORIGIN?: string;
}

interface DynamicMetric {
  viewsDelta: number;
  upvotesDelta: number;
  downvotesDelta: number;
}

// Edge isolate fallback cache when KV/D1 are not yet bound
const memoryMetrics = new Map<string, DynamicMetric>();

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...extraHeaders,
    },
  });
}

async function getMetricDelta(env: CloudflareEnv, id: string): Promise<DynamicMetric> {
  if (env.DB) {
    try {
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

export async function handleEdgeRequest(request: Request, env: CloudflareEnv = {}): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // 1. Cloudflare R2 CDN Proxy Route: GET / HEAD /cdn/*
  if (path.startsWith('/cdn/') && (request.method === 'GET' || request.method === 'HEAD')) {
    const objectKey = path.replace(/^\/cdn\//, '').replace(/^\/+/, '');
    if (!objectKey || objectKey.includes('..')) {
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
        if (r2Object.httpEtag) {
          headers.set('ETag', r2Object.httpEtag);
        }
        if (objectKey.endsWith('.pdf')) {
          const filename = objectKey.split('/').pop() || 'coloring-page.pdf';
          headers.set('Content-Disposition', `attachment; filename="${filename}"`);
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
      .sort((a, b) => b.upvotes - b.downvotes + b.views * 0.02 - (a.upvotes - a.downvotes + a.views * 0.02))
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

  return jsonResponse({ error: 'Not found' }, 404);
}

export default {
  async fetch(request: Request, env: CloudflareEnv): Promise<Response> {
    return handleEdgeRequest(request, env);
  },
};
