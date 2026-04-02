"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAluno } from "@/app/context/AlunoContext";

const NOTA_MINIMA = 7;

type AlternativaApi = {
  id: number;
  texto: string;
  ordem?: number | null;
};

type QuestaoApi = {
  id: number;
  enunciado: string;
  tipo: "MULTIPLA_ESCOLHA" | "DISCURSIVA";
  valor: number;
  ordem?: number | null;
  alternativas?: AlternativaApi[];
};

type ProvaApi = {
  id: number;
  titulo: string;
  notaMaxima: number;
  tempoMin?: number | null;
  questoes: QuestaoApi[];
};

type IniciarResponse = {
  tentativaId: number;
  prova: ProvaApi;
};

export default function ProvaPage() {
  const router = useRouter();
  const params = useParams<{ disciplinaId: string }>();

  const disciplinaId = Number(params.disciplinaId);

  const { salvarNota, gerarCertificado, notas } = useAluno();

  // bloqueio: se já tem nota nessa disciplina, volta
  const notaDaDisciplina = useMemo(() => {
    return notas.find((n) => n.disciplinaId === disciplinaId);
  }, [notas, disciplinaId]);

  const [inicioProva] = useState(() => Date.now());

  const [loading, setLoading] = useState(true);
  const [prova, setProva] = useState<ProvaApi | null>(null);
  const [tentativaId, setTentativaId] = useState<number | null>(null);

  // respostas:
  // - MULTIPLA_ESCOLHA: guarda alternativaId (number)
  // - DISCURSIVA: guarda string
  const [respostas, setRespostas] = useState<Record<number, number | string>>({});

  const [resultado, setResultado] = useState<{
    nota: number;
    aprovado: boolean;
    tempo: number;
  } | null>(null);

  // 🔒 BLOQUEIO PROFISSIONAL
  useEffect(() => {
    if (notaDaDisciplina) {
      router.replace(`/aluno/disciplinas/${disciplinaId}`);
    }
  }, [notaDaDisciplina, router, disciplinaId]);

  // 1) Carregar prova real e iniciar tentativa
  useEffect(() => {
    let mounted = true;

    async function carregarEIniciar() {
      if (!Number.isFinite(disciplinaId) || disciplinaId <= 0) return;

      setLoading(true);
      try {
        // ✅ Inicia tentativa e já devolve prova completa
        const res = await fetch(`/api/aluno/provas/disciplinas/${disciplinaId}/iniciar`, {
          method: "POST",
          credentials: "include",
        });

        const data = (await res.json()) as IniciarResponse;

        if (!mounted) return;

        if (!res.ok) {
          setProva(null);
          setTentativaId(null);
          return;
        }

        // ordenação determinística
        const questoesOrdenadas = (data.prova.questoes ?? []).slice().sort((a, b) => {
          const ao = a.ordem ?? 0;
          const bo = b.ordem ?? 0;
          if (ao !== bo) return ao - bo;
          return a.id - b.id;
        });

        const provaNormalizada: ProvaApi = {
          ...data.prova,
          questoes: questoesOrdenadas.map((q) => ({
            ...q,
            alternativas:
              q.tipo === "MULTIPLA_ESCOLHA"
                ? (q.alternativas ?? []).slice().sort((a, b) => {
                    const ao = a.ordem ?? 0;
                    const bo = b.ordem ?? 0;
                    if (ao !== bo) return ao - bo;
                    return a.id - b.id;
                  })
                : [],
          })),
        };

        setProva(provaNormalizada);
        setTentativaId(data.tentativaId);
      } catch {
        if (!mounted) return;
        setProva(null);
        setTentativaId(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    carregarEIniciar();

    return () => {
      mounted = false;
    };
  }, [disciplinaId]);

  // helper: lista de questões
  const questoes = prova?.questoes ?? [];

  // 2) marcar resposta (salvar em tempo real)
  async function responderQuestao(questao: QuestaoApi, value: number | string) {
    setRespostas((prev) => ({ ...prev, [questao.id]: value }));

    if (!tentativaId) return;

    // salva no banco em tempo real
    await fetch(`/api/aluno/provas/tentativas/${tentativaId}/responder`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questaoId: questao.id,
        alternativaId: typeof value === "number" ? value : null,
        respostaTexto: typeof value === "string" ? value : null,
      }),
    });
  }

  // 3) finalizar prova (autocorreção objetiva)
  async function finalizarProva() {
    if (!prova || !tentativaId) return;
    if (questoes.length === 0) return;

    // valida se respondeu tudo
    const faltando = questoes.some((q) => {
      const v = respostas[q.id];
      if (q.tipo === "MULTIPLA_ESCOLHA") return typeof v !== "number";
      return typeof v !== "string" || v.trim().length === 0;
    });

    if (faltando) {
      alert("Responda todas as perguntas antes de finalizar a prova.");
      return;
    }

    const res = await fetch(`/api/aluno/provas/tentativas/${tentativaId}/finalizar`, {
      method: "POST",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data?.error ?? "Erro ao finalizar prova.");
      return;
    }

    // nota vem do backend (objetivas). discursivas ficam pendentes de correção se existirem.
    const notaFinalBackend = Number(data?.nota ?? 0);

    // normaliza para 0..10 caso seu backend use soma de valores
    // se você já definiu notaMaxima=10 e valor por questão soma até 10, mantém.
    // se soma passa de 10, você pode ajustar aqui (mas ideal é ajustar no backend).
    const notaFinal = Number(notaFinalBackend.toFixed(1));

    const tempoFinal = Date.now();
    const tempoEmSegundos = Math.floor((tempoFinal - inicioProva) / 1000);

    const aprovado = notaFinal >= NOTA_MINIMA;

    // ✅ mantém compatibilidade com seu painel de notas/certificados
    await salvarNota(disciplinaId, notaFinal, aprovado, tempoEmSegundos, []);

    if (aprovado) gerarCertificado(disciplinaId);

    setResultado({ nota: notaFinal, aprovado, tempo: tempoEmSegundos });
  }

  // ====== UI STATES ======

  if (loading) {
    return (
      <main className="p-8 bg-white text-gray-900 min-h-screen">
        <p>Carregando prova...</p>
      </main>
    );
  }

  if (!prova || questoes.length === 0) {
    return (
      <main className="p-8">
        <p>Prova ainda não disponível.</p>
        <button
          onClick={() => router.push(`/aluno/disciplinas/${disciplinaId}`)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Voltar
        </button>
      </main>
    );
  }

  // ====== RESULTADO + REVISÃO ======
  if (resultado) {
    return (
      <main className="p-8 bg-white text-gray-900 min-h-screen space-y-6">
        <h1 className="text-3xl font-bold">Resultado da Prova</h1>

        <div className="bg-white border rounded-lg p-6 space-y-3">
          <p className="text-xl">
            Nota: <strong>{resultado.nota}</strong>
          </p>

          <p
            className={`text-lg font-semibold ${
              resultado.aprovado ? "text-green-600" : "text-red-600"
            }`}
          >
            {resultado.aprovado ? "Aprovado 🎉" : "Reprovado ❌"}
          </p>

          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold">📋 Revisão da prova</h2>

            {questoes.map((q, index) => {
              if (q.tipo === "DISCURSIVA") {
                const texto = String(respostas[q.id] ?? "");
                return (
                  <div key={q.id} className="border rounded-lg p-4 space-y-2">
                    <p className="font-medium">
                      {index + 1}. {q.enunciado}
                    </p>
                    <p className="text-sm text-gray-600">Questão discursiva (correção do professor).</p>
                    <p>
                      Sua resposta: <strong>{texto || "—"}</strong>
                    </p>
                  </div>
                );
              }

              const escolhidaId = respostas[q.id] as number;
              const altEscolhida = q.alternativas?.find((a) => a.id === escolhidaId);
              const altCorreta = q.alternativas?.find((a) => (a as any).correta === true);

              const acertou = altCorreta && altEscolhida ? altCorreta.id === altEscolhida.id : false;

              return (
                <div key={q.id} className="border rounded-lg p-4 space-y-2">
                  <p className="font-medium">
                    {index + 1}. {q.enunciado}
                  </p>

                  <p>
                    Sua resposta: <strong>{altEscolhida?.texto ?? "—"}</strong>
                  </p>

                  {!acertou && altCorreta && (
                    <p className="text-green-600">Resposta correta: {altCorreta.texto}</p>
                  )}

                  <p className={`font-semibold ${acertou ? "text-green-600" : "text-red-600"}`}>
                    {acertou ? "✔ Acertou" : "❌ Errou"}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-gray-600">
            ⏱ Tempo gasto: {Math.floor(resultado.tempo / 60)} min {resultado.tempo % 60} seg
          </p>

          {resultado.aprovado && (
            <p className="text-green-700 font-medium">🎉 Certificado gerado automaticamente!</p>
          )}
        </div>

        <button
          onClick={() => router.push(`/aluno/disciplinas/${disciplinaId}`)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Voltar para disciplina
        </button>
      </main>
    );
  }

  // ====== PROVA (RESPONDER) ======
  return (
    <main className="p-8 bg-white text-gray-900 min-h-screen space-y-6">
      <h1 className="text-3xl font-bold">📝 {prova.titulo}</h1>

      <div className="space-y-6">
        {questoes.map((q, idx) => (
          <div key={q.id} className="bg-white border rounded-lg p-6 space-y-3">
            <h2 className="font-semibold">
              {idx + 1}. {q.enunciado}
            </h2>

            {q.tipo === "MULTIPLA_ESCOLHA" ? (
              <div className="space-y-2">
                {(q.alternativas ?? []).map((alt) => (
                  <label key={alt.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`questao-${q.id}`}
                      checked={respostas[q.id] === alt.id}
                      onChange={() => responderQuestao(q, alt.id)}
                    />
                    {alt.texto}
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  className="w-full border rounded-lg p-3 min-h-[120px]"
                  placeholder="Digite sua resposta..."
                  value={typeof respostas[q.id] === "string" ? (respostas[q.id] as string) : ""}
                  onChange={(e) => responderQuestao(q, e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Questão discursiva: será corrigida pelo professor.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={finalizarProva}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Finalizar prova
      </button>
    </main>
  );
}