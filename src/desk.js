import {
  STATUS_LABELS,
  TASK_TEMPLATES,
  TASK_STATUSES,
  boardStats,
  buildStampEnvelope,
  createStarterTasks,
  createTaskFromTemplate,
  managerBrief,
  moveTask,
  normalizeTask,
  ownerLoad,
  sha256Hex,
  sortTasks,
  taskMarkdown,
  taskSnapshot,
  verifyReceipt,
} from "./task-desk-core.js";

const STORAGE_KEY = "industrynext.desk.v1";
const TEZOS = {
  contract: "KT1AtaeG5PhuFyyivbfPZRUBkVMiqyxpo2cH",
  explorer: "https://tzkt.io",
  network: "mainnet",
  rpc: "https://tezos-mainnet.octez.io",
};

const elements = {
  assigneeFilter: document.querySelector("#assignee-filter"),
  assigneeOptions: document.querySelector("#assignee-options"),
  board: document.querySelector("#task-board"),
  clearFilters: document.querySelector("#clear-filters"),
  confirmStamp: document.querySelector("#confirm-stamp-button"),
  copyBrief: document.querySelector("#copy-brief-button"),
  deleteTask: document.querySelector("#delete-task-button"),
  duplicateTask: document.querySelector("#duplicate-task-button"),
  emptyState: document.querySelector("#empty-filter-state"),
  exportBoard: document.querySelector("#export-board-button"),
  importBoard: document.querySelector("#import-board-input"),
  managerBrief: document.querySelector("#manager-brief-grid"),
  newTask: document.querySelector("#new-task-button"),
  ownerLoad: document.querySelector("#owner-load-list"),
  projectFilter: document.querySelector("#project-filter"),
  projectOptions: document.querySelector("#project-options"),
  quickAdd: document.querySelector("#quick-add-form"),
  receiptList: document.querySelector("#receipt-list"),
  ritualList: document.querySelector("#ritual-list"),
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
  walletStatus: document.querySelector("#wallet-status"),
};

const defaultState = () => ({
  tasks: createStarterTasks(),
  receipts: [],
  version: 2,
});

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.receipts)) return defaultState();
    return {
      tasks: parsed.tasks.map(normalizeTask),
      receipts: parsed.receipts.filter((receipt) => receipt && typeof receipt === "object").slice(0, 100),
      version: 2,
    };
  } catch {
    return defaultState();
  }
}

let state = loadState();
let saveTimer;
let stampTargetId = "";
let preparedStamp = null;
let draggedTaskId = "";
let tezosSdkPromise;
let tezosToolkit;
let wallet;
let walletAddress = "";
let walletBusy = false;

function saveState(message = "Saved on this device.") {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  elements.savedStatus.textContent = message;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    elements.savedStatus.textContent = "Saved on this device.";
  }, 1800);
}

function escapeText(value) {
  return String(value ?? "");
}

function currentFilters() {
  return {
    assignee: elements.assigneeFilter.value,
    project: elements.projectFilter.value,
    search: elements.searchFilter.value.trim().toLowerCase(),
  };
}

