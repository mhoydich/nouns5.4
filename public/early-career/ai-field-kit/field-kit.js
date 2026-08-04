const missionButtons = Array.from(document.querySelectorAll("[data-mission]"));
const stackNumber = document.querySelector("#stack-number");
const stackKicker = document.querySelector("#stack-kicker");
const stackName = document.querySelector("#stack-name");
const stackBrief = document.querySelector("#stack-brief");
const stackSteps = document.querySelector("#stack-steps");
const stackReceipt = document.querySelector("#stack-receipt");
const copyPlan = document.querySelector("#copy-plan");
const copyStatus = document.querySelector("#copy-status");

const stacks = {
  site: {
    number: "STACK / 01",
    kicker: "MISSION / PUBLISH",
    name: "Ship a useful website.",
    brief: "Turn one observed friction into a one-screen tool and put it on a public URL.",
    receipt: "A live URL, a README, one test, and a three-sentence before/after.",
    steps: [
      ["Codex", "Inspect the folder, build one complete path, and run the check.", "https://openai.com/codex/"],
      ["GitHub", "Keep the source, brief, issue, commit, and release together.", "https://docs.github.com/en/get-started"],
      ["Cloudflare Pages", "Deploy the exact commit and verify the canonical route.", "https://developers.cloudflare.com/pages/"],
      ["PostHog", "Record one privacy-safe event that answers a real question.", "https://posthog.com/"],
    ],
  },
  code: {
    number: "STACK / 02",
    kicker: "MISSION / COMPARE",
    name: "Make a coding proof.",
    brief: "Give two coding agents the same bounded brief and compare judgment, not vibes.",
    receipt: "Two clean branches, the same tests, a diff review, and your chosen merge.",
    steps: [
      ["Codex", "Run the brief once with tests and a scoped finish line.", "https://openai.com/codex/"],
      ["Claude Code", "Run the same brief separately and record its first move.", "https://docs.anthropic.com/en/docs/claude-code/overview"],
      ["GitHub", "Compare commits and explain the merge decision in a pull request.", "https://docs.github.com/en/get-started"],
      ["Cursor", "Inspect and refine the winning path inside the editor.", "https://www.cursor.com/"],
    ],
  },
  research: {
    number: "STACK / 03",
    kicker: "MISSION / SOURCE",
    name: "Publish a sourced brief.",
    brief: "Move from open-web scouting to primary sources and an argument someone else can audit.",
    receipt: "A two-page brief, linked sources, an uncertainty box, and a bibliography.",
    steps: [
      ["Perplexity", "Scout the topic and collect candidate sources.", "https://www.perplexity.ai/"],
      ["NotebookLM", "Interrogate the primary sources you chose.", "https://notebooklm.google/"],
      ["Zotero", "Save metadata, notes, and a portable bibliography.", "https://www.zotero.org/"],
      ["GitHub", "Publish the brief and source notes in a versioned repository.", "https://docs.github.com/en/get-started"],
    ],
  },
  video: {
    number: "STACK / 04",
    kicker: "MISSION / DIRECT",
    name: "Finish a 30-second film.",
    brief: "Lock three shots, compare engines on one shot, then let the edit make the final claim.",
    receipt: "A shot brief, three engine takes, a take sheet, and one finished cut.",
    steps: [
      ["Seedance", "Generate one directed multi-reference take.", "https://seed.bytedance.com/en/seedance2_0"],
      ["Google Flow", "Make a second take with the same shot constraints.", "https://labs.google/fx/tools/flow"],
      ["Runway", "Try the hardest movement or transformation as a third take.", "https://runwayml.com/"],
      ["DaVinci Resolve", "Choose, cut, mix, caption, and export the authored sequence.", "https://www.blackmagicdesign.com/products/davinciresolve"],
    ],
  },
  automation: {
    number: "STACK / 05",
    kicker: "MISSION / HANDOFF",
    name: "Repair a boring handoff.",
    brief: "Connect one safe test event to one useful action with logs, limits, and an approval point.",
    receipt: "A disabled workflow map, test payload, execution log, and owner note.",
    steps: [
      ["MCP", "Name the data, tools, trust boundary, and approvals.", "https://modelcontextprotocol.io/docs/getting-started/intro"],
      ["Postman", "Make the underlying request by hand first.", "https://learning.postman.com/docs/getting-started/first-steps/sending-the-first-request/"],
      ["Pipedream", "Build the trigger, transform, action, and error path.", "https://pipedream.com/docs/workflows/quickstart"],
      ["GitHub", "Keep the contract, sample payload, and runbook versioned.", "https://docs.github.com/en/get-started"],
    ],
  },
  payment: {
    number: "STACK / 06",
    kicker: "MISSION / TEST COMMERCE",
    name: "Build a test checkout.",
    brief: "Prove the state machine without charging a real card or promising fulfillment you cannot deliver.",
    receipt: "A test checkout, signed event, idempotent fulfillment record, and cancellation path.",
    steps: [
      ["Stripe Checkout", "Use hosted Checkout and test mode for the full payment path.", "https://docs.stripe.com/checkout/quickstart"],
      ["Postman", "Inspect the event payload and failure behavior.", "https://learning.postman.com/docs/getting-started/first-steps/sending-the-first-request/"],
      ["Codex", "Implement and test idempotent fulfillment on a clean branch.", "https://openai.com/codex/"],
      ["Cloudflare Pages", "Ship the test surface and verify the public-safe result.", "https://developers.cloudflare.com/pages/"],
    ],
  },
  message: {
    number: "STACK / 07",
    kicker: "MISSION / CONSENT",
    name: "Send one safe message.",
    brief: "Make a verified-recipient notification with explicit consent, delivery state, quiet hours, and a stop path.",
    receipt: "A consent record, self-sent message, delivery log, failure case, and opt-out copy.",
    steps: [
      ["Twilio", "Use the trial with a verified recipient and a narrow message.", "https://www.twilio.com/docs/usage/trials"],
      ["Pipedream", "Make the trigger, approval, send, and status steps visible.", "https://pipedream.com/docs/workflows/quickstart"],
      ["Postman", "Save a redacted request and delivery-status example.", "https://learning.postman.com/docs/getting-started/first-steps/sending-the-first-request/"],
      ["GitHub", "Version the consent text, limits, and incident stop switch.", "https://docs.github.com/en/get-started"],
    ],
  },
  api: {
    number: "STACK / 08",
    kicker: "MISSION / CONTRACT",
    name: "Build an AI API demo.",
    brief: "Make one model request, return one structured result, handle one failure, and keep the secret on the server.",
    receipt: "A redacted contract, safe sample input, structured output, failing test, and usage note.",
    steps: [
      ["OpenAI API", "Make the first server-side request from the official quickstart.", "https://developers.openai.com/api/docs/quickstart"],
      ["Postman", "Inspect the exact request, response, status, and error.", "https://learning.postman.com/docs/getting-started/first-steps/sending-the-first-request/"],
      ["Supabase", "Store only the minimum safe state the demo needs.", "https://supabase.com/docs"],
      ["Cloudflare Pages", "Deploy the interface and server function without exposing the key.", "https://developers.cloudflare.com/pages/"],
    ],
  },
};

