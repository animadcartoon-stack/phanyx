import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { getR2Client } from "@/lib/storage/r2";
import { contextoProfessor, turmaDoProfessor } from "@/lib/acompanhamento-permissoes";
export const runtime = "nodejs";
const MAX_BYTES=5*1024*1024;
function tipoReal(bytes: Buffer): string|null {
  if (bytes.length>3 && bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff) return "image/jpeg";
  if (bytes.length>8 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png";
  if (bytes.length>12 && bytes.toString("ascii",0,4)==="RIFF" && bytes.toString("ascii",8,12)==="WEBP") return "image/webp";
  return null;
}
export async function POST(req: Request, { params }: { params: { id:string } }) {
  const ctx=await contextoProfessor("professor.desenvolvimento");
  if (!ctx) return NextResponse.json({error:"Sem permissão"},{status:403});
  const id=Number(params.id);
  if (!Number.isSafeInteger(id)||id<=0) return NextResponse.json({error:"ID inválido"},{status:400});
  const reg=await prisma.registroDesenvolvimento.findFirst({where:{id,instituicaoId:ctx.instituicaoId,professorId:ctx.professor.id},include:{imagens:{select:{id:true}}}});
  if (!reg || !["RASCUNHO", "DEVOLVIDO"].includes(reg.status) || reg.imagens.length>=5 || !await turmaDoProfessor(ctx.instituicaoId,ctx.professor.id,reg.turmaId)) return NextResponse.json({error:"Registro não permite novas imagens"},{status:403});
  if (Number(req.headers.get("content-length")||0)>MAX_BYTES+100000) return NextResponse.json({error:"Arquivo muito grande"},{status:413});
  const form=await req.formData();const arquivo=form.get("arquivo");
  if (!(arquivo instanceof File)||arquivo.size===0||arquivo.size>MAX_BYTES) return NextResponse.json({error:"Imagem inválida ou acima de 5 MB"},{status:400});
  const bytes=Buffer.from(await arquivo.arrayBuffer());const mime=tipoReal(bytes);
  if (!mime || mime!==arquivo.type) return NextResponse.json({error:"Somente JPEG, PNG ou WebP válidos"},{status:400});
  const bucket=process.env.R2_PRIVATE_BUCKET_NAME;
  if (!bucket || (process.env.R2_PUBLIC_URL && bucket===process.env.R2_BUCKET_NAME)) return NextResponse.json({error:"Bucket privado indisponível ou configurado como público"},{status:503});
  const key=`privado/instituicoes/${ctx.instituicaoId}/desenvolvimento/${id}/${randomUUID()}`;
  await getR2Client().send(new PutObjectCommand({Bucket:bucket,Key:key,Body:bytes,ContentType:mime,CacheControl:"private, no-store"}));
  try {
    const imagem=await prisma.imagemDesenvolvimento.create({data:{registroId:id,instituicaoId:ctx.instituicaoId,chaveR2:key,mime,tamanho:arquivo.size,nomeOriginal:String(arquivo.name).slice(0,150)}});
    return NextResponse.json({ok:true,imagem:{id:imagem.id,nomeOriginal:imagem.nomeOriginal}},{status:201});
  } catch(e) {
    await getR2Client().send(new DeleteObjectCommand({Bucket:bucket,Key:key})).catch(()=>null);
    throw e;
  }
}
