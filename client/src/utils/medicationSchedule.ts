import type { PrescriptionDrug } from '../data/mockData';

export interface MedicationScheduleItem {
  logKey: string;
  appointmentId?: string;
  medicationIndex?: number;
  doseKey: string;
  time: string;
  drug: string;
  desc: string;
}

export function buildMedicationSchedule(
  prescriptions: PrescriptionDrug[]
): MedicationScheduleItem[] {
  return prescriptions.flatMap(drug => {
    const instruction = `${drug.dosageTag} ${drug.instructionTag}`.toLocaleLowerCase('vi-VN');
    const doses: { key: string; label: string }[] = [];
    if (instruction.includes('sáng')) doses.push({ key: 'morning', label: 'Cữ sáng' });
    if (instruction.includes('trưa') || instruction.includes('chiều')) {
      doses.push({ key: 'afternoon', label: 'Cữ chiều' });
    }
    if (instruction.includes('tối') || instruction.includes('đêm') || instruction.includes('trước ngủ')) {
      doses.push({ key: 'evening', label: 'Cữ tối' });
    }
    if (doses.length === 0) {
      const countMatch = drug.dosageTag.match(/(\d+)\s*(?:lần|viên)?\s*\/\s*ngày/i);
      const dailyDoseCount = Math.min(Number(countMatch?.[1] || 1), 6);
      if (instruction.includes('khi cần')) {
        doses.push({ key: 'as-needed', label: 'Dùng khi cần' });
      } else if (dailyDoseCount > 1) {
        for (let index = 1; index <= dailyDoseCount; index += 1) {
          doses.push({ key: `dose-${index}`, label: `Cữ ${index}` });
        }
      } else {
        doses.push({ key: 'dose-1', label: 'Cữ theo toa' });
      }
    }

    return doses.map(dose => ({
      logKey: drug.appointmentId && drug.medicationIndex !== undefined
        ? `${drug.appointmentId}:${drug.medicationIndex}:${dose.key}`
        : `${drug.id}:${dose.key}`,
      appointmentId: drug.appointmentId,
      medicationIndex: drug.medicationIndex,
      doseKey: dose.key,
      time: `${dose.label} • ${drug.dosageTag}`,
      drug: drug.name,
      desc: drug.instructionTag,
    }));
  });
}
