import type { LatestBookingTicket } from '../context/AppContext';

export interface BookingEmailConfig {
  webhookUrl?: string;
  emailJsServiceId?: string;
  emailJsTemplateId?: string;
  emailJsPublicKey?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let lastAutoSentCode = '';

export function getBookingEmailConfig(
  env: Record<string, string | undefined> = process.env
): BookingEmailConfig {
  return {
    webhookUrl: (env.EXPO_PUBLIC_BOOKING_EMAIL_WEBHOOK_URL || '').trim() || undefined,
    emailJsServiceId: (env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || '').trim() || undefined,
    emailJsTemplateId: (env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || '').trim() || undefined,
    emailJsPublicKey: (env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || '').trim() || undefined,
  };
}

export function isBookingEmailConfigured(
  config: BookingEmailConfig = getBookingEmailConfig()
): boolean {
  if (config.webhookUrl && /^https?:\/\//i.test(config.webhookUrl)) {
    return true;
  }
  if (
    config.emailJsServiceId &&
    config.emailJsTemplateId &&
    config.emailJsPublicKey
  ) {
    return true;
  }
  return false;
}

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPaymentMethodLabel(method?: string): string {
  switch (method) {
    case 'vietqr':
      return 'Chuyển khoản VietQR 24/7';
    case 'vnpay':
      return 'Cổng thanh toán VNPAY';
    case 'momo':
      return 'Ví điện tử MoMo';
    case 'at_clinic':
    case 'at_clinic_bhyt':
    default:
      return 'Thanh toán tại cơ sở y tế (Ưu tiên BHYT)';
  }
}

export function buildBookingEmailPayload(ticket: LatestBookingTicket) {
  const toEmail = (ticket.patientEmail || '').trim().toLowerCase();
  const bookingCode = (ticket.code || '').trim();
  const patientName = (ticket.patientName || 'Bệnh nhân').trim();
  const patientPhone = (ticket.patientPhone || 'Chưa cập nhật').trim();
  const doctorName = (ticket.doctor?.name || 'Bác sĩ chuyên khoa').trim();
  const doctorDegree = (ticket.doctor?.degree || '').trim();
  const specialty = (ticket.doctor?.specialty || 'Đa khoa').trim();
  const hospital = (ticket.doctor?.hospital || 'Hệ thống Y tế MediCare Plus').trim();
  const room = (ticket.room || hospital).trim();
  const appointmentDate = [ticket.dayLabel, ticket.fullDate]
    .filter(Boolean)
    .join(', ');
  const appointmentTime = (ticket.timeRange || 'Theo khung giờ hẹn').trim();
  const consultModeLabel =
    ticket.consultMode === 'chat'
      ? 'Tư vấn Trực tuyến qua MediCare Plus'
      : 'Khám trực tiếp tại cơ sở y tế';
  const paymentLabel = formatPaymentMethodLabel(ticket.paymentMethod);
  const symptoms = (ticket.symptoms || 'Khám và tư vấn theo chuyên khoa').trim();
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(
    bookingCode
  )}`;
  const subject = `[MediCare Plus] Xác nhận phiếu hẹn khám bệnh ${bookingCode} - ${patientName}`;

  const htmlBody = `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8FAFC;padding:24px;border-radius:16px;color:#0F172A;">
  <div style="background:linear-gradient(135deg,#0055D4,#008080);padding:24px;border-radius:14px;color:#FFFFFF;text-align:center;">
    <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.9;font-weight:700;">HỆ THỐNG Y TẾ SỐ MEDICARE PLUS</div>
    <h1 style="margin:8px 0 4px;font-size:22px;">PHIẾU HẸN KHÁM BỆNH ĐIỆN TỬ</h1>
    <div style="font-size:14px;opacity:0.95;">Đặt lịch khám thành công • Đã xác nhận giữ chỗ</div>
  </div>

  <div style="background:#FFFFFF;margin-top:16px;padding:20px;border-radius:14px;border:1px solid #E2E8F0;">
    <div style="text-align:center;border-bottom:1px dashed #CBD5E1;padding-bottom:16px;margin-bottom:16px;">
      <div style="font-size:12px;color:#64748B;font-weight:700;text-transform:uppercase;">MÃ PHIẾU HẸN CHECK-IN</div>
      <div style="font-size:22px;font-weight:800;color:#0055D4;letter-spacing:1px;margin:6px 0 12px;">${escapeHtml(bookingCode)}</div>
      <img src="${qrImageUrl}" alt="QR Code ${escapeHtml(bookingCode)}" width="180" height="180" style="border:1px solid #E2E8F0;border-radius:12px;padding:8px;background:#FFFFFF;" />
      <div style="font-size:12px;color:#475569;margin-top:8px;">Xuất trình mã QR này tại Quầy tiếp đón hoặc cho Bác sĩ quét khi đến khám</div>
    </div>

