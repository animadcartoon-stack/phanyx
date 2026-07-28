import { createHash } from "crypto";
import { NextResponse } from "next/server";
import {
  FormaPagamentoHoleriteRH,
  StatusPagamentoHoleriteRH,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function calcularHashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function mascararCpf(cpf?: string | null) {
  const numeros = String(cpf || "").replace(/\D/g, "");

  if (numeros.length !== 11) {
    return "";
  }

  return `***.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-**`;
}

function nomeFormaPagamento(forma: FormaPagamentoHoleriteRH) {
  const nomes: Record<FormaPagamentoHoleriteRH, string> = {
    FOLHA_BANCARIA: "Folha bancária",
    PIX: "PIX",
    TRANSFERENCIA: "Transferência bancária",
    CONTA_SALARIO: "Conta-salário",
    DINHEIRO: "Dinheiro",
    CHEQUE: "Cheque",
    OUTRO: "Outro",
  };

  return nomes[forma] || forma;
}

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: {
      token: string;
    };
  },
) {
  try {
    const token = String(params.token || "").trim();

    if (!token || token.length < 20 || token.length > 200) {
      return NextResponse.json(
        {
          error: "Link de assinatura inválido ou expirado.",
        },
        {
          status: 400,
        },
      );
    }

    const tokenAssinaturaHash = calcularHashToken(token);

    const pagamento = await prisma.pagamentoHoleriteRH.findFirst({
      where: {
        tokenAssinaturaHash,
      },

      include: {
        instituicao: {
          select: {
            id: true,
            nome: true,

            configuracaoInstituicao: {
              select: {
                razaoSocial: true,
                nomeFantasia: true,
                cnpj: true,
                logoUrl: true,
              },
            },
          },
        },

        funcionario: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            cargo: true,
            setor: true,
            codigoFuncionario: true,
          },
        },

        holerite: {
          select: {
            id: true,
            competenciaMes: true,
            competenciaAno: true,
            salarioBase: true,
            totalVencimentos: true,
            totalDescontos: true,
            valorLiquido: true,
            status: true,

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
        },

        registradoPor: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!pagamento) {
      return NextResponse.json(
        {
          error: "Link de assinatura inválido ou expirado.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      [
        StatusPagamentoHoleriteRH.CANCELADO,
        StatusPagamentoHoleriteRH.SUBSTITUIDO,
      ].includes(pagamento.status)
    ) {
      return NextResponse.json(
        {
          error: "Este recibo não está mais disponível para assinatura.",
        },
        {
          status: 410,
        },
      );
    }

    const agora = new Date();

    const expirado =
      !pagamento.tokenAssinaturaExpiraEm ||
      pagamento.tokenAssinaturaExpiraEm.getTime() < agora.getTime();

    const confirmado =
      pagamento.status === StatusPagamentoHoleriteRH.CONFIRMADO_FUNCIONARIO ||
      Boolean(pagamento.confirmadoPeloFuncionarioEm);

    const contestado =
      pagamento.status === StatusPagamentoHoleriteRH.CONTESTADO;

    if (expirado && !confirmado && !contestado) {
      return NextResponse.json(
        {
          error:
            "Este link de assinatura expirou. Solicite um novo link ao RH.",
          expirado: true,
        },
        {
          status: 410,
        },
      );
    }

    const configuracao = pagamento.instituicao.configuracaoInstituicao;

    const nomeInstituicao =
      configuracao?.razaoSocial ||
      configuracao?.nomeFantasia ||
      pagamento.instituicao.nome;

    const competencia = `${String(pagamento.holerite.competenciaMes).padStart(
      2,
      "0",
    )}/${pagamento.holerite.competenciaAno}`;

    return NextResponse.json(
      {
        tipoDocumento: "RECIBO_PAGAMENTO_HOLERITE",

        pagamentoId: pagamento.id,
        holeriteId: pagamento.holeriteId,
        reciboNumero: pagamento.reciboNumero,

        status: pagamento.status,

        podeAssinar:
          pagamento.status === StatusPagamentoHoleriteRH.REGISTRADO &&
          !expirado &&
          !pagamento.confirmadoPeloFuncionarioEm,

        podeContestar:
          pagamento.status === StatusPagamentoHoleriteRH.REGISTRADO &&
          !expirado,

        expirado,
        confirmado,
        contestado,

        solicitadoEm: pagamento.assinaturaSolicitadaEm,

        expiraEm: pagamento.tokenAssinaturaExpiraEm,

        confirmadoEm: pagamento.confirmadoPeloFuncionarioEm,

        tipoAssinatura: pagamento.tipoAssinatura,

        instituicao: {
          id: pagamento.instituicao.id,
          nome: nomeInstituicao,

          nomeFantasia:
            configuracao?.nomeFantasia || pagamento.instituicao.nome,

          cnpj: configuracao?.cnpj || null,

          logoUrl: configuracao?.logoUrl || null,
        },

        funcionario: {
          id: pagamento.funcionario.id,
          nome: pagamento.funcionarioNomeSnapshot || pagamento.funcionario.nome,

          cpfMascarado: mascararCpf(
            pagamento.funcionarioCpfSnapshot || pagamento.funcionario.cpf,
          ),

          cargo: pagamento.funcionario.cargo || null,

          setor: pagamento.funcionario.setor || null,

          codigo: pagamento.funcionario.codigoFuncionario || null,
        },

        holerite: {
          id: pagamento.holerite.id,
          competencia,

          competenciaMes: pagamento.holerite.competenciaMes,

          competenciaAno: pagamento.holerite.competenciaAno,

          salarioBase: Number(pagamento.holerite.salarioBase || 0),

          totalVencimentos: Number(pagamento.holerite.totalVencimentos || 0),

          totalDescontos: Number(pagamento.holerite.totalDescontos || 0),

          valorLiquido: Number(pagamento.holerite.valorLiquido || 0),

          eventos: pagamento.holerite.eventos.map((evento) => ({
            id: evento.id,
            codigo: evento.codigo || null,

            descricao: evento.descricao,

            referencia: evento.referencia || null,

            tipo: evento.tipo,

            valor: Number(evento.valor || 0),
          })),
        },

        pagamento: {
          formaPagamento: pagamento.formaPagamento,

          formaPagamentoNome: nomeFormaPagamento(pagamento.formaPagamento),

          valorPago: Number(pagamento.valorPago || 0),

          pagoEm: pagamento.pagoEm,

          identificadorTransacao: pagamento.identificadorTransacao || null,

          bancoOrigem: pagamento.bancoOrigem || null,

          contaDestinoMascarada: pagamento.contaDestinoMascarada || null,

          observacoes: pagamento.observacoes || null,
        },

        registradoPor: pagamento.registradoPor
          ? {
              id: pagamento.registradoPor.id,

              nome: pagamento.registradoPor.nome,
            }
          : null,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",

          "X-Robots-Tag": "noindex, nofollow, noarchive",

          "Referrer-Policy": "no-referrer",
        },
      },
    );
  } catch (error: any) {
    console.error("Erro ao carregar recibo para assinatura:", error);

    return NextResponse.json(
      {
        error: error?.message || "Erro ao carregar o recibo de pagamento.",
      },
      {
        status: 500,
      },
    );
  }
}
