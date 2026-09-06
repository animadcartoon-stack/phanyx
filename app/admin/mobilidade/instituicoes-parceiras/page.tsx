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
import {
  getCountries,
  type CountryCode,
} from "libphonenumber-js";

import CampoTelefoneInternacional from "@/components/internacionalizacao/CampoTelefoneInternacional";
import {
  detectarPaisTelefone,
} from "@/lib/internacionalizacao/telefone";

type InstituicaoParceira = {
  id: number;
  nome: string;
  sigla: string | null;
  codigo: string | null;
  paisCodigo: string;
  paisNome: string | null;
  cidade: string | null;
  estadoProvincia: string | null;
  endereco: string | null;
  cep: string | null;
  site: string | null;
  emailGeral: string | null;
  telefone: string | null;
  nomeContato: string | null;
  cargoContato: string | null;
  emailContato: string | null;
  telefoneContato: string | null;
  observacoes: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;

  criadoPor: {
    id: number;
    nome: string;
    email: string;
  } | null;

  _count: {
    convenios: number;
  };
};

type RespostaLista = {
  ok: true;

  permissoes: {
    podeGerenciar: boolean;
  };

  resumo: {
    total: number;
    ativas: number;
    inativas: number;
  };

  itens: InstituicaoParceira[];
};

type RespostaErro = {
  ok?: false;
  codigo?: string;
};

type Formulario = {
  nome: string;
  sigla: string;
  codigo: string;
  paisCodigo: CountryCode;
  cidade: string;
  estadoProvincia: string;
  endereco: string;
  cep: string;
  site: string;
  emailGeral: string;
  telefone: string;
  paisTelefone: CountryCode;
  nomeContato: string;
  cargoContato: string;
  emailContato: string;
  telefoneContato: string;
  paisTelefoneContato: CountryCode;
  observacoes: string;
  ativo: boolean;
};

type Toast = {
  tipo: "sucesso" | "erro";
  mensagem: string;
};

type FiltroStatus =
  | "TODAS"
  | "ATIVAS"
  | "INATIVAS";

const PAIS_POR_LOCALE: Record<
  string,
  CountryCode
> = {
  "pt-BR": "BR",
  "pt-PT": "PT",
  "en-US": "US",
  "es-ES": "ES",
  "fr-FR": "FR",
};

function paisInicial(
  locale: string
): CountryCode {
  return (
    PAIS_POR_LOCALE[
      locale
    ] ?? "BR"
  );
}

function codigoPaisValido(
  valor: unknown
): valor is CountryCode {
  return (
    typeof valor ===
      "string" &&
    getCountries().includes(
      valor as CountryCode
    )
  );
}

function criarFormularioVazio(
  locale: string
): Formulario {
  const pais =
    paisInicial(locale);

  return {
    nome: "",
    sigla: "",
    codigo: "",
    paisCodigo: pais,
    cidade: "",
    estadoProvincia: "",
    endereco: "",
    cep: "",
    site: "",
    emailGeral: "",
    telefone: "",
    paisTelefone: pais,
    nomeContato: "",
    cargoContato: "",
    emailContato: "",
    telefoneContato: "",
    paisTelefoneContato:
      pais,
    observacoes: "",
    ativo: true,
  };
}

function formatarData(
  valor: string,
  locale: string
) {
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
    }
  ).format(data);
}

function bandeiraPais(
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
          letra.charCodeAt(
            0
          )
      )
  );
}

