"use client";

import { useEffect, useState } from "react";

type InstituicaoResumo = {
  id: number;
  nome: string;
  plano: string | null;
  statusAssinatura: string | null;
  isentaPagamento: boolean;
};

type AssinaturaPhanyx = {
  id: number;
  plano: string;
  status: string;
  testeGratisInicioEm: string;
  testeGratisFimEm: string;
  primeiraCobrancaEm: string | null;
  proximaCobrancaEm: string | null;
  asaasBillingType: string | null;
  asaasCycle: string | null;
  valorBase: number;
  valorPorAluno: number;
  valorPorPoloExtra: number;
  valorMensalAtual: number;
  alunosAtivosReferencia: number;
  polosReferencia: number;
  canceladaEm: string | null;
  motivoCancelamento: string | null;
  asaasSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatarData(data?: string | null) {
  if (!data) return "-";

  try {
    return new Date(data).toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}

function formatarValor(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function rotuloCobranca(tipo?: string | null) {
  if (tipo === "CREDIT_CARD") return "Cartão de crédito";
  if (tipo === "BOLETO") return "Boleto mensal";
  if (tipo === "PIX") return "Pix mensal";
  return tipo || "-";
}

function classeStatus(status?: string | null) {
  const valor = String(status || "").toUpperCase();

  if (valor === "TESTE_GRATIS") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
  }

  if (valor === "ATIVA") {
    return "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-200";
  }

  if (valor === "EM_ATRASO") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200";
  }

  if (valor === "CANCELADA") {
    return "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-200";
  }

  return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
}

export default function AdminAssinaturaPage() {
  const [instituicao, setInstituicao] = useState<InstituicaoResumo | null>(
    null
  );
  const [assinatura, setAssinatura] = useState<AssinaturaPhanyx | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [motivo, setMotivo] = useState("");

  async function carregarAssinatura() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/admin/assinatura-phanyx", {
        cache: "no-store",
      });

      const contentType = res.headers.get("content-type") || "";

if (!contentType.includes("application/json")) {
  const texto = await res.text();
  console.error("Resposta não JSON da API assinatura:", texto);
  throw new Error("A API de assinatura não retornou JSON.");
}

const json = await res.json();

