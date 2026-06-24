import type { Metadata } from "next";
import Link from "next/link";
import { getCheapestByBrand } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "প্রতিদিন কতটা ডায়াপার লাগে? বয়স অনুযায়ী + মাসিক খরচ হিসাব ২০২৬",
  description:
    "নবজাতকে দিনে ১০-১২টা, ১ বছরে ৪-৬টা। বাংলাদেশে Bashundhara vs Pampers মাসে কত টাকা পার্থক্য? বয়স অনুযায়ী দৈনিক হিসাব + মাসিক প্যাক সংখ্যা + সত্যিকারের খরচ তুলনা।",
  alternates: { canonical: "https://diaperdam.com/guide/diaper-count-per-day" },
};

const FAQS = [
  {
    q: "নবজাতকের প্রতিদিন কতটা ডায়াপার লাগে?",
    a: "প্রথম এক মাসে ১০ থেকে ১২টা। বুকের দুধ খেলেই মলত্যাগ হয়, প্রতি ২-৩ ঘণ্টায় প্রস্রাবও হয়। অনেকে ৮টা কিনে রাখেন, কম পড়ে যায়। নবজাতকের প্রথম সপ্তাহে মেকোনিয়াম (কালো মল) বেশি হয়, সেই সময় বদলানো আরও ঘন ঘন।",
  },
  {
    q: "ডায়াপার কতক্ষণ পরিয়ে রাখা যায়?",
    a: "পায়খানা হলে সাথে সাথে বদলাতে হবে। শুধু প্রস্রাব হলে ৩-৪ ঘণ্টা পর্যন্ত রাখা চলে, তবে চামড়া লাল হওয়ার আগেই বদলানো ভালো। রাতে ভালো মানের ডায়াপার ৮ ঘণ্টা পর্যন্ত ধরতে পারে, সেটা নির্ভর করে ব্র্যান্ড আর বাচ্চার প্রস্রাবের পরিমাণের ওপর।",
  },
  {
    q: "মাসে কতটা ডায়াপার লাগে হিসাব করব কীভাবে?",
    a: "বয়স অনুযায়ী দৈনিক সংখ্যা × ৩০ দিন। ৬ মাস বয়সী বাচ্চার জন্য ৭টা × ৩০ = ২১০টা মাসে। ৬০ পিসের প্যাক হলে ৩.৫টা প্যাক, মানে ৪ প্যাক কিনতে হবে। কোনো মাসে ডায়রিয়া বা দাঁত ওঠার সময় ২০-৩০% বেশি লাগতে পারে।",
  },
  {
    q: "এক সাইজ বড় ডায়াপার কিনে রাখলে কি সমস্যা?",
    a: "হ্যাঁ। ডায়াপারের ওজন-রেঞ্জ ব্র্যান্ডভেদে আলাদা, আর বাচ্চার সাইজ দ্রুত বদলায়। L সাইজের দুই সপ্তাহের স্টক কিনে রাখলেন; ৩ সপ্তাহ পর XL-এ চলে যেতে পারে। বেশিরভাগ দোকানে সাইজ পরিবর্তন করা যায় না। সপ্তাহের বেশি স্টক রাখবেন না।",
  },
  {
    q: "Bashundhara আর Pampers-এ মাসে কত পার্থক্য?",
    a: "প্রতিদিন ৬টা ধরলে মাসে ১৮০টা দরকার। Bashundhara L (৳৯.৬৭/পিস) = ৳১,৭৪০। Pampers M (৳৩৩/পিস) = ৳৫,৯৪০। পার্থক্য মাসে প্রায় ৳৪,২০০, বছরে ৳৫০,৪০০। অনেক পরিবার দিনে দেশি ব্র্যান্ড আর রাতে বিদেশি ব্র্যান্ড মিলিয়ে মাসে ৳৩,০০০-৩,৫০০-এর মধ্যে রাখেন।",
  },
];

