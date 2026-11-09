// Every page that carries the PointCast network footer also carries the shared
// El Segundo check-in card, tagged as Industry Next, and the discovery file parses.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public");
async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}
let checked = 0;
for (const file of await htmlFiles(publicDir)) {
  const html = await readFile(file, "utf8");
  if (!html.includes("pointcast.xyz/open-ad-network.js")) continue;
  const tags = html.match(/<script async src="https:\/\/elsegundo\.xyz\/ping\/geostamp\.js" data-site="industry-next"><\/script>/g) || [];
  assert.equal(tags.length, 1, file);
  checked++;
}
const here = JSON.parse(await readFile(join(publicDir, ".well-known", "here.json"), "utf8"));
assert.equal(here.here, "here/0.1");
assert.equal(here.site, "industry-next");
assert.ok(Object.values(here.feeds).every(url => url.startsWith("https://elsegundo.xyz/api/v1/stamps")));
console.log(`geostamp: ${checked} pages carry the check-in card`);
