import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
let html=await readFile('dist/index.html','utf8');
const mime={'.webp':'image/webp','.svg':'image/svg+xml'};
html=await replaceAsync(html,/<link rel="stylesheet" href="(\/_astro\/[^\"]+)"[^>]*>/g,async(_match,src)=>`<style>${await readFile(path.join('dist',src),'utf8')}</style>`);
html=await replaceAsync(html,/<script type="module" src="(\/_astro\/[^\"]+)"[^>]*><\/script>/g,async(_match,src)=>`<script type="module">${await readFile(path.join('dist',src),'utf8')}</script>`);
html=await replaceAsync(html,/(src|href)="(\/(?:images\/[^\"]+|favicon\.svg))"/g,async(_match,attr,src)=>`${attr}="data:${mime[path.extname(src)]||'application/octet-stream'};base64,${(await readFile(path.join('dist',src))).toString('base64')}"`);
html=await replaceAsync(html,/url\(['"]?(\/images\/[^'"\)]+)['"]?\)/g,async(_match,src)=>`url("data:${mime[path.extname(src)]||'application/octet-stream'};base64,${(await readFile(path.join('dist',src))).toString('base64')}")`);
html=html.replaceAll('href="/','href="http://localhost:4321/');
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/한산오앤에프-미리보기.html',html);
console.log('Standalone preview ready: artifacts/한산오앤에프-미리보기.html');
async function replaceAsync(input,regex,replacer){const matches=[...input.matchAll(regex)];const values=await Promise.all(matches.map(m=>replacer(...m)));let n=0;return input.replace(regex,()=>values[n++])}
