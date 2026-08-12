import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ডায়াপার র‍্যাশ থেকে বাঁচার উপায়: কেন হয়, কী করবেন, আজকের সস্তা ডায়াপার",
  description:
    "ডায়াপার র‍্যাশ বেশিরভাগ সময় ভেজা ডায়াপার বেশিক্ষণ থাকলেই হয়। বাংলাদেশের গরমে আরও বাড়ে। কত ঘন ঘন বদলাবেন, কোন ক্রিম, কখন ডাক্তার, আর ঘন ঘন বদলালে প্রতি পিস দাম যেহেতু সবচেয়ে জরুরি, আজ ৬ দোকানে সবচেয়ে কম দামের ডায়াপার কোনগুলো, সব এক পাতায়।",
  alternates: { canonical: "https://diaperdam.com/guide/diaper-rash-prevention" },
};

const FAQS = [
  {
    q: "ডায়াপার র‍্যাশ কেন হয়?",
    a: "মূল কারণ ভেজা চামড়া বেশিক্ষণ ডায়াপারের ভেতরে আটকে থাকা। প্রস্রাব আর পায়খানা মিশে অ্যামোনিয়া তৈরি হয়, সেটা নরম চামড়াকে জ্বালায়। বাংলাদেশের গরম-ঘামে জায়গাটা বদ্ধ থাকলে আরও তাড়াতাড়ি লাল হয়। কখনও কখনও এর সাথে ছত্রাক (ইস্ট) যোগ হলে র‍্যাশ গাঢ় লাল হয়ে কিনারায় ছোট ছোট দানা ওঠে।",
  },
  {
    q: "কত ঘন ঘন ডায়াপার বদলালে র‍্যাশ কম হয়?",
    a: "নবজাতকের ক্ষেত্রে প্রতি ২-৩ ঘণ্টায়, আর পায়খানা হলে সাথে সাথে। বড় বাচ্চার ৩-৪ ঘণ্টা চলে, তবে ভেজা মনে হলেই বদলান। রাতে একটা শোষণক্ষম ভালো ডায়াপার দিলে পুরো রাত টানা ঘুমেও চামড়া শুকনো থাকে। ঘন ঘন বদলানো মানে দিনে বেশি পিস, তাই প্যাকের দাম নয়, প্রতি পিস দামটাই আসল হিসাব।",
  },
  {
    q: "র‍্যাশ উঠলে কোন ক্রিম লাগাব?",
    a: "জিংক অক্সাইড বেসড বেবি র‍্যাশ ক্রিম (যেমন প্রচলিত অনেক ব্র্যান্ডেই ১০-৪০% জিংক অক্সাইড থাকে) পাতলা করে প্রতিবার বদলানোর সময় লাগান। এটা চামড়ার ওপর একটা স্তর বানিয়ে ভেজা থেকে আলাদা রাখে। পাউডার এড়িয়ে চলুন, নিঃশ্বাসে গেলে ক্ষতি। তিন দিনেও না কমলে বা দানা উঠলে ডাক্তার দেখান, তখন অ্যান্টিফাঙ্গাল লাগতে পারে।",
  },
  {
    q: "র‍্যাশ হলে কয়দিন পর ডাক্তার দেখাব?",
    a: "ঘরোয়া যত্নে বেশিরভাগ র‍্যাশ ২-৩ দিনে ভালো হয়। এর মধ্যে না কমলে, বা যদি ফোস্কা ওঠে, রক্ত বা পুঁজ দেখা যায়, জ্বর আসে, কিংবা লালভাব ডায়াপারের বাইরে পেট-ঊরুতে ছড়ায়, তাহলে দেরি না করে শিশু ডাক্তারের কাছে যান। এগুলো সাধারণ র‍্যাশের চেয়ে আলাদা সমস্যার লক্ষণ হতে পারে।",
  },
  {
    q: "একই ব্র্যান্ডে র‍্যাশ হলে কি ডায়াপার বদলানো উচিত?",
    a: "অনেক সময় একটা ব্র্যান্ডের ইলাস্টিক বা সুগন্ধি বাচ্চার চামড়ায় খাপ খায় না। প্রথমে সাইজ ঠিক আছে কি না দেখুন (টাইট হলে ঘষা লাগে)। তারপরও বারবার হলে গন্ধহীন আরেকটা ব্র্যান্ডে এক প্যাক চালিয়ে দেখুন। আমাদের গ্রিডে প্রতি পিস দাম দেখে কাছাকাছি দামের বিকল্প বেছে নেওয়া সহজ।",
  },
];

