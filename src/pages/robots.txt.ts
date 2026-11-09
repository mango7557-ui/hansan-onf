export function GET({site}: {site: URL | undefined}) {
 return new Response(`User-agent: *\nAllow: /\nDisallow: /api/\n${site?`Sitemap: ${new URL('/sitemap.xml',site).href}\n`:''}`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
