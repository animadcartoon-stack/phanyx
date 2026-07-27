"use client";

import { useEffect, useMemo, useState } from "react";

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
    titulo: "Abrir caixa manual",
    destaque: "Comece o caixa do dia informando o saldo inicial.",
    descricao:
      "Use esta área para abrir o caixa físico ou manual da secretaria/financeiro.",
    imagem: "/images/financeiro.png",
  },
  {
    id: "saldo-inicial",
    target: '[data-tour="caixa-saldo-inicial"]',
    titulo: "Saldo inicial",
    destaque: "Informe quanto existe no caixa no momento da abertura.",
    descricao:
      "Esse valor será usado no fechamento para comparar o saldo esperado com o saldo informado.",
    imagem: "/images/contador.png",
  },
  {
    id: "observacao-abertura",
    target: '[data-tour="caixa-observacao-abertura"]',
    titulo: "Observação de abertura",
    destaque: "Registre detalhes importantes da abertura.",
    descricao:
      "Você pode anotar responsável, turno, conferência inicial ou qualquer informação útil.",
    imagem: "/images/financeiro.png",
  },
  {
    id: "botao-abrir",
    target: '[data-tour="caixa-botao-abrir"]',
    titulo: "Confirmar abertura",
    destaque: "Depois de conferir os dados, clique para abrir o caixa.",
    descricao:
      "Após aberto, o sistema libera o registro de entradas, saídas, resumo e fechamento.",
    imagem: "/images/formix-bemvindo.png",
  },
];