export default function InstituicoesParceirasPage() {
  const locale =
    useLocale();

  const t =
    useTranslations(
      "AdminMobilityPartners"
    );

  const [
    itens,
    setItens,
  ] = useState<
    InstituicaoParceira[]
  >([]);

  const [
    resumo,
    setResumo,
  ] = useState({
    total: 0,
    ativas: 0,
    inativas: 0,
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
  ] =
    useState<FiltroStatus>(
      "TODAS"
    );

  const [
    filtroPais,
    setFiltroPais,
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
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    alterandoStatusId,
    setAlterandoStatusId,
  ] = useState<
    number | null
  >(null);

  const [
    formulario,
    setFormulario,
  ] = useState<Formulario>(
    () =>
      criarFormularioVazio(
        locale
      )
  );

  const [
    toast,
    setToast,
  ] = useState<
    Toast | null
  >(null);

  const paises =
    useMemo(() => {
      let displayNames:
        | Intl.DisplayNames
        | null = null;

      try {
        displayNames =
          new Intl.DisplayNames(
            [locale],
            {
              type: "region",
            }
          );
      } catch {
        displayNames =
          null;
      }

      return getCountries()
        .map(
          (codigo) => ({
            codigo,
            nome:
              displayNames?.of(
                codigo
              ) ??
              codigo,
          })
        )
        .sort(
          (a, b) =>
            a.nome.localeCompare(
              b.nome,
              locale
            )
        );
    }, [locale]);

  const nomePais =
    useCallback(
      (
        codigo: string
      ) => {
        const encontrado =
          paises.find(
            (pais) =>
              pais.codigo ===
              codigo
          );

        return (
          encontrado?.nome ??
          codigo
        );
      },
      [paises]
    );

  const classeCampo =
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

      PAIS_INVALIDO:
        "errors.invalidCountry",

      EMAIL_INVALIDO:
        "errors.invalidEmail",

      SITE_INVALIDO:
        "errors.invalidWebsite",

      INSTITUICAO_DUPLICADA:
        "errors.duplicate",

      INSTITUICAO_NAO_ENCONTRADA:
        "errors.notFound",

      ID_INVALIDO:
        "errors.invalidId",

      STATUS_INVALIDO:
        "errors.invalidStatus",
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

          if (
            busca.trim()
          ) {
            params.set(
              "q",
              busca.trim()
            );
          }

          if (
            filtroPais
          ) {
            params.set(
              "pais",
              filtroPais
            );
          }

          params.set(
            "status",
            filtroStatus
          );

          const resposta =
            await fetch(
              `/api/admin/mobilidade/instituicoes-parceiras?${params.toString()}`,
              {
                method: "GET",
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
            !("itens" in corpo)
          ) {
            throw new Error(
              traduzirErro(
                "codigo" in
                  corpo
                  ? corpo.codigo
                  : undefined
              )
            );
          }

          setItens(
            corpo.itens
          );

          setResumo(
            corpo.resumo
          );

          setPodeGerenciar(
            corpo
              .permissoes
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
        filtroPais,
        filtroStatus,
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

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [carregar]);

  function atualizar<
    K extends keyof Formulario
  >(
    campo: K,
    valor: Formulario[K]
  ) {
    setFormulario(
      (atual) => ({
        ...atual,
        [campo]: valor,
      })
    );
  }

  function abrirNovo() {
    setEditandoId(null);

    setFormulario(
      criarFormularioVazio(
        locale
      )
    );

    setModalAberto(
      true
    );
  }

  function abrirEdicao(
    item: InstituicaoParceira
  ) {
    const pais =
      codigoPaisValido(
        item.paisCodigo
      )
        ? item.paisCodigo
        : paisInicial(
            locale
          );

    const paisTelefone =
      detectarPaisTelefone(
        item.telefone ??
          ""
      ) ?? pais;

    const paisTelefoneContato =
      detectarPaisTelefone(
        item.telefoneContato ??
          ""
      ) ?? pais;

    setEditandoId(
      item.id
    );

    setFormulario({
      nome: item.nome,
      sigla:
        item.sigla ?? "",
      codigo:
        item.codigo ?? "",
      paisCodigo: pais,
      cidade:
        item.cidade ?? "",
      estadoProvincia:
        item.estadoProvincia ??
        "",
      endereco:
        item.endereco ??
        "",
      cep:
        item.cep ?? "",
      site:
        item.site ?? "",
      emailGeral:
        item.emailGeral ??
        "",
      telefone:
        item.telefone ??
        "",
      paisTelefone,
      nomeContato:
        item.nomeContato ??
        "",
      cargoContato:
        item.cargoContato ??
        "",
      emailContato:
        item.emailContato ??
        "",
      telefoneContato:
        item.telefoneContato ??
        "",
      paisTelefoneContato,
      observacoes:
        item.observacoes ??
        "",
      ativo: item.ativo,
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

    setSalvando(true);

    try {
      const url =
        editandoId
          ? `/api/admin/mobilidade/instituicoes-parceiras/${editandoId}`
          : "/api/admin/mobilidade/instituicoes-parceiras";

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
                nome:
                  formulario.nome,
                sigla:
                  formulario.sigla,
                codigo:
                  formulario.codigo,
                paisCodigo:
                  formulario.paisCodigo,
                cidade:
                  formulario.cidade,
                estadoProvincia:
                  formulario.estadoProvincia,
                endereco:
                  formulario.endereco,
                cep:
                  formulario.cep,
                site:
                  formulario.site,
                emailGeral:
                  formulario.emailGeral,
                telefone:
                  formulario.telefone,
                nomeContato:
                  formulario.nomeContato,
                cargoContato:
                  formulario.cargoContato,
                emailContato:
                  formulario.emailContato,
                telefoneContato:
                  formulario.telefoneContato,
                observacoes:
                  formulario.observacoes,
                ativo:
                  formulario.ativo,
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
            "codigo" in
              corpo
              ? corpo.codigo
              : undefined
          )
        );
      }

      fecharModal();

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

  async function alterarStatus(
    item: InstituicaoParceira
  ) {
    setAlterandoStatusId(
      item.id
    );

    try {
      const resposta =
        await fetch(
          `/api/admin/mobilidade/instituicoes-parceiras/${item.id}`,
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
                  "ALTERAR_STATUS",
                ativo:
                  !item.ativo,
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
            "codigo" in
              corpo
              ? corpo.codigo
              : undefined
          )
        );
      }

      mostrarToast(
        "sucesso",
        item.ativo
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
              "errors.status"
            )
      );
    } finally {
      setAlterandoStatusId(
        null
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
                className="text-sm font-semibold text-blue-700 transition hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
              >
                ←{" "}
                {t(
                  "back"
                )}
              </Link>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
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
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                <span
                  aria-hidden="true"
                >
                  +
                </span>

                {t(
                  "actions.new"
                )}
              </button>
            )}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            [
              t(
                "summary.total"
              ),
              resumo.total,
              "🌐",
            ],
            [
              t(
                "summary.active"
              ),
              resumo.ativas,
              "✅",
            ],
            [
              t(
                "summary.inactive"
              ),
              resumo.inativas,
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {
                        titulo
                      }
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">
                      {
                        valor
                      }
                    </p>
                  </div>

                  <span className="rounded-xl bg-slate-100 p-2 text-xl dark:bg-slate-800">
                    {
                      icone
                    }
                  </span>
                </div>
              </div>
            )
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_230px_180px_auto]">
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
                classeCampo
              }
            />

            <select
              value={
                filtroPais
              }
              onChange={(
                event
              ) =>
                setFiltroPais(
                  event.target
                    .value
                )
              }
              className={
                classeCampo
              }
            >
              <option value="">
                {t(
                  "filters.allCountries"
                )}
              </option>

              {paises.map(
                (pais) => (
                  <option
                    key={
                      pais.codigo
                    }
                    value={
                      pais.codigo
                    }
                  >
                    {
                      pais.nome
                    }
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
                    .value as FiltroStatus
                )
              }
              className={
                classeCampo
              }
            >
              <option value="TODAS">
                {t(
                  "filters.all"
                )}
              </option>

              <option value="ATIVAS">
                {t(
                  "filters.active"
                )}
              </option>

              <option value="INATIVAS">
                {t(
                  "filters.inactive"
                )}
              </option>
            </select>

            <button
              type="button"
              onClick={() =>
                void carregar()
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
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
          ) : itens.length ===
            0 ? (
            <div className="p-10 text-center">
              <div className="text-4xl">
                🌐
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">
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
                  className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  {t(
                    "actions.new"
                  )}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
                    <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <th className="px-5 py-4">
                        {t(
                          "table.institution"
                        )}
                      </th>

                      <th className="px-5 py-4">
                        {t(
                          "table.location"
                        )}
                      </th>

                      <th className="px-5 py-4">
                        {t(
                          "table.contact"
                        )}
                      </th>

                      <th className="px-5 py-4 text-center">
                        {t(
                          "table.agreements"
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
                    {itens.map(
                      (item) => (
                        <tr
                          key={
                            item.id
                          }
                          className="transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-950 dark:text-white">
                              {
                                item.nome
                              }
                            </div>

                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                              {item.sigla && (
                                <span>
                                  {
                                    item.sigla
                                  }
                                </span>
                              )}

                              {item.codigo && (
                                <span>
                                  •{" "}
                                  {
                                    item.codigo
                                  }
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                            <div>
                              {bandeiraPais(
                                item.paisCodigo
                              )}{" "}
                              {nomePais(
                                item.paisCodigo
                              )}
                            </div>

                            {(item.cidade ||
                              item.estadoProvincia) && (
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {[
                                  item.cidade,
                                  item.estadoProvincia,
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

                          <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
                            <div>
                              {item.nomeContato ??
                                item.emailGeral ??
                                "—"}
                            </div>

                            {item.emailContato && (
                              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {
                                  item.emailContato
                                }
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex min-w-9 justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                              {
                                item
                                  ._count
                                  .convenios
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={[
                                "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                                item.ativo
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                                  : "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                              ].join(
                                " "
                              )}
                            >
                              {item.ativo
                                ? t(
                                    "status.active"
                                  )
                                : t(
                                    "status.inactive"
                                  )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {item.site && (
                                <a
                                  href={
                                    item.site
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  {t(
                                    "actions.website"
                                  )}
                                </a>
                              )}

                              {podeGerenciar && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      abrirEdicao(
                                        item
                                      )
                                    }
                                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-950/70"
                                  >
                                    {t(
                                      "actions.edit"
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      alterandoStatusId ===
                                      item.id
                                    }
                                    onClick={() =>
                                      void alterarStatus(
                                        item
                                      )
                                    }
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    {item.ativo
                                      ? t(
                                          "actions.deactivate"
                                        )
                                      : t(
                                          "actions.activate"
                                        )}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 lg:hidden">
                {itens.map(
                  (item) => (
                    <article
                      key={
                        item.id
                      }
                      className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-bold text-slate-950 dark:text-white">
                            {
                              item.nome
                            }
                          </h2>

                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {bandeiraPais(
                              item.paisCodigo
                            )}{" "}
                            {nomePais(
                              item.paisCodigo
                            )}
                          </p>
                        </div>

                        <span
                          className={[
                            "rounded-full border px-2 py-1 text-xs font-bold",
                            item.ativo
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
                              : "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                          ].join(
                            " "
                          )}
                        >
                          {item.ativo
                            ? t(
                                "status.active"
                              )
                            : t(
                                "status.inactive"
                              )}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                        {(item.cidade ||
                          item.estadoProvincia) && (
                          <div>
                            📍{" "}
                            {[
                              item.cidade,
                              item.estadoProvincia,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                " · "
                              )}
                          </div>
                        )}

                        <div>
                          🤝{" "}
                          {t(
                            "mobile.agreements",
                            {
                              count:
                                item
                                  ._count
                                  .convenios,
                            }
                          )}
                        </div>

                        {item.nomeContato && (
                          <div>
                            👤{" "}
                            {
                              item.nomeContato
                            }
                          </div>
                        )}
                      </div>

                      {podeGerenciar && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              abrirEdicao(
                                item
                              )
                            }
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                          >
                            {t(
                              "actions.edit"
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void alterarStatus(
                                item
                              )
                            }
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                          >
                            {item.ativo
                              ? t(
                                  "actions.deactivate"
                                )
                              : t(
                                  "actions.activate"
                                )}
                          </button>
                        </div>
                      )}
                    </article>
                  )
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {modalAberto && (
        <div
          role="presentation"
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
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-instituicao-parceira"
            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
              <div>
                <h2
                  id="modal-instituicao-parceira"
                  className="text-xl font-bold text-slate-950 dark:text-white"
                >
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
                className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
                      "sections.institution"
                    )}
                  </h3>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="md:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
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
                          classeCampo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.acronym"
                        )}
                      </span>

                      <input
                        value={
                          formulario.sigla
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "sigla",
                            event.target
                              .value
                          )
                        }
                        className={
                          classeCampo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
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
                          classeCampo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.country"
                        )}{" "}
                        *
                      </span>

                      <select
                        required
                        value={
                          formulario.paisCodigo
                        }
                        onChange={(
                          event
                        ) => {
                          const codigo =
                            event.target
                              .value as CountryCode;

                          atualizar(
                            "paisCodigo",
                            codigo
                          );

                          atualizar(
                            "paisTelefone",
                            codigo
                          );

                          atualizar(
                            "paisTelefoneContato",
                            codigo
                          );
                        }}
                        className={
                          classeCampo
                        }
                      >
                        {paises.map(
                          (
                            pais
                          ) => (
                            <option
                              key={
                                pais.codigo
                              }
                              value={
                                pais.codigo
                              }
                            >
                              {
                                pais.nome
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.state"
                        )}
                      </span>

                      <input
                        value={
                          formulario.estadoProvincia
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "estadoProvincia",
                            event.target
                              .value
                          )
                        }
                        className={
                          classeCampo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.city"
                        )}
                      </span>

                      <input
                        value={
                          formulario.cidade
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "cidade",
                            event.target
                              .value
                          )
                        }
                        className={
                          classeCampo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.postalCode"
                        )}
                      </span>

                      <input
                        value={
                          formulario.cep
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "cep",
                            event.target
                              .value
                          )
                        }
                        className={
                          classeCampo
                        }
                      />
                    </label>

                    <label className="md:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.address"
                        )}
                      </span>

                      <input
                        value={
                          formulario.endereco
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "endereco",
                            event.target
                              .value
                          )
                        }
                        className={
                          classeCampo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.website"
                        )}
                      </span>

                      <input
                        type="text"
                        value={
                          formulario.site
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "site",
                            event.target
                              .value
                          )
                        }
                        placeholder="https://"
                        className={
                          classeCampo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.generalEmail"
                        )}
                      </span>

                      <input
                        type="email"
                        value={
                          formulario.emailGeral
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "emailGeral",
                            event.target
                              .value
                          )
                        }
                        className={
                          classeCampo
                        }
                      />
                    </label>

                    <label className="md:col-span-2">
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.generalPhone"
                        )}
                      </span>

                      <CampoTelefoneInternacional
                        id="telefone-instituicao-parceira"
                        value={
                          formulario.telefone
                        }
                        pais={
                          formulario.paisTelefone
                        }
                        onChange={(
                          valor,
                          pais
                        ) => {
                          atualizar(
                            "telefone",
                            valor
                          );

                          atualizar(
                            "paisTelefone",
                            pais
                          );
                        }}
                      />
                    </label>
                  </div>
                </section>

                <section className="border-t border-slate-200 pt-6 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    {t(
                      "sections.contact"
                    )}
                  </h3>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.contactName"
                        )}
                      </span>

                      <input
                        value={
                          formulario.nomeContato
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "nomeContato",
                            event.target
                              .value
                          )
                        }
                        className={
                          classeCampo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.contactRole"
                        )}
                      </span>

                      <input
                        value={
                          formulario.cargoContato
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "cargoContato",
                            event.target
                              .value
                          )
                        }
                        className={
                          classeCampo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.contactEmail"
                        )}
                      </span>

                      <input
                        type="email"
                        value={
                          formulario.emailContato
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "emailContato",
                            event.target
                              .value
                          )
                        }
                        className={
                          classeCampo
                        }
                      />
                    </label>

                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.contactPhone"
                        )}
                      </span>

                      <CampoTelefoneInternacional
                        id="telefone-contato-instituicao-parceira"
                        value={
                          formulario.telefoneContato
                        }
                        pais={
                          formulario.paisTelefoneContato
                        }
                        onChange={(
                          valor,
                          pais
                        ) => {
                          atualizar(
                            "telefoneContato",
                            valor
                          );

                          atualizar(
                            "paisTelefoneContato",
                            pais
                          );
                        }}
                      />
                    </label>
                  </div>
                </section>

                <section className="border-t border-slate-200 pt-6 dark:border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    {t(
                      "sections.management"
                    )}
                  </h3>

                  <div className="mt-4 space-y-4">
                    <label>
                      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {t(
                          "fields.notes"
                        )}
                      </span>

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
                        className={
                          classeCampo
                        }
                      />
                    </label>

                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                      <input
                        type="checkbox"
                        checked={
                          formulario.ativo
                        }
                        onChange={(
                          event
                        ) =>
                          atualizar(
                            "ativo",
                            event.target
                              .checked
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />

                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {t(
                            "fields.active"
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            "fields.activeDescription"
                          )}
                        </div>
                      </div>
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
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
