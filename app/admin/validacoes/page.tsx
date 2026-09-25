"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type ValidacaoResponse = {
  valido?: boolean;
  codigo?: string;
  statusValidacao?: string;
  mensagem?: string;
  error?: string;
  documento?: {
    id: number;
    titulo: string;
    tipo: string;
    status: string;
    criadoEm?: string;
    atualizadoEm?: string;
    exigeAssinatura?: boolean;
    aluno?: {
      id: number;
      nome: string;
      nomeSocial?: string | null;
      matricula?: string | null;
      cpf?: string | null;
    } | null;
    matricula?: {
      id: number;
      semestre?: number | null;
      status?: string | null;
      curso?: {
        id: number;
        nome: string;
      } | null;
    } | null;
    template?: {
      id: number;
      nome: string;
    } | null;
    instituicao?: {
      id: number;
      nome?: string | null;
      nomeFantasia?: string | null;
      cnpj?: string | null;
    } | null;
  };
};

function formatarData(data: string | undefined, locale: string) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(locale);
}

export default function AdminValidacoesPage() {
  const t = useTranslations("AdminOperations");
  const locale = useLocale();
  const tipos: Record<string, string> = { CONTRATO: t("validationsContract"), DECLARACAO: t("validationsDeclaration"), RECIBO: t("validationsReceipt"), COMPROVANTE: t("validationsProof"), TRANCAMENTO: t("validationsSuspension"), COMPARECIMENTO: t("validationsAttendance"), HISTORICO: t("validationsTranscript") };
  const statusLabels: Record<string, string> = { CANCELADO: t("validationsStatusCancelled"), CANCELADA: t("validationsStatusCancelled"), INVALIDADO: t("validationsStatusInvalidated"), INVALIDADA: t("validationsStatusInvalidated"), EMITIDO: t("validationsStatusIssued"), ASSINADO: t("validationsStatusSigned"), PENDENTE: t("validationsStatusPending"), TRANCADA: t("validationsStatusSuspended"), TRANCADO: t("validationsStatusSuspended"), ATIVO: t("validationsStatusActive"), ATIVA: t("validationsStatusActive"), CONCLUIDO: t("validationsStatusCompleted"), CONCLUIDA: t("validationsStatusCompleted") };
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ValidacaoResponse | null>(null);
  const [erro, setErro] = useState("");

  const nomeExibicao = useMemo(() => {
    return (
      resultado?.documento?.aluno?.nomeSocial?.trim() ||
      resultado?.documento?.aluno?.nome ||
      "-"
    );
  }, [resultado]);

  const nomeInstituicao = useMemo(() => {
  return resultado?.documento?.instituicao?.nome || t("validationsInstitution");
}, [resultado, t]);

  async function validarCodigo() {
    const codigoLimpo = codigo.trim();

    if (!codigoLimpo) {
      setErro(t("validationsEnterCode"));
      setResultado(null);
      return;
    }

    try {
      setLoading(true);
      setErro("");

      const res = await fetch(
        `/api/validar-documento?codigo=${encodeURIComponent(codigoLimpo)}`,
        {
          cache: "no-store",
        }
      );

      const data = (await res.json()) as ValidacaoResponse;
      setResultado(data);

      if (!res.ok && !data?.valido) {
        if (res.status === 403 || res.status === 429) setResultado(null);
        setErro(locale.startsWith("pt") ? (data?.error || data?.mensagem || t("validationsError")) : (res.status === 403 || res.status === 429 ? t("validationsBlocked") : t("validationsError")));
      }
    } catch (e) {
      console.error(e);
      setErro(t("validationsQueryError"));
      setResultado(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="phanyx-docs-page space-y-6">
      <div className="phanyx-doc-card p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="phanyx-doc-muted text-sm font-semibold uppercase tracking-[0.2em]">
              {t("validationsEyebrow")}
            </p>
            <h1 className="phanyx-doc-title mt-3 text-3xl font-bold">
              {t("validationsTitle")}
            </h1>
            <p className="phanyx-doc-muted mt-4 max-w-2xl">
              {t("validationsIntro")}
            </p>
          </div>

          <div className="phanyx-doc-preview px-4 py-3 text-sm">
            {t("validationsInternal")}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <label className="phanyx-doc-label mb-2 block text-sm">
              {t("validationsCode")}
            </label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") validarCodigo();
              }}
              placeholder="Ex.: PHANYX-1774450530482"
              className="phanyx-doc-input"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={validarCodigo}
              disabled={loading}
              className="phanyx-doc-primary-action disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("validationsValidating") : t("validationsTitle")}
            </button>
          </div>
        </div>

        {erro ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        ) : null}
      </div>

      {resultado ? (
        <>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="phanyx-doc-muted text-sm font-semibold uppercase tracking-[0.2em]">
                  {t("validationsResult")}
                </p>
                <h2 className="phanyx-doc-title mt-3 text-2xl font-bold">
                  {resultado.valido
                    ? t("validationsFound")
                    : resultado.statusValidacao === "INVALIDADO" ? t("validationsInvalidated") : t("validationsInvalid")}
                </h2>
                <p className="phanyx-doc-muted mt-3">
                  {locale.startsWith("pt") && resultado.mensagem ? resultado.mensagem : resultado.valido ? t("validationsValidMessage") : resultado.statusValidacao === "INVALIDADO" ? t("validationsInvalidatedMessage") : t("validationsMissingMessage")}
                </p>
              </div>

              <div
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${
                  resultado.valido
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-red-300 bg-red-50 text-red-700"
                }`}
              >
                {resultado.valido ? t("validationsValidBadge") : t("validationsMissingBadge")}
              </div>
            </div>

            <div className="phanyx-doc-preview mt-6 p-5">
              <p className="phanyx-doc-muted text-xs font-semibold uppercase tracking-wide">
                {t("validationsCheckedCode")}
              </p>
              <p className="phanyx-doc-value mt-2 text-lg font-bold">
                {resultado.codigo || codigo}
              </p>
            </div>
          </div>

          {resultado.valido && resultado.documento ? (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="phanyx-doc-section-title text-lg font-semibold">
                  {t("validationsDocumentData")}
                </h3>

                <div className="phanyx-doc-value mt-4 space-y-3 text-sm">
                  <p>
                    <strong>{t("commonTitlePrefix")}</strong> {resultado.documento.titulo}
                  </p>
                  <p>
                    <strong>{t("commonTypePrefix")}</strong>{" "}
                    {tipos[resultado.documento.tipo] || resultado.documento.tipo}
                  </p>
                  <p>
                    <strong>{t("commonStatusPrefix")}</strong> {statusLabels[resultado.documento.status.toUpperCase()] || resultado.documento.status || "-"}
                  </p>
                  <p>
                    <strong>{t("commonIssuedPrefix")}</strong>{" "}
                    {formatarData(resultado.documento.criadoEm, locale)}
                  </p>
                  <p>
                    <strong>{t("commonUpdatedPrefix")}</strong>{" "}
                    {formatarData(resultado.documento.atualizadoEm, locale)}
                  </p>
                  <p>
                    <strong>{t("commonTemplatePrefix")}</strong>{" "}
                    {resultado.documento.template?.nome || "-"}
                  </p>
                  <p>
                    <strong>{t("commonSignaturePrefix")}</strong>{" "}
                    {resultado.documento.exigeAssinatura ? t("commonYes") : t("commonNo")}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="phanyx-doc-section-title text-lg font-semibold">
                  {t("validationsLinkedData")}
                </h3>

                <div className="phanyx-doc-value mt-4 space-y-3 text-sm">
                  <p>
                    <strong>{t("commonStudentPrefix")}</strong> {nomeExibicao}
                  </p>
                  <p>
                    <strong>{t("commonEnrollmentPrefix")}</strong>{" "}
                    {resultado.documento.aluno?.matricula || "-"}
                  </p>
                  <p>
                    <strong>{t("commonCpfPrefix")}</strong>{" "}
                    {resultado.documento.aluno?.cpf || "-"}
                  </p>
                  <p>
                    <strong>{t("commonCoursePrefix")}</strong>{" "}
                    {resultado.documento.matricula?.curso?.nome || "-"}
                  </p>
                  <p>
                    <strong>{t("commonSemesterPrefix")}</strong>{" "}
                    {resultado.documento.matricula?.semestre ?? "-"}
                  </p>
                  <p>
                    <strong>{t("commonEnrollmentStatusPrefix")}</strong>{" "}
                    {statusLabels[resultado.documento.matricula?.status?.toUpperCase() || ""] || resultado.documento.matricula?.status || "-"}
                  </p>
                  <p>
                    <strong>{t("commonInstitutionPrefix")}</strong> {nomeInstituicao}
                  </p>
                  <p>
                    <strong>{t("commonCnpjPrefix")}</strong>{" "}
                    {resultado.documento.instituicao?.cnpj || "-"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
              <h3 className="phanyx-doc-section-title text-lg font-semibold">
                {t("validationsNotFound")}
              </h3>
              <p className="mt-3 text-sm text-slate-600">
                {t("validationsTryAgain")}
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
