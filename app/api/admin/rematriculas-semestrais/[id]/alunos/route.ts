import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TokenAdmin = {
  id: number;
  role: string;
  instituicaoId: number;
  isMasterAdmin?: boolean;
};

const STATUS_REMATRICULA_CONCLUIDA = new Set([
  "ENVIADA",
  "EM_ANALISE",
  "APROVADA",
]);

const STATUS_REMATRICULA_PENDENTE = new Set([
  "RASCUNHO",
  "DEVOLVIDA",
  "RECUSADA",
  "CANCELADA",
  "EXPIRADA",
]);

function inteiroPositivo(
  valor: unknown,
): number | null {
  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

function normalizarTexto(valor: unknown) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function obterUsuarioAutorizado() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  let decoded: TokenAdmin;

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as TokenAdmin;
  } catch {
    return null;
  }

  const role = String(
    decoded.role || "",
  ).toUpperCase();

  const autorizado =
    decoded.isMasterAdmin === true ||
    [
      "ADMIN",
      "SECRETARIA",
      "COORDENADOR",
      "GERENCIA",
      "SUPORTE",
    ].includes(role);

  if (!autorizado) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      id: decoded.id,
      instituicaoId:
        decoded.instituicaoId,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      role: true,
      instituicaoId: true,
      isMasterAdmin: true,
    },
  });
}

