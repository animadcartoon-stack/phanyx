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

function statusEhPago(status: string | null | undefined) {
  const valor = normalizarTexto(status);

  return [
    "PAGO",
    "PAID",
    "RECEIVED",
    "CONFIRMED",
    "CONFIRMADO",
    "APROVADO",
  ].includes(valor);
}

function statusEhPendente(status: string | null | undefined) {
  const valor = normalizarTexto(status);

  return [
    "PENDING",
    "PENDENTE",
    "AGUARDANDO_PAGAMENTO",
    "AGUARDANDO PAGAMENTO",
  ].includes(valor);
}

function statusEhCanceladoOuErro(status: string | null | undefined) {
  const valor = normalizarTexto(status);

  return [
    "CANCELADO",
    "CANCELED",
    "CANCELLED",
    "ERRO",
    "ERROR",
    "FAILED",
    "FALHOU",
    "EXPIRADO",
    "EXPIRED",
  ].includes(valor);
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
    ] = await Promise.all([
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

    const operacoesAdesaoInstituicao: OperacaoAsaasMaster[] = adesoesReais.map(
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
    const totalAdesoes = operacoesAsaas.length;

    const totalPagas = operacoesAsaas.filter((item) =>
      statusEhPago(item.status)
    ).length;

    const totalPendentes = operacoesAsaas.filter((item) =>
      statusEhPendente(item.status)
    ).length;

    const totalComInstituicaoCriada = instituicoesReais.length;

    const faturamentoPago = operacoesAsaas
      .filter((item) => {
        if (!statusEhPago(item.status)) return false;

        if (
          item.tipo === "ADESAO_INSTITUICAO" &&
          item.instituicaoId &&
          idsInstituicoesIsentas.has(Number(item.instituicaoId))
        ) {
          return false;
        }

        return true;
      })
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const faturamentoPrevisto = operacoesAsaas
      .filter((item) => {
        if (statusEhCanceladoOuErro(item.status)) return false;

        if (
          item.tipo === "ADESAO_INSTITUICAO" &&
          item.instituicaoId &&
          idsInstituicoesIsentas.has(Number(item.instituicaoId))
        ) {
          return false;
        }

        return true;
      })
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const planosDisponiveis = Array.from(
      new Set(
        [
          ...operacoesAsaas.map((item) => String(item.plano || "").trim()),
          ...instituicoesReais.map((item) => String(item.plano || "").trim()),
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
      resumo: {
        totalInstituicoes,
        totalAdesoes,
        totalPagas,
        totalPendentes,
        totalComInstituicaoCriada,
        faturamentoPago,
        faturamentoPrevisto,
        totalInstituicoesFiltradas: instituicoesFiltradas.length,
        totalAdesoesFiltradas: operacoesFiltradas.length,
      },
      diagnostico: {
        leitura: "OPERACIONAL_REAL_COM_ASAAS",
        instituicoesConsideradasReais: instituicoesReais.map((item) => ({
          id: item.id,
          nome: item.nome,
          slug: item.slug,
          plano: item.plano,
          isentaPagamento: item.isentaPagamento,
        })),
        totalInstituicoesNoBanco: todasInstituicoes.length,
        totalAdesoesInstitucionaisNoBanco: todasAdesoes.length,
        totalMatriculasOnlineIbeNoBanco: matriculasOnlineIbe.length,
        totalCheckoutPagamentosNoBanco: checkoutPagamentos.length,
        instituicoesIgnoradasComoTeste:
          todasInstituicoes.length - instituicoesReais.length,
        adesoesInstitucionaisIgnoradasComoTeste:
          todasAdesoes.length - adesoesReais.length,
        totalOperacoesAsaasReais: operacoesAsaas.length,
      },
      opcoes: {
        planos: planosDisponiveis,
        status: statusDisponiveis,
      },
      instituicoes: instituicoesFiltradas.slice(0, 50),
      adesoes: operacoesFiltradas.slice(0, 50),
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