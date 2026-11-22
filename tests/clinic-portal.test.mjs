import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import {stripTypeScriptTypes} from 'node:module';
const root=new URL('../',import.meta.url);
const read=file=>fs.readFileSync(new URL(file,root),'utf8');
const clean=s=>stripTypeScriptTypes(s.replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g,'')).replace(/export\s+/g,'');
const auth=vm.runInNewContext(clean(read('client/src/utils/clinicAuthRouting.ts'))+';({routeForClinicRole,parseClinicAuthCallback})',{URL,URLSearchParams});
test('auth uses profile role for all portals and refuses an unknown role',()=>{
 for(const [role,route] of [['patient','main'],['doctor','doctorPortal'],['admin','adminPortal'],['reception','adminPortal']])assert.equal(auth.routeForClinicRole(role),route);
 assert.throws(()=>auth.routeForClinicRole('unverified'));
});
test('OAuth callback accepts only the app callback origin and complete credentials',()=>{
 assert.equal(auth.parseClinicAuthCallback('https://example.test/auth-callback?code=qa'),null);
 assert.equal(auth.parseClinicAuthCallback('otherapp://auth-callback?code=qa'),null);
 assert.equal(auth.parseClinicAuthCallback('medicareplus://auth-callback/other?code=qa'),null);
 assert.equal(auth.parseClinicAuthCallback('medicareplus://auth-callback#access_token=qa'),null);
 assert.equal(auth.parseClinicAuthCallback('medicareplus://auth-callback?code=qa').code,'qa');
 const parsed=auth.parseClinicAuthCallback('medicareplus://auth-callback#access_token=qa&refresh_token=qa-refresh');
 assert.equal(parsed.refreshToken,'qa-refresh');
 assert.throws(()=>auth.parseClinicAuthCallback('medicareplus://auth-callback?error=access_denied'));
});
const declarations=read('client/src/context/AppContext.tsx');
function contextFunction(name,next,env){const begin=declarations.indexOf('  const '+name+' =');const end=declarations.indexOf('  const '+next+' =',begin);assert.ok(begin>=0&&end>begin);return vm.runInNewContext(stripTypeScriptTypes(declarations.slice(begin,end))+';'+name,env);}
const scenarios=[
 ['updatePatientProfile','saveDoctorSchedule','updateClinicProfile','setCloudProfile',[{name:'Patient QA',avatar:'qa-avatar'}]],
 ['saveDoctorSchedule','deleteDoctorSchedule','upsertDoctorScheduleCloud','setDoctorSchedules',[{doctorId:'doc-1',workDate:'2026-11-23',shift:'morning',room:'QA'}]],
 ['deleteDoctorSchedule','saveBhytConfig','deleteDoctorScheduleCloud','setDoctorSchedules',['qa']],
 ['saveBhytConfig','toggleBhytConfig','upsertBhytConfigCloud','setBhytConfigs',[{id:'qa',prefixCode:'DN',groupName:'QA group',inNetworkRate:80,outNetworkRate:40,active:true}]],
 ['deleteBhytConfig','resetAppData','deleteBhytConfigCloud','setBhytConfigs',['qa']],
 ['moderateDoctorReview','deleteDoctorReview','moderateDoctorReviewCloud','setDoctorReviews',['qa',true,'note']],
 ['deleteDoctorReview','addDoctor','deleteDoctorReviewCloud','setDoctorReviews',['qa']],
 ['updateFamilyMember','deleteFamilyMember','updateFamilyMemberCloud','setFamilyMembers',['fam-1',{name:'Member QA',dob:'01/01/2020',relation:'Con cái',bhyt:'TE1'}]],
];
for(const [name,next,service,setter,args] of scenarios)test(name+' does not overwrite a different session after pending save',async()=>{
 const ref={current:'patient-a'};let writes=0;
 const invoke=contextFunction(name,next,{CLOUD_MODE:true,cloudUserIdRef:ref,[service]:async()=>{ref.current='patient-b';return {id:'qa'};},[setter]:()=>{writes++;}});
 await assert.rejects(invoke(...args));assert.equal(writes,0);
});
test('avatar-only profile update preserves an omitted phone and supplies initiating owner',async()=>{
 let payload,owner;const invoke=contextFunction('updatePatientProfile','saveDoctorSchedule',{CLOUD_MODE:true,cloudUserIdRef:{current:'patient-a'},updateClinicProfile:async(value,id)=>{payload=value;owner=id;return {id};},setCloudProfile:()=>{}});
 await invoke({name:'Patient QA',avatar:'qa-avatar'});assert.equal(payload.phone,undefined);assert.equal(owner,'patient-a');
});
function service(file,names,client){return vm.runInNewContext(clean(read(file))+';({'+names.join(',')+'})',{CLOUD_MODE:true,getSupabase:()=>client});}
test('editing a shift updates its id instead of creating a new date/shift row',async()=>{
 let updatedId,payload;const table={update:p=>{payload=p;return table;},eq:(column,id)=>{updatedId=id;return table;},select:()=>table,single:async()=>({data:{id:updatedId,...payload},error:null}),upsert:()=>{throw Error('Should update existing id');}};
 const api=service('client/src/services/clinicAdmin.ts',['upsertDoctorScheduleCloud'],{from:()=>table});
 const row=await api.upsertDoctorScheduleCloud({id:'existing',doctorId:'doc-1',workDate:'2026-11-23',shift:'afternoon',room:'QA'});
 assert.equal(updatedId,'existing');assert.equal(row.id,'existing');assert.equal(payload.shift,'afternoon');
});
for(const [file,name] of [['clinicAdmin.ts','deleteDoctorScheduleCloud'],['clinicAdmin.ts','deleteBhytConfigCloud'],['clinicReviews.ts','deleteDoctorReviewCloud'],['clinicFamily.ts','deleteFamilyMemberCloud']])test(name+' rejects a zero-row delete instead of reporting success',async()=>{
 const table={delete:()=>table,eq:()=>table,select:async()=>({data:[],error:null})};const api=service('client/src/services/'+file,[name],{from:()=>table});await assert.rejects(api[name]('missing'));
});
test('updateFamilyMemberCloud updates existing family member medical metadata and computes BHYT badge',async()=>{
 let updatedId,payload;const table={update:p=>{payload=p;return table;},eq:(col,id)=>{updatedId=id;return table;},select:()=>table,single:async()=>({data:{id:updatedId,...payload},error:null})};
 const api=service('client/src/services/clinicFamily.ts',['updateFamilyMemberCloud'],{auth:{getUser:async()=>({data:{user:{id:'patient-a'}},error:null})},from:()=>table});
 const member=await api.updateFamilyMemberCloud('fam-uuid-1',{name:'Nguyễn Bảo Nam',dob:'18/09/2020',relation:'Con cái',bhyt:'TE1 79 234 88190',blood:'O+',gender:'Nam',phone:'0909123456',allergies:'Hải sản',note:'Tiêm nhắc MMR'});
 assert.equal(updatedId,'fam-uuid-1');assert.equal(member.blood,'O+');assert.equal(member.gender,'Nam');assert.equal(member.allergies,'Hải sản');assert.equal(member.badge,'Nhi đồng • BHYT');
});
test('invalid benefit rates are rejected before a network write',async()=>{
 let calls=0;const invoke=contextFunction('saveBhytConfig','toggleBhytConfig',{CLOUD_MODE:true,cloudUserIdRef:{current:'admin'},upsertBhytConfigCloud:async()=>{calls++;}});
 for(const rate of [NaN,Infinity,-1,101,80.5])await assert.rejects(invoke({id:'qa',prefixCode:'DN',groupName:'QA group',inNetworkRate:rate,outNetworkRate:40,active:true}));
 assert.equal(calls,0);
});
test('profile service refuses to write when authentication changed before request',async()=>{
 let writes=0;const api=service('client/src/services/clinicCloud.ts',['updateClinicProfile'],{auth:{getUser:async()=>({data:{user:{id:'patient-b'}},error:null})},from:()=>{writes++;throw Error('Unexpected write');}});
 await assert.rejects(api.updateClinicProfile({full_name:'Patient A'},'patient-a'));assert.equal(writes,0);
});
test('opening an unknown profile does not invent gender or blood type',()=>{
 const source=read('client/src/screens/MainTabScreens.tsx');const begin=source.indexOf('  const openEditProfile =');const end=source.indexOf('  const handleSaveProfile =',begin);let gender,blood;
 const setters={};for(const name of ['Name','Phone','Dob','Emergency','BhytCode','BhytHospital','BhytExpiry','Avatar','Error','ProfileVisible'])setters['setEdit'+name]=()=>{};
 const open=vm.runInNewContext(stripTypeScriptTypes(source.slice(begin,end))+';openEditProfile',{...setters,patientProfile:{name:'QA',gender:'Chưa cập nhật',bloodType:'Chưa cập nhật'},PATIENT_PROFILE:{avatar:'qa-placeholder'},setEditGender:value=>{gender=value;},setEditBloodType:value=>{blood=value;},setEditProfileVisible:()=>{}});
 open();assert.equal(gender,'');assert.equal(blood,'');
});
test('addFamilyMemberCloud and updateFamilyMemberCloud reject instead of dropping gender, phone, and allergies when schema columns are missing',async()=>{
 let insertCount=0,updateCount=0;
 const missingColumnError={code:'42703',message:'column "allergies" of relation "clinic_family_members" does not exist'};
 const table={
  insert:()=>{insertCount++;return table;},
  update:()=>{updateCount++;return table;},
  eq:()=>table,
  select:()=>table,
  single:async()=>({data:null,error:missingColumnError}),
 };
 const api=service('client/src/services/clinicFamily.ts',['addFamilyMemberCloud','updateFamilyMemberCloud'],{
  auth:{getUser:async()=>({data:{user:{id:'patient-a'}},error:null})},
  from:()=>table,
 });
 await assert.rejects(
  api.addFamilyMemberCloud({name:'Nguyễn Bảo Nam',dob:'18/09/2020',relation:'Con cái',bhyt:'TE1',gender:'Nam',phone:'0909123456',allergies:'Penicillin'}),
  /migration/i
 );
 await assert.rejects(
  api.updateFamilyMemberCloud('fam-1',{name:'Nguyễn Bảo Nam',dob:'18/09/2020',relation:'Con cái',bhyt:'TE1',gender:'Nam',phone:'0909123456',allergies:'Penicillin'}),
  /migration/i
 );
 assert.equal(insertCount,1);
 assert.equal(updateCount,1);
});
test('sendConsultMessageCloud rejects when Supabase insert fails and never creates a local fallback or broadcast',async()=>{
 let cacheWrites=0,channelCalls=0;
 const chatApi=vm.runInNewContext(clean(read('client/src/services/clinicChat.ts'))+';({sendConsultMessageCloud})', {
  CLOUD_MODE:true,
  AsyncStorage:{getItem:async()=>null,setItem:async()=>{cacheWrites++;}},
  getSupabase:()=>({
   auth:{getUser:async()=>({data:{user:{id:'patient-a'}},error:null})},
   channel:()=>{channelCalls++;throw Error('Must not open broadcast channel on send');},
   from:()=>({
    insert:()=>({
     select:()=>({
      single:async()=>({data:null,error:{code:'42501',message:'new row violates row-level security policy'}}),
     }),
    }),
   }),
  }),
 });
 await assert.rejects(
  chatApi.sendConsultMessageCloud({
   doctorId:'doc-1',
   content:'Xin chào bác sĩ',
   senderRole:'patient',
   senderName:'Thanh Vũ',
  })
 );
 assert.equal(cacheWrites,0);
 assert.equal(channelCalls,0);
});
test('subscribeConsultMessagesCloud scopes postgres_changes per conversation and never trusts unverified broadcast payloads',()=>{
 const channels=[];
 const handlers=[];
 let updates=0;
 const chatApi=vm.runInNewContext(clean(read('client/src/services/clinicChat.ts'))+';({subscribeConsultMessagesCloud})', {
  CLOUD_MODE:true,
  setInterval:()=>1,
  clearInterval:()=>{},
  AsyncStorage:{getItem:async()=>null,setItem:async()=>{throw Error('Must not cache unverified realtime payload');}},
  getSupabase:()=>({
   channel:(name)=>{
    const ch={
     name,
     on:(type,filter,cb)=>{handlers.push({type,filter,cb});return ch;},
     subscribe:()=>ch,
    };
    channels.push(ch);
    return ch;
   },
   removeChannel:async()=>{},
  }),
 });
 const unsub=chatApi.subscribeConsultMessagesCloud(()=>{updates++;},{doctorId:'doc-2',patientId:'patient-a'});
 assert.equal(channels.length,1);
 assert.match(channels[0].name,/doc-doc-2:pat-patient-a/);
 assert.equal(handlers.length,1);
 assert.equal(handlers[0].type,'postgres_changes');
 assert.equal(handlers[0].filter.filter,'patient_id=eq.patient-a');
 handlers[0].cb({new:{doctor_id:'doc-other',patient_id:'patient-a'}});
 assert.equal(updates,0);
 handlers[0].cb({new:{doctor_id:'doc-2',patient_id:'patient-a'}});
 assert.equal(updates,1);
 unsub();
});
test('resolveConsultDoctor prioritizes newly selected doctor over previous booking doctor',()=>{
 const chatApi=vm.runInNewContext(clean(read('client/src/services/clinicChat.ts'))+';({resolveConsultDoctor})',{});
 const previousBookingDoc={id:'doc-1',name:'BS. Cũ'};
 const newlySelectedDoc={id:'doc-2',name:'BS. Mới'};
 const fallbackDoc={id:'doc-0',name:'BS. Mặc định'};
 const resolved=chatApi.resolveConsultDoctor({
  isDoctorPortalUser:false,
  selectedDoctor:newlySelectedDoc,
  latestBookingDoctor:previousBookingDoc,
  fallbackDoctor:fallbackDoc,
 });
 assert.equal(resolved.id,'doc-2');
});
test('sendBookingConfirmationEmail sends escaped HTML ticket to webhook and rejects on failure or missing config',async()=>{
 const emailApi=vm.runInNewContext(clean(read('client/src/services/clinicEmail.ts'))+';({sendBookingConfirmationEmail,buildBookingEmailPayload})', {
  process:{env:{}},
 });
 const sampleTicket={
  code:'MC-9087523588FE41F9B9356658097059FF',
  doctor:{id:'doc-1',name:'TS. BS. Lê Thu Trang',degree:'Tiến sĩ Y khoa',specialty:'Nội Thần Kinh',hospital:'BV MediCare Plus'},
  dayLabel:'Thứ Hai',
  fullDate:'23/11/2026',
  timeRange:'09:00 - 09:30',
  room:'Phòng 302',
  queueNumber:'Đã xác nhận',
  consultMode:'clinic',
  paymentMethod:'at_clinic_bhyt',
  patientName:'Đặng Vũ <script>',
  patientPhone:'0901234567',
  patientEmail:'vu.dang@example.com',
  symptoms:'Đau đầu & mệt mỏi',
 };
 const payload=emailApi.buildBookingEmailPayload(sampleTicket);
 assert.equal(payload.to_email,'vu.dang@example.com');
 assert.equal(payload.booking_code,'MC-9087523588FE41F9B9356658097059FF');
 assert.ok(!payload.html_body.includes('<script>'));
 assert.ok(payload.html_body.includes('&lt;script&gt;'));
 // Missing config must reject
 await assert.rejects(
  emailApi.sendBookingConfirmationEmail(sampleTicket,{config:{}})
 );
 // Webhook HTTP error must reject
 await assert.rejects(
  emailApi.sendBookingConfirmationEmail(sampleTicket,{
   config:{webhookUrl:'https://script.google.com/macros/s/test/exec'},
   fetchImpl:async()=>({ok:false,status:500,text:async()=>'error'}),
  })
 );
 // Successful webhook call sends POST payload
 let sentUrl,sentBody;
 const result=await emailApi.sendBookingConfirmationEmail(sampleTicket,{
  config:{webhookUrl:'https://script.google.com/macros/s/test/exec'},
  fetchImpl:async(url,init)=>{
   sentUrl=url;
   sentBody=JSON.parse(init.body);
   return {ok:true,status:200,text:async()=>JSON.stringify({ok:true})};
  },
 });
 assert.equal(result.sent,true);
 assert.equal(sentUrl,'https://script.google.com/macros/s/test/exec');
 assert.equal(sentBody.booking_code,'MC-9087523588FE41F9B9356658097059FF');
});

