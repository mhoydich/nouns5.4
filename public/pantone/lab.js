(() => {
  'use strict';
  const form = document.querySelector('#brief-form');
  if (!form) return;
  const keys = ['reference', 'substrate', 'proof', 'owner'];
  const labels = {reference:'Reference, edition or original color intent',substrate:'Material, surface and production method',proof:'Proof and viewing conditions',owner:'Approver, revision and acceptance method'};
  const jobs = {
    poster: {title:'Neighborhood poster', note:'A proposed paper poster. Decide how the final stock, finish and viewing location affect the brief.', question:'Which paper weight, coating and finish will be used for the proof and the final run?'},
    sleeve: {title:'Coffee bag sleeve', note:'A proposed paper sleeve around a coffee bag. This is packaging concept work, not an approved food-contact specification.', question:'Will the sleeve use coated or uncoated stock, and how will folds, rubbing and finishing affect it?'},
    shirt: {title:'Workshop shirt', note:'A proposed textile print. A paper reference alone cannot approve fabric, ink, opacity, curing or wash performance.', question:'Which fabric, base color, ink system and underbase will be tested before any production run?'}
  };
  const methods = {
    process:{label:'Process print',question:'Which process and output profile will be used, and which physical proof demonstrates the achievable result?'},
    spot:{label:'Spot ink',question:'Which physical reference or approved original sample should the ink target, and on which substrate?'},
    digital:{label:'Digital mockup only',question:'How will the mockup be marked as a screen approximation, and what physical proof is still needed?'}
  };
  const priorities = {
    consistency:{label:'Consistency between batches',question:'What approved sample, revision identifier and comparison method will travel to the next batch?'},
    material:{label:'Material character',question:'Which natural surface variation is intentional, and what variation would trigger a review?'},
    budget:{label:'Small-run practicality',question:'Which existing process can the maker quote without new tooling, and what are its minimum-run and proof constraints?'}
  };
  const status = document.querySelector('#action-status');
  const valid = (value, data, fallback) => Object.hasOwn(data,value) ? value : fallback;
  function state() { return {job:valid(form.elements.job.value,jobs,'poster'),method:valid(form.elements.method.value,methods,'process'),priority:valid(form.elements.priority.value,priorities,'consistency'),checks:keys.filter(k=>form.elements[k].checked)}; }
  function render() {
    const s=state(); const job=jobs[s.job]; const missing=keys.filter(k=>!s.checks.includes(k));
    document.querySelector('#brief-title').textContent=job.title;
    document.querySelector('#brief-count').textContent=`${s.checks.length} / 4`;
    document.querySelector('#job-advice').textContent=job.note;
    const list=document.querySelector('#questions'); list.replaceChildren();
    for (const q of [job.question,methods[s.method].question,priorities[s.priority].question,'Who can approve the sample, and how will the final run be compared with it?']) { const li=document.createElement('li');li.textContent=q;list.append(li); }
    document.querySelector('#readiness').textContent=missing.length ? `Still to describe: ${missing.map(k=>labels[k].toLowerCase()).join('; ')}.` : 'All four topics are included in this exercise. A supplier still needs to confirm feasibility, proof and acceptance. Nothing is approved or ordered.';
  }
  function urlFor(s) {
    const url=new URL(location.origin + location.pathname);url.searchParams.set('job',s.job);url.searchParams.set('method',s.method);url.searchParams.set('priority',s.priority);
    if(s.checks.length)url.searchParams.set('checks',s.checks.join(','));else url.searchParams.delete('checks');
    url.hash='handoff'; return url;
  }
  function restore() {
    const p=new URLSearchParams(location.search);
    form.elements.job.value=valid(p.get('job'),jobs,'poster');form.elements.method.value=valid(p.get('method'),methods,'process');form.elements.priority.value=valid(p.get('priority'),priorities,'consistency');
    const checks=(p.get('checks')||'').split(',');keys.forEach(k=>{form.elements[k].checked=checks.includes(k);});render();status.textContent='';
  }
  form.addEventListener('submit',e=>e.preventDefault());
  form.addEventListener('change',()=>{render();history.pushState(null,'',urlFor(state()));status.textContent='';});
  form.addEventListener('reset',event=>{event.preventDefault();form.elements.job.value='poster';form.elements.method.value='process';form.elements.priority.value='consistency';keys.forEach(k=>{form.elements[k].checked=false;});render();const url=new URL(location.origin+location.pathname);url.hash='handoff';history.pushState(null,'',url);status.textContent='Exercise reset.';});
  addEventListener('popstate',restore);
  document.querySelector('#download').addEventListener('click',()=>{
    const s=state(); const lines=['INDUSTRY NEXT / ORIGINAL COLOR HANDOFF EXERCISE','Discussion draft. Not an order, Pantone match, approved proof or production specification.','',`Proposed object: ${jobs[s.job].title}`,`Proposed method: ${methods[s.method].label}`,`Priority: ${priorities[s.priority].label}`,'',jobs[s.job].note,'','QUESTIONS FOR THE MAKER',...Array.from(document.querySelectorAll('#questions li'),li=>`- ${li.textContent}`),'','TOPICS INCLUDED IN THIS EXERCISE',...keys.map(k=>`${s.checks.includes(k)?'[x]':'[ ]'} ${labels[k]}`),'','TO COMPLETE WITH THE MAKER','Reference / edition / original sample: ______','Material / surface / process: ______','Proof / viewing conditions: ______','Approver / revision / acceptance method: ______','','Screen illustrations are original approximations. No proprietary Pantone values are provided.','https://www.industrynext.xyz/pantone/'];
    const url=URL.createObjectURL(new Blob([lines.join('\n')+'\n'],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`color-handoff-${s.job}.txt`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='Brief download requested. No information was sent to a maker.';
  });
  document.querySelector('#share').addEventListener('click',async()=>{const url=urlFor(state()).href;try{await navigator.clipboard.writeText(url);status.textContent='Exercise link copied. It includes only these selections and checkmarks.';}catch{status.replaceChildren(document.createTextNode('Copy this exercise link: '));const input=document.createElement('input');input.type='text';input.readOnly=true;input.value=url;input.setAttribute('aria-label','Exercise share link');input.style.width='100%';status.append(input);input.focus();input.select();}});
  restore();
  form.querySelectorAll('select,input,button').forEach(control=>{control.disabled=false;});
  document.querySelectorAll('.actions button').forEach(control=>{control.disabled=false;});
})();
