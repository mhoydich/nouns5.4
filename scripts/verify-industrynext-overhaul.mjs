import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const read = (path) => readFile(new URL(`../public/${path}`, import.meta.url), "utf8");
const home = await read("index.html");
const start = await read("start/index.html");
const startJs = await read("start/start.js");
const shelf = await read("recipes/index.html");
const services = await read("services/index.html");
const sitemap = await read("sitemap.xml");
const css = await read("homepage/arcade.css");

// One way in.
for (const id of ["session", "build-day", "starter-kit", "package", "not-sure"]) {
  assert.match(start, new RegExp(`id="${id}"`), `start page has the #${id} choice`);
}
assert.equal((start.match(/name="offer"/g) || []).length, 5, "five level choices");
assert.match(start, /<form id="brief"/);
assert.match(start, /mailto:mh@pointcast\.xyz/);
assert.match(start, /<link rel="canonical" href="https:\/\/www\.industrynext\.xyz\/start\/"/);
assert.match(start, /"@type": "ContactPage"/);
assert.match(startJs, /mailto:\$\{ADDRESS\}/);
assert.doesNotMatch(startJs, /fetch\(|XMLHttpRequest|sendBeacon/, "the brief is never sent to a server");
assert.equal((start.match(/<h1\b/g) || []).length, 1);
assert.match(services, /href="\/start\/#starter-kit"/);

// Recipe shelf.
assert.match(shelf, /<link rel="canonical" href="https:\/\/www\.industrynext\.xyz\/recipes\/"/);
assert.equal((shelf.match(/href="\/recipes\/call-or-be-called\/#r0\d"/g) || []).length, 8);
assert.equal((home.match(/href="\/recipes\/call-or-be-called\/#r0\d"/g) || []).length, 8);

// Sitemap.
for (const path of ["/", "/start/", "/recipes/", "/recipes/call-or-be-called/", "/services/"]) {
  assert.match(sitemap, new RegExp(`<loc>https://www\\.industrynext\\.xyz${path.replace(/\//g, "\\/")}</loc>`), `sitemap lists ${path}`);
}

// Original 8-bit art kit.
for (const name of ["mule", "builder", "exchange", "crate", "cart", "silo", "tower", "scene"]) {
  const svg = await read(`art/8bit/${name}.svg`);
  assert.match(svg, /shape-rendering="crispEdges"/, `${name}.svg is crisp pixel art`);
}
const png = await readFile(new URL("../public/homepage/industry-next-8bit-share.png", import.meta.url));
assert.equal(png.readUInt32BE(16), 1200);
assert.equal(png.readUInt32BE(20), 630);
assert.ok((await stat(new URL("../scripts/build-8bit-art.mjs", import.meta.url))).isFile(), "art is rebuilt from source");
assert.doesNotMatch(home + start + shelf, /M\.?U\.?L\.?E\.?/, "no third-party game names");

// Held projects stay off the new pages.
for (const [name, page] of [["start", start], ["recipes", shelf]]) {
  assert.doesNotMatch(page, /Good[\s-]*Feels|cannabis/i, `${name} page promotes no held project`);
}

// Accessibility basics in the shared style.
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /prefers-contrast: more/);
assert.match(css, /@media \(max-width: 640px\)/);

console.log("Industry Next overhaul verified: one way in (/start/), offer ladder, recipe shelf, sitemap, 8-bit art kit and share card.");
