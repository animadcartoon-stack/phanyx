"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

type SecaoHistoricoId =
  | "cabecalho"
  | "titulo"
  | "dadosAluno"
  | "dadosMatricula"
  | "componentes"
  | "observacoes"
  | "assinatura"
  | "rodape";

type Props = {
  value: string;
  onChange: (value: string) => void;
  modeloBase: string;
  onCopyTag?: (tag: string) => void;
};

type SecaoDef = {
  id: SecaoHistoricoId;
  marcador: string;
  labelKey: string;
  helpKey: string;
  rows: number;
  tags: string[];
  sistema?: boolean;
};

const SECOES: SecaoDef[] = [
  {
    id: "cabecalho",
    marcador: "CABEÇALHO INSTITUCIONAL",
    labelKey: "sections.header",
    helpKey: "help.header",
    rows: 6,
    tags: [
      "{{blocoInstituicao}}",
      "{{logoInstituicao}}",
      "{{nomeInstituicao}}",
      "{{cnpjInstituicao}}",
      "{{enderecoInstituicao}}",
      "{{telefoneInstituicao}}",
      "{{emailInstituicao}}",
      "{{blocoPolo}}",
    ],
  },
  {
    id: "titulo",
    marcador: "TÍTULO",
    labelKey: "sections.title",
    helpKey: "help.title",
    rows: 2,
    tags: [],
  },
  {
    id: "dadosAluno",
    marcador: "DADOS DO ALUNO",
    labelKey: "sections.student",
    helpKey: "help.student",
    rows: 11,
    tags: [
      "{{nomeAluno}}",
      "{{cpfAluno}}",
      "{{rgAluno}}",
      "{{orgaoExpedidorAluno}}",
      "{{dataNascimentoAluno}}",
      "{{sexoAluno}}",
      "{{naturalidadeAluno}}",
      "{{nacionalidadeAluno}}",
      "{{matriculaAluno}}",
      "{{numeroMatricula}}",
      "{{statusAluno}}",
      "{{situacaoAcademicaAluno}}",
    ],
  },
  {
    id: "dadosMatricula",
    marcador: "DADOS DA MATRÍCULA",
    labelKey: "sections.enrollment",
    helpKey: "help.enrollment",
    rows: 12,
    tags: [
      "{{curso}}",
      "{{statusMatricula}}",
      "{{dataMatricula}}",
      "{{dataInicioAluno}}",
      "{{dataConclusao}}",
      "{{semestreAtual}}",
      "{{cargaHorariaCurso}}",
      "{{cargaHorariaMinimaCurso}}",
      "{{cargaHorariaMaximaCurso}}",
      "{{percentualConclusao}}",
      "{{nomePolo}}",
      "{{curriculoAluno}}",
      "{{formaIngressoAluno}}",
    ],
  },
  {
    id: "componentes",
    marcador: "COMPONENTES CURRICULARES",
    labelKey: "sections.curriculum",
    helpKey: "help.curriculum",
    rows: 4,
    tags: [
      "{{disciplinas}}",
      "{{disciplinasPorSemestre}}",
    ],
    sistema: true,
  },
  {
    id: "observacoes",
    marcador: "OBSERVAÇÕES",
    labelKey: "sections.notes",
    helpKey: "help.notes",
    rows: 8,
    tags: [
      "{{observacoesHistorico}}",
      "{{legendaHistorico}}",
      "{{dataAtual}}",
      "{{nomeInstituicao}}",
      "{{semestresCursados}}",
      "{{semestresRevalidados}}",
      "{{provavelSemestreFormatura}}",
      "{{haTotalCursada}}",
      "{{haTotalAprovada}}",
      "{{indiceAproveitamentoSemestral}}",
      "{{indiceAproveitamentoAcumulado}}",
      "{{indiceAproveitamentoAprovadas}}",
    ],
  },
  {
    id: "assinatura",
    marcador: "ASSINATURA INSTITUCIONAL",
    labelKey: "sections.signature",
    helpKey: "help.signature",
    rows: 5,
    tags: [
      "{{blocoAssinaturaDiretor}}",
      "{{assinaturaDiretor}}",
      "{{responsavelLegal}}",
      "{{cidadeAssinatura}}",
      "{{dataAtual}}",
    ],
  },
  {
    id: "rodape",
    marcador: "RODAPÉ",
    labelKey: "sections.footer",
    helpKey: "help.footer",
    rows: 6,
    tags: [
      "{{nomeInstituicao}}",
      "{{cnpjInstituicao}}",
      "{{codigoValidacao}}",
      "{{urlValidacao}}",
      "{{numeroDocumento}}",
      "{{dataEmissao}}",
      "{{horaEmissao}}",
    ],
    sistema: true,
  },
];

