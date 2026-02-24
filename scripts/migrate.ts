/**
 * Run PostgreSQL migrations via Node (no psql required)
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://kinetic:kinetic@localhost:5432/kinetic';
const pool = new Pool({ connectionString: DATABASE_URL });

const sql = readFileSync(resolve(process.cwd(), 'infra/postgres/001_schema.sql'), 'utf-8');

async function main() {
  await pool.query(sql);
  console.log('Migration complete');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
