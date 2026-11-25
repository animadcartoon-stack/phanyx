const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=process.env.PHANYX_HELP_TEST_ROOT||path.resolve(__dirname,'../..');
const load=async file=>import(pathToFileURL(path.join(root,'lib/central-ajuda',file)).href);
const guides=JSON.parse(fs.readFileSync(path.join(root,'lib/central-ajuda/guides.json'),'utf8'));
async function render(id,locale='pt-br'){
 const {helpDocument}=await load('page.mjs');
 return helpDocument(locale,id,guides[locale]);
}
function where(html){return html.match(/<section[^>]+id="where"[\s\S]*?<\/section>/)?.[0]||'';}
test('o primeiro acesso à instituição começa na lateral esquerda e localiza Configurações no final do menu',async()=>{
 const text=where(await render('guide-first-setup'));
 assert.match(text,/lateral esquerda/);assert.match(text,/parte final/);assert.match(text,/abaixo de <strong>Comunicação/);
 assert.match(text,/<strong>Configurações<\/strong>/);assert.match(text,/<strong>Instituição<\/strong>/);
});
test('cadastro de aluno distingue o menu Alunos do botão Novo aluno dentro da página',async()=>{
 const text=where(await render('guide-admin-alunos-novo'));
 assert.match(text,/<strong>Acadêmico<\/strong>/);assert.match(text,/<strong>Alunos<\/strong>/);assert.match(text,/<strong>Novo aluno<\/strong>/);
 assert.match(text,/dentro da página/);
});
test('templates mostram o caminho por Configurações, Documentos institucionais e pelo cartão Templates',async()=>{
 const text=where(await render('templates'));
 assert.match(text,/<strong>Configurações<\/strong>/);assert.match(text,/<strong>Documentos institucionais<\/strong>/);assert.match(text,/<strong>Templates de documentos<\/strong>/);
});
test('documentos do professor usam o rótulo real Documentos no menu lateral',async()=>{
 const text=where(await render('teacher-docs'));
 assert.match(text,/menu lateral esquerdo/);assert.match(text,/<strong>Documentos<\/strong>/);
});
test('as instruções móveis respeitam a barra inferior e o rótulo Instituição',async()=>{
 const text=where(await render('guide-admin-configuracoes-instituicao'));
 assert.match(text,/No celular/);assert.match(text,/parte inferior/);assert.match(text,/<strong>Configurações<\/strong>/);
});
test('atividades externas localizam o botão do registro e a aba correta antes do procedimento',async()=>{
 const text=where(await render('guide-external-participants'));
 assert.match(text,/<strong>Abrir atividade<\/strong>/);assert.match(text,/<strong>Participantes<\/strong>/);
});
test('telas sem entrada no menu oferecem acesso direto, sem inventar um atalho',async()=>{
 const text=where(await render('guide-admin-rh-ponto-integracoes'));
 assert.match(text,/data-navigation-kind="direct"/);assert.match(text,/não tem uma opção própria no menu principal/);
 assert.match(text,/href="https:\/\/www\.phanyx\.com\.br\/admin\/rh\/ponto\/integracoes"/);
});
test('todos os artigos nos cinco idiomas têm localização antes do procedimento, links seguros e assets existentes',async()=>{
 const {parseArticles}=await load('render.mjs');let checked=0;
 for(const locale of Object.keys(guides))for(const article of Object.values(parseArticles(guides[locale],locale))){
  const html=await render(article.id,locale);const text=where(html);
  assert(text,`${locale}:${article.id}: localização ausente`);
  assert(html.indexOf('id="where"')<html.indexOf('id="instructions"'),`${locale}:${article.id}: ordem`);
  assert.doesNotMatch(text,/\{(?:role|group|item|page|action|tab|open)\}|undefined|\[object Object\]/);
  assert.match(text,/<a class="primary navigation-open"[^>]+target="_blank" rel="noopener noreferrer"/);
  for(const m of html.matchAll(/src="(\/ajuda-assets\/[^"?]+)"/g))assert(fs.existsSync(path.join(root,'public',m[1])),`${locale}:${article.id}: ${m[1]}`);
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,`${locale}:${article.id}: IDs repetidos`);
  checked++;
 }
 assert(checked>=1045,`Foram verificados apenas ${checked} artigos`);
});
test('o mapa visual de Configurações mostra Comunicação antes e destaca Instituição',async()=>{
 const text=where(await render('guide-admin-configuracoes-instituicao'));
 const map=text.slice(text.indexOf('class="menu-location"'));
 assert.match(map,/Comunicação/);assert.match(map,/class="menu-location-group selected"><strong>Configurações/);
 assert.match(map,/aria-current="location">Instituição<\/li>/);
 assert(map.indexOf('Comunicação')<map.indexOf('Configurações'));
});
test('os caminhos e controles catalogados ainda existem nos arquivos de origem do menu',async()=>{
 const menus=JSON.parse(fs.readFileSync(path.join(root,'lib/central-ajuda/navigation-menus.json'),'utf8'));
 const actions=JSON.parse(fs.readFileSync(path.join(root,'lib/central-ajuda/navigation-actions.json'),'utf8'));
 for(const role of ['admin','teacher','student'])for(const item of menus[role]){
  assert(fs.readFileSync(path.join(root,item.source),'utf8').includes(item.href),`${role}: ${item.href} removido do menu`);
  for(const locale of Object.keys(guides))assert(item.labels[locale]?.trim(),`${role}:${item.href}:${locale}`);
 }
 for(const [target,action] of Object.entries(actions)){
  assert(fs.readFileSync(path.join(root,action.source),'utf8').includes(target),`${target}: botão de origem ausente`);
  for(const locale of Object.keys(guides))assert(action.labels[locale]?.trim(),`${target}:${locale}`);
 }
});
