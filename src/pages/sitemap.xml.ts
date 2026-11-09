import {products} from '../data/site.js';
export function GET({site}: {site: URL | undefined}) {
 const paths=['/','/about/','/business/','/products/','/quality/','/guide/','/contact/','/privacy/',...products.map(p=>`/products/${p.slug}/`)];
 const xml=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${site?paths.map(path=>`<url><loc>${new URL(path,site).href.replaceAll('&','&amp;')}</loc></url>`).join(''):''}</urlset>`;
 return new Response(xml,{headers:{'Content-Type':'application/xml'}});
}
