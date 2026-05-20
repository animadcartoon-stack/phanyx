"use client";

import { useEffect, useMemo, useState } from "react";
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
    titulo: "Resumo dos recebimentos",
    destaque: "Veja rapidamente os valores lançados, pagos, pendentes e atrasados.",
    descricao:
      "Esses cards mostram a saúde financeira dos recebimentos da instituição.",
    imagem: "/images/financeiro.png",
  },
  {
    id: "recebimentos-filtros",
    target: '[data-tour="recebimentos-filtros"]',
    titulo: "Filtros de busca",
    destaque: "Encontre cobranças por aluno, matrícula, status ou tipo.",
    descricao:
      "Use os filtros para localizar lançamentos específicos de forma rápida.",
    imagem: "/images/financeiro.png",
  },
  {
    id: "recebimentos-polos",
    target: '[data-tour="recebimentos-polos"]',
    titulo: "Filtro por polo",
    destaque: "Separe os recebimentos por unidade, campus ou filial.",
    descricao:
      "Quando a instituição possui mais de um polo, esse filtro ajuda a organizar a cobrança por unidade.",
    imagem: "/images/financeiro.png",
  },
  {
    id: "recebimentos-lote",
    target: '[data-tour="recebimentos-lote"]',
    titulo: "Baixa em lote",
    destaque: "Registre vários pagamentos de uma só vez.",
    descricao:
      "Selecione os lançamentos na tabela e use esta área para dar baixa coletiva.",
    imagem: "/images/financeiro.png",
  },
  {
    id: "recebimentos-tabela",
    target: '[data-tour="recebimentos-tabela"]',
    titulo: "Lista de lançamentos",
    destaque: "Acompanhe cada cobrança individualmente.",
    descricao:
      "Aqui aparecem aluno, tipo, valor, status, vencimento e ações de baixa.",
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

  const bubbleWidth = 420;
  const bubbleHeight = 290;

  const bubbleStyle = spotlight
    ? (() => {
        const centroAlvo = spotlight.left + spotlight.width / 2;
        const alvoNaDireita = centroAlvo > window.innerWidth / 2;

        let top = spotlight.top + spotlight.height + 18;
        let left = spotlight.left;

        if (spotlight.height > 140 || top + bubbleHeight > window.innerHeight) {
          top = spotlight.top + spotlight.height / 2 - bubbleHeight / 2;

          if (alvoNaDireita) {
            left = spotlight.left - bubbleWidth - 18;
          } else {
            left = spotlight.left + spotlight.width + 18;
          }
        }

        top = Math.max(16, Math.min(top, window.innerHeight - bubbleHeight - 16));
        left = Math.max(16, Math.min(left, window.innerWidth - bubbleWidth - 16));

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
            style={{
              left:
                spotlight.left + spotlight.width / 2 > window.innerWidth / 2
                  ? "calc(100% - 6px)"
                  : "-6px",
              top: "42px",
            }}
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

            <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
              {step.destaque}
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              {step.descricao}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            Etapa {stepAtual + 1} de {recebimentosTourSteps.length}
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

            {stepAtual < recebimentosTourSteps.length - 1 ? (
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
                onClick={fechar}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminFinanceiroRecebimentosPage() {
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
  

  async function carregarRecebimentos() {
    try {
      setLoading(true);
      setErro("");
setSucesso("");

      const query = new URLSearchParams();
      if (busca.trim()) query.set("busca", busca.trim());
      if (status) query.set("status", status);
      if (tipo) query.set("tipo", tipo);
      if (poloId) query.set("poloId", poloId);

      const res = await fetch(
        `/api/admin/financeiro/recebimentos?${query.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar recebimentos");
      }

      setRecebimentos(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar recebimentos");
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
  }, [busca, status, tipo, poloId]);

  

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
        throw new Error(data?.error || "Erro ao carregar documentos financeiros");
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
        throw new Error(data?.error || "Erro ao dar baixa");
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

      setSucesso("Baixa registrada com sucesso. O pagamento foi lançado e o saldo do aluno foi atualizado.");
    } catch (e: any) {
      setErro(e?.message || "Erro ao dar baixa");
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
      setErro("Selecione pelo menos um lançamento antes de fazer a baixa em lote.");
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
          data?.error || `Erro ao dar baixa no lançamento ${id}`
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

    setSucesso("Baixa em lote realizada com sucesso. Todos os lançamentos selecionados foram processados.");
  } catch (e: any) {
    console.error(e);
    setErro(e?.message || "Erro na baixa em lote");
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
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">💵 Recebimentos</h1>
        <p className="text-gray-600 mt-1">
          Buscar cobranças, registrar pagamentos e dar baixa no sistema.
        </p>
      </div>

      <div data-tour="recebimentos-resumo" className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <div className="bg-white border rounded-xl p-4">
    <p className="text-sm text-gray-500">Valor lançado/final</p>
    <p className="text-2xl font-bold">R$ {resumo.total.toFixed(2)}</p>
  </div>

  <div className="bg-white border rounded-xl p-4">
    <p className="text-sm text-gray-500">Valor pago</p>
    <p className="text-2xl font-bold">R$ {resumo.pago.toFixed(2)}</p>
  </div>

  <div className="bg-white border rounded-xl p-4">
    <p className="text-sm text-gray-500">Saldo pendente</p>
    <p className="text-2xl font-bold">R$ {resumo.pendente.toFixed(2)}</p>
  </div>

  <div className="bg-white border rounded-xl p-4 border-red-200 bg-red-50">
    <p className="text-sm text-red-700">Inadimplência</p>
    <p className="text-lg font-bold text-red-700">
      {resumo.qtdAtrasados} lançamento(s)
    </p>
    <p className="text-sm text-red-700 mt-1">
      R$ {resumo.totalAtrasado.toFixed(2)}
    </p>
  </div>
</div>

      <div data-tour="recebimentos-filtros" className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Buscar por aluno, matrícula, descrição ou status"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="border rounded-lg p-2"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg p-2 bg-white"
        >
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="PARCIAL">Parcial</option>
          <option value="PAGO">Pago</option>
          <option value="ATRASADO">Atrasado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="border rounded-lg p-2 bg-white"
        >
          <option value="">Todos os tipos</option>
          <option value="MATRICULA">Matrícula</option>
          <option value="MENSALIDADE">Mensalidade</option>
          <option value="TAXA">Taxa</option>
          <option value="DESCONTO">Desconto</option>
          <option value="OUTRO">Outro</option>
        </select>
      </div>

<div data-tour="recebimentos-polos">
  <select
    value={poloId}
    onChange={(e) => setPoloId(e.target.value)}
    className="border rounded-lg p-2 bg-white"
  >
    <option value="">Todos os polos</option>
    {polos.map((polo) => (
      <option key={polo.id} value={polo.id}>
        {polo.nome}
      </option>
    ))}
  </select>
</div>

      <div data-tour="recebimentos-lote" className="bg-white border rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Baixa em lote</h2>
          <p className="text-sm text-gray-600">
            Selecionados: {selecionados.length}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            type="number"
            step="0.01"
            min="0"
            value={loteValorPago}
            onChange={(e) => setLoteValorPago(e.target.value)}
            placeholder="Valor pago"
            className="border rounded-lg p-2"
          />

          <select
            value={loteFormaPagamento}
            onChange={(e) => setLoteFormaPagamento(e.target.value)}
            className="border rounded-lg p-2 bg-white"
          >
            <option value="DINHEIRO">Dinheiro</option>
            <option value="PIX">PIX</option>
            <option value="CARTAO">Cartão</option>
            <option value="BOLETO">Boleto</option>
            <option value="TRANSFERENCIA">Transferência</option>
            <option value="OUTRO">Outro</option>
          </select>

          <input
            type="number"
            step="0.01"
            min="0"
            value={loteDescontoValor}
            onChange={(e) => setLoteDescontoValor(e.target.value)}
            placeholder="Desconto"
            className="border rounded-lg p-2"
          />

          <input
            type="number"
            step="0.01"
            min="0"
            value={loteJurosValor}
            onChange={(e) => setLoteJurosValor(e.target.value)}
            placeholder="Juros"
            className="border rounded-lg p-2"
          />

          <input
            type="number"
            step="0.01"
            min="0"
            value={loteMultaValor}
            onChange={(e) => setLoteMultaValor(e.target.value)}
            placeholder="Multa"
            className="border rounded-lg p-2"
          />

          <input
            type="text"
            value={loteObservacao}
            onChange={(e) => setLoteObservacao(e.target.value)}
            placeholder="Observação"
            className="border rounded-lg p-2"
          />

  {selecionados.length > 0 && (
  <div className="text-sm font-medium text-slate-700 md:col-span-6">
    Valor médio calculado por lançamento:{" "}
    <span className="font-bold text-blue-700">
      R${" "}
      {(
        selecionados.reduce((acc, id) => {
          const item = recebimentos.find((r) => r.id === id);
          if (!item) return acc;
          return acc + calcularValorFinalLote(item);
        }, 0) / selecionados.length
      ).toFixed(2)}
    </span>
  </div>
)}
        </div>

        <button
          onClick={darBaixaEmLote}
          disabled={baixandoLote}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {baixandoLote ? "Baixando..." : "Dar baixa em lote"}
        </button>
      </div>

      {erro && (
  <PhanyxToast
    tipo="erro"
    titulo="Não foi possível concluir"
    mensagem={erro}
    onClose={() => setErro("")}
  />
)}

{sucesso && (
  <PhanyxToast
    tipo="sucesso"
    titulo="Tudo certo"
    mensagem={sucesso}
    onClose={() => setSucesso("")}
  />
)}
      {documentosGerados.length > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-green-800">
                Comprovantes financeiros gerados com sucesso
              </p>
              <p className="mt-1 text-sm text-green-700">
                Abra o recibo ou o comprovante gerado automaticamente após a baixa.
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
                  Abrir {doc.tipo === "RECIBO" ? "recibo" : "comprovante"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div data-tour="recebimentos-tabela" className="bg-white border rounded-xl overflow-hidden">
        <div className="grid grid-cols-10 gap-3 border-b bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
          <div></div>
          <div>Aluno</div>
          <div>Tipo</div>
          <div>Descrição</div>
          <div>Valor base</div>
          <div>Valor final</div>
          <div>Pago</div>
          <div>Status</div>
          <div>Vencimento</div>
          <div>Ações</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-600">Carregando...</div>
        ) : recebimentos.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">
            Nenhum recebimento encontrado.
          </div>
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
                  <p className="text-gray-500">{item.aluno?.matricula || "-"}</p>
                  <p className="text-gray-500">
  Polo: {item.polo?.nome || "-"}
</p>
                </div>

                <div>{item.tipo}</div>
                <div>{item.descricao || "-"}</div>
                <div>R$ {Number(item.valorOriginal || 0).toFixed(2)}</div>
                <div>R$ {Number(item.valorFinal ?? item.valorOriginal ?? 0).toFixed(2)}</div>
                <div>R$ {Number(item.valorPago || 0).toFixed(2)}</div>
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
    {item.status}
  </span>
</div>
                <div>
                  {item.vencimento
                    ? new Date(item.vencimento).toLocaleDateString("pt-BR")
                    : "-"}
                </div>

                <div>
                  {item.status !== "PAGO" && (
                    <button
                      onClick={() =>
                        setBaixaId((prev) => (prev === item.id ? null : item.id))
                      }
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                    >
                      Dar baixa
                    </button>
                  )}
                </div>
              </div>

              {(Number(item.descontoValor || 0) > 0 ||
                Number(item.jurosValor || 0) > 0 ||
                Number(item.multaValor || 0) > 0) && (
                <div className="mt-2 text-xs text-gray-600">
                  Desconto: R$ {Number(item.descontoValor || 0).toFixed(2)} •
                  Juros: R$ {Number(item.jurosValor || 0).toFixed(2)} •
                  Multa: R$ {Number(item.multaValor || 0).toFixed(2)}
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
                    placeholder="Valor pago"
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

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={descontoValor}
                    onChange={(e) => setDescontoValor(e.target.value)}
                    placeholder="Desconto"
                    className="border rounded-lg p-2"
                  />

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={jurosValor}
                    onChange={(e) => setJurosValor(e.target.value)}
                    placeholder="Juros"
                    className="border rounded-lg p-2"
                  />

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={multaValor}
                    onChange={(e) => setMultaValor(e.target.value)}
                    placeholder="Multa"
                    className="border rounded-lg p-2"
                  />

                  <input
                    type="text"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Observação"
                    className="border rounded-lg p-2"
                  />

                  <div className="md:col-span-6 flex gap-2">
                    <button
                      onClick={() => darBaixa(item.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                    >
                      Confirmar baixa
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
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {item.pagamentos && item.pagamentos.length > 0 && (
                <div className="mt-3 text-xs text-gray-600">
                  <p className="font-medium mb-1">Pagamentos registrados:</p>
                  <div className="space-y-1">
                    {item.pagamentos.map((pag) => (
                      <p key={pag.id}>
                        {pag.pagoEm
                          ? new Date(pag.pagoEm).toLocaleString("pt-BR")
                          : "-"}{" "}
                        — R$ {Number(pag.valorPago || 0).toFixed(2)} —{" "}
                        {pag.formaPagamento || "-"}
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