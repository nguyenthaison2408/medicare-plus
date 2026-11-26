alter table public.clinic_doctors add column fee_vnd integer not null default 300000
  check (fee_vnd > 0);

update public.clinic_doctors
set fee_vnd = case id
  when 'doc-1' then 350000
  when 'doc-3' then 250000
  when 'doc-4' then 400000
  else fee_vnd
end
where id in ('doc-1', 'doc-3', 'doc-4');

create table public.clinic_payos_orders (
  order_code bigint primary key,
  patient_id uuid not null references public.clinic_profiles(id),
  doctor_id text not null references public.clinic_doctors(id),
  starts_at timestamptz not null,
  amount integer not null check (amount > 0),
  paid_at timestamptz,
  appointment_id uuid unique references public.clinic_appointments(id)
);

alter table public.clinic_payos_orders enable row level security;
revoke all on public.clinic_payos_orders from public, anon, authenticated;
grant select, insert, update on public.clinic_payos_orders to service_role;

create function public.clinic_book_paid_appointment(
  p_order_code bigint, p_doctor_id text, p_starts_at timestamptz,
  p_patient_name text, p_patient_phone text, p_patient_email text, p_symptoms text
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_order public.clinic_payos_orders;
  v_appointment public.clinic_appointments;
  v_new jsonb;
begin
  select * into v_order from public.clinic_payos_orders
    where order_code = p_order_code and patient_id = (select auth.uid())
      and doctor_id = p_doctor_id and starts_at = p_starts_at
      and paid_at is not null
    for update;
  if not found then
    raise exception 'PAYOS_PAYMENT_NOT_VERIFIED' using errcode = '42501';
  end if;

  if v_order.appointment_id is not null then
    select * into strict v_appointment from public.clinic_appointments
      where id = v_order.appointment_id;
    return to_jsonb(v_appointment);
  end if;

  v_new := public.clinic_book_appointment(
    p_doctor_id, p_starts_at, 'at_clinic', p_patient_name, p_patient_phone,
    p_patient_email, p_symptoms
  );
  update public.clinic_appointments
    set payment_method = 'vietqr', payment_status = 'PAID'
    where id = (v_new->>'id')::uuid
    returning * into strict v_appointment;
  update public.clinic_payos_orders set appointment_id = v_appointment.id
    where order_code = p_order_code;
  return to_jsonb(v_appointment);
end;
$$;

revoke all on function public.clinic_book_paid_appointment(bigint,text,timestamptz,text,text,text,text)
  from public, anon;
grant execute on function public.clinic_book_paid_appointment(bigint,text,timestamptz,text,text,text,text)
  to authenticated;
