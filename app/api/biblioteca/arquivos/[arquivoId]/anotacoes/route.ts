import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { arquivoPdfLeitor, corpoLeitor, erroLeitor, exigirEscritaLeitor, falhaLeitor, idLeitor, jsonLeitor, obterLeitorBiblioteca } from "@/lib/biblioteca-leitor";
import { areasAnotacaoValidas, LIMITE_PAGINAS_BIBLIOTECA } from "@/lib/biblioteca-direitos-leitura";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { arquivoId: string } }) {
  try {
    const leitor = await obterLeitorBiblioteca();
    const { arquivo } = await arquivoPdfLeitor(leitor, idLeitor(params.arquivoId));
    const anotacoes = await prisma.bibliotecaAnotacao.findMany({
      where: { instituicaoId: leitor.instituicaoId, usuarioId: leitor.usuarioId, arquivoId: arquivo.id, itemId: arquivo.itemId },
      orderBy: [{ pagina: "asc" }, { criadoEm: "asc" }], take: 2000,
    });
    return jsonLeitor({ anotacoes });
  } catch (erro) { return erroLeitor(erro); }
}

export async function POST(request: NextRequest, { params }: { params: { arquivoId: string } }) {
  try {
    const leitor = await obterLeitorBiblioteca(); exigirEscritaLeitor(request, leitor);
    const { arquivo } = await arquivoPdfLeitor(leitor, idLeitor(params.arquivoId));
    const corpo = await corpoLeitor(request);
    const tipo = String(corpo.tipo || ""); const pagina = corpo.pagina;
    const trecho = typeof corpo.trecho === "string" ? corpo.trecho.trim() : "";
    const conteudo = typeof corpo.conteudo === "string" ? corpo.conteudo.trim() : "";
    const cor = String(corpo.cor || "AMARELO"); const areas = corpo.areas ?? [];
    if (!["MARCADOR", "DESTAQUE", "NOTA"].includes(tipo) ||
        !Number.isSafeInteger(pagina) || Number(pagina) < 1 || Number(pagina) > LIMITE_PAGINAS_BIBLIOTECA ||
        trecho.length > 2000 || conteudo.length > 10000 || !areasAnotacaoValidas(areas) ||
        !["AMARELO", "VERDE", "AZUL", "ROSA"].includes(cor) ||
        (tipo === "DESTAQUE" && (!trecho || !Array.isArray(areas) || !areas.length)) ||
        (tipo === "NOTA" && !conteudo)) falhaLeitor(400, "ANOTACAO_INVALIDA");
    const where = { instituicaoId: leitor.instituicaoId, usuarioId: leitor.usuarioId, arquivoId: arquivo.id };
    const anotacao = await prisma.$transaction(async (tx) => {
      // A trava por leitor evita ultrapassar a cota com gravações simultâneas.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(${leitor.instituicaoId}::int, ${leitor.usuarioId}::int)`;
      if (await tx.bibliotecaAnotacao.count({ where }) >= 2000) falhaLeitor(409, "LIMITE_ANOTACOES");
      if (tipo === "MARCADOR") {
        const existente = await tx.bibliotecaAnotacao.findFirst({ where: { ...where, tipo, pagina: Number(pagina) } });
        if (existente) return existente;
      }
      return tx.bibliotecaAnotacao.create({ data: { ...where, itemId: arquivo.itemId, tipo, pagina: Number(pagina),
        trecho: trecho || null, conteudo: conteudo || null, cor, areas: areas as Prisma.InputJsonValue } });
    });
    return jsonLeitor({ anotacao }, 201);
  } catch (erro) { return erroLeitor(erro); }
}

export async function DELETE(request: NextRequest, { params }: { params: { arquivoId: string } }) {
  try {
    const leitor = await obterLeitorBiblioteca(); exigirEscritaLeitor(request, leitor);
    const { arquivo } = await arquivoPdfLeitor(leitor, idLeitor(params.arquivoId));
    const corpo = await corpoLeitor(request);
    if (typeof corpo.id !== "string" || corpo.id.length > 100) falhaLeitor(400, "IDENTIFICADOR_INVALIDO");
    const resultado = await prisma.bibliotecaAnotacao.deleteMany({ where: {
      id: corpo.id, instituicaoId: leitor.instituicaoId, usuarioId: leitor.usuarioId, arquivoId: arquivo.id, itemId: arquivo.itemId,
    } });
    if (!resultado.count) falhaLeitor(404, "ANOTACAO_NAO_ENCONTRADA");
    return jsonLeitor({ removida: true });
  } catch (erro) { return erroLeitor(erro); }
}
