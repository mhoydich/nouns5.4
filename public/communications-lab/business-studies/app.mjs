import { MODELS, VERSION } from './data.mjs';
import { defaults, calculate, sensitivity, worksheet, markdown, STRESS_FIELDS } from './model.mjs';

const $ = (id) => document.getElementById(id);
const node = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
const state = { id: 'cafe', inputs: Object.fromEntries(MODELS.map((model) => [model.id, defaults(model.id)])), changes: { price: 0, volume: 0, unitCost: 0, fixed: 0 }, questionEdited: false };
const money = (value, decimals = 0) => value === null || value === undefined ? 'Unknown' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
const count = (value) => value === null ? 'Unknown' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
const model = () => MODELS.find((item) => item.id === state.id);

function buildFields() {
  const selected = model();
  $('model-name').textContent = selected.name;
  $('model-unit').textContent = selected.unit;
  $('model-lesson').textContent = selected.lesson;
  $('model-exclusions').textContent = selected.exclusions;
  $('model-formula').textContent = selected.formula;
  $('scale-help').textContent = selected.scaleHelp;
  $('sample-scale').hidden = !selected.sampleScale;
  if (!state.questionEdited) $('study-question').value = selected.question;
  const groups = [ ['unit', 'Per-unit assumptions'], ['scale', 'Operating scale'] ];
  $('assumption-fields').replaceChildren();
  for (const [group, title] of groups) {
    const fieldset = node('fieldset');
    fieldset.append(node('legend', title));
    const grid = node('div', undefined, 'field-grid');
    for (const field of selected.fields.filter((item) => item.group === group)) {
      const wrap = node('div', undefined, 'field');
      const inputId = `assumption-${field.key}`;
      const label = node('label', field.label); label.htmlFor = inputId;
      const input = node('input'); input.type = 'number'; input.id = inputId; input.name = field.key;
      input.min = field.min; input.max = field.max; input.step = field.step;
      input.value = state.inputs[state.id][field.key] ?? '';
      input.placeholder = 'Unknown'; input.inputMode = 'decimal';
      input.setAttribute('aria-describedby', `${inputId}-help`);
      const help = node('span', field.help || field.unit, 'field-help'); help.id = `${inputId}-help`;
      input.addEventListener('input', () => { state.inputs[state.id][field.key] = input.value; update(); });
      wrap.append(label, input, help); grid.append(wrap);
    }
    fieldset.append(grid); $('assumption-fields').append(fieldset);
  }
  $('evidence-list').replaceChildren(...selected.evidence.map((text) => node('li', text)));
  $('question-list').replaceChildren(...selected.questions.map((text) => node('li', text)));
}

