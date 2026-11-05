import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { getR2Client } from "@/lib/storage/r2";
import { baixarFotoPerfil, chaveMiniaturaPerfil, chaveMiniaturaPerfilAdministrativo, gerarMiniaturaPerfil, MAX_BYTES_FOTO_PERFIL_EXIBICAO } from "@/lib/server/miniatura-foto-perfil";

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

// Uploads anteriores podem ter sido gravados com uma chave R2, sem URL publica.
// Somente chaves geradas pelo upload de perfil sao aceitas aqui.
const CHAVE_UPLOAD = /^uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[a-z0-9._-]+$/i;
const MAX_BYTES_ORIGINAL = 50 * 1024 * 1024;

async function lerOriginalPrivado(bucket: string, chave: string): Promise<Buffer> {
  const objeto = await getR2Client().send(new GetObjectCommand({ Bucket: bucket, Key: chave }));
  if (!objeto.Body || (objeto.ContentLength ?? 0) > MAX_BYTES_ORIGINAL)
    throw new Error("Imagem original indisponivel ou acima do limite.");
  const partes: Buffer[] = [];
  let tamanho = 0;
  const corpo = objeto.Body as AsyncIterable<Uint8Array> & { destroy?: () => void };
  for await (const parte of corpo) {
    const bytes = Buffer.from(parte);
    tamanho += bytes.length;
    if (tamanho > MAX_BYTES_ORIGINAL) {
      corpo.destroy?.();
      throw new Error("Imagem original acima do limite.");
    }
    partes.push(bytes);
  }
  return Buffer.concat(partes);
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();
    if (!user) return semImagem(401);
    if (!user.instituicaoId) return semImagem(403);
    const funcionario = await prisma.funcionario.findFirst({
      where: { userId: user.id, instituicaoId: user.instituicaoId },
      select: { id: true, fotoPerfil: true },
    });
    // O mesmo endpoint /me aceita administradores sem registro de Funcionario.
    // Nao consultar outro cadastro quando um Funcionario ja representa este usuario.
    const administrador = funcionario ? null : await prisma.perfilAdministrativoUsuario.findUnique({
      where: { userId: user.id }, select: { fotoPerfil: true },
    });
    const foto = funcionario ? funcionario.fotoPerfil : administrador?.fotoPerfil;
    if (!foto) return semImagem(404);
    // A origem da imagem e exclusivamente o perfil do usuario autenticado.
    const versao = new URL(req.url).searchParams.get("v");
    if (versao && versao !== foto) return semImagem(404);
    const key = funcionario
      ? chaveMiniaturaPerfil(user.instituicaoId, funcionario.id, foto)
      : chaveMiniaturaPerfilAdministrativo(user.instituicaoId, user.id, foto);
    const etag = `"${key.split("/").pop()}"`;
    const headers = { "Cache-Control": "private, max-age=300", Vary: "Cookie", ETag: etag };
    if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) return semImagem(503);
    let miniatura: Buffer | null = await lerMiniatura(bucket, key);
    if (!miniatura) {
      const original = CHAVE_UPLOAD.test(foto)
        ? await lerOriginalPrivado(bucket, foto)
        : await baixarFotoPerfil(foto);
      miniatura = await gerarMiniaturaPerfil(original);
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
