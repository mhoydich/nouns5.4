import {
  init_browser_shims
} from "./chunks/chunk-TF5QER46.js";

// src/market-apply.js
init_browser_shims();
var roles = {
  "small-social-systems-builder": {
    number: "JOB / 011",
    title: "Small Social Systems Builder",
    outcome: "Make one underbuilt social behavior playable with one real group.",
    support: "FOUR WEEKS \xB7 AI MODEL + TOOL CREDITS"
  },
  "halation-lead": {
    number: "JOB / 001",
    title: "Halation Lead",
    outcome: "Own the image diary, publish with it, and build its first small circle.",
    support: "30-DAY LOOP \xB7 FUNDED AI CREDITS"
  },
  "tag-open-build-lead": {
    number: "JOB / 003",
    title: "TAG Build Lead",
    outcome: "Make a tiny social relay playable with three real groups.",
    support: "FOUR WEEKS \xB7 AI MODEL + TOOL CREDITS"
  },
  "playlist-editor-listener-growth": {
    number: "JOB / 002",
    title: "Playlist Editor + Listener Growth Lead",
    outcome: "Create authored listening worlds and learn what earns a return listen.",
    support: "$0 CASH GUARANTEED \xB7 POTENTIAL PROJECT REVENUE SHARE"
  }
};
var form = document.querySelector("#market-application");
var roleSelect = document.querySelector("#role-select");
var status = document.querySelector("#application-status");
var state = document.querySelector("#form-state");
var receipt = document.querySelector("#application-receipt");
var roleNumber = document.querySelector("#role-number");
var roleTitle = document.querySelector("#role-title");
var roleOutcome = document.querySelector("#role-outcome");
var roleSupport = document.querySelector("#role-support");
var submitButton = form.querySelector("button[type=submit]");
function selectedRole() {
  return roles[roleSelect.value] || roles["small-social-systems-builder"];
}
function renderRole() {
  const role = selectedRole();
  roleNumber.textContent = role.number;
  roleTitle.textContent = role.title;
  roleOutcome.textContent = role.outcome;
  roleSupport.textContent = role.support;
}
var requestedRole = new URL(window.location.href).searchParams.get("role");
if (requestedRole && roles[requestedRole]) roleSelect.value = requestedRole;
roleSelect.addEventListener("change", renderRole);
renderRole();
function formPayload() {
  const data = new FormData(form);
  return {
    type: "role-application",
    roleId: data.get("roleId"),
    name: data.get("name"),
    email: data.get("email"),
    timezone: data.get("timezone"),
    portfolioUrl: data.get("portfolioUrl"),
    whyThis: data.get("whyThis"),
    firstMove: data.get("firstMove"),
    realGroup: data.get("realGroup"),
    availability: data.get("availability"),
    supportRequest: data.get("supportRequest"),
    tumblrUrl: data.get("tumblrUrl"),
    termsAcknowledged: data.get("termsAcknowledged") === "on",
    privacyConsent: data.get("privacyConsent") === "on",
    companyWebsite: data.get("companyWebsite")
  };
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    status.textContent = "Complete the marked fields and both consent checks.";
    return;
  }
  submitButton.disabled = true;
  state.textContent = "SENDING";
  status.textContent = "Sending one private application\u2026";
  try {
    const response = await fetch("/api/market-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(formPayload())
    });
    const data = await response.json();
    if (!response.ok || !data.application) throw new Error(data.error || "The application did not arrive.");
    document.querySelector("#receipt-id").textContent = data.application.id;
    document.querySelector("#receipt-role").textContent = selectedRole().title;
    form.hidden = true;
    receipt.hidden = false;
    receipt.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    state.textContent = "NOT SENT";
    status.textContent = error instanceof Error ? error.message : "The application did not arrive. Try again.";
    submitButton.disabled = false;
  }
});
