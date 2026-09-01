"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { useTranslations } from "next-intl";

type Opcao = {
  id: number;
  nome: string;
};

export default function NovaPublicacaoAcademicaPage() {
  const t = useTranslations("AdminAcademicPublicationNew");

  const [professores, setProfessores] = useState<Opcao[]>([]);
  const [turmas, setTurmas] = useState<Opcao[]>([]);
  const [disciplinas, setDisciplinas] = useState<Opcao[]>([]);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [professorResponsavelId, setProfessorResponsavelId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [prazo, setPrazo] = useState("");
  const [notaMaxima, setNotaMaxima] = useState("10");
  const [linkExterno, setLinkExterno] = useState("");
  const [publicarAgora, setPublicarAgora] = useState(true);

  const [arquivos, setArquivos] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [progressoUpload, setProgressoUpload] = useState("");

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregarOpcoes() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/admin/academico/publicacoes/nova", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("errors.loadOptions"));
      }

      setProfessores(Array.isArray(data?.professores) ? data.professores : []);
      setTurmas(Array.isArray(data?.turmas) ? data.turmas : []);
      setDisciplinas(Array.isArray(data?.disciplinas) ? data.disciplinas : []);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : t("errors.loadOptions"));
    } finally {
      setLoading(false);
    }
  }

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const res = await fetch("/api/admin/academico/publicacoes/nova", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo,
          descricao,
          professorResponsavelId,
          turmaId,
          disciplinaId,
          prazo,
          notaMaxima,
          linkExterno,
          publicarAgora,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("errors.createPublication"));
      }

      const atividadeId = Number(data?.atividade?.id);

      if (arquivos.length > 0) {
        if (!atividadeId || !Number.isFinite(atividadeId)) {
          throw new Error(t("errors.invalidActivityForAttachments"));
        }

        setUploading(true);

        for (let i = 0; i < arquivos.length; i++) {
          const arquivo = arquivos[i];

          setProgressoUpload(
            t("uploadProgress", {
              current: i + 1,
              total: arquivos.length,
              name: arquivo.name,
            })
          );

          const blob = await upload(arquivo.name, arquivo, {
            access: "public",
            handleUploadUrl:
              "/api/admin/academico/publicacoes/upload-url",
            clientPayload: JSON.stringify({
              atividadeId,
            }),
          });

          const resAnexo = await fetch(
            "/api/admin/academico/publicacoes/anexos",
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                atividadeId,
                url: blob.url,
                arquivoNome: arquivo.name,
                mimeType: arquivo.type || "application/octet-stream",
                tamanho: arquivo.size,
              }),
            }
          );

          const dataAnexo = await resAnexo.json();

          if (!resAnexo.ok) {
            throw new Error(
              dataAnexo?.error || t("errors.registerAttachment")
            );
          }
        }
      }

      setMensagem(
        publicarAgora ? t("success.published") : t("success.queued")
      );

      setTitulo("");
      setDescricao("");
      setProfessorResponsavelId("");
      setTurmaId("");
      setDisciplinaId("");
      setPrazo("");
      setNotaMaxima("10");
      setLinkExterno("");
      setPublicarAgora(true);
      setArquivos([]);
      setFileInputKey((key) => key + 1);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : t("errors.createPublication"));
    } finally {
      setUploading(false);
      setProgressoUpload("");
      setSalvando(false);
    }
  }

  useEffect(() => {
    void carregarOpcoes();
    // A carga deve ocorrer apenas ao abrir a página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="phanyx-new-publication-page min-h-screen p-6">
      <style jsx global>{`
        .phanyx-new-publication-page {
          --publication-page-bg: #f8fafc;
          --publication-card-bg: #ffffff;
          --publication-soft-bg: #f8fafc;
          --publication-input-bg: #ffffff;
          --publication-text: #0f172a;
          --publication-muted: #475569;
          --publication-subtle: #64748b;
          --publication-border: #cbd5e1;
          --publication-soft-border: #e2e8f0;
          --publication-blue: #1d4ed8;
          --publication-blue-hover: #1e40af;
          --publication-success-bg: #f0fdf4;
          --publication-success-border: #bbf7d0;
          --publication-success-text: #15803d;
          --publication-error-bg: #fef2f2;
          --publication-error-border: #fecaca;
          --publication-error-text: #b91c1c;
          min-height: 100vh;
          background: var(--publication-page-bg);
          color: var(--publication-text);
        }

        html[data-theme="dark"] .phanyx-new-publication-page {
          --publication-page-bg: #020617;
          --publication-card-bg: #0f172a;
          --publication-soft-bg: #111c31;
          --publication-input-bg: #020617;
          --publication-text: #f8fafc;
          --publication-muted: #cbd5e1;
          --publication-subtle: #94a3b8;
          --publication-border: #475569;
          --publication-soft-border: #334155;
          --publication-blue: #60a5fa;
          --publication-blue-hover: #93c5fd;
          --publication-success-bg: #052e16;
          --publication-success-border: #166534;
          --publication-success-text: #bbf7d0;
          --publication-error-bg: #450a0a;
          --publication-error-border: #991b1b;
          --publication-error-text: #fecaca;
          color-scheme: dark;
        }

        html[data-theme="system"] .phanyx-new-publication-page {
          --publication-page-bg: #242424;
          --publication-card-bg: #2d2d2d;
          --publication-soft-bg: #333333;
          --publication-input-bg: #262626;
          --publication-text: #ffffff;
          --publication-muted: #e5e7eb;
          --publication-subtle: #d1d5db;
          --publication-border: #666666;
          --publication-soft-border: #555555;
          --publication-blue: #7db5ff;
          --publication-blue-hover: #a9ccff;
          --publication-success-bg: #173c28;
          --publication-success-border: #2f855a;
          --publication-success-text: #d1fae5;
          --publication-error-bg: #4a2222;
          --publication-error-border: #9f4a4a;
          --publication-error-text: #fee2e2;
          color-scheme: dark;
        }

        .phanyx-new-publication-page .publication-card {
          border: 1px solid var(--publication-soft-border);
          background: var(--publication-card-bg);
          box-shadow: 0 1px 3px rgb(15 23 42 / 0.1);
        }

        .phanyx-new-publication-page .publication-title,
        .phanyx-new-publication-page .publication-label,
        .phanyx-new-publication-page .publication-toggle-title {
          color: var(--publication-text);
          -webkit-text-fill-color: var(--publication-text);
        }

        .phanyx-new-publication-page .publication-description {
          color: var(--publication-muted);
          -webkit-text-fill-color: var(--publication-muted);
        }

        .phanyx-new-publication-page .publication-help,
        .phanyx-new-publication-page .publication-toggle-description {
          color: var(--publication-subtle);
          -webkit-text-fill-color: var(--publication-subtle);
        }

        .phanyx-new-publication-page .publication-accent,
        .phanyx-new-publication-page .publication-back,
        .phanyx-new-publication-page .publication-progress {
          color: var(--publication-blue);
          -webkit-text-fill-color: var(--publication-blue);
        }

        .phanyx-new-publication-page .publication-back:hover {
          color: var(--publication-blue-hover);
          -webkit-text-fill-color: var(--publication-blue-hover);
        }

        .phanyx-new-publication-page .publication-control {
          width: 100%;
          border: 1px solid var(--publication-border);
          background: var(--publication-input-bg);
          color: var(--publication-text);
          -webkit-text-fill-color: var(--publication-text);
        }

        .phanyx-new-publication-page .publication-control::placeholder {
          color: var(--publication-subtle);
          -webkit-text-fill-color: var(--publication-subtle);
          opacity: 1;
        }

        .phanyx-new-publication-page .publication-control:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgb(59 130 246 / 0.18);
        }

        .phanyx-new-publication-page select.publication-control option {
          background: var(--publication-input-bg);
          color: var(--publication-text);
        }

        .phanyx-new-publication-page .publication-soft-box,
        .phanyx-new-publication-page .publication-toggle {
          border: 1px solid var(--publication-soft-border);
          background: var(--publication-soft-bg);
        }

        .phanyx-new-publication-page .publication-file-item {
          border: 1px solid var(--publication-soft-border);
          background: var(--publication-card-bg);
          color: var(--publication-muted);
          -webkit-text-fill-color: var(--publication-muted);
        }

        .phanyx-new-publication-page .publication-success {
          border-color: var(--publication-success-border);
          background: var(--publication-success-bg);
          color: var(--publication-success-text);
          -webkit-text-fill-color: var(--publication-success-text);
        }

        .phanyx-new-publication-page .publication-error {
          border-color: var(--publication-error-border);
          background: var(--publication-error-bg);
          color: var(--publication-error-text);
          -webkit-text-fill-color: var(--publication-error-text);
        }

        .phanyx-new-publication-page .publication-cancel {
          border: 1px solid var(--publication-border);
          color: var(--publication-text);
          -webkit-text-fill-color: var(--publication-text);
        }

        .phanyx-new-publication-page .publication-cancel:hover {
          background: var(--publication-soft-bg);
        }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-6">
        <section className="publication-card rounded-3xl p-6">
          <Link
            href="/admin/academico/publicacoes"
            className="publication-back text-sm font-semibold"
          >
            {t("backToPublications")}
          </Link>

          <p className="publication-accent mt-5 text-xs font-bold uppercase tracking-[0.2em]">
            {t("eyebrow")}
          </p>

          <h1 className="publication-title mt-2 text-2xl font-black">
            {t("title")}
          </h1>

          <p className="publication-description mt-2 text-sm leading-6">
            {t("description")}
          </p>
        </section>

        {mensagem && (
          <div
            role="status"
            aria-live="polite"
            className="publication-success rounded-2xl border p-4 text-sm font-semibold"
          >
            {mensagem}
          </div>
        )}

        {erro && (
          <div
            role="alert"
            className="publication-error rounded-2xl border p-4 text-sm font-semibold"
          >
            {erro}
          </div>
        )}

        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="publication-card publication-description rounded-2xl p-6 text-sm"
          >
            {t("loadingData")}
          </div>
        ) : (
          <form
            onSubmit={salvar}
            className="publication-card rounded-3xl p-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="publication-title"
                  className="publication-label text-sm font-bold"
                >
                  {t("fields.activityTitle")}
                </label>
                <input
                  id="publication-title"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="publication-control mt-2 rounded-2xl px-4 py-3 text-sm outline-none"
                  placeholder={t("placeholders.activityTitle")}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="publication-description"
                  className="publication-label text-sm font-bold"
                >
                  {t("fields.instructions")}
                </label>
                <textarea
                  id="publication-description"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={5}
                  className="publication-control mt-2 rounded-2xl px-4 py-3 text-sm outline-none"
                  placeholder={t("placeholders.instructions")}
                />
              </div>

              <div>
                <label
                  htmlFor="publication-teacher"
                  className="publication-label text-sm font-bold"
                >
                  {t("fields.responsibleTeacher")}
                </label>
                <select
                  id="publication-teacher"
                  value={professorResponsavelId}
                  onChange={(e) => setProfessorResponsavelId(e.target.value)}
                  className="publication-control mt-2 rounded-2xl px-4 py-3 text-sm outline-none"
                  required
                >
                  <option value="">{t("select")}</option>
                  {professores.map((professor) => (
                    <option key={professor.id} value={professor.id}>
                      {professor.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="publication-class"
                  className="publication-label text-sm font-bold"
                >
                  {t("fields.class")}
                </label>
                <select
                  id="publication-class"
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  className="publication-control mt-2 rounded-2xl px-4 py-3 text-sm outline-none"
                  required
                >
                  <option value="">{t("select")}</option>
                  {turmas.map((turma) => (
                    <option key={turma.id} value={turma.id}>
                      {turma.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="publication-subject"
                  className="publication-label text-sm font-bold"
                >
                  {t("fields.subject")}
                </label>
                <select
                  id="publication-subject"
                  value={disciplinaId}
                  onChange={(e) => setDisciplinaId(e.target.value)}
                  className="publication-control mt-2 rounded-2xl px-4 py-3 text-sm outline-none"
                >
                  <option value="">{t("noSpecificSubject")}</option>
                  {disciplinas.map((disciplina) => (
                    <option key={disciplina.id} value={disciplina.id}>
                      {disciplina.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="publication-deadline"
                  className="publication-label text-sm font-bold"
                >
                  {t("fields.deadline")}
                </label>
                <input
                  id="publication-deadline"
                  type="datetime-local"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="publication-control mt-2 rounded-2xl px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="publication-max-grade"
                  className="publication-label text-sm font-bold"
                >
                  {t("fields.maximumGrade")}
                </label>
                <input
                  id="publication-max-grade"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={notaMaxima}
                  onChange={(e) => setNotaMaxima(e.target.value)}
                  className="publication-control mt-2 rounded-2xl px-4 py-3 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="publication-external-link"
                  className="publication-label text-sm font-bold"
                >
                  {t("fields.optionalExternalLink")}
                </label>
                <input
                  id="publication-external-link"
                  type="url"
                  value={linkExterno}
                  onChange={(e) => setLinkExterno(e.target.value)}
                  className="publication-control mt-2 rounded-2xl px-4 py-3 text-sm outline-none"
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="publication-files"
                  className="publication-label text-sm font-bold"
                >
                  {t("fields.publicationFiles")}
                </label>

                <input
                  key={fileInputKey}
                  id="publication-files"
                  type="file"
                  multiple
                  onChange={(e) => {
                    setArquivos(Array.from(e.target.files || []));
                  }}
                  className="publication-control mt-2 rounded-2xl border-dashed px-4 py-4 text-sm outline-none"
                />

                <p className="publication-help mt-2 text-xs">
                  {t("fileHelp")}
                </p>

                {arquivos.length > 0 && (
                  <div className="publication-soft-box mt-3 rounded-2xl p-4">
                    <p className="publication-help text-xs font-bold uppercase tracking-[0.16em]">
                      {t("selectedFiles")}
                    </p>

                    <div className="mt-2 space-y-2">
                      {arquivos.map((arquivo) => (
                        <div
                          key={`${arquivo.name}-${arquivo.size}`}
                          className="publication-file-item rounded-xl px-3 py-2 text-sm"
                        >
                          {arquivo.name} — {t("fileSize", {
                            size: (arquivo.size / 1024 / 1024).toFixed(2),
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {progressoUpload && (
                  <p
                    role="status"
                    aria-live="polite"
                    className="publication-progress mt-3 text-sm font-semibold"
                  >
                    {progressoUpload}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={publicarAgora}
                  onClick={() => setPublicarAgora((value) => !value)}
                  className="publication-toggle flex w-full items-center justify-between gap-4 rounded-2xl p-4 text-left"
                >
                  <span>
                    <span className="publication-toggle-title block font-bold">
                      {t("publishImmediately.title")}
                    </span>
                    <span className="publication-toggle-description mt-1 block text-xs">
                      {t("publishImmediately.description")}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                      publicarAgora ? "bg-blue-600" : "bg-slate-400"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                        publicarAgora ? "left-6" : "left-1"
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/admin/academico/publicacoes"
                className="publication-cancel inline-flex justify-center rounded-2xl px-5 py-3 text-sm font-bold"
              >
                {t("cancel")}
              </Link>

              <button
                type="submit"
                disabled={salvando || uploading}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading
                  ? t("uploadingFiles")
                  : salvando
                    ? t("saving")
                    : t("savePublication")}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}