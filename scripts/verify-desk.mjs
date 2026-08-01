import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  TASK_STATUSES,
  boardStats,
  buildStampEnvelope,
  createStarterTasks,
  moveTask,
  verifyReceipt,
} from "../src/task-desk-core.js";

const root = resolve(import.meta.dirname, "..");
const [html, css, builtScript, deskContract, sitemap, headers] = await Promise.all([
  readFile(resolve(root, "public/desk/index.html"), "utf8"),
  readFile(resolve(root, "public/desk/desk.css"), "utf8"),
  readFile(resolve(root, "public/desk.js"), "utf8"),
  readFile(resolve(root, "public/desk.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "public/sitemap.xml"), "utf8"),
  readFile(resolve(root, "public/_headers"), "utf8"),
]);

assert.deepEqual(TASK_STATUSES, ["inbox", "next", "doing", "review", "done"]);
const tasks = createStarterTasks();
assert.equal(tasks.length, 4);
assert.equal(boardStats(tasks, []).total, 4);
assert.equal(moveTask(tasks[0], 1).status, "doing");

const stamp = await buildStampEnvelope(tasks[0], "2026-07-31T12:00:00.000Z");
assert.match(stamp.taskHash, /^[a-f0-9]{64}$/);
assert.match(stamp.chainHash, /^[a-f0-9]{64}$/);
assert.notEqual(stamp.taskHash, stamp.chainHash);
assert.equal((await verifyReceipt({ ...stamp })).valid, true);

assert.match(html, /Private by default|PRIVATE BY DEFAULT/i);
assert.match(html, /Stamp the receipt/i);
assert.match(html, /0 ꜩ TRANSFER/);
assert.match(html, /\/desk\.json/);
assert.match(html, /\/desk\/og\.png/);
assert.match(css, /@media \(max-width: 580px\)/);
assert.match(builtScript, /KT1AtaeG5PhuFyyivbfPZRUBkVMiqyxpo2cH/);
assert.match(builtScript, /tezos-mainnet\.octez\.io/);
assert.equal(deskContract.storage.tasks, "browser-local");
assert.equal(deskContract.tezos_stamp.amount_tez, 0);
assert.equal(deskContract.tezos_stamp.wallet_approval, true);
assert.equal(deskContract.tezos_stamp.token_minted, false);
assert.match(sitemap, /https:\/\/www\.industrynext\.xyz\/desk\//);
assert.match(headers, /\/desk\/\*/);
assert.match(headers, /\/desk\.json/);

console.log("Industry Next Desk verification passed.");
