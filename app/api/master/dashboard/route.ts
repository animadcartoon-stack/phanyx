import { resumirDashboardMaster } from "@/lib/master/resumo-dashboard";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function normalizarTexto(valor: string | null | undefined) {
  return String(valor || "").trim().toUpperCase();
}

type OperacaoAsaasMaster = {
  id: string;
  tipo: "ADESAO_INSTITUICAO" | "MATRICULA_IBE" | "CHECKOUT_PHANYX";
  nomeResponsavel: string;
  nomeInstituicao: string;
  email: string;
  telefone: string | null;
  plano: string;
  valor: number;
  status: string;
  createdAt: Date;
  instituicaoId: number | null;
  asaasId: string | null;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const [
      todasAdesoes,
      todasInstituicoes,
      matriculasOnlineIbe,
      checkoutPagamentos,
    ] = await prisma.$transaction([
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

      prisma.matriculaOnlineIbe.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nome: true,
          email: true,
          whatsapp: true,
          valorTotal: true,
          disciplinasIds: true,
          status: true,
          externalReference: true,
          asaasPaymentId: true,
          createdAt: true,
        },
      }),

      prisma.checkoutPagamento.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nome: true,
          email: true,
          valor: true,
          status: true,
          asaasId: true,
          asaasPaymentId: true,
          createdAt: true,
        },
      }),
    ], { isolationLevel: "RepeatableRead" });

    const instituicoesCadastradas = todasInstituicoes;
    const adesoesInstitucionais = todasAdesoes;

    const operacoesAdesaoInstituicao: OperacaoAsaasMaster[] = adesoesInstitucionais.map(
      (adesao) => ({
        id: adesao.id,
        tipo: "ADESAO_INSTITUICAO",
        nomeResponsavel: adesao.nomeResponsavel,
        nomeInstituicao: adesao.nomeInstituicao,
        email: adesao.email,
        telefone: adesao.telefone || null,
        plano: adesao.plano,
        valor: Number(adesao.valor || 0),
        status: adesao.status,
        createdAt: adesao.createdAt,
        instituicaoId: adesao.instituicaoId,
        asaasId: adesao.asaasId || null,
      })
    );

    const operacoesMatriculaIbe: OperacaoAsaasMaster[] = matriculasOnlineIbe
      .filter((matricula) => matricula.asaasPaymentId)
      .map((matricula) => ({
        id: `MATRICULA-IBE-${matricula.id}`,
        tipo: "MATRICULA_IBE",
        nomeResponsavel: matricula.nome,
        nomeInstituicao: "IBE • Bacharel Livre em Teologia",
        email: matricula.email,
        telefone: matricula.whatsapp || null,
        plano: "Bacharel Livre em Teologia",
        valor: Number(matricula.valorTotal || 0),
        status: matricula.status,
        createdAt: matricula.createdAt,
        instituicaoId: null,
        asaasId: matricula.asaasPaymentId || matricula.externalReference || null,
      }));

    const operacoesCheckoutPhanyx: OperacaoAsaasMaster[] = checkoutPagamentos
      .filter((checkout) => checkout.asaasId || checkout.asaasPaymentId)
      .map((checkout) => ({
        id: `CHECKOUT-${checkout.id}`,
        tipo: "CHECKOUT_PHANYX",
        nomeResponsavel: checkout.nome,
        nomeInstituicao: "Checkout PHANYX",
        email: checkout.email,
        telefone: null,
        plano: "Checkout PHANYX",
        valor: Number(checkout.valor || 0),
        status: checkout.status,
        createdAt: checkout.createdAt,
        instituicaoId: null,
        asaasId: checkout.asaasPaymentId || checkout.asaasId || null,
      }));

    const operacoesAsaas = [
      ...operacoesAdesaoInstituicao,
      ...operacoesMatriculaIbe,
      ...operacoesCheckoutPhanyx,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const buscaNormalizada = busca.toLowerCase();

    const operacoesFiltradas = operacoesAsaas.filter((operacao) => {
      const bateBusca =
        !buscaNormalizada ||
        String(operacao.nomeInstituicao || "")
          .toLowerCase()
          .includes(buscaNormalizada) ||
        String(operacao.nomeResponsavel || "")
          .toLowerCase()
          .includes(buscaNormalizada) ||
        String(operacao.email || "").toLowerCase().includes(buscaNormalizada) ||
        String(operacao.telefone || "")
          .toLowerCase()
          .includes(buscaNormalizada) ||
        String(operacao.plano || "").toLowerCase().includes(buscaNormalizada) ||
        String(operacao.status || "")
          .toLowerCase()
          .includes(buscaNormalizada) ||
        String(operacao.tipo || "").toLowerCase().includes(buscaNormalizada) ||
        String(operacao.asaasId || "").toLowerCase().includes(buscaNormalizada);

      const bateStatus =
        !status ||
        status === "TODOS" ||
        normalizarTexto(operacao.status) === status;

      const batePlano =
        !plano ||
        plano === "TODOS" ||
        normalizarTexto(operacao.plano) === plano;

      return bateBusca && bateStatus && batePlano;
    });

    const instituicoesFiltradas = instituicoesCadastradas.filter((instituicao) => {
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

    const resumo = resumirDashboardMaster(instituicoesCadastradas, operacoesAsaas);

    const planosDisponiveis = Array.from(
      new Set(
        [
          ...operacoesAsaas.map((item) => String(item.plano || "").trim()),
          ...instituicoesCadastradas.map((item) => String(item.plano || "").trim()),
        ].filter(Boolean)
      )
    ).sort();

    const statusDisponiveis = Array.from(
      new Set(
        operacoesAsaas
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
      geradoEm: new Date().toISOString(),
      resumo: {
        ...resumo,
        totalInstituicoesFiltradas: instituicoesFiltradas.length,
        totalAdesoesFiltradas: operacoesFiltradas.length,
      },
      diagnostico: {
        leitura: "CADASTRO_SEM_CLASSIFICACAO_TESTE_PRODUCAO",
        conciliadoComProvedor: false,
        totalInstituicoesNoBanco: todasInstituicoes.length,
        totalAdesoesInstitucionaisNoBanco: todasAdesoes.length,
        totalMatriculasOnlineIbeNoBanco: matriculasOnlineIbe.length,
        totalCheckoutPagamentosNoBanco: checkoutPagamentos.length,
      },
      opcoes: {
        planos: planosDisponiveis,
        status: statusDisponiveis,
      },
      instituicoes: instituicoesFiltradas.slice(0, 50),
      adesoes: operacoesFiltradas.slice(0, 50),
    }, { headers: { "Cache-Control": "private, no-store" } });
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