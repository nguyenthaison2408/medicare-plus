import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import {createClient} from '@supabase/supabase-js';

export const root = path.resolve(import.meta.dirname, '../..');
function readEnv(file) {
  return Object.fromEntries(fs.readFileSync(file, 'utf8').split(/\r?\n/).map(line => line.replace(/^\uFEFF/, '').trim())
    .filter(line => line && !line.startsWith('#')).map(line => { const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1)]; }));
}
const privateEnv = readEnv(path.join(root, '.env.supabase.local'));
const clientEnv = readEnv(path.join(root, 'client/.env.local'));
export const projectUrl = clientEnv.EXPO_PUBLIC_SUPABASE_URL;
const publicKey = clientEnv.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(projectUrl ?? '') || !publicKey?.startsWith('sb_publishable_')) {
  throw new Error('A valid Supabase project URL and publishable key are required.');
}
export const newClient = () => createClient(projectUrl, publicKey, {auth: {autoRefreshToken: false, persistSession: false}});
export const adminClient = () => {
  if (!privateEnv.SUPABASE_SECRET_KEY?.startsWith('sb_secret_')) throw new Error('A server-only integration key is required.');
  return createClient(projectUrl, privateEnv.SUPABASE_SECRET_KEY, {auth: {autoRefreshToken: false, persistSession: false}});
};
export const database = () => new pg.Client({host: privateEnv.SUPABASE_DB_HOST, user: privateEnv.SUPABASE_DB_USER,
  password: privateEnv.SUPABASE_DB_PASSWORD, port: 5432, database: 'postgres', connectionTimeoutMillis: 15000,
  ssl: {rejectUnauthorized: true, ca: fs.readFileSync(path.join(root, 'supabase/certs/prod-ca-2021.crt'), 'utf8')}, query_timeout: 30000});