function taskMatches(task, filters) {
  if (filters.project !== "all" && task.project !== filters.project) return false;
  if (filters.assignee !== "all" && task.assignee !== filters.assignee) return false;
  if (!filters.search) return true;
  return [
    task.title,
    task.project,
    task.assignee,
    task.notes,
    task.acceptance,
    task.blockedReason,
    task.tags.join(" "),
    task.checklist.map((item) => item.text).join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .includes(filters.search);
}

function uniqueValues(key) {
  return [...new Set(state.tasks.map((task) => task[key]).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
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
    ["overdue", "Due now", stats.overdue + stats.dueToday],
    ["blocked", "Blocked", stats.blocked],
    ["unassigned", "Unassigned", stats.unassigned],
    ["stamped", "Stamped", stats.stamped],
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

function renderManagerBrief() {
  const brief = managerBrief(state.tasks);
  const lanes = [
    ["DO", brief.due, "Nothing due now."],
    ["UNBLOCK", brief.blocked, "No blockers named."],
    ["ASSIGN", brief.unassigned, "Every active task has an owner."],
    ["CLOSE", brief.review, "Nothing waiting for a call."],
  ];
  elements.managerBrief.replaceChildren(...lanes.map(([label, tasks, emptyLabel]) => {
    const lane = document.createElement("section");
    lane.className = "brief-lane";
    const header = document.createElement("header");
    const title = document.createElement("h4");
    title.textContent = label;
    const count = document.createElement("span");
    count.textContent = tasks.length;
    header.append(title, count);
    lane.append(header);
    if (!tasks.length) {
      const empty = document.createElement("p");
      empty.className = "brief-empty";
      empty.textContent = emptyLabel;
      lane.append(empty);
    } else {
      lane.append(...tasks.slice(0, 4).map((task) => {
        const button = document.createElement("button");
        button.className = "brief-task";
        button.type = "button";
        button.textContent = task.title;
        button.addEventListener("click", () => openTaskDialog(task));
        return button;
      }));
    }
    return lane;
  }));

  const loads = ownerLoad(state.tasks);
  if (!loads.length) {
    const empty = document.createElement("p");
    empty.className = "owner-empty";
    empty.textContent = "No active tasks yet.";
    elements.ownerLoad.replaceChildren(empty);
    return;
  }
  elements.ownerLoad.replaceChildren(...loads.map((load) => {
    const row = document.createElement("div");
    row.className = "owner-row";
    row.dataset.owner = load.owner.toLowerCase();
    const owner = document.createElement("strong");
    owner.textContent = load.owner;
    const detail = document.createElement("span");
    detail.textContent = `${load.active} active · ${load.doing} doing · ${load.review} review`;
    row.append(owner, detail);
    return row;
  }));
}

function renderRituals() {
  elements.ritualList.replaceChildren(...TASK_TEMPLATES.map((template, index) => {
    const button = document.createElement("button");
    button.className = "ritual-button";
    button.type = "button";
    const number = document.createElement("span");
    number.textContent = `RITUAL 0${index + 1}`;
    button.append(number, document.createTextNode(template.label));
    button.addEventListener("click", () => openTaskDialog(createTaskFromTemplate(template.id), { newTask: true }));
    return button;
  }));
}

function formatDue(value) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
    .format(new Date(`${value}T12:00:00`));
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
  const today = todayKey();
  const receipt = latestReceipt(task.id);
  card.dataset.taskId = task.id;
  card.dataset.priority = task.priority;
  card.classList.toggle("is-stamped", Boolean(receipt));
  card.classList.toggle("is-blocked", Boolean(task.blockedReason));
  card.querySelector(".task-project").textContent = task.project;
  card.querySelector("h3").textContent = task.title;
  card.querySelector(".task-blocker").textContent = task.blockedReason ? `BLOCKED · ${task.blockedReason}` : "";
  card.querySelector(".task-notes").textContent = task.notes;
  card.querySelector(".task-owner").textContent = task.assignee;
  card.querySelector(".task-effort").textContent = `${task.effort} effort`;
  const due = card.querySelector(".task-due");
  due.textContent = formatDue(task.due);
  due.classList.toggle("is-overdue", Boolean(task.due && task.due < today && task.status !== "done"));
  const tags = card.querySelector(".task-tags");
  tags.append(...task.tags.map((tag) => {
    const item = document.createElement("span");
    item.textContent = `#${tag}`;
    return item;
  }));
  const checklist = card.querySelector(".task-checklist");
  const visibleChecks = task.checklist.slice(0, 5);
  checklist.append(...visibleChecks.map((item) => {
    const button = document.createElement("button");
    button.className = "checklist-item";
    button.classList.toggle("is-done", item.done);
    button.type = "button";
    button.textContent = item.text;
    button.setAttribute("aria-pressed", String(item.done));
    button.addEventListener("click", () => updateTask({
      ...task,
      checklist: task.checklist.map((check) => check.id === item.id ? { ...check, done: !check.done } : check),
      updatedAt: Date.now(),
    }, item.done ? "Checklist item reopened." : "Checklist item finished."));
    return button;
  }));
  if (task.checklist.length) {
    const progress = document.createElement("p");
    progress.className = "checklist-progress";
    progress.textContent = `${task.checklist.filter((item) => item.done).length}/${task.checklist.length} checks${task.checklist.length > visibleChecks.length ? " · open task for all" : ""}`;
    checklist.append(progress);
  }
  card.querySelector(".task-check").textContent = task.acceptance ? `✓ ${task.acceptance}` : "";
  card.querySelector(".move-left").disabled = statusIndex === 0;
  card.querySelector(".move-right").disabled = statusIndex === TASK_STATUSES.length - 1;
  const stamp = card.querySelector(".stamp-task");
  stamp.textContent = receipt ? "Stamped ✓" : task.status === "done" ? "Stamp finish" : "Stamp version";
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
    visible.filter((task) => task.status === status),
  )));
  elements.emptyState.hidden = visible.length > 0;
}

