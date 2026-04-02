"use client";

import { useEffect, useState } from "react";

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

function hojeInput() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function FechamentoGeralPage() {
  const [dataFiltro, setDataFiltro] = useState(hojeInput());
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [dados, setDados] = useState<RespostaApi | null>(null);

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

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">📦 Fechamento geral do dia</h1>
        <p className="text-gray-600 mt-1">
          Consolidação dos caixas fechados pelos funcionários no dia.
        </p>
      </div>

      <div className="bg-white border rounded-xl p-4">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div className="bg-white border rounded-xl p-5">
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

          <div className="bg-white border rounded-xl p-5">
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
    </div>
  );
}