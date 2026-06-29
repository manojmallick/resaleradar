import Link from 'next/link'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import { formatPrice, formatCondition, formatCategory, getItemImage, getPlatformConfig } from '@/lib/platform'
import type { ItemSummary } from '@/lib/types'

interface ItemCardProps {
  item: ItemSummary
}

export function ItemCard({ item }: ItemCardProps) {
  const imageUrl = item.imageUrl ?? getItemImage(item.id)
  const config = getPlatformConfig(item.bestPlatform)

  return (
    <Link
      href={`/results/${item.id}`}
      className="group bg-white rounded-2xl border border-[#d1e8de] overflow-hidden shadow-sm hover:shadow-md hover:border-[#10B981]/50 transition-all block"
    >
      {/* Photo */}
      <div className="relative w-full aspect-square bg-[#ECFDF5]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#10B981]/30 text-sm">
            No image
          </div>
        )}
        {/* Days pill */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-semibold text-[#06281E] shadow">
          <Clock className="w-3 h-3 text-[#10B981]" />
          ~{item.estDaysToSell}d
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[#06281E] text-sm leading-snug line-clamp-2 mb-2">
          {item.title}
        </h3>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.brand && (
            <span className="text-xs text-[#6b7f78] bg-[#F6FBF8] px-2 py-0.5 rounded-full">
              {item.brand}
            </span>
          )}
          <span className="text-xs text-[#6b7f78] bg-[#F6FBF8] px-2 py-0.5 rounded-full">
            {formatCategory(item.category)}
          </span>
          <span className="text-xs text-[#6b7f78] bg-[#F6FBF8] px-2 py-0.5 rounded-full">
            {formatCondition(item.condition)}
          </span>
        </div>

        {/* Price + platform */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-[#06281E] leading-none">
              {formatPrice(item.recommendedPrice)}
            </p>
            <p className="text-xs text-[#6b7f78] mt-1 flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: config.color }}
              />
              Best on {config.label}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