test('webhook must explicitly confirm delivery and a failed acknowledgement remains retryable',async()=>{
 const emailApi=vm.runInNewContext(clean(read('client/src/services/clinicEmail.ts'))+';({sendBookingConfirmationEmail})',{process:{env:{}}});
 const ticket={code:'MC-ACK-QA',patientEmail:'qa@example.invalid',doctor:{name:'QA'}};
 for(const response of ['<html>Script execution error</html>','', '{}', 'null', '[]', '{"ok":false,"error":"Quota exceeded"}', '{"ok":"true"}']) {
  await assert.rejects(emailApi.sendBookingConfirmationEmail(ticket,{config:{webhookUrl:'https://qa.invalid'},isAutoSend:true,fetchImpl:async()=>({ok:true,status:200,text:async()=>response})}));
 }
 let retries=0;
 const result=await emailApi.sendBookingConfirmationEmail(ticket,{config:{webhookUrl:'https://qa.invalid'},isAutoSend:true,fetchImpl:async()=>{retries++;return{ok:true,status:200,text:async()=>'{"ok":true}'};}});
 assert.equal(retries,1);assert.equal(result.sent,true);
});

test('registration verification delegates to Supabase and never trusts client-generated codes',async()=>{
 let request,resendRequest;
 const sdk={auth:{verifyOtp:async p=>{request=p;return{data:{session:{access_token:'qa'},user:{id:'qa'}},error:null};},resend:async p=>{resendRequest=p;return{error:null};}}};
 const api=service('client/src/services/clinicCloud.ts',['verifyClinicRegistrationOtp','resendClinicRegistrationEmail'],sdk,{checkError:e=>{if(e)throw Error(e.message);}});
 await api.verifyClinicRegistrationOtp(' QA@Example.invalid ','482910');
 assert.equal(request.type,'signup');assert.equal(request.email,'qa@example.invalid');assert.equal(request.token,'482910');
 await api.resendClinicRegistrationEmail(' QA@Example.invalid ');assert.equal(resendRequest.type,'signup');
 sdk.auth.verifyOtp=async()=>({data:{session:null,user:null},error:{message:'expired'}});
 await assert.rejects(api.verifyClinicRegistrationOtp('qa@example.invalid','482910'));
});

