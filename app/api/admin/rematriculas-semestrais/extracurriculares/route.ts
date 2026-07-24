import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TokenAdmin = {
  id: number;
  role: string;
  instituicaoId: number;
  isMasterAdmin?: boolean;
};

type ItemExtraRecebido = {
  disciplinaId?: unknown;
  obrigatoria?: unknown;
  contaCargaMinima?: unknown;
  contaCargaMaxima?: unknown;
};

function inteiroPositivo(
  valor: unknown,
): number | null {
  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

async function obterUsuarioAutorizado() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  let decoded: TokenAdmin;

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as TokenAdmin;
  } catch {
    return null;
  }

  const role = String(
    decoded.role || "",
  ).toUpperCase();

  const autorizado =
    decoded.isMasterAdmin === true ||
    [
      "ADMIN",
      "SECRETARIA",
      "COORDENADOR",
      "GERENCIA",
      "SUPORTE",
    ].includes(role);

  if (!autorizado) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      id: decoded.id,
      instituicaoId: decoded.instituicaoId,
      ativo: true,
    },
    select: {
      id: true,
      nome: true,
      role: true,
      instituicaoId: true,
      isMasterAdmin: true,
    },
  });
}

export async function GET(
  req: NextRequest,
) {
  try {
    const usuario =
      await obterUsuarioAutorizado();

    if (!usuario) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        },
      );
    }

    const url = new URL(req.url);

    const cursoId = inteiroPositivo(
      url.searchParams.get("cursoId"),
    );

    const semestreParametro =
      url.searchParams.get(
        "cursoSemestreId",
      );

    const cursoSemestreId =
      semestreParametro
        ? inteiroPositivo(
            semestreParametro,
          )
        : null;

    if (
      semestreParametro &&
      !cursoSemestreId
    ) {
      return NextResponse.json(
        {
          error:
            "Semestre de destino inválido.",
        },
        {
          status: 400,
        },
      );
    }

    if (cursoId) {
      const curso =
        await prisma.curso.findFirst({
          where: {
            id: cursoId,
            instituicaoId:
              usuario.instituicaoId,
            ativo: true,
          },
          select: {
            id: true,
          },
        });

      if (!curso) {
        return NextResponse.json(
          {
            error:
              "Curso de destino não encontrado.",
          },
          {
            status: 404,
          },
        );
      }
    }

    if (cursoSemestreId) {
      const semestre =
        await prisma.cursoSemestre.findFirst(
          {
            where: {
              id: cursoSemestreId,
              instituicaoId:
                usuario.instituicaoId,
              ...(cursoId
                ? {
                    cursoId,
                  }
                : {}),
            },
            select: {
              id: true,
            },
          },
        );

      if (!semestre) {
        return NextResponse.json(
          {
            error:
              "O semestre não pertence ao curso selecionado.",
          },
          {
            status: 404,
          },
        );
      }
    }

    const [
      cursos,
      disciplinas,
      configuracoes,
    ] = await Promise.all([
      prisma.curso.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          codigo: true,
          semestres: {
            select: {
              id: true,
              numero: true,
              titulo: true,
              cargaMinima: true,
              cargaMaxima: true,
            },
            orderBy: {
              numero: "asc",
            },
          },
        },
        orderBy: {
          nome: "asc",
        },
      }),

      prisma.disciplina.findMany({
        where: {
          instituicaoId:
            usuario.instituicaoId,
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          codigo: true,
          descricao: true,
          cargaHoraria: true,
          semestre: true,
          cursoId: true,
          curso: {
            select: {
              id: true,
              nome: true,
              codigo: true,
            },
          },
        },
        orderBy: {
          nome: "asc",
        },
      }),

      cursoId
        ? prisma.cursoDisciplinaExtraPermitida.findMany(
            {
              where: {
                instituicaoId:
                  usuario.instituicaoId,
                cursoId,
                cursoSemestreId:
                  cursoSemestreId ??
                  null,
              },
              select: {
                id: true,
                cursoId: true,
                cursoSemestreId: true,
                disciplinaId: true,
                ativa: true,
                obrigatoria: true,
                contaCargaMinima: true,
                contaCargaMaxima: true,
                disciplina: {
                  select: {
                    id: true,
                    nome: true,
                    codigo: true,
                    cargaHoraria: true,
                    cursoId: true,
                    curso: {
                      select: {
                        id: true,
                        nome: true,
                        codigo: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                disciplina: {
                  nome: "asc",
                },
              },
            },
          )
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      ok: true,
      cursos,
      disciplinas,
      configuracoes,
      filtro: {
        cursoId,
        cursoSemestreId,
        aplicacao:
          cursoSemestreId === null
            ? "TODOS_OS_SEMESTRES"
            : "SEMESTRE_ESPECIFICO",
      },
    });
  } catch (error) {
    console.error(
      "Erro ao carregar extracurriculares:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Erro ao carregar as disciplinas extracurriculares.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(
  req: NextRequest,
) {
  try {
    const usuario =
      await obterUsuarioAutorizado();

    if (!usuario) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        },
      );
    }

    const body = await req.json();

    const cursoId = inteiroPositivo(
      body?.cursoId,
    );

    if (!cursoId) {
      return NextResponse.json(
        {
          error:
            "Selecione o curso de destino.",
        },
        {
          status: 400,
        },
      );
    }

    const semestreFoiInformado =
      body?.cursoSemestreId !== null &&
      body?.cursoSemestreId !==
        undefined &&
      body?.cursoSemestreId !== "";

    const cursoSemestreId =
      semestreFoiInformado
        ? inteiroPositivo(
            body?.cursoSemestreId,
          )
        : null;

    if (
      semestreFoiInformado &&
      !cursoSemestreId
    ) {
      return NextResponse.json(
        {
          error:
            "Semestre de destino inválido.",
        },
        {
          status: 400,
        },
      );
    }

    const curso =
      await prisma.curso.findFirst({
        where: {
          id: cursoId,
          instituicaoId:
            usuario.instituicaoId,
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
        },
      });

    if (!curso) {
      return NextResponse.json(
        {
          error:
            "Curso de destino não encontrado.",
        },
        {
          status: 404,
        },
      );
    }

    if (cursoSemestreId) {
      const semestre =
        await prisma.cursoSemestre.findFirst(
          {
            where: {
              id: cursoSemestreId,
              cursoId,
              instituicaoId:
                usuario.instituicaoId,
            },
            select: {
              id: true,
            },
          },
        );

      if (!semestre) {
        return NextResponse.json(
          {
            error:
              "O semestre selecionado não pertence ao curso de destino.",
          },
          {
            status: 409,
          },
        );
      }
    }

    const itensRecebidos:
      ItemExtraRecebido[] =
      Array.isArray(body?.itens)
        ? body.itens
        : [];

    const itens = itensRecebidos.map(
      (item) => ({
        disciplinaId:
          inteiroPositivo(
            item.disciplinaId,
          ),
        obrigatoria:
          item.obrigatoria === true,
        contaCargaMinima:
          item.contaCargaMinima !==
          false,
        contaCargaMaxima:
          item.contaCargaMaxima !==
          false,
      }),
    );

    if (
      itens.some(
        (item) =>
          item.disciplinaId === null,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Existe uma disciplina inválida na seleção.",
        },
        {
          status: 400,
        },
      );
    }

    const disciplinaIds = itens.map(
      (item) =>
        item.disciplinaId as number,
    );

    if (
      new Set(disciplinaIds).size !==
      disciplinaIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "A mesma disciplina foi selecionada mais de uma vez.",
        },
        {
          status: 400,
        },
      );
    }

    if (disciplinaIds.length > 0) {
      const disciplinasValidas =
        await prisma.disciplina.findMany(
          {
            where: {
              instituicaoId:
                usuario.instituicaoId,
              id: {
                in: disciplinaIds,
              },
              ativo: true,
            },
            select: {
              id: true,
            },
          },
        );

      if (
        disciplinasValidas.length !==
        disciplinaIds.length
      ) {
        return NextResponse.json(
          {
            error:
              "Uma ou mais disciplinas não pertencem à instituição ou estão inativas.",
          },
          {
            status: 409,
          },
        );
      }
    }

    const configuracoesSalvas =
      await prisma.$transaction(
        async (tx) => {
          await tx.cursoDisciplinaExtraPermitida.deleteMany(
            {
              where: {
                instituicaoId:
                  usuario.instituicaoId,
                cursoId,
                cursoSemestreId:
                  cursoSemestreId ??
                  null,
              },
            },
          );

          if (itens.length > 0) {
            await tx.cursoDisciplinaExtraPermitida.createMany(
              {
                data: itens.map(
                  (item) => ({
                    instituicaoId:
                      usuario.instituicaoId,
                    cursoId,
                    cursoSemestreId,
                    disciplinaId:
                      item.disciplinaId as number,
                    ativa: true,
                    obrigatoria:
                      item.obrigatoria,
                    contaCargaMinima:
                      item.contaCargaMinima,
                    contaCargaMaxima:
                      item.contaCargaMaxima,
                  }),
                ),
              },
            );
          }

          return tx.cursoDisciplinaExtraPermitida.findMany(
            {
              where: {
                instituicaoId:
                  usuario.instituicaoId,
                cursoId,
                cursoSemestreId:
                  cursoSemestreId ??
                  null,
              },
              select: {
                id: true,
                cursoId: true,
                cursoSemestreId: true,
                disciplinaId: true,
                ativa: true,
                obrigatoria: true,
                contaCargaMinima: true,
                contaCargaMaxima: true,
                disciplina: {
                  select: {
                    id: true,
                    nome: true,
                    codigo: true,
                    cargaHoraria: true,
                    cursoId: true,
                    curso: {
                      select: {
                        id: true,
                        nome: true,
                        codigo: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                disciplina: {
                  nome: "asc",
                },
              },
            },
          );
        },
      );

    return NextResponse.json({
      ok: true,
      message:
        cursoSemestreId === null
          ? "Disciplinas extracurriculares configuradas para todos os semestres do curso."
          : "Disciplinas extracurriculares configuradas para o semestre selecionado.",
      curso,
      cursoSemestreId,
      configuracoes:
        configuracoesSalvas,
    });
  } catch (error) {
    console.error(
      "Erro ao salvar extracurriculares:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao salvar as disciplinas extracurriculares.",
      },
      {
        status: 500,
      },
    );
  }
}