"use client";

import Link from "next/link";
import {
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  DragEvent,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type GrupoCampo =
  | "OBRA"
  | "AUTORIA"
  | "PUBLICACAO"
  | "CLASSIFICACAO"
  | "EXEMPLAR"
  | "AQUISICAO";

type ColunaImportacao = {
  indice: number;
  nome: string;
  destinoSugerido: string | null;
  grupo: GrupoCampo | null;
  confianca: "ALTA" | null;
};

type CampoDestino = {
  chave: string;
  grupo: GrupoCampo;
  obrigatorio: boolean;
};

type LinhaAmostra = {
  linha: number;
  valores: string[];
};

type AlertaImportacao = {
  codigo: string;
  quantidade: number;
};

type AnaliseImportacao = {
  ok?: boolean;
  error?: string;
  codigo?: string;

  arquivo: {
    nome: string;
    planilha: string;
    planilhasDisponiveis: string[];
    linhaCabecalho: number;
    tamanhoBytes: number;
    extensao: string;
  };

  resumo: {
    registros: number;
    colunas: number;
    camposReconhecidos: number;
    camposNaoReconhecidos: number;
    linhasSemTitulo: number;
  };

  colunas: ColunaImportacao[];
  amostra: LinhaAmostra[];
  alertas: AlertaImportacao[];
  camposDestino: CampoDestino[];
};

type ResultadoValidacao = {
  indice: number;
  linha: number;
  titulo: string | null;
  autor: string | null;
  isbn10: string | null;
  isbn13: string | null;
  doi: string | null;
  codigoInterno: string | null;
  codigoBarras: string | null;
  numeroTombo: string | null;
  patrimonio: string | null;
  acaoObra:
    | "CRIAR_NOVA"
    | "VINCULAR_EXISTENTE"
    | "REUTILIZAR_DO_ARQUIVO"
    | "REVISAR_DUPLICIDADE"
    | "INVALIDA";
  motivoObra: string;
  itemExistente: {
    id: number;
    titulo: string;
    status: string;
  } | null;
  situacaoExemplar:
    | "SEM_EXEMPLAR"
    | "NOVO_EXEMPLAR"
    | "CONFLITO"
    | "AVISO";
  conflitos: Array<{
    tipo: string;
    valor: string;
    origem: "BANCO" | "ARQUIVO";
    exemplarId?: number;
    itemId?: number;
    itemTitulo?: string;
  }>;
  avisos: Array<{
    tipo: string;
    valor: string;
    exemplarId?: number;
    itemId?: number;
    itemTitulo?: string;
  }>;
};

type ResultadoImportacaoFinal = {
  loteId: string;
  arquivoNome: string;
  registros: number;
  obrasCriadas: number;
  obrasVinculadas: number;
  obrasReutilizadas: number;
  exemplaresCriados: number;
  autoresCriados: number;
  editorasCriadas: number;

  capasZip: number;
  capasUrl: number;
  capasIsbn: number;
  capasPreservadas: number;
  semCapa: number;
  falhasCapas: number;
  capasNoPacote: number;
};

type RespostaImportacaoFinal = {
  ok?: boolean;
  error?: string;
  codigo?: string;
  resultado?: ResultadoImportacaoFinal;
};
type ValidacaoImportacao = {
  ok?: boolean;
  error?: string;
  codigo?: string;
  resumo: {
    registros: number;
    novasObras: number;
    reutilizacoesArquivo: number;
    obrasExistentes: number;
    possiveisDuplicidades: number;
    invalidos: number;
    novosExemplares: number;
    conflitosExemplares: number;
    avisosExemplares: number;
  };
  resultados: ResultadoValidacao[];
};
const ORDEM_GRUPOS: GrupoCampo[] = [
  "OBRA",
  "AUTORIA",
  "PUBLICACAO",
  "CLASSIFICACAO",
  "EXEMPLAR",
  "AQUISICAO",
];

function formatarBytes(
  bytes: number,
  locale: string,
) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  const unidades = [
    "B",
    "KB",
    "MB",
    "GB",
  ];

  let valor = bytes;
  let indice = 0;

  while (
    valor >= 1024 &&
    indice < unidades.length - 1
  ) {
    valor /= 1024;
    indice += 1;
  }

  return `${new Intl.NumberFormat(
    locale,
    {
      maximumFractionDigits:
        indice === 0 ? 0 : 1,
    },
  ).format(valor)} ${unidades[indice]}`;
}

