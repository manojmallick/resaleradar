import Image from 'next/image'
import Link from 'next/link'
import { Clock, TrendingUp, ArrowLeft, AlertTriangle } from 'lucide-react'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { ValuationCard } from '@/components/valuation-card'
import { ListingGenerator } from '@/components/listing-generator'
import { TrackButton } from '@/components/track-button'
import { formatPrice, formatCondition, formatCategory, getItemImage, getPlatformConfig } from '@/lib/platform'
import { getReportOrMock } from '@/lib/queries'

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ itemId: string }>
}) {
  const { itemId } = await params
  const { data: report, live } = await getReportOrMock(itemId)
  const imageUrl = report.imageUrl ?? getItemImage(report.id)
  const best = report.platforms.find((p) => p.isBest)
  const bestConfig = getPlatformConfig(report.bestPlatform)
  const scannedDate = new Date(report.scannedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#6b7f78] hover:text-[#06281E] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          New scan
        </Link>

        {/* Sample data notice — only when backend isn't live */}
        {!live && (
          <div className="mb-8 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Showing sample data.</span> Connect the Aurora + Bedrock
              backend to scan real items.
            </p>
          </div>
        )}

        {/* Item header */}
        <div className="flex flex-col sm:flex-row gap-6 mb-10">
          {/* Thumbnail */}
          <div className="flex-shrink-0 w-full sm:w-40 h-40 rounded-2xl overflow-hidden bg-[#ECFDF5] border border-[#d1e8de]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={report.title}
                width={160}
                height={160}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#10B981]/40 text-sm">
                No image
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex-1 flex flex-col justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#06281E] text-balance leading-snug mb-3">
                {report.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                {report.brand && (
                  <span className="text-xs font-medium bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/30 px-2.5 py-1 rounded-full">
                    {report.brand}
                  </span>
                )}
                <span className="text-xs font-medium bg-[#F6FBF8] text-[#6b7f78] border border-[#d1e8de] px-2.5 py-1 rounded-full">
                  {formatCategory(report.category)}
                </span>
                <span className="text-xs font-medium bg-[#F6FBF8] text-[#6b7f78] border border-[#d1e8de] px-2.5 py-1 rounded-full">
                  {formatCondition(report.condition)}
                </span>
                <span className="text-xs text-[#6b7f78] px-2.5 py-1">
                  Scanned {scannedDate}
                </span>
              </div>
            </div>
            <div>
              <TrackButton itemId={report.id} />
            </div>
          </div>
        </div>

        {/* Hero recommendation banner */}
        <div className="rounded-2xl bg-[#06281E] text-white p-7 mb-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div className="flex-1">
            <p className="text-[#6EE7B7] text-xs font-semibold uppercase tracking-widest mb-2">
              Best move
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-3 text-balance leading-snug">
              Sell on {bestConfig.label} for{' '}
              <span className="text-[#34D399]">{formatPrice(report.recommendedPrice)}</span>
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-lg">
              Priced for the fastest sale — not the highest sticker that sits unsold. We rank by
              expected dollars-per-day, not just median price.
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-row sm:flex-col gap-4 flex-shrink-0">
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <Clock className="w-5 h-5 text-[#6EE7B7]" />
              <div>
                <p className="text-white/50 text-xs">Est. days to sell</p>
                <p className="text-white font-bold text-lg leading-tight">~{report.estDaysToSell}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <TrendingUp className="w-5 h-5 text-[#6EE7B7]" />
              <div>
                <p className="text-white/50 text-xs">Velocity</p>
                <p className="text-white font-bold text-lg leading-tight">
                  ${best?.velocityScore.toFixed(0)}/day
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Across marketplaces */}
        <section className="mb-10">
          <h2 className="font-serif text-2xl font-semibold text-[#06281E] mb-5">
            Across marketplaces
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {report.platforms.map((p) => (
              <ValuationCard key={p.platform} valuation={p} />
            ))}
          </div>
        </section>

        {/* Listing generator */}
        <ListingGenerator itemId={report.id} initialListing={report.listing} />
      </main>
      <Footer />
    </>
  )
}
