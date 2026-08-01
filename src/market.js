import {
  TEZOS_AUTH_NETWORK,
  TEZOS_AUTH_SESSION_SCHEMA,
  buildTezosAuthChallenge,
  isFreshTezosAuthSession,
  publicTezosAuthProof,
} from "./market-auth-core.js";

const cards = [...document.querySelectorAll("[data-kind]")];
const opportunityCards = [...document.querySelectorAll("[data-opportunity]")];
const filters = [...document.querySelectorAll("[data-filter]")];
const viewButtons = [...document.querySelectorAll("[data-view]")];
const search = document.querySelector("#market-search");
const status = document.querySelector("#market-status");
const empty = document.querySelector("#empty-market");
const opportunityBoard = document.querySelector("#opportunity-board");
const registry = document.querySelector("#market-registry");
const reset = document.querySelector("#market-reset");

const AUTH_STORAGE_KEY = "industrynext.market.tezos-auth.v1";
const TEZOS_RPC = "https://tezos-mainnet.octez.io";
const authElements = {
  address: document.querySelector("#auth-address"),
  badge: document.querySelector("#auth-badge"),
  button: document.querySelector("#tezos-auth-button"),
  copy: document.querySelector("#copy-auth-proof"),
  disconnect: document.querySelector("#tezos-auth-disconnect"),
  expires: document.querySelector("#auth-expires"),
  formMark: document.querySelector("#listing-auth-mark"),
  status: document.querySelector("#auth-status"),
};

let activeKind = "all";
let activeView = "opportunities";
let authBusy = false;
let authSession = null;
let tezosSdkPromise;
let wallet;
let highlightTimer;

function readStoredAuthSession() {
  try {
    return sessionStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeAuthSession(session) {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Authentication still works for this page view when storage is unavailable.
  }
}

function clearStoredAuthSession() {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // There may be no accessible browser storage to clear.
  }
}

function updateBoard() {
  const query = search.value.trim().toLowerCase();
  let visible = 0;

  opportunityBoard.hidden = activeView !== "opportunities";
  registry.hidden = activeView !== "registry";

  if (activeView === "opportunities") {
    opportunityCards.forEach((card) => {
      card.hidden = Boolean(query && !card.dataset.search.includes(query));
      if (!card.hidden) visible += 1;
    });
    status.textContent = query
      ? `Showing ${visible} active opportunit${visible === 1 ? "y" : "ies"} matching “${query}”.`
      : "Showing 4 open roles and 1 bounded field task.";
  } else {
    cards.forEach((card) => {
      const kindMatch = activeKind === "all" || card.dataset.kind === activeKind;
      const searchMatch = !query || card.dataset.search.includes(query);
      card.hidden = !(kindMatch && searchMatch);
      if (!card.hidden) visible += 1;
    });
    const label = activeKind === "all" ? "market object" : `${activeKind} object`;
    status.textContent = `Showing ${visible} ${label}${visible === 1 ? "" : "s"}${query ? ` matching “${query}”` : ""}.`;
  }

  empty.hidden = visible !== 0;
}

function setView(view) {
  activeView = view;
  viewButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === view)));
  updateBoard();
}

function setFilter(kind) {
  activeKind = kind;
  filters.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === kind)));
  updateBoard();
}

filters.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter)));
viewButtons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
document.querySelectorAll("[data-market-target]").forEach((button) => {
  button.addEventListener("click", () => {
    search.value = "";
    setFilter("all");
    setView("registry");
    const target = document.querySelector(`[data-market-id="${button.dataset.marketTarget}"]`);
    if (!target) return;
    window.clearTimeout(highlightTimer);
    cards.forEach((card) => card.classList.remove("is-highlighted"));
    target.classList.add("is-highlighted");
    const label = target.querySelector(".registry-id span")?.textContent || "linked record";
    status.textContent = `Opened ${label} in the full registry.`;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    highlightTimer = window.setTimeout(() => target.classList.remove("is-highlighted"), 2600);
  });
});
search.addEventListener("input", updateBoard);
reset.addEventListener("click", () => {
  search.value = "";
  setFilter("all");
  setView("opportunities");
  search.focus();
});

