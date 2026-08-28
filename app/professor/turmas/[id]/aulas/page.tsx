"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useTranslations } from "next-intl";

type TurmaApi = {
  id: number;
  nome: string;
  semestre?: string | null;
  disciplina?: {
    id: number;
    nome: string;
  } | null;
};

type AulaApi = {
  id: number;
  titulo: string;
  descricao?: string | null;
  duracaoMin?: number | null;
  ordem?: number | null;
  videoUrl?: string | null;
};

type FeedbackTipo =
  | "sucesso"
  | "erro"
  | "";

type RegistroJson = Record<
  string,
  unknown
>;

function isRecord(
  value: unknown
): value is RegistroJson {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

async function lerJson(
  response: Response
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function mensagemDaApi(
  data: unknown
) {
  if (
    isRecord(data) &&
    typeof data.error ===
      "string" &&
    data.error.trim()
  ) {
    return data.error;
  }

  return "";
}

function numeroPositivo(
  value: unknown
) {
  const numero = Number(value);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

function normalizarTurma(
  value: unknown
): TurmaApi | null {
  if (!isRecord(value)) {
    return null;
  }

  const id =
    numeroPositivo(value.id);

  if (!id) {
    return null;
  }

  const disciplinaRaw =
    isRecord(value.disciplina)
      ? value.disciplina
      : null;

  const disciplinaId =
    numeroPositivo(
      disciplinaRaw?.id
    ) ??
    numeroPositivo(
      value.disciplinaId
    ) ??
    numeroPositivo(
      disciplinaRaw?.disciplinaId
    );

  const disciplinaNome =
    typeof disciplinaRaw?.nome ===
    "string"
      ? disciplinaRaw.nome
      : typeof value.disciplinaNome ===
          "string"
        ? value.disciplinaNome
        : "";

  return {
    id,

    nome:
      typeof value.nome ===
      "string"
        ? value.nome
        : "",

    semestre:
      typeof value.semestre ===
      "string"
        ? value.semestre
        : null,

    disciplina:
      disciplinaId
        ? {
            id:
              disciplinaId,
            nome:
              disciplinaNome,
          }
        : null,
  };
}

function normalizarAula(
  value: unknown
): AulaApi | null {
  if (!isRecord(value)) {
    return null;
  }

  const id =
    numeroPositivo(value.id);

  if (!id) {
    return null;
  }

  return {
    id,

    titulo:
      typeof value.titulo ===
      "string"
        ? value.titulo
        : "",

    descricao:
      typeof value.descricao ===
      "string"
        ? value.descricao
        : null,

    duracaoMin:
      typeof value.duracaoMin ===
        "number"
        ? value.duracaoMin
        : value.duracaoMin !==
              null &&
            value.duracaoMin !==
              undefined &&
            Number.isFinite(
              Number(
                value.duracaoMin
              )
            )
          ? Number(
              value.duracaoMin
            )
          : null,

    ordem:
      typeof value.ordem ===
        "number"
        ? value.ordem
        : value.ordem !==
              null &&
            value.ordem !==
              undefined &&
            Number.isFinite(
              Number(value.ordem)
            )
          ? Number(
              value.ordem
            )
          : null,

    videoUrl:
      typeof value.videoUrl ===
      "string"
        ? value.videoUrl
        : null,
  };
}

function normalizarUrlAula(
  valor: string
) {
  const texto =
    valor.trim();

  if (!texto) {
    return null;
  }

  try {
    const url =
      new URL(texto);

    if (
      url.protocol !==
        "http:" &&
      url.protocol !==
        "https:"
    ) {
      return null;
    }

    const hostname =
      url.hostname
        .toLowerCase()
        .replace(
          /^www\./,
          ""
        );

    let youtubeId = "";

    if (
      hostname ===
      "youtu.be"
    ) {
      youtubeId =
        url.pathname
          .split("/")
          .filter(Boolean)[0] ||
        "";
    }

    if (
      hostname ===
        "youtube.com" ||
      hostname ===
        "m.youtube.com" ||
      hostname ===
        "youtube-nocookie.com"
    ) {
      if (
        url.pathname ===
        "/watch"
      ) {
        youtubeId =
          url.searchParams.get(
            "v"
          ) || "";
      } else {
        const partes =
          url.pathname
            .split("/")
            .filter(Boolean);

        if (
          [
            "embed",
            "shorts",
            "live",
          ].includes(
            partes[0] || ""
          )
        ) {
          youtubeId =
            partes[1] || "";
        }
      }
    }

    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}`;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function urlParaAbrir(
  valor: string
) {
  try {
    const url =
      new URL(valor);

    const hostname =
      url.hostname
        .toLowerCase()
        .replace(
          /^www\./,
          ""
        );

    const partes =
      url.pathname
        .split("/")
        .filter(Boolean);

    if (
      (
        hostname ===
          "youtube.com" ||
        hostname ===
          "m.youtube.com" ||
        hostname ===
          "youtube-nocookie.com"
      ) &&
      partes[0] ===
        "embed" &&
      partes[1]
    ) {
      return `https://www.youtube.com/watch?v=${partes[1]}`;
    }

    return valor;
  } catch {
    return valor;
  }
}

export default function AulasDaTurmaPage() {
  const router =
    useRouter();

  const params =
    useParams<{
      id: string;
    }>();

  const searchParams =
    useSearchParams();

  const t = useTranslations(
    "ProfessorClassLessons"
  );

  const turmaIdTexto =
    String(
      params?.id || ""
    ).trim();

  const turmaId =
    /^\d+$/.test(
      turmaIdTexto
    )
      ? Number(
          turmaIdTexto
        )
      : 0;

  const disciplinaIdTexto =
    (
      searchParams.get(
        "disciplinaId"
      ) || ""
    ).trim();

  const disciplinaId =
    /^\d+$/.test(
      disciplinaIdTexto
    )
      ? Number(
          disciplinaIdTexto
        )
      : 0;

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    erroCarregamento,
    setErroCarregamento,
  ] = useState("");

  const [
    turma,
    setTurma,
  ] = useState<TurmaApi | null>(
    null
  );

  const [
    disciplinasDisponiveis,
    setDisciplinasDisponiveis,
  ] = useState<
    Array<{
      id: number;
      nome: string;
    }>
  >([]);

  const [
    aulas,
    setAulas,
  ] = useState<AulaApi[]>(
    []
  );

  const [
    titulo,
    setTitulo,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    duracaoMin,
    setDuracaoMin,
  ] = useState("");

  const [
    videoUrl,
    setVideoUrl,
  ] = useState("");

  const [
    feedback,
    setFeedback,
  ] = useState("");

  const [
    feedbackTipo,
    setFeedbackTipo,
  ] = useState<FeedbackTipo>(
    ""
  );

  const [
    aulaParaExcluir,
    setAulaParaExcluir,
  ] = useState<{
    id: number;
    titulo: string;
  } | null>(null);

  const [
    excluindoId,
    setExcluindoId,
  ] = useState<number | null>(
    null
  );

  const [
    aulaEditando,
    setAulaEditando,
  ] = useState<AulaApi | null>(
    null
  );

  const [
    editTitulo,
    setEditTitulo,
  ] = useState("");

  const [
    editDescricao,
    setEditDescricao,
  ] = useState("");

  const [
    editDuracaoMin,
    setEditDuracaoMin,
  ] = useState("");

  const [
    editVideoUrl,
    setEditVideoUrl,
  ] = useState("");

  const [
    salvandoEdicao,
    setSalvandoEdicao,
  ] = useState(false);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setFeedback("");
          setFeedbackTipo("");
        },
        3500
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [feedback]);

  function mostrarFeedback(
    tipo: Exclude<
      FeedbackTipo,
      ""
    >,
    mensagem: string
  ) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

  const carregarDados =
    useCallback(
      async () => {
        if (
          !Number.isInteger(
            turmaId
          ) ||
          turmaId <= 0
        ) {
          setTurma(null);
          setAulas([]);

          setErroCarregamento(
            t(
              "feedback.invalidClass"
            )
          );

          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setErroCarregamento("");

          const resTurmas =
            await fetch(
              "/api/professor/turmas",
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const turmasData =
            await lerJson(
              resTurmas
            );

          if (
            !resTurmas.ok
          ) {
            throw new Error(
              mensagemDaApi(
                turmasData
              ) ||
                t(
                  "feedback.loadClassesError"
                )
            );
          }

          const listaRaw =
            Array.isArray(
              turmasData
            )
              ? turmasData
              : isRecord(
                    turmasData
                  ) &&
                  Array.isArray(
                    turmasData.turmas
                  )
                ? turmasData.turmas
                : null;

          if (!listaRaw) {
            throw new Error(
              t(
                "feedback.invalidClassesResponse"
              )
            );
          }

          const listaTurmas =
            listaRaw
              .map(
                normalizarTurma
              )
              .filter(
                (
                  item
                ): item is TurmaApi =>
                  Boolean(item)
              );

          const candidatas =
            listaTurmas.filter(
              (item) =>
                item.id ===
                turmaId
            );

          if (
            candidatas.length ===
            0
          ) {
            throw new Error(
              t(
                "feedback.classNotFound"
              )
            );
          }

          const turmaBase =
            candidatas[0];

          setTurma(
            turmaBase
          );

          const mapaDisciplinas =
            new Map<
              number,
              string
            >();

          for (
            const item of
            candidatas
          ) {
            if (
              item.disciplina
                ?.id
            ) {
              const nome =
                item.disciplina.nome?.trim() ||
                t(
                  "discipline.fallbackWithId",
                  {
                    id:
                      item
                        .disciplina
                        .id,
                  }
                );

              mapaDisciplinas.set(
                item.disciplina.id,
                nome
              );
            }
          }

          const disciplinas =
            Array.from(
              mapaDisciplinas.entries()
            )
              .map(
                ([
                  id,
                  nome,
                ]) => ({
                  id,
                  nome,
                })
              )
              .sort((a, b) =>
                a.nome.localeCompare(
                  b.nome
                )
              );

          setDisciplinasDisponiveis(
            disciplinas
          );

          if (
            !Number.isInteger(
              disciplinaId
            ) ||
            disciplinaId <= 0
          ) {
            setAulas([]);
            return;
          }

          const turmaEncontrada =
            candidatas.find(
              (item) =>
                item.disciplina
                  ?.id ===
                disciplinaId
            );

          if (
            !turmaEncontrada
          ) {
            throw new Error(
              t(
                "feedback.disciplineNotFound"
              )
            );
          }

          setTurma(
            turmaEncontrada
          );

          const resAulas =
            await fetch(
              `/api/professor/turmas/${turmaId}/aulas?disciplinaId=${disciplinaId}`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const aulasData =
            await lerJson(
              resAulas
            );

          if (
            !resAulas.ok
          ) {
            throw new Error(
              mensagemDaApi(
                aulasData
              ) ||
                t(
                  "feedback.loadLessonsError"
                )
            );
          }

          if (
            !Array.isArray(
              aulasData
            )
          ) {
            throw new Error(
              t(
                "feedback.invalidLessonsResponse"
              )
            );
          }

          setAulas(
            aulasData
              .map(
                normalizarAula
              )
              .filter(
                (
                  item
                ): item is AulaApi =>
                  Boolean(item)
              )
          );
        } catch (
          error: unknown
        ) {
          setAulas([]);

          setErroCarregamento(
            error instanceof Error
              ? error.message
              : t(
                  "feedback.loadPageError"
                )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        disciplinaId,
        turmaId,
        t,
      ]
    );

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  function selecionarDisciplina(
    id: number
  ) {
    router.replace(
      `/professor/turmas/${turmaId}/aulas?disciplinaId=${id}`
    );
  }

  function abrirEdicao(
    aula: AulaApi
  ) {
    setAulaEditando(aula);

    setEditTitulo(
      aula.titulo || ""
    );

    setEditDescricao(
      aula.descricao || ""
    );

    setEditDuracaoMin(
      aula.duracaoMin !==
          null &&
        aula.duracaoMin !==
          undefined
        ? String(
            aula.duracaoMin
          )
        : ""
    );

    setEditVideoUrl(
      aula.videoUrl || ""
    );
  }

  async function salvarEdicaoAula(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !aulaEditando ||
      salvandoEdicao
    ) {
      return;
    }

    const tituloLimpo =
      editTitulo.trim();

    if (!tituloLimpo) {
      mostrarFeedback(
        "erro",
        t(
          "validation.titleRequired"
        )
      );
      return;
    }

    let duracao:
      | number
      | null = null;

    if (
      editDuracaoMin.trim()
    ) {
      duracao =
        Number(
          editDuracaoMin
        );

      if (
        !Number.isFinite(
          duracao
        ) ||
        duracao <= 0
      ) {
        mostrarFeedback(
          "erro",
          t(
            "validation.invalidDuration"
          )
        );
        return;
      }
    }

    let urlNormalizada:
      | string
      | null = null;

    if (
      editVideoUrl.trim()
    ) {
      urlNormalizada =
        normalizarUrlAula(
          editVideoUrl
        );

      if (!urlNormalizada) {
        mostrarFeedback(
          "erro",
          t(
            "validation.invalidUrl"
          )
        );
        return;
      }
    }

    try {
      setSalvandoEdicao(
        true
      );

      const res =
        await fetch(
          `/api/professor/aulas/${aulaEditando.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body: JSON.stringify(
              {
                titulo:
                  tituloLimpo,

                descricao:
                  editDescricao.trim(),

                duracaoMin:
                  duracao,

                videoUrl:
                  urlNormalizada,
              }
            ),
          }
        );

      const data =
        await lerJson(res);

      if (!res.ok) {
        throw new Error(
          mensagemDaApi(
            data
          ) ||
            t(
              "feedback.editError"
            )
        );
      }

      setAulaEditando(
        null
      );

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.editSuccess"
        )
      );

      await carregarDados();
    } catch (
      error: unknown
    ) {
      mostrarFeedback(
        "erro",
        error instanceof Error
          ? error.message
          : t(
              "feedback.editError"
            )
      );
    } finally {
      setSalvandoEdicao(
        false
      );
    }
  }

  async function excluirAulaConfirmada() {
    if (
      !aulaParaExcluir ||
      excluindoId !== null
    ) {
      return;
    }

    try {
      setExcluindoId(
        aulaParaExcluir.id
      );

      const res =
        await fetch(
          `/api/professor/aulas/${aulaParaExcluir.id}`,
          {
            method: "DELETE",
            credentials:
              "include",
          }
        );

      const data =
        await lerJson(res);

      if (!res.ok) {
        throw new Error(
          mensagemDaApi(
            data
          ) ||
            t(
              "feedback.deleteError"
            )
        );
      }

      setAulaParaExcluir(
        null
      );

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.deleteSuccess"
        )
      );

      await carregarDados();
    } catch (
      error: unknown
    ) {
      mostrarFeedback(
        "erro",
        error instanceof Error
          ? error.message
          : t(
              "feedback.deleteError"
            )
      );
    } finally {
      setExcluindoId(
        null
      );
    }
  }

  async function handleCriarAula(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !Number.isInteger(
        turmaId
      ) ||
      turmaId <= 0
    ) {
      mostrarFeedback(
        "erro",
        t(
          "feedback.invalidClass"
        )
      );
      return;
    }

    if (
      !Number.isInteger(
        disciplinaId
      ) ||
      disciplinaId <= 0
    ) {
      mostrarFeedback(
        "erro",
        t(
          "feedback.invalidDiscipline"
        )
      );
      return;
    }

    const tituloLimpo =
      titulo.trim();

    if (!tituloLimpo) {
      mostrarFeedback(
        "erro",
        t(
          "validation.titleRequired"
        )
      );
      return;
    }

    let duracao:
      | number
      | null = null;

    if (
      duracaoMin.trim()
    ) {
      duracao =
        Number(
          duracaoMin
        );

      if (
        !Number.isFinite(
          duracao
        ) ||
        duracao <= 0
      ) {
        mostrarFeedback(
          "erro",
          t(
            "validation.invalidDuration"
          )
        );
        return;
      }
    }

    let urlNormalizada:
      | string
      | null = null;

    if (
      videoUrl.trim()
    ) {
      urlNormalizada =
        normalizarUrlAula(
          videoUrl
        );

      if (!urlNormalizada) {
        mostrarFeedback(
          "erro",
          t(
            "validation.invalidUrl"
          )
        );
        return;
      }
    }

    try {
      setSaving(true);

      const res =
        await fetch(
          `/api/professor/turmas/${turmaId}/aulas`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body: JSON.stringify(
              {
                titulo:
                  tituloLimpo,

                descricao:
                  descricao.trim(),

                duracaoMin:
                  duracao,

                videoUrl:
                  urlNormalizada,

                disciplinaId,
              }
            ),
          }
        );

      const data =
        await lerJson(res);

      if (!res.ok) {
        throw new Error(
          mensagemDaApi(
            data
          ) ||
            t(
              "feedback.createError"
            )
        );
      }

      setTitulo("");
      setDescricao("");
      setDuracaoMin("");
      setVideoUrl("");

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.createSuccess"
        )
      );

      await carregarDados();
    } catch (
      error: unknown
    ) {
      mostrarFeedback(
        "erro",
        error instanceof Error
          ? error.message
          : t(
              "feedback.createError"
            )
      );
    } finally {
      setSaving(false);
    }
  }

  const aulasOrdenadas =
    useMemo(() => {
      return [...aulas].sort(
        (a, b) => {
          const ao =
            a.ordem ??
            999999;

          const bo =
            b.ordem ??
            999999;

          if (ao !== bo) {
            return ao - bo;
          }

          return a.id - b.id;
        }
      );
    }, [aulas]);

  const disciplinaAtual =
    disciplinaId > 0
      ? disciplinasDisponiveis.find(
          (item) =>
            item.id ===
            disciplinaId
        )
      : undefined;

  if (loading) {
    return (
      <main className="p-6 text-slate-900 dark:text-slate-100 md:p-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {t("loading")}
        </div>
      </main>
    );
  }

  if (
    erroCarregamento
  ) {
    return (
      <main className="p-6 text-slate-900 dark:text-slate-100 md:p-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {t(
              "actions.back"
            )}
          </button>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900 dark:bg-red-950/40">
            <h1 className="font-black text-red-800 dark:text-red-200">
              {t(
                "errorTitle"
              )}
            </h1>

            <p className="mt-2 text-sm leading-6 text-red-700 dark:text-red-300">
              {
                erroCarregamento
              }
            </p>

            <button
              type="button"
              onClick={() =>
                void carregarDados()
              }
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              {t(
                "actions.retry"
              )}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!turma) {
    return (
      <main className="p-6 text-slate-900 dark:text-slate-100 md:p-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          {t(
            "feedback.classNotFound"
          )}
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="p-6 text-slate-900 dark:text-slate-100 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {feedback && (
            <div
              role="status"
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${
                feedbackTipo ===
                "sucesso"
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              }`}
            >
              {feedback}
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
          >
            {t(
              "actions.back"
            )}
          </button>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
              {t("eyebrow")}
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
              {t("title")}
            </h1>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 px-4 py-2 dark:bg-slate-950">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  {t(
                    "fields.class"
                  )}
                  :
                </span>{" "}
                <strong className="text-slate-900 dark:text-white">
                  {turma.nome ||
                    t(
                      "classFallback",
                      {
                        id:
                          turma.id,
                      }
                    )}
                </strong>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-2 dark:bg-slate-950">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  {t(
                    "fields.discipline"
                  )}
                  :
                </span>{" "}
                <strong className="text-slate-900 dark:text-white">
                  {disciplinaAtual
                    ?.nome ||
                    t(
                      "discipline.notSelected"
                    )}
                </strong>
              </div>
            </div>
          </section>

          {disciplinaId <=
          0 ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {t(
                  "discipline.title"
                )}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t(
                  "discipline.description"
                )}
              </p>

              {disciplinasDisponiveis.length ===
              0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  {t(
                    "discipline.empty"
                  )}
                </div>
              ) : (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {disciplinasDisponiveis.map(
                    (
                      disciplina
                    ) => (
                      <button
                        key={
                          disciplina.id
                        }
                        type="button"
                        onClick={() =>
                          selecionarDisciplina(
                            disciplina.id
                          )
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
                      >
                        <p className="font-bold text-slate-900 dark:text-white">
                          {
                            disciplina.nome
                          }
                        </p>

                        <p className="mt-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {t(
                            "discipline.open"
                          )}
                        </p>
                      </button>
                    )
                  )}
                </div>
              )}
            </section>
          ) : (
            <>
              <form
                onSubmit={
                  handleCriarAula
                }
                className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
                    {t(
                      "newLesson.eyebrow"
                    )}
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                    {t(
                      "newLesson.title"
                    )}
                  </h2>
                </div>

                <div>
                  <label
                    htmlFor="nova-aula-titulo"
                    className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t(
                      "fields.lessonTitle"
                    )}
                  </label>

                  <input
                    id="nova-aula-titulo"
                    value={titulo}
                    onChange={(
                      event
                    ) =>
                      setTitulo(
                        event
                          .target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder={t(
                      "placeholders.title"
                    )}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="nova-aula-descricao"
                    className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t(
                      "fields.description"
                    )}
                  </label>

                  <textarea
                    id="nova-aula-descricao"
                    value={
                      descricao
                    }
                    onChange={(
                      event
                    ) =>
                      setDescricao(
                        event
                          .target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    rows={4}
                    placeholder={t(
                      "placeholders.description"
                    )}
                  />
                </div>

                <div>
                  <label
                    htmlFor="nova-aula-duracao"
                    className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t(
                      "fields.duration"
                    )}
                  </label>

                  <input
                    id="nova-aula-duracao"
                    type="number"
                    min="1"
                    value={
                      duracaoMin
                    }
                    onChange={(
                      event
                    ) =>
                      setDuracaoMin(
                        event
                          .target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder={t(
                      "placeholders.duration"
                    )}
                  />
                </div>

                <div>
                  <label
                    htmlFor="nova-aula-url"
                    className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t(
                      "fields.lessonUrl"
                    )}
                  </label>

                  <input
                    id="nova-aula-url"
                    value={
                      videoUrl
                    }
                    onChange={(
                      event
                    ) =>
                      setVideoUrl(
                        event
                          .target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder={t(
                      "placeholders.url"
                    )}
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {t(
                      "newLesson.urlHelp"
                    )}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? t(
                        "actions.saving"
                      )
                    : t(
                        "actions.addLesson"
                      )}
                </button>
              </form>

              <section className="space-y-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {t(
                      "lessons.title"
                    )}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t(
                      "lessons.description"
                    )}
                  </p>
                </div>

                {aulasOrdenadas.length ===
                0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {t(
                        "lessons.emptyTitle"
                      )}
                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {t(
                        "lessons.emptyDescription"
                      )}
                    </p>
                  </div>
                ) : (
                  aulasOrdenadas.map(
                    (aula) => (
                      <article
                        key={
                          aula.id
                        }
                        className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <h3 className="font-black text-slate-900 dark:text-white">
                              {typeof aula.ordem ===
                                "number" &&
                              aula.ordem >
                                0
                                ? `${aula.ordem}. `
                                : ""}
                              {
                                aula.titulo
                              }
                            </h3>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {aula.duracaoMin
                                ? t(
                                    "lessons.duration",
                                    {
                                      minutes:
                                        aula.duracaoMin,
                                    }
                                  )
                                : t(
                                    "lessons.noDuration"
                                  )}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                abrirEdicao(
                                  aula
                                )
                              }
                              className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-600"
                            >
                              {t(
                                "actions.edit"
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/professor/turmas/${turmaId}/aulas/${aula.id}/presencas`
                                )
                              }
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                            >
                              {t(
                                "actions.attendance"
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/professor/aulas/${aula.id}/materiais/novo`
                                )
                              }
                              className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
                            >
                              {t(
                                "actions.materials"
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setAulaParaExcluir(
                                  {
                                    id:
                                      aula.id,
                                    titulo:
                                      aula.titulo,
                                  }
                                )
                              }
                              disabled={
                                excluindoId ===
                                aula.id
                              }
                              className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {excluindoId ===
                              aula.id
                                ? t(
                                    "actions.deleting"
                                  )
                                : t(
                                    "actions.delete"
                                  )}
                            </button>
                          </div>
                        </div>

                        {aula.descricao && (
                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {
                              aula.descricao
                            }
                          </p>
                        )}

                        {aula.videoUrl && (
                          <a
                            href={urlParaAbrir(
                              aula.videoUrl
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex text-sm font-bold text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {t(
                              "actions.openLesson"
                            )}
                          </a>
                        )}

                        <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                          {t(
                            "lessons.materialsHelp"
                          )}
                        </div>
                      </article>
                    )
                  )
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {aulaEditando && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={
              salvarEdicaoAula
            }
            className="w-full max-w-2xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {t(
                  "edit.title"
                )}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setAulaEditando(
                    null
                  )
                }
                aria-label={t(
                  "actions.close"
                )}
                className="rounded-full px-3 py-1 text-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div>
              <label
                htmlFor="editar-aula-titulo"
                className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                {t(
                  "fields.lessonTitle"
                )}
              </label>

              <input
                id="editar-aula-titulo"
                value={editTitulo}
                onChange={(
                  event
                ) =>
                  setEditTitulo(
                    event.target
                      .value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                required
              />
            </div>

            <div>
              <label
                htmlFor="editar-aula-descricao"
                className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                {t(
                  "fields.description"
                )}
              </label>

              <textarea
                id="editar-aula-descricao"
                value={
                  editDescricao
                }
                onChange={(
                  event
                ) =>
                  setEditDescricao(
                    event.target
                      .value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                rows={4}
              />
            </div>

            <div>
              <label
                htmlFor="editar-aula-duracao"
                className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                {t(
                  "fields.duration"
                )}
              </label>

              <input
                id="editar-aula-duracao"
                type="number"
                min="1"
                value={
                  editDuracaoMin
                }
                onChange={(
                  event
                ) =>
                  setEditDuracaoMin(
                    event.target
                      .value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="editar-aula-url"
                className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                {t(
                  "fields.lessonUrl"
                )}
              </label>

              <input
                id="editar-aula-url"
                value={
                  editVideoUrl
                }
                onChange={(
                  event
                ) =>
                  setEditVideoUrl(
                    event.target
                      .value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setAulaEditando(
                    null
                  )
                }
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t(
                  "actions.cancel"
                )}
              </button>

              <button
                type="submit"
                disabled={
                  salvandoEdicao
                }
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvandoEdicao
                  ? t(
                      "actions.saving"
                    )
                  : t(
                      "actions.saveChanges"
                    )}
              </button>
            </div>
          </form>
        </div>
      )}

      {aulaParaExcluir && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-xl dark:bg-red-950"
              >
                🗑️
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {t(
                    "deleteModal.title"
                  )}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t(
                    "deleteModal.description",
                    {
                      title:
                        aulaParaExcluir.titulo,
                    }
                  )}
                </p>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {t(
                    "deleteModal.warning"
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setAulaParaExcluir(
                    null
                  )
                }
                disabled={
                  excluindoId ===
                  aulaParaExcluir.id
                }
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t(
                  "actions.cancel"
                )}
              </button>

              <button
                type="button"
                onClick={
                  excluirAulaConfirmada
                }
                disabled={
                  excluindoId ===
                  aulaParaExcluir.id
                }
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindoId ===
                aulaParaExcluir.id
                  ? t(
                      "actions.deleting"
                    )
                  : t(
                      "actions.confirmDelete"
                    )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}