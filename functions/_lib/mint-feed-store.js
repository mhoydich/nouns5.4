const STORE_KEY = "__industry_next_mint_feed__";
const ENTRY_LIMIT = 48;
const RECENT_LIMIT = 6;

function getStore() {
  const scope = globalThis;

  if (!Array.isArray(scope[STORE_KEY])) {
    scope[STORE_KEY] = [];
  }

  return scope[STORE_KEY];
}

function sanitizeText(value, fallback = "", maxLength = 120, pattern = /[^a-zA-Z0-9 _:/#.-]/g) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(pattern, "")
    .trim();

  return (normalized || fallback).slice(0, maxLength);
}

function sanitizeRoomId(value) {
  return sanitizeText(value, "global-jam", 24).toLowerCase().replaceAll(" ", "-");
}

function sanitizeTarget(value) {
  return value === "noun" ? "noun" : "drop";
}

function sanitizeHash(value) {
  return sanitizeText(value, "", 72, /[^a-zA-Z0-9]/g);
}

function sanitizeUrl(value) {
  const candidate = String(value ?? "").trim();

  if (!candidate.startsWith("https://")) {
    return "";
  }

  return candidate.slice(0, 280);
}

function serializeEntry(entry) {
  return {
    id: entry.id,
    roomId: entry.roomId,
    playerName: entry.playerName,
    target: entry.target,
    dropTitle: entry.dropTitle,
    nounHead: entry.nounHead,
    itemLabel: entry.target === "noun" ? `${entry.nounHead} noun` : entry.dropTitle,
    opHash: entry.opHash,
    explorerUrl: entry.explorerUrl,
    createdAt: entry.createdAt,
  };
}

function buildSnapshot() {
  const entries = getStore();
  const dropCounts = {};

  entries.forEach((entry) => {
    const label = entry.target === "noun" ? `${entry.nounHead} noun` : entry.dropTitle;
    dropCounts[label] = (dropCounts[label] || 0) + 1;
  });

  const [topDropLabel = ""] = Object.entries(dropCounts)
    .sort((left, right) => right[1] - left[1])
    .map(([label]) => label);

  return {
    total: entries.length,
    topDrop: topDropLabel
      ? {
          label: topDropLabel,
          count: dropCounts[topDropLabel],
        }
      : null,
    entries: entries.slice(0, RECENT_LIMIT).map(serializeEntry),
  };
}

export function getMintFeedSnapshot() {
  return buildSnapshot();
}

export function recordMint(input = {}) {
  const opHash = sanitizeHash(input.opHash);

  if (!opHash) {
    throw new Error("A Tezos operation hash is required to log a mint.");
  }

  const store = getStore();

  if (store.some((entry) => entry.opHash === opHash)) {
    return {
      received: true,
      duplicate: true,
      ...buildSnapshot(),
    };
  }

  const target = sanitizeTarget(input.target);
  const nextEntry = {
    id: `mint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    roomId: sanitizeRoomId(input.roomId),
    playerName: sanitizeText(input.playerName, "Rim Rider", 24, /[^a-zA-Z0-9 _-]/g),
    target,
    dropTitle: sanitizeText(input.dropTitle, "Garage Kick", 40, /[^a-zA-Z0-9 _-]/g),
    nounHead: sanitizeText(input.nounHead, "Live", 40, /[^a-zA-Z0-9 _-]/g),
    opHash,
    explorerUrl: sanitizeUrl(input.explorerUrl),
    createdAt: Date.now(),
  };

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
