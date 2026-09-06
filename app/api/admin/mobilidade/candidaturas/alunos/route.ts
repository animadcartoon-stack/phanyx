import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  exigirAcessoMobilidade,
  respostaErroMobilidade,
} from "@/lib/mobilidade-acesso";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest
) {
  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirAcessoMobilidade(
        usuario,
        "mobilidade.candidaturas.ver",
        "mobilidade.candidaturas.gerenciar"
      );

    const q =
      req.nextUrl.searchParams
        .get("q")
        ?.trim() ?? "";

    const ofertaIdParam =
      Number(
        req.nextUrl.searchParams
          .get("ofertaId") ?? ""
      );

    const ofertaId =
      Number.isInteger(
        ofertaIdParam
      ) &&
      ofertaIdParam > 0
        ? ofertaIdParam
        : null;

    if (q.length < 2) {
      return NextResponse.json(
        {
          ok: true,
          alunos: [],
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    let cursosElegiveis:
      | Set<number>
      | null = null;

    if (ofertaId) {
      const oferta =
        await prisma.mobilidadeOferta.findFirst({
          where: {
            id: ofertaId,
            instituicaoId,
          },

          select: {
            cursos: {
              select: {
                cursoId: true,
              },
            },
          },
        });

      if (oferta) {
        cursosElegiveis =
          oferta.cursos.length > 0
            ? new Set(
                oferta.cursos.map(
                  (item) =>
                    item.cursoId
                )
              )
            : null;
      }
    }

    const alunos =
      await prisma.aluno.findMany({
        where: {
          instituicaoId,
          ativo: true,

          user: {
            ativo: true,
          },

          OR: [
            {
              nome: {
                contains: q,
                mode: "insensitive",
              },
            },

            {
              nomeSocial: {
                contains: q,
                mode: "insensitive",
              },
            },

            {
              matricula: {
                contains: q,
                mode: "insensitive",
              },
            },

            {
              user: {
                email: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            },

            {
              matriculas: {
                some: {
                  numeroMatricula: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              },
            },

            {
              matriculas: {
                some: {
                  numeroMatriculaLegado: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        },

        select: {
          id: true,
          nome: true,
          nomeSocial: true,
          telefone: true,
          paisTelefone: true,
          matricula: true,
          nacionalidade: true,
          paisResidencia: true,
          ativo: true,
          statusAluno: true,

          user: {
            select: {
              email: true,
            },
          },

          matriculas: {
            select: {
              id: true,
              numeroMatricula: true,
              numeroMatriculaLegado: true,
              status: true,
              modalidade: true,
              semestre: true,
              periodoLetivo: true,
              cursoId: true,

              curso: {
                select: {
                  id: true,
                  nome: true,
                  codigo: true,
                  ativo: true,
                },
              },
            },

            orderBy: {
              updatedAt: "desc",
            },

            take: 8,
          },
        },

        orderBy: {
          nome: "asc",
        },

        take: 20,
      });

    const resultado =
      alunos.map(
        (aluno) => ({
          id: aluno.id,

          nome:
            aluno.nomeSocial?.trim() ||
            aluno.nome,

          nomeRegistro:
            aluno.nome,

          email:
            aluno.user.email,

          telefone:
            aluno.telefone,

          paisTelefone:
            aluno.paisTelefone,

          matriculaGeral:
            aluno.matricula,

          nacionalidade:
            aluno.nacionalidade,

          paisResidencia:
            aluno.paisResidencia,

          statusAluno:
            aluno.statusAluno,

          matriculas:
            aluno.matriculas.map(
              (matricula) => ({
                ...matricula,

                elegivelPeloCurso:
                  cursosElegiveis ===
                    null ||
                  (
                    matricula.cursoId !==
                      null &&
                    cursosElegiveis.has(
                      matricula.cursoId
                    )
                  ),
              })
            ),
        })
      );

    return NextResponse.json(
      {
        ok: true,
        alunos: resultado,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (erro) {
    const resposta =
      respostaErroMobilidade(
        erro
      );

    return NextResponse.json(
      resposta.corpo,
      {
        status:
          resposta.status,
      }
    );
  }
}
