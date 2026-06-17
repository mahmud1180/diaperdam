import type { MetadataRoute } from "next";
import { BRAND_SLUGS as BRANDS, SIZE_SLUGS as SIZES, STORE_SLUGS as STORES } from "@/lib/catalog";

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
    { url: `${BASE}/guide/newborn-diaper-size`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/guide/diaper-size-chart`,   lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/guide/diaper-rash-prevention`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/guide/belt-vs-pant-diaper`,    lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...BRANDS.map(b => ({ url: `${BASE}/brand/${b}`,  lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...brandSizePages,
    ...SIZES.map(s  => ({ url: `${BASE}/size/${s}`,   lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...STORES.map(s => ({ url: `${BASE}/store/${s}`,  lastModified: now, changeFrequency: "daily" as const, priority: 0.6 })),
  ];
}