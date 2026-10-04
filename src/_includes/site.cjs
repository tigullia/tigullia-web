const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '../..');
const base = (process.env.SITE_PATH || '').replace(/\/$/, '');
if (base && !/^\/[a-zA-Z0-9_/-]+$/.test(base)) throw new Error('SITE_PATH non valido');
const origin = (process.env.SITE_URL || 'https://www.tigullia.it').replace(/\/$/, '');
const indexable = process.env.SITE_INDEXABLE === 'true';
const readJSON = name => JSON.parse(fs.readFileSync(path.join(ROOT, name), 'utf8'));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const url = s => base + s;
const articles = () => readJSON('content/articles.json');
const nav = () => readJSON('content/navigation.json');
const legacy = () => readJSON('content/legacy.json');
const body = a => fs.readFileSync(path.join(ROOT, 'content/articles', a.file), 'utf8');
const plain = html => html.replace(/\[\[.*?\]\]/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const people = [
 {id:3, name:'Eugenio Mario Raffo', image:'/images/Raffo/Raffo_foto_250.jpg', label:'Xilografia'},
 {id:13, name:'Giacomo Zolezzi', image:'/images/Zolezzi/ZolezziG.jpg', label:'Ricerca e mare'},
 {id:4, name:'Giulio Luigi Podestà', image:'/images/Podesta/GL_Podesta_g.jpg', label:'Xilografia'},
 {id:14, name:'Tino Nicolini', image:'/images/Nicolini/Tino_Nicolini.jpg', label:'Poesia'},
 {id:36, name:'Timoleone Civicchioni', image:'/images/Civicchioni/timoleone_civicchioni_250.jpg', label:'Editoria e cartoline'}
];
function link(href, title, current, cls='') {
 return `<a href="${esc(url(href))}"${href===current?' aria-current="page"':''}${cls?` class="${cls}"`:''}>${esc(title)}</a>`;
}
function menu(current) {
 const N = nav();
 return `<nav id="navigation" aria-label="Navigazione principale">${link('/', 'Home', current)}${[114,222].map(id=>{
 const item=N.find(m=>m.id===id);
 return `<details class="nav-group"><summary>${esc(item.title)}</summary><div class="dropdown">${link(item.url, 'Tutti i '+item.title.toLowerCase(), current)}${N.filter(m=>m.parent_id===id).map(m=>link(m.url,m.title,current)).join('')}</div></details>`;
 }).join('')}${link('/cerca/', 'Cerca', current, 'search-link')}</nav>`;
}
function breadcrumbs(current) {
 if(current==='/')return '';
 const N=nav();
 const ancestors=N.filter(n=>n.url!=='/'&&current.startsWith(n.url)&&n.url!==current).sort((a,b)=>a.level-b.level);
 const seen=new Set();
 return `<nav class="breadcrumbs" aria-label="Percorso">${link('/','Home',current)}${ancestors.filter(n=>{if(seen.has(n.url))return false;seen.add(n.url);return true;}).map(n=>`<span aria-hidden="true">/</span>${link(n.url,n.title,current)}`).join('')}</nav>`;
}
function sidebar(current) {
 const N=nav();let parent=N.find(n=>n.level===2&&n.parent_id===114&&current.startsWith(n.url));
 if(!parent&&current.startsWith('/documenti/'))parent=N.find(n=>n.id===(current.startsWith('/documenti/interviste/')?229:222));
 if(!parent)return '';
 return `<aside class="sidebar"><p class="eyebrow">In questa sezione</p><h2>${link(parent.url,parent.title,current)}</h2><nav aria-label="Pagine della sezione">${N.filter(n=>n.parent_id===parent.id).map(n=>link(n.url,n.title,current)).join('')}</nav></aside>`;
}
function personCards() {
 const A=articles();
 return `<div class="people-grid">${people.map(p=>`<a class="person-card" href="${url(A.find(a=>a.id===p.id).url)}"><div class="portrait"><img src="${url(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async"></div><span class="card-category">${esc(p.label)}</span><h3>${esc(p.name)}</h3><span class="card-arrow" aria-hidden="true">↗</span></a>`).join('')}</div>`;
}
function gallery(name) {
 const images=readJSON('content/galleries/'+name+'.json');
 return `<section class="gallery-block" aria-label="Galleria di immagini"><p class="gallery-count">Seleziona un’immagine per ingrandirla</p><div class="gallery">${images.map(im=>`<figure><a href="${esc(im.src)}" data-gallery="${esc(name)}"><img src="${esc(im.thumbnail)}" alt="${esc(im.caption)}" width="${im.width}" height="${im.height}" loading="lazy" decoding="async"></a></figure>`).join('')}</div></section>`;
}
function pdf(src) {
 return `<section class="pdf-document" aria-label="Documento PDF"><p><a class="button" href="${esc(src)}" target="_blank" rel="noopener">Apri il documento PDF ↗</a></p><iframe src="${esc(src)}" title="${esc(path.basename(src).replace(/_/g,' '))}" loading="lazy"></iframe><p class="muted">Se il documento non viene visualizzato, usa il collegamento qui sopra.</p></section>`;
}
function video(id) {
 return `<span class="video" data-video-id="${id}"><span class="video-label">Documento video</span><button type="button" data-play="${id}"><span class="play-icon" aria-hidden="true">▶</span> Riproduci il video</button><span class="video-notice">Premendo Riproduci si carica il video da YouTube.</span><a class="video-external" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener">Apri su YouTube ↗</a></span>`;
}
function articleBody(a) {
 let html=body(a);
 if(a.id===2)html=html.replace(/<p>(?:\s|&nbsp;|&#160;|\u00a0)*<\/p>/g,'');
 html=html
 .replace(/<(p|div)(?:\s[^>]*)?>\s*(\[\[(?:gallery|pdf):[^\]]+\]\])\s*<\/\1>/g,'$2')
 .replace(/\[\[gallery:([^\]]+)\]\]/g,(_,name)=>gallery(name))
 .replace(/\[\[pdf:([^\]]+)\]\]/g,(_,src)=>pdf(src))
 .replace(/<span data-video="([A-Za-z0-9_-]{11})"><\/span>/g,(_,id)=>video(id));
 return html.replace(/\b(href|src)="\/(?!\/)([^"<>]*)"/g,(_,attr,p)=>`${attr}="${base}/${p}"`);
}
function listing(parentId) {
 return `<div class="document-list">${nav().filter(n=>n.parent_id===parentId).map(n=>`<a href="${url(n.url)}"><h2>${esc(n.title)}</h2><span aria-hidden="true">↗</span></a>`).join('')}</div>`;
}
function layout({title,current,description='',content,home=false,aside='',redirect=''}) {
 const canonical=origin+url(current);
 const csp="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; frame-src 'self' https://www.youtube-nocookie.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";
 return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title==='TIGULLIA'?'Tigullia — Riviera Ligure di Levante':title+' | Tigullia')}</title><meta name="description" content="${esc(description||'Documenti, immagini e personaggi della Riviera Ligure di Levante.')}"><meta name="robots" content="${indexable&&!redirect&&current!=='/404.html'?'index,follow':'noindex,follow'}"><meta http-equiv="Content-Security-Policy" content="${esc(csp)}"><meta name="referrer" content="strict-origin-when-cross-origin"><link rel="canonical" href="${esc(redirect?origin+url(redirect):canonical)}">${redirect?`<meta http-equiv="refresh" content="0;url=${esc(url(redirect))}">`:''}<link rel="icon" type="image/png" sizes="16x16" href="${url('/images/favicon.png')}"><link rel="stylesheet" href="${url('/assets/site.css')}"><script src="${url('/assets/site.js')}" defer></script></head>
