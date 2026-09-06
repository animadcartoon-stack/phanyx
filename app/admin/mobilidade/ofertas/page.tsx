"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type StatusOferta =
  | "RASCUNHO"
  | "INSCRICOES_AGENDADAS"
  | "INSCRICOES_ABERTAS"
  | "INSCRICOES_ENCERRADAS"
  | "EM_SELECAO"
  | "FINALIZADA"
  | "CANCELADA";

type Curso = {
  id: number;
  nome: string;
  codigo: string | null;
  ativo: boolean;
};

type Programa = {
  id: number;
  nome: string;
  codigo: string | null;
  tipo: string;
  direcao: string;
  status: string;
  ativo: boolean;

  instituicaoParceira: {
    id: number;
    nome: string;
    paisCodigo: string;
  } | null;
};

type Criterios = {
  mediaMinima: number | null;
  frequenciaMinima: number | null;
  semestreMinimo: number | null;
  semestreMaximo: number | null;
  idadeMinima: number | null;
  idadeMaxima: number | null;
  exigeRegularidadeAcademica: boolean;
  exigeRegularidadeFinanceira: boolean;
  observacoes: string | null;
};

type Oferta = {
  id: number;
  programaId: number;
  titulo: string;
  codigo: string | null;
  descricao: string | null;
  status: StatusOferta;
  ano: number | null;
  periodo: string | null;
  inscricoesInicio: string | null;
  inscricoesFim: string | null;
  mobilidadeInicio: string | null;
  mobilidadeFim: string | null;
  vagas: number | null;
  permiteListaEspera: boolean;
  criteriosElegibilidade: unknown;
  instrucoes: string | null;
  publicadoEm: string | null;
  createdAt: string;
  updatedAt: string;

  programa: Programa & {
    convenio: {
      id: number;
      nome: string;
      codigo: string | null;
    } | null;
  };

  cursos: Array<{
    id: number;
    cursoId: number;
    curso: Curso;
  }>;

  _count: {
    candidaturas: number;
  };
};

type RespostaLista = {
  ok: true;

  permissoes: {
    podeGerenciar: boolean;
  };

  resumo: {
    total: number;
    agendadas: number;
    abertas: number;
    emSelecao: number;
  };

  ofertas: Oferta[];
  programas: Programa[];
  cursos: Curso[];
};

type RespostaErro = {
  ok?: false;
  codigo?: string;
};

type Formulario = {
  programaId: string;
  titulo: string;
  codigo: string;
  descricao: string;
  status: StatusOferta;
  ano: string;
  periodo: string;
  inscricoesInicio: string;
  inscricoesFim: string;
  mobilidadeInicio: string;
  mobilidadeFim: string;
  vagas: string;
  permiteListaEspera: boolean;
  cursoIds: number[];

  mediaMinima: string;
  frequenciaMinima: string;
  semestreMinimo: string;
  semestreMaximo: string;
  idadeMinima: string;
  idadeMaxima: string;
  exigeRegularidadeAcademica: boolean;
  exigeRegularidadeFinanceira: boolean;
  criteriosObservacoes: string;

  instrucoes: string;
};

type Toast = {
  tipo: "sucesso" | "erro";
  mensagem: string;
};

const FORMULARIO_INICIAL: Formulario = {
  programaId: "",
  titulo: "",
  codigo: "",
  descricao: "",
  status: "RASCUNHO",
  ano: "",
  periodo: "",
  inscricoesInicio: "",
  inscricoesFim: "",
  mobilidadeInicio: "",
  mobilidadeFim: "",
  vagas: "",
  permiteListaEspera: true,
  cursoIds: [],

  mediaMinima: "",
  frequenciaMinima: "",
  semestreMinimo: "",
  semestreMaximo: "",
  idadeMinima: "",
  idadeMaxima: "",
  exigeRegularidadeAcademica: true,
  exigeRegularidadeFinanceira: false,
  criteriosObservacoes: "",

  instrucoes: "",
};

function dataInput(
  valor: string | null
) {
  return valor
    ? valor.slice(0, 10)
    : "";
}

function bandeira(
  codigo?: string | null
) {
  if (
    !codigo ||
    !/^[A-Z]{2}$/.test(codigo)
  ) {
    return "🌍";
  }

  return codigo.replace(
    /./g,
    (letra) =>
      String.fromCodePoint(
        127397 +
          letra.charCodeAt(0)
      )
  );
}

