import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contextoAdmin } from "@/lib/acompanhamento-permissoes";
export const dynamic="force-dynamic";
export async function GET(){
 const ctx=await contextoAdmin();if(!ctx)return NextResponse.json({error:"Sem permissão"},{status:403});
 const professores=await prisma.professor.findMany({where:{instituicaoId:ctx.instituicaoId},select:{id:true,nome:true,ativo:true,especialidade:true},orderBy:{nome:"asc"},take:1000});
 return NextResponse.json({professores},{headers:{"Cache-Control":"private, no-store"}});
}
