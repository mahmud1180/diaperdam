"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GUIDES, GUIDE_GROUPS } from "@/lib/catalog";

// Rendered under every /guide/* page by app/guide/layout.tsx. The hub and the
// homepage were linking the guides since 09-01, yet on 10-25 the hub and most
// guides were still "URL is unknown to Google". The guides Google DID index
// (newborn-diaper-size, diaper-size-chart, recrawled weekly) linked only to
// each other, so every crawl of them was a dead end. This puts the hub and the
// other guides one hop from each indexed guide.
export default function GuideFooter() {
  const pathname = usePathname();
  const current = pathname.startsWith("/guide/") ? pathname.slice("/guide/".length) : null;
  if (!current) return null; // the hub already lists everything

  return (
    <nav aria-label="আরও ডায়াপার গাইড" className="max-w-3xl mx-auto px-4 pb-10">
      <div className="border-t border-slate-100 pt-6">
        <p className="font-bold text-slate-900 mb-1">আরও গাইড</p>
        <p className="text-sm text-slate-500 mb-4">
          <Link href="/guide" className="text-emerald-700 font-semibold hover:underline">
            সব {GUIDES.length}টি ডায়াপার গাইড এক পাতায়
          </Link>
        </p>
        {GUIDE_GROUPS.map(group => {
          const items = GUIDES.filter(g => g.group === group.key && g.slug !== current);
          if (items.length === 0) return null;
          return (
            <div key={group.key} className="mb-3">
              <p className="text-xs font-semibold text-slate-400 mb-1">{group.label}</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {items.map(g => (
                  <li key={g.slug}>
                    <Link href={`/guide/${g.slug}`} className="text-emerald-700 hover:underline">
                      {g.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
