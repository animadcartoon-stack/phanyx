import {
  MobilidadeStatusCandidatura,
  MobilidadeStatusConvenio,
  MobilidadeStatusDocumento,
  MobilidadeStatusOferta,
  MobilidadeStatusPrograma,
} from "@prisma/client";
import { NextResponse } from "next/server";

import {
  exigirAcessoMobilidade,
  respostaErroMobilidade,
} from "@/lib/mobilidade-acesso";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const usuario = await getUserFromToken();

    const instituicaoId =
      exigirAcessoMobilidade(
        usuario,
        "mobilidade.dashboard.ver"
      );

    const agora = new Date();

    const [
      instituicoesParceiras,
      conveniosAtivos,
      programasAtivos,
      ofertasAbertas,
      totalCandidaturas,
      candidaturasPendentes,
      candidaturasAprovadas,
      documentosPendentes,
      proximosPrazos,
      candidaturasRecentes,
    ] = await prisma.$transaction([
      prisma.mobilidadeInstituicaoParceira.count({
        where: {
          instituicaoId,
          ativo: true,
        },
      }),

      prisma.mobilidadeConvenio.count({
        where: {
          instituicaoId,
          status:
            MobilidadeStatusConvenio.ATIVO,
        },
      }),

      prisma.mobilidadePrograma.count({
        where: {
          instituicaoId,
          ativo: true,
          status:
            MobilidadeStatusPrograma.ATIVO,
        },
      }),

      prisma.mobilidadeOferta.count({
        where: {
          instituicaoId,
          status:
            MobilidadeStatusOferta.INSCRICOES_ABERTAS,
        },
      }),

      prisma.mobilidadeCandidatura.count({
        where: {
          instituicaoId,
        },
      }),

      prisma.mobilidadeCandidatura.count({
        where: {
          instituicaoId,
          status: {
            in: [
              MobilidadeStatusCandidatura.ENVIADA,
              MobilidadeStatusCandidatura.EM_ANALISE,
              MobilidadeStatusCandidatura.DOCUMENTACAO_PENDENTE,
              MobilidadeStatusCandidatura.ELEGIVEL,
              MobilidadeStatusCandidatura.EM_SELECAO,
              MobilidadeStatusCandidatura.CLASSIFICADA,
              MobilidadeStatusCandidatura.LISTA_ESPERA,
            ],
          },
        },
      }),

      prisma.mobilidadeCandidatura.count({
        where: {
          instituicaoId,
          status:
            MobilidadeStatusCandidatura.APROVADA,
        },
      }),

      prisma.mobilidadeCandidaturaDocumento.count({
        where: {
          instituicaoId,
          obrigatorio: true,
          status: {
            not:
              MobilidadeStatusDocumento.APROVADO,
          },
        },
      }),

      prisma.mobilidadeOferta.findMany({
        where: {
          instituicaoId,

          status: {
            in: [
              MobilidadeStatusOferta.INSCRICOES_AGENDADAS,
              MobilidadeStatusOferta.INSCRICOES_ABERTAS,
            ],
          },

          inscricoesFim: {
            gte: agora,
          },
        },

        select: {
          id: true,
          titulo: true,
          status: true,
          inscricoesInicio: true,
          inscricoesFim: true,
          mobilidadeInicio: true,
          mobilidadeFim: true,
          vagas: true,

          programa: {
            select: {
              nome: true,
              tipo: true,

              instituicaoParceira: {
                select: {
                  nome: true,
                  paisCodigo: true,
                  paisNome: true,
                },
              },
            },
          },
        },

        orderBy: {
          inscricoesFim: "asc",
        },

        take: 5,
      }),

      prisma.mobilidadeCandidatura.findMany({
        where: {
          instituicaoId,
        },

        select: {
          id: true,
          nomeSnapshot: true,
          status: true,
          vinculoCandidato: true,
          enviadaEm: true,
          createdAt: true,

          oferta: {
            select: {
              titulo: true,

              programa: {
                select: {
                  instituicaoParceira: {
                    select: {
                      nome: true,
                      paisCodigo: true,
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 5,
      }),
    ]);

    return NextResponse.json(
      {
        ok: true,

        indicadores: {
          instituicoesParceiras,
          conveniosAtivos,
          programasAtivos,
          ofertasAbertas,
          totalCandidaturas,
          candidaturasPendentes,
          candidaturasAprovadas,
          documentosPendentes,
        },

        proximosPrazos,
        candidaturasRecentes,
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
      respostaErroMobilidade(erro);

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
