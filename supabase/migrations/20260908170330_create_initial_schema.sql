create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_e164 text not null unique,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),

  constraint customers_full_name_valid
    check (
      full_name = btrim(full_name)
      and char_length(full_name) between 1 and 100
    ),
  constraint customers_phone_e164_valid
    check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  starts_at timestamptz not null,
  status text not null default 'confirmed',
  created_by text not null default 'customer',
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),

  constraint appointments_status_valid
    check (status in ('confirmed', 'cancelled')),
  constraint appointments_created_by_valid
    check (created_by in ('customer', 'owner')),
  constraint appointments_cancellation_valid
    check (
      (status = 'confirmed' and cancelled_at is null)
      or (status = 'cancelled' and cancelled_at is not null)
    )
);

create table public.otp_challenges (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text not null,
  purpose text not null default 'booking',
  code_hash text not null,
  attempt_count smallint not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),

  constraint otp_challenges_phone_e164_valid
    check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  constraint otp_challenges_purpose_valid
    check (purpose = 'booking'),
  constraint otp_challenges_attempt_count_valid
    check (attempt_count between 0 and 5),
  constraint otp_challenges_expiry_valid
    check (expires_at > created_at),
  constraint otp_challenges_verified_at_valid
    check (verified_at is null or verified_at >= created_at),
  constraint otp_challenges_consumed_at_valid
    check (
      consumed_at is null
      or (verified_at is not null and consumed_at >= verified_at)
    )
);

create index appointments_customer_id_idx
  on public.appointments (customer_id);

create index appointments_upcoming_idx
  on public.appointments (starts_at)
  where status = 'confirmed';

create index otp_challenges_phone_created_at_idx
  on public.otp_challenges (phone_e164, created_at desc);

create index otp_challenges_expires_at_idx
  on public.otp_challenges (expires_at);

alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.otp_challenges enable row level security;

revoke all on table public.customers from anon, authenticated;
revoke all on table public.appointments from anon, authenticated;
revoke all on table public.otp_challenges from anon, authenticated;

grant select, insert, update, delete on table public.customers to service_role;
grant select, insert, update, delete on table public.appointments to service_role;
grant select, insert, update, delete on table public.otp_challenges to service_role;

comment on table public.customers is
  'Customers for the single-business salon booking POC.';

comment on table public.appointments is
  'Thirty-minute appointments for the POC''s single barber and service.';

comment on table public.otp_challenges is
  'Short-lived WhatsApp OTP challenges. Codes are stored only as keyed hashes.';
