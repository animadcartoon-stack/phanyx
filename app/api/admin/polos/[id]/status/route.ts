import { NextRequest, NextResponse } from "next/server";
import { StatusComercialPolo } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";

type AcaoStatusPolo =
  | "SUSPENDER"
  | "REATIVAR"
  | "ENCERRAR";

function normalizarAcao(
  valor: unknown
): AcaoStatusPolo | null {
  const acao = String(valor ?? "")
    .trim()
    .toUpperCase();

  if (
    acao === "SUSPENDER" ||
    acao === "REATIVAR" ||
    acao === "ENCERRAR"
  ) {
    return acao;
  }

  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        {
          error:
            "Sem permissão para alterar o status do polo.",
        },
        { status: 403 }
      );
    }

    const usuarioId = Number(user.id);
    const poloId = Number(params.id);

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0
    ) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      );
    }

    if (
      !Number.isInteger(poloId) ||
      poloId <= 0
    ) {
      return NextResponse.json(
        { error: "Polo inválido" },
        { status: 400 }
      );
    }

    const body = (await req.json()) as Record<
      string,
      unknown
    >;

    const acao = normalizarAcao(body.acao);
    const motivo = String(body.motivo ?? "").trim();

    if (!acao) {
      return NextResponse.json(
        {
          error:
            "Informe uma ação válida: suspender, reativar ou encerrar.",
        },
        { status: 400 }
      );
    }

    if (
      (acao === "SUSPENDER" ||
        acao === "ENCERRAR") &&
      motivo.length < 5
    ) {
      return NextResponse.json(
        {
          error:
            "Informe um motivo com pelo menos 5 caracteres.",
        },
        { status: 400 }
      );
    }

    const polo = await prisma.polo.findFirst({
      where: {
        id: poloId,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        codigo: true,
        ativo: true,
        statusComercial: true,
        instituicaoId: true,
        instituicaoGeradaId: true,
      },
    });

    if (!polo) {
      return NextResponse.json(
        { error: "Polo não encontrado" },
        { status: 404 }
      );
    }

    const unidadeContratante =
      String(polo.codigo || "")
        .trim()
        .toUpperCase() === "SEDE" &&
      !polo.instituicaoGeradaId;

    if (unidadeContratante) {
      return NextResponse.json(
        {
          error:
            "A unidade contratante não pode ser suspensa ou encerrada por esta tela.",
        },
        { status: 409 }
      );
    }

    if (
      polo.statusComercial ===
        StatusComercialPolo.ENCERRADO &&
      acao !== "ENCERRAR"
    ) {
      return NextResponse.json(
        {
          error:
            "Este polo foi encerrado definitivamente e não pode ser reativado.",
        },
        { status: 409 }
      );
    }

    if (
      acao === "SUSPENDER" &&
      polo.statusComercial ===
        StatusComercialPolo.SUSPENSO
    ) {
      return NextResponse.json(
        {
          error: "Este polo já está suspenso.",
        },
        { status: 409 }
      );
    }

    if (
      acao === "REATIVAR" &&
      polo.statusComercial !==
        StatusComercialPolo.SUSPENSO
    ) {
      return NextResponse.json(
        {
          error:
            "Somente polos suspensos podem ser reativados.",
        },
        { status: 409 }
      );
    }

    if (
      acao === "ENCERRAR" &&
      polo.statusComercial ===
        StatusComercialPolo.ENCERRADO
    ) {
      return NextResponse.json(
        {
          error: "Este polo já está encerrado.",
        },
        { status: 409 }
      );
    }

    const agora = new Date();

    const poloAtualizado =
      await prisma.$transaction(async (tx) => {
        let atualizado;

        if (acao === "SUSPENDER") {
          atualizado = await tx.polo.update({
            where: {
              id: polo.id,
            },
            data: {
              ativo: false,
              statusComercial:
                StatusComercialPolo.SUSPENSO,
              suspensoEm: agora,
              suspensoPorId: usuarioId,
            },
          });
        } else if (acao === "REATIVAR") {
          atualizado = await tx.polo.update({
            where: {
              id: polo.id,
            },
            data: {
              ativo: true,
              statusComercial:
                StatusComercialPolo.ATIVO,
              ativadoEm: agora,
              ativadoPorId: usuarioId,
              suspensoEm: null,
              suspensoPorId: null,
            },
          });
        } else {
          atualizado = await tx.polo.update({
            where: {
              id: polo.id,
            },
            data: {
              ativo: false,
              statusComercial:
                StatusComercialPolo.ENCERRADO,
              encerradoEm: agora,
              encerradoPorId: usuarioId,
            },
          });
        }

        if (polo.instituicaoGeradaId) {
          await tx.instituicao.update({
            where: {
              id: polo.instituicaoGeradaId,
            },
            data: {
              ativo: acao === "REATIVAR",
              updatedAt: agora,
            },
          });
        }

        return atualizado;
      });

    /*
     * O motivo não é gravado em texto livre no polo porque
     * o model atual ainda não possui um campo específico.
     *
     * Por enquanto, ele fica registrado no log do servidor,
     * juntamente com o usuário, a ação e o horário.
     */
    console.info("Status de polo alterado:", {
      poloId: polo.id,
      poloNome: polo.nome,
      instituicaoContratanteId:
        polo.instituicaoId,
      instituicaoGeradaId:
        polo.instituicaoGeradaId,
      acao,
      motivo:
        motivo || "Reativação do polo",
      alteradoPorId: usuarioId,
      alteradoEm: agora.toISOString(),
    });

    const mensagens: Record<
      AcaoStatusPolo,
      string
    > = {
      SUSPENDER:
        "Polo suspenso com sucesso. O acesso da unidade foi bloqueado.",
      REATIVAR:
        "Polo reativado com sucesso. O acesso da unidade foi liberado novamente.",
      ENCERRAR:
        "Polo encerrado com sucesso. Os dados foram preservados para histórico.",
    };

    return NextResponse.json({
      sucesso: true,
      mensagem: mensagens[acao],
      acao,
      polo: poloAtualizado,
      instituicaoGeradaId:
        polo.instituicaoGeradaId,
    });
  } catch (error) {
    console.error(
      "Erro ao alterar status do polo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível alterar o status do polo.",
      },
      { status: 500 }
    );
  }
}