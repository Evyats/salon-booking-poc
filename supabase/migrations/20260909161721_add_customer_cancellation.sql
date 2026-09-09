alter table public.appointments
  add column cancellation_token_hash text;

alter table public.appointments
  add constraint appointments_cancellation_token_hash_valid
  check (
    cancellation_token_hash is null
    or cancellation_token_hash ~ '^[0-9a-f]{64}$'
  );

create unique index appointments_cancellation_token_hash_idx
  on public.appointments (cancellation_token_hash)
  where cancellation_token_hash is not null;

create or replace function public.create_customer_booking(
  p_challenge_id uuid,
  p_full_name text,
  p_booking_date date,
  p_booking_time time,
  p_cancellation_token_hash text
)
returns table (
  appointment_id uuid,
  starts_at timestamptz,
  customer_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  booking record;
begin
  if p_cancellation_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'P0001', message = 'INVALID_CANCELLATION_TOKEN';
  end if;

  select created.appointment_id, created.starts_at, created.customer_name
  into booking
  from public.create_customer_booking(
    p_challenge_id,
    p_full_name,
    p_booking_date,
    p_booking_time
  ) as created;

  update public.appointments
  set cancellation_token_hash = p_cancellation_token_hash
  where id = booking.appointment_id;

  return query
  select booking.appointment_id, booking.starts_at, booking.customer_name;
end;
$$;

create or replace function public.cancel_customer_appointment(
  p_cancellation_token_hash text
)
returns table (
  appointment_id uuid,
  starts_at timestamptz,
  status text,
  cancelled_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.appointments as appointment
  set status = 'cancelled', cancelled_at = now()
  where appointment.cancellation_token_hash = p_cancellation_token_hash
    and appointment.status = 'confirmed'
  returning
    appointment.id,
    appointment.starts_at,
    appointment.status,
    appointment.cancelled_at;

  if found then
    return;
  end if;

  return query
  select
    appointment.id,
    appointment.starts_at,
    appointment.status,
    appointment.cancelled_at
  from public.appointments as appointment
  where appointment.cancellation_token_hash = p_cancellation_token_hash
    and appointment.status = 'cancelled';
end;
$$;

revoke all on function public.create_customer_booking(uuid, text, date, time, text)
  from public, anon, authenticated;
revoke all on function public.cancel_customer_appointment(text)
  from public, anon, authenticated;

grant execute on function public.create_customer_booking(uuid, text, date, time, text)
  to service_role;
grant execute on function public.cancel_customer_appointment(text)
  to service_role;

comment on column public.appointments.cancellation_token_hash is
  'HMAC of the appointment-specific customer cancellation token.';

comment on function public.cancel_customer_appointment(text) is
  'Idempotently cancels the appointment authorized by a matching token HMAC.';
