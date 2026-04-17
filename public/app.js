import {
  init_browser_shims
} from "./chunks/chunk-TF5QER46.js";

// src/app.js
init_browser_shims();

// public/lib/nouns-svg.js
init_browser_shims();
function segmentWidth(left, count, right) {
  const available = right - left;
  return count <= available ? count : available;
}
function decodePart(part) {
  const source = part.data.replace(/^0x/, "");
  const bounds = {
    top: Number.parseInt(source.slice(2, 4), 16),
    right: Number.parseInt(source.slice(4, 6), 16),
    bottom: Number.parseInt(source.slice(6, 8), 16),
    left: Number.parseInt(source.slice(8, 10), 16)
  };
  const rects = source.slice(10).match(/.{1,4}/g)?.map((chunk) => [Number.parseInt(chunk.slice(0, 2), 16), Number.parseInt(chunk.slice(2, 4), 16)]) ?? [];
  return { bounds, rects };
}
function buildSVG(parts, palette, background) {
  const svg = parts.reduce((markup, part) => {
    const rectMarkup = [];
    const { bounds, rects } = decodePart(part);
    let left = bounds.left;
    let top = bounds.top;
    rects.forEach(([count, paletteIndex]) => {
      let remaining = count;
      const fill = palette[paletteIndex];
      while (remaining > 0) {
        const width = segmentWidth(left, remaining, bounds.right);
        if (paletteIndex !== 0) {
          rectMarkup.push(
            `<rect width="${10 * width}" height="10" x="${10 * left}" y="${10 * top}" fill="#${fill}" />`
          );
        }
        left += width;
        remaining -= width;
        if (left === bounds.right) {
          left = bounds.left;
          top += 1;
        }
      }
    });
    return markup + rectMarkup.join("");
  }, `<svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#${background}" />`);
  return `${svg}</svg>`;
}

