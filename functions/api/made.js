import { getMadeById, listMade, saveMade } from "../_lib/made-store.js";

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function requireStore(env) {
  if (!env?.INDUSTRY_NEXT_MADE) throw new Error("The public Made stream is not configured.");
}

async function rateKey(request) {
  const hour = new Date().toISOString().slice(0, 13);
  const address = request.headers.get("CF-Connecting-IP") || "local";
  const bytes = new TextEncoder().encode(`${hour}:${address}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `made-rate:${hour}:${hash.slice(0, 24)}`;
}

async function enforceRateLimit(env, request) {
  const key = await rateKey(request);
  const count = Number.parseInt((await env.INDUSTRY_NEXT_MADE.get(key)) || "0", 10);
  if (count >= 6) throw new Error("Publishing is limited to six works per hour. Try again shortly.");
  await env.INDUSTRY_NEXT_MADE.put(key, String(count + 1), { expirationTtl: 60 * 60 * 2 });
}

function isCrossSite(request) {
  return request.headers.get("Sec-Fetch-Site") === "cross-site";
}

export async function onRequestGet(context) {
  try {
    requireStore(context.env);
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");
    if (id) {
      const entry = await getMadeById(context.env, id);
      return entry ? json({ entry }) : json({ error: "That work is no longer on the table." }, 404);
    }
    const entries = await listMade(
      context.env,
      url.searchParams.get("limit"),
      url.searchParams.get("edition") || "",
    );
    return json({ entries });
  } catch (error) {
    console.error(JSON.stringify({ event: "made.list.failed", message: error instanceof Error ? error.message : "unknown" }));
    return json({ error: "The Made stream is resting for a moment." }, 503);
  }
}

export async function onRequestPost(context) {
  try {
    requireStore(context.env);
    if (isCrossSite(context.request)) return json({ error: "Publish from Industry Next." }, 403);

    const contentLength = Number.parseInt(context.request.headers.get("Content-Length") || "0", 10);
    if (contentLength > 4_096) return json({ error: "That submission is too large." }, 413);

    await enforceRateLimit(context.env, context.request);
    const input = await context.request.json();
    const entry = await saveMade(context.env, input);
    console.log(JSON.stringify({ event: "made.published", id: entry.id, mode: entry.mode }));
    return json({ entry }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish this work.";
    const status = message.includes("six works") ? 429 : 400;
    console.warn(JSON.stringify({ event: "made.publish.rejected", message }));
    return json({ error: message }, status);
  }
}
