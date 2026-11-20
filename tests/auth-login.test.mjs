import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
const source=fs.readFileSync(new URL("../client/src/screens/AuthScreens.tsx",import.meta.url),"utf8");
const start=source.indexOf("  const handleLoginPress = async");
const end=source.indexOf("\n  return (",start);
assert.ok(start>=0&&end>start,"Login submit handler must be available");
const handler=source.slice(start,end);
async function submit({email="admin",signInClinic=async()=>({role:"patient"}),loading=false}={}){
 const result={entered:null,error:"",loading:[],target:null};
 const context={email,password:"test-password",loading,CLOUD_MODE:true,Error,
 setEmailError:()=>{},setPasswordError:e=>{result.error=e;},setLoading:v=>result.loading.push(v),
 signInClinic:async(target,password)=>{result.target=target;return signInClinic(target,password);},
 detectRoleFromEmail:()=>"admin",onLoginSuccess:(role,email)=>{result.entered={role,email};}};
 await vm.runInNewContext(handler+";handleLoginPress()",context);return result;
}
test("rejected password must never open a portal",async()=>{const r=await submit({signInClinic:async()=>{throw Error("Email hoặc mật khẩu không đúng.");}});assert.equal(r.entered,null);assert.match(r.error,/mật khẩu/);assert.deepEqual(r.loading,[true,false]);});
test("network failure must not fall back to a demo administrator",async()=>{const r=await submit({signInClinic:async()=>{throw Error("Network unavailable");}});assert.equal(r.entered,null);assert.equal(r.error,"Network unavailable");});
test("authenticated profile determines role even for an administrator alias",async()=>{const r=await submit();assert.equal(r.entered.role,"patient");});
test("doctor alias authenticates the mapped account before navigation",async()=>{const r=await submit({email:"bs.duc",signInClinic:async()=>({role:"doctor"})});assert.equal(r.target,"bacsi.duc@medicare.example.com");assert.equal(r.entered.role,"doctor");});
test("pending login ignores another submission",async()=>{const r=await submit({loading:true});assert.equal(r.target,null);assert.equal(r.entered,null);});
