import {
  init_browser_shims
} from "./chunks/chunk-TF5QER46.js";

// src/desk.js
init_browser_shims();

// src/task-desk-core.js
init_browser_shims();
var TASK_STATUSES = ["inbox", "next", "doing", "review", "done"];
var STATUS_LABELS = {
  inbox: "Inbox",
  next: "Next",
  doing: "Doing",
  review: "Review",
  done: "Done"
};
var PRIORITY_WEIGHT = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3
};
var clean = (value, maxLength = 4e3) => String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, maxLength);
var cleanDate = (value) => {
  const next = clean(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(next) ? next : "";
};
function normalizeTask(task = {}) {
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
    notes: clean(task.notes, 4e3),
    acceptance: clean(task.acceptance, 1e3),
    createdAt,
    updatedAt
  };
}
function localDate(daysFromNow) {
  const date = /* @__PURE__ */ new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}
function createStarterTasks() {
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
      createdAt: now - 8e4,
      updatedAt: now - 8e4
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
      createdAt: now - 7e4,
      updatedAt: now - 6e4
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
      createdAt: now - 6e4,
      updatedAt: now - 4e4
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
      createdAt: now - 5e4,
      updatedAt: now - 2e4
    }
  ].map(normalizeTask);
}
function canonicalStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function taskSnapshot(task) {
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
    updatedAt: new Date(normalized.updatedAt).toISOString()
  };
}
async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : canonicalStringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function buildStampEnvelope(task, sealedAt = (/* @__PURE__ */ new Date()).toISOString()) {
  const snapshot = taskSnapshot(task);
  const taskHash = await sha256Hex(snapshot);
  const envelope = {
    protocol: "industrynext.tezos-task-stamp/v1",
    sealedAt,
    taskHash
  };
  const chainHash = await sha256Hex(envelope);
  return { snapshot, taskHash, envelope, chainHash };
}
async function verifyReceipt(receipt) {
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
function sortTasks(tasks) {
  return [...tasks].sort((left, right) => {
    const priority = PRIORITY_WEIGHT[left.priority] - PRIORITY_WEIGHT[right.priority];
    if (priority) return priority;
    if (left.due && right.due) return left.due.localeCompare(right.due);
    if (left.due) return -1;
    if (right.due) return 1;
    return right.updatedAt - left.updatedAt;
  });
}
function boardStats(tasks, receipts = []) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const stampedTaskIds = new Set(receipts.map((receipt) => receipt.taskId));
  return {
    total: tasks.length,
    active: tasks.filter((task) => task.status !== "done").length,
    doing: tasks.filter((task) => task.status === "doing").length,
    done: tasks.filter((task) => task.status === "done").length,
    overdue: tasks.filter((task) => task.status !== "done" && task.due && task.due < today).length,
    stamped: tasks.filter((task) => stampedTaskIds.has(task.id)).length
  };
}
function moveTask(task, direction) {
  const current = TASK_STATUSES.indexOf(task.status);
  const next = Math.min(TASK_STATUSES.length - 1, Math.max(0, current + direction));
  return normalizeTask({ ...task, status: TASK_STATUSES[next], updatedAt: Date.now() });
}

