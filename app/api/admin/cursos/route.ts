import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function podeGerenciarCurso(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

function normalizarPoloIds(valor: unknown): number[] {
  if (!Array.isArray(valor)) return [];

  return valor
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const cursos = await prisma.curso.findMany({
      where: {
  instituicaoId: user.instituicaoId,
},
      include: {
  criadoPor: {
    select: {
      id: true,
      nome: true,
    },
  },
  excluidoPor: {
    select: {
      id: true,
      nome: true,
    },
  },
  cursosPolos: {
    include: {
      polo: true,
    },
  },
},
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json(cursos);
  } catch (error) {
    console.error("Erro ao buscar cursos:", error);

    return NextResponse.json(
      { error: "Erro ao buscar cursos" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciarCurso(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      nome,
      codigo,
      descricao,
      quantidadeSemestres,
      valorMatricula,
      valorMensalidade,
      quantidadeParcelas,
      poloIds,
    } = body;

    if (!nome || !String(nome).trim()) {
      return NextResponse.json(
        { error: "Nome do curso é obrigatório" },
        { status: 400 }
      );
    }

    const cursoExistente = await prisma.curso.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        nome: String(nome).trim(),
      },
    });

    if (cursoExistente) {
      return NextResponse.json(
        { error: "Já existe um curso com este nome" },
        { status: 400 }
      );
    }

    if (codigo && String(codigo).trim()) {
  const cursoComCodigo = await prisma.curso.findFirst({
    where: {
      instituicaoId: user.instituicaoId,
      codigo: String(codigo).trim(),
    },
  });

  if (cursoComCodigo) {
    return NextResponse.json(
      { error: "Já existe um curso cadastrado com este código. Use outro código para continuar." },
      { status: 400 }
    );
  }
}

    const poloIdsNormalizados = normalizarPoloIds(poloIds);

    if (poloIdsNormalizados.length > 0) {
      const polosValidos = await prisma.polo.findMany({
        where: {
          id: { in: poloIdsNormalizados },
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      });

      if (polosValidos.length !== poloIdsNormalizados.length) {
        return NextResponse.json(
          { error: "Um ou mais polos são inválidos para esta instituição." },
          { status: 400 }
        );
      }
    }

    const novoCurso = await prisma.curso.create({
      data: {
        nome: String(nome).trim(),
        codigo: codigo ? String(codigo).trim() : null,
        descricao: descricao ? String(descricao).trim() : null,
        quantidadeSemestres:
          quantidadeSemestres !== null && quantidadeSemestres !== undefined
            ? Number(quantidadeSemestres)
            : null,
        valorMatricula:
          valorMatricula !== null && valorMatricula !== undefined
            ? Number(valorMatricula)
            : null,
        valorMensalidade:
          valorMensalidade !== null && valorMensalidade !== undefined
            ? Number(valorMensalidade)
            : null,
        quantidadeParcelas:
          quantidadeParcelas !== null && quantidadeParcelas !== undefined
            ? Number(quantidadeParcelas)
            : null,
        instituicaoId: user.instituicaoId,
        criadoPorId: user.id,
        cursosPolos: {
          create: poloIdsNormalizados.map((poloId) => ({
            poloId,
            instituicaoId: user.instituicaoId!,
          })),
        },
      },
      include: {
        cursosPolos: {
          include: {
            polo: true,
          },
        },
      },
    });

    return NextResponse.json(novoCurso, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar curso:", error);

    return NextResponse.json(
      { error: "Erro ao criar curso" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciarCurso(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      id,
      nome,
      codigo,
      descricao,
      quantidadeSemestres,
      valorMatricula,
      valorMensalidade,
      quantidadeParcelas,
      ativo,
      poloIds,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID do curso é obrigatório" },
        { status: 400 }
      );
    }

    if (!nome || !String(nome).trim()) {
      return NextResponse.json(
        { error: "Nome do curso é obrigatório" },
        { status: 400 }
      );
    }

    const cursoExistente = await prisma.curso.findFirst({
      where: {
        id: Number(id),
        instituicaoId: user.instituicaoId,
      },
    });

    if (!cursoExistente) {
      return NextResponse.json(
        { error: "Curso não encontrado" },
        { status: 404 }
      );
    }

    const conflitoNome = await prisma.curso.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        nome: String(nome).trim(),
        NOT: {
          id: Number(id),
        },
      },
    });

    if (conflitoNome) {
      return NextResponse.json(
        { error: "Já existe outro curso com este nome" },
        { status: 400 }
      );
    }

    const poloIdsNormalizados = normalizarPoloIds(poloIds);

    if (poloIdsNormalizados.length > 0) {
      const polosValidos = await prisma.polo.findMany({
        where: {
          id: { in: poloIdsNormalizados },
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      });

      if (polosValidos.length !== poloIdsNormalizados.length) {
        return NextResponse.json(
          { error: "Um ou mais polos são inválidos para esta instituição." },
          { status: 400 }
        );
      }
    }

    const cursoAtualizado = await prisma.$transaction(async (tx) => {
      const curso = await tx.curso.update({
        where: {
          id: Number(id),
        },
        data: {
          nome: String(nome).trim(),
          codigo: codigo ? String(codigo).trim() : null,
          descricao: descricao ? String(descricao).trim() : null,
          quantidadeSemestres:
            quantidadeSemestres !== null && quantidadeSemestres !== undefined
              ? Number(quantidadeSemestres)
              : null,
          valorMatricula:
            valorMatricula !== null && valorMatricula !== undefined
              ? Number(valorMatricula)
              : null,
          valorMensalidade:
            valorMensalidade !== null && valorMensalidade !== undefined
              ? Number(valorMensalidade)
              : null,
          quantidadeParcelas:
            quantidadeParcelas !== null && quantidadeParcelas !== undefined
              ? Number(quantidadeParcelas)
              : null,
          ativo: typeof ativo === "boolean" ? ativo : cursoExistente.ativo,
        },
      });

      await tx.cursoPolo.deleteMany({
        where: {
          cursoId: Number(id),
          instituicaoId: user.instituicaoId,
        },
      });

      if (poloIdsNormalizados.length > 0) {
        await tx.cursoPolo.createMany({
          data: poloIdsNormalizados.map((poloId) => ({
            cursoId: Number(id),
            poloId,
            instituicaoId: user.instituicaoId!,
          })),
        });
      }

      return tx.curso.findUnique({
        where: { id: curso.id },
        include: {
          cursosPolos: {
            include: {
              polo: true,
            },
          },
        },
      });
    });

    return NextResponse.json(cursoAtualizado);
  } catch (error) {
    console.error("Erro ao editar curso:", error);

    return NextResponse.json(
      { error: "Erro ao editar curso" },
      { status: 500 }
    );
  }
}
export async function DELETE(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciarCurso(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: "ID do curso é obrigatório" }, { status: 400 });
    }

    const curso = await prisma.curso.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!curso) {
      return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
    }

    const agora = new Date();
