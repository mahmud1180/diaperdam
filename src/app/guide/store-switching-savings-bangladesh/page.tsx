import type { Metadata } from "next";
import { getBrandProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";
import { BRAND_SLUGS } from "@/lib/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "একটা দোকানে আটকে থাকলে কত টাকা বেশি দিচ্ছেন? লাইভ হিসাব",
  description:
    "সবসময় একই দোকান থেকে ডায়াপার কিনলে গড়ে কত % বেশি দাম দিতে হয়, আমাদের ডেটা থেকে প্রতিটা দোকানের গড় ওভারপে হিসাব করে দেখানো হলো।",
  alternates: { canonical: "https://diaperdam.com/guide/store-switching-savings-bangladesh" },
};

const STORE_NAME_BN: Record<string, string> = {
  chaldal: "চালডাল",
  daraz: "দারাজ",
  othoba: "অথবা",
  shwapno: "স্বপ্ন",
  arogga: "আরোগ্য",
  meenabazar: "মীনা বাজার",
  gobaby: "GoBaby",
  unimart: "ইউনিমার্ট",
  ajkerdeal: "আজকারডিল",
  paikaree: "পাইকারি",
};

const MIN_COMBOS_FOR_RANKING = 5;
const MIN_STORES_PER_COMBO = 3;
const ASSUMED_DAILY_COUNT = 6;
const ASSUMED_MONTHLY_COUNT = ASSUMED_DAILY_COUNT * 30;
// Marketplace listings occasionally have a mis-parsed pack_qty (e.g. a 48-pack
// read as 2), producing a per-piece price far outside any real diaper's range.
// Excluding those keeps a single bad listing from skewing a store's average.
const MIN_PLAUSIBLE_PRICE_PER_PIECE = 5;
const MAX_PLAUSIBLE_PRICE_PER_PIECE = 150;

const FAQS = [
  {
    q: "ওভারপে % মানে কী?",
    a: "একটা নির্দিষ্ট ব্র্যান্ড-সাইজ কম্বিনেশনে সেই দোকানের দাম, আজকের সবচেয়ে সস্তা দোকানের দামের চেয়ে কত শতাংশ বেশি, সেটাই ওভারপে %। যদি দোকানটা নিজেই সবচেয়ে সস্তা থাকে, তাহলে ঐ কম্বিনেশনে ওভারপে ০%।",
  },
  {
    q: "গড় ওভারপে কম মানেই কি সেই দোকান সবচেয়ে সস্তা?",
    a: "সবসময় না। গড় ওভারপে কম মানে ঐ দোকান যেসব ব্র্যান্ড-সাইজে বিক্রি করে, সেগুলোতে গড়ে সবচেয়ে সস্তা দামের কাছাকাছি থাকে। কিন্তু একটা নির্দিষ্ট ব্র্যান্ড-সাইজে অন্য কোনো দোকান আজ বেশি সস্তা হতে পারে, তাই কেনার আগে নির্দিষ্ট আইটেমটা চেক করাই নিরাপদ।",
  },
  {
    q: "শুধু ৩+ দোকানে থাকা কম্বিনেশন গোনা হয়েছে কেন?",
    a: "কোনো ব্র্যান্ড-সাইজ যদি মাত্র ১টা দোকানে পাওয়া যায়, সেখানে তুলনার সুযোগই নেই। ওভারপে হিসাব করলে ভুল ধারণা হবে, তাই অন্তত ৩টা দোকানে পাওয়া যায় এমন কম্বিনেশনগুলোই ধরা হয়েছে, যাতে তুলনাটা বাস্তবসম্মত হয়।",
  },
  {
    q: "মাসে ৳ কত বাঁচতে পারে?",
    a: "নিচের উদাহরণে দিনে ৬টা ডায়াপার (মাসে ১৮০টা) ধরে হিসাব করা হয়েছে, এটা এক বছর বয়সের কাছাকাছি বাচ্চাদের জন্য একটা প্রচলিত গড়। আপনার বাচ্চার বয়স অনুযায়ী সংখ্যা কম-বেশি হতে পারে, বিস্তারিত আমাদের দৈনিক হিসাব গাইডে।",
  },
  {
    q: "এই হিসাব কি প্রতিদিন বদলায়?",
    a: "হ্যাঁ। দাম প্রতিদিন আপডেট হয়, তাই ওভারপে % ও র‍্যাঙ্কিং দিন দিন বদলাতে পারে। এই পাতাটা প্রতিবার লোড হওয়ার সময় ডাটাবেজ থেকে টাটকা হিসাব করে দেখায়, তাই সবসময় আজকের চিত্র দেখবেন।",
  },
];

