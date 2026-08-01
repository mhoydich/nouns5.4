import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const files = {
  html: new URL("../public/issues/001/index.html", import.meta.url),
  css: new URL("../public/issues/001/issue.css", import.meta.url),
  json: new URL("../public/issue-001.json", import.meta.url),
};

await Promise.all(Object.values(files).map((file) => access(file)));

const [html, css, data, home, market, marketData, headers, sitemap, pkg] = await Promise.all([
  readFile(files.html, "utf8"),
  readFile(files.css, "utf8"),
  readFile(files.json, "utf8").then(JSON.parse),
  readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/market/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/market.json", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../public/_headers", import.meta.url), "utf8"),
  readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
]);

assert.match(html, /<h1>Work needs[\s\S]*better <em>doors/);
assert.match(html, /An invitation is an interface/);
assert.match(html, /WHO[\s\S]*FIRST MOVE[\s\S]*TERMS[\s\S]*YES/);
assert.match(html, /The market[\s\S]*is the door/);
assert.match(html, /id="field-task"/);
assert.match(html, /FIELD TASK 001 \/ THREE CLAIMS/);
assert.match(html, /\$0\. This is an unpaid editorial field exercise/);
assert.match(html, /Do not begin before confirmation/);
assert.match(html, /publishes only with your written approval and credit/);
assert.match(html, /answered within five business days/);
assert.match(html, /href="\/issue-001\.json"/);
assert.match(html, /href="\/market\/"/);
assert.match(html, /href="\/services\/"/);
assert.match(html, /data-placement="footer"/);
assert.match(html, /industry-next-icon\.svg/);

assert.match(css, /\.door-machine/);
assert.match(css, /\.field-task/);
assert.match(css, /@media \(max-width: 700px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /prefers-contrast: more/);

assert.equal(data.id, "industrynext.issue/001");
assert.equal(data.issue_number, 1);
assert.equal(data.door_parts.length, 4);
assert.equal(data.field_task.status, "open");
assert.equal(data.field_task.available_claims, 3);
assert.equal(data.field_task.timebox_minutes, 60);
assert.equal(data.field_task.compensation.cash_usd, 0);
assert.equal(data.field_task.compensation.commercial_production, false);
assert.equal(data.field_task.response_window_business_days, 5);
assert.equal(data.service_door.price_usd, 50000);
assert.equal(data.service_door.duration_weeks, 5);

assert.match(home, /href="\/issues\/001\/"/);
assert.match(home, /WORK NEEDS BETTER DOORS/);
assert.match(market, /href="\/issues\/001\/#field-task"/);
assert.ok(marketData.opportunities.some((item) => item.id === "door-audit-001" && item.status === "open"));
assert.match(headers, /\/issue-001\.json[\s\S]*Content-Type: application\/json/);
assert.match(sitemap, /industrynext\.xyz\/issues\/001\//);
assert.equal(pkg.scripts["verify:issue-001"], "node ./scripts/verify-issue-001.mjs");

console.log("Issue 001 verification passed: editorial argument, working proof, claimable field task, service doorway, JSON edition, and site doorways.");
