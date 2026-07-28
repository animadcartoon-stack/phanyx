import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  FormaPagamentoHoleriteRH,
  StatusPagamentoHoleriteRH,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function arredondarCentavos(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function calcularSha256(valor: string) {
  return createHash("sha256").update(valor).digest("hex");
}

function usuarioPodeRegistrarPagamento(user: any) {
  const role = String(user?.role || "").toUpperCase();

  return (
    role === "ADMIN" || role === "SUPER_ADMIN" || user?.isMasterAdmin === true
  );
}

const FORMAS_QUE_EXIGEM_TRANSACAO = new Set<FormaPagamentoHoleriteRH>([
  FormaPagamentoHoleriteRH.FOLHA_BANCARIA,
  FormaPagamentoHoleriteRH.PIX,
  FormaPagamentoHoleriteRH.TRANSFERENCIA,
  FormaPagamentoHoleriteRH.CONTA_SALARIO,
  FormaPagamentoHoleriteRH.CHEQUE,
]);

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  },
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        },
      );
    }

    if (!usuarioPodeRegistrarPagamento(user)) {
      return NextResponse.json(
        {
          error:
            "Você não possui autorização para registrar pagamentos de holerites.",
        },
        {
          status: 403,
        },
      );
    }

    const instituicaoId = Number(user.instituicaoId);
    const registradoPorId = Number(user.id);
    const holeriteId = Number(params.id);

    if (!Number.isInteger(holeriteId) || holeriteId <= 0) {
      return NextResponse.json(
        {
          error: "Informe um holerite válido.",
        },
        {
          status: 400,
        },
      );
    }

    const body = await req.json();

    const formaInformada = String(body.formaPagamento || "")
      .trim()
      .toUpperCase();

    const formasValidas = Object.values(FormaPagamentoHoleriteRH) as string[];

    if (!formasValidas.includes(formaInformada)) {
      return NextResponse.json(
        {
          error: "Informe uma forma de pagamento válida.",
        },
        {
          status: 400,
        },
      );
    }

    const formaPagamento = formaInformada as FormaPagamentoHoleriteRH;

    const valorPago = arredondarCentavos(Number(body.valorPago));

    if (!Number.isFinite(valorPago) || valorPago <= 0) {
      return NextResponse.json(
        {
          error: "Informe o valor efetivamente pago.",
        },
        {
          status: 400,
        },
      );
    }

    const pagoEm = new Date(String(body.pagoEm || ""));

    if (Number.isNaN(pagoEm.getTime())) {
      return NextResponse.json(
        {
          error: "Informe a data e o horário efetivos do pagamento.",
        },
        {
          status: 400,
        },
      );
    }

    if (pagoEm.getTime() > Date.now() + 5 * 60 * 1000) {
      return NextResponse.json(
        {
          error: "A data do pagamento não pode estar no futuro.",
        },
        {
          status: 400,
        },
      );
    }

    const identificadorTransacao = String(body.identificadorTransacao || "")
      .trim()
      .slice(0, 200);

    const bancoOrigem = String(body.bancoOrigem || "")
      .trim()
      .slice(0, 200);

    const contaDestinoMascarada = String(body.contaDestinoMascarada || "")
      .trim()
      .slice(0, 200);

    const observacoes = String(body.observacoes || "")
      .trim()
      .slice(0, 3000);

    if (
      FORMAS_QUE_EXIGEM_TRANSACAO.has(formaPagamento) &&
      !identificadorTransacao
    ) {
      return NextResponse.json(
        {
          error: "Informe o número, identificador ou referência da transação.",
        },
        {
          status: 400,
        },
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
        {
          status: 404,
        },
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
        {
          status: 400,
        },
      );
    }

    const valorLiquido = arredondarCentavos(Number(holerite.valorLiquido || 0));

    if (Math.abs(valorPago - valorLiquido) > 0.009) {
      return NextResponse.json(
        {
          error: `O valor informado deve corresponder ao líquido do holerite: R$ ${valorLiquido.toFixed(
            2,
          )}.`,
        },
        {
          status: 400,
        },
      );
    }

    const pagamentoExistente = await prisma.pagamentoHoleriteRH.findFirst({
      where: {
        instituicaoId,
        holeriteId,

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
          error: `Este holerite já possui o recibo ${pagamentoExistente.reciboNumero}.`,
        },
        {
          status: 409,
        },
      );
    }

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

    const dadosPagamentoHash = calcularSha256(
      JSON.stringify({
        instituicaoId,
        holeriteId,
        funcionarioId: holerite.funcionarioId,
        funcionarioNome: holerite.funcionario.nome,
        funcionarioCpf: holerite.funcionario.cpf || null,
        competenciaMes: holerite.competenciaMes,
        competenciaAno: holerite.competenciaAno,
        salarioBase: Number(holerite.salarioBase || 0).toFixed(2),
        totalVencimentos: Number(holerite.totalVencimentos || 0).toFixed(2),
        totalDescontos: Number(holerite.totalDescontos || 0).toFixed(2),
        valorLiquido: valorLiquido.toFixed(2),
        valorPago: valorPago.toFixed(2),
        formaPagamento,
        pagoEm: pagoEm.toISOString(),
        identificadorTransacao: identificadorTransacao || null,
        bancoOrigem: bancoOrigem || null,
        contaDestinoMascarada: contaDestinoMascarada || null,
        reciboNumero,
        eventos: eventosSnapshot,
        registradoPorId,
      }),
    );

    const resultado = await prisma.$transaction(
      async (tx) => {
        const concorrente = await tx.pagamentoHoleriteRH.findFirst({
          where: {
            instituicaoId,
            holeriteId,

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
          },
        });

        if (concorrente) {
          throw new Error(
            `Este holerite já possui o recibo ${concorrente.reciboNumero}.`,
          );
        }

        const pagamento = await tx.pagamentoHoleriteRH.create({
          data: {
            instituicaoId,
            funcionarioId: holerite.funcionarioId,
            holeriteId,
            registradoPorId,

            status: StatusPagamentoHoleriteRH.REGISTRADO,

            formaPagamento,
            valorPago,
            pagoEm,

            identificadorTransacao: identificadorTransacao || null,

            bancoOrigem: bancoOrigem || null,

            contaDestinoMascarada: contaDestinoMascarada || null,

            observacoes: observacoes || null,

            funcionarioNomeSnapshot: holerite.funcionario.nome,

            funcionarioCpfSnapshot: holerite.funcionario.cpf || null,

            competenciaMesSnapshot: holerite.competenciaMes,

            competenciaAnoSnapshot: holerite.competenciaAno,

            valorLiquidoSnapshot: valorLiquido,

            eventosSnapshot,
            reciboNumero,
            dadosPagamentoHash,
          },
        });

        await tx.holeriteRH.update({
          where: {
            id: holeriteId,
          },

          data: {
            status: "AGUARDANDO_ASSINATURA",
          },
        });

        await tx.historicoRH.create({
          data: {
            funcionarioId: holerite.funcionarioId,

            instituicaoId,
            criadoPorId: registradoPorId,

            tipo: "RECIBO_PAGAMENTO_HOLERITE_GERADO",

            titulo: "Recibo de pagamento aguardando assinatura",

            descricao:
              `Recibo ${reciboNumero} criado para ` +
              `${holerite.funcionario.nome}, competência ` +
              `${String(holerite.competenciaMes).padStart(2, "0")}/` +
              `${holerite.competenciaAno}.`,

            dataEvento: new Date(),

            observacoes: [
              `Pagamento ID: ${pagamento.id}`,
              `Holerite ID: ${holeriteId}`,
              `Forma: ${formaPagamento}`,
              `Valor declarado: R$ ${valorPago.toFixed(2)}`,
              identificadorTransacao
                ? `Transação: ${identificadorTransacao}`
                : null,
              `Dados SHA-256: ${dadosPagamentoHash}`,
              "O holerite e as comissões somente serão confirmados como pagos após a assinatura do funcionário.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        });

        return pagamento;
      },
      {
        maxWait: 10_000,
        timeout: 30_000,
      },
    );

    return NextResponse.json({
      message:
        "Recibo de pagamento criado. Aguardando assinatura do funcionário.",

      pagamentoId: resultado.id,
      reciboNumero: resultado.reciboNumero,
      status: resultado.status,

      reciboPdfUrl: `/api/admin/rh/holerites/${holeriteId}/recibo-pagamento/pdf`,
    });
  } catch (error: any) {
    console.error("Erro ao registrar recibo de pagamento:", error);

    return NextResponse.json(
      {
        error: error?.message || "Erro ao registrar o recibo de pagamento.",
      },
      {
        status: 500,
      },
    );
  }
}
