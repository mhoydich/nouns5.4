import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../public/services/index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../public/services/services.css", import.meta.url), "utf8");
const data = JSON.parse(await readFile(new URL("../public/services.json", import.meta.url), "utf8"));
const home = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");

assert.match(html, /<h1 id="services-title">Build the part/);
assert.match(html, /The Starter Kit/);
assert.match(html, /\$50K/);
assert.match(html, /5 WEEKS/);
assert.equal((html.match(/class="check"/g) || []).length, 8);
assert.match(html, /AI Format Lab/);
assert.match(html, /CPG \+ CANNABIS/);
assert.match(html, /Store as Media/);
assert.match(html, /Axon-type organizations/);
assert.match(html, /Personal \+ Cultural Studio/);
assert.match(html, /mailto:mh@pointcast\.xyz/);
assert.match(html, /rel="alternate" type="application\/json"/);
assert.match(html, /"@type": "ProfessionalService"/);
assert.match(html, /data-placement="footer"/);
assert.doesNotMatch(html, /Axon client|client.*Axon/i);

assert.match(css, /\.price-sticker/);
assert.match(css, /\.package-enterprise/);
assert.match(css, /@media \(max-width: 700px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /prefers-contrast: more/);

assert.equal(data.starter_kit.price_usd, 50000);
assert.equal(data.starter_kit.duration_weeks, 5);
assert.equal(data.starter_kit.deliverables.length, 8);
assert.equal(data.packages.length, 6);
assert.ok(data.operating_principles.includes("do not train on private client material by default"));
assert.match(home, /href="\/services\/"/);
assert.match(home, /THE \$50K[\s\S]*STARTER KIT/);
assert.match(sitemap, /industrynext\.xyz\/services\//);

console.log("Services verification passed: fixed Starter Kit, eight deliverables, sector packages, contact path, machine-readable scope, homepage doorway, and responsive safeguards.");
