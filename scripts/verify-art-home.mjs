import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { onRequestGet as onIndexRequest } from "../functions/index.js";

const home = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../public/art-home.css", import.meta.url), "utf8");
const script = await readFile(new URL("../public/art-home.js", import.meta.url), "utf8");
const favicon = await readFile(new URL("../public/favicon.svg", import.meta.url), "utf8");
const brandedFavicon = await readFile(new URL("../public/industry-next-icon.svg", import.meta.url), "utf8");
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
assert.match(home, /WORKING MAGAZINE \/ FILE 003/);
assert.match(home, /The future[\s\S]*should come[\s\S]*with <em>handles/);
assert.match(home, /Less future theater\. More working proof\./);
assert.match(home, /Hire the studio/);
assert.match(home, /What is working[\s\S]*right now/);
assert.match(home, /Tone Bloom/);
assert.match(home, /PointCast/);
assert.match(home, /GATHERING LAYER \/ HIGH POTENTIAL/);
assert.match(home, /Rally/);
assert.match(home, /WORK MARKET \/ JOB \+ TASK \+ ORG \+ TOKEN/);
assert.match(home, /href="\/market\/"/);
assert.match(home, /TERMS BEFORE TRANSACTIONS/);
assert.match(home, /https:\/\/halation-diary\.mhoydich\.chatgpt\.site\//);
assert.match(home, /REQUEST FOR LEAD \/ AI CREDITS FUNDED/);
assert.match(home, /Take Halation somewhere only a committed person can/);
assert.match(home, /mailto:mh@pointcast\.xyz\?subject=I%20want%20to%20lead%20Halation/);
assert.match(home, /ROLE 001 \/ OPEN/);
assert.match(home, /Playlist Editor \+ Listener Growth Lead/);
assert.match(home, /THE \$50K[\s\S]*STARTER KIT/);
assert.match(home, /Bring us the[\s\S]*consequential[\s\S]*question/);
assert.match(home, /data-placement="footer"/);
assert.match(home, /Choose your way in/);
assert.match(home, /The table is turning/);
assert.match(home, /Come with a[\s\S]*weirdly specific[\s\S]*problem/);
assert.match(home, /href="\/industry-next-icon\.svg"/);
assert.match(favicon, /<title>Industry Next<\/title>/);
assert.match(favicon, /#111111/);
assert.match(favicon, /#EEFF41/);
assert.equal(brandedFavicon, favicon);
assert.equal(manifest.icons[0].src, "/industry-next-icon.svg");
assert.match(css, /\.proof-ledger/);
assert.match(css, /\.project-rally/);
assert.match(css, /\.market-window/);
assert.match(css, /\.market-board/);
assert.match(css, /\.services-window/);
assert.match(css, /\.starter-file/);
assert.match(css, /\.open-calls/);
assert.match(css, /\.entrance-grid/);
assert.match(css, /\.hero-stage-wrap/);
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
