"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Alternativa = {
  id: number;
  texto: string;
  correta: boolean;
};

type Questao = {
  id: number;
  enunciado: string;
  alternativas?: Alternativa[];
};

type Prova = {
  id: number;
  questoes: Questao[];
};

type FeedbackTipo = "sucesso" | "erro" | "";

export default function AlternativaPage() {
  const params = useParams();
  const router = useRouter();

  const provaId = params.provaId as string;
  const questaoId = params.questaoId as string;
  const altId = params.altId as string;

  const [texto, setTexto] = useState("");
  const [correta, setCorreta] = useState(false);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

  async function carregarAlternativa() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(`/api/professor/provas/${provaId}`);
      if (!res.ok) {
        throw new Error("Erro ao carregar prova");
      }

      const prova: Prova = await res.json();

      const questao = prova.questoes?.find(
        (q) => String(q.id) === String(questaoId)
      );

      if (!questao) {
        throw new Error("Questão não encontrada");
      }

      const alternativa = questao.alternativas?.find(
        (a) => String(a.id) === String(altId)
      );

      if (!alternativa) {
        throw new Error("Alternativa não encontrada");
      }

      setTexto(alternativa.texto);
      setCorreta(alternativa.correta);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar alternativa");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAlternativa();
  }, []);

  async function salvarAlternativa(e: FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setFeedback("");
      setFeedbackTipo("");

      const res = await fetch(
        `/api/professor/provas/${provaId}/questoes/${questaoId}/alternativas/${altId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            texto,
            correta,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar alternativa");
      }

      mostrarFeedback("sucesso", "Alternativa atualizada com sucesso");

      setTimeout(() => {
        router.push(`/professor/provas/${provaId}/questoes/${questaoId}`);
      }, 700);
    } catch (e: any) {
      const mensagem = e.message || "Erro ao salvar alternativa";
      setErro(mensagem);
      mostrarFeedback("erro", mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirAlternativaConfirmada() {
    try {
      setExcluindo(true);
      setErro("");
      setFeedback("");
      setFeedbackTipo("");

      const res = await fetch(
        `/api/professor/provas/${provaId}/questoes/${questaoId}/alternativas/${altId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao excluir alternativa");
      }

      setModalExcluirAberto(false);
      mostrarFeedback("sucesso", "Alternativa excluída com sucesso");

      setTimeout(() => {
        router.push(`/professor/provas/${provaId}/questoes/${questaoId}`);
      }, 700);
    } catch (e: any) {
      mostrarFeedback("erro", e.message || "Erro ao excluir alternativa");
    } finally {
      setExcluindo(false);
    }
  }

  if (loading) {
    return <div className="p-6">Carregando alternativa...</div>;
  }

  if (erro && !texto) {
    return <div className="p-6 text-red-600">{erro}</div>;
  }

  return (
    <>
      <div className="p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {feedback && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                feedbackTipo === "sucesso"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {feedback}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Editar alternativa
              </h1>
              <p className="text-sm text-gray-500">
                Atualize o texto e defina se ela é a correta
              </p>
            </div>

            <a
              href={`/professor/provas/${provaId}/questoes/${questaoId}`}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Voltar para questão
            </a>
          </div>

          <form
            onSubmit={salvarAlternativa}
            className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
          >
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Texto da alternativa
              </label>
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Digite o texto da alternativa"
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={correta}
                onChange={(e) => setCorreta(e.target.checked)}
              />
              Marcar como alternativa correta
            </label>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModalExcluirAberto(true)}
                disabled={excluindo}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {excluindo ? "Excluindo..." : "Excluir alternativa"}
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar alternativa"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {modalExcluirAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl">
                🗑️
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  Confirmar exclusão
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tem certeza que deseja excluir esta alternativa?
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalExcluirAberto(false)}
                disabled={excluindo}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={excluirAlternativaConfirmada}
                disabled={excluindo}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindo ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}