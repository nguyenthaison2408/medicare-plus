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
    // Only an explicit frequency in the prescribed dosage establishes a dose
    // count. Tablet quantities and free-form clinical notes are not schedules.
    const frequency = drug.dosageTag.match(/(?:^|\s)([1-6])\s*lần\s*(?:\/|mỗi\s+)\s*ngày(?:$|[\s,.;(])/iu);
    const dailyDoseCount = frequency ? Number(frequency[1]) : 1;
    const doses = Array.from({ length: dailyDoseCount }, (_, index) => ({
      key: `dose-${index + 1}`,
      label: frequency ? `Cữ ${index + 1}` : 'Ghi nhận dùng thuốc theo toa',
    }));

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
