import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import {
  ModalidadeCertificado,
  StatusComercialPolo,
  StatusPublicacaoCursoRede,
} from "@prisma/client";
import {
  filtroPolosVisiveis,
  obterContextoGestaoPolos,
} from "@/lib/polos-rede";

import {
  publicarCursoParaUnidadesIndependentes,
  sincronizarPublicacoesAtivasDoCurso,
} from "@/lib/publicacao-cursos-rede";

export const dynamic = "force-dynamic";
const MODALIDADES_CERTIFICADO = new Set<string>(
  Object.values(ModalidadeCertificado),
);

function normalizarModalidadeCertificado(
  valor: unknown,
): ModalidadeCertificado {
  const modalidade = String(valor || ModalidadeCertificado.GERAL)
    .trim()
    .toUpperCase();

  return MODALIDADES_CERTIFICADO.has(modalidade)
    ? (modalidade as ModalidadeCertificado)
    : ModalidadeCertificado.GERAL;
}

export const revalidate = 0;

function podeGerenciarCurso(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

function normalizarPoloIds(
  valor: unknown
): number[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .map((id) => Number(id))
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    )
  );
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const cursos = await prisma.curso.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        cursosPolos: {
          include: {
            polo: true,
          },
        },
        criadoPor: {
          select: {
            id: true,
            nome: true,
          },
        },
        excluidoPor: {
          select: {
            id: true,
            nome: true,
          },
        },
        publicacoesRedeOrigem: {
  where: {
    status: StatusPublicacaoCursoRede.ATIVA,
  },
  include: {
    polo: {
      select: {
        id: true,
        nome: true,
      },
    },
    instituicaoDestino: {
      select: {
        id: true,
        nome: true,
      },
    },
  },
},

