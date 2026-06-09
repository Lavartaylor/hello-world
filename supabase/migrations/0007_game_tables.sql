-- ====================================================================
-- Game state tables for the 5 weekly challenges:
--   W1 The Cornucopia  (weapon mini-games)
--   W2 The Telephone   (drawing chain)
--   W3 The Caption     (comedy voting)
--   W4 The Auction     (sealed-bid lots)
--   W5 Name the Threats + Final Bracket
-- All hg_* prefixed, RLS on, slug-as-URL auth model.
-- ====================================================================

-- --------------------------------------------------------------------
-- W1: Weapon choice (locked per tribute) + scores
-- --------------------------------------------------------------------
create table if not exists public.hg_weapon_choices (
  slug        text primary key references public.hg_tributes(slug) on delete cascade,
  weapon      text not null,
  chosen_at   timestamptz default now()
);

create table if not exists public.hg_weapon_scores (
  id          uuid primary key default gen_random_uuid(),
  slug        text references public.hg_tributes(slug) on delete cascade,
  weapon      text not null,
  score       int  not null,
  week        int  not null,
  played_at   timestamptz default now()
);

-- --------------------------------------------------------------------
-- W2: Telephone — drawing/guess chains
-- --------------------------------------------------------------------
create table if not exists public.hg_telephone_chains (
  id          uuid primary key default gen_random_uuid(),
  week        int  not null default 2,
  starter_slug text references public.hg_tributes(slug),
  start_word  text not null,
  created_at  timestamptz default now()
);

create table if not exists public.hg_telephone_hops (
  id          uuid primary key default gen_random_uuid(),
  chain_id    uuid references public.hg_telephone_chains(id) on delete cascade,
  position    int  not null,           -- 1..5
  tribute_slug text references public.hg_tributes(slug),
  hop_type    text not null,           -- 'draw' | 'guess'
  content     text not null,           -- data URL (draw) or text (guess)
  created_at  timestamptz default now(),
  unique (chain_id, position)
);

-- --------------------------------------------------------------------
-- W3: Caption — round, captions, votes
-- --------------------------------------------------------------------
create table if not exists public.hg_caption_rounds (
  id          uuid primary key default gen_random_uuid(),
  week        int  not null default 3,
  photo_url   text not null,
  prompt      text,
  opens_at    timestamptz,
  closes_at   timestamptz,
  created_at  timestamptz default now()
);

create table if not exists public.hg_captions (
  id          uuid primary key default gen_random_uuid(),
  round_id    uuid references public.hg_caption_rounds(id) on delete cascade,
  tribute_slug text references public.hg_tributes(slug) on delete cascade,
  text        text not null,
  created_at  timestamptz default now(),
  unique (round_id, tribute_slug)
);

create table if not exists public.hg_caption_votes (
  id          uuid primary key default gen_random_uuid(),
  caption_id  uuid references public.hg_captions(id) on delete cascade,
  voter_slug  text references public.hg_tributes(slug) on delete cascade,
  created_at  timestamptz default now(),
  unique (caption_id, voter_slug)
);

-- --------------------------------------------------------------------
-- W4: Auction — sealed-bid lots with hidden rewards
-- --------------------------------------------------------------------
create table if not exists public.hg_auction_lots (
  id            uuid primary key default gen_random_uuid(),
  week          int  not null default 4,
  name          text not null,
  hidden_reward text not null,             -- description revealed after close
  reward_value  int  default 0,
  reward_type   text default 'credits',    -- credits | multiplier | immunity | sabotage
  capitol_boost int  default 0,            -- credits Capitol added to inflate prize
  capitol_spike int  default 0,            -- credits Capitol added to sabotage
  closes_at     timestamptz,
  created_at    timestamptz default now()
);

create table if not exists public.hg_auction_bids (
  id          uuid primary key default gen_random_uuid(),
  lot_id      uuid references public.hg_auction_lots(id) on delete cascade,
  bidder_slug text references public.hg_tributes(slug) on delete cascade,
  amount      int  not null,
  created_at  timestamptz default now(),
  unique (lot_id, bidder_slug)
);

-- --------------------------------------------------------------------
-- W5: Threat ballots (each tribute names top 3 threats)
-- --------------------------------------------------------------------
create table if not exists public.hg_threat_ballots (
  id            uuid primary key default gen_random_uuid(),
  voter_slug    text references public.hg_tributes(slug) on delete cascade,
  week          int  not null default 5,
  named_slugs   text[] not null,
  created_at    timestamptz default now(),
  unique (voter_slug, week)
);

-- ====================================================================
-- RLS
-- ====================================================================
alter table public.hg_weapon_choices    enable row level security;
alter table public.hg_weapon_scores     enable row level security;
alter table public.hg_telephone_chains  enable row level security;
alter table public.hg_telephone_hops    enable row level security;
alter table public.hg_caption_rounds    enable row level security;
alter table public.hg_captions          enable row level security;
alter table public.hg_caption_votes     enable row level security;
alter table public.hg_auction_lots      enable row level security;
alter table public.hg_auction_bids      enable row level security;
alter table public.hg_threat_ballots    enable row level security;

-- Read access for everyone
create policy "hg_weapon_choices_read"    on public.hg_weapon_choices    for select using (true);
create policy "hg_weapon_scores_read"     on public.hg_weapon_scores     for select using (true);
create policy "hg_telephone_chains_read"  on public.hg_telephone_chains  for select using (true);
create policy "hg_telephone_hops_read"    on public.hg_telephone_hops    for select using (true);
create policy "hg_caption_rounds_read"    on public.hg_caption_rounds    for select using (true);
create policy "hg_captions_read"          on public.hg_captions          for select using (true);
create policy "hg_caption_votes_read"     on public.hg_caption_votes     for select using (true);
create policy "hg_auction_lots_read"      on public.hg_auction_lots      for select using (true);
create policy "hg_auction_bids_read"      on public.hg_auction_bids      for select using (true);
create policy "hg_threat_ballots_read"    on public.hg_threat_ballots    for select using (true);

-- Insert (and weapon update) — slug acts as auth via URL
create policy "hg_weapon_choices_insert"  on public.hg_weapon_choices    for insert with check (true);
create policy "hg_weapon_choices_update"  on public.hg_weapon_choices    for update using (true) with check (true);
create policy "hg_weapon_scores_insert"   on public.hg_weapon_scores     for insert with check (true);
create policy "hg_telephone_chains_insert" on public.hg_telephone_chains for insert with check (true);
create policy "hg_telephone_hops_insert"  on public.hg_telephone_hops    for insert with check (true);
create policy "hg_captions_insert"        on public.hg_captions          for insert with check (true);
create policy "hg_caption_votes_insert"   on public.hg_caption_votes     for insert with check (true);
create policy "hg_auction_bids_insert"    on public.hg_auction_bids      for insert with check (true);
create policy "hg_threat_ballots_insert"  on public.hg_threat_ballots    for insert with check (true);
