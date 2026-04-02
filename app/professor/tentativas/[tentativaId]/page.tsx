"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Alternativa = {
  id: number;
  texto: string;
  correta?: boolean;
};

type Questao = {
  id: number;
  enunciado: string;
  pergunta?: string;
  tipo: "MULTIPLA_ESCOLHA" | "DISCURSIVA";
  valor: number;
};

type Resposta = {
  id: number;
  respostaTexto?: string | null;
  nota?: number | null;
  feedback?: string | null;
  questao: Questao;
  alternativa?: Alternativa | null;
};

type Aluno = {
  id: number;
  nome?: string;
};

type Prova = {
  id: number;
  titulo: string;
};

type Tentativa = {
  id: number;
  notaFinal?: number | null;
  finalizada: boolean;
  startedAt: string;
  finishedAt?: string | null;
  aluno: Aluno;
  prova: Prova;
  nome?: string | null;
  respostas: Resposta[];
};

type EstadoCorrecao = {
  respostaId: number;
  nota: string;
  feedback: string;
};

export default function TentativaPage() {
  const params = useParams();
  const tentativaId = params.tentativaId as string;

  const [tentativa, setTentativa] = useState<Tentativa | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [correcoes, setCorrecoes] = useState<EstadoCorrecao[]>([]);

  async function carregarTentativa() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(`/api/professor/tentativas/${tentativaId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar tentativa");
      }

      setTentativa(data);

      const discursivas = (data.respostas || [])
        .filter((r: Resposta) => r.questao?.tipo === "DISCURSIVA")
        .map((r: Resposta) => ({
          respostaId: r.id,
          nota:
            r.nota !== null && r.nota !== undefined ? String(r.nota) : "",
          feedback: r.feedback || "",
        }));

      setCorrecoes(discursivas);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar tentativa");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTentativa();
  }, []);

  const respostasDiscursivas = useMemo(() => {
    return (tentativa?.respostas || []).filter(
      (r) => r.questao?.tipo === "DISCURSIVA"
    );
  }, [tentativa]);

  const totalQuestoes = tentativa?.respostas?.length || 0;

  const totalDiscursivas = useMemo(() => {
    return (tentativa?.respostas || []).filter(
      (r) => r.questao?.tipo === "DISCURSIVA"
    ).length;
  }, [tentativa]);

  const totalObjetivas = useMemo(() => {
    return (tentativa?.respostas || []).filter(
      (r) => r.questao?.tipo === "MULTIPLA_ESCOLHA"
    ).length;
  }, [tentativa]);

  function atualizarCorrecao(
    respostaId: number,
    campo: "nota" | "feedback",
    valor: string
  ) {
    setCorrecoes((prev) =>
      prev.map((item) =>
        item.respostaId === respostaId ? { ...item, [campo]: valor } : item
      )
    );
  }

  async function enviarCorrecao(e: FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");

      const payload = {
        respostas: correcoes.map((item) => ({
          respostaId: item.respostaId,
          nota: Number(item.nota || 0),
          feedback: item.feedback,
        })),
      };

      const res = await fetch(
        `/api/professor/tentativas/${tentativaId}/corrigir-discursivas`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao corrigir discursivas");
      }

      alert("Correção salva com sucesso");
      await carregarTentativa();
    } catch (e: any) {
      setErro(e.message || "Erro ao corrigir discursivas");
    } finally {
      setSalvando(false);
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";

    try {
      return new Date(data).toLocaleString("pt-BR");
    } catch {
      return data;
    }
  }

  if (loading) {
    return <div className="p-6">Carregando tentativa...</div>;
  }

  if (erro && !tentativa) {
    return <div className="p-6 text-red-600">{erro}</div>;
  }

  if (!tentativa) {
    return <div className="p-6">Tentativa não encontrada</div>;
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <a
              href="javascript:history.back()"
              className="inline-block text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              ← Voltar
            </a>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tentativa #{tentativa.id}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Prova: {tentativa.prova?.titulo || "-"}
              </p>
            </div>
          </div>

          <div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                tentativa.finalizada
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {tentativa.finalizada ? "Finalizada" : "Em andamento"}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          <div className="rounded-2xl border bg-white p-5 shadow-sm md:col-span-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Aluno
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {tentativa.aluno?.nome || `Aluno ${tentativa.aluno?.id}`}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Nota atual
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {tentativa.notaFinal ?? "-"}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Respostas
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalQuestoes}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Objetivas
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalObjetivas}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Discursivas
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalDiscursivas}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Início
            </p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {formatarData(tentativa.startedAt)}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Finalização
            </p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {formatarData(tentativa.finishedAt)}
            </p>
          </div>
        </div>

        {erro && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Respostas da tentativa
            </h2>
            <p className="text-sm text-gray-500">
              Revise cada resposta antes de corrigir as discursivas
            </p>
          </div>

          {(tentativa.respostas || []).map((resposta, index) => (
            <div
              key={resposta.id}
              className="rounded-2xl border bg-white p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                      Questão {index + 1}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        resposta.questao.tipo === "DISCURSIVA"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {resposta.questao.tipo === "DISCURSIVA"
                        ? "Discursiva"
                        : "Múltipla escolha"}
                    </span>

                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                      Valor {resposta.questao.valor}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-gray-900">
                    {resposta.questao.enunciado}
                  </h3>

                  {resposta.questao.pergunta && (
                    <p className="text-sm text-gray-500">
                      {resposta.questao.pergunta}
                    </p>
                  )}
                </div>

                {resposta.questao.tipo === "DISCURSIVA" && (
                  <div className="text-sm text-gray-500">
                    Nota atual:{" "}
                    <span className="font-medium text-gray-900">
                      {resposta.nota ?? "-"}
                    </span>
                  </div>
                )}
              </div>

              {resposta.questao.tipo === "MULTIPLA_ESCOLHA" && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">
                    Alternativa marcada
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {resposta.alternativa?.texto || "Nenhuma alternativa marcada"}
                  </p>
                </div>
              )}

              {resposta.questao.tipo === "DISCURSIVA" && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-700">
                    Resposta do aluno
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                    {resposta.respostaTexto || "Sem resposta"}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {respostasDiscursivas.length > 0 && (
          <form
            onSubmit={enviarCorrecao}
            className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Correção das discursivas
              </h2>
              <p className="text-sm text-gray-500">
                Atribua nota e feedback para cada resposta discursiva
              </p>
            </div>

            {respostasDiscursivas.map((resposta, index) => {
              const correcao = correcoes.find(
                (item) => item.respostaId === resposta.id
              );

              return (
                <div
                  key={resposta.id}
                  className="rounded-xl border border-gray-200 p-4 space-y-4"
                >
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-900">
                      Discursiva {index + 1}
                    </p>
                    <p className="text-sm text-gray-800">
                      {resposta.questao.enunciado}
                    </p>
                    <p className="text-xs text-gray-500">
                      Valor máximo: {resposta.questao.valor}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-700">
                      Resposta do aluno
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                      {resposta.respostaTexto || "Sem resposta"}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Nota
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={correcao?.nota || ""}
                        onChange={(e) =>
                          atualizarCorrecao(
                            resposta.id,
                            "nota",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        placeholder={`Máximo: ${resposta.questao.valor}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Feedback
                      </label>
                      <input
                        type="text"
                        value={correcao?.feedback || ""}
                        onChange={(e) =>
                          atualizarCorrecao(
                            resposta.id,
                            "feedback",
                            e.target.value
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        placeholder="Comentário opcional"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={salvando}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {salvando ? "Salvando correção..." : "Salvar correção"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}