// Tribute data loader.
// Reads slug from URL: /t/?slug=xxx (dev) or /t/{slug}/ (prod, with rewrite)

export async function loadTributes() {
  const candidates = ["../data/tributes.json", "/data/tributes.json", "data/tributes.json"];
  let data = null;
  for (const path of candidates) {
    try {
      const res = await fetch(path);
      if (res.ok) { data = await res.json(); break; }
    } catch (_) {}
  }
  if (!data) throw new Error("Could not load tributes.json");
  return data;
}

export function getSlug() {
  // Try ?slug=xxx first
  const params = new URLSearchParams(location.search);
  const fromQuery = params.get("slug");
  if (fromQuery) return fromQuery.trim().toLowerCase();

  // Fallback: parse /t/{slug}/
  const m = location.pathname.match(/\/t\/([^\/]+)\/?/);
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
