import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import { sincronizarPublicacoesAtivasDoCurso } from "@/lib/publicacao-cursos-rede";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(
      req.url
    );

    const cursoId = Number(
      searchParams.get("cursoId")
    );

    if (
      !Number.isInteger(cursoId) ||
      cursoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "cursoId é obrigatório.",
        },
        { status: 400 }
      );
    }

    const curso =
      await prisma.curso.findFirst({
        where: {
          id: cursoId,
          instituicaoId:
            user.instituicaoId,
        },
        select: {
          id: true,
        },
      });

    if (!curso) {
      return NextResponse.json(
        {
          error:
            "Curso não encontrado.",
        },
        { status: 404 }
      );
    }

    const semestres =
      await prisma.cursoSemestre.findMany({
        where: {
          cursoId,
          instituicaoId:
            user.instituicaoId,
        },
        include: {
          disciplinas: {
            include: {
              disciplina: true,
            },
            orderBy: {
              disciplina: {
                nome: "asc",
              },
            },
          },
        },
        orderBy: {
          numero: "asc",
        },
      });

    return NextResponse.json(
      semestres
    );
  } catch (error: unknown) {
    console.error(
      "Erro ao buscar semestres do curso:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao buscar semestres do curso.",
        detalhe:
          error instanceof Error
            ? error.message
            : "Erro interno",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      !isAdminLike(user.role)
    ) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const instituicaoId = Number(
      user.instituicaoId
    );

    const usuarioId = Number(user.id);

    const body = (await req.json()) as Record<
      string,
      unknown
    >;

    const cursoId = Number(body.cursoId);
    const numero = Number(body.numero);

    if (
      !Number.isInteger(cursoId) ||
      cursoId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Curso inválido.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(numero) ||
      numero <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "O número do semestre deve ser um inteiro maior que zero.",
        },
        { status: 400 }
      );
    }

    const curso =
  await prisma.curso.findFirst({
    where: {
      id: cursoId,
      instituicaoId,
    },
    select: {
      id: true,
      publicacaoRedeDestino: {
        select: {
          id: true,
        },
      },
    },
  });

    if (!curso) {
      return NextResponse.json(
        {
          error:
            "Curso não encontrado para esta instituição.",
        },
        { status: 404 }
      );
    }

    if (curso.publicacaoRedeDestino) {
  return NextResponse.json(
    {
      error:
        "Não é permitido criar semestres em um curso recebido da rede.",
    },
    { status: 403 }
  );
}

    const existente =
      await prisma.cursoSemestre.findFirst({
        where: {
          cursoId,
          numero,
          instituicaoId,
        },
        select: {
          id: true,
        },
      });

    if (existente) {
      return NextResponse.json(
        {
          error:
            "Este semestre já foi cadastrado para o curso.",
        },
        { status: 400 }
      );
    }

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const semestre =
            await tx.cursoSemestre.create({
              data: {
                cursoId,
                numero,

                titulo: body.titulo
                  ? String(
                      body.titulo
                    ).trim()
                  : null,

                descricao: body.descricao
                  ? String(
                      body.descricao
                    ).trim()
                  : null,

                instituicaoId,
              },
            });

          const publicacoes =
            await sincronizarPublicacoesAtivasDoCurso(
              {
                tx,
                cursoOrigemId:
                  cursoId,
                instituicaoOrigemId:
                  instituicaoId,
                atualizadoPorId:
                  usuarioId,
              }
            );

          return {
            semestre,
            publicacoesSincronizadas:
              publicacoes.length,
          };
        }
      );

    return NextResponse.json(
      {
        ...resultado.semestre,

        disciplinas: [],

        resumoSincronizacao: {
          unidadesAtualizadas:
            resultado
              .publicacoesSincronizadas,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error(
      "Erro ao criar semestre do curso:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao criar semestre do curso.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      !isAdminLike(user.role)
    ) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const instituicaoId = Number(
      user.instituicaoId
    );

    const usuarioId = Number(user.id);

    const body = (await req.json()) as Record<
      string,
      unknown
    >;

    const id = Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Semestre inválido.",
        },
        { status: 400 }
      );
    }

    const semestreExistente =
      await prisma.cursoSemestre.findFirst({
        where: {
          id,
          instituicaoId,
        },
        select: {
          id: true,
          cursoId: true,
        },
      });

    if (!semestreExistente) {
      return NextResponse.json(
        {
          error:
            "Semestre não encontrado.",
        },
        { status: 404 }
      );
    }

    const publicacaoRecebida =
  await prisma.cursoPublicacaoRede.findUnique({
    where: {
      cursoDestinoId:
        semestreExistente.cursoId,
    },
    select: {
      id: true,
    },
  });

if (publicacaoRecebida) {
  return NextResponse.json(
    {
      error:
        "Não é permitido alterar a carga horária de um curso recebido da rede.",
    },
    { status: 403 }
  );
}

    const cargaMinima =
      body.cargaMinima !== "" &&
      body.cargaMinima !== null &&
      body.cargaMinima !== undefined
        ? Number(body.cargaMinima)
        : null;

    const cargaMaxima =
      body.cargaMaxima !== "" &&
      body.cargaMaxima !== null &&
      body.cargaMaxima !== undefined
        ? Number(body.cargaMaxima)
        : null;

    if (
      cargaMinima !== null &&
      (!Number.isFinite(cargaMinima) ||
        cargaMinima <= 0)
    ) {
      return NextResponse.json(
        {
          error:
            "A carga mínima deve ser maior que zero.",
        },
        { status: 400 }
      );
    }

    if (
      cargaMaxima !== null &&
      (!Number.isFinite(cargaMaxima) ||
        cargaMaxima <= 0)
    ) {
      return NextResponse.json(
        {
          error:
            "A carga máxima deve ser maior que zero.",
        },
        { status: 400 }
      );
    }

    if (
      cargaMinima !== null &&
      cargaMaxima !== null &&
      cargaMinima > cargaMaxima
    ) {
      return NextResponse.json(
        {
          error:
            "A carga mínima não pode ser maior que a carga máxima.",
        },
        { status: 400 }
      );
    }

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const atualizado =
            await tx.cursoSemestre.update({
              where: {
                id,
              },
              data: {
                cargaMinima,
                cargaMaxima,
              },
            });

          const publicacoes =
            await sincronizarPublicacoesAtivasDoCurso(
              {
                tx,
                cursoOrigemId:
                  semestreExistente.cursoId,
                instituicaoOrigemId:
                  instituicaoId,
                atualizadoPorId:
                  usuarioId,
              }
            );

          return {
            atualizado,
            publicacoesSincronizadas:
              publicacoes.length,
          };
        }
      );

    return NextResponse.json({
      ...resultado.atualizado,

      resumoSincronizacao: {
        unidadesAtualizadas:
          resultado
            .publicacoesSincronizadas,
      },
    });
  } catch (error: unknown) {
    console.error(
      "Erro ao atualizar carga do semestre:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar semestre.",
      },
      { status: 500 }
    );
  }
}