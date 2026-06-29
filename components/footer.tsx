import Link from 'next/link'
import { Radar } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#06281E] text-white/70 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row gap-8 justify-between">
          {/* Brand */}
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-[#10B981] flex items-center justify-center">
                <Radar className="w-4 h-4 text-white" />
              </div>
              <span className="font-serif font-semibold text-white text-base">ResaleRadar</span>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Resale price intelligence. Know what it sells for before you list it.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div>
              <p className="text-white text-sm font-medium mb-3">Product</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-white transition-colors">Scan an item</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Honest data notice */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <p className="text-sm leading-relaxed text-white/60 max-w-2xl">
            <span className="text-white font-medium">Data transparency:</span>{' '}
            eBay values are live from eBay&apos;s official API. Poshmark and Depop are estimated from comparable
            eBay sold data — and labeled as such. This honest framing is a feature, not a disclaimer.
          </p>
          <p className="mt-4 text-xs text-white/40">
            &copy; {new Date().getFullYear()} ResaleRadar. Not affiliated with eBay, Poshmark, or Depop.
          </p>
        </div>
      </div>
    </footer>
  )
}
