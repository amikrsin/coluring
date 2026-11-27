# Deploying ColorWorld to Cloudflare Pages, Workers & R2

ColorWorld is architected for zero-cold-start global delivery on **Cloudflare Pages** (frontend SPA + Pages Functions) backed by **Cloudflare R2** (`COLORING_BUCKET`), **Cloudflare D1** (`DB`), and **Cloudflare KV** (`COLORING_KV`).

---

## 1. Prerequisites
- A Cloudflare account with **R2**, **Pages**, and **D1** enabled.
- Node.js 20+ and Wrangler CLI (`npm i -g wrangler` or via `npx wrangler`).
- Authenticate locally:
  ```bash
  npx wrangler login
  ```

---

## 2. Provision Cloudflare R2, D1, and KV

Create the object storage bucket and edge databases referenced in `wrangler.toml`:

```bash
# 1. Create the R2 bucket for PDFs, line-art PNG/SVG, and WebP thumbnails
npx wrangler r2 bucket create colorworld-assets
npx wrangler r2 bucket create colorworld-assets-preview

# 2. Create the D1 database for persistent view counts, votes, and trending scores
npx wrangler d1 create colorworld-db

# 3. Create the KV namespace for fast edge counter caching
npx wrangler kv namespace create COLORING_KV
```

Copy the returned `database_id` and `kv_namespace` `id` into `wrangler.toml`.

---

## 3. Initialize the D1 Database Schema

Apply `schema.sql` to your remote D1 database:

```bash
npx wrangler d1 execute colorworld-db --remote --file=./schema.sql
```

---

## 4. Upload Coloring Assets to Cloudflare R2

The `/cdn/*` Pages Function (`functions/cdn/[[path]].ts` → `workers/api.ts`) maps URLs directly to R2 object keys with `Cache-Control: public, max-age=31536000, immutable`:

| Asset Type | R2 Object Key | Example URL |
|---|---|---|
| A4 Print PDF | `pdfs/a4/{sheetId}.pdf` | `/cdn/pdfs/a4/dino-trex.pdf` |
| US Letter Print PDF | `pdfs/letter/{sheetId}.pdf` | `/cdn/pdfs/letter/dino-trex.pdf` |
| High-Res Line-Art (Color Online) | `lineart/{sheetId}.png` or `.svg` | `/cdn/lineart/dino-trex.svg` |
| Card Thumbnail | `thumbs/{sheetId}.webp` or `.svg` | `/cdn/thumbs/dino-trex.svg` |

Upload individual assets via Wrangler or S3-compatible R2 CLI (`rclone` / `aws s3`):

```bash
npx wrangler r2 object put colorworld-assets/pdfs/a4/dino-trex.pdf --file=./assets/dino-trex-a4.pdf --content-type="application/pdf"
npx wrangler r2 object put colorworld-assets/pdfs/letter/dino-trex.pdf --file=./assets/dino-trex-letter.pdf --content-type="application/pdf"
```

> **Automatic Edge Fallback**: If a requested PDF or line-art key has not been uploaded to R2 yet, `workers/api.ts` automatically generates a crisp A4 or US Letter vector PDF or SVG on the fly so zero links ever return 404 during rollout.

---

## 5. Generate the Multilingual Sitemap & Deploy to Cloudflare Pages

```bash
# Generate public/sitemap.xml covering all 8 locales (/en/, /es/, /fr/, /de/, /pt/, /it/, /nl/, /pl/)
SITE_ORIGIN=https://your-domain.com npm run sitemap

# Build the optimized static React bundle into dist/
npm run build

# Deploy to Cloudflare Pages (automatically deploys functions/api/ and functions/cdn/)
npx wrangler pages deploy dist --project-name=colorworld
```

### Connecting Bindings in the Cloudflare Pages Dashboard
If deploying via GitHub auto-deploys instead of CLI:
1. Open **Cloudflare Dashboard → Workers & Pages → colorworld → Settings → Bindings**.
2. Add **R2 Bucket Binding**: Variable name `COLORING_BUCKET` → `colorworld-assets`.
3. Add **D1 Database Binding**: Variable name `DB` → `colorworld-db`.
4. Add **KV Namespace Binding**: Variable name `COLORING_KV` → your KV namespace.
5. Set **Build command** to `npm run sitemap && npm run build` and **Build output directory** to `dist`.

---

## 6. Edge API Endpoints Reference

- `GET /api/catalog?locale=en&category=dinosaurs&q=trex` — Returns localized packs, sheets, trending collections, new releases, and Top 100 rankings.
- `GET /api/trending` — Returns highest weekly growth packs and sheets.
- `GET /api/packs/:slug` — Returns single pack metadata, sheets, and related collections.
- `POST /api/sheets/:id/view` — Increments view count in D1/KV.
- `POST /api/sheets/:id/vote` — Records upvote/downvote (`{ "direction": "up" | "down" }`).
- `GET /cdn/*` — Streams R2 objects with `Cache-Control: public, max-age=31536000, immutable` and PDF `Content-Disposition` headers.
