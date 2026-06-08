import { neon } from "@neondatabase/serverless";

// Lazy singleton — avoids build-time crash when DATABASE_URL isn't set
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sql: any = null;
function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql(strings, ...values);
}

export type Store = {
  id: number;
  slug: string;
  name: string;
  logo_url: string | null;
  affiliate_url_template: string | null;
};

export type DiaperProduct = {
  id: number;
  store_id: number;
  store_slug: string;
  store_name: string;
  external_id: string;
  product_url: string | null;
  brand: string;
  brand_slug: string;
  line: string | null;
  type: string | null;       // 'belt' | 'pants' | 'swim'
  size_label: string | null;
  weight_min_kg: number | null;
  weight_max_kg: number | null;
  pack_qty: number;
  image_url: string | null;
  price_bdt: number;
  price_per_piece: number;
  original_price_bdt: number | null;
  discount_pct: number | null;
  is_promotion: boolean;
  promotion_label: string | null;
  is_available: boolean;
  last_scraped_at: string | null;
};

export type ProductWithPrices = {
  brand: string;
  brand_slug: string;
  line: string | null;
  type: string | null;
  size_label: string | null;
  weight_min_kg: number | null;
  weight_max_kg: number | null;
  pack_qty: number;
  image_url: string | null;
  prices: {
    store_slug: string;
    store_name: string;
    price_bdt: number;
    price_per_piece: number;
    original_price_bdt: number | null;
    discount_pct: number | null;
    is_promotion: boolean;
    product_url: string | null;
  }[];
};

// --- Query helpers ---

export async function getAllProducts(filters?: {
  brand_slug?: string;
  size_label?: string;
  type?: string;
  sort?: "price_per_piece" | "price_bdt" | "discount_pct";
  store_slug?: string;
}): Promise<DiaperProduct[]> {
  const brand = filters?.brand_slug ?? null;
  const size = filters?.size_label ?? null;
  const type = filters?.type ?? null;
  const store = filters?.store_slug ?? null;
  const sort = filters?.sort ?? "price_per_piece";

  // Neon tagged templates don't support dynamic ORDER BY, so use separate queries
  if (sort === "discount_pct") {
    const rows = await sql`
      SELECT d.*, s.slug as store_slug, s.name as store_name
      FROM diaper_products d JOIN stores s ON s.id = d.store_id
      WHERE d.is_available = TRUE
        AND (${brand}::text IS NULL OR d.brand_slug = ${brand})
        AND (${size}::text IS NULL OR d.size_label = ${size})
        AND (${type}::text IS NULL OR d.type = ${type})
        AND (${store}::text IS NULL OR s.slug = ${store})
      ORDER BY d.discount_pct DESC NULLS LAST LIMIT 200`;
    return rows as DiaperProduct[];
  }
  if (sort === "price_bdt") {
    const rows = await sql`
      SELECT d.*, s.slug as store_slug, s.name as store_name
      FROM diaper_products d JOIN stores s ON s.id = d.store_id
      WHERE d.is_available = TRUE
        AND (${brand}::text IS NULL OR d.brand_slug = ${brand})
        AND (${size}::text IS NULL OR d.size_label = ${size})
        AND (${type}::text IS NULL OR d.type = ${type})
        AND (${store}::text IS NULL OR s.slug = ${store})
      ORDER BY d.price_bdt ASC LIMIT 200`;
    return rows as DiaperProduct[];
  }
  // Default: price_per_piece
  const rows = await sql`
    SELECT d.*, s.slug as store_slug, s.name as store_name
    FROM diaper_products d JOIN stores s ON s.id = d.store_id
    WHERE d.is_available = TRUE
      AND (${brand}::text IS NULL OR d.brand_slug = ${brand})
      AND (${size}::text IS NULL OR d.size_label = ${size})
      AND (${type}::text IS NULL OR d.type = ${type})
      AND (${store}::text IS NULL OR s.slug = ${store})
    ORDER BY d.price_per_piece ASC LIMIT 200`;
  return rows as DiaperProduct[];
}

export async function getBrands(): Promise<{ brand: string; brand_slug: string; count: number }[]> {
  const rows = await sql`
    SELECT brand, brand_slug, COUNT(*)::int as count
    FROM diaper_products
    WHERE is_available = TRUE
    GROUP BY brand, brand_slug
    ORDER BY count DESC
  `;
  return rows as { brand: string; brand_slug: string; count: number }[];
}

export async function getCheapestByBrand(): Promise<{
  brand: string; brand_slug: string; size_label: string;
  min_price_per_piece: number; store_name: string; pack_qty: number;
}[]> {
  const rows = await sql`
    SELECT DISTINCT ON (d.brand_slug, d.size_label)
      d.brand, d.brand_slug, d.size_label,
      d.price_per_piece AS min_price_per_piece,
      s.name AS store_name,
      d.pack_qty
    FROM diaper_products d
    JOIN stores s ON s.id = d.store_id
    WHERE d.is_available = TRUE AND d.size_label IS NOT NULL
    ORDER BY d.brand_slug, d.size_label, d.price_per_piece ASC
  `;
  return rows as any[];
}

export async function getBrandProducts(brand_slug: string): Promise<DiaperProduct[]> {
  const rows = await sql`
    SELECT d.*, s.slug as store_slug, s.name as store_name
    FROM diaper_products d
    JOIN stores s ON s.id = d.store_id
    WHERE d.brand_slug = ${brand_slug} AND d.is_available = TRUE
    ORDER BY d.size_label, d.price_per_piece ASC
  `;
  return rows as DiaperProduct[];
}

export async function getPriceIndex(): Promise<{
  brand: string; size_label: string;
  chaldal_price: number | null;
  meenabazar_price: number | null;
  gobaby_price: number | null;
  shwapno_price: number | null;
  daraz_price: number | null;
  cheapest_store: string;
  cheapest_price: number;
}[]> {
  const rows = await sql`
    SELECT
      d.brand,
      d.size_label,
      MAX(CASE WHEN s.slug = 'chaldal'    THEN d.price_per_piece END) AS chaldal_price,
      MAX(CASE WHEN s.slug = 'meenabazar'  THEN d.price_per_piece END) AS meenabazar_price,
      MAX(CASE WHEN s.slug = 'gobaby'      THEN d.price_per_piece END) AS gobaby_price,
      MAX(CASE WHEN s.slug = 'shwapno'     THEN d.price_per_piece END) AS shwapno_price,
      MAX(CASE WHEN s.slug = 'daraz'       THEN d.price_per_piece END) AS daraz_price,
      MIN(d.price_per_piece) AS cheapest_price,
      (ARRAY_AGG(s.name ORDER BY d.price_per_piece ASC))[1] AS cheapest_store
    FROM diaper_products d
    JOIN stores s ON s.id = d.store_id
    WHERE d.is_available = TRUE AND d.size_label IS NOT NULL
    GROUP BY d.brand, d.size_label
    ORDER BY d.brand, d.size_label
  `;
  return rows as any[];
}

export async function getActiveDeals(): Promise<DiaperProduct[]> {
  const rows = await sql`
    SELECT d.*, s.slug as store_slug, s.name as store_name
    FROM diaper_products d
    JOIN stores s ON s.id = d.store_id
    WHERE d.is_available = TRUE
      AND (d.is_promotion = TRUE OR d.discount_pct >= 5)
    ORDER BY d.discount_pct DESC NULLS LAST
    LIMIT 20
  `;
  return rows as DiaperProduct[];
}

export async function getLastScrapedAt(): Promise<string | null> {
  const rows = await sql`
    SELECT MAX(last_scraped_at)::text AS last_scraped
    FROM diaper_products
    WHERE is_available = TRUE
  `;
  return rows[0]?.last_scraped ?? null;
}
