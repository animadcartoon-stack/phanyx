"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PhanyxTour from "@/components/tutorial/PhanyxTour";

type ResumoFinanceiro = {
  quantidadeLancamentos: number;
  totalLancado: number;
  totalPago: number;
  totalPendente: number;
  totalAtrasado: number;
  alunosInadimplentes: number;
};

function hojeInput() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));
}

function primeiroDiaMes() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

export default function AdminFinanceiroPage() {
  const router = useRouter();

  const [loadingAtualizacao, setLoadingAtualizacao] = useState(false);
  const [loadingResumo, setLoadingResumo] = useState(true);
  const [loadingMensalidades, setLoadingMensalidades] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    quantidadeLancamentos: 0,
    totalLancado: 0,
    totalPago: 0,
    totalPendente: 0,
    totalAtrasado: 0,
    alunosInadimplentes: 0,
  });

  async function gerarMensalidades() {
    try {
      setLoadingMensalidades(true);
      setMensagem("");
      setErro("");

      const res = await fetch(
        "/api/admin/financeiro/lancamentos/gerar-mensalidades",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            mes: new Date().getMonth() + 1,
            ano: new Date().getFullYear(),
            diaVencimento: 10,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao gerar mensalidades");
      }

      setMensagem(data?.message || "Mensalidades geradas com sucesso.");
      await carregarResumo();
    } catch (err: any) {
      console.error(err);
      setErro(err?.message || "Erro ao gerar mensalidades");
    } finally {
      setLoadingMensalidades(false);
    }
  }

  async function carregarResumo() {
  try {
    setLoadingResumo(true);
    setErro("");

      const inicio = primeiroDiaMes();
      const fim = hojeInput();

      const res = await fetch(
        `/api/admin/financeiro/relatorios?inicio=${inicio}&fim=${fim}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar resumo financeiro");
      }

      setResumo(data.resumo);
setErro("");
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar resumo financeiro");
    } finally {
      setLoadingResumo(false);
    }
  }

  useEffect(() => {
    carregarResumo();
  }, []);

  async function atualizarStatusFinanceiro() {
    try {
      setLoadingAtualizacao(true);
      setMensagem("");
      setErro("");

      const res = await fetch(
        "/api/admin/financeiro/lancamentos/atualizar-status",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao atualizar status financeiro");
      }

      setMensagem(
  `Atualização concluída. Alunos inadimplentes: ${
    data.resumo?.totalAlunosInadimplentes ?? 0
  }. Lançamentos em atraso recalculados com sucesso.`
);

      await carregarResumo();
    } catch (e: any) {
      setErro(e?.message || "Erro ao atualizar status financeiro");
    } finally {
      setLoadingAtualizacao(false);
    }
  }

  return (
    <div className="max-w-7xl space-y-6 p-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">💰 Financeiro</h1>
            <p className="mt-1 text-sm text-slate-600">
              Gerencie recebimentos, mensalidades, taxas, inadimplência e fechamento de caixa.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={gerarMensalidades}
              disabled={loadingMensalidades}
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loadingMensalidades ? "Gerando mensalidades..." : "Gerar mensalidades"}
            </button>

            <button
              onClick={atualizarStatusFinanceiro}
              disabled={loadingAtualizacao}
              className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {loadingAtualizacao
                ? "Atualizando..."
                : "Atualizar atrasos / inadimplência"}
            </button>
          </div>
        </div>
      </div>

      {mensagem && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 shadow-sm">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          {erro}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Recebido no período
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {loadingResumo ? "..." : `R$ ${Number(resumo.totalPago || 0).toFixed(2)}`}
          </p>
        </div>



<div className="rounded-2xl border bg-white p-5 shadow-sm">
  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
    Total lançado
  </p>
  <p className="mt-3 text-3xl font-bold text-slate-900">
    {loadingResumo ? "..." : formatarMoeda(resumo.totalLancado || 0)}
  </p>
</div>

<div className="rounded-2xl border bg-white p-5 shadow-sm">
  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
    Lançamentos
  </p>
  <p className="mt-3 text-3xl font-bold text-slate-900">
    {loadingResumo ? "..." : resumo.quantidadeLancamentos}
  </p>
</div>



        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Pendências
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {loadingResumo ? "..." : formatarMoeda(resumo.totalPendente || 0)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Em atraso
          </p>
          <p className="mt-3 text-3xl font-bold text-red-600">
            {loadingResumo ? "..." : formatarMoeda(resumo.totalAtrasado || 0)}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Alunos inadimplentes
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {loadingResumo ? "..." : resumo.alunosInadimplentes}
          </p>
        </div>
      </div>

<div className="rounded-2xl border bg-white p-6 shadow-sm">
  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Resumo executivo do período
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Visão rápida da saúde financeira da instituição no período atual.
      </p>
    </div>
  </div>

  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Situação geral
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">
        {loadingResumo
          ? "Carregando..."
          : resumo.totalAtrasado > 0
          ? "Existem valores em atraso que exigem acompanhamento."
          : "Sem atrasos relevantes no período."}
      </p>
    </div>

    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Cobrança
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">
        {loadingResumo
          ? "Carregando..."
          : `${resumo.alunosInadimplentes} aluno(s) inadimplente(s) no período.`}
      </p>
    </div>

    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Volume financeiro
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">
        {loadingResumo
          ? "Carregando..."
          : `${formatarMoeda(resumo.totalLancado || 0)} lançados no período.`}
      </p>
    </div>

    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Recebimento
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">
        {loadingResumo
          ? "Carregando..."
          : `${formatarMoeda(resumo.totalPago || 0)} recebidos até agora.`}
      </p>
    </div>
  </div>
</div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Operação financeira
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Movimente cobranças, caixa e rotinas operacionais do dia a dia.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <button
              data-tour="financeiro-recebimentos"
              onClick={() => router.push("/admin/financeiro/recebimentos")}
              className="rounded-2xl border p-5 text-left transition hover:border-blue-400 hover:bg-slate-50"
            >
              <p className="text-lg font-semibold text-slate-900">💵 Recebimentos</p>
              <p className="mt-2 text-sm text-slate-600">
                Buscar cobranças, registrar pagamentos e acompanhar baixas.
              </p>
            </button>

            <button
              data-tour="financeiro-caixa"
              onClick={() => router.push("/admin/financeiro/caixa")}
              className="rounded-2xl border p-5 text-left transition hover:border-blue-400 hover:bg-slate-50"
            >
              <p className="text-lg font-semibold text-slate-900">🏦 Caixa</p>
              <p className="mt-2 text-sm text-slate-600">
                Abrir caixa, registrar movimentos e fazer fechamento.
              </p>
            </button>

            <button
              onClick={() => router.push("/admin/financeiro/taxas")}
              className="rounded-2xl border p-5 text-left transition hover:border-blue-400 hover:bg-slate-50"
            >
              <p className="text-lg font-semibold text-slate-900">🧾 Taxas</p>
              <p className="mt-2 text-sm text-slate-600">
                Matrícula, trancamento, aula extra e cobranças avulsas.
              </p>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Rotinas automáticas
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Ações rápidas para manter o financeiro atualizado.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={gerarMensalidades}
              disabled={loadingMensalidades}
              className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left transition hover:bg-blue-100 disabled:opacity-60"
            >
              <div className="font-semibold text-slate-900">Gerar mensalidades</div>
              <div className="mt-1 text-sm text-slate-600">
                Cria mensalidades do mês atual para os alunos elegíveis.
              </div>
            </button>

            <button
              onClick={atualizarStatusFinanceiro}
              disabled={loadingAtualizacao}
              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left transition hover:bg-red-100 disabled:opacity-60"
            >
              <div className="font-semibold text-slate-900">
                Atualizar atrasos e inadimplência
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Recalcula lançamentos vencidos e status dos alunos.
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Controle e cobrança
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Monitore atrasos, histórico e parâmetros financeiros da instituição.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <button
            data-tour="financeiro-inadimplentes"
            onClick={() => router.push("/admin/financeiro/inadimplentes")}
            className="rounded-2xl border p-5 text-left transition hover:border-blue-400 hover:bg-slate-50"
          >
            <p className="text-lg font-semibold text-slate-900">🚨 Inadimplentes</p>
            <p className="mt-2 text-sm text-slate-600">
              Visualize alunos com atraso e acompanhe cobranças.
            </p>
          </button>

          <button
            onClick={() => router.push("/admin/financeiro/historico")}
            className="rounded-2xl border p-5 text-left transition hover:border-blue-400 hover:bg-slate-50"
          >
            <p className="text-lg font-semibold text-slate-900">📝 Histórico</p>
            <p className="mt-2 text-sm text-slate-600">
              Consulte registros automáticos e manuais de cobrança.
            </p>
          </button>

          <button
            onClick={() => router.push("/admin/financeiro/configuracoes")}
            className="rounded-2xl border p-5 text-left transition hover:border-blue-400 hover:bg-slate-50"
          >
            <p className="text-lg font-semibold text-slate-900">⚙️ Configurações</p>
            <p className="mt-2 text-sm text-slate-600">
              Juros, multa, tolerância e regras por instituição.
            </p>
          </button>

          <button
            data-tour="financeiro-fechamento"
            onClick={() => router.push("/admin/financeiro/fechamento-geral")}
            className="rounded-2xl border p-5 text-left transition hover:border-blue-400 hover:bg-slate-50"
          >
            <p className="text-lg font-semibold text-slate-900">📦 Fechamento Geral</p>
            <p className="mt-2 text-sm text-slate-600">
              Consolidação dos caixas fechados por data.
            </p>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Relatórios e gestão
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Acompanhe indicadores e visão gerencial do financeiro.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <button
            data-tour="financeiro-relatorios"
            onClick={() => router.push("/admin/financeiro/relatorios")}
            className="rounded-2xl border p-5 text-left transition hover:border-blue-400 hover:bg-slate-50"
          >
            <p className="text-lg font-semibold text-slate-900">📊 Relatórios</p>
            <p className="mt-2 text-sm text-slate-600">
              Acompanhe recebimentos, caixa e desempenho financeiro.
            </p>

          </button>
        </div>
      </div>
      <PhanyxTour
  storageKey="phanyx-tour-financeiro"
  tituloFinal="Financeiro pronto para uso 💰"
  descricaoFinal="Você conheceu os principais módulos financeiros do PHANYX."
  textoBotaoFinal="Ir para recebimentos"
  onFinalPrimaryClick={() => {
    router.push("/admin/financeiro/recebimentos");
  }}
  steps={[
    {
      id: "recebimentos",
      titulo: "Recebimentos",
      subtitulo: "Aqui você acompanha cobranças e pagamentos.",
      descricao:
        "Use esta área para buscar cobranças, registrar pagamentos e acompanhar baixas dos alunos.",
      target: "[data-tour='financeiro-recebimentos']",
    },
    {
      id: "caixa",
      titulo: "Caixa",
      subtitulo: "Controle o movimento financeiro do dia.",
      descricao:
        "Aqui você abre caixa, registra entradas e saídas e faz o fechamento diário.",
      target: "[data-tour='financeiro-caixa']",
    },
    {
      id: "inadimplentes",
      titulo: "Inadimplentes",
      subtitulo: "Acompanhe alunos com pagamentos vencidos.",
      descricao:
        "Esta tela ajuda a visualizar cobranças em atraso e acompanhar ações de cobrança.",
      target: "[data-tour='financeiro-inadimplentes']",
    },
    {
      id: "fechamento",
      titulo: "Fechamento geral",
      subtitulo: "Consolide os caixas fechados.",
      descricao:
        "Aqui a instituição acompanha os fechamentos de caixa por data e confere diferenças.",
      target: "[data-tour='financeiro-fechamento']",
    },
    {
      id: "relatorios",
      titulo: "Relatórios financeiros",
      subtitulo: "Veja indicadores e desempenho financeiro.",
      descricao:
        "Use relatórios para acompanhar recebimentos, atrasos, pendências e exportações.",
      target: "[data-tour='financeiro-relatorios']",
    },
  ]}
/>
    </div>
  );
}