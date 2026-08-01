import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../public/roles/playlist-editor/index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../public/roles/playlist-editor/playlist-editor.css", import.meta.url), "utf8");
const data = JSON.parse(await readFile(new URL("../public/playlist-editor.json", import.meta.url), "utf8"));
const home = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const homeCss = await readFile(new URL("../public/art-home.css", import.meta.url), "utf8");
const headers = await readFile(new URL("../public/_headers", import.meta.url), "utf8");
const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");

assert.match(html, /<h1 id="role-title">Make rooms/);
assert.match(html, /Playlist Editor/);
assert.match(html, /Listener Growth Lead/);
assert.match(html, /Increase listens/);
assert.match(html, /real, repeat listening/);
assert.match(html, /NO FOLLOWER MINIMUM/);
assert.match(html, /mailto:mh@pointcast\.xyz/);
assert.match(html, /rel="alternate" type="application\/json"/);
assert.match(html, /data-placement="footer"/);

for (const forbidden of ["Buy streams", "bots", "click farms", "pay-for-placement", "guarantee a number"]) {
  assert.match(html, new RegExp(forbidden, "i"));
}

assert.match(css, /\.record-file/);
assert.match(css, /\.metric-board/);
assert.match(css, /@media \(max-width: 700px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /prefers-contrast: more/);
assert.match(homeCss, /\.role-door/);

assert.equal(data.id, "industry-next-role-001");
assert.equal(data.status, "open");
assert.equal(data.title, "Playlist Editor + Listener Growth Lead");
assert.equal(data.success_signals.length, 6);
assert.equal(data.non_negotiables.length, 5);
assert.equal(data.application.resume_required, false);
assert.ok(data.non_negotiables.some((item) => item.includes("no bots")));

assert.match(home, /href="\/roles\/playlist-editor\/"/);
assert.match(home, /PLAYLIST[\s\S]*EDITOR/);
assert.match(headers, /\/playlist-editor\.json[\s\S]*Content-Type: application\/json/);
assert.match(sitemap, /industrynext\.xyz\/roles\/playlist-editor\//);

console.log("Playlist role verification passed: authored role, real-listener scorecard, anti-manipulation boundary, evidence-first application, JSON twin, homepage doorway, sitemap, and responsive safeguards.");
