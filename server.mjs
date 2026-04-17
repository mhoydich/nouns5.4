import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ImageData } from "@nouns/assets";
import { buildSVG } from "@nouns/sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const imageData = ImageData;

const OFFICIAL_SOURCES = {
  assetsPackage: "@nouns/assets",
  sdkPackage: "@nouns/sdk",
  monorepo: "https://github.com/nounsDAO/nouns-monorepo",
  descriptorAddress: "0x33A9c445fb4FB21f2c030A6b2d3e2F12D017BFAC",
};

const traitGroups = {
  backgrounds: imageData.bgcolors.map((hex, index) => ({
    index,
    hex,
    label: index === 0 ? "Cool Grey" : "Warm Grey",
  })),
  bodies: imageData.images.bodies.map((part, index) => ({
    index,
    filename: part.filename,
  })),
  accessories: imageData.images.accessories.map((part, index) => ({
    index,
    filename: part.filename,
  })),
  heads: imageData.images.heads.map((part, index) => ({
    index,
    filename: part.filename,
  })),
  glasses: imageData.images.glasses.map((part, index) => ({
    index,
    filename: part.filename,
  })),
};

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
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric) || numeric < 0) {
    return 0;
  }

  return Math.min(numeric, length - 1);
}

function seedFromQuery(query) {
  return {
    background: clampIndex(query.get("background"), imageData.bgcolors.length),
    body: clampIndex(query.get("body"), imageData.images.bodies.length),
    accessory: clampIndex(query.get("accessory"), imageData.images.accessories.length),
    head: clampIndex(query.get("head"), imageData.images.heads.length),
    glasses: clampIndex(query.get("glasses"), imageData.images.glasses.length),
  };
}

function buildNoun(seed) {
  const parts = [
    imageData.images.bodies[seed.body],
    imageData.images.accessories[seed.accessory],
    imageData.images.heads[seed.head],
    imageData.images.glasses[seed.glasses],
  ];
  const background = imageData.bgcolors[seed.background];
  const svg = buildSVG(parts, imageData.palette, background);

  return {
    seed,
    background,
    svg,
    traits: {
      body: imageData.images.bodies[seed.body].filename,
      accessory: imageData.images.accessories[seed.accessory].filename,
      head: imageData.images.heads[seed.head].filename,
      glasses: imageData.images.glasses[seed.glasses].filename,
    },
  };
}

function json(response, payload) {
  response.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function notFound(response) {
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

async function serveStatic(requestPath, response) {
  const normalized = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(publicDir, normalized);

  try {
    const file = await readFile(filePath);
    const extension = path.extname(filePath);
    const contentType =
      extension === ".html"
        ? "text/html; charset=utf-8"
        : extension === ".css"
          ? "text/css; charset=utf-8"
          : extension === ".js"
            ? "text/javascript; charset=utf-8"
            : "application/octet-stream";

    response.writeHead(200, { "Content-Type": contentType });
    response.end(file);
  } catch {
    notFound(response);
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (url.pathname === "/api/sources") {
    json(response, {
      ...OFFICIAL_SOURCES,
      note: "Using official Nouns asset data and the official SVG builder locally.",
    });
    return;
  }

  if (url.pathname === "/api/catalog") {
    json(response, {
      sources: OFFICIAL_SOURCES,
      counts: {
        backgrounds: traitGroups.backgrounds.length,
        bodies: traitGroups.bodies.length,
        accessories: traitGroups.accessories.length,
        heads: traitGroups.heads.length,
        glasses: traitGroups.glasses.length,
      },
      traits: traitGroups,
    });
    return;
  }

  if (url.pathname === "/api/random") {
    json(response, buildNoun(randomSeed()));
    return;
  }

  if (url.pathname === "/api/render") {
    json(response, buildNoun(seedFromQuery(url.searchParams)));
    return;
  }

  await serveStatic(url.pathname, response);
}).listen(port, host, () => {
  console.log(`Nouns prototype running at http://${host}:${port}`);
});
