import {
  MobilidadeDirecao,
  MobilidadeStatusOferta,
  MobilidadeTipoPrograma,
  MobilidadeVinculoCandidato,
  Prisma,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function textoParametro(
  valor: string | null,
  limite = 120
) {
  const texto = String(valor || "")
    .trim()
    .slice(0, limite);

  return texto || null;
}

function inteiroPositivo(
  valor: string | null
) {
  if (!valor) {
    return null;
  }

  const numero = Number(valor);

  return Number.isInteger(numero) &&
    numero > 0
    ? numero
    : null;
}

export async function GET(
  request: NextRequest
) {
  try {
    const usuario =
      await getUserFromToken();

    if (
      !usuario ||
      String(
        usuario.role || ""
      ).toUpperCase() !== "ALUNO" ||
      !usuario.instituicaoId
    ) {
      return NextResponse.json(
        {
          ok: false,
          codigo: "NAO_AUTORIZADO",
        },
        {
          status: 401,
        }
      );
    }

    const aluno =
      await prisma.aluno.findFirst({
        where: {
          userId: usuario.id,
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

    const {
      searchParams,
    } = request.nextUrl;

    const busca =
      textoParametro(
        searchParams.get("q")
      );

    const paisCodigo =
      textoParametro(
        searchParams.get("pais"),
        2
      )?.toUpperCase() ?? null;

    const periodo =
      textoParametro(
        searchParams.get("periodo"),
        80
      );

    const cursoId =
      inteiroPositivo(
        searchParams.get("cursoId")
      );

    const tipoBruto =
      textoParametro(
        searchParams.get("tipo"),
        80
      )?.toUpperCase() ?? null;

    const tipoPrograma =
      tipoBruto &&
      Object.values(
        MobilidadeTipoPrograma
      ).includes(
        tipoBruto as
          MobilidadeTipoPrograma
      )
        ? (
            tipoBruto as
              MobilidadeTipoPrograma
          )
        : null;

    const agora =
      new Date();

    const filtrosAnd:
      Prisma.MobilidadeOfertaWhereInput[] =
        [
          {
            OR: [
              {
                inscricoesInicio:
                  null,
              },
              {
                inscricoesInicio: {
                  lte: agora,
                },
              },
            ],
          },

          {
            OR: [
              {
                inscricoesFim:
                  null,
              },
              {
                inscricoesFim: {
                  gte: agora,
                },
              },
            ],
          },

          {
            programa: {
              ativo: true,

              direcao: {
                in: [
                  MobilidadeDirecao.SAIDA,
                  MobilidadeDirecao.BIDIRECIONAL,
                ],
              },
            },
          },
        ];

    if (busca) {
      filtrosAnd.push({
        OR: [
          {
            titulo: {
              contains: busca,
              mode: "insensitive",
            },
          },

          {
            codigo: {
              contains: busca,
              mode: "insensitive",
            },
          },

          {
            descricao: {
              contains: busca,
              mode: "insensitive",
            },
          },

          {
            programa: {
              nome: {
                contains: busca,
                mode: "insensitive",
              },
            },
          },
        ],
      });
    }

    if (paisCodigo) {
      filtrosAnd.push({
        OR: [
          {
            programa: {
              instituicaoParceira: {
                is: {
                  paisCodigo,
                },
              },
            },
          },

          {
            programa: {
              convenio: {
                is: {
                  instituicaoParceira: {
                    paisCodigo,
                  },
                },
              },
            },
          },
        ],
      });
    }

    if (tipoPrograma) {
      filtrosAnd.push({
        programa: {
          tipo:
            tipoPrograma,
        },
      });
    }

    if (periodo) {
      filtrosAnd.push({
        periodo: {
          contains: periodo,
          mode: "insensitive",
        },
      });
    }

    if (cursoId) {
      filtrosAnd.push({
        cursos: {
          some: {
            cursoId,
          },
        },
      });
    }

    const oportunidadesRaw =
      await prisma.mobilidadeOferta.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,

          status:
            MobilidadeStatusOferta.INSCRICOES_ABERTAS,

          AND:
            filtrosAnd,
        },

        select: {
          id: true,
          titulo: true,
          codigo: true,
          descricao: true,

          ano: true,
          periodo: true,

          inscricoesInicio:
            true,
          inscricoesFim:
            true,

          mobilidadeInicio:
            true,
          mobilidadeFim:
            true,

          vagas: true,
          permiteListaEspera:
            true,

          criteriosElegibilidade:
            true,
          instrucoes: true,
          publicadoEm: true,

          programa: {
            select: {
              id: true,
              nome: true,
              tipo: true,
              direcao: true,

              idiomaPrincipal:
                true,
              nivelIdiomaMinimo:
                true,

              duracaoMinimaDias:
                true,
              duracaoMaximaDias:
                true,

              instituicaoParceira:
                {
                  select: {
                    id: true,
                    nome: true,
                    sigla: true,

                    paisCodigo:
                      true,
                    paisNome: true,

                    cidade: true,
                    estadoProvincia:
                      true,

                    site: true,
                  },
                },

              convenio: {
                select: {
                  id: true,
                  nome: true,
                  codigo: true,

                  instituicaoParceira:
                    {
                      select: {
                        id: true,
                        nome: true,
                        sigla: true,

                        paisCodigo:
                          true,
                        paisNome:
                          true,

                        cidade: true,
                        estadoProvincia:
                          true,

                        site: true,
                      },
                    },
                },
              },
            },
          },

          cursos: {
            select: {
              cursoId: true,
            },

            orderBy: {
              cursoId: "asc",
            },
          },

          requisitosDocumentos:
            {
              where: {
                ativo: true,
              },

              select: {
                id: true,
                tipo: true,
                titulo: true,
                obrigatorio: true,
                exigeValidade:
                  true,
                ordem: true,
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

          candidaturas: {
            where: {
              alunoId:
                aluno.id,

              vinculoCandidato:
                MobilidadeVinculoCandidato.ALUNO_PHANYX,
            },

            select: {
              id: true,
              status: true,
              createdAt: true,
            },

            take: 1,
          },
        },

        orderBy: [
          {
            inscricoesFim:
              "asc",
          },
          {
            mobilidadeInicio:
              "asc",
          },
          {
            id: "desc",
          },
        ],
      });

    const oportunidades =
      oportunidadesRaw.map(
        (oferta) => {
          const parceira =
            oferta.programa
              .instituicaoParceira ??
            oferta.programa
              .convenio
              ?.instituicaoParceira ??
            null;

          const candidatura =
            oferta.candidaturas[0] ??
            null;

          return {
            id:
              oferta.id,

            titulo:
              oferta.titulo,

            codigo:
              oferta.codigo,

            descricao:
              oferta.descricao,

            ano:
              oferta.ano,

            periodo:
              oferta.periodo,

            inscricoesInicio:
              oferta.inscricoesInicio,

            inscricoesFim:
              oferta.inscricoesFim,

            mobilidadeInicio:
              oferta.mobilidadeInicio,

            mobilidadeFim:
              oferta.mobilidadeFim,

            vagas:
              oferta.vagas,

            permiteListaEspera:
              oferta.permiteListaEspera,

            criteriosElegibilidade:
              oferta.criteriosElegibilidade,

            instrucoes:
              oferta.instrucoes,

            publicadoEm:
              oferta.publicadoEm,

            programa: {
              id:
                oferta.programa.id,

              nome:
                oferta.programa.nome,

              tipo:
                oferta.programa.tipo,

              direcao:
                oferta.programa.direcao,

              idiomaPrincipal:
                oferta.programa
                  .idiomaPrincipal,

              nivelIdiomaMinimo:
                oferta.programa
                  .nivelIdiomaMinimo,

              duracaoMinimaDias:
                oferta.programa
                  .duracaoMinimaDias,

              duracaoMaximaDias:
                oferta.programa
                  .duracaoMaximaDias,
            },

            instituicaoParceira:
              parceira,

            cursos:
              oferta.cursos,

            documentos: {
              total:
                oferta
                  .requisitosDocumentos
                  .length,

              obrigatorios:
                oferta
                  .requisitosDocumentos
                  .filter(
                    (
                      documento
                    ) =>
                      documento
                        .obrigatorio
                  )
                  .length,

              requisitos:
                oferta
                  .requisitosDocumentos,
            },

            candidatura:
              candidatura
                ? {
                    id:
                      candidatura.id,

                    status:
                      candidatura.status,

                    createdAt:
                      candidatura.createdAt,
                  }
                : null,

            jaCandidatado:
              Boolean(
                candidatura
              ),
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
            aluno.nomeSocial
              ?.trim() ||
            aluno.nome,
        },

        filtros: {
          q:
            busca,
          pais:
            paisCodigo,
          tipo:
            tipoPrograma,
          periodo,
          cursoId,
        },

        total:
          oportunidades.length,

        oportunidades,
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
      "[aluno/mobilidade/oportunidades] Erro ao carregar oportunidades:",
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
