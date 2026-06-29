// ─────────────────────────────────────────────────────────────
// Single-tenant demo context. A real app would resolve the user from auth;
// here we lazily ensure one demo user exists and cache its id per warm
// Function instance. ORG-style multi-tenancy is out of scope for the demo.
// ─────────────────────────────────────────────────────────────
import { query } from './db';

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? 'demo@resaleradar.app';

declare global {
  // eslint-disable-next-line no-var
  var __resaleradarDemoUserId: string | undefined;
}

/** Get (or create) the demo user's id. Throws if the DB isn't reachable. */
export async function getDemoUserId(): Promise<string> {
  if (global.__resaleradarDemoUserId) return global.__resaleradarDemoUserId;
  const res = await query<{ id: string }>(
    `INSERT INTO users (email, name, subscription_tier)
     VALUES ($1, 'Demo Seller', 'pro')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [DEMO_EMAIL]
  );
  global.__resaleradarDemoUserId = res.rows[0].id;
  return global.__resaleradarDemoUserId;
}
