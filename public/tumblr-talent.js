import {
  init_browser_shims
} from "./chunks/chunk-TF5QER46.js";

// src/tumblr-talent.js
init_browser_shims();
var maker = document.querySelector("#signal-maker");
var talentForm = document.querySelector("#talent-submit");
var talentStatus = document.querySelector("#talent-status");
var formState = document.querySelector("#form-state");
var receipt = document.querySelector("#talent-receipt");
var submitButton = talentForm.querySelector("button[type=submit]");
var canonicalUrl = "https://www.industrynext.xyz/market/tumblr/";
var tags = ["internet people 001", "industry next", "digital skills", "tumblr talent relay"];
var prompts = {
  previewHandle: ["#card-handle", "@yourname"],
  previewSkill: ["#card-skill", "Your strange digital skill."],
  previewMake: ["#card-make", "The thing only you would think to make."],
  previewTeach: ["#card-teach", "A move someone else can carry."],
  previewNeed: ["#card-need", "The missing person, place, or material."],
  previewSeven: ["#card-seven", "One small proof in public."]
};
function value(name) {
  return maker.elements.namedItem(name).value.trim();
}
function normalizeHandle(handle) {
  if (!handle) return "@yourname";
  return handle.startsWith("@") ? handle : `@${handle}`;
}
function starterPost() {
  const handle = normalizeHandle(value("previewHandle"));
  const skill = value("previewSkill") || "My strange digital skill";
  const make = value("previewMake") || "[what I make]";
  const teach = value("previewTeach") || "[what I can teach]";
  const need = value("previewNeed") || "[the collaborator or material I need]";
  const seven = value("previewSeven") || "[one move I could make in seven days]";
  return `${handle} / ${skill}

I MAKE
${make}

I CAN TEACH
${teach}

I NEED
${need}

IN SEVEN DAYS, I COULD
${seven}

This is my signal for Internet People 001, a Tumblr Talent Relay by Industry Next. Make your own: ${canonicalUrl}`;
}
function tumblrShareUrl() {
  const url = new URL("https://www.tumblr.com/widgets/share/tool");
  url.searchParams.set("posttype", "text");
  url.searchParams.set("title", value("previewSkill") || "My strange digital skill");
  url.searchParams.set("content", starterPost());
  url.searchParams.set("tags", tags.join(","));
  url.searchParams.set("canonicalUrl", canonicalUrl);
  return url.toString();
}
function renderPreview() {
  for (const [name, [selector, fallback]] of Object.entries(prompts)) {
    const fieldValue = name === "previewHandle" ? normalizeHandle(value(name)) : value(name);
    document.querySelector(selector).textContent = fieldValue || fallback;
  }
  document.querySelector("#open-tumblr").href = tumblrShareUrl();
}
maker.addEventListener("input", renderPreview);
renderPreview();
document.querySelector("#copy-starter").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(starterPost());
    document.querySelector("#maker-status").textContent = "Starter copied. Make it sound like you before publishing.";
  } catch {
    document.querySelector("#maker-status").textContent = "Clipboard access was blocked. Select and copy the generated card fields instead.";
  }
});
function syncSubmissionFromMaker() {
  const mapping = {
    tumblrHandle: normalizeHandle(value("previewHandle")),
    digitalSkill: value("previewSkill"),
    canMake: value("previewMake"),
    canTeach: value("previewTeach"),
    collaborationNeed: value("previewNeed"),
    sevenDayMove: value("previewSeven")
  };
  for (const [name, fieldValue] of Object.entries(mapping)) {
    const field = talentForm.elements.namedItem(name);
    if (fieldValue && !field.value.trim()) field.value = fieldValue;
  }
}
document.querySelector("#open-tumblr").addEventListener("click", syncSubmissionFromMaker);
function formPayload() {
  const data = new FormData(talentForm);
  return {
    type: "tumblr-talent",
    name: data.get("name"),
    email: data.get("email"),
    timezone: data.get("timezone"),
    portfolioUrl: data.get("portfolioUrl"),
    tumblrHandle: data.get("tumblrHandle"),
    tumblrPostUrl: data.get("tumblrPostUrl"),
    digitalSkill: data.get("digitalSkill"),
    canMake: data.get("canMake"),
    canTeach: data.get("canTeach"),
    sevenDayMove: data.get("sevenDayMove"),
    collaborationNeed: data.get("collaborationNeed"),
    profileConsent: data.get("profileConsent") === "on",
    termsAcknowledged: data.get("termsAcknowledged") === "on",
    privacyConsent: data.get("privacyConsent") === "on",
    companyWebsite: data.get("companyWebsite")
  };
}
talentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!talentForm.checkValidity()) {
    talentForm.reportValidity();
    talentStatus.textContent = "Complete the marked fields and all three consent checks.";
    return;
  }
  submitButton.disabled = true;
  formState.textContent = "SENDING";
  talentStatus.textContent = "Sending one private talent signal\u2026";
  try {
    const response = await fetch("/api/market-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(formPayload())
    });
    const data = await response.json();
    if (!response.ok || !data.application) throw new Error(data.error || "The signal did not arrive.");
    document.querySelector("#receipt-id").textContent = data.application.id;
    talentForm.hidden = true;
    receipt.hidden = false;
    receipt.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    formState.textContent = "NOT SENT";
    talentStatus.textContent = error instanceof Error ? error.message : "The signal did not arrive. Try again.";
    submitButton.disabled = false;
  }
});
