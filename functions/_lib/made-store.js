const MODES = new Set(["sign", "club", "tool", "character", "ritual", "institution"]);
const PALETTES = new Set(["signal", "garden", "paper", "night", "civic", "candy"]);
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

  if (message.length < 3) throw new Error("Write at least three characters for the work.");
  if (!MODES.has(mode)) throw new Error("Choose a valid form.");
  if (!PALETTES.has(palette)) throw new Error("Choose a valid palette.");

  return {
    message,
    maker,
    mode,
    palette,
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

export async function listMade(env, limit = 24) {
  const result = await env.INDUSTRY_NEXT_MADE.list({
    prefix: "made:",
    limit: Math.min(Math.max(Number.parseInt(limit, 10) || 24, 1), 48),
  });

  return result.keys
    .map((entry) => entry.metadata)
    .filter((entry) => entry && typeof entry === "object");
}

export async function saveMade(env, input, options = {}) {
  const made = buildMadeRecord(input, options.now, options.id);
  await env.INDUSTRY_NEXT_MADE.put(made.key, JSON.stringify(made.record), {
    expirationTtl: 60 * 60 * 24 * 180,
    metadata: made.record,
  });
  return made.record;
}
