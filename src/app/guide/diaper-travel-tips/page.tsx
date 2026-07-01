import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "বাচ্চা নিয়ে ভ্রমণ: বাসে-লঞ্চে-প্লেনে কয়টা ডায়াপার লাগবে? ২০২৬",
  description:
    "ঢাকা-কক্সবাজার বাস, সদরঘাট লঞ্চ, নাকি প্লেন — জার্নির দৈর্ঘ্য অনুযায়ী কয়টা ডায়াপার নেবেন, কোন টাইপ ভালো, আর গ্রামে গিয়ে সাপ্লাই ফুরালে কী করবেন।",
  alternates: { canonical: "https://diaperdam.com/guide/diaper-travel-tips" },
};

const FAQS = [
  {
    q: "ঢাকা থেকে কক্সবাজার বাসে বাচ্চার জন্য কয়টা ডায়াপার নেব?",
    a: "১০-১২ ঘণ্টার জার্নি। প্রতি ৩ ঘণ্টায় একটা বদলালে ৪টা লাগবে, তার সাথে ২টা বাড়তি রাখুন লিক বা বিরতি দেরি হওয়ার জন্য। মোট ৬টা নিরাপদ সংখ্যা। নবজাতক হলে প্রতি ২ ঘণ্টায় বদলান, ৬-৭টা নিন।",
  },
  {
    q: "লঞ্চে বা ফেরিতে রাত কাটানো জার্নিতে কোন ডায়াপার ভালো?",
    a: "রাতের ডায়াপার বা XL সাইজের বেশি-শোষণক্ষমতার প্যাক। সদরঘাট থেকে বরিশাল লঞ্চ ৮-১০ ঘণ্টা লাগে, বেশিরভাগই রাতে। সাধারণ ডে-টাইম ডায়াপার এই দৈর্ঘ্যে লিক করার ঝুঁকি বেশি। বিস্তারিত আমাদের রাতের ডায়াপার গাইডে আছে।",
  },
  {
    q: "গ্রামে গেলে কি ডায়াপার সাথে করে নিয়ে যাওয়া উচিত?",
    a: "হ্যাঁ, অবশ্যই। Chaldal আর Daraz-এর দ্রুত ডেলিভারি মূলত ঢাকা, চট্টগ্রামের মতো বড় শহরে। উপজেলা বা গ্রামের বাজারে সাধারণত Bashundhara বা Neocare পাওয়া যায়, Pampers বা Huggies সবসময় থাকে না। পছন্দের ব্র্যান্ড হলে শহর থেকেই পুরো ট্রিপের হিসাব করে নিয়ে যান।",
  },
  {
    q: "প্লেনে ডায়াপার নেওয়ার কোনো নিয়ম আছে কি?",
    a: "হ্যান্ড লাগেজে কয়েকটা ডায়াপার, ওয়াইপস আর একটা চেঞ্জিং প্যাড রাখুন — চেকড ব্যাগেজ দেরি হলে বা হারালে বিকল্প থাকবে। বিমানবন্দরের বেবি চেঞ্জিং রুম সব জায়গায় নেই, তাই কমপ্যাক্ট চেঞ্জিং কিট সাথে রাখাই ভালো। ঢাকা-কক্সবাজার ফ্লাইট মাত্র ৫০ মিনিট, তবু একটা স্পেয়ার রাখুন।",
  },
  {
    q: "বর্ষায় ভ্রমণে ডায়াপার ভিজে বা নষ্ট হয়ে যাওয়া কীভাবে ঠেকাব?",
    a: "প্যাকেট খোলার পর জিপলক বা ওয়াটারপ্রুফ পাউচে রাখুন। বাসের লাগেজ বক্সে বৃষ্টির পানি ঢোকার ঝুঁকি থাকে, তাই ডায়াপারের ব্যাগ সবসময় হাতব্যাগে বা উপরের তাকে রাখুন। ভেজা প্যাকেজিং টেপের আঠা দুর্বল করে দেয়, ফলে লিক বাড়ে।",
  },
];

