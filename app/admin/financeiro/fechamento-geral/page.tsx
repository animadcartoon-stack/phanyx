"use client";

import { useEffect, useState, useMemo } from "react";

type Movimento = {
  id: number;
  tipo: string;
  descricao?: string | null;
  valor: number;
  formaPagamento?: string | null;
  createdAt?: string;
};

type CaixaFechado = {
  id: number;
  saldoInicial: number;
  saldoSistema: number;
  saldoInformado?: number | null;
  diferenca: number;
  dataAbertura?: string;
  dataFechamento?: string | null;
  observacaoFechamento?: string | null;
  abertoPorId?: number | null;
  fechadoPorId?: number | null;
  movimentos: Movimento[];
};

type RespostaApi = {
  data: string;
  resumo: {
    totalCaixas: number;
    saldoSistema: number;
    saldoInformado: number;
    diferenca: number;
    dinheiro: number;
    pix: number;
    cartao: number;
    boleto: number;
    transferencia: number;
    outro: number;
  };
  caixas: CaixaFechado[];
};

const fechamentoTourSteps = [
  {
    target: '[data-tour="fechamento-data"]',
    titulo: "Filtro por data",
    destaque: "Escolha qual dia deseja consolidar.",
    descricao:
      "Aqui você analisa o fechamento financeiro de qualquer data específica.",
    imagem: "/images/financeiro.png",
  },
  {
    target: '[data-tour="fechamento-resumo"]',
    titulo: "Resumo consolidado",
    destaque: "Veja rapidamente os totais do dia.",
    descricao:
      "Quantidade de caixas fechados, saldo do sistema, saldo informado e diferenças.",
    imagem: "/images/contador.png",
  },
  {
    target: '[data-tour="fechamento-formas"]',
    titulo: "Formas de pagamento",
    destaque: "Entenda como entrou o dinheiro.",
    descricao:
      "Aqui o financeiro visualiza separadamente PIX, dinheiro, cartão, boleto e transferências.",
    imagem: "/images/contador.png",
  },
  {
    target: '[data-tour="fechamento-caixas"]',
    titulo: "Caixas fechados",
    destaque: "Audite cada fechamento realizado.",
    descricao:
      "Veja detalhes dos caixas encerrados pelos funcionários naquele dia.",
    imagem: "/images/financeiro.png",
  },
];

