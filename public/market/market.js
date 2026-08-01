const cards = [...document.querySelectorAll("[data-kind]")];
const filters = [...document.querySelectorAll("[data-filter]")];
const search = document.querySelector("#market-search");
const status = document.querySelector("#market-status");
const empty = document.querySelector("#empty-market");

let activeKind = "all";

function updateBoard() {
  const query = search.value.trim().toLowerCase();
  let visible = 0;

  cards.forEach((card) => {
    const kindMatch = activeKind === "all" || card.dataset.kind === activeKind;
    const searchMatch = !query || card.dataset.search.includes(query);
    card.hidden = !(kindMatch && searchMatch);
    if (!card.hidden) visible += 1;
  });

  const label = activeKind === "all" ? "market objects" : `${activeKind} objects`;
  status.textContent = `Showing ${visible} ${label}${query ? ` matching “${query}”` : ""}.`;
  empty.hidden = visible !== 0;
}

function setFilter(kind) {
  activeKind = kind;
  filters.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === kind)));
  updateBoard();
}

filters.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter)));
document.querySelectorAll("[data-jump-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    search.value = "";
    setFilter(button.dataset.jumpFilter);
    document.querySelector("#market-board").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
search.addEventListener("input", updateBoard);

const taskBriefs = {
  halation: {
    id: "halation-first-30-days",
    kind: "task",
    organization: "Industry Next",
    parent_job: "Halation Lead",
    outcome: "Run Halation's first 30-day operating loop: publish, invite, learn, and recommend continue, revise, or close.",
    acceptance: "Public work, real invitations, a short evidence trail, and a written decision.",
    reward: "Inside the funded AI-credit lead brief; not a separate bounty.",
    application: "mailto:mh@pointcast.xyz?subject=I want to lead Halation",
  },
};

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

document.querySelectorAll("[data-copy-brief]").forEach((button) => {
  const original = button.textContent;
  button.addEventListener("click", async () => {
    const brief = taskBriefs[button.dataset.copyBrief];
    try {
      await copyText(JSON.stringify(brief, null, 2));
      button.textContent = "Task brief copied ✓";
    } catch {
      button.textContent = "Copy unavailable";
    }
    window.setTimeout(() => { button.textContent = original; }, 2200);
  });
});

const form = document.querySelector("#listing-form");
const outputWrap = document.querySelector("#draft-output-wrap");
const output = document.querySelector("#draft-output");
const copyDraft = document.querySelector("#copy-draft");
const formStatus = document.querySelector("#form-status");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const listing = {
    schema: "industrynext.work-market-listing/v1",
    status: "local-draft",
    kind: data.get("kind"),
    organization: data.get("organization"),
    title: data.get("title"),
    outcome: data.get("outcome"),
    first_proof: data.get("first_proof"),
    reward: {
      rail: data.get("reward_rail"),
      amount_or_terms: data.get("reward_terms"),
      escrowed: false,
      automatic_settlement: false,
      written_agreement_required: true,
    },
    contact: data.get("contact"),
  };

  output.value = JSON.stringify(listing, null, 2);
  outputWrap.hidden = false;
  copyDraft.hidden = false;
  formStatus.textContent = "Draft built locally. Review every term before copying or sharing.";
});

copyDraft.addEventListener("click", async () => {
  try {
    await copyText(output.value);
    formStatus.textContent = "Listing JSON copied. Nothing was published or sent.";
  } catch {
    output.focus();
    output.select();
    formStatus.textContent = "Automatic copy was unavailable. The draft is selected for manual copy.";
  }
});
