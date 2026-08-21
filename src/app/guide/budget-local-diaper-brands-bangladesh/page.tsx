import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "সুপারমম, স্যাভলন নাকি অ্যাভোনি? বাজেট দেশি ব্র্যান্ড তুলনা ২০২৬",
  description:
    "বাংলাদেশের তিনটা বাজেট দেশি ডায়াপার ব্র্যান্ড, Supermom, Savlon আর Avonee, এর প্রতি-পিস দাম পাশাপাশি। কোনটা আসলেই সস্তা, আর কোনটায় মান নিয়ে অভিযোগ বেশি, আজকের আসল দামসহ।",
  alternates: { canonical: "https://diaperdam.com/guide/budget-local-diaper-brands-bangladesh" },
};

const SIZES = [
  { slug: "newborn", label: "Newborn", labelBn: "নবজাতক" },
  { slug: "s", label: "S", labelBn: "S" },
  { slug: "m", label: "M", labelBn: "M" },
  { slug: "l", label: "L", labelBn: "L" },
  { slug: "xl", label: "XL", labelBn: "XL" },
  { slug: "xxl", label: "XXL", labelBn: "XXL" },
];

const FAQS = [
  {
    q: "সুপারমম, স্যাভলন, অ্যাভোনি, এই তিনটার মধ্যে সবচেয়ে সস্তা কোনটা?",
    a: "আজকের ডেটায় Avonee প্রায় প্রতিটা সাইজেই সবচেয়ে কম দামে পড়ছে, প্রতি পিস হিসাবে। তবে ফারাক খুব বেশি না, S সাইজে Savlon-এর সাথে মাত্র ৩০-৪০ পয়সার তফাত। নিচের টেবিলে আজকের সংখ্যা দেখুন।",
  },
  {
    q: "Avonee-তে মান নিয়ে যে অভিযোগ শোনা যায়, সেটা কতটা সত্যি?",
    a: "রিভিউ ঘেঁটে দেখা যায় রাতে ব্যবহারে লিকের অভিযোগ তুলনামূলক বেশি আসে। দিনে টানা কয়েক ঘণ্টা ব্যবহারে সমস্যা কম, কিন্তু সারারাত এক ডায়াপারে রাখলে ঝুঁকি বাড়ে। বাজেট বাঁচাতে চাইলে দিনে Avonee, রাতে একটু বেশি শোষণক্ষমতার ব্র্যান্ড, এই মিশ্র পদ্ধতি অনেকে ব্যবহার করেন।",
  },
  {
    q: "Supermom-এর দাম বেশি হলেও কেন কিনবো?",
    a: "Square Toiletries-এর ব্র্যান্ড হওয়ায় সাপ্লাই চেইন আর কোয়ালিটি কন্ট্রোল তুলনামূলক স্থিতিশীল। প্যাকেট থেকে প্যাকেটে মান এদিক-ওদিক হওয়ার অভিযোগ কম। যাদের কাছে প্রতি মাসে ৫০-১০০ টাকা বেশি খরচ কোনো সমস্যা না, তাদের জন্য এই স্থিরতাই আসল সুবিধা।",
  },
  {
    q: "তিনটার মধ্যে কোনটায় বেল্ট আর কোনটায় প্যান্ট পাওয়া যায়?",
    a: "তিনটাই মূলত বেল্ট (টেপ) টাইপে পাওয়া যায়, কারণ এই দামের রেঞ্জে দেশি প্রস্তুতকারকরা প্যান্ট টাইপের জটিল মেশিনে এখনও কম বিনিয়োগ করেছেন। প্যান্ট টাইপ চাইলে এই বাজেটে Molfix বা MamyPoko দেখা ভালো।",
  },
  {
    q: "একই ব্র্যান্ডের দাম কি স্টোরভেদে অনেক আলাদা হয়?",
    a: "হ্যাঁ, মাঝে মাঝে চালডাল আর দারাজের মধ্যে একই সাইজে ৳৩-৮ ফারাক দেখা যায়। প্যাকেট কেনার আগে এই পাতায় ফিরে এসে আজকের দাম আরেকবার চেক করে নেওয়াই ভালো অভ্যাস।",
  },
];

