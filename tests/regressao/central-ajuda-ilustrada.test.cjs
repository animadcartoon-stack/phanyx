const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=process.env.PHANYX_HELP_TEST_ROOT||path.resolve(__dirname,'../..');
const load=file=>import(pathToFileURL(path.join(root,'lib/central-ajuda',file)).href);
const guides=JSON.parse(fs.readFileSync(path.join(root,'lib/central-ajuda/guides.json'),'utf8'));
test('Instituição mostra prints reais com destaques separados para Configurações e Instituição',async()=>{
 const {helpDocument}=await load('page.mjs');
 const html=helpDocument('pt-br','guide-admin-configuracoes-instituicao',guides['pt-br']);
 assert.match(html,/class="figure annotated-figure"/);
 assert.match(html,/menu-configuracoes-pt-br\.jpg/);
 assert.match(html,/data-highlights=/);
 assert.match(html,/rectangle|<rect/);
 assert.match(html,/Clique uma vez/);
 assert.match(html,/apenas os exemplos/);
});
test('os prints dos três perfis têm arquivos revisados e os retângulos ficam dentro da imagem',async()=>{
 const crypto=require('node:crypto');
 const sharp=require('sharp');
 const {menuScreenshots,menuFigures}=await load('illustrations.mjs');
 const {navigationFor}=await load('navigation.mjs');
 const {parseArticles}=await load('render.mjs');
 for(const shot of menuScreenshots){
  const bytes=fs.readFileSync(path.join(root,'public/ajuda-assets',shot.file));
  assert(shot.reviewed,`${shot.file}: sem revisão`);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),shot.sha256,`${shot.file}: imagem mudou após revisão`);
  const meta=await sharp(bytes).metadata();assert.equal(meta.width,shot.width);assert.equal(meta.height,shot.height);
 }
 const seen=new Set();let count=0;
 for(const [locale,rows]of Object.entries(guides))for(const article of Object.values(parseArticles(rows,locale))){
  const nav=navigationFor(article,locale);
  for(const f of menuFigures(nav,locale)){
   seen.add(nav.role);assert(!/undefined|\{item\}/.test(f.text));
   assert(f.crop.height>0&&f.crop.y>=0&&f.crop.y+f.crop.height<=f.height);
   for(const b of f.highlights){assert(b.x>=0&&b.y>=0&&b.width>0&&b.height>0);assert(b.x+b.width<=f.width&&b.y+b.height<=f.height);assert(b.y>=f.crop.y&&b.y+b.height<=f.crop.y+f.crop.height);}
   if(locale!=='pt-br')assert(f.translation,`${article.id}:${locale}: idioma da imagem não informado`);
  }
  if(menuFigures(nav,locale).length)count++;
 }
 assert.deepEqual([...seen].sort(),['admin','student','teacher']);assert.equal(count,830);
});
test('uma opção sem captura de menu não recebe um print de outro perfil ou destino',async()=>{
 const {menuFigures}=await load('illustrations.mjs');
 const {navigationFor}=await load('navigation.mjs');
 const {parseArticles}=await load('render.mjs');
 const articles=parseArticles(guides['pt-br'],'pt-br');
 assert.deepEqual(menuFigures(navigationFor(articles['teacher-docs'],'pt-br'),'pt-br'),[]);
 assert.deepEqual(menuFigures(navigationFor(articles['guide-admin-rh-ponto-integracoes'],'pt-br'),'pt-br'),[]);
});
test('Instituição separa os campos em 26 passos, com imagens focadas e coordenadas válidas',async()=>{
 const {manualArticles}=await load('manual.mjs');
 const {guideImages}=await load('guide-images.mjs');
 const pictures=guideImages['guide-admin-configuracoes-instituicao'];
 const crypto=require('node:crypto');
 const sharp=require('sharp');
 assert.equal(Object.keys(pictures).length,27);
 for(const locale of Object.keys(guides)){
  const guide=manualArticles(locale)['guide-admin-configuracoes-instituicao'];
  assert.equal(guide.steps.length,26);
  assert(guide.steps.every(s=>s.trim().length>20));
 }
 assert.match(manualArticles('pt-br')['guide-admin-configuracoes-instituicao'].steps[19],/Editar logo.*Trocar logo/);
 for(const figure of Object.values(pictures)){
  const bytes=fs.readFileSync(path.join(root,'public/ajuda-assets',figure.file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),figure.sha256);
  const meta=await sharp(bytes).metadata();assert.equal(meta.width,figure.width);assert.equal(meta.height,figure.height);
  assert(figure.step<26);assert(figure.crop.width<=520);
  assert(figure.crop.x+figure.crop.width<=figure.width&&figure.crop.y+figure.crop.height<=figure.height);
  for(const box of figure.highlights){assert(box.x>=figure.crop.x&&box.y>=figure.crop.y);assert(box.x+box.width<=figure.crop.x+figure.crop.width&&box.y+box.height<=figure.crop.y+figure.crop.height);}
  for(const locale of Object.keys(guides))assert(figure.labels[locale]?.trim());
 }
 const source=fs.readFileSync(path.join(root,'app/admin/configuracoes/instituicao/page.tsx'),'utf8');
 assert(source.includes('t("logo.change")'));assert(source.includes('t("signature.change")'));
});
