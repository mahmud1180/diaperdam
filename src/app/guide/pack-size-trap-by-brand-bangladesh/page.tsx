import type { Metadata } from "next";
import { getBrandProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";
import { BRAND_SLUGS } from "@/lib/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "কোন ডায়াপার ব্র্যান্ডে বড় প্যাক কেনা সবচেয়ে ঝুঁকিপূর্ণ? ব্র্যান্ড অনুযায়ী তালিকা",
  description:
    "জাম্বো প্যাক সব ব্র্যান্ডে সমান বিশ্বাসযোগ্য না। আমাদের ডেটায় কোনো ব্র্যান্ডে অর্ধেকের বেশি তুলনায় বড় প্যাকই দামি পড়ছে, আবার কোনো ব্র্যান্ডে এই সমস্যা প্রায় নেই। ব্র্যান্ড অনুযায়ী ঝুঁকির হার দেখুন।",
  alternates: { canonical: "https://diaperdam.com/guide/pack-size-trap-by-brand-bangladesh" },
};

// Below this many comparable pairs, a brand's trap rate is noise, not a pattern.
const MIN_PAIRS = 15;
// Listings priced above this per piece are almost always a mislabeled bulk/carton
// SKU, not a genuine "jumbo pack" a parent would buy, so exclude before comparing.
const PRICE_SANITY_CAP = 50;

const FAQS = [
  {
    q: "ঝুঁকির হার মানে কী?",
    a: "একই দোকানে, একই সাইজে, একটা ব্র্যান্ডের দুইটা ভিন্ন প্যাক সাইজ পাশাপাশি রাখলে কতবার বড় প্যাকটার প্রতি-পিস দাম ছোটটার চেয়ে বেশি পড়ে, সেই শতাংশ। ৫০% মানে প্রতি দুইটা তুলনার একটায় বড় প্যাক কেনাটা ভুল সিদ্ধান্ত।",
  },
  {
    q: "প্যাম্পারস আর মামিপোকোতে এত বেশি কেন?",
    a: "দুটোই দারাজে অনেক আলাদা বিক্রেতা লিস্ট করেন। একজন ছোট প্যাকে প্রোমো চালান, আরেকজন বড় প্যাক নিয়মিত দামে রাখেন, ফলাফল এলোমেলো হয়ে যায়। নিওকেয়ারের মতো দেশি ব্র্যান্ড কম দোকানে, কম বিক্রেতার হাতে থাকে বলে দামটা বেশি স্থির থাকে।",
  },
  {
    q: "নিওকেয়ার বা সাভলনে বড় প্যাক কি চোখ বন্ধ করে কেনা যায়?",
    a: "মোটামুটি হ্যাঁ, ইতিহাস তাই বলছে। তবে ব্র্যান্ড পাতায় গিয়ে একবার দেখে নেওয়াই ভালো অভ্যাস, কারণ আজকের একটা প্রোমোশন যেকোনো ব্র্যান্ডের হিসাব সাময়িকভাবে উল্টে দিতে পারে।",
  },
  {
    q: "যে ব্র্যান্ডগুলো এই তালিকায় নেই, সেগুলোর অবস্থা কী?",
    a: "বাশুন্ধারা, আইউইবি, মলফিক্সের মতো ব্র্যান্ডে আজকের ডেটায় ১৫টার কম তুলনাযোগ্য জোড়া পাওয়া গেছে, তাই একটা নির্ভরযোগ্য শতাংশ বলা যায়নি। ডেটা বাড়লে এই তালিকায় ওদের যোগ করা হবে।",
  },
  {
    q: "এই হিসাব কি প্রতিদিন বদলায়?",
    a: "হ্যাঁ। প্রতিদিন সব দোকান থেকে দাম টানা হয়, তাই আজকের ৫১% আগামী সপ্তাহে ৪০% বা ৬০% হয়ে যেতে পারে। কেনার ঠিক আগে ব্র্যান্ড পাতায় প্রতি-পিস দাম অনুযায়ী সাজানো তালিকাটা দেখে নেওয়াই সবচেয়ে নিরাপদ।",
  },
];

type BrandRisk = {
  brand: string;
  brandSlug: string;
  total: number;
  trapCount: number;
  pct: number;
};

function groupBySizeStore(products: DiaperProduct[]): Map<string, DiaperProduct[]> {
  const groups = new Map<string, DiaperProduct[]>();
  for (const p of products) {
    if (!p.size_label) continue;
    const key = `${p.brand_slug}|${p.size_label}|${p.store_slug}`;
    const arr = groups.get(key);
    if (arr) arr.push(p);
    else groups.set(key, [p]);
  }
  return groups;
}

