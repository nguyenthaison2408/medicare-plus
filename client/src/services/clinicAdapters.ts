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
  const label = date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  return {
    id: appointment.id, code: appointment.booking_code, doctor,
    dateLabel: label, timeRange: label,
    queueNumber: appointment.status === 'CHECKED_IN' ? 'Đã có mặt' : 'Đã xác nhận',
    room: doctor.hospital,
    status: appointment.status === 'COMPLETED' ? 'completed' : appointment.status === 'CANCELLED' ? 'cancelled' : 'upcoming',
    mode: 'clinic',
    statusBadge: appointment.status === 'CHECKED_IN' ? 'Đã có mặt'
      : appointment.status === 'COMPLETED' ? 'Đã hoàn tất khám'
      : appointment.status === 'CANCELLED' ? 'Đã hủy'
      : appointment.payment_status === 'PAID' ? 'Đã thanh toán' : 'Thanh toán tại cơ sở y tế',
  };
}

export function clinicPrescriptions(appointments: ClinicAppointment[]): PrescriptionDrug[] {
  return appointments.flatMap(appointment => (clinicRecord(appointment)?.medications || []).map((drug, index) => ({
    id: `${appointment.id}-${index}`, name: drug.name,
    indication: clinicRecord(appointment)?.diagnosis || '',
    quantity: 'Theo đơn bác sĩ', dosageTag: drug.dosage,
    instructionTag: clinicRecord(appointment)?.notes || 'Thực hiện theo hướng dẫn của bác sĩ.',
  })));
}
