// Uses an existing jsdom installation read-only. No browser layout/screenshot claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const tooling = process.env.NMW_EXISTING_TOOLING;
if (!tooling) throw new Error('Set NMW_EXISTING_TOOLING to an existing installation containing jsdom. Do not install dependencies.');
const require = createRequire(tooling + '/package.json');
const { JSDOM } = require('jsdom');
const base = new URL('../../public/communications-lab/nouns-money/', import.meta.url);
const html = await readFile(new URL('index.html', base), 'utf8');
const assetBytes = await readFile(new URL('assets/image-data.json', base));
const example = JSON.parse(await readFile(new URL('./fixtures/example.design.json', import.meta.url), 'utf8'));
const key = 'nouns-money-production:v1';
let serial = 0;
const until = async condition => {
  for(let i=0;i<120;i++) { if(condition()) return; await new Promise(resolve=>setTimeout(resolve,5)); }
  throw new Error('Expected DOM state was not reached.');
};
async function boot({ hash='', blocked=false, saved=null }={}) {
  const dom=new JSDOM(html,{url:'http://localhost/communications-lab/nouns-money/'+hash,pretendToBeVisual:true});
  const {window}=dom;
  window.Element.prototype.scrollIntoView=function(){};
  window.HTMLAnchorElement.prototype.click=function(){};
  let printCalls=0;window.print=()=>{printCalls++;};
  const store=window.localStorage;if(saved)store.setItem(key,JSON.stringify(saved));
  const blockedStore={getItem(){throw new Error('Blocked')},setItem(){throw new Error('Blocked')},removeItem(){throw new Error('Blocked')}};
  Object.defineProperties(globalThis,{window:{configurable:true,value:window},document:{configurable:true,value:window.document},location:{configurable:true,value:window.location},localStorage:{configurable:true,value:blocked?blockedStore:store}});
  const blobs=[];
  URL.createObjectURL=blob=>{blobs.push(blob);return'blob:local-specimen';};URL.revokeObjectURL=()=>{};
  globalThis.fetch=async url=>{
    assert.ok(String(url).endsWith('/assets/image-data.json'));
    return{ok:true,arrayBuffer:async()=>assetBytes.buffer.slice(assetBytes.byteOffset,assetBytes.byteOffset+assetBytes.byteLength)};
  };
  await import(new URL('desk.mjs?runtime='+serial++,base));
  const $=id=>window.document.getElementById(id);
  const input=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new window.Event('input',{bubbles:true}));};
  const upload=async data=>{
    const value=typeof data==='string'?data:JSON.stringify(data);
    Object.defineProperty($('import-file'),'files',{configurable:true,value:[{size:value.length,text:async()=>value}]});
    $('import-file').dispatchEvent(new window.Event('change',{bubbles:true}));
  };
  return{dom,window,$,input,upload,store,blobs,printCalls:()=>printCalls};
}
test('runtime boots all calculations and moves between keyboard-accessible stages',async()=>{
  const app=await boot();
  assert.equal(app.$('total-cost').textContent,'$247.50');
  assert.equal(app.$('unit-cost').textContent,'$10.76');
  assert.equal(app.$('margin').textContent,'40.2%');
  assert.equal(app.window.document.querySelectorAll('.comparison-card').length,3);
  app.$('tab-material').dispatchEvent(new app.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  assert.equal(app.$('tab-edition').getAttribute('aria-selected'),'true');
  assert.equal(app.$('panel-material').hidden,true);assert.equal(app.$('panel-edition').hidden,false);
  app.window.document.querySelector('[data-run="10"]').click();
  assert.equal(app.$('total-cost').textContent,'$194.70');assert.equal(app.$('break-even').textContent,'11 copies');
  assert.match(app.$('recovery-copy').textContent,/exceeds/);
  app.dom.window.close();
});
test('invalid edits pause output/export; zero and negative results display clearly',async()=>{
  const app=await boot();
  app.input('price','-1');assert.equal(app.$('total-cost').textContent,'—');assert.equal(app.$('download').disabled,true);
  assert.equal(app.$('price').getAttribute('aria-invalid'),'true');
  app.input('price','0');assert.equal(app.$('download').disabled,false);assert.equal(app.$('break-even').textContent,'Not reachable');
  assert.equal(app.$('surplus').textContent,'-$247.50');assert.equal(app.$('margin').textContent,'—');
  app.input('run','0');assert.equal(app.$('unit-cost').textContent,'—');assert.match(app.$('cost-detail').textContent,/0 printed/);
  app.dom.window.close();
});
test('labels keep cost assumptions; study only saves after explicit action and reset clears it',async()=>{
  const app=await boot();
  app.input('paper','Cotton rag study');assert.equal(app.$('paperCost').value,'0.6');
  app.input('editionTitle','<img src=x onerror=alert(1)>');
  assert.equal(app.$('edition-name').children.length,0);
  assert.equal(app.store.getItem(key),null);
  app.$('save-study').click();const saved=JSON.parse(app.store.getItem(key));
  assert.equal(saved.assumptions.paper,'Cotton rag study');
  assert.ok(saved.assumptions.editionTitle.startsWith('<img'));
  assert.equal(app.$('print-brief').querySelectorAll('img').length,1);
  app.$('reset').click();assert.equal(app.store.getItem(key),null);assert.equal(app.$('editionTitle').value,'Garden study');
  app.dom.window.close();
});
test('brief export preserves calculations, print renders, and malformed import changes nothing',async()=>{
  const app=await boot();
  app.$('download-top').click();const exported=JSON.parse(await app.blobs.at(-1).text());
  assert.equal(exported.schema,'nouns-money-production/v1');assert.equal(exported.resultsInCents.cost,24750);
  app.$('print').click();assert.equal(app.printCalls(),1);assert.match(app.$('print-brief').textContent,/\$247\.50/);
  await app.upload('{bad json');await until(()=>app.$('status').textContent.includes('not valid JSON'));
  assert.equal(app.$('total-cost').textContent,'$247.50');
  app.dom.window.close();
});
test('shared-design import renders verified art, exports original design and nests it in the brief',async()=>{
  const app=await boot();
  await app.upload(example);await until(()=>app.$('design-identity').textContent.includes(example.specimen.id));
  assert.equal(app.$('note-dimensions').textContent,'180 × 84 MM');
  assert.equal(app.window.document.querySelector('.note-art').src,'blob:local-specimen');
  assert.equal(app.$('editionTitle').value,example.edition.label);
  assert.equal(app.$('total-cost').textContent,'$247.50');
  assert.equal(app.store.getItem(key),null);
  app.$('export-design').click();assert.deepEqual(JSON.parse(await app.blobs.at(-1).text()),example);
  app.$('download').click();const brief=JSON.parse(await app.blobs.at(-1).text());assert.deepEqual(brief.workshopDesign,example);
  app.$('save-study').click();assert.deepEqual(JSON.parse(app.store.getItem(key)).workshopDesign,example);
  app.$('reset').click();assert.equal(app.$('export-design').hidden,true);
  await app.upload(brief);await until(()=>app.$('design-identity').textContent.includes(example.specimen.id));
  assert.equal(app.$('total-cost').textContent,'$247.50');
  app.dom.window.close();
});
test('fragment handoff validates fingerprint; forged import leaves current specimen intact',async()=>{
  const hash='#design='+Buffer.from(JSON.stringify(example)).toString('base64url');
  const app=await boot({hash});await until(()=>app.$('design-identity').textContent.includes(example.specimen.id));
  const wrong=structuredClone(example);wrong.specimen.id='NMW1-000000000000';
  await app.upload(wrong);await until(()=>app.$('status').textContent.includes('does not match'));
  assert.ok(app.$('design-identity').textContent.includes(example.specimen.id));
  app.dom.window.close();
});
test('blocked browser storage and invalid fragment leave a usable sample',async()=>{
  const app=await boot({blocked:true,hash:'#design=invalid'});
  await until(()=>app.$('status').textContent.includes('Design could not be loaded'));
  assert.equal(app.$('total-cost').textContent,'$247.50');assert.equal(app.$('download').disabled,false);
  app.$('save-study').click();assert.equal(app.$('total-cost').textContent,'$247.50');
  app.dom.window.close();
});
