"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import withAuth from "@/components/auth/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";

type StatusVisitante =
  | "AGUARDANDO"
  | "DENTRO"
  | "SAIU"
  | "CANCELADO"
  | "BLOQUEADO";

type Visitante = {
  id: number;
  nome: string;
  documentoTipo?: string | null;
  documentoNumero?: string | null;
  telefone?: string | null;
  email?: string | null;
  empresa?: string | null;
  destino?: string | null;
  pessoaVisitada?: string | null;
  setorVisitado?: string | null;
  motivo?: string | null;
  evento?: string | null;
  fotoPerfil?: string | null;
  codigoVisitante: string;
  codigoCracha?: string | null;
  status: StatusVisitante;
  entradaPrevistaEm?: string | null;
  entradaEm?: string | null;
  saidaPrevistaEm?: string | null;
  saidaEm?: string | null;
  crachaEmitidoEm?: string | null;
  crachaValidoAte?: string | null;
  observacoes?: string | null;
};

type FormVisitante = {
  nome: string;
  documentoTipo: string;
  documentoNumero: string;
  telefone: string;
  email: string;
  empresa: string;
  destino: string;
  pessoaVisitada: string;
  setorVisitado: string;
  motivo: string;
  evento: string;
  fotoPerfil: string;
  status: StatusVisitante;
  entradaPrevistaEm: string;
  saidaPrevistaEm: string;
  crachaValidoAte: string;
  observacoes: string;
};

const formInicial: FormVisitante = {
  nome: "",
  documentoTipo: "CPF",
  documentoNumero: "",
  telefone: "",
  email: "",
  empresa: "",
  destino: "",
  pessoaVisitada: "",
  setorVisitado: "",
  motivo: "",
  evento: "",
  fotoPerfil: "",
  status: "AGUARDANDO",
  entradaPrevistaEm: "",
  saidaPrevistaEm: "",
  crachaValidoAte: "",
  observacoes: "",
};

function dataParaInput(valor?: string | null) {
  if (!valor) return "";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "";

  return data.toISOString().slice(0, 16);
}

function formatarData(valor: string | null | undefined, locale: string) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "-";

  return data.toLocaleString(locale);
}

function classeStatus(status: StatusVisitante) {
  if (status === "DENTRO") {
    return "phanyx-visitantes-status phanyx-visitantes-status-dentro";
  }

  if (status === "SAIU") {
    return "phanyx-visitantes-status phanyx-visitantes-status-saiu";
  }

  if (status === "CANCELADO") {
    return "phanyx-visitantes-status phanyx-visitantes-status-cancelado";
  }

  if (status === "BLOQUEADO") {
    return "phanyx-visitantes-status phanyx-visitantes-status-bloqueado";
  }

  return "phanyx-visitantes-status phanyx-visitantes-status-aguardando";
}

