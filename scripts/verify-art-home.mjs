import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { onRequestGet as onIndexRequest } from "../functions/index.js";

const home = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../public/art-home.css", import.meta.url), "utf8");
const script = await readFile(new URL("../public/art-home.js", import.meta.url), "utf8");

assert.match(home, /id="voxel-canvas"/);
assert.match(home, /id="voxel-fallback"/);
assert.match(home, /href="\/make\/"/);
assert.match(home, /href="\/made\/"/);
assert.match(home, /href="\/jam\/"/);
assert.match(home, /href="\/about\/"/);
assert.match(home, /href="\/next\/"/);
assert.match(home, /Skip to the work/);
assert.match(home, /Permission Is a Material/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /@media \(max-width: 700px\)/);
assert.match(script, /getContext\("webgl"/);
assert.match(script, /Math\.min\(window\.devicePixelRatio \|\| 1, compactDevice \? 1\.25 : 1\.75\)/);
assert.match(script, /IntersectionObserver/);
assert.match(script, /image\.decoding = "async"/);
assert.doesNotMatch(script, /innerHTML/);

const untouched = new Response(home, { headers: { "Content-Type": "text/html; charset=utf-8" } });
const defaultResponse = await onIndexRequest({
  request: new Request("https://www.industrynext.xyz/"),
  next: async () => untouched.clone(),
});
assert.equal(await defaultResponse.text(), home, "The default art homepage metadata must not be rewritten as a jam room.");

console.log("Art homepage verification passed: routes, WebGL + fallback, responsive and reduced-motion modes, safe feed, and default metadata.");
