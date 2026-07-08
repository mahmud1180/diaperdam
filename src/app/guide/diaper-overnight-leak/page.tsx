import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "রাতে ডায়াপার লিক হচ্ছে? কোথা থেকে হচ্ছে দেখে সমাধান করুন",
  description:
    "রাতে ঘুম থেকে উঠে বিছানা ভেজা দেখলে প্রথমেই দেখুন লিক কোমরে, পায়ে নাকি পিঠে — জায়গা অনুযায়ী কারণ আর সমাধান আলাদা। ফিট ঠিক করা, সাইজ বদলানো, নাকি ব্র্যান্ড বদলানো — কখন কোনটা করবেন।",
  alternates: { canonical: "https://diaperdam.com/guide/diaper-overnight-leak" },
};

const FAQS = [
  {
    q: "প্রতি রাতেই একই জায়গায় লিক হচ্ছে, কারণ কী?",
    a: "একই জায়গায় বারবার লিক মানে সেটা এলোমেলো ঘটনা না, নির্দিষ্ট কারণ আছে। পিঠে হলে ৯০% ক্ষেত্রে কোমরের ফিতা ঢিলে বা অসমান। পায়ের ফাঁকে হলে সাইজ ছোট বা রাফেল বাইরে বেরিয়ে আছে। পুরো ডায়াপার ভিজে গেলে (saturation) সেটা ফিট না, শোষণক্ষমতার সমস্যা।",
  },
  {
    q: "সাইজ বড় করলেই কি লিক বন্ধ হবে?",
    a: "সবসময় না। সাইজ বড় করা কাজ করে যখন সমস্যা শোষণক্ষমতা কম পড়া (সারারাত ভিজে ডায়াপার ফুলে থাকে)। কিন্তু কোমরের ফিতা ভুলভাবে লাগানোর কারণে লিক হলে সাইজ বড় করলে উল্টো ঢিলে হয়ে আরও লিক হতে পারে। আগে ফিট ঠিকমতো লাগানো হচ্ছে কিনা যাচাই করুন, তারপর সাইজ বদলান।",
  },
  {
    q: "ডাবল ডায়াপার পরানো কি ঠিক আছে?",
    a: "দুটো ডায়াপার একসাথে পরালে ভেতরেরটা ঠিকমতো ফিট হয় না আর বাইরেরটার রাফেল কাজ করে না — ফলে উল্টো বেশি লিক হয়। এর বদলে একটা ভালো শোষণক্ষমতার লাইন বা বুস্টার ইনসার্ট (যদি পাওয়া যায়) ব্যবহার করুন।",
  },
  {
    q: "পাশ ফিরে শোয়া বাচ্চার লিক বেশি কেন?",
    a: "পাশ ফিরে শুলে প্রস্রাব ডায়াপারের একপাশে জমা হয়, পুরো শোষণক্ষমতা সমানভাবে ব্যবহার হয় না। ওই একপাশ ভরে গেলে কোমরের বা পায়ের ফাঁক দিয়ে বের হয়ে যায়। এক্ষেত্রে পায়ের রাবার ভেতরের দিকে ভাঁজ করে লাগানো আছে কিনা আবার চেক করুন — এটাই সবচেয়ে কমন কারণ।",
  },
  {
    q: "বিছানা ভেজা থেকে বাঁচতে কী করব?",
    a: "ওয়াটারপ্রুফ ম্যাট্রেস প্রোটেক্টর বা বাচ্চার নিচে একটা পাতলা ওয়াটারপ্রুফ শিট বিছিয়ে রাখুন। এতে লিক হলেও পুরো তোশক ধুতে হয় না, শুধু শিট বদলালেই চলে। ডায়াপার ঠিক করার পাশাপাশি এটা একটা ব্যাকআপ ব্যবস্থা হিসেবে রাখা ভালো।",
  },
];

