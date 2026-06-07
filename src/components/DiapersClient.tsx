"use client";
import { useState, useMemo } from "react";
import type { DiaperProduct } from "@/lib/db";
import { formatBDT, STORE_COLORS, SIZE_ORDER } from "@/lib/utils";
import Link from "next/link";

type Props = { products: DiaperProduct[] };

const ALL_BRANDS = ["huggies","mamypoko","molfix","pampers","neocare","bashundhara","avonee","supermom","savlon"];
const ALL_SIZES  = ["Newborn","S","M","L","XL","XXL"];
const ALL_TYPES  = ["belt","pants"];

export default function DiapersClient({ products }: Props) {
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [sizeFilter,  setSizeFilter]  = useState<string | null>(null);
  const [typeFilter,  setTypeFilter]  = useState<string | null>(null);
  const [sort, setSort] = useState<"price_per_piece" | "price_bdt" | "discount_pct">("price_per_piece");

  const filtered = useMemo(() => {
    let list = products;
    if (brandFilter) list = list.filter(p => p.brand_slug === brandFilter);
    if (sizeFilter)  list = list.filter(p => p.size_label === sizeFilter);
    if (typeFilter)  list = list.filter(p => p.type === typeFilter);

    return [...list].sort((a, b) => {
      if (sort === "discount_pct") return (b.discount_pct ?? 0) - (a.discount_pct ?? 0);
      if (sort === "price_bdt")    return a.price_bdt - b.price_bdt;
      return a.price_per_piece - b.price_per_piece;
    });
  }, [products, brandFilter, sizeFilter, typeFilter, sort]);

  // Collect available brands/sizes from data
  const availBrands = [...new Set(products.map(p => p.brand_slug))].filter(Boolean);
  const availSizes  = SIZE_ORDER.filter(s => products.some(p => p.size_label === s));
  const availTypes  = ALL_TYPES.filter(t => products.some(p => p.type === t));

  function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
          active
            ? "bg-emerald-600 text-white border-emerald-600"
            : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white border-b border-slate-100 sticky top-14 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase mr-1">Brand</span>
            <Chip label="All" active={!brandFilter} onClick={() => setBrandFilter(null)} />
            {availBrands.map(b => (
              <Chip key={b} label={b.charAt(0).toUpperCase() + b.slice(1)} active={brandFilter === b} onClick={() => setBrandFilter(b === brandFilter ? null : b)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase mr-1">Size</span>
            <Chip label="All" active={!sizeFilter} onClick={() => setSizeFilter(null)} />
            {availSizes.map(s => (
              <Chip key={s} label={s} active={sizeFilter === s} onClick={() => setSizeFilter(s === sizeFilter ? null : s)} />
            ))}
            <span className="text-xs font-semibold text-slate-400 uppercase ml-2 mr-1">Type</span>
            {availTypes.map(t => (
              <Chip key={t} label={t.charAt(0).toUpperCase() + t.slice(1)} active={typeFilter === t} onClick={() => setTypeFilter(t === typeFilter ? null : t)} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase mr-1">Sort</span>
            {[
              { val: "price_per_piece" as const, label: "৳/piece (cheapest first)" },
              { val: "price_bdt" as const,       label: "Total price" },
              { val: "discount_pct" as const,    label: "Biggest discount" },
            ].map(opt => (
              <Chip key={opt.val} label={opt.label} active={sort === opt.val} onClick={() => setSort(opt.val)} />
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-sm text-slate-500 mb-4">
          <span className="font-semibold text-slate-900">{filtered.length}</span> products found
        </p>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>No diapers found with these filters.</p>
            <button onClick={() => { setBrandFilter(null); setSizeFilter(null); setTypeFilter(null); }} className="mt-3 text-emerald-600 underline text-sm">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} rank={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product: p, rank }: { product: DiaperProduct; rank: number }) {
  const storeColor = STORE_COLORS[p.store_slug] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
  const href = p.product_url ?? "#";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="slide-up bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md hover:border-emerald-200 hover:-translate-y-0.5 transition-all block"
      style={{ animationDelay: `${rank * 30}ms` }}
    >
      {/* Store + discount badges */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${storeColor.bg} ${storeColor.text} ${storeColor.border}`}>
          {p.store_name}
        </span>
        {p.is_promotion && p.discount_pct && (
          <span className="text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full">
            -{Math.round(p.discount_pct)}%
          </span>
        )}
      </div>

      {/* Image + details */}
      <div className="flex gap-3">
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image_url} alt={p.brand} className="w-14 h-14 object-contain rounded-xl bg-slate-50 shrink-0" />
        ) : (
          <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-2xl shrink-0">🍼</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm">{p.brand}</p>
          {p.line && <p className="text-xs text-slate-500 truncate">{p.line}</p>}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {p.type && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded capitalize">{p.type}</span>
            )}
            {p.size_label && (
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">{p.size_label}</span>
            )}
            <span className="text-[10px] text-slate-400">{p.pack_qty} pcs</span>
            {p.weight_min_kg && p.weight_max_kg && (
              <span className="text-[10px] text-slate-400">{p.weight_min_kg}–{p.weight_max_kg}kg</span>
            )}
          </div>
        </div>
      </div>

      {/* Hero price */}
      <div className="mt-3 pt-3 border-t border-slate-50 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-emerald-600 price-pill">
            {formatBDT(p.price_per_piece)}<span className="text-sm font-normal text-slate-400 ml-1">/piece</span>
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-sm text-slate-700 font-semibold">{formatBDT(p.price_bdt)} total</p>
            {p.original_price_bdt && (
              <p className="text-xs text-slate-400 line-through">{formatBDT(p.original_price_bdt)}</p>
            )}
          </div>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
          View →
        </span>
      </div>
    </a>
  );
}