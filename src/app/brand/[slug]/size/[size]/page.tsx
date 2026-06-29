import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";
import type { DiaperProduct } from "@/lib/db";
import { BRAND_SLUGS, SIZE_SLUGS } from "@/lib/catalog";
import { brandInfo, brandLabel } from "@/lib/brands";

export const revalidate = 3600;

// Prerender all brand x size combos at build time so the route is ISR
// (without this, dynamic-param pages degrade to per-request rendering
// and serve Cache-Control: private, no-store).
export function generateStaticParams() {
  return BRAND_SLUGS.flatMap(slug => SIZE_SLUGS.map(size => ({ slug, size })));
}

const SIZE_META: Record<string, { label: string; labelBn: string; weightBn: string }> = {
  newborn: { label: "Newborn", labelBn: "নবজাতক", weightBn: "৫ কেজি পর্যন্ত" },
  s:       { label: "S",       labelBn: "S",       weightBn: "৩-৭ কেজি" },
  m:       { label: "M",       labelBn: "M",       weightBn: "৫-১৩ কেজি" },
  l:       { label: "L",       labelBn: "L",       weightBn: "১০-১৬ কেজি" },
  xl:      { label: "XL",      labelBn: "XL",      weightBn: "১৫ কেজি+" },
  xxl:     { label: "XXL",     labelBn: "XXL",     weightBn: "১৬ কেজি+" },
};

const BN_MONTHS = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

type PageParams = { slug: string; size: string };

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { slug, size } = await params;
  const b = brandInfo(slug);
  const s = SIZE_META[size.toLowerCase()] ?? { label: size.toUpperCase(), labelBn: size.toUpperCase(), weightBn: "" };
  const month = BN_MONTHS[new Date().getMonth()];
  const products = await getAllProducts({ brand_slug: slug, size_label: s.label }).catch(() => []);

  return {
    // Bengali-led brand name (matches হাগিস ... queries) + Latin in parens.
    title: `${brandLabel(slug)} সাইজ ${s.label} ডায়াপার দাম বাংলাদেশ — ${month} ২০২৬`,
    description: `${month} ২০২৬: বাংলাদেশে ${b.nameBn} সাইজ ${s.label} (${s.weightBn}) ডায়াপারের দাম তুলনা। ${products.length} টি পণ্য সব দোকান থেকে প্রতি পিস দামে সাজানো।`,
    alternates: { canonical: `https://diaperdam.com/brand/${slug}/size/${size}` },
  };
}

export default async function BrandSizePage({ params }: { params: Promise<PageParams> }) {
  const { slug, size } = await params;
  const b = brandInfo(slug);
  const label = brandLabel(slug);
  const s = SIZE_META[size.toLowerCase()] ?? { label: size.toUpperCase(), labelBn: size.toUpperCase(), weightBn: "" };

  const products = await getAllProducts({ brand_slug: slug, size_label: s.label, sort: "price_per_piece" })
    .catch(() => [] as DiaperProduct[]);

  const priceValidUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // JSON-LD
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${b.nameBn} সাইজ ${s.label} ডায়াপার দাম বাংলাদেশ`,
    "url": `https://diaperdam.com/brand/${slug}/size/${size}`,
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": `${p.brand} ${p.line ?? ""} ${s.label} ${p.pack_qty}pcs`.trim(),
        "brand": { "@type": "Brand", "name": p.brand },
        "offers": {
          "@type": "Offer",
          "price": Number(p.price_bdt).toFixed(2),
          "priceCurrency": "BDT",
          "priceValidUntil": priceValidUntil,
          "availability": "https://schema.org/InStock",
          "url": p.product_url ?? `https://diaperdam.com/brand/${slug}/size/${size}`,
          "seller": { "@type": "Organization", "name": p.store_name },
        },
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "হোম", "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "ডায়াপার", "item": "https://diaperdam.com/diapers" },
      { "@type": "ListItem", "position": 3, "name": b.nameBn, "item": `https://diaperdam.com/brand/${slug}` },
      { "@type": "ListItem", "position": 4, "name": `সাইজ ${s.label}`, "item": `https://diaperdam.com/brand/${slug}/size/${size}` },
    ],
  };

  // Other sizes for this brand (for cross-links)
  const allBrandProducts = await getAllProducts({ brand_slug: slug }).catch(() => [] as DiaperProduct[]);
  const otherSizes = [...new Set(allBrandProducts.map(p => p.size_label).filter(Boolean))]
    .filter(sz => sz!.toLowerCase() !== s.label.toLowerCase()) as string[];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div>
        <div className="bg-white border-b border-slate-100 py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm text-slate-400 mb-1">
              <a href="/diapers" className="hover:text-emerald-600">সব ডায়াপার</a>
              {" / "}
              <a href={`/brand/${slug}`} className="hover:text-emerald-600">{b.nameBn}</a>
              {" / "}
              সাইজ {s.label}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              {label} সাইজ {s.label} ডায়াপার দাম বাংলাদেশ
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {s.weightBn} ওজনের বাচ্চাদের জন্য {b.nameBn} সাইজ {s.label}। {products.length} টি পণ্য সব দোকান থেকে প্রতি পিস দামে সাজানো।
            </p>

            {/* Other sizes for this brand */}
            {otherSizes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-xs text-slate-400 self-center">অন্যান্য সাইজ:</span>
                {otherSizes.map(sz => (
                  <a
                    key={sz}
                    href={`/brand/${slug}/size/${sz.toLowerCase()}`}
                    className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-3 py-1 hover:bg-emerald-100 transition-colors"
                  >
                    {sz === "Newborn" ? "নবজাতক" : `সাইজ ${sz}`}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {products.length > 0 ? (
          <DiapersClient products={products} />
        ) : (
          <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>{b.nameBn} সাইজ {s.label}-এ এখনও পণ্য পাওয়া যায়নি।</p>
            <a href={`/brand/${slug}`} className="mt-3 inline-block text-emerald-600 hover:underline text-sm">
              সব {b.nameBn} ডায়াপার দেখুন
            </a>
          </div>
        )}

        {/* SEO content */}
        {products.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 pb-12">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
              <h2 className="font-bold text-slate-900 mb-2">
                {label} সাইজ {s.label} ডায়াপার — প্রতি পিস দাম তুলনা
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {b.nameBn} সাইজ {s.label} ডায়াপার {s.weightBn} ওজনের বাচ্চাদের জন্য।
                DiaperDam চালডাল, দারাজ, স্বপ্ন, মীনা বাজার সহ সব দোকান থেকে {b.nameBn} সাইজ {s.label}-এর দাম তুলনা করে।
                এই মুহূর্তে সবচেয়ে সস্তা{" "}
                <strong>৳{Number(products[0].price_per_piece).toFixed(2)}/পিস</strong>{" "}
                ({products[0].pack_qty} পিস, {products[0].store_name})।
              </p>
            </div>

            {/* Cross-links */}
            <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500 space-y-3">
              <div className="flex flex-wrap gap-2">
                <a href={`/brand/${slug}`} className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                  সব {b.nameBn} ডায়াপার
                </a>
                <a href={`/size/${size}`} className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                  সব সাইজ {s.label} ডায়াপার
                </a>
                <a href="/diapers" className="text-emerald-700 hover:underline bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                  সব ডায়াপার তুলনা
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
