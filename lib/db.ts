// ─────────────────────────────────────────────────────────────
// Aurora PostgreSQL connection (pgvector-enabled).
// Two auth modes, auto-detected:
//   1. IAM/OIDC  — Vercel Aurora Marketplace integration. No static password:
//      the DB password is a short-lived RDS IAM auth token signed via the
//      project's Vercel OIDC federation. Env: PGHOST/PGPORT/PGUSER/PGDATABASE/
//      AWS_REGION/AWS_ROLE_ARN. (This is the hackathon-rewarded, credential-less path.)
//   2. DATABASE_URL — a plain connection string (local Postgres / generic).
// A single pooled client is reused across hot Function invocations.
// ─────────────────────────────────────────────────────────────
import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { Signer } from '@aws-sdk/rds-signer';
import { awsCredentialsProvider } from '@vercel/oidc-aws-credentials-provider';

declare global {
  // eslint-disable-next-line no-var
  var __resaleradarPool: Pool | undefined;
}

function makePool(): Pool {
  // ── Mode 1: IAM/OIDC (Vercel Aurora integration) ──
  const host = process.env.PGHOST;
  const roleArn = process.env.AWS_ROLE_ARN;
  const user = process.env.PGUSER;
  if (host && roleArn && user) {
    const port = Number(process.env.PGPORT ?? 5432);
    const region = process.env.AWS_REGION;
    const signer = new Signer({
      hostname: host,
      port,
      username: user,
      region,
      credentials: awsCredentialsProvider({ roleArn, clientConfig: { region } }),
    });
    return new Pool({
      host,
      port,
      user,
      database: process.env.PGDATABASE || 'postgres',
      password: () => signer.getAuthToken(), // fresh IAM token per connection
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    });
  }

  // ── Mode 2: DATABASE_URL ──
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'No database configured. Connect the Vercel Aurora integration (PGHOST/AWS_ROLE_ARN) or set DATABASE_URL in .env.local.'
    );
  }
  const ssl = process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false };
  return new Pool({
    connectionString,
    ssl,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

/**
 * Lazily create + reuse the pool. Importing this module must NOT throw when
 * DATABASE_URL is unset (so builds and mock-fallback paths work); the error is
 * raised only when a query actually runs.
 */
export function getPool(): Pool {
  if (!global.__resaleradarPool) global.__resaleradarPool = makePool();
  return global.__resaleradarPool;
}

/** Parameterized query helper. Always use $1, $2… placeholders — never string interpolation. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params as never[]);
}

/** Run a set of statements inside a single ACID transaction. */
export async function withTransaction<T>(fn: (q: typeof query) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  const scopedQuery = ((text: string, params: unknown[] = []) =>
    client.query(text, params as never[])) as typeof query;
  try {
    await client.query('BEGIN');
    const result = await fn(scopedQuery);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Format a JS number[] as a pgvector literal: [0.1,0.2,...] */
export function toVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
