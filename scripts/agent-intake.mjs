import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { AGENT_REQUEST_PREFIX, AGENT_REQUEST_STATUSES, exactRequestId, requestMetadata } from "../functions/_lib/agent-request-store.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const WRANGLER = join(ROOT, "node_modules/wrangler/bin/wrangler.js");
const REMOTE = ["--binding", "INDUSTRY_NEXT_MADE", "--remote"];
const OFFERS = new Set(["working-session", "build-day", "pilot-discussion"]);

function authenticatedWrangler(args) {
  try {
    // The installed Wrangler uses the operator's authenticated session. No shell,
    // token extraction, interpolated commands, or implicit package downloads.
    return execFileSync(process.execPath, [WRANGLER, ...args], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 60_000,
      maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
    });
  } catch {
    // Provider errors can echo data. Keep this error independent of stdout/stderr.
    throw new Error("The authenticated Wrangler operation failed. Check access and retry; no operation was confirmed.");
  }
}

function parseJson(value) {
  try { return JSON.parse(value); }
  catch { throw new Error("Wrangler did not return a readable saved record or list."); }
}

function checkedMetadata(record, id) {
  if (record?.id !== id || !AGENT_REQUEST_STATUSES.has(record.status) || !OFFERS.has(record.offer) ||
      !Number.isFinite(Date.parse(record.createdAt)) || !Number.isFinite(Date.parse(record.retentionUntil))) {
    throw new Error("Saved request metadata did not match the expected format.");
  }
  return requestMetadata(record);
}

export function createIntakeOperator({ runWrangler = authenticatedWrangler, now = () => new Date() } = {}) {
  async function show(idValue) {
    const id = exactRequestId(idValue);
    const record = parseJson(await runWrangler(["kv", "key", "get", `${AGENT_REQUEST_PREFIX}${id}`, ...REMOTE, "--text"]));
    if (record?.schema !== "industrynext.agent-request/v1") throw new Error("No matching saved agent request was found.");
    checkedMetadata(record, id);
    if (Date.parse(record.retentionUntil) <= now().getTime()) throw new Error("That request has reached its retention limit.");
    return record;
  }

  async function list() {
    // Remote `wrangler kv key list` follows every result_info.cursor internally.
    // Verified against Wrangler 4.113's fetchListResultBase; there is no CLI cursor flag.
    // Do not replace with the local list path, which returns just one KV page.
    const keys = parseJson(await runWrangler(["kv", "key", "list", ...REMOTE, "--prefix", AGENT_REQUEST_PREFIX]));
    if (!Array.isArray(keys)) throw new Error("Wrangler did not return a complete key list.");
    return keys.map(({ name, metadata }) => {
      if (typeof name !== "string" || !name.startsWith(AGENT_REQUEST_PREFIX)) throw new Error("Unexpected key in the request list.");
      const id = exactRequestId(name.slice(AGENT_REQUEST_PREFIX.length));
      return checkedMetadata(metadata, id);
    }).filter((record) => Date.parse(record.retentionUntil) > now().getTime())
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id));
  }

  async function status(idValue, nextStatus) {
    const id = exactRequestId(idValue);
    if (!AGENT_REQUEST_STATUSES.has(nextStatus)) throw new Error("Choose new, reviewing, contacted, or closed.");
    const record = await show(id);
    if (record.status === nextStatus) return record;
    const currentTime = now();
    const expiration = Math.floor(Date.parse(record.retentionUntil) / 1_000);
    // KV cannot write an expiration less than 60 seconds away. Never extend it.
    if (expiration - currentTime.getTime() / 1_000 <= 60) {
      throw new Error("This request is too close to expiry to update. Let it expire or delete it; retention will not be extended.");
    }
    const updated = { ...record, status: nextStatus, updatedAt: currentTime.toISOString() };
    const directory = await mkdtemp(join(tmpdir(), "industrynext-agent-intake-"));
    const path = join(directory, "record.json");
    try {
      await writeFile(path, JSON.stringify(updated), { mode: 0o600, flag: "wx" });
      await runWrangler([
        "kv", "key", "put", `${AGENT_REQUEST_PREFIX}${id}`, ...REMOTE,
        "--path", path, "--expiration", String(expiration),
        "--metadata", JSON.stringify(requestMetadata(updated)),
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
    return updated;
  }

  async function deleteRequest(idValue) {
    const id = exactRequestId(idValue);
    // The canonical key and UUID are exact; never accept prefixes or wildcards.
    await show(id);
    await runWrangler(["kv", "key", "delete", `${AGENT_REQUEST_PREFIX}${id}`, ...REMOTE]);
    return { id, deleted: true };
  }

  return { list, show, status, delete: deleteRequest };
}

function help() {
  console.log(`Industry Next private agent request desk

Commands:
  npm run agent:intake -- list
  npm run agent:intake -- show <exact-receipt-uuid>
  npm run agent:intake -- status <exact-receipt-uuid> <new|reviewing|contacted|closed>
  npm run agent:intake -- delete <exact-receipt-uuid>

Uses the installed Wrangler and its authenticated session against INDUSTRY_NEXT_MADE.
List includes all remote pages, with non-personal metadata sorted newest first.
Show displays private submitted details locally. Protect terminal output accordingly.
Status changes preserve the original expiry; temporary private files are removed.
Use one operator at a time: KV updates are eventually consistent, not transactional.
There is no public inbox/read API. These commands do not send email.`);
}

export async function runIntake(args) {
  const [command = "help", ...values] = args;
  if (["help", "--help", "-h"].includes(command)) { help(); return; }
  const expected = { list: 0, show: 1, status: 2, delete: 1 };
  if (!(command in expected) || values.length !== expected[command]) throw new Error("Use agent:intake -- help for the exact command syntax.");
  const operator = createIntakeOperator();
  if (command === "list") {
    const rows = await operator.list();
    console.table(rows);
    if (!rows.length) console.log("No unexpired requests in the private inbox.");
  } else if (command === "show") {
    console.log(JSON.stringify(await operator.show(values[0]), null, 2));
  } else if (command === "status") {
    const record = await operator.status(...values);
    console.log(`Saved status ${record.status} for ${record.id}. Original expiry: ${record.retentionUntil}.`);
  } else {
    const result = await operator.delete(values[0]);
    console.log(`Deleted ${result.id}. Cached reads can take time to clear across regions.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await runIntake(process.argv.slice(2)); }
  catch (error) {
    console.error(error instanceof Error ? error.message : "The request desk operation failed.");
    process.exitCode = 1;
  }
}