function CaixaTour({
  aberto,
  onClose,
}: {
  aberto: boolean;
  onClose: () => void;
}) {
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
        className="absolute w-[min(420px,calc(100vw-32px))] rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-2xl transition-all duration-300"
        style={bubbleStyle}
      >
        {spotlight && (
          <div
            className="absolute h-3 w-3 rotate-45 border border-gray-200 bg-white shadow-sm"
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
              Tutorial guiado
            </p>

            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {step.titulo}
            </h3>

            <p className="mt-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {step.destaque}
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {step.descricao}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            Etapa {stepAtual + 1} de {caixaTourSteps.length}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={fechar}
              className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Fechar
            </button>

            {stepAtual > 0 && (
              <button
                type="button"
                onClick={() => setStepAtual((prev) => prev - 1)}
                className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Anterior
              </button>
            )}

            {stepAtual < caixaTourSteps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStepAtual((prev) => prev + 1)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Próximo
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
                Ir para inadimplentes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFinanceiroCaixaPage() {
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
        throw new Error(data?.error || "Erro ao carregar caixa");
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
      setErro(e?.message || "Erro ao carregar caixa");
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
        throw new Error(data?.error || "Erro ao abrir caixa");
      }

      setSaldoInicial("");
      setObservacaoAbertura("");
      await carregarCaixa();
      setSucesso("Caixa aberto com sucesso.");
    } catch (e: any) {
      setErro(e?.message || "Erro ao abrir caixa");
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
      "Abra seu caixa antes de registrar o recebimento."
    );
    return;
  }

  if (!cobrancaSelecionadaId) {
    setErro("Selecione uma cobrança.");
    return;
  }

  const valorNumerico = Number(valorBaixa);

  if (
    !Number.isFinite(valorNumerico) ||
    valorNumerico <= 0
  ) {
    setErro("Informe um valor válido para a baixa.");
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
          "Não foi possível registrar o recebimento."
      );
    }

    cancelarSelecaoCobranca();

    await carregarCaixa();

    setSucesso(
      "Recebimento registrado e lançado no seu caixa com sucesso."
    );
  } catch (e: any) {
    setErro(
      e?.message ||
        "Não foi possível registrar o recebimento."
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
        throw new Error(data?.error || "Erro ao registrar movimento");
      }

      setDescricao("");
      setValor("");
      setFormaPagamento("PIX");
      await carregarCaixa();
      setSucesso("Movimento registrado com sucesso.");
    } catch (e: any) {
      setErro(e?.message || "Erro ao registrar movimento");
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
        throw new Error(data?.error || "Erro ao fechar caixa");
      }

      setSaldoInformado("");
      setObservacaoFechamento("");
      await carregarCaixa();
      setSucesso("Caixa fechado com sucesso.");
    } catch (e: any) {
      setErro(e?.message || "Erro ao fechar caixa");
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
    <div className="phanyx-financeiro-caixa-page max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🏦 Caixa</h1>
        <p className="text-gray-600 mt-1">
          Abertura, movimentação e fechamento de caixa.
        </p>
      </div>

{podeVerCaixaOnlineIbe && (
<div
  data-tour="caixa-online"
  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
>    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
          Caixa automático
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          🌐 Caixa Online Asaas IBE
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Recebe automaticamente os pagamentos feitos na matrícula online IBE.
        </p>
      </div>

      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
        Somente leitura
      </span>
    </div>

    {!caixaOnlineIbe ? (
      <p className="mt-4 text-sm text-slate-600">
        Nenhum pagamento online IBE registrado hoje.
      </p>
    ) : (
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
          <p className="text-sm text-slate-500">Status</p>
          <p className="text-2xl font-bold">{caixaOnlineIbe.status}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
          <p className="text-sm text-slate-500">Total online</p>
          <p className="text-2xl font-bold">
            R$ {Number(caixaOnlineIbe.saldoSistema || 0).toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
          <p className="text-sm text-slate-500">Pagamentos</p>
          <p className="text-2xl font-bold">
            {caixaOnlineIbe.movimentos?.length || 0}
          </p>
        </div>
      </div>
    )}
  </div>
)}

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

{sucesso && (
  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-sm">
    <p className="font-semibold">Tudo certo.</p>
    <p>{sucesso}</p>
  </div>
)}

      {loading ? (
        <div className="bg-white border rounded-xl p-6 text-gray-600">Carregando caixa...</div>
      ) : !caixa ? (
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Abrir caixa</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              data-tour="caixa-saldo-inicial"
              type="number"
              step="0.01"
              min="0"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              placeholder="Saldo inicial"
              className="border rounded-lg p-2"
            />

            <input
              data-tour="caixa-observacao-abertura"
              type="text"
              value={observacaoAbertura}
              onChange={(e) => setObservacaoAbertura(e.target.value)}
              placeholder="Observação de abertura"
              className="border rounded-lg p-2"
            />
          </div>

          <button
            data-tour="caixa-botao-abrir"
            onClick={abrirCaixa}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Abrir caixa
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">Status do caixa</p>
              <p className="text-2xl font-bold">{caixa.status}</p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">Saldo inicial</p>
              <p className="text-2xl font-bold">R$ {Number(caixa.saldoInicial || 0).toFixed(2)}</p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">Saldo do sistema</p>
              <p className="text-2xl font-bold">R$ {Number(caixa.saldoSistema || 0).toFixed(2)}</p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">Movimentos</p>
              <p className="text-2xl font-bold">{caixa.movimentos.length}</p>
            </div>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <h2 className="text-xl font-black text-slate-950 dark:text-white">
        💵 Cobranças aguardando recebimento
      </h2>

      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Matrículas e mensalidades pendentes para recebimento
        neste caixa.
      </p>
    </div>

    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
      <p className="font-bold">
        {cobrancasFiltradas.length} cobrança(s)
      </p>

      <p className="mt-1">
        Total pendente:{" "}
        <strong>
          {totalPendente.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </strong>
      </p>
    </div>
  </div>

  <div className="mt-5">
    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
      Buscar cobrança
    </label>

    <input
      value={buscaCobranca}
      onChange={(evento) =>
        setBuscaCobranca(evento.target.value)
      }
      placeholder="Aluno, matrícula, curso, vendedor ou descrição..."
      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
    />
  </div>

  {cobrancasFiltradas.length === 0 ? (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
      Nenhuma cobrança pendente encontrada.
    </div>
  ) : (
    <div className="mt-5 space-y-4">
      {cobrancasFiltradas.map((cobranca) => {
        const selecionada =
          cobrancaSelecionadaId === cobranca.id;

        return (
          <article
            key={cobranca.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-slate-950 dark:text-white">
                    {cobranca.aluno.nome}
                  </h3>

                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {cobranca.tipo}
                  </span>

                  {cobranca.status === "ATRASADO" && (
                    <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                      Atrasada
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  {cobranca.descricao ||
                    "Cobrança sem descrição"}
                </p>

                <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-2 xl:grid-cols-4">
                  <p>
                    <strong>Matrícula:</strong>{" "}
                    {cobranca.matricula
                      ?.numeroMatricula ||
                      cobranca.matricula
                        ?.numeroMatriculaLegado ||
                      `#${cobranca.matricula?.id || "-"}`}
                  </p>

                  <p>
                    <strong>Curso:</strong>{" "}
                    {cobranca.matricula?.curso?.nome ||
                      "Não informado"}
                  </p>

                  <p>
                    <strong>Vendedor:</strong>{" "}
                    {cobranca.matricula
                      ?.vendedorResponsavelNomeSnapshot ||
                      "Não informado"}
                  </p>

                  <p>
                    <strong>Vencimento:</strong>{" "}
                    {cobranca.vencimento
                      ? new Date(
                          cobranca.vencimento
                        ).toLocaleDateString("pt-BR")
                      : "Não informado"}
                  </p>
                </div>
              </div>

              <div className="shrink-0 xl:text-right">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Saldo pendente
                </p>

                <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                  {Number(
                    cobranca.saldoPendente || 0
                  ).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
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
                    ? "Cancelar"
                    : "Dar baixa"}
                </button>
              </div>
            </div>

            {selecionada && (
              <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Valor recebido
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
                      Forma de pagamento
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
                        Dinheiro
                      </option>
                      <option value="PIX">PIX</option>
                      <option value="CARTAO">
                        Cartão
                      </option>
                      <option value="BOLETO">
                        Boleto
                      </option>
                      <option value="TRANSFERENCIA">
                        Transferência
                      </option>
                      <option value="OUTRO">
                        Outro
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                      Observação
                    </label>

                    <input
                      value={observacaoBaixa}
                      onChange={(evento) =>
                        setObservacaoBaixa(
                          evento.target.value
                        )
                      }
                      placeholder="Informação opcional"
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
                    ? "Registrando recebimento..."
                    : "Confirmar recebimento"}
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  )}
</section>

          <div className="bg-white border rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold">Registrar movimento</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={tipoMovimento}
                onChange={(e) => setTipoMovimento(e.target.value as "ENTRADA" | "SAIDA")}
                className="border rounded-lg p-2 bg-white"
              >
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>

              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição"
                className="border rounded-lg p-2"
              />

              <input
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Valor"
                className="border rounded-lg p-2"
              />

              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="border rounded-lg p-2 bg-white"
              >
                <option value="DINHEIRO">Dinheiro</option>
                <option value="PIX">PIX</option>
                <option value="CARTAO">Cartão</option>
                <option value="BOLETO">Boleto</option>
                <option value="TRANSFERENCIA">Transferência</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <button
              onClick={registrarMovimento}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
            >
              Registrar movimento
            </button>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <h2 className="text-lg font-semibold">Resumo por forma de pagamento</h2>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Dinheiro</p>
                <p className="text-2xl font-bold">R$ {resumo.dinheiro.toFixed(2)}</p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">PIX</p>
                <p className="text-2xl font-bold">R$ {resumo.pix.toFixed(2)}</p>
              </div>

              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Cartão</p>
                <p className="text-2xl font-bold">R$ {resumo.cartao.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold">Fechamento de caixa</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="number"
                step="0.01"
                min="0"
                value={saldoInformado}
                onChange={(e) => setSaldoInformado(e.target.value)}
                placeholder="Saldo informado no fechamento"
                className="border rounded-lg p-2"
              />

              <input
                type="text"
                value={observacaoFechamento}
                onChange={(e) => setObservacaoFechamento(e.target.value)}
                placeholder="Observação de fechamento"
                className="border rounded-lg p-2"
              />
            </div>

            <button
              onClick={fecharCaixa}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Fechar caixa
            </button>
          </div>

          <div className="bg-white border rounded-xl p-5">
            <h2 className="text-lg font-semibold">Movimentos do caixa</h2>

            {caixa.movimentos.length === 0 ? (
              <p className="text-sm text-gray-600 mt-3">Nenhum movimento registrado.</p>
            ) : (
              <div className="mt-4 space-y-2">
                {caixa.movimentos.map((mov) => (
                  <div key={mov.id} className="border rounded-lg p-3 text-sm">
                    <p className="font-medium">
                      {mov.tipo} — R$ {Number(mov.valor || 0).toFixed(2)}
                    </p>
                    <p className="text-gray-600">{mov.descricao || "-"}</p>
                    <p className="text-gray-500">
                      {mov.formaPagamento || "-"} •{" "}
                      {mov.createdAt ? new Date(mov.createdAt).toLocaleString("pt-BR") : "-"}
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