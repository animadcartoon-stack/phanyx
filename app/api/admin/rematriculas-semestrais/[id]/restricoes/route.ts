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

type TipoRestricao =
  | "SOMENTE_AVISO"
  | "RESTRICAO_PARCIAL"
  | "BLOQUEIO_PORTAL";

type AcaoRestricao =
  | "APLICAR"
  | "REMOVER";

const TIPOS_RESTRICAO = new Set<TipoRestricao>([
  "SOMENTE_AVISO",
  "RESTRICAO_PARCIAL",
  "BLOQUEIO_PORTAL",
]);

const STATUS_REMATRICULA_CONCLUIDA =
  new Set([
    "ENVIADA",
    "EM_ANALISE",
    "APROVADA",
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

function textoOpcional(
  valor: unknown,
): string | null {
  const texto = String(
    valor ?? "",
  ).trim();

  return texto || null;
}

function mensagemPadraoPorTipo(
  tipo: TipoRestricao,
) {
  if (tipo === "SOMENTE_AVISO") {
    return "O prazo de rematrícula foi encerrado e sua rematrícula não foi concluída. Procure a instituição para regularizar sua situação.";
  }

  if (
    tipo === "RESTRICAO_PARCIAL"
  ) {
    return "Alguns recursos acadêmicos estão temporariamente restritos porque sua rematrícula não foi concluída dentro do prazo. Procure a instituição para regularizar sua situação.";
  }

  return "Seu acesso acadêmico está temporariamente bloqueado porque a rematrícula não foi concluída dentro do prazo. Procure a instituição para regularizar sua situação.";
}

async function obterUsuarioAutorizado() {
  const cookieStore =
    await cookies();

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

export async function POST(
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

    const body = await req.json();

    const acao = String(
      body?.acao || "",
    ).toUpperCase() as AcaoRestricao;

    if (
      acao !== "APLICAR" &&
      acao !== "REMOVER"
    ) {
      return NextResponse.json(
        {
          error:
            "Ação de restrição inválida.",
        },
        {
          status: 400,
        },
      );
    }

    const alunoIdsRecebidos: unknown[] =
  Array.isArray(body?.alunoIds)
    ? body.alunoIds
    : [];

const alunoIdsNormalizados: number[] = [];

for (const valor of alunoIdsRecebidos) {
  const id = inteiroPositivo(valor);

  if (id !== null) {
    alunoIdsNormalizados.push(id);
  }
}

const alunoIds: number[] = Array.from(
  new Set<number>(
    alunoIdsNormalizados,
  ),
);

    if (alunoIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Selecione pelo menos um aluno.",
        },
        {
          status: 400,
        },
      );
    }

    if (alunoIds.length > 500) {
      return NextResponse.json(
        {
          error:
            "O limite é de 500 alunos por operação.",
        },
        {
          status: 400,
        },
      );
    }

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
            cursoId: true,
            cursoSemestreId: true,
            semestreNumero: true,
            dataFim: true,
            status: true,
            mensagemRestricaoPadrao:
              true,
            cursoSemestre: {
              select: {
                numero: true,
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

    /*
     * A remoção pode ocorrer mesmo se o
     * período estiver cancelado ou se o
     * aluno já tiver regularizado.
     */
    if (acao === "REMOVER") {
      const motivoRemocao =
        textoOpcional(
          body?.motivo,
        ) ||
        "Restrição removida pelo administrador.";

      const resultado =
        await prisma.$transaction(
          async (tx) => {
            let removidas = 0;

            for (const alunoId of alunoIds) {
              const existente =
                await tx.restricaoRematriculaAluno.findUnique(
                  {
                    where: {
                      periodoMatriculaId_alunoId:
                        {
                          periodoMatriculaId:
                            periodo.id,
                          alunoId,
                        },
                    },
                  },
                );

              if (
                !existente ||
                !existente.ativa
              ) {
                continue;
              }

              await tx.restricaoRematriculaAluno.update(
                {
                  where: {
                    id: existente.id,
                  },
                  data: {
                    ativa: false,
                    removidaEm:
                      new Date(),
                    removidaPorId:
                      usuario.id,
                    motivoRemocao,
                  },
                },
              );

              await tx.restricaoRematriculaHistorico.create(
                {
                  data: {
                    instituicaoId:
                      usuario.instituicaoId,
                    restricaoId:
                      existente.id,
                    periodoMatriculaId:
                      periodo.id,
                    alunoId,
                    acao: "REMOVIDA",
                    origem: "MANUAL",
                    tipoAnterior:
                      existente.tipo,
                    tipoNovo: "NENHUMA",
                    motivo:
                      motivoRemocao,
                    mensagemAluno:
                      existente.mensagemAluno,
                    realizadoPorId:
                      usuario.id,
                  },
                },
              );

              removidas += 1;
            }

            return {
              removidas,
            };
          },
        );

      return NextResponse.json({
        ok: true,
        message:
          resultado.removidas === 1
            ? "Restrição removida de 1 aluno."
            : `Restrições removidas de ${resultado.removidas} alunos.`,
        resultado,
      });
    }

    const tipo = String(
      body?.tipo || "",
    ).toUpperCase() as TipoRestricao;

    if (!TIPOS_RESTRICAO.has(tipo)) {
      return NextResponse.json(
        {
          error:
            "Selecione um tipo de restrição válido.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      periodo.status === "CANCELADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Não é possível aplicar restrições em um período cancelado.",
        },
        {
          status: 409,
        },
      );
    }

    const agora = new Date();

    const prazoEncerrado =
      periodo.status === "ENCERRADO" ||
      agora.getTime() >
        new Date(
          periodo.dataFim,
        ).getTime();

    if (!prazoEncerrado) {
      return NextResponse.json(
        {
          error:
            "A restrição somente pode ser aplicada depois do encerramento do prazo.",
        },
        {
          status: 409,
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
            "Não foi possível identificar o semestre dos alunos elegíveis.",
        },
        {
          status: 409,
        },
      );
    }

    const semestreAtual =
      semestreDestino - 1;

    const matriculasElegiveis =
      await prisma.matricula.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,
          alunoId: {
            in: alunoIds,
          },
          cursoId:
            periodo.cursoId,
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
        select: {
          alunoId: true,
        },
      });

    const alunosElegiveis = new Set(
      matriculasElegiveis.map(
        (matricula) =>
          matricula.alunoId,
      ),
    );

    const alunosNaoElegiveis =
      alunoIds.filter(
        (alunoId) =>
          !alunosElegiveis.has(
            alunoId,
          ),
      );

    if (
      alunosNaoElegiveis.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Um ou mais alunos selecionados não são elegíveis para este período.",
          alunoIds:
            alunosNaoElegiveis,
        },
        {
          status: 409,
        },
      );
    }

    const rematriculas =
      await prisma.rematriculaSemestral.findMany(
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
            alunoId: true,
            status: true,
          },
        },
      );

    const rematriculaPorAluno =
      new Map<
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

    const alunosJaConcluidos =
      alunoIds.filter((alunoId) => {
        const rematricula =
          rematriculaPorAluno.get(
            alunoId,
          );

        return (
          rematricula !== undefined &&
          STATUS_REMATRICULA_CONCLUIDA.has(
            rematricula.status,
          )
        );
      });

    if (
      alunosJaConcluidos.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "A restrição não pode ser aplicada a alunos com rematrícula enviada, em análise ou aprovada.",
          alunoIds:
            alunosJaConcluidos,
        },
        {
          status: 409,
        },
      );
    }

    const motivo =
      textoOpcional(
        body?.motivo,
      ) ||
      "Rematrícula não realizada dentro do prazo.";

    const mensagemAluno =
      textoOpcional(
        body?.mensagemAluno,
      ) ||
      periodo.mensagemRestricaoPadrao ||
      mensagemPadraoPorTipo(tipo);

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          let criadas = 0;
          let alteradas = 0;
          let reativadas = 0;

          for (const alunoId of alunoIds) {
            const existente =
              await tx.restricaoRematriculaAluno.findUnique(
                {
                  where: {
                    periodoMatriculaId_alunoId:
                      {
                        periodoMatriculaId:
                          periodo.id,
                        alunoId,
                      },
                  },
                },
              );

            const acaoHistorico =
              !existente
                ? "CRIADA"
                : existente.ativa
                  ? "ALTERADA"
                  : "REATIVADA";

            const restricao =
              await tx.restricaoRematriculaAluno.upsert(
                {
                  where: {
                    periodoMatriculaId_alunoId:
                      {
                        periodoMatriculaId:
                          periodo.id,
                        alunoId,
                      },
                  },
                  create: {
                    instituicaoId:
                      usuario.instituicaoId,
                    periodoMatriculaId:
                      periodo.id,
                    alunoId,
                    tipo,
                    origem: "MANUAL",
                    ativa: true,
                    motivo,
                    mensagemAluno,
                    aplicadaEm:
                      agora,
                    aplicadaPorId:
                      usuario.id,
                  },
                  update: {
                    tipo,
                    origem: "MANUAL",
                    ativa: true,
                    motivo,
                    mensagemAluno,
                    aplicadaEm:
                      agora,
                    aplicadaPorId:
                      usuario.id,
                    removidaEm: null,
                    removidaPorId: null,
                    motivoRemocao:
                      null,
                  },
                },
              );

            await tx.restricaoRematriculaHistorico.create(
              {
                data: {
                  instituicaoId:
                    usuario.instituicaoId,
                  restricaoId:
                    restricao.id,
                  periodoMatriculaId:
                    periodo.id,
                  alunoId,
                  acao:
                    acaoHistorico,
                  origem: "MANUAL",
                  tipoAnterior:
                    existente?.tipo ??
                    null,
                  tipoNovo: tipo,
                  motivo,
                  mensagemAluno,
                  realizadoPorId:
                    usuario.id,
                },
              },
            );

            if (
              acaoHistorico === "CRIADA"
            ) {
              criadas += 1;
            } else if (
              acaoHistorico ===
              "REATIVADA"
            ) {
              reativadas += 1;
            } else {
              alteradas += 1;
            }
          }

          return {
            total: alunoIds.length,
            criadas,
            alteradas,
            reativadas,
          };
        },
      );

    return NextResponse.json({
      ok: true,
      message:
        resultado.total === 1
          ? "Restrição aplicada ao aluno."
          : `Restrição aplicada a ${resultado.total} alunos.`,
      tipo,
      resultado,
    });
  } catch (error) {
    console.error(
      "Erro ao aplicar restrição de rematrícula:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao processar a restrição de rematrícula.",
      },
      {
        status: 500,
      },
    );
  }
}