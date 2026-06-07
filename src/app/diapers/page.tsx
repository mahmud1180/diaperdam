import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All Diaper Prices in Bangladesh — Compare Stores & Brands",
  description:
    "Compare all diaper prices in Bangladesh from Chaldal, Daraz, Othoba and Shwapno. Filter by brand, size, and type. Sorted by price per piece.",
  alternates: { canonical: "https://diaperdam.com/diapers" },
};

export default async function DiapersPage() {
  const products = await getAllProducts({ sort: "price_per_piece" }).catch(() => []);

  return (
    <div>
      <div className="bg-white border-b border-slate-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-900">
            All Diaper Prices in Bangladesh
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sorted by price per piece — the only fair comparison across different pack sizes.
          </p>
        </div>
      </div>
      <DiapersClient products={products} />
    </div>
  );
}