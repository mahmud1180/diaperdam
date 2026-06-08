import type { MetadataRoute } from "next";

const BASE = "https://diaperdam.com";
const BRANDS = ["huggies","mamypoko","molfix","pampers","neocare","bashundhara","avonee","supermom","savlon"];
const SIZES  = ["newborn","s","m","l","xl","xxl"];
const STORES = ["chaldal","daraz","othoba","shwapno","arogga","meenabazar","unimart","ajkerdeal","gobaby","paikaree"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: BASE,               lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/diapers`,  lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/price-index`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...BRANDS.map(b => ({ url: `${BASE}/brand/${b}`,  lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...SIZES.map(s  => ({ url: `${BASE}/size/${s}`,   lastModified: now, changeFrequency: "daily" as const, priority: 0.7 })),
    ...STORES.map(s => ({ url: `${BASE}/store/${s}`,  lastModified: now, changeFrequency: "daily" as const, priority: 0.6 })),
  ];
}