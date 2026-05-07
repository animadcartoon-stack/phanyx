"use client";

import { useEffect, useState } from "react";
import PhanyxToast from "@/components/ui/PhanyxToast";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

type Taxa = {
  id: number;
  nome: string;
  descricao?: string | null;
  categoria: string;
  valor: number;
  ativa: boolean;
  exigeVencimento: boolean;
  createdAt: string;
  updatedAt: string;
};

type AlunoOption = {
  id: number;
  nome: string;
  matricula?: string | null;
  email?: string | null;
  statusAluno?: string | null;
};

type FormState = {
  nome: string;
  descricao: string;
  categoria: string;
  valor: number;
  ativa: boolean;
  exigeVencimento: boolean;
};

type LancamentoFormState = {
  alunoBusca: string;
  alunoId: string;
  taxaId: string;
  vencimento: string;
  observacao: string;
};

const initialForm: FormState = {
  nome: "",
  descricao: "",
  categoria: "PERSONALIZADA",
  valor: 0,
  ativa: true,
  exigeVencimento: true,
};

const initialLancamentoForm: LancamentoFormState = {
  alunoBusca: "",
  alunoId: "",
  taxaId: "",
  vencimento: "",
  observacao: "",
};

export default function TaxasAvulsasPage() {
  const [taxas, setTaxas] = useState<Taxa[]>([]);
  const [alunos, setAlunos] = useState<AlunoOption[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [lancamentoForm, setLancamentoForm] =
    useState<LancamentoFormState>(initialLancamentoForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gerandoLancamento, setGerandoLancamento] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] =
  useState(false);

  const [taxaParaExcluir, setTaxaParaExcluir] =
  useState<number | null>(null);

  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    carregarTaxas();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      buscarAlunos();
    }, 300);

    return () => clearTimeout(t);
  }, [lancamentoForm.alunoBusca]);

  async function carregarTaxas() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/financeiro/taxas", {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar taxas");
      }

      setTaxas(data);
    } catch (error: any) {
      setMensagem(error.message || "Erro ao carregar taxas");
    } finally {
      setLoading(false);
    }
  }

  async function buscarAlunos() {
    try {
      setLoadingAlunos(true);

      const query = new URLSearchParams();
      if (lancamentoForm.alunoBusca.trim()) {
        query.set("busca", lancamentoForm.alunoBusca.trim());
      }

      const res = await fetch(
        `/api/admin/alunos/busca-simples?${query.toString()}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao buscar alunos");
      }

      setAlunos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setMensagem(error.message || "Erro ao buscar alunos");
      setAlunos([]);
    } finally {
      setLoadingAlunos(false);
    }
  }

  function preencherEdicao(taxa: Taxa) {
    setEditingId(taxa.id);
    setForm({
      nome: taxa.nome,
      descricao: taxa.descricao || "",
      categoria: taxa.categoria,
      valor: Number(taxa.valor),
      ativa: taxa.ativa,
      exigeVencimento: taxa.exigeVencimento,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limparFormulario() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setMensagem("");

      const url =
        editingId === null
          ? "/api/admin/financeiro/taxas"
          : `/api/admin/financeiro/taxas/${editingId}`;

      const method = editingId === null ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar taxa");
      }

      setMensagem(
        editingId === null
          ? "Taxa criada com sucesso."
          : "Taxa atualizada com sucesso."
      );

      limparFormulario();
      await carregarTaxas();
    } catch (error: any) {
      setMensagem(error.message || "Erro ao salvar taxa");
    } finally {
      setSaving(false);
    }
  }

  async function gerarLancamento(e: React.FormEvent) {
    e.preventDefault();

    try {
      setGerandoLancamento(true);
      setMensagem("");

      const res = await fetch("/api/admin/financeiro/taxas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modo: "GERAR_LANCAMENTO",
          alunoId: lancamentoForm.alunoId,
          taxaId: lancamentoForm.taxaId,
          vencimento: lancamentoForm.vencimento || null,
          observacao: lancamentoForm.observacao,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar lançamento");
      }

      setMensagem("Lançamento financeiro gerado com sucesso.");
      setLancamentoForm(initialLancamentoForm);
    } catch (error: any) {
      setMensagem(error.message || "Erro ao gerar lançamento");
    } finally {
      setGerandoLancamento(false);
    }
  }

  function remover(id: number) {
  setTaxaParaExcluir(id);
  setConfirmarExclusaoAberto(true);
}

async function confirmarExclusao() {
  if (!taxaParaExcluir) return;

  try {
    setExcluindo(true);
    setErro("");
    setSucesso("");

    const res = await fetch(
      `/api/admin/financeiro/taxas/${taxaParaExcluir}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Erro ao excluir taxa");
    }

    setSucesso(
      "Taxa excluída com sucesso. O cadastro foi removido do sistema."
    );

    setConfirmarExclusaoAberto(false);
    setTaxaParaExcluir(null);

    await carregarTaxas();
  } catch (error: any) {
    setErro(error.message || "Erro ao excluir taxa");
  } finally {
    setExcluindo(false);
  }
}
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Taxas Avulsas</h1>
        <p className="text-sm text-slate-500">
          Cadastre taxas e gere cobranças reais para alunos.
        </p>
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

      <form
        onSubmit={salvar}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Cadastro de taxa avulsa
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nome da taxa
            </label>
            <input
              value={form.nome}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nome: e.target.value }))
              }
              placeholder="Ex.: Matrícula"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Categoria
            </label>
            <select
              value={form.categoria}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, categoria: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            >
              <option value="MATRICULA">Matrícula</option>
              <option value="TRANCAMENTO">Trancamento</option>
              <option value="SEGUNDA_CHAMADA">Segunda chamada</option>
              <option value="DECLARACAO">Declaração</option>
              <option value="HISTORICO">Histórico</option>
              <option value="AULA_EXTRA">Aula extra</option>
              <option value="PERSONALIZADA">Personalizada</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Valor
            </label>
            <input
              type="number"
              step="0.01"
              value={form.valor}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, valor: Number(e.target.value) }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
          </div>

          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.ativa}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ativa: e.target.checked }))
                }
              />
              Ativa
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.exigeVencimento}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    exigeVencimento: e.target.checked,
                  }))
                }
              />
              Exige vencimento
            </label>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Descrição
          </label>
          <textarea
            value={form.descricao}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, descricao: e.target.value }))
            }
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving
              ? "Salvando..."
              : editingId === null
              ? "Cadastrar taxa"
              : "Salvar edição"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={limparFormulario}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <form
        onSubmit={gerarLancamento}
        className="grid gap-4 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Gerar cobrança para aluno
          </h2>
          <p className="text-sm text-slate-500">
            Transforme uma taxa cadastrada em lançamento financeiro real.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Buscar aluno
            </label>
            <input
              value={lancamentoForm.alunoBusca}
              onChange={(e) =>
                setLancamentoForm((prev) => ({
                  ...prev,
                  alunoBusca: e.target.value,
                }))
              }
              placeholder="Digite nome, matrícula ou email"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Selecionar aluno
            </label>
            <select
              value={lancamentoForm.alunoId}
              onChange={(e) =>
                setLancamentoForm((prev) => ({
                  ...prev,
                  alunoId: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            >
              <option value="">Selecione um aluno</option>
              {alunos.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome}
                  {aluno.matricula ? ` - ${aluno.matricula}` : ""}
                  {aluno.email ? ` - ${aluno.email}` : ""}
                </option>
              ))}
            </select>
            {loadingAlunos && (
              <p className="mt-1 text-xs text-slate-500">Buscando alunos...</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Taxa cadastrada
            </label>
            <select
              value={lancamentoForm.taxaId}
              onChange={(e) =>
                setLancamentoForm((prev) => ({
                  ...prev,
                  taxaId: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            >
              <option value="">Selecione uma taxa</option>
              {taxas
                .filter((taxa) => taxa.ativa)
                .map((taxa) => (
                  <option key={taxa.id} value={taxa.id}>
                    {taxa.nome} - R$ {Number(taxa.valor).toFixed(2)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Vencimento
            </label>
            <input
              type="date"
              value={lancamentoForm.vencimento}
              onChange={(e) =>
                setLancamentoForm((prev) => ({
                  ...prev,
                  vencimento: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Observação
          </label>
          <textarea
            value={lancamentoForm.observacao}
            onChange={(e) =>
              setLancamentoForm((prev) => ({
                ...prev,
                observacao: e.target.value,
              }))
            }
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={gerandoLancamento}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {gerandoLancamento ? "Gerando..." : "Gerar lançamento"}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Taxas cadastradas
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">Carregando taxas...</p>
        ) : taxas.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma taxa cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="px-3 py-3">Nome</th>
                  <th className="px-3 py-3">Categoria</th>
                  <th className="px-3 py-3">Valor</th>
                  <th className="px-3 py-3">Ativa</th>
                  <th className="px-3 py-3">Vencimento</th>
                  <th className="px-3 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {taxas.map((taxa) => (
                  <tr key={taxa.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-800">{taxa.nome}</div>
                      {taxa.descricao && (
                        <div className="text-xs text-slate-500">
                          {taxa.descricao}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">{taxa.categoria}</td>
                    <td className="px-3 py-3">
                      R$ {Number(taxa.valor).toFixed(2)}
                    </td>
                    <td className="px-3 py-3">{taxa.ativa ? "Sim" : "Não"}</td>
                    <td className="px-3 py-3">
                      {taxa.exigeVencimento ? "Sim" : "Não"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => preencherEdicao(taxa)}
                          className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => remover(taxa.id)}
                          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <PhanyxConfirmModal
  aberto={confirmarExclusaoAberto}
  titulo="Excluir taxa"
  mensagem="Deseja realmente excluir esta taxa? Essa ação não poderá ser desfeita."
  textoConfirmar="Excluir taxa"
  textoCancelar="Cancelar"
  carregando={excluindo}
  tipo="perigo"
  onCancelar={() => {
    setConfirmarExclusaoAberto(false);
    setTaxaParaExcluir(null);
  }}
  onConfirmar={confirmarExclusao}
/>
    </div>
  );
}