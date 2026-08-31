import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { onRequestGet as onIndexRequest } from "../functions/index.js";

const home = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../public/art-home.css", import.meta.url), "utf8");
const script = await readFile(new URL("../public/art-home.js", import.meta.url), "utf8");
const favicon = await readFile(new URL("../public/favicon.svg", import.meta.url), "utf8");
const brandedFavicon = await readFile(new URL("../public/industry-next-icon.svg", import.meta.url), "utf8");
const manifest = JSON.parse(await readFile(new URL("../public/site.webmanifest", import.meta.url), "utf8"));

assert.match(home, /<title>Industry Next — Useful work can feel good<\/title>/);
assert.match(home, /PUBLIC DEVELOPMENT STUDIO \/ EL SEGUNDO \+ THE INTERNET/);
assert.match(home, /Useful work[\s\S]*can feel[\s\S]*<em>good\.<\/em>/);
assert.match(home, /id="voxel-canvas"/);
assert.match(home, /id="voxel-fallback"/);
assert.match(home, /id="alive"/);
assert.match(home, /id="ways-in"/);
assert.match(home, /id="fields"/);
assert.match(home, /One studio[\s\S]*Three public[\s\S]*faces/);
assert.match(home, /Alive[\s\S]*right now/);
assert.equal((home.match(/class="signal-card /g) || []).length, 4);
assert.match(home, /The Sky Is Local/);
assert.match(home, /Tone Bloom/);
assert.match(home, /AI Service Desk/);
assert.match(home, /Everyone Has Some Time/);
assert.match(home, /href="\/hardware\/"/);
assert.match(home, /href="\/market\/"/);
assert.match(home, /href="\/services\/"/);
assert.match(home, /href="\/help\/"/);
assert.match(home, /href="\/experts\/"/);
assert.match(home, /class="ai-work-window"/);
assert.match(home, /AI Working Sessions/);
assert.match(home, /Expert Network/);
assert.match(home, /Agent Bench/);
assert.match(home, /\$350 \/ 75 minutes/);
assert.match(home, /From \$12\.5K/);
assert.match(home, /From \$1\.5K \/ month/);
assert.match(home, /THE \$50K STARTER KIT/);
assert.match(home, /data-placement="footer"/);
assert.match(home, /href="\/industry-next-icon\.svg"/);
assert.match(favicon, /<title>Industry Next satellite dish<\/title>/);
assert.equal(brandedFavicon, favicon);
assert.equal(manifest.icons[0].src, "/industry-next-icon.svg");

assert.match(css, /\.flow-hero/);
assert.match(css, /\.signal-deck/);
assert.match(css, /\.position-ledger/);
assert.match(css, /\.tempo-line/);
assert.match(css, /\.atlas-grid/);
assert.match(css, /\.two-doors/);
assert.match(css, /\.ai-work-window/);
assert.match(css, /\.ai-work-grid/);
assert.match(css, /\.ai-agent-card/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /@media \(max-width: 700px\)/);

assert.match(script, /getContext\("webgl"/);
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

console.log("Art homepage verification passed: current public studio, live fields, AI work doors, WebGL fallback, and responsive safeguards.");
