// Shared DB pool for node scripts (run-sql, seed). Mirrors lib/db.ts:
//  - IAM/OIDC mode (Vercel Aurora integration) when PGHOST + AWS_ROLE_ARN set.
//    Locally this needs VERCEL_OIDC_TOKEN (pulled via `vercel env pull .env.local`).
//  - DATABASE_URL mode otherwise.
import pg from 'pg';
import { Signer } from '@aws-sdk/rds-signer';
import { awsCredentialsProvider } from '@vercel/oidc-aws-credentials-provider';

export function createPool() {
  if (process.env.PGHOST && process.env.AWS_ROLE_ARN) {
    const signer = new Signer({
      hostname: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      username: process.env.PGUSER,
      region: process.env.AWS_REGION,
      credentials: awsCredentialsProvider({
        roleArn: process.env.AWS_ROLE_ARN,
        clientConfig: { region: process.env.AWS_REGION },
      }),
    });
    return new pg.Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT ?? 5432),
      user: process.env.PGUSER,
      database: process.env.PGDATABASE || 'postgres',
      password: () => signer.getAuthToken(),
      ssl: { rejectUnauthorized: false },
      max: 3,
      connectionTimeoutMillis: 15_000,
    });
  }

  if (!process.env.DATABASE_URL) {
    console.error(
      'No DB configured. Run `vercel env pull .env.local` (Aurora integration) or set DATABASE_URL in .env.local.'
    );
    process.exit(1);
  }
  const ssl = process.env.PGSSLMODE === 'disable' ? undefined : { rejectUnauthorized: false };
  return new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl, max: 3 });
}
