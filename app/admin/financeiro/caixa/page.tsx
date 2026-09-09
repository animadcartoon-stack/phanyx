"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Movimento = {
  id: number;
  tipo: "ENTRADA" | "SAIDA";
  descricao?: string | null;
  valor: number;
  formaPagamento?: string | null;
  createdAt?: string;
};

type Caixa = {
  id: number;
  status: "ABERTO" | "FECHADO";
  saldoInicial: number;
  saldoSistema: number;
  saldoInformado?: number | null;
  diferenca: number;
  observacaoAbertura?: string | null;
  observacaoFechamento?: string | null;
  dataAbertura?: string;
  dataFechamento?: string | null;
  movimentos: Movimento[];
};

type CobrancaPendente = {
  id: number;
  tipo: string;
  descricao?: string | null;
  status: string;

  valorOriginal: number;
  valorFinalCalculado: number;
  valorPagoCalculado: number;
  saldoPendente: number;

  vencimento?: string | null;

  aluno: {
    id: number;
    nome: string;
    user?: {
      email?: string | null;
    } | null;
  };

  matricula?: {
    id: number;
    numeroMatricula?: string | null;
    numeroMatriculaLegado?: string | null;
    vendedorResponsavelNomeSnapshot?: string | null;

    curso?: {
      id: number;
      nome: string;
    } | null;
  } | null;

  polo?: {
    id: number;
    nome: string;
  } | null;
};

const caixaTourSteps = [
  {
    id: "abrir-caixa",
    target: '[data-tour="caixa-botao-abrir"]',
    tituloKey: "tour.steps.openCash.title",
    destaqueKey: "tour.steps.openCash.highlight",
    descricaoKey: "tour.steps.openCash.description",
    imagem: "/images/financeiro.png",
  },
  {
    id: "saldo-inicial",
    target: '[data-tour="caixa-saldo-inicial"]',
    tituloKey: "tour.steps.initialBalance.title",
    destaqueKey: "tour.steps.initialBalance.highlight",
    descricaoKey: "tour.steps.initialBalance.description",
    imagem: "/images/contador.png",
  },
  {
    id: "observacao-abertura",
    target: '[data-tour="caixa-observacao-abertura"]',
    tituloKey: "tour.steps.openingNote.title",
    destaqueKey: "tour.steps.openingNote.highlight",
    descricaoKey: "tour.steps.openingNote.description",
    imagem: "/images/financeiro.png",
  },
  {
    id: "botao-abrir",
    target: '[data-tour="caixa-botao-abrir"]',
    tituloKey: "tour.steps.confirmOpen.title",
    destaqueKey: "tour.steps.confirmOpen.highlight",
    descricaoKey: "tour.steps.confirmOpen.description",
    imagem: "/images/formix-bemvindo.png",
  },
] as const;

