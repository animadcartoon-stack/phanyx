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
  useTranslations,
} from "next-intl";

type TipoPrograma =
  | "SEMESTRE_ACADEMICO"
  | "ANO_ACADEMICO"
  | "CURTA_DURACAO"
  | "PROGRAMA_IDIOMAS"
  | "ESTAGIO"
  | "PESQUISA"
  | "SUMMER_SCHOOL"
  | "WINTER_SCHOOL"
  | "DUPLA_TITULACAO"
  | "HIBRIDA"
  | "VIRTUAL"
  | "OUTRO";

type Direcao =
  | "SAIDA"
  | "ENTRADA"
  | "BIDIRECIONAL";

type Status =
  | "RASCUNHO"
  | "ATIVO"
  | "INATIVO"
  | "ARQUIVADO";

type Parceiro = {
  id: number;
  nome: string;
  sigla: string | null;
  paisCodigo: string;
  cidade: string | null;
  ativo: boolean;
};

type Convenio = {
  id: number;
  nome: string;
  codigo: string | null;
  status:
    | "RASCUNHO"
    | "ATIVO"
    | "SUSPENSO"
    | "ENCERRADO"
    | "EXPIRADO";

  instituicaoParceira: {
    id: number;
    nome: string;
    paisCodigo: string;
    ativo: boolean;
  };
};

type Programa = {
  id: number;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  tipo: TipoPrograma;
  direcao: Direcao;
  status: Status;
  idiomaPrincipal: string | null;
  nivelIdiomaMinimo: string | null;
  duracaoMinimaDias: number | null;
  duracaoMaximaDias: number | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;

  convenio: {
    id: number;
    nome: string;
    codigo: string | null;
    status: string;
  } | null;

  instituicaoParceira: Parceiro | null;

  _count: {
    ofertas: number;
  };
};

type RespostaLista = {
  ok: true;

  permissoes: {
    podeGerenciar: boolean;
  };

  resumo: {
    total: number;
    ativos: number;
    rascunhos: number;
    inativos: number;
  };

  programas: Programa[];
  convenios: Convenio[];
  parceiros: Parceiro[];
};

type RespostaErro = {
  ok?: false;
  codigo?: string;
};

type Formulario = {
  convenioId: string;
  instituicaoParceiraId: string;
  nome: string;
  codigo: string;
  descricao: string;
  tipo: TipoPrograma;
  direcao: Direcao;
  status: Status;
  idiomaPrincipal: string;
  nivelIdiomaMinimo: string;
  duracaoMinimaDias: string;
  duracaoMaximaDias: string;
};

type Toast = {
  tipo: "sucesso" | "erro";
  mensagem: string;
};

const TIPOS: TipoPrograma[] = [
  "SEMESTRE_ACADEMICO",
  "ANO_ACADEMICO",
  "CURTA_DURACAO",
  "PROGRAMA_IDIOMAS",
  "ESTAGIO",
  "PESQUISA",
  "SUMMER_SCHOOL",
  "WINTER_SCHOOL",
  "DUPLA_TITULACAO",
  "HIBRIDA",
  "VIRTUAL",
  "OUTRO",
];

const FORMULARIO_INICIAL: Formulario = {
  convenioId: "",
  instituicaoParceiraId: "",
  nome: "",
  codigo: "",
  descricao: "",
  tipo: "SEMESTRE_ACADEMICO",
  direcao: "SAIDA",
  status: "RASCUNHO",
  idiomaPrincipal: "",
  nivelIdiomaMinimo: "",
  duracaoMinimaDias: "",
  duracaoMaximaDias: "",
};

