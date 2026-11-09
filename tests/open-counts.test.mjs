import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { addView, allowedOrigin, cleanPath, markPresent, readPresent, readViews, WINDOW_MS } from "../functions/_lib/open-counts.js";
import * as views from "../functions/api/views.js";
import * as present from "../functions/api/present.js";
import { wantsCounts } from "../functions/_middleware.js";

function fakeKv() {
  const map = new Map();
  return {
    map,
    async get(key, type) { const v = map.get(key); return v === undefined ? null : type === "json" ? JSON.parse(v) : v; },
    async put(key, value) { map.set(key, value); },
  };
}

const NOW = Date.parse("2026-11-09T20:00:00Z");
const UA = "Mozilla/5.0 (Macintosh) Safari/605";
const ID = "a".repeat(32);

test("page views add up per page and per day", async () => {
  const kv = fakeKv();
  await addView(kv, "/services/", NOW);
  await addView(kv, "/services/", NOW);
  await addView(kv, "/", NOW);
  const one = await readViews(kv, { days: 7, path: "/services/" }, NOW);
  assert.equal(one.views, 2);
  const all = await readViews(kv, { days: 7 }, NOW);
  assert.equal(all.total, 3);
  assert.equal(all.days.length, 7);
});

test("here now counts tabs for 5 minutes and stores no raw id", async () => {
  const kv = fakeKv();
  assert.equal(await markPresent(kv, { id: ID, path: "/", kind: "person" }, NOW), true);
  assert.equal(await markPresent(kv, { id: ID, path: "/", kind: "person" }, NOW + 1000), true);
  await markPresent(kv, { id: "b".repeat(32), path: "/x/", kind: "agent" }, NOW);
  assert.deepEqual((await readPresent(kv, NOW + 2000)).total, 2);
  assert.equal((await readPresent(kv, NOW + WINDOW_MS + 5000)).total, 0);
  for (const value of kv.map.values()) assert.ok(!value.includes(ID));
  assert.equal(await markPresent(kv, { id: "nope", path: "/", kind: "person" }, NOW), false);
});

test("paths and origins are checked", () => {
  assert.equal(cleanPath("/a/index.html"), "/a/");
  assert.equal(cleanPath("https://x.com/"), undefined);
  assert.equal(cleanPath("/../etc"), undefined);
  assert.equal(allowedOrigin("https://www.industrynext.xyz"), true);
  assert.equal(allowedOrigin("https://abc.industrynext-nouns.pages.dev"), true);
  assert.equal(allowedOrigin("https://evil.example"), false);
  assert.equal(allowedOrigin("http://industrynext.xyz"), false);
});

function post(url, body, headers = {}) {
  return new Request(url, { method: "POST", headers: { "user-agent": UA, "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
}

test("endpoints count real tabs and refuse bots and other sites", async () => {
  const env = { INDUSTRY_NEXT_MADE: fakeKv() };
  const origin = { origin: "https://www.industrynext.xyz" };
  await views.onRequestPost({ request: post("https://www.industrynext.xyz/api/views", { p: "/" }, origin), env });
  await views.onRequestPost({ request: post("https://www.industrynext.xyz/api/views", { p: "/" }, { origin: "https://evil.example" }), env });
  await views.onRequestPost({ request: post("https://www.industrynext.xyz/api/views", { p: "/" }, { ...origin, "user-agent": "Googlebot" }), env });
  const got = await (await views.onRequestGet({ request: new Request("https://www.industrynext.xyz/api/views?path=/"), env })).json();
  assert.equal(got.views, 1);

  await present.onRequestPost({ request: post("https://www.industrynext.xyz/api/present", { p: "/", id: ID }, origin), env });
  await present.onRequestPost({ request: post("https://www.industrynext.xyz/api/present", { id: "c".repeat(32) }), env });
  await present.onRequestPost({ request: post("https://www.industrynext.xyz/api/present", { id: "d".repeat(32), kind: "agent" }), env });
  const here = await (await present.onRequestGet({ env })).json();
  assert.equal(here.humans, 1);
  assert.equal(here.agents, 1);
});

test("without the store bound, reads say unavailable instead of zero", async () => {
  const here = await (await present.onRequestGet({ env: {} })).json();
  assert.equal(here.status, "unavailable");
  const v = await (await views.onRequestGet({ request: new Request("https://www.industrynext.xyz/api/views"), env: {} })).json();
  assert.equal(v.status, "unavailable");
});

test("counts line goes on HTML pages but not on API or educational lab pages", async () => {
  assert.equal(wantsCounts("/", "text/html; charset=utf-8"), true);
  assert.equal(wantsCounts("/api/views", "application/json"), false);
  assert.equal(wantsCounts("/communications-lab/", "text/html"), false);
  assert.equal(wantsCounts("/ai-thesis-atlas/x/", "text/html"), false);
  const client = await readFile(new URL("../public/open-counts.js", import.meta.url), "utf8");
  assert.match(client, /globalPrivacyControl/);
  assert.doesNotMatch(client, /document\.cookie|localStorage/);
});
