import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { CURRENT_STUDIO, STARTER_WORKS, findStarterWork } from "../public/lib/open-studios.js";

const files = {
  studio: await readFile(new URL("../public/studio/002/index.html", import.meta.url), "utf8"),
  studioJs: await readFile(new URL("../public/studio/002/studio.js", import.meta.url), "utf8"),
  make: await readFile(new URL("../public/make/index.html", import.meta.url), "utf8"),
  makeJs: await readFile(new URL("../public/make/make.js", import.meta.url), "utf8"),
  madeJs: await readFile(new URL("../public/made/made.js", import.meta.url), "utf8"),
  sitemap: await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8"),
};

assert.equal(CURRENT_STUDIO.id, "open-studio-002");
assert.equal(CURRENT_STUDIO.number, "002");
assert.equal(STARTER_WORKS.length, 3);
assert.equal(findStarterWork("studio-002-starter-02")?.mode, "club");
assert.equal(findStarterWork("missing"), null);
assert.match(files.studio, /A signal for people who haven’t met yet/i);
assert.match(files.studio, /id="starter-grid"/);
assert.match(files.studioJs, /edition=.*CURRENT_STUDIO\.id/);
assert.match(files.make, /id="remix-context"/);
assert.match(files.makeJs, /parentId/);
assert.match(files.makeJs, /api\/made\?id=/);
assert.doesNotMatch(files.makeJs, /innerHTML/);
assert.match(files.madeJs, /Remix this/);
assert.doesNotMatch(files.madeJs, /innerHTML/);
assert.match(files.sitemap, /industrynext\.xyz\/studio\/002\//);

console.log("Open Studio 002 verification passed: permanent brief, three starters, remix hydration, lineage, safe rendering, and discovery route.");
