import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { getR2Client } from "@/lib/storage/r2";
import { baixarFotoPerfil, chaveMiniaturaPerfil, gerarMiniaturaPerfil, MAX_BYTES_FOTO_PERFIL_EXIBICAO } from "@/lib/server/miniatura-foto-perfil";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const semImagem = (status: number) => new Response(null, { status, headers: { "Cache-Control": "private, no-store" } });

async function lerMiniatura(bucket: string, key: string) {
  try {
    const objeto = await getR2Client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!objeto.Body || (objeto.ContentLength || 0) > MAX_BYTES_FOTO_PERFIL_EXIBICAO) return null;
    const bytes = Buffer.from(await objeto.Body.transformToByteArray());
    return bytes.length <= MAX_BYTES_FOTO_PERFIL_EXIBICAO ? bytes : null;
  } catch (error: unknown) {
    const falha = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (falha.name === "NoSuchKey" || falha.name === "NotFound" || falha.$metadata?.httpStatusCode === 404) return null;
    throw error;
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();
    if (!user) return semImagem(401);
    if (!user.instituicaoId) return semImagem(403);
    const perfil = await prisma.funcionario.findFirst({
      where: { userId: user.id, instituicaoId: user.instituicaoId },
      select: { id: true, fotoPerfil: true },
    });
    if (!perfil?.fotoPerfil) return semImagem(404);
    // A URL de origem vem exclusivamente do perfil autenticado, nunca da query.
    const versao = new URL(req.url).searchParams.get("v");
    if (versao && versao !== perfil.fotoPerfil) return semImagem(404);
    const key = chaveMiniaturaPerfil(user.instituicaoId, perfil.id, perfil.fotoPerfil);
    const etag = `"${key.split("/").pop()}"`;
    const headers = { "Cache-Control": "private, max-age=300", Vary: "Cookie", ETag: etag };
    if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) return semImagem(503);
    let miniatura: Buffer | null = await lerMiniatura(bucket, key);
    if (!miniatura) {
      miniatura = await gerarMiniaturaPerfil(await baixarFotoPerfil(perfil.fotoPerfil));
      try {
        await getR2Client().send(new PutObjectCommand({
          Bucket: bucket, Key: key, Body: miniatura, ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
        }));
      } catch { console.error("Não foi possível armazenar a miniatura do perfil."); }
    }
    return new Response(new Uint8Array(miniatura), {
      headers: { ...headers, "Content-Type": "image/webp", "Content-Length": String(miniatura.length), "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    console.error("Não foi possível preparar a miniatura do perfil.");
    return semImagem(503);
  }
}
