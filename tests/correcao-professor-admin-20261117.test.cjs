const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const route = read('app/api/admin/professores/[id]/corrigir-para-admin/route.ts');
const modal = read('components/admin/CorrecaoProfessorAdminModal.tsx');
const auth = read('lib/server-auth.ts');
const page = read('app/admin/professores/page.tsx');

test('corrigir perfil exige autenticação ADMIN real e rejeita suporte impersonado', () => {
  assert.match(route, /user\.role === "ADMIN" \|\| user\.role === "SUPER_ADMIN"/);
  assert.match(route, /!user\.impersonacao/);
  assert.match(route, /instituicaoId: operador!\.instituicaoId!/);
});

test('corrigir exige confirmação explícita e ID de funcionário', () => {
  assert.match(route, /const CONFIRMACAO = "CORRIGIR CADASTRO"/);
  assert.match(route, /body\?\.confirmacao !== CONFIRMACAO/);
  assert.match(route, /professor\.funcionarioId !== Number\(body\.funcionarioId\)/);
  assert.match(modal, /confirmacao\.trim\(\) !== "CORRIGIR CADASTRO"/);
});

test('corrigir bloqueia vínculo acadêmico antes da exclusão', () => {
  for (const model of [
    'turma', 'turmaDisciplina', 'disciplina', 'professorDisciplina',
    'atividade', 'atividadeExternaEquipe', 'reuniao', 'sessaoOptativaAvulsa',
    'substituicaoDocente', 'documentoDocente', 'documentoProfessor',
    'planoRelatorioAula', 'registroDesenvolvimento', 'historicoRemuneracaoRH',
    'bibliotecaRecomendacao', 'mobilidadeCandidatura',
  ]) {
    assert.ok(route.includes(`db.${model}.count`), `Falta: ${model}`);
  }
  assert.match(route, /if \(pendencias\.length > 0\) throw/);
});

test('preserva histórico de permissões docentes no RH antes do delete', () => {
  assert.match(route, /tx\.professorPaginaPortal\.findMany/);
  assert.match(route, /tx\.historicoPermissaoProfessor\.findMany/);
  assert.match(route, /tx\.historicoRH\.create/);
  assert.match(route, /historicoPermissoesDocentes: historicos/);
  assert.ok(route.indexOf('await tx.historicoRH.create') < route.indexOf('await tx.professor.delete'));
});

test('novo usuário possui ID distinto, perfil ADMIN e senha aleatória com hash', () => {
  assert.match(route, /const novoUsuario = await tx\.user\.create/);
  assert.match(route, /role: "ADMIN"/);
  assert.match(route, /senha: senhaHash/);
  assert.match(route, /crypto\.randomBytes\(48\)/);
  assert.doesNotMatch(route, /senhaTemporaria:/);
});

test('antigo login fica inativo e não reutiliza email nem senha', () => {
  assert.match(route, /ativo: false/);
  assert.match(route, /email: emailArquivo/);
  assert.match(route, /senha: senhaArquivo/);
  assert.match(route, /resetToken: null/);
  assert.match(auth, /ativo: true/);
  assert.match(auth, /!usuario \|\| usuario\.ativo === false/);
});

test('preserva ID do RH e altera cargo para Coordenadora', () => {
  assert.match(route, /await tx\.funcionario\.update/);
  assert.match(route, /where: \{ id: professor\.funcionarioId! \}/);
  assert.match(route, /userId: novoUsuario\.id/);
  assert.match(route, /cargo: "Coordenadora"/);
  assert.match(route, /funcionarioIdPreservado/);
});

test('exclui somente o registro Professor, jamais o RH ou User histórico', () => {
  assert.match(route, /await tx\.professor\.delete/);
  assert.doesNotMatch(route, /tx\.funcionario\.delete\(/);
  assert.doesNotMatch(route, /tx\.user\.delete\(/);
});

test('operação usa transação isolada e conferência em servidor', () => {
  assert.match(route, /prisma\.\$transaction/);
  assert.match(route, /Prisma\.TransactionIsolationLevel\.Serializable/);
  assert.match(route, /await localizarProfessor\(tx/);
  assert.match(route, /await verificarVinculosAcademicos\(tx/);
});

test('painel oferece confirmação via modal Phanyx, não popup do navegador', () => {
  assert.match(page, /CorrecaoProfessorAdminModal/);
  assert.match(page, /setProfessorParaCorrigir\(p\)/);
  assert.match(modal, /role="dialog"/);
  assert.doesNotMatch(modal, /window\.(confirm|alert|prompt)\(/);
});

test('não há alteração do esquema nem migração para correção cadastral', () => {
  assert.match(route, /tx\.historicoRH\.create/);
  assert.match(route, /tx\.professor\.delete/);
});
