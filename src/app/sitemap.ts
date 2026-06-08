import type { MetadataRoute } from "next";

const BASE = "https://diaperdam.com";
const BRANDS = ["huggies","mamypoko","molfix","pampers","neocare","bashundhara","avonee","supermom","savlon","aiwibi","happy-nappy"];
const SIZES  = ["newborn","s","m","l","xl","xxl"];
const STORES = ["chaldal","daraz","othoba","shwapno","arogga","meenabazar","unimart","ajkerdeal","gobaby","paikaree"];

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
    ...BRANDS.map(b => ({ url: `${BASE}/brand/${b}`,  lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...brandSizePages,
    ...SIZES.map(s  => ({ url: `${BASE}/size/${s}`,   lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...STORES.map(s => ({ url: `${BASE}/store/${s}`,  lastModified: now, changeFrequency: "daily" as const, priority: 0.6 })),
  ];
}