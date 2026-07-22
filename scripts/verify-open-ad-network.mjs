import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const publicDir = resolve(import.meta.dirname, "../public");

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

const files = await htmlFiles(publicDir);
assert.ok(files.length >= 6, `expected Industry Next page set, found ${files.length}`);

for (const file of files) {
  const html = await readFile(file, "utf8");
  assert.match(html, /data-pointcast-network/);
  assert.match(html, /data-publisher="industrynext"/);
  assert.match(html, /data-placement="first-100-lead"/);
  assert.match(html, /data-campaign="PC-NETWORK-EL-SEGUNDO-2026"/);
  assert.match(html, /https:\/\/pointcast\.xyz\/open-ad-network\.js/);
  assert.match(html, /<body\b[^>]*>\s*<div data-pointcast-network/);
  assert.equal((html.match(/data-pointcast-network/g) || []).length, 1);
  assert.equal((html.match(/https:\/\/pointcast\.xyz\/open-ad-network\.js/g) || []).length, 1);
}

console.log(`Verified first-100 campaign mount on ${files.length} Industry Next pages.`);