let activeMission = "site";

function renderStack(mission) {
  const stack = stacks[mission];
  if (!stack || !stackSteps) return;
  activeMission = mission;
  stackNumber.textContent = stack.number;
  stackKicker.textContent = stack.kicker;
  stackName.textContent = stack.name;
  stackBrief.textContent = stack.brief;
  stackReceipt.textContent = stack.receipt;
  stackSteps.replaceChildren();

  stack.steps.forEach(([name, action, url]) => {
    const item = document.createElement("li");
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    const detail = document.createElement("span");
    const link = document.createElement("a");
    title.textContent = name;
    detail.textContent = action;
    link.textContent = "Official door ↗";
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    copy.append(title, detail);
    item.append(copy, link);
    stackSteps.append(item);
  });

  missionButtons.forEach((button) => {
    const selected = button.dataset.mission === mission;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  copyStatus.textContent = "No account is connected. No action happens until you open an official door.";
}

missionButtons.forEach((button) => button.addEventListener("click", () => renderStack(button.dataset.mission)));

copyPlan?.addEventListener("click", async () => {
  const stack = stacks[activeMission];
  const lines = [stack.name, "", `Goal: ${stack.brief}`, "", "90-MINUTE FIRST MOVE"];
  stack.steps.forEach(([name, action, url], index) => lines.push(`${index + 1}. ${name} — ${action}\n   ${url}`));
  lines.push("", `KEEP THIS RECEIPT: ${stack.receipt}`, "", "Budget rule: check current access and set a hard ceiling before using credits or a live API.");
  try {
    await navigator.clipboard.writeText(lines.join("\n"));
    copyStatus.textContent = "Copied. Put the plan beside the work, then change it when reality disagrees.";
  } catch {
    copyStatus.textContent = "Copy was blocked. The complete plan is visible above.";
  }
});

const serviceCards = Array.from(document.querySelectorAll(".service-card"));
const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
const searchInput = document.querySelector("#service-search");
const accessFilter = document.querySelector("#access-filter");
const resultCount = document.querySelector("#result-count");
const emptyState = document.querySelector("#empty-state");
let activeCategory = "all";

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const access = accessFilter.value;
  let visible = 0;
  serviceCards.forEach((card) => {
    const categoryMatch = activeCategory === "all" || card.dataset.category === activeCategory;
    const accessMatch = access === "all" || card.dataset.access === access;
    const haystack = `${card.dataset.search} ${card.textContent}`.toLowerCase();
    const searchMatch = !query || haystack.includes(query);
    const show = categoryMatch && accessMatch && searchMatch;
    card.hidden = !show;
    if (show) visible += 1;
  });
  resultCount.textContent = `${visible} official ${visible === 1 ? "door" : "doors"}`;
  emptyState.hidden = visible !== 0;
}

filterButtons.forEach((button) => button.addEventListener("click", () => {
  activeCategory = button.dataset.filter;
  filterButtons.forEach((candidate) => {
    const selected = candidate === button;
    candidate.classList.toggle("is-active", selected);
    candidate.setAttribute("aria-pressed", String(selected));
  });
  applyFilters();
}));

searchInput?.addEventListener("input", applyFilters);
accessFilter?.addEventListener("change", applyFilters);
renderStack(activeMission);
applyFilters();
