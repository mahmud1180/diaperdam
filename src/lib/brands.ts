// Single source of truth for diaper brand display names — shared by
// /brand/[slug], /brand/[slug]/size/[size], and anywhere a brand needs a
// label. GSC proves real demand arrives as Bengali-script queries
// (হাগিস ডায়াপার দাম, প্যাম্পারস দাম) yet the templates were rendering
// Latin-only titles ("Huggies …") → script mismatch, ~0% CTR. Lead with the
// Bengali name and keep the Latin form in parentheses so both the
// Bengali-script and the English/transliterated searcher recognise the result.

export type BrandInfo = { name: string; nameBn: string; description: string };

export const BRANDS: Record<string, BrandInfo> = {
  huggies:     { name: "Huggies",     nameBn: "হাগিস",      description: "বাংলাদেশে Huggies ডায়াপারের দাম — Dry, Ultra Soft ও Wonder Pants চালডাল, দারাজ ও অন্যান্য দোকান থেকে তুলনা করুন। সবচেয়ে কম প্রতি পিস দাম দেখুন।" },
  mamypoko:    { name: "MamyPoko",    nameBn: "ম্যামিপোকো", description: "বাংলাদেশে MamyPoko Pants Extra Absorb দাম। S থেকে XL সাইজ সব দোকান থেকে তুলনা। আজকের সবচেয়ে সস্তা MamyPoko প্রতি পিস।" },
  molfix:      { name: "Molfix",      nameBn: "মলফিক্স",    description: "বাংলাদেশে Molfix বেবি ডায়াপারের দাম। তুর্কি-তৈরি Molfix Pants ও Belt চালডাল ও দারাজে তুলনা করুন।" },
  pampers:     { name: "Pampers",     nameBn: "প্যাম্পারস", description: "বাংলাদেশে Pampers Baby Dry ও Premium Care দাম। আজ সবচেয়ে কম দামে Pampers ডায়াপার প্রতি পিস খুঁজুন।" },
  neocare:     { name: "Neocare",     nameBn: "নিওকেয়ার",   description: "বাংলাদেশে Neocare প্রিমিয়াম বেবি ডায়াপারের দাম। দেশি ব্র্যান্ড, বাজেট-ফ্রেন্ডলি। সব দোকানে তুলনা করুন।" },
  bashundhara: { name: "Bashundhara", nameBn: "বসুন্ধরা",   description: "বাংলাদেশে Bashundhara Diapant দাম। সাশ্রয়ী দেশি ব্র্যান্ড চালডাল ও অন্যান্য দোকানে তুলনা।" },
  avonee:      { name: "Avonee",      nameBn: "অ্যাভোনি",   description: "বাংলাদেশে Avonee ডায়াপারের দাম। বাজেট বেল্ট ও প্যান্ট ডায়াপার সব দোকানে তুলনা করুন।" },
  supermom:    { name: "Supermom",    nameBn: "সুপারমম",    description: "বাংলাদেশে Supermom বেবি ডায়াপারের দাম (Square Toiletries)। চালডাল ও দারাজে তুলনা করুন।" },
  savlon:      { name: "Savlon",      nameBn: "স্যাভলন",    description: "বাংলাদেশে Savlon Twinkle বেবি ডায়াপারের দাম। ACI-এর সাশ্রয়ী দেশি ব্র্যান্ড চালডাল ও দারাজে তুলনা করুন।" },
  aiwibi:      { name: "Aiwibi",      nameBn: "আইউইবি",     description: "বাংলাদেশে Aiwibi ডায়াপারের দাম। অস্ট্রেলিয়ান-ডিজাইন আইউইবি প্যান্ট ডায়াপার সব দোকানে তুলনা করুন।" },
  "happy-nappy": { name: "Happy Nappy", nameBn: "হ্যাপি ন্যাপি", description: "বাংলাদেশে Fresh Happy Nappy ডায়াপারের দাম। বাজেট বেল্ট ডায়াপার চালডাল ও অন্যান্য দোকানে তুলনা।" },
  kinder:      { name: "Kinder",      nameBn: "কিন্ডার",    description: "বাংলাদেশে Kinder ডায়াপারের দাম। প্যান্ট ও বেল্ট ডায়াপার সব দোকান থেকে প্রতি পিস দামে তুলনা করুন।" },
  kidstar:     { name: "Kidstar",     nameBn: "কিডস্টার",   description: "বাংলাদেশে PRAN Kidstar ডায়াপারের দাম — বেল্ট ও প্যান্ট দুই ধরনই, নবজাতক থেকে XXL পর্যন্ত। ওথোবা, চালডাল, দারাজ ও মীনা বাজারের দাম প্রতি পিস হিসেবে তুলনা করুন।" },
  kidz:        { name: "Kidz",        nameBn: "কিডজ",       description: "বাংলাদেশে Kidz ডায়াপারের দাম — জার্মানিতে তৈরি, বেল্ট ও প্যান্ট দুই ধরনই। চালডাল, দারাজ, গোবেবি ও ওথোবার দাম প্রতি পিস হিসেবে তুলনা করুন।" },
  goon:        { name: "Goon",        nameBn: "গুন",        description: "বাংলাদেশে Goon জাপানি ডায়াপারের দাম সব দোকানে তুলনা করুন।" },
  merries:     { name: "Merries",     nameBn: "মেরিজ",      description: "বাংলাদেশে Merries জাপানি প্রিমিয়াম ডায়াপারের দাম তুলনা করুন।" },
  chuchu:      { name: "Chu Chu",     nameBn: "চুচু",       description: "বাংলাদেশে Chu Chu ডায়াপারের দাম সব দোকানে তুলনা করুন।" },
  "smc-smile": { name: "SMC Smile",   nameBn: "এসএমসি স্মাইল", description: "বাংলাদেশে SMC Smile ডায়াপারের দাম সব দোকানে তুলনা করুন।" },
};

// Brand info with a safe fallback for slugs not in the table above
// (on-demand brand pages render for any brand_slug present in the DB).
export function brandInfo(slug: string): BrandInfo {
  return (
    BRANDS[slug] ?? {
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      nameBn: slug,
      description: "",
    }
  );
}

// Bengali-only name, for prose and table cells that are already fully Bengali
// and would read badly with a parenthesised Latin form. Two guides each kept a
// private BRAND_NAME_BN copy of this until 2026-08-24; both had stalled at 11
// brands, so adding kidstar to BRAND_SLUGS made those pages print the raw slug
// "kidstar" in the middle of Bengali tables. Same drift class as the sitemap /
// IndexNow brand lists (fixed 2026-08-21) — fourth occurrence. Import this,
// never re-declare a brand-name map in a page file.
export function brandNameBn(slug: string): string {
  return brandInfo(slug).nameBn;
}

// Bengali-led dual-script label, e.g. "হাগিস (Huggies)". Collapses to a single
// token when no distinct Bengali form exists, so unknown brands read cleanly.
export function brandLabel(slug: string): string {
  const b = brandInfo(slug);
  return b.nameBn && b.nameBn !== b.name ? `${b.nameBn} (${b.name})` : b.name;
}
