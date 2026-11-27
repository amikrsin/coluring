-- Cloudflare D1 Schema for ColorWorld
-- Run with: npx wrangler d1 execute colorworld-db --file=./schema.sql

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
