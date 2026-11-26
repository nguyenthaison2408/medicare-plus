import type { DaySlotItem, TimeSlotItem } from '../data/mockData';

export function toClinicStart(day: DaySlotItem, slot: TimeSlotItem): string {
  const [date, month, year] = day.fullDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${date.padStart(2, '0')}T${slot.time}:00+07:00`;
}

export function isFutureBookingSlot(day: DaySlotItem, slot: TimeSlotItem, nowMs: number): boolean {
  return Date.parse(toClinicStart(day, slot)) > nowMs;
}

export function filterFutureBookingSlots(
  day: DaySlotItem,
  slots: readonly TimeSlotItem[],
  nowMs: number
): TimeSlotItem[] {
  return slots.filter((slot) => isFutureBookingSlot(day, slot, nowMs));
}
