-- ===========================================================================
-- Web-push subscriptions, one row per device.
--
-- Reminders were device-local on purpose: a phone and a laptop are used at
-- different hours, and pushing one device's schedule onto the other produces
-- reminders at the wrong time. Push does not change that — the schedule is
-- stored WITH the subscription, so each device still keeps its own, and the
-- server is only mirroring what that device already decided.
--
-- The server needs the copy because the whole point is firing when the app is
-- closed, and a closed app cannot tell anyone what time it wanted.
--
-- NOT reachable from the browser. Every write goes through /api/push/subscribe
-- with the service role after the session is checked. RLS is on with no
-- policies and the grants are revoked, which together mean `authenticated`
-- cannot read or write this table at all — the same belt-and-braces as the
-- quota counters, where column grants rather than RLS alone are what actually
-- stops forgery.
-- ===========================================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- The push service's address for this device. Unique because re-subscribing
  -- on the same device returns the same endpoint, and that must update the row
  -- rather than accumulate duplicates that all fire at once.
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,

  -- IANA name ("Asia/Tashkent"), not a fixed offset: an offset saved in
  -- January is wrong in July wherever there is daylight saving, and the
  -- reminder would drift by an hour without anything looking broken.
  tz text not null default 'UTC',
  locale text not null default 'en',

  enabled boolean not null default true,
  slots jsonb not null default '[]'::jsonb,
  water jsonb not null default '{}'::jsonb,

  -- Minutes-of-day for meals logged on the device, so a meal reminder can
  -- still be skipped when you have just eaten. Only as fresh as the last time
  -- the app was open; stale data means a reminder is sent that might have been
  -- skipped, which is the right way round to be wrong.
  meal_minutes jsonb not null default '[]'::jsonb,

  -- Server-side dedupe, the same keys the client uses. This is what stops a
  -- cron that runs every minute from sending the same reminder sixty times.
  last_fired jsonb not null default '{}'::jsonb,

  -- Consecutive send failures. A push endpoint that is gone answers 404/410
  -- and the row is deleted outright; this counts the softer failures so a
  -- permanently broken row cannot be retried forever.
  failures integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The dispatcher reads every enabled row once a minute; this keeps that a
-- scan of the live ones rather than of everything ever subscribed.
create index if not exists push_subscriptions_enabled_idx
  on public.push_subscriptions (enabled)
  where enabled;

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- No policies on purpose: with RLS enabled and none defined, `authenticated`
-- matches nothing. The revokes below mean it cannot even attempt a read.
revoke all on public.push_subscriptions from anon, authenticated;
grant all on public.push_subscriptions to service_role;
