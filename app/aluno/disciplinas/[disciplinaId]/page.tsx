"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAluno } from "@/app/context/AlunoContext";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type AulaApi = {
  id: number;
  titulo: string;
  descricao?: string | null;
  duracaoMin?: number | null;
  ordem?: number | null;
  videoUrl?: string | null;
};

type DisciplinaApi = {
  id: number;
  nome: string;
  descricao?: string | null;
  aulas: AulaApi[];
};

type ProvaPublicadaApi = {
  id: number;
  titulo: string;
  notaMaxima?: number | null;
  tempoMin?: number | null;
  status?: string | null;
  ativa?: boolean;
};

type AuthMeResponse = {
  plano?: string;
  user?: {
    plano?: string;
  };
};

function extrairYouTubeVideoId(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "") || null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.includes("/embed/")) {
        const parts = parsed.pathname.split("/embed/");
        return parts[1]?.split("/")[0]?.split("?")[0] ?? null;
      }

      const watchId = parsed.searchParams.get("v");
      if (watchId) return watchId;
    }

    return null;
  } catch {
    const embedMatch = url.match(/embed\/([^?&/]+)/);
    if (embedMatch?.[1]) return embedMatch[1];

    const watchMatch = url.match(/[?&]v=([^?&/]+)/);
    if (watchMatch?.[1]) return watchMatch[1];

    const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
    if (shortMatch?.[1]) return shortMatch[1];

    return null;
  }
}

