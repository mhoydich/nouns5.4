const form = document.querySelector("#builder-application");
const copyButton = document.querySelector("#copy-application");
const clearButton = document.querySelector("#clear-application");
const status = document.querySelector("#application-status");
const storageKey = "industrynext.builder001.application.v1";
const fieldNames = ["name", "email", "shipped", "wedge", "group", "prototype", "availability", "tools"];

function field(name) { return form.elements.namedItem(name); }
function values() { return Object.fromEntries(fieldNames.map((name) => [name, field(name)?.value.trim() || ""])); }

function applicationText() {
  const entry = values();
  return [
    "INDUSTRY NEXT / BUILDER 001 / SMALL SOCIAL SYSTEMS", "",
    `Name: ${entry.name}`, `Email: ${entry.email}`, "",
    "ONE THING I SHIPPED", entry.shipped, "",
    "THE WHITE SPACE I WOULD CHOOSE", entry.wedge, "",
    "THE REAL GROUP I WOULD START WITH", entry.group, "",
    "WHAT WOULD EXIST AFTER SEVEN DAYS", entry.prototype, "",
    "FOUR-WEEK AVAILABILITY", entry.availability, "",
    "PREFERRED AI TOOLS / CREDIT ENVIRONMENT", entry.tools || "No preference stated.", "",
    "I understand that AI credits are operating support; cash, ownership, and contractor terms require a separate written agreement."
  ].join("\n");
}

function validate() {
  if (form.checkValidity()) return true;
  form.reportValidity();
  status.textContent = "Complete the marked fields before preparing the application.";
  return false;
}

function saveDraft() {
  try { localStorage.setItem(storageKey, JSON.stringify({ ...values(), terms: field("terms")?.checked || false })); } catch {}
}

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!draft || typeof draft !== "object") return;
    for (const name of fieldNames) if (typeof draft[name] === "string" && field(name)) field(name).value = draft[name];
    if (field("terms")) field("terms").checked = draft.terms === true;
    status.textContent = "Local draft restored.";
  } catch {}
}

async function copyApplication() {
  if (!validate()) return;
  const text = applicationText();
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
  status.textContent = "Application copied. Email it to mh@pointcast.xyz with the subject BUILDER 001.";
}

form.addEventListener("input", saveDraft);
form.addEventListener("change", saveDraft);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validate()) return;
  const query = new URLSearchParams({ subject: `BUILDER 001 — ${values().name}`, body: applicationText() });
  status.textContent = "Opening your email app. Your draft remains saved on this device.";
  window.location.href = `mailto:mh@pointcast.xyz?${query.toString()}`;
});
copyButton.addEventListener("click", copyApplication);
clearButton.addEventListener("click", () => {
  form.reset();
  try { localStorage.removeItem(storageKey); } catch {}
  status.textContent = "Local draft cleared.";
  field("name")?.focus();
});
loadDraft();
