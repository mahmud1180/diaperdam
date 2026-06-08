import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";

export const revalidate = 3600;

const SIZE_META: Record<string, { label: string; weight: string }> = {
  newborn: { label: "Newborn",  weight: "up to 5 kg" },
  s:       { label: "S",        weight: "3–7 kg" },
  m:       { label: "M",        weight: "5–13 kg" },
  l:       { label: "L",        weight: "10–16 kg" },
  xl:      { label: "XL",       weight: "15 kg+" },
  xxl:     { label: "XXL",      weight: "16 kg+" },
};

export async function generateMetadata({ params }: { params: Promise<{ size: string }> }): Promise<Metadata> {
  const { size } = await params;
  const s = SIZE_META[size.toLowerCase()] ?? { label: size.toUpperCase(), weight: "" };
  return {
    title: `Size ${s.label} Diaper Price in Bangladesh ${s.weight} — Cheapest Today`,
    description: `Find the cheapest Size ${s.label} diapers (${s.weight}) in Bangladesh today. Compare Huggies, MamyPoko, Molfix and more across Chaldal, Daraz, Othoba, Shwapno and Arogga by price per piece.`,
    alternates: { canonical: `https://diaperdam.com/size/${size}` },
  };
}

export default async function SizePage({ params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const s = SIZE_META[size.toLowerCase()] ?? { label: size.toUpperCase(), weight: "" };
  const products = await getAllProducts({ size_label: s.label, sort: "price_per_piece" }).catch(() => []);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Cheapest Size ${s.label} Diapers in Bangladesh`,
    "description": `Compare Size ${s.label} diaper prices (${s.weight}) across all stores in Bangladesh.`,
    "url": `https://diaperdam.com/size/${size}`,
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": {
        "@type": "Product",
        "name": `${p.brand} ${p.line ?? ""} Size ${s.label} ${p.pack_qty}pcs`.trim(),
        "brand": { "@type": "Brand", "name": p.brand },
        "offers": {
          "@type": "Offer",
          "price": p.price_bdt.toFixed(2),
          "priceCurrency": "BDT",
          "availability": "https://schema.org/InStock",
          "url": p.product_url ?? `https://diaperdam.com/size/${size}`,
          "seller": { "@type": "Organization", "name": p.store_name },
        },
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://diaperdam.com" },
      { "@type": "ListItem", "position": 2, "name": "Diapers", "item": "https://diaperdam.com/diapers" },
      { "@type": "ListItem", "position": 3, "name": `Size ${s.label}`, "item": `https://diaperdam.com/size/${size}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div>
        <div className="bg-white border-b border-slate-100 py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm text-slate-400 mb-1">
              <a href="/diapers" className="hover:text-emerald-600">All Diapers</a> / Size {s.label}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">
              Cheapest Size {s.label} Diapers in Bangladesh
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              For babies {s.weight}. Sorted by price per piece across all stores.
            </p>
          </div>
        </div>
        <DiapersClient products={products} />
        {products.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 pb-12">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mt-4">
              <h2 className="font-bold text-slate-900 mb-2">Size {s.label} Diaper Prices in Bangladesh</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Size {s.label} diapers are designed for babies weighing {s.weight}.
                DiaperDam compares Size {s.label} prices across Chaldal, Daraz, Othoba, Shwapno and Arogga.
                All prices are shown per piece so you can compare 40-pack and 80-pack options fairly.
                The cheapest Size {s.label} option right now is{" "}
                <strong>৳{products[0].price_per_piece.toFixed(2)}/pc</strong> ({products[0].brand} at {products[0].store_name}).
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}