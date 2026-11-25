import {readFileSync,writeFileSync} from 'node:fs';
import {parseArticles} from '../lib/central-ajuda/render.mjs';
import {navigationFor} from '../lib/central-ajuda/navigation.mjs';
import {menuFigures} from '../lib/central-ajuda/illustrations.mjs';
import {guideImages} from '../lib/central-ajuda/guide-images.mjs';
const data=JSON.parse(readFileSync(new URL('../lib/central-ajuda/guides.json',import.meta.url),'utf8'));
const rows=Object.values(parseArticles(data['pt-br'],'pt-br')).map(article=>({
 id:article.id,role:article.role,title:article.title,
 menuPrints:menuFigures(navigationFor(article,'pt-br'),'pt-br').length,
 procedurePrints:Object.keys(guideImages[article.id]??{}).length,
 steps:article.steps.length,
 fieldsWithoutDescription:(article.reference??[]).filter(field=>!field.description?.trim()).length,
 // A menu photo or an old screenshot is not proof of complete procedural coverage.
 completeReview:false
}));
const totals={articles:rows.length,withMenuPrints:rows.filter(r=>r.menuPrints).length,withProcedurePrints:rows.filter(r=>r.procedurePrints).length,withoutProcedurePrints:rows.filter(r=>!r.procedurePrints).length,completeReview:rows.filter(r=>r.completeReview).length};
const esc=text=>String(text).replaceAll('|','\\|');
const md=['# Revisão didática e cobertura de imagens','',
 'Este relatório distingue navegação ilustrada de tutorial completo. As capturas de menu não substituem os prints dos formulários, botões, abas, mensagens de erro e resultados. Uma revisão completa exige instruções por campo, imagens correspondentes, dados fictícios e validação do procedimento. Nenhum guia foi declarado completo por este contador.',
 '',`Artigos: ${totals.articles}. Com menu fotografado: ${totals.withMenuPrints}. Com alguma imagem de procedimento: ${totals.withProcedurePrints}. Sem imagens de procedimento: ${totals.withoutProcedurePrints}. Revisão completa registrada: ${totals.completeReview}.`,
 '', '| Perfil | Guia | Prints de menu | Imagens de procedimento | Campos sem descrição | Revisão completa |','| --- | --- | ---: | ---: | ---: | --- |',
 ...rows.map(r=>`| ${r.role} | ${esc(r.title)} | ${r.menuPrints} | ${r.procedurePrints} | ${r.fieldsWithoutDescription} | Pendente |`),
 '', '## Limitações observadas na sessão','',
 '- Biblioteca administrativa exibiu apenas Visão geral nesta conta; não foi contratada nem alterada a assinatura.',
 '- O professor de demonstração não exibiu todas as entradas do catálogo (por exemplo, Documentos). Não foram alteradas permissões.',
 '- O menu do aluno foi capturado no tema escuro por legibilidade; o tema anterior foi restaurado. O contraste do menu no tema claro precisa de uma revisão separada.',
 '- As capturas desta etapa estão em português do Brasil. As instruções existem em cinco idiomas e informam o idioma da imagem; isso não equivale a cinco séries de capturas traduzidas.',
 '- Os arquivos de imagem revisados têm hash no catálogo. A auditoria de dimensões impede que um arquivo seja substituído silenciosamente por um recorte diferente.',
 '', '## Critério de conclusão de cada guia','',
 'Revisar o caminho desde o menu; cada campo e botão; os pré-requisitos; exemplos fictícios; salvar/cancelar; o resultado esperado; correção de erros; imagens dos estados pertinentes com destaque correto; zoom, teclado e celular; textos e rótulos nos cinco idiomas. Registrar a revisão de cada fluxo antes de considerar o manual completo.',''];
writeFileSync(new URL('../docs/central-ajuda-ilustrada-cobertura.md',import.meta.url),md.join('\n'));
console.log(JSON.stringify(totals));
if(process.argv.includes('--require-complete')&&rows.some(r=>!r.completeReview))process.exitCode=1;
