import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function normalizarTexto(valor: string | null | undefined) {
  return String(valor || "").trim().toUpperCase();
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const usuarioMaster = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        isMasterAdmin: true,
        role: true,
        nome: true,
        email: true,
      },
    });

    if (!usuarioMaster || !usuarioMaster.isMasterAdmin) {
      return NextResponse.json(
        { error: "Sem permissão para acessar o painel master." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const busca = String(searchParams.get("busca") || "").trim();
    const status = normalizarTexto(searchParams.get("status"));
    const plano = normalizarTexto(searchParams.get("plano"));

    const [todasAdesoes, todasInstituicoes] = await Promise.all([
      prisma.adesaoInstituicao.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nomeResponsavel: true,
          nomeInstituicao: true,
          email: true,
          telefone: true,
          plano: true,
          valor: true,
          status: true,
          createdAt: true,
          instituicaoId: true,
          asaasId: true,
        },
      }),
      prisma.instituicao.findMany({
        orderBy: { id: "desc" },
        select: {
          id: true,
          nome: true,
          slug: true,
          plano: true,
          createdAt: true,
          _count: {
            select: {
              alunos: true,
              professores: true,
            },
          },
        },
      }),
    ]);

    const buscaNormalizada = busca.toLowerCase();

    const adesoesFiltradas = todasAdesoes.filter((adesao) => {
      const bateBusca =
        !buscaNormalizada ||
        String(adesao.nomeInstituicao || "")
          .toLowerCase()
          .includes(buscaNormalizada) ||
        String(adesao.nomeResponsavel || "")
          .toLowerCase()
          .includes(buscaNormalizada) ||
        String(adesao.email || "").toLowerCase().includes(buscaNormalizada) ||
        String(adesao.telefone || "")
          .toLowerCase()
          .includes(buscaNormalizada) ||
        String(adesao.plano || "").toLowerCase().includes(buscaNormalizada) ||
        String(adesao.status || "").toLowerCase().includes(buscaNormalizada);

      const bateStatus =
        !status || status === "TODOS" || normalizarTexto(adesao.status) === status;

      const batePlano =
        !plano || plano === "TODOS" || normalizarTexto(adesao.plano) === plano;

      return bateBusca && bateStatus && batePlano;
    });

    const instituicoesFiltradas = todasInstituicoes.filter((instituicao) => {
      const bateBusca =
        !buscaNormalizada ||
        String(instituicao.nome || "")
          .toLowerCase()
          .includes(buscaNormalizada) ||
        String(instituicao.slug || "")
          .toLowerCase()
          .includes(buscaNormalizada) ||
        String(instituicao.plano || "")
          .toLowerCase()
          .includes(buscaNormalizada);

      const batePlano =
        !plano ||
        plano === "TODOS" ||
        normalizarTexto(instituicao.plano) === plano;

      return bateBusca && batePlano;
    });

    const totalInstituicoes = todasInstituicoes.length;
    const totalAdesoes = todasAdesoes.length;
    const totalPagas = todasAdesoes.filter(
      (item) => normalizarTexto(item.status) === "PAGO"
    ).length;
    const totalPendentes = todasAdesoes.filter(
      (item) => normalizarTexto(item.status) === "PENDING"
    ).length;
    const totalComInstituicaoCriada = todasAdesoes.filter(
      (item) => item.instituicaoId !== null
    ).length;

    const faturamentoPago = todasAdesoes
      .filter((item) => normalizarTexto(item.status) === "PAGO")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const faturamentoPrevisto = todasAdesoes.reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0
    );

    const planosDisponiveis = Array.from(
      new Set(
        todasAdesoes
          .map((item) => String(item.plano || "").trim())
          .filter(Boolean)
      )
    ).sort();

    const statusDisponiveis = Array.from(
      new Set(
        todasAdesoes
          .map((item) => String(item.status || "").trim())
          .filter(Boolean)
      )
    ).sort();

    return NextResponse.json({
      success: true,
      filtros: {
        busca,
        status: status || "TODOS",
        plano: plano || "TODOS",
      },
      resumo: {
        totalInstituicoes,
        totalAdesoes,
        totalPagas,
        totalPendentes,
        totalComInstituicaoCriada,
        faturamentoPago,
        faturamentoPrevisto,
        totalInstituicoesFiltradas: instituicoesFiltradas.length,
        totalAdesoesFiltradas: adesoesFiltradas.length,
      },
      opcoes: {
        planos: planosDisponiveis,
        status: statusDisponiveis,
      },
      instituicoes: instituicoesFiltradas.slice(0, 50),
      adesoes: adesoesFiltradas.slice(0, 50),
    });
  } catch (error: any) {
    console.error("ERRO DASHBOARD MASTER:", error);

    return NextResponse.json(
      {
        error: "Erro ao carregar dashboard master.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}