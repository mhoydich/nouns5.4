import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const paths = [
  "public/early-career/ai-for-industry/index.html",
  "public/early-career/ai-for-industry/series.css",
  "public/early-career/ai-for-industry/series.js",
  "public/early-career/ai-for-industry/og.svg",
  "public/ai-for-industry.json",
];
await Promise.all(paths.map((path) => access(new URL(path, root))));

const [html, css, script, og, dataText, earlyCareerHtml, earlyCareerText, home, sitemap, headers, manifestText, packageText] = await Promise.all([
  read(paths[0]),
  read(paths[1]),
  read(paths[2]),
  read(paths[3]),
  read(paths[4]),
  read("public/early-career/index.html"),
  read("public/early-career.json"),
  read("public/index.html"),
  read("public/sitemap.xml"),
  read("public/_headers"),
  read("public/site.webmanifest"),
  read("package.json"),
]);

const data = JSON.parse(dataText);
const earlyCareer = JSON.parse(earlyCareerText);
const manifest = JSON.parse(manifestText);
const pkg = JSON.parse(packageText);

assert.match(html, /AI for Industry — 10 Receipts for Recent Graduates/);
assert.match(html, /Use AI like[\s\S]*you already have[\s\S]*a job to do/);
assert.match(html, /Ten parts\. Ten receipts\./);
assert.match(html, /Do not study “AI\.”/);
assert.match(html, /id="brief-form"/);
assert.match(html, /The text stays in this browser and is not stored or sent/);
assert.match(html, /Fable and Sol on the same brief/);
assert.match(html, /CLAUDE FABLE 5/);
assert.match(html, /GPT-5\.6 SOL/);
assert.match(html, /SEEDANCE/);
assert.match(html, /VEO/);
assert.match(html, /RUNWAY/);
assert.match(html, /Stripe’s hosted Checkout/);
assert.match(html, /Make the phone ring—with consent/);
assert.match(html, /GITHUB \+ CLOUDFLARE/);
assert.match(html, /No live charge is required for this series/i);
assert.match(html, /No live payment, message, upload, or production access is required/);
assert.match(html, /href="\/ai-for-industry\.json"/);
assert.match(html, /data-pointcast-network[^>]+data-placement="footer"/);
assert.equal((html.match(/<article class="chapter /g) || []).length, 10);
assert.equal((html.match(/data-mark-part="(?:0[1-9]|10)"/g) || []).length, 10);
for (let number = 1; number <= 10; number += 1) {
  const part = String(number).padStart(2, "0");
  assert.match(html, new RegExp(`id="part-${part}"`));
  assert.match(html, new RegExp(`RECEIPT \/ ${part}`));
}

for (const source of [
  "anthropic.com/claude/fable",
  "learn.chatgpt.com/docs/models",
  "learn.chatgpt.com/docs/extend/mcp",
  "seed.bytedance.com/en/seedance",
  "deepmind.google/technologies/veo",
  "runwayml.com/research/introducing-runway-gen-4",
  "docs.stripe.com/payments/checkout/quickstarts",
  "twilio.com/docs/usage/webhooks/webhooks-overview",
  "docs.github.com/en/get-started",
  "developers.cloudflare.com/pages",
]) assert.match(html, new RegExp(source.replaceAll(".", "\\.")));

assert.match(css, /\.part-grid/);
assert.match(css, /\.model-duel/);
assert.match(css, /\.engine-grid/);
assert.match(css, /\.ship-loop/);
assert.match(css, /@media \(max-width: 480px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /@media print/);

assert.match(script, /industrynext\.ai-for-industry\.progress\.v1/);
assert.match(script, /window\.localStorage\.setItem/);
assert.match(script, /new FormData\(briefForm\)/);
assert.match(script, /querySelectorAll\("textarea\[name\], input\[name\]"\)/);
assert.match(script, /navigator\.clipboard/);
assert.match(script, /textContent/);
assert.doesNotMatch(script, /innerHTML|fetch\s*\(|document\.cookie|sessionStorage/);

assert.match(og, /width="1200" height="630"/);
assert.match(og, /AI FOR/);
assert.match(og, /TEN RECEIPTS/);

assert.equal(data.schema, "industrynext.ai-for-industry/v1");
assert.equal(data.canonical, "https://www.industrynext.xyz/early-career/ai-for-industry/");
assert.equal(data.parts.length, 10);
assert.deepEqual(data.parts.map((part) => part.number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
assert.ok(data.parts.every((part) => part.receipt && part.tools.length));
assert.equal(data.tool_boundaries.worksheet_inputs_uploaded, false);
assert.equal(data.tool_boundaries.progress_uploaded, false);
assert.equal(data.tool_boundaries.live_payment_required, false);
assert.equal(data.tool_boundaries.live_message_required, false);
assert.equal(data.tool_boundaries.production_credentials_required, false);
assert.ok(data.official_sources.every((source) => source.startsWith("https://")));

assert.match(earlyCareerHtml, /Eight useful doors/);
assert.match(earlyCareerHtml, /AI FOR INDUSTRY \/ 10 PARTS/);
assert.match(earlyCareerHtml, /href="\/early-career\/ai-for-industry\/"/);
assert.equal((earlyCareerHtml.match(/class="resource-card/g) || []).length, 8);
assert.equal(earlyCareer.resources.length, 8);
assert.ok(earlyCareer.resources.some((resource) => resource.id === "ai-for-industry-010"));
assert.match(home, /10-PART FIELD SERIES/);
assert.match(home, /href="\/early-career\/ai-for-industry\/"/);
assert.match(sitemap, /industrynext\.xyz\/early-career\/ai-for-industry\//);
assert.match(sitemap, /industrynext\.xyz\/ai-for-industry\.json/);
assert.match(headers, /\/ai-for-industry\.json[\s\S]*Content-Type: application\/json/);
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/early-career/ai-for-industry/"));
assert.equal(pkg.scripts["verify:ai-for-industry"], "node ./scripts/verify-ai-for-industry.mjs");

console.log("AI for Industry verification passed: 10-part recent-graduate series, local brief compiler and progress, Fable/Sol coding track, video engines, APIs, connectors, Stripe, Twilio, GitHub, Cloudflare, public doorway, and machine-readable twin.");
