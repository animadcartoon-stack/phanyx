"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";


type LancamentoAtrasado = {
  id: number;
  tipo: string;
  descricao?: string | null;
  valorOriginal: number;
  valorFinal?: number | null;
  valorPago?: number | null;
  descontoValor?: number | null;
  jurosValor?: number | null;
  multaValor?: number | null;
  vencimento?: string | null;
  status: string;
  saldoAberto: number;
};

type AlunoInadimplente = {
  alunoId: number;
  nome: string;
  matricula?: string | null;
  email?: string | null;
  statusAluno?: string | null;
  totalAtrasado: number;
  quantidadeLancamentos: number;
  lancamentos: LancamentoAtrasado[];
};

type FormLancamento = {
  valorPago: string;
  formaPagamento: string;
  observacao: string;
  descontoValor: string;
  jurosValor: string;
  multaValor: string;
};

function InadimplentesTour({
  aberto,
  onClose,
  steps,
}: {
  aberto: boolean;
  onClose: () => void;
  steps: any[];
}) {
  const t = useTranslations("AdminFinanceiroInadimplentes");
  const [stepAtual, setStepAtual] = useState(0);
  const [targetRect, setTargetRect] = useState<any>(null);

  const step = steps[stepAtual];

  useEffect(() => {
    if (!aberto || !step) return;

    function atualizar() {
      const el = document.querySelector(step.target);
      if (!el) return;

      el.scrollIntoView({ behavior: "smooth", block: "center" });

      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }, 260);
    }

    atualizar();

    window.addEventListener("resize", atualizar);
    window.addEventListener("scroll", atualizar, true);

    return () => {
      window.removeEventListener("resize", atualizar);
      window.removeEventListener("scroll", atualizar, true);
    };
  }, [aberto, stepAtual, step]);

  if (!aberto || !step) return null;

  const spotlight = targetRect
    ? {
        top: Math.max(targetRect.top - 8, 8),
        left: Math.max(targetRect.left - 8, 8),
        width: targetRect.width + 16,
        height: targetRect.height + 16,
      }
    : null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-slate-950/70" />

      {spotlight && (
        <div
          className="absolute rounded-2xl border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.72)]"
          style={spotlight}
        />
      )}

      <div
  className="absolute w-[min(420px,calc(100vw-32px))] rounded-[28px] border bg-white px-5 py-4 shadow-2xl transition-all duration-300"
  style={
    spotlight
      ? {
          top: Math.min(
            spotlight.top + spotlight.height + 18,
            window.innerHeight - 320
          ),
          left: Math.max(
            320,
            Math.min(spotlight.left, window.innerWidth - 460)
          ),
        }
      : {
          top: 160,
          left: 360,
        }
  }