const COLUNAS_ATUAIS = [
  "DISCIPLINA",
  "C.H.",
  "NOTA",
  "FREQ.",
  "SITUAÇÃO",
];

function htmlParaTextoEstruturado(valor: string) {
  const texto = String(valor || "");

  if (!/<[a-z][\s\S]*>/i.test(texto)) {
    return texto.replace(/\r\n/g, "\n");
  }

  return texto
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizarMarcador(valor: string) {
  return String(valor || "")
    .trim()
    .toUpperCase();
}

type TemplateEstruturado = {
  preambulo: string;
  secoes: Record<string, string>;
  extras: Array<{
    marcador: string;
    conteudo: string;
  }>;
};

function extrairTemplateEstruturado(valor: string): TemplateEstruturado {
  const texto = htmlParaTextoEstruturado(valor);
  const regex = /\[([^\]\r\n]+)\]\s*([\s\S]*?)(?=\n\s*\[[^\]\r\n]+\]|\s*$)/g;

  const encontrados = Array.from(texto.matchAll(regex));
  const primeiroIndice = encontrados[0]?.index ?? -1;

  const preambulo =
    primeiroIndice > 0
      ? texto.slice(0, primeiroIndice).trim()
      : "";

  const secoes: Record<string, string> = {};
  const extras: TemplateEstruturado["extras"] = [];

  const marcadoresConhecidos = new Set(
    SECOES.map((secao) => normalizarMarcador(secao.marcador))
  );

  for (const resultado of encontrados) {
    const marcador = String(resultado[1] || "").trim();
    const conteudo = String(resultado[2] || "").trim();
    const chave = normalizarMarcador(marcador);

    if (marcadoresConhecidos.has(chave)) {
      secoes[chave] = conteudo;
    } else {
      extras.push({
        marcador,
        conteudo,
      });
    }
  }

  return {
    preambulo,
    secoes,
    extras,
  };
}

function montarTemplateEstruturado(
  estrutura: TemplateEstruturado,
  padrao: TemplateEstruturado
) {
  const partes: string[] = [];

  if (estrutura.preambulo) {
    partes.push(estrutura.preambulo);
  }

  for (const secao of SECOES) {
    const chave = normalizarMarcador(secao.marcador);
    const conteudo =
      estrutura.secoes[chave] ??
      padrao.secoes[chave] ??
      "";

    partes.push(
      `[${secao.marcador}]\n\n${conteudo.trim()}`
    );
  }

  for (const extra of estrutura.extras) {
    partes.push(
      `[${extra.marcador}]\n\n${extra.conteudo.trim()}`
    );
  }

  return partes.join("\n\n").trim();
}

