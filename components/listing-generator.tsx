'use client'

import { useState } from 'react'
import { Sparkles, Copy, Check, RefreshCw, Loader2 } from 'lucide-react'
import { getPlatformConfig, formatPrice } from '@/lib/platform'
import type { ListingView } from '@/lib/types'

interface ListingGeneratorProps {
  itemId: string
  initialListing: ListingView | null
}

export function ListingGenerator({ itemId, initialListing }: ListingGeneratorProps) {
  const [listing, setListing] = useState<ListingView | null>(initialListing)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/listing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not generate a listing.')
      setListing(json as ListingView)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!listing) return
    const text = `${listing.title}\n\n${listing.description}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const platformConfig = listing ? getPlatformConfig(listing.bestPlatform) : null

  return (
    <div className="bg-white rounded-2xl border border-[#d1e8de] p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] flex items-center justify-center">
          <Sparkles className="w-4.5 h-4.5 text-[#10B981]" />
        </div>
        <h2 className="font-serif text-xl font-semibold text-[#06281E]">Auto-generated listing</h2>
      </div>

      {!listing && !generating && (
        /* Empty state */
        <div className="flex flex-col items-center text-center py-8 gap-4">
          <p className="text-[#6b7f78] text-sm max-w-sm leading-relaxed">
            We&apos;ll write a keyword-rich, honest title and description tailored to the best platform
            — ready to paste in under a second.
          </p>
          <button
            onClick={handleGenerate}
            className="bg-[#10B981] hover:bg-[#34D399] text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
          >
            Generate listing
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {generating && (
        <div className="flex flex-col items-center text-center py-10 gap-3">
          <Loader2 className="w-8 h-8 text-[#10B981] animate-spin" />
          <p className="text-[#06281E] font-medium text-sm">Writing your listing&hellip;</p>
        </div>
      )}

      {listing && !generating && (
        /* Filled state */
        <div className="flex flex-col gap-5">
          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {platformConfig && (
              <span
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border"
                style={{
                  color: platformConfig.color,
                  borderColor: platformConfig.color + '40',
                  backgroundColor: platformConfig.color + '10',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: platformConfig.color }}
                />
                Best on {platformConfig.label}
              </span>
            )}
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#ECFDF5] text-[#10B981] border border-[#10B981]/30">
              {formatPrice(listing.suggestedPrice)}
            </span>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#F6FBF8] text-[#6b7f78] border border-[#d1e8de]">
              ~{listing.estDaysToSell} days
            </span>
          </div>

          {/* Listing text */}
          <div className="border border-[#d1e8de] rounded-xl p-4 bg-[#F6FBF8]">
            <p className="font-semibold text-[#06281E] text-sm mb-3 leading-snug">{listing.title}</p>
            <div className="space-y-3">
              {listing.description.split('\n').map((para, i) => (
                <p key={i} className="text-[#6b7f78] text-sm leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-[#06281E] hover:bg-[#0a3828] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 border border-[#d1e8de] text-[#06281E] text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-[#ECFDF5] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
