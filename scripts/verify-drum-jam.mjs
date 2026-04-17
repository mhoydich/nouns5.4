import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getRoomSnapshot, joinRoom, recordPulse, recordReaction } from "../functions/_lib/jam-store.js";
import { onRequestGet as onOgRequest } from "../functions/api/og.svg.js";
import { onRequestGet as onIndexRequest } from "../functions/index.js";
import { buildRoomMeta, computeRoomTelemetry } from "../shared/drum-jam-telemetry.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");
const baseHtml = await readFile(resolve(rootDir, "public/index.html"), "utf8");
const roomId = `qa-${Date.now().toString(36)}`;
const alice = {
  id: `${roomId}-alice`,
  name: "Alice",
  seed: {
    background: 0,
    body: 1,
    accessory: 2,
    head: 3,
    glasses: 4,
  },
  selectedDrop: "Laser Tom",
};
const bob = {
  id: `${roomId}-bob`,
  name: "Bob",
  seed: {
    background: 1,
    body: 4,
    accessory: 3,
    head: 2,
    glasses: 1,
  },
  selectedDrop: "Garage Kick",
};

joinRoom(roomId, alice);
recordPulse(roomId, alice, {
  hits: 12,
  tokens: 48,
  combo: 9,
});
joinRoom(roomId, bob);
recordReaction(roomId, bob, {
  reaction: "CLAP",
});

const snapshot = getRoomSnapshot(roomId);
const telemetry = computeRoomTelemetry(snapshot);
const meta = buildRoomMeta(snapshot, roomId);

assert.equal(snapshot.roomId, roomId);
assert.equal(snapshot.players.length, 2);
assert.ok(telemetry.participantCount >= 2);
assert.ok(telemetry.hypeIndex > 0);
assert.ok(meta.pageTitle.includes(roomId));
assert.ok(meta.ogImageUrl.includes(encodeURIComponent(roomId)));

const htmlResponse = await onIndexRequest({
  request: new Request(`https://www.industrynext.xyz/?room=${roomId}`),
  next: async () =>
    new Response(baseHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    }),
});
const html = await htmlResponse.text();

assert.match(htmlResponse.headers.get("Content-Type") || "", /text\/html/);
assert.ok(html.includes(meta.pageTitle));
assert.ok(html.includes(meta.ogImageUrl));
assert.ok(html.includes(meta.shareUrl));

const ogResponse = await onOgRequest({
  request: new Request(`https://www.industrynext.xyz/api/og.svg?room=${roomId}`),
});
const ogSvg = await ogResponse.text();

assert.match(ogResponse.headers.get("Content-Type") || "", /image\/svg\+xml/);
assert.ok(ogSvg.includes("Drum Nouns Jam"));
assert.ok(ogSvg.includes("Alice"));

console.log("Verified Drum Nouns Jam metadata, OG image route, and room telemetry.");
