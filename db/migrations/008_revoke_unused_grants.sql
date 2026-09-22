-- ===========================================================================
-- Take away privileges the browser never uses, so RLS is not the only wall.
--
-- Supabase's default setup grants ALL on every public table to anon and
-- authenticated, and leaves row-level security to decide what they may touch.
-- The 2026-09-22 security audit found that, for several tables, RLS was the
-- ONLY thing standing between a visitor and the data:
--
-- - Six server-only tables (admin_audit, admin_login_attempts, challenges,
--   friendships, support_replies, support_tickets) granted SELECT, INSERT,
--   UPDATE and DELETE to anon, and were safe purely because RLS was on with no
--   policies. A future policy, or someone switching RLS off to debug, and the
--   admin audit trail or the admin login-attempt counter (the brute-force
--   limiter) is readable -- or deletable -- by anyone.
--
-- - Signed-in users held DELETE on user_activity, the row that carries the AI
--   quota counter. Deleting today's row is the most direct way to reset a
--   quota, and only the absence of a DELETE policy prevented it (verified: it
--   deleted 0 rows). One well-meant "users may delete their own data" policy
--   would have reopened it.
--
-- - anon and authenticated held TRUNCATE on nearly every table. TRUNCATE is not
--   subject to RLS at all: it empties the table for EVERY user in one
--   statement. Nothing in the API can issue it today, which is the only reason
--   it was not a live vulnerability.
--
-- What the browser actually needs was established by reading every file that
-- creates a browser Supabase client (AuthCard, VerifyCode, SubscriptionSync,
-- lib/sync.ts): SELECT on its own subscriptions / profile / progress /
-- activity rows, the profile upsert, and EXECUTE on push_activity and
-- push_rank_seen. Everything below is outside that set. The server uses the
-- service role, which none of this touches.
--
-- NOT FIXED HERE, and cannot be: pg_net's schema and functions are granted to
-- PUBLIC by supabase_admin, and Postgres only lets a role revoke grants it made
-- itself. A revoke from postgres reports success and changes nothing (measured
-- 2026-09-22). It is unreachable because PostgREST does not expose the `net`
-- schema and no public function calls net.* -- keep both of those true.
--
-- Applied to the live project; kept here so the schema has a history.
-- Idempotent.
-- ===========================================================================

-- 1. Server-only tables: nobody but the service role has any business here.
revoke all on
  public.admin_audit,
  public.admin_login_attempts,
  public.challenges,
  public.friendships,
  public.support_replies,
  public.support_tickets
from anon, authenticated;

-- 2. User data: a signed-out visitor needs nothing at all.
revoke all on
  public.user_activity,
  public.user_progress,
  public.user_profiles,
  public.subscriptions
from anon;

-- 3. User data, signed in: keep SELECT and the column-level INSERT/UPDATE the
--    sync relies on; drop what nothing uses and RLS cannot fully guard.
--    TRUNCATE bypasses RLS entirely; DELETE on user_activity is the quota
--    reset; TRIGGER, REFERENCES and MAINTAIN have no browser use at all.
revoke delete, truncate, trigger, references, maintain on
  public.user_activity,
  public.user_progress,
  public.user_profiles,
  public.subscriptions
from authenticated;