function update() {
  const current = model();
  const base = calculate(state.id, state.inputs[state.id]);
  const custom = calculate(state.id, state.inputs[state.id], state.changes);
  const errors = [...new Set([...base.errors, ...custom.errors])];
  const valid = errors.length === 0;
  for (const field of current.fields) {
    const input = $(`assumption-${field.key}`);
    const bad = base.errors.some((error) => error.startsWith(`${field.label}:`));
    input.setAttribute('aria-invalid', String(bad));
  }
  for (const field of STRESS_FIELDS) $(`stress-${field.key}`).setAttribute('aria-invalid', String(custom.errors.some((error) => error.startsWith(`${field.label}:`))));
  $('validation').textContent = errors.length ? errors.join(' ') : base.unknowns.length ? `${base.unknowns.length} assumptions are unknown. Enter operating scale to calculate a monthly remainder; unknowns remain in your worksheet.` : 'All inputs are illustrative. Results update below; no business data is submitted.';
  $('validation').classList.toggle('has-errors', !valid);
  $('unit-result').textContent = valid ? money(base.unitContribution, 2) : 'Check inputs';
  $('unit-cost').textContent = valid ? money(base.unitCost, 2) : '—';
  $('monthly-result').textContent = valid ? money(base.monthlyRemainder) : 'Check inputs';
  $('monthly-result').classList.toggle('negative', valid && base.monthlyRemainder !== null && base.monthlyRemainder < 0);
  $('break-even').textContent = !valid ? '—' : base.monthlyRemainder === null ? 'Unknown' : base.unitContribution <= 0 ? 'No finite value' : count(base.breakEvenPeriod);
  $('break-even-label').textContent = current.breakEvenLabel;
  $('unit-label').textContent = `Contribution / ${current.shortUnit}`;
  $('sales-result').textContent = valid ? money(base.monthlySales) : '—';
  $('cost-breakdown').replaceChildren(...base.breakdown.map((item) => { const row = node('div'); row.append(node('dt', item.label), node('dd', money(item.amount, 2))); return row; }));
  $('sensitivity-body').replaceChildren();
  for (const row of sensitivity(state.id, state.inputs[state.id], state.changes)) {
    const tr = node('tr'); const label = node('th', row.label); label.scope = 'row';
    const unit = node('td', valid ? money(row.result.unitContribution, 2) : '—');
    const monthly = node('td', valid ? money(row.result.monthlyRemainder) : '—');
    if (valid && row.result.monthlyRemainder !== null && row.result.monthlyRemainder < 0) monthly.className = 'negative';
    if (row.label === 'Your combined scenario') tr.className = 'custom-row';
    tr.append(label, unit, monthly); $('sensitivity-body').append(tr);
  }
  $('download-markdown').disabled = !valid;
  $('download-json').disabled = !valid;
  if (valid) $('worksheet-preview').textContent = markdown(worksheet(state.id, state.inputs[state.id], state.changes, { question: $('study-question').value, evidence: $('evidence-notes').value }));
  else $('worksheet-preview').textContent = 'Correct the highlighted assumptions to inspect or download the worksheet.';
}

function download(format) {
  try {
    const result = worksheet(state.id, state.inputs[state.id], state.changes, { question: $('study-question').value, evidence: $('evidence-notes').value });
    const content = format === 'json' ? JSON.stringify(result, null, 2) + '\n' : markdown(result);
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = node('a'); a.href = url; a.download = `ues-${state.id}-study-${VERSION}.${format === 'json' ? 'json' : 'md'}`;
    document.body.append(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('export-status').textContent = `${format === 'json' ? 'JSON' : 'Markdown'} worksheet prepared by your browser. Check your downloads.`;
  } catch (error) { $('export-status').textContent = error.message; }
}

for (const radio of document.querySelectorAll('input[name="study-model"]')) radio.addEventListener('change', () => { state.id = radio.value; buildFields(); update(); });
for (const field of STRESS_FIELDS) {
  const wrap = node('div', undefined, 'field'); const id = `stress-${field.key}`;
  const label = node('label', `${field.label} (%)`); label.htmlFor = id;
  const input = node('input'); input.type = 'number'; input.id = id; input.min = field.min; input.max = field.max; input.step = 1; input.value = 0;
  input.addEventListener('input', () => { state.changes[field.key] = input.value; update(); });
  wrap.append(label, input); $('stress-fields').append(wrap);
}
$('sample-scale').addEventListener('click', () => { Object.assign(state.inputs[state.id], model().sampleScale); buildFields(); update(); $('scale-help').textContent = 'Invented classroom scale loaded. These quantities and fixed budgets are examples, with no connection to a real business.'; });
$('reset-model').addEventListener('click', () => { state.inputs[state.id] = defaults(state.id); buildFields(); update(); });
$('reset-stress').addEventListener('click', () => { for (const field of STRESS_FIELDS) { state.changes[field.key] = 0; $(`stress-${field.key}`).value = 0; } update(); });
$('study-question').addEventListener('input', () => { state.questionEdited = true; update(); });
$('evidence-notes').addEventListener('input', update);
$('download-markdown').addEventListener('click', () => download('markdown'));
$('download-json').addEventListener('click', () => download('json'));
buildFields(); update();
document.documentElement.classList.add('study-ready');
