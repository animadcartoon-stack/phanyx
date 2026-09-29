import {
  MobilidadeStatusDocumento,
  MobilidadeVinculoCandidato,
} from "@prisma/client";

import {
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

export async function GET() {
  try {
    const usuario =
      await getUserFromToken();

    if (
      !usuario ||
      String(
        usuario.role || ""
      ).toUpperCase() !==
        "ALUNO" ||
      !usuario.instituicaoId
    ) {
      return NextResponse.json(
        {
          ok: false,
          codigo:
            "NAO_AUTORIZADO",
        },
        {
          status: 401,
        }
      );
    }

    const aluno =
      await prisma.aluno.findFirst({
        where: {
          userId:
            usuario.id,

          instituicaoId:
            usuario.instituicaoId,
        },

        select: {
          id: true,
          nome: true,
          nomeSocial: true,
        },
      });

    if (!aluno) {
      return NextResponse.json(
        {
          ok: false,
          codigo:
            "ALUNO_NAO_ENCONTRADO",
        },
        {
          status: 404,
        }
      );
    }

    const candidaturasRaw =
      await prisma.mobilidadeCandidatura.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,

          alunoId:
            aluno.id,

          vinculoCandidato:
            MobilidadeVinculoCandidato.ALUNO_PHANYX,
        },

        select: {
          id: true,
          status: true,
          motivoStatus: true,
          enviadaEm: true,
          analisadaEm: true,
          classificacao: true,
          createdAt: true,
          updatedAt: true,

          oferta: {
            select: {
              id: true,
              titulo: true,
              codigo: true,
              ano: true,
              periodo: true,
              mobilidadeInicio:
                true,
              mobilidadeFim:
                true,

              programa: {
                select: {
                  id: true,
                  nome: true,
                  tipo: true,
                  direcao: true,

                  instituicaoParceira:
                    {
                      select: {
                        id: true,
                        nome: true,
                        paisCodigo:
                          true,
                        paisNome:
                          true,
                        cidade: true,
                      },
                    },
                },
              },
            },
          },

          documentos: {
            select: {
              id: true,
              tipo: true,
              titulo: true,
              descricaoRequisito:
                true,
              obrigatorio: true,
              exigeValidade:
                true,
              ordem: true,

              /*
               * Não devolvemos arquivoUrl.
               * O Blob é privado.
               */
              arquivoNome: true,
              mimeType: true,
              tamanho: true,
              validadeAte: true,

              status: true,
              enviadoEm: true,
              analisadoEm: true,
              motivoRejeicao:
                true,
              observacoes: true,
            },

            orderBy: [
              {
                ordem: "asc",
              },
              {
                id: "asc",
              },
            ],
          },
        },

        orderBy: [
          {
            createdAt:
              "desc",
          },
          {
            id:
              "desc",
          },
        ],
      });

    const candidaturas =
      candidaturasRaw.map(
        (candidatura) => {
          const obrigatorios =
            candidatura.documentos.filter(
              (documento) =>
                documento.obrigatorio
            );

          return {
            ...candidatura,

            documentosResumo: {
              total:
                candidatura
                  .documentos
                  .length,

              obrigatorios:
                obrigatorios.length,

              aprovados:
                candidatura.documentos.filter(
                  (documento) =>
                    documento.status ===
                    MobilidadeStatusDocumento.APROVADO
                ).length,

              pendentes:
                obrigatorios.filter(
                  (documento) =>
                    documento.status !==
                    MobilidadeStatusDocumento.APROVADO
                ).length,
            },
          };
        }
      );

    return NextResponse.json(
      {
        ok: true,

        aluno: {
          id:
            aluno.id,

          nome:
            aluno.nomeSocial?.trim() ||
            aluno.nome,
        },

        candidaturas,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (erro) {
    console.error(
      "[aluno/mobilidade] Erro ao carregar candidaturas:",
      erro
    );

    return NextResponse.json(
      {
        ok: false,
        codigo:
          "ERRO_INTERNO",
      },
      {
        status: 500,
      }
    );
  }
}
