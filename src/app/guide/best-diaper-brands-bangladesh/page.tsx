import type { Metadata } from "next";
import { getCheapestByBrand } from "@/lib/db";
import { BRAND_SLUGS } from "@/lib/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "বাংলাদেশের সেরা ডায়াপার ব্র্যান্ড: দাম ও মান তুলনা ২০২৬",
  description:
    "Pampers, Huggies, MamyPoko, Molfix, Bashundhara, Neocare সহ বাংলাদেশে পাওয়া সব ডায়াপার ব্র্যান্ডের প্রতি পিস দাম তুলনা। আজকের সবচেয়ে সস্তা ব্র্যান্ড কোনটা? দেশি বনাম বিদেশি ব্র্যান্ডে কোনটায় আসলে লাভ?",
  alternates: { canonical: "https://diaperdam.com/guide/best-diaper-brands-bangladesh" },
};

const BRAND_INFO: Record<string, {
  name: string;
  nameBn: string;
  origin: string;
  type: string;
  verdict: string;
  bestFor: string;
}> = {
  pampers:     { name: "Pampers",     nameBn: "প্যাম্পারস",  origin: "আমেরিকা (P&G)",    type: "প্যান্ট + বেল্ট", verdict: "নরম, ভালো ফিট, কিন্তু দাম সবচেয়ে বেশি। নবজাতকে বা সংবেদনশীল ত্বকে কাজে লাগে।", bestFor: "নবজাতক ও সেনসিটিভ স্কিন" },
  huggies:     { name: "Huggies",     nameBn: "হাগিস",       origin: "আমেরিকা (Kimberly)", type: "প্যান্ট",          verdict: "Dry Pants বাংলাদেশে সবচেয়ে পরিচিত বিদেশি ব্র্যান্ড। লিক প্রোটেকশন ভালো, দাম Pampers-এর কাছাকাছি।", bestFor: "দৈনন্দিন ব্যবহার (বিদেশি ব্র্যান্ড)" },
  mamypoko:    { name: "MamyPoko",    nameBn: "ম্যামিপোকো", origin: "জাপান (Unicharm)",   type: "প্যান্ট",          verdict: "আঁটসাঁট ফিট, সরু ওয়েস্টব্যান্ড। যারা প্যান্ট ডায়াপারে লিক নিয়ে ঝামেলায় পড়েন তাদের পছন্দের ব্র্যান্ড।", bestFor: "চটপটে বাচ্চা (৬ মাস+)" },
  molfix:      { name: "Molfix",      nameBn: "মলফিক্স",    origin: "তুরস্ক",             type: "বেল্ট + প্যান্ট", verdict: "বিদেশি ব্র্যান্ডগুলোর মধ্যে প্রতি পিসে সবচেয়ে সস্তা। আকার নম্বরে লেখা (1-5), অক্ষর নয়।", bestFor: "বাজেটে বিদেশি ব্র্যান্ড চাইলে" },
  bashundhara: { name: "Bashundhara", nameBn: "বসুন্ধরা",   origin: "বাংলাদেশ",           type: "বেল্ট",           verdict: "দেশি ব্র্যান্ডে সবচেয়ে সস্তা প্রতি পিস। XL রেঞ্জ ১১-২৫ কেজি, মানে একটা প্যাকেই অনেকদিন চলে। দিনের ব্যবহারে ঠিক আছে।", bestFor: "বাজেট সেভিং + বড় সাইজ" },
  neocare:     { name: "Neocare",     nameBn: "নিওকেয়ার",   origin: "বাংলাদেশ",           type: "বেল্ট",           verdict: "দেশি ব্র্যান্ডে মান একটু ভালো। L সাইজের রেঞ্জ ৭-১৮ কেজি, তাই সাইজ বদলানোর ঝামেলা কম।", bestFor: "মিড-রেঞ্জ দেশি বিকল্প" },
  supermom:    { name: "Supermom",    nameBn: "সুপারমম",    origin: "বাংলাদেশ (Square)",   type: "বেল্ট + প্যান্ট", verdict: "Square Toiletries-এর ব্র্যান্ড। মান স্থিতিশীল, দামও মাঝামাঝি। বাংলাদেশের মায়েদের মধ্যে ভালো সুনাম আছে।", bestFor: "দেশি ব্র্যান্ডে ভরসা চাইলে" },
  savlon:      { name: "Savlon",      nameBn: "স্যাভলন",    origin: "বাংলাদেশ",           type: "বেল্ট",           verdict: "Savlon Twinkle নামে বাজারে। স্বাস্থ্যসেবার পরিচিত ব্র্যান্ড থেকে আসা, মান ঠিক আছে।", bestFor: "ব্র্যান্ড ট্রাস্টফ্যাক্টর চাইলে" },
  avonee:      { name: "Avonee",      nameBn: "অ্যাভোনি",   origin: "বাংলাদেশ",           type: "বেল্ট",           verdict: "সবচেয়ে সস্তার তালিকায় থাকে। মান নিয়ে অভিযোগ বেশি, রাতে ব্যবহারে লিক-রিপোর্ট আছে।", bestFor: "একদম টাইট বাজেটে দিনের ব্যবহার" },
  aiwibi:      { name: "Aiwibi",      nameBn: "আইউইবি",     origin: "চীন",                type: "প্যান্ট",         verdict: "পাতলা, হালকা। দারাজে পাওয়া যায়, দামও কম। ভালো বিকল্প নিশ্চিত না হলে অন্য ব্র্যান্ড ট্রাই করে দেখুন।", bestFor: "পরীক্ষামূলক একটা প্যাক" },
  "happy-nappy": { name: "Happy Nappy", nameBn: "হ্যাপি ন্যাপি", origin: "বাংলাদেশ",      type: "বেল্ট",           verdict: "স্থানীয় বাজারে পাওয়া যায়। খুব বেশি রিভিউ নেই, তবে দাম কম।", bestFor: "স্থানীয় বাজারে সস্তা বিকল্প" },
};

