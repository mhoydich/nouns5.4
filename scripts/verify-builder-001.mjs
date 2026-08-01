import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const files = {
  html: new URL("public/builders/001/index.html", root),
  css: new URL("public/builders/001/builder.css", root),
  script: new URL("public/builders/001/builder.js", root),
  json: new URL("public/builder-001.json", root),
  og: new URL("public/builders/001/og.svg", root),
};
await Promise.all(Object.values(files).map((file) => access(file)));

const [html, css, script, data, og, marketHtml, marketData, next, headers, sitemap, pkg] = await Promise.all([
  readFile(files.html, "utf8"),
  readFile(files.css, "utf8"),
  readFile(files.script, "utf8"),
  readFile(files.json, "utf8").then(JSON.parse),
  readFile(files.og, "utf8"),
  readFile(new URL("public/market/index.html", root), "utf8"),
  readFile(new URL("public/market.json", root), "utf8").then(JSON.parse),
  readFile(new URL("public/next/index.html", root), "utf8"),
  readFile(new URL("public/_headers", root), "utf8"),
  readFile(new URL("public/sitemap.xml", root), "utf8"),
  readFile(new URL("package.json", root), "utf8").then(JSON.parse),
]);

assert.match(html, /Builder 001 — Small Social Systems/);
assert.match(html, /The social graph is already full/);
assert.match(html, /Build the missing ritual/);
assert.match(html, /id="whitespace"/);
assert.equal((html.match(/class="space-grid"/g) || []).length, 1);
assert.equal((html.match(/<article>/g) || []).length, 18);
assert.equal((html.match(/class="signal-grid"/g) || []).length, 1);
for (const source of ["developer.apple.com/imessage", "docs.discord.com/developers/platform/activities", "core.telegram.org/bots/webapps", "newsroom.spotify.com/2026-01-07", "apps.apple.com/us/app/locket", "info.partiful.com"]) assert.match(html, new RegExp(source.replaceAll(".", "\\.")));
assert.match(html, /id="builder-application"/);
assert.match(html, /this page uploads nothing/);
assert.match(html, /AI credits are operating support/);
assert.match(html, /data-placement="footer"/);
assert.match(html, /rel="alternate" type="application\/json" href="\/builder-001\.json"/);

assert.match(css, /@media \(max-width:760px\)/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.match(css, /prefers-contrast:more/);
assert.match(css, /\.space-grid/);
assert.match(css, /\.application-form/);
assert.match(script, /localStorage/);
assert.match(script, /mailto:mh@pointcast\.xyz/);
assert.match(script, /navigator\.clipboard/);
assert.doesNotMatch(script, /innerHTML/);
assert.match(og, /width="1200" height="630"/);
assert.match(og, /SMALL/);

assert.equal(data.id, "industrynext.builder-001.small-social-systems");
assert.equal(data.status, "open");
assert.equal(data.white_spaces.length, 10);
assert.equal(data.edge_signals.length, 6);
assert.equal(data.builder_role.count, 1);
assert.equal(data.builder_role.duration_weeks, 4);
assert.equal(data.builder_role.first_proof_days, 7);
assert.match(data.builder_role.terms, /not cash compensation/);
assert.equal(data.apply.email, "mh@pointcast.xyz");

const builderJob = marketData.opportunities.find((item) => item.id === "small-social-systems-builder");
const builderTask = marketData.opportunities.find((item) => item.id === "small-social-systems-first-ritual");
assert.ok(builderJob);
assert.ok(builderTask);
assert.equal(builderJob.first_task_id, builderTask.id);
assert.equal(builderJob.reward.rail_id, "ai-credits");
assert.equal(marketData.counts.open_jobs, 4);
assert.equal(marketData.counts.first_tasks, 6);
assert.match(marketHtml, /Small Social<br \/>Systems Builder/);
assert.match(marketHtml, /JOB \/ 011/);
assert.match(marketHtml, /TASK \/ 012/);
assert.match(next, /href="\/builders\/001\/"/);
assert.match(headers, /\/builder-001\.json[\s\S]*Content-Type: application\/json/);
assert.match(sitemap, /industrynext\.xyz\/builders\/001\//);
assert.equal(pkg.scripts["verify:builder-001"], "node ./scripts/verify-builder-001.mjs");

console.log("Builder 001 verified: field map, ten white spaces, six source signals, role terms, local application, market job/task, machine twin, and discovery route.");
