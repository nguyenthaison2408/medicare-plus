import {database} from './cloud-config.mjs';
const db=database();
try {
  await db.connect();
  for(const [name,sql] of Object.entries({
    publications:"select pubname,schemaname,tablename from pg_publication_tables where pubname='supabase_realtime'",
    replication:"select slot_name,plugin,active from pg_replication_slots",
    grants:"select grantee,table_name,privilege_type from information_schema.role_table_grants where table_schema='public' and table_name like 'clinic_%' and grantee in ('anon','authenticated')",
    policies:"select schemaname,tablename,policyname,roles,cmd,qual from pg_policies where tablename like 'clinic_%'"
  })) console.log(JSON.stringify({name,rows:(await db.query(sql)).rows}));
} finally {await db.end();}
