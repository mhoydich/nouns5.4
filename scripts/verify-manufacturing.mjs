import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { quote, rfqText, palletPlan } from "../public/services/manufacturing/quote-engine.js";

const html = await readFile(new URL("../public/services/manufacturing/index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../public/services/manufacturing/manufacturing.css", import.meta.url), "utf8");
const js = await readFile(new URL("../public/services/manufacturing/quote.js", import.meta.url), "utf8");

// Page: the list answered point by point, three builds, honest boundaries.
assert.equal((html.match(/class="need need-/g) || []).length, 8, "all eight needs listed");
assert.equal((html.match(/class="need need-build"/g) || []).length, 3, "three builds");
assert.match(html, /id="desks"/);
assert.match(html, /id="quote"/);
assert.match(html, /id="maintenance"/);
assert.match(html, /hasn't seen this page/);
assert.match(html, /mailto:mh@pointcast\.xyz/);
assert.match(html, /\/services\/#starter-kit/);
assert.match(html, /"@type": "Service"/);
assert.match(html, /rel="canonical" href="https:\/\/www\.industrynext\.xyz\/services\/manufacturing\/"/);
assert.match(html, /data-placement="footer"/);
assert.match(html, /type="module" src="\/services\/manufacturing\/quote\.js/);
assert.doesNotMatch(html, /endorsed by|partnered with/i);
assert.match(js, /from "\/services\/manufacturing\/quote-engine\.js"/);
assert.match(css, /@media \(max-width: 700px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /prefers-contrast: more/);

// Engine: small tough part goes in a box on pallets.
const box = quote({ part: "Bracket", length: 12, width: 8, height: 4, weight: 6, quantity: 200, care: "standard", mode: "ltl" });
assert.ok(box.ok);
assert.equal(box.format, "single-wall");
assert.deepEqual(box.inside, { length: 14, width: 10, height: 6 });
assert.ok(box.pallets >= 1);
assert.ok(box.plan.perPallet * box.pallets >= 200);
assert.ok(box.cost.low < box.cost.high);

// Heavy precision part going overseas gets a heat-treated crate and the ISPM 15 note.
const crate = quote({ length: 30, width: 24, height: 20, weight: 180, quantity: 4, care: "precision", mode: "ocean" });
assert.equal(crate.format, "export-crate");
assert.equal(crate.crates, 4);
assert.equal(crate.pallets, 0);
assert.ok(crate.flags.some((f) => /ISPM 15/.test(f)));
assert.ok(crate.grossEach > 180);

// Fragile part gets double wall and more cushion.
const fragile = quote({ length: 6, width: 6, height: 3, weight: 2, quantity: 10, care: "fragile", mode: "parcel" });
assert.equal(fragile.format, "double-wall");
assert.equal(fragile.padding, 2);
assert.equal(fragile.pallets, 0, "parcel ships loose");

// Do-not-stack pallets stay one layer high; weight cap holds.
assert.equal(palletPlan({ length: 20, width: 20, height: 10 }, 50, false).layers, 1);
const heavy = palletPlan({ length: 24, width: 20, height: 8 }, 400, true);
assert.ok(heavy.perPallet * 400 <= 2000);

// Missing size is reported, not guessed.
const missing = quote({ width: 4, height: 4, weight: 2 });
assert.equal(missing.ok, false);
assert.deepEqual(missing.missing, ["length"]);
assert.equal(rfqText(missing), "");

// The request for quote is a draft with a signature line.
const text = rfqText(box);
assert.match(text, /DRAFT, NOT YET SIGNED/);
assert.match(text, /Approved by:/);
assert.match(text, /Pallets: \d+ x 48 x 40/);

console.log("Manufacturing verification passed: eight needs answered, three builds, packaging spec-to-quote engine, draft RFQ with sign-off, responsive safeguards.");