publicacaoRedeDestino: {
  include: {
    cursoOrigem: {
      select: {
        id: true,
        nome: true,
        codigo: true,
      },
    },
    instituicaoOrigem: {
      select: {
        id: true,
        nome: true,
      },
    },
  },
},
      },
      orderBy: {
        nome: "asc",
      },
    });

    return NextResponse.json(cursos);
  } catch (error) {
    console.error("Erro ao buscar cursos:", error);

    return NextResponse.json(
      { error: "Erro ao buscar cursos" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      !podeGerenciarCurso(user.role)
    ) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const instituicaoId = Number(
      user.instituicaoId
    );

    const usuarioId = Number(user.id);

    if (
      !Number.isInteger(instituicaoId) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário sem instituição vinculada.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Sessão inválida para criar o curso.",
        },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Record<
      string,
      unknown
    >;

    const nome = String(
      body.nome ?? ""
    ).trim();

    const codigo = String(
      body.codigo ?? ""
    ).trim();

    const descricao = String(
      body.descricao ?? ""
    ).trim();

    const quantidadeSemestres =
      body.quantidadeSemestres !== null &&
        body.quantidadeSemestres !==
        undefined &&
        body.quantidadeSemestres !== ""
        ? Number(body.quantidadeSemestres)
        : null;

    const valorMatricula =
      body.valorMatricula !== null &&
        body.valorMatricula !== undefined &&
        body.valorMatricula !== ""
        ? Number(body.valorMatricula)
        : null;

    const valorMensalidade =
      body.valorMensalidade !== null &&
        body.valorMensalidade !==
        undefined &&
        body.valorMensalidade !== ""
        ? Number(body.valorMensalidade)
        : null;

    const quantidadeParcelas =
      body.quantidadeParcelas !== null &&
        body.quantidadeParcelas !==
        undefined &&
        body.quantidadeParcelas !== ""
        ? Number(body.quantidadeParcelas)
        : null;

    if (!nome) {
      return NextResponse.json(
        {
          error:
            "Nome do curso é obrigatório.",
        },
        { status: 400 }
      );
    }

    if (
      quantidadeSemestres !== null &&
      (!Number.isInteger(
        quantidadeSemestres
      ) ||
        quantidadeSemestres <= 0)
    ) {
      return NextResponse.json(
        {
          error:
            "A quantidade de semestres deve ser um número inteiro maior que zero.",
        },
        { status: 400 }
      );
    }

    if (
      valorMatricula !== null &&
      (!Number.isFinite(valorMatricula) ||
        valorMatricula < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "O valor da matrícula é inválido.",
        },
        { status: 400 }
      );
    }

    if (
      valorMensalidade !== null &&
      (!Number.isFinite(
        valorMensalidade
      ) ||
        valorMensalidade < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "O valor da mensalidade é inválido.",
        },
        { status: 400 }
      );
    }

    if (
      quantidadeParcelas !== null &&
      (!Number.isInteger(
        quantidadeParcelas
      ) ||
        quantidadeParcelas <= 0)
    ) {
      return NextResponse.json(
        {
          error:
            "A quantidade de parcelas deve ser um número inteiro maior que zero.",
        },
        { status: 400 }
      );
    }

    const cursoExistente =
      await prisma.curso.findFirst({
        where: {
          instituicaoId,
          nome,
        },
        select: {
          id: true,
        },
      });

    if (cursoExistente) {
      return NextResponse.json(
        {
          error:
            "Já existe um curso com este nome.",
        },
        { status: 400 }
      );
    }

    if (codigo) {
      const cursoComCodigo =
        await prisma.curso.findFirst({
          where: {
            instituicaoId,
            codigo,
          },
          select: {
            id: true,
          },
        });

      if (cursoComCodigo) {
        return NextResponse.json(
          {
            error:
              "Já existe um curso cadastrado com este código. Use outro código para continuar.",
          },
          { status: 400 }
        );
      }
    }

    const poloIdsNormalizados =
      normalizarPoloIds(body.poloIds);

    type PoloSelecionadoCurso = {
      id: number;
      nome: string;
      instituicaoId: number;
      instituicaoGeradaId: number | null;
      ativo: boolean;
      statusComercial: StatusComercialPolo;
    };

    let polosSelecionados:
      PoloSelecionadoCurso[] = [];

    if (
      poloIdsNormalizados.length > 0
    ) {
      const contexto =
        await obterContextoGestaoPolos(
          instituicaoId
        );

      if (!contexto) {
        return NextResponse.json(
          {
            error:
              "A instituição vinculada ao usuário não foi encontrada.",
          },
          { status: 404 }
        );
      }

      if (
        !contexto.podeGerenciarPolos
      ) {
        return NextResponse.json(
          {
            error:
              "Esta instituição não possui autorização para selecionar e publicar cursos em polos ou unidades.",
          },
          { status: 403 }
        );
      }

      polosSelecionados =
        await prisma.polo.findMany({
          where: {
            AND: [
              filtroPolosVisiveis(
                contexto
              ),
              {
                id: {
                  in:
                    poloIdsNormalizados,
                },
              },
            ],
          },
          select: {
            id: true,
            nome: true,
            instituicaoId: true,
            instituicaoGeradaId: true,
            ativo: true,
            statusComercial: true,
          },
        });

      if (
        polosSelecionados.length !==
        poloIdsNormalizados.length
      ) {
        return NextResponse.json(
          {
            error:
              "Um ou mais polos não pertencem ao escopo de gestão desta instituição.",
          },
          { status: 400 }
        );
      }

      const poloInativo =
        polosSelecionados.find(
          (polo) =>
            !polo.ativo ||
            polo.statusComercial !==
            StatusComercialPolo.ATIVO
        );

      if (poloInativo) {
        return NextResponse.json(
          {
            error: `O polo ou unidade "${poloInativo.nome}" está inativo, suspenso ou encerrado e não pode receber o curso.`,
          },
          { status: 409 }
        );
      }
    }

    const polosFisicos =
      polosSelecionados.filter(
        (polo) =>
          polo.instituicaoGeradaId ===
          null
      );

    const unidadesIndependentes =
      polosSelecionados
        .map((polo) => {
          const instituicaoGeradaId =
            Number(
              polo.instituicaoGeradaId
            );

          if (
            !Number.isInteger(
              instituicaoGeradaId
            ) ||
            instituicaoGeradaId <= 0
          ) {
            return null;
          }

          return {
            ...polo,
            instituicaoGeradaId,
          };
        })
        .filter(
          (
            polo
          ): polo is PoloSelecionadoCurso & {
            instituicaoGeradaId: number;
          } => polo !== null
        );

    /*
     * CursoPolo permanece restrito ao mesmo
     * tenant do curso de origem.
     *
     * Para unidades com outro instituicaoId,
     * o helper cria um Curso local.
     */
    const poloFisicoDeOutraInstituicao =
      polosFisicos.find(
        (polo) =>
          polo.instituicaoId !==
          instituicaoId
      );

    if (
      poloFisicoDeOutraInstituicao
    ) {
      return NextResponse.json(
        {
          error: `O polo físico "${poloFisicoDeOutraInstituicao.nome}" pertence a outro ID institucional. Provisione o ID institucional dessa unidade antes de publicar o curso para ela.`,
        },
        { status: 409 }
      );
    }

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const novoCurso =
            await tx.curso.create({
              data: {
                nome,

                codigo:
                  codigo || null,

                descricao:
                  descricao || null,

                modalidadeCertificado:
                  normalizarModalidadeCertificado(
                    body.modalidadeCertificado
                  ),

                quantidadeSemestres,

                valorMatricula,

                valorMensalidade,

                quantidadeParcelas,

                instituicaoId,

                criadoPorId:
                  usuarioId,
              },
              select: {
                id: true,
                nome: true,
              },
            });

          if (
            polosFisicos.length > 0
          ) {
            await tx.cursoPolo.createMany({
              data: polosFisicos.map(
                (polo) => ({
                  cursoId:
                    novoCurso.id,

                  poloId:
                    polo.id,

                  instituicaoId,
                })
              ),
            });
          }

          const publicacoesRede =
            await publicarCursoParaUnidadesIndependentes(
              {
                tx,

                cursoOrigemId:
                  novoCurso.id,

                instituicaoOrigemId:
                  instituicaoId,

                polosDestino:
                  unidadesIndependentes.map(
                    (polo) => ({
                      id: polo.id,
                      nome: polo.nome,
                      instituicaoGeradaId:
                        polo.instituicaoGeradaId,
                    })
                  ),

                publicadoPorId:
                  usuarioId,
              }
            );

          const cursoCompleto =
            await tx.curso.findUnique({
              where: {
                id: novoCurso.id,
              },
              include: {
                cursosPolos: {
                  include: {
                    polo: true,
                  },
                },
                publicacoesRedeOrigem: {
                  include: {
                    instituicaoDestino:
                    {
                      select: {
                        id: true,
                        nome: true,
                      },
                    },
                    polo: {
                      select: {
                        id: true,
                        nome: true,
                      },
                    },
                  },
                },
              },
            });

          if (!cursoCompleto) {
            throw new Error(
              "O curso foi criado, mas não pôde ser carregado ao final da operação."
            );
          }

          return {
            curso:
              cursoCompleto,

            publicacoesRede,
          };
        }
      );

    return NextResponse.json(
      {
        ...resultado.curso,

        resumoPublicacao: {
          polosFisicosVinculados:
            polosFisicos.length,

          unidadesIndependentesPublicadas:
            resultado.publicacoesRede
              .length,
        },

        publicacoesCriadas:
          resultado.publicacoesRede,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erro ao criar e publicar curso:",
      error
    );

    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro ao criar curso.";

    const erroDeNegocio =
      mensagem.includes(
        "unidade de destino"
      ) ||
      mensagem.includes(
        "instituição de destino"
      ) ||
      mensagem.includes(
        "mesma rede institucional"
      ) ||
      mensagem.includes(
        "outro curso"
      ) ||
      mensagem.includes(
        "outra disciplina"
      ) ||
      mensagem.includes(
        "semestre"
      ) ||
      mensagem.includes(
        "está inativa"
      ) ||
      mensagem.includes(
        "não possui uma rede institucional"
      );

    return NextResponse.json(
      {
        error: erroDeNegocio
          ? mensagem
          : "Erro ao criar e publicar o curso.",
      },
      {
        status: erroDeNegocio
          ? 409
          : 500,
      }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      !podeGerenciarCurso(user.role)
    ) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const instituicaoId = Number(
      user.instituicaoId
    );

    const usuarioId = Number(user.id);

    if (
      !Number.isInteger(instituicaoId) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário sem instituição vinculada.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Sessão inválida para editar o curso.",
        },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Record<
      string,
      unknown
    >;

    const id = Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "ID do curso é obrigatório.",
        },
        { status: 400 }
      );
    }

    const cursoExistente =
      await prisma.curso.findFirst({
        where: {
          id,
          instituicaoId,
        },
        select: {
          id: true,
          nome: true,
          codigo: true,
          descricao: true,
          modalidadeCertificado: true,
          quantidadeSemestres: true,
          cargaHorariaMaximaSemestre: true,
          valorMatricula: true,
          valorMensalidade: true,
          quantidadeParcelas: true,
          ativo: true,

          publicacaoRedeDestino: {
            select: {
              id: true,
              cursoOrigemId: true,
              instituicaoOrigemId: true,
              status: true,
            },
          },
        },
      });

    if (!cursoExistente) {
      return NextResponse.json(
        {
          error:
            "Curso não encontrado.",
        },
        { status: 404 }
      );
    }

    const cursoRecebidoDaRede =
      cursoExistente.publicacaoRedeDestino !==
      null;

    const nome = String(
      body.nome ?? cursoExistente.nome
    ).trim();

    const codigoInformado =
      body.codigo !== undefined
        ? String(body.codigo ?? "").trim()
        : String(
          cursoExistente.codigo ?? ""
        ).trim();

    const codigo =
      codigoInformado || null;

    const descricao =
      body.descricao !== undefined
        ? String(
          body.descricao ?? ""
        ).trim() || null
        : cursoExistente.descricao;

    const quantidadeSemestres =
      body.quantidadeSemestres !== null &&
        body.quantidadeSemestres !==
        undefined &&
        body.quantidadeSemestres !== ""
        ? Number(
          body.quantidadeSemestres
        )
        : null;

    const valorMatricula =
      body.valorMatricula !== null &&
        body.valorMatricula !== undefined &&
        body.valorMatricula !== ""
        ? Number(body.valorMatricula)
        : null;

    const valorMensalidade =
      body.valorMensalidade !== null &&
        body.valorMensalidade !==
        undefined &&
        body.valorMensalidade !== ""
        ? Number(
          body.valorMensalidade
        )
        : null;

    const quantidadeParcelas =
      body.quantidadeParcelas !== null &&
        body.quantidadeParcelas !==
        undefined &&
        body.quantidadeParcelas !== ""
        ? Number(
          body.quantidadeParcelas
        )
        : null;

    if (
      valorMatricula !== null &&
      (!Number.isFinite(valorMatricula) ||
        valorMatricula < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "O valor da matrícula é inválido.",
        },
        { status: 400 }
      );
    }

    if (
      valorMensalidade !== null &&
      (!Number.isFinite(
        valorMensalidade
      ) ||
        valorMensalidade < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "O valor da mensalidade é inválido.",
        },
        { status: 400 }
      );
    }

    if (
      quantidadeParcelas !== null &&
      (!Number.isInteger(
        quantidadeParcelas
      ) ||
        quantidadeParcelas <= 0)
    ) {
      return NextResponse.json(
        {
          error:
            "A quantidade de parcelas deve ser um número inteiro maior que zero.",
        },
        { status: 400 }
      );
    }

    /*
     * Curso recebido da rede:
     *
     * A unidade pode configurar os valores
     * financeiros locais, mas os dados
     * acadêmicos permanecem controlados pela
     * instituição que publicou o curso.
     */
    if (cursoRecebidoDaRede) {
      const cursoLocalAtualizado =
        await prisma.curso.update({
          where: {
            id,
          },
          data: {
            valorMatricula,
            valorMensalidade,
            quantidadeParcelas,
          },
          include: {
            cursosPolos: {
              include: {
                polo: true,
              },
            },

            publicacaoRedeDestino: {
              include: {
                cursoOrigem: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },

                instituicaoOrigem: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
              },
            },
          },
        });

      return NextResponse.json({
        ...cursoLocalAtualizado,

        cursoRecebidoDaRede: true,

        mensagem:
          "Os valores financeiros locais foram atualizados. Nome, código, modalidade e estrutura acadêmica continuam controlados pela instituição de origem.",

        resumoSincronizacao: {
          unidadesAtualizadas: 0,
        },
      });
    }

    if (!nome) {
      return NextResponse.json(
        {
          error:
            "Nome do curso é obrigatório.",
        },
        { status: 400 }
      );
    }

    if (
      quantidadeSemestres !== null &&
      (!Number.isInteger(
        quantidadeSemestres
      ) ||
        quantidadeSemestres <= 0)
    ) {
      return NextResponse.json(
        {
          error:
            "A quantidade de semestres deve ser um número inteiro maior que zero.",
        },
        { status: 400 }
      );
    }

    const conflitoNome =
      await prisma.curso.findFirst({
        where: {
          instituicaoId,
          nome,

          NOT: {
            id,
          },
        },
        select: {
          id: true,
        },
      });

    if (conflitoNome) {
      return NextResponse.json(
        {
          error:
            "Já existe outro curso com este nome.",
        },
        { status: 400 }
      );
    }

    if (codigo) {
      const conflitoCodigo =
        await prisma.curso.findFirst({
          where: {
            instituicaoId,
            codigo,

            NOT: {
              id,
            },
          },
          select: {
            id: true,
          },
        });

      if (conflitoCodigo) {
        return NextResponse.json(
          {
            error:
              "Já existe outro curso com este código.",
          },
          { status: 400 }
        );
      }
    }

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          await tx.curso.update({
            where: {
              id,
            },
            data: {
              nome,
              codigo,
              descricao,

              modalidadeCertificado:
                normalizarModalidadeCertificado(
                  body.modalidadeCertificado ??
                  cursoExistente
                    .modalidadeCertificado
                ),

              quantidadeSemestres,

              valorMatricula,

              valorMensalidade,

              quantidadeParcelas,

              ativo:
                typeof body.ativo ===
                  "boolean"
                  ? body.ativo
                  : cursoExistente.ativo,
            },
          });

          /*
           * Não alteramos CursoPolo aqui.
           *
           * A página de detalhes não envia
           * poloIds e a rota antiga apagava
           * todos os vínculos acidentalmente.
           */
          const publicacoes =
            await sincronizarPublicacoesAtivasDoCurso(
              {
                tx,

                cursoOrigemId: id,

                instituicaoOrigemId:
                  instituicaoId,

                atualizadoPorId:
                  usuarioId,
              }
            );

          const cursoAtualizado =
            await tx.curso.findUnique({
              where: {
                id,
              },
              include: {
                cursosPolos: {
                  include: {
                    polo: true,
                  },
                },

                publicacoesRedeOrigem: {
                  include: {
                    instituicaoDestino: {
                      select: {
                        id: true,
                        nome: true,
                      },
                    },

                    polo: {
                      select: {
                        id: true,
                        nome: true,
                      },
                    },
                  },
                },
              },
            });

          if (!cursoAtualizado) {
            throw new Error(
              "O curso foi atualizado, mas não pôde ser carregado ao final da operação."
            );
          }

          return {
            cursoAtualizado,

            unidadesAtualizadas:
              publicacoes.length,
          };
        }
      );

    return NextResponse.json({
      ...resultado.cursoAtualizado,

      cursoRecebidoDaRede: false,

      mensagem:
        resultado.unidadesAtualizadas > 0
          ? `Curso atualizado e sincronizado com ${resultado.unidadesAtualizadas} unidade(s).`
          : "Curso atualizado com sucesso.",

      resumoSincronizacao: {
        unidadesAtualizadas:
          resultado.unidadesAtualizadas,
      },
    });
  } catch (error: unknown) {
    console.error(
      "Erro ao editar e sincronizar curso:",
      error
    );

    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro ao editar curso.";

    const erroDeNegocio =
      mensagem.includes(
        "unidade de destino"
      ) ||
      mensagem.includes(
        "outro curso"
      ) ||
      mensagem.includes(
        "outra disciplina"
      ) ||
      mensagem.includes(
        "mesma rede institucional"
      ) ||
      mensagem.includes(
        "está inativa"
      );

    return NextResponse.json(
      {
        error: erroDeNegocio
          ? mensagem
          : "Erro ao editar e sincronizar o curso.",
      },
      {
        status: erroDeNegocio
          ? 409
          : 500,
      }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciarCurso(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json(
        { error: "ID do curso é obrigatório" },
        { status: 400 },
      );
    }

    const curso = await prisma.curso.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        publicacaoRedeDestino: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!curso) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 },
      );
    }

    if (curso.publicacaoRedeDestino) {
      return NextResponse.json(
        {
          error:
            "Não é permitido excluir um curso recebido da rede.",
        },
        { status: 403 }
      );
    }

    const agora = new Date();
    const expira = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000);

    const atualizado = await prisma.curso.update({
      where: { id },
      data: {
        ativo: false,
        excluidoEm: agora,
        expiraExclusaoEm: expira,
        excluidoPorId: user.id,
      },
    });

    return NextResponse.json({
      ok: true,
      curso: atualizado,
      message: "Curso excluído e enviado para recuperação.",
    });
  } catch (error) {
    console.error("Erro ao excluir curso:", error);
    return NextResponse.json(
      { error: "Erro ao excluir curso" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciarCurso(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const id = Number(body.id);
    const ativo = Boolean(body.ativo);

    if (!id) {
      return NextResponse.json(
        { error: "ID do curso é obrigatório" },
        { status: 400 },
      );
    }

    const curso = await prisma.curso.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        publicacaoRedeDestino: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!curso) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 },
      );
    }

    if (curso.publicacaoRedeDestino) {
      return NextResponse.json(
        {
          error:
            "Não é permitido arquivar ou restaurar um curso recebido da rede.",
        },
        { status: 403 }
      );
    }

    const atualizado = await prisma.curso.update({
      where: { id },
      data: {
        ativo,
        excluidoEm: ativo ? null : curso.excluidoEm,
        expiraExclusaoEm: ativo ? null : curso.expiraExclusaoEm,
        excluidoPorId: ativo ? null : curso.excluidoPorId,
      },
    });

    return NextResponse.json({
      ok: true,
      curso: atualizado,
      message: ativo
        ? "Curso restaurado com sucesso."
        : "Curso arquivado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao alterar status do curso:", error);
    return NextResponse.json(
      { error: "Erro ao alterar status do curso" },
      { status: 500 },
    );
  }
}
