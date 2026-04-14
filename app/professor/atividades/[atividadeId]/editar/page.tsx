"use client";

import { useState } from "react";

export default function EditarAtividadePage() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [notaMaxima, setNotaMaxima] = useState(10);
  const [status, setStatus] = useState("RASCUNHO");
  const [turmaId, setTurmaId] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvarAtividade() {
    try {
      if (!titulo.trim()) {
        alert("Informe o título da atividade.");
        return;
      }

      if (!turmaId || Number(turmaId) <= 0) {
        alert("Informe um Turma ID válido.");
        return;
      }

      setSalvando(true);

      const res = await fetch("/api/professor/atividades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo,
          descricao,
          prazo,
          notaMaxima,
          status,
          turmaId: Number(turmaId),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar atividade");
      }

      alert("Atividade salva com sucesso!");

      setTitulo("");
      setDescricao("");
      setPrazo("");
      setNotaMaxima(10);
      setStatus("RASCUNHO");
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Erro ao salvar atividade");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-violet-600">
          Atividade
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Criar / editar atividade
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Configure os detalhes da atividade que será disponibilizada aos alunos.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Título da atividade
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
              placeholder="Ex: Trabalho sobre escatologia"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
              placeholder="Explique o que o aluno precisa fazer..."
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Prazo
            </label>
            <input
              type="datetime-local"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Turma ID
            </label>
            <input
              type="number"
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
              placeholder="Ex: 1"
            />
            <p className="mt-2 text-xs text-slate-500">
              Por enquanto, informe manualmente o ID da turma para conseguirmos
              testar o salvamento real sem retrabalho.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Nota máxima
            </label>
            <input
              type="number"
              value={notaMaxima}
              onChange={(e) => setNotaMaxima(Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
            >
              <option value="RASCUNHO">Rascunho</option>
              <option value="PUBLICADA">Publicada</option>
              <option value="ENCERRADA">Encerrada</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={salvarAtividade}
              disabled={salvando}
              className="rounded-2xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar atividade"}
            </button>

            <button
              type="button"
              className="rounded-2xl border px-5 py-2 text-sm font-semibold text-slate-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}