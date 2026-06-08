import type { Metadata } from "next";
import { getActiveDeals, getAllProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";
import type { DiaperProduct } from "@/lib/db";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "আজকের ডায়াপার অফার ও ছাড় বাংলাদেশ — সব দোকান",
  description: "বাংলাদেশে আজকের সেরা বেবি ডায়াপার অফার ও ছাড়। Huggies, MamyPoko, Molfix ও Pampers-এ চালডাল, দারাজ, স্বপ্ন সহ সব দোকানের ডিসকাউন্ট। প্রতিদিন আপডেট।",
  alternates: { canonical: "https://diaperdam.com/deals" },
  keywords: ["ডায়াপার অফার বাংলাদেশ", "বেবি ডায়াপার ছাড়", "ডায়াপার ডিসকাউন্ট বাংলাদেশ", "হাগিস অফার", "ম্যামিপোকো অফার", "সস্তা ডায়াপার বাংলাদেশ", "diaper deals bangladesh", "diaper offer bd"],
};

async function getCheapestPerPiece(): Promise<DiaperProduct[]> {
  const all = await getAllProducts({ sort: "price_per_piece" }).catch(() => [] as DiaperProduct[]);
  return all.slice(0, 40);
}

const dealsPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "আজকের ডায়াপার অফার ও ছাড় বাংলাদেশ",
  "description": "বাংলাদেশে সব বড় অনলাইন দোকানের সেরা বেবি ডায়াপার অফার। প্রতিদিন আপডেট।",
  "url": "https://diaperdam.com/deals",
  "breadcrumb": {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "হোম", "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "ডায়াপার অফার", "item": "https://diaperdam.com/deals" },
    ],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "বাংলাদেশে সবচেয়ে সস্তা বেবি ডায়াপার কোথায় পাবো?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "DiaperDam প্রতিদিন চালডাল, দারাজ, স্বপ্ন, মীনা বাজার ও GoBaby থেকে ডায়াপারের দাম তুলনা করে। সবচেয়ে সস্তা প্রতি পিস দাম প্রতিদিন বদলায় — ডিলস পেজে আজকের সেরা অফার দেখুন।",
      },
    },
    {
      "@type": "Question",
      "name": "চালডাল ও দারাজে কি ডায়াপার ডিসকাউন্ট থাকে?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "হ্যাঁ, চালডাল ও দারাজে নিয়মিত Huggies, MamyPoko, Molfix ও Pampers-এ ডিসকাউন্ট চলে। DiaperDam প্রতিদিন এই অফার ট্র্যাক করে এবং আসল দাম বনাম ছাড়ের দাম প্রতি পিসে দেখায়।",
      },
    },
    {
      "@type": "Question",
      "name": "বাংলাদেশে প্রতি পিস সবচেয়ে সস্তা ডায়াপার কোনটা?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "দেশি ব্র্যান্ড Neocare, Avonee আর Bashundhara সাধারণত প্রতি পিসে সবচেয়ে সস্তা। আন্তর্জাতিক ব্র্যান্ডের মধ্যে Molfix-এ প্রায়ই সবচেয়ে কম দাম থাকে। বড় প্যাক (৫০+ পিস) কিনলে প্রতি পিস দাম আরও কমে।",
      },
    },
    {
      "@type": "Question",
      "name": "বাংলাদেশে ডায়াপারের দাম কখন কমে?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ঈদ, জাতীয় ছুটির দিন আর দোকানের বিশেষ সেলে ডায়াপারের দাম কমে। বড় প্যাক ও কম্বো ডিলে সবচেয়ে ভালো দাম পাওয়া যায়। DiaperDam প্রতিদিন দাম পরিবর্তন ট্র্যাক করে।",
      },
    },
  ],
};

