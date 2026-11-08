import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dir = "public/recipes/call-or-be-called";
const page = await readFile(`${dir}/index.html`, "utf8");
const css = await readFile(`${dir}/styles.css`, "utf8");
const js = await readFile(`${dir}/copy.js`, "utf8");
const sitemap = await readFile("public/sitemap.xml", "utf8");
const headers = await readFile("public/_headers", "utf8");
const record = JSON.parse(await readFile("public/call-or-be-called.json", "utf8"));

assert.match(page, /AI Recipes 001<br \/><em>Call or be called\.<\/em>/);
assert.match(page, /rel="canonical" href="https:\/\/www\.industrynext\.xyz\/recipes\/call-or-be-called\/"/);
assert.match(page, /application\/ld\+json/);
assert.match(page, /mailto:mh@pointcast\.xyz/);
assert.match(page, /data-pointcast-network/);
assert.match(page, /call-or-be-called\.json/);
assert.match(page, /not legal advice/);

const ids = ["r01", "r02", "r03", "r04", "r05", "r06", "r07", "r08"];
for (const id of ids) {
  assert.match(page, new RegExp(`<article class="recipe px" id="${id}" data-recipe>`), `${id} card`);
  assert.match(page, new RegExp(`href="#${id}"`), `${id} menu link`);
}
assert.equal((page.match(/data-copy>/g) || []).length, ids.length, "one copy button per recipe");
assert.equal((page.match(/<strong>WATCH OUT<\/strong>/g) || []).length, ids.length, "one watch-out per recipe");
assert.deepEqual(record.recipes.map((r) => r.id), ids);
assert.equal(record.canonical, "https://www.industrynext.xyz/recipes/call-or-be-called/");

// every external source is https and opens without a referrer
for (const [, href] of page.matchAll(/<a href="(http[^"]+)" target="_blank" rel="noreferrer">/g)) {
  assert.ok(href.startsWith("https://"), `${href} should be https`);
}
assert.doesNotMatch(page, /—/, "no em dashes in the copy");

assert.match(css, /@media \(max-width: 620px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.doesNotMatch(js, /fetch\(|localStorage|XMLHttpRequest/, "copy script stays local");
assert.match(sitemap, /\/recipes\/call-or-be-called\//);
assert.match(sitemap, /\/call-or-be-called\.json/);
assert.match(headers, /\/call-or-be-called\.json\n  Content-Type: application\/json/);

console.log("AI Recipes 001 verified: 8 recipes, sources, sitemap, headers.");
