import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "নবজাতকের ডায়াপার সাইজ গাইড — কোন সাইজ, কয়টা লাগে, আজকের দাম",
  description:
    "নবজাতক (NB) ডায়াপার সাইজ ৫ কেজি পর্যন্ত। প্রথম মাসে দিনে ৮-১২টা লাগে। কয় প্যাক কিনবেন, কখন সাইজ S-এ যাবেন, আর আজ বাংলাদেশের ৬টা দোকানে নবজাতক ডায়াপারের সবচেয়ে কম দাম কত, সব এক পাতায়।",
  alternates: { canonical: "https://diaperdam.com/guide/newborn-diaper-size" },
};

const FAQS = [
  {
    q: "নবজাতক সাইজ কত কেজি পর্যন্ত?",
    a: "বাংলাদেশে বিক্রি হওয়া বেশিরভাগ ব্র্যান্ডে নবজাতক (Newborn/NB) সাইজ ৫ কেজি পর্যন্ত। কিছু আমদানি করা ব্র্যান্ড ৪ কেজি পর্যন্ত ধরে। প্যাকেটের গায়ে লেখা রেঞ্জটাই ধরবেন, ব্র্যান্ডভেদে সামান্য এদিক-ওদিক হয়।",
  },
  {
    q: "নবজাতকের জন্য বেল্ট নাকি প্যান্ট ডায়াপার?",
    a: "বেল্ট (টেপ) স্টাইল। নবজাতক দিনের বড় অংশ শুয়ে থাকে, আর বেল্ট ডায়াপার খোলা অবস্থায় পরানো যায় বলে ঘুমন্ত বাচ্চাকে নাড়াচাড়া কম করতে হয়। নাভি শুকানোর আগে কোমরের টেপ একটু নিচে ভাঁজ করে পরান। প্যান্ট স্টাইল কাজে আসে বাচ্চা গড়াগড়ি শুরু করলে, সাধারণত সাইজ M থেকে।",
  },
  {
    q: "প্রথম মাসে কতগুলো ডায়াপার লাগে?",
    a: "দিনে ৮-১২টা, মাসে মোটামুটি ২৪০-৩৬০টা। প্রথম সপ্তাহে সবচেয়ে বেশি লাগে, তারপর ধীরে ধীরে কমে। নবজাতকের প্রস্রাব ঘন ঘন হয়, তাই ভেজা ডায়াপার বেশিক্ষণ রাখা যায় না।",
  },
  {
    q: "বাচ্চা ৪ কেজির বেশি ওজন নিয়ে জন্মালে কি নবজাতক সাইজ কিনব?",
    a: "এক প্যাকের বেশি না। ৪ কেজির ওপরে জন্মানো বাচ্চা দুই-তিন সপ্তাহেই ৫ কেজি ছুঁয়ে ফেলে। অনেক বাবা-মা সরাসরি সাইজ S দিয়েই শুরু করেন, সেটাও চলে। শুধু রানের পাশে ফাঁক থেকে লিক হচ্ছে কি না খেয়াল রাখবেন।",
  },
];

