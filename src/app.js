import { buildSVG } from "../public/lib/nouns-svg.js";

const OFFICIAL_SOURCES = {
  assetsPackage: "@nouns/assets",
  sdkPackage: "@nouns/sdk",
  monorepo: "https://github.com/nounsDAO/nouns-monorepo",
  descriptorAddress: "0x33A9c445fb4FB21f2c030A6b2d3e2F12D017BFAC",
  tezosTutorial: "https://docs.tezos.com/tutorials/create-nfts/send-transactions",
  tezosFa2: "https://docs.tezos.com/architecture/tokens/FA2",
  taquito: "https://taquito.io/docs/wallet_api",
};

const TEZOS_MINT = {
  contractAddress: "KT1NbqYinUijW68V3fxboo4EzQPFgRcdfaYQ",
  explorerBase: "https://shadownet.tzkt.io",
  networkLabel: "Tezos Shadownet",
  networkType: "shadownet",
  rpcUrl: "https://rpc.shadownet.teztnets.com",
  symbol: "INDNOUN",
};

const GALLERY_STORAGE_KEY = "industrynext.nouns.gallery";
const GALLERY_LIMIT = 12;

const selects = {
  background: document.querySelector("#background-select"),
  body: document.querySelector("#body-select"),
  accessory: document.querySelector("#accessory-select"),
  head: document.querySelector("#head-select"),
  glasses: document.querySelector("#glasses-select"),
};

const elements = {
  frame: document.querySelector("#noun-frame"),
  title: document.querySelector("#noun-title"),
  body: document.querySelector("#body-name"),
  accessory: document.querySelector("#accessory-name"),
  head: document.querySelector("#head-name"),
  glasses: document.querySelector("#glasses-name"),
  sourcesList: document.querySelector("#sources-list"),
  randomizeButton: document.querySelector("#randomize-button"),
  saveGalleryButton: document.querySelector("#save-gallery-button"),
  traitForm: document.querySelector("#trait-form"),
  status: document.querySelector("#status-line"),
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
  downloadMetadataButton: document.querySelector("#download-metadata-button"),
  galleryList: document.querySelector("#gallery-list"),
  galleryCount: document.querySelector("#gallery-count"),
};

let imageData;
let activeNoun;
let tezosClientPromise;
let tezosSdk;
let tezosToolkit;
let walletInstance;
let connectedAddress = "";
let connectedBalance = "";
let walletBusy = false;
let mintBusy = false;
let walletStatusMessage =
  "Bundled Beacon + Taquito wallet flow for the official Tezos tutorial contract on Shadownet.";
let mintStatusMessage = "Connect a Tezos wallet to mint this noun.";
let mintResultMarkup = "";
let galleryEntries = [];

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

function buildDefaultTokenName(noun) {
  return `Industry Next Noun ${noun.seed.background}-${noun.seed.body}-${noun.seed.accessory}-${noun.seed.head}-${noun.seed.glasses}`;
}

function buildDefaultDescription(noun) {
  return `A Nouns-inspired character published by Industry Next with a ${noun.labels.head} head, ${noun.labels.accessory} accessory, ${noun.labels.body} body, and ${noun.labels.glasses} glasses.`;
}

function buildSeedSearch(seed, extras = {}) {
  const params = new URLSearchParams();

  Object.entries(seed).forEach(([key, value]) => {
    params.set(key, String(value));
  });

  Object.entries(extras).forEach(([key, value]) => {
    if (typeof value === "string" && value.trim()) {
      params.set(key, value.trim());
    }
  });

  return params;
}

function buildNounImageUrl(seed) {
  const url = new URL("/api/noun", window.location.origin);
  url.search = buildSeedSearch(seed).toString();
  return url.toString();
}

function getTokenName() {
  return elements.tokenName.value.trim() || buildDefaultTokenName(activeNoun);
}

function getTokenDescription() {
  return elements.tokenDescription.value.trim() || buildDefaultDescription(activeNoun);
}

function buildTokenMetadataUrl(seed) {
  const url = new URL("/api/token-metadata", window.location.origin);
  url.search = buildSeedSearch(seed, {
    name: getTokenName(),
    description: getTokenDescription(),
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function fillSelect(select, items, formatter) {
  select.innerHTML = "";

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.index);
    option.textContent = formatter(item);
    select.append(option);
  });
}

