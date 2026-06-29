// ─────────────────────────────────────────────────────────────
// NO-AWS local seed. Populates a real Aurora/Postgres + pgvector DB WITHOUT
// Bedrock, so the app is fully demoable offline (e.g. when Bedrock on-demand is
// throttled). Embeddings are DETERMINISTIC pseudo-vectors derived from each
// caption — valid vector(1024) values that make pgvector search + the velocity
// aggregation run for real. Swap to scripts/seed.mjs once Bedrock is available
// for true multimodal embeddings.
//
// Usage: node --env-file=.env.local scripts/seed-local.mjs
import { randomUUID } from 'node:crypto';
import { COMPARABLES } from '../db/comparables.mjs';
import { createPool } from './db.mjs';

const DIM = Number(process.env.EMBED_DIM ?? 1024);

// ── deterministic embedding: caption -> stable unit vector(DIM) ──
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Category seed biases same-category vectors to cluster (nearest-neighbour sane).
const CAT_SEED = { sneakers: 11, handbags: 23, apparel: 37, watches: 41, electronics: 53, home: 61, toys: 71, other: 83 };
function embedFor(caption, category) {
  const base = mulberry32(hashStr(caption));
  const catBias = mulberry32((CAT_SEED[category] ?? 83) * 2654435761);
  const v = new Array(DIM);
  let norm = 0;
  for (let i = 0; i < DIM; i++) {
    // 70% caption signal + 30% category cluster signal
    const x = 0.7 * (base() * 2 - 1) + 0.3 * (catBias() * 2 - 1);
    v[i] = x;
    norm += x * x;
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < DIM; i++) v[i] /= norm;
  return v;
}
const toVector = (arr) => `[${arr.join(',')}]`;
const DAY = 86_400_000;
const isoDate = (offsetDays) => new Date(Date.now() - offsetDays * DAY).toISOString().slice(0, 10);

// ── demo items (match public/items/*.png + lib/platform.getItemImage) ──
const ITEMS = [
  {
    title: 'Nike Air Jordan 1 Retro High OG "Chicago"',
    brand: 'Nike', category: 'sneakers', condition: 'like_new',
    image: '/items/jordan-chicago.png', daysAgo: 2,
    listing:
      'Iconic colorway in exceptional condition. These "Chicago" 1s have been worn twice indoors and show zero creasing, no sole yellowing, and clean toe boxes throughout. Laces are original and untied.\n\nAuthenticity guaranteed. Ships same day in original box with tissue and receipt. No trades.',
  },
  {
    title: 'Louis Vuitton Neverfull MM Monogram Tote',
    brand: 'Louis Vuitton', category: 'handbags', condition: 'good',
    image: '/items/lv-neverfull.png', daysAgo: 4,
    listing:
      'Authentic Louis Vuitton Neverfull MM in classic monogram canvas. Even honey patina on the leather trim, clean interior, all hardware intact. A timeless everyday tote that holds its value.\n\nComes with the original removable pouch. Authenticity guaranteed — date code present. Ships fully insured.',
  },
  {
    title: 'Carhartt Detroit Blanket-Lined Jacket',
    brand: 'Carhartt', category: 'apparel', condition: 'good',
    image: '/items/carhartt-jacket.png', daysAgo: 6,
    listing:
      'Broken-in Carhartt Detroit jacket with the signature blanket lining — the workwear staple resellers chase. Honest fading and a great vintage hand-feel, no rips, corduroy collar solid, all snaps functional.\n\nTrue to a unisex medium. Ships rolled to keep the lining fresh.',
  },
];

const client = createPool();

