import type { Metadata } from "next";
import { getBrandProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";
import { BRAND_SLUGS } from "@/lib/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "কোন ব্র্যান্ডে বেল্ট-প্যান্ট দামের ফারাক সবচেয়ে বেশি? ব্র্যান্ড-ভিত্তিক তুলনা",
  description:
    "একই ব্র্যান্ড-সাইজে বেল্ট আর প্যান্ট ডায়াপারের প্রতি-পিস দাম কতটা আলাদা? আমাদের ডেটা দেখাচ্ছে কোন ব্র্যান্ডে ফারাক সবচেয়ে বেশি, আর কোথায় উল্টো প্যান্টই সস্তা পড়ে।",
  alternates: { canonical: "https://diaperdam.com/guide/belt-vs-pant-price-gap-by-brand" },
};

const FAQS = [
  {
    q: "প্যান্ট ডায়াপার কি সব ব্র্যান্ডেই বেল্টের চেয়ে দামি?",
    a: "না। বেশিরভাগ ব্র্যান্ডে প্যান্ট একটু বেশি দামি, কিন্তু নিচের টেবিলে দেখবেন কিছু ব্র্যান্ড-সাইজে উল্টোটা ঘটছে, প্যান্টের প্রতি-পিস দাম বেল্টের চেয়ে কমও পাওয়া যাচ্ছে। তাই ব্র্যান্ড না দেখে ধরে নেওয়াটা ঠিক না।",
  },
  {
    q: "ফারাকটা কেন ব্র্যান্ড ভেদে এত আলাদা?",
    a: "একেক ব্র্যান্ড একেক প্যাক সাইজে বেল্ট আর প্যান্ট বাজারজাত করে। কোনো ব্র্যান্ডের প্যান্ট বড় পরিবার-প্যাকে আসে বলে প্রতি-পিস দাম কমে যায়, আবার কোনো ব্র্যান্ডের বেল্ট প্রোমোশনে থাকলে সাময়িকভাবে সস্তা হয়ে যায়। তাই ফারাকটা স্থির কোনো নিয়ম মেনে চলে না।",
  },
  {
    q: "এই তুলনা কি সব সাইজে সমান প্রযোজ্য?",
    a: "না, নিচের টেবিলে শুধু সেই ব্র্যান্ড-সাইজগুলো আছে যেখানে আজ বেল্ট আর প্যান্ট দুটোই স্টকে পাওয়া যাচ্ছে। কোনো ব্র্যান্ড হয়তো নির্দিষ্ট একটা সাইজে শুধু প্যান্ট বানায়, সেখানে তুলনা সম্ভব না।",
  },
  {
    q: "বড় ফারাক দেখলে কি বেল্টেই থেকে যাওয়া উচিত?",
    a: "যদি বাচ্চা এখনো শুয়ে থাকার বয়সে থাকে, হ্যাঁ, বেল্টই সুবিধাজনক। কিন্তু হামাগুড়ি শুরু হয়ে গেলে দামের ফারাক যতই হোক, প্যান্টে পরানোর সুবিধাটা সাধারণত বেশি গুরুত্বপূর্ণ। দাম আর সুবিধা দুটো একসাথে দেখেই সিদ্ধান্ত নেওয়া ভালো।",
  },
  {
    q: "এই দাম কি আজকেরই, নাকি পুরনো?",
    a: "প্রতিদিন সব দোকান থেকে দাম টানা হয় বলে টেবিলটা আজকের ডেটা অনুযায়ী তৈরি। তবে কেনার ঠিক আগে ব্র্যান্ড পাতায় গিয়ে একবার নিশ্চিত হয়ে নেওয়া ভালো, কারণ স্টক আর প্রোমোশন দিনে দিনে বদলায়।",
  },
];

type BrandGap = {
  brand: string;
  brandSlug: string;
  size: string;
  beltPP: number;
  beltStore: string;
  pantsPP: number;
  pantsStore: string;
  gapTaka: number;
  gapPct: number;
};

function cheapestBySizeBrand(products: DiaperProduct[]): Map<string, DiaperProduct> {
  const best = new Map<string, DiaperProduct>();
  for (const p of products) {
    if (!p.size_label) continue;
    const key = `${p.brand_slug}|${p.size_label}`;
    const existing = best.get(key);
    if (!existing || Number(p.price_per_piece) < Number(existing.price_per_piece)) {
      best.set(key, p);
    }
  }
  return best;
}

