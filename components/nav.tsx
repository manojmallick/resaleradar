'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Radar } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Scan' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pricing', label: 'Pricing' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header className="bg-[#06281E] sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#10B981] flex items-center justify-center flex-shrink-0 group-hover:bg-[#34D399] transition-colors">
            <Radar className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="font-serif font-semibold text-white text-lg tracking-tight">
            ResaleRadar
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="bg-[#10B981] hover:bg-[#34D399] text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          New scan
        </Link>
      </nav>
    </header>
  )
}