type StoreOverpay = {
  slug: string;
  name: string;
  comboCount: number;
  totalOverpayPct: number;
  avgOverpayPct: number;
  wins: number;
};

function groupByBrandSize(products: DiaperProduct[]): Map<string, DiaperProduct[]> {
  const groups = new Map<string, DiaperProduct[]>();
  for (const p of products) {
    if (!p.size_label) continue;
    const key = `${p.brand_slug}|${p.size_label}`;
    const arr = groups.get(key);
    if (arr) arr.push(p);
    else groups.set(key, [p]);
  }
  return groups;
}

export default async function StoreSwitchingSavingsPage() {
  const perBrand = await Promise.all(
    BRAND_SLUGS.map(b => getBrandProducts(b).catch(() => [] as DiaperProduct[]))
  );
  const allProducts = perBrand
    .flat()
    .filter(p => {
      const price = Number(p.price_per_piece);
      return price >= MIN_PLAUSIBLE_PRICE_PER_PIECE && price <= MAX_PLAUSIBLE_PRICE_PER_PIECE;
    });
  const combos = groupByBrandSize(allProducts);

  const stats = new Map<string, StoreOverpay>();
  let qualifyingComboCount = 0;

  for (const items of combos.values()) {
    if (items.length < MIN_STORES_PER_COMBO) continue;
    qualifyingComboCount++;

    const cheapest = items.reduce((a, b) =>
      Number(a.price_per_piece) < Number(b.price_per_piece) ? a : b
    );
    const cheapestPrice = Number(cheapest.price_per_piece);

    for (const p of items) {
      let s = stats.get(p.store_slug);
      if (!s) {
        s = {
          slug: p.store_slug,
          name: STORE_NAME_BN[p.store_slug] ?? p.store_name,
          comboCount: 0,
          totalOverpayPct: 0,
          avgOverpayPct: 0,
          wins: 0,
        };
        stats.set(p.store_slug, s);
      }
      const overpayPct = ((Number(p.price_per_piece) - cheapestPrice) / cheapestPrice) * 100;
      s.comboCount++;
      s.totalOverpayPct += overpayPct;
      if (overpayPct === 0) s.wins++;
    }
  }

  for (const s of stats.values()) {
    s.avgOverpayPct = s.comboCount > 0 ? s.totalOverpayPct / s.comboCount : 0;
  }

  const ranked = [...stats.values()]
    .filter(s => s.comboCount >= MIN_COMBOS_FOR_RANKING)
    .sort((a, b) => a.avgOverpayPct - b.avgOverpayPct);

  const belowThreshold = [...stats.values()].filter(s => s.comboCount < MIN_COMBOS_FOR_RANKING);

  const best = ranked[0];
  const worst = ranked[ranked.length - 1];

  // Concrete monthly BDT example using the combo with the widest spread among qualifying combos
  let widestCombo: { brand: string; size: string; cheapest: number; priciest: number } | null = null;
  for (const [key, items] of combos.entries()) {
    if (items.length < MIN_STORES_PER_COMBO) continue;
    const prices = items.map(p => Number(p.price_per_piece));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (!widestCombo || max - min > widestCombo.priciest - widestCombo.cheapest) {
      const [brand, size] = key.split("|");
      widestCombo = { brand, size, cheapest: min, priciest: max };
    }
  }

  const monthlyDiff = widestCombo
    ? (widestCombo.priciest - widestCombo.cheapest) * ASSUMED_MONTHLY_COUNT
    : 0;

  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "দোকান বদলে সাশ্রয়", item: "https://diaperdam.com/guide/store-switching-savings-bangladesh" },
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
    headline: "একটা দোকানে আটকে থাকলে কত টাকা বেশি দিচ্ছেন? লাইভ হিসাব",
    inLanguage: "bn",
    datePublished: today,
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/store-switching-savings-bangladesh",
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
              {" / "}দোকান বদলে সাশ্রয়
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              একটা দোকানে আটকে থাকলে কত টাকা বেশি দিচ্ছেন?
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              সবসময় একই দোকান থেকে কেনার আসল দাম, আজকের ডেটা দিয়ে হিসাব করা।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            আগের গাইডে দেখিয়েছিলাম কোন দোকান কতবার সবচেয়ে সস্তা দাম দেয়। কিন্তু "কতবার জেতে" আর
            "কতটা বেশি দাম দিতে হয় যদি না জেতে", এই দুইটা আলাদা প্রশ্ন। এই পাতায় দ্বিতীয় প্রশ্নের
            উত্তর: একটা নির্দিষ্ট দোকানে অভ্যস্ত থাকলে, গড়ে কত শতাংশ বেশি দাম গুনতে হচ্ছে।
          </p>

          {best && worst && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 text-sm">
              <p>
                <strong>সংক্ষেপে:</strong> আজকের ডেটায় {qualifyingComboCount}টা ব্র্যান্ড-সাইজ
                কম্বিনেশনের মধ্যে (যেগুলো অন্তত {MIN_STORES_PER_COMBO}টা দোকানে পাওয়া যায়),{" "}
                <strong>{best.name}</strong>-এ কিনলে গড়ে সবচেয়ে সস্তার কাছাকাছি থাকেন (গড় ওভারপে{" "}
                {best.avgOverpayPct.toFixed(1)}%), আর <strong>{worst.name}</strong>-এ সবসময় কিনলে
                গড়ে <strong>{worst.avgOverpayPct.toFixed(1)}%</strong> বেশি দাম পড়ে।
              </p>
            </div>
          )}

          {ranked.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">দোকান-ভিত্তিক গড় ওভারপে</h2>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="py-2 px-3 border border-slate-200">দোকান</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">গড় ওভারপে</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">সরাসরি সস্তা</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">তুলনাযোগ্য কম্বিনেশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map(s => (
                      <tr key={s.slug}>
                        <td className="py-2 px-3 border border-slate-200 font-medium">
                          <a href={`/store/${s.slug}`} className="text-emerald-700 hover:underline">
                            {s.name}
                          </a>
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right font-semibold text-emerald-700">
                          {s.avgOverpayPct.toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right">{s.wins}</td>
                        <td className="py-2 px-3 border border-slate-200 text-right">{s.comboCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mb-2 text-sm text-slate-500">
                "গড় ওভারপে" মানে ঐ দোকান যেসব ব্র্যান্ড-সাইজ কম্বিনেশনে বিক্রি করে, সেগুলোতে আজকের
                সবচেয়ে সস্তা দামের তুলনায় গড়ে কত শতাংশ বেশি দাম রাখছে।
              </p>
              {belowThreshold.length > 0 && (
                <p className="mb-6 text-xs text-slate-400">
                  ({belowThreshold.map(s => s.name).join(", ")}, SKU সংখ্যা কম বলে এই র‍্যাঙ্কিংয়ে
                  রাখা হয়নি, নির্ভরযোগ্য গড় বের করার মতো তথ্য নেই।)
                </p>
              )}
            </>
          )}

          {widestCombo && monthlyDiff > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">বাস্তব উদাহরণ: মাসে কত টাকা</h2>
              <p className="mb-4">
                আজকের ডেটায় সবচেয়ে বড় ফারাক {widestCombo.brand} {widestCombo.size} সাইজে,
                সবচেয়ে সস্তা ৳{widestCombo.cheapest.toFixed(2)}/পিস আর সবচেয়ে দামি ৳
                {widestCombo.priciest.toFixed(2)}/পিস। দিনে {ASSUMED_DAILY_COUNT}টা (মাসে{" "}
                {ASSUMED_MONTHLY_COUNT}টা) ধরলে, শুধু ভুল দোকান থেকে এই ব্র্যান্ড-সাইজ কেনার কারণে
                মাসে <strong>৳{monthlyDiff.toFixed(0)}</strong> পর্যন্ত বেশি খরচ হতে পারে।
              </p>
              <p className="mb-4 text-sm text-slate-500">
                এটা একটা একক ব্র্যান্ড-সাইজের উদাহরণ, পুরো মাসের বাজেট না। বাস্তবে বেশিরভাগ পরিবার
                একাধিক ব্র্যান্ড-সাইজ কেনেন, তাই মোট ফারাক এর চেয়ে কম বা বেশি হতে পারে।{" "}
                <a href="/guide/diaper-budget-monthly" className="text-emerald-700 hover:underline">
                  মাসিক বাজেট গাইডে
                </a>{" "}
                পূর্ণ হিসাব দেখুন।
              </p>
            </>
          )}

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেন এই ফারাক তৈরি হয়</h2>
          <p className="mb-4">
            "সরাসরি সস্তা" কলামটা দেখায় কোন দোকান কতবার কোনো ওভারপে ছাড়াই সবচেয়ে সস্তা দাম দিয়েছে।
            যে দোকানের এই সংখ্যা বেশি অথচ গড় ওভারপেও কম, সেটাই সবচেয়ে নির্ভরযোগ্য বিকল্প। মাঝেমধ্যে
            না জিতলেও খুব একটা বেশি দামে পড়ে না। আর কম "সরাসরি সস্তা" কিন্তু কম ওভারপে-ও থাকা দোকান
            মানে হেরে গেলেও ফারাকটা ছোট থাকে।
          </p>
          <p className="mb-4">
            উল্টোদিকে, যে দোকানের গড় ওভারপে বেশি, সেখানে মাঝেমধ্যে সস্তা দাম পাওয়া গেলেও গড়ে ঐ
            দোকানে আটকে থাকাটা ব্যয়বহুল, বিশেষ করে যদি বাসার কাছে বলে বা অভ্যাসের কারণে অন্য দোকান
            চেক না করেন।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কী করবেন</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>বড় প্যাক কেনার আগে চেক করুন:</strong> মাসের স্টক একসাথে কিনলে ওভারপে % পুরো প্যাকে গুণিত হয়ে যায়।</li>
            <li><strong>নির্দিষ্ট ব্র্যান্ড-সাইজ দেখুন:</strong> গড় ওভারপে কম মানেই সব আইটেমে সেই দোকান সস্তা না, <a href="/diapers" className="text-emerald-700 hover:underline">ব্র্যান্ড × সাইজ গ্রিডে</a> নির্দিষ্ট আইটেমটা মিলিয়ে নিন।</li>
            <li><strong>দুই-তিনটা দোকান শর্টলিস্ট করুন:</strong> একটা না, ২-৩টা দোকান পালা করে দেখলে বেশিরভাগ সময় সস্তা দামের কাছাকাছি থাকবেন।</li>
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
              <a href="/guide/cheapest-diaper-store-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                কোন দোকানে সস্তা
              </a>
              <a href="/guide/best-store-by-diaper-brand-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                ব্র্যান্ড অনুযায়ী সেরা দোকান
              </a>
              <a href="/guide/diaper-budget-monthly" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                মাসিক বাজেট গাইড
              </a>
              <a href="/price-index" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                প্রাইস ইনডেক্স
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
