import type { Metadata } from "next";
import { getAllProducts } from "@/lib/db";
import DiapersClient from "@/components/DiapersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "All Diaper Prices in Bangladesh — Compare Stores & Brands",
  description:
    "Compare all diaper prices in Bangladesh from Chaldal, Daraz, Othoba and Shwapno. Filter by brand, size, and type. Sorted by price per piece.",
  alternates: { canonical: "https://diaperdam.com/diapers" },
};

export default async function DiapersPage() {
  const products = await getAllProducts({ sort: "price_per_piece" }).catch(() => []);

  return (
    <DiapersClient
      products={products}
      showHeroFilters
      title="All diaper deals right now"
    />
  );
}
