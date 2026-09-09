begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(10);

create temporary table test_context as
with values_for_test as (
  select
    gen_random_uuid() as direct_customer_id,
    gen_random_uuid() as booking_challenge_id,
    gen_random_uuid() as blocked_challenge_id,
    gen_random_uuid() as expired_challenge_id,
    (floor(random() * 70000000) + 10000000)::bigint as phone_base
)
select
  direct_customer_id,
  booking_challenge_id,
  blocked_challenge_id,
  expired_challenge_id,
  '+9725' || lpad(phone_base::text, 8, '0') as direct_phone,
  '+9725' || lpad((phone_base + 1)::text, 8, '0') as booking_phone,
  '+9725' || lpad((phone_base + 2)::text, 8, '0') as blocked_phone,
  '+9725' || lpad((phone_base + 3)::text, 8, '0') as expired_phone,
  (
    select candidate::date
    from generate_series(
      (now() at time zone 'Asia/Jerusalem')::date + 1,
      (now() at time zone 'Asia/Jerusalem')::date + 7,
      interval '1 day'
    ) as candidate
    where extract(isodow from candidate) in (1, 2, 3, 4, 7)
    order by candidate
    limit 1
  ) as booking_date
from values_for_test;

create function pg_temp.double_booking_is_rejected(
  p_customer_id uuid,
  p_starts_at timestamptz
)
returns boolean
language plpgsql
as $$
begin
  insert into public.appointments (customer_id, starts_at)
  values (p_customer_id, p_starts_at);
  return false;
exception
  when unique_violation then return true;
end;
$$;

create function pg_temp.slot_can_be_rebooked(
  p_customer_id uuid,
  p_starts_at timestamptz
)
returns boolean
language plpgsql
as $$
begin
  insert into public.appointments (customer_id, starts_at)
  values (p_customer_id, p_starts_at);
  return true;
exception
  when others then return false;
end;
$$;

create function pg_temp.booking_fails_with(
  p_challenge_id uuid,
  p_booking_date date,
  p_booking_time time,
  p_token_hash text,
  p_expected_message text
)
returns boolean
language plpgsql
as $$
begin
  perform *
  from public.create_customer_booking(
    p_challenge_id,
    'Stage Nine Test',
    p_booking_date,
    p_booking_time,
    p_token_hash
  );
  return false;
exception
  when others then return sqlerrm = p_expected_message;
end;
$$;

insert into public.customers (id, full_name, phone_e164)
select direct_customer_id, 'Stage Nine Direct', direct_phone
from test_context;

insert into public.appointments (customer_id, starts_at)
select
  direct_customer_id,
  (booking_date + time '09:00') at time zone 'Asia/Jerusalem'
from test_context;

select extensions.ok(
  pg_temp.double_booking_is_rejected(
    direct_customer_id,
    (booking_date + time '09:00') at time zone 'Asia/Jerusalem'
  ),
  'the database rejects two confirmed appointments for one slot'
)
from test_context;

update public.appointments
set status = 'cancelled', cancelled_at = now()
where customer_id = (select direct_customer_id from test_context)
  and starts_at = (
    select (booking_date + time '09:00') at time zone 'Asia/Jerusalem'
    from test_context
  );

select extensions.ok(
  pg_temp.slot_can_be_rebooked(
    direct_customer_id,
    (booking_date + time '09:00') at time zone 'Asia/Jerusalem'
  ),
  'cancelling an appointment releases its slot'
)
from test_context;

insert into public.otp_challenges (
  id,
  phone_e164,
  code_hash,
  expires_at,
  verified_at
)
select
  booking_challenge_id,
  booking_phone,
  repeat('1', 64),
  now() + interval '5 minutes',
  now()
from test_context;

select extensions.is(
  (
    select count(*)::integer
    from public.create_customer_booking(
      booking_challenge_id,
      'Stage Nine Booking',
      booking_date,
      time '09:30',
      repeat('b', 64)
    )
  ),
  1,
  'a verified OTP creates exactly one appointment'
)
from test_context;

select extensions.ok(
  (select consumed_at is not null from public.otp_challenges
    where id = booking_challenge_id),
  'creating the appointment consumes the OTP challenge'
)
from test_context;

select extensions.ok(
  pg_temp.booking_fails_with(
    booking_challenge_id,
    booking_date,
    time '10:30',
    repeat('c', 64),
    'OTP_ALREADY_USED'
  ),
  'a consumed OTP cannot create another appointment'
)
from test_context;

insert into public.customers (full_name, phone_e164, is_blocked)
select 'Stage Nine Blocked', blocked_phone, true
from test_context;

insert into public.otp_challenges (
  id,
  phone_e164,
  code_hash,
  expires_at,
  verified_at
)
select
  blocked_challenge_id,
  blocked_phone,
  repeat('2', 64),
  now() + interval '5 minutes',
  now()
from test_context;

select extensions.ok(
  pg_temp.booking_fails_with(
    blocked_challenge_id,
    booking_date,
    time '11:00',
    repeat('d', 64),
    'CUSTOMER_BLOCKED'
  ),
  'a blocked customer cannot create an appointment'
)
from test_context;

insert into public.otp_challenges (
  id,
  phone_e164,
  code_hash,
  created_at,
  expires_at,
  verified_at
)
select
  expired_challenge_id,
  expired_phone,
  repeat('3', 64),
  now() - interval '10 minutes',
  now() - interval '5 minutes',
  now() - interval '9 minutes'
from test_context;

select extensions.ok(
  pg_temp.booking_fails_with(
    expired_challenge_id,
    booking_date,
    time '11:30',
    repeat('e', 64),
    'OTP_EXPIRED'
  ),
  'an expired OTP cannot create an appointment'
)
from test_context;

select extensions.is(
  (select status from public.cancel_customer_appointment(repeat('b', 64))),
  'cancelled',
  'the matching cancellation hash cancels its appointment'
);

select extensions.is(
  (select status from public.cancel_customer_appointment(repeat('b', 64))),
  'cancelled',
  'repeating cancellation is safe and returns the cancelled appointment'
);

select extensions.is(
  (
    select count(*)::integer
    from public.cancel_customer_appointment(repeat('f', 64))
  ),
  0,
  'an unknown cancellation hash changes no appointment'
);

select * from extensions.finish();
rollback;
