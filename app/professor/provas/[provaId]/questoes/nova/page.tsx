"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type TipoQuestao = "MULTIPLA_ESCOLHA" | "DISCURSIVA";

type Alternativa = {
  texto: string;
  correta: boolean;
};

export default function NovaQuestaoPage() {
  const params = useParams();
  const router = useRouter();

  const provaId = params.provaId as string;

  const [enunciado, setEnunciado] = useState("");
  const [respostaModelo, setRespostaModelo] = useState("");
  const [tipo, setTipo] = useState<TipoQuestao>("MULTIPLA_ESCOLHA");
  const [valor, setValor] = useState("1");

  const [alternativas, setAlternativas] = useState<Alternativa[]>([
    { texto: "", correta: true },
    { texto: "", correta: false },
    { texto: "", correta: false },
    { texto: "", correta: false },
  ]);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const descricaoTipo = useMemo(() => {
    if (tipo === "DISCURSIVA") {
      return "Questão respondida em texto livre. Exige correção manual do professor.";
    }

    return "Questão com alternativas. Marque uma alternativa correta.";
  }, [tipo]);

  function atualizarAlternativa(index: number, texto: string) {
    setAlternativas((atuais) =>
      atuais.map((alt, i) => (i === index ? { ...alt, texto } : alt))
    );
  }

  function marcarCorreta(index: number) {
    setAlternativas((atuais) =>
      atuais.map((alt, i) => ({
        ...alt,
        correta: i === index,
      }))
    );
  }

  function adicionarAlternativa() {
    setAlternativas((atuais) => [...atuais, { texto: "", correta: false }]);
  }

  function removerAlternativa(index: number) {
    setAlternativas((atuais) => {
      if (atuais.length <= 2) return atuais;

      const novas = atuais.filter((_, i) => i !== index);

      if (!novas.some((alt) => alt.correta)) {
        novas[0].correta = true;
      }

      return novas;
    });
  }

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

    const alternativasValidas = alternativas
      .map((alt) => ({
        texto: alt.texto.trim(),
        correta: alt.correta,
      }))
      .filter((alt) => alt.texto.length > 0);

    if (tipo === "MULTIPLA_ESCOLHA") {
      if (alternativasValidas.length < 2) {
        setErro("Informe pelo menos 2 alternativas.");
        return;
      }

      if (alternativasValidas.filter((alt) => alt.correta).length !== 1) {
        setErro("Marque exatamente uma alternativa correta.");
        return;
      }
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
          alternativas:
            tipo === "MULTIPLA_ESCOLHA" ? alternativasValidas : [],
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Link
            href={`/professor/provas/${provaId}`}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← Voltar para prova
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            Nova questão
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Crie questões de múltipla escolha ou discursivas. Ao misturar os dois
            tipos, a prova será híbrida automaticamente.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {erro}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Tipo da questão
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoQuestao)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="MULTIPLA_ESCOLHA">Múltipla escolha</option>
                <option value="DISCURSIVA">Discursiva</option>
              </select>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {descricaoTipo}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Valor da questão
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Enunciado / pergunta
            </label>
            <textarea
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              placeholder="Digite a pergunta da questão"
              rows={6}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              required
            />
          </div>

          {tipo === "MULTIPLA_ESCOLHA" && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  Alternativas
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Preencha as opções e marque uma como correta.
                </p>
              </div>

              {alternativas.map((alt, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center"
                >
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="radio"
                      checked={alt.correta}
                      onChange={() => marcarCorreta(index)}
                      className="h-4 w-4"
                    />
                    Correta
                  </label>

                  <input
                    type="text"
                    value={alt.texto}
                    onChange={(e) =>
                      atualizarAlternativa(index, e.target.value)
                    }
                    placeholder={`Alternativa ${index + 1}`}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                  />

                  <button
                    type="button"
                    onClick={() => removerAlternativa(index)}
                    disabled={alternativas.length <= 2}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Remover
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={adicionarAlternativa}
                className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200"
              >
                + Adicionar alternativa
              </button>
            </div>
          )}

          {tipo === "DISCURSIVA" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Resposta modelo
              </label>
              <textarea
                value={respostaModelo}
                onChange={(e) => setRespostaModelo(e.target.value)}
                placeholder="Opcional. Use como referência para a correção manual."
                rows={4}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          )}

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
      </div>
    </div>
  );
}