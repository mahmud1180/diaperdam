import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ডায়াপার র‍্যাশ হলে কী করবেন: ঘরোয়া চিকিৎসা, ক্রিম, ও কখন ডাক্তার দরকার",
  description:
    "ডায়াপার র‍্যাশ হয়ে গেছে, এখন কী? প্রথম ২৪ ঘণ্টায় যা করবেন, সাধারণ ও ছত্রাক র‍্যাশের পার্থক্য, জিংক অক্সাইড ক্রিম ঠিকমতো লাগানো, আর চিকিৎসার সময় ঘন ঘন বদলানো মানে প্রতি পিস দামটাই আসল — সব এক পাতায়।",
  alternates: { canonical: "https://diaperdam.com/guide/diaper-rash-treatment" },
};

const FAQS = [
  {
    q: "ডায়াপার র‍্যাশ হলে প্রথমে কী করব?",
    a: "সবার আগে ডায়াপার খুলে জায়গাটা হালকা গরম পানিতে ধুয়ে নিন। ঘষবেন না — নরম কাপড়ে চেপে চেপে পানি নিন। পাঁচ মিনিট ডায়াপার ছাড়া খোলা রাখুন, চামড়া শুকাতে দিন। তারপর পুরু করে জিংক অক্সাইড ক্রিম লাগিয়ে ডায়াপার পরান। এই চক্রটা প্রতিবার বদলানোর সময় করুন। হালকা র‍্যাশ ২৪-৪৮ ঘণ্টায় বদলাতে শুরু করে।",
  },
  {
    q: "জিংক অক্সাইড ক্রিম কতটুকু, কীভাবে লাগাব?",
    a: "পাতলা প্রলেপ যথেষ্ট নয় — র‍্যাশের ওপর দেখতে সাদাটে স্তর পড়া পর্যন্ত লাগান। এটা একটা আস্তরণের মতো কাজ করে: ভেজা ও অ্যামোনিয়া থেকে চামড়া আলাদা রাখে। পরের বার বদলানোর সময় পুরোটা মুছতে গিয়ে ঘষবেন না। যতটুকু নিজে উঠে আসে তাই নিন, বাকিটা রেখে দিন — ঘষলে ক্ষতি বেশি।",
  },
  {
    q: "র‍্যাশে কি ট্যালকম বা কর্নস্টার্চ পাউডার দিতে পারি?",
    a: "দেবেন না। ট্যালকম পাউডারের সূক্ষ্ম কণা নিঃশ্বাসে গেলে বাচ্চার ফুসফুস ক্ষতিগ্রস্ত হয়। কর্নস্টার্চ নিজে ক্ষতিকর নয়, কিন্তু ভেজার সাথে জমে গেলে ছত্রাকের খাবার হয় — ইস্ট র‍্যাশ বাড়িয়ে দেয়। বাংলাদেশের গরম-ঘামে এই ঝুঁকিটা আরও বেশি। শুধু জিংক অক্সাইড ক্রিম যথেষ্ট।",
  },
  {
    q: "রাতে র‍্যাশ থাকলে কীভাবে সামলাব?",
    a: "রাতে বদলানোর সুযোগ কম, তাই ঘুমাতে দেওয়ার আগে একটু বেশি মোটা করে ক্রিম লাগান। শোষণ ক্ষমতা বেশি এমন ডায়াপার বেছে নিন — ভেজা আলাদা থাকলে চামড়া শুকনো থাকে। রাতে একবার মাঝখানে উঠে চেক করুন। র‍্যাশ সারানোর পথে রাতটা সবচেয়ে কঠিন, তাই এই দুটো ছাড় দিলে আরও পিছিয়ে যায়।",
  },
  {
    q: "র‍্যাশ সারানোর সময় কি ডায়াপার না পরিয়ে রাখব?",
    a: "দিনে কিছুটা সময় ডায়াপার ছাড়া রাখা ভালো — খোলা হাওয়ায় চামড়া তাড়াতাড়ি শুকোয়। ঘরের মেঝেতে একটা ওয়াটারপ্রুফ মাদুর বা বড় ন্যাপকিন পেতে দিন, তার ওপর বাচ্চাকে রাখুন। তবে পুরো সময় ডায়াপার ছাড়া রাখা বাস্তবে কঠিন। মূল কাজ বারবার বদলানো আর প্রতিবার ক্রিম দেওয়া।",
  },
];

