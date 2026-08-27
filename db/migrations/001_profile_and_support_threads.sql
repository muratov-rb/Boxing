-- ===========================================================================
-- Names, avatars, and support that answers inside the site.
--
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Every statement is idempotent, so running it twice is harmless.
--
-- No RLS policies are added on purpose. Every table here stays service-role
-- only, exactly like the rest of the schema, and the browser reaches its own
-- rows through our API routes, which check the session first. Opening these
-- to the anon key would be a wider change than the feature needs.
-- ===========================================================================

-- --------------------------------------------------------------------------
-- 1. Who the user is: a name they choose, and a picture.
--    Both live beside the existing `profile` jsonb rather than inside it:
--    the blob is overwritten wholesale by the sync, and a name typed on one
--    device must not be lost by a stale push from another.
-- --------------------------------------------------------------------------
alter table public.user_profiles
  add column if not exists display_name text,
  add column if not exists avatar_url   text;

alter table public.user_profiles
  drop constraint if exists user_profiles_display_name_len;
alter table public.user_profiles
  add constraint user_profiles_display_name_len
  check (display_name is null or char_length(display_name) between 1 and 40);

-- --------------------------------------------------------------------------
-- 2. Support becomes a conversation.
--    A ticket already exists; this is everything said after it. Author is
--    'user' or 'admin' so one table carries both sides in order.
-- --------------------------------------------------------------------------
create table if not exists public.support_replies (
  id         bigserial primary key,
  ticket_id  bigint not null references public.support_tickets(id) on delete cascade,
  author     text   not null check (author in ('user', 'admin')),
  body       text   not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists support_replies_ticket_idx
  on public.support_replies (ticket_id, created_at);

alter table public.support_replies enable row level security;

-- Unread marker. The owner answers; the user should see that without email.
alter table public.support_tickets
  add column if not exists last_reply_at  timestamptz,
  add column if not exists user_seen_at   timestamptz;

-- --------------------------------------------------------------------------
-- 3. Tickets filed before this migration have no thread yet. Nothing to
--    backfill -- an absent last_reply_at simply reads as "no reply".
-- --------------------------------------------------------------------------
