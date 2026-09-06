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

type Direcao =
  | "SAIDA"
  | "ENTRADA"
  | "BIDIRECIONAL";

type Status =
  | "RASCUNHO"
  | "ATIVO"
  | "SUSPENSO"
  | "ENCERRADO"
  | "EXPIRADO";

type Parceiro = {
  id: number;
  nome: string;
  sigla: string | null;
  paisCodigo: string;
  cidade: string | null;
  ativo: boolean;
};

type Curso = {
  id: number;
  nome: string;
  codigo: string | null;
  ativo: boolean;
};

type Convenio = {
  id: number;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  direcao: Direcao;
  status: Status;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  reciprocidade: boolean;
  vagasSaidaAno: number | null;
  vagasEntradaAno: number | null;
  isencaoTaxaAcademica: boolean;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;

  instituicaoParceira: Parceiro;

  criadoPor: {
    id: number;
    nome: string;
    email: string;
  } | null;

  cursos: Array<{
    id: number;
    cursoId: number;
    curso: Curso;
  }>;

  _count: {
    programas: number;
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
    suspensos: number;
  };

  convenios: Convenio[];
  parceiros: Parceiro[];
  cursos: Curso[];
};

type RespostaErro = {
  ok?: false;
  codigo?: string;
};

type Formulario = {
  instituicaoParceiraId: string;
  nome: string;
  codigo: string;
  descricao: string;
  direcao: Direcao;
  status: Status;
  vigenciaInicio: string;
  vigenciaFim: string;
  reciprocidade: boolean;
  vagasSaidaAno: string;
  vagasEntradaAno: string;
  isencaoTaxaAcademica: boolean;
  cursoIds: number[];
  observacoes: string;
};

type Toast = {
  tipo: "sucesso" | "erro";
  mensagem: string;
};

const FORMULARIO_INICIAL: Formulario = {
  instituicaoParceiraId: "",
  nome: "",
  codigo: "",
  descricao: "",
  direcao: "BIDIRECIONAL",
  status: "RASCUNHO",
  vigenciaInicio: "",
  vigenciaFim: "",
  reciprocidade: true,
  vagasSaidaAno: "",
  vagasEntradaAno: "",
  isencaoTaxaAcademica: false,
  cursoIds: [],
  observacoes: "",
};

function dataInput(
  valor: string | null
) {
  return valor
    ? valor.slice(0, 10)
    : "";
}

