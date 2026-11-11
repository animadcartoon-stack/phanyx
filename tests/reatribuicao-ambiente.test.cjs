'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const raiz = path.resolve(__dirname, '..');
const fonte = fs.readFileSync(path.join(raiz, 'lib/matriculas/reatribuicao-execucao.ts'), 'utf8');
const codigo = ts.transpileModule(fonte, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
});
assert.equal(codigo.diagnostics?.length || 0, 0);
const mod = { exports: {} };
new Function('module', 'exports', codigo.outputText)(mod, mod.exports);
const { destinoHomologacaoAutorizado: destino, execucaoHabilitada: habilitada } = mod.exports;
const url = 'postgresql://usuario:senha@ep-test-branch.sa-east-1.aws.neon.tech/neondb?sslmode=require';
const host = 'ep-test-branch.sa-east-1.aws.neon.tech';
const base = {
  databaseUrl: url,
  hostAutorizado: host,
  flag: 'true',
  seloHomologacao: 'HOMOLOGACAO',
  vercelEnv: 'preview',
  nodeEnv: 'production',
};
let testes = 0;
const verifica = (real, esperado, mensagem) => { assert.equal(real, esperado, mensagem); testes++; };
verifica(destino(base), true, 'Endpoint autorizado');
verifica(habilitada(base), true, 'Preview e endpoint autorizado');
verifica(habilitada({ ...base, vercelEnv: 'production' }), false, 'Produção Vercel');
verifica(habilitada({ ...base, flag: undefined }), false, 'Flag ausente');
verifica(habilitada({ ...base, flag: 'false' }), false, 'Flag falsa');
verifica(habilitada({ ...base, seloHomologacao: undefined }), false, 'Selo ausente');
verifica(habilitada({ ...base, seloHomologacao: 'PRODUCAO' }), false, 'Selo divergente');
verifica(habilitada({ ...base, vercelEnv: undefined, nodeEnv: 'development' }), true, 'Dev com Neon autorizado');
verifica(habilitada({ ...base, vercelEnv: undefined, nodeEnv: 'production' }), false, 'Ambiente incerto');
verifica(habilitada({ ...base, vercelEnv: 'staging', nodeEnv: 'production' }), false, 'Ambiente desconhecido');
for (const hostAutorizado of ['', 'https://' + host, 'postgresql://' + host, host + '/db', 'localhost', '127.0.0.1', 'neon.tech', 'evilneon.tech', 'ep-falso.sa-east-1.aws.neon.tech', 'ep-test-branch.sa-east-1.aws.neon.tech.evil.com', 'usuario@' + host, host + ':5432', undefined]) {
  verifica(destino({ ...base, hostAutorizado }), false, 'Host não autorizado: ' + hostAutorizado);
}
for (const databaseUrl of ['', undefined, 'postgresql://', 'https://usuario@' + host + '/db', 'postgresql://usuario@localhost/neondb', 'postgresql://usuario@ep-prod.sa-east-1.aws.neon.tech/neondb', 'postgresql://usuario@' + host + '/', 'postgresql://' + host + '/neondb', 'postgresql://usuario@' + host + ':5432/', 'usuario@' + host]) {
  verifica(destino({ ...base, databaseUrl }), false, 'URL não autorizada: ' + databaseUrl);
}
verifica(destino({ ...base, hostAutorizado: host.toUpperCase() }), true, 'Hostname sem diferenciar maiúsculas');
verifica(destino({ ...base, hostAutorizado: '  ' + host + '  ' }), true, 'Hostname com espaços externos');
const rota = fs.readFileSync(path.join(raiz, 'app/api/admin/matriculas/[id]/reatribuicao/confirmar/route.ts'), 'utf8');
for (const parte of [
  'PHANYX_REATRIBUICAO_HOMOLOGACAO_HOST',
  'databaseUrl: process.env.DATABASE_URL',
  'hostAutorizado: process.env.PHANYX_REATRIBUICAO_HOMOLOGACAO_HOST',
  'if (!habilitada())',
  'const alunosBloqueados: Array<{ id: number }> = await tx.$queryRaw',
  'const travadas: Array<{ id: number }> = await tx.$queryRaw',
]) {
  verifica(rota.includes(parte), true, 'Guarda na rota: ' + parte);
}
verifica(rota.indexOf('if (!habilitada())') < rota.indexOf('prisma.$transaction('), true,
  'Bloqueio de ambiente anterior a qualquer transação');
console.log(`[OK] Segurança do alvo Neon: ${testes} verificações, sem conexão ou escrita no banco.`);
