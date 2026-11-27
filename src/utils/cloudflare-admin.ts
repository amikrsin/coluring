import { StaticCatalogDocument } from '../types';
import { slugify } from '../data/catalog-store';
import {
  ConvertedColoringAssets,
  R2UploadResult,
  R2UploadStage,
} from './r2-upload';

export interface CloudStatus {
  d1Bound: boolean;
  r2Bound: boolean;
  pinConfigured: boolean;
  adminClaimed: boolean;
  needsFirstRunClaim: boolean;
}

export const DEFAULT_CLOUD_STATUS: CloudStatus = {
  d1Bound: false,
  r2Bound: false,
  pinConfigured: false,
  adminClaimed: false,
  needsFirstRunClaim: false,
};

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export async function fetchCloudStatus(): Promise<CloudStatus> {
  try {
    const res = await fetch('/api/cloud-status', {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return { ...DEFAULT_CLOUD_STATUS };
    const data = (await res.json()) as Partial<CloudStatus>;
    return {
      d1Bound: Boolean(data.d1Bound),
      r2Bound: Boolean(data.r2Bound),
      pinConfigured: Boolean(data.pinConfigured),
      adminClaimed: Boolean(data.adminClaimed),
      needsFirstRunClaim: Boolean(data.needsFirstRunClaim),
    };
  } catch {
    return { ...DEFAULT_CLOUD_STATUS };
  }
}

export async function fetchLiveCatalogFromD1(): Promise<{
  catalog: StaticCatalogDocument;
  source: 'cloudflare-d1' | 'static-json';
} | null> {
  try {
    const res = await fetch('/api/catalog-doc', {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      catalog?: StaticCatalogDocument;
      source?: 'cloudflare-d1' | 'static-json';
    };
    if (
      data.catalog &&
      Array.isArray(data.catalog.sheets) &&
      Array.isArray(data.catalog.categories)
    ) {
      return {
        catalog: data.catalog,
        source: data.source === 'cloudflare-d1' ? 'cloudflare-d1' : 'static-json',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function loginAdminCloud(
  pin: string
): Promise<{ ok: true; token: string; expiresAt: number } | { ok: false; error: string; needsClaim?: boolean }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      token?: string;
      expiresAt?: number;
      error?: string;
      needsClaim?: boolean;
    };
    if (!res.ok || !data.token) {
      return {
        ok: false,
        error: data.error || 'Incorrect Admin PIN.',
        needsClaim: Boolean(data.needsClaim),
      };
    }
    return {
      ok: true,
      token: data.token,
      expiresAt: data.expiresAt || Date.now() + 12 * 60 * 60 * 1000,
    };
  } catch {
    return { ok: false, error: 'Unable to reach Cloudflare Worker login endpoint.' };
  }
}

export async function claimAdminCloudPin(
  pin: string
): Promise<{ ok: true; token: string; expiresAt: number } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/admin/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      token?: string;
      expiresAt?: number;
      error?: string;
    };
    if (!res.ok || !data.token) {
      return { ok: false, error: data.error || 'Unable to set initial Admin PIN.' };
    }
    return {
      ok: true,
      token: data.token,
      expiresAt: data.expiresAt || Date.now() + 12 * 60 * 60 * 1000,
    };
  } catch {
    return { ok: false, error: 'Unable to reach Cloudflare Worker setup endpoint.' };
  }
}

export async function saveCatalogToCloudD1(
  doc: StaticCatalogDocument,
  token: string
): Promise<{ ok: true; updatedAt: string } | { ok: false; error: string; unauthorized?: boolean }> {
  try {
    const res = await fetch('/api/admin/catalog', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(doc),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      updatedAt?: string;
      error?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        error: data.error || 'Failed to save catalog to Cloudflare D1.',
        unauthorized: res.status === 401,
      };
    }
    return {
      ok: true,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { ok: false, error: 'Network error while saving catalog to Cloudflare D1.' };
  }
}

export async function uploadAssetsViaWorkerR2(params: {
  token: string;
  categorySlug: string;
  slug: string;
  assets: ConvertedColoringAssets;
  onStageChange?: (stage: R2UploadStage) => void;
}): Promise<R2UploadResult> {
  const cleanCategory = slugify(params.categorySlug) || 'general';
  const cleanSlug = slugify(params.slug);
  if (!cleanSlug) {
    throw new Error('A valid URL slug is required before uploading to R2.');
  }

  params.onStageChange?.('uploading-webp');
  const webpBase64 = uint8ToBase64(params.assets.webpBytes);
  params.onStageChange?.('uploading-pdf');
  const pdfBase64 = uint8ToBase64(params.assets.pdfBytes);

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      categorySlug: cleanCategory,
      slug: cleanSlug,
      webpBase64,
      pdfBase64,
    }),
  });

  const data = (await res.json()) as {
    ok?: boolean;
    previewWebpUrl?: string;
    pdfUrl?: string;
    pdfLetterUrl?: string;
    webpKey?: string;
    pdfKey?: string;
    error?: string;
  };

  if (!res.ok || !data.previewWebpUrl || !data.pdfUrl) {
    throw new Error(data.error || 'Cloudflare R2 upload failed.');
  }

  params.onStageChange?.('done');
  return {
    previewWebpUrl: data.previewWebpUrl,
    pdfUrl: data.pdfUrl,
    pdfLetterUrl: data.pdfLetterUrl || data.pdfUrl,
    webpKey: data.webpKey || `webp/${cleanCategory}/${cleanSlug}.webp`,
    pdfKey: data.pdfKey || `pdf/${categorySlugSafe(cleanCategory)}/${cleanSlug}.pdf`,
  };
}

function categorySlugSafe(cat: string): string {
  return slugify(cat) || 'general';
}
