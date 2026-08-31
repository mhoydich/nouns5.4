const forms = document.querySelectorAll("[data-email-form]");

function humanize(name) {
  return name.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formBrief(form) {
  const data = new FormData(form);
  const lines = [form.dataset.title || "INDUSTRY NEXT REQUEST", ""];

  for (const [name, value] of data.entries()) {
    if (typeof value !== "string" || !value.trim()) continue;
    lines.push(`${humanize(name)}:`, value.trim(), "");
  }

  lines.push("Prepared at:", window.location.href);
  return lines.join("\n");
}

async function copyBrief(form, status) {
  try {
    await navigator.clipboard.writeText(formBrief(form));
    status.textContent = "Copied. Paste the brief into an email to mh@pointcast.xyz when you are ready.";
  } catch {
    status.textContent = "Copy was blocked by the browser. Select your answers and email them to mh@pointcast.xyz.";
  }
}

for (const form of forms) {
  const status = form.querySelector("[data-form-status]");
  const copyButton = form.querySelector("[data-copy-form]");

  copyButton?.addEventListener("click", async () => {
    if (!form.reportValidity()) return;
    await copyBrief(form, status);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const recipient = form.dataset.recipient || "mh@pointcast.xyz";
    const subject = form.dataset.subject || "Industry Next request";
    const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formBrief(form))}`;

    status.textContent = "Your email app should open with the prepared brief. Nothing is sent until you review and send it.";
    window.location.href = mailto;
  });
}
