import type { Metadata } from "next";
import { getBrandProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";
import { BRAND_SLUGS } from "@/lib/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "জাম্বো প্যাক মানেই কি সস্তা? ডায়াপারের দামে একটা লুকানো ফাঁদ",
  description:
    "বড় প্যাক কিনলে প্রতি-পিস দাম কমার কথা, কিন্তু আমাদের ডেটায় প্রায় প্রতি তিনটা তুলনার একটায় উল্টো ঘটনা ঘটে। কোন ব্র্যান্ডে এই ফাঁদ ধরা পড়েছে আর কেনার আগে কী চেক করবেন।",
  alternates: { canonical: "https://diaperdam.com/guide/diaper-pack-size-price-trap" },
};

// Listings priced above this per piece are almost always a mislabeled bulk/carton
// SKU, not a genuine "jumbo pack" a parent would buy, so exclude before comparing.
const PRICE_SANITY_CAP = 50;

const FAQS = [
  {
    q: "সব ব্র্যান্ডে কি এই ফাঁদ আছে?",
    a: "না, সবগুলোতে না। নিচের টেবিলে যে ব্র্যান্ডগুলো দেখাচ্ছি সেগুলোতে আজকের ডেটায় স্পষ্ট ধরা পড়েছে। বাকি ব্র্যান্ডে হয়তো বড় প্যাক সত্যিই সস্তা, অথবা তুলনা করার মতো একাধিক প্যাক সাইজ আজ স্টকে নেই। তাই কেনার আগে নির্দিষ্ট ব্র্যান্ড আর সাইজের পাতায় ঢুকে নিজে চেক করাটাই নিরাপদ।",
  },
  {
    q: "এটা কি ডেটা ভুল, নাকি সত্যিকারের দামের পার্থক্য?",
    a: "দুটোই হতে পারে, তাই আমরা প্রতি-পিস ৫০ টাকার বেশি এমন লিস্টিং হিসাব থেকে বাদ দিয়েছি। সেগুলো বেশিরভাগ সময় কার্টন বা বাল্ক-সেলার লিস্টিং যেটা প্যাক সাইজ ভুল লেখা। যা বাকি থাকে সেটাই সাধারণ পরিবারের কেনা প্যাকের মধ্যে তুলনা, আর সেখানেও ফারাকটা টিকে থাকে।",
  },
  {
    q: "কেন একটা মার্কেটপ্লেসে বড় প্যাক দামি হতে পারে?",
    a: "দারাজের মতো মার্কেটপ্লেসে একই ব্র্যান্ডের বিভিন্ন প্যাক সাইজ প্রায়ই আলাদা আলাদা বিক্রেতা লিস্ট করেন। একজন বিক্রেতা ছোট প্যাকে প্রোমোশন চালাচ্ছেন, আরেকজন বড় প্যাকে নিয়মিত দাম রেখেছেন। কোনো কেন্দ্রীয় শেলফ প্রাইসিং নেই যেটা নিশ্চিত করবে বড় মানেই সস্তা। চালডাল বা স্বপ্নর মতো একক-বিক্রেতা দোকানে এই ফাঁদ কম দেখা যায়।",
  },
  {
    q: "তাহলে সবসময় ছোট প্যাক কেনা উচিত?",
    a: "না। বেশিরভাগ ক্ষেত্রে বড় প্যাকই এখনো সস্তা পড়ে, আমাদের ডেটায় প্রায় দুই-তৃতীয়াংশ তুলনায় সেটাই সত্যি। কথাটা হলো ধরে নেওয়া চলবে না। প্রতি-পিস দাম না দেখে শুধু প্যাক সাইজ দেখে সিদ্ধান্ত নিলে মাঝেমধ্যে উল্টো ফল হতে পারে, এটাই মূল কথা।",
  },
  {
    q: "কেনার আগে কীভাবে দ্রুত চেক করব?",
    a: "প্রতিটা ব্র্যান্ড পাতায় আমরা প্রতি-পিস দাম অনুযায়ী সাজিয়ে রাখি, তাই সবচেয়ে ওপরের লিস্টিংটাই আজকের সবচেয়ে সস্তা প্যাক, সেটা ছোট হোক বা বড়। প্যাকের গায়ের মোট দাম না দেখে ওই সাজানো তালিকাটা একবার দেখে নিলেই যথেষ্ট।",
  },
];

