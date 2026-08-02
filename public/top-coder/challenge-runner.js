import { CHECK_COUNT, TOP_CODER_THRESHOLD, noteStatus, proofLabel, scoreProof } from "./core.js";
import { mountProofBook, recordProof, renderProofBook } from "./proof-book.js";

export function mountChallenge(config) {
  const checkCount = config.checkCount || CHECK_COUNT;
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

  if (checkRows.length !== checkCount) throw new Error(`${config.id} expected ${checkCount} proof rows.`);

  let lastProof = null;
  let runSequence = 0;

  function setDraftState(message) {
    draftState.textContent = message;
    window.clearTimeout(setDraftState.timer);
    setDraftState.timer = window.setTimeout(() => { draftState.textContent = "LOCAL DRAFT"; }, 1200);
  }

  function saveDraft() {
    try {
      localStorage.setItem(config.storageKey, JSON.stringify({ code: solution.value, note: note.value }));
      setDraftState("SAVED HERE");
    } catch { setDraftState("MEMORY OFF"); }
  }

  function loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(config.storageKey) || "null");
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
    proofChecks.textContent = `0 of ${checkCount} passed`;
    proofNote.textContent = noteStatus("");
    copyProofButton.disabled = true;
    copyStatus.textContent = "";
  }

  function sandboxDocument(source, channel) {
    const serializedSource = JSON.stringify(source).replace(/<\//g, "<\\/");
    const serializedChannel = JSON.stringify(channel);
    const serializedFunctionName = JSON.stringify(config.functionName);
    const serializedTestSuite = JSON.stringify(config.testSuite.toString()).replace(/<\//g, "<\\/");
    return `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; worker-src blob:; connect-src 'none'">
<script>
const channel = ${serializedChannel};
const source = ${serializedSource};
const functionName = ${serializedFunctionName};
const testSuiteSource = ${serializedTestSuite};
async function execute(source, functionName, testSuite) {
  let candidate;
  let results = [];
  let runtimeError = "";
  try {
    self.fetch = undefined;
    self.XMLHttpRequest = undefined;
    self.WebSocket = undefined;
    self.EventSource = undefined;
    self.importScripts = undefined;
    candidate = (0, eval)("(() => {\\n" + source + "\\n; return " + functionName + "; })()");
    if (typeof candidate !== "function") throw new Error("Define a function named " + functionName + ".");
    results = await testSuite(candidate);
  } catch (error) {
    runtimeError = error?.message || "The repair could not run.";
  }
  self.postMessage({ results, runtimeError });
}
const workerProgram = "(" + execute.toString() + ")(" + JSON.stringify(source) + "," + JSON.stringify(functionName) + ",(" + testSuiteSource + "));";
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
      const timeout = window.setTimeout(() => finish({
        results: checkRows.map((row) => ({ id: row.dataset.check, passed: false, message: `The repair exceeded the ${config.timeoutLabel} safety limit.` })),
        runtimeError: `The repair exceeded the ${config.timeoutLabel} safety limit.`,
      }), config.timeoutMs);
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
      `INDUSTRY NEXT / TOP CODER / OPEN PROOF ${config.ticket}`,
      `Proof: ${proof.id}`,
      `Result: ${proof.label} — ${proof.score}/100`,
      `Checks: ${proof.passed}/${checkCount} passed`,
      `Challenge: ${config.id} / ${config.title}`,
      `Code seal: ${proof.codeHash}`,
      `Change note: ${proof.note || "Not supplied."}`,
      "Boundary: Local browser proof on one bounded JavaScript repair; not a global rank or identity verification.",
      `Verify the challenge: ${config.canonicalUrl}`,
    ].join("\n");
  }

  async function renderProof(results = [], runtimeError = "") {
    const normalized = checkRows.map((row) => results.find((entry) => entry.id === row.dataset.check) || ({ id: row.dataset.check, passed: false, message: runtimeError || "Check did not complete." }));
    const score = scoreProof(normalized, note.value, checkCount);
    const codeHash = await shortHash(solution.value);
    const id = `${config.id}-${codeHash}`;
    const label = proofLabel(score.total);
    lastProof = { id, challengeId: config.id, ticket: config.ticket, title: config.title, label, score: score.total, passed: score.passed, note: note.value.trim(), codeHash };

    runState.textContent = score.passed === checkCount ? "COMPLETE" : "REPAIR";
    scoreDisplay.textContent = String(score.total).padStart(2, "0");
    checksSummary.textContent = runtimeError
      ? `The repair could not complete: ${runtimeError}`
      : `${score.passed} of ${checkCount} checks passed. ${score.clarity === 20 ? "Change note is legible." : "A specific change note is worth 20 points."}`;
    for (const row of checkRows) {
      const result = normalized.find((entry) => entry.id === row.dataset.check);
      const passed = result?.passed === true;
      row.dataset.result = passed ? "pass" : "fail";
      row.querySelector("em").textContent = passed ? "PASS" : "REPAIR";
      row.title = passed ? "Check passed" : (result?.message || "Check failed");
    }
    proofCard.dataset.proofState = score.total >= TOP_CODER_THRESHOLD ? "top" : "progress";
    proofId.textContent = `PROOF ${codeHash}`;
    proofScore.textContent = String(score.total).padStart(2, "0");
    proofLabelElement.textContent = label;
    proofChecks.textContent = `${score.passed} of ${checkCount} passed`;
    proofNote.textContent = noteStatus(note.value);
    copyProofButton.disabled = false;
    if (score.total >= TOP_CODER_THRESHOLD) {
      recordProof(lastProof);
      renderProofBook(config.id);
    }
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
    try { await navigator.clipboard.writeText(text); }
    catch {
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
  const queueSave = () => {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveDraft, 250);
  };

  solution.addEventListener("input", queueSave);
  note.addEventListener("input", queueSave);
  runButton.addEventListener("click", runChecks);
  copyProofButton.addEventListener("click", copyProof);
  resetButton.addEventListener("click", () => {
    solution.value = config.starterCode;
    note.value = "";
    try { localStorage.removeItem(config.storageKey); } catch {}
    resetResults();
    solution.focus();
  });

  loadDraft();
  resetResults();
  mountProofBook(config.id);
}
