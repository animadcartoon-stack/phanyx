import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  temAlgumaPermissao,
} from "@/lib/server-auth";
import { planoTemRecurso } from "@/lib/plano-acesso";
import { enviarEmailBoletoInstitucional } from "@/lib/email";

export const dynamic = "force-dynamic";

function podeEnviarBoleto(
  usuario: Awaited<ReturnType<typeof getUserFromToken>>
) {
  if (!usuario) return false;
  if (usuario.isMasterAdmin) return true;

  if (
    [
      "ADMIN",
      "GERENCIA",
      "SUPER_ADMIN",
      "FINANCEIRO",
      "SECRETARIA",
    ].includes(usuario.role)
  ) {
    return true;
  }

  return temAlgumaPermissao(usuario, [
    "financeiro.ver",
    "financeiro.recebimentos",
    "caixa.receber",
  ]);
}

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const usuario = await getUserFromToken();

    if (
      !usuario ||
      !usuario.instituicaoId ||
      !podeEnviarBoleto(usuario)
    ) {
      return NextResponse.json(
        { error: "NAO_AUTORIZADO" },
        { status: 401 }
      );
    }

    if (
      !planoTemRecurso(
        usuario.plano || "ESSENCIAL",
        "FINANCEIRO"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Seu plano não permite acessar o financeiro.",
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const cobrancaId = Number(id);

    if (
      !Number.isInteger(cobrancaId) ||
      cobrancaId <= 0
    ) {
      return NextResponse.json(
        { error: "Cobrança inválida." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const canal = String(
      body?.canal || ""
    )
      .trim()
      .toUpperCase();

    const locale = String(
      body?.locale || "pt-BR"
    ).trim();

    if (!["EMAIL", "WHATSAPP"].includes(canal)) {
      return NextResponse.json(
        { error: "Canal de envio inválido." },
        { status: 400 }
      );
    }

    const instituicaoId =
      Number(usuario.instituicaoId);

    const cobranca =
      await prisma.cobrancaFinanceira.findFirst({
        where: {
          id: cobrancaId,
          instituicaoId,
        },

        include: {
          aluno: {
            select: {
              nome: true,
              user: {
                select: {
                  email: true,
                },
              },
            },
          },

          lancamentoFinanceiro: {
            select: {
              descricao: true,
            },
          },

          contaFinanceira: {
            select: {
              moeda: true,
            },
          },
        },
      });

    if (!cobranca) {
      return NextResponse.json(
        { error: "Cobrança não encontrada." },
        { status: 404 }
      );
    }

    if (
      cobranca.statusOperacional === "CANCELADO" ||
      cobranca.statusBancario === "CANCELADO"
    ) {
      return NextResponse.json(
        {
          error:
            "Boleto cancelado não pode ser enviado.",
        },
        { status: 409 }
      );
    }

    if (
      !cobranca.boletoUrl &&
      !cobranca.invoiceUrl &&
      !cobranca.linhaDigitavel
    ) {
      return NextResponse.json(
        {
          error:
            "Este boleto ainda não possui documento ou linha digitável disponível.",
        },
        { status: 409 }
      );
    }

    if (canal === "EMAIL") {
      const email =
        cobranca.aluno.user?.email || null;

      if (!email) {
        return NextResponse.json(
          {
            error:
              "O aluno não possui e-mail cadastrado.",
          },
          { status: 409 }
        );
      }

      await enviarEmailBoletoInstitucional({
        instituicaoId,
        email,
        nome: cobranca.aluno.nome,
        descricao:
          cobranca.lancamentoFinanceiro.descricao ||
          "Mensalidade",
        valor: Number(cobranca.valorCobrado),
        moeda:
          cobranca.contaFinanceira.moeda ||
          "BRL",
        vencimento: cobranca.vencimento,
        boletoUrl:
          cobranca.boletoUrl ||
          cobranca.invoiceUrl ||
          null,
        linhaDigitavel:
          cobranca.linhaDigitavel,
        locale,
      });
    }

    const agora = new Date();

    const nomeOperador =
      usuario.nome ||
      usuario.email ||
      "Usuário";

    const atualizada =
      await prisma.cobrancaFinanceira.update({
        where: {
          id_instituicaoId: {
            id: cobranca.id,
            instituicaoId,
          },
        },

        data: {
          ultimoEnvioEm: agora,
          ultimoEnvioCanal: canal,
          ultimoEnvioPorUsuarioId:
            usuario.id,
          ultimoEnvioPorNomeSnapshot:
            nomeOperador,
          quantidadeEnvios: {
            increment: 1,
          },
        },

        select: {
          id: true,
          ultimoEnvioEm: true,
          ultimoEnvioCanal: true,
          ultimoEnvioPorUsuarioId: true,
          ultimoEnvioPorNomeSnapshot: true,
          quantidadeEnvios: true,
        },
      });

    return NextResponse.json({
      message:
        canal === "EMAIL"
          ? "Boleto enviado por e-mail."
          : "Envio por WhatsApp registrado.",
      cobranca: atualizada,
    });
  } catch (error) {
    console.error(
      "Erro ao enviar boleto:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível enviar o boleto. Verifique a configuração de e-mail da instituição e tente novamente.",
        codigo:
          "ERRO_ENVIO_BOLETO",
      },
      { status: 500 }
    );
  }
}
