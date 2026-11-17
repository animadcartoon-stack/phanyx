const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const rota = read('app/api/admin/funcionarios/[id]/movimentacao-funcional/route.ts');
const credenciais = read('app/api/admin/funcionarios/[id]/enviar-credenciais/route.ts');
const rh = read('app/admin/funcionarios/page.tsx');
const professores = read('app/admin/professores/page.tsx');
const modal = read('components/admin/MovimentacaoFuncionalModal.tsx');
const modalCredenciais = read('components/admin/EnviarCredenciaisFuncionarioModal.tsx');

test('movimentação funcional acontece no RH, não em Professores', () => {
  assert.match(rh, /MovimentacaoFuncionalModal/);
  assert.match(rh, /setFuncionarioParaMovimentar\(f\)/);
  assert.doesNotMatch(professores, /CorrecaoProfessorAdminModal|rotuloCorrecaoProfessor|setProfessorParaCorrigir/);
  assert.equal(fs.existsSync(path.join(root, 'app/api/admin/professores/[id]/corrigir-para-admin/route.ts')), false);
});
test('RH escolhe manualmente departamento, cargo, perfil, data e motivo', () => {
  for (const termo of ['departamentoId','cargoId','setPerfil','setVigenciaEm','setMotivo','/api/departamento']) assert.ok(modal.includes(termo), termo);
  assert.match(rota, /departamentoId, cargoId, cargo: cargo\.nome/);
  assert.match(rota, /dataEvento: vigencia/);
});
test('não há cargo ou perfil de destino fixo', () => {
  assert.match(rota, /PERFIS_PERMITIDOS/);
  assert.match(rota, /perfil === "MANTER"/);
  assert.doesNotMatch(rota, /cargo: "Coordenadora"|role: "ADMIN"/);
  assert.match(rota, /tx\.cargo\.findFirst/);
});
test('regras de instituição e autenticação, sem impersonação', () => {
  assert.match(rota, /usuario\.impersonacao/);
  assert.match(rota, /instituicaoId: operador\.instituicaoId/);
  assert.match(credenciais, /operador\.impersonacao/);
  assert.match(credenciais, /instituicaoId: operador\.instituicaoId/);
});
test('não permite autodespromoção nem alterar conta mestre', () => {
  assert.match(rota, /funcionario\.user\?\.isMasterAdmin/);
  assert.match(rota, /funcionario\.userId === operador\.id/);
  assert.match(credenciais, /usuario\.isMasterAdmin \|\| usuario\.id === operador\.id/);
});
test('movimentação preserva ID de funcionário e User, sem exclusões', () => {
  assert.match(rota, /tx\.funcionario\.update/);
  assert.match(rota, /tx\.user\.update/);
  assert.doesNotMatch(rota, /\.delete\(/);
  assert.match(rota, /usuarioIdPreservado/);
});
test('vínculos acadêmicos são preservados e turmas bloqueiam desligamento docente automático', () => {
  assert.match(rota, /tx\.professor\.update/);
  assert.match(rota, /db\.turma\.count/);
  assert.match(rota, /db\.turmaDisciplina\.count/);
  assert.match(rota, /db\.sessaoOptativaAvulsa\.count/);
  assert.match(rota, /Reatribua as responsabilidades/);
  assert.doesNotMatch(rota, /tx\.professor\.delete/);
});
test('movimentação transacional e registro histórico de RH', () => {
  assert.match(rota, /prisma\.\$transaction/);
  assert.match(rota, /TransactionIsolationLevel\.Serializable/);
  assert.match(rota, /tx\.historicoRH\.create/);
  assert.match(rota, /tipo: "MOVIMENTACAO_FUNCIONAL"/);
  assert.match(rota, /anterior: \{/);
});
test('envio de senha temporária usa email já existente e hash', () => {
  assert.match(credenciais, /crypto\.randomBytes\(14\)/);
  assert.match(credenciais, /bcrypt\.hash\(senhaTemporaria, 12\)/);
  assert.match(credenciais, /enviarEmailPrimeiroAcessoInstitucional/);
  assert.match(credenciais, /precisaTrocarSenha: true/);
  assert.doesNotMatch(credenciais, /senhaTemporaria\s*[:,]\s*senhaTemporaria/);
});
test('e-mail com erro restaura senha anterior quando possível e não retorna senha', () => {
  assert.match(credenciais, /const restauracao = await prisma\.user\.updateMany/);
  assert.match(credenciais, /where: \{ id: usuario\.id, senha: senhaHash \}/);
  assert.match(credenciais, /message: "Login e senha temporária enviados por e-mail/);
});
test('modal de RH e credenciais sem popups nativos', () => {
  assert.match(modal, /role="dialog"/);
  assert.match(modalCredenciais, /role="dialog"/);
  assert.doesNotMatch(modal + modalCredenciais, /window\.(alert|confirm|prompt)\(/);
});
test('cinco idiomas disponibilizados nos dois modais', () => {
  for (const idioma of ['pt-BR','pt-PT','en-US','es-ES','fr-FR']) {
    assert.ok(modal.includes('"'+idioma+'"'));
    assert.ok(modalCredenciais.includes('"'+idioma+'"'));
  }
});

test('departamento docente acompanha transferência de RH quando o perfil PROFESSOR é mantido', () => {
  assert.match(rota, /!mudouPerfil && funcionario\.professor && funcionario\.user\?\.role === "PROFESSOR"/);
  assert.match(rota, /funcionario\.departamentoId !== departamentoId/);
  assert.match(rota, /data: \{ departamentoId \}/);
});
