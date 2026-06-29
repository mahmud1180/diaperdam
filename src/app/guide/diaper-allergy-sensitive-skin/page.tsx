import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ডায়াপার অ্যালার্জি বা র‍্যাশ? সেনসিটিভ স্কিনের বাচ্চার জন্য সঠিক ডায়াপার ২০২৬",
  description:
    "র‍্যাশ গোলাপি হলে সাধারণ, লাল-ফোস্কা হলে অ্যালার্জি। সেনসিটিভ স্কিনের বাচ্চায় কোন ডায়াপার চলে, কোনটা চলে না — বাংলাদেশের দোকানে পাওয়া ব্র্যান্ড ধরে তুলনা।",
  alternates: { canonical: "https://diaperdam.com/guide/diaper-allergy-sensitive-skin" },
};

const FAQS = [
  {
    q: "ডায়াপার র‍্যাশ আর ডায়াপার অ্যালার্জি কীভাবে আলাদা করব?",
    a: "র‍্যাশ সাধারণত হালকা গোলাপি, ডায়াপার বদলালে আর ক্রিম দিলে ১-২ দিনে কমে। অ্যালার্জি বা কন্ট্যাক্ট ডার্মাটাইটিস হলে চামড়া চকচকে লাল হয়, ফোস্কা পড়তে পারে, কিনারা স্পষ্ট — ঠিক যেখানে ডায়াপারের ইলাস্টিক বা ওয়েস্টব্যান্ড লাগে সেখানে বেশি। ক্রিমে কমে না, ডায়াপার বদলালেই কমে।",
  },
  {
    q: "Pampers Sensitive কি বাংলাদেশে পাওয়া যায়?",
    a: "হ্যাঁ, Chaldal ও Daraz-এ পাওয়া যায় তবে সব সাইজ সবসময় থাকে না। দাম সাধারণ Pampers থেকে ১৫-২৫% বেশি। অ্যালার্জির ইতিহাস না থাকলে সাধারণ Pampers Premium Care-ই যথেষ্ট — ওটাও ফ্র্যাগ্রেন্স-ফ্রি।",
  },
  {
    q: "সেনসিটিভ স্কিনের বাচ্চায় কি দেশি ব্র্যান্ড ব্যবহার করা যাবে?",
    a: "সবার জন্য না। Bashundhara ও Neocare-এ সুগন্ধি থাকতে পারে এবং SAP-এর মান আলাদা। চেষ্টা করে দেখুন — একটা প্যাক ৩ দিন ব্যবহার করুন, র‍্যাশ না হলে চালিয়ে যান। অ্যালার্জি থাকলে এড়িয়ে চলুন।",
  },
  {
    q: "হাইপোঅ্যালার্জেনিক ডায়াপার মানে কি?",
    a: "সাধারণত মানে: কৃত্রিম সুগন্ধি নেই, ল্যাটেক্স নেই, ক্লোরিন ব্লিচিং নেই। এটা ব্র্যান্ডের দাবি, রেগুলেটরি সার্টিফিকেশন না। Pampers Sensitive ও Huggies Pure এই দাবি করে — তবে সব বাচ্চায় সব দাবি কাজ করে না।",
  },
  {
    q: "ডায়াপার অ্যালার্জি হলে কি চামড়ার ডাক্তার দেখাতে হবে?",
    a: "৪৮ ঘণ্টায় না কমলে বা জ্বর এলে হ্যাঁ। মাঝারি র‍্যাশে ব্র্যান্ড বদলান, খালি রাখুন, জিঙ্ক অক্সাইড ক্রিম (Sudocrem বা Drapolene) লাগান। Candidal র‍্যাশ (লাল বিন্দু সহ) হলে ডাক্তার দেখান — সেটা অ্যান্টিফাঙ্গাল ছাড়া সারে না।",
  },
];

