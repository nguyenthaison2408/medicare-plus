import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {root, projectUrl, newClient, adminClient, database} from '../scripts/cloud-config.mjs';

// Run explicitly against the owner's demo project; never sends invitation/email messages.
const admin = adminClient();
const db = database();
const clients = [];
const users = [];
const checks = [];
const run = crypto.randomBytes(5).toString('hex');
const password = crypto.randomBytes(24).toString('base64url') + 'Aa1!';
const startedAt = new Date().toISOString();
async function check(name, fn) {
  try { await fn(); checks.push({name, passed: true}); console.log(`PASS CLOUD ${checks.length}: ${name}`); }
  catch (error) { checks.push({name, passed: false, error: error.message}); throw error; }
}
function ok(result) { assert.equal(result.error, null, result.error?.message); return result.data; }
async function account(label, role, doctorId) {
  const email = `clinic-${label}-${run}@example.com`;
  const created = ok(await admin.auth.admin.createUser({email, password, email_confirm: true,
    user_metadata: {full_name: `Demo ${label}`, phone: '0901234567', role: 'admin'}}));
  users.push(created.user.id);
  const initial = (await db.query('select role from public.clinic_profiles where id=$1', [created.user.id])).rows[0];
  assert.equal(initial?.role, 'patient', 'metadata must not grant a staff role');
  if (role !== 'patient') await db.query('update public.clinic_profiles set role=$1, doctor_id=$2 where id=$3', [role, doctorId ?? null, created.user.id]);
  const client = newClient(); clients.push(client);
  ok(await client.auth.signInWithPassword({email, password}));
  return {id: created.user.id, email, client};
}
let concurrency;
let cleanupSucceeded = false;
try {
  await db.connect();
  const anon = newClient(); clients.push(anon);
  await check('anonymous users can read the hosted doctor catalog', async () => {
    assert.equal(ok(await anon.from('clinic_doctors').select('id')).length, 4);
  });
  await check('anonymous booking is denied', async () => {
    assert.ok((await anon.rpc('clinic_book_appointment', {p_doctor_id:'doc-1',p_starts_at:'2099-01-01T08:00:00+07:00'})).error);
  });
  let patientA, patientB, reception, doctor, otherDoctor;
  await check('five synthetic Auth accounts log in with real passwords; role metadata grants no privileges', async () => {
    patientA = await account('patient-a', 'patient'); patientB = await account('patient-b', 'patient');
    reception = await account('reception', 'reception'); doctor = await account('doctor', 'doctor', 'doc-1');
    otherDoctor = await account('other-doctor', 'doctor', 'doc-2');
  });
  await check('an incorrect password is rejected', async () => {
    const bad = newClient(); clients.push(bad);
    assert.ok((await bad.auth.signInWithPassword({email:patientA.email,password:'incorrect-password-123'})).error);
  });
  await check('patients may only read their own hosted profile', async () => {
    const rows = ok(await patientA.client.from('clinic_profiles').select('id,role'));
    assert.deepEqual(rows.map(row => row.id), [patientA.id]); assert.equal(rows[0].role,'patient');
  });
  await check('patients cannot grant themselves an admin role', async () => {
    assert.ok((await patientA.client.from('clinic_profiles').update({role:'admin'}).eq('id',patientA.id)).error);
  });
  const {rows:[clock]} = await db.query("select ((now() at time zone 'Asia/Ho_Chi_Minh')::date+1)::text as tomorrow, (now() at time zone 'Asia/Ho_Chi_Minh')::date::text as today");
  const startsAt = `${clock.tomorrow}T08:00:00+07:00`;
  let booking;
  await check('hosted RPC rejects invalid patient fields independently', async () => {
    const valid={p_doctor_id:'doc-2',p_starts_at:startsAt,p_payment_method:'at_clinic',p_patient_name:'Nguyễn Văn An',
      p_patient_phone:'0901234567',p_patient_email:patientA.email,p_symptoms:'Đau đầu kéo dài'};
    for(const [field,value] of [['p_patient_name','Patient 123'],['p_patient_name',''],['p_patient_phone','123'],
      ['p_patient_email','invalid-email'],['p_patient_email',''],['p_symptoms','Đau'],['p_symptoms','']]) {
      assert.equal((await patientA.client.rpc('clinic_book_appointment',{...valid,[field]:value})).error?.code,'22023',field);
    }
  });
  await check('hosted bookings preserve Vietnamese names and patient details', async () => {
    const result=ok(await patientA.client.rpc('clinic_book_appointment',{p_doctor_id:'doc-2',p_starts_at:startsAt,
      p_payment_method:'at_clinic',p_patient_name:'Nguyễn Văn An',p_patient_phone:'090.123.4567',
      p_patient_email:patientA.email,p_symptoms:'Đau đầu kéo dài'}));
    assert.equal(result.patient_name,'Nguyễn Văn An');assert.equal(result.patient_phone,'0901234567');
    ok(await patientA.client.rpc('clinic_cancel_appointment',{p_appointment_id:result.id}));
  });
  await check('concurrent bookings for one patient and two doctors create exactly one appointment', async () => {
    const request = (doctorId) => patientA.client.rpc('clinic_book_appointment', {
      p_doctor_id: doctorId, p_starts_at: startsAt, p_payment_method: 'at_clinic',
      p_patient_name: 'Demo Patient A', p_patient_phone: '0901234567',
      p_patient_email: patientA.email, p_symptoms: 'Đau đầu kéo dài hai ngày',
    });
    const results = await Promise.all([request('doc-1'), request('doc-2')]);
    const successes = results.filter(result => !result.error);
    const conflicts = results.filter(result => result.error?.code === '23505');
    assert.equal(successes.length, 1);
    assert.equal(conflicts.length, 1);
    assert.match(conflicts[0].error.message, /clinic_one_active_booking_per_patient_slot/);
    ok(await patientA.client.rpc('clinic_cancel_appointment', {p_appointment_id: successes[0].data.id}));
  });
  await check('50 concurrent hosted booking requests create exactly one appointment and 49 conflicts', async () => {
    const results = await Promise.all(Array.from({length:50}, () => patientA.client.rpc('clinic_book_appointment', {
      p_doctor_id:'doc-1',p_starts_at:startsAt,p_payment_method:'at_clinic',
      p_patient_name:'Demo Patient A',p_patient_phone:'0901234567',p_patient_email:patientA.email,
      p_symptoms:'Đau đầu kéo dài hai ngày'})));
    const successes = results.filter(result => !result.error);
    const conflicts = results.filter(result => result.error?.code === '23505');
    concurrency = {requests:50,successes:successes.length,conflicts:conflicts.length};
    assert.equal(successes.length,1); assert.equal(conflicts.length,49); booking=successes[0].data;
    assert.equal(booking.patient_email,patientA.email); assert.equal(booking.symptoms,'Đau đầu kéo dài hai ngày');
  });
  await check('availability marks the occupied hosted slot', async () => {
    const slots=ok(await patientA.client.rpc('clinic_slot_availability',{p_doctor_id:'doc-1',p_date:clock.tomorrow}));
    assert.equal(slots.filter(slot=>slot.is_booked).length,1);
  });
  await check('another patient cannot read the booking', async () => {
    assert.equal(ok(await patientB.client.from('clinic_appointments').select('id').eq('id',booking.id)).length,0);
  });
  await check('another patient cannot cancel the booking', async () => {
    assert.equal((await patientB.client.rpc('clinic_cancel_appointment',{p_appointment_id:booking.id})).error?.code,'42501');
  });
  await check('an unrelated doctor cannot read the booking', async () => {
    assert.equal(ok(await otherDoctor.client.from('clinic_appointments').select('id').eq('id',booking.id)).length,0);
  });
  await check('a fresh independent login retrieves the persisted appointment', async () => {
    const fresh=newClient();clients.push(fresh);ok(await fresh.auth.signInWithPassword({email:patientA.email,password}));
    assert.equal(ok(await fresh.from('clinic_appointments').select('id').eq('id',booking.id))[0].id,booking.id);
  });
  let realtimeEvent;
  let postgresSubscriptionReady = false;
  await patientA.client.realtime.setAuth((await patientA.client.auth.getSession()).data.session.access_token);
  const channel=patientA.client.channel(`clinic-test-${run}`).on('postgres_changes', {
    event:'UPDATE',schema:'public',table:'clinic_appointments',filter:`patient_id=eq.${patientA.id}`
  }, payload=>{realtimeEvent=payload;}).on('system',{}, payload=>{
    if(payload.extension==='postgres_changes' && payload.status==='ok') postgresSubscriptionReady=true;
    console.log(JSON.stringify({realtimeSystem:payload}));
  });
  await check('the hosted Realtime subscription connects', async () => {
    await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(new Error('Realtime subscription timeout')),15000);
      channel.subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timeout);resolve();}
        else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){clearTimeout(timeout);reject(new Error(status));}});
    });
  });
  // The channel join can complete before the database subscription is active.
  // Wait for the server's PostgreSQL acknowledgement before changing the fixture.
  const subscriptionDeadline=Date.now()+15000;
  while(!postgresSubscriptionReady && Date.now()<subscriptionDeadline) await new Promise(resolve=>setTimeout(resolve,100));
  assert.equal(postgresSubscriptionReady,true,'PostgreSQL Realtime subscription did not become ready');
  await check('the owner can cancel the booking', async () => {
    assert.equal(ok(await patientA.client.rpc('clinic_cancel_appointment',{p_appointment_id:booking.id})).status,'CANCELLED');
  });
  await check('Realtime delivers the authorized appointment update', async () => {
    const until=Date.now()+12000;
    while(!realtimeEvent&&Date.now()<until) await new Promise(resolve=>setTimeout(resolve,100));
    assert.equal(realtimeEvent?.new?.id,booking.id);assert.equal(realtimeEvent.new.status,'CANCELLED');
  });
  await patientA.client.removeChannel(channel);
  await check('cancelling releases the slot for another patient', async () => {
    booking=ok(await patientB.client.rpc('clinic_book_appointment',{p_doctor_id:'doc-1',p_starts_at:startsAt,p_payment_method:'at_clinic'}));
    assert.equal(booking.patient_email,'');
  });
  await check('reception cannot check in tomorrow appointments today', async () => {
    assert.equal((await reception.client.rpc('clinic_check_in',{p_booking_code:booking.booking_code})).error?.message,'CHECK_IN_DATE_MISMATCH');
  });
  await check('patients cannot perform staff check-in', async () => {
    assert.equal((await patientB.client.rpc('clinic_check_in',{p_booking_code:booking.booking_code})).error?.code,'42501');
  });
  // Controlled time fixture, not a claim that a future appointment was normally checked in.
  await db.query('update public.clinic_appointments set starts_at=$1 where id=$2',[`${clock.today}T08:00:00+07:00`,booking.id]);
  await check('reception can check in the same-day time fixture by its real booking code', async () => {
    assert.equal(ok(await reception.client.rpc('clinic_check_in',{p_booking_code:booking.booking_code})).status,'CHECKED_IN');
  });
  const recordArgs={p_appointment_id:booking.id,p_diagnosis:'Chẩn đoán minh họa kiểm thử',p_medications:[{name:'Thuốc minh họa',dosage:'Chỉ dùng cho dữ liệu test'}],p_notes:'Dữ liệu giả, không dùng để điều trị.'};
  await check('reception cannot write a medical record', async () => {
    assert.equal((await reception.client.rpc('clinic_complete_appointment',recordArgs)).error?.code,'42501');
  });
  await check('an unrelated doctor cannot write a medical record', async () => {
    assert.equal((await otherDoctor.client.rpc('clinic_complete_appointment',recordArgs)).error?.code,'42501');
  });
  await check('the assigned doctor saves the medical record and completes the appointment', async () => {
    ok(await doctor.client.rpc('clinic_complete_appointment',recordArgs));
    assert.equal(ok(await doctor.client.from('clinic_appointments').select('status').eq('id',booking.id))[0].status,'COMPLETED');
  });
  await check('the appointment owner reads the persisted medical record', async () => {
    assert.equal(ok(await patientB.client.from('clinic_medical_records').select('diagnosis').eq('appointment_id',booking.id))[0].diagnosis,recordArgs.p_diagnosis);
  });
  await check('another patient cannot read the medical record', async () => {
    assert.equal(ok(await patientA.client.from('clinic_medical_records').select('appointment_id').eq('appointment_id',booking.id)).length,0);
  });
  await check('reception cannot read the private medical record', async () => {
    const response=await reception.client.from('clinic_medical_records').select('appointment_id').eq('appointment_id',booking.id);
    assert.ok(response.error||response.data.length===0);
  });
  await check('completed appointments cannot be cancelled', async () => {
    assert.equal((await patientB.client.rpc('clinic_cancel_appointment',{p_appointment_id:booking.id})).error?.message,'APPOINTMENT_ALREADY_COMPLETED');
  });
} catch(error) {
  console.error(`CLOUD TEST FAILED: ${error.message}`);process.exitCode=1;
} finally {
  for(const client of clients) { await client.removeAllChannels(); await client.auth.signOut({scope:'local'}); }
  try {
    if(users.length) {
      await db.query('delete from public.clinic_medical_records where appointment_id in (select id from public.clinic_appointments where patient_id=any($1::uuid[]))',[users]);
      await db.query('delete from public.clinic_appointments where patient_id=any($1::uuid[])',[users]);
      for(const id of users) ok(await admin.auth.admin.deleteUser(id));
    }
    cleanupSucceeded=true;
  } catch(error) {console.error(`Synthetic fixture cleanup failed: ${error.message}`);process.exitCode=1;}
  await db.end();
  const evidence={startedAt,finishedAt:new Date().toISOString(),projectUrl,environment:'hosted Supabase Auth/Data API/PostgreSQL/Realtime',
    checks,concurrency,cleanupSucceeded,limitations:['Synthetic accounts; not a 20-person UAT.','50-request contention check; not a sustained k6 100-VU benchmark.','Same-day check-in used a controlled SQL time fixture.','No camera, browser UI or device acceptance covered by this script.']};
  fs.mkdirSync(path.join(root,'docs/evidence'),{recursive:true});
  fs.writeFileSync(path.join(root,'docs/evidence/2026-11-19-cloud-tests.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log(`${checks.filter(item=>item.passed).length}/${checks.length} hosted checks passed; synthetic fixtures cleaned: ${cleanupSucceeded}`);
}
