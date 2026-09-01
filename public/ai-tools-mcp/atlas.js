const stacks = {
  site: {
    number: "01",
    kicker: "OUTCOME / PUBLISH",
    name: "Ship a useful website.",
    brief: "Move from a bounded brief to a tested public URL with a reviewable repository trail.",
    ai: [
      ["Codex", "Implement inside the real repository, follow its rules, and leave a small reviewable diff."],
      ["Cursor", "Use the editor as a close inspection surface for code, changes, and human review."],
    ],
    mcp: [
      ["GitHub", "Read issues and pull requests; keep repository writes approval-gated."],
      ["Playwright", "Test the actual route, interaction, responsive layout, and browser errors."],
      ["Sentry", "Connect observed failures to the fix when a test or production project exists."],
    ],
    prompt: "Inspect this repository and its instructions. Propose the smallest change that satisfies the brief. Before editing, name the files, tests, permission boundaries, and exact proof you will return.",
    test: "VERIFY: open the route at desktop and phone widths, exercise the main action, inspect console errors, and attach the exact commit plus test output.",
  },
  brief: {
    number: "02",
    kicker: "OUTCOME / SOURCE",
    name: "Produce a technical brief.",
    brief: "Turn a current question into a concise claim-to-source map with assumptions and open decisions visible.",
    ai: [
      ["ChatGPT", "Shape the research question, alternatives, and verification list."],
      ["NotebookLM", "Interrogate a bounded source set and keep citations close to each claim."],
    ],
    mcp: [
      ["OpenAI Docs", "Use official OpenAI documentation when the brief touches OpenAI products or APIs."],
      ["Context7", "Retrieve current library documentation instead of trusting recalled signatures."],
      ["GitHub", "Inspect the source, releases, issues, and implementation evidence behind a technical claim."],
    ],
    prompt: "Build a one-page technical brief from approved primary sources. Separate fact, inference, and recommendation. For every material claim, return the strongest source link and its date.",
    test: "VERIFY: open every cited source, replace secondary summaries where a primary source exists, and mark any claim that remains inference.",
  },
  design: {
    number: "03",
    kicker: "OUTCOME / TRANSLATE",
    name: "Build from a design.",
    brief: "Translate one named design frame into a working interface without losing structure, behavior, or responsive intent.",
    ai: [
      ["Figma Make", "Explore and test interaction intent before treating the visual as a finished contract."],
      ["Codex", "Implement in the codebase and reconcile the design with real component and platform constraints."],
    ],
    mcp: [
      ["Figma", "Read the exact file and frame; scope access to the design needed for this task."],
      ["GitHub", "Work against the current components, tokens, issues, and pull request trail."],
      ["Playwright", "Compare behavior and layout at the target viewports after implementation."],
    ],
    prompt: "Read the named Figma frame and inspect the current codebase. Map design regions to existing components and tokens. Identify ambiguities before editing, then implement one complete responsive path.",
    test: "VERIFY: compare target screenshots at the specified viewports, exercise every interactive state, and record intentional differences from the design.",
  },
  bug: {
    number: "04",
    kicker: "OUTCOME / REPAIR",
    name: "Fix a production bug.",
    brief: "Connect one observed failure to a minimal repair, a regression test, and evidence from the real route.",
    ai: [
      ["Codex", "Trace the failure through the repository and implement the smallest safe correction."],
      ["Claude Code", "Provide an independent terminal-level read of cause, risk, and regression coverage."],
    ],
    mcp: [
      ["Sentry", "Start from the actual issue, stack, trace, environment, and release context."],
      ["GitHub", "Inspect blame, related issues, pull requests, actions, and the release trail."],
      ["Chrome DevTools", "Observe DOM, console, network, and performance state on the failing route."],
    ],
    prompt: "Diagnose this observed failure before proposing a fix. Separate reproduction, root cause, contributing conditions, and repair. Do not mutate production state. Return the smallest regression test that fails first.",
    test: "VERIFY: reproduce before the fix, make the regression test fail then pass, and re-check the real route without using a personal browser profile.",
  },
  review: {
    number: "05",
    kicker: "OUTCOME / REVIEW",
    name: "Review a repository.",
    brief: "Turn a broad codebase into a bounded risk list with source locations, severity, and practical next moves.",
    ai: [
      ["Claude", "Read the architecture and make assumptions, inconsistencies, and missing evidence legible."],
      ["Codex", "Inspect the repository, run focused checks, and tie findings to exact files and behavior."],
    ],
    mcp: [
      ["GitHub", "Read repository history, open issues, pull requests, actions, and security context."],
      ["Context7", "Verify current library behavior before calling an implementation outdated or incorrect."],
      ["Playwright", "Test material user-facing claims in a real browser when the repository produces a site."],
    ],
    prompt: "Review this repository without editing it. Prioritize concrete correctness, security, reliability, and maintainability risks. Cite exact files and reproduce material findings when safe.",
    test: "VERIFY: each high-severity finding needs a source location, failure mode, reproduction or evidence, and a bounded remediation—not confidence alone.",
  },
  api: {
    number: "06",
    kicker: "OUTCOME / PROTOTYPE",
    name: "Prototype an AI API.",
    brief: "Build one narrow request-response loop with test data, explicit schemas, spend limits, and failure handling.",
    ai: [
      ["ChatGPT", "Clarify the user contract, test cases, and structured response the prototype must produce."],
      ["Codex", "Implement the smallest API-backed path with secrets, network, and cost boundaries."],
    ],
    mcp: [
      ["OpenAI Docs", "Retrieve current request fields and official implementation guidance when using OpenAI."],
      ["Context7", "Verify the current SDK and framework methods used by the prototype."],
      ["Sentry", "Capture test-environment failures without exposing secrets or sensitive payloads."],
    ],
    prompt: "Design one narrow API loop. Define input and output schemas, three test cases, a timeout, a spend ceiling, secret handling, and the user-visible failure state before implementation.",
    test: "VERIFY: run success, malformed-input, provider-error, and timeout cases with test data; confirm no secret or sensitive payload appears in client code or logs.",
  },
};

