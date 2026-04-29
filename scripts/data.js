// Tribute data loader — reads from Supabase (hg_tributes), with a static
// districts map. Slug parsing handles both /t/{slug} and /tv/{slug}.

import { fetchTributes } from "/scripts/supabase.js";

// District names are static — mapping by number
const DISTRICTS = {
  "1":  "Luxury",
  "2":  "Masonry",
  "3":  "Technology",
  "4":  "Fishing",
  "5":  "Power",
  "6":  "Transportation",
  "7":  "Lumber",
  "8":  "Textiles",
  "9":  "Grain",
  "10": "Livestock",
  "11": "Agriculture",
  "12": "Mining"
};

export async function loadTributes() {
  const tributes = await fetchTributes();
  return {
    districts: DISTRICTS,
    tributes: tributes.map(t => ({
      slug: t.slug,
      name: t.name,
      district: t.district,
      role: t.role,
      trainingScore: t.training_score,
      points: t.points ?? 0,
      credits: t.credits ?? 0,
      rsvpStatus: t.rsvp_status,
      isFinalist: t.is_finalist
    }))
  };
}

export function getSlug() {
  // ?slug=xxx wins (dev convenience)
  const params = new URLSearchParams(location.search);
  const fromQuery = params.get("slug");
  if (fromQuery) return fromQuery.trim().toLowerCase();

  // Fallback: parse /t/{slug}/, /tv/{slug}/, /vote/{slug}/, /shop/{slug}/
  const m = location.pathname.match(/\/(?:t|tv|vote|shop)\/([^\/]+)\/?/);
  if (m) return m[1].trim().toLowerCase();

  return null;
}

export function findTribute(data, slug) {
  if (!slug) return null;
  return data.tributes.find(t => t.slug.toLowerCase() === slug) || null;
}

export function districtName(data, num) {
  return data.districts[String(num)] || "";
}
