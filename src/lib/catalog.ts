// Canonical URL universe for diaperdam.com — single source of truth
// shared by sitemap.ts, generateStaticParams on dynamic routes, and
// the llms.txt / llms-full.txt generator.

export const BRAND_SLUGS = [
  "huggies",
  "mamypoko",
  "molfix",
  "pampers",
  "neocare",
  "bashundhara",
  "avonee",
  "supermom",
  "savlon",
  "aiwibi",
  "happy-nappy",
] as const;

export const SIZE_SLUGS = ["newborn", "s", "m", "l", "xl", "xxl"] as const;

export const STORE_SLUGS = [
  "chaldal",
  "daraz",
  "othoba",
  "shwapno",
  "arogga",
  "meenabazar",
  "unimart",
  "ajkerdeal",
  "gobaby",
  "paikaree",
] as const;
