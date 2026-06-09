-- ====================================================================
-- Collapse "points" and "credits" into a single currency called credits.
-- Old `credits` column was unused (every row was 0) — safe to drop.
-- Old `points` column carried the live values — rename to `credits`.
-- Same on hg_challenge_results.
-- ====================================================================

alter table public.hg_tributes drop column if exists credits;
alter table public.hg_tributes rename column points to credits;

alter table public.hg_challenge_results rename column points to credits;
