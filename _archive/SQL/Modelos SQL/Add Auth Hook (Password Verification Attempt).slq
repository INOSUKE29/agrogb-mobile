create function public.hook_password_verification_attempt(event jsonb)
returns jsonb
language plpgsql
as $$
  declare
    last_failed_at timestamp;
  begin
    if event->'valid' is true then
      -- password is valid, accept it
      return jsonb_build_object('decision', 'continue');
    end if;

    select last_failed_at into last_failed_at
      from public.password_failed_verification_attempts
      where
        user_id = (event->'user_id')::uuid;

    if last_failed_at is not null and now() - last_failed_at < interval '10 seconds' then
      -- last attempt was done too quickly
      return jsonb_build_object(
        'error', jsonb_build_object(
          'http_code', 429,
          'message',   'Please wait a moment before trying again.'
        )
      );
    end if;

    -- record this failed attempt
    insert into public.password_failed_verification_attempts
      (
        user_id,
        last_failed_at
      )
      values
      (
        event->'user_id',
        now()
      )
      on conflict do update
        set last_failed_at = now();

    -- finally let Supabase Auth do the default behavior for a failed attempt
    return jsonb_build_object('decision', 'continue');
  end;
$$;

-- Assign appropriate permissions
grant execute
  on function public.hook_password_verification_attempt
  to supabase_auth_admin;

grant all
  on table public.password_failed_verification_attempts
  to supabase_auth_admin;

revoke execute
  on function public.hook_password_verification_attempt
  from authenticated, anon, public;

revoke all
  on table public.password_failed_verification_attempts
  from authenticated, anon, public;

grant usage on schema public to supabase_auth_admin;