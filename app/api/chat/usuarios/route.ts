import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

const ROLES_INSTITUICAO = [
  "ADMIN",
  "SECRETARIA",
  "COORDENADOR",
  "FINANCEIRO",
  "SUPORTE",
];

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const role = String(user.role || "").toUpperCase();

    let usuariosIdsPermitidos: number[] = [];

    if (role === "ALUNO") {
      const aluno = await prisma.aluno.findFirst({
        where: {
          userId: user.id,
          instituicaoId: user.instituicaoId,
        },
        include: {
          matriculas: {
            include: {
              itens: true,
            },
          },
        },
      });

      const pares =
        aluno?.matriculas.flatMap((matricula) =>
          matricula.itens.map((item) => ({
            turmaId: item.turmaId,
            disciplinaId: item.disciplinaId,
          }))
        ) || [];

      const vinculos = pares.length
        ? await prisma.turmaDisciplina.findMany({
            where: {
              instituicaoId: user.instituicaoId,
              OR: pares.map((par) => ({
                turmaId: par.turmaId,
                disciplinaId: par.disciplinaId,
              })),
            },
            include: {
              professor: true,
            },
          })
        : [];

      usuariosIdsPermitidos = Array.from(
        new Set(
          vinculos
            .map((v) => v.professor?.userId)
            .filter((id): id is number => typeof id === "number")
        )
      );
    }

    if (role === "PROFESSOR") {
      const professor = await prisma.professor.findFirst({
        where: {
          userId: user.id,
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      });

      const idsEquipe = await prisma.user.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          ativo: true,
          id: { not: user.id },
          role: { in: ROLES_INSTITUICAO as any },
        },
        select: { id: true },
      });

      let alunosUserIds: number[] = [];

      if (professor) {
        const itens = await prisma.itemMatricula.findMany({
          where: {
            instituicaoId: user.instituicaoId,
            turma: {
              disciplinas: {
                some: {
                  disciplina: {
                    OR: [
                      { professorId: professor.id },
                      {
                        professoresHabilitados: {
                          some: {
                            professorId: professor.id,
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          include: {
            matricula: {
              include: {
                aluno: true,
              },
            },
          },
        });

        alunosUserIds = Array.from(
          new Set(
            itens
              .map((item) => item.matricula?.aluno?.userId)
              .filter((id): id is number => typeof id === "number")
          )
        );
      }

      usuariosIdsPermitidos = Array.from(
        new Set([...idsEquipe.map((u) => u.id), ...alunosUserIds])
      );
    }

    if (ROLES_INSTITUICAO.includes(role)) {
      const usuarios = await prisma.user.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          ativo: true,
          id: { not: user.id },
          role: {
            in: [
              "ADMIN",
              "SECRETARIA",
              "COORDENADOR",
              "FINANCEIRO",
              "SUPORTE",
              "PROFESSOR",
            ] as any,
          },
        },
        select: { id: true },
      });

      usuariosIdsPermitidos = usuarios.map((u) => u.id);
    }

    if (role === "SUPER_ADMIN") {
      const usuarios = await prisma.user.findMany({
        where: {
          ativo: true,
          id: { not: user.id },
          role: {
            in: ["ADMIN", "SECRETARIA", "COORDENADOR", "SUPORTE"] as any,
          },
        },
        select: { id: true },
      });

      usuariosIdsPermitidos = usuarios.map((u) => u.id);
    }

    const usuarios = await prisma.user.findMany({
      where: {
        id: {
          in: usuariosIdsPermitidos,
        },
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    const presencas = await prisma.chatPresenca.findMany({
      where: {
        usuarioId: {
          in: usuarios.map((u) => u.id),
        },
      },
    });

    const agora = Date.now();

    const usuariosComPresenca = usuarios.map((usuario) => {
      const presenca = presencas.find((p) => p.usuarioId === usuario.id);

      const online =
        presenca?.status === "ONLINE" &&
        presenca?.ultimaAtividade &&
        agora - new Date(presenca.ultimaAtividade).getTime() < 60000;

      return {
        ...usuario,
        online,
      };
    });

    return NextResponse.json({
      usuarioRole: role,
      usuarios: usuariosComPresenca,
    });
  } catch (error) {
    console.error("Erro ao carregar usuários do chat:", error);

    return NextResponse.json(
      { error: "Erro ao carregar usuários" },
      { status: 500 }
    );
  }
}