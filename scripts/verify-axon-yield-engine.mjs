import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const dir = "public/editorial/axon-yield-engine";
const page = await readFile(`${dir}/index.html`, "utf8");
const css = await readFile(`${dir}/styles.css`, "utf8");
const home = await readFile("public/index.html", "utf8");
const sitemap = await readFile("public/sitemap.xml", "utf8");
const record = JSON.parse(await readFile("public/axon-yield-engine.json", "utf8"));

assert.match(page, /The yield <em>engine\.<\/em>/);
assert.match(page, /CASE STUDY 001/);
assert.match(page, /Axon is the engine\. AppLovin Ads is the door\./);
assert.match(page, /Five mechanisms, one flywheel\./);
assert.match(page, /Rent the engine\. Own the feedstock\./);
assert.match(page, /Good Feels field ledger/);
assert.match(page, /does not publish the brand's spend or revenue/);
assert.match(page, /application\/ld\+json/);
assert.match(page, /rel="canonical" href="https:\/\/www\.industrynext\.xyz\/editorial\/axon-yield-engine\/"/);
assert.match(page, /axon-yield-engine\.json/);
assert.match(page, /https:\/\/www\.applovin\.com\/en\/blog\/applovin-ads-now-open/);
assert.match(page, /mailto:mh@pointcast\.xyz/);
assert.doesNotMatch(page, /\$1[12],\d{3}/, "no Good Feels dollar spend should appear");
assert.match(css, /@media \(max-width: 620px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.match(home, /\/editorial\/axon-yield-engine\//);
assert.match(sitemap, /\/editorial\/axon-yield-engine\//);
assert.match(sitemap, /\/axon-yield-engine\.json/);

for (const img of ["hero.jpg", "flywheel.jpg", "unit.jpg", "treadmill.jpg", "fieldnote.jpg", "og.jpg"]) {
  assert.match(page.includes(img) || img === "og.jpg" ? "ok" : "", /ok/, `${img} should be referenced`);
  const info = await stat(`${dir}/${img}`);
  assert.ok(info.size > 50_000, `${img} should be a substantial image`);
}

assert.equal(record.number, "001");
assert.equal(record.yield_mechanisms.length, 5);
assert.equal(record.checklist.length, 7);
assert.equal(record.field_note.dollars_published, false);
assert.equal(record.field_note.incrementality_claimed, false);
assert.ok(record.sources.length >= 8);

console.log("Axon yield engine case study verified.");
