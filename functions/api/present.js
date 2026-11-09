// POST /api/present {p, id}  a tab (or an agent, server-side, with kind "agent") checks in.
// GET  /api/present          how many checked in during the last 5 minutes. Same shape as elsegundo.xyz/api/v1/present.
import { BOT_RE, allowedOrigin, cleanPath, markPresent, readPresent } from "../_lib/open-counts.js";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "X-Robots-Tag": "noindex" };

export async function onRequestGet({ env }) {
  if (!env.INDUSTRY_NEXT_MADE) return new Response(JSON.stringify({ status: "unavailable" }), { status: 200, headers: { ...JSON_HEADERS, "Cache-Control": "public, max-age=15" } });
  const now = Date.now();
  const sum = await readPresent(env.INDUSTRY_NEXT_MADE, now);
  return new Response(JSON.stringify({
    schema: "industrynext-present/1",
    site: "industrynext.xyz",
    updatedAt: new Date(now).toISOString(),
    windowMinutes: 5,
    definition: "Browser tabs and agents that checked in from a page of industrynext.xyz in the last 5 minutes. Anonymous; undercounts.",
    ...sum,
  }), { status: 200, headers: { ...JSON_HEADERS, "Cache-Control": "public, max-age=15" } });
}

export async function onRequestPost({ request, env }) {
  const done = new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  if (!env.INDUSTRY_NEXT_MADE) return done;
  const ua = request.headers.get("user-agent") || "";
  const origin = request.headers.get("origin");
  const text = await request.text();
  if (!ua || text.length > 512) return done;
  let body;
  try { body = JSON.parse(text); } catch { return done; }
  let kind;
  if (origin) { if (!allowedOrigin(origin) || BOT_RE.test(ua)) return done; kind = "person"; }
  else { if (body?.kind !== "agent") return done; kind = "agent"; }
  const path = kind === "agent" && body.p === undefined ? "/" : cleanPath(body?.p);
  if (path) await markPresent(env.INDUSTRY_NEXT_MADE, { id: body.id, path, kind }, Date.now());
  return done;
}
