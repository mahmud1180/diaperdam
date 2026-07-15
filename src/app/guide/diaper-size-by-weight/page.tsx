import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ডায়াপার সাইজ চার্ট ২০২৬: বাচ্চার ওজনে কোন সাইজ নেবেন",
  description:
    "নবজাতক থেকে ১৬ কেজির বেশি — বাংলাদেশে কোন সাইজে কোন ব্র্যান্ড সবচেয়ে সস্তা। ওজন চার্ট, ফিট চেক করার উপায়, ব্র্যান্ড ভেদে পার্থক্য, আর আজকের প্রতি পিস দাম — সব এক পাতায়।",
  alternates: { canonical: "https://diaperdam.com/guide/diaper-size-by-weight" },
};

const FAQS = [
  {
    q: "সাইজ চার্টে ওজনের range এক হয়ে যায় কেন? M আর L দুটোতেই ১০ কেজি লেখা।",
    a: "কারণ ব্র্যান্ডভেদে কাটিং আলাদা। Huggies-এর M আর MamyPoko-র M একই কাপড়ে তৈরি না। চার্টের ওজন হলো নির্মাতার গড় অনুমান, বাচ্চার কোমর আর পায়ের মাপ ধরে না। তাই ১০ কেজিতে এক ব্র্যান্ডে M আর আরেকটায় L লাগতে পারে — এটা স্বাভাবিক।",
  },
  {
    q: "বাচ্চার ওজন দুটো সাইজের মাঝখানে, কোনটা আগে চেষ্টা করব?",
    a: "ছোটটা দিয়ে শুরু করুন। পরিয়ে দেখুন কোমরে এক আঙুল ঢোকে কিনা। যদি ঢোকে আর পায়ের রাবার চামড়ায় না কাটে, সেটাই সঠিক। কিন্তু যদি ডায়াপার পরানোর পর কোমরের ফিতা একেবারে শেষ প্রান্তে লাগাতে হয়, পরের সাইজে যান।",
  },
  {
    q: "সাইজ ছোট হয়ে গেছে বুঝব কীভাবে?",
    a: "চারটা লক্ষণ দেখুন: ১) কোমরের ফিতা টানটান লাগাতে হচ্ছে, আঙুলের জায়গা নেই। ২) পায়ের রাবার চামড়ায় লালচে দাগ ফেলছে। ৩) পেছনে ফাঁকা, সামনে আঁটো। ৪) লিক বাড়ছে। এর মধ্যে দুটো মিললেই পরের সাইজ নিন।",
  },
  {
    q: "দিনে M আর রাতে L — এটা কি ঠিক আছে?",
    a: "একদম ঠিক আছে, অনেকেই করেন। রাতে বড় সাইজ মানে বেশি শোষণক্ষমতা আর কম ঘষা। দিনে যদি M ভালো ফিট হয়, সেটাই রাখুন। খরচের হিসাবে দেখুন: রাতে একটাই পিস, দামটা একটু বেশি হলেও কষ্টে ওঠার চেয়ে ঘুম বেশি দামি।",
  },
  {
    q: "NB সাইজ না কিনলেও হয়?",
    a: "বেশিরভাগ বাচ্চার জন্য NB ৪-৮ সপ্তাহ চলে। কিন্তু জন্মের সময় ওজন ৩.৫ কেজির বেশি হলে NB এক-দুই সপ্তাহেই ছোট হয়। হাসপাতাল থেকে ফেরার আগে এক প্যাক NB আর এক প্যাক S রেখে দিন — NB বেশি কিনবেন না, খুব দ্রুত ছোট হয়।",
  },
];

const SIZE_INFO = [
  { label: "Newborn", slug: "newborn", labelBn: "NB", weight: "৫ কেজি পর্যন্ত", note: "জন্মের প্রথম ৪-৮ সপ্তাহ" },
  { label: "S",       slug: "s",       labelBn: "S",  weight: "৩-৭ কেজি",        note: "NB ছোট হলে পরের ধাপ" },
  { label: "M",       slug: "m",       labelBn: "M",  weight: "৫-১৩ কেজি",       note: "সবচেয়ে বেশি ব্যবহার হয়" },
  { label: "L",       slug: "l",       labelBn: "L",  weight: "১০-১৬ কেজি",      note: "হাঁটতে শেখার বয়সে" },
  { label: "XL",      slug: "xl",      labelBn: "XL", weight: "১৫ কেজির বেশি",  note: "রাতের ডায়াপারে বেশি দেখা যায়" },
  { label: "XXL",     slug: "xxl",     labelBn: "XXL",weight: "১৬ কেজির বেশি",  note: "বড় বাচ্চাদের জন্য" },
];

