import { buildSVG } from "../public/lib/nouns-svg.js";

const TEZOS_MINT = {
  contractAddress: "KT1NbqYinUijW68V3fxboo4EzQPFgRcdfaYQ",
  explorerBase: "https://shadownet.tzkt.io",
  networkLabel: "Tezos Shadownet",
  networkType: "shadownet",
  rpcUrl: "https://rpc.shadownet.teztnets.com",
  symbol: "DRUM",
};

const STORAGE_KEY = "drum-nouns-jam.v1";
const LAST_ROOM_STORAGE_KEY = "drum-nouns-jam.last-room";
const ROOM_CACHE_STORAGE_KEY = "drum-nouns-jam.rooms.v1";
const DEFAULT_ROOM_ID = "global-jam";
const COMBO_TIMEOUT_MS = 2400;
const ROOM_POLL_MS = 12000;
const ROOM_HEARTBEAT_MS = 12000;
const DIRECTORY_POLL_MS = 18000;
const ROOM_STREAM_RETRY_MS = 2600;
const PULSE_FLUSH_DELAY_MS = 900;
const ROOM_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ROOM_CACHE_LIMIT = 16;
const CROWD_STAGE_SLOTS = [
  { x: 18, y: 26 },
  { x: 82, y: 26 },
  { x: 16, y: 74 },
  { x: 84, y: 74 },
  { x: 50, y: 15 },
  { x: 50, y: 85 },
];
const DROP_LIBRARY = [
  {
    id: "garage-kick",
    title: "Garage Kick",
    tier: "Starter",
    threshold: 0,
    blurb: "First crate in the room. Warm, punchy, always collectible.",
    power: {
      name: "Backbeat Battery",
      short: "+1 DRUM on every hit",
      detail: "For 10 seconds every hit adds +1 DRUM. Clean, steady, and easy to stack with your combo.",
      durationMs: 10000,
      cooldownMs: 12000,
      activateLabel: "Kick it on",
    },
  },
  {
    id: "cymbal-bloom",
    title: "Cymbal Bloom",
    tier: "Crew",
    threshold: 40,
    blurb: "Unlocked once your taps start opening the room up.",
    power: {
      name: "Bloom Time",
      short: "Combos last 2x longer and hits add +1 DRUM",
      detail: "For 12 seconds your combo timer lasts twice as long and every hit adds +1 DRUM, so it is easier to stay in the pocket.",
      durationMs: 12000,
      cooldownMs: 14000,
      activateLabel: "Open it up",
    },
  },
  {
    id: "laser-tom",
    title: "Laser Tom",
    tier: "Glow",
    threshold: 140,
    blurb: "Sharper hits, brighter noun silhouettes, louder social energy.",
    power: {
      name: "Laser Burst",
      short: "Every 4th hit fires +4 DRUM",
      detail: "For 10 seconds every 4th hit fires a laser burst worth +4 DRUM. You can feel the spike instead of guessing at it.",
      durationMs: 10000,
      cooldownMs: 18000,
      activateLabel: "Fire lasers",
    },
  },
  {
    id: "street-parade",
    title: "Street Parade",
    tier: "Rare",
    threshold: 320,
    blurb: "A full-room drop for drummers who keep the groove moving.",
    power: {
      name: "Crowd Lift",
      short: "+1 DRUM per other live drummer, up to +4",
      detail: "For 14 seconds you gain +1 DRUM for each other live drummer in the room, up to +4. It gets stronger when the room looks busy.",
      durationMs: 14000,
      cooldownMs: 18000,
      activateLabel: "Call the parade",
    },
  },
  {
    id: "moon-riser",
    title: "Moon Riser",
    tier: "Legend",
    threshold: 700,
    blurb: "High-score collectible for the players carrying the whole jam.",
    power: {
      name: "Moon Mode",
      short: "Double every hit",
      detail: "For 8 seconds every hit is doubled. Short window, huge payoff, very easy to understand.",
      durationMs: 8000,
      cooldownMs: 22000,
      activateLabel: "Lift off",
    },
  },
];
const MINT_TARGETS = {
  DROP: "drop",
  NOUN: "noun",
};
const NAME_FIRST_WORDS = [
  "Neon",
  "Kick",
  "Rim",
  "Boom",
  "Laser",
  "Groove",
  "Night",
  "Pulse",
  "Turbo",
  "Echo",
  "Velvet",
  "Moon",
];
const NAME_LAST_WORDS = [
  "Rider",
  "Parade",
  "Driver",
  "Breaker",
  "Orbit",
  "Stomper",
  "Captain",
  "Sprite",
  "Runner",
  "Groover",
  "Beacon",
  "Shaker",
];
const NOUN_TRAITS = [
  {
    key: "background",
    label: "Background",
    count: () => imageData.bgcolors.length,
  },
  {
    key: "body",
    label: "Body",
    count: () => imageData.images.bodies.length,
  },
  {
    key: "accessory",
    label: "Accessory",
    count: () => imageData.images.accessories.length,
  },
  {
    key: "head",
    label: "Head",
    count: () => imageData.images.heads.length,
  },
  {
    key: "glasses",
    label: "Glasses",
    count: () => imageData.images.glasses.length,
  },
];
const SUPPORT_PANEL_IDS = [
  "noun-panel",
  "collection-panel",
  "leaderboard-panel",
  "crew-panel",
  "social-panel",
  "mint-panel",
];
const ROOM_GOAL_MILESTONES = [2, 3, 5];

const elements = {
  roomInput: document.querySelector("#room-input"),
  shareRoomButton: document.querySelector("#share-room-button"),
  playerAvatar: document.querySelector("#player-avatar"),
  playerNameInput: document.querySelector("#player-name-input"),
  identityLine: document.querySelector("#identity-line"),
  randomizeNameButton: document.querySelector("#randomize-name-button"),
  randomizeAvatarButton: document.querySelector("#randomize-avatar-button"),
  randomizeProfileButton: document.querySelector("#randomize-profile-button"),
  soundToggleButton: document.querySelector("#sound-toggle-button"),
  nounStylePill: document.querySelector("#noun-style-pill"),
  nounTraitList: document.querySelector("#noun-trait-list"),
  nounPanelPreview: document.querySelector("#noun-panel-preview"),
  nounGlanceStage: document.querySelector("#noun-glance-stage"),
  nounGlanceHead: document.querySelector("#noun-glance-head"),
  nounGlanceDrop: document.querySelector("#noun-glance-drop"),
  playerTokenCount: document.querySelector("#player-token-count"),
  roomTokenCount: document.querySelector("#room-token-count"),
  comboCount: document.querySelector("#combo-count"),
  crewMultiplier: document.querySelector("#crew-multiplier"),
  crowdPresence: document.querySelector("#crowd-presence"),
  jamStatus: document.querySelector("#jam-status"),
  syncMeterFill: document.querySelector("#sync-meter-fill"),
  jamGuide: document.querySelector(".jam-guide"),
  jamGuidePill: document.querySelector("#jam-guide-pill"),
  guideUnlockTitle: document.querySelector("#guide-unlock-title"),
  guideUnlockCopy: document.querySelector("#guide-unlock-copy"),
  guideUnlockProgress: document.querySelector("#guide-unlock-progress"),
  guideUnlockButton: document.querySelector("#guide-unlock-button"),
  guideRaceTitle: document.querySelector("#guide-race-title"),
  guideRaceCopy: document.querySelector("#guide-race-copy"),
  guideRaceProgress: document.querySelector("#guide-race-progress"),
  guideRaceButton: document.querySelector("#guide-race-button"),
  guideRoomTitle: document.querySelector("#guide-room-title"),
  guideRoomCopy: document.querySelector("#guide-room-copy"),
  guideRoomProgress: document.querySelector("#guide-room-progress"),
  guideRoomButton: document.querySelector("#guide-room-button"),
  trafficStatusPill: document.querySelector("#traffic-status-pill"),
  trafficLiveRooms: document.querySelector("#traffic-live-rooms"),
  trafficActiveDrummers: document.querySelector("#traffic-active-drummers"),
  trafficSpotlightRoom: document.querySelector("#traffic-spotlight-room"),
  trafficCurrentRoom: document.querySelector("#traffic-current-room"),
  trafficNote: document.querySelector("#traffic-note"),
  trafficRoomList: document.querySelector("#traffic-room-list"),
  drumPad: document.querySelector("#drum-pad"),
  crowdStage: document.querySelector("#crowd-stage"),
  drumGain: document.querySelector("#drum-gain"),
  comboCaption: document.querySelector("#combo-caption"),
  returnToDrumButton: document.querySelector("#return-to-drum-button"),
  powerUpStatusPill: document.querySelector("#power-up-status-pill"),
  powerUpName: document.querySelector("#power-up-name"),
  powerUpDescription: document.querySelector("#power-up-description"),
  activatePowerUpButton: document.querySelector("#activate-power-up-button"),
  powerUpMeterFill: document.querySelector("#power-up-meter-fill"),
  powerUpNote: document.querySelector("#power-up-note"),
  supportRail: document.querySelector(".support-rail"),
  unlockShelf: document.querySelector("#unlock-shelf"),
  collectionStatus: document.querySelector("#collection-status"),
  collectionPanelPreview: document.querySelector("#collection-panel-preview"),
  collectionGlanceUnlocked: document.querySelector("#collection-glance-unlocked"),
  collectionGlanceEquipped: document.querySelector("#collection-glance-equipped"),
  collectionGlanceMinted: document.querySelector("#collection-glance-minted"),
  leaderboardRank: document.querySelector("#leaderboard-rank"),
  leaderboardStatus: document.querySelector("#leaderboard-status"),
  leaderboardList: document.querySelector("#leaderboard-list"),
  leaderboardPanelPreview: document.querySelector("#leaderboard-panel-preview"),
  leaderboardGlanceGap: document.querySelector("#leaderboard-glance-gap"),
  leaderboardGlanceRoom: document.querySelector("#leaderboard-glance-room"),
  leaderboardGlanceBest: document.querySelector("#leaderboard-glance-best"),
  crewCount: document.querySelector("#crew-count"),
  roomSyncStatus: document.querySelector("#room-sync-status"),
  roomStatusLine: document.querySelector("#room-status-line"),
  crewList: document.querySelector("#crew-list"),
  crewPanelPreview: document.querySelector("#crew-panel-preview"),
  crewGlanceLive: document.querySelector("#crew-glance-live"),
  crewGlanceKnown: document.querySelector("#crew-glance-known"),
  crewGlanceBonus: document.querySelector("#crew-glance-bonus"),
  shareStatus: document.querySelector("#share-status"),
  feedList: document.querySelector("#feed-list"),
  socialPanelPreview: document.querySelector("#social-panel-preview"),
  socialGlanceMoments: document.querySelector("#social-glance-moments"),
  socialGlanceFresh: document.querySelector("#social-glance-fresh"),
  socialGlanceMood: document.querySelector("#social-glance-mood"),
  selectedDropPill: document.querySelector("#selected-drop-pill"),
  mintPanelPreview: document.querySelector("#mint-panel-preview"),
  mintGlanceMode: document.querySelector("#mint-glance-mode"),
  mintGlanceWallet: document.querySelector("#mint-glance-wallet"),
  mintGlanceSaved: document.querySelector("#mint-glance-saved"),
  walletButton: document.querySelector("#wallet-button"),
  disconnectWalletButton: document.querySelector("#disconnect-wallet-button"),
  walletStatus: document.querySelector("#wallet-status-line"),
  walletAddress: document.querySelector("#wallet-address"),
  walletBalance: document.querySelector("#wallet-balance"),
  networkName: document.querySelector("#network-name"),
  contractAddress: document.querySelector("#contract-address"),
  mintDropTargetButton: document.querySelector("#mint-drop-target-button"),
  mintNounTargetButton: document.querySelector("#mint-noun-target-button"),
  mintTargetNote: document.querySelector("#mint-target-note"),
  mintedAssetStatus: document.querySelector("#minted-asset-status"),
  tokenName: document.querySelector("#token-name-input"),
  tokenDescription: document.querySelector("#token-description-input"),
  mintButton: document.querySelector("#mint-button"),
  mintStatus: document.querySelector("#mint-status-line"),
  mintResult: document.querySelector("#mint-result-line"),
  nounImageLink: document.querySelector("#noun-image-link"),
  tokenMetadataLink: document.querySelector("#token-metadata-link"),
  downloadSvgButton: document.querySelector("#download-svg-button"),
  downloadMetadataButton: document.querySelector("#download-metadata-button"),
};

const reactionButtons = [...document.querySelectorAll(".reaction-button")];
const supportJumpLinks = [...document.querySelectorAll("[data-support-jump]")];
const supportPanels = [...document.querySelectorAll("[data-support-panel]")];
const supportToggleButtons = [...document.querySelectorAll("[data-support-toggle]")];

let imageData;
let tezosSdkPromise;
let tezosSdk;
let tezosToolkit;
let walletInstance;
let connectedAddress = "";
let connectedBalance = "";
let walletBusy = false;
let mintBusy = false;
let walletStatusMessage = "";
let mintStatusMessage = "";
let mintResultMarkup = "";
let imageDataLoaded = false;
let pulseFlushTimer;
let roomPollTimer;
let roomHeartbeatTimer;
let roomDirectoryTimer;
let roomEventSource;
let roomStreamRetryTimer;
let comboTimer;
let pulseInFlight = false;
let presenceInFlight = false;
let nameSyncTimer;
let appearanceSyncTimer;
let supportPanelObserver;
let drumReturnObserver;

function createPowerState() {
  return {
    activeDropId: "",
    activeUntil: 0,
    cooldowns: {},
    hitCounter: 0,
  };
}

function isMobileViewport() {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 760px)").matches;
}

function createDefaultSupportPanelState() {
  return Object.fromEntries(
    SUPPORT_PANEL_IDS.map((panelId) => [
      panelId,
      isMobileViewport() ? !["noun-panel", "collection-panel"].includes(panelId) : false,
    ]),
  );
}

function sanitizeSupportPanelState(supportPanelState) {
  const defaults = createDefaultSupportPanelState();

  SUPPORT_PANEL_IDS.forEach((panelId) => {
    if (typeof supportPanelState?.[panelId] === "boolean") {
      defaults[panelId] = supportPanelState[panelId];
    }
  });

  return defaults;
}

const state = {
  profile: {
    playerId: "",
    name: "",
    seed: null,
    lifetimeTokens: 0,
    lifetimeHits: 0,
    mintedDrops: {},
    mintTarget: MINT_TARGETS.DROP,
    selectedDropId: DROP_LIBRARY[0].id,
    soundEnabled: true,
  },
  session: {
    combo: 0,
    bestCombo: 0,
    lastTapAt: 0,
    lastGain: 1,
    pendingHits: 0,
    pendingTokens: 0,
    tokenNameCustom: false,
    tokenDescriptionCustom: false,
  },
  power: createPowerState(),
  roomId: DEFAULT_ROOM_ID,
  room: createEmptyRoom(DEFAULT_ROOM_ID),
  directory: createEmptyRoomDirectory(),
  collab: {
    hasHydratedRoom: false,
    seenEventIds: [],
  },
  ui: {
    supportPanels: createDefaultSupportPanelState(),
  },
  roomSyncLabel: "Syncing...",
  shareStatus: "Invite the room",
};

