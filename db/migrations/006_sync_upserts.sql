-- ===========================================================================
-- Let the browser's sync write its own rows again, without widening what it
-- may write.
--
-- Every sync push to user_activity and user_progress has failed since the
-- 2026-07-28 hardening (lock_xp_and_usage_columns), with 42501 "permission
-- denied", and nothing noticed because supabase-js returns the error rather
-- than throwing it. The pushed columns were never the problem. The cause is
-- how PostgREST writes an upsert:
--
--   INSERT ... ON CONFLICT (day, user_id) DO UPDATE SET
--     burned = EXCLUDED.burned, day = EXCLUDED.day, ..., user_id = EXCLUDED.user_id
--
-- It puts every column of the payload in the SET list, the conflict key
-- included. Postgres checks UPDATE privilege on each SET column when the
-- statement starts, whether or not a row actually conflicts, and the hardening
-- granted UPDATE on everything except user_id and day. user_profiles escaped
-- only because its UPDATE grant happens to include user_id.
--
-- Postgres's own hint -- GRANT UPDATE ON public.user_activity TO authenticated
-- -- is the wrong fix. UPDATE on `day` lets a user move today's row, quota
-- counter and all, onto another date, and consume_usage then starts them on a
-- fresh one. The grants stay exactly as they are.
--
-- Instead these two functions issue the same upsert with the SET list limited
-- to the columns authenticated is already allowed to update. They are
-- SECURITY INVOKER (the default, spelled out): they run as the caller, under
-- the caller's column grants and RLS, so they can do nothing a signed-in user
-- could not already do with a plain INSERT followed by an UPDATE. user_id
-- comes from auth.uid(), never from the request, and `usage` is not
-- mentioned at all.
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
  values (auth.uid(), greatest(0, coalesce(p_rank_seen, 0)), now())
  on conflict (user_id) do update
    set rank_seen  = excluded.rank_seen,
        updated_at = excluded.updated_at;
$$;

-- Signed-in users only. anon could not write through them anyway (it holds
-- no INSERT grant and auth.uid() is null), but there is no reason to offer.
revoke all on function public.push_activity(jsonb) from public, anon;
revoke all on function public.push_rank_seen(integer) from public, anon;
grant execute on function public.push_activity(jsonb) to authenticated;
grant execute on function public.push_rank_seen(integer) to authenticated;
