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
export type GuideGroup = "size" | "price" | "compare" | "care" | "practical";

export interface Guide {
  slug: string;
  /** Short label for hub listings — not the page's own SEO title. */
  label: string;
  /** One line, what the reader actually gets. */
  blurb: string;
  group: GuideGroup;
}

// Every /guide/ page, in publish order. Kept here rather than in sitemap.ts
// because sitemap.ts and api/indexnow/route.ts each used to hold their own
// copy of this list, and each copy drifted: the IndexNow brand list was still
// at 9 brands after aiwibi and happy-nappy were added, and its store list kept
// four dead stores for months. Both files now derive from this file, so a new
// guide reaches the sitemap and Bing by being added once, here.
//
// The label/blurb/group fields exist so /guide (the hub) can also be built from
// this one list. Before the hub existed, 27 of these 28 pages had no inbound
// link anywhere on the site and GSC reported them "URL is unknown to Google",
// never crawled — sitemap presence alone did not get them fetched.
export const GUIDES: readonly Guide[] = [
  {
    slug: "newborn-diaper-size",
    label: "নবজাতকের ডায়াপার সাইজ",
    blurb: "কোন সাইজ দিয়ে শুরু করবেন, প্রথম মাসে কয়টা লাগে, আর আজকের দাম।",
    group: "size",
  },
  {
    slug: "diaper-size-chart",
    label: "ডায়াপার সাইজ চার্ট",
    blurb: "NB থেকে XXL পর্যন্ত বয়স ও ওজনের পূর্ণ চার্ট।",
    group: "size",
  },
  {
    slug: "diaper-size-by-weight",
    label: "ওজন অনুযায়ী সাইজ",
    blurb: "বাচ্চার ওজন জানা থাকলে কোন সাইজ নেবেন, সরাসরি।",
    group: "size",
  },
  {
    slug: "diaper-size-transition-timing",
    label: "কখন সাইজ বদলাবেন",
    blurb: "সাইজ বদলানোর সময় হয়েছে কিনা বোঝার লক্ষণগুলো।",
    group: "size",
  },
  {
    slug: "belt-vs-pant-diaper",
    label: "বেল্ট বনাম প্যান্ট",
    blurb: "পার্থক্য কোথায়, কখন প্যান্টে যাওয়া দরকার, দুটোর আজকের দাম।",
    group: "size",
  },
  {
    slug: "brand-size-availability-bangladesh",
    label: "কোন ব্র্যান্ড কোন সাইজে পাওয়া যায় না",
    blurb: "সাইজ বদলানোর আগে দেখে নিন আপনার ব্র্যান্ডে সেটা আছে কিনা।",
    group: "size",
  },
  {
    slug: "diaper-budget-monthly",
    label: "মাসিক ডায়াপার বাজেট",
    blurb: "সাইজ অনুযায়ী মাসে কত টাকা ধরে রাখতে হবে।",
    group: "price",
  },
  {
    slug: "diaper-count-per-day",
    label: "দিনে কয়টা ডায়াপার",
    blurb: "বয়স অনুযায়ী দৈনিক হিসাব, তার সাথে মাসিক খরচ।",
    group: "price",
  },
  {
    slug: "cheapest-diaper-store-bangladesh",
    label: "কোন দোকানে সবচেয়ে সস্তা",
    blurb: "ছয়টা দোকানের লাইভ দাম পাশাপাশি।",
    group: "price",
  },
  {
    slug: "diaper-pack-size-price-trap",
    label: "জাম্বো প্যাকের ফাঁদ",
    blurb: "বড় প্যাক সব সময় সস্তা না, প্রতি-পিস হিসাবে ধরা পড়ে।",
    group: "price",
  },
  {
    slug: "pack-size-trap-by-brand-bangladesh",
    label: "কোন ব্র্যান্ডে বড় প্যাক ঝুঁকিপূর্ণ",
    blurb: "ব্র্যান্ড ধরে ধরে প্যাক-সাইজের দামের ফারাক।",
    group: "price",
  },
  {
    slug: "diaper-discount-frequency-by-store-bangladesh",
    label: "কোন দোকানে প্রমোশন বেশি",
    blurb: "কতবার প্রমোশনের দামও আসলে সস্তা না, সেটাসহ।",
    group: "price",
  },
  {
    slug: "store-switching-savings-bangladesh",
    label: "দোকান বদলালে কত বাঁচে",
    blurb: "একটা দোকানে আটকে থাকার আসল খরচ, লাইভ হিসাবে।",
    group: "price",
  },
  {
    slug: "belt-vs-pant-price-gap-by-brand",
    label: "বেল্ট-প্যান্ট দামের ফারাক",
    blurb: "কোন ব্র্যান্ডে দুই ধরনের দামের ফারাক সবচেয়ে বেশি।",
    group: "price",
  },
  {
    slug: "huggies-vs-pampers-bangladesh",
    label: "হাগিস বনাম প্যাম্পারস",
    blurb: "সাইজ ধরে ধরে প্রতি-পিস দাম, আর কোনটা কার জন্য।",
    group: "compare",
  },
  {
    slug: "mamypoko-vs-molfix-bangladesh",
    label: "ম্যামিপোকো বনাম মলফিক্স",
    blurb: "দুই জনপ্রিয় প্যান্ট ব্র্যান্ডের দাম ও ফিট তুলনা।",
    group: "compare",
  },
  {
    slug: "best-diaper-brands-bangladesh",
    label: "সেরা ডায়াপার ব্র্যান্ড",
    blurb: "বাংলাদেশে যেগুলো আসলে পাওয়া যায়, দাম ও মান মিলিয়ে।",
    group: "compare",
  },
  {
    slug: "budget-local-diaper-brands-bangladesh",
    label: "বাজেট দেশি ব্র্যান্ড",
    blurb: "সুপারমম, স্যাভলন, অ্যাভোনি পাশাপাশি।",
    group: "compare",
  },
  {
    slug: "local-vs-imported-diaper-brands-bangladesh",
    label: "দেশি নাকি বিদেশি",
    blurb: "বছরের হিসাবে দুই ধরনের ব্র্যান্ডে কত টাকা ফারাক।",
    group: "compare",
  },
  {
    slug: "best-store-by-diaper-brand-bangladesh",
    label: "কোন ব্র্যান্ড কোন দোকানে",
    blurb: "আপনার ব্র্যান্ড ঠিক থাকলে দোকান কোনটা বেছে নেবেন।",
    group: "compare",
  },
  {
    slug: "cloth-vs-disposable-bangladesh",
    label: "কাপড় বনাম ডিসপোজেবল",
    blurb: "ধোয়ার খরচ আর সময় ধরলে হিসাবটা কেমন দাঁড়ায়।",
    group: "compare",
  },
  {
    slug: "diaper-rash-prevention",
    label: "র‍্যাশ ঠেকানো",
    blurb: "কেন হয় আর কোন অভ্যাসগুলো সত্যিই কাজে দেয়।",
    group: "care",
  },
  {
    slug: "diaper-rash-treatment",
    label: "র‍্যাশ হয়ে গেলে",
    blurb: "ঘরোয়া যত্ন, ক্রিম, আর কখন ডাক্তার দরকার।",
    group: "care",
  },
  {
    slug: "diaper-allergy-sensitive-skin",
    label: "সেনসিটিভ স্কিন",
    blurb: "অ্যালার্জি হলে কোন ধরনের ডায়াপার বেছে নেবেন।",
    group: "care",
  },
  {
    slug: "night-diaper",
    label: "রাতের ডায়াপার",
    blurb: "আট ঘণ্টা ঘুমে লিক না হওয়ার আসল শর্তগুলো।",
    group: "care",
  },
  {
    slug: "diaper-overnight-leak",
    label: "রাতে লিক হলে",
    blurb: "কোথা থেকে লিক হচ্ছে দেখে সেটাই ঠিক করুন।",
    group: "care",
  },
  {
    slug: "diaper-travel-tips",
    label: "ভ্রমণে ডায়াপার",
    blurb: "বাসে, লঞ্চে, প্লেনে কয়টা সঙ্গে নেবেন।",
    group: "practical",
  },
  {
    slug: "diaper-swimming",
    label: "সাঁতার ও পানিতে",
    blurb: "পুলে বা সমুদ্রে বাচ্চাকে কী পরাবেন।",
    group: "practical",
  },
] as const;

export const GUIDE_GROUPS: { key: GuideGroup; label: string; intro: string }[] = [
  { key: "size", label: "সাইজ ও ফিট", intro: "কোন সাইজ, কখন বদলাবেন, কোন ধরন।" },
  { key: "price", label: "দাম ও খরচ", intro: "মাসিক বাজেট, দোকানভেদে দাম, আর প্যাক-সাইজের হিসাব।" },
  { key: "compare", label: "ব্র্যান্ড তুলনা", intro: "দুটো ব্র্যান্ড পাশাপাশি রেখে দাম আর ফিটের ফারাক।" },
  { key: "care", label: "যত্ন ও র‍্যাশ", intro: "ত্বকের সমস্যা, রাতের লিক, সেনসিটিভ স্কিন।" },
  { key: "practical", label: "দৈনন্দিন", intro: "ভ্রমণ, সাঁতার, আর বাইরে নিয়ে যাওয়া।" },
];

// Derived so sitemap.ts and api/indexnow/route.ts keep working off one list.
export const GUIDE_SLUGS = GUIDES.map(g => g.slug);
