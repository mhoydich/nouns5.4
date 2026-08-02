import { publicApplicationReceipt, saveMarketApplication } from "../_lib/market-application-store.js";

const MAX_BODY_BYTES = 16_384;

function json(data, status = 200, extraHeaders = {}) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function requireStore(env) {
  if (!env?.INDUSTRY_NEXT_MADE) throw new Error("The private application desk is not configured.");
}

function isAllowedOrigin(request) {
  if (request.headers.get("Sec-Fetch-Site") === "cross-site") return false;
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  const requestOrigin = new URL(request.url).origin;
  return origin === requestOrigin || origin === "https://www.industrynext.xyz";
}

async function readJsonWithinLimit(request) {
  const declaredLength = Number.parseInt(request.headers.get("Content-Length") || "0", 10);
  if (declaredLength > MAX_BODY_BYTES) throw new Error("That application is too large.");
  if (!request.body) return {};

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("That application is too large.");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Error("The application could not be read. Refresh and try again.");
  }
}

async function rateKey(request) {
  const hour = new Date().toISOString().slice(0, 13);
  const address = request.headers.get("CF-Connecting-IP") || "local";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${hour}:market:${address}`));
  const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `market-application-rate:${hour}:${hash.slice(0, 24)}`;
}

async function enforceRateLimit(env, request) {
  const key = await rateKey(request);
  const count = Number.parseInt((await env.INDUSTRY_NEXT_MADE.get(key)) || "0", 10);
  if (count >= 5) throw new Error("This connection has reached the hourly application limit. Try again later.");
  await env.INDUSTRY_NEXT_MADE.put(key, String(count + 1), { expirationTtl: 60 * 60 * 2 });
}

export async function onRequestGet() {
  return json({ error: "The application inbox is private." }, 405, { Allow: "POST" });
}

export async function onRequestPost(context) {
  try {
    requireStore(context.env);
    if (!isAllowedOrigin(context.request)) return json({ error: "Apply from Industry Next." }, 403);
    if (!context.request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
      return json({ error: "Send this application as JSON." }, 415);
    }

    const input = await readJsonWithinLimit(context.request);
    if (typeof input?.companyWebsite === "string" && input.companyWebsite.trim()) {
      return json({ received: true }, 202);
    }

    await enforceRateLimit(context.env, context.request);
    const application = await saveMarketApplication(context.env, input);
    console.log(JSON.stringify({
      event: "market.application.received",
      id: application.id,
      type: application.type,
      roleId: application.roleId || null,
    }));
    return json({ received: true, application: publicApplicationReceipt(application) }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The application could not be received.";
    const status = message.includes("hourly application limit") ? 429 : message.includes("too large") ? 413 : message.includes("not configured") ? 503 : 400;
    console.warn(JSON.stringify({ event: "market.application.rejected", reason: status }));
    return json({ error: message }, status);
  }
}
