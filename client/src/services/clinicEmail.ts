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
  env: Record<string, string | undefined> = {
    EXPO_PUBLIC_BOOKING_EMAIL_WEBHOOK_URL: process.env.EXPO_PUBLIC_BOOKING_EMAIL_WEBHOOK_URL,
    EXPO_PUBLIC_EMAILJS_SERVICE_ID: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID,
    EXPO_PUBLIC_EMAILJS_TEMPLATE_ID: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,
    EXPO_PUBLIC_EMAILJS_PUBLIC_KEY: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY,
  }
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
      parsed = JSON.parse(await response.text());
    } catch {
      throw new Error('Dịch vụ email chưa xác nhận gửi thành công. Vui lòng thử lại.');
    }
    if (!parsed || parsed.ok !== true) {
      throw new Error(
        typeof parsed?.error === 'string' && parsed.error.trim()
          ? parsed.error
          : 'Dịch vụ email chưa xác nhận gửi thành công. Vui lòng thử lại.'
      );
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

export const REGISTRATION_OTP_TTL_MS = 5 * 60 * 1000;
export const REGISTRATION_OTP_MAX_ATTEMPTS = 5;
export const REGISTRATION_OTP_RESEND_SECONDS = 60;

export interface RegistrationOtpChallenge {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

export function generateOtpCode(): string {
  try {
    const cryptoObj = (globalThis as { crypto?: { getRandomValues?: (arr: Uint32Array) => Uint32Array } }).crypto;
    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
      const buf = new Uint32Array(1);
      cryptoObj.getRandomValues(buf);
      return String(100000 + (buf[0] % 900000));
    }
  } catch {
    // Fall back to Math.random if WebCrypto is unavailable
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function createRegistrationOtpChallenge(
  email: string,
  now: number = Date.now(),
  code: string = generateOtpCode()
): RegistrationOtpChallenge {
  return {
    email: email.trim().toLowerCase(),
    code: code.trim(),
    expiresAt: now + REGISTRATION_OTP_TTL_MS,
    attempts: 0,
  };
}

export function verifyRegistrationOtpChallenge(
  challenge: RegistrationOtpChallenge | null,
  inputCode: string,
  email: string,
  now: number = Date.now()
): { ok: true } | { ok: false; reason: string; nextChallenge: RegistrationOtpChallenge | null } {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanInput = inputCode.replace(/\s+/g, '');

  if (!challenge || challenge.email !== normalizedEmail) {
    return {
      ok: false,
      reason: 'Mã xác thực không tồn tại. Vui lòng bấm "Gửi lại mã OTP".',
      nextChallenge: null,
    };
  }
  if (now > challenge.expiresAt) {
    return {
      ok: false,
      reason: 'Mã OTP đã hết hạn (quá 5 phút). Vui lòng bấm "Gửi lại mã OTP".',
      nextChallenge: null,
    };
  }
  if (!/^\d{6}$/.test(cleanInput)) {
    return {
      ok: false,
      reason: 'Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số.',
      nextChallenge: challenge,
    };
  }
  if (cleanInput !== challenge.code) {
    const nextAttempts = challenge.attempts + 1;
    if (nextAttempts >= REGISTRATION_OTP_MAX_ATTEMPTS) {
      return {
        ok: false,
        reason: 'Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng bấm "Gửi lại mã OTP" mới.',
        nextChallenge: null,
      };
    }
    const remaining = REGISTRATION_OTP_MAX_ATTEMPTS - nextAttempts;
    return {
      ok: false,
      reason: `Mã OTP không chính xác (còn ${remaining} lần thử).`,
      nextChallenge: { ...challenge, attempts: nextAttempts },
    };
  }
  return { ok: true };
}

export function buildRegistrationOtpEmailPayload(params: {
  toEmail: string;
  fullName: string;
  otpCode: string;
  expiresMinutes?: number;
}) {
  const toEmail = params.toEmail.trim().toLowerCase();
  const fullName = (params.fullName || 'Quý khách').trim();
  const otpCode = params.otpCode.trim();
  const formattedOtp = otpCode.length === 6 ? `${otpCode.slice(0, 3)} ${otpCode.slice(3)}` : otpCode;
  const expiresMinutes = params.expiresMinutes ?? 5;
  const subject = `[MediCare Plus] Mã xác thực đăng ký tài khoản: ${otpCode}`;

  const htmlBody = `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#F8FAFC;padding:24px;border-radius:16px;color:#0F172A;">
  <div style="background:linear-gradient(135deg,#0055D4,#008080);padding:24px;border-radius:14px;color:#FFFFFF;text-align:center;">
    <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.9;font-weight:700;">HỆ THỐNG Y TẾ SỐ MEDICARE PLUS</div>
    <h1 style="margin:8px 0 4px;font-size:21px;">XÁC THỰC EMAIL ĐĂNG KÝ</h1>
    <div style="font-size:14px;opacity:0.95;">Bảo vệ tài khoản hồ sơ sức khỏe điện tử của bạn</div>
  </div>

  <div style="background:#FFFFFF;margin-top:16px;padding:24px;border-radius:14px;border:1px solid #E2E8F0;text-align:center;">
    <p style="margin:0 0 12px;font-size:15px;color:#334155;">Xin chào <strong>${escapeHtml(fullName)}</strong>,</p>
    <p style="margin:0 0 20px;font-size:14px;color:#475569;line-height:1.5;">
      Vui lòng nhập mã xác thực OTP dưới đây vào ứng dụng <strong>MediCare Plus</strong> để hoàn tất đăng ký tài khoản cho địa chỉ email <strong>${escapeHtml(toEmail)}</strong>:
    </p>
    <div style="display:inline-block;background:#EFF6FF;border:2px dashed #0055D4;border-radius:12px;padding:14px 28px;margin:4px 0 18px;">
      <div style="font-size:11px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:1px;">MÃ XÁC THỰC OTP</div>
      <div style="font-size:32px;font-weight:800;color:#0055D4;letter-spacing:6px;margin-top:4px;">${escapeHtml(formattedOtp)}</div>
    </div>
    <p style="margin:0;font-size:13px;color:#DC2626;font-weight:600;">
      Mã có hiệu lực trong ${expiresMinutes} phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.
    </p>
  </div>

  <div style="text-align:center;font-size:12px;color:#64748B;margin-top:16px;">
    Nếu bạn không yêu cầu đăng ký tài khoản MediCare Plus, vui lòng bỏ qua email này.<br/>
    © Hệ thống Y tế Thông minh MediCare Plus
  </div>
</div>`.trim();

  return {
    to_email: toEmail,
    patient_name: fullName,
    otp_code: otpCode,
    subject,
    html_body: htmlBody,
  };
}

export async function sendRegistrationOtpEmail(
  params: { toEmail: string; fullName: string; otpCode: string },
  options?: {
    config?: BookingEmailConfig;
    fetchImpl?: typeof fetch;
  }
): Promise<{ sent: true; toEmail: string }> {
  const config = options?.config || getBookingEmailConfig();
  const fetchFn = options?.fetchImpl || fetch;
  const toEmail = (params.toEmail || '').trim().toLowerCase();

  if (!EMAIL_PATTERN.test(toEmail)) {
    throw new Error('Địa chỉ email đăng ký không hợp lệ.');
  }
  if (!/^\d{6}$/.test((params.otpCode || '').trim())) {
    throw new Error('Mã OTP xác thực không hợp lệ.');
  }
  if (!isBookingEmailConfigured(config)) {
    throw new Error(
      'Chưa cấu hình dịch vụ gửi email xác thực (EXPO_PUBLIC_BOOKING_EMAIL_WEBHOOK_URL trong .env.local).'
    );
  }

  const payload = buildRegistrationOtpEmailPayload({
    toEmail,
    fullName: params.fullName,
    otpCode: params.otpCode,
  });

  if (config.webhookUrl) {
    const response = await fetchFn(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Không gửi được mã OTP xác thực email (HTTP ${response.status}).`);
    }
    let parsed: { ok?: unknown; error?: string } | null = null;
    try {
      const text = await response.text();
      if (text) parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || parsed.ok !== true) {
      throw new Error(
        (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && typeof parsed.error === 'string' && parsed.error) ||
          'Webhook không xác nhận gửi email OTP thành công.'
      );
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
    throw new Error(`EmailJS không gửi được mã OTP xác thực (HTTP ${response.status}).`);
  }

  return { sent: true, toEmail };
}
