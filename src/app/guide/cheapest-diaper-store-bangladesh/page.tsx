import type { Metadata } from "next";
import { getBrandProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";
import { BRAND_SLUGS } from "@/lib/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "কোন দোকানে ডায়াপার সবচেয়ে সস্তা? ৬টা দোকানের লাইভ তুলনা",
  description:
    "চালডাল, দারাজ, স্বপ্ন, অথবা মীনা বাজার — কোন দোকান আজ সবচেয়ে বেশিবার সবচেয়ে সস্তা দাম দিচ্ছে তা আমাদের ডেটা দিয়ে দেখুন। কোনো একটা দোকানে লয়্যাল থাকলে কত টাকা মিস হতে পারে।",
  alternates: { canonical: "https://diaperdam.com/guide/cheapest-diaper-store-bangladesh" },
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

const FAQS = [
  {
    q: "একটা দোকানেই সবসময় কেনা উচিত না কেন?",
    a: "কারণ কোনো দোকানই সবসময় সব সাইজে সবচেয়ে সস্তা থাকে না। নিচের টেবিলে দেখবেন জয়ের সংখ্যা কয়েকটা দোকানের মধ্যে ভাগ হয়ে আছে। একটা দোকানে অভ্যস্ত হয়ে গেলে বাকিগুলোর ভালো দাম চোখ এড়িয়ে যায়।",
  },
  {
    q: "প্রমোশন বেশি থাকা মানেই কি সেই দোকান সস্তা?",
    a: "না, সবসময় না। প্রমোশন মানে দাম কমানো হয়েছে, কিন্তু কমানোর আগের দামটাই যদি বেশি থাকে, তাহলে প্রমোশনের পরও অন্য দোকানের নিয়মিত দামের চেয়ে বেশি পড়তে পারে। তাই প্রমোশন ব্যাজ না দেখে সরাসরি প্রতি-পিস দাম দেখাই নিরাপদ।",
  },
  {
    q: "এই ডেটা কতটা আপ-টু-ডেট?",
    a: "প্রতিদিন একবার সব দোকান থেকে দাম টানা হয়। প্রতিটা পাতায় সবশেষ আপডেটের সময় দেখানো থাকে, তাই কেনার ঠিক আগে সেটা চেক করে নিশ্চিত হতে পারবেন।",
  },
  {
    q: "সব দোকানে কি একই ব্র্যান্ড পাওয়া যায়?",
    a: "না। চালডাল বা স্বপ্নর মতো গ্রোসারি দোকানে সীমিত কিছু ব্র্যান্ড থাকে, আবার দারাজের মতো মার্কেটপ্লেসে অনেক বেশি ব্র্যান্ড ও সাইজ পাওয়া যায়। তাই কোন দোকানে কোন ব্র্যান্ড আছে সেটা আগে দেখে নেওয়া ভালো।",
  },
  {
    q: "কম SKU থাকা দোকান কি এড়িয়ে চলা উচিত?",
    a: "না, উল্টো অনেক সময় ছোট SKU-র দোকানই একটা নির্দিষ্ট ব্র্যান্ড-সাইজে সবচেয়ে সস্তা দাম রাখে। SKU সংখ্যা না দেখে নির্দিষ্ট ব্র্যান্ড-সাইজের জন্য কোন দোকান জিতছে সেটাই আসল প্রশ্ন।",
  },
];

type StoreStat = {
  slug: string;
  name: string;
  skuCount: number;
  promoCount: number;
  wins: number;
  lastScrapedHoursAgo: number | null;
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

export default async function CheapestStorePage() {
  const perBrand = await Promise.all(
    BRAND_SLUGS.map(b => getBrandProducts(b).catch(() => [] as DiaperProduct[]))
  );
  const allProducts = perBrand.flat();

  const stats = new Map<string, StoreStat>();
  const now = Date.now();

  for (const p of allProducts) {
    let s = stats.get(p.store_slug);
    if (!s) {
      s = {
        slug: p.store_slug,
        name: STORE_NAME_BN[p.store_slug] ?? p.store_name,
        skuCount: 0,
        promoCount: 0,
        wins: 0,
        lastScrapedHoursAgo: null,
      };
      stats.set(p.store_slug, s);
    }
    s.skuCount++;
    if (p.is_promotion) s.promoCount++;
    if (p.last_scraped_at) {
      const hoursAgo = (now - new Date(p.last_scraped_at).getTime()) / 3_600_000;
      if (s.lastScrapedHoursAgo === null || hoursAgo < s.lastScrapedHoursAgo) {
        s.lastScrapedHoursAgo = hoursAgo;
      }
    }
  }

  // Tally which store has the cheapest per-piece price for each brand+size combo
  let comboCount = 0;
  for (const items of groupByBrandSize(allProducts).values()) {
    comboCount++;
    const cheapest = items.reduce((a, b) =>
      Number(a.price_per_piece) < Number(b.price_per_piece) ? a : b
    );
    const s = stats.get(cheapest.store_slug);
    if (s) s.wins++;
  }

  const ranked = [...stats.values()]
    .filter(s => s.skuCount > 0)
    .sort((a, b) => b.wins - a.wins);

  const topStore = ranked[0];
  const topWinShare = comboCount > 0 && topStore ? (topStore.wins / comboCount) * 100 : 0;

  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "কোন দোকানে সস্তা", item: "https://diaperdam.com/guide/cheapest-diaper-store-bangladesh" },
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
    headline: "কোন দোকানে ডায়াপার সবচেয়ে সস্তা? ৬টা দোকানের লাইভ তুলনা",
    inLanguage: "bn",
    datePublished: today,
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/cheapest-diaper-store-bangladesh",
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
              {" / "}কোন দোকানে সস্তা
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              কোন দোকানে ডায়াপার সবচেয়ে সস্তা?
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              একটা দোকানে অভ্যস্ত হয়ে যাওয়ার আগে আজকের ডেটা একবার দেখে নিন।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            বেশিরভাগ পরিবার একটা নির্দিষ্ট দোকান থেকেই বারবার কেনে, হয়তো বাসার কাছে বলে, বা আগে
            ভালো অভিজ্ঞতা হয়েছিল বলে। কিন্তু ডায়াপারের দাম দোকানভেদে প্রতিদিন বদলায়, আর কোন দোকান
            "সবসময় সস্তা" এই ধারণাটা আমাদের ডেটায় খুব একটা টেকে না।
          </p>

          {topStore && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 text-sm">
              <p>
                <strong>সংক্ষেপে:</strong> আজকের ডেটায় {comboCount}টা ব্র্যান্ড-সাইজ তুলনার মধ্যে{" "}
                <strong>{topStore.name}</strong> সবচেয়ে বেশি, <strong>{topStore.wins}</strong>টা
                (প্রায় {topWinShare.toFixed(0)}%)-এ সবচেয়ে সস্তা দাম দিচ্ছে। বাকিটা অন্তত{" "}
                {ranked.filter(s => s.wins > 0).length - 1} টা দোকানের মধ্যে ভাগ হয়ে আছে।
              </p>
            </div>
          )}

          {ranked.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">আজকের দোকান-ভিত্তিক তুলনা</h2>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="py-2 px-3 border border-slate-200">দোকান</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">সস্তার জয়</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">মোট SKU</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">প্রমোশনে</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">সবশেষ আপডেট</th>
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
                          {s.wins}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right">{s.skuCount}</td>
                        <td className="py-2 px-3 border border-slate-200 text-right">
                          {s.skuCount > 0 ? `${((s.promoCount / s.skuCount) * 100).toFixed(0)}%` : "—"}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right text-slate-500">
                          {s.lastScrapedHoursAgo !== null
                            ? s.lastScrapedHoursAgo < 1
                              ? "১ ঘণ্টার কম আগে"
                              : `${Math.round(s.lastScrapedHoursAgo)} ঘণ্টা আগে`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mb-6 text-sm text-slate-500">
                "সস্তার জয়" মানে {comboCount}টা ব্র্যান্ড-সাইজ সংমিশ্রণের মধ্যে ঐ দোকানে কতগুলোতে
                আজ সবচেয়ে কম প্রতি-পিস দাম পাওয়া যাচ্ছে।
              </p>
            </>
          )}

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেন কোনো এক দোকান সবসময় জেতে না</h2>
          <p className="mb-4">
            চালডাল বা স্বপ্নর মতো দোকান নিজে স্টক রাখে ও দাম ঠিক করে, তাই দাম কিছুটা স্থির থাকে।
            দারাজের মতো মার্কেটপ্লেসে একেকটা লিস্টিং একেক বিক্রেতার, তাই একদিন একটা সেলার প্রোমোশন
            চালালে সেই ব্র্যান্ড-সাইজে দারাজ হঠাৎ সবচেয়ে সস্তা হয়ে যায়, পরদিন প্রোমোশন শেষ হলে আবার
            অন্য দোকান এগিয়ে যায়।
          </p>
          <p className="mb-4">
            এই টেবিল বানাতে গিয়ে দেখা গেছে, ফার্মেসি-ঘরানার দোকান (যেমন আরোগ্য) সাধারণত কম SKU
            রাখে কিন্তু মাঝেমধ্যে নির্দিষ্ট একটা ব্র্যান্ডে সবচেয়ে সস্তা দাম দেয়, যেটা শুধু বড় দোকানে
            খুঁজলে চোখে পড়ত না।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেনার আগে কী করবেন</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>একটা দোকানে আটকে থাকবেন না:</strong> প্রতিবার কেনার আগে <a href="/diapers" className="text-emerald-700 hover:underline">ব্র্যান্ড × সাইজ গ্রিড</a>-এ একবার চেক করুন।</li>
            <li><strong>জয়ের সংখ্যা না, নিজের ব্র্যান্ড-সাইজ দেখুন:</strong> কোনো দোকান সার্বিকভাবে বেশি জিতলেও আপনার দরকারি নির্দিষ্ট সাইজে হয়তো অন্য দোকান এগিয়ে।</li>
            <li><strong>আপডেটের সময় দেখুন:</strong> কয়েক ঘণ্টা আগের দামই সাধারণত এখনো বলবৎ, কিন্তু নিশ্চিত হতে দোকানের পাতায় গিয়ে দেখে নিন।</li>
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
              <a href="/guide/best-store-by-diaper-brand-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                ব্র্যান্ড অনুযায়ী সেরা দোকান
              </a>
              <a href="/guide/store-switching-savings-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                দোকান বদলে সাশ্রয়
              </a>
              <a href="/guide/diaper-pack-size-price-trap" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                প্যাক সাইজ ফাঁদ
              </a>
              <a href="/guide/diaper-discount-frequency-by-store-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                প্রমোশনের ফ্রিকোয়েন্সি
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
