// Supabase client for the 75th Hunger Games event site.
// Project: bdenaszyupuelismxyer (LaVar's personal Supabase, separate from CCG)
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
