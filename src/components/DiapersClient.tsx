"use client";
import { useState, useMemo } from "react";
import type { DiaperProduct } from "@/lib/db";
import { STORE_COLORS, SIZE_ORDER } from "@/lib/utils";

type Props = {
  products: DiaperProduct[];
  showHeroFilters?: boolean;
  title?: string;
};

const SORT_OPTIONS = [
  { value: "price_per_piece" as const, label: "Cheapest per piece" },
  { value: "price_bdt" as const,       label: "Cheapest per pack" },
  { value: "discount_pct" as const,    label: "Biggest discount" },
];

const PAGE_SIZE = 50;

export default function DiapersClient({ products, showHeroFilters, title }: Props) {
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [sizeFilter,  setSizeFilter]  = useState<string | null>(null);
  const [typeFilter,  setTypeFilter]  = useState<string | null>(null);
  const [sort, setSort] = useState<"price_per_piece" | "price_bdt" | "discount_pct">("price_per_piece");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = products;
    if (brandFilter) list = list.filter(p => p.brand_slug === brandFilter);
    if (sizeFilter)  list = list.filter(p => p.size_label === sizeFilter);
    if (typeFilter)  list = list.filter(p => p.type === typeFilter);

    return [...list].sort((a, b) => {
      if (sort === "discount_pct") return (Number(b.discount_pct) || 0) - (Number(a.discount_pct) || 0);
      if (sort === "price_bdt")    return Number(a.price_bdt) - Number(b.price_bdt);
      return Number(a.price_per_piece) - Number(b.price_per_piece);
    });
  }, [products, brandFilter, sizeFilter, typeFilter, sort]);

  // Reset page when filters change
  useMemo(() => setPage(1), [brandFilter, sizeFilter, typeFilter, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Collect available brands/sizes from data
  const availBrands = [...new Set(products.map(p => p.brand_slug))].filter(Boolean).sort();
  const brandNames  = Object.fromEntries(products.map(p => [p.brand_slug, p.brand]));
  const availSizes  = SIZE_ORDER.filter(s => products.some(p => p.size_label === s));

  const storeCount = new Set(products.map(p => p.store_slug)).size;

  function handleBrandChange(val: string) {
    setBrandFilter(val || null);
  }
  function handleSizeChange(val: string) {
    setSizeFilter(val || null);
  }

  return (
    <div>
      {/* Hero with filters (luieraanbiedingen-style) */}
      {showHeroFilters && (
        <div className="bg-gradient-to-br from-teal-600 via-emerald-600 to-emerald-700 text-white py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              {title || "All diaper deals right now"}
            </h1>
            <p className="text-emerald-100 text-lg mb-8">
              Today <strong className="text-white">{products.length}</strong> products at <strong className="text-white">{storeCount}</strong> stores
            </p>

            {/* Hero filter dropdowns */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
              <select
                value={brandFilter ?? ""}
                onChange={e => handleBrandChange(e.target.value)}
                className="text-base border-0 rounded-xl px-5 py-3 bg-white text-slate-700 cursor-pointer shadow-lg focus:ring-2 focus:ring-white outline-none w-full sm:w-auto"
              >
                <option value="">Choose brand...</option>
                {availBrands.map(b => (
                  <option key={b} value={b}>{brandNames[b] || b}</option>
                ))}
              </select>

              <select
                value={sizeFilter ?? ""}
                onChange={e => handleSizeChange(e.target.value)}
                className="text-base border-0 rounded-xl px-5 py-3 bg-white text-slate-700 cursor-pointer shadow-lg focus:ring-2 focus:ring-white outline-none w-full sm:w-auto"
              >
                <option value="">Choose size...</option>
                {availSizes.map(s => (
                  <option key={s} value={s}>{s === "Newborn" ? "Newborn (0-5 kg)" : `Size ${s}`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Description text */}
      <div className="bg-slate-50 border-b border-slate-200 py-4 px-4">
        <div className="max-w-6xl mx-auto text-sm text-slate-600">
          Compare all baby diaper prices across Bangladesh&apos;s top online stores. Sorted by the lowest price per diaper piece so you always find the best deal. Use the filters above to select your brand or size.
        </div>
      </div>

      {/* Type tabs + sort */}
      <div className="bg-white border-b border-slate-200 sticky top-14 z-40">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between py-2">
          {/* Type tabs */}
          <div className="flex">
            {[
              { value: null, label: "All" },
              { value: "belt", label: "Belt / Tape" },
              { value: "pants", label: "Pants" },
            ].map(tab => (
              <button
                key={tab.label}
                onClick={() => setTypeFilter(tab.value)}
                className={`text-sm font-medium px-4 py-2 border-b-2 transition-colors cursor-pointer ${
                  typeFilter === tab.value
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort + inline brand/size if no hero */}
          <div className="flex items-center gap-2">
            {!showHeroFilters && (
              <>
                <select
                  value={brandFilter ?? ""}
                  onChange={e => handleBrandChange(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 cursor-pointer outline-none"
                >
                  <option value="">All brands</option>
                  {availBrands.map(b => (
                    <option key={b} value={b}>{brandNames[b] || b}</option>
                  ))}
                </select>
                <select
                  value={sizeFilter ?? ""}
                  onChange={e => handleSizeChange(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 cursor-pointer outline-none"
                >
                  <option value="">All sizes</option>
                  {availSizes.map(s => (
                    <option key={s} value={s}>{s === "Newborn" ? "Newborn" : `Size ${s}`}</option>
                  ))}
                </select>
              </>
            )}
            <select
              value={sort}
              onChange={e => setSort(e.target.value as typeof sort)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 cursor-pointer outline-none"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>No diapers found with these filters.</p>
            <button
              onClick={() => { setBrandFilter(null); setSizeFilter(null); setTypeFilter(null); }}
              className="mt-3 text-emerald-600 underline text-sm cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-200">
                    <th className="pb-3 pl-2" colSpan={2}>Product</th>
                    <th className="pb-3 text-center">Discount</th>
                    <th className="pb-3 text-right">Pack price</th>
                    <th className="pb-3 text-center">Store</th>
                    <th className="pb-3 text-right pr-2">Per piece</th>
                    <th className="pb-3 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p) => (
                    <TableRow key={p.id} p={p} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden space-y-1">
              {paged.map((p) => (
                <MobileRow key={p.id} p={p} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6 mb-2">
                {page > 1 && (
                  <button
                    onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="text-sm text-emerald-700 hover:underline cursor-pointer"
                  >
                    &lsaquo; Previous
                  </button>
                )}
                <span className="text-sm text-slate-500">
                  Page <strong>{page}</strong> of {totalPages}
                </span>
                {page < totalPages && (
                  <button
                    onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="text-sm text-emerald-700 hover:underline cursor-pointer"
                  >
                    Next &rsaquo;
                  </button>
                )}
              </div>
            )}

            {/* Size cross-links (bottom SEO links like luieraanbiedingen) */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-slate-500">
              <span className="mr-2">Also available in:</span>
              {SIZE_ORDER.map((s, i) => (
                <span key={s}>
                  <a href={`/size/${s.toLowerCase()}`} className="text-emerald-700 hover:underline">
                    {s === "Newborn" ? "Newborn" : `Size ${s}`}
                  </a>
                  {i < SIZE_ORDER.length - 1 && <span className="mx-1.5 text-slate-300">·</span>}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TableRow({ p }: { p: DiaperProduct }) {
  const sc = STORE_COLORS[p.store_slug] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
  const hasDiscount = p.discount_pct && Number(p.discount_pct) >= 5;
  const fullName = [p.brand, p.line, p.size_label ? `Size ${p.size_label}` : null, `${p.pack_qty} pcs`].filter(Boolean).join(" | ");

  return (
    <tr className="border-b border-slate-100 hover:bg-emerald-50/40 transition-colors group">
      {/* Image */}
      <td className="py-3 pl-2 w-14">
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image_url} alt={p.brand} className="w-12 h-12 object-contain rounded-lg bg-slate-50" />
        ) : (
          <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-lg">🍼</div>
        )}
      </td>
      {/* Product info */}
      <td className="py-3 pr-4">
        <div className="font-semibold text-slate-900">{fullName}</div>
        <div className="text-xs text-slate-400 mt-0.5">
          {p.type && <span className="capitalize">{p.type}</span>}
          {p.weight_min_kg && p.weight_max_kg && (
            <span> · {p.weight_min_kg}–{p.weight_max_kg} kg</span>
          )}
        </div>
      </td>
      {/* Discount */}
      <td className="py-3 text-center">
        {hasDiscount ? (
          <span className="inline-block bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
            -{Math.round(Number(p.discount_pct))}%
          </span>
        ) : (
          <span className="text-slate-200">—</span>
        )}
      </td>
      {/* Pack price */}
      <td className="py-3 text-right">
        <span className="text-slate-700">৳{Number(p.price_bdt).toLocaleString()}</span>
        {p.original_price_bdt && Number(p.original_price_bdt) > Number(p.price_bdt) && (
          <span className="text-xs text-slate-400 line-through ml-1">৳{Number(p.original_price_bdt).toLocaleString()}</span>
        )}
      </td>
      {/* Store */}
      <td className="py-3 text-center">
        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`}>
          {p.store_name}
        </span>
      </td>
      {/* Per piece */}
      <td className="py-3 text-right pr-2">
        <span className="text-lg font-bold text-emerald-700">
          ৳{Number(p.price_per_piece).toFixed(2)}
        </span>
      </td>
      {/* CTA */}
      <td className="py-3 text-center">
        {p.product_url ? (
          <a
            href={p.product_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-block bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            View
          </a>
        ) : (
          <span className="text-slate-200 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}

function MobileRow({ p }: { p: DiaperProduct }) {
  const sc = STORE_COLORS[p.store_slug] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
  const hasDiscount = p.discount_pct && Number(p.discount_pct) >= 5;

  return (
    <a
      href={p.product_url ?? "#"}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="flex items-center gap-3 bg-white border-b border-slate-100 py-3 px-1 hover:bg-emerald-50/40 transition-colors"
    >
      {p.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image_url} alt={p.brand} className="w-11 h-11 object-contain rounded-lg bg-slate-50 shrink-0" />
      ) : (
        <div className="w-11 h-11 bg-slate-50 rounded-lg flex items-center justify-center text-lg shrink-0">🍼</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-900 text-sm truncate">
          {p.brand} {p.line && `${p.line} `}{p.size_label && `| ${p.size_label} `}| {p.pack_qty} pcs
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
            {p.store_name}
          </span>
          {hasDiscount && (
            <span className="text-[10px] font-bold text-red-600">-{Math.round(Number(p.discount_pct))}%</span>
          )}
          <span className="text-[10px] text-slate-400">৳{Number(p.price_bdt).toLocaleString()}</span>
        </div>
      </div>
      <div className="text-right shrink-0 pr-1">
        <div className="text-lg font-bold text-emerald-700">৳{Number(p.price_per_piece).toFixed(2)}</div>
        <div className="text-[10px] text-slate-400">per piece</div>
      </div>
    </a>
  );
}
