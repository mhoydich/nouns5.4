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
  card.id = `made-${entry.id}`;
  card.append(createPoster(entry, "feed"));
  const meta = document.createElement("div"); meta.className = "made-card-meta";
  const maker = document.createElement("span"); maker.textContent = entry.maker || "Anonymous";
  const time = document.createElement("time"); time.dateTime = entry.createdAt; time.textContent = new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  meta.append(maker, time);
  const actions = document.createElement("div"); actions.className = "made-card-actions";
  const edition = document.createElement("a"); edition.href = entry.edition === "open-studio-002" ? "/studio/002/" : "/made/"; edition.textContent = entry.edition === "open-studio-002" ? "Studio 002" : "Studio 001";
  const remix = document.createElement("a"); remix.href = `/make/?remix=${encodeURIComponent(entry.id)}`; remix.textContent = "Remix this ↗";
  actions.append(edition, remix);
  if (entry.parentId) {
    const parent = document.createElement("a"); parent.href = `#made-${encodeURIComponent(entry.parentId)}`; parent.textContent = "From an earlier work ↖"; actions.prepend(parent);
    card.classList.add("is-remix");
  }
  card.append(meta, actions); return card;
}

fetch("/api/made?limit=48", { headers: { Accept: "application/json" } })
  .then(async (response) => { if (!response.ok) throw new Error(); return response.json(); })
  .then(({ entries }) => { if (!entries?.length) return showEmpty("The worktable is open and waiting."); grid.replaceChildren(...entries.map(renderEntry)); })
  .catch(() => showEmpty("The public worktable is resting for a moment."));
