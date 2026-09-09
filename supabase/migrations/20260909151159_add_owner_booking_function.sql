create or replace function public.create_owner_booking(
  p_full_name text,
  p_phone text,
  p_booking_date date,
  p_booking_time time
)
returns table (
  appointment_id uuid,
  customer_id uuid,
  starts_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  normalized_name text := btrim(p_full_name);
  normalized_phone text := regexp_replace(btrim(p_phone), '[\s()-]', '', 'g');
  requested_start timestamptz;
  weekday integer;
  customer public.customers%rowtype;
  new_appointment public.appointments%rowtype;
begin
  if not public.is_owner() then
    raise exception using errcode = '42501', message = 'OWNER_REQUIRED';
  end if;

  if normalized_name is null or char_length(normalized_name) not between 2 and 100 then
    raise exception using errcode = 'P0001', message = 'INVALID_NAME';
  end if;

  if normalized_phone ~ '^05[0-9]{8}$' then
    normalized_phone := '+972' || substring(normalized_phone from 2);
  elsif normalized_phone ~ '^9725[0-9]{8}$' then
    normalized_phone := '+' || normalized_phone;
  end if;

  if normalized_phone !~ '^\+9725[0-9]{8}$' then
    raise exception using errcode = 'P0001', message = 'INVALID_PHONE';
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
  values (normalized_name, normalized_phone)
  on conflict (phone_e164) do update
  set full_name = excluded.full_name
  returning * into customer;

  insert into public.appointments (customer_id, starts_at, created_by)
  values (customer.id, requested_start, 'owner')
  returning * into new_appointment;

  return query
  select new_appointment.id, customer.id, new_appointment.starts_at;
end;
$$;

revoke all on function public.create_owner_booking(text, text, date, time)
  from public, anon;
grant execute on function public.create_owner_booking(text, text, date, time)
  to authenticated;

comment on function public.create_owner_booking(text, text, date, time) is
  'Allows an authenticated owner to atomically add a customer appointment.';
