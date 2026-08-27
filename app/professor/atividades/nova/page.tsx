"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type Turma = {
  id: number;
  nome?: string | null;
  disciplinaId?: number | null;
  turmaDisciplinaId?: number | null;
  disciplina?: {
    id: number;
    nome?: string | null;
  } | null;
};

type ArquivoUpload = {
  key: string;
  url: string;
  nomeOriginal: string;
  mimeType: string;
  tamanho: number;
};

export default function NovaAtividadeProfessorPage() {
  const t = useTranslations(
    "ProfessorNewActivity"
  );

  const locale = useLocale();

  const [
    titulo,
    setTitulo,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    prazo,
    setPrazo,
  ] = useState("");

  const [
    notaMaxima,
    setNotaMaxima,
  ] = useState("10");

  const [
    turmaId,
    setTurmaId,
  ] = useState("");

  const [
    disciplinaId,
    setDisciplinaId,
  ] = useState("");

  const [
    turmaDisciplinaSelecionada,
    setTurmaDisciplinaSelecionada,
  ] = useState("");

  const [
    turmas,
    setTurmas,
  ] = useState<Turma[]>([]);

  const [
    arquivo,
    setArquivo,
  ] = useState<File | null>(
    null
  );

  const [
    uploadingArquivo,
    setUploadingArquivo,
  ] = useState(false);

  const [
    arquivoEnviado,
    setArquivoEnviado,
  ] =
    useState<ArquivoUpload | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    erroCarregamento,
    setErroCarregamento,
  ] = useState("");

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    atividadeCriadaId,
    setAtividadeCriadaId,
  ] = useState<number | null>(
    null
  );

  const [
    modalPublicar,
    setModalPublicar,
  ] = useState(false);

  const [
    publicando,
    setPublicando,
  ] = useState(false);

  const formatadorNumero =
    useMemo(
      () =>
        new Intl.NumberFormat(
          locale,
          {
            maximumFractionDigits: 0,
          }
        ),
      [locale]
    );

  const carregarDados =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setErroCarregamento(
            ""
          );

          const turmasRes =
            await fetch(
              "/api/professor/turmas",
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          if (!turmasRes.ok) {
            throw new Error(
              t(
                "feedback.classesLoadError"
              )
            );
          }

          const turmasJson =
            await turmasRes.json();

          if (
            !Array.isArray(
              turmasJson
            )
          ) {
            throw new Error(
              t(
                "feedback.classesInvalidResponse"
              )
            );
          }

          setTurmas(
            turmasJson as Turma[]
          );
        } catch (
          error: unknown
        ) {
          const mensagemErro =
            error instanceof Error
              ? error.message
              : t(
                  "feedback.loadError"
                );

          setTurmas([]);

          setErroCarregamento(
            mensagemErro
          );
        } finally {
          setLoading(false);
        }
      },
      [t]
    );

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  function limparFormulario() {
    setTitulo("");
    setDescricao("");
    setPrazo("");
    setNotaMaxima("10");
    setTurmaId("");
    setDisciplinaId("");
    setTurmaDisciplinaSelecionada(
      ""
    );
    setArquivo(null);
    setArquivoEnviado(null);
  }

  async function handleUploadArquivo() {
    if (!arquivo) {
      setErro(
        t(
          "validation.fileRequired"
        )
      );
      return;
    }

    try {
      setUploadingArquivo(
        true
      );

      setErro("");
      setMensagem("");

      const formData =
        new FormData();

      formData.append(
        "file",
        arquivo
      );

      const res = await fetch(
        "/api/professor/atividades/upload-anexo",
        {
          method: "POST",
          credentials:
            "include",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.uploadError"
          )
        );
      }

      const json =
        await res.json();

      if (
        !json ||
        typeof json !==
          "object" ||
        !json.key ||
        !json.url
      ) {
        throw new Error(
          t(
            "feedback.uploadInvalidResponse"
          )
        );
      }

      setArquivoEnviado({
        key: String(
          json.key
        ),

        nomeOriginal: String(
          json.nomeOriginal ||
            arquivo.name
        ),

        mimeType: String(
          json.mimeType || ""
        ),

        tamanho: Number(
          json.tamanho || 0
        ),

        url: String(
          json.url
        ),
      });

      setMensagem(
        t(
          "feedback.uploadSuccess"
        )
      );
    } catch (
      error: unknown
    ) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : t(
              "feedback.uploadError"
            );

      setErro(
        mensagemErro
      );
    } finally {
      setUploadingArquivo(
        false
      );
    }
  }

  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setErro("");
    setMensagem("");

    const tituloNormalizado =
      titulo.trim();

    if (!tituloNormalizado) {
      setErro(
        t(
          "validation.titleRequired"
        )
      );
      return;
    }

    if (!turmaId) {
      setErro(
        t(
          "validation.classRequired"
        )
      );
      return;
    }

    if (!disciplinaId) {
      setErro(
        t(
          "validation.subjectRequired"
        )
      );
      return;
    }

    const notaNumerica =
      Number(notaMaxima);

    if (
      !Number.isFinite(
        notaNumerica
      ) ||
      notaNumerica <= 0
    ) {
      setErro(
        t(
          "validation.invalidMaximumGrade"
        )
      );
      return;
    }

    if (prazo) {
      const dataPrazo =
        new Date(prazo);

      if (
        Number.isNaN(
          dataPrazo.getTime()
        )
      ) {
        setErro(
          t(
            "validation.invalidDeadline"
          )
        );
        return;
      }
    }

    try {
      setSalvando(true);

      const res =
        await fetch(
          "/api/professor/atividades",
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
                  tituloNormalizado,

                descricao:
                  descricao.trim(),

                prazo: prazo
                  ? new Date(
                      prazo
                    ).toISOString()
                  : "",

                notaMaxima,

                turmaId,

                disciplinaId,

                anexo:
                  arquivoEnviado
                    ? {
                        nomeOriginal:
                          arquivoEnviado.nomeOriginal,

                        key:
                          arquivoEnviado.key,

                        url:
                          arquivoEnviado.url,

                        mimeType:
                          arquivoEnviado.mimeType,

                        tamanho:
                          arquivoEnviado.tamanho,
                      }
                    : null,
              }
            ),
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.createError"
          )
        );
      }

      const json =
        await res.json();

      if (
        !json?.id
      ) {
        throw new Error(
          t(
            "feedback.createInvalidResponse"
          )
        );
      }

      setAtividadeCriadaId(
        Number(json.id)
      );

      setModalPublicar(
        true
      );

      setMensagem(
        arquivoEnviado
          ? t(
              "feedback.createWithAttachmentSuccess"
            )
          : t(
              "feedback.createSuccess"
            )
      );

      limparFormulario();
    } catch (
      error: unknown
    ) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : t(
              "feedback.createError"
            );

      setErro(
        mensagemErro
      );
    } finally {
      setSalvando(false);
    }
  }

  async function publicarAtividadeAgora() {
    if (
      !atividadeCriadaId
    ) {
      return;
    }

    try {
      setPublicando(true);
      setErro("");

      const res =
        await fetch(
          `/api/professor/atividades/${atividadeCriadaId}`,
          {
            method: "PUT",
            credentials:
              "include",
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.publishError"
          )
        );
      }

      setMensagem(
        t(
          "feedback.publishSuccess"
        )
      );

      setModalPublicar(
        false
      );

      setAtividadeCriadaId(
        null
      );
    } catch (
      error: unknown
    ) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : t(
              "feedback.publishError"
            );

      setErro(
        mensagemErro
      );
    } finally {
      setPublicando(false);
    }
  }

  return (
    <div className="phanyx-professor-nova-atividade p-6 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <Link
            href="/professor/atividades"
            className="inline-block text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {t("back")}
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "description"
            )}
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {t("loading")}
          </div>
        )}

        {!loading &&
          erroCarregamento && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-800 dark:bg-red-950/40">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {
                  erroCarregamento
                }
              </p>

              <button
                type="button"
                onClick={() =>
                  void carregarDados()
                }
                className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                {t(
                  "actions.retry"
                )}
              </button>
            </div>
          )}

        {!loading &&
          !erroCarregamento && (
            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {mensagem && (
                <div
                  aria-live="polite"
                  className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
                >
                  {mensagem}
                </div>
              )}

              {erro && (
                <div
                  aria-live="assertive"
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                >
                  {erro}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="titulo-atividade"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {t(
                    "fields.title"
                  )}
                </label>

                <input
                  id="titulo-atividade"
                  value={titulo}
                  onChange={(e) =>
                    setTitulo(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                  placeholder={t(
                    "fields.titlePlaceholder"
                  )}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="descricao-atividade"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {t(
                    "fields.description"
                  )}
                </label>

                <textarea
                  id="descricao-atividade"
                  value={
                    descricao
                  }
                  onChange={(e) =>
                    setDescricao(
                      e.target.value
                    )
                  }
                  rows={6}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                  placeholder={t(
                    "fields.descriptionPlaceholder"
                  )}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="turma-atividade"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {t(
                    "fields.class"
                  )}
                </label>

                <select
                  id="turma-atividade"
                  value={
                    turmaDisciplinaSelecionada
                  }
                  onChange={(e) => {
                    const valor =
                      e.target
                        .value;

                    const [
                      turma,
                      disciplina,
                    ] =
                      valor.split(
                        ":"
                      );

                    setTurmaDisciplinaSelecionada(
                      valor
                    );

                    setTurmaId(
                      turma || ""
                    );

                    setDisciplinaId(
                      disciplina ||
                        ""
                    );
                  }}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">
                    {t(
                      "fields.classPlaceholder"
                    )}
                  </option>

                  {turmas.map(
                    (turma) => {
                      const disciplinaDaTurma =
                        turma
                          .disciplina
                          ?.id ||
                        turma.disciplinaId ||
                        null;

                      const nomeTurma =
                        turma.nome ||
                        t(
                          "classFallback",
                          {
                            id:
                              turma.id,
                          }
                        );

                      return (
                        <option
                          key={`${turma.id}-${disciplinaDaTurma}`}
                          value={`${turma.id}:${
                            disciplinaDaTurma ||
                            ""
                          }`}
                        >
                          {
                            nomeTurma
                          }
                          {turma
                            .disciplina
                            ?.nome
                            ? ` — ${turma.disciplina.nome}`
                            : ""}
                        </option>
                      );
                    }
                  )}
                </select>

                {turmas.length ===
                  0 && (
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t(
                      "classesEmpty"
                    )}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="prazo-atividade"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    {t(
                      "fields.deadline"
                    )}
                  </label>

                  <input
                    id="prazo-atividade"
                    type="datetime-local"
                    value={
                      prazo
                    }
                    onChange={(e) =>
                      setPrazo(
                        e.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="nota-maxima-atividade"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    {t(
                      "fields.maximumGrade"
                    )}
                  </label>

                  <input
                    id="nota-maxima-atividade"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={
                      notaMaxima
                    }
                    onChange={(e) =>
                      setNotaMaxima(
                        e.target
                          .value
                      )
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t(
                      "attachment.title"
                    )}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t(
                      "attachment.description"
                    )}
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                  {t(
                    "attachment.select"
                  )}

                  <input
                    type="file"
                    onChange={(e) => {
                      const file =
                        e.target
                          .files?.[0] ||
                        null;

                      setArquivo(
                        file
                      );

                      setArquivoEnviado(
                        null
                      );

                      setMensagem(
                        ""
                      );

                      setErro("");
                    }}
                    className="hidden"
                  />
                </label>

                {arquivo && (
                  <div className="phanyx-atividade-upload-file rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                    {t(
                      "attachment.selected",
                      {
                        name:
                          arquivo.name,
                      }
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={
                      handleUploadArquivo
                    }
                    disabled={
                      !arquivo ||
                      uploadingArquivo
                    }
                    className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                  >
                    {uploadingArquivo
                      ? t(
                          "attachment.uploading"
                        )
                      : t(
                          "attachment.upload"
                        )}
                  </button>
                </div>

                {arquivoEnviado && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
                    <p>
                      <strong>
                        {t(
                          "attachment.uploaded.file"
                        )}
                      </strong>{" "}
                      {
                        arquivoEnviado.nomeOriginal
                      }
                    </p>

                    <p>
                      <strong>
                        {t(
                          "attachment.uploaded.type"
                        )}
                      </strong>{" "}
                      {
                        arquivoEnviado.mimeType
                      }
                    </p>

                    <p>
                      <strong>
                        {t(
                          "attachment.uploaded.size"
                        )}
                      </strong>{" "}
                      {formatadorNumero.format(
                        arquivoEnviado.tamanho
                      )}{" "}
                      {t(
                        "attachment.bytes"
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    salvando ||
                    uploadingArquivo ||
                    turmas.length ===
                      0
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {salvando
                    ? t(
                        "actions.saving"
                      )
                    : t(
                        "actions.create"
                      )}
                </button>
              </div>
            </form>
          )}
      </div>

      {modalPublicar && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl dark:bg-blue-950/50">
                📢
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {t(
                    "publishModal.title"
                  )}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t(
                    "publishModal.description"
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalPublicar(
                    false
                  );

                  setAtividadeCriadaId(
                    null
                  );
                }}
                disabled={
                  publicando
                }
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {t(
                  "publishModal.keepDraft"
                )}
              </button>

              <button
                type="button"
                onClick={
                  publicarAtividadeAgora
                }
                disabled={
                  publicando
                }
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {publicando
                  ? t(
                      "publishModal.publishing"
                    )
                  : t(
                      "publishModal.publishNow"
                    )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}