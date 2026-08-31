import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const read = (path) => readFile(resolve(rootDir, path), "utf8");

const [
  ticket001Html,
  ticket002Html,
  css,
  runner,
  proofBook,
  ticket001Source,
  ticket002Source,
  ticket002TestsSource,
  ticket001JsonText,
  ticket002JsonText,
  home,
  sitemap,
  headers,
] = await Promise.all([
  read("public/top-coder/index.html"),
  read("public/top-coder/002/index.html"),
  read("public/top-coder/top-coder.css"),
  read("public/top-coder/challenge-runner.js"),
  read("public/top-coder/proof-book.js"),
  read("public/top-coder/ticket-001.js"),
  read("public/top-coder/002/ticket-002.js"),
  read("public/top-coder/ticket-002-tests.js"),
  read("public/top-coder.json"),
  read("public/top-coder-002.json"),
  read("public/index.html"),
  read("public/sitemap.xml"),
  read("public/_headers"),
]);

const ticket001Brief = JSON.parse(ticket001JsonText);
const ticket002Brief = JSON.parse(ticket002JsonText);
const core = await import(pathToFileURL(resolve(rootDir, "public/top-coder/core.js")));
const { ticket001Tests } = await import(pathToFileURL(resolve(rootDir, "public/top-coder/ticket-001.js")));
const { ticket002Tests } = await import(pathToFileURL(resolve(rootDir, "public/top-coder/ticket-002-tests.js")));

for (const [html, ticket, title] of [
  [ticket001Html, "001", "The Messy Queue"],
  [ticket002Html, "002", "The Promise Pool"],
]) {
  assert.match(html, /<h1[^>]*>[\s\S]*TOP[\s\S]*CODER/);
  assert.match(html, new RegExp(`TICKET ${ticket}`));
  assert.match(html, new RegExp(title));
  assert.match(html, /id="solution"/);
  assert.match(html, /id="checks-list"/);
  assert.match(html, /No account\.[\s\S]*No (?:résumé theater|upload)\.[\s\S]*No speed bonus\./);
  assert.match(html, /data-pointcast-network[^>]+data-placement="footer"/);
  assert.equal((html.match(/data-check="[a-z]+"/g) || []).length, 7);
  assert.equal((html.match(/data-proof-slot="IN-TC-00[12]"/g) || []).length, 2);
  assert.match(html, /data-copy-proof-book/);
  assert.match(html, /data-clear-proof-book/);
}

assert.match(ticket001Html, /canonical" href="https:\/\/www\.industrynext\.xyz\/top-coder\/"/);
assert.match(ticket002Html, /canonical" href="https:\/\/www\.industrynext\.xyz\/top-coder\/002\/"/);
assert.match(ticket002Html, /mapWithLimit\(items, limit, worker\)/);
assert.match(css, /\.proof-book-grid/);
assert.match(css, /\.ticket-002 \.hero/);
assert.match(css, /@media \(max-width: 700px\)/);
assert.match(css, /prefers-reduced-motion/);

assert.match(runner, /setAttribute\("sandbox", "allow-scripts"\)/);
assert.match(runner, /default-src 'none'/);
assert.match(runner, /worker-src blob:/);
assert.match(runner, /connect-src 'none'/);
assert.match(runner, /worker\.terminate\(\)/);
assert.match(runner, /localStorage\.setItem/);
assert.doesNotMatch(runner, /fetch\s*\(/);
assert.match(proofBook, /industrynext\.top-coder\.proof-book\.v1/);
assert.match(proofBook, /IN-TC-001/);
assert.match(proofBook, /IN-TC-002/);
assert.match(proofBook, /window\.confirm/);
assert.doesNotMatch(proofBook, /fetch\s*\(/);

assert.equal((ticket001Source.match(/id: "(?:empty|latest|cancelled|priority|time|duplicate|immutable)"/g) || []).length, 7);
assert.equal((ticket002TestsSource.match(/id: "(?:empty|order|limit|fills|once|rejects|immutable)"/g) || []).length, 7);
assert.match(ticket002Source, /ticket002Tests/);
assert.match(ticket002TestsSource, /peak <= 2/);
assert.match(ticket002TestsSource, /caught === marker/);

assert.match(home, /href="\/top-coder\/"/);
assert.match(home, /Top Coder/);
assert.match(sitemap, /https:\/\/www\.industrynext\.xyz\/top-coder\/002\//);
assert.match(sitemap, /https:\/\/www\.industrynext\.xyz\/top-coder-002\.json/);
assert.match(headers, /\/top-coder\.json[\s\S]*Content-Type: application\/json/);
assert.match(headers, /\/top-coder-002\.json[\s\S]*Content-Type: application\/json/);

assert.equal(ticket001Brief.id, "IN-TC-001");
assert.equal(ticket002Brief.id, "IN-TC-002");
assert.equal(ticket001Brief.score.topCoderThreshold, 90);
assert.equal(ticket002Brief.score.topCoderThreshold, 90);
assert.equal(ticket001Brief.privacy.codeUploaded, false);
assert.equal(ticket002Brief.privacy.codeUploaded, false);
assert.equal(ticket001Brief.task.checks, 7);
assert.equal(ticket002Brief.task.checks, 7);
assert.equal(ticket001Brief.series.tickets.length, 2);
assert.equal(ticket002Brief.series.tickets, 2);

function repairQueue(records) {
  const current = new Map();
  for (const record of records) {
    const previous = current.get(record.id);
    if (!previous || record.revision > previous.revision) current.set(record.id, record);
  }
  return [...current.values()]
    .filter((record) => !record.cancelled)
    .sort((left, right) => (right.priority - left.priority) || left.createdAt.localeCompare(right.createdAt))
    .map((record) => record.id);
}

async function mapWithLimit(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  let failed = false;
  async function lane() {
    while (!failed) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      try { results[index] = await worker(items[index], index); }
      catch (error) { failed = true; throw error; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return results;
}

const ticket001Results = await ticket001Tests(repairQueue);
const ticket002Results = await ticket002Tests(mapWithLimit);
assert.equal(ticket001Results.filter((result) => result.passed).length, 7);
assert.equal(ticket002Results.filter((result) => result.passed).length, 7);

const allPass = Array.from({ length: 7 }, (_, index) => ({ id: String(index), passed: true }));
assert.deepEqual(core.scoreProof(allPass, "Keeps the current revision before sorting."), {
  passed: 7,
  correctness: 70,
  clarity: 20,
  seal: 10,
  total: 100,
});
assert.equal(core.proofLabel(100), "TOP CODER");
assert.equal(core.proofLabel(80), "REPAIR PASSED / NOTE NEEDED");

console.log("Top Coder verification passed: two tickets, fourteen checks, local Proof Book, sandbox, score contracts, doorway, sitemap, and machine briefs.");
