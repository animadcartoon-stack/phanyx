"use client";

import { useEffect, useMemo, useState } from "react";
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

type FeedbackTipo = "sucesso" | "erro" | "";

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

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");

  const [erroTitulo, setErroTitulo] = useState("");
  const [erroTurmaId, setErroTurmaId] = useState("");

  const podeEditar = status === "RASCUNHO";

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    async function carregarAtividade() {
      if (!modoEdicao) {
        setCarregando(false);
        return;
      }

      try {
        setCarregando(true);
        setErroCarregamento("");
        setFeedback("");
        setFeedbackTipo("");

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

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

  function limparErrosCampo() {
    setErroTitulo("");
    setErroTurmaId("");
  }

  function validarFormulario() {
    let valido = true;

    setErroTitulo("");
    setErroTurmaId("");

    if (!titulo.trim()) {
      setErroTitulo("Informe o título da atividade.");
      valido = false;
    }

    if (!turmaId || Number(turmaId) <= 0) {
      setErroTurmaId("Informe um Turma ID válido.");
      valido = false;
    }

    return valido;
  }

  async function salvarAtividade() {
    try {
      limparErrosCampo();
      setFeedback("");
      setFeedbackTipo("");

      if (!validarFormulario()) {
        mostrarFeedback("erro", "Corrija os campos obrigatórios para continuar.");
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

      mostrarFeedback(
        "sucesso",
        modoEdicao
          ? "Atividade atualizada com sucesso!"
          : "Atividade salva com sucesso!"
      );

      setTimeout(() => {
        router.push("/professor/atividades");
      }, 700);
    } catch (error: any) {
      console.error(error);
      mostrarFeedback("erro", error?.message || "Erro ao salvar atividade");
    } finally {
      setSalvando(false);
    }
  }

  const feedbackClasses = useMemo(() => {
    if (feedbackTipo === "sucesso") {
      return "border-green-200 bg-green-50 text-green-700";
    }

    if (feedbackTipo === "erro") {
      return "border-red-200 bg-red-50 text-red-700";
    }

    return "";
  }, [feedbackTipo]);

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

      {feedback && (
        <div
          className={`rounded-3xl border p-4 text-sm shadow-sm ${feedbackClasses}`}
        >
          {feedback}
        </div>
      )}

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
        <>
          {!podeEditar && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
              Esta atividade está com status <strong>{status}</strong> e, pela
              regra atual do sistema, só atividades em{" "}
              <strong>RASCUNHO</strong> podem ser editadas.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Título da atividade
                </label>
                <input
                  value={titulo}
                  onChange={(e) => {
                    setTitulo(e.target.value);
                    if (erroTitulo) setErroTitulo("");
                  }}
                  disabled={!podeEditar}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                    erroTitulo
                      ? "border-red-400 focus:border-red-500"
                      : "border-slate-300 focus:border-violet-500"
                  } disabled:bg-slate-100 disabled:text-slate-500`}
                  placeholder="Ex: Trabalho sobre escatologia"
                />
                {erroTitulo && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    {erroTitulo}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  disabled={!podeEditar}
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500 disabled:bg-slate-100 disabled:text-slate-500"
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
                  disabled={!podeEditar}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500 disabled:bg-slate-100 disabled:text-slate-500"
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
                  onChange={(e) => {
                    setTurmaId(e.target.value);
                    if (erroTurmaId) setErroTurmaId("");
                  }}
                  disabled={!podeEditar}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none ${
                    erroTurmaId
                      ? "border-red-400 focus:border-red-500"
                      : "border-slate-300 focus:border-violet-500"
                  } disabled:bg-slate-100 disabled:text-slate-500`}
                  placeholder="Ex: 1"
                />
                {erroTurmaId ? (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    {erroTurmaId}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Por enquanto, informe manualmente o ID da turma.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Nota máxima
                </label>
                <input
                  type="number"
                  value={notaMaxima}
                  onChange={(e) => setNotaMaxima(Number(e.target.value))}
                  disabled={!podeEditar}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={!podeEditar}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500 disabled:bg-slate-100 disabled:text-slate-500"
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
                  disabled={salvando || !podeEditar}
                  className={`rounded-2xl px-5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    podeEditar
                      ? "bg-violet-600 text-white hover:bg-violet-700"
                      : "bg-slate-300 text-slate-500"
                  }`}
                >
                  {salvando
                    ? "Salvando..."
                    : !podeEditar
                    ? "Edição bloqueada"
                    : modoEdicao
                    ? "Atualizar atividade"
                    : "Salvar atividade"}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/professor/atividades")}
                  className="rounded-2xl border px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}