import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "কখন সাইজ বদলাবেন? ডায়াপার সাইজ ট্রানজিশন টাইমিং গাইড ২০২৬",
  description:
    "সাইজ বদলানোর ঠিক সময় কবে, প্রতি সাইজ গড়ে কত মাস চলে, আর বদলের আগে বড় প্যাক কিনে টাকা নষ্ট না করার কৌশল। বাংলাদেশে আজকের ছোট প্যাক দামসহ সম্পূর্ণ গাইড।",
  alternates: { canonical: "https://diaperdam.com/guide/diaper-size-transition-timing" },
};

const TRANSITIONS = [
  { from: "Newborn", to: "S", fromSlug: "newborn", toSlug: "s", duration: "৪-৮ সপ্তাহ", note: "জন্মের ওজন ৩.৫ কেজির বেশি হলে আরও আগে" },
  { from: "S", to: "M", fromSlug: "s", toSlug: "m", duration: "৬-১০ সপ্তাহ", note: "এই ধাপটাই সবচেয়ে দ্রুত পার হয়" },
  { from: "M", to: "L", fromSlug: "m", toSlug: "l", duration: "৩-৫ মাস", note: "সবচেয়ে বেশিদিন এক সাইজে থাকে বাচ্চারা" },
  { from: "L", to: "XL", fromSlug: "l", toSlug: "xl", duration: "৩-৪ মাস", note: "হাঁটা শুরুর সময়ের কাছাকাছি" },
  { from: "XL", to: "XXL", fromSlug: "xl", toSlug: "xxl", duration: "৪+ মাস", note: "টয়লেট ট্রেনিং শুরুর আগ পর্যন্ত" },
];

const FAQS = [
  {
    q: "সাইজ বদলানোর ঠিক আগে বড় প্যাক কিনে ফেললে কী হয়?",
    a: "সোজা কথায়, টাকা নষ্ট। ৬০ পিসের প্যাক কিনে যদি ১৫ দিন পর বাচ্চা সেই সাইজ ছাড়িয়ে যায়, বাকি ৪৫ পিস হয় ফেলে দিতে হয় নয়তো ছোট বাচ্চার কাউকে দিয়ে দিতে হয়। M থেকে L-এ ঢোকার মুখে এটা সবচেয়ে বেশি হয়, কারণ এই ট্রানজিশনটা টের পাওয়া কঠিন।",
  },
  {
    q: "একটা সাইজ কতদিন চলবে সেটা আগে থেকে বোঝার উপায় আছে?",
    a: "সরাসরি নেই, কিন্তু প্যাটার্ন আছে। ছোট সাইজগুলো (NB, S) দ্রুত পার হয় কারণ নবজাতকের ওজন বাড়ে দ্রুত। M সাইজে এসে গতি কমে, তাই M সবচেয়ে বেশিদিন লাগে। এই সাধারণ প্যাটার্নটা মাথায় রেখে কেনাকাটার পরিমাণ ঠিক করুন, নির্দিষ্ট দিন গুনে না।",
  },
  {
    q: "দুই সাইজ একসাথে বাসায় রাখা কি বুদ্ধিমানের কাজ?",
    a: "ট্রানজিশনের সময়টায় হ্যাঁ। বর্তমান সাইজের ছোট প্যাক শেষের দিকে, আর পরের সাইজের একটা ছোট প্যাক আগেভাগে। এভাবে হুট করে সাইজ ছোট হয়ে গেলেও হাতের কাছে বিকল্প থাকে। আমি নিজে যখন এই ডেটা দেখছিলাম, লক্ষ করলাম বেশিরভাগ দোকানেই ছোট প্যাক (২০-৩০ পিস) বড় প্যাকের চেয়ে প্রতি পিসে সামান্য বেশি দামে বিক্রি হয় — এই বাড়তি দামটাই ট্রানজিশনের সময় বীমার মতো কাজ করে।",
  },
  {
    q: "সাইজ বদলের লক্ষণ আর সাইজ ছোট হয়ে যাওয়ার লক্ষণ কি একই?",
    a: "প্রায় একই, কিন্তু টাইমিংয়ের প্রশ্নটা আলাদা। ফিট খারাপ লাগা মানে এখনই বদলাতে হবে। কিন্তু টাইমিং প্ল্যানিং মানে আগে থেকে আন্দাজ করা যে আর কত সপ্তাহ বাকি, যাতে বড় প্যাক কেনার সিদ্ধান্তটা সময়মতো নেওয়া যায়। একটা তাৎক্ষণিক সমস্যা, আরেকটা কেনাকাটার পরিকল্পনা।",
  },
  {
    q: "প্যাক সাইজ অনুযায়ী কি প্রতি পিস দাম অনেক আলাদা হয়?",
    a: "হ্যাঁ, উল্লেখযোগ্য রকম আলাদা হয়। বড় প্যাকে প্রতি পিস দাম সাধারণত ৳১-২ কম পড়ে ছোট প্যাকের তুলনায়। তাই ট্রানজিশনের অনিশ্চয়তা যখন বেশি, তখন সামান্য বাড়তি দাম দিয়ে ছোট প্যাক কেনাটাই বাস্তবসম্মত। নিচের টেবিলে প্রতি সাইজের আজকের সবচেয়ে ছোট প্যাক আর তার দাম দেখুন।",
  },
];

