import { buildSVG } from "../public/lib/nouns-svg.js";

const STORAGE_KEY = "drum-nouns-jam.v1";
const LAST_ROOM_STORAGE_KEY = "drum-nouns-jam.last-room";
const DEFAULT_ROOM_ID = "global-jam";
const POLL_MS = 15000;
const DROP_LIBRARY = [
  {
    id: "garage-kick",
    title: "Garage Kick",
    tier: "Starter",
    threshold: 0,
  },
  {
    id: "cymbal-bloom",
    title: "Cymbal Bloom",
    tier: "Crew",
    threshold: 40,
  },
  {
    id: "laser-tom",
    title: "Laser Tom",
    tier: "Glow",
    threshold: 140,
  },
  {
    id: "street-parade",
    title: "Street Parade",
    tier: "Rare",
    threshold: 320,
  },
  {
    id: "moon-riser",
    title: "Moon Riser",
    tier: "Legend",
    threshold: 700,
  },
];

const elements = {
  roomBadge: document.querySelector("#room-badge"),
  roomMood: document.querySelector("#room-mood"),
  heroHeadline: document.querySelector("#hero-headline"),
  heroSummary: document.querySelector("#hero-summary"),
  roomTotal: document.querySelector("#room-total"),
  activeCount: document.querySelector("#active-count"),
  crewMultiplier: document.querySelector("#crew-multiplier-live"),
  hypeIndex: document.querySelector("#hype-index"),
  pulseVelocity: document.querySelector("#pulse-velocity"),
  signalFill: document.querySelector("#signal-fill"),
  enterRoomLink: document.querySelector("#enter-room-link"),
  refreshButton: document.querySelector("#refresh-button"),
  localAvatar: document.querySelector("#local-avatar"),
  localName: document.querySelector("#local-name"),
  localTagline: document.querySelector("#local-tagline"),
  localTokens: document.querySelector("#local-tokens"),
  localHits: document.querySelector("#local-hits"),
  localMints: document.querySelector("#local-mints"),
  localEfficiency: document.querySelector("#local-efficiency"),
  localDropName: document.querySelector("#local-drop-name"),
  localDropNote: document.querySelector("#local-drop-note"),
  dropProgressFill: document.querySelector("#drop-progress-fill"),
  roomNouns: document.querySelector("#room-nouns"),
  leaderboardList: document.querySelector("#leaderboard-list"),
  trendTape: document.querySelector("#trend-tape"),
  trendPulse: document.querySelector("#trend-pulse"),
  trendSpread: document.querySelector("#trend-spread"),
  trendCombo: document.querySelector("#trend-combo"),
  trendNotes: document.querySelector("#trend-notes"),
  eventFeed: document.querySelector("#event-feed"),
  stampLine: document.querySelector("#stamp-line"),
};

const state = {
  roomId: resolveRoomId(),
  profile: readProfile(),
  room: createEmptyRoom(resolveRoomId()),
  imageData: null,
};

function createEmptyRoom(roomId) {
  return {
    roomId,
    totals: {
      hits: 0,
      tokens: 0,
    },
    metrics: {
      activeCount: 0,
      crewMultiplier: 1,
      recentReactions: 0,
      syncedBursts: 0,
    },
    players: [],
    events: [],
    updatedAt: Date.now(),
  };
}

function sanitizeText(value, fallback, maxLength = 24, pattern = /[^a-zA-Z0-9 _-]/g) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(pattern, "")
    .trim();

  return (normalized || fallback).slice(0, maxLength);
}

function sanitizeRoomId(value) {
  return sanitizeText(value, DEFAULT_ROOM_ID, 24).toLowerCase().replaceAll(" ", "-");
}

function sanitizeName(value) {
  return sanitizeText(value, "Rim Rider", 24);
}

function clampNumber(value, fallback = 0, max = 9999999) {
  const numeric = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(numeric) || numeric < 0) {
    return fallback;
  }

  return Math.min(numeric, max);
}

function resolveRoomId() {
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get("room");

  if (fromQuery) {
    return sanitizeRoomId(fromQuery);
  }

  try {
    return sanitizeRoomId(window.localStorage.getItem(LAST_ROOM_STORAGE_KEY));
  } catch {
    return DEFAULT_ROOM_ID;
  }
}

