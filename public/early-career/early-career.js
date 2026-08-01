const form = document.querySelector("#receipt-form");
const count = document.querySelector("#receipt-count");
const output = document.querySelector("#receipt-output");
const outputWrap = document.querySelector("#receipt-output-wrap");
const copyButton = document.querySelector("#copy-receipt");
const resetButton = document.querySelector("#receipt-reset");
const status = document.querySelector("#receipt-status");
const fields = [...form.querySelectorAll("textarea, input")];

function values() {
  return Object.fromEntries(new FormData(form).entries());
}

function updateReadiness() {
  const ready = fields.filter((field) => field.value.trim()).length;
  count.textContent = `${ready} / 4 READY`;
  count.dataset.ready = String(ready === fields.length);
  if (!outputWrap.hidden) {
    outputWrap.hidden = true;
    copyButton.hidden = true;
    status.textContent = "The worksheet changed. Build a fresh receipt when all four fields are ready.";
  }
}

function buildReceipt(data) {
  return [
    "# First receipt",
    "",
    "## I noticed",
    data.noticed.trim(),
    "",
    "## I changed",
    data.changed.trim(),
    "",
    "## Evidence",
    data.evidence.trim(),
    "",
    "## Next",
    data.next.trim(),
    "",
    "Built with the Industry Next Starting Line receipt pattern.",
  ].join("\n");
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  output.focus();
  output.select();
  document.execCommand("copy");
}

fields.forEach((field) => field.addEventListener("input", updateReadiness));

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = values();
  if (Object.values(data).some((value) => !value.trim())) {
    status.textContent = "Complete all four fields so the receipt can stand on its own.";
    fields.find((field) => !field.value.trim())?.focus();
    return;
  }
  output.value = buildReceipt(data);
  outputWrap.hidden = false;
  copyButton.hidden = false;
  status.textContent = "Receipt ready. Read it once for private or identifying information before you share it.";
  output.focus();
});

copyButton.addEventListener("click", async () => {
  try {
    await copyText(output.value);
    copyButton.textContent = "Copied";
    status.textContent = "Receipt copied. You still decide where it goes.";
    window.setTimeout(() => { copyButton.textContent = "Copy receipt"; }, 1800);
  } catch {
    status.textContent = "Copy was blocked. Select the receipt text and copy it manually.";
  }
});

resetButton.addEventListener("click", () => {
  window.setTimeout(() => {
    output.value = "";
    outputWrap.hidden = true;
    copyButton.hidden = true;
    status.textContent = "Private by default. Build when all four fields are ready.";
    updateReadiness();
  });
});

updateReadiness();
