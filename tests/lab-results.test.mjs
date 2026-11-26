import fs from 'node:fs';import vm from 'node:vm';import {stripTypeScriptTypes} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_LAB_FILE_SIZE_BYTES,
  buildLabStoragePath,
  formatLabFileSize,
  inferLabMimeType,
  isLabImageMime,
  sanitizeStorageFileName,
  validateLabFileMeta,
  validateLabResultForm,
} from '../client/src/utils/labResultValidation.ts';

test('1. File metadata validation accepts valid PDF and medical image files', () => {
  const pdf = validateLabFileMeta('mri-brain.pdf', 'application/pdf', 204800);
  assert.equal(pdf.ok, true);
  if (pdf.ok) assert.equal(pdf.mimeType, 'application/pdf');

  const jpg = validateLabFileMeta('xray.JPG', 'image/jpg', 1024000);
  assert.equal(jpg.ok, true);
  if (jpg.ok) assert.equal(jpg.mimeType, 'image/jpeg');

  const png = validateLabFileMeta('ct-scan.png', '', 500000);
  assert.equal(png.ok, true);
  if (png.ok) assert.equal(png.mimeType, 'image/png');
});

test('2. File metadata validation rejects unsupported formats and empty/oversized files', () => {
  const exe = validateLabFileMeta('payload.exe', 'application/x-msdownload', 1024);
  assert.equal(exe.ok, false);

  const zero = validateLabFileMeta('empty.pdf', 'application/pdf', 0);
  assert.equal(zero.ok, false);

  const tooBig = validateLabFileMeta(
    'huge-dicom.pdf',
    'application/pdf',
    MAX_LAB_FILE_SIZE_BYTES + 1
  );
  assert.equal(tooBig.ok, false);
});

test('3. Form validation enforces title length and file presence', () => {
  assert.equal(validateLabResultForm('A', 'Bình thường', true).ok, false);
  assert.equal(validateLabResultForm('Chụp MRI Sọ não', 'Bình thường', false).ok, false);
  assert.equal(validateLabResultForm('Chụp MRI Sọ não', 'Không có tổn thương', true).ok, true);
});

test('4. Storage path builder sanitizes Vietnamese file names safely', () => {
  const clean = sanitizeStorageFileName('Kết quả X-Quang Phổi (Lần 1).pdf');
  assert.equal(clean.includes(' '), false);
  assert.match(clean, /^[a-zA-Z0-9._-]+$/);

  const path = buildLabStoragePath('apt-123', 'Kết quả MRI.pdf');
  assert.ok(path.startsWith('appointments/apt-123/'));
  assert.ok(path.endsWith('Ket-qua-MRI.pdf'));
});

test('5. File size formatter and MIME helpers produce expected outputs', () => {
  assert.equal(formatLabFileSize(512), '512 B');
  assert.equal(formatLabFileSize(1536), '1.5 KB');
  assert.equal(formatLabFileSize(2 * 1024 * 1024), '2.00 MB');

  assert.equal(isLabImageMime('image/jpeg'), true);
  assert.equal(isLabImageMime('application/pdf'), false);
  assert.equal(inferLabMimeType('doc.webp', ''), 'image/webp');
  assert.equal(inferLabMimeType('doc.docx', ''), null);
});

test('explicit unsupported MIME cannot be disguised by a PDF extension',()=>{
 assert.equal(validateLabFileMeta('payload.pdf','text/html',1024).ok,false);
 assert.equal(validateLabFileMeta('report.pdf','application/octet-stream',1024).ok,true);
});

test('private file authorization failure never reuses a cached signed URL',async()=>{
 const f=labService({storage:{from:()=>({createSignedUrl:async()=>({data:null,error:{message:'Denied'}})})}});
 assert.equal(await f.resolveLabFileUrl('appointments/private/file.pdf','https://old-signed.test'),undefined);
});
test('lab list does not eagerly mint or retain signed file URLs',async()=>{
 let signs=0;const f=labService({storage:{from:()=>({createSignedUrl:async()=>{signs++;return{data:{signedUrl:'cached'}}}})},from:()=>({select:()=>({order:async()=>({data:[{id:'test',file_path:'appointments/test/file.pdf'}],error:null})})})});
 const results=await f.fetchLabResultsCloud('patient');assert.equal(results.length,1);assert.equal(results[0].previewUrl,undefined);assert.equal(signs,0);
});
function labService(client){const code=stripTypeScriptTypes(fs.readFileSync(new URL('../client/src/services/clinicLabResults.ts',import.meta.url),'utf8').replace(/import[\s\S]*?from\s*['"][^'"]+['"];?/g,'')).replace(/export\s+/g,'');return vm.runInNewContext(code+';({resolveLabFileUrl,fetchLabResultsCloud})',{CLOUD_MODE:true,getSupabase:()=>client});}

