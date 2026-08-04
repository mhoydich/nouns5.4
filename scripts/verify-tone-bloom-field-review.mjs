import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const page = await readFile("public/editorial/tone-bloom-field-review/index.html", "utf8");
const css = await readFile("public/editorial/tone-bloom-field-review/styles.css", "utf8");
const home = await readFile("public/index.html", "utf8");
const sitemap = await readFile("public/sitemap.xml", "utf8");
const record = JSON.parse(await readFile("public/tone-bloom-field-review.json", "utf8"));
const social = await stat("public/editorial/tone-bloom-field-review/tone-bloom-field-review-og.png");

assert.match(page, /Tone Bloom is a laboratory for play\./i);
assert.match(page, /Fifty-two sound rooms/i);
assert.match(page, /Six useful doors into Tone Bloom/i);
assert.match(page, /not a request for speculative unpaid labor/i);
assert.match(page, /https:\/\/tonebloom\.xyz\/about\/field-review/);
assert.match(page, /mailto:mh@pointcast\.xyz/);
assert.match(page, /GPT-5\.6 Sol/i);
assert.match(page, /application\/ld\+json/);
assert.match(css, /@media \(max-width: 620px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.match(home, /\/editorial\/tone-bloom-field-review\//);
assert.match(sitemap, /\/editorial\/tone-bloom-field-review\//);
assert.match(sitemap, /\/tone-bloom-field-review\.json/);
assert.equal(record.current_room_count, 52);
assert.equal(record.research_lines.length, 6);
assert.equal(record.contribution_doors.length, 6);
assert.ok(social.size > 100_000, "social card should be a substantial image");

console.log("Tone Bloom field review editorial verified.");
