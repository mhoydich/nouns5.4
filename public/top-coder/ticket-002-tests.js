export async function ticket002Tests(candidate) {
  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
  const tests = [
    { id: "empty", run: async () => {
      let calls = 0;
      const output = await candidate([], 3, async () => { calls += 1; });
      return JSON.stringify(output) === "[]" && calls === 0;
    }, message: "An empty input should resolve [] without calling the worker." },
    { id: "order", run: async () => {
      const delays = { alpha: 24, beta: 2, gamma: 10 };
      const output = await candidate(["alpha", "beta", "gamma"], 3, (item, index) => new Promise((resolve) => setTimeout(() => resolve(`${index}:${item}`), delays[item])));
      return JSON.stringify(output) === JSON.stringify(["0:alpha", "1:beta", "2:gamma"]);
    }, message: "Results must keep input order even when work finishes out of order." },
    { id: "limit", run: async () => {
      let active = 0;
      let peak = 0;
      await candidate([1, 2, 3, 4, 5, 6], 2, async (item) => {
        active += 1;
        peak = Math.max(peak, active);
        await wait(8);
        active -= 1;
        return item;
      });
      return peak <= 2;
    }, message: "Active work must never exceed the supplied limit." },
    { id: "fills", run: async () => {
      let active = 0;
      let peak = 0;
      await candidate([1, 2, 3, 4, 5, 6], 3, async (item) => {
        active += 1;
        peak = Math.max(peak, active);
        await wait(8);
        active -= 1;
        return item;
      });
      return peak === 3;
    }, message: "The pool should use available slots instead of running serially." },
    { id: "once", run: async () => {
      const calls = [];
      const items = ["a", "b", "c", "d"];
      const output = await candidate(items, 2, async (item, index) => {
        calls.push(`${index}:${item}`);
        return item.toUpperCase();
      });
      return JSON.stringify(output) === JSON.stringify(["A", "B", "C", "D"])
        && calls.length === items.length
        && new Set(calls).size === items.length;
    }, message: "Call the worker once per item with its original index." },
    { id: "rejects", run: async () => {
      const marker = new Error("marker failure");
      const started = [];
      let caught;
      try {
        await candidate([0, 1, 2, 3, 4], 2, (item, index) => {
          started.push(index);
          if (index === 0) return new Promise((resolve, reject) => setTimeout(() => reject(marker), 2));
          return new Promise((resolve) => setTimeout(() => resolve(item), 28));
        });
      } catch (error) { caught = error; }
      await wait(35);
      return caught === marker && JSON.stringify(started) === JSON.stringify([0, 1]);
    }, message: "Reject with the original error and stop starting new work." },
    { id: "immutable", run: async () => {
      const input = [{ id: "a" }, { id: "b" }, { id: "c" }];
      const before = JSON.stringify(input);
      await candidate(input, 2, async (item) => item.id);
      return JSON.stringify(input) === before;
    }, message: "Do not mutate the input array or its items." },
  ];
  const results = [];
  for (const test of tests) {
    try { results.push({ id: test.id, passed: await test.run(), message: test.message }); }
    catch (error) { results.push({ id: test.id, passed: false, message: error?.message || test.message }); }
  }
  return results;
}
