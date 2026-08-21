import type { MetadataRoute } from "next";
import { BRAND_SLUGS as BRANDS, SIZE_SLUGS as SIZES, STORE_SLUGS as STORES, GUIDE_SLUGS as GUIDES } from "@/lib/catalog";

const BASE = "https://diaperdam.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Brand+size cross-pages (e.g. /brand/huggies/size/m)
  const brandSizePages = BRANDS.flatMap(b =>
    SIZES.map(s => ({ url: `${BASE}/brand/${b}/size/${s}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 }))
  );

  return [
    { url: BASE,               lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/diapers`,  lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/price-index`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/deals`,       lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    ...GUIDES.map(g => ({ url: `${BASE}/guide/${g}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...BRANDS.map(b => ({ url: `${BASE}/brand/${b}`,  lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...brandSizePages,
    ...SIZES.map(s  => ({ url: `${BASE}/size/${s}`,   lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...STORES.map(s => ({ url: `${BASE}/store/${s}`,  lastModified: now, changeFrequency: "daily" as const, priority: 0.6 })),
  ];
}