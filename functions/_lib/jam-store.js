const STORE_KEY = "__drum_nouns_jam_rooms__";
const ROOM_TTL_MS = 6 * 60 * 60 * 1000;
const PLAYER_TTL_MS = 3 * 60 * 1000;
const ACTIVE_WINDOW_MS = 45 * 1000;
const EVENT_WINDOW_MS = 12 * 60 * 1000;
const EVENT_LIMIT = 18;

function getStore() {
  const scope = globalThis;

  if (!scope[STORE_KEY]) {
    scope[STORE_KEY] = new Map();
  }

  return scope[STORE_KEY];
}

function sanitizeText(value, fallback, maxLength = 24, pattern = /[^a-zA-Z0-9 _-]/g) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(pattern, "")
    .trim();

  return (normalized || fallback).slice(0, maxLength);
}

export function sanitizeRoomId(value) {
  return sanitizeText(value, "global-jam", 24).toLowerCase().replaceAll(" ", "-");
}

function sanitizeNumber(value, fallback = 0, max = 9999999) {
  const numeric = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(numeric) || numeric < 0) {
    return fallback;
  }

  return Math.min(numeric, max);
}

function sanitizeSeed(seed = {}) {
  return {
    background: sanitizeNumber(seed.background, 0, 1),
    body: sanitizeNumber(seed.body, 0, 999),
    accessory: sanitizeNumber(seed.accessory, 0, 999),
    head: sanitizeNumber(seed.head, 0, 999),
    glasses: sanitizeNumber(seed.glasses, 0, 999),
  };
}

function createRoom(roomId) {
  return {
    roomId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sequence: 0,
    totals: {
      hits: 0,
      tokens: 0,
    },
    players: new Map(),
    events: [],
  };
}

function serializeRoomForStorage(room) {
  return {
    roomId: room.roomId,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    sequence: room.sequence,
    totals: room.totals,
    players: [...room.players.values()],
    events: room.events,
  };
}

function roomFromStorage(record = {}) {
  const room = createRoom(record.roomId);

  room.createdAt = sanitizeNumber(record.createdAt, room.createdAt, Number.MAX_SAFE_INTEGER);
  room.updatedAt = sanitizeNumber(record.updatedAt, room.updatedAt, Number.MAX_SAFE_INTEGER);
  room.sequence = sanitizeNumber(record.sequence, 0, Number.MAX_SAFE_INTEGER);
  room.totals = {
    hits: sanitizeNumber(record.totals?.hits, 0, Number.MAX_SAFE_INTEGER),
    tokens: sanitizeNumber(record.totals?.tokens, 0, Number.MAX_SAFE_INTEGER),
  };
  room.events = Array.isArray(record.events)
    ? record.events.slice(0, EVENT_LIMIT).map((event) => ({
        id: sanitizeText(event?.id, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, 80),
        createdAt: sanitizeNumber(event?.createdAt, Date.now(), Number.MAX_SAFE_INTEGER),
        type: sanitizeText(event?.type, "pulse", 24),
        playerId: sanitizeText(event?.playerId, "guest", 80),
        playerName: sanitizeText(event?.playerName, "Rim Rider", 24),
        seed: sanitizeSeed(event?.seed),
        selectedDrop: sanitizeText(event?.selectedDrop, "Garage Kick", 32),
        reaction: event?.reaction ? sanitizeText(event.reaction, "CLAP", 16).toUpperCase() : undefined,
        hits: sanitizeNumber(event?.hits, 0, 999),
        tokens: sanitizeNumber(event?.tokens, 0, 99999),
        combo: sanitizeNumber(event?.combo, 0, 999),
        message: sanitizeText(event?.message, "Room movement logged.", 180, /$^/g),
      }))
    : [];
  room.players = new Map(
    Array.isArray(record.players)
      ? record.players.map((player) => [
          sanitizeText(player?.id, `guest-${Date.now()}`, 80),
          {
            id: sanitizeText(player?.id, `guest-${Date.now()}`, 80),
            name: sanitizeText(player?.name, "Rim Rider", 24),
            seed: sanitizeSeed(player?.seed),
            selectedDrop: sanitizeText(player?.selectedDrop, "Garage Kick", 32),
            totalHits: sanitizeNumber(player?.totalHits, 0, Number.MAX_SAFE_INTEGER),
            totalTokens: sanitizeNumber(player?.totalTokens, 0, Number.MAX_SAFE_INTEGER),
            bestCombo: sanitizeNumber(player?.bestCombo, 0, 999),
            lastSeenAt: sanitizeNumber(player?.lastSeenAt, Date.now(), Number.MAX_SAFE_INTEGER),
            lastBeatAt: sanitizeNumber(player?.lastBeatAt, 0, Number.MAX_SAFE_INTEGER),
            lastReactionAt: sanitizeNumber(player?.lastReactionAt, 0, Number.MAX_SAFE_INTEGER),
          },
        ])
      : [],
  );

  return room;
}