async function receiptMatchesCurrentTask(receipt) {
  const task = state.tasks.find((item) => item.id === receipt.taskId);
  if (!task) return false;
  return await sha256Hex(taskSnapshot(task)) === receipt.taskHash;
}

function downloadJson(filename, value) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadMarkdown(filename, value) {
  const blob = new Blob([value], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function taskFilename(task) {
  const slug = task.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "task";
  return `${slug}-handoff.md`;
}

async function copyTaskBrief(task) {
  const markdown = taskMarkdown(task);
  try {
    await navigator.clipboard.writeText(markdown);
    saveState("Task handoff copied as Markdown.");
  } catch {
    downloadMarkdown(taskFilename(task), markdown);
    saveState("Clipboard unavailable. Markdown handoff downloaded.");
  }
}

async function verifyLocalReceipt(receipt, output) {
  output.textContent = "Checking local hashes…";
  const result = await verifyReceipt(receipt);
  if (!result.valid) {
    output.textContent = result.reason;
    return;
  }
  const current = await receiptMatchesCurrentTask(receipt);
  output.textContent = current
    ? "Valid receipt · current task still matches."
    : "Valid receipt · the task has changed since this stamp.";
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
    meta.textContent = `${new Date(receipt.sealedAt).toLocaleString()} · ${receipt.walletAddress ? `${receipt.walletAddress.slice(0, 8)}…${receipt.walletAddress.slice(-5)}` : "wallet"}`;
    const actions = document.createElement("div");
    actions.className = "receipt-actions";
    const explorer = document.createElement("a");
    explorer.href = `${TEZOS.explorer}/${receipt.opHash}`;
    explorer.target = "_blank";
    explorer.rel = "noreferrer";
    explorer.textContent = "Open chain ↗";
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
  renderManagerBrief();
  renderRituals();
  renderBoard();
  renderReceipts();
}

function checklistText(items = []) {
  return items.map((item) => `${item.done ? "[x]" : "[ ]"} ${item.text}`).join("\n");
}

function openTaskDialog(task = null, options = {}) {
  elements.taskForm.reset();
  const form = elements.taskForm.elements;
  const isNew = !task || options.newTask;
  elements.taskDialogTitle.textContent = options.newTask ? "New ritual" : task ? "Edit task" : "New task";
  elements.deleteTask.hidden = isNew;
  elements.duplicateTask.hidden = isNew;
  elements.copyBrief.hidden = isNew;
  form.id.value = isNew ? "" : task.id;
  form.title.value = task?.title || "";
  form.project.value = task?.project || "Industry Next";
  form.assignee.value = task?.assignee || "Mike";
  form.status.value = task?.status || "inbox";
  form.priority.value = task?.priority || "normal";
  form.due.value = task?.due || "";
  form.effort.value = task?.effort || "M";
  form.blockedReason.value = task?.blockedReason || "";
  form.tags.value = task?.tags?.join(", ") || "";
  form.notes.value = task?.notes || "";
  form.checklist.value = checklistText(task?.checklist);
  form.acceptance.value = task?.acceptance || "";
  elements.taskDialog.showModal();
  requestAnimationFrame(() => form.title.focus());
}

function parseChecklist(value, previousItems = []) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((line) => {
      const match = line.match(/^\[(x| )\]\s*(.+)$/i);
      const text = (match?.[2] || line).trim().slice(0, 180);
      const previous = previousItems.find((item) => item.text === text);
      return {
        id: previous?.id || crypto.randomUUID(),
        text,
        done: match ? match[1].toLowerCase() === "x" : Boolean(previous?.done),
      };
    });
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
    blockedReason: data.get("blockedReason"),
    tags: data.get("tags"),
    notes: data.get("notes"),
    checklist: parseChecklist(data.get("checklist"), previous?.checklist),
    acceptance: data.get("acceptance"),
    createdAt: previous?.createdAt || Date.now(),
    updatedAt: Date.now(),
  });
}