function readProfile() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    return {
      name: sanitizeName(parsed?.name),
      seed: parsed?.seed ?? null,
      lifetimeTokens: clampNumber(parsed?.lifetimeTokens),
      lifetimeHits: clampNumber(parsed?.lifetimeHits),
      mintedDrops:
        parsed?.mintedDrops && typeof parsed.mintedDrops === "object" ? parsed.mintedDrops : {},
      selectedDropId: sanitizeText(parsed?.selectedDropId, DROP_LIBRARY[0].id, 32),
    };
  } catch {
    return {
      name: "Rim Rider",
      seed: null,
      lifetimeTokens: 0,
      lifetimeHits: 0,
      mintedDrops: {},
      selectedDropId: DROP_LIBRARY[0].id,
    };
  }
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatCompact(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return "just now";
  }

  const delta = Math.max(0, Date.now() - timestamp);

  if (delta < 8000) {
    return "just now";
  }

  if (delta < 60000) {
    return `${Math.round(delta / 1000)}s ago`;
  }

  if (delta < 3600000) {
    return `${Math.round(delta / 60000)}m ago`;
  }

  return `${Math.round(delta / 3600000)}h ago`;
}

function formatMultiplier(value) {
  return `${Number(value || 1).toFixed(2)}x`;
}

function humanize(value) {
  return String(value)
    .replace(/^(body|accessory|head|glasses)-/, "")
    .replaceAll("-", " ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function titleCase(value) {
  return String(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDropById(dropId) {
  return DROP_LIBRARY.find((drop) => drop.id === dropId) || DROP_LIBRARY[0];
}

function getUnlockedDrops(profile) {
  return DROP_LIBRARY.filter((drop) => profile.lifetimeTokens >= drop.threshold);
}

function getNextDrop(profile) {
  return DROP_LIBRARY.find((drop) => profile.lifetimeTokens < drop.threshold) ?? null;
}

function buildNoun(seed) {
  if (!state.imageData || !seed) {
    return null;
  }

  const resolvedSeed = {
    background: clampNumber(seed.background, 0, state.imageData.bgcolors.length - 1),
    body: clampNumber(seed.body, 0, state.imageData.images.bodies.length - 1),
    accessory: clampNumber(seed.accessory, 0, state.imageData.images.accessories.length - 1),
    head: clampNumber(seed.head, 0, state.imageData.images.heads.length - 1),
    glasses: clampNumber(seed.glasses, 0, state.imageData.images.glasses.length - 1),
  };
  const parts = [
    state.imageData.images.bodies[resolvedSeed.body],
    state.imageData.images.accessories[resolvedSeed.accessory],
    state.imageData.images.heads[resolvedSeed.head],
    state.imageData.images.glasses[resolvedSeed.glasses],
  ];

  return {
    svg: buildSVG(parts, state.imageData.palette, state.imageData.bgcolors[resolvedSeed.background]),
    labels: {
      body: humanize(parts[0].filename),
      accessory: humanize(parts[1].filename),
      head: humanize(parts[2].filename),
      glasses: humanize(parts[3].filename),
    },
  };
}

function renderAvatar(seed, fallbackLabel = "NOUN") {
  const noun = buildNoun(seed);

  if (noun) {
    return noun.svg;
  }

  return `<div class="stats-avatar-fallback">${escapeHtml(fallbackLabel)}</div>`;
}

function computeRoomStats(room) {
  const activePlayers = room.players.filter((player) => player.isActive);
  const uniqueHeads = new Set(room.players.map((player) => player.seed?.head)).size;
  const uniqueDrops = new Set(room.players.map((player) => player.selectedDrop)).size;
  const latestPulse = room.events.find((event) => event.type === "pulse");
  const highestCombo = room.players.reduce(
    (highest, player) => Math.max(highest, player.bestCombo || 0),
    0,
  );
  const hypeIndex = Math.round(
    room.metrics.activeCount * 14 +
      room.metrics.recentReactions * 11 +
      room.metrics.syncedBursts * 13 +
      room.metrics.crewMultiplier * 20,
  );
  const pulseVelocity =
    room.metrics.activeCount > 0
      ? room.totals.tokens / Math.max(1, room.metrics.activeCount)
      : room.totals.tokens;

  let roomMood = "quiet reset";

  if (room.metrics.activeCount >= 4 && room.metrics.syncedBursts >= 3) {
    roomMood = "full-room parade";
  } else if (room.metrics.recentReactions >= 3) {
    roomMood = "reaction storm";
  } else if (room.metrics.activeCount >= 2) {
    roomMood = "crew build";
  } else if (room.totals.tokens > 0) {
    roomMood = "solo grind";
  }

  return {
    activePlayers,
    uniqueHeads,
    uniqueDrops,
    latestPulse,
    highestCombo,
    hypeIndex,
    pulseVelocity,
    roomMood,
  };
}

function buildHeroHeadline(room, roomStats) {
  if (roomStats.roomMood === "full-room parade") {
    return "Full-room parade";
  }

  if (roomStats.roomMood === "reaction storm") {
    return "Reaction storm";
  }

  if (roomStats.roomMood === "crew build") {
    return "Crew build";
  }

  if (room.totals.tokens >= 500) {
    return "Collectible weather";
  }

  if (room.totals.tokens > 0) {
    return "Solo grind";
  }

  return "Fresh tape";
}

function buildHeroSummary(room, roomStats) {
  return `${formatCount(room.events.length)} logged events, ${formatCount(
    room.metrics.activeCount,
  )} active drummers, and a ${formatMultiplier(
    room.metrics.crewMultiplier,
  )} crew bonus in ${room.roomId}.`;
}

function renderHero(room, roomStats) {
  elements.roomBadge.textContent = room.roomId;
  elements.heroHeadline.textContent = buildHeroHeadline(room, roomStats);
  elements.heroSummary.textContent = buildHeroSummary(room, roomStats);
  elements.roomMood.textContent = titleCase(roomStats.roomMood);
  elements.roomTotal.textContent = formatCompact(room.totals.tokens);
  elements.activeCount.textContent = formatCount(room.metrics.activeCount);
  elements.crewMultiplier.textContent = formatMultiplier(room.metrics.crewMultiplier);
  elements.hypeIndex.textContent = formatCount(roomStats.hypeIndex);
  elements.pulseVelocity.textContent = formatCount(Math.round(roomStats.pulseVelocity));
  elements.signalFill.style.width = `${Math.min(100, Math.max(8, roomStats.hypeIndex / 2.2))}%`;
  elements.enterRoomLink.href = `/jam/?room=${encodeURIComponent(room.roomId)}`;
  elements.stampLine.textContent = formatRelativeTime(room.updatedAt);
}

function renderLocalProfile(profile) {
  const selectedDrop = getDropById(profile.selectedDropId);
  const nextDrop = getNextDrop(profile);
  const unlockedDrops = getUnlockedDrops(profile);
  const mintedCount = Object.keys(profile.mintedDrops || {}).length;
  const efficiency = profile.lifetimeHits
    ? (profile.lifetimeTokens / profile.lifetimeHits).toFixed(2)
    : "0.00";
  const roomFallbackSeed = state.room.players[0]?.seed || null;
  const activeSeed = profile.seed || roomFallbackSeed;
  let dropProgress = 100;
  let dropNote = "All drops unlocked. You are in the legend zone.";

  if (nextDrop) {
    const previousDropThreshold = unlockedDrops[unlockedDrops.length - 1]?.threshold || 0;
    const span = Math.max(1, nextDrop.threshold - previousDropThreshold);
    dropProgress =
      ((profile.lifetimeTokens - previousDropThreshold) / span) * 100;
    dropNote = `${formatCount(nextDrop.threshold - profile.lifetimeTokens)} DRUM until ${nextDrop.title}.`;
  }

  let localTagline = "No local drum history yet. Jump into the jam and start the graph.";

  if (profile.lifetimeHits > 0) {
    localTagline = `${profile.name} is carrying ${formatCount(
      profile.lifetimeTokens,
    )} DRUM across ${formatCount(profile.lifetimeHits)} lifetime hits with ${mintedCount} minted collectibles.`;
  }

  elements.localAvatar.innerHTML = renderAvatar(activeSeed, profile.name.slice(0, 4));
  elements.localName.textContent = profile.name;
  elements.localTagline.textContent = localTagline;
  elements.localTokens.textContent = formatCount(profile.lifetimeTokens);
  elements.localHits.textContent = formatCount(profile.lifetimeHits);
  elements.localMints.textContent = formatCount(mintedCount);
  elements.localEfficiency.textContent = efficiency;
  elements.localDropName.textContent = `${selectedDrop.title} / ${selectedDrop.tier}`;
  elements.localDropNote.textContent = dropNote;
  elements.dropProgressFill.style.width = `${Math.min(100, Math.max(4, dropProgress))}%`;
}

function renderRoomNouns(room, roomStats) {
  const players = (roomStats.activePlayers.length ? roomStats.activePlayers : room.players).slice(0, 6);

  if (!players.length) {
    elements.roomNouns.innerHTML =
      '<div class="stats-empty">No crowd silhouettes yet. First drummer gets to set the visual weather.</div>';
    return;
  }

  elements.roomNouns.innerHTML = players
    .map(
      (player) => `
        <article class="noun-card">
          <div class="noun-card-avatar">${renderAvatar(player.seed, player.name.slice(0, 3))}</div>
          <div class="noun-card-meta">
            <strong>${escapeHtml(player.name)}</strong>
            <span>${escapeHtml(player.selectedDrop || "Garage Kick")}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderLeaderboard(room) {
  const players = room.players.slice(0, 6);
  const topTokens = Math.max(1, players[0]?.totalTokens || 1);

  if (!players.length) {
    elements.leaderboardList.innerHTML =
      '<div class="stats-empty">The leaderboard is waiting for the first burst.</div>';
    return;
  }

  elements.leaderboardList.innerHTML = players
    .map(
      (player, index) => `
        <article class="leader-row">
          <div class="leader-rank">#${index + 1}</div>
          <div class="leader-avatar">${renderAvatar(player.seed, player.name.slice(0, 2))}</div>
          <div class="leader-copy">
            <div class="leader-topline">
              <strong>${escapeHtml(player.name)}</strong>
              <span>${formatCount(player.totalTokens)} DRUM</span>
            </div>
            <div class="leader-subline">
              <span>${escapeHtml(player.selectedDrop || "Garage Kick")}</span>
              <span>${formatCount(player.totalHits)} hits</span>
              <span>best ${formatCount(player.bestCombo || 0)}x</span>
            </div>
            <div class="leader-bar">
              <span style="width:${Math.max(10, (player.totalTokens / topTokens) * 100)}%"></span>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderTrendBoard(room, profile, roomStats) {
  const nextDrop = getNextDrop(profile);
  const dominantMode =
    room.metrics.recentReactions > room.metrics.syncedBursts
      ? "crowd-led"
      : room.metrics.syncedBursts > 0
        ? "combo-led"
        : "idle build";
  const noteLines = [
    `Pulse velocity is ${formatCount(Math.round(roomStats.pulseVelocity))} DRUM per active drummer.`,
    `Right now the room feels ${dominantMode}, with ${formatCount(
      room.metrics.recentReactions,
    )} reaction spikes and ${formatCount(room.metrics.syncedBursts)} synced bursts in the last 45 seconds.`,
    nextDrop
      ? `Your next unlock is ${nextDrop.title}, sitting ${formatCount(
          nextDrop.threshold - profile.lifetimeTokens,
        )} DRUM ahead.`
      : "Your local shelf is fully unlocked, so every new hit is pure flex.",
  ];

  elements.trendTape.textContent = `${formatCount(room.events.length)} / 18`;
  elements.trendPulse.textContent = formatRelativeTime(roomStats.latestPulse?.createdAt || room.updatedAt);
  elements.trendSpread.textContent = `${formatCount(roomStats.uniqueHeads)} heads / ${formatCount(roomStats.uniqueDrops)} drops`;
  elements.trendCombo.textContent = `${formatCount(roomStats.highestCombo)}x`;
  elements.trendNotes.innerHTML = noteLines
    .map((note) => `<p>${escapeHtml(note)}</p>`)
    .join("");
}

function renderEventFeed(room) {
  const events = room.events.slice(0, 8);

  if (!events.length) {
    elements.eventFeed.innerHTML =
      '<div class="stats-empty">The tape is clear right now. New pulses will write the next scene.</div>';
    return;
  }

  elements.eventFeed.innerHTML = events
    .map(
      (event) => `
        <article class="feed-row">
          <div class="feed-avatar">${renderAvatar(event.seed, event.playerName?.slice(0, 2) || "JAM")}</div>
          <div class="feed-copy">
            <div class="feed-topline">
              <strong>${escapeHtml(event.type)}</strong>
              <span>${formatRelativeTime(event.createdAt)}</span>
            </div>
            <p>${escapeHtml(event.message || "Room movement logged.")}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderAll() {
  const roomStats = computeRoomStats(state.room);

  renderHero(state.room, roomStats);
  renderLocalProfile(state.profile);
  renderRoomNouns(state.room, roomStats);
  renderLeaderboard(state.room);
  renderTrendBoard(state.room, state.profile, roomStats);
  renderEventFeed(state.room);
}

async function loadImageData() {
  try {
    const response = await fetch("/data/image-data.json", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    state.imageData = await response.json();
  } catch {
    state.imageData = null;
  }
}

async function loadRoomSnapshot() {
  try {
    const response = await fetch(`/api/jam-room?room=${encodeURIComponent(state.roomId)}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Room request failed with ${response.status}`);
    }

    const snapshot = await response.json();
    state.room = snapshot?.roomId ? snapshot : createEmptyRoom(state.roomId);
  } catch {
    state.room = createEmptyRoom(state.roomId);
  }

  renderAll();
}

function startPolling() {
  window.setInterval(() => {
    loadRoomSnapshot();
  }, POLL_MS);
}

elements.refreshButton.addEventListener("click", () => {
  loadRoomSnapshot();
});

await Promise.all([loadImageData(), loadRoomSnapshot()]);
renderAll();
startPolling();
