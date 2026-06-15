import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

const PAGINAS_PADRAO = [
  { portal: "ALUNO", chavePagina: "aluno.painel", nome: "Painel" },
  { portal: "ALUNO", chavePagina: "aluno.disciplinas", nome: "Disciplinas" },
  { portal: "ALUNO", chavePagina: "aluno.progresso", nome: "Progresso" },
  { portal: "ALUNO", chavePagina: "aluno.trabalhos", nome: "Trabalhos" },
  { portal: "ALUNO", chavePagina: "aluno.presenca", nome: "Presença" },
  { portal: "ALUNO", chavePagina: "aluno.boletim", nome: "Boletim" },
  { portal: "ALUNO", chavePagina: "aluno.certificados", nome: "Certificados" },
  { portal: "ALUNO", chavePagina: "aluno.historico", nome: "Histórico Acadêmico" },
  { portal: "ALUNO", chavePagina: "aluno.reunioes", nome: "Reuniões" },
  { portal: "ALUNO", chavePagina: "aluno.ouvidoria", nome: "Ouvidoria" },
  { portal: "ALUNO", chavePagina: "aluno.dados", nome: "Atualizar meus dados" },

  { portal: "PROFESSOR", chavePagina: "professor.painel", nome: "Painel" },
  { portal: "PROFESSOR", chavePagina: "professor.turmas", nome: "Turmas" },
  { portal: "PROFESSOR", chavePagina: "professor.alunos", nome: "Alunos" },
  { portal: "PROFESSOR", chavePagina: "professor.atividades", nome: "Atividades" },
  { portal: "PROFESSOR", chavePagina: "professor.provas", nome: "Avaliações/Provas" },
  { portal: "PROFESSOR", chavePagina: "professor.trabalhos", nome: "Trabalhos" },
  { portal: "PROFESSOR", chavePagina: "professor.reunioes", nome: "Reuniões" },
  { portal: "PROFESSOR", chavePagina: "professor.ouvidoria", nome: "Ouvidoria" },
  { portal: "PROFESSOR", chavePagina: "professor.materiais", nome: "Materiais/Aulas" },
];

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "ADMIN" && user.role !== "admin")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const existentes = await prisma.configuracaoPortalInstituicao.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: [{ portal: "asc" }, { chavePagina: "asc" }],
    });

    const mapa = new Map<
  string,
  {
    id: number;
    portal: string;
    chavePagina: string;
    visivel: boolean;
  }
>(
  existentes.map((item) => [
    `${item.portal}:${item.chavePagina}`,
    {
      id: item.id,
      portal: item.portal,
      chavePagina: item.chavePagina,
      visivel: item.visivel,
    },
  ])
);

    const paginas = PAGINAS_PADRAO.map((pagina) => {
      const existente = mapa.get(`${pagina.portal}:${pagina.chavePagina}`);

      return {
        ...pagina,
        id: existente?.id ?? null,
        visivel: existente?.visivel ?? true,
      };
    });

    return NextResponse.json({
      ok: true,
      paginas,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar configurações dos portais" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "ADMIN" && user.role !== "admin")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const paginas = Array.isArray(body?.paginas) ? body.paginas : [];

    for (const item of paginas) {
      const portal = String(item.portal || "").toUpperCase();
      const chavePagina = String(item.chavePagina || "").trim();
      const visivel = Boolean(item.visivel);

      if (!portal || !chavePagina) continue;

      await prisma.configuracaoPortalInstituicao.upsert({
        where: {
          instituicaoId_portal_chavePagina: {
            instituicaoId: user.instituicaoId,
            portal,
            chavePagina,
          },
        },
        update: {
          visivel,
        },
        create: {
          instituicaoId: user.instituicaoId,
          portal,
          chavePagina,
          visivel,
        },
      });
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao salvar configurações dos portais" },
      { status: 500 }
    );
  }
}