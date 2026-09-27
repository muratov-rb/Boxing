-- ===========================================================================
-- Bound what a signed-in user can write directly, found in the 2026-09-27
-- audit. Each hole below was proven against the live database as an ordinary
-- signed-in user, inside a transaction that was then rolled back.
--
-- 1. user_profiles: the browser only ever writes `profile` (lib/sync.ts
--    pushProfile upserts user_id, profile, updated_at). Name, avatar and
--    friend code are written only by server routes, after their own checks
--    (/api/profile, /api/profile/avatar, /api/friends). But `authenticated`
--    held table-wide INSERT and UPDATE, so all three could be written straight
--    through PostgREST, skipping those checks:
--    - avatar_url set to an image on an attacker's own *.supabase.co project
--      (which the CSP allows) turns every partner's /friends page into a
--      tracking pixel: their IP address and when they looked.
--    - display_name set to "RingBornn Support" -- impersonation, shown to
--      partners and in challenges.
--    The grant is TABLE-level, so revoking single columns would change
--    nothing (a column REVOKE does not remove a table grant -- measure, as
--    with pg_net). Revoke the table grants, re-grant only the columns the
--    browser writes.
--
-- 2. Unbounded storage. A signed-in user could insert user_activity rows for
--    ANY date (1900-01-01 was accepted) with meal lists of any size, and a
--    `profile` of any size (1.2 MB was accepted). One account could fill the
--    database and take the app down for everyone. Now:
--    - activity days must fall between 2026-01-01 (before the app existed)
--      and two days ahead of UTC (the furthest-ahead time zone is one day
--      ahead; the second day is slack);
--    - a day's meal list is capped at 64 KB of JSON (a heavy real day is a
--      few KB);
--    - a profile is capped at 32 KB of JSON (a real one is 1-3 KB).
--    Measured with octet_length(::text), not pg_column_size: the latter is
--    the COMPRESSED size, and a megabyte of repetition compresses to almost
--    nothing (the probe's meal list was 16 KB on disk).
--
-- A trigger rather than CHECK constraints for the activity rules, because the
-- date window moves with now(), and a CHECK must not depend on the clock. It
-- runs for every writer, the push_activity RPC included (it is SECURITY
-- INVOKER), and the server's own quota writes only ever touch today's row.
--
-- The tables were empty when this was applied (all accounts removed that
-- day), so no existing row could be caught out.
--
-- Applied to the live project; kept here so the schema has a history.
-- ===========================================================================

-- 1. user_profiles: only the columns the browser actually writes.
revoke insert, update on table public.user_profiles from authenticated;
grant insert (user_id, profile, updated_at) on table public.user_profiles to authenticated;
grant update (user_id, profile, updated_at) on table public.user_profiles to authenticated;

-- 2a. Profile size.
alter table public.user_profiles
  drop constraint if exists user_profiles_profile_size;
alter table public.user_profiles
  add constraint user_profiles_profile_size
  check (profile is null or octet_length(profile::text) <= 32768);

-- 2b. Activity rows: a sane date and a bounded meal list.
create or replace function public.guard_activity_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.day < date '2026-01-01'
     or new.day > (now() at time zone 'utc')::date + 2 then
    raise exception 'activity day % is outside the allowed range', new.day
      using errcode = '22023';
  end if;
  if new.meals is not null and octet_length(new.meals::text) > 65536 then
    raise exception 'meal list for % is too large', new.day
      using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_activity_row() from public, anon, authenticated;

drop trigger if exists guard_activity_row on public.user_activity;
create trigger guard_activity_row
  before insert or update on public.user_activity
  for each row execute function public.guard_activity_row();