try {
  console.log('Seeding (local, no Bedrock)…');
  // clear in FK-safe order
  for (const t of ['listings', 'price_watches', 'valuations', 'item_embeddings', 'sold_comparables', 'items', 'users']) {
    await client.query(`DELETE FROM ${t}`);
  }

  // demo user
  const { rows: u } = await client.query(
    `INSERT INTO users (email, name, subscription_tier) VALUES ($1,$2,'pro') RETURNING id`,
    [process.env.DEMO_USER_EMAIL ?? 'demo@resaleradar.app', 'Demo Seller']
  );
  const userId = u[0].id;

  // comparables
  for (const c of COMPARABLES) {
    const caption = `${c.title}. ${c.brand} ${c.category} ${c.condition}`;
    const vec = toVector(embedFor(caption, c.category));
    await client.query(
      `INSERT INTO sold_comparables
         (platform, source, title, brand, category, condition, sold_price, listed_date, sold_date, embedding)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::vector)`,
      [c.platform, c.source, c.title, c.brand, c.category, c.condition, c.sold_price,
       isoDate(c.daysAgo + c.days), isoDate(c.daysAgo), vec]
    );
  }
  console.log(`  ✓ ${COMPARABLES.length} sold_comparables`);

  // items + embeddings + valuations + listings
  for (const it of ITEMS) {
    const itemId = randomUUID();
    await client.query(
      `INSERT INTO items (id, user_id, title, brand, category, condition, image_url, identified_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, now() - ($8 || ' days')::interval)`,
      [itemId, userId, it.title, it.brand, it.category, it.condition, it.image, String(it.daysAgo)]
    );
    const vec = toVector(embedFor(`${it.title}. ${it.brand} ${it.category} ${it.condition}`, it.category));
    await client.query(
      `INSERT INTO item_embeddings (item_id, embedding) VALUES ($1, $2::vector)`,
      [itemId, vec]
    );

    // same aggregation the live /api/value uses: nearest 20 comps in category, per platform
    const { rows: agg } = await client.query(
      `SELECT platform, MIN(source) AS source, COUNT(*) AS comparables,
              MIN(sold_price) AS low,
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sold_price) AS median,
              MAX(sold_price) AS high,
              AVG(sold_date - listed_date) AS avg_days   -- DATE - DATE = integer days
       FROM (
         SELECT platform, source, sold_price, sold_date, listed_date
         FROM sold_comparables WHERE category = $1
         ORDER BY embedding <=> $2::vector LIMIT 20
       ) nearest
       GROUP BY platform`,
      [it.category, vec]
    );

    const platforms = agg.map((r) => {
      const median = Number(r.median);
      const days = r.avg_days != null ? Number(r.avg_days) : null;
      return {
        platform: r.platform, source: r.source, comparables: Number(r.comparables),
        low: Number(r.low), median, high: Number(r.high),
        avgDays: days != null ? Math.round(days) : null,
        velocity: days && days > 0 ? median / days : 0,
      };
    });
    const best = [...platforms].sort((a, b) => b.velocity - a.velocity)[0];

    for (const p of platforms) {
      const isBest = best && p.platform === best.platform;
      await client.query(
        `INSERT INTO valuations
           (item_id, platform, source, low_price, median_price, high_price,
            recommended_price, avg_days_to_sell, velocity_score, comparables_count, is_best)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [itemId, p.platform, p.source, p.low, p.median, p.high,
         isBest ? best.median : p.median, p.avgDays, p.velocity.toFixed(3), p.comparables, isBest]
      );
    }

    await client.query(
      `INSERT INTO listings (item_id, best_platform, title, description, suggested_price, est_days_to_sell)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [itemId, best?.platform ?? 'ebay',
       `${it.title} — ${it.condition.replace('_', ' ')}`, it.listing,
       best ? Number(best.median.toFixed(2)) : 0, best?.avgDays ?? 0]
    );

    console.log(`  ✓ ${it.title}  → best on ${best?.platform} @ $${best?.median} (~${best?.avgDays}d)`);
  }

  console.log('\n✓ Local seed complete — DB is live and demoable without Bedrock.');
} catch (err) {
  console.error('\n✗ Local seed failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