export default async function BudgetLocalBrandsPage() {
  const [supermomAll, savlonAll, avoneeAll] = await Promise.all([
    getAllProducts({ brand_slug: "supermom", sort: "price_per_piece" }).catch(() => [] as DiaperProduct[]),
    getAllProducts({ brand_slug: "savlon", sort: "price_per_piece" }).catch(() => [] as DiaperProduct[]),
    getAllProducts({ brand_slug: "avonee", sort: "price_per_piece" }).catch(() => [] as DiaperProduct[]),
  ]);

  const rows = SIZES.map(s => {
    const sm = supermomAll.filter(p => p.size_label === s.label);
    const sv = savlonAll.filter(p => p.size_label === s.label);
    const av = avoneeAll.filter(p => p.size_label === s.label);
    return {
      ...s,
      supermom: sm[0] ?? null,
      savlon: sv[0] ?? null,
      avonee: av[0] ?? null,
    };
  }).filter(r => r.supermom || r.savlon || r.avonee);

  const winnerCounts = { Supermom: 0, Savlon: 0, Avonee: 0 };
  rows.forEach(r => {
    const prices: [string, number][] = [];
    if (r.supermom) prices.push(["Supermom", Number(r.supermom.price_per_piece)]);
    if (r.savlon) prices.push(["Savlon", Number(r.savlon.price_per_piece)]);
    if (r.avonee) prices.push(["Avonee", Number(r.avonee.price_per_piece)]);
    if (prices.length >= 2) {
      prices.sort((a, b) => a[1] - b[1]);
      winnerCounts[prices[0][0] as keyof typeof winnerCounts]++;
    }
  });

  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "বাজেট দেশি ব্র্যান্ড তুলনা", item: "https://diaperdam.com/guide/budget-local-diaper-brands-bangladesh" },
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
    headline: "সুপারমম, স্যাভলন নাকি অ্যাভোনি? বাজেট দেশি ব্র্যান্ড তুলনা",
    inLanguage: "bn",
    datePublished: "2026-07-31",
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/budget-local-diaper-brands-bangladesh",
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
              {" / "}বাজেট দেশি ব্র্যান্ড তুলনা
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              সুপারমম, স্যাভলন নাকি অ্যাভোনি? বাজেট দেশি ব্র্যান্ড তুলনা
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              তিনটা দেশি ব্র্যান্ডের আজকের প্রতি-পিস দাম পাশাপাশি, আর কোথায় বাজেট বাঁচে কোথায় ঝুঁকি বাড়ে তার হিসাব।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            মিরপুরের একটা ফার্মেসিতে দাঁড়িয়ে এক মা একবার আমাকে জিজ্ঞেস করেছিলেন, তিনটা প্যাকেটের দাম
            প্রায় কাছাকাছি দেখাচ্ছে, তাহলে কোনটা কিনবো? প্রশ্নটা সহজ, উত্তরটা না। Supermom, Savlon,
            আর Avonee, তিনটাই বাংলাদেশে তৈরি, তিনটাই বেল্ট টাইপ, আর দামও একই ব্র্যাকেটে। কিন্তু প্রতি
            পিসের হিসাবে ফারাক আছে, আর সেটা মাসে গিয়ে জমতে থাকলে বড় অংক হয়ে দাঁড়ায়।
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              <strong>সংক্ষেপে:</strong> Avonee প্রায় প্রতিটা সাইজেই সবচেয়ে কম দামে পড়ে (আজকের{" "}
              {rows.length} সাইজের মধ্যে {winnerCounts.Avonee}টাতে সবচেয়ে সস্তা)। কিন্তু রাতের
              ব্যবহারে লিক-অভিযোগ বেশি আসে বলে অনেক অভিভাবক দিনে সস্তা, রাতে একটু বেশি দামের ব্র্যান্ড,
              এভাবে মিশিয়ে চালান। Supermom সবচেয়ে স্থির মানের, দামও মাঝামাঝি।
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাইজ অনুযায়ী আজকের দাম</h2>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">সাইজ</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">Supermom /পিস</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">Savlon /পিস</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">Avonee /পিস</th>
                  <th className="py-2 px-3 border border-slate-200">সস্তা কোনটা</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const smPrice = r.supermom ? Number(r.supermom.price_per_piece) : null;
                  const svPrice = r.savlon ? Number(r.savlon.price_per_piece) : null;
                  const avPrice = r.avonee ? Number(r.avonee.price_per_piece) : null;
                  const entries: [string, number][] = [];
                  if (smPrice !== null) entries.push(["Supermom", smPrice]);
                  if (svPrice !== null) entries.push(["Savlon", svPrice]);
                  if (avPrice !== null) entries.push(["Avonee", avPrice]);
                  entries.sort((a, b) => a[1] - b[1]);
                  const winner = entries.length ? entries[0][0] : "নেই";
                  return (
                    <tr key={r.slug}>
                      <td className="py-2 px-3 border border-slate-200">
                        <a href={`/size/${r.slug}`} className="text-emerald-700 hover:underline font-medium">{r.labelBn}</a>
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-right font-semibold">
                        {smPrice !== null ? `৳${smPrice.toFixed(2)}` : "নেই"}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-right font-semibold">
                        {svPrice !== null ? `৳${svPrice.toFixed(2)}` : "নেই"}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-right font-semibold">
                        {avPrice !== null ? `৳${avPrice.toFixed(2)}` : "নেই"}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-xs text-slate-500">{winner}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mb-6 text-sm text-slate-500">
            পুরো তালিকা ব্র্যান্ড পাতায়:{" "}
            <a href="/brand/supermom" className="text-emerald-700 hover:underline">Supermom</a>{", "}
            <a href="/brand/savlon" className="text-emerald-700 hover:underline">Savlon</a>{" "}
            আর{" "}
            <a href="/brand/avonee" className="text-emerald-700 hover:underline">Avonee</a>।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">দাম কম মানেই কি মানও কম?</h2>
          <p className="mb-4">
            এই তিনটার মধ্যে সরাসরি এক কথায় উত্তর নেই। Avonee সবচেয়ে সস্তা, কিন্তু রাতের ব্যবহারে
            লিকের অভিযোগ বেশি শোনা যায়, বিশেষ করে টানা ছয়-সাত ঘণ্টা এক ডায়াপারে রাখলে। Savlon মাঝামাঝি
            দামে, স্বাস্থ্যসেবার পরিচিত ব্র্যান্ড থেকে আসা বলে অনেকে ভরসা করেন। Supermom সবচেয়ে বেশি
            দামের, কিন্তু Square Toiletries-এর প্রোডাকশন লাইন থেকে আসায় প্যাকেট থেকে প্যাকেটে মান
            এদিক-ওদিক হওয়ার অভিযোগ সবচেয়ে কম।
          </p>
          <p className="mb-4">
            আমার নিজের হিসাবে, দিনের বেলা তিন-চার ঘণ্টা পরপর পাল্টানো গেলে দামি ব্র্যান্ডের দরকার নেই।
            কিন্তু রাতে যেখানে ছয়-আট ঘণ্টা এক ডায়াপারে থাকতে হয়, সেখানে সস্তা ব্র্যান্ডে ঝুঁকি নেওয়াটা
            আসলে সাশ্রয় না, পরের দিন কাপড় ধোয়ার বাড়তি ঝামেলা।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কখন কোনটা বেছে নেবেন</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>দিনের ব্যবহার, বাজেট প্রধান:</strong> Avonee, ঘন ঘন পাল্টানোর শর্তে।</li>
            <li><strong>মাঝামাঝি বাজেট, একটু ভরসা চাইলে:</strong> Savlon।</li>
            <li><strong>রাত বা দীর্ঘ সময়ের ব্যবহার:</strong> Supermom, বা এই তালিকার বাইরে Neocare-এর মতো একটু বড় রেঞ্জের দেশি ব্র্যান্ড।</li>
            <li><strong>নবজাতক:</strong> তিনটার কোনোটাতেই স্থিতিশীল Newborn সাইজ স্টক এখন কম, তাই আমদানি ব্র্যান্ড বিবেচনায় রাখুন।</li>
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
              <a href="/guide/brand-size-availability-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                ব্র্যান্ড অনুযায়ী সাইজ কভারেজ
              </a>
              <a href="/guide/local-vs-imported-diaper-brands-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                দেশি বনাম বিদেশি ব্র্যান্ড
              </a>
              <a href="/guide/best-diaper-brands-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সেরা ব্র্যান্ড তালিকা
              </a>
              <a href="/guide/diaper-budget-monthly" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                মাসিক বাজেট হিসাব
              </a>
              <a href="/guide/diaper-overnight-leak" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                রাতে লিক ঠেকানোর উপায়
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
