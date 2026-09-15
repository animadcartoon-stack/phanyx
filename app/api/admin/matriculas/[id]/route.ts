import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function obterMatriculaId(valor: string) {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

// CONSULTAR MATRÍCULA
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken();

  if (
    !user ||
    user.role !== "ADMIN" ||
    !user.instituicaoId
  ) {
    return NextResponse.json(
      { error: "Sem permissão" },
      { status: 403 }
    );
  }

  const matriculaId = obterMatriculaId(
    params.id
  );

  if (!matriculaId) {
    return NextResponse.json(
      { error: "Matrícula inválida" },
      { status: 400 }
    );
  }

  const matricula =
    await prisma.matricula.findFirst({
      where: {
        id: matriculaId,
        instituicaoId:
          user.instituicaoId,
      },

      select: {
        id: true,
        status: true,

        instituicaoId: true,
        poloId: true,
        cursoId: true,
        turmaPrincipalId: true,

        semestre: true,
        modalidade: true,

        cursoSemestreId: true,
        periodoMatriculaId: true,

        aluno: {
          select: {
            id: true,
            nome: true,
          },
        },

        instituicao: {
          select: {
            id: true,
            nome: true,
          },
        },

        polo: {
          select: {
            id: true,
            nome: true,
          },
        },

        curso: {
          select: {
            id: true,
            nome: true,
          },
        },

        cursoSemestre: {
          select: {
            id: true,
            numero: true,
            titulo: true,
          },
        },

        turmaPrincipal: {
          select: {
            id: true,
            nome: true,
            semestre: true,
            modalidade: true,
            periodoLetivo: true,
            poloId: true,
          },
        },
      },
    });

  if (!matricula) {
    return NextResponse.json(
      { error: "Matrícula não encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    matricula
  );
}

// EDITAR MATRÍCULA
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromToken();

  if (
    !user ||
    user.role !== "ADMIN" ||
    !user.instituicaoId
  ) {
    return NextResponse.json(
      { error: "Sem permissão" },
      { status: 403 }
    );
  }

  const matriculaId = obterMatriculaId(
    params.id
  );

  if (!matriculaId) {
    return NextResponse.json(
      { error: "Matrícula inválida" },
      { status: 400 }
    );
  }

  const matriculaExistente =
    await prisma.matricula.findFirst({
      where: {
        id: matriculaId,
        instituicaoId:
          user.instituicaoId,
      },

      select: {
        id: true,
      },
    });

  if (!matriculaExistente) {
    return NextResponse.json(
      { error: "Matrícula não encontrada" },
      { status: 404 }
    );
  }

  const body = await req.json();

  const matricula =
    await prisma.matricula.update({
      where: {
        id: matriculaId,
      },

      data: {
        valorMatricula:
          body.valorMatricula ?? null,

        valorMensalidade:
          body.valorMensalidade ?? null,

        quantidadeParcelas:
          body.quantidadeParcelas ?? null,

        dataPrimeiroVencimento:
          body.dataPrimeiroVencimento
            ? new Date(
                body.dataPrimeiroVencimento
              )
            : null,
      },
    });

  return NextResponse.json(
    matricula
  );
}

