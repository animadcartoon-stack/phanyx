"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import withAuth from "@/lib/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

type DocumentoGerado = {
  id: number;
  titulo: string;
  tipo: string;
  contexto?: string | null;
  status: string;
  exigeAssinatura: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
  assinadoEm?: string | null;
  conteudo?: string;
  aluno?: {
    id: number;
    nome: string;
    matricula?: string | null;
    cpf?: string | null;
  } | null;
  matricula?: {
    id: number;
    status?: string | null;
    semestre?: number | null;
  } | null;
  template?: {
    id: number;
    nome: string;
    exigeAssinatura?: boolean;
  } | null;
};

const CHAVES_TIPO_DOCUMENTO: Record<string, string> = {
  CONTRATO: "types.contract",
  DECLARACAO: "types.declaration",
  RECIBO: "types.receipt",
  COMPROVANTE: "types.proof",
  TRANCAMENTO: "types.withdrawal",
  CANCELAMENTO_MATRICULA: "types.enrollmentCancellation",
  COMPARECIMENTO: "types.attendance",
  HISTORICO: "types.transcript",
  HOLERITE: "types.payslip",
  DOCUMENTO_RH: "types.hrDocument",
  CONTRATO_TRABALHO: "types.employmentContract",
  CONTRATO_EXPERIENCIA: "types.probationContract",
  TERMO_LGPD_RH: "types.hrPrivacyTerm",
  TERMO_EQUIPAMENTOS: "types.equipmentTerm",
  ADMISSAO: "types.admission",
  DEMISSAO: "types.dismissal",
  PEDIDO_DEMISSAO: "types.resignation",
  AVISO_PREVIO: "types.notice",
  TRCT: "types.terminationTerm",
  FERIAS: "types.vacation",
  AVISO_FERIAS: "types.vacationNotice",
  RECIBO_FERIAS: "types.vacationReceipt",
  ADVERTENCIA: "types.warning",
  SUSPENSAO: "types.suspension",
  AFASTAMENTO_MEDICO: "types.medicalLeave",
  AFASTAMENTO_MATERNIDADE: "types.maternityLeave",
  AFASTAMENTO_PERICIA: "types.medicalAssessmentLeave",
  RETORNO_TRABALHO: "types.returnToWork",
  ASO: "types.occupationalHealthCertificate",
  ASO_ADMISSIONAL: "types.occupationalHealthAdmission",
  ASO_PERIODICO: "types.occupationalHealthPeriodic",
  ASO_RETORNO: "types.occupationalHealthReturn",
  ASO_MUDANCA_FUNCAO: "types.occupationalHealthRoleChange",
  ASO_DEMISSIONAL: "types.occupationalHealthDismissal",
  OUTRO: "types.other",
};

const CHAVES_STATUS_DOCUMENTO: Record<string, string> = {
  RASCUNHO: "statuses.draft",
  GERADO: "statuses.generated",
  ASSINADO: "statuses.signed",
  CANCELADO: "statuses.cancelled",
  ABERTO: "statuses.opened",
};

function formatarData(
  data: string | undefined,
  locale: string
) {
  if (!data) return "-";

  const d = new Date(data);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(d);
}

