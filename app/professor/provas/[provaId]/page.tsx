"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Alternativa = {
  id: number;
  texto: string;
  correta: boolean;
};

type Questao = {
  id: number;
  enunciado: string;
  pergunta?: string;
  tipo: "MULTIPLA_ESCOLHA" | "DISCURSIVA";
  valor: number;
  ordem: number;
  alternativas: Alternativa[];
};

type Prova = {
  id: number;
  titulo: string;
  notaMaxima: number;
  tempoMin?: number | null;
  status: "RASCUNHO" | "PUBLICADA" | "ENCERRADA";
  ativa?: boolean;
  questoes: Questao[];
};

export default function ProvaPage() {
  const params = useParams();
  const router = useRouter();
  const provaId = params.provaId as string;

  const [prova, setProva] = useState<Prova | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [acaoLoading, setAcaoLoading] = useState<"" | "publicar" | "encerrar">("");

  async function carregarProva() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(`/api/professor/provas/${provaId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar prova");
      }

      setProva({
  ...data,
  status: data.ativa ? "PUBLICADA" : "RASCUNHO",
});
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar prova");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProva();
  }, []);

  const totalQuestoes = prova?.questoes?.length || 0;

  const totalDiscursivas = useMemo(() => {
    return (prova?.questoes || []).filter((q) => q.tipo === "DISCURSIVA").length;
  }, [prova]);

  const totalMultiplaEscolha = useMemo(() => {
    return (prova?.questoes || []).filter(
      (q) => q.tipo === "MULTIPLA_ESCOLHA"
    ).length;
  }, [prova]);

  async function publicarProva() {
    if (!prova) return;

    try {
      setAcaoLoading("publicar");

      const res = await fetch(`/api/professor/provas/${prova.id}/publicar`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao publicar prova");
      }

      await carregarProva();
      alert("Prova publicada com sucesso");
    } catch (e: any) {
      alert(e.message || "Erro ao publicar prova");
    } finally {
      setAcaoLoading("");
    }
  }

  async function encerrarProva() {
    if (!prova) return;

    const confirmou = window.confirm("Tem certeza que deseja encerrar esta prova?");
    if (!confirmou) return;

    try {
      setAcaoLoading("encerrar");

      const res = await fetch(`/api/professor/provas/${prova.id}/encerrar`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao encerrar prova");
      }

      await carregarProva();
      alert("Prova encerrada com sucesso");
    } catch (e: any) {
      alert(e.message || "Erro ao encerrar prova");
    } finally {
      setAcaoLoading("");
    }
  }

  function getStatusLabel(status: Prova["status"]) {
    if (status === "PUBLICADA") return "Publicada";
    if (status === "ENCERRADA") return "Encerrada";
    return "Rascunho";
  }

  function getStatusClasses(status: Prova["status"]) {
    if (status === "PUBLICADA") {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (status === "ENCERRADA") {
      return "bg-gray-100 text-gray-700 border-gray-200";
    }

    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }

  if (loading) {
    return <div className="p-6">Carregando prova...</div>;
  }

  if (erro) {
    return <div className="p-6 text-red-600">{erro}</div>;
  }

  if (!prova) {
    return <div className="p-6">Prova não encontrada</div>;
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/professor/provas"
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                ← Voltar para provas
              </a>

              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                  prova.status
                )}`}
              >
                {getStatusLabel(prova.status)}
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">{prova.titulo}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gerencie os dados da prova e monte as questões
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`/professor/provas/${prova.id}/tentativas`}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Ver tentativas
            </a>

            {prova.status === "RASCUNHO" && (
              <button
                onClick={publicarProva}
                disabled={acaoLoading === "publicar"}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {acaoLoading === "publicar" ? "Publicando..." : "Publicar prova"}
              </button>
            )}

            {prova.status !== "ENCERRADA" && (
              <button
                onClick={encerrarProva}
                disabled={acaoLoading === "encerrar"}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {acaoLoading === "encerrar" ? "Encerrando..." : "Encerrar prova"}
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Nota máxima
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {prova.notaMaxima}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Tempo
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {prova.tempoMin ? `${prova.tempoMin} min` : "Livre"}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Questões
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalQuestoes}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Tipos
            </p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {totalMultiplaEscolha} múltipla • {totalDiscursivas} discursiva
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Questões</h2>
              <p className="text-sm text-gray-500">
                Adicione, revise e organize as questões desta prova
              </p>
            </div>

            <a
              href={`/professor/provas/${prova.id}/questoes/nova`}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Nova questão
            </a>
          </div>

          <div className="mt-6 space-y-4">
            {prova.questoes.length === 0 && (
              <div className="rounded-xl border border-dashed p-6 text-sm text-gray-500">
                Nenhuma questão cadastrada ainda.
              </div>
            )}

            {prova.questoes.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border p-5 transition hover:border-gray-300"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        Questão {q.ordem}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          q.tipo === "DISCURSIVA"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {q.tipo === "DISCURSIVA"
                          ? "Discursiva"
                          : "Múltipla escolha"}
                      </span>

                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                        Valor {q.valor}
                      </span>
                    </div>

                    <p className="text-base font-medium text-gray-900">
                      {q.enunciado}
                    </p>

                    {q.pergunta && (
                      <p className="text-sm text-gray-500">{q.pergunta}</p>
                    )}

                    {q.tipo === "MULTIPLA_ESCOLHA" && (
                      <p className="text-xs text-gray-500">
                        {q.alternativas?.length || 0} alternativa(s) cadastrada(s)
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/professor/provas/${prova.id}/questoes/${q.id}`}
                      className="rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Editar
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {prova.status === "RASCUNHO" && prova.questoes.length === 0 && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Para publicar a prova, adicione pelo menos 1 questão.
          </div>
        )}
      </div>
    </div>
  );
}