for (const [selector, detailsSelector] of [["a[href=\"#tezos-auth\"]", "#tezos-auth"], ["a[href=\"#post-work\"]", "#post-work"]]) {
  document.querySelector(selector)?.addEventListener("click", () => {
    document.querySelector(detailsSelector).open = true;
  });
}

updateBoard();

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

function compactAddress(address) {
  return address ? `${address.slice(0, 9)}…${address.slice(-6)}` : "No Tezos identity";
}

function newNonce() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function setAuthUI(message) {
  const authenticated = Boolean(authSession);
  authElements.badge.textContent = authenticated ? "SIGNED + VERIFIED" : authBusy ? "WALLET OPEN" : "OPTIONAL";
  authElements.badge.dataset.state = authenticated ? "verified" : authBusy ? "busy" : "idle";
  authElements.address.textContent = compactAddress(authSession?.address);
  authElements.button.hidden = authenticated;
  authElements.button.disabled = authBusy;
  authElements.button.textContent = authBusy ? "Check your wallet…" : "Sign in with Tezos";
  authElements.copy.hidden = !authenticated;
  authElements.copy.disabled = authBusy;
  authElements.disconnect.hidden = !authenticated;
  authElements.disconnect.disabled = authBusy;
  authElements.expires.textContent = authenticated
    ? `SESSION ENDS ${new Date(authSession.challenge.expiration_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
    : "20-MINUTE BROWSER SESSION";
  authElements.formMark.textContent = authenticated ? `TEZOS: ${compactAddress(authSession.address)}` : "TEZOS: NOT ATTACHED";
  authElements.formMark.dataset.state = authenticated ? "verified" : "idle";
  authElements.status.textContent = message;
}

async function ensureTezos() {
  if (!tezosSdkPromise) tezosSdkPromise = import(new URL("/tezos-client.js", window.location.origin).toString());
  const sdk = await tezosSdkPromise;
  if (!wallet) {
    wallet = sdk.createTezosWallet({
      name: "Industry Next / Work Market",
      description: "Authenticate a Tezos identity for the Industry Next Work Market.",
      iconUrl: `${window.location.origin}/industry-next-icon.svg`,
      network: { type: TEZOS_AUTH_NETWORK, rpcUrl: TEZOS_RPC },
      preferredNetwork: TEZOS_AUTH_NETWORK,
      colorMode: "light",
    });
    await wallet.client?.beaconIDB?.initDB?.().catch(() => {});
  }
  return { sdk, wallet };
}

async function verifySession(session) {
  if (!isFreshTezosAuthSession(session, { origin: window.location.origin })) return false;
  const { sdk } = await ensureTezos();
  if (sdk.publicKeyToTezosAddress(session.public_key) !== session.address) return false;
  return sdk.verifyTezosSignature(session.payload, session.public_key, session.signature);
}

async function restoreAuthSession() {
  const stored = readStoredAuthSession();
  if (!stored) {
    setAuthUI("Browse freely. Sign only when you want a wallet-attributed draft or portable identity proof.");
    return;
  }
  try {
    const candidate = JSON.parse(stored);
    if (!await verifySession(candidate)) throw new Error("expired");
    authSession = candidate;
    setAuthUI("Wallet control verified locally. This does not grant organization authority or approve a listing.");
  } catch {
    clearStoredAuthSession();
    authSession = null;
    setAuthUI("The previous signed session expired. Browse freely or sign a new challenge.");
  }
}

async function authenticateWithTezos() {
  if (authBusy) return;
  authBusy = true;
  setAuthUI("Opening Beacon. Connect a wallet, then review the free signature request.");
  try {
    const { sdk, wallet: activeWallet } = await ensureTezos();
    let account = await sdk.getActiveWalletAccount(activeWallet);
    if (!account?.address) {
      await activeWallet.requestPermissions({
        network: { type: TEZOS_AUTH_NETWORK, rpcUrl: TEZOS_RPC },
      });
      account = await sdk.getActiveWalletAccount(activeWallet);
    }
    const address = account?.address || await activeWallet.getPKH();
    const publicKey = account?.publicKey || await activeWallet.getPK();
    if (sdk.publicKeyToTezosAddress(publicKey) !== address) {
      throw new Error("The wallet public key does not match the selected address.");
    }

    const challenge = buildTezosAuthChallenge({
      origin: window.location.origin,
      address,
      nonce: newNonce(),
    });
    setAuthUI("Review and sign the authentication message. It is not a transaction and has no network fee.");
    const response = await activeWallet.client.requestSignPayload({
      signingType: "micheline",
      payload: challenge.payload,
      sourceAddress: address,
    });
    if (!response?.signature || !sdk.verifyTezosSignature(challenge.payload, publicKey, response.signature)) {
      throw new Error("The returned signature could not be verified.");
    }

    authSession = {
      schema: TEZOS_AUTH_SESSION_SCHEMA,
      network: TEZOS_AUTH_NETWORK,
      address,
      public_key: publicKey,
      signature: response.signature,
      signing_type: "micheline",
      payload: challenge.payload,
      challenge,
      verified: true,
      verified_at: new Date().toISOString(),
    };
    storeAuthSession(authSession);
    setAuthUI("Wallet control verified locally. This does not grant organization authority or approve a listing.");
  } catch (error) {
    authSession = null;
    clearStoredAuthSession();
    const canceled = error instanceof Error && /abort|cancel|reject|closed|declin/i.test(error.message);
    setAuthUI(canceled
      ? "No session was created. The wallet signature was canceled."
      : error instanceof Error ? `Authentication failed: ${error.message}` : "Authentication did not complete.");
  } finally {
    authBusy = false;
    setAuthUI(authElements.status.textContent);
  }
}

async function signOutTezos() {
  if (authBusy) return;
  authBusy = true;
  clearStoredAuthSession();
  authSession = null;
  setAuthUI("Ending the local session and disconnecting Beacon…");
  try {
    const sdk = await tezosSdkPromise;
    if (sdk && wallet) await sdk.disconnectTezosWallet(wallet);
  } catch {
    // The local signed session is already gone even if a wallet transport cannot close cleanly.
  } finally {
    wallet = undefined;
    tezosSdkPromise = undefined;
    authBusy = false;
    setAuthUI("Signed out. Your market drafts and the public board are unchanged.");
  }
}

authElements.button.addEventListener("click", authenticateWithTezos);
authElements.disconnect.addEventListener("click", signOutTezos);
authElements.copy.addEventListener("click", async () => {
  if (!authSession) return;
  try {
    await copyText(JSON.stringify(publicTezosAuthProof(authSession), null, 2));
    setAuthUI("Portable Tezos identity proof copied. It proves wallet control only.");
  } catch {
    setAuthUI("Copy was unavailable. Sign out and try again if the session has expired.");
  }
});

document.querySelectorAll("[data-copy-brief]").forEach((button) => {
  const original = button.textContent;
  button.addEventListener("click", async () => {
    const brief = {
      ...taskBriefs[button.dataset.copyBrief],
      tezos_auth: publicTezosAuthProof(authSession),
    };
    try {
      await copyText(JSON.stringify(brief, null, 2));
      button.textContent = authSession ? "Signed task brief copied ✓" : "Task brief copied ✓";
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
    tezos_auth: publicTezosAuthProof(authSession),
    authentication_notice: authSession
      ? "The attached signature proves control of the named Tezos address only."
      : "No Tezos identity proof is attached.",
    contact: data.get("contact"),
  };

  output.value = JSON.stringify(listing, null, 2);
  outputWrap.hidden = false;
  copyDraft.hidden = false;
  formStatus.textContent = authSession
    ? `Local draft built with verified Tezos identity ${compactAddress(authSession.address)}.`
    : "Draft built locally without a Tezos identity. Review every term before copying or sharing.";
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

setAuthUI("Browse freely. Sign only when you want a wallet-attributed draft or portable identity proof.");
restoreAuthSession();
