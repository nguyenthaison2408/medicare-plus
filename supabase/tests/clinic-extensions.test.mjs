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
 if(tables.includes('clinic_medicine_cabinet')){
  await as(ids.a);
  const medicine=(await db.query("insert into clinic_medicine_cabinet(owner_id,medicine_name,owner_label,stock_label,expiry_label,urgent) values($1,'Test medicine 500mg','Test a','Còn 10 / 20 viên','HSD: 12/2027',true) returning id",[ids.a])).rows[0];
  await check('patient can create and read own medicine',async()=>assert.equal((await db.query('select id from clinic_medicine_cabinet')).rows.length,1));
  await as(ids.b);
  await check('another patient cannot read medicine cabinet',async()=>assert.equal((await db.query('select * from clinic_medicine_cabinet')).rows.length,0));
  await check('cannot create cabinet medicine for another owner',async()=>denied(()=>db.query("insert into clinic_medicine_cabinet(owner_id,medicine_name,owner_label,stock_label,expiry_label) values($1,'Forged medicine','Test a','1 viên','HSD: 2027')",[ids.a])));
  await as(ids.a);
  await check('patient cannot transfer medicine ownership',async()=>denied(()=>db.query('update clinic_medicine_cabinet set owner_id=$1 where id=$2',[ids.b,medicine.id])));
  await check('patient can update own medicine metadata',async()=>assert.equal((await db.query("update clinic_medicine_cabinet set stock_label='Còn 9 / 20 viên' where id=$1 returning id",[medicine.id])).rows.length,1));
  for(const role of ['doctor','reception','admin']){await as(ids[role]);await check(role+' cannot create personal cabinet data',async()=>denied(()=>db.query("insert into clinic_medicine_cabinet(owner_id,medicine_name,owner_label,stock_label,expiry_label) values($1,'Staff medicine','Staff','1 viên','HSD: 2027')",[ids[role]])));}
  await as(null);await check('anonymous cabinet read denied',async()=>denied(()=>db.query('select * from clinic_medicine_cabinet')));

  const getLog=()=>db.query('select public.clinic_get_medication_log() as log');
  const setLog=(slot,taken)=>db.query('select public.clinic_set_medication_taken($1,$2) as log',[slot,taken]);
  await check('anonymous medication log RPC denied',async()=>denied(()=>getLog()));
  await as(ids.a);
  await check('new daily medication log has safe defaults',async()=>assert.deepEqual((await getLog()).rows[0].log,{morning:false,afternoon:false,evening:false}));
  await check('patient can mark a medication slot taken',async()=>assert.equal((await setLog('morning',true)).rows[0].log.morning,true));
  await check('medication log upsert is idempotent',async()=>{await setLog('morning',true);await db.exec('reset role');assert.equal((await db.query("select count(*)::int as count from clinic_medication_logs where owner_id=$1 and slot_key='morning'",[ids.a])).rows[0].count,1);await as(ids.a);});
  await check('invalid medication slot is rejected',async()=>assert.rejects(()=>setLog('midnight',true),e=>e.code==='22023'));
  await check('direct medication log writes are denied',async()=>denied(()=>db.query("insert into clinic_medication_logs(owner_id,log_date,slot_key,taken,taken_at) values($1,current_date,'evening',true,now())",[ids.a])));
  await as(ids.b);
  await check('another patient cannot see medication adherence',async()=>assert.equal((await getLog()).rows[0].log.morning,false));
  await check('another patient cannot select raw medication logs',async()=>denied(()=>db.query('select * from clinic_medication_logs')));
  await as(ids.doctor);await check('staff cannot use patient medication log RPC',async()=>denied(()=>getLog()));
 }
 if(tables.includes('clinic_doctor_reviews')){
  await as(null);
  await check('public reviews contain no fabricated verified seeds',async()=>assert.equal((await db.query('select id from clinic_doctor_reviews')).rows.length,0));
  const rpc=(id,rating=5,comment='Review after completed visit')=>db.query('select public.clinic_submit_doctor_review($1,$2,$3) as review',[id,rating,comment]);
  await check('anonymous review submission denied',async()=>denied(()=>rpc(ids.a)));
  await db.exec('reset role');
  const fixtures={};let offset=1;
  for(const [key,owner,status,doc] of [['confirmed',ids.a,'CONFIRMED','doc-1'],['arrived',ids.a,'CHECKED_IN','doc-1'],['cancelled',ids.a,'CANCELLED','doc-1'],['completed',ids.a,'COMPLETED','doc-3'],['other',ids.b,'COMPLETED','doc-2']]){
   fixtures[key]=(await db.query("insert into clinic_appointments(patient_id,doctor_id,patient_name,patient_phone,starts_at,status) values($1,$2,'Test patient','0901234567',now()+($3::text||' days')::interval,$4) returning id",[owner,doc,offset++,status])).rows[0].id;
  }
  await as(ids.a);
  await check('no appointment means no verified review',async()=>denied(()=>rpc(ids.a)));
  for(const state of ['confirmed','arrived','cancelled'])await check(state+' visit cannot be reviewed',async()=>denied(()=>rpc(fixtures[state])));
  await check('cannot review another patient visit',async()=>denied(()=>rpc(fixtures.other)));
  await check('direct insert cannot bypass review RPC',async()=>denied(()=>db.query("insert into clinic_doctor_reviews(doctor_id,patient_name,rating,comment) values('doc-1','Forged name',5,'Forged review')")));
  for(const rating of [0,6,null])await check('invalid rating rejected: '+rating,async()=>assert.rejects(()=>rpc(fixtures.completed,rating),e=>e.code==='22023'));
  for(const comment of ['x','x'.repeat(1001),null])await check('invalid review comment rejected',async()=>assert.rejects(()=>rpc(fixtures.completed,5,comment),e=>e.code==='22023'));
  await as(ids.doctor);await check('staff cannot submit a patient review',async()=>denied(()=>rpc(fixtures.completed)));
  await as(ids.a);
  await check('completed patient may submit with server-owned identity',async()=>{const r=(await rpc(fixtures.completed)).rows[0].review;assert.equal(r.patient_id,ids.a);assert.equal(r.patient_name,'Test a');assert.equal(r.doctor_id,'doc-3');assert.equal(r.appointment_id,fixtures.completed);});
  await check('duplicate patient-doctor review rejected',async()=>assert.rejects(()=>rpc(fixtures.completed),e=>e.code==='23505'));
  await check('direct review edits denied',async()=>denied(()=>db.query("update clinic_doctor_reviews set patient_name='Another person'")));
  await as(null);
  await check('anonymous users may read verified public fields',async()=>assert.equal((await db.query('select id,doctor_id,patient_name,rating,comment,created_at from clinic_doctor_reviews')).rows.length,1));
  await check('public cannot read patient Auth identifiers',async()=>denied(()=>db.query('select patient_id from clinic_doctor_reviews')));
  await check('public cannot read appointment identifiers',async()=>denied(()=>db.query('select appointment_id from clinic_doctor_reviews')));
 }
 console.log(count+' PostgreSQL extension checks passed.');
}finally{await db.close();}
