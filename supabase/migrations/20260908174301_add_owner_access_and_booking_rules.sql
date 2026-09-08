create or replace function public.is_owner()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner',
    false
  );
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to authenticated, service_role;

grant usage on schema public to authenticated;
grant select, insert, update on table public.customers to authenticated;
grant select, insert, update on table public.appointments to authenticated;

create policy "Owners can view customers"
on public.customers
for select
to authenticated
using ((select public.is_owner()));

create policy "Owners can create customers"
on public.customers
for insert
to authenticated
with check ((select public.is_owner()));

create policy "Owners can update customers"
on public.customers
for update
to authenticated
using ((select public.is_owner()))
with check ((select public.is_owner()));

create policy "Owners can view appointments"
on public.appointments
for select
to authenticated
using ((select public.is_owner()));

create policy "Owners can create appointments"
on public.appointments
for insert
to authenticated
with check (
  (select public.is_owner())
  and created_by = 'owner'
);

create policy "Owners can update appointments"
on public.appointments
for update
to authenticated
using ((select public.is_owner()))
with check ((select public.is_owner()));

alter table public.appointments
  add constraint appointments_half_hour_slot_valid
  check (
    extract(second from starts_at) = 0
    and mod(extract(minute from starts_at)::integer, 30) = 0
  );

create unique index appointments_one_confirmed_per_slot_idx
  on public.appointments (starts_at)
  where status = 'confirmed';

comment on function public.is_owner() is
  'Returns true when the authenticated user has app_metadata.role = owner.';

comment on index public.appointments_one_confirmed_per_slot_idx is
  'Prevents two confirmed appointments for the POC''s single barber at one slot.';
