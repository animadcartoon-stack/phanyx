import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import {
  StatusLancamentoComissaoRH,
  StatusLancamentoRemuneracaoVariavelRH,
} from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toDecimalNumber(valor: any) {
  return Number(valor || 0);
}

function arredondarCentavos(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function normalizarIds(valor: unknown) {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  );
}

function usuarioPodeEnviarRemuneracao(user: any) {
  const role = String(user?.role || "").toUpperCase();

  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    user?.isMasterAdmin === true
  );
}

async function recalcularTotaisHolerite(
  tx: any,
  holeriteId: number
) {
  const holerite = await tx.holeriteRH.findUnique({
    where: {
      id: holeriteId,
    },
    select: {
      id: true,
      salarioBase: true,
    },
  });

  if (!holerite) {
    throw new Error("Holerite não encontrado durante o recálculo.");
  }

  const eventos = await tx.holeriteEventoRH.findMany({
    where: {
      holeriteId,
    },
    select: {
      tipo: true,
      valor: true,
    },
  });

  const totalVencimentos = arredondarCentavos(
    eventos
      .filter((evento: any) => evento.tipo === "VENCIMENTO")
      .reduce(
        (total: number, evento: any) =>
          total + Number(evento.valor || 0),
        0
      )
  );

  const totalDescontos = arredondarCentavos(
    eventos
      .filter((evento: any) => evento.tipo === "DESCONTO")
      .reduce(
        (total: number, evento: any) =>
          total + Number(evento.valor || 0),
        0
      )
  );

  const salarioBase = Number(holerite.salarioBase || 0);

  const valorLiquido = arredondarCentavos(
    salarioBase + totalVencimentos - totalDescontos
  );

  await tx.holeriteRH.update({
    where: {
      id: holeriteId,
    },
    data: {
      totalVencimentos,
      totalDescontos,
      valorLiquido,
      arquivoUrl: null,
    },
  });

  return {
    totalVencimentos,
    totalDescontos,
    valorLiquido,
  };
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const holerites = await prisma.holeriteRH.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        arquivado: false,
      },
      include: {
        funcionario: {
          select: {
            id: true,
            nome: true,
            cargo: true,
            codigoFuncionario: true,
            departamento: { select: { nome: true } },
          },
        },
        eventos: true,
      },
      orderBy: [
        { competenciaAno: "desc" },
        { competenciaMes: "desc" },
      ],
      take: 100,
    });

    return NextResponse.json(holerites);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar holerites." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const instituicaoId = Number(user.instituicaoId);
    const body = await req.json();
    const acao = String(body.acao || "").trim().toUpperCase();

    if (!instituicaoId) {
      return NextResponse.json(
        { error: "Instituição não identificada." },
        { status: 400 }
      );
    }

    /*
     * =====================================================
     * REMUNERAÇÃO VARIÁVEL → HOLERITE
     * =====================================================
     */
    if (acao === "ENVIAR_REMUNERACAO_VARIAVEL") {
      if (!usuarioPodeEnviarRemuneracao(user)) {
        return NextResponse.json(
          {
            error:
              "Você não possui autorização para enviar remunerações ao holerite.",
          },
          { status: 403 }
        );
      }

      const programaId = Number(body.programaId);

      const lancamentoIds = normalizarIds(
        body.lancamentoIds
      );

      if (!programaId) {
        return NextResponse.json(
          { error: "Informe o programa de remuneração." },
          { status: 400 }
        );
      }

      if (lancamentoIds.length === 0) {
        return NextResponse.json(
          {
            error:
              "Selecione pelo menos um lançamento aprovado.",
          },
          { status: 400 }
        );
      }

      const programa =
        await prisma.programaRemuneracaoVariavelRH.findFirst({
          where: {
            id: programaId,
            instituicaoId,
          },
          select: {
            id: true,
            nome: true,
            status: true,
          },
        });

      if (!programa) {
        return NextResponse.json(
          {
            error:
              "Programa de remuneração não encontrado.",
          },
          { status: 404 }
        );
      }

      const lancamentos =
        await prisma.lancamentoRemuneracaoVariavelRH.findMany({
          where: {
            id: {
              in: lancamentoIds,
            },
            instituicaoId,
            programaId,
            status:
              StatusLancamentoRemuneracaoVariavelRH.APROVADO,
            holeriteEventoId: null,
          },
          include: {
            funcionario: {
              select: {
                id: true,
                nome: true,
                salario: true,
                salarioBase: true,
              },
            },
          },
          orderBy: {
            funcionarioNomeSnapshot: "asc",
          },
        });

      if (lancamentos.length === 0) {
        return NextResponse.json(
          {
            error:
              "Nenhum dos lançamentos selecionados está aprovado e aguardando envio.",
          },
          { status: 400 }
        );
      }

      const agora = new Date();
      const criadoPorId = Number(user.id);

      const resultado = await prisma.$transaction(
        async (tx) => {
          const enviados: Array<{
            lancamentoId: number;
            holeriteId: number;
            holeriteEventoId: number;
            funcionarioNome: string;
            valor: number;
          }> = [];

          for (const lancamento of lancamentos) {
            const valor = arredondarCentavos(
              Number(
                lancamento.valorAprovado ??
                lancamento.valorCalculado ??
                0
              )
            );

            if (!Number.isFinite(valor) || valor <= 0) {
              throw new Error(
                `O lançamento de ${lancamento.funcionarioNomeSnapshot} possui valor inválido.`
              );
            }

            let holerite = await tx.holeriteRH.findFirst({
              where: {
                instituicaoId,
                funcionarioId: lancamento.funcionarioId,
                competenciaMes: lancamento.competenciaMes,
                competenciaAno: lancamento.competenciaAno,
              },
            });

            if (
              holerite?.arquivado ||
              holerite?.cancelado ||
              String(holerite?.status || "").toUpperCase() ===
              "ARQUIVADO" ||
              String(holerite?.status || "").toUpperCase() ===
              "CANCELADO"
            ) {
              throw new Error(
                `O holerite de ${lancamento.funcionarioNomeSnapshot}, competência ${String(
                  lancamento.competenciaMes
                ).padStart(2, "0")}/${lancamento.competenciaAno
                }, está arquivado ou cancelado.`
              );
            }

            if (!holerite) {
              const salarioBase = arredondarCentavos(
                Number(
                  lancamento.funcionario.salarioBase ??
                  lancamento.funcionario.salario ??
                  0
                )
              );

              holerite = await tx.holeriteRH.create({
                data: {
                  funcionarioId: lancamento.funcionarioId,
                  instituicaoId,
                  criadoPorId,
                  competenciaMes: lancamento.competenciaMes,
                  competenciaAno: lancamento.competenciaAno,
                  salarioBase,
                  totalVencimentos: 0,
                  totalDescontos: 0,
                  valorLiquido: salarioBase,
                  status: "GERADO",
                },
              });
            }

            const evento = await tx.holeriteEventoRH.create({
              data: {
                holeriteId: holerite.id,
                codigo: `RV-${lancamento.id}`,
                descricao:
                  lancamento.descricao ||
                  lancamento.programaNomeSnapshot ||
                  programa.nome,
                referencia: `${String(
                  lancamento.competenciaMes
                ).padStart(2, "0")}/${lancamento.competenciaAno
                  }`,
                tipo: "VENCIMENTO",
                valor,
              },
            });

            const atualizacaoLancamento =
              await tx.lancamentoRemuneracaoVariavelRH.updateMany(
                {
                  where: {
                    id: lancamento.id,
                    instituicaoId,
                    programaId,
                    status:
                      StatusLancamentoRemuneracaoVariavelRH.APROVADO,
                    holeriteEventoId: null,
                  },

                  data: {
                    status:
                      StatusLancamentoRemuneracaoVariavelRH.ENVIADO_HOLERITE,
                    holeriteEventoId: evento.id,
                    enviadoHoleriteEm: agora,
                    enviadoHoleritePorId: criadoPorId,
                  },
                }
              );

            if (atualizacaoLancamento.count !== 1) {
              throw new Error(
                `O lançamento de ${lancamento.funcionarioNomeSnapshot} já foi processado por outro usuário.`
              );
            }

            await recalcularTotaisHolerite(
              tx,
              holerite.id
            );

            await tx.historicoRH.create({
              data: {
                funcionarioId: lancamento.funcionarioId,
                instituicaoId,
                criadoPorId,
                tipo:
                  "REMUNERACAO_VARIAVEL_ENVIADA_HOLERITE",
                titulo:
                  "Remuneração variável enviada ao holerite",
                descricao: `${lancamento.descricao ||
                  lancamento.programaNomeSnapshot ||
                  programa.nome
                  } — R$ ${valor.toFixed(2)}`,
                dataEvento: agora,
                observacoes: `Competência ${String(
                  lancamento.competenciaMes
                ).padStart(2, "0")}/${lancamento.competenciaAno
                  }. Lançamento de remuneração variável ID ${lancamento.id}.`,
              },
            });

            enviados.push({
              lancamentoId: lancamento.id,
              holeriteId: holerite.id,
              holeriteEventoId: evento.id,
              funcionarioNome:
                lancamento.funcionarioNomeSnapshot,
              valor,
            });
          }

          return enviados;
        }
      );

      const totalEnviado = arredondarCentavos(
        resultado.reduce(
          (total, item) => total + item.valor,
          0
        )
      );

      const ignorados =
        lancamentoIds.length - resultado.length;

      return NextResponse.json({
        message:
          `${resultado.length} lançamento(s) enviado(s) ao holerite, totalizando R$ ${totalEnviado.toFixed(
            2
          )}.` +
          (ignorados > 0
            ? ` ${ignorados} lançamento(s) já processado(s), reprovado(s) ou pendente(s) foram ignorados.`
            : ""),
        enviados: resultado.length,
        ignorados,
        totalEnviado,
        itens: resultado,
      });
    }

    /*
 * =====================================================
 * COMISSÕES COMERCIAIS → HOLERITE
 * =====================================================
 */
    if (acao === "ENVIAR_COMISSOES") {
      if (!usuarioPodeEnviarRemuneracao(user)) {
        return NextResponse.json(
          {
            error:
              "Você não possui autorização para enviar comissões ao holerite.",
          },
          { status: 403 }
        );
      }

      const lancamentoIds = normalizarIds(
        body.lancamentoIds
      );

      if (lancamentoIds.length === 0) {
        return NextResponse.json(
          {
            error:
              "Selecione pelo menos uma comissão aprovada.",
          },
          { status: 400 }
        );
      }

      const lancamentos =
        await prisma.lancamentoComissaoRH.findMany({
          where: {
            id: {
              in: lancamentoIds,
            },

            instituicaoId,

            status:
              StatusLancamentoComissaoRH.APROVADO,

            holeriteEventoId: null,
          },

          include: {
            funcionario: {
              select: {
                id: true,
                nome: true,
                salario: true,
                salarioBase: true,
              },
            },
          },

          orderBy: {
            funcionarioNomeSnapshot: "asc",
          },
        });

      if (lancamentos.length === 0) {
        return NextResponse.json(
          {
            error:
              "Nenhuma das comissões selecionadas está aprovada e aguardando envio.",
          },
          { status: 400 }
        );
      }

      const agora = new Date();
      const criadoPorId = Number(user.id);

      const resultado = await prisma.$transaction(
        async (tx) => {
          const enviados: Array<{
            lancamentoId: number;
            holeriteId: number;
            holeriteEventoId: number;
            funcionarioNome: string;
            valor: number;
          }> = [];

          for (const lancamento of lancamentos) {
            const valor = arredondarCentavos(
              Number(
                lancamento.valorAprovado ??
                lancamento.valorCalculado ??
                0
              )
            );

            if (
              !Number.isFinite(valor) ||
              valor <= 0
            ) {
              throw new Error(
                `A comissão de ${lancamento.funcionarioNomeSnapshot} possui valor inválido.`
              );
            }

            let holerite =
              await tx.holeriteRH.findFirst({
                where: {
                  instituicaoId,
                  funcionarioId:
                    lancamento.funcionarioId,
                  competenciaMes:
                    lancamento.competenciaMes,
                  competenciaAno:
                    lancamento.competenciaAno,
                },
              });

            if (
              holerite?.arquivado ||
              holerite?.cancelado ||
              String(
                holerite?.status || ""
              ).toUpperCase() === "ARQUIVADO" ||
              String(
                holerite?.status || ""
              ).toUpperCase() === "CANCELADO"
            ) {
              throw new Error(
                `O holerite de ${lancamento.funcionarioNomeSnapshot}, competência ${String(
                  lancamento.competenciaMes
                ).padStart(2, "0")}/${lancamento.competenciaAno
                }, está arquivado ou cancelado.`
              );
            }

            if (!holerite) {
              const salarioBase =
                arredondarCentavos(
                  Number(
                    lancamento.funcionario
                      .salarioBase ??
                    lancamento.funcionario
                      .salario ??
                    0
                  )
                );

              holerite =
                await tx.holeriteRH.create({
                  data: {
                    funcionarioId:
                      lancamento.funcionarioId,

                    instituicaoId,
                    criadoPorId,

                    competenciaMes:
                      lancamento.competenciaMes,

                    competenciaAno:
                      lancamento.competenciaAno,

                    salarioBase,

                    totalVencimentos: 0,
                    totalDescontos: 0,
                    valorLiquido: salarioBase,

                    status: "GERADO",
                  },
                });
            }

            const descricaoEvento = [
              "Comissão comercial",

              lancamento.regraNomeSnapshot ||
              lancamento.descricao,

              lancamento.alunoNomeSnapshot
                ? `Aluno: ${lancamento.alunoNomeSnapshot}`
                : null,

              lancamento.matriculaNumeroSnapshot
                ? `Matrícula: ${lancamento.matriculaNumeroSnapshot}`
                : null,
            ]
              .filter(Boolean)
              .join(" — ");

            const evento =
              await tx.holeriteEventoRH.create({
                data: {
                  holeriteId: holerite.id,

                  codigo: `COM-${lancamento.id}`,

                  descricao: descricaoEvento,

                  referencia: `${String(
                    lancamento.competenciaMes
                  ).padStart(2, "0")}/${lancamento.competenciaAno
                    }`,

                  tipo: "VENCIMENTO",

                  valor,
                },
              });

            const atualizacaoLancamento =
              await tx.lancamentoComissaoRH.updateMany({
                where: {
                  id: lancamento.id,
                  instituicaoId,

                  status:
                    StatusLancamentoComissaoRH.APROVADO,

                  holeriteEventoId: null,
                },

                data: {
                  status:
                    StatusLancamentoComissaoRH.ENVIADO_HOLERITE,

                  holeriteEventoId: evento.id,

                  enviadoHoleriteEm: agora,
                  enviadoHoleritePorId: criadoPorId,
                },
              });

            if (
              atualizacaoLancamento.count !== 1
            ) {
              throw new Error(
                `A comissão de ${lancamento.funcionarioNomeSnapshot} já foi processada por outro usuário.`
              );
            }

            await recalcularTotaisHolerite(
              tx,
              holerite.id
            );

            await tx.historicoRH.create({
              data: {
                funcionarioId:
                  lancamento.funcionarioId,

                instituicaoId,
                criadoPorId,

                tipo:
                  "COMISSAO_COMERCIAL_ENVIADA_HOLERITE",

                titulo:
                  "Comissão comercial enviada ao holerite",

                descricao:
                  `${lancamento.regraNomeSnapshot ||
                  lancamento.descricao} — ` +
                  `R$ ${valor.toFixed(2)}`,

                dataEvento: agora,

                observacoes: [
                  `Competência: ${String(
                    lancamento.competenciaMes
                  ).padStart(2, "0")}/${lancamento.competenciaAno
                  }`,

                  `Lançamento de comissão ID: ${lancamento.id}`,

                  `Holerite ID: ${holerite.id}`,

                  `Evento de holerite ID: ${evento.id}`,

                  `Aluno: ${lancamento.alunoNomeSnapshot ||
                  "Não informado"
                  }`,

                  `Matrícula: ${lancamento.matriculaNumeroSnapshot ||
                  lancamento.matriculaId
                  }`,

                  `Plano: ${lancamento.planoNomeSnapshot ||
                  "Não informado"
                  }`,

                  `Regra: ${lancamento.regraNomeSnapshot ||
                  "Não informada"
                  }`,
                ].join("\n"),
              },
            });

            enviados.push({
              lancamentoId: lancamento.id,
              holeriteId: holerite.id,
              holeriteEventoId: evento.id,
              funcionarioNome:
                lancamento.funcionarioNomeSnapshot,
              valor,
            });
          }

          return enviados;
        },
        {
          maxWait: 10_000,
          timeout: 30_000,
        }
      );

      const totalEnviado =
        arredondarCentavos(
          resultado.reduce(
            (total, item) =>
              total + item.valor,
            0
          )
        );

      const ignorados =
        lancamentoIds.length -
        resultado.length;

      return NextResponse.json({
        message:
          `${resultado.length} comissão(ões) enviada(s) ao holerite, totalizando R$ ${totalEnviado.toFixed(
            2
          )}.` +
          (ignorados > 0
            ? ` ${ignorados} comissão(ões) já processada(s), pendente(s) ou reprovada(s) foram ignoradas.`
            : ""),

        enviados: resultado.length,
        ignorados,
        totalEnviado,
        itens: resultado,
      });
    }

    /*
     * =====================================================
     * GERAÇÃO MANUAL DO HOLERITE
     * =====================================================
     */
    const funcionarioId = Number(body.funcionarioId);
    const competenciaMes = Number(body.competenciaMes);
    const competenciaAno = Number(body.competenciaAno);

    const salarioBase = toDecimalNumber(body.salarioBase);
    const eventos = Array.isArray(body.eventos)
      ? body.eventos
      : [];

    if (
      !funcionarioId ||
      !competenciaMes ||
      !competenciaAno
    ) {
      return NextResponse.json(
        {
          error:
            "Informe funcionário, mês e ano da competência.",
        },
        { status: 400 }
      );
    }

    if (
      competenciaMes < 1 ||
      competenciaMes > 12
    ) {
      return NextResponse.json(
        { error: "Informe um mês de competência válido." },
        { status: 400 }
      );
    }

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: funcionarioId,
        instituicaoId,
      },
      select: {
        id: true,
        nome: true,
      },
    });

    if (!funcionario) {
      return NextResponse.json(
        {
          error:
            "Funcionário não encontrado nesta instituição.",
        },
        { status: 404 }
      );
    }

    const holeriteExistente =
      await prisma.holeriteRH.findFirst({
        where: {
          instituicaoId,
          funcionarioId,
          competenciaMes,
          competenciaAno,
        },
        select: {
          id: true,
          arquivado: true,
          cancelado: true,
          status: true,
        },
      });

    if (holeriteExistente) {
      return NextResponse.json(
        {
          error: `Já existe um holerite para ${funcionario.nome} na competência ${String(
            competenciaMes
          ).padStart(2, "0")}/${competenciaAno}.`,
        },
        { status: 409 }
      );
    }

    const totalVencimentos = arredondarCentavos(
      eventos
        .filter((evento: any) => evento.tipo === "VENCIMENTO")
        .reduce(
          (total: number, evento: any) =>
            total + toDecimalNumber(evento.valor),
          0
        )
    );

    const totalDescontos = arredondarCentavos(
      eventos
        .filter((evento: any) => evento.tipo === "DESCONTO")
        .reduce(
          (total: number, evento: any) =>
            total + toDecimalNumber(evento.valor),
          0
        )
    );

    const valorLiquido = arredondarCentavos(
      salarioBase + totalVencimentos - totalDescontos
    );

    const holerite = await prisma.holeriteRH.create({
      data: {
        funcionarioId,
        instituicaoId,
        criadoPorId: user.id,
        competenciaMes,
        competenciaAno,
        salarioBase,
        totalVencimentos,
        totalDescontos,
        valorLiquido,
        baseInss: body.baseInss || null,
        baseFgts: body.baseFgts || null,
        fgtsMes: body.fgtsMes || null,
        baseIrrf: body.baseIrrf || null,
        status: "GERADO",
        eventos: {
          create: eventos.map((evento: any) => ({
            codigo: evento.codigo || null,
            descricao: evento.descricao,
            referencia: evento.referencia || null,
            tipo: evento.tipo,
            valor: toDecimalNumber(evento.valor),
          })),
        },
      },
      include: {
        funcionario: true,
        eventos: true,
      },
    });

    return NextResponse.json(holerite);
  } catch (error: any) {
    console.error(
      "Erro ao processar holerite:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao processar o holerite.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const holeriteId = Number(body.holeriteId);
    const motivoArquivo = String(body.motivoArquivo || "").trim();

    if (!holeriteId) {
      return NextResponse.json({ error: "Informe o holerite." }, { status: 400 });
    }

    if (!motivoArquivo) {
      return NextResponse.json(
        { error: "Informe o motivo do arquivamento." },
        { status: 400 }
      );
    }

    const holerite = await prisma.holeriteRH.findFirst({
      where: {
        id: holeriteId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!holerite) {
      return NextResponse.json(
        { error: "Holerite não encontrado." },
        { status: 404 }
      );
    }

    const atualizado = await prisma.holeriteRH.update({
      where: { id: holerite.id },
      data: {
        arquivado: true,
        arquivadoEm: new Date(),
        arquivadoPorId: user.id,
        motivoArquivo,
        status: "ARQUIVADO",
      },
    });

    await prisma.historicoRH.create({
      data: {
        funcionarioId: holerite.funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        tipo: "ARQUIVAMENTO_HOLERITE",
        titulo: "Holerite arquivado",
        descricao: motivoArquivo,
        dataEvento: new Date(),
        observacoes:
          "Holerite arquivado sem exclusão física. Registro mantido para auditoria.",
      },
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao arquivar holerite." },
      { status: 500 }
    );
  }
}