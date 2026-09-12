import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const dir = "public/editorial/cannabis-operating-system";
const page = await readFile(`${dir}/index.html`, "utf8");
const css = await readFile(`${dir}/styles.css`, "utf8");
const home = await readFile("public/index.html", "utf8");
const sitemap = await readFile("public/sitemap.xml", "utf8");
const record = JSON.parse(await readFile("public/cannabis-operating-system.json", "utf8"));

assert.match(page, /Cannabis as an <em>operating system\.<\/em>/);
assert.match(page, /THESIS 001/);
assert.match(page, /A strain is a name on a jar\. A strand is a thread the system keeps running\./);
assert.match(page, /Five layers, one afternoon\./);
assert.match(page, /Build the layers\. Then sell the afternoon\./);
assert.match(page, /EL SEGUNDO LEDGER/);
assert.match(page, /MICHAEL HOYDICH · EL SEGUNDO, CALIFORNIA/);
assert.match(page, /application\/ld\+json/);
assert.match(page, /rel="canonical" href="https:\/\/www\.industrynext\.xyz\/editorial\/cannabis-operating-system\/"/);
assert.match(page, /cannabis-operating-system\.json/);
assert.match(page, /https:\/\/www\.gov\.ca\.gov\/2026\/09\/02\//);
assert.match(page, /mailto:mh@pointcast\.xyz/);
assert.match(page, /data-pointcast-network/);
assert.doesNotMatch(page, /class="ye-/, "no leftover ye- classes from the Axon stylesheet");
for (const layer of ["Strands", "Quality", "Accessibility", "Network", "Lifestyle"]) {
  assert.match(page, new RegExp(`<h3>${layer}\\. The [a-z]+\\.</h3>`), `${layer} layer heading`);
}
assert.match(css, /\.os-hero/);
assert.match(css, /@media \(max-width: 620px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.doesNotMatch(css, /\.ye-/);
assert.match(home, /\/editorial\/cannabis-operating-system\//);
assert.match(home, /\/editorial\/axon-yield-engine\//, "the case study should stay on the shelf");
assert.match(sitemap, /\/editorial\/cannabis-operating-system\//);
assert.match(sitemap, /\/cannabis-operating-system\.json/);

for (const img of ["hero.jpg", "stack.jpg", "network.jpg", "og.jpg"]) {
  assert.ok(page.includes(img) || img === "og.jpg", `${img} should be referenced`);
  const info = await stat(`${dir}/${img}`);
  assert.ok(info.size > 50_000, `${img} should be a substantial image`);
}

assert.equal(record.number, "001");
assert.equal(record.series, "Thesis");
assert.equal(record.layers.length, 5);
assert.deepEqual(record.layers.map((l) => l.name), ["Strands", "Quality", "Accessibility", "Network", "Lifestyle"]);
assert.equal(record.checklist.length, 7);
assert.equal(record.doubts.length, 3);
assert.equal(record.field_note.place, "El Segundo, California");
assert.equal(record.field_note.dollars_published, false);
assert.ok(record.sources.length >= 8);

console.log("Cannabis operating system thesis verified.");
