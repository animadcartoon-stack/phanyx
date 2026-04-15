"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type AtividadeResponse = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  notaMaxima: number;
  status: string;
  turmaId: number;
};

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";

  try {
    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

export default function EditarAtividadePage() {
  const params = useParams();
  const router = useRouter();

  const atividadeId = String(params?.atividadeId || "");
  const modoEdicao = atividadeId !== "nova";

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [notaMaxima, setNotaMaxima] = useState(10);
  const [status, setStatus] = useState("RASCUNHO");
  const [turmaId, setTurmaId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(modoEdicao);
  const [erroCarregamento, setErroCarregamento] = useState("");

  useEffect(() => {
    async function carregarAtividade() {
      if (!modoEdicao) {
        setCarregando(false);
        return;
      }

      try {
        setCarregando(true);
        setErroCarregamento("");

        const res = await fetch(`/api/professor/atividades/${atividadeId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Erro ao carregar atividade");
        }

        const atividade = data as AtividadeResponse;

        setTitulo(atividade.titulo || "");
        setDescricao(atividade.descricao || "");
        setPrazo(toDatetimeLocal(atividade.prazo));
        setNotaMaxima(
          typeof atividade.notaMaxima === "number" ? atividade.notaMaxima : 10
        );
        setStatus(atividade.status || "RASCUNHO");
        setTurmaId(atividade.turmaId ? String(atividade.turmaId) : "");
      } catch (error: any) {
        console.error(error);
        setErroCarregamento(
          error?.message || "Erro ao carregar dados da atividade"
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarAtividade();
  }, [atividadeId, modoEdicao]);

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

      const endpoint = modoEdicao
        ? `/api/professor/atividades/${atividadeId}`
        : "/api/professor/atividades";

      const method = modoEdicao ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
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

      alert(
        modoEdicao
          ? "Atividade atualizada com sucesso!"
          : "Atividade salva com sucesso!"
      );

      router.push("/professor/atividades");
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
          {modoEdicao ? "Editar atividade" : "Criar atividade"}
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Configure os detalhes da atividade que será disponibilizada aos alunos.
        </p>
      </div>

      {carregando && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Carregando atividade...
        </div>
      )}

      {!carregando && erroCarregamento && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          {erroCarregamento}
        </div>
      )}

      {!carregando && !erroCarregamento && (
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
                {salvando
                  ? "Salvando..."
                  : modoEdicao
                  ? "Atualizar atividade"
                  : "Salvar atividade"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/professor/atividades")}
                className="rounded-2xl border px-5 py-2 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}