export async function GET(
  req: NextRequest,
  context: {
    params: {
      id: string;
    };
  },
) {
  try {
    const usuario =
      await obterUsuarioAutorizado();

    if (!usuario) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        },
      );
    }

    const periodoId =
      inteiroPositivo(
        context.params.id,
      );

    if (!periodoId) {
      return NextResponse.json(
        {
          error:
            "Período de rematrícula inválido.",
        },
        {
          status: 400,
        },
      );
    }

    const url = new URL(req.url);

    const busca = normalizarTexto(
      url.searchParams.get("busca"),
    );

    const situacao = String(
      url.searchParams.get(
        "situacao",
      ) || "TODOS",
    ).toUpperCase();

    const tipoRestricao = String(
      url.searchParams.get(
        "tipoRestricao",
      ) || "TODOS",
    ).toUpperCase();

    const poloId = inteiroPositivo(
      url.searchParams.get("poloId"),
    );

    const pagina = Math.max(
      inteiroPositivo(
        url.searchParams.get("pagina"),
      ) ?? 1,
      1,
    );

    const limite = Math.min(
      Math.max(
        inteiroPositivo(
          url.searchParams.get(
            "limite",
          ),
        ) ?? 25,
        1,
      ),
      100,
    );

    const periodo =
      await prisma.periodoMatricula.findFirst(
        {
          where: {
            id: periodoId,
            instituicaoId:
              usuario.instituicaoId,
            tipo: "REMATRICULA",
          },
          select: {
            id: true,
            titulo: true,
            periodoLetivo: true,
            cursoId: true,
            cursoSemestreId: true,
            semestreNumero: true,
            dataInicio: true,
            dataFim: true,
            status: true,

            tipoRestricaoPadrao: true,
            aplicarRestricaoAutomaticamente:
              true,
            carenciaRestricaoDias:
              true,
            mensagemRestricaoPadrao:
              true,

            curso: {
              select: {
                id: true,
                nome: true,
                codigo: true,
              },
            },

            cursoSemestre: {
              select: {
                id: true,
                numero: true,
                titulo: true,
              },
            },
          },
        },
      );

    if (!periodo) {
      return NextResponse.json(
        {
          error:
            "Período de rematrícula não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    if (!periodo.cursoId) {
      return NextResponse.json(
        {
          error:
            "O período não possui curso de destino.",
        },
        {
          status: 409,
        },
      );
    }

    const semestreDestino =
      periodo.cursoSemestre?.numero ??
      periodo.semestreNumero ??
      null;

    if (
      semestreDestino === null ||
      semestreDestino <= 1
    ) {
      return NextResponse.json(
        {
          error:
            "Não foi possível identificar o semestre atual dos alunos elegíveis.",
        },
        {
          status: 409,
        },
      );
    }

    const semestreAtual =
      semestreDestino - 1;

    const matriculasEncontradas =
      await prisma.matricula.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,

          cursoId: periodo.cursoId,

          status: {
            in: [
              "ATIVA",
              "A_INICIAR",
            ],
          },

          aluno: {
            ativo: true,
          },

          OR: [
            {
              cursoSemestre: {
                numero:
                  semestreAtual,
              },
            },
            {
              semestre:
                semestreAtual,
            },
          ],
        },

        orderBy: [
          {
            updatedAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],

        select: {
          id: true,
          alunoId: true,
          numeroMatricula: true,
          semestre: true,
          cursoSemestreId: true,
          poloId: true,
          status: true,
          updatedAt: true,

          cursoSemestre: {
            select: {
              id: true,
              numero: true,
              titulo: true,
            },
          },

          aluno: {
            select: {
              id: true,
              nome: true,
              ativo: true,
              statusAluno: true,
              poloId: true,
            },
          },
        },
      });

    /*
     * Um aluno pode possuir mais de um
     * registro histórico de matrícula.
     * Como a consulta está ordenada pela
     * atualização mais recente, mantemos
     * somente a primeira matrícula encontrada.
     */
    const matriculasPorAluno =
      new Map<
        number,
        (typeof matriculasEncontradas)[number]
      >();

    for (
      const matricula of
      matriculasEncontradas
    ) {
      if (
        !matriculasPorAluno.has(
          matricula.alunoId,
        )
      ) {
        matriculasPorAluno.set(
          matricula.alunoId,
          matricula,
        );
      }
    }

    const matriculasElegiveis =
      Array.from(
        matriculasPorAluno.values(),
      );

    const alunoIds =
      matriculasElegiveis.map(
        (matricula) =>
          matricula.alunoId,
      );

    const [
      rematriculas,
      restricoes,
    ] = alunoIds.length
      ? await Promise.all([
          prisma.rematriculaSemestral.findMany(
            {
              where: {
                instituicaoId:
                  usuario.instituicaoId,
                periodoMatriculaId:
                  periodo.id,
                alunoId: {
                  in: alunoIds,
                },
              },
              select: {
                id: true,
                alunoId: true,
                protocolo: true,
                status: true,
                cargaHorariaSelecionada:
                  true,
                enviadaEm: true,
                analisadaEm: true,
                aprovadaEm: true,
                devolvidaEm: true,
                recusadaEm: true,
                canceladaEm: true,
                motivoDevolucao: true,
                motivoRecusa: true,
                motivoCancelamento:
                  true,
                criadaEm: true,
                atualizadaEm: true,

                _count: {
                  select: {
                    itens: true,
                  },
                },
              },
            },
          ),

          prisma.restricaoRematriculaAluno.findMany(
            {
              where: {
                instituicaoId:
                  usuario.instituicaoId,
                periodoMatriculaId:
                  periodo.id,
                alunoId: {
                  in: alunoIds,
                },
              },
              select: {
                id: true,
                alunoId: true,
                tipo: true,
                origem: true,
                ativa: true,
                motivo: true,
                mensagemAluno: true,
                aplicadaEm: true,
                aplicadaPorId: true,
                removidaEm: true,
                removidaPorId: true,
                motivoRemocao: true,
                criadaEm: true,
                atualizadaEm: true,
              },
            },
          ),
        ])
      : [[], []];

    const rematriculaPorAluno = new Map<
  number,
  (typeof rematriculas)[number]
>(
  rematriculas.map(
    (rematricula) =>
      [
        rematricula.alunoId,
        rematricula,
      ] as const,
  ),
);

    const restricaoPorAluno = new Map<
  number,
  (typeof restricoes)[number]
>(
  restricoes.map(
    (restricao) =>
      [
        restricao.alunoId,
        restricao,
      ] as const,
  ),
);

    const poloIds = Array.from(
      new Set(
        matriculasElegiveis
          .map(
            (matricula) =>
              matricula.poloId ??
              matricula.aluno.poloId,
          )
          .filter(
            (
              id,
            ): id is number =>
              typeof id === "number",
          ),
      ),
    );

    const polos =
      poloIds.length > 0
        ? await prisma.polo.findMany({
            where: {
              instituicaoId:
                usuario.instituicaoId,
              id: {
                in: poloIds,
              },
            },
            select: {
              id: true,
              nome: true,
            },
            orderBy: {
              nome: "asc",
            },
          })
        : [];

    const poloPorId = new Map<
  number,
  (typeof polos)[number]