const FAQS = [
  {
    q: "বাংলাদেশে সবচেয়ে ভালো ডায়াপার ব্র্যান্ড কোনটা?",
    a: "এটা নির্ভর করে বাজেট আর বাচ্চার বয়সের ওপর। নবজাতকে Pampers বা Huggies সেরা। বাজেট টাইট হলে Molfix (বিদেশি) বা Bashundhara (দেশি) প্রতি পিসে সবচেয়ে কম দামে পড়ে। চটপটে বাচ্চার জন্য MamyPoko Pants।",
  },
  {
    q: "দেশি ডায়াপার ব্র্যান্ড কি বিদেশি ব্র্যান্ডের মতো ভালো?",
    a: "না, সব দিক থেকে এক নয়। বিদেশি ব্র্যান্ড (Pampers, Huggies, MamyPoko) নরম কাপড়, আঁটসাঁট ফিট আর রাতের লিক প্রোটেকশনে এগিয়ে। দেশি ব্র্যান্ড (Bashundhara, Neocare, Supermom) দামে সস্তা। দিনের ব্যবহারে দেশি ব্র্যান্ড চলে, রাতের ডায়াপারে বিদেশি ব্র্যান্ড ভালো।",
  },
  {
    q: "বাংলাদেশে Pampers কত টাকায় পাওয়া যায়?",
    a: "Pampers M সাইজ (38 পিস) চালডালে ৳১,২৫০ থেকে ৳১,৪০০-এর মধ্যে থাকে। প্রতি পিসে পড়ে ৳৩৩-৩৭। মীনা বাজার বা স্বপ্নে দাম একটু ভিন্ন হতে পারে। সঠিক আজকের দাম দেখতে Pampers পাতা দেখুন।",
  },
  {
    q: "Molfix কি ভালো ডায়াপার?",
    a: "হ্যাঁ। তুরস্কের ব্র্যান্ড, মান ভালো। শুধু মাথায় রাখবেন সাইজ অক্ষরে নয় নম্বরে লেখা - 1 (নবজাতক) থেকে 5 (Junior)। চালডালে সহজে পাওয়া যায়, বিদেশি ব্র্যান্ডগুলোর মধ্যে প্রতি পিসে সবচেয়ে সাশ্রয়ী।",
  },
  {
    q: "চালডাল নাকি দারাজে ডায়াপার সস্তায় পাওয়া যায়?",
    a: "ব্র্যান্ড আর সাইজভেদে আলাদা। Pampers-এ চালডাল সাধারণত সস্তা; দারাজে বিশেষ ডিল থাকলে সেখানে সুবিধা। DiaperDam-এর দাম সূচকে আজকের সব দোকানের প্রতি পিস দাম একসঙ্গে দেখতে পাবেন।",
  },
];

