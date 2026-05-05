-- Sample tributes for visual testing of the leaderboard, vote grid,
-- and shop target picker. Spread across districts and point ranges so
-- the Reaping Line cutoff is visible.

insert into public.hg_tributes (slug, name, district, role, points, credits) values
  ('finch',   'Finch Calloway',    3, 'tribute', 1850, 0),
  ('briar',   'Briar Wren',        4, 'tribute', 1620, 0),
  ('mason',   'Mason Hale',        2, 'tribute', 1480, 0),
  ('cassia',  'Cassia Grove',      6, 'tribute', 1390, 0),
  ('rye',     'Rye Marlowe',       9, 'tribute', 1340, 0),
  ('luna',    'Luna Vesper',       8, 'tribute', 1180, 0),
  ('june',    'June Ashby',        5, 'tribute', 1110, 0),
  ('arlo',    'Arlo Pierce',      10, 'tribute',  990, 0),
  ('seren',   'Seren Cole',       11, 'tribute',  920, 0),
  ('milo',    'Milo Forrester',    2, 'tribute',  780, 0),
  ('petra',   'Petra Lyon',        4, 'tribute',  640, 0),
  ('caspian', 'Caspian Drake',    13, 'tribute',  520, 0)
on conflict (slug) do nothing;
