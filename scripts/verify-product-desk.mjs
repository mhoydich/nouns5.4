import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const htmlUrl = new URL("../public/product/index.html", import.meta.url);
const cssUrl = new URL("../public/product/product.css", import.meta.url);
const scriptUrl = new URL("../public/product/product.js", import.meta.url);
const jsonUrl = new URL("../public/product.json", import.meta.url);
const socialUrl = new URL("../public/product-og.png", import.meta.url);

await Promise.all([access(htmlUrl), access(cssUrl), access(scriptUrl), access(jsonUrl), access(socialUrl)]);

const [html, css, script, data, social, home, services, next, taskDesk, headers, sitemap, charter] = await Promise.all([
  readFile(htmlUrl, "utf8"),
  readFile(cssUrl, "utf8"),
  readFile(scriptUrl, "utf8"),
  readFile(jsonUrl, "utf8").then(JSON.parse),
  readFile(socialUrl),
  readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/services/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/next/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/desk/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/_headers", import.meta.url), "utf8"),
  readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8"),
  readFile(new URL("../PRODUCT-MANAGER.md", import.meta.url), "utf8"),
]);

assert.match(html, /<h1 id="desk-title">Make the work/);
assert.match(html, /Product Manager/);
assert.match(html, /Own the system[\s\S]*Yield the work/);
assert.match(html, /LEAD[\s\S]*CALLS[\s\S]*WIN/);
assert.match(html, /No cash pay[\s\S]*before the trigger/);
assert.match(html, /not an employment offer/i);
assert.match(html, /No candidate is expected[\s\S]*unpaid labor/);
assert.match(html, /href="\/product\.json"/);
assert.match(html, /rel="alternate" type="application\/json"/);
assert.match(html, /data-placement="footer"/);
assert.match(html, /product-og\.png/);
assert.match(html, /industry-next-icon\.svg/);
assert.equal((html.match(/data-work-state=/g) || []).length, 10);
assert.equal((html.match(/data-filter=/g) || []).length, 5);

assert.match(css, /\.board-grid/);
assert.match(css, /\.yield-protocol/);
assert.match(css, /@media \(max-width: 700px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /prefers-contrast: more/);

assert.match(script, /navigator\.clipboard\.writeText/);
assert.match(script, /aria-pressed/);
assert.doesNotMatch(script, /innerHTML/);

assert.equal(social.subarray(1, 4).toString("ascii"), "PNG");
assert.equal(social.readUInt32BE(16), 1731);
assert.equal(social.readUInt32BE(20), 909);

assert.equal(data.id, "industrynext.product-desk/v1");
assert.equal(data.role.name, "Product Manager");
assert.equal(data.compensation.cash_before_trigger_usd, 0);
assert.equal(data.compensation.paid_engagement_triggers.length, 2);
assert.equal(data.compensation.unpaid_candidate_labor_expected, false);
assert.equal(data.compensation.automatic_equity_promised, false);
assert.ok(data.governance.rule.includes("Yield the work"));
assert.equal(data.board.length, 10);
assert.equal(data.board.filter((item) => item.state === "now").length, 4);
assert.ok(data.board.every((item) => item.outcome && item.lead_boundary && item.next_decision && item.url));
assert.ok(data.board.some((item) => item.id === "playlist-editor-listener-growth"));
assert.ok(data.board.some((item) => item.id === "halation-lead-request"));
assert.ok(data.board.some((item) => item.id === "industry-next-task-desk"));
assert.ok(data.board.some((item) => item.id === "industry-next-work-market"));

assert.match(home, /href="\/product\/"/);
assert.match(home, /Product Desk/);
assert.match(home, /Task Desk/);
assert.match(home, /Put the scope, owner, terms, and proof on the same page/);
assert.match(home, /Public work markets, product decisions, client systems/);
assert.match(services, /href="\/product\/"/);
assert.match(next, /href="\/product\/"/);
assert.match(taskDesk, /href="\/product\/"/);
assert.match(headers, /\/product\.json[\s\S]*Content-Type: application\/json/);
assert.match(headers, /\/product-og\.png[\s\S]*Content-Type: image\/png/);
assert.match(sitemap, /industrynext\.xyz\/product\//);
assert.match(charter, /Never present impressions as people/);

console.log("Product Desk verification passed: public charter, operating board, lead-yield governance, compensation gate, weekly cadence, JSON state, and site doorways.");