const postures = {
  public: {
    badge: "PUBLIC + TEST",
    text: "Use public sources, a test repository or project, and synthetic data. Keep writes prompt-gated even when the consequence seems small.",
  },
  team: {
    badge: "PRIVATE TEAM",
    text: "Confirm you are allowed to share the material. Use project-scoped configuration, the narrowest account and repository scope, and human approval for writes.",
  },
  production: {
    badge: "PRODUCTION",
    text: "Start in read-only mode and a test environment. Use least privilege, no personal browser profile, explicit approval for every write, and a rollback path.",
  },
};

const outcomeButtons = Array.from(document.querySelectorAll("[data-outcome]"));
const postureSelect = document.querySelector("#posture-select");
const stackNumber = document.querySelector("#stack-number");
const stackPostureBadge = document.querySelector("#stack-posture-badge");
const stackKicker = document.querySelector("#stack-kicker");
const stackName = document.querySelector("#stack-name");
const stackBrief = document.querySelector("#stack-brief");
const stackAi = document.querySelector("#stack-ai");
const stackMcp = document.querySelector("#stack-mcp");
const stackPrompt = document.querySelector("#stack-prompt");
const stackPermission = document.querySelector("#stack-permission");
const stackTest = document.querySelector("#stack-test");
const copyStatus = document.querySelector("#copy-status");

const hashParams = new URLSearchParams(window.location.hash.slice(1));
let activeOutcome = Object.hasOwn(stacks, hashParams.get("outcome")) ? hashParams.get("outcome") : "site";
let activePosture = Object.hasOwn(postures, hashParams.get("posture")) ? hashParams.get("posture") : "public";
postureSelect.value = activePosture;

function renderList(target, entries) {
  const items = entries.map(([name, detail]) => {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    const description = document.createElement("small");
    title.textContent = name;
    description.textContent = detail;
    item.append(title, description);
    return item;
  });
  target.replaceChildren(...items);
}

function updateShareState() {
  const params = new URLSearchParams({ outcome: activeOutcome, posture: activePosture });
  window.history.replaceState(null, "", `#${params.toString()}`);
}