type TrapPair = {
  brand: string;
  brandSlug: string;
  size: string;
  store: string;
  smallQty: number;
  smallPP: number;
  bigQty: number;
  bigPP: number;
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

function findTraps(products: DiaperProduct[]): TrapPair[] {
  const traps: TrapPair[] = [];
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
        if (ppBig > ppSmall) {
          traps.push({
            brand: small.brand,
            brandSlug: small.brand_slug,
            size: small.size_label as string,
            store: small.store_name,
            smallQty: small.pack_qty,
            smallPP: ppSmall,
            bigQty: big.pack_qty,
            bigPP: ppBig,
            pct: ((ppBig - ppSmall) / ppSmall) * 100,
          });
        }
      }
    }
  }
  return traps;
}

function countComparablePairs(products: DiaperProduct[]): number {
  let count = 0;
  for (const items of groupBySizeStore(products).values()) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[i].pack_qty === items[j].pack_qty) continue;
        const ppI = Number(items[i].price_per_piece);
        const ppJ = Number(items[j].price_per_piece);
        if (ppI >= PRICE_SANITY_CAP || ppJ >= PRICE_SANITY_CAP) continue;
        count++;
      }
    }
  }
  return count;
}

export default async function PackSizeTrapPage() {
  const perBrand = await Promise.all(
    BRAND_SLUGS.map(b => getBrandProducts(b).catch(() => [] as DiaperProduct[]))
  );
  const allProducts = perBrand.flat();

  const traps = findTraps(allProducts);
  const totalPairs = countComparablePairs(allProducts);
  const trapPct = totalPairs > 0 ? (traps.length / totalPairs) * 100 : 0;

  // A near-identical pack qty (e.g. 40 vs 42) at a 2-4x price jump is a mismatched
  // listing, not a genuine pack-size effect — keep the showcase to believable jumps.
  const believableTraps = traps.filter(t => t.pct >= 2 && t.pct <= 30);
  const bestPerBrand = new Map<string, TrapPair>();
  for (const t of believableTraps) {
    const existing = bestPerBrand.get(t.brandSlug);
    if (!existing || t.pct > existing.pct) bestPerBrand.set(t.brandSlug, t);
  }
  const showcase = [...bestPerBrand.values()].sort((a, b) => b.pct - a.pct).slice(0, 6);

  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "প্যাক সাইজ ফাঁদ", item: "https://diaperdam.com/guide/diaper-pack-size-price-trap" },
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
    headline: "জাম্বো প্যাক মানেই কি সস্তা? ডায়াপারের দামে একটা লুকানো ফাঁদ",
    inLanguage: "bn",
    datePublished: today,
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/diaper-pack-size-price-trap",
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
              {" / "}জাম্বো প্যাক ফাঁদ
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              জাম্বো প্যাক মানেই কি সস্তা? একটা লুকানো ফাঁদ
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              বড় প্যাকে প্রতি-পিস দাম কমার কথা। আমাদের আজকের ডেটা বলছে সবসময় না।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            দোকানে বা অনলাইনে ডায়াপার কেনার সময় সবাই একটা জিনিস ধরে নেয়: প্যাক যত বড়, প্রতি-পিস
            দাম তত কম। বাল্কে কিনলে সাশ্রয় হয়, এই ধারণাটা মুদি বাজারে বেশিরভাগ সময় ঠিকও। কিন্তু
            ডায়াপারের ক্ষেত্রে, বিশেষ করে দারাজের মতো মাল্টি-সেলার মার্কেটপ্লেসে, ব্যাপারটা সবসময় খাটে না।
          </p>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              <strong>সংক্ষেপে:</strong> আজকের ডেটায় একই ব্র্যান্ড-সাইজ-দোকানের মধ্যে তুলনাযোগ্য প্যাক-জোড়ার
              প্রায় <strong>{trapPct.toFixed(0)}%</strong>-এ বড় প্যাকের প্রতি-পিস দাম ছোট প্যাকের চেয়ে
              বেশি। মানে প্রায় প্রতি তিনটার একটায় "বড় মানেই সস্তা" এই ধারণাটা ভুল প্রমাণিত হচ্ছে।
            </p>
          </div>

          {showcase.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">আজকের ধরা পড়া উদাহরণ</h2>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="py-2 px-3 border border-slate-200">ব্র্যান্ড / সাইজ</th>
                      <th className="py-2 px-3 border border-slate-200">দোকান</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">ছোট প্যাক</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">বড় প্যাক</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">ফারাক</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showcase.map((t, i) => (
                      <tr key={`${t.brandSlug}-${t.size}-${i}`}>
                        <td className="py-2 px-3 border border-slate-200 font-medium">
                          <a href={`/brand/${t.brandSlug}`} className="text-emerald-700 hover:underline">
                            {t.brand}
                          </a>{" "}
                          {t.size}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-slate-500">{t.store}</td>
                        <td className="py-2 px-3 border border-slate-200 text-right">
                          {t.smallQty} পিস (৳{t.smallPP.toFixed(2)}/পিস)
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right">
                          {t.bigQty} পিস (৳{t.bigPP.toFixed(2)}/পিস)
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right font-semibold text-amber-700">
                          +{t.pct.toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mb-6 text-sm text-slate-500">
                প্রতিটা সারিতে ছোট আর বড়, দুটোই একই দোকান থেকে, তাই ডেলিভারি চার্জ বা বিক্রেতা ভিন্ন হওয়ার
                কারণে দাম বদলায়নি, সরাসরি প্যাক সাইজের তুলনা।
              </p>
            </>
          )}

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেন এমন হয়</h2>
          <p className="mb-4">
            চালডাল বা স্বপ্নর মতো দোকানে একটা ব্র্যান্ডের সব প্যাক সাইজ একই বিক্রেতা, একই গুদাম থেকে আসে,
            তাই দাম মোটামুটি স্কেল-অনুযায়ী সাজানো থাকে। দারাজে উল্টো, একই ব্র্যান্ডের ছোট প্যাকটা এক
            বিক্রেতা প্রোমোশনে বিক্রি করছেন, বড় প্যাকটা আরেক বিক্রেতা নিয়মিত দামে রেখেছেন। কোনো কেন্দ্রীয়
            নিয়ম নেই যা নিশ্চিত করবে বড় প্যাক সবসময় সস্তা পড়বে।
          </p>
          <p className="mb-4">
            এই টেবিল বানানোর জন্য ডেটা টানার সময় দেখলাম, কিছু ব্র্যান্ডের ছোট ট্রায়াল প্যাক (৪-৫ পিস) আসলে
            পরিবার-সাইজ প্যাকের চেয়ে প্রতি-পিসে সস্তা। কারণ ট্রায়াল প্যাকগুলো নতুন ক্রেতা টানার জন্য
            ইচ্ছাকৃতভাবে কম দামে রাখা হয়, বড় প্যাক তখনো নিয়মিত দামে বিক্রি হচ্ছে।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেনার আগে কী চেক করবেন</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>মোট দাম না, প্রতি-পিস দাম দেখুন:</strong> প্যাকের গায়ে লেখা দামটা ভুলে যান, হিসাব করুন এক পিস কত পড়ছে।</li>
            <li><strong>ব্র্যান্ড পাতায় সাজানো তালিকা ব্যবহার করুন:</strong> প্রতিটা <a href="/brand/pampers" className="text-emerald-700 hover:underline">ব্র্যান্ড পাতায়</a> প্রতি-পিস দাম অনুযায়ী সাজানো আছে, সবচেয়ে ওপরেরটাই আজকের সবচেয়ে সস্তা।</li>
            <li><strong>ছোট প্যাকও বাদ দেবেন না:</strong> অনেক সময় ছোট প্যাক প্রোমোশনে থাকলে সেটাই সস্তা পড়ে, শুধু বড় প্যাক খুঁজলে সেটা চোখ এড়িয়ে যায়।</li>
            <li><strong>প্রতিদিন বদলায়:</strong> আজ যে প্যাক সস্তা, কাল নাও থাকতে পারে, কেনার ঠিক আগে একবার চেক করে নেওয়াই ভালো।</li>
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
              <a href="/guide/diaper-budget-monthly" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                মাসিক বাজেট গাইড
              </a>
              <a href="/guide/local-vs-imported-diaper-brands-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                দেশি বনাম বিদেশি ব্র্যান্ড
              </a>
              <a href="/guide/huggies-vs-pampers-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                হাগিস বনাম প্যাম্পারস
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
