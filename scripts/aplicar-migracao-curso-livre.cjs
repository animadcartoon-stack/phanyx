'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const TARGETS=['20261026160000_curso_livre_organizacao','20261026160100_periodos_curso_livre','20261026170000_desconto_mensalidade_curso','20261026180000_preco_por_disciplinas'];
function analisarMigracoes(rows,directory){
 if(rows.some(r=>!r.finished_at&&!r.rolled_back_at))throw Error('Há uma migração incompleta no banco. Revise o histórico antes de continuar.');
 const applied=new Map(rows.filter(r=>r.finished_at&&!r.rolled_back_at).map(r=>[r.migration_name,r]));
 const local=fs.readdirSync(directory,{withFileTypes:true}).filter(d=>d.isDirectory()&&fs.existsSync(path.join(directory,d.name,'migration.sql'))).map(d=>d.name).sort();
 if(TARGETS.some(t=>!local.includes(t)))throw Error('As migrações dos cursos livres, desconto e preço por disciplinas precisam estar nesta pasta.');
 const pending=local.filter(n=>!applied.has(n));
 if(pending.some(n=>!TARGETS.includes(n)))throw Error('Há outras migrações pendentes. Este aplicador não executa alterações fora dos cursos livres, desconto e preço por disciplinas.');
 for(const t of TARGETS){if(applied.has(t)){const conteudo=fs.readFileSync(path.join(directory,t,'migration.sql'));const lf=conteudo.toString('utf8').replace(/\r\n/g,'\n');const checksums=[conteudo,lf,lf.replace(/\n/g,'\r\n')].map(c=>crypto.createHash('sha256').update(c).digest('hex'));if(!checksums.includes(applied.get(t).checksum))throw Error('O conteúdo de uma migração aplicada difere deste arquivo. Não reaplique nem edite o histórico.');}}
 return pending;
}
function conexaoDiretaNeon(uri){
 const u=new URL(uri);
 if(u.hostname.endsWith('.neon.tech'))u.hostname=u.hostname.replace('-pooler.','.');
 else if(u.hostname.includes('-pooler.'))throw Error('Configure a conexão direta do banco em DIRECT_URL.');
 return u.toString();
}
async function main(){
 const root=path.resolve(__dirname,'..');require('@next/env').loadEnvConfig(root,false,{info(){},error(){}});
 const configurada=process.env.DIRECT_URL||process.env.DATABASE_URL;
 if(!configurada)throw Error('Configure DIRECT_URL no arquivo .env antes de aplicar a migração.');
 const uri=conexaoDiretaNeon(configurada);
 const {PrismaClient}=require('@prisma/client');
 const consulta=async()=>{const db=new PrismaClient({datasources:{db:{url:uri}}});try{return await db.$queryRaw`SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"`;}finally{await db.$disconnect();}};
 let rows;try{rows=await consulta();}catch(e){throw Error('Não foi possível consultar o banco. Confira a conexão direta. Código: '+(e.code||e.errorCode||e.name||'CONEXAO_INDISPONIVEL'));}
 const pending=analisarMigracoes(rows,path.join(root,'prisma/migrations'));
 if(!pending.length){console.log('As migrações dos cursos livres, desconto e preço por disciplinas já estão aplicadas.');return;}
 if(process.argv.includes('--verificar')){console.log('Verificação concluída. Somente as migrações dos cursos livres, desconto e preço por disciplinas estão pendentes:\n'+pending.join('\n'));return;}
 console.log('Migrações que serão aplicadas:\n'+pending.join('\n'));
 const prismaCli=require.resolve('prisma/build/index.js');
 const result=require('node:child_process').spawnSync(process.execPath,[prismaCli,'migrate','deploy','--schema',path.join(root,'prisma/schema.prisma')],{cwd:root,stdio:'inherit',env:{...process.env,DIRECT_URL:uri},windowsHide:true});
 if(result.error||result.status!==0)throw Error('A migração não foi concluída. Não mescle a branch antes de resolver e verificar o histórico.');
 const restantes=analisarMigracoes(await consulta(),path.join(root,'prisma/migrations'));
 if(restantes.length)throw Error('Ainda há migrações dos cursos livres, desconto e preço por disciplinas pendentes.');
 console.log('Migrações verificadas. Agora a branch pode ser mesclada para publicar o novo fluxo.');
}
module.exports={TARGETS,analisarMigracoes,conexaoDiretaNeon};
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