export default async function BestDiaperBrandsPage() {
  const cheapest = await getCheapestByBrand().catch(() => [] as Awaited<ReturnType<typeof getCheapestByBrand>>);
  const today = new Date().toISOString().slice(0, 10);

  // Cheapest per-piece for each brand across all sizes
  const brandCheapest = BRAND_SLUGS.map(slug => {
    const rows = cheapest.filter(c => c.brand_slug === slug);
    if (!rows.length) return { slug, brand: slug, cheapestPPP: null, store: null };
    const best = rows.sort((a, b) => Number(a.min_price_per_piece) - Number(b.min_price_per_piece))[0];
    return { slug, brand: best.brand, cheapestPPP: Number(best.min_price_per_piece), store: best.store_name };
  }).filter(b => b.cheapestPPP !== null) as {
    slug: string; brand: string; cheapestPPP: number; store: string;
  }[];
  brandCheapest.sort((a, b) => a.cheapestPPP - b.cheapestPPP);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "হোম", "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "ডায়াপার", "item": "https://diaperdam.com/diapers" },
      { "@type": "ListItem", "position": 3, "name": "বাংলাদেশের সেরা ডায়াপার ব্র্যান্ড", "item": "https://diaperdam.com/guide/best-diaper-brands-bangladesh" },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "বাংলাদেশের সেরা ডায়াপার ব্র্যান্ড: দাম ও মান তুলনা ২০২৬",
    "inLanguage": "bn",
    "datePublished": "2026-06-23",
    "dateModified": today,
    "author": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "publisher": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "mainEntityOfPage": "https://diaperdam.com/guide/best-diaper-brands-bangladesh",
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
              {" / "}বাংলাদেশের সেরা ডায়াপার ব্র্যান্ড
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              বাংলাদেশের সেরা ডায়াপার ব্র্যান্ড: দাম ও মান তুলনা ২০২৬
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Pampers, Huggies, MamyPoko থেকে বসুন্ধরা, নিওকেয়ার পর্যন্ত: আজকের প্রতি পিস দাম দিয়ে র‍্যাংকিং।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">

          <p className="mb-4">
            চালডালে একদিন দেখলাম Pampers M-এর ৩৮ পিসের প্যাক ৳১,২৫০ আর পাশে বসুন্ধরার ৫০ পিস ৳৫৮০।
            প্রতি পিস হিসাব করলাম - Pampers ৳৩২.৮৯, বসুন্ধরা ৳১১.৬০। তিনগুণ ফারাক।
            এই ফারাকটা মাসে গিয়ে কত দাঁড়ায় সেটা একটু পরে বলছি, তবে আগে জানা দরকার কোন ব্র্যান্ড কোথায় এগিয়ে, কোথায় পিছিয়ে।
          </p>

          {/* AI summary nugget */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              সংক্ষেপে: নবজাতকে বা সেনসিটিভ স্কিনে Pampers বা Huggies দিন।
              চটপটে বাচ্চার জন্য MamyPoko Pants। বিদেশি মান চাইলে কিন্তু দাম কমাতে হলে Molfix।
              আর একদম বাজেট সেভ করতে হলে দিনের বেলা বসুন্ধরা বা Neocare দিন, রাতে একটু ভালো ব্র্যান্ড।
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">আজকের দাম: প্রতি পিসে কোন ব্র্যান্ড কত?</h2>
          <p className="mb-3 text-sm text-slate-500">
            নিচের তালিকা আজকের ডেটা থেকে তৈরি। সব সাইজের মধ্যে যে সাইজে প্রতি পিস সবচেয়ে কম, সেটা দেখানো হয়েছে।
          </p>

          {brandCheapest.length > 0 ? (
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="py-2 px-3 border border-slate-200">#</th>
                    <th className="py-2 px-3 border border-slate-200">ব্র্যান্ড</th>
                    <th className="py-2 px-3 border border-slate-200 text-right">সবচেয়ে কম প্রতি পিস</th>
                    <th className="py-2 px-3 border border-slate-200">দোকান</th>
                    <th className="py-2 px-3 border border-slate-200">মূল্যায়ন</th>
                  </tr>
                </thead>
                <tbody>
                  {brandCheapest.map((b, i) => {
                    const info = BRAND_INFO[b.slug];
                    return (
                      <tr key={b.slug} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                        <td className="py-2 px-3 border border-slate-200 text-slate-400 text-xs">{i + 1}</td>
                        <td className="py-2 px-3 border border-slate-200">
                          <a href={`/brand/${b.slug}`} className="text-emerald-700 hover:underline font-semibold text-sm">
                            {b.brand}
                          </a>
                          {info && <span className="block text-xs text-slate-400">{info.origin}</span>}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right font-bold text-emerald-700 whitespace-nowrap">
                          ৳{b.cheapestPPP.toFixed(2)}/পিস
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-xs text-slate-500 whitespace-nowrap">
                          {b.store}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-xs text-slate-500">
                          {info?.bestFor ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-sm mb-6">ডেটা লোড হচ্ছে...</p>
          )}
          <p className="text-xs text-slate-400 mb-6">
            দাম প্রতিদিন আপডেট হয়। ব্র্যান্ডের নামে ক্লিক করলে সব সাইজের পুরো তুলনা পাবেন।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">বিদেশি বনাম দেশি: আসল ফারাকটা কী?</h2>
          <p className="mb-4">
            বাংলাদেশের বাজারে দুই ধরনের ব্র্যান্ড আছে। বিদেশি (Pampers, Huggies, MamyPoko, Molfix) আর দেশি (বসুন্ধরা, নিওকেয়ার, সুপারমম, স্যাভলন, অ্যাভোনি)।
          </p>
          <p className="mb-4">
            বিদেশি ব্র্যান্ডে ভালো দিকগুলো সরাসরি বলছি: কাপড়ের মান নরম, রাতে লিক কম, ফিট আঁটসাঁট।
            Pampers-এর নবজাতক লেয়ার দেশি ব্র্যান্ডের চেয়ে স্পষ্ট নরম, এটা নিয়ে বেশি কারো মতভেদ নেই।
            কিন্তু দামের তফাতটা এত বড় যে সারাদিনের প্রতিটা ডায়াপার বিদেশি ব্র্যান্ডে দেওয়া অনেক পরিবারের পক্ষে টেকসই না।
          </p>
          <p className="mb-4">
            দেশি ব্র্যান্ডের সুবিধা দামেই। বসুন্ধরার XL রেঞ্জ ১১-২৫ কেজি, মানে একটা সাইজেই প্রায় ৩ বছর চলে।
            এটা দুর্বলতাও, কারণ এত বড় রেঞ্জে ফিট কখনো আঁটসাঁট না।
            দিনের ব্যবহারে, বাচ্চা জেগে থাকলে, দেশি ব্র্যান্ড চলে। রাতে বা লম্বা গাড়ি ভ্রমণে বিদেশি ব্র্যান্ড নিন।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">ব্র্যান্ড-ভিত্তিক সংক্ষিপ্ত মতামত</h2>

          <div className="space-y-3 mb-6">
            {BRAND_SLUGS.filter(slug => BRAND_INFO[slug]).map(slug => {
              const info = BRAND_INFO[slug];
              return (
                <div key={slug} className="bg-white rounded-xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <a href={`/brand/${slug}`} className="font-bold text-slate-900 text-sm hover:text-emerald-700">
                        {info.name} ({info.nameBn})
                      </a>
                      <span className="text-xs text-slate-400 ml-2">{info.origin} · {info.type}</span>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                      {info.bestFor}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{info.verdict}</p>
                </div>
              );
            })}
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">মাসে কত সাশ্রয় হতে পারে?</h2>
          <p className="mb-4">
            ৪-৮ মাসের একটা বাচ্চা দিনে গড়ে ৬-৮টা ডায়াপার নেয়। মাসে ধরি ২২০টা।
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-1 text-sm">
            <li>Pampers M: ৳৩৩/পিস × ২২০ = <strong>৳৭,২৬০/মাস</strong></li>
            <li>MamyPoko Pants M: ৳২৮/পিস × ২২০ = <strong>৳৬,১৬০/মাস</strong></li>
            <li>Molfix Midi (3): ৳২২/পিস × ২২০ = <strong>৳৪,৮৪০/মাস</strong></li>
            <li>Neocare M: ৳১৫/পিস × ২২০ = <strong>৳৩,৩০০/মাস</strong></li>
            <li>বসুন্ধরা M: ৳১২/পিস × ২২০ = <strong>৳২,৬৪০/মাস</strong></li>
          </ul>
          <p className="mb-4">
            Pampers থেকে বসুন্ধরায় গেলে মাসে ৳৪,৬২০ বাঁচবে। বছরে প্রায় ৳৫৫,০০০।
            কিন্তু রাতে লিক বাড়লে ঘুম কম, সেটার দামও আছে — হিসাব থেকে বাদ পড়ে যায়।
          </p>
          <p className="mb-4">
            যে কারণে অনেকে করেন: দিনে দেশি ব্র্যান্ড (দামে কম), রাতে বিদেশি ব্র্যান্ড (লিক কম)।
            মাসে ২২০টার বদলে ৭০টা বিদেশি (শুধু রাতে) + ১৫০টা দেশি হলে খরচ দাঁড়ায় প্রায় ৳৪,১১০।
            মাঝামাঝি সমঝোতা।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাধারণ প্রশ্ন</h2>
          <div className="space-y-4 mb-8">
            {FAQS.map(f => (
              <div key={f.q} className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{f.q}</h3>
                <p className="text-sm text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>

          <p className="mb-6 text-slate-700 text-sm">
            দামগুলো প্রতিদিন বদলায়। এই পাতায় যা লেখা আছে সেটা আজকের ডেটার স্ন্যাপশট, তবে চালডাল বা দারাজে ফ্ল্যাশ সেল থাকলে হিসাব উলটে যেতে পারে।
            নিচে যে ব্র্যান্ডে যাচ্ছেন সেটায় ক্লিক করলে লাইভ দাম পাবেন।
          </p>

          {/* Cross-links to all brand pages */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">ব্র্যান্ড-ভিত্তিক দাম দেখুন</p>
            <div className="flex flex-wrap gap-2">
              {BRAND_SLUGS.map(slug => {
                const info = BRAND_INFO[slug];
                return (
                  <a
                    key={slug}
                    href={`/brand/${slug}`}
                    className="text-emerald-700 hover:underline bg-emerald-50 border border-emerald-100 hover:border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                  >
                    {info?.name ?? slug}
                  </a>
                );
              })}
              <a href="/size/l" className="text-slate-600 hover:underline bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium">সব সাইজ L</a>
              <a href="/price-index" className="text-slate-600 hover:underline bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium">মূল্য সূচক</a>
              <a href="/guide/diaper-size-chart" className="text-slate-600 hover:underline bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium">সাইজ চার্ট</a>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
