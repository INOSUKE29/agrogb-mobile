create function public.hook_mfa_verification_attempt(event jsonb)
  returns jsonb
  language plpgsql
as $$
  declare
    last_failed_at timestamp;
  begin
    if event->'valid' is true then
      -- code is valid, accept it
      return jsonb_build_object('decision', 'continue');
    end if;

    select last_failed_at into last_failed_at
      from public.mfa_failed_verification_attempts
      where
        user_id = (event->'user_id')::uuid
          and
        factor_id = event->'factor_id';

    if last_failed_at is not null and now() - last_failed_at < interval '2 seconds' then
      -- last attempt was done too quickly
      return jsonb_build_object(
        'error', jsonb_build_object(
          'http_code', 429,
          'message',   'Please wait a moment before trying again.'
        )
      );
    end if;

    -- record this failed attempt
    insert into public.mfa_failed_verification_attempts
      (
        user_id,
        factor_id,
        last_refreshed_at
      )
      values
      (
        event->'user_id',
        event->'factor_id',
        now()
      )
      on conflict do update
        set last_refreshed_at = now();

    -- finally let Supabase Auth do the default behavior for a failed attempt
    return jsonb_build_object('decision', 'continue');
  end;
$$;

-- Assign appropriate permissions and revoke access
grant execute
  on function public.hook_mfa_verification_attempt
  to supabase_auth_admin;

grant all
  on table public.mfa_failed_verification_attempts
  to supabase_auth_admin;

revoke execute
  on function public.hook_mfa_verification_attempt
  from authenticated, anon, public;

revoke all
  on table public.mfa_failed_verification_attempts
  from authenticated, anon, public;

grant usage on schema public to supabase_auth_admin;