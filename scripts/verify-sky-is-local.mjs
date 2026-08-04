import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildSkyPassFeed, parseTle, predictPasses, SKY_OBSERVER } from "../functions/_lib/sky-pass.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [html, css, script, machineText, home, hardware, hardwareText, headers, sitemap, manifestText, apiSource, og] = await Promise.all([
  read("../public/sky-is-local/index.html"),
  read("../public/sky-is-local/sky.css"),
  read("../public/sky-is-local/sky.js"),
  read("../public/sky-is-local.json"),
  read("../public/index.html"),
  read("../public/hardware/index.html"),
  read("../public/hardware.json"),
  read("../public/_headers"),
  read("../public/sitemap.xml"),
  read("../public/site.webmanifest"),
  read("../functions/api/sky-pass.js"),
  read("../public/sky-is-local/og.svg"),
]);
const machine = JSON.parse(machineText);
const hardwareData = JSON.parse(hardwareText);
const manifest = JSON.parse(manifestText);

assert.match(html, /<h1 id="hero-title">The sky[\s\S]*is <em>local\.<\/em>/);
assert.match(html, /LIVE = orbital elements \+ modeled passes|<span>LIVE<\/span>[\s\S]*Orbital elements \+ modeled passes/);
assert.match(html, /REHEARSAL[\s\S]*Browser bells \+ packet blooms/);
assert.match(html, /SIMULATED PACKET \/ LOCAL SYNTH \/ NO RADIO CONNECTED/);
assert.match(html, /RECEIVE-ONLY FIRST/);
assert.match(html, /this page never requests your location/i);
assert.match(html, /A pass means geometry is favorable—not that a signal will be received/);
assert.match(html, /data-placement="footer"/);
assert.equal((html.match(/<article><span>(?:15 MIN|30 MIN|60 MIN|REST)<\/span>/g) || []).length, 4);
assert.match(html, /https:\/\/tinygs\.com\//);
assert.match(html, /https:\/\/docs\.satnogs\.org\/projects\/satnogs-kit\/en\/latest\/introduction\.html/);
assert.match(html, /rel="alternate" type="application\/json" href="\/sky-is-local\.json"/);
assert.match(html, /\/api\/sky-pass/);

assert.match(css, /\.sky-stage/);
assert.match(css, /\.bloom/);
assert.match(css, /@media \(max-width: 700px\)/);
assert.match(css, /@media print/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.doesNotMatch(css, /inset-top/);

assert.match(script, /new AudioContextClass/);
assert.match(script, /fetch\("\/api\/sky-pass"/);
assert.match(script, /window\.print/);
assert.match(script, /aria-pressed/);
assert.match(script, /replaceChildren/);
assert.doesNotMatch(script, /innerHTML/);
assert.doesNotMatch(script, /localStorage|sessionStorage|geolocation/);

assert.equal(machine.schema_version, "industrynext.sky-score.v1");
assert.equal(machine.observer.name, "El Segundo, California");
assert.equal(machine.observer.location_request, false);
assert.equal(machine.instrument.status, "rehearsal");
assert.equal(machine.instrument.radio_connected, false);
assert.equal(machine.roles.length, 4);
assert.equal(machine.boundaries.length, 4);
assert.ok(machine.sources.some((source) => source.includes("celestrak.org")));
assert.ok(machine.sources.some((source) => source.includes("satellite-js")));

assert.match(home, /href="\/sky-is-local\/">Play the Satellite Picnic/);
assert.match(hardware, /FIELD TEST 001 \/ NEW \/ PLAYABLE/);
assert.match(hardware, /href="\/sky-is-local\/">Play the Satellite Picnic/);
assert.equal(hardwareData.field_tests[0].id, "sky-is-local");
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/sky-is-local/"));
assert.match(headers, /\/sky-is-local\.json[\s\S]*application\/json/);
assert.match(headers, /\/api\/sky-pass[\s\S]*s-maxage=21600/);
assert.match(sitemap, /industrynext\.xyz\/sky-is-local\//);
assert.match(sitemap, /industrynext\.xyz\/sky-is-local\.json/);
assert.match(apiSource, /buildSkyPassFeed/);
assert.match(apiSource, /status: 503/);
assert.match(og, /The Sky Is Local/);
assert.match(og, /LIVE ORBITS \/ REHEARSED SOUND \/ RECEIVE-ONLY FIRST/);

const fixedTleText = `ISS (ZARYA)
1 25544U 98067A   26215.79638706  .00007444  00000+0  14146-3 0  9999
2 25544  51.6316  64.4821 0007224   9.2337 350.8783 15.49332738579132`;
const fixedTle = parseTle(fixedTleText, "ISS (ZARYA)");
assert.equal(fixedTle.name, "ISS (ZARYA)");
const predicted = predictPasses({
  tle: fixedTle,
  satellite: { catalogId: "25544", label: "ISS (ZARYA)", kind: "crew + amateur radio" },
  observer: SKY_OBSERVER,
  now: new Date("2026-08-03T12:00:00.000Z"),
});
assert.ok(predicted.length >= 1, "fixed TLE should produce at least one El Segundo pass in 48 hours");
assert.ok(predicted.every((pass) => pass.maxElevationDegrees >= 10));
assert.ok(predicted.every((pass) => new Date(pass.riseAt) < new Date(pass.setAt)));

const mockFetch = async () => new Response(fixedTleText, { status: 200, headers: { "Content-Type": "text/plain" } });
const feed = await buildSkyPassFeed({ fetchImpl: mockFetch, now: new Date("2026-08-03T12:00:00.000Z") });
assert.equal(feed.schemaVersion, "industrynext.sky-pass.v1");
assert.equal(feed.status, "predicted");
assert.equal(feed.observer.name, "El Segundo, California");
assert.equal(feed.sources.length, 3);
assert.ok(feed.passes.length >= 1);
assert.match(feed.prediction.note, /not a confirmed radio reception/);

console.log("The Sky Is Local verification passed: deterministic orbital model, truthful rehearsal boundary, four contribution tempos, discovery doorways, live API contract, machine score, accessibility, and printable picnic score.");
