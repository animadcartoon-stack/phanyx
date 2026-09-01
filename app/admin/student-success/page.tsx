"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useTranslations,
} from "next-intl";

type NivelRisco =
  | "NORMAL"
  | "ATENCAO"
  | "RISCO"
  | "CRITICO"
  | "DADOS_INSUFICIENTES";

type Confiabilidade =
  | "BAIXA"
  | "MEDIA"
  | "ALTA";

type FiltroNivel =
  | "TODOS"
  | NivelRisco;

type ComponenteAnalise = {
  codigo:
  | "FREQUENCIA"
  | "DESEMPENHO"
  | "PENDENCIAS"
  | "QUEDA_DESEMPENHO"
  | "PARTICIPACAO";

  titulo: string;
  pontos: number;
  maximo: number;
  disponivel: boolean;
  detalhe: string;
};

type AlunoStudentSuccess = {
  alunoId: number;

  nome: string;

  matricula:
  | string
  | null;

  contato: {
    telefone:
    | string
    | null;

    paisTelefone:
    | string
    | null;

    email:
    | string
    | null;

    responsavel: {
      nome:
      | string
      | null;

      parentesco:
      | string
      | null;

      telefone:
      | string
      | null;

      paisTelefone:
      | string
      | null;

      email:
      | string
      | null;
    };
  };

  indicadores: {
    frequenciaPercentual:
    | number
    | null;

    quantidadeAulas:
    number;

    mediaPercentual:
    | number
    | null;

    quantidadeAvaliacoes:
    number;

    atividadesVencidas:
    number;

    totalAtividadesConsideradas:
    number;

    mediaAnteriorPercentual:
    | number
    | null;

    mediaRecentePercentual:
    | number
    | null;

    quedaDesempenhoPercentual:
    | number
    | null;
  };

  analise: {
    pontuacao: number;

    pontuacaoBruta:
    number;

    maximoDisponivel:
    number;

    nivel:
    NivelRisco;

    coberturaPercentual:
    number;

    confiabilidade:
    Confiabilidade;

    componentes:
    ComponenteAnalise[];

    fatoresPrincipais:
    ComponenteAnalise[];
  };
};

type StudentSuccessResponse = {
  ok: boolean;

  geradoEm:
  string;

  resumo: {
    monitorados:
    number;

    critico:
    number;

    risco:
    number;

    atencao:
    number;

    normal:
    number;

    dadosInsuficientes:
    number;

    alunosComSinais:
    number;
  };

  alunos:
  AlunoStudentSuccess[];
};

type CardResumoProps = {
  valor:
  string;

  titulo:
  string;

  variante:
  | "critical"
  | "risk"
  | "attention"
  | "normal"
  | "insufficient";
};

function CardResumo({
  valor,
  titulo,
  variante,
}: CardResumoProps) {
  const estilos = {
    critical:
      "border-red-200 bg-red-50 text-red-950 dark:border-red-900/70 dark:bg-red-950/35 dark:text-red-100",

    risk:
      "border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-900/70 dark:bg-orange-950/35 dark:text-orange-100",

    attention:
      "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-100",

    normal:
      "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/70 dark:bg-emerald-950/35 dark:text-emerald-100",

    insufficient:
      "border-slate-200 bg-slate-50 text-slate-950 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100",
  };

  return (
    <div
      className={[
        "phanyx-student-success-summary-card",
        `phanyx-student-success-${variante}`,
        "rounded-2xl border p-5 shadow-sm transition",
        estilos[variante],
      ].join(" ")}
    >
      <div
        className="
          text-3xl
          font-bold
          tracking-tight
        "
      >
        {valor}
      </div>

      <div
        className="
          mt-2
          text-sm
          font-semibold
        "
      >
        {titulo}
      </div>
    </div>
  );
}

function formatarPercentual(
  valor:
    | number
    | null
) {
  if (
    valor === null ||
    !Number.isFinite(
      valor
    )
  ) {
    return "—";
  }

  return `${Math.round(
    valor
  )}%`;
}

