import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { corpoLeitor, erroLeitor, exigirEscritaLeitor, falhaLeitor, idLeitor, itemPublicadoLeitor, jsonLeitor, obterLeitorBiblioteca } from "@/lib/biblioteca-leitor";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const leitor = await obterLeitorBiblioteca(); exigirEscritaLeitor(request, leitor);
    if (!leitor.configuracao?.permitirFavoritos) falhaLeitor(403, "FAVORITOS_DESABILITADOS");
    const item = await itemPublicadoLeitor(leitor, idLeitor(params.itemId));
    const corpo = await corpoLeitor(request);
    if (typeof corpo.favorito !== "boolean") falhaLeitor(400, "DADOS_INVALIDOS");
    const where = { instituicaoId: leitor.instituicaoId, usuarioId: leitor.usuarioId, itemId: item.id };
    if (corpo.favorito) await prisma.bibliotecaFavorito.upsert({ where: { instituicaoId_usuarioId_itemId: where }, create: where, update: {} });
    else await prisma.bibliotecaFavorito.deleteMany({ where });
    return jsonLeitor({ favorito: corpo.favorito });
  } catch (erro) { return erroLeitor(erro); }
}
