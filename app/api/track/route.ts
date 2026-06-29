import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getDemoUserId } from '@/lib/context';

export const runtime = 'nodejs';

// POST { itemId, targetPrice? } — add/update an item on the price watchlist.
export async function POST(req: NextRequest) {
  try {
    const { itemId, targetPrice } = (await req.json()) as {
      itemId?: string;
      targetPrice?: number;
    };
    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required.' }, { status: 400 });
    }
    const userId = await getDemoUserId();
    await query(
      `INSERT INTO price_watches (user_id, item_id, target_price)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, item_id) DO UPDATE SET target_price = EXCLUDED.target_price`,
      [userId, itemId, targetPrice ?? null]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[track]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
