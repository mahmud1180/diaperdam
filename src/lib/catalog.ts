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

// Only stores we actually hold price data for. Four more were listed here
// until 2026-08-12 and had never returned a single row since launch, which
// left four empty /store/ pages in the sitemap and made the "10 stores" claim
// in llms.txt false. Each was re-tested that day and is dead at the source,
// not a parser bug:
//   arogga    — every API endpoint 404s
//   paikaree  — 403 on the WooCommerce Store API
//   unimart   — bare Apache 403 on http and https, root path, browser headers;
//               TLS cert is issued for autoconfig.unimart.com.bd, not the apex
//   ajkerdeal — DNS resolves (35.247.151.101) but ports 80 and 443 are filtered
// The scrapers are kept in scrapers/ so a store can be re-added by putting its
// slug back here once a live probe returns products again.
export const STORE_SLUGS = [
  "chaldal",
  "daraz",
  "othoba",
  "shwapno",
  "meenabazar",
  "gobaby",
] as const;
