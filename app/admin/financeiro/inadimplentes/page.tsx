"use client";

import { useEffect, useMemo, useState } from "react";

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

export default function AdminFinanceiroInadimplentesPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [dados, setDados] = useState<AlunoInadimplente[]>([]);
  const [abertoId, setAbertoId] = useState<number | null>(null);
  const [baixandoId, setBaixandoId] = useState<number | null>(null);
  const [forms, setForms] = useState<Record<number, FormLancamento>>({});

  function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function montarMensagemCobranca(
    alunoNome: string,
    lanc: LancamentoAtrasado
  ) {
    const valor = Number(lanc.saldoAberto || 0);

    return `Olá, ${alunoNome}. Identificamos uma pendência financeira em seu cadastro na instituição.

Cobrança: ${lanc.descricao || lanc.tipo}
Vencimento: ${formatarData(lanc.vencimento)}
Valor em aberto: ${formatarMoeda(valor)}

Pedimos, por gentileza, que regularize a situação junto ao setor financeiro. Após a baixa do pagamento no sistema, seu acesso poderá ser normalizado.

Em caso de dúvida, entre em contato com a instituição.`;
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
        `Mensagem de cobrança copiada para o lançamento ${lanc.id}.`
      );

      alert("Mensagem de cobrança copiada.");
    } catch {
      alert("Não foi possível copiar a mensagem.");
    }
  }

  async function cobrarNoWhatsApp(
    alunoId: number,
    alunoNome: string,
    lanc: LancamentoAtrasado
  ) {
    const mensagem = montarMensagemCobranca(alunoNome, lanc);

    const telefoneInformado = window.prompt(
      `Digite o telefone do WhatsApp de ${alunoNome}.\nEx: 5548999999999`
    );

    if (!telefoneInformado) return;

    const telefone = telefoneInformado.replace(/\D/g, "");

    if (!telefone) {
      alert("Telefone inválido.");
      return;
    }

    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");

    await registrarHistorico(
      alunoId,
      alunoNome,
      lanc.id,
      "WHATSAPP",
      "COBRANCA_ENVIADA",
      `Cobrança enviada/aberta no WhatsApp para o telefone ${telefone}.`
    );
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
        throw new Error(json?.error || "Erro ao carregar inadimplentes");
      }

      setDados(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar inadimplentes");
      setDados([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
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
        throw new Error(json?.error || "Erro ao registrar pagamento");
      }

      await registrarHistorico(
        alunoId,
        alunoNome,
        lancamentoId,
        "SISTEMA",
        "BAIXA_MANUAL",
        form.observacao || "Pagamento registrado pela tela de inadimplentes."
      );

      limparForm(lancamentoId);
      setBaixandoId(null);

      await carregar();

      alert("Cobrança regularizada com sucesso.");
    } catch (e: any) {
      setErro(e?.message || "Erro ao registrar pagamento");
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
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">🚨 Inadimplentes</h1>
        <p className="text-gray-600 mt-1">
          Planilha de alunos com cobranças vencidas e ações rápidas de cobrança/baixa.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Alunos inadimplentes</p>
          <p className="text-2xl font-bold">{resumo.totalAlunos}</p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Cobranças vencidas</p>
          <p className="text-2xl font-bold">{resumo.totalLancamentos}</p>
        </div>

        <div className="bg-white border rounded-xl p-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-700">Total em atraso</p>
          <p className="text-2xl font-bold text-red-700">
            {formatarMoeda(resumo.totalAtrasado)}
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, matrícula ou email"
          className="w-full border rounded-lg p-2"
        />
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 gap-3 border-b bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
          <div>Aluno</div>
          <div>Matrícula</div>
          <div>Email</div>
          <div>Cobranças vencidas</div>
          <div>Total em atraso</div>
          <div>Cobrança</div>
          <div>Ações</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-600">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">
            Nenhum aluno inadimplente encontrado.
          </div>
        ) : (
          filtrados.map((item) => (
            <div key={item.alunoId} className="border-b">
              <div className="grid grid-cols-7 gap-3 px-4 py-4 text-sm items-center bg-red-50">
                <div>
                  <p className="font-medium text-gray-900">{item.nome}</p>
                  <p className="text-gray-500">{item.statusAluno || "-"}</p>
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
                    Copiar cobrança
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
                  <button
                    onClick={() =>
                      setAbertoId((prev) =>
                        prev === item.alunoId ? null : item.alunoId
                      )
                    }
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                  >
                    {abertoId === item.alunoId ? "Fechar" : "Abrir cobranças"}
                  </button>
                </div>
              </div>

              {abertoId === item.alunoId && (
                <div className="px-4 py-4 bg-white space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-sm font-semibold text-gray-700">
                    <div>Tipo</div>
                    <div>Descrição</div>
                    <div>Vencimento</div>
                    <div>Valor final</div>
                    <div>Saldo em aberto</div>
                    <div>Ação</div>
                  </div>

                  {item.lancamentos.map((lanc) => {
                    const form = getForm(lanc.id);

                    return (
                      <div
                        key={lanc.id}
                        className="grid grid-cols-1 md:grid-cols-6 gap-3 border rounded-lg p-3 items-start"
                      >
                        <div>{lanc.tipo}</div>

                        <div>
                          <p>{lanc.descricao || "-"}</p>
                          {(Number(lanc.descontoValor || 0) > 0 ||
                            Number(lanc.jurosValor || 0) > 0 ||
                            Number(lanc.multaValor || 0) > 0) && (
                            <p className="text-xs text-gray-500 mt-1">
                              Desc: {formatarMoeda(Number(lanc.descontoValor || 0))} •
                              Juros: {formatarMoeda(Number(lanc.jurosValor || 0))} •
                              Multa: {formatarMoeda(Number(lanc.multaValor || 0))}
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
                            placeholder="Valor pago"
                            className="w-full border rounded p-2 text-sm"
                          />

                          <select
                            value={form.formaPagamento}
                            onChange={(e) =>
                              updateForm(lanc.id, "formaPagamento", e.target.value)
                            }
                            className="w-full border rounded p-2 text-sm bg-white"
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
                            value={form.descontoValor}
                            onChange={(e) =>
                              updateForm(lanc.id, "descontoValor", e.target.value)
                            }
                            placeholder="Desconto"
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
                            placeholder="Juros"
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
                            placeholder="Multa"
                            className="w-full border rounded p-2 text-sm"
                          />

                          <input
                            type="text"
                            value={form.observacao}
                            onChange={(e) =>
                              updateForm(lanc.id, "observacao", e.target.value)
                            }
                            placeholder="Observação"
                            className="w-full border rounded p-2 text-sm"
                          />

                          <button
                            onClick={() =>
                              copiarMensagem(item.alunoId, item.nome, lanc)
                            }
                            className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm"
                          >
                            Copiar mensagem
                          </button>

                          <button
                            onClick={() =>
                              cobrarNoWhatsApp(item.alunoId, item.nome, lanc)
                            }
                            className="w-full px-3 py-2 bg-emerald-600 text-white rounded text-sm"
                          >
                            Cobrar no WhatsApp
                          </button>

                          <button
                            onClick={() =>
                              darBaixa(item.alunoId, item.nome, lanc.id)
                            }
                            disabled={baixandoId === lanc.id}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                          >
                            {baixandoId === lanc.id
                              ? "Registrando..."
                              : "Registrar pagamento"}
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
  );
}