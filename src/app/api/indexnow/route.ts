/**
 * IndexNow API route for DiaperDam
 *
 * GET  /api/indexnow         — ping ALL sitemap URLs to Bing
 * POST /api/indexnow         — ping specific URLs (body: { urls: string[] })
 */
import { NextRequest, NextResponse } from "next/server";

const HOST = "diaperdam.com";
const INDEXNOW_KEY = "c01d5d4facfef8f9321a7e832e485eba";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;
const BING_ENDPOINT = "https://www.bing.com/indexnow";

// All URLs we want indexed — mirrors sitemap.ts
const ALL_URLS = [
  `https://${HOST}/`,
  `https://${HOST}/diapers`,
  `https://${HOST}/price-index`,
  `https://${HOST}/deals`,
  // Guides
  ...["newborn-diaper-size","diaper-size-chart","diaper-rash-prevention","belt-vs-pant-diaper","night-diaper","diaper-size-by-weight","best-diaper-brands-bangladesh","diaper-rash-treatment","diaper-count-per-day","cloth-vs-disposable-bangladesh","diaper-allergy-sensitive-skin","diaper-travel-tips","diaper-swimming","diaper-overnight-leak"]
    .map(g => `https://${HOST}/guide/${g}`),
  // Brands
  ...["huggies","mamypoko","molfix","pampers","neocare","bashundhara","avonee","supermom","savlon"]
    .map(b => `https://${HOST}/brand/${b}`),
  // Sizes
  ...["newborn","s","m","l","xl","xxl"].map(s => `https://${HOST}/size/${s}`),
  // Stores
  ...["chaldal","daraz","othoba","shwapno","arogga","ajkerdeal","gobaby","paikaree","meenabazar","unimart"]
    .map(s => `https://${HOST}/store/${s}`),
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
