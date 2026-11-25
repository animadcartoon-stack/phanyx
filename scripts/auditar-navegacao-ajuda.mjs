import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {parseArticles} from '../lib/central-ajuda/render.mjs';
import {helpDocument} from '../lib/central-ajuda/page.mjs';
import {navigationFor,navigationMenus,navigationActions} from '../lib/central-ajuda/navigation.mjs';
const guides=JSON.parse(readFileSync(new URL('../lib/central-ajuda/guides.json',import.meta.url)));
const rows=[];let variants=0;
for(const locale of Object.keys(guides))for(const article of Object.values(parseArticles(guides[locale],locale))){
 const route=navigationFor(article,locale);
 const html=helpDocument(locale,article.id,guides[locale]);
 if(!html.includes('id="where"'))throw Error('Localização ausente: '+locale+'/'+article.id);
 if(/\{(?:role|group|item|page|action|tab|open)\}/.test([...route.desktop,...route.mobile].join(' ')))throw Error('Texto incompleto: '+locale+'/'+article.id);
 for(const image of html.matchAll(/src="(\/ajuda-assets\/[^"?]+)"/g))if(!existsSync(new URL('../public'+image[1],import.meta.url)))throw Error('Imagem ausente: '+image[1]);
 if(locale==='pt-br')rows.push({id:article.id,title:article.title,kind:route.kind,path:route.breadcrumb.join(' > '),target:route.target});
 variants++;
}
for(const role of ['admin','teacher','student'])for(const item of navigationMenus[role]){
 if(!readFileSync(new URL('../'+item.source,import.meta.url),'utf8').includes(item.href))throw Error('Rota removida do menu: '+item.href);
}
for(const [target,action]of Object.entries(navigationActions))if(!readFileSync(new URL('../'+action.source,import.meta.url),'utf8').includes(target))throw Error('Botão de origem ausente: '+target);
const types={menu:'Menu e botões',direct:'Acesso direto',public:'Site público/login',theme:'Seletor de tema',language:'Seletor de idioma',bell:'Notificações',library:'Menu e contratação'};
const lines=['# Auditoria dos caminhos da Central de Ajuda','',`${rows.length} artigos revisados em cinco idiomas (${variants} versões).`, '', 'A verificação confere o catálogo, os controles de origem e a renderização. Não comprova autenticação, permissões ou funcionamento completo das telas protegidas.', '', 'Os mapas visuais são representações dos itens de navegação; não são prints de uma sessão de usuário. Os prints existentes do conteúdo foram mantidos. Novas capturas reais dos menus e a homologação visual continuam pendentes por falha do navegador de testes.','', '## Telas com acesso direto','', 'Estas telas não têm um caminho completo rastreado desde uma entrada do menu atual. O guia informa o acesso direto e coloca o botão no início, sem inventar uma opção lateral.','',...rows.filter(x=>x.kind==='direct').map(x=>`- ${x.title}: \`${x.target}\``),'','## Catálogo completo','','| Artigo | Forma de acesso | Caminho |','| --- | --- | --- |',...rows.map(x=>`| ${x.title.replaceAll('|','\\|')} | ${types[x.kind]} | ${x.path.replaceAll('|','\\|')} |`),''];
writeFileSync(new URL('../docs/central-ajuda-caminhos-auditoria.md',import.meta.url),lines.join('\n'));
console.log(JSON.stringify({articles:rows.length,variants,direct:rows.filter(x=>x.kind==='direct').length,sourceActions:Object.keys(navigationActions).length}));
