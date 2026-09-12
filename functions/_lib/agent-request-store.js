export const AGENT_REQUEST_PREFIX = "agent-request:";
export const RETENTION_SECONDS = 60 * 60 * 24 * 90;
export const AGENT_REQUEST_STATUSES = new Set(["new", "reviewing", "contacted", "closed"]);
const OFFERS = new Set(["working-session", "build-day", "pilot-discussion"]);
const FIELDS = new Set(["requestId", "name", "email", "task", "tools", "success", "offer", "privacyConsent", "companyWebsite"]);
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AgentRequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "AgentRequestError";
    this.status = status;
  }
}

export function exactRequestId(value) {
  if (typeof value !== "string" || !UUID_V4.test(value)) {
    throw new AgentRequestError("Use a complete version-4 request ID.");
  }
  return value.toLowerCase();
}

function plainText(value, field, minimum, maximum, multiline = false) {
  // Reject oversized input before normalization; never silently truncate a request.
  if (typeof value !== "string" || value.length > maximum) {
    throw new AgentRequestError(`${field} must be text of at most ${maximum} characters.`);
  }
  const normalized = value.replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, " ");
  const clean = (multiline
    ? normalized.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n")
    : normalized.replace(/\s+/g, " ")).trim();
  if (clean.length < minimum) throw new AgentRequestError(`${field} needs at least ${minimum} characters.`);
  // Markup, URLs, and instruction-like content remain inert strings, never executed or fetched.
  return clean;
}

export function validateAgentRequest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AgentRequestError("Send a request object.");
  }
  if (Object.keys(input).some((key) => !FIELDS.has(key))) throw new AgentRequestError("The request contains unsupported fields.");
  if (input.companyWebsite !== "") throw new AgentRequestError("The request could not be accepted. Leave the website field empty.");
  if (input.privacyConsent !== true) throw new AgentRequestError("Consent is required to store this request for review.");
  if (!OFFERS.has(input.offer)) throw new AgentRequestError("Choose a valid service.");
  const email = plainText(input.email, "Email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AgentRequestError("Add a valid email address.");
  return {
    requestId: exactRequestId(input.requestId),
    name: plainText(input.name, "Name", 2, 80),
    email,
    task: plainText(input.task, "Task", 20, 2_000, true),
    tools: plainText(input.tools, "Tools", 0, 500, true),
    success: plainText(input.success, "Success", 10, 1_000, true),
    offer: input.offer,
    privacyConsent: true,
    companyWebsite: "",
  };
}

export function requestMetadata(record) {
  return {
    id: record.id,
    status: record.status,
    offer: record.offer,
    createdAt: record.createdAt,
    retentionUntil: record.retentionUntil,
  };
}

export function publicRequestReceipt(record) {
  return {
    id: record.id,
    createdAt: record.createdAt,
    retentionUntil: record.retentionUntil,
    status: "received",
  };
}

export function requireRequestStore(env) {
  const store = env?.INDUSTRY_NEXT_MADE;
  if (!store || typeof store.get !== "function" || typeof store.put !== "function") {
    throw new AgentRequestError("The request desk is temporarily unavailable. Please try again later.", 503);
  }
  return store;
}

async function fingerprint(payload) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function saveAgentRequest(env, input, { now = new Date(), beforeCreate } = {}) {
  const clean = validateAgentRequest(input);
  const store = requireRequestStore(env);
  const key = `${AGENT_REQUEST_PREFIX}${clean.requestId}`;
  const payloadHash = await fingerprint(clean);
  const existing = await store.get(key, "json");
  if (existing !== null) {
    if (existing?.schema !== "industrynext.agent-request/v1" || existing.id !== clean.requestId ||
        !AGENT_REQUEST_STATUSES.has(existing.status) || !Number.isFinite(Date.parse(existing.retentionUntil)) ||
        !Number.isFinite(Date.parse(existing.createdAt)) || typeof existing.payloadHash !== "string") {
      throw new AgentRequestError("The saved request could not be checked. Please try again later.", 503);
    }
    if (existing.payloadHash !== payloadHash) {
      throw new AgentRequestError("That request ID belongs to different details. Start a new request to change them.", 409);
    }
    // No write, rate-counter update, or retention extension for a known identical retry.
    return { record: existing, created: false };
  }
  if (beforeCreate) await beforeCreate();
  const { requestId, companyWebsite: _honeypot, ...fields } = clean;
  const createdAt = now.toISOString();
  const expiration = Math.floor(now.getTime() / 1_000) + RETENTION_SECONDS;
  const record = {
    schema: "industrynext.agent-request/v1",
    id: requestId,
    status: "new",
    createdAt,
    updatedAt: createdAt,
    retentionUntil: new Date(expiration * 1_000).toISOString(),
    payloadHash,
    ...fields,
  };
  // A single canonical record avoids partially saved copies. KV is eventually consistent:
  // concurrent regional submissions can still race; this is best-effort idempotency.
  await store.put(key, JSON.stringify(record), { expiration, metadata: requestMetadata(record) });
  return { record, created: true };
}