function bandeira(
  codigo: string
) {
  if (
    !/^[A-Z]{2}$/.test(
      codigo
    )
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

export default function ProgramasMobilidadePage() {
  const t =
    useTranslations(
      "AdminMobilityPrograms"
    );

  const [
    programas,
    setProgramas,
  ] =
    useState<Programa[]>(
      []
    );

  const [
    convenios,
    setConvenios,
  ] =
    useState<Convenio[]>(
      []
    );

  const [
    parceiros,
    setParceiros,
  ] =
    useState<Parceiro[]>(
      []
    );

  const [
    resumo,
    setResumo,
  ] = useState({
    total: 0,
    ativos: 0,
    rascunhos: 0,
    inativos: 0,
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
    filtroTipo,
    setFiltroTipo,
  ] = useState("");

  const [
    filtroStatus,
    setFiltroStatus,
  ] = useState("");

  const [
    filtroDirecao,
    setFiltroDirecao,
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
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    alterandoAtivoId,
    setAlterandoAtivoId,
  ] = useState<
    number | null
  >(null);

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
      NOME_OBRIGATORIO:
        "errors.nameRequired",
      TIPO_INVALIDO:
        "errors.invalidType",
      DIRECAO_INVALIDA:
        "errors.invalidDirection",
      STATUS_INVALIDO:
        "errors.invalidStatus",
      CONVENIO_INVALIDO:
        "errors.invalidAgreement",
      PARCEIRO_INVALIDO:
        "errors.invalidPartner",
      VINCULO_INVALIDO:
        "errors.invalidLink",
      DURACAO_INVALIDA:
        "errors.invalidDuration",
      DURACAO_INTERVALO_INVALIDO:
        "errors.invalidDurationRange",
      CODIGO_DUPLICADO:
        "errors.duplicateCode",
      PROGRAMA_NAO_ENCONTRADO:
        "errors.notFound",
      ID_INVALIDO:
        "errors.invalidId",
      ATIVO_INVALIDO:
        "errors.invalidActive",
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

          if (filtroTipo) {
            params.set(
              "tipo",
              filtroTipo
            );
          }

          if (filtroStatus) {
            params.set(
              "status",
              filtroStatus
            );
          }

          if (filtroDirecao) {
            params.set(
              "direcao",
              filtroDirecao
            );
          }

          const resposta =
            await fetch(
              `/api/admin/mobilidade/programas?${params.toString()}`,
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
              "programas" in
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

          setProgramas(
            corpo.programas
          );

          setConvenios(
            corpo.convenios
          );

          setParceiros(
            corpo.parceiros
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
        filtroTipo,
        filtroStatus,
        filtroDirecao,
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
    setEditandoId(
      null
    );

    setFormulario({
      ...FORMULARIO_INICIAL,

      convenioId:
        convenios.find(
          (item) =>
            item.status ===
            "ATIVO"
        )?.id.toString() ??
        "",

      instituicaoParceiraId:
        convenios.find(
          (item) =>
            item.status ===
            "ATIVO"
        )?.instituicaoParceira
          .id.toString() ??
        parceiros.find(
          (item) =>
            item.ativo
        )?.id.toString() ??
        "",
    });

    setModalAberto(
      true
    );
  }

  function abrirEdicao(
    programa: Programa
  ) {
    setEditandoId(
      programa.id
    );

    setFormulario({
      convenioId:
        programa.convenio?.id
          .toString() ??
        "",

      instituicaoParceiraId:
        programa
          .instituicaoParceira
          ?.id.toString() ??
        "",

      nome:
        programa.nome,

      codigo:
        programa.codigo ??
        "",

      descricao:
        programa.descricao ??
        "",

      tipo:
        programa.tipo,

      direcao:
        programa.direcao,

      status:
        programa.status,

      idiomaPrincipal:
        programa.idiomaPrincipal ??
        "",

      nivelIdiomaMinimo:
        programa.nivelIdiomaMinimo ??
        "",

      duracaoMinimaDias:
        programa.duracaoMinimaDias ===
        null
          ? ""
          : String(
              programa.duracaoMinimaDias
            ),

      duracaoMaximaDias:
        programa.duracaoMaximaDias ===
        null
          ? ""
          : String(
              programa.duracaoMaximaDias
            ),
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

  function selecionarConvenio(
    valor: string
  ) {
    if (!valor) {
      atualizar(
        "convenioId",
        ""
      );
      return;
    }

    const convenio =
      convenios.find(
        (item) =>
          item.id ===
          Number(valor)
      );

    setFormulario(
      (atual) => ({
        ...atual,

        convenioId:
          valor,

        instituicaoParceiraId:
          convenio
            ?.instituicaoParceira
            .id.toString() ??
          atual
            .instituicaoParceiraId,
      })
    );
  }

  const convenioSelecionado =
    useMemo(
      () =>
        formulario.convenioId
          ? convenios.find(
              (item) =>
                item.id ===
                Number(
                  formulario.convenioId
                )
            ) ??
            null
          : null,
      [
        convenios,
        formulario.convenioId,
      ]
    );

  async function salvar(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      !formulario.nome.trim()
    ) {
      mostrarToast(
        "erro",
        t(
          "errors.nameRequired"
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
          ? `/api/admin/mobilidade/programas/${editandoId}`
          : "/api/admin/mobilidade/programas";

      const ativo =
        formulario.status !==
          "INATIVO" &&
        formulario.status !==
          "ARQUIVADO";

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
                convenioId:
                  formulario.convenioId
                    ? Number(
                        formulario.convenioId
                      )
                    : null,

                instituicaoParceiraId:
                  formulario.instituicaoParceiraId
                    ? Number(
                        formulario.instituicaoParceiraId
                      )
                    : null,

                nome:
                  formulario.nome,

                codigo:
                  formulario.codigo,

                descricao:
                  formulario.descricao,

                tipo:
                  formulario.tipo,

                direcao:
                  formulario.direcao,

                status:
                  formulario.status,

                idiomaPrincipal:
                  formulario.idiomaPrincipal,

                nivelIdiomaMinimo:
                  formulario.nivelIdiomaMinimo,

                duracaoMinimaDias:
                  formulario.duracaoMinimaDias,

                duracaoMaximaDias:
                  formulario.duracaoMaximaDias,

                ativo,
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

  async function alterarAtivo(
    programa: Programa
  ) {
    setAlterandoAtivoId(
      programa.id
    );

    try {
      const resposta =
        await fetch(
          `/api/admin/mobilidade/programas/${programa.id}`,
          {
            method: "PATCH",
            credentials:
              "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                acao:
                  "ALTERAR_ATIVO",
                ativo:
                  !programa.ativo,
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

      mostrarToast(
        "sucesso",
        programa.ativo
          ? t(
              "messages.deactivated"
            )
          : t(
              "messages.activated"
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
              "errors.statusChange"
            )
      );
    } finally {
      setAlterandoAtivoId(
        null
      );
    }
  }

  function tipoTexto(
    tipo: TipoPrograma
  ) {
    const mapa: Record<
      TipoPrograma,
      string
    > = {
      SEMESTRE_ACADEMICO:
        "types.academicSemester",
      ANO_ACADEMICO:
        "types.academicYear",
      CURTA_DURACAO:
        "types.shortTerm",
      PROGRAMA_IDIOMAS:
        "types.language",
      ESTAGIO:
        "types.internship",
      PESQUISA:
        "types.research",
      SUMMER_SCHOOL:
        "types.summerSchool",
      WINTER_SCHOOL:
        "types.winterSchool",
      DUPLA_TITULACAO:
        "types.doubleDegree",
      HIBRIDA:
        "types.hybrid",
      VIRTUAL:
        "types.virtual",
      OUTRO:
        "types.other",
    };

    return t(
      mapa[tipo]
    );
  }

  function direcaoTexto(
    direcao: Direcao
  ) {
    return direcao ===
      "SAIDA"
      ? t(
          "directions.outgoing"
        )
      : direcao ===
          "ENTRADA"
        ? t(
            "directions.incoming"
          )
        : t(
            "directions.bilateral"
          );
  }

  function statusTexto(
    status: Status
  ) {
    const mapa: Record<
      Status,
      string
    > = {
      RASCUNHO:
        "statuses.draft",
      ATIVO:
        "statuses.active",
      INATIVO:
        "statuses.inactive",
      ARQUIVADO:
        "statuses.archived",
    };

    return t(
      mapa[status]
    );
  }

  function statusClasse(
    status: Status
  ) {
    if (
      status === "ATIVO"
    ) {
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
    }

    if (
      status ===
      "RASCUNHO"
    ) {
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200";
    }

    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }

  function duracaoTexto(
    programa: Programa
  ) {
    if (
      programa.duracaoMinimaDias ===
        null &&
      programa.duracaoMaximaDias ===
        null
    ) {
      return "—";
    }

    if (
      programa.duracaoMinimaDias !==
        null &&
      programa.duracaoMaximaDias !==
        null
    ) {
      if (
        programa.duracaoMinimaDias ===
        programa.duracaoMaximaDias
      ) {
        return t(
          "duration.days",
          {
            count:
              programa.duracaoMinimaDias,
          }
        );
      }

      return t(
        "duration.range",
        {
          min:
            programa.duracaoMinimaDias,
          max:
            programa.duracaoMaximaDias,
        }
      );
    }

    if (
      programa.duracaoMinimaDias !==
      null
    ) {
      return t(
        "duration.minimum",
        {
          count:
            programa.duracaoMinimaDias,
        }
      );
    }

    return t(
      "duration.maximum",
      {
        count:
          programa.duracaoMaximaDias ??
          0,
      }
    );
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
              "🎓",
            ],
            [
              t(
                "summary.active"
              ),
              resumo.ativos,
              "✅",
            ],
            [
              t(
                "summary.drafts"
              ),
              resumo.rascunhos,
              "📝",
            ],
            [
              t(
                "summary.inactive"
              ),
              resumo.inativos,
              "⏸️",
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
          <div className="grid gap-3 xl:grid-cols-[1fr_230px_190px_190px_auto]">
            <input
              type="search"
              value={busca}
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
                filtroTipo
              }
              onChange={(
                event
              ) =>
                setFiltroTipo(
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
                  "filters.allTypes"
                )}
              </option>

              {TIPOS.map(
                (tipo) => (
                  <option
                    key={
                      tipo
                    }
                    value={
                      tipo
                    }
                  >
                    {tipoTexto(
                      tipo
                    )}
                  </option>
                )
              )}
            </select>

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

              <option value="ATIVO">
                {t(
                  "statuses.active"
                )}
              </option>

              <option value="INATIVO">
                {t(
                  "statuses.inactive"
                )}
              </option>

              <option value="ARQUIVADO">
                {t(
                  "statuses.archived"
                )}
              </option>
            </select>

            <select
              value={
                filtroDirecao
              }
              onChange={(
                event
              ) =>
                setFiltroDirecao(
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
                  "filters.allDirections"
                )}
              </option>

              <option value="SAIDA">
                {t(
                  "directions.outgoing"
                )}
              </option>

              <option value="ENTRADA">
                {t(
                  "directions.incoming"
                )}
              </option>

              <option value="BIDIRECIONAL">
                {t(
                  "directions.bilateral"
                )}
              </option>
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
          ) : programas.length ===
            0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">
                🎓
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
              <table className="w-full min-w-[1150px]">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-4">
                      {t(
                        "table.program"
                      )}
                    </th>

                    <th className="px-5 py-4">
                      {t(
                        "table.type"
                      )}
                    </th>

                    <th className="px-5 py-4">
                      {t(
                        "table.partner"
                      )}
                    </th>

                    <th className="px-5 py-4">
                      {t(
                        "table.direction"
                      )}
                    </th>

                    <th className="px-5 py-4">
                      {t(
                        "table.language"
                      )}
                    </th>

                    <th className="px-5 py-4">
                      {t(
                        "table.duration"
                      )}
                    </th>

                    <th className="px-5 py-4 text-center">
                      {t(
                        "table.offers"
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
                  {programas.map(
                    (
                      programa
                    ) => (
                      <tr
                        key={
                          programa.id
                        }
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold">
                            {
                              programa.nome
                            }
                          </div>

                          {programa.codigo && (
                            <div className="mt-1 text-xs text-slate-500">
                              {
                                programa.codigo
                              }
                            </div>
                          )}

                          {programa.convenio && (
                            <div className="mt-1 max-w-[260px] truncate text-xs text-blue-700 dark:text-blue-300">
                              🤝{" "}
                              {
                                programa
                                  .convenio
                                  .nome
                              }
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {tipoTexto(
                            programa.tipo
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {programa.instituicaoParceira ? (
                            <>
                              <div>
                                {bandeira(
                                  programa
                                    .instituicaoParceira
                                    .paisCodigo
                                )}{" "}
                                {
                                  programa
                                    .instituicaoParceira
                                    .nome
                                }
                              </div>

                              {programa
                                .instituicaoParceira
                                .cidade && (
                                <div className="mt-1 text-xs text-slate-500">
                                  {
                                    programa
                                      .instituicaoParceira
                                      .cidade
                                  }
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-500">
                              {t(
                                "table.noPartner"
                              )}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {direcaoTexto(
                            programa.direcao
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <div>
                            {programa.idiomaPrincipal ??
                              "—"}
                          </div>

                          {programa.nivelIdiomaMinimo && (
                            <div className="mt-1 text-xs text-slate-500">
                              {t(
                                "table.minimumLevel"
                              )}{" "}
                              {
                                programa.nivelIdiomaMinimo
                              }
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {duracaoTexto(
                            programa
                          )}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex min-w-9 justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                            {
                              programa
                                ._count
                                .ofertas
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasse(
                              programa.status
                            )}`}
                          >
                            {statusTexto(
                              programa.status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {podeGerenciar && (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  abrirEdicao(
                                    programa
                                  )
                                }
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                              >
                                {t(
                                  "actions.edit"
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  alterandoAtivoId ===
                                  programa.id
                                }
                                onClick={() =>
                                  void alterarAtivo(
                                    programa
                                  )
                                }
                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {programa.ativo
                                  ? t(
                                      "actions.deactivate"
                                    )
                                  : t(
                                      "actions.activate"
                                    )}
                              </button>
                            </div>
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
            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
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
              className="max-h-[calc(92vh-100px)] overflow-y-auto"
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
                          "fields.agreement"
                        )}
                      </span>

                      <select
                        value={
                          formulario.convenioId
                        }
                        onChange={(
                          event
                        ) =>
                          selecionarConvenio(
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
                            "fields.noAgreement"
                          )}
                        </option>

                        {convenios.map(
                          (
                            convenio
                          ) => (
                            <option
                              key={
                                convenio.id
                              }
                              value={
                                convenio.id
                              }
                              disabled={
                                (
                                  convenio.status ===
                                    "ENCERRADO" ||
                                  convenio.status ===
                                    "EXPIRADO"
                                ) &&
                                Number(
                                  formulario.convenioId
                                ) !==
                                  convenio.id
                              }
                            >
                              {convenio.nome}
                              {" · "}
                              {convenio
                                .instituicaoParceira
                                .paisCodigo}
                              {" · "}
                              {convenio.status}
                            </option>
                          )
                        )}
                      </select>

                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {t(
                          "fields.agreementHelp"
                        )}
                      </p>
                    </label>

                    <label className="md:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.partner"
                        )}
                      </span>

                      <select
                        value={
                          formulario.instituicaoParceiraId
                        }
                        disabled={
                          Boolean(
                            convenioSelecionado
                          )
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "instituicaoParceiraId",
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
                            "fields.noPartner"
                          )}
                        </option>

                        {parceiros.map(
                          (
                            parceiro
                          ) => (
                            <option
                              key={
                                parceiro.id
                              }
                              value={
                                parceiro.id
                              }
                              disabled={
                                !parceiro.ativo &&
                                Number(
                                  formulario.instituicaoParceiraId
                                ) !==
                                  parceiro.id
                              }
                            >
                              {parceiro.nome}
                              {" · "}
                              {parceiro.paisCodigo}
                              {!parceiro.ativo
                                ? ` · ${t(
                                    "fields.inactive"
                                  )}`
                                : ""}
                            </option>
                          )
                        )}
                      </select>

                      {convenioSelecionado && (
                        <p className="mt-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                          {t(
                            "fields.partnerFromAgreement"
                          )}
                        </p>
                      )}
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.name"
                        )}{" "}
                        *
                      </span>

                      <input
                        required
                        value={
                          formulario.nome
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "nome",
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
                          "fields.type"
                        )}
                      </span>

                      <select
                        value={
                          formulario.tipo
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "tipo",
                            event.target
                              .value as TipoPrograma
                          )
                        }
                        className={
                          campo
                        }
                      >
                        {TIPOS.map(
                          (
                            tipo
                          ) => (
                            <option
                              key={
                                tipo
                              }
                              value={
                                tipo
                              }
                            >
                              {tipoTexto(
                                tipo
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.direction"
                        )}
                      </span>

                      <select
                        value={
                          formulario.direcao
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "direcao",
                            event.target
                              .value as Direcao
                          )
                        }
                        className={
                          campo
                        }
                      >
                        <option value="SAIDA">
                          {t(
                            "directions.outgoing"
                          )}
                        </option>

                        <option value="ENTRADA">
                          {t(
                            "directions.incoming"
                          )}
                        </option>

                        <option value="BIDIRECIONAL">
                          {t(
                            "directions.bilateral"
                          )}
                        </option>
                      </select>
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
                              .value as Status
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

                        <option value="ATIVO">
                          {t(
                            "statuses.active"
                          )}
                        </option>

                        <option value="INATIVO">
                          {t(
                            "statuses.inactive"
                          )}
                        </option>

                        <option value="ARQUIVADO">
                          {t(
                            "statuses.archived"
                          )}
                        </option>
                      </select>
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
                      "sections.language"
                    )}
                  </h3>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.language"
                        )}
                      </span>

                      <input
                        value={
                          formulario.idiomaPrincipal
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "idiomaPrincipal",
                            event.target
                              .value
                          )
                        }
                        placeholder={t(
                          "fields.languagePlaceholder"
                        )}
                        className={
                          campo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.minimumLanguageLevel"
                        )}
                      </span>

                      <input
                        value={
                          formulario.nivelIdiomaMinimo
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "nivelIdiomaMinimo",
                            event.target
                              .value
                          )
                        }
                        placeholder={t(
                          "fields.minimumLanguageLevelPlaceholder"
                        )}
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
                      "sections.duration"
                    )}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {t(
                      "sections.durationDescription"
                    )}
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.minimumDays"
                        )}
                      </span>

                      <input
                        type="number"
                        min="0"
                        value={
                          formulario.duracaoMinimaDias
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "duracaoMinimaDias",
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
                          "fields.maximumDays"
                        )}
                      </span>

                      <input
                        type="number"
                        min="0"
                        value={
                          formulario.duracaoMaximaDias
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "duracaoMaximaDias",
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
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    salvando
                  }
                  onClick={
                    fecharModal
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
