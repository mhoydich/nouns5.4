import { CHALLENGE_ID, CHECK_COUNT, TOP_CODER_THRESHOLD, noteStatus, proofLabel, scoreProof } from "./core.js";

const starterCode = `function repairQueue(records) {
  // Return the ordered array of IDs.

}`;
const storageKey = "industrynext.top-coder.001.draft.v1";
const solution = document.querySelector("#solution");
const note = document.querySelector("#note");
const runButton = document.querySelector("#run-checks");
const resetButton = document.querySelector("#reset-code");
const runState = document.querySelector("#run-state");
const scoreDisplay = document.querySelector("#score-display");
const draftState = document.querySelector("#draft-state");
const checksSummary = document.querySelector("#checks-summary");
const checkRows = [...document.querySelectorAll("#checks-list li")];
const proofCard = document.querySelector("#proof-card");
const proofId = document.querySelector("#proof-id");
const proofScore = document.querySelector("#proof-score");
const proofLabelElement = document.querySelector("#proof-label");
const proofChecks = document.querySelector("#proof-checks");
const proofNote = document.querySelector("#proof-note");
const copyProofButton = document.querySelector("#copy-proof");
const copyStatus = document.querySelector("#copy-status");
const raiseHand = document.querySelector("#raise-hand");

let lastProof = null;
let runSequence = 0;

function setDraftState(message) {
  draftState.textContent = message;
  window.clearTimeout(setDraftState.timer);
  setDraftState.timer = window.setTimeout(() => { draftState.textContent = "LOCAL DRAFT"; }, 1200);
}

function saveDraft() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ code: solution.value, note: note.value }));
    setDraftState("SAVED HERE");
  } catch {
    setDraftState("MEMORY OFF");
  }
}

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (typeof draft?.code === "string") solution.value = draft.code;
    if (typeof draft?.note === "string") note.value = draft.note;
  } catch {}
}

function resetResults() {
  lastProof = null;
  runState.textContent = "READY";
  scoreDisplay.textContent = "00";
  checksSummary.textContent = "Waiting for your first run.";
  checkRows.forEach((row) => {
    row.dataset.result = "waiting";
    row.querySelector("em").textContent = "WAITING";
  });
  proofCard.dataset.proofState = "empty";
  proofId.textContent = "PROOF ————";
  proofScore.textContent = "00";
  proofLabelElement.textContent = "RUN THE TICKET";
  proofChecks.textContent = `0 of ${CHECK_COUNT} passed`;
  proofNote.textContent = noteStatus("");
  copyProofButton.disabled = true;
  copyStatus.textContent = "";
}

