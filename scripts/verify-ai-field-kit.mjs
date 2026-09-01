import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const paths = {
  html: "public/early-career/ai-field-kit/index.html",
  css: "public/early-career/ai-field-kit/field-kit.css",
  script: "public/early-career/ai-field-kit/field-kit.js",
  og: "public/early-career/ai-field-kit/og.svg",
  json: "public/ai-field-kit.json",
};

await Promise.all(Object.values(paths).map((path) => access(new URL(path, root))));

const [html, css, script, og, dataText, earlyCareerHtml, earlyCareerText, seriesHtml, home, sitemap, headers, manifestText, packageText] = await Promise.all([
  read(paths.html),
  read(paths.css),
  read(paths.script),
  read(paths.og),
  read(paths.json),
  read("public/early-career/index.html"),
  read("public/early-career.json"),
  read("public/early-career/ai-for-industry/index.html"),
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

assert.match(html, /AI SERVICE DESK \/ FIELD KIT 003 \/ STUDENTS \+ RECENT GRADUATES/);
assert.match(html, /Do not collect tools[\s\S]*Choose a receipt/);
assert.match(html, /36[\s\S]*Official service doors/);
assert.match(html, /8[\s\S]*Mission stacks/);
assert.match(html, /0[\s\S]*Affiliate links/);
assert.match(html, /What should exist by Friday/);
assert.match(html, /id="stack-builder"/);
assert.match(html, /id="service-search"/);
assert.match(html, /id="access-filter"/);
assert.match(html, /id="five-day-proof"/);
assert.match(html, /One useful loop[\s\S]*Five days/);
assert.match(html, /OFFICIAL LINKS ONLY/);
assert.match(html, /No account is connected/);
assert.match(html, /Industry Next does not receive affiliate compensation/);
assert.match(html, /href="\/ai-field-kit\.json"/);
assert.match(html, /data-pointcast-network[^>]+data-placement="footer"/);

const cardCount = (html.match(/<article class="service-card /g) || []).length;
assert.equal(cardCount, 36);
const categoryCounts = Object.fromEntries(["think", "code", "make", "connect", "ship"].map((category) => [
  category,
  (html.match(new RegExp(`data-category="${category}"`, "g")) || []).length,
]));
assert.deepEqual(categoryCounts, { think: 6, code: 6, make: 8, connect: 8, ship: 8 });
assert.equal((html.match(/data-mission="(?:site|code|research|video|automation|payment|message|api)"/g) || []).length, 8);

for (const name of [
  "Codex", "Claude Code", "Cursor", "Replit Agent", "Seedance", "Google Flow + Veo", "Runway", "DaVinci Resolve",
  "OpenAI API", "Anthropic API", "Model Context Protocol", "Postman", "Pipedream", "Stripe Checkout", "Twilio",
  "GitHub Student Developer Pack", "Cloudflare Pages", "PostHog",
]) assert.match(html, new RegExp(name.replaceAll("+", "\\+")));

assert.match(css, /\.service-grid/);
assert.match(css, /\.stack-ticket/);
assert.match(css, /\.mission-button/);
assert.match(css, /@media \(max-width: 420px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /@media print/);

assert.match(script, /const stacks =/);
assert.match(script, /renderStack/);
assert.match(script, /applyFilters/);
assert.match(script, /navigator\.clipboard\.writeText/);
assert.match(script, /replaceChildren/);
assert.match(script, /textContent/);
assert.doesNotMatch(script, /innerHTML|fetch\s*\(|localStorage|sessionStorage|document\.cookie/);

assert.match(og, /width="1200" height="630"/);
assert.match(og, /AI SERVICE/);
assert.match(og, /PICK A RECEIPT/);

assert.equal(data.schema, "industrynext.ai-service-desk/v1");
assert.equal(data.canonical, "https://www.industrynext.xyz/early-career/ai-field-kit/");
assert.equal(data.published, "2026-08-03");
assert.equal(data.affiliate_compensation, false);
assert.equal(data.services.length, 36);
assert.equal(data.mission_stacks.length, 8);
assert.equal(data.campus_assignment.duration_days, 5);
assert.equal(data.campus_assignment.days.length, 5);
assert.equal(new Set(data.services.map((service) => service.id)).size, 36);
assert.equal(new Set(data.services.map((service) => service.official_url)).size, 36);
assert.ok(data.services.every((service) => service.official_url.startsWith("https://")));
assert.ok(data.services.every((service) => service.first_receipt && service.watch));
assert.ok(data.mission_stacks.every((stack) => stack.tools.length === 4 && stack.receipt));
for (const service of data.services) assert.ok(html.includes(`href="${service.official_url}"`), `${service.name} official URL must be crawlable in HTML`);

assert.match(earlyCareerHtml, /AI SERVICE DESK \/ 36 OFFICIAL DOORS/);
assert.match(earlyCareerHtml, /href="\/early-career\/ai-field-kit\/"/);
assert.equal((earlyCareerHtml.match(/class="resource-card/g) || []).length, 9);
assert.equal(earlyCareer.resources.length, 9);
assert.ok(earlyCareer.resources.some((resource) => resource.id === "ai-service-desk-036"));
assert.match(seriesHtml, /href="\/early-career\/ai-field-kit\/"/);
assert.match(home, /href="\/early-career\/ai-field-kit\/"/);
assert.match(sitemap, /industrynext\.xyz\/early-career\/ai-field-kit\//);
assert.match(sitemap, /industrynext\.xyz\/ai-field-kit\.json/);
assert.match(headers, /\/ai-field-kit\.json[\s\S]*Content-Type: application\/json/);
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/early-career/ai-field-kit/"));
assert.equal(pkg.scripts["verify:ai-field-kit"], "node ./scripts/verify-ai-field-kit.mjs");

console.log("AI Service Desk verification passed: 36 official service doors, eight local mission stacks, filters, a five-day campus proof, student wallet rules, machine-readable twin, and public doorways from Starting Line, AI for Industry, and home.");
