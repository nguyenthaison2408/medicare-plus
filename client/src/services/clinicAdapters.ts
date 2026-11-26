import { DOCTORS, type AppointmentItem, type PrescriptionDrug } from '../data/mockData';
import type { ClinicAppointment, ClinicMedicalRecord } from './clinicCloud';

export function clinicRecord(appointment: ClinicAppointment): ClinicMedicalRecord | null {
  const record = appointment.clinic_medical_records;
  return Array.isArray(record) ? record[0] || null : record || null;
}

export function clinicAppointmentToItem(appointment: ClinicAppointment): AppointmentItem {
  const doctor = DOCTORS.find(d => d.id === appointment.doctor_id);
  if (!doctor) throw new Error('Thông tin bác sĩ chưa được đồng bộ với ứng dụng.');
  const date = new Date(appointment.starts_at);
  const label = date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const isChatConsult = Boolean(
    appointment.symptoms && appointment.symptoms.startsWith('[Tư vấn Chat]')
  );
  return {
    id: appointment.id, code: appointment.booking_code, doctor,
    dateLabel: label, timeRange: label, startsAt: appointment.starts_at,
    queueNumber: appointment.queue_number ? 'STT '+String(appointment.queue_number).padStart(2,'0') : appointment.status === 'CHECKED_IN' ? 'Đã có mặt' : 'Đã xác nhận',
    room: isChatConsult ? 'Phòng Tư vấn Chat Trực tuyến' : doctor.hospital,
    status: appointment.status === 'COMPLETED' ? 'completed' : appointment.status === 'CANCELLED' ? 'cancelled' : 'upcoming',
    mode: isChatConsult ? 'video' : 'clinic',
    patientId: appointment.patient_id,
    patientName: appointment.patient_name,
    patientPhone: appointment.patient_phone,
    patientEmail: appointment.patient_email,
    symptoms: appointment.symptoms,
    statusBadge: appointment.status === 'CHECKED_IN' ? 'Đã có mặt'
      : appointment.status === 'COMPLETED' ? 'Đã hoàn tất khám'
      : appointment.status === 'CANCELLED' ? 'Đã hủy'
      : appointment.payment_status === 'PAID' ? 'Đã thanh toán' : 'Thanh toán tại cơ sở y tế',
  };
}

export function clinicPrescriptions(appointments: ClinicAppointment[]): PrescriptionDrug[] {
  return appointments.flatMap(appointment => (clinicRecord(appointment)?.medications || []).map((drug, index) => ({
    id: `${appointment.id}-${index}`, appointmentId: appointment.id, medicationIndex: index, name: drug.name,
    indication: clinicRecord(appointment)?.diagnosis || '',
    quantity: 'Theo đơn bác sĩ', dosageTag: drug.dosage,
    instructionTag: clinicRecord(appointment)?.notes || 'Thực hiện theo hướng dẫn của bác sĩ.',
  })));
}
