import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const files = {
  html: new URL("../public/issues/002/index.html", import.meta.url),
  css: new URL("../public/issues/002/issue.css", import.meta.url),
  json: new URL("../public/issue-002.json", import.meta.url),
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

assert.match(html, /<h1>Everyone[\s\S]*has some[\s\S]*<em>time/);
assert.match(html, /A collective should not ask for all of you/);
assert.match(html, /Belonging is not a timesheet/);
assert.match(html, /Not everyone has spare time/);
assert.match(html, /One useful hour counts\. So does choosing not to give it/);
assert.match(html, /TIME IS OFFERED[\s\S]*SMALL COUNTS[\s\S]*ENJOYMENT IS EVIDENCE[\s\S]*CREDIT STAYS VISIBLE[\s\S]*RETURN IS NORMAL/);
assert.match(html, /id="enjoyable-hour"/);
assert.match(html, /FIELD TASK 002 \/ EIGHT PLACES/);
assert.match(html, /Exactly 60 minutes after confirmation/);
assert.match(html, /\$0\. A voluntary editorial field experiment/);
assert.match(html, /Sharing it with Industry Next is optional/);
assert.match(html, /No account, wallet, meeting, résumé, or previous contribution required/);
assert.match(html, /answered within five business days/);
assert.match(html, /href="\/issue-002\.json"/);
assert.match(html, /href="\/issues\/001\/"/);
assert.match(html, /href="\/market\/"/);
assert.match(html, /data-placement="footer"/);
assert.match(html, /industry-next-icon\.svg/);

assert.match(css, /\.common-clock/);
assert.match(css, /\.enjoyable-hour/);
assert.match(css, /\.return-loop/);
assert.match(css, /@media \(max-width:700px\)/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.match(css, /prefers-contrast:more/);

assert.equal(data.id, "industrynext.issue/002");
assert.equal(data.issue_number, 2);
assert.equal(data.contribution_sizes.length, 4);
assert.equal(data.collective_protocol.length, 5);
assert.equal(data.enjoyable_hour.status, "open");
assert.equal(data.enjoyable_hour.available_places, 8);
assert.equal(data.enjoyable_hour.timebox_minutes, 60);
assert.equal(data.enjoyable_hour.compensation.cash_usd, 0);
assert.equal(data.enjoyable_hour.compensation.commercial_production, false);
assert.equal(data.enjoyable_hour.access.account_required, false);
assert.equal(data.enjoyable_hour.access.wallet_required, false);
assert.equal(data.enjoyable_hour.response_window_business_days, 5);
assert.deepEqual(data.return_loop, ["enter", "offer", "rest", "return"]);

assert.match(home, /href="\/issues\/002\/"/);
assert.match(home, /Everyone Has Some Time/);
assert.match(market, /href="\/issues\/002\/#enjoyable-hour"/);
assert.ok(marketData.opportunities.some((item) => item.id === "enjoyable-hour-001" && item.status === "open"));
assert.match(headers, /\/issue-002\.json[\s\S]*Content-Type: application\/json/);
assert.match(sitemap, /industrynext\.xyz\/issues\/002\//);
assert.equal(pkg.scripts["verify:issue-002"], "node ./scripts/verify-issue-002.mjs");

console.log("Issue 002 verification passed: collective thesis, humane protocol, time-sized doors, Enjoyable Hour terms, JSON edition, and site doorways.");
