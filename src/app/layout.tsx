import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "DiaperDam — Cheapest Diaper Prices in Bangladesh",
    template: "%s | DiaperDam",
  },
  description:
    "Compare diaper prices across Chaldal, Daraz, Othoba, Shwapno, Arogga, AjkerDeal and GoBaby. Find the cheapest Huggies, MamyPoko, Molfix and Neocare diapers per piece in Bangladesh.",
  metadataBase: new URL("https://diaperdam.com"),
  alternates: { canonical: "https://diaperdam.com" },
  openGraph: {
    type: "website",
    locale: "en_BD",
    siteName: "DiaperDam",
    url: "https://diaperdam.com",
  },
  robots: { index: true, follow: true },
  keywords: [
    "diaper price bangladesh",
    "cheapest diaper bangladesh",
    "huggies price bangladesh",
    "mamypoko price bangladesh",
    "molfix price bangladesh",
    "diaper comparison bangladesh",
    "chaldal diaper price",
    "daraz diaper price",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-slate-50 text-slate-900 antialiased`}>
        <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🍼</span>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                diaper<span className="text-emerald-600">dam</span>
              </span>
            </Link>
            <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="/diapers" className="hover:text-emerald-600 transition-colors">All Diapers</Link>
              <Link href="/deals" className="hover:text-emerald-600 transition-colors text-emerald-700 font-semibold">🏷️ Deals</Link>
              <Link href="/brand/huggies" className="hover:text-emerald-600 transition-colors">Huggies</Link>
              <Link href="/brand/mamypoko" className="hover:text-emerald-600 transition-colors">MamyPoko</Link>
              <Link href="/brand/molfix" className="hover:text-emerald-600 transition-colors">Molfix</Link>
              <Link href="/price-index" className="hover:text-emerald-600 transition-colors">Price Index</Link>
            </nav>
            <Link href="/diapers" className="sm:hidden text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
              Compare →
            </Link>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-20 border-t border-slate-100 bg-white py-10">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-slate-500">
            <div>
              <p className="font-semibold text-slate-800 mb-2">🍼 DiaperDam</p>
              <p className="text-xs leading-relaxed">
                Compare diaper prices across Bangladesh&apos;s top stores. Updated daily.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-2">Brands</p>
              <ul className="space-y-1">
                {["huggies","mamypoko","molfix","pampers","neocare","bashundhara"].map(b => (
                  <li key={b}><Link href={`/brand/${b}`} className="hover:text-emerald-600 capitalize">{b}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-2">By Size</p>
              <ul className="space-y-1">
                {["newborn","s","m","l","xl"].map(s => (
                  <li key={s}><Link href={`/size/${s}`} className="hover:text-emerald-600 uppercase">Size {s.toUpperCase()}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-2">Tools</p>
              <ul className="space-y-1">
                <li><Link href="/deals" className="hover:text-emerald-600">🏷️ Today&apos;s Deals</Link></li>
                <li><Link href="/price-index" className="hover:text-emerald-600">Price Index</Link></li>
                <li><Link href="/diapers" className="hover:text-emerald-600">All Diapers</Link></li>
                <li><Link href="/store/chaldal" className="hover:text-emerald-600">Chaldal</Link></li>
                <li><Link href="/store/daraz" className="hover:text-emerald-600">Daraz</Link></li>
                <li><Link href="/store/othoba" className="hover:text-emerald-600">Othoba</Link></li>
                <li><Link href="/store/shwapno" className="hover:text-emerald-600">Shwapno</Link></li>
                <li><Link href="/store/arogga" className="hover:text-emerald-600">Arogga</Link></li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
            <p>© 2026 DiaperDam. Prices updated daily from Chaldal, Daraz, Othoba, Shwapno &amp; Arogga.</p>
            <p>Affiliate links may earn a small commission at no cost to you.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
