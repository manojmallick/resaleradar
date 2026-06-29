// ─────────────────────────────────────────────────────────────
// Shared view types + mock data. Every server fetcher falls back to this when
// Aurora/Bedrock aren't configured, so the UI always renders for demos.
// ─────────────────────────────────────────────────────────────
import type { PlatformValuation } from './valuation';

export type { PlatformValuation };

export interface ItemSummary {
  id: string;
  title: string;
  brand: string | null;
  category: string;
  condition: string;
  imageUrl: string | null;
  recommendedPrice: number;
  bestPlatform: string;
  estDaysToSell: number;
  scannedAt: string; // ISO
}

export interface ListingView {
  bestPlatform: string;
  title: string;
  description: string;
  suggestedPrice: number;
  estDaysToSell: number;
}

export interface ItemReport {
  id: string;
  title: string;
  brand: string | null;
  category: string;
  condition: string;
  imageUrl: string | null;
  scannedAt: string;
  platforms: PlatformValuation[];
  bestPlatform: string;
  recommendedPrice: number;
  estDaysToSell: number;
  listing: ListingView | null;
}

// ── Mock data (demo fallback) ──────────────────────────────────
// IDs match lib/platform.ts getItemImage(), so the demo shows real photos.

export const mockItems: ItemSummary[] = [
  {
    id: 'jordan-chicago-001',
    title: 'Nike Air Jordan 1 Retro High OG "Chicago"',
    brand: 'Nike',
    category: 'sneakers',
    condition: 'like_new',
    imageUrl: null,
    recommendedPrice: 178,
    bestPlatform: 'ebay',
    estDaysToSell: 6,
    scannedAt: '2026-06-27T15:12:00.000Z',
  },
  {
    id: 'lv-neverfull-002',
    title: 'Louis Vuitton Neverfull MM Monogram Tote',
    brand: 'Louis Vuitton',
    category: 'handbags',
    condition: 'good',
    imageUrl: null,
    recommendedPrice: 820,
    bestPlatform: 'poshmark',
    estDaysToSell: 11,
    scannedAt: '2026-06-26T19:40:00.000Z',
  },
  {
    id: 'carhartt-detroit-003',
    title: 'Carhartt Detroit Blanket-Lined Jacket',
    brand: 'Carhartt',
    category: 'apparel',
    condition: 'good',
    imageUrl: null,
    recommendedPrice: 94,
    bestPlatform: 'depop',
    estDaysToSell: 9,
    scannedAt: '2026-06-25T11:05:00.000Z',
  },
];

const mockPlatforms: PlatformValuation[] = [
  {
    platform: 'ebay',
    source: 'ebay_api',
    comparables: 47,
    low: 145,
    median: 178,
    high: 220,
    avgDaysToSell: 6,
    velocityScore: 178 / 6,
    isBest: true,
  },
  {
    platform: 'poshmark',
    source: 'estimated',
    comparables: 31,
    low: 160,
    median: 195,
    high: 240,
    avgDaysToSell: 18,
    velocityScore: 195 / 18,
    isBest: false,
  },
  {
    platform: 'depop',
    source: 'estimated',
    comparables: 22,
    low: 135,
    median: 170,
    high: 205,
    avgDaysToSell: 12,
    velocityScore: 170 / 12,
    isBest: false,
  },
];

export const mockReport: ItemReport = {
  id: 'jordan-chicago-001',
  title: 'Nike Air Jordan 1 Retro High OG "Chicago"',
  brand: 'Nike',
  category: 'sneakers',
  condition: 'like_new',
  imageUrl: null,
  scannedAt: '2026-06-27T15:12:00.000Z',
  platforms: mockPlatforms,
  bestPlatform: 'ebay',
  recommendedPrice: 178,
  estDaysToSell: 6,
  listing: {
    bestPlatform: 'ebay',
    title: 'Nike Air Jordan 1 Retro High OG "Chicago" — Size 10 — Like New, No Box Yellowing',
    description:
      'Iconic colorway in exceptional condition. These "Chicago" 1s have been worn twice indoors and show zero creasing, no sole yellowing, and clean toe boxes throughout. Laces are original and untied — no replacement needed.\n\nAuthenticity guaranteed. Ships same day in original box with tissue and receipt. Sole checked under UV. No trades.',
    suggestedPrice: 178,
    estDaysToSell: 6,
  },
};
