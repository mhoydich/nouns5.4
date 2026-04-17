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
};

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

function applyNoun(noun) {
  elements.frame.innerHTML = noun.svg;
  elements.title.textContent = `Seed ${noun.seed.background}-${noun.seed.body}-${noun.seed.accessory}-${noun.seed.head}-${noun.seed.glasses}`;
  elements.body.textContent = humanize(noun.traits.body);
  elements.accessory.textContent = humanize(noun.traits.accessory);
  elements.head.textContent = humanize(noun.traits.head);
  elements.glasses.textContent = humanize(noun.traits.glasses);

  selects.background.value = String(noun.seed.background);
  selects.body.value = String(noun.seed.body);
  selects.accessory.value = String(noun.seed.accessory);
  selects.head.value = String(noun.seed.head);
  selects.glasses.value = String(noun.seed.glasses);
}

function currentQuery() {
  const params = new URLSearchParams();

  Object.entries(selects).forEach(([key, select]) => {
    params.set(key, select.value);
  });

  return params.toString();
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed for ${url}`);
  }

  return response.json();
}

async function loadCatalog() {
  const catalog = await fetchJson("/api/catalog");

  fillSelect(selects.background, catalog.traits.backgrounds, (item) => `${item.label} (#${item.hex})`);
  fillSelect(selects.body, catalog.traits.bodies, (item) => `${item.index}. ${humanize(item.filename)}`);
  fillSelect(selects.accessory, catalog.traits.accessories, (item) => `${item.index}. ${humanize(item.filename)}`);
  fillSelect(selects.head, catalog.traits.heads, (item) => `${item.index}. ${humanize(item.filename)}`);
  fillSelect(selects.glasses, catalog.traits.glasses, (item) => `${item.index}. ${humanize(item.filename)}`);

  elements.sourcesList.innerHTML = `
    <li><strong>${catalog.sources.assetsPackage}</strong> for official CC0 image data</li>
    <li><strong>${catalog.sources.sdkPackage}</strong> for the official SVG builder</li>
    <li><strong>Nouns Descriptor</strong> mainnet contract ${catalog.sources.descriptorAddress}</li>
    <li><a href="${catalog.sources.monorepo}" target="_blank" rel="noreferrer">Official monorepo</a></li>
  `;
}

async function renderFromControls() {
  const noun = await fetchJson(`/api/render?${currentQuery()}`);
  applyNoun(noun);
}

async function renderRandom() {
  const noun = await fetchJson("/api/random");
  applyNoun(noun);
}

elements.traitForm.addEventListener("change", () => {
  renderFromControls().catch((error) => {
    console.error(error);
  });
});

elements.randomizeButton.addEventListener("click", () => {
  renderRandom().catch((error) => {
    console.error(error);
  });
});

await loadCatalog();
await renderRandom();
