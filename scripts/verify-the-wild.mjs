import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile("public/the-wild/index.html", "utf8");
const css = await readFile("public/the-wild/the-wild.css", "utf8");
const record = JSON.parse(await readFile("public/the-wild.json", "utf8"));
const home = await readFile("public/index.html", "utf8");
const mirror = await readFile("public/github-pages-index.html", "utf8");
const sitemap = await readFile("public/sitemap.xml", "utf8");
const headers = await readFile("public/_headers", "utf8");

const canonical = "https://the-wild-x402.mhoydich.workers.dev/";
assert.match(page, new RegExp(canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(page, /\$0\.01 USDC on Base per action/);
assert.match(page, /fail-closed/i);
assert.match(page, /Status at publication:/i);
assert.match(page, /Read the live manifest/i);
assert.match(page, /\.well-known\/the-wild\.json/);
assert.match(page, /\/api\/spirits/);
assert.match(page, /#participate/);
assert.doesNotMatch(page, /fetch\(|XMLHttpRequest|WebSocket/, "bridge must not proxy or copy live Wild state");
assert.match(css, /@media\(max-width:600px\)/);
assert.match(css, /\.skip:focus/);
assert.equal(record.canonicalApp, canonical);
assert.match(record.agentPath.paymentStatusAtPublication, /not active on 2026-09-04/);
assert.equal(record.liveStatusSource, `${canonical}.well-known/the-wild.json`);
assert.equal(record.agentPath.futurePayment, "exactly $0.01 USDC on Base per action; explicit buyer signature only");
assert.match(home, /LIVE TEST 03 \/ AGENT RITUAL/);
assert.match(home, /href="\/the-wild\/"/);
assert.match(mirror, /href="\.\/the-wild\/"/);
assert.match(mirror, /LIVE TEST 03 \/ AGENT RITUAL/);
assert.match(sitemap, /https:\/\/www\.industrynext\.xyz\/the-wild\//);
assert.match(sitemap, /https:\/\/www\.industrynext\.xyz\/the-wild\.json/);
assert.match(headers, /\/the-wild\/\*/);
assert.match(headers, /\/the-wild\.json\n  Content-Type: application\/json; charset=utf-8/);

console.log("The Wild Industry Next bridge verified.");