// src/desk.js
var STORAGE_KEY = "industrynext.desk.v1";
var TEZOS = {
  contract: "KT1AtaeG5PhuFyyivbfPZRUBkVMiqyxpo2cH",
  explorer: "https://tzkt.io",
  network: "mainnet",
  rpc: "https://tezos-mainnet.octez.io"
};
var elements = {
  assigneeFilter: document.querySelector("#assignee-filter"),
  assigneeOptions: document.querySelector("#assignee-options"),
  board: document.querySelector("#task-board"),
  clearFilters: document.querySelector("#clear-filters"),
  confirmStamp: document.querySelector("#confirm-stamp-button"),
  deleteTask: document.querySelector("#delete-task-button"),
  emptyState: document.querySelector("#empty-filter-state"),
  exportBoard: document.querySelector("#export-board-button"),
  importBoard: document.querySelector("#import-board-input"),
  newTask: document.querySelector("#new-task-button"),
  projectFilter: document.querySelector("#project-filter"),
  projectOptions: document.querySelector("#project-options"),
  quickAdd: document.querySelector("#quick-add-form"),
  receiptList: document.querySelector("#receipt-list"),
  savedStatus: document.querySelector("#board-saved-status"),
  searchFilter: document.querySelector("#search-filter"),
  stampDialog: document.querySelector("#stamp-dialog"),
  stampDialogStatus: document.querySelector("#stamp-dialog-status"),
  stampPreview: document.querySelector("#stamp-preview"),
  statGrid: document.querySelector("#stat-grid"),
  taskDialog: document.querySelector("#task-dialog"),
  taskDialogTitle: document.querySelector("#task-dialog-title"),
  taskForm: document.querySelector("#task-form"),
  taskTemplate: document.querySelector("#task-card-template"),
  walletAddress: document.querySelector("#wallet-address"),
  walletButton: document.querySelector("#wallet-button"),
  walletDisconnect: document.querySelector("#wallet-disconnect-button"),
  walletStatus: document.querySelector("#wallet-status")
};
var defaultState = () => ({
  tasks: createStarterTasks(),
  receipts: [],
  version: 1
});
function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.receipts)) return defaultState();
    return {
      tasks: parsed.tasks.map(normalizeTask),
      receipts: parsed.receipts.filter((receipt) => receipt && typeof receipt === "object").slice(0, 100),
      version: 1
    };
  } catch {
    return defaultState();
  }
}
var state = loadState();
var saveTimer;
var stampTargetId = "";
var preparedStamp = null;
var draggedTaskId = "";
var tezosSdkPromise;
var tezosToolkit;
var wallet;
var walletAddress = "";
var walletBusy = false;
function saveState(message = "Saved on this device.") {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  elements.savedStatus.textContent = message;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    elements.savedStatus.textContent = "Saved on this device.";
  }, 1800);
}
function currentFilters() {
  return {
    assignee: elements.assigneeFilter.value,
    project: elements.projectFilter.value,
    search: elements.searchFilter.value.trim().toLowerCase()
  };
}
function taskMatches(task, filters) {
  if (filters.project !== "all" && task.project !== filters.project) return false;
  if (filters.assignee !== "all" && task.assignee !== filters.assignee) return false;
  if (!filters.search) return true;
  return [task.title, task.project, task.assignee, task.notes, task.acceptance].join(" ").toLowerCase().includes(filters.search);
}
function uniqueValues(key) {
  return [...new Set(state.tasks.map((task) => task[key]).filter(Boolean))].sort((left, right) => left.localeCompare(right));
}
function refillSelect(select, firstLabel, values) {
  const current = select.value || "all";
  select.replaceChildren(new Option(firstLabel, "all"), ...values.map((value) => new Option(value, value)));
  select.value = values.includes(current) ? current : "all";
}
function refillDatalist(datalist, values) {
  datalist.replaceChildren(...values.map((value) => {
    const option = document.createElement("option");
    option.value = value;
    return option;
  }));
}
function renderFilterOptions() {
  const projects = uniqueValues("project");
  const assignees = uniqueValues("assignee");
  refillSelect(elements.projectFilter, "All projects", projects);
  refillSelect(elements.assigneeFilter, "Everyone", assignees);
  refillDatalist(elements.projectOptions, projects);
  refillDatalist(elements.assigneeOptions, assignees);
}
function renderStats() {
  const stats = boardStats(state.tasks, state.receipts);
  const data = [
    ["active", "Active", stats.active],
    ["doing", "Doing now", stats.doing],
    ["done", "Finished", stats.done],
    ["overdue", "Overdue", stats.overdue],
    ["stamped", "Stamped", stats.stamped],
    ["total", "All tasks", stats.total]
  ];
  elements.statGrid.replaceChildren(...data.map(([key, label, value]) => {
    const card = document.createElement("article");
    card.className = "stat-card";
    card.dataset.stat = key;
    const span = document.createElement("span");
    span.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    card.append(span, strong);
    return card;
  }));
}
function formatDue(value) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat(void 0, { month: "short", day: "numeric" }).format(/* @__PURE__ */ new Date(`${value}T12:00:00`));
}
function latestReceipt(taskId) {
  return state.receipts.find((receipt) => receipt.taskId === taskId) || null;
}
function updateTask(nextTask, message = "Task saved locally.") {
  state.tasks = state.tasks.map((task) => task.id === nextTask.id ? normalizeTask(nextTask) : task);
  saveState(message);
  render();
}
function createTaskCard(task) {
  const card = elements.taskTemplate.content.firstElementChild.cloneNode(true);
  const statusIndex = TASK_STATUSES.indexOf(task.status);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const receipt = latestReceipt(task.id);
  card.dataset.taskId = task.id;
  card.dataset.priority = task.priority;
  card.classList.toggle("is-stamped", Boolean(receipt));
  card.querySelector(".task-project").textContent = task.project;
  card.querySelector("h3").textContent = task.title;
  card.querySelector(".task-notes").textContent = task.notes;
  card.querySelector(".task-owner").textContent = task.assignee;
  card.querySelector(".task-effort").textContent = `${task.effort} effort`;
  const due = card.querySelector(".task-due");
  due.textContent = formatDue(task.due);
  due.classList.toggle("is-overdue", Boolean(task.due && task.due < today && task.status !== "done"));
  card.querySelector(".task-check").textContent = task.acceptance ? `\u2713 ${task.acceptance}` : "";
  card.querySelector(".move-left").disabled = statusIndex === 0;
  card.querySelector(".move-right").disabled = statusIndex === TASK_STATUSES.length - 1;
  const stamp = card.querySelector(".stamp-task");
  stamp.textContent = receipt ? "Stamped \u2713" : task.status === "done" ? "Stamp finish" : "Stamp version";
  stamp.setAttribute("aria-label", `${receipt ? "Stamp another version of" : "Stamp"} ${task.title}`);
  card.querySelector(".edit-task").addEventListener("click", () => openTaskDialog(task));
  card.querySelector(".move-left").addEventListener("click", () => updateTask(moveTask(task, -1), "Task moved left."));
  card.querySelector(".move-right").addEventListener("click", () => updateTask(moveTask(task, 1), "Task moved right."));
  stamp.addEventListener("click", () => openStampDialog(task));
  card.addEventListener("dragstart", () => {
    draggedTaskId = task.id;
    card.classList.add("is-dragging");
  });
  card.addEventListener("dragend", () => {
    draggedTaskId = "";
    card.classList.remove("is-dragging");
  });
  return card;
}
function createColumn(status, tasks) {
  const section = document.createElement("section");
  section.className = "task-column";
  section.dataset.status = status;
  section.innerHTML = `<header class="column-head"><h3>${STATUS_LABELS[status]}</h3><span class="column-count">${tasks.length}</span></header>`;
  const body = document.createElement("div");
  body.className = "column-body";
  body.dataset.dropStatus = status;
  if (tasks.length) body.append(...sortTasks(tasks).map(createTaskCard));
  else {
    const empty = document.createElement("p");
    empty.className = "column-empty";
    empty.textContent = status === "inbox" ? "Catch something before it disappears." : "Nothing parked here.";
    body.append(empty);
  }
  body.addEventListener("dragover", (event) => {
    event.preventDefault();
    section.classList.add("is-dragover");
  });
  body.addEventListener("dragleave", () => section.classList.remove("is-dragover"));
  body.addEventListener("drop", (event) => {
    event.preventDefault();
    section.classList.remove("is-dragover");
    const task = state.tasks.find((item) => item.id === draggedTaskId);
    if (!task || task.status === status) return;
    updateTask({ ...task, status, updatedAt: Date.now() }, `Task moved to ${STATUS_LABELS[status]}.`);
  });
  section.append(body);
  return section;
}
function renderBoard() {
  const filters = currentFilters();
  const visible = state.tasks.filter((task) => taskMatches(task, filters));
  elements.board.replaceChildren(...TASK_STATUSES.map((status) => createColumn(
    status,
    visible.filter((task) => task.status === status)
  )));
  elements.emptyState.hidden = visible.length > 0;
}
async function receiptMatchesCurrentTask(receipt) {
  const task = state.tasks.find((item) => item.id === receipt.taskId);
  if (!task) return false;
  return await sha256Hex(taskSnapshot(task)) === receipt.taskHash;
}
function downloadJson(filename, value) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}
`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
async function verifyLocalReceipt(receipt, output) {
  output.textContent = "Checking local hashes\u2026";
  const result = await verifyReceipt(receipt);
  if (!result.valid) {
    output.textContent = result.reason;
    return;
  }
  const current = await receiptMatchesCurrentTask(receipt);
  output.textContent = current ? "Valid receipt \xB7 current task still matches." : "Valid receipt \xB7 the task has changed since this stamp.";
}
function renderReceipts() {
  if (!state.receipts.length) {
    const empty = document.createElement("p");
    empty.className = "receipt-empty";
    empty.textContent = "No Tezos receipts yet. Finish something, stamp its fingerprint, then download the receipt that connects the private task to its public operation.";
    elements.receiptList.replaceChildren(empty);
    return;
  }
  const cards = state.receipts.slice(0, 12).map((receipt) => {
    const card = document.createElement("article");
    card.className = "receipt-card";
    const stateLabel = document.createElement("span");
    stateLabel.textContent = receipt.status === "confirmed" ? "CONFIRMED ON MAINNET" : "INJECTED TO MAINNET";
    const title = document.createElement("h3");
    title.textContent = receipt.snapshot?.title || "Stamped task";
    const hash = document.createElement("code");
    hash.textContent = receipt.chainHash;
    const meta = document.createElement("p");
    meta.className = "receipt-meta";
    meta.textContent = `${new Date(receipt.sealedAt).toLocaleString()} \xB7 ${receipt.walletAddress ? `${receipt.walletAddress.slice(0, 8)}\u2026${receipt.walletAddress.slice(-5)}` : "wallet"}`;
    const actions = document.createElement("div");
    actions.className = "receipt-actions";
    const explorer = document.createElement("a");
    explorer.href = `${TEZOS.explorer}/${receipt.opHash}`;
    explorer.target = "_blank";
    explorer.rel = "noreferrer";
    explorer.textContent = "Open chain \u2197";
    const download = document.createElement("button");
    download.type = "button";
    download.textContent = "Download";
    download.addEventListener("click", () => downloadJson(`industrynext-task-stamp-${receipt.taskId}.json`, receipt));
    const verify = document.createElement("button");
    verify.type = "button";
    verify.textContent = "Verify local";
    verify.addEventListener("click", () => verifyLocalReceipt(receipt, meta));
    actions.append(explorer, download, verify);
    card.append(stateLabel, title, hash, meta, actions);
    return card;
  });
  elements.receiptList.replaceChildren(...cards);
}
function render() {
  renderFilterOptions();
  renderStats();
  renderBoard();
  renderReceipts();
}
function openTaskDialog(task = null) {
  elements.taskForm.reset();
  const form = elements.taskForm.elements;
  elements.taskDialogTitle.textContent = task ? "Edit task" : "New task";
  elements.deleteTask.hidden = !task;
  form.id.value = task?.id || "";
  form.title.value = task?.title || "";
  form.project.value = task?.project || "Industry Next";
  form.assignee.value = task?.assignee || "Mike";
  form.status.value = task?.status || "inbox";
  form.priority.value = task?.priority || "normal";
  form.due.value = task?.due || "";
  form.effort.value = task?.effort || "M";
  form.notes.value = task?.notes || "";
  form.acceptance.value = task?.acceptance || "";
  elements.taskDialog.showModal();
  requestAnimationFrame(() => form.title.focus());
}
function taskFromForm() {
  const data = new FormData(elements.taskForm);
  const id = String(data.get("id") || "") || crypto.randomUUID();
  const previous = state.tasks.find((task) => task.id === id);
  return normalizeTask({
    id,
    title: data.get("title"),
    project: data.get("project"),
    assignee: data.get("assignee"),
    status: data.get("status"),
    priority: data.get("priority"),
    due: data.get("due"),
    effort: data.get("effort"),
    notes: data.get("notes"),
    acceptance: data.get("acceptance"),
    createdAt: previous?.createdAt || Date.now(),
    updatedAt: Date.now()
  });
}
async function openStampDialog(task) {
  stampTargetId = task.id;
  preparedStamp = null;
  elements.stampDialogStatus.textContent = "Preparing a private fingerprint\u2026";
  elements.confirmStamp.disabled = true;
  elements.stampPreview.replaceChildren();
  elements.stampDialog.showModal();
  try {
    preparedStamp = await buildStampEnvelope(task);
    const title = document.createElement("strong");
    title.textContent = task.title;
    const detail = document.createElement("span");
    detail.textContent = `${task.project} \xB7 ${task.assignee} \xB7 ${STATUS_LABELS[task.status]} \xB7 ${task.priority}`;
    const hash = document.createElement("span");
    hash.className = "stamp-hash-preview";
    hash.textContent = `PUBLIC FINGERPRINT ${preparedStamp.chainHash}`;
    elements.stampPreview.append(title, detail, hash);
    elements.stampDialogStatus.textContent = walletAddress ? "Ready. Your wallet will show one 0 \uA729 contract call plus the network fee." : "Connect a wallet in the next step. Nothing is sent without approval.";
    elements.confirmStamp.disabled = false;
  } catch (error) {
    elements.stampDialogStatus.textContent = error instanceof Error ? error.message : "Could not prepare this task.";
  }
}
function compactAddress(address) {
  return address ? `${address.slice(0, 9)}\u2026${address.slice(-6)}` : "No wallet connected";
}
function setWalletStatus(message) {
  elements.walletAddress.textContent = compactAddress(walletAddress);
  elements.walletStatus.textContent = message;
  elements.walletButton.textContent = walletBusy ? "Opening wallet\u2026" : walletAddress ? "Wallet connected \u2713" : "Connect wallet";
  elements.walletButton.disabled = walletBusy || Boolean(walletAddress);
  elements.walletDisconnect.hidden = !walletAddress;
  elements.walletDisconnect.disabled = walletBusy;
}
async function ensureTezos() {
  if (!tezosSdkPromise) {
    const tezosClientUrl = new URL("/tezos-client.js", window.location.origin);
    tezosSdkPromise = import(tezosClientUrl.toString());
  }
  const sdk = await tezosSdkPromise;
  if (!tezosToolkit) tezosToolkit = sdk.createTezosToolkit(TEZOS.rpc);
  if (!wallet) {
    wallet = sdk.createTezosWallet({
      name: "Industry Next / The Desk",
      description: "Stamp private task fingerprints on Tezos Mainnet.",
      iconUrl: `${window.location.origin}/favicon.svg`,
      network: { type: TEZOS.network, rpcUrl: TEZOS.rpc },
      preferredNetwork: TEZOS.network,
      colorMode: "light"
    });
    await wallet.client?.beaconIDB?.initDB?.().catch(() => {
    });
  }
  tezosToolkit.setWalletProvider(wallet);
  return { sdk, toolkit: tezosToolkit, wallet };
}
async function connectWallet() {
  if (walletAddress) return walletAddress;
  walletBusy = true;
  setWalletStatus("Opening the Tezos wallet chooser\u2026");
  try {
    const { sdk, wallet: activeWallet } = await ensureTezos();
    const activeAccount = await sdk.getActiveWalletAccount(activeWallet);
    if (activeAccount?.address) {
      walletAddress = activeAccount.address;
      tezosToolkit.setWalletProvider(activeWallet);
      setWalletStatus("Wallet restored. Every stamp still requires a separate approval.");
      return walletAddress;
    }
    await activeWallet.requestPermissions({
      network: { type: TEZOS.network, rpcUrl: TEZOS.rpc }
    });
    walletAddress = await activeWallet.getPKH();
    tezosToolkit.setWalletProvider(activeWallet);
    setWalletStatus("Connected to Mainnet. Review every stamp in your wallet.");
    return walletAddress;
  } catch (error) {
    walletAddress = "";
    const message = error instanceof Error && /abort|cancel|reject|closed|declin/i.test(error.message) ? "Wallet connection was canceled." : "The wallet could not connect. Check the wallet window and try again.";
    setWalletStatus(message);
    throw error;
  } finally {
    walletBusy = false;
    setWalletStatus(walletAddress ? "Connected to Mainnet. Review every stamp in your wallet." : elements.walletStatus.textContent);
  }
}
async function disconnectWallet() {
  walletBusy = true;
  setWalletStatus("Disconnecting\u2026");
  try {
    const sdk = await tezosSdkPromise;
    if (sdk && wallet) await sdk.disconnectTezosWallet(wallet);
  } finally {
    wallet = void 0;
    walletAddress = "";
    walletBusy = false;
    setWalletStatus("Wallet disconnected. Your local board is unchanged.");
  }
}
async function confirmStamp() {
  const task = state.tasks.find((item) => item.id === stampTargetId);
  if (!task || !preparedStamp) return;
  elements.confirmStamp.disabled = true;
  elements.stampDialogStatus.textContent = walletAddress ? "Building the Mainnet contract call\u2026" : "Choose a wallet and approve the connection\u2026";
  try {
    const address = await connectWallet();
    const { toolkit } = await ensureTezos();
    elements.stampDialogStatus.textContent = "Approve one 0 \uA729 TzStamp contract call in your wallet. A network fee applies.";
    const contract = await toolkit.wallet.at(TEZOS.contract);
    const operation = await contract.methods.default(preparedStamp.chainHash).send();
    const receipt = {
      schema: "industrynext.tezos-task-receipt/v1",
      taskId: task.id,
      sealedAt: preparedStamp.envelope.sealedAt,
      snapshot: preparedStamp.snapshot,
      taskHash: preparedStamp.taskHash,
      envelope: preparedStamp.envelope,
      chainHash: preparedStamp.chainHash,
      network: TEZOS.network,
      contract: TEZOS.contract,
      entrypoint: "default",
      amountTez: 0,
      walletAddress: address,
      opHash: operation.opHash,
      explorerUrl: `${TEZOS.explorer}/${operation.opHash}`,
      status: "injected"
    };
    state.receipts.unshift(receipt);
    saveState("Stamp injected to Tezos Mainnet.");
    render();
    elements.stampDialogStatus.innerHTML = 'Injected. <a href="' + receipt.explorerUrl + '" target="_blank" rel="noreferrer">Open the operation \u2197</a>';
    try {
      await operation.confirmation(1);
      receipt.status = "confirmed";
      receipt.confirmedAt = (/* @__PURE__ */ new Date()).toISOString();
      saveState("Stamp confirmed on Tezos Mainnet.");
      render();
      elements.stampDialogStatus.innerHTML = 'Confirmed on Mainnet. <a href="' + receipt.explorerUrl + '" target="_blank" rel="noreferrer">Open the receipt \u2197</a>';
    } catch {
      elements.stampDialogStatus.textContent = "The operation was injected. Confirmation is still pending; use the receipt shelf to check it.";
    }
  } catch (error) {
    const canceled = error instanceof Error && /abort|cancel|reject|closed|declin/i.test(error.message);
    elements.stampDialogStatus.textContent = canceled ? "Nothing was stamped. The wallet request was canceled." : "Nothing was stamped. The wallet or Mainnet request did not complete.";
  } finally {
    elements.confirmStamp.disabled = false;
  }
}
function exportBoard() {
  downloadJson(`industrynext-desk-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, {
    schema: "industrynext.task-board/v1",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    tasks: state.tasks,
    receipts: state.receipts
  });
  saveState("Board exported. Keep the file somewhere intentional.");
}
async function importBoard(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed.tasks)) throw new Error("That file does not contain a task board.");
    const nextTasks = parsed.tasks.map(normalizeTask).slice(0, 500);
    const nextReceipts = Array.isArray(parsed.receipts) ? parsed.receipts.slice(0, 100) : [];
    if (!confirm(`Replace this device's ${state.tasks.length} tasks with ${nextTasks.length} imported tasks?`)) return;
    state = { tasks: nextTasks, receipts: nextReceipts, version: 1 };
    saveState("Imported board saved locally.");
    render();
  } catch (error) {
    elements.savedStatus.textContent = error instanceof Error ? error.message : "That board could not be imported.";
  } finally {
    elements.importBoard.value = "";
  }
}
elements.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!elements.taskForm.reportValidity()) return;
  const task = taskFromForm();
  const exists = state.tasks.some((item) => item.id === task.id);
  state.tasks = exists ? state.tasks.map((item) => item.id === task.id ? task : item) : [task, ...state.tasks];
  saveState(exists ? "Task updated locally." : "Task added to the inbox.");
  elements.taskDialog.close();
  render();
});
elements.deleteTask.addEventListener("click", () => {
  const id = String(elements.taskForm.elements.id.value || "");
  const task = state.tasks.find((item) => item.id === id);
  if (!task || !confirm(`Delete \u201C${task.title}\u201D from this device? Its downloaded and on-chain receipts will not be deleted.`)) return;
  state.tasks = state.tasks.filter((item) => item.id !== id);
  saveState("Task deleted from this device.");
  elements.taskDialog.close();
  render();
});
elements.quickAdd.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(elements.quickAdd);
  const task = normalizeTask({
    id: crypto.randomUUID(),
    title: data.get("title"),
    assignee: data.get("assignee") || "Unassigned",
    project: elements.projectFilter.value !== "all" ? elements.projectFilter.value : "Industry Next",
    priority: data.get("priority"),
    status: "inbox",
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  state.tasks.unshift(task);
  elements.quickAdd.reset();
  saveState("Task caught in the inbox.");
  render();
});
elements.newTask.addEventListener("click", () => openTaskDialog());
elements.exportBoard.addEventListener("click", exportBoard);
elements.importBoard.addEventListener("change", () => {
  const [file] = elements.importBoard.files || [];
  if (file) importBoard(file);
});
elements.searchFilter.addEventListener("input", renderBoard);
elements.projectFilter.addEventListener("change", renderBoard);
elements.assigneeFilter.addEventListener("change", renderBoard);
elements.clearFilters.addEventListener("click", () => {
  elements.searchFilter.value = "";
  elements.projectFilter.value = "all";
  elements.assigneeFilter.value = "all";
  renderBoard();
});
elements.walletButton.addEventListener("click", () => connectWallet().catch(() => {
}));
elements.walletDisconnect.addEventListener("click", () => disconnectWallet());
elements.confirmStamp.addEventListener("click", confirmStamp);
render();
