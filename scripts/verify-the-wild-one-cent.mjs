import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const dir = "public/editorial/the-wild-one-cent";
const page = await readFile(`${dir}/index.html`, "utf8");
const css = await readFile(`${dir}/styles.css`, "utf8");
const home = await readFile("public/index.html", "utf8");
const sitemap = await readFile("public/sitemap.xml", "utf8");
const record = JSON.parse(await readFile("public/the-wild-one-cent.json", "utf8"));

assert.match(page, /One cent, <em>remembered\.<\/em>/);
assert.match(page, /CASE STUDY 002/);
assert.match(page, /One MetaMask wallet, four names\./);
assert.match(page, /Five stations\. The key never enters the model\./);
assert.match(page, /The yield is a record, not a return\./);
assert.match(page, /Prove the rail\. Then prove the want\./);
assert.match(page, /household controls/);
assert.match(page, /application\/ld\+json/);
assert.match(page, /rel="canonical" href="https:\/\/www\.industrynext\.xyz\/editorial\/the-wild-one-cent\/"/);
assert.match(page, /the-wild-one-cent\.json/);
assert.match(page, /the-wild-x402\.mhoydich\.workers\.dev\/api\/field/);
assert.match(page, /basescan\.org\/tx\/0xbe2fbec6/);
assert.match(page, /\.\.\/axon-yield-engine\//);
assert.match(page, /mailto:mh@pointcast\.xyz/);
assert.doesNotMatch(page, /EVM_PRIVATE_KEY|PRIVATE_KEY|seed phrase/i, "no key-like material");
const hexes = new Set(page.match(/0x[0-9a-fA-F]{64}/g) ?? []);
assert.deepEqual(
  [...hexes].sort(),
  [
    "0x02301f59f940b540098f2656aebd60debd6a6a2a0efb00d78ee0b632da8f7a7a",
    "0xbe2fbec6527b3150d2cc7b6f6e217447732a7416cfa18e46f7e58d840f95d2f7",
  ],
  "only the two public transaction hashes may appear",
);
assert.match(css, /@media \(max-width: 620px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.match(home, /\/editorial\/the-wild-one-cent\//);
assert.match(home, /\/editorial\/axon-yield-engine\//, "case study 001 stays on the shelf");
assert.match(sitemap, /\/editorial\/the-wild-one-cent\//);
assert.match(sitemap, /\/the-wild-one-cent\.json/);

for (const img of ["hero.jpg", "penny.jpg", "desk.jpg", "morrow.jpg", "candles.jpg", "og.jpg"]) {
  if (img !== "og.jpg") assert.ok(page.includes(img), `${img} should be referenced`);
  const info = await stat(`${dir}/${img}`);
  assert.ok(info.size > 50_000, `${img} should be a substantial image`);
}

assert.equal(record.number, "002");
assert.equal(record.field_state.settled_wallets, 1);
assert.equal(record.field_state.house_wallet_named_on_site, true);
assert.equal(record.checklist.length, 7);
assert.equal(record.penny_stations.length, 5);
assert.ok(record.sources.length >= 9);

console.log("The Wild one-cent case study verified.");
