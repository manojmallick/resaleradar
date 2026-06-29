// ─────────────────────────────────────────────────────────────
// The pgvector core: find the nearest sold comparables by VISUAL similarity,
// then aggregate their prices AND their days-on-market per platform — vector
// search + relational aggregation in one Aurora statement.
//
// "Best platform" = best expected $/day (velocity), NOT highest median. The
// highest-median platform is often the slowest to sell; a listing that never
// sells is worth $0/day. That correction is ResaleRadar's differentiator.
// ─────────────────────────────────────────────────────────────
import { query, toVector } from './db';

export interface PlatformValuation {
  platform: string;
  source: string; // 'ebay_api' (live) | 'estimated'
  comparables: number;
  low: number;
  median: number;
  high: number;
  avgDaysToSell: number | null;
  velocityScore: number; // $/day
  isBest: boolean;
}

export interface Valuation {
  platforms: PlatformValuation[];
  bestPlatform: string;
  recommendedPrice: number;
  estDaysToSell: number;
}

interface Row {
  platform: string;
  source: string;
  comparables: string;
  low: string | null;
  median: string | null;
  high: string | null;
  avg_days_to_sell: string | null;
}

/** Valuate an item from its (multimodal) embedding, scoped to a category. */
export async function valuateItem(category: string, embedding: number[]): Promise<Valuation> {
  const vec = toVector(embedding);

  const result = await query<Row>(
    `SELECT platform,
            MIN(source)                                            AS source,
            COUNT(*)                                               AS comparables,
            MIN(sold_price)                                        AS low,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sold_price) AS median,
            MAX(sold_price)                                        AS high,
            AVG(EXTRACT(epoch FROM (sold_date - listed_date)) / 86400) AS avg_days_to_sell
     FROM (
       SELECT platform, source, sold_price, sold_date, listed_date
       FROM sold_comparables
       WHERE category = $1
       ORDER BY embedding <=> $2::vector   -- cosine distance to the scanned photo
       LIMIT 20
     ) nearest
     GROUP BY platform`,
    [category, vec]
  );

  const platforms: PlatformValuation[] = result.rows.map((r) => {
    const median = num(r.median);
    const days = r.avg_days_to_sell != null ? num(r.avg_days_to_sell) : null;
    return {
      platform: r.platform,
      source: r.source,
      comparables: Number(r.comparables),
      low: num(r.low),
      median,
      high: num(r.high),
      avgDaysToSell: days != null ? Math.round(days) : null,
      velocityScore: days && days > 0 ? median / days : 0,
      isBest: false,
    };
  });

  // Best = highest $/day, not highest median.
  const ranked = [...platforms].sort((a, b) => b.velocityScore - a.velocityScore);
  const best = ranked[0];
  if (best) {
    const winner = platforms.find((p) => p.platform === best.platform);
    if (winner) winner.isBest = true;
  }

  return {
    platforms: platforms.sort((a, b) => b.velocityScore - a.velocityScore),
    bestPlatform: best?.platform ?? 'ebay',
    recommendedPrice: round2(best?.median ?? 0),
    estDaysToSell: best?.avgDaysToSell ?? 0,
  };
}

function num(v: string | number | null): number {
  return v == null ? 0 : Number(v);
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
