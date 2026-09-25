"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

type Departamento = {
  id: number;
  nome: string;
};

type ResumoRemuneracaoVariavel = {
  totalProgramas: number;
  programasAtivos: number;
  programasRascunho: number;
  comissoesPendentes: number;
  remuneracoesPendentes: number;
  totalLancamentosPendentes: number;
  totalValorPendente: number;
};

type ProgramaRemuneracaoVariavel = {
  id: number;
    criadoPorId?: number | null;
  criadoPor?: {
    id: number;
    nome: string;
    email?: string | null;
  } | null;
  nome: string;
  descricao?: string | null;
  observacoes?: string | null;
  tipo: string;
  abrangencia: string;
  metodoDistribuicao: string;
  competenciaMes?: number | null;
  competenciaAno?: number | null;
  periodoInicio?: string | null;
  periodoFim?: string | null;
  percentualFundo?: string | number | null;
  valorFundo?: string | number | null;
  valorMinimoIndividual?: string | number | null;
  valorMaximoIndividual?: string | number | null;
  considerarSalarioBase: boolean;
  considerarTempoTrabalhado: boolean;
  exigirFuncionarioAtivo: boolean;
  excluirEmExperiencia: boolean;
  diasMinimosAdmissao?: number | null;
  permitirAjusteManual: boolean;
  status: string;
  criadoEm: string;
  departamento?: Departamento | null;
  _count?: {
    participantes: number;
    lancamentos: number;
      criadoPorId?: number | null;
  criadoPor?: {
    id: number;
    nome: string;
    email?: string | null;
  } | null;
  };
};

type AbaPagina = "visao-geral" | "novo-programa";

const TIPOS = [
  {
    value: "BONUS",
    labelKey: "typeBonus",
    descriptionKey: "typeBonusDesc",
  },
  {
    value: "PREMIO",
    labelKey: "typePrize",
    descriptionKey: "typePrizeDesc",
  },
  {
    value: "PARTICIPACAO_RESULTADOS",
    labelKey: "typeResults",
    descriptionKey: "typeResultsDesc",
  },
  {
    value: "PARTICIPACAO_LUCROS",
    labelKey: "typeProfits",
    descriptionKey: "typeProfitsDesc",
  },
  {
    value: "OUTRO",
    labelKey: "typeOther",
    descriptionKey: "typeOtherDesc",
  },
] as const;

const ABRANGENCIAS = [
  {
    value: "TODOS_FUNCIONARIOS",
    labelKey: "scopeAll",
  },
  {
    value: "DEPARTAMENTO",
    labelKey: "scopeDepartment",
  },
  {
    value: "FUNCIONARIOS_SELECIONADOS",
    labelKey: "scopeSelected",
  },
] as const;

const METODOS_DISTRIBUICAO = [
  {
    value: "VALOR_FIXO_INDIVIDUAL",
    labelKey: "methodFixed",
  },
  {
    value: "IGUALITARIO",
    labelKey: "methodEqual",
  },
  {
    value: "PROPORCIONAL_SALARIO",
    labelKey: "methodSalary",
  },
  {
    value: "PROPORCIONAL_TEMPO_TRABALHADO",
    labelKey: "methodTime",
  },
  {
    value: "PERCENTUAL_INDIVIDUAL",
    labelKey: "methodPercent",
  },
  {
    value: "PONTUACAO",
    labelKey: "methodPoints",
  },
  {
    value: "MANUAL",
    labelKey: "methodManual",
  },
] as const;

const MESES = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
}));

const FORM_INICIAL = {
  nome: "",
  descricao: "",
  observacoes: "",
  tipo: "BONUS",
  abrangencia: "FUNCIONARIOS_SELECIONADOS",
  metodoDistribuicao: "MANUAL",
  departamentoId: "",
  competenciaMes: "",
  competenciaAno: "",
  periodoInicio: "",
  periodoFim: "",
  percentualFundo: "",
  valorFundo: "",
  valorMinimoIndividual: "",
  valorMaximoIndividual: "",
  considerarSalarioBase: false,
  considerarTempoTrabalhado: false,
  exigirFuncionarioAtivo: true,
  excluirEmExperiencia: false,
  diasMinimosAdmissao: "",
  permitirAjusteManual: true,
};

