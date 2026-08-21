import type { Metadata } from "next";
import { getBrandProducts } from "@/lib/db";
import type { DiaperProduct } from "@/lib/db";
import { BRAND_SLUGS } from "@/lib/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "কোন ব্র্যান্ডের ডায়াপার কোন সাইজে পাওয়া যায় না",
  description:
    "নবজাতক থেকে XXL পর্যন্ত প্রতিটা ব্র্যান্ড কোন কোন সাইজে আসলে স্টকে আছে, আর কোন সাইজে গিয়ে অপশন কমে যায়, ৬টা অনলাইন দোকানের আজকের ডেটা থেকে।",
  alternates: { canonical: "https://diaperdam.com/guide/brand-size-availability-bangladesh" },
};

const BRAND_NAME_BN: Record<string, string> = {
  pampers: "প্যাম্পারস",
  huggies: "হাগিস",
  mamypoko: "ম্যামিপোকো",
  molfix: "মলফিক্স",
  bashundhara: "বসুন্ধরা",
  neocare: "নিওকেয়ার",
  supermom: "সুপারমম",
  savlon: "স্যাভলন",
  avonee: "অ্যাভোনি",
  aiwibi: "আইউইবি",
  "happy-nappy": "হ্যাপি ন্যাপি",
};

const SIZES = ["Newborn", "S", "M", "L", "XL", "XXL"] as const;
type Size = (typeof SIZES)[number];

const SIZE_LABEL_BN: Record<Size, string> = {
  Newborn: "নবজাতক",
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  XXL: "XXL",
};

const SIZE_SLUG: Record<Size, string> = {
  Newborn: "newborn",
  S: "s",
  M: "m",
  L: "l",
  XL: "xl",
  XXL: "xxl",
};

// A mis-parsed pack_qty (a 48-pack read as 2) produces a per-piece price no real
// diaper has. Bounding the range keeps one bad listing from making a size look
// like it has stock at an absurd price, or from moving a size average.
const MIN_PLAUSIBLE_PRICE_PER_PIECE = 5;
const MAX_PLAUSIBLE_PRICE_PER_PIECE = 150;

const FAQS = [
  {
    q: "কোনো সাইজে ক্রস চিহ্ন মানে কি ব্র্যান্ডটা ঐ সাইজ বানায় না?",
    a: "না। ক্রস চিহ্নের মানে শুধু এটুকু যে আমরা যে ৬টা অনলাইন দোকানের দাম ট্র্যাক করি, আজ তার কোনোটাতেই ঐ ব্র্যান্ডের ঐ সাইজ স্টকে পাওয়া যায়নি। কোম্পানি সাইজটা বানায় কি না, বা পাড়ার দোকানে আছে কি না, সেটা এই ডেটা থেকে বলা যায় না।",
  },
  {
    q: "নবজাতক সাইজে অপশন কম কেন?",
    a: "নবজাতকের ডায়াপার সবচেয়ে কম সময় লাগে, বেশিরভাগ বাচ্চা এক-দেড় মাসেই S সাইজে চলে যায়। বিক্রি কম বলে অনলাইন দোকানগুলো এই সাইজে কম ব্র্যান্ড আর ছোট প্যাক রাখে, আর সস্তা লোকাল ব্র্যান্ডগুলোর অনেকেই এই সাইজ দিয়ে লাইন শুরু করে না।",
  },
  {
    q: "বড় সাইজে দাম এত বাড়ে কেন?",
    a: "একটা XXL ডায়াপারে শোষক উপাদান আর কাপড় দুটোই বেশি লাগে, তাই পিসপ্রতি খরচ এমনিতেই বেশি। এর সাথে যোগ হয় কম প্রতিযোগিতা, বড় সাইজে ব্র্যান্ড কম থাকায় দাম কমানোর চাপও কম পড়ে।",
  },
  {
    q: "বাচ্চার সাইজ বদলালে ব্র্যান্ডও বদলাতে হবে?",
    a: "যে ব্র্যান্ড নবজাতক থেকে XXL পর্যন্ত সব সাইজে পাওয়া যায়, সেটায় থাকলে বদলাতে হয় না। কিন্তু যে ব্র্যান্ড একটা নির্দিষ্ট সাইজে গিয়ে থেমে যায়, সেখানে হয় ব্র্যান্ড বদলাতে হবে, নয়তো অফলাইন দোকানে খুঁজতে হবে। বড় প্যাক কেনার আগে পরের সাইজটা আছে কি না দেখে নেওয়া ভালো।",
  },
  {
    q: "এই তালিকা কতদিন পরপর আপডেট হয়?",
    a: "দাম আর স্টক প্রতিদিন আপডেট হয়, আর এই পাতার প্রতিটা সংখ্যা লোড হওয়ার সময় ডাটাবেজ থেকে হিসাব হয়। তাই আজ যে সাইজে ক্রস দেখছেন, স্টক ফিরলে কাল সেখানে টিক চিহ্ন থাকতে পারে।",
  },
];

