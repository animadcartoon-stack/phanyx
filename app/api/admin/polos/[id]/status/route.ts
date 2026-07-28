import { NextRequest, NextResponse } from "next/server";
import { StatusComercialPolo } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import {
  filtroPoloGerenciavel,
  obterContextoGestaoPolos,
} from "@/lib/polos-rede";
import { recalcularAssinaturaPhanyx } from "@/lib/recalcular-assinatura-phanyx";

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

    const contexto = await obterContextoGestaoPolos(
      user.instituicaoId
    );

    if (!contexto) {
      return NextResponse.json(
        { error: "Instituição não encontrada" },
        { status: 404 }
      );
    }

    if (!contexto.podeGerenciarPolos) {
      return NextResponse.json(
        {
          error:
            "A gestão de polos não está habilitada para esta unidade. Essa permissão é controlada pela instituição contratante.",
        },
        { status: 403 }
      );
    }

    const body = (await req
      .json()
      .catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const acao = normalizarAcao(body.acao);
    const motivo = String(
      body.motivo ?? ""
    ).trim();

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

    const polo =
      await prisma.polo.findFirst({
        where: filtroPoloGerenciavel(
          contexto,
          poloId
        ),
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
        {
          error:
            "Polo não encontrado ou fora do escopo de gestão desta unidade.",
        },
        { status: 404 }
      );
    }

    const unidadeContratante =
      contexto.ehInstituicaoContratante &&
      polo.instituicaoId ===
        contexto.instituicaoContratanteId &&
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
              suspensoEm: null,
              suspensoPorId: null,
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

      podeCriarGerenciarPolos:
        acao === "ENCERRAR"
          ? false
          : undefined,

      updatedAt: agora,
    },
  });
}

        return atualizado;
      });

    let recalculoAssinatura:
      | Awaited<
          ReturnType<
            typeof recalcularAssinaturaPhanyx
          >
        >
      | null = null;

    let avisoCobranca: string | null =
      null;

    try {
      recalculoAssinatura =
        await recalcularAssinaturaPhanyx(
          contexto.instituicaoContratanteId,
          {
            sincronizarAsaas: true,
            atualizarCobrancasPendentes:
              false,
            motivo:
              acao === "SUSPENDER"
                ? `Suspensão da unidade ${polo.nome}`
                : acao === "REATIVAR"
                  ? `Reativação da unidade ${polo.nome}`
                  : `Encerramento da unidade ${polo.nome}`,
          }
        );
    } catch (erroRecalculo) {
      console.error(
        "O status foi alterado, mas houve erro ao recalcular a assinatura:",
        erroRecalculo
      );

      avisoCobranca =
        "O status do polo foi alterado, mas a assinatura não pôde ser recalculada automaticamente.";
    }

    console.info("Status de polo alterado:", {
      poloId: polo.id,
      poloNome: polo.nome,
      instituicaoCriadoraId:
        polo.instituicaoId,
      instituicaoContratanteId:
        contexto.instituicaoContratanteId,
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
      cobranca: recalculoAssinatura,
      aviso: avisoCobranca,
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