function buildGaps(beltProducts: DiaperProduct[], pantsProducts: DiaperProduct[]): BrandGap[] {
  const beltBest = cheapestBySizeBrand(beltProducts);
  const pantsBest = cheapestBySizeBrand(pantsProducts);
  const gaps: BrandGap[] = [];

  for (const [key, belt] of beltBest) {
    const pants = pantsBest.get(key);
    if (!pants) continue;
    const beltPP = Number(belt.price_per_piece);
    const pantsPP = Number(pants.price_per_piece);
    gaps.push({
      brand: belt.brand,
      brandSlug: belt.brand_slug,
      size: belt.size_label as string,
      beltPP,
      beltStore: belt.store_name,
      pantsPP,
      pantsStore: pants.store_name,
      gapTaka: pantsPP - beltPP,
      gapPct: ((pantsPP - beltPP) / beltPP) * 100,
    });
  }
  return gaps;
}

export default async function BeltPantGapByBrandPage() {
  const perBrand = await Promise.all(
    BRAND_SLUGS.map(b => getBrandProducts(b).catch(() => [] as DiaperProduct[]))
  );
  const allProducts = perBrand.flat();
  const beltProducts = allProducts.filter(p => p.type === "belt");
  const pantsProducts = allProducts.filter(p => p.type === "pants");

  const gaps = buildGaps(beltProducts, pantsProducts);
  const sortedByGap = [...gaps].sort((a, b) => b.gapPct - a.gapPct);
  const reversals = gaps.filter(g => g.gapTaka < 0).sort((a, b) => a.gapPct - b.gapPct);

  const avgGapPct = gaps.length > 0
    ? gaps.reduce((sum, g) => sum + g.gapPct, 0) / gaps.length
    : 0;

  const widestGap = sortedByGap[0];
  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "ব্র্যান্ড-ভিত্তিক বেল্ট-প্যান্ট দামের ফারাক", item: "https://diaperdam.com/guide/belt-vs-pant-price-gap-by-brand" },
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
    headline: "কোন ব্র্যান্ডে বেল্ট-প্যান্ট দামের ফারাক সবচেয়ে বেশি? ব্র্যান্ড-ভিত্তিক তুলনা",
    inLanguage: "bn",
    datePublished: today,
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/belt-vs-pant-price-gap-by-brand",
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
              {" / "}ব্র্যান্ড-ভিত্তিক বেল্ট-প্যান্ট ফারাক
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              কোন ব্র্যান্ডে বেল্ট-প্যান্ট দামের ফারাক সবচেয়ে বেশি?
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              একই সাইজে বেল্ট আর প্যান্টের প্রতি-পিস দাম ব্র্যান্ড অনুযায়ী কতটা আলাদা, আজকের ডেটায়।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            প্যান্ট ডায়াপার বেল্টের চেয়ে দামি, এটা প্রায় সবাই ধরে নেয়। কিন্তু কতটা দামি সেটা এক ব্র্যান্ড
            থেকে আরেক ব্র্যান্ডে অনেকটাই বদলায়, আর কিছু ক্ষেত্রে ফারাকটা উল্টেও যায়। ব্র্যান্ড না দেখে
            শুধু "প্যান্ট মানেই বেশি দাম" ধরে নিলে ভুল সিদ্ধান্ত হতে পারে।
          </p>

          {gaps.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 text-sm">
              <p>
                <strong>সংক্ষেপে:</strong> আজকের ডেটায় {gaps.length}টা ব্র্যান্ড-সাইজ তুলনার গড় ফারাক{" "}
                <strong>{avgGapPct >= 0 ? "+" : ""}{avgGapPct.toFixed(0)}%</strong> (প্যান্ট বেল্টের চেয়ে
                গড়ে এতটা বেশি বা কম)।{" "}
                {widestGap && (
                  <>
                    সবচেয়ে বড় ফারাক <strong>{widestGap.brand}</strong> ব্র্যান্ডের সাইজ{" "}
                    <strong>{widestGap.size}</strong>-এ, প্রায়{" "}
                    <strong>{widestGap.gapPct >= 0 ? "+" : ""}{widestGap.gapPct.toFixed(0)}%</strong>।
                  </>
                )}{" "}
                {reversals.length > 0 && (
                  <>এর মধ্যে {reversals.length}টা ক্ষেত্রে প্যান্টই বেল্টের চেয়ে সস্তা।</>
                )}
              </p>
            </div>
          )}

          {sortedByGap.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">ব্র্যান্ড-সাইজ অনুযায়ী দামের ফারাক</h2>
              <p className="mb-3 text-sm text-slate-500">
                ফারাক বড় থেকে ছোট সাজানো, দুটোই সেদিন স্টকে থাকা সবচেয়ে সস্তা লিস্টিং।
              </p>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="py-2 px-3 border border-slate-200">ব্র্যান্ড / সাইজ</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">বেল্ট (প্রতি পিস)</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">প্যান্ট (প্রতি পিস)</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">ফারাক</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedByGap.slice(0, 12).map((g, i) => (
                      <tr key={`${g.brandSlug}-${g.size}-${i}`}>
                        <td className="py-2 px-3 border border-slate-200 font-medium">
                          <a href={`/brand/${g.brandSlug}`} className="text-emerald-700 hover:underline">
                            {g.brand}
                          </a>{" "}
                          {g.size}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right">
                          ৳{g.beltPP.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right">
                          ৳{g.pantsPP.toFixed(2)}
                        </td>
                        <td
                          className={`py-2 px-3 border border-slate-200 text-right font-semibold ${
                            g.gapTaka < 0 ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          {g.gapPct >= 0 ? "+" : ""}{g.gapPct.toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mb-6 text-sm text-slate-500">
                সবুজ রঙের ফারাক মানে ঐ ব্র্যান্ড-সাইজে প্যান্ট আসলে বেল্টের চেয়ে সস্তা পড়ছে।
              </p>
            </>
          )}

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেন ফারাকটা ব্র্যান্ড ভেদে এত আলাদা</h2>
          <p className="mb-4">
            বেশিরভাগ ব্র্যান্ড প্যান্টে বেশি ইলাস্টিক আর আলাদা কাটিং ব্যবহার করে, তাই উৎপাদন খরচ কিছুটা বেশি
            পড়ে। কিন্তু প্যাক সাইজিং একেক ব্র্যান্ডে একেক রকম, কোনো ব্র্যান্ড প্যান্ট শুধু বড় পরিবার-প্যাকে
            বিক্রি করে বলে প্রতি-পিস দাম কমে যায়, আবার বেল্ট ছোট ট্রায়াল প্যাকে থাকলে সেটার দাম বেশি দেখায়।
          </p>
          <p className="mb-4">
            এই টেবিল বানানোর সময় দেখা গেল, যে ব্র্যান্ডগুলোতে দারাজে একাধিক বিক্রেতা একই প্রোডাক্ট লিস্ট করে,
            সেখানে ফারাকটা দিনে দিনে বদলায়, কারণ কোনো একদিন বেল্ট প্রোমোশনে থাকলে সাময়িকভাবে ফারাক বেড়ে
            যায়, প্রোমোশন শেষ হলে আবার কমে আসে।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেনার আগে কী করবেন</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>নিজের ব্র্যান্ডটাই দেখুন:</strong> গড় ফারাক জেনে লাভ নেই, আপনি যে ব্র্যান্ড ব্যবহার করেন সেটার নির্দিষ্ট সাইজে ফারাক কত সেটাই আসল প্রশ্ন।</li>
            <li><strong>উল্টো ঘটনায় নজর রাখুন:</strong> ওপরের সবুজ সারিগুলোতে প্যান্ট আসলে সস্তা, সেই ব্র্যান্ডে বেল্ট থেকে প্যান্টে বদলানোর কোনো আর্থিক বাধা নেই।</li>
            <li><strong>ব্র্যান্ড পাতায় চেক করুন:</strong> প্রতিটা <a href="/brand/pampers" className="text-emerald-700 hover:underline">ব্র্যান্ড পাতায়</a> সব টাইপ একসাথে প্রতি-পিস দামে সাজানো আছে।</li>
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
              <a href="/guide/belt-vs-pant-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                বেল্ট বনাম প্যান্ট গাইড
              </a>
              <a href="/guide/diaper-pack-size-price-trap" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                প্যাক সাইজ ফাঁদ
              </a>
              <a href="/guide/cheapest-diaper-store-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                কোন দোকানে সস্তা
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
