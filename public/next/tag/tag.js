const form = document.querySelector("#tag-application");
const copyButton = document.querySelector("#tag-copy");
const clearButton = document.querySelector("#tag-clear");
const status = document.querySelector("#tag-status");
const storageKey = "industrynext.tagApplication.v1";
const fieldNames = ["name", "email", "shipped", "prototype", "fun", "availability", "tools"];

function field(name) { return form.elements.namedItem(name); }
function values() { return Object.fromEntries(fieldNames.map((name) => [name, field(name)?.value.trim() || ""])); }
function applicationText() {
  const entry = values();
  return [
    "INDUSTRY NEXT / OPEN BUILD 001 / TAG LEAD", "", `Name: ${entry.name}`, `Email: ${entry.email}`, "",
    "ONE THING I SHIPPED", entry.shipped, "", "MY FIRST PROTOTYPE", entry.prototype, "",
    "WHAT MAKES A GROUP GAME FUN", entry.fun, "", "FOUR-WEEK AVAILABILITY", entry.availability, "",
    "PREFERRED AI TOOLS / CREDIT ENVIRONMENT", entry.tools || "No preference stated.", "",
    "I understand that AI credits cover model/tool usage; cash costs require a separate agreement."
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
    const helper = document.createElement("textarea"); helper.value = text; helper.setAttribute("readonly", "");
    helper.style.position = "fixed"; helper.style.opacity = "0"; document.body.append(helper); helper.select();
    document.execCommand("copy"); helper.remove();
  }
  status.textContent = "Application copied. Email it to mh@pointcast.xyz with the subject TAG LEAD.";
}
form.addEventListener("input", saveDraft);
form.addEventListener("change", saveDraft);
form.addEventListener("submit", (event) => {
  event.preventDefault(); if (!validate()) return;
  const subject = `TAG LEAD — ${values().name}`;
  const query = new URLSearchParams({ subject, body: applicationText() });
  status.textContent = "Opening your email app. Your draft remains saved on this device.";
  window.location.href = `mailto:mh@pointcast.xyz?${query.toString()}`;
});
copyButton.addEventListener("click", copyApplication);
clearButton.addEventListener("click", () => {
  form.reset(); try { localStorage.removeItem(storageKey); } catch {}
  status.textContent = "Local draft cleared."; field("name")?.focus();
});
loadDraft();
