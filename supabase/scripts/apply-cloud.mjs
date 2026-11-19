import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';

const root = path.resolve(import.meta.dirname, '../..');
const env = Object.fromEntries(fs.readFileSync(path.join(root, '.env.supabase.local'), 'utf8').split(/\r?\n/)
  .filter(line => line && !line.startsWith('#')).map(line => { const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1)]; }));
if (!env.SUPABASE_DB_HOST?.endsWith('.pooler.supabase.com') || !env.SUPABASE_DB_USER || !env.SUPABASE_DB_PASSWORD) {
  throw new Error('Configure the project Session pooler host, user and password in .env.supabase.local.');
}
const client = new pg.Client({host: env.SUPABASE_DB_HOST, port: 5432, database: 'postgres',
  user: env.SUPABASE_DB_USER, password: env.SUPABASE_DB_PASSWORD,
  ssl: {rejectUnauthorized: true, ca: fs.readFileSync(path.join(root, 'supabase/certs/prod-ca-2021.crt'), 'utf8')}, connectionTimeoutMillis: 15000, query_timeout: 30000});
try {
  await client.connect();
  const {rows: [existing]} = await client.query("select to_regclass('public.clinic_doctors') as table_name");
  if (existing.table_name) throw new Error('Clinic tables already exist. Inspect migration history; this initializer only runs on a new project.');
  const name = '202611190001_clinic_core.sql';
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations', name), 'utf8').replace(/\r\n/g, '\n');
  await client.query(sql);
  await client.query('create table clinic_private.schema_migrations (name text primary key, sha256 text not null, applied_at timestamptz not null default now())');
  await client.query('insert into clinic_private.schema_migrations(name,sha256) values($1,$2)', [name, crypto.createHash('sha256').update(sql).digest('hex')]);
  const {rows} = await client.query("select tablename, rowsecurity from pg_tables where schemaname='public' and tablename like 'clinic_%' order by tablename");
  console.log(JSON.stringify({migration: name, tables: rows, status: 'applied'}, null, 2));
} catch (error) {
  console.error(JSON.stringify({code: error.code ?? 'SETUP_FAILED', message: error.message}));
  process.exitCode = 1;
} finally { await client.end(); }
