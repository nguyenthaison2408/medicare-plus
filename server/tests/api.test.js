
const assert = require('assert');
const app = require('../src/app');
const http = require('http');
const { setPayOSClient } = require('../src/controllers/paymentController');
const clinicOrders = require('../src/services/clinicPayosOrders');

const payosRequests = [];
const providerPayments = new Map();
setPayOSClient({
  paymentRequests: {
    create: async (data) => {
      payosRequests.push(data);
      return {
        checkoutUrl: 'https://pay.payos.vn/web/mock-test-order',
        qrCode: 'test-qr-payload',
      };
    },
    get: async (orderCode) => providerPayments.get(orderCode)
  },
  webhooks: {
    verify: async (body) => {
      if (body.signature !== 'test-signature') throw new Error('Invalid signature');
      return body.data;
    }
  }
});

console.log('🧪 Đang chạy bộ kiểm thử tự động API (MediCare Plus Automated Test Suite)...');

const server = http.createServer(app);

server.listen(5099, async () => {
  const baseUrl = 'http://localhost:5099/api/v1';

  try {
    // Test 1: Health check
    console.log('👉 [Test 1]: Kiểm tra endpoint /health...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();

    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthData.status, 'ONLINE');

    console.log('   ✅ Test 1 Passed: Health endpoint hoạt động bình thường.');

    // Test 2: Lấy danh mục chuyên khoa
    console.log('👉 [Test 2]: Kiểm tra danh mục chuyên khoa /departments...');
    const deptRes = await fetch(`${baseUrl}/departments`);
    const deptData = await deptRes.json();

    assert.strictEqual(deptRes.status, 200);
    assert.strictEqual(Array.isArray(deptData.data), true);
    assert.strictEqual(deptData.data.length >= 3, true);

    console.log(`   ✅ Test 2 Passed: Tải thành công ${deptData.data.length} chuyên khoa.`);

    // Test 3: Lấy danh sách bác sĩ
    console.log('👉 [Test 3]: Kiểm tra danh sách bác sĩ /doctors...');
    const docRes = await fetch(`${baseUrl}/doctors`);
    const docData = await docRes.json();

    assert.strictEqual(docRes.status, 200);
    assert.strictEqual(docData.data.length >= 2, true);

    console.log(`   ✅ Test 3 Passed: Tải thành công ${docData.data.length} bác sĩ.`);

    // Test 4: Đặt lịch hẹn và kiểm tra khóa slot
    console.log('👉 [Test 4]: Kiểm tra luồng đặt lịch khám & phòng chống trùng lịch...');
    const bookRes = await fetch(`${baseUrl}/appointments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: 'slot-05',
        patientName: 'Kiểm Thử Viên Tự Động',
        phone: '0988776655',
        email: 'tester@medicare.vn',
        symptoms: 'Thử nghiệm hệ thống CI/CD'
      })
    });

    const bookData = await bookRes.json();

    assert.strictEqual(bookRes.status, 201);
    assert.strictEqual(bookData.success, true);
    assert.ok(bookData.data.id);

    console.log(`   ✅ Test 4 Passed: Đặt lịch thành công với mã hẹn ${bookData.data.id}.`);

    // Test 5: Thử đặt lại cùng slot đã được đặt
    console.log('👉 [Test 5]: Kiểm tra ngăn chặn đặt lịch trùng (Double-booking test)...');
    const conflictRes = await fetch(`${baseUrl}/appointments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: 'slot-05',
        patientName: 'Người Đặt Trùng Giờ',
        phone: '0977112233'
      })
    });

    assert.strictEqual(conflictRes.status, 409);

    console.log('   ✅ Test 5 Passed: Hệ thống trả về HTTP 409 Conflict chính xác.');

    // Test 6: Lấy danh sách khung giờ khám
    console.log('👉 [Test 6]: Kiểm tra danh sách khung giờ /slots...');
    const slotsRes = await fetch(`${baseUrl}/slots`);
    const slotsData = await slotsRes.json();

    assert.strictEqual(slotsRes.status, 200);
    assert.strictEqual(slotsData.success, true);
    assert.ok(Array.isArray(slotsData.data));

    console.log(`   ✅ Test 6 Passed: Tải thành công ${slotsData.data.length} khung giờ.`);

    // Test 7: Lấy danh sách lịch hẹn
    console.log('👉 [Test 7]: Kiểm tra danh sách lịch hẹn /appointments...');
    const appointmentsRes = await fetch(`${baseUrl}/appointments`);
    const appointmentsData = await appointmentsRes.json();

    assert.strictEqual(appointmentsRes.status, 200);
    assert.strictEqual(appointmentsData.success, true);
    assert.ok(Array.isArray(appointmentsData.data));
    assert.strictEqual(
      appointmentsData.count,
      appointmentsData.data.length
    );

    console.log(`   ✅ Test 7 Passed: Tải thành công ${appointmentsData.count} lịch hẹn.`);

    // Test 8: Kiểm tra validation khi thiếu slotId
    console.log('👉 [Test 8]: Kiểm tra đặt lịch thiếu slotId...');
    const invalidBookingRes = await fetch(`${baseUrl}/appointments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName: 'Nguyen Van A',
        phone: '0988776655'
      })
    });

    const invalidBookingData = await invalidBookingRes.json();

    assert.strictEqual(invalidBookingRes.status, 400);
    assert.strictEqual(invalidBookingData.success, false);

    console.log('   ✅ Test 8 Passed: Hệ thống từ chối đặt lịch thiếu slotId.');

    // Test 9: Check-in bằng mã QR không tồn tại
    console.log('👉 [Test 9]: Kiểm tra check-in bằng mã QR không tồn tại...');
    const invalidQRRes = await fetch(`${baseUrl}/appointments/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrCode: 'INVALID-QR-QA-TEST'
      })
    });

    const invalidQRData = await invalidQRRes.json();

    assert.strictEqual(invalidQRRes.status, 404);
    assert.strictEqual(invalidQRData.success, false);

    console.log('   ✅ Test 9 Passed: Hệ thống từ chối mã QR không tồn tại.');

    // Test 10: Lưu hồ sơ khám với mã lịch hẹn không tồn tại
    console.log('👉 [Test 10]: Kiểm tra lưu hồ sơ với mã lịch hẹn không tồn tại...');
    const invalidRecordRes = await fetch(
      `${baseUrl}/appointments/QA-NOT-FOUND-999/medical-record`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosis: 'QA Test',
          medications: [],
          notes: 'Negative test'
        })
      }
    );

    const invalidRecordData = await invalidRecordRes.json();

    assert.strictEqual(invalidRecordRes.status, 404);
    assert.strictEqual(invalidRecordData.success, false);

    console.log('   ✅ Test 10 Passed: Hệ thống từ chối mã lịch hẹn không tồn tại.');

    // Test 11: PayOS - Tạo link thanh toán VietQR
    console.log('👉 [Test 11]: Kiểm tra tạo link thanh toán VietQR PayOS /payments/create-payment-link...');
    const payRes = await fetch(`${baseUrl}/payments/create-payment-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 350000,
        description: 'TEST MEDICARE',
        patientName: 'Nguyen Van Test',
        patientPhone: '0988776655'
      })
    });
    const payData = await payRes.json();
    assert.strictEqual(payRes.status, 200);
    assert.strictEqual(payData.success, true);
    assert.ok(payData.data.orderCode);
    assert.ok(payData.data.checkoutUrl);
    assert.strictEqual(payData.data.amount, 350000);
    assert.strictEqual(payosRequests.at(-1).amount, 350000);

    const requestPayment = (amount) => fetch(`${baseUrl}/payments/create-payment-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    const secondRes = await requestPayment(250000);
    const second = (await secondRes.json()).data;
    assert.strictEqual(second.amount, 250000);
    assert.strictEqual(payosRequests.at(-1).amount, 250000);
    assert.strictEqual((await requestPayment(0)).status, 400);
    assert.strictEqual(payosRequests.length, 2);

    const statusOf = async (code) => {
      const res = await fetch(`${baseUrl}/payments/status/${code}`);
      return (await res.json()).data.status;
    };
    providerPayments.set(second.orderCode, {
      orderCode: second.orderCode, status: 'PAID', amount: 250000,
      amountPaid: 249000, amountRemaining: 1000,
    });
    assert.strictEqual(await statusOf(second.orderCode), 'PENDING');
    providerPayments.set(second.orderCode, {
      orderCode: second.orderCode, status: 'PAID', amount: 250000,
      amountPaid: 250000, amountRemaining: 0,
    });
    assert.strictEqual(await statusOf(second.orderCode), 'PAID');
    assert.ok(payData.data.qrCode);
    console.log(`   ✅ Test 11 Passed: Tạo VietQR PayOS thành công với OrderCode ${payData.data.orderCode}.`);

    // Test 12: PayOS - Tra cứu trạng thái đơn hàng khi vừa tạo
    console.log('👉 [Test 12]: Kiểm tra trạng thái đơn hàng PayOS /payments/status/:orderCode...');
    const statusRes = await fetch(`${baseUrl}/payments/status/${payData.data.orderCode}`);
    const statusData = await statusRes.json();
    assert.strictEqual(statusRes.status, 200);
    assert.strictEqual(statusData.success, true);
    assert.strictEqual(statusData.data.orderCode, payData.data.orderCode);
    assert.strictEqual(statusData.data.status, 'PENDING');
    console.log(`   ✅ Test 12 Passed: Tra cứu trạng thái thành công (Status: ${statusData.data.status}).`);

    // Test 13: PayOS - Giả lập Webhook thanh toán thành công
    console.log('👉 [Test 13]: Kiểm tra Webhook PayOS cập nhật trạng thái đơn hàng...');
    const sendWebhook = (signature, amount) => fetch(`${baseUrl}/payments/payos-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: '00',
        desc: 'success',
        data: {
          orderCode: payData.data.orderCode,
          amount,
          code: '00',
          description: 'TEST MEDICARE',
          accountNumber: payData.data.accountNumber,
          reference: 'FT2400000000',
          transactionDateTime: new Date().toISOString()
        },
        signature,
      })
    });
    assert.strictEqual((await sendWebhook('invalid', 350000)).status, 400);
    assert.strictEqual(await statusOf(payData.data.orderCode), 'PENDING');
    assert.strictEqual((await sendWebhook('test-signature', 1000)).status, 200);
    assert.strictEqual(await statusOf(payData.data.orderCode), 'PENDING');
    const webhookRes = await sendWebhook('test-signature', 350000);
    const webhookData = await webhookRes.json();
    assert.strictEqual(webhookRes.status, 200);
    assert.strictEqual(webhookData.success, true);
    console.log('   ✅ Test 13 Passed: Webhook xử lý cập nhật trạng thái thành công.');

    // Test 14: PayOS - Kiểm tra đơn hàng đã chuyển sang PAID sau webhook
    console.log('👉 [Test 14]: Xác nhận trạng thái đơn hàng đã đổi thành PAID...');
    const paidStatusRes = await fetch(`${baseUrl}/payments/status/${payData.data.orderCode}`);
    const paidStatusData = await paidStatusRes.json();
    assert.strictEqual(paidStatusRes.status, 200);
    assert.strictEqual(paidStatusData.data.status, 'PAID');
    assert.ok(paidStatusData.data.paidAt);
    console.log('   ✅ Test 14 Passed: Trạng thái đơn hàng đã chuyển sang PAID chuẩn xác.');

    const cloudOrders = new Map();
    clinicOrders.getPatient = async (token) => ['patient-a', 'patient-b'].includes(token) ? token : null;
    clinicOrders.getDoctorFee = async () => 350000;
    clinicOrders.isSlotAvailable = async () => true;
    clinicOrders.createOrder = async (order) => cloudOrders.set(order.order_code, order);
    clinicOrders.getOrder = async (code) => cloudOrders.get(code);
    clinicOrders.markPaid = async (code) => {
      const order = cloudOrders.get(code);
      order.paid_at = new Date().toISOString();
      return order.paid_at;
    };
    const createCloudPayment = (amount) => fetch(`${baseUrl}/payments/create-payment-link`, {
      method: 'POST',
      headers: { Authorization: 'Bearer patient-a', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        doctorId: 'doc-1',
        startsAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
    assert.strictEqual((await createCloudPayment(1000)).status, 409);
    assert.strictEqual(cloudOrders.size, 0);
    const cloudRes = await createCloudPayment(350000);
    assert.strictEqual(cloudRes.status, 200);
    const cloudCode = (await cloudRes.json()).data.orderCode;
    const cloudStatus = (token) => fetch(`${baseUrl}/payments/status/${cloudCode}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual((await cloudStatus('patient-b')).status, 404);
    assert.strictEqual((await (await cloudStatus('patient-a')).json()).data.status, 'PENDING');
    providerPayments.set(cloudCode, {
      orderCode: cloudCode, status: 'PAID', amount: 350000,
      amountPaid: 350000, amountRemaining: 0,
    });
    assert.strictEqual((await (await cloudStatus('patient-a')).json()).data.status, 'PAID');
    assert.ok(cloudOrders.get(cloudCode).paid_at);
    console.log('   ✅ Test 15 Passed: PayOS Cloud validates the fee and records verified payment.');
    const cloudWebhookRes = await createCloudPayment(350000);
    const webhookOrder = (await cloudWebhookRes.json()).data.orderCode;
    let cloudMarks = 0;
    const markPaid = clinicOrders.markPaid;
    clinicOrders.markPaid = async code => { cloudMarks++; return markPaid(code); };
    const deliver = (data, signature = 'test-signature') => fetch(baseUrl+'/payments/payos-webhook', {
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,signature})
    });
    assert.strictEqual((await deliver({orderCode:webhookOrder,code:'00',amount:350000},'bad')).status,400);
    assert.strictEqual((await deliver({orderCode:webhookOrder,code:'00',amount:1000})).status,200);
    assert.strictEqual((await deliver({orderCode:webhookOrder,code:'01',amount:350000})).status,200);
    assert.strictEqual(cloudMarks,0);
    clinicOrders.markPaid = async () => {throw new Error('Simulated storage outage');};
    assert.strictEqual((await deliver({orderCode:webhookOrder,code:'00',amount:350000})).status,500);
    assert.ok(!cloudOrders.get(webhookOrder).paid_at);
    clinicOrders.markPaid = async code => {cloudMarks++;return markPaid(code);};
    assert.strictEqual((await deliver({orderCode:webhookOrder,code:'00',amount:350000})).status,200);
    assert.ok(cloudOrders.get(webhookOrder).paid_at);
    assert.strictEqual((await deliver({orderCode:webhookOrder,code:'00',amount:350000})).status,200);
    assert.strictEqual(cloudMarks,1);
    console.log('   PASS: signed cloud webhook persists payment without polling, retries failures and is idempotent.');


    // Tổng kết kết quả
    console.log('\n🎉 TẤT CẢ 15/15 BÀI KIỂM THỬ ĐÃ PASS THÀNH CÔNG! (100% PASS RATE)');

    server.closeAllConnections?.();
    server.close(() => {
      setTimeout(() => process.exit(0), 100);
    });

  } catch (error) {
    console.error('❌ Lỗi kiểm thử:', error);
    server.closeAllConnections?.();
    server.close(() => {
      setTimeout(() => process.exit(1), 100);
    });
  }
});


