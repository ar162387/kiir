import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Password goes through the subprocess environment, never command arguments/logs.
const connection = process.env.SUPABASE_DB_POOLER_URL;
if (!connection || !process.env.SUPABASE_DATABASE_PASSWORD) {
  throw new Error('Set SUPABASE_DB_POOLER_URL (without password) and SUPABASE_DATABASE_PASSWORD.');
}
const url = new URL(connection);
url.password = '';
url.searchParams.set('sslmode', 'require');
url.searchParams.set('connect_timeout', '10');
const file = process.argv[2];
const sql = file ? readFileSync(file, 'utf8') : `
  select table_schema, table_name from information_schema.tables
  where table_schema in ('public', 'cms_private', 'supabase_migrations') order by 1,2;
`;
const result = spawnSync('psql', ['-X', '--no-password', '-v', 'ON_ERROR_STOP=1', url.toString()], {
  input: sql, encoding: 'utf8',
  env: { ...process.env, PGPASSWORD: process.env.SUPABASE_DATABASE_PASSWORD },
});
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');
process.exit(result.status ?? 1);