export default async function DiapersizeByWeightPage() {
  const allProducts = await getAllProducts({ sort: "price_per_piece" })
    .catch(() => [] as DiaperProduct[]);

  // Group by size_label, already sorted cheapest first
  const bySize: Record<string, DiaperProduct[]> = {};
  for (const p of allProducts) {
    const s = p.size_label ?? "";
    if (s) bySize[s] = [...(bySize[s] ?? []), p];
  }

  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "হোম",     "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "ডায়াপার", "item": "https://diaperdam.com/diapers" },
      { "@type": "ListItem", "position": 3, "name": "সাইজ চার্ট", "item": "https://diaperdam.com/guide/diaper-size-by-weight" },
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
    "headline": "ডায়াপার সাইজ চার্ট ২০২৬: বাচ্চার ওজনে কোন সাইজ নেবেন",
    "inLanguage": "bn",
    "datePublished": "2026-06-22",
    "dateModified": today,
    "author":    { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "publisher": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "mainEntityOfPage": "https://diaperdam.com/guide/diaper-size-by-weight",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <div>
        {/* Header */}
        <div className="bg-white border-b border-slate-100 py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm text-slate-400 mb-1">
              <a href="/diapers" className="hover:text-emerald-600">সব ডায়াপার</a>
              {" / "}সাইজ চার্ট
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              ডায়াপার সাইজ চার্ট: বাচ্চার ওজনে কোন সাইজ নেবেন
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              ওজন অনুযায়ী গাইড, ফিট চেক, ব্র্যান্ড ভেদে পার্থক্য, আর আজকের প্রতি পিস দাম।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">

          <p className="mb-4">
            সাইজ চার্ট দেখে ডায়াপার কিনতে গেলে প্রায়ই একটা সমস্যা হয় — ওজন মিললে সাইজ মেলে না।
            কারণটা চার্টের না, ব্র্যান্ডের কাটিংয়ের। নিচের চার্টটা শুরুর জায়গা; শেষমেশ বাচ্চার কোমর আর পায়ের মাপেই সাইজ ঠিক হয়।
          </p>

          {/* Size chart table */}
          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">ওজন অনুযায়ী সাইজ চার্ট</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-emerald-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">সাইজ</th>
                  <th className="py-2 px-3 border border-slate-200">বাচ্চার ওজন</th>
                  <th className="py-2 px-3 border border-slate-200 text-right">আজ সবচেয়ে কম/পিস</th>
                  <th className="py-2 px-3 border border-slate-200">নোট</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_INFO.map(s => {
                  const cheapest = (bySize[s.label] ?? [])[0];
                  return (
                    <tr key={s.label} className="hover:bg-slate-50">
                      <td className="py-2 px-3 border border-slate-200">
                        <a href={`/size/${s.slug}`} className="text-emerald-700 hover:underline font-semibold">
                          {s.labelBn}
                        </a>
                      </td>
                      <td className="py-2 px-3 border border-slate-200">{s.weight}</td>
                      <td className="py-2 px-3 border border-slate-200 text-right font-semibold">
                        {cheapest
                          ? <>৳{Number(cheapest.price_per_piece).toFixed(2)}</>
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-slate-500 text-xs">{s.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Main sections */}
          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">শুধু ওজন মেলালে হয় না</h2>
          <p className="mb-4">
            দুটো বাচ্চার একই ওজন হতে পারে কিন্তু কোমরের মাপ আলাদা। লম্বা-চিকন বাচ্চায় M কোমরে ঢিলা,
            গোলগাল বাচ্চায় M কোমরে আঁটো — দুজনেরই ওজন ৮ কেজি। ওজন চার্ট দিয়ে প্রথম প্যাক কিনুন,
            কিন্তু ফিট দেখে চূড়ান্ত সিদ্ধান্ত নিন।
          </p>
          <p className="mb-4">
            ফিট ঠিক আছে মানে: কোমরে এক আঙুল ঢোকার জায়গা, পায়ের রাবার ভেতরের দিকে ভাঁজ করা,
            আর পরানোর পর কোমরের ফিতা মাঝখানে লাগছে (শেষ প্রান্তে না)। এই তিনটা মিললে সাইজ সঠিক।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">ব্র্যান্ড ভেদে কাটিং আলাদা</h2>
          <p className="mb-4">
            Huggies এর M সাধারণত একটু সরু কোমরের জন্য। MamyPoko একটু চওড়া কাটে।
            Molfix ও Pampers মাঝামাঝি। Neocare বা Bashundhara তুলনায় কম দামে পাওয়া যায়,
            কিন্তু কাটিং একটু কম মসৃণ হতে পারে।
          </p>
          <p className="mb-4">
            এর মানে একটা ব্র্যান্ডে M ঠিক থাকলেও অন্য ব্র্যান্ডে একই সাইজ কম লাগতে পারে।
            নতুন ব্র্যান্ড শুরু করলে ছোট প্যাক দিয়ে চেষ্টা করুন আগে।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাইজ বদলানোর সময় দাম কীভাবে বদলায়</h2>
          <p className="mb-4">
            বড় সাইজে প্যাকে পিস কম থাকে, তাই প্যাকের দাম একই রাখলেও প্রতি পিস দাম বাড়ে।
            M থেকে L যেতে প্রতি পিসে ৳২-৫ বেশি দিতে হয় বেশিরভাগ ব্র্যান্ডে।
            হিসাবটা করুন প্যাকের দামে নয়, প্রতি পিস দামে।
          </p>
          <p className="mb-4">
            নিচের টেবিলে প্রতিটা সাইজের সবচেয়ে সস্তা অপশন দেখুন। দাম প্রতিদিন সকালে আপডেট হয়।
          </p>

          {/* Per-size price tables */}
          {SIZE_INFO.map(s => {
            const prods = (bySize[s.label] ?? []).slice(0, 5);
            if (prods.length === 0) return null;
            return (
              <div key={s.label} className="mb-8">
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  সাইজ {s.labelBn} ({s.weight}) — আজকের সবচেয়ে কম প্রতি পিস
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-left">
                        <th className="py-2 px-3 border border-slate-200">ডায়াপার</th>
                        <th className="py-2 px-3 border border-slate-200 text-right">প্রতি পিস</th>
                        <th className="py-2 px-3 border border-slate-200 text-right">প্যাক দাম</th>
                        <th className="py-2 px-3 border border-slate-200">দোকান</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prods.map(p => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 border border-slate-200">
                            <a href={`/brand/${p.brand_slug}`} className="text-emerald-700 hover:underline">
                              {p.brand} {p.line ?? ""} {p.size_label ? `সাইজ ${p.size_label}` : ""} {p.pack_qty} পিস
                            </a>
                          </td>
                          <td className="py-2 px-3 border border-slate-200 text-right font-semibold">
                            ৳{Number(p.price_per_piece).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 border border-slate-200 text-right">
                            ৳{Number(p.price_bdt).toFixed(0)}
                          </td>
                          <td className="py-2 px-3 border border-slate-200">{p.store_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  পুরো তালিকা:{" "}
                  <a href={`/size/${s.slug}`} className="text-emerald-700 hover:underline">
                    সাইজ {s.labelBn} পাতায়
                  </a>
                </p>
              </div>
            );
          })}

          {/* FAQs */}
          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাধারণ প্রশ্ন</h2>
          <div className="space-y-4 mb-8">
            {FAQS.map(f => (
              <div key={f.q} className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{f.q}</h3>
                <p className="text-sm text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>

          {/* Cross-links */}
          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/guide/diaper-size-transition-timing" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সাইজ ট্রানজিশন টাইমিং গাইড
              </a>
              <a href="/guide/night-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                রাতের ডায়াপার গাইড
              </a>
              <a href="/guide/belt-vs-pant-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                বেল্ট বনাম প্যান্ট গাইড
              </a>
              <a href="/guide/diaper-rash-prevention" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                র‍্যাশ প্রতিরোধ গাইড
              </a>
              <a href="/guide/newborn-diaper-size" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                নবজাতকের সাইজ গাইড
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
