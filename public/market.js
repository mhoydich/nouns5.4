import {
  init_browser_shims
} from "./chunks/chunk-TF5QER46.js";

// src/market.js
init_browser_shims();

// src/market-auth-core.js
init_browser_shims();
var TEZOS_AUTH_CHALLENGE_SCHEMA = "industrynext.tezos-auth-challenge/v1";
var TEZOS_AUTH_SESSION_SCHEMA = "industrynext.tezos-auth-session/v1";
var TEZOS_AUTH_NETWORK = "mainnet";
var TEZOS_AUTH_SESSION_TTL_MS = 20 * 60 * 1e3;
var TEZOS_ADDRESS_PATTERN = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
var AUTH_NONCE_PATTERN = /^[A-Za-z0-9-]{12,160}$/;
var AUTH_STATEMENT = "Authenticate to the Industry Next Work Market. This proves wallet control only; it does not publish a listing, approve work, or authorize a transaction.";
function utf8Hex(value) {
  return [...new TextEncoder().encode(value)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function packTezosMessage(message) {
  const bytes = utf8Hex(message);
  const byteLength = bytes.length / 2;
  if (byteLength > 4294967295) throw new Error("The authentication message is too large.");
  return `0501${byteLength.toString(16).padStart(8, "0")}${bytes}`;
}
function normalizedOrigin(origin) {
  return new URL(origin).origin;
}
function authMessage({ domain, address, uri, nonce, issuedAt, expirationTime }) {
  return [
    "Industry Next Work Market",
    "",
    AUTH_STATEMENT,
    "",
    `Domain: ${domain}`,
    `Address: ${address}`,
    `URI: ${uri}`,
    `Network: ${TEZOS_AUTH_NETWORK}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expirationTime}`
  ].join("\n");
}
function buildTezosAuthChallenge({ origin, address, nonce, now = Date.now() }) {
  if (!TEZOS_ADDRESS_PATTERN.test(address)) {
    throw new Error("Tezos authentication currently supports implicit tz1\u2013tz4 addresses.");
  }
  if (!AUTH_NONCE_PATTERN.test(nonce)) {
    throw new Error("The authentication nonce is invalid.");
  }
  const uri = normalizedOrigin(origin);
  const domain = new URL(uri).host;
  const issuedAt = new Date(now).toISOString();
  const expirationTime = new Date(now + TEZOS_AUTH_SESSION_TTL_MS).toISOString();
  const message = authMessage({ domain, address, uri, nonce, issuedAt, expirationTime });
  return {
    schema: TEZOS_AUTH_CHALLENGE_SCHEMA,
    network: TEZOS_AUTH_NETWORK,
    domain,
    uri,
    address,
    nonce,
    issued_at: issuedAt,
    expiration_time: expirationTime,
    statement: AUTH_STATEMENT,
    message,
    payload: packTezosMessage(message)
  };
}
function isFreshTezosAuthSession(session, { origin, now = Date.now() }) {
  if (!session || session.schema !== TEZOS_AUTH_SESSION_SCHEMA || session.verified !== true) return false;
  if (session.network !== TEZOS_AUTH_NETWORK || !session.challenge) return false;
  if (session.signing_type !== "micheline") return false;
  if (session.challenge.schema !== TEZOS_AUTH_CHALLENGE_SCHEMA || session.challenge.network !== TEZOS_AUTH_NETWORK) return false;
  if (!TEZOS_ADDRESS_PATTERN.test(session.address) || !AUTH_NONCE_PATTERN.test(session.challenge.nonce)) return false;
  if (session.address !== session.challenge.address) return false;
  if (session.payload !== session.challenge.payload) return false;
  const expectedOrigin = normalizedOrigin(origin);
  if (session.challenge.uri !== expectedOrigin) return false;
  if (session.challenge.domain !== new URL(expectedOrigin).host) return false;
  const issuedAt = Date.parse(session.challenge.issued_at);
  const expiresAt = Date.parse(session.challenge.expiration_time);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return false;
  if (issuedAt > now + 6e4 || expiresAt <= now) return false;
  if (expiresAt - issuedAt !== TEZOS_AUTH_SESSION_TTL_MS) return false;
  const expectedMessage = authMessage({
    domain: session.challenge.domain,
    address: session.challenge.address,
    uri: session.challenge.uri,
    nonce: session.challenge.nonce,
    issuedAt: session.challenge.issued_at,
    expirationTime: session.challenge.expiration_time
  });
  if (session.challenge.statement !== AUTH_STATEMENT || session.challenge.message !== expectedMessage) return false;
  if (session.challenge.payload !== packTezosMessage(expectedMessage)) return false;
  return Boolean(session.public_key && session.signature && session.payload);
}
function publicTezosAuthProof(session) {
  if (!session) return null;
  return {
    schema: session.schema,
    network: session.network,
    address: session.address,
    public_key: session.public_key,
    signature: session.signature,
    signing_type: session.signing_type,
    payload: session.payload,
    challenge: session.challenge,
    verified_client_side: session.verified === true,
    scope: ["market:identity", "market:draft-attribution"]
  };
}

// src/market.js
var cards = [...document.querySelectorAll("[data-kind]")];
var filters = [...document.querySelectorAll("[data-filter]")];
var search = document.querySelector("#market-search");
var status = document.querySelector("#market-status");
var empty = document.querySelector("#empty-market");
var AUTH_STORAGE_KEY = "industrynext.market.tezos-auth.v1";
var TEZOS_RPC = "https://tezos-mainnet.octez.io";
var authElements = {
  address: document.querySelector("#auth-address"),
  badge: document.querySelector("#auth-badge"),
  button: document.querySelector("#tezos-auth-button"),
  copy: document.querySelector("#copy-auth-proof"),
  disconnect: document.querySelector("#tezos-auth-disconnect"),
  expires: document.querySelector("#auth-expires"),
  formMark: document.querySelector("#listing-auth-mark"),
  status: document.querySelector("#auth-status")
};
var activeKind = "all";
var authBusy = false;
var authSession = null;
var tezosSdkPromise;
var wallet;
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
  }
}
function clearStoredAuthSession() {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
  }
}
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
  status.textContent = `Showing ${visible} ${label}${query ? ` matching \u201C${query}\u201D` : ""}.`;
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
var taskBriefs = {
  halation: {
    id: "halation-first-30-days",
    kind: "task",
    organization: "Industry Next",
    parent_job: "Halation Lead",
    outcome: "Run Halation's first 30-day operating loop: publish, invite, learn, and recommend continue, revise, or close.",
    acceptance: "Public work, real invitations, a short evidence trail, and a written decision.",
    reward: "Inside the funded AI-credit lead brief; not a separate bounty.",
    application: "mailto:mh@pointcast.xyz?subject=I want to lead Halation"
  }
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
  return address ? `${address.slice(0, 9)}\u2026${address.slice(-6)}` : "No Tezos identity";
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
  authElements.button.textContent = authBusy ? "Check your wallet\u2026" : "Sign in with Tezos";
  authElements.copy.hidden = !authenticated;
  authElements.copy.disabled = authBusy;
  authElements.disconnect.hidden = !authenticated;
  authElements.disconnect.disabled = authBusy;
  authElements.expires.textContent = authenticated ? `SESSION ENDS ${new Date(authSession.challenge.expiration_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "20-MINUTE BROWSER SESSION";
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
      colorMode: "light"
    });
    await wallet.client?.beaconIDB?.initDB?.().catch(() => {
    });
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
        network: { type: TEZOS_AUTH_NETWORK, rpcUrl: TEZOS_RPC }
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
      nonce: newNonce()
    });
    setAuthUI("Review and sign the authentication message. It is not a transaction and has no network fee.");
    const response = await activeWallet.client.requestSignPayload({
      signingType: "micheline",
      payload: challenge.payload,
      sourceAddress: address
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
      verified_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    storeAuthSession(authSession);
    setAuthUI("Wallet control verified locally. This does not grant organization authority or approve a listing.");
  } catch (error) {
    authSession = null;
    clearStoredAuthSession();
    const canceled = error instanceof Error && /abort|cancel|reject|closed|declin/i.test(error.message);
    setAuthUI(canceled ? "No session was created. The wallet signature was canceled." : error instanceof Error ? `Authentication failed: ${error.message}` : "Authentication did not complete.");
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
  setAuthUI("Ending the local session and disconnecting Beacon\u2026");
  try {
    const sdk = await tezosSdkPromise;
    if (sdk && wallet) await sdk.disconnectTezosWallet(wallet);
  } catch {
  } finally {
    wallet = void 0;
    tezosSdkPromise = void 0;
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
      tezos_auth: publicTezosAuthProof(authSession)
    };
    try {
      await copyText(JSON.stringify(brief, null, 2));
      button.textContent = authSession ? "Signed task brief copied \u2713" : "Task brief copied \u2713";
    } catch {
      button.textContent = "Copy unavailable";
    }
    window.setTimeout(() => {
      button.textContent = original;
    }, 2200);
  });
});
var form = document.querySelector("#listing-form");
var outputWrap = document.querySelector("#draft-output-wrap");
var output = document.querySelector("#draft-output");
var copyDraft = document.querySelector("#copy-draft");
var formStatus = document.querySelector("#form-status");
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
      written_agreement_required: true
    },
    tezos_auth: publicTezosAuthProof(authSession),
    authentication_notice: authSession ? "The attached signature proves control of the named Tezos address only." : "No Tezos identity proof is attached.",
    contact: data.get("contact")
  };
  output.value = JSON.stringify(listing, null, 2);
  outputWrap.hidden = false;
  copyDraft.hidden = false;
  formStatus.textContent = authSession ? `Local draft built with verified Tezos identity ${compactAddress(authSession.address)}.` : "Draft built locally without a Tezos identity. Review every term before copying or sharing.";
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
