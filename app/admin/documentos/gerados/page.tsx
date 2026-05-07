"use client";

import { useEffect, useMemo, useState } from "react";
import withAuth from "@/lib/withAuth";
import PhanyxToast from "@/components/ui/PhanyxToast";

type DocumentoGerado = {
  id: number;
  titulo: string;
  tipo: string;
  contexto?: string | null;
  status: string;
  exigeAssinatura: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
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

      setDocumentos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error(error);
      setDocumentos([]);
      setMensagem(error?.message || "Erro ao carregar documentos");
    } finally {
      setLoading(false);
    }
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

  function enviarPorEmail(doc: DocumentoGerado) {
    const assunto = encodeURIComponent(doc.titulo);
    const corpo = encodeURIComponent(montarTextoCompartilhamento(doc));
    window.open(`mailto:?subject=${assunto}&body=${corpo}`, "_self");
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

  return (
    <div className="space-y-6">
      {erro && (
  <PhanyxToast
    tipo="erro"
    titulo="Não foi possível imprimir"
    mensagem={erro}
    onClose={() => setErro("")}
  />
)}
      <div>
        <h1 className="text-2xl font-bold">📚 Documentos gerados</h1>
        <p className="mt-1 text-gray-600">
          Visualize o histórico de documentos gerados pela instituição.
        </p>
      </div>

      {mensagem ? (
        <div className="rounded-2xl border bg-white p-4 text-sm text-gray-700 shadow-sm">
          {mensagem}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Histórico documental</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Contratos, declarações, recibos, comprovantes e outros documentos.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="rounded-xl border px-3 py-2"
                    placeholder="Buscar por título, aluno, contexto..."
                  />

                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="rounded-xl border px-3 py-2 bg-white"
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
                    className="rounded-xl border px-3 py-2 hover:border-blue-400"
                  >
                    Recarregar
                  </button>
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
                  <div key={doc.id} className="p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {doc.titulo}
                          </h3>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                            {labelTipo(doc.tipo)}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs ${statusClass(doc.status)}`}
                          >
                            {labelStatus(doc.status)}
                          </span>

                          <span
                            className={[
                              "rounded-full px-3 py-1 text-xs",
                              doc.exigeAssinatura
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700",
                            ].join(" ")}
                          >
                            {doc.exigeAssinatura
                              ? "Exige assinatura"
                              : "Sem assinatura"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                          <div>
                            <p className="text-gray-500">Aluno</p>
                            <p className="font-medium text-gray-800">
                              {doc.aluno?.nome || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-500">Matrícula</p>
                            <p className="font-medium text-gray-800">
                              {doc.matricula?.id ? `#${doc.matricula.id}` : "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-500">Contexto</p>
                            <p className="font-medium text-gray-800">
                              {doc.contexto || "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-500">Gerado em</p>
                            <p className="font-medium text-gray-800">
                              {formatarData(doc.criadoEm)}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-500">Template</p>
                            <p className="font-medium text-gray-800">
                              {doc.template?.nome || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:w-[320px] xl:justify-end">
  <button
    onClick={() => abrirDocumento(doc.id)}
    className="rounded-xl border px-3 py-2 text-sm hover:border-blue-400 hover:text-blue-700"
  >
    Abrir
  </button>

<button
  onClick={() => window.open(`/api/admin/documentos/pdf/${doc.id}`, "_blank")}
  className="rounded-xl border px-3 py-2 text-sm hover:border-rose-400 hover:text-rose-700"
>
  PDF
</button>

  <button
    onClick={() => imprimirDocumento(doc)}
    className="rounded-xl border px-3 py-2 text-sm hover:border-slate-400 hover:text-slate-700"
  >
    Imprimir
  </button>

  <button
    onClick={() => enviarPorEmail(doc)}
    className="rounded-xl border px-3 py-2 text-sm hover:border-indigo-400 hover:text-indigo-700"
  >
    Email
  </button>

  <button
    onClick={() => enviarPorWhatsApp(doc)}
    className="rounded-xl border px-3 py-2 text-sm hover:border-green-400 hover:text-green-700"
  >
    WhatsApp
  </button>

  <button
    onClick={() => window.open(`/api/admin/documentos/gerados/${doc.id}`, "_blank")}
    className="rounded-xl border px-3 py-2 text-sm hover:border-amber-400 hover:text-amber-700"
  >
    JSON
  </button>
</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm min-h-[420px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Visualização</h2>
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
              <div className="mt-6 text-sm text-gray-500">
                Nenhum documento selecionado.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">
                    {documentoSelecionado.titulo}
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
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
                    className="rounded-xl border px-3 py-2 text-sm hover:border-slate-400 hover:text-slate-700"
                  >
                    Imprimir
                  </button>

                  <button
                    onClick={() => enviarPorEmail(documentoSelecionado)}
                    className="rounded-xl border px-3 py-2 text-sm hover:border-indigo-400 hover:text-indigo-700"
                  >
                    Email
                  </button>

<button
  onClick={() => window.open(`/api/admin/documentos/pdf/${documentoSelecionado.id}`, "_blank")}
  className="rounded-xl border px-3 py-2 text-sm hover:border-red-400 hover:text-red-700"
>
  PDF
</button>

                  <button
                    onClick={() => enviarPorWhatsApp(documentoSelecionado)}
                    className="rounded-xl border px-3 py-2 text-sm hover:border-green-400 hover:text-green-700"
                  >
                    WhatsApp
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Aluno</p>
                    <p className="font-medium text-gray-800">
                      {documentoSelecionado.aluno?.nome || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">CPF</p>
                    <p className="font-medium text-gray-800">
                      {documentoSelecionado.aluno?.cpf || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Matrícula</p>
                    <p className="font-medium text-gray-800">
                      {documentoSelecionado.aluno?.matricula || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Contexto</p>
                    <p className="font-medium text-gray-800">
                      {documentoSelecionado.contexto || "-"}
                    </p>
                  </div>
                </div>



                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Conteúdo do documento
                  </p>
                  <div className="max-h-[380px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-slate-800">
                    {documentoSelecionado.conteudo || "-"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminDocumentosGeradosPage, ["admin"]);