import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import {
  TEZOS_AUTH_SESSION_SCHEMA,
  buildTezosAuthChallenge,
  isFreshTezosAuthSession,
  packTezosMessage,
  publicTezosAuthProof,
} from "../src/market-auth-core.js";

const files = {
  html: new URL("../public/market/index.html", import.meta.url),
  css: new URL("../public/market/market.css", import.meta.url),
  script: new URL("../public/market.js", import.meta.url),
  json: new URL("../public/market.json", import.meta.url),
  og: new URL("../public/market/og.svg", import.meta.url),
};

await Promise.all(Object.values(files).map((file) => access(file)));

const [html, css, script, data, og, home, desk, product, services, role, tagPage, headers, sitemap, manifest, pkg] = await Promise.all([
  readFile(files.html, "utf8"),
  readFile(files.css, "utf8"),
  readFile(files.script, "utf8"),
  readFile(files.json, "utf8").then(JSON.parse),
  readFile(files.og, "utf8"),
  readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/desk/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/product/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/services/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/roles/playlist-editor/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/next/tag/index.html", import.meta.url), "utf8"),
  readFile(new URL("../public/_headers", import.meta.url), "utf8"),
  readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8"),
  readFile(new URL("../public/site.webmanifest", import.meta.url), "utf8").then(JSON.parse),
  readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
]);

