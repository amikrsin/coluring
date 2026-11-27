import fs from 'fs';
import path from 'path';
import { SUPPORTED_LOCALES } from '../src/i18n/translations';
import { SEED_PACKS } from '../src/data/seed-data';

const ORIGIN = (process.env.SITE_ORIGIN || 'https://colorworld.pages.dev').replace(/\/$/, '');
const TODAY = new Date().toISOString().split('T')[0];

const STATIC_SEGMENTS = ['', 'top', 'trending', 'holidays', 'worksheets', 'calendars', 'teachers'];

function buildUrlEntry(relPath: string, priority: string, changefreq: string): string {
  const loc = `${ORIGIN}/en/${relPath}`.replace(/\/+$/, '/');
  const alternates = SUPPORTED_LOCALES.map((l) => {
    const href = `${ORIGIN}/${l.code}/${relPath}`.replace(/\/+$/, '/');
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

function generateSitemap() {
  const entries: string[] = [];

  for (const seg of STATIC_SEGMENTS) {
    entries.push(buildUrlEntry(seg, seg === '' ? '1.0' : '0.8', 'daily'));
  }

  for (const pack of SEED_PACKS) {
    entries.push(buildUrlEntry(`coloring-pages/${pack.slug}`, '0.9', 'weekly'));
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
  console.log(`Generated multilingual sitemap.xml with ${entries.length} localized URL groups at ${outPath}`);
}

generateSitemap();
