"use client";

import {
  useEffect,
  useMemo,
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

import withAuth from "@/lib/withAuth";

import PhanyxToast from "@/components/ui/PhanyxToast";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

type UnidadeDuracao =
  | "DIAS"
  | "MESES"
  | "SEMESTRES"
  | "INDETERMINADO";

type StatusProcesso =
  | "RASCUNHO"
  | "CONFIRMADO"
  | "ENCERRADO"
  | "CANCELADO";

type MatriculaResumo = {
  id: number;
  numeroMatricula?: string | null;
  status?: string | null;
  excluidaEm?: string | null;

  aluno?: {
    id: number;
    nome: string;
    nomeSocial?: string | null;
  } | null;

  curso?: {
    id: number;
    nome: string;
  } | null;

  polo?: {
    id: number;
    nome: string;
  } | null;

  turmaPrincipal?: {
    id: number;
    nome: string;
  } | null;

  instituicao?: {
    id: number;
    nome: string;
  } | null;
};

type Trancamento = {
  id: number;
  numeroProtocolo: string;
  status: StatusProcesso;
  statusAnterior: string;

  motivo: string;
  observacoes?: string | null;

  dataInicio: string;
  dataRetornoPrevista?: string | null;

  duracaoQuantidade?: number | null;
  duracaoUnidade?: UnidadeDuracao | null;

  registradoPorNomeSnapshot?: string | null;
  registradoPorCargoSnapshot?: string | null;

  confirmadoPorNomeSnapshot?: string | null;
  confirmadoPorCargoSnapshot?: string | null;

  confirmadoEm?: string | null;
  encerradoEm?: string | null;
  canceladoEm?: string | null;

  criadoEm: string;
  atualizadoEm: string;

  _count?: {
    documentosGerados: number;
  };
};

type RespostaGet = {
  success: boolean;
  matricula: MatriculaResumo;
  rascunho: Trancamento | null;
  trancamentos: Trancamento[];
};

type TemplateTrancamento = {
  id: number;
  nome: string;
  tipo: string;
  ativo?: boolean;
};

type ToastState = {
  tipo: "sucesso" | "erro" | "aviso" | "info";
  mensagem: string;
};

function hojeLocal() {
  const agora =
    new Date();

  const ano =
    agora.getFullYear();

  const mes =
    String(
      agora.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      agora.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${ano}-${mes}-${dia}`;
}

function dataParaInput(
  valor?: string | null
) {
  if (!valor) {
    return "";
  }

  return valor.slice(
    0,
    10
  );
}

function AdminTrancamentoMatriculaPage() {
  const t =
    useTranslations(
      "AdminTrancamentoMatricula"
    );

  const tMatricula =
    useTranslations(
      "AdminMatriculasQuarentena"
    );

  const locale =
    useLocale();

  const router =
    useRouter();

  const params =
    useParams();

  const parametroId =
    Array.isArray(
      params?.id
    )
      ? params.id[0]
      : params?.id;

  const matriculaId =
    Number(
      parametroId
    );

  const [
    dados,
    setDados,
  ] =
    useState<RespostaGet | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    processando,
    setProcessando,
  ] =
    useState<
      "salvar" |
      "confirmar" |
      null
    >(null);

  const [
    toast,
    setToast,
  ] =
    useState<ToastState | null>(
      null
    );

  const [
    erroPagina,
    setErroPagina,
  ] =
    useState("");

  const [
    modalConfirmacao,
    setModalConfirmacao,
  ] =
    useState(false);

  const [
    motivo,
    setMotivo,
  ] =
    useState("");

  const [
    dataInicio,
    setDataInicio,
  ] =
    useState(
      hojeLocal()
    );

  const [
    duracaoUnidade,
    setDuracaoUnidade,
  ] =
    useState<
      UnidadeDuracao | ""
    >("");

  const [
    duracaoQuantidade,
    setDuracaoQuantidade,
  ] =
    useState("");

  const [
    dataRetornoPrevista,
    setDataRetornoPrevista,
  ] =
    useState("");

  const [
    observacoes,
    setObservacoes,
  ] =
    useState("");

  const [
    templatesTrancamento,
    setTemplatesTrancamento,
  ] =
    useState<TemplateTrancamento[]>(
      []
    );

  const [
    templateDocumentoId,
    setTemplateDocumentoId,
  ] =
    useState("");

  const [
    carregandoTemplates,
    setCarregandoTemplates,
  ] =
    useState(false);

  const [
    gerandoDocumento,
    setGerandoDocumento,
  ] =
    useState(false);

  const [
    erroTemplates,
    setErroTemplates,
  ] =
    useState("");

  const [
    ultimoDocumentoId,
    setUltimoDocumentoId,
  ] =
    useState<number | null>(
      null
    );

  const rascunho =
    dados?.rascunho ??
    null;

  const trancamentoConfirmado =
    useMemo(
      () =>
        dados?.trancamentos.find(
          (item) =>
            item.status ===
            "CONFIRMADO"
        ) ?? null,
      [
        dados?.trancamentos,
      ]
    );

  useEffect(() => {
    let ativo = true;

    async function carregarTemplatesTrancamento() {
      if (!trancamentoConfirmado) {
        setTemplatesTrancamento(
          []
        );

        setTemplateDocumentoId(
          ""
        );

        setErroTemplates(
          ""
        );

        setUltimoDocumentoId(
          null
        );

        return;
      }

      setCarregandoTemplates(
        true
      );

      setErroTemplates(
        ""
      );

      setUltimoDocumentoId(
        null
      );

      try {
        const resposta =
          await fetch(
            "/api/admin/documentos/templates?somenteAtivos=1",
            {
              credentials:
                "include",

              cache:
                "no-store",
            }
          );

        const payload =
          await resposta
            .json()
            .catch(
              () => null
            );

        if (
          !resposta.ok ||
          !Array.isArray(
            payload
          )
        ) {
          throw new Error(
            "Falha ao carregar templates"
          );
        }

        const filtrados:
          TemplateTrancamento[] =
          payload
            .filter(
              (item: any) =>
                String(
                  item?.tipo || ""
                )
                  .trim()
                  .toUpperCase() ===
                "TRANCAMENTO"
            )
            .map(
              (item: any) => ({
                id:
                  Number(
                    item.id
                  ),

                nome:
                  String(
                    item.nome || ""
                  ),

                tipo:
                  String(
                    item.tipo || ""
                  ),

                ativo:
                  Boolean(
                    item.ativo ?? true
                  ),
              })
            )
            .filter(
              (item) =>
                Number.isInteger(
                  item.id
                ) &&
                item.id > 0 &&
                item.nome.length > 0
            );

        if (!ativo) {
          return;
        }

        setTemplatesTrancamento(
          filtrados
        );

        setTemplateDocumentoId(
          (atual) => {
            const atualValido =
              filtrados.some(
                (item) =>
                  String(
                    item.id
                  ) === atual
              );

            if (atualValido) {
              return atual;
            }

            if (
              filtrados.length === 1
            ) {
              return String(
                filtrados[0].id
              );
            }

            return "";
          }
        );
      }
      catch (error) {
        console.error(
          "Erro ao carregar templates de trancamento:",
          error
        );

        if (ativo) {
          setTemplatesTrancamento(
            []
          );

          setTemplateDocumentoId(
            ""
          );

          setErroTemplates(
            t(
              "documents.errors.loadTemplates"
            )
          );
        }
      }
      finally {
        if (ativo) {
          setCarregandoTemplates(
            false
          );
        }
      }
    }

    void carregarTemplatesTrancamento();

    return () => {
      ativo = false;
    };
  }, [
    trancamentoConfirmado
      ?.id,
  ]);

  async function gerarDocumentoTrancamento() {
    if (!trancamentoConfirmado) {
      return;
    }

    const templateId =
      Number(
        templateDocumentoId
      );

    if (
      !Number.isInteger(
        templateId
      ) ||
      templateId <= 0
    ) {
      setToast({
        tipo: "aviso",

        mensagem:
          t(
            "documents.errors.selectTemplate"
          ),
      });

      return;
    }

    setGerandoDocumento(
      true
    );

    setUltimoDocumentoId(
      null
    );

    try {
      const resposta =
        await fetch(
          "/api/admin/documentos/gerar",
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                locale,

                templateId,

                matriculaId:
                  dados?.matricula.id ??
                  matriculaId,

                trancamentoMatriculaId:
                  trancamentoConfirmado.id,
              }),
          }
        );

      const payload =
        await resposta
          .json()
          .catch(
            () => null
          );

      if (!resposta.ok) {
        console.error(
          "Erro da API ao gerar documento de trancamento:",
          payload
        );

        setToast({
          tipo: "erro",

          mensagem:
            t(
              "documents.errors.generate"
            ),
        });

        return;
      }

      const documentoId =
        Number(
          payload?.id ??
          payload?.documento?.id
        );

      await carregarDados(
        false
      );

      if (
        !Number.isInteger(
          documentoId
        ) ||
        documentoId <= 0
      ) {
        setToast({
          tipo: "erro",

          mensagem:
            t(
              "documents.errors.invalidResponse"
            ),
        });

        return;
      }

      setUltimoDocumentoId(
        documentoId
      );

      setToast({
        tipo: "sucesso",

        mensagem:
          t(
            "documents.messages.generated"
          ),
      });
    }
    catch (error) {
      console.error(
        "Erro ao gerar documento de trancamento:",
        error
      );

      setToast({
        tipo: "erro",

        mensagem:
          t(
            "documents.errors.generate"
          ),
      });
    }
    finally {
      setGerandoDocumento(
        false
      );
    }
  }

  function labelStatusMatricula(
    status?: string | null
  ) {
    switch (status) {
      case "AGUARDANDO":
        return tMatricula(
          "status.AGUARDANDO"
        );

      case "A_INICIAR":
        return tMatricula(
          "status.A_INICIAR"
        );

      case "ATIVA":
        return tMatricula(
          "status.ATIVA"
        );

      case "TRANCADA":
        return tMatricula(
          "status.TRANCADA"
        );

      case "SUSPENSA":
        return tMatricula(
          "status.SUSPENSA"
        );

      case "TRANSFERIDA":
        return tMatricula(
          "status.TRANSFERIDA"
        );

      case "INTERCAMBIO":
        return tMatricula(
          "status.INTERCAMBIO"
        );

      case "CANCELADA":
        return tMatricula(
          "status.CANCELADA"
        );

      case "CONCLUIDA":
        return tMatricula(
          "status.CONCLUIDA"
        );

      default:
        return status || "—";
    }
  }

  function labelStatusProcesso(
    status: StatusProcesso
  ) {
    return t(
      `processStatus.${status}`
    );
  }

  function labelUnidade(
    unidade?: UnidadeDuracao | null
  ) {
    switch (unidade) {
      case "DIAS":
        return t(
          "form.days"
        );

      case "MESES":
        return t(
          "form.months"
        );

      case "SEMESTRES":
        return t(
          "form.semesters"
        );

      case "INDETERMINADO":
        return t(
          "form.indefinite"
        );

      default:
        return "—";
    }
  }

  function formatarData(
    valor?: string | null
  ) {
    if (!valor) {
      return "—";
    }

    const data =
      new Date(
        valor
      );

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle: "medium",
        timeZone: "UTC",
      }
    ).format(
      data
    );
  }

  function formatarDataHora(
    valor?: string | null
  ) {
    if (!valor) {
      return "—";
    }

    const data =
      new Date(
        valor
      );

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(
      data
    );
  }

  function preencherFormulario(
    item: Trancamento | null
  ) {
    if (!item) {
      setMotivo("");
      setDataInicio(
        hojeLocal()
      );
      setDuracaoUnidade("");
      setDuracaoQuantidade("");
      setDataRetornoPrevista("");
      setObservacoes("");
      return;
    }

    setMotivo(
      item.motivo || ""
    );

    setDataInicio(
      dataParaInput(
        item.dataInicio
      )
    );

    setDuracaoUnidade(
      item.duracaoUnidade ||
      ""
    );

    setDuracaoQuantidade(
      item.duracaoQuantidade
        ? String(
          item.duracaoQuantidade
        )
        : ""
    );

    setDataRetornoPrevista(
      dataParaInput(
        item.dataRetornoPrevista
      )
    );

    setObservacoes(
      item.observacoes || ""
    );
  }

  async function carregarDados(
    mostrarCarregamento = true
  ) {
    if (
      !Number.isInteger(
        matriculaId
      ) ||
      matriculaId <= 0
    ) {
      setErroPagina(
        t(
          "errors.load"
        )
      );

      setCarregando(false);
      return;
    }

    if (
      mostrarCarregamento
    ) {
      setCarregando(true);
    }

    setErroPagina("");

    try {
      const resposta =
        await fetch(
          `/api/admin/matriculas/${matriculaId}/trancamento`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

      const payload =
        await resposta
          .json()
          .catch(
            () => null
          );

      if (
        !resposta.ok
      ) {
        throw new Error(
          payload?.error ||
          t(
            "errors.load"
          )
        );
      }

      const recebido =
        payload as RespostaGet;

      setDados(
        recebido
      );

      preencherFormulario(
        recebido.rascunho
      );
    } catch (error) {
      console.error(
        "Erro ao carregar trancamento:",
        error
      );

      setErroPagina(
        t(
          "errors.load"
        )
      );
    } finally {
      if (
        mostrarCarregamento
      ) {
        setCarregando(false);
      }
    }
  }

  useEffect(
    () => {
      carregarDados();
    },
    [
      matriculaId,
    ]
  );

  function mensagemErroApi(
    payload: any
  ) {
    switch (
      payload?.codigo
    ) {
      case "MOTIVO_TRANCAMENTO_OBRIGATORIO":
        return t(
          "errors.reason"
        );

      case "DATA_INICIO_TRANCAMENTO_INVALIDA":
        return t(
          "errors.startDate"
        );

      case "DURACAO_UNIDADE_OBRIGATORIA":
        return t(
          "errors.unit"
        );

      case "DURACAO_QUANTIDADE_INVALIDA":
        return t(
          "errors.quantity"
        );

      case "DATA_RETORNO_INVALIDA":
      case "DATA_RETORNO_OBRIGATORIA":
        return t(
          "errors.returnDate"
        );

      case "DATA_RETORNO_ANTERIOR_INICIO":
        return t(
          "errors.returnBeforeStart"
        );

      case "MATRICULA_ALTERADA_APOS_RASCUNHO":
      case "MATRICULA_ALTERADA_DURANTE_TRANCAMENTO":
        return t(
          "errors.stale"
        );

      case "RASCUNHO_TRANCAMENTO_EXISTENTE":
      case "TRANCAMENTO_ATIVO_EXISTENTE":
        return t(
          "errors.active"
        );

      case "SEM_PERMISSAO":
      case "PERMISSAO_NEGADA":
        return t(
          "errors.permission"
        );

      default:
        return t(
          "errors.generic"
        );
    }
  }

  function montarCorpo() {
    const motivoFinal =
      motivo.trim();

    if (
      motivoFinal.length < 3
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          t(
            "errors.reason"
          ),
      });

      return null;
    }

    if (
      !dataInicio
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          t(
            "errors.startDate"
          ),
      });

      return null;
    }

    if (
      !duracaoUnidade
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          t(
            "errors.unit"
          ),
      });

      return null;
    }

    let quantidade:
      | number
      | null = null;

    if (
      duracaoUnidade !==
      "INDETERMINADO"
    ) {
      quantidade =
        Number(
          duracaoQuantidade
        );

      if (
        !Number.isInteger(
          quantidade
        ) ||
        quantidade <= 0
      ) {
        setToast({
          tipo: "erro",
          mensagem:
            t(
              "errors.quantity"
            ),
        });

        return null;
      }

      if (
        !dataRetornoPrevista
      ) {
        setToast({
          tipo: "erro",
          mensagem:
            t(
              "errors.returnDate"
            ),
        });

        return null;
      }
    }

    if (
      dataRetornoPrevista &&
      dataRetornoPrevista <
        dataInicio
    ) {
      setToast({
        tipo: "erro",
        mensagem:
          t(
            "errors.returnBeforeStart"
          ),
      });

      return null;
    }

    return {
      motivo:
        motivoFinal,

      observacoes:
        observacoes.trim() ||
        null,

      dataInicio,

      dataRetornoPrevista:
        dataRetornoPrevista ||
        null,

      duracaoQuantidade:
        duracaoUnidade ===
        "INDETERMINADO"
          ? null
          : quantidade,

      duracaoUnidade,
    };
  }

  async function salvarRascunho() {
    const corpo =
      montarCorpo();

    if (!corpo) {
      return;
    }

    setProcessando(
      "salvar"
    );

    setToast(
      null
    );

    try {
      const resposta =
        await fetch(
          `/api/admin/matriculas/${matriculaId}/trancamento`,
          {
            method:
              rascunho
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body:
              JSON.stringify(
                rascunho
                  ? {
                    ...corpo,

                    trancamentoId:
                      rascunho.id,

                    acao:
                      "SALVAR_RASCUNHO",
                  }
                  : corpo
              ),
          }
        );

      const payload =
        await resposta
          .json()
          .catch(
            () => null
          );

      if (
        !resposta.ok
      ) {
        setToast({
          tipo: "erro",
          mensagem:
            mensagemErroApi(
              payload
            ),
        });

        return;
      }

      await carregarDados(
        false
      );

      setToast({
        tipo: "sucesso",
        mensagem:
          t(
            "messages.draftSaved"
          ),
      });
    } catch (error) {
      console.error(
        "Erro ao salvar rascunho de trancamento:",
        error
      );

      setToast({
        tipo: "erro",
        mensagem:
          t(
            "errors.generic"
          ),
      });
    } finally {
      setProcessando(
        null
      );
    }
  }

  function abrirConfirmacao() {
    if (!rascunho) {
      setToast({
        tipo: "aviso",
        mensagem:
          t(
            "messages.saveFirst"
          ),
      });

      return;
    }

    const corpo =
      montarCorpo();

    if (!corpo) {
      return;
    }

    setModalConfirmacao(
      true
    );
  }

  async function confirmarTrancamento() {
    setModalConfirmacao(
      false
    );

    if (!rascunho) {
      setToast({
        tipo: "aviso",
        mensagem:
          t(
            "messages.saveFirst"
          ),
      });

      return;
    }

    const corpo =
      montarCorpo();

    if (!corpo) {
      return;
    }

    setProcessando(
      "confirmar"
    );

    setToast(
      null
    );

    try {
      const resposta =
        await fetch(
          `/api/admin/matriculas/${matriculaId}/trancamento`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body:
              JSON.stringify({
                ...corpo,

                trancamentoId:
                  rascunho.id,

                acao:
                  "CONFIRMAR",
              }),
          }
        );

      const payload =
        await resposta
          .json()
          .catch(
            () => null
          );

      if (
        !resposta.ok
      ) {
        setToast({
          tipo: "erro",
          mensagem:
            mensagemErroApi(
              payload
            ),
        });

        await carregarDados(
          false
        );

        return;
      }

      await carregarDados(
        false
      );

      setToast({
        tipo: "sucesso",
        mensagem:
          t(
            "messages.confirmed"
          ),
      });
    } catch (error) {
      console.error(
        "Erro ao confirmar trancamento:",
        error
      );

      setToast({
        tipo: "erro",
        mensagem:
          t(
            "errors.generic"
          ),
      });
    } finally {
      setProcessando(
        null
      );
    }
  }

  const statusBloqueados =
    new Set([
      "CANCELADA",
      "CONCLUIDA",
      "TRANSFERIDA",
      "TRANCADA",
    ]);

  const matricula =
    dados?.matricula ??
    null;

  const bloqueadaPorStatus =
    Boolean(
      matricula?.status &&
      statusBloqueados.has(
        matricula.status
      )
    );

  const bloqueadaPorQuarentena =
    Boolean(
      matricula?.excluidaEm
    );

  const podeEditar =
    !trancamentoConfirmado &&
    !bloqueadaPorStatus &&
    !bloqueadaPorQuarentena;

  if (
    carregando
  ) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
          {t(
            "loading"
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/matriculas"
              )
            }
            className="mb-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            ← {t(
              "back"
            )}
          </button>

          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
            {t(
              "title"
            )}
          </h1>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            {t(
              "subtitle"
            )}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {t(
            "enrollmentId",
            {
              id:
                matriculaId,
            }
          )}
        </div>
      </div>

      {toast && (
        <PhanyxToast
          tipo={
            toast.tipo
          }
          mensagem={
            toast.mensagem
          }
          onClose={() =>
            setToast(
              null
            )
          }
        />
      )}

      {erroPagina && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {erroPagina}
        </div>
      )}

      {matricula && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            {t(
              "summary.title"
            )}
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Info
              label={
                t(
                  "summary.student"
                )
              }
              value={
                matricula
                  .aluno
                  ?.nomeSocial ||
                matricula
                  .aluno
                  ?.nome ||
                "—"
              }
            />

            <Info
              label={
                t(
                  "summary.enrollment"
                )
              }
              value={
                matricula
                  .numeroMatricula ||
                `#${matricula.id}`
              }
            />

            <Info
              label={
                t(
                  "summary.course"
                )
              }
              value={
                matricula
                  .curso
                  ?.nome ||
                "—"
              }
            />

            <Info
              label={
                t(
                  "summary.status"
                )
              }
              value={
                labelStatusMatricula(
                  matricula.status
                )
              }
            />

            <Info
              label={
                t(
                  "summary.institution"
                )
              }
              value={
                matricula
                  .instituicao
                  ?.nome ||
                "—"
              }
            />

            <Info
              label={
                t(
                  "summary.campus"
                )
              }
              value={
                matricula
                  .polo
                  ?.nome ||
                "—"
              }
            />

            <Info
              label={
                t(
                  "summary.class"
                )
              }
              value={
                matricula
                  .turmaPrincipal
                  ?.nome ||
                "—"
              }
            />
          </div>
        </section>
      )}

      {trancamentoConfirmado && (
        <Aviso
          titulo={
            t(
              "warnings.title"
            )
          }
          texto={
            t(
              "warnings.confirmed"
            )
          }
        />
      )}

      {!trancamentoConfirmado &&
        bloqueadaPorQuarentena && (
          <Aviso
            titulo={
              t(
                "warnings.title"
              )
            }
            texto={
              t(
                "warnings.quarantine"
              )
            }
          />
        )}

      {!trancamentoConfirmado &&
        !bloqueadaPorQuarentena &&
        bloqueadaPorStatus && (
          <Aviso
            titulo={
              t(
                "warnings.title"
              )
            }
            texto={
              t(
                "warnings.blocked"
              )
            }
          />
        )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {t(
                "process.title"
              )}
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {t(
                "process.description"
              )}
            </p>
          </div>

          {rascunho && (
            <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {t(
                "process.draft"
              )}
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Info
            label={
              t(
                "process.protocol"
              )
            }
            value={
              rascunho
                ?.numeroProtocolo ||
              t(
                "process.pendingProtocol"
              )
            }
          />

          <Info
            label={
              t(
                "process.responsible"
              )
            }
            value={
              rascunho
                ?.registradoPorNomeSnapshot ||
              t(
                "process.notRecorded"
              )
            }
          />

          <Info
            label={
              t(
                "process.role"
              )
            }
            value={
              rascunho
                ?.registradoPorCargoSnapshot ||
              "—"
            }
          />
        </div>

        <fieldset
          disabled={
            !podeEditar ||
            processando !== null
          }
          className="mt-6 space-y-5 disabled:opacity-70"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t(
                "form.reason"
              )} *
            </label>

            <textarea
              value={
                motivo
              }
              onChange={
                (event) =>
                  setMotivo(
                    event.target.value
                  )
              }
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-amber-500 dark:focus:ring-amber-950"
              placeholder={
                t(
                  "form.reasonPlaceholder"
                )
              }
            />

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t(
                "form.reasonHelp"
              )}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Campo
              label={
                t(
                  "form.startDate"
                )
              }
            >
              <input
                type="date"
                value={
                  dataInicio
                }
                onChange={
                  (event) =>
                    setDataInicio(
                      event.target.value
                    )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </Campo>

            <Campo
              label={
                t(
                  "form.durationUnit"
                )
              }
            >
              <select
                value={
                  duracaoUnidade
                }
                onChange={
                  (event) => {
                    const valor =
                      event.target
                        .value as
                        | UnidadeDuracao
                        | "";

                    setDuracaoUnidade(
                      valor
                    );

                    if (
                      valor ===
                      "INDETERMINADO"
                    ) {
                      setDuracaoQuantidade(
                        ""
                      );
                    }
                  }
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">
                  {t(
                    "form.selectUnit"
                  )}
                </option>

                <option value="DIAS">
                  {t(
                    "form.days"
                  )}
                </option>

                <option value="MESES">
                  {t(
                    "form.months"
                  )}
                </option>

                <option value="SEMESTRES">
                  {t(
                    "form.semesters"
                  )}
                </option>

                <option value="INDETERMINADO">
                  {t(
                    "form.indefinite"
                  )}
                </option>
              </select>
            </Campo>

            <Campo
              label={
                t(
                  "form.durationQuantity"
                )
              }
            >
              <input
                type="number"
                min={1}
                step={1}
                disabled={
                  duracaoUnidade ===
                  "INDETERMINADO"
                }
                value={
                  duracaoQuantidade
                }
                onChange={
                  (event) =>
                    setDuracaoQuantidade(
                      event.target.value
                    )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-800"
              />
            </Campo>

            <Campo
              label={
                duracaoUnidade ===
                "INDETERMINADO"
                  ? t(
                    "form.expectedReturnOptional"
                  )
                  : t(
                    "form.expectedReturn"
                  )
              }
            >
              <input
                type="date"
                value={
                  dataRetornoPrevista
                }
                onChange={
                  (event) =>
                    setDataRetornoPrevista(
                      event.target.value
                    )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </Campo>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t(
                "form.observations"
              )}
            </label>

            <textarea
              value={
                observacoes
              }
              onChange={
                (event) =>
                  setObservacoes(
                    event.target.value
                  )
              }
              rows={4}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-amber-500 dark:focus:ring-amber-950"
              placeholder={
                t(
                  "form.observationsPlaceholder"
                )
              }
            />
          </div>
        </fieldset>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={
              salvarRascunho
            }
            disabled={
              !podeEditar ||
              processando !== null
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            {processando ===
            "salvar"
              ? t(
                "actions.saving"
              )
              : t(
                "actions.saveDraft"
              )}
          </button>

          <button
            type="button"
            onClick={
              abrirConfirmacao
            }
            disabled={
              !podeEditar ||
              !rascunho ||
              processando !== null
            }
            className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processando ===
            "confirmar"
              ? t(
                "actions.confirming"
              )
              : t(
                "actions.confirm"
              )}
          </button>
        </div>
      </section>

      {trancamentoConfirmado && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                {t(
                  "documents.title"
                )}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {t(
                  "documents.subtitle",
                  {
                    protocol:
                      trancamentoConfirmado
                        .numeroProtocolo,
                  }
                )}
              </p>
            </div>

            <div className="self-start rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
              {t(
                "documents.generatedCount",
                {
                  count:
                    trancamentoConfirmado
                      ._count
                      ?.documentosGerados ??
                    0,
                }
              )}
            </div>
          </div>

          {erroTemplates ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {erroTemplates}
            </div>
          ) : carregandoTemplates ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              {t(
                "documents.loadingTemplates"
              )}
            </div>
          ) :
          templatesTrancamento.length ===
          0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t(
                  "documents.noTemplates"
                )}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.open(
                    "/admin/documentos/templates",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                className="mt-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {t(
                  "documents.manageTemplates"
                )}
              </button>
            </div>
          ) : (
            <div className="mt-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t(
                    "documents.template"
                  )}
                </span>

                <select
                  value={
                    templateDocumentoId
                  }
                  onChange={(evento) =>
                    setTemplateDocumentoId(
                      evento.target.value
                    )
                  }
                  disabled={
                    gerandoDocumento
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-900"
                >
                  <option value="">
                    {t(
                      "documents.selectTemplate"
                    )}
                  </option>

                  {templatesTrancamento.map(
                    (template) => (
                      <option
                        key={template.id}
                        value={template.id}
                      >
                        {template.nome}
                      </option>
                    )
                  )}
                </select>
              </label>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t(
                  "documents.help"
                )}
              </p>

              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      "/admin/documentos/templates",
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  disabled={
                    gerandoDocumento
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  {t(
                    "documents.manageTemplates"
                  )}
                </button>

                {ultimoDocumentoId && (
                  <button
                    type="button"
                    onClick={() =>
                      window.open(
                        `/api/admin/documentos/pdf/${ultimoDocumentoId}`,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200 dark:hover:bg-blue-950"
                  >
                    {t(
                      "documents.openPdf"
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={
                    gerarDocumentoTrancamento
                  }
                  disabled={
                    gerandoDocumento ||
                    !templateDocumentoId
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {gerandoDocumento
                    ? t(
                      "documents.generating"
                    )
                    : t(
                      "documents.generate"
                    )}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          {t(
            "history.title"
          )}
        </h2>

        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t(
            "history.subtitle"
          )}
        </p>

        {!dados?.trancamentos.length ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {t(
              "history.empty"
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {dados.trancamentos.map(
              (item) => (
                <article
                  key={
                    item.id
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t(
                          "history.protocol"
                        )}
                      </div>

                      <div className="mt-1 font-semibold text-slate-950 dark:text-white">
                        {
                          item.numeroProtocolo
                        }
                      </div>
                    </div>

                    <span className="inline-flex self-start rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      {labelStatusProcesso(
                        item.status
                      )}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Info
                      label={
                        t(
                          "history.previousStatus"
                        )
                      }
                      value={
                        labelStatusMatricula(
                          item.statusAnterior
                        )
                      }
                    />

                    <Info
                      label={
                        t(
                          "history.period"
                        )
                      }
                      value={
                        `${formatarData(
                          item.dataInicio
                        )} → ${
                          item.dataRetornoPrevista
                            ? formatarData(
                              item.dataRetornoPrevista
                            )
                            : t(
                              "history.noReturn"
                            )
                        }`
                      }
                    />

                    <Info
                      label={
                        t(
                          "history.duration"
                        )
                      }
                      value={
                        item.duracaoUnidade ===
                        "INDETERMINADO"
                          ? labelUnidade(
                            item.duracaoUnidade
                          )
                          : `${
                            item.duracaoQuantidade ??
                            "—"
                          } ${labelUnidade(
                            item.duracaoUnidade
                          )}`
                      }
                    />

                    <Info
                      label={
                        t(
                          "history.documents"
                        )
                      }
                      value={
                        item._count
                          ?.documentosGerados ??
                        0
                      }
                    />
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t(
                        "history.reason"
                      )}
                    </div>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">
                      {
                        item.motivo
                      }
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <Info
                      label={
                        t(
                          "history.registeredBy"
                        )
                      }
                      value={
                        item
                          .registradoPorNomeSnapshot ||
                        "—"
                      }
                    />

                    <Info
                      label={
                        t(
                          "history.confirmedBy"
                        )
                      }
                      value={
                        item
                          .confirmadoPorNomeSnapshot ||
                        "—"
                      }
                    />

                    <Info
                      label={
                        t(
                          "history.createdAt"
                        )
                      }
                      value={
                        formatarDataHora(
                          item.criadoEm
                        )
                      }
                    />

                    <Info
                      label={
                        t(
                          "history.confirmedAt"
                        )
                      }
                      value={
                        formatarDataHora(
                          item.confirmadoEm
                        )
                      }
                    />
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>

      <PhanyxConfirmModal
        aberto={
          modalConfirmacao
        }
        titulo={
          t(
            "confirmModal.title"
          )
        }
        mensagem={
          t(
            "confirmModal.message"
          )
        }
        textoConfirmar={
          t(
            "confirmModal.confirm"
          )
        }
        textoCancelar={
          t(
            "confirmModal.cancel"
          )
        }
        textoCarregando={
          t(
            "actions.confirming"
          )
        }
        onConfirmar={
          confirmarTrancamento
        }
        onCancelar={() =>
          setModalConfirmacao(
            false
          )
        }
      />
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </span>

      {children}
    </label>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value:
    | string
    | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>

      <div className="mt-1 break-words font-medium text-slate-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function Aviso({
  titulo,
  texto,
}: {
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <div className="font-semibold text-amber-950 dark:text-amber-100">
        {titulo}
      </div>

      <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-200">
        {texto}
      </p>
    </div>
  );
}

export default withAuth(
  AdminTrancamentoMatriculaPage,
  [
    "admin",
  ]
);