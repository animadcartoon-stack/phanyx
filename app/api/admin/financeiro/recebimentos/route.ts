import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { podeUsarFinanceiroCompleto } from "@/lib/permissoesPlano";

function calcularValorFinal(
  valorOriginal: number,
  descontoValor?: number | null,
  jurosValor?: number | null,
  multaValor?: number | null
) {
  return Number(
    (
      Number(valorOriginal || 0) -
      Number(descontoValor || 0) +
      Number(jurosValor || 0) +
      Number(multaValor || 0)
    ).toFixed(2)
  );
}

function normalizarNumero(valor: unknown) {
  if (valor === "" || valor === null || valor === undefined) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

async function buscarConfiguracaoFinanceira(instituicaoId: number) {
  const config = await prisma.configuracaoFinanceiraInstituicao.findUnique({
    where: {
      instituicaoId,
    },
  });

  return {
    jurosPadrao: Number(config?.jurosPadrao || 0),
    multaPadrao: Number(config?.multaPadrao || 0),
    descontoPadrao: Number(config?.descontoPadrao || 0),
    diasTolerancia: Number(config?.diasTolerancia || 0),
    bloquearAlunoInadimplente: Boolean(config?.bloquearAlunoInadimplente),
    permitirPagamentoParcial:
      config?.permitirPagamentoParcial !== undefined
        ? Boolean(config.permitirPagamentoParcial)
        : true,
  };
}

async function atualizarAtrasosEInadimplencia(instituicaoId: number) {
  const config = await buscarConfiguracaoFinanceira(instituicaoId);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataLimite = new Date(hoje);
  dataLimite.setDate(dataLimite.getDate() - config.diasTolerancia);

  await prisma.lancamentoFinanceiro.updateMany({
    where: {
      instituicaoId,
      status: {
        in: ["PENDENTE", "PARCIAL"] as any,
      },
      vencimento: {
        lt: dataLimite,
      },
    },
    data: {
      status: "ATRASADO",
    },
  });

  if (config.bloquearAlunoInadimplente) {
    const lancamentosAtrasados = await prisma.lancamentoFinanceiro.findMany({
      where: {
        instituicaoId,
        status: "ATRASADO",
      },
      select: {
        alunoId: true,
      },
      distinct: ["alunoId"],
    });

    const alunoIds = lancamentosAtrasados
      .map((item) => item.alunoId)
      .filter((id) => Number.isFinite(id));

    if (alunoIds.length > 0) {
      await prisma.aluno.updateMany({
        where: {
          instituicaoId,
          id: {
            in: alunoIds,
          },
        },
        data: {
          statusAluno: "INADIMPLENTE" as any,
        },
      });
    }
  }

  return config;
}


export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "FINANCEIRO" &&
        user.role !== "SECRETARIA")
    ) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