function createEmptyRoom(roomId) {
  return {
    roomId,
    totals: {
      tokens: 0,
      hits: 0,
    },
    metrics: {
      activeCount: 0,
      crewMultiplier: 1,
      recentReactions: 0,
      syncedBursts: 0,
    },
    players: [],
    events: [],
    sequence: 0,
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

function trimText(value, fallback, maxLength = 160) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  return (normalized || fallback).slice(0, maxLength);
}

function sanitizeMintTarget(value) {
  return value === MINT_TARGETS.NOUN ? MINT_TARGETS.NOUN : MINT_TARGETS.DROP;
}

function readLastRoomId() {
  try {
    return sanitizeRoomId(window.localStorage.getItem(LAST_ROOM_STORAGE_KEY));
  } catch {
    return DEFAULT_ROOM_ID;
  }
}

function persistRoomId(roomId) {
  try {
    window.localStorage.setItem(LAST_ROOM_STORAGE_KEY, sanitizeRoomId(roomId));
  } catch {
    // Ignore storage failures in private browsing contexts.
  }
}

function clampNumber(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const numeric = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(numeric) || numeric < 0) {
    return fallback;
  }

  return Math.min(numeric, max);
}

function sanitizePowerState(powerState) {
  const cooldowns = {};

  DROP_LIBRARY.forEach((drop) => {
    const cooldownUntil = clampNumber(
      powerState?.cooldowns?.[drop.id],
      0,
      Number.MAX_SAFE_INTEGER,
    );

    if (cooldownUntil > 0) {
      cooldowns[drop.id] = cooldownUntil;
    }
  });

  return {
    activeDropId: sanitizeText(powerState?.activeDropId, "", 24),
    activeUntil: clampNumber(powerState?.activeUntil, 0, Number.MAX_SAFE_INTEGER),
    cooldowns,
    hitCounter: clampNumber(powerState?.hitCounter, 0, 9999),
  };
}

function humanize(value) {
  return value
    .replace(/^(body|accessory|head|glasses)-/, "")
    .replaceAll("-", " ");
}

function compactAddress(value) {
  if (!value) {
    return "Not connected";
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatMultiplier(value) {
  return `${Number(value || 1).toFixed(2)}x`;
}

function formatSecondsLeft(durationMs) {
  return `${Math.max(1, Math.ceil(durationMs / 1000))}s`;
}

function formatTimeAgo(timestamp) {
  if (!timestamp) {
    return "now";
  }

  const delta = Math.max(0, Date.now() - timestamp);

  if (delta < 8000) {
    return "now";
  }

  if (delta < 60000) {
    return `${Math.round(delta / 1000)}s ago`;
  }

  if (delta < 3600000) {
    return `${Math.round(delta / 60000)}m ago`;
  }

  return `${Math.round(delta / 3600000)}h ago`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeStoredSeed(seed) {
  if (imageDataLoaded) {
    return normalizeSeed(seed);
  }

  return {
    background: clampNumber(seed?.background, 0, 1),
    body: clampNumber(seed?.body, 0, 999),
    accessory: clampNumber(seed?.accessory, 0, 999),
    head: clampNumber(seed?.head, 0, 999),
    glasses: clampNumber(seed?.glasses, 0, 999),
  };
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
              ? normalizeStoredSeed(room.topPlayerSeed)
              : null,
          leadTokens: clampNumber(room?.leadTokens, 0, 999999999),
          latestEventType: sanitizeText(room?.latestEventType, "", 24),
          latestEventMessage: trimText(room?.latestEventMessage, "", 180),
          score: clampNumber(room?.score, 0, 999999),
        }))
      : [],
  };
}

function sanitizeStoredRoomSnapshot(snapshot, expectedRoomId) {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const roomId = sanitizeRoomId(snapshot.roomId || expectedRoomId || DEFAULT_ROOM_ID);

  if (expectedRoomId && roomId !== sanitizeRoomId(expectedRoomId)) {
    return null;
  }

  return {
    roomId,
    totals: {
      tokens: clampNumber(snapshot.totals?.tokens, 0, 999999999),
      hits: clampNumber(snapshot.totals?.hits, 0, 999999999),
    },
    metrics: {
      activeCount: clampNumber(snapshot.metrics?.activeCount, 0, 9999),
      crewMultiplier: Number(
        Math.max(1, Math.min(9.99, Number(snapshot.metrics?.crewMultiplier || 1))).toFixed(2),
      ),
      recentReactions: clampNumber(snapshot.metrics?.recentReactions, 0, 9999),
      syncedBursts: clampNumber(snapshot.metrics?.syncedBursts, 0, 9999),
    },
    players: Array.isArray(snapshot.players)
      ? snapshot.players
          .slice(0, 24)
          .map((player) => ({
            id: trimText(player?.id, createId("player"), 80),
            name: trimText(player?.name, "Rim Rider", 24),
            seed: normalizeStoredSeed(player?.seed),
            selectedDrop: trimText(player?.selectedDrop, "Garage Kick", 32),
            totalHits: clampNumber(player?.totalHits, 0, 999999999),
            totalTokens: clampNumber(player?.totalTokens, 0, 999999999),
            bestCombo: clampNumber(player?.bestCombo, 0, 9999),
            lastSeenAt: clampNumber(player?.lastSeenAt, Date.now(), Number.MAX_SAFE_INTEGER),
            lastBeatAt: clampNumber(player?.lastBeatAt, 0, Number.MAX_SAFE_INTEGER),
            isActive: Boolean(player?.isActive),
          }))
          .sort((left, right) => right.totalTokens - left.totalTokens)
      : [],
    events: Array.isArray(snapshot.events)
      ? snapshot.events.slice(0, 18).map((event, index) => ({
          id: trimText(event?.id, `${roomId}-event-${index}`, 80),
          type: trimText(event?.type, "pulse", 24).toLowerCase(),
          playerId: trimText(event?.playerId, "guest", 80),
          playerName: trimText(event?.playerName, "Rim Rider", 24),
          seed: normalizeStoredSeed(event?.seed),
          selectedDrop: trimText(event?.selectedDrop, "Garage Kick", 32),
          hits: clampNumber(event?.hits, 0, 99999),
          tokens: clampNumber(event?.tokens, 0, 999999999),
          combo: clampNumber(event?.combo, 0, 9999),
          reaction: trimText(event?.reaction, "", 16).toUpperCase(),
          message: trimText(event?.message, "Room memory restored.", 180),
          createdAt: clampNumber(event?.createdAt, Date.now(), Number.MAX_SAFE_INTEGER),
        }))
      : [],
    sequence: clampNumber(snapshot.sequence, 0, 999999999),
    updatedAt: clampNumber(snapshot.updatedAt, Date.now(), Number.MAX_SAFE_INTEGER),
  };
}

function loadRoomCacheEntries() {
  try {
    const raw = window.localStorage.getItem(ROOM_CACHE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    const now = Date.now();

    if (!parsed || typeof parsed !== "object") {
      return [];
    }

    return Object.entries(parsed)
      .map(([roomId, entry]) => {
        const savedAt = clampNumber(entry?.savedAt, 0, Number.MAX_SAFE_INTEGER);
        const snapshot = sanitizeStoredRoomSnapshot(entry?.snapshot, roomId);

        if (!snapshot || !savedAt || now - savedAt > ROOM_CACHE_TTL_MS) {
          return null;
        }

        return [roomId, { savedAt, snapshot }];
      })
      .filter(Boolean)
      .sort((left, right) => right[1].savedAt - left[1].savedAt)
      .slice(0, ROOM_CACHE_LIMIT);
  } catch {
    return [];
  }
}

function persistRoomCacheEntries(entries) {
  try {
    window.localStorage.setItem(ROOM_CACHE_STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Ignore storage failures in private browsing contexts.
  }
}

function saveRoomSnapshotToCache(snapshot) {
  const normalized = sanitizeStoredRoomSnapshot(snapshot);

  if (!normalized) {
    return;
  }

  const nextEntries = [
    [
      normalized.roomId,
      {
        savedAt: Date.now(),
        snapshot: normalized,
      },
    ],
    ...loadRoomCacheEntries().filter(([roomId]) => roomId !== normalized.roomId),
  ].slice(0, ROOM_CACHE_LIMIT);

  persistRoomCacheEntries(nextEntries);
}

function loadRoomSnapshotFromCache(roomId) {
  const normalizedRoomId = sanitizeRoomId(roomId);
  const entries = loadRoomCacheEntries();
  persistRoomCacheEntries(entries);
  return entries.find(([cachedRoomId]) => cachedRoomId === normalizedRoomId)?.[1]?.snapshot || null;
}

function randomIndex(length) {
  return Math.floor(Math.random() * length);
}

function wrapIndex(value, size) {
  if (!size) {
    return 0;
  }

  return ((value % size) + size) % size;
}

function normalizeSeed(seed) {
  if (!imageDataLoaded) {
    return seed;
  }

  return {
    background: clampNumber(seed?.background, 0, imageData.bgcolors.length - 1),
    body: clampNumber(seed?.body, 0, imageData.images.bodies.length - 1),
    accessory: clampNumber(seed?.accessory, 0, imageData.images.accessories.length - 1),
    head: clampNumber(seed?.head, 0, imageData.images.heads.length - 1),
    glasses: clampNumber(seed?.glasses, 0, imageData.images.glasses.length - 1),
  };
}

function randomSeed() {
  return {
    background: randomIndex(imageData.bgcolors.length),
    body: randomIndex(imageData.images.bodies.length),
    accessory: randomIndex(imageData.images.accessories.length),
    head: randomIndex(imageData.images.heads.length),
    glasses: randomIndex(imageData.images.glasses.length),
  };
}

function buildRandomPlayerName() {
  return sanitizeName(
    `${NAME_FIRST_WORDS[randomIndex(NAME_FIRST_WORDS.length)]} ${NAME_LAST_WORDS[randomIndex(NAME_LAST_WORDS.length)]}`,
  );
}

function buildSeedSearch(seed, extras = {}) {
  const params = new URLSearchParams();

  Object.entries(seed).forEach(([key, value]) => {
    params.set(key, String(value));
  });

  Object.entries(extras).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const stringValue = String(value).trim();
    if (stringValue) {
      params.set(key, stringValue);
    }
  });

  return params;
}

