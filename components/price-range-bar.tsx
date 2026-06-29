import { formatPrice } from '@/lib/platform'

interface PriceRangeBarProps {
  low: number
  median: number
  high: number
}

export function PriceRangeBar({ low, median, high }: PriceRangeBarProps) {
  const range = high - low
  const medianPct = range === 0 ? 50 : ((median - low) / range) * 100

  return (
    <div className="w-full">
      {/* Bar */}
      <div className="relative h-2.5 rounded-full bg-[#ECFDF5] overflow-visible mb-4">
        {/* Gradient fill from low to high */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#6EE7B7] to-[#10B981]" />
        {/* Median marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#06281E] border-2 border-white shadow-md z-10"
          style={{ left: `calc(${medianPct}% - 7px)` }}
          aria-label={`Median price: ${formatPrice(median)}`}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-[#6b7f78]">
        <span>{formatPrice(low)}</span>
        <span className="font-semibold text-[#06281E]">{formatPrice(median)} median</span>
        <span>{formatPrice(high)}</span>
      </div>
    </div>
  )
}
