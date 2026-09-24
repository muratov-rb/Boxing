-- ===========================================================================
-- Remove the learned-products store (009).
--
-- The barcode and nutrition-label modes were removed from the scanner on
-- 2026-09-24: for this app's market Open Food Facts barely covers local
-- products, a label read costs an AI scan anyway, and typing the calories
-- printed on a pack into the manual entry is as accurate and quicker. This
-- table only ever served those modes. It was empty when dropped (checked
-- immediately before), and nothing else referenced it -- plain DROP, no
-- CASCADE, so it would have refused if anything had.
--
-- The one leftover rate-limit row for barcode lookups ('barcode:<user>') is
-- cleared too; nothing reads that key any more.
--
-- Applied to the live project; kept here so the schema has a history.
-- ===========================================================================

drop table if exists public.products;

delete from public.admin_login_attempts where client_key like 'barcode:%';
