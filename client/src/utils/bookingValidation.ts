export interface PatientBookingInfo {
  fullName: string;
  phone: string;
  email: string;
  symptoms: string;
}

export type PatientBookingField = keyof PatientBookingInfo;
export type PatientBookingErrors = Partial<Record<PatientBookingField, string>>;

const VIETNAMESE_MOBILE_PATTERN = /^0[35789][0-9]{8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{L}\s.'-]+$/u;

export function normalizePatientBookingInfo(
  input: PatientBookingInfo
): PatientBookingInfo {
  return {
    fullName: input.fullName.trim().replace(/\s+/g, ' '),
    phone: input.phone.replace(/[\s.-]/g, ''),
    email: input.email.trim().toLowerCase(),
    symptoms: input.symptoms.trim().replace(/\s+/g, ' '),
  };
}

export function validatePatientBookingInfo(
  input: PatientBookingInfo
): PatientBookingErrors {
  const value = normalizePatientBookingInfo(input);
  const errors: PatientBookingErrors = {};

  if (!value.fullName) {
    errors.fullName = 'Vui lòng nhập họ và tên bệnh nhân.';
  } else if (value.fullName.length < 2 || value.fullName.length > 160) {
    errors.fullName = 'Họ và tên phải có từ 2 đến 160 ký tự.';
  } else if (!NAME_PATTERN.test(value.fullName)) {
    errors.fullName = 'Họ và tên chỉ được chứa chữ cái, khoảng trắng, dấu nháy hoặc gạch nối.';
  }

  if (!value.phone) {
    errors.phone = 'Vui lòng nhập số điện thoại.';
  } else if (!VIETNAMESE_MOBILE_PATTERN.test(value.phone)) {
    errors.phone = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.';
  }

  if (!value.email) {
    errors.email = 'Vui lòng nhập địa chỉ email.';
  } else if (value.email.length > 254 || !EMAIL_PATTERN.test(value.email)) {
    errors.email = 'Địa chỉ email không đúng định dạng.';
  }

  if (!value.symptoms) {
    errors.symptoms = 'Vui lòng mô tả triệu chứng hoặc lý do khám.';
  } else if (value.symptoms.length < 5) {
    errors.symptoms = 'Mô tả triệu chứng cần có ít nhất 5 ký tự.';
  } else if (value.symptoms.length > 1000) {
    errors.symptoms = 'Mô tả triệu chứng không được vượt quá 1000 ký tự.';
  }

  return errors;
}

export function hasPatientBookingErrors(errors: PatientBookingErrors): boolean {
  return Object.keys(errors).length > 0;
}
