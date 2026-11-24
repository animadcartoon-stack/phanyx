const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname,'..');
function walk(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.name.endsWith('.test.cjs')?[path.join(dir,e.name)]:[]); }
const files=walk(path.join(root,'tests')).sort();
if (!files.length) throw Error('Nenhum teste encontrado');
console.log('Executando '+files.length+' arquivos de testes existentes e novos.');
const result=spawnSync(process.execPath,['--test',...files],{cwd:root,stdio:'inherit'});
if(result.error) throw result.error;
process.exitCode=result.status ?? 1;
