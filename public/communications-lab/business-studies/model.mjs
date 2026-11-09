import { MODELS, VERSION, OBSERVED_ON, SOURCE_FACTS } from './data.mjs';

export const STRESS_FIELDS = [
  { key: 'price', label: 'Sale price change', min: -50, max: 100 },
  { key: 'volume', label: 'Unit volume change', min: -100, max: 100 },
  { key: 'unitCost', label: 'Listed unit cost change', min: -50, max: 100 },
  { key: 'fixed', label: 'Fixed budget change', min: -50, max: 100 },
];
export const PRESETS = [
  { label: 'Base assumptions', changes: {} },
  { label: 'Volume −15%', changes: { volume: -15 } },
  { label: 'Listed unit cost +15%', changes: { unitCost: 15 } },
  { label: 'Fixed budget +15%', changes: { fixed: 15 } },
];

export function defaults(id) {
  const model = MODELS.find((item) => item.id === id);
  if (!model) throw new Error('Unknown study model');
  return Object.fromEntries(model.fields.map((field) => [field.key, field.default]));
}

export function validate(id, input) {
  const model = MODELS.find((item) => item.id === id);
  if (!model) throw new Error('Unknown study model');
  const values = {}, errors = [], unknowns = [];
  for (const field of model.fields) {
    const raw = input[field.key];
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      values[field.key] = null;
      unknowns.push(field.label);
      continue;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < field.min || value > field.max || (field.integer && !Number.isInteger(value))) {
      values[field.key] = null;
      errors.push(`${field.label}: enter ${field.integer ? 'a whole number' : 'a number'} from ${field.min} to ${field.max}.`);
    } else values[field.key] = value;
  }
  return { model, values, errors, unknowns, valid: errors.length === 0 };
}

export function calculate(id, input, changes = {}) {
  const checked = validate(id, input);
  const shock = {};
  for (const field of STRESS_FIELDS) {
    const raw = changes[field.key] ?? 0;
    const n = Number(raw);
    if (String(raw).trim() === '' || !Number.isFinite(n) || n < field.min || n > field.max) checked.errors.push(`${field.label}: enter a percentage from ${field.min} to ${field.max}.`);
    shock[field.key] = n;
  }
  checked.valid = checked.errors.length === 0;
  const result = { ...checked, changes: shock, unitCost: null, unitContribution: null, monthlyUnits: null, monthlySales: null, monthlyContribution: null, monthlyRemainder: null, breakEvenMonthly: null, breakEvenPeriod: null, breakEvenStatus: checked.valid ? 'unknown_inputs' : 'invalid_inputs', breakdown: [] };
  if (!result.valid) return result;
  const { model, values: v } = checked;
  if (model.unitFields.some((key) => v[key] === null)) return result;
  const line = (label, amount) => result.breakdown.push({ label, amount });
  if (model.costMode === 'percentage') line('Listed variable costs', v.sale * v.variableRate / 100);
  else {
    line('Green coffee after roasting yield', model.weightLb / (v.yield / 100) * v.greenCost);
    line('Processing', v.processing);
    line('Product packaging', v.packaging);
    if (model.id === 'wholesale') {
      line('Delivery allocation', v.delivery);
      line('Payment and collection allowance', v.collection);
    } else {
      line('Payment fees', v.sale * v.feeRate / 100 + v.feeFixed);
      if (model.id === 'subscription') {
        line('Postage', v.shipping);
        line('Fulfillment handling', v.handling);
        line('Replacement acquisition allocation', v.replacement / 100 * v.acquisition);
      }
    }
  }
  const baseCost = result.breakdown.reduce((sum, item) => sum + item.amount, 0);
  result.scenarioSale = v.sale * (1 + shock.price / 100);
  result.unitCost = baseCost * (1 + shock.unitCost / 100);
  result.breakdown = result.breakdown.map((item) => ({ ...item, amount: item.amount * (1 + shock.unitCost / 100) }));
  result.unitContribution = result.scenarioSale - result.unitCost;
  if (v.quantity === null || v.periods === null || v.fixed === null) return result;
  result.monthlyUnits = v.quantity * (1 + shock.volume / 100) * v.periods;
  result.monthlySales = result.monthlyUnits * result.scenarioSale;
  result.monthlyContribution = result.monthlyUnits * result.unitContribution;
  result.scenarioFixed = v.fixed * (1 + shock.fixed / 100);
  result.monthlyRemainder = result.monthlyContribution - result.scenarioFixed;
  result.breakEvenStatus = result.unitContribution > 0 ? 'finite' : 'no_finite_positive_volume';
  if (result.scenarioFixed === 0 && result.unitContribution === 0) {
    result.breakEvenStatus = 'every_volume';
    result.breakEvenMonthly = 0;
    result.breakEvenPeriod = 0;
  } else if (result.unitContribution > 0) {
    // Subtract only a tiny floating-point tolerance before whole-unit rounding.
    result.breakEvenMonthly = Math.max(0, Math.ceil(result.scenarioFixed / result.unitContribution - 1e-10));
    result.breakEvenPeriod = Math.max(0, Math.ceil(result.scenarioFixed / (result.unitContribution * v.periods) - 1e-10));
  }
  return result;
}