function formatarData(
  valor: string | null,
  locale: string
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

export default function ConveniosMobilidadePage() {
  const locale =
    useLocale();

  const t =
    useTranslations(
      "AdminMobilityAgreements"
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
    ativos: 0,
    rascunhos: 0,
    suspensos: 0,
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
    filtroDirecao,
    setFiltroDirecao,
  ] = useState("");

  const [
    filtroParceiro,
    setFiltroParceiro,
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
    "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-500 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-blue-400 dark:focus:ring-blue-900";

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
      PARCEIRO_INVALIDO:
        "errors.invalidPartner",
      DIRECAO_INVALIDA:
        "errors.invalidDirection",
      STATUS_INVALIDO:
        "errors.invalidStatus",
      DATA_INVALIDA:
        "errors.invalidDate",
      VIGENCIA_INVALIDA:
        "errors.invalidValidity",
      VAGAS_INVALIDAS:
        "errors.invalidSeats",
      CURSO_INVALIDO:
        "errors.invalidCourse",
      CODIGO_DUPLICADO:
        "errors.duplicateCode",
      CONVENIO_NAO_ENCONTRADO:
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

          if (filtroDirecao) {
            params.set(
              "direcao",
              filtroDirecao
            );
          }

          if (filtroParceiro) {
            params.set(
              "parceiroId",
              filtroParceiro
            );
          }

          const resposta =
            await fetch(
              `/api/admin/mobilidade/convenios?${params.toString()}`,
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
              "convenios" in
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

          setConvenios(
            corpo.convenios
          );

          setParceiros(
            corpo.parceiros
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
        filtroDirecao,
        filtroParceiro,
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
    setEditandoId(null);
    setBuscaCurso("");

    setFormulario({
      ...FORMULARIO_INICIAL,

      instituicaoParceiraId:
        parceiros.find(
          (item) =>
            item.ativo
        )?.id.toString() ??
        "",
    });

    setModalAberto(true);
  }

  function abrirEdicao(
    convenio: Convenio
  ) {
    setEditandoId(
      convenio.id
    );

    setBuscaCurso("");

    setFormulario({
      instituicaoParceiraId:
        convenio
          .instituicaoParceira
          .id.toString(),

      nome:
        convenio.nome,

      codigo:
        convenio.codigo ??
        "",

      descricao:
        convenio.descricao ??
        "",

      direcao:
        convenio.direcao,

      status:
        convenio.status,

      vigenciaInicio:
        dataInput(
          convenio.vigenciaInicio
        ),

      vigenciaFim:
        dataInput(
          convenio.vigenciaFim
        ),

      reciprocidade:
        convenio.reciprocidade,

      vagasSaidaAno:
        convenio.vagasSaidaAno ===
        null
          ? ""
          : String(
              convenio.vagasSaidaAno
            ),

      vagasEntradaAno:
        convenio.vagasEntradaAno ===
        null
          ? ""
          : String(
              convenio.vagasEntradaAno
            ),

      isencaoTaxaAcademica:
        convenio.isencaoTaxaAcademica,

      cursoIds:
        convenio.cursos.map(
          (vinculo) =>
            vinculo.cursoId
        ),

      observacoes:
        convenio.observacoes ??
        "",
    });

    setModalAberto(true);
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

    if (
      !formulario
        .instituicaoParceiraId
    ) {
      mostrarToast(
        "erro",
        t(
          "errors.invalidPartner"
        )
      );
      return;
    }

    setSalvando(true);

    try {
      const url =
        editandoId
          ? `/api/admin/mobilidade/convenios/${editandoId}`
          : "/api/admin/mobilidade/convenios";

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
                instituicaoParceiraId:
                  Number(
                    formulario.instituicaoParceiraId
                  ),

                nome:
                  formulario.nome,

                codigo:
                  formulario.codigo,

                descricao:
                  formulario.descricao,

                direcao:
                  formulario.direcao,

                status:
                  formulario.status,

                vigenciaInicio:
                  formulario.vigenciaInicio,

                vigenciaFim:
                  formulario.vigenciaFim,

                reciprocidade:
                  formulario.reciprocidade,

                vagasSaidaAno:
                  formulario.vagasSaidaAno,

                vagasEntradaAno:
                  formulario.vagasEntradaAno,

                isencaoTaxaAcademica:
                  formulario.isencaoTaxaAcademica,

                cursoIds:
                  formulario.cursoIds,

                observacoes:
                  formulario.observacoes,
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
      setSalvando(false);
    }
  }

  function textoDirecao(
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

  function textoStatus(
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
      SUSPENSO:
        "statuses.suspended",
      ENCERRADO:
        "statuses.closed",
      EXPIRADO:
        "statuses.expired",
    };

    return t(
      mapa[status]
    );
  }

  function classeStatus(
    status: Status
  ) {
    if (
      status === "ATIVO"
    ) {
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
    }

    if (
      status ===
      "SUSPENSO"
    ) {
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
    }

    if (
      status ===
      "RASCUNHO"
    ) {
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200";
    }

    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
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
                {t("back")}
              </Link>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                {t("title")}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700 dark:text-slate-300 sm:text-base">
                {t("subtitle")}
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
              "🤝",
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
                "summary.suspended"
              ),
              resumo.suspensos,
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
                      {titulo}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                      {valor}
                    </p>
                  </div>

                  <span className="h-fit rounded-xl bg-slate-100 p-2 text-xl dark:bg-slate-800">
                    {icone}
                  </span>
                </div>
              </div>
            )
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-3 xl:grid-cols-[1fr_220px_190px_250px_auto]">
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
              className={campo}
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
              className={campo}
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

              <option value="SUSPENSO">
                {t(
                  "statuses.suspended"
                )}
              </option>

              <option value="ENCERRADO">
                {t(
                  "statuses.closed"
                )}
              </option>

              <option value="EXPIRADO">
                {t(
                  "statuses.expired"
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
              className={campo}
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

            <select
              value={
                filtroParceiro
              }
              onChange={(
                event
              ) =>
                setFiltroParceiro(
                  event.target
                    .value
                )
              }
              className={campo}
            >
              <option value="">
                {t(
                  "filters.allPartners"
                )}
              </option>

              {parceiros.map(
                (parceiro) => (
                  <option
                    key={
                      parceiro.id
                    }
                    value={
                      parceiro.id
                    }
                  >
                    {parceiro.nome}
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
          ) : convenios.length ===
            0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">
                🤝
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
              <table className="w-full min-w-[1050px]">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <th className="px-5 py-4">
                      {t(
                        "table.agreement"
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
                        "table.validity"
                      )}
                    </th>

                    <th className="px-5 py-4">
                      {t(
                        "table.courses"
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
                  {convenios.map(
                    (convenio) => (
                      <tr
                        key={
                          convenio.id
                        }
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-950 dark:text-white">
                            {
                              convenio.nome
                            }
                          </div>

                          {convenio.codigo && (
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {
                                convenio.codigo
                              }
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <div>
                            {bandeira(
                              convenio
                                .instituicaoParceira
                                .paisCodigo
                            )}{" "}
                            {
                              convenio
                                .instituicaoParceira
                                .nome
                            }
                          </div>

                          {convenio
                            .instituicaoParceira
                            .cidade && (
                            <div className="mt-1 text-xs text-slate-500">
                              {
                                convenio
                                  .instituicaoParceira
                                  .cidade
                              }
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {textoDirecao(
                            convenio.direcao
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          <div>
                            {formatarData(
                              convenio.vigenciaInicio,
                              locale
                            )}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            →{" "}
                            {formatarData(
                              convenio.vigenciaFim,
                              locale
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {convenio
                            .cursos
                            .length >
                          0
                            ? t(
                                "table.courseCount",
                                {
                                  count:
                                    convenio
                                      .cursos
                                      .length,
                                }
                              )
                            : t(
                                "table.allCourses"
                              )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${classeStatus(
                              convenio.status
                            )}`}
                          >
                            {textoStatus(
                              convenio.status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          {podeGerenciar && (
                            <button
                              type="button"
                              onClick={() =>
                                abrirEdicao(
                                  convenio
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
                          "fields.partner"
                        )}{" "}
                        *
                      </span>

                      <select
                        required
                        value={
                          formulario.instituicaoParceiraId
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "instituicaoParceiraId",
                            event
                              .target
                              .value
                          )
                        }
                        className={campo}
                      >
                        <option value="">
                          {t(
                            "fields.selectPartner"
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
                                    "fields.inactivePartner"
                                  )}`
                                : ""}
                            </option>
                          )
                        )}
                      </select>
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
                            event
                              .target
                              .value
                          )
                        }
                        className={campo}
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
                            event
                              .target
                              .value
                          )
                        }
                        className={campo}
                      />
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
                            event
                              .target
                              .value as Direcao
                          )
                        }
                        className={campo}
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
                            event
                              .target
                              .value as Status
                          )
                        }
                        className={campo}
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

                        <option value="SUSPENSO">
                          {t(
                            "statuses.suspended"
                          )}
                        </option>

                        <option value="ENCERRADO">
                          {t(
                            "statuses.closed"
                          )}
                        </option>

                        <option value="EXPIRADO">
                          {t(
                            "statuses.expired"
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
                        rows={3}
                        value={
                          formulario.descricao
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "descricao",
                            event
                              .target
                              .value
                          )
                        }
                        className={campo}
                      />
                    </label>
                  </div>
                </section>

                <section className="border-t border-slate-200 pt-6 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    {t(
                      "sections.validity"
                    )}
                  </h3>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.startDate"
                        )}
                      </span>

                      <input
                        type="date"
                        value={
                          formulario.vigenciaInicio
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "vigenciaInicio",
                            event
                              .target
                              .value
                          )
                        }
                        className={campo}
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.endDate"
                        )}
                      </span>

                      <input
                        type="date"
                        value={
                          formulario.vigenciaFim
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "vigenciaFim",
                            event
                              .target
                              .value
                          )
                        }
                        className={campo}
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.outgoingSeats"
                        )}
                      </span>

                      <input
                        type="number"
                        min="0"
                        value={
                          formulario.vagasSaidaAno
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "vagasSaidaAno",
                            event
                              .target
                              .value
                          )
                        }
                        className={campo}
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold">
                        {t(
                          "fields.incomingSeats"
                        )}
                      </span>

                      <input
                        type="number"
                        min="0"
                        value={
                          formulario.vagasEntradaAno
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "vagasEntradaAno",
                            event
                              .target
                              .value
                          )
                        }
                        className={campo}
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                      <input
                        type="checkbox"
                        checked={
                          formulario.reciprocidade
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "reciprocidade",
                            event
                              .target
                              .checked
                          )
                        }
                      />

                      <div>
                        <div className="text-sm font-semibold">
                          {t(
                            "fields.reciprocity"
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "fields.reciprocityDescription"
                          )}
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                      <input
                        type="checkbox"
                        checked={
                          formulario.isencaoTaxaAcademica
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "isencaoTaxaAcademica",
                            event
                              .target
                              .checked
                          )
                        }
                      />

                      <div>
                        <div className="text-sm font-semibold">
                          {t(
                            "fields.tuitionWaiver"
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "fields.tuitionWaiverDescription"
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
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
                        (curso) => (
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
                                {!curso.ativo
                                  ? ` · ${t(
                                      "fields.inactiveCourse"
                                    )}`
                                  : ""}
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
                          "fields.allCoursesSelected"
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
                      "sections.notes"
                    )}
                  </h3>

                  <textarea
                    rows={5}
                    value={
                      formulario.observacoes
                    }
                    onChange={(
                      event
                    ) =>
                      atualizar(
                        "observacoes",
                        event.target
                          .value
                      )
                    }
                    className={`${campo} mt-4`}
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
            className={[
              "rounded-2xl border px-4 py-3 text-sm font-semibold shadow-2xl",
              toast.tipo ===
              "sucesso"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100",
            ].join(" ")}
          >
            {toast.mensagem}
          </div>
        </div>
      )}
    </main>
  );
}
