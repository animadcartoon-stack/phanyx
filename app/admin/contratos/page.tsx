"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type AlunoOption = {
  id: number;
  nome: string;
  matricula?: string | null;
  email?: string | null;
  statusAluno?: string | null;
};

type ContratoResposta = {
  matricula?: {
    id: number;
    status?: string | null;
    semestre?: number | null;
  };
  contrato?: {
    id: number;
    status: string;
    tokenAssinatura?: string | null;
    dataCriacao?: string | null;
    dataAssinatura?: string | null;
  } | null;
  aluno: {
    id: number;
    nome: string;
    cpf?: string | null;
    matricula?: string | null;
  };
  instituicao: {
    nomeFantasia: string;
    cnpj: string;
    responsavelNome: string;
    responsavelCargo: string;
    cidadeAssinatura: string;
    logoUrl?: string | null;
  };
  curso: string;
  disciplinas: string[];
  valorContrato: number;
  contratoFinal: string;
  observacoesContrato?: string;
};

function formatarMoeda(valor: number, locale: string) {
  return Number(valor || 0).toLocaleString(locale, {
    style: "currency",
    currency: "BRL",
  });
}

export default function AdminContratosPage() {
  const t = useTranslations("AdminContracts");
  const locale = useLocale();

  const [busca, setBusca] = useState("");
  const [alunos, setAlunos] = useState<AlunoOption[]>([]);
  const [alunoId, setAlunoId] = useState("");
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [loadingContrato, setLoadingContrato] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [contrato, setContrato] = useState<ContratoResposta | null>(null);
  const [enviandoAssinatura, setEnviandoAssinatura] = useState(false);

  async function buscarAlunos() {
    try {
      setLoadingAlunos(true);
      setMensagem("");

      const query = new URLSearchParams();
      if (busca.trim()) query.set("busca", busca.trim());

      const res = await fetch(
        `/api/admin/alunos/busca-simples?${query.toString()}`,
        {
          cache: "no-store",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro da API ao buscar alunos:", data?.error);
        throw new Error(t("errors.searchStudents"));
      }

      setAlunos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      setMensagem(error?.message || t("errors.searchStudents"));
      setAlunos([]);
    } finally {
      setLoadingAlunos(false);
    }
  }

  async function carregarContrato(id: string) {
    if (!id) {
      setContrato(null);
      return;
    }

    try {
      setLoadingContrato(true);
      setMensagem("");

      const res = await fetch(`/api/admin/contratos/gerar?alunoId=${id}&locale=${encodeURIComponent(locale)}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro da API ao gerar contrato:", data?.error);
        throw new Error(t("errors.generateContract"));
      }

      setContrato(data);
    } catch (error: any) {
      setMensagem(error?.message || t("errors.generateContract"));
      setContrato(null);
    } finally {
      setLoadingContrato(false);
    }
  }

  async function enviarParaAssinatura() {
    try {
      if (!contrato?.contrato?.id) {
        setMensagem(t("messages.generateBeforeSending"));
        return;
      }

      setEnviandoAssinatura(true);
      setMensagem("");

      const res = await fetch("/api/admin/documentos/enviar-assinatura", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contratoId: contrato.contrato.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Erro da API ao enviar contrato para assinatura:",
          data?.error,
        );
        throw new Error(t("errors.sendForSignature"));
      }

      setMensagem(t("messages.sentForSignature"));
    } catch (error: any) {
      setMensagem(error?.message || t("errors.sendForSignature"));
    } finally {
      setEnviandoAssinatura(false);
    }
  }

  function normalizarTexto(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/y/g, "i")
      .trim();
  }

  const termoBuscaNormalizado = normalizarTexto(busca);

  const alunosFiltrados = [...alunos]
    .filter((aluno) => {
      if (!termoBuscaNormalizado) return true;

      const nome = normalizarTexto(aluno.nome || "");
      const email = normalizarTexto(aluno.email || "");
      const matricula = normalizarTexto(aluno.matricula || "");

      return (
        nome.includes(termoBuscaNormalizado) ||
        email.includes(termoBuscaNormalizado) ||
        matricula.includes(termoBuscaNormalizado)
      );
    })
    .sort((a, b) => {
      const nomeA = normalizarTexto(a.nome || "");
      const nomeB = normalizarTexto(b.nome || "");

      const aComeca = nomeA.startsWith(termoBuscaNormalizado);
      const bComeca = nomeB.startsWith(termoBuscaNormalizado);

      if (aComeca && !bComeca) return -1;
      if (!aComeca && bComeca) return 1;

      return nomeA.localeCompare(nomeB, locale);
    });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void buscarAlunos();
    }, 300);

    return () => window.clearTimeout(timeoutId);
    // buscarAlunos depende intencionalmente do termo digitado e do idioma ativo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, locale]);

  return (
    <div className="phanyx-docs-page max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="phanyx-doc-title text-2xl font-bold">
          📄 {t("header.title")}
        </h1>

        <p className="phanyx-doc-muted mt-1 text-sm">
          {t("header.description")}
        </p>
      </div>

      {mensagem && (
        <div className="phanyx-doc-card p-4 text-sm">
          <span className="phanyx-doc-value">{mensagem}</span>
        </div>
      )}

      <div className="phanyx-doc-card p-6">
        <h2 className="phanyx-doc-section-title mb-4 text-lg font-semibold">
          {t("student.sectionTitle")}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="phanyx-doc-label mb-1 block text-sm">
              {t("student.searchLabel")}
            </label>

            <div className="relative">
              <input
                autoComplete="off"
                spellCheck={false}
                name="buscarAlunoContrato"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="phanyx-doc-input"
                placeholder={t("student.searchPlaceholder")}
              />

              {busca.trim() && alunosFiltrados.length > 0 && (
                <div className="phanyx-doc-autocomplete max-h-64 overflow-auto">
                  {alunosFiltrados.map((aluno) => (
                    <button
                      key={aluno.id}
                      type="button"
                      onClick={() => {
                        setAlunoId(String(aluno.id));
                        setBusca(
                          `${aluno.nome}${aluno.matricula ? ` - ${aluno.matricula}` : ""
                          }${aluno.email ? ` - ${aluno.email}` : ""}`,
                        );
                        void carregarContrato(String(aluno.id));
                      }}
                      className="phanyx-doc-autocomplete-option"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold">{aluno.nome}</span>

                        <span className="text-xs opacity-90">
                          {aluno.matricula || ""}
                          {aluno.email ? ` • ${aluno.email}` : ""}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loadingAlunos && (
              <p className="phanyx-doc-muted mt-1 text-xs">
                {t("student.loading")}
              </p>
            )}
          </div>

          <div>
            <label className="phanyx-doc-label mb-1 block text-sm">
              {t("student.selectLabel")}
            </label>

            <select
              value={alunoId}
              onChange={(e) => {
                setAlunoId(e.target.value);
                void carregarContrato(e.target.value);
              }}
              className="phanyx-doc-input phanyx-contract-student-select"
            >
              <option value="">{t("student.selectOption")}</option>

              {alunosFiltrados.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome}
                  {aluno.matricula ? ` - ${aluno.matricula}` : ""}
                  {aluno.email ? ` - ${aluno.email}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loadingContrato ? (
        <div className="phanyx-doc-card p-6">
          <span className="phanyx-doc-muted">
            {t("contract.generating")}
          </span>
        </div>
      ) : contrato ? (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="phanyx-doc-card p-6 lg:col-span-2">
              <h2 className="phanyx-doc-section-title mb-4 text-lg font-semibold">
                {t("contract.previewTitle")}
              </h2>

              <div
                className="phanyx-doc-preview p-4 text-sm leading-7 [&_p]:mb-4 [&_h1]:mb-6 [&_h1]:text-center [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mb-4 [&_h2]:mt-6 [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{
                  __html: contrato.contratoFinal,
                }}
              />

              {contrato.observacoesContrato && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-semibold">
                    {t("contract.notesTitle")}
                  </p>

                  <p className="mt-2 whitespace-pre-wrap">
                    {contrato.observacoesContrato}
                  </p>
                </div>
              )}
            </div>

            <div className="phanyx-doc-card p-6">
              <h2 className="phanyx-doc-section-title mb-4 text-lg font-semibold">
                {t("summary.title")}
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="phanyx-doc-muted">
                    {t("summary.institution")}
                  </p>
                  <p className="phanyx-doc-value">
                    {contrato.instituicao.nomeFantasia}
                  </p>
                </div>

                <div>
                  <p className="phanyx-doc-muted">
                    {t("summary.student")}
                  </p>
                  <p className="phanyx-doc-value">{contrato.aluno.nome}</p>
                </div>

                <div>
                  <p className="phanyx-doc-muted">{t("summary.cpf")}</p>
                  <p className="phanyx-doc-value">
                    {contrato.aluno.cpf || "-"}
                  </p>
                </div>

                <div>
                  <p className="phanyx-doc-muted">
                    {t("summary.enrollment")}
                  </p>
                  <p className="phanyx-doc-value">
                    {contrato.aluno.matricula || "-"}
                  </p>
                </div>

                <div>
                  <p className="phanyx-doc-muted">{t("summary.course")}</p>
                  <p className="phanyx-doc-value">{contrato.curso}</p>
                </div>

                <div>
                  <p className="phanyx-doc-muted">
                    {t("summary.contractValue")}
                  </p>
                  <p className="phanyx-doc-value">
                    {formatarMoeda(contrato.valorContrato, locale)}
                  </p>
                </div>

                <div>
                  <p className="phanyx-doc-muted">
                    {t("summary.signingCity")}
                  </p>
                  <p className="phanyx-doc-value">
                    {contrato.instituicao.cidadeAssinatura}
                  </p>
                </div>

                <div>
                  <p className="phanyx-doc-muted">
                    {t("summary.legalRepresentative")}
                  </p>
                  <p className="phanyx-doc-value">
                    {contrato.instituicao.responsavelNome} -{" "}
                    {contrato.instituicao.responsavelCargo}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  className="phanyx-doc-primary-action w-full"
                  onClick={() => {
                    if (!alunoId) return;

                    window.open(
                      `/api/admin/contratos/pdf?alunoId=${alunoId}&locale=${encodeURIComponent(locale)}`,
                      "_blank",
                    );
                  }}
                >
                  {t("actions.generatePdf")}
                </button>

                <button
                  type="button"
                  onClick={enviarParaAssinatura}
                  disabled={
                    enviandoAssinatura ||
                    contrato?.contrato?.status === "ASSINADO"
                  }
                  className="mt-3 w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {contrato?.contrato?.status === "ASSINADO"
                    ? t("actions.alreadySigned")
                    : enviandoAssinatura
                      ? t("actions.sending")
                      : t("actions.sendForSignature")}
                </button>
              </div>
            </div>
          </div>

          <div className="phanyx-doc-card p-6">
            <h2 className="phanyx-doc-section-title mb-4 text-lg font-semibold">
              {t("subjects.title")}
            </h2>

            {contrato.disciplinas.length === 0 ? (
              <p className="phanyx-doc-muted text-sm">
                {t("subjects.none")}
              </p>
            ) : (
              <ul className="phanyx-doc-value list-disc space-y-2 pl-5 text-sm">
                {contrato.disciplinas.map((disciplina, index) => (
                  <li key={`${disciplina}-${index}`}>{disciplina}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
      <style jsx global>{`
  /* Select de aluno — tema Sistema */

  html[data-theme-choice="system"][data-theme="dark"]
    .phanyx-contract-student-select,
  html[data-theme-choice="system"][data-theme="dark"]
    .phanyx-contract-student-select option,
  html[data-theme-choice="system"].dark
    .phanyx-contract-student-select,
  html[data-theme-choice="system"].dark
    .phanyx-contract-student-select option {
    background-color: #18181b !important;
    color: #fafafa !important;
  }

  html[data-theme-choice="system"][data-theme="light"]
    .phanyx-contract-student-select,
  html[data-theme-choice="system"][data-theme="light"]
    .phanyx-contract-student-select option {
    background-color: #ffffff !important;
    color: #0f172a !important;
  }
`}</style>
    </div>
  );
}