export default function HistoricoTemplateEditorPHANYX({
  value,
  onChange,
  modeloBase,
  onCopyTag,
}: Props) {
  const t = useTranslations(
    "AdminDocumentsTemplatesHistoryEditor"
  );

  const estrutura = useMemo(
    () => extrairTemplateEstruturado(value),
    [value]
  );

  const estruturaPadrao = useMemo(
    () => extrairTemplateEstruturado(modeloBase),
    [modeloBase]
  );

  const faltando = useMemo(() => {
    return SECOES.filter((secao) => {
      const chave = normalizarMarcador(secao.marcador);
      return !Object.prototype.hasOwnProperty.call(
        estrutura.secoes,
        chave
      );
    });
  }, [estrutura]);

  function atualizarSecao(
    marcador: string,
    conteudo: string
  ) {
    const chave = normalizarMarcador(marcador);

    const proximaEstrutura: TemplateEstruturado = {
      ...estrutura,
      secoes: {
        ...estrutura.secoes,
        [chave]: conteudo,
      },
    };

    onChange(
      montarTemplateEstruturado(
        proximaEstrutura,
        estruturaPadrao
      )
    );
  }

  function inserirTag(
    marcador: string,
    tag: string
  ) {
    const chave = normalizarMarcador(marcador);
    const atual =
      estrutura.secoes[chave] ??
      estruturaPadrao.secoes[chave] ??
      "";

    const separador =
      atual.trim().length > 0
        ? "\n"
        : "";

    atualizarSecao(
      marcador,
      `${atual}${separador}${tag}`
    );

    onCopyTag?.(tag);
  }

  function restaurarSecao(
    marcador: string
  ) {
    const chave = normalizarMarcador(marcador);

    atualizarSecao(
      marcador,
      estruturaPadrao.secoes[chave] ?? ""
    );
  }

  return (
    <div className="phanyx-history-template-editor space-y-5">
      <div className="pdoc-soft rounded-2xl border p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="pdoc-label text-base font-black">
              {t("title")}
            </h3>

            <p className="pdoc-muted mt-1 max-w-3xl text-sm">
              {t("subtitle")}
            </p>
          </div>

          <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
            {t("protectedStructure")}
          </div>
        </div>

        {faltando.length > 0 ? (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
            {t("missingSections", {
              count: faltando.length,
            })}
          </div>
        ) : null}
      </div>

      <div className="pdoc-card rounded-2xl border p-4">
        <h4 className="pdoc-label font-bold">
          {t("visualMapTitle")}
        </h4>

        <p className="pdoc-muted mt-1 text-xs">
          {t("visualMapHelp")}
        </p>

        <div className="mt-4 mx-auto max-w-3xl rounded-xl border border-slate-300 bg-white p-5 text-slate-900 shadow-sm">
          <div className="border p-3 text-sm font-bold">
            {t("sections.header")}
          </div>

          <div className="mt-3 border p-3 text-center text-sm font-bold">
            {t("sections.title")}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="border p-3 text-sm font-semibold">
              {t("sections.student")}
            </div>

            <div className="border p-3 text-sm font-semibold">
              {t("sections.enrollment")}
            </div>
          </div>

          <div className="mt-3 border">
            <div className="border-b bg-slate-100 p-2 text-sm font-bold">
              {t("sections.curriculum")}
            </div>

            <div className="grid grid-cols-5 divide-x text-center text-[10px] font-semibold">
              {COLUNAS_ATUAIS.map((coluna) => (
                <div key={coluna} className="p-2">
                  {coluna}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="border p-3 text-sm font-semibold">
              {t("sections.notes")}
            </div>

            <div className="border p-3 text-sm font-semibold">
              {t("sections.signature")}
            </div>
          </div>

          <div className="mt-3 border p-3 text-center text-xs font-semibold">
            {t("sections.footer")}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {SECOES.map((secao, index) => {
          const chave =
            normalizarMarcador(secao.marcador);

          const conteudo =
            estrutura.secoes[chave] ??
            estruturaPadrao.secoes[chave] ??
            "";

          return (
            <div
              key={secao.id}
              className="pdoc-card rounded-2xl border p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black text-white dark:bg-slate-100 dark:text-slate-900">
                      {index + 1}
                    </span>

                    <h4 className="pdoc-label font-black">
                      {t(secao.labelKey)}
                    </h4>

                    <code className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      [{secao.marcador}]
                    </code>
                  </div>

                  <p className="pdoc-muted mt-2 text-xs leading-relaxed">
                    {t(secao.helpKey)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    restaurarSecao(secao.marcador)
                  }
                  className="rounded-xl border px-3 py-2 text-xs font-bold hover:border-blue-400"
                >
                  {t("restoreSection")}
                </button>
              </div>

              {secao.sistema ? (
                <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-200">
                  {secao.id === "componentes"
                    ? t("systemTableNotice")
                    : t("systemFooterNotice")}
                </div>
              ) : null}

              <textarea
                value={conteudo}
                onChange={(event) =>
                  atualizarSecao(
                    secao.marcador,
                    event.target.value
                  )
                }
                rows={secao.rows}
                spellCheck={false}
                className="pdoc-input mt-3 w-full rounded-xl border px-3 py-3 font-mono text-xs leading-6 outline-none focus:border-blue-500"
              />

              {secao.tags.length > 0 ? (
                <div className="mt-3">
                  <p className="pdoc-muted text-[11px] font-bold uppercase tracking-wide">
                    {t("suggestedVariables")}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {secao.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          inserirTag(
                            secao.marcador,
                            tag
                          )
                        }
                        className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-[10px] font-bold text-blue-800 hover:border-blue-500 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200"
                        title={t("insertVariable")}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <details className="pdoc-card rounded-2xl border p-4">
        <summary className="pdoc-label cursor-pointer font-black">
          {t("advancedTitle")}
        </summary>

        <p className="pdoc-muted mt-2 text-xs">
          {t("advancedHelp")}
        </p>

        <textarea
          value={htmlParaTextoEstruturado(value)}
          onChange={(event) =>
            onChange(event.target.value)
          }
          rows={30}
          spellCheck={false}
          className="pdoc-input mt-3 w-full rounded-xl border px-3 py-3 font-mono text-xs leading-6 outline-none focus:border-blue-500"
        />
      </details>
    </div>
  );
}