function buildNoun(seed) {
  const resolvedSeed = normalizeSeed(seed);
  const parts = [
    imageData.images.bodies[resolvedSeed.body],
    imageData.images.accessories[resolvedSeed.accessory],
    imageData.images.heads[resolvedSeed.head],
    imageData.images.glasses[resolvedSeed.glasses],
  ];

  return {
    seed: resolvedSeed,
    svg: buildSVG(parts, imageData.palette, imageData.bgcolors[resolvedSeed.background]),
    labels: {
      background: resolvedSeed.background === 0 ? "Cool Grey" : "Warm Grey",
      body: humanize(parts[0].filename),
      accessory: humanize(parts[1].filename),
      head: humanize(parts[2].filename),
      glasses: humanize(parts[3].filename),
    },
  };
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function buildSeedVariant(seed, variantKey) {
  const resolvedSeed = normalizeSeed(seed);

  if (!imageDataLoaded) {
    return resolvedSeed;
  }

  const hash = hashString(String(variantKey || "variant"));

  return {
    background: wrapIndex(resolvedSeed.background + 1 + (hash % 5), imageData.bgcolors.length),
    body: wrapIndex(resolvedSeed.body + 1 + ((hash >>> 3) % 11), imageData.images.bodies.length),
    accessory: wrapIndex(
      resolvedSeed.accessory + 2 + ((hash >>> 7) % 13),
      imageData.images.accessories.length,
    ),
    head: wrapIndex(resolvedSeed.head + 3 + ((hash >>> 11) % 17), imageData.images.heads.length),
    glasses: wrapIndex(
      resolvedSeed.glasses + 1 + ((hash >>> 15) % 9),
      imageData.images.glasses.length,
    ),
  };
}

function getCurrentNoun() {
  return buildNoun(state.profile.seed);
}

function findDropById(dropId) {
  return DROP_LIBRARY.find((drop) => drop.id === dropId) || null;
}

function getDropById(dropId) {
  return findDropById(dropId) || DROP_LIBRARY[0];
}

function isDropUnlocked(drop) {
  return state.profile.lifetimeTokens >= drop.threshold;
}

function getUnlockedDrops() {
  return DROP_LIBRARY.filter(isDropUnlocked);
}

function ensureSelectedDrop() {
  const selected = getDropById(state.profile.selectedDropId);

  if (isDropUnlocked(selected)) {
    return selected;
  }

  const unlocked = getUnlockedDrops();
  const fallback = unlocked[unlocked.length - 1] || DROP_LIBRARY[0];
  state.profile.selectedDropId = fallback.id;
  return fallback;
}

function getSelectedDrop() {
  return ensureSelectedDrop();
}

function normalizePowerState(now = Date.now()) {
  if (!findDropById(state.power.activeDropId) || state.power.activeUntil <= now) {
    state.power.activeDropId = "";
    state.power.activeUntil = 0;
    state.power.hitCounter = 0;
  }

  Object.entries(state.power.cooldowns).forEach(([dropId, cooldownUntil]) => {
    if (!findDropById(dropId) || cooldownUntil <= now) {
      delete state.power.cooldowns[dropId];
    }
  });

  return state.power;
}

function clearActivePower() {
  state.power.activeDropId = "";
  state.power.activeUntil = 0;
  state.power.hitCounter = 0;
}

function getActivePowerDrop(now = Date.now()) {
  normalizePowerState(now);
  return state.power.activeDropId ? getDropById(state.power.activeDropId) : null;
}

function getComboTimeoutMs(now = Date.now()) {
  return getActivePowerDrop(now)?.id === "cymbal-bloom" ? COMBO_TIMEOUT_MS * 2 : COMBO_TIMEOUT_MS;
}

function getPowerStatus(dropId = getSelectedDrop().id, now = Date.now()) {
  normalizePowerState(now);
  const drop = getDropById(dropId);

  if (!isDropUnlocked(drop)) {
    return {
      kind: "locked",
      label: `Unlock at ${formatCount(drop.threshold)} DRUM`,
      remainingMs: 0,
      unlockRemaining: Math.max(0, drop.threshold - state.profile.lifetimeTokens),
    };
  }

  if (state.power.activeDropId === drop.id && state.power.activeUntil > now) {
    return {
      kind: "live",
      label: `Live for ${formatSecondsLeft(state.power.activeUntil - now)}`,
      remainingMs: state.power.activeUntil - now,
      unlockRemaining: 0,
    };
  }

  const cooldownUntil = state.power.cooldowns[drop.id] || 0;

  if (cooldownUntil > now) {
    return {
      kind: "cooldown",
      label: `Cooling for ${formatSecondsLeft(cooldownUntil - now)}`,
      remainingMs: cooldownUntil - now,
      cooldownMs: cooldownUntil - now,
      unlockRemaining: 0,
    };
  }

  return {
    kind: "ready",
    label: "Ready now",
    remainingMs: 0,
    unlockRemaining: 0,
  };
}

function buildDefaultTokenName() {
  const context = buildMintContext();

  if (context.target === MINT_TARGETS.NOUN) {
    return `${state.profile.name} / ${context.noun.labels.head} Noun`;
  }

  return `${context.drop.title} / ${state.profile.name} / ${context.noun.labels.head}`;
}

function buildDefaultTokenDescription() {
  const context = buildMintContext();
  const { drop, noun } = context;

  if (context.target === MINT_TARGETS.NOUN) {
    return `A Drum Nouns Jam noun collectible for ${state.profile.name} in room ${state.roomId}, featuring a ${noun.labels.head} head, ${noun.labels.accessory} accessory, ${noun.labels.body} body, and ${noun.labels.glasses} glasses. Minted with ${drop.title} equipped after generating ${formatCount(state.profile.lifetimeTokens)} DRUM and reaching a best combo of ${state.session.bestCombo}.`;
  }

  return `A Drum Nouns Jam drop collectible for ${state.profile.name} in room ${state.roomId}. Built with a ${noun.labels.head} head, ${noun.labels.accessory} accessory, ${noun.labels.body} body, and ${noun.labels.glasses} glasses after generating ${formatCount(state.profile.lifetimeTokens)} DRUM with ${drop.title} equipped.`;
}

function buildNounImageUrl(seed) {
  const url = new URL("/api/noun", window.location.origin);
  url.search = buildSeedSearch(seed).toString();
  return url.toString();
}

function getTokenName() {
  return elements.tokenName.value.trim() || buildDefaultTokenName();
}

function getTokenDescription() {
  return elements.tokenDescription.value.trim() || buildDefaultTokenDescription();
}

function buildTokenMetadataUrl(seed) {
  const context = buildMintContext(seed);
  const drop = context.drop;
  const url = new URL("/api/token-metadata", window.location.origin);
  url.search = buildSeedSearch(seed, {
    kind: context.target,
    symbol: context.symbol,
    name: getTokenName(),
    description: getTokenDescription(),
    room: state.roomId,
    player: state.profile.name,
    drop: drop.title,
    tier: drop.tier,
    score: state.profile.lifetimeTokens,
    combo: state.session.bestCombo,
  }).toString();
  return url.toString();
}

function buildNounMintKey(seed = getCurrentNoun().seed) {
  const resolvedSeed = normalizeSeed(seed);

  return `noun:${resolvedSeed.background}-${resolvedSeed.body}-${resolvedSeed.accessory}-${resolvedSeed.head}-${resolvedSeed.glasses}`;
}

function buildMintContext(seed = getCurrentNoun().seed, mintTarget = state.profile.mintTarget) {
  const target = sanitizeMintTarget(mintTarget);
  const noun = buildNoun(seed);
  const drop = getSelectedDrop();

  if (target === MINT_TARGETS.NOUN) {
    return {
      target,
      noun,
      drop,
      symbol: "NOUN",
      pillLabel: `${noun.labels.head} noun`,
      buttonLabel: "Mint noun",
      targetNote: `Mint your live noun avatar with ${drop.title} equipped and the current room stats baked in.`,
      mintedKey: buildNounMintKey(seed),
      mintedLabel: "noun",
      disconnectedStatus: "Connect a Tezos wallet to collect your current noun.",
      connectedStatus: `Wallet connected on ${TEZOS_MINT.networkLabel}. Ready to mint your current noun.`,
      readyStatus: "Wallet ready. Review the noun metadata, then mint.",
      prepareStatus: `Preparing ${state.profile.name}'s ${noun.labels.head} noun for mint...`,
      approvalStatus: "Approve the noun mint in your wallet.",
      successStatus: `${noun.labels.head} noun confirmed on ${TEZOS_MINT.networkLabel}.`,
    };
  }

  return {
    target,
    noun,
    drop,
    symbol: TEZOS_MINT.symbol,
    pillLabel: drop.title,
    buttonLabel: "Mint DRUM drop",
    targetNote: `Mint the equipped ${drop.title} collectible using your current noun art and room progress.`,
    mintedKey: drop.id,
    mintedLabel: "drop",
    disconnectedStatus: "Connect a Tezos wallet to collect your current DRUM drop.",
    connectedStatus: `Wallet connected on ${TEZOS_MINT.networkLabel}. Ready to mint the equipped DRUM drop.`,
    readyStatus: "Wallet ready. Review the DRUM metadata, then mint.",
    prepareStatus: `Preparing ${drop.title} for mint...`,
    approvalStatus: "Approve the DRUM mint in your wallet.",
    successStatus: `${drop.title} confirmed on ${TEZOS_MINT.networkLabel}.`,
  };
}

function resetMintMessaging(clearResult = false) {
  const context = buildMintContext();

  walletStatusMessage = connectedAddress ? context.connectedStatus : context.disconnectedStatus;
  mintStatusMessage = connectedAddress ? context.readyStatus : context.disconnectedStatus;

  if (clearResult) {
    mintResultMarkup = "";
  }
}

function triggerDownload(url, filename) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noreferrer";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function formatError(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error ?? "Unknown error");
}

function createFilenameStem() {
  const context = buildMintContext();
  const targetStem = context.target === MINT_TARGETS.NOUN
    ? `${context.target}-${context.noun.labels.head}`
    : `${context.target}-${context.drop.id}`;
  return sanitizeText(
    `${state.profile.name}-${targetStem}-${context.noun.labels.head}`,
    "drum-nouns-jam",
    64,
    /[^a-zA-Z0-9 -]/g,
  )
    .toLowerCase()
    .replaceAll(" ", "-");
}

function loadStoredProfile() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveProfile() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      playerId: state.profile.playerId,
      name: state.profile.name,
      seed: state.profile.seed,
      lifetimeTokens: state.profile.lifetimeTokens,
      lifetimeHits: state.profile.lifetimeHits,
      mintedDrops: state.profile.mintedDrops,
      mintTarget: state.profile.mintTarget,
      selectedDropId: state.profile.selectedDropId,
      soundEnabled: state.profile.soundEnabled,
      powerState: state.power,
      supportPanelState: state.ui.supportPanels,
    }),
  );
}

function roomIdFromUrl() {
  const url = new URL(window.location.href);
  const roomIdFromQuery = url.searchParams.get("room");

  if (roomIdFromQuery) {
    return sanitizeRoomId(roomIdFromQuery);
  }

  return readLastRoomId();
}

function updateRoomInUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("room", state.roomId);
  window.history.replaceState({}, "", url);
}

function getCurrentCombo(now = Date.now()) {
  if (now - state.session.lastTapAt > getComboTimeoutMs(now)) {
    return 0;
  }

  return state.session.combo;
}

function getCrewMultiplier() {
  return Number(state.room.metrics?.crewMultiplier || 1);
}

function computeGainForHit(comboValue = getCurrentCombo() + 1, options = {}) {
  const now = options.now ?? Date.now();
  const crewMultiplier = getCrewMultiplier();
  const comboBonus = 1 + Math.min(1.5, Math.floor(comboValue / 4) * 0.16);
  const baseGain = Math.max(1, Math.round(comboBonus * crewMultiplier));
  const activePowerDrop = getActivePowerDrop(now);
  const activeCount = Math.max(0, state.room.metrics?.activeCount || 0);
  const powerHitIndex = activePowerDrop
    ? options.powerHitIndex ?? state.power.hitCounter + 1
    : 0;

  let flatBonus = 0;
  let multiplier = 1;
  let triggerLabel = "";

  switch (activePowerDrop?.id) {
    case "garage-kick":
      flatBonus = 1;
      break;
    case "cymbal-bloom":
      flatBonus = 1;
      break;
    case "laser-tom":
      if (powerHitIndex > 0 && powerHitIndex % 4 === 0) {
        flatBonus = 4;
        triggerLabel = "LASER +4";
      }
      break;
    case "street-parade":
      flatBonus = Math.min(4, Math.max(0, activeCount - 1));
      break;
    case "moon-riser":
      multiplier = 2;
      triggerLabel = "MOON x2";
      break;
    default:
      break;
  }

  return {
    total: Math.max(1, Math.round((baseGain + flatBonus) * multiplier)),
    baseGain,
    flatBonus,
    multiplier,
    activePowerDrop,
    powerHitIndex,
    triggerLabel,
    activeCount,
  };
}

function buildPowerStatusNote(drop, status, breakdown = null) {
  if (status.kind === "locked") {
    return `${formatCount(status.unlockRemaining)} DRUM until ${drop.title} unlocks ${drop.power.name}.`;
  }

  if (status.kind === "cooldown") {
    return `${drop.power.name} is cooling down for ${formatSecondsLeft(status.remainingMs)}. ${drop.power.short}.`;
  }

  if (status.kind === "live") {
    switch (drop.id) {
      case "laser-tom":
        return breakdown?.flatBonus >= 4
          ? `Laser Burst is live and the next hit is primed for +4 DRUM.`
          : `Laser Burst is live. Every 4th hit fires +4 DRUM for ${formatSecondsLeft(status.remainingMs)}.`;
      case "street-parade":
        return `Crowd Lift is live with +${Math.min(4, Math.max(0, (breakdown?.activeCount || 0) - 1))} bonus DRUM from the room right now.`;
      case "moon-riser":
        return `Moon Mode is live. Every hit is doubled for ${formatSecondsLeft(status.remainingMs)}.`;
      default:
        return `${drop.power.name} is live. ${drop.power.short} for ${formatSecondsLeft(status.remainingMs)}.`;
    }
  }

  return `${drop.power.name} is ready. ${drop.power.short}.`;
}

function buildPowerMeterPercent(drop, status) {
  if (status.kind === "locked") {
    return Math.max(
      8,
      Math.min(100, Math.round((state.profile.lifetimeTokens / Math.max(1, drop.threshold)) * 100)),
    );
  }

  if (status.kind === "live") {
    return Math.max(8, Math.round((status.remainingMs / drop.power.durationMs) * 100));
  }

  if (status.kind === "cooldown") {
    return Math.max(
      8,
      Math.round((1 - status.remainingMs / drop.power.cooldownMs) * 100),
    );
  }

  return 100;
}

function clampPercent(value, fallback = 8) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(8, Math.min(100, Math.round(value)));
}

function syncMintDraft(force = false) {
  if (force || !state.session.tokenNameCustom || !elements.tokenName.value.trim()) {
    elements.tokenName.value = buildDefaultTokenName();
    state.session.tokenNameCustom = false;
  }

  if (
    force ||
    !state.session.tokenDescriptionCustom ||
    !elements.tokenDescription.value.trim()
  ) {
    elements.tokenDescription.value = buildDefaultTokenDescription();
    state.session.tokenDescriptionCustom = false;
  }

  renderMintLinks();
}

function renderMintLinks() {
  const seed = getCurrentNoun().seed;
  elements.nounImageLink.href = buildNounImageUrl(seed);
  elements.tokenMetadataLink.href = buildTokenMetadataUrl(seed);
}

function renderPlayerIdentity() {
  const noun = getCurrentNoun();
  const drop = getSelectedDrop();

  elements.playerAvatar.innerHTML = noun.svg;
  elements.identityLine.textContent = `${noun.labels.head} head, ${noun.labels.accessory} accessory, ${noun.labels.glasses} glasses. Equipped for ${drop.title} and ${drop.power.name}.`;
  if (document.activeElement !== elements.playerNameInput) {
    elements.playerNameInput.value = state.profile.name;
  }
  applyNounCursor(noun.svg);
}

