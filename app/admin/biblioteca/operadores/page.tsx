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

type PermissoesOperador = {
  podeCatalogar: boolean;
  podePublicar: boolean;
  podeArquivar: boolean;
  podeGerenciarEmprestimo: boolean;
  podeGerenciarReserva: boolean;
  podeGerenciarColecao: boolean;
  podeGerenciarLicenca: boolean;
  podeGerenciarOperador: boolean;
  podeVisualizarRelatorio: boolean;
  podeGerenciarConfiguracao: boolean;
};

type UsuarioOperador = {
  id: number;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
};

type FuncionarioOperador = {
  id: number;
  nome: string;
  cargo: string | null;
  setor: string | null;
  fotoPerfil: string | null;
  ativo: boolean;
  statusFuncionario: string;
};

type Operador = PermissoesOperador & {
  id: number;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  revogadoEm: string | null;
  motivoRevogacao: string | null;

  funcionario: FuncionarioOperador;
  usuario: UsuarioOperador;

  criadoPor: {
    id: number;
    nome: string;
    email: string;
  } | null;

  revogadoPor: {
    id: number;
    nome: string;
    email: string;
  } | null;
};

type FuncionarioElegivel = {
  id: number;
  nome: string;
  cargo: string | null;
  setor: string | null;
  fotoPerfil: string | null;
  statusFuncionario: string;

  user: UsuarioOperador | null;
};

type DadosOperadores = {
  success: boolean;

  acesso: {
    podeGerenciar: boolean;
  };

  resumo: {
    total: number;
    ativos: number;
    revogados: number;
    elegiveis: number;
  };

  operadores: Operador[];

  funcionariosElegiveis:
    FuncionarioElegivel[];
};

const permissoesPadrao:
  PermissoesOperador = {
    podeCatalogar: true,
    podePublicar: false,
    podeArquivar: false,
    podeGerenciarEmprestimo: true,
    podeGerenciarReserva: true,
    podeGerenciarColecao: true,
    podeGerenciarLicenca: false,
    podeGerenciarOperador: false,
    podeVisualizarRelatorio: true,
    podeGerenciarConfiguracao: false,
  };

const chavesPermissao:
  Array<keyof PermissoesOperador> = [
    "podeCatalogar",
    "podePublicar",
    "podeArquivar",
    "podeGerenciarEmprestimo",
    "podeGerenciarReserva",
    "podeGerenciarColecao",
    "podeGerenciarLicenca",
    "podeGerenciarOperador",
    "podeVisualizarRelatorio",
    "podeGerenciarConfiguracao",
  ];