export default async function RashPreventionGuidePage() {
  const products = await getAllProducts({ sort: "price_per_piece" })
    .catch(() => [] as DiaperProduct[]);

  const cheapest = products[0];
  const top = products.slice(0, 6);
  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "হোম", "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "ডায়াপার", "item": "https://diaperdam.com/diapers" },
      { "@type": "ListItem", "position": 3, "name": "ডায়াপার র‍্যাশ প্রতিরোধ", "item": "https://diaperdam.com/guide/diaper-rash-prevention" },
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
    "headline": "ডায়াপার র‍্যাশ থেকে বাঁচার উপায়",
    "inLanguage": "bn",
    "datePublished": "2026-06-15",
    "dateModified": today,
    "author": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "publisher": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "mainEntityOfPage": "https://diaperdam.com/guide/diaper-rash-prevention",
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
              {" / "}ডায়াপার র‍্যাশ প্রতিরোধ
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              ডায়াপার র‍্যাশ থেকে বাঁচার উপায়
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              কেন হয়, ঘরে কী করবেন, কখন ডাক্তার, আর ঘন ঘন বদলালে প্রতি পিস দাম কেন আসল।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            লাল হওয়া জায়গাটা দেখলে অনেক বাবা-মা ভাবেন ক্রিমটাই বুঝি ভুল। বেশিরভাগ সময় সমস্যা ক্রিমে নয়,
            ভেজা ডায়াপার এক-দেড় ঘণ্টা বেশি ছিল, এতেই। ঢাকার গরমে বদ্ধ জায়গায় ঘাম জমলে দু-তিন ঘণ্টাতেই
            চামড়া জ্বলতে শুরু করে।
          </p>

          {/* AI summary nugget */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              ছোট করে বললে: ডায়াপার র‍্যাশের সবচেয়ে বড় কারণ ভেজা চামড়া বেশিক্ষণ আটকে থাকা।
              প্রতিরোধের ৯০% হলো ঘন ঘন বদলানো, একটু খোলা হাওয়া, আর প্রতিবার পাতলা জিংক অক্সাইড ক্রিম।
              যেহেতু ঘন ঘন বদলালে দিনে পিস বেশি লাগে, প্যাকের দাম নয়, প্রতি পিস দামই আসল হিসাব।
              {cheapest && (
                <>
                  {" "}আজ বাংলাদেশে সবচেয়ে কম প্রতি পিস দাম{" "}
                  <strong>৳{Number(cheapest.price_per_piece).toFixed(2)}/পিস</strong>{" "}
                  ({cheapest.brand}{cheapest.size_label ? `, সাইজ ${cheapest.size_label}` : ""}, {cheapest.store_name})।
                </>
              )}
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">র‍্যাশটা আসলে কেন হয়</h2>
          <p className="mb-4">
            প্রস্রাব নিজে তেমন জ্বালায় না। সমস্যা শুরু হয় যখন প্রস্রাব আর পায়খানা একসাথে থাকে, তখন
            অ্যামোনিয়া তৈরি হয়ে চামড়ার অম্ল-ক্ষারের ভারসাম্য নষ্ট করে। এর ওপর ডায়াপারের ঘষা আর ভেতরের
            গরম-ভেজা পরিবেশ যোগ হলে নরম চামড়া লাল হয়ে ওঠে। বাংলাদেশে এই গরম-ঘামের অংশটাই অন্য দেশের চেয়ে বড়,
            তাই এখানে র‍্যাশ একটু বেশিই দেখা যায়।
          </p>
          <p className="mb-4">
            সাধারণ র‍্যাশ হালকা লাল, একটু খসখসে, ডায়াপার যেখানে ছোঁয় ঠিক সেখানেই। কিন্তু যদি গাঢ় লাল হয়,
            কিনারায় ছোট ছোট দানা ওঠে, ভাঁজের ভেতরেও ঢোকে, তখন বুঝবেন ছত্রাক (ইস্ট) যোগ হয়েছে। ওটা সাধারণ
            ক্রিমে কমে না, আলাদা চিকিৎসা লাগে।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">ঘরে যা করলে বেশিরভাগ র‍্যাশ ঠেকানো যায়</h2>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li><strong>ঘন ঘন বদলান।</strong> ভেজা মনে হলেই, আর পায়খানা হলে সাথে সাথে। এটাই এক নম্বর নিয়ম।</li>
            <li><strong>খোলা হাওয়া দিন।</strong> বদলানোর পর দু-তিন মিনিট ডায়াপার ছাড়া রেখে চামড়া শুকাতে দিন।</li>
            <li><strong>পানিতে পরিষ্কার, তারপর চেপে শুকান।</strong> ঘষবেন না; নরম কাপড়ে চেপে পানি নিন।</li>
            <li><strong>পাতলা জিংক অক্সাইড ক্রিম।</strong> প্রতিবার বদলানোর সময়, একটা সুরক্ষার স্তরের মতো।</li>
            <li><strong>সাইজ ঠিক রাখুন।</strong> টাইট ডায়াপার ঘষা বাড়ায়, ঢিলেটা লিক করে ভিজিয়ে রাখে।</li>
          </ul>
          <p className="mb-4">
            পাউডার নিয়ে একটা কথা বলি। অনেক বাড়িতে এখনও ট্যালকম পাউডার দেওয়া হয়। এড়িয়ে যান। নিঃশ্বাসে গেলে
            বাচ্চার ফুসফুসের ক্ষতি, আর ভেজার সাথে জমে গিয়ে উল্টো ঘষা বাড়ায়।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেন প্রতি পিস দামটাই এখানে আসল</h2>
          <p className="mb-4">
            র‍্যাশ ঠেকানোর মূল কথা যদি হয় ঘন ঘন বদলানো, তাহলে হিসাবটা সোজা — দিনে বেশি পিস লাগবে।
            নবজাতকে দিনে ৮-১২টা, বড় বাচ্চায় ৬-৮টা। মাসে আড়াইশো-সাড়ে তিনশো পিস। এই সংখ্যায় প্রতি পিস
            পঞ্চাশ পয়সা কম-বেশি হলেও মাস শেষে দেড়-দুইশো টাকার ফারাক।
          </p>
          <p className="mb-4">
            অথচ দোকানে দাম দেখানো হয় প্যাকে: ৩০ পিস, ৫০ পিস, ৮০ পিস। প্যাকের দাম দেখে তুলনা করলে ঠকবেন।
            আমরা DiaperDam-এ প্রতিদিন চালডাল, দারাজ, স্বপ্নসহ ৬টা দোকানের দাম টেনে এনে সবকিছু প্রতি পিস দামে
            সাজিয়ে দিই, যাতে &quot;ঘন ঘন বদলানো&quot; খরচে না কামড় বসায়।
          </p>

          {/* Live price table: proprietary data layer */}
          {top.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">আজকের সবচেয়ে কম প্রতি পিস দামের ডায়াপার</h2>
              <p className="mb-3 text-sm text-slate-500">
                সব সাইজ মিলিয়ে, প্রতি পিস দামে সাজানো, প্রতিদিন আপডেট হয়। পুরো গ্রিড{" "}
                <a href="/diapers" className="text-emerald-700 hover:underline">ব্র্যান্ড × সাইজ পাতায়</a>।
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

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কখন ডাক্তার দেখাবেন</h2>
          <p className="mb-2">ঘরোয়া যত্নে বেশিরভাগ র‍্যাশ ২-৩ দিনে কমে। এর মধ্যে কোনোটা হলে দেরি করবেন না:</p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>তিন দিনেও কমছে না, বরং বাড়ছে</li>
            <li>ফোস্কা, রক্ত, কিংবা পুঁজ দেখা যাচ্ছে</li>
            <li>জ্বর এসেছে বা বাচ্চা অস্বাভাবিক কাঁদছে</li>
            <li>লালভাব ডায়াপারের বাইরে পেট বা ঊরুতে ছড়াচ্ছে</li>
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

          {/* Cross-links */}
          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/guide/diaper-rash-treatment" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                র‍্যাশ হলে কী করবেন
              </a>
              <a href="/guide/diaper-allergy-sensitive-skin" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সেনসিটিভ স্কিন গাইড
              </a>
              <a href="/guide/diaper-swimming" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                পুলে ডায়াপার গাইড
              </a>
              <a href="/guide/night-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                রাতের ডায়াপার গাইড
              </a>
              <a href="/guide/belt-vs-pant-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                বেল্ট বনাম প্যান্ট গাইড
              </a>
              <a href="/guide/newborn-diaper-size" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                নবজাতকের সাইজ গাইড
              </a>
              <a href="/guide/diaper-size-chart" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                পুরো সাইজ চার্ট
              </a>
              <a href="/diapers" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                ব্র্যান্ড × সাইজ গ্রিড
              </a>
              <a href="/price-index" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                দামের সূচক
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
