import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const connectionString = process.env.CSM_DATABASE_URL;
if (!connectionString) throw new Error('CSM_DATABASE_URL is required');

const pool = new pg.Pool({ connectionString, max: 2 });
const migrationPath = fileURLToPath(new URL('./migrations/001_corporate_sites.sql', import.meta.url));

try {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(1843294411)');
    await client.query('CREATE TABLE IF NOT EXISTS csm_schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    const applied = await client.query('SELECT 1 FROM csm_schema_migrations WHERE version = 1');
    if (!applied.rowCount) {
      await client.query(await readFile(migrationPath, 'utf8'));
      await client.query('INSERT INTO csm_schema_migrations (version) VALUES (1)');
    }
    await client.query('COMMIT');
    process.stdout.write('CSM migration 001 ready\n');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
