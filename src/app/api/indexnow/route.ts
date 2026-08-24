/**
 * IndexNow API route for DiaperDam
 *
 * GET  /api/indexnow         — ping ALL sitemap URLs to Bing
 * POST /api/indexnow         — ping specific URLs (body: { urls: string[] })
 */
import { NextRequest, NextResponse } from "next/server";
import { STORE_SLUGS, BRAND_SLUGS, SIZE_SLUGS, GUIDE_SLUGS } from "@/lib/catalog";

const HOST = "diaperdam.com";
const INDEXNOW_KEY = "c01d5d4facfef8f9321a7e832e485eba";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;
const BING_ENDPOINT = "https://www.bing.com/indexnow";

// All URLs we want indexed. Every list is derived from catalog.ts, the same
// source sitemap.ts reads, so the two cannot drift apart. They did twice: the
// store list kept four dead stores after 2026-08-12, and the brand list sat at
// 9 after aiwibi and happy-nappy were added, so both were silently unpinged.
const ALL_URLS = [
  `https://${HOST}/`,
  `https://${HOST}/diapers`,
  `https://${HOST}/price-index`,
  `https://${HOST}/deals`,
  // Guides
  ...GUIDE_SLUGS.map(g => `https://${HOST}/guide/${g}`),
  // Brands
  ...BRAND_SLUGS.map(b => `https://${HOST}/brand/${b}`),
  // Brand x size — the longest-tail pages on the site and the ones that match
  // queries like "হাগিস L সাইজ দাম". sitemap.ts has emitted all 72 of these
  // since launch; this file never listed them, so not one had ever been
  // submitted to Bing until 2026-08-24. The comment above about the lists
  // deriving from catalog.ts was true and still missed an entire route, so
  // check this file against sitemap.ts route-by-route, not list-by-list.
  ...BRAND_SLUGS.flatMap(b => SIZE_SLUGS.map(s => `https://${HOST}/brand/${b}/size/${s}`)),
  // Sizes
  ...SIZE_SLUGS.map(s => `https://${HOST}/size/${s}`),
  // Stores — read from catalog.ts so this list cannot drift out of sync with
  // the sitemap the way the hardcoded copy did (it kept four dead stores).
  ...STORE_SLUGS.map(s => `https://${HOST}/store/${s}`),
];

async function pingUrls(urls: string[]): Promise<{ ok: boolean; status: number; body: string }> {
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls.slice(0, 10000), // Bing max
  };

  const res = await fetch(BING_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const body = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, body };
}

export async function GET() {
  try {
    const result = await pingUrls(ALL_URLS);
    return NextResponse.json({
      success: result.ok,
      urlsSubmitted: ALL_URLS.length,
      bingStatus: result.status,
      bingResponse: result.body || "ok",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const urls: string[] = Array.isArray(body.urls) ? body.urls : ALL_URLS;

    const result = await pingUrls(urls);
    return NextResponse.json({
      success: result.ok,
      urlsSubmitted: urls.length,
      bingStatus: result.status,
      bingResponse: result.body || "ok",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
