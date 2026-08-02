const APPLICATION_TYPES = new Set(["role-application", "tumblr-talent"]);
const ROLE_IDS = new Set([
  "small-social-systems-builder",
  "halation-lead",
  "tag-open-build-lead",
  "playlist-editor-listener-growth",
]);
const APPLICATION_STATUSES = new Set(["new", "qualified", "conversation", "selected", "declined", "withdrawn"]);
const RETENTION_SECONDS = 60 * 60 * 24 * 90;

function cleanText(value, maxLength, { multiline = false } = {}) {
  if (typeof value !== "string") return "";
  const normalized = value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/\r\n?/g, "\n");
  const compact = multiline
    ? normalized.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim()
    : normalized.replace(/\s+/g, " ").trim();
  return compact.slice(0, maxLength);
}

function cleanEmail(value) {
  const email = cleanText(value, 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Add a working email address.");
  return email;
}

function cleanUrl(value, { required = false } = {}) {
  const raw = cleanText(value, 2_048);
  if (!raw && !required) return "";
  try {
    const url = new URL(raw);
    if (!new Set(["http:", "https:"]).has(url.protocol)) throw new Error("protocol");
    return url.toString();
  } catch {
    throw new Error(required ? "Add a complete public link beginning with http:// or https://." : "Check the public link and try again.");
  }
}

function requireLength(value, label, minimum) {
  if (value.length < minimum) throw new Error(`${label} needs a little more detail.`);
  return value;
}

function baseFields(input) {
  if (!APPLICATION_TYPES.has(input?.type)) throw new Error("Choose a valid way to participate.");
  if (input.termsAcknowledged !== true) throw new Error("Read and accept the participation terms.");
  if (input.privacyConsent !== true) throw new Error("Consent is required to store this application for review.");

  return {
    type: input.type,
    name: requireLength(cleanText(input.name, 80), "Your name", 2),
    email: cleanEmail(input.email),
    timezone: cleanText(input.timezone, 80),
    portfolioUrl: cleanUrl(input.portfolioUrl),
    termsAcknowledged: true,
    privacyConsent: true,
  };
}

function roleFields(input) {
  const roleId = cleanText(input.roleId, 80).toLowerCase();
  if (!ROLE_IDS.has(roleId)) throw new Error("Choose one open role.");
  return {
    roleId,
    whyThis: requireLength(cleanText(input.whyThis, 1_200, { multiline: true }), "Why this role", 24),
    firstMove: requireLength(cleanText(input.firstMove, 1_200, { multiline: true }), "Your seven-day move", 24),
    realGroup: requireLength(cleanText(input.realGroup, 900, { multiline: true }), "The real group", 12),
    availability: requireLength(cleanText(input.availability, 500, { multiline: true }), "Your availability", 8),
    supportRequest: cleanText(input.supportRequest, 500, { multiline: true }),
    tumblrUrl: cleanUrl(input.tumblrUrl),
  };
}

function tumblrFields(input) {
  if (input.profileConsent !== true) throw new Error("Choose whether Industry Next may review this for a public talent profile.");
  return {
    tumblrHandle: requireLength(cleanText(input.tumblrHandle, 80), "Your Tumblr handle", 2),
    tumblrPostUrl: cleanUrl(input.tumblrPostUrl, { required: true }),
    digitalSkill: requireLength(cleanText(input.digitalSkill, 120), "Your digital skill", 3),
    canMake: requireLength(cleanText(input.canMake, 700, { multiline: true }), "What you make", 12),
    canTeach: cleanText(input.canTeach, 500, { multiline: true }),
    sevenDayMove: requireLength(cleanText(input.sevenDayMove, 700, { multiline: true }), "Your seven-day move", 12),
    collaborationNeed: requireLength(cleanText(input.collaborationNeed, 500, { multiline: true }), "What you need", 3),
    profileConsent: true,
    profilePermission: "review-before-publication",
  };
}

export function validateMarketApplication(input) {
  const base = baseFields(input);
  return {
    ...base,
    ...(base.type === "role-application" ? roleFields(input) : tumblrFields(input)),
  };
}

export function buildMarketApplication(input, now = new Date(), id = crypto.randomUUID()) {
  const clean = validateMarketApplication(input);
  const createdAt = now.toISOString();
  const retentionUntil = new Date(now.getTime() + RETENTION_SECONDS * 1_000).toISOString();
  const reverseTime = String(9_999_999_999_999 - now.getTime()).padStart(13, "0");
  const storageKey = `market-application:${reverseTime}:${id}`;

  return {
    storageKey,
    record: {
      schema: "industrynext.market-application/v1",
      id,
      status: "new",
      createdAt,
      updatedAt: createdAt,
      retentionUntil,
      storageKey,
      ...clean,
      statusHistory: [{ status: "new", at: createdAt }],
    },
  };
}

export async function saveMarketApplication(env, input, options = {}) {
  const application = buildMarketApplication(input, options.now, options.id);
  const metadata = {
    id: application.record.id,
    type: application.record.type,
    roleId: application.record.roleId || "tumblr-talent-relay",
    status: application.record.status,
    createdAt: application.record.createdAt,
  };
  const storageOptions = { expirationTtl: RETENTION_SECONDS };

  await Promise.all([
    env.INDUSTRY_NEXT_MADE.put(application.storageKey, JSON.stringify(application.record), {
      ...storageOptions,
      metadata,
    }),
    env.INDUSTRY_NEXT_MADE.put(
      `market-application-id:${application.record.id}`,
      JSON.stringify(application.record),
      storageOptions,
    ),
  ]);
  return application.record;
}

export function publicApplicationReceipt(record) {
  return {
    id: record.id,
    type: record.type,
    roleId: record.roleId || null,
    status: record.status,
    createdAt: record.createdAt,
    retentionUntil: record.retentionUntil,
    responsePromise: "Industry Next will respond within 48 hours or close the loop explicitly.",
  };
}

export { APPLICATION_STATUSES, RETENTION_SECONDS, ROLE_IDS };
