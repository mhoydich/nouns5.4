import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const files = {
  html: new URL("public/intern-read/001/index.html", root),
  css: new URL("public/intern-read/001/styles.css", root),
  script: new URL("public/intern-read/001/model.js", root),
  og: new URL("public/intern-read/001/og.svg", root),
  ogPng: new URL("public/intern-read/001/og.png", root),
  json: new URL("public/intern-read-001.json", root),
};

await Promise.all(Object.values(files).map((file) => access(file)));

const [html, css, script, og, data, home, headers, sitemap, pkg] = await Promise.all([
  readFile(files.html, "utf8"),
  readFile(files.css, "utf8"),
  readFile(files.script, "utf8"),
  readFile(files.og, "utf8"),
  readFile(files.json, "utf8").then(JSON.parse),
  readFile(new URL("public/index.html", root), "utf8"),
  readFile(new URL("public/_headers", root), "utf8"),
  readFile(new URL("public/sitemap.xml", root), "utf8"),
  readFile(new URL("package.json", root), "utf8").then(JSON.parse),
]);

assert.match(html, /Your first decade is a position/);
assert.match(html, /Finance is the operating layer of your choices/);
assert.match(html, /THE THREE MACHINES/);
assert.match(html, /BORING BEFORE BRILLIANT/);
assert.match(html, /THE TEN-YEAR MAP \/ 2026–2036/);
assert.match(html, /Your salary is only the loudest number/);
assert.match(html, /AI CHANGES THE BARGAIN/);
assert.match(html, /id="model"/);
assert.match(html, /Educational scenario, not individualized financial, tax, legal, or investment advice/);
assert.match(html, /Nothing entered or checked on this page is transmitted or stored/);
assert.match(html, /href="\/intern-read-001\.json"/);
assert.match(html, /consumerfinance\.gov/);
assert.match(html, /investor\.gov/);
assert.match(html, /irs\.gov/);
assert.match(html, /studentaid\.gov\/loan-simulator/);

assert.match(css, /@media \(max-width: 520px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /@media print/);
assert.match(script, /const updateModel/);
assert.match(script, /for \(let month = 0; month < 120/);
assert.match(script, /window\.print/);
assert.doesNotMatch(script, /fetch\(|localStorage|sessionStorage/);
assert.match(og, /Your First Decade Is a Position/);

assert.equal(data.schema, "industrynext.intern-read/v1");
assert.equal(data.id, "industrynext.intern-read/001");
assert.equal(data.canonical, "https://www.industrynext.xyz/intern-read/001/");
assert.equal(data.three_machines.length, 3);
assert.equal(data.decade_map.length, 5);
assert.equal(data.model.horizon_years, 10);
assert.equal(data.model.defaults.annual_gross_pay_usd, 72_000);
assert.equal(data.model.default_outputs.monthly_unassigned_margin_usd, 640);
assert.equal(data.model.default_outputs.ten_year_illustrative_ownership_usd, 127_703);
assert.ok(data.official_sources.every((source) => source.startsWith("https://")));

assert.match(home, /href="\/intern-read\/001\/"/);
assert.match(headers, /\/intern-read-001\.json[\s\S]*Content-Type: application\/json/);
assert.match(sitemap, /industrynext\.xyz\/intern-read\/001\//);
assert.match(sitemap, /industrynext\.xyz\/intern-read-001\.json/);
assert.equal(pkg.scripts["verify:intern-read-001"], "node ./scripts/verify-intern-read-001.mjs");

console.log("Intern Read 001 verification passed: graduate thesis, three-machine framework, ten-year map, private local model, official sources, printable field sheet, JSON edition, and site doorways.");
