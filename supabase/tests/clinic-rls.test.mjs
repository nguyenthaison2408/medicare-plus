import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Real embedded PostgreSQL verifies SQL and RLS. Auth schemas/claims are local fixtures.
// This is not a hosted Supabase, JWT-signature, multi-connection load, or Realtime test.
const db = await PGlite.create();
let passed = 0;
const ids = {
  a:'11111111-1111-4111-8111-111111111111', b:'22222222-2222-4222-8222-222222222222',
  doctor:'33333333-3333-4333-8333-333333333333', otherDoctor:'44444444-4444-4444-8444-444444444444',
  reception:'55555555-5555-4555-8555-555555555555',
};
const test = async (name, action) => { await action(); passed++; console.log(`PASS SQL ${passed}: ${name}`); };
async function owner() { await db.exec('reset role'); }
async function asUser(id) {
  await owner();
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id || '']);
  await db.exec(id ? 'set role authenticated' : 'set role anon');
}
const expectCode = (action, code) => assert.rejects(action, error => error.code === code);
let appointment;
let replacement;

try {
  await db.exec(`
    create role anon noinherit;
    create role authenticated noinherit;
    create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb not null default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on function auth.uid() to anon,authenticated;
  `);
  await test('migrations execute on PostgreSQL', async () => {
    await db.exec(fs.readFileSync(new URL('../migrations/202611190001_clinic_core.sql',import.meta.url),'utf8'));
    await db.exec(fs.readFileSync(new URL('../migrations/202611190002_demo_catalog_alignment.sql',import.meta.url),'utf8'));
    await db.exec(fs.readFileSync(new URL('../migrations/202611190003_booking_patient_details.sql',import.meta.url),'utf8'));
  });
  for(const [name,id] of Object.entries(ids)) {
    await db.query('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[
      id,JSON.stringify({full_name:`Test ${name}`,phone:'0988776655',role:'admin'}),
    ]);
  }
  await db.query("update public.clinic_profiles set role='doctor',doctor_id='doc-1' where id=$1",[ids.doctor]);
  await db.query("update public.clinic_profiles set role='doctor',doctor_id='doc-2' where id=$1",[ids.otherDoctor]);
  await db.query("update public.clinic_profiles set role='reception' where id=$1",[ids.reception]);
  await test('self-supplied admin metadata does not grant admin', async () => {
    const result = await db.query('select role from public.clinic_profiles where id=$1',[ids.a]);
    assert.equal(result.rows[0].role,'patient');
  });
  await asUser(null);
  await test('anonymous users may read the public doctor catalog', async () => assert.equal((await db.query('select * from public.clinic_doctors')).rows.length,4));
  await test('anonymous users cannot read appointments', async () => expectCode(()=>db.query('select * from public.clinic_appointments'),'42501'));
  await test('anonymous users cannot invoke booking', async () => expectCode(()=>db.query("select public.clinic_book_appointment('doc-1',now() + interval '1 day')"),'42501'));
  await asUser(ids.a);
  await test('patients see only their own profile', async () => {
    const result = await db.query('select id from public.clinic_profiles');
    assert.deepEqual(result.rows.map(row=>row.id),[ids.a]);
  });
  await test('patients cannot grant themselves a staff role', async () => expectCode(()=>db.query("update public.clinic_profiles set role='admin' where id=$1",[ids.a]),'42501'));
  await test('patients can update their own contact details', async () => {
    const result = await db.query('update public.clinic_profiles set full_name=$1 where id=$2 returning full_name',['Test Patient A',ids.a]);
    assert.equal(result.rows[0].full_name,'Test Patient A');
  });
  const future = (await db.query("select (((now() at time zone 'Asia/Ho_Chi_Minh')::date+1)+time '09:00') at time zone 'Asia/Ho_Chi_Minh' as value")).rows[0].value;
  await test('a patient can create a booking through the RPC', async () => {
    appointment = (await db.query('select public.clinic_book_appointment($1,$2,$3,$4,$5,$6,$7) as result',[
      'doc-1',future,'at_clinic','Nguyen Van A','0988776655','patient-a@example.com','Đau đầu kéo dài hai ngày',
    ])).rows[0].result;
    assert.equal(appointment.patient_id,ids.a); assert.equal(appointment.payment_status,'UNPAID');
    assert.equal(appointment.patient_name,'Nguyen Van A'); assert.equal(appointment.patient_email,'patient-a@example.com');
    assert.equal(appointment.symptoms,'Đau đầu kéo dài hai ngày');
  });
  await test('invalid booking contact details are rejected by PostgreSQL', async () => {
    await expectCode(()=>db.query('select public.clinic_book_appointment($1,$2,$3,$4,$5,$6,$7)',[
      'doc-2',future,'at_clinic','A','123','invalid-email','Đau',
    ]),'22023');
  });
  await test('patients cannot insert appointments directly', async () => expectCode(()=>db.query('insert into public.clinic_appointments default values'),'42501'));
  await asUser(ids.b);
  await test('a second patient cannot book the occupied slot', async () => expectCode(()=>db.query('select public.clinic_book_appointment($1,$2)',['doc-1',future]),'23505'));
  await test('a second patient cannot read the first patient appointment', async () => assert.equal((await db.query('select * from public.clinic_appointments')).rows.length,0));
  await test('a second patient cannot cancel another patient booking', async () => expectCode(()=>db.query('select public.clinic_cancel_appointment($1)',[appointment.id]),'42501'));
  await asUser(ids.a);
  await test('the owner can cancel their booking', async () => {
    const result = await db.query('select public.clinic_cancel_appointment($1) as result',[appointment.id]);
    assert.equal(result.rows[0].result.status,'CANCELLED');
  });
  await asUser(ids.b);
  await test('cancelling releases the slot for a different patient', async () => {
    replacement = (await db.query('select public.clinic_book_appointment($1,$2) as result',['doc-1',future])).rows[0].result;
    assert.equal(replacement.patient_id,ids.b);
  });
  await asUser(ids.otherDoctor);
  await test('a doctor cannot read another doctor appointments', async () => assert.equal((await db.query('select * from public.clinic_appointments')).rows.length,0));
  await asUser(ids.reception);
  await test('reception cannot check in tomorrow appointments today', async () => expectCode(()=>db.query('select public.clinic_check_in($1)',[replacement.booking_code]),'22023'));
  await asUser(ids.b);
  await test('patients cannot check themselves in as staff', async () => expectCode(()=>db.query('select public.clinic_check_in($1)',[replacement.booking_code]),'42501'));
  // Move the fixture to today's clinic day to exercise check-in independent of test execution time.
  await owner();
  await db.query("update public.clinic_appointments set starts_at=(((now() at time zone 'Asia/Ho_Chi_Minh')::date)+time '09:00') at time zone 'Asia/Ho_Chi_Minh' where id=$1",[replacement.id]);
  await asUser(ids.reception);
  await test('reception can check in a booking on its clinic day', async () => {
    const result = await db.query('select public.clinic_check_in($1) as result',[replacement.booking_code]);
    assert.equal(result.rows[0].result.status,'CHECKED_IN');
  });
  await test('reception cannot write medical records', async () => expectCode(()=>db.query('select public.clinic_complete_appointment($1,$2)',[replacement.id,'Test diagnosis']),'42501'));
  await asUser(ids.otherDoctor);
  await test('an unassigned doctor cannot write medical records', async () => expectCode(()=>db.query('select public.clinic_complete_appointment($1,$2)',[replacement.id,'Test diagnosis']),'42501'));
  await asUser(ids.doctor);
  await test('empty diagnoses are rejected', async () => expectCode(()=>db.query('select public.clinic_complete_appointment($1,$2)',[replacement.id,'']),'22023'));
  await test('the assigned doctor can complete a checked-in appointment', async () => {
    const result = await db.query('select public.clinic_complete_appointment($1,$2,$3,$4) as result',[
      replacement.id,'Test diagnosis',JSON.stringify([{name:'Test medicine',dosage:'Test instructions'}]),'Test notes',
    ]);
    assert.equal(result.rows[0].result.status,'COMPLETED');
  });
  await asUser(ids.a);
  await test('another patient cannot read the saved medical record', async () => assert.equal((await db.query('select * from public.clinic_medical_records')).rows.length,0));
  await asUser(ids.b);
  await test('the appointment owner can read their medical record', async () => {
    const result = await db.query('select diagnosis,medications from public.clinic_medical_records');
    assert.equal(result.rows.length,1); assert.equal(result.rows[0].diagnosis,'Test diagnosis');
    assert.equal(result.rows[0].medications[0].name,'Test medicine');
  });
  await test('completed appointments cannot be cancelled', async () => expectCode(()=>db.query('select public.clinic_cancel_appointment($1)',[replacement.id]),'22023'));
  await asUser(ids.reception);
  await test('reception cannot read the private medical record', async () => assert.equal((await db.query('select * from public.clinic_medical_records')).rows.length,0));
  console.log(`\n${passed} embedded PostgreSQL checks passed. Hosted Auth, Realtime and concurrent connections still require a real Supabase project.`);
} finally { await db.close(); }
