import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "রাতের ডায়াপার: ৮ ঘণ্টা ঘুমের মধ্যে লিক ঠেকানোর আসল উপায়",
  description:
    "রাতে ডায়াপার বদলানো হয় না — তাই শোষণ আর ফিটটাই আসল। বাংলাদেশে কোন ব্র্যান্ড রাতের জন্য ভালো, সাইজ কীভাবে বাছবেন, লিক হলে কী করবেন, আর আজকের সবচেয়ে কম দামের XL ডায়াপার কোথায় — সব এক পাতায়।",
  alternates: { canonical: "https://diaperdam.com/guide/night-diaper" },
};

const FAQS = [
  {
    q: "রাতে কতক্ষণ ডায়াপার পরিয়ে রাখা যায়?",
    a: "সাধারণত ৮-১০ ঘণ্টা পর্যন্ত একটা ভালো মানের ডায়াপার ধরতে পারে, যদি বাচ্চা শুধু প্রস্রাব করে। কিন্তু পায়খানা হলে সাথে সাথে বদলাতে হবে, রাত হলেও। নবজাতকের ক্ষেত্রে রাতেও ২-৩ ঘণ্টায় বদলানো দরকার হয়, কারণ ওদের বেশি প্রস্রাব হয় আর চামড়াও বেশি সংবেদনশীল।",
  },
  {
    q: "রাতের জন্য কোন সাইজের ডায়াপার ভালো?",
    a: "দিনের সাইজ থেকে এক সাইজ বড় দেওয়া অনেকের পরামর্শ — ঘুমের মধ্যে শরীর আলাদাভাবে নড়াচড়া করে, একটু ঢিলে মানে ঘষা কম, আর ধারণক্ষমতাও বেশি। তবে এটা নির্ভর করে ব্র্যান্ডের কাটের ওপর। যদি বর্তমান সাইজে কোমরে লিক না হয়ে পায়ের কাছে হয়, সাইজ বড় করুন। কোমরে হলে ফিট ঠিক করুন।",
  },
  {
    q: "রাতে লিক হলে কী করব?",
    a: "প্রথমে চেক করুন — লিক কোথা থেকে হচ্ছে। পায়ের রাবার থেকে হলে সাইজ ছোট বা ফিট ঠিক নেই। কোমরের ফাঁক দিয়ে হলে সাইজ বড় করুন। যদি ডায়াপারটাই ভিজে যায় (saturation) তাহলে উচ্চ-শোষণের ব্র্যান্ড বা লাইন ট্রাই করুন। বুকের দুধ খাওয়া বাচ্চারা রাতে বেশি প্রস্রাব করে — তাদের ক্ষেত্রে অনেক সময় শোষণ বাড়ানোটাই একমাত্র সমাধান।",
  },
  {
    q: "রাতের জন্য কি আলাদা 'নাইট ডায়াপার' কিনতে হবে?",
    a: "বাংলাদেশের বাজারে আলাদা 'নাইট' লেবেলের ডায়াপার কমই পাওয়া যায়। সাধারণ XL বা XXL সাইজের ভালো ব্র্যান্ডের ডায়াপারই রাতে ভালো কাজ করে, যদি সাইজ ঠিক থাকে। প্রিমিয়াম লাইনগুলো (যেমন Huggies Gold, MamyPoko Extra Absorb) শোষণে একটু এগিয়ে থাকে, কিন্তু প্রতি পিস দাম বেশি — পার্থক্য কতটা সেটা বাচ্চার ওপর নির্ভর করে।",
  },
  {
    q: "নবজাতকের রাতে কতবার ডায়াপার বদলাবেন?",
    a: "নবজাতকের প্রথম ৪-৬ সপ্তাহে রাতেও প্রতি ২-৩ ঘণ্টায় বদলানো দরকার হয়, কারণ ঘন ঘন খাওয়ানো মানে ঘন ঘন প্রস্রাব। এরপর যখন টানা বেশিক্ষণ ঘুমাতে শুরু করে, তখন একটা ভালো ডায়াপার রাত পার করতে পারে। পায়খানা হলে যেকোনো বয়সেই সাথে সাথে বদলান — রাতে সেটা করলে র‍্যাশ অনেক কমে।",
  },
];

