-- Cloudflare D1 Schema for ColorWorld
-- Tables are also auto-created on first Worker request, or you can apply manually:
-- npx wrangler d1 execute colorworld-db --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS catalog_state (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_auth (
  id TEXT PRIMARY KEY,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sheet_metrics (
  id TEXT PRIMARY KEY,
  views_delta INTEGER NOT NULL DEFAULT 0,
  upvotes_delta INTEGER NOT NULL DEFAULT 0,
  downvotes_delta INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_trending (
  sheet_id TEXT NOT NULL,
  day TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (sheet_id, day)
);

CREATE INDEX IF NOT EXISTS idx_daily_trending_day ON daily_trending (day);
