-- ===========================================================================
-- Give back a daily-quota unit spent on a call that then failed.
--
-- Already applied to the live project; kept here so the schema has a history.
-- Idempotent — running it twice is harmless.
--
-- Why a function and not an UPDATE from the app: the counter is read, checked
-- and written under a row lock. consume_usage does that so twenty requests
-- fired at once cannot all slip past a 2/day limit; a refund that did
-- read-modify-write from JavaScript would be the race that lock exists to
-- prevent, only pointing the other way.
--
-- Why refund at all, rather than counting on success: spending BEFORE the
-- model call is what makes the limit hold under concurrency. Counting after
-- would be check-then-act, and the limit would be a suggestion. So the spend
-- stays first and a failure hands the unit back.
-- ===========================================================================

create or replace function public.refund_usage(p_user uuid, p_day date, p_key text)
returns integer
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  used integer;
begin
  select coalesce((usage ->> p_key)::integer, 0) into used
  from public.user_activity
  where user_id = p_user and day = p_day
  for update;

  -- No row for the day: nothing was ever counted, so there is nothing to give
  -- back. Deliberately does NOT insert one -- a refund must never be a way to
  -- create allowance out of nothing.
  if not found then
    return 0;
  end if;

  if used <= 0 then
    return 0;
  end if;

  update public.user_activity
  set usage = usage || jsonb_build_object(p_key, used - 1),
      updated_at = now()
  where user_id = p_user and day = p_day;

  return used - 1;
end;
$function$;

-- Postgres grants EXECUTE to PUBLIC on a new function by default, which would
-- hand every signed-in user a way to reset their own counters from the browser
-- with the publishable key. Match the other three functions: service_role only.
revoke all on function public.refund_usage(uuid, date, text) from public;
revoke all on function public.refund_usage(uuid, date, text) from anon;
revoke all on function public.refund_usage(uuid, date, text) from authenticated;
grant execute on function public.refund_usage(uuid, date, text) to service_role;
