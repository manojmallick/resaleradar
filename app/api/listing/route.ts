import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { generateListing } from '@/lib/listing';
import type { Valuation, PlatformValuation } from '@/lib/valuation';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST { itemId }
// Reuse the persisted valuation to generate an optimized, velocity-priced listing.
export async function POST(req: NextRequest) {
  try {
    const { itemId } = (await req.json()) as { itemId?: string };
    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required.' }, { status: 400 });
    }

    const itemRow = await query<{
      title: string;
      brand: string | null;
      category: string;
      condition: string;
    }>(`SELECT title, brand, category, condition FROM items WHERE id = $1`, [itemId]);
    if (itemRow.rows.length === 0) {
      return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
    }
    const item = itemRow.rows[0];

    const valRows = await query<{
      platform: string;
      source: string;
      low_price: string;
      median_price: string;
      high_price: string;
      recommended_price: string;
      avg_days_to_sell: string | null;
      velocity_score: string | null;
      comparables_count: number | null;
      is_best: boolean;
    }>(
      `SELECT platform, source, low_price, median_price, high_price, recommended_price,
              avg_days_to_sell, velocity_score, comparables_count, is_best
       FROM valuations WHERE item_id = $1 ORDER BY velocity_score DESC NULLS LAST`,
      [itemId]
    );
    if (valRows.rows.length === 0) {
      return NextResponse.json({ error: 'Value the item before generating a listing.' }, { status: 409 });
    }

    const platforms: PlatformValuation[] = valRows.rows.map((v) => ({
      platform: v.platform,
      source: v.source,
      comparables: v.comparables_count ?? 0,
      low: Number(v.low_price),
      median: Number(v.median_price),
      high: Number(v.high_price),
      avgDaysToSell: v.avg_days_to_sell != null ? Math.round(Number(v.avg_days_to_sell)) : null,
      velocityScore: Number(v.velocity_score ?? 0),
      isBest: v.is_best,
    }));
    const best = platforms.find((p) => p.isBest) ?? platforms[0];
    const valuation: Valuation = {
      platforms,
      bestPlatform: best.platform,
      recommendedPrice: Number(valRows.rows.find((v) => v.is_best)?.recommended_price ?? best.median),
      estDaysToSell: best.avgDaysToSell ?? 0,
    };

    const listing = await generateListing(item, valuation);

    await query(`DELETE FROM listings WHERE item_id = $1`, [itemId]);
    await query(
      `INSERT INTO listings
         (item_id, best_platform, title, description, suggested_price, est_days_to_sell)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        itemId,
        listing.bestPlatform,
        listing.title,
        listing.description,
        listing.suggestedPrice,
        listing.estDaysToSell,
      ]
    );

    return NextResponse.json(listing);
  } catch (err) {
    console.error('[listing]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
