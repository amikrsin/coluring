import crypto from 'crypto';
import type { Request, Response } from 'express';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

export interface R2CredentialsInput {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  publicBaseUrl?: string;
}

interface ResolvedR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
}

const ACCOUNT_ID_RE = /^[a-zA-Z0-9]{16,64}$/;
const BUCKET_NAME_RE = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
const SAFE_SEGMENT_RE = /^[a-z0-9][a-z0-9-]{0,120}$/;

const MAX_WEBP_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_BYTES = 18 * 1024 * 1024; // 18 MB

function timingSafeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyAdminPinHeader(req: Request): boolean {
  const expectedPin = (
    process.env.ADMIN_PIN ||
    process.env.VITE_ADMIN_PIN ||
    '123456'
  ).trim();
  const provided = String(req.header('x-admin-pin') || '').trim();
  if (!provided || !expectedPin) return false;
  return timingSafeEquals(provided, expectedPin);
}

function normalizePublicBaseUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function resolveR2Config(
  input: R2CredentialsInput
): { config?: ResolvedR2Config; error?: string } {
  const accountId = (input.accountId?.trim() || process.env.R2_ACCOUNT_ID?.trim() || '');
  const accessKeyId = (input.accessKeyId?.trim() || process.env.R2_ACCESS_KEY_ID?.trim() || '');
  const secretAccessKey = (
    input.secretAccessKey?.trim() ||
    process.env.R2_SECRET_ACCESS_KEY?.trim() ||
    ''
  );
  const bucketName = (
    input.bucketName?.trim() ||
    process.env.R2_BUCKET_NAME?.trim() ||
    ''
  ).toLowerCase();
  const rawPublicUrl =
    input.publicBaseUrl?.trim() || process.env.R2_PUBLIC_BASE_URL?.trim() || '';

  if (!accountId || !ACCOUNT_ID_RE.test(accountId)) {
    return {
      error:
        'Invalid or missing Cloudflare R2 Account ID (expected 16–64 alphanumeric characters).',
    };
  }
  if (!accessKeyId || accessKeyId.length < 8 || accessKeyId.length > 128) {
    return { error: 'Invalid or missing R2 Access Key ID.' };
  }
  if (!secretAccessKey || secretAccessKey.length < 16 || secretAccessKey.length > 256) {
    return { error: 'Invalid or missing R2 Secret Access Key.' };
  }
  if (!bucketName || !BUCKET_NAME_RE.test(bucketName)) {
    return {
      error:
        'Invalid or missing R2 Bucket Name (lowercase letters, numbers, dots, and hyphens only).',
    };
  }

  const publicBaseUrl = normalizePublicBaseUrl(rawPublicUrl);
  if (!publicBaseUrl) {
    return {
      error:
        'Invalid or missing Public Custom Domain URL (must start with https://, e.g., https://cdn.yoursite.com).',
    };
  }

  return {
    config: {
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      publicBaseUrl,
    },
  };
}

function createR2Client(config: ResolvedR2Config): S3Client {
  // Strictly construct endpoint from validated alphanumeric accountId to prevent SSRF.
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });
}

