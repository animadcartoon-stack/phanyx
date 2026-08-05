"use client";

import { useEffect, useMemo, useState } from "react";
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

function formatarData(data?: string) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR");
}

function labelTipo(tipo?: string) {
  switch (tipo) {
    case "CONTRATO":
      return "Contrato";
    case "DECLARACAO":
      return "Declaração";
    case "RECIBO":
      return "Recibo";
    case "COMPROVANTE":
      return "Comprovante";
    case "TRANCAMENTO":
      return "Trancamento";
    case "COMPARECIMENTO":
      return "Comparecimento";
    case "HISTORICO":
      return "Histórico";
    default:
      return tipo || "-";
  }
}

function labelStatus(status?: string) {
  switch (status) {
    case "RASCUNHO":
      return "Rascunho";
    case "GERADO":
      return "Gerado";
    case "ASSINADO":
      return "Assinado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return status || "-";
  }
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
        throw new Error(data?.error || "Erro ao carregar documentos");
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
      setMensagem(error?.message || "Erro ao carregar documentos");
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
      `Documento: ${doc.titulo}`,
      `Tipo: ${labelTipo(doc.tipo)}`,
      `Aluno: ${doc.aluno?.nome || "-"}`,
      `Matrícula: ${doc.aluno?.matricula || "-"}`,
      `Contexto: ${doc.contexto || "-"}`,
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
            <div><strong>Tipo:</strong> ${labelTipo(doc.tipo)}</div>
            <div><strong>Aluno:</strong> ${doc.aluno?.nome || "-"}</div>
            <div><strong>Matrícula:</strong> ${doc.aluno?.matricula || "-"}</div>
            <div><strong>Contexto:</strong> ${doc.contexto || "-"}</div>
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
      setErro("Não foi possível abrir a janela de impressão. Verifique se o navegador bloqueou pop-ups.");
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
        "O conteúdo do documento foi copiado. Se o email não abrir automaticamente, cole o texto no seu email."
      );
    } catch {
      setMensagem(
        "Tentando abrir o email. Se não abrir, verifique se há um aplicativo de email configurado no computador."
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
        throw new Error(data?.error || "Erro ao carregar documento");
      }

      setDocumentoSelecionado(data);
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao carregar documento");
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
          "Não foi possível excluir o documento."
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
        "Documento excluído com sucesso."
      );

      await carregarDocumentos();
    } catch (error: any) {
      console.error(error);

      setErro(
        error?.message ||
        "Não foi possível excluir o documento."
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
          "Não foi possível excluir os documentos."
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
        "Documentos excluídos com sucesso."
      );

      await carregarDocumentos();
    } catch (error: any) {
      console.error(error);

      setErro(
        error?.message ||
        "Não foi possível excluir os documentos."
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
          "Selecione pelo menos um documento."
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
          "Não foi possível excluir os documentos selecionados."
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
        "Documentos selecionados excluídos com sucesso."
      );

      await carregarDocumentos();
    } catch (error: any) {
      console.error(error);

      setErro(
        error?.message ||
        "Não foi possível excluir os documentos selecionados."
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
          titulo="Não foi possível concluir"
          mensagem={erro}
          onClose={() => setErro("")}
        />
      )}
      <div>
        <h1 className="phanyx-doc-title text-2xl font-bold">📚 Documentos gerados</h1>
        <p className="phanyx-doc-muted mt-1">
          Visualize o histórico de documentos gerados pela instituição.
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
                  <h2 className="phanyx-doc-section-title text-lg font-semibold">Histórico documental</h2>
                  <p className="phanyx-doc-muted mt-1 text-sm">
                    Contratos, declarações, recibos, comprovantes e outros documentos.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_190px_120px_190px]">
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="phanyx-doc-input min-w-0"
                    placeholder="Buscar por título, aluno, contexto..."
                  />

                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="phanyx-doc-input"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="CONTRATO">Contrato</option>
                    <option value="DECLARACAO">Declaração</option>
                    <option value="RECIBO">Recibo</option>
                    <option value="COMPROVANTE">Comprovante</option>
                    <option value="TRANCAMENTO">Trancamento</option>
                    <option value="COMPARECIMENTO">Comparecimento</option>
                    <option value="HISTORICO">Histórico</option>
                    <option value="OUTRO">Outro</option>
                  </select>

                  <button
                    onClick={carregarDocumentos}
                    className="phanyx-doc-secondary-action"
                  >
                    Recarregar
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
                    Excluir não assinados
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

                      Selecionar todos exibidos
                    </label>

                    <span className="phanyx-doc-selection-count text-sm font-semibold">
                      {
                        documentosSelecionados.length
                      }{" "}
                      selecionado(s)
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
                      Excluir selecionados
                      {documentosSelecionados.length >
                        0
                        ? ` (${documentosSelecionados.length})`
                        : ""}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-gray-600">Carregando documentos...</div>
            ) : documentosFiltrados.length === 0 ? (
              <div className="p-6 text-gray-600">
                Nenhum documento encontrado.
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
                              title="Selecionar documento"
                              aria-label={`Selecionar ${doc.titulo}`}
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
                              ? "Exige assinatura"
                              : "Sem assinatura"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                          <div>
                            <p className="phanyx-doc-label">Aluno</p>
                            <p className="phanyx-doc-value">
                              {doc.aluno?.nome || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="phanyx-doc-label">Matrícula</p>
                            <p className="phanyx-doc-value">
                              {doc.matricula?.id ? `#${doc.matricula.id}` : "-"}
                            </p>
                          </div>

                          <div>
                            <p className="phanyx-doc-label">Contexto</p>
                            <p className="phanyx-doc-value">
                              {doc.contexto || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="phanyx-doc-label">Gerado em</p>
                            <p className="phanyx-doc-value">
                              {formatarData(doc.criadoEm)}
                            </p>
                          </div>

                          <div>
                            <p className="phanyx-doc-label">Template</p>
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
                          Abrir
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
                          Imprimir
                        </button>

                        <button
                          onClick={() => enviarPorEmail(doc)}
                          className="phanyx-doc-secondary-action"
                        >
                          Email
                        </button>

                        <button
                          onClick={() => enviarPorWhatsApp(doc)}
                          className="phanyx-doc-secondary-action"
                        >
                          WhatsApp
                        </button>

                        {podeExcluirDocumento(doc) ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDocumentoParaExcluir(doc)
                            }
                            disabled={excluindo}
                            title="Excluir documento"
                            className="phanyx-doc-danger-action"
                          >
                            Excluir
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
                <h2 className="phanyx-doc-section-title text-lg font-semibold">Visualização</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Abra um documento gerado para ver os detalhes.
                </p>
              </div>
            </div>

            {loadingDetalhe ? (
              <div className="mt-6 text-sm text-gray-600">
                Carregando documento...
              </div>
            ) : !documentoSelecionado ? (
              <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">
                Nenhum documento selecionado.
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
                    Imprimir
                  </button>

                  <button
                    onClick={() => enviarPorEmail(documentoSelecionado)}
                    className="phanyx-doc-secondary-action"
                  >
                    Email
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
                    className="rounded-xl border px-3 py-2 text-sm hover:border-red-400 hover:text-red-700"
                  >
                    PDF
                  </button>

                  <button
                    onClick={() => enviarPorWhatsApp(documentoSelecionado)}
                    className="phanyx-doc-secondary-action"
                  >
                    WhatsApp
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <p className="phanyx-doc-label">Aluno</p>
                    <p className="phanyx-doc-value">
                      {documentoSelecionado.aluno?.nome || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="phanyx-doc-label">CPF</p>
                    <p className="phanyx-doc-value">
                      {documentoSelecionado.aluno?.cpf || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="phanyx-doc-label">Matrícula</p>
                    <p className="phanyx-doc-value">
                      {documentoSelecionado.aluno?.matricula || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="phanyx-doc-label">Contexto</p>
                    <p className="phanyx-doc-value">
                      {documentoSelecionado.contexto || "-"}
                    </p>
                  </div>
                </div>



                <div className="phanyx-doc-preview p-4">
                  <p className="phanyx-doc-label mb-2 text-sm">
                    Conteúdo do documento
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
          titulo="Excluir documento"
          mensagem={`Tem certeza que deseja excluir “${documentoParaExcluir.titulo}”? Esta ação não poderá ser desfeita.`}
          textoConfirmar={
            excluindo
              ? "Excluindo..."
              : "Sim, excluir"
          }
          textoCancelar="Cancelar"
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
          titulo="Excluir documentos não assinados"
          mensagem="Esta ação excluirá todos os documentos gerados, rascunhos e cancelados que ainda não foram assinados nesta instituição. Documentos assinados serão preservados. Deseja continuar?"
          textoConfirmar={
            excluindo
              ? "Excluindo..."
              : "Sim, excluir todos"
          }
          textoCancelar="Cancelar"
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
          titulo="Excluir documentos selecionados"
          mensagem={`Você selecionou ${documentosSelecionados.length} documento(s). Tem certeza que deseja excluí-los? Documentos assinados serão preservados.`}
          textoConfirmar={
            excluindo
              ? "Excluindo..."
              : `Excluir ${documentosSelecionados.length} documento(s)`
          }
          textoCancelar="Cancelar"
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