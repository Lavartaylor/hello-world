-- ====================================================================
-- Lock in the 5 weekly challenges for the 75th Hunger Games.
-- These get displayed across leaderboard / admin / challenge pages
-- and drive the shop's item list.
-- ====================================================================

insert into public.hg_challenges (id, week, name, description) values
  ('w1_tribute_profile',  1, 'The Tribute Profile',
   'Submit a 60-second video pitch and portrait declaring your district persona. Identity / creative challenge.'),

  ('w2_survival_trial',   2, 'Survival Trial',
   'Submit photo or video proof of a real-world task: build a fire outside, tie three knots, forage, etc. Practical grit.'),

  ('w3_mind_games',       3, 'Mind Games',
   'Online trivia and puzzle gauntlet — 30 questions mixing the source material, pop culture, and logic puzzles. Mental challenge before the freeze.'),

  ('w4_hunt_and_gather',  4, 'Hunt & Gather',
   'Photo scavenger hunt — find and document 20 themed items and locations in the wild. First Capitol-active week: shop opens.'),

  ('w5_sponsor_showcase', 5, 'Sponsor Showcase',
   'Final 60–90 second showcase video — your pitch to win. Capitol votes amplified by credit spends.')

on conflict (id) do update set
  week = excluded.week,
  name = excluded.name,
  description = excluded.description;