export default function BibliotecaOperadoresPage() {
  const t =
    useTranslations(
      "AdminLibraryOperators",
    );

  const locale =
    useLocale();

  const [
    dados,
    setDados,
  ] =
    useState<DadosOperadores | null>(
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
    modalEdicao,
    setModalEdicao,
  ] =
    useState(false);

  const [
    operadorEditando,
    setOperadorEditando,
  ] =
    useState<Operador | null>(
      null,
    );

  const [
    funcionarioId,
    setFuncionarioId,
  ] =
    useState("");

  const [
    permissoes,
    setPermissoes,
  ] =
    useState<PermissoesOperador>({
      ...permissoesPadrao,
    });

  const [
    operadorRevogar,
    setOperadorRevogar,
  ] =
    useState<Operador | null>(
      null,
    );

  const [
    motivoRevogacao,
    setMotivoRevogacao,
  ] =
    useState("");

  const [
    operadorRestaurar,
    setOperadorRestaurar,
  ] =
    useState<Operador | null>(
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
              "/api/admin/biblioteca/operadores",
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

  function formatarData(
    valor: string | null,
  ) {
    if (!valor) return "-";

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle: "short",
        timeStyle: "short",
      },
    ).format(
      new Date(valor),
    );
  }

  function contarPermissoes(
    operador: PermissoesOperador,
  ) {
    return chavesPermissao.filter(
      (chave) =>
        operador[chave],
    ).length;
  }

  function abrirNovo() {
    setOperadorEditando(null);
    setFuncionarioId("");
    setPermissoes({
      ...permissoesPadrao,
    });
    setErro("");
    setModalEdicao(true);
  }

  function abrirEdicao(
    operador: Operador,
  ) {
    setOperadorEditando(
      operador,
    );

    setFuncionarioId(
      String(
        operador.funcionario.id,
      ),
    );

    setPermissoes(
      Object.fromEntries(
        chavesPermissao.map(
          (chave) => [
            chave,
            operador[chave],
          ],
        ),
      ) as unknown as PermissoesOperador,
    );

    setErro("");
    setModalEdicao(true);
  }

  function alterarPermissao(
    chave:
      keyof PermissoesOperador,
  ) {
    setPermissoes(
      (atual) => ({
        ...atual,

        [chave]:
          !atual[chave],
      }),
    );
  }

  async function salvarOperador() {
    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      let resposta: Response;

      if (operadorEditando) {
        resposta =
          await fetch(
            `/api/admin/biblioteca/operadores/${operadorEditando.id}`,
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
                    "ATUALIZAR_PERMISSOES",

                  ...permissoes,
                }),
            },
          );
      } else {
        if (!funcionarioId) {
          setErro(
            t(
              "errors.selectEmployee",
            ),
          );

          return;
        }

        resposta =
          await fetch(
            "/api/admin/biblioteca/operadores",
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
                JSON.stringify({
                  funcionarioId:
                    Number(
                      funcionarioId,
                    ),

                  ...permissoes,
                }),
            },
          );
      }

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
        operadorEditando
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

  async function revogar() {
    if (!operadorRevogar) {
      return;
    }

    const motivo =
      motivoRevogacao.trim();

    if (!motivo) {
      setErro(
        t(
          "errors.revokeReason",
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
          `/api/admin/biblioteca/operadores/${operadorRevogar.id}`,
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
                operacao:
                  "REVOGAR",

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
              "errors.revoke",
            ),
        );
      }

      setOperadorRevogar(null);
      setMotivoRevogacao("");

      setSucesso(
        t(
          "messages.revoked",
        ),
      );

      await carregar();
    } catch (e: any) {
      setErro(
        e?.message ||
          t("errors.revoke"),
      );
    } finally {
      setSalvando(false);
    }
  }

  async function restaurar() {
    if (!operadorRestaurar) {
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const resposta =
        await fetch(
          `/api/admin/biblioteca/operadores/${operadorRestaurar.id}`,
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

      setOperadorRestaurar(
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

  const operadoresAtivos =
    useMemo(
      () =>
        dados?.operadores.filter(
          (item) =>
            item.ativo,
        ) || [],
      [dados],
    );

  const operadoresRevogados =
    useMemo(
      () =>
        dados?.operadores.filter(
          (item) =>
            !item.ativo,
        ) || [],
      [dados],
    );

  const card =
    "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";

  const podeGerenciar =
    dados?.acesso
      .podeGerenciar ===
    true;

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">
            {String.fromCodePoint(
              0x1f465,
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
            onClick={abrirNovo}
            disabled={
              !dados ||
              dados
                .funcionariosElegiveis
                .length ===
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
            {dados?.resumo.ativos ??
              0}
          </p>
        </div>

        <div className={card}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t(
              "cards.revoked",
            )}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-600 dark:text-slate-300">
            {dados?.resumo.revogados ??
              0}
          </p>
        </div>

        <div className={card}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t(
              "cards.eligible",
            )}
          </p>

          <p className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400">
            {dados?.resumo.elegiveis ??
              0}
          </p>
        </div>
      </section>

      {carregando ? (
        <div className={card}>
          {t("loading")}
        </div>
      ) : null}

      {!carregando &&
      dados &&
      dados.operadores.length ===
        0 ? (
        <div className={`${card} py-10 text-center`}>
          <div className="text-4xl">
            {String.fromCodePoint(
              0x1f465,
            )}
          </div>

          <h2 className="mt-3 text-lg font-black">
            {t(
              "empty.title",
            )}
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            {t(
              "empty.description",
            )}
          </p>

          {podeGerenciar &&
          dados
            .funcionariosElegiveis
            .length >
            0 ? (
            <button
              type="button"
              onClick={abrirNovo}
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
      operadoresAtivos.length >
        0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-black">
            {t(
              "sections.active",
            )}
          </h2>

          <div className="grid gap-4 xl:grid-cols-2">
            {operadoresAtivos.map(
              (operador) => (
                <div
                  key={
                    operador.id
                  }
                  className={card}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black">
                          {
                            operador
                              .funcionario
                              .nome
                          }
                        </h3>

                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {t(
                            "status.active",
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {operador.usuario.email}
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {[
                          operador
                            .funcionario
                            .cargo,
                          operador
                            .funcionario
                            .setor,
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(" · ") ||
                          t(
                            "labels.noPosition",
                          )}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black">
                        {contarPermissoes(
                          operador,
                        )}
                        /10
                      </div>

                      <div className="text-xs text-slate-500">
                        {t(
                          "labels.permissions",
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {chavesPermissao.map(
                      (chave) =>
                        operador[
                          chave
                        ] ? (
                          <span
                            key={
                              chave
                            }
                            className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          >
                            {t(
                              `permissions.${chave}.short`,
                            )}
                          </span>
                        ) : null,
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t(
                        "labels.created",
                        {
                          date:
                            formatarData(
                              operador.criadoEm,
                            ),
                        },
                      )}
                    </p>

                    {podeGerenciar ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            abrirEdicao(
                              operador,
                            )
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          {t(
                            "actions.edit",
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setErro("");
                            setMotivoRevogacao("");
                            setOperadorRevogar(
                              operador,
                            );
                          }}
                          className="rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          {t(
                            "actions.revoke",
                          )}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      ) : null}

      {!carregando &&
      operadoresRevogados.length >
        0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-black">
            {t(
              "sections.revoked",
            )}
          </h2>

          <div className="grid gap-4 xl:grid-cols-2">
            {operadoresRevogados.map(
              (operador) => (
                <div
                  key={
                    operador.id
                  }
                  className={`${card} opacity-90`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black">
                          {
                            operador
                              .funcionario
                              .nome
                          }
                        </h3>

                        <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {t(
                            "status.revoked",
                          )}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {operador.usuario.email}
                      </p>

                      {operador.motivoRevogacao ? (
                        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                          <strong>
                            {t(
                              "labels.reason",
                            )}
                          </strong>{" "}
                          {
                            operador.motivoRevogacao
                          }
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t(
                        "labels.revokedAt",
                        {
                          date:
                            formatarData(
                              operador.revogadoEm,
                            ),
                        },
                      )}
                    </p>

                    {podeGerenciar ? (
                      <button
                        type="button"
                        onClick={() => {
                          setErro("");
                          setOperadorRestaurar(
                            operador,
                          );
                        }}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                      >
                        {t(
                          "actions.restore",
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      ) : null}

      {modalEdicao ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2 className="text-xl font-black">
                  {operadorEditando
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
              {!operadorEditando ? (
                <label className="block space-y-1">
                  <span className="text-sm font-black">
                    {t(
                      "modal.employee",
                    )}
                  </span>

                  <select
                    value={
                      funcionarioId
                    }
                    onChange={(e) =>
                      setFuncionarioId(
                        e.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">
                      {t(
                        "modal.selectEmployee",
                      )}
                    </option>

                    {dados
                      ?.funcionariosElegiveis
                      .map(
                        (
                          funcionario,
                        ) => (
                          <option
                            key={
                              funcionario.id
                            }
                            value={
                              funcionario.id
                            }
                          >
                            {
                              funcionario.nome
                            }
                            {" — "}
                            {
                              funcionario
                                .user
                                ?.email
                            }
                          </option>
                        ),
                      )}
                  </select>
                </label>
              ) : (
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                  <div className="font-black">
                    {
                      operadorEditando
                        .funcionario
                        .nome
                    }
                  </div>

                  <div className="text-sm text-slate-500">
                    {
                      operadorEditando
                        .usuario
                        .email
                    }
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-black">
                  {t(
                    "modal.permissionsTitle",
                  )}
                </h3>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t(
                    "modal.permissionsHelp",
                  )}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {chavesPermissao.map(
                  (chave) => (
                    <label
                      key={
                        chave
                      }
                      className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={
                          permissoes[
                            chave
                          ]
                        }
                        onChange={() =>
                          alterarPermissao(
                            chave,
                          )
                        }
                        className="mt-1 h-4 w-4"
                      />

                      <span>
                        <span className="block font-black">
                          {t(
                            `permissions.${chave}.title`,
                          )}
                        </span>

                        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                          {t(
                            `permissions.${chave}.description`,
                          )}
                        </span>
                      </span>
                    </label>
                  ),
                )}
              </div>

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
                    salvarOperador
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

      {operadorRevogar ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-xl font-black text-red-700 dark:text-red-300">
              {t(
                "revoke.title",
              )}
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t(
                "revoke.description",
                {
                  name:
                    operadorRevogar
                      .funcionario
                      .nome,
                },
              )}
            </p>

            <label className="mt-5 block space-y-1">
              <span className="text-sm font-black">
                {t(
                  "revoke.reason",
                )}
              </span>

              <textarea
                value={
                  motivoRevogacao
                }
                onChange={(e) =>
                  setMotivoRevogacao(
                    e.target.value,
                  )
                }
                rows={4}
                maxLength={1000}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"
                placeholder={t(
                  "revoke.placeholder",
                )}
              />
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setOperadorRevogar(
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
                  revogar
                }
                disabled={
                  salvando
                }
                className="rounded-xl bg-red-600 px-5 py-2.5 font-black text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t(
                  "actions.confirmRevoke",
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {operadorRestaurar ? (
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
                  name:
                    operadorRestaurar
                      .funcionario
                      .nome,
                },
              )}
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setOperadorRestaurar(
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
