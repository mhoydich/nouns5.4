import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const files = {
  html: new URL("public/early-career/index.html", root),
  css: new URL("public/early-career/early-career.css", root),
  script: new URL("public/early-career/early-career.js", root),
  json: new URL("public/early-career.json", root),
  og: new URL("public/early-career/og.svg", root),
};

await Promise.all(Object.values(files).map((file) => access(file)));

const [html, css, script, data, og, market, marketData, home, internRead, headers, sitemap, manifest, pkg] = await Promise.all([
  readFile(files.html, "utf8"),
  readFile(files.css, "utf8"),
  readFile(files.script, "utf8"),
  readFile(files.json, "utf8").then(JSON.parse),
  readFile(files.og, "utf8"),
  readFile(new URL("public/market/index.html", root), "utf8"),
  readFile(new URL("public/market.json", root), "utf8").then(JSON.parse),
  readFile(new URL("public/index.html", root), "utf8"),
  readFile(new URL("public/intern-read/001/index.html", root), "utf8"),
  readFile(new URL("public/_headers", root), "utf8"),
  readFile(new URL("public/sitemap.xml", root), "utf8"),
  readFile(new URL("public/site.webmanifest", root), "utf8").then(JSON.parse),
  readFile(new URL("package.json", root), "utf8").then(JSON.parse),
]);

assert.match(html, /STARTING LINE \/ FIELD DESK 001 \/ INTERNS \+ RECENT GRADUATES/);
assert.match(html, /You do not need[\s\S]*a perfect plan[\s\S]*You need a first receipt/);
assert.match(html, /Six useful doors/);
assert.match(html, /Your first decade is a position/);
assert.match(html, /A job is an operating system/);
assert.match(html, /Do not spend the first month proving you already know/);
assert.match(html, /Keep the human part inspectable/);
assert.match(html, /id="receipt-form"/);
assert.match(html, /Nothing entered here is sent or stored/);
assert.match(html, /Real openings\. Readable terms/);
assert.match(html, /These are Industry Next opportunities—not a scraped job feed/);
assert.match(html, /Halation Lead/);
assert.match(html, /Playlist Editor/);
assert.match(html, /TAG Build Lead/);
assert.match(html, /Small Social Systems Builder/);
assert.match(html, /\$0 cash guaranteed/);
assert.match(html, /AI tool credits · not cash compensation/);
assert.match(html, /No candidate owes unpaid commercial production/);
assert.match(html, /href="\/market\/"/);
assert.match(html, /href="\/market\.json"/);
assert.match(html, /href="\/early-career\.json"/);
assert.match(html, /consumerfinance\.gov/);
assert.match(html, /studentaid\.gov\/loan-simulator/);
assert.match(html, /irs\.gov/);
assert.match(html, /investor\.gov/);
assert.match(html, /data-placement="footer"/);
assert.equal((html.match(/class="resource-card/g) || []).length, 6);
assert.equal((html.match(/class="job-card/g) || []).length, 4);

assert.match(css, /\.resource-grid/);
assert.match(css, /\.job-board/);
assert.match(css, /\.receipt-form/);
assert.match(css, /@media \(max-width: 480px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /@media print/);

assert.match(script, /new FormData\(form\)/);
assert.match(script, /navigator\.clipboard/);
assert.match(script, /textContent/);
assert.doesNotMatch(script, /innerHTML|fetch\(|localStorage|sessionStorage/);

assert.match(og, /width="1200" height="630"/);
assert.match(og, /STARTING LINE/);

assert.equal(data.schema, "industrynext.early-career/v1");
assert.equal(data.canonical, "https://www.industrynext.xyz/early-career/");
assert.equal(data.resources.length, 6);
assert.equal(data.resources.find((resource) => resource.id === "first-receipt").transmits_or_stores_inputs, false);
assert.equal(data.jobs_snapshot.cash_compensation_implied, false);
assert.equal(data.jobs_snapshot.written_terms_required_before_work, true);
assert.equal(data.jobs_snapshot.open_role_ids.length, 4);
assert.equal(data.jobs_snapshot.bounded_field_task_ids.length, 2);
assert.ok(data.official_sources.every((source) => source.startsWith("https://")));

const openMarketJobs = marketData.opportunities
  .filter((item) => item.kind === "job" && item.status === "open")
  .map((item) => item.id)
  .sort();
assert.deepEqual([...data.jobs_snapshot.open_role_ids].sort(), openMarketJobs);
for (const taskId of data.jobs_snapshot.bounded_field_task_ids) {
  assert.ok(marketData.opportunities.some((item) => item.id === taskId && item.kind === "task" && item.status === "open"));
}
assert.equal(marketData.counts.open_jobs, 4);
assert.equal(marketData.market_rules.written_terms_required_before_work, true);

for (const doorway of [home, market, internRead]) assert.match(doorway, /href="\/early-career\/"/);
assert.match(headers, /\/early-career\.json[\s\S]*Content-Type: application\/json/);
assert.match(sitemap, /industrynext\.xyz\/early-career\//);
assert.match(sitemap, /industrynext\.xyz\/early-career\.json/);
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/early-career/"));
assert.equal(pkg.scripts["verify:early-career"], "node ./scripts/verify-early-career.mjs");

console.log("Starting Line verification passed: six resource doors, private first-receipt tool, 30/60/90 map, official sources, and four Work Market roles with explicit support boundaries.");
