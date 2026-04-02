"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function NovaQuestaoPage() {
  const params = useParams();
  const router = useRouter();

  const provaId = params.provaId as string;

  const [enunciado, setEnunciado] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [tipo, setTipo] = useState<"MULTIPLA_ESCOLHA" | "DISCURSIVA">(
    "MULTIPLA_ESCOLHA"
  );
  const [valor, setValor] = useState("1");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setErro("");

      const res = await fetch(`/api/professor/provas/${provaId}/questoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enunciado,
          pergunta,
          tipo,
          valor: Number(valor),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar questão");
      }

      router.push(`/professor/provas/${provaId}/questoes/${data.id}`);
    } catch (e: any) {
      setErro(e.message || "Erro ao criar questão");
    } finally {
      setLoading(false);
    }
  }

  const descricaoTipo = useMemo(() => {
    if (tipo === "DISCURSIVA") {
      return "Questão respondida em texto livre. Exige correção manual do professor.";
    }

    return "Questão com alternativas. A correção pode ser feita automaticamente.";
  }, [tipo]);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <a
              href={`/professor/provas/${provaId}`}
              className="inline-block text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              ← Voltar para prova
            </a>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nova questão</h1>
              <p className="mt-1 text-sm text-gray-500">
                Adicione uma nova questão à prova e defina o tipo de avaliação.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Depois de criar, você poderá editar a questão e cadastrar alternativas.
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2"
          >
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Dados da questão
              </h2>
              <p className="text-sm text-gray-500">
                Preencha o enunciado e configure o tipo da questão.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Enunciado
              </label>
              <textarea
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
                placeholder="Digite o enunciado da questão"
                rows={6}
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
                placeholder="Opcional"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tipo da questão
                </label>
                <select
                  value={tipo}
                  onChange={(e) =>
                    setTipo(
                      e.target.value as "MULTIPLA_ESCOLHA" | "DISCURSIVA"
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="MULTIPLA_ESCOLHA">Múltipla escolha</option>
                  <option value="DISCURSIVA">Discursiva</option>
                </select>
                <p className="text-xs text-gray-500">{descricaoTipo}</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Valor da questão
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

            <div className="flex items-center justify-end gap-3">
              <a
                href={`/professor/provas/${provaId}`}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </a>

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Criando..." : "Criar questão"}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Resumo</h2>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Tipo</p>
                  <p className="font-medium text-gray-900">
                    {tipo === "DISCURSIVA" ? "Discursiva" : "Múltipla escolha"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Valor</p>
                  <p className="font-medium text-gray-900">{valor || "-"}</p>
                </div>

                <div>
                  <p className="text-gray-500">Pergunta complementar</p>
                  <p className="font-medium text-gray-900">
                    {pergunta || "Não informada"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Dica rápida
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Em questões de múltipla escolha, depois da criação você poderá
                cadastrar as alternativas e definir qual é a correta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}