import http from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root=path.dirname(fileURLToPath(import.meta.url));
const publicDir=path.join(root,'dist');
const dataDir=process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(root,'data','inquiries');
const port=Number(process.env.PORT||4321);
const limits=new Map();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.json':'application/json; charset=utf-8','.woff2':'font/woff2'};
const maxLength={company:100,name:60,phone:24,email:200,type:30,product:40,quantity:100,region:150,message:3000};
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
async function inquiry(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return json(res,405,{error:'POST 요청만 지원합니다.'})}
 if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'올바른 JSON 형식으로 요청해 주세요.'});
 const origin=req.headers.origin;
 if(origin){let valid=false;try{const parsed=new URL(origin);valid=process.env.SITE_URL?parsed.origin===new URL(process.env.SITE_URL).origin:parsed.host===req.headers.host}catch{}if(!valid)return json(res,403,{error:'허용되지 않은 요청입니다.'})}
 const ip=req.socket.remoteAddress||'unknown';
 const now=Date.now();const prior=limits.get(ip)||[];const recent=prior.filter(t=>now-t<60*60*1000);
 if(recent.length>=12)return json(res,429,{error:'문의 요청이 많습니다. 잠시 후 다시 시도해 주세요.'});
 let raw='';let bytes=0;
 for await(const chunk of req){bytes+=chunk.length;if(bytes>20000)return json(res,413,{error:'문의 내용이 너무 깁니다.'});raw+=chunk.toString()}
 let body;try{body=JSON.parse(raw)}catch{return json(res,400,{error:'입력 내용을 확인해 주세요.'})}
 if(!body||Array.isArray(body)||typeof body!=='object')return json(res,400,{error:'입력 내용을 확인해 주세요.'});
 if(body.website)return json(res,400,{error:'요청을 처리할 수 없습니다.'});
 const fields={};
 for(const [key,length]of Object.entries(maxLength)){if(body[key]!==undefined&&typeof body[key]!=='string')return json(res,400,{error:'입력 형식을 확인해 주세요.'});fields[key]=(body[key]||'').trim();if(fields[key].length>length)return json(res,400,{error:'입력 길이를 확인해 주세요.'})}
 if(!fields.company||!fields.name||fields.message.length<10||!['supply','oem','distribution','quality','other'].includes(fields.type)||!/^\+?[\d()\s-]{9,24}$/.test(fields.phone)||fields.phone.replace(/\D/g,'').length<9||!['on',true].includes(body.consent))return json(res,400,{error:'필수 항목, 연락처 및 개인정보 동의를 확인해 주세요.'});
 if(fields.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))return json(res,400,{error:'이메일 주소를 확인해 주세요.'});
 if(fields.product&&!['consult','soybean','canola','sunflower','corn','custom','greenmarket'].includes(fields.product))return json(res,400,{error:'관심 제품을 확인해 주세요.'});
 const token=req.headers['x-idempotency-key'];
 const key=typeof token==='string'&&/^[a-f\d-]{36}$/i.test(token)?token:randomUUID();
 await mkdir(dataDir,{recursive:true,mode:0o700});
 const file=path.join(dataDir,`${key}.json`);
 const id=`HS-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${randomUUID().slice(0,8).toUpperCase()}`;
 const record={id,createdAt:new Date().toISOString(),status:'new',...fields,consent:true,consentVersion:'2026-11-09',notification:'not-configured'};
 try{await writeFile(file,JSON.stringify(record,null,2),{flag:'wx',mode:0o600})}catch(error){if(error.code==='EEXIST'){const previous=JSON.parse(await readFile(file,'utf8'));const same=Object.keys(fields).every(k=>previous[k]===fields[k]);return same?json(res,200,{id:previous.id}):json(res,409,{error:'중복 요청 식별자가 일치하지 않습니다. 페이지를 새로 열어 주세요.'})}throw error}
 limits.set(ip,[...recent,now]);
 json(res,201,{id});
 if(process.env.INQUIRY_WEBHOOK_URL){
  try{const endpoint=new URL(process.env.INQUIRY_WEBHOOK_URL);if(endpoint.protocol!=='https:')throw new Error('HTTPS webhook required');const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record),signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error(`Webhook ${response.status}`);record.notification='sent'}catch(error){record.notification='failed';console.error('Inquiry notification failed:',record.id,error.message)}
  await writeFile(file,JSON.stringify(record,null,2),{mode:0o600});
 }
}

const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/inquiries')return await inquiry(req,res);
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return json(res,405,{error:'지원하지 않는 요청입니다.'})}
  let pathname;try{pathname=decodeURIComponent(url.pathname)}catch{return json(res,400,{error:'잘못된 주소입니다.'})}
  if(pathname.includes('\0')||pathname.includes('\\'))return json(res,400,{error:'잘못된 주소입니다.'});
  let file=path.resolve(publicDir,`.${pathname}`);
  if(!file.startsWith(publicDir+path.sep)&&file!==publicDir)return json(res,403,{error:'접근할 수 없습니다.'});
  let status=200;
  try{const s=await stat(file);if(s.isDirectory()){if(!pathname.endsWith('/')){res.writeHead(308,{Location:pathname+'/'+url.search});return res.end()}file=path.join(file,'index.html')}await stat(file)}catch{file=path.join(publicDir,'404.html');status=404}
  const bytes=await readFile(file);const ext=path.extname(file);
  res.writeHead(status,{'Content-Type':types[ext]||'application/octet-stream','Content-Length':bytes.length,'Cache-Control':pathname.startsWith('/_astro/')?'public, max-age=31536000, immutable':'public, max-age=0, must-revalidate'});
  res.end(req.method==='HEAD'?undefined:bytes);
 }catch(error){console.error(error);if(!res.headersSent)json(res,500,{error:'일시적인 서버 오류입니다. 전화로 문의해 주세요.'});else res.end()}
});
setInterval(()=>{const cutoff=Date.now()-60*60*1000;for(const[key,list]of limits){const keep=list.filter(t=>t>cutoff);if(keep.length)limits.set(key,keep);else limits.delete(key)}},60000).unref();
server.requestTimeout=20000;server.headersTimeout=15000;
server.listen(port,'0.0.0.0',()=>console.log(`HANSAN O&F running at http://localhost:${port}`));
