-- DiaperDam database schema
-- Neon PostgreSQL (free tier)

CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,       -- 'chaldal', 'daraz', 'othoba', 'shwapno'
  name TEXT NOT NULL,              -- 'Chaldal', 'Daraz', 'Othoba', 'Shwapno'
  base_url TEXT,
  logo_url TEXT,
  affiliate_url_template TEXT,     -- e.g. 'https://daraz.com.bd/{path}?aff=diaperdam'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diaper_products (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id),
  external_id TEXT NOT NULL,       -- store's own product ID or slug
  product_url TEXT,

  -- Product identity
  brand TEXT NOT NULL,             -- 'Huggies', 'MamyPoko', 'Molfix', 'Neocare'
  brand_slug TEXT NOT NULL,        -- 'huggies', 'mamypoko', 'molfix', 'neocare'
  line TEXT,                       -- 'Dry', 'Pants Extra Absorb', 'Premium Belt'
  type TEXT,                       -- 'belt' | 'pants' | 'swim'
  size_label TEXT,                 -- 'Newborn', 'S', 'M', 'L', 'XL', 'XXL'
  weight_min_kg NUMERIC(4,1),
  weight_max_kg NUMERIC(4,1),
  pack_qty INTEGER NOT NULL,       -- number of diapers in pack
  image_url TEXT,

  -- Pricing (hero metric: price_per_piece)
  price_bdt NUMERIC(8,2) NOT NULL,
  price_per_piece NUMERIC(6,2) GENERATED ALWAYS AS (price_bdt / pack_qty) STORED,
  original_price_bdt NUMERIC(8,2), -- pre-discount
  discount_pct NUMERIC(5,1),
  is_promotion BOOLEAN DEFAULT FALSE,
  promotion_label TEXT,

  -- Availability
  is_available BOOLEAN DEFAULT TRUE,
  consecutive_misses INTEGER DEFAULT 0,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, external_id)
);

-- Price history for sparklines + trend data
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES diaper_products(id) ON DELETE CASCADE,
  price_bdt NUMERIC(8,2) NOT NULL,
  price_per_piece NUMERIC(6,2) NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scrape log for monitoring
CREATE TABLE IF NOT EXISTS scrape_log (
  id SERIAL PRIMARY KEY,
  store_slug TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  products_scraped INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  error TEXT,
  status TEXT DEFAULT 'running'  -- 'running' | 'success' | 'error'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_brand_slug ON diaper_products(brand_slug);
CREATE INDEX IF NOT EXISTS idx_products_size_label ON diaper_products(size_label);
CREATE INDEX IF NOT EXISTS idx_products_type ON diaper_products(type);
CREATE INDEX IF NOT EXISTS idx_products_price_per_piece ON diaper_products(price_per_piece) WHERE is_available = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_store ON diaper_products(store_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id, scraped_at DESC);

-- Seed stores
INSERT INTO stores (slug, name, base_url) VALUES
  ('chaldal',  'Chaldal',  'https://chaldal.com'),
  ('daraz',    'Daraz',    'https://www.daraz.com.bd'),
  ('othoba',   'Othoba',   'https://www.othoba.com'),
  ('shwapno',  'Shwapno',  'https://www.shwapno.com'),
  ('arogga',   'Arogga',   'https://www.arogga.com')
ON CONFLICT (slug) DO NOTHING;
