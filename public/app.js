import { buildSVG } from "./lib/nouns-svg.js";

const OFFICIAL_SOURCES = {
  assetsPackage: "@nouns/assets",
  sdkPackage: "@nouns/sdk",
  monorepo: "https://github.com/nounsDAO/nouns-monorepo",
  descriptorAddress: "0x33A9c445fb4FB21f2c030A6b2d3e2F12D017BFAC",
  tezosTutorial: "https://docs.tezos.com/tutorials/create-nfts/send-transactions",
  tezosFa2: "https://docs.tezos.com/architecture/tokens/FA2",
};

const TEZOS_MINT = {
  contractAddress: "KT1NbqYinUijW68V3fxboo4EzQPFgRcdfaYQ",
  explorerBase: "https://shadownet.tzkt.io",
  networkLabel: "Tezos Shadownet",
  rpcUrl: "https://rpc.shadownet.teztnets.com",
  symbol: "INDNOUN",
};

const TEZOS_CDN = {
  taquito: "https://cdn.jsdelivr.net/npm/@taquito/taquito@24.2.0/+esm",
  beaconWallet: "https://cdn.jsdelivr.net/npm/@taquito/beacon-wallet@24.2.0/+esm",
  utils: "https://cdn.jsdelivr.net/npm/@taquito/utils@24.2.0/+esm",
};

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
};

let imageData;
let activeNoun;
let tezosSdkPromise;
let tezosSdk;
let tezosToolkit;
let walletInstance;
let connectedAddress = "";
let connectedBalance = "";
let walletBusy = false;
let mintBusy = false;
let walletStatusMessage =
  "This prototype uses the official Tezos NFT tutorial contract on Shadownet testnet.";
let mintStatusMessage = "Connect a Tezos wallet to mint this noun.";
let mintResultMarkup = "";

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

function syncMintDraft(noun) {
  elements.tokenName.value = buildDefaultTokenName(noun);
  elements.tokenDescription.value = buildDefaultDescription(noun);
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

function applyNoun(noun) {
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

  syncMintDraft(noun);
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
    <li><strong>Nouns Descriptor</strong> mainnet contract ${OFFICIAL_SOURCES.descriptorAddress}</li>
    <li><a href="${OFFICIAL_SOURCES.monorepo}" target="_blank" rel="noreferrer">Official monorepo</a></li>
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

function renderSeed(seed) {
  applyNoun(buildNoun(seed));
}

async function ensureTezosToolkit() {
  if (!tezosSdkPromise) {
    tezosSdkPromise = Promise.all([
      import(TEZOS_CDN.taquito),
      import(TEZOS_CDN.beaconWallet),
      import(TEZOS_CDN.utils),
    ]).then(([taquitoModule, walletModule, utilsModule]) => ({
      TezosToolkit: taquitoModule.TezosToolkit,
      MichelsonMap: taquitoModule.MichelsonMap,
      BeaconWallet: walletModule.BeaconWallet,
      NetworkType: walletModule.NetworkType,
      stringToBytes: utilsModule.stringToBytes,
    }));
  }

  tezosSdk = tezosSdk || (await tezosSdkPromise);

  if (!tezosToolkit) {
    tezosToolkit = new tezosSdk.TezosToolkit(TEZOS_MINT.rpcUrl);
  }

  return {
    ...tezosSdk,
    tezosToolkit,
  };
}

async function connectWallet() {
  walletBusy = true;
  walletStatusMessage = "Loading the Tezos wallet toolkit...";
  renderWalletState();

  try {
    const { BeaconWallet, NetworkType, tezosToolkit } = await ensureTezosToolkit();
    const networkType = NetworkType?.SHADOWNET ?? "shadownet";

    if (walletInstance) {
      await walletInstance.disconnect().catch(() => {});
    }

    walletInstance = new BeaconWallet({
      name: "Industry Next Nouns",
      network: {
        type: networkType,
        rpcUrl: TEZOS_MINT.rpcUrl,
      },
    });

    await walletInstance.requestPermissions({
      network: {
        type: networkType,
        rpcUrl: TEZOS_MINT.rpcUrl,
      },
    });

    tezosToolkit.setWalletProvider(walletInstance);
    connectedAddress = await walletInstance.getPKH();
    const balanceMutez = await tezosToolkit.tz.getBalance(connectedAddress);
    connectedBalance = `${balanceMutez.div(1000000).toFixed(4)} tez`;
    walletStatusMessage = `Wallet connected on ${TEZOS_MINT.networkLabel}. This mint will call the official open tutorial contract.`;
    mintStatusMessage = "Wallet ready. Review the metadata, then mint this noun.";
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
    const { MichelsonMap, stringToBytes, tezosToolkit } = await ensureTezosToolkit();
    const imageUrl = buildNounImageUrl(activeNoun.seed);
    const metadataUrl = buildTokenMetadataUrl(activeNoun.seed);
    const metadata = new MichelsonMap();

    metadata.set("name", stringToBytes(getTokenName()));
    metadata.set("symbol", stringToBytes(TEZOS_MINT.symbol));
    metadata.set("decimals", stringToBytes("0"));
    metadata.set("artifactUri", stringToBytes(imageUrl));
    metadata.set("displayUri", stringToBytes(imageUrl));
    metadata.set("thumbnailUri", stringToBytes(imageUrl));
    metadata.set("description", stringToBytes(getTokenDescription()));
    metadata.set("externalUri", stringToBytes(metadataUrl));

    tezosToolkit.setWalletProvider(walletInstance);
    const contract = await tezosToolkit.wallet.at(TEZOS_MINT.contractAddress);

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

await loadImageData();
loadSelectors();
renderSources();
renderWalletState();
renderSeed(seedFromUrl());