// src/app.js
var TEZOS_MINT = {
  contractAddress: "KT1NbqYinUijW68V3fxboo4EzQPFgRcdfaYQ",
  explorerBase: "https://shadownet.tzkt.io",
  networkLabel: "Tezos Shadownet",
  networkType: "shadownet",
  rpcUrl: "https://rpc.shadownet.teztnets.com",
  symbol: "DRUM"
};
var STORAGE_KEY = "drum-nouns-jam.v1";
var DEFAULT_ROOM_ID = "global-jam";
var COMBO_TIMEOUT_MS = 2400;
var ROOM_POLL_MS = 4500;
var ROOM_HEARTBEAT_MS = 12e3;
var PULSE_FLUSH_DELAY_MS = 900;
var DROP_LIBRARY = [
  {
    id: "garage-kick",
    title: "Garage Kick",
    tier: "Starter",
    threshold: 0,
    blurb: "First crate in the room. Warm, punchy, always collectible."
  },
  {
    id: "cymbal-bloom",
    title: "Cymbal Bloom",
    tier: "Crew",
    threshold: 40,
    blurb: "Unlocked once your taps start opening the room up."
  },
  {
    id: "laser-tom",
    title: "Laser Tom",
    tier: "Glow",
    threshold: 140,
    blurb: "Sharper hits, brighter noun silhouettes, louder social energy."
  },
  {
    id: "street-parade",
    title: "Street Parade",
    tier: "Rare",
    threshold: 320,
    blurb: "A full-room drop for drummers who keep the groove moving."
  },
  {
    id: "moon-riser",
    title: "Moon Riser",
    tier: "Legend",
    threshold: 700,
    blurb: "High-score collectible for the players carrying the whole jam."
  }
];
var elements = {
  roomInput: document.querySelector("#room-input"),
  shareRoomButton: document.querySelector("#share-room-button"),
  playerAvatar: document.querySelector("#player-avatar"),
  playerNameInput: document.querySelector("#player-name-input"),
  identityLine: document.querySelector("#identity-line"),
  randomizeAvatarButton: document.querySelector("#randomize-avatar-button"),
  soundToggleButton: document.querySelector("#sound-toggle-button"),
  playerTokenCount: document.querySelector("#player-token-count"),
  roomTokenCount: document.querySelector("#room-token-count"),
  comboCount: document.querySelector("#combo-count"),
  crewMultiplier: document.querySelector("#crew-multiplier"),
  drumPad: document.querySelector("#drum-pad"),
  drumGain: document.querySelector("#drum-gain"),
  comboCaption: document.querySelector("#combo-caption"),
  unlockShelf: document.querySelector("#unlock-shelf"),
  collectionStatus: document.querySelector("#collection-status"),
  crewCount: document.querySelector("#crew-count"),
  roomSyncStatus: document.querySelector("#room-sync-status"),
  roomStatusLine: document.querySelector("#room-status-line"),
  crewList: document.querySelector("#crew-list"),
  shareStatus: document.querySelector("#share-status"),
  feedList: document.querySelector("#feed-list"),
  selectedDropPill: document.querySelector("#selected-drop-pill"),
  walletButton: document.querySelector("#wallet-button"),
  disconnectWalletButton: document.querySelector("#disconnect-wallet-button"),
  walletStatus: document.querySelector("#wallet-status-line"),
  walletAddress: document.querySelector("#wallet-address"),
  walletBalance: document.querySelector("#wallet-balance"),
  networkName: document.querySelector("#network-name"),
  contractAddress: document.querySelector("#contract-address"),
  tokenName: document.querySelector("#token-name-input"),
  tokenDescription: document.querySelector("#token-description-input"),
  mintButton: document.querySelector("#mint-button"),
  mintStatus: document.querySelector("#mint-status-line"),
  mintResult: document.querySelector("#mint-result-line"),
  nounImageLink: document.querySelector("#noun-image-link"),
  tokenMetadataLink: document.querySelector("#token-metadata-link"),
  downloadSvgButton: document.querySelector("#download-svg-button"),
  downloadMetadataButton: document.querySelector("#download-metadata-button")
};
var reactionButtons = [...document.querySelectorAll(".reaction-button")];
var imageData;
var tezosSdkPromise;
var tezosSdk;
var tezosToolkit;
var walletInstance;
var connectedAddress = "";
var connectedBalance = "";
var walletBusy = false;
var mintBusy = false;
var walletStatusMessage = "Connect a Tezos browser wallet to collect your current DRUM drop.";
var mintStatusMessage = "Pick a drop and connect your wallet.";
var mintResultMarkup = "";
var imageDataLoaded = false;
var pulseFlushTimer;
var roomPollTimer;
var roomHeartbeatTimer;
var comboTimer;
var pulseInFlight = false;
var presenceInFlight = false;
var nameSyncTimer;
var state = {
  profile: {
    playerId: "",
    name: "",
    seed: null,
    lifetimeTokens: 0,
    lifetimeHits: 0,
    mintedDrops: {},
    selectedDropId: DROP_LIBRARY[0].id,
    soundEnabled: true
  },
  session: {
    combo: 0,
    bestCombo: 0,
    lastTapAt: 0,
    lastGain: 1,
    pendingHits: 0,
    pendingTokens: 0,
    tokenNameCustom: false,
    tokenDescriptionCustom: false
  },
  roomId: DEFAULT_ROOM_ID,
  room: createEmptyRoom(DEFAULT_ROOM_ID),
  roomSyncLabel: "Syncing...",
  shareStatus: "Invite the room"
};
function createEmptyRoom(roomId) {
  return {
    roomId,
    totals: {
      tokens: 0,
      hits: 0
    },
    metrics: {
      activeCount: 0,
      crewMultiplier: 1,
      recentReactions: 0,
      syncedBursts: 0
    },
    players: [],
    events: [],
    updatedAt: Date.now()
  };
}
function sanitizeText(value, fallback, maxLength = 24, pattern = /[^a-zA-Z0-9 _-]/g) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").replace(pattern, "").trim();
  return (normalized || fallback).slice(0, maxLength);
}
function sanitizeRoomId(value) {
  return sanitizeText(value, DEFAULT_ROOM_ID, 24).toLowerCase().replaceAll(" ", "-");
}
function sanitizeName(value) {
  return sanitizeText(value, "Rim Rider", 24);
}
function clampNumber(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const numeric = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(numeric) || numeric < 0) {
    return fallback;
  }
  return Math.min(numeric, max);
}
function humanize(value) {
  return value.replace(/^(body|accessory|head|glasses)-/, "").replaceAll("-", " ");
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
function formatTimeAgo(timestamp) {
  if (!timestamp) {
    return "now";
  }
  const delta = Math.max(0, Date.now() - timestamp);
  if (delta < 8e3) {
    return "now";
  }
  if (delta < 6e4) {
    return `${Math.round(delta / 1e3)}s ago`;
  }
  if (delta < 36e5) {
    return `${Math.round(delta / 6e4)}m ago`;
  }
  return `${Math.round(delta / 36e5)}h ago`;
}
function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function createId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
function randomIndex(length) {
  return Math.floor(Math.random() * length);
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
    glasses: clampNumber(seed?.glasses, 0, imageData.images.glasses.length - 1)
  };
}
function randomSeed() {
  return {
    background: randomIndex(imageData.bgcolors.length),
    body: randomIndex(imageData.images.bodies.length),
    accessory: randomIndex(imageData.images.accessories.length),
    head: randomIndex(imageData.images.heads.length),
    glasses: randomIndex(imageData.images.glasses.length)
  };
}
function buildSeedSearch(seed, extras = {}) {
  const params = new URLSearchParams();
  Object.entries(seed).forEach(([key, value]) => {
    params.set(key, String(value));
  });
  Object.entries(extras).forEach(([key, value]) => {
    if (value === void 0 || value === null) {
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
    imageData.images.glasses[resolvedSeed.glasses]
  ];
  return {
    seed: resolvedSeed,
    svg: buildSVG(parts, imageData.palette, imageData.bgcolors[resolvedSeed.background]),
    labels: {
      background: resolvedSeed.background === 0 ? "Cool Grey" : "Warm Grey",
      body: humanize(parts[0].filename),
      accessory: humanize(parts[1].filename),
      head: humanize(parts[2].filename),
      glasses: humanize(parts[3].filename)
    }
  };
}
function getCurrentNoun() {
  return buildNoun(state.profile.seed);
}
function getDropById(dropId) {
  return DROP_LIBRARY.find((drop) => drop.id === dropId) || DROP_LIBRARY[0];
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
function buildDefaultTokenName() {
  const drop = getSelectedDrop();
  const noun = getCurrentNoun();
  return `${drop.title} / ${state.profile.name} / ${noun.labels.head}`;
}
function buildDefaultTokenDescription() {
  const drop = getSelectedDrop();
  const noun = getCurrentNoun();
  return `A Drum Nouns Jam collectible for ${state.profile.name} in room ${state.roomId}. Built with a ${noun.labels.head} head, ${noun.labels.accessory} accessory, ${noun.labels.body} body, and ${noun.labels.glasses} glasses after generating ${formatCount(state.profile.lifetimeTokens)} DRUM.`;
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
  const drop = getSelectedDrop();
  const url = new URL("/api/token-metadata", window.location.origin);
  url.search = buildSeedSearch(seed, {
    name: getTokenName(),
    description: getTokenDescription(),
    room: state.roomId,
    player: state.profile.name,
    drop: drop.title,
    tier: drop.tier,
    score: state.profile.lifetimeTokens,
    combo: state.session.bestCombo
  }).toString();
  return url.toString();
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
  const drop = getSelectedDrop();
  const noun = getCurrentNoun();
  return sanitizeText(
    `${state.profile.name}-${drop.id}-${noun.labels.head}`,
    "drum-nouns-jam",
    64,
    /[^a-zA-Z0-9 -]/g
  ).toLowerCase().replaceAll(" ", "-");
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
      selectedDropId: state.profile.selectedDropId,
      soundEnabled: state.profile.soundEnabled
    })
  );
}
function roomIdFromUrl() {
  const url = new URL(window.location.href);
  return sanitizeRoomId(url.searchParams.get("room"));
}
function updateRoomInUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("room", state.roomId);
  window.history.replaceState({}, "", url);
}
function getCurrentCombo() {
  if (Date.now() - state.session.lastTapAt > COMBO_TIMEOUT_MS) {
    return 0;
  }
  return state.session.combo;
}
function getCrewMultiplier() {
  return Number(state.room.metrics?.crewMultiplier || 1);
}
function computeGainForHit(comboValue = getCurrentCombo() + 1) {
  const crewMultiplier = getCrewMultiplier();
  const comboBonus = 1 + Math.min(1.5, Math.floor(comboValue / 4) * 0.16);
  return Math.max(1, Math.round(comboBonus * crewMultiplier));
}
function syncMintDraft(force = false) {
  if (force || !state.session.tokenNameCustom || !elements.tokenName.value.trim()) {
    elements.tokenName.value = buildDefaultTokenName();
    state.session.tokenNameCustom = false;
  }
  if (force || !state.session.tokenDescriptionCustom || !elements.tokenDescription.value.trim()) {
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
  elements.identityLine.textContent = `${noun.labels.head} head, ${noun.labels.accessory} accessory, ${noun.labels.glasses} glasses. Equipped for ${drop.title}.`;
  if (document.activeElement !== elements.playerNameInput) {
    elements.playerNameInput.value = state.profile.name;
  }
  elements.selectedDropPill.textContent = drop.title;
  applyNounCursor(noun.svg);
}
function renderScoreboard() {
  const combo = getCurrentCombo();
  const nextGain = computeGainForHit(combo + 1);
  const roomTotal = (state.room.totals?.tokens || 0) + state.session.pendingTokens;
  elements.playerTokenCount.textContent = formatCount(state.profile.lifetimeTokens);
  elements.roomTokenCount.textContent = formatCount(roomTotal);
  elements.comboCount.textContent = `${combo}x`;
  elements.crewMultiplier.textContent = formatMultiplier(getCrewMultiplier());
  elements.drumGain.textContent = `+${state.session.lastGain || nextGain} DRUM`;
  elements.comboCaption.textContent = combo > 0 ? `Combo alive. Next hit is worth ${nextGain} DRUM.` : `Tap to warm up the groove. Next hit is worth ${nextGain} DRUM.`;
}
function renderCollection() {
  const currentDrop = getSelectedDrop();
  const noun = getCurrentNoun();
  const unlocked = getUnlockedDrops();
  const nextDrop = DROP_LIBRARY.find((drop) => !isDropUnlocked(drop));
  elements.collectionStatus.textContent = nextDrop ? `${formatCount(nextDrop.threshold - state.profile.lifetimeTokens)} DRUM until ${nextDrop.title}.` : "Every drop is unlocked. The room is fully loaded.";
  elements.unlockShelf.innerHTML = DROP_LIBRARY.map((drop) => {
    const unlockedState = isDropUnlocked(drop);
    const isSelected = currentDrop.id === drop.id;
    const mintedHash = state.profile.mintedDrops[drop.id];
    const buttonLabel = !unlockedState ? `Need ${formatCount(drop.threshold)} DRUM` : isSelected ? "Equipped" : "Equip drop";
    return `
      <article class="drop-card ${isSelected ? "is-selected" : ""} ${unlockedState ? "" : "is-locked"}">
        <div class="drop-preview" aria-hidden="true">${noun.svg}</div>
        <div class="drop-meta">
          <div class="drop-title-row">
            <strong>${escapeHtml(drop.title)}</strong>
            <span class="drop-tier">${escapeHtml(drop.tier)}</span>
          </div>
          <p class="drop-copy">${escapeHtml(drop.blurb)}</p>
          <p class="drop-copy">Unlock at ${formatCount(drop.threshold)} DRUM.</p>
          <p class="drop-copy">${mintedHash ? `Minted: ${escapeHtml(compactAddress(mintedHash))}` : unlockedState ? "Ready to mint on Tezos." : "Keep drumming to collect it."}</p>
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
function renderCrew() {
  const players = state.room.players || [];
  const activeCount = state.room.metrics?.activeCount || 0;
  elements.crewCount.textContent = `${activeCount} active`;
  elements.roomSyncStatus.textContent = state.roomSyncLabel;
  elements.roomStatusLine.textContent = activeCount > 1 ? `${activeCount} drummers are lighting up ${state.roomId}. Shared groove is running at ${formatMultiplier(getCrewMultiplier())}.` : `Share room ${state.roomId} to pull in more noun drummers and boost the crew multiplier.`;
  if (!players.length) {
    elements.crewList.innerHTML = '<div class="empty-state">No crew in the room yet. Share the link and be the first noun on stage.</div>';
    return;
  }
  elements.crewList.innerHTML = players.slice(0, 8).map((player) => {
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
              ${escapeHtml(player.selectedDrop || "Garage Kick")} \u2022 best combo ${player.bestCombo} \u2022 ${escapeHtml(formatTimeAgo(player.lastSeenAt))}
            </p>
          </div>
        </article>
      `;
  }).join("");
}
function renderFeed() {
  const events = state.room.events || [];
  elements.shareStatus.textContent = state.shareStatus;
  if (!events.length) {
    elements.feedList.innerHTML = '<div class="empty-state">The hype feed will fill with joins, combo bursts, and room reactions.</div>';
    return;
  }
  elements.feedList.innerHTML = events.slice(0, 8).map((event) => {
    const noun = buildNoun(event.seed);
    return `
        <article class="feed-item">
          <div class="feed-avatar" aria-hidden="true">${noun.svg}</div>
          <div class="feed-meta">
            <div class="feed-topline">
              <strong>${escapeHtml(event.playerName)}</strong>
              <span>${escapeHtml(formatTimeAgo(event.createdAt))}</span>
            </div>
            <p class="feed-text">${escapeHtml(event.message)}</p>
          </div>
        </article>
      `;
  }).join("");
}
function renderWalletState() {
  elements.networkName.textContent = TEZOS_MINT.networkLabel;
  elements.contractAddress.textContent = compactAddress(TEZOS_MINT.contractAddress);
  elements.walletAddress.textContent = compactAddress(connectedAddress);
  elements.walletBalance.textContent = connectedBalance || "-";
  elements.walletStatus.textContent = walletStatusMessage;
  elements.mintStatus.textContent = mintStatusMessage;
  elements.mintResult.innerHTML = mintResultMarkup;
  elements.walletButton.disabled = walletBusy;
  elements.walletButton.textContent = walletBusy ? "Connecting..." : connectedAddress ? "Reconnect wallet" : "Connect wallet";
  elements.disconnectWalletButton.hidden = !connectedAddress;
  elements.disconnectWalletButton.disabled = walletBusy;
  elements.mintButton.disabled = !connectedAddress || walletBusy || mintBusy;
  elements.mintButton.textContent = mintBusy ? "Minting..." : "Mint DRUM drop";
}
function renderSoundButton() {
  elements.soundToggleButton.textContent = state.profile.soundEnabled ? "Sound on" : "Sound off";
}
function renderAll() {
  renderPlayerIdentity();
  renderScoreboard();
  renderCollection();
  renderCrew();
  renderFeed();
  renderWalletState();
  renderSoundButton();
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
function spawnGainBurst(amount) {
  const burst = document.createElement("span");
  burst.className = "gain-burst";
  burst.textContent = `+${amount} DRUM`;
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
    state.audioContext.resume().catch(() => {
    });
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
  gainNode.gain.setValueAtTime(1e-4, when);
  gainNode.gain.exponentialRampToValueAtTime(0.7 + accent * 0.15, when + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(1e-4, when + 0.18);
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
  noiseGain.gain.setValueAtTime(1e-4, when);
  noiseGain.gain.exponentialRampToValueAtTime(0.36 + accent * 0.12, when + 0.01);
  noiseGain.gain.exponentialRampToValueAtTime(1e-4, when + 0.16);
  noise.connect(noiseFilter).connect(noiseGain).connect(context.destination);
  noise.start(when);
  noise.stop(when + 0.2);
  const tone = context.createOscillator();
  const toneGain = context.createGain();
  tone.type = "triangle";
  tone.frequency.setValueAtTime(220, when);
  tone.frequency.exponentialRampToValueAtTime(120, when + 0.12);
  toneGain.gain.setValueAtTime(1e-4, when);
  toneGain.gain.exponentialRampToValueAtTime(0.22, when + 0.01);
  toneGain.gain.exponentialRampToValueAtTime(1e-4, when + 0.14);
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
  gainNode.gain.setValueAtTime(1e-4, when);
  gainNode.gain.exponentialRampToValueAtTime(0.2 + accent * 0.08, when + 4e-3);
  gainNode.gain.exponentialRampToValueAtTime(1e-4, when + 0.07);
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
  gainNode.gain.setValueAtTime(1e-4, when);
  gainNode.gain.exponentialRampToValueAtTime(0.12, when + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(1e-4, when + 0.11);
  oscillator.connect(gainNode).connect(context.destination);
  oscillator.start(when);
  oscillator.stop(when + 0.12);
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
function maybeVibrate() {
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(10);
  }
}
function buildPlayerPayload() {
  return {
    id: state.profile.playerId,
    name: state.profile.name,
    seed: state.profile.seed,
    selectedDrop: getSelectedDrop().title
  };
}
async function fetchRoomSnapshot() {
  const response = await fetch(`/api/jam-room?room=${encodeURIComponent(state.roomId)}`, {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("Unable to sync the room.");
  }
  return response.json();
}
async function postRoomAction(action, payload = {}) {
  const response = await fetch("/api/jam-room", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      roomId: state.roomId,
      action,
      player: buildPlayerPayload(),
      ...payload
    })
  });
  if (!response.ok) {
    throw new Error("Unable to update the room.");
  }
  return response.json();
}
function applyRoomSnapshot(snapshot) {
  if (!snapshot?.roomId || snapshot.roomId !== state.roomId) {
    return;
  }
  state.room = snapshot?.roomId ? snapshot : createEmptyRoom(state.roomId);
  state.roomSyncLabel = "Live";
  renderAll();
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
    state.roomSyncLabel = "Offline";
    state.shareStatus = `Room sync paused: ${formatError(error)}`;
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
    state.roomSyncLabel = "Retrying";
    state.shareStatus = `Retrying room sync: ${formatError(error)}`;
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
      combo: state.session.bestCombo
    });
    state.session.pendingHits = Math.max(0, state.session.pendingHits - hits);
    state.session.pendingTokens = Math.max(0, state.session.pendingTokens - tokens);
    applyRoomSnapshot(snapshot);
  } catch (error) {
    state.roomSyncLabel = "Retrying";
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
      reaction
    });
    state.shareStatus = `${reaction} sent to ${state.roomId}`;
    applyRoomSnapshot(snapshot);
  } catch (error) {
    state.shareStatus = `Reaction failed: ${formatError(error)}`;
    renderAll();
  }
}
function registerHit() {
  const now = Date.now();
  if (now - state.session.lastTapAt > COMBO_TIMEOUT_MS) {
    state.session.combo = 0;
  }
  state.session.combo += 1;
  state.session.bestCombo = Math.max(state.session.bestCombo, state.session.combo);
  state.session.lastTapAt = now;
  const gain = computeGainForHit(state.session.combo);
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
  playDrumHit();
  maybeVibrate();
  schedulePulseFlush();
}
function selectDrop(dropId) {
  const drop = getDropById(dropId);
  if (!isDropUnlocked(drop)) {
    return;
  }
  state.profile.selectedDropId = drop.id;
  state.session.tokenNameCustom = false;
  state.session.tokenDescriptionCustom = false;
  saveProfile();
  syncMintDraft(true);
  joinRoom();
  renderAll();
}
function randomizeAvatar() {
  state.profile.seed = randomSeed();
  state.session.tokenNameCustom = false;
  state.session.tokenDescriptionCustom = false;
  saveProfile();
  syncMintDraft(true);
  joinRoom();
  renderAll();
}
function toggleSound() {
  state.profile.soundEnabled = !state.profile.soundEnabled;
  saveProfile();
  renderSoundButton();
  if (!state.profile.soundEnabled && state.audioContext?.state === "running") {
    state.audioContext.suspend().catch(() => {
    });
  }
}
function updatePlayerName(value) {
  state.profile.name = sanitizeName(value);
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
  state.room = createEmptyRoom(normalized);
  state.shareStatus = `Switched to ${normalized}`;
  updateRoomInUrl();
  syncMintDraft();
  renderAll();
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
        url: url.toString()
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
    tezosSdkPromise = import("./chunks/tezos-client-VNDLGO3Q.js");
  }
  tezosSdk = tezosSdk || await tezosSdkPromise;
  if (!tezosToolkit) {
    tezosToolkit = tezosSdk.createTezosToolkit(TEZOS_MINT.rpcUrl);
  }
  return {
    ...tezosSdk,
    tezosToolkit
  };
}
async function connectWallet() {
  walletBusy = true;
  walletStatusMessage = "Loading the Tezos wallet toolkit...";
  renderWalletState();
  try {
    const { createTezosWallet, tezosToolkit: toolkit } = await ensureTezosToolkit();
    if (walletInstance) {
      await walletInstance.disconnect().catch(() => {
      });
    }
    walletInstance = createTezosWallet({
      name: "Drum Nouns Jam",
      description: "Extension-first utility for collecting and minting DRUM Nouns drops.",
      appUrl: window.location.origin,
      network: {
        type: TEZOS_MINT.networkType,
        rpcUrl: TEZOS_MINT.rpcUrl
      },
      preferredNetwork: TEZOS_MINT.networkType
    });
    walletStatusMessage = "Open your Tezos browser wallet, approve the pairing request, and then confirm the connection.";
    renderWalletState();
    await walletInstance.requestPermissions();
    toolkit.setWalletProvider(walletInstance);
    connectedAddress = await walletInstance.getPKH();
    const balanceMutez = await toolkit.tz.getBalance(connectedAddress);
    connectedBalance = `${balanceMutez.div(1e6).toFixed(4)} tez`;
    walletStatusMessage = `Wallet connected on ${TEZOS_MINT.networkLabel}. Ready to mint ${getSelectedDrop().title}.`;
    mintStatusMessage = "Wallet ready. Review the DRUM metadata, then mint.";
  } catch (error) {
    connectedAddress = "";
    connectedBalance = "";
    walletInstance = void 0;
    walletStatusMessage = `Wallet connection failed: ${formatError(error)}`;
    mintStatusMessage = "Pick a drop and connect your wallet.";
  } finally {
    walletBusy = false;
    renderWalletState();
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
    await walletInstance.disconnect();
    walletStatusMessage = "Wallet disconnected.";
  } catch (error) {
    walletStatusMessage = `Wallet disconnect ran into an issue: ${formatError(error)}`;
  }
  walletInstance = void 0;
  connectedAddress = "";
  connectedBalance = "";
  mintStatusMessage = "Pick a drop and connect your wallet.";
  mintResultMarkup = "";
  walletBusy = false;
  renderWalletState();
}
async function mintCurrentDrop() {
  if (!walletInstance || !connectedAddress || mintBusy) {
    return;
  }
  mintBusy = true;
  mintResultMarkup = "";
  mintStatusMessage = `Preparing ${getSelectedDrop().title} for mint...`;
  renderWalletState();
  try {
    const { MichelsonMap, stringToBytes, tezosToolkit: toolkit } = await ensureTezosToolkit();
    const noun = getCurrentNoun();
    const imageUrl = buildNounImageUrl(noun.seed);
    const metadataUrl = buildTokenMetadataUrl(noun.seed);
    const metadata = new MichelsonMap();
    metadata.set("name", stringToBytes(getTokenName()));
    metadata.set("symbol", stringToBytes(TEZOS_MINT.symbol));
    metadata.set("decimals", stringToBytes("0"));
    metadata.set("artifactUri", stringToBytes(imageUrl));
    metadata.set("displayUri", stringToBytes(imageUrl));
    metadata.set("thumbnailUri", stringToBytes(imageUrl));
    metadata.set("description", stringToBytes(getTokenDescription()));
    metadata.set("externalUri", stringToBytes(metadataUrl));
    toolkit.setWalletProvider(walletInstance);
    const contract = await toolkit.wallet.at(TEZOS_MINT.contractAddress);
    mintStatusMessage = "Approve the DRUM mint in your wallet.";
    renderWalletState();
    const operation = await contract.methodsObject.mint([
      {
        to_: connectedAddress,
        metadata
      }
    ]).send();
    mintStatusMessage = `Waiting for ${operation.opHash} to confirm on ${TEZOS_MINT.networkLabel}...`;
    renderWalletState();
    await operation.confirmation(2);
    const selectedDrop = getSelectedDrop();
    state.profile.mintedDrops[selectedDrop.id] = operation.opHash;
    saveProfile();
    renderCollection();
    mintStatusMessage = `${selectedDrop.title} confirmed on ${TEZOS_MINT.networkLabel}.`;
    mintResultMarkup = `<a href="${TEZOS_MINT.explorerBase}/${operation.opHash}" target="_blank" rel="noreferrer">View operation ${operation.opHash}</a>`;
  } catch (error) {
    mintStatusMessage = `Mint failed: ${formatError(error)}`;
  } finally {
    mintBusy = false;
    renderWalletState();
  }
}
function bindEvents() {
  elements.randomizeAvatarButton.addEventListener("click", randomizeAvatar);
  elements.soundToggleButton.addEventListener("click", toggleSound);
  elements.shareRoomButton.addEventListener("click", shareRoom);
  elements.walletButton.addEventListener("click", connectWallet);
  elements.disconnectWalletButton.addEventListener("click", disconnectWallet);
  elements.mintButton.addEventListener("click", mintCurrentDrop);
  elements.playerNameInput.addEventListener("input", (event) => {
    updatePlayerName(event.currentTarget.value);
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
      return;
    }
    joinRoom();
    syncRoom();
  });
}
async function loadImageData() {
  const response = await fetch("./data/image-data.json");
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
  state.profile.mintedDrops = stored?.mintedDrops && typeof stored.mintedDrops === "object" ? stored.mintedDrops : {};
  state.profile.selectedDropId = sanitizeText(
    stored?.selectedDropId || DROP_LIBRARY[0].id,
    DROP_LIBRARY[0].id,
    24
  );
  state.profile.soundEnabled = stored?.soundEnabled !== false;
  ensureSelectedDrop();
  saveProfile();
}
function startLoops() {
  window.clearInterval(roomPollTimer);
  window.clearInterval(roomHeartbeatTimer);
  window.clearInterval(comboTimer);
  roomPollTimer = window.setInterval(() => {
    syncRoom();
  }, ROOM_POLL_MS);
  roomHeartbeatTimer = window.setInterval(() => {
    joinRoom();
  }, ROOM_HEARTBEAT_MS);
  comboTimer = window.setInterval(() => {
    renderScoreboard();
  }, 250);
}
await loadImageData();
bootstrapProfile();
state.roomId = roomIdFromUrl();
updateRoomInUrl();
bindEvents();
syncMintDraft(true);
renderAll();
await joinRoom();
await syncRoom();
startLoops();
