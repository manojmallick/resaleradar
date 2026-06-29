import Link from 'next/link'
import { Package, Plus } from 'lucide-react'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { ItemCard } from '@/components/item-card'
import { getItemsOrMock } from '@/lib/queries'
import { formatPrice } from '@/lib/platform'

export default async function DashboardPage() {
  const { data: items } = await getItemsOrMock()
  const totalValue = items.reduce((sum, item) => sum + item.recommendedPrice, 0)
  const isEmpty = items.length === 0

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#06281E]">
              Your closet
            </h1>
            {!isEmpty && (
              <p className="text-[#6b7f78] mt-1">
                {items.length} item{items.length !== 1 ? 's' : ''} &middot; estimated total value{' '}
                <span className="font-semibold text-[#06281E]">{formatPrice(totalValue)}</span>
              </p>
            )}
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#34D399] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Scan a new item
          </Link>
        </div>

        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center text-center py-28 gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] border border-[#d1e8de] flex items-center justify-center">
              <Package className="w-8 h-8 text-[#10B981]/50" />
            </div>
            <div>
              <p className="font-serif text-xl font-semibold text-[#06281E] mb-1">
                Nothing scanned yet
              </p>
              <p className="text-[#6b7f78] text-sm max-w-xs">
                Snap a photo of any item to see its market value across eBay, Poshmark, and Depop.
              </p>
            </div>
            <Link
              href="/"
              className="bg-[#10B981] hover:bg-[#34D399] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
            >
              Scan your first item
            </Link>
          </div>
        ) : (
          /* Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
