import { buildSVG } from "../public/lib/nouns-svg.js";
import {
  DEFAULT_ROOM_ID,
  buildRoomMeta,
  buildRoomPrimaryLine,
  buildRoomSummary,
  computeRoomTelemetry,
  escapeHtml,
  formatCompact,
  formatCount,
  formatMultiplier,
  titleCase,
} from "../shared/drum-jam-telemetry.js";

const STORAGE_KEY = "drum-nouns-jam.v1";
const LAST_ROOM_STORAGE_KEY = "drum-nouns-jam.last-room";
const POLL_MS = 15000;
const DIRECTORY_POLL_MS = 18000;
const ROOM_HEARTBEAT_MS = 12000;
const SURFACE_TICK_MS = 300;
const PULSE_FLUSH_DELAY_MS = 900;
const COMBO_TIMEOUT_MS = 2400;
const LANDING_STAGE_SLOTS = [
  { x: 18, y: 28 },
  { x: 82, y: 28 },
  { x: 18, y: 74 },
  { x: 82, y: 74 },
];
const FEEDBACK_AREA_LABELS = {
  "landing-pad": "Landing pad",
  "live-board": "Live board",
  nouns: "Noun look",
  "drops-mint": "Drops + mint",
  "overall-vibe": "Overall vibe",
};
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
  marqueeAvatar: document.querySelector("#marquee-avatar"),
  marqueeName: document.querySelector("#marquee-name"),
  marqueeIdentity: document.querySelector("#marquee-identity"),
  marqueeRemixButton: document.querySelector("#marquee-remix-button"),
  landingDrumPad: document.querySelector("#landing-drum-pad"),
  landingCrowd: document.querySelector("#landing-crowd"),
  landingGain: document.querySelector("#landing-gain"),
  landingCaption: document.querySelector("#landing-caption"),
  landingPlayerTokens: document.querySelector("#landing-player-tokens"),
  landingCombo: document.querySelector("#landing-combo"),
  landingBestCombo: document.querySelector("#landing-best-combo"),
  landingCrew: document.querySelector("#landing-crew"),
  landingSessionNote: document.querySelector("#landing-session-note"),
  mintRouteLink: document.querySelector("#mint-route-link"),
  trafficKnown: document.querySelector("#traffic-known"),
  trafficLive: document.querySelector("#traffic-live"),
  trafficFeedback: document.querySelector("#traffic-feedback"),
  trafficMints: document.querySelector("#traffic-mints"),
  trafficNote: document.querySelector("#traffic-note"),
  shareRoomButton: document.querySelector("#share-room-button"),
  shareStatusLine: document.querySelector("#share-status-line"),
  marketHotDrop: document.querySelector("#market-hot-drop"),
  marketReadyRoute: document.querySelector("#market-ready-route"),
  marketRecentCount: document.querySelector("#market-recent-count"),
  marketList: document.querySelector("#market-list"),
  feedbackIntro: document.querySelector("#feedback-intro"),
  feedbackForm: document.querySelector("#feedback-form"),
  feedbackArea: document.querySelector("#feedback-area"),
  feedbackNote: document.querySelector("#feedback-note"),
  feedbackSubmitButton: document.querySelector("#feedback-submit-button"),
  feedbackStatus: document.querySelector("#feedback-status"),
  feedbackTotal: document.querySelector("#feedback-total"),
  feedbackTopArea: document.querySelector("#feedback-top-area"),
  feedbackRecentCount: document.querySelector("#feedback-recent-count"),
  feedbackList: document.querySelector("#feedback-list"),
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
  openStageStatus: document.querySelector("#open-stage-status"),
  openStageLiveRooms: document.querySelector("#open-stage-live-rooms"),
  openStagePlayers: document.querySelector("#open-stage-players"),
  openStageSpotlight: document.querySelector("#open-stage-spotlight"),
  openStageList: document.querySelector("#open-stage-list"),
  eventFeed: document.querySelector("#event-feed"),
  stampLine: document.querySelector("#stamp-line"),
};

const headElements = {
  description: document.querySelector("#meta-description"),
  ogTitle: document.querySelector("#meta-og-title"),
  ogDescription: document.querySelector("#meta-og-description"),
  ogUrl: document.querySelector("#meta-og-url"),
  ogImage: document.querySelector("#meta-og-image"),
  ogImageAlt: document.querySelector("#meta-og-image-alt"),
  twitterTitle: document.querySelector("#meta-twitter-title"),
  twitterDescription: document.querySelector("#meta-twitter-description"),
  twitterImage: document.querySelector("#meta-twitter-image"),
  canonical: document.querySelector("#meta-canonical"),
};