function statusClass(status?: string) {
  switch (status) {
    case "ASSINADO":
      return "bg-green-100 text-green-700";
    case "GERADO":
      return "bg-blue-100 text-blue-700";
    case "RASCUNHO":
      return "bg-yellow-100 text-yellow-700";
    case "CANCELADO":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function podeExcluirDocumento(
  documento: DocumentoGerado
) {
  return (
    documento.status !==
    "ASSINADO" &&
    !documento.assinadoEm
  );
}

function AdminDocumentosGeradosPage() {
  const t = useTranslations("AdminDocuments");
  const locale = useLocale();

  function labelTipo(tipo?: string) {
    const chave =
      CHAVES_TIPO_DOCUMENTO[
        String(tipo || "").toUpperCase()
      ];

    return chave
      ? t(chave)
      : tipo || "-";
  }

  function labelStatus(status?: string) {
    const chave =
      CHAVES_STATUS_DOCUMENTO[
        String(status || "").toUpperCase()
      ];

    return chave
      ? t(chave)
      : status || "-";
  }

  const [documentos, setDocumentos] = useState<DocumentoGerado[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [documentoSelecionado, setDocumentoSelecionado] =
    useState<DocumentoGerado | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  const [
    documentoParaExcluir,
    setDocumentoParaExcluir,
  ] =
    useState<DocumentoGerado | null>(
      null
    );

  const [
    confirmarExcluirTodos,
    setConfirmarExcluirTodos,
  ] = useState(false);

  const [
    excluindo,
    setExcluindo,
  ] = useState(false);

  const [
    documentosSelecionados,
    setDocumentosSelecionados,
  ] =
    useState<number[]>([]);

  const [
    confirmarExcluirSelecionados,
    setConfirmarExcluirSelecionados,
  ] = useState(false);

  async function carregarDocumentos() {
    try {
      setLoading(true);
      setMensagem("");

      const params = new URLSearchParams();
      if (filtroTipo) params.set("tipo", filtroTipo);

      const res = await fetch(
        `/api/admin/documentos/gerados${params.toString() ? `?${params.toString()}` : ""}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("generated.errors.load"));
      }

      const listaDocumentos:
        DocumentoGerado[] =
        Array.isArray(data)
          ? data
          : [];

      setDocumentos(
        listaDocumentos
      );

      setDocumentosSelecionados(
        (selecionadosAtuais) =>
          selecionadosAtuais.filter(
            (idSelecionado) =>
              listaDocumentos.some(
                (documento) =>
                  documento.id ===
                  idSelecionado &&
                  podeExcluirDocumento(
                    documento
                  )
              )
          )
      );
    } catch (error: any) {
      console.error(error);
      setDocumentos([]);
      setMensagem(error?.message || t("generated.errors.load"));
    } finally {
      setLoading(false);
    }
  }

  function montarUrlPdfDocumento(
    documento: DocumentoGerado
  ) {
    if (
      documento.tipo ===
      "CONTRATO" &&
      documento.matricula?.id
    ) {
      return (
        "/api/admin/contratos/pdf" +
        `?matriculaId=${documento.matricula.id}`
      );
    }

    return (
      "/api/admin/documentos/pdf/" +
      documento.id
    );
  }

  function montarTextoCompartilhamento(doc: DocumentoGerado) {
    return [
      `${t("generated.share.document")}: ${doc.titulo}`,
      `${t("generated.share.type")}: ${labelTipo(doc.tipo)}`,
      `${t("generated.share.student")}: ${doc.aluno?.nome || "-"}`,
      `${t("generated.share.enrollment")}: ${doc.aluno?.matricula || "-"}`,
      `${t("generated.share.context")}: ${doc.contexto || "-"}`,
      "",
      doc.conteudo || "",
    ].join("\n");
  }

  function imprimirDocumento(doc: DocumentoGerado) {
    const texto = `
      <html>
        <head>
          <title>${doc.titulo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 32px;
              line-height: 1.7;
              color: #111827;
            }
            h1 {
              font-size: 22px;
              margin-bottom: 8px;
            }
            .meta {
              margin-bottom: 24px;
              color: #4b5563;
              font-size: 14px;
            }
            .conteudo {
              white-space: pre-wrap;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <h1>${doc.titulo}</h1>
          <div class="meta">
            <div><strong>${t("generated.share.type")}:</strong> ${labelTipo(doc.tipo)}</div>
            <div><strong>${t("generated.share.student")}:</strong> ${doc.aluno?.nome || "-"}</div>
            <div><strong>${t("generated.share.enrollment")}:</strong> ${doc.aluno?.matricula || "-"}</div>
            <div><strong>${t("generated.share.context")}:</strong> ${doc.contexto || "-"}</div>
          </div>
          <div class="conteudo">${(doc.conteudo || "-")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")}</div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      setErro(t("generated.errors.printWindow"));
      return;
    }

    win.document.open();
    win.document.write(texto);
    win.document.close();
    win.focus();

    setTimeout(() => {
      win.print();
    }, 300);
  }

  async function enviarPorEmail(doc: DocumentoGerado) {
    const assunto = encodeURIComponent(doc.titulo);
    const corpo = encodeURIComponent(montarTextoCompartilhamento(doc));
    const link = `mailto:?subject=${assunto}&body=${corpo}`;

    try {
      await navigator.clipboard.writeText(montarTextoCompartilhamento(doc));
      setMensagem(
        t("generated.messages.emailCopied")
      );
    } catch {
      setMensagem(
        t("generated.messages.emailOpening")
      );
    }

    window.location.href = link;
  }

  function enviarPorWhatsApp(doc: DocumentoGerado) {
    const texto = encodeURIComponent(montarTextoCompartilhamento(doc));
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  }

  async function abrirDocumento(id: number) {
    try {
      setLoadingDetalhe(true);
      setMensagem("");

      const res = await fetch(`/api/admin/documentos/gerados/${id}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("generated.errors.loadDetail"));
      }

      setDocumentoSelecionado(data);
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || t("generated.errors.loadDetail"));
    } finally {
      setLoadingDetalhe(false);
    }
  }

  useEffect(() => {
    carregarDocumentos();
  }, [filtroTipo]);

  async function excluirDocumento(
    documento: DocumentoGerado
  ) {
    try {
      setExcluindo(true);
      setErro("");
      setMensagem("");

      const res = await fetch(
        "/api/admin/documentos/gerados",
        {
          method: "DELETE",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            modo:
              "INDIVIDUAL",

            documentoId:
              documento.id,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t("generated.errors.deleteOne")
        );
      }

      if (
        documentoSelecionado?.id ===
        documento.id
      ) {
        setDocumentoSelecionado(
          null
        );
      }

      setDocumentoParaExcluir(
        null
      );

      setMensagem(
        data?.mensagem ||
        t("generated.messages.deletedOne")
      );

      await carregarDocumentos();
    } catch (error: any) {
      console.error(error);

      setErro(
        error?.message ||
        t("generated.errors.deleteOne")
      );
    } finally {
      setExcluindo(false);
    }
  }

  async function excluirTodosNaoAssinados() {
    try {
      setExcluindo(true);
      setErro("");
      setMensagem("");

      const res = await fetch(
        "/api/admin/documentos/gerados",
        {
          method: "DELETE",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            modo:
              "TODOS_NAO_ASSINADOS",
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t("generated.errors.deleteMany")
        );
      }

      setConfirmarExcluirTodos(
        false
      );

      setDocumentoSelecionado(
        null
      );

      setMensagem(
        data?.mensagem ||
        t("generated.messages.deletedMany")
      );

      await carregarDocumentos();
    } catch (error: any) {
      console.error(error);

      setErro(
        error?.message ||
        t("generated.errors.deleteMany")
      );
    } finally {
      setExcluindo(false);
    }
  }

  async function excluirDocumentosSelecionados() {
    try {
      if (
        documentosSelecionados.length ===
        0
      ) {
        setErro(
          t("generated.errors.selectAtLeastOne")
        );

        return;
      }

      setExcluindo(true);
      setErro("");
      setMensagem("");

      const res = await fetch(
        "/api/admin/documentos/gerados",
        {
          method: "DELETE",

          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            modo:
              "SELECIONADOS",

            documentoIds:
              documentosSelecionados,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
          t("generated.errors.deleteSelected")
        );
      }

      setConfirmarExcluirSelecionados(
        false
      );

      setDocumentosSelecionados(
        []
      );

      setDocumentoSelecionado(
        null
      );

      setMensagem(
        data?.mensagem ||
        t("generated.messages.deletedSelected")
      );

      await carregarDocumentos();
    } catch (error: any) {
      console.error(error);

      setErro(
        error?.message ||
        t("generated.errors.deleteSelected")
      );
    } finally {
      setExcluindo(false);
    }
  }

  const documentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return documentos;

    return documentos.filter((doc) => {
      return (
        doc.titulo?.toLowerCase().includes(termo) ||
        doc.tipo?.toLowerCase().includes(termo) ||
        doc.contexto?.toLowerCase().includes(termo) ||
        doc.aluno?.nome?.toLowerCase().includes(termo) ||
        doc.template?.nome?.toLowerCase().includes(termo)
      );
    });
  }, [documentos, busca]);

  const idsSelecionaveisVisiveis =
    useMemo(
      () =>
        documentosFiltrados
          .filter(
            podeExcluirDocumento
          )
          .map(
            (documento) =>
              documento.id
          ),
      [
        documentosFiltrados,
      ]
    );

  const todosVisiveisSelecionados =
    idsSelecionaveisVisiveis.length >
    0 &&
    idsSelecionaveisVisiveis.every(
      (id) =>
        documentosSelecionados.includes(
          id
        )
    );

  function alternarDocumentoSelecionado(
    documentoId: number
  ) {
    setDocumentosSelecionados(
      (selecionadosAtuais) =>
        selecionadosAtuais.includes(
          documentoId
        )
          ? selecionadosAtuais.filter(
            (id) =>
              id !==
              documentoId
          )
          : [
            ...selecionadosAtuais,
            documentoId,
          ]
    );
  }

  function alternarTodosVisiveis() {
    setDocumentosSelecionados(
      (selecionadosAtuais) => {
        if (
          todosVisiveisSelecionados
        ) {
          return selecionadosAtuais.filter(
            (id) =>
              !idsSelecionaveisVisiveis.includes(
                id
              )
          );
        }

        return Array.from(
          new Set([
            ...selecionadosAtuais,
            ...idsSelecionaveisVisiveis,
          ])
        );
      }
    );
  }

  return (
    <div className="phanyx-docs-page space-y-6">
      {erro && (
        <PhanyxToast
          tipo="erro"
          titulo={t("generated.toastErrorTitle")}
          mensagem={erro}
          onClose={() => setErro("")}
        />
      )}
      <div>
        <h1 className="phanyx-doc-title text-2xl font-bold">{t("generated.title")}</h1>
        <p className="phanyx-doc-muted mt-1">
          {t("generated.description")}
        </p>
      </div>

      {mensagem ? (
        <div className="phanyx-doc-card p-4 text-sm">
          {mensagem}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="phanyx-doc-card overflow-hidden">
            <div className="border-b px-5 py-4">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="phanyx-doc-section-title text-lg font-semibold">{t("generated.historyTitle")}</h2>
                  <p className="phanyx-doc-muted mt-1 text-sm">
                    {t("generated.historyDescription")}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_190px_120px_190px]">
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="phanyx-doc-input min-w-0"
                    placeholder={t("generated.searchPlaceholder")}
                  />

                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="phanyx-doc-input"
                  >
                    <option value="">{t("generated.allTypes")}</option>
                    <option value="CONTRATO">{labelTipo("CONTRATO")}</option>
                    <option value="DECLARACAO">{labelTipo("DECLARACAO")}</option>
                    <option value="RECIBO">{labelTipo("RECIBO")}</option>
                    <option value="COMPROVANTE">{labelTipo("COMPROVANTE")}</option>
                    <option value="TRANCAMENTO">{labelTipo("TRANCAMENTO")}</option>
                    <option value="CANCELAMENTO_MATRICULA">{labelTipo("CANCELAMENTO_MATRICULA")}</option>
                    <option value="COMPARECIMENTO">{labelTipo("COMPARECIMENTO")}</option>
                    <option value="HISTORICO">{labelTipo("HISTORICO")}</option>
                    <option value="OUTRO">{labelTipo("OUTRO")}</option>
                  </select>

                  <button
                    onClick={carregarDocumentos}
                    className="phanyx-doc-secondary-action"
                  >
                    {t("common.reload")}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setConfirmarExcluirTodos(
                        true
                      )
                    }
                    disabled={
                      excluindo ||
                      documentos.length === 0
                    }
                    className="phanyx-doc-danger-action"
                  >
                    {t("generated.deleteUnsigned")}
                  </button>

                </div>
                <div className="phanyx-doc-selection-bar flex flex-col gap-3 rounded-xl p-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="phanyx-doc-selection-label flex cursor-pointer items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={
                          todosVisiveisSelecionados
                        }
                        onChange={
                          alternarTodosVisiveis
                        }
                        disabled={
                          idsSelecionaveisVisiveis.length ===
                          0
                        }
                        className="h-5 w-5 cursor-pointer accent-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      />

                      {t("generated.selectAllVisible")}
                    </label>

                    <span className="phanyx-doc-selection-count text-sm font-semibold">
                      {t("generated.selectedCount", {
                        count:
                          documentosSelecionados.length,
                      })}
                    </span>
                  </div>

                  <div className="w-full md:w-[230px]">
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmarExcluirSelecionados(
                          true
                        )
                      }
                      disabled={
                        excluindo ||
                        documentosSelecionados.length ===
                        0
                      }
                      className="phanyx-doc-danger-action"
                    >
                      {documentosSelecionados.length > 0
                        ? t("generated.deleteSelectedWithCount", {
                            count:
                              documentosSelecionados.length,
                          })
                        : t("generated.deleteSelected")}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="phanyx-doc-muted p-6">{t("generated.loading")}</div>
            ) : documentosFiltrados.length === 0 ? (
              <div className="p-6 text-gray-600">
                {t("generated.empty")}
              </div>
            ) : (
              <div className="divide-y">
                {documentosFiltrados.map((doc) => (
                  <div key={doc.id} className="phanyx-doc-list-row p-5">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {podeExcluirDocumento(doc) ? (
                            <input
                              type="checkbox"
                              checked={
                                documentosSelecionados.includes(
                                  doc.id
                                )
                              }
                              onChange={() =>
                                alternarDocumentoSelecionado(
                                  doc.id
                                )
                              }
                              title={t("generated.selectDocument")}
                              aria-label={t("generated.selectDocumentNamed", { title: doc.titulo })}
                              className="h-5 w-5 cursor-pointer accent-red-600"
                            />
                          ) : null}

                          <h3 className="phanyx-doc-section-title text-base font-semibold">
                            {doc.titulo}
                          </h3>

                          <span className="phanyx-doc-badge">
                            {labelTipo(doc.tipo)}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs ${statusClass(doc.status)}`}
                          >
                            {labelStatus(doc.status)}
                          </span>

                          <span className="phanyx-doc-badge">
                            {doc.exigeAssinatura
                              ? t("generated.requiresSignature")
                              : t("generated.noSignature")}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                          <div>
                            <p className="phanyx-doc-label">{t("common.student")}</p>
                            <p className="phanyx-doc-value">
                              {doc.aluno?.nome || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="phanyx-doc-label">{t("common.enrollment")}</p>
                            <p className="phanyx-doc-value">
                              {doc.matricula?.id ? `#${doc.matricula.id}` : "-"}
                            </p>
                          </div>

                          <div>
                            <p className="phanyx-doc-label">{t("common.context")}</p>
                            <p className="phanyx-doc-value">
                              {doc.contexto || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="phanyx-doc-label">{t("generated.generatedAt")}</p>
                            <p className="phanyx-doc-value">
                              {formatarData(doc.criadoEm, locale)}
                            </p>
                          </div>

                          <div>
                            <p className="phanyx-doc-label">{t("common.template")}</p>
                            <p className="phanyx-doc-value">
                              {doc.template?.nome || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 self-start lg:w-[240px]">
                        <button
                          onClick={() => abrirDocumento(doc.id)}
                          className="phanyx-doc-secondary-action"
                        >
                          {t("common.open")}
                        </button>

                        <button
                          onClick={() =>
                            window.open(
                              montarUrlPdfDocumento(
                                doc
                              ),
                              "_blank"
                            )
                          }
                          className="phanyx-doc-secondary-action"
                        >
                          PDF
                        </button>

                        <button
                          onClick={() => imprimirDocumento(doc)}
                          className="phanyx-doc-secondary-action"
                        >
                          {t("common.print")}
                        </button>

                        <button
                          onClick={() => enviarPorEmail(doc)}
                          className="phanyx-doc-secondary-action"
                        >
                          {t("common.email")}
                        </button>

                        <button
                          onClick={() => enviarPorWhatsApp(doc)}
                          className="phanyx-doc-secondary-action"
                        >
                          {t("common.whatsapp")}
                        </button>

                        {podeExcluirDocumento(doc) ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDocumentoParaExcluir(doc)
                            }
                            disabled={excluindo}
                            title={t("generated.deleteDocument")}
                            className="phanyx-doc-danger-action"
                          >
                            {t("common.delete")}
                          </button>
                        ) : null}

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="phanyx-doc-card min-h-[240px] max-h-[520px] overflow-auto p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="phanyx-doc-section-title text-lg font-semibold">{t("generated.previewTitle")}</h2>
                <p className="phanyx-doc-muted mt-1 text-sm">
                  {t("generated.previewDescription")}
                </p>
              </div>
            </div>

            {loadingDetalhe ? (
              <div className="phanyx-doc-muted mt-6 text-sm">
                {t("generated.loadingDetail")}
              </div>
            ) : !documentoSelecionado ? (
              <div className="phanyx-doc-muted mt-6 text-sm">
                {t("generated.noSelection")}
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <h3 className="phanyx-doc-section-title font-semibold">
                    {documentoSelecionado.titulo}
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    <span className="phanyx-doc-badge">
                      {labelTipo(documentoSelecionado.tipo)}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs ${statusClass(documentoSelecionado.status)}`}
                    >
                      {labelStatus(documentoSelecionado.status)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => imprimirDocumento(documentoSelecionado)}
                    className="phanyx-doc-secondary-action"
                  >
                    {t("common.print")}
                  </button>

                  <button
                    onClick={() => enviarPorEmail(documentoSelecionado)}
                    className="phanyx-doc-secondary-action"
                  >
                    {t("common.email")}
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        montarUrlPdfDocumento(
                          documentoSelecionado
                        ),
                        "_blank"
                      )
                    }
                    className="phanyx-doc-secondary-action"
                  >
                    PDF
                  </button>

                  <button
                    onClick={() => enviarPorWhatsApp(documentoSelecionado)}
                    className="phanyx-doc-secondary-action"
                  >
                    {t("common.whatsapp")}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <p className="phanyx-doc-label">{t("common.student")}</p>
                    <p className="phanyx-doc-value">
                      {documentoSelecionado.aluno?.nome || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="phanyx-doc-label">{t("common.cpf")}</p>
                    <p className="phanyx-doc-value">
                      {documentoSelecionado.aluno?.cpf || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="phanyx-doc-label">{t("common.enrollment")}</p>
                    <p className="phanyx-doc-value">
                      {documentoSelecionado.aluno?.matricula || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="phanyx-doc-label">{t("common.context")}</p>
                    <p className="phanyx-doc-value">
                      {documentoSelecionado.contexto || "-"}
                    </p>
                  </div>
                </div>



                <div className="phanyx-doc-preview p-4">
                  <p className="phanyx-doc-label mb-2 text-sm">
                    {t("generated.documentContent")}
                  </p>
                  <div className="phanyx-doc-value max-h-[300px] overflow-auto whitespace-pre-wrap text-sm leading-7">
                    {documentoSelecionado.conteudo || "-"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {documentoParaExcluir && (
        <PhanyxConfirmModal
          aberto={true}
          titulo={t("generated.deleteDocument")}
          mensagem={t("generated.confirmDeleteOne", { title: documentoParaExcluir.titulo })}
          textoConfirmar={
            excluindo
              ? t("common.deleting")
              : t("generated.confirmDeleteOneButton")
          }
          textoCancelar={t("common.cancel")}
          onConfirmar={() => {
            if (excluindo) {
              return;
            }

            excluirDocumento(
              documentoParaExcluir
            );
          }}
          onCancelar={() => {
            if (!excluindo) {
              setDocumentoParaExcluir(
                null
              );
            }
          }}
        />
      )}

      {confirmarExcluirTodos && (
        <PhanyxConfirmModal
          aberto={true}
          titulo={t("generated.deleteUnsignedTitle")}
          mensagem={t("generated.confirmDeleteUnsigned")}
          textoConfirmar={
            excluindo
              ? t("common.deleting")
              : t("generated.confirmDeleteUnsignedButton")
          }
          textoCancelar={t("common.cancel")}
          onConfirmar={() => {
            if (excluindo) {
              return;
            }

            excluirTodosNaoAssinados();
          }}
          onCancelar={() => {
            if (!excluindo) {
              setConfirmarExcluirTodos(
                false
              );
            }
          }}
        />
      )}

      {confirmarExcluirSelecionados && (
        <PhanyxConfirmModal
          aberto={true}
          titulo={t("generated.deleteSelectedTitle")}
          mensagem={t("generated.confirmDeleteSelected", { count: documentosSelecionados.length })}
          textoConfirmar={
            excluindo
              ? t("common.deleting")
              : t("generated.confirmDeleteSelectedButton", {
                  count: documentosSelecionados.length,
                })
          }
          textoCancelar={t("common.cancel")}
          onConfirmar={() => {
            if (excluindo) {
              return;
            }

            excluirDocumentosSelecionados();
          }}
          onCancelar={() => {
            if (!excluindo) {
              setConfirmarExcluirSelecionados(
                false
              );
            }
          }}
        />
      )}

    </div>
  );
}

export default withAuth(AdminDocumentosGeradosPage, ["admin"]);