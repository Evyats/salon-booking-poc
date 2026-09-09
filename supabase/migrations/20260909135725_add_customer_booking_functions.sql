create or replace function public.list_booked_slots(
  p_from date,
  p_days integer default 28
)
returns table (
  booking_date date,
  booking_time time
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (appointment.starts_at at time zone 'Asia/Jerusalem')::date,
    (appointment.starts_at at time zone 'Asia/Jerusalem')::time
  from public.appointments as appointment
  where appointment.status = 'confirmed'
    and appointment.starts_at >= p_from::timestamp at time zone 'Asia/Jerusalem'
    and appointment.starts_at < (p_from + p_days)::timestamp at time zone 'Asia/Jerusalem'
  order by appointment.starts_at;
$$;

create or replace function public.create_customer_booking(
  p_challenge_id uuid,
  p_full_name text,
  p_booking_date date,
  p_booking_time time
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
  challenge public.otp_challenges%rowtype;
  customer public.customers%rowtype;
  normalized_name text := btrim(p_full_name);
  requested_start timestamptz;
  weekday integer;
  new_appointment public.appointments%rowtype;
begin
  if normalized_name is null or char_length(normalized_name) not between 2 and 100 then
    raise exception using errcode = 'P0001', message = 'INVALID_NAME';
  end if;

  select otp.*
  into challenge
  from public.otp_challenges as otp
  where otp.id = p_challenge_id
  for update;

  if not found or challenge.purpose <> 'booking' then
    raise exception using errcode = 'P0001', message = 'OTP_NOT_FOUND';
  end if;

  if challenge.consumed_at is not null then
    raise exception using errcode = 'P0001', message = 'OTP_ALREADY_USED';
  end if;

  if challenge.verified_at is null then
    raise exception using errcode = 'P0001', message = 'OTP_NOT_VERIFIED';
  end if;

  if challenge.expires_at <= now() then
    raise exception using errcode = 'P0001', message = 'OTP_EXPIRED';
  end if;

  requested_start := (p_booking_date + p_booking_time) at time zone 'Asia/Jerusalem';
  weekday := extract(isodow from p_booking_date)::integer;

  if requested_start <= now() or p_booking_date > (now() at time zone 'Asia/Jerusalem')::date + 27 then
    raise exception using errcode = 'P0001', message = 'INVALID_SLOT';
  end if;

  if not (
    (
      weekday in (1, 2, 3, 4, 7)
      and p_booking_time in (
        time '09:00', time '09:30', time '10:30', time '11:00',
        time '11:30', time '12:30', time '13:00', time '14:00',
        time '14:30', time '15:30', time '16:00', time '17:00',
        time '17:30', time '18:30'
      )
    )
    or (
      weekday = 5
      and p_booking_time in (
        time '09:00', time '09:30', time '10:00', time '10:30',
        time '11:30', time '12:00', time '12:30', time '13:00'
      )
    )
  ) then
    raise exception using errcode = 'P0001', message = 'INVALID_SLOT';
  end if;

  insert into public.customers (full_name, phone_e164)
  values (normalized_name, challenge.phone_e164)
  on conflict (phone_e164) do update
  set full_name = excluded.full_name
  returning * into customer;

  if customer.is_blocked then
    raise exception using errcode = 'P0001', message = 'CUSTOMER_BLOCKED';
  end if;

  insert into public.appointments (customer_id, starts_at, created_by)
  values (customer.id, requested_start, 'customer')
  returning * into new_appointment;

  update public.otp_challenges
  set consumed_at = now()
  where id = challenge.id;

  return query
  select new_appointment.id, new_appointment.starts_at, customer.full_name;
end;
$$;

revoke all on function public.list_booked_slots(date, integer)
  from public, anon, authenticated;
revoke all on function public.create_customer_booking(uuid, text, date, time)
  from public, anon, authenticated;

grant execute on function public.list_booked_slots(date, integer) to service_role;
grant execute on function public.create_customer_booking(uuid, text, date, time) to service_role;

comment on function public.list_booked_slots(date, integer) is
  'Returns confirmed appointment slots without exposing customer data.';

comment on function public.create_customer_booking(uuid, text, date, time) is
  'Atomically consumes a verified OTP and creates one customer appointment.';
