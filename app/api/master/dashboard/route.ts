import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function normalizarTexto(valor: string | null | undefined) {
  return String(valor || "").trim().toUpperCase();
}

function normalizarChave(valor: string | null | undefined) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ehInstituicaoRealPHANYX(instituicao: {
  nome?: string | null;
  slug?: string | null;
}) {
  const nome = normalizarChave(instituicao.nome);
  const slug = normalizarChave(instituicao.slug);

  return (
    slug === "IBE" ||
    slug === "CREIA-KIDS" ||
    nome === "IBE" ||
    nome.includes("INSTITUTO BATISTA DE EDUCACAO") ||
    nome.includes("CREIA KIDS")
  );
}

function ehAdesaoRealPHANYX(
  adesao: {
    nomeInstituicao?: string | null;
    instituicaoId?: number | null;
  },
  idsInstituicoesReais: Set<number>
) {
  const instituicaoId = adesao.instituicaoId
    ? Number(adesao.instituicaoId)
    : null;

  if (instituicaoId && idsInstituicoesReais.has(instituicaoId)) {
    return true;
  }
  const nomeInstituicao = normalizarChave(adesao.nomeInstituicao);

  return (
    nomeInstituicao === "IBE" ||
    nomeInstituicao.includes("INSTITUTO BATISTA DE EDUCACAO") ||
    nomeInstituicao.includes("CREIA KIDS")
  );
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
          ativo: true,
          statusAssinatura: true,
          isentaPagamento: true,
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

    const instituicoesReais = todasInstituicoes.filter((instituicao) =>
      ehInstituicaoRealPHANYX(instituicao)
    );

    const idsInstituicoesReais = new Set<number>(
  instituicoesReais.map((instituicao) => Number(instituicao.id))
);

    const idsInstituicoesIsentas = new Set<number>(
  instituicoesReais
    .filter((instituicao) => Boolean(instituicao.isentaPagamento))
    .map((instituicao) => Number(instituicao.id))
);

    const adesoesReais = todasAdesoes.filter((adesao) =>
      ehAdesaoRealPHANYX(adesao, idsInstituicoesReais)
    );

    const buscaNormalizada = busca.toLowerCase();

    const adesoesFiltradas = adesoesReais.filter((adesao) => {
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
        !status ||
        status === "TODOS" ||
        normalizarTexto(adesao.status) === status;

      const batePlano =
        !plano ||
        plano === "TODOS" ||
        normalizarTexto(adesao.plano) === plano;

      return bateBusca && bateStatus && batePlano;
    });

    const instituicoesFiltradas = instituicoesReais.filter((instituicao) => {
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

    const totalInstituicoes = instituicoesReais.length;
    const totalAdesoes = adesoesReais.length;

    const totalPagas = adesoesReais.filter(
      (item) => normalizarTexto(item.status) === "PAGO"
    ).length;

    const totalPendentes = adesoesReais.filter((item) => {
      const statusAtual = normalizarTexto(item.status);
      return statusAtual === "PENDING" || statusAtual === "PENDENTE";
    }).length;

    const totalComInstituicaoCriada = instituicoesReais.length;

    const faturamentoPago = adesoesReais
      .filter((item) => {
        const pago = normalizarTexto(item.status) === "PAGO";

        if (!pago) return false;

        if (
          item.instituicaoId &&
          idsInstituicoesIsentas.has(item.instituicaoId)
        ) {
          return false;
        }

        return true;
      })
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const faturamentoPrevisto = adesoesReais
      .filter((item) => {
        if (
          item.instituicaoId &&
          idsInstituicoesIsentas.has(item.instituicaoId)
        ) {
          return false;
        }

        return true;
      })
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const planosDisponiveis = Array.from(
      new Set(
        [
          ...adesoesReais.map((item) => String(item.plano || "").trim()),
          ...instituicoesReais.map((item) => String(item.plano || "").trim()),
        ].filter(Boolean)
      )
    ).sort();

    const statusDisponiveis = Array.from(
      new Set(
        adesoesReais
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
      diagnostico: {
        leitura: "OPERACIONAL_REAL",
        instituicoesConsideradasReais: instituicoesReais.map((item) => ({
          id: item.id,
          nome: item.nome,
          slug: item.slug,
          plano: item.plano,
          isentaPagamento: item.isentaPagamento,
        })),
        totalInstituicoesNoBanco: todasInstituicoes.length,
        totalAdesoesNoBanco: todasAdesoes.length,
        instituicoesIgnoradasComoTeste:
          todasInstituicoes.length - instituicoesReais.length,
        adesoesIgnoradasComoTeste: todasAdesoes.length - adesoesReais.length,
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