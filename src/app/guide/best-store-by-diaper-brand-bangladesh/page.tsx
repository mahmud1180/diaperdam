import type { Metadata } from "next";
import { getBrandProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";
import { BRAND_SLUGS } from "@/lib/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "কোন ব্র্যান্ডের ডায়াপার কোন দোকানে কিনবেন? ব্র্যান্ড-ভিত্তিক দোকান গাইড",
  description:
    "Pampers, Huggies, MamyPoko, Molfix সহ প্রতিটা ব্র্যান্ডের জন্য কোন দোকানে সবচেয়ে বেশিবার সস্তা দাম মেলে, আমাদের লাইভ ডেটা থেকে ব্র্যান্ড-বাই-ব্র্যান্ড তালিকা।",
  alternates: { canonical: "https://diaperdam.com/guide/best-store-by-diaper-brand-bangladesh" },
};

const BRAND_NAME_BN: Record<string, string> = {
  pampers: "প্যাম্পারস",
  huggies: "হাগিস",
  mamypoko: "ম্যামিপোকো",
  molfix: "মলফিক্স",
  bashundhara: "বসুন্ধরা",
  neocare: "নিওকেয়ার",
  supermom: "সুপারমম",
  savlon: "স্যাভলন",
  avonee: "অ্যাভোনি",
  aiwibi: "আইউইবি",
  "happy-nappy": "হ্যাপি ন্যাপি",
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
    q: "একই ব্র্যান্ডে সব দোকানে কি একই দাম থাকে?",
    a: "না। একই ব্র্যান্ড-সাইজের প্রোডাক্ট দোকানভেদে ভিন্ন দামে বিক্রি হয়, কারণ প্রতিটা দোকান নিজের মতো দাম ঠিক করে আর প্রমোশন চালায়। তাই একটা ব্র্যান্ড কিনতে চাইলেও কোন দোকানে যাবেন সেটা আলাদা প্রশ্ন।",
  },
  {
    q: "নিচের টেবিলে 'জয়ের শেয়ার' মানে কী?",
    a: "একটা ব্র্যান্ডের প্রতিটা সাইজে (Newborn থেকে XXL) কোন দোকান সবচেয়ে কম প্রতি-পিস দাম দিচ্ছে সেটা গোনা হয়েছে। জয়ের শেয়ার মানে সেই ব্র্যান্ডের মোট সাইজের মধ্যে কত শতাংশে একটা নির্দিষ্ট দোকান সবচেয়ে সস্তা।",
  },
  {
    q: "একটা দোকান একটা ব্র্যান্ডে সবসময় জিতলে সেখানেই কিনব?",
    a: "সাধারণত ভালো শুরু, কিন্তু জয়ের শেয়ার ১০০% না হলে মাঝেমধ্যে অন্য দোকান এগিয়ে যায়। যে সাইজ আপনার দরকার সেটার জন্য প্রোডাক্ট পাতায় গিয়ে আজকের দাম একবার নিশ্চিত করে নেওয়া ভালো।",
  },
  {
    q: "যে ব্র্যান্ডে কোনো দোকান সব সময় জেতে না, তার মানে কি?",
    a: "মানে ঐ ব্র্যান্ডের দাম দোকানগুলোর মধ্যে প্রতিযোগিতামূলক। প্রায়ই একটা দোকান এক সাইজে সস্তা তো আরেকটা দোকান অন্য সাইজে। এই ব্র্যান্ডগুলোতে একটা দোকানে অভ্যস্ত হয়ে যাওয়া সবচেয়ে বেশি ক্ষতির কারণ হতে পারে।",
  },
  {
    q: "এই তালিকা কত ঘন ঘন আপডেট হয়?",
    a: "প্রতিদিন একবার সব দোকান থেকে দাম টানা হয়, আর এই পাতা প্রতি ঘণ্টায় নতুন করে হিসাব করে। তাই আজকের হিসাব আজকের বাস্তব দামের সঙ্গে মেলে।",
  },
];

type BrandRow = {
  slug: string;
  name: string;
  topStore: string | null;
  topStoreSlug: string | null;
  topWins: number;
  totalSizes: number;
  topShare: number;
  runnerUpStore: string | null;
  runnerUpWins: number;
};

