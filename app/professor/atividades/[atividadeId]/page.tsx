"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type EntregaItem = {
  id: number;
  texto?: string | null;
  link?: string | null;
  arquivoUrl?: string | null;
  nota?: number | null;
  feedback?: string | null;
  entregueEm?: string | null;
  corrigidaEm?: string | null;
  aluno?: {
    id: number;
    nome?: string | null;
  } | null;
};

type AtividadeDetalhe = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  notaMaxima: number;
  status: string;
  disciplina?: {
    id: number;
    nome?: string | null;
    titulo?: string | null;
  } | null;
  turma?: {
    id: number;
    nome?: string | null;
  } | null;
  entregas?: EntregaItem[];
};

export default function ProfessorAtividadeDetalhePage() {
  const params = useParams();
  const atividadeId = params.atividadeId as string;

  const [atividade, setAtividade] = useState<AtividadeDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [acaoLoading, setAcaoLoading] = useState<
    "publicar" | "encerrar" | null
  >(null);

  async function carregarAtividade() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(`/api/professor/atividades/${atividadeId}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar atividade");
      }

      setAtividade(json);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar atividade");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAtividade();
  }, [atividadeId]);

async function voltarParaRascunho() {
  try {
    setAcaoLoading("publicar");
    setMensagem("");
    setErro("");

    const res = await fetch(
      `/api/professor/atividades/${atividadeId}/rascunho`,
      {
        method: "POST",
      }
    );

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || "Erro ao voltar atividade para rascunho");
    }

    setMensagem("Atividade voltou para rascunho com sucesso.");
    await carregarAtividade();
  } catch (e: any) {
    setErro(e.message || "Erro ao voltar atividade para rascunho");
  } finally {
    setAcaoLoading(null);
  }
}

  async function publicarAtividade() {
    try {
      setAcaoLoading("publicar");
      setMensagem("");
      setErro("");

      const res = await fetch(
        `/api/professor/atividades/${atividadeId}/publicar`,
        {
          method: "POST",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao publicar atividade");
      }

      setMensagem("Ação de publicar executada.");
      await carregarAtividade();
    } catch (e: any) {
      setErro(e.message || "Erro ao publicar atividade");
    } finally {
      setAcaoLoading(null);
    }
  }

  async function encerrarAtividade() {
    try {
      setAcaoLoading("encerrar");
      setMensagem("");
      setErro("");

      const res = await fetch(
        `/api/professor/atividades/${atividadeId}/encerrar`,
        {
          method: "POST",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao encerrar atividade");
      }

      setMensagem("Ação de encerrar executada.");
      await carregarAtividade();
    } catch (e: any) {
      setErro(e.message || "Erro ao encerrar atividade");
    } finally {
      setAcaoLoading(null);
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return "Sem data";

    try {
      return new Date(data).toLocaleString("pt-BR");
    } catch {
      return data;
    }
  }

  function getStatusBadge(status: string) {
    if (status === "PUBLICADA") {
      return "bg-green-100 text-green-700";
    }

    if (status === "ENCERRADA") {
      return "bg-gray-100 text-gray-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  function getStatusLabel(status: string) {
    if (status === "PUBLICADA") return "Publicada";
    if (status === "ENCERRADA") return "Encerrada";
    return "Rascunho";
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <a
            href="/professor/atividades"
            className="inline-block text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            ← Voltar para atividades
          </a>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
            Carregando atividade...
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {!loading && !erro && atividade && (
          <>
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {atividade.titulo}
                    </h1>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadge(
                        atividade.status
                      )}`}
                    >
                      {getStatusLabel(atividade.status)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                    <span>
                      <strong className="font-medium text-gray-700">
                        Disciplina:
                      </strong>{" "}
                      {atividade.disciplina?.nome ||
                        atividade.disciplina?.titulo ||
                        "Não informada"}
                    </span>

                    <span>
                      <strong className="font-medium text-gray-700">
                        Prazo:
                      </strong>{" "}
                      {formatarData(atividade.prazo)}
                    </span>

                    <span>
                      <strong className="font-medium text-gray-700">
                        Nota máxima:
                      </strong>{" "}
                      {atividade.notaMaxima}
                    </span>

                    {atividade.turma?.nome && (
                      <span>
                        <strong className="font-medium text-gray-700">
                          Turma:
                        </strong>{" "}
                        {atividade.turma.nome}
                      </span>
                    )}
                  </div>

                  {atividade.descricao && (
                    <p className="text-sm leading-6 text-gray-700">
                      {atividade.descricao}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={publicarAtividade}
                    disabled={acaoLoading !== null}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {acaoLoading === "publicar"
                      ? "Publicando..."
                      : "Publicar"}
                  </button>

                  <button
                    type="button"
                    onClick={encerrarAtividade}
                    disabled={acaoLoading !== null}
                    className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {acaoLoading === "encerrar"
                      ? "Encerrando..."
                      : "Encerrar"}
                  </button>
                </div>
              </div>
            </div>

            {mensagem && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 shadow-sm">
                {mensagem}
              </div>
            )}

            <div className="rounded-2xl border bg-white shadow-sm">
              <div className="border-b px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Entregas
                </h2>
                <p className="text-sm text-gray-500">
                  Lista de entregas enviadas pelos alunos
                </p>
              </div>

              {!atividade.entregas || atividade.entregas.length === 0 ? (
                <div className="px-6 py-8 text-sm text-gray-500">
                  Nenhuma entrega registrada até o momento.
                </div>
              ) : (
                <div className="divide-y">
                  {atividade.entregas.map((entrega) => (
                    
                    <div
                      key={entrega.id}
                      className="space-y-3 px-6 py-5"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <h3 className="font-medium text-gray-900">
                            {entrega.aluno?.nome || `Aluno ${entrega.aluno?.id ?? ""}`}
                          </h3>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                            <span>
                              <strong className="font-medium text-gray-700">
                                Entregue em:
                              </strong>{" "}
                              {formatarData(entrega.entregueEm)}
                            </span>

                            <span>
                              <strong className="font-medium text-gray-700">
                                Nota:
                              </strong>{" "}
                              {entrega.nota ?? "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {entrega.texto && (
                        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                          <strong className="font-medium text-gray-800">
                            Texto:
                          </strong>{" "}
                          {entrega.texto}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3 text-sm">
                        {entrega.link && (
                          <a
                            href={entrega.link}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border px-3 py-2 font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Abrir link
                          </a>
                        )}

                        {entrega.arquivoUrl && (
  <a
    href={entrega.arquivoUrl}
    target="_blank"
    rel="noreferrer"
    className="rounded-lg border px-3 py-2 font-medium text-gray-700 hover:bg-gray-50"
  >
    Abrir arquivo
  </a>
)}

<a
  href={`/professor/entregas/${entrega.id}`}
  className="rounded-lg border px-3 py-2 font-medium text-gray-700 hover:bg-gray-50"
>
  Corrigir entrega
</a>
                      </div>

                      {entrega.feedback && (
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                          <strong className="font-medium">Feedback:</strong>{" "}
                          {entrega.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}