function cleanupStore() {
  const now = Date.now();
  const store = getStore();

  for (const [roomId, room] of store.entries()) {
    for (const [playerId, player] of room.players.entries()) {
      if (now - player.lastSeenAt > PLAYER_TTL_MS) {
        room.players.delete(playerId);
      }
    }

    room.events = room.events.filter((event) => now - event.createdAt <= EVENT_WINDOW_MS);

    if (!room.players.size && now - room.updatedAt > ROOM_TTL_MS) {
      store.delete(roomId);
    }
  }
}

function ensureRoom(roomIdInput) {
  cleanupStore();
  const roomId = sanitizeRoomId(roomIdInput);
  const store = getStore();

  if (!store.has(roomId)) {
    store.set(roomId, createRoom(roomId));
  }

  return store.get(roomId);
}

function ensurePlayer(room, playerInput = {}) {
  const playerId = sanitizeText(playerInput.id, `guest-${Date.now()}`, 80);
  const name = sanitizeText(playerInput.name, "Rim Rider", 24);
  const seed = sanitizeSeed(playerInput.seed);
  const selectedDrop = sanitizeText(playerInput.selectedDrop, "Garage Kick", 32);
  const now = Date.now();
  let player = room.players.get(playerId);
  let isNew = false;

  if (!player) {
    player = {
      id: playerId,
      name,
      seed,
      selectedDrop,
      totalHits: 0,
      totalTokens: 0,
      bestCombo: 0,
      lastSeenAt: now,
      lastBeatAt: 0,
      lastReactionAt: 0,
    };
    room.players.set(playerId, player);
    isNew = true;
  }

  player.name = name;
  player.seed = seed;
  player.selectedDrop = selectedDrop;
  player.lastSeenAt = now;

  return {
    player,
    isNew,
  };
}

function pushEvent(room, event) {
  room.events.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    ...event,
  });

  if (room.events.length > EVENT_LIMIT) {
    room.events.length = EVENT_LIMIT;
  }
}

function buildMetrics(room) {
  const now = Date.now();
  const players = [...room.players.values()];
  const activePlayers = players.filter(
    (player) => now - Math.max(player.lastBeatAt || 0, player.lastSeenAt) <= ACTIVE_WINDOW_MS,
  );
  const recentReactions = room.events.filter(
    (event) => event.type === "reaction" && now - event.createdAt <= ACTIVE_WINDOW_MS,
  ).length;
  const syncedBursts = room.events.filter(
    (event) => event.type === "pulse" && now - event.createdAt <= ACTIVE_WINDOW_MS,
  ).length;
  const extraPlayers = Math.max(0, activePlayers.length - 1);
  const crewMultiplier = Number(
    (
      1 +
      Math.min(
        1.35,
        extraPlayers > 0
          ? extraPlayers * 0.18 + recentReactions * 0.04 + syncedBursts * 0.03
          : 0,
      )
    ).toFixed(2),
  );

  return {
    activeCount: activePlayers.length,
    crewMultiplier,
    recentReactions,
    syncedBursts,
  };
}

function touchRoom(room) {
  room.updatedAt = Date.now();
  room.sequence += 1;
}

function serializeRoom(room) {
  const now = Date.now();

  return {
    roomId: room.roomId,
    updatedAt: room.updatedAt,
    sequence: room.sequence,
    totals: room.totals,
    metrics: buildMetrics(room),
    players: [...room.players.values()]
      .map((player) => ({
        id: player.id,
        name: player.name,
        seed: player.seed,
        selectedDrop: player.selectedDrop,
        totalHits: player.totalHits,
        totalTokens: player.totalTokens,
        bestCombo: player.bestCombo,
        lastSeenAt: player.lastSeenAt,
        lastBeatAt: player.lastBeatAt,
        isActive: now - Math.max(player.lastBeatAt || 0, player.lastSeenAt) <= ACTIVE_WINDOW_MS,
      }))
      .sort((left, right) => right.totalTokens - left.totalTokens),
    events: room.events.slice(0, EVENT_LIMIT),
  };
}

function buildDailySpotlightRoomId(now = Date.now()) {
  const date = new Date(now);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return sanitizeRoomId(`daily-${year}${month}${day}`);
}

function summarizeRoom(snapshot) {
  const leader = snapshot.players[0] || null;
  const latestEvent = snapshot.events[0] || null;
  const participantCount = snapshot.players.length;
  const highestCombo = snapshot.players.reduce(
    (highest, player) => Math.max(highest, player.bestCombo || 0),
    0,
  );
  const freshnessWindow = Math.max(0, 600 - Math.round((Date.now() - snapshot.updatedAt) / 1000));
  const score =
    (snapshot.metrics?.activeCount || 0) * 120 +
    (snapshot.metrics?.recentReactions || 0) * 42 +
    (snapshot.metrics?.syncedBursts || 0) * 36 +
    Math.min(120, Math.round((snapshot.totals?.tokens || 0) / 24)) +
    Math.min(48, participantCount * 8) +
    Math.min(24, Math.round(highestCombo * 1.5)) +
    Math.min(60, freshnessWindow / 10);

  return {
    roomId: snapshot.roomId,
    updatedAt: snapshot.updatedAt,
    activeCount: snapshot.metrics?.activeCount || 0,
    participantCount,
    totalTokens: snapshot.totals?.tokens || 0,
    crewMultiplier: snapshot.metrics?.crewMultiplier || 1,
    recentReactions: snapshot.metrics?.recentReactions || 0,
    syncedBursts: snapshot.metrics?.syncedBursts || 0,
    highestCombo,
    topPlayerName: leader?.name || "",
    topPlayerSeed: leader?.seed || null,
    leadTokens: leader?.totalTokens || 0,
    latestEventType: latestEvent?.type || "",
    latestEventMessage: latestEvent?.message || "",
    score: Math.round(score),
  };
}

