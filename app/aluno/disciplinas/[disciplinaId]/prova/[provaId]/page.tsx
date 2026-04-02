"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Alternativa = { id: number; texto: string };
type Questao = {
  id: number;
  pergunta: string;
  tipo: string;
  valor: number;
  alternativas: Alternativa[];
};

type Prova = {
  id: number;
  titulo: string;
  notaMaxima: number;
  ativa: boolean;
  questoes: Questao[];
};

type ResultadoFinal = {
  mensagem?: string;
  nota?: number;
  notaFinal?: number;
  notaMaxima?: number;
  aprovado?: boolean;
};

export default function ExecutarProvaPage() {
  const params = useParams<{ disciplinaId: string; provaId: string }>();
  const router = useRouter();

  const disciplinaId = Number(params.disciplinaId);
  const provaId = Number(params.provaId);

  const [loading, setLoading] = useState(true);
  const [finalizando, setFinalizando] = useState(false);
  const [prova, setProva] = useState<Prova | null>(null);
  const [tentativaId, setTentativaId] = useState<number | null>(null);
  const [resultado, setResultado] = useState<ResultadoFinal | null>(null);

  const [respostas, setRespostas] = useState<
    Record<number, { alternativaId?: number; respostaTexto?: string }>
  >({});

  useEffect(() => {
    async function boot() {
      setLoading(true);
      try {
        const r1 = await fetch(`/api/provas/${provaId}`, {
          credentials: "include",
        });
        const provaData = await r1.json();
        setProva(provaData);

        const r2 = await fetch(`/api/provas/${provaId}/iniciar`, {
          method: "POST",
          credentials: "include",
        });
        const t = await r2.json();
        setTentativaId(t?.tentativaId ?? null);
      } finally {
        setLoading(false);
      }
    }

    if (Number.isFinite(provaId) && provaId > 0) boot();
  }, [provaId]);

  const questoes = useMemo(() => prova?.questoes ?? [], [prova]);

  async function salvarQuestao(questaoId: number) {
    if (!tentativaId) return;

    const payload = respostas[questaoId] ?? {};

    await fetch(`/api/provas/tentativas/${tentativaId}/responder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ questaoId, ...payload }),
    });
  }

  async function finalizar() {
    if (!tentativaId || finalizando) return;

    try {
      setFinalizando(true);

      for (const q of questoes) {
        await salvarQuestao(q.id);
      }

      const res = await fetch(`/api/provas/tentativas/${tentativaId}/finalizar`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.mensagem || "Erro ao finalizar prova");
      }

      setResultado(data);
    } catch (e: any) {
      alert(e?.message || "Erro ao finalizar prova.");
    } finally {
      setFinalizando(false);
    }
  }

  const notaExibida =
    resultado?.notaFinal ??
    resultado?.nota ??
    0;

  const notaMaximaExibida =
    resultado?.notaMaxima ??
    prova?.notaMaxima ??
    0;

  if (loading) return <div className="p-8">Carregando prova...</div>;
  if (!prova) return <div className="p-8">Prova não encontrada.</div>;

  if (resultado) {
    return (
      <div className="p-6 max-w-3xl space-y-6">
        <div className="bg-white border rounded-2xl p-8">
          <h1 className="text-2xl font-bold">📊 Resultado da prova</h1>

          <p className="text-gray-600 mt-2">
            {resultado?.mensagem || "Prova finalizada com sucesso!"}
          </p>

          <div className="mt-6 space-y-3">
            <p className="text-3xl font-bold">
              Nota: {notaExibida} / {notaMaximaExibida}
            </p>

            <p
              className={`text-lg font-semibold ${
                resultado?.aprovado ? "text-green-600" : "text-red-600"
              }`}
            >
              {resultado?.aprovado ? "Aprovado ✅" : "Reprovado ❌"}
            </p>
          </div>

          <div className="mt-8">
            <button
              onClick={() => router.push(`/aluno/disciplinas/${disciplinaId}`)}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              Voltar para disciplina
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="bg-white border rounded-2xl p-6">
        <h1 className="text-2xl font-bold">{prova.titulo}</h1>
        <p className="text-gray-600 mt-1">Responda e finalize para enviar.</p>
      </div>

      <div className="space-y-4">
        {questoes.map((q, idx) => (
          <div key={q.id} className="bg-white border rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  Questão {idx + 1} • {q.valor} pts
                </p>
                <p className="font-semibold text-lg mt-1">{q.pergunta}</p>
              </div>

              <button
                onClick={() => salvarQuestao(q.id)}
                className="px-3 py-2 rounded-xl border bg-white hover:border-blue-400 transition"
              >
                Salvar
              </button>
            </div>

            {q.tipo === "multipla_escolha" ? (
              <div className="mt-4 space-y-2">
                {q.alternativas.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-3 p-3 border rounded-xl hover:border-blue-300 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={respostas[q.id]?.alternativaId === a.id}
                      onChange={() =>
                        setRespostas((prev) => ({
                          ...prev,
                          [q.id]: { ...prev[q.id], alternativaId: a.id },
                        }))
                      }
                    />
                    <span>{a.texto}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <textarea
                  value={respostas[q.id]?.respostaTexto ?? ""}
                  onChange={(e) =>
                    setRespostas((prev) => ({
                      ...prev,
                      [q.id]: { ...prev[q.id], respostaTexto: e.target.value },
                    }))
                  }
                  className="w-full min-h-[120px] border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Digite sua resposta..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Questão discursiva será corrigida pelo professor.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/aluno/disciplinas/${disciplinaId}`)}
          className="px-4 py-2 rounded-xl border bg-white hover:border-blue-400 transition"
        >
          ← Voltar
        </button>

        <button
          onClick={finalizar}
          disabled={finalizando}
          className="px-5 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          {finalizando ? "Finalizando..." : "Finalizar prova"}
        </button>
      </div>
    </div>
  );
}