import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { provaPertenceAoProfessor } from "@/lib/services/provaProfessor.service";

type AlternativaPayload = {
  texto?: string;
  correta?: boolean;
};

export async function POST(
  req: NextRequest,
  ctx: { params: { provaId: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "PROFESSOR" && user.role !== "professor")) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const professor = await prisma.professor.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        instituicaoId: true,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const provaId = Number(ctx.params.provaId);

    if (!Number.isFinite(provaId)) {
      return NextResponse.json(
        { error: "Prova inválida" },
        { status: 400 }
      );
    }

    const prova: any = await provaPertenceAoProfessor({
      provaId,
      professorId: professor.id,
      instituicaoId: user.instituicaoId,
    });

    if (!prova) {
      return NextResponse.json(
        { error: "Prova não encontrada para este professor" },
        { status: 404 }
      );
    }

    if (prova.status !== "RASCUNHO") {
      return NextResponse.json(
        { error: "Só pode editar questões em RASCUNHO" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const enunciado = String(body.enunciado || "").trim();
    const tipo = String(body.tipo || "").trim();
    const valor = Number(body.valor);

    const respostaModelo =
      body.respostaModelo !== undefined &&
      body.respostaModelo !== null
        ? String(body.respostaModelo).trim()
        : "";

    const alternativasRecebidas: AlternativaPayload[] =
      Array.isArray(body.alternativas)
        ? body.alternativas
        : [];

    if (!enunciado) {
      return NextResponse.json(
        { error: "Digite o enunciado da questão" },
        { status: 400 }
      );
    }

    if (
      tipo !== "MULTIPLA_ESCOLHA" &&
      tipo !== "DISCURSIVA"
    ) {
      return NextResponse.json(
        { error: "Tipo de questão inválido" },
        { status: 400 }
      );
    }

    /*
     * A interface trabalha com:
     * MULTIPLA_ESCOLHA
     * DISCURSIVA
     *
     * O Prisma utiliza:
     * multipla_escolha
     * discursiva
     *
     * Fazemos a conversão somente aqui, antes do create.
     */
    const tipoPrisma =
      tipo === "MULTIPLA_ESCOLHA"
        ? "multipla_escolha"
        : "discursiva";

    if (!Number.isFinite(valor) || valor <= 0) {
      return NextResponse.json(
        {
          error:
            "O valor da questão precisa ser maior que zero",
        },
        { status: 400 }
      );
    }

    let alternativasValidas: {
      texto: string;
      correta: boolean;
    }[] = [];

    if (tipo === "MULTIPLA_ESCOLHA") {
      alternativasValidas = alternativasRecebidas
        .map((alt) => ({
          texto: String(alt.texto || "").trim(),
          correta: Boolean(alt.correta),
        }))
        .filter((alt) => alt.texto.length > 0);

      if (alternativasValidas.length < 2) {
        return NextResponse.json(
          {
            error:
              "Questão de múltipla escolha precisa ter pelo menos 2 alternativas",
          },
          { status: 400 }
        );
      }

      const corretas = alternativasValidas.filter(
        (alt) => alt.correta
      );

      if (corretas.length !== 1) {
        return NextResponse.json(
          {
            error:
              "Marque exatamente uma alternativa correta para a questão de múltipla escolha",
          },
          { status: 400 }
        );
      }
    }

    const last = await prisma.questao.findFirst({
      where: {
        provaId,
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        ordem: "desc",
      },
      select: {
        ordem: true,
      },
    });

    const novaOrdem = last ? last.ordem + 1 : 1;

    const questao = await prisma.questao.create({
      data: {
        enunciado,

        // Valor compatível com o enum QuestaoTipo do Prisma
        tipo: tipoPrisma,

        valor,

        respostaModelo:
          tipo === "DISCURSIVA" && respostaModelo
            ? respostaModelo
            : null,

        ordem: novaOrdem,

        provaId,

        instituicaoId: user.instituicaoId,

        alternativas:
          tipo === "MULTIPLA_ESCOLHA"
            ? {
                create: alternativasValidas.map(
                  (alt, index) => ({
                    texto: alt.texto,
                    correta: alt.correta,
                    ordem: index + 1,
                    instituicaoId: user.instituicaoId,
                  })
                ),
              }
            : undefined,
      },

      include: {
        alternativas: {
          orderBy: {
            ordem: "asc",
          },
        },
      },
    });

    return NextResponse.json(questao, {
      status: 201,
    });
  } catch (e: any) {
    console.error(
      "Erro ao criar questão:",
      e
    );

    return NextResponse.json(
      {
        error:
          e.message ||
          "Erro ao criar questão",
      },
      { status: 500 }
    );
  }
}