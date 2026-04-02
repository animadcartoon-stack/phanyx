"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type EntregaDetalhe = {
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
  atividade?: {
    id: number;
    titulo: string;
    notaMaxima: number;
  } | null;
};

export default function ProfessorEntregaDetalhePage() {
  const params = useParams();
  const entregaId = params.entregaId as string;

  const [entrega, setEntrega] = useState<EntregaDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [nota, setNota] = useState("");
  const [feedback, setFeedback] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregarEntrega() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/professor/atividades");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar entregas");
      }

      let encontrada: any = null;

      for (const atividade of json) {
        const detalheRes = await fetch(`/api/professor/atividades/${atividade.id}`);
        const detalheJson = await detalheRes.json();

        if (!detalheRes.ok) continue;

        const entregaEncontrada = (detalheJson.entregas || []).find(
          (item: any) => String(item.id) === String(entregaId)
        );

        if (entregaEncontrada) {
          encontrada = {
            ...entregaEncontrada,
            atividade: {
              id: detalheJson.id,
              titulo: detalheJson.titulo,
              notaMaxima: detalheJson.notaMaxima,
            },
          };
          break;
        }
      }

      if (!encontrada) {
        throw new Error("Entrega não encontrada");
      }

      setEntrega(encontrada);
      setNota(
        encontrada.nota !== null && encontrada.nota !== undefined
          ? String(encontrada.nota)
          : ""
      );
      setFeedback(encontrada.feedback || "");
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar entrega");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarEntrega();
  }, [entregaId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const res = await fetch(
        `/api/professor/entregas/${entregaId}/corrigir`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nota,
            feedback,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao corrigir entrega");
      }

      setMensagem("Entrega corrigida com sucesso.");
      await carregarEntrega();
    } catch (e: any) {
      setErro(e.message || "Erro ao corrigir entrega");
    } finally {
      setSalvando(false);
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

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
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
            Carregando entrega...
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {!loading && !erro && entrega && (
          <>
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="space-y-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  Correção da entrega
                </h1>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                  <span>
                    <strong className="font-medium text-gray-700">
                      Atividade:
                    </strong>{" "}
                    {entrega.atividade?.titulo}
                  </span>

                  <span>
                    <strong className="font-medium text-gray-700">
                      Aluno:
                    </strong>{" "}
                    {entrega.aluno?.nome || `Aluno ${entrega.aluno?.id ?? ""}`}
                  </span>

                  <span>
                    <strong className="font-medium text-gray-700">
                      Entregue em:
                    </strong>{" "}
                    {formatarData(entrega.entregueEm)}
                  </span>

                  <span>
                    <strong className="font-medium text-gray-700">
                      Nota máxima:
                    </strong>{" "}
                    {entrega.atividade?.notaMaxima ?? "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              {entrega.texto && (
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                  <strong className="font-medium text-gray-800">Texto:</strong>
                  <p className="mt-2 whitespace-pre-wrap">{entrega.texto}</p>
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
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Corrigir entrega
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Informe a nota e o feedback do aluno.
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
                  Nota
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Ex.: 8.5"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Escreva um feedback para o aluno"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Salvar correção"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}