function hojeInput() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function FechamentoTour({
  aberto,
  onClose,
}: {
  aberto: boolean;
  onClose: () => void;
}) {
  const [stepAtual, setStepAtual] = useState(0);
  const [targetRect, setTargetRect] = useState<any>(null);

  const step = fechamentoTourSteps[stepAtual];

  useEffect(() => {
    if (!aberto || !step) return;

    function atualizar() {
      const el = document.querySelector(step.target);

      if (!el) return;

      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      setTimeout(() => {
        const rect = el.getBoundingClientRect();

        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }, 250);
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
        top: targetRect.top - 8,
        left: targetRect.left - 8,
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
        className="absolute w-[420px] rounded-[28px] border bg-white px-5 py-4 shadow-2xl"
        style={{
          top: spotlight
            ? Math.min(
                spotlight.top + spotlight.height + 18,
                window.innerHeight - 330
              )
            : 180,
          left: spotlight
            ? Math.min(spotlight.left, window.innerWidth - 460)
            : 360,
        }}
      >
        <div className="absolute -top-2 left-10 h-4 w-4 rotate-45 border-l border-t bg-white" />

        <div className="flex gap-4">
          <img
            src={step.imagem}
            alt=""
            className="h-24 w-24 object-contain"
          />

          <div>
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

        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Etapa {stepAtual + 1} de {fechamentoTourSteps.length}
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              Fechar
            </button>

            {stepAtual > 0 && (
              <button
                onClick={() => setStepAtual((p) => p - 1)}
                className="rounded-xl border px-3 py-2 text-sm"
              >
                Anterior
              </button>
            )}

            {stepAtual < fechamentoTourSteps.length - 1 ? (
              <button
                onClick={() => setStepAtual((p) => p + 1)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Próximo
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  window.location.href = "/admin/financeiro/relatorios";
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Ir para relatórios
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FechamentoGeralPage() {
  const [dataFiltro, setDataFiltro] = useState(hojeInput());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState<RespostaApi | null>(null);
  const [tourAberto, setTourAberto] = useState(false);

      async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(
        `/api/admin/financeiro/fechamento-geral?data=${dataFiltro}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const texto = await res.text();
      const json = texto ? JSON.parse(texto) : null;

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao carregar fechamento geral");
      }

      if (!json) {
        throw new Error("A API de fechamento geral retornou resposta vazia.");
      }

      setDados(json);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar fechamento geral");
      setDados(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  carregar();
}, [dataFiltro]);

useEffect(() => {
  const continuar = sessionStorage.getItem("phanyx-continuar-tour");

  if (continuar === "fechamento-geral") {
    sessionStorage.removeItem("phanyx-continuar-tour");

    setTimeout(() => {
      setTourAberto(true);
    }, 600);
  }
}, []);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">📦 Fechamento geral do dia</h1>
        <button
  onClick={() => setTourAberto(true)}
  className="mt-3 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
>
  ✨ Abrir tutorial guiado
</button>
        <p className="text-gray-600 mt-1">
          Consolidação dos caixas fechados pelos funcionários no dia.
        </p>
      </div>

      <div
  data-tour="fechamento-data"
  className="bg-white border rounded-xl p-4"
>
        <label className="text-sm font-medium text-gray-700">Data</label>
        <input
          type="date"
          value={dataFiltro}
          onChange={(e) => setDataFiltro(e.target.value)}
          className="mt-1 border rounded-lg p-2 bg-white"
        />
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {loading ? (
        <div className="bg-white border rounded-xl p-6 text-gray-600">
          Carregando fechamento geral...
        </div>
      ) : !dados ? null : (
        <>
          <div
  data-tour="fechamento-resumo"
  className="grid grid-cols-1 md:grid-cols-4 gap-4"
>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">Caixas fechados</p>
              <p className="text-2xl font-bold">{dados.resumo.totalCaixas}</p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">Saldo sistema</p>
              <p className="text-2xl font-bold">
                R$ {dados.resumo.saldoSistema.toFixed(2)}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">Saldo informado</p>
              <p className="text-2xl font-bold">
                R$ {dados.resumo.saldoInformado.toFixed(2)}
              </p>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <p className="text-sm text-gray-500">Diferença total</p>
              <p className="text-2xl font-bold">
                R$ {dados.resumo.diferenca.toFixed(2)}
              </p>
            </div>
          </div>

          <div
  data-tour="fechamento-formas"
  className="bg-white border rounded-xl p-5"
>
            <h2 className="text-lg font-semibold">Resumo por forma de pagamento</h2>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Dinheiro</p>
                <p className="text-xl font-bold">R$ {dados.resumo.dinheiro.toFixed(2)}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">PIX</p>
                <p className="text-xl font-bold">R$ {dados.resumo.pix.toFixed(2)}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Cartão</p>
                <p className="text-xl font-bold">R$ {dados.resumo.cartao.toFixed(2)}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Boleto</p>
                <p className="text-xl font-bold">R$ {dados.resumo.boleto.toFixed(2)}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Transferência</p>
                <p className="text-xl font-bold">R$ {dados.resumo.transferencia.toFixed(2)}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">Outro</p>
                <p className="text-xl font-bold">R$ {dados.resumo.outro.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div
  data-tour="fechamento-caixas"
  className="bg-white border rounded-xl p-5"
>
            <h2 className="text-lg font-semibold">Caixas fechados</h2>

            {dados.caixas.length === 0 ? (
              <p className="text-sm text-gray-600 mt-3">
                Nenhum caixa fechado nesta data.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {dados.caixas.map((caixa) => (
                  <div key={caixa.id} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Caixa</p>
                        <p className="font-semibold">#{caixa.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Saldo sistema</p>
                        <p className="font-semibold">
                          R$ {Number(caixa.saldoSistema || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Saldo informado</p>
                        <p className="font-semibold">
                          R$ {Number(caixa.saldoInformado || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Diferença</p>
                        <p className="font-semibold">
                          R$ {Number(caixa.diferenca || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {caixa.observacaoFechamento && (
                      <p className="text-sm text-gray-600 mt-3">
                        Observação: {caixa.observacaoFechamento}
                      </p>
                    )}

                    <div className="mt-3 text-xs text-gray-500">
                      Fechado em:{" "}
                      {caixa.dataFechamento
                        ? new Date(caixa.dataFechamento).toLocaleString("pt-BR")
                        : "-"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <FechamentoTour
  aberto={tourAberto}
  onClose={() => setTourAberto(false)}
/>
    </div>
  );
}