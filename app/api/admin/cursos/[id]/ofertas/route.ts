import { NextResponse } from "next/server";
import {
  StatusComercialPolo,
  StatusPublicacaoCursoRede,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import {
  filtroPolosVisiveis,
  obterContextoGestaoPolos,
} from "@/lib/polos-rede";
import { publicarCursoParaUnidadesIndependentes } from "@/lib/publicacao-cursos-rede";

function podeGerenciarCurso(role?: string) {
  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

function normalizarPoloIds(
  valor: unknown
): number[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .map((id) => Number(id))
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    )
  );
}

export async function PUT(
  req: Request,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      !podeGerenciarCurso(user.role)
    ) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const cursoId = Number(params.id);
    const instituicaoId = Number(
      user.instituicaoId
    );
    const usuarioId = Number(user.id);

    if (
      !Number.isInteger(cursoId) ||
      cursoId <= 0
    ) {
      return NextResponse.json(
        { error: "Curso inválido." },
        { status: 400 }
      );
    }

    const body = (await req.json()) as {
      poloIds?: unknown;
    };

    if (!Array.isArray(body.poloIds)) {
      return NextResponse.json(
        {
          error:
            "A lista de polos é obrigatória.",
        },
        { status: 400 }
      );
    }

    const poloIds =
      normalizarPoloIds(body.poloIds);

    const curso =
      await prisma.curso.findFirst({
        where: {
          id: cursoId,
          instituicaoId,
        },
        select: {
          id: true,
          nome: true,
          ativo: true,
          publicacaoRedeDestino: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!curso) {
      return NextResponse.json(
        { error: "Curso não encontrado." },
        { status: 404 }
      );
    }

    if (curso.publicacaoRedeDestino) {
      return NextResponse.json(
        {
          error:
            "Um curso recebido da rede não pode alterar suas unidades de oferta.",
        },
        { status: 403 }
      );
    }

    const contexto =
      await obterContextoGestaoPolos(
        instituicaoId
      );

    if (!contexto) {
      return NextResponse.json(
        {
          error:
            "Instituição não encontrada.",
        },
        { status: 404 }
      );
    }

    if (!contexto.podeGerenciarPolos) {
      return NextResponse.json(
        {
          error:
            "Esta instituição não possui autorização para gerenciar polos.",
        },
        { status: 403 }
      );
    }

    const polosSelecionados =
      poloIds.length > 0
        ? await prisma.polo.findMany({
            where: {
              AND: [
                filtroPolosVisiveis(
                  contexto
                ),
                {
                  id: {
                    in: poloIds,
                  },
                },
              ],
            },
            select: {
              id: true,
              nome: true,
              instituicaoId: true,
              instituicaoGeradaId: true,
              ativo: true,
              statusComercial: true,
            },
          })
        : [];

    if (
      polosSelecionados.length !==
      poloIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "Um ou mais polos não pertencem ao escopo desta instituição.",
        },
        { status: 400 }
      );
    }

    const poloInativo =
      polosSelecionados.find(
        (polo) =>
          polo.ativo !== true ||
          polo.statusComercial !==
            StatusComercialPolo.ATIVO
      );

    if (poloInativo) {
      return NextResponse.json(
        {
          error: `O polo "${poloInativo.nome}" não está ativo.`,
        },
        { status: 409 }
      );
    }

    const polosFisicos =
      polosSelecionados.filter(
        (polo) =>
          polo.instituicaoGeradaId ===
          null
      );

    const unidadesIndependentes =
      polosSelecionados
        .map((polo) => {
          const instituicaoGeradaId =
            Number(
              polo.instituicaoGeradaId
            );

          if (
            !Number.isInteger(
              instituicaoGeradaId
            ) ||
            instituicaoGeradaId <= 0
          ) {
            return null;
          }

          return {
            id: polo.id,
            nome: polo.nome,
            instituicaoGeradaId,
          };
        })
        .filter(
          (
            polo
          ): polo is {
            id: number;
            nome: string;
            instituicaoGeradaId: number;
          } => polo !== null
        );

    const poloFisicoDeOutraInstituicao =
      polosFisicos.find(
        (polo) =>
          polo.instituicaoId !==
          instituicaoId
      );

    if (poloFisicoDeOutraInstituicao) {
      return NextResponse.json(
        {
          error: `O polo "${poloFisicoDeOutraInstituicao.nome}" possui configuração institucional inválida.`,
        },
        { status: 409 }
      );
    }

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          await tx.cursoPolo.deleteMany({
            where: {
              cursoId,
              instituicaoId,
            },
          });

          if (polosFisicos.length > 0) {
            await tx.cursoPolo.createMany({
              data: polosFisicos.map(
                (polo) => ({
                  cursoId,
                  poloId: polo.id,
                  instituicaoId,
                })
              ),
            });
          }

          const publicacoesAtivas =
            await tx.cursoPublicacaoRede.findMany({
              where: {
                cursoOrigemId: cursoId,
                instituicaoOrigemId:
                  instituicaoId,
                status:
                  StatusPublicacaoCursoRede.ATIVA,
              },
              select: {
                id: true,
                poloId: true,
                cursoDestinoId: true,
              },
            });

          const polosIndependentesSelecionados =
            new Set(
              unidadesIndependentes.map(
                (polo) => polo.id
              )
            );

          const publicacoesRetiradas =
            publicacoesAtivas.filter(
              (publicacao) =>
                publicacao.poloId ===
                  null ||
                !polosIndependentesSelecionados.has(
                  publicacao.poloId
                )
            );

          if (
            publicacoesRetiradas.length > 0
          ) {
            const publicacaoIds =
              publicacoesRetiradas.map(
                (publicacao) =>
                  publicacao.id
              );

            const cursoDestinoIds =
              publicacoesRetiradas.map(
                (publicacao) =>
                  publicacao.cursoDestinoId
              );

            await tx.cursoPublicacaoRede.updateMany({
              where: {
                id: {
                  in: publicacaoIds,
                },
              },
              data: {
                status:
                  StatusPublicacaoCursoRede.RETIRADA,
                retiradoEm: new Date(),
                retiradoPorId:
                  usuarioId,
                atualizadoPorId:
                  usuarioId,
                motivoRetirada:
                  "Oferta removida pela instituição de origem.",
              },
            });

            await tx.curso.updateMany({
              where: {
                id: {
                  in: cursoDestinoIds,
                },
              },
              data: {
                ativo: false,
              },
            });
          }

          const publicacoesAtivasAtualizadas =
            await publicarCursoParaUnidadesIndependentes(
              {
                tx,
                cursoOrigemId:
                  cursoId,
                instituicaoOrigemId:
                  instituicaoId,
                polosDestino:
                  unidadesIndependentes,
                publicadoPorId:
                  usuarioId,
              }
            );

          return {
            polosFisicos:
              polosFisicos.length,
            unidadesIndependentes:
              publicacoesAtivasAtualizadas.length,
            unidadesRetiradas:
              publicacoesRetiradas.length,
          };
               },
        {
          maxWait: 10000,
          timeout: 30000,
        }
      );

    return NextResponse.json({
      ok: true,
      mensagem:
        "Polos e unidades do curso atualizados com sucesso.",
      resumo: resultado,
    });
  } catch (error: unknown) {
    console.error(
      "Erro ao atualizar ofertas do curso:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar polos do curso.",
      },
      { status: 500 }
    );
  }
}