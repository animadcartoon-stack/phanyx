"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

type ItemBiblioteca = {
  id: number;
  titulo: string;
  tipo: string;
  status: string;
  modalidade: string;
  _count: {
    licencas: number;
  };
};

type Licenca = {
  id: number;
  instituicaoId: number;
  itemId: number;

  tipoDireito: string;
  titulo: string | null;
  titularDireitos: string | null;
  descricao: string | null;

  numeroLicenca: string | null;
  origem: string | null;
  urlLicenca: string | null;
  comprovanteUrl: string | null;

  inicioVigencia: string | null;
  fimVigencia: string | null;

  permitirVisualizacao: boolean;
  permitirDownload: boolean;
  permitirImpressao: boolean;
  permitirCopia: boolean;
  permitirEmprestimo: boolean;

  acessosSimultaneos: number | null;
  quantidadeLicencas: number | null;
  territorio: string | null;

  ativo: boolean;
  observacoes: string | null;

  criadoEm: string;
  atualizadoEm: string;

  item: {
    id: number;
    titulo: string;
    tipo: string;
    status: string;
    modalidade: string;
  };

  _count: {
    exemplares: number;
  };
};

type DadosLicencas = {
  success: boolean;

  acesso: {
    podeGerenciar: boolean;
  };

  resumo: {
    total: number;
    ativas: number;
    vencidas: number;
    futuras: number;
    inativas: number;
  };

  tiposDireito: string[];
  licencas: Licenca[];
  itens: ItemBiblioteca[];
};

type FormLicenca = {
  itemId: string;
  tipoDireito: string;

  titulo: string;
  titularDireitos: string;
  descricao: string;

  numeroLicenca: string;
  origem: string;
  urlLicenca: string;
  comprovanteUrl: string;

  inicioVigencia: string;
  fimVigencia: string;

  permitirVisualizacao: boolean;
  permitirDownload: boolean;
  permitirImpressao: boolean;
  permitirCopia: boolean;
  permitirEmprestimo: boolean;

  acessosSimultaneos: string;
  quantidadeLicencas: string;
  territorio: string;

  observacoes: string;
};

type StatusEfetivo =
  | "active"
  | "expired"
  | "future"
  | "inactive";

const formInicial: FormLicenca = {
  itemId: "",
  tipoDireito: "LICENCA_ADQUIRIDA",

  titulo: "",
  titularDireitos: "",
  descricao: "",

  numeroLicenca: "",
  origem: "",
  urlLicenca: "",
  comprovanteUrl: "",

  inicioVigencia: "",
  fimVigencia: "",

  permitirVisualizacao: true,
  permitirDownload: false,
  permitirImpressao: false,
  permitirCopia: false,
  permitirEmprestimo: true,

  acessosSimultaneos: "",
  quantidadeLicencas: "",
  territorio: "",

  observacoes: "",
};

