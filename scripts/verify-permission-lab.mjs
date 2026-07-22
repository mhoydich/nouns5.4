import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildMadeRecord, listMade, saveMade, validateMadeSubmission } from "../functions/_lib/made-store.js";
import { onRequestGet, onRequestPost } from "../functions/api/made.js";

const sample = {
  message: "Permission is the starting point.", maker: "Industry Next", mode: "sign", palette: "signal",
  seed: { background: 0, body: 4, accessory: 26, head: 89, glasses: 3 },
};

const clean = validateMadeSubmission(sample);
assert.equal(clean.message, sample.message);
assert.throws(() => validateMadeSubmission({ ...sample, mode: "speculation" }), /valid form/);
assert.throws(() => validateMadeSubmission({ ...sample, seed: { ...sample.seed, head: 999 } }), /out of range/);

const fixedDate = new Date("2026-07-22T12:00:00.000Z");
const built = buildMadeRecord(sample, fixedDate, "test-id");
assert.match(built.key, /^made:\d{13}:test-id$/);
assert.equal(built.record.createdAt, fixedDate.toISOString());

class MemoryKv {
  constructor() { this.values = new Map(); this.metadata = new Map(); }
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value, options = {}) { this.values.set(key, value); if (options.metadata) this.metadata.set(key, options.metadata); }
  async list({ prefix, limit }) {
    return { keys: [...this.values.keys()].filter((key) => key.startsWith(prefix)).sort().slice(0, limit).map((name) => ({ name, metadata: this.metadata.get(name) })) };
  }
}

const kv = new MemoryKv(); const env = { INDUSTRY_NEXT_MADE: kv };
await saveMade(env, sample, { now: fixedDate, id: "saved-id" });
assert.equal((await listMade(env))[0].id, "saved-id");

const getResponse = await onRequestGet({ request: new Request("https://example.com/api/made"), env });
assert.equal(getResponse.status, 200);
assert.equal((await getResponse.json()).entries.length, 1);

const postResponse = await onRequestPost({ request: new Request("https://example.com/api/made", { method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.1" }, body: JSON.stringify(sample) }), env });
assert.equal(postResponse.status, 201);

const files = {
  home: await readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  make: await readFile(new URL("../public/make/index.html", import.meta.url), "utf8"),
  makeJs: await readFile(new URL("../public/make/make.js", import.meta.url), "utf8"),
  madeJs: await readFile(new URL("../public/made/made.js", import.meta.url), "utf8"),
  next: await readFile(new URL("../public/next/index.html", import.meta.url), "utf8"),
  sitemap: await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8"),
  config: await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
};
assert.match(files.home, /href="\/make\/"/);
assert.match(files.makeJs, /canvas\.toDataURL\("image\/png"\)/);
assert.match(files.makeJs, /method: "POST"/);
assert.doesNotMatch(files.madeJs, /innerHTML/);
assert.match(files.next, /Different sites\. One creative circuit\./);
assert.match(files.sitemap, /industrynext\.xyz\/made\//);
assert.match(files.config, /INDUSTRY_NEXT_MADE/);

console.log("Permission Lab verification passed: validation, KV persistence, API, PNG export, safe feed, field map, and routes.");
