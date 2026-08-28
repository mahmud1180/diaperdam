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
  // PRAN's local budget line. Added 2026-08-24: it had 34 available SKUs across
  // 4 stores in all 6 sizes — more coverage than bashundhara (14) or aiwibi (9),
  // both already listed — yet was absent here, so /brand/kidstar rendered live
  // and was linked from the homepage and /diapers while being invisible to the
  // sitemap, IndexNow and every guide that iterates this list.
  //
  // Bar for adding a brand: real cross-store presence (>=2 stores) and enough
  // sizes that the brand x size pages aren't empty. Still off-list and why:
  //   chuchu   — 16 SKUs but Othoba-only, so no comparison to show
  //   mumlove  — 10 SKUs, Othoba-only
  //   momotaro — 8 SKUs, single store
  //   smc-smile / kinder / nannys — 3 / 2 / 1 SKUs, thin on a <12mo domain
  "kidstar",
  // German import (Othoba listings say "made-in-germany"). Added 2026-08-26:
  // 12 SKUs / 4 stores (chaldal, daraz, gobaby, othoba) / 5 sizes (Newborn,
  // M, L, XL, XXL — no S), 32-62 BDT/pc, re-verified live against the DB.
  "kidz",
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

// Every /guide/ page, in publish order. Kept here rather than in sitemap.ts
// because sitemap.ts and api/indexnow/route.ts each used to hold their own
// copy of this list, and each copy drifted: the IndexNow brand list was still
// at 9 brands after aiwibi and happy-nappy were added, and its store list kept
// four dead stores for months. Both files now derive from this file, so a new
// guide reaches the sitemap and Bing by being added once, here.
export const GUIDE_SLUGS = [
  "newborn-diaper-size",
  "diaper-size-chart",
  "diaper-rash-prevention",
  "belt-vs-pant-diaper",
  "night-diaper",
  "diaper-size-by-weight",
  "best-diaper-brands-bangladesh",
  "diaper-rash-treatment",
  "diaper-count-per-day",
  "cloth-vs-disposable-bangladesh",
  "diaper-allergy-sensitive-skin",
  "diaper-travel-tips",
  "diaper-swimming",
  "diaper-overnight-leak",
  "diaper-budget-monthly",
  "huggies-vs-pampers-bangladesh",
  "diaper-size-transition-timing",
  "mamypoko-vs-molfix-bangladesh",
  "local-vs-imported-diaper-brands-bangladesh",
  "diaper-pack-size-price-trap",
  "cheapest-diaper-store-bangladesh",
  "belt-vs-pant-price-gap-by-brand",
  "diaper-discount-frequency-by-store-bangladesh",
  "budget-local-diaper-brands-bangladesh",
  "best-store-by-diaper-brand-bangladesh",
  "store-switching-savings-bangladesh",
  "brand-size-availability-bangladesh",
  "pack-size-trap-by-brand-bangladesh",
] as const;
