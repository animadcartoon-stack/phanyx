"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Alternativa = {
  id: number;
  texto: string;
  correta: boolean;
  ordem?: number;
};

type Questao = {
  id: number;
  enunciado: string;
  pergunta?: string;
  tipo: "MULTIPLA_ESCOLHA" | "DISCURSIVA";
  valor: number;
  ordem: number;
  alternativas?: Alternativa[];
};

type FeedbackTipo = "sucesso" | "erro" | "";

export default function QuestaoPage() {
  const params = useParams();
  const router = useRouter();

  const provaId = params.provaId as string;
  const questaoId = params.questaoId as string;

  const [questao, setQuestao] = useState<Questao | null>(null);

  const [enunciado, setEnunciado] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [tipo, setTipo] = useState<string>("MULTIPLA_ESCOLHA");
  const [valor, setValor] = useState("1");

  const [novaAlternativa, setNovaAlternativa] = useState("");
  const [novaAlternativaCorreta, setNovaAlternativaCorreta] = useState(false);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvandoAlternativa, setSalvandoAlternativa] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [erroAlternativa, setErroAlternativa] = useState("");

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

  async function carregarQuestao() {
    try {
      setLoading(true);
      setErro("");

      const resProva = await fetch(`/api/professor/provas/${provaId}`);
      if (!resProva.ok) {
        throw new Error("Erro ao carregar prova");
      }

      const prova = await resProva.json();

      const questaoEncontrada = prova.questoes?.find(
        (q: Questao) => String(q.id) === String(questaoId)
      );

      if (!questaoEncontrada) {
        throw new Error("Questão não encontrada");
      }

      setQuestao(questaoEncontrada);
      setEnunciado(questaoEncontrada.enunciado || "");
      setPergunta(questaoEncontrada.pergunta || "");
      setTipo(questaoEncontrada.tipo);
      setValor(String(questaoEncontrada.valor ?? 1));
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar questão");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarQuestao();
  }, []);

  async function salvarQuestao(e: FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setFeedback("");
      setFeedbackTipo("");

      const res = await fetch(
        `/api/professor/provas/${provaId}/questoes/${questaoId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enunciado,
            ...(pergunta.trim() ? { pergunta } : {}),
            tipo,
            valor: Number(valor),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar questão");
      }

      mostrarFeedback("sucesso", "Questão atualizada com sucesso");
      setTimeout(() => {
        router.push(`/professor/provas/${provaId}`);
      }, 700);
    } catch (e: any) {
      const mensagem = e.message || "Erro ao salvar questão";
      setErro(mensagem);
      mostrarFeedback("erro", mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirQuestaoConfirmada() {
    try {
      setExcluindo(true);
      setErro("");
      setFeedback("");
      setFeedbackTipo("");

      const res = await fetch(
        `/api/professor/provas/${provaId}/questoes/${questaoId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao excluir questão");
      }

      setModalExcluirAberto(false);
      mostrarFeedback("sucesso", "Questão excluída com sucesso");

      setTimeout(() => {
        router.push(`/professor/provas/${provaId}`);
      }, 700);
    } catch (e: any) {
      mostrarFeedback("erro", e.message || "Erro ao excluir questão");
    } finally {
      setExcluindo(false);
    }
  }

  async function criarAlternativa(e: FormEvent) {
    e.preventDefault();

    setErroAlternativa("");
    setFeedback("");
    setFeedbackTipo("");

    if (!novaAlternativa.trim()) {
      setErroAlternativa("Digite o texto da alternativa.");
      mostrarFeedback("erro", "Digite o texto da alternativa.");
      return;
    }

    try {
      setSalvandoAlternativa(true);

      const res = await fetch(
        `/api/professor/provas/${provaId}/questoes/${questaoId}/alternativas`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            texto: novaAlternativa,
            correta: novaAlternativaCorreta,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar alternativa");
      }

      setNovaAlternativa("");
      setNovaAlternativaCorreta(false);
      setErroAlternativa("");
      mostrarFeedback("sucesso", "Alternativa adicionada com sucesso");
      await carregarQuestao();
    } catch (e: any) {
      mostrarFeedback("erro", e.message || "Erro ao criar alternativa");
    } finally {
      setSalvandoAlternativa(false);
    }
  }

  if (loading) {
    return <div className="p-6">Carregando questão...</div>;
  }

  if (erro && !questao) {
    return <div className="p-6 text-red-600">{erro}</div>;
  }

  if (!questao) {
    return <div className="p-6">Questão não encontrada</div>;
  }

  return (
    <>
      <div className="p-6">
        <div className="mx-auto max-w-4xl space-y-6">
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
                Editar questão
              </h1>
              <p className="text-sm text-gray-500">
                Questão {questao.ordem} da prova
              </p>
            </div>

            <a
              href={`/professor/provas/${provaId}`}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Voltar para prova
            </a>
          </div>

          <form
            onSubmit={salvarQuestao}
            className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
          >
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Enunciado
              </label>
              <textarea
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Pergunta complementar
              </label>
              <input
                type="text"
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Opcional"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tipo
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="MULTIPLA_ESCOLHA">Múltipla escolha</option>
                  <option value="DISCURSIVA">Discursiva</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Valor
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setModalExcluirAberto(true)}
                disabled={excluindo}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {excluindo ? "Excluindo..." : "Excluir questão"}
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar questão"}
              </button>
            </div>
          </form>

          {(tipo === "MULTIPLA_ESCOLHA" || tipo === "multipla_escolha") && (
            <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Alternativas
                </h2>
                <p className="text-sm text-gray-500">
                  Cadastre as alternativas da questão
                </p>
              </div>

              <form
                onSubmit={criarAlternativa}
                className="space-y-4 rounded-xl border p-4"
              >
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Texto da alternativa
                  </label>
                  <input
                    type="text"
                    value={novaAlternativa}
                    onChange={(e) => {
                      setNovaAlternativa(e.target.value);
                      if (erroAlternativa) setErroAlternativa("");
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                      erroAlternativa
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-300 focus:border-blue-500"
                    }`}
                    placeholder="Digite a alternativa"
                  />
                  {erroAlternativa && (
                    <p className="text-xs font-medium text-red-600">
                      {erroAlternativa}
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={novaAlternativaCorreta}
                    onChange={(e) => setNovaAlternativaCorreta(e.target.checked)}
                  />
                  Marcar como correta
                </label>

                <button
                  type="submit"
                  disabled={salvandoAlternativa}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {salvandoAlternativa ? "Adicionando..." : "Adicionar alternativa"}
                </button>
              </form>

              <div className="space-y-3">
                {questao.alternativas && questao.alternativas.length > 0 ? (
                  questao.alternativas.map((alt) => (
                    <div
                      key={alt.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm text-gray-900">{alt.texto}</p>
                        <p className="text-xs text-gray-500">
                          {alt.correta
                            ? "Alternativa correta"
                            : "Alternativa incorreta"}
                        </p>
                      </div>

                      <a
                        href={`/professor/provas/${provaId}/questoes/${questaoId}/alternativas/${alt.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        Editar
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border p-4 text-sm text-gray-500">
                    Nenhuma alternativa cadastrada ainda.
                  </div>
                )}
              </div>
            </div>
          )}
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
                  Tem certeza que deseja excluir esta questão?
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
                onClick={excluirQuestaoConfirmada}
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