assert.match(html, /<h1 id="market-title">Turn work/);
assert.match(html, /JOB[\s\S]*TASK[\s\S]*ORG[\s\S]*TOKEN/);
assert.match(html, /Halation[\s\S]*Lead/);
assert.match(html, /Playlist[\s\S]*Editor/);
assert.match(html, /AI[\s\S]*Credits/);
assert.match(html, /TERMS BEFORE TRANSACTIONS/);
assert.match(html, /No candidate owes unpaid commercial production/);
assert.match(html, /Sign in with Tezos/);
assert.match(html, /NO NETWORK FEE/);
assert.match(html, /A valid signature proves control of one address/);
assert.match(html, /Local only\. Tezos identity is optional\./);
assert.match(html, /id="listing-auth-mark"/);
assert.match(html, /rel="alternate" type="application\/json" href="\/market\.json"/);
assert.match(html, /industry-next-icon\.svg/);
assert.match(html, /data-placement="footer"/);
assert.match(html, /<strong>6<\/strong><span>FIRST TASKS<\/span>/);
assert.match(html, /Six ways in\./);
assert.match(html, /Opportunities <span>6<\/span>/);
assert.match(html, /Full registry <span>14<\/span>/);
assert.match(html, /Showing 4 open roles and 2 bounded field tasks\./);
assert.equal((html.match(/class="market-card/g) || []).length, 14);
assert.equal((html.match(/class="opportunity-card/g) || []).length, 4);
assert.equal((html.match(/data-opportunity/g) || []).length, 6);
assert.equal((html.match(/data-view=/g) || []).length, 2);
assert.equal((html.match(/data-filter=/g) || []).length, 5);
assert.equal((html.match(/data-kind="job"/g) || []).length, 4);
assert.equal((html.match(/data-kind="task"/g) || []).length, 6);
assert.equal((html.match(/data-kind="organization"/g) || []).length, 1);
assert.equal((html.match(/data-kind="token"/g) || []).length, 3);
assert.match(html, /id="opportunity-board"/);
assert.match(html, /id="market-registry"[\s\S]*hidden/);
assert.match(html, /data-market-id="halation-first-30-days"/);
assert.match(html, /data-market-id="small-social-systems-first-ritual"/);
assert.match(html, /data-market-id="door-audit-001"/);
assert.match(html, /href="\/issues\/001\/#field-task"/);
assert.match(html, /data-market-id="enjoyable-hour-001"/);
assert.match(html, /href="\/issues\/002\/#enjoyable-hour"/);
assert.match(html, /data-market-target="ai-credits"/);
assert.match(html, /<details id="tezos-auth"/);
assert.match(html, /<details id="post-work"/);
assert.match(html, /id="market-reset"/);

assert.match(css, /\.market-grid/);
assert.match(css, /\.opportunity-board/);
assert.match(css, /\.field-task-card/);
assert.match(css, /\.market-console/);
assert.match(css, /\.market-card\.is-highlighted/);
assert.match(css, /\.listing-form/);
assert.match(css, /\.auth-desk/);
assert.match(css, /\.auth-card/);
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /prefers-contrast: more/);

assert.match(script, /navigator\.clipboard/);
assert.match(script, /local-draft/);
assert.match(script, /automatic_settlement: false/);
assert.match(script, /scrollIntoView/);
assert.match(script, /data-market-id/);
assert.match(script, /Opened.*full registry/);
assert.match(script, /activeView/);
assert.match(script, /Showing 4 open roles and 2 bounded field tasks\./);
assert.match(script, /requestSignPayload/);
assert.match(script, /sessionStorage/);
assert.match(script, /verifyTezosSignature/);
assert.match(script, /tezos_auth/);
assert.doesNotMatch(script, /innerHTML/);

assert.match(og, /width="1200" height="630"/);
assert.match(og, /TURN WORK/);

assert.equal(data.id, "industrynext.work-market/v1");
assert.equal(data.authentication.network, "mainnet");
assert.equal(data.authentication.method, "wallet-signed Micheline challenge");
assert.equal(data.authentication.session_duration_minutes, 20);
assert.equal(data.authentication.required_to_browse, false);
assert.equal(data.authentication.transaction, false);
assert.equal(data.authentication.network_fee, false);
assert.equal(data.authentication.token_transfer, false);
assert.equal(data.authentication.on_chain_write, false);
assert.equal(data.authentication.grants_publish_permission, false);
assert.equal(data.authentication.grants_organization_authority, false);
assert.equal(data.market_rules.escrow_contract, false);
assert.equal(data.market_rules.automatic_settlement, false);
assert.equal(data.market_rules.written_terms_required_before_work, true);
assert.equal(data.counts.open_jobs, 4);
assert.equal(data.counts.first_tasks, 6);
assert.equal(data.counts.funded_credit_rails, 1);
assert.equal(data.counts.active_xtz_listings, 0);
assert.equal(data.organizations.length, 1);
assert.equal(data.reward_rails.length, 3);
assert.equal(data.opportunities.length, 10);

const halation = data.opportunities.find((item) => item.id === "halation-lead");
const playlist = data.opportunities.find((item) => item.id === "playlist-editor-listener-growth");
const tagOpportunity = data.opportunities.find((item) => item.id === "tag-open-build-lead");
const builderOpportunity = data.opportunities.find((item) => item.id === "small-social-systems-builder");
const builderTask = data.opportunities.find((item) => item.id === "small-social-systems-first-ritual");
const doorAudit = data.opportunities.find((item) => item.id === "door-audit-001");
const enjoyableHour = data.opportunities.find((item) => item.id === "enjoyable-hour-001");
const aiCredits = data.reward_rails.find((item) => item.id === "ai-credits");
const xtz = data.reward_rails.find((item) => item.id === "xtz");
assert.equal(halation.reward.status, "funded");
assert.equal(halation.reward.rail_id, "ai-credits");
assert.equal(halation.reward.amount, null);
assert.equal(playlist.reward.status, "disclosed");
assert.equal(playlist.reward.guaranteed_cash_usd, 0);
assert.equal(playlist.reward.potential_upside, "project-specific revenue share");
assert.equal(playlist.reward.revenue_guaranteed, false);
assert.equal(tagOpportunity.duration_weeks, 4);
assert.equal(tagOpportunity.reward.rail_id, "ai-credits");
assert.equal(tagOpportunity.reward.status, "provided");
assert.equal(builderOpportunity.duration_weeks, 4);
assert.equal(builderOpportunity.first_task_id, builderTask.id);
assert.equal(builderOpportunity.reward.rail_id, "ai-credits");
assert.equal(builderOpportunity.reward.status, "provided");
assert.equal(doorAudit.status, "open");
assert.equal(doorAudit.available_claims, 3);
assert.equal(doorAudit.timebox_minutes, 60);
assert.equal(enjoyableHour.status, "open");
assert.equal(enjoyableHour.available_places, 8);
assert.equal(enjoyableHour.timebox_minutes, 60);
assert.equal(aiCredits.transferable, false);
assert.equal(aiCredits.cryptocurrency, false);
assert.deepEqual(xtz.active_listings, []);
assert.ok(data.opportunities.filter((item) => item.kind === "job").every((job) => data.opportunities.some((task) => task.id === job.first_task_id)));
assert.ok(data.opportunities.every((item) => item.organization_id === "industry-next"));

for (const doorway of [home, desk, product, services, role, tagPage]) assert.match(doorway, /href="\/market\/"/);
assert.match(home, /Bounded tasks, starter proofs, operating scopes/);
assert.match(home, /Work Market/);
assert.match(headers, /\/market\.json[\s\S]*Content-Type: application\/json/);
assert.match(sitemap, /industrynext\.xyz\/market\//);
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/market/"));
assert.equal(pkg.scripts["verify:market"], "node ./scripts/verify-market.mjs");

const fixedNow = Date.UTC(2026, 6, 31, 23, 55, 0);
const authAddress = "tz2MVED1t9Jery77Bwm1m5YhUx8Wp5KWWRQe";
const challenge = buildTezosAuthChallenge({
  origin: "https://www.industrynext.xyz",
  address: authAddress,
  nonce: "market-auth-test-20260731",
  now: fixedNow,
});
assert.equal(challenge.domain, "www.industrynext.xyz");
assert.equal(challenge.address, authAddress);
assert.equal(challenge.payload, packTezosMessage(challenge.message));
assert.match(challenge.payload, /^0501[0-9a-f]{8}/);
assert.match(challenge.message, /proves wallet control only/);

const session = {
  schema: TEZOS_AUTH_SESSION_SCHEMA,
  network: "mainnet",
  address: authAddress,
  public_key: "sppk-test-public-key",
  signature: "spsig-test-signature",
  signing_type: "micheline",
  payload: challenge.payload,
  challenge,
  verified: true,
};
assert.equal(isFreshTezosAuthSession(session, { origin: "https://www.industrynext.xyz", now: fixedNow + 1000 }), true);
assert.equal(isFreshTezosAuthSession(session, { origin: "https://industrynext.xyz", now: fixedNow + 1000 }), false);
assert.equal(isFreshTezosAuthSession(session, { origin: "https://www.industrynext.xyz", now: Date.parse(challenge.expiration_time) }), false);
assert.equal(isFreshTezosAuthSession({
  ...session,
  challenge: {
    ...challenge,
    issued_at: new Date(fixedNow + 60_000).toISOString(),
    expiration_time: new Date(fixedNow + 60_000 + 20 * 60 * 1000).toISOString(),
  },
}, { origin: "https://www.industrynext.xyz", now: fixedNow + 1000 }), false);
assert.deepEqual(publicTezosAuthProof(session).scope, ["market:identity", "market:draft-attribution"]);

console.log("Work Market verification passed: linked work, wallet-signed Tezos auth, local verification, explicit authority boundaries, listing drafts, JSON contract, and site doorways.");
