-- ====================================================================
-- Admin write access — loosen RLS so the /admin/{secret} console can
-- promote RSVPs into tributes and edit points/credits/training scores.
-- The secret URL gates writes via obscurity; acceptable for a 20-person
-- friend event. Tighten via a serverless function with service_role
-- key if/when this grows.
-- ====================================================================

-- Tributes: allow anon insert + update from admin
drop policy if exists "hg_tributes_admin_insert" on public.hg_tributes;
drop policy if exists "hg_tributes_admin_update" on public.hg_tributes;
create policy "hg_tributes_admin_insert" on public.hg_tributes
  for insert with check (true);
create policy "hg_tributes_admin_update" on public.hg_tributes
  for update using (true) with check (true);

-- RSVPs: track when admin promoted the row so we don't re-process it
alter table public.hg_rsvps
  add column if not exists promoted_at timestamptz;

drop policy if exists "hg_rsvps_admin_update" on public.hg_rsvps;
create policy "hg_rsvps_admin_update" on public.hg_rsvps
  for update using (true) with check (true);
