-- ====================================================================
-- Add optional profile photo to hg_rsvps
-- Stored inline as a base64 data URL — fine for ~20 RSVPs at small size.
-- (Can be migrated to Supabase Storage later if photos get heavy.)
-- ====================================================================

alter table public.hg_rsvps
  add column if not exists profile_photo text;

-- Also add the column to tributes so it can be copied over when an RSVP
-- is promoted to a tribute by the gamemaker dashboard.
alter table public.hg_tributes
  add column if not exists profile_photo text;
