import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

type ModoVisibilidadePortal =
  | "AUTOMATICO"
  | "SEMPRE_VISIVEL"
  | "OCULTO";

const CHAVE_REMATRICULA = "aluno.rematricula";

const PAGINAS_PADRAO = [
  {
    portal: "ALUNO",
    chavePagina: "aluno.painel",
    nome: "Painel",
  },
  {
    portal: "ALUNO",
    chavePagina: CHAVE_REMATRICULA,
    nome: "Rematrícula semestral",
  },
  {
    portal: "ALUNO",
    chavePagina: "aluno.disciplinas",
    nome: "Disciplinas",
  },
  {
    portal: "ALUNO",
    chavePagina: "aluno.progresso",
    nome: "Progresso",
  },
  {
    portal: "ALUNO",
    chavePagina: "aluno.trabalhos",
    nome: "Trabalhos",
  },
  {
    portal: "ALUNO",
    chavePagina: "aluno.presenca",
    nome: "Presença",
  },
  {
    portal: "ALUNO",
    chavePagina: "aluno.boletim",
    nome: "Boletim",
  },
  {
    portal: "ALUNO",
    chavePagina: "aluno.certificados",
    nome: "Certificados",
  },
  {
    portal: "ALUNO",
    chavePagina: "aluno.historico",
    nome: "Histórico Acadêmico",
  },
  {
    portal: "ALUNO",
    chavePagina: "aluno.reunioes",
    nome: "Reuniões",
  },
  {
    portal: "ALUNO",
    chavePagina: "aluno.ouvidoria",
    nome: "Ouvidoria",
  },
  {
    portal: "ALUNO",
    chavePagina: "aluno.dados",
    nome: "Atualizar meus dados",
  },

  {
    portal: "PROFESSOR",
    chavePagina: "professor.painel",
    nome: "Painel",
  },
  {
    portal: "PROFESSOR",
    chavePagina: "professor.substituicoes",
    nome: "Substituições Docentes",
  },
  {
    portal: "PROFESSOR",
    chavePagina: "professor.alunos",
    nome: "Alunos",
  },
  {
    portal: "PROFESSOR",
    chavePagina: "professor.atividades",
    nome: "Atividades",
  },
  {
    portal: "PROFESSOR",
    chavePagina: "professor.provas",
    nome: "Avaliações/Provas",
  },
  {
    portal: "PROFESSOR",
    chavePagina: "professor.trabalhos",
    nome: "Trabalhos",
  },
  {
    portal: "PROFESSOR",
    chavePagina: "professor.reunioes",
    nome: "Reuniões",
  },
  {
    portal: "PROFESSOR",
    chavePagina: "professor.ouvidoria",
    nome: "Ouvidoria",
  },
  {
    portal: "PROFESSOR",
    chavePagina: "professor.materiais",
    nome: "Materiais/Aulas",
  },
];

function podeGerenciarPortais(role?: string | null) {
  const roleNormalizada = String(role || "").toUpperCase();

  return (
    roleNormalizada === "ADMIN" ||
    roleNormalizada === "SUPER_ADMIN"
  );
}

function normalizarModoVisibilidade(
  valor: unknown,
  visivelLegado = false,
): ModoVisibilidadePortal {
  const modo = String(valor || "")
    .trim()
    .toUpperCase();

  if (
    modo === "AUTOMATICO" ||
    modo === "SEMPRE_VISIVEL" ||
    modo === "OCULTO"
  ) {
    return modo;
  }

  /*
   * Compatibilidade com o controle antigo:
   * ligado = sempre visível;
   * desligado = automático.
   */
  return visivelLegado
    ? "SEMPRE_VISIVEL"
    : "AUTOMATICO";
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciarPortais(user.role)) {
      return NextResponse.json(
        {
          error: "Sem permissão",
        },
        {
          status: 403,
        },
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        {
          error: "Usuário sem instituição vinculada.",
        },
        {
          status: 400,
        },
      );
    }

    const existentes =
      await prisma.configuracaoPortalInstituicao.findMany({
        where: {
          instituicaoId: user.instituicaoId,
        },
        orderBy: [
          {
            portal: "asc",
          },
          {
            chavePagina: "asc",
          },
        ],
      });

    type ConfiguracaoPortalMap = {
  id: number;
  portal: string;
  chavePagina: string;
  visivel: boolean;
  modoVisibilidade: string;
};

