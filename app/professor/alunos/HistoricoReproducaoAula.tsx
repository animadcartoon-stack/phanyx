"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type SessaoVideoProfessor = {
  id: number;
  iniciadoEm: string;
  ultimoRegistroEm: string;
  encerradoEm?: string | null;

  posicaoInicialSegundos: number;
  posicaoFinalSegundos: number;
  maiorPosicaoSegundos: number;
  tempoReproducaoSegundos: number;

  motivoEncerramento?: string | null;
};

type RespostaHistorico = {
  aulaId: number;
  alunoId: number;
  turmaId: number;
  disciplinaId: number;
  total: number;
  sessoes: SessaoVideoProfessor[];
};

type Props = {
  alunoId: number;
  turmaId: number;
  disciplinaId: number;
  aulaId: number;
  sessoesRegistradas: number;
};

function formatarTempo(
  segundos?: number | null
) {
  const total = Math.max(
    0,
    Math.floor(
      Number(segundos || 0)
    )
  );

  const horas =
    Math.floor(total / 3600);

  const minutos =
    Math.floor(
      (total % 3600) / 60
    );

  const segundosRestantes =
    total % 60;

  if (horas > 0) {
    return [
      horas,
      minutos,
      segundosRestantes,
    ]
      .map((valor) =>
        String(valor).padStart(
          2,
          "0"
        )
      )
      .join(":");
  }

  return [
    minutos,
    segundosRestantes,
  ]
    .map((valor) =>
      String(valor).padStart(
        2,
        "0"
      )
    )
    .join(":");
}

function formatarDataHora(
  valor?: string | null
) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "short",
      timeStyle: "medium",
    }
  ).format(data);
}

export default function HistoricoReproducaoAula({
  alunoId,
  turmaId,
  disciplinaId,
  aulaId,
  sessoesRegistradas,
}: Props) {
  const t = useTranslations(
    "ProfessorStudents"
  );

  const [aberto, setAberto] =
    useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [dados, setDados] =
    useState<RespostaHistorico | null>(
      null
    );

  function motivoLabel(
    motivo?: string | null
  ) {
    switch (
      String(motivo || "")
        .trim()
        .toUpperCase()
    ) {
      case "PAUSA":
        return t(
          "progress.history.reasons.pause"
        );

      case "FIM_VIDEO":
        return t(
          "progress.history.reasons.videoEnd"
        );

      case "TROCA_AULA":
        return t(
          "progress.history.reasons.lessonChange"
        );

      case "SAIDA_PAGINA":
        return t(
          "progress.history.reasons.pageExit"
        );

      case "PERDA_FOCO":
        return t(
          "progress.history.reasons.focusLost"
        );

      case "CONCLUSAO_AULA":
        return t(
          "progress.history.reasons.lessonCompletion"
        );

      case "NOVA_SESSAO":
        return t(
          "progress.history.reasons.newSession"
        );

      default:
        return t(
          "progress.history.reasons.other"
        );
    }
  }

  async function abrirHistorico() {
    if (aberto) {
      setAberto(false);
      return;
    }

    setAberto(true);

    if (
      dados ||
      carregando
    ) {
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const query =
        new URLSearchParams({
          alunoId:
            String(alunoId),
          turmaId:
            String(turmaId),
          disciplinaId:
            String(disciplinaId),
        });

      const res = await fetch(
        `/api/professor/progresso/aulas/${aulaId}/sessoes?${query.toString()}`,
        {
          credentials:
            "include",
          cache:
            "no-store",
        }
      );

      const json =
        await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error ||
            t(
              "progress.history.errorLoad"
            )
        );
      }

      setDados(json);
    } catch (e: any) {
      setErro(
        e?.message ||
          t(
            "progress.history.errorLoad"
          )
      );
    } finally {
      setCarregando(false);
    }
  }

  if (
    sessoesRegistradas <= 0
  ) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => {
          void abrirHistorico();
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-slate-700"
      >
        {aberto
          ? t(
              "progress.history.hide"
            )
          : t(
              "progress.history.show"
            )}

        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] dark:bg-slate-800">
          {sessoesRegistradas}
        </span>
      </button>

      {aberto && (
        <div className="mt-3">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            {t(
              "progress.history.title"
            )}
          </h4>

          {carregando ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t(
                "progress.history.loading"
              )}
            </p>
          ) : erro ? (
            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {erro}
            </div>
          ) : !dados?.sessoes
              .length ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t(
                "progress.history.empty"
              )}
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {dados.sessoes.map(
                (sessao) => (
                  <div
                    key={sessao.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/60"
                  >
                    <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "progress.history.startedAt"
                          )}
                        </p>

                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {formatarDataHora(
                            sessao.iniciadoEm
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "progress.history.endedAt"
                          )}
                        </p>

                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {sessao.encerradoEm
                            ? formatarDataHora(
                                sessao.encerradoEm
                              )
                            : t(
                                "progress.history.open"
                              )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "progress.history.initialPosition"
                          )}
                        </p>

                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {formatarTempo(
                            sessao.posicaoInicialSegundos
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "progress.history.finalPosition"
                          )}
                        </p>

                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {formatarTempo(
                            sessao.posicaoFinalSegundos
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "progress.history.highestPosition"
                          )}
                        </p>

                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {formatarTempo(
                            sessao.maiorPosicaoSegundos
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "progress.history.playbackTime"
                          )}
                        </p>

                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {formatarTempo(
                            sessao.tempoReproducaoSegundos
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "progress.history.ending"
                          )}
                        </p>

                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {sessao.encerradoEm
                            ? motivoLabel(
                                sessao.motivoEncerramento
                              )
                            : t(
                                "progress.history.open"
                              )}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
