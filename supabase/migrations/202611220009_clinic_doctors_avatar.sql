-- Migration: Add avatar_url to clinic_doctors and allow Admin updates
ALTER TABLE public.clinic_doctors
  ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '';

DROP POLICY IF EXISTS clinic_doctors_admin_update ON public.clinic_doctors;
CREATE POLICY clinic_doctors_admin_update ON public.clinic_doctors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clinic_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clinic_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
