import type { MetadataRoute } from "next";
import { BRAND_SLUGS as BRANDS, SIZE_SLUGS as SIZES, STORE_SLUGS as STORES, GUIDE_SLUGS as GUIDES } from "@/lib/catalog";
import { getLastScrapedAt } from "@/lib/db";

const BASE = "https://diaperdam.com";

// Refresh the prerendered sitemap on the same cadence as the pages it lists,
// so the scrape timestamp below doesn't freeze at whatever it was on deploy day.
export const revalidate = 3600;

/**
 * Every URL here used to carry `lastModified: new Date()` — build time. That is
 * a claim that all 136 pages changed the moment Vercel built, which is false for
 * the 28 guides (hand-written, edited weeks apart) and only accidentally true for
 * the price pages. Google reads a sitemap where every lastmod is identical and
 * equal to the fetch time as unreliable and stops trusting the file's dates,
 * which is how the same bug suppressed crawl on beshii, dhumdham and voordly.
 *
 * Two honest sources replace it:
 *   - price-driven pages  -> MAX(last_scraped_at) from the products table
 *   - guides              -> the date that guide's page.tsx was last committed
 *
 * When the DB is unreachable the price pages emit NO lastmod at all. "No claim"
 * is a valid sitemap; a hardcoded stand-in date would just be the same lie with
 * a different number.
 */
const GUIDE_LASTMOD: Record<string, string> = {
  "belt-vs-pant-diaper": "2026-07-27",
  "belt-vs-pant-price-gap-by-brand": "2026-07-27",
  "best-diaper-brands-bangladesh": "2026-08-26",
  "best-store-by-diaper-brand-bangladesh": "2026-08-24",
  "brand-size-availability-bangladesh": "2026-08-24",
  "budget-local-diaper-brands-bangladesh": "2026-08-21",
  "cheapest-diaper-store-bangladesh": "2026-08-12",
  "cloth-vs-disposable-bangladesh": "2026-06-26",
  "diaper-allergy-sensitive-skin": "2026-06-29",
  "diaper-budget-monthly": "2026-07-31",
  "diaper-count-per-day": "2026-07-10",
  "diaper-discount-frequency-by-store-bangladesh": "2026-08-12",
  "diaper-overnight-leak": "2026-07-08",
  "diaper-pack-size-price-trap": "2026-08-28",
  "diaper-rash-prevention": "2026-08-12",
  "diaper-rash-treatment": "2026-06-29",
  "diaper-size-by-weight": "2026-08-21",
  "diaper-size-chart": "2026-08-12",
  "diaper-size-transition-timing": "2026-08-21",
  "diaper-swimming": "2026-07-03",
  "diaper-travel-tips": "2026-07-01",
  "huggies-vs-pampers-bangladesh": "2026-07-20",
  "local-vs-imported-diaper-brands-bangladesh": "2026-07-20",
  "mamypoko-vs-molfix-bangladesh": "2026-07-20",
  "newborn-diaper-size": "2026-08-12",
  "night-diaper": "2026-07-08",
  "pack-size-trap-by-brand-bangladesh": "2026-08-28",
  "store-switching-savings-bangladesh": "2026-08-05",
};

// A guide added after this map was written falls through to `undefined`, which
// omits lastmod for that one URL rather than stamping it with today's date.
function guideDate(slug: string): Date | undefined {
  const d = GUIDE_LASTMOD[slug];
  return d ? new Date(`${d}T00:00:00Z`) : undefined;
}

// The /guide hub genuinely changes when any guide under it changes.
function guideHubDate(): Date | undefined {
  const dates = GUIDES.map(guideDate).filter((d): d is Date => d instanceof Date);
  if (dates.length === 0) return undefined;
  return new Date(Math.max(...dates.map(d => d.getTime())));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let priced: Date | undefined;
  try {
    const scraped = await getLastScrapedAt();
    if (scraped) {
      const d = new Date(scraped);
      if (!Number.isNaN(d.getTime())) priced = d;
    }
  } catch {
    // DATABASE_URL missing or Neon unreachable at build — ship without a date
    // rather than failing the build or inventing one.
    priced = undefined;
  }

  // Brand+size cross-pages (e.g. /brand/huggies/size/m)
  const brandSizePages = BRANDS.flatMap(b =>
    SIZES.map(s => ({ url: `${BASE}/brand/${b}/size/${s}`, lastModified: priced, changeFrequency: "daily" as const, priority: 0.7 }))
  );

  return [
    { url: BASE,                  lastModified: priced, changeFrequency: "daily",  priority: 1.0 },
    { url: `${BASE}/diapers`,     lastModified: priced, changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE}/price-index`, lastModified: priced, changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE}/deals`,       lastModified: priced, changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE}/guide`,       lastModified: guideHubDate(), changeFrequency: "weekly", priority: 0.8 },
    ...GUIDES.map(g => ({ url: `${BASE}/guide/${g}`, lastModified: guideDate(g), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...BRANDS.map(b => ({ url: `${BASE}/brand/${b}`,  lastModified: priced, changeFrequency: "daily" as const, priority: 0.8 })),
    ...brandSizePages,
    ...SIZES.map(s  => ({ url: `${BASE}/size/${s}`,   lastModified: priced, changeFrequency: "daily" as const, priority: 0.7 })),
    ...STORES.map(s => ({ url: `${BASE}/store/${s}`,  lastModified: priced, changeFrequency: "daily" as const, priority: 0.6 })),
  ];
}