export function sensitivity(id, values, changes) {
  return [...PRESETS.map((preset) => ({ label: preset.label, result: calculate(id, values, preset.changes) })), { label: 'Your combined scenario', result: calculate(id, values, changes) }];
}

const record = (result) => Object.fromEntries(['valid', 'errors', 'unknowns', 'changes', 'scenarioSale', 'unitCost', 'unitContribution', 'monthlyUnits', 'monthlySales', 'monthlyContribution', 'scenarioFixed', 'monthlyRemainder', 'breakEvenMonthly', 'breakEvenPeriod', 'breakEvenStatus', 'breakdown'].map((key) => [key, result[key] ?? null]));
export function worksheet(id, values, changes, notes = {}) {
  const model = MODELS.find((item) => item.id === id);
  const base = calculate(id, values);
  const custom = calculate(id, values, changes);
  if (!base.valid || !custom.valid) throw new Error('Correct invalid assumptions before exporting.');
  return {
    title: `University of El Segundo · ${model.name} study`,
    version: VERSION,
    observedOn: OBSERVED_ON,
    status: 'Illustrative study; no named-business results or live inventory',
    model: { id, name: model.name, unit: model.unit, scaleUnit: model.scaleUnit, periodLabel: model.periodLabel },
    question: String(notes.question ?? model.question),
    evidenceNotes: String(notes.evidence ?? ''),
    assumptionStatus: 'All numeric inputs are teaching assumptions or visitor-entered scenarios; official context facts do not supply business inputs.',
    assumptions: model.fields.map((field) => ({ key: field.key, label: field.label, value: base.values[field.key], unit: field.unit, status: base.values[field.key] === null ? 'unknown' : 'illustrative input' })),
    formula: model.formula,
    base: record(base),
    combinedScenario: record(custom),
    sensitivity: sensitivity(id, values, changes).map((row) => ({ label: row.label, ...record(row.result) })),
    exclusions: model.exclusions,
    capacity: 'The schedule is assumed fixed. Recalculate labor, equipment and occupancy when volume crosses capacity.',
    stressMethod: 'Price changes hold the listed base cost per unit constant. The unit-cost shock scales that whole cost bundle; fee contracts, cost mix and staffing tiers need separate analysis.',
    evidenceToCollect: model.evidence,
    questions: model.questions,
    sourceContext: SOURCE_FACTS,
    pointcastDestinations: { businessStudies: 'Draft; publication pending', coffeeAtlas: 'Draft; publication pending', dispensaryAtlas: 'Separate draft; publication pending' },
  };
}

const md = (value) => String(value).replace(/[\\`*_{}\[\]()#+.!<>|]/g, '\\$&');
const number = (value) => value === null || value === undefined ? 'Unknown' : String(value);
const breakEven = (result, key) => result.breakEvenStatus === 'every_volume' ? 'Every volume (threshold 0)' : result.breakEvenStatus === 'no_finite_positive_volume' ? 'No finite positive-volume break-even' : number(result[key]);
export function markdown(document) {
  return [
    `# ${md(document.title)}`,
    `Edition: ${document.version} · source observation: ${document.observedOn}`,
    document.status,
    `Unit: ${md(document.model.unit)}. ${md(document.model.periodLabel)}.`,
    '## Study question', md(document.question),
    '## Evidence notes', md(document.evidenceNotes || 'Unknown; record public sources and remaining questions.'),
    '## Assumptions', document.assumptionStatus,
    ...document.assumptions.map((item) => `- ${md(item.label)}: ${number(item.value)} ${md(item.unit)} (${item.status})`),
    '## Formula', md(document.formula),
    '## Results before exclusions',
    `Base monthly units: ${number(document.base.monthlyUnits)}. Base monthly net sales (USD): ${number(document.base.monthlySales)}. Base monthly contribution (USD): ${number(document.base.monthlyContribution)}. Base fixed budget (USD): ${number(document.base.scenarioFixed)}. Whole units per month at break-even: ${breakEven(document.base, 'breakEvenMonthly')}.`,
    ['| Scenario | Unit contribution (USD) | Monthly remainder (USD) | Whole units per period at break-even |',
     '| --- | ---: | ---: | ---: |',
     ...document.sensitivity.map((row) => `| ${md(row.label)} | ${number(row.unitContribution)} | ${number(row.monthlyRemainder)} | ${breakEven(row, 'breakEvenPeriod')} |`)].join('\n'),
    '## Combined scenario changes',
    ...Object.entries(document.combinedScenario.changes).map(([key, value]) => `- ${md(key)}: ${value}%`),
    '## Limits', document.exclusions, document.capacity, document.stressMethod,
    '## Evidence to collect', ...document.evidenceToCollect.map((item) => `- ${md(item)}`),
    '## Discussion', ...document.questions.map((item) => `- ${md(item)}`),
    '## Dated official context',
    ...document.sourceContext.flatMap((fact) => [`### ${md(fact.title)}`, `${md(fact.display_value)} · ${md(fact.kind)}`, `Period: ${md(fact.period)}. Geography: ${md(fact.geography)}.`, `Observed: ${document.observedOn}. Source: ${fact.url}`, md(fact.summary), md(fact.limitations)]),
    '## Related case studies',
    'PointCast business studies, coffee atlas and the separately owned dispensary atlas remain drafts. Public links are pending verified publication.',
  ].join('\n\n') + '\n';
}