export default function ImportarAcervoPage() {
  const t =
    useTranslations(
      "AdminLibraryImport",
    );

  const traduzir =
    t as unknown as (
      chave: string,
      valores?: Record<
        string,
        string | number
      >,
    ) => string;

  const locale = useLocale();

  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [arquivo, setArquivo] =
    useState<File | null>(null);

  const [analise, setAnalise] =
    useState<AnaliseImportacao | null>(
      null,
    );

  const [
    mapeamento,
    setMapeamento,
  ] = useState<
    Record<number, string>
  >({});

  const [analisando, setAnalisando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [validando, setValidando] =
    useState(false);

  const [validacao, setValidacao] =
    useState<ValidacaoImportacao | null>(
      null,
    );

  const [
    confirmacaoAberta,
    setConfirmacaoAberta,
  ] = useState(false);

  const [
    importando,
    setImportando,
  ] = useState(false);

  const [
    resultadoImportacao,
    setResultadoImportacao,
  ] = useState<ResultadoImportacaoFinal | null>(
    null,
  );

  const [capasZip, setCapasZip] =
    useState<File | null>(
      null,
    );

  const [
    copiarCapasUrl,
    setCopiarCapasUrl,
  ] = useState(true);

  const [
    buscarCapasIsbn,
    setBuscarCapasIsbn,
  ] = useState(false);

  const camposPorGrupo =
    useMemo(() => {
      if (!analise) {
        return new Map<
          GrupoCampo,
          CampoDestino[]
        >();
      }

      const mapa = new Map<
        GrupoCampo,
        CampoDestino[]
      >();

      for (
        const grupo of
        ORDEM_GRUPOS
      ) {
        mapa.set(
          grupo,
          analise.camposDestino.filter(
            (campo) =>
              campo.grupo === grupo,
          ),
        );
      }

      return mapa;
    }, [analise]);

  const quantidadeMapeada =
    useMemo(
      () =>
        Object.values(
          mapeamento,
        ).filter(Boolean).length,
      [mapeamento],
    );

  const tituloMapeado =
    Object.values(
      mapeamento,
    ).includes("titulo");

  function selecionarArquivo(
    novoArquivo: File | null,
  ) {
    if (!novoArquivo) {
      return;
    }

    setArquivo(novoArquivo);
    setAnalise(null);
    setMapeamento({});
    setValidacao(null);
    setResultadoImportacao(null);
    setConfirmacaoAberta(false);
    setBuscarCapasIsbn(false);
    setCapasZip(null);
    setErro("");
  }

  function aoSelecionarArquivo(
    evento:
      ChangeEvent<HTMLInputElement>,
  ) {
    selecionarArquivo(
      evento.target.files?.[0] ??
        null,
    );
  }

  function aoSoltarArquivo(
    evento:
      DragEvent<HTMLDivElement>,
  ) {
    evento.preventDefault();

    selecionarArquivo(
      evento.dataTransfer
        .files?.[0] ?? null,
    );
  }

  function limparTudo() {
    setArquivo(null);
    setAnalise(null);
    setMapeamento({});
    setValidacao(null);
    setResultadoImportacao(null);
    setConfirmacaoAberta(false);
    setErro("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function analisar() {
    if (!arquivo) {
      setErro(
        t("errors.fileRequired"),
      );
      return;
    }

    setAnalisando(true);
    setErro("");

    try {
      const formulario =
        new FormData();

      formulario.append(
        "arquivo",
        arquivo,
      );

      const resposta =
        await fetch(
          "/api/admin/biblioteca/importacao/pre-analise",
          {
            method: "POST",
            credentials: "include",
            cache: "no-store",
            body: formulario,
          },
        );

      const tipoConteudo =
        resposta.headers.get(
          "content-type",
        ) ?? "";

      if (
        !tipoConteudo.includes(
          "application/json",
        )
      ) {
        throw new Error(
          t(
            "errors.invalidResponse",
          ),
        );
      }

      const dados =
        (await resposta.json()) as
          AnaliseImportacao;

      if (!resposta.ok) {
        throw new Error(
          dados.error ||
            t("errors.analyze"),
        );
      }

      const inicial:
        Record<number, string> = {};

      for (
        const coluna of
        dados.colunas
      ) {
        inicial[coluna.indice] =
          coluna.destinoSugerido ??
          "";
      }

      setMapeamento(inicial);
      setAnalise(dados);

      const extensao =
        dados.arquivo.extensao
          .toLowerCase();

      if (
        extensao === "mrc" ||
        extensao === "marc" ||
        extensao === "xml"
      ) {
        setBuscarCapasIsbn(
          true,
        );
      }
    } catch (falha) {
      setAnalise(null);
      setMapeamento({});

      setErro(
        falha instanceof Error
          ? falha.message
          : t("errors.analyze"),
      );
    } finally {
      setAnalisando(false);
    }
  }

  function alterarMapeamento(
    indice: number,
    destino: string,
  ) {
    setValidacao(null);
    setMapeamento(
      (atual) => {
        const proximo = {
          ...atual,
        };

        if (destino) {
          for (
            const chave of
            Object.keys(proximo)
          ) {
            const outroIndice =
              Number(chave);

            if (
              outroIndice !==
                indice &&
              proximo[
                outroIndice
              ] === destino
            ) {
              proximo[
                outroIndice
              ] = "";
            }
          }
        }

        proximo[indice] =
          destino;

        return proximo;
      },
    );
  }

  async function validarContraAcervo() {
    if (
      !arquivo ||
      !analise
    ) {
      return;
    }

    if (!tituloMapeado) {
      setErro(
        t("errors.titleMapping"),
      );
      return;
    }

    setValidando(true);
    setErro("");

    try {
      const formulario =
        new FormData();

      formulario.append(
        "arquivo",
        arquivo,
      );

      formulario.append(
        "mapeamento",
        JSON.stringify(
          mapeamento,
        ),
      );

      const resposta =
        await fetch(
          "/api/admin/biblioteca/importacao/validar",
          {
            method: "POST",
            credentials: "include",
            cache: "no-store",
            body: formulario,
          },
        );

      const tipoConteudo =
        resposta.headers.get(
          "content-type",
        ) ?? "";

      if (
        !tipoConteudo.includes(
          "application/json",
        )
      ) {
        throw new Error(
          t(
            "errors.invalidResponse",
          ),
        );
      }

      const dados =
        (await resposta.json()) as
          ValidacaoImportacao;

      if (!resposta.ok) {
        throw new Error(
          dados.error ||
            t(
              "validation.error",
            ),
        );
      }

      setValidacao(
        dados,
      );
    } catch (falha) {
      setValidacao(null);

      setErro(
        falha instanceof Error
          ? falha.message
          : t(
              "validation.error",
            ),
      );
    } finally {
      setValidando(false);
    }
  }
  const possuiBloqueiosImportacao =
    Boolean(
      validacao &&
      (
        validacao.resumo.possiveisDuplicidades > 0 ||
        validacao.resumo.invalidos > 0 ||
        validacao.resumo.conflitosExemplares > 0
      ),
    );

  async function confirmarImportacao() {
    if (
      !arquivo ||
      !analise ||
      !validacao ||
      possuiBloqueiosImportacao
    ) {
      return;
    }

    setImportando(true);
    setErro("");

    try {
      const formulario =
        new FormData();

      formulario.append(
        "arquivo",
        arquivo,
      );

      formulario.append(
        "mapeamento",
        JSON.stringify(
          mapeamento,
        ),
      );

      formulario.append(
        "confirmacao",
        "IMPORTAR",
      );

      if (capasZip) {
        formulario.append(
          "capasZip",
          capasZip,
        );
      }

      formulario.append(
        "copiarCapasUrl",
        copiarCapasUrl
          ? "true"
          : "false",
      );

      formulario.append(
        "buscarCapasIsbn",
        buscarCapasIsbn
          ? "true"
          : "false",
      );

      const resposta =
        await fetch(
          "/api/admin/biblioteca/importacao/executar",
          {
            method: "POST",
            credentials: "include",
            cache: "no-store",
            body: formulario,
          },
        );

      const tipoConteudo =
        resposta.headers.get(
          "content-type",
        ) ?? "";

      if (
        !tipoConteudo.includes(
          "application/json",
        )
      ) {
        throw new Error(
          t(
            "errors.invalidResponse",
          ),
        );
      }

      const dados =
        (await resposta.json()) as
          RespostaImportacaoFinal;

      if (
        !resposta.ok ||
        !dados.resultado
      ) {
        throw new Error(
          dados.error ||
            t(
              "importExecution.error",
            ),
        );
      }

      setResultadoImportacao(
        dados.resultado,
      );

      setConfirmacaoAberta(
        false,
      );
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : t(
              "importExecution.error",
            ),
      );

      setConfirmacaoAberta(
        false,
      );
    } finally {
      setImportando(false);
    }
  }
  function rotuloCampo(
    chave: string,
  ) {
    return traduzir(
      `fields.${chave}`,
    );
  }

  function rotuloGrupo(
    grupo: GrupoCampo,
  ) {
    return traduzir(
      `groups.${grupo}`,
    );
  }

  function rotuloAlerta(
    alerta: AlertaImportacao,
  ) {
    return traduzir(
      `alerts.codes.${alerta.codigo}`,
      {
        count:
          alerta.quantidade,
      },
    );
  }

  const etapas = [
    {
      numero: 1,
      titulo:
        t("steps.file"),
      ativa: !analise,
      concluida: Boolean(
        analise,
      ),
    },
    {
      numero: 2,
      titulo:
        t("steps.mapping"),
      ativa: Boolean(
        analise &&
        !validacao
      ),
      concluida: Boolean(
        validacao,
      ),
    },
    {
      numero: 3,
      titulo:
        t("steps.validation"),
      ativa: Boolean(
        validacao,
      ),
      concluida: false,
    },
    {
      numero: 4,
      titulo:
        t("steps.import"),
      ativa: Boolean(
        validacao &&
        !resultadoImportacao
      ),
      concluida: Boolean(
        resultadoImportacao
      ),
    },
  ];

  return (
    <main className="phanyx-library-import min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8 dark:bg-slate-950 dark:text-slate-100">
      <style jsx global>{`
        html[data-theme="system"]
          .phanyx-library-import {
          background: #242424 !important;
          color: #ffffff !important;
          color-scheme: dark;
        }

        html[data-theme="system"]
          .phanyx-library-import
          .import-card {
          background: #2d2d2d !important;
          border-color: #505050 !important;
          color: #ffffff !important;
        }

        html[data-theme="system"]
          .phanyx-library-import
          .import-muted {
          color: #d1d5db !important;
        }

        html[data-theme="system"]
          .phanyx-library-import
          select,
        html[data-theme="system"]
          .phanyx-library-import
          .import-input {
          background: #383838 !important;
          border-color: #606060 !important;
          color: #ffffff !important;
        }

        html[data-theme="system"]
          .phanyx-library-import
          option {
          background: #383838 !important;
          color: #ffffff !important;
        }

        html[data-theme="system"]
          .phanyx-library-import
          table {
          color: #ffffff !important;
        }

        html[data-theme="system"]
          .phanyx-library-import
          thead {
          background: #383838 !important;
        }

        html[data-theme="system"]
          .phanyx-library-import
          tbody tr {
          border-color: #505050 !important;
        }
      `}</style>

      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                {t("eyebrow")}
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                {t("title")}
              </h1>

              <p className="import-muted mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("description")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {analise ? (
                <button
                  type="button"
                  onClick={
                    limparTudo
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {t(
                    "actions.restart",
                  )}
                </button>
              ) : null}

              <Link
                href="/admin/biblioteca/acervo"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {t(
                  "backToCollection",
                )}
              </Link>
            </div>
          </div>
        </section>

        <section
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label={t(
            "steps.ariaLabel",
          )}
        >
          {etapas.map(
            (etapa) => (
              <div
                key={
                  etapa.numero
                }
                className={[
                  "import-card rounded-2xl border p-4 transition",
                  etapa.ativa
                    ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
                    : etapa.concluida
                      ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                      : "border-slate-200 bg-white opacity-60 dark:border-slate-800 dark:bg-slate-900",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black",
                      etapa.ativa
                        ? "bg-emerald-600 text-white"
                        : etapa.concluida
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                    ].join(
                      " ",
                    )}
                  >
                    {etapa.concluida
                      ? "✓"
                      : etapa.numero}
                  </span>

                  <strong className="text-sm">
                    {
                      etapa.titulo
                    }
                  </strong>
                </div>
              </div>
            ),
          )}
        </section>

        {!analise ? (
          <section className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="mb-5">
              <h2 className="text-xl font-black">
                {t(
                  "upload.title",
                )}
              </h2>

              <p className="import-muted mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t(
                  "upload.description",
                )}
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xls,.xlsx,.mrc,.marc,.xml"
              className="hidden"
              onChange={
                aoSelecionarArquivo
              }
            />

            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                inputRef.current?.click()
              }
              onKeyDown={(
                evento,
              ) => {
                if (
                  evento.key ===
                    "Enter" ||
                  evento.key === " "
                ) {
                  evento.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(
                evento,
              ) =>
                evento.preventDefault()
              }
              onDrop={
                aoSoltarArquivo
              }
              className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-emerald-500 hover:bg-emerald-50/60 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/20"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm dark:bg-slate-900">
                📥
              </div>

              <p className="mt-4 text-base font-black">
                {arquivo
                  ? arquivo.name
                  : t(
                      "upload.choose",
                    )}
              </p>

              <p className="import-muted mt-2 text-sm text-slate-500 dark:text-slate-400">
                {arquivo
                  ? formatarBytes(
                      arquivo.size,
                      locale,
                    )
                  : t(
                      "upload.dropHint",
                    )}
              </p>

              <p className="import-muted mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t(
                  "upload.fileTypes",
                )}
              </p>
            </div>

            {erro ? (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
              >
                {erro}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              {arquivo ? (
                <button
                  type="button"
                  disabled={
                    analisando
                  }
                  onClick={() =>
                    inputRef.current?.click()
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {t(
                    "upload.change",
                  )}
                </button>
              ) : null}

              <button
                type="button"
                disabled={
                  !arquivo ||
                  analisando
                }
                onClick={() =>
                  void analisar()
                }
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analisando
                  ? t(
                      "upload.analyzing",
                    )
                  : t(
                      "upload.analyze",
                    )}
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="import-muted text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t(
                    "summary.records",
                  )}
                </span>

                <strong className="mt-2 block text-3xl font-black">
                  {analise.resumo.registros.toLocaleString(
                    locale,
                  )}
                </strong>
              </div>

              <div className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="import-muted text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t(
                    "summary.columns",
                  )}
                </span>

                <strong className="mt-2 block text-3xl font-black">
                  {
                    analise.resumo
                      .colunas
                  }
                </strong>
              </div>

              <div className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="import-muted text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t(
                    "summary.recognized",
                  )}
                </span>

                <strong className="mt-2 block text-3xl font-black text-emerald-700 dark:text-emerald-400">
                  {
                    analise.resumo
                      .camposReconhecidos
                  }
                </strong>
              </div>

              <div className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <span className="import-muted text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t(
                    "summary.unrecognized",
                  )}
                </span>

                <strong className="mt-2 block text-3xl font-black">
                  {
                    analise.resumo
                      .camposNaoReconhecidos
                  }
                </strong>
              </div>
            </section>

            <section className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <span className="import-muted block text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t(
                      "summary.file",
                    )}
                  </span>

                  <strong className="mt-1 block break-all">
                    {
                      analise
                        .arquivo.nome
                    }
                  </strong>
                </div>

                <div>
                  <span className="import-muted block text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t(
                      "summary.sheet",
                    )}
                  </span>

                  <strong className="mt-1 block">
                    {
                      analise
                        .arquivo
                        .planilha
                    }
                  </strong>
                </div>

                <div>
                  <span className="import-muted block text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t(
                      "summary.headerLine",
                    )}
                  </span>

                  <strong className="mt-1 block">
                    {
                      analise
                        .arquivo
                        .linhaCabecalho
                    }
                  </strong>
                </div>

                <div>
                  <span className="import-muted block text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t(
                      "summary.fileSize",
                    )}
                  </span>

                  <strong className="mt-1 block">
                    {formatarBytes(
                      analise
                        .arquivo
                        .tamanhoBytes,
                      locale,
                    )}
                  </strong>
                </div>
              </div>
            </section>

            {analise.alertas.length >
            0 ? (
              <section className="import-card rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm dark:border-amber-800 dark:bg-amber-950/20 sm:p-6">
                <h2 className="text-lg font-black text-amber-950 dark:text-amber-100">
                  {t(
                    "alerts.title",
                  )}
                </h2>

                <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                  {t(
                    "alerts.description",
                  )}
                </p>

                <div className="mt-4 space-y-2">
                  {analise.alertas.map(
                    (
                      alerta,
                    ) => (
                      <div
                        key={
                          alerta.codigo
                        }
                        className="rounded-xl border border-amber-200 bg-white/70 px-4 py-3 text-sm font-semibold text-amber-950 dark:border-amber-900 dark:bg-slate-950/40 dark:text-amber-100"
                      >
                        {rotuloAlerta(
                          alerta,
                        )}
                      </div>
                    ),
                  )}
                </div>
              </section>
            ) : null}

            <section className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">
                    {t(
                      "mapping.title",
                    )}
                  </h2>

                  <p className="import-muted mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {t(
                      "mapping.description",
                    )}
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {t(
                    "mapping.mappedCount",
                    {
                      count:
                        quantidadeMapeada,
                      total:
                        analise
                          .colunas
                          .length,
                    },
                  )}
                </span>
              </div>

              {!tituloMapeado ? (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
                >
                  {t(
                    "errors.titleMapping",
                  )}
                </div>
              ) : null}

              <div className="mt-5 space-y-3">
                {analise.colunas.map(
                  (
                    coluna,
                  ) => (
                    <div
                      key={
                        coluna.indice
                      }
                      className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800 lg:grid-cols-[minmax(0,1fr)_48px_minmax(0,1.25fr)] lg:items-center"
                    >
                      <div className="min-w-0">
                        <span className="import-muted block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          {t(
                            "mapping.sourceColumn",
                          )}
                        </span>

                        <strong className="mt-1 block truncate">
                          {
                            coluna.nome
                          }
                        </strong>
                      </div>

                      <div
                        className="hidden text-center text-xl text-slate-400 lg:block"
                        aria-hidden="true"
                      >
                        →
                      </div>

                      <div>
                        <label className="import-muted mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          {t(
                            "mapping.destination",
                          )}
                        </label>

                        <select
                          className="import-input w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          value={
                            mapeamento[
                              coluna
                                .indice
                            ] ?? ""
                          }
                          onChange={(
                            evento,
                          ) =>
                            alterarMapeamento(
                              coluna.indice,
                              evento
                                .target
                                .value,
                            )
                          }
                        >
                          <option value="">
                            {t(
                              "mapping.ignore",
                            )}
                          </option>

                          {ORDEM_GRUPOS.map(
                            (
                              grupo,
                            ) => {
                              const campos =
                                camposPorGrupo.get(
                                  grupo,
                                ) ??
                                [];

                              if (
                                campos.length ===
                                0
                              ) {
                                return null;
                              }

                              return (
                                <optgroup
                                  key={
                                    grupo
                                  }
                                  label={rotuloGrupo(
                                    grupo,
                                  )}
                                >
                                  {campos.map(
                                    (
                                      campo,
                                    ) => (
                                      <option
                                        key={
                                          campo.chave
                                        }
                                        value={
                                          campo.chave
                                        }
                                      >
                                        {rotuloCampo(
                                          campo.chave,
                                        )}
                                        {campo.obrigatorio
                                          ? ` — ${t(
                                              "mapping.required",
                                            )}`
                                          : ""}
                                      </option>
                                    ),
                                  )}
                                </optgroup>
                              );
                            },
                          )}
                        </select>

                        {coluna.destinoSugerido ===
                          mapeamento[
                            coluna
                              .indice
                          ] &&
                        coluna.destinoSugerido ? (
                          <span className="mt-1 block text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            {t(
                              "mapping.automatic",
                            )}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>

            <section className="import-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
                <h2 className="text-xl font-black">
                  {t(
                    "preview.title",
                  )}
                </h2>

                <p className="import-muted mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {t(
                    "preview.description",
                  )}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                        {t(
                          "preview.row",
                        )}
                      </th>

                      {analise.colunas.map(
                        (
                          coluna,
                        ) => (
                          <th
                            key={
                              coluna.indice
                            }
                            className="min-w-[180px] px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500"
                          >
                            {
                              coluna.nome
                            }
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {analise.amostra.map(
                      (
                        linha,
                      ) => (
                        <tr
                          key={
                            linha.linha
                          }
                          className="border-t border-slate-100 dark:border-slate-800"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-black">
                            {
                              linha.linha
                            }
                          </td>

                          {analise.colunas.map(
                            (
                              coluna,
                            ) => (
                              <td
                                key={
                                  coluna.indice
                                }
                                className="max-w-[320px] px-4 py-3 align-top text-slate-700 dark:text-slate-300"
                              >
                                <div className="max-h-20 overflow-hidden break-words">
                                  {linha
                                    .valores[
                                    coluna
                                      .indice
                                  ] ||
                                    "—"}
                                </div>
                              </td>
                            ),
                          )}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div>
                <h2 className="text-xl font-black">
                  {t("covers.title")}
                </h2>

                <p className="import-muted mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {t("covers.description")}
                </p>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <label className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <span className="block text-sm font-black">
                    {t("covers.zipLabel")}
                  </span>

                  <span className="import-muted mt-1 block text-xs text-slate-500 dark:text-slate-400">
                    {t("covers.zipHint")}
                  </span>

                  <input
                    type="file"
                    accept=".zip,application/zip"
                    className="import-input mt-3 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                    onChange={(evento) =>
                      setCapasZip(
                        evento.target.files?.[0] ??
                          null,
                      )
                    }
                  />

                  {capasZip ? (
                    <strong className="mt-2 block text-xs text-emerald-700 dark:text-emerald-400">
                      {capasZip.name}
                    </strong>
                  ) : null}
                </label>

                <div className="space-y-3">
                  <label className="flex gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={copiarCapasUrl}
                      onChange={(evento) =>
                        setCopiarCapasUrl(
                          evento.target.checked,
                        )
                      }
                      className="mt-1 h-4 w-4"
                    />

                    <span>
                      <strong className="block text-sm">
                        {t("covers.copyUrl")}
                      </strong>

                      <span className="import-muted mt-1 block text-xs text-slate-500 dark:text-slate-400">
                        {t("covers.copyUrlHint")}
                      </span>
                    </span>
                  </label>

                  <label className="flex gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <input
                      type="checkbox"
                      checked={buscarCapasIsbn}
                      onChange={(evento) =>
                        setBuscarCapasIsbn(
                          evento.target.checked,
                        )
                      }
                      className="mt-1 h-4 w-4"
                    />

                    <span>
                      <strong className="block text-sm">
                        {t("covers.searchIsbn")}
                      </strong>

                      <span className="import-muted mt-1 block text-xs text-slate-500 dark:text-slate-400">
                        {t("covers.searchIsbnHint")}
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                {t("covers.priority")}
              </div>
            </section>

            <section className="import-card rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black text-emerald-950 dark:text-emerald-100">
                    {validacao
                      ? t("validation.completedTitle")
                      : t("ready.title")}
                  </h2>

                  <p className="mt-1 max-w-3xl text-sm text-emerald-800 dark:text-emerald-200">
                    {validacao
                      ? t("validation.completedDescription")
                      : t("ready.description")}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    !tituloMapeado ||
                    validando
                  }
                  onClick={() =>
                    void validarContraAcervo()
                  }
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {validando
                    ? t("validation.validating")
                    : validacao
                      ? t("validation.validateAgain")
                      : t("ready.continue")}
                </button>
              </div>

              {erro ? (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
                >
                  {erro}
                </div>
              ) : null}
            </section>

            {validacao ? (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="import-muted text-xs font-bold uppercase tracking-wide text-slate-500">
                      {t("validation.summary.newWorks")}
                    </span>
                    <strong className="mt-2 block text-3xl font-black text-emerald-700 dark:text-emerald-400">
                      {validacao.resumo.novasObras}
                    </strong>
                  </div>

                  <div className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="import-muted text-xs font-bold uppercase tracking-wide text-slate-500">
                      {t("validation.summary.existingWorks")}
                    </span>
                    <strong className="mt-2 block text-3xl font-black">
                      {validacao.resumo.obrasExistentes}
                    </strong>
                  </div>

                  <div className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="import-muted text-xs font-bold uppercase tracking-wide text-slate-500">
                      {t("validation.summary.possibleDuplicates")}
                    </span>
                    <strong className="mt-2 block text-3xl font-black text-amber-700 dark:text-amber-400">
                      {validacao.resumo.possiveisDuplicidades}
                    </strong>
                  </div>

                  <div className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="import-muted text-xs font-bold uppercase tracking-wide text-slate-500">
                      {t("validation.summary.copyConflicts")}
                    </span>
                    <strong className="mt-2 block text-3xl font-black text-red-700 dark:text-red-400">
                      {validacao.resumo.conflitosExemplares}
                    </strong>
                  </div>
                </section>

                <section className="import-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
                    <h2 className="text-xl font-black">
                      {t("validation.resultsTitle")}
                    </h2>
                    <p className="import-muted mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {t("validation.resultsDescription")}
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-950">
                        <tr>
                          <th className="px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                            {t("validation.row")}
                          </th>
                          <th className="min-w-[260px] px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                            {t("validation.work")}
                          </th>
                          <th className="min-w-[220px] px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                            {t("validation.workResult")}
                          </th>
                          <th className="min-w-[220px] px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                            {t("validation.copyResult")}
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {validacao.resultados.map(
                          (resultado) => (
                            <tr
                              key={resultado.indice}
                              className="border-t border-slate-100 dark:border-slate-800"
                            >
                              <td className="whitespace-nowrap px-4 py-4 font-black">
                                {resultado.linha}
                              </td>

                              <td className="px-4 py-4 align-top">
                                <strong className="block">
                                  {resultado.titulo || "—"}
                                </strong>

                                {resultado.autor ? (
                                  <span className="import-muted mt-1 block text-xs text-slate-500">
                                    {resultado.autor}
                                  </span>
                                ) : null}

                                {(resultado.isbn13 ||
                                  resultado.isbn10 ||
                                  resultado.doi) ? (
                                  <span className="import-muted mt-1 block text-xs text-slate-500">
                                    {resultado.isbn13 ||
                                      resultado.isbn10 ||
                                      resultado.doi}
                                  </span>
                                ) : null}
                              </td>

                              <td className="px-4 py-4 align-top">
                                <span
                                  className={[
                                    "inline-flex rounded-full px-2.5 py-1 text-xs font-black",
                                    resultado.acaoObra === "CRIAR_NOVA"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                                      : resultado.acaoObra === "VINCULAR_EXISTENTE"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                                        : resultado.acaoObra === "REVISAR_DUPLICIDADE"
                                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                                          : resultado.acaoObra === "INVALIDA"
                                            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
                                  ].join(" ")}
                                >
                                  {traduzir(
                                    `validation.workActions.${resultado.acaoObra}`,
                                  )}
                                </span>

                                {resultado.itemExistente ? (
                                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                                    #{resultado.itemExistente.id} ·{" "}
                                    {resultado.itemExistente.titulo}
                                  </div>
                                ) : null}
                              </td>

                              <td className="px-4 py-4 align-top">
                                <span
                                  className={[
                                    "inline-flex rounded-full px-2.5 py-1 text-xs font-black",
                                    resultado.situacaoExemplar === "NOVO_EXEMPLAR"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                                      : resultado.situacaoExemplar === "CONFLITO"
                                        ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                                        : resultado.situacaoExemplar === "AVISO"
                                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                                  ].join(" ")}
                                >
                                  {traduzir(
                                    `validation.copyActions.${resultado.situacaoExemplar}`,
                                  )}
                                </span>

                                {resultado.conflitos.length > 0 ? (
                                  <div className="mt-2 space-y-1">
                                    {resultado.conflitos.map(
                                      (conflito, indice) => (
                                        <div
                                          key={`${conflito.tipo}-${indice}`}
                                          className="text-xs font-semibold text-red-700 dark:text-red-300"
                                        >
                                          {traduzir(
                                            "validation.conflictLine",
                                            {
                                              field: conflito.tipo,
                                              value: conflito.valor,
                                              source:
                                                conflito.origem === "BANCO"
                                                  ? t("validation.database")
                                                  : t("validation.file"),
                                            },
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                ) : null}

                                {resultado.avisos.length > 0 ? (
                                  <div className="mt-2 space-y-1">
                                    {resultado.avisos.map(
                                      (aviso, indice) => (
                                        <div
                                          key={`${aviso.tipo}-${indice}`}
                                          className="text-xs font-semibold text-amber-700 dark:text-amber-300"
                                        >
                                          {traduzir(
                                            "validation.assetWarning",
                                            {
                                              value: aviso.valor,
                                            },
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {!resultadoImportacao ? (
              <section className="import-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h2 className="text-lg font-black">
                          {t("validation.nextTitle")}
                        </h2>
                        <p className="import-muted mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                          {t("validation.nextDescription")}
                        </p>
                      </div>

                      {resultadoImportacao ? (
                        <Link
                          href="/admin/biblioteca/acervo"
                          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700"
                        >
                          {t("importExecution.viewCollection")}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            possuiBloqueiosImportacao ||
                            importando
                          }
                          onClick={() =>
                            setConfirmacaoAberta(true)
                          }
                          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                        >
                          {t("validation.importButton")}
                        </button>
                      )}
                    </div>
                  </section>
            ) : null}
              </>
            ) : null}
          </>
        )}
        {resultadoImportacao ? (
          <section className="import-card rounded-2xl border border-emerald-300 bg-emerald-50 p-5 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/20 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-black text-emerald-950 dark:text-emerald-100">
                  {t("importExecution.successTitle")}
                </h2>

                <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
                  {t("importExecution.successDescription")}
                </p>

                <p className="mt-3 break-all text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  {t("importExecution.batchId")}:{" "}
                  {resultadoImportacao.loteId}
                </p>
              </div>

              <Link
                href="/admin/biblioteca/acervo"
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-center text-sm font-black text-white transition hover:bg-emerald-700"
              >
                {t("importExecution.viewCollection")}
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-emerald-200 bg-white/70 p-4 dark:border-emerald-900 dark:bg-slate-950/30">
                <span className="block text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {t("importExecution.worksCreated")}
                </span>
                <strong className="mt-1 block text-2xl font-black">
                  {resultadoImportacao.obrasCriadas}
                </strong>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white/70 p-4 dark:border-emerald-900 dark:bg-slate-950/30">
                <span className="block text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {t("importExecution.copiesCreated")}
                </span>
                <strong className="mt-1 block text-2xl font-black">
                  {resultadoImportacao.exemplaresCriados}
                </strong>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white/70 p-4 dark:border-emerald-900 dark:bg-slate-950/30">
                <span className="block text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {t("importExecution.authorsCreated")}
                </span>
                <strong className="mt-1 block text-2xl font-black">
                  {resultadoImportacao.autoresCriados}
                </strong>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white/70 p-4 dark:border-emerald-900 dark:bg-slate-950/30">
                <span className="block text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {t("importExecution.publishersCreated")}
                </span>
                <strong className="mt-1 block text-2xl font-black">
                  {resultadoImportacao.editorasCriadas}
                </strong>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-xl border border-emerald-200 bg-white/70 p-3 dark:border-emerald-900 dark:bg-slate-950/30">
                <span className="block text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {t("covers.resultZip")}
                </span>
                <strong className="mt-1 block text-xl font-black">
                  {resultadoImportacao.capasZip}
                </strong>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white/70 p-3 dark:border-emerald-900 dark:bg-slate-950/30">
                <span className="block text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {t("covers.resultUrl")}
                </span>
                <strong className="mt-1 block text-xl font-black">
                  {resultadoImportacao.capasUrl}
                </strong>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white/70 p-3 dark:border-emerald-900 dark:bg-slate-950/30">
                <span className="block text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {t("covers.resultIsbn")}
                </span>
                <strong className="mt-1 block text-xl font-black">
                  {resultadoImportacao.capasIsbn}
                </strong>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white/70 p-3 dark:border-emerald-900 dark:bg-slate-950/30">
                <span className="block text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {t("covers.resultPreserved")}
                </span>
                <strong className="mt-1 block text-xl font-black">
                  {resultadoImportacao.capasPreservadas}
                </strong>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white/70 p-3 dark:border-emerald-900 dark:bg-slate-950/30">
                <span className="block text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {t("covers.resultMissing")}
                </span>
                <strong className="mt-1 block text-xl font-black">
                  {resultadoImportacao.semCapa}
                </strong>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-white/70 p-3 dark:border-emerald-900 dark:bg-slate-950/30">
                <span className="block text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                  {t("covers.resultFailures")}
                </span>
                <strong className="mt-1 block text-xl font-black">
                  {resultadoImportacao.falhasCapas}
                </strong>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {confirmacaoAberta ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(evento) => {
            if (
              evento.target ===
              evento.currentTarget &&
              !importando
            ) {
              setConfirmacaoAberta(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-importacao-titulo"
            className="import-card w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl dark:bg-amber-950">
                📥
              </div>

              <div>
                <h2
                  id="confirmar-importacao-titulo"
                  className="text-xl font-black"
                >
                  {t("importExecution.confirmTitle")}
                </h2>

                <p className="import-muted mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {t(
                    "importExecution.confirmDescription",
                    {
                      count:
                        validacao?.resumo.registros ??
                        0,
                    },
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
              <strong className="block">
                {arquivo?.name}
              </strong>

              <span className="import-muted mt-1 block text-xs text-slate-500 dark:text-slate-400">
                {t("importExecution.draftNotice")}
              </span>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={importando}
                onClick={() =>
                  setConfirmacaoAberta(false)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {t("importExecution.cancel")}
              </button>

              <button
                type="button"
                disabled={importando}
                onClick={() =>
                  void confirmarImportacao()
                }
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importando
                  ? t("importExecution.importing")
                  : t("importExecution.confirmButton")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}