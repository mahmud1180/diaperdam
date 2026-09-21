import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import sitemap from "@/app/sitemap";

// Called by GitHub Actions after each scrape to bust ISR cache
export async function POST(req: NextRequest) {
  const token = req.headers.get("x-revalidate-token");
  if (token !== process.env.REVALIDATE_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidatePath("/");
  revalidatePath("/diapers");
  revalidatePath("/price-index");
  revalidatePath("/deals");
  revalidatePath("/brand/[slug]", "page");
  revalidatePath("/brand/[slug]/size/[size]", "page");
  revalidatePath("/size/[size]", "page");
  revalidatePath("/store/[slug]", "page");

  // The sitemap carries MAX(last_scraped_at) as the lastmod for every price
  // page, so it is stale the moment a scrape lands and has to be busted too.
  revalidatePath("/sitemap.xml");

  // Guides render live price tables too, so they go stale after a scrape the
  // same way the listing pages do. Each guide is its own static route, so they
  // are read off the sitemap rather than hand-listed here and forgotten.
  const guidePaths = (await sitemap())
    .map(entry => new URL(entry.url).pathname)
    .filter(path => path.startsWith("/guide/"));
  guidePaths.forEach(path => revalidatePath(path));

  return NextResponse.json({
    revalidated: true,
    guides: guidePaths.length,
    at: new Date().toISOString(),
  });
}