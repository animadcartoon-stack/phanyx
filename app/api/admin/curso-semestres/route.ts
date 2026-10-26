import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import { sincronizarPublicacoesAtivasDoCurso } from "@/lib/publicacao-cursos-rede";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// A etapa só pode sair da grade enquanto não houver uso acadêmico.
// Disciplinas do catálogo permanecem; apenas seus vínculos com a etapa saem.
export async function DELETE(req: Request) {
  try {
    const user = await getUserFromToken();
    if (!user) return NextResponse.json({ codigo: "UNAUTHENTICATED" }, { status: 401 });
    if (!isAdminLike(user.role)) {
      return NextResponse.json({ codigo: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const id = Number(body?.id);
    const cursoId = Number(body?.cursoId);
    const instituicaoId = Number(user.instituicaoId);
    if (!Number.isSafeInteger(id) || id <= 0 ||
        !Number.isSafeInteger(cursoId) || cursoId <= 0) {
      return NextResponse.json({ codigo: "INVALID_STAGE" }, { status: 400 });
    }

    return await prisma.$transaction(async (tx) => {
      const etapa = await tx.cursoSemestre.findFirst({
        where: { id, cursoId, instituicaoId, curso: { instituicaoId } },
        select: {
          numero: true,
          organizacaoCurricular: true,
          curso: { select: { publicacaoRedeDestino: { select: { id: true } } } },
          _count: { select: {
            matriculas: true,
            rematriculasDestino: true,
            periodosMatricula: true,
            disciplinasExtrasPermitidas: true,
            semestresPublicadosRede: true,
          } },
        },
      });
      if (!etapa) return NextResponse.json({ codigo: "NOT_FOUND" }, { status: 404 });
      if (etapa.curso.publicacaoRedeDestino) {
        return NextResponse.json({ codigo: "NETWORK_RECEIVED" }, { status: 403 });
      }
      if (etapa._count.semestresPublicadosRede > 0) {
        return NextResponse.json({ codigo: "NETWORK_PUBLISHED" }, { status: 409 });
      }

      const organizacaoCurricular = etapa.organizacaoCurricular;
      // Há cadastros legados que guardam o número, sem FK para a etapa.
      const [matricula, turma, periodo, contratacao] = await Promise.all([
        tx.matricula.findFirst({
          where: { instituicaoId, cursoId, organizacaoCurricular,
            OR: [{ cursoSemestreId: id }, { etapaNumero: etapa.numero },
              ...(organizacaoCurricular === "SEMESTRAL" ? [{ semestre: etapa.numero }] : [])],
          },
          select: { id: true },
        }),
        tx.turma.findFirst({
          where: { instituicaoId, cursoId,
            OR: [
              { organizacaoCurricular, etapaNumero: etapa.numero },
              ...(organizacaoCurricular === "SEMESTRAL"
                ? [{ organizacaoCurricular, semestre: String(etapa.numero) }] : []),
              { semestres: { some: { organizacaoCurricular, numero: etapa.numero } } },
            ],
          },
          select: { id: true },
        }),
        tx.periodoMatricula.findFirst({
          where: { instituicaoId, cursoId, semestreNumero: etapa.numero },
          select: { id: true },
        }),
        tx.matriculaDisciplinaContratada.findFirst({
          where: { OR: [
            { cursoSemestreIdSnapshot: id },
            { semestreNumeroSnapshot: etapa.numero,
              matricula: { instituicaoId, cursoId, organizacaoCurricular } },
          ] },
          select: { id: true },
        }),
      ]);

      const contagem = etapa._count;
      if (matricula || turma || periodo || contratacao ||
          contagem.matriculas || contagem.rematriculasDestino ||
          contagem.periodosMatricula || contagem.disciplinasExtrasPermitidas) {
        return NextResponse.json({ codigo: "STAGE_IN_USE" }, { status: 409 });
      }

      // O cascade remove somente os vínculos curriculares com as disciplinas.
      await tx.cursoSemestre.deleteMany({ where: { id, cursoId, instituicaoId } });
      return NextResponse.json({ ok: true, id });
    }, { isolationLevel: "Serializable" });
  } catch (error: unknown) {
    const codigo = error && typeof error === "object" && "code" in error
      ? String(error.code) : "";
    if (["P2003", "P2014"].includes(codigo)) {
      return NextResponse.json({ codigo: "STAGE_IN_USE" }, { status: 409 });
    }
    if (["P2034", "P2025"].includes(codigo)) {
      return NextResponse.json({ codigo: "CONCURRENT_CHANGE" }, { status: 409 });
    }
    console.error("Erro ao excluir etapa do curso:", error);
    return NextResponse.json({ codigo: "DELETE_FAILED" }, { status: 500 });
  }
}

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
          organizacaoCurricular: true,
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

    return NextResponse.json(semestres);
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
      organizacaoCurricular: true,
      quantidadeSemestres: true,
      quantidadeEtapas: true,
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

    if (curso.organizacaoCurricular === "LIVRE") return NextResponse.json({ codigo: "CURSO_LIVRE_SEM_ETAPAS" }, { status: 400 });
    const limite = curso.organizacaoCurricular === "ANUAL" ? curso.quantidadeEtapas : curso.quantidadeSemestres;
    if (limite && numero > limite) return NextResponse.json({ codigo: "ETAPA_INVALIDA", error: "Etapa fora da duração do curso." }, { status: 400 });

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
          const cursoAtual = await tx.curso.findFirst({ where: { id: cursoId, instituicaoId }, select: { organizacaoCurricular: true } });
          if (!cursoAtual || cursoAtual.organizacaoCurricular !== curso.organizacaoCurricular) throw new Error("Atualize a organização do curso antes de criar a etapa.");
          const semestre =
            await tx.cursoSemestre.create({
              data: {
                cursoId,
                numero,
                organizacaoCurricular: curso.organizacaoCurricular,

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
        }, { isolationLevel: "Serializable" }
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
        }, { isolationLevel: "Serializable" }
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