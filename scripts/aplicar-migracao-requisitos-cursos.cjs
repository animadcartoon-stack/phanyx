#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const TARGET='20261027120000_cursos_obrigatorios_conjunto';
function pendentesDaSaida(output) {
  if (/Database schema is up to date!/.test(output)) return [];
  const match=output.match(/Following migrations? have not yet been applied:\s*\r?\n([\s\S]*?)(?:\r?\n\r?\n|$)/i);
  if (!match) throw Error('Não foi possível identificar com segurança as migrações pendentes. Execute prisma migrate status e revise a saída.');
  const names=match[1].split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if (!names.length || names.some(s=>!/^\d{14}_[a-z0-9_]+$/.test(s))) throw Error('A lista de migrações não foi reconhecida. Nenhuma alteração foi executada.');
  return names;
}
function main() {
  const git=spawnSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8',windowsHide:true});
  if(git.status!==0)throw Error('Execute este aplicador a partir da pasta original do PHANYX.');
  const repo=git.stdout.trim(),worktree=path.resolve(__dirname,'..');
  const origin=spawnSync('git',['remote','get-url','origin'],{cwd:repo,encoding:'utf8',windowsHide:true});
  if(origin.status!==0 || !/(?:github\.com[:/])animadcartoon-stack\/phanyx(?:\.git)?\/?$/i.test(origin.stdout.trim()))throw Error('Execute na pasta original do repositório animadcartoon-stack/phanyx.');
  const cli=path.join(repo,'node_modules/prisma/build/index.js');
  if(!fs.existsSync(cli))throw Error('As dependências do Prisma não foram encontradas na pasta atual. Execute na pasta original do PHANYX.');
  const schema=path.join(worktree,'prisma/schema.prisma');
  if(!fs.existsSync(path.join(worktree,'prisma/migrations',TARGET,'migration.sql')))throw Error('A migração específica não foi encontrada.');
  const status=spawnSync(process.execPath,[cli,'migrate','status','--schema',schema],{cwd:repo,encoding:'utf8',windowsHide:true});
  const output=(status.stdout||'')+'\n'+(status.stderr||'');process.stdout.write(output);
  if(status.error)throw status.error;
  const pending=pendentesDaSaida(output);
  if(!pending.length){console.log('Banco atualizado. A migração não será repetida.');return;}
  if(pending.length!==1 || pending[0]!==TARGET)throw Error('Existem outras migrações pendentes. Este aplicador permite somente '+TARGET+'. Nenhuma migração foi aplicada.');
  const result=spawnSync(process.execPath,[cli,'migrate','deploy','--schema',schema],{cwd:repo,stdio:'inherit',windowsHide:true});
  if(result.error||result.status!==0)throw Error('A migração não foi concluída. Revise a conexão e a saída acima antes de publicar.');
  console.log('Migração concluída. Nenhum curso foi configurado automaticamente com requisitos.');
}
module.exports={TARGET,pendentesDaSaida};
if(require.main===module){try{main();}catch(e){console.error(e.message);process.exitCode=1;}}
