import { createHash, randomUUID } from "crypto";
import { del, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import {
  FormaPagamentoHoleriteRH,
  StatusLancamentoComissaoRH,
  StatusLancamentoRemuneracaoVariavelRH,
  StatusPagamentoHoleriteRH,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

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
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  );
}

function usuarioPodeEnviarRemuneracao(user: any) {
  const role = String(user?.role || "").toUpperCase();

  return (
    role === "ADMIN" || role === "SUPER_ADMIN" || user?.isMasterAdmin === true
  );
}

const TAMANHO_MAXIMO_COMPROVANTE = 4 * 1024 * 1024;

const TIPOS_COMPROVANTE_PERMITIDOS = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const FORMAS_QUE_EXIGEM_TRANSACAO = new Set<FormaPagamentoHoleriteRH>([
  FormaPagamentoHoleriteRH.FOLHA_BANCARIA,
  FormaPagamentoHoleriteRH.PIX,
  FormaPagamentoHoleriteRH.TRANSFERENCIA,
  FormaPagamentoHoleriteRH.CONTA_SALARIO,
  FormaPagamentoHoleriteRH.CHEQUE,
]);

function calcularSha256(valor: string | Buffer) {
  return createHash("sha256").update(valor).digest("hex");
}

function normalizarNomeArquivo(nome: string) {
  const nomeSeguro = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

  return nomeSeguro || "comprovante";
}

function obterArquivoFormulario(valor: unknown): File | null {
  if (!valor || typeof valor === "string") {
    return null;
  }

  const arquivo = valor as File;

  if (typeof arquivo.arrayBuffer !== "function" || arquivo.size <= 0) {
    return null;
  }

  return arquivo;
}

