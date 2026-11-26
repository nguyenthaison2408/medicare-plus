import assert from 'node:assert/strict';import fs from 'node:fs';import {PGlite} from '@electric-sql/pglite';
const db=await PGlite.create();let count=0;
const ids={a:'11111111-1111-4111-8111-111111111111',b:'22222222-2222-4222-8222-222222222222',doctor:'33333333-3333-4333-8333-333333333333',reception:'44444444-4444-4444-8444-444444444444',admin:'55555555-5555-4555-8555-555555555555'};
const check=async(name,fn)=>{await fn();console.log('PASS EXT '+(++count)+': '+name);};
async function as(id){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);await db.exec(id?'set role authenticated':'set role anon');}
const denied=fn=>assert.rejects(fn,e=>e.code==='42501');
try{
 await db.exec('create role service_role noinherit bypassrls');
 await db.exec("create role anon noinherit;create role authenticated noinherit;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}'::jsonb);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;alter default privileges in schema public grant all on tables to anon,authenticated;");
 await db.exec("create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,primary key(bucket_id,name)); alter table storage.objects enable row level security;grant usage on schema storage to authenticated; grant select,insert,delete on storage.objects to authenticated;");
 const directory=new URL('../migrations/',import.meta.url);
 for(const name of fs.readdirSync(directory).filter(n=>n.endsWith('.sql')).sort())await db.exec(fs.readFileSync(new URL(name,directory),'utf8'));
 await check('all current migrations apply to clean PostgreSQL',async()=>{});
 for(const [name,id] of Object.entries(ids))await db.query('insert into auth.users values($1,$2)',[id,JSON.stringify({full_name:'Test '+name,phone:'0901234567'})]);
 for(const role of ['doctor','reception','admin'])await db.query('update clinic_profiles set role=$1,doctor_id=$2 where id=$3',[role,role==='doctor'?'doc-1':null,ids[role]]);
 await check('PayOS backend service role can read profile roles and doctor fees',async()=>{
  const privileges=(await db.query("select has_table_privilege('service_role','public.clinic_profiles','SELECT') as profiles,has_table_privilege('service_role','public.clinic_doctors','SELECT') as doctors")).rows[0];
  assert.equal(privileges.profiles,true);assert.equal(privileges.doctors,true);
 });
 const paidSlot = (await db.query(
  "select (((now() at time zone 'Asia/Ho_Chi_Minh')::date+2)+time '11:00') at time zone 'Asia/Ho_Chi_Minh' as value"
 )).rows[0].value;
 const bookPaid = (code=123456, doctor='doc-1') => db.query(
  "select clinic_book_paid_appointment($1,$2,$3,'Test Patient','0901234567','test@example.com','General consultation') as appointment",
  [code, doctor, paidSlot]
 );
 await db.exec('set role service_role');
 await db.query("insert into clinic_payos_orders(order_code,patient_id,doctor_id,starts_at,amount) values(123456,$1,'doc-1',$2,350000)",[ids.a,paidSlot]);
 await as(ids.a);
 await check('patients cannot mark PayOS orders paid',()=>denied(()=>db.query('update clinic_payos_orders set paid_at=now()')));
 await check('unpaid PayOS orders cannot book',()=>denied(()=>bookPaid()));
 await db.exec('reset role; set role service_role');
 await db.query('update clinic_payos_orders set paid_at=now() where order_code=123456');
 await as(ids.b);
 await check('another patient cannot use a verified PayOS order',()=>denied(()=>bookPaid()));
 await as(ids.a);
 await check('a verified PayOS order cannot be used for another doctor',()=>denied(()=>bookPaid(123456,'doc-2')));
 await check('verified PayOS booking persists VietQR and paid status and can safely be retried',async()=>{
  const first = (await bookPaid()).rows[0].appointment;
  assert.equal(first.payment_method,'vietqr');
  assert.equal(first.payment_status,'PAID');
  const retry = (await bookPaid()).rows[0].appointment;
  assert.equal(retry.id,first.id);
  const stored = (await db.query('select payment_method,payment_status from clinic_appointments where id=$1',[first.id])).rows[0];
  assert.deepEqual(stored,{payment_method:'vietqr',payment_status:'PAID'});
 });
 await db.exec('reset role');
 await check('the patient slot index rejects another doctor and releases the slot on cancellation', async()=>{
  const {rows:[{startsAt}]} = await db.query(
   "select (((now() at time zone 'Asia/Ho_Chi_Minh')::date + 2) + time '10:30') at time zone 'Asia/Ho_Chi_Minh' as \"startsAt\""
  );
  await as(ids.a);
  const book = (doctorId) => db.query('select clinic_book_appointment($1,$2) as booking',[doctorId,startsAt]);
  // PGlite queues queries on one connection. The hosted suite covers parallel connections.
  const results = await Promise.allSettled([book('doc-1'), book('doc-2')]);
  const [success] = results.filter(result=>result.status==='fulfilled');
  const [conflict] = results.filter(result=>result.status==='rejected');
  assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
  assert.equal(conflict?.reason.code,'23505');
  assert.equal(conflict.reason.constraint,'clinic_one_active_booking_per_patient_slot');

  const first = success.value.rows[0].booking;
  const otherDoctor = first.doctor_id==='doc-1' ? 'doc-2' : 'doc-1';
  await db.query('select clinic_cancel_appointment($1)',[first.id]);
  const replacement = (await book(otherDoctor)).rows[0].booking;
  assert.equal(replacement.doctor_id,otherDoctor);
  await db.query('select clinic_cancel_appointment($1)',[replacement.id]);
  await db.exec('reset role');
 });
 const tables=(await db.query("select tablename from pg_tables where schemaname='public'")).rows.map(x=>x.tablename);
 if(tables.includes('clinic_hospitals')){
  const addHospital=(name='Bệnh viện Kiểm thử',latitude=10.75,longitude=106.67)=>db.query("select public.clinic_admin_add_hospital($1,'123 Đường Kiểm thử, TP.HCM','02812345678',$2,$3) as hospital",[name,latitude,longitude]);
  await as(null);
  await check('anonymous users can read active hospital catalog',async()=>assert.equal((await db.query('select id from clinic_hospitals')).rows.length,4));
  await check('anonymous hospital administration is denied',async()=>denied(()=>addHospital()));
  await as(ids.a);await check('patients cannot add hospitals',async()=>denied(()=>addHospital()));
  for(const role of ['doctor','reception']){await as(ids[role]);await check(role+' cannot add hospitals',async()=>denied(()=>addHospital()));}
  await as(ids.admin);
  const created=(await addHospital()).rows[0].hospital;
  await check('admin can add a validated hospital',async()=>{assert.equal(created.name,'Bệnh viện Kiểm thử');assert.equal(created.latitude,10.75);});
  await check('duplicate hospital creation returns existing row',async()=>assert.equal((await addHospital()).rows[0].hospital.id,created.id));
  await check('invalid hospital coordinates are rejected',async()=>assert.rejects(()=>addHospital('Bệnh viện Tọa độ lỗi',999,106.67),e=>e.code==='22023'));
  await check('direct hospital writes are denied',async()=>denied(()=>db.query("insert into clinic_hospitals(name,address,latitude,longitude) values('Direct hospital','Direct address',10,106)")));
  await db.exec('reset role');
  await db.query("insert into clinic_hospitals(name,address,latitude,longitude,active) values('Inactive hospital','Hidden address',10,106,false)");
  await as(null);
  await check('inactive hospitals are hidden from public catalog',async()=>assert.equal((await db.query("select id from clinic_hospitals where name='Inactive hospital'")).rows.length,0));
 }
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
  await check('owner can update extended family member medical fields',async()=>{const updated=(await db.query("update clinic_family_members set gender='Nữ',phone='0912345678',blood_group='A+',allergies='Penicillin',note='Theo dõi định kỳ' where id=$1 returning gender,phone,blood_group,allergies,updated_at",[family.id])).rows[0];assert.equal(updated.gender,'Nữ');assert.equal(updated.phone,'0912345678');assert.equal(updated.blood_group,'A+');assert.equal(updated.allergies,'Penicillin');assert.ok(updated.updated_at);});
  await check('owner can edit and delete family member',async()=>{assert.equal((await db.query("update clinic_family_members set note='Owner edit' where id=$1 returning id",[family.id])).rows.length,1);assert.equal((await db.query('delete from clinic_family_members where id=$1 returning id',[family.id])).rows.length,1);});
 }
 if(tables.includes('clinic_medicine_cabinet')){
  const addMedicine=(name='Test medicine 500mg',stock='Còn 10 / 20 viên',expiry='HSD: 12/2027',urgent=true)=>db.query('select public.clinic_add_cabinet_medicine($1,$2,$3,$4) as medicine',[name,stock,expiry,urgent]);
  await as(ids.a);
  const medicine=(await addMedicine()).rows[0].medicine;
  await check('patient can create and read own medicine',async()=>assert.equal((await db.query('select id from clinic_medicine_cabinet')).rows.length,1));
  await check('medicine owner label comes from server profile',async()=>assert.equal(medicine.owner_label,'Test a (Bản thân)'));
  await check('invalid cabinet medicine is rejected',async()=>assert.rejects(()=>addMedicine('x'),e=>e.code==='22023'));
  await check('direct cabinet inserts cannot forge identity',async()=>denied(()=>db.query("insert into clinic_medicine_cabinet(owner_id,medicine_name,owner_label,stock_label,expiry_label) values($1,'Forged medicine','Forged owner','1 viên','HSD: 2027')",[ids.a])));
  await as(ids.b);
  await check('another patient cannot read medicine cabinet',async()=>assert.equal((await db.query('select * from clinic_medicine_cabinet')).rows.length,0));
  await as(ids.a);
  await check('patient cannot transfer medicine ownership',async()=>denied(()=>db.query('update clinic_medicine_cabinet set owner_id=$1 where id=$2',[ids.b,medicine.id])));
  await check('patient cannot forge medicine owner label',async()=>denied(()=>db.query("update clinic_medicine_cabinet set owner_label='Forged owner' where id=$1",[medicine.id])));
  await check('patient can update own medicine metadata',async()=>assert.equal((await db.query("update clinic_medicine_cabinet set stock_label='Còn 9 / 20 viên' where id=$1 returning id",[medicine.id])).rows.length,1));
  for(const role of ['doctor','reception','admin']){await as(ids[role]);await check(role+' cannot create personal cabinet data',async()=>denied(()=>addMedicine('Staff medicine')));}
  await as(null);await check('anonymous cabinet read denied',async()=>denied(()=>db.query('select * from clinic_medicine_cabinet')));

  await db.exec('reset role');
  const prescriptionOne=(await db.query("insert into clinic_appointments(patient_id,doctor_id,patient_name,patient_phone,starts_at,status) values($1,'doc-1','Test a','0901234567',now()-interval '2 days','COMPLETED') returning id",[ids.a])).rows[0].id;
  const prescriptionTwo=(await db.query("insert into clinic_appointments(patient_id,doctor_id,patient_name,patient_phone,starts_at,status) values($1,'doc-1','Test a','0901234567',now()-interval '1 day','COMPLETED') returning id",[ids.a])).rows[0].id;
  await db.query("insert into clinic_medical_records(appointment_id,diagnosis,medications,author_id) values($1,'Test diagnosis',$2,$3)",[prescriptionOne,JSON.stringify([{name:'Medicine one',dosage:'Morning'},{name:'Medicine two',dosage:'Afternoon'},{name:'Medicine three',dosage:'Evening'},{name:'Medicine four',dosage:'As needed'}]),ids.doctor]);
  await db.query("insert into clinic_medical_records(appointment_id,diagnosis,medications,author_id) values($1,'New diagnosis',$2,$3)",[prescriptionTwo,JSON.stringify([{name:'New prescription medicine',dosage:'Morning'}]),ids.doctor]);
  const getLog=()=>db.query('select public.clinic_get_medication_log() as log');
  const setLog=(appointment,index,dose,taken)=>db.query('select public.clinic_set_medication_taken($1,$2,$3,$4) as log',[appointment,index,dose,taken]);
  await check('anonymous medication log RPC denied',async()=>denied(()=>getLog()));
  await as(ids.a);
  await check('new daily medication log starts empty',async()=>assert.deepEqual((await getLog()).rows[0].log,{}));
  const firstKey=`${prescriptionOne}:0:morning`,secondKey=`${prescriptionTwo}:0:morning`,fourthKey=`${prescriptionOne}:3:as-needed`;
  await check('patient can mark a prescribed medication dose taken',async()=>assert.equal((await setLog(prescriptionOne,0,'morning',true)).rows[0].log[firstKey],true));
  await check('fourth prescribed medicine has its own log state',async()=>assert.equal((await setLog(prescriptionOne,3,'as-needed',true)).rows[0].log[fourthKey],true));
  await check('new prescription never inherits an older medicine state',async()=>{const log=(await setLog(prescriptionTwo,0,'morning',false)).rows[0].log;assert.equal(log[firstKey],true);assert.equal(log[secondKey],false);});
  await check('medication dose upsert is idempotent',async()=>{await setLog(prescriptionOne,0,'morning',true);await db.exec('reset role');assert.equal((await db.query("select count(*)::int as count from clinic_medication_logs where owner_id=$1 and appointment_id=$2 and medication_index=0 and dose_key='morning'",[ids.a,prescriptionOne])).rows[0].count,1);await as(ids.a);});
  await check('invalid medication dose key is rejected',async()=>assert.rejects(()=>setLog(prescriptionOne,0,'INVALID DOSE',true),e=>e.code==='22023'));
  await check('unprescribed medication index is rejected',async()=>assert.rejects(()=>setLog(prescriptionOne,99,'dose-1',true),e=>e.code==='42501'));
  await check('direct medication log writes are denied',async()=>denied(()=>db.query("insert into clinic_medication_logs(owner_id,appointment_id,medication_index,medicine_name,dose_key,log_date,taken,taken_at) values($1,$2,0,'Forged medicine','morning',current_date,true,now())",[ids.a,prescriptionOne])));
  await as(ids.b);
  await check('another patient cannot see medication adherence',async()=>assert.deepEqual((await getLog()).rows[0].log,{}));
  await check('another patient cannot log medicine from someone else prescription',async()=>assert.rejects(()=>setLog(prescriptionOne,0,'morning',true),e=>e.code==='42501'));
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
  await check('anonymous cannot read private admin_note',async()=>denied(()=>db.query('select admin_note from clinic_doctor_reviews')));
  await as(ids.a);
  await check('patient cannot read private admin_note',async()=>denied(()=>db.query('select admin_note from clinic_doctor_reviews')));
  await check('patient cannot call admin review list RPC',async()=>denied(()=>db.query('select * from public.clinic_admin_list_reviews()')));
  await check('patient cannot hide or delete reviews',async()=>{
   assert.equal((await db.query('update clinic_doctor_reviews set is_hidden=true returning id')).rows.length,0);
   assert.equal((await db.query('delete from clinic_doctor_reviews returning id')).rows.length,0);
  });
  await as(ids.admin);
  await check('admin can hide inappropriate review and read admin_note via RPC',async()=>{
   assert.equal((await db.query("update clinic_doctor_reviews set is_hidden=true, admin_note='Spam' returning id")).rows.length,1);
   const list=(await db.query('select * from public.clinic_admin_list_reviews()')).rows;
   assert.equal(list.length,1);
   assert.equal(list[0].admin_note,'Spam');
  });
  await as(null);
  await check('hidden review is no longer visible to public',async()=>assert.equal((await db.query('select id from clinic_doctor_reviews')).rows.length,0));
  await as(ids.admin);
  await check('admin can restore hidden review',async()=>{
   assert.equal((await db.query("update clinic_doctor_reviews set is_hidden=false, admin_note='' returning id")).rows.length,1);
  });
 }
 if(tables.includes('clinic_doctor_schedules')){
  await as(ids.a);
  await check('patient can update own extended profile fields',async()=>assert.equal((await db.query("update clinic_profiles set full_name='Updated Patient', gender='Nam', bhyt_code='DN4 79 234 82390' where id=$1 returning id",[ids.a])).rows.length,1));
  await check('patient cannot write doctor shift schedules',async()=>denied(()=>db.query("insert into clinic_doctor_schedules(doctor_id,work_date,shift,room) values('doc-1',current_date,'morning','P.302')")));
  await as(ids.admin);
  const shiftDate=(await db.query("select ((now() at time zone 'Asia/Ho_Chi_Minh')::date + 10)::text as d")).rows[0].d;
  const sch=(await db.query("insert into clinic_doctor_schedules(doctor_id,work_date,shift,room) values('doc-1',$1::date,'morning','P.302') returning id",[shiftDate])).rows[0];
  await check('admin can assign doctor shift schedule',async()=>assert.ok(sch.id));
  await as(null);
  await check('public can read assigned doctor schedules',async()=>assert.equal((await db.query('select id from clinic_doctor_schedules')).rows.length,1));
  await check('slot availability marks afternoon slots unavailable when only morning shift is assigned',async()=>{
   const slots=(await db.query("select (starts_at at time zone 'Asia/Ho_Chi_Minh')::time::text as t, is_booked from public.clinic_slot_availability('doc-1',$1::date)",[shiftDate])).rows;
   const morning=slots.find(s=>s.t.startsWith('09:00'));
   const afternoon=slots.find(s=>s.t.startsWith('14:00'));
   assert.equal(morning.is_booked,false);
   assert.equal(afternoon.is_booked,true);
  });
  await as(ids.a);
  await check('booking outside assigned doctor shift is rejected',async()=>{
   await assert.rejects(()=>db.query("select public.clinic_book_appointment('doc-1',($1 || 'T14:00:00+07:00')::timestamptz,'at_clinic','Nguyen Van A','0912345678','a@example.com','Kham dau dau')",[shiftDate]),e=>e.message.includes('OUTSIDE_DOCTOR_SHIFT'));
  });
  await check('booking inside assigned doctor shift succeeds',async()=>{
   const booked=(await db.query("select public.clinic_book_appointment('doc-1',($1 || 'T09:00:00+07:00')::timestamptz,'at_clinic','Nguyen Van A','0912345678','a@example.com','Kham dau dau') as apt",[shiftDate])).rows[0].apt;
   assert.equal(booked.doctor_id,'doc-1');
  });
  await as(ids.admin);
  await check('admin can delete doctor shift schedule',async()=>assert.equal((await db.query('delete from clinic_doctor_schedules where id=$1 returning id',[sch.id])).rows.length,1));
 }
 if(tables.includes('clinic_bhyt_configs')){
  await as(null);
  await check('public can read default seeded BHYT configs',async()=>assert.ok((await db.query('select id from clinic_bhyt_configs')).rows.length>=4));
  await as(ids.a);
  await check('patient cannot modify BHYT config',async()=>denied(()=>db.query("insert into clinic_bhyt_configs(id,prefix_code,group_name,in_network_rate,out_network_rate) values('bhyt-cn','CN','Can ngheo',95,60)")));
  await as(ids.admin);
  await check('admin can create and update BHYT config',async()=>{
   await db.query("insert into clinic_bhyt_configs(id,prefix_code,group_name,in_network_rate,out_network_rate) values('bhyt-cn','CN','Can ngheo',95,60)");
   assert.equal((await db.query("update clinic_bhyt_configs set in_network_rate=100 where id='bhyt-cn' returning id")).rows.length,1);
   assert.equal((await db.query("delete from clinic_bhyt_configs where id='bhyt-cn' returning id")).rows.length,1);
  });
 }
 if(tables.includes('clinic_consult_messages')){
  await as(ids.a);
  const msg=(await db.query("insert into clinic_consult_messages(patient_id,doctor_id,sender_id,sender_role,sender_name,content) values($1,'doc-1',$1,'patient','Test a','Bác sĩ ơi em bị đau đầu') returning id",[ids.a])).rows[0];
  await check('patient can send and read own consultation message',async()=>assert.equal((await db.query('select id from clinic_consult_messages')).rows.length,1));
  await as(ids.b);
  await check('another patient cannot read consultation messages',async()=>assert.equal((await db.query('select id from clinic_consult_messages')).rows.length,0));
  await check('patient cannot spoof sender_id or patient_id in consultation messages',async()=>denied(()=>db.query("insert into clinic_consult_messages(patient_id,doctor_id,sender_id,sender_role,sender_name,content) values($1,'doc-1',$2,'patient','Spoof','Fake')",[ids.a,ids.b])));
  await as(ids.doctor);
  await check('assigned doctor can read and reply to consultation thread',async()=>{assert.equal((await db.query('select id from clinic_consult_messages')).rows.length,1);const reply=(await db.query("insert into clinic_consult_messages(patient_id,doctor_id,sender_id,sender_role,sender_name,content) values($1,'doc-1',$2,'doctor','BS. Trang','Chào bạn, bác sĩ đã nhận được thông tin') returning id",[ids.a,ids.doctor])).rows[0];assert.ok(reply.id);});
  await check('doctor cannot send message on behalf of another doctor_id',async()=>denied(()=>db.query("insert into clinic_consult_messages(patient_id,doctor_id,sender_id,sender_role,sender_name,content) values($1,'doc-2',$2,'doctor','BS. Trang','Wrong doc')",[ids.a,ids.doctor])));
  await as(ids.a);
  await check('patient receives doctor reply in thread',async()=>assert.equal((await db.query('select id from clinic_consult_messages')).rows.length,2));
  assert.ok(msg.id);
 }
 if(tables.includes('clinic_lab_results')){
  await db.exec('reset role');
  const labApt=(await db.query("insert into clinic_appointments(patient_id,doctor_id,patient_name,patient_phone,starts_at,status) values($1,'doc-1','Test a','0901234567',now()-interval '3 days','COMPLETED') returning id",[ids.a])).rows[0].id;
  const addLab=(apt=labApt,cat='imaging',title='Chụp MRI Sọ não 1.5T',conc='Bình thường',path='appointments/'+labApt+'/mri.pdf',name='mri.pdf',mime='application/pdf',size=204800)=>db.query('select row_to_json(r) as res from public.clinic_add_lab_result($1,$2,$3,$4,$5,$6,$7,$8) r',[apt,cat,title,conc,path,name,mime,size]);
  await as(ids.a);
  await check('patient cannot upload lab results',async()=>denied(()=>addLab()));
  await as(ids.reception);
  await check('reception cannot upload lab results',async()=>denied(()=>addLab()));
  await as(ids.doctor);
  await db.query("insert into storage.objects(bucket_id,name) values('clinic-lab-results',$1)",['appointments/'+labApt+'/mri.pdf']);
  const createdLab=(await addLab()).rows[0].res;
  await check('assigned doctor can read the uploaded object',async()=>assert.equal((await db.query('select name from storage.objects')).rows.length,1));
  await check('RPC refuses referencing an unrelated appointment path',async()=>assert.rejects(()=>addLab(labApt,'imaging','Wrong path','','appointments/other/file.pdf'),e=>e.code==='22023'));
  await check('RPC refuses referencing an object not uploaded',async()=>assert.rejects(()=>addLab(labApt,'imaging','Missing file','','appointments/'+labApt+'/missing.pdf'),e=>e.code==='22023'));
  await db.exec('reset role'); await db.query("update clinic_profiles set doctor_id='doc-2' where id=$1",[ids.doctor]); await as(ids.doctor);
  await check('unassigned doctor cannot read another doctor lab object',async()=>assert.equal((await db.query('select name from storage.objects')).rows.length,0));
  await check('unassigned doctor cannot delete another doctor lab object',async()=>assert.equal((await db.query('delete from storage.objects returning name')).rows.length,0));
  await check('unassigned doctor cannot upload into another appointment',async()=>denied(()=>db.query("insert into storage.objects(bucket_id,name) values('clinic-lab-results',$1)",['appointments/'+labApt+'/spoof.pdf'])));
  await db.exec('reset role');await db.query("update clinic_profiles set doctor_id='doc-1' where id=$1",[ids.doctor]);await as(ids.doctor);
  await check('assigned doctor can upload validated lab result',async()=>{assert.equal(createdLab.patient_id,ids.a);assert.equal(createdLab.category,'imaging');assert.equal(createdLab.mime_type,'application/pdf');});
  await check('invalid lab mime type is rejected',async()=>assert.rejects(()=>addLab(labApt,'imaging','File lỗi','','lab/x.exe','x.exe','application/x-msdownload',1024),e=>e.code==='22023'));
  await check('oversized lab file over 10MB is rejected',async()=>assert.rejects(()=>addLab(labApt,'imaging','File quá lớn','','lab/big.pdf','big.pdf','application/pdf',10485761),e=>e.code==='22023'));
  await as(ids.a);
  await check('patient can read own lab storage object',async()=>assert.equal((await db.query('select name from storage.objects')).rows.length,1));
  await check('patient can read own lab result',async()=>assert.equal((await db.query('select id from clinic_lab_results')).rows.length,1));
  await check('patient cannot delete lab result',async()=>denied(()=>db.query('select public.clinic_delete_lab_result($1)',[createdLab.id])));
  await as(ids.b);
  await check('another patient cannot read lab storage object',async()=>assert.equal((await db.query('select name from storage.objects')).rows.length,0));
  await check('another patient cannot read other patient lab result',async()=>assert.equal((await db.query('select id from clinic_lab_results')).rows.length,0));
  await as(null);
  await check('anonymous user cannot read lab results',async()=>denied(()=>db.query('select id from clinic_lab_results')));
  await as(ids.doctor);
  await check('assigned doctor can delete lab result',async()=>{const del=(await db.query('select row_to_json(r) as res from public.clinic_delete_lab_result($1) r',[createdLab.id])).rows[0].res;assert.equal(del.id,createdLab.id);});
 }
 await db.exec('reset role');
 const queueVisit=async(doc,date,patientId=ids.a)=>(await db.query("insert into clinic_appointments(patient_id,doctor_id,patient_name,patient_phone,starts_at,status) values($1,$2,'QA Queue','0901234567',$3,'CHECKED_IN') returning id,queue_number",[patientId,doc,date])).rows[0];
 const q1=await queueVisit('doc-1','2098-01-01T08:00:00+07:00'),q2=await queueVisit('doc-1','2098-01-01T08:30:00+07:00'),q3=await queueVisit('doc-2','2098-01-01T08:00:00+07:00',ids.b),q4=await queueVisit('doc-1','2098-01-02T08:00:00+07:00');
 await check('queue allocation is per doctor and clinic day',async()=>{assert.equal(q1.queue_number,1);assert.equal(q2.queue_number,2);assert.equal(q3.queue_number,1);assert.equal(q4.queue_number,1);});
 await db.query("update clinic_appointments set status='CANCELLED' where id=$1",[q1.id]);
 await check('cancelled queue numbers are never reused',async()=>assert.equal((await queueVisit('doc-1','2098-01-01T09:00:00+07:00')).queue_number,3));
 await check('repeated check-in keeps the issued queue number',async()=>assert.equal((await db.query("update clinic_appointments set status='CHECKED_IN',queue_number=99 where id=$1 returning queue_number",[q2.id])).rows[0].queue_number,2));
 await as(ids.reception);const receptionQueue=(await db.query('select queue_number from clinic_appointments where id=$1',[q2.id])).rows[0].queue_number;
 await as(ids.doctor);await check('reception and assigned doctor read the same stored number',async()=>assert.equal((await db.query('select queue_number from clinic_appointments where id=$1',[q2.id])).rows[0].queue_number,receptionQueue));
 await check('authenticated users cannot manipulate queue counters',async()=>denied(()=>db.query('update clinic_private.daily_queue_counters set last_number=0')));
 console.log(count+' PostgreSQL extension checks passed.');
}finally{await db.close();}
