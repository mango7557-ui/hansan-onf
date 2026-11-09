import {loadContent} from '../data/content.ts';
export async function GET({site}: {site: URL | undefined}) {
 const {products}=await loadContent();
 const paths=['/','/about/','/business/','/products/','/quality/','/guide/','/contact/','/privacy/','/llms.txt','/llms-full.txt',...products.map(p=>`/products/${p.slug}/`)];
 const xml=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${site?paths.map(path=>`<url><loc>${new URL(path,site).href.replaceAll('&','&amp;')}</loc></url>`).join(''):''}</urlset>`;
 return new Response(xml,{headers:{'Content-Type':'application/xml'}});
}
