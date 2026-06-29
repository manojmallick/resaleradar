export const PLATFORM_CONFIG: Record<
  string,
  { label: string; color: string; dotClass: string; bgClass: string }
> = {
  ebay: {
    label: 'eBay',
    color: '#2563EB',
    dotClass: 'bg-[#2563EB]',
    bgClass: 'bg-[#EFF6FF]',
  },
  poshmark: {
    label: 'Poshmark',
    color: '#DB2777',
    dotClass: 'bg-[#DB2777]',
    bgClass: 'bg-[#FDF2F8]',
  },
  depop: {
    label: 'Depop',
    color: '#DC2626',
    dotClass: 'bg-[#DC2626]',
    bgClass: 'bg-[#FEF2F2]',
  },
}

export function getPlatformConfig(platform: string) {
  return (
    PLATFORM_CONFIG[platform.toLowerCase()] ?? {
      label: platform,
      color: '#6b7280',
      dotClass: 'bg-gray-500',
      bgClass: 'bg-gray-50',
    }
  )
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)
}

export function formatCondition(condition: string) {
  const map: Record<string, string> = {
    new: 'New',
    like_new: 'Like New',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  }
  return map[condition] ?? condition
}

export function formatCategory(category: string) {
  const map: Record<string, string> = {
    sneakers: 'Sneakers',
    handbags: 'Handbags',
    apparel: 'Apparel',
    watches: 'Watches',
    electronics: 'Electronics',
    home: 'Home',
    toys: 'Toys',
    other: 'Other',
  }
  return map[category] ?? category
}

export function getItemImage(id: string): string | null {
  const map: Record<string, string> = {
    'jordan-chicago-001': '/items/jordan-chicago.png',
    'lv-neverfull-002': '/items/lv-neverfull.png',
    'carhartt-detroit-003': '/items/carhartt-jacket.png',
  }
  return map[id] ?? null
}