const state = {
  roomId: resolveRoomId(),
  profile: readProfile(),
  session: {
    combo: 0,
    bestCombo: 0,
    lastTapAt: 0,
    lastGain: 1,
    pendingHits: 0,
    pendingTokens: 0,
  },
  feedback: {
    total: 0,
    topArea: null,
    entries: [],
    statusMessage: "Tell us what feels fun, clear, or worth coming back for.",
    isSubmitting: false,
  },
  market: {
    total: 0,
    topDrop: null,
    entries: [],
  },
  shareStatus: "Invite the next drummer into this room.",
  room: createEmptyRoom(resolveRoomId()),
  directory: createEmptyRoomDirectory(),
  imageData: null,
};

let pulseFlushTimer;
let pulseInFlight = false;

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

function createEmptyRoomDirectory() {
  return {
    updatedAt: 0,
    spotlightRoomId: "",
    totals: {
      rooms: 0,
      liveRooms: 0,
      activeDrummers: 0,
      participants: 0,
      tokens: 0,
    },
    rooms: [],
  };
}

function createId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
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

function buildDailySpotlightRoomId(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return sanitizeRoomId(`daily-${year}${month}${day}`);
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

function sanitizeRoomDirectory(directory) {
  const fallback = createEmptyRoomDirectory();

  if (!directory || typeof directory !== "object") {
    return fallback;
  }

  return {
    updatedAt: clampNumber(directory.updatedAt, 0, Number.MAX_SAFE_INTEGER),
    spotlightRoomId: sanitizeRoomId(directory.spotlightRoomId || buildDailySpotlightRoomId()),
    totals: {
      rooms: clampNumber(directory.totals?.rooms, 0, 999),
      liveRooms: clampNumber(directory.totals?.liveRooms, 0, 999),
      activeDrummers: clampNumber(directory.totals?.activeDrummers, 0, 9999),
      participants: clampNumber(directory.totals?.participants, 0, 9999),
      tokens: clampNumber(directory.totals?.tokens, 0, 999999999),
    },
    rooms: Array.isArray(directory.rooms)
      ? directory.rooms.map((room) => ({
          roomId: sanitizeRoomId(room?.roomId),
          updatedAt: clampNumber(room?.updatedAt, 0, Number.MAX_SAFE_INTEGER),
          activeCount: clampNumber(room?.activeCount, 0, 999),
          participantCount: clampNumber(room?.participantCount, 0, 999),
          totalTokens: clampNumber(room?.totalTokens, 0, 999999999),
          crewMultiplier: Number(room?.crewMultiplier || 1) || 1,
          recentReactions: clampNumber(room?.recentReactions, 0, 999),
          syncedBursts: clampNumber(room?.syncedBursts, 0, 999),
          highestCombo: clampNumber(room?.highestCombo, 0, 999),
          topPlayerName: sanitizeText(room?.topPlayerName, "", 24),
          topPlayerSeed:
            room?.topPlayerSeed && typeof room.topPlayerSeed === "object"
              ? room.topPlayerSeed
              : null,
          leadTokens: clampNumber(room?.leadTokens, 0, 999999999),
          latestEventMessage: String(room?.latestEventMessage ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 180),
        }))
      : [],
  };
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
      playerId: sanitizeText(parsed?.playerId, createId("player"), 80, /[^a-zA-Z0-9 _-]/g),
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
      playerId: createId("player"),
      name: "Rim Rider",
      seed: null,
      lifetimeTokens: 0,
      lifetimeHits: 0,
      mintedDrops: {},
      selectedDropId: DROP_LIBRARY[0].id,
    };
  }
}

function saveProfile() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        playerId: state.profile.playerId,
        name: state.profile.name,
        seed: state.profile.seed,
        lifetimeTokens: state.profile.lifetimeTokens,
        lifetimeHits: state.profile.lifetimeHits,
        mintedDrops: state.profile.mintedDrops,
        selectedDropId: state.profile.selectedDropId,
      }),
    );
  } catch {
    // Ignore storage failures in private contexts.
  }
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

function formatCountLabel(count, singular, plural) {
  return `${formatCount(count)} ${count === 1 ? singular : plural}`;
}

