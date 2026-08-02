export async function ticket001Tests(candidate) {
  const tests = [
    { id: "empty", run: () => JSON.stringify(candidate([])) === "[]", message: "Expected [] for an empty queue." },
    { id: "latest", run: () => JSON.stringify(candidate([
      { id: "alpha", revision: 1, priority: 9, createdAt: "2026-01-01", cancelled: false },
      { id: "alpha", revision: 3, priority: 2, createdAt: "2026-01-03", cancelled: false },
      { id: "alpha", revision: 2, priority: 7, createdAt: "2026-01-02", cancelled: false },
    ])) === JSON.stringify(["alpha"]), message: "Keep only the highest revision for each ID." },
    { id: "cancelled", run: () => JSON.stringify(candidate([
      { id: "gone", revision: 1, priority: 9, createdAt: "2026-01-01", cancelled: false },
      { id: "gone", revision: 2, priority: 9, createdAt: "2026-01-02", cancelled: true },
    ])) === "[]", message: "A cancellation on the current revision removes the ID." },
    { id: "priority", run: () => JSON.stringify(candidate([
      { id: "low", revision: 1, priority: 2, createdAt: "2026-01-01", cancelled: false },
      { id: "high", revision: 1, priority: 8, createdAt: "2026-01-03", cancelled: false },
    ])) === JSON.stringify(["high", "low"]), message: "Sort current active records by descending priority." },
    { id: "time", run: () => JSON.stringify(candidate([
      { id: "later", revision: 1, priority: 5, createdAt: "2026-04-09T12:00:00Z", cancelled: false },
      { id: "earlier", revision: 1, priority: 5, createdAt: "2026-04-09T09:00:00Z", cancelled: false },
    ])) === JSON.stringify(["earlier", "later"]), message: "Use the earliest createdAt to break a priority tie." },
    { id: "duplicate", run: () => JSON.stringify(candidate([
      { id: "alpha", revision: 1, priority: 10, createdAt: "2026-01-01", cancelled: false },
      { id: "alpha", revision: 2, priority: 1, createdAt: "2026-01-02", cancelled: false },
      { id: "beta", revision: 1, priority: 5, createdAt: "2026-01-03", cancelled: false },
    ])) === JSON.stringify(["beta", "alpha"]), message: "A stale high priority must not leak into the release order." },
    { id: "immutable", run: () => {
      const input = [
        { id: "b", revision: 1, priority: 1, createdAt: "2026-01-02", cancelled: false },
        { id: "a", revision: 1, priority: 2, createdAt: "2026-01-01", cancelled: false },
      ];
      const before = JSON.stringify(input);
      candidate(input);
      return JSON.stringify(input) === before;
    }, message: "Do not mutate the input array or its records." },
  ];
  const results = [];
  for (const test of tests) {
    try { results.push({ id: test.id, passed: await test.run(), message: test.message }); }
    catch (error) { results.push({ id: test.id, passed: false, message: error?.message || test.message }); }
  }
  return results;
}
