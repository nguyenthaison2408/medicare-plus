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
for(const [file,name] of [['clinicAdmin.ts','deleteDoctorScheduleCloud'],['clinicAdmin.ts','deleteBhytConfigCloud'],['clinicReviews.ts','deleteDoctorReviewCloud']])test(name+' rejects a zero-row delete instead of reporting success',async()=>{
 const table={delete:()=>table,eq:()=>table,select:async()=>({data:[],error:null})};const api=service('client/src/services/'+file,[name],{from:()=>table});await assert.rejects(api[name]('missing'));
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
