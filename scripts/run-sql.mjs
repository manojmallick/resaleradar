// Run a .sql file against the configured database.
// Usage: node --env-file=.env.local scripts/run-sql.mjs db/schema.sql
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPool } from './db.mjs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/run-sql.mjs <path-to.sql>');
  process.exit(1);
}

const sql = readFileSync(resolve(file), 'utf8');
const pool = createPool();

try {
  await pool.query(sql);
  console.log(`✓ Applied ${file}`);
} catch (err) {
  console.error(`✗ Failed applying ${file}:`, err.message);
  process.exit(1);
} finally {
  await pool.end();
}
