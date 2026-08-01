import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { onRequestGet as onIndexRequest } from "../functions/index.js";

const home = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../public/art-home.css", import.meta.url), "utf8");
const script = await readFile(new URL("../public/art-home.js", import.meta.url), "utf8");
const favicon = await readFile(new URL("../public/favicon.svg", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../public/site.webmanifest", import.meta.url), "utf8"));

assert.match(home, /id="voxel-canvas"/);
assert.match(home, /id="voxel-fallback"/);
assert.match(home, /href="\/make\/"/);
assert.match(home, /href="\/made\/"/);
assert.match(home, /href="\/jam\/"/);
assert.match(home, /href="\/about\/"/);
assert.match(home, /href="\/next\/"/);
assert.match(home, /href="\/services\/"/);
assert.match(home, /Skip to the work/);
assert.match(home, /Open Studio 002/);
assert.match(home, /Four things[\s\S]*with real pulse/);
assert.match(home, /Tone[\s\S]*Bloom/);
assert.match(home, /Point[\s\S]*Cast/);
assert.match(home, /04 \/ IMAGE DIARY/);
assert.match(home, /Halation/);
assert.match(home, /https:\/\/halation-diary\.mhoydich\.chatgpt\.site\//);
assert.match(home, /REQUEST FOR LEAD \/ HALATION/);
assert.match(home, /Someone should[\s\S]*lead this/);
assert.match(home, /We’ll fund the work with AI credits/);
assert.match(home, /mailto:mh@pointcast\.xyz\?subject=I%20want%20to%20lead%20Halation/);
assert.match(home, /AI CREDITS \/ FUNDED/);
assert.match(home, /HIGH POTENTIAL/);
assert.match(home, /Rally/);
assert.match(home, /THE \$50K[\s\S]*STARTER KIT/);
assert.match(home, /data-placement="footer"/);
assert.match(home, /Signals in circulation/);
assert.match(home, /href="\/favicon\.svg\?v=20260731a"/);
assert.match(favicon, /<title>Industry Next<\/title>/);
assert.match(favicon, /#111111/);
assert.match(favicon, /#EEFF41/);
assert.equal(manifest.icons[0].src, "/favicon.svg?v=20260731a");
assert.match(css, /\.current-signals/);
assert.match(css, /\.signal-card-rally/);
assert.match(css, /\.signal-card-halation/);
assert.match(css, /\.lead-request/);
assert.match(css, /\.hero-binder/);
assert.match(css, /\.services-door/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /@media \(max-width: 700px\)/);
assert.match(script, /getContext\("webgl"/);
assert.match(script, /Math\.min\(window\.devicePixelRatio \|\| 1, compactDevice \? 1\.25 : 1\.75\)/);
assert.match(script, /IntersectionObserver/);
assert.match(script, /image\.decoding = "async"/);
assert.doesNotMatch(script, /innerHTML/);
assert.match(script, /CURRENT_STUDIO/);

const untouched = new Response(home, { headers: { "Content-Type": "text/html; charset=utf-8" } });
const defaultResponse = await onIndexRequest({
  request: new Request("https://www.industrynext.xyz/"),
  next: async () => untouched.clone(),
});
assert.equal(await defaultResponse.text(), home, "The default art homepage metadata must not be rewritten as a jam room.");

console.log("Art homepage verification passed: routes, WebGL + fallback, responsive and reduced-motion modes, safe feed, and default metadata.");
