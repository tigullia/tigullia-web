const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../_site'),base=(process.env.SITE_PATH||'').replace(/\/$/,''),errors=[];
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(path.join(dir,f.name)):[path.join(dir,f.name)]);}
const files=walk(root),html=files.filter(f=>f.endsWith('.html'));
for(const file of html){const content=fs.readFileSync(file,'utf8');
 if(!content.includes('<html lang="it">'))errors.push('Lingua: '+file);
 if(/\{loadposition|\[\[(?:gallery|pdf):/.test(content))errors.push('Modulo non convertito: '+file);
 if(/<script(?![^>]*\bsrc=)[^>]*>/i.test(content)||/\son[a-z]+\s*=/i.test(content))errors.push('Script inline: '+file);
 for(const match of content.matchAll(/\b(?:href|src)="([^"<>]+)"/g)){
  let value=match[1].replace(/&amp;/g,'&');if(!value.startsWith('/')||value.startsWith('//'))continue;
  if(base&&!value.startsWith(base+'/')){errors.push('Prefisso: '+value);continue;}
  value=decodeURIComponent(value.slice(base.length).split(/[?#]/)[0]);
  let target=path.join(root,value);if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  if(!fs.existsSync(target))errors.push(path.relative(root,file)+' → '+value);
 }
}
for(const file of files)if(/\.(?:php|sql|jpa|tar)$/i.test(file))errors.push('File non statico: '+file);
const articles=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../content/articles.json'),'utf8'));
const index=JSON.parse(fs.readFileSync(path.join(root,'search.json'),'utf8'));
if(index.length!==articles.length)errors.push('Indice incompleto');
for(const a of articles){if(!fs.existsSync(path.join(root,a.url,'index.html')))errors.push('Articolo assente: '+a.id);}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Verificati ${html.length} file HTML, ${articles.length} articoli e tutti i riferimenti interni; ${files.length} file totali.`);
