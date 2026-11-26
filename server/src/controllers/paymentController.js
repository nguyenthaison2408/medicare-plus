const fs = require('fs');
const path = require('path');
const { randomBytes } = require('node:crypto');
const { PayOS } = require('@payos/node');
const { appointments } = require('../data/mockData');
const clinicOrders = require('../services/clinicPayosOrders');

// Hàm hỗ trợ nạp biến môi trường nếu chưa được nạp
function ensureEnvLoaded() {
  if (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY) {
    return;
  }
  const candidatePaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../server/.env'),
    path.resolve(process.cwd(), 'server/.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      try {
        if (typeof process.loadEnvFile === 'function') {
          process.loadEnvFile(envPath);
        } else {
          const content = fs.readFileSync(envPath, 'utf8');
          for (const line of content.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
              const eqIdx = trimmed.indexOf('=');
              if (eqIdx > 0) {
                const key = trimmed.substring(0, eqIdx).trim();
                const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
                if (!process.env[key]) {
                  process.env[key] = val;
                }
              }
            }
          }
        }
      } catch (err) {
        // Tiếp tục thử đường dẫn khác
      }
    }
  }
}

let payosInstance = null;

/**
 * Khởi tạo PayOS client với cơ chế lazy-init an toàn
 */
function getPayOSClient() {
  if (payosInstance) return payosInstance;
  ensureEnvLoaded();

  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    return null;
  }

  try {
    payosInstance = new PayOS({
      clientId,
      apiKey,
      checksumKey,
      partnerCode: process.env.PAYOS_PARTNER_CODE,
    });
    return payosInstance;
  } catch (err) {
    console.warn('[PayOS] Warning: PayOS could not be initialized:', err.message);
    return null;
  }
}

// In-memory store for orders: orderCode -> { orderCode, appointmentId, amount, status: 'PENDING' | 'PAID', paidAt }
const orders = new Map();

/**
 * Chuẩn hóa nội dung chuyển khoản theo chuẩn VietQR PayOS (tối đa 25 ký tự, chữ cái và số)
 */
function sanitizeDescription(desc) {
  let clean = (desc || 'KHAM MEDICARE')
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .slice(0, 25);
  return clean || 'KHAM MEDICARE';
}

/**
 * Tạo link thanh toán VietQR qua PayOS
 */
const createPaymentLink = async (req, res) => {
  try {
    const payos = getPayOSClient();
    if (!payos) {
      return res.status(500).json({
        success: false,
        message: 'Cổng thanh toán PayOS chưa được cấu hình khóa trên máy chủ.'
      });
    }

    const { appointmentId, amount, description, patientName, patientPhone, doctorId, startsAt } = req.body;
    
    // PayOS requires orderCode as positive integer (<= 9007199254740991)
    const orderCode = randomBytes(6).readUIntBE(0, 6) || 1;
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền phải là số nguyên dương.' });
    }
    const finalAmount = amount;
    const cloudBooking = doctorId !== undefined || startsAt !== undefined;
    if (cloudBooking) {
      if (typeof doctorId !== 'string' || !doctorId || typeof startsAt !== 'string' ||
          !Number.isFinite(Date.parse(startsAt)) || Date.parse(startsAt) <= Date.now()) {
        return res.status(400).json({ success: false, message: 'Thông tin lịch khám không hợp lệ.' });
      }
      const token = req.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
      const patientId = await clinicOrders.getPatient(token);
      if (!patientId) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập lại.' });
      if (await clinicOrders.getDoctorFee(doctorId) !== finalAmount) {
        return res.status(409).json({ success: false, message: 'Phí khám đã thay đổi. Vui lòng tải lại thông tin bác sĩ.' });
      }
      if (!await clinicOrders.isSlotAvailable(doctorId, startsAt, token)) {
        return res.status(409).json({ success: false, message: 'Giờ khám không còn khả dụng. Vui lòng chọn lại.' });
      }
      await clinicOrders.createOrder({
        order_code: orderCode, patient_id: patientId, doctor_id: doctorId,
        starts_at: startsAt, amount: finalAmount,
      });
    }
    
    const cleanDesc = sanitizeDescription(description);

    const returnUrl = process.env.PAYOS_RETURN_URL || 'http://localhost:8081';
    const cancelUrl = process.env.PAYOS_CANCEL_URL || 'http://localhost:8081';

    const paymentData = {
      orderCode,
      amount: finalAmount,
      description: cleanDesc,
      returnUrl,
      cancelUrl,
      buyerName: patientName ? patientName.slice(0, 50) : undefined,
      buyerPhone: patientPhone ? patientPhone.slice(0, 20) : undefined,
    };

    const paymentLinkRes = await payos.paymentRequests.create(paymentData);

    // Lưu thông tin đơn để đối soát
    if (!cloudBooking) orders.set(orderCode, {
      orderCode,
      appointmentId,
      amount: finalAmount,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Tạo link thanh toán PayOS thành công.',
      data: {
        orderCode,
        amount: finalAmount,
        checkoutUrl: paymentLinkRes.checkoutUrl,
        qrCode: paymentLinkRes.qrCode,
        accountNumber: paymentLinkRes.accountNumber,
        accountName: paymentLinkRes.accountName,
        bin: paymentLinkRes.bin,
        description: cleanDesc
      }
    });
  } catch (error) {
    console.error('[PayOS createPaymentLink Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo link thanh toán PayOS'
    });
  }
};

