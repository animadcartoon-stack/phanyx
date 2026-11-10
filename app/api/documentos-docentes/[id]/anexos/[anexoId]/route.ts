import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { getR2Client } from "@/lib/storage/r2";
import { documentoAutorizado } from "@/lib/documentos-docentes/seguranca";
import { nomeSeguroCabecalho, MAX_ANEXO_DOCENTE } from "@/lib/documentos-docentes/anexo-seguro";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params:{id:string;anexoId:string} }) {
  const auth = await documentoAutorizado(Number(params.id));
  if (!auth) return new Response(null,{status:404});
  const anexoId = Number(params.anexoId);
  if (!Number.isSafeInteger(anexoId) || anexoId<=0) return new Response(null,{status:404});
  const anexo = await prisma.documentoDocenteAnexo.findFirst({where:{id:anexoId,documentoId:auth.documento.id}});
  if (!anexo) return new Response(null,{status:404});
  const bucket = process.env.R2_PRIVATE_BUCKET_NAME;
  if (!bucket || (process.env.R2_PUBLIC_URL && bucket===process.env.R2_BUCKET_NAME)) return NextResponse.json({error:"Armazenamento privado não configurado."},{status:503});
  if (anexo.tamanho>MAX_ANEXO_DOCENTE) return new Response(null,{status:413});
  try {
    const resposta = await getR2Client().send(new GetObjectCommand({Bucket:bucket,Key:anexo.chaveR2}));
    if (!resposta.Body || Number(resposta.ContentLength||0)>MAX_ANEXO_DOCENTE) return new Response(null,{status:413});
    const bytes = Buffer.from(await resposta.Body.transformToByteArray());
    if (bytes.length !== anexo.tamanho || bytes.length>MAX_ANEXO_DOCENTE || (anexo.sha256 && createHash("sha256").update(bytes).digest("hex")!==anexo.sha256))
      return NextResponse.json({error:"Integridade do arquivo não confirmada."},{status:409});
    const nomeAscii = nomeSeguroCabecalho(anexo.nomeOriginal);
    const nomeUtf8 = encodeURIComponent(anexo.nomeOriginal);
    return new Response(new Uint8Array(bytes),{status:200,headers:{
      "Content-Type":"application/octet-stream", "Content-Length":String(bytes.length),
      "Content-Disposition":`attachment; filename="${nomeAscii}"; filename*=UTF-8''${nomeUtf8}`,
      "Cache-Control":"private, no-store", "X-Content-Type-Options":"nosniff", "Content-Security-Policy":"default-src 'none'; sandbox",
    }});
  } catch(erro) { console.error("R2 docente download:",erro); return NextResponse.json({error:"Falha ao recuperar arquivo privado."},{status:503}); }
}
