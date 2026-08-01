import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const files = {
  html: new URL("../public/market/index.html", import.meta.url),
  css: new URL("../public/market/market.css", import.meta.url),
  script: new URL("../public/market/market.js", import.meta.url),
  json: new URL("../public/market.json", import.meta.url),
  og: new URL("../public/market/og.svg", import.meta.url),
};

await Promise.all(Object.values(files).map((file) => access(file)));

const [html, css, script, data, og, home, desk, product, services, role, tagPage, headers, sitemap, manifest, pkg] = await Promise.all([
  readFile(files.html, "utf8"),
  readFile(files.css, "utf8"),
  readFile(files.script, "utf8"),
  readFile(files.json, "utf8").then(JSON.parse),
  readFile(files.og, "utf8"),
  readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/desk/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/product/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/services/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/roles/playlist-editor/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/next/tag/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/_headers", import.meta.url), "utf8"),
  readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8"),
  readFile(new URL("../public/site.webmanifest", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
]);

assert.match(html, /<h1 id="market-title">Turn work/);
assert.match(html, /JOB[\s\S]*TASK[\s\S]*ORG[\s\S]*TOKEN/);
assert.match(html, /Halation[\s\S]*Lead/);
assert.match(html, /Playlist[\s\S]*Editor/);
assert.match(html, /AI[\s\S]*Credits/);
assert.match(html, /TERMS BEFORE TRANSACTIONS/);
assert.match(html, /No candidate owes unpaid commercial production/);
assert.match(html, /No card here connects a wallet/);
assert.match(html, /Local only\. No account\. No wallet\./);
assert.match(html, /rel="alternate" type="application\/json" href="\/market\.json"/);
assert.match(html, /industry-next-icon\.svg/);
assert.match(html, /data-placement="footer"/);
assert.equal((html.match(/class="market-card/g) || []).length, 10);
assert.equal((html.match(/data-filter=/g) || []).length, 5);
assert.equal((html.match(/data-kind="job"/g) || []).length, 3);
assert.equal((html.match(/data-kind="task"/g) || []).length, 3);
assert.equal((html.match(/data-kind="organization"/g) || []).length, 1);
assert.equal((html.match(/data-kind="token"/g) || []).length, 3);

assert.match(css, /\.market-grid/);
assert.match(css, /\.listing-form/);
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /prefers-contrast: more/);

assert.match(script, /navigator\.clipboard/);
assert.match(script, /local-draft/);
assert.match(script, /automatic_settlement: false/);
assert.match(script, /scrollIntoView/);
assert.doesNotMatch(script, /innerHTML/);

assert.match(og, /width="1200" height="630"/);
assert.match(og, /TURN WORK/);

assert.equal(data.id, "industrynext.work-market/v1");
assert.equal(data.market_rules.escrow_contract, false);
assert.equal(data.market_rules.automatic_settlement, false);
assert.equal(data.market_rules.written_terms_required_before_work, true);
assert.equal(data.counts.open_jobs, 3);
assert.equal(data.counts.first_tasks, 3);
assert.equal(data.counts.funded_credit_rails, 1);
assert.equal(data.counts.active_xtz_listings, 0);
assert.equal(data.organizations.length, 1);
assert.equal(data.reward_rails.length, 3);
assert.equal(data.opportunities.length, 6);

const halation = data.opportunities.find((item) => item.id === "halation-lead");
const playlist = data.opportunities.find((item) => item.id === "playlist-editor-listener-growth");
const tagOpportunity = data.opportunities.find((item) => item.id === "tag-open-build-lead");
const aiCredits = data.reward_rails.find((item) => item.id === "ai-credits");
const xtz = data.reward_rails.find((item) => item.id === "xtz");
assert.equal(halation.reward.status, "funded");
assert.equal(halation.reward.rail_id, "ai-credits");
assert.equal(halation.reward.amount, null);
assert.equal(playlist.reward.status, "disclosed");
assert.equal(playlist.reward.guaranteed_cash_usd, 0);
assert.equal(playlist.reward.potential_upside, "project-specific revenue share");
assert.equal(playlist.reward.revenue_guaranteed, false);
assert.equal(tagOpportunity.duration_weeks, 4);
assert.equal(tagOpportunity.reward.rail_id, "ai-credits");
assert.equal(tagOpportunity.reward.status, "provided");
assert.equal(aiCredits.transferable, false);
assert.equal(aiCredits.cryptocurrency, false);
assert.deepEqual(xtz.active_listings, []);
assert.ok(data.opportunities.filter((item) => item.kind === "job").every((job) => data.opportunities.some((task) => task.id === job.first_task_id)));
assert.ok(data.opportunities.every((item) => item.organization_id === "industry-next"));

for (const doorway of [home, desk, product, services, role, tagPage]) assert.match(doorway, /href="\/market\/"/);
assert.match(home, /WORK MARKET \/ JOB \+ TASK \+ ORG \+ TOKEN/);
assert.match(headers, /\/market\.json[\s\S]*Content-Type: application\/json/);
assert.match(sitemap, /industrynext\.xyz\/market\//);
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/market/"));
assert.equal(pkg.scripts["verify:market"], "node ./scripts/verify-market.mjs");

console.log("Work Market verification passed: linked jobs, first tasks, organization authority, reward rails, local listing drafts, JSON contract, and site doorways.");
