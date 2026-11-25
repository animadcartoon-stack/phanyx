const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');
const test = require('node:test');

const read = path => readFileSync(path, 'utf8');

test('admin usa uma só árvore de navegação em todas as larguras', () => {
  const admin = read('app/admin/AdminShell.tsx');
  assert.match(admin, /<PortalNavigation\b[\s\S]*<aside\b[\s\S]*<nav\b[\s\S]*onClick=\{handleLogout\}[\s\S]*<\/PortalNavigation>/);
  assert.doesNotMatch(admin, /menuMobileAberto/);
  for (const href of ['/admin/perfil', '/admin/professores/acessos', '/admin/acompanhamento-aulas', '/admin/documentos-docentes', '/admin/rh/documentos']) {
    assert.equal(admin.split(`href="${href}"`).length - 1, 1, href);
  }
});

test('portal docente mantém os links compartilhados sem barra fixa sobre a chamada', () => {
  const layout = read('app/professor/layout.tsx');
  assert.match(layout, /<PortalNavigation\b[\s\S]*<ProfessorSidebar\b[\s\S]*<\/PortalNavigation>\s*<main/);
  assert.doesNotMatch(layout, /fixed bottom-0/);
  const menu = read('components/layout/ProfessorSidebar.tsx');
  assert.match(menu, /podeVer\.planejamento && \{/);
  assert.match(menu, /className="p-4 lg:hidden"/);
});

test('portal do aluno mantém histórico, ouvidoria e saída no menu compartilhado', () => {
  const layout = read('app/aluno/layout.tsx');
  assert.match(layout, /<PortalNavigation\b[\s\S]*<AlunoSidebar\b[\s\S]*<\/PortalNavigation>/);
  assert.doesNotMatch(layout, /fixed bottom-0/);
  const menu = read('components/layout/AlunoSidebar.tsx');
  assert.match(menu, /podeVer\.historico && \{[\s\S]*href: "\/aluno\/historico"/);
  assert.match(menu, /podeVer\.ouvidoria && \{[\s\S]*href: "\/aluno\/ouvidoria"/);
  assert.match(menu, /<form action="\/api\/auth\/logout-aluno" method="post"[^>]*className="p-4 lg:hidden">/);
});

test('menu móvel cobre a página, começa pelos links e concentra a rolagem no painel', () => {
  const menu = read('components/layout/PortalNavigation.tsx');
  assert.match(menu, /aria-expanded=\{open\}/);
  assert.match(menu, /useState<"pages" \| "preferences">\("pages"\)/);
  assert.match(menu, /<dialog[\s\S]*h-dvh[\s\S]*data-portal-navigation-panel[\s\S]*overflow-y-auto overscroll-contain/);
  assert.match(menu, /dialog\.showModal\(\)/);
  assert.match(menu, /document\.body\.style\.overflow = "hidden"/);
  assert.match(menu, /aria-pressed=\{view === "pages"\}/);
  assert.match(menu, /aria-pressed=\{view === "preferences"\}/);
  for (const path of ['app/admin/AdminShell.tsx', 'components/layout/AlunoSidebar.tsx', 'components/layout/ProfessorSidebar.tsx']) {
    const source = read(path);
    assert.match(source, /<nav\s+data-portal-pages/);
    assert.match(source, /<div\s+data-portal-preferences/);
  }
});

test('o cabeçalho do novo aluno ganha espaço no celular e mantém a ação de voltar', () => {
  const page = read('app/admin/alunos/novo/page.tsx');
  assert.match(page, /text-xl[^"]*sm:text-3xl[^"]*"\s*>\s*\{t\("registration\.title"\)\}/);
  assert.match(page, /min-h-11[^"]*"\s*>\s*\{t\("actions\.backToStudents"\)\}/);
});

test('aviso de instalação fica no fluxo e os controles novos têm os cinco idiomas', () => {
  const pwa = read('components/pwa/InstallPromptPHANYX.tsx');
  assert.match(pwa, /<section\b[\s\S]*aria-label=\{t\("title"\)\}/);
  assert.doesNotMatch(pwa, /\bfixed\b/);
  for (const locale of ['pt-BR', 'pt-PT', 'en-US', 'es-ES', 'fr-FR']) {
    const messages = JSON.parse(read(`messages/${locale}.json`).replace(/^\uFEFF/, ''));
    assert.ok(messages.Common.portalMenu, locale);
    assert.ok(messages.Common.portalPages, locale);
    assert.ok(messages.Common.portalPreferences, locale);
    assert.ok(messages.InstallPrompt?.install, locale);
    assert.match(messages.AdminCertificateEditor?.layers?.selectElement ?? '', /\{name\}/);
  }
});

test('editor de certificados tem alças por ponteiro e seleção de camadas por botão', () => {
  const editor = read('app/admin/configuracoes/certificado/page.tsx');
  assert.match(editor, /onPointerDown=\{iniciarRotacaoGrupo\}/);
  assert.match(editor, /onPointerDown=\{iniciarRedimensionamentoGrupo\}/);
  assert.match(editor, /window\.addEventListener\("pointercancel", terminarPonteiro, opcoes\)/);
  assert.match(editor, /aria-label=\{tr\("layers\.selectElement"/);
  assert.match(editor, /contexto\.reordenarCamada\(campo\.id, alvo\.id\)/);
});

test('páginas públicas permitem quebra de palavras longas a 320 px', () => {
  for (const file of ['app/contato/page.tsx', 'app/suporte/page.tsx', 'app/blog/sistema-para-cursos-profissionalizantes/page.tsx', 'components/marketing/OpenCoursesArticle.tsx']) {
    assert.match(read(file), /wrap-anywhere/, file);
  }
});
