import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { onRequestGet, onRequestPost } from "../functions/api/market-applications.js";
import { buildMarketApplication, validateMarketApplication } from "../functions/_lib/market-application-store.js";

const root = new URL("../", import.meta.url);
const paths = {
  market: new URL("public/market/index.html", root),
  marketCss: new URL("public/market/market.css", root),
  apply: new URL("public/market/apply/index.html", root),
  applyCss: new URL("public/market/apply/apply.css", root),
  applyJs: new URL("public/market-apply.js", root),
  applyOg: new URL("public/market/apply/og.svg", root),
  tumblr: new URL("public/market/tumblr/index.html", root),
  tumblrCss: new URL("public/market/tumblr/tumblr.css", root),
  tumblrJs: new URL("public/tumblr-talent.js", root),
  tumblrOg: new URL("public/market/tumblr/og.svg", root),
  json: new URL("public/market.json", root),
  headers: new URL("public/_headers", root),
  sitemap: new URL("public/sitemap.xml", root),
  manifest: new URL("public/site.webmanifest", root),
  launch: new URL("MARKET-LAUNCH-001.md", root),
  intake: new URL("scripts/market-intake.mjs", root),
  pkg: new URL("package.json", root),
};
await Promise.all(Object.values(paths).map((path) => access(path)));

const [market, marketCss, apply, applyCss, applyJs, applyOg, tumblr, tumblrCss, tumblrJs, tumblrOg, data, headers, sitemap, manifest, launch, intake, pkg] = await Promise.all([
  readFile(paths.market, "utf8"), readFile(paths.marketCss, "utf8"), readFile(paths.apply, "utf8"),
  readFile(paths.applyCss, "utf8"), readFile(paths.applyJs, "utf8"), readFile(paths.applyOg, "utf8"),
  readFile(paths.tumblr, "utf8"), readFile(paths.tumblrCss, "utf8"), readFile(paths.tumblrJs, "utf8"),
  readFile(paths.tumblrOg, "utf8"), readFile(paths.json, "utf8").then(JSON.parse), readFile(paths.headers, "utf8"),
  readFile(paths.sitemap, "utf8"), readFile(paths.manifest, "utf8").then(JSON.parse), readFile(paths.launch, "utf8"),
  readFile(paths.intake, "utf8"), readFile(paths.pkg, "utf8").then(JSON.parse),
]);

assert.equal((market.match(/\/market\/apply\/\?role=/g) || []).length, 8);
assert.match(market, /Enter the Tumblr Talent Relay/);
assert.match(marketCss, /\.tumblr-relay-door/);

