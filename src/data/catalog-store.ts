import rawCatalogJson from './catalog.json';
import { SEED_PACKS, SEED_SHEETS } from './seed-data';
import {
  AdminCatalogSheet,
  CatalogResponse,
  CategoryId,
  ColoringSheet,
  Locale,
  PackWithSheets,
  StaticCatalogDocument,
} from '../types';

export const ADMIN_CATALOG_STORAGE_KEY = 'colorworld_admin_catalog_v1';

const LIVE_CATALOG: StaticCatalogDocument = rawCatalogJson as StaticCatalogDocument;

const KNOWN_CATEGORIES: Set<string> = new Set([
  'animals',
  'dinosaurs',
  'fantasy',
  'space',
  'vehicles',
  'holidays',
  'mandalas',
  'worksheets',
  'calendars',
  'teachers',
]);

export function getLiveCatalogDocument(): StaticCatalogDocument {
  return JSON.parse(JSON.stringify(LIVE_CATALOG)) as StaticCatalogDocument;
}

export function loadCatalogDocument(): StaticCatalogDocument {
  try {
    const raw = localStorage.getItem(ADMIN_CATALOG_STORAGE_KEY);
    if (!raw) return getLiveCatalogDocument();
    const parsed = JSON.parse(raw) as Partial<StaticCatalogDocument>;
    if (!parsed || !Array.isArray(parsed.sheets) || !Array.isArray(parsed.categories)) {
      return getLiveCatalogDocument();
    }
    return {
      version: parsed.version || LIVE_CATALOG.version,
      updatedAt: parsed.updatedAt || LIVE_CATALOG.updatedAt,
      defaultR2BaseUrl: parsed.defaultR2BaseUrl || LIVE_CATALOG.defaultR2BaseUrl,
      categories: parsed.categories,
      holidayTicker: Array.isArray(parsed.holidayTicker)
        ? parsed.holidayTicker
        : LIVE_CATALOG.holidayTicker,
      sheets: parsed.sheets,
    };
  } catch {
    return getLiveCatalogDocument();
  }
}

