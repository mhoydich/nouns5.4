import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, FIELDS, calculate, compareRuns, validateBrief } from '../../public/communications-lab/nouns-money/economics.mjs';

const model = changes => calculate({ ...DEFAULTS, ...changes });
const zeroCosts = { paperCost:0, printCost:0, finishCost:0, packagingCost:0, setupCost:0, proofCost:0, laborCost:0 };
test('25-copy scenario includes retained copies, full-run funding and contingency', () => {
  const r = model({});
  assert.equal(r.fixed, 14500); assert.equal(r.unitVariable, 320);
  assert.equal(r.variable, 8000); assert.equal(r.reserve, 2250); assert.equal(r.cost, 24750);
  assert.equal(r.available, 23); assert.equal(r.sold, 23); assert.equal(r.gross, 41400);
  assert.equal(r.surplus, 16650); assert.equal(r.breakEven, 14); assert.equal(r.recoveryPossible, true);
  assert.equal(r.unitCost, 24750 / 23); assert.equal(r.margin, 16650 / 41400 * 100);
});
test('10/25/100 comparison keeps editable rates constant and shows losses', () => {
  const [ten, twentyFive, hundred] = compareRuns(DEFAULTS);
  assert.deepEqual([ten.cost, twentyFive.cost, hundred.cost], [19470,24750,51150]);
  assert.deepEqual([ten.surplus, twentyFive.surplus, hundred.surplus], [-5070,16650,125250]);
  assert.equal(ten.breakEven,11); assert.equal(ten.recoveryPossible,false); assert.ok(ten.margin < 0);
});
test('zero run still includes specified fixed commitments and has no unit cost', () => {
  const r = model({run:0});
  assert.equal(r.cost,15950); assert.equal(r.retained,0); assert.equal(r.sold,0);
  assert.equal(r.unitCost,null); assert.equal(r.margin,null); assert.equal(r.surplus,-15950);
  assert.equal(r.recoveryPossible,false);
});
test('zero price cannot recover a positive outlay and has undefined margin', () => {
  const r = model({price:0});
  assert.equal(r.breakEven,null); assert.equal(r.margin,null); assert.equal(r.surplus,-24750);
});
test('100% deduction yields no receipts and cannot recover a positive outlay', () => {
  const r = model({channelCut:100});
  assert.equal(r.receipts,0); assert.equal(r.breakEven,null); assert.equal(r.margin,null);
});
test('zero outlay needs no sale even with zero run and zero price', () => {
  const r = model({...zeroCosts,run:0,price:0});
  assert.equal(r.cost,0); assert.equal(r.breakEven,0); assert.equal(r.recoveryPossible,true);
  assert.equal(r.margin,null); assert.equal(r.unitCost,null);
});
test('zero sell-through includes unsold stock in cost', () => {
  const r = model({sellThrough:0});
  assert.equal(r.cost,24750); assert.equal(r.sold,0); assert.equal(r.unsold,23);
  assert.equal(r.surplus,-24750); assert.equal(r.breakEven,14);
});
test('fractional sell-through rounds down to whole physical copies', () => {
  assert.equal(model({sellThrough:50}).sold,11);
  assert.equal(model({sellThrough:99}).sold,22);
});
test('retained copies are capped at the printed count', () => {
  const r = model({run:10,retained:100});
  assert.equal(r.retained,10); assert.equal(r.available,0); assert.equal(r.sold,0);
  assert.equal(r.unitCost,null); assert.equal(r.cost,19470);
});
test('channel deductions apply per sold unit, not to costs', () => {
  const r = model({channelCut:25});
  assert.equal(r.netPerSale,1350); assert.equal(r.deductions,10350);
  assert.equal(r.receipts,31050); assert.equal(r.surplus,6300); assert.equal(r.breakEven,19);
});
test('cent arithmetic and cent-rounded deduction do not overstate tiny receipts', () => {
  const r = model({...zeroCosts, paperCost:0.1, printCost:0.2, price:0.01, channelCut:50, contingency:0, run:10, retained:0});
  assert.equal(r.unitVariable,30); assert.equal(r.cost,300); assert.equal(r.netPerSale,0);
  assert.equal(r.breakEven,null);
});
test('break-even is the smallest whole sale count to recover all committed cost', () => {
  for (const run of [0,1,10,25,100,10000]) {
    for (const channelCut of [0,25,40,99.99,100]) {
      const r = model({run,channelCut});
      if (r.breakEven !== null && r.cost > 0) {
        assert.ok(r.breakEven*r.netPerSale >= r.cost);
        assert.ok((r.breakEven-1)*r.netPerSale < r.cost);
      }
      assert.equal(r.surplus,r.receipts-r.cost);
      assert.equal(r.sold+r.unsold+r.retained,r.run);
    }
  }
});
test('negative, blank, malformed and non-finite numeric inputs are rejected', () => {
  for (const key of Object.keys(FIELDS)) {
    for (const value of [-1,'', '  ', 'not a number', Infinity, NaN, null, undefined,{},[]]) {
      const r = model({[key]:value});
      assert.equal(r.valid,false,`${key}: ${String(value)}`);
      assert.ok(r.errors[key]);
    }
  }
});
test('count fractions, percentages over 100 and excessive monetary precision are rejected', () => {
  for (const values of [{run:2.5},{retained:0.5},{sellThrough:101},{channelCut:101},{price:1.001},{contingency:0.001},{run:10001}]) assert.equal(model(values).valid,false);
});
test('validated brief round-trips assumptions and strips unknown properties', () => {
  const input={...DEFAULTS,editionTitle:'<script>example</script>',extra:'discard'};
  const parsed=validateBrief({schema:'nouns-money-production/v1',assumptions:input});
  assert.equal(parsed.editionTitle,input.editionTitle); assert.equal(parsed.extra,undefined);
  assert.deepEqual(calculate(parsed),calculate(DEFAULTS));
});
test('brief rejects invalid schema, oversized labels and partial or invalid assumptions', () => {
  assert.throws(()=>validateBrief(null)); assert.throws(()=>validateBrief({schema:'other'}));
  assert.throws(()=>validateBrief({schema:'nouns-money-production/v1',assumptions:{}}));
  assert.throws(()=>validateBrief({schema:'nouns-money-production/v1',assumptions:{...DEFAULTS,price:-1}}));
  assert.throws(()=>validateBrief({schema:'nouns-money-production/v1',assumptions:{...DEFAULTS,editionTitle:'x'.repeat(81)}}));
});
