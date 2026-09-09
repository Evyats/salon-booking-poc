begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(12);

select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.customers'::regclass),
  'customers has RLS enabled'
);
select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.appointments'::regclass),
  'appointments has RLS enabled'
);
select extensions.ok(
  (select relrowsecurity from pg_class where oid = 'public.otp_challenges'::regclass),
  'otp_challenges has RLS enabled'
);

select extensions.ok(
  not has_table_privilege('anon', 'public.customers', 'select'),
  'anonymous users have no customer-table access'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.appointments', 'select'),
  'anonymous users have no appointment-table access'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.otp_challenges', 'select'),
  'anonymous users have no OTP-table access'
);

select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.create_customer_booking(uuid,text,date,time,text)',
    'execute'
  ),
  'anonymous users cannot call the customer-booking SQL function'
);
select extensions.ok(
  not has_function_privilege(
    'authenticated',
    'public.create_customer_booking(uuid,text,date,time,text)',
    'execute'
  ),
  'authenticated browser users cannot call the customer-booking SQL function'
);
select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.cancel_customer_appointment(text)',
    'execute'
  ),
  'anonymous users cannot call the cancellation SQL function'
);
select extensions.ok(
  not has_function_privilege(
    'authenticated',
    'public.cancel_customer_appointment(text)',
    'execute'
  ),
  'authenticated browser users cannot call the cancellation SQL function'
);
select extensions.ok(
  has_function_privilege(
    'service_role',
    'public.create_customer_booking(uuid,text,date,time,text)',
    'execute'
  ),
  'the trusted backend can call the customer-booking SQL function'
);
select extensions.ok(
  has_function_privilege(
    'service_role',
    'public.cancel_customer_appointment(text)',
    'execute'
  ),
  'the trusted backend can call the cancellation SQL function'
);

select * from extensions.finish();
rollback;