export default async function DiaperSizeTransitionPage() {
  const allProducts = await getAllProducts({ sort: "price_per_piece" })
    .catch(() => [] as DiaperProduct[]);

  const bySize: Record<string, DiaperProduct[]> = {};
  for (const p of allProducts) {
    const s = p.size_label ?? "";
    if (s) bySize[s] = [...(bySize[s] ?? []), p];
  }
  // Smallest pack per size, cheapest among ties
  for (const key of Object.keys(bySize)) {
    bySize[key] = [...bySize[key]].sort((a, b) => {
      if (a.pack_qty !== b.pack_qty) return a.pack_qty - b.pack_qty;
      return Number(a.price_per_piece) - Number(b.price_per_piece);
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "সাইজ ট্রানজিশন টাইমিং", item: "https://diaperdam.com/guide/diaper-size-transition-timing" },
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
    headline: "কখন সাইজ বদলাবেন? ডায়াপার সাইজ ট্রানজিশন টাইমিং গাইড",
    inLanguage: "bn",
    datePublished: "2026-07-15",
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/diaper-size-transition-timing",
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
              {" / "}সাইজ ট্রানজিশন টাইমিং
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              কখন সাইজ বদলাবেন? ট্রানজিশন টাইমিং গাইড
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              কোন সাইজ কত মাস চলে, আর বদলের মুখে বড় প্যাক কিনে টাকা নষ্ট না করার উপায়।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            গত মাসেই M সাইজের ৬০ পিসের প্যাক কিনেছেন। আজ দেখছেন কোমরের ফিতা টানটান, পায়ের রাবারে দাগ পড়ছে।
            বাকি ৩৫ পিস কী হবে? এই সমস্যাটা প্রায় প্রতিটা বাবা-মায়ের হয়, বিশেষ করে M থেকে L-এ যাওয়ার সময়।
            কারণ সহজ। সাইজ চার্ট বলে দেয় ওজনের ভিত্তিতে কোন সাইজ, কিন্তু কতদিনে সেই সাইজ পার হবে সেটা বলে না।
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              <strong>মূল কথা:</strong> ছোট সাইজ (NB, S) দ্রুত পার হয়, M সাইজে গতি কমে যায়, তারপর আবার
              ধীরে ধীরে বাড়ে। ট্রানজিশনের কাছাকাছি সময়ে বড় প্যাক এড়িয়ে ছোট প্যাক কিনুন, দাম সামান্য বেশি
              পড়লেও অপচয় কম হয়।
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">প্রতি সাইজ গড়ে কতদিন চলে</h2>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">ট্রানজিশন</th>
                  <th className="py-2 px-3 border border-slate-200">গড় সময়</th>
                  <th className="py-2 px-3 border border-slate-200">নোট</th>
                </tr>
              </thead>
              <tbody>
                {TRANSITIONS.map(t => (
                  <tr key={t.from}>
                    <td className="py-2 px-3 border border-slate-200 font-medium">
                      <a href={`/size/${t.fromSlug}`} className="text-emerald-700 hover:underline">{t.from}</a>
                      {" → "}
                      <a href={`/size/${t.toSlug}`} className="text-emerald-700 hover:underline">{t.to}</a>
                    </td>
                    <td className="py-2 px-3 border border-slate-200">{t.duration}</td>
                    <td className="py-2 px-3 border border-slate-200 text-xs text-slate-500">{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mb-6 text-sm text-slate-500">
            এই সংখ্যাগুলো গড়। কিছু বাচ্চা দ্রুত বড় হয়, কিছু ধীরে। নিজের বাচ্চার প্যাটার্ন এক-দুইবার
            ট্রানজিশন পার হওয়ার পর নিজেই বুঝে যাবেন।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাইজ বদলের লক্ষণ, আগে থেকে ধরার উপায়</h2>
          <p className="mb-4">
            চার-পাঁচদিন আগে থেকেই আভাস পাওয়া যায়। কোমরের ফিতা লাগাতে গেলে আগের চেয়ে একটু বেশি টানতে হচ্ছে।
            পায়ের রাবারের দাগ শুকিয়ে যাওয়ার পরও লালচে থেকে যাচ্ছে। ডায়াপার পরিয়ে বসালে পেছনের দিকটা টানটান
            লাগছে। এই তিনটার যেকোনো দুটো একসাথে দেখলে বুঝবেন, হাতে সময় আছে হয়তো এক সপ্তাহ, তার বেশি না।
          </p>
          <p className="mb-4">
            রাতের ডায়াপারে এই লক্ষণ আগে ধরা পড়ে দিনের চেয়ে, কারণ রাতে বাচ্চা একটানা আট-নয় ঘণ্টা একই
            ডায়াপারে থাকে। রাতে যদি ফিট আঁটো লাগে, দিনের সাইজ বদলের কয়েকদিন আগেই সেটা রাতে বদলে নিন।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">বড় প্যাক কখন কিনবেন, কখন না</h2>
          <p className="mb-4">
            সহজ নিয়ম: সাইজ পরিবর্তনের মাঝামাঝি সময়ে থাকলে বড় প্যাক কিনুন, ট্রানজিশনের কাছাকাছি গেলে ছোট প্যাক।
            M সাইজে সবে ঢুকেছেন? বড় প্যাক নিরাপদ, কারণ M গড়ে তিন-পাঁচ মাস চলে। কিন্তু M-এ দুই মাস পার
            হয়ে গেছে? এখন থেকে ছোট প্যাকেই থাকুন, বড় প্যাকের লোভ সামলান।
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>ট্রানজিশনের প্রথম ধাপে (নতুন সাইজ শুরু):</strong> বড় প্যাক কিনুন, প্রতি পিস দাম কম পড়ে।</li>
            <li><strong>মাঝামাঝি সময়ে:</strong> স্বাভাবিক কেনাকাটা চালিয়ে যান।</li>
            <li><strong>শেষ দুই-তিন সপ্তাহে (লক্ষণ দেখা দিলে):</strong> ছোট প্যাক বা পরবর্তী সাইজের একটা ছোট প্যাক আগেভাগে রাখুন।</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">আজকের সবচেয়ে ছোট প্যাক, সাইজ অনুযায়ী</h2>
          <p className="mb-4">
            ট্রানজিশনের সময় বড় প্যাকের ঝুঁকি না নিয়ে এই ছোট প্যাকগুলো দিয়ে সেতুবন্ধন করতে পারেন।
          </p>
          {["Newborn", "S", "M", "L", "XL", "XXL"].map(sizeLabel => {
            const prod = (bySize[sizeLabel] ?? [])[0];
            if (!prod) return null;
            return (
              <div key={sizeLabel} className="flex items-center justify-between border border-slate-100 rounded-xl px-4 py-3 mb-2 bg-white">
                <div>
                  <span className="font-semibold text-slate-900">সাইজ {sizeLabel}</span>
                  <span className="text-slate-500 text-sm ml-2">
                    {prod.brand} {prod.line ?? ""} — {prod.pack_qty} পিস, {prod.store_name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-700">৳{Number(prod.price_per_piece).toFixed(2)}/পিস</div>
                  <div className="text-xs text-slate-400">৳{Number(prod.price_bdt).toFixed(0)} মোট</div>
                </div>
              </div>
            );
          })}
          <p className="mb-6 text-sm text-slate-500 mt-2">
            পুরো তালিকা ব্র্যান্ড × সাইজ গ্রিডে: <a href="/diapers" className="text-emerald-700 hover:underline">এখানে দেখুন</a>।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">বাকি থাকা পিস নষ্ট না করার উপায়</h2>
          <p className="mb-4">
            ট্রানজিশন মিস করলেও সব শেষ না। ছোট হয়ে যাওয়া ডায়াপার প্যান্ট টাইপ হলে অস্থায়ী কাজ চলে, ব্যাগে
            রেখে দিন পার্কে বা ভ্রমণে জরুরি ব্যবহারের জন্য। বেল্ট টাইপ ছোট হলে সেটা বাসায় দিনের বেলা অল্প
            সময়ের জন্য চলতে পারে, রাতে না। আত্মীয়ের ছোট বাচ্চা থাকলে দিয়ে দেওয়াটাই সবচেয়ে ভালো সমাধান।
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

          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/guide/brand-size-availability-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                ব্র্যান্ড অনুযায়ী সাইজ কভারেজ
              </a>
              <a href="/guide/diaper-size-by-weight" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সাইজ চার্ট গাইড
              </a>
              <a href="/guide/diaper-budget-monthly" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                মাসিক বাজেট গাইড
              </a>
              <a href="/guide/newborn-diaper-size" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                নবজাতকের সাইজ গাইড
              </a>
              <a href="/guide/night-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                রাতের ডায়াপার গাইড
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
