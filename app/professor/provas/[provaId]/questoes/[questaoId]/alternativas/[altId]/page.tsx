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
  const [erro, setErro] = useState("");

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

      alert("Alternativa atualizada com sucesso");
      router.push(`/professor/provas/${provaId}/questoes/${questaoId}`);
    } catch (e: any) {
      setErro(e.message || "Erro ao salvar alternativa");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirAlternativa() {
    const confirmou = window.confirm(
      "Tem certeza que deseja excluir esta alternativa?"
    );
    if (!confirmou) return;

    try {
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

      router.push(`/professor/provas/${provaId}/questoes/${questaoId}`);
    } catch (e: any) {
      alert(e.message || "Erro ao excluir alternativa");
    }
  }

  if (loading) {
    return <div className="p-6">Carregando alternativa...</div>;
  }

  if (erro && !texto) {
    return <div className="p-6 text-red-600">{erro}</div>;
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl space-y-6">
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
              onClick={excluirAlternativa}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Excluir alternativa
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
  );
}