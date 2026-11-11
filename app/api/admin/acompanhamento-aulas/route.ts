import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigeAutorizacaoImagem } from "@/lib/desenvolvimento-materiais";
import { contextoAdmin, textoCurto } from "@/lib/acompanhamento-permissoes";
export const dynamic="force-dynamic";
export async function GET(){
  const ctx=await contextoAdmin();
  if(!ctx) return NextResponse.json({error:"Sem permissão"},{status:403});
  const [planos,registros]=await Promise.all([
    prisma.planoRelatorioAula.findMany({where:{instituicaoId:ctx.instituicaoId},include:{professor:{select:{nome:true}},turma:{select:{nome:true}}},orderBy:{atualizadoEm:"desc"},take:150}),
    prisma.registroDesenvolvimento.findMany({where:{instituicaoId:ctx.instituicaoId},include:{professor:{select:{nome:true}},aluno:{select:{nome:true}},turma:{select:{nome:true}},imagens:{select:{id:true,nomeOriginal:true,mime:true}}},orderBy:{atualizadoEm:"desc"},take:150}),
  ]);
  return NextResponse.json({planos,registros},{headers:{"Cache-Control":"private, no-store"}});
}
export async function PATCH(req:Request){
  const ctx=await contextoAdmin();
  if(!ctx) return NextResponse.json({error:"Sem permissão"},{status:403});
  const body=await req.json().catch(()=>null);
  const id=Number(body?.id);
  if(!Number.isSafeInteger(id)||id<=0||!["APROVAR","DEVOLVER","REVOGAR"].includes(body?.acao)||!["PLANO","DESENVOLVIMENTO"].includes(body?.alvo))return NextResponse.json({error:"Revisão inválida"},{status:400});
  const devolutiva=textoCurto(body.devolutiva,4000);
  if(body.acao==="DEVOLVER"&&!devolutiva) return NextResponse.json({error:"Informe o motivo da devolução"},{status:400});
  if(body.alvo==="PLANO"){
    if(body.acao==="REVOGAR")return NextResponse.json({error:"Ação não disponível"},{status:400});
    const result=await prisma.planoRelatorioAula.updateMany({where:{id,instituicaoId:ctx.instituicaoId,status:"ENVIADO"},data:{status:body.acao==="APROVAR"?"APROVADO":"REVISAO",devolutiva:devolutiva||null,revisadoEm:new Date(),revisadoPorId:ctx.usuario.id}});
    if(result.count!==1)return NextResponse.json({error:"Plano não encontrado ou já revisado"},{status:409});
  }else{
    const reg=await prisma.registroDesenvolvimento.findFirst({where:{id,instituicaoId:ctx.instituicaoId},select:{id:true,status:true,atualizadoEm:true,imagens:{select:{mime:true}}}});
    if(!reg) return NextResponse.json({error:"Registro não encontrado"},{status:404});
    if(body.acao==="REVOGAR" && reg.status!=="PUBLICADO")return NextResponse.json({error:"Somente publicações podem ser revogadas"},{status:409});
    if(body.acao!=="REVOGAR" && reg.status!=="ENVIADO")return NextResponse.json({error:"Registro não enviado para revisão"},{status:409});
    if(body.acao==="APROVAR"&&reg.imagens.some(anexo => exigeAutorizacaoImagem(anexo.mime))&&body.autorizacaoImagemConfirmada!==true) return NextResponse.json({error:"Confirme a autorização de uso de imagem antes de publicar fotos ou vídeos"},{status:400});
    const result=await prisma.registroDesenvolvimento.updateMany({where:{id,instituicaoId:ctx.instituicaoId,status:reg.status,atualizadoEm:reg.atualizadoEm},data:{
      status:body.acao==="APROVAR"?"PUBLICADO":body.acao==="DEVOLVER"?"DEVOLVIDO":"DEVOLVIDO",
      devolutiva:devolutiva||null,
      autorizacaoImagemConfirmada:body.acao==="APROVAR"?body.autorizacaoImagemConfirmada===true:false,
      publicadoEm:body.acao==="APROVAR"?new Date():null,publicadoPorId:body.acao==="APROVAR"?ctx.usuario.id:null,
    }});
    if(result.count!==1)return NextResponse.json({error:"Registro alterado por outra pessoa"},{status:409});
  }
  return NextResponse.json({ok:true});
}