const mapa = new Map<string, ConfiguracaoPortalMap>(
  existentes.map((item) => [
    `${item.portal}:${item.chavePagina}`,
    {
      id: item.id,
      portal: item.portal,
      chavePagina: item.chavePagina,
      visivel: item.visivel,
      modoVisibilidade: item.modoVisibilidade,
    },
  ]),
);

    const paginas = PAGINAS_PADRAO.map(
      (pagina) => {
        const existente = mapa.get(
          `${pagina.portal}:${pagina.chavePagina}`,
        );

        const ehRematricula =
          pagina.chavePagina ===
          CHAVE_REMATRICULA;

        const modoVisibilidade =
          ehRematricula
            ? normalizarModoVisibilidade(
                existente?.modoVisibilidade,
                existente?.visivel,
              )
            : null;

        return {
          ...pagina,
          id: existente?.id ?? null,

          /*
           * Nas páginas comuns, continua sendo o
           * interruptor ligado/desligado.
           *
           * Na rematrícula, visivel=true representa
           * o modo SEMPRE_VISIVEL.
           */
          visivel: ehRematricula
            ? modoVisibilidade ===
              "SEMPRE_VISIVEL"
            : existente?.visivel ?? true,

          modoVisibilidade,
          controleAutomatico: ehRematricula,
        };
      },
    );

    return NextResponse.json({
      ok: true,
      paginas,
    });
  } catch (error) {
    console.error(
      "Erro ao carregar configurações dos portais:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao carregar configurações dos portais",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciarPortais(user.role)) {
      return NextResponse.json(
        {
          error: "Sem permissão",
        },
        {
          status: 403,
        },
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        {
          error: "Usuário sem instituição vinculada.",
        },
        {
          status: 400,
        },
      );
    }

    const body = await req.json();

    const paginas = Array.isArray(body?.paginas)
      ? body.paginas
      : [];

    for (const item of paginas) {
      const portal = String(
        item.portal || "",
      )
        .trim()
        .toUpperCase();

      const chavePagina = String(
        item.chavePagina || "",
      ).trim();

      if (!portal || !chavePagina) {
        continue;
      }

      const ehRematricula =
        portal === "ALUNO" &&
        chavePagina === CHAVE_REMATRICULA;

      if (ehRematricula) {
        const modoVisibilidade =
          normalizarModoVisibilidade(
            item.modoVisibilidade,
            Boolean(item.visivel),
          );

        const visivel =
          modoVisibilidade ===
          "SEMPRE_VISIVEL";

        await prisma.configuracaoPortalInstituicao.upsert(
          {
            where: {
              instituicaoId_portal_chavePagina:
                {
                  instituicaoId:
                    user.instituicaoId,
                  portal,
                  chavePagina,
                },
            },
            update: {
              visivel,
              modoVisibilidade,
            },
            create: {
              instituicaoId:
                user.instituicaoId,
              portal,
              chavePagina,
              visivel,
              modoVisibilidade,
            },
          },
        );

        continue;
      }

      const visivel = Boolean(item.visivel);

      await prisma.configuracaoPortalInstituicao.upsert(
        {
          where: {
            instituicaoId_portal_chavePagina:
              {
                instituicaoId:
                  user.instituicaoId,
                portal,
                chavePagina,
              },
          },
          update: {
            visivel,
          },
          create: {
            instituicaoId:
              user.instituicaoId,
            portal,
            chavePagina,
            visivel,
          },
        },
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Configurações dos portais salvas com sucesso.",
    });
  } catch (error) {
    console.error(
      "Erro ao salvar configurações dos portais:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao salvar configurações dos portais",
      },
      {
        status: 500,
      },
    );
  }
}