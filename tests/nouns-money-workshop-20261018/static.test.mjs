import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../../public/communications-lab/nouns-money/',import.meta.url));
const html=await readFile(path.join(root,'index.html'),'utf8');
const js=await readFile(path.join(root,'desk.mjs'),'utf8');
const css=await readFile(path.join(root,'desk.css'),'utf8');
const ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]);
test('local document ids are unique, referenced anchors and labels resolve',()=>{
  assert.equal(new Set(ids).size,ids.length);
  for(const match of html.matchAll(/(?:aria-controls|aria-labelledby|aria-describedby|for)="([^"]+)"/g)) {
    for(const id of match[1].split(' ')) assert.ok(ids.includes(id),id);
  }
  for(const [,id] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id),id);
});
test('static local asset references resolve inside the additive directory',async()=>{
  for(const [,ref] of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) {
    const file=path.resolve(root,ref);
    assert.ok(file.startsWith(root)); assert.ok((await stat(file)).isFile(),ref);
  }
});
test('portrait matches canonical manifest and original rectangles remain in composition',async()=>{
  const manifest=JSON.parse(await readFile(path.join(root,'assets/manifest.json'),'utf8'));
  const item=manifest.items[0];
  for(const kind of ['svg','png']) {
    const bytes=await readFile(path.join(root,'assets',item[kind]));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),item[kind+'_sha256']);
  }
  const portrait=await readFile(path.join(root,'assets/noun-0001.svg'),'utf8');
  const note=await readFile(path.join(root,'assets/garden-note.svg'),'utf8');
  assert.ok(note.includes(portrait.slice(portrait.indexOf('>')+1,portrait.lastIndexOf('</svg>'))));
  assert.equal(manifest.source.commit,'2213eea1c15f331f786784c2621d53bdecf907e2');
});
test('no external runtime, form submission, payment, account or network request is added',()=>{
  assert.doesNotMatch(html,/<form\b|<iframe\b|<script[^>]+src="https?:/i);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|document\.cookie|eval\s*\(/);
  assert.doesNotMatch(css,/@import|url\(https?:/);
});
test('desk has four accessible stages, keyboard controls, reduced motion and print layout',()=>{
  assert.equal((html.match(/role="tab"/g)||[]).length,4);
  assert.equal((html.match(/role="tabpanel"/g)||[]).length,4);
  assert.match(js,/ArrowRight/); assert.match(js,/ArrowLeft/); assert.match(js,/event\.key === 'Home'/);
  assert.match(css,/prefers-reduced-motion/); assert.match(css,/@media print/);
  assert.match(html,/role="status"/); assert.match(html,/class="skip"/);
});
test('exports are bounded and imports cannot insert unescaped markup into the page',()=>{
  assert.match(js,/file\.size > 65536/);
  assert.match(js,/textContent = value/);
  assert.match(js,/esc\(assumptions\.editionTitle/);
  assert.match(js,/URL\.revokeObjectURL/);
});
test('publication payload stays below 600 KB and all files are additive static assets',async()=>{
  let total=0;
  async function visit(dir) { for(const entry of await readdir(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name); if(entry.isDirectory()) await visit(file); else total+=(await stat(file)).size;
  }}
  await visit(root); assert.ok(total<600000,`${total} bytes`);
});
