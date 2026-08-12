import type { Metadata } from "next";
import { getBrandProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";
import { BRAND_SLUGS } from "@/lib/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "কোন দোকানে প্রমোশন বেশি চলে? আর কতবার প্রমোশনের দামও আসলে সস্তা না",
  description:
    "৬টা দোকানের লাইভ ডেটায় কোথায় সবচেয়ে বেশি ডায়াপার প্রমোশনে থাকে, গড় ডিসকাউন্ট কত, আর কতবার 'প্রমোশন' ব্যাজ থাকা প্রোডাক্টও আসলে সেই ব্র্যান্ড-সাইজে সবচেয়ে সস্তা না, তা সরাসরি ডেটাবেস থেকে হিসাব করে দেখানো হয়েছে।",
  alternates: { canonical: "https://diaperdam.com/guide/diaper-discount-frequency-by-store-bangladesh" },
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
    q: "প্রমোশন ব্যাজ দেখলেই কি কেনা উচিত?",
    a: "না। নিচের হিসাবে দেখবেন, প্রমোশনে থাকা অনেক প্রোডাক্টই সেই ব্র্যান্ড-সাইজের মধ্যে আসলে সবচেয়ে সস্তা না। ডিসকাউন্ট শতাংশ আগের দামের ওপর হিসাব হয়, আর সেই আগের দামটাই বেশি রাখা থাকলে প্রমোশনের পরও অন্য দোকানের নিয়মিত দামের চেয়ে বেশি পড়ে।",
  },
  {
    q: "কোন দোকানে প্রমোশন বেশি থাকে মানে কি সেই দোকান সবসময় সস্তা?",
    a: "না, দুটো আলাদা জিনিস। প্রমোশনের সংখ্যা বেশি মানে শুধু এই যে ঐ দোকান বেশি প্রোডাক্টে ছাড়ের ব্যাজ লাগিয়ে রাখে। আসল সস্তা দোকান কোনটা সেটা জানতে হলে দেখতে হয় প্রতি-পিস দাম, ব্যাজ না।",
  },
  {
    q: "গড় ডিসকাউন্ট শতাংশ কীভাবে হিসাব হয়েছে?",
    a: "শুধু যে প্রোডাক্টগুলোতে আজ প্রমোশন সক্রিয় ও discount_pct ডেটা আছে, শুধু সেগুলোর গড় নেওয়া হয়েছে। প্রমোশনে নেই এমন প্রোডাক্ট এই হিসাবে ধরা হয়নি।",
  },
  {
    q: "এই ডেটা কতটা নির্ভরযোগ্য?",
    a: "প্রতিদিন একবার সব দোকান থেকে দাম ও প্রমোশন স্ট্যাটাস টানা হয়, তাই দিনভেদে সংখ্যা বদলাতে পারে। কেনার ঠিক আগে নির্দিষ্ট প্রোডাক্ট পেজে গিয়ে সবশেষ দাম দেখে নেওয়া ভালো।",
  },
  {
    q: "মার্কেটপ্লেস দোকানে (দারাজের মতো) প্রমোশন বেশি কেন?",
    a: "দারাজের মতো মার্কেটপ্লেসে একেকটা লিস্টিং একেক সেলারের, তাই প্রতিটা সেলার নিজের মতো ব্যাজ লাগাতে পারে। চালডাল বা স্বপ্নর মতো দোকান নিজে স্টক ও দাম ঠিক করে বলে প্রমোশন সাধারণত কম ও বেশি নিয়ন্ত্রিত থাকে।",
  },
];

type StoreStat = {
  slug: string;
  name: string;
  skuCount: number;
  promoCount: number;
  discountSum: number;
  discountN: number;
};

function groupKey(p: DiaperProduct): string {
  return `${p.brand_slug}|${p.size_label}`;
}