if (!podeUsarFinanceiroCompleto(user.plano || "ESSENCIAL")) {
  return NextResponse.json(
    { error: "Seu plano não permite acessar o financeiro completo." },
    { status: 403 }
  );
}

    await atualizarAtrasosEInadimplencia(user.instituicaoId);

    const { searchParams } = new URL(req.url);
    const busca = String(searchParams.get("busca") || "").trim().toLowerCase();
    const status = String(searchParams.get("status") || "").trim();
    const tipo = String(searchParams.get("tipo") || "").trim();
    const poloId = searchParams.get("poloId");

    const lancamentos = await prisma.lancamentoFinanceiro.findMany({
      where: {
  instituicaoId: user.instituicaoId,
  ...(status ? { status: status as any } : {}),
  ...(tipo ? { tipo: tipo as any } : {}),
  ...(poloId ? { poloId: Number(poloId) } : {}),
},
      include: {
  polo: true,
  aluno: {
          include: {
            user: true,
          },
        },
        pagamentos: {
          orderBy: {
            pagoEm: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const normalizados = lancamentos.map((item) => {
      const valorFinal = calcularValorFinal(
        Number(item.valorOriginal || 0),
        item.descontoValor,
        item.jurosValor,
        item.multaValor
      );

      return {
        ...item,
        valorFinal,
      };
    });

    const filtrados = !busca
      ? normalizados
      : normalizados.filter((item) => {
          const texto = [
            item.aluno?.nome,
            item.aluno?.user?.email,
            item.aluno?.matricula,
            item.descricao,
            item.tipo,
            item.status,
          ]
            .map((v) => String(v || "").toLowerCase())
            .join(" ");

          return texto.includes(busca);
        });

    return NextResponse.json(filtrados);
  } catch (e: any) {
    console.error("ERRO GET RECEBIMENTOS:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao listar recebimentos" },
      { status: 500 }
    );
  }
}

async function gerarDocumentosFinanceiros({
  tx,
  instituicaoId,
  aluno,
  matriculaId,
  valor,
  referencia,
}: any) {
  const config = await tx.configuracaoInstituicao.findUnique({
    where: { instituicaoId },
  });

  const valorFormatado = Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const data = new Date().toLocaleDateString("pt-BR");

  const texto = `
INSTITUIÇÃO: ${config?.nomeFantasia || "-"}
CNPJ: ${config?.cnpj || "-"}

ALUNO: ${aluno?.nome || "-"}
CPF: ${aluno?.cpf || "-"}

MATRÍCULA: ${aluno?.matricula || "-"}

VALOR: ${valorFormatado}
DATA: ${data}

`;

  await tx.documentoGerado.create({
    data: {
      titulo: `Recibo - ${aluno?.nome}`,
      tipo: "RECIBO",
      contexto: "FINANCEIRO",
      conteudo: texto + "\nRecibo de pagamento.",
      status: "GERADO",
      exigeAssinatura: false,
      instituicaoId,
      alunoId: aluno?.id,
      matriculaId,
    },
  });

  await tx.documentoGerado.create({
    data: {
      titulo: `Comprovante - ${aluno?.nome}`,
      tipo: "COMPROVANTE",
      contexto: "FINANCEIRO",
      conteudo: texto + "\nComprovante de pagamento.",
      status: "GERADO",
      exigeAssinatura: false,
      instituicaoId,
      alunoId: aluno?.id,
      matriculaId,
    },
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "FINANCEIRO" &&
        user.role !== "SECRETARIA")
    ) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

if (!podeUsarFinanceiroCompleto(user.plano || "ESSENCIAL")) {
  return NextResponse.json(
    { error: "Seu plano não permite acessar o financeiro completo." },
    { status: 403 }
  );
}

    const body = await req.json();

    const lancamentoId = Number(body?.lancamentoId);
    const valorPago = Number(body?.valorPago);
    const formaPagamento = String(body?.formaPagamento || "").trim();
    const observacao =
      body?.observacao !== undefined && body?.observacao !== null
        ? String(body.observacao).trim() || null
        : null;

    const descontoInformado = normalizarNumero(body?.descontoValor);
    const jurosInformado = normalizarNumero(body?.jurosValor);
    const multaInformada = normalizarNumero(body?.multaValor);

    if (!Number.isFinite(lancamentoId) || lancamentoId <= 0) {
      return NextResponse.json(
        { error: "Lançamento inválido" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(valorPago) || valorPago <= 0) {
      return NextResponse.json(
        { error: "Valor pago inválido" },
        { status: 400 }
      );
    }

    const formasPermitidas = [
      "DINHEIRO",
      "PIX",
      "CARTAO",
      "BOLETO",
      "TRANSFERENCIA",
      "OUTRO",
    ];

    if (!formasPermitidas.includes(formaPagamento)) {
      return NextResponse.json(
        { error: "Forma de pagamento inválida" },
        { status: 400 }
      );
    }

    const config = await buscarConfiguracaoFinanceira(user.instituicaoId);

    const lancamento = await prisma.lancamentoFinanceiro.findFirst({
      where: {
        id: lancamentoId,
        instituicaoId: user.instituicaoId,
      },
      include: {
        pagamentos: true,
        aluno: true,
      },
    });

    if (!lancamento) {
      return NextResponse.json(
        { error: "Lançamento não encontrado" },
        { status: 404 }
      );
    }

    if (lancamento.status === "CANCELADO") {
      return NextResponse.json(
        { error: "Lançamento cancelado não pode receber baixa" },
        { status: 400 }
      );
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = lancamento.vencimento ? new Date(lancamento.vencimento) : null;
    if (vencimento) vencimento.setHours(0, 0, 0, 0);

    const dataLimite = vencimento ? new Date(vencimento) : null;
    if (dataLimite) {
      dataLimite.setDate(dataLimite.getDate() + config.diasTolerancia);
    }

    const estaAtrasadoParaCalculo =
      !!dataLimite && hoje.getTime() > dataLimite.getTime();

    const descontoValor =
      descontoInformado !== null
        ? descontoInformado
        : Number(lancamento.descontoValor || 0);

    const jurosValor =
      jurosInformado !== null
        ? jurosInformado
        : estaAtrasadoParaCalculo
        ? Number(
            (
              (Number(lancamento.valorOriginal || 0) * config.jurosPadrao) /
              100
            ).toFixed(2)
          )
        : Number(lancamento.jurosValor || 0);

    const multaValor =
      multaInformada !== null
        ? multaInformada
        : estaAtrasadoParaCalculo
        ? Number(
            (
              (Number(lancamento.valorOriginal || 0) * config.multaPadrao) /
              100
            ).toFixed(2)
          )
        : Number(lancamento.multaValor || 0);

    const valorFinal = calcularValorFinal(
      Number(lancamento.valorOriginal || 0),
      descontoValor,
      jurosValor,
      multaValor
    );

    const totalJaPago = Number(
  lancamento.pagamentos
    .reduce((acc, pag) => acc + Number(pag.valorPago || 0), 0)
    .toFixed(2)
);

if (lancamento.status === "PAGO" || totalJaPago >= valorFinal) {
  return NextResponse.json(
    { error: "Este lançamento já está totalmente pago." },
    { status: 400 }
  );
}

const saldoAntesDoPagamento = Number((valorFinal - totalJaPago).toFixed(2));

if (saldoAntesDoPagamento <= 0) {
  return NextResponse.json(
    { error: "Este lançamento não possui saldo pendente." },
    { status: 400 }
  );
}

if (valorPago > saldoAntesDoPagamento) {
  return NextResponse.json(
    {
      error: `O valor informado excede o saldo pendente deste lançamento. Saldo atual: R$ ${saldoAntesDoPagamento.toFixed(
        2
      )}`,
    },
    { status: 400 }
  );
}

const novoTotalPago = Number((totalJaPago + valorPago).toFixed(2));
const saldoRestante = Number((valorFinal - novoTotalPago).toFixed(2));

if (!config.permitirPagamentoParcial && valorPago < saldoAntesDoPagamento) {
  return NextResponse.json(
    {
      error:
        "Esta instituição não permite pagamento parcial. Informe o valor total em aberto.",
    },
    { status: 400 }
  );
}

let novoStatus: "PENDENTE" | "PARCIAL" | "PAGO" = "PENDENTE";

if (novoTotalPago >= valorFinal) {
  novoStatus = "PAGO";
} else if (novoTotalPago > 0) {
  novoStatus = "PARCIAL";
}

    const caixaAberto = await prisma.caixa.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        status: "ABERTO",
        abertoPorId: user.id,
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.pagamento.create({
        data: {
          valorPago,
          formaPagamento: formaPagamento as any,
          observacao,
          instituicaoId: user.instituicaoId,
          alunoId: lancamento.alunoId,
          lancamentoId: lancamento.id,
        },
      });

      await tx.lancamentoFinanceiro.update({
        where: {
          id: lancamento.id,
        },
        data: {
          descontoValor,
          jurosValor,
          multaValor,
          valorFinal,
          valorPago: novoTotalPago,
          pagoEm: novoStatus === "PAGO" ? new Date() : lancamento.pagoEm,
          status: novoStatus,
          observacao: lancamento.observacao,
        },
      });

      if (caixaAberto) {
        await tx.movimentoCaixa.create({
          data: {
            instituicaoId: user.instituicaoId,
            caixaId: caixaAberto.id,
            tipo: "ENTRADA",
            descricao: `Pagamento - ${lancamento.tipo}`,
            valor: valorPago,
            formaPagamento: formaPagamento as any,
            alunoId: lancamento.alunoId,
            lancamentoId: lancamento.id,
          },
        });

        await tx.caixa.update({
          where: { id: caixaAberto.id },
          data: {
            saldoSistema: {
              increment: valorPago,
            },
          },
        });
      }

            await tx.historicoCobranca.create({
        data: {
          instituicaoId: user.instituicaoId,
          alunoId: lancamento.alunoId,
          alunoNome: lancamento.aluno?.nome || null,
          lancamentoFinanceiroId: lancamento.id,
          responsavelId: Number(user.id) || null,
          responsavelNome: (user as any)?.nome || user.email || "Usuário",
          canal: "SISTEMA",
          acao:
            novoStatus === "PAGO"
              ? "PAGAMENTO_REGISTRADO"
              : "PAGAMENTO_PARCIAL",
          observacao:
            observacao ||
            `Pagamento registrado via ${formaPagamento}. Saldo restante: R$ ${Math.max(
              0,
              saldoRestante
            ).toFixed(2)}`,
          metadata: {
            formaPagamento,
            valorPago,
            descontoValor,
            jurosValor,
            multaValor,
            valorFinal,
            novoTotalPago,
            saldoRestante,
            statusFinal: novoStatus,
          },
        },
      });

      await gerarDocumentosFinanceiros({
        tx,
        instituicaoId: user.instituicaoId,
        aluno: lancamento.aluno,
        matriculaId: lancamento.matriculaId,
        valor: valorPago,
        referencia: lancamento.descricao || lancamento.tipo,
      });
    });

    const atualizado = await prisma.lancamentoFinanceiro.findUnique({
      where: {
        id: lancamento.id,
      },
      include: {
  polo: true,
  aluno: {
          include: {
            user: true,
          },
        },
        pagamentos: {
          orderBy: {
            pagoEm: "desc",
          },
        },
      },
    });

    return NextResponse.json(atualizado);
  } catch (e: any) {
    console.error("ERRO PATCH RECEBIMENTOS:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao dar baixa no recebimento" },
      { status: 500 }
    );
  }
}