"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import PhanyxToast from "@/components/ui/PhanyxToast";


type PagamentoItem = {
  id: number;
  valorPago: number;
  formaPagamento?: string | null;
  pagoEm?: string | null;
};

type Polo = {
  id: number;
  nome: string;
  codigo?: string | null;
  cnpj?: string | null;
};

type DocumentoFinanceiroGerado = {
  id: number;
  titulo: string;
  tipo: string;
  contexto?: string | null;
  criadoEm?: string;
  aluno?: {
    id: number;
    nome: string;
  } | null;
};

type RecebimentoItem = {
  id: number;
  tipo: string;
  descricao?: string | null;
  valorOriginal: number;
  descontoValor?: number | null;
  jurosValor?: number | null;
  multaValor?: number | null;
  valorFinal?: number | null;
  valorPago?: number | null;
  vencimento?: string | null;
  pagoEm?: string | null;
  status: string;
  observacao?: string | null;
  polo?: Polo | null;
  aluno?: {
    id: number;
    nome: string;
    matricula?: string | null;
    user?: {
      email?: string | null;
    } | null;
  } | null;
  pagamentos?: PagamentoItem[];
};

const recebimentosTourSteps = [
  {
    id: "recebimentos-resumo",
    target: '[data-tour="recebimentos-resumo"]',
    tituloKey: "tour.summary.title",
    destaqueKey: "tour.summary.highlight",
    descricaoKey: "tour.summary.description",
    imagem: "/images/financeiro.png",
  },
  {
    id: "recebimentos-filtros",
    target: '[data-tour="recebimentos-filtros"]',
    tituloKey: "tour.filters.title",
    destaqueKey: "tour.filters.highlight",
    descricaoKey: "tour.filters.description",
    imagem: "/images/financeiro.png",
  },
  {
    id: "recebimentos-polos",
    target: '[data-tour="recebimentos-polos"]',
    tituloKey: "tour.campuses.title",
    destaqueKey: "tour.campuses.highlight",
    descricaoKey: "tour.campuses.description",
    imagem: "/images/financeiro.png",
  },
  {
    id: "recebimentos-lote",
    target: '[data-tour="recebimentos-lote"]',
    tituloKey: "tour.batch.title",
    destaqueKey: "tour.batch.highlight",
    descricaoKey: "tour.batch.description",
    imagem: "/images/financeiro.png",
  },
  {
    id: "recebimentos-tabela",
    target: '[data-tour="recebimentos-tabela"]',
    tituloKey: "tour.table.title",
    destaqueKey: "tour.table.highlight",
    descricaoKey: "tour.table.description",
    imagem: "/images/financeiro.png",
  },
];

function getRectFromSelector(selector: string) {
  const elemento = document.querySelector(selector);

  if (!elemento) return null;

  const rect = elemento.getBoundingClientRect();

  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  };
}

