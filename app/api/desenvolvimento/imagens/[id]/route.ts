import { exigeAutorizacaoImagem, TIPOS_ANEXO_DESENVOLVIMENTO } from "@/lib/desenvolvimento-materiais";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { getR2Client } from "@/lib/storage/r2";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { paginaVisivel } from "@/lib/portal-config";
import { paginaProfessorVisivel } from "@/lib/portal-professor-permissoes";
export const runtime="nodejs";
export async function GET(req: Request,{params}:{params:{id:string}}) {
  const user=await getUserFromToken();
  if (!user?.instituicaoId) return new Response(null,{status:401});
  const id=Number(params.id);
  if (!Number.isSafeInteger(id)||id<=0||id>2147483647) return new Response(null,{status:404});
  const imagem=await prisma.imagemDesenvolvimento.findFirst({where:{id,instituicaoId:user.instituicaoId},include:{registro:{select:{alunoId:true,professorId:true,status:true,instituicaoId:true,autorizacaoImagemConfirmada:true}}}});
  if (!imagem || imagem.registro.instituicaoId!==user.instituicaoId) return new Response(null,{status:404});
  let permitido=isAdminLike(user.role);
  if (user.role.toUpperCase()==="PROFESSOR") {
    const professor=await prisma.professor.findFirst({where:{userId:user.id,instituicaoId:user.instituicaoId,ativo:true},select:{id:true}});
    permitido=Boolean(professor && professor.id===imagem.registro.professorId && await paginaProfessorVisivel(user.instituicaoId,"PROFESSOR","professor.desenvolvimento",professor.id,false));
  } else if (user.role.toUpperCase()==="ALUNO") {
    const aluno=await prisma.aluno.findFirst({where:{userId:user.id,instituicaoId:user.instituicaoId,ativo:true},select:{id:true}});
    permitido=Boolean(aluno && aluno.id===imagem.registro.alunoId && imagem.registro.status==="PUBLICADO" && (!exigeAutorizacaoImagem(imagem.mime) || imagem.registro.autorizacaoImagemConfirmada) && await paginaVisivel(user.instituicaoId,"ALUNO","aluno.desenvolvimento",false));
  }
  if (!permitido) return new Response(null,{status:403});
  const bucket=process.env.R2_PRIVATE_BUCKET_NAME;
  if (!bucket || (process.env.R2_PUBLIC_URL && bucket===process.env.R2_BUCKET_NAME)) return new Response(null,{status:503});
  if (!Object.hasOwn(TIPOS_ANEXO_DESENVOLVIMENTO, imagem.mime)) return new Response(null, { status: 404 });
  const range = req.headers.get("range") ?? undefined;
  if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) return new Response(null, { status: 416 });

  try {
    const objeto = await getR2Client().send(new GetObjectCommand({
      Bucket: bucket, Key: imagem.chaveR2, Range: range,
    }), { abortSignal: req.signal });
    if (!objeto.Body) return new Response(null, { status: 404 });

    const baixar = imagem.mime === "application/pdf";
    const nome = encodeURIComponent(imagem.nomeOriginal.replace(/[\uD800-\uDFFF]/g, "")).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16)}`);
    const headers = new Headers({
      "Content-Type": imagem.mime,
      "Content-Disposition": `${baixar ? "attachment" : "inline"}; filename*=UTF-8''${nome}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
      "Accept-Ranges": "bytes",
    });
    if (objeto.ContentLength !== undefined) headers.set("Content-Length", String(objeto.ContentLength));
    if (objeto.ContentRange) headers.set("Content-Range", objeto.ContentRange);
    return new Response(objeto.Body.transformToWebStream() as ReadableStream<Uint8Array>, {
      headers, status: objeto.ContentRange ? 206 : 200,
    });
  } catch (erro) {
    const status = (erro as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 416) return new Response(null, {
      status: 416, headers: { "Content-Range": `bytes */${imagem.tamanho}` },
    });
    return new Response(null, { status: status === 404 ? 404 : 502 });
  }
}