function numeroFormulario(
  valor: number | null
) {
  return valor === null
    ? ""
    : String(valor);
}

function normalizarCriterios(
  valor: unknown
): Criterios {
  const fonte =
    valor &&
    typeof valor === "object" &&
    !Array.isArray(valor)
      ? (
          valor as Record<
            string,
            unknown
          >
        )
      : {};

  function numero(
    chave: string
  ) {
    const valorCampo =
      fonte[chave];

    return typeof valorCampo ===
      "number"
      ? valorCampo
      : null;
  }

  return {
    mediaMinima:
      numero("mediaMinima"),

    frequenciaMinima:
      numero(
        "frequenciaMinima"
      ),

    semestreMinimo:
      numero(
        "semestreMinimo"
      ),

    semestreMaximo:
      numero(
        "semestreMaximo"
      ),

    idadeMinima:
      numero("idadeMinima"),

    idadeMaxima:
      numero("idadeMaxima"),

    exigeRegularidadeAcademica:
      fonte.exigeRegularidadeAcademica !==
      false,

    exigeRegularidadeFinanceira:
      fonte.exigeRegularidadeFinanceira ===
      true,

    observacoes:
      typeof fonte.observacoes ===
      "string"
        ? fonte.observacoes
        : null,
  };
}

export default function OfertasMobilidadePage() {
  const locale =
    useLocale();

  const t =
    useTranslations(
      "AdminMobilityOffers"
    );

  const [
    ofertas,
    setOfertas,
  ] =
    useState<Oferta[]>(
      []
    );

  const [
    programas,
    setProgramas,
  ] =
    useState<Programa[]>(
      []
    );

  const [
    cursos,
    setCursos,
  ] =
    useState<Curso[]>(
      []
    );

  const [
    resumo,
    setResumo,
  ] = useState({
    total: 0,
    agendadas: 0,
    abertas: 0,
    emSelecao: 0,
  });

  const [
    podeGerenciar,
    setPodeGerenciar,
  ] = useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    filtroStatus,
    setFiltroStatus,
  ] = useState("");

  const [
    filtroPrograma,
    setFiltroPrograma,
  ] = useState("");

  const [
    modalAberto,
    setModalAberto,
  ] = useState(false);

  const [
    editandoId,
    setEditandoId,
  ] = useState<
    number | null
  >(null);

  const [
    formulario,
    setFormulario,
  ] =
    useState<Formulario>(
      FORMULARIO_INICIAL
    );

  const [
    buscaCurso,
    setBuscaCurso,
  ] = useState("");

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    toast,
    setToast,
  ] = useState<
    Toast | null
  >(null);

  const campo =
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-500 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-900";

  const mostrarToast =
    useCallback(
      (
        tipo:
          | "sucesso"
          | "erro",
        mensagem: string
      ) => {
        setToast({
          tipo,
          mensagem,
        });

        window.setTimeout(
          () =>
            setToast(null),
          4200
        );
      },
      []
    );

  function traduzirErro(
    codigo?: string
  ) {
    const mapa: Record<
      string,
      string
    > = {
      NAO_AUTENTICADO:
        "errors.unauthorized",

      SEM_PERMISSAO:
        "errors.forbidden",

      SEM_PERMISSAO_GERENCIAR:
        "errors.forbiddenManage",

      TITULO_OBRIGATORIO:
        "errors.titleRequired",

      PROGRAMA_INVALIDO:
        "errors.invalidProgram",

      STATUS_INVALIDO:
        "errors.invalidStatus",

      ANO_INVALIDO:
        "errors.invalidYear",

      VAGAS_INVALIDAS:
        "errors.invalidSeats",

      DATA_INVALIDA:
        "errors.invalidDate",

      PERIODO_INSCRICAO_INVALIDO:
        "errors.invalidApplicationsPeriod",

      PERIODO_MOBILIDADE_INVALIDO:
        "errors.invalidMobilityPeriod",

      CRONOLOGIA_INVALIDA:
        "errors.invalidChronology",

      CURSO_INVALIDO:
        "errors.invalidCourse",

      CRITERIOS_INVALIDOS:
        "errors.invalidCriteria",

      CODIGO_DUPLICADO:
        "errors.duplicateCode",

      OFERTA_NAO_ENCONTRADA:
        "errors.notFound",

      ID_INVALIDO:
        "errors.invalidId",
    };

    return codigo &&
      mapa[codigo]
      ? t(mapa[codigo])
      : t(
          "errors.generic"
        );
  }

  const carregar =
    useCallback(
      async () => {
        setCarregando(
          true
        );

        try {
          const params =
            new URLSearchParams();

          if (busca.trim()) {
            params.set(
              "q",
              busca.trim()
            );
          }

          if (filtroStatus) {
            params.set(
              "status",
              filtroStatus
            );
          }

          if (filtroPrograma) {
            params.set(
              "programaId",
              filtroPrograma
            );
          }

          const resposta =
            await fetch(
              `/api/admin/mobilidade/ofertas?${params.toString()}`,
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              }
            );

          const corpo =
            (await resposta.json()) as
              | RespostaLista
              | RespostaErro;

          if (
            !resposta.ok ||
            !(
              "ofertas" in
              corpo
            )
          ) {
            throw new Error(
              traduzirErro(
                "codigo" in corpo
                  ? corpo.codigo
                  : undefined
              )
            );
          }

          setOfertas(
            corpo.ofertas
          );

          setProgramas(
            corpo.programas
          );

          setCursos(
            corpo.cursos
          );

          setResumo(
            corpo.resumo
          );

          setPodeGerenciar(
            corpo.permissoes
              .podeGerenciar
          );
        } catch (
          erro: unknown
        ) {
          mostrarToast(
            "erro",
            erro instanceof
              Error
              ? erro.message
              : t(
                  "errors.load"
                )
          );
        } finally {
          setCarregando(
            false
          );
        }
      },
      [
        busca,
        filtroStatus,
        filtroPrograma,
        mostrarToast,
        t,
      ]
    );

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void carregar();
        },
        250
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [carregar]);

  function atualizar<
    K extends keyof Formulario
  >(
    chave: K,
    valor: Formulario[K]
  ) {
    setFormulario(
      (atual) => ({
        ...atual,
        [chave]: valor,
      })
    );
  }

  function abrirNovo() {
    const programa =
      programas.find(
        (item) =>
          item.ativo &&
          item.status ===
            "ATIVO"
      );

    setEditandoId(
      null
    );

    setBuscaCurso("");

    setFormulario({
      ...FORMULARIO_INICIAL,

      programaId:
        programa?.id.toString() ??
        "",

      ano:
        String(
          new Date().getFullYear()
        ),
    });

    setModalAberto(
      true
    );
  }

  function abrirEdicao(
    oferta: Oferta
  ) {
    const criterios =
      normalizarCriterios(
        oferta.criteriosElegibilidade
      );

    setEditandoId(
      oferta.id
    );

    setBuscaCurso("");

    setFormulario({
      programaId:
        oferta.programaId.toString(),

      titulo:
        oferta.titulo,

      codigo:
        oferta.codigo ??
        "",

      descricao:
        oferta.descricao ??
        "",

      status:
        oferta.status,

      ano:
        oferta.ano === null
          ? ""
          : String(
              oferta.ano
            ),

      periodo:
        oferta.periodo ??
        "",

      inscricoesInicio:
        dataInput(
          oferta.inscricoesInicio
        ),

      inscricoesFim:
        dataInput(
          oferta.inscricoesFim
        ),

      mobilidadeInicio:
        dataInput(
          oferta.mobilidadeInicio
        ),

      mobilidadeFim:
        dataInput(
          oferta.mobilidadeFim
        ),

      vagas:
        oferta.vagas === null
          ? ""
          : String(
              oferta.vagas
            ),

      permiteListaEspera:
        oferta.permiteListaEspera,

      cursoIds:
        oferta.cursos.map(
          (vinculo) =>
            vinculo.cursoId
        ),

      mediaMinima:
        numeroFormulario(
          criterios.mediaMinima
        ),

      frequenciaMinima:
        numeroFormulario(
          criterios.frequenciaMinima
        ),

      semestreMinimo:
        numeroFormulario(
          criterios.semestreMinimo
        ),

      semestreMaximo:
        numeroFormulario(
          criterios.semestreMaximo
        ),

      idadeMinima:
        numeroFormulario(
          criterios.idadeMinima
        ),

      idadeMaxima:
        numeroFormulario(
          criterios.idadeMaxima
        ),

      exigeRegularidadeAcademica:
        criterios.exigeRegularidadeAcademica,

      exigeRegularidadeFinanceira:
        criterios.exigeRegularidadeFinanceira,

      criteriosObservacoes:
        criterios.observacoes ??
        "",

      instrucoes:
        oferta.instrucoes ??
        "",
    });

    setModalAberto(
      true
    );
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(
      false
    );

    setEditandoId(
      null
    );
  }

  function alternarCurso(
    cursoId: number
  ) {
    setFormulario(
      (atual) => ({
        ...atual,

        cursoIds:
          atual.cursoIds.includes(
            cursoId
          )
            ? atual.cursoIds.filter(
                (id) =>
                  id !== cursoId
              )
            : [
                ...atual.cursoIds,
                cursoId,
              ],
      })
    );
  }

  const cursosFiltrados =
    useMemo(() => {
      const termo =
        buscaCurso
          .trim()
          .toLocaleLowerCase(
            locale
          );

      if (!termo) {
        return cursos;
      }

      return cursos.filter(
        (curso) =>
          [
            curso.nome,
            curso.codigo ?? "",
          ]
            .join(" ")
            .toLocaleLowerCase(
              locale
            )
            .includes(termo)
      );
    }, [
      buscaCurso,
      cursos,
      locale,
    ]);

  function formatarData(
    valor: string | null
  ) {
    if (!valor) {
      return "—";
    }

    const data =
      new Date(valor);

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
    ).format(data);
  }

  function statusTexto(
    status: StatusOferta
  ) {
    switch (status) {
      case "RASCUNHO":
        return t(
          "statuses.draft"
        );

      case "INSCRICOES_AGENDADAS":
        return t(
          "statuses.scheduled"
        );

      case "INSCRICOES_ABERTAS":
        return t(
          "statuses.open"
        );

      case "INSCRICOES_ENCERRADAS":
        return t(
          "statuses.closed"
        );

      case "EM_SELECAO":
        return t(
          "statuses.selection"
        );

      case "FINALIZADA":
        return t(
          "statuses.finished"
        );

      case "CANCELADA":
        return t(
          "statuses.cancelled"
        );
    }
  }

  function statusClasse(
    status: StatusOferta
  ) {
    if (
      status ===
      "INSCRICOES_ABERTAS"
    ) {
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
    }

    if (
      status ===
      "INSCRICOES_AGENDADAS"
    ) {
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200";
    }

    if (
      status ===
      "EM_SELECAO"
    ) {
      return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200";
    }

    if (
      status ===
      "CANCELADA"
    ) {
      return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200";
    }

    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }

  async function salvar(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !formulario.titulo.trim()
    ) {
      mostrarToast(
        "erro",
        t(
          "errors.titleRequired"
        )
      );
      return;
    }

    if (
      !formulario.programaId
    ) {
      mostrarToast(
        "erro",
        t(
          "errors.invalidProgram"
        )
      );
      return;
    }

    setSalvando(
      true
    );

    try {
      const url =
        editandoId
          ? `/api/admin/mobilidade/ofertas/${editandoId}`
          : "/api/admin/mobilidade/ofertas";

      const resposta =
        await fetch(
          url,
          {
            method:
              editandoId
                ? "PATCH"
                : "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                programaId:
                  Number(
                    formulario.programaId
                  ),

                titulo:
                  formulario.titulo,

                codigo:
                  formulario.codigo,

                descricao:
                  formulario.descricao,

                status:
                  formulario.status,

                ano:
                  formulario.ano,

                periodo:
                  formulario.periodo,

                inscricoesInicio:
                  formulario.inscricoesInicio,

                inscricoesFim:
                  formulario.inscricoesFim,

                mobilidadeInicio:
                  formulario.mobilidadeInicio,

                mobilidadeFim:
                  formulario.mobilidadeFim,

                vagas:
                  formulario.vagas,

                permiteListaEspera:
                  formulario.permiteListaEspera,

                cursoIds:
                  formulario.cursoIds,

                criteriosElegibilidade: {
                  mediaMinima:
                    formulario.mediaMinima,

                  frequenciaMinima:
                    formulario.frequenciaMinima,

                  semestreMinimo:
                    formulario.semestreMinimo,

                  semestreMaximo:
                    formulario.semestreMaximo,

                  idadeMinima:
                    formulario.idadeMinima,

                  idadeMaxima:
                    formulario.idadeMaxima,

                  exigeRegularidadeAcademica:
                    formulario.exigeRegularidadeAcademica,

                  exigeRegularidadeFinanceira:
                    formulario.exigeRegularidadeFinanceira,

                  observacoes:
                    formulario.criteriosObservacoes,
                },

                instrucoes:
                  formulario.instrucoes,
              }),
          }
        );

      const corpo =
        (await resposta.json()) as
          | {
              ok: true;
            }
          | RespostaErro;

      if (!resposta.ok) {
        throw new Error(
          traduzirErro(
            "codigo" in corpo
              ? corpo.codigo
              : undefined
          )
        );
      }

      setModalAberto(
        false
      );

      mostrarToast(
        "sucesso",
        editandoId
          ? t(
              "messages.updated"
            )
          : t(
              "messages.created"
            )
      );

      await carregar();
    } catch (
      erro: unknown
    ) {
      mostrarToast(
        "erro",
        erro instanceof
          Error
          ? erro.message
          : t(
              "errors.save"
            )
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  return (
    <main className="min-h-full bg-slate-50/70 p-4 text-slate-950 dark:bg-slate-950 dark:text-slate-100 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm dark:border-blue-950 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/admin/mobilidade"
                className="text-sm font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
              >
                ←{" "}
                {t(
                  "back"
                )}
              </Link>

              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                {t(
                  "title"
                )}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300 sm:text-base">
                {t(
                  "subtitle"
                )}
              </p>
            </div>

            {podeGerenciar && (
              <button
                type="button"
                onClick={
                  abrirNovo
                }
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                +{" "}
                {t(
                  "actions.new"
                )}
              </button>
            )}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              t(
                "summary.total"
              ),
              resumo.total,
              "📣",
            ],
            [
              t(
                "summary.scheduled"
              ),
              resumo.agendadas,
              "🗓️",
            ],
            [
              t(
                "summary.open"
              ),
              resumo.abertas,
              "✅",
            ],
            [
              t(
                "summary.selection"
              ),
              resumo.emSelecao,
              "🏅",
            ],
          ].map(
            ([
              titulo,
              valor,
              icone,
            ]) => (
              <div
                key={String(
                  titulo
                )}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {
                        titulo
                      }
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      {
                        valor
                      }
                    </p>
                  </div>

                  <span className="h-fit rounded-xl bg-slate-100 p-2 text-xl dark:bg-slate-800">
                    {
                      icone
                    }
                  </span>
                </div>
              </div>
            )
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-3 xl:grid-cols-[1fr_230px_300px_auto]">
            <input
              type="search"
              value={
                busca
              }
              onChange={(
                event
              ) =>
                setBusca(
                  event.target
                    .value
                )
              }
              placeholder={t(
                "filters.search"
              )}
              className={
                campo
              }
            />

            <select
              value={
                filtroStatus
              }
              onChange={(
                event
              ) =>
                setFiltroStatus(
                  event.target
                    .value
                )
              }
              className={
                campo
              }
            >
              <option value="">
                {t(
                  "filters.allStatuses"
                )}
              </option>

              <option value="RASCUNHO">
                {t(
                  "statuses.draft"
                )}
              </option>

              <option value="INSCRICOES_AGENDADAS">
                {t(
                  "statuses.scheduled"
                )}
              </option>

              <option value="INSCRICOES_ABERTAS">
                {t(
                  "statuses.open"
                )}
              </option>

              <option value="INSCRICOES_ENCERRADAS">
                {t(
                  "statuses.closed"
                )}
              </option>

              <option value="EM_SELECAO">
                {t(
                  "statuses.selection"
                )}
              </option>

              <option value="FINALIZADA">
                {t(
                  "statuses.finished"
                )}
              </option>

              <option value="CANCELADA">
                {t(
                  "statuses.cancelled"
                )}
              </option>
            </select>

            <select
              value={
                filtroPrograma
              }
              onChange={(
                event
              ) =>
                setFiltroPrograma(
                  event.target
                    .value
                )
              }
              className={
                campo
              }
            >
              <option value="">
                {t(
                  "filters.allPrograms"
                )}
              </option>

              {programas.map(
                (
                  programa
                ) => (
                  <option
                    key={
                      programa.id
                    }
                    value={
                      programa.id
                    }
                  >
                    {
                      programa.nome
                    }
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={() =>
                void carregar()
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
            >
              ↻{" "}
              {t(
                "actions.refresh"
              )}
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {carregando ? (
            <div className="space-y-3 p-5">
              {Array.from({
                length: 5,
              }).map(
                (
                  _,
                  indice
                ) => (
                  <div
                    key={
                      indice
                    }
                    className="h-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
                  />
                )
              )}
            </div>
          ) : ofertas.length ===
            0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">
                📣
              </div>

              <h2 className="mt-4 text-lg font-bold">
                {t(
                  "empty.title"
                )}
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">
                {t(
                  "empty.description"
                )}
              </p>

              {podeGerenciar && (
                <button
                  type="button"
                  onClick={
                    abrirNovo
                  }
                  className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  {t(
                    "actions.new"
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px]">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-4">
                      {t(
                        "table.offer"
                      )}
                    </th>

                    <th className="px-5 py-4">
                      {t(
                        "table.program"
                      )}
                    </th>

                    <th className="px-5 py-4">
                      {t(
                        "table.applications"
                      )}
                    </th>

                    <th className="px-5 py-4">
                      {t(
                        "table.mobility"
                      )}
                    </th>

                    <th className="px-5 py-4">
                      {t(
                        "table.seats"
                      )}
                    </th>

                    <th className="px-5 py-4">
                      {t(
                        "table.courses"
                      )}
                    </th>

                    <th className="px-5 py-4 text-center">
                      {t(
                        "table.candidates"
                      )}
                    </th>

                    <th className="px-5 py-4">
                      {t(
                        "table.status"
                      )}
                    </th>

                    <th className="px-5 py-4 text-right">
                      {t(
                        "table.actions"
                      )}
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {ofertas.map(
                    (
                      oferta
                    ) => (
                      <tr
                        key={
                          oferta.id
                        }
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold">
                            {
                              oferta.titulo
                            }
                          </div>

                          {oferta.codigo && (
                            <div className="mt-1 text-xs text-slate-500">
                              {
                                oferta.codigo
                              }
                            </div>
                          )}

                          {(oferta.ano ||
                            oferta.periodo) && (
                            <div className="mt-1 text-xs text-slate-500">
                              {[
                                oferta.periodo,
                                oferta.ano,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " · "
                                )}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <div className="font-medium">
                            {
                              oferta
                                .programa
                                .nome
                            }
                          </div>

                          {oferta
                            .programa
                            .instituicaoParceira && (
                            <div className="mt-1 text-xs text-slate-500">
                              {bandeira(
                                oferta
                                  .programa
                                  .instituicaoParceira
                                  .paisCodigo
                              )}{" "}
                              {
                                oferta
                                  .programa
                                  .instituicaoParceira
                                  .nome
                              }
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <div>
                            {formatarData(
                              oferta.inscricoesInicio
                            )}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            →{" "}
                            {formatarData(
                              oferta.inscricoesFim
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <div>
                            {formatarData(
                              oferta.mobilidadeInicio
                            )}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            →{" "}
                            {formatarData(
                              oferta.mobilidadeFim
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <div className="font-semibold">
                            {oferta.vagas ??
                              "—"}
                          </div>

                          {oferta.permiteListaEspera && (
                            <div className="mt-1 text-xs text-slate-500">
                              {t(
                                "table.waitingList"
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {oferta.cursos
                            .length ===
                          0
                            ? t(
                                "table.generalCoverage"
                              )
                            : t(
                                "table.courseCount",
                                {
                                  count:
                                    oferta
                                      .cursos
                                      .length,
                                }
                              )}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex min-w-9 justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                            {
                              oferta
                                ._count
                                .candidaturas
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasse(
                              oferta.status
                            )}`}
                          >
                            {statusTexto(
                              oferta.status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          {podeGerenciar && (
                            <button
                              type="button"
                              onClick={() =>
                                abrirEdicao(
                                  oferta
                                )
                              }
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                            >
                              {t(
                                "actions.edit"
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {modalAberto && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              fecharModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
              <div>
                <h2 className="text-xl font-bold">
                  {editandoId
                    ? t(
                        "modal.editTitle"
                      )
                    : t(
                        "modal.newTitle"
                      )}
                </h2>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {t(
                    "modal.description"
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  fecharModal
                }
                disabled={
                  salvando
                }
                className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={
                salvar
              }
              className="max-h-[calc(94vh-100px)] overflow-y-auto"
            >
              <div className="space-y-7 p-5 sm:p-6">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    {t(
                      "sections.identification"
                    )}
                  </h3>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="md:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.program"
                        )}{" "}
                        *
                      </span>

                      <select
                        required
                        value={
                          formulario.programaId
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "programaId",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      >
                        <option value="">
                          {t(
                            "fields.selectProgram"
                          )}
                        </option>

                        {programas.map(
                          (
                            programa
                          ) => (
                            <option
                              key={
                                programa.id
                              }
                              value={
                                programa.id
                              }
                              disabled={
                                (
                                  !programa.ativo ||
                                  programa.status !==
                                    "ATIVO"
                                ) &&
                                Number(
                                  formulario.programaId
                                ) !==
                                  programa.id
                              }
                            >
                              {programa.nome}
                              {" · "}
                              {programa.status}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.title"
                        )}{" "}
                        *
                      </span>

                      <input
                        required
                        value={
                          formulario.titulo
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "titulo",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.code"
                        )}
                      </span>

                      <input
                        value={
                          formulario.codigo
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "codigo",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.year"
                        )}
                      </span>

                      <input
                        type="number"
                        min="2000"
                        max="2100"
                        value={
                          formulario.ano
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "ano",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.period"
                        )}
                      </span>

                      <input
                        value={
                          formulario.periodo
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "periodo",
                            event.target
                              .value
                          )
                        }
                        placeholder={t(
                          "fields.periodPlaceholder"
                        )}
                        className={
                          campo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.status"
                        )}
                      </span>

                      <select
                        value={
                          formulario.status
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "status",
                            event.target
                              .value as StatusOferta
                          )
                        }
                        className={
                          campo
                        }
                      >
                        <option value="RASCUNHO">
                          {t(
                            "statuses.draft"
                          )}
                        </option>

                        <option value="INSCRICOES_AGENDADAS">
                          {t(
                            "statuses.scheduled"
                          )}
                        </option>

                        <option value="INSCRICOES_ABERTAS">
                          {t(
                            "statuses.open"
                          )}
                        </option>

                        <option value="INSCRICOES_ENCERRADAS">
                          {t(
                            "statuses.closed"
                          )}
                        </option>

                        <option value="EM_SELECAO">
                          {t(
                            "statuses.selection"
                          )}
                        </option>

                        <option value="FINALIZADA">
                          {t(
                            "statuses.finished"
                          )}
                        </option>

                        <option value="CANCELADA">
                          {t(
                            "statuses.cancelled"
                          )}
                        </option>
                      </select>

                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {t(
                          "fields.statusHelp"
                        )}
                      </p>
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.seats"
                        )}
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={
                          formulario.vagas
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "vagas",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>

                    <label className="md:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.description"
                        )}
                      </span>

                      <textarea
                        rows={4}
                        value={
                          formulario.descricao
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "descricao",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>
                  </div>
                </section>

                <section className="border-t border-slate-200 pt-6 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    {t(
                      "sections.dates"
                    )}
                  </h3>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.applicationsStart"
                        )}
                      </span>

                      <input
                        type="date"
                        value={
                          formulario.inscricoesInicio
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "inscricoesInicio",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.applicationsEnd"
                        )}
                      </span>

                      <input
                        type="date"
                        value={
                          formulario.inscricoesFim
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "inscricoesFim",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.mobilityStart"
                        )}
                      </span>

                      <input
                        type="date"
                        value={
                          formulario.mobilidadeInicio
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "mobilidadeInicio",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.mobilityEnd"
                        )}
                      </span>

                      <input
                        type="date"
                        value={
                          formulario.mobilidadeFim
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "mobilidadeFim",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>
                  </div>

                  <label className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                    <input
                      type="checkbox"
                      checked={
                        formulario.permiteListaEspera
                      }
                      onChange={(
                        event
                      ) =>
                        atualizar(
                          "permiteListaEspera",
                          event.target
                            .checked
                        )
                      }
                    />

                    <div>
                      <div className="text-sm font-semibold">
                        {t(
                          "fields.waitingList"
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {t(
                          "fields.waitingListDescription"
                        )}
                      </div>
                    </div>
                  </label>
                </section>

                <section className="border-t border-slate-200 pt-6 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    {t(
                      "sections.courses"
                    )}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {t(
                      "sections.coursesDescription"
                    )}
                  </p>

                  <input
                    type="search"
                    value={
                      buscaCurso
                    }
                    onChange={(
                      event
                    ) =>
                      setBuscaCurso(
                        event.target
                          .value
                      )
                    }
                    placeholder={t(
                      "fields.searchCourses"
                    )}
                    className={`${campo} mt-4`}
                  />

                  <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    {cursosFiltrados.length ===
                    0 ? (
                      <div className="p-5 text-center text-sm text-slate-500">
                        {t(
                          "fields.noCourses"
                        )}
                      </div>
                    ) : (
                      cursosFiltrados.map(
                        (
                          curso
                        ) => (
                          <label
                            key={
                              curso.id
                            }
                            className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                          >
                            <input
                              type="checkbox"
                              checked={formulario.cursoIds.includes(
                                curso.id
                              )}
                              onChange={() =>
                                alternarCurso(
                                  curso.id
                                )
                              }
                            />

                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold">
                                {
                                  curso.nome
                                }
                              </div>

                              <div className="text-xs text-slate-500">
                                {curso.codigo ??
                                  "—"}
                              </div>
                            </div>
                          </label>
                        )
                      )
                    )}
                  </div>

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {formulario
                      .cursoIds
                      .length ===
                    0
                      ? t(
                          "fields.generalCoverage"
                        )
                      : t(
                          "fields.selectedCourses",
                          {
                            count:
                              formulario
                                .cursoIds
                                .length,
                          }
                        )}
                  </p>
                </section>

                <section className="border-t border-slate-200 pt-6 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    {t(
                      "sections.eligibility"
                    )}
                  </h3>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.average"
                        )}
                      </span>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={
                          formulario.mediaMinima
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "mediaMinima",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.attendance"
                        )}
                      </span>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={
                          formulario.frequenciaMinima
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "frequenciaMinima",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.minSemester"
                        )}
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={
                          formulario.semestreMinimo
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "semestreMinimo",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.maxSemester"
                        )}
                      </span>

                      <input
                        type="number"
                        min="1"
                        value={
                          formulario.semestreMaximo
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "semestreMaximo",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.minAge"
                        )}
                      </span>

                      <input
                        type="number"
                        min="0"
                        value={
                          formulario.idadeMinima
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "idadeMinima",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.maxAge"
                        )}
                      </span>

                      <input
                        type="number"
                        min="0"
                        value={
                          formulario.idadeMaxima
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "idadeMaxima",
                            event.target
                              .value
                          )
                        }
                        className={
                          campo
                        }
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                      <input
                        type="checkbox"
                        checked={
                          formulario.exigeRegularidadeAcademica
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "exigeRegularidadeAcademica",
                            event.target
                              .checked
                          )
                        }
                      />

                      <div>
                        <div className="text-sm font-semibold">
                          {t(
                            "fields.academicRegularity"
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "fields.academicRegularityDescription"
                          )}
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                      <input
                        type="checkbox"
                        checked={
                          formulario.exigeRegularidadeFinanceira
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "exigeRegularidadeFinanceira",
                            event.target
                              .checked
                          )
                        }
                      />

                      <div>
                        <div className="text-sm font-semibold">
                          {t(
                            "fields.financialRegularity"
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "fields.financialRegularityDescription"
                          )}
                        </div>
                      </div>
                    </label>
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-1.5 block text-sm font-semibold">
                      {t(
                        "fields.eligibilityNotes"
                      )}
                    </span>

                    <textarea
                      rows={4}
                      value={
                        formulario.criteriosObservacoes
                      }
                      onChange={(
                        event
                      ) =>
                        atualizar(
                          "criteriosObservacoes",
                          event.target
                            .value
                        )
                      }
                      className={
                        campo
                      }
                    />
                  </label>
                </section>

                <section className="border-t border-slate-200 pt-6 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    {t(
                      "sections.instructions"
                    )}
                  </h3>

                  <textarea
                    rows={6}
                    value={
                      formulario.instrucoes
                    }
                    onChange={(
                      event
                    ) =>
                      atualizar(
                        "instrucoes",
                        event.target
                          .value
                      )
                    }
                    className={`${campo} mt-4`}
                    placeholder={t(
                      "fields.instructionsPlaceholder"
                    )}
                  />
                </section>
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={
                    fecharModal
                  }
                  disabled={
                    salvando
                  }
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold dark:border-slate-700"
                >
                  {t(
                    "actions.cancel"
                  )}
                </button>

                <button
                  type="submit"
                  disabled={
                    salvando
                  }
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {salvando
                    ? t(
                        "actions.saving"
                      )
                    : t(
                        "actions.save"
                      )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed right-4 top-20 z-[200] max-w-sm">
          <div
            role="status"
            className={[
              "rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl",
              toast.tipo ===
              "sucesso"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100",
            ].join(
              " "
            )}
          >
            {
              toast.mensagem
            }
          </div>
        </div>
      )}
    </main>
  );
}