export default async function DiaperTravelTipsPage() {
  const products = await getAllProducts({ sort: "price_per_piece" })
    .catch(() => [] as DiaperProduct[]);

  const cheapest = products[0];
  const top = products.slice(0, 6);
  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "ভ্রমণ গাইড", item: "https://diaperdam.com/guide/diaper-travel-tips" },
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
    headline: "বাচ্চা নিয়ে ভ্রমণে কয়টা ডায়াপার লাগবে — বাস, লঞ্চ, ট্রেন ও প্লেন",
    inLanguage: "bn",
    datePublished: "2026-07-01",
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/diaper-travel-tips",
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
              {" / "}ভ্রমণ গাইড
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              বাচ্চা নিয়ে ভ্রমণ: কয়টা ডায়াপার লাগবে?
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              বাস, লঞ্চ, ট্রেন ও প্লেন — জার্নির দৈর্ঘ্য ধরে হিসাব, আর গ্রামে সাপ্লাই ফুরালে কী করবেন।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">

          <p className="mb-4">
            ঢাকা থেকে কক্সবাজার বাসে চড়লে ১০-১২ ঘণ্টা লাগে। মাঝপথে ২-৩ বার যাত্রা বিরতি, তার বাইরে
            ওয়াশরুম নেই। বাচ্চা সাথে থাকলে ডায়াপারের হিসাব ভুল করলে বিপদে পড়বেন মাঝ রাস্তায়।
            গ্রামের বাজারে গিয়ে হুট করে Pampers খুঁজে পাবেন না, এটাও সত্যি।
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              <strong>সংক্ষেপে:</strong> প্রতি ৩ ঘণ্টার জার্নিতে একটা ডায়াপার হিসাব করুন, তার সাথে
              অন্তত ২টা বাড়তি। রাতের জার্নিতে নাইট বা XL টাইপ। গ্রামে যাওয়ার আগে পছন্দের ব্র্যান্ড
              শহর থেকেই কিনে নিন।
              {cheapest && (
                <>
                  {" "}আজ সবচেয়ে কম প্রতি পিস{" "}
                  <strong>৳{Number(cheapest.price_per_piece).toFixed(2)}/পিস</strong>{" "}
                  ({cheapest.brand}{cheapest.size_label ? `, ${cheapest.size_label}` : ""}, {cheapest.store_name})।
                </>
              )}
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">জার্নির দৈর্ঘ্য অনুযায়ী কয়টা ডায়াপার?</h2>
          <p className="mb-4">
            হিসাবটা সহজ। বাচ্চার বয়স যত কম, বদলানোর ব্যবধান তত কম। নবজাতক প্রতি ২ ঘণ্টায়,
            ৬ মাস থেকে ২ বছরের বাচ্চা প্রতি ৩-৪ ঘণ্টায়। তার উপর ২টা স্পেয়ার যোগ করুন। বিরতি
            দেরি হবে, বাস জ্যামে আটকাবে। এটা ধরেই এগোন।
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">রুট / জার্নি</th>
                  <th className="py-2 px-3 border border-slate-200">সময়</th>
                  <th className="py-2 px-3 border border-slate-200">টডলার (৬মাস-২বছর)</th>
                  <th className="py-2 px-3 border border-slate-200">নবজাতক</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr>
                  <td className="py-2 px-3 border border-slate-200">ঢাকা-সিলেট বাস</td>
                  <td className="py-2 px-3 border border-slate-200">৫-৬ ঘণ্টা</td>
                  <td className="py-2 px-3 border border-slate-200">২টা</td>
                  <td className="py-2 px-3 border border-slate-200">৪টা</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-3 border border-slate-200">ঢাকা-খুলনা বাস</td>
                  <td className="py-2 px-3 border border-slate-200">৬-৭ ঘণ্টা</td>
                  <td className="py-2 px-3 border border-slate-200">৩টা</td>
                  <td className="py-2 px-3 border border-slate-200">৪টা</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-slate-200">ঢাকা-কক্সবাজার বাস</td>
                  <td className="py-2 px-3 border border-slate-200">১০-১২ ঘণ্টা</td>
                  <td className="py-2 px-3 border border-slate-200">৪-৫টা</td>
                  <td className="py-2 px-3 border border-slate-200">৬-৭টা</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-3 border border-slate-200">সদরঘাট-বরিশাল লঞ্চ</td>
                  <td className="py-2 px-3 border border-slate-200">৮-১০ ঘণ্টা (রাতে)</td>
                  <td className="py-2 px-3 border border-slate-200">৩-৪টা (নাইট টাইপ)</td>
                  <td className="py-2 px-3 border border-slate-200">৫টা</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-slate-200">ঢাকা-চট্টগ্রাম ট্রেন</td>
                  <td className="py-2 px-3 border border-slate-200">৫-৬ ঘণ্টা</td>
                  <td className="py-2 px-3 border border-slate-200">২টা</td>
                  <td className="py-2 px-3 border border-slate-200">৩টা</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-3 border border-slate-200">ঢাকা-কক্সবাজার ফ্লাইট</td>
                  <td className="py-2 px-3 border border-slate-200">~৫০ মিনিট</td>
                  <td className="py-2 px-3 border border-slate-200">১টা (স্পেয়ার)</td>
                  <td className="py-2 px-3 border border-slate-200">১টা (স্পেয়ার)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">রাতের জার্নিতে সাধারণ ডায়াপার চলবে না</h2>
          <p className="mb-4">
            সদরঘাট থেকে বরিশালের লঞ্চ ৮-১০ ঘণ্টা লাগে, বেশিরভাগ সময়ই রাত। এতক্ষণ একটানা পরে থাকা
            মানে সাধারণ ডে-টাইম ডায়াপারে লিক হবেই। এখানে দরকার নাইট টাইপ বা XL সাইজের বেশি
            শোষণক্ষমতার প্যাক। রাতে কেবিনে আলো কম, বদলানোর জায়গাও সীমিত। একবার ভালো ডায়াপার
            পরিয়ে দিলে বাকিটা নিশ্চিন্ত।
          </p>
          <p className="mb-4">
            বাসেও একই যুক্তি। ঢাকা-কক্সবাজার নাইট কোচে ঘুমিয়ে যাওয়া বাচ্চাকে বার বার তোলা কঠিন।
            যাত্রা শুরুর আগেই একটা উচ্চ-ক্ষমতার ডায়াপার পরিয়ে দিন।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">গ্রামে গেলে সাপ্লাই আলাদা</h2>
          <p className="mb-4">
            শহরের বাইরে গেলে দোকানের সাপ্লাই বদলে যায়। উপজেলা বা গ্রামের বাজারে প্রধানত Bashundhara,
            Neocare আর স্থানীয় ব্র্যান্ড থাকে। Pampers, Huggies বা Molfix সবসময় পাবেন না, পেলেও
            দাম বেশি হতে পারে ছোট দোকানের মার্জিনে।
          </p>
          <p className="mb-3">তিনটা বিকল্প:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li>
              <strong>পুরো ট্রিপের হিসাব করে শহর থেকে নিয়ে যান</strong> — সবচেয়ে নিরাপদ। ৫ দিনের
              ট্রিপে দিনে ৬টা ধরে ৩০টা প্যাক করুন।
            </li>
            <li>
              <strong>স্থানীয় ব্র্যান্ডে অভ্যস্ত করান</strong> — যাওয়ার আগে ২-৩ দিন Bashundhara বা
              Neocare ট্রায়াল দিন, র‍্যাশ না হলে চিন্তা কম।
            </li>
            <li>
              <strong>উপজেলা শহরে Daraz-এর পিকআপ পয়েন্ট আছে কিনা যাচাই করুন</strong> — অনেক জেলা
              সদরে আছে, তবে ডেলিভারি সময় ২-৪ দিন লাগতে পারে।
            </li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">বর্ষা আর গরমে বাড়তি সাবধানতা</h2>
          <p className="mb-4">
            প্যাকেট একবার খুললে জিপলক ব্যাগে রাখুন। বাসের লাগেজ বক্সে বৃষ্টির পানি ঢুকে যাওয়ার
            ঘটনা কম না। ভেজা প্যাকেজিং টেপের আঠা দুর্বল করে, ফলে ব্যবহারের সময় লিক বাড়ে। ডায়াপারের
            ব্যাগ সবসময় হাতব্যাগে বা সিটের উপরের তাকে রাখুন, নিচের লাগেজে না।
          </p>
          <p className="mb-4">
            নন-এসি বাসে বা লোডশেডিং হওয়া এলাকায় গরমে দীর্ঘক্ষণ ডায়াপার পরে থাকলে র‍্যাশের ঝুঁকি
            বাড়ে। বদলানোর ফাঁকে কিছুক্ষণ খালি রাখুন, আর একটা জিঙ্ক অক্সাইড ক্রিম সাথে রাখুন।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">প্লেনে ভ্রমণের আলাদা হিসাব</h2>
          <p className="mb-4">
            ঢাকা-কক্সবাজার ফ্লাইট মাত্র ৫০ মিনিট। ডায়াপারের সংখ্যা নিয়ে চিন্তা নেই, কিন্তু হ্যান্ড
            লাগেজে অন্তত ২-৩টা রাখুন। ফ্লাইট লেট হয়, চেকড ব্যাগ দেরি করে বেল্টে আসে। বিমানবন্দরের
            বেবি চেঞ্জিং রুম সব জায়গায় নেই। ছোট চেঞ্জিং প্যাড আর ওয়াইপস হাতব্যাগে থাকলে যেকোনো
            জায়গায় বদলানো যায়।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">প্যাকিং চেকলিস্ট</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li>জার্নির হিসাব ধরে ডায়াপার + ২টা স্পেয়ার</li>
            <li>ওয়াইপস এক প্যাক (গরম পানি সবসময় পাওয়া যায় না)</li>
            <li>জিঙ্ক অক্সাইড ক্রিম, ছোট টিউব</li>
            <li>জিপলক ব্যাগ ২-৩টা (ভেজা কাপড় বা খোলা প্যাক রাখার জন্য)</li>
            <li>ভাঁজ করা চেঞ্জিং প্যাড বা বড় তোয়ালে</li>
            <li>প্লাস্টিক ব্যাগ ব্যবহৃত ডায়াপার ফেলার জন্য — বাসে বা লঞ্চে ডাস্টবিন সবসময় কাছে থাকে না</li>
          </ul>

          {/* Live price table */}
          {top.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">আজকের সবচেয়ে কম প্রতি পিস দামের ডায়াপার</h2>
              <p className="mb-3 text-sm text-slate-500">
                ভ্রমণের আগে বাল্ক কিনলে প্রতি পিস দাম গুরুত্বপূর্ণ। প্রতিদিন আপডেট হয়।
              </p>
              <div className="overflow-x-auto mb-4">
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
                    {top.map(p => (
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
            </>
          )}

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাধারণ প্রশ্ন</h2>
          <div className="space-y-4 mb-8">
            {FAQS.map(f => (
              <div key={f.q} className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{f.q}</h3>
                <p className="text-sm text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>

          <p className="mb-4 text-sm text-slate-500">
            হিসাব করে নিলে ভ্রমণের মাঝপথে দোকান খোঁজার ঝামেলা থাকে না। বাড়তি কয়েকটা ডায়াপার
            বাড়িতে ফিরে কাজে লাগবেই, তাই বেশি নেওয়াই বুদ্ধিমানের কাজ।
          </p>

          {/* Cross-links */}
          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/guide/night-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                রাতের ডায়াপার গাইড
              </a>
              <a href="/guide/belt-vs-pant-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                বেল্ট নাকি প্যান্ট
              </a>
              <a href="/guide/diaper-count-per-day" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                প্রতিদিন কতটা লাগে
              </a>
              <a href="/guide/best-diaper-brands-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সেরা ডায়াপার ব্র্যান্ড
              </a>
              <a href="/guide/diaper-rash-prevention" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                র‍্যাশ প্রতিরোধ গাইড
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
