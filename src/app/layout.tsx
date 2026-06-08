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

        <footer className="mt-20 border-t border-slate-200 bg-slate-900 text-slate-400 py-12">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
            <div className="col-span-2 md:col-span-1">
              <p className="font-bold text-white text-lg mb-2">🍼 diaper<span className="text-emerald-400">dam</span></p>
              <p className="text-xs leading-relaxed">
                Bangladesh&apos;s diaper price comparison. We compare prices from all major online stores daily so you always find the cheapest diaper per piece.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-300 mb-3 text-xs uppercase tracking-wider">By Brand</p>
              <ul className="space-y-1.5">
                {[
                  { slug: "huggies", name: "Huggies" },
                  { slug: "mamypoko", name: "MamyPoko" },
                  { slug: "molfix", name: "Molfix" },
                  { slug: "pampers", name: "Pampers" },
                  { slug: "neocare", name: "Neocare" },
                  { slug: "bashundhara", name: "Bashundhara" },
                  { slug: "avonee", name: "Avonee" },
                  { slug: "supermom", name: "Supermom" },
                ].map(b => (
                  <li key={b.slug}><Link href={`/brand/${b.slug}`} className="hover:text-emerald-400 transition-colors">{b.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-300 mb-3 text-xs uppercase tracking-wider">By Size</p>
              <ul className="space-y-1.5">
                <li><Link href="/size/newborn" className="hover:text-emerald-400 transition-colors">Newborn (0-5 kg)</Link></li>
                <li><Link href="/size/s" className="hover:text-emerald-400 transition-colors">Size S (4-8 kg)</Link></li>
                <li><Link href="/size/m" className="hover:text-emerald-400 transition-colors">Size M (6-11 kg)</Link></li>
                <li><Link href="/size/l" className="hover:text-emerald-400 transition-colors">Size L (9-14 kg)</Link></li>
                <li><Link href="/size/xl" className="hover:text-emerald-400 transition-colors">Size XL (12-17 kg)</Link></li>
                <li><Link href="/size/xxl" className="hover:text-emerald-400 transition-colors">Size XXL (15+ kg)</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-300 mb-3 text-xs uppercase tracking-wider">By Store</p>
              <ul className="space-y-1.5">
                <li><Link href="/store/chaldal" className="hover:text-emerald-400 transition-colors">Chaldal</Link></li>
                <li><Link href="/store/meenabazar" className="hover:text-emerald-400 transition-colors">Meena Bazar</Link></li>
                <li><Link href="/store/gobaby" className="hover:text-emerald-400 transition-colors">GoBaby</Link></li>
                <li><Link href="/store/shwapno" className="hover:text-emerald-400 transition-colors">Shwapno</Link></li>
                <li><Link href="/store/daraz" className="hover:text-emerald-400 transition-colors">Daraz</Link></li>
                <li><Link href="/store/othoba" className="hover:text-emerald-400 transition-colors">Othoba</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-300 mb-3 text-xs uppercase tracking-wider">Tools</p>
              <ul className="space-y-1.5">
                <li><Link href="/diapers" className="hover:text-emerald-400 transition-colors">Compare All Diapers</Link></li>
                <li><Link href="/deals" className="hover:text-emerald-400 transition-colors">Today&apos;s Deals</Link></li>
                <li><Link href="/price-index" className="hover:text-emerald-400 transition-colors">Price Index</Link></li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 mt-10 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
            <p>&copy; 2026 DiaperDam. Prices updated daily from Chaldal, Meena Bazar, GoBaby, Shwapno &amp; more.</p>
            <p>Affiliate links may earn a small commission at no cost to you.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