function formatarMoeda(valor: string | number | null | undefined, locale: string) {
  const numero = Number(valor || 0);

  return numero.toLocaleString(locale, {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(valor: string | null | undefined, locale: string) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "-";

  return data.toLocaleDateString(locale);
}

function formatarDataHora(valor: string | null | undefined, locale: string) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "-";

  return data.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelPorValor(
  itens: Array<{ value: string; label: string }>,
  valor: string
) {
  return itens.find((item) => item.value === valor)?.label || valor;
}

function classeStatus(status: string) {
  switch (status) {
    case "ATIVO":
      return "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300";

    case "EM_APURACAO":
      return "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300";

    case "FECHADO":
      return "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300";

    case "CANCELADO":
      return "border-red-300 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300";

    default:
      return "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300";
  }
}

export default function RemuneracaoVariavelPage() {
  const t = useTranslations("AdminHRVariablePay");
  const locale = useLocale();
  const tipos = TIPOS.map((item) => ({
    ...item,
    label: t(item.labelKey),
    descricao: t(item.descriptionKey),
  }));
  const abrangencias = ABRANGENCIAS.map((item) => ({
    ...item,
    label: t(item.labelKey),
  }));
  const metodos = METODOS_DISTRIBUICAO.map((item) => ({
    ...item,
    label: t(item.labelKey),
  }));
  const monthFormatter = new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
  });
  const statusKeys: Record<string, "statusActive" | "statusCalculating" | "statusClosed" | "statusCancelled" | "statusDraft"> = {
    ATIVO: "statusActive",
    EM_APURACAO: "statusCalculating",
    FECHADO: "statusClosed",
    CANCELADO: "statusCancelled",
    RASCUNHO: "statusDraft",
  };
  const [aba, setAba] = useState<AbaPagina>("visao-geral");
  const [programas, setProgramas] = useState<
    ProgramaRemuneracaoVariavel[]
  >([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>(
    []
  );

  const [resumo, setResumo] =
    useState<ResumoRemuneracaoVariavel>({
      totalProgramas: 0,
      programasAtivos: 0,
      programasRascunho: 0,
      comissoesPendentes: 0,
      remuneracoesPendentes: 0,
      totalLancamentosPendentes: 0,
      totalValorPendente: 0,
    });

  const [form, setForm] = useState(FORM_INICIAL);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const tipoSelecionado = useMemo(
    () =>
      tipos.find((item) => item.value === form.tipo) ||
      tipos[0],
    [form.tipo, locale]
  );

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch(
        "/api/admin/rh/remuneracao-variavel",
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          (locale === "pt-BR" && dados.error) || t("loadError")
        );
      }

      setProgramas(
        Array.isArray(dados.programas) ? dados.programas : []
      );

      setDepartamentos(
        Array.isArray(dados.departamentos)
          ? dados.departamentos
          : []
      );

      setResumo({
        totalProgramas: Number(
          dados.resumo?.totalProgramas || 0
        ),
        programasAtivos: Number(
          dados.resumo?.programasAtivos || 0
        ),
        programasRascunho: Number(
          dados.resumo?.programasRascunho || 0
        ),
        comissoesPendentes: Number(
          dados.resumo?.comissoesPendentes || 0
        ),
        remuneracoesPendentes: Number(
          dados.resumo?.remuneracoesPendentes || 0
        ),
        totalLancamentosPendentes: Number(
          dados.resumo?.totalLancamentosPendentes || 0
        ),
        totalValorPendente: Number(
          dados.resumo?.totalValorPendente || 0
        ),
      });
    } catch (error: any) {
      setErro(
        (locale === "pt-BR" && error?.message) || t("loadError")
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function atualizarForm(
    campo: keyof typeof FORM_INICIAL,
    valor: string | boolean
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvarPrograma(evento: React.FormEvent) {
    evento.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const resposta = await fetch(
        "/api/admin/rh/remuneracao-variavel",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          (locale === "pt-BR" && dados.error) || t("createError")
        );
      }

      setForm(FORM_INICIAL);
      setSucesso(
        (locale === "pt-BR" && dados.message) || t("createSuccess")
      );
      setAba("visao-geral");

      await carregarDados();
    } catch (error: any) {
      setErro(
        (locale === "pt-BR" && error?.message) || t("createError")
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="phanyx-rh-page phanyx-remuneracao-variavel-page min-h-screen bg-slate-50 p-4 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">{t("breadcrumb")}</p>

            <h1 className="mt-2 text-3xl font-black">{t("title")}</h1>

            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{t("description")}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setAba("visao-geral");
                setErro("");
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                aba === "visao-geral"
                  ? "phanyx-remuneracao-tab-ativa border-blue-500 bg-blue-600 text-white"
                  : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:border-blue-400"
              }`}
            >{t("overview")}</button>

            <button
              type="button"
              onClick={() => {
                setAba("novo-programa");
                setErro("");
                setSucesso("");
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
                aba === "novo-programa"
                  ? "phanyx-remuneracao-tab-ativa border-blue-500 bg-blue-600 text-white"
                  : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:border-blue-400"
              }`}
            >{t("newProgram")}</button>
          </div>
        </header>

        {erro && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200">
            {sucesso}
          </div>
        )}

        {aba === "visao-geral" && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-xl">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">{t("programsRegistered")}</p>

                <p className="mt-3 text-3xl font-black">
                  {resumo.totalProgramas}
                </p>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  {t("programsSummary", { active: resumo.programasAtivos, draft: resumo.programasRascunho })}
                </p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-xl">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">{t("pendingCommissions")}</p>

                <p className="mt-3 text-3xl font-black">
                  {resumo.comissoesPendentes}
                </p>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{t("salesPendingApproval")}</p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-xl">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">{t("otherEntries")}</p>

                <p className="mt-3 text-3xl font-black">
                  {resumo.remuneracoesPendentes}
                </p>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{t("otherEntriesDescription")}</p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-xl">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">{t("pendingValue")}</p>

                <p className="mt-3 text-3xl font-black">
                  {formatarMoeda(resumo.totalValorPendente, locale)}
                </p>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  {t("entriesPending", { count: resumo.totalLancamentosPendentes })}
                </p>
              </article>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5">
                <div className="text-2xl">📈</div>
                <h2 className="mt-3 font-black">{t("commissions")}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t("commissionsDescription")}</p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5">
                <div className="text-2xl">🏆</div>
                <h2 className="mt-3 font-black">{t("bonusesPrizes")}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t("bonusesDescription")}</p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5">
                <div className="text-2xl">🤝</div>
                <h2 className="mt-3 font-black">{t("resultsProfits")}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t("resultsDescription")}</p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5">
                <div className="text-2xl">🧾</div>
                <h2 className="mt-3 font-black">{t("payrollIntegration")}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t("payrollDescription")}</p>
              </article>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 shadow-xl">
              <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black">{t("programs")}</h2>

                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("programsDescription")}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAba("novo-programa");
                    setErro("");
                    setSucesso("");
                  }}
                  className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500"
                >{t("createProgram")}</button>
              </div>

              {carregando ? (
                <div className="p-6 text-sm text-slate-600 dark:text-slate-400">{t("loading")}</div>
              ) : programas.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl">💰</div>

                  <h3 className="mt-4 text-lg font-black">{t("noPrograms")}</h3>

                  <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">{t("emptyDescription")}</p>

                  <button
                    type="button"
                    onClick={() => setAba("novo-programa")}
                    className="phanyx-remuneracao-botao-primario mt-5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-500"
                  >{t("createFirst")}</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-950/70 text-left text-xs uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      <tr>
                        <th className="p-3">{t("program")}</th>
                        <th className="p-3">{t("type")}</th>
                        <th className="p-3">{t("scope")}</th>
                        <th className="p-3">{t("period")}</th>
                        <th className="p-3">{t("participants")}</th>
                        <th className="p-3">{t("fund")}</th>
                        <th className="p-3">{t("audit")}</th>
                        <th className="p-3">{t("status")}</th>
                        <th className="p-3">{t("actions")}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {programas.map((programa) => (
                        <tr
                          key={programa.id}
                          className="border-t border-slate-200 dark:border-slate-800"
                        >
                          <td className="p-3">
                            <p className="font-bold">
                              {programa.nome}
                            </p>

                            {programa.departamento?.nome && (
                              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                {programa.departamento.nome}
                              </p>
                            )}
                          </td>

                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            {labelPorValor(
                              tipos,
                              programa.tipo
                            )}
                          </td>

                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            {labelPorValor(
                              abrangencias,
                              programa.abrangencia
                            )}
                          </td>

                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            {programa.competenciaMes &&
                            programa.competenciaAno
                              ? `${String(
                                  programa.competenciaMes
                                ).padStart(2, "0")}/${
                                  programa.competenciaAno
                                }`
                              : programa.periodoInicio ||
                                  programa.periodoFim
                                ? `${formatarData(
                                    programa.periodoInicio, locale
                                  )} ${t("until")} ${formatarData(
                                    programa.periodoFim, locale
                                  )}`
                                : "-"}
                          </td>

                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            {programa._count?.participantes || 0}
                          </td>

                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            {programa.valorFundo
                              ? formatarMoeda(
                                  programa.valorFundo,
                                  locale
                                )
                              : programa.percentualFundo
                                ? `${programa.percentualFundo}%`
                                : "-"}
                          </td>

                          <td className="p-3">
  <p className="font-semibold">
  {programa.criadoPor?.nome?.trim() ||
    programa.criadoPor?.email ||
    t("userIdFallback", { id: programa.criadoPorId ?? "-" })}
</p>

  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
    {t("userId", { id: programa.criadoPor?.id || programa.criadoPorId || "-" })}
  </p>

  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
    {t("createdAt", { date: formatarDataHora(programa.criadoEm, locale) })}
  </p>
</td>

                          <td className="p-3">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${classeStatus(
                                programa.status
                              )}`}
                            >
                              {statusKeys[programa.status]
                                ? t(statusKeys[programa.status])
                                : programa.status.replaceAll("_", " ")}
                            </span>
                          </td>

<td className="p-3">
  <Link
    href={`/admin/rh/remuneracao-variavel/${programa.id}`}
    className="phanyx-remuneracao-botao-primario inline-flex whitespace-nowrap rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-500"
  >{t("manage")}</Link>
</td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {aba === "novo-programa" && (
          <form
            onSubmit={salvarPrograma}
            className="space-y-6"
          >
            <section className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-xl">
              <div>
                <h2 className="text-lg font-black">{t("programIdentity")}</h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("identityDescription")}</p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-1 md:col-span-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("programName")}</span>

                  <input
                    required
                    value={form.nome}
                    onChange={(event) =>
                      atualizarForm(
                        "nome",
                        event.target.value
                      )
                    }
                    placeholder={t("namePlaceholder")}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("payType")}</span>

                  <select
                    value={form.tipo}
                    onChange={(event) =>
                      atualizarForm(
                        "tipo",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  >
                    {tipos.map((tipo) => (
                      <option
                        key={tipo.value}
                        value={tipo.value}
                      >
                        {tipo.label}
                      </option>
                    ))}
                  </select>

                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {tipoSelecionado.descricao}
                  </p>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("scope")}</span>

                  <select
                    value={form.abrangencia}
                    onChange={(event) => {
                      atualizarForm(
                        "abrangencia",
                        event.target.value
                      );

                      if (
                        event.target.value !== "DEPARTAMENTO"
                      ) {
                        atualizarForm("departamentoId", "");
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  >
                    {abrangencias.map((abrangencia) => (
                      <option
                        key={abrangencia.value}
                        value={abrangencia.value}
                      >
                        {abrangencia.label}
                      </option>
                    ))}
                  </select>
                </label>

                {form.abrangencia === "DEPARTAMENTO" && (
                  <label className="space-y-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("participatingDepartment")}</span>

                    <select
                      required
                      value={form.departamentoId}
                      onChange={(event) =>
                        atualizarForm(
                          "departamentoId",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                    >
                      <option value="">{t("selectDepartment")}</option>

                      {departamentos.map((departamento) => (
                        <option
                          key={departamento.id}
                          value={departamento.id}
                        >
                          {departamento.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("distributionMethod")}</span>

                  <select
                    value={form.metodoDistribuicao}
                    onChange={(event) =>
                      atualizarForm(
                        "metodoDistribuicao",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  >
                    {metodos.map((metodo) => (
                      <option
                        key={metodo.value}
                        value={metodo.value}
                      >
                        {metodo.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("programDescription")}</span>

                  <textarea
                    value={form.descricao}
                    onChange={(event) =>
                      atualizarForm(
                        "descricao",
                        event.target.value
                      )
                    }
                    rows={3}
                    placeholder={t("descriptionPlaceholder")}
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-xl">
              <h2 className="text-lg font-black">{t("periodSection")}</h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("periodDescription")}</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("periodMonth")}</span>

                  <select
                    value={form.competenciaMes}
                    onChange={(event) =>
                      atualizarForm(
                        "competenciaMes",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  >
                    <option value="">{t("select")}</option>

                    {MESES.map((mes) => (
                      <option
                        key={mes.value}
                        value={mes.value}
                      >
                        {monthFormatter.format(new Date(Date.UTC(2020, Number(mes.value) - 1, 1)))}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("periodYear")}</span>

                  <input
                    type="number"
                    min={2000}
                    max={2200}
                    value={form.competenciaAno}
                    onChange={(event) =>
                      atualizarForm(
                        "competenciaAno",
                        event.target.value
                      )
                    }
                    placeholder="2026"
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("periodStart")}</span>

                  <input
                    type="date"
                    value={form.periodoInicio}
                    onChange={(event) =>
                      atualizarForm(
                        "periodoInicio",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("periodEnd")}</span>

                  <input
                    type="date"
                    value={form.periodoFim}
                    onChange={(event) =>
                      atualizarForm(
                        "periodoFim",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-xl">
              <h2 className="text-lg font-black">{t("valuesSection")}</h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("valuesDescription")}</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("fundValue")}</span>

                  <input
                    value={form.valorFundo}
                    onChange={(event) =>
                      atualizarForm(
                        "valorFundo",
                        event.target.value
                      )
                    }
                    placeholder={t("decimalPlaceholder")}
                    inputMode="decimal"
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("fundPercent")}</span>

                  <input
                    value={form.percentualFundo}
                    onChange={(event) =>
                      atualizarForm(
                        "percentualFundo",
                        event.target.value
                      )
                    }
                    placeholder={t("percentPlaceholder")}
                    inputMode="decimal"
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("individualMinimum")}</span>

                  <input
                    value={form.valorMinimoIndividual}
                    onChange={(event) =>
                      atualizarForm(
                        "valorMinimoIndividual",
                        event.target.value
                      )
                    }
                    placeholder={t("decimalPlaceholder")}
                    inputMode="decimal"
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("individualMaximum")}</span>

                  <input
                    value={form.valorMaximoIndividual}
                    onChange={(event) =>
                      atualizarForm(
                        "valorMaximoIndividual",
                        event.target.value
                      )
                    }
                    placeholder={t("decimalPlaceholder")}
                    inputMode="decimal"
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/80 p-5 shadow-xl">
              <h2 className="text-lg font-black">{t("eligibility")}</h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t("eligibilityDescription")}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="phanyx-remuneracao-elegibilidade-card flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
                  <input
                    type="checkbox"
                    checked={form.exigirFuncionarioAtivo}
                    onChange={(event) =>
                      atualizarForm(
                        "exigirFuncionarioAtivo",
                        event.target.checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    <span className="block text-sm font-bold">{t("requireActive")}</span>

                    <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">{t("requireActiveDescription")}</span>
                  </span>
                </label>

                <label className="phanyx-remuneracao-elegibilidade-card flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
                  <input
                    type="checkbox"
                    checked={form.excluirEmExperiencia}
                    onChange={(event) =>
                      atualizarForm(
                        "excluirEmExperiencia",
                        event.target.checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    <span className="block text-sm font-bold">{t("excludeProbation")}</span>

                    <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">{t("excludeProbationDescription")}</span>
                  </span>
                </label>

                <label className="phanyx-remuneracao-elegibilidade-card flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
                  <input
                    type="checkbox"
                    checked={form.considerarSalarioBase}
                    onChange={(event) =>
                      atualizarForm(
                        "considerarSalarioBase",
                        event.target.checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    <span className="block text-sm font-bold">{t("considerSalary")}</span>

                    <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">{t("considerSalaryDescription")}</span>
                  </span>
                </label>

                <label className="phanyx-remuneracao-elegibilidade-card flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
                  <input
                    type="checkbox"
                    checked={form.considerarTempoTrabalhado}
                    onChange={(event) =>
                      atualizarForm(
                        "considerarTempoTrabalhado",
                        event.target.checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    <span className="block text-sm font-bold">{t("considerTime")}</span>

                    <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">{t("considerTimeDescription")}</span>
                  </span>
                </label>

                <label className="phanyx-remuneracao-elegibilidade-card flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
                  <input
                    type="checkbox"
                    checked={form.permitirAjusteManual}
                    onChange={(event) =>
                      atualizarForm(
                        "permitirAjusteManual",
                        event.target.checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    <span className="block text-sm font-bold">{t("manualAdjustment")}</span>

                    <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">{t("manualAdjustmentDescription")}</span>
                  </span>
                </label>

                <label className="phanyx-remuneracao-elegibilidade-card space-y-1 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50 p-4">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("minimumTenure")}</span>

                  <input
                    type="number"
                    min={0}
                    value={form.diasMinimosAdmissao}
                    onChange={(event) =>
                      atualizarForm(
                        "diasMinimosAdmissao",
                        event.target.value
                      )
                    }
                    placeholder={t("tenurePlaceholder")}
                    className="w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                  />
                </label>
              </div>

              <label className="mt-4 block space-y-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t("internalNotes")}</span>

                <textarea
                  value={form.observacoes}
                  onChange={(event) =>
                    atualizarForm(
                      "observacoes",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder={t("notesPlaceholder")}
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400"
                />
              </label>
            </section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setAba("visao-geral");
                  setErro("");
                }}
                className="rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:border-slate-500"
              >{t("cancel")}</button>

              <button
                type="submit"
                disabled={salvando}
                className="phanyx-remuneracao-botao-primario rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando
                  ? t("saving")
                  : t("createDraft")}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
