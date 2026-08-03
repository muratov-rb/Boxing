import { AdminClient } from "@/components/admin/AdminClient";
import type { UserRow } from "@/lib/admin-stats";

/* Layout bench for the admin panel — /dev/admin, 404 in production.

   The real panel needs the service-role key, which only exists in Vercel, so
   there was no way to look at the user rows on a phone-sized viewport without
   deploying first. These are invented accounts covering the states the layout
   has to survive: a long email that must truncate, a banned row, a trial, and
   both billing periods. */

const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const USERS: UserRow[] = [
  {
    user_id: "11111111-1111-4111-8111-111111111111",
    email: "an.unusually.long.address.that.must.truncate@example-domain.com",
    plan: "max",
    period: "yearly",
    trial_start: day(120).slice(0, 10),
    banned: false,
    banned_at: null,
    updated_at: day(3),
    last_active: day(1).slice(0, 10),
  },
  {
    user_id: "22222222-2222-4222-8222-222222222222",
    email: "pro@example.com",
    plan: "pro",
    period: "monthly",
    trial_start: day(60).slice(0, 10),
    banned: false,
    banned_at: null,
    updated_at: day(10),
    last_active: day(2).slice(0, 10),
  },
  {
    user_id: "33333333-3333-4333-8333-333333333333",
    email: "budget@example.com",
    plan: "budget",
    period: "monthly",
    trial_start: day(40).slice(0, 10),
    banned: false,
    banned_at: null,
    updated_at: day(20),
    last_active: null,
  },
  {
    user_id: "44444444-4444-4444-8444-444444444444",
    email: "on.trial@example.com",
    plan: "trial",
    period: null,
    trial_start: day(3).slice(0, 10),
    banned: false,
    banned_at: null,
    updated_at: day(3),
    last_active: day(0).slice(0, 10),
  },
  {
    user_id: "55555555-5555-4555-8555-555555555555",
    email: "banned@example.com",
    plan: "expired",
    period: null,
    trial_start: day(200).slice(0, 10),
    banned: true,
    banned_at: day(5),
    updated_at: day(5),
    last_active: day(6).slice(0, 10),
  },
];

export default function AdminBench() {
  return <AdminClient users={USERS} me={{ username: "admin", role: "owner" }} />;
}