export default async function NewbornGuidePage() {
  const products = await getAllProducts({ size_label: "Newborn", sort: "price_per_piece" })
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
      { "@type": "ListItem", "position": 3, "name": "নবজাতকের সাইজ গাইড", "item": "https://diaperdam.com/guide/newborn-diaper-size" },
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
    "headline": "নবজাতকের ডায়াপার সাইজ গাইড",
    "inLanguage": "bn",
    "datePublished": "2026-06-11",
    "dateModified": today,
    "author": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "publisher": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "mainEntityOfPage": "https://diaperdam.com/guide/newborn-diaper-size",
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
              {" / "}নবজাতকের সাইজ গাইড
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              নবজাতকের ডায়াপার সাইজ গাইড
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              কোন সাইজ, দিনে কয়টা, কয় প্যাক, আর আজকের সবচেয়ে কম দাম।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            হাসপাতাল থেকে ফেরার আগেই অনেকে চার-পাঁচ প্যাক নবজাতক ডায়াপার কিনে রাখেন।
            তিন সপ্তাহ পর দেখা যায় বাচ্চা সাইজ ছাড়িয়ে গেছে, আলমারিতে দেড় প্যাক পড়ে আছে। টাকাটা জলে।
          </p>

          {/* AI summary nugget */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              ছোট করে বললে: নবজাতক (NB) সাইজ ৫ কেজি পর্যন্ত বাচ্চার জন্য। প্রথম মাসে দিনে ৮-১২টা ডায়াপার লাগে,
              মাসে প্রায় ২৪০-৩৬০টা। বেশিরভাগ বাচ্চা ৩-৬ সপ্তাহে এই সাইজ পেরিয়ে যায়, তাই শুরুতে ১-২ প্যাকই যথেষ্ট।
              {cheapest && (
                <>
                  {" "}আজ বাংলাদেশে সবচেয়ে সস্তা নবজাতক ডায়াপার{" "}
                  <strong>৳{Number(cheapest.price_per_piece).toFixed(2)}/পিস</strong>{" "}
                  ({cheapest.brand}, {cheapest.store_name})।
                </>
              )}
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">নবজাতক সাইজ আসলে কাদের জন্য</h2>
          <p className="mb-4">
            প্যাকেটে লেখা থাকে &quot;up to 5 kg&quot;। মানে জন্ম থেকে মোটামুটি ৫ কেজি পর্যন্ত, যেটা গড়ে জীবনের
            প্রথম এক-দেড় মাস। এই বয়সে বাচ্চা প্রায় সারাক্ষণ শোয়া, তাই নবজাতক ডায়াপার সবসময় বেল্ট (টেপ) স্টাইলে আসে।
            পরানো সহজ, ঘুম ভাঙাতে হয় না।
          </p>
          <p className="mb-4">
            নাভির কথাটা আলাদা করে বলি। জন্মের পর নাভি শুকাতে এক-দুই সপ্তাহ লাগে, আর ওই জায়গায় ডায়াপারের কোমর
            ঘষা খেলে সমস্যা। কিছু ব্র্যান্ডের NB ডায়াপারে নাভির জায়গায় কাটআউট থাকে; না থাকলে কোমরের
            অংশটা একটু নিচে ভাঁজ করে পরিয়ে দিন। কাজ একই।
          </p>
          <p className="mb-4">
            বাচ্চা যদি ৪ কেজির বেশি ওজন নিয়ে জন্মায়? তাহলে নবজাতক সাইজ প্রায় কিনতেই হবে না।
            এক প্যাক নিন, বাকিটা সরাসরি <a href="/size/s" className="text-emerald-700 hover:underline">সাইজ S (৩-৭ কেজি)</a> দিয়ে চালান।
            পরের সাইজগুলো কত কেজি, কোন ব্র্যান্ড লেবেলের চেয়ে ছোট-বড় চলে — সব দেখুন{" "}
            <a href="/guide/diaper-size-chart" className="text-emerald-700 hover:underline font-medium">পুরো ডায়াপার সাইজ চার্টে</a>।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">দিনে কয়টা লাগে</h2>
          <p className="mb-4">
            প্রথম সপ্তাহে দিনে ১০-১২টা পর্যন্ত যেতে পারে। অবাক হবেন না, এটাই স্বাভাবিক। নবজাতক অল্প অল্প করে
            ঘন ঘন প্রস্রাব করে, আর ভেজা ডায়াপার ফেলে না দিলে র‍্যাশ হয়। দ্বিতীয় সপ্তাহ থেকে সংখ্যাটা ৮-১০-এ নামে।
            মাস শেষে হিসাব করলে ২৪০-৩৬০টার মতো দাঁড়ায়।
          </p>
          <p className="mb-4">
            এই সংখ্যাটাই প্রতি পিস দামকে এত জরুরি করে তোলে। প্যাকের গায়ের দাম দেখে কেনাকাটা করলে ঠকবেন;
            ৪০ পিসের প্যাক আর ৮০ পিসের প্যাক তুলনা হয় প্রতি পিসে কত পড়ল তা দিয়ে। আমরা DiaperDam-এ
            প্রতিদিন চালডাল, দারাজ, স্বপ্নসহ ৬টা দোকানের দাম টেনে এনে সব প্যাক প্রতি পিস দামে সাজাই।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কয় প্যাক কিনবেন</h2>
          <p className="mb-2">আমাদের পরামর্শ পরিষ্কার: নবজাতক সাইজ মজুত করবেন না।</p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>জন্মের আগে: নবজাতক সাইজ ১-২ প্যাক, সাইজ S এক প্যাক।</li>
            <li>বাচ্চার ওজন ৪.৫ কেজি ছুঁলে নতুন NB প্যাক কেনা বন্ধ।</li>
            <li>বড় প্যাকে প্রতি পিস সস্তা পড়ে ঠিকই, কিন্তু আউটগ্রো করা ডায়াপারের দাম শূন্য।</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাইজ বড় করার ৪টা লক্ষণ</h2>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>রানের পাশে বা কোমরে লাল দাগ বসে যাচ্ছে</li>
            <li>টেপ টেনে মাঝখানে আনতে কষ্ট হচ্ছে</li>
            <li>ঘন ঘন লিক, বিশেষ করে রাতে</li>
            <li>ওজন ৫ কেজির কাছাকাছি</li>
          </ul>
          <p className="mb-4">
            দুটো লক্ষণ মিললেই পরের সাইজে যান। মাঝামাঝি অবস্থায় থাকলে বড়টাই নিন, ছোট ডায়াপারে লিক হয় বেশি।
          </p>

          {/* Live price table — proprietary data layer */}
          {top.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">আজকের নবজাতক ডায়াপারের দাম</h2>
              <p className="mb-3 text-sm text-slate-500">
                প্রতি পিস দামে সাজানো, প্রতিদিন আপডেট হয়। পুরো তালিকা{" "}
                <a href="/size/newborn" className="text-emerald-700 hover:underline">নবজাতক সাইজ পাতায়</a>।
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
                          <a href={`/brand/${p.brand_slug}/size/newborn`} className="text-emerald-700 hover:underline">
                            {p.brand} {p.line ?? ""} {p.pack_qty} পিস
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

          {/* Cross-links */}
          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/size/newborn" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সব নবজাতক ডায়াপারের দাম
              </a>
              <a href="/guide/diaper-size-chart" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                পুরো সাইজ চার্ট
              </a>
              <a href="/guide/diaper-rash-prevention" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                র‍্যাশ থেকে বাঁচার উপায়
              </a>
              <a href="/size/s" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সাইজ S ডায়াপার
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