export default async function DiaperAllergySensitiveSkinPage() {
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
      { "@type": "ListItem", position: 3, name: "সেনসিটিভ স্কিন গাইড", item: "https://diaperdam.com/guide/diaper-allergy-sensitive-skin" },
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
    headline: "ডায়াপার অ্যালার্জি ও সেনসিটিভ স্কিনের বাচ্চার জন্য সঠিক ডায়াপার বাছাই",
    inLanguage: "bn",
    datePublished: "2026-06-29",
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/diaper-allergy-sensitive-skin",
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
              {" / "}সেনসিটিভ স্কিন
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              ডায়াপার অ্যালার্জি ও সেনসিটিভ স্কিন
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              অ্যালার্জি না র‍্যাশ — চেনার উপায়, এবং বাংলাদেশে পাওয়া কোন ব্র্যান্ড সেনসিটিভ চামড়ায় কাজ করে।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">

          <p className="mb-4">
            বাচ্চার নিচে র‍্যাশ হলে প্রথম সন্দেহ যায় ডায়াপারে। কখনো সেটা ঠিক, কখনো না। পার্থক্যটা
            বোঝা দরকার — কারণ ভুল সমাধান দিলে র‍্যাশ বাড়ে, কমে না।
          </p>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 text-sm">
            <p>
              <strong>সংক্ষেপে:</strong> হালকা গোলাপি র‍্যাশ = সাধারণ ডায়াপার র‍্যাশ, ক্রিম + বেশি খালি রাখলেই কমে।
              ইলাস্টিকের রেখা বরাবর লাল বা ফোস্কা = কন্ট্যাক্ট অ্যালার্জি, ডায়াপার ব্র্যান্ড বদলান।
              {cheapest && (
                <>
                  {" "}আজ সবচেয়ে কম প্রতি পিস{" "}
                  <strong>৳{Number(cheapest.price_per_piece).toFixed(2)}/পিস</strong>{" "}
                  ({cheapest.brand}{cheapest.size_label ? `, ${cheapest.size_label}` : ""}, {cheapest.store_name})।
                </>
              )}
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">র‍্যাশ আর অ্যালার্জি — দুটো আলাদা জিনিস</h2>
          <p className="mb-4">
            ডায়াপার র‍্যাশ মূলত হয় ভেজা থেকে — প্রস্রাব ও মলের সংযোগে অ্যামোনিয়া তৈরি হয়, চামড়া লাল হয়।
            এটা ডিসপোজেবল ও কাপড় দুই ডায়াপারেই হয়। সমাধান সহজ: ঘনঘন বদলানো, শুকনো রাখা, জিঙ্ক
            অক্সাইড ক্রিম।
          </p>
          <p className="mb-4">
            ডায়াপার অ্যালার্জি — বা কন্ট্যাক্ট ডার্মাটাইটিস — আলাদা। চামড়া ডায়াপারের কোনো উপাদানে
            রিঅ্যাক্ট করে। চিনবেন কীভাবে?
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">লক্ষণ</th>
                  <th className="py-2 px-3 border border-slate-200">সাধারণ র‍্যাশ</th>
                  <th className="py-2 px-3 border border-slate-200">ডায়াপার অ্যালার্জি</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr>
                  <td className="py-2 px-3 border border-slate-200">রঙ</td>
                  <td className="py-2 px-3 border border-slate-200">হালকা গোলাপি</td>
                  <td className="py-2 px-3 border border-slate-200">গাঢ় লাল, চকচকে</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-3 border border-slate-200">এলাকা</td>
                  <td className="py-2 px-3 border border-slate-200">পুরো নিতম্ব এলাকা</td>
                  <td className="py-2 px-3 border border-slate-200">ইলাস্টিক/ওয়েস্টব্যান্ডের রেখা</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-slate-200">ফোস্কা</td>
                  <td className="py-2 px-3 border border-slate-200">সাধারণত না</td>
                  <td className="py-2 px-3 border border-slate-200">থাকতে পারে</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-3 border border-slate-200">ক্রিমে কি কমে?</td>
                  <td className="py-2 px-3 border border-slate-200">হ্যাঁ, ১-২ দিনে</td>
                  <td className="py-2 px-3 border border-slate-200">না, ব্র্যান্ড বদলাতে হয়</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-slate-200">প্যাটার্ন</td>
                  <td className="py-2 px-3 border border-slate-200">যেকোনো ডায়াপারে হয়</td>
                  <td className="py-2 px-3 border border-slate-200">নির্দিষ্ট ব্র্যান্ডে বারবার</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">ডায়াপারে কোন উপাদান অ্যালার্জি করে?</h2>
          <p className="mb-3">তিনটা প্রধান কারণ:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li>
              <strong>কৃত্রিম সুগন্ধি (Fragrance):</strong> অনেক ব্র্যান্ড বেবি-স্মেল দেওয়ার জন্য সুগন্ধি মেশায়।
              সেনসিটিভ চামড়ায় এটাই সবচেয়ে বড় ট্রিগার।
            </li>
            <li>
              <strong>ল্যাটেক্স ইলাস্টিক:</strong> বাংলাদেশে বিক্রি হওয়া বেশিরভাগ আন্তর্জাতিক ব্র্যান্ড
              ল্যাটেক্স-ফ্রি। দেশি ব্র্যান্ডে এটা নিশ্চিত করা কঠিন।
            </li>
            <li>
              <strong>ক্লোরিন ব্লিচিং:</strong> সস্তা ডায়াপারে পাল্প সাদা করতে ক্লোরিন ব্যবহার হয়।
              অবশিষ্ট রাসায়নিক চামড়ায় জ্বালা করতে পারে।
            </li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">বাংলাদেশে পাওয়া ব্র্যান্ড: সেনসিটিভ স্কিনে কোনটা ভালো?</h2>
          <p className="mb-4">
            সব তথ্য ব্র্যান্ডের নিজের দাবি থেকে — স্বাধীন ল্যাব পরীক্ষা না। ব্যক্তিভেদে ফলাফল আলাদা হতে পারে।
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">ব্র্যান্ড</th>
                  <th className="py-2 px-3 border border-slate-200">ফ্র্যাগ্রেন্স-ফ্রি?</th>
                  <th className="py-2 px-3 border border-slate-200">ল্যাটেক্স-ফ্রি?</th>
                  <th className="py-2 px-3 border border-slate-200">সেনসিটিভ লাইন?</th>
                  <th className="py-2 px-3 border border-slate-200">প্রায় দাম/পিস</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr>
                  <td className="py-2 px-3 border border-slate-200 font-medium">Pampers Sensitive</td>
                  <td className="py-2 px-3 border border-slate-200 text-emerald-700">হ্যাঁ</td>
                  <td className="py-2 px-3 border border-slate-200 text-emerald-700">হ্যাঁ</td>
                  <td className="py-2 px-3 border border-slate-200 text-emerald-700">হ্যাঁ</td>
                  <td className="py-2 px-3 border border-slate-200">৳২০-২৮/পিস</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-3 border border-slate-200 font-medium">Pampers Premium Care</td>
                  <td className="py-2 px-3 border border-slate-200 text-emerald-700">হ্যাঁ</td>
                  <td className="py-2 px-3 border border-slate-200 text-emerald-700">হ্যাঁ</td>
                  <td className="py-2 px-3 border border-slate-200 text-slate-400">না (তবে কম উপাদান)</td>
                  <td className="py-2 px-3 border border-slate-200">৳১৬-২২/পিস</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-slate-200 font-medium">Huggies Platinum</td>
                  <td className="py-2 px-3 border border-slate-200 text-emerald-700">হ্যাঁ</td>
                  <td className="py-2 px-3 border border-slate-200 text-emerald-700">হ্যাঁ</td>
                  <td className="py-2 px-3 border border-slate-200 text-slate-400">না</td>
                  <td className="py-2 px-3 border border-slate-200">৳১৮-২৫/পিস</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-3 border border-slate-200 font-medium">Molfix</td>
                  <td className="py-2 px-3 border border-slate-200 text-amber-600">আংশিক (কিছু লাইন)</td>
                  <td className="py-2 px-3 border border-slate-200 text-emerald-700">হ্যাঁ</td>
                  <td className="py-2 px-3 border border-slate-200 text-slate-400">না</td>
                  <td className="py-2 px-3 border border-slate-200">৳১২-১৮/পিস</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-slate-200 font-medium">Bashundhara</td>
                  <td className="py-2 px-3 border border-slate-200 text-red-500">না (সুগন্ধি আছে)</td>
                  <td className="py-2 px-3 border border-slate-200 text-slate-400">অজানা</td>
                  <td className="py-2 px-3 border border-slate-200 text-slate-400">না</td>
                  <td className="py-2 px-3 border border-slate-200">৳৮-১২/পিস</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="py-2 px-3 border border-slate-200 font-medium">Neocare</td>
                  <td className="py-2 px-3 border border-slate-200 text-red-500">না</td>
                  <td className="py-2 px-3 border border-slate-200 text-slate-400">অজানা</td>
                  <td className="py-2 px-3 border border-slate-200 text-slate-400">না</td>
                  <td className="py-2 px-3 border border-slate-200">৳৭-১১/পিস</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mb-4 text-sm text-slate-500">
            দাম প্রতিদিন বদলায় — নিচের লাইভ টেবিলে আজকের আসল দাম দেখুন।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">ব্র্যান্ড বদলানোর আগে একটু পরীক্ষা করুন</h2>
          <p className="mb-4">
            নতুন ব্র্যান্ড কেনার আগে ছোট প্যাক কিনুন — ৩০-৪০ পিসের। ৩ দিন ব্যবহার করুন। যদি র‍্যাশ না হয়,
            বড় প্যাকে যান। প্রতি পিস হিসেবে বড় প্যাক ১৫-২৫% সস্তা, কিন্তু নতুন ব্র্যান্ডে ৩০০ পিসের প্যাক
            কিনে পরে দেখলেন চলছে না — সেটা বেশি ক্ষতি।
          </p>
          <p className="mb-4">
            পরীক্ষার সময় অন্য কিছু বদলাবেন না — খাওয়া, ওয়াইপস, ক্রিম একই রাখুন। নাহলে র‍্যাশের কারণ
            ধরা কঠিন হয়ে যায়।
          </p>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সেনসিটিভ স্কিনে রুটিন কেমন হবে?</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li>
              <strong>বদলানোর ফ্রিকোয়েন্সি:</strong> ৩ ঘণ্টার বেশি না। ভেজা থাকলে আরও আগে।
              সেনসিটিভ চামড়া বেশিক্ষণ ভেজায় আরও দ্রুত রিঅ্যাক্ট করে।
            </li>
            <li>
              <strong>ওয়াইপস:</strong> অ্যালকোহল-ফ্রি, ফ্র্যাগ্রেন্স-ফ্রি। বা গরম পানি আর নরম কাপড়।
              Pampers Sensitive বা Huggies Pure Wipes চলে।
            </li>
            <li>
              <strong>ক্রিম:</strong> প্রতিটা বদলানোতে পাতলা জিঙ্ক অক্সাইড লেয়ার — Sudocrem বা
              Drapolene। ব্যারিয়ার তৈরি করে, ভেজা চামড়া থেকে আলাদা রাখে।
            </li>
            <li>
              <strong>খালি রাখা:</strong> দিনে ১৫-২০ মিনিট ডায়াপার ছাড়া রাখুন। বাতাস চামড়া শুকায়।
            </li>
            <li>
              <strong>সুগন্ধি এড়ান:</strong> ডায়াপারের পাশাপাশি বেবি পাউডার, পারফিউম ওয়াইপস,
              সুগন্ধি ক্রিম — সব এড়িয়ে চলুন যদি অ্যালার্জির সন্দেহ থাকে।
            </li>
          </ul>

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">দাম বনাম সেনসিটিভ ফিচার: আপোষ কোথায়?</h2>
          <p className="mb-4">
            Pampers Sensitive সেরা — কিন্তু দাম ৳২০-২৮/পিস। মাসে ২০০টা কিনলে ৳৪,০০০-৫,৬০০। Bashundhara
            মাসে ৳১,৬০০-২,৪০০। পার্থক্য মাসে ৳২,৪০০-৩,২০০।
          </p>
          <p className="mb-4">
            সেনসিটিভ বাচ্চার জন্য এই পার্থক্য ন্যায্য। কিন্তু অ্যালার্জি প্রমাণিত না হলে Pampers Premium Care
            বা Molfix দিয়ে শুরু করুন — দাম মাঝামাঝি, ফ্র্যাগ্রেন্স কম।
          </p>

          {/* Live price table */}
          {top.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">আজকের সবচেয়ে কম প্রতি পিস দামের ডায়াপার</h2>
              <p className="mb-3 text-sm text-slate-500">
                সেনসিটিভ স্কিনে ব্র্যান্ড বদলানোর খরচ আছে — প্রতি পিস দামটা আগে দেখুন। প্রতিদিন আপডেট।
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

          {/* Cross-links */}
          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/guide/diaper-rash-prevention" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                র‍্যাশ প্রতিরোধ গাইড
              </a>
              <a href="/guide/diaper-rash-treatment" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                র‍্যাশ সারানোর উপায়
              </a>
              <a href="/guide/best-diaper-brands-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সেরা ডায়াপার ব্র্যান্ড
              </a>
              <a href="/guide/diaper-count-per-day" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                প্রতিদিন কতটা লাগে
              </a>
              <a href="/guide/cloth-vs-disposable-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                কাপড় না ডিসপোজেবল
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