export default async function NightDiaperGuidePage() {
  // XL is the most common overnight size; show cheapest across all sizes as fallback
  const xlProducts = await getAllProducts({ size_label: "XL", sort: "price_per_piece" })
    .catch(() => [] as DiaperProduct[]);
  const allProducts = await getAllProducts({ sort: "price_per_piece" })
    .catch(() => [] as DiaperProduct[]);

  const tableProducts = xlProducts.length >= 4 ? xlProducts.slice(0, 6) : allProducts.slice(0, 6);
  const showingXL = xlProducts.length >= 4;
  const cheapestXL = xlProducts[0];
  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "হোম", "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "ডায়াপার", "item": "https://diaperdam.com/diapers" },
      { "@type": "ListItem", "position": 3, "name": "রাতের ডায়াপার গাইড", "item": "https://diaperdam.com/guide/night-diaper" },
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
    "headline": "রাতের ডায়াপার: ৮ ঘণ্টা ঘুমের মধ্যে লিক ঠেকানোর আসল উপায়",
    "inLanguage": "bn",
    "datePublished": "2026-06-19",
    "dateModified": today,
    "author": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "publisher": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "mainEntityOfPage": "https://diaperdam.com/guide/night-diaper",
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
              {" / "}রাতের ডায়াপার গাইড
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              রাতের ডায়াপার: ৮ ঘণ্টা ঘুমের মধ্যে লিক ঠেকানোর উপায়
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              কোন সাইজ, কোন ব্র্যান্ড, লিক হলে কী করবেন, আর আজকের সবচেয়ে কম দাম।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            রাত ২টায় বিছানা ভেজা দেখলে যে ক্লান্তি লাগে, সেটা অভিজ্ঞ মা-বাবারা চেনেন।
            দিনে লিক হলে বদলে ফেলা যায়। কিন্তু রাতে একটাই ডায়াপারে ৭-৯ ঘণ্টা পার করতে হয়।
            ওই সময়টায় ভালো ডায়াপার মানে শুধু লিক নয়, বাচ্চার ঘুম আর চামড়াও।
          </p>

          {/* Summary nugget */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              সংক্ষেপে: রাতের ডায়াপারে দুটো জিনিস আসল — শোষণ আর ফিট। সাইজ এক নম্বর বড় দিলে শোষণ বাড়ে,
              লিক কমে। আলাদা &quot;নাইট ডায়াপার&quot; খুঁজতে হবে না; ভালো ব্র্যান্ডের XL বা XXL-ই যথেষ্ট।
              {cheapestXL && (
                <>
                  {" "}আজ বাংলাদেশে XL সাইজে সবচেয়ে কম প্রতি পিস দাম{" "}
                  <strong>৳{Number(cheapestXL.price_per_piece).toFixed(2)}/পিস</strong>{" "}
                  ({cheapestXL.brand}{cheapestXL.line ? ` ${cheapestXL.line}` : ""}, {cheapestXL.store_name})।
                </>
              )}
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">রাতে কেন আলাদা ভাবতে হয়</h2>
          <p className="mb-4">
            দিনে বাচ্চা নড়াচড়া করে বলে প্রস্রাব ডায়াপারে ছড়িয়ে পড়ে, কিন্তু পিঠের ওপর বেশিক্ষণ থাকে না।
            শুয়ে থাকলে উল্টোটা হয় — সব প্রস্রাব একটা জায়গায় জমে। এই কারণে রাতের ডায়াপারের পেছনের অংশ
            বেশি চাপে পড়ে, আর কোমর বা পায়ের ফাঁক দিয়ে লিক বের হওয়ার সুযোগ বাড়ে।
          </p>
          <p className="mb-4">
            এর ওপর বাংলাদেশের গরমে রাতে ঘাম হয়, বদ্ধ জায়গায় গরম জমে — ডায়াপার পরা জায়গাটা আরও আর্দ্র হয়।
            ঘুম থেকে উঠলে যদি লালচে হয়ে থাকে, বেশিরভাগ সময় কারণ এটাই।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাইজ: সবচেয়ে বড় ভুলটা কোথায় হয়</h2>
          <p className="mb-4">
            ধরুন বাচ্চার ওজন ১০ কেজি, চার্ট বলছে M বা L। দিনে L ঠিকই চলছে।
            রাতে ওই একই L-এ পুরো রাত থাকলে ধারণক্ষমতা কম পড়তে পারে।
            XL ট্রাই করুন — কোমরের ইলাস্টিক একটু ঢিলে, মানে ঘষা কম, আর মাঝের অংশে বেশি জায়গা।
          </p>
          <p className="mb-4">
            তবে একটা বিষয়: একই ব্র্যান্ডের M আর XL-এর দামে পার্থক্য থাকে। আমাদের টেবিলে প্রতি পিস দামে
            দেখলে XL-এর দাম M-এর চেয়ে খুব বেশি না, কারণ প্যাকে পিস কম থাকে আর প্রতি পিস একটু বেশি।
            রাতে একটাই পিস — সেটা ঠিক হলে বাকি রাতটা নিশ্চিন্ত।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">বেল্ট না প্যান্ট, রাতের জন্য কোনটা</h2>
          <p className="mb-4">
            শুয়ে থাকা অবস্থায় ডায়াপার পরাতে বেল্ট টাইপ সহজ — কোনো উপরে তুলতে হয় না।
            কিন্তু ৬ মাসের বেশি বয়সে বাচ্চা উল্টেপাল্টে ঘুমায়, তখন প্যান্ট টাইপও চলে।
            মূল পার্থক্যটা শোষণে নয়, লাগানো আর খোলার সহজতায়।
            বিস্তারিত তুলনার জন্য{" "}
            <a href="/guide/belt-vs-pant-diaper" className="text-emerald-700 hover:underline">বেল্ট বনাম প্যান্ট গাইড</a>
            {" "}দেখুন।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">লিক বন্ধ করার ব্যবহারিক চেকলিস্ট</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>
              <strong>পায়ের রাবার ভেতরের দিকে ভাঁজ করা আছে কি?</strong>{" "}
              প্রতিটা ডায়াপারে দুটো রাফেল (ruffle) থাকে। বাইরে বের হলে লিক হবে।
            </li>
            <li>
              <strong>কোমরের ফিতা সমান লাগানো কি?</strong>{" "}
              একদিক উঁচু হলে সেই ফাঁক দিয়ে বের হয়।
            </li>
            <li>
              <strong>ডায়াপার পরানোর পর আঙুল ঢোকে কি?</strong>{" "}
              কোমরে এক আঙুল ঢোকার জায়গা থাকলে ফিট ঠিক আছে। দুই আঙুল গেলে বড় করুন।
            </li>
            <li>
              <strong>শেষ বদলানোর সময় কতক্ষণ আগে?</strong>{" "}
              ঘুমানোর আগে বদলে দিন — তাহলে সম্পূর্ণ শোষণক্ষমতা নিয়ে রাত শুরু।
            </li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">নবজাতকের রাত আলাদা</h2>
          <p className="mb-4">
            জন্মের প্রথম মাস-দুয়েক টানা রাত কাটানো সম্ভব নয়, ডায়াপার যতই ভালো হোক।
            নবজাতক ২-৩ ঘণ্টায় খাবে, প্রস্রাব করবে। এই বয়সে রাতে বদলানো কমানোর চেষ্টা না করে
            ঘুমানোর পাশে ডায়াপার রেখে দিন — বদলাতে ২ মিনিটও লাগবে না।
            ৩-৪ মাসের পর যখন লম্বা ঘুম শুরু হয়, তখন একটা ভালো XL বা সমতুল্য রাত পার করতে পারে।
          </p>

          {/* Live price table */}
          {tableProducts.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">
                আজকের সবচেয়ে কম প্রতি পিস দামের {showingXL ? "XL" : ""} ডায়াপার
              </h2>
              <p className="mb-3 text-sm text-slate-500">
                {showingXL
                  ? "XL সাইজ ফিল্টার করা, প্রতি পিস দামে সাজানো, প্রতিদিন আপডেট হয়।"
                  : "সব সাইজ মিলিয়ে, প্রতি পিস দামে সাজানো, প্রতিদিন আপডেট হয়।"}{" "}
                পুরো গ্রিড{" "}
                <a href="/size/xl" className="text-emerald-700 hover:underline">XL সাইজ পাতায়</a>।
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
                    {tableProducts.map(p => (
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

          {/* Cross-links */}
          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/guide/diaper-rash-prevention" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                র‍্যাশ প্রতিরোধ গাইড
              </a>
              <a href="/guide/diaper-overnight-leak" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                রাতের লিক সমাধান গাইড
              </a>
              <a href="/guide/belt-vs-pant-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                বেল্ট বনাম প্যান্ট গাইড
              </a>
              <a href="/guide/diaper-travel-tips" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                ভ্রমণ গাইড
              </a>
              <a href="/guide/newborn-diaper-size" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                নবজাতকের সাইজ গাইড
              </a>
              <a href="/guide/diaper-size-by-weight" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সাইজ চার্ট গাইড
              </a>
              <a href="/size/xl" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                XL সাইজ তুলনা
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
