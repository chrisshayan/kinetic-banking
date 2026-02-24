/**
 * Run PostgreSQL migrations via Node (no psql required)
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://kinetic:kinetic@localhost:5432/kinetic';
const pool = new Pool({ connectionString: DATABASE_URL });

const migrations = ['001_schema.sql', '002_account_number.sql'];

async function main() {
  for (const name of migrations) {
    const path = resolve(process.cwd(), 'infra/postgres', name);
    if (!existsSync(path)) continue;
    const sql = readFileSync(path, 'utf-8');
    await pool.query(sql);
    console.log(`Ran ${name}`);
  }
  console.log('Migration complete');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
