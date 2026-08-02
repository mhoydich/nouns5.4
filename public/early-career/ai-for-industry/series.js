const progressKey = "industrynext.ai-for-industry.progress.v1";
const partButtons = [...document.querySelectorAll("[data-mark-part]")];
const progressCount = document.querySelector("#progress-count");
const progressFill = document.querySelector("#progress-fill");
const progressStatus = document.querySelector("#progress-status");
const resetProgress = document.querySelector("#reset-progress");

function readProgress() {
  try {
    const value = JSON.parse(window.localStorage.getItem(progressKey) || "[]");
    return new Set(Array.isArray(value) ? value.filter((part) => /^0[1-9]$|^10$/.test(part)) : []);
  } catch {
    return new Set();
  }
}

function writeProgress(completed) {
  window.localStorage.setItem(progressKey, JSON.stringify([...completed].sort()));
}

let completed = readProgress();

function renderProgress(message) {
  const total = completed.size;
  progressCount.textContent = `${total} / 10 RECEIPTS`;
  progressFill.style.width = `${total * 10}%`;
  partButtons.forEach((button) => {
    const isComplete = completed.has(button.dataset.markPart);
    button.setAttribute("aria-pressed", String(isComplete));
    button.textContent = isComplete ? "Receipt marked ✓" : "Mark receipt";
  });
  if (message) progressStatus.textContent = message;
  else if (total === 10) progressStatus.textContent = "Ten receipts marked on this device. Now tell the story of one useful loop.";
  else progressStatus.textContent = "Nothing is uploaded. Mark a part when its receipt exists.";
}

partButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const part = button.dataset.markPart;
    if (completed.has(part)) {
      completed.delete(part);
      writeProgress(completed);
      renderProgress(`Part ${part} reopened on this device.`);
      return;
    }
    completed.add(part);
    writeProgress(completed);
    renderProgress(`Part ${part} marked complete on this device.`);
  });
});

resetProgress.addEventListener("click", () => {
  completed = new Set();
  window.localStorage.removeItem(progressKey);
  renderProgress("Device-local progress cleared. Your actual artifacts are unchanged.");
});

const briefForm = document.querySelector("#brief-form");
const briefFields = [...briefForm.querySelectorAll("textarea[name], input[name]")];
const briefReadiness = document.querySelector("#brief-readiness");
const briefOutput = document.querySelector("#brief-output");
const briefOutputWrap = document.querySelector("#brief-output-wrap");
const copyBriefButton = document.querySelector("#copy-brief");
const briefResetButton = document.querySelector("#brief-reset");
const briefStatus = document.querySelector("#brief-status");

function briefValues() {
  return Object.fromEntries(new FormData(briefForm).entries());
}

function updateBriefReadiness() {
  const ready = briefFields.filter((field) => field.value.trim()).length;
  briefReadiness.textContent = `${ready} / 5 READY`;
  briefReadiness.dataset.ready = String(ready === briefFields.length);
  if (!briefOutputWrap.hidden) {
    briefOutputWrap.hidden = true;
    copyBriefButton.hidden = true;
    briefStatus.textContent = "The worksheet changed. Compile a fresh brief.";
  }
}

function compileBrief(data) {
  return [
    "# Working brief",
    "",
    "## Goal",
    `Change this repeated problem: ${data.problem.trim()}`,
    "",
    "## Owner",
    data.owner.trim(),
    "",
    "## Context the tool may use",
    data.context.trim(),
    "",
    "## Constraints",
    data.constraints.trim(),
    "",
    "## Done when",
    data.proof.trim(),
    "",
    "## Working method",
    "Inspect before editing. Keep the change bounded. Use official documentation for current APIs. Preserve existing behavior outside the brief. Test the important path, review the diff, and name anything that remains unverified.",
    "",
    "Built with Industry Next / AI for Industry / Part 01.",
  ].join("\n");
}

async function copyText(value, fallback) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  if (fallback) {
    fallback.focus();
    fallback.select();
    document.execCommand("copy");
    return;
  }
  const temporary = document.createElement("textarea");
  temporary.value = value;
  temporary.setAttribute("readonly", "");
  temporary.style.position = "fixed";
  temporary.style.opacity = "0";
  document.body.append(temporary);
  temporary.select();
  document.execCommand("copy");
  temporary.remove();
}

briefFields.forEach((field) => field.addEventListener("input", updateBriefReadiness));

briefForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = briefValues();
  const missing = briefFields.find((field) => !field.value.trim());
  if (missing) {
    briefStatus.textContent = "Complete all five fields so the agent has a real finish line.";
    missing.focus();
    return;
  }
  briefOutput.value = compileBrief(data);
  briefOutputWrap.hidden = false;
  copyBriefButton.hidden = false;
  briefStatus.textContent = "Brief ready. Remove private or identifying material before pasting it into any tool.";
  briefOutput.focus();
});

copyBriefButton.addEventListener("click", async () => {
  try {
    await copyText(briefOutput.value, briefOutput);
    copyBriefButton.textContent = "Copied";
    briefStatus.textContent = "Working brief copied. You still decide which tool receives it.";
    window.setTimeout(() => { copyBriefButton.textContent = "Copy working brief"; }, 1800);
  } catch {
    briefStatus.textContent = "Copy was blocked. Select the brief and copy it manually.";
  }
});

briefResetButton.addEventListener("click", () => {
  window.setTimeout(() => {
    briefOutput.value = "";
    briefOutputWrap.hidden = true;
    copyBriefButton.hidden = true;
    briefStatus.textContent = "Start with the problem, not the model.";
    updateBriefReadiness();
  });
});

document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.getElementById(button.dataset.copyTarget);
    if (!target) return;
    try {
      await copyText(target.textContent);
      const original = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(() => { button.textContent = original; }, 1600);
    } catch {
      button.textContent = "Select manually";
    }
  });
});

renderProgress();
updateBriefReadiness();