function assinaturaArquivoValida(buffer: Buffer, mime: string) {
  if (mime === "application/pdf") {
    return (
      buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-"
    );
  }

  if (mime === "image/jpeg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (mime === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mime === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return false;
}

async function recalcularTotaisHolerite(tx: any, holeriteId: number) {
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
        (total: number, evento: any) => total + Number(evento.valor || 0),
        0,
      ),
  );

  const totalDescontos = arredondarCentavos(
    eventos
      .filter((evento: any) => evento.tipo === "DESCONTO")
      .reduce(
        (total: number, evento: any) => total + Number(evento.valor || 0),
        0,
      ),
  );

  const salarioBase = Number(holerite.salarioBase || 0);

  const valorLiquido = arredondarCentavos(
    salarioBase + totalVencimentos - totalDescontos,
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

      departamento: {
        select: {
          nome: true,
        },
      },
    },
  },

  eventos: true,

  pagamentos: {
    where: {
      status: {
        notIn: [
          StatusPagamentoHoleriteRH.CANCELADO,
          StatusPagamentoHoleriteRH.SUBSTITUIDO,
        ],
      },
    },

    orderBy: {
      registradoEm: "desc",
    },

    take: 1,

    select: {
      id: true,
      status: true,
      reciboNumero: true,
      registradoEm: true,
      pagoEm: true,
      assinaturaSolicitadaEm: true,
      confirmadoPeloFuncionarioEm: true,
      assinaturaImagemUrl: true,
    },
  },
},
      orderBy: [{ competenciaAno: "desc" }, { competenciaMes: "desc" }],
      take: 100,
    });

    return NextResponse.json(holerites);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar holerites." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const instituicaoId = Number(user.instituicaoId);

    const contentType = req.headers.get("content-type") || "";

    let body: Record<string, any> = {};
    let formData: FormData | null = null;

    if (contentType.toLowerCase().includes("multipart/form-data")) {
      formData = await req.formData();

      formData.forEach((valor, chave) => {
        if (typeof valor === "string") {
          body[chave] = valor;
        }
      });
    } else {
      body = await req.json();
    }

    const acao = String(body.acao || "")
      .trim()
      .toUpperCase();

    if (!instituicaoId) {
      return NextResponse.json(
        { error: "Instituição não identificada." },
        { status: 400 },
      );
    }

    /*
     * =====================================================
     * PAGAMENTO DO HOLERITE COM COMPROVAÇÃO
     * =====================================================
     */

    if (acao === "MARCAR_HOLERITE_PAGO") {
      return NextResponse.json(
        {
          error:
            "O registro simples de pagamento foi desativado. Informe os dados financeiros e anexe o comprovante.",
        },
        { status: 400 },
      );
    }

    if (acao === "REGISTRAR_PAGAMENTO_HOLERITE") {
      if (!usuarioPodeEnviarRemuneracao(user)) {
        return NextResponse.json(
          {
            error:
              "Você não possui autorização para registrar pagamentos de holerites.",
          },
          { status: 403 },
        );
      }

      if (!formData) {
        return NextResponse.json(
          {
            error: "Envie os dados do pagamento juntamente com o comprovante.",
          },
          { status: 400 },
        );
      }

      const holeriteId = Number(body.holeriteId);

      const formaPagamento = String(body.formaPagamento || "")
        .trim()
        .toUpperCase() as FormaPagamentoHoleriteRH;

      const valorPago = arredondarCentavos(
        Number(
          String(body.valorPago ?? "")
            .trim()
            .replace(",", "."),
        ),
      );

      const pagoEm = new Date(String(body.pagoEm || "").trim());

      const identificadorTransacao = String(body.identificadorTransacao || "")
        .trim()
        .slice(0, 200);

      const contaDestinoMascarada = String(body.contaDestinoMascarada || "")
        .trim()
        .slice(0, 200);

      const bancoOrigem = String(body.bancoOrigem || "")
        .trim()
        .slice(0, 200);

      const observacoes = String(body.observacoes || "")
        .trim()
        .slice(0, 3000);

      const comprovante = obterArquivoFormulario(formData.get("comprovante"));

      if (!Number.isInteger(holeriteId) || holeriteId <= 0) {
        return NextResponse.json(
          { error: "Informe um holerite válido." },
          { status: 400 },
        );
      }

      if (!Object.values(FormaPagamentoHoleriteRH).includes(formaPagamento)) {
        return NextResponse.json(
          {
            error: "Informe uma forma de pagamento válida.",
          },
          { status: 400 },
        );
      }

      if (!Number.isFinite(valorPago) || valorPago <= 0) {
        return NextResponse.json(
          {
            error: "Informe o valor efetivamente pago.",
          },
          { status: 400 },
        );
      }

      if (Number.isNaN(pagoEm.getTime())) {
        return NextResponse.json(
          {
            error: "Informe a data efetiva do pagamento.",
          },
          { status: 400 },
        );
      }

      if (pagoEm.getTime() > Date.now() + 5 * 60 * 1000) {
        return NextResponse.json(
          {
            error: "A data do pagamento não pode estar no futuro.",
          },
          { status: 400 },
        );
      }

      if (
        FORMAS_QUE_EXIGEM_TRANSACAO.has(formaPagamento) &&
        !identificadorTransacao
      ) {
        return NextResponse.json(
          {
            error:
              "Informe o identificador, número ou referência da transação.",
          },
          { status: 400 },
        );
      }

      if (!comprovante) {
        return NextResponse.json(
          {
            error:
              formaPagamento === FormaPagamentoHoleriteRH.DINHEIRO
                ? "Anexe o recibo assinado pelo funcionário."
                : "Anexe o comprovante financeiro do pagamento.",
          },
          { status: 400 },
        );
      }

      if (!TIPOS_COMPROVANTE_PERMITIDOS.has(comprovante.type)) {
        return NextResponse.json(
          {
            error: "O comprovante deve ser PDF, JPG, PNG ou WEBP.",
          },
          { status: 400 },
        );
      }

      if (comprovante.size > TAMANHO_MAXIMO_COMPROVANTE) {
        return NextResponse.json(
          {
            error: "O comprovante não pode ultrapassar 4 MB.",
          },
          { status: 400 },
        );
      }

      const storeId = process.env.RH_PONTO_STORE_ID?.trim();

      const token = process.env.RH_PONTO_READ_WRITE_TOKEN?.trim();

      if (!storeId || !token) {
        return NextResponse.json(
          {
            error:
              "O armazenamento privado de documentos do RH não está configurado.",
          },
          { status: 500 },
        );
      }

      const holerite = await prisma.holeriteRH.findFirst({
        where: {
          id: holeriteId,
          instituicaoId,
        },

        select: {
          id: true,
          funcionarioId: true,
          competenciaMes: true,
          competenciaAno: true,
          salarioBase: true,
          totalVencimentos: true,
          totalDescontos: true,
          valorLiquido: true,
          status: true,
          arquivado: true,
          cancelado: true,
          pagoEm: true,

          funcionario: {
            select: {
              id: true,
              nome: true,
              cpf: true,
            },
          },

          eventos: {
            orderBy: {
              id: "asc",
            },

            select: {
              id: true,
              codigo: true,
              descricao: true,
              referencia: true,
              tipo: true,
              valor: true,
            },
          },
        },
      });

      if (!holerite) {
        return NextResponse.json(
          {
            error: "Holerite não encontrado nesta instituição.",
          },
          { status: 404 },
        );
      }

      if (
        holerite.arquivado ||
        holerite.cancelado ||
        ["ARQUIVADO", "CANCELADO"].includes(
          String(holerite.status || "").toUpperCase(),
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Não é possível registrar pagamento de um holerite arquivado ou cancelado.",
          },
          { status: 400 },
        );
      }

      const valorLiquido = arredondarCentavos(
        Number(holerite.valorLiquido || 0),
      );

      if (Math.abs(valorPago - valorLiquido) > 0.009) {
        return NextResponse.json(
          {
            error: `O valor pago deve corresponder ao líquido do holerite: R$ ${valorLiquido.toFixed(
              2,
            )}.`,
          },
          { status: 400 },
        );
      }

      const pagamentoExistente = await prisma.pagamentoHoleriteRH.findFirst({
        where: {
          instituicaoId,
          holeriteId: holerite.id,

          status: {
            in: [
              StatusPagamentoHoleriteRH.REGISTRADO,
              StatusPagamentoHoleriteRH.CONFIRMADO_FUNCIONARIO,
              StatusPagamentoHoleriteRH.CONTESTADO,
            ],
          },
        },

        select: {
          id: true,
          reciboNumero: true,
          status: true,
        },
      });

      if (pagamentoExistente) {
        return NextResponse.json(
          {
            error: `Este holerite já possui o pagamento ${pagamentoExistente.reciboNumero} registrado.`,
          },
          { status: 409 },
        );
      }

      const bufferComprovante = Buffer.from(await comprovante.arrayBuffer());

      if (!assinaturaArquivoValida(bufferComprovante, comprovante.type)) {
        return NextResponse.json(
          {
            error:
              "O conteúdo do arquivo não corresponde ao formato informado.",
          },
          { status: 400 },
        );
      }

      const comprovanteHash = calcularSha256(bufferComprovante);

      const nomeSeguro = normalizarNomeArquivo(comprovante.name);

      const caminhoComprovante = [
        "rh-ponto",
        `instituicoes/${instituicaoId}`,
        `holerites/${holerite.id}`,
        "pagamentos",
        `${randomUUID()}-${nomeSeguro}`,
      ].join("/");

      let comprovanteUrl: string | null = null;

      try {
        const blob = await put(caminhoComprovante, bufferComprovante, {
          access: "private",
          storeId,
          token,
          contentType: comprovante.type || "application/octet-stream",
          addRandomSuffix: false,
        });

        comprovanteUrl = blob.url;

        const eventosSnapshot = holerite.eventos.map((evento) => ({
          id: evento.id,
          codigo: evento.codigo,
          descricao: evento.descricao,
          referencia: evento.referencia,
          tipo: evento.tipo,
          valor: Number(evento.valor || 0).toFixed(2),
        }));

        const reciboNumero =
          `REC-${instituicaoId}-${holerite.id}-` +
          randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();

        const registradoPorId = Number(user.id);

        const dadosPagamentoHash = calcularSha256(
          JSON.stringify({
            instituicaoId,
            holeriteId: holerite.id,
            funcionarioId: holerite.funcionarioId,
            funcionarioNome: holerite.funcionario.nome,
            funcionarioCpf: holerite.funcionario.cpf || null,
            competenciaMes: holerite.competenciaMes,
            competenciaAno: holerite.competenciaAno,
            valorLiquido: valorLiquido.toFixed(2),
            valorPago: valorPago.toFixed(2),
            formaPagamento,
            pagoEm: pagoEm.toISOString(),
            identificadorTransacao: identificadorTransacao || null,
            contaDestinoMascarada: contaDestinoMascarada || null,
            bancoOrigem: bancoOrigem || null,
            comprovanteHash,
            reciboNumero,
            eventos: eventosSnapshot,
            registradoPorId,
          }),
        );

        const eventoIds = holerite.eventos.map((evento) => evento.id);

        const resultado = await prisma.$transaction(
          async (tx) => {
            const pagamentoConcorrente = await tx.pagamentoHoleriteRH.findFirst(
              {
                where: {
                  instituicaoId,
                  holeriteId: holerite.id,

                  status: {
                    in: [
                      StatusPagamentoHoleriteRH.REGISTRADO,
                      StatusPagamentoHoleriteRH.CONFIRMADO_FUNCIONARIO,
                      StatusPagamentoHoleriteRH.CONTESTADO,
                    ],
                  },
                },

                select: {
                  id: true,
                },
              },
            );

            if (pagamentoConcorrente) {
              throw new Error(
                "Este holerite já recebeu outro registro de pagamento.",
              );
            }

            const pagamento = await tx.pagamentoHoleriteRH.create({
              data: {
                instituicaoId,
                funcionarioId: holerite.funcionarioId,
                holeriteId: holerite.id,
                registradoPorId,

                status: StatusPagamentoHoleriteRH.REGISTRADO,

                formaPagamento,
                valorPago,
                pagoEm,

                identificadorTransacao: identificadorTransacao || null,

                contaDestinoMascarada: contaDestinoMascarada || null,

                bancoOrigem: bancoOrigem || null,

                observacoes: observacoes || null,

                funcionarioNomeSnapshot: holerite.funcionario.nome,

                funcionarioCpfSnapshot: holerite.funcionario.cpf || null,

                competenciaMesSnapshot: holerite.competenciaMes,

                competenciaAnoSnapshot: holerite.competenciaAno,

                valorLiquidoSnapshot: valorLiquido,

                eventosSnapshot,

                comprovanteUrl,
                comprovanteNome: comprovante.name,

                comprovanteMime: comprovante.type,

                comprovanteTamanho: comprovante.size,

                comprovanteHash,
                reciboNumero,
                dadosPagamentoHash,
              },
            });

            await tx.holeriteRH.update({
              where: {
                id: holerite.id,
              },

              data: {
                status: "PAGO",
                pagoEm,
                pagoPorId: registradoPorId,
              },
            });

            let comissoesPagas = 0;
            let remuneracoesPagas = 0;

            if (eventoIds.length > 0) {
              const comissoes = await tx.lancamentoComissaoRH.updateMany({
                where: {
                  instituicaoId,

                  holeriteEventoId: {
                    in: eventoIds,
                  },

                  status: StatusLancamentoComissaoRH.ENVIADO_HOLERITE,
                },

                data: {
                  status: StatusLancamentoComissaoRH.PAGO,
                  pagoEm,
                },
              });

              comissoesPagas = comissoes.count;

              const remuneracoes =
                await tx.lancamentoRemuneracaoVariavelRH.updateMany({
                  where: {
                    instituicaoId,

                    holeriteEventoId: {
                      in: eventoIds,
                    },

                    status:
                      StatusLancamentoRemuneracaoVariavelRH.ENVIADO_HOLERITE,
                  },

                  data: {
                    status: StatusLancamentoRemuneracaoVariavelRH.PAGO,
                    pagoEm,
                  },
                });

              remuneracoesPagas = remuneracoes.count;
            }

            await tx.historicoRH.create({
              data: {
                funcionarioId: holerite.funcionarioId,

                instituicaoId,
                criadoPorId: registradoPorId,

                tipo: "PAGAMENTO_HOLERITE_REGISTRADO",

                titulo: "Pagamento de holerite registrado com comprovante",

                descricao:
                  `Holerite de ${holerite.funcionario.nome}, ` +
                  `competência ${String(holerite.competenciaMes).padStart(
                    2,
                    "0",
                  )}/` +
                  `${holerite.competenciaAno}, ` +
                  `registrado como pago.`,

                dataEvento: pagoEm,

                observacoes: [
                  `Pagamento ID: ${pagamento.id}`,
                  `Recibo: ${reciboNumero}`,
                  `Holerite ID: ${holerite.id}`,
                  `Forma: ${formaPagamento}`,
                  `Valor: R$ ${valorPago.toFixed(2)}`,
                  identificadorTransacao
                    ? `Transação: ${identificadorTransacao}`
                    : null,
                  `Comprovante SHA-256: ${comprovanteHash}`,
                  `Dados SHA-256: ${dadosPagamentoHash}`,
                  `Comissões atualizadas: ${comissoesPagas}`,
                  `Remunerações variáveis atualizadas: ${remuneracoesPagas}`,
                ]
                  .filter(Boolean)
                  .join("\n"),
              },
            });

            return {
              pagamentoId: pagamento.id,
              reciboNumero,
              comissoesPagas,
              remuneracoesPagas,
            };
          },
          {
            maxWait: 10_000,
            timeout: 30_000,
          },
        );

        return NextResponse.json({
          message:
            "Pagamento registrado com comprovante e trilha de auditoria.",

          holeriteId: holerite.id,
          pagamentoId: resultado.pagamentoId,

          reciboNumero: resultado.reciboNumero,

          pagoEm,

          comprovanteHash,

          comissoesPagas: resultado.comissoesPagas,

          remuneracoesPagas: resultado.remuneracoesPagas,
        });
      } catch (error) {
        if (comprovanteUrl) {
          await del(comprovanteUrl, {
            token,
          }).catch((erroExclusao) => {
            console.error(
              "Não foi possível remover comprovante órfão:",
              erroExclusao,
            );
          });
        }

        throw error;
      }
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
          { status: 403 },
        );
      }

      const programaId = Number(body.programaId);

      const lancamentoIds = normalizarIds(body.lancamentoIds);

      if (!programaId) {
        return NextResponse.json(
          { error: "Informe o programa de remuneração." },
          { status: 400 },
        );
      }

      if (lancamentoIds.length === 0) {
        return NextResponse.json(
          {
            error: "Selecione pelo menos um lançamento aprovado.",
          },
          { status: 400 },
        );
      }

      const programa = await prisma.programaRemuneracaoVariavelRH.findFirst({
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
            error: "Programa de remuneração não encontrado.",
          },
          { status: 404 },
        );
      }

      const lancamentos = await prisma.lancamentoRemuneracaoVariavelRH.findMany(
        {
          where: {
            id: {
              in: lancamentoIds,
            },
            instituicaoId,
            programaId,
            status: StatusLancamentoRemuneracaoVariavelRH.APROVADO,
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
        },
      );

      if (lancamentos.length === 0) {
        return NextResponse.json(
          {
            error:
              "Nenhum dos lançamentos selecionados está aprovado e aguardando envio.",
          },
          { status: 400 },
        );
      }

      const agora = new Date();
      const criadoPorId = Number(user.id);

      const resultado = await prisma.$transaction(async (tx) => {
        const enviados: Array<{
          lancamentoId: number;
          holeriteId: number;
          holeriteEventoId: number;
          funcionarioNome: string;
          valor: number;
        }> = [];

        for (const lancamento of lancamentos) {
          const valor = arredondarCentavos(
            Number(lancamento.valorAprovado ?? lancamento.valorCalculado ?? 0),
          );

          if (!Number.isFinite(valor) || valor <= 0) {
            throw new Error(
              `O lançamento de ${lancamento.funcionarioNomeSnapshot} possui valor inválido.`,
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
            String(holerite?.status || "").toUpperCase() === "ARQUIVADO" ||
            String(holerite?.status || "").toUpperCase() === "CANCELADO"
          ) {
            throw new Error(
              `O holerite de ${lancamento.funcionarioNomeSnapshot}, competência ${String(
                lancamento.competenciaMes,
              ).padStart(2, "0")}/${
                lancamento.competenciaAno
              }, está arquivado ou cancelado.`,
            );
          }

          if (!holerite) {
            const salarioBase = arredondarCentavos(
              Number(
                lancamento.funcionario.salarioBase ??
                  lancamento.funcionario.salario ??
                  0,
              ),
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
              referencia: `${String(lancamento.competenciaMes).padStart(
                2,
                "0",
              )}/${lancamento.competenciaAno}`,
              tipo: "VENCIMENTO",
              valor,
            },
          });

          const atualizacaoLancamento =
            await tx.lancamentoRemuneracaoVariavelRH.updateMany({
              where: {
                id: lancamento.id,
                instituicaoId,
                programaId,
                status: StatusLancamentoRemuneracaoVariavelRH.APROVADO,
                holeriteEventoId: null,
              },

              data: {
                status: StatusLancamentoRemuneracaoVariavelRH.ENVIADO_HOLERITE,
                holeriteEventoId: evento.id,
                enviadoHoleriteEm: agora,
                enviadoHoleritePorId: criadoPorId,
              },
            });

          if (atualizacaoLancamento.count !== 1) {
            throw new Error(
              `O lançamento de ${lancamento.funcionarioNomeSnapshot} já foi processado por outro usuário.`,
            );
          }

          await recalcularTotaisHolerite(tx, holerite.id);

          await tx.historicoRH.create({
            data: {
              funcionarioId: lancamento.funcionarioId,
              instituicaoId,
              criadoPorId,
              tipo: "REMUNERACAO_VARIAVEL_ENVIADA_HOLERITE",
              titulo: "Remuneração variável enviada ao holerite",
              descricao: `${
                lancamento.descricao ||
                lancamento.programaNomeSnapshot ||
                programa.nome
              } — R$ ${valor.toFixed(2)}`,
              dataEvento: agora,
              observacoes: `Competência ${String(
                lancamento.competenciaMes,
              ).padStart(2, "0")}/${
                lancamento.competenciaAno
              }. Lançamento de remuneração variável ID ${lancamento.id}.`,
            },
          });

          enviados.push({
            lancamentoId: lancamento.id,
            holeriteId: holerite.id,
            holeriteEventoId: evento.id,
            funcionarioNome: lancamento.funcionarioNomeSnapshot,
            valor,
          });
        }

        return enviados;
      });

      const totalEnviado = arredondarCentavos(
        resultado.reduce((total, item) => total + item.valor, 0),
      );

      const ignorados = lancamentoIds.length - resultado.length;

      return NextResponse.json({
        message:
          `${resultado.length} lançamento(s) enviado(s) ao holerite, totalizando R$ ${totalEnviado.toFixed(
            2,
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
          { status: 403 },
        );
      }

      const lancamentoIds = normalizarIds(body.lancamentoIds);

      if (lancamentoIds.length === 0) {
        return NextResponse.json(
          {
            error: "Selecione pelo menos uma comissão aprovada.",
          },
          { status: 400 },
        );
      }

      const lancamentos = await prisma.lancamentoComissaoRH.findMany({
        where: {
          id: {
            in: lancamentoIds,
          },

          instituicaoId,

          status: StatusLancamentoComissaoRH.APROVADO,

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
          { status: 400 },
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
                lancamento.valorAprovado ?? lancamento.valorCalculado ?? 0,
              ),
            );

            if (!Number.isFinite(valor) || valor <= 0) {
              throw new Error(
                `A comissão de ${lancamento.funcionarioNomeSnapshot} possui valor inválido.`,
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
              String(holerite?.status || "").toUpperCase() === "ARQUIVADO" ||
              String(holerite?.status || "").toUpperCase() === "CANCELADO"
            ) {
              throw new Error(
                `O holerite de ${lancamento.funcionarioNomeSnapshot}, competência ${String(
                  lancamento.competenciaMes,
                ).padStart(2, "0")}/${
                  lancamento.competenciaAno
                }, está arquivado ou cancelado.`,
              );
            }

            if (!holerite) {
              const salarioBase = arredondarCentavos(
                Number(
                  lancamento.funcionario.salarioBase ??
                    lancamento.funcionario.salario ??
                    0,
                ),
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

            const descricaoEvento = [
              "Comissão comercial",

              lancamento.regraNomeSnapshot || lancamento.descricao,

              lancamento.alunoNomeSnapshot
                ? `Aluno: ${lancamento.alunoNomeSnapshot}`
                : null,

              lancamento.matriculaNumeroSnapshot
                ? `Matrícula: ${lancamento.matriculaNumeroSnapshot}`
                : null,
            ]
              .filter(Boolean)
              .join(" — ");

            const evento = await tx.holeriteEventoRH.create({
              data: {
                holeriteId: holerite.id,

                codigo: `COM-${lancamento.id}`,

                descricao: descricaoEvento,

                referencia: `${String(lancamento.competenciaMes).padStart(
                  2,
                  "0",
                )}/${lancamento.competenciaAno}`,

                tipo: "VENCIMENTO",

                valor,
              },
            });

            const atualizacaoLancamento =
              await tx.lancamentoComissaoRH.updateMany({
                where: {
                  id: lancamento.id,
                  instituicaoId,

                  status: StatusLancamentoComissaoRH.APROVADO,

                  holeriteEventoId: null,
                },

                data: {
                  status: StatusLancamentoComissaoRH.ENVIADO_HOLERITE,

                  holeriteEventoId: evento.id,

                  enviadoHoleriteEm: agora,
                  enviadoHoleritePorId: criadoPorId,
                },
              });

            if (atualizacaoLancamento.count !== 1) {
              throw new Error(
                `A comissão de ${lancamento.funcionarioNomeSnapshot} já foi processada por outro usuário.`,
              );
            }

            await recalcularTotaisHolerite(tx, holerite.id);

            await tx.historicoRH.create({
              data: {
                funcionarioId: lancamento.funcionarioId,

                instituicaoId,
                criadoPorId,

                tipo: "COMISSAO_COMERCIAL_ENVIADA_HOLERITE",

                titulo: "Comissão comercial enviada ao holerite",

                descricao:
                  `${lancamento.regraNomeSnapshot || lancamento.descricao} — ` +
                  `R$ ${valor.toFixed(2)}`,

                dataEvento: agora,

                observacoes: [
                  `Competência: ${String(lancamento.competenciaMes).padStart(
                    2,
                    "0",
                  )}/${lancamento.competenciaAno}`,

                  `Lançamento de comissão ID: ${lancamento.id}`,

                  `Holerite ID: ${holerite.id}`,

                  `Evento de holerite ID: ${evento.id}`,

                  `Aluno: ${lancamento.alunoNomeSnapshot || "Não informado"}`,

                  `Matrícula: ${
                    lancamento.matriculaNumeroSnapshot || lancamento.matriculaId
                  }`,

                  `Plano: ${lancamento.planoNomeSnapshot || "Não informado"}`,

                  `Regra: ${lancamento.regraNomeSnapshot || "Não informada"}`,
                ].join("\n"),
              },
            });

            enviados.push({
              lancamentoId: lancamento.id,
              holeriteId: holerite.id,
              holeriteEventoId: evento.id,
              funcionarioNome: lancamento.funcionarioNomeSnapshot,
              valor,
            });
          }

          return enviados;
        },
        {
          maxWait: 10_000,
          timeout: 30_000,
        },
      );

      const totalEnviado = arredondarCentavos(
        resultado.reduce((total, item) => total + item.valor, 0),
      );

      const ignorados = lancamentoIds.length - resultado.length;

      return NextResponse.json({
        message:
          `${resultado.length} comissão(ões) enviada(s) ao holerite, totalizando R$ ${totalEnviado.toFixed(
            2,
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
    const eventos = Array.isArray(body.eventos) ? body.eventos : [];

    if (!funcionarioId || !competenciaMes || !competenciaAno) {
      return NextResponse.json(
        {
          error: "Informe funcionário, mês e ano da competência.",
        },
        { status: 400 },
      );
    }

    if (competenciaMes < 1 || competenciaMes > 12) {
      return NextResponse.json(
        { error: "Informe um mês de competência válido." },
        { status: 400 },
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
          error: "Funcionário não encontrado nesta instituição.",
        },
        { status: 404 },
      );
    }

    const holeriteExistente = await prisma.holeriteRH.findFirst({
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
            competenciaMes,
          ).padStart(2, "0")}/${competenciaAno}.`,
        },
        { status: 409 },
      );
    }

    const totalVencimentos = arredondarCentavos(
      eventos
        .filter((evento: any) => evento.tipo === "VENCIMENTO")
        .reduce(
          (total: number, evento: any) => total + toDecimalNumber(evento.valor),
          0,
        ),
    );

    const totalDescontos = arredondarCentavos(
      eventos
        .filter((evento: any) => evento.tipo === "DESCONTO")
        .reduce(
          (total: number, evento: any) => total + toDecimalNumber(evento.valor),
          0,
        ),
    );

    const valorLiquido = arredondarCentavos(
      salarioBase + totalVencimentos - totalDescontos,
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
    console.error("Erro ao processar holerite:", error);

    return NextResponse.json(
      {
        error: error?.message || "Erro ao processar o holerite.",
      },
      { status: 500 },
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
      return NextResponse.json(
        { error: "Informe o holerite." },
        { status: 400 },
      );
    }

    if (!motivoArquivo) {
      return NextResponse.json(
        { error: "Informe o motivo do arquivamento." },
        { status: 400 },
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
        { status: 404 },
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
      { status: 500 },
    );
  }
}