export default async function DiaperOvernightLeakPage() {
  const xlProducts = await getAllProducts({ size_label: "XL", sort: "price_per_piece" })
    .catch(() => [] as DiaperProduct[]);
  const allProducts = await getAllProducts({ sort: "price_per_piece" })
    .catch(() => [] as DiaperProduct[]);

  const tableProducts = xlProducts.length >= 4 ? xlProducts.slice(0, 6) : allProducts.slice(0, 6);
  const showingXL = xlProducts.length >= 4;
  const cheapest = tableProducts[0];
  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      { "@type": "ListItem", position: 3, name: "রাতের লিক সমাধান গাইড", item: "https://diaperdam.com/guide/diaper-overnight-leak" },
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
    headline: "রাতে ডায়াপার লিক হচ্ছে? কোথা থেকে হচ্ছে দেখে সমাধান করুন",
    inLanguage: "bn",
    datePublished: "2026-07-08",
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/diaper-overnight-leak",
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
              {" / "}রাতের লিক সমাধান গাইড
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              রাতে ডায়াপার লিক হচ্ছে? জায়গা দেখে কারণ বের করুন
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              পিঠে, পায়ে নাকি পুরো ডায়াপারে — লিকের জায়গা অনুযায়ী আলাদা সমাধান।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            সকালে উঠে বিছানার একটা অংশ ভেজা দেখলে বেশিরভাগ অভিভাবক প্রথমেই ভাবেন ডায়াপারটাই খারাপ
            বা সাইজ ছোট হয়ে গেছে। কিন্তু লিক কোথা থেকে হয়েছে সেটা খেয়াল করলে দেখা যায় প্রতিটা জায়গার
            কারণ আলাদা — আর সমাধানও আলাদা। ভুল জায়গায় ঠিক করতে গেলে (যেমন সাইজ বড় করা, যেখানে
            আসল সমস্যা ফিতা ঢিলে) সমস্যা রয়েই যায়।
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              <strong>সংক্ষেপে:</strong> পিঠ/কোমরে লিক = ফিতা ঢিলে বা অসমান। পায়ের ফাঁকে লিক = সাইজ
              ছোট বা রাফেল ভাঁজ করা নেই। পুরো ডায়াপার ভিজে যাওয়া = শোষণক্ষমতা কম, সাইজ বা ব্র্যান্ড
              বদলান।
              {cheapest && (
                <>
                  {" "}আজ {showingXL ? "XL সাইজে" : "সব সাইজ মিলিয়ে"} সবচেয়ে কম প্রতি পিস{" "}
                  <strong>৳{Number(cheapest.price_per_piece).toFixed(2)}/পিস</strong>{" "}
                  ({cheapest.brand}{cheapest.line ? ` ${cheapest.line}` : ""}, {cheapest.store_name})।
                </>
              )}
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">পিঠে বা কোমরের ওপরে লিক</h2>
          <p className="mb-4">
            এটাই সবচেয়ে কমন অভিযোগ, আর প্রায় সবসময় কারণ ফিট। শুয়ে থাকা অবস্থায় প্রস্রাব মাধ্যাকর্ষণের
            টানে পিঠের দিকে জমে। কোমরের ফিতা একদিকে বেশি টাইট বা একদিকে ঢিলে থাকলে সেই ফাঁক দিয়ে
            বেরিয়ে যায়। ডায়াপার পরানোর সময় দুই পাশের ফিতা আয়নার মতো সমান আছে কিনা দেখুন — একটা
            সহজ চেক হলো পেছনের অংশটা সামনের চেয়ে সামান্য উঁচু করে লাগানো, যাতে জমে থাকা প্রস্রাব
            সহজে গড়িয়ে বের হতে না পারে।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">পায়ের ফাঁক দিয়ে লিক</h2>
          <p className="mb-4">
            প্রতিটা ডায়াপারের পায়ের দুই পাশে একটা সরু ইলাস্টিক রাফেল (leg ruffle) থাকে যেটা ভেতরের
            দিকে ভাঁজ করে লাগানোর কথা। পরানোর তাড়াহুড়োয় এটা প্রায়ই বাইরের দিকে উল্টে থেকে যায় —
            তখন সেই রাস্তা দিয়েই লিক বের হয়। প্রতিবার পরানোর পর আঙুল দিয়ে পায়ের চারপাশ একবার
            ছুঁয়ে দেখুন, রাফেল ভেতরে গুটানো আছে কিনা। এটা ঠিক থাকার পরও লিক হলে বুঝবেন সাইজ ছোট
            হয়ে গেছে — বিস্তারিত ওজন-ভিত্তিক সাইজ মেলাতে{" "}
            <a href="/guide/diaper-size-by-weight" className="text-emerald-700 hover:underline">সাইজ চার্ট গাইড</a>{" "}
            দেখুন।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">পুরো ডায়াপার ভিজে ফুলে যাওয়া</h2>
          <p className="mb-4">
            ফিতা আর রাফেল দুটোই ঠিক থাকার পরও যদি সকালে ডায়াপার পুরোপুরি ভারী আর ফোলা অবস্থায়
            পান, তাহলে সমস্যাটা ফিট না — শোষণক্ষমতা কম পড়ছে। এই ক্ষেত্রে দুটো রাস্তা: এক সাইজ বড়
            করা (একই ব্র্যান্ডে বেশি জায়গা মানে বেশি জেল), অথবা একই সাইজে বেশি শোষণক্ষমতার লাইন
            ট্রাই করা। বুকের দুধ খাওয়া বাচ্চাদের রাতে প্রস্রাবের পরিমাণ বেশি হয় বলে এই সমস্যা তাদের
            মধ্যে বেশি দেখা যায়।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">ডাবল ডায়াপার বা ইনসার্ট নিয়ে ভুল ধারণা</h2>
          <p className="mb-4">
            দুটো ডায়াপার একসাথে পরানো একটা কমন ঘরোয়া টোটকা, কিন্তু এতে সমস্যা বাড়ে কমে না।
            ভেতরের ডায়াপারটা বাইরেরটার চাপে ঠিকমতো ফিট হয় না, রাফেল কাজ করে না, ফলে ভেতরের
            ডায়াপার ভরে গেলে বাইরেরটার ফাঁক দিয়েই লিক বেরিয়ে যায় — উল্টো ফলাফল। এর বদলে ভালো
            শোষণক্ষমতার একটা লাইন বেছে নেওয়াই বেশি কার্যকর।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">লিক-প্রুফ করার দ্রুত চেকলিস্ট</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li><strong>ঘুমানোর ঠিক আগে বদলান</strong> — সম্পূর্ণ শোষণক্ষমতা নিয়ে রাত শুরু হবে।</li>
            <li><strong>দুই পাশের ফিতা সমান করে লাগান</strong> — একদিক উঁচু হলে ওই ফাঁক দিয়ে লিক হয়।</li>
            <li><strong>পায়ের রাফেল ভেতরে ভাঁজ করা আছে কিনা চেক করুন</strong> — সবচেয়ে বেশি এড়িয়ে যাওয়া ধাপ।</li>
            <li><strong>কোমরে এক আঙুল ঢোকে এমন টাইট রাখুন</strong> — দুই আঙুল ঢুকলে ঢিলে, ফাঁকা রাখলে টাইট।</li>
            <li><strong>ম্যাট্রেস প্রোটেক্টর বিছিয়ে রাখুন</strong> — বাকি সব ঠিক থাকার পরও মাঝে মাঝে লিক হয়, তোশক বাঁচবে।</li>
          </ul>
          <p className="mb-4">
            এই চেকলিস্ট মেনে ৩-৪ রাত ট্রাই করেও লিক না কমলে তবেই সাইজ বা ব্র্যান্ড বদলান —
            আগে ফিট ঠিক করে নিলে অনেক সময় নতুন প্যাকেট কেনারই দরকার পড়ে না।
          </p>

          {/* Live price table */}
          {tableProducts.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">
                আজকের সবচেয়ে কম দামের {showingXL ? "XL" : ""} ডায়াপার
              </h2>
              <p className="mb-3 text-sm text-slate-500">
                শোষণক্ষমতার সমস্যায় সাইজ বা লাইন বদলানোর সিদ্ধান্ত নিলে এখান থেকে শুরু করুন — প্রতিদিন
                আপডেট হয়। পুরো গ্রিড{" "}
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
              <a href="/guide/night-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                রাতের ডায়াপার গাইড
              </a>
              <a href="/guide/diaper-size-by-weight" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সাইজ চার্ট গাইড
              </a>
              <a href="/guide/belt-vs-pant-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                বেল্ট বনাম প্যান্ট
              </a>
              <a href="/guide/diaper-rash-prevention" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                র‍্যাশ প্রতিরোধ গাইড
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
