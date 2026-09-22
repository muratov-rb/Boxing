-- ===========================================================================
-- A banned account's browser must not be able to write its data back.
--
-- An admin ban (app/api/admin/user) sets subscriptions.banned, expires the
-- plan and wipes the account's data -- but it does not end the account's
-- sessions. The browser still holds a working login until its next full page
-- load, when SubscriptionSync's ban check signs it out.
--
-- Until 2026-09-22 that window was narrow, by accident: the sync mirror only
-- ran while the dashboard was on screen, straight after the ban check. It now
-- runs on every signed-in page for the whole life of the page (it had to --
-- meals are logged on /calories, which was never syncing at all), so a user
-- banned mid-session could keep re-uploading exactly the data the ban had just
-- removed, one logged meal at a time.
--
-- So the two sync functions refuse, here, where no client can skip it. A
-- banned caller's push writes nothing and returns 0 -- no error, because there
-- is nothing for the page to do about it; its next load signs it out.
--
-- Same functions as 006 otherwise: SECURITY INVOKER, user_id from auth.uid(),
-- SET list limited to the columns signed-in users may already update, `usage`
-- never mentioned. Signed-in users can already read their own subscriptions
-- row (SubscriptionSync does exactly that), so the check works under the
-- caller's own rights.
--
-- Residual, deliberately left: pushProfile is still a plain upsert on
-- user_profiles, which this does not cover. A profile is a few onboarding
-- answers, not activity history, and the next page load signs the user out.
--
-- Already applied to the live project; kept here so the schema has a history.
-- Idempotent.
-- ===========================================================================

create or replace function public.push_activity(p_rows jsonb)
returns integer
language sql
security invoker
set search_path = ''
as $$
  with written as (
    insert into public.user_activity
      (user_id, day, trained, visited, burned, water, meals, updated_at)
    select auth.uid(), r.day,
           coalesce(r.trained, false), coalesce(r.visited, false),
           coalesce(r.burned, 0), coalesce(r.water, 0),
           coalesce(r.meals, '[]'::jsonb), now()
    from jsonb_to_recordset(p_rows)
      as r(day date, trained boolean, visited boolean, burned integer, water integer, meals jsonb)
    where not exists (
      select 1 from public.subscriptions s
      where s.user_id = auth.uid() and s.banned is true
    )
    on conflict (user_id, day) do update
      set trained    = excluded.trained,
          visited    = excluded.visited,
          burned     = excluded.burned,
          water      = excluded.water,
          meals      = excluded.meals,
          updated_at = excluded.updated_at
    returning 1
  )
  select count(*)::integer from written;
$$;

create or replace function public.push_rank_seen(p_rank_seen integer)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.user_progress (user_id, rank_seen, updated_at)
  select auth.uid(), greatest(0, coalesce(p_rank_seen, 0)), now()
  where not exists (
    select 1 from public.subscriptions s
    where s.user_id = auth.uid() and s.banned is true
  )
  on conflict (user_id) do update
    set rank_seen  = excluded.rank_seen,
        updated_at = excluded.updated_at;
$$;

-- create or replace keeps existing grants, but they are restated so this file
-- is correct on its own.
revoke all on function public.push_activity(jsonb) from public, anon;
revoke all on function public.push_rank_seen(integer) from public, anon;
grant execute on function public.push_activity(jsonb) to authenticated;
grant execute on function public.push_rank_seen(integer) to authenticated;
