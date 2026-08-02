import { mountChallenge } from "../challenge-runner.js";
import { ticket002Tests } from "../ticket-002-tests.js";

mountChallenge({
  id: "IN-TC-002",
  ticket: "002",
  title: "The Promise Pool",
  functionName: "mapWithLimit",
  canonicalUrl: "https://www.industrynext.xyz/top-coder/002/",
  storageKey: "industrynext.top-coder.002.draft.v1",
  timeoutMs: 2500,
  timeoutLabel: "2.5 second",
  starterCode: `async function mapWithLimit(items, limit, worker) {
  // Resolve results in input order without exceeding limit.

}`,
  testSuite: ticket002Tests,
});
