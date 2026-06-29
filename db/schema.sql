-- ─────────────────────────────────────────────────────────────
-- ResaleRadar schema — Aurora PostgreSQL + pgvector.
-- Multimodal (image) embeddings are vector(1024) to match Amazon Titan
-- Multimodal Embeddings (amazon.titan-embed-image-v1). Keep db EMBED_DIM == 1024.
-- Idempotent: safe to re-run (drops + recreates).
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

DROP TABLE IF EXISTS listings        CASCADE;
DROP TABLE IF EXISTS price_watches   CASCADE;
DROP TABLE IF EXISTS valuations      CASCADE;
DROP TABLE IF EXISTS item_embeddings CASCADE;
DROP TABLE IF EXISTS sold_comparables CASCADE;
DROP TABLE IF EXISTS items           CASCADE;
DROP TABLE IF EXISTS users           CASCADE;

-- ── Users ──
CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             TEXT UNIQUE NOT NULL,
    name              TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free','pro','business')),
    scans_this_month  INT DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT now()
);

-- ── Items the user has scanned ──
CREATE TABLE items (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    brand         TEXT,
    category      TEXT,
    condition     TEXT CHECK (condition IN ('new','like_new','good','fair','poor')),
    image_url     TEXT,
    identified_at TIMESTAMPTZ DEFAULT now()
);

-- ── Multimodal (image) embedding per scanned item (pgvector) ──
CREATE TABLE item_embeddings (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id    UUID REFERENCES items(id) ON DELETE CASCADE,
    embedding  vector(1024),   -- Titan Multimodal: image (+ optional caption)
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX item_embeddings_hnsw ON item_embeddings USING hnsw (embedding vector_cosine_ops);

-- ── Sold-listing reference data (the comparables we search against) ──
-- listed_date enables days-to-sell velocity (the originality hook).
-- `source` is honest provenance: 'ebay_api' = live/licensed, 'estimated' = modeled.
CREATE TABLE sold_comparables (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform    TEXT NOT NULL,            -- ebay, poshmark, depop
    source      TEXT NOT NULL DEFAULT 'estimated' CHECK (source IN ('ebay_api','estimated')),
    title       TEXT,
    brand       TEXT,
    category    TEXT,
    condition   TEXT,
    sold_price  NUMERIC(10,2),
    listed_date DATE,
    sold_date   DATE,
    embedding   vector(1024)
);
CREATE INDEX sold_comparables_hnsw ON sold_comparables USING hnsw (embedding vector_cosine_ops);
CREATE INDEX sold_comparables_category ON sold_comparables (category);

-- ── Valuation results per item (one row per platform) ──
CREATE TABLE valuations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id           UUID REFERENCES items(id) ON DELETE CASCADE,
    platform          TEXT,
    source            TEXT,
    low_price         NUMERIC(10,2),
    median_price      NUMERIC(10,2),
    high_price        NUMERIC(10,2),
    recommended_price NUMERIC(10,2),
    avg_days_to_sell  NUMERIC(6,1),
    velocity_score    NUMERIC(10,3),       -- $/day = median / days-to-sell
    comparables_count INT,
    is_best           BOOLEAN DEFAULT false,
    valued_at         TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX valuations_item ON valuations (item_id);

-- ── Price tracking watchlist ──
CREATE TABLE price_watches (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id      UUID REFERENCES items(id) ON DELETE CASCADE,
    target_price NUMERIC(10,2),
    created_at   TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, item_id)
);

-- ── Generated listings ──
CREATE TABLE listings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id         UUID REFERENCES items(id) ON DELETE CASCADE,
    best_platform   TEXT,
    title           TEXT,
    description     TEXT,
    suggested_price NUMERIC(10,2),
    est_days_to_sell INT,
    generated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX listings_item ON listings (item_id);