/**
 * Xử lý Webhook gửi từ PayOS khi có giao dịch chuyển khoản thành công
 */
const handleWebhook = async (req, res) => {
  try {
    const payos = getPayOSClient();
    if (!payos) {
      return res.status(500).json({ success: false, message: 'PayOS uninitialized' });
    }

    const webhookBody = req.body || {};
    let verifiedData;
    try {
      verifiedData = await payos.webhooks.verify(webhookBody);
    } catch (verifyErr) {
      console.warn('[PayOS Webhook] Signature verification notice:', verifyErr.message);
      return res.status(400).json({ success: false, message: 'Invalid PayOS signature' });
    }

    const orderCode = verifiedData.orderCode;
    const code = verifiedData.code;
    if (!Number.isSafeInteger(orderCode) || orderCode <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid PayOS order code' });
    }
    console.log(`[PayOS Webhook] Nhận thông báo giao dịch cho Order #${orderCode}, mã kết quả:`, code);

    const order = orders.get(Number(orderCode));
    if (order && code === '00' && verifiedData.amount === order.amount) {
      order.status = 'PAID';
      order.paidAt = new Date().toISOString();
      order.webhookPayload = verifiedData;

      if (order.appointmentId) {
        const apt = appointments.find(a => a.id === order.appointmentId);
        if (apt) {
          apt.paymentStatus = 'PAID';
        }
      }
    }

    if (!order && code === '00') {
      const cloudOrder = await clinicOrders.getOrder(orderCode);
      if (cloudOrder && verifiedData.amount === cloudOrder.amount && !cloudOrder.paid_at) {
        await clinicOrders.markPaid(orderCode);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (err) {
    console.error('[PayOS Webhook Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Kiểm tra trạng thái thanh toán (cho Client polling)
 * CÓ CƠ CHẾ DỰ PHÒNG: Nếu webhook chưa kịp tới hoặc bị chặn bởi localhost,
 * server sẽ tự chủ động hỏi trực tiếp API PayOS (payos.paymentRequests.get)!
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { orderCode } = req.params;
    const numOrderCode = Number(orderCode);
    if (!Number.isSafeInteger(numOrderCode) || numOrderCode <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order code' });
    }
    const order = orders.get(numOrderCode);

    if (!order) {
      const token = req.get('Authorization')?.match(/^Bearer (\S+)$/i)?.[1];
      const patientId = await clinicOrders.getPatient(token);
      const cloudOrder = patientId && await clinicOrders.getOrder(numOrderCode);
      if (cloudOrder && cloudOrder.patient_id === patientId) {
        let paidAt = cloudOrder.paid_at;
        if (!paidAt) {
          const payosOrder = await getPayOSClient()?.paymentRequests.get(numOrderCode);
          if (isPaidInFull(payosOrder, numOrderCode, cloudOrder.amount)) {
            paidAt = await clinicOrders.markPaid(numOrderCode);
          }
        }
        return res.json({
          success: true,
          data: { orderCode: numOrderCode, status: paidAt ? 'PAID' : 'PENDING', paidAt },
        });
      }
      return res.status(404).json({ success: false, message: 'Không tìm thấy mã đơn hàng' });
    }

    if (order.status === 'PAID') {
      return res.status(200).json({
        success: true,
        data: { status: 'PAID', orderCode: numOrderCode, paidAt: order.paidAt }
      });
    }

    // Nếu chưa PAID, chủ động hỏi API PayOS xem tiền đã vào chưa
    const payos = getPayOSClient();
    if (payos) {
      try {
        const payosOrder = await payos.paymentRequests.get(numOrderCode);
        if (isPaidInFull(payosOrder, numOrderCode, order.amount)) {
          order.status = 'PAID';
          order.paidAt = new Date().toISOString();
          if (order.appointmentId) {
            const apt = appointments.find(a => a.id === order.appointmentId);
            if (apt) {
              apt.paymentStatus = 'PAID';
            }
          }
          return res.status(200).json({
            success: true,
            data: { status: 'PAID', orderCode: numOrderCode, paidAt: order.paidAt }
          });
        }
      } catch (payosCheckErr) {
        // Tiếp tục trả về trạng thái hiện tại
      }
    }

    return res.status(200).json({
      success: true,
      data: { status: order.status, orderCode: numOrderCode }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

function isPaidInFull(payment, orderCode, amount) {
  return payment?.orderCode === orderCode && payment.status === 'PAID' &&
    payment.amount === amount && payment.amountPaid >= amount && payment.amountRemaining === 0;
}

module.exports = {
  createPaymentLink,
  handleWebhook,
  getPaymentStatus,
  orders,
  getPayOSClient,
  setPayOSClient: (client) => { payosInstance = client; },
  sanitizeDescription
};