async function openStampDialog(task) {
  stampTargetId = task.id;
  preparedStamp = null;
  elements.stampDialogStatus.textContent = "Preparing a private fingerprint…";
  elements.confirmStamp.disabled = true;
  elements.stampPreview.replaceChildren();
  elements.stampDialog.showModal();
  try {
    preparedStamp = await buildStampEnvelope(task);
    const title = document.createElement("strong");
    title.textContent = task.title;
    const detail = document.createElement("span");
    detail.textContent = `${task.project} · ${task.assignee} · ${STATUS_LABELS[task.status]} · ${task.priority}`;
    const hash = document.createElement("span");
    hash.className = "stamp-hash-preview";
    hash.textContent = `PUBLIC FINGERPRINT ${preparedStamp.chainHash}`;
    elements.stampPreview.append(title, detail, hash);
    elements.stampDialogStatus.textContent = walletAddress
      ? "Ready. Your wallet will show one 0 ꜩ contract call plus the network fee."
      : "Connect a wallet in the next step. Nothing is sent without approval.";
    elements.confirmStamp.disabled = false;
  } catch (error) {
    elements.stampDialogStatus.textContent = error instanceof Error ? error.message : "Could not prepare this task.";
  }
}

function compactAddress(address) {
  return address ? `${address.slice(0, 9)}…${address.slice(-6)}` : "No wallet connected";
}

function setWalletStatus(message) {
  elements.walletAddress.textContent = compactAddress(walletAddress);
  elements.walletStatus.textContent = message;
  elements.walletButton.textContent = walletBusy ? "Opening wallet…" : walletAddress ? "Wallet connected ✓" : "Connect wallet";
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
      colorMode: "light",
    });
    await wallet.client?.beaconIDB?.initDB?.().catch(() => {});
  }
  tezosToolkit.setWalletProvider(wallet);
  return { sdk, toolkit: tezosToolkit, wallet };
}

async function restoreWallet() {
  try {
    const { sdk, wallet: activeWallet } = await ensureTezos();
    const account = await sdk.getActiveWalletAccount(activeWallet);
    if (!account?.address) return;
    walletAddress = account.address;
    setWalletStatus("Wallet restored. Every stamp still requires a separate approval.");
  } catch {
    setWalletStatus("Connect only when you are ready to stamp a task.");
  }
}

async function connectWallet() {
  if (walletAddress) return walletAddress;
  walletBusy = true;
  setWalletStatus("Opening the Tezos wallet chooser…");
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
      network: { type: TEZOS.network, rpcUrl: TEZOS.rpc },
    });
    walletAddress = await activeWallet.getPKH();
    tezosToolkit.setWalletProvider(activeWallet);
    setWalletStatus("Connected to Mainnet. Review every stamp in your wallet.");
    return walletAddress;
  } catch (error) {
    walletAddress = "";
    const message = error instanceof Error && /abort|cancel|reject|closed|declin/i.test(error.message)
      ? "Wallet connection was canceled."
      : "The wallet could not connect. Check the wallet window and try again.";
    setWalletStatus(message);
    throw error;
  } finally {
    walletBusy = false;
    setWalletStatus(walletAddress
      ? "Connected to Mainnet. Review every stamp in your wallet."
      : elements.walletStatus.textContent);
  }
}