export function saveCatalogDocument(doc: StaticCatalogDocument): void {
  try {
    localStorage.setItem(ADMIN_CATALOG_STORAGE_KEY, JSON.stringify(doc));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function resetCatalogDocument(): StaticCatalogDocument {
  localStorage.removeItem(ADMIN_CATALOG_STORAGE_KEY);
  return getLiveCatalogDocument();
}

function canonicalPayload(doc: StaticCatalogDocument): string {
  return JSON.stringify({
    defaultR2BaseUrl: doc.defaultR2BaseUrl,
    categories: doc.categories,
    holidayTicker: doc.holidayTicker,
    sheets: doc.sheets,
  });
}

const LIVE_CANONICAL = canonicalPayload(LIVE_CATALOG);

export function hasUnsavedCatalogChanges(doc: StaticCatalogDocument): boolean {
  return canonicalPayload(doc) !== LIVE_CANONICAL;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function generateR2Links(
  baseUrl: string,
  filename: string,
  mode: 'flat' | 'structured' = 'flat'
): {
  previewWebpUrl: string;
  pdfUrl: string;
  pdfLetterUrl: string;
  lineArtUrl: string;
} {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '') || 'https://cdn.yoursite.com';
  const cleanName = filename
    .trim()
    .replace(/\.(webp|png|jpg|jpeg|svg|pdf)$/i, '')
    .replace(/^\/+/, '');

  const safeFile = slugify(cleanName) || 'coloring-page';

  if (mode === 'structured') {
    return {
      previewWebpUrl: `${cleanBase}/thumbnails/${safeFile}.webp`,
      pdfUrl: `${cleanBase}/pdfs/a4/${safeFile}.pdf`,
      pdfLetterUrl: `${cleanBase}/pdfs/letter/${safeFile}.pdf`,
      lineArtUrl: `${cleanBase}/lineart/${safeFile}.png`,
    };
  }

  return {
    previewWebpUrl: `${cleanBase}/${safeFile}.webp`,
    pdfUrl: `${cleanBase}/${safeFile}.pdf`,
    pdfLetterUrl: `${cleanBase}/${safeFile}.pdf`,
    lineArtUrl: `${cleanBase}/${safeFile}.webp`,
  };
}

export function downloadCatalogJson(doc: StaticCatalogDocument): void {
  const output: StaticCatalogDocument = {
    ...doc,
    updatedAt: new Date().toISOString(),
  };
  const json = JSON.stringify(output, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'catalog.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Converts the local-first Admin StaticCatalogDocument into the full storefront
 * CatalogResponse so edits in /admin immediately reflect across all public routes.
 */
export function buildStorefrontCatalog(
  doc: StaticCatalogDocument,
  locale: Locale
): CatalogResponse {
  const seedSheetMap = new Map(SEED_SHEETS.map((s) => [s.id, s]));

  const sheets: ColoringSheet[] = doc.sheets.map((item) => {
    const existingSeed = seedSheetMap.get(item.id) || seedSheetMap.get(item.slug);
    const safeCategory = (
      KNOWN_CATEGORIES.has(item.category) ? item.category : item.category
    ) as CategoryId;

    const isRemotePdf =
      item.sourcePdfUrl ||
      (item.pdfUrl &&
        item.pdfUrl.endsWith('.pdf') &&
        !item.pdfUrl.startsWith('/cdn/pdfs/'));

    return {
      id: item.slug || item.id,
      packSlug: item.packSlug || slugify(item.category) || 'general',
      title: existingSeed
        ? { ...existingSeed.title, en: item.title }
        : { en: item.title },
      description: existingSeed
        ? { ...existingSeed.description, en: item.seoDescription }
        : { en: item.seoDescription },
      category: safeCategory,
      subcategory: item.subcategory,
      difficulty: item.difficulty,
      ageRange: item.ageRange || '4–10 yrs',
      tags: item.tags,
      views: item.views,
      upvotes: item.upvotes,
      downvotes: item.downvotes,
      weeklyGrowthPct: item.isTrending
        ? Math.max(180, item.weeklyGrowthPct || 220)
        : item.weeklyGrowthPct || 65,
      isNew: true,
      isTrending: item.isTrending,
      isHot: item.isHot,
      createdAt: item.createdAt || new Date().toISOString().split('T')[0],
      thumbnailUrl: item.previewWebpUrl,
      lineArtUrl: item.lineArtUrl || item.previewWebpUrl,
      sourcePdfUrl: isRemotePdf ? item.sourcePdfUrl || item.pdfUrl : undefined,
      pdfUrls: {
        a4: item.pdfUrl,
        letter: item.pdfLetterUrl || item.pdfUrl,
      },
    };
  });

  const sheetsByPack = new Map<string, ColoringSheet[]>();
  const sheetsByCat = new Map<string, ColoringSheet[]>();
  for (const s of sheets) {
    const packList = sheetsByPack.get(s.packSlug) || [];
    packList.push(s);
    sheetsByPack.set(s.packSlug, packList);

    const catList = sheetsByCat.get(s.category) || [];
    catList.push(s);
    sheetsByCat.set(s.category, catList);
  }

  // Hydrate existing SEED_PACKS with updated sheets + append auto-packs for new custom categories/packs
  const packs: PackWithSheets[] = [];
  const usedPackSlugs = new Set<string>();

  for (const seedPack of SEED_PACKS) {
    const matched = sheetsByPack.get(seedPack.slug) || [];
    const fallbackById = seedPack.sheetIds
      .map((id) => sheets.find((s) => s.id === id))
      .filter((s): s is ColoringSheet => Boolean(s));

    const combinedMap = new Map<string, ColoringSheet>();
    matched.forEach((s) => combinedMap.set(s.id, s));
    fallbackById.forEach((s) => combinedMap.set(s.id, s));
    const packSheets = Array.from(combinedMap.values());

    if (packSheets.length > 0) {
      usedPackSlugs.add(seedPack.slug);
      const hasHotSheet = packSheets.some((s) => s.isHot);
      const maxGrowth = Math.max(
        seedPack.weeklyGrowthPct,
        ...packSheets.map((s) => s.weeklyGrowthPct)
      );
      packs.push({
        ...seedPack,
        isHot: seedPack.isHot || hasHotSheet,
        weeklyGrowthPct: maxGrowth,
        sheetIds: packSheets.map((s) => s.id),
        sheets: packSheets,
      });
    }
  }

  // Create collections for any newly added custom packSlugs from Admin CRUD / Bulk Import
  for (const [packSlug, packSheets] of sheetsByPack.entries()) {
    if (usedPackSlugs.has(packSlug) || packSheets.length === 0) continue;
    const lead = packSheets[0];
    const catMeta = doc.categories.find((c) => c.id === lead.category);
    const label =
      catMeta?.label ||
      packSlug
        .split('-')
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
        .join(' ');
    packs.push({
      slug: packSlug,
      title: { en: `${label} Coloring Pages` },
      subtitle: {
        en: `${packSheets.length} printable sheets in ${label}${lead.subcategory ? ` · ${lead.subcategory}` : ''}`,
      },
      seoIntro: {
        en:
          lead.description.en ||
          `Free printable ${label} coloring pages in A4 and US Letter PDF formats.`,
      },
      category: lead.category,
      tags: Array.from(new Set(packSheets.flatMap((s) => s.tags))).slice(0, 8),
      views: packSheets.reduce((acc, s) => acc + s.views, 0),
      upvotes: packSheets.reduce((acc, s) => acc + s.upvotes, 0),
      downvotes: packSheets.reduce((acc, s) => acc + s.downvotes, 0),
      weeklyGrowthPct: Math.max(...packSheets.map((s) => s.weeklyGrowthPct), 120),
      isHot: packSheets.some((s) => s.isHot),
      createdAt: lead.createdAt,
      sheetIds: packSheets.map((s) => s.id),
      sheets: packSheets,
    });
  }

  const trendingPacks = [...packs]
    .sort((a, b) => {
      const aHot = a.sheets.some((s) => s.isTrending || s.isHot) ? 1 : 0;
      const bHot = b.sheets.some((s) => s.isTrending || s.isHot) ? 1 : 0;
      if (bHot !== aHot) return bHot - aHot;
      return b.weeklyGrowthPct - a.weeklyGrowthPct;
    })
    .slice(0, 8);

  const newSheets = [...sheets]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);

  const topSheets = [...sheets]
    .sort((a, b) => {
      const aScore = a.upvotes - a.downvotes + a.views * 0.02 + (a.isHot ? 1500 : 0);
      const bScore = b.upvotes - b.downvotes + b.views * 0.02 + (b.isHot ? 1500 : 0);
      return bScore - aScore;
    })
    .map((s, idx) => ({ ...s, rank: idx + 1 }));

  return {
    locale,
    packs,
    sheets,
    trendingPacks,
    newSheets,
    topSheets,
    totalSheets: sheets.length,
    totalPacks: packs.length,
    source: 'local-r2-emulator',
  };
}

/**
 * RFC-4180 compliant CSV parser for pasting 50-500 rows from Python scripts or Excel
 */
function parseCsvLines(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field.trim());
        field = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(field.trim());
        if (row.some((cell) => cell.length > 0)) rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        row.push(field.trim());
        if (row.some((cell) => cell.length > 0)) rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

function parseBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === 'y';
  }
  return false;
}

function normalizeDifficulty(val: unknown): 'easy' | 'medium' | 'detailed' {
  const s = String(val || '').trim().toLowerCase();
  if (s === 'medium' || s === 'intermediate') return 'medium';
  if (s === 'detailed' || s === 'hard' || s === 'complex') return 'detailed';
  return 'easy';
}

export interface BulkImportParsedItem {
  sheet: AdminCatalogSheet;
  isDuplicateExisting: boolean;
  isDuplicateInBatch: boolean;
}

export interface BulkImportResult {
  format: 'json' | 'csv' | 'unknown';
  items: BulkImportParsedItem[];
  error?: string;
}

export function parseBulkImportInput(
  rawText: string,
  existingSlugs: Set<string>,
  defaultR2BaseUrl: string
): BulkImportResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { format: 'unknown', items: [] };
  }

  let rawObjects: Record<string, unknown>[] = [];
  let format: 'json' | 'csv' = 'csv';

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    format = 'json';
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        rawObjects = parsed;
      } else if (parsed && Array.isArray(parsed.sheets)) {
        rawObjects = parsed.sheets;
      } else {
        return {
          format: 'json',
          items: [],
          error: 'JSON must be an array of coloring page objects (or an object with a "sheets" array).',
        };
      }
    } catch (err) {
      return {
        format: 'json',
        items: [],
        error: `Invalid JSON syntax: ${err instanceof Error ? err.message : 'parse error'}`,
      };
    }
  } else {
    format = 'csv';
    const rows = parseCsvLines(trimmed);
    if (rows.length < 2) {
      return {
        format: 'csv',
        items: [],
        error: 'CSV needs a header row plus at least one data row (e.g. title,slug,category,subcategory,difficulty,previewWebpUrl,pdfUrl,tags).',
      };
    }
    const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    rawObjects = rows.slice(1).map((cols) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] ?? '';
      });
      return obj;
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const seenInBatch = new Set<string>();
  const items: BulkImportParsedItem[] = [];

  for (const raw of rawObjects) {
    // Normalize keys case-insensitively
    const map: Record<string, unknown> = {};
    Object.entries(raw).forEach(([k, v]) => {
      map[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = v;
    });

    const title = String(map.title || map.name || '').trim();
    const rawSlug = String(map.slug || map.id || '').trim();
    const slug = slugify(rawSlug || title);
    if (!title && !slug) continue;

    const finalTitle = title || slug.replace(/-/g, ' ');
    const category = slugify(String(map.category || 'animals')) || 'animals';
    const subcategory = String(map.subcategory || map.subcat || 'General').trim() || 'General';
    const packSlug = slugify(String(map.packslug || map.pack || category)) || category;

    const generated = generateR2Links(defaultR2BaseUrl, slug, 'flat');
    const previewWebpUrl =
      String(map.previewwebpurl || map.thumbnailurl || map.webp || map.image || '').trim() ||
      generated.previewWebpUrl;
    const pdfUrl =
      String(map.pdfurl || map.pdf || map.pdfa4 || '').trim() || generated.pdfUrl;

    const rawTags = map.tags;
    const tags = Array.isArray(rawTags)
      ? rawTags.map((t) => String(t).trim()).filter(Boolean)
      : String(rawTags || '')
          .split(/[;|,]/)
          .map((t) => t.trim())
          .filter(Boolean);

    const isTrending = parseBool(map.istrending ?? map.trending);
    const isHot = parseBool(map.ishot ?? map.hot);

    const sheet: AdminCatalogSheet = {
      id: slug,
      slug,
      packSlug,
      title: finalTitle,
      category,
      subcategory,
      difficulty: normalizeDifficulty(map.difficulty),
      ageRange: String(map.agerange || '4–10 yrs').trim() || '4–10 yrs',
      isTrending,
      isHot,
      previewWebpUrl,
      pdfUrl,
      pdfLetterUrl: String(map.pdfletterurl || '').trim() || pdfUrl,
      lineArtUrl: String(map.linearturl || '').trim() || previewWebpUrl,
      seoDescription:
        String(map.seodescription || map.description || '').trim() ||
        `Free printable ${finalTitle} coloring page in A4 and US Letter PDF.`,
      tags: tags.length > 0 ? tags : [category, slug],
      views: Number(map.views) || 120,
      upvotes: Number(map.upvotes) || 15,
      downvotes: Number(map.downvotes) || 0,
      weeklyGrowthPct: Number(map.weeklygrowthpct) || (isTrending ? 210 : 85),
      createdAt: String(map.createdat || today).trim() || today,
    };

    items.push({
      sheet,
      isDuplicateExisting: existingSlugs.has(slug),
      isDuplicateInBatch: seenInBatch.has(slug),
    });
    seenInBatch.add(slug);
  }

  return { format, items };
}