function humanize(value) {
  return String(value)
    .replace(/^(body|accessory|head|glasses)-/, "")
    .replaceAll("-", " ");
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

function getNextMintableDrop(profile) {
  return getUnlockedDrops(profile).find((drop) => !profile.mintedDrops?.[drop.id]) ?? null;
}

function randomIndex(length) {
  return Math.floor(Math.random() * length);
}

function randomSeed() {
  if (!state.imageData) {
    return {
      background: 0,
      body: 0,
      accessory: 0,
      head: 0,
      glasses: 0,
    };
  }

  return {
    background: randomIndex(state.imageData.bgcolors.length),
    body: randomIndex(state.imageData.images.bodies.length),
    accessory: randomIndex(state.imageData.images.accessories.length),
    head: randomIndex(state.imageData.images.heads.length),
    glasses: randomIndex(state.imageData.images.glasses.length),
  };
}

function getSelectedDropTitle() {
  return getDropById(state.profile.selectedDropId).title;
}

function buildPlayerPayload() {
  return {
    id: state.profile.playerId,
    name: state.profile.name,
    seed: state.profile.seed,
    selectedDrop: getSelectedDropTitle(),
  };
}

function getCurrentCombo(now = Date.now()) {
  if (now - state.session.lastTapAt > COMBO_TIMEOUT_MS) {
    return 0;
  }

  return state.session.combo;
}

function getCrewMultiplierValue() {
  return Number(state.room.metrics?.crewMultiplier || 1);
}

function computeLandingGain(comboValue = getCurrentCombo() + 1) {
  const comboBonus = 1 + Math.min(1.5, Math.floor(comboValue / 4) * 0.16);
  return Math.max(1, Math.round(comboBonus * getCrewMultiplierValue()));
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

function pulseLandingPad() {
  elements.landingDrumPad.classList.remove("is-struck");
  void elements.landingDrumPad.offsetWidth;
  elements.landingDrumPad.classList.add("is-struck");
  window.setTimeout(() => {
    elements.landingDrumPad.classList.remove("is-struck");
  }, 180);
}

function spawnLandingBurst(amount) {
  const burst = document.createElement("span");
  burst.className = "gain-burst";
  burst.textContent = `+${amount} DRUM`;
  burst.style.left = "50%";
  burst.style.top = "50%";
  elements.landingDrumPad.append(burst);
  window.setTimeout(() => {
    burst.remove();
  }, 680);
}

function renderLandingCrowd() {
  const players = (state.room.players || [])
    .filter((player) => player.id !== state.profile.playerId)
    .slice(0, LANDING_STAGE_SLOTS.length);

  if (!players.length) {
    elements.landingCrowd.innerHTML = "";
    return;
  }

  elements.landingCrowd.innerHTML = players
    .map((player, index) => {
      const slot = LANDING_STAGE_SLOTS[index] || LANDING_STAGE_SLOTS[0];

      return `
        <span class="landing-crowd-spot" style="--slot-x:${slot.x}%; --slot-y:${slot.y}%;">
          <span class="landing-crowd-bubble">${renderAvatar(player.seed, player.name.slice(0, 2))}</span>
          <span class="landing-crowd-label">${escapeHtml(player.name)}</span>
        </span>
      `;
    })
    .join("");
}

function renderLandingPlay(roomTelemetry) {
  const combo = getCurrentCombo();
  const nextGain = computeLandingGain(combo + 1);
  const selectedDrop = getDropById(state.profile.selectedDropId);
  const nextDrop = getNextDrop(state.profile);
  const activeSeed = state.profile.seed || state.room.players[0]?.seed || null;
  const roomFootprint =
    roomTelemetry.participantCount > 0
      ? `${formatCountLabel(roomTelemetry.participantCount, "drummer", "drummers")} in room memory.`
      : "No other drummers yet.";

  elements.marqueeAvatar.innerHTML = renderAvatar(activeSeed, state.profile.name.slice(0, 4));
  elements.marqueeName.textContent = state.profile.name;
  elements.marqueeIdentity.textContent = nextDrop
    ? `${formatCount(nextDrop.threshold - state.profile.lifetimeTokens)} DRUM to ${nextDrop.title}. ${roomFootprint}`
    : `All drops unlocked. ${roomFootprint}`;
  elements.landingGain.textContent = `+${state.session.lastGain || nextGain} DRUM`;
  elements.landingCaption.textContent =
    combo > 0
      ? `Combo ${combo}x live. Next hit is worth ${nextGain} DRUM in ${state.roomId}.`
      : `Tap to add ${nextGain} DRUM to ${state.roomId}.`;
  elements.landingPlayerTokens.textContent = formatCount(state.profile.lifetimeTokens);
  elements.landingCombo.textContent = `${combo}x`;
  elements.landingBestCombo.textContent = `${Math.max(state.session.bestCombo, combo)}x`;
  elements.landingCrew.textContent = formatMultiplier(getCrewMultiplierValue());
  elements.landingSessionNote.textContent = nextDrop
    ? `${selectedDrop.title} equipped. ${formatCount(nextDrop.threshold - state.profile.lifetimeTokens)} DRUM to ${nextDrop.title}.`
    : `${selectedDrop.title} equipped. Enter the full jam for crew tools, minting, and the market board.`;
  renderLandingCrowd();
}

function renderHero(room, roomTelemetry) {
  const projectedRoomTotal = (room.totals?.tokens || 0) + state.session.pendingTokens;
  elements.roomBadge.textContent = room.roomId;
  elements.heroHeadline.textContent = buildRoomPrimaryLine(room, roomTelemetry);
  elements.heroSummary.textContent = buildRoomSummary(room, roomTelemetry);
  elements.roomMood.textContent = titleCase(roomTelemetry.roomMood);
  elements.roomTotal.textContent = formatCompact(projectedRoomTotal);
  elements.activeCount.textContent = formatCount(room.metrics.activeCount);
  elements.crewMultiplier.textContent = formatMultiplier(room.metrics.crewMultiplier);
  elements.hypeIndex.textContent = formatCount(roomTelemetry.hypeIndex);
  elements.pulseVelocity.textContent = formatCount(Math.round(roomTelemetry.pulseVelocity));
  elements.signalFill.style.width = `${Math.min(100, Math.max(8, roomTelemetry.hypeIndex / 2.2))}%`;
  elements.enterRoomLink.href = `/jam/?room=${encodeURIComponent(room.roomId)}`;
  elements.stampLine.textContent = formatRelativeTime(room.updatedAt);
}

function renderCommerceBoard(room, roomTelemetry) {
  const localMintCount = Object.keys(state.profile.mintedDrops || {}).length;
  const nextMintableDrop = getNextMintableDrop(state.profile);
  const fallbackHotDrop =
    state.profile.lifetimeTokens > 0
      ? getDropById(state.profile.selectedDropId).title
      : room.players[0]?.selectedDrop || "Garage Kick";
  let trafficNote =
    "Share the room to turn this into a crew and give the mint board something to watch.";

  if (room.metrics.activeCount >= 3) {
    trafficNote = `${formatCount(room.metrics.activeCount)} live drummers are pushing ${formatMultiplier(
      room.metrics.crewMultiplier,
    )} crew energy in ${room.roomId}. This is the moment to send the jam link around.`;
  } else if (roomTelemetry.participantCount > 0) {
    trafficNote = `${formatCount(roomTelemetry.participantCount)} drummer${roomTelemetry.participantCount === 1 ? "" : "s"} have already touched ${room.roomId}. ${formatCount(
      state.market.total,
    )} mint${state.market.total === 1 ? "" : "s"} and ${formatCount(state.feedback.total)} feedback note${state.feedback.total === 1 ? "" : "s"} are feeding the next pass.`;
  }

  elements.mintRouteLink.href = `/jam/?room=${encodeURIComponent(room.roomId)}#mint-panel`;
  elements.trafficKnown.textContent = formatCount(roomTelemetry.participantCount);
  elements.trafficLive.textContent = formatCount(room.metrics.activeCount);
  elements.trafficFeedback.textContent = formatCount(state.feedback.total);
  elements.trafficMints.textContent = formatCount(state.market.total);
  elements.trafficNote.textContent = trafficNote;
  elements.shareStatusLine.textContent = state.shareStatus;
  elements.marketHotDrop.textContent = state.market.topDrop?.label || fallbackHotDrop;
  elements.marketReadyRoute.textContent = nextMintableDrop
    ? `Ready: ${nextMintableDrop.title}`
    : localMintCount
      ? `${formatCount(localMintCount)} saved`
      : "Open mint desk";
  elements.marketRecentCount.textContent = formatCount(state.market.entries.length);

  if (!state.market.entries.length) {
    elements.marketList.innerHTML =
      '<div class="stats-empty">Fresh mint activity will land here once the room starts collecting.</div>';
    return;
  }

  elements.marketList.innerHTML = state.market.entries
    .map((entry) => {
      const compactHash = entry.opHash
        ? `${entry.opHash.slice(0, 6)}...${entry.opHash.slice(-4)}`
        : "pending";
      const actionMarkup = entry.explorerUrl
        ? `<a href="${escapeHtml(entry.explorerUrl)}" target="_blank" rel="noreferrer">View ${escapeHtml(compactHash)}</a>`
        : `<span>${escapeHtml(compactHash)}</span>`;

      return `
        <article class="market-item">
          <div class="market-item-topline">
            <strong>${escapeHtml(entry.itemLabel || entry.dropTitle || "Live mint")}</strong>
            <span>${escapeHtml(formatRelativeTime(entry.createdAt))}</span>
          </div>
          <p>${escapeHtml(entry.playerName || "Rim Rider")} minted in ${escapeHtml(entry.roomId || room.roomId)}.</p>
          <div class="market-item-actions">
            <span class="market-item-badge">${escapeHtml(entry.target === "noun" ? "Noun" : "Drop")}</span>
            ${actionMarkup}
          </div>
        </article>
      `;
    })
    .join("");
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

function buildFallbackOpenStage(roomId) {
  const snapshot = roomId === state.roomId ? state.room : createEmptyRoom(roomId);
  const leader = snapshot.players?.[0] || null;
  const highestCombo = (snapshot.players || []).reduce(
    (highest, player) => Math.max(highest, player.bestCombo || 0),
    0,
  );

  return {
    roomId,
    updatedAt: snapshot.updatedAt || 0,
    activeCount: snapshot.metrics?.activeCount || 0,
    participantCount: snapshot.players?.length || 0,
    totalTokens: snapshot.totals?.tokens || 0,
    crewMultiplier: snapshot.metrics?.crewMultiplier || 1,
    recentReactions: snapshot.metrics?.recentReactions || 0,
    syncedBursts: snapshot.metrics?.syncedBursts || 0,
    highestCombo,
    topPlayerName: leader?.name || "",
    topPlayerSeed: leader?.seed || null,
    leadTokens: leader?.totalTokens || 0,
    latestEventMessage: snapshot.events?.[0]?.message || "",
  };
}

function getVisibleOpenStages() {
  const spotlightRoomId = state.directory.spotlightRoomId || buildDailySpotlightRoomId();
  const roomMap = new Map((state.directory.rooms || []).map((room) => [room.roomId, room]));
  const visibleRooms = [];
  const seen = new Set();

  const pushRoom = (roomId, label) => {
    const normalizedRoomId = sanitizeRoomId(roomId);

    if (!normalizedRoomId || seen.has(normalizedRoomId)) {
      return;
    }

    const room = roomMap.get(normalizedRoomId) || buildFallbackOpenStage(normalizedRoomId);
    visibleRooms.push({
      ...room,
      trafficLabel: label,
    });
    seen.add(normalizedRoomId);
  };

  pushRoom(state.roomId, "Tracking now");
  pushRoom(spotlightRoomId, "Daily spotlight");
  pushRoom(DEFAULT_ROOM_ID, "Global jam");

  (state.directory.rooms || []).forEach((room) => {
    pushRoom(room.roomId, room.activeCount > 0 ? "Live room" : "Open room");
  });

  return visibleRooms.slice(0, 5);
}

function renderOpenStages() {
  if (!elements.openStageList) {
    return;
  }

  const spotlightRoomId = state.directory.spotlightRoomId || buildDailySpotlightRoomId();
  const visibleRooms = getVisibleOpenStages();
  const liveRooms = Math.max(
    state.directory.totals?.liveRooms || 0,
    state.room.metrics?.activeCount ? 1 : 0,
  );
  const liveDrummers = Math.max(
    state.directory.totals?.activeDrummers || 0,
    state.room.metrics?.activeCount || 0,
  );

  elements.openStageStatus.textContent = liveRooms > 0
    ? `${formatCount(liveRooms)} rooms are active right now. Jump into the loudest one or rally people into today's spotlight room.`
    : "No loud rooms yet. Global jam and today's spotlight room are the best places to start the crowd.";
  elements.openStageLiveRooms.textContent = formatCount(liveRooms);
  elements.openStagePlayers.textContent = formatCount(liveDrummers);
  elements.openStageSpotlight.textContent = spotlightRoomId;

  if (!visibleRooms.length) {
    elements.openStageList.innerHTML =
      '<div class="stats-empty">Open the full jam, share a room, and this lobby will start showing movement.</div>';
    return;
  }

  elements.openStageList.innerHTML = visibleRooms
    .map((room) => {
      const isCurrent = room.roomId === state.roomId;
      const roomLeadSeed = room.topPlayerSeed || (isCurrent ? state.profile.seed : null);
      const roomIntensity = Math.max(
        isCurrent ? 20 : 10,
        Math.min(
          100,
          room.activeCount * 24 +
            room.recentReactions * 10 +
            room.syncedBursts * 10 +
            Math.round(room.totalTokens / 20),
        ),
      );
      const roomBadge = room.activeCount > 0
        ? `${room.activeCount} live`
        : room.participantCount > 0
          ? `${room.participantCount} seen`
          : "Fresh room";
      const roomCopy = room.activeCount > 0
        ? `${formatCount(room.totalTokens)} DRUM stacked • crew ${formatMultiplier(room.crewMultiplier)} • ${room.topPlayerName || "First drummer"} leads`
        : room.participantCount > 0
          ? `${formatCount(room.participantCount)} drummers touched this room • best ${formatCount(room.highestCombo)}x`
          : "Start here if you want to gather the next crowd.";
      const roomMeta = room.latestEventMessage
        ? room.latestEventMessage
        : room.roomId === spotlightRoomId
          ? "This room rotates daily so players can collide in the same place."
          : room.roomId === DEFAULT_ROOM_ID
            ? "Always-on public room for quick drop-ins."
            : "Fresh room waiting for its first burst.";

      return `
        <article class="open-stage-card ${isCurrent ? "is-current" : ""}" data-live="${room.activeCount > 0 ? "true" : "false"}">
          <div class="open-stage-card-head">
            <div class="open-stage-card-title">
              <strong>/${escapeHtml(room.roomId)}</strong>
              <span>${escapeHtml(room.trafficLabel)}</span>
            </div>
            <span class="open-stage-card-badge">${escapeHtml(roomBadge)}</span>
          </div>
          <div class="open-stage-card-body">
            <div class="open-stage-card-avatar">${renderAvatar(roomLeadSeed, (room.topPlayerName || room.roomId).slice(0, 3))}</div>
            <div class="open-stage-card-copy">
              <p>${escapeHtml(roomCopy)}</p>
              <div class="leader-bar">
                <span style="width:${roomIntensity}%"></span>
              </div>
              <small>${escapeHtml(roomMeta)}</small>
            </div>
          </div>
          <div class="open-stage-card-actions">
            <a class="${isCurrent ? "ghost-button" : "secondary-button"} button-link" href="/jam/?room=${encodeURIComponent(room.roomId)}">
              ${isCurrent ? "Open full jam" : "Jump in"}
            </a>
            <a class="ghost-button button-link" href="/?room=${encodeURIComponent(room.roomId)}">Watch board</a>
          </div>
        </article>
      `;
    })
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

function renderFeedback() {
  const topAreaLabel = state.feedback.topArea?.label || "Still listening";
  const recentCount = state.feedback.entries.length;

  elements.feedbackIntro.textContent = `Feedback lands as ${state.profile.name}. Tell us what is clicking for you.`;
  elements.feedbackTotal.textContent = formatCount(state.feedback.total);
  elements.feedbackTopArea.textContent = topAreaLabel;
  elements.feedbackRecentCount.textContent = formatCount(recentCount);
  elements.feedbackStatus.textContent = state.feedback.statusMessage;
  elements.feedbackSubmitButton.disabled = state.feedback.isSubmitting;
  elements.feedbackSubmitButton.textContent = state.feedback.isSubmitting
    ? "Sending..."
    : "Send feedback";

  if (!state.feedback.entries.length) {
    elements.feedbackList.innerHTML =
      '<div class="stats-empty">Fresh praise will show up here after the first note.</div>';
    return;
  }

  elements.feedbackList.innerHTML = state.feedback.entries
    .map(
      (entry) => `
        <article class="feedback-item">
          <div class="feedback-item-topline">
            <strong>${escapeHtml(entry.name)}</strong>
            <span>${escapeHtml(entry.areaLabel || FEEDBACK_AREA_LABELS[entry.area] || "Overall vibe")} / ${escapeHtml(formatRelativeTime(entry.createdAt))}</span>
          </div>
          <p>${escapeHtml(entry.note)}</p>
        </article>
      `,
    )
    .join("");
}

function syncRoomUrl(roomId) {
  const url = new URL(window.location.href);

  if (roomId === DEFAULT_ROOM_ID) {
    url.searchParams.delete("room");
  } else {
    url.searchParams.set("room", roomId);
  }

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextUrl !== currentUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
}

function syncDocumentMeta(room) {
  const meta = buildRoomMeta(room, state.roomId || room.roomId || DEFAULT_ROOM_ID);

  document.title = meta.pageTitle;
  headElements.description?.setAttribute("content", meta.description);
  headElements.ogTitle?.setAttribute("content", meta.socialTitle);
  headElements.ogDescription?.setAttribute("content", meta.socialDescription);
  headElements.ogUrl?.setAttribute("content", meta.shareUrl);
  headElements.ogImage?.setAttribute("content", meta.ogImageUrl);
  headElements.ogImageAlt?.setAttribute("content", meta.ogImageAlt);
  headElements.twitterTitle?.setAttribute("content", meta.socialTitle);
  headElements.twitterDescription?.setAttribute("content", meta.socialDescription);
  headElements.twitterImage?.setAttribute("content", meta.ogImageUrl);
  headElements.canonical?.setAttribute("href", meta.shareUrl);
  syncRoomUrl(meta.roomId);
}

async function postRoomAction(action, payload = {}) {
  const response = await fetch("/api/jam-room", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomId: state.roomId,
      action,
      player: buildPlayerPayload(),
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Room update failed with ${response.status}`);
  }

  return response.json();
}

async function loadFeedbackSnapshot() {
  try {
    const response = await fetch("/api/feedback", {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Feedback request failed with ${response.status}`);
    }

    const snapshot = await response.json();
    state.feedback.total = Number(snapshot.total || 0);
    state.feedback.topArea = snapshot.topArea || null;
    state.feedback.entries = Array.isArray(snapshot.entries) ? snapshot.entries : [];

    if (!state.feedback.isSubmitting) {
      state.feedback.statusMessage = state.feedback.total
        ? "We’re tracking what people enjoy most right now."
        : "Tell us what feels fun, clear, or worth coming back for.";
    }
  } catch {
    if (!state.feedback.total) {
      state.feedback.statusMessage = "Feedback is loading a little slowly, but you can still send a note.";
    }
  }

  renderFeedback();
  renderCommerceBoard(state.room, computeRoomTelemetry(state.room));
}

async function loadMintFeedSnapshot() {
  try {
    const response = await fetch("/api/mint-feed", {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Mint feed request failed with ${response.status}`);
    }

    const snapshot = await response.json();
    state.market.total = Number(snapshot.total || 0);
    state.market.topDrop = snapshot.topDrop || null;
    state.market.entries = Array.isArray(snapshot.entries) ? snapshot.entries : [];
  } catch {
    state.market.total = state.market.total || 0;
    state.market.topDrop = state.market.topDrop || null;
    state.market.entries = Array.isArray(state.market.entries) ? state.market.entries : [];
  }

  renderCommerceBoard(state.room, computeRoomTelemetry(state.room));
}

async function submitFeedback(event) {
  event.preventDefault();

  const note = elements.feedbackNote.value.trim();

  if (note.length < 8) {
    state.feedback.statusMessage = "Give us a little more detail so we know what to keep.";
    renderFeedback();
    return;
  }

  state.feedback.isSubmitting = true;
  state.feedback.statusMessage = "Sending your note...";
  renderFeedback();

  try {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: state.profile.name,
        area: elements.feedbackArea.value,
        note,
        roomId: state.roomId,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || "Unable to save feedback right now.");
    }

    state.feedback.total = Number(payload.total || 0);
    state.feedback.topArea = payload.topArea || null;
    state.feedback.entries = Array.isArray(payload.entries) ? payload.entries : [];
    state.feedback.statusMessage = `Thanks. We saved what you’re enjoying about ${FEEDBACK_AREA_LABELS[elements.feedbackArea.value] || "the build"}.`;
    elements.feedbackNote.value = "";
  } catch (error) {
    state.feedback.statusMessage =
      error instanceof Error ? error.message : "Unable to save feedback right now.";
  } finally {
    state.feedback.isSubmitting = false;
    renderFeedback();
    renderCommerceBoard(state.room, computeRoomTelemetry(state.room));
  }
}

async function shareRoomInvite() {
  const inviteUrl = new URL("/jam/", window.location.origin);

  if (state.roomId !== DEFAULT_ROOM_ID) {
    inviteUrl.searchParams.set("room", state.roomId);
  }

  try {
    if (navigator.share) {
      await navigator.share({
        title: "Drum Nouns Jam",
        text: `Join ${state.roomId} and stack DRUM with me.`,
        url: inviteUrl.toString(),
      });
      state.shareStatus = `Shared ${state.roomId}`;
      renderCommerceBoard(state.room, computeRoomTelemetry(state.room));
      return;
    }

    await navigator.clipboard.writeText(inviteUrl.toString());
    state.shareStatus = "Jam invite copied";
  } catch (error) {
    state.shareStatus = error instanceof Error && error.message
      ? `Invite failed: ${error.message}`
      : "Invite failed right now.";
  }

  renderCommerceBoard(state.room, computeRoomTelemetry(state.room));
}

async function joinRoom() {
  try {
    const snapshot = await postRoomAction("join");
    state.room = snapshot?.roomId ? snapshot : state.room;
    renderAll();
  } catch {
    // Keep the landing page responsive even if room presence is unavailable.
  }
}

function schedulePulseFlush(delay = PULSE_FLUSH_DELAY_MS) {
  window.clearTimeout(pulseFlushTimer);
  pulseFlushTimer = window.setTimeout(() => {
    flushPendingPulse();
  }, delay);
}

async function flushPendingPulse(force = false) {
  if (pulseInFlight) {
    return;
  }

  const hits = state.session.pendingHits;
  const tokens = state.session.pendingTokens;

  if (!hits && !force) {
    return;
  }

  pulseInFlight = true;

  try {
    const snapshot = await postRoomAction("pulse", {
      hits,
      tokens,
      combo: Math.max(state.session.bestCombo, getCurrentCombo()),
    });
    state.session.pendingHits = Math.max(0, state.session.pendingHits - hits);
    state.session.pendingTokens = Math.max(0, state.session.pendingTokens - tokens);
    state.room = snapshot?.roomId ? snapshot : state.room;
  } catch {
    // Leave pending hits in memory and retry on the next flush.
  } finally {
    pulseInFlight = false;
    renderAll();

    if (state.session.pendingHits) {
      schedulePulseFlush(1200);
    }
  }
}

function remixLandingProfile() {
  if (!state.imageData) {
    return;
  }

  state.profile.seed = randomSeed();
  saveProfile();
  renderAll();
  joinRoom();
}

function registerLandingHit() {
  const now = Date.now();

  if (now - state.session.lastTapAt > COMBO_TIMEOUT_MS) {
    state.session.combo = 0;
  }

  state.session.combo += 1;
  state.session.bestCombo = Math.max(state.session.bestCombo, state.session.combo);
  state.session.lastTapAt = now;

  const gain = computeLandingGain(state.session.combo);

  state.session.lastGain = gain;
  state.session.pendingHits += 1;
  state.session.pendingTokens += gain;
  state.profile.lifetimeHits += 1;
  state.profile.lifetimeTokens += gain;

  saveProfile();
  renderAll();
  pulseLandingPad();
  spawnLandingBurst(gain);
  schedulePulseFlush();
}

function renderAll() {
  const roomTelemetry = computeRoomTelemetry(state.room);

  renderLandingPlay(roomTelemetry);
  renderHero(state.room, roomTelemetry);
  renderCommerceBoard(state.room, roomTelemetry);
  renderFeedback();
  renderLocalProfile(state.profile);
  renderRoomNouns(state.room, roomTelemetry);
  renderLeaderboard(state.room);
  renderTrendBoard(state.room, state.profile, roomTelemetry);
  renderOpenStages();
  renderEventFeed(state.room);
  syncDocumentMeta(state.room);
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
    if (!state.profile.seed) {
      state.profile.seed = randomSeed();
      saveProfile();
    }
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
    state.room = state.room?.roomId ? state.room : createEmptyRoom(state.roomId);
  }

  renderAll();
}

async function loadRoomDirectory() {
  try {
    const response = await fetch("/api/jam-rooms?limit=5", {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Directory request failed with ${response.status}`);
    }

    state.directory = sanitizeRoomDirectory(await response.json());
  } catch {
    state.directory = state.directory?.rooms?.length ? state.directory : createEmptyRoomDirectory();
  }

  renderOpenStages();
}

function startPolling() {
  window.setInterval(() => {
    loadRoomSnapshot();
  }, POLL_MS);

  window.setInterval(() => {
    loadRoomDirectory();
  }, DIRECTORY_POLL_MS);
}

function startPresenceHeartbeat() {
  window.setInterval(() => {
    joinRoom();
  }, ROOM_HEARTBEAT_MS);
}

function startSurfaceTick() {
  window.setInterval(() => {
    const roomTelemetry = computeRoomTelemetry(state.room);
    renderLandingPlay(roomTelemetry);
    renderHero(state.room, roomTelemetry);
  }, SURFACE_TICK_MS);
}

elements.refreshButton.addEventListener("click", () => {
  loadRoomSnapshot();
  loadRoomDirectory();
  loadFeedbackSnapshot();
  loadMintFeedSnapshot();
});

elements.marqueeRemixButton.addEventListener("click", () => {
  remixLandingProfile();
});

elements.shareRoomButton.addEventListener("click", () => {
  shareRoomInvite();
});

elements.feedbackForm.addEventListener("submit", submitFeedback);

elements.landingDrumPad.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  registerLandingHit();
});

elements.landingDrumPad.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    registerLandingHit();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    flushPendingPulse(true);
    return;
  }

  joinRoom();
  loadRoomSnapshot();
  loadRoomDirectory();
  loadFeedbackSnapshot();
  loadMintFeedSnapshot();
});

await loadImageData();
renderAll();
await joinRoom();
await loadRoomSnapshot();
await loadRoomDirectory();
await loadFeedbackSnapshot();
await loadMintFeedSnapshot();
renderAll();
startPolling();
startPresenceHeartbeat();
startSurfaceTick();
