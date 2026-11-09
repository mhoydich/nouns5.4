// Open, cookieless counts for industrynext.xyz: page views by day and "here now" (last 5 minutes).
// Stored in the existing KV namespace under the "counts:" prefix.
// Page views: one JSON document per Los Angeles day with views per path. No IP, cookie, user agent or location.
// Here now: a hash of a random per-tab id (salted per day), the path and a time, dropped after 5 minutes.
// KV is eventually consistent and last-write-wins, so busy moments can undercount. The pages say so.

export const WINDOW_MS = 5 * 60 * 1000;
export const KEY_CAP = 300;
export const ENTRY_CAP = 500;
const PATH_RE = /^\/[A-Za-z0-9/_\-.~]{0,120}$/;
const ID_RE = /^[a-f0-9]{16,64}$/;
export const BOT_RE = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|embedly|whatsapp|telegram|discord|skype|python|curl|wget|httpclient|go-http|okhttp|axios|node-fetch|undici/i;
export const HOSTS = ["industrynext.xyz", "www.industrynext.xyz"];

export function laDay(now) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function cleanPath(value) {
  if (typeof value !== "string") return undefined;
  let path = value.trim();
  if (path.endsWith("/index.html")) path = path.slice(0, -"index.html".length);
  return PATH_RE.test(path) && !path.includes("..") ? path : undefined;
}

export function allowedOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && (HOSTS.includes(url.hostname) || url.hostname.endsWith(".industrynext-nouns.pages.dev"));
  } catch { return false; }
}

async function getJson(kv, key) {
  try { return (await kv.get(key, "json")) ?? null; } catch { return null; }
}

export async function addView(kv, path, now) {
  const day = laDay(now);
  const key = `counts:views:${day}`;
  const doc = (await getJson(kv, key)) || { day, total: 0, pages: {} };
  doc.total += 1;
  if (Object.hasOwn(doc.pages, path) || Object.keys(doc.pages).length < KEY_CAP) doc.pages[path] = (doc.pages[path] || 0) + 1;
  else doc.pages["(other)"] = (doc.pages["(other)"] || 0) + 1;
  await kv.put(key, JSON.stringify(doc), { expirationTtl: 60 * 60 * 24 * 400 });
  return doc.total;
}

function daysBack(count, now) {
  const out = [];
  let cursor = now;
  while (out.length < count) {
    const day = laDay(cursor);
    out.push(day);
    cursor -= 20 * 3600000;
    while (laDay(cursor) === day) cursor -= 3600000;
  }
  return out;
}

export async function readViews(kv, { days = 7, path } = {}, now) {
  const count = Number.isFinite(days) && days > 0 ? Math.min(31, Math.floor(days)) : 7;
  const rows = [];
  const pages = {};
  let total = 0;
  for (const day of daysBack(count, now)) {
    const doc = (await getJson(kv, `counts:views:${day}`)) || { total: 0, pages: {} };
    if (path) { const n = doc.pages?.[path] || 0; rows.push({ day, views: n }); total += n; }
    else {
      rows.push({ day, total: doc.total || 0 });
      total += doc.total || 0;
      for (const [p, n] of Object.entries(doc.pages || {})) pages[p] = (pages[p] || 0) + n;
    }
  }
  const top = Object.fromEntries(Object.entries(pages).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 50));
  return path ? { path, views: total, days: rows } : { total, pages: top, days: rows };
}

export async function hashId(salt, id) {
  const bytes = new TextEncoder().encode(`${salt}\n${id}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function saltFor(kv, day) {
  const key = `counts:salt:${day}`;
  const have = await getJson(kv, key);
  if (typeof have === "string" && have.length >= 32) return have;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const salt = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  await kv.put(key, JSON.stringify(salt), { expirationTtl: 60 * 60 * 48 });
  return salt;
}

export function prune(entries, now) {
  const kept = Object.entries(entries || {}).filter(([, e]) => e && Number.isFinite(e.t) && now - e.t < WINDOW_MS && now - e.t > -60000);
  kept.sort((a, b) => b[1].t - a[1].t);
  return Object.fromEntries(kept.slice(0, ENTRY_CAP));
}

export function summarize(entries, now) {
  const live = prune(entries, now);
  let humans = 0, agents = 0;
  const pages = {};
  for (const e of Object.values(live)) {
    if (e.k === "agent") agents += 1; else humans += 1;
    if (e.p) pages[e.p] = (pages[e.p] || 0) + 1;
  }
  return { humans, agents, total: humans + agents, pages };
}

export async function markPresent(kv, { id, path, kind }, now) {
  if (typeof id !== "string" || !ID_RE.test(id)) return false;
  const salt = await saltFor(kv, laDay(now));
  const key = await hashId(salt, id);
  const doc = (await getJson(kv, "counts:present")) || { entries: {} };
  const entries = prune(doc.entries, now);
  entries[key] = { t: now, p: path, k: kind };
  await kv.put("counts:present", JSON.stringify({ entries: prune(entries, now) }), { expirationTtl: 60 * 60 * 24 });
  return true;
}

export async function readPresent(kv, now) {
  const doc = (await getJson(kv, "counts:present")) || { entries: {} };
  return summarize(doc.entries, now);
}
