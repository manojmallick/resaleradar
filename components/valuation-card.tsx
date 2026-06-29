import { Clock, TrendingUp, Zap, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PriceRangeBar } from '@/components/price-range-bar'
import { getPlatformConfig, formatPrice } from '@/lib/platform'
import type { PlatformValuation } from '@/lib/types'

interface ValuationCardProps {
  valuation: PlatformValuation
}

export function ValuationCard({ valuation }: ValuationCardProps) {
  const { platform, source, comparables, low, median, high, avgDaysToSell, velocityScore, isBest } =
    valuation
  const config = getPlatformConfig(platform)
  const isLive = source === 'ebay_api'

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border p-5 flex flex-col gap-4 shadow-sm transition-shadow hover:shadow-md',
        isBest
          ? 'border-[#10B981] ring-2 ring-[#10B981]/30'
          : 'border-[#d1e8de]'
      )}
    >
      {/* Platform header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', config.dotClass)}
            aria-hidden="true"
          />
          <span className="font-semibold text-[#06281E] text-sm">{config.label}</span>
        </div>

        {isBest && (
          <span className="flex items-center gap-1 bg-[#ECFDF5] text-[#10B981] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#10B981]/30">
            <Zap className="w-3 h-3" />
            Best to sell
          </span>
        )}
      </div>

      {/* Price */}
      <div>
        <p className="text-3xl font-bold text-[#06281E] leading-none">{formatPrice(median)}</p>
        <p className="text-xs text-[#6b7f78] mt-1">recommended price</p>
      </div>

      {/* Price range bar */}
      <PriceRangeBar low={low} median={median} high={high} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#F6FBF8] rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[#6b7f78] mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">Est. days to sell</span>
          </div>
          <p className="font-bold text-[#06281E] text-sm">
            {avgDaysToSell != null ? `~${avgDaysToSell}d` : 'N/A'}
          </p>
        </div>
        <div className="bg-[#F6FBF8] rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-[#6b7f78] mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-xs">Value velocity</span>
          </div>
          <p className="font-bold text-[#06281E] text-sm">${velocityScore.toFixed(0)}/day</p>
        </div>
      </div>

      {/* Footer: comps + source pill */}
      <div className="flex items-center justify-between pt-1 border-t border-[#d1e8de]">
        <span className="text-xs text-[#6b7f78]">{comparables} comps</span>
        {isLive ? (
          <span className="flex items-center gap-1 bg-[#ECFDF5] text-[#10B981] text-xs font-medium px-2 py-0.5 rounded-full">
            <Wifi className="w-3 h-3" />
            Live · eBay API
          </span>
        ) : (
          <span className="text-xs text-[#6b7f78] bg-[#F6FBF8] px-2 py-0.5 rounded-full">
            Estimated from comparables
          </span>
        )}
      </div>
    </div>
  )
}