function sandboxDocument(source, channel) {
  const serializedSource = JSON.stringify(source).replace(/<\//g, "<\\/");
  const serializedChannel = JSON.stringify(channel);
  return `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; worker-src blob:; connect-src 'none'">
<script>
const channel = ${serializedChannel};
const source = ${serializedSource};
function execute(source) {
const tests = [
  { id: "empty", run: (fn) => JSON.stringify(fn([])) === "[]", message: "Expected [] for an empty queue." },
  { id: "latest", run: (fn) => JSON.stringify(fn([
    { id: "alpha", revision: 1, priority: 9, createdAt: "2026-01-01", cancelled: false },
    { id: "alpha", revision: 3, priority: 2, createdAt: "2026-01-03", cancelled: false },
    { id: "alpha", revision: 2, priority: 7, createdAt: "2026-01-02", cancelled: false }
  ])) === JSON.stringify(["alpha"]), message: "Keep only the highest revision for each ID." },
  { id: "cancelled", run: (fn) => JSON.stringify(fn([
    { id: "gone", revision: 1, priority: 9, createdAt: "2026-01-01", cancelled: false },
    { id: "gone", revision: 2, priority: 9, createdAt: "2026-01-02", cancelled: true }
  ])) === "[]", message: "A cancellation on the current revision removes the ID." },
  { id: "priority", run: (fn) => JSON.stringify(fn([
    { id: "low", revision: 1, priority: 2, createdAt: "2026-01-01", cancelled: false },
    { id: "high", revision: 1, priority: 8, createdAt: "2026-01-03", cancelled: false }
  ])) === JSON.stringify(["high", "low"]), message: "Sort current active records by descending priority." },
  { id: "time", run: (fn) => JSON.stringify(fn([
    { id: "later", revision: 1, priority: 5, createdAt: "2026-04-09T12:00:00Z", cancelled: false },
    { id: "earlier", revision: 1, priority: 5, createdAt: "2026-04-09T09:00:00Z", cancelled: false }
  ])) === JSON.stringify(["earlier", "later"]), message: "Use the earliest createdAt to break a priority tie." },
  { id: "duplicate", run: (fn) => JSON.stringify(fn([
    { id: "alpha", revision: 1, priority: 10, createdAt: "2026-01-01", cancelled: false },
    { id: "alpha", revision: 2, priority: 1, createdAt: "2026-01-02", cancelled: false },
    { id: "beta", revision: 1, priority: 5, createdAt: "2026-01-03", cancelled: false }
  ])) === JSON.stringify(["beta", "alpha"]), message: "A stale high priority must not leak into the release order." },
  { id: "immutable", run: (fn) => {
    const input = [
      { id: "b", revision: 1, priority: 1, createdAt: "2026-01-02", cancelled: false },
      { id: "a", revision: 1, priority: 2, createdAt: "2026-01-01", cancelled: false }
    ];
    const before = JSON.stringify(input);
    fn(input);
    return JSON.stringify(input) === before;
  }, message: "Do not mutate the input array or its records." }
];
let candidate;
let results = [];
let runtimeError = "";
try {
  self.fetch = undefined;
  self.XMLHttpRequest = undefined;
  self.WebSocket = undefined;
  self.EventSource = undefined;
  self.importScripts = undefined;
  candidate = (0, eval)("(() => {\\n" + source + "\\n; return repairQueue; })()");
  if (typeof candidate !== "function") throw new Error("Define a function named repairQueue.");
  results = tests.map((test) => {
    try { return { id: test.id, passed: test.run(candidate), message: test.message }; }
    catch (error) { return { id: test.id, passed: false, message: error?.message || test.message }; }
  });
} catch (error) {
  runtimeError = error?.message || "The repair could not run.";
  results = tests.map((test) => ({ id: test.id, passed: false, message: runtimeError }));
}
self.postMessage({ results, runtimeError });
}
const workerProgram = "(" + execute.toString() + ")(" + JSON.stringify(source) + ");";
const workerUrl = URL.createObjectURL(new Blob([workerProgram], { type: "text/javascript" }));
const worker = new Worker(workerUrl);
worker.addEventListener("message", (event) => {
  URL.revokeObjectURL(workerUrl);
  worker.terminate();
  parent.postMessage({ channel, ...event.data }, "*");
}, { once: true });
worker.addEventListener("error", () => {
  URL.revokeObjectURL(workerUrl);
  worker.terminate();
  parent.postMessage({ channel, results: [], runtimeError: "The isolated runner could not start." }, "*");
}, { once: true });
</script>`;
}

function runInSandbox(source) {
  const sequence = ++runSequence;
  const channel = `industrynext-top-coder-${Date.now()}-${sequence}`;
  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    frame.hidden = true;
    frame.setAttribute("sandbox", "allow-scripts");
    frame.title = "Disposable Top Coder test sandbox";
    document.body.append(frame);
    let finished = false;
    const finish = (payload) => {
      if (finished) return;
      finished = true;
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timeout);
      frame.remove();
      resolve(payload);
    };
    const onMessage = (event) => {
      if (event.source !== frame.contentWindow || event.data?.channel !== channel) return;
      finish(event.data);
    };
    const timeout = window.setTimeout(() => {
      finish({
        results: checkRows.map((row) => ({ id: row.dataset.check, passed: false, message: "The repair exceeded the 1.5 second safety limit." })),
        runtimeError: "The repair exceeded the 1.5 second safety limit.",
      });
    }, 1500);
    window.addEventListener("message", onMessage);
    frame.srcdoc = sandboxDocument(source, channel);
  });
}

