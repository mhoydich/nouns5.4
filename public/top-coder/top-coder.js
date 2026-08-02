import { mountChallenge } from "./challenge-runner.js";
import { ticket001Tests } from "./ticket-001.js";

mountChallenge({
  id: "IN-TC-001",
  ticket: "001",
  title: "The Messy Queue",
  functionName: "repairQueue",
  canonicalUrl: "https://www.industrynext.xyz/top-coder/",
  storageKey: "industrynext.top-coder.001.draft.v1",
  timeoutMs: 1500,
  timeoutLabel: "1.5 second",
  starterCode: `function repairQueue(records) {
  // Return the ordered array of IDs.

}`,
  testSuite: ticket001Tests,
});
