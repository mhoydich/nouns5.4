// Industry Next / Start a project
// Builds one email from the form and opens it in the visitor's own mail app.
// Nothing is sent to a server or stored.
const ADDRESS = "mh@pointcast.xyz";
const form = document.getElementById("brief");
const status = document.getElementById("form-status");

function preselect() {
  const id = decodeURIComponent(location.hash.slice(1));
  const label = id && document.getElementById(id);
  const input = label && label.querySelector('input[name="offer"]');
  if (input) input.checked = true;
}
preselect();
window.addEventListener("hashchange", preselect);

function buildMail() {
  const data = new FormData(form);
  const offer = data.get("offer") || "Not sure yet";
  const who = String(data.get("who") || "").trim();
  const lines = [
    `Level: ${offer}`,
    `Who: ${who}`,
    "",
    "What's stuck:",
    String(data.get("problem") || "").trim(),
    "",
    "What should be working in 90 days:",
    String(data.get("ninety") || "").trim(),
    "",
    `Budget and timing: ${String(data.get("budget") || "").trim()}`,
    "",
    "Sent from industrynext.xyz/start/",
  ];
  const subject = `Industry Next — ${offer}${who ? ` / ${who}` : ""}`;
  return `mailto:${ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const problem = String(new FormData(form).get("problem") || "").trim();
  if (!problem) {
    status.textContent = "Add a line or two about what's stuck first.";
    document.getElementById("f-problem").focus();
    return;
  }
  const href = buildMail();
  status.textContent = `Opening your mail app. If nothing opens, email ${ADDRESS}.`;
  window.location.href = href;
});
