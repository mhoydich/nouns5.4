const proofBookKey = "industrynext.top-coder.proof-book.v1";
const ticketIds = ["IN-TC-001", "IN-TC-002"];

export function readProofBook() {
  try {
    const parsed = JSON.parse(localStorage.getItem(proofBookKey) || "null");
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.proofs)) return { version: 1, proofs: [] };
    return {
      version: 1,
      proofs: parsed.proofs.filter((proof) => proof && ticketIds.includes(proof.challengeId)),
    };
  } catch {
    return { version: 1, proofs: [] };
  }
}

export function recordProof(proof) {
  const book = readProofBook();
  const compact = {
    challengeId: proof.challengeId,
    ticket: proof.ticket,
    title: proof.title,
    score: proof.score,
    passed: proof.passed,
    codeHash: proof.codeHash,
    completedAt: new Date().toISOString(),
  };
  const existingIndex = book.proofs.findIndex((entry) => entry.challengeId === compact.challengeId);
  if (existingIndex === -1) book.proofs.push(compact);
  else if ((book.proofs[existingIndex].score || 0) <= compact.score) book.proofs[existingIndex] = compact;
  try { localStorage.setItem(proofBookKey, JSON.stringify(book)); } catch {}
  return book;
}

function proofBookText(book) {
  const lines = [
    "INDUSTRY NEXT / TOP CODER / LOCAL PROOF BOOK",
    `${book.proofs.length} of ${ticketIds.length} tickets sealed`,
    "",
  ];
  for (const proof of book.proofs) {
    lines.push(`${proof.ticket} / ${proof.title}`);
    lines.push(`${proof.score}/100 / ${proof.passed} checks / code seal ${proof.codeHash}`);
    lines.push("");
  }
  lines.push("Boundary: Device-local, self-issued proof index; not a public leaderboard or identity verification.");
  lines.push("Open the desk: https://www.industrynext.xyz/top-coder/");
  return lines.join("\n");
}

async function copyText(value) {
  try { await navigator.clipboard.writeText(value); }
  catch {
    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
}

export function renderProofBook(currentChallengeId) {
  const book = readProofBook();
  const count = document.querySelector("[data-proof-count]");
  const copyButton = document.querySelector("[data-copy-proof-book]");
  const status = document.querySelector("[data-proof-book-status]");
  if (count) count.textContent = String(book.proofs.length);
  if (copyButton) copyButton.disabled = book.proofs.length === 0;

  for (const slot of document.querySelectorAll("[data-proof-slot]")) {
    const challengeId = slot.dataset.proofSlot;
    const proof = book.proofs.find((entry) => entry.challengeId === challengeId);
    slot.dataset.proofState = proof ? "sealed" : "open";
    slot.classList.toggle("is-current", challengeId === currentChallengeId);
    const state = slot.querySelector("[data-proof-slot-state]");
    if (state) state.textContent = proof ? `SEALED ${proof.score}` : challengeId === currentChallengeId ? "OPEN HERE" : "OPEN";
  }
  if (status) status.textContent = book.proofs.length === ticketIds.length
    ? "Proof Book complete. Both receipts remain on this device until you clear them."
    : `${book.proofs.length} sealed. ${ticketIds.length - book.proofs.length} still open.`;
  return book;
}

export function mountProofBook(currentChallengeId) {
  const copyButton = document.querySelector("[data-copy-proof-book]");
  const clearButton = document.querySelector("[data-clear-proof-book]");
  const status = document.querySelector("[data-proof-book-status]");

  copyButton?.addEventListener("click", async () => {
    const book = readProofBook();
    if (!book.proofs.length) return;
    await copyText(proofBookText(book));
    if (status) status.textContent = "Local Proof Book copied.";
  });

  clearButton?.addEventListener("click", () => {
    if (!window.confirm("Clear both Top Coder receipts from this device? Your code drafts will remain.")) return;
    try { localStorage.removeItem(proofBookKey); } catch {}
    renderProofBook(currentChallengeId);
    if (status) status.textContent = "Local Proof Book cleared. Draft code remains on this device.";
  });

  return renderProofBook(currentChallengeId);
}
