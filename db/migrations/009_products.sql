-- ===========================================================================
-- Products the app has learned from nutrition labels, keyed by barcode.
--
-- Open Food Facts is the barcode database, and in Uzbekistan it is thin:
-- ~1,650 products in September 2026 against ~974,000 for the US. When a
-- barcode is unknown the scanner sends people to photograph the label, and a
-- label read is exact -- so it is kept here against the barcode that sent
-- them, and the next person to scan that product gets it instantly, with no
-- AI call. This is how the big food apps built their local coverage.
--
-- Only high-confidence reads of a single product are stored (see
-- lib/products.ts). A read that disagrees with an unconfirmed row replaces
-- it; once two reads agree the row is confirmed and a disagreeing read no
-- longer overwrites it, so one bad photo cannot poison a product for everyone.
--
-- Not personal data: what a product contains. created_by is kept only so a
-- banned account's contributions can be found, and is set null when the
-- account is deleted rather than taking the product with it.
--
-- NOT reachable from the browser: RLS on with no policies and every grant
-- revoked, the same belt-and-braces as 008. Reads and writes go through
-- /api/food-barcode and /api/food-scan with the service role.
--
-- Applied to the live project; kept here so the schema has a history.
-- ===========================================================================

create table if not exists public.products (
  barcode text primary key check (barcode ~ '^[0-9]{8,14}$'),
  name text not null check (char_length(name) between 1 and 80),

  -- The portion a scan starts at: the printed serving, or the whole pack when
  -- it is eaten in one go, or 100.
  grams integer not null check (grams between 1 and 2500),

  -- Composition per 100 g (or 100 ml), as printed.
  kcal numeric(6, 2) not null check (kcal between 0 and 900),
  protein numeric(6, 2) not null check (protein between 0 and 100),
  carbs numeric(6, 2) not null check (carbs between 0 and 100),
  fat numeric(6, 2) not null check (fat between 0 and 100),
  fiber numeric(6, 2) not null check (fiber between 0 and 100),

  -- Milligrams per 100 g: iron, calcium, potassium, sodium, vitaminC.
  micros jsonb not null default '{}'::jsonb,

  source text not null default 'label' check (source in ('label')),
  confirmations integer not null default 1,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
revoke all on table public.products from anon, authenticated;
