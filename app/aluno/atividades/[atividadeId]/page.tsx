"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type AtividadeDetalhe = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  status: string;
  notaMaxima: number;
  disciplinaNome?: string;
  turmaNome?: string | null;
};

export default function AlunoAtividadeDetalhePage() {
  const params = useParams();
  const atividadeId = params.atividadeId as string;

  const [atividade, setAtividade] = useState<AtividadeDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [texto, setTexto] = useState("");
  const [link, setLink] = useState("");
  const [arquivoUrl, setArquivoUrl] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function carregarAtividade() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/aluno/atividades");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar atividade");
      }

      const encontrada = (json.items || []).find(
        (item: any) => String(item.id) === String(atividadeId)
      );

      if (!encontrada) {
        throw new Error("Atividade não encontrada");
      }

      setAtividade(encontrada);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar atividade");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAtividade();
  }, [atividadeId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setMensagem("");
      setErro("");

      const res = await fetch(
        `/api/aluno/atividades/${atividadeId}/entregar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            texto,
            link,
            arquivoUrl,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao enviar atividade");
      }

      setMensagem("Entrega enviada com sucesso.");
    } catch (e: any) {
      setErro(e.message || "Erro ao enviar atividade");
    } finally {
      setSalvando(false);
    }
  }

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
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <a
            href="/aluno/atividades"
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
              <div className="space-y-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {atividade.titulo}
                </h1>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                  {atividade.disciplinaNome && (
                    <span>
                      <strong className="font-medium text-gray-700">
                        Disciplina:
                      </strong>{" "}
                      {atividade.disciplinaNome}
                    </span>
                  )}

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
                  <p className="text-sm leading-6 text-gray-700">
                    {atividade.descricao}
                  </p>
                )}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Enviar atividade
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Você pode enviar texto, link e arquivoUrl.
                </p>
              </div>

              {mensagem && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {mensagem}
                </div>
              )}

              {erro && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {erro}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Texto da entrega
                </label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={6}
                  placeholder="Escreva sua resposta ou observações"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Link
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  URL do arquivo
                </label>
                <input
                  type="url"
                  value={arquivoUrl}
                  onChange={(e) => setArquivoUrl(e.target.value)}
                  placeholder="https://arquivo..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {salvando ? "Enviando..." : "Enviar atividade"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}