    <h3 style="margin:0 0 12px;font-size:15px;color:#0055D4;text-transform:uppercase;">1. Thông tin ca khám</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#64748B;width:40%;">Bác sĩ phụ trách:</td><td style="padding:6px 0;font-weight:700;">${escapeHtml(doctorName)}${doctorDegree ? ` (${escapeHtml(doctorDegree)})` : ''}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B;">Chuyên khoa:</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(specialty)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B;">Cơ sở y tế:</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(hospital)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B;">Phòng khám:</td><td style="padding:6px 0;">${escapeHtml(room)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B;">Ngày khám:</td><td style="padding:6px 0;font-weight:700;color:#0F766E;">${escapeHtml(appointmentDate)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B;">Khung giờ:</td><td style="padding:6px 0;font-weight:700;color:#0F766E;">${escapeHtml(appointmentTime)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B;">Hình thức khám:</td><td style="padding:6px 0;">${escapeHtml(consultModeLabel)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B;">Thanh toán:</td><td style="padding:6px 0;">${escapeHtml(paymentLabel)}</td></tr>
    </table>

    <hr style="border:none;border-top:1px solid #E2E8F0;margin:16px 0;" />

    <h3 style="margin:0 0 12px;font-size:15px;color:#0055D4;text-transform:uppercase;">2. Thông tin bệnh nhân</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#64748B;width:40%;">Họ và tên:</td><td style="padding:6px 0;font-weight:700;">${escapeHtml(patientName)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B;">Số điện thoại:</td><td style="padding:6px 0;">${escapeHtml(patientPhone)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B;">Email nhận phiếu:</td><td style="padding:6px 0;">${escapeHtml(toEmail)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748B;vertical-align:top;">Triệu chứng / Lý do:</td><td style="padding:6px 0;">${escapeHtml(symptoms)}</td></tr>
    </table>
  </div>

  <div style="text-align:center;font-size:12px;color:#64748B;margin-top:16px;">
    Vui lòng có mặt trước giờ hẹn 15 phút và mang theo CCCD gắn chip hoặc ứng dụng VssID để đối chiếu quyền lợi BHYT.<br/>
    © Hệ thống Y tế Thông minh MediCare Plus
  </div>
</div>`.trim();

  return {
    to_email: toEmail,
    patient_name: patientName,
    patient_phone: patientPhone,
    booking_code: bookingCode,
    doctor_name: doctorName,
    doctor_degree: doctorDegree,
    specialty,
    hospital,
    room,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    consult_mode: consultModeLabel,
    payment_method: paymentLabel,
    symptoms,
    qr_image_url: qrImageUrl,
    subject,
    html_body: htmlBody,
  };
}

export async function sendBookingConfirmationEmail(
  ticket: LatestBookingTicket,
  options?: {
    config?: BookingEmailConfig;
    fetchImpl?: typeof fetch;
    isAutoSend?: boolean;
  }
): Promise<{ sent: true; toEmail: string }> {
  const config = options?.config || getBookingEmailConfig();
  const fetchFn = options?.fetchImpl || fetch;
  const toEmail = (ticket.patientEmail || '').trim().toLowerCase();
  const bookingCode = (ticket.code || '').trim();

  if (!bookingCode) {
    throw new Error('Chưa có mã phiếu hẹn để gửi email.');
  }
  if (!EMAIL_PATTERN.test(toEmail)) {
    throw new Error('Địa chỉ email người nhận không hợp lệ.');
  }
  if (!isBookingEmailConfigured(config)) {
    throw new Error(
      'Chưa cấu hình dịch vụ gửi email (EXPO_PUBLIC_BOOKING_EMAIL_WEBHOOK_URL hoặc EmailJS trong .env.local).'
    );
  }
  if (options?.isAutoSend && lastAutoSentCode === bookingCode) {
    return { sent: true, toEmail };
  }

  const payload = buildBookingEmailPayload(ticket);

  if (config.webhookUrl) {
    const response = await fetchFn(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Không gửi được email xác nhận (HTTP ${response.status}).`);
    }
    let parsed: { ok?: boolean; error?: string } | null = null;
    try {
      const text = await response.text();
      if (text) parsed = JSON.parse(text);
    } catch {
      // Non-JSON 200 OK from webhook is acceptable
    }
    if (parsed && parsed.ok === false) {
      throw new Error(parsed.error || 'Webhook từ chối gửi email xác nhận.');
    }
    if (options?.isAutoSend) {
      lastAutoSentCode = bookingCode;
    }
    return { sent: true, toEmail };
  }

  const response = await fetchFn('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: config.emailJsServiceId,
      template_id: config.emailJsTemplateId,
      user_id: config.emailJsPublicKey,
      template_params: payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`EmailJS không gửi được email xác nhận (HTTP ${response.status}).`);
  }

  if (options?.isAutoSend) {
    lastAutoSentCode = bookingCode;
  }
  return { sent: true, toEmail };
}