function renderNounLab() {
  const noun = getCurrentNoun();

  elements.nounStylePill.textContent = `${noun.labels.head} mode`;
  elements.nounPanelPreview.textContent = `${state.profile.name} • ${noun.labels.head} head • ${getSelectedDrop().title}`;
  elements.nounGlanceStage.textContent = state.profile.name;
  elements.nounGlanceHead.textContent = noun.labels.head;
  elements.nounGlanceDrop.textContent = getSelectedDrop().title;
  elements.nounTraitList.innerHTML = NOUN_TRAITS.map((trait) => {
    const label = noun.labels[trait.key];

    return `
      <article class="noun-trait-row">
        <div class="noun-trait-copy">
          <span>${escapeHtml(trait.label)}</span>
          <strong>${escapeHtml(label)}</strong>
        </div>
        <div class="noun-trait-controls">
          <button
            class="ghost-button noun-cycle-button"
            type="button"
            data-trait-key="${escapeHtml(trait.key)}"
            data-trait-step="-1"
            aria-label="Previous ${escapeHtml(trait.label)}"
          >
            Prev
          </button>
          <button
            class="ghost-button noun-cycle-button"
            type="button"
            data-trait-key="${escapeHtml(trait.key)}"
            data-trait-step="1"
            aria-label="Next ${escapeHtml(trait.label)}"
          >
            Next
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function renderScoreboard() {
  const now = Date.now();
  const combo = getCurrentCombo(now);
  const nextGain = computeGainForHit(combo + 1, { now });
  const roomTotal = (state.room.totals?.tokens || 0) + state.session.pendingTokens;
  const selectedDrop = getSelectedDrop();
  const powerStatus = getPowerStatus(selectedDrop.id, now);

  elements.playerTokenCount.textContent = formatCount(state.profile.lifetimeTokens);
  elements.roomTokenCount.textContent = formatCount(roomTotal);
  elements.comboCount.textContent = `${combo}x`;
  elements.crewMultiplier.textContent = formatMultiplier(getCrewMultiplier());
  elements.drumGain.textContent = `+${state.session.lastGain || nextGain.total} DRUM`;
  elements.comboCaption.textContent =
    combo > 0
      ? `Combo alive. Next hit is worth ${nextGain.total} DRUM. ${buildPowerStatusNote(selectedDrop, powerStatus, nextGain)}`
      : `Tap to warm up the groove. Next hit is worth ${nextGain.total} DRUM. ${buildPowerStatusNote(selectedDrop, powerStatus, nextGain)}`;
}

function renderPowerUpPanel() {
  const now = Date.now();
  const selectedDrop = getSelectedDrop();
  const status = getPowerStatus(selectedDrop.id, now);
  const nextGain = computeGainForHit(getCurrentCombo(now) + 1, { now });

  elements.powerUpStatusPill.textContent = status.label;
  elements.powerUpStatusPill.dataset.state = status.kind;
  elements.powerUpName.textContent = `${selectedDrop.title} • ${selectedDrop.power.name}`;
  elements.powerUpDescription.textContent = selectedDrop.power.detail;
  elements.activatePowerUpButton.disabled = status.kind !== "ready";
  elements.activatePowerUpButton.textContent =
    status.kind === "ready"
      ? selectedDrop.power.activateLabel
      : status.kind === "live"
        ? `${formatSecondsLeft(status.remainingMs)} live`
        : status.kind === "cooldown"
          ? `Ready in ${formatSecondsLeft(status.remainingMs)}`
          : `Unlock at ${formatCount(selectedDrop.threshold)}`;
  elements.powerUpMeterFill.style.width = `${buildPowerMeterPercent(selectedDrop, status)}%`;
  elements.powerUpMeterFill.dataset.state = status.kind;
  elements.powerUpNote.textContent =
    status.kind === "ready"
      ? `Next hit is ${nextGain.total} DRUM before you fire it. ${selectedDrop.power.short}.`
      : buildPowerStatusNote(selectedDrop, status, nextGain);
}

function getStagePlayers(room = state.room) {
  const players = room.players || [];
  const featured = players
    .filter((player) => player.id !== state.profile.playerId)
    .sort((left, right) => {
      if (left.isActive !== right.isActive) {
        return left.isActive ? -1 : 1;
      }

      return (right.lastBeatAt || 0) - (left.lastBeatAt || 0);
    });

  return featured.slice(0, CROWD_STAGE_SLOTS.length);
}

function stagePositionForPlayer(playerId, room = state.room) {
  const stagePlayers = getStagePlayers(room);
  const slotIndex = Math.max(
    0,
    stagePlayers.findIndex((player) => player.id === playerId),
  );

  return CROWD_STAGE_SLOTS[slotIndex] || { x: 50, y: 50 };
}

function rememberRoomEvent(eventId) {
  if (!eventId) {
    return;
  }

  const seenEventIds = state.collab.seenEventIds;

  if (seenEventIds.includes(eventId)) {
    return;
  }

  seenEventIds.unshift(eventId);

  if (seenEventIds.length > 48) {
    seenEventIds.length = 48;
  }
}

function rememberRoomEvents(events = []) {
  events.forEach((event) => {
    rememberRoomEvent(event.id);
  });
}

function computeJamIntensity() {
  const metrics = state.room.metrics || {};

  return Math.max(
    10,
    Math.min(
      100,
      10 +
        (metrics.activeCount || 0) * 16 +
        (metrics.recentReactions || 0) * 8 +
        (metrics.syncedBursts || 0) * 6,
    ),
  );
}

function buildCrowdPresenceLabel(activeCount, otherPlayersCount) {
  if (activeCount > 1) {
    return `${activeCount} live nouns`;
  }

  if (otherPlayersCount > 0) {
    return "Crew nearby";
  }

  return "Solo warmup";
}

function buildJamStatus(activeCount, otherPlayersCount) {
  const metrics = state.room.metrics || {};

  if (activeCount >= 5) {
    return `Full-room energy. ${activeCount} noun drummers are stacking synced bursts in ${state.roomId}.`;
  }

  if (activeCount >= 3) {
    return `${activeCount} noun drummers are in pocket. Reactions and burst combos are pushing the room bonus higher.`;
  }

  if (activeCount >= 2) {
    return `Another noun is live with you right now. Trade hits and keep the shared multiplier climbing.`;
  }

  if (otherPlayersCount > 0 || metrics.syncedBursts > 0) {
    return `The room has recent footprints. Start drumming and pull the stage back to life.`;
  }

  return `The room will feel louder as more noun drummers show up.`;
}

function buildRoomMoodLabel() {
  const metrics = state.room.metrics || {};
  const totals = state.room.totals || {};

  if ((metrics.activeCount || 0) >= 4 && (metrics.syncedBursts || 0) >= 3) {
    return "Full-room parade";
  }

  if ((metrics.recentReactions || 0) >= 3) {
    return "Reaction storm";
  }

  if ((metrics.activeCount || 0) >= 2) {
    return "Crew build";
  }

  if ((totals.tokens || 0) > 0 || (state.room.events || []).length) {
    return "Solo grind";
  }

  return "Fresh tape";
}

function describeFeedEvent(event) {
  if (event.type === "join") {
    return {
      badge: "Joined",
      tone: "join",
      detail: event.selectedDrop || "Garage Kick",
    };
  }

  if (event.type === "reaction") {
    return {
      badge: event.reaction || "React",
      tone: "reaction",
      detail: "Room hype",
    };
  }

  if ((event.combo || 0) >= 12) {
    return {
      badge: `${event.combo}x burst`,
      tone: "combo",
      detail: `+${formatCount(event.tokens || 0)} DRUM`,
    };
  }

  if ((event.combo || 0) >= 8) {
    return {
      badge: `${event.combo}x combo`,
      tone: "combo",
      detail: `${formatCount(event.tokens || 0)} DRUM banked`,
    };
  }

  return {
    badge: `+${formatCount(event.tokens || 0)} DRUM`,
    tone: "pulse",
    detail: `${formatCount(event.hits || 0)} hits`,
  };
}

function buildFallbackTrafficRoom(roomId) {
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
    latestEventType: snapshot.events?.[0]?.type || "",
    latestEventMessage: snapshot.events?.[0]?.message || "",
    score: 0,
  };
}

function getVisibleTrafficRooms() {
  const spotlightRoomId = state.directory.spotlightRoomId || buildDailySpotlightRoomId();
  const roomMap = new Map((state.directory.rooms || []).map((room) => [room.roomId, room]));
  const visibleRooms = [];
  const seen = new Set();

  const pushRoom = (roomId, trafficLabel) => {
    const normalizedRoomId = sanitizeRoomId(roomId);

    if (!normalizedRoomId || seen.has(normalizedRoomId)) {
      return;
    }

    const room = roomMap.get(normalizedRoomId) || buildFallbackTrafficRoom(normalizedRoomId);
    visibleRooms.push({
      ...room,
      trafficLabel,
    });
    seen.add(normalizedRoomId);
  };

  pushRoom(state.roomId, "Playing now");
  pushRoom(spotlightRoomId, "Daily spotlight");
  pushRoom(DEFAULT_ROOM_ID, "Global jam");

  (state.directory.rooms || []).forEach((room) => {
    pushRoom(room.roomId, room.activeCount > 0 ? "Live room" : "Open room");
  });

  return visibleRooms.slice(0, 6);
}

function renderTrafficBoard() {
  const spotlightRoomId = state.directory.spotlightRoomId || buildDailySpotlightRoomId();
  const visibleRooms = getVisibleTrafficRooms();
  const liveRooms = Math.max(
    state.directory.totals?.liveRooms || 0,
    state.room.metrics?.activeCount ? 1 : 0,
  );
  const liveDrummers = Math.max(
    state.directory.totals?.activeDrummers || 0,
    state.room.metrics?.activeCount || 0,
  );

  elements.trafficStatusPill.textContent = liveRooms > 0 ? `${liveRooms} rooms live` : "Open stages";
  elements.trafficLiveRooms.textContent = formatCount(liveRooms);
  elements.trafficActiveDrummers.textContent = formatCount(liveDrummers);
  elements.trafficSpotlightRoom.textContent = spotlightRoomId;
  elements.trafficCurrentRoom.textContent = state.roomId;
  elements.trafficNote.textContent = liveRooms > 0
    ? "The daily spotlight rotates every day, and the busiest rooms float to the top so people can pile into the same jam."
    : "No loud rooms yet. Global jam and the daily spotlight are ready if you want to start the crowd.";

  if (!visibleRooms.length) {
    elements.trafficRoomList.innerHTML =
      '<div class="empty-state">Open a room, share it, or jump into the daily spotlight to start the first crowd.</div>';
    return;
  }

  elements.trafficRoomList.innerHTML = visibleRooms
    .map((room) => {
      const isCurrent = room.roomId === state.roomId;
      const roomLeadNoun = room.topPlayerSeed
        ? buildNoun(room.topPlayerSeed)
        : isCurrent
          ? getCurrentNoun()
          : null;
      const trafficPulse = Math.max(
        isCurrent ? 22 : 10,
        Math.min(
          100,
          room.activeCount * 24 +
            room.recentReactions * 10 +
            room.syncedBursts * 10 +
            Math.round(room.totalTokens / 20),
        ),
      );
      const trafficBadge = room.activeCount > 0
        ? `${room.activeCount} live`
        : room.participantCount > 0
          ? `${room.participantCount} seen`
          : "Fresh room";
      const trafficCopy = room.activeCount > 0
        ? `${formatCount(room.totalTokens)} DRUM • crew ${formatMultiplier(room.crewMultiplier)} • ${room.topPlayerName || "First drummer"} on top`
        : room.participantCount > 0
          ? `${formatCount(room.participantCount)} drummers have touched this room • best ${formatCount(room.highestCombo)}x`
          : "Daily spotlight and global rooms are the best places to start a crowd.";
      const trafficMeta = room.latestEventMessage
        ? trimText(room.latestEventMessage, "The tape is fresh.", 96)
        : room.roomId === spotlightRoomId
          ? "This is the shared room of the day."
          : room.roomId === DEFAULT_ROOM_ID
            ? "Always-on room for anyone dropping in."
            : "Jump in and make the first noise here.";

      return `
        <article class="traffic-room-card ${isCurrent ? "is-current" : ""}" data-live="${room.activeCount > 0 ? "true" : "false"}">
          <div class="traffic-room-head">
            <div class="traffic-room-title-group">
              <strong>/${escapeHtml(room.roomId)}</strong>
              <span class="traffic-room-label">${escapeHtml(room.trafficLabel)}</span>
            </div>
            <span class="traffic-room-badge">${escapeHtml(trafficBadge)}</span>
          </div>
          <div class="traffic-room-body">
            <div class="traffic-room-avatar" aria-hidden="true">${roomLeadNoun?.svg || ""}</div>
            <div class="traffic-room-copy-shell">
              <p class="traffic-room-copy">${escapeHtml(trafficCopy)}</p>
              <div class="traffic-room-meter" aria-hidden="true">
                <span class="traffic-room-meter-fill" style="width:${trafficPulse}%"></span>
              </div>
            </div>
          </div>
          <p class="traffic-room-meta">${escapeHtml(trafficMeta)}</p>
          <div class="traffic-room-actions">
            <button
              class="${isCurrent ? "ghost-button" : "secondary-button"}"
              type="button"
              data-room-hop="${escapeHtml(room.roomId)}"
              ${isCurrent ? "disabled" : ""}
            >
              ${isCurrent ? "Playing now" : "Jump in"}
            </button>
            <a class="ghost-button button-link" href="/?room=${encodeURIComponent(room.roomId)}">View board</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCollabExperience() {
  const activeCount = state.room.metrics?.activeCount || 0;
  const stagePlayers = getStagePlayers();

  elements.crowdPresence.textContent = buildCrowdPresenceLabel(activeCount, stagePlayers.length);
  elements.jamStatus.textContent = buildJamStatus(activeCount, stagePlayers.length);
  elements.syncMeterFill.style.width = `${computeJamIntensity()}%`;

  if (!stagePlayers.length) {
    elements.crowdStage.innerHTML = "";
    return;
  }

  elements.crowdStage.innerHTML = stagePlayers
    .map((player, index) => {
      const noun = buildNoun(player.seed);
      const slot = CROWD_STAGE_SLOTS[index] || { x: 50, y: 50 };
      const isFiring = Date.now() - (player.lastBeatAt || 0) <= 1800;

      return `
        <article
          class="crowd-spot ${player.isActive ? "is-active" : "is-idle"} ${isFiring ? "is-firing" : ""}"
          style="--slot-x:${slot.x}%; --slot-y:${slot.y}%; --slot-delay:${(index * 0.18).toFixed(2)}s"
          data-player-id="${escapeHtml(player.id)}"
        >
          <div class="crowd-bubble" aria-hidden="true">${noun.svg}</div>
          <span class="crowd-label">${escapeHtml(player.name)}</span>
        </article>
      `;
    })
    .join("");
}

function getRankedLeaderboardPlayers() {
  return getProjectedLeaderboardPlayers().map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
}

function setGuideButton(button, config) {
  if (!button) {
    return;
  }

  button.textContent = config.label;
  button.dataset.guideAction = config.action;

  if (config.panelId) {
    button.dataset.guidePanel = config.panelId;
  } else {
    delete button.dataset.guidePanel;
  }

  if (config.reaction) {
    button.dataset.guideReaction = config.reaction;
  } else {
    delete button.dataset.guideReaction;
  }
}

function renderJamGuide() {
  const now = Date.now();
  const nextDrop = DROP_LIBRARY.find((drop) => !isDropUnlocked(drop));
  const selectedDrop = getSelectedDrop();
  const powerStatus = getPowerStatus(selectedDrop.id, now);
  const nextGain = computeGainForHit(getCurrentCombo(now) + 1, { now });
  const rankedPlayers = getRankedLeaderboardPlayers();
  const selfRankIndex = rankedPlayers.findIndex((player) => player.id === state.profile.playerId);
  const selfPlayer = rankedPlayers[selfRankIndex];
  const leader = rankedPlayers[0];
  const activeCount = state.room.metrics?.activeCount || 0;
  const knownPlayers = state.room.players?.length || 0;
  const nextRoomGoal = ROOM_GOAL_MILESTONES.find((goal) => goal > activeCount);

  let jamGuideLabel = "3 live goals";

  if (nextDrop) {
    const remaining = Math.max(0, nextDrop.threshold - state.profile.lifetimeTokens);
    elements.guideUnlockTitle.textContent = nextDrop.title;
    elements.guideUnlockCopy.textContent =
      `${formatCount(remaining)} DRUM to unlock ${nextDrop.power.name}. ${nextDrop.power.short}.`;
    elements.guideUnlockProgress.style.width = `${clampPercent((state.profile.lifetimeTokens / Math.max(1, nextDrop.threshold)) * 100)}%`;
    setGuideButton(elements.guideUnlockButton, {
      label: "See drops",
      action: "jump",
      panelId: "collection-panel",
    });

    if (remaining <= 24) {
      jamGuideLabel = `${formatCount(remaining)} to unlock`;
    }
  } else {
    elements.guideUnlockTitle.textContent = selectedDrop.power.name;
    elements.guideUnlockCopy.textContent =
      powerStatus.kind === "ready"
        ? `${selectedDrop.power.short}. Your next hit is ${nextGain.total} DRUM before you fire it.`
        : buildPowerStatusNote(selectedDrop, powerStatus, nextGain);
    elements.guideUnlockProgress.style.width = `${clampPercent(buildPowerMeterPercent(selectedDrop, powerStatus), 100)}%`;
    setGuideButton(
      elements.guideUnlockButton,
      powerStatus.kind === "ready"
        ? {
            label: selectedDrop.power.activateLabel,
            action: "power",
          }
        : {
            label: "See drops",
            action: "jump",
            panelId: "collection-panel",
          },
    );
  }

  if (!leader || rankedPlayers.length <= 1) {
    elements.guideRaceTitle.textContent = "Start a race";
    elements.guideRaceCopy.textContent =
      "You own the board right now. Share the room and turn the solo run into a chase.";
    elements.guideRaceProgress.style.width = `${clampPercent(knownPlayers > 1 ? 44 : 16)}%`;
    setGuideButton(elements.guideRaceButton, {
      label: "Share room",
      action: "share",
    });
  } else if (selfPlayer?.rank === 1) {
    const runnerUp = rankedPlayers[1];
    const lead = Math.max(0, (selfPlayer?.totalTokens || 0) - (runnerUp?.totalTokens || 0));

    elements.guideRaceTitle.textContent = "Hold #1";
    elements.guideRaceCopy.textContent =
      `${runnerUp?.name || "The room"} is ${formatCount(lead)} DRUM behind you. Keep the pad warm.`;
    elements.guideRaceProgress.style.width = `${clampPercent(((selfPlayer?.totalTokens || 1) / Math.max(1, (selfPlayer?.totalTokens || 0) + (runnerUp?.totalTokens || 0))) * 100, 52)}%`;
    setGuideButton(elements.guideRaceButton, {
      label: "Open rank",
      action: "jump",
      panelId: "leaderboard-panel",
    });
  } else {
    const chaseTarget = rankedPlayers[selfRankIndex - 1] || leader;
    const gap = Math.max(0, (chaseTarget?.totalTokens || 0) - (selfPlayer?.totalTokens || 0));

    elements.guideRaceTitle.textContent = `Catch #${chaseTarget?.rank || 1}`;
    elements.guideRaceCopy.textContent =
      `${formatCount(gap)} DRUM to pass ${chaseTarget?.name || "the leader"} and climb the board.`;
    elements.guideRaceProgress.style.width = `${clampPercent(((selfPlayer?.totalTokens || 0) / Math.max(1, chaseTarget?.totalTokens || 1)) * 100, 14)}%`;
    setGuideButton(elements.guideRaceButton, {
      label: "Open rank",
      action: "jump",
      panelId: "leaderboard-panel",
    });

    if (gap <= 24) {
      jamGuideLabel = "Race on";
    }
  }

  if (activeCount <= 1) {
    elements.guideRoomTitle.textContent = "Bring in the crew";
    elements.guideRoomCopy.textContent =
      knownPlayers > 1
        ? `This room has history. Share ${state.roomId} and pull one more noun back on stage.`
        : "One more live noun wakes the room up and makes the shared groove feel bigger.";
    elements.guideRoomProgress.style.width = `${clampPercent((knownPlayers / 2) * 100, 18)}%`;
    setGuideButton(elements.guideRoomButton, {
      label: "Share room",
      action: "share",
    });

    if (jamGuideLabel === "3 live goals") {
      jamGuideLabel = "Need crew";
    }
  } else if (nextRoomGoal) {
    const needed = nextRoomGoal - activeCount;

    elements.guideRoomTitle.textContent = `Push to ${nextRoomGoal} live`;
    elements.guideRoomCopy.textContent =
      `${needed} more noun${needed === 1 ? "" : "s"} needed. Share the room and keep the crowd meter climbing.`;
    elements.guideRoomProgress.style.width = `${clampPercent((activeCount / nextRoomGoal) * 100, 34)}%`;
    setGuideButton(elements.guideRoomButton, {
      label: "Share room",
      action: "share",
    });
  } else {
    elements.guideRoomTitle.textContent = "Room is popping";
    elements.guideRoomCopy.textContent =
      `${activeCount} live nouns are on stage. Throw a boom drop and keep the feed moving.`;
    elements.guideRoomProgress.style.width = "100%";
    setGuideButton(elements.guideRoomButton, {
      label: "Boom drop",
      action: "reaction",
      reaction: "BOOM",
    });

    if (jamGuideLabel === "3 live goals") {
      jamGuideLabel = "Stage full";
    }
  }

  elements.jamGuidePill.textContent = jamGuideLabel;
}

function renderCollection() {
  const now = Date.now();
  const currentDrop = getSelectedDrop();
  const nextDrop = DROP_LIBRARY.find((drop) => !isDropUnlocked(drop));
  const unlockedDrops = getUnlockedDrops();
  const mintedDropCount = DROP_LIBRARY.filter((drop) => Boolean(state.profile.mintedDrops[drop.id])).length;

  elements.collectionStatus.textContent = nextDrop
    ? `${formatCount(nextDrop.threshold - state.profile.lifetimeTokens)} DRUM until ${nextDrop.title}. Each unlock adds a new power-up.`
    : "Every drop is unlocked. Swap powers whenever the room changes.";
  elements.collectionPanelPreview.textContent = nextDrop
    ? `Next: ${nextDrop.title} in ${formatCount(nextDrop.threshold - state.profile.lifetimeTokens)} DRUM`
    : `All drops unlocked • ${currentDrop.title} equipped`;
  elements.collectionGlanceUnlocked.textContent = `${unlockedDrops.length} / ${DROP_LIBRARY.length}`;
  elements.collectionGlanceEquipped.textContent = currentDrop.title;
  elements.collectionGlanceMinted.textContent = `${mintedDropCount} drop${mintedDropCount === 1 ? "" : "s"}`;

  elements.unlockShelf.innerHTML = DROP_LIBRARY.map((drop) => {
    const unlockedState = isDropUnlocked(drop);
    const isSelected = currentDrop.id === drop.id;
    const mintedHash = state.profile.mintedDrops[drop.id];
    const powerStatus = getPowerStatus(drop.id, now);
    const previewNoun = isSelected
      ? getCurrentNoun()
      : buildNoun(buildSeedVariant(state.profile.seed, `${drop.id}:${drop.tier}:${drop.threshold}`));
    const previewBreakdown = isSelected
      ? computeGainForHit(getCurrentCombo(now) + 1, { now })
      : null;
    const buttonLabel = !unlockedState
      ? `Need ${formatCount(drop.threshold)} DRUM`
      : isSelected
        ? "Equipped now"
        : "Equip power-up";

    return `
      <article
        class="drop-card ${isSelected ? "is-selected" : ""} ${unlockedState ? "" : "is-locked"}"
        data-drop-id="${escapeHtml(drop.id)}"
        data-state="${escapeHtml(powerStatus.kind)}"
      >
        <div class="drop-preview" data-drop-id="${escapeHtml(drop.id)}" aria-hidden="true">${previewNoun.svg}</div>
        <div class="drop-meta">
          <div class="drop-title-row">
            <strong>${escapeHtml(drop.title)}</strong>
            <span class="drop-tier">${escapeHtml(drop.tier)}</span>
          </div>
          <p class="drop-copy">${escapeHtml(drop.blurb)}</p>
          <p class="drop-preview-note">Look: ${escapeHtml(previewNoun.labels.head)} / ${escapeHtml(previewNoun.labels.glasses)}</p>
          <p class="drop-power-name">Power-up: ${escapeHtml(drop.power.name)}</p>
          <p class="drop-copy">${escapeHtml(drop.power.short)}.</p>
          <p class="drop-copy">${escapeHtml(buildPowerStatusNote(drop, powerStatus, previewBreakdown))}</p>
          <div class="drop-status-row">
            <span class="drop-status-badge" data-state="${escapeHtml(powerStatus.kind)}">${escapeHtml(powerStatus.label)}</span>
            <span class="drop-status-badge" data-state="${mintedHash ? "minted" : "default"}">${mintedHash ? `Minted ${escapeHtml(compactAddress(mintedHash))}` : unlockedState ? "Ready to mint" : `Unlock at ${formatCount(drop.threshold)} DRUM`}</span>
          </div>
        </div>
        <button
          class="${unlockedState ? "secondary-button" : "ghost-button"}"
          type="button"
          data-drop-select="${escapeHtml(drop.id)}"
          ${unlockedState ? "" : "disabled"}
        >
          ${escapeHtml(buttonLabel)}
        </button>
      </article>
    `;
  }).join("");
}

function renderMintControls() {
  const context = buildMintContext();
  const mintedHash = state.profile.mintedDrops[context.mintedKey];
  const savedMintCount = Object.keys(state.profile.mintedDrops).length;

  elements.selectedDropPill.textContent = context.pillLabel;
  elements.mintTargetNote.textContent = context.targetNote;
  elements.mintedAssetStatus.textContent = mintedHash
    ? `Latest ${context.mintedLabel} mint: ${compactAddress(mintedHash)}`
    : `No ${context.mintedLabel} mint saved yet on this device.`;
  elements.mintDropTargetButton.classList.toggle(
    "is-active",
    context.target === MINT_TARGETS.DROP,
  );
  elements.mintNounTargetButton.classList.toggle(
    "is-active",
    context.target === MINT_TARGETS.NOUN,
  );
  elements.mintDropTargetButton.setAttribute(
    "aria-pressed",
    String(context.target === MINT_TARGETS.DROP),
  );
  elements.mintNounTargetButton.setAttribute(
    "aria-pressed",
    String(context.target === MINT_TARGETS.NOUN),
  );
  elements.mintPanelPreview.textContent = connectedAddress
    ? `${compactAddress(connectedAddress)} • ${context.buttonLabel}`
    : `Wallet not connected • ${context.pillLabel}`;
  elements.mintGlanceMode.textContent = context.target === MINT_TARGETS.NOUN ? "Noun" : "Drop";
  elements.mintGlanceWallet.textContent = connectedAddress ? compactAddress(connectedAddress) : "Not linked";
  elements.mintGlanceSaved.textContent = `${savedMintCount} mint${savedMintCount === 1 ? "" : "s"}`;
}

function getProjectedLeaderboardPlayers() {
  const players = new Map((state.room.players || []).map((player) => [player.id, { ...player }]));
  const now = Date.now();
  const roomSelf = players.get(state.profile.playerId);

  players.set(state.profile.playerId, {
    id: state.profile.playerId,
    name: state.profile.name,
    seed: state.profile.seed,
    selectedDrop: getSelectedDrop().title,
    totalHits: Math.max(state.profile.lifetimeHits, roomSelf?.totalHits || 0),
    totalTokens: Math.max(state.profile.lifetimeTokens, roomSelf?.totalTokens || 0),
    bestCombo: Math.max(state.session.bestCombo, roomSelf?.bestCombo || 0),
    lastSeenAt: now,
    lastBeatAt: Math.max(state.session.lastTapAt || 0, roomSelf?.lastBeatAt || 0),
    isActive: Boolean(getCurrentCombo()) || roomSelf?.isActive || false,
  });

  return [...players.values()].sort((left, right) => {
    if (right.totalTokens !== left.totalTokens) {
      return right.totalTokens - left.totalTokens;
    }

    if (right.bestCombo !== left.bestCombo) {
      return right.bestCombo - left.bestCombo;
    }

    return (right.lastBeatAt || 0) - (left.lastBeatAt || 0);
  });
}

function renderLeaderboard() {
  const rankedPlayers = getRankedLeaderboardPlayers();
  const selfRankIndex = rankedPlayers.findIndex((player) => player.id === state.profile.playerId);
  const selfPlayer = rankedPlayers[selfRankIndex];
  const leader = rankedPlayers[0];
  const visiblePlayers = rankedPlayers.slice(0, 5);
  const runnerUp = rankedPlayers[1];

  if (selfPlayer && selfPlayer.rank > visiblePlayers.length) {
    visiblePlayers.push(selfPlayer);
  }

  elements.leaderboardRank.textContent = selfPlayer ? `Rank #${selfPlayer.rank}` : "Rank --";

  if (!leader || rankedPlayers.length === 1) {
    elements.leaderboardStatus.textContent =
      "You own the board right now. Share the room to turn this into a race.";
  } else if (selfPlayer?.rank === 1) {
    elements.leaderboardStatus.textContent = `You are leading ${state.roomId} with ${formatCount(selfPlayer.totalTokens)} DRUM.`;
  } else {
    elements.leaderboardStatus.textContent = `Chase ${leader.name} by ${formatCount(Math.max(0, leader.totalTokens - (selfPlayer?.totalTokens || 0)))} DRUM to take first.`;
  }
  elements.leaderboardPanelPreview.textContent = leader
    ? `${leader.name}${leader.id === state.profile.playerId ? " (you)" : ""} leads with ${formatCount(leader.totalTokens)} DRUM`
    : "No leaderboard data yet";
  elements.leaderboardGlanceGap.textContent = !leader || rankedPlayers.length === 1
    ? "Solo"
    : selfPlayer?.rank === 1
      ? `Ahead ${formatCount(Math.max(0, (selfPlayer?.totalTokens || 0) - (runnerUp?.totalTokens || 0)))}`
      : `Need ${formatCount(Math.max(0, (leader.totalTokens || 0) - (selfPlayer?.totalTokens || 0)))}`;
  elements.leaderboardGlanceRoom.textContent = `${rankedPlayers.length} drummer${rankedPlayers.length === 1 ? "" : "s"}`;
  elements.leaderboardGlanceBest.textContent = `${Math.max(state.session.bestCombo, selfPlayer?.bestCombo || 0)}x`;

  elements.leaderboardList.innerHTML = visiblePlayers
    .map((player) => {
      const noun = buildNoun(player.seed);
      const isSelf = player.id === state.profile.playerId;
      const presenceLabel = player.isActive ? "live now" : formatTimeAgo(player.lastSeenAt);
      const progressPercent = leader
        ? clampPercent((player.totalTokens / Math.max(1, leader.totalTokens)) * 100, isSelf ? 28 : 12)
        : 100;
      const leaderboardTone = player.rank === 1 ? "lead" : isSelf ? "self" : player.isActive ? "live" : "chase";
      const leaderboardBadge = player.rank === 1 ? "Lead" : isSelf ? "You" : player.isActive ? "Live" : "Chasing";
      const leaderboardDetail = player.rank === 1
        ? rankedPlayers.length > 1
          ? `Ahead by ${formatCount(Math.max(0, player.totalTokens - (runnerUp?.totalTokens || 0)))}`
          : "Solo set"
        : `${formatCount(Math.max(0, (leader?.totalTokens || 0) - player.totalTokens))} behind`;

      return `
        <article
          class="leaderboard-card ${isSelf ? "is-self" : ""}"
          data-active="${player.isActive ? "true" : "false"}"
        >
          <div class="leaderboard-rank-badge">${player.rank}</div>
          <div class="leaderboard-avatar" aria-hidden="true">${noun.svg}</div>
          <div class="leaderboard-meta">
            <div class="leaderboard-topline">
              <strong>${escapeHtml(player.name)}${isSelf ? " (you)" : ""}</strong>
              <span>${formatCount(player.totalTokens)} DRUM</span>
            </div>
            <p class="leaderboard-subline">
              ${escapeHtml(player.selectedDrop || "Garage Kick")} • best ${player.bestCombo}x • ${escapeHtml(presenceLabel)}
            </p>
            <div class="leaderboard-chip-row">
              <span class="leaderboard-status-badge" data-tone="${escapeHtml(leaderboardTone)}">${escapeHtml(leaderboardBadge)}</span>
              <span class="leaderboard-progress-copy">${escapeHtml(leaderboardDetail)}</span>
            </div>
            <div class="leaderboard-progress" aria-hidden="true">
              <span class="leaderboard-progress-fill" data-tone="${escapeHtml(leaderboardTone)}" style="width:${progressPercent}%"></span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCrew() {
  const players = state.room.players || [];
  const activeCount = state.room.metrics?.activeCount || 0;

  elements.crewCount.textContent = `${activeCount} active`;
  elements.roomSyncStatus.textContent = state.roomSyncLabel;
  elements.roomStatusLine.textContent =
    activeCount > 1
      ? `${activeCount} drummers are lighting up ${state.roomId}. Shared groove is running at ${formatMultiplier(getCrewMultiplier())}.`
      : `Share room ${state.roomId} to pull in more noun drummers and boost the crew multiplier.`;
  elements.crewPanelPreview.textContent =
    activeCount > 0
      ? `${activeCount} active • crew at ${formatMultiplier(getCrewMultiplier())}`
      : `No live crew in ${state.roomId} yet`;
  elements.crewGlanceLive.textContent = `${activeCount} live`;
  elements.crewGlanceKnown.textContent = `${players.length} seen`;
  elements.crewGlanceBonus.textContent = formatMultiplier(getCrewMultiplier());

  if (!players.length) {
    elements.crewList.innerHTML =
      '<div class="empty-state">No crew in the room yet. Share the link and be the first noun on stage.</div>';
    return;
  }

  elements.crewList.innerHTML = players
    .slice(0, 8)
    .map((player) => {
      const noun = buildNoun(player.seed);

      return `
        <article class="crew-card" data-active="${player.isActive ? "true" : "false"}">
          <div class="crew-avatar" aria-hidden="true">${noun.svg}</div>
          <div class="crew-meta">
            <div class="crew-topline">
              <strong>${escapeHtml(player.name)}</strong>
              <span>${formatCount(player.totalTokens)} DRUM</span>
            </div>
            <p class="crew-subline">
              ${escapeHtml(player.selectedDrop || "Garage Kick")} • best combo ${player.bestCombo} • ${escapeHtml(formatTimeAgo(player.lastSeenAt))}
            </p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderFeed() {
  const events = state.room.events || [];
  elements.shareStatus.textContent = state.shareStatus;
  const latestEvent = events[0];
  elements.socialPanelPreview.textContent = latestEvent
    ? `${latestEvent.playerName}: ${trimText(latestEvent.message, "Fresh room energy.", 72)}`
    : "No room moments yet";
  elements.socialGlanceMoments.textContent = `${events.length} recent`;
  elements.socialGlanceFresh.textContent = latestEvent ? formatTimeAgo(latestEvent.createdAt) : "Quiet";
  elements.socialGlanceMood.textContent = buildRoomMoodLabel();

  if (!events.length) {
    elements.feedList.innerHTML =
      '<div class="empty-state">The hype feed will fill with joins, combo bursts, and room reactions.</div>';
    return;
  }

  elements.feedList.innerHTML = events
    .slice(0, 8)
    .map((event) => {
      const noun = buildNoun(event.seed);
      const eventSummary = describeFeedEvent(event);

      return `
        <article class="feed-item">
          <div class="feed-avatar" aria-hidden="true">${noun.svg}</div>
          <div class="feed-meta">
            <div class="feed-topline">
              <strong>${escapeHtml(event.playerName)}</strong>
              <span>${escapeHtml(formatTimeAgo(event.createdAt))}</span>
            </div>
            <div class="feed-chip-row">
              <span class="feed-badge" data-tone="${escapeHtml(eventSummary.tone)}">${escapeHtml(eventSummary.badge)}</span>
              <span class="feed-detail">${escapeHtml(eventSummary.detail)}</span>
            </div>
            <p class="feed-text">${escapeHtml(event.message)}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderWalletState() {
  const context = buildMintContext();

  elements.networkName.textContent = TEZOS_MINT.networkLabel;
  elements.contractAddress.textContent = compactAddress(TEZOS_MINT.contractAddress);
  elements.walletAddress.textContent = compactAddress(connectedAddress);
  elements.walletBalance.textContent = connectedBalance || "-";
  elements.walletStatus.textContent = walletStatusMessage;
  elements.mintStatus.textContent = mintStatusMessage;
  elements.mintResult.innerHTML = mintResultMarkup;
  elements.walletButton.disabled = walletBusy;
  elements.walletButton.textContent = walletBusy
    ? "Connecting..."
    : connectedAddress
      ? "Reconnect wallet"
      : "Connect wallet";
  elements.disconnectWalletButton.hidden = !connectedAddress;
  elements.disconnectWalletButton.disabled = walletBusy;
  elements.mintButton.disabled = !connectedAddress || walletBusy || mintBusy;
  elements.mintButton.textContent = mintBusy ? "Minting..." : context.buttonLabel;
}

function renderSoundButton() {
  elements.soundToggleButton.textContent = state.profile.soundEnabled ? "Sound on" : "Sound off";
}

function setActiveSupportPanel(panelId = "") {
  supportJumpLinks.forEach((link) => {
    const isActive = link.dataset.supportJump === panelId;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "true" : "false");
  });
}

function applySupportPanelState() {
  supportPanels.forEach((panel) => {
    const collapsed = Boolean(state.ui.supportPanels[panel.id]);
    panel.dataset.collapsed = String(collapsed);
  });

  supportToggleButtons.forEach((button) => {
    const panelId = button.dataset.supportToggle || "";
    const collapsed = Boolean(state.ui.supportPanels[panelId]);
    const label = button.querySelector("[data-support-toggle-label]");

    button.setAttribute("aria-expanded", String(!collapsed));

    if (label) {
      label.textContent = collapsed ? "Open" : "Hide";
    }
  });
}

function setSupportPanelCollapsed(panelId, collapsed, persist = true) {
  if (!SUPPORT_PANEL_IDS.includes(panelId)) {
    return;
  }

  state.ui.supportPanels[panelId] = Boolean(collapsed);
  applySupportPanelState();

  if (persist) {
    saveProfile();
  }
}

function toggleSupportPanel(panelId) {
  if (!SUPPORT_PANEL_IDS.includes(panelId)) {
    return;
  }

  setSupportPanelCollapsed(panelId, !state.ui.supportPanels[panelId]);
}

function setReturnToDrumVisible(isVisible) {
  if (!elements.returnToDrumButton) {
    return;
  }

  elements.returnToDrumButton.hidden = !isVisible;
  elements.returnToDrumButton.classList.toggle("is-visible", isVisible);
}

function setupReturnToDrumObserver() {
  if (!elements.returnToDrumButton || !elements.drumPad) {
    return;
  }

  if (drumReturnObserver) {
    drumReturnObserver.disconnect();
    drumReturnObserver = undefined;
  }

  if (typeof IntersectionObserver === "undefined") {
    setReturnToDrumVisible(false);
    return;
  }

  drumReturnObserver = new IntersectionObserver(
    ([entry]) => {
      const shouldShow = isMobileViewport() && !(entry?.isIntersecting && entry.intersectionRatio > 0.32);
      setReturnToDrumVisible(shouldShow);
    },
    {
      threshold: [0.12, 0.32, 0.55],
      rootMargin: "-8% 0px -12% 0px",
    },
  );

  drumReturnObserver.observe(elements.drumPad);
  setReturnToDrumVisible(false);
}

function setupSupportObserver() {
  if (!supportPanels.length || !supportJumpLinks.length) {
    return;
  }

  if (supportPanelObserver) {
    supportPanelObserver.disconnect();
    supportPanelObserver = undefined;
  }

  if (typeof IntersectionObserver === "undefined") {
    setActiveSupportPanel(supportPanels[0]?.id || "");
    return;
  }

  supportPanelObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

      if (visibleEntry?.target?.id) {
        setActiveSupportPanel(visibleEntry.target.id);
      }
    },
    {
      threshold: [0.22, 0.45, 0.7],
      rootMargin: "-14% 0px -48% 0px",
    },
  );

  supportPanels.forEach((panel) => {
    supportPanelObserver.observe(panel);
  });

  setActiveSupportPanel(supportPanels[0]?.id || "");
}

function renderAll() {
  renderPlayerIdentity();
  renderNounLab();
  renderScoreboard();
  renderPowerUpPanel();
  renderCollabExperience();
  renderJamGuide();
  renderTrafficBoard();
  renderCollection();
  renderLeaderboard();
  renderCrew();
  renderFeed();
  renderMintControls();
  renderWalletState();
  renderSoundButton();
  applySupportPanelState();
  renderMintLinks();
  if (document.activeElement !== elements.roomInput) {
    elements.roomInput.value = state.roomId;
  }
}

function applyNounCursor(svg) {
  const cursorSvg = svg.replace(/<svg([^>]*)>/, '<svg$1 width="48" height="48">');
  const dataUrl = `url("data:image/svg+xml,${encodeURIComponent(cursorSvg)}") 12 12, auto`;
  document.documentElement.style.setProperty("--noun-cursor", dataUrl);
}

function pulsePad() {
  elements.drumPad.classList.remove("is-struck");
  void elements.drumPad.offsetWidth;
  elements.drumPad.classList.add("is-struck");
  window.setTimeout(() => {
    elements.drumPad.classList.remove("is-struck");
  }, 180);
}

function spawnGainBurst(amount, options = {}) {
  const burst = document.createElement("span");
  burst.className = `gain-burst ${options.remote ? "is-remote" : ""}`.trim();
  burst.textContent = options.label || `+${amount} DRUM`;
  burst.style.left = `${options.left ?? 50}%`;
  burst.style.top = `${options.top ?? 50}%`;
  elements.drumPad.append(burst);
  window.setTimeout(() => {
    burst.remove();
  }, 680);
}

function getAudioContext() {
  if (!state.profile.soundEnabled) {
    return null;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  if (!state.audioContext) {
    state.audioContext = new AudioContextCtor();
  }

  if (state.audioContext.state === "suspended") {
    state.audioContext.resume().catch(() => {});
  }

  return state.audioContext;
}

function getNoiseBuffer(context) {
  if (state.noiseBuffer) {
    return state.noiseBuffer;
  }

  const buffer = context.createBuffer(1, context.sampleRate * 0.22, context.sampleRate);
  const channelData = buffer.getChannelData(0);

  for (let index = 0; index < channelData.length; index += 1) {
    channelData[index] = Math.random() * 2 - 1;
  }

  state.noiseBuffer = buffer;
  return buffer;
}

function playKick(context, when, accent) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(150 + accent * 28, when);
  oscillator.frequency.exponentialRampToValueAtTime(48, when + 0.16);
  gainNode.gain.setValueAtTime(0.0001, when);
  gainNode.gain.exponentialRampToValueAtTime(0.7 + accent * 0.15, when + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
  oscillator.connect(gainNode).connect(context.destination);
  oscillator.start(when);
  oscillator.stop(when + 0.2);
}

function playSnare(context, when, accent) {
  const noise = context.createBufferSource();
  noise.buffer = getNoiseBuffer(context);

  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.setValueAtTime(1800, when);

  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0.0001, when);
  noiseGain.gain.exponentialRampToValueAtTime(0.36 + accent * 0.12, when + 0.01);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);

  noise.connect(noiseFilter).connect(noiseGain).connect(context.destination);
  noise.start(when);
  noise.stop(when + 0.2);

  const tone = context.createOscillator();
  const toneGain = context.createGain();
  tone.type = "triangle";
  tone.frequency.setValueAtTime(220, when);
  tone.frequency.exponentialRampToValueAtTime(120, when + 0.12);
  toneGain.gain.setValueAtTime(0.0001, when);
  toneGain.gain.exponentialRampToValueAtTime(0.22, when + 0.01);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);
  tone.connect(toneGain).connect(context.destination);
  tone.start(when);
  tone.stop(when + 0.16);
}

function playHat(context, when, accent) {
  const noise = context.createBufferSource();
  noise.buffer = getNoiseBuffer(context);

  const highPass = context.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.setValueAtTime(4200 + accent * 800, when);

  const bandPass = context.createBiquadFilter();
  bandPass.type = "bandpass";
  bandPass.frequency.setValueAtTime(7600, when);

  const gainNode = context.createGain();
  gainNode.gain.setValueAtTime(0.0001, when);
  gainNode.gain.exponentialRampToValueAtTime(0.2 + accent * 0.08, when + 0.004);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, when + 0.07);

  noise.connect(highPass).connect(bandPass).connect(gainNode).connect(context.destination);
  noise.start(when);
  noise.stop(when + 0.08);
}

function playAccentTone(context, when) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(480, when);
  oscillator.frequency.exponentialRampToValueAtTime(720, when + 0.08);
  gainNode.gain.setValueAtTime(0.0001, when);
  gainNode.gain.exponentialRampToValueAtTime(0.12, when + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, when + 0.11);
  oscillator.connect(gainNode).connect(context.destination);
  oscillator.start(when);
  oscillator.stop(when + 0.12);
}

function playCrewEcho() {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  const when = context.currentTime;
  playHat(context, when, 0.16);
  playAccentTone(context, when + 0.02);
}

function playDrumHit() {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  const when = context.currentTime;
  const accent = Math.min(1, getCurrentCombo() / 24);
  const step = state.profile.lifetimeHits % 4;

  if (step === 1) {
    playKick(context, when, accent);
    return;
  }

  if (step === 3) {
    playSnare(context, when, accent);
    return;
  }

  playHat(context, when, accent);

  if (getCurrentCombo() > 0 && getCurrentCombo() % 8 === 0) {
    playAccentTone(context, when + 0.02);
  }
}

function playPowerActivation(dropId) {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  const when = context.currentTime;

  switch (dropId) {
    case "laser-tom":
      playHat(context, when, 0.6);
      playAccentTone(context, when + 0.03);
      playAccentTone(context, when + 0.08);
      break;
    case "moon-riser":
      playKick(context, when, 0.9);
      playAccentTone(context, when + 0.06);
      playAccentTone(context, when + 0.12);
      break;
    default:
      playKick(context, when, 0.42);
      playAccentTone(context, when + 0.04);
      break;
  }
}

function maybeVibrate(pattern = 10) {
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}

function buildPlayerPayload() {
  return {
    id: state.profile.playerId,
    name: state.profile.name,
    seed: state.profile.seed,
    selectedDrop: getSelectedDrop().title,
  };
}

async function fetchRoomSnapshot() {
  const response = await fetch(`/api/jam-room?room=${encodeURIComponent(state.roomId)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to sync the room.");
  }

  return response.json();
}

async function loadRoomDirectory() {
  try {
    const response = await fetch("/api/jam-rooms?limit=6", {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Unable to load open stages.");
    }

    state.directory = sanitizeRoomDirectory(await response.json());
  } catch {
    state.directory = state.directory?.rooms?.length ? state.directory : createEmptyRoomDirectory();
  }

  renderTrafficBoard();
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
    throw new Error("Unable to update the room.");
  }

  return response.json();
}

function triggerCollaborativeMoments(previousRoom, nextRoom) {
  const previousPlayers = new Map((previousRoom.players || []).map((player) => [player.id, player]));
  const unseenEvents = [];

  for (const event of [...(nextRoom.events || [])].reverse()) {
    if (state.collab.seenEventIds.includes(event.id)) {
      continue;
    }

    unseenEvents.push(event);
    rememberRoomEvent(event.id);
  }

  for (const player of nextRoom.players || []) {
    if (player.id === state.profile.playerId) {
      continue;
    }

    const previousPlayer = previousPlayers.get(player.id);
    const tokenDelta = player.totalTokens - (previousPlayer?.totalTokens || 0);
    const hitFreshness = (player.lastBeatAt || 0) - (previousPlayer?.lastBeatAt || 0);

    if (tokenDelta > 0 && hitFreshness > 0) {
      const slot = stagePositionForPlayer(player.id, nextRoom);
      spawnGainBurst(tokenDelta, {
        label: `${player.name} +${formatCount(tokenDelta)} DRUM`,
        left: slot.x,
        top: slot.y,
        remote: true,
      });
      playCrewEcho();
    }
  }

  unseenEvents.forEach((event) => {
    if (!event?.id || event.playerId === state.profile.playerId) {
      return;
    }

    if (event.type !== "join" && event.type !== "reaction") {
      return;
    }

    const slot = stagePositionForPlayer(event.playerId, nextRoom);
    const label =
      event.type === "join"
        ? `${event.playerName} joined`
        : `${event.playerName} ${event.reaction || "HYPE"}`;

    spawnGainBurst(0, {
      label,
      left: slot.x,
      top: slot.y,
      remote: true,
    });
  });
}

function roomHasSavedActivity(room = state.room) {
  return Boolean(
    room?.totals?.tokens ||
      room?.totals?.hits ||
      room?.players?.length ||
      room?.events?.length ||
      room?.sequence,
  );
}

function applyRoomSnapshot(snapshot, source = "poll") {
  if (!snapshot?.roomId || snapshot.roomId !== state.roomId) {
    return;
  }

  if (source === "cache") {
    state.room = sanitizeStoredRoomSnapshot(snapshot, state.roomId) || createEmptyRoom(state.roomId);
    state.roomSyncLabel = "Saved history";
    state.shareStatus = `Loaded saved activity for ${state.roomId}`;
    renderAll();
    return;
  }

  if (state.collab.hasHydratedRoom) {
    triggerCollaborativeMoments(state.room, snapshot);
  } else {
    rememberRoomEvents(snapshot.events);
    state.collab.hasHydratedRoom = true;
  }

  state.room = snapshot?.roomId ? snapshot : createEmptyRoom(state.roomId);
  state.roomSyncLabel = source === "stream" ? "Live stream" : "Live";
  saveRoomSnapshotToCache(state.room);
  renderAll();
}

function hydrateRoomFromCache(roomId = state.roomId) {
  const cachedSnapshot = loadRoomSnapshotFromCache(roomId);

  if (!cachedSnapshot) {
    return false;
  }

  applyRoomSnapshot(cachedSnapshot, "cache");
  return true;
}

function closeRoomStream() {
  window.clearTimeout(roomStreamRetryTimer);
  roomStreamRetryTimer = undefined;

  if (!roomEventSource) {
    return;
  }

  roomEventSource.close();
  roomEventSource = undefined;
}

function scheduleRoomStreamReconnect() {
  if (roomEventSource || document.hidden || typeof EventSource === "undefined") {
    return;
  }

  window.clearTimeout(roomStreamRetryTimer);
  roomStreamRetryTimer = window.setTimeout(() => {
    openRoomStream(true);
  }, ROOM_STREAM_RETRY_MS);
}

function openRoomStream(isRetry = false) {
  if (typeof EventSource === "undefined" || document.hidden) {
    return;
  }

  closeRoomStream();
  state.roomSyncLabel = isRetry ? "Rejoining stream..." : "Connecting stream...";
  renderAll();

  const streamUrl = new URL("/api/jam-room-stream", window.location.origin);
  streamUrl.searchParams.set("room", state.roomId);

  const source = new EventSource(streamUrl.toString());
  roomEventSource = source;

  source.addEventListener("open", () => {
    if (roomEventSource !== source) {
      return;
    }

    state.roomSyncLabel = "Live stream";
    renderAll();
  });

  source.addEventListener("room", (event) => {
    if (roomEventSource !== source) {
      return;
    }

    try {
      applyRoomSnapshot(JSON.parse(event.data), "stream");
    } catch {
      state.roomSyncLabel = "Stream parsing error";
      renderAll();
    }
  });

  source.onerror = () => {
    if (roomEventSource !== source) {
      return;
    }

    state.roomSyncLabel = "Stream retrying";
    renderAll();
    source.close();
    roomEventSource = undefined;
    scheduleRoomStreamReconnect();
  };
}

async function joinRoom() {
  if (presenceInFlight) {
    return;
  }

  presenceInFlight = true;
  state.roomSyncLabel = "Joining...";
  renderAll();

  try {
    const snapshot = await postRoomAction("join");
    applyRoomSnapshot(snapshot);
  } catch (error) {
    state.roomSyncLabel = roomHasSavedActivity() ? "Saved history" : "Offline";
    state.shareStatus = roomHasSavedActivity()
      ? `Using saved room history while sync is paused: ${formatError(error)}`
      : `Room sync paused: ${formatError(error)}`;
    renderAll();
  } finally {
    presenceInFlight = false;
  }
}

async function syncRoom() {
  try {
    const snapshot = await fetchRoomSnapshot();
    applyRoomSnapshot(snapshot);
  } catch (error) {
    state.roomSyncLabel = roomHasSavedActivity() ? "Saved history" : "Retrying";
    state.shareStatus = roomHasSavedActivity()
      ? `Showing saved room history while live sync retries: ${formatError(error)}`
      : `Retrying room sync: ${formatError(error)}`;
    renderAll();
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
      combo: state.session.bestCombo,
    });
    state.session.pendingHits = Math.max(0, state.session.pendingHits - hits);
    state.session.pendingTokens = Math.max(0, state.session.pendingTokens - tokens);
    applyRoomSnapshot(snapshot);
  } catch (error) {
    state.roomSyncLabel = roomHasSavedActivity() ? "Saved history" : "Retrying";
    state.shareStatus = `Pulse retry queued: ${formatError(error)}`;
    renderAll();
  } finally {
    pulseInFlight = false;

    if (state.session.pendingHits) {
      schedulePulseFlush(1200);
    }
  }
}

async function sendReaction(reaction) {
  try {
    const snapshot = await postRoomAction("reaction", {
      reaction,
    });
    state.shareStatus = `${reaction} sent to ${state.roomId}`;
    applyRoomSnapshot(snapshot);
  } catch (error) {
    state.shareStatus = `Reaction failed: ${formatError(error)}`;
    renderAll();
  }
}

function activateSelectedPowerUp() {
  const now = Date.now();
  const drop = getSelectedDrop();
  const status = getPowerStatus(drop.id, now);

  if (status.kind !== "ready") {
    return;
  }

  state.power.activeDropId = drop.id;
  state.power.activeUntil = now + drop.power.durationMs;
  state.power.cooldowns[drop.id] = state.power.activeUntil + drop.power.cooldownMs;
  state.power.hitCounter = 0;
  state.shareStatus = `${drop.power.name} is live in ${state.roomId}.`;
  saveProfile();
  renderAll();
  spawnGainBurst(0, {
    label: `${drop.power.name} live`,
    left: 50,
    top: 34,
  });
  playPowerActivation(drop.id);
  maybeVibrate([18, 36, 18]);
}

function registerHit() {
  const now = Date.now();
  normalizePowerState(now);

  if (now - state.session.lastTapAt > getComboTimeoutMs(now)) {
    state.session.combo = 0;
  }

  state.session.combo += 1;
  state.session.bestCombo = Math.max(state.session.bestCombo, state.session.combo);
  state.session.lastTapAt = now;

  const activePowerDrop = getActivePowerDrop(now);
  const powerHitIndex = activePowerDrop ? state.power.hitCounter + 1 : 0;
  const gainBreakdown = computeGainForHit(state.session.combo, {
    now,
    powerHitIndex,
  });
  const gain = gainBreakdown.total;

  if (activePowerDrop) {
    state.power.hitCounter = powerHitIndex;
  }

  state.session.lastGain = gain;
  state.session.pendingHits += 1;
  state.session.pendingTokens += gain;
  state.profile.lifetimeHits += 1;
  state.profile.lifetimeTokens += gain;

  const previouslySelected = state.profile.selectedDropId;
  ensureSelectedDrop();
  if (previouslySelected !== state.profile.selectedDropId) {
    state.session.tokenNameCustom = false;
    state.session.tokenDescriptionCustom = false;
  }

  saveProfile();
  syncMintDraft();
  renderAll();
  pulsePad();
  spawnGainBurst(gain);
  if (gainBreakdown.triggerLabel) {
    spawnGainBurst(0, {
      label: gainBreakdown.triggerLabel,
      left: 62,
      top: 36,
    });
    playCrewEcho();
  }
  playDrumHit();
  maybeVibrate(gainBreakdown.triggerLabel ? [12, 18, 12] : 10);
  schedulePulseFlush();
}

function jumpToSupportPanel(panelId) {
  if (!SUPPORT_PANEL_IDS.includes(panelId)) {
    return;
  }

  const target = document.getElementById(panelId);

  if (!target) {
    return;
  }

  setActiveSupportPanel(panelId);
  setSupportPanelCollapsed(panelId, false);
  target.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function selectDrop(dropId) {
  const drop = getDropById(dropId);

  if (!isDropUnlocked(drop)) {
    return;
  }

  normalizePowerState();
  if (state.power.activeDropId && state.power.activeDropId !== drop.id) {
    clearActivePower();
  }

  state.profile.selectedDropId = drop.id;
  state.session.tokenNameCustom = false;
  state.session.tokenDescriptionCustom = false;
  state.shareStatus = `${drop.title} equipped. ${drop.power.name} is ${getPowerStatus(drop.id).kind === "ready" ? "ready to fire" : "cooling down"}.`;
  saveProfile();
  syncMintDraft(true);
  resetMintMessaging();
  joinRoom();
  renderAll();
}

function setMintTarget(target) {
  const nextTarget = sanitizeMintTarget(target);

  if (nextTarget === state.profile.mintTarget) {
    return;
  }

  state.profile.mintTarget = nextTarget;
  state.session.tokenNameCustom = false;
  state.session.tokenDescriptionCustom = false;
  saveProfile();
  syncMintDraft(true);
  resetMintMessaging(true);
  renderAll();
}

function scheduleAppearanceSync(delay = 180) {
  window.clearTimeout(appearanceSyncTimer);
  appearanceSyncTimer = window.setTimeout(() => {
    joinRoom();
  }, delay);
}

function applyProfileSeed(nextSeed, statusLabel) {
  state.profile.seed = normalizeSeed(nextSeed);
  state.session.tokenNameCustom = false;
  state.session.tokenDescriptionCustom = false;
  state.shareStatus = statusLabel || state.shareStatus;
  saveProfile();
  syncMintDraft(true);
  resetMintMessaging();
  renderAll();
  scheduleAppearanceSync();
}

function cycleSeedTrait(traitKey, direction = 1) {
  const trait = NOUN_TRAITS.find((candidate) => candidate.key === traitKey);

  if (!trait || !imageDataLoaded) {
    return;
  }

  const currentSeed = normalizeSeed(state.profile.seed);
  const nextSeed = {
    ...currentSeed,
    [trait.key]: wrapIndex(currentSeed[trait.key] + direction, trait.count()),
  };
  const nextNoun = buildNoun(nextSeed);

  applyProfileSeed(nextSeed, `${trait.label} set to ${nextNoun.labels[trait.key]}.`);
}

function randomizeAvatar() {
  const nextSeed = randomSeed();
  const nextNoun = buildNoun(nextSeed);
  applyProfileSeed(nextSeed, `Noun regenerated: ${nextNoun.labels.head}.`);
}

function randomizePlayerName() {
  const nextName = buildRandomPlayerName();
  updatePlayerName(nextName, `Stage name switched to ${nextName}.`);
}

function remixProfile() {
  const nextSeed = randomSeed();
  const nextNoun = buildNoun(nextSeed);
  const nextName = buildRandomPlayerName();

  state.profile.name = nextName;
  state.profile.seed = normalizeSeed(nextSeed);
  state.session.tokenNameCustom = false;
  state.session.tokenDescriptionCustom = false;
  state.shareStatus = `Full remix loaded: ${nextName} with ${nextNoun.labels.head}.`;
  saveProfile();
  syncMintDraft(true);
  resetMintMessaging();
  renderAll();
  scheduleAppearanceSync();
}

function toggleSound() {
  state.profile.soundEnabled = !state.profile.soundEnabled;
  saveProfile();
  renderSoundButton();

  if (!state.profile.soundEnabled && state.audioContext?.state === "running") {
    state.audioContext.suspend().catch(() => {});
  }
}

function updatePlayerName(value, statusLabel = "") {
  state.profile.name = sanitizeName(value);
  state.shareStatus = statusLabel || state.shareStatus;
  saveProfile();
  syncMintDraft();
  renderAll();
  window.clearTimeout(nameSyncTimer);
  nameSyncTimer = window.setTimeout(() => {
    joinRoom();
  }, 250);
}

function updateRoom(nextRoomId) {
  const normalized = sanitizeRoomId(nextRoomId);

  if (normalized === state.roomId) {
    elements.roomInput.value = state.roomId;
    return;
  }

  state.roomId = normalized;
  persistRoomId(state.roomId);
  state.room = createEmptyRoom(normalized);
  state.collab.hasHydratedRoom = false;
  state.collab.seenEventIds = [];
  state.shareStatus = `Switched to ${normalized}`;
  state.roomSyncLabel = "Syncing...";
  updateRoomInUrl();
  syncMintDraft();
  if (!hydrateRoomFromCache(normalized)) {
    renderAll();
  }
  openRoomStream();
  joinRoom();
  syncRoom();
}

async function shareRoom() {
  const url = new URL(window.location.href);
  url.searchParams.set("room", state.roomId);
  const shareText = `Join my Drum Nouns Jam room: ${url.toString()}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: "Drum Nouns Jam",
        text: shareText,
        url: url.toString(),
      });
      state.shareStatus = `Shared ${state.roomId}`;
      renderAll();
      return;
    }

    await navigator.clipboard.writeText(url.toString());
    state.shareStatus = "Room link copied";
    renderAll();
  } catch (error) {
    state.shareStatus = `Share failed: ${formatError(error)}`;
    renderAll();
  }
}

async function ensureTezosToolkit() {
  if (!tezosSdkPromise) {
    const tezosClientUrl = new URL("/tezos-client.js", window.location.origin);
    tezosSdkPromise = import(tezosClientUrl.toString());
  }

  tezosSdk = tezosSdk || (await tezosSdkPromise);

  if (!tezosToolkit) {
    tezosToolkit = tezosSdk.createTezosToolkit(TEZOS_MINT.rpcUrl);
  }

  return {
    ...tezosSdk,
    tezosToolkit,
  };
}

function buildTezosWalletOptions() {
  return {
    name: "Drum Nouns Jam",
    description: "Mobile-friendly utility for collecting and minting DRUM Nouns drops.",
    appUrl: window.location.origin,
    colorMode: "light",
    featuredWallets: ["kukai"],
    network: {
      type: TEZOS_MINT.networkType,
      rpcUrl: TEZOS_MINT.rpcUrl,
    },
    preferredNetwork: TEZOS_MINT.networkType,
  };
}

function buildTezosPermissionRequest() {
  return {
    network: {
      type: TEZOS_MINT.networkType,
      rpcUrl: TEZOS_MINT.rpcUrl,
    },
  };
}

async function disconnectWalletInstance() {
  if (!walletInstance) {
    return;
  }

  const activeWallet = walletInstance;
  walletInstance = undefined;

  if (tezosSdk?.disconnectTezosWallet) {
    await tezosSdk.disconnectTezosWallet(activeWallet);
    return;
  }

  await activeWallet.disconnect();
}

async function syncWalletConnection(toolkit, address) {
  toolkit.setWalletProvider(walletInstance);
  connectedAddress = address;
  const balanceMutez = await toolkit.tz.getBalance(address);
  connectedBalance = `${balanceMutez.div(1000000).toFixed(4)} tez`;
  resetMintMessaging();
}

async function restoreWalletSession() {
  try {
    const { createTezosWallet, detectTezosExtensions, getActiveWalletAccount, tezosToolkit: toolkit } =
      await ensureTezosToolkit();
    const extensions = detectTezosExtensions ? await detectTezosExtensions() : [];

    if (!extensions.length) {
      resetMintMessaging(true);
      renderWalletState();
      return;
    }

    walletInstance = createTezosWallet(buildTezosWalletOptions());
    const activeAccount = await getActiveWalletAccount(walletInstance);

    if (!activeAccount?.address) {
      await disconnectWalletInstance().catch(() => {});
      connectedAddress = "";
      connectedBalance = "";
      resetMintMessaging(true);
      renderWalletState();
      return;
    }

    await syncWalletConnection(toolkit, activeAccount.address);
    walletStatusMessage = `Wallet reconnected on ${TEZOS_MINT.networkLabel}.`;
  } catch {
    await disconnectWalletInstance().catch(() => {});
    connectedAddress = "";
    connectedBalance = "";
    resetMintMessaging(true);
  }

  renderWalletState();
}

async function connectWallet() {
  walletBusy = true;
  walletStatusMessage = "Loading the Tezos wallet toolkit...";
  renderWalletState();

  try {
    const { createTezosWallet, detectTezosExtensions, getActiveWalletAccount, tezosToolkit: toolkit } =
      await ensureTezosToolkit();
    const extensions = detectTezosExtensions ? await detectTezosExtensions() : [];

    if (walletInstance) {
      await disconnectWalletInstance().catch(() => {});
    }

    if (!extensions.length) {
      throw new Error(
        "No Tezos browser wallet was detected. Open Kukai or another Tezos wallet extension in this browser, then try again.",
      );
    }

    walletInstance = createTezosWallet(buildTezosWalletOptions());

    walletStatusMessage = extensions.length === 1
      ? `Open ${extensions[0].name}, then approve the Beacon connection request.`
      : "Choose a Tezos wallet extension, then approve the Beacon connection request.";
    renderWalletState();

    await walletInstance.requestPermissions(buildTezosPermissionRequest());

    const activeAccount = await getActiveWalletAccount(walletInstance);

    if (!activeAccount?.address) {
      throw new Error("Wallet connected, but no Tezos address was returned.");
    }

    await syncWalletConnection(toolkit, activeAccount.address);
  } catch (error) {
    await disconnectWalletInstance().catch(() => {});
    connectedAddress = "";
    connectedBalance = "";
    walletStatusMessage = `Wallet connection failed: ${formatError(error)}`;
    mintStatusMessage = buildMintContext().disconnectedStatus;
  } finally {
    walletBusy = false;
    renderWalletState();
  }
}

async function postMintToFeed(context, opHash) {
  const response = await fetch("/api/mint-feed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomId: state.roomId,
      playerName: state.profile.name,
      target: context.target,
      dropTitle: context.drop.title,
      nounHead: context.noun.labels.head,
      opHash,
      explorerUrl: `${TEZOS_MINT.explorerBase}/${opHash}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Mint feed update failed with ${response.status}`);
  }
}

async function disconnectWallet() {
  if (!walletInstance) {
    return;
  }

  walletBusy = true;
  walletStatusMessage = "Disconnecting wallet...";
  renderWalletState();

  try {
    await disconnectWalletInstance();
    walletStatusMessage = "Wallet disconnected.";
  } catch (error) {
    walletStatusMessage = `Wallet disconnect ran into an issue: ${formatError(error)}`;
  }

  connectedAddress = "";
  connectedBalance = "";
  resetMintMessaging(true);
  mintResultMarkup = "";
  walletBusy = false;
  renderWalletState();
}

async function mintCurrentAsset() {
  if (!walletInstance || !connectedAddress || mintBusy) {
    return;
  }

  mintBusy = true;
  mintResultMarkup = "";
  const context = buildMintContext();
  mintStatusMessage = context.prepareStatus;
  renderWalletState();

  try {
    const { MichelsonMap, stringToBytes, tezosToolkit: toolkit } = await ensureTezosToolkit();
    const noun = context.noun;
    const imageUrl = buildNounImageUrl(noun.seed);
    const metadataUrl = buildTokenMetadataUrl(noun.seed);
    const metadata = new MichelsonMap();

    metadata.set("name", stringToBytes(getTokenName()));
    metadata.set("symbol", stringToBytes(context.symbol));
    metadata.set("decimals", stringToBytes("0"));
    metadata.set("artifactUri", stringToBytes(imageUrl));
    metadata.set("displayUri", stringToBytes(imageUrl));
    metadata.set("thumbnailUri", stringToBytes(imageUrl));
    metadata.set("description", stringToBytes(getTokenDescription()));
    metadata.set("externalUri", stringToBytes(metadataUrl));

    toolkit.setWalletProvider(walletInstance);
    const contract = await toolkit.wallet.at(TEZOS_MINT.contractAddress);

    mintStatusMessage = context.approvalStatus;
    renderWalletState();

    const operation = await contract.methodsObject
      .mint([
        {
          to_: connectedAddress,
          metadata,
        },
      ])
      .send();

    mintStatusMessage = `Waiting for ${operation.opHash} to confirm on ${TEZOS_MINT.networkLabel}...`;
    renderWalletState();

    await operation.confirmation(2);

    state.profile.mintedDrops[context.mintedKey] = operation.opHash;
    saveProfile();
    await postMintToFeed(context, operation.opHash).catch(() => {});
    renderCollection();
    renderMintControls();
    mintStatusMessage = `${context.successStatus} Market board updated.`;
    mintResultMarkup = `<a href="${TEZOS_MINT.explorerBase}/${operation.opHash}" target="_blank" rel="noreferrer">View operation ${operation.opHash}</a>`;
  } catch (error) {
    mintStatusMessage = `Mint failed: ${formatError(error)}`;
  } finally {
    mintBusy = false;
    renderWalletState();
  }
}

function bindEvents() {
  elements.randomizeNameButton.addEventListener("click", randomizePlayerName);
  elements.randomizeAvatarButton.addEventListener("click", randomizeAvatar);
  elements.randomizeProfileButton.addEventListener("click", remixProfile);
  elements.soundToggleButton.addEventListener("click", toggleSound);
  elements.shareRoomButton.addEventListener("click", shareRoom);
  elements.activatePowerUpButton.addEventListener("click", activateSelectedPowerUp);
  elements.walletButton.addEventListener("click", connectWallet);
  elements.disconnectWalletButton.addEventListener("click", disconnectWallet);
  elements.mintButton.addEventListener("click", mintCurrentAsset);
  elements.mintDropTargetButton.addEventListener("click", () => {
    setMintTarget(MINT_TARGETS.DROP);
  });
  elements.mintNounTargetButton.addEventListener("click", () => {
    setMintTarget(MINT_TARGETS.NOUN);
  });

  elements.playerNameInput.addEventListener("input", (event) => {
    updatePlayerName(event.currentTarget.value);
  });

  elements.jamGuide?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-guide-action]");

    if (!trigger) {
      return;
    }

    const action = trigger.dataset.guideAction || "";

    switch (action) {
      case "jump":
        jumpToSupportPanel(trigger.dataset.guidePanel || "");
        break;
      case "share":
        shareRoom();
        break;
      case "power":
        activateSelectedPowerUp();
        break;
      case "reaction":
        sendReaction(trigger.dataset.guideReaction || "BOOM");
        break;
      default:
        break;
    }
  });

  elements.supportRail?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-support-jump]");

    if (!trigger) {
      return;
    }

    const panelId = trigger.dataset.supportJump || "";
    setActiveSupportPanel(panelId);
    setSupportPanelCollapsed(panelId, false);
  });

  elements.trafficRoomList?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-room-hop]");

    if (!trigger) {
      return;
    }

    updateRoom(trigger.dataset.roomHop || DEFAULT_ROOM_ID);
  });

  supportToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      toggleSupportPanel(button.dataset.supportToggle || "");
    });
  });

  elements.roomInput.addEventListener("change", (event) => {
    updateRoom(event.currentTarget.value);
  });

  elements.roomInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      updateRoom(event.currentTarget.value);
    }
  });

  elements.drumPad.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    registerHit();
  });

  elements.drumPad.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      registerHit();
    }
  });

  reactionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      sendReaction(button.dataset.reaction || "CLAP");
    });
  });

  elements.unlockShelf.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-drop-select]");

    if (!trigger) {
      return;
    }

    selectDrop(trigger.dataset.dropSelect);
  });

  elements.nounTraitList.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-trait-key]");

    if (!trigger) {
      return;
    }

    const direction = Number.parseInt(trigger.dataset.traitStep || "1", 10);
    cycleSeedTrait(trigger.dataset.traitKey, direction < 0 ? -1 : 1);
  });

  elements.tokenName.addEventListener("input", () => {
    state.session.tokenNameCustom = Boolean(elements.tokenName.value.trim());
    renderMintLinks();
  });

  elements.tokenDescription.addEventListener("input", () => {
    state.session.tokenDescriptionCustom = Boolean(elements.tokenDescription.value.trim());
    renderMintLinks();
  });

  elements.downloadSvgButton.addEventListener("click", () => {
    const noun = getCurrentNoun();
    triggerDownload(buildNounImageUrl(noun.seed), `${createFilenameStem()}.svg`);
  });

  elements.downloadMetadataButton.addEventListener("click", () => {
    const noun = getCurrentNoun();
    triggerDownload(buildTokenMetadataUrl(noun.seed), `${createFilenameStem()}-metadata.json`);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      flushPendingPulse(true);
      closeRoomStream();
      return;
    }

    openRoomStream();
    joinRoom();
    syncRoom();
    loadRoomDirectory();
  });
}

async function loadImageData() {
  const response = await fetch("/data/image-data.json");

  if (!response.ok) {
    throw new Error("Failed to load official Nouns image data.");
  }

  imageData = await response.json();
  imageDataLoaded = true;
}

function bootstrapProfile() {
  const stored = loadStoredProfile();
  state.profile.playerId = stored?.playerId || createId("player");
  state.profile.name = sanitizeName(stored?.name || "Rim Rider");
  state.profile.seed = normalizeSeed(stored?.seed || randomSeed());
  state.profile.lifetimeTokens = clampNumber(stored?.lifetimeTokens, 0, 9999999);
  state.profile.lifetimeHits = clampNumber(stored?.lifetimeHits, 0, 9999999);
  state.profile.mintedDrops = stored?.mintedDrops && typeof stored.mintedDrops === "object"
    ? stored.mintedDrops
    : {};
  state.profile.mintTarget = sanitizeMintTarget(stored?.mintTarget);
  state.profile.selectedDropId = sanitizeText(
    stored?.selectedDropId || DROP_LIBRARY[0].id,
    DROP_LIBRARY[0].id,
    24,
  );
  state.profile.soundEnabled = stored?.soundEnabled !== false;
  state.power = sanitizePowerState(stored?.powerState);
  state.ui.supportPanels = sanitizeSupportPanelState(stored?.supportPanelState);
  normalizePowerState();
  ensureSelectedDrop();
  resetMintMessaging();
  saveProfile();
}

function startLoops() {
  window.clearInterval(roomPollTimer);
  window.clearInterval(roomHeartbeatTimer);
  window.clearInterval(roomDirectoryTimer);
  window.clearInterval(comboTimer);

  roomPollTimer = window.setInterval(() => {
    if (!roomEventSource) {
      syncRoom();
    }
  }, ROOM_POLL_MS);

  roomHeartbeatTimer = window.setInterval(() => {
    joinRoom();
  }, ROOM_HEARTBEAT_MS);

  roomDirectoryTimer = window.setInterval(() => {
    loadRoomDirectory();
  }, DIRECTORY_POLL_MS);

  comboTimer = window.setInterval(() => {
    normalizePowerState();
    renderScoreboard();
    renderPowerUpPanel();
    renderJamGuide();
    renderCollection();
    renderCollabExperience();
  }, 250);
}

await loadImageData();
bootstrapProfile();
state.roomId = roomIdFromUrl();
persistRoomId(state.roomId);
updateRoomInUrl();
bindEvents();
await restoreWalletSession();
setupSupportObserver();
setupReturnToDrumObserver();
syncMintDraft(true);
if (!hydrateRoomFromCache()) {
  renderAll();
}
await joinRoom();
await syncRoom();
await loadRoomDirectory();
openRoomStream();
startLoops();