function classeNivel(
  nivel:
    NivelRisco
) {
  switch (nivel) {
    case "CRITICO":
      return "border-red-300 bg-red-100 text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200";

    case "RISCO":
      return "border-orange-300 bg-orange-100 text-orange-900 dark:border-orange-900 dark:bg-orange-950/60 dark:text-orange-200";

    case "ATENCAO":
      return "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200";

    case "NORMAL":
      return "border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200";

    case "DADOS_INSUFICIENTES":
    default:
      return "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

function emailPodeSerUsado(
  email:
    | string
    | null
) {
  if (!email) {
    return false;
  }

  const normalizado =
    email
      .trim()
      .toLowerCase();

  if (
    !normalizado ||
    normalizado.endsWith(
      "@px.local"
    )
  ) {
    return false;
  }

  return normalizado.includes(
    "@"
  );
}

function telefoneParaLink(
  telefone:
    | string
    | null
) {
  if (!telefone) {
    return null;
  }

  const limpo =
    telefone.replace(
      /[^\d+]/g,
      ""
    );

  return (
    limpo ||
    null
  );
}

export default function AdminStudentSuccessPage() {
  const t =
    useTranslations(
      "AdminStudentSuccess"
    );

  const [
    dados,
    setDados,
  ] =
    useState<StudentSuccessResponse | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(
      true
    );

  const [
    erro,
    setErro,
  ] =
    useState(
      false
    );

  const [
    busca,
    setBusca,
  ] =
    useState("");

  const [
    filtroNivel,
    setFiltroNivel,
  ] =
    useState<FiltroNivel>(
      "TODOS"
    );

  const [
    alunoSelecionado,
    setAlunoSelecionado,
  ] =
    useState<AlunoStudentSuccess | null>(
      null
    );

  const carregarDados =
    useCallback(
      async () => {
        setCarregando(
          true
        );

        setErro(
          false
        );

        try {
          const resposta =
            await fetch(
              "/api/admin/student-success",
              {
                method:
                  "GET",

                credentials:
                  "include",

                cache:
                  "no-store",
              }
            );

          if (
            !resposta.ok
          ) {
            throw new Error(
              `HTTP ${resposta.status}`
            );
          }

          const json =
            (
              await resposta.json()
            ) as StudentSuccessResponse;

          if (
            !json.ok
          ) {
            throw new Error(
              "STUDENT_SUCCESS_LOAD_ERROR"
            );
          }

          setDados(
            json
          );
        }
        catch (
        error
        ) {
          console.error(
            "[STUDENT_SUCCESS_PAGE]",
            error
          );

          setErro(
            true
          );
        }
        finally {
          setCarregando(
            false
          );
        }
      },
      []
    );

  useEffect(
    () => {
      void carregarDados();
    },
    [
      carregarDados,
    ]
  );

  useEffect(
    () => {
      if (
        !alunoSelecionado
      ) {
        return;
      }

      const fecharComEsc =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            setAlunoSelecionado(
              null
            );
          }
        };

      const overflowAnterior =
        document.body.style
          .overflow;

      document.body.style.overflow =
        "hidden";

      window.addEventListener(
        "keydown",
        fecharComEsc
      );

      return () => {
        document.body.style.overflow =
          overflowAnterior;

        window.removeEventListener(
          "keydown",
          fecharComEsc
        );
      };
    },
    [
      alunoSelecionado,
    ]
  );

  /*
   * Mostramos aqui:
   *
   * - risco crítico
   * - risco
   * - atenção
   * - dados insuficientes
   *
   * DADOS_INSUFICIENTES NÃO significa
   * risco acadêmico.
   *
   * Ele aparece porque a instituição
   * precisa saber quais alunos ainda
   * não possuem dados suficientes para
   * uma análise confiável.
   */
  const alunosFiltrados =
    useMemo(
      () => {
        const termo =
          busca
            .trim()
            .toLocaleLowerCase();

        return (
          dados?.alunos ??
          []
        ).filter(
          (aluno) => {
            const correspondeNivel =
              filtroNivel ===
              "TODOS" ||
              aluno.analise
                .nivel ===
              filtroNivel;

            if (
              !correspondeNivel
            ) {
              return false;
            }

            if (!termo) {
              return true;
            }

            const nome =
              aluno.nome
                .toLocaleLowerCase();

            const matricula =
              (
                aluno.matricula ??
                ""
              )
                .toLocaleLowerCase();

            const telefone =
              (
                aluno.contato
                  ?.telefone ??
                ""
              )
                .toLocaleLowerCase();

            return (
              nome.includes(
                termo
              ) ||
              matricula.includes(
                termo
              ) ||
              telefone.includes(
                termo
              )
            );
          }
        );
      },
      [
        busca,
        dados,
        filtroNivel,
      ]
    );

  const resumo =
    dados?.resumo;

  return (
    <main
      className="
        phanyx-student-success-page
        min-h-full
        bg-slate-50
        text-slate-950
        dark:bg-slate-950
        dark:text-slate-100
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1600px]
          space-y-6
          p-4
          sm:p-6
          lg:p-8
        "
      >
        {/* CABEÇALHO */}
        <section
          className="
            phanyx-student-success-hero
            overflow-hidden
            rounded-3xl
            border
            p-6
            shadow-sm
            sm:p-8
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div
              className="
                max-w-3xl
              "
            >
              <div
                className="
                  mb-3
                  inline-flex
                  rounded-full
                  border
                  border-blue-200
                  bg-blue-100
                  px-3
                  py-1
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-blue-900
                  dark:border-blue-800
                  dark:bg-blue-950
                  dark:text-blue-200
                "
              >
                PHANYX
              </div>

              <h1
                className="
                  text-2xl
                  font-bold
                  tracking-tight
                  text-slate-950
                  dark:text-white
                  sm:text-3xl
                "
              >
                {t(
                  "title"
                )}
              </h1>

              <p
                className="
                  mt-2
                  text-base
                  font-semibold
                  text-blue-800
                  dark:text-blue-300
                "
              >
                {t(
                  "subtitle"
                )}
              </p>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-700
                  dark:text-slate-300
                  sm:text-base
                "
              >
                {t(
                  "description"
                )}
              </p>
            </div>

            <div
              className="
                flex
                h-20
                w-20
                shrink-0
                items-center
                justify-center
                self-start
                rounded-3xl
                border
                border-blue-200
                bg-white
                shadow-sm
                dark:border-blue-800
                dark:bg-slate-900
                lg:self-center
              "
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="
                  h-10
                  w-10
                  text-blue-700
                  dark:text-blue-300
                "
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 19V9m5 10V5m5 14v-7m5 7V3"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m3 7 5-3 5 4 7-5"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* VISÃO GERAL */}
        <section>
          <div
            className="
              mb-4
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <h2
              className="
                phanyx-student-success-section-title
                text-lg
                font-bold
                text-slate-950
                dark:text-white
              "
            >
              {t(
                "overview.title"
              )}
            </h2>

            <button
              type="button"
              onClick={
                () =>
                  void carregarDados()
              }
              disabled={
                carregando
              }
              className="
              phanyx-student-success-refresh-button
                inline-flex
                items-center
                justify-center
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-2
                text-sm
                font-semibold
                text-slate-700
                shadow-sm
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-200
                dark:hover:bg-slate-800
              "
            >
              {t(
                "actions.refresh"
              )}
            </button>
          </div>

          <div
            className="
              grid
              gap-4
              sm:grid-cols-2
              xl:grid-cols-5
            "
          >
            <CardResumo
              valor={
                carregando
                  ? "—"
                  : String(
                    resumo
                      ?.critico ??
                    0
                  )
              }
              titulo={t(
                "cards.critical"
              )}
              variante="critical"
            />

            <CardResumo
              valor={
                carregando
                  ? "—"
                  : String(
                    resumo
                      ?.risco ??
                    0
                  )
              }
              titulo={t(
                "cards.risk"
              )}
              variante="risk"
            />

            <CardResumo
              valor={
                carregando
                  ? "—"
                  : String(
                    resumo
                      ?.atencao ??
                    0
                  )
              }
              titulo={t(
                "cards.attention"
              )}
              variante="attention"
            />

            <CardResumo
              valor={
                carregando
                  ? "—"
                  : String(
                    resumo
                      ?.normal ??
                    0
                  )
              }
              titulo={t(
                "cards.normal"
              )}
              variante="normal"
            />

            <CardResumo
              valor={
                carregando
                  ? "—"
                  : String(
                    resumo
                      ?.dadosInsuficientes ??
                    0
                  )
              }
              titulo={t(
                "cards.insufficient"
              )}
              variante="insufficient"
            />
          </div>
        </section>

        {/* ALUNOS PARA ACOMPANHAMENTO */}
        <section
          className="
            phanyx-student-success-panel
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <div
            className="
              border-b
              border-slate-200
              px-5
              py-5
              dark:border-slate-800
              sm:px-6
            "
          >
            <h2
              className="
                phanyx-student-success-panel-title
                text-lg
                font-bold
                text-slate-950
                dark:text-white
              "
            >
              {t(
                "studentsAttention.title"
              )}
            </h2>

            <p
              className="
                phanyx-student-success-muted
                mt-1
                text-sm
                leading-6
                text-slate-600
                dark:text-slate-300
              "
            >
              {t(
                "studentsAttention.description"
              )}
            </p>
          </div>

          {!carregando &&
            !erro ? (
            <div
              className="
      border-b
      border-slate-200
      p-4
      dark:border-slate-800
      sm:p-5
    "
            >
              <div
                className="
        flex
        flex-col
        gap-4
      "
              >
                <div
                  className="
          relative
        "
                >
                  <span
                    className="
            pointer-events-none
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-slate-400
          "
                    aria-hidden="true"
                  >
                    🔎
                  </span>

                  <input

                    type="search"
                    value={
                      busca
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setBusca(
                          event
                            .target
                            .value
                        )
                    }
                    placeholder={t(
                      "filters.searchPlaceholder"
                    )}
                    className="
                     phanyx-student-success-search
            w-full
            rounded-xl
            border
            border-slate-300
            bg-white
            py-3
            pl-11
            pr-4
            text-sm
            font-medium
            text-slate-900
            outline-none
            transition
            placeholder:text-slate-400
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-500/20
            dark:border-slate-700
            dark:bg-slate-950
            dark:text-white
          "
                  />
                </div>

                <div
                  className="
    flex
    flex-wrap
    gap-2
  "
                >
                  {(
                    [
                      [
                        "TODOS",
                        t("filters.all"),
                        dados?.resumo.monitorados ?? 0,
                      ],
                      [
                        "CRITICO",
                        t("levels.CRITICO"),
                        dados?.resumo.critico ?? 0,
                      ],
                      [
                        "RISCO",
                        t("levels.RISCO"),
                        dados?.resumo.risco ?? 0,
                      ],
                      [
                        "ATENCAO",
                        t("levels.ATENCAO"),
                        dados?.resumo.atencao ?? 0,
                      ],
                      [
                        "NORMAL",
                        t("levels.NORMAL"),
                        dados?.resumo.normal ?? 0,
                      ],
                      [
                        "DADOS_INSUFICIENTES",
                        t("levels.DADOS_INSUFICIENTES"),
                        dados?.resumo.dadosInsuficientes ?? 0,
                      ],
                    ] as const
                  ).map(
                    ([
                      valor,
                      titulo,
                      quantidade,
                    ]) => (
                      <button
                        key={valor}
                        type="button"
                        onClick={() =>
                          setFiltroNivel(
                            valor
                          )
                        }
                        className={[
                          "phanyx-student-success-filter rounded-full border px-4 py-2 text-sm font-semibold transition",

                          filtroNivel === valor
                            ? "phanyx-student-success-filter-active"
                            : "phanyx-student-success-filter-inactive",
                        ].join(" ")}
                      >
                        {titulo}

                        <span
                          className="
            ml-2
            opacity-100
          "
                        >
                          {quantidade}
                        </span>
                      </button>
                    )
                  )}
                </div>

              </div>
            </div>
          ) : null}

          {carregando ? (
            <div
              className="
                flex
                min-h-[280px]
                items-center
                justify-center
                p-6
              "
            >
              <div
                className="
                  max-w-md
                  text-center
                "
              >
                <div
                  className="
                    mx-auto
                    h-10
                    w-10
                    animate-spin
                    rounded-full
                    border-4
                    border-slate-200
                    border-t-blue-600
                    dark:border-slate-700
                    dark:border-t-blue-400
                  "
                  aria-hidden="true"
                />

                <p
                  className="
                    phanyx-student-success-muted
                    mt-4
                    text-sm
                    font-semibold
                    text-slate-700
                    dark:text-slate-200
                  "
                >
                  {t(
                    "states.loading"
                  )}
                </p>
              </div>
            </div>
          ) : erro ? (
            <div
              className="
                flex
                min-h-[240px]
                items-center
                justify-center
                p-6
              "
            >
              <div
                className="
                  max-w-md
                  text-center
                "
              >
                <p
                  className="
                    font-semibold
                    text-red-700
                    dark:text-red-300
                  "
                >
                  {t(
                    "states.error"
                  )}
                </p>

                <button
                  type="button"
                  onClick={
                    () =>
                      void carregarDados()
                  }
                  className="
                    mt-4
                    rounded-xl
                    bg-blue-700
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-blue-800
                  "
                >
                  {t(
                    "actions.refresh"
                  )}
                </button>
              </div>
            </div>
          ) : alunosFiltrados.length ===
            0 ? (
            <div
              className="
                flex
                min-h-[240px]
                items-center
                justify-center
                p-6
              "
            >
              <p
                className="
                  phanyx-student-success-muted
                  text-center
                  text-sm
                  font-semibold
                  text-slate-700
                  dark:text-slate-200
                "
              >
                {t(
                  "states.noRisk"
                )}
              </p>
            </div>
          ) : (
            <div
              className="
                overflow-x-auto
              "
            >
              <table
                className="
    phanyx-student-success-table
    w-full
    min-w-[900px]
    border-collapse
  "
              >
                <thead
                  className="
                    bg-slate-50
                    dark:bg-slate-950/60
                  "
                >
                  <tr>
                    <th
                      className="
                        px-5
                        py-3
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {t(
                        "table.student"
                      )}
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {t(
                        "table.risk"
                      )}
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {t(
                        "table.score"
                      )}
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {t(
                        "table.frequency"
                      )}
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {t(
                        "table.performance"
                      )}
                    </th>

                    <th
                      className="
                        px-4
                        py-3
                        text-center
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-600
                        dark:text-slate-300
                      "
                    >
                      {t(
                        "table.pendingActivities"
                      )}
                    </th>
                  </tr>
                </thead>

                <tbody
                  className="
                    divide-y
                    divide-slate-200
                    dark:divide-slate-800
                  "
                >
                  {alunosFiltrados.map(
                    (
                      aluno
                    ) => {
                      const dadosInsuficientes =
                        aluno
                          .analise
                          .nivel ===
                        "DADOS_INSUFICIENTES";

                      return (
                        <tr
                          key={
                            aluno.alunoId
                          }
                          onClick={() =>
                            setAlunoSelecionado(
                              aluno
                            )
                          }
                          onKeyDown={
                            (
                              event
                            ) => {
                              if (
                                event.key ===
                                "Enter" ||
                                event.key ===
                                " "
                              ) {
                                event.preventDefault();

                                setAlunoSelecionado(
                                  aluno
                                );
                              }
                            }
                          }
                          tabIndex={0}
                          className="
    cursor-pointer
    transition
    hover:bg-blue-50
    focus:outline-none
    focus:ring-2
    focus:ring-inset
    focus:ring-blue-500
    dark:hover:bg-slate-800/60
  "
                        >

                          <td
                            className="
                              px-5
                              py-4
                            "
                          >
                            <div
                              className="
    phanyx-student-success-student-name
    font-semibold
    text-slate-950
    dark:text-white
  "
                            >
                              {
                                aluno.nome
                              }
                            </div>

                            {aluno.matricula ? (
                              <div
                                className="
    phanyx-student-success-student-registration
    mt-1
    text-xs
    text-slate-500
    dark:text-slate-400
  "
                              >
                                {
                                  aluno.matricula
                                }
                              </div>
                            ) : null}
                          </td>

                          <td
                            className="
                              px-4
                              py-4
                            "
                          >
                            <span
                              className={[
                                "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                                classeNivel(
                                  aluno
                                    .analise
                                    .nivel
                                ),
                              ].join(
                                " "
                              )}
                            >
                              {t(
                                `levels.${aluno.analise.nivel}`
                              )}
                            </span>
                          </td>

                          <td
                            className="
                              px-4
                              py-4
                              text-center
                              text-sm
                              font-bold
                              text-slate-800
                              dark:text-slate-100
                            "
                          >
                            {dadosInsuficientes
                              ? "—"
                              : aluno
                                .analise
                                .pontuacao}
                          </td>

                          <td
                            className="
                              px-4
                              py-4
                              text-center
                              text-sm
                              font-semibold
                              text-slate-700
                              dark:text-slate-200
                            "
                          >
                            {formatarPercentual(
                              aluno
                                .indicadores
                                .frequenciaPercentual
                            )}
                          </td>

                          <td
                            className="
                              px-4
                              py-4
                              text-center
                              text-sm
                              font-semibold
                              text-slate-700
                              dark:text-slate-200
                            "
                          >
                            {formatarPercentual(
                              aluno
                                .indicadores
                                .mediaPercentual
                            )}
                          </td>

                          <td
                            className="
                              px-4
                              py-4
                              text-center
                              text-sm
                              font-bold
                              text-slate-800
                              dark:text-slate-100
                            "
                          >
                            {
                              aluno
                                .indicadores
                                .atividadesVencidas
                            }
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* APOIO À DECISÃO */}
        <section
          className="
          phanyx-student-success-disclaimer
            rounded-2xl
            border
            border-blue-200
            bg-blue-50
            p-5
            text-blue-950
            dark:border-blue-900/70
            dark:bg-blue-950/30
            dark:text-blue-100
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
              phanyx-student-success-disclaimer-icon
                mt-0.5
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-blue-100
                text-blue-800
                dark:bg-blue-900/70
                dark:text-blue-200
              "
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="
                  h-5
                  w-5
                "
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />

                <path
                  strokeLinecap="round"
                  d="M12 10v6"
                />

                <path
                  strokeLinecap="round"
                  d="M12 7h.01"
                />
              </svg>
            </div>

            <div>
              <h3
                className="
    phanyx-student-success-disclaimer-title
    font-bold
  "
              >
                {t(
                  "disclaimer.title"
                )}
              </h3>

              <p
                className="
                phanyx-student-success-disclaimer-text
                  mt-1
                  text-sm
                  leading-6
                  text-blue-900
                  dark:text-blue-200
                "
              >
                {t(
                  "disclaimer.text"
                )}
              </p>
            </div>
          </div>
        </section>
      </div >
      {alunoSelecionado ? (
        <div
          className="
      fixed
      inset-0
      z-[120]
      flex
      justify-end
    "
          role="presentation"
        >
          {/* FUNDO */}
          <button
            type="button"
            aria-label={t(
              "drawer.close"
            )}
            onClick={() =>
              setAlunoSelecionado(
                null
              )
            }
            className="
        absolute
        inset-0
        cursor-default
        bg-black/45
        backdrop-blur-[1px]
      "
          />

          {/* DRAWER */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-success-drawer-title"
            className="
        phanyx-student-success-drawer
        relative
        z-10
        flex
        h-full
        w-full
        max-w-[560px]
        flex-col
        overflow-hidden
        border-l
        border-slate-200
        bg-white
        shadow-2xl
        dark:border-slate-700
        dark:bg-slate-950
      "
          >
            {/* CABEÇALHO */}
            <div
              className="
          phanyx-student-success-drawer-header
          flex
          items-start
          justify-between
          gap-4
          border-b
          border-slate-200
          px-5
          py-5
          dark:border-slate-800
          sm:px-6
        "
            >
              <div
                className="
            min-w-0
          "
              >
                <p
                  className="
              text-xs
              font-bold
              uppercase
              tracking-[0.14em]
              text-blue-600
              dark:text-blue-300
            "
                >
                  {t(
                    "drawer.analysis"
                  )}
                </p>

                <h2
                  id="student-success-drawer-title"
                  className="
              phanyx-student-success-drawer-name
              mt-1
              break-words
              text-xl
              font-bold
              text-slate-950
              dark:text-white
            "
                >
                  {
                    alunoSelecionado.nome
                  }
                </h2>

                {alunoSelecionado.matricula ? (
                  <p
                    className="
                phanyx-student-success-drawer-muted
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              "
                  >
                    {
                      alunoSelecionado.matricula
                    }
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() =>
                  setAlunoSelecionado(
                    null
                  )
                }
                aria-label={t(
                  "drawer.close"
                )}
                className="
            phanyx-student-success-drawer-close
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            border
            border-slate-300
            bg-white
            text-xl
            font-bold
            text-slate-700
            transition
            hover:bg-slate-100
            dark:border-slate-700
            dark:bg-slate-900
            dark:text-white
            dark:hover:bg-slate-800
          "
              >
                ×
              </button>
            </div>

            {/* CONTEÚDO */}
            <div
              className="
          flex-1
          space-y-5
          overflow-y-auto
          p-5
          sm:p-6
        "
            >
              {/* CLASSIFICAÇÃO */}
              <section
                className="
            phanyx-student-success-drawer-card
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            p-4
            dark:border-slate-800
            dark:bg-slate-900
          "
              >
                <div
                  className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
            "
                >
                  <span
                    className={[
                      "inline-flex rounded-full border px-3 py-1.5 text-xs font-bold",
                      classeNivel(
                        alunoSelecionado
                          .analise
                          .nivel
                      ),
                    ].join(
                      " "
                    )}
                  >
                    {t(
                      `levels.${alunoSelecionado.analise.nivel}`
                    )}
                  </span>

                  {alunoSelecionado.analise
                    .nivel !==
                    "DADOS_INSUFICIENTES" ? (
                    <div
                      className="
                  text-right
                "
                    >
                      <div
                        className="
                    phanyx-student-success-drawer-muted
                    text-xs
                    font-semibold
                    text-slate-500
                    dark:text-slate-400
                  "
                      >
                        {t(
                          "drawer.score"
                        )}
                      </div>

                      <div
                        className="
                    text-2xl
                    font-bold
                    text-slate-950
                    dark:text-white
                  "
                      >
                        {
                          alunoSelecionado
                            .analise
                            .pontuacao
                        }
                      </div>
                    </div>
                  ) : null}
                </div>

                {alunoSelecionado.analise
                  .nivel ===
                  "DADOS_INSUFICIENTES" ? (
                  <p
                    className="
                phanyx-student-success-drawer-muted
                mt-3
                text-sm
                leading-6
                text-slate-600
                dark:text-slate-300
              "
                  >
                    {t(
                      "drawer.scoreUnavailable"
                    )}
                  </p>
                ) : null}

                <div
                  className="
              mt-4
              grid
              grid-cols-2
              gap-3
            "
                >
                  <div
                    className="
                phanyx-student-success-drawer-metric
                rounded-xl
                border
                border-slate-200
                bg-white
                p-3
                dark:border-slate-700
                dark:bg-slate-950
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  text-xs
                  font-semibold
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "drawer.dataCoverage"
                      )}
                    </div>

                    <div
                      className="
                  mt-1
                  text-lg
                  font-bold
                  text-slate-950
                  dark:text-white
                "
                    >
                      {
                        alunoSelecionado
                          .analise
                          .coberturaPercentual
                      }%
                    </div>
                  </div>

                  <div
                    className="
                phanyx-student-success-drawer-metric
                rounded-xl
                border
                border-slate-200
                bg-white
                p-3
                dark:border-slate-700
                dark:bg-slate-950
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  text-xs
                  font-semibold
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "drawer.reliability"
                      )}
                    </div>

                    <div
                      className="
                  mt-1
                  text-lg
                  font-bold
                  text-slate-950
                  dark:text-white
                "
                    >
                      {t(
                        `reliability.${alunoSelecionado.analise.confiabilidade}`
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="
              mt-4
              overflow-hidden
              rounded-full
              bg-slate-200
              dark:bg-slate-800
            "
                >
                  <div
                    className="
                h-2
                rounded-full
                bg-blue-600
                transition-all
              "
                    style={{
                      width:
                        `${Math.max(
                          0,
                          Math.min(
                            100,
                            alunoSelecionado
                              .analise
                              .coberturaPercentual
                          )
                        )}%`,
                    }}
                  />
                </div>
              </section>

              {/* INDICADORES */}
              <section>
                <h3
                  className="
              phanyx-student-success-drawer-title
              text-sm
              font-bold
              uppercase
              tracking-wide
              text-slate-950
              dark:text-white
            "
                >
                  {t(
                    "drawer.indicators"
                  )}
                </h3>

                <div
                  className="
              mt-3
              grid
              gap-3
              sm:grid-cols-2
            "
                >
                  <div
                    className="
                phanyx-student-success-drawer-metric
                rounded-xl
                border
                border-slate-200
                bg-white
                p-4
                dark:border-slate-800
                dark:bg-slate-900
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  text-xs
                  font-semibold
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "components.FREQUENCIA"
                      )}
                    </div>

                    <div
                      className="
                  mt-1
                  text-xl
                  font-bold
                  text-slate-950
                  dark:text-white
                "
                    >
                      {formatarPercentual(
                        alunoSelecionado
                          .indicadores
                          .frequenciaPercentual
                      )}
                    </div>

                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  mt-1
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "drawer.classes"
                      )}:{" "}
                      {
                        alunoSelecionado
                          .indicadores
                          .quantidadeAulas
                      }
                    </div>
                  </div>

                  <div
                    className="
                phanyx-student-success-drawer-metric
                rounded-xl
                border
                border-slate-200
                bg-white
                p-4
                dark:border-slate-800
                dark:bg-slate-900
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  text-xs
                  font-semibold
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "components.DESEMPENHO"
                      )}
                    </div>

                    <div
                      className="
                  mt-1
                  text-xl
                  font-bold
                  text-slate-950
                  dark:text-white
                "
                    >
                      {formatarPercentual(
                        alunoSelecionado
                          .indicadores
                          .mediaPercentual
                      )}
                    </div>

                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  mt-1
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "drawer.assessments"
                      )}:{" "}
                      {
                        alunoSelecionado
                          .indicadores
                          .quantidadeAvaliacoes
                      }
                    </div>
                  </div>

                  <div
                    className="
                phanyx-student-success-drawer-metric
                rounded-xl
                border
                border-slate-200
                bg-white
                p-4
                dark:border-slate-800
                dark:bg-slate-900
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  text-xs
                  font-semibold
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "drawer.pendingActivities"
                      )}
                    </div>

                    <div
                      className="
                  mt-1
                  text-xl
                  font-bold
                  text-slate-950
                  dark:text-white
                "
                    >
                      {
                        alunoSelecionado
                          .indicadores
                          .atividadesVencidas
                      }
                    </div>
                  </div>

                  <div
                    className="
                phanyx-student-success-drawer-metric
                rounded-xl
                border
                border-slate-200
                bg-white
                p-4
                dark:border-slate-800
                dark:bg-slate-900
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-muted
                  text-xs
                  font-semibold
                  text-slate-500
                  dark:text-slate-400
                "
                    >
                      {t(
                        "drawer.recentEvolution"
                      )}
                    </div>

                    <div
                      className="
                  mt-1
                  text-xl
                  font-bold
                  text-slate-950
                  dark:text-white
                "
                    >
                      {alunoSelecionado
                        .indicadores
                        .quedaDesempenhoPercentual ===
                        null
                        ? "—"
                        : `${Math.round(
                          alunoSelecionado
                            .indicadores
                            .quedaDesempenhoPercentual
                        )}%`}
                    </div>
                  </div>
                </div>
              </section>

              {/* SINAIS */}
              <section>
                <h3
                  className="
              phanyx-student-success-drawer-title
              text-sm
              font-bold
              uppercase
              tracking-wide
              text-slate-950
              dark:text-white
            "
                >
                  {t(
                    "drawer.mainSignals"
                  )}
                </h3>

                <div
                  className="
              mt-3
              space-y-2
            "
                >
                  {alunoSelecionado
                    .analise
                    .fatoresPrincipais
                    .length > 0 ? (
                    alunoSelecionado
                      .analise
                      .fatoresPrincipais
                      .map(
                        (
                          fator
                        ) => (
                          <div
                            key={
                              fator.codigo
                            }
                            className="
                        phanyx-student-success-drawer-signal
                        flex
                        items-start
                        gap-3
                        rounded-xl
                        border
                        border-amber-200
                        bg-amber-50
                        p-3
                        text-amber-950
                        dark:border-amber-900/60
                        dark:bg-amber-950/30
                        dark:text-amber-100
                      "
                          >
                            <span
                              aria-hidden="true"
                            >
                              ⚠️
                            </span>

                            <div>
                              <div
                                className="
                            font-semibold
                          "
                              >
                                {t(
                                  `components.${fator.codigo}`
                                )}
                              </div>

                              {fator.codigo ===
                                "PENDENCIAS" ? (
                                <div
                                  className="
                              mt-1
                              text-sm
                            "
                                >
                                  {
                                    alunoSelecionado
                                      .indicadores
                                      .atividadesVencidas
                                  }{" "}
                                  {t(
                                    "drawer.pendingActivities"
                                  ).toLocaleLowerCase()}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )
                      )
                  ) : (
                    <div
                      className="
                  phanyx-student-success-drawer-empty
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  p-4
                  text-sm
                  text-slate-600
                  dark:border-slate-800
                  dark:bg-slate-900
                  dark:text-slate-300
                "
                    >
                      {t(
                        "drawer.noMainSignals"
                      )}
                    </div>
                  )}
                </div>

                {alunoSelecionado
                  .analise
                  .componentes
                  .some(
                    (
                      componente
                    ) =>
                      !componente.disponivel
                  ) ? (
                  <div
                    className="
                phanyx-student-success-drawer-empty
                mt-3
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                p-4
                dark:border-slate-800
                dark:bg-slate-900
              "
                  >
                    <div
                      className="
                  phanyx-student-success-drawer-title
                  text-sm
                  font-bold
                  text-slate-900
                  dark:text-white
                "
                    >
                      {t(
                        "drawer.missingData"
                      )}
                    </div>

                    <div
                      className="
                  mt-2
                  flex
                  flex-wrap
                  gap-2
                "
                    >
                      {alunoSelecionado
                        .analise
                        .componentes
                        .filter(
                          (
                            componente
                          ) =>
                            !componente.disponivel
                        )
                        .map(
                          (
                            componente
                          ) => (
                            <span
                              key={
                                componente.codigo
                              }
                              className="
                          rounded-full
                          border
                          border-slate-300
                          bg-white
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          text-slate-700
                          dark:border-slate-700
                          dark:bg-slate-950
                          dark:text-slate-200
                        "
                            >
                              {t(
                                `components.${componente.codigo}`
                              )}
                            </span>
                          )
                        )}
                    </div>
                  </div>
                ) : null}
              </section>

              {/* CONTATO */}
              <section>
                <h3
                  className="
              phanyx-student-success-drawer-title
              text-sm
              font-bold
              uppercase
              tracking-wide
              text-slate-950
              dark:text-white
            "
                >
                  {t(
                    "drawer.contact"
                  )}
                </h3>

                <div
                  className="
              phanyx-student-success-drawer-card
              mt-3
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              dark:border-slate-800
              dark:bg-slate-900
            "
                >
                  <h4
                    className="
                font-bold
                text-slate-950
                dark:text-white
              "
                  >
                    {t(
                      "drawer.studentContact"
                    )}
                  </h4>

                  <dl
                    className="
                mt-3
                space-y-3
                text-sm
              "
                  >
                    <div>
                      <dt
                        className="
                    phanyx-student-success-drawer-muted
                    text-xs
                    font-semibold
                    text-slate-500
                    dark:text-slate-400
                  "
                      >
                        {t(
                          "drawer.phone"
                        )}
                      </dt>

                      <dd
                        className="
                    mt-1
                    font-semibold
                    text-slate-900
                    dark:text-white
                  "
                      >
                        {alunoSelecionado
                          .contato
                          .telefone ??
                          t(
                            "drawer.unavailable"
                          )}
                      </dd>
                    </div>

                    <div>
                      <dt
                        className="
                    phanyx-student-success-drawer-muted
                    text-xs
                    font-semibold
                    text-slate-500
                    dark:text-slate-400
                  "
                      >
                        {t(
                          "drawer.email"
                        )}
                      </dt>

                      <dd
                        className="
                    mt-1
                    break-all
                    font-semibold
                    text-slate-900
                    dark:text-white
                  "
                      >
                        {emailPodeSerUsado(
                          alunoSelecionado
                            .contato
                            .email
                        )
                          ? alunoSelecionado
                            .contato
                            .email
                          : t(
                            "drawer.unavailable"
                          )}
                      </dd>
                    </div>
                  </dl>

                  {alunoSelecionado
                    .contato
                    .responsavel
                    .nome ||
                    alunoSelecionado
                      .contato
                      .responsavel
                      .telefone ||
                    alunoSelecionado
                      .contato
                      .responsavel
                      .email ? (
                    <div
                      className="
                  mt-5
                  border-t
                  border-slate-200
                  pt-4
                  dark:border-slate-700
                "
                    >
                      <h4
                        className="
                    font-bold
                    text-slate-950
                    dark:text-white
                  "
                      >
                        {t(
                          "drawer.responsibleContact"
                        )}
                      </h4>

                      <div
                        className="
                    mt-3
                    space-y-2
                    text-sm
                    text-slate-800
                    dark:text-slate-200
                  "
                      >
                        <p>
                          <strong>
                            {t(
                              "drawer.responsible"
                            )}:
                          </strong>{" "}
                          {alunoSelecionado
                            .contato
                            .responsavel
                            .nome ??
                            t(
                              "drawer.unavailable"
                            )}
                        </p>

                        <p>
                          <strong>
                            {t(
                              "drawer.relationship"
                            )}:
                          </strong>{" "}
                          {alunoSelecionado
                            .contato
                            .responsavel
                            .parentesco ??
                            t(
                              "drawer.unavailable"
                            )}
                        </p>

                        <p>
                          <strong>
                            {t(
                              "drawer.phone"
                            )}:
                          </strong>{" "}
                          {alunoSelecionado
                            .contato
                            .responsavel
                            .telefone ??
                            t(
                              "drawer.unavailable"
                            )}
                        </p>

                        <p>
                          <strong>
                            {t(
                              "drawer.email"
                            )}:
                          </strong>{" "}
                          {alunoSelecionado
                            .contato
                            .responsavel
                            .email ??
                            t(
                              "drawer.unavailable"
                            )}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              {/* AÇÕES */}
              <section>
                <h3
                  className="
              phanyx-student-success-drawer-title
              text-sm
              font-bold
              uppercase
              tracking-wide
              text-slate-950
              dark:text-white
            "
                >
                  {t(
                    "drawer.actions"
                  )}
                </h3>

                <div
                  className="
              mt-3
              grid
              gap-2
              sm:grid-cols-3
            "
                >
                  <button
                    type="button"
                    disabled
                    title={t(
                      "drawer.actionComingSoon"
                    )}
                    className="
                rounded-xl
                border
                border-emerald-300
                bg-emerald-50
                px-3
                py-3
                text-sm
                font-bold
                text-emerald-800
                opacity-60
                dark:border-emerald-900
                dark:bg-emerald-950/30
                dark:text-emerald-200
              "
                  >
                    💬{" "}
                    {t(
                      "drawer.whatsapp"
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={
                      !telefoneParaLink(
                        alunoSelecionado
                          .contato
                          .telefone
                      )
                    }
                    onClick={() => {
                      const telefone =
                        telefoneParaLink(
                          alunoSelecionado
                            .contato
                            .telefone
                        );

                      if (!telefone) {
                        return;
                      }

                      window.location.href =
                        `tel:${telefone}`;
                    }}
                    className="
                rounded-xl
                border
                border-blue-300
                bg-blue-50
                px-3
                py-3
                text-sm
                font-bold
                text-blue-800
                transition
                hover:bg-blue-100
                disabled:cursor-not-allowed
                disabled:opacity-40
                dark:border-blue-900
                dark:bg-blue-950/30
                dark:text-blue-200
              "
                  >
                    📞{" "}
                    {t(
                      "drawer.call"
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={
                      !emailPodeSerUsado(
                        alunoSelecionado
                          .contato
                          .email
                      )
                    }
                    onClick={() => {
                      const email =
                        alunoSelecionado
                          .contato
                          .email;

                      if (
                        !emailPodeSerUsado(
                          email
                        ) ||
                        !email
                      ) {
                        return;
                      }

                      window.location.href =
                        `mailto:${email}`;
                    }}
                    className="
                rounded-xl
                border
                border-violet-300
                bg-violet-50
                px-3
                py-3
                text-sm
                font-bold
                text-violet-800
                transition
                hover:bg-violet-100
                disabled:cursor-not-allowed
                disabled:opacity-40
                dark:border-violet-900
                dark:bg-violet-950/30
                dark:text-violet-200
              "
                  >
                    ✉️{" "}
                    {t(
                      "drawer.sendEmail"
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  disabled
                  title={t(
                    "drawer.actionComingSoon"
                  )}
                  className="
              mt-3
              w-full
              rounded-xl
              bg-blue-700
              px-4
              py-3
              text-sm
              font-bold
              text-white
              opacity-60
            "
                >
                  +{" "}
                  {t(
                    "drawer.registerIntervention"
                  )}
                </button>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </main >
  );
}