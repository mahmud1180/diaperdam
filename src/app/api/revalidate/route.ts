import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

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

  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}