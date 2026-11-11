import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [html, css, dataText, hardware, hardwareText, next, headers, sitemap] = await Promise.all([
  read("../public/hardware/baby-bonfire/index.html"),
  read("../public/hardware/baby-bonfire/baby-bonfire.css"),
  read("../public/baby-bonfire.json"),
  read("../public/hardware/index.html"),
  read("../public/hardware.json"),
  read("../public/next/index.html"),
  read("../public/_headers"),
  read("../public/sitemap.xml"),
]);
const data = JSON.parse(dataText);
const hardwareData = JSON.parse(hardwareText);

// Page: the venture file says what it is, what stage it is in, and what is not true yet.
assert.match(html, /<h1 id="hero-title">Baby<br \/><em>Bonfire\.<\/em><\/h1>/);
assert.match(html, /rel="canonical" href="https:\/\/www\.industrynext\.xyz\/hardware\/baby-bonfire\/"/);
assert.match(html, /rel="alternate" type="application\/json" href="\/baby-bonfire\.json"/);
assert.match(html, /href="\/hardware\/hardware\.css/);
assert.match(html, /Nothing on this page has been manufactured, burn-tested, certified or offered for sale/);
assert.match(html, /FIRE IS THE SWITCH/);
assert.match(html, /no camera and no microphone/);
assert.equal((html.match(/class="layer layer-/g) || []).length, 4, "piece, place, puck, scene");
assert.equal((html.match(/class="build-card/g) || []).length, 6, "six element cards");
assert.equal((html.match(/<li class="stage/g) || []).length, 5, "five stages");
assert.equal((html.match(/class="stage is-now"/g) || []).length, 1, "one stage is open");
assert.equal((html.match(/<li><span>0\d<\/span><strong>/g) || []).length, 8, "eight rules");
assert.equal((html.match(/class="thread-state/g) || []).length, 4, "four threads");
assert.match(html, /mailto:mh@pointcast\.xyz/);
assert.match(html, /Send a one-page brief/);
assert.match(html, /data-placement="footer"/);
assert.match(html, /<svg viewBox="0 0 560 520" role="img"/);

// Boundaries: no private links, no sale language, no borrowed names.
assert.doesNotMatch(html, /claude\.ai/i);
assert.doesNotMatch(html, /add to cart|buy now|pre-?order|in stock|ships? (in|by)/i);
assert.doesNotMatch(html, /endorsed by|partnered with|certified by/i);
assert.doesNotMatch(html + dataText, /atari|good feels|cannabis/i);
assert.doesNotMatch(html, /<script(?![^>]*(application\/ld\+json|open-ad-network))/, "no page script needed");

assert.match(css, /@media \(max-width: 700px\)/);
assert.match(css, /prefers-contrast: more/);
assert.doesNotMatch(css, /@import/);

// Machine twin matches the page.
assert.equal(data.schema_version, "industrynext.venture.v1");
assert.equal(data.status, "exploration");
assert.equal(data.started, "2026-11-11");
assert.equal(data.stages.length, 5);
assert.equal(data.stages.filter((stage) => stage.state === "now").length, 1);
assert.equal(data.stages[0].state, "now");
assert.equal(data.pieces.length, 6);
assert.equal(data.rules.length, 8);
assert.equal(data.threads.length, 4);
assert.equal(data.threads[0].items.length, 6);
assert.equal(data.contact, "mh@pointcast.xyz");
assert.match(data.boundary, /Nothing has been manufactured/);
for (const stage of data.stages) assert.ok(html.includes(stage.name), `page names stage ${stage.name}`);
for (const scene of data.threads[0].items) assert.ok(html.includes(scene), `page names scene ${scene}`);

// Wiring: linked from the hardware index and the field map, served as JSON, in the sitemap.
assert.match(hardware, /href="\/hardware\/baby-bonfire\/"/);
assert.equal(hardwareData.ventures[0].id, "baby-bonfire");
assert.match(next, /href="\/hardware\/baby-bonfire\/"/);
assert.match(headers, /\/baby-bonfire\.json[\s\S]*application\/json/);
assert.match(sitemap, /industrynext\.xyz\/hardware\/baby-bonfire\//);
assert.match(sitemap, /industrynext\.xyz\/baby-bonfire\.json/);

console.log("Verified Baby Bonfire venture file.");
