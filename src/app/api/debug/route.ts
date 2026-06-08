import { NextResponse } from "next/server";
import { getCheapestByBrand, getAllProducts, getActiveDeals, getLastScrapedAt } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Test the actual functions used by the homepage
    const [cheapest, allProducts, deals, lastScraped] = await Promise.all([
      getCheapestByBrand().catch((e: Error) => ({ error: e.message })),
      getAllProducts().catch((e: Error) => ({ error: e.message })),
      getActiveDeals().catch((e: Error) => ({ error: e.message })),
      getLastScrapedAt().catch((e: Error) => ({ error: e.message })),
    ]);

    return NextResponse.json({
      cheapestCount: Array.isArray(cheapest) ? cheapest.length : cheapest,
      cheapestSample: Array.isArray(cheapest) ? cheapest.slice(0, 3) : cheapest,
      allProductsCount: Array.isArray(allProducts) ? allProducts.length : allProducts,
      dealsCount: Array.isArray(deals) ? deals.length : deals,
      lastScraped,
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error, stack: e instanceof Error ? e.stack : undefined }, { status: 500 });
  }
}
