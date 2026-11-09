// Packaging spec-to-quote engine for the Industry Next manufacturing file.
// Pure functions, no network, no storage. The page imports it in the browser
// and scripts/verify-manufacturing.mjs imports it in Node.
//
// Every price here is a practice number for the demo. A real quote comes from
// the packaging supplier, and a person signs the spec before anything is ordered.

export const PALLET = { length: 48, width: 40, height: 5.5, maxLoadLb: 2000, maxStackIn: 60 };

const PADDING_IN = { standard: 1, fragile: 2, precision: 3 };
const AIR_DIM_DIVISOR = 166; // cubic inches per pound, the usual US air dim factor

const round = (n, places = 1) => {
  const f = 10 ** places;
  return Math.round(n * f) / f;
};

const money = (n) => Math.round(n);

export function normalize(input = {}) {
  const num = (v, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  return {
    part: String(input.part || "Machined part").slice(0, 80),
    length: num(input.length, 0),
    width: num(input.width, 0),
    height: num(input.height, 0),
    weight: num(input.weight, 0),
    quantity: Math.max(1, Math.floor(num(input.quantity, 1))),
    care: ["standard", "fragile", "precision"].includes(input.care) ? input.care : "standard",
    mode: ["ltl", "parcel", "ocean", "air"].includes(input.mode) ? input.mode : "ltl",
    stackable: input.stackable !== false && input.stackable !== "false",
  };
}

export function validate(spec) {
  const missing = [];
  for (const key of ["length", "width", "height", "weight"]) {
    if (!spec[key]) missing.push(key);
  }
  return missing;
}

export function chooseFormat(spec) {
  const longest = Math.max(spec.length, spec.width, spec.height);
  if (spec.weight > 150 || longest > 48 || (spec.care === "precision" && spec.weight > 70)) {
    return spec.mode === "ocean" ? "export-crate" : "crate";
  }
  if (spec.weight > 65 || spec.care !== "standard") return "double-wall";
  return "single-wall";
}

const FORMAT_LABEL = {
  "single-wall": "Single-wall corrugated box",
  "double-wall": "Double-wall corrugated box with foam corners",
  crate: "Wooden crate on skids",
  "export-crate": "Heat-treated export crate on skids (ISPM 15 stamped)",
};

// How many packed units fit on one 48 x 40 pallet, trying both footprints.
export function palletPlan(outside, weight, stackable) {
  const fits = (a, b) => Math.floor(PALLET.length / a) * Math.floor(PALLET.width / b);
  const perLayer = Math.max(fits(outside.length, outside.width), fits(outside.width, outside.length));
  if (perLayer < 1) return { perLayer: 0, layers: 0, perPallet: 0 };
  const usable = PALLET.maxStackIn - PALLET.height;
  const byHeight = stackable ? Math.max(1, Math.floor(usable / outside.height)) : 1;
  const byWeight = Math.max(1, Math.floor(PALLET.maxLoadLb / (weight * perLayer)));
  const layers = Math.max(1, Math.min(byHeight, byWeight));
  return { perLayer, layers, perPallet: perLayer * layers };
}

const surfaceSqft = (o) => (2 * (o.length * o.width + o.length * o.height + o.width * o.height)) / 144;

function unitCost(format, outside) {
  const sqft = surfaceSqft(outside);
  switch (format) {
    case "single-wall":
      return 0.6 + sqft * 0.18;
    case "double-wall":
      return (0.6 + sqft * 0.18) * 1.6 + 2.5; // foam corners
    case "crate":
      return 45 + sqft * 3.5;
    case "export-crate":
      return (45 + sqft * 3.5) * 1.15 + 6; // heat treatment and stamp
    default:
      return 0;
  }
}

export function quote(rawInput) {
  const spec = normalize(rawInput);
  const missing = validate(spec);
  if (missing.length) return { ok: false, spec, missing };

  const pad = PADDING_IN[spec.care];
  const format = chooseFormat(spec);
  const wall = format.includes("crate") ? 1.5 : format === "double-wall" ? 0.5 : 0.25;
  const skid = format.includes("crate") ? 4 : 0;

  const inside = {
    length: round(spec.length + 2 * pad),
    width: round(spec.width + 2 * pad),
    height: round(spec.height + 2 * pad),
  };
  const outside = {
    length: round(inside.length + 2 * wall),
    width: round(inside.width + 2 * wall),
    height: round(inside.height + 2 * wall + skid),
  };
  const tare = format.includes("crate") ? round(surfaceSqft(outside) * 2.2 + 10, 0) : format === "double-wall" ? 3 : 1;
  const grossEach = round(spec.weight + tare, 1);
  const cubicFeet = (outside.length * outside.width * outside.height) / 1728;
  const density = round(grossEach / cubicFeet, 1);

  const crated = format.includes("crate");
  const palletized = !crated && spec.mode !== "parcel";
  const plan = palletized ? palletPlan(outside, grossEach, spec.stackable) : null;
  const pallets = plan && plan.perPallet ? Math.ceil(spec.quantity / plan.perPallet) : 0;

  const each = unitCost(format, outside);
  const palletEach = spec.mode === "ocean" ? 24 : 16;
  const material = each * spec.quantity + pallets * palletEach;
  const low = money(material * 0.8);
  const high = money(material * 1.25);

  const shipWeight = round(grossEach * spec.quantity + pallets * 45, 0);
  const airDim = spec.mode === "air" ? round((outside.length * outside.width * outside.height) / AIR_DIM_DIVISOR, 0) : null;

  const flags = [];
  if (spec.mode === "ocean") flags.push("Any wood in the shipment, pallets included, needs ISPM 15 heat treatment and the stamp.");
  if (spec.mode === "air" && airDim > grossEach) flags.push(`Air bills on size here: about ${airDim} lb dimensional weight per unit against ${grossEach} lb actual.`);
  if (spec.mode === "parcel" && grossEach > 70) flags.push("Over about 70 lb a unit, most parcel carriers add handling fees or refuse it. LTL is likely cheaper.");
  if (spec.care === "precision") flags.push("Precision parts usually want a moisture barrier bag and a tilt or shock indicator. Confirm with the customer.");
  if (!spec.stackable && palletized) flags.push("Marked do-not-stack, so pallets ship one layer high.");
  if (palletized && plan && plan.perPallet === 0) flags.push("Too big for a 48 x 40 pallet. This needs a custom skid.");

  const questions = [
    "Does the part need ESD protection, rust inhibitor or a moisture barrier?",
    "Is anything hazardous, oily or under pressure?",
    "Does the customer have its own labeling, part marking or packaging spec?",
    "Who signs off on this spec before the supplier quotes it?",
  ];

  return {
    ok: true,
    spec,
    format,
    formatLabel: FORMAT_LABEL[format],
    padding: pad,
    inside,
    outside,
    grossEach,
    density,
    plan,
    pallets,
    crates: crated ? spec.quantity : 0,
    shipWeight,
    airDim,
    cost: { low, high, eachLow: money(each * 0.8 * 100) / 100, eachHigh: money(each * 1.25 * 100) / 100 },
    flags,
    questions,
  };
}

const MODE_LABEL = { ltl: "Domestic LTL truck", parcel: "Parcel", ocean: "Export by ocean", air: "Air freight" };

export function rfqText(q) {
  if (!q.ok) return "";
  const d = (o) => `${o.length} x ${o.width} x ${o.height} in`;
  const lines = [
    `PACKAGING REQUEST FOR QUOTE (DRAFT, NOT YET SIGNED)`,
    ``,
    `Part: ${q.spec.part}`,
    `Part size: ${d(q.spec)}, ${q.spec.weight} lb each`,
    `Quantity: ${q.spec.quantity}`,
    `Shipping: ${MODE_LABEL[q.spec.mode]}${q.spec.stackable ? "" : ", do not stack"}`,
    ``,
    `Format: ${q.formatLabel}`,
    `Cushion: ${q.padding} in on every side`,
    `Inside dimensions: ${d(q.inside)}`,
    `Outside dimensions (est.): ${d(q.outside)}`,
    `Gross weight each (est.): ${q.grossEach} lb`,
  ];
  if (q.pallets) lines.push(`Pallets: ${q.pallets} x 48 x 40, ${q.plan.perPallet} units each (${q.plan.perLayer} per layer x ${q.plan.layers})`);
  if (q.crates) lines.push(`Crates: ${q.crates}, one unit each`);
  lines.push(`Shipment weight (est.): ${q.shipWeight} lb`);
  if (q.flags.length) {
    lines.push(``, `Notes:`);
    for (const f of q.flags) lines.push(`- ${f}`);
  }
  lines.push(``, `Open questions before quoting:`);
  for (const item of q.questions) lines.push(`- ${item}`);
  lines.push(``, `Approved by: ____________________   Date: __________`);
  return lines.join("\n");
}