function formatarTempo(segundos: number) {
  const total = Math.max(0, Math.floor(segundos));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function DisciplinaAlunoPage() {
  const router = useRouter();
  const params = useParams<{ disciplinaId: string }>();
  const disciplinaId = Number(params.disciplinaId);

  const {
    aulaConcluida,
    marcarAulaComoConcluida,
    progressoDisciplina,
    notas,
  } = useAluno();

  const [loading, setLoading] = useState(true);
const [disciplina, setDisciplina] = useState<DisciplinaApi | null>(null);
const [erroDisciplina, setErroDisciplina] = useState<string | null>(null);
const [aulaAtualId, setAulaAtualId] = useState<number | null>(null);

  const [provaPublicada, setProvaPublicada] =
    useState<ProvaPublicadaApi | null>(null);
  const [loadingProva, setLoadingProva] = useState(true);
  const [plano, setPlano] = useState<string>("ESSENCIAL");
  const [loadingPlano, setLoadingPlano] = useState(true);
  const [tempoAssistidoSegundos, setTempoAssistidoSegundos] = useState(0);
  const [podeConcluir, setPodeConcluir] = useState(false);
  const [youtubePronto, setYoutubePronto] = useState(false);
  const [concluindoAula, setConcluindoAula] = useState(false);

  const playerRef = useRef<any>(null);
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);

  const notaDaDisciplina = useMemo(() => {
    return notas.find(
      (n: any) => String(n.disciplinaId) === String(disciplinaId)
    );
  }, [notas, disciplinaId]);

  useEffect(() => {
    let mounted = true;

    async function carregar() {
      if (!Number.isFinite(disciplinaId) || disciplinaId <= 0) {
        if (mounted) {
          setDisciplina(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setErroDisciplina(null);

      try {
        const res = await fetch(`/api/disciplina/${disciplinaId}`, {
          credentials: "include",
        });

        const data = await res.json();

        if (!mounted) return;

        if (!res.ok) {
          setDisciplina(null);
          setErroDisciplina(data?.error || "Não foi possível carregar a disciplina.");
          setLoading(false);
          return;
}

        setDisciplina(data);

        const aulasOrdenadas = (data?.aulas ?? []).slice().sort(
          (a: AulaApi, b: AulaApi) => {
            const ao = a.ordem ?? 999999;
            const bo = b.ordem ?? 999999;
            if (ao !== bo) return ao - bo;
            return a.id - b.id;
          }
        );

        const primeiraNaoConcluida = aulasOrdenadas.find(
          (a: AulaApi) => !aulaConcluida(disciplinaId, a.id)
        );

        setAulaAtualId((primeiraNaoConcluida ?? aulasOrdenadas[0])?.id ?? null);
      } catch (error: any) {
  console.error("ERRO AO CARREGAR DISCIPLINA:", error);
  if (!mounted) return;
  setDisciplina(null);
  setErroDisciplina("Erro ao carregar disciplina.");
} finally {
        if (mounted) setLoading(false);
      }
    }

    carregar();

    return () => {
      mounted = false;
    };
  }, [disciplinaId, aulaConcluida]);

useEffect(() => {
  let mounted = true;

  async function carregarPlano() {
    try {
      setLoadingPlano(true);

      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      const data: AuthMeResponse = await res.json();

      if (!mounted) return;

      const planoRecebido =
        data?.plano || data?.user?.plano || "ESSENCIAL";

      setPlano(planoRecebido);
    } catch {
      if (!mounted) return;
      setPlano("ESSENCIAL");
    } finally {
      if (mounted) setLoadingPlano(false);
    }
  }

  carregarPlano();

  return () => {
    mounted = false;
  };
}, []);

  useEffect(() => {
    let mounted = true;

    async function carregarProvaPublicada() {
      if (!Number.isFinite(disciplinaId) || disciplinaId <= 0) {
        if (mounted) {
          setProvaPublicada(null);
          setLoadingProva(false);
        }
        return;
      }

      setLoadingProva(true);

      try {
        const res = await fetch(`/api/aluno/provas/disciplinas/${disciplinaId}`, {
          credentials: "include",
        });

        const data = await res.json();

        if (!mounted) return;

        if (!res.ok) {
          setProvaPublicada(null);
          setLoadingProva(false);
          return;
        }

        setProvaPublicada(data ?? null);
      } catch (error) {
        console.error("ERRO AO CARREGAR PROVA PUBLICADA:", error);
        if (!mounted) return;
        setProvaPublicada(null);
      } finally {
        if (mounted) setLoadingProva(false);
      }
    }

    carregarProvaPublicada();

    return () => {
      mounted = false;
    };
  }, [disciplinaId]);

  const aulasOrdenadas = useMemo(() => {
    const list = disciplina?.aulas ?? [];
    return list.slice().sort((a, b) => {
      const ao = a.ordem ?? 999999;
      const bo = b.ordem ?? 999999;
      if (ao !== bo) return ao - bo;
      return a.id - b.id;
    });
  }, [disciplina]);

  const aulaAtual = useMemo(() => {
    return aulasOrdenadas.find((a) => a.id === aulaAtualId) ?? null;
  }, [aulasOrdenadas, aulaAtualId]);

  const totalAulas = aulasOrdenadas.length;
  const progresso = progressoDisciplina(disciplinaId, totalAulas);
  const concluida = aulaAtual ? aulaConcluida(disciplinaId, aulaAtual.id) : false;

  const tempoMinimoSegundos = (aulaAtual?.duracaoMin ?? 0) * 60;

  const porcentagemAssistida =
    tempoMinimoSegundos > 0
      ? Math.min(100, Math.round((tempoAssistidoSegundos / tempoMinimoSegundos) * 100))
      : 100;

  function pararContagem() {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
  }

  function iniciarContagem() {
    if (intervaloRef.current || concluida) return;

    intervaloRef.current = setInterval(() => {
      setTempoAssistidoSegundos((prev) => {
        if (tempoMinimoSegundos > 0 && prev >= tempoMinimoSegundos) {
          pararContagem();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  }

  async function concluirAulaAtual() {
    if (!aulaAtual || concluindoAula) return;

    if (!podeConcluir && !concluida) {
      alert("Você ainda não assistiu o tempo mínimo desta aula.");
      return;
    }

    try {
      setConcluindoAula(true);

      await marcarAulaComoConcluida({
        disciplinaId,
        aulaId: aulaAtual.id,
        tempoAssistidoSegundos,
        tempoMinimoSegundos,
      });

      const proxima = aulasOrdenadas.find(
        (a) => !aulaConcluida(disciplinaId, a.id) && a.id !== aulaAtual.id
      );

      if (proxima) setAulaAtualId(proxima.id);
    } catch (error: any) {
      alert(error?.message || "Não foi possível concluir a aula.");
    } finally {
      setConcluindoAula(false);
    }
  }

  useEffect(() => {
    if (concluida) {
      setPodeConcluir(true);
      return;
    }

    if (!aulaAtual?.videoUrl) {
      setPodeConcluir(true);
      return;
    }

    if (tempoMinimoSegundos <= 0) {
      setPodeConcluir(true);
      return;
    }

    setPodeConcluir(tempoAssistidoSegundos >= tempoMinimoSegundos);
  }, [tempoAssistidoSegundos, tempoMinimoSegundos, aulaAtual?.videoUrl, concluida]);

  useEffect(() => {
    if (window.YT?.Player) {
      setYoutubePronto(true);
      return;
    }

    const scriptExistente = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (scriptExistente) {
      const esperarYT = setInterval(() => {
        if (window.YT?.Player) {
          setYoutubePronto(true);
          clearInterval(esperarYT);
        }
      }, 300);

      return () => clearInterval(esperarYT);
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      setYoutubePronto(true);
    };
  }, []);

  useEffect(() => {
    pararContagem();

    if (playerRef.current?.destroy) {
      try {
        playerRef.current.destroy();
      } catch (error) {
        console.error("ERRO AO DESTRUIR PLAYER:", error);
      }
      playerRef.current = null;
    }

    setTempoAssistidoSegundos(0);

    if (!aulaAtual?.videoUrl) return;
    if (!youtubePronto) return;

    const videoId = extrairYouTubeVideoId(aulaAtual.videoUrl);
    if (!videoId) return;

    const criarPlayer = () => {
      const container = document.getElementById("youtube-player");
      if (!container || !window.YT?.Player) return;

      playerRef.current = new window.YT.Player("youtube-player", {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: any) => {
            const estado = event.data;

            if (estado === window.YT.PlayerState.PLAYING) {
              iniciarContagem();
            } else {
              pararContagem();
            }
          },
        },
      });
    };

    const timeout = setTimeout(criarPlayer, 100);

    return () => {
      clearTimeout(timeout);
      pararContagem();

      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.error("ERRO AO DESTRUIR PLAYER:", error);
        }
        playerRef.current = null;
      }
    };
  }, [aulaAtual?.id, aulaAtual?.videoUrl, youtubePronto]);

  if (loading) {
    return <div className="p-8">Carregando disciplina...</div>;
  }

  if (!disciplina) {
  return (
    <div className="p-8">
      {erroDisciplina || "Disciplina não encontrada."}
    </div>
  );
}

  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-[360px_1fr]">
      <aside className="border-r bg-white">
        <div className="border-b p-6">
          <h1 className="text-xl font-bold">{disciplina.nome}</h1>

          {disciplina.descricao && (
            <p className="mt-2 text-sm text-gray-600">{disciplina.descricao}</p>
          )}

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
              <span>Progresso</span>
              <span className="font-semibold">{progresso}%</span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-2 bg-blue-600" style={{ width: `${progresso}%` }} />
            </div>

            <p className="mt-2 text-xs text-gray-500">{totalAulas} aulas</p>
          </div>
        </div>

        <div className="space-y-2 p-3">
          {aulasOrdenadas.map((aula, idx) => {
            const done = aulaConcluida(disciplinaId, aula.id);
            const active = aula.id === aulaAtualId;

            return (
              <button
                key={aula.id}
                onClick={() => setAulaAtualId(aula.id)}
                className={[
                  "w-full rounded-xl border p-4 text-left transition",
                  active
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-blue-400",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "mt-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                      done ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700",
                    ].join(" ")}
                  >
                    {done ? "✓" : idx + 1}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold">{aula.titulo}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {aula.duracaoMin ? `${aula.duracaoMin} min` : "—"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-2 border-t p-3">
          <button
            onClick={() => router.push(`/aluno/disciplinas/${disciplinaId}/atividades`)}
            className="w-full rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Atividades
          </button>

          {loadingPlano ? (
  <button
    disabled
    className="w-full cursor-not-allowed rounded-xl bg-gray-300 px-4 py-2 text-white"
  >
    Carregando plano...
  </button>
) : plano === "ESSENCIAL" ? (
  <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
    Provas disponíveis apenas nos planos Profissional e Enterprise.
  </div>
) : loadingProva ? (
  <button
    disabled
    className="w-full cursor-not-allowed rounded-xl bg-gray-300 px-4 py-2 text-white"
  >
    Carregando prova...
  </button>
) : !provaPublicada ? (
  <button
    disabled
    className="w-full cursor-not-allowed rounded-xl bg-gray-400 px-4 py-2 text-white"
  >
    Prova indisponível
  </button>
) : progresso === 100 ? (
  <button
    onClick={() =>
      router.push(
        `/aluno/disciplinas/${disciplinaId}/prova/${provaPublicada.id}`
      )
    }
    className="w-full rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700"
  >
    Fazer prova
  </button>
) : (
  <button
    disabled
    className="w-full cursor-not-allowed rounded-xl bg-gray-400 px-4 py-2 text-white"
  >
    Prova bloqueada — conclua todas as aulas
  </button>
)}
        </div>
      </aside>

      <main className="bg-gray-50">
        <div className="max-w-5xl p-6 lg:p-10">
          {notaDaDisciplina && (
            <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">📊 Resultado Final</h2>
              <p className="text-2xl font-bold">Nota: {notaDaDisciplina.nota}</p>
              <p
                className={`mt-2 font-semibold ${
                  notaDaDisciplina.aprovado ? "text-green-600" : "text-red-600"
                }`}
              >
                {notaDaDisciplina.aprovado ? "Aprovado 🎉" : "Reprovado ❌"}
              </p>
            </div>
          )}

          {aulaAtual ? (
            <>
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-bold">{aulaAtual.titulo}</h2>

                    {aulaAtual.descricao && (
                      <p className="mt-3 text-gray-600">{aulaAtual.descricao}</p>
                    )}

                    <div className="mt-4 max-w-md">
                      <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                        <span>Tempo assistido</span>
                        <span className="font-semibold">
                          {formatarTempo(tempoAssistidoSegundos)} /{" "}
                          {formatarTempo(tempoMinimoSegundos)}
                        </span>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-2 bg-blue-600 transition-all"
                          style={{ width: `${porcentagemAssistida}%` }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        {concluida
                          ? "Aula já concluída."
                          : aulaAtual.videoUrl
                          ? `Assista pelo menos ${aulaAtual.duracaoMin ?? 0} minuto(s) para liberar a conclusão.`
                          : "Esta aula não possui vídeo. A conclusão está liberada."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={concluirAulaAtual}
                    disabled={concluida || !podeConcluir || concluindoAula}
                    className={[
                      "rounded-xl px-4 py-2 font-semibold transition",
                      concluida
                        ? "cursor-not-allowed bg-green-600 text-white opacity-90"
                        : podeConcluir
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "cursor-not-allowed bg-gray-400 text-white opacity-90",
                    ].join(" ")}
                  >
                    {concluida
                      ? "✅ Concluída"
                      : concluindoAula
                      ? "Salvando..."
                      : podeConcluir
                      ? "Marcar como concluída"
                      : `Assista ${aulaAtual.duracaoMin ?? 0} min para concluir`}
                  </button>
                </div>

                <div className="mt-6">
                  {aulaAtual.videoUrl ? (
                    <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black">
                      <div id="youtube-player" className="h-full w-full" />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-xl border bg-gray-100 text-gray-600">
                      (player de vídeo aqui)
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  className="rounded-xl border bg-white px-4 py-2 transition hover:border-blue-400"
                  onClick={() => {
                    const idx = aulasOrdenadas.findIndex((a) => a.id === aulaAtual.id);
                    const prev = aulasOrdenadas[idx - 1];
                    if (prev) setAulaAtualId(prev.id);
                  }}
                >
                  ← Aula anterior
                </button>

                <button
                  className="rounded-xl border bg-white px-4 py-2 transition hover:border-blue-400"
                  onClick={() => {
                    const idx = aulasOrdenadas.findIndex((a) => a.id === aulaAtual.id);
                    const next = aulasOrdenadas[idx + 1];
                    if (next) setAulaAtualId(next.id);
                  }}
                >
                  Próxima aula →
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border bg-white p-6">
              Nenhuma aula encontrada.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}