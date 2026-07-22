const MODES = new Set(["sign", "club", "tool", "character", "ritual", "institution"]);
const PALETTES = new Set(["signal", "garden", "paper", "night", "civic", "candy"]);
const EDITIONS = new Set(["open-studio-001", "open-studio-002"]);
const CURRENT_EDITION = "open-studio-002";
const SEED_LIMITS = {
  background: 2,
  body: 30,
  accessory: 143,
  head: 254,
  glasses: 23,
};

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanSeed(seed) {
  if (!seed || typeof seed !== "object") throw new Error("Choose a Noun before publishing.");

  return Object.fromEntries(
    Object.entries(SEED_LIMITS).map(([part, limit]) => {
      const value = Number.parseInt(seed[part], 10);
      if (!Number.isInteger(value) || value < 0 || value >= limit) {
        throw new Error(`The ${part} selection is out of range.`);
      }
      return [part, value];
    }),
  );
}

export function validateMadeSubmission(input) {
  const message = cleanText(input?.message, 96);
  const maker = cleanText(input?.maker, 28);
  const mode = cleanText(input?.mode, 20).toLowerCase();
  const palette = cleanText(input?.palette, 20).toLowerCase();
  const edition = cleanText(input?.edition, 32).toLowerCase() || CURRENT_EDITION;
  const parentId = cleanText(input?.parentId, 64);

  if (message.length < 3) throw new Error("Write at least three characters for the work.");
  if (!MODES.has(mode)) throw new Error("Choose a valid form.");
  if (!PALETTES.has(palette)) throw new Error("Choose a valid palette.");
  if (!EDITIONS.has(edition)) throw new Error("Choose a valid open studio edition.");
  if (parentId && !/^[a-zA-Z0-9-]+$/.test(parentId)) throw new Error("Choose a valid work to remix.");

  return {
    message,
    maker,
    mode,
    palette,
    edition,
    parentId,
    seed: cleanSeed(input.seed),
  };
}

export function buildMadeRecord(input, now = new Date(), id = crypto.randomUUID()) {
  const clean = validateMadeSubmission(input);
  const createdAt = now.toISOString();
  const reverseTime = String(9_999_999_999_999 - now.getTime()).padStart(13, "0");

  return {
    key: `made:${reverseTime}:${id}`,
    record: {
      id,
      createdAt,
      ...clean,
    },
  };
}

export async function listMade(env, limit = 24, edition = "") {
  const parsedLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 24, 1), 48);
  const result = await env.INDUSTRY_NEXT_MADE.list({
    prefix: "made:",
    limit: edition ? 48 : parsedLimit,
  });

  return result.keys
    .map((entry) => entry.metadata)
    .filter((entry) => entry && typeof entry === "object")
    .filter((entry) => !edition || (entry.edition || "open-studio-001") === edition)
    .slice(0, parsedLimit);
}

export async function getMadeById(env, id) {
  const cleanId = cleanText(id, 64);
  if (!cleanId || !/^[a-zA-Z0-9-]+$/.test(cleanId)) return null;

  const indexed = await env.INDUSTRY_NEXT_MADE.get(`made-id:${cleanId}`, "json");
  if (indexed && typeof indexed === "object") return indexed;

  const recent = await listMade(env, 48);
  return recent.find((entry) => entry.id === cleanId) || null;
}

export async function saveMade(env, input, options = {}) {
  const made = buildMadeRecord(input, options.now, options.id);
  const storageOptions = { expirationTtl: 60 * 60 * 24 * 180 };
  await Promise.all([
    env.INDUSTRY_NEXT_MADE.put(made.key, JSON.stringify(made.record), {
      ...storageOptions,
      metadata: made.record,
    }),
    env.INDUSTRY_NEXT_MADE.put(`made-id:${made.record.id}`, JSON.stringify(made.record), storageOptions),
  ]);
  return made.record;
}
