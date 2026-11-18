import {writeFileSync,existsSync} from 'node:fs';
import {manualGuides,moduleIds,manualLabels} from '../lib/central-ajuda/manual.mjs';
import {guideImages} from '../lib/central-ajuda/guide-images.mjs';
const locales=['en','pt-br','pt-pt','es','fr'];
const missingFiles=[];
const rows=manualGuides.map(guide=>{
 const images=Object.values(guideImages[guide.id]??{});
 for(const image of images)for(const locale of image.localized?locales:['pt-br']){
  const name=image.localized?image.localized+locale+'.jpg':image.file;
  if(!existsSync(new URL('../public/ajuda-assets/'+name,import.meta.url)))missingFiles.push(guide.id+': '+name);
  if(image.step!==undefined)for(const lang of locales)if(image.step>=guide.translations[lang].steps.length)throw Error('Etapa inexistente: '+guide.id+' / '+lang);
 }
 return {guide,images:images.length};
});
const illustrated=rows.filter(row=>row.images>0).length;
const labels=manualLabels('pt-br');
const lines=['# Cobertura de prints da Central de Ajuda','',`Dos ${rows.length} guias do catálogo ampliado, ${illustrated} possuem pelo menos uma imagem associada e ${rows.length-illustrated} ainda não possuem imagens.`, '', 'Ter uma imagem associada não significa que todas as funções, estados ou etapas do guia estejam ilustrados. Este inventário inclui imagens antigas e exemplos com listas vazias. Prints de dados reais sensíveis não devem ser publicados.',''];
for(const group of moduleIds){
 const subset=rows.filter(row=>row.guide.group===group);
 lines.push('## '+labels[group],'','| Guia | Imagens associadas |','| --- | ---: |');
 for(const row of subset)lines.push('| '+row.guide.translations['pt-br'].title.replaceAll('|','\\|')+' | '+row.images+' |');
 lines.push('');
}
writeFileSync(new URL('../docs/central-ajuda-cobertura-prints.md',import.meta.url),lines.join('\n'));
console.log(JSON.stringify({guides:rows.length,illustrated,withoutImages:rows.length-illustrated,missingFiles}));
if(missingFiles.length)process.exitCode=1;
