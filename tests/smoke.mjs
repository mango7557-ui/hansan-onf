import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,mkdtemp,readdir,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

const dataDir=await mkdtemp(path.join(os.tmpdir(),'hansan-test-'));
await mkdir('artifacts',{recursive:true});
const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4322',DATA_DIR:dataDir,SITE_URL:'',INQUIRY_WEBHOOK_URL:''},stdio:['ignore','pipe','pipe']});
const base='http://localhost:4322';
await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server startup timed out')),15000);server.stdout.on('data',data=>{if(data.toString().includes('running')){clearTimeout(timeout);resolve()}});server.on('error',reject);server.stderr.on('data',d=>process.stderr.write(d))});
let browser;
async function readyImages(page){await page.evaluate(async()=>{document.querySelectorAll('img').forEach(img=>img.loading='eager');await Promise.all(Array.from(document.images).map(img=>img.decode().catch(()=>{})));await document.fonts.ready})}
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const pages=['/','/about/','/business/','/products/','/products/soybean/','/products/canola/','/products/sunflower/','/products/corn/','/products/custom/','/products/greenmarket/','/quality/','/guide/','/contact/','/privacy/'];
 const links=new Set();
 for(const route of pages){
  const response=await page.goto(base+route);assert.equal(response.status(),200,route);
  assert.equal(await page.locator('h1').count(),1,`${route} H1`);
  assert.ok(await page.locator('meta[name="description"]').getAttribute('content'));
  const schema=await page.locator('script[type="application/ld+json"]').textContent();assert.ok(JSON.parse(schema)['@graph'].length);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${route} desktop overflow`);
  for(const href of await page.locator('a[href^="/"],link[href^="/"],script[src^="/"]').evaluateAll(els=>els.map(el=>el.getAttribute('href')||el.getAttribute('src'))))links.add(href);
  for(const src of await page.locator('img').evaluateAll(els=>els.map(el=>el.getAttribute('src'))))links.add(src);
 }
 for(const link of links){const r=await fetch(base+link);assert.equal(r.status,200,`Resource ${link}`)}
 console.log(`PASS: ${pages.length} pages, metadata, structured data, ${links.size} internal resources`);
 await page.goto(base+'/');await readyImages(page);await page.screenshot({path:'artifacts/home-desktop.png',fullPage:true});await page.screenshot({path:'artifacts/hero-desktop.png'});
 await page.getByRole('tab',{name:'카놀라유'}).click();assert.equal(await page.locator('#panel-canola').isVisible(),true);assert.equal(await page.locator('#panel-soybean').isVisible(),false);await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#panel-sunflower').isVisible(),true);await page.keyboard.press('Home');assert.equal(await page.locator('#panel-soybean').isVisible(),true);
 console.log('PASS: collection tabs, panel visibility and keyboard navigation');
 await page.locator('.faq-list summary').first().click();assert.equal(await page.locator('.faq-list details').first().getAttribute('open'),'');
 await page.goto(base+'/products/');await page.getByRole('button',{name:'베이커리',exact:true}).click();assert.equal(await page.locator('.product-card:visible').count(),1);assert.equal(await page.locator('#product-count').textContent(),'1');await page.getByRole('button',{name:'전체',exact:true}).click();assert.equal(await page.locator('.product-card:visible').count(),6);
 console.log('PASS: product filtering and FAQ interaction');
 for(const width of [390,768]){await page.setViewportSize({width,height:844});for(const route of pages){await page.goto(base+route);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${route} ${width}px overflow`)}}
 await page.setViewportSize({width:390,height:844});await page.goto(base+'/');await readyImages(page);assert.equal(await page.locator('.tab-bar').isVisible(),true,'tab bar visible on mobile');assert.equal(await page.locator('.tab-bar a').count(),6,'six tabs');assert.equal((await page.locator('.tab-bar a[aria-current=page]').textContent()).trim(),'홈','home tab active');assert.ok((await page.locator('.tab-bar a[href^="tel:"]').getAttribute('href')).includes('041-414-5153'),'call tab dials company');const barBox=await page.locator('.tab-bar').boundingBox();assert.ok(barBox.y+barBox.height>=844-2,'tab bar pinned to bottom');assert.ok(barBox.height>=56,'tab bar touch height');await page.screenshot({path:'artifacts/home-mobile.png',fullPage:true});await page.screenshot({path:'artifacts/hero-mobile.png'});
 await page.goto(base+'/products/');await page.screenshot({path:'artifacts/products-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'artifacts/products-desktop.png',fullPage:true});await page.goto(base+'/contact/');await page.screenshot({path:'artifacts/contact-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});
 console.log('PASS: 390px/768px responsive pages and bottom tab bar');
 await page.route(/firestore\.googleapis\.com/,r=>r.abort());await page.goto(base+'/contact/?product=soybean');assert.equal(await page.locator('#product').inputValue(),'soybean');assert.equal(await page.locator('#type').inputValue(),'supply');
 await page.locator('#company').fill('테스트 회사');await page.locator('#name').fill('테스트 담당자');await page.locator('#phone').fill('010-1234-5678');await page.locator('#email').fill('test@example.com');await page.locator('#message').fill('테스트 데이터입니다. 실제 영업 문의가 아닙니다.');await page.locator('[name="consent"]').check();await page.getByRole('button',{name:'문의 보내기'}).click();await page.waitForFunction(()=>document.querySelector('#form-status').textContent.includes('접수번호'));
 await page.unroute(/firestore\.googleapis\.com/);const files=await readdir(dataDir);assert.equal(files.length,1,'browser submission fell back to local server when Firestore is blocked');const saved=JSON.parse(await readFile(path.join(dataDir,files[0]),'utf8'));assert.equal(saved.company,'테스트 회사');assert.equal(saved.consent,true);
 const body={company:'API 테스트',name:'검증',phone:'010-1234-5678',type:'supply',message:'서버 검증용 테스트 문의 내용입니다.',consent:'on'};const key=randomUUID();
 const send=(data,headers={})=>fetch(base+'/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json','X-Idempotency-Key':key,...headers},body:JSON.stringify(data)});
 let r=await send({...body,consent:false});assert.equal(r.status,400);
 r=await send(body,{'Origin':'https://invalid.example'});assert.equal(r.status,403);
 r=await send(body);assert.equal(r.status,201);const result=await r.json();r=await send(body);assert.equal(r.status,200);assert.equal((await r.json()).id,result.id);assert.equal((await readdir(dataDir)).length,2);
 r=await fetch(base+'/data/inquiries/');assert.equal(r.status,404);
 console.log('PASS: inquiry prefill, submission, durable storage, validation, origin checks, idempotency, private storage');
 for(const resource of ['/robots.txt','/sitemap.xml','/llms.txt'])assert.equal((await fetch(base+resource)).status,200);
 assert.equal((await fetch(base+'/missing-page')).status,404);
 assert.deepEqual(errors,[]);
 const noJs=await browser.newContext({javaScriptEnabled:false});const staticPage=await noJs.newPage();await staticPage.goto(base+'/guide/');assert.ok((await staticPage.locator('body').textContent()).includes('최소 주문 수량'));await noJs.close();
 console.log('PASS: crawler files, 404, no JavaScript errors, JavaScript-free content');
 console.log('ALL CHECKS PASSED');
}finally{await browser?.close();server.kill()}
