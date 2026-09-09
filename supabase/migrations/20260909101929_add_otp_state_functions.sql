create or replace function public.record_otp_failure(p_challenge_id uuid)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_attempt_count smallint;
begin
  update public.otp_challenges
  set attempt_count = least(attempt_count + 1, 5)::smallint
  where id = p_challenge_id
    and verified_at is null
    and consumed_at is null
    and expires_at > now()
    and attempt_count < 5
  returning attempt_count into updated_attempt_count;

  return updated_attempt_count;
end;
$$;

create or replace function public.mark_otp_verified(p_challenge_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  verification_time timestamptz;
begin
  update public.otp_challenges as challenge
  set verified_at = now()
  where challenge.id = p_challenge_id
    and challenge.verified_at is null
    and challenge.consumed_at is null
    and challenge.expires_at > now()
    and challenge.attempt_count < 5
    and not exists (
      select 1
      from public.otp_challenges as newer
      where newer.phone_e164 = challenge.phone_e164
        and (newer.created_at, newer.id) > (challenge.created_at, challenge.id)
    )
  returning challenge.verified_at into verification_time;

  return verification_time;
end;
$$;

revoke all on function public.record_otp_failure(uuid) from public, anon, authenticated;
revoke all on function public.mark_otp_verified(uuid) from public, anon, authenticated;

grant execute on function public.record_otp_failure(uuid) to service_role;
grant execute on function public.mark_otp_verified(uuid) to service_role;

comment on function public.record_otp_failure(uuid) is
  'Atomically records one failed OTP verification attempt, up to five.';

comment on function public.mark_otp_verified(uuid) is
  'Atomically verifies an active challenge only when it is the phone''s newest challenge.';