export default function BibliotecaLicencasPage() {
  const t =
    useTranslations(
      "AdminLibraryLicenses",
    );

  const locale =
    useLocale();

  const [
    dados,
    setDados,
  ] =
    useState<DadosLicencas | null>(
      null,
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    salvando,
    setSalvando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    sucesso,
    setSucesso,
  ] =
    useState("");

  const [
    pesquisa,
    setPesquisa,
  ] =
    useState("");

  const [
    filtroStatus,
    setFiltroStatus,
  ] =
    useState("ALL");

  const [
    filtroTipo,
    setFiltroTipo,
  ] =
    useState("ALL");

  const [
    modalEdicao,
    setModalEdicao,
  ] =
    useState(false);

  const [
    licencaEditando,
    setLicencaEditando,
  ] =
    useState<Licenca | null>(
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<FormLicenca>({
      ...formInicial,
    });

  const [
    licencaDesativar,
    setLicencaDesativar,
  ] =
    useState<Licenca | null>(
      null,
    );

  const [
    motivoDesativacao,
    setMotivoDesativacao,
  ] =
    useState("");

  const [
    licencaRestaurar,
    setLicencaRestaurar,
  ] =
    useState<Licenca | null>(
      null,
    );

  const carregar =
    useCallback(
      async () => {
        try {
          setCarregando(true);
          setErro("");

          const resposta =
            await fetch(
              "/api/admin/biblioteca/licencas",
              {
                credentials:
                  "include",
                cache:
                  "no-store",
              },
            );

          const json =
            await resposta.json();

          if (!resposta.ok) {
            throw new Error(
              json?.error ||
                t("errors.load"),
            );
          }

          setDados(json);
        } catch (e: any) {
          setDados(null);

          setErro(
            e?.message ||
              t("errors.load"),
          );
        } finally {
          setCarregando(false);
        }
      },
      [t],
    );

  useEffect(() => {
    carregar();
  }, [carregar]);

  function dataInput(
    valor: string | null,
  ) {
    if (!valor) {
      return "";
    }

    return valor.slice(
      0,
      10,
    );
  }

  function formatarData(
    valor: string | null,
  ) {
    if (!valor) {
      return "-";
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle: "short",
        timeZone: "UTC",
      },
    ).format(
      new Date(valor),
    );
  }

  function statusEfetivo(
    licenca: Licenca,
  ): StatusEfetivo {
    if (!licenca.ativo) {
      return "inactive";
    }

    const agora =
      new Date();

    if (
      licenca.inicioVigencia &&
      new Date(
        licenca.inicioVigencia,
      ) > agora
    ) {
      return "future";
    }

    if (
      licenca.fimVigencia &&
      new Date(
        licenca.fimVigencia,
      ) < agora
    ) {
      return "expired";
    }

    return "active";
  }

  function nomeStatus(
    licenca: Licenca,
  ) {
    return t(
      `status.${statusEfetivo(
        licenca,
      )}`,
    );
  }

  function abrirNova() {
    setLicencaEditando(null);

    setForm({
      ...formInicial,

      itemId:
        dados?.itens.length === 1
          ? String(
              dados.itens[0].id,
            )
          : "",
    });

    setErro("");
    setModalEdicao(true);
  }

  function abrirEdicao(
    licenca: Licenca,
  ) {
    setLicencaEditando(
      licenca,
    );

    setForm({
      itemId:
        String(
          licenca.itemId,
        ),

      tipoDireito:
        licenca.tipoDireito,

      titulo:
        licenca.titulo ||
        "",

      titularDireitos:
        licenca.titularDireitos ||
        "",

      descricao:
        licenca.descricao ||
        "",

      numeroLicenca:
        licenca.numeroLicenca ||
        "",

      origem:
        licenca.origem ||
        "",

      urlLicenca:
        licenca.urlLicenca ||
        "",

      comprovanteUrl:
        licenca.comprovanteUrl ||
        "",

      inicioVigencia:
        dataInput(
          licenca.inicioVigencia,
        ),

      fimVigencia:
        dataInput(
          licenca.fimVigencia,
        ),

      permitirVisualizacao:
        licenca.permitirVisualizacao,

      permitirDownload:
        licenca.permitirDownload,

      permitirImpressao:
        licenca.permitirImpressao,

      permitirCopia:
        licenca.permitirCopia,

      permitirEmprestimo:
        licenca.permitirEmprestimo,

      acessosSimultaneos:
        licenca.acessosSimultaneos
          ? String(
              licenca.acessosSimultaneos,
            )
          : "",

      quantidadeLicencas:
        licenca.quantidadeLicencas
          ? String(
              licenca.quantidadeLicencas,
            )
          : "",

      territorio:
        licenca.territorio ||
        "",

      observacoes:
        licenca.observacoes ||
        "",
    });

    setErro("");
    setModalEdicao(true);
  }

  function alterarCampo(
    campo: keyof FormLicenca,
    valor: string | boolean,
  ) {
    setForm(
      (atual) => ({
        ...atual,
        [campo]:
          valor,
      }),
    );
  }

  function corpoFormulario() {
    return {
      itemId:
        Number(
          form.itemId,
        ),

      tipoDireito:
        form.tipoDireito,

      titulo:
        form.titulo,

      titularDireitos:
        form.titularDireitos,

      descricao:
        form.descricao,

      numeroLicenca:
        form.numeroLicenca,

      origem:
        form.origem,

      urlLicenca:
        form.urlLicenca,

      comprovanteUrl:
        form.comprovanteUrl,

      inicioVigencia:
        form.inicioVigencia,

      fimVigencia:
        form.fimVigencia,

      permitirVisualizacao:
        form.permitirVisualizacao,

      permitirDownload:
        form.permitirDownload,

      permitirImpressao:
        form.permitirImpressao,

      permitirCopia:
        form.permitirCopia,

      permitirEmprestimo:
        form.permitirEmprestimo,

      acessosSimultaneos:
        form.acessosSimultaneos,

      quantidadeLicencas:
        form.quantidadeLicencas,

      territorio:
        form.territorio,

      observacoes:
        form.observacoes,
    };
  }

  async function salvar() {
    if (!form.itemId) {
      setErro(
        t(
          "errors.selectItem",
        ),
      );

      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const resposta =
        licencaEditando
          ? await fetch(
              `/api/admin/biblioteca/licencas/${licencaEditando.id}`,
              {
                method:
                  "PATCH",

                credentials:
                  "include",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    operacao:
                      "ATUALIZAR",

                    ...corpoFormulario(),
                  }),
              },
            )
          : await fetch(
              "/api/admin/biblioteca/licencas",
              {
                method:
                  "POST",

                credentials:
                  "include",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    corpoFormulario(),
                  ),
              },
            );

      const json =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          json?.error ||
            t("errors.save"),
        );
      }

      setModalEdicao(false);

      setSucesso(
        licencaEditando
          ? t(
              "messages.updated",
            )
          : t(
              "messages.created",
            ),
      );

      await carregar();
    } catch (e: any) {
      setErro(
        e?.message ||
          t("errors.save"),
      );
    } finally {
      setSalvando(false);
    }
  }

  async function desativar() {
    if (!licencaDesativar) {
      return;
    }

    const motivo =
      motivoDesativacao.trim();

    if (!motivo) {
      setErro(
        t(
          "errors.deactivateReason",
        ),
      );

      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const resposta =
        await fetch(
          `/api/admin/biblioteca/licencas/${licencaDesativar.id}`,
          {
            method:
              "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                operacao:
                  "DESATIVAR",

                motivo,
              }),
          },
        );

      const json =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          json?.error ||
            t(
              "errors.deactivate",
            ),
        );
      }

      setLicencaDesativar(
        null,
      );

      setMotivoDesativacao("");

      setSucesso(
        t(
          "messages.deactivated",
        ),
      );

      await carregar();
    } catch (e: any) {
      setErro(
        e?.message ||
          t(
            "errors.deactivate",
          ),
      );
    } finally {
      setSalvando(false);
    }
  }

  async function restaurar() {
    if (!licencaRestaurar) {
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const resposta =
        await fetch(
          `/api/admin/biblioteca/licencas/${licencaRestaurar.id}`,
          {
            method:
              "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                operacao:
                  "RESTAURAR",
              }),
          },
        );

      const json =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          json?.error ||
            t(
              "errors.restore",
            ),
        );
      }

      setLicencaRestaurar(
        null,
      );

      setSucesso(
        t(
          "messages.restored",
        ),
      );

      await carregar();
    } catch (e: any) {
      setErro(
        e?.message ||
          t(
            "errors.restore",
          ),
      );
    } finally {
      setSalvando(false);
    }
  }

  const licencasFiltradas =
    useMemo(
      () => {
        const termo =
          pesquisa
            .trim()
            .toLowerCase();

        return (
          dados?.licencas.filter(
            (licenca) => {
              if (
                filtroStatus !==
                  "ALL" &&
                statusEfetivo(
                  licenca,
                ).toUpperCase() !==
                  filtroStatus
              ) {
                return false;
              }

              if (
                filtroTipo !==
                  "ALL" &&
                licenca.tipoDireito !==
                  filtroTipo
              ) {
                return false;
              }

              if (!termo) {
                return true;
              }

              return [
                licenca.titulo,
                licenca.item.titulo,
                licenca.titularDireitos,
                licenca.numeroLicenca,
                licenca.origem,
                licenca.territorio,
              ]
                .filter(
                  Boolean,
                )
                .some(
                  (valor) =>
                    String(
                      valor,
                    )
                      .toLowerCase()
                      .includes(
                        termo,
                      ),
                );
            },
          ) || []
        );
      },
      [
        dados,
        pesquisa,
        filtroStatus,
        filtroTipo,
      ],
    );

  const podeGerenciar =
    dados?.acesso
      .podeGerenciar ===
    true;

  const card =
    "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";

  const statusClasses:
    Record<
      StatusEfetivo,
      string
    > = {
      active:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",

      expired:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",

      future:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",

      inactive:
        "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
    };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">
            {String.fromCodePoint(
              0x1f4dc,
            )}{" "}
            {t("title")}
          </h1>

          <p className="mt-1 max-w-4xl text-sm text-slate-600 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>

        {podeGerenciar ? (
          <button
            type="button"
            onClick={
              abrirNova
            }
            disabled={
              !dados ||
              dados.itens.length ===
                0
            }
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            +{" "}
            {t(
              "actions.add",
            )}
          </button>
        ) : null}
      </div>

      {erro ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {erro}
        </div>
      ) : null}

      {sucesso ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {sucesso}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={card}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t(
              "cards.total",
            )}
          </p>

          <p className="mt-2 text-3xl font-black">
            {dados?.resumo.total ??
              0}
          </p>
        </div>

        <div className={card}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t(
              "cards.active",
            )}
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {dados?.resumo.ativas ??
              0}
          </p>
        </div>

        <div className={card}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t(
              "cards.expired",
            )}
          </p>

          <p className="mt-2 text-3xl font-black text-red-600 dark:text-red-400">
            {dados?.resumo.vencidas ??
              0}
          </p>
        </div>

        <div className={card}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t(
              "cards.futureInactive",
            )}
          </p>

          <p className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400">
            {(dados?.resumo.futuras ??
              0) +
              (dados?.resumo.inativas ??
                0)}
          </p>
        </div>
      </section>

      <section className={`${card} grid gap-4 md:grid-cols-3`}>
        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            {t(
              "filters.search",
            )}
          </span>

          <input
            value={pesquisa}
            onChange={(e) =>
              setPesquisa(
                e.target.value,
              )
            }
            placeholder={t(
              "filters.searchPlaceholder",
            )}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            {t(
              "filters.status",
            )}
          </span>

          <select
            value={
              filtroStatus
            }
            onChange={(e) =>
              setFiltroStatus(
                e.target.value,
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="ALL">
              {t(
                "filters.allStatuses",
              )}
            </option>

            {[
              "ACTIVE",
              "EXPIRED",
              "FUTURE",
              "INACTIVE",
            ].map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {t(
                    `status.${status.toLowerCase()}`,
                  )}
                </option>
              ),
            )}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            {t(
              "filters.type",
            )}
          </span>

          <select
            value={
              filtroTipo
            }
            onChange={(e) =>
              setFiltroTipo(
                e.target.value,
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="ALL">
              {t(
                "filters.allTypes",
              )}
            </option>

            {dados?.tiposDireito.map(
              (tipo) => (
                <option
                  key={tipo}
                  value={tipo}
                >
                  {t(
                    `types.${tipo}`,
                  )}
                </option>
              ),
            )}
          </select>
        </label>
      </section>

      {carregando ? (
        <div className={card}>
          {t("loading")}
        </div>
      ) : null}

      {!carregando &&
      dados &&
      dados.licencas.length ===
        0 ? (
        <div className={`${card} py-10 text-center`}>
          <div className="text-4xl">
            {String.fromCodePoint(
              0x1f4dc,
            )}
          </div>

          <h2 className="mt-3 text-lg font-black">
            {t(
              "empty.title",
            )}
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {t(
              "empty.description",
            )}
          </p>

          {podeGerenciar &&
          dados.itens.length >
            0 ? (
            <button
              type="button"
              onClick={
                abrirNova
              }
              className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-700"
            >
              {t(
                "empty.action",
              )}
            </button>
          ) : null}
        </div>
      ) : null}

      {!carregando &&
      dados &&
      dados.licencas.length >
        0 &&
      licencasFiltradas.length ===
        0 ? (
        <div className={`${card} text-center`}>
          {t(
            "empty.filtered",
          )}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {licencasFiltradas.map(
          (licenca) => {
            const status =
              statusEfetivo(
                licenca,
              );

            return (
              <div
                key={
                  licenca.id
                }
                className={card}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black">
                        {licenca.titulo ||
                          licenca.item
                            .titulo}
                      </h2>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-black ${statusClasses[status]}`}
                      >
                        {nomeStatus(
                          licenca,
                        )}
                      </span>
                    </div>

                    {licenca.titulo ? (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {
                          licenca.item
                            .titulo
                        }
                      </p>
                    ) : null}

                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {t(
                        `types.${licenca.tipoDireito}`,
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black">
                      #
                      {
                        licenca.id
                      }
                    </div>

                    {licenca.numeroLicenca ? (
                      <div className="mt-1 text-xs text-slate-500">
                        {
                          licenca.numeroLicenca
                        }
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                    <div className="text-xs font-black uppercase text-slate-500">
                      {t(
                        "labels.validity",
                      )}
                    </div>

                    <div className="mt-1 text-sm font-semibold">
                      {formatarData(
                        licenca.inicioVigencia,
                      )}{" "}
                      -{" "}
                      {formatarData(
                        licenca.fimVigencia,
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                    <div className="text-xs font-black uppercase text-slate-500">
                      {t(
                        "labels.capacity",
                      )}
                    </div>

                    <div className="mt-1 text-sm font-semibold">
                      {t(
                        "labels.licensesCount",
                        {
                          count:
                            licenca.quantidadeLicencas ??
                            "-",
                        },
                      )}
                      {" · "}
                      {t(
                        "labels.simultaneousCount",
                        {
                          count:
                            licenca.acessosSimultaneos ??
                            "-",
                        },
                      )}
                    </div>
                  </div>
                </div>

                {licenca.titularDireitos ? (
                  <p className="mt-4 text-sm">
                    <strong>
                      {t(
                        "labels.rightsHolder",
                      )}
                    </strong>{" "}
                    {
                      licenca.titularDireitos
                    }
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    [
                      "view",
                      licenca.permitirVisualizacao,
                    ],
                    [
                      "download",
                      licenca.permitirDownload,
                    ],
                    [
                      "print",
                      licenca.permitirImpressao,
                    ],
                    [
                      "copy",
                      licenca.permitirCopia,
                    ],
                    [
                      "loan",
                      licenca.permitirEmprestimo,
                    ],
                  ].map(
                    ([
                      chave,
                      permitido,
                    ]) => (
                      <span
                        key={String(
                          chave,
                        )}
                        className={
                          permitido
                            ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 line-through dark:bg-slate-800 dark:text-slate-400"
                        }
                      >
                        {t(
                          `rights.${chave}`,
                        )}
                      </span>
                    ),
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {licenca.territorio ||
                      t(
                        "labels.noTerritory",
                      )}
                  </p>

                  {podeGerenciar ? (
                    licenca.ativo ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            abrirEdicao(
                              licenca,
                            )
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          {t(
                            "actions.edit",
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setErro("");
                            setMotivoDesativacao(
                              "",
                            );
                            setLicencaDesativar(
                              licenca,
                            );
                          }}
                          className="rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          {t(
                            "actions.deactivate",
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setErro("");
                          setLicencaRestaurar(
                            licenca,
                          );
                        }}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                      >
                        {t(
                          "actions.restore",
                        )}
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            );
          },
        )}
      </section>

      {modalEdicao ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2 className="text-xl font-black">
                  {licencaEditando
                    ? t(
                        "modal.editTitle",
                      )
                    : t(
                        "modal.addTitle",
                      )}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {t(
                    "modal.description",
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setModalEdicao(
                    false,
                  )
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold dark:border-slate-700"
              >
                {t(
                  "actions.close",
                )}
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-black">
                    {t(
                      "fields.item",
                    )}
                  </span>

                  <select
                    value={
                      form.itemId
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "itemId",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">
                      {t(
                        "fields.selectItem",
                      )}
                    </option>

                    {dados?.itens.map(
                      (item) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {
                            item.titulo
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-black">
                    {t(
                      "fields.type",
                    )}
                  </span>

                  <select
                    value={
                      form.tipoDireito
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "tipoDireito",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  >
                    {dados?.tiposDireito.map(
                      (tipo) => (
                        <option
                          key={
                            tipo
                          }
                          value={
                            tipo
                          }
                        >
                          {t(
                            `types.${tipo}`,
                          )}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-black">
                    {t(
                      "fields.title",
                    )}
                  </span>

                  <input
                    value={
                      form.titulo
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "titulo",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-black">
                    {t(
                      "fields.rightsHolder",
                    )}
                  </span>

                  <input
                    value={
                      form.titularDireitos
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "titularDireitos",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-black">
                    {t(
                      "fields.number",
                    )}
                  </span>

                  <input
                    value={
                      form.numeroLicenca
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "numeroLicenca",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-black">
                    {t(
                      "fields.origin",
                    )}
                  </span>

                  <input
                    value={
                      form.origem
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "origem",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-black">
                    {t(
                      "fields.start",
                    )}
                  </span>

                  <input
                    type="date"
                    value={
                      form.inicioVigencia
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "inicioVigencia",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-black">
                    {t(
                      "fields.end",
                    )}
                  </span>

                  <input
                    type="date"
                    value={
                      form.fimVigencia
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "fimVigencia",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-black">
                    {t(
                      "fields.quantity",
                    )}
                  </span>

                  <input
                    type="number"
                    min={1}
                    value={
                      form.quantidadeLicencas
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "quantidadeLicencas",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-black">
                    {t(
                      "fields.simultaneous",
                    )}
                  </span>

                  <input
                    type="number"
                    min={1}
                    value={
                      form.acessosSimultaneos
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "acessosSimultaneos",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-black">
                    {t(
                      "fields.territory",
                    )}
                  </span>

                  <input
                    value={
                      form.territorio
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "territorio",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-black">
                    {t(
                      "fields.licenseUrl",
                    )}
                  </span>

                  <input
                    value={
                      form.urlLicenca
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "urlLicenca",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-black">
                    {t(
                      "fields.proofUrl",
                    )}
                  </span>

                  <input
                    value={
                      form.comprovanteUrl
                    }
                    onChange={(e) =>
                      alterarCampo(
                        "comprovanteUrl",
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
              </div>

              <div>
                <h3 className="font-black">
                  {t(
                    "rights.title",
                  )}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {t(
                    "rights.help",
                  )}
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    [
                      "permitirVisualizacao",
                      "view",
                    ],
                    [
                      "permitirDownload",
                      "download",
                    ],
                    [
                      "permitirImpressao",
                      "print",
                    ],
                    [
                      "permitirCopia",
                      "copy",
                    ],
                    [
                      "permitirEmprestimo",
                      "loan",
                    ],
                  ].map(
                    ([
                      campo,
                      chave,
                    ]) => (
                      <label
                        key={
                          String(
                            campo,
                          )
                        }
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={
                            Boolean(
                              form[
                                campo as keyof FormLicenca
                              ],
                            )
                          }
                          onChange={(e) =>
                            alterarCampo(
                              campo as keyof FormLicenca,
                              e.target.checked,
                            )
                          }
                        />

                        <span className="text-sm font-bold">
                          {t(
                            `rights.${chave}`,
                          )}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-black">
                  {t(
                    "fields.description",
                  )}
                </span>

                <textarea
                  rows={3}
                  value={
                    form.descricao
                  }
                  onChange={(e) =>
                    alterarCampo(
                      "descricao",
                      e.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-black">
                  {t(
                    "fields.notes",
                  )}
                </span>

                <textarea
                  rows={3}
                  value={
                    form.observacoes
                  }
                  onChange={(e) =>
                    alterarCampo(
                      "observacoes",
                      e.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    setModalEdicao(
                      false,
                    )
                  }
                  className="rounded-xl border border-slate-300 px-4 py-2.5 font-bold dark:border-slate-700"
                >
                  {t(
                    "actions.cancel",
                  )}
                </button>

                <button
                  type="button"
                  onClick={
                    salvar
                  }
                  disabled={
                    salvando
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-black text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {salvando
                    ? t(
                        "actions.saving",
                      )
                    : t(
                        "actions.save",
                      )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {licencaDesativar ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-xl font-black text-red-700 dark:text-red-300">
              {t(
                "deactivate.title",
              )}
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t(
                "deactivate.description",
                {
                  title:
                    licencaDesativar
                      .titulo ||
                    licencaDesativar
                      .item.titulo,
                },
              )}
            </p>

            <textarea
              rows={4}
              maxLength={1000}
              value={
                motivoDesativacao
              }
              onChange={(e) =>
                setMotivoDesativacao(
                  e.target.value,
                )
              }
              placeholder={t(
                "deactivate.placeholder",
              )}
              className="mt-5 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setLicencaDesativar(
                    null,
                  )
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 font-bold dark:border-slate-700"
              >
                {t(
                  "actions.cancel",
                )}
              </button>

              <button
                type="button"
                onClick={
                  desativar
                }
                disabled={
                  salvando
                }
                className="rounded-xl bg-red-600 px-5 py-2.5 font-black text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t(
                  "actions.confirmDeactivate",
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {licencaRestaurar ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-xl font-black">
              {t(
                "restore.title",
              )}
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t(
                "restore.description",
                {
                  title:
                    licencaRestaurar
                      .titulo ||
                    licencaRestaurar
                      .item.titulo,
                },
              )}
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setLicencaRestaurar(
                    null,
                  )
                }
                className="rounded-xl border border-slate-300 px-4 py-2.5 font-bold dark:border-slate-700"
              >
                {t(
                  "actions.cancel",
                )}
              </button>

              <button
                type="button"
                onClick={
                  restaurar
                }
                disabled={
                  salvando
                }
                className="rounded-xl bg-emerald-600 px-5 py-2.5 font-black text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {t(
                  "actions.confirmRestore",
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