assert.match(apply, /Raise your hand\.[\s\S]*Not your résumé/);
assert.match(apply, /id="market-application"/);
assert.match(apply, /reviewed beginning August 8, 2026/i);
assert.match(apply, /response within 48 hours/i);
assert.match(apply, /90-day data retention/i);
assert.match(apply, /AI credits are operating support, not cash compensation/i);
assert.match(apply, /href="\/market\/tumblr\/"/);
assert.match(applyCss, /@media\(max-width:700px\)/);
assert.match(applyCss, /prefers-reduced-motion:reduce/);
assert.match(applyJs, /fetch\("\/api\/market-applications"/);
assert.match(applyJs, /type: "role-application"/);
assert.doesNotMatch(applyJs, /innerHTML/);
assert.match(applyOg, /width="1200" height="630"/);

assert.match(tumblr, /The internet[\s\S]*is full of talent[\s\S]*Bad at introductions/);
assert.match(tumblr, /Make an original Tumblr post/);
assert.match(tumblr, /Reblogging carries the relay/);
for (const prompt of ["I MAKE", "I CAN TEACH", "I NEED", "IN SEVEN DAYS, I COULD"]) assert.match(tumblr, new RegExp(prompt));
assert.match(tumblr, /profiles public work only with explicit permission/i);
assert.match(tumblr, /I will see and approve any profile before publication/);
assert.match(tumblrCss, /@media\(max-width:700px\)/);
assert.match(tumblrCss, /prefers-reduced-motion:reduce/);
assert.match(tumblrJs, /https:\/\/www\.tumblr\.com\/widgets\/share\/tool/);
for (const tag of ["internet people 001", "industry next", "digital skills", "tumblr talent relay"]) assert.match(tumblrJs, new RegExp(tag));
assert.match(tumblrJs, /type: "tumblr-talent"/);
assert.match(tumblrJs, /fetch\("\/api\/market-applications"/);
assert.doesNotMatch(tumblrJs, /innerHTML/);
assert.match(tumblrOg, /width="1200" height="630"/);

assert.equal(data.launch.id, "market-launch-001");
assert.equal(data.launch.response_promise_hours, 48);
assert.equal(data.launch.private_retention_days, 90);
assert.equal(data.launch.public_profile_permission, "separate review and approval required");
assert.ok(data.opportunities.filter(({ kind }) => kind === "job").every(({ id, application_url: url }) => url === `https://www.industrynext.xyz/market/apply/?role=${id}`));
assert.match(headers, /\/market\/apply\/\*[\s\S]*Cache-Control: no-store/);
assert.match(headers, /\/api\/market-applications[\s\S]*Cache-Control: no-store/);
assert.match(sitemap, /industrynext\.xyz\/market\/apply\//);
assert.match(sitemap, /industrynext\.xyz\/market\/tumblr\//);
assert.ok(manifest.shortcuts.some(({ url }) => url === "/market/tumblr/"));
assert.match(launch, /10 credible talent signals/);
assert.match(launch, /Do not mass-message/);
assert.match(launch, /No public inbox/);
assert.match(intake, /market-application-id:/);
assert.match(intake, /"--ttl"/);
assert.equal(pkg.scripts["verify:market-launch-001"], "node ./scripts/verify-market-launch-001.mjs");
assert.equal(pkg.scripts["market:intake"], "node ./scripts/market-intake.mjs");

const roleInput = {
  type: "role-application", roleId: "small-social-systems-builder", name: "Signal Maker", email: "signal@example.com",
  timezone: "UTC-7", portfolioUrl: "https://example.com/work", whyThis: "I build tiny social tools with real groups.",
  firstMove: "One group completes and restarts a ritual.", realGroup: "A five-person neighborhood archive group.",
  availability: "Ten hours each week.", supportRequest: "Model and deployment credits.", tumblrUrl: "https://example.tumblr.com/",
  termsAcknowledged: true, privacyConsent: true, companyWebsite: "",
};
const tumblrInput = {
  type: "tumblr-talent", name: "Archive Mage", email: "mage@example.com", timezone: "UTC+1", portfolioUrl: "",
  tumblrHandle: "@archivemage", tumblrPostUrl: "https://archivemage.tumblr.com/post/123/signal", digitalSkill: "Archive magician",
  canMake: "Living indexes from neglected digital folders.", canTeach: "How to give an archive a front door.",
  sevenDayMove: "Publish one searchable living index.", collaborationNeed: "A local archive and one witness.",
  profileConsent: true, termsAcknowledged: true, privacyConsent: true, companyWebsite: "",
};

assert.equal(validateMarketApplication(roleInput).email, "signal@example.com");
assert.equal(validateMarketApplication(tumblrInput).profilePermission, "review-before-publication");
const fixed = buildMarketApplication(roleInput, new Date("2026-08-01T19:00:00.000Z"), "00000000-0000-4000-8000-000000000001");
assert.equal(fixed.record.retentionUntil, "2026-10-30T19:00:00.000Z");
assert.match(fixed.storageKey, /^market-application:/);
assert.throws(() => validateMarketApplication({ ...tumblrInput, profileConsent: false }), /public talent profile/);

class MockKV {
  constructor() { this.values = new Map(); this.writes = []; }
  async get(key) { return this.values.get(key)?.value || null; }
  async put(key, value, options = {}) { this.values.set(key, { value, options }); this.writes.push({ key, value, options }); }
}

function context(input, kv, ip = "192.0.2.10") {
  return {
    env: { INDUSTRY_NEXT_MADE: kv },
    request: new Request("https://www.industrynext.xyz/api/market-applications", {
      method: "POST", headers: { "Content-Type": "application/json", Origin: "https://www.industrynext.xyz", "CF-Connecting-IP": ip },
      body: JSON.stringify(input),
    }),
  };
}

const roleKv = new MockKV();
const roleResponse = await onRequestPost(context(roleInput, roleKv));
assert.equal(roleResponse.status, 201);
const roleReceipt = await roleResponse.json();
assert.equal(roleReceipt.application.type, "role-application");
assert.equal(roleReceipt.application.roleId, "small-social-systems-builder");
assert.ok(roleKv.writes.some(({ key, options }) => key.startsWith("market-application:") && options.expirationTtl === 7_776_000));
assert.ok(roleKv.writes.some(({ key }) => key.startsWith("market-application-id:")));
assert.ok(!JSON.stringify(roleReceipt).includes("signal@example.com"));

const tumblrKv = new MockKV();
const tumblrResponse = await onRequestPost(context(tumblrInput, tumblrKv, "192.0.2.11"));
assert.equal(tumblrResponse.status, 201);
assert.equal((await tumblrResponse.json()).application.type, "tumblr-talent");

const trapKv = new MockKV();
const trapResponse = await onRequestPost(context({ ...roleInput, companyWebsite: "spam.invalid" }, trapKv, "192.0.2.12"));
assert.equal(trapResponse.status, 202);
assert.equal(trapKv.writes.length, 0);

const rateKv = new MockKV();
for (let index = 0; index < 5; index += 1) assert.equal((await onRequestPost(context(roleInput, rateKv, "192.0.2.13"))).status, 201);
assert.equal((await onRequestPost(context(roleInput, rateKv, "192.0.2.13"))).status, 429);

const readResponse = await onRequestGet();
assert.equal(readResponse.status, 405);
assert.equal(readResponse.headers.get("Allow"), "POST");
assert.match((await readResponse.json()).error, /private/);

console.log("Market Launch 001 verified: central applications, Tumblr signal generator, private 90-day intake, consented profiles, rate limits, operating desk, launch kit, and machine-readable doors.");
