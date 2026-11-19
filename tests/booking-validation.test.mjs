import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizePatientBookingInfo,validatePatientBookingInfo} from '../client/src/utils/bookingValidation.ts';
const valid={fullName:'Nguyễn Văn An',phone:'0901234567',email:'patient@example.com',symptoms:'Đau đầu kéo dài'};
test('Vietnamese patient information is valid',()=>{assert.deepEqual(validatePatientBookingInfo(valid),{});});
test('formatted contact details normalize before validation',()=>{
  const input={...valid,fullName:'  Nguyễn   Văn An ',phone:'090.123-4567',email:' Patient+tag@Example.COM ',symptoms:'  Đau đầu   kéo dài  '};
  assert.deepEqual(normalizePatientBookingInfo(input),{...valid,email:'patient+tag@example.com'});
  assert.deepEqual(validatePatientBookingInfo(input),{});
});
test('all four fields report missing information',()=>{assert.deepEqual(Object.keys(validatePatientBookingInfo({fullName:'',phone:'',email:'',symptoms:''})).sort(),Object.keys(valid).sort());});
test('patient name, phone and email reject malformed input independently',()=>{
  for(const [field,value] of [['fullName','Patient 123'],['fullName','x'.repeat(161)],['phone','bad0901234567bad'],['phone','0|01234567'],['email','a@b'],['email','a'.repeat(255)+'@example.com']]) {
    assert.ok(validatePatientBookingInfo({...valid,[field]:value})[field]);
  }
});
test('symptom length boundaries are enforced',()=>{
  for(const length of [4,1001])assert.ok(validatePatientBookingInfo({...valid,symptoms:'x'.repeat(length)}).symptoms);
  for(const length of [5,1000])assert.equal(validatePatientBookingInfo({...valid,symptoms:'x'.repeat(length)}).symptoms,undefined);
});