async function disconnectWallet() {
  walletBusy = true;
  setWalletStatus("Disconnecting…");
  try {
    const sdk = await tezosSdkPromise;
    if (sdk && wallet) await sdk.disconnectTezosWallet(wallet);
  } finally {
    wallet = undefined;
    walletAddress = "";
    walletBusy = false;
    setWalletStatus("Wallet disconnected. Your local board is unchanged.");
  }
}

async function confirmStamp() {
  const task = state.tasks.find((item) => item.id === stampTargetId);
  if (!task || !preparedStamp) return;
  elements.confirmStamp.disabled = true;
  elements.stampDialogStatus.textContent = walletAddress
    ? "Building the Mainnet contract call…"
    : "Choose a wallet and approve the connection…";
  try {
    const address = await connectWallet();
    const { toolkit } = await ensureTezos();
    elements.stampDialogStatus.textContent = "Approve one 0 ꜩ TzStamp contract call in your wallet. A network fee applies.";
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
      status: "injected",
    };
    state.receipts.unshift(receipt);
    saveState("Stamp injected to Tezos Mainnet.");
    render();
    elements.stampDialogStatus.innerHTML = "Injected. <a href=\"" + receipt.explorerUrl + "\" target=\"_blank\" rel=\"noreferrer\">Open the operation ↗</a>";
    try {
      await operation.confirmation(1);
      receipt.status = "confirmed";
      receipt.confirmedAt = new Date().toISOString();
      saveState("Stamp confirmed on Tezos Mainnet.");
      render();
      elements.stampDialogStatus.innerHTML = "Confirmed on Mainnet. <a href=\"" + receipt.explorerUrl + "\" target=\"_blank\" rel=\"noreferrer\">Open the receipt ↗</a>";
    } catch {
      elements.stampDialogStatus.textContent = "The operation was injected. Confirmation is still pending; use the receipt shelf to check it.";
    }
  } catch (error) {
    const canceled = error instanceof Error && /abort|cancel|reject|closed|declin/i.test(error.message);
    elements.stampDialogStatus.textContent = canceled
      ? "Nothing was stamped. The wallet request was canceled."
      : "Nothing was stamped. The wallet or Mainnet request did not complete.";
  } finally {
    elements.confirmStamp.disabled = false;
  }
}

function exportBoard() {
  downloadJson(`industrynext-desk-${todayKey()}.json`, {
    schema: "industrynext.task-board/v2",
    generatedAt: new Date().toISOString(),
    tasks: state.tasks,
    receipts: state.receipts,
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
    state = { tasks: nextTasks, receipts: nextReceipts, version: 2 };
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

elements.copyBrief.addEventListener("click", () => {
  const id = String(elements.taskForm.elements.id.value || "");
  const task = state.tasks.find((item) => item.id === id);
  if (task) copyTaskBrief(task);
});

elements.duplicateTask.addEventListener("click", () => {
  const id = String(elements.taskForm.elements.id.value || "");
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  const now = Date.now();
  const duplicate = normalizeTask({
    ...task,
    id: crypto.randomUUID(),
    title: `${task.title} / copy`,
    status: "inbox",
    blockedReason: "",
    checklist: task.checklist.map((item) => ({ id: crypto.randomUUID(), text: item.text, done: false })),
    createdAt: now,
    updatedAt: now,
  });
  state.tasks.unshift(duplicate);
  saveState("Task duplicated into the inbox.");
  elements.taskDialog.close();
  render();
});

elements.deleteTask.addEventListener("click", () => {
  const id = String(elements.taskForm.elements.id.value || "");
  const task = state.tasks.find((item) => item.id === id);
  if (!task || !confirm(`Delete “${task.title}” from this device? Its downloaded and on-chain receipts will not be deleted.`)) return;
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
    updatedAt: Date.now(),
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
elements.walletButton.addEventListener("click", () => connectWallet().catch(() => {}));
elements.walletDisconnect.addEventListener("click", () => disconnectWallet());
elements.confirmStamp.addEventListener("click", confirmStamp);

render();
