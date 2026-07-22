import { createPoster, MODE_LABELS, nounUrl, PALETTE_COLORS, secureRandom } from "/lib/permission-lab.js";

const form = document.querySelector("#lab-form");
const preview = document.querySelector("#poster-preview");
const status = document.querySelector("#lab-status");
const publishButton = document.querySelector("#publish-button");
const seedLimits = { background: 2, body: 30, accessory: 143, head: 254, glasses: 23 };
let seed = { background: 0, body: 4, accessory: 26, head: 89, glasses: 3 };

function value(name) { return new FormData(form).get(name)?.toString().trim() || ""; }
function entry() {
  return { message: value("message") || "Permission is the starting point.", maker: value("maker"), mode: value("mode"), palette: value("palette"), seed };
}
function render() { preview.replaceChildren(createPoster(entry())); }
function remix() {
  seed = Object.fromEntries(Object.entries(seedLimits).map(([part, limit]) => [part, secureRandom(limit)]));
  render();
  status.textContent = "A fresh Noun is in the room.";
}

function wrapText(context, text, maxWidth) {
  const words = text.toUpperCase().split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function downloadPng() {
  const work = entry();
  const colors = PALETTE_COLORS[work.palette];
  const canvas = document.createElement("canvas");
  canvas.width = 1200; canvas.height = 1200;
  const context = canvas.getContext("2d");
  context.fillStyle = colors.background; context.fillRect(0, 0, 1200, 1200);
  context.fillStyle = colors.ink; context.font = "700 24px monospace";
  context.fillText(MODE_LABELS[work.mode].toUpperCase(), 70, 82);
  context.textAlign = "right"; context.fillText(work.maker ? `BY ${work.maker.toUpperCase()}` : "MADE IN PUBLIC", 1130, 82); context.textAlign = "left";
  const noun = await loadImage(nounUrl(work.seed));
  context.fillStyle = colors.accent; context.fillRect(308, 168, 620, 620);
  context.imageSmoothingEnabled = false; context.drawImage(noun, 282, 142, 620, 620);
  context.fillStyle = colors.ink; context.font = "800 78px sans-serif";
  const lines = wrapText(context, work.message, 1060);
  lines.forEach((line, index) => context.fillText(line, 70, 890 + index * 76));
  const link = document.createElement("a");
  link.download = `industry-next-${work.mode}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  status.textContent = "PNG exported. It is yours to use anywhere.";
}

form.addEventListener("input", render);
document.querySelector("#remix-button").addEventListener("click", remix);
document.querySelector("#download-button").addEventListener("click", () => downloadPng().catch(() => { status.textContent = "The PNG could not be exported. Try again."; }));
form.addEventListener("submit", async (event) => {
  event.preventDefault(); publishButton.disabled = true; status.textContent = "Publishing to the public stream…";
  try {
    const response = await fetch("/api/made", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry()) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to publish.");
    status.innerHTML = "Published. <a href=\"/made/\">See it in Made →</a>";
  } catch (error) { status.textContent = error instanceof Error ? error.message : "Unable to publish."; }
  finally { publishButton.disabled = false; }
});

render();