function CaixaTour({
  aberto,
  onClose,
}: {
  aberto: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("AdminFinanceCash");
  const [stepAtual, setStepAtual] = useState(0);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const step = caixaTourSteps[stepAtual];

  useEffect(() => {
    if (!aberto || !step) return;

    function atualizarPosicao() {
      const elemento = document.querySelector(step.target);

      if (!elemento) {
        setTargetRect(null);
        return;
      }

      elemento.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      setTimeout(() => {
        const rect = elemento.getBoundingClientRect();

        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }, 260);
    }

    atualizarPosicao();

    window.addEventListener("resize", atualizarPosicao);
    window.addEventListener("scroll", atualizarPosicao, true);

    return () => {
      window.removeEventListener("resize", atualizarPosicao);
      window.removeEventListener("scroll", atualizarPosicao, true);
    };
  }, [aberto, stepAtual, step]);

  useEffect(() => {
    if (!aberto) {
      setStepAtual(0);
      setTargetRect(null);
    }
  }, [aberto]);

  if (!aberto || !step) return null;

  const spotlightPadding = 8;

  const spotlight = targetRect
    ? {
      top: Math.max(targetRect.top - spotlightPadding, 8),
      left: Math.max(targetRect.left - spotlightPadding, 8),
      width: targetRect.width + spotlightPadding * 2,
      height: targetRect.height + spotlightPadding * 2,
    }
    : null;

  const bubbleWidth = 420;
  const bubbleHeight = 290;

  const posicaoBalao = spotlight
    ? (() => {
      const espacoAbaixo =
        window.innerHeight - (spotlight.top + spotlight.height);
      const espacoAcima = spotlight.top;
      const espacoDireita =
        window.innerWidth - (spotlight.left + spotlight.width);
      const espacoEsquerda = spotlight.left;

      let direcao: "baixo" | "cima" | "direita" | "esquerda" = "baixo";

      if (espacoAbaixo >= bubbleHeight + 28) {
        direcao = "baixo";
      } else if (espacoAcima >= bubbleHeight + 28) {
        direcao = "cima";
      } else if (espacoDireita >= bubbleWidth + 28) {
        direcao = "direita";
      } else if (espacoEsquerda >= bubbleWidth + 28) {
        direcao = "esquerda";
      } else {
        direcao = "baixo";
      }

      let top = spotlight.top + spotlight.height + 18;
      let left = spotlight.left;

      if (direcao === "cima") {
        top = spotlight.top - bubbleHeight - 18;
        left = spotlight.left;
      }

      if (direcao === "direita") {
        top = spotlight.top + spotlight.height / 2 - bubbleHeight / 2;
        left = spotlight.left + spotlight.width + 18;
      }

      if (direcao === "esquerda") {
        top = spotlight.top + spotlight.height / 2 - bubbleHeight / 2;
        left = spotlight.left - bubbleWidth - 18;
      }

      top = Math.max(
        16,
        Math.min(top, window.innerHeight - bubbleHeight - 16)
      );
      left = Math.max(
        16,
        Math.min(left, window.innerWidth - bubbleWidth - 16)
      );

      return {
        style: {
          top: `${top}px`,
          left: `${left}px`,
        },
        direcao,
      };
    })()
    : {
      style: {
        top: "120px",
        left: "50%",
        transform: "translateX(-50%)",
      },
      direcao: "baixo" as const,
    };

  const bubbleStyle = posicaoBalao.style;
  const direcaoSeta = posicaoBalao.direcao;

  function fechar() {
    localStorage.setItem("phanyx-tour-caixa", "concluido");
    onClose();
  }

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
        className="absolute w-[min(420px,calc(100vw-32px))] rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-2xl transition-all duration-300 dark:border-slate-700 dark:bg-slate-900"
        style={bubbleStyle}
      >
        {spotlight && (
          <div
            className="absolute h-3 w-3 rotate-45 border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
            style={
              direcaoSeta === "baixo"
                ? { left: "42px", top: "-6px" }
                : direcaoSeta === "cima"
                  ? { left: "42px", bottom: "-6px" }
                  : direcaoSeta === "direita"
                    ? { left: "-6px", top: "42px" }
                    : { right: "-6px", top: "42px" }
            }
          />
        )}

        <div className="flex items-start gap-4">
          <img
            src={step.imagem}
            alt=""
            className="h-24 w-24 shrink-0 object-contain drop-shadow-lg"
          />

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
              {t("tour.label")}
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              {t(step.tituloKey)}
            </h3>

            <p className="mt-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {t(step.destaqueKey)}
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {t(step.descricaoKey)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {t("tour.step", {
              current: stepAtual + 1,
              total: caixaTourSteps.length,
            })}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={fechar}
              className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {t("tour.close")}
            </button>

            {stepAtual > 0 && (
              <button
                type="button"
                onClick={() => setStepAtual((prev) => prev - 1)}
                className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                {t("tour.previous")}
              </button>
            )}

            {stepAtual < caixaTourSteps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStepAtual((prev) => prev + 1)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t("tour.next")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("phanyx-tour-caixa", "concluido");
                  sessionStorage.setItem(
                    "phanyx-continuar-tour",
                    "inadimplentes"
                  );
                  onClose();
                  window.location.href = "/admin/financeiro/inadimplentes";
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t("tour.goToDelinquent")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFinanceiroCaixaPage() {
  const t = useTranslations("AdminFinanceCash");
  const locale = useLocale();

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor || 0));
  }

  function formatarData(valor?: string | null) {
    if (!valor) return t("common.notInformed");
    return new Date(valor).toLocaleDateString(locale);
  }

  function formatarDataHora(valor?: string | null) {
    if (!valor) return "-";
    return new Date(valor).toLocaleString(locale);
  }

  function rotuloStatusCaixa(status: Caixa["status"]) {
    return status === "ABERTO"
      ? t("status.open")
      : t("status.closed");
  }

  function rotuloTipoMovimento(tipo: Movimento["tipo"]) {
    return tipo === "ENTRADA"
      ? t("movementTypes.entry")
      : t("movementTypes.exit");
  }

  function rotuloFormaPagamento(valor?: string | null) {
    switch (valor) {
      case "DINHEIRO":
        return t("paymentMethods.cash");
      case "PIX":
        return "PIX";
      case "CARTAO":
        return t("paymentMethods.card");
      case "BOLETO":
        return t("paymentMethods.boleto");
      case "TRANSFERENCIA":
        return t("paymentMethods.transfer");
      case "OUTRO":
        return t("paymentMethods.other");
      default:
        return valor || "-";
    }
  }

  const [loading, setLoading] = useState(true);
  const [tourAberto, setTourAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  const [caixaOnlineIbe, setCaixaOnlineIbe] = useState<Caixa | null>(null);
  const [podeVerCaixaOnlineIbe, setPodeVerCaixaOnlineIbe] = useState(false);
  const [cobrancasPendentes, setCobrancasPendentes] =
    useState<CobrancaPendente[]>([]);

  const [buscaCobranca, setBuscaCobranca] = useState("");

  const [cobrancaSelecionadaId, setCobrancaSelecionadaId] =
    useState<number | null>(null);

  const [valorBaixa, setValorBaixa] = useState("");
  const [formaPagamentoBaixa, setFormaPagamentoBaixa] =
    useState("PIX");

  const [observacaoBaixa, setObservacaoBaixa] = useState("");
  const [salvandoBaixa, setSalvandoBaixa] = useState(false);

  const [saldoInicial, setSaldoInicial] = useState("");
  const [observacaoAbertura, setObservacaoAbertura] = useState("");

  const [tipoMovimento, setTipoMovimento] = useState<"ENTRADA" | "SAIDA">("ENTRADA");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("PIX");

  const [saldoInformado, setSaldoInformado] = useState("");
  const [observacaoFechamento, setObservacaoFechamento] = useState("");

  async function carregarCaixa() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/admin/financeiro/caixa", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("errors.loadCash"));
      }

      setCaixa(data?.caixaManual || null);
      setCaixaOnlineIbe(data?.caixaOnlineIbe || null);
      setPodeVerCaixaOnlineIbe(Boolean(data?.podeVerCaixaOnlineIbe));
      setCobrancasPendentes(
        Array.isArray(data?.cobrancasPendentes)
          ? data.cobrancasPendentes
          : []
      );
    } catch (e: any) {
      setErro(e?.message || t("errors.loadCash"));
      setCaixa(null);
      setCobrancasPendentes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCaixa();
  }, []);

  useEffect(() => {
    const abrirTour = () => {
      setTourAberto(true);
    };

    const continuarTour = sessionStorage.getItem("phanyx-continuar-tour");

    if (continuarTour === "caixa") {
      sessionStorage.removeItem("phanyx-continuar-tour");

      setTimeout(() => {
        setTourAberto(true);
      }, 600);
    }

    window.addEventListener("phanyx:abrir-tour-caixa", abrirTour);

    return () => {
      window.removeEventListener("phanyx:abrir-tour-caixa", abrirTour);
    };
  }, []);

  async function abrirCaixa() {
    try {
      setErro("");
      setSucesso("");

      const res = await fetch("/api/admin/financeiro/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          acao: "ABRIR",
          saldoInicial,
          observacaoAbertura,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("errors.openCash"));
      }

      setSaldoInicial("");
      setObservacaoAbertura("");
      await carregarCaixa();
      setSucesso(t("success.cashOpened"));
    } catch (e: any) {
      setErro(e?.message || t("errors.openCash"));
    }
  }

  function selecionarCobranca(cobranca: CobrancaPendente) {
    setErro("");
    setSucesso("");

    setCobrancaSelecionadaId(cobranca.id);
    setValorBaixa(
      Number(cobranca.saldoPendente || 0).toFixed(2)
    );
    setFormaPagamentoBaixa("PIX");
    setObservacaoBaixa("");
  }

  function cancelarSelecaoCobranca() {
    setCobrancaSelecionadaId(null);
    setValorBaixa("");
    setFormaPagamentoBaixa("PIX");
    setObservacaoBaixa("");
  }

  async function darBaixaCobranca() {
    if (!caixa) {
      setErro(
        t("errors.openCashBeforeReceipt")
      );
      return;
    }

    if (!cobrancaSelecionadaId) {
      setErro(t("errors.selectCharge"));
      return;
    }

    const valorNumerico = Number(valorBaixa);

    if (
      !Number.isFinite(valorNumerico) ||
      valorNumerico <= 0
    ) {
      setErro(t("errors.invalidReceiptAmount"));
      return;
    }

    try {
      setSalvandoBaixa(true);
      setErro("");
      setSucesso("");

      const resposta = await fetch(
        "/api/admin/financeiro/recebimentos",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lancamentoId: cobrancaSelecionadaId,
            valorPago: valorNumerico,
            formaPagamento: formaPagamentoBaixa,
            observacao:
              observacaoBaixa.trim() || null,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          t("errors.registerReceipt")
        );
      }

      cancelarSelecaoCobranca();

      await carregarCaixa();

      setSucesso(
        t("success.receiptRegistered")
      );
    } catch (e: any) {
      setErro(
        e?.message ||
        t("errors.registerReceipt")
      );
    } finally {
      setSalvandoBaixa(false);
    }
  }

  async function registrarMovimento() {
    if (!caixa) return;

    try {
      setErro("");
      setSucesso("");
      const res = await fetch("/api/admin/financeiro/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          acao: "MOVIMENTO",
          caixaId: caixa.id,
          tipo: tipoMovimento,
          descricao,
          valor,
          formaPagamento,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("errors.registerMovement"));
      }

      setDescricao("");
      setValor("");
      setFormaPagamento("PIX");
      await carregarCaixa();
      setSucesso(t("success.movementRegistered"));
    } catch (e: any) {
      setErro(e?.message || t("errors.registerMovement"));
    }
  }

  async function fecharCaixa() {
    if (!caixa) return;

    try {
      setErro("");
      setSucesso("");
      const res = await fetch("/api/admin/financeiro/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          acao: "FECHAR",
          caixaId: caixa.id,
          saldoInformado,
          observacaoFechamento,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("errors.closeCash"));
      }

      setSaldoInformado("");
      setObservacaoFechamento("");
      await carregarCaixa();
      setSucesso(t("success.cashClosed"));
    } catch (e: any) {
      setErro(e?.message || t("errors.closeCash"));
    }
  }

  const resumo = useMemo(() => {
    const movimentos = caixa?.movimentos || [];
    const dinheiro = movimentos
      .filter((m) => m.formaPagamento === "DINHEIRO" && m.tipo === "ENTRADA")
      .reduce((acc, m) => acc + Number(m.valor || 0), 0);
    const pix = movimentos
      .filter((m) => m.formaPagamento === "PIX" && m.tipo === "ENTRADA")
      .reduce((acc, m) => acc + Number(m.valor || 0), 0);
    const cartao = movimentos
      .filter((m) => m.formaPagamento === "CARTAO" && m.tipo === "ENTRADA")
      .reduce((acc, m) => acc + Number(m.valor || 0), 0);

    return { dinheiro, pix, cartao };
  }, [caixa]);

  const cobrancasFiltradas = useMemo(() => {
    const termo = buscaCobranca
      .trim()
      .toLowerCase();

    if (!termo) {
      return cobrancasPendentes;
    }

    return cobrancasPendentes.filter((cobranca) => {
      const texto = [
        cobranca.aluno?.nome,
        cobranca.aluno?.user?.email,
        cobranca.descricao,
        cobranca.tipo,
        cobranca.matricula?.numeroMatricula,
        cobranca.matricula?.numeroMatriculaLegado,
        cobranca.matricula?.curso?.nome,
        cobranca.matricula
          ?.vendedorResponsavelNomeSnapshot,
        cobranca.polo?.nome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [buscaCobranca, cobrancasPendentes]);

  const totalPendente = useMemo(() => {
    return cobrancasFiltradas.reduce(
      (total, cobranca) =>
        total + Number(cobranca.saldoPendente || 0),
      0
    );
  }, [cobrancasFiltradas]);

  return (
    <div className="phanyx-financeiro-caixa-page max-w-7xl space-y-6 text-slate-950 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
          🏦 {t("page.title")}
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">
          {t("page.subtitle")}
        </p>
      </div>

      {podeVerCaixaOnlineIbe && (
        <div
          data-tour="caixa-online"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >    <div className="flex items-start justify-between gap-4">
            <div>
              <p className="phanyx-caixa-automatico-label text-xs font-black uppercase tracking-[0.16em]">
                {t("onlineCash.automaticLabel")}
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                🌐 {t("onlineCash.title")}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t("onlineCash.description")}
              </p>
            </div>

            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {t("onlineCash.readOnly")}
            </span>
          </div>

          {!caixaOnlineIbe ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {t("onlineCash.empty")}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("cards.status")}</p>
                <p className="text-2xl font-bold">{rotuloStatusCaixa(caixaOnlineIbe.status)}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("onlineCash.total")}</p>
                <p className="text-2xl font-bold">
                  {formatarMoeda(caixaOnlineIbe.saldoSistema || 0)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("onlineCash.payments")}</p>
                <p className="text-2xl font-bold">
                  {caixaOnlineIbe.movimentos?.length || 0}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
          <p className="font-semibold">{t("success.title")}</p>
          <p>{sucesso}</p>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t("loading.cash")}
        </div>
      ) : !caixa ? (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            {t("openCash.title")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              data-tour="caixa-saldo-inicial"
              type="number"
              step="0.01"
              min="0"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              placeholder={t("openCash.initialBalance")}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />

            <input
              data-tour="caixa-observacao-abertura"
              type="text"
              value={observacaoAbertura}
              onChange={(e) => setObservacaoAbertura(e.target.value)}
              placeholder={t("openCash.openingNote")}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <button
            data-tour="caixa-botao-abrir"
            onClick={abrirCaixa}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {t("openCash.button")}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("cards.cashStatus")}</p>
              <p className="text-2xl font-bold text-slate-950 dark:text-white">
                {rotuloStatusCaixa(caixa.status)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("cards.initialBalance")}</p>
              <p className="text-2xl font-bold text-slate-950 dark:text-white">
                {formatarMoeda(caixa.saldoInicial || 0)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("cards.systemBalance")}</p>
              <p className="text-2xl font-bold text-slate-950 dark:text-white">
                {formatarMoeda(caixa.saldoSistema || 0)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("cards.movements")}</p>
              <p className="text-2xl font-bold text-slate-950 dark:text-white">{caixa.movimentos.length}</p>
            </div>
          </div>

          <section className="phanyx-caixa-cobrancas rounded-3xl border p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                  💵 {t("charges.title")}
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {t("charges.subtitle")}
                </p>
              </div>

              <div className="phanyx-caixa-cobrancas-resumo rounded-2xl border px-4 py-3 text-sm">
                <p className="font-bold">
                  {t("charges.count", {
                    count: cobrancasFiltradas.length,
                  })}
                </p>

                <p className="mt-1">
                  {t("charges.totalPending")}:{" "}
                  <strong>
                    {formatarMoeda(totalPendente)}
                  </strong>
                </p>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                {t("charges.searchLabel")}
              </label>

              <input
                value={buscaCobranca}
                onChange={(evento) =>
                  setBuscaCobranca(evento.target.value)
                }
                placeholder={t("charges.searchPlaceholder")}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            {cobrancasFiltradas.length === 0 ? (
              <div className="phanyx-caixa-cobrancas-vazio mt-5 rounded-2xl border border-dashed p-8 text-center text-sm font-medium">
                {t("charges.empty")}
              </div>
            ) : (
              <div className="mt-5 space-y-4">

                {cobrancasFiltradas.map((cobranca) => {
                  const selecionada =
                    cobrancaSelecionadaId === cobranca.id;

                  return (
                    <article
                      key={cobranca.id}
                      className="phanyx-caixa-cobranca-card rounded-2xl border p-4"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-slate-950 dark:text-white">
                              {cobranca.aluno.nome}
                            </h3>

                            <span className="phanyx-caixa-cobranca-tipo rounded-full border px-3 py-1 text-xs font-bold">
                              {cobranca.tipo}
                            </span>

                            {cobranca.status === "ATRASADO" && (
                              <span className="phanyx-caixa-status-atrasado rounded-full border px-3 py-1 text-xs font-extrabold">
                                {t("charges.overdue")}
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                            {cobranca.descricao ||
                              t("charges.noDescription")}
                          </p>

                          <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-2 xl:grid-cols-4">
                            <p>
                              <strong>{t("charges.enrollment")}:</strong>{" "}
                              {cobranca.matricula
                                ?.numeroMatricula ||
                                cobranca.matricula
                                  ?.numeroMatriculaLegado ||
                                `#${cobranca.matricula?.id || "-"}`}
                            </p>

                            <p>
                              <strong>{t("charges.course")}:</strong>{" "}
                              {cobranca.matricula?.curso?.nome ||
                                t("common.notInformed")}
                            </p>

                            <p>
                              <strong>{t("charges.seller")}:</strong>{" "}
                              {cobranca.matricula
                                ?.vendedorResponsavelNomeSnapshot ||
                                t("common.notInformed")}
                            </p>

                            <p>
                              <strong>{t("charges.dueDate")}:</strong>{" "}
                              {cobranca.vencimento
                                ? formatarData(cobranca.vencimento)
                                : t("common.notInformed")}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 xl:text-right">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {t("charges.balance")}
                          </p>

                          <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                            {formatarMoeda(cobranca.saldoPendente || 0)}
                          </p>

                          <button
                            type="button"
                            disabled={!caixa}
                            onClick={() =>
                              selecionada
                                ? cancelarSelecaoCobranca()
                                : selecionarCobranca(cobranca)
                            }
                            className={[
                              "mt-3 rounded-xl px-4 py-2 text-sm font-black transition",
                              selecionada
                                ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                                : "bg-emerald-600 text-white hover:bg-emerald-700",
                              !caixa
                                ? "cursor-not-allowed opacity-50"
                                : "",
                            ].join(" ")}
                          >
                            {selecionada
                              ? t("charges.cancel")
                              : t("charges.receive")}
                          </button>
                        </div>
                      </div>

                      {selecionada && (
                        <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                                {t("charges.receivedAmount")}
                              </label>

                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={valorBaixa}
                                onChange={(evento) =>
                                  setValorBaixa(
                                    evento.target.value
                                  )
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                                {t("charges.paymentMethod")}
                              </label>

                              <select
                                value={formaPagamentoBaixa}
                                onChange={(evento) =>
                                  setFormaPagamentoBaixa(
                                    evento.target.value
                                  )
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              >
                                <option value="DINHEIRO">
                                  {t("paymentMethods.cash")}
                                </option>
                                <option value="PIX">PIX</option>
                                <option value="CARTAO">
                                  {t("paymentMethods.card")}
                                </option>
                                <option value="BOLETO">
                                  {t("paymentMethods.boleto")}
                                </option>
                                <option value="TRANSFERENCIA">
                                  {t("paymentMethods.transfer")}
                                </option>
                                <option value="OUTRO">
                                  {t("paymentMethods.other")}
                                </option>
                              </select>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                                {t("charges.note")}
                              </label>

                              <input
                                value={observacaoBaixa}
                                onChange={(evento) =>
                                  setObservacaoBaixa(
                                    evento.target.value
                                  )
                                }
                                placeholder={t("charges.optionalInfo")}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={salvandoBaixa}
                            onClick={darBaixaCobranca}
                            className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {salvandoBaixa
                              ? t("charges.registering")
                              : t("charges.confirmReceipt")}
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {t("movement.title")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={tipoMovimento}
                onChange={(e) => setTipoMovimento(e.target.value as "ENTRADA" | "SAIDA")}
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="ENTRADA">{t("movementTypes.entry")}</option>
                <option value="SAIDA">{t("movementTypes.exit")}</option>
              </select>

              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder={t("movement.description")}
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <input
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder={t("movement.value")}
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="DINHEIRO">{t("paymentMethods.cash")}</option>
                <option value="PIX">PIX</option>
                <option value="CARTAO">{t("paymentMethods.card")}</option>
                <option value="BOLETO">{t("paymentMethods.boleto")}</option>
                <option value="TRANSFERENCIA">{t("paymentMethods.transfer")}</option>
                <option value="OUTRO">{t("paymentMethods.other")}</option>
              </select>
            </div>

            <button
              onClick={registrarMovimento}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
            >
              {t("movement.register")}
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {t("paymentSummary.title")}
            </h2>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("paymentMethods.cash")}</p>
                <p className="text-2xl font-bold text-slate-950 dark:text-white">{formatarMoeda(resumo.dinheiro)}</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">PIX</p>
                <p className="text-2xl font-bold text-slate-950 dark:text-white">{formatarMoeda(resumo.pix)}</p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("paymentMethods.card")}</p>
                <p className="text-2xl font-bold text-slate-950 dark:text-white">{formatarMoeda(resumo.cartao)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {t("closeCash.title")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="number"
                step="0.01"
                min="0"
                value={saldoInformado}
                onChange={(e) => setSaldoInformado(e.target.value)}
                placeholder={t("closeCash.reportedBalance")}
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <input
                type="text"
                value={observacaoFechamento}
                onChange={(e) => setObservacaoFechamento(e.target.value)}
                placeholder={t("closeCash.note")}
                className="rounded-lg border border-slate-300 bg-white p-2 text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <button
              onClick={fecharCaixa}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              {t("closeCash.button")}
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {t("movementList.title")}
            </h2>

            {caixa.movimentos.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{t("movementList.empty")}</p>
            ) : (
              <div className="mt-4 space-y-2">
                {caixa.movimentos.map((mov) => (
                  <div key={mov.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                    <p className="font-medium">
                      {rotuloTipoMovimento(mov.tipo)} — {formatarMoeda(mov.valor || 0)}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300">{mov.descricao || "-"}</p>
                    <p className="text-slate-500 dark:text-slate-400">
                      {rotuloFormaPagamento(mov.formaPagamento)} •{" "}
                      {formatarDataHora(mov.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <CaixaTour
        aberto={tourAberto}
        onClose={() => setTourAberto(false)}
      />
    </div>
  );
}