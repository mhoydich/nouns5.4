import { createPoster } from "/lib/permission-lab.js";

const grid = document.querySelector("#made-grid");

function showEmpty(message) {
  const empty = document.createElement("div");
  empty.className = "made-empty";
  const copy = document.createElement("p"); copy.textContent = message;
  const link = document.createElement("a"); link.href = "/make/"; link.textContent = "Make the first thing →";
  empty.append(copy, link); grid.replaceChildren(empty);
}

function renderEntry(entry) {
  const card = document.createElement("article"); card.className = "made-card";
  card.append(createPoster(entry, "feed"));
  const meta = document.createElement("div"); meta.className = "made-card-meta";
  const maker = document.createElement("span"); maker.textContent = entry.maker || "Anonymous";
  const time = document.createElement("time"); time.dateTime = entry.createdAt; time.textContent = new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  meta.append(maker, time); card.append(meta); return card;
}

fetch("/api/made?limit=48", { headers: { Accept: "application/json" } })
  .then(async (response) => { if (!response.ok) throw new Error(); return response.json(); })
  .then(({ entries }) => { if (!entries?.length) return showEmpty("The worktable is open and waiting."); grid.replaceChildren(...entries.map(renderEntry)); })
  .catch(() => showEmpty("The public worktable is resting for a moment."));