function randomIndex(length) {
  return Math.floor(Math.random() * length);
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

function clampIndex(value, length) {
  const numeric = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(numeric) || numeric < 0) {
    return 0;
  }

  return Math.min(numeric, length - 1);
}

function seedFromUrl() {
  const params = new URLSearchParams(window.location.search);

  return {
    background: clampIndex(params.get("background"), imageData.bgcolors.length),
    body: clampIndex(params.get("body"), imageData.images.bodies.length),
    accessory: clampIndex(params.get("accessory"), imageData.images.accessories.length),
    head: clampIndex(params.get("head"), imageData.images.heads.length),
    glasses: clampIndex(params.get("glasses"), imageData.images.glasses.length),
  };
}

function updateUrl(seed) {
  const params = new URLSearchParams();
  Object.entries(seed).forEach(([key, value]) => {
    params.set(key, value);
  });

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, "", nextUrl);
}

function seedFromControls() {
  return {
    background: Number(selects.background.value),
    body: Number(selects.body.value),
    accessory: Number(selects.accessory.value),
    head: Number(selects.head.value),
    glasses: Number(selects.glasses.value),
  };
}

function buildNoun(seed) {
  const parts = [
    imageData.images.bodies[seed.body],
    imageData.images.accessories[seed.accessory],
    imageData.images.heads[seed.head],
    imageData.images.glasses[seed.glasses],
  ];

  return {
    seed,
    background: imageData.bgcolors[seed.background],
    svg: buildSVG(parts, imageData.palette, imageData.bgcolors[seed.background]),
    labels: {
      background: seed.background === 0 ? "Cool Grey" : "Warm Grey",
      body: humanize(parts[0].filename),
      accessory: humanize(parts[1].filename),
      head: humanize(parts[2].filename),
      glasses: humanize(parts[3].filename),
    },
  };
}

function syncMintDraft(noun, draft = {}) {
  elements.tokenName.value = draft.name?.trim() || buildDefaultTokenName(noun);
  elements.tokenDescription.value =
    draft.description?.trim() || buildDefaultDescription(noun);
}

function renderMintLinks(noun) {
  const imageUrl = buildNounImageUrl(noun.seed);
  const metadataUrl = buildTokenMetadataUrl(noun.seed);

  elements.nounImageLink.href = imageUrl;
  elements.tokenMetadataLink.href = metadataUrl;
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
  elements.walletButton.textContent = walletBusy
    ? "Connecting..."
    : connectedAddress
      ? "Reconnect Wallet"
      : "Connect Wallet";
  elements.disconnectWalletButton.hidden = !connectedAddress;
  elements.disconnectWalletButton.disabled = walletBusy;
  elements.mintButton.disabled = !connectedAddress || mintBusy || walletBusy;
  elements.mintButton.textContent = mintBusy ? "Minting..." : "Mint on Tezos Testnet";
}

function buildGalleryId(seed) {
  return `${seed.background}-${seed.body}-${seed.accessory}-${seed.head}-${seed.glasses}`;
}

function readGallery() {
  try {
    const raw = window.localStorage.getItem(GALLERY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry) => entry && entry.seed && typeof entry.id === "string");
  } catch {
    return [];
  }
}

function writeGallery() {
  try {
    window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(galleryEntries));
  } catch {
    // Ignore localStorage failures so the editor keeps working in private contexts.
  }
}

