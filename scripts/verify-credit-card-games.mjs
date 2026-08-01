import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const files = {
  html: new URL("public/editorial/credit-card-games/index.html", root),
  css: new URL("public/editorial/credit-card-games/styles.css", root),
  script: new URL("public/editorial/credit-card-games/model.js", root),
  json: new URL("public/credit-card-games.json", root),
  provenance: new URL("public/editorial/credit-card-games/images/provenance.json", root),
  hero: new URL("public/editorial/credit-card-games/images/credit-card-games-hero.jpg", root),
  table: new URL("public/editorial/credit-card-games/images/credit-card-games-table.jpg", root),
  machine: new URL("public/editorial/credit-card-games/images/credit-card-games-machine.jpg", root),
  network: new URL("public/editorial/credit-card-games/images/credit-card-games-network.jpg", root),
};

await Promise.all(Object.values(files).map((file) => access(file)));

const [html, css, script, data, provenance, home, headers, sitemap, pkg] = await Promise.all([
  readFile(files.html, "utf8"),
  readFile(files.css, "utf8"),
  readFile(files.script, "utf8"),
  readFile(files.json, "utf8").then(JSON.parse),
  readFile(files.provenance, "utf8").then(JSON.parse),
  readFile(new URL("public/index.html", root), "utf8"),
  readFile(new URL("public/_headers", root), "utf8"),
  readFile(new URL("public/sitemap.xml", root), "utf8"),
  readFile(new URL("package.json", root), "utf8").then(JSON.parse),
]);

assert.match(html, /Money becomes a multiplayer medium/);
assert.match(html, /PREVIEW ONE \$5 MOVE/);
assert.match(html, /Eight ways a contribution can behave/);
assert.match(html, /The billion-dollar version is not one hit game/);
assert.match(html, /id="modeler"/);
assert.match(html, /Scenario model, not a forecast or investment valuation/);
assert.match(html, /No card form, charge, or stored payment information/);
assert.match(html, /Made with Codex \+ Midjourney/);
assert.match(html, /href="\/credit-card-games\.json"/);

assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(script, /const updateModel/);
assert.match(script, /litWindows \+= 1/);
assert.doesNotMatch(script, /fetch\(|payment|checkout/i);

assert.equal(data.schema, "industrynext.editorial/v1");
assert.equal(data.slug, "credit-card-games");
assert.equal(data.canonical, "https://www.industrynext.xyz/editorial/credit-card-games/");
assert.equal(data.base_case_model.annual_contribution_volume_usd, 1_000_000_000);
assert.equal(data.base_case_model.total_platform_revenue_usd, 104_000_000);
assert.equal(data.base_case_model.illustrative_company_value_usd, 998_400_000);
assert.equal(provenance.images.length, 4);
assert.match(provenance.generator, /^Midjourney/);
assert.ok(provenance.images.every((item) => item.job_id && item.prompt && item.original_file));

assert.match(home, /href="\/editorial\/credit-card-games\/"/);
assert.match(headers, /\/credit-card-games\.json[\s\S]*Content-Type: application\/json/);
assert.match(sitemap, /industrynext\.xyz\/editorial\/credit-card-games\//);
assert.match(sitemap, /industrynext\.xyz\/credit-card-games\.json/);
assert.equal(pkg.scripts["verify:credit-card-games"], "node ./scripts/verify-credit-card-games.mjs");

console.log("Credit Card Games verification passed: editorial thesis, non-payment preview, interactive model, four-image Midjourney provenance, JSON edition, and public doorways.");
