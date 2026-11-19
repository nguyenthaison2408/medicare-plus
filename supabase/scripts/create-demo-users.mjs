import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {root,adminClient,database} from './cloud-config.mjs';

const privateFile=path.join(root,'.env.demo.local');
if(fs.existsSync(privateFile)) throw new Error('Demo credentials already exist; not creating duplicates or resetting passwords.');
const admin=adminClient();
const db=database();
const roles=[['PATIENT','patient','Bệnh nhân Demo A'],['PATIENT_B','patient','Bệnh nhân Demo B'],
  ['RECEPTION','reception','Tiếp đón Demo'],['DOCTOR','doctor','Bác sĩ Demo'],['ADMIN','admin','Quản trị Demo']];
const lines=['# Synthetic demo accounts only. Keep this file private and out of Git.'];
fs.writeFileSync(privateFile,lines.join('\n')+'\n',{flag:'wx'});
try {
  await db.connect();
  for(const [key,role,name] of roles){
    const email=`demo-${key.toLowerCase().replaceAll('_','-')}@medicare.example.com`;
    const password=crypto.randomBytes(18).toString('base64url')+'Aa1!';
    const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:name,phone:'0901234567'}});
    if(error) throw new Error(`${key}: ${error.message}`);
    fs.appendFileSync(privateFile,`${key}_EMAIL=${email}\n${key}_PASSWORD=${password}\n${key}_USER_ID=${data.user.id}\n`);
    if(role!=='patient') await db.query('update public.clinic_profiles set role=$1,doctor_id=$2 where id=$3',[role,role==='doctor'?'doc-1':null,data.user.id]);
    console.log(`Created synthetic ${role} account; credentials saved privately.`);
  }
} finally {await db.end();}
