import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { valuateItem } from '@/lib/valuation';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST { itemId }
// Load the item's stored multimodal embedding → pgvector comparable search +
// velocity-aware aggregation → persist one valuation row per platform.
export async function POST(req: NextRequest) {
  try {
    const { itemId } = (await req.json()) as { itemId?: string };
    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required.' }, { status: 400 });
    }

    const row = await query<{ category: string; embedding: string }>(
      `SELECT i.category, e.embedding::text AS embedding
       FROM items i
       JOIN item_embeddings e ON e.item_id = i.id
       WHERE i.id = $1
       ORDER BY e.created_at DESC
       LIMIT 1`,
      [itemId]
    );
    if (row.rows.length === 0) {
      return NextResponse.json({ error: 'Item or embedding not found.' }, { status: 404 });
    }
    const { category } = row.rows[0];
    // pgvector text form "[..]" → number[] for valuateItem (which re-serializes it).
    const embedding = JSON.parse(row.rows[0].embedding) as number[];

    const valuation = await valuateItem(category, embedding);

    // Replace any prior valuation for this item, then persist the fresh one.
    await query(`DELETE FROM valuations WHERE item_id = $1`, [itemId]);
    for (const p of valuation.platforms) {
      await query(
        `INSERT INTO valuations
           (item_id, platform, source, low_price, median_price, high_price,
            recommended_price, avg_days_to_sell, velocity_score, comparables_count, is_best)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          itemId,
          p.platform,
          p.source,
          p.low,
          p.median,
          p.high,
          p.isBest ? valuation.recommendedPrice : p.median,
          p.avgDaysToSell,
          p.velocityScore,
          p.comparables,
          p.isBest,
        ]
      );
    }

    return NextResponse.json(valuation);
  } catch (err) {
    console.error('[value]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