<body data-base="${esc(base)}"><a class="skip-link" href="#contenuto">Vai al contenuto</a>
<header class="site-header"><div class="header-inner"><a class="brand" href="${url('/')}" aria-label="Tigullia, pagina iniziale"><img src="${url('/images/logo-small.png')}" alt="" width="56" height="56"><span>TIGULLIA<small>Riviera Ligure di Levante</small></span></a><button class="menu-toggle" type="button" aria-controls="navigation" aria-expanded="false">Menu <span aria-hidden="true">☰</span></button>${menu(current)}</div></header>
<div class="panorama"><img src="${url('/images/Sertorio_Tigullia.jpg')}" alt="Panorama storico della Riviera Ligure di Levante" width="1200" height="155"></div>
<main id="contenuto" class="container${home?' home':''}">${breadcrumbs(current)}<div class="page-grid${aside?' has-sidebar':''}">${aside}<div class="page-content"><header class="page-heading"><p class="eyebrow">${home?'Memorie della Riviera':current.startsWith('/personaggi/')?'Personaggi':current.startsWith('/documenti/')?'Documenti':'Tigullia'}</p><h1>${esc(title)}</h1></header>${content}</div></div></main>
<footer class="site-footer"><div><strong>TIGULLIA</strong><p>Documenti, immagini e personaggi<br>della Riviera Ligure di Levante</p></div><div>${link('/personaggi/','Personaggi',current)}${link('/documenti/','Documenti',current)}${link('/cerca/','Cerca nell’archivio',current)}<a href="#contenuto">Torna in alto ↑</a></div></footer>
<dialog id="lightbox" aria-label="Visualizzatore immagini"><div class="lightbox-tools"><button type="button" data-prev aria-label="Immagine precedente">←</button><button type="button" data-next aria-label="Immagine successiva">→</button><button type="button" data-close>Chiudi ×</button></div><img id="full-image" alt=""></dialog>
</body></html>`;
}
function entries() {
 const A=articles();
 const list=A.map(a=>({kind:'article',a,output:a.url==='/'?'index.html':a.url.slice(1)+'index.html'}));
 for(const s of [{url:'/personaggi/',title:'Personaggi',parent:114},{url:'/documenti/',title:'Documenti',parent:222},{url:'/documenti/interviste/',title:'Interviste',parent:229}])list.push({kind:'section',...s,output:s.url.slice(1)+'index.html'});
 list.push({kind:'search',output:'cerca/index.html'}, {kind:'404',output:'404.html'});
 const occupied=new Set(list.map(e=>e.output));
 for(const [from,to] of Object.entries({...legacy().paths,'/index.php/':'/'})){
  const output=from.slice(1)+'index.html';
  if(!occupied.has(output)){list.push({kind:'redirect',from,to,output});occupied.add(output);}
 }
 for(const file of ['search.json','legacy.json','sitemap.xml','robots.txt','.nojekyll'])list.push({kind:file,output:file});
 return list;
}
function render(entry) {
 if(entry.kind==='article'){
  const a=entry.a;const home=a.id===2;
  const content=home?`<div class="prose home-intro">${articleBody(a)}</div><section class="home-section"><div class="section-heading"><div><p class="eyebrow">Voci, opere, testimonianze</p><h2>Personaggi</h2></div>${link('/personaggi/','Esplora tutti →','/')}</div>${personCards()}</section><section class="home-section document-callout"><div><p class="eyebrow">L’archivio</p><h2>Documenti e interviste</h2><p>Storie, tradizioni e testimonianze della Riviera.</p></div>${link('/documenti/','Esplora i documenti →','/','button')}</section>`:`<article class="prose">${articleBody(a)}</article>`;
  return layout({title:a.title,current:a.url,description:a.description,content,home,aside:home?'':sidebar(a.url)});
 }
 if(entry.kind==='section')return layout({title:entry.title,current:entry.url,content:entry.parent===114?personCards():listing(entry.parent)});
 if(entry.kind==='search')return layout({title:'Cerca nell’archivio',current:'/cerca/',content:`<form id="search-form" role="search"><label for="query">Cerca una persona, un luogo o una parola nei testi</label><div class="search-box"><input id="query" name="q" type="search" autocomplete="off" placeholder="Ad esempio: Raffo, Riva Trigoso…"><button class="button" type="submit">Cerca</button></div></form><p id="search-status" role="status"></p><div id="search-results" class="document-list"></div><noscript><p>La ricerca richiede JavaScript. Puoi consultare i <a href="${url('/personaggi/')}">personaggi</a> e i <a href="${url('/documenti/')}">documenti</a>.</p></noscript>`});
 if(entry.kind==='404')return layout({title:'Pagina non trovata',current:'/404.html',content:`<div class="prose"><p>Questo collegamento potrebbe appartenere alla precedente versione del sito.</p><p>${link('/cerca/','Cerca nell’archivio','/404.html','button')} oppure ${link('/','torna alla pagina iniziale','/404.html')}.</p></div>`});
 if(entry.kind==='redirect')return layout({title:'Pagina trasferita',current:entry.from,redirect:entry.from==='/index.php/'?'':entry.to,content:`<p>La pagina è disponibile al nuovo indirizzo: ${link(entry.to,'continua',entry.from)}.</p>`});
 if(entry.kind==='search.json')return JSON.stringify(articles().map(a=>({title:a.title,url:url(a.url),text:plain(body(a)),description:a.description})),null,2);
 if(entry.kind==='legacy.json')return JSON.stringify(legacy());
 if(entry.kind==='robots.txt')return indexable?`User-agent: *\nAllow: /\nSitemap: ${origin+url('/sitemap.xml')}\n`:'User-agent: *\nDisallow: /\n';
 if(entry.kind==='sitemap.xml')return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...articles().map(a=>a.url),'/personaggi/','/documenti/','/documenti/interviste/','/cerca/'].map(u=>`<url><loc>${esc(origin+url(u))}</loc></url>`).join('')}</urlset>`;
 return '';
}
module.exports={entries,render};
