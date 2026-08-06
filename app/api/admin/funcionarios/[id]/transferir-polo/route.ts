import {
  TipoMovimentacaoLotacaoRH,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import {
  obterPoloAtivoVisivelParaInstituicao,
} from "@/lib/polos-rede";

export const runtime = "nodejs";

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function numeroInteiroPositivo(
  valor: unknown
) {
  const numero = Number(valor);

  return Number.isInteger(numero) &&
    numero > 0
    ? numero
    : null;
}

export async function POST(
  req: NextRequest,
  context: {
    params: {
      id: string;
    };
  }
) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error: "Não autenticado.",
        },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        {
          error: "Sem permissão.",
        },
        { status: 403 }
      );
    }

    const instituicaoId =
      Number(user.instituicaoId);

    if (
      !Number.isInteger(instituicaoId) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Usuário sem instituição válida.",
        },
        { status: 400 }
      );
    }

    const funcionarioId =
      Number(context.params.id);

    if (
      !Number.isInteger(funcionarioId) ||
      funcionarioId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Funcionário inválido.",
        },
        { status: 400 }
      );
    }

    const body =
      await req.json();

    const poloNovoId =
      numeroInteiroPositivo(
        body.poloId
      );

    if (!poloNovoId) {
      return NextResponse.json(
        {
          error:
            "Selecione o novo polo.",
        },
        { status: 400 }
      );
    }

    const funcionario =
      await prisma.funcionario.findFirst({
        where: {
          id: funcionarioId,
          instituicaoId,
        },
        select: {
          id: true,
          nome: true,
          instituicaoId: true,
          poloId: true,
          departamentoId: true,
          cargo: true,
          setor: true,

          polo: {
            select: {
              id: true,
              nome: true,
            },
          },

          departamento: {
            select: {
              id: true,
              nome: true,
            },
          },

          professor: {
            select: {
              id: true,
              poloId: true,
            },
          },
        },
      });

    if (!funcionario) {
      return NextResponse.json(
        {
          error:
            "Funcionário não encontrado.",
        },
        { status: 404 }
      );
    }

    const poloNovo =
      await obterPoloAtivoVisivelParaInstituicao(
        instituicaoId,
        poloNovoId
      );

    if (!poloNovo) {
      return NextResponse.json(
        {
          error:
            "O polo selecionado não está disponível para esta instituição.",
        },
        { status: 400 }
      );
    }

    if (
      funcionario.poloId ===
      poloNovo.id
    ) {
      return NextResponse.json(
        {
          error:
            "O funcionário já está lotado neste polo.",
        },
        { status: 409 }
      );
    }

    const tipoMovimentacao =
      funcionario.poloId
        ? TipoMovimentacaoLotacaoRH
            .TRANSFERENCIA
        : TipoMovimentacaoLotacaoRH
            .LOTACAO_INICIAL;

    const motivo =
      limparTexto(body.motivo);

    if (
      tipoMovimentacao ===
        TipoMovimentacaoLotacaoRH
          .TRANSFERENCIA &&
      !motivo
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o motivo da transferência.",
        },
        { status: 400 }
      );
    }

    const vigenciaTexto =
      limparTexto(body.vigenciaEm);

    const vigenciaEm =
      vigenciaTexto
        ? new Date(vigenciaTexto)
        : new Date();

    if (
      Number.isNaN(
        vigenciaEm.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A data de vigência é inválida.",
        },
        { status: 400 }
      );
    }

    const usuarioResponsavel =
      await prisma.user.findUnique({
        where: {
          id: user.id,
        },
        select: {
          nome: true,
          email: true,
          role: true,
        },
      });

    const nomeResponsavel =
      limparTexto(
        usuarioResponsavel?.nome
      ) ||
      limparTexto(
        usuarioResponsavel?.email
      ) ||
      `Usuário ${user.id}`;

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const atualizado =
            await tx.funcionario.update({
              where: {
                id: funcionario.id,
              },
              data: {
                poloId: poloNovo.id,
              },
              include: {
                polo: true,
                departamento: true,
                professor: true,
              },
            });

          /*
           * Professor e funcionário representam
           * a mesma pessoa. A lotação deve ficar
           * sincronizada nos dois cadastros.
           */
          if (
            funcionario.professor?.id
          ) {
            await tx.professor.update({
              where: {
                id:
                  funcionario.professor.id,
              },
              data: {
                poloId: poloNovo.id,
              },
            });
          }

          await tx.funcionarioLotacaoRH.create({
            data: {
              funcionarioId:
                funcionario.id,

              instituicaoId:
                funcionario.instituicaoId,

              tipo:
                tipoMovimentacao,

              poloAnteriorId:
                funcionario.poloId,

              poloNovoId:
                poloNovo.id,

              departamentoAnteriorId:
                funcionario.departamentoId,

              departamentoNovoId:
                funcionario.departamentoId,

              cargoAnteriorSnapshot:
                funcionario.cargo,

              cargoNovoSnapshot:
                funcionario.cargo,

              setorAnteriorSnapshot:
                funcionario.setor,

              setorNovoSnapshot:
                funcionario.setor,

              poloAnteriorNomeSnapshot:
                funcionario.polo?.nome ??
                null,

              poloNovoNomeSnapshot:
                poloNovo.nome,

              departamentoAnteriorNomeSnapshot:
                funcionario.departamento
                  ?.nome ?? null,

              departamentoNovoNomeSnapshot:
                funcionario.departamento
                  ?.nome ?? null,

              vigenciaEm,

              motivo:
                motivo ||
                "Definição da lotação inicial do funcionário.",

              observacoes:
                limparTexto(
                  body.observacoes
                ) || null,

              realizadoPorId:
                user.id,

              realizadoPorNomeSnapshot:
                nomeResponsavel,

              realizadoPorRoleSnapshot:
                limparTexto(
                  usuarioResponsavel?.role
                ) ||
                limparTexto(user.role) ||
                null,
            },
          });

          return atualizado;
        }
      );

    return NextResponse.json({
      sucesso: true,

      message:
        tipoMovimentacao ===
        TipoMovimentacaoLotacaoRH
          .TRANSFERENCIA
          ? "Funcionário transferido de polo com sucesso."
          : "Lotação inicial definida com sucesso.",

      funcionario: resultado,
    });
  } catch (error) {
    console.error(
      "ERRO AO TRANSFERIR FUNCIONÁRIO DE POLO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao transferir funcionário de polo.",
      },
      { status: 500 }
    );
  }
}