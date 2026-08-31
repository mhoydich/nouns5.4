import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const help = await readFile(new URL("../public/help/index.html", import.meta.url), "utf8");
const experts = await readFile(new URL("../public/experts/index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../public/ai-work.css", import.meta.url), "utf8");
const script = await readFile(new URL("../public/ai-work.js", import.meta.url), "utf8");
const helpData = JSON.parse(await readFile(new URL("../public/help.json", import.meta.url), "utf8"));
const expertData = JSON.parse(await readFile(new URL("../public/experts.json", import.meta.url), "utf8"));
const home = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const services = await readFile(new URL("../public/services/index.html", import.meta.url), "utf8");
const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const headers = await readFile(new URL("../public/_headers", import.meta.url), "utf8");

assert.match(help, /<h1 id="help-title">Bring one/);
assert.match(help, /AI WORKING SESSION/);
assert.match(help, /\$350/);
assert.match(help, /75 MINUTES/);
assert.match(help, /\$2\.5K/);
assert.match(help, /\$50K/);
assert.match(help, /id="request"/);
assert.equal((help.match(/data-email-form/g) || []).length, 1);
assert.match(help, /Nothing is uploaded or sent by this page/);
assert.match(help, /Do not paste passwords/);
assert.match(help, /data-placement="footer"/);
assert.match(help, /rel="alternate" type="application\/json"/);

assert.match(experts, /<h1 id="expert-title">The model/);
assert.match(experts, /EXPERT TEST PACK/);
assert.match(experts, /\$12\.5K/);
assert.match(experts, /30–50 expert cases/);
assert.match(experts, /Paid calibration/);
assert.match(experts, /FOUNDING 10/);
assert.match(experts, /Micro1, Mercor, Turing, Scale, Invisible/);
assert.match(experts, /does not claim partnership/);
assert.match(experts, /id="agent-bench"/);
assert.match(experts, /Rent the[\s\S]*capability/);
assert.match(experts, /Research Runner/);
assert.match(experts, /Communications Helper/);
assert.match(experts, /Operations Assistant/);
assert.match(experts, /FROM \$1,500 \/ MONTH/);
assert.match(experts, /Messages, purchases, deletions, and consequential actions wait for approval/);
assert.equal((experts.match(/data-email-form/g) || []).length, 3);
assert.match(experts, /data-placement="footer"/);

for (const html of [help, experts]) {
  assert.doesNotMatch(html, /<form[^>]+action=/i);
  assert.doesNotMatch(html, /<form[^>]+method=/i);
  assert.doesNotMatch(html, /<input[^>]+type="password"/i);
  assert.match(html, /data-recipient="mh@pointcast\.xyz"/);
}

assert.match(css, /\.work-hero/);
assert.match(css, /\.offer-grid/);
assert.match(css, /\.work-form/);
assert.match(css, /\.deliver-grid/);
assert.match(css, /\.agent-bench/);
assert.match(css, /@media \(max-width: 700px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);

assert.match(script, /new FormData\(form\)/);
assert.match(script, /navigator\.clipboard\.writeText/);
assert.match(script, /mailto:/);
assert.match(script, /Nothing is sent until you review and send it/);
assert.doesNotMatch(script, /fetch\(/);
assert.doesNotMatch(script, /localStorage/);
assert.doesNotMatch(script, /innerHTML/);

assert.equal(helpData.offers[0].price_usd, 350);
assert.equal(helpData.offers[1].price_usd, 2500);
assert.equal(helpData.offers[2].price_usd, 50000);
assert.equal(helpData.privacy.form_storage, "none");
assert.equal(expertData.client_offer.starting_price_usd, 12500);
assert.equal(expertData.v2.starting_hypothesis_usd_per_month, 1500);
assert.equal(expertData.v2.roles.length, 3);
assert.ok(expertData.expert_terms.includes("paid calibration"));

assert.match(home, /href="\/help\/"/);
assert.match(home, /href="\/experts\/"/);
assert.match(home, /href="\/experts\/#agent-bench"/);
assert.match(services, /href="\/help\/"/);
assert.match(services, /href="\/experts\/"/);
assert.match(sitemap, /industrynext\.xyz\/help\//);
assert.match(sitemap, /industrynext\.xyz\/experts\//);
assert.match(sitemap, /industrynext\.xyz\/help\.json/);
assert.match(sitemap, /industrynext\.xyz\/experts\.json/);
assert.match(headers, /\/help\/\*/);
assert.match(headers, /\/experts\/\*/);
assert.match(headers, /\/help\.json[\s\S]*Content-Type: application\/json/);
assert.match(headers, /\/experts\.json[\s\S]*Content-Type: application\/json/);

console.log("AI work verification passed: paid help, expert pods, V2 Agent Bench, local-only intake, machine-readable offers, and site-wide doors.");
