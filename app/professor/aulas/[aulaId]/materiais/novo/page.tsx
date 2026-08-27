"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type ArquivoUpload = {
  url: string;
  downloadUrl?: string;
  pathname?: string;
  contentType?: string;
};

type MaterialAula = {
  id: number;
  tipo: string;
  titulo: string;
  url?: string | null;
  arquivoNome?: string | null;
  mimeType?: string | null;
  tamanho?: number | null;
  createdAt?: string;
};

type TipoFormulario =
  | "arquivo"
  | "pdf"
  | "doc"
  | "ppt"
  | "link"
  | "video";

export default function NovoMaterialAulaPage() {
  const params = useParams();
  const router = useRouter();

  const t = useTranslations(
    "ProfessorLessonMaterials"
  );

  const locale = useLocale();

  const inputArquivoRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const aulaId = Number(
    params?.aulaId || 0
  );

  const aulaValida =
    Number.isFinite(aulaId) &&
    aulaId > 0;

  const [
    materiais,
    setMateriais,
  ] = useState<MaterialAula[]>(
    []
  );

  const [
    carregandoMateriais,
    setCarregandoMateriais,
  ] = useState(true);

  const [
    titulo,
    setTitulo,
  ] = useState("");

  const [
    tipo,
    setTipo,
  ] =
    useState<TipoFormulario>(
      "arquivo"
    );

  const [
    urlExterna,
    setUrlExterna,
  ] = useState("");

  const [
    arquivo,
    setArquivo,
  ] = useState<File | null>(
    null
  );

  const [
    arquivoEnviado,
    setArquivoEnviado,
  ] =
    useState<ArquivoUpload | null>(
      null
    );

  const [
    uploadingArquivo,
    setUploadingArquivo,
  ] = useState(false);

  const [
    progressoUpload,
    setProgressoUpload,
  ] = useState(0);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    materialEditando,
    setMaterialEditando,
  ] =
    useState<MaterialAula | null>(
      null
    );

  const [
    editTitulo,
    setEditTitulo,
  ] = useState("");

  const [
    editUrl,
    setEditUrl,
  ] = useState("");

  const [
    salvandoEdicao,
    setSalvandoEdicao,
  ] = useState(false);

  const [
    materialExcluir,
    setMaterialExcluir,
  ] =
    useState<MaterialAula | null>(
      null
    );

  const [
    excluindo,
    setExcluindo,
  ] = useState(false);

  const precisaArquivo =
    tipo === "arquivo" ||
    tipo === "pdf" ||
    tipo === "doc" ||
    tipo === "ppt";

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

  useEffect(() => {
    if (!mensagem) {
      return;
    }

    const timer =
      setTimeout(() => {
        setMensagem("");
      }, 3500);

    return () =>
      clearTimeout(timer);
  }, [mensagem]);

  function iconeMaterial(
    tipoMaterial?: string
  ) {
    const valor = String(
      tipoMaterial || ""
    ).toUpperCase();

    if (valor === "PDF") {
      return "📄";
    }

    if (valor === "VIDEO") {
      return "🎥";
    }

    if (valor === "LINK") {
      return "🔗";
    }

    if (valor === "DOC") {
      return "📝";
    }

    if (valor === "PPT") {
      return "📊";
    }

    return "📁";
  }

  function labelTipoMaterial(
    tipoMaterial?: string
  ) {
    const valor = String(
      tipoMaterial || ""
    ).toUpperCase();

    if (valor === "PDF") {
      return t(
        "materialTypes.pdf"
      );
    }

    if (valor === "VIDEO") {
      return t(
        "materialTypes.video"
      );
    }

    if (valor === "LINK") {
      return t(
        "materialTypes.link"
      );
    }

    if (valor === "DOC") {
      return t(
        "materialTypes.document"
      );
    }

    if (valor === "PPT") {
      return t(
        "materialTypes.presentation"
      );
    }

    return t(
      "materialTypes.file"
    );
  }

  function tipoParaApi(
    tipoSelecionado: TipoFormulario
  ) {
    if (
      tipoSelecionado ===
      "pdf"
    ) {
      return "PDF";
    }

    if (
      tipoSelecionado ===
      "doc"
    ) {
      return "DOC";
    }

    if (
      tipoSelecionado ===
      "ppt"
    ) {
      return "PPT";
    }

    if (
      tipoSelecionado ===
      "link"
    ) {
      return "LINK";
    }

    if (
      tipoSelecionado ===
      "video"
    ) {
      return "VIDEO";
    }

    return "ARQUIVO";
  }

  function acceptDoTipo() {
    if (tipo === "pdf") {
      return ".pdf";
    }

    if (tipo === "doc") {
      return ".doc,.docx";
    }

    if (tipo === "ppt") {
      return ".ppt,.pptx";
    }

    return ".pdf,.ppt,.pptx,.mp4,.mov,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.zip,.rar,.mp3,.wav";
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

  const carregarMateriais =
    useCallback(
      async () => {
        if (!aulaValida) {
          setMateriais([]);
          setErro(
            t(
              "feedback.invalidLesson"
            )
          );
          setCarregandoMateriais(
            false
          );
          return;
        }

        try {
          setCarregandoMateriais(
            true
          );
          setErro("");

          const res =
            await fetch(
              `/api/professor/aulas/${aulaId}/materiais`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          if (!res.ok) {
            throw new Error(
              t(
                "feedback.loadError"
              )
            );
          }

          const json =
            await res.json();

          if (
            !Array.isArray(
              json
            )
          ) {
            throw new Error(
              t(
                "feedback.invalidResponse"
              )
            );
          }

          setMateriais(
            json as MaterialAula[]
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

          setErro(
            mensagemErro
          );

          setMateriais([]);
        } finally {
          setCarregandoMateriais(
            false
          );
        }
      },
      [
        aulaId,
        aulaValida,
        t,
      ]
    );

  useEffect(() => {
    void carregarMateriais();
  }, [carregarMateriais]);

  function limparNovoMaterial() {
    setTitulo("");
    setTipo("arquivo");
    setUrlExterna("");
    setArquivo(null);
    setArquivoEnviado(null);
    setProgressoUpload(0);

    if (
      inputArquivoRef.current
    ) {
      inputArquivoRef.current.value =
        "";
    }
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

    if (!aulaValida) {
      setErro(
        t(
          "feedback.invalidLesson"
        )
      );
      return;
    }

    try {
      setUploadingArquivo(
        true
      );

      setProgressoUpload(10);
      setErro("");
      setMensagem("");

      const formData =
        new FormData();

      formData.append(
        "file",
        arquivo
      );

      const res = await fetch(
        "/api/upload",
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

      const url =
        json?.url ||
        json?.arquivo?.url;

      if (!url) {
        throw new Error(
          t(
            "feedback.uploadNoUrl"
          )
        );
      }

      setProgressoUpload(
        100
      );

      setArquivoEnviado({
        url: String(url),

        downloadUrl:
          String(url),

        pathname:
          arquivo.name,

        contentType:
          arquivo.type,
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

      setProgressoUpload(
        0
      );
    } finally {
      setUploadingArquivo(
        false
      );
    }
  }

  async function handleSalvarMaterial(
    e: FormEvent
  ) {
    e.preventDefault();

    setErro("");
    setMensagem("");

    if (!aulaValida) {
      setErro(
        t(
          "feedback.invalidLesson"
        )
      );
      return;
    }

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

    try {
      setSalvando(true);

      let body:
        | {
            titulo: string;
            tipo: string;
            url: string;
          }
        | {
            titulo: string;
            tipo: string;
            url: string;
            arquivoNome: string;
            mimeType: string;
            tamanho: number;
          };

      if (
        tipo === "link" ||
        tipo === "video"
      ) {
        const urlNormalizada =
          urlExterna.trim();

        if (!urlNormalizada) {
          throw new Error(
            tipo === "video"
              ? t(
                  "validation.videoUrlRequired"
                )
              : t(
                  "validation.linkUrlRequired"
                )
          );
        }

        if (
          !urlValida(
            urlNormalizada
          )
        ) {
          throw new Error(
            t(
              "validation.invalidUrl"
            )
          );
        }

        body = {
          titulo:
            tituloNormalizado,

          tipo:
            tipoParaApi(
              tipo
            ),

          url:
            urlNormalizada,
        };
      } else {
        if (
          !arquivo ||
          !arquivoEnviado?.url
        ) {
          throw new Error(
            t(
              "validation.uploadBeforeSave"
            )
          );
        }

        body = {
          titulo:
            tituloNormalizado,

          tipo:
            tipoParaApi(
              tipo
            ),

          url:
            arquivoEnviado.url,

          arquivoNome:
            arquivo.name,

          mimeType:
            arquivo.type ||
            arquivoEnviado.contentType ||
            "",

          tamanho:
            arquivo.size,
        };
      }

      const res =
        await fetch(
          `/api/professor/aulas/${aulaId}/materiais`,
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              body
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

      limparNovoMaterial();

      setMensagem(
        t(
          "feedback.createSuccess"
        )
      );

      await carregarMateriais();
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

  function abrirEdicao(
    material: MaterialAula
  ) {
    setMaterialEditando(
      material
    );

    setEditTitulo(
      material.titulo || ""
    );

    setEditUrl(
      material.url || ""
    );

    setErro("");
    setMensagem("");
  }

  async function salvarEdicaoMaterial(
    e: FormEvent
  ) {
    e.preventDefault();

    if (
      !aulaValida ||
      !materialEditando
    ) {
      return;
    }

    const tituloNormalizado =
      editTitulo.trim();

    const urlNormalizada =
      editUrl.trim();

    if (!tituloNormalizado) {
      setErro(
        t(
          "validation.titleRequired"
        )
      );
      return;
    }

    if (!urlNormalizada) {
      setErro(
        t(
          "validation.urlRequired"
        )
      );
      return;
    }

    if (
      !urlValida(
        urlNormalizada
      )
    ) {
      setErro(
        t(
          "validation.invalidUrl"
        )
      );
      return;
    }

    try {
      setSalvandoEdicao(
        true
      );

      setErro("");
      setMensagem("");

      const res =
        await fetch(
          `/api/professor/aulas/${aulaId}/materiais`,
          {
            method: "PUT",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                materialId:
                  materialEditando.id,

                titulo:
                  tituloNormalizado,

                url:
                  urlNormalizada,
              }
            ),
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.editError"
          )
        );
      }

      setMaterialEditando(
        null
      );

      setMensagem(
        t(
          "feedback.editSuccess"
        )
      );

      await carregarMateriais();
    } catch (
      error: unknown
    ) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : t(
              "feedback.editError"
            );

      setErro(
        mensagemErro
      );
    } finally {
      setSalvandoEdicao(
        false
      );
    }
  }

  async function excluirMaterialConfirmado() {
    if (
      !aulaValida ||
      !materialExcluir
    ) {
      return;
    }

    try {
      setExcluindo(true);
      setErro("");
      setMensagem("");

      const res =
        await fetch(
          `/api/professor/aulas/${aulaId}/materiais`,
          {
            method: "DELETE",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                materialId:
                  materialExcluir.id,
              }
            ),
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.deleteError"
          )
        );
      }

      setMaterialExcluir(
        null
      );

      setMensagem(
        t(
          "feedback.deleteSuccess"
        )
      );

      await carregarMateriais();
    } catch (
      error: unknown
    ) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : t(
              "feedback.deleteError"
            );

      setErro(
        mensagemErro
      );
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="phanyx-professor-materiais-aula p-6 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="inline-block text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {t("back")}
          </button>

          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "description"
            )}
          </p>
        </div>

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

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                {t(
                  "library.eyebrow"
                )}
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                {t(
                  "library.title"
                )}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "library.description"
                )}
              </p>
            </div>

            <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              {t(
                "library.count",
                {
                  count:
                    materiais.length,
                }
              )}
            </span>
          </div>

          {carregandoMateriais ? (
            <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
              {t(
                "library.loading"
              )}
            </p>
          ) : materiais.length ===
            0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-950">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-900">
                📚
              </div>

              <p className="mt-4 font-bold text-slate-800 dark:text-slate-100">
                {t(
                  "library.emptyTitle"
                )}
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  "library.emptyDescription"
                )}
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {materiais.map(
                (
                  material
                ) => (
                  <div
                    key={
                      material.id
                    }
                    className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-950/50">
                          {iconeMaterial(
                            material.tipo
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-base font-black text-slate-950 dark:text-white">
                            {
                              material.titulo
                            }
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {labelTipoMaterial(
                                material.tipo
                              )}
                            </span>

                            {material.arquivoNome && (
                              <span className="max-w-[360px] truncate">
                                {
                                  material.arquivoNome
                                }
                              </span>
                            )}
                          </div>

                          {material.url && (
                            <p className="mt-2 max-w-xl truncate text-xs text-slate-400 dark:text-slate-500">
                              {t(
                                "library.secureStorage"
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                        {material.url && (
                          <a
                            href={
                              material.url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                          >
                            {t(
                              "actions.open"
                            )}
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            abrirEdicao(
                              material
                            )
                          }
                          className="rounded-2xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600"
                        >
                          {t(
                            "actions.edit"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setMaterialExcluir(
                              material
                            )
                          }
                          className="rounded-2xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
                        >
                          {t(
                            "actions.delete"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <form
          onSubmit={
            handleSalvarMaterial
          }
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t(
              "newMaterial.title"
            )}
          </h2>

          <div className="space-y-2">
            <label
              htmlFor="material-titulo"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {t(
                "fields.title"
              )}
            </label>

            <input
              id="material-titulo"
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
              htmlFor="material-tipo"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {t(
                "fields.type"
              )}
            </label>

            <select
              id="material-tipo"
              value={tipo}
              onChange={(e) => {
                setTipo(
                  e.target
                    .value as TipoFormulario
                );

                setErro("");
                setMensagem("");
                setArquivo(null);
                setArquivoEnviado(
                  null
                );
                setUrlExterna("");
                setProgressoUpload(
                  0
                );

                if (
                  inputArquivoRef.current
                ) {
                  inputArquivoRef.current.value =
                    "";
                }
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="arquivo">
                {t(
                  "materialTypes.file"
                )}
              </option>

              <option value="pdf">
                {t(
                  "materialTypes.pdf"
                )}
              </option>

              <option value="doc">
                {t(
                  "materialTypes.document"
                )}
              </option>

              <option value="ppt">
                {t(
                  "materialTypes.presentation"
                )}
              </option>

              <option value="link">
                {t(
                  "materialTypes.link"
                )}
              </option>

              <option value="video">
                {t(
                  "materialTypes.video"
                )}
              </option>
            </select>
          </div>

          {precisaArquivo ? (
            <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t(
                    "upload.title"
                  )}
                </h3>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t(
                    "upload.description"
                  )}
                </p>
              </div>

              <input
                ref={
                  inputArquivoRef
                }
                type="file"
                accept={acceptDoTipo()}
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

                  setProgressoUpload(
                    0
                  );
                }}
                className="hidden"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    inputArquivoRef.current?.click()
                  }
                  disabled={
                    uploadingArquivo
                  }
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t(
                    "upload.select"
                  )}
                </button>

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
                        "upload.uploading"
                      )
                    : t(
                        "upload.send"
                      )}
                </button>
              </div>

              <div className="phanyx-upload-arquivo-status rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                {arquivo
                  ? t(
                      "upload.selected",
                      {
                        name:
                          arquivo.name,
                      }
                    )
                  : t(
                      "upload.noneSelected"
                    )}
              </div>

              {uploadingArquivo && (
                <div className="space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-2 bg-blue-600 transition-all"
                      style={{
                        width: `${progressoUpload}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t(
                      "upload.progress",
                      {
                        progress:
                          progressoUpload,
                      }
                    )}
                  </p>
                </div>
              )}

              {arquivoEnviado && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300">
                  <p>
                    <strong>
                      {t(
                        "upload.success"
                      )}
                    </strong>
                  </p>

                  {arquivo && (
                    <p className="mt-1">
                      {t(
                        "upload.fileInfo",
                        {
                          name:
                            arquivo.name,

                          size:
                            formatadorNumero.format(
                              arquivo.size
                            ),
                        }
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label
                htmlFor="material-url"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {t(
                  "fields.url"
                )}
              </label>

              <input
                id="material-url"
                value={
                  urlExterna
                }
                onChange={(e) =>
                  setUrlExterna(
                    e.target.value
                  )
                }
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                placeholder={
                  tipo === "video"
                    ? t(
                        "fields.videoUrlPlaceholder"
                      )
                    : t(
                        "fields.urlPlaceholder"
                      )
                }
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                salvando ||
                uploadingArquivo
              }
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando
                ? t(
                    "actions.saving"
                  )
                : t(
                    "actions.save"
                  )}
            </button>
          </div>
        </form>
      </div>

      {materialEditando && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={
              salvarEdicaoMaterial
            }
            className="w-full max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t(
                  "editModal.title"
                )}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setMaterialEditando(
                    null
                  )
                }
                disabled={
                  salvandoEdicao
                }
                aria-label={t(
                  "editModal.close"
                )}
                className="rounded-full px-3 py-1 text-xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                ×
              </button>
            </div>

            <div>
              <label
                htmlFor="edit-material-titulo"
                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {t(
                  "fields.title"
                )}
              </label>

              <input
                id="edit-material-titulo"
                value={
                  editTitulo
                }
                onChange={(e) =>
                  setEditTitulo(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                required
              />
            </div>

            <div>
              <label
                htmlFor="edit-material-url"
                className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {t(
                  "fields.url"
                )}
              </label>

              <input
                id="edit-material-url"
                value={editUrl}
                onChange={(e) =>
                  setEditUrl(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setMaterialEditando(
                    null
                  )
                }
                disabled={
                  salvandoEdicao
                }
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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
                className="rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
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

      {materialExcluir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t(
                "deleteModal.title"
              )}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t(
                "deleteModal.message",
                {
                  title:
                    materialExcluir.titulo,
                }
              )}
            </p>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t(
                "deleteModal.warning"
              )}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setMaterialExcluir(
                    null
                  )
                }
                disabled={
                  excluindo
                }
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t(
                  "actions.cancel"
                )}
              </button>

              <button
                type="button"
                onClick={
                  excluirMaterialConfirmado
                }
                disabled={
                  excluindo
                }
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
    </div>
  );
}