if (!res.ok) {
  throw new Error(json?.error || "Erro ao carregar assinatura.");
}

      setInstituicao(json.instituicao || null);
      setAssinatura(json.assinatura || null);
    } catch (error: any) {
      setErro(error?.message || "Erro ao carregar assinatura.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmarCancelamento() {
    try {
      setCancelando(true);
      setErro("");
      setSucesso("");

      const res = await fetch("/api/admin/assinatura-phanyx/cancelar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          motivo,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao cancelar assinatura.");
      }

      setSucesso(
        json?.mensagem ||
          "Assinatura cancelada com sucesso. Nenhuma cobrança futura será gerada."
      );

      setModalAberto(false);
      setMotivo("");

      await carregarAssinatura();
    } catch (error: any) {
      setErro(error?.message || "Erro ao cancelar assinatura.");
    } finally {
      setCancelando(false);
    }
  }

  useEffect(() => {
    carregarAssinatura();
  }, []);

  const podeCancelar =
    assinatura &&
    assinatura.status !== "CANCELADA" &&
    Boolean(assinatura.asaasSubscriptionId) &&
    !instituicao?.isentaPagamento;

  return (
    <main className="phanyx-assinatura-page min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
            Assinatura PHANYX
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Plano e cobrança da instituição
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Acompanhe o plano contratado, o período gratuito, a primeira
            cobrança e a forma de cobrança da instituição. Durante o teste
            gratuito, a instituição pode cancelar antes da primeira cobrança.
          </p>
        </div>

        {erro ? (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-200">
            {erro}
          </div>
        ) : null}

        {sucesso ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-200">
            {sucesso}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Carregando assinatura...
          </div>
        ) : !instituicao ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-sm text-red-700 dark:text-red-200">
            Não foi possível carregar os dados da instituição.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Instituição
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {instituicao.nome}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Plano atual:{" "}
                    <strong className="text-slate-950 dark:text-white">
                      {assinatura?.plano || instituicao.plano || "-"}
                    </strong>
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${classeStatus(
                    assinatura?.status || instituicao.statusAssinatura
                  )}`}
                >
                  {assinatura?.status || instituicao.statusAssinatura || "-"}
                </span>
              </div>

              {instituicao.isentaPagamento ? (
                <div className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm leading-6 text-blue-700 dark:text-blue-200">
                  Esta instituição está marcada como isenta de pagamento. Não
                  há assinatura comercial para cancelar.
                </div>
              ) : !assinatura ? (
                <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-700 dark:text-amber-200">
                  Nenhuma assinatura PHANYX foi encontrada para esta
                  instituição.
                </div>
              ) : (
                <>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Início do teste
                      </p>
                      <p className="mt-2 text-lg font-black">
                        {formatarData(assinatura.testeGratisInicioEm)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Fim do teste grátis
                      </p>
                      <p className="mt-2 text-lg font-black">
                        {formatarData(assinatura.testeGratisFimEm)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Primeira cobrança
                      </p>
                      <p className="mt-2 text-lg font-black">
                        {formatarData(assinatura.primeiraCobrancaEm)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Forma de cobrança
                      </p>
                      <p className="mt-2 text-lg font-black">
                        {rotuloCobranca(assinatura.asaasBillingType)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-sm leading-7 text-blue-800 dark:text-blue-100">
                    <p className="font-black text-blue-900 dark:text-white">
                      Como funciona o cancelamento?
                    </p>

                    <p className="mt-2">
                      Se a instituição cancelar antes da primeira cobrança, a
                      recorrência será cancelada no Asaas e nenhuma cobrança
                      futura será gerada por essa assinatura.
                    </p>
                  </div>

                  {assinatura.status === "CANCELADA" ? (
                    <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm leading-7 text-red-700 dark:text-red-200">
                      <p className="font-black">Assinatura cancelada</p>
                      <p className="mt-2">
                        Cancelada em: {formatarData(assinatura.canceladaEm)}
                      </p>
                      {assinatura.motivoCancelamento ? (
                        <p className="mt-2">
                          Motivo: {assinatura.motivoCancelamento}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {podeCancelar ? (
                    <button
                      type="button"
                      onClick={() => setModalAberto(true)}
                      className="mt-6 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:opacity-60"
                    >
                      Cancelar teste gratuito
                    </button>
                  ) : null}
                </>
              )}
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Valores
                </p>

                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300">
                      Valor mensal atual
                    </span>
                    <strong>
                      {formatarValor(assinatura?.valorMensalAtual || 0)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-300">
                      Valor por aluno
                    </span>
                    <strong>
                      {formatarValor(assinatura?.valorPorAluno || 0)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-300">
                      Polo extra
                    </span>
                    <strong>
                      {formatarValor(assinatura?.valorPorPoloExtra || 0)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Referência de uso
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Alunos ativos
                    </p>
                    <p className="mt-1 text-2xl font-black">
                      {assinatura?.alunosAtivosReferencia || 0}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Polos
                    </p>
                    <p className="mt-1 text-2xl font-black">
                      {assinatura?.polosReferencia || 0}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {modalAberto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-300">
              Cancelar teste gratuito
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
              Deseja cancelar a assinatura?
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Ao confirmar, o PHANYX tentará cancelar a recorrência no Asaas.
              Se o cancelamento for concluído, nenhuma cobrança futura será
              gerada por essa assinatura.
            </p>

            <label className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Motivo do cancelamento
            </label>

            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Opcional. Exemplo: instituição desistiu durante o período gratuito."
              className="mt-2 min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                disabled={cancelando}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={confirmarCancelamento}
                disabled={cancelando}
                className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {cancelando ? "Cancelando..." : "Sim, cancelar assinatura"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}