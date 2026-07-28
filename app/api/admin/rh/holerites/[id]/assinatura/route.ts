import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { StatusPagamentoHoleriteRH } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function usuarioPodeSolicitarAssinatura(user: any) {
  const role = String(user?.role || "").toUpperCase();

  return (
    role === "ADMIN" || role === "SUPER_ADMIN" || user?.isMasterAdmin === true
  );
}

function calcularHashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

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

    if (!usuarioPodeSolicitarAssinatura(user)) {
      return NextResponse.json(
        {
          error:
            "Você não possui autorização para solicitar a assinatura deste recibo.",
        },
        {
          status: 403,
        },
      );
    }

    const instituicaoId = Number(user.instituicaoId);
    const solicitadoPorId = Number(user.id);
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
        status: true,
        arquivado: true,
        cancelado: true,

        funcionario: {
          select: {
            id: true,
            nome: true,
            userId: true,

            user: {
              select: {
                id: true,
                nome: true,
                email: true,
                ativo: true,
              },
            },
          },
        },

        pagamentos: {
          where: {
            status: StatusPagamentoHoleriteRH.REGISTRADO,
          },

          orderBy: {
            registradoEm: "desc",
          },

          take: 1,

          select: {
            id: true,
            reciboNumero: true,
            status: true,
            confirmadoPeloFuncionarioEm: true,
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
            "Não é possível solicitar assinatura de um holerite arquivado ou cancelado.",
        },
        {
          status: 400,
        },
      );
    }

    const pagamento = holerite.pagamentos[0];

    if (!pagamento) {
      return NextResponse.json(
        {
          error: "Gere primeiro o recibo de pagamento deste holerite.",
        },
        {
          status: 409,
        },
      );
    }

    if (pagamento.confirmadoPeloFuncionarioEm) {
      return NextResponse.json(
        {
          error: "Este recibo já foi confirmado pelo funcionário.",
        },
        {
          status: 409,
        },
      );
    }

    if (!holerite.funcionario.user?.ativo) {
      return NextResponse.json(
        {
          error:
            "O funcionário não possui um usuário ativo para receber a solicitação de assinatura.",
        },
        {
          status: 400,
        },
      );
    }

    const agora = new Date();

    const token = randomBytes(32).toString("base64url");

    const tokenAssinaturaHash = calcularHashToken(token);

    const tokenAssinaturaExpiraEm = new Date(
      agora.getTime() + 7 * 24 * 60 * 60 * 1000,
    );

    await prisma.$transaction(
      async (tx) => {
        await tx.pagamentoHoleriteRH.update({
          where: {
            id: pagamento.id,
          },

          data: {
            tokenAssinaturaHash,
            tokenAssinaturaExpiraEm,
            assinaturaSolicitadaEm: agora,
          },
        });

        await tx.holeriteRH.update({
          where: {
            id: holerite.id,
          },

          data: {
            status: "AGUARDANDO_ASSINATURA",
          },
        });

        await tx.historicoRH.create({
          data: {
            funcionarioId: holerite.funcionarioId,

            instituicaoId,
            criadoPorId: solicitadoPorId,

            tipo: "ASSINATURA_RECIBO_HOLERITE_SOLICITADA",

            titulo: "Assinatura do recibo solicitada",

            descricao:
              `Foi gerado um link de assinatura para o recibo ` +
              `${pagamento.reciboNumero}, referente à competência ` +
              `${String(holerite.competenciaMes).padStart(2, "0")}/` +
              `${holerite.competenciaAno}.`,

            dataEvento: agora,

            observacoes: [
              `Pagamento ID: ${pagamento.id}`,
              `Holerite ID: ${holerite.id}`,
              `Funcionário: ${holerite.funcionario.nome}`,
              `Usuário do funcionário: ${holerite.funcionario.user.id}`,
              `E-mail: ${holerite.funcionario.user.email}`,
              `Link válido até: ${tokenAssinaturaExpiraEm.toISOString()}`,
              "Um novo link invalida automaticamente o link anterior.",
            ].join("\n"),
          },
        });
      },
      {
        maxWait: 10_000,
        timeout: 30_000,
      },
    );

    const caminhoAssinatura = `/assinatura-rh/${encodeURIComponent(token)}`;

    const urlAssinatura = new URL(caminhoAssinatura, req.url).toString();

    return NextResponse.json({
      message: "Link seguro de assinatura gerado com sucesso.",

      pagamentoId: pagamento.id,
      reciboNumero: pagamento.reciboNumero,

      funcionario: {
        id: holerite.funcionario.id,
        nome: holerite.funcionario.nome,
        email: holerite.funcionario.user.email,
      },

      urlAssinatura,
      caminhoAssinatura,
      expiraEm: tokenAssinaturaExpiraEm,
    });
  } catch (error: any) {
    console.error("Erro ao gerar link de assinatura do recibo:", error);

    return NextResponse.json(
      {
        error: error?.message || "Erro ao gerar o link de assinatura.",
      },
      {
        status: 500,
      },
    );
  }
}