function formatTimestamp(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Saved recently";
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function upsertGalleryEntry(entry) {
  const nextEntry = {
    ...entry,
    id: entry.id || buildGalleryId(entry.seed),
  };
  const withoutCurrent = galleryEntries.filter((item) => item.id !== nextEntry.id);
  galleryEntries = [nextEntry, ...withoutCurrent].slice(0, GALLERY_LIMIT);
  writeGallery();
  renderGallery();
}

function removeGalleryEntry(id) {
  galleryEntries = galleryEntries.filter((entry) => entry.id !== id);
  writeGallery();
  renderGallery();
}

function snapshotActiveNoun(overrides = {}) {
  if (!activeNoun) {
    return null;
  }

  return {
    id: buildGalleryId(activeNoun.seed),
    seed: { ...activeNoun.seed },
    labels: { ...activeNoun.labels },
    name: getTokenName(),
    description: getTokenDescription(),
    imageUrl: buildNounImageUrl(activeNoun.seed),
    metadataUrl: buildTokenMetadataUrl(activeNoun.seed),
    savedAt: new Date().toISOString(),
    ...overrides,
  };
}

function saveCurrentToGallery(extra = {}) {
  const snapshot = snapshotActiveNoun(extra);

  if (!snapshot) {
    return;
  }

  upsertGalleryEntry(snapshot);
}

function renderGallery() {
  elements.galleryCount.textContent = `${galleryEntries.length} saved`;

  if (!galleryEntries.length) {
    elements.galleryList.innerHTML = `
      <div class="gallery-empty">
        <strong>No saved nouns yet.</strong>
        <span>Use "Save to Gallery" to pin promising seeds while you iterate.</span>
      </div>
    `;
    return;
  }

  elements.galleryList.innerHTML = galleryEntries
    .map((entry) => {
      const statusLabel = entry.operationHash ? "Minted" : "Saved";
      const timestamp = entry.mintedAt || entry.savedAt;
      const explorerLink = entry.operationHash
        ? `
            <a href="${TEZOS_MINT.explorerBase}/${entry.operationHash}" target="_blank" rel="noreferrer">
              View ${escapeHtml(entry.operationHash)}
            </a>
          `
        : `
            <a href="${escapeHtml(entry.metadataUrl)}" target="_blank" rel="noreferrer">
              Open metadata
            </a>
          `;

      return `
        <article class="gallery-item">
          <img src="${escapeHtml(buildNounImageUrl(entry.seed))}" alt="" loading="lazy" />
          <div class="gallery-item-copy">
            <div class="gallery-item-head">
              <strong>${escapeHtml(entry.name)}</strong>
              <span class="gallery-badge${entry.operationHash ? " is-minted" : ""}">${statusLabel}</span>
            </div>
            <p>${escapeHtml(entry.description)}</p>
            <div class="gallery-meta">
              <span>Seed ${escapeHtml(entry.id)}</span>
              <span>${escapeHtml(formatTimestamp(timestamp))}</span>
            </div>
            <div class="gallery-links">
              ${explorerLink}
              <a href="${escapeHtml(entry.imageUrl)}" target="_blank" rel="noreferrer">Open SVG</a>
            </div>
            <div class="gallery-actions">
              <button type="button" class="ghost-button" data-gallery-action="load" data-gallery-id="${escapeHtml(entry.id)}">
                Load
              </button>
              <button type="button" class="ghost-button" data-gallery-action="remove" data-gallery-id="${escapeHtml(entry.id)}">
                Remove
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function applyNoun(noun, draft = {}) {
  activeNoun = noun;
  elements.frame.innerHTML = noun.svg;
  elements.title.textContent = `Seed ${noun.seed.background}-${noun.seed.body}-${noun.seed.accessory}-${noun.seed.head}-${noun.seed.glasses}`;
  elements.body.textContent = noun.labels.body;
  elements.accessory.textContent = noun.labels.accessory;
  elements.head.textContent = noun.labels.head;
  elements.glasses.textContent = noun.labels.glasses;
  elements.status.textContent = `Background ${noun.labels.background} • ${imageData.images.bodies.length} bodies • ${imageData.images.accessories.length} accessories • ${imageData.images.heads.length} heads • ${imageData.images.glasses.length} glasses`;

  selects.background.value = String(noun.seed.background);
  selects.body.value = String(noun.seed.body);
  selects.accessory.value = String(noun.seed.accessory);
  selects.head.value = String(noun.seed.head);
  selects.glasses.value = String(noun.seed.glasses);

  syncMintDraft(noun, draft);
  renderMintLinks(noun);
  updateUrl(noun.seed);
}

function loadSelectors() {
  fillSelect(
    selects.background,
    imageData.bgcolors.map((hex, index) => ({
      index,
      label: index === 0 ? "Cool Grey" : "Warm Grey",
      hex,
    })),
    (item) => `${item.label} (#${item.hex})`,
  );
  fillSelect(
    selects.body,
    imageData.images.bodies.map((part, index) => ({ index, filename: part.filename })),
    (item) => `${item.index}. ${humanize(item.filename)}`,
  );
  fillSelect(
    selects.accessory,
    imageData.images.accessories.map((part, index) => ({ index, filename: part.filename })),
    (item) => `${item.index}. ${humanize(item.filename)}`,
  );
  fillSelect(
    selects.head,
    imageData.images.heads.map((part, index) => ({ index, filename: part.filename })),
    (item) => `${item.index}. ${humanize(item.filename)}`,
  );
  fillSelect(
    selects.glasses,
    imageData.images.glasses.map((part, index) => ({ index, filename: part.filename })),
    (item) => `${item.index}. ${humanize(item.filename)}`,
  );
}

function renderSources() {
  elements.sourcesList.innerHTML = `
    <li><strong>${OFFICIAL_SOURCES.assetsPackage}</strong> for official CC0 image data</li>
    <li><strong>${OFFICIAL_SOURCES.sdkPackage}</strong> for the SVG assembly path used by Nouns</li>
    <li><strong>@taquito/taquito</strong> and <strong>@taquito/beacon-wallet</strong> for the wallet and mint path</li>
    <li><strong>Nouns Descriptor</strong> mainnet contract ${OFFICIAL_SOURCES.descriptorAddress}</li>
    <li><a href="${OFFICIAL_SOURCES.monorepo}" target="_blank" rel="noreferrer">Official monorepo</a></li>
    <li><a href="${OFFICIAL_SOURCES.taquito}" target="_blank" rel="noreferrer">Taquito wallet docs</a></li>
    <li><a href="${OFFICIAL_SOURCES.tezosTutorial}" target="_blank" rel="noreferrer">Official Tezos NFT mint tutorial</a></li>
    <li><a href="${OFFICIAL_SOURCES.tezosFa2}" target="_blank" rel="noreferrer">Tezos FA2 token standard docs</a></li>
  `;
}

async function loadImageData() {
  const response = await fetch("./data/image-data.json");
  if (!response.ok) {
    throw new Error("Failed to load official Nouns image data.");
  }

  imageData = await response.json();
}

function renderSeed(seed, draft = {}) {
  applyNoun(buildNoun(seed), draft);
}

async function ensureTezosToolkit() {
  if (!tezosClientPromise) {
    tezosClientPromise = import("./tezos-client.js");
  }

  tezosSdk = tezosSdk || (await tezosClientPromise);

  if (!tezosToolkit) {
    tezosToolkit = tezosSdk.createTezosToolkit(TEZOS_MINT.rpcUrl);
  }

  return {
    ...tezosSdk,
    tezosToolkit,
  };
}

async function connectWallet() {
  walletBusy = true;
  walletStatusMessage = "Preparing the bundled Tezos wallet toolkit...";
  renderWalletState();

  try {
    const { BeaconWallet: WalletClient, tezosToolkit: toolkit } = await ensureTezosToolkit();

    if (walletInstance) {
      await walletInstance.disconnect().catch(() => {});
    }

    walletInstance = new WalletClient({
      name: "Industry Next Nouns",
      description: "Utility console for generating and minting Nouns-style collectibles.",
      appUrl: window.location.origin,
      network: {
        type: TEZOS_MINT.networkType,
        rpcUrl: TEZOS_MINT.rpcUrl,
      },
      preferredNetwork: TEZOS_MINT.networkType,
    });

    walletStatusMessage = "Open your Beacon-compatible wallet and approve the connection request.";
    renderWalletState();

    await walletInstance.requestPermissions();

    toolkit.setWalletProvider(walletInstance);
    connectedAddress = await walletInstance.getPKH();
    const balanceMutez = await toolkit.tz.getBalance(connectedAddress);
    connectedBalance = `${balanceMutez.div(1000000).toFixed(4)} tez`;
    walletStatusMessage = `Wallet connected on ${TEZOS_MINT.networkLabel}. This mint will call the official open tutorial contract.`;
    mintStatusMessage = "Wallet ready. Review the metadata, save to gallery if needed, then mint.";
  } catch (error) {
    connectedAddress = "";
    connectedBalance = "";
    walletInstance = undefined;
    walletStatusMessage = `Wallet connection failed: ${formatError(error)}`;
    mintStatusMessage = "Connect a Tezos wallet to mint this noun.";
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

  walletInstance = undefined;
  connectedAddress = "";
  connectedBalance = "";
  mintStatusMessage = "Connect a Tezos wallet to mint this noun.";
  mintResultMarkup = "";
  walletBusy = false;
  renderWalletState();
}

async function mintCurrentNoun() {
  if (!walletInstance || !connectedAddress || !activeNoun || mintBusy) {
    return;
  }

  mintBusy = true;
  mintResultMarkup = "";
  mintStatusMessage = "Preparing the mint transaction...";
  renderWalletState();

  try {
    const { MichelsonMap: MetadataMap, stringToBytes: toBytes, tezosToolkit: toolkit } =
      await ensureTezosToolkit();
    const imageUrl = buildNounImageUrl(activeNoun.seed);
    const metadataUrl = buildTokenMetadataUrl(activeNoun.seed);
    const metadata = new MetadataMap();

    metadata.set("name", toBytes(getTokenName()));
    metadata.set("symbol", toBytes(TEZOS_MINT.symbol));
    metadata.set("decimals", toBytes("0"));
    metadata.set("artifactUri", toBytes(imageUrl));
    metadata.set("displayUri", toBytes(imageUrl));
    metadata.set("thumbnailUri", toBytes(imageUrl));
    metadata.set("description", toBytes(getTokenDescription()));
    metadata.set("externalUri", toBytes(metadataUrl));

    toolkit.setWalletProvider(walletInstance);
    const contract = await toolkit.wallet.at(TEZOS_MINT.contractAddress);

    mintStatusMessage = "Approve the mint in your wallet.";
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

    mintStatusMessage = "Mint confirmed on Tezos Shadownet.";
    mintResultMarkup = `<a href="${TEZOS_MINT.explorerBase}/${operation.opHash}" target="_blank" rel="noreferrer">View operation ${operation.opHash}</a>`;
    saveCurrentToGallery({
      operationHash: operation.opHash,
      mintedAt: new Date().toISOString(),
      walletAddress: connectedAddress,
    });
  } catch (error) {
    mintStatusMessage = `Mint failed: ${formatError(error)}`;
  } finally {
    mintBusy = false;
    renderWalletState();
  }
}

elements.traitForm.addEventListener("change", () => {
  renderSeed(seedFromControls());
});

elements.randomizeButton.addEventListener("click", () => {
  renderSeed(randomSeed());
});

elements.saveGalleryButton.addEventListener("click", () => {
  saveCurrentToGallery();
});

elements.walletButton.addEventListener("click", () => {
  connectWallet();
});

elements.disconnectWalletButton.addEventListener("click", () => {
  disconnectWallet();
});

elements.tokenName.addEventListener("input", () => {
  if (activeNoun) {
    renderMintLinks(activeNoun);
  }
});

elements.tokenDescription.addEventListener("input", () => {
  if (activeNoun) {
    renderMintLinks(activeNoun);
  }
});

elements.mintButton.addEventListener("click", () => {
  mintCurrentNoun();
});

elements.downloadSvgButton.addEventListener("click", () => {
  if (!activeNoun) {
    return;
  }

  triggerDownload(
    buildNounImageUrl(activeNoun.seed),
    `${buildDefaultTokenName(activeNoun).replaceAll(" ", "-").toLowerCase()}.svg`,
  );
});

elements.downloadMetadataButton.addEventListener("click", () => {
  if (!activeNoun) {
    return;
  }

  triggerDownload(
    buildTokenMetadataUrl(activeNoun.seed),
    `${buildDefaultTokenName(activeNoun).replaceAll(" ", "-").toLowerCase()}-metadata.json`,
  );
});

elements.galleryList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-gallery-action]");

  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const action = button.dataset.galleryAction;
  const id = button.dataset.galleryId;

  if (!action || !id) {
    return;
  }

  if (action === "remove") {
    removeGalleryEntry(id);
    return;
  }

  if (action === "load") {
    const entry = galleryEntries.find((item) => item.id === id);

    if (!entry) {
      return;
    }

    renderSeed(entry.seed, {
      name: entry.name,
      description: entry.description,
    });
  }
});

await loadImageData();
galleryEntries = readGallery();
loadSelectors();
renderSources();
renderWalletState();
renderGallery();
renderSeed(seedFromUrl());
