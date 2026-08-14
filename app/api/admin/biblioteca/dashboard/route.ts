import {
  StatusArquivoBiblioteca,
  StatusAvaliacaoBiblioteca,
  StatusEmprestimoBiblioteca,
  StatusItemBiblioteca,
  StatusRecomendacaoBiblioteca,
  StatusReservaBiblioteca,
} from "@prisma/client";
import { NextResponse } from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const usuario = await getUserFromToken();

    if (!usuario) {
      throw new ErroBiblioteca(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const contexto =
      await obterContextoBiblioteca(usuario);

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.ver",
      "biblioteca.dashboard.ver"
    );

    const instituicaoId = contexto.instituicaoId;
    const agora = new Date();

    const [
      totalItens,
      itensPublicados,
      itensRascunho,
      arquivosDisponiveis,
      emprestimosAtivos,
      emprestimosAtrasados,
      reservasAguardando,
      avaliacoesPendentes,
      recomendacoesPublicadas,
      itensRecentes,
    ] = await prisma.$transaction([
      prisma.bibliotecaItem.count({
        where: {
          instituicaoId,
        },
      }),

      prisma.bibliotecaItem.count({
        where: {
          instituicaoId,
          status: StatusItemBiblioteca.PUBLICADO,
        },
      }),

      prisma.bibliotecaItem.count({
        where: {
          instituicaoId,
          status: StatusItemBiblioteca.RASCUNHO,
        },
      }),

      prisma.bibliotecaArquivo.count({
        where: {
          instituicaoId,
          status: StatusArquivoBiblioteca.DISPONIVEL,
        },
      }),

      prisma.bibliotecaEmprestimo.count({
        where: {
          instituicaoId,
          status: {
            in: [
              StatusEmprestimoBiblioteca.ATIVO,
              StatusEmprestimoBiblioteca.ATRASADO,
            ],
          },
        },
      }),

      prisma.bibliotecaEmprestimo.count({
        where: {
          instituicaoId,
          status:
            StatusEmprestimoBiblioteca.ATRASADO,
        },
      }),

      prisma.bibliotecaReserva.count({
        where: {
          instituicaoId,
          status:
            StatusReservaBiblioteca.AGUARDANDO,
        },
      }),

      prisma.bibliotecaAvaliacao.count({
        where: {
          instituicaoId,
          status:
            StatusAvaliacaoBiblioteca.PENDENTE,
        },
      }),

      prisma.bibliotecaRecomendacao.count({
        where: {
          instituicaoId,
          status:
            StatusRecomendacaoBiblioteca.PUBLICADA,

          AND: [
            {
              OR: [
                {
                  disponivelInicioEm: null,
                },
                {
                  disponivelInicioEm: {
                    lte: agora,
                  },
                },
              ],
            },
            {
              OR: [
                {
                  disponivelFimEm: null,
                },
                {
                  disponivelFimEm: {
                    gte: agora,
                  },
                },
              ],
            },
          ],
        },
      }),

      prisma.bibliotecaItem.findMany({
        where: {
          instituicaoId,
        },
        select: {
          id: true,
          titulo: true,
          tipo: true,
          status: true,
          capaUrl: true,
          criadoEm: true,
        },
        orderBy: {
          criadoEm: "desc",
        },
        take: 5,
      }),
    ]);

    return NextResponse.json(
      {
        biblioteca: {
          nome:
            contexto.configuracao?.nomeExibicao ||
            "Biblioteca Virtual",

          plano: contexto.modulo.plano,
          statusModulo: contexto.modulo.status,
        },

        indicadores: {
          totalItens,
          itensPublicados,
          itensRascunho,
          arquivosDisponiveis,
          emprestimosAtivos,
          emprestimosAtrasados,
          reservasAguardando,
          avaliacoesPendentes,
          recomendacoesPublicadas,
        },

        armazenamento: {
          contratadoBytes:
            contexto.armazenamento
              .contratadoBytes.toString(),

          extraBytes:
            contexto.armazenamento
              .extraBytes.toString(),

          limiteBytes:
            contexto.armazenamento
              .limiteBytes.toString(),

          utilizadoBytes:
            contexto.armazenamento
              .utilizadoBytes.toString(),

          disponivelBytes:
            contexto.armazenamento
              .disponivelBytes.toString(),
        },

        itensRecentes,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (erro) {
    const resposta =
      respostaErroBiblioteca(erro);

    return NextResponse.json(
      resposta.corpo,
      {
        status: resposta.status,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}