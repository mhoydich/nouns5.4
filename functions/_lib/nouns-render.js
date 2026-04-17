import { buildSVG } from "../../public/lib/nouns-svg.js";

let imageDataPromise;

function humanize(value) {
  return value
    .replace(/^(body|accessory|head|glasses)-/, "")
    .replaceAll("-", " ");
}

function clampIndex(value, length) {
  const numeric = Number.parseInt(value ?? "", 10);

  if (Number.isNaN(numeric) || numeric < 0) {
    return 0;
  }

  return Math.min(numeric, length - 1);
}

async function loadImageData(request) {
  if (!imageDataPromise) {
    const assetUrl = new URL("/data/image-data.json", request.url);
    imageDataPromise = fetch(assetUrl).then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to load Nouns image data.");
      }

      return response.json();
    });
  }

  return imageDataPromise;
}

export function buildSeedParams(seed, extras = {}) {
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

export async function buildNounFromRequest(request) {
  const imageData = await loadImageData(request);
  const url = new URL(request.url);
  const seed = {
    background: clampIndex(url.searchParams.get("background"), imageData.bgcolors.length),
    body: clampIndex(url.searchParams.get("body"), imageData.images.bodies.length),
    accessory: clampIndex(url.searchParams.get("accessory"), imageData.images.accessories.length),
    head: clampIndex(url.searchParams.get("head"), imageData.images.heads.length),
    glasses: clampIndex(url.searchParams.get("glasses"), imageData.images.glasses.length),
  };

  const parts = [
    imageData.images.bodies[seed.body],
    imageData.images.accessories[seed.accessory],
    imageData.images.heads[seed.head],
    imageData.images.glasses[seed.glasses],
  ];

  const labels = {
    background: seed.background === 0 ? "Cool Grey" : "Warm Grey",
    body: humanize(parts[0].filename),
    accessory: humanize(parts[1].filename),
    head: humanize(parts[2].filename),
    glasses: humanize(parts[3].filename),
  };

  return {
    seed,
    labels,
    svg: buildSVG(parts, imageData.palette, imageData.bgcolors[seed.background]),
  };
}

export function buildPublicUrls(request, seed, extras = {}) {
  const origin = new URL(request.url).origin;
  const imageUrl = new URL("/api/noun", origin);
  imageUrl.search = buildSeedParams(seed).toString();

  const metadataUrl = new URL("/api/token-metadata", origin);
  metadataUrl.search = buildSeedParams(seed, extras).toString();

  const pageUrl = new URL("/", origin);
  pageUrl.search = buildSeedParams(seed).toString();

  return {
    imageUrl: imageUrl.toString(),
    metadataUrl: metadataUrl.toString(),
    pageUrl: pageUrl.toString(),
  };
}
