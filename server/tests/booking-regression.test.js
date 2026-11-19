const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const app = require('../src/app');

async function main() {
  const server = http.createServer(app);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/v1`;
  let passed = 0;
  const request = async (route, body, method = 'POST') => {
    const response = await fetch(base + route, body === undefined ? undefined : {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  };
  const test = async (name, run) => { await run(); passed++; console.log(`PASS ${passed}: ${name}`); };
  const valid = { slotId: 'slot-05', patientName: 'Test Patient', phone: '0988776655' };
  let booked;
  try {
    await test('health check', async () => assert.equal((await request('/health')).body.status, 'ONLINE'));
    await test('department catalog', async () => assert.ok((await request('/departments')).body.data.length >= 3));
    await test('doctor filter', async () => {
      const { body } = await request('/doctors?departmentId=dept-01');
      assert.ok(body.data.length); assert.ok(body.data.every(doctor => doctor.departmentId === 'dept-01'));
    });
    await test('slot filter', async () => {
      const { body } = await request('/slots?doctorId=doc-02');
      assert.ok(body.data.length); assert.ok(body.data.every(slot => slot.doctorId === 'doc-02'));
    });
    await test('missing required fields', async () => assert.equal((await request('/appointments/book', {})).status, 400));
    await test('short patient name', async () => assert.equal((await request('/appointments/book', { ...valid, patientName: ' x ' })).status, 400));
    await test('non-string patient name', async () => assert.equal((await request('/appointments/book', { ...valid, patientName: {} })).status, 400));
    await test('phone with a prefix/suffix is rejected', async () => assert.equal((await request('/appointments/book', { ...valid, phone: 'bad0988776655bad' })).status, 400));
    await test('pipe character is not a phone prefix', async () => assert.equal((await request('/appointments/book', { ...valid, phone: '0|88776655' })).status, 400));
    await test('non-string phone is rejected', async () => assert.equal((await request('/appointments/book', { ...valid, phone: 988776655 })).status, 400));
    await test('invalid email', async () => assert.equal((await request('/appointments/book', { ...valid, email: 'invalid' })).status, 400));
    await test('non-string email', async () => assert.equal((await request('/appointments/book', { ...valid, email: {} })).status, 400));
    await test('unknown slot', async () => assert.equal((await request('/appointments/book', { ...valid, slotId: 'missing-slot' })).status, 404));
    await test('successful booking normalizes contact details', async () => {
      booked = await request('/appointments/book', { ...valid, patientName: ' Test Patient ', phone: ' 0988776655 ', email: ' test@example.com ' });
      assert.equal(booked.status, 201); assert.equal(booked.body.data.patientName, 'Test Patient');
      assert.equal(booked.body.data.phone, valid.phone); assert.equal(booked.body.data.email, 'test@example.com');
    });
    await test('a second booking on the same slot conflicts', async () => assert.equal((await request('/appointments/book', valid)).status, 409));
    await test('50 concurrent requests: one success and 49 conflicts in the demo process', async () => {
      const results = await Promise.all(Array.from({ length: 50 }, () => request('/appointments/book', { ...valid, slotId: 'slot-06' })));
      assert.equal(results.filter(result => result.status === 201).length, 1);
      assert.equal(results.filter(result => result.status === 409).length, 49);
    });
    await test('missing check-in code', async () => assert.equal((await request('/appointments/check-in', {})).status, 400));
    await test('unknown check-in code', async () => assert.equal((await request('/appointments/check-in', { qrCode: 'missing' })).status, 404));
    await test('valid check-in', async () => {
      const result = await request('/appointments/check-in', { qrCode: booked.body.data.qrCode });
      assert.equal(result.status, 200); assert.equal(result.body.data.status, 'CHECKED_IN');
    });
    await test('save a medical record', async () => {
      const result = await request(`/appointments/${booked.body.data.id}/medical-record`, { diagnosis: 'Test diagnosis', medications: [] });
      assert.equal(result.status, 200); assert.equal(result.body.data.status, 'COMPLETED');
    });
    await test('completed appointments cannot check in again', async () => assert.equal((await request('/appointments/check-in', { qrCode: booked.body.data.qrCode })).status, 400));
    console.log(`\n${passed}/21 regression checks passed. This suite does not verify hosted PostgreSQL or RLS.`);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
