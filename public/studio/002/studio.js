import { createPoster } from "/lib/permission-lab.js";
import { CURRENT_STUDIO, STARTER_WORKS } from "/lib/open-studios.js";

const starterGrid = document.querySelector("#starter-grid");
const madeGrid = document.querySelector("#studio-made-grid");

function studioCard(work) {
  const article = document.createElement("article");
  article.className = "studio-card";
  if (!work.isStarter) article.id = `made-${work.id}`;
  article.append(createPoster(work, "feed"));

  const foot = document.createElement("div");
  foot.className = "studio-card-foot";
  const credit = document.createElement("span");
  credit.textContent = work.maker || "Anonymous";
  const remix = document.createElement("a");
  remix.href = work.isStarter
    ? `/make/?starter=${encodeURIComponent(work.id)}`
    : `/make/?remix=${encodeURIComponent(work.id)}`;
  remix.textContent = work.isStarter ? "Begin here ↗" : "Remix this ↗";
  foot.append(credit, remix);

  if (work.parentId) {
    const lineage = document.createElement("a");
    lineage.className = "studio-lineage";
    lineage.href = `/made/#made-${encodeURIComponent(work.parentId)}`;
    lineage.textContent = "Continues an earlier work ↖";
    article.append(lineage);
  }
  article.append(foot);
  return article;
}

starterGrid.replaceChildren(...STARTER_WORKS.map(studioCard));

fetch(`/api/made?edition=${encodeURIComponent(CURRENT_STUDIO.id)}&limit=12`, { headers: { Accept: "application/json" } })
  .then(async (response) => {
    if (!response.ok) throw new Error();
    return response.json();
  })
  .then(({ entries }) => {
    if (!entries?.length) return;
    madeGrid.replaceChildren(...entries.map(studioCard));
  })
  .catch(() => {
    const empty = madeGrid.querySelector(".made-empty");
    if (empty) empty.textContent = "The public worktable is resting for a moment.";
  });