const expira = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000);

const atualizado = await prisma.curso.update({
  where: { id },
 data: {
  ativo: false,
  excluidoEm: agora,
  expiraExclusaoEm: expira,
  excluidoPorId: user.id,
},
});

    return NextResponse.json({
      ok: true,
      curso: atualizado,
      message: "Curso excluído e enviado para recuperação.",
    });
  } catch (error) {
    console.error("Erro ao excluir curso:", error);
    return NextResponse.json({ error: "Erro ao excluir curso" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciarCurso(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const id = Number(body.id);
    const ativo = Boolean(body.ativo);

    if (!id) {
      return NextResponse.json({ error: "ID do curso é obrigatório" }, { status: 400 });
    }

    const curso = await prisma.curso.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!curso) {
      return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
    }

    const atualizado = await prisma.curso.update({
  where: { id },
  data: {
  ativo,
  excluidoEm: ativo ? null : curso.excluidoEm,
  expiraExclusaoEm: ativo ? null : curso.expiraExclusaoEm,
  excluidoPorId: ativo ? null : curso.excluidoPorId,
},
});

    return NextResponse.json({
      ok: true,
      curso: atualizado,
      message: ativo ? "Curso restaurado com sucesso." : "Curso arquivado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao alterar status do curso:", error);
    return NextResponse.json({ error: "Erro ao alterar status do curso" }, { status: 500 });
  }
}