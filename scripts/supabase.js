// Supabase client for the 75th Hunger Games event site.
// Project: bdenaszyupuelismxyer (Personal Supabase, separate from CCG)
// All tables live under the public.hg_* prefix.
//
// The anon key is intentionally public — this is a static site with
// slug-in-URL acting as the auth token for a 20-person friend event.
// Row Level Security policies enforce that only safe operations are
// allowed via this key.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://bdenaszyupuelismxyer.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkZW5hc3p5dXB1ZWxpc214eWVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNzgzMzUsImV4cCI6MjA3NTc1NDMzNX0.nXVrJ54HsRGDfc_zMhKQNs0lRy18FMu3Pg2aBn3Ma3M";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

// --- Tributes -------------------------------------------------------

export async function fetchTributes() {
  const { data, error } = await supabase
    .from("hg_tributes")
    .select("*")
    .order("credits", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchTribute(slug) {
  const { data, error } = await supabase
    .from("hg_tributes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// --- RSVPs ----------------------------------------------------------

export async function submitRsvp({ name, attending, companion_count, companion_names, contact, profile_photo }) {
  const base = {
    name,
    attending,
    companion_count: parseInt(companion_count || 0, 10),
    companion_names: (companion_names || []).filter(Boolean),
    contact: contact || null
  };
  const payloadWithPhoto = profile_photo ? { ...base, profile_photo } : base;

  let { data, error } = await supabase
    .from("hg_rsvps")
    .insert(payloadWithPhoto)
    .select()
    .single();

  // If the migration adding profile_photo hasn't been run, retry without it
  // so the RSVP still goes through. The photo just gets dropped silently.
  if (error && /profile_photo/i.test(error.message || "")) {
    console.warn("[submitRsvp] profile_photo column missing — retrying without photo");
    ({ data, error } = await supabase
      .from("hg_rsvps")
      .insert(base)
      .select()
      .single());
  }

  if (error) {
    console.error("[submitRsvp] payload:", payloadWithPhoto, "error:", error);
    throw error;
  }
  return data;
}

// --- Votes (opening bet) -------------------------------------------

export async function submitVote(voter_slug, target_slug) {
  const { data, error } = await supabase
    .from("hg_votes")
    .upsert({ voter_slug, target_slug }, { onConflict: "voter_slug" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchVote(voter_slug) {
  const { data, error } = await supabase
    .from("hg_votes")
    .select("*")
    .eq("voter_slug", voter_slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchVoteTally() {
  const { data, error } = await supabase
    .from("hg_votes")
    .select("target_slug");
  if (error) throw error;
  const tally = {};
  (data || []).forEach(v => { tally[v.target_slug] = (tally[v.target_slug] || 0) + 1; });
  return tally;
}

// --- Shop / purchases ----------------------------------------------

export async function recordPurchase({ buyer_slug, target_slug, item_id, cost, effect }) {
  const { data, error } = await supabase
    .from("hg_purchases")
    .insert({ buyer_slug, target_slug, item_id, cost, effect: effect || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Admin / Gamemaker Console ------------------------------------

export async function fetchRsvps() {
  const { data, error } = await supabase
    .from("hg_rsvps")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function markRsvpPromoted(id) {
  const { error } = await supabase
    .from("hg_rsvps")
    .update({ promoted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function createTribute(payload) {
  const { data, error } = await supabase
    .from("hg_tributes")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTribute(slug, patch) {
  const { data, error } = await supabase
    .from("hg_tributes")
    .update(patch)
    .eq("slug", slug)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchRecentVotes(limit = 20) {
  const { data, error } = await supabase
    .from("hg_votes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function fetchRecentPurchases(limit = 20) {
  const { data, error } = await supabase
    .from("hg_purchases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// --- Caption (W3) helpers -----------------------------------------

export async function fetchActiveCaptionRound() {
  const { data, error } = await supabase
    .from("hg_caption_rounds")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllCaptionRounds() {
  const { data, error } = await supabase
    .from("hg_caption_rounds")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function submitCaption({ round_id, tribute_slug, text }) {
  const { data, error } = await supabase
    .from("hg_captions")
    .upsert({ round_id, tribute_slug, text }, { onConflict: "round_id,tribute_slug" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCaption(round_id, tribute_slug) {
  const { data, error } = await supabase
    .from("hg_captions")
    .select("*")
    .eq("round_id", round_id)
    .eq("tribute_slug", tribute_slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchCaptionsForRound(round_id) {
  const { data, error } = await supabase
    .from("hg_captions")
    .select("*")
    .eq("round_id", round_id);
  if (error) throw error;
  return data || [];
}

export async function createCaptionRound({ photo_url, prompt, closes_at }) {
  const { data, error } = await supabase
    .from("hg_caption_rounds")
    .insert({ photo_url, prompt: prompt || null, closes_at: closes_at || null, opens_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCaptionRound(id) {
  const { error } = await supabase.from("hg_caption_rounds").delete().eq("id", id);
  if (error) throw error;
}

// --- Weapon mini-game (W1) helpers --------------------------------

export async function chooseWeapon(slug, weapon) {
  const { data, error } = await supabase
    .from("hg_weapon_choices")
    .upsert({ slug, weapon }, { onConflict: "slug" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchWeaponChoice(slug) {
  const { data, error } = await supabase
    .from("hg_weapon_choices")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function submitWeaponScore({ slug, weapon, score, week }) {
  const { data, error } = await supabase
    .from("hg_weapon_scores")
    .insert({ slug, weapon, score, week })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchBestWeaponScore(slug, week) {
  const { data, error } = await supabase
    .from("hg_weapon_scores")
    .select("*")
    .eq("slug", slug)
    .eq("week", week)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// --- Caption voting (W3 stage 2) ----------------------------------

export async function voteCaption(caption_id, voter_slug) {
  const { data, error } = await supabase
    .from("hg_caption_votes")
    .insert({ caption_id, voter_slug })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCaptionVoteFromVoter(round_id, voter_slug) {
  // Get all captions for the round so we know which ids the user could've voted on,
  // then find any vote they cast against those captions.
  const { data: captions } = await supabase
    .from("hg_captions")
    .select("id")
    .eq("round_id", round_id);
  const captionIds = (captions || []).map(c => c.id);
  if (!captionIds.length) return null;
  const { data, error } = await supabase
    .from("hg_caption_votes")
    .select("*")
    .eq("voter_slug", voter_slug)
    .in("caption_id", captionIds)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// --- Auction (W4) -------------------------------------------------

export async function fetchActiveAuctionLots() {
  const { data, error } = await supabase
    .from("hg_auction_lots")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function submitAuctionBid({ lot_id, bidder_slug, amount }) {
  const { data, error } = await supabase
    .from("hg_auction_bids")
    .upsert({ lot_id, bidder_slug, amount }, { onConflict: "lot_id,bidder_slug" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchMyBids(bidder_slug) {
  const { data, error } = await supabase
    .from("hg_auction_bids")
    .select("*")
    .eq("bidder_slug", bidder_slug);
  if (error) throw error;
  return data || [];
}

// --- Threat ballots (W5) ------------------------------------------

export async function submitThreatBallot({ voter_slug, named_slugs, week = 5 }) {
  const { data, error } = await supabase
    .from("hg_threat_ballots")
    .upsert({ voter_slug, named_slugs, week }, { onConflict: "voter_slug,week" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchThreatBallot(voter_slug, week = 5) {
  const { data, error } = await supabase
    .from("hg_threat_ballots")
    .select("*")
    .eq("voter_slug", voter_slug)
    .eq("week", week)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// --- Halloween Loadout Shop ---------------------------------------

export async function fetchLoadoutItems() {
  const { data, error } = await supabase
    .from("hg_loadout_items")
    .select("*")
    .order("cost", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchLoadoutForTribute(tribute_slug) {
  const { data, error } = await supabase
    .from("hg_loadout_purchases")
    .select("*")
    .eq("tribute_slug", tribute_slug)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchAllLoadouts() {
  const { data, error } = await supabase
    .from("hg_loadout_purchases")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// Atomic-ish purchase: writes the purchase log + decrements credits.
// Race-safe enough for a 4-finalist window (no concurrent buyers on the same slug).
export async function buyLoadoutItem({ tribute_slug, item_id }) {
  // 1. Look up item + tribute fresh
  const [{ data: item, error: itemErr }, { data: tribute, error: trErr }] = await Promise.all([
    supabase.from("hg_loadout_items").select("*").eq("id", item_id).maybeSingle(),
    supabase.from("hg_tributes").select("slug,credits").eq("slug", tribute_slug).maybeSingle()
  ]);
  if (itemErr) throw itemErr;
  if (trErr)   throw trErr;
  if (!item)    throw new Error("Item not found");
  if (!tribute) throw new Error("Tribute not found");

  // 2. Affordability check
  const balance = tribute.credits ?? 0;
  if (balance < item.cost) throw new Error(`Insufficient credits (need ${item.cost}, have ${balance})`);

  // 3. Per-tribute cap check
  if (item.max_per_tribute != null) {
    const { count, error: countErr } = await supabase
      .from("hg_loadout_purchases")
      .select("id", { count: "exact", head: true })
      .eq("tribute_slug", tribute_slug)
      .eq("item_id", item_id);
    if (countErr) throw countErr;
    if ((count ?? 0) >= item.max_per_tribute) {
      throw new Error(`Max ${item.max_per_tribute} of ${item.name} reached`);
    }
  }

  // 4. Insert the purchase record
  const { data: purchase, error: insErr } = await supabase
    .from("hg_loadout_purchases")
    .insert({ tribute_slug, item_id, cost_at_purchase: item.cost })
    .select()
    .single();
  if (insErr) throw insErr;

  // 5. Decrement credits
  const newBalance = balance - item.cost;
  const { error: updErr } = await supabase
    .from("hg_tributes")
    .update({ credits: newBalance })
    .eq("slug", tribute_slug);
  if (updErr) throw updErr;

  return { purchase, newBalance };
}

// --- Halloween Meter (Final 6 → Top 4) ---------------------------

// Hardcoded cutoff: 9:30 PM Mountain Daylight on Halloween 2026.
// Capitol donations close at this moment; top 4 by credits advance to /loadout.
export const HALLOWEEN_CUTOFF = new Date("2026-10-31T21:30:00-06:00");

export async function fetchFinalists() {
  const { data, error } = await supabase
    .from("hg_tributes")
    .select("*")
    .eq("is_finalist", true)
    .order("credits", { ascending: false });
  if (error) throw error;
  return data || [];
}

// Capitol/Slums donates credits to a finalist. Atomic-ish: decrements bettor,
// increments finalist, logs the bet. Slug-as-URL auth model.
export async function donateToFinalist({ bettor_slug, finalist_slug, amount }) {
  if (amount <= 0) throw new Error("Amount must be positive");
  if (bettor_slug === finalist_slug) throw new Error("Cannot donate to yourself");

  // 1. Look up bettor + finalist fresh
  const [{ data: bettor }, { data: finalist }] = await Promise.all([
    supabase.from("hg_tributes").select("slug,credits,is_finalist").eq("slug", bettor_slug).maybeSingle(),
    supabase.from("hg_tributes").select("slug,credits,is_finalist").eq("slug", finalist_slug).maybeSingle()
  ]);
  if (!bettor)   throw new Error("Bettor not found");
  if (!finalist) throw new Error("Finalist not found");
  if (!finalist.is_finalist) throw new Error("Target is not a finalist");

  // 2. Affordability check
  const bettorBal = bettor.credits ?? 0;
  if (bettorBal < amount) throw new Error(`Insufficient credits (need ${amount}, have ${bettorBal})`);

  // 3. Decrement bettor
  const { error: bErr } = await supabase
    .from("hg_tributes")
    .update({ credits: bettorBal - amount })
    .eq("slug", bettor_slug);
  if (bErr) throw bErr;

  // 4. Increment finalist
  const finalistBal = finalist.credits ?? 0;
  const { error: fErr } = await supabase
    .from("hg_tributes")
    .update({ credits: finalistBal + amount })
    .eq("slug", finalist_slug);
  if (fErr) throw fErr;

  // 5. Log the bet for Top Capitol Bettor tally later
  const { error: lErr } = await supabase
    .from("hg_meter_bets")
    .insert({ bettor_slug, finalist_slug, credits: amount });
  if (lErr) throw lErr;

  return { newBettorBalance: bettorBal - amount, newFinalistBalance: finalistBal + amount };
}

// Event state flags (loadout_open / loadout_locked / credit_frozen, etc.)
export async function fetchEventStateFlag(key) {
  const { data, error } = await supabase
    .from("hg_event_state")
    .select("*")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function setEventStateFlag(key, value) {
  const { error } = await supabase
    .from("hg_event_state")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}

// --- Current week (used by /challenge dispatcher) -----------------

// Hard-coded for now; can be moved into a config table later.
// Week ranges are inclusive; check is by today's date against the schedule.
export function getCurrentWeek() {
  // Halloween 2026 schedule (every week opens Sunday)
  const SCHEDULE = [
    { week: 1, opens: "2026-09-28", closes: "2026-10-04" },
    { week: 2, opens: "2026-10-05", closes: "2026-10-11" },
    { week: 3, opens: "2026-10-12", closes: "2026-10-18" },
    { week: 4, opens: "2026-10-19", closes: "2026-10-25" },
    { week: 5, opens: "2026-10-26", closes: "2026-10-30" }
  ];
  const today = new Date().toISOString().slice(0, 10);
  for (const s of SCHEDULE) {
    if (today >= s.opens && today <= s.closes) return s.week;
  }
  // Outside any week — return the next upcoming week, or 5 if past
  const upcoming = SCHEDULE.find(s => s.opens > today);
  return upcoming ? upcoming.week : 5;
}
