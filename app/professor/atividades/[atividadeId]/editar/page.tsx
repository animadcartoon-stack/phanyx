"use client";

import { useState } from "react";

export default function EditarAtividadePage() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [notaMaxima, setNotaMaxima] = useState(10);
  const [status, setStatus] = useState("RASCUNHO");

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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
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

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
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

          <div className="pt-4 flex gap-3">
            <button className="rounded-2xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700">
              Salvar atividade
            </button>

            <button className="rounded-2xl border px-5 py-2 text-sm font-semibold text-slate-700">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}