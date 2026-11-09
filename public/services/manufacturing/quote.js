import { quote, rfqText } from "/services/manufacturing/quote-engine.js";

const form = document.getElementById("quote-form");
const result = document.getElementById("quote-result");
const rfq = document.getElementById("rfq-text");
const copy = document.getElementById("rfq-copy");

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const dims = (o) => `${o.length} × ${o.width} × ${o.height} in`;
const usd = (n) => `$${n.toLocaleString("en-US")}`;
const LABEL = { length: "length", width: "width", height: "height", weight: "weight" };

function read() {
  const data = Object.fromEntries(new FormData(form));
  data.stackable = form.elements.stackable.checked;
  return data;
}

function render() {
  const q = quote(read());
  if (!q.ok) {
    result.innerHTML = `<p class="quote-empty">Add the part's ${q.missing.map((k) => LABEL[k]).join(", ")} to see a spec.</p>`;
    rfq.textContent = "";
    return;
  }

  const rows = [
    ["Inside", dims(q.inside)],
    ["Outside, est.", dims(q.outside)],
    ["Gross each, est.", `${q.grossEach} lb`],
  ];
  if (q.pallets) rows.push(["Pallets", `${q.pallets} × 48 × 40, ${q.plan.perPallet} per pallet (${q.plan.perLayer} a layer × ${q.plan.layers})`]);
  if (q.crates) rows.push(["Crates", `${q.crates}, one part each`]);
  rows.push(["Shipment, est.", `${q.shipWeight.toLocaleString("en-US")} lb`]);

  result.innerHTML = `
    <p class="quote-format">${esc(q.formatLabel)}</p>
    <p class="quote-pad">${q.padding} in of cushion on every side</p>
    <dl class="quote-grid">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
    <div class="quote-price" aria-label="Practice material range">
      <span>PRACTICE MATERIAL RANGE</span>
      <strong>${usd(q.cost.low)} – ${usd(q.cost.high)}</strong>
      <small>about ${usd(q.cost.eachLow)} – ${usd(q.cost.eachHigh)} a unit, packaging only</small>
    </div>
    ${q.flags.length ? `<ul class="quote-flags">${q.flags.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
  `;
  rfq.textContent = rfqText(q);
}

form.addEventListener("input", render);
form.addEventListener("change", render);
form.addEventListener("submit", (e) => e.preventDefault());

copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(rfq.textContent);
    copy.textContent = "Copied";
  } catch {
    const range = document.createRange();
    range.selectNodeContents(rfq);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    copy.textContent = "Selected, press copy";
  }
  setTimeout(() => (copy.textContent = "Copy the request"), 2000);
});

render();
