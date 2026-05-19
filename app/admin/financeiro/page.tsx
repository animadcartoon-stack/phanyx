"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

type ResumoFinanceiro = {
  quantidadeLancamentos: number;
  totalLancado: number;
  totalPago: number;
  totalPendente: number;
  totalAtrasado: number;
  alunosInadimplentes: number;
};

type FinanceiroTourStep = {
  id: string;
  selector: string;
  titulo: string;
  descricao: string;
  mascoteSrc: string;
  mascoteAlt: string;
  destaque?: string;
};

const financeiroTourSteps: FinanceiroTourStep[] = [
  {
    id: "recebimentos",
    selector: '[data-tour="financeiro-recebimentos"]',
    titulo: "Recebimentos",
    descricao:
      "Aqui você acompanha cobranças, registra pagamentos e controla baixas financeiras.",
    mascoteSrc: "/images/financeiro.png",
    mascoteAlt: "Mascote financeiro",
    destaque: "Vamos começar pelos recebimentos.",
  },
  {
    id: "caixa",
    selector: '[data-tour="financeiro-caixa"]',
    titulo: "Caixa",
    descricao:
      "Abra caixa, registre entradas e saídas e faça fechamento diário.",
    mascoteSrc: "/images/financeiro.png",
    mascoteAlt: "Calculadora financeira",
    destaque: "Controle financeiro diário.",
  },
  {
    id: "inadimplentes",
    selector: '[data-tour="financeiro-inadimplentes"]',
    titulo: "Inadimplentes",
    descricao:
      "Veja alunos em atraso e acompanhe cobranças pendentes.",
    mascoteSrc: "/images/calculadora.png",
    mascoteAlt: "Financeiro",
    destaque: "Acompanhe inadimplência.",
  },
  {
    id: "fechamento",
    selector: '[data-tour="financeiro-fechamento"]',
    titulo: "Fechamento Geral",
    descricao:
      "Consolidação de caixas fechados e conferência financeira.",
    mascoteSrc: "/images/calculadora.png",
    mascoteAlt: "Calculadora",
    destaque: "Fechamento consolidado.",
  },
  {
    id: "relatorios",
    selector: '[data-tour="financeiro-relatorios"]',
    titulo: "Relatórios",
    descricao:
      "Acompanhe indicadores, exportações e visão gerencial.",
    mascoteSrc: "/images/relatorios.png",
    mascoteAlt: "Relatórios",
    destaque: "Gestão estratégica.",
  },
];