async function shortHash(value) {
  try {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].slice(0, 4).map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  } catch {
    return Math.abs([...value].reduce((hash, character) => ((hash << 5) - hash) + character.charCodeAt(0), 0)).toString(16).slice(0, 8).toUpperCase();
  }
}

function proofText(proof) {
  return [
    "INDUSTRY NEXT / TOP CODER / OPEN PROOF 001",
    `Proof: ${proof.id}`,
    `Result: ${proof.label} — ${proof.score}/100`,
    `Checks: ${proof.passed}/${CHECK_COUNT} passed`,
    `Challenge: ${CHALLENGE_ID} / The Messy Queue`,
    `Code seal: ${proof.codeHash}`,
    `Change note: ${proof.note || "Not supplied."}`,
    "Boundary: Local browser proof on one bounded JavaScript repair; not a global rank or identity verification.",
    "Verify the challenge: https://www.industrynext.xyz/top-coder/",
  ].join("\n");
}

async function renderProof(results, runtimeError = "") {
  const score = scoreProof(results, note.value);
  const codeHash = await shortHash(solution.value);
  const id = `${CHALLENGE_ID}-${codeHash}`;
  const label = proofLabel(score.total);
  lastProof = { id, label, score: score.total, passed: score.passed, note: note.value.trim(), codeHash };

  runState.textContent = score.passed === CHECK_COUNT ? "COMPLETE" : "REPAIR";
  scoreDisplay.textContent = String(score.total).padStart(2, "0");
  checksSummary.textContent = runtimeError
    ? `The repair could not complete: ${runtimeError}`
    : `${score.passed} of ${CHECK_COUNT} checks passed. ${score.clarity === 20 ? "Change note is legible." : "A specific change note is worth 20 points."}`;

  for (const row of checkRows) {
    const result = results.find((entry) => entry.id === row.dataset.check);
    const passed = result?.passed === true;
    row.dataset.result = passed ? "pass" : "fail";
    row.querySelector("em").textContent = passed ? "PASS" : "REPAIR";
    row.title = passed ? "Check passed" : (result?.message || "Check failed");
  }

  proofCard.dataset.proofState = score.total >= TOP_CODER_THRESHOLD ? "top" : "progress";
  proofId.textContent = `PROOF ${codeHash}`;
  proofScore.textContent = String(score.total).padStart(2, "0");
  proofLabelElement.textContent = label;
  proofChecks.textContent = `${score.passed} of ${CHECK_COUNT} passed`;
  proofNote.textContent = noteStatus(note.value);
  copyProofButton.disabled = false;
  const email = new URLSearchParams({
    subject: `TOP CODER / ${id}`,
    body: `${proofText(lastProof)}\n\nOne shipped thing:\n\nWhat I want to build next:\n`,
  });
  raiseHand.href = `mailto:mh@pointcast.xyz?${email.toString()}`;
}

async function runChecks() {
  runButton.disabled = true;
  runButton.textContent = "Running sealed checks…";
  runState.textContent = "TESTING";
  copyStatus.textContent = "";
  try {
    const { results, runtimeError } = await runInSandbox(solution.value);
    await renderProof(results, runtimeError);
    saveDraft();
    document.querySelector("#checks-list").scrollIntoView({ behavior: "smooth", block: "center" });
  } finally {
    runButton.disabled = false;
    runButton.innerHTML = 'Run seven checks <span aria-hidden="true">▶</span>';
  }
}

async function copyProof() {
  if (!lastProof) return;
  const text = proofText(lastProof);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  copyStatus.textContent = "Proof receipt copied.";
}

let saveTimer;
function queueSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveDraft, 250);
}

solution.addEventListener("input", queueSave);
note.addEventListener("input", queueSave);
runButton.addEventListener("click", runChecks);
copyProofButton.addEventListener("click", copyProof);
resetButton.addEventListener("click", () => {
  solution.value = starterCode;
  note.value = "";
  try { localStorage.removeItem(storageKey); } catch {}
  resetResults();
  solution.focus();
});

loadDraft();
resetResults();
