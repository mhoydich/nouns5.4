const roles = {
  "small-social-systems-builder": {
    number: "JOB / 011",
    title: "Small Social Systems Builder",
    outcome: "Make one underbuilt social behavior playable with one real group.",
    support: "FOUR WEEKS · AI MODEL + TOOL CREDITS",
  },
  "halation-lead": {
    number: "JOB / 001",
    title: "Halation Lead",
    outcome: "Own the image diary, publish with it, and build its first small circle.",
    support: "30-DAY LOOP · FUNDED AI CREDITS",
  },
  "tag-open-build-lead": {
    number: "JOB / 003",
    title: "TAG Build Lead",
    outcome: "Make a tiny social relay playable with three real groups.",
    support: "FOUR WEEKS · AI MODEL + TOOL CREDITS",
  },
  "playlist-editor-listener-growth": {
    number: "JOB / 002",
    title: "Playlist Editor + Listener Growth Lead",
    outcome: "Create authored listening worlds and learn what earns a return listen.",
    support: "$0 CASH GUARANTEED · POTENTIAL PROJECT REVENUE SHARE",
  },
};

const form = document.querySelector("#market-application");
const roleSelect = document.querySelector("#role-select");
const status = document.querySelector("#application-status");
const state = document.querySelector("#form-state");
const receipt = document.querySelector("#application-receipt");
const roleNumber = document.querySelector("#role-number");
const roleTitle = document.querySelector("#role-title");
const roleOutcome = document.querySelector("#role-outcome");
const roleSupport = document.querySelector("#role-support");
const submitButton = form.querySelector("button[type=submit]");

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

const requestedRole = new URL(window.location.href).searchParams.get("role");
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
    companyWebsite: data.get("companyWebsite"),
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
  status.textContent = "Sending one private application…";
  try {
    const response = await fetch("/api/market-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(formPayload()),
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