function cheapestStorePerSize(products: DiaperProduct[]): Map<string, string> {
  const bySize = new Map<string, DiaperProduct[]>();
  for (const p of products) {
    if (!p.size_label) continue;
    const arr = bySize.get(p.size_label);
    if (arr) arr.push(p);
    else bySize.set(p.size_label, [p]);
  }
  const winners = new Map<string, string>();
  for (const [size, items] of bySize) {
    const cheapest = items.reduce((a, b) =>
      Number(a.price_per_piece) < Number(b.price_per_piece) ? a : b
    );
    winners.set(size, cheapest.store_slug);
  }
  return winners;
}

export default async function BestStoreByBrandPage() {
  const perBrand = await Promise.all(
    BRAND_SLUGS.map(async slug => {
      const products = await getBrandProducts(slug).catch(() => [] as DiaperProduct[]);
      return { slug, products };
    })
  );

  const rows: BrandRow[] = [];
  for (const { slug, products } of perBrand) {
    const winners = cheapestStorePerSize(products);
    if (winners.size === 0) continue;

    const tally = new Map<string, number>();
    for (const storeSlug of winners.values()) {
      tally.set(storeSlug, (tally.get(storeSlug) ?? 0) + 1);
    }
    const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
    const [topSlug, topWins] = ranked[0];
    const runnerUp = ranked[1];

    rows.push({
      slug,
      name: BRAND_NAME_BN[slug] ?? slug,
      topStore: STORE_NAME_BN[topSlug] ?? topSlug,
      topStoreSlug: topSlug,
      topWins,
      totalSizes: winners.size,
      topShare: (topWins / winners.size) * 100,
      runnerUpStore: runnerUp ? STORE_NAME_BN[runnerUp[0]] ?? runnerUp[0] : null,
      runnerUpWins: runnerUp ? runnerUp[1] : 0,
    });
  }

  rows.sort((a, b) => b.topShare - a.topShare);

  const dominatedCount = rows.filter(r => r.topShare === 100).length;
  const splitCount = rows.filter(r => r.topShare < 60).length;
  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "ব্র্যান্ড অনুযায়ী সেরা দোকান", item: "https://diaperdam.com/guide/best-store-by-diaper-brand-bangladesh" },
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
    headline: "কোন ব্র্যান্ডের ডায়াপার কোন দোকানে কিনবেন?",
    inLanguage: "bn",
    datePublished: today,
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/best-store-by-diaper-brand-bangladesh",
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
              {" / "}ব্র্যান্ড অনুযায়ী সেরা দোকান
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              কোন ব্র্যান্ডের ডায়াপার কোন দোকানে কিনবেন?
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              "কোন দোকান সবচেয়ে সস্তা" প্রশ্নটা ব্র্যান্ডভেদে ভিন্ন উত্তর দেয়, প্রতিটা ব্র্যান্ডের জন্য আলাদা করে দেখুন।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            আমাদের <a href="/guide/cheapest-diaper-store-bangladesh" className="text-emerald-700 hover:underline">সার্বিক দোকান তুলনায়</a> দেখা যায় কোনো একটা দোকান সব মিলিয়ে সবচেয়ে বেশি সস্তা জেতে। কিন্তু আপনি একটা নির্দিষ্ট ব্র্যান্ড কিনতে চাইলে সেই গড় হিসাব খুব একটা কাজে লাগে না, কারণ একটা ব্র্যান্ডে যে দোকান সবসময় এগিয়ে, আরেকটা ব্র্যান্ডে সেই একই দোকান পিছিয়ে থাকতে পারে।
          </p>

          {rows.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 text-sm">
              <p>
                <strong>সংক্ষেপে:</strong> {rows.length}টা ব্র্যান্ডের মধ্যে {dominatedCount}টায় একটাই দোকান
                সবসময় (১০০%) সবচেয়ে সস্তা জিতছে, কিন্তু {splitCount}টা ব্র্যান্ডে জয়ের শেয়ার ৬০%-এর নিচে।
                মানে এই ব্র্যান্ডগুলোতে দোকান বদলে বদলে সস্তা দাম মেলে, কেনার আগে চেক করা জরুরি।
              </p>
            </div>
          )}

          {rows.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">ব্র্যান্ড অনুযায়ী কোন দোকান এগিয়ে</h2>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="py-2 px-3 border border-slate-200">ব্র্যান্ড</th>
                      <th className="py-2 px-3 border border-slate-200">সবচেয়ে বেশি জেতা দোকান</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">জয়ের শেয়ার</th>
                      <th className="py-2 px-3 border border-slate-200">বিকল্প দোকান</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.slug}>
                        <td className="py-2 px-3 border border-slate-200 font-medium">
                          <a href={`/brand/${r.slug}`} className="text-emerald-700 hover:underline">
                            {r.name}
                          </a>
                        </td>
                        <td className="py-2 px-3 border border-slate-200">
                          <a href={`/store/${r.topStoreSlug}`} className="text-emerald-700 hover:underline">
                            {r.topStore}
                          </a>
                        </td>
                        <td className={`py-2 px-3 border border-slate-200 text-right font-semibold ${r.topShare < 60 ? "text-amber-600" : "text-emerald-700"}`}>
                          {r.topShare.toFixed(0)}% ({r.topWins}/{r.totalSizes})
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-slate-500">
                          {r.runnerUpStore ? `${r.runnerUpStore} (${r.runnerUpWins})` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mb-6 text-sm text-slate-500">
                হিসাব করা হয়েছে প্রতিটা ব্র্যান্ডের প্রতিটা সাইজে (Newborn-XXL, যেখানে ডেটা আছে) কোন দোকান আজ
                সবচেয়ে কম প্রতি-পিস দাম দিচ্ছে তার ওপর ভিত্তি করে।
              </p>
            </>
          )}

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেন এক ব্র্যান্ডের জন্য অন্য দোকান ভালো</h2>
          <p className="mb-4">
            গ্রোসারি-ঘরানার দোকান (চালডাল, স্বপ্ন) নিজেরাই স্টক কেনে, তাই যে ব্র্যান্ডের সঙ্গে তাদের সরাসরি
            ডিস্ট্রিবিউশন সম্পর্ক ভালো, সেই ব্র্যান্ডে তারা টানা কম দাম দিতে পারে। অন্যদিকে দারাজের মতো
            মার্কেটপ্লেসে একেক ব্র্যান্ডের একেক সেলার, তাই কোনো একটা ব্র্যান্ডে একদিন বড় প্রোমোশন চললে
            হঠাৎ সেই ব্র্যান্ডে দারাজ সবচেয়ে সস্তা হয়ে যায়, আবার অন্য ব্র্যান্ডে তার ধারেকাছেও থাকে না।
          </p>
          <p className="mb-4">
            এই তালিকা বানাতে গিয়ে দেখা গেছে যে ব্র্যান্ড হাতে গোনা কয়েকটা দোকানে পাওয়া যায়, সেখানে
            একটা দোকানই (প্রায়ই দারাজ) প্রায় সব সাইজে সবচেয়ে সস্তা থাকে, কারণ তুলনা করার মতো প্রতিদ্বন্দ্বীই
            কম। কিন্তু MamyPoko বা Molfix-এর মতো ব্র্যান্ড, যেগুলো গ্রোসারি অ্যাপ আর মার্কেটপ্লেস দুই জায়গাতেই
            পাওয়া যায়, সেখানে প্রকৃত প্রতিযোগিতা চলে, জয়ের শেয়ার ৫০-৬৭%-এ নেমে আসে।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেনার আগে কী করবেন</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>নির্দিষ্ট ব্র্যান্ড খুঁজলে:</strong> উপরের টেবিলে সেই ব্র্যান্ডের সবচেয়ে বেশি জেতা দোকান দেখুন, তারপর ব্র্যান্ড পাতায় গিয়ে আজকের দাম নিশ্চিত করুন।</li>
            <li><strong>জয়ের শেয়ার ৬০%-এর নিচে হলে:</strong> শুধু একটা দোকান না দেখে বিকল্প দোকানের দামও একবার মিলিয়ে নিন।</li>
            <li><strong>একাধিক ব্র্যান্ড একসঙ্গে কিনলে:</strong> <a href="/diapers" className="text-emerald-700 hover:underline">ব্র্যান্ড × সাইজ গ্রিড</a>-এ পুরো তালিকা একসঙ্গে দেখে নিন।</li>
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
                সার্বিকভাবে কোন দোকান সস্তা
              </a>
              <a href="/guide/best-diaper-brands-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সেরা ডায়াপার ব্র্যান্ড
              </a>
              <a href="/guide/store-switching-savings-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                দোকান বদলে সাশ্রয়
              </a>
              <a href="/guide/diaper-discount-frequency-by-store-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                প্রমোশনের ফ্রিকোয়েন্সি
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