function renderStack() {
  const stack = stacks[activeOutcome];
  const posture = postures[activePosture];
  stackNumber.textContent = `STACK / ${stack.number}`;
  stackPostureBadge.textContent = posture.badge;
  stackKicker.textContent = stack.kicker;
  stackName.textContent = stack.name;
  stackBrief.textContent = stack.brief;
  stackPrompt.textContent = stack.prompt;
  stackPermission.textContent = posture.text;
  stackTest.textContent = stack.test;
  renderList(stackAi, stack.ai);
  renderList(stackMcp, stack.mcp);
  outcomeButtons.forEach((button) => {
    const selected = button.dataset.outcome === activeOutcome;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  copyStatus.textContent = "No accounts are connected and no MCP server is installed from this page.";
  updateShareState();
}

function stackCardText() {
  const stack = stacks[activeOutcome];
  const posture = postures[activePosture];
  const lines = [
    "INDUSTRY NEXT / AI + MCP TOOLCHAIN CARD",
    `Outcome: ${stack.name}`,
    `Posture: ${posture.badge}`,
    "",
    "AI SURFACES",
  ];
  stack.ai.forEach(([name, detail], index) => lines.push(`${index + 1}. ${name} — ${detail}`));
  lines.push("", "MCP BRIDGES");
  stack.mcp.forEach(([name, detail], index) => lines.push(`${index + 1}. ${name} — ${detail}`));
  lines.push("", `FIRST PROMPT: ${stack.prompt}`, "", `PERMISSION: ${posture.text}`, `GATE: ${stack.test}`, "", `Share: ${window.location.href}`);
  return lines.join("\n");
}

async function copyText(value, successMessage, failureTarget = copyStatus) {
  try {
    await navigator.clipboard.writeText(value);
    failureTarget.textContent = successMessage;
    return true;
  } catch {
    failureTarget.textContent = "Copy was blocked. The complete material remains visible on this page.";
    return false;
  }
}

outcomeButtons.forEach((button) => button.addEventListener("click", () => {
  activeOutcome = button.dataset.outcome;
  renderStack();
}));

postureSelect?.addEventListener("change", () => {
  activePosture = postureSelect.value;
  renderStack();
});

document.querySelector("#copy-stack")?.addEventListener("click", () => {
  copyText(stackCardText(), "Stack card copied. Review every publisher, scope, and offered tool before connecting it.");
});

document.querySelector("#copy-link")?.addEventListener("click", () => {
  copyText(window.location.href, "Share link copied. It contains only the selected outcome and posture.");
});

const aiCards = Array.from(document.querySelectorAll("[data-ai-card]"));
const aiFilterButtons = Array.from(document.querySelectorAll("[data-ai-filter]"));
const aiSearch = document.querySelector("#ai-search");
const aiResultCount = document.querySelector("#ai-result-count");
const aiEmpty = document.querySelector("#ai-empty");
let activeAiFilter = "all";

function filterAiCards() {
  const query = aiSearch.value.trim().toLowerCase();
  let visible = 0;
  aiCards.forEach((card) => {
    const categoryMatch = activeAiFilter === "all" || card.dataset.category === activeAiFilter;
    const haystack = `${card.dataset.search} ${card.textContent}`.toLowerCase();
    const queryMatch = !query || haystack.includes(query);
    const show = categoryMatch && queryMatch;
    card.hidden = !show;
    if (show) visible += 1;
  });
  aiResultCount.textContent = `${visible} AI work ${visible === 1 ? "surface" : "surfaces"}`;
  aiEmpty.hidden = visible !== 0;
}

aiFilterButtons.forEach((button) => button.addEventListener("click", () => {
  activeAiFilter = button.dataset.aiFilter;
  aiFilterButtons.forEach((candidate) => {
    const selected = candidate === button;
    candidate.classList.toggle("is-active", selected);
    candidate.setAttribute("aria-pressed", String(selected));
  });
  filterAiCards();
}));

aiSearch?.addEventListener("input", filterAiCards);

const starterCommands = "codex mcp add openaiDeveloperDocs --url https://developers.openai.com/mcp\ncodex mcp list";
const starterStatus = document.querySelector("#starter-status");
document.querySelector("#copy-starter")?.addEventListener("click", () => {
  copyText(starterCommands, "Commands copied. Add the server, list it, then run one read-only documentation test.", starterStatus);
});

renderStack();
filterAiCards();
