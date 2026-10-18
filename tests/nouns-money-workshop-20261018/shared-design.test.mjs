import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { importDesign, decodeDesign, prepareWorkshopDesign } from '../../public/communications-lab/nouns-money/workshop-adapter.mjs';
import { nounRects, ASSET_SHA, encodeDesign } from '../../public/communications-lab/nouns-money/shared/model.mjs';
const base=new URL('../../public/communications-lab/nouns-money/',import.meta.url);
const bytes=await readFile(new URL('assets/image-data.json',base));
const data=JSON.parse(bytes);
const example=JSON.parse(await readFile(new URL('./fixtures/example.design.json',import.meta.url),'utf8'));

test('shared asset bytes match the lead and official asset checksum',()=>assert.equal(createHash('sha256').update(bytes).digest('hex'),ASSET_SHA));
test('lead example imports and preserves its exact verified fingerprint',async()=>{
  const result=await importDesign(JSON.stringify(example));
  assert.deepEqual(result,example);
  const prepared=await prepareWorkshopDesign(result,data);
  assert.ok(prepared.svg.includes(example.specimen.id));
  assert.ok(prepared.svg.includes('width="180mm" height="84mm"'));
  assert.ok(prepared.description.includes(example.edition.label));
});
test('cross-project fragment encoding round-trips the sealed design',async()=>{
  const result=await decodeDesign(encodeDesign(example));
  assert.deepEqual(result,example);
});
test('forged identifiers and unsupported source, markup, seed, structure or versions reject',async()=>{
  const mutations=[
    value=>value.specimen.id='NMW1-000000000000',
    value=>value.asset.sourceCommit='wrong',
    value=>value.edition.label='<script>alert(1)</script>',
    value=>value.colors.paper='url(https://example.invalid)',
    value=>value.asset.seed.head=254,
    value=>value.schemaVersion='nmw-design/2',
    value=>value.extra='unrecognized',
  ];
  for(const mutate of mutations) {
    const input=structuredClone(example); mutate(input);
    await assert.rejects(importDesign(JSON.stringify(input)));
  }
  await assert.rejects(decodeDesign('https://example.invalid'));
});
test('shared RLE renderer exactly preserves the canonical default frog rectangles',async()=>{
  const svg=await readFile(new URL('assets/noun-0001.svg',base),'utf8');
  const canonical=Array.from(svg.matchAll(/<rect\b([^>]+)\/>/g),match=>{
    const a=Object.fromEntries(Array.from(match[1].matchAll(/([a-z]+)="([^"]+)"/g),m=>[m[1],m[2]]));
    if(a.fill==='none')return null;
    return {x:Number(a.x),y:Number(a.y),width:Number(a.width),height:Number(a.height),fill:a.fill};
  }).filter(Boolean);
  assert.deepEqual(nounRects({background:0,body:14,accessory:70,head:89,glasses:15},data),canonical);
});
