const filters = [...document.querySelectorAll("[data-filter]")];
const cards = [...document.querySelectorAll("[data-work-state]")];
const boardStatus = document.querySelector("#board-status");
const copyButton = document.querySelector("#copy-brief");
const copyStatus = document.querySelector("#copy-status");

function showState(state) {
  let visible = 0;
  for (const card of cards) {
    const show = state === "all" || card.dataset.workState === state;
    card.hidden = !show;
    if (show) visible += 1;
  }

  for (const filter of filters) {
    filter.setAttribute("aria-pressed", String(filter.dataset.filter === state));
  }

  if (boardStatus) {
    const label = state === "all" ? "all work" : `${state} work`;
    boardStatus.textContent = `Showing ${visible} items: ${label}.`;
  }
}

for (const filter of filters) {
  filter.addEventListener("click", () => showState(filter.dataset.filter || "all"));
}

const weeklyBrief = `INDUSTRY NEXT / WEEKLY PRODUCT BRIEF

Outcome:
Evidence:
Decision needed:
Accountable lead:
Next public proof:`;

copyButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(weeklyBrief);
    copyStatus.textContent = "Weekly brief copied.";
  } catch {
    copyStatus.textContent = "Copy unavailable. Use: outcome, evidence, decision needed, accountable lead, next public proof.";
  }
});
