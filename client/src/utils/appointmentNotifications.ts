import type { AppointmentItem } from '../data/mockData';

export interface AppointmentNotification {
  appointmentId: string;
  kind: 'reminder' | 'completed' | 'cancelled';
  title: string;
  description: string;
}

const clinicDateTime = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  dateStyle: 'short',
  timeStyle: 'short',
});

export function buildAppointmentNotifications(
  appointments: readonly AppointmentItem[],
  nowMs = Date.now()
): AppointmentNotification[] {
  const upcoming: { startsAt: number; notification: AppointmentNotification }[] = [];
  const history: typeof upcoming = [];

  for (const appointment of appointments) {
    const startsAt = Date.parse(appointment.startsAt ?? '');
    const hasKnownStart = Number.isFinite(startsAt);
    const kind = appointment.status === 'upcoming' ? 'reminder' : appointment.status;
    const isUpcoming = kind === 'reminder';
    if (isUpcoming && (!hasKnownStart || startsAt <= nowMs)) continue;

    const when = hasKnownStart ? clinicDateTime.format(startsAt) : appointment.timeRange;
    const place = appointment.mode === 'video' ? 'Khám trực tuyến' : appointment.doctor.hospital;
    const title = kind === 'reminder'
      ? 'Nhắc lịch khám sắp tới'
      : kind === 'completed' ? 'Lịch khám đã hoàn thành' : 'Lịch khám đã hủy';
    const notification: AppointmentNotification = {
      appointmentId: appointment.id,
      kind,
      title,
      description: [when, appointment.doctor.name, place].filter(Boolean).join(' • '),
    };
    (isUpcoming ? upcoming : history).push({ startsAt: hasKnownStart ? startsAt : 0, notification });
  }

  upcoming.sort((a, b) => a.startsAt - b.startsAt);
  history.sort((a, b) => b.startsAt - a.startsAt);
  return [...upcoming, ...history].slice(0, 10).map(({ notification }) => notification);
}
