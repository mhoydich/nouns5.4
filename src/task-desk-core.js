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

const cleanTags = (value) => {
  const values = Array.isArray(value) ? value : String(value ?? "").split(",");
  return [...new Set(values.map((tag) => clean(tag, 24).toLowerCase()).filter(Boolean))].slice(0, 8);
};

const cleanChecklist = (value) => (Array.isArray(value) ? value : [])
  .map((item, index) => ({
    id: clean(item?.id, 80) || `check-${index}-${crypto.randomUUID()}`,
    text: clean(typeof item === "string" ? item : item?.text, 180),
    done: Boolean(typeof item === "object" && item?.done),
  }))
  .filter((item) => item.text)
  .slice(0, 20);

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
    blockedReason: clean(task.blockedReason, 500),
    tags: cleanTags(task.tags),
    checklist: cleanChecklist(task.checklist),
    createdAt,
    updatedAt,
  };
}

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return dateKey(date);
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

export const TASK_TEMPLATES = [
  {
    id: "ship-release",
    label: "Ship a release",
    title: "Ship and verify the next public release",
    project: "Industry Next",
    priority: "high",
    effort: "M",
    notes: "Keep the authored idea intact. Publish the exact intended surface, then verify the canonical route and its public proof.",
    acceptance: "The canonical route, share image, machine twin, and primary interaction have each been checked.",
    dueOffset: 2,
    tags: ["release", "public-proof"],
    checklist: [
      "Confirm the accountable lead and final call",
      "Build and test the intended surface",
      "Publish the exact release",
      "Verify the canonical route on phone and desktop",
      "Leave a public receipt",
    ],
  },
  {
    id: "run-outreach",
    label: "Run outreach",
    title: "Send the next evidence-led outreach round",
    project: "Industry Next",
    priority: "normal",
    effort: "M",
    notes: "Keep the list small, named, and relevant. Lead with the useful proof instead of a broad pitch.",
    acceptance: "Every message has a clear recipient, one relevant proof, and a bounded next step.",
    dueOffset: 3,
    tags: ["outreach", "growth"],
    checklist: [
      "Name the audience and qualification rule",
      "Choose the proof worth sending",
      "Write the short note",
      "Send the bounded round",
      "Record replies and the next decision",
    ],
  },
  {
    id: "review-surface",
    label: "Review a surface",
    title: "Review the live surface as a visitor",
    project: "Industry Next",
    priority: "normal",
    effort: "S",
    notes: "Approach it cold. Check whether the first touch, useful action, and return path make sense before reading instructions.",
    acceptance: "The lead has a concise continue, repair, or close recommendation backed by direct checks.",
    dueOffset: 1,
    tags: ["review", "quality"],
    checklist: [
      "Open the canonical route cold",
      "Check the primary action on a phone",
      "Check the primary action on desktop",
      "Test important links and assets",
      "Write the recommendation",
    ],
  },
  {
    id: "leave-receipt",
    label: "Leave a receipt",
    title: "Leave a verifiable receipt for finished work",
    project: "Industry Next",
    priority: "normal",
    effort: "S",
    notes: "Say what shipped, where it lives, who made the consequential call, and how another person can check it.",
    acceptance: "A stranger can independently find and verify the result.",
    dueOffset: 0,
    tags: ["receipt", "public-proof"],
    checklist: [
      "Name the shipped object",
      "Link the canonical location",
      "Record the verification checks",
      "Download or stamp the final receipt",
    ],
  },
];

export function createTaskFromTemplate(templateId, overrides = {}) {
  const template = TASK_TEMPLATES.find((item) => item.id === templateId);
  if (!template) throw new Error("Unknown task ritual.");
  const now = Date.now();
  const due = new Date();
  due.setDate(due.getDate() + template.dueOffset);
  return normalizeTask({
    ...template,
    id: crypto.randomUUID(),
    assignee: "Unassigned",
    status: "inbox",
    due: dateKey(due),
    checklist: template.checklist.map((text) => ({ id: crypto.randomUUID(), text, done: false })),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
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
  const snapshot = {
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
  if (normalized.blockedReason) snapshot.blockedReason = normalized.blockedReason;
  if (normalized.tags.length) snapshot.tags = normalized.tags;
  if (normalized.checklist.length) {
    snapshot.checklist = normalized.checklist.map(({ text, done }) => ({ text, done }));
  }
  return snapshot;
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
  const today = dateKey();
  const stampedTaskIds = new Set(receipts.map((receipt) => receipt.taskId));
  return {
    total: tasks.length,
    active: tasks.filter((task) => task.status !== "done").length,
    doing: tasks.filter((task) => task.status === "doing").length,
    done: tasks.filter((task) => task.status === "done").length,
    overdue: tasks.filter((task) => task.status !== "done" && task.due && task.due < today).length,
    dueToday: tasks.filter((task) => task.status !== "done" && task.due === today).length,
    blocked: tasks.filter((task) => task.status !== "done" && task.blockedReason).length,
    unassigned: tasks.filter((task) => task.status !== "done" && task.assignee.toLowerCase() === "unassigned").length,
    stamped: tasks.filter((task) => stampedTaskIds.has(task.id)).length,
  };
}

export function managerBrief(tasks, today = dateKey()) {
  const active = sortTasks(tasks.filter((task) => task.status !== "done"));
  const take = (predicate) => active.filter(predicate);
  return {
    due: take((task) => Boolean(task.due && task.due <= today)),
    blocked: take((task) => Boolean(task.blockedReason)),
    unassigned: take((task) => task.assignee.toLowerCase() === "unassigned"),
    review: take((task) => task.status === "review"),
  };
}

export function ownerLoad(tasks) {
  const owners = new Map();
  for (const task of tasks.filter((item) => item.status !== "done")) {
    const current = owners.get(task.assignee) || { owner: task.assignee, active: 0, doing: 0, review: 0 };
    current.active += 1;
    if (task.status === "doing") current.doing += 1;
    if (task.status === "review") current.review += 1;
    owners.set(task.assignee, current);
  }
  return [...owners.values()].sort((left, right) => right.active - left.active || left.owner.localeCompare(right.owner));
}

export function taskMarkdown(task) {
  const normalized = normalizeTask(task);
  const lines = [
    `# ${normalized.title}`,
    "",
    `- Project: ${normalized.project}`,
    `- Owner: ${normalized.assignee}`,
    `- Status: ${STATUS_LABELS[normalized.status]}`,
    `- Priority: ${normalized.priority}`,
    `- Due: ${normalized.due || "Not set"}`,
    `- Effort: ${normalized.effort}`,
  ];
  if (normalized.tags.length) lines.push(`- Tags: ${normalized.tags.map((tag) => `#${tag}`).join(" ")}`);
  if (normalized.blockedReason) lines.push(`- Blocked by: ${normalized.blockedReason}`);
  if (normalized.notes) lines.push("", "## Context", "", normalized.notes);
  if (normalized.checklist.length) {
    lines.push("", "## Checklist", "", ...normalized.checklist.map((item) => `- [${item.done ? "x" : " "}] ${item.text}`));
  }
  if (normalized.acceptance) lines.push("", "## Done looks like", "", normalized.acceptance);
  lines.push("", `Desk ID: ${normalized.id}`, "");
  return lines.join("\n");
}

export function moveTask(task, direction) {
  const current = TASK_STATUSES.indexOf(task.status);
  const next = Math.min(TASK_STATUSES.length - 1, Math.max(0, current + direction));
  return normalizeTask({ ...task, status: TASK_STATUSES[next], updatedAt: Date.now() });
}