export default async function DiaperCountPerDayPage() {
  const cheapestData = await getCheapestByBrand().catch(() => []);

  // Show M and L size prices — the two most-used sizes
  const mRows = cheapestData.filter(r => r.size_label === "M").slice(0, 6);
  const lRows = cheapestData.filter(r => r.size_label === "L").slice(0, 6);

  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "হোম", "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "ডায়াপার", "item": "https://diaperdam.com/diapers" },
      { "@type": "ListItem", "position": 3, "name": "প্রতিদিন কতটা ডায়াপার লাগে", "item": "https://diaperdam.com/guide/diaper-count-per-day" },
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
    "headline": "প্রতিদিন কতটা ডায়াপার লাগে? বয়স অনুযায়ী + মাসিক খরচ হিসাব",
    "inLanguage": "bn",
    "datePublished": "2026-06-24",
    "dateModified": today,
    "author": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "publisher": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "mainEntityOfPage": "https://diaperdam.com/guide/diaper-count-per-day",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      {/* Breadcrumb */}
      <nav className="text-xs text-slate-400 mb-6 flex gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-slate-600">হোম</Link>
        <span>/</span>
        <Link href="/diapers" className="hover:text-slate-600">ডায়াপার</Link>
        <span>/</span>
        <span className="text-slate-600">প্রতিদিন কতটা ডায়াপার লাগে</span>
      </nav>

      {/* Hero */}
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 leading-snug">
        প্রতিদিন কতটা ডায়াপার লাগে? বয়স অনুযায়ী + মাসিক খরচ হিসাব
      </h1>
      <p className="text-xs text-slate-400 mb-8">আপডেট: ২৪ জুন ২০২৬ · DiaperDam</p>

      {/* Content */}
      <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">

        <p>
          চালডাল থেকে Pampers M-এর একটা প্যাক অর্ডার করেছিলাম নবজাতক আসার আগে। ৩৮ পিস।
          তিন দিনও গেলো না।
        </p>

        <p>
          নতুন বাবা-মায়ের কাছে এটা একটা ধাক্কা। ডায়াপার শুধু রাতের জন্য না। নবজাতকের দিনে-রাতে মিলিয়ে
          ১০ থেকে ১২টা লাগে। কখনো বেশিও। বয়স বাড়লে কমে, কিন্তু মাসে কতটা লাগবে সেটার হিসাব আগে থেকে
          না করলে বাজেট বেঁধাতে পারবেন না।
        </p>

        <p>
          আমরা DiaperDam-এ প্রতিদিন এই প্রশ্নটা পাই। তাই সংখ্যাগুলো সাজিয়ে দিলাম, বয়স অনুযায়ী
          দৈনিক সংখ্যা থেকে শুরু করে আসল মাসিক খরচ পর্যন্ত।
        </p>

        {/* Age table */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">বয়স অনুযায়ী দৈনিক ডায়াপার সংখ্যা</h2>

        <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3">বয়স</th>
                <th className="px-4 py-3 text-center">প্রতিদিন</th>
                <th className="px-4 py-3">কারণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">নবজাতক (০–১ মাস)</td>
                <td className="px-4 py-3 text-center font-bold text-emerald-700">১০–১২টা</td>
                <td className="px-4 py-3 text-slate-600">বুকের দুধ খেলেই মলত্যাগ, প্রতি ২–৩ ঘণ্টায় প্রস্রাব</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">১–৬ মাস</td>
                <td className="px-4 py-3 text-center font-bold text-emerald-700">৮–১০টা</td>
                <td className="px-4 py-3 text-slate-600">পায়খানার বিরতি বাড়ে, প্রস্রাব একটু কম ঘন</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">৬–১২ মাস</td>
                <td className="px-4 py-3 text-center font-bold text-emerald-700">৬–৮টা</td>
                <td className="px-4 py-3 text-slate-600">শক্ত খাবার শুরু, মল শক্ত হয়, বিরতি বাড়ে</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">১–২ বছর</td>
                <td className="px-4 py-3 text-center font-bold text-emerald-700">৪–৬টা</td>
                <td className="px-4 py-3 text-slate-600">হাঁটা শেখার পর মূত্রাশয় নিয়ন্ত্রণ একটু বাড়ে</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          এগুলো গড়। ডায়রিয়ার সময় বা দাঁত ওঠার সময় একদিনে ১৪-১৫টাও হয়। পেট সুস্থ থাকলে
          ৬ মাসেই ৭-৮টায় নামিয়ে আনা সম্ভব।
        </p>

        {/* Monthly cost */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">মাসিক প্যাক হিসাব ও খরচ</h2>

        <p>
          প্রতিদিন ৬টা ধরলে মাসে ১৮০টা। প্রতিদিন ৮টা ধরলে ২৪০টা। প্যাকের সংখ্যায় হিসাব করা একটু
          ঝামেলার, কারণ ব্র্যান্ডভেদে প্যাকে পিস সংখ্যা আলাদা।
        </p>

        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
          <p className="text-sm font-semibold text-slate-700">প্রতিদিন ৬টা হিসেবে মাসে ১৮০টা দরকার</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-700">Bashundhara L — ৬০ পিস/প্যাক × ৳৫৮০</span>
              <span className="font-bold text-emerald-700">৩ প্যাক = <strong>৳১,৭৪০/মাস</strong></span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-700">NeoCare L — ৫০ পিস/প্যাক × ৳৪৯০</span>
              <span className="font-bold text-emerald-700">৪ প্যাক = <strong>৳১,৯৬০/মাস</strong></span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-700">Molfix (সাইজ ৩/M) — ৫২ পিস/প্যাক × ৳৮৫০</span>
              <span className="font-bold text-slate-700">৪ প্যাক = ৳৩,৪০০/মাস</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-700">Pampers M — ৩৮ পিস/প্যাক × ৳১,২৫০</span>
              <span className="font-bold text-red-600">৫ প্যাক = <strong>৳৬,২৫০/মাস</strong></span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">* দাম চালডাল ভিত্তিক আনুমানিক, বর্তমান দাম নিচে দেখুন</p>
        </div>

        <p>
          Bashundhara আর Pampers-এর মধ্যে মাসে প্রায় ৳৪,৫০০ পার্থক্য। বছরে সেটা ৳৫৪,০০০।
          অনেক পরিবারের কাছে এটা একটা মাসের মোটামুটি সব খরচ।
        </p>

        <p>
          সবাইকে Bashundhara নিতে বলছি না। কিন্তু সংখ্যাগুলো না জানলে পছন্দটা সচেতনভাবে করা যায় না।
          দিনে সস্তা ব্র্যান্ড, রাতে একটু ভালো ব্র্যান্ড। এই মিশ্র পদ্ধতিতে মাসে ৳২,৮০০-৩,২০০-এর
          মধ্যে রাখা সম্ভব, কোনো মান না কমিয়ে।
        </p>

        {/* Live price table */}
        {(mRows.length > 0 || lRows.length > 0) && (
          <>
            <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">
              আজকের সবচেয়ে কম দাম (M ও L সাইজ)
            </h2>
            <p className="text-sm text-slate-500 mb-3">প্রতি পিস দাম, লাইভ ডেটা</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {mRows.length > 0 && (
                <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">M সাইজ</div>
                  {mRows.map((r, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-2 border-t border-slate-50 hover:bg-slate-50 text-sm">
                      <Link href={`/brand/${r.brand_slug}`} className="font-medium text-slate-800 hover:text-blue-600 capitalize">{r.brand}</Link>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700">৳{Number(r.min_price_per_piece).toFixed(2)}/পিস</span>
                        <span className="text-xs text-slate-400 block">{r.store_name} · {r.pack_qty} পিস</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {lRows.length > 0 && (
                <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">L সাইজ</div>
                  {lRows.map((r, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-2 border-t border-slate-50 hover:bg-slate-50 text-sm">
                      <Link href={`/brand/${r.brand_slug}`} className="font-medium text-slate-800 hover:text-blue-600 capitalize">{r.brand}</Link>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700">৳{Number(r.min_price_per_piece).toFixed(2)}/পিস</span>
                        <span className="text-xs text-slate-400 block">{r.store_name} · {r.pack_qty} পিস</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Tips */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">ডায়াপার খরচ কমানোর চারটা কার্যকর উপায়</h2>

        <p>
          <strong>বড় প্যাক কিনুন।</strong> Bashundhara L-এর ৬০ পিস প্যাকে প্রতি পিস পড়ে ৳৯.৬৭।
          কিছু দোকানে ছোট প্যাক পাওয়া যায় কিন্তু সেটায় ১৫-২০% বেশি পড়ে। সব বড় প্যাকেই এই পার্থক্য থাকে।
        </p>

        <p>
          <strong>এক সপ্তাহের বেশি স্টক রাখবেন না।</strong> বাচ্চার সাইজ দ্রুত বদলায়।
          L সাইজের তিন প্যাক কিনে রাখলেন, দুই সপ্তাহ পর দেখলেন XL-এ চলে গেছে। অনেকেই এই ভুলটা করেন।
          চালডালে পরের দিন ডেলিভারি হয়। স্টক জমানোর দরকার নেই।
        </p>

        <p>
          <strong>দিনে-রাতে আলাদা ব্র্যান্ড।</strong> রাতে একটু ভালো শোষণের ডায়াপার (Pampers বা Huggies),
          দিনে দেশি ব্র্যান্ড। ৬টার মধ্যে ৪টা দেশি ব্র্যান্ড দিলে মাসে ৳১,৫০০-২,০০০ বাঁচানো সম্ভব।
        </p>

        <p>
          <strong>অফার ট্র্যাক করুন।</strong> চালডালে Huggies আর Pampers-এ মাঝে মাঝে ১৫-২০% ছাড় আসে।
          আমাদের <Link href="/deals" className="text-blue-600 hover:underline">ডিল পেজে</Link> এই অফারগুলো লাইভ ট্র্যাক করা হয়।
        </p>

        {/* FAQ */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4">সাধারণ প্রশ্ন</h2>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="font-semibold text-slate-800 mb-1">{faq.q}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* Internal links */}
        <div className="mt-8 bg-blue-50 rounded-xl p-5 border border-blue-100">
          <p className="font-semibold text-blue-900 mb-2">আরও পড়ুন</p>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/guide/best-diaper-brands-bangladesh" className="text-blue-700 hover:underline">
                সেরা ডায়াপার ব্র্যান্ড তুলনা — দাম ও মান একসাথে
              </Link>
            </li>
            <li>
              <Link href="/guide/diaper-rash-prevention" className="text-blue-700 hover:underline">
                ডায়াপার র‍্যাশ প্রতিরোধের উপায়
              </Link>
            </li>
            <li>
              <Link href="/brand/bashundhara" className="text-blue-700 hover:underline">
                Bashundhara ডায়াপার — আজকের দাম সব সাইজে
              </Link>
            </li>
            <li>
              <Link href="/brand/pampers" className="text-blue-700 hover:underline">
                Pampers ডায়াপার — আজকের দাম সব সাইজে
              </Link>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
