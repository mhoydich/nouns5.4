// All values are illustrative USD assumptions. Money is calculated in cents.
export const DEFAULTS = Object.freeze({
  editionTitle: 'Garden study', paper: 'Warm uncoated', finishing: 'Numbered by hand',
  packaging: 'Glassine + story card', channel: 'Studio direct',
  run: 25, retained: 2, sellThrough: 100,
  paperCost: 0.60, printCost: 1.40, finishCost: 0.45, packagingCost: 0.75,
  setupCost: 65, proofCost: 35, laborCost: 45, contingency: 10,
  price: 18, channelCut: 0,
});

export const FIELDS = Object.freeze({
  run: [0, 10000, true], retained: [0, 10000, true], sellThrough: [0, 100],
  paperCost: [0, 10000], printCost: [0, 10000], finishCost: [0, 10000], packagingCost: [0, 10000],
  setupCost: [0, 1000000], proofCost: [0, 1000000], laborCost: [0, 1000000],
  contingency: [0, 100], price: [0, 1000000], channelCut: [0, 100],
});
export function validate(input) {
  const errors = {};
  for (const [key, [min, max, integer]] of Object.entries(FIELDS)) {
    const raw = input[key];
    const value = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
    if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
      errors[key] = `Enter ${integer ? 'a whole number' : 'a number'} from ${min.toLocaleString('en-US')} to ${max.toLocaleString('en-US')}.`;
    } else if (!integer && Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) {
      errors[key] = 'Use at most two decimal places.';
    }
  }
  return errors;
}
const cents = value => Math.round(Number(value) * 100);

export function calculate(input) {
  const errors = validate(input);
  if (Object.keys(errors).length) return { valid: false, errors };
  const run = Number(input.run);
  const retained = Math.min(Number(input.retained), run);
  const available = run - retained;
  const sold = Math.floor(available * Number(input.sellThrough) / 100 + 1e-9);
  const unitVariable = ['paperCost', 'printCost', 'finishCost', 'packagingCost'].reduce((sum, key) => sum + cents(input[key]), 0);
  const fixed = ['setupCost', 'proofCost', 'laborCost'].reduce((sum, key) => sum + cents(input[key]), 0);
  const variable = run * unitVariable;
  const reserve = Math.round((fixed + variable) * Number(input.contingency) / 100);
  const cost = fixed + variable + reserve;
  const price = cents(input.price);
  // Deduction is rounded per sold copy; all copies have the same assumed price.
  const deductionPerSale = Math.round(price * Number(input.channelCut) / 100);
  const netPerSale = price - deductionPerSale;
  const gross = sold * price;
  const deductions = sold * deductionPerSale;
  const receipts = gross - deductions;
  const surplus = receipts - cost;
  const breakEven = cost === 0 ? 0 : netPerSale > 0 ? Math.ceil(cost / netPerSale) : null;
  const recoveryPossible = breakEven !== null && breakEven <= available;
  return {
    valid: true, run, retained, available, sold, unsold: available - sold,
    unitVariable, fixed, variable, reserve, cost, price, netPerSale,
    gross, deductions, receipts, surplus,
    unitCost: available > 0 ? cost / available : null,
    margin: receipts > 0 ? surplus / receipts * 100 : null,
    breakEven, recoveryPossible,
    breakEvenSellThrough: available > 0 && breakEven !== null ? breakEven / available * 100 : null,
  };
}

export function compareRuns(input) {
  return [10, 25, 100].map(run => calculate({ ...input, run }));
}

export function validateBrief(data) {
  if (!data || data.schema !== 'nouns-money-production/v1' || typeof data.assumptions !== 'object' || !data.assumptions) {
    throw new Error('Choose a production brief exported by this desk.');
  }
  const input = { ...DEFAULTS };
  for (const key of Object.keys(FIELDS)) input[key] = data.assumptions[key];
  const errors = validate(input);
  if (Object.keys(errors).length) throw new Error(`Invalid assumption: ${Object.keys(errors)[0]}.`);
  for (const key of ['editionTitle', 'paper', 'finishing', 'packaging', 'channel']) {
    if (typeof data.assumptions[key] !== 'string' || data.assumptions[key].length > 80) throw new Error(`Invalid ${key}.`);
    input[key] = data.assumptions[key];
  }
  return input;
}
