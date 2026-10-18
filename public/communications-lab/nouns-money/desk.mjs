import { DEFAULTS, FIELDS, calculate, compareRuns, validateBrief } from './economics.mjs';

const $ = id => document.getElementById(id);
const storageKey = 'nouns-money-production:v1';
const art = Object.freeze({
  title: 'Garden study', portrait: 'assets/noun-0001.svg', composition: 'assets/garden-note.svg',
  seed: { background: 0, body: 14, accessory: 70, head: 89, glasses: 15 },
  repository: 'https://github.com/nounsDAO/nouns-monorepo',
  commit: '2213eea1c15f331f786784c2621d53bdecf907e2',
  assetSha256: 'a03f22b7838b35fdf0332617c9b8e2b032eb26cf1632afbefb200fec64c4bc20',
  portraitSha256: '1b8b71f2166e38eeaa9b232c9e2529f462bbd4753d1c45ab20c27b63de58a5aa',
  license: 'CC0-1.0', mintedIdentity: null,
});
const checkIds = ['proof', 'quote', 'rights', 'pack', 'story'];
let assumptions = { ...DEFAULTS };
let checks = Object.fromEntries(checkIds.map(key => [key, false]));
let storageWorks = true;
let currentStage = 'material';
let importedWorkshopProject = null;
let restoreDesign = null;
let importRevision = 0;
let noteBlobUrl = null;
const money = value => value === null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value / 100);
const count = value => new Intl.NumberFormat('en-US').format(value);
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const text = (id, value) => { $(id).textContent = value; };

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (saved) {
    assumptions = validateBrief(saved);
    restoreDesign = saved.workshopDesign || null;
    for (const key of checkIds) checks[key] = saved.checklist?.[key] === true;
  }
} catch { storageWorks = false; }

function brief() {
  const result = calculate(assumptions);
  return {
    schema: 'nouns-money-production/v1',
    title: 'Nouns Money Workshop · Production desk',
    kind: 'illustrative-collectible-art-production-study',
    currency: 'USD',
    assumptions: { ...assumptions, ...Object.fromEntries(Object.keys(FIELDS).map(key => [key, Number(assumptions[key])])) },
    resultsInCents: result.valid ? result : null,
    checklist: { ...checks },
    checklistMeaning: 'User-marked local notes; not independently verified.',
    art: importedWorkshopProject ? { title: importedWorkshopProject.edition.label, seed: importedWorkshopProject.asset.seed, commit: importedWorkshopProject.asset.sourceCommit, assetSha256: importedWorkshopProject.asset.sourceSha256, license: 'CC0-1.0', mintedIdentity: null } : art,
    ...(importedWorkshopProject ? { workshopDesign: importedWorkshopProject } : {}),
    model: {
      version: 1,
      wholeRunPaidUpfront: true,
      salesRounding: 'floor(available copies × sell-through)',
      channelRounding: 'deduction rounded to nearest cent per sold copy',
      breakEven: 'ceil(entire edition cost / net receipt per sale); zero cost = 0; positive cost and zero receipt = null',
      margin: 'surplus / net receipts; undefined for zero receipts',
      excluded: ['tax', 'shipping', 'equipment', 'storage', 'unentered overhead'],
    },
    notice: 'Editable example assumptions, not quotes or actual sales. Collectible art only. No currency issuance, redemption, ownership, return, affiliation or production guarantee.',
  };
}
function persist() {
  if (!calculate(assumptions).valid) return;
  try { localStorage.setItem(storageKey, JSON.stringify(brief())); storageWorks = true; return true; }
  catch {
    text('status', 'Browser storage is unavailable. Export a brief to keep this study.');
    storageWorks = false; return false;
  }
}
function applyInputs() {
  for (const [key, value] of Object.entries(assumptions)) {
    const element = $(key);
    if (!element) continue;
    if (element.tagName === 'SELECT' && !Array.from(element.options).some(option => option.value === value)) {
      const option = document.createElement('option');
      option.value = String(value); option.textContent = String(value); element.append(option);
    }
    element.value = String(value);
  }
  for (const element of document.querySelectorAll('[data-check]')) element.checked = checks[element.dataset.check] === true;
}
function activate(stage, focus = false) {
  currentStage = stage;
  for (const tab of document.querySelectorAll('[role=tab]')) {
    const selected = tab.id === `tab-${stage}`;
    tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
    $(tab.getAttribute('aria-controls')).hidden = !selected;
  }
  if (focus) {
    $(`tab-${stage}`).focus({ preventScroll: true });
    document.querySelector('.control-column').scrollIntoView({ behavior: 'auto', block: 'start' });
  }
}
for (const [index, tab] of Array.from(document.querySelectorAll('[role=tab]')).entries()) {
  tab.addEventListener('click', () => activate(tab.id.replace('tab-', '')));
  tab.addEventListener('keydown', event => {
    const tabs = Array.from(document.querySelectorAll('[role=tab]'));
    let target = null;
    if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') target = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === 'Home') target = tabs[0];
    if (event.key === 'End') target = tabs.at(-1);
    if (target) { event.preventDefault(); activate(target.id.replace('tab-', '')); target.focus(); }
  });
}
document.addEventListener('click', event => {
  const next = event.target.closest('[data-next]');
  if (next) activate(next.dataset.next, true);
  const preset = event.target.closest('[data-run]');
  if (preset) {
    assumptions.run = Number(preset.dataset.run); $('run').value = assumptions.run;
    update();
    if (preset.closest('.comparison-cards')) activate('edition', true);
  }
});
for (const key of Object.keys(DEFAULTS)) {
  $(key)?.addEventListener('input', event => {
    assumptions[key] = event.target.value;
    update();
  });
}
for (const checkbox of document.querySelectorAll('[data-check]')) checkbox.addEventListener('change', () => {
  checks[checkbox.dataset.check] = checkbox.checked;
  updateChecklist(); renderPrint();
});

function updateChecklist() {
  const marked = Object.values(checks).filter(Boolean).length;
  text('check-progress', `${marked} of 5 marked in this study.`);
}
function update() {
  const model = calculate(assumptions);
  for (const key of Object.keys(FIELDS)) {
    const error = model.errors?.[key] || '';
    $(key).setAttribute('aria-invalid', String(Boolean(error)));
    if ($(`error-${key}`)) text(`error-${key}`, error);
  }
  text('edition-name', assumptions.editionTitle.trim() || 'Untitled edition');
  text('object-summary', `${assumptions.paper} · ${assumptions.finishing} · ${assumptions.packaging}`);
  text('material-tag', assumptions.paper);
  text('sellThrough-value', assumptions.sellThrough);
  document.querySelector('.story-card').hidden = assumptions.packaging === 'Simple paper band';
  for (const button of document.querySelectorAll('.run-buttons [data-run]')) button.setAttribute('aria-pressed', String(Number(button.dataset.run) === Number(assumptions.run)));
  for (const id of ['download', 'download-top', 'print', 'save-study']) $(id).disabled = !model.valid;
  if (!model.valid) {
    for (const id of ['total-cost', 'unit-cost', 'margin', 'gross', 'deductions', 'receipts', 'receipt-cost', 'surplus', 'break-even']) text(id, '—');
    text('cost-detail', 'Correct the marked assumption');
    text('unit-detail', 'Calculation paused');
    text('run-caption', 'Correct the marked assumption to calculate the run.');
    text('recovery-copy', 'Calculation paused until all assumptions are valid.');
    $('run-visual').replaceChildren();
    $('comparison-cards').replaceChildren();
    text('status', 'Correct the marked assumption. Export is paused.');
    $('print-brief').replaceChildren();
    return;
  }
  if ($('status').textContent.startsWith('Correct the marked')) text('status', '');
  text('total-cost', money(model.cost));
  text('cost-detail', `${count(model.run)} printed · ${count(model.available)} available`);
  text('unit-cost', money(model.unitCost));
  text('unit-detail', model.available ? 'Entire outlay ÷ available copies' : 'No available copies');
  text('margin', model.margin === null ? '—' : `${model.margin.toFixed(1)}%`);
  $('margin').classList.toggle('negative', model.margin !== null && model.margin < 0);
  text('gross', money(model.gross)); text('deductions', money(-model.deductions));
  text('receipts', money(model.receipts)); text('receipt-cost', money(-model.cost));
  text('surplus', money(model.surplus)); $('surplus').classList.toggle('negative', model.surplus < 0);
  text('break-even', model.breakEven === null ? 'Not reachable' : `${count(model.breakEven)} ${model.breakEven === 1 ? 'copy' : 'copies'}`);
  text('recovery-copy', model.cost === 0 ? 'Zero edition outlay: no sales are needed to recover it.' : model.breakEven === null ? 'Each sale yields zero net receipt. This edition cannot recover its cost under these assumptions.' : !model.recoveryPossible ? `This exceeds the ${count(model.available)} available copies. Revisit the price, costs, channel or run.` : `Recover the full run at ${model.breakEvenSellThrough.toFixed(0)}% of available copies. This scenario assumes ${count(model.sold)} sold.`);
  $('break-even').classList.toggle('negative', !model.recoveryPossible);
  text('run-caption', `${count(model.run)} printed → ${count(model.retained)} kept → ${count(model.available)} available. ${model.run > 100 ? 'Diagram shows proportions, up to 100 marks.' : 'Outlined marks are kept copies.'}${Number(assumptions.retained) > model.run ? ' Kept copies capped at the run.' : ''}`);
  const marks = Math.min(model.run, 100);
  const retainedMarks = model.run ? Math.round(model.retained / model.run * marks) : 0;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < marks; i++) { const mark = document.createElement('i'); if (i >= marks - retainedMarks) mark.className = 'retained'; frag.append(mark); }
  $('run-visual').replaceChildren(frag);
  renderComparison(); updateChecklist(); renderPrint();
}
function renderComparison() {
  const models = compareRuns(assumptions);
  const max = Math.max(1, ...models.flatMap(model => [model.cost, model.receipts]));
  $('comparison-cards').innerHTML = models.map(model => `<article class="comparison-card ${model.run === Number(assumptions.run) ? 'selected' : ''}">
    <h3>${model.run} <span>copies</span></h3><p>${model.available} available / ${model.sold} modeled sales</p>
    <div class="mini-bars" aria-hidden="true"><i style="height:${model.cost / max * 55}px"></i><i style="height:${model.receipts / max * 55}px"></i></div><div class="bar-key" aria-hidden="true"><span>Outlay</span><span>Receipts</span></div>
    <dl><dt>Edition outlay</dt><dd>${money(model.cost)}</dd><dt>Cost / available copy</dt><dd>${money(model.unitCost)}</dd><dt>Net receipts</dt><dd>${money(model.receipts)}</dd><dt>Surplus / loss</dt><dd class="${model.surplus < 0 ? 'negative' : ''}">${money(model.surplus)}</dd><dt>Break-even sales</dt><dd>${model.breakEven === null ? 'Unreachable' : count(model.breakEven)}${model.breakEven !== null && !model.recoveryPossible ? ' · outside run' : ''}</dd></dl>
    <button type="button" data-run="${model.run}" aria-label="Use a print run of ${model.run}">Use ${model.run}-copy study <span aria-hidden="true">↗</span></button></article>`).join('');
}
function renderPrint() {
  const model = calculate(assumptions);
  if (!model.valid) return;
  const rows = Object.entries(FIELDS).map(([key]) => `<tr><td>${esc(key.replace(/([A-Z])/g,' $1'))}</td><td>${esc(assumptions[key])}${['sellThrough','channelCut','contingency'].includes(key) ? '%' : ['run','retained'].includes(key) ? ' copies' : ' USD'}</td></tr>`).join('');
  $('print-brief').innerHTML = `<p>INDUSTRYNEXT / NOUNS MONEY WORKSHOP / PRODUCTION STUDY</p><h1>${esc(assumptions.editionTitle || 'Untitled edition')}</h1><p>${esc(assumptions.paper)} · ${esc(assumptions.finishing)} · ${esc(assumptions.packaging)}<br>Collection context: ${esc(assumptions.channel)}</p><img src="${esc(noteBlobUrl || './assets/garden-note.svg')}" alt="Collectible art-note specimen"><h2>The working assumptions</h2><table><thead><tr><th>Assumption</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table><h2>Edition economics</h2><dl><dt>Entire edition cost</dt><dd>${money(model.cost)}</dd><dt>Available / modeled sold</dt><dd>${model.available} / ${model.sold}</dd><dt>Cost per available copy</dt><dd>${money(model.unitCost)}</dd><dt>Net receipts</dt><dd>${money(model.receipts)}</dd><dt>Modeled surplus / loss</dt><dd>${money(model.surplus)}</dd><dt>Margin (surplus / net receipts)</dt><dd>${model.margin === null ? 'Undefined' : model.margin.toFixed(1)+'%'}</dd><dt>Cash break-even sales</dt><dd>${model.breakEven === null ? 'Unreachable' : model.breakEven}${!model.recoveryPossible && model.breakEven !== null ? ' — outside run' : ''}</dd></dl><h2>Release notes</h2><p>${checkIds.map(key => `${checks[key] ? '[x]' : '[ ]'} ${esc(key)}`).join(' · ')}</p><p>Checklist marks are local user notes; they do not verify production. All costs and sales are illustrative. No order, payment or publication has occurred.</p><footer>Original Nouns artwork · CC0. Seed ${importedWorkshopProject ? Object.values(importedWorkshopProject.asset.seed).join(',') : '0,14,70,89,15'}. ${importedWorkshopProject ? esc(importedWorkshopProject.specimen.id)+' — repeatable design fingerprint.' : ''} Source commit 2213eea1c15f331f786784c2621d53bdecf907e2. Local trait combination, not a minted Noun identity. Collectible art only; no currency issuance, redemption, financial returns or official affiliation. Model assumes the entire run paid upfront; taxes, shipping, equipment, storage and unentered overhead excluded. Quote and physical proof required before production.</footer>`;
}
function downloadBrief() {
  if (!calculate(assumptions).valid) return;
  const blob = new Blob([JSON.stringify(brief(), null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = 'nouns-money-production-brief.json';
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  text('status', 'Production brief exported. The file contains your assumptions and modeled results.');
}
$('save-study').addEventListener('click', () => { if (persist()) text('status', 'Study saved in this browser only. Clearing browser data removes it.'); });
$('download').addEventListener('click', downloadBrief);
$('download-top').addEventListener('click', downloadBrief);
$('print').addEventListener('click', () => { renderPrint(); window.print(); });
$('reset').addEventListener('click', () => {
  importRevision++;
  resetArtwork(); restoreDesign = null;
  try { localStorage.removeItem(storageKey); } catch {}
  assumptions = { ...DEFAULTS }; checks = Object.fromEntries(checkIds.map(key => [key, false])); importedWorkshopProject = null;
  applyInputs(); update(); text('status', 'Reset to the Garden study example. The stored study was cleared if storage is available.');
});
$('import').addEventListener('click', () => $('import-file').click());
$('import-design').addEventListener('click', () => $('import-file').click());
$('export-design').addEventListener('click', () => {
  if (!importedWorkshopProject) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(importedWorkshopProject, null, 2) + '\n'], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = importedWorkshopProject.specimen.id + '.design.json';
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  text('status', 'The verified Workshop design is exported unchanged, ready for the companion tools.');
});
function resetArtwork() {
  if (noteBlobUrl) URL.revokeObjectURL(noteBlobUrl);
  noteBlobUrl = null; importedWorkshopProject = null; $('export-design').hidden = true;
  const image = document.querySelector('.note-art');
  image.src = './assets/garden-note.svg'; image.width = 900; image.height = 350;
  image.alt = 'Garden study: an original Nouns frog in a collectible art-note specimen.';
  text('note-dimensions', '180 × 70 MM'); text('design-identity', 'Garden specimen / local seed');
}
function commitArtwork(prepared) {
  if (noteBlobUrl) URL.revokeObjectURL(noteBlobUrl);
  importedWorkshopProject = prepared.design;
  $('export-design').hidden = false;
  noteBlobUrl = URL.createObjectURL(new Blob([prepared.svg], { type: 'image/svg+xml' }));
  const image = document.querySelector('.note-art');
  image.src = noteBlobUrl; image.width = 1800; image.height = 840; image.alt = prepared.description;
  text('note-dimensions', '180 × 84 MM');
  text('design-identity', `${prepared.design.specimen.id} / design fingerprint`);
}
$('import-file').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const revision = ++importRevision;
  try {
    if (file.size > 65536) throw new Error('Choose a JSON brief smaller than 64 KB.');
    const data = JSON.parse(await file.text());
    const isDesign = data?.schemaVersion === 'nmw-design/1';
    const nextAssumptions = isDesign ? { ...assumptions } : validateBrief(data);
    const design = isDesign ? data : data.workshopDesign;
    let prepared = null;
    if (design) {
      const adapter = await import('./workshop-adapter.mjs');
      prepared = await adapter.prepareWorkshopDesign(design);
    }
    if (revision !== importRevision) return;
    assumptions = nextAssumptions;
    if (isDesign) assumptions.editionTitle = prepared.design.edition.label;
    else checks = Object.fromEntries(checkIds.map(key => [key, data.checklist?.[key] === true]));
    if (prepared) commitArtwork(prepared); else resetArtwork();
    applyInputs(); update();
    text('status', isDesign ? 'Workshop design verified and imported. Your production assumptions are kept.' : 'Production brief imported. Review the assumptions before using the model.');
  } catch (error) {
    if (revision === importRevision) text('status', error instanceof SyntaxError ? 'That file is not valid JSON. Your current study is unchanged.' : `${error.message} Your current study is unchanged.`);
  }
  event.target.value = '';
});
applyInputs(); update();
if (!storageWorks) text('status', 'Stored study could not be restored. Export a brief to keep this session.');
async function restoreOrReadFragment() {
  const fragment = location.hash.startsWith('#design=') ? location.hash.slice(8) : null;
  if (!fragment && !restoreDesign) return;
  const revision = ++importRevision;
  try {
    const adapter = await import('./workshop-adapter.mjs');
    const design = fragment ? await adapter.decodeDesign(fragment) : restoreDesign;
    const prepared = await adapter.prepareWorkshopDesign(design);
    if (revision !== importRevision) return;
    commitArtwork(prepared);
    if (fragment) assumptions.editionTitle = prepared.design.edition.label;
    applyInputs(); update();
    text('status', fragment ? 'Workshop design verified from this link. Review the production assumptions.' : 'Your saved Workshop design is restored in this browser.');
  } catch (error) {
    if (revision === importRevision) text('status', `Design could not be loaded: ${error.message} The Garden specimen remains usable.`);
  }
}
restoreOrReadFragment();
window.addEventListener('hashchange', () => { if (location.hash.startsWith('#design=')) restoreOrReadFragment(); });
