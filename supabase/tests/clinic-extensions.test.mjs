import assert from 'node:assert/strict';import fs from 'node:fs';import {PGlite} from '@electric-sql/pglite';
const db=await PGlite.create();let count=0;
const ids={a:'11111111-1111-4111-8111-111111111111',b:'22222222-2222-4222-8222-222222222222',doctor:'33333333-3333-4333-8333-333333333333',reception:'44444444-4444-4444-8444-444444444444',admin:'55555555-5555-4555-8555-555555555555'};
const check=async(name,fn)=>{await fn();console.log('PASS EXT '+(++count)+': '+name);};
async function as(id){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);await db.exec(id?'set role authenticated':'set role anon');}
const denied=fn=>assert.rejects(fn,e=>e.code==='42501');
try{
 await db.exec("create role anon noinherit;create role authenticated noinherit;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}'::jsonb);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;alter default privileges in schema public grant all on tables to anon,authenticated;");
 const directory=new URL('../migrations/',import.meta.url);
 for(const name of fs.readdirSync(directory).filter(n=>n.endsWith('.sql')).sort())await db.exec(fs.readFileSync(new URL(name,directory),'utf8'));
 await check('all current migrations apply to clean PostgreSQL',async()=>{});
 for(const [name,id] of Object.entries(ids))await db.query('insert into auth.users values($1,$2)',[id,JSON.stringify({full_name:'Test '+name,phone:'0901234567'})]);
 for(const role of ['doctor','reception','admin'])await db.query('update clinic_profiles set role=$1,doctor_id=$2 where id=$3',[role,role==='doctor'?'doc-1':null,ids[role]]);
 const tables=(await db.query("select tablename from pg_tables where schemaname='public'")).rows.map(x=>x.tablename);
 if(tables.includes('clinic_family_members')){
  await as(ids.b);const family=(await db.query("insert into clinic_family_members(owner_id,full_name,relationship,bhyt_code) values($1,'Relative B','Con','TEST-BHYT') returning id",[ids.b])).rows[0];
  await check('owner can create family member and read it',async()=>assert.equal((await db.query('select id from clinic_family_members')).rows.length,1));
  await as(ids.a);
  await check('another patient cannot read family member',async()=>assert.equal((await db.query('select * from clinic_family_members')).rows.length,0));
  await check('cannot create family member for another owner',async()=>denied(()=>db.query("insert into clinic_family_members(owner_id,full_name,relationship) values($1,'Fake relative','Con')",[ids.b])));
  await check('cannot update another family member',async()=>assert.equal((await db.query("update clinic_family_members set note='Changed' where id=$1 returning id",[family.id])).rows.length,0));
  await check('cannot delete another family member',async()=>assert.equal((await db.query('delete from clinic_family_members where id=$1 returning id',[family.id])).rows.length,0));
  for(const role of ['doctor','reception','admin']){await as(ids[role]);await check(role+' has no blanket family access',async()=>assert.equal((await db.query('select * from clinic_family_members')).rows.length,0));}
  await as(null);await check('anonymous family read denied',async()=>denied(()=>db.query('select * from clinic_family_members')));
  await as(ids.b);await check('cannot transfer family ownership',async()=>denied(()=>db.query('update clinic_family_members set owner_id=$1 where id=$2',[ids.a,family.id])));
  await check('owner can edit and delete family member',async()=>{assert.equal((await db.query("update clinic_family_members set note='Owner edit' where id=$1 returning id",[family.id])).rows.length,1);assert.equal((await db.query('delete from clinic_family_members where id=$1 returning id',[family.id])).rows.length,1);});
 }
 console.log(count+' PostgreSQL extension checks passed.');
}finally{await db.close();}
