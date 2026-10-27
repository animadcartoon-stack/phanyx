'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const TARGET='20261027150000_selecao_disciplinas_incluidas';
function analisar(rows,directory){
 if(rows.some(r=>!r.finished_at&&!r.rolled_back_at))throw Error('Existe migração incompleta. Pare e envie a saída antes de continuar.');
 const applied=new Map(rows.filter(r=>r.finished_at&&!r.rolled_back_at).map(r=>[r.migration_name,r]));
 const local=fs.readdirSync(directory,{withFileTypes:true}).filter(d=>d.isDirectory()&&fs.existsSync(path.join(directory,d.name,'migration.sql'))).map(d=>d.name).sort();
 if(!local.includes(TARGET))throw Error('Migração das disciplinas incluídas ausente nesta pasta.');
 const pending=local.filter(n=>!applied.has(n));
 if(pending.some(n=>n!==TARGET))throw Error('Há outras migrações pendentes. Este aplicador só pode executar a migração das disciplinas incluídas. Pare e envie a saída.');
 if(applied.has(TARGET)){
  const source=fs.readFileSync(path.join(directory,TARGET,'migration.sql'),'utf8').replace(/\r\n/g,'\n');
  const hashes=[source,source.replace(/\n/g,'\r\n')].map(s=>crypto.createHash('sha256').update(s).digest('hex'));
  if(!hashes.includes(applied.get(TARGET).checksum))throw Error('A migração aplicada possui outro conteúdo. Preserve o histórico e envie a saída.');
 }
 return pending;
}
function direta(uri){const u=new URL(uri);if(u.hostname.endsWith('.neon.tech'))u.hostname=u.hostname.replace('-pooler.','.');else if(u.hostname.includes('-pooler.'))throw Error('Configure DIRECT_URL para a conexão direta do banco.');return u.toString();}
function carregarVerificador(root){
 const versaoCli=require(path.join(root,'node_modules/prisma/package.json')).version;
 const versaoCliente=require(path.join(root,'node_modules/@prisma/client/package.json')).version;
 if(versaoCli!==versaoCliente)throw Error('VERSOES_PRISMA_DIFERENTES: confira as dependências antes de continuar.');
 const pasta=path.join(root,'node_modules/.cache/phanyx-verificacao-banco/cliente');
 if(fs.existsSync(path.join(pasta,'index.js'))){
  let cliente;
  try{cliente=require(pasta);}catch{throw Error('CARREGAMENTO_VERIFICADOR_FALHOU: o verificador existente não pôde ser carregado. Nenhuma migração foi aplicada.');}
  if(typeof cliente.PrismaClient!=='function'||cliente.Prisma?.prismaVersion?.client!==versaoCliente||cliente.Prisma?.ModelName?.HistoricoMigracao!=='HistoricoMigracao')throw Error('VERIFICADOR_INCOMPATIVEL: a versão do verificador existente diverge das dependências. Nenhuma migração foi aplicada.');
  console.log('Verificador isolado existente compatível: reutilizado sem gerar novamente.');
  return cliente;
 }
 return require('./cliente-verificacao-migracao.cjs').prepararClienteVerificacao(root);
}
async function main(){
 const root=path.resolve(__dirname,'..');require('@next/env').loadEnvConfig(root,false,{info(){},error(){}});
 const configurada=process.env.DIRECT_URL||process.env.DATABASE_URL;if(!configurada)throw Error('Configure a conexão do banco no .env. Não envie senhas.');
 const url=new URL(direta(configurada));
 if(!url.searchParams.has('connect_timeout'))url.searchParams.set('connect_timeout','30');
 if(!url.searchParams.has('pool_timeout'))url.searchParams.set('pool_timeout','30');
 const uri=url.toString();
 const {codigoSeguro,diagnosticoSeguro}=require('./verificar-migracao-organizacao.cjs');
 // A leitura do histórico não precisa carregar o cliente completo da aplicação.
 // No Windows, outro processo pode manter a DLL deste cliente carregada.
 // Reutilize o cliente compatível; não tente sobrescrever o motor em uso.
 const {PrismaClient}=carregarVerificador(root);
 const consultar=async()=>{
  for(let tentativa=1;tentativa<=3;tentativa++){
   let db;
   try{db=new PrismaClient({datasources:{db:{url:uri}}});return await db.$queryRaw`SELECT migration_name,checksum,finished_at,rolled_back_at FROM "_prisma_migrations"`;}
   catch(e){
    const codigo=codigoSeguro(e);
    if(tentativa===3||!['P1001','P1002','P1017','P2024'].includes(codigo))throw e;
    console.log('Conexão indisponível ['+codigo+']. Nova tentativa '+(tentativa+1)+'/3...');
    await new Promise(r=>setTimeout(r,2000));
   }finally{if(db)await db.$disconnect().catch(()=>{});}
  }
 };
 const directory=path.join(root,'prisma/migrations');let rows;
 try{rows=await consultar();}catch(e){throw Error(diagnosticoSeguro(e));}
 const pending=analisar(rows,directory);
 if(!pending.length){console.log('Migração das disciplinas incluídas já aplicada e verificada.');return;}
 if(process.argv.includes('--verificar')){console.log('Pendente apenas: '+TARGET);return;}
 console.log('Aplicando '+TARGET+': acrescenta dois campos opcionais. Cursos, preços e matrículas existentes mantêm seus dados.');
 const cli=require.resolve('prisma/build/index.js');const r=require('node:child_process').spawnSync(process.execPath,[cli,'migrate','deploy','--schema',path.join(root,'prisma/schema.prisma')],{cwd:root,stdio:'inherit',env:{...process.env,DATABASE_URL:uri,DIRECT_URL:uri},windowsHide:true});
 if(r.error||r.status!==0)throw Error('Migração não concluída. Não publique a versão antes de resolver.');
 if(analisar(await consultar(),directory).length)throw Error('Migração ainda pendente. Não publique.');
 console.log('Migração verificada. Continue com o build antes de publicar.');
}
module.exports={TARGET,analisar,direta,carregarVerificador};
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