type BrandRow = {
  slug: string;
  name: string;
  bySize: Map<Size, { skus: number; stores: number; minPP: number }>;
  missing: Size[];
  totalSkus: number;
};

type SizeRow = {
  size: Size;
  brands: number;
  skus: number;
  avgPP: number;
  minPP: number;
};

function joinBn(list: string[]): string {
  if (list.length <= 1) return list[0] ?? "";
  return `${list.slice(0, -1).join(", ")} আর ${list[list.length - 1]}`;
}

export default async function BrandSizeAvailabilityPage() {
  const perBrand = await Promise.all(
    BRAND_SLUGS.map(b => getBrandProducts(b).catch(() => [] as DiaperProduct[]))
  );

  const brandRows: BrandRow[] = [];
  const sizeAgg = new Map<Size, { skus: number; sum: number; min: number; brands: Set<string> }>();

  BRAND_SLUGS.forEach((slug, i) => {
    const items = perBrand[i].filter(p => {
      const pp = Number(p.price_per_piece);
      return (
        p.size_label != null &&
        SIZES.includes(p.size_label as Size) &&
        pp >= MIN_PLAUSIBLE_PRICE_PER_PIECE &&
        pp <= MAX_PLAUSIBLE_PRICE_PER_PIECE
      );
    });

    const bySize = new Map<Size, { skus: number; stores: number; minPP: number }>();
    const storesBySize = new Map<Size, Set<string>>();

    for (const p of items) {
      const size = p.size_label as Size;
      const pp = Number(p.price_per_piece);

      const cur = bySize.get(size);
      if (cur) {
        cur.skus++;
        cur.minPP = Math.min(cur.minPP, pp);
      } else {
        bySize.set(size, { skus: 1, stores: 0, minPP: pp });
      }

      const seen = storesBySize.get(size);
      if (seen) seen.add(p.store_slug);
      else storesBySize.set(size, new Set([p.store_slug]));

      const agg = sizeAgg.get(size);
      if (agg) {
        agg.skus++;
        agg.sum += pp;
        agg.min = Math.min(agg.min, pp);
        agg.brands.add(slug);
      } else {
        sizeAgg.set(size, { skus: 1, sum: pp, min: pp, brands: new Set([slug]) });
      }
    }

    for (const [size, cell] of bySize.entries()) {
      cell.stores = storesBySize.get(size)?.size ?? 0;
    }

    if (bySize.size === 0) return;

    brandRows.push({
      slug,
      name: BRAND_NAME_BN[slug] ?? slug,
      bySize,
      missing: SIZES.filter(s => !bySize.has(s)),
      totalSkus: items.length,
    });
  });

  brandRows.sort((a, b) => a.missing.length - b.missing.length || b.totalSkus - a.totalSkus);

  const sizeRows: SizeRow[] = SIZES.map(size => {
    const agg = sizeAgg.get(size);
    return {
      size,
      brands: agg ? agg.brands.size : 0,
      skus: agg ? agg.skus : 0,
      avgPP: agg && agg.skus > 0 ? agg.sum / agg.skus : 0,
      minPP: agg ? agg.min : 0,
    };
  }).filter(r => r.skus > 0);

  const fullCoverage = brandRows.filter(b => b.missing.length === 0);
  const withGaps = brandRows.filter(b => b.missing.length > 0);
  const newbornGap = brandRows.filter(b => b.missing.includes("Newborn"));
  const xxlGap = brandRows.filter(b => b.missing.includes("XXL"));

  const thinnest = sizeRows.length
    ? sizeRows.reduce((a, b) => (a.brands <= b.brands ? a : b))
    : null;
  const widest = sizeRows.length
    ? sizeRows.reduce((a, b) => (a.brands >= b.brands ? a : b))
    : null;

  const sSize = sizeRows.find(r => r.size === "S");
  const xxlSize = sizeRows.find(r => r.size === "XXL");
  const priceMultiple =
    sSize && xxlSize && sSize.avgPP > 0 ? xxlSize.avgPP / sSize.avgPP : null;

  const trackedStores = new Set(
    perBrand.flat().map(p => p.store_slug)
  ).size;

  const today = new Date().toISOString().slice(0, 10);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: "https://diaperdam.com" },
      { "@type": "ListItem", position: 2, name: "ডায়াপার", item: "https://diaperdam.com/diapers" },
      {
        "@type": "ListItem",
        position: 3,
        name: "ব্র্যান্ড অনুযায়ী সাইজ কভারেজ",
        item: "https://diaperdam.com/guide/brand-size-availability-bangladesh",
      },
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
    headline: "কোন ব্র্যান্ডের ডায়াপার কোন সাইজে পাওয়া যায় না",
    inLanguage: "bn",
    datePublished: today,
    dateModified: today,
    author: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    publisher: { "@type": "Organization", name: "DiaperDam", url: "https://diaperdam.com" },
    mainEntityOfPage: "https://diaperdam.com/guide/brand-size-availability-bangladesh",
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
              {" / "}ব্র্যান্ড অনুযায়ী সাইজ কভারেজ
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              কোন ব্র্যান্ডের ডায়াপার কোন সাইজে পাওয়া যায় না
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              নবজাতক থেকে XXL, প্রতিটা ব্র্যান্ডের আসল স্টক আজকের ডেটায়।
            </p>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 py-8 text-slate-700 leading-relaxed">
          <p className="mb-4">
            বাচ্চার ওজন বাড়লে ডায়াপারের সাইজ বদলাতে হয়, এটা সবাই জানেন। যেটা কেউ আগে বলে না, সেটা
            হলো সাইজ বদলানোর সাথে সাথে আপনার পছন্দের ব্র্যান্ডটা তাকে না-ও থাকতে পারে।
          </p>

          {thinnest && widest && thinnest.size !== widest.size && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 text-sm">
              <p>
                <strong>সংক্ষেপে:</strong> আমরা যে {BRAND_SLUGS.length}টা ব্র্যান্ড ট্র্যাক করি,
                তার মধ্যে {SIZE_LABEL_BN[widest.size]} সাইজে আজ {widest.brands}টাই পাওয়া যাচ্ছে,
                কিন্তু {SIZE_LABEL_BN[thinnest.size]} সাইজে সেটা নেমে আসে {thinnest.brands}টায়।
                {priceMultiple && priceMultiple > 1 && (
                  <>
                    {" "}আর পিসপ্রতি গড় দাম S থেকে XXL-এ গিয়ে দাঁড়ায় প্রায়{" "}
                    <strong>{priceMultiple.toFixed(1)} গুণ</strong>।
                  </>
                )}
              </p>
            </div>
          )}

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">ব্র্যান্ড অনুযায়ী সাইজ কভারেজ</h2>
          <p className="mb-4">
            টিক চিহ্ন মানে আজ অন্তত একটা দোকানে ঐ ব্র্যান্ডের ঐ সাইজ স্টকে আছে। পাশের ছোট সংখ্যাটা
            বলে দিচ্ছে কয়টা দোকানে পাওয়া যাচ্ছে।
          </p>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="py-2 px-3 border border-slate-200">ব্র্যান্ড</th>
                  {SIZES.map(s => (
                    <th key={s} className="py-2 px-2 border border-slate-200 text-center">
                      {SIZE_LABEL_BN[s]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brandRows.map(b => (
                  <tr key={b.slug}>
                    <td className="py-2 px-3 border border-slate-200 font-medium whitespace-nowrap">
                      <a href={`/brand/${b.slug}`} className="text-emerald-700 hover:underline">
                        {b.name}
                      </a>
                    </td>
                    {SIZES.map(s => {
                      const cell = b.bySize.get(s);
                      return (
                        <td key={s} className="py-2 px-2 border border-slate-200 text-center">
                          {cell ? (
                            <span className="text-emerald-700 font-semibold">
                              ✓<span className="text-slate-400 text-xs font-normal"> {cell.stores}</span>
                            </span>
                          ) : (
                            <span className="text-rose-400">✗</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mb-6 text-xs text-slate-400">
            ক্রস চিহ্ন মানে এই নয় যে ব্র্যান্ডটা ঐ সাইজ বানায় না। মানে হলো আমাদের ট্র্যাক করা{" "}
            {trackedStores}টা অনলাইন দোকানের কোনোটায় আজ সেটা স্টকে নেই।
          </p>

          {fullCoverage.length > 0 && (
            <p className="mb-4">
              নবজাতক থেকে XXL পর্যন্ত আজ কোনো ফাঁক ছাড়া পাওয়া যাচ্ছে{" "}
              <strong>{joinBn(fullCoverage.map(b => b.name))}</strong>। বাচ্চা বড় হওয়ার সাথে সাথে
              ব্র্যান্ড বদলানোর ঝামেলা এড়াতে চাইলে এই তালিকা থেকে বাছাই করাই সহজ।
              {withGaps.length > 0 && (
                <> বাকি {withGaps.length}টা ব্র্যান্ডে কোথাও না কোথাও ফাঁক আছে।</>
              )}
            </p>
          )}

          {newbornGap.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">নবজাতক সাইজের ফাঁক</h2>
              <p className="mb-4">
                {joinBn(newbornGap.map(b => b.name))} আজ নবজাতক সাইজে কোনো দোকানেই নেই, অথচ এদের
                বাকি সাইজগুলো দিব্যি পাওয়া যাচ্ছে। হাসপাতাল থেকে বাসায় ফেরার প্রথম সপ্তাহে যাদের
                বাজেট টাইট, তাদের জন্য এটা বিরক্তিকর ব্যাপার, কারণ সস্তা অপশনগুলোই ঠিক ঐ সময়টায়
                অনুপস্থিত।
              </p>
              {thinnest && thinnest.size === "Newborn" && (
                <p className="mb-4">
                  ফল যা দাঁড়ায়: নবজাতক সাইজে আজ মাত্র {thinnest.brands}টা ব্র্যান্ড আর{" "}
                  {thinnest.skus}টা প্যাক, সবচেয়ে সস্তাটা ৳{thinnest.minPP.toFixed(2)} পিস। পছন্দ
                  কম থাকলে দরদামের সুযোগও কম।
                </p>
              )}
            </>
          )}

          {xxlGap.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">উপরের দিকে দেয়াল</h2>
              <p className="mb-4">
                {joinBn(xxlGap.map(b => b.name))} XXL সাইজে গিয়ে থেমে যায়। বাচ্চার ওজন ১৫ কেজি
                ছাড়ানোর পর যদি এদের কোনোটায় অভ্যস্ত থাকেন, তখন বাধ্য হয়েই ব্র্যান্ড বদলাতে হবে।
                {xxlSize && (
                  <> আর ঠিক সেই সাইজেই পিসপ্রতি গড় দাম সবচেয়ে বেশি, ৳{xxlSize.avgPP.toFixed(2)}।</>
                )}
              </p>
              <p className="mb-4">
                অর্থাৎ উপরের সাইজে দুই দিক থেকেই চাপ পড়ে। ব্র্যান্ড কমে, দাম বাড়ে। দুটো আলাদা
                ঘটনা না, প্রতিযোগিতা কমে গেলে দাম কমানোর চাপও কমে যায়।
              </p>
            </>
          )}

          {sizeRows.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">সাইজ অনুযায়ী পছন্দ আর দাম</h2>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="py-2 px-3 border border-slate-200">সাইজ</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">ব্র্যান্ড</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">প্যাক</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">গড় ৳/পিস</th>
                      <th className="py-2 px-3 border border-slate-200 text-right">সবচেয়ে সস্তা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeRows.map(r => (
                      <tr key={r.size}>
                        <td className="py-2 px-3 border border-slate-200 font-medium">
                          <a href={`/size/${SIZE_SLUG[r.size]}`} className="text-emerald-700 hover:underline">
                            {SIZE_LABEL_BN[r.size]}
                          </a>
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right">{r.brands}</td>
                        <td className="py-2 px-3 border border-slate-200 text-right">{r.skus}</td>
                        <td className="py-2 px-3 border border-slate-200 text-right font-semibold">
                          ৳{r.avgPP.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-right text-emerald-700">
                          ৳{r.minPP.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mb-6 text-sm text-slate-500">
                শুধু আমাদের ক্যাটালগে থাকা {BRAND_SLUGS.length}টা ব্র্যান্ড ধরা হয়েছে। পিসপ্রতি দাম
                ৳{MIN_PLAUSIBLE_PRICE_PER_PIECE} থেকে ৳{MAX_PLAUSIBLE_PRICE_PER_PIECE} টাকার বাইরে
                থাকা লিস্টিং বাদ দেওয়া হয়েছে, ওগুলো প্রায় সবসময়ই প্যাকের সংখ্যা ভুল পড়ার ফল।
              </p>
            </>
          )}

          <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">কেনার আগে যা দেখবেন</h2>
          <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-600">
            <li>
              <strong>পরের সাইজটা আছে কি না দেখে নিন।</strong> তিন মাসের স্টক একসাথে কিনে ফেলার
              আগে উপরের গ্রিডে ঐ ব্র্যান্ডের পরের ঘরটা দেখুন, ক্রস থাকলে বদলানোর প্রস্তুতি রাখুন।
            </li>
            <li>
              <strong>নবজাতকে ছোট প্যাক কিনুন।</strong> এই সাইজ এক-দেড় মাসের বেশি টেকে না, আর
              পিসপ্রতি দামও এখানে বেশি, তাই বড় প্যাকে টাকা আটকে রাখার মানে হয় না।
            </li>
            <li>
              <strong>এক ঘরে একাধিক দোকান মানে দরদামের সুযোগ।</strong> টিক চিহ্নের পাশের সংখ্যা
              যত বড়, ঐ ব্র্যান্ড-সাইজে দোকান বদলে সাশ্রয়ের সম্ভাবনা তত বেশি।
            </li>
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

          <div className="pt-4 border-t border-slate-100 text-sm">
            <div className="flex flex-wrap gap-2">
              <a href="/guide/diaper-size-transition-timing" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সাইজ বদলানোর সময়
              </a>
              <a href="/guide/diaper-size-by-weight" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                ওজন অনুযায়ী সাইজ
              </a>
              <a href="/guide/budget-local-diaper-brands-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                সস্তা লোকাল ব্র্যান্ড
              </a>
              <a href="/guide/store-switching-savings-bangladesh" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                দোকান বদলে সাশ্রয়
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