>(
  polos.map(
    (polo) =>
      [
        polo.id,
        polo,
      ] as const,
  ),
);

    const agora = new Date();

    const prazoEncerrado =
      periodo.status !== "CANCELADO" &&
      (periodo.status ===
        "ENCERRADO" ||
        agora.getTime() >
          new Date(
            periodo.dataFim,
          ).getTime());

    const alunos = matriculasElegiveis.map(
      (matricula) => {
        const rematricula =
          rematriculaPorAluno.get(
            matricula.alunoId,
          ) ?? null;

        const restricao =
          restricaoPorAluno.get(
            matricula.alunoId,
          ) ?? null;

        const statusRematricula =
          rematricula?.status ??
          null;

        const situacaoPainel =
          statusRematricula ??
          (prazoEncerrado
            ? "PRAZO_PERDIDO"
            : "NAO_INICIOU");

        const realizouRematricula =
          statusRematricula !== null &&
          STATUS_REMATRICULA_CONCLUIDA.has(
            statusRematricula,
          );

        const naoRealizou =
          statusRematricula === null ||
          statusRematricula ===
            "RASCUNHO";

        const necessitaRegularizacao =
          statusRematricula !== null &&
          STATUS_REMATRICULA_PENDENTE.has(
            statusRematricula,
          );

        const pendenteAposPrazo =
          prazoEncerrado &&
          !realizouRematricula;

        const tipoRestricaoAtual =
          restricao?.ativa &&
          restricao.tipo !==
            "NENHUMA"
            ? restricao.tipo
            : "NENHUMA";

        const poloAtualId =
          matricula.poloId ??
          matricula.aluno.poloId ??
          null;

        const polo =
          poloAtualId !== null
            ? poloPorId.get(
                poloAtualId,
              ) ?? null
            : null;

        return {
          alunoId:
            matricula.aluno.id,
          nome:
            matricula.aluno.nome,

          statusAluno:
            matricula.aluno
              .statusAluno,

          matricula: {
            id: matricula.id,
            numero:
              matricula.numeroMatricula,
            status:
              matricula.status,
            semestreAtual:
              matricula
                .cursoSemestre
                ?.numero ??
              matricula.semestre,
            cursoSemestreId:
              matricula.cursoSemestreId,
          },

          polo,

          situacaoPainel,
          statusRematricula,
          prazoEncerrado,

          realizouRematricula,
          naoRealizou,
          necessitaRegularizacao,
          pendenteAposPrazo,

          podeReceberRestricao:
            periodo.status !==
              "CANCELADO" &&
            pendenteAposPrazo,

          rematricula,

          restricao: restricao
            ? {
                ...restricao,
                tipoAtual:
                  tipoRestricaoAtual,
              }
            : {
                id: null,
                tipoAtual:
                  "NENHUMA",
                origem: null,
                ativa: false,
                motivo: null,
                mensagemAluno:
                  null,
                aplicadaEm: null,
                aplicadaPorId:
                  null,
                removidaEm: null,
                removidaPorId:
                  null,
                motivoRemocao:
                  null,
              },

          tipoRestricaoAtual,
        };
      },
    );

    const resumo = {
      elegiveis: alunos.length,

      naoIniciaram:
        alunos.filter(
          (aluno) =>
            aluno.statusRematricula ===
            null,
        ).length,

      naoRealizaram:
        alunos.filter(
          (aluno) =>
            aluno.naoRealizou,
        ).length,

      rascunhos:
        alunos.filter(
          (aluno) =>
            aluno.statusRematricula ===
            "RASCUNHO",
        ).length,

      enviadas:
        alunos.filter(
          (aluno) =>
            aluno.statusRematricula ===
            "ENVIADA",
        ).length,

      emAnalise:
        alunos.filter(
          (aluno) =>
            aluno.statusRematricula ===
            "EM_ANALISE",
        ).length,

      aprovadas:
        alunos.filter(
          (aluno) =>
            aluno.statusRematricula ===
            "APROVADA",
        ).length,

      devolvidas:
        alunos.filter(
          (aluno) =>
            aluno.statusRematricula ===
            "DEVOLVIDA",
        ).length,

      recusadas:
        alunos.filter(
          (aluno) =>
            aluno.statusRematricula ===
            "RECUSADA",
        ).length,

      canceladas:
        alunos.filter(
          (aluno) =>
            aluno.statusRematricula ===
            "CANCELADA",
        ).length,

      expiradas:
        alunos.filter(
          (aluno) =>
            aluno.statusRematricula ===
            "EXPIRADA",
        ).length,

      prazoPerdido:
        alunos.filter(
          (aluno) =>
            aluno.situacaoPainel ===
            "PRAZO_PERDIDO",
        ).length,

      pendentesAposPrazo:
        alunos.filter(
          (aluno) =>
            aluno.pendenteAposPrazo,
        ).length,

      comRestricao:
        alunos.filter(
          (aluno) =>
            aluno.tipoRestricaoAtual !==
            "NENHUMA",
        ).length,

      semRestricao:
        alunos.filter(
          (aluno) =>
            aluno.tipoRestricaoAtual ===
            "NENHUMA",
        ).length,
    };

    const alunosFiltrados =
      alunos.filter((aluno) => {
        if (busca) {
          const textoAluno =
            normalizarTexto(
              [
                aluno.nome,
                aluno.matricula
                  .numero,
                aluno.polo?.nome,
              ]
                .filter(Boolean)
                .join(" "),
            );

          if (
            !textoAluno.includes(
              busca,
            )
          ) {
            return false;
          }
        }

        if (
          poloId &&
          aluno.polo?.id !== poloId
        ) {
          return false;
        }

        if (
          tipoRestricao !==
            "TODOS" &&
          aluno.tipoRestricaoAtual !==
            tipoRestricao
        ) {
          return false;
        }

        if (
          situacao ===
            "NAO_REALIZOU" &&
          !aluno.naoRealizou
        ) {
          return false;
        }

        if (
          situacao ===
            "PENDENTE_APOS_PRAZO" &&
          !aluno.pendenteAposPrazo
        ) {
          return false;
        }

        if (
          situacao ===
            "PRECISA_REGULARIZAR" &&
          !aluno
            .necessitaRegularizacao
        ) {
          return false;
        }

        if (
          ![
            "TODOS",
            "NAO_REALIZOU",
            "PENDENTE_APOS_PRAZO",
            "PRECISA_REGULARIZAR",
          ].includes(situacao) &&
          aluno.situacaoPainel !==
            situacao
        ) {
          return false;
        }

        return true;
      });

    const totalFiltrado =
      alunosFiltrados.length;

    const totalPaginas = Math.max(
      Math.ceil(
        totalFiltrado / limite,
      ),
      1,
    );

    const paginaAtual = Math.min(
      pagina,
      totalPaginas,
    );

    const inicio =
      (paginaAtual - 1) * limite;

    const alunosPaginados =
      alunosFiltrados.slice(
        inicio,
        inicio + limite,
      );

    return NextResponse.json({
      ok: true,

      periodo: {
        ...periodo,
        semestreAtual,
        semestreDestino,
        prazoEncerrado,
      },

      resumo,

      filtrosDisponiveis: {
        polos,
        situacoes: [
          "TODOS",
          "NAO_INICIOU",
          "PRAZO_PERDIDO",
          "NAO_REALIZOU",
          "RASCUNHO",
          "ENVIADA",
          "EM_ANALISE",
          "APROVADA",
          "DEVOLVIDA",
          "RECUSADA",
          "CANCELADA",
          "EXPIRADA",
          "PENDENTE_APOS_PRAZO",
          "PRECISA_REGULARIZAR",
        ],

        tiposRestricao: [
          "TODOS",
          "NENHUMA",
          "SOMENTE_AVISO",
          "RESTRICAO_PARCIAL",
          "BLOQUEIO_PORTAL",
        ],
      },

      filtrosAplicados: {
        busca,
        situacao,
        poloId,
        tipoRestricao,
      },

      paginacao: {
        pagina: paginaAtual,
        limite,
        totalRegistros:
          totalFiltrado,
        totalPaginas,
      },

      alunos: alunosPaginados,
    });
  } catch (error) {
    console.error(
      "Erro ao listar alunos da rematrícula:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao listar os alunos do período de rematrícula.",
      },
      {
        status: 500,
      },
    );
  }
}