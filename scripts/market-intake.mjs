import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const NAMESPACE_ID = "eb5d38abafb648f6bf418ec03d13fae8";
const VALID_STATUSES = new Set(["qualified", "conversation", "selected", "declined", "withdrawn"]);
const [command = "help", ...args] = process.argv.slice(2);

function wrangler(parameters, { capture = true } = {}) {
  return execFileSync("npx", ["wrangler", ...parameters], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    env: process.env,
  });
}

function exactId(value) {
  if (!/^[0-9a-f-]{36}$/i.test(value || "")) throw new Error("Use the exact receipt UUID shown by `npm run market:intake -- list`.");
  return value;
}

function printHelp() {
  console.log(`Industry Next private market intake

Commands:
  npm run market:intake -- list
  npm run market:intake -- show <receipt-id>
  npm run market:intake -- status <receipt-id> <qualified|conversation|selected|declined|withdrawn>

The public site has no inbox route. This tool reads the production KV namespace through your authenticated Wrangler session.`);
}

function getRecord(id) {
  const output = wrangler([
    "kv", "key", "get", `market-application-id:${id}`,
    "--namespace-id", NAMESPACE_ID,
    "--remote",
    "--text",
  ]);
  const record = JSON.parse(output);
  if (record.id !== id || !record.storageKey) throw new Error("The stored record did not match the requested receipt.");
  return record;
}

async function putRecord(record) {
  const remainingSeconds = Math.max(60, Math.floor((new Date(record.retentionUntil).getTime() - Date.now()) / 1_000));
  const directory = await mkdtemp(join(tmpdir(), "industrynext-market-intake-"));
  const recordPath = join(directory, "record.json");
  try {
    await writeFile(recordPath, `${JSON.stringify(record)}\n`, { mode: 0o600 });
    const metadata = JSON.stringify({
      id: record.id,
      type: record.type,
      roleId: record.roleId || "tumblr-talent-relay",
      status: record.status,
      createdAt: record.createdAt,
    });
    wrangler([
      "kv", "key", "put", record.storageKey,
      "--path", recordPath,
      "--namespace-id", NAMESPACE_ID,
      "--remote",
      "--ttl", String(remainingSeconds),
      "--metadata", metadata,
    ], { capture: false });
    wrangler([
      "kv", "key", "put", `market-application-id:${record.id}`,
      "--path", recordPath,
      "--namespace-id", NAMESPACE_ID,
      "--remote",
      "--ttl", String(remainingSeconds),
    ], { capture: false });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

try {
  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
  } else if (command === "list") {
    const output = wrangler([
      "kv", "key", "list",
      "--namespace-id", NAMESPACE_ID,
      "--remote",
      "--prefix", "market-application:",
    ]);
    const rows = JSON.parse(output).map(({ metadata = {} }) => ({
      receipt: metadata.id,
      type: metadata.type,
      role: metadata.roleId,
      status: metadata.status,
      received: metadata.createdAt,
    }));
    console.table(rows);
    if (!rows.length) console.log("No applications in the private 90-day inbox.");
  } else if (command === "show") {
    const record = getRecord(exactId(args[0]));
    console.log(JSON.stringify(record, null, 2));
  } else if (command === "status") {
    const id = exactId(args[0]);
    const status = args[1];
    if (!VALID_STATUSES.has(status)) throw new Error("Choose qualified, conversation, selected, declined, or withdrawn.");
    const record = getRecord(id);
    const now = new Date().toISOString();
    record.status = status;
    record.updatedAt = now;
    record.statusHistory = [...(record.statusHistory || []), { status, at: now }];
    await putRecord(record);
    console.log(`Updated ${id} to ${status}. The original 90-day deletion date is unchanged.`);
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
