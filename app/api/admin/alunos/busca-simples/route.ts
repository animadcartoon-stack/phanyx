import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "FINANCEIRO" &&
        user.role !== "SECRETARIA")
    ) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const buscaOriginal = String(searchParams.get("busca") || "").trim();

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const busca = normalizarTexto(buscaOriginal);

    const alunos = await prisma.aluno.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        ...(busca
          ? {
              OR: [
                {
                  nome: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
                {
                  matricula: {
                    contains: busca,
                    mode: "insensitive",
                  },
                },
                {
                  user: {
                    email: {
                      contains: busca,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        user: true,
      },
      orderBy: {
        nome: "asc",
      },
      take: 30,
    });

    const alunosOrdenados = [...alunos].sort((a, b) => {
  const nomeA = normalizarTexto(a.nome || "");
  const nomeB = normalizarTexto(b.nome || "");
  const emailA = normalizarTexto(a.user?.email || "");
  const emailB = normalizarTexto(b.user?.email || "");
  const matriculaA = normalizarTexto(a.matricula || "");
  const matriculaB = normalizarTexto(b.matricula || "");

  const score = (
    nome: string,
    email: string,
    matricula: string
  ) => {
    if (!busca) return 99;

    if (nome.startsWith(busca)) return 1;
    if (nome.split(" ").some((parte) => parte.startsWith(busca))) return 2;
    if (matricula.startsWith(busca)) return 3;
    if (email.startsWith(busca)) return 4;
    if (nome.includes(busca)) return 5;
    if (matricula.includes(busca)) return 6;
    if (email.includes(busca)) return 7;

    return 99;
  };

  const scoreA = score(nomeA, emailA, matriculaA);
  const scoreB = score(nomeB, emailB, matriculaB);

  if (scoreA !== scoreB) return scoreA - scoreB;

  return nomeA.localeCompare(nomeB, "pt-BR");
});

return NextResponse.json(
  alunosOrdenados.map((aluno) => ({
    id: aluno.id,
    nome: aluno.nome,
    matricula: aluno.matricula,
    email: aluno.user?.email || null,
    statusAluno: aluno.statusAluno,
  }))
);
  } catch (error: any) {
    console.error("Erro ao buscar alunos:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar alunos" },
      { status: 500 }
    );
  }
}