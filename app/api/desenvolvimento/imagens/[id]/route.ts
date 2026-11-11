import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { getR2Client } from "@/lib/storage/r2";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { paginaVisivel } from "@/lib/portal-config";
import { paginaProfessorVisivel } from "@/lib/portal-professor-permissoes";
export const runtime="nodejs";
export async function GET(_: Request,{params}:{params:{id:string}}) {
  const user=await getUserFromToken();
  if (!user?.instituicaoId) return new Response(null,{status:401});
  const id=Number(params.id);
  if (!Number.isSafeInteger(id)||id<=0) return new Response(null,{status:404});
  const imagem=await prisma.imagemDesenvolvimento.findFirst({where:{id,instituicaoId:user.instituicaoId},include:{registro:{select:{alunoId:true,professorId:true,status:true,instituicaoId:true,autorizacaoImagemConfirmada:true}}}});
  if (!imagem || imagem.registro.instituicaoId!==user.instituicaoId) return new Response(null,{status:404});
  let permitido=isAdminLike(user.role);
  if (user.role.toUpperCase()==="PROFESSOR") {
    const professor=await prisma.professor.findFirst({where:{userId:user.id,instituicaoId:user.instituicaoId,ativo:true},select:{id:true}});
    permitido=Boolean(professor && professor.id===imagem.registro.professorId && await paginaProfessorVisivel(user.instituicaoId,"PROFESSOR","professor.desenvolvimento",professor.id,false));
  } else if (user.role.toUpperCase()==="ALUNO") {
    const aluno=await prisma.aluno.findFirst({where:{userId:user.id,instituicaoId:user.instituicaoId,ativo:true},select:{id:true}});
    permitido=Boolean(aluno && aluno.id===imagem.registro.alunoId && imagem.registro.status==="PUBLICADO" && imagem.registro.autorizacaoImagemConfirmada && await paginaVisivel(user.instituicaoId,"ALUNO","aluno.desenvolvimento",false));
  }
  if (!permitido) return new Response(null,{status:403});
  const bucket=process.env.R2_PRIVATE_BUCKET_NAME;
  if (!bucket || (process.env.R2_PUBLIC_URL && bucket===process.env.R2_BUCKET_NAME)) return new Response(null,{status:503});
  const obj=await getR2Client().send(new GetObjectCommand({Bucket:bucket,Key:imagem.chaveR2}));
  if (!obj.Body || Number(obj.ContentLength||0)>5*1024*1024) return new Response(null,{status:404});
  const bytes=Buffer.from(await obj.Body.transformToByteArray());
  if(bytes.length>5*1024*1024) return new Response(null,{status:413});
  return new Response(new Uint8Array(bytes),{headers:{"Content-Type":imagem.mime,"Content-Length":String(bytes.length),"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'"}});
}
