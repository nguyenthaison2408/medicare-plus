const assert = require('assert');
const app = require('../src/app');
const http = require('http');

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

    // Test 5: Thử đặt lại cùng slot đã được đặt (Kỳ vọng HTTP 409 Conflict)
    console.log('👉 [Test 5]: Kiểm tra ngăn chặn Race Condition (Double-booking test)...');
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

    console.log('\n🎉 TẤT CẢ 5/5 BÀI KIỂM THỬ ĐÃ PASS THÀNH CÔNG! (100% PASS RATE)');
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi kiểm thử:', error);
    server.close();
    process.exit(1);
  }
});
