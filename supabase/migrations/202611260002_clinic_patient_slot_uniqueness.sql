-- Cancelled appointments release the patient's slot just as they release the doctor's slot.
create unique index clinic_one_active_booking_per_patient_slot
  on public.clinic_appointments (patient_id, starts_at)
  where status <> 'CANCELLED';