>
        <div className="absolute -top-2 left-10 h-4 w-4 rotate-45 border-l border-t bg-white" />

        <div className="flex gap-4">
          <img
            src={step.imagem}
            alt=""
            className="h-24 w-24 object-contain drop-shadow-lg"
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              {t("tour.guidedTutorial")}
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {step.titulo}
            </h3>

            <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
              {step.destaque}
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {step.descricao}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {t("tour.stepOf", { current: stepAtual + 1, total: steps.length })}
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              {t("tour.close")}
            </button>

            {stepAtual > 0 && (
              <button
                onClick={() => setStepAtual((p) => p - 1)}
                className="rounded-xl border px-3 py-2 text-sm"
              >
                {t("tour.previous")}
              </button>
            )}

            {stepAtual < steps.length - 1 ? (
              <button
                onClick={() => setStepAtual((p) => p + 1)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {t("tour.next")}
              </button>
            ) : (
              <button
                onClick={() => {
                  sessionStorage.setItem("phanyx-continuar-tour", "fechamento-geral");
                  onClose();
                  window.location.href = "/admin/financeiro/fechamento-geral";
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {t("tour.goToClosing")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFinanceiroInadimplentesPage() {
  const t = useTranslations("AdminFinanceiroInadimplentes");
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [telefoneModalAberto, setTelefoneModalAberto] = useState(false);
  const [telefoneWhatsApp, setTelefoneWhatsApp] = useState("");
  const [cobrancaSelecionada, setCobrancaSelecionada] = useState<{
  alunoId: number;
  alunoNome: string;
  lanc: LancamentoAtrasado;
} | null>(null);
  const [busca, setBusca] = useState("");
  const [dados, setDados] = useState<AlunoInadimplente[]>([]);
  const [abertoId, setAbertoId] = useState<number | null>(null);
  const [baixandoId, setBaixandoId] = useState<number | null>(null);
  const [forms, setForms] = useState<Record<number, FormLancamento>>({});
  const [tourAberto, setTourAberto] = useState(false);

  const inadimplenciaTourSteps = [
  {
    id: "resumo",
    target: '[data-tour="inad-resumo"]',
    titulo: t("tour.steps.summary.title"),
    destaque: t("tour.steps.summary.highlight"),
    descricao:
      t("tour.steps.summary.description"),
    imagem: "/images/phanyx-inadimplente.png",
  },
  {
    id: "busca",
    target: '[data-tour="inad-busca"]',
    titulo: t("tour.steps.search.title"),
    destaque: t("tour.steps.search.highlight"),
    descricao:
      t("tour.steps.search.description"),
    imagem: "/images/formix-inteligente.png",
  },
  {
    id: "lista",
    target: '[data-tour="inad-lista"]',
    titulo: t("tour.steps.list.title"),
    destaque: t("tour.steps.list.highlight"),
    descricao:
      t("tour.steps.list.description"),
    imagem: "/images/phanyx-inadimplente.png",
  },
  {
    id: "baixa",
    target: '[data-tour="inad-baixa"]',
    titulo: t("tour.steps.settlement.title"),
    destaque: t("tour.steps.settlement.highlight"),
    descricao:
      t("tour.steps.settlement.description"),
    imagem: "/images/formix.png",
  },
];

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor || 0));
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";
    return new Intl.DateTimeFormat(locale).format(new Date(data));
  }

  function labelTipoLancamento(tipo?: string | null) {
    const chave = String(tipo || "").toUpperCase();

    const labels: Record<string, string> = {
      MATRICULA: t("entryTypes.enrollment"),
      MENSALIDADE: t("entryTypes.tuition"),
      TAXA: t("entryTypes.fee"),
      DESCONTO: t("entryTypes.discount"),
      OUTRO: t("entryTypes.other"),
    };

    return labels[chave] || tipo || "-";
  }

  function labelStatusAluno(status?: string | null) {
    const chave = String(status || "").toUpperCase();

    const labels: Record<string, string> = {
      ATIVO: t("studentStatus.active"),
      INATIVO: t("studentStatus.inactive"),
      TRANCADO: t("studentStatus.onLeave"),
      CANCELADO: t("studentStatus.cancelled"),
      CONCLUIDO: t("studentStatus.completed"),
      CONCLUÍDO: t("studentStatus.completed"),
      PENDENTE: t("studentStatus.pending"),
      INADIMPLENTE: t("studentStatus.inArrears"),
    };

    return labels[chave] || status || "-";
  }

  function montarMensagemCobranca(
    alunoNome: string,
    lanc: LancamentoAtrasado
  ) {
    const valor = Number(lanc.saldoAberto || 0);

    const cobranca = lanc.descricao || labelTipoLancamento(lanc.tipo);

    return [
      t("chargeMessage.greeting", { student: alunoNome }),
      [
        `${t("chargeMessage.charge")}: ${cobranca}`,
        `${t("chargeMessage.dueDate")}: ${formatarData(lanc.vencimento)}`,
        `${t("chargeMessage.outstandingAmount")}: ${formatarMoeda(valor)}`,
      ].join("\n"),
      t("chargeMessage.regularize"),
      t("chargeMessage.contact"),
    ].join("\n\n");
  }

  async function registrarHistorico(
    alunoId: number,
    alunoNome: string,
    lancamentoId: number,
    canal: string,
    acao: string,
    observacao: string
  ) {
    try {
      await fetch("/api/admin/financeiro/historico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          alunoId,
          alunoNome,
          lancamentoFinanceiroId: lancamentoId,
          canal,
          acao,
          observacao,
        }),
      });
    } catch {
      // não bloqueia a ação principal
    }
  }

  async function copiarMensagem(
    alunoId: number,
    alunoNome: string,
    lanc: LancamentoAtrasado
  ) {
    try {
      const mensagem = montarMensagemCobranca(alunoNome, lanc);
      await navigator.clipboard.writeText(mensagem);

      await registrarHistorico(
        alunoId,
        alunoNome,
        lanc.id,
        "MANUAL",
        "COBRANCA_COPIADA",
        t("history.chargeCopied", { entryId: lanc.id })
      );

      setSucesso(t("messages.copySuccess"));
    } catch {
      setErro(t("messages.copyError"));
    }
  }

  async function cobrarNoWhatsApp(
  alunoId: number,
  alunoNome: string,
  lanc: LancamentoAtrasado
) {
  setErro("");
  setSucesso("");
  setTelefoneWhatsApp("");
  setCobrancaSelecionada({ alunoId, alunoNome, lanc });
  setTelefoneModalAberto(true);
}

async function confirmarEnvioWhatsApp() {
  if (!cobrancaSelecionada) return;

  const telefone = telefoneWhatsApp.replace(/\D/g, "");

  if (!telefone) {
    setErro(t("messages.invalidWhatsappPhone"));
    return;
  }

  const { alunoId, alunoNome, lanc } = cobrancaSelecionada;
  const mensagem = montarMensagemCobranca(alunoNome, lanc);
  const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;

  window.open(url, "_blank");

  await registrarHistorico(
    alunoId,
    alunoNome,
    lanc.id,
    "WHATSAPP",
    "COBRANCA_ENVIADA",
    t("history.whatsappOpened", { phone: telefone })
  );

  setTelefoneModalAberto(false);
  setTelefoneWhatsApp("");
  setCobrancaSelecionada(null);
  setSucesso(t("messages.whatsappSuccess"));
}

  function getForm(lancamentoId: number): FormLancamento {
    return (
      forms[lancamentoId] || {
        valorPago: "",
        formaPagamento: "PIX",
        observacao: "",
        descontoValor: "",
        jurosValor: "",
        multaValor: "",
      }
    );
  }

  function updateForm(
    lancamentoId: number,
    campo: keyof FormLancamento,
    valor: string
  ) {
    setForms((prev) => ({
      ...prev,
      [lancamentoId]: {
        ...getForm(lancamentoId),
        [campo]: valor,
      },
    }));
  }

  function limparForm(lancamentoId: number) {
    setForms((prev) => {
      const novo = { ...prev };
      delete novo[lancamentoId];
      return novo;
    });
  }

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/admin/financeiro/inadimplentes", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || t("messages.loadError"));
      }

      setDados(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setErro(e?.message || t("messages.loadError"));
      setDados([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  carregar();
}, []);

useEffect(() => {
  const continuarTour = sessionStorage.getItem("phanyx-continuar-tour");

  if (continuarTour === "inadimplentes") {
    sessionStorage.removeItem("phanyx-continuar-tour");

    setTimeout(() => {
      setTourAberto(true);
    }, 600);
  }
}, []);

  async function darBaixa(
    alunoId: number,
    alunoNome: string,
    lancamentoId: number
  ) {
    try {
      setBaixandoId(lancamentoId);
      setErro("");

      const form = getForm(lancamentoId);

      const res = await fetch("/api/admin/financeiro/recebimentos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          lancamentoId,
          valorPago: form.valorPago,
          formaPagamento: form.formaPagamento,
          observacao: form.observacao,
          descontoValor: form.descontoValor,
          jurosValor: form.jurosValor,
          multaValor: form.multaValor,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || t("messages.paymentError"));
      }

      await registrarHistorico(
        alunoId,
        alunoNome,
        lancamentoId,
        "SISTEMA",
        "BAIXA_MANUAL",
        form.observacao || t("history.manualPaymentDefault")
      );

      limparForm(lancamentoId);
      setBaixandoId(null);

      await carregar();

      setSucesso(t("messages.settlementSuccess"));
    } catch (e: any) {
      setErro(e?.message || t("messages.paymentError"));
      setBaixandoId(null);
    }
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return dados;

    return dados.filter((item) => {
      const texto = [item.nome, item.matricula, item.email, item.statusAluno]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      return texto.includes(termo);
    });
  }, [dados, busca]);

  const resumo = useMemo(() => {
    const totalAlunos = filtrados.length;
    const totalLancamentos = filtrados.reduce(
      (acc, item) => acc + item.quantidadeLancamentos,
      0
    );
    const totalAtrasado = filtrados.reduce(
      (acc, item) => acc + Number(item.totalAtrasado || 0),
      0
    );

    return {
      totalAlunos,
      totalLancamentos,
      totalAtrasado,
    };
  }, [filtrados]);

  return (
  <>
    <div className="phanyx-financeiro-inadimplentes-page space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
  <div>
    <h1 className="text-2xl font-bold">🚨 {t("title")}</h1>
    
  <button
    onClick={() => setTourAberto(true)}
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    ✨ {t("openTutorial")}
  </button>
</div>

        <p className="text-gray-600 mt-1">
          {t("subtitle")}
        </p>
      </div>

      <div
  data-tour="inad-resumo"
  className="grid grid-cols-1 md:grid-cols-3 gap-4"
>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">{t("summary.students")}</p>
          <p className="text-2xl font-bold">{resumo.totalAlunos}</p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">{t("summary.overdueCharges")}</p>
          <p className="text-2xl font-bold">{resumo.totalLancamentos}</p>
        </div>

        <div className="bg-white border rounded-xl p-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{t("summary.overdueTotal")}</p>
          <p className="text-2xl font-bold text-red-700">
            {formatarMoeda(resumo.totalAtrasado)}
          </p>
        </div>
      </div>

      <div
  data-tour="inad-busca"
  className="bg-white border rounded-xl p-4"
>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={t("search.placeholder")}
          className="w-full border rounded-lg p-2"
        />
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

{sucesso && (
  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-sm">
    <p className="font-semibold">{t("messages.allSet")}</p>
    <p>{sucesso}</p>
  </div>
)}

      <div
  className="bg-white border rounded-xl overflow-hidden"
>
        <div data-tour="inad-lista" className="phanyx-financeiro-grid-head grid grid-cols-7 gap-3 border-b px-4 py-3 text-sm font-black">
  <div>{t("table.student")}</div>
  <div>{t("table.enrollment")}</div>
  <div>{t("table.email")}</div>
  <div>{t("table.overdueCharges")}</div>
  <div>{t("table.overdueTotal")}</div>
  <div>{t("table.collection")}</div>
  <div>{t("table.actions")}</div>
</div>

        {loading ? (
          <div className="p-4 text-sm text-gray-600">{t("loading")}</div>
        ) : filtrados.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">
            {t("empty")}
          </div>
        ) : (
          filtrados.map((item) => (
            <div key={item.alunoId} className="border-b">
              <div className="grid grid-cols-7 gap-3 px-4 py-4 text-sm items-center bg-red-50">
                <div>
                  <p className="font-medium text-gray-900">{item.nome}</p>
                  <p className="text-gray-500">{labelStatusAluno(item.statusAluno)}</p>
                </div>

                <div>{item.matricula || "-"}</div>
                <div>{item.email || "-"}</div>
                <div>{item.quantidadeLancamentos}</div>

                <div className="font-semibold text-red-700">
                  {formatarMoeda(item.totalAtrasado)}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() =>
                      item.lancamentos[0] &&
                      copiarMensagem(item.alunoId, item.nome, item.lancamentos[0])
                    }
                    className="px-3 py-1 bg-gray-700 text-white rounded text-xs"
                  >
                    {t("buttons.copyCharge")}
                  </button>

                  <button
                    onClick={() =>
                      item.lancamentos[0] &&
                      cobrarNoWhatsApp(item.alunoId, item.nome, item.lancamentos[0])
                    }
                    className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                  >
                    WhatsApp
                  </button>
                </div>

                <div>
                  <button data-tour="inad-baixa"
                    onClick={() =>
                      setAbertoId((prev) =>
                        prev === item.alunoId ? null : item.alunoId
                      )
                    }
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                  >
                    {abertoId === item.alunoId ? t("buttons.close") : t("buttons.openCharges")}
                  </button>
                </div>
              </div>

              {abertoId === item.alunoId && (
                <div className="px-4 py-4 bg-white space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-sm font-semibold text-gray-700">
                    <div>{t("details.type")}</div>
                    <div>{t("details.description")}</div>
                    <div>{t("details.dueDate")}</div>
                    <div>{t("details.finalAmount")}</div>
                    <div>{t("details.outstandingBalance")}</div>
                    <div>{t("details.action")}</div>
                  </div>

                  {item.lancamentos.map((lanc) => {
                    const form = getForm(lanc.id);

                    return (
                      <div
                        key={lanc.id}
                        className="grid grid-cols-1 md:grid-cols-6 gap-3 border rounded-lg p-3 items-start"
                      >
                        <div>{labelTipoLancamento(lanc.tipo)}</div>

                        <div>
                          <p>{lanc.descricao || "-"}</p>
                          {(Number(lanc.descontoValor || 0) > 0 ||
                            Number(lanc.jurosValor || 0) > 0 ||
                            Number(lanc.multaValor || 0) > 0) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {t("adjustments.discount")}: {formatarMoeda(Number(lanc.descontoValor || 0))} •
                              {t("adjustments.interest")}: {formatarMoeda(Number(lanc.jurosValor || 0))} •
                              {t("adjustments.penalty")}: {formatarMoeda(Number(lanc.multaValor || 0))}
                            </p>
                          )}
                        </div>

                        <div>{formatarData(lanc.vencimento)}</div>

                        <div>
                          {formatarMoeda(
                            Number(lanc.valorFinal ?? lanc.valorOriginal ?? 0)
                          )}
                        </div>

                        <div className="font-semibold text-red-700">
                          {formatarMoeda(Number(lanc.saldoAberto || 0))}
                        </div>

                        <div className="space-y-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.valorPago}
                            onChange={(e) =>
                              updateForm(lanc.id, "valorPago", e.target.value)
                            }
                            placeholder={t("form.amountPaid")}
                            className="w-full border rounded p-2 text-sm"
                          />

                          <select
                            value={form.formaPagamento}
                            onChange={(e) =>
                              updateForm(lanc.id, "formaPagamento", e.target.value)
                            }
                            className="w-full border rounded p-2 text-sm bg-white"
                          >
                            <option value="DINHEIRO">{t("paymentMethods.cash")}</option>
                            <option value="PIX">PIX</option>
                            <option value="CARTAO">{t("paymentMethods.card")}</option>
                            <option value="BOLETO">{t("paymentMethods.invoice")}</option>
                            <option value="TRANSFERENCIA">{t("paymentMethods.transfer")}</option>
                            <option value="OUTRO">{t("paymentMethods.other")}</option>
                          </select>

                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.descontoValor}
                            onChange={(e) =>
                              updateForm(lanc.id, "descontoValor", e.target.value)
                            }
                            placeholder={t("form.discount")}
                            className="w-full border rounded p-2 text-sm"
                          />

                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.jurosValor}
                            onChange={(e) =>
                              updateForm(lanc.id, "jurosValor", e.target.value)
                            }
                            placeholder={t("form.interest")}
                            className="w-full border rounded p-2 text-sm"
                          />

                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.multaValor}
                            onChange={(e) =>
                              updateForm(lanc.id, "multaValor", e.target.value)
                            }
                            placeholder={t("form.penalty")}
                            className="w-full border rounded p-2 text-sm"
                          />

                          <input
                            type="text"
                            value={form.observacao}
                            onChange={(e) =>
                              updateForm(lanc.id, "observacao", e.target.value)
                            }
                            placeholder={t("form.note")}
                            className="w-full border rounded p-2 text-sm"
                          />

                          <button
                            onClick={() =>
                              copiarMensagem(item.alunoId, item.nome, lanc)
                            }
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                          >
                            {t("buttons.copyMessage")}
                          </button>

                          <button
                            onClick={() =>
                              cobrarNoWhatsApp(item.alunoId, item.nome, lanc)
                            }
                            className="w-full px-3 py-2 bg-emerald-600 text-white rounded text-sm"
                          >
                            {t("buttons.chargeWhatsapp")}
                          </button>

                          <button
  onClick={() =>
    darBaixa(item.alunoId, item.nome, lanc.id)
  }
                            disabled={baixandoId === lanc.id}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                          >
                            {baixandoId === lanc.id
                              ? t("buttons.recording")
                              : t("buttons.recordPayment")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
                        </div>
          </div>

<InadimplentesTour
  aberto={tourAberto}
  onClose={() => setTourAberto(false)}
  steps={inadimplenciaTourSteps}
/>

          {telefoneModalAberto && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4">
    <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
        {t("whatsapp.kicker")}
      </p>

      <h2 className="mt-2 text-xl font-bold text-slate-900">
        {t("whatsapp.title")}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {t("whatsapp.description")}
      </p>

      <input
        value={telefoneWhatsApp}
        onChange={(e) => setTelefoneWhatsApp(e.target.value)}
        placeholder={t("whatsapp.phonePlaceholder")}
        className="mt-4 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
      />

      <div className="mt-5 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setTelefoneModalAberto(false);
            setTelefoneWhatsApp("");
            setCobrancaSelecionada(null);
          }}
          className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {t("buttons.cancel")}
        </button>

        <button
          type="button"
          onClick={confirmarEnvioWhatsApp}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t("buttons.openWhatsapp")}
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}