import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contextoAluno } from "@/lib/acompanhamento-permissoes";
export const dynamic="force-dynamic";
export async function GET() {
  const ctx=await contextoAluno();
  if (!ctx) return NextResponse.json({error:"Sem permissão"},{status:403});
  const registros=await prisma.registroDesenvolvimento.findMany({
    where:{instituicaoId:ctx.instituicaoId,alunoId:ctx.aluno.id,status:"PUBLICADO"},
    select:{id:true,tipo:true,titulo:true,descricao:true,conceito:true,nota:true,prazoTarefa:true,publicadoEm:true,
      turma:{select:{nome:true}},professor:{select:{nome:true}},imagens:{select:{id:true,nomeOriginal:true}}},
    orderBy:{publicadoEm:"desc"},take:100,
  });
  return NextResponse.json({registros},{headers:{"Cache-Control":"private, no-store"}});
}
