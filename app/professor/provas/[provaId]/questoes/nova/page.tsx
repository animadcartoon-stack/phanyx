"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type TipoQuestao = "MULTIPLA_ESCOLHA" | "DISCURSIVA";

export default function NovaQuestaoPage() {
  const params = useParams();
  const router = useRouter();

  const provaId = params.provaId as string;

  const [enunciado, setEnunciado] = useState("");
  const [respostaModelo, setRespostaModelo] = useState("");
  const [tipo, setTipo] = useState<TipoQuestao>("MULTIPLA_ESCOLHA");
  const [valor, setValor] = useState("1");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const descricaoTipo = useMemo(() => {
    if (tipo === "DISCURSIVA") {
      return "Questão respondida em texto livre. Exige correção manual do professor.";
    }

    return "Questão com alternativas. A correção poderá ser automática.";
  }, [tipo]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const valorNumerico = Number(valor);

    if (!enunciado.trim()) {
      setErro("Digite o enunciado da questão.");
      return;
    }

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setErro("O valor da questão precisa ser maior que zero.");
      return;
    }

    try {
      setLoading(true);
      setErro("");

      const res = await fetch(`/api/professor/provas/${provaId}/questoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enunciado: enunciado.trim(),
          tipo,
          valor: valorNumerico,
          respostaModelo:
            tipo === "DISCURSIVA" && respostaModelo.trim()
              ? respostaModelo.trim()
              : null,
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

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Link
              href={`/professor/provas/${provaId}`}
              className="inline-block text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ← Voltar para prova
            </Link>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Nova questão
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Adicione uma nova questão à prova e defina o tipo de avaliação.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
            Depois de criar, você poderá editar a questão e cadastrar alternativas.
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2"
          >
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                {erro}
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Dados da questão
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Preencha o enunciado e configure o tipo da questão.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Enunciado
              </label>
              <textarea
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
                placeholder="Digite o enunciado da questão"
                rows={6}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                required
              />
            </div>

            {tipo === "DISCURSIVA" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Resposta modelo
                </label>
                <textarea
                  value={respostaModelo}
                  onChange={(e) => setRespostaModelo(e.target.value)}
                  placeholder="Opcional. Use como referência para a correção manual."
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Tipo da questão
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoQuestao)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="MULTIPLA_ESCOLHA">Múltipla escolha</option>
                  <option value="DISCURSIVA">Discursiva</option>
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {descricaoTipo}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Valor da questão
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href={`/professor/provas/${provaId}`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Criando..." : "Criar questão"}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Resumo
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Tipo</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {tipo === "DISCURSIVA" ? "Discursiva" : "Múltipla escolha"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-slate-400">Valor</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {valor || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Resposta modelo
                  </p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {tipo === "DISCURSIVA"
                      ? respostaModelo || "Não informada"
                      : "Não se aplica"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Dica rápida
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
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