import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "কাপড় না ডিসপোজেবল ডায়াপার? বাংলাদেশে আসল হিসাব ২০২৬",
  description:
    "কাপড়ের ন্যাপি মাসে ৳০, ডিসপোজেবল মাসে ৳১,৭০০–৬,৫০০। কিন্তু হিসাবটা এখানেই শেষ না। গরম, ধোয়া, কাজ, ঘুম — সব মিলিয়ে বাংলাদেশে কোনটা আসলে কাজের সেটা এক পাতায়।",
  alternates: { canonical: "https://diaperdam.com/guide/cloth-vs-disposable-bangladesh" },
};

const FAQS = [
  {
    q: "কাপড়ের ন্যাপিতে কি ডায়াপার র‍্যাশ কম হয়?",
    a: "সবসময় না। কাপড় ভেজা থাকলে চামড়া বেশিক্ষণ ভেজার সংস্পর্শে থাকে, যা র‍্যাশের একটা বড় কারণ। ডিসপোজেবল ডায়াপারের শোষণস্তর ভেজা আলাদা রাখে। তবে কাপড় ঘনঘন বদলানো হলে এবং পরিষ্কার থাকলে র‍্যাশের ঝুঁকি কম। বাংলাদেশের গরম-ঘামে কাপড় শুকায় না, তাই র‍্যাশের ঝুঁকি এখানে কিছুটা বেশি।",
  },
  {
    q: "রাতে কাপড়ের ন্যাপি ব্যবহার করা যাবে?",
    a: "কঠিন। কাপড় ৩০-৪৫ মিনিট পর ভিজে যায়, তারপর বাচ্চা চামড়ায় ভেজা অনুভব করে — জেগে ওঠে, কাঁদে। রাতে ৬-৮ ঘণ্টা শোষণ দরকার, সেটা কাপড়ে সম্ভব না। রাতের জন্য ডিসপোজেবল, দিনে কাপড় — এই মিশ্র পদ্ধতি অনেকে ব্যবহার করেন। তাতে মাসে ৳৫০০-৮০০ বাঁচে, ঘুম নষ্ট হয় না।",
  },
  {
    q: "মডার্ন ক্লথ ডায়াপার (পকেট ডায়াপার) কি ভালো?",
    a: "শোষণ ভালো কিন্তু দাম বেশি। একটা পকেট ডায়াপার (Bumgenius, Charlie Banana) ৳৮০০-১,৫০০। ১৮-২০টার সেট লাগে = ৳১৪,০০০-৩০,০০০। ডিটার্জেন্ট-সানস্ক্রিন-ফ্যাব্রিক সফটেনার দিলে পানি না টেনে নিতে পারে। বাংলাদেশে এই ব্র্যান্ডের সার্ভিস সেন্টার নেই। সমস্যা হলে নিজেই সামলাতে হবে।",
  },
  {
    q: "কাপড়ের ন্যাপি কোথায় কিনব?",
    a: "সাধারণ সাদা কটন কাপড় যেকোনো কাপড়ের দোকানে পাওয়া যায়। পুরনো নরম শাড়ি বা ওড়না থেকেও ভালো ন্যাপি হয়। মাপ: ৫০×৫০ সেমি বর্গাকার, ৪-৫ ভাঁজে। অনলাইনে তৈরি কটন ন্যাপি পাওয়া যায় শপআপ, দারাজে।",
  },
  {
    q: "দুটোই ব্যবহার করা কি ঠিক আছে?",
    a: "হ্যাঁ, এটাই সবচেয়ে প্রচলিত সমাধান। বাসায় দিনে কাপড়, বাইরে গেলে বা রাতে ডিসপোজেবল। মাসে ৬০-৭০টা ডিসপোজেবল লাগে, বাকি সময় কাপড়। Bashundhara L-এ ৬০ পিস = ৳৫৮০। পুরো মাসের খরচ ৳১,০০০-এর মধ্যে রাখা সম্ভব।",
  },
];

