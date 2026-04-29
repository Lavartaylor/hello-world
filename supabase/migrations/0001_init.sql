-- ====================================================================
-- 75th Hunger Games — Halloween 2026 event tables
-- Lives in personal Supabase project: bdenaszyupuelismxyer
-- All tables prefixed `hg_` so they don't collide with other personal
-- projects (Chroma etc.) sharing this database.
-- ====================================================================

-- --------------------------------------------------------------------
-- Tributes — source of truth for citizens (the participants)
-- --------------------------------------------------------------------
create table if not exists public.hg_tributes (
  slug            text primary key,
  name            text not null,
  district        int  not null,
  role            text not null default 'tribute',  -- tribute | capitol | slums
  training_score  int,                              -- 1–12, set after training week
  points          int  not null default 0,          -- weekly leaderboard points
  credits         int  not null default 0,          -- spendable Capitol credits
  rsvp_status     text default 'pending',           -- pending | attending | declined
  is_finalist     boolean default false,            -- top 6 after week 5
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- --------------------------------------------------------------------
-- RSVPs — raw form submissions from /rsvp
-- --------------------------------------------------------------------
create table if not exists public.hg_rsvps (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  attending       text,                  -- 'yes' | 'no'
  companion_count int  default 0,
  companion_names text[],                -- array of names
  contact         text,
  created_at      timestamptz default now()
);

-- --------------------------------------------------------------------
-- Votes — opening bets (one per voter, predicting the arena winner)
-- --------------------------------------------------------------------
create table if not exists public.hg_votes (
  voter_slug      text primary key references public.hg_tributes(slug) on delete cascade,
  target_slug     text not null references public.hg_tributes(slug) on delete cascade,
  created_at      timestamptz default now()
);

-- --------------------------------------------------------------------
-- Capitol shop purchases — sponsor items + sabotage
-- --------------------------------------------------------------------
create table if not exists public.hg_purchases (
  id              uuid primary key default gen_random_uuid(),
  buyer_slug      text not null references public.hg_tributes(slug) on delete cascade,
  target_slug     text references public.hg_tributes(slug) on delete cascade,
  item_id         text not null,        -- references hg_items.id (defined later)
  cost            int  not null,
  effect          text,                 -- short description of what was applied
  created_at      timestamptz default now()
);

-- --------------------------------------------------------------------
-- Challenges — weekly competition definitions
-- --------------------------------------------------------------------
create table if not exists public.hg_challenges (
  id              text primary key,
  week            int not null,         -- 1..5
  name            text not null,
  description     text,
  created_at      timestamptz default now()
);

-- --------------------------------------------------------------------
-- Challenge results — points per tribute per challenge
-- --------------------------------------------------------------------
create table if not exists public.hg_challenge_results (
  id              uuid primary key default gen_random_uuid(),
  challenge_id    text references public.hg_challenges(id) on delete cascade,
  slug            text references public.hg_tributes(slug) on delete cascade,
  points          int  not null,
  rank            int,
  created_at      timestamptz default now(),
  unique (challenge_id, slug)
);

-- --------------------------------------------------------------------
-- Halloween-night meters — Capitol bets on finalists
-- One row per finalist; credits column is the running meter total
-- --------------------------------------------------------------------
create table if not exists public.hg_meters (
  slug            text primary key references public.hg_tributes(slug) on delete cascade,
  credits_filled  int not null default 0,
  updated_at      timestamptz default now()
);

-- --------------------------------------------------------------------
-- Capitol bets on Halloween night (per credit-spend on a finalist meter)
-- --------------------------------------------------------------------
create table if not exists public.hg_meter_bets (
  id              uuid primary key default gen_random_uuid(),
  bettor_slug     text not null references public.hg_tributes(slug) on delete cascade,
  finalist_slug   text not null references public.hg_tributes(slug) on delete cascade,
  credits         int  not null,
  created_at      timestamptz default now()
);

-- ====================================================================
-- Row Level Security — enable on every table
-- Anon (public) site uses the anon key; we use slug-in-URL as the
-- auth token for a 20-person friend event. Tighten later if needed.
-- ====================================================================
alter table public.hg_tributes         enable row level security;
alter table public.hg_rsvps            enable row level security;
alter table public.hg_votes            enable row level security;
alter table public.hg_purchases        enable row level security;
alter table public.hg_challenges       enable row level security;
alter table public.hg_challenge_results enable row level security;
alter table public.hg_meters           enable row level security;
alter table public.hg_meter_bets       enable row level security;

-- Read access — everyone can read everything (public leaderboard / event)
create policy "hg_tributes_read"            on public.hg_tributes         for select using (true);
create policy "hg_votes_read"               on public.hg_votes            for select using (true);
create policy "hg_purchases_read"           on public.hg_purchases        for select using (true);
create policy "hg_challenges_read"          on public.hg_challenges       for select using (true);
create policy "hg_challenge_results_read"   on public.hg_challenge_results for select using (true);
create policy "hg_meters_read"              on public.hg_meters           for select using (true);
create policy "hg_meter_bets_read"          on public.hg_meter_bets       for select using (true);

-- Inserts — anyone can RSVP, vote once, or buy/bet (anon-key writes)
create policy "hg_rsvps_insert"             on public.hg_rsvps            for insert with check (true);
create policy "hg_votes_insert"             on public.hg_votes            for insert with check (true);
create policy "hg_purchases_insert"         on public.hg_purchases        for insert with check (true);
create policy "hg_meter_bets_insert"        on public.hg_meter_bets       for insert with check (true);

-- Updates on hg_meters — anyone can bump a meter's credits_filled (we'll use
-- this as a dumb counter from the client; gamemaker dashboard can correct it)
create policy "hg_meters_update"            on public.hg_meters           for update using (true) with check (true);
create policy "hg_meters_insert"            on public.hg_meters           for insert with check (true);

-- Tribute updates require service role only (gamemaker dashboard).
-- No public update/insert policy means anon can only read.

-- ====================================================================
-- Seed: bring over the demo tributes from /data/tributes.json
-- ====================================================================
insert into public.hg_tributes (slug, name, district, role, points)
values
  ('lavar',  'LaVar Taylor',     12, 'tribute', 1250),
  ('rachel', 'Rachel',            1, 'tribute', 2100),
  ('demo',   'Marigold Vance',    7, 'tribute',  850)
on conflict (slug) do nothing;