function hasValidMagicBytes(kind: 'webp' | 'pdf', buffer: Buffer): boolean {
  if (kind === 'webp') {
    // WebP RIFF header: bytes 0..3 = "RIFF", bytes 8..11 = "WEBP"
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  // PDF header: "%PDF-"
  return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

export function handleR2Status(_req: Request, res: Response): void {
  const serverConfigured = Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET_NAME?.trim() &&
      process.env.R2_PUBLIC_BASE_URL?.trim()
  );

  res.json({
    serverConfigured,
    bucketName: serverConfigured ? process.env.R2_BUCKET_NAME?.trim() : '',
    publicBaseUrl: serverConfigured
      ? normalizePublicBaseUrl(process.env.R2_PUBLIC_BASE_URL || '') || ''
      : '',
  });
}

export async function handleR2Test(req: Request, res: Response): Promise<void> {
  if (!verifyAdminPinHeader(req)) {
    res.status(401).json({ ok: false, error: 'Unauthorized admin session.' });
    return;
  }

  const body = (req.body || {}) as R2CredentialsInput;
  const resolved = resolveR2Config(body);
  if (!resolved.config) {
    res.status(400).json({ ok: false, error: resolved.error });
    return;
  }

  const client = createR2Client(resolved.config);
  try {
    await client.send(new HeadBucketCommand({ Bucket: resolved.config.bucketName }));
    res.json({
      ok: true,
      bucketName: resolved.config.bucketName,
      publicBaseUrl: resolved.config.publicBaseUrl,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to reach Cloudflare R2 bucket.';
    res.status(502).json({
      ok: false,
      error: `Cloudflare R2 connection failed: ${message}`,
    });
  } finally {
    client.destroy();
  }
}

export async function handleR2Upload(req: Request, res: Response): Promise<void> {
  if (!verifyAdminPinHeader(req)) {
    res.status(401).json({ ok: false, error: 'Unauthorized admin session.' });
    return;
  }

  const body = (req.body || {}) as R2CredentialsInput & {
    kind?: string;
    categorySlug?: string;
    slug?: string;
    dataBase64?: string;
  };

  const resolved = resolveR2Config(body);
  if (!resolved.config) {
    res.status(400).json({ ok: false, error: resolved.error });
    return;
  }

  const kind = body.kind === 'webp' || body.kind === 'pdf' ? body.kind : null;
  if (!kind) {
    res.status(400).json({ ok: false, error: 'Invalid upload kind (expected webp or pdf).' });
    return;
  }

  const categorySlug = String(body.categorySlug || '').trim().toLowerCase();
  const slug = String(body.slug || '').trim().toLowerCase();

  if (!SAFE_SEGMENT_RE.test(categorySlug)) {
    res.status(400).json({
      ok: false,
      error: 'Invalid category slug (lowercase letters, numbers, and hyphens only).',
    });
    return;
  }
  if (!SAFE_SEGMENT_RE.test(slug)) {
    res.status(400).json({
      ok: false,
      error: 'Invalid sheet slug (lowercase letters, numbers, and hyphens only).',
    });
    return;
  }

  const rawBase64 = typeof body.dataBase64 === 'string' ? body.dataBase64.trim() : '';
  if (!rawBase64) {
    res.status(400).json({ ok: false, error: 'Missing file payload.' });
    return;
  }

  const strippedBase64 = rawBase64.includes(',')
    ? rawBase64.slice(rawBase64.indexOf(',') + 1)
    : rawBase64;
  const buffer = Buffer.from(strippedBase64, 'base64');

  const maxBytes = kind === 'webp' ? MAX_WEBP_BYTES : MAX_PDF_BYTES;
  if (buffer.length === 0 || buffer.length > maxBytes) {
    res.status(413).json({
      ok: false,
      error: `${kind.toUpperCase()} file exceeds allowed size limit (${Math.round(
        maxBytes / (1024 * 1024)
      )} MB).`,
    });
    return;
  }

  if (!hasValidMagicBytes(kind, buffer)) {
    res.status(400).json({
      ok: false,
      error: `Uploaded file does not match valid ${kind.toUpperCase()} format.`,
    });
    return;
  }

  const objectKey =
    kind === 'webp'
      ? `webp/${categorySlug}/${slug}.webp`
      : `pdf/${categorySlug}/${slug}.pdf`;
  const contentType = kind === 'webp' ? 'image/webp' : 'application/pdf';

  const client = createR2Client(resolved.config);
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: resolved.config.bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    const publicUrl = `${resolved.config.publicBaseUrl}/${objectKey}`;
    res.json({
      ok: true,
      kind,
      key: objectKey,
      url: publicUrl,
      sizeBytes: buffer.length,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Cloudflare R2 upload failed.';
    res.status(502).json({
      ok: false,
      error: `R2 upload failed for ${objectKey}: ${message}`,
    });
  } finally {
    client.destroy();
  }
}
