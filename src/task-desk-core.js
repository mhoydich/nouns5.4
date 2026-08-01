export const TASK_STATUSES = ["inbox", "next", "doing", "review", "done"];

export const STATUS_LABELS = {
  inbox: "Inbox",
  next: "Next",
  doing: "Doing",
  review: "Review",
  done: "Done",
};

export const PRIORITY_WEIGHT = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const clean = (value, maxLength = 4000) => String(value ?? "")
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
  .trim()
  .slice(0, maxLength);

const cleanDate = (value) => {
  const next = clean(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(next) ? next : "";
};

export function normalizeTask(task = {}) {
  const createdAt = Number.isFinite(Number(task.createdAt)) ? Number(task.createdAt) : Date.now();
  const updatedAt = Number.isFinite(Number(task.updatedAt)) ? Number(task.updatedAt) : createdAt;
  const status = TASK_STATUSES.includes(task.status) ? task.status : "inbox";
  const priority = Object.hasOwn(PRIORITY_WEIGHT, task.priority) ? task.priority : "normal";

  return {
    id: clean(task.id, 80) || crypto.randomUUID(),
    title: clean(task.title, 140) || "Untitled task",
    project: clean(task.project, 60) || "Industry Next",
    assignee: clean(task.assignee, 48) || "Unassigned",
    status,
    priority,
    due: cleanDate(task.due),
    effort: ["S", "M", "L"].includes(task.effort) ? task.effort : "M",
    notes: clean(task.notes, 4000),
    acceptance: clean(task.acceptance, 1000),
    createdAt,
    updatedAt,
  };
}

function localDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

export function createStarterTasks() {
  const now = Date.now();
  return [
    {
      id: "welcome-write-the-brief",
      title: "Write the next small brief",
      project: "Industry Next",
      assignee: "Mike",
      status: "next",
      priority: "high",
      due: localDate(1),
      effort: "S",
      notes: "Name the person, the useful object, and what counts as shipped.",
      acceptance: "The brief can be acted on without a meeting.",
      createdAt: now - 80_000,
      updatedAt: now - 80_000,
    },
    {
      id: "welcome-open-the-door",
      title: "Choose one public door to open",
      project: "PointCast",
      assignee: "Mike",
      status: "doing",
      priority: "urgent",
      due: localDate(0),
      effort: "M",
      notes: "Keep the surface concrete: a page, room, instrument, or receipt.",
      acceptance: "The canonical route works on phone and desktop.",
      createdAt: now - 70_000,
      updatedAt: now - 60_000,
    },
    {
      id: "welcome-listen-on-phone",
      title: "Listen once on a phone",
      project: "Tone Bloom",
      assignee: "Mike",
      status: "review",
      priority: "normal",
      due: localDate(2),
      effort: "S",
      notes: "Check first touch, sound start, return path, and one-handed reach.",
      acceptance: "The room makes sense before any instruction is read.",
      createdAt: now - 60_000,
      updatedAt: now - 40_000,
    },
    {
      id: "welcome-leave-a-receipt",
      title: "Leave a receipt for the finished work",
      project: "Industry Next",
      assignee: "Mike",
      status: "done",
      priority: "normal",
      due: localDate(-1),
      effort: "S",
      notes: "A receipt should say what shipped, where it lives, and how it was checked.",
      acceptance: "A stranger can independently find the result.",
      createdAt: now - 50_000,
      updatedAt: now - 20_000,
    },
  ].map(normalizeTask);
}

export function canonicalStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function taskSnapshot(task) {
  const normalized = normalizeTask(task);
  return {
    acceptance: normalized.acceptance,
    assignee: normalized.assignee,
    createdAt: new Date(normalized.createdAt).toISOString(),
    due: normalized.due || null,
    effort: normalized.effort,
    id: normalized.id,
    notes: normalized.notes,
    priority: normalized.priority,
    project: normalized.project,
    schema: "industrynext.task/v1",
    status: normalized.status,
    title: normalized.title,
    updatedAt: new Date(normalized.updatedAt).toISOString(),
  };
}

export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : canonicalStringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function buildStampEnvelope(task, sealedAt = new Date().toISOString()) {
  const snapshot = taskSnapshot(task);
  const taskHash = await sha256Hex(snapshot);
  const envelope = {
    protocol: "industrynext.tezos-task-stamp/v1",
    sealedAt,
    taskHash,
  };
  const chainHash = await sha256Hex(envelope);
  return { snapshot, taskHash, envelope, chainHash };
}

export async function verifyReceipt(receipt) {
  if (!receipt?.snapshot || !receipt?.envelope || !receipt?.taskHash || !receipt?.chainHash) {
    return { valid: false, reason: "The receipt is incomplete." };
  }
  const taskHash = await sha256Hex(receipt.snapshot);
  const chainHash = await sha256Hex(receipt.envelope);
  if (taskHash !== receipt.taskHash || receipt.envelope.taskHash !== receipt.taskHash) {
    return { valid: false, reason: "The task snapshot no longer matches its receipt." };
  }
  if (chainHash !== receipt.chainHash) {
    return { valid: false, reason: "The Tezos payload no longer matches its receipt." };
  }
  return { valid: true, reason: "The snapshot and Tezos payload hashes match." };
}

export function sortTasks(tasks) {
  return [...tasks].sort((left, right) => {
    const priority = PRIORITY_WEIGHT[left.priority] - PRIORITY_WEIGHT[right.priority];
    if (priority) return priority;
    if (left.due && right.due) return left.due.localeCompare(right.due);
    if (left.due) return -1;
    if (right.due) return 1;
    return right.updatedAt - left.updatedAt;
  });
}

export function boardStats(tasks, receipts = []) {
  const today = new Date().toISOString().slice(0, 10);
  const stampedTaskIds = new Set(receipts.map((receipt) => receipt.taskId));
  return {
    total: tasks.length,
    active: tasks.filter((task) => task.status !== "done").length,
    doing: tasks.filter((task) => task.status === "doing").length,
    done: tasks.filter((task) => task.status === "done").length,
    overdue: tasks.filter((task) => task.status !== "done" && task.due && task.due < today).length,
    stamped: tasks.filter((task) => stampedTaskIds.has(task.id)).length,
  };
}

export function moveTask(task, direction) {
  const current = TASK_STATUSES.indexOf(task.status);
  const next = Math.min(TASK_STATUSES.length - 1, Math.max(0, current + direction));
  return normalizeTask({ ...task, status: TASK_STATUSES[next], updatedAt: Date.now() });
}
