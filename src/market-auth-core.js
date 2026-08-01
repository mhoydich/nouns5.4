export const TEZOS_AUTH_CHALLENGE_SCHEMA = "industrynext.tezos-auth-challenge/v1";
export const TEZOS_AUTH_SESSION_SCHEMA = "industrynext.tezos-auth-session/v1";
export const TEZOS_AUTH_NETWORK = "mainnet";
export const TEZOS_AUTH_SESSION_TTL_MS = 20 * 60 * 1000;

const TEZOS_ADDRESS_PATTERN = /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/;
const AUTH_NONCE_PATTERN = /^[A-Za-z0-9-]{12,160}$/;
const AUTH_STATEMENT = "Authenticate to the Industry Next Work Market. This proves wallet control only; it does not publish a listing, approve work, or authorize a transaction.";

function utf8Hex(value) {
  return [...new TextEncoder().encode(value)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function packTezosMessage(message) {
  const bytes = utf8Hex(message);
  const byteLength = bytes.length / 2;
  if (byteLength > 0xffffffff) throw new Error("The authentication message is too large.");
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
    `Expiration Time: ${expirationTime}`,
  ].join("\n");
}

export function buildTezosAuthChallenge({ origin, address, nonce, now = Date.now() }) {
  if (!TEZOS_ADDRESS_PATTERN.test(address)) {
    throw new Error("Tezos authentication currently supports implicit tz1–tz4 addresses.");
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
    payload: packTezosMessage(message),
  };
}

export function isFreshTezosAuthSession(session, { origin, now = Date.now() }) {
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
  if (issuedAt > now + 60_000 || expiresAt <= now) return false;
  if (expiresAt - issuedAt !== TEZOS_AUTH_SESSION_TTL_MS) return false;
  const expectedMessage = authMessage({
    domain: session.challenge.domain,
    address: session.challenge.address,
    uri: session.challenge.uri,
    nonce: session.challenge.nonce,
    issuedAt: session.challenge.issued_at,
    expirationTime: session.challenge.expiration_time,
  });
  if (session.challenge.statement !== AUTH_STATEMENT || session.challenge.message !== expectedMessage) return false;
  if (session.challenge.payload !== packTezosMessage(expectedMessage)) return false;
  return Boolean(session.public_key && session.signature && session.payload);
}

export function publicTezosAuthProof(session) {
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
    scope: ["market:identity", "market:draft-attribution"],
  };
}
