const filterButtons = [...document.querySelectorAll("[data-filter]")];
const buildCards = [...document.querySelectorAll("[data-kind]")];
const count = document.querySelector("#project-count");
const picker = document.querySelector("#pick-build");

const labels = {
  all: "all",
  communication: "communication",
  directional: "directional",
  entertainment: "entertainment",
  orbit: "orbit and listening",
};

let activeFilter = "all";

function visibleCards() {
  return buildCards.filter((card) => !card.hidden);
}

function setFilter(nextFilter) {
  activeFilter = nextFilter;
  for (const button of filterButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === nextFilter));
  }

  for (const card of buildCards) {
    card.classList.remove("is-picked");
    card.hidden = nextFilter !== "all" && card.dataset.kind !== nextFilter;
  }

  const shown = visibleCards().length;
  count.textContent = nextFilter === "all"
    ? `Showing all ${shown} build directions.`
    : `Showing ${shown} ${labels[nextFilter]} build directions.`;
}

for (const button of filterButtons) {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
}

picker?.addEventListener("click", () => {
  const candidates = visibleCards();
  for (const card of buildCards) card.classList.remove("is-picked");
  if (!candidates.length) return;

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  selected.classList.add("is-picked");
  selected.focus({ preventScroll: true });
  selected.scrollIntoView({ behavior: "smooth", block: "center" });
  const title = selected.querySelector("h3")?.textContent || "build";
  count.textContent = `${labels[activeFilter][0].toUpperCase()}${labels[activeFilter].slice(1)} signal picked: ${title}.`;
});
