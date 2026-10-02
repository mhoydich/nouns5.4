import fs from 'node:fs';
import path from 'node:path';
import {renderLab,document} from './render.mjs';
import {normalizeLab} from './normalize.mjs';
const lab=normalizeLab(JSON.parse(fs.readFileSync(new URL('./content.json',import.meta.url))));
const target=new URL('../../public/communications-lab/',import.meta.url);
for(const project of [undefined,...lab.projects]) {const folder=new URL(project?'projects/'+project.slug+'/':'./',target);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(new URL('index.html',folder),document(lab,renderLab(lab,{project,surface:'industrynext'}),{project,surface:'industrynext'}));}
fs.writeFileSync(new URL('briefs.json',target),JSON.stringify({...lab,url:'https://www.industrynext.xyz/communications-lab/',projects:lab.projects.map(p=>({...p,url:'https://www.industrynext.xyz/communications-lab/projects/'+p.slug+'/'}))},null,2)+'\n');