export function getRoomSnapshot(roomId) {
  return serializeRoom(ensureRoom(roomId));
}

export function getRoomDirectory(limitInput = 6) {
  cleanupStore();
  const limit = sanitizeNumber(limitInput, 6, 12);
  const snapshots = [...getStore().values()].map((room) => serializeRoom(room));
  const summaries = snapshots
    .map((snapshot) => summarizeRoom(snapshot))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (right.updatedAt || 0) - (left.updatedAt || 0);
    });

  return {
    updatedAt: Date.now(),
    spotlightRoomId: buildDailySpotlightRoomId(),
    totals: {
      rooms: summaries.length,
      liveRooms: summaries.filter((room) => room.activeCount > 0).length,
      activeDrummers: summaries.reduce((sum, room) => sum + room.activeCount, 0),
      participants: summaries.reduce((sum, room) => sum + room.participantCount, 0),
      tokens: summaries.reduce((sum, room) => sum + room.totalTokens, 0),
    },
    rooms: summaries.slice(0, limit),
  };
}

export function exportRoomStoreSnapshot() {
  cleanupStore();

  return {
    version: 1,
    savedAt: Date.now(),
    rooms: [...getStore().values()].map(serializeRoomForStorage),
  };
}

export function importRoomStoreSnapshot(snapshot = {}) {
  const store = getStore();
  store.clear();

  if (!Array.isArray(snapshot.rooms)) {
    return;
  }

  snapshot.rooms.forEach((record) => {
    const roomId = sanitizeRoomId(record?.roomId);
    store.set(roomId, roomFromStorage({ ...record, roomId }));
  });

  cleanupStore();
}

export function joinRoom(roomId, playerInput) {
  const room = ensureRoom(roomId);
  const { player, isNew } = ensurePlayer(room, playerInput);
  touchRoom(room);

  if (isNew) {
    pushEvent(room, {
      type: "join",
      playerId: player.id,
      playerName: player.name,
      seed: player.seed,
      selectedDrop: player.selectedDrop,
      message: `${player.name} joined ${room.roomId} with ${player.selectedDrop}.`,
    });
  }

  return serializeRoom(room);
}

export function recordPulse(roomId, playerInput, pulseInput = {}) {
  const room = ensureRoom(roomId);
  const { player, isNew } = ensurePlayer(room, playerInput);
  const hits = sanitizeNumber(pulseInput.hits, 0, 999);
  const tokens = sanitizeNumber(pulseInput.tokens, 0, 99999);
  const combo = sanitizeNumber(pulseInput.combo, 0, 999);
  const now = Date.now();

  touchRoom(room);
  player.lastBeatAt = now;
  player.bestCombo = Math.max(player.bestCombo, combo);
  player.totalHits += hits;
  player.totalTokens += tokens;
  room.totals.hits += hits;
  room.totals.tokens += tokens;

  if (isNew) {
    pushEvent(room, {
      type: "join",
      playerId: player.id,
      playerName: player.name,
      seed: player.seed,
      selectedDrop: player.selectedDrop,
      message: `${player.name} jumped straight into ${room.roomId}.`,
    });
  }

  if (hits >= 4 || combo >= 8 || tokens >= 10) {
    const detail =
      combo >= 12
        ? `${player.name} cracked a ${combo}x combo and shook the whole room.`
        : combo >= 8
          ? `${player.name} hit a ${combo}x combo burst for +${tokens} DRUM.`
          : `${player.name} dropped ${hits} hits for +${tokens} DRUM.`;

    pushEvent(room, {
      type: "pulse",
      playerId: player.id,
      playerName: player.name,
      seed: player.seed,
      hits,
      tokens,
      combo,
      message: detail,
    });
  }

  return serializeRoom(room);
}

export function recordReaction(roomId, playerInput, reactionInput = {}) {
  const room = ensureRoom(roomId);
  const { player } = ensurePlayer(room, playerInput);
  const reaction = sanitizeText(reactionInput.reaction, "CLAP", 16).toUpperCase();
  const now = Date.now();

  player.lastReactionAt = now;
  touchRoom(room);

  pushEvent(room, {
    type: "reaction",
    playerId: player.id,
    playerName: player.name,
    seed: player.seed,
    reaction,
    message: `${player.name} fired ${reaction} into the room.`,
  });

  return serializeRoom(room);
}
