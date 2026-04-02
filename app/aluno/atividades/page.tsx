"use client";

import { useEffect, useState } from "react";

type AtividadeItem = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  status: string;
  notaMaxima: number;
  disciplinaNome: string;
  turmaNome?: string | null;
};

type AtividadesResponse = {
  ok: boolean;
  total: number;
  items: AtividadeItem[];
};

export default function AlunoAtividadesPage() {
  const [data, setData] = useState<AtividadesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarAtividades() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/aluno/atividades");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar atividades");
      }

      setData(json);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar atividades");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAtividades();
  }, []);

  function formatarData(data?: string | null) {
    if (!data) return "Sem prazo";

    try {
      return new Date(data).toLocaleString("pt-BR");
    } catch {
      return data;
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Atividades</h1>
          <p className="mt-1 text-sm text-gray-500">
            Veja as atividades publicadas e acompanhe os prazos.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
            Carregando atividades...
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {!loading && !erro && data && (
          <>
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Total de atividades
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {data.total}
              </p>
            </div>

            {data.items.length === 0 ? (
              <div className="rounded-2xl border bg-white p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Nenhuma atividade disponível
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Quando o professor publicar atividades, elas aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {data.items.map((atividade) => (
                  <div
                    key={atividade.id}
                    className="rounded-2xl border bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {atividade.titulo}
                        </h2>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span>
                            <strong className="font-medium text-gray-700">
                              Disciplina:
                            </strong>{" "}
                            {atividade.disciplinaNome}
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

                          {atividade.turmaNome && (
                            <span>
                              <strong className="font-medium text-gray-700">
                                Turma:
                              </strong>{" "}
                              {atividade.turmaNome}
                            </span>
                          )}
                        </div>

                        {atividade.descricao && (
                          <p className="text-sm text-gray-600">
                            {atividade.descricao}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={`/aluno/atividades/${atividade.id}`}
                          className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Ver atividade
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}