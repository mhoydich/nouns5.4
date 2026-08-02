export const CHALLENGE_ID = "IN-TC-001";
export const CHECK_COUNT = 7;
export const TOP_CODER_THRESHOLD = 90;

export function scoreProof(results, note = "") {
  const passed = Array.isArray(results) ? results.filter((result) => result?.passed === true).length : 0;
  const correctness = Math.min(CHECK_COUNT, passed) * 10;
  const trimmedNote = String(note).trim();
  const clarity = trimmedNote.length >= 18 ? 20 : trimmedNote.length >= 1 ? 10 : 0;
  const seal = passed === CHECK_COUNT ? 10 : 0;
  return { passed, correctness, clarity, seal, total: correctness + clarity + seal };
}

export function proofLabel(score) {
  if (score >= TOP_CODER_THRESHOLD) return "TOP CODER";
  if (score >= 70) return "REPAIR PASSED / NOTE NEEDED";
  if (score > 0) return "PROOF IN PROGRESS";
  return "RUN THE TICKET";
}

export function noteStatus(note = "") {
  const trimmed = String(note).trim();
  if (trimmed.length >= 18) return trimmed;
  if (trimmed) return "Change note needs a little more detail.";
  return "Waiting for a change note.";
}