function patientDataHarness(){
 const raw=read('client/src/screens/ClinicPatientScreens.tsx');
 const source=stripTypeScriptTypes(raw.slice(raw.indexOf('function useClinicData() {'),raw.indexOf('const doctorName=')));
 let owner='patient-a',sIndex=0,rIndex=0,cIndex=0,cleanup,effectDeps;
 const states=[],refs=[],callbacks=[],requests=[];
 const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};};
 const vmEnv={useAppContext:()=>({cloudProfile:owner?{id:owner}:null}),useState:init=>{const i=sIndex++;if(!(i in states))states[i]=init;return[states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];},useRef:init=>{const i=rIndex++;return refs[i]||(refs[i]={current:init});},useCallback:(fn,deps)=>{const i=cIndex++;if(!callbacks[i]||callbacks[i].deps[0]!==deps[0])callbacks[i]={fn,deps};return callbacks[i].fn;},useEffect:(fn,deps)=>{if(!effectDeps||effectDeps[0]!==deps[0]){cleanup?.();effectDeps=deps;cleanup=fn();}},loadClinicProfile:()=>{const d=deferred();requests.push({kind:'profile',owner,...d});return d.promise;},listClinicAppointments:()=>{const d=deferred();requests.push({kind:'rows',owner,...d});return d.promise;},subscribeClinicAppointments:()=>()=>{}};
 const hook=vm.runInNewContext(source+';useClinicData',vmEnv);
 return{render:()=>{sIndex=rIndex=cIndex=0;return hook();},switchTo:id=>{owner=id;},resolve:(id,kind,value)=>{const q=requests.find(x=>x.owner===id&&x.kind===kind&&!x.done);assert.ok(q);q.done=true;q.resolve(value);},unmount:()=>cleanup?.()};
}
const settlePatientData=()=>new Promise(r=>setImmediate(r));
test('cloud records hide previous account immediately and reject its delayed refresh',async()=>{
 const h=patientDataHarness();let v=h.render();await settlePatientData();h.resolve('patient-a','profile',{id:'patient-a'});h.resolve('patient-a','rows',[{id:'a-private'}]);await settlePatientData();v=h.render();assert.equal(v.rows[0].id,'a-private');
 void v.refresh();h.switchTo('patient-b');v=h.render();assert.equal(v.rows.length,0);assert.equal(v.profile,null);await settlePatientData();
 h.resolve('patient-a','profile',{id:'patient-a'});h.resolve('patient-a','rows',[{id:'a-late-private'}]);await settlePatientData();assert.equal(h.render().rows.length,0);
 h.resolve('patient-b','profile',{id:'patient-b'});h.resolve('patient-b','rows',[{id:'b-private'}]);await settlePatientData();assert.equal(h.render().rows[0].id,'b-private');
});
test('cloud records refuse a profile for another authenticated owner',async()=>{
 const h=patientDataHarness();h.render();await settlePatientData();h.resolve('patient-a','profile',{id:'patient-b'});h.resolve('patient-a','rows',[{id:'wrong-user'}]);await settlePatientData();const v=h.render();assert.equal(v.rows.length,0);assert.equal(v.profile,null);assert.ok(v.error);
});
test('cloud records ignore loads completed after screen unmount',async()=>{
 const h=patientDataHarness();h.render();await settlePatientData();h.unmount();h.resolve('patient-a','profile',{id:'patient-a'});h.resolve('patient-a','rows',[{id:'late'}]);await settlePatientData();const v=h.render();assert.equal(v.rows.length,0);assert.equal(v.profile,null);
});
