const STORE_KEY = "__industry_next_feedback__";
const ENTRY_LIMIT = 40;
const RECENT_LIMIT = 6;

const AREA_LABELS = {
  "landing-pad": "Landing pad",
  "live-board": "Live board",
  nouns: "Noun look",
  "drops-mint": "Drops + mint",
  "overall-vibe": "Overall vibe",
};

function getStore() {
  const scope = globalThis;

  if (!Array.isArray(scope[STORE_KEY])) {
    scope[STORE_KEY] = [];
  }

  return scope[STORE_KEY];
}

function sanitizeText(value, fallback = "", maxLength = 280) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  return (normalized || fallback).slice(0, maxLength);
}

function sanitizeName(value) {
  return sanitizeText(value, "Anonymous", 24).replace(/[^a-zA-Z0-9 _-]/g, "");
}

function sanitizeRoomId(value) {
  return sanitizeText(value, "global-jam", 24)
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .toLowerCase()
    .replaceAll(" ", "-");
}

function sanitizeArea(value) {
  return AREA_LABELS[value] ? value : "overall-vibe";
}

function serializeEntry(entry) {
  return {
    id: entry.id,
    name: entry.name,
    area: entry.area,
    areaLabel: AREA_LABELS[entry.area],
    roomId: entry.roomId,
    note: entry.note,
    createdAt: entry.createdAt,
  };
}

function buildSnapshot() {
  const entries = getStore();
  const counts = {};

  entries.forEach((entry) => {
    counts[entry.area] = (counts[entry.area] || 0) + 1;
  });

  const [topAreaKey = ""] = Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .map(([key]) => key);

  return {
    total: entries.length,
    topArea: topAreaKey
      ? {
          key: topAreaKey,
          label: AREA_LABELS[topAreaKey],
          count: counts[topAreaKey],
        }
      : null,
    entries: entries.slice(0, RECENT_LIMIT).map(serializeEntry),
  };
}

export function getFeedbackSnapshot() {
  return buildSnapshot();
}

export function submitFeedback(input = {}) {
  const note = sanitizeText(input.note, "", 280);

  if (note.length < 8) {
    throw new Error("Share a little more so we can learn what is working.");
  }

  const nextEntry = {
    id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: sanitizeName(input.name),
    area: sanitizeArea(input.area),
    roomId: sanitizeRoomId(input.roomId),
    note,
    createdAt: Date.now(),
  };

  const store = getStore();
  store.unshift(nextEntry);

  if (store.length > ENTRY_LIMIT) {
    store.length = ENTRY_LIMIT;
  }

  return {
    received: true,
    entry: serializeEntry(nextEntry),
    ...buildSnapshot(),
  };
}
