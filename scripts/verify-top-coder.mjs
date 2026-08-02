import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const read = (path) => readFile(resolve(rootDir, path), "utf8");

const [html, css, js, jsonText, home, sitemap, headers] = await Promise.all([
  read("public/top-coder/index.html"),
  read("public/top-coder/top-coder.css"),
  read("public/top-coder/top-coder.js"),
  read("public/top-coder.json"),
  read("public/index.html"),
  read("public/sitemap.xml"),
  read("public/_headers"),
]);
const brief = JSON.parse(jsonText);
const core = await import(pathToFileURL(resolve(rootDir, "public/top-coder/core.js")));

assert.match(html, /<h1[^>]*>[\s\S]*TOP[\s\S]*CODER/);
assert.match(html, /id="solution"/);
assert.match(html, /id="checks-list"/);
assert.match(html, /No account\. No résumé theater\. No speed bonus\./);
assert.match(html, /data-pointcast-network[^>]+data-placement="footer"/);
assert.match(css, /@media \(max-width: 700px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.match(js, /setAttribute\("sandbox", "allow-scripts"\)/);
assert.match(js, /default-src 'none'/);
assert.match(js, /worker-src blob:/);
assert.match(js, /worker\.terminate\(\)/);
assert.match(js, /localStorage\.setItem/);
assert.doesNotMatch(js, /fetch\s*\(/);
assert.equal((js.match(/id: "(?:empty|latest|cancelled|priority|time|duplicate|immutable)"/g) || []).length, 7);
assert.match(home, /href="\/top-coder\/"/);
assert.match(sitemap, /https:\/\/www\.industrynext\.xyz\/top-coder\//);
assert.match(headers, /\/top-coder\.json[\s\S]*Content-Type: application\/json/);
assert.equal(brief.id, "IN-TC-001");
assert.equal(brief.score.topCoderThreshold, 90);
assert.equal(brief.privacy.codeUploaded, false);
assert.equal(brief.task.checks, 7);

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

console.log("Top Coder verification passed: route, privacy boundary, sandbox, scoring, doorway, sitemap, and machine brief.");
