// ─────────────────────────────────────────────────────────────
// Server-side data access shared by API routes AND server components.
// Each fetcher has a "*OrMock" variant that never throws — it falls back to
// lib/data.ts when Aurora isn't configured, so the UI always renders.
// ─────────────────────────────────────────────────────────────
import { query } from './db';
import { getDemoUserId } from './context';
import {
  mockItems,
  mockReport,
  type ItemSummary,
  type ItemReport,
  type PlatformValuation,
} from './data';

/** All items the demo user has scanned (dashboard grid), newest first. */
export async function listItems(): Promise<ItemSummary[]> {
  const userId = await getDemoUserId();
  const { rows } = await query<{
    id: string;
    title: string;
    brand: string | null;
    category: string;
    condition: string;
    image_url: string | null;
    identified_at: string;
    recommended_price: string | null;
    best_platform: string | null;
    est_days: string | null;
  }>(
    `SELECT i.id, i.title, i.brand, i.category, i.condition, i.image_url, i.identified_at,
            v.recommended_price,
            v.platform        AS best_platform,
            v.avg_days_to_sell AS est_days
     FROM items i
     LEFT JOIN LATERAL (
       SELECT recommended_price, platform, avg_days_to_sell
       FROM valuations
       WHERE item_id = i.id AND is_best = true
       ORDER BY valued_at DESC
       LIMIT 1
     ) v ON true
     WHERE i.user_id = $1
     ORDER BY i.identified_at DESC`,
    [userId]
  );

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    brand: r.brand,
    category: r.category,
    condition: r.condition,
    imageUrl: r.image_url,
    recommendedPrice: r.recommended_price ? Number(r.recommended_price) : 0,
    bestPlatform: r.best_platform ?? 'ebay',
    estDaysToSell: r.est_days ? Math.round(Number(r.est_days)) : 0,
    scannedAt: new Date(r.identified_at).toISOString(),
  }));
}

/** Full report for one scanned item: identification + per-platform valuation + listing. */
export async function getReport(itemId: string): Promise<ItemReport | null> {
  const item = await query<{
    id: string;
    title: string;
    brand: string | null;
    category: string;
    condition: string;
    image_url: string | null;
    identified_at: string;
  }>(
    `SELECT id, title, brand, category, condition, image_url, identified_at
     FROM items WHERE id = $1`,
    [itemId]
  );
  if (item.rows.length === 0) return null;
  const it = item.rows[0];

  const vals = await query<{
    platform: string;
    source: string | null;
    low_price: string | null;
    median_price: string | null;
    high_price: string | null;
    recommended_price: string | null;
    avg_days_to_sell: string | null;
    velocity_score: string | null;
    comparables_count: number | null;
    is_best: boolean;
  }>(
    `SELECT platform, source, low_price, median_price, high_price, recommended_price,
            avg_days_to_sell, velocity_score, comparables_count, is_best
     FROM valuations WHERE item_id = $1
     ORDER BY velocity_score DESC NULLS LAST`,
    [itemId]
  );

  const platforms: PlatformValuation[] = vals.rows.map((v) => ({
    platform: v.platform,
    source: v.source ?? 'estimated',
    comparables: v.comparables_count ?? 0,
    low: Number(v.low_price ?? 0),
    median: Number(v.median_price ?? 0),
    high: Number(v.high_price ?? 0),
    avgDaysToSell: v.avg_days_to_sell != null ? Math.round(Number(v.avg_days_to_sell)) : null,
    velocityScore: Number(v.velocity_score ?? 0),
    isBest: v.is_best,
  }));

  const best = platforms.find((p) => p.isBest) ?? platforms[0];

  const listingRow = await query<{
    best_platform: string | null;
    title: string | null;
    description: string | null;
    suggested_price: string | null;
    est_days_to_sell: number | null;
  }>(
    `SELECT best_platform, title, description, suggested_price, est_days_to_sell
     FROM listings WHERE item_id = $1 ORDER BY generated_at DESC LIMIT 1`,
    [itemId]
  );
  const l = listingRow.rows[0];

  return {
    id: it.id,
    title: it.title,
    brand: it.brand,
    category: it.category,
    condition: it.condition,
    imageUrl: it.image_url,
    scannedAt: new Date(it.identified_at).toISOString(),
    platforms,
    bestPlatform: best?.platform ?? 'ebay',
    recommendedPrice: best ? best.median : 0,
    estDaysToSell: best?.avgDaysToSell ?? 0,
    listing: l
      ? {
          bestPlatform: l.best_platform ?? best?.platform ?? 'ebay',
          title: l.title ?? it.title,
          description: l.description ?? '',
          suggestedPrice: Number(l.suggested_price ?? 0),
          estDaysToSell: l.est_days_to_sell ?? best?.avgDaysToSell ?? 0,
        }
      : null,
  };
}

// ── Safe variants for server components: never throw, fall back to mock ──

export async function getItemsOrMock(): Promise<{ data: ItemSummary[]; live: boolean }> {
  try {
    const data = await listItems();
    return { data, live: true };
  } catch {
    return { data: mockItems, live: false };
  }
}

export async function getReportOrMock(
  itemId: string
): Promise<{ data: ItemReport; live: boolean }> {
  try {
    const data = await getReport(itemId);
    if (data) return { data, live: true };
    return { data: mockReport, live: false }; // not found -> show mock so the demo route renders
  } catch {
    return { data: mockReport, live: false };
  }
}