function buildBrandRisk(products: DiaperProduct[]): BrandRisk[] {
  const perBrand = new Map<string, { brand: string; total: number; trap: number }>();

  for (const items of groupBySizeStore(products).values()) {
    const sorted = [...items].sort((a, b) => a.pack_qty - b.pack_qty);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const small = sorted[i];
        const big = sorted[j];
        if (small.pack_qty === big.pack_qty) continue;
        const ppSmall = Number(small.price_per_piece);
        const ppBig = Number(big.price_per_piece);
        if (ppSmall >= PRICE_SANITY_CAP || ppBig >= PRICE_SANITY_CAP) continue;

        const entry = perBrand.get(small.brand_slug) ?? { brand: small.brand, total: 0, trap: 0 };
        entry.total++;
        if (ppBig > ppSmall) entry.trap++;
        perBrand.set(small.brand_slug, entry);
      }
    }
  }

  const rows: BrandRisk[] = [];
  for (const [brandSlug, s] of perBrand) {
    if (s.total < MIN_PAIRS) continue;
    rows.push({ brand: s.brand, brandSlug, total: s.total, trapCount: s.trap, pct: (s.trap / s.total) * 100 });
  }
  return rows.sort((a, b) => b.pct - a.pct);
}

export default async function PackSizeTrapByBrandPage() {
  const perBrand = await Promise.all(
    BRAND_SLUGS.map(b => getBrandProducts(b).catch(() => [] as DiaperProduct[]))
  );
  const allProducts = perBrand.flat();
  const ranked = buildBrandRisk(allProducts);

  const totalPairs = ranked.reduce((s, r) => s + r.total, 0);
  const totalTraps = ranked.reduce((s, r) => s + r.trapCount, 0);
  const blendedPct = totalPairs > 0 ? (totalTraps / totalPairs) * 100 : 0;

  const riskiest = ranked[0];
  const safest = ranked[ranked.length - 1];
  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "ব্র্যান্ড অনুযায়ী প্যাক-ফাঁদের ঝুঁকি", item: "https://diaperdam.com/guide/pack-size-trap-by-brand-bangladesh" },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "কোন ডায়াপার ব্র্যান্ডে বড় প্যাক কেনা সবচেয়ে ঝুঁকিপূর্ণ?",
    inLanguage: "bn",
    datePublished: today,
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/pack-size-trap-by-brand-bangladesh",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <div>
        <div className="bg-white border-b border-slate-100 py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-slate-400 mb-1">
              <a href="/diapers" className="hover:text-emerald-600">সব ডায়াপার</a>
              {" / "}ব্র্যান্ড অনুযায়ী প্যাক-ফাঁদের ঝুঁকি
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              কোন ব্র্যান্ডে বড় প্যাক কেনা সবচেয়ে ঝুঁকিপূর্ণ?
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              সব ব্র্যান্ডে জাম্বো প্যাকের ফাঁদ সমান না। আজকের ডেটা অনুযায়ী কোন ব্র্যান্ডে কতবার ধরা খেতে হয়েছে।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            আমাদের আগের গাইডে দেখিয়েছিলাম, বড় প্যাক মানেই সস্তা এই ধারণাটা প্রায় প্রতি তিনটার একটায় ভুল
            প্রমাণিত হয়। কিন্তু সেই সংখ্যাটা সব ব্র্যান্ড মিলিয়ে গড়। ব্র্যান্ড ধরে ধরে দেখলে ছবিটা অনেক বেশি
            চোখে পড়ার মতো।
          </p>

          {riskiest && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 text-sm">
              <p>
                <strong>সংক্ষেপে:</strong> {ranked.length}টা ব্র্যান্ডে আজ যথেষ্ট তুলনাযোগ্য ডেটা আছে, আর ওদের
                মিলিয়ে গড় ফাঁদের হার <strong>{blendedPct.toFixed(0)}%</strong>। সবচেয়ে ঝুঁকিপূর্ণ{" "}
                <strong>{riskiest.brand}</strong>, যেখানে <strong>{riskiest.pct.toFixed(0)}%</strong> তুলনায় বড়
                প্যাকই দামি পড়ছে।{" "}
                {safest && (
                  <>সবচেয়ে নিরাপদ <strong>{safest.brand}</strong>, মাত্র <strong>{safest.pct.toFixed(0)}%</strong>।</>
                )}
              </p>
            </div>
          )}

          {ranked.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">ব্র্যান্ড অনুযায়ী ঝুঁকির হার</h2>
              <p className="mb-3 text-sm text-slate-500">
                ঝুঁকি বেশি থেকে কম সাজানো। শুধু যে ব্র্যান্ডে আজ কমপক্ষে {MIN_PAIRS}টা তুলনাযোগ্য প্যাক-জোড়া
                পাওয়া গেছে, সেগুলোই আছে।
              </p>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="py-2 px-3 border border-slate-200">ব্র্যান্ড</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">ঝুঁকির হার</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">কতবার ধরা পড়েছে</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">মোট তুলনা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map(r => (
                      <tr key={r.brandSlug}>
                        <td className="py-2 px-3 border border-slate-200 font-medium">
                          <a href={`/brand/${r.brandSlug}`} className="text-emerald-700 hover:underline">
                            {r.brand}
                          </a>
                        </td>
                        <td
                          className={`py-2 px-3 border border-slate-200 text-right font-semibold ${
                            r.pct >= 40 ? "text-red-700" : r.pct >= 20 ? "text-amber-700" : "text-emerald-700"
                          }`}
                        >
                          {r.pct.toFixed(0)}%
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right">{r.trapCount}</td>
                        <td className="py-2 px-3 border border-slate-200 text-right text-slate-500">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mb-6 text-sm text-slate-500">
                লাল মানে প্রায় অর্ধেক তুলনাতেই বড় প্যাক দামি, হলুদ মাঝারি ঝুঁকি, সবুজ মানে বড় প্যাক প্রায় সবসময়
                কথামতো সস্তা।
              </p>
            </>
          )}

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেন প্যাম্পারস আর মামিপোকো এত উপরে</h2>
          <p className="mb-4">
            দুটো ব্র্যান্ডেরই দারাজে অনেক বিক্রেতা। একই প্যাম্পারস প্যাক দুই বিক্রেতা দুই দামে বিক্রি করতে পারেন,
            আর একজন হয়তো ছোট সাইজে প্রোমো চালাচ্ছেন যখন আরেকজন বড় সাইজে নিয়মিত দাম রেখেছেন। এই বিক্রেতা-ভিত্তিক
            এলোমেলো দাম নীতিই মূল কারণ, ব্র্যান্ডের প্যাকেজিং না।
          </p>
          <p className="mb-4">
            নিওকেয়ারের মতো ব্র্যান্ড কম দোকানে, কম বিক্রেতার হাতে থাকে। ফলে দামের সিঁড়িটা মোটামুটি স্কেল-অনুযায়ী
            সাজানো থাকে, ছোট প্যাক ছোট দামে, বড় প্যাক তার চেয়ে কম প্রতি-পিসে। এই ডেটা টানার সময় একটা জিনিস
            চোখে পড়ল, চালডাল আর স্বপ্নর মতো একক-বিক্রেতা দোকানে এই ফাঁদ প্রায় নেই বললেই চলে, পুরো সমস্যাটা
            মূলত দারাজ-কেন্দ্রিক।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">উঁচু ঝুঁকির ব্র্যান্ড কিনলে কী করবেন</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>ছোট আর বড়, দুটো দাম দেখে নিন:</strong> প্যাম্পারস বা মামিপোকো কিনলে শুধু বড় প্যাক না, একই সাইজের ছোটটাও একবার চেক করুন।</li>
            <li><strong>প্রতি-পিস দামে বিশ্বাস করুন, র‍্যাক প্রাইসে না:</strong> প্যাকের গায়ের দাম না, ব্র্যান্ড পাতায় সাজানো প্রতি-পিস দামটাই আসল হিসাব।</li>
            <li><strong>দোকান বদলে দেখুন:</strong> দারাজে ফাঁদ পেলে চালডাল বা স্বপ্নর দামটাও একবার মিলিয়ে নিন, দুইটা মিলিয়ে সিদ্ধান্ত নেওয়া নিরাপদ।</li>
            <li><strong>কম ঝুঁকির ব্র্যান্ডে এত সতর্ক হওয়ার দরকার নেই:</strong> নিওকেয়ার বা সাভলনে বড় প্যাকই সাধারণত সস্তা, তবু বছরে একবার চেক করে নেওয়া খারাপ না।</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাধারণ প্রশ্ন</h2>
          <div className="space-y-4 mb-8">
            {FAQS.map(f => (
              <div key={f.q} className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{f.q}</h3>
                <p className="text-sm text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/guide/diaper-pack-size-price-trap" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                জাম্বো প্যাক ফাঁদ
              </a>
              <a href="/guide/huggies-vs-pampers-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                হাগিস বনাম প্যাম্পারস
              </a>
              <a href="/guide/best-store-by-diaper-brand-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                কোন ব্র্যান্ডে কোন দোকান
              </a>
              <a href="/diapers" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                ব্র্যান্ড × সাইজ গ্রিড
              </a>
              <a href="/deals" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                আজকের অফার
              </a>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