export default async function ClothVsDisposablePage() {
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
      { "@type": "ListItem", "position": 3, "name": "কাপড় না ডিসপোজেবল", "item": "https://diaperdam.com/guide/cloth-vs-disposable-bangladesh" },
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
    "headline": "কাপড় না ডিসপোজেবল ডায়াপার? বাংলাদেশে আসল হিসাব",
    "inLanguage": "bn",
    "datePublished": "2026-06-26",
    "dateModified": today,
    "author": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "publisher": { "@type": "Organization", "name": "DiaperDam", "url": "https://diaperdam.com" },
    "mainEntityOfPage": "https://diaperdam.com/guide/cloth-vs-disposable-bangladesh",
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
              {" / "}কাপড় না ডিসপোজেবল
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              কাপড় না ডিসপোজেবল ডায়াপার?
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              বাংলাদেশে আসল খরচ, সুবিধা-অসুবিধা, আর কোন পরিস্থিতিতে কোনটা।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">

          <p className="mb-4">
            দাদি বললেন কাপড় ব্যবহার করো, পরিবেশ ভালো থাকবে আর পয়সা বাঁচবে। বন্ধু বললেন ডিসপোজেবল ছাড়া
            রাতে ঘুমানো সম্ভব না। দুজনেই ঠিক বলেছেন। সমস্যা হলো কেউ হিসাব দেয়নি।
          </p>

          {/* Summary nugget */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              <strong>সংক্ষেপে:</strong> বাসায় দিনে কাপড়, রাতে ও বাইরে ডিসপোজেবল — এই মিশ্র পদ্ধতিতে
              মাসে খরচ ৳৮০০-১,২০০-তে রাখা সম্ভব, ঘুমও ঠিক থাকে।
              {cheapest && (
                <>
                  {" "}আজ সবচেয়ে কম প্রতি পিস{" "}
                  <strong>৳{Number(cheapest.price_per_piece).toFixed(2)}/পিস</strong>{" "}
                  ({cheapest.brand}{cheapest.size_label ? `, সাইজ ${cheapest.size_label}` : ""}, {cheapest.store_name})।
                </>
              )}
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">খরচের হিসাব আগে, বাকি সব পরে</h2>
          <p className="mb-4">
            কাপড়ের ন্যাপির সত্যিকারের খরচ শূন্য না। কাপড় কিনতে হয়, ধুতে হয়, শুকাতে হয়, আবার লাগাতে হয়।
            ডিসপোজেবলে শুধু কিনলেই হয়। দুটোর মোট খরচ দেখি:
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">খরচের ধরন</th>
                  <th className="py-2 px-3 border border-slate-200">কাপড়ের ন্যাপি</th>
                  <th className="py-2 px-3 border border-slate-200">ডিসপোজেবল (দেশি)</th>
                  <th className="py-2 px-3 border border-slate-200">ডিসপোজেবল (বিদেশি)</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr>
                  <td className="py-2 px-3 border border-slate-200">প্রথম মাস</td>
                  <td className="py-2 px-3 border border-slate-200">৳৩০০-৫০০ (১৫-২০টা কাপড়)</td>
                  <td className="py-2 px-3 border border-slate-200">৳১,৭০০-২,৫০০</td>
                  <td className="py-2 px-3 border border-slate-200">৳৪,৫০০-৬,৫০০</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-3 border border-slate-200">পরের প্রতি মাস</td>
                  <td className="py-2 px-3 border border-slate-200">৳০ (শুধু ডিটার্জেন্ট)</td>
                  <td className="py-2 px-3 border border-slate-200">৳১,৭০০-২,৫০০</td>
                  <td className="py-2 px-3 border border-slate-200">৳৪,৫০০-৬,৫০০</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-slate-200">দুই বছরের মোট</td>
                  <td className="py-2 px-3 border border-slate-200">৳৩,৫০০-৪,৫০০</td>
                  <td className="py-2 px-3 border border-slate-200">৳৪০,০০০-৫৮,০০০</td>
                  <td className="py-2 px-3 border border-slate-200">৳১,০৬,০০০-১,৫৪,০০০</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mb-4">
            সংখ্যাগুলো বড় মনে হলেও বাস্তবে কাউকেই পুরোটা কাপড় বা পুরোটা ডিসপোজেবল দিয়ে যেতে দেখি না।
            কারণটা সহজ — দুটোরই সীমাবদ্ধতা আছে।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কাপড়ের ন্যাপি: কোথায় কাজ করে, কোথায় করে না</h2>
          <p className="mb-3">
            কাপড় ভালো কাজ করে যখন বাচ্চা বাসায় থাকে, কাছে কেউ আছে বদলানোর জন্য, আর ধোয়ার জায়গা সহজে আছে।
            ঢাকার একটা ফ্ল্যাটে বারান্দা থাকলে কাপড় শুকানো যায়। গ্রামে রোদে দ্রুত শোকায়।
          </p>
          <p className="mb-4">
            কিন্তু চাপ পড়ে যখন:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-1 text-slate-600">
            <li>বর্ষায় কাপড় শুকায় না, স্যাঁতসেঁতে ঘরে ঝুলে থাকে</li>
            <li>বাইরে গেলে ভেজা কাপড় ব্যাগে বহন করতে হয়</li>
            <li>রাতে বাচ্চা ঘুমের মধ্যে ভেজা অনুভব করলেই কাঁদে</li>
            <li>কারো শরীর খারাপ, গৃহকর্মী ছুটিতে — কাপড় জমে যায়</li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">ডিসপোজেবলের সুবিধা যেটা অনেকে বলে না</h2>
          <p className="mb-4">
            শুধু সুবিধার কথা শুনলে মনে হয় ডিসপোজেবল কেনার অজুহাত দেওয়া হচ্ছে। আসলে কিছু পরিস্থিতিতে
            ডিসপোজেবল ছাড়া বিকল্প নেই। নবজাতকের প্রথম মাসে দিনে ১০-১২ বার বদলাতে হয়। মলত্যাগের পর
            কাপড় হাতে ধুতে গেলে সময় আর পানি দুটোই বেশি লাগে। আর যদি মা একা থাকেন কিংবা কাজে ফিরে
            যেতে হয় — তখন কাপড় ধোয়ার সময় কোথায়?
          </p>
          <p className="mb-4">
            এটা বিলাসিতা না, বাস্তবতা। বিশেষ করে ঢাকায় দুজন কাজ করেন এমন পরিবারে।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">বাংলাদেশের জন্য যে সমাধানটা সবচেয়ে বেশি কাজ করে</h2>
          <p className="mb-4">
            মিশ্র পদ্ধতি: বাসায় দিনে কাপড়, রাতে ও বাইরে ডিসপোজেবল।
          </p>
          <p className="mb-4">
            হিসাবটা সহজ। ৬ মাস বয়সী বাচ্চায় দিনে ৮টা ডায়াপার লাগে। তার মধ্যে ৫টা দিনে কাপড়, ৩টা
            (রাত + বাইরে একটা) ডিসপোজেবল। মাসে ৯০টা ডিসপোজেবল লাগবে। Bashundhara L (৳৫৮০/৬০ পিস)
            হিসেবে দেড় প্যাক। খরচ ৳৮৭০। দেশি ব্র্যান্ডের সবচেয়ে কম দামে গেলে আরও কম।
          </p>

          {/* Live price table */}
          {top.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">আজকের সবচেয়ে কম প্রতি পিস দামের ডায়াপার</h2>
              <p className="mb-3 text-sm text-slate-500">
                মিশ্র পদ্ধতিতে মাসে ৯০-১২০টা কিনতে হলে প্রতি পিস দামটাই আসল। প্রতিদিন আপডেট।
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

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">পরিবেশের প্রশ্নটা</h2>
          <p className="mb-4">
            কাপড়ের ন্যাপি পরিবেশবান্ধব — এটা আংশিক সত্য। ডিসপোজেবল ডায়াপার পচতে ৫০০ বছর লাগে।
            কিন্তু কাপড় ধুতে পানি লাগে, সাবান লাগে, গরম পানি হলে শক্তি লাগে। বাংলাদেশের প্রেক্ষাপটে
            হাতে ঠান্ডা পানিতে ধোয়া হয়, তাই কার্বন ফুটপ্রিন্ট কম। কিন্তু ঢাকার পানির সমস্যা মাথায় রাখলে
            হিসাবটা পুরোপুরি পরিষ্কার না।
          </p>
          <p className="mb-4">
            পরিবেশের জন্য কাপড় ভালো — তবে সেটা ধোয়ার পদ্ধতি আর পানির উৎসের ওপর নির্ভর করে।
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
              <a href="/guide/diaper-count-per-day" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                প্রতিদিন কতটা ডায়াপার লাগে
              </a>
              <a href="/guide/diaper-rash-prevention" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                র‍্যাশ প্রতিরোধ গাইড
              </a>
              <a href="/guide/night-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                রাতের ডায়াপার গাইড
              </a>
              <a href="/guide/belt-vs-pant-diaper" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                বেল্ট বনাম প্যান্ট গাইড
              </a>
              <a href="/guide/best-diaper-brands-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সেরা ডায়াপার ব্র্যান্ড
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