export default async function RashTreatmentGuidePage() {
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
      { "@type": "ListItem", "position": 3, "name": "ডায়াপার র‍্যাশ চিকিৎসা", "item": "https://diaperdam.com/guide/diaper-rash-treatment" },
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
    "headline": "ডায়াপার র‍্যাশ হলে কী করবেন: ঘরোয়া চিকিৎসা ও ক্রিম গাইড",
    "inLanguage": "bn",
    "datePublished": "2026-06-24",
    "dateModified": today,
    "author": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "publisher": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "mainEntityOfPage": "https://diaperdam.com/guide/diaper-rash-treatment",
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
              {" / "}ডায়াপার র‍্যাশ চিকিৎসা
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              ডায়াপার র‍্যাশ হলে কী করবেন
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              ঘরোয়া চিকিৎসা, কোন ক্রিম কীভাবে, সাধারণ বনাম ছত্রাক র‍্যাশ চেনা, আর কখন ডাক্তার।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            লাল হওয়া চামড়া দেখে অনেকেই সরাসরি ক্রিম মাখা শুরু করেন। ক্রিম কাজে আসে, কিন্তু তার আগের
            ধোয়া-শুকানোর ধাপটা না করলে ক্রিমও পুরো কাজ করে না। ডায়াপার র‍্যাশের চিকিৎসা আসলে তিনটা
            জিনিস একসাথে: ক্লিন → ড্রাই → প্রোটেক্ট। তিনটাই প্রতিবার করতে হবে।
          </p>

          {/* AI summary nugget */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              সংক্ষেপে: র‍্যাশ হয়ে গেলে প্রতিবার বদলানোর সময় — ধোয়া, শুকানো, জিংক অক্সাইড ক্রিম।
              এই চক্র মিস করলে সারতে দেরি হয়। ঘন ঘন বদলানো মানে দিনে পিস বেশি, তাই চিকিৎসার সময়টায়
              প্রতি পিস দামই আসল হিসাব।
              {cheapest && (
                <>
                  {" "}আজ বাংলাদেশে সবচেয়ে কম প্রতি পিস{" "}
                  <strong>৳{Number(cheapest.price_per_piece).toFixed(2)}/পিস</strong>{" "}
                  ({cheapest.brand}{cheapest.size_label ? `, সাইজ ${cheapest.size_label}` : ""}, {cheapest.store_name})।
                </>
              )}
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">র‍্যাশ দেখা গেল, প্রথম ২৪ ঘণ্টায় কী করবেন</h2>
          <p className="mb-4">
            র‍্যাশ হয়ে গেছে মানে চামড়া ইতিমধ্যে ক্ষতিগ্রস্ত। এখন লক্ষ্য একটাই — আর যেন না বাড়ে, আর
            নতুন জ্বালা না লাগে। তার জন্য প্রতিবার ডায়াপার বদলানোর সময় তিনটা ধাপ:
          </p>
          <ol className="list-decimal pl-5 mb-4 space-y-2">
            <li>
              <strong>ধোয়া।</strong> হালকা গরম পানিতে ধুয়ে নিন। ওয়াইপ দিয়ে ঘষলে জ্বালায়; পানি মৃদু
              ও কার্যকর। পায়খানার দাগ থাকলে ছোট কাপড়ে পানি দিয়ে চেপে চেপে তুলুন।
            </li>
            <li>
              <strong>শুকানো।</strong> মুছবেন না — নরম কাপড়ে বা টিস্যুতে চেপে পানি নিন। তারপর দুই-তিন
              মিনিট ডায়াপার ছাড়া রেখে দিন। খোলা হাওয়ায় চামড়া শুকোতে দিলে ক্রিমও ভালো ধরে।
            </li>
            <li>
              <strong>ক্রিম।</strong> জিংক অক্সাইড বেসড ক্রিম পুরু করে লাগান। সাদাটে স্তর দেখা যাওয়া পর্যন্ত।
              এটা একটা প্রতিরক্ষামূলক আস্তরণ — ভেজা ও অ্যামোনিয়াকে চামড়া থেকে দূরে রাখে।
            </li>
          </ol>
          <p className="mb-4">
            এই তিনটা ধাপ সকাল থেকে রাত প্রতিবার মিস না করলে হালকা থেকে মাঝারি র‍্যাশ সাধারণত
            ২-৩ দিনে কমতে শুরু করে।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাধারণ র‍্যাশ বনাম ছত্রাক র‍্যাশ — পার্থক্য কীভাবে বুঝবেন</h2>
          <p className="mb-3">
            দুটো দেখতে প্রায় একরকম, কিন্তু চিকিৎসা আলাদা:
          </p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">লক্ষণ</th>
                  <th className="py-2 px-3 border border-slate-200">সাধারণ র‍্যাশ</th>
                  <th className="py-2 px-3 border border-slate-200">ছত্রাক র‍্যাশ (ইস্ট)</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr>
                  <td className="py-2 px-3 border border-slate-200">রং</td>
                  <td className="py-2 px-3 border border-slate-200">হালকা থেকে মাঝারি লাল</td>
                  <td className="py-2 px-3 border border-slate-200">গাঢ় লাল, উজ্জ্বল</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-3 border border-slate-200">কিনারা</td>
                  <td className="py-2 px-3 border border-slate-200">অস্পষ্ট, ছড়ানো</td>
                  <td className="py-2 px-3 border border-slate-200">স্পষ্ট, ছোট দানা বা ফোস্কা</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-slate-200">অবস্থান</td>
                  <td className="py-2 px-3 border border-slate-200">ডায়াপার যেখানে ছোঁয় সেখানে</td>
                  <td className="py-2 px-3 border border-slate-200">ভাঁজের ভেতরেও, কুঁচকিতে</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-3 border border-slate-200">জিংক অক্সাইডে সাড়া</td>
                  <td className="py-2 px-3 border border-slate-200">২-৩ দিনে উন্নতি</td>
                  <td className="py-2 px-3 border border-slate-200">কমে না বা বাড়ে</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mb-4">
            ছত্রাক র‍্যাশ সন্দেহ হলে ডাক্তারের কাছে যান। তখন অ্যান্টিফাঙ্গাল ক্রিম লাগে (ক্লোট্রিমাজল বা
            নিস্টাটিন), যেটা প্রেসক্রিপশন ছাড়া পাওয়া গেলেও ডাক্তার নিশ্চিত করলে ভালো।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">চিকিৎসার সময় প্রতি পিস দামটা কেন জরুরি</h2>
          <p className="mb-4">
            র‍্যাশ সারাতে গেলে ঘন ঘন বদলানো ছাড়া উপায় নেই। নবজাতকে তখন দিনে ১০-১২ পিস পর্যন্ত লাগতে
            পারে। মাসে তিনশো-সাড়ে তিনশো পিস। এই সংখ্যায় প্রতি পিস এক টাকা কম মানে মাসে তিনশো
            টাকার সাশ্রয়। অথচ বাজারে দাম দেখানো হয় প্যাকে — এই ফাঁদে পড়লে ঠকবেন।
          </p>
          <p className="mb-4">
            DiaperDam প্রতিদিন দশটা দোকানের (চালডাল, দারাজ, স্বপ্ন, অথোবা, অ্যারোগা, আজকেরডিল,
            গোবেবি, পাইকারী, মিনাবাজার, ইউনিমার্ট) দাম আপডেট করে প্রতি পিস দামে সাজিয়ে রাখে।
            র‍্যাশের সময় ঘন ঘন বদলানোর খরচ কমাতে এটাই সবচেয়ে সহজ হাতিয়ার।
          </p>

          {/* Live price table */}
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
          <p className="mb-2">তিন দিনের ঘরোয়া যত্নে উন্নতি না হলে বা নিচের কোনো লক্ষণ থাকলে দেরি করবেন না:</p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>র‍্যাশ কমছে না, বরং বাড়ছে বা ছড়াচ্ছে</li>
            <li>ফোস্কা, পুঁজ বা রক্তের দাগ দেখা যাচ্ছে</li>
            <li>বাচ্চার জ্বর এসেছে</li>
            <li>কুঁচকি বা পেটের ভাঁজে ছড়িয়ে গেছে</li>
            <li>বাচ্চা স্বাভাবিকের চেয়ে বেশি কাঁদছে বা ঘুমাচ্ছে না</li>
          </ul>
          <p className="mb-4">
            এগুলো সাধারণ র‍্যাশের বাইরে কিছু হওয়ার ইঙ্গিত। দেরি না করে শিশু বিশেষজ্ঞ দেখান।
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

          {/* Cross-links */}
          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/guide/diaper-rash-prevention" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                র‍্যাশ প্রতিরোধ গাইড
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
              <a href="/guide/diaper-size-by-weight" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                ওজন অনুযায়ী সাইজ
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
