import { ui } from './interface.mjs';
import { parseArticles, renderPage } from './render.mjs';
import { alternateUrls, helpOrigin, htmlLocale, pagePath, resolveHelpPage } from './routes.mjs';

const escape = value => String(value).replace(/[&<>"']/g, character =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character])
);

export function helpDocument(locale, page, rows, query) {
  const label = ui[locale];
  const articles = parseArticles(rows);
  const article = articles[page];
  const title = page === 'home' ? 'PHANYX · '+label.help
    : (article?.title ?? label[page === 'search' ? 'results' : page === 'not-found' ? 'notFound' : page])+' | PHANYX';
  const description = article?.intro ?? label[page+'Description'] ?? label.intro;
  const indexable = page !== 'search' && page !== 'not-found';
  const tags = indexable ? [
    '<link rel="canonical" href="'+escape(helpOrigin+pagePath(locale,page))+'">',
    ...Object.entries(alternateUrls(page)).map(([lang,url])=>
      '<link rel="alternate" hreflang="'+lang+'" href="'+escape(url)+'">')
  ] : ['<meta name="robots" content="noindex">'];

  return [
    '<!doctype html>',
    '<html lang="'+htmlLocale[locale]+'"><head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="description" content="'+escape(description)+'">',
    '<meta name="theme-color" content="#111d44">',
    '<title>'+escape(title)+'</title>',
    ...tags,
    '<link rel="icon" type="image/png" sizes="64x64" href="/ajuda-assets/phanyx-icon.png">',
    '<link rel="stylesheet" href="/ajuda-assets/style.css">',
    '<script defer src="/ajuda-assets/browser.js"></script></head>',
    '<body><div id="app">'+renderPage(locale,page,articles,query)+'</div></body></html>'
  ].join('\n');
}

export function helpResponse(url, guides) {
  const current = resolveHelpPage(url.pathname);
  const locale = current?.locale ?? 'en';
  const page = current?.page ?? 'not-found';
  const query = page === 'search' ? (url.searchParams.get('q') ?? '').trim().slice(0,150) : '';
  return new Response(helpDocument(locale,page,guides[locale],query), {
    status:current ? 200 : 404,
    headers:{
      'Content-Type':'text/html; charset=utf-8',
      'Cache-Control':current && page !== 'search' ? 'public, max-age=60, s-maxage=300' : 'no-store'
    }
  });
}