function AdminVisitantesPage() {
  const t = useTranslations("AdminOperations");
  const locale = useLocale();
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [form, setForm] = useState<FormVisitante>(formInicial);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [eventoFiltro, setEventoFiltro] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const totalDentro = useMemo(
    () => visitantes.filter((v) => v.status === "DENTRO").length,
    [visitantes]
  );

  const totalAguardando = useMemo(
    () => visitantes.filter((v) => v.status === "AGUARDANDO").length,
    [visitantes]
  );

  const totalSemFoto = useMemo(
    () => visitantes.filter((v) => !v.fotoPerfil).length,
    [visitantes]
  );

  function atualizarForm(campo: keyof FormVisitante, valor: string) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function carregarVisitantes() {
    try {
      setCarregando(true);

      const params = new URLSearchParams();

      if (busca.trim()) params.set("busca", busca.trim());
      if (statusFiltro) params.set("status", statusFiltro);
      if (eventoFiltro.trim()) params.set("evento", eventoFiltro.trim());

      const res = await fetch(`/api/admin/visitantes?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error((locale.startsWith("pt") ? (data.error || t("visitorsLoadError")) : t("visitorsLoadError")));
      }

      setVisitantes(Array.isArray(data.visitantes) ? data.visitantes : []);
    } catch (e: any) {
      setErro((locale.startsWith("pt") ? (e.message || t("visitorsLoadError")) : t("visitorsLoadError")));
    } finally {
      setCarregando(false);
    }
  }

  async function enviarFotoVisitante(arquivo: File | null) {
    if (!arquivo) return;

    const tiposPermitidos = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
      setErro(t("visitorsPhotoFormat"));
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      setErro(t("visitorsPhotoSize"));
      return;
    }

    try {
      setEnviandoFoto(true);
      setErro("");
      setSucesso("");

      const formData = new FormData();
      formData.append("file", arquivo);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error((locale.startsWith("pt") ? (data?.error || t("visitorsUploadError")) : t("visitorsUploadError")));
      }

      const url =
        data?.url ||
        data?.fileUrl ||
        data?.arquivoUrl ||
        data?.publicUrl;

      if (!url) {
        throw new Error(t("visitorsPhotoUrlError"));
      }

      atualizarForm("fotoPerfil", url);
      setSucesso(t("visitorsPhotoSent"));
    } catch (e: any) {
      setErro((locale.startsWith("pt") ? (e.message || t("visitorsUploadVisitorError")) : t("visitorsUploadVisitorError")));
    } finally {
      setEnviandoFoto(false);
    }
  }

  function iniciarEdicao(visitante: Visitante) {
    setEditandoId(visitante.id);

    setForm({
      nome: visitante.nome || "",
      documentoTipo: visitante.documentoTipo || "CPF",
      documentoNumero: visitante.documentoNumero || "",
      telefone: visitante.telefone || "",
      email: visitante.email || "",
      empresa: visitante.empresa || "",
      destino: visitante.destino || "",
      pessoaVisitada: visitante.pessoaVisitada || "",
      setorVisitado: visitante.setorVisitado || "",
      motivo: visitante.motivo || "",
      evento: visitante.evento || "",
      fotoPerfil: visitante.fotoPerfil || "",
      status: visitante.status || "AGUARDANDO",
      entradaPrevistaEm: dataParaInput(visitante.entradaPrevistaEm),
      saidaPrevistaEm: dataParaInput(visitante.saidaPrevistaEm),
      crachaValidoAte: dataParaInput(visitante.crachaValidoAte),
      observacoes: visitante.observacoes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function limparFormulario() {
    setEditandoId(null);
    setForm(formInicial);
  }

  async function salvarVisitante(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nome.trim()) {
      setErro(t("visitorsNameRequired"));
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const url = editandoId
        ? `/api/admin/visitantes/${editandoId}`
        : "/api/admin/visitantes";

      const res = await fetch(url, {
        method: editandoId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error((locale.startsWith("pt") ? (data.error || t("visitorsSaveError")) : t("visitorsSaveError")));
      }

      setSucesso(
        editandoId
          ? t("visitorsUpdated")
          : t("visitorsCreated")
      );

      limparFormulario();
      await carregarVisitantes();
    } catch (e: any) {
      setErro((locale.startsWith("pt") ? (e.message || t("visitorsSaveError")) : t("visitorsSaveError")));
    } finally {
      setSalvando(false);
    }
  }

  async function executarAcaoVisitante(
    visitanteId: number,
    acao: "REGISTRAR_ENTRADA" | "REGISTRAR_SAIDA" | "CANCELAR" | "BLOQUEAR"
  ) {
    try {
      setErro("");
      setSucesso("");

      const res = await fetch(`/api/admin/visitantes/${visitanteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ acao }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error((locale.startsWith("pt") ? (data.error || t("visitorsActionError")) : t("visitorsActionError")));
      }

      const mensagens = {
        REGISTRAR_ENTRADA: t("visitorsCheckedIn"),
        REGISTRAR_SAIDA: t("visitorsCheckedOut"),
        CANCELAR: t("visitorsCancelled"),
        BLOQUEAR: t("visitorsBlocked"),
      };

      setSucesso(mensagens[acao]);
      await carregarVisitantes();
    } catch (e: any) {
      setErro((locale.startsWith("pt") ? (e.message || t("visitorsActionError")) : t("visitorsActionError")));
    }
  }

  useEffect(() => {
    carregarVisitantes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="phanyx-visitantes-page min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {erro && (
        <PhanyxToast
          tipo="erro"
          titulo={t("commonNoAction")}
          mensagem={erro}
          onClose={() => setErro("")}
        />
      )}

      {sucesso && (
        <PhanyxToast
          tipo="sucesso"
          titulo={t("commonDone")}
          mensagem={sucesso}
          onClose={() => setSucesso("")}
        />
      )}

      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-300">
            {t("visitorsEyebrow")}
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
            {t("visitorsTitle")}
          </h1>

          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600 dark:text-slate-400">
            {t("visitorsIntro")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="phanyx-visitantes-resumo-card rounded-3xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t("visitorsInside")}
            </p>
            <strong className="mt-2 block text-3xl text-green-600 dark:text-green-300">
              {totalDentro}
            </strong>
          </div>

          <div className="phanyx-visitantes-resumo-card rounded-3xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t("visitorsWaiting")}
            </p>
            <strong className="mt-2 block text-3xl text-yellow-600 dark:text-yellow-300">
              {totalAguardando}
            </strong>
          </div>

          <div className="phanyx-visitantes-resumo-card rounded-3xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t("visitorsNoPhoto")}
            </p>
            <strong className="mt-2 block text-3xl text-red-600 dark:text-red-300">
              {totalSemFoto}
            </strong>
          </div>
        </div>

        <form
          onSubmit={salvarVisitante}
          className="phanyx-visitantes-form-card rounded-3xl border p-6 shadow-sm"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                {editandoId ? t("visitorsEdit") : t("visitorsNew")}
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("visitorsFormHelp")}
              </p>
            </div>

            {editandoId && (
              <button
                type="button"
                onClick={limparFormulario}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("visitorsCancelEdit")}
              </button>
            )}
          </div>

          <div className="phanyx-visitantes-foto-card mb-5 rounded-3xl border p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                {form.fotoPerfil ? (
                  <img
                    src={form.fotoPerfil}
                    alt={form.nome || t("visitorsPhoto")}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-slate-400">
                    {form.nome?.charAt(0)?.toUpperCase() || "V"}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-slate-950 dark:text-white">
                  {t("visitorsPhoto")}
                </h3>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {t("visitorsPhotoHelp")}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
                    {enviandoFoto ? t("visitorsUploading") : t("visitorsUploadPhoto")}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      disabled={enviandoFoto}
                      onChange={(e) =>
                        enviarFotoVisitante(e.target.files?.[0] || null)
                      }
                      className="hidden"
                    />
                  </label>

                  {form.fotoPerfil && (
                    <button
                      type="button"
                      onClick={() => atualizarForm("fotoPerfil", "")}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      {t("visitorsRemovePhoto")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("visitorsName")}
              </span>
              <input
                value={form.nome}
                onChange={(e) => atualizarForm("nome", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("commonStatus")}
              </span>
              <select
                value={form.status}
                onChange={(e) =>
                  atualizarForm("status", e.target.value as StatusVisitante)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="AGUARDANDO">{t("visitorsStatusWaiting")}</option>
                <option value="DENTRO">{t("visitorsStatusInside")}</option>
                <option value="SAIU">{t("visitorsStatusLeft")}</option>
                <option value="CANCELADO">{t("visitorsStatusCancelled")}</option>
                <option value="BLOQUEADO">{t("visitorsStatusBlocked")}</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("visitorsDocumentType")}
              </span>
              <select
                value={form.documentoTipo}
                onChange={(e) => atualizarForm("documentoTipo", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="CPF">CPF</option>
                <option value="RG">RG</option>
                <option value="CNH">CNH</option>
                <option value="PASSAPORTE">{t("visitorsPassport")}</option>
                <option value="OUTRO">{t("visitorsOther")}</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("visitorsDocumentNo")}
              </span>
              <input
                value={form.documentoNumero}
                onChange={(e) =>
                  atualizarForm("documentoNumero", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("commonPhone")}
              </span>
              <input
                value={form.telefone}
                onChange={(e) => atualizarForm("telefone", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("commonEmail")}
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => atualizarForm("email", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("visitorsCompany")}
              </span>
              <input
                value={form.empresa}
                onChange={(e) => atualizarForm("empresa", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("commonDestination")}
              </span>
              <input
                value={form.destino}
                onChange={(e) => atualizarForm("destino", e.target.value)}
                placeholder={t("visitorsDestinationHint")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("visitorsVisitedPerson")}
              </span>
              <input
                value={form.pessoaVisitada}
                onChange={(e) =>
                  atualizarForm("pessoaVisitada", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("visitorsDepartment")}
              </span>
              <input
                value={form.setorVisitado}
                onChange={(e) =>
                  atualizarForm("setorVisitado", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("commonEvent")}
              </span>
              <input
                value={form.evento}
                onChange={(e) => atualizarForm("evento", e.target.value)}
                placeholder={t("visitorsEventHint")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("visitorsExpectedEntry")}
              </span>
              <input
                type="datetime-local"
                value={form.entradaPrevistaEm}
                onChange={(e) =>
                  atualizarForm("entradaPrevistaEm", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("visitorsExpectedExit")}
              </span>
              <input
                type="datetime-local"
                value={form.saidaPrevistaEm}
                onChange={(e) =>
                  atualizarForm("saidaPrevistaEm", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("visitorsBadgeUntil")}
              </span>
              <input
                type="datetime-local"
                value={form.crachaValidoAte}
                onChange={(e) =>
                  atualizarForm("crachaValidoAte", e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1 md:col-span-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("visitorsVisitReason")}
              </span>
              <input
                value={form.motivo}
                onChange={(e) => atualizarForm("motivo", e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <label className="space-y-1 md:col-span-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t("commonNotes")}
              </span>
              <textarea
                value={form.observacoes}
                onChange={(e) => atualizarForm("observacoes", e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-2xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {salvando
                ? t("visitorsSaving")
                : editandoId
                  ? t("visitorsSaveChanges")
                  : t("visitorsRegister")}
            </button>
          </div>
        </form>

        <section className="phanyx-visitantes-section rounded-3xl border p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                {t("visitorsRegistered")}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t("visitorsListHelp")}
              </p>
            </div>

            <div className="grid gap-2 md:grid-cols-4">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={t("visitorsSearch")}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="">{t("commonAllStatuses")}</option>
                <option value="AGUARDANDO">{t("visitorsStatusWaiting")}</option>
                <option value="DENTRO">{t("visitorsStatusInside")}</option>
                <option value="SAIU">{t("visitorsStatusLeft")}</option>
                <option value="CANCELADO">{t("visitorsStatusCancelled")}</option>
                <option value="BLOQUEADO">{t("visitorsStatusBlocked")}</option>
              </select>

              <input
                value={eventoFiltro}
                onChange={(e) => setEventoFiltro(e.target.value)}
                placeholder={t("visitorsFilterEvent")}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />

              <button
                type="button"
                onClick={carregarVisitantes}
                className="phanyx-visitantes-filtrar-btn rounded-xl border px-4 py-2 text-sm font-bold"
              >
                {t("visitorsFilter")}
              </button>
            </div>
          </div>

          {carregando ? (
            <div className="rounded-2xl border border-slate-200 p-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
              {t("visitorsLoading")}
            </div>
          ) : visitantes.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 p-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
              {t("visitorsEmpty")}
            </div>
          ) : (
            <div className="space-y-3">
              {visitantes.map((visitante) => (
                <div
                  key={visitante.id}
                  className="phanyx-visitantes-lista-card rounded-3xl border p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900">
                        {visitante.fotoPerfil ? (
                          <img
                            src={visitante.fotoPerfil}
                            alt={visitante.nome}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-black text-slate-400">
                            {visitante.nome?.charAt(0)?.toUpperCase() || "V"}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-slate-950 dark:text-white">
                            {visitante.nome}
                          </h3>

                          <span className={classeStatus(visitante.status)}>
                            {t(({ AGUARDANDO: "visitorsStatusWaiting", DENTRO: "visitorsStatusInside", SAIU: "visitorsStatusLeft", CANCELADO: "visitorsStatusCancelled", BLOQUEADO: "visitorsStatusBlocked" } as const)[visitante.status])}
                          </span>

                          {!visitante.fotoPerfil && (
                            <span className="phanyx-visitantes-status phanyx-visitantes-status-sem-foto">
                              {t("visitorsNoPhotoBadge")}
                            </span>
                          )}
                        </div>

                        <div className="mt-2 grid gap-1 text-sm text-slate-600 dark:text-slate-400 md:grid-cols-2">
                          <p>{t("commonCodePrefix")} {visitante.codigoVisitante}</p>
                          <p>{t("commonDocumentPrefix")} {visitante.documentoNumero || "-"}</p>
                          <p>{t("commonCompanyPrefix")} {visitante.empresa || "-"}</p>
                          <p>{t("commonDestinationPrefix")} {visitante.destino || "-"}</p>
                          <p>{t("commonVisitorPrefix")} {visitante.pessoaVisitada || "-"}</p>
                          <p>{t("commonEventPrefix")} {visitante.evento || "-"}</p>
                          <p>{t("commonEntryPrefix")} {formatarData(visitante.entradaEm, locale)}</p>
                          <p>{t("commonExitPrefix")} {formatarData(visitante.saidaEm, locale)}</p>
                          <p>
                            {t("commonBadgeUntilPrefix")}{" "}
                            {formatarData(visitante.crachaValidoAte, locale)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="phanyx-visitantes-acoes flex flex-wrap gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          iniciarEdicao(visitante)
                        }
                        className="phanyx-visitantes-acao phanyx-visitantes-acao-editar"
                      >
                        {t("commonEdit")}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          executarAcaoVisitante(
                            visitante.id,
                            "REGISTRAR_ENTRADA"
                          )
                        }
                        className="phanyx-visitantes-acao phanyx-visitantes-acao-entrada"
                      >
                        {t("visitorsEntry")}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          executarAcaoVisitante(
                            visitante.id,
                            "REGISTRAR_SAIDA"
                          )
                        }
                        className="phanyx-visitantes-acao phanyx-visitantes-acao-saida"
                      >
                        {t("visitorsExit")}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          executarAcaoVisitante(
                            visitante.id,
                            "BLOQUEAR"
                          )
                        }
                        className="phanyx-visitantes-acao phanyx-visitantes-acao-bloquear"
                      >
                        {t("visitorsBlock")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default withAuth(AdminVisitantesPage, ["admin"]);
