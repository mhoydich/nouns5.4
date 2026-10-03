import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MODELS, SOURCE_FACTS } from '../public/communications-lab/business-studies/data.mjs';
import { defaults, calculate, worksheet, markdown, sensitivity } from '../public/communications-lab/business-studies/model.mjs';
const near = (a, b) => assert.ok(Math.abs(a-b) < 1e-8, `${a} != ${b}`);

test('agreed café example and whole-unit break-even remain synchronized', () => {
  const r = calculate('cafe', defaults('cafe'));
  near(r.monthlyUnits,4680); near(r.monthlySales,32760); near(r.unitContribution,4.9);
  near(r.monthlyContribution,22932); near(r.monthlyRemainder,3932);
  assert.equal(r.breakEvenMonthly,3878); assert.equal(r.breakEvenPeriod,150);
});
test('distinct coffee channels retain yield, delivery, postage and acquisition', () => {
  const direct=calculate('roastery',defaults('roastery')); near(direct.unitContribution,11.942857142857143);
  const wholesale=calculate('wholesale',defaults('wholesale')); near(wholesale.unitContribution,3.0071428571428562);
  const sub=calculate('subscription',defaults('subscription')); near(sub.unitContribution,13.305714285714285);
  assert.equal(sub.breakdown.find(x=>x.label==='Replacement acquisition allocation').amount,1);
  for(const r of [direct,wholesale,sub]){assert.equal(r.monthlyRemainder,null);assert.equal(r.breakEvenPeriod,null);}
});
test('invented non-café scale is opt-in, while licensed retail starts entirely unknown', () => {
  for(const id of ['roastery','wholesale','subscription']) {
    const m=MODELS.find(x=>x.id===id); const r=calculate(id,{...defaults(id),...m.sampleScale});
    assert.ok(Number.isFinite(r.monthlyRemainder)); assert.ok(r.monthlyUnits>0);
    assert.equal(defaults(id).quantity,null);assert.equal(defaults(id).fixed,null);
  }
  const r=calculate('licensed-retail',defaults('licensed-retail'));
  assert.equal(r.unitContribution,null);assert.equal(r.monthlyRemainder,null);assert.equal(r.unknowns.length,5);
});
test('sensitivity changes are explicit, comparable, and keep the base immutable', () => {
  const values=defaults('cafe'); const original={...values};
  const r=calculate('cafe',values,{volume:-15,unitCost:15});
  near(r.monthlyUnits,3978); near(r.unitCost,2.415);near(r.monthlyRemainder,-760.87);
  near(r.breakdown.reduce((sum,item)=>sum+item.amount,0),r.unitCost);
  assert.deepEqual(values,original);assert.equal(sensitivity('cafe',values,{}).length,5);
  const price=calculate('cafe',values,{price:10});near(price.unitCost,2.1);near(price.scenarioSale,7.7);
});
test('yield change follows green-to-roasted weight rather than an invoice index', () => {
  const r=calculate('roastery',{...defaults('roastery'),yield:75});
  near(r.breakdown[0].amount,6);near(r.unitContribution,11.3);
});
test('zero volume and zero or negative contribution cannot invent profitable break-even', () => {
  let r=calculate('cafe',{...defaults('cafe'),quantity:0});near(r.monthlyRemainder,-19000);
  r=calculate('cafe',{...defaults('cafe'),variableRate:100});assert.equal(r.unitContribution,0);assert.equal(r.breakEvenMonthly,null);assert.equal(r.breakEvenStatus,'no_finite_positive_volume');
  assert.ok(markdown(worksheet('cafe',{...defaults('cafe'),variableRate:100},{})).includes('No finite positive-volume break-even'));
  r=calculate('cafe',defaults('cafe'),{unitCost:100,price:-50});assert.ok(r.unitContribution<0);assert.equal(r.breakEvenPeriod,null);
  r=calculate('cafe',{...defaults('cafe'),fixed:0});assert.equal(r.breakEvenPeriod,0);assert.ok(!Object.is(r.breakEvenPeriod,-0));
});
test('missing assumptions remain unknown and invalid numbers block export', () => {
  const incomplete=calculate('cafe',{...defaults('cafe'),fixed:''});assert.equal(incomplete.monthlyRemainder,null);assert.ok(incomplete.valid);
  for(const values of [{yield:0},{greenCost:Infinity},{yield:101}]) assert.equal(calculate('roastery',{...defaults('roastery'),...values}).valid,false);
  assert.equal(calculate('cafe',{...defaults('cafe'),periods:1.5}).valid,false);
  assert.equal(calculate('cafe',defaults('cafe'),{volume:-101}).valid,false);
  assert.equal(calculate('cafe',defaults('cafe'),{price:''}).valid,false);
  assert.throws(()=>worksheet('cafe',{...defaults('cafe'),sale:'<script>'},{}));
});
test('worksheet retains precise inputs, results, source periods, unknowns and user text', () => {
  const text='A <script> & [link](https://example.test) — café\nSecond line';
  const w=worksheet('subscription',defaults('subscription'),{unitCost:15},{question:text,evidence:'Unknown'});
  assert.equal(w.question,text);assert.equal(w.base.monthlyRemainder,null);
  assert.equal(w.assumptions.find(x=>x.key==='quantity').status,'unknown');
  near(w.base.unitContribution,13.305714285714285);
  assert.equal(w.sourceContext.length,6);assert.ok(w.sourceContext.every(x=>x.period&&x.observed_on&&x.url.startsWith('https://')));
  const output=markdown(w);assert.ok(output.includes('\\<script\\>'));assert.ok(output.includes(String(w.base.unitContribution)));
  assert.match(output,/\| Scenario[^\n]+\n\| ---[^\n]+\n\| Base assumptions/);
  assert.ok(output.includes('remain drafts'));assert.ok(!output.includes('https://pointcast.xyz/ues/'));
  const cafe=markdown(worksheet('cafe',defaults('cafe'),{}));assert.ok(cafe.includes('32760'));assert.ok(cafe.includes('3878'));
  assert.doesNotThrow(()=>JSON.parse(JSON.stringify(w)));
});
test('each model is usable as a partial worksheet and sources keep their separate units', () => {
  assert.equal(MODELS.length,5);assert.equal(new Set(MODELS.map(x=>x.id)).size,5);
  for(const m of MODELS) assert.doesNotThrow(()=>markdown(worksheet(m.id,defaults(m.id),{})));
  assert.ok(SOURCE_FACTS.find(x=>x.id==='global-coffee-forecast').kind.includes('forecast'));
  assert.ok(SOURCE_FACTS.every(x=>x.limitations.length>30));
});
test('scope stays local and every official context fact has a readable source fallback', async () => {
  const dir=new URL('../public/communications-lab/business-studies/',import.meta.url);
  const html=await readFile(new URL('index.html',dir),'utf8');
  const app=await readFile(new URL('app.mjs',dir),'utf8');
  for(const fact of SOURCE_FACTS) assert.ok(html.includes(fact.url));
  assert.ok(html.includes('static-example'));assert.ok(html.includes('name="robots" content="noindex"'));
  assert.ok(!html.includes('href="https://pointcast.xyz/ues/business'));assert.ok(!html.includes('href="https://pointcast.xyz/ues/coffee'));
  assert.ok(!/fetch\s*\(|localStorage|sessionStorage|innerHTML|sendBeacon|XMLHttpRequest/.test(app));
  assert.ok(!/open-ad-network|data-pointcast-network|JobPosting|<form\b/.test(html));
  assert.ok(html.includes('./source-ledger.json'));assert.ok(html.includes('href="../"'));
});