function getRectFromSelector(selector: string) {
  const elemento = document.querySelector(selector);
  if (!elemento) return null;

  const rect = elemento.getBoundingClientRect();

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function FinanceiroTour({
  aberto,
  onClose,
}: {
  aberto: boolean;
  onClose: (naoMostrarNovamente?: boolean) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [tourConcluido, setTourConcluido] = useState(false);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const step = financeiroTourSteps[stepIndex];

  useEffect(() => {
    if (!aberto) return;

    function atualizarPosicao() {
      const rect = getRectFromSelector(step.selector);
      setTargetRect(rect);

      const elemento = document.querySelector(step.selector);
      if (elemento) {
        elemento.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }

    const timer = setTimeout(atualizarPosicao, 250);

    window.addEventListener("resize", atualizarPosicao);
    window.addEventListener("scroll", atualizarPosicao, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", atualizarPosicao);
      window.removeEventListener("scroll", atualizarPosicao, true);
    };
  }, [aberto, step]);

  useEffect(() => {
    if (!aberto) {
      setStepIndex(0);
      setTargetRect(null);
      setTourConcluido(false);
    }
  }, [aberto]);

  if (!aberto) return null;

  const spotlightPadding = 8;

  const spotlight =
    !tourConcluido && targetRect
      ? {
          top: Math.max(targetRect.top - spotlightPadding, 8),
          left: Math.max(targetRect.left - spotlightPadding, 8),
          width: targetRect.width + spotlightPadding * 2,
          height: targetRect.height + spotlightPadding * 2,
        }
      : null;

  const bubbleWidth = 420;
  const bubbleHeight = 290;

  const bubbleStyle = spotlight
    ? (() => {
        let top = spotlight.top + spotlight.height + 18;
        let left = spotlight.left;

        top = Math.max(
          16,
          Math.min(top, window.innerHeight - bubbleHeight - 16)
        );

        left = Math.max(
          16,
          Math.min(left, window.innerWidth - bubbleWidth - 16)
        );

        return {
          top: `${top}px`,
          left: `${left}px`,
        };
      })()
    : {
        top: "120px",
        left: "50%",
        transform: "translateX(-50%)",
      };

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-slate-950/70" />

      {spotlight && (
        <div
          className="absolute rounded-2xl border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.72)] transition-all"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}

      <div
        className="absolute w-[min(420px,calc(100vw-32px))] rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-2xl transition-all duration-300"
        style={
          tourConcluido
            ? {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }
            : bubbleStyle
        }
      >
        {!tourConcluido && (
          <div
            className="absolute h-3 w-3 rotate-45 border border-gray-200 bg-white shadow-sm"
            style={{
              left: "40px",
              top: "-6px",
            }}
          />
        )}

        {!tourConcluido ? (
          <>
            <div className="flex items-start gap-4">
              <img
                src={step.mascoteSrc}
                alt={step.mascoteAlt}
                className="h-32 w-32 shrink-0 object-contain drop-shadow-lg"
              />

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                  Tutorial financeiro
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {step.titulo}
                </h3>

                {step.destaque && (
                  <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                    {step.destaque}
                  </p>
                )}

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {step.descricao}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-500">
                Etapa {stepIndex + 1} de {financeiroTourSteps.length}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  className="rounded-xl border px-3 py-2 text-sm"
                >
                  Fechar
                </button>

                <button
                  type="button"
                  onClick={() => onClose(true)}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700"
                >
                  Não mostrar mais
                </button>

                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setStepIndex((prev) => prev - 1)}
                    className="rounded-xl border px-3 py-2 text-sm"
                  >
                    Anterior
                  </button>
                )}

                {stepIndex < financeiroTourSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStepIndex((prev) => prev + 1)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Próximo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTourConcluido(true)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Concluir
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <img
              src="/images/formix-bemvindo.png"
              alt="Formix"
              className="mx-auto h-28 w-28 object-contain"
            />

            <h3 className="mt-4 text-2xl font-bold text-slate-900">
              Financeiro pronto 🚀
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              Você concluiu o tour financeiro do PHANYX.
            </p>

            <div className="mt-6">
              <button
  type="button"
  onClick={() => {
    sessionStorage.setItem("phanyx-continuar-tour", "recebimentos");
    onClose(false);
    window.location.href = "/admin/financeiro/recebimentos";
  }}
  className="rounded-xl bg-blue-600 px-4 py-2 text-white"
>
  Ir para recebimentos
</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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

  const [tourAberto, setTourAberto] = useState(false);

useEffect(() => {
  const abrirTour = () => {
    setTourAberto(true);
  };

  window.addEventListener("phanyx:abrir-tour-financeiro", abrirTour);

  try {
    const oculto = localStorage.getItem("phanyx_financeiro_tour_oculto_v1");

    if (oculto !== "true") {
      const timer = setTimeout(() => {
        setTourAberto(true);
      }, 600);

      return () => {
        clearTimeout(timer);
        window.removeEventListener(
          "phanyx:abrir-tour-financeiro",
          abrirTour
        );
      };
    }
  } catch {
    setTourAberto(true);
  }

  return () => {
    window.removeEventListener(
      "phanyx:abrir-tour-financeiro",
      abrirTour
    );
  };
}, []);

function fecharTourFinanceiro(naoMostrarNovamente?: boolean) {
  if (naoMostrarNovamente) {
    try {
      localStorage.setItem("phanyx_financeiro_tour_oculto_v1", "true");
    } catch {}
  }

  setTourAberto(false);
}

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
     <FinanceiroTour aberto={tourAberto} onClose={fecharTourFinanceiro} />
    </div>
  );
}