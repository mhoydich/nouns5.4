export const SITE_URL = "https://www.industrynext.xyz";
export const BRAND_NAME = "Industry Next";
export const DEFAULT_ROOM_ID = "global-jam";

export function formatCount(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatCompact(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export function formatMultiplier(value) {
  return `${Number(value || 1).toFixed(2)}x`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function titleCase(value) {
  return String(value ?? "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildStatsUrl(roomId = DEFAULT_ROOM_ID) {
  const normalizedRoomId = roomId || DEFAULT_ROOM_ID;

  if (normalizedRoomId === DEFAULT_ROOM_ID) {
    return `${SITE_URL}/`;
  }

  return `${SITE_URL}/?room=${encodeURIComponent(normalizedRoomId)}`;
}

export function buildJamUrl(roomId = DEFAULT_ROOM_ID) {
  const normalizedRoomId = roomId || DEFAULT_ROOM_ID;

  if (normalizedRoomId === DEFAULT_ROOM_ID) {
    return `${SITE_URL}/jam/`;
  }

  return `${SITE_URL}/jam/?room=${encodeURIComponent(normalizedRoomId)}`;
}

export function buildOgImageUrl(roomId = DEFAULT_ROOM_ID) {
  return `${SITE_URL}/api/og.svg?room=${encodeURIComponent(roomId || DEFAULT_ROOM_ID)}`;
}

export function computeRoomTelemetry(snapshot = {}) {
  const players = snapshot.players ?? [];
  const events = snapshot.events ?? [];
  const metrics = snapshot.metrics ?? {};
  const totals = snapshot.totals ?? {};
  const activePlayers = players.filter((player) => player.isActive);
  const uniqueHeads = new Set(players.map((player) => player.seed?.head)).size;
  const uniqueDrops = new Set(players.map((player) => player.selectedDrop)).size;
  const latestPulse = events.find((event) => event.type === "pulse");
  const highestCombo = players.reduce(
    (highest, player) => Math.max(highest, player.bestCombo || 0),
    0,
  );
  const hypeIndex = Math.round(
    (metrics.activeCount || 0) * 14 +
      (metrics.recentReactions || 0) * 11 +
      (metrics.syncedBursts || 0) * 13 +
      (metrics.crewMultiplier || 1) * 20,
  );
  const pulseVelocity =
    (metrics.activeCount || 0) > 0
      ? (totals.tokens || 0) / Math.max(1, metrics.activeCount)
      : (totals.tokens || 0);
  let roomMood = "quiet reset";

  if ((metrics.activeCount || 0) >= 4 && (metrics.syncedBursts || 0) >= 3) {
    roomMood = "full-room parade";
  } else if ((metrics.recentReactions || 0) >= 3) {
    roomMood = "reaction storm";
  } else if ((metrics.activeCount || 0) >= 2) {
    roomMood = "crew build";
  } else if ((totals.tokens || 0) > 0) {
    roomMood = "solo grind";
  } else {
    roomMood = "fresh tape";
  }

  return {
    activePlayers,
    participantCount: players.length,
    uniqueHeads,
    uniqueDrops,
    latestPulse,
    highestCombo,
    hypeIndex,
    pulseVelocity,
    roomMood,
  };
}

export function buildRoomHeadline(snapshot = {}, telemetry = computeRoomTelemetry(snapshot)) {
  if (telemetry.roomMood === "full-room parade") {
    return "Full-room parade";
  }

  if (telemetry.roomMood === "reaction storm") {
    return "Reaction storm";
  }

  if (telemetry.roomMood === "crew build") {
    return "Crew build";
  }

  if ((snapshot.totals?.tokens || 0) >= 500) {
    return "Collectible weather";
  }

  if ((snapshot.totals?.tokens || 0) > 0) {
    return "Solo grind";
  }

  return "Fresh tape";
}

export function buildRoomSummary(snapshot = {}, telemetry = computeRoomTelemetry(snapshot)) {
  return `${formatCount(snapshot.metrics?.activeCount || 0)} active, ${formatMultiplier(
    snapshot.metrics?.crewMultiplier || 1,
  )} crew, ${formatCount(snapshot.events?.length || 0)} tape events.`;
}

export function buildRoomPrimaryLine(snapshot = {}, telemetry = computeRoomTelemetry(snapshot)) {
  if ((snapshot.metrics?.activeCount || 0) > 0) {
    return `${formatCount(snapshot.metrics.activeCount)} active drummers right now`;
  }

  if (telemetry.participantCount > 0) {
    return `${formatCount(telemetry.participantCount)} drummers in the room`;
  }

  if (telemetry.roomMood === "fresh tape") {
    return "First drummer sets the room weather";
  }

  return "Room telemetry is live";
}

export function buildRoomSecondaryLine(snapshot = {}, telemetry = computeRoomTelemetry(snapshot)) {
  if (!telemetry.participantCount) {
    return "Open the room, stack DRUM, wake the crew bonus, and make the tape worth sharing.";
  }

  const leadPlayer = snapshot.players?.[0];
  const leaderLine = leadPlayer
    ? `${leadPlayer.name} is currently leading the room with ${formatCount(leadPlayer.totalTokens)} DRUM.`
    : "The room is already in motion.";

  return `${leaderLine} Jump in at ${buildJamUrl(snapshot.roomId || DEFAULT_ROOM_ID).replace(
    "https://",
    "",
  )} to add your hits, unlock drops, and nudge the numbers.`;
}

export function buildRoomMeta(snapshot = {}, roomIdInput = DEFAULT_ROOM_ID) {
  const roomId = roomIdInput || snapshot.roomId || DEFAULT_ROOM_ID;
  const telemetry = computeRoomTelemetry(snapshot);
  const socialTitle =
    (snapshot.metrics?.activeCount || 0) > 0
      ? `${formatCount(snapshot.metrics.activeCount)} drummers live in ${roomId}`
      : telemetry.participantCount > 0
        ? `${formatCount(telemetry.participantCount)} drummers already in ${roomId}`
        : `Start the ${roomId} Drum Nouns Jam`;
  const socialDescription =
    telemetry.participantCount > 0
      ? `${formatCount(telemetry.participantCount)} participants, ${formatCompact(
          snapshot.totals?.tokens || 0,
        )} DRUM stacked, ${formatMultiplier(
          snapshot.metrics?.crewMultiplier || 1,
        )} crew bonus, ${titleCase(telemetry.roomMood)} mood. Jump into the live Nouns-style drum room.`
      : "Live Nouns-style drum room with crew bonus, collectible drops, and Tezos minting. See active drummers, room heat, and jump into the jam.";

  return {
    roomId,
    pageTitle: `${socialTitle} | ${BRAND_NAME}`,
    description: socialDescription,
    socialTitle,
    socialDescription,
    shareUrl: buildStatsUrl(roomId),
    jamUrl: buildJamUrl(roomId),
    ogImageUrl: buildOgImageUrl(roomId),
    ogImageAlt: `Drum Nouns Jam share card for ${roomId} showing participants, room total, crew bonus, and live room activity.`,
  };
}
