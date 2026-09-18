"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

export default function PerfilAdminPage() {
  const t =
    useTranslations("AdminProfile");

  const locale =
    useLocale();

  const [dados, setDados] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [
    sucessoKey,
    setSucessoKey,
  ] = useState<
    | ""
    | "success.photoUpdated"
    | "success.profileUpdated"
  >("");

  const inputFotoRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    enviandoFoto,
    setEnviandoFoto,
  ] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    setErro("");
  }, [locale]);

  async function alterarFotoPerfil(
    file: File | null
  ) {
    if (!file) {
      return;
    }

    const formatosPermitidos = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    const tamanhoMaximo =
      5 * 1024 * 1024;

    try {
      setErro("");
      setSucessoKey("");

      if (
        !formatosPermitidos.includes(
          file.type
        )
      ) {
        setErro(
          t("errors.invalidFormat")
        );
        return;
      }

      if (
        file.size >
        tamanhoMaximo
      ) {
        setErro(
          t("errors.maxSize")
        );
        return;
      }

      setEnviandoFoto(true);

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const resUpload =
        await fetch(
          "/api/upload",
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );

      const jsonUpload =
        await resUpload.json();

      if (!resUpload.ok) {
        setErro(
          jsonUpload?.error ||
            t("errors.upload")
        );
        return;
      }

      const fotoUrl =
        jsonUpload?.url ||
        jsonUpload?.arquivo?.url;

      if (!fotoUrl) {
        setErro(
          t("errors.missingUrl")
        );
        return;
      }

      const resSalvar =
        await fetch(
          "/api/admin/funcionarios/me",
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              ...dados,
              fotoPerfil: fotoUrl,
            }),
          }
        );

      const jsonSalvar =
        await resSalvar.json();

      if (!resSalvar.ok) {
        setErro(
          jsonSalvar?.error ||
            t(
              "errors.savePhoto"
            )
        );
        return;
      }

      setDados(jsonSalvar);

      setSucessoKey(
        "success.photoUpdated"
      );
    }
    catch (e: any) {
      setErro(
        e?.message ||
          t(
            "errors.photoCommunication"
          )
      );
    }
    finally {
      setEnviandoFoto(false);
    }
  }

  async function carregar() {
    try {
      const res =
        await fetch(
          "/api/admin/funcionarios/me"
        );

      const data =
        await res.json();

      setDados(data);
    }
    catch (e) {
      console.error(e);
    }
    finally {
      setLoading(false);
    }
  }

  async function salvar(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setErro("");
      setSucessoKey("");

      const res =
        await fetch(
          "/api/admin/funcionarios/me",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            body:
              JSON.stringify(
                dados
              ),
          }
        );

      const json =
        await res.json();

      if (!res.ok) {
        setErro(
          json?.error ||
            t(
              "errors.saveProfile"
            )
        );
        return;
      }

      setDados(json);

      setSucessoKey(
        "success.profileUpdated"
      );
    }
    catch (e: any) {
      setErro(
        e?.message ||
          t(
            "errors.profileCommunication"
          )
      );
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-slate-700 dark:text-slate-200">
        {t("loading")}
      </div>
    );
  }

  return (
    <main className="max-w-3xl p-8 text-slate-900 dark:text-slate-100">
      <input
        ref={inputFotoRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file =
            e.target.files?.[0] ||
            null;

          alterarFotoPerfil(
            file
          );

          e.target.value = "";
        }}
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {t("header.title")}
        </h1>

        <p className="mt-2 text-slate-500 dark:text-slate-300">
          {t(
            "header.description"
          )}
        </p>

        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
          <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800">
            {dados?.fotoPerfil ? (
              <img
                src={
                  dados.fotoPerfil
                }
                alt={
                  dados?.nome ||
                  t("photo.alt")
                }
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-700 dark:text-slate-200">
                {dados?.nome
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  "A"}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {t("photo.label")}
            </p>

            <button
              type="button"
              onClick={() =>
                inputFotoRef
                  .current
                  ?.click()
              }
              disabled={
                enviandoFoto
              }
              className="mt-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {enviandoFoto
                ? t(
                    "photo.uploading"
                  )
                : t(
                    "photo.change"
                  )}
            </button>

            <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                {t(
                  "photo.tipTitle"
                )}
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t(
                  "photo.tipLine1"
                )}
                <br />
                {t(
                  "photo.tipLine2"
                )}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
          {t("photo.help")}
        </p>

        <form
          onSubmit={salvar}
          className="mt-8 space-y-6"
        >
          {erro && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <strong>
                {t(
                  "alerts.errorTitle"
                )}
              </strong>

              <br />

              {erro}
            </div>
          )}

          {sucessoKey && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <strong>
                {t(
                  "alerts.successTitle"
                )}
              </strong>

              <br />

              {sucessoKey ===
              "success.photoUpdated"
                ? t(
                    "success.photoUpdated"
                  )
                : t(
                    "success.profileUpdated"
                  )}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("fields.name")}
            </label>

            <input
              type="text"
              value={
                dados?.nome || ""
              }
              onChange={(e) =>
                setDados({
                  ...dados,
                  nome:
                    e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {t(
                "fields.phone"
              )}
            </label>

            <input
              type="text"
              value={
                dados?.telefone ||
                ""
              }
              onChange={(e) =>
                setDados({
                  ...dados,
                  telefone:
                    e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("fields.role")}
            </label>

            <input
              type="text"
              value={
                dados?.cargo || ""
              }
              onChange={(e) =>
                setDados({
                  ...dados,
                  cargo:
                    e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            {t(
              "actions.save"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
