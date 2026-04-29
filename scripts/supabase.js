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
    .order("points", { ascending: false });
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
  const payload = {
    name,
    attending,
    companion_count: parseInt(companion_count || 0, 10),
    companion_names: (companion_names || []).filter(Boolean),
    contact: contact || null,
    profile_photo: profile_photo || null
  };
  const { data, error } = await supabase
    .from("hg_rsvps")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
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
