import { AgentRequestError, publicRequestReceipt, requireRequestStore, saveAgentRequest } from "../_lib/agent-request-store.js";

const MAX_BODY_BYTES = 16_384;
const HOURLY_LIMIT = 5;
const PUBLIC_ORIGINS = new Set(["https://industrynext.xyz", "https://www.industrynext.xyz"]);

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

function allowedOrigin(request) {
  if (request.headers.get("Sec-Fetch-Site") === "cross-site") return false;
  const origin = request.headers.get("Origin");
  return origin === null || origin === new URL(request.url).origin || PUBLIC_ORIGINS.has(origin);
}

async function readJson(request) {
  const declared = request.headers.get("Content-Length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) {
    throw new AgentRequestError("The request is too large or has an invalid length.", 413);
  }
  if (!request.body) throw new AgentRequestError("The request body is missing.");
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new AgentRequestError("The request is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new AgentRequestError("The request could not be read. Check the details and try again.");
  }
}

async function rateLimit(store, request) {
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) return; // Local development has no trustworthy Cloudflare address header.
  const hour = new Date().toISOString().slice(0, 13);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`agent-request:${hour}:${ip}`));
  const hash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const key = `agent-request-rate:${hour}:${hash}`;
  const value = await store.get(key);
  const count = value === null ? 0 : Number(value);
  if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid rate counter");
  if (count >= HOURLY_LIMIT) throw new AgentRequestError("This connection has reached the hourly request limit. Try again later.", 429);
  // Best-effort abuse reduction only: KV read/modify/write is not atomic across regions.
  // Neither raw IPs nor request fields are stored in these short-lived counters.
  await store.put(key, String(count + 1), { expirationTtl: 7_200 });
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return json({ error: "This request desk accepts submissions only. Saved requests are private." }, 405, { Allow: "POST" });
  }
  try {
    if (!allowedOrigin(context.request)) throw new AgentRequestError("Submit your request from Industry Next.", 403);
    if (context.request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
      throw new AgentRequestError("Send the request as JSON.", 415);
    }
    const store = requireRequestStore(context.env);
    const input = await readJson(context.request);
    const { record, created } = await saveAgentRequest(context.env, input, {
      beforeCreate: () => rateLimit(store, context.request),
    });
    // Saving a request is not email delivery or an acknowledgment from the owner.
    console.log(JSON.stringify({ event: "agent.request.saved", status: created ? 201 : 200 }));
    return json({
      received: true,
      receipt: publicRequestReceipt(record),
      notification: { owner: "unavailable", customer: "unavailable" },
    }, created ? 201 : 200);
  } catch (error) {
    const status = error instanceof AgentRequestError ? error.status : 503;
    const message = error instanceof AgentRequestError
      ? error.message
      : "The request could not be confirmed. Retry with the same request ID; no email acknowledgment was sent.";
    // Never log submitted content, email addresses, raw IPs, or provider error text.
    console.warn(JSON.stringify({ event: "agent.request.rejected", status }));
    return json({ received: false, error: message }, status, status === 429 ? { "Retry-After": "3600" } : {});
  }
}
