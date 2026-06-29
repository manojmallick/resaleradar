import Link from 'next/link'
import { Check, Zap } from 'lucide-react'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'For casual sellers testing the waters.',
    cta: 'Get started free',
    ctaHref: '/',
    featured: false,
    features: [
      '5 scans per month',
      'eBay live pricing',
      'Poshmark & Depop estimates',
      'Auto-generated listing',
      'Days-to-sell estimate',
    ],
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/mo',
    description: 'For active resellers who list regularly.',
    cta: 'Start Pro',
    ctaHref: '/',
    featured: true,
    badge: 'Most popular',
    features: [
      'Unlimited scans',
      'Cross-platform price comparison',
      'Auto-listing to eBay, Poshmark & Depop',
      'Price drop & sell alerts',
      'Dashboard & closet tracking',
      'Priority support',
    ],
  },
  {
    name: 'Business',
    price: '$29',
    period: '/mo',
    description: 'For high-volume sellers and inventory managers.',
    cta: 'Start Business',
    ctaHref: '/',
    featured: false,
    features: [
      'Everything in Pro',
      'Bulk scanning (CSV upload)',
      'API access',
      'Inventory management',
      'Team seats (up to 5)',
      'Dedicated account support',
    ],
  },
]

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#06281E] text-balance mb-4">
            Simple, honest pricing
          </h1>
          <p className="text-[#6b7f78] text-lg max-w-xl mx-auto leading-relaxed">
            Start free. Upgrade when you&apos;re listing more than you can keep up with.
          </p>
        </div>

        {/* Tiers */}
        <div className="grid sm:grid-cols-3 gap-6 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-7 flex flex-col gap-6 ${
                tier.featured
                  ? 'bg-[#06281E] border-[#06281E] shadow-xl ring-2 ring-[#10B981]/40'
                  : 'bg-white border-[#d1e8de] shadow-sm'
              }`}
            >
              {/* Tier header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-semibold ${
                      tier.featured ? 'text-[#6EE7B7]' : 'text-[#10B981]'
                    }`}
                  >
                    {tier.name}
                  </span>
                  {tier.badge && (
                    <span className="flex items-center gap-1 bg-[#10B981] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      <Zap className="w-3 h-3" />
                      {tier.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span
                    className={`font-serif text-5xl font-semibold ${
                      tier.featured ? 'text-white' : 'text-[#06281E]'
                    }`}
                  >
                    {tier.price}
                  </span>
                  <span className={tier.featured ? 'text-white/50' : 'text-[#6b7f78]'}>
                    {tier.period}
                  </span>
                </div>
                <p
                  className={`text-sm leading-relaxed ${
                    tier.featured ? 'text-white/60' : 'text-[#6b7f78]'
                  }`}
                >
                  {tier.description}
                </p>
              </div>

              {/* CTA */}
              <Link
                href={tier.ctaHref}
                className={`block text-center font-semibold text-sm px-5 py-3 rounded-xl transition-colors ${
                  tier.featured
                    ? 'bg-[#10B981] hover:bg-[#34D399] text-white'
                    : 'bg-[#ECFDF5] hover:bg-[#d1fae5] text-[#06281E] border border-[#10B981]/30'
                }`}
              >
                {tier.cta}
              </Link>

              {/* Features */}
              <ul className="space-y-3">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        tier.featured ? 'text-[#34D399]' : 'text-[#10B981]'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        tier.featured ? 'text-white/80' : 'text-[#6b7f78]'
                      }`}
                    >
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p className="text-center text-sm text-[#6b7f78] mt-10">
          Plus a 1% fee on cross-posted listings that sell. No other hidden charges.
        </p>
      </main>
      <Footer />
    </>
  )
}
