import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

const regrasPlano = {
  ESSENCIAL: {
    base: 49,
    valorAluno: 3,
    polosInclusos: 1,
    valorPoloExtra: 49,
  },
  PROFISSIONAL: {
    base: 99,
    valorAluno: 5,
    polosInclusos: 3,
    valorPoloExtra: 79,
  },
  ENTERPRISE: {
    base: 199,
    valorAluno: 7,
    polosInclusos: 1,
    valorPoloExtra: 99,
  },
};

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user?.instituicaoId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        plano: true,
      },
    });

    const plano = (instituicao?.plano || "ESSENCIAL").toUpperCase() as
      | "ESSENCIAL"
      | "PROFISSIONAL"
      | "ENTERPRISE";

    const regra = regrasPlano[plano] || regrasPlano.ESSENCIAL;

    const alunosAtivos = await prisma.aluno.count({
      where: {
        instituicaoId: user.instituicaoId,
        ativo: true,
      },
    });

    const polosAtivos = await prisma.polo.count({
      where: {
        instituicaoId: user.instituicaoId,
        ativo: true,
      },
    });

    const polosExtras = Math.max(0, polosAtivos - regra.polosInclusos);

    const valorEstimado =
      regra.base +
      alunosAtivos * regra.valorAluno +
      polosExtras * regra.valorPoloExtra;

    return NextResponse.json({
      plano,
      alunosAtivos,
      polosAtivos,
      polosExtras,
      valorBase: regra.base,
      valorAluno: regra.valorAluno,
      polosInclusos: regra.polosInclusos,
      valorPoloExtra: regra.valorPoloExtra,
      valorEstimado,
    });
  } catch (error) {
    console.error("ERRO USO PLANO:", error);

    return NextResponse.json(
      { error: "Erro ao calcular uso do plano" },
      { status: 500 }
    );
  }
}