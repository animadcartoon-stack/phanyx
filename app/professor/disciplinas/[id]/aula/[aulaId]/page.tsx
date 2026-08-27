"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { useTranslations } from "next-intl";
import { useProfessor } from "@/app/context/ProfessorContext";

type FeedbackTipo =
  | "sucesso"
  | "erro"
  | "";

export default function AulaProfessorPage() {
  const router = useRouter();
  const params = useParams();

  const t = useTranslations(
    "ProfessorDisciplineLessonDetail"
  );

  const inputArquivoRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const disciplinaId = String(
    params?.id || ""
  );

  const aulaId = String(
    params?.aulaId || ""
  );

  const {
    disciplinas,
    editarAula,
    excluirAula,
    adicionarMaterial,
  } = useProfessor();

  const disciplina =
    disciplinas.find(
      (item) =>
        String(item.id) ===
        disciplinaId
    );

  const aula =
    disciplina?.aulas.find(
      (item) =>
        String(item.id) ===
        aulaId
    );

  const [
    modoEdicao,
    setModoEdicao,
  ] = useState(false);

  const [
    titulo,
    setTitulo,
  ] = useState("");

  const [
    video,
    setVideo,
  ] = useState("");

  const [
    arquivo,
    setArquivo,
  ] = useState<File | null>(
    null
  );

  const [
    enviandoArquivo,
    setEnviandoArquivo,
  ] = useState(false);

  const [
    salvandoEdicao,
    setSalvandoEdicao,
  ] = useState(false);

  const [
    modalExclusao,
    setModalExclusao,
  ] = useState(false);

  const [
    excluindo,
    setExcluindo,
  ] = useState(false);

  const [
    feedback,
    setFeedback,
  ] = useState("");

  const [
    feedbackTipo,
    setFeedbackTipo,
  ] =
    useState<FeedbackTipo>("");

  useEffect(() => {
    if (!aula) {
      return;
    }

    setTitulo(
      aula.titulo || ""
    );

    setVideo(
      aula.video || ""
    );
  }, [
    aula?.id,
    aula?.titulo,
    aula?.video,
  ]);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer =
      setTimeout(() => {
        setFeedback("");
        setFeedbackTipo("");
      }, 3500);

    return () =>
      clearTimeout(timer);
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

  function urlValida(
    valor: string
  ) {
    try {
      const url = new URL(
        valor
      );

      return (
        url.protocol ===
          "http:" ||
        url.protocol ===
          "https:"
      );
    } catch {
      return false;
    }
  }

  function obterUrlEmbed(
    valor: string
  ) {
    const normalizada =
      valor.trim();

    if (!normalizada) {
      return "";
    }

    try {
      const url = new URL(
        normalizada
      );

      const host =
        url.hostname
          .replace(
            /^www\./,
            ""
          )
          .toLowerCase();

      if (
        host === "youtu.be"
      ) {
        const videoId =
          url.pathname
            .split("/")
            .filter(Boolean)[0];

        return videoId
          ? `https://www.youtube.com/embed/${videoId}`
          : normalizada;
      }

      if (
        host ===
          "youtube.com" ||
        host ===
          "m.youtube.com"
      ) {
        if (
          url.pathname ===
          "/watch"
        ) {
          const videoId =
            url.searchParams.get(
              "v"
            );

          return videoId
            ? `https://www.youtube.com/embed/${videoId}`
            : normalizada;
        }

        if (
          url.pathname.startsWith(
            "/embed/"
          )
        ) {
          return normalizada;
        }

        if (
          url.pathname.startsWith(
            "/shorts/"
          )
        ) {
          const videoId =
            url.pathname
              .split("/")
              .filter(Boolean)[1];

          return videoId
            ? `https://www.youtube.com/embed/${videoId}`
            : normalizada;
        }
      }

      return normalizada;
    } catch {
      return "";
    }
  }

  if (
    !disciplina ||
    !aula
  ) {
    return (
      <div className="max-w-4xl p-6 text-slate-900 dark:text-slate-100">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl dark:bg-slate-950">
            🎓
          </div>

          <p className="mt-4 font-bold text-slate-900 dark:text-white">
            {t(
              "notFound.title"
            )}
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "notFound.description"
            )}
          </p>

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {t(
              "actions.back"
            )}
          </button>
        </div>
      </div>
    );
  }

  function salvarEdicao(
    event: FormEvent
  ) {
    event.preventDefault();

    if (salvandoEdicao) {
      return;
    }

    const tituloNormalizado =
      titulo.trim();

    const videoNormalizado =
      video.trim();

    if (!tituloNormalizado) {
      mostrarFeedback(
        "erro",
        t(
          "validation.titleRequired"
        )
      );
      return;
    }

    if (!videoNormalizado) {
      mostrarFeedback(
        "erro",
        t(
          "validation.videoRequired"
        )
      );
      return;
    }

    if (
      !urlValida(
        videoNormalizado
      )
    ) {
      mostrarFeedback(
        "erro",
        t(
          "validation.invalidVideoUrl"
        )
      );
      return;
    }

    try {
      setSalvandoEdicao(
        true
      );

      editarAula(
        disciplinaId,
        aulaId,
        tituloNormalizado,
        videoNormalizado
      );

      setModoEdicao(false);

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.updateSuccess"
        )
      );
    } catch (
      error: unknown
    ) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t(
              "feedback.updateError"
            );

      mostrarFeedback(
        "erro",
        mensagem
      );
    } finally {
      setSalvandoEdicao(
        false
      );
    }
  }

  function cancelarEdicao() {
    setTitulo(
      aula.titulo || ""
    );

    setVideo(
      aula.video || ""
    );

    setModoEdicao(false);
  }

  function confirmarExclusao() {
    if (excluindo) {
      return;
    }

    try {
      setExcluindo(true);

      excluirAula(
        disciplinaId,
        aulaId
      );

      setModalExclusao(
        false
      );

      router.push(
        `/professor/disciplinas/${disciplinaId}`
      );
    } catch (
      error: unknown
    ) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t(
              "feedback.deleteError"
            );

      mostrarFeedback(
        "erro",
        mensagem
      );

      setModalExclusao(
        false
      );

      setExcluindo(false);
    }
  }

  async function handleUpload(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !arquivo ||
      enviandoArquivo
    ) {
      return;
    }

    try {
      setEnviandoArquivo(
        true
      );

      setFeedback("");
      setFeedbackTipo("");

      const resUploadUrl =
        await fetch(
          "/api/professor/upload-url",
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                nomeOriginal:
                  arquivo.name,

                mimeType:
                  arquivo.type ||
                  "application/octet-stream",

                tamanho:
                  arquivo.size,
              }
            ),
          }
        );

      let data: {
        uploadUrl?: string;
        arquivoUrl?: string;
        error?: string;
      } = {};

      try {
        data =
          await resUploadUrl.json();
      } catch {
        data = {};
      }

      if (
        !resUploadUrl.ok
      ) {
        throw new Error(
          data.error ||
            t(
              "feedback.uploadPrepareError"
            )
        );
      }

      if (
        !data.uploadUrl ||
        !data.arquivoUrl
      ) {
        throw new Error(
          t(
            "feedback.invalidUploadResponse"
          )
        );
      }

      const resUploadDireto =
        await fetch(
          data.uploadUrl,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                arquivo.type ||
                "application/octet-stream",
            },

            body: arquivo,
          }
        );

      if (
        !resUploadDireto.ok
      ) {
        throw new Error(
          t(
            "feedback.storageUploadError"
          )
        );
      }

      const dataFinal = {
        nome: arquivo.name,
        url: data.arquivoUrl,
      };

      adicionarMaterial(
        disciplinaId,
        aulaId,
        {
          id: Date.now().toString(),
          nome:
            dataFinal.nome,
          tipo: "arquivo",
          url:
            dataFinal.url,
        }
      );

      setArquivo(null);

      if (
        inputArquivoRef.current
      ) {
        inputArquivoRef.current.value =
          "";
      }

      mostrarFeedback(
        "sucesso",
        t(
          "feedback.uploadSuccess"
        )
      );
    } catch (
      error: unknown
    ) {
      const mensagem =
        error instanceof Error
          ? error.message
          : t(
              "feedback.uploadError"
            );

      mostrarFeedback(
        "erro",
        mensagem
      );
    } finally {
      setEnviandoArquivo(
        false
      );
    }
  }

  const embed =
    obterUrlEmbed(
      aula.video || ""
    );

  const materiais =
    Array.isArray(
      aula.materiais
    )
      ? aula.materiais
      : [];

  return (
    <>
      <div className="max-w-4xl space-y-6 text-slate-900 dark:text-slate-100">
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

        {feedback && (
          <div
            aria-live={
              feedbackTipo ===
              "erro"
                ? "assertive"
                : "polite"
            }
            className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${
              feedbackTipo ===
              "sucesso"
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {feedback}
          </div>
        )}

        {!modoEdicao ? (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
                {t("eyebrow")}
              </p>

              <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {aula.titulo}
              </h1>

              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                {
                  disciplina.nome
                }
              </p>
            </section>

            {embed ? (
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-black shadow-sm dark:border-slate-700">
                <div className="aspect-video w-full">
                  <iframe
                    src={embed}
                    title={t(
                      "video.frameTitle"
                    )}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </section>
            ) : (
              <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  {t(
                    "video.unavailable"
                  )}
                </p>
              </section>
            )}

            <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
                  {t(
                    "materials.eyebrow"
                  )}
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {t(
                    "materials.title"
                  )}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t(
                    "materials.description"
                  )}
                </p>
              </div>

              <form
                onSubmit={
                  handleUpload
                }
                className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950"
              >
                <label
                  htmlFor="material-aula"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  {t(
                    "materials.selectFile"
                  )}
                </label>

                <input
                  ref={
                    inputArquivoRef
                  }
                  id="material-aula"
                  type="file"
                  onChange={(
                    event
                  ) => {
                    setArquivo(
                      event.target
                        .files?.[0] ||
                        null
                    );

                    setFeedback(
                      ""
                    );

                    setFeedbackTipo(
                      ""
                    );
                  }}
                  className="block w-full rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-900 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:file:bg-blue-950/50 dark:file:text-blue-300"
                  required
                />

                {arquivo && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t(
                      "materials.selectedFile",
                      {
                        name:
                          arquivo.name,
                      }
                    )}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    !arquivo ||
                    enviandoArquivo
                  }
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviandoArquivo
                    ? t(
                        "actions.uploading"
                      )
                    : t(
                        "actions.uploadFile"
                      )}
                </button>
              </form>

              {materiais.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  {t(
                    "materials.empty"
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {materiais.map(
                    (material) => (
                      <a
                        key={
                          material.id
                        }
                        href={
                          material.url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-slate-800"
                      >
                        <span>
                          📎
                        </span>

                        <span className="min-w-0 flex-1 truncate">
                          {
                            material.nome
                          }
                        </span>

                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {t(
                            "actions.open"
                          )}
                        </span>
                      </a>
                    )
                  )}
                </div>
              )}
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  setModoEdicao(
                    true
                  )
                }
                className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
              >
                {t(
                  "actions.editLesson"
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setModalExclusao(
                    true
                  )
                }
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                {t(
                  "actions.deleteLesson"
                )}
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={
              salvarEdicao
            }
            className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                {t(
                  "edit.eyebrow"
                )}
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {t(
                  "edit.title"
                )}
              </h2>
            </div>

            <div>
              <label
                htmlFor="editar-aula-titulo"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                {t(
                  "fields.title"
                )}
              </label>

              <input
                id="editar-aula-titulo"
                value={titulo}
                onChange={(
                  event
                ) =>
                  setTitulo(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                required
              />
            </div>

            <div>
              <label
                htmlFor="editar-aula-video"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                {t(
                  "fields.videoUrl"
                )}
              </label>

              <input
                id="editar-aula-video"
                type="url"
                value={video}
                onChange={(
                  event
                ) =>
                  setVideo(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                required
              />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  cancelarEdicao
                }
                disabled={
                  salvandoEdicao
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvandoEdicao
                  ? t(
                      "actions.saving"
                    )
                  : t(
                      "actions.save"
                    )}
              </button>
            </div>
          </form>
        )}
      </div>

      {modalExclusao && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="excluir-aula-titulo"
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-xl dark:bg-red-950/60">
                🗑️
              </div>

              <div className="flex-1">
                <h2
                  id="excluir-aula-titulo"
                  className="text-lg font-bold text-slate-900 dark:text-white"
                >
                  {t(
                    "deleteModal.title"
                  )}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t(
                    "deleteModal.message",
                    {
                      title:
                        aula.titulo,
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
                  setModalExclusao(
                    false
                  )
                }
                disabled={
                  excluindo
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t(
                  "actions.cancel"
                )}
              </button>

              <button
                type="button"
                onClick={
                  confirmarExclusao
                }
                disabled={
                  excluindo
                }
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindo
                  ? t(
                      "actions.deleting"
                    )
                  : t(
                      "deleteModal.confirm"
                    )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}