import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { neon } = await import("@neondatabase/serverless");
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({ error: "DATABASE_URL not set" });
    }

    const sql = neon(dbUrl);

    const stores = await sql`SELECT slug, name FROM stores ORDER BY slug`;
    const productCount = await sql`SELECT COUNT(*)::int as count FROM diaper_products WHERE is_available = TRUE`;
    const sampleProducts = await sql`
      SELECT d.brand, d.size_label, d.price_bdt, d.price_per_piece, d.pack_qty, s.name as store_name
      FROM diaper_products d
      JOIN stores s ON s.id = d.store_id
      WHERE d.is_available = TRUE
      ORDER BY d.price_per_piece ASC
      LIMIT 5
    `;
    const cheapest = await sql`
      SELECT DISTINCT ON (d.brand_slug, d.size_label)
        d.brand, d.brand_slug, d.size_label,
        d.price_per_piece AS min_price_per_piece,
        s.name AS store_name
      FROM diaper_products d
      JOIN stores s ON s.id = d.store_id
      WHERE d.is_available = TRUE AND d.size_label IS NOT NULL
      ORDER BY d.brand_slug, d.size_label, d.price_per_piece ASC
      LIMIT 5
    `;

    return NextResponse.json({
      dbUrlPrefix: dbUrl.substring(0, 30) + "...",
      stores,
      productCount: productCount[0]?.count,
      sampleProducts,
      cheapestByBrand: cheapest,
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error }, { status: 500 });
  }
}
