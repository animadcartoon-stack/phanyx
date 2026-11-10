import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contextoAdmin } from "@/lib/acompanhamento-permissoes";
export const dynamic="force-dynamic";
export async function GET(){
  const ctx=await contextoAdmin();
  if(!ctx)return NextResponse.json({error:"Sem permissão"},{status:403});
  const [regras,cursos]=await Promise.all([
    prisma.regraPlanejamentoAula.findMany({where:{instituicaoId:ctx.instituicaoId}}),
    prisma.curso.findMany({where:{instituicaoId:ctx.instituicaoId},select:{id:true,nome:true},orderBy:{nome:"asc"},take:300}),
  ]);
  return NextResponse.json({regras,cursos},{headers:{"Cache-Control":"private, no-store"}});
}
export async function PUT(req:Request){
  const ctx=await contextoAdmin();
  if(!ctx)return NextResponse.json({error:"Sem permissão"},{status:403});
  const body=await req.json().catch(()=>null);const cursoId=Number(body?.cursoId);
  if(!Number.isSafeInteger(cursoId)||cursoId<0||!["SEMANAL","MENSAL","ANUAL"].includes(body?.periodicidade)||typeof body?.exigeAprovacao!=="boolean")return NextResponse.json({error:"Configuração inválida"},{status:400});
  if(cursoId!==0){const curso=await prisma.curso.findFirst({where:{id:cursoId,instituicaoId:ctx.instituicaoId},select:{id:true}});if(!curso)return NextResponse.json({error:"Curso inválido"},{status:403});}
  const regra=await prisma.regraPlanejamentoAula.upsert({where:{instituicaoId_cursoId:{instituicaoId:ctx.instituicaoId,cursoId}},create:{instituicaoId:ctx.instituicaoId,cursoId,periodicidade:body.periodicidade,exigeAprovacao:body.exigeAprovacao},update:{periodicidade:body.periodicidade,exigeAprovacao:body.exigeAprovacao}});
  return NextResponse.json({ok:true,regra});
}
