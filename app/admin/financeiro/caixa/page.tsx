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

export default function AdminFinanceiroCaixaPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  const [caixaOnlineIbe, setCaixaOnlineIbe] = useState<Caixa | null>(null);
  const [podeVerCaixaOnlineIbe, setPodeVerCaixaOnlineIbe] = useState(false);

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
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar caixa");
      setCaixa(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCaixa();
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

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">🏦 Caixa</h1>
        <p className="text-gray-600 mt-1">
          Abertura, movimentação e fechamento de caixa.
        </p>
      </div>

{podeVerCaixaOnlineIbe && (
  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
          Caixa automático
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          🌐 Caixa Online Asaas IBE
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Recebe automaticamente os pagamentos feitos na matrícula online IBE.
        </p>
      </div>

      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-700">
        Somente leitura
      </span>
    </div>

    {!caixaOnlineIbe ? (
      <p className="mt-4 text-sm text-slate-600">
        Nenhum pagamento online IBE registrado hoje.
      </p>
    ) : (
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-4">
          <p className="text-sm text-slate-500">Status</p>
          <p className="text-2xl font-bold">{caixaOnlineIbe.status}</p>
        </div>

        <div className="rounded-xl bg-white p-4">
          <p className="text-sm text-slate-500">Total online</p>
          <p className="text-2xl font-bold">
            R$ {Number(caixaOnlineIbe.saldoSistema || 0).toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl bg-white p-4">
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
              type="number"
              step="0.01"
              min="0"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              placeholder="Saldo inicial"
              className="border rounded-lg p-2"
            />

            <input
              type="text"
              value={observacaoAbertura}
              onChange={(e) => setObservacaoAbertura(e.target.value)}
              placeholder="Observação de abertura"
              className="border rounded-lg p-2"
            />
          </div>

          <button
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
    </div>
  );
}