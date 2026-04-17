import { buildSVG } from "./lib/nouns-svg.js";

const OFFICIAL_SOURCES = {
  assetsPackage: "@nouns/assets",
  sdkPackage: "@nouns/sdk",
  monorepo: "https://github.com/nounsDAO/nouns-monorepo",
  descriptorAddress: "0x33A9c445fb4FB21f2c030A6b2d3e2F12D017BFAC",
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
};

let imageData;

function humanize(value) {
  return value
    .replace(/^(body|accessory|head|glasses)-/, "")
    .replaceAll("-", " ");
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
    traits: {
      body: parts[0].filename,
      accessory: parts[1].filename,
      head: parts[2].filename,
      glasses: parts[3].filename,
    },
  };
}

function applyNoun(noun) {
  elements.frame.innerHTML = noun.svg;
  elements.title.textContent = `Seed ${noun.seed.background}-${noun.seed.body}-${noun.seed.accessory}-${noun.seed.head}-${noun.seed.glasses}`;
  elements.body.textContent = humanize(noun.traits.body);
  elements.accessory.textContent = humanize(noun.traits.accessory);
  elements.head.textContent = humanize(noun.traits.head);
  elements.glasses.textContent = humanize(noun.traits.glasses);
  elements.status.textContent = `Background #${noun.background} • ${imageData.images.bodies.length} bodies • ${imageData.images.accessories.length} accessories • ${imageData.images.heads.length} heads • ${imageData.images.glasses.length} glasses`;

  selects.background.value = String(noun.seed.background);
  selects.body.value = String(noun.seed.body);
  selects.accessory.value = String(noun.seed.accessory);
  selects.head.value = String(noun.seed.head);
  selects.glasses.value = String(noun.seed.glasses);

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

elements.traitForm.addEventListener("change", () => {
  renderSeed(seedFromControls());
});

elements.randomizeButton.addEventListener("click", () => {
  renderSeed(randomSeed());
});

await loadImageData();
loadSelectors();
renderSources();
renderSeed(seedFromUrl());