function RecebimentosTour({
  aberto,
  onClose,
}: {
  aberto: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("AdminFinanceiroRecebimentos");
  const [stepAtual, setStepAtual] = useState(0);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const step = recebimentosTourSteps[stepAtual];

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

  const bubbleWidth = Math.min(
    420,
    Math.max(280, window.innerWidth - 32)
  );

  /*
   * Altura aproximada do bal?o.
   * O posicionamento usa uma margem de seguran?a para impedir
   * que o bal?o cubra o pr?prio card destacado.
   */
  const bubbleHeight = 270;
  const margemViewport = 16;
  const distanciaDoAlvo = 18;

  const posicaoBalao = spotlight
    ? (() => {
        const centroAlvoX =
          spotlight.left + spotlight.width / 2;

        const centroAlvoY =
          spotlight.top + spotlight.height / 2;

        const espacoAbaixo =
          window.innerHeight -
          (spotlight.top + spotlight.height);

        const espacoAcima =
          spotlight.top;

        const espacoDireita =
          window.innerWidth -
          (spotlight.left + spotlight.width);

        const espacoEsquerda =
          spotlight.left;

        let direcao:
          | "baixo"
          | "cima"
          | "direita"
          | "esquerda" = "baixo";

        /*
         * Primeiro tentamos a posi??o mais natural.
         * Se n?o houver espa?o, escolhemos outro lado
         * em vez de colocar o bal?o sobre o card.
         */
        if (
          espacoAbaixo >=
          bubbleHeight + distanciaDoAlvo + margemViewport
        ) {
          direcao = "baixo";
        } else if (
          espacoAcima >=
          bubbleHeight + distanciaDoAlvo + margemViewport
        ) {
          direcao = "cima";
        } else if (
          espacoDireita >=
          bubbleWidth + distanciaDoAlvo + margemViewport
        ) {
          direcao = "direita";
        } else if (
          espacoEsquerda >=
          bubbleWidth + distanciaDoAlvo + margemViewport
        ) {
          direcao = "esquerda";
        } else {
          /*
           * Em telas muito apertadas, escolhe o lado
           * com maior espa?o dispon?vel.
           */
          const opcoes: Array<
            [
              "baixo" | "cima" | "direita" | "esquerda",
              number
            ]
          > = [
            ["baixo", espacoAbaixo],
            ["cima", espacoAcima],
            ["direita", espacoDireita],
            ["esquerda", espacoEsquerda],
          ];

          opcoes.sort((a, b) => Number(b[1]) - Number(a[1]));

          direcao = opcoes[0][0];
        }

        let top = 0;
        let left = 0;

        if (direcao === "baixo") {
          top =
            spotlight.top +
            spotlight.height +
            distanciaDoAlvo;

          left =
            centroAlvoX -
            bubbleWidth / 2;
        }

        if (direcao === "cima") {
          top =
            spotlight.top -
            bubbleHeight -
            distanciaDoAlvo;

          left =
            centroAlvoX -
            bubbleWidth / 2;
        }

        if (direcao === "direita") {
          top =
            centroAlvoY -
            bubbleHeight / 2;

          left =
            spotlight.left +
            spotlight.width +
            distanciaDoAlvo;
        }

        if (direcao === "esquerda") {
          top =
            centroAlvoY -
            bubbleHeight / 2;

          left =
            spotlight.left -
            bubbleWidth -
            distanciaDoAlvo;
        }

        top = Math.max(
          margemViewport,
          Math.min(
            top,
            window.innerHeight -
              bubbleHeight -
              margemViewport
          )
        );

        left = Math.max(
          margemViewport,
          Math.min(
            left,
            window.innerWidth -
              bubbleWidth -
              margemViewport
          )
        );

        /*
         * A seta acompanha o centro real do card,
         * inclusive quando o bal?o precisou ser
         * deslocado para n?o sair da tela.
         */
        const setaHorizontal = Math.max(
          24,
          Math.min(
            centroAlvoX - left - 6,
            bubbleWidth - 36
          )
        );

        const setaVertical = Math.max(
          24,
          Math.min(
            centroAlvoY - top - 6,
            bubbleHeight - 36
          )
        );

        const setaStyle =
          direcao === "baixo"
            ? {
                left: `${setaHorizontal}px`,
                top: "-6px",
              }
            : direcao === "cima"
              ? {
                  left: `${setaHorizontal}px`,
                  bottom: "-6px",
                }
              : direcao === "direita"
                ? {
                    left: "-6px",
                    top: `${setaVertical}px`,
                  }
                : {
                    right: "-6px",
                    top: `${setaVertical}px`,
                  };

        return {
          style: {
            top: `${top}px`,
            left: `${left}px`,
          },
          direcao,
          setaStyle,
        };
      })()
    : {
        style: {
          top: "120px",
          left: "50%",
          transform: "translateX(-50%)",
        },
        direcao: "baixo" as const,
        setaStyle: {
          left: "50%",
          top: "-6px",
        },
      };

  const bubbleStyle = posicaoBalao.style;
  const setaStyle = posicaoBalao.setaStyle;

  function fechar() {
    localStorage.setItem("phanyx-tour-recebimentos", "concluido");
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
        className="absolute w-[min(420px,calc(100vw-32px))] rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-2xl transition-all duration-300"
        style={bubbleStyle}
      >
       {spotlight && (
  <div
    className="absolute h-3 w-3 rotate-45 border border-gray-200 bg-white shadow-sm"
    style={setaStyle}
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

            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {t(step.tituloKey as any)}
            </h3>

            <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
              {t(step.destaqueKey as any)}
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {t(step.descricaoKey as any)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            {t("tour.step", {
              current: stepAtual + 1,
              total: recebimentosTourSteps.length,
            })}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={fechar}
              className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {t("tour.close")}
            </button>

            {stepAtual > 0 && (
              <button
                type="button"
                onClick={() => setStepAtual((prev) => prev - 1)}
                className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {t("tour.previous")}
              </button>
            )}

            {stepAtual < recebimentosTourSteps.length - 1 ? (
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
  localStorage.setItem("phanyx-tour-recebimentos", "concluido");
  sessionStorage.setItem("phanyx-continuar-tour", "caixa");
  onClose();
  window.location.href = "/admin/financeiro/caixa";
}}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t("tour.goToCash")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFinanceiroRecebimentosPage() {
  const t = useTranslations("AdminFinanceiroRecebimentos");
  const locale = useLocale();

  const searchParams =
    useSearchParams();

  const lancamentoIdDireto =
    String(
      searchParams.get("lancamentoId") || "",
    ).trim();

  const [tourAberto, setTourAberto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [tipo, setTipo] = useState("");
  const [poloId, setPoloId] = useState("");
  const [polos, setPolos] = useState<Polo[]>([]);
  const [recebimentos, setRecebimentos] = useState<RecebimentoItem[]>([]);

  const [documentosGerados, setDocumentosGerados] = useState<
    DocumentoFinanceiroGerado[]
  >([]);

  const [selecionados, setSelecionados] = useState<number[]>([]);

  const [baixaId, setBaixaId] = useState<number | null>(null);
  const [valorPago, setValorPago] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [observacao, setObservacao] = useState("");
  const [descontoValor, setDescontoValor] = useState("");
  const [jurosValor, setJurosValor] = useState("");
  const [multaValor, setMultaValor] = useState("");

  const [loteValorPago, setLoteValorPago] = useState("");
  const [loteFormaPagamento, setLoteFormaPagamento] = useState("PIX");
  const [loteObservacao, setLoteObservacao] = useState("");
  const [loteDescontoValor, setLoteDescontoValor] = useState("");
  const [loteJurosValor, setLoteJurosValor] = useState("");
  const [loteMultaValor, setLoteMultaValor] = useState("");
  const [baixandoLote, setBaixandoLote] = useState(false);

  function formatarMoeda(valor: number | string | null | undefined) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor || 0));
  }

  function formatarData(data?: string | null, comHora = false) {
    if (!data) return "-";

    const valor = new Date(data);

    return comHora
      ? valor.toLocaleString(locale)
      : valor.toLocaleDateString(locale);
  }

  function labelStatus(status?: string | null) {
    const chave = String(status || "").toUpperCase();

    const labels: Record<string, string> = {
      PENDENTE: t("status.pending"),
      PARCIAL: t("status.partial"),
      PAGO: t("status.paid"),
      ATRASADO: t("status.overdue"),
      CANCELADO: t("status.cancelled"),
    };

    return labels[chave] || status || "-";
  }

  function labelTipo(tipo?: string | null) {
    const chave = String(tipo || "").toUpperCase();

    const labels: Record<string, string> = {
      MATRICULA: t("types.enrollment"),
      MENSALIDADE: t("types.tuition"),
      TAXA: t("types.fee"),
      DESCONTO: t("types.discount"),
      OUTRO: t("types.other"),
    };

    return labels[chave] || tipo || "-";
  }

  function labelFormaPagamento(forma?: string | null) {
    const chave = String(forma || "").toUpperCase();

    const labels: Record<string, string> = {
      DINHEIRO: t("paymentMethods.cash"),
      PIX: t("paymentMethods.pix"),
      CARTAO: t("paymentMethods.card"),
      BOLETO: t("paymentMethods.bankSlip"),
      TRANSFERENCIA: t("paymentMethods.transfer"),
      OUTRO: t("paymentMethods.other"),
    };

    return labels[chave] || forma || "-";
  }
  

  async function carregarRecebimentos() {
    try {
      setLoading(true);
      setErro("");
setSucesso("");

      const query = new URLSearchParams();

      if (lancamentoIdDireto) {
        query.set(
          "lancamentoId",
          lancamentoIdDireto,
        );
      } else {
        if (busca.trim()) {
          query.set(
            "busca",
            busca.trim(),
          );
        }

        if (status) {
          query.set(
            "status",
            status,
          );
        }

        if (tipo) {
          query.set(
            "tipo",
            tipo,
          );
        }

        if (poloId) {
          query.set(
            "poloId",
            poloId,
          );
        }
      }

      const res = await fetch(
        `/api/admin/financeiro/recebimentos?${query.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("errors.loadReceipts"));
      }

      setRecebimentos(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErro(e?.message || t("errors.loadReceipts"));
      setRecebimentos([]);
    } finally {
      setLoading(false);
    }
  }

async function carregarPolos() {
  try {
    const res = await fetch("/api/admin/polos", {
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (res.ok) {
      setPolos(Array.isArray(data) ? data : []);
    }
  } catch (error) {
    console.error("Erro ao carregar polos:", error);
  }
}

  useEffect(() => {
  carregarRecebimentos();
  carregarPolos();
}, []);

  useEffect(() => {
    const t = setTimeout(() => {
      carregarRecebimentos();
    }, 300);

    return () => clearTimeout(t);
  }, [
    busca,
    status,
    tipo,
    poloId,
    lancamentoIdDireto,
  ]);

  

  async function carregarDocumentosFinanceirosDoAluno(alunoId?: number | null) {
    if (!alunoId) {
      setDocumentosGerados([]);
      return;
    }

    try {
      const res = await fetch("/api/admin/documentos/gerados", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("errors.loadDocuments"));
      }

      const docs = Array.isArray(data) ? data : [];

      const filtrados = docs
        .filter((doc: any) => {
          return (
            doc?.contexto === "FINANCEIRO" &&
            doc?.aluno?.id === alunoId &&
            (doc?.tipo === "RECIBO" || doc?.tipo === "COMPROVANTE")
          );
        })
        .sort((a: any, b: any) => {
          return (
            new Date(b?.criadoEm || 0).getTime() -
            new Date(a?.criadoEm || 0).getTime()
          );
        })
        .slice(0, 2);

      setDocumentosGerados(filtrados);
    } catch (e) {
      console.error(e);
      setDocumentosGerados([]);
    }
  }

      async function darBaixa(lancamentoId: number) {
    try {
      setErro("");
      setErro("");
setSucesso("");
setDocumentosGerados([]);

      const recebimento = recebimentos.find((item) => item.id === lancamentoId);

      const res = await fetch("/api/admin/financeiro/recebimentos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          lancamentoId,
          valorPago,
          formaPagamento,
          observacao,
          descontoValor,
          jurosValor,
          multaValor,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("errors.settle"));
      }

      setBaixaId(null);
      setValorPago("");
      setFormaPagamento("PIX");
      setObservacao("");
      setDescontoValor("");
      setJurosValor("");
      setMultaValor("");

      await carregarRecebimentos();
      await carregarDocumentosFinanceirosDoAluno(recebimento?.aluno?.id || null);

      setSucesso(t("messages.settlementSuccess"));
    } catch (e: any) {
      setErro(e?.message || t("errors.settle"));
    }
  }

  function toggleSelecionado(id: number) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function darBaixaEmLote() {
  try {
    if (selecionados.length === 0) {
      setErro(t("errors.selectAtLeastOne"));
      return;
    }

    setBaixandoLote(true);
    setErro("");
    setSucesso("");
    for (const id of selecionados) {
      const item = recebimentos.find((r) => r.id === id);
      if (!item) continue;

      const valorFinalCalculado =
        numero(loteValorPago) > 0
          ? numero(loteValorPago)
          : calcularValorFinalLote(item);

      const res = await fetch("/api/admin/financeiro/recebimentos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          lancamentoId: id,
          valorPago: valorFinalCalculado,
          formaPagamento: loteFormaPagamento,
          observacao: loteObservacao,
          descontoValor: loteDescontoValor,
          jurosValor: loteJurosValor,
          multaValor: loteMultaValor,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || t("errors.settleEntry", { id })
        );
      }
    }

    setSelecionados([]);
    setLoteValorPago("");
    setLoteDescontoValor("");
    setLoteJurosValor("");
    setLoteMultaValor("");
    setLoteObservacao("");

    await carregarRecebimentos();

    setSucesso(t("messages.batchSuccess"));
  } catch (e: any) {
    console.error(e);
    setErro(e?.message || t("errors.batchSettlement"));
  } finally {
    setBaixandoLote(false);
  }
}

  function numero(valor: string | number | null | undefined) {
    if (valor === null || valor === undefined) return 0;
    const texto = String(valor).replace(",", ".").trim();
    const n = Number(texto);
    return Number.isFinite(n) ? n : 0;
  }

function calcularValorFinalLote(item: RecebimentoItem) {
  const valorBase = numero(
    item?.valorFinal ?? item?.valorOriginal ?? 0
  );

  const desconto = numero(loteDescontoValor);
  const juros = numero(loteJurosValor);
  const multa = numero(loteMultaValor);

  const calculado = valorBase - desconto + juros + multa;

  return calculado > 0 ? calculado : 0;
}

  function calcularValorFinalBaixa() {
    if (!baixaId) return 0;

    const recebimento = recebimentos.find((item) => item.id === baixaId);
    const valorBase = numero(
      recebimento?.valorFinal ?? recebimento?.valorOriginal ?? 0
    );

    const desconto = numero(descontoValor);
    const juros = numero(jurosValor);
    const multa = numero(multaValor);

    const calculado = valorBase - desconto + juros + multa;

    return calculado > 0 ? calculado : 0;
  }

    useEffect(() => {
    if (!baixaId) return;

    const valorCalculado = calcularValorFinalBaixa();
    setValorPago(valorCalculado ? valorCalculado.toFixed(2) : "");
  }, [baixaId, descontoValor, jurosValor, multaValor, recebimentos]);

  const resumo = useMemo(() => {
  const total = recebimentos.reduce(
    (acc, item) => acc + Number(item.valorFinal ?? item.valorOriginal ?? 0),
    0
  );
  const pago = recebimentos.reduce(
    (acc, item) => acc + Number(item.valorPago || 0),
    0
  );
  const pendente = total - pago;
  const atrasados = recebimentos.filter((item) => item.status === "ATRASADO");
  const totalAtrasado = atrasados.reduce(
    (acc, item) => acc + Number(item.valorFinal ?? item.valorOriginal ?? 0) - Number(item.valorPago || 0),
    0
  );

  return {
    total,
    pago,
    pendente,
    qtdAtrasados: atrasados.length,
    totalAtrasado,
  };
}, [recebimentos]);

useEffect(() => {
  const abrirTour = () => {
    setTourAberto(true);
  };

  const continuarTour = sessionStorage.getItem("phanyx-continuar-tour");

  if (continuarTour === "recebimentos") {
    sessionStorage.removeItem("phanyx-continuar-tour");

    setTimeout(() => {
      setTourAberto(true);
    }, 600);
  }

  window.addEventListener("phanyx:abrir-tour-recebimentos", abrirTour);

  return () => {
    window.removeEventListener("phanyx:abrir-tour-recebimentos", abrirTour);
  };
}, []);

  return (
    <div className="phanyx-financeiro-recebimentos-page space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">💵 {t("title")}</h1>
        <p className="text-gray-600 mt-1">{t("subtitle")}</p>
      </div>

      <div
        data-tour="recebimentos-resumo"
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">{t("summary.totalFinal")}</p>
          <p className="text-2xl font-bold">{formatarMoeda(resumo.total)}</p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">{t("summary.paid")}</p>
          <p className="text-2xl font-bold">{formatarMoeda(resumo.pago)}</p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">{t("summary.pending")}</p>
          <p className="text-2xl font-bold">{formatarMoeda(resumo.pendente)}</p>
        </div>

        <div className="bg-white border rounded-xl p-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-700">{t("summary.overdue")}</p>
          <p className="text-lg font-bold text-red-700">
            {t("summary.entriesCount", { count: resumo.qtdAtrasados })}
          </p>
          <p className="text-sm text-red-700 mt-1">
            {formatarMoeda(resumo.totalAtrasado)}
          </p>
        </div>
      </div>

      <div
        data-tour="recebimentos-filtros"
        className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3"
      >
        <input
          type="text"
          placeholder={t("filters.searchPlaceholder")}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border rounded-lg p-2"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg p-2 bg-white"
        >
          <option value="">{t("filters.allStatuses")}</option>
          <option value="PENDENTE">{t("status.pending")}</option>
          <option value="PARCIAL">{t("status.partial")}</option>
          <option value="PAGO">{t("status.paid")}</option>
          <option value="ATRASADO">{t("status.overdue")}</option>
          <option value="CANCELADO">{t("status.cancelled")}</option>
        </select>

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="border rounded-lg p-2 bg-white"
        >
          <option value="">{t("filters.allTypes")}</option>
          <option value="MATRICULA">{t("types.enrollment")}</option>
          <option value="MENSALIDADE">{t("types.tuition")}</option>
          <option value="TAXA">{t("types.fee")}</option>
          <option value="DESCONTO">{t("types.discount")}</option>
          <option value="OUTRO">{t("types.other")}</option>
        </select>
      </div>

      <div data-tour="recebimentos-polos">
        <select
          value={poloId}
          onChange={(e) => setPoloId(e.target.value)}
          className="border rounded-lg p-2 bg-white"
        >
          <option value="">{t("filters.allCampuses")}</option>
          {polos.map((polo) => (
            <option key={polo.id} value={polo.id}>
              {polo.nome}
            </option>
          ))}
        </select>
      </div>

      <div
        data-tour="recebimentos-lote"
        className="bg-white border rounded-xl p-4 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t("batch.title")}</h2>
          <p className="text-sm text-gray-600">
            {t("batch.selected", { count: selecionados.length })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            type="number"
            step="0.01"
            min="0"
            value={loteValorPago}
            onChange={(e) => setLoteValorPago(e.target.value)}
            placeholder={t("fields.amountPaid")}
            className="border rounded-lg p-2"
          />

          <select
            value={loteFormaPagamento}
            onChange={(e) => setLoteFormaPagamento(e.target.value)}
            className="border rounded-lg p-2 bg-white"
          >
            <option value="DINHEIRO">{t("paymentMethods.cash")}</option>
            <option value="PIX">{t("paymentMethods.pix")}</option>
            <option value="CARTAO">{t("paymentMethods.card")}</option>
            <option value="BOLETO">{t("paymentMethods.bankSlip")}</option>
            <option value="TRANSFERENCIA">{t("paymentMethods.transfer")}</option>
            <option value="OUTRO">{t("paymentMethods.other")}</option>
          </select>

          <input
            type="number"
            step="0.01"
            min="0"
            value={loteDescontoValor}
            onChange={(e) => setLoteDescontoValor(e.target.value)}
            placeholder={t("fields.discount")}
            className="border rounded-lg p-2"
          />

          <input
            type="number"
            step="0.01"
            min="0"
            value={loteJurosValor}
            onChange={(e) => setLoteJurosValor(e.target.value)}
            placeholder={t("fields.interest")}
            className="border rounded-lg p-2"
          />

          <input
            type="number"
            step="0.01"
            min="0"
            value={loteMultaValor}
            onChange={(e) => setLoteMultaValor(e.target.value)}
            placeholder={t("fields.penalty")}
            className="border rounded-lg p-2"
          />

          <input
            type="text"
            value={loteObservacao}
            onChange={(e) => setLoteObservacao(e.target.value)}
            placeholder={t("fields.note")}
            className="border rounded-lg p-2"
          />

          {selecionados.length > 0 && (
            <div className="text-sm font-medium text-slate-700 md:col-span-6">
              {t("batch.averageValue")}{" "}
              <span className="font-bold text-blue-700">
                {formatarMoeda(
                  selecionados.reduce((acc, id) => {
                    const item = recebimentos.find((r) => r.id === id);
                    if (!item) return acc;
                    return acc + calcularValorFinalLote(item);
                  }, 0) / selecionados.length
                )}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={darBaixaEmLote}
          disabled={baixandoLote}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {baixandoLote ? t("batch.processing") : t("batch.submit")}
        </button>
      </div>

      {erro && (
        <PhanyxToast
          tipo="erro"
          titulo={t("toast.errorTitle")}
          mensagem={erro}
          onClose={() => setErro("")}
        />
      )}

      {sucesso && (
        <PhanyxToast
          tipo="sucesso"
          titulo={t("toast.successTitle")}
          mensagem={sucesso}
          onClose={() => setSucesso("")}
        />
      )}

      {documentosGerados.length > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-green-800">
                {t("documents.successTitle")}
              </p>
              <p className="mt-1 text-sm text-green-700">
                {t("documents.successDescription")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {documentosGerados.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() =>
                    window.open(`/api/admin/documentos/pdf/${doc.id}`, "_blank")
                  }
                  className="rounded-xl border border-green-300 bg-white px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
                >
                  {doc.tipo === "RECIBO"
                    ? t("documents.openReceipt")
                    : t("documents.openProof")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        className="bg-white border rounded-xl overflow-hidden"
      >
        <div data-tour="recebimentos-tabela" className="phanyx-financeiro-grid-head grid grid-cols-10 gap-3 border-b px-4 py-3 text-sm font-black">
          <div></div>
          <div>{t("table.student")}</div>
          <div>{t("table.type")}</div>
          <div>{t("table.description")}</div>
          <div>{t("table.baseValue")}</div>
          <div>{t("table.finalValue")}</div>
          <div>{t("table.paid")}</div>
          <div>{t("table.status")}</div>
          <div>{t("table.dueDate")}</div>
          <div>{t("table.actions")}</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-600">{t("table.loading")}</div>
        ) : recebimentos.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">{t("table.empty")}</div>
        ) : (
          recebimentos.map((item) => (
            <div
              key={item.id}
              className={`border-b px-4 py-4 ${
                item.status === "ATRASADO" ? "bg-red-50" : ""
              }`}
            >
              <div className="grid grid-cols-10 gap-3 text-sm items-center">
                <div>
                  {item.status !== "PAGO" && (
                    <input
                      type="checkbox"
                      checked={selecionados.includes(item.id)}
                      onChange={() => toggleSelecionado(item.id)}
                    />
                  )}
                </div>

                <div>
                  <p className="font-medium">{item.aluno?.nome || "-"}</p>
                  <p className="text-gray-500">
                    {item.aluno?.matricula || "-"}
                  </p>
                  <p className="text-gray-500">
                    {t("table.campus")}: {item.polo?.nome || "-"}
                  </p>
                </div>

                <div>{labelTipo(item.tipo)}</div>
                <div>{item.descricao || "-"}</div>
                <div>{formatarMoeda(item.valorOriginal)}</div>
                <div>
                  {formatarMoeda(item.valorFinal ?? item.valorOriginal ?? 0)}
                </div>
                <div>{formatarMoeda(item.valorPago || 0)}</div>

                <div>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      item.status === "PAGO"
                        ? "bg-green-100 text-green-700"
                        : item.status === "PARCIAL"
                        ? "bg-yellow-100 text-yellow-700"
                        : item.status === "ATRASADO"
                        ? "bg-red-100 text-red-700"
                        : item.status === "CANCELADO"
                        ? "bg-gray-200 text-gray-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {labelStatus(item.status)}
                  </span>
                </div>

                <div>{formatarData(item.vencimento)}</div>

                <div>
                  {item.status !== "PAGO" && (
                    <button
                      onClick={() =>
                        setBaixaId((prev) =>
                          prev === item.id ? null : item.id
                        )
                      }
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                    >
                      {t("buttons.settle")}
                    </button>
                  )}
                </div>
              </div>

              {(Number(item.descontoValor || 0) > 0 ||
                Number(item.jurosValor || 0) > 0 ||
                Number(item.multaValor || 0) > 0) && (
                <div className="mt-2 text-xs text-gray-600">
                  {t("fields.discount")}:{" "}
                  {formatarMoeda(item.descontoValor || 0)} •{" "}
                  {t("fields.interest")}: {formatarMoeda(item.jurosValor || 0)} •{" "}
                  {t("fields.penalty")}: {formatarMoeda(item.multaValor || 0)}
                </div>
              )}

              {baixaId === item.id && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3 bg-gray-50 border rounded-lg p-4">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                    placeholder={t("fields.amountPaid")}
                    className="border rounded-lg p-2"
                  />

                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="border rounded-lg p-2 bg-white"
                  >
                    <option value="DINHEIRO">{t("paymentMethods.cash")}</option>
                    <option value="PIX">{t("paymentMethods.pix")}</option>
                    <option value="CARTAO">{t("paymentMethods.card")}</option>
                    <option value="BOLETO">{t("paymentMethods.bankSlip")}</option>
                    <option value="TRANSFERENCIA">
                      {t("paymentMethods.transfer")}
                    </option>
                    <option value="OUTRO">{t("paymentMethods.other")}</option>
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={descontoValor}
                    onChange={(e) => setDescontoValor(e.target.value)}
                    placeholder={t("fields.discount")}
                    className="border rounded-lg p-2"
                  />

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={jurosValor}
                    onChange={(e) => setJurosValor(e.target.value)}
                    placeholder={t("fields.interest")}
                    className="border rounded-lg p-2"
                  />

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={multaValor}
                    onChange={(e) => setMultaValor(e.target.value)}
                    placeholder={t("fields.penalty")}
                    className="border rounded-lg p-2"
                  />

                  <input
                    type="text"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder={t("fields.note")}
                    className="border rounded-lg p-2"
                  />

                  <div className="md:col-span-6 flex gap-2">
                    <button
                      onClick={() => darBaixa(item.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                    >
                      {t("buttons.confirmSettlement")}
                    </button>

                    <button
                      onClick={() => {
                        setBaixaId(null);
                        setValorPago("");
                        setFormaPagamento("PIX");
                        setObservacao("");
                        setDescontoValor("");
                        setJurosValor("");
                        setMultaValor("");
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg text-sm"
                    >
                      {t("buttons.cancel")}
                    </button>
                  </div>
                </div>
              )}

              {item.pagamentos && item.pagamentos.length > 0 && (
                <div className="mt-3 text-xs text-gray-600">
                  <p className="font-medium mb-1">
                    {t("payments.title")}
                  </p>

                  <div className="space-y-1">
                    {item.pagamentos.map((pag) => (
                      <p key={pag.id}>
                        {formatarData(pag.pagoEm, true)} —{" "}
                        {formatarMoeda(pag.valorPago || 0)} —{" "}
                        {labelFormaPagamento(pag.formaPagamento)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <RecebimentosTour
        aberto={tourAberto}
        onClose={() => setTourAberto(false)}
      />
    </div>
  );
}
