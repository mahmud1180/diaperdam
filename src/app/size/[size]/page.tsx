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
    description: `Find the cheapest Size ${s.label} diapers (${s.weight}) in Bangladesh today. Compare Huggies, MamyPoko, Molfix and more across Chaldal, Daraz and Othoba by price per piece.`,
    alternates: { canonical: `https://diaperdam.com/size/${size}` },
  };
}

export default async function SizePage({ params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const s = SIZE_META[size.toLowerCase()] ?? { label: size.toUpperCase(), weight: "" };
  const products = await getAllProducts({ size_label: s.label, sort: "price_per_piece" }).catch(() => []);

  return (
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
    </div>
  );
}