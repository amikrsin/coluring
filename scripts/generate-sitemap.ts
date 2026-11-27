import fs from 'fs';
import path from 'path';
import { SUPPORTED_LOCALES } from '../src/i18n/translations';
import rawCatalog from '../src/data/catalog.json';

interface CatalogSheetEntry {
  slug: string;
  category: string;
  subcategory?: string;
}

interface CatalogDoc {
  sheets: CatalogSheetEntry[];
}

const ORIGIN = (process.env.SITE_ORIGIN || 'https://colorworld.pages.dev').replace(/\/$/, '');
const TODAY = new Date().toISOString().split('T')[0];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function buildLocalizedUrlEntry(relPath: string, priority: string, changefreq: string): string {
  const cleanRel = relPath.replace(/^\/+/, '');
  const loc = cleanRel ? `${ORIGIN}/en/${cleanRel}` : `${ORIGIN}/en/`;
  const alternates = SUPPORTED_LOCALES.map((l) => {
    const href = cleanRel ? `${ORIGIN}/${l.code}/${cleanRel}` : `${ORIGIN}/${l.code}/`;
    return `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${href}" />`;
  }).join('\n');

  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />
  </url>`;
}

function buildSingleUrlEntry(absPath: string, priority: string, changefreq: string): string {
  const cleanPath = absPath.startsWith('/') ? absPath : `/${absPath}`;
  return `  <url>
    <loc>${ORIGIN}${cleanPath}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function generateSitemap() {
  const catalog = rawCatalog as CatalogDoc;
  const entries: string[] = [];

  // Core localized storefront routes
  for (const seg of ['', 'top', 'trending']) {
    entries.push(buildLocalizedUrlEntry(seg, seg === '' ? '1.0' : '0.8', 'daily'));
  }

  // Populated category & sub-category routes from live catalog.json
  const populatedCategories = new Set<string>();
  const populatedSubcategories = new Set<string>();

  for (const sheet of catalog.sheets) {
    if (sheet.category) {
      populatedCategories.add(sheet.category);
      if (sheet.subcategory) {
        populatedSubcategories.add(`${sheet.category}/${slugify(sheet.subcategory)}`);
      }
    }
  }

  for (const catId of populatedCategories) {
    entries.push(buildLocalizedUrlEntry(`category/${catId}`, '0.9', 'weekly'));
  }

  for (const subPath of populatedSubcategories) {
    entries.push(buildLocalizedUrlEntry(`category/${subPath}`, '0.8', 'weekly'));
  }

  // Individual coloring sheet routes (/page/:slug)
  for (const sheet of catalog.sheets) {
    if (sheet.slug) {
      entries.push(buildSingleUrlEntry(`/page/${sheet.slug}`, '0.85', 'monthly'));
    }
  }

  // Legal & trust pages
  for (const legal of ['/about', '/contact', '/privacy-policy', '/terms-of-use', '/dmca']) {
    entries.push(buildSingleUrlEntry(legal, '0.4', 'yearly'));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;

  const outDir = path.resolve(process.cwd(), 'public');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf-8');
  console.log(`Generated sitemap.xml with ${entries.length} URL entries at ${outPath}`);
}

generateSitemap();
