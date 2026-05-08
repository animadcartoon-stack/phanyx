"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PhanyxToast from "@/components/ui/PhanyxToast";

type Entrega = {
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

export default function CorrigirEntregaPage() {
  const params = useParams();
  const entregaId = params.entregaId as string;

  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [nota, setNota] = useState("");
  const [feedback, setFeedback] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregarEntrega() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(`/api/professor/entregas/${entregaId}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar entrega");
      }

      setEntrega(json);

      setNota(json.nota ? String(json.nota) : "");
      setFeedback(json.feedback || "");
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarEntrega();
  }, [entregaId]);

  async function salvar() {
    try {
      setSalvando(true);

      const res = await fetch(
        `/api/professor/atividades/${entrega?.atividade?.id}/corrigir`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            alunoId: entrega?.aluno?.id,
            nota: nota ? Number(nota) : null,
            feedback,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao salvar");
      }

      setSucesso("Correção salva com sucesso.");
      await carregarEntrega();
    } catch (e: any) {
      setErro(e?.message || "Erro ao salvar correção.");
    } finally {
      setSalvando(false);
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return "—";
    try {
      return new Date(data).toLocaleString("pt-BR");
    } catch {
      return data;
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>;
  if (erro) return <div className="p-6 text-red-600">{erro}</div>;
  if (!entrega) return null;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
      {sucesso && (
  <PhanyxToast
    tipo="sucesso"
    titulo="Tudo certo"
    mensagem={sucesso}
    onClose={() => setSucesso("")}
  />
)}

{erro && (
  <PhanyxToast
    tipo="erro"
    titulo="Não foi possível salvar"
    mensagem={erro}
    onClose={() => setErro("")}
  />
)}
        <a
          href="/professor/atividades"
          className="text-sm text-gray-500 hover:underline"
        >
          ← Voltar
        </a>

        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <h1 className="text-xl font-bold">
            {entrega.atividade?.titulo}
          </h1>

          <p className="text-sm text-gray-500">
            Aluno: {entrega.aluno?.nome}
          </p>

          <p className="text-sm text-gray-500">
            Entregue em: {formatarData(entrega.entregueEm)}
          </p>
        </div>

        {/* Conteúdo */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-gray-50 p-4 rounded-xl">
            <strong>Texto</strong>
            <p className="text-sm mt-2 whitespace-pre-wrap">
              {entrega.texto || "—"}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <strong>Link</strong>
            {entrega.link ? (
              <a href={entrega.link} target="_blank" className="block text-blue-600">
                {entrega.link}
              </a>
            ) : (
              <p>—</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <strong>Arquivo</strong>
            {entrega.arquivoUrl ? (
              <a href={entrega.arquivoUrl} target="_blank" className="block text-blue-600">
                Abrir arquivo
              </a>
            ) : (
              <p>—</p>
            )}
          </div>
        </div>

        {/* Correção */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium">Nota</label>
            <input
              type="number"
              max={entrega.atividade?.notaMaxima}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full border rounded-lg p-2"
              rows={4}
            />
          </div>

          <button
            onClick={salvar}
            disabled={salvando}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            {salvando ? "Salvando..." : "Salvar correção"}
          </button>
        </div>
      </div>
    </div>
  );
}