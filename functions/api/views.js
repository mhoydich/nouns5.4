// POST /api/views {p}  one cookieless page view.   GET /api/views?days=7[&path=/x/]  public totals.
import { BOT_RE, addView, allowedOrigin, cleanPath, readViews } from "../_lib/open-counts.js";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "X-Robots-Tag": "noindex" };

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const path = url.searchParams.has("path") ? cleanPath(url.searchParams.get("path")) : undefined;
  if (url.searchParams.has("path") && !path) return new Response(JSON.stringify({ error: "path must look like /services/" }), { status: 400, headers: JSON_HEADERS });
  if (!env.INDUSTRY_NEXT_MADE) return new Response(JSON.stringify({ status: "unavailable", note: "Counting store is not bound." }), { status: 200, headers: { ...JSON_HEADERS, "Cache-Control": "public, max-age=60" } });
  const now = Date.now();
  const body = await readViews(env.INDUSTRY_NEXT_MADE, { days: Number(url.searchParams.get("days") || "7"), path }, now);
  return new Response(JSON.stringify({
    schema: "industrynext-pageviews/1",
    site: "industrynext.xyz",
    updatedAt: new Date(now).toISOString(),
    timeZone: "America/Los_Angeles",
    note: "Page views counted on our own server, cookieless. Bots and Do Not Track or Global Privacy Control browsers are skipped, and busy moments can undercount.",
    ...body,
  }), { status: 200, headers: { ...JSON_HEADERS, "Cache-Control": "public, max-age=60" } });
}

export async function onRequestPost({ request, env }) {
  const done = new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  const ua = request.headers.get("user-agent") || "";
  if (!ua || BOT_RE.test(ua) || !allowedOrigin(request.headers.get("origin") || "") || !env.INDUSTRY_NEXT_MADE) return done;
  const text = await request.text();
  if (text.length > 512) return done;
  let body;
  try { body = JSON.parse(text); } catch { return done; }
  const path = cleanPath(body?.p);
  if (path) await addView(env.INDUSTRY_NEXT_MADE, path, Date.now());
  return done;
}