export default async function DealsPage() {
  const [deals, cheapest] = await Promise.all([
    getActiveDeals().catch(() => [] as DiaperProduct[]),
    getCheapestPerPiece(),
  ]);

  const hasDeals = deals.length > 0;
  const displayProducts = hasDeals ? deals : cheapest;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dealsPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-400 mb-2">
            <a href="/" className="hover:text-emerald-600">হোম</a>
            {" / "}
            <span>ডায়াপার অফার</span>
          </nav>
          <div className="flex items-start gap-3">
            <span className="text-3xl" aria-hidden>🏷️</span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                আজকের ডায়াপার অফার ও ছাড় বাংলাদেশ
              </h1>
              <p className="text-slate-500 text-sm mt-1 max-w-2xl">
                {hasDeals
                  ? `${deals.length} টি ডায়াপার অফার চালডাল, দারাজ, স্বপ্ন সহ আরও দোকানে - বেশি ছাড় অনুযায়ী সাজানো। প্রতিদিন আপডেট।`
                  : `আজকের সবচেয়ে সস্তা প্রতি পিস ডায়াপার সব দোকান থেকে। প্রতিদিন আপডেট।`}
              </p>
            </div>
          </div>

          {/* Store filter links */}
          <div className="flex flex-wrap gap-2 mt-4 text-xs">
            {["chaldal","daraz","shwapno","meenabazar","gobaby"].map(store => {
              const names: Record<string, string> = { chaldal: "চালডাল", daraz: "দারাজ", shwapno: "স্বপ্ন", meenabazar: "মীনা বাজার", gobaby: "GoBaby" };
              return (
                <a
                  key={store}
                  href={`/store/${store}`}
                  className="bg-white border border-slate-200 rounded-full px-3 py-1 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                >
                  {names[store] ?? store}
                </a>
              );
            })}
            <a href="/price-index" className="bg-emerald-600 text-white rounded-full px-3 py-1 hover:bg-emerald-700 transition-colors">
              মূল্য সূচক →
            </a>
          </div>
        </div>
      </div>

      {/* Products */}
      {displayProducts.length > 0 ? (
        <DiapersClient products={displayProducts} />
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
          <p className="text-4xl mb-3">🔄</p>
          <p>অফারের ডেটা লোড হচ্ছে - স্ক্র্যাপার প্রতিদিন সকাল ৮টায় চলে। শীঘ্রই দেখুন।</p>
        </div>
      )}

      {/* SEO + FAQ */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Quick brand links */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
          <h2 className="font-bold text-slate-900 mb-3">ব্র্যান্ড অনুযায়ী ডায়াপার অফার</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { slug: "huggies", name: "Huggies অফার" },
              { slug: "mamypoko", name: "MamyPoko অফার" },
              { slug: "molfix", name: "Molfix অফার" },
              { slug: "pampers", name: "Pampers অফার" },
              { slug: "neocare", name: "Neocare অফার" },
              { slug: "avonee", name: "Avonee অফার" },
              { slug: "bashundhara", name: "Bashundhara অফার" },
              { slug: "supermom", name: "Supermom অফার" },
            ].map(b => (
              <a
                key={b.slug}
                href={`/brand/${b.slug}`}
                className="text-sm text-emerald-700 hover:underline bg-emerald-50 rounded-lg px-3 py-2 text-center"
              >
                {b.name}
              </a>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
          <h2 className="font-bold text-slate-900 mb-4">ডায়াপার অফার বাংলাদেশ — প্রশ্নোত্তর</h2>
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-sm text-slate-800">বাংলাদেশে সবচেয়ে সস্তা বেবি ডায়াপার কোথায় পাবো?</h3>
              <p className="text-sm text-slate-600 mt-1">
                DiaperDam প্রতিদিন চালডাল, দারাজ, স্বপ্ন, মীনা বাজার ও GoBaby থেকে দাম তুলনা করে।
                সবচেয়ে সস্তা প্রতি পিস দাম প্রায়ই বদলায় -{" "}
                <a href="/price-index" className="text-emerald-600 hover:underline">মূল্য সূচকে</a> ব্র্যান্ড-ভিত্তিক তুলনা দেখুন।
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">চালডাল ও দারাজে কি ডায়াপার ডিসকাউন্ট থাকে?</h3>
              <p className="text-sm text-slate-600 mt-1">
                হ্যাঁ। চালডাল ও দারাজে নিয়মিত Huggies, MamyPoko, Molfix ও Pampers-এ প্রমোশন চলে।
                DiaperDam প্রতিদিন এগুলো ট্র্যাক করে এবং আসল দাম বনাম ছাড়ের দাম প্রতি পিসে দেখায়।
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">বাংলাদেশে প্রতি পিস সবচেয়ে সস্তা ডায়াপার কোনটা?</h3>
              <p className="text-sm text-slate-600 mt-1">
                দেশি ব্র্যান্ড Neocare, Avonee আর Bashundhara সাধারণত প্রতি পিসে সবচেয়ে সস্তা।
                আন্তর্জাতিক ব্র্যান্ডের মধ্যে Molfix-এ প্রায়ই সবচেয়ে কম দাম। ৫০+ পিসের বড় প্যাক কিনলে প্রতি পিস দাম আরও কমে।
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-800">বাংলাদেশে ডায়াপারের দাম কখন কমে?</h3>
              <p className="text-sm text-slate-600 mt-1">
                ঈদ, জাতীয় ছুটি আর দোকানের বিশেষ সেলে দাম কমে।
                বড় প্যাক ও কম্বো ডিলে সবচেয়ে ভালো দাম পাওয়া যায়। DiaperDam প্রতিদিন দাম পরিবর্তন ট্র্যাক করে যাতে কোনো ছাড় মিস না হয়।
              </p>
            </div>
          </div>
        </div>

        {/* Cross-links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <a href="/price-index" className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-emerald-200 transition-colors">
            <div className="font-semibold text-slate-800 text-sm">📊 মূল্য সূচক</div>
            <div className="text-xs text-slate-500 mt-1">সব দোকানের দাম পাশাপাশি তুলনা করুন</div>
          </a>
          <a href="/size/m" className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-emerald-200 transition-colors">
            <div className="font-semibold text-slate-800 text-sm">📦 সাইজ M ডায়াপার</div>
            <div className="text-xs text-slate-500 mt-1">সবচেয়ে বেশি বিক্রি হওয়া সাইজ - সব M দাম তুলনা</div>
          </a>
          <a href="/diapers" className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-emerald-200 transition-colors">
            <div className="font-semibold text-slate-800 text-sm">🔍 সব ডায়াপার</div>
            <div className="text-xs text-slate-500 mt-1">বাংলাদেশে ট্র্যাক করা সব ডায়াপার ব্রাউজ করুন</div>
          </a>
        </div>
      </div>
    </>
  );
}
