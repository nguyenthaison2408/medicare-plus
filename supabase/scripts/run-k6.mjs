import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {root,projectUrl,newClient,adminClient,database} from './cloud-config.mjs';
const binary=process.argv[2];
if(!binary||!fs.existsSync(binary))throw new Error('Pass the path to an official Grafana k6 executable.');
const envText=fs.readFileSync(path.join(root,'client/.env.local'),'utf8');
const publicKey=envText.match(/^EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)$/m)?.[1].trim();
const db=database();const admin=adminClient();const patient=newClient();
let userId;let failed=false;
try{
  await db.connect();
  const {rows:[date]}=await db.query("select ((now() at time zone 'Asia/Ho_Chi_Minh')::date+7)::text as day");
  const startsAt=`${date.day}T08:00:00+07:00`;
  const {rows:[slot]}=await db.query("select count(*)::int as occupied from public.clinic_appointments where doctor_id='doc-4' and starts_at=$1 and status<>'CANCELLED'",[startsAt]);
  if(slot.occupied)throw new Error('The isolated test slot is occupied; choose another test date.');
  const email=`k6-${crypto.randomBytes(5).toString('hex')}@example.com`;
  const password=crypto.randomBytes(20).toString('base64url')+'Aa1!';
  const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:'Synthetic k6 patient',phone:'0901234567'}});
  if(created.error)throw created.error;userId=created.data.user.id;
  const login=await patient.auth.signInWithPassword({email,password});if(login.error)throw login.error;
  const artifactRoot=path.join(root,'docs/evidence');fs.mkdirSync(artifactRoot,{recursive:true});
  for(const script of ['catalog-100vu','booking-contention']){
    try {execFileSync(binary,['run','--no-usage-report',path.join(root,`tests/k6/${script}.js`)],{
      cwd:root,windowsHide:true,stdio:'inherit',timeout:90000,
      env:{...process.env,PROJECT_URL:projectUrl,PUBLIC_KEY:publicKey,TEST_DATE:date.day,STARTS_AT:startsAt,
        AUTH_TOKEN:login.data.session.access_token,OUTPUT_BASE:path.join(artifactRoot,`2026-11-19-k6-${script}`)},
    });}catch{failed=true;}
  }
}catch(error){console.error(error.message);failed=true;}
finally{
  if(userId){await db.query('delete from public.clinic_appointments where patient_id=$1',[userId]);
    const removed=await admin.auth.admin.deleteUser(userId);if(removed.error){console.error('Could not clean the synthetic k6 user.');failed=true;}}
  await patient.auth.signOut({scope:'local'});await db.end();
}
if(failed)process.exitCode=1;