export default async function DiscountFrequencyPage() {
  const perBrand = await Promise.all(
    BRAND_SLUGS.map(b => getBrandProducts(b).catch(() => [] as DiaperProduct[]))
  );
  const allProducts = perBrand.flat();

  const stats = new Map<string, StoreStat>();
  for (const p of allProducts) {
    let s = stats.get(p.store_slug);
    if (!s) {
      s = { slug: p.store_slug, name: STORE_NAME_BN[p.store_slug] ?? p.store_name, skuCount: 0, promoCount: 0, discountSum: 0, discountN: 0 };
      stats.set(p.store_slug, s);
    }
    s.skuCount++;
    if (p.is_promotion) {
      s.promoCount++;
      if (p.discount_pct !== null) {
        s.discountSum += Number(p.discount_pct);
        s.discountN++;
      }
    }
  }

  const ranked = [...stats.values()]
    .filter(s => s.skuCount > 0)
    .map(s => ({
      ...s,
      promoPct: (s.promoCount / s.skuCount) * 100,
      avgDiscount: s.discountN > 0 ? s.discountSum / s.discountN : null,
    }))
    .sort((a, b) => b.promoPct - a.promoPct);

  // Group by brand+size to check whether promoted items are actually the cheapest
  const groups = new Map<string, DiaperProduct[]>();
  for (const p of allProducts) {
    if (!p.size_label) continue;
    const arr = groups.get(groupKey(p));
    if (arr) arr.push(p);
    else groups.set(groupKey(p), [p]);
  }

  let promotedTotal = 0;
  let promotedButNotCheapest = 0;
  for (const items of groups.values()) {
    if (items.length < 2) continue; // need at least 2 stores to compare
    const cheapestPrice = Math.min(...items.map(i => Number(i.price_per_piece)));
    for (const item of items) {
      if (!item.is_promotion) continue;
      promotedTotal++;
      if (Number(item.price_per_piece) > cheapestPrice) promotedButNotCheapest++;
    }
  }
  const misleadingPct = promotedTotal > 0 ? (promotedButNotCheapest / promotedTotal) * 100 : 0;

  const topPromoStore = ranked[0];
  const totalPromo = ranked.reduce((sum, s) => sum + s.promoCount, 0);
  const totalSku = ranked.reduce((sum, s) => sum + s.skuCount, 0);
  const overallPromoPct = totalSku > 0 ? (totalPromo / totalSku) * 100 : 0;

  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "প্রমোশনের ফ্রিকোয়েন্সি", item: "https://diaperdam.com/guide/diaper-discount-frequency-by-store-bangladesh" },
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
    headline: "কোন দোকানে প্রমোশন বেশি চলে? আর কতবার প্রমোশনের দামও আসলে সস্তা না",
    inLanguage: "bn",
    datePublished: today,
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/diaper-discount-frequency-by-store-bangladesh",
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
              {" / "}প্রমোশনের ফ্রিকোয়েন্সি
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              কোন দোকানে প্রমোশন বেশি চলে?
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              আর ব্যাজ দেখে কেনার আগে জেনে নিন প্রমোশনের দামও কতবার আসলে সস্তা না।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            প্রায় সব দোকানের পাতাতেই লাল ব্যাজ, "ছাড়", বা শতাংশ-অফের লেখা চোখে পড়ে। কিন্তু কোন
            দোকান আসলে বেশি প্রমোশন চালায়, আর ব্যাজ থাকা মানেই কি সেটা সেই ব্র্যান্ড-সাইজের মধ্যে
            সবচেয়ে সস্তা, এই দুটো প্রশ্নের উত্তর আজকের লাইভ ডেটা দিয়ে দেখা যাক।
          </p>

          {topPromoStore && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 text-sm">
              <p>
                <strong>সংক্ষেপে:</strong> আজ সব দোকান মিলিয়ে {totalSku}টা SKU-র মধ্যে{" "}
                {totalPromo}টা ({overallPromoPct.toFixed(0)}%) প্রমোশনে আছে।{" "}
                <strong>{topPromoStore.name}</strong>-এ প্রমোশনের হার সবচেয়ে বেশি,{" "}
                প্রায় {topPromoStore.promoPct.toFixed(0)}%। কিন্তু তুলনা করার মতো একাধিক দোকানে
                পাওয়া যায় এমন প্রমোশনের মধ্যে <strong>{misleadingPct.toFixed(0)}%</strong>-ই
                আসলে সেই ব্র্যান্ড-সাইজের সবচেয়ে সস্তা দাম না, কারণ অন্য কোনো দোকানে প্রমোশন ছাড়াই
                তার চেয়ে কম দাম পাওয়া যাচ্ছে।
              </p>
            </div>
          )}

          {ranked.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">দোকান-ভিত্তিক প্রমোশনের হার</h2>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="py-2 px-3 border border-slate-200">দোকান</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">প্রমোশনে</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">মোট SKU</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">হার</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">গড় ডিসকাউন্ট</th>
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
                          {s.promoCount}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right">{s.skuCount}</td>
                        <td className="py-2 px-3 border border-slate-200 text-right">{s.promoPct.toFixed(0)}%</td>
                        <td className="py-2 px-3 border border-slate-200 text-right text-slate-500">
                          {s.avgDiscount !== null ? `${s.avgDiscount.toFixed(0)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mb-6 text-sm text-slate-500">
                "হার" মানে ঐ দোকানের মোট SKU-র মধ্যে কত শতাংশ আজ প্রমোশনে আছে। "গড় ডিসকাউন্ট" শুধু
                প্রমোশনে থাকা প্রোডাক্টগুলোর মধ্যে যাদের ছাড়ের শতাংশ ডেটা আছে, তাদের গড়।
              </p>
            </>
          )}

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">প্রমোশন ব্যাজ কেন সবসময় বিশ্বাস করা যায় না</h2>
          <p className="mb-4">
            ডিসকাউন্ট শতাংশ হিসাব হয় "আগের দাম" ধরে, আর সেই আগের দামটা কতটা বাস্তব সেটা যাচাই করার
            উপায় সাধারণত থাকে না। একটা প্রোডাক্টে ৩০% ছাড় দেখানো হলেও যদি শুরুর দামটাই বাজারের
            স্বাভাবিক দামের চেয়ে বেশি রাখা হয়, তাহলে ৩০% ছাড়ের পরও দামটা অন্য দোকানের কোনো ছাড়
            ছাড়া দামের চেয়ে বেশি থেকে যেতে পারে।
          </p>
          <p className="mb-4">
            এই পাতা বানাতে গিয়ে দেখা গেছে, একাধিক দোকানে পাওয়া যায় এমন ব্র্যান্ড-সাইজ কম্বিনেশনের
            মধ্যে প্রমোশনে থাকা প্রোডাক্টের একটা উল্লেখযোগ্য অংশ আসলে সেই মুহূর্তে বাজারের সবচেয়ে
            সস্তা দাম না। তার মানে এই না যে প্রমোশন সবসময় ভুয়া, অনেক প্রমোশনই সত্যিকারের সস্তা দাম
            দেয়। কিন্তু ব্যাজ দেখে চোখ বন্ধ করে বিশ্বাস করাটা ঝুঁকিপূর্ণ, তাই প্রতিবার প্রতি-পিস
            দামটা অন্য দোকানের সঙ্গে মিলিয়ে দেখাই নিরাপদ।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেনার আগে কী করবেন</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>ব্যাজ না, প্রতি-পিস দাম দেখুন:</strong> <a href="/diapers" className="text-emerald-700 hover:underline">ব্র্যান্ড × সাইজ গ্রিড</a>-এ গিয়ে একই ব্র্যান্ড-সাইজের সব দোকানের দাম পাশাপাশি দেখুন।</li>
            <li><strong>শুধু আজকের সত্যিকারের সেরা ডিল দেখতে চাইলে</strong> <a href="/deals" className="text-emerald-700 hover:underline">আজকের অফার</a> পেজে যান, যেটা প্রতি-পিস দাম অনুযায়ী সাজানো, শুধু ব্যাজ অনুযায়ী না।</li>
            <li><strong>একটা দোকানের প্রমোশন-হার বেশি মানেই সেটা সবচেয়ে সস্তা দোকান না:</strong> কোন দোকান আসলে বেশি জেতে সেটা জানতে <a href="/guide/cheapest-diaper-store-bangladesh" className="text-emerald-700 hover:underline">কোন দোকানে সস্তা</a> গাইডটা দেখুন।</li>
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
              <a href="/guide/diaper-pack-size-price-trap" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                প্যাক সাইজ ফাঁদ
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
