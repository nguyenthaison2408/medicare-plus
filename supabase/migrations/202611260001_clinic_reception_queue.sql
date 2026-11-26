alter table public.clinic_appointments add column if not exists queue_number integer check(queue_number > 0);
-- Keep previously issued numbers, including cancelled visits, reserved.
with numbered as (
 select id,row_number() over(partition by doctor_id,(starts_at at time zone 'Asia/Ho_Chi_Minh')::date order by coalesce(checked_in_at,starts_at),id)::integer as n
 from public.clinic_appointments where status in ('CHECKED_IN','COMPLETED') or checked_in_at is not null
) update public.clinic_appointments a set queue_number=n.n from numbered n where a.id=n.id and a.queue_number is null;
create unique index if not exists clinic_daily_doctor_queue on public.clinic_appointments(doctor_id,((starts_at at time zone 'Asia/Ho_Chi_Minh')::date),queue_number) where queue_number is not null;
create table if not exists clinic_private.daily_queue_counters (
 doctor_id text not null, queue_date date not null, last_number integer not null, primary key(doctor_id,queue_date)
);
revoke all on clinic_private.daily_queue_counters from public,anon,authenticated;
insert into clinic_private.daily_queue_counters(doctor_id,queue_date,last_number)
 select doctor_id,(starts_at at time zone 'Asia/Ho_Chi_Minh')::date,max(queue_number) from public.clinic_appointments where queue_number is not null group by 1,2
 on conflict(doctor_id,queue_date) do update set last_number=greatest(clinic_private.daily_queue_counters.last_number,excluded.last_number);
create or replace function clinic_private.assign_queue_number() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='UPDATE' and old.queue_number is not null then
   new.queue_number:=old.queue_number;
   if new.doctor_id<>old.doctor_id or (new.starts_at at time zone 'Asia/Ho_Chi_Minh')::date<>(old.starts_at at time zone 'Asia/Ho_Chi_Minh')::date then
     raise exception 'ISSUED_QUEUE_CANNOT_BE_MOVED' using errcode='22023';
   end if;
 elsif new.status in ('CHECKED_IN','COMPLETED') then
   insert into clinic_private.daily_queue_counters(doctor_id,queue_date,last_number)
   values(new.doctor_id,(new.starts_at at time zone 'Asia/Ho_Chi_Minh')::date,1)
   on conflict(doctor_id,queue_date) do update set last_number=clinic_private.daily_queue_counters.last_number+1
   returning last_number into new.queue_number;
 else new.queue_number:=null;
 end if;
 return new;
end;$$;
revoke all on function clinic_private.assign_queue_number() from public,anon,authenticated;
drop trigger if exists clinic_assign_queue on public.clinic_appointments;
create trigger clinic_assign_queue before insert or update on public.clinic_appointments for each row execute function clinic_private.assign_queue_number();
