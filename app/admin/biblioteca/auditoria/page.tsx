"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

type UsuarioAuditoria = {
  id: number;
  nome: string;
  email: string | null;
  role: string;
};

type RegistroAuditoria = {
  id: string;
  entidade: string;
  entidadeId: string | null;
  acao: string;
  descricao: string | null;
  dadosAnteriores: unknown;
  dadosPosteriores: unknown;
  metadados: unknown;
  ip: string | null;
  userAgent: string | null;
  criadoEm: string;
  usuarioId: number | null;
  usuario: UsuarioAuditoria | null;
};

type DadosAuditoria = {
  filtros: {
    inicio: string;
    fim: string;
    acao: string;
    entidade: string;
    usuarioId: number | null;
    busca: string;
    pagina: number;
    porPagina: number;
  };

  paginacao: {
    pagina: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
  };

  opcoes: {
    acoes: string[];

    entidades: Array<{
      entidade: string;
      total: number;
    }>;

    usuarios: UsuarioAuditoria[];
  };

  resumo: {
    total: number;
    porAcao: Record<string, number>;
  };

  registros: RegistroAuditoria[];
};

function hojeISO() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function dataInicialPadrao() {
  const data =
    new Date();

  data.setDate(
    data.getDate() - 29,
  );

  return data
    .toISOString()
    .slice(0, 10);
}

function jsonFormatado(
  valor: unknown,
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  try {
    return JSON.stringify(
      valor,
      null,
      2,
    );
  } catch {
    return String(
      valor,
    );
  }
}

export default function BibliotecaAuditoriaPage() {
  const t =
    useTranslations(
      "AdminLibraryAudit",
    );

  const locale =
    useLocale();

  const [
    inicio,
    setInicio,
  ] = useState(
    dataInicialPadrao,
  );

  const [
    fim,
    setFim,
  ] = useState(
    hojeISO,
  );

  const [
    acao,
    setAcao,
  ] = useState("");

  const [
    entidade,
    setEntidade,
  ] = useState("");

  const [
    usuarioId,
    setUsuarioId,
  ] = useState("");

  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    filtrosAplicados,
    setFiltrosAplicados,
  ] = useState({
    inicio:
      dataInicialPadrao(),

    fim:
      hojeISO(),

    acao: "",
    entidade: "",
    usuarioId: "",
    busca: "",
  });

  const [
    pagina,
    setPagina,
  ] = useState(1);

  const [
    dados,
    setDados,
  ] =
    useState<DadosAuditoria | null>(
      null,
    );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    selecionado,
    setSelecionado,
  ] =
    useState<RegistroAuditoria | null>(
      null,
    );

  const carregar =
    useCallback(
      async () => {
        try {
          setCarregando(
            true,
          );

          setErro("");

          const parametros =
            new URLSearchParams({
              inicio:
                filtrosAplicados.inicio,

              fim:
                filtrosAplicados.fim,

              pagina:
                String(
                  pagina,
                ),

              porPagina:
                "25",
            });

          if (
            filtrosAplicados.acao
          ) {
            parametros.set(
              "acao",
              filtrosAplicados.acao,
            );
          }

          if (
            filtrosAplicados.entidade
          ) {
            parametros.set(
              "entidade",
              filtrosAplicados.entidade,
            );
          }

          if (
            filtrosAplicados.usuarioId
          ) {
            parametros.set(
              "usuarioId",
              filtrosAplicados.usuarioId,
            );
          }

          if (
            filtrosAplicados.busca
          ) {
            parametros.set(
              "busca",
              filtrosAplicados.busca,
            );
          }

          const resposta =
            await fetch(
              `/api/admin/biblioteca/auditoria?${parametros.toString()}`,
              {
                credentials:
                  "include",

                cache:
                  "no-store",
              },
            );

          const json =
            await resposta.json();

          if (
            !resposta.ok
          ) {
            throw new Error(
              json?.error ||
                t(
                  "errors.load",
                ),
            );
          }

          setDados(
            json,
          );
        } catch (
          e: any
        ) {
          setDados(
            null,
          );

          setErro(
            e?.message ||
              t(
                "errors.load",
              ),
          );
        } finally {
          setCarregando(
            false,
          );
        }
      },
      [
        filtrosAplicados,
        pagina,
        t,
      ],
    );

  useEffect(
    () => {
      carregar();
    },
    [
      carregar,
    ],
  );

  function aplicarFiltros(
    evento: FormEvent,
  ) {
    evento.preventDefault();

    setPagina(1);

    setFiltrosAplicados({
      inicio,
      fim,
      acao,
      entidade,
      usuarioId,
      busca:
        busca.trim(),
    });
  }

  function limparFiltros() {
    const novoInicio =
      dataInicialPadrao();

    const novoFim =
      hojeISO();

    setInicio(
      novoInicio,
    );

    setFim(
      novoFim,
    );

    setAcao("");
    setEntidade("");
    setUsuarioId("");
    setBusca("");

    setPagina(1);

    setFiltrosAplicados({
      inicio:
        novoInicio,

      fim:
        novoFim,

      acao: "",
      entidade: "",
      usuarioId: "",
      busca: "",
    });
  }

  function formatarDataHora(
    valor: string,
  ) {
    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle:
          "short",

        timeStyle:
          "medium",
      },
    ).format(
      new Date(
        valor,
      ),
    );
  }

  function rotuloAcao(
    valor: string,
  ) {
    try {
      return t(
        `actions.${valor}`,
      );
    } catch {
      return valor;
    }
  }

  function rotuloEntidade(
    valor: string,
  ) {
    const mapa: Record<string, string> = {
      BibliotecaItem: "item",
      BibliotecaExemplar: "copy",
      BibliotecaEmprestimo: "loan",
      BibliotecaReserva: "reservation",
      BibliotecaRenovacao: "renewal",
      BibliotecaManutencaoExemplar: "maintenance",
      BibliotecaArquivo: "file",
      BibliotecaConfiguracao: "configuration",
      BibliotecaOperador: "operator",
      ModuloAdicionalInstituicao: "module",
    };

    const chave =
      mapa[valor];

    if (!chave) {
      return valor;
    }

    try {
      return t(
        `entities.${chave}`,
      );
    } catch {
      return valor;
    }
  }

  function descricaoLocalizada(
    registro: RegistroAuditoria,
  ) {
    if (!registro.descricao) {
      return "-";
    }

    const mapa: Record<string, string> = {
      "Upload de arquivo autorizado para o acervo da Biblioteca Virtual.":
        "fileUploadAuthorized",

      "Upload do arquivo concluído e armazenamento contabilizado.":
        "fileUploadCompleted",

      "Arquivo definido como principal do item da Biblioteca Virtual.":
        "fileSetPrincipal",

      "Arquivo definido automaticamente como principal por não existir outro arquivo principal ativo no item.":
        "fileAutoPrincipalNoOther",

      "Arquivo promovido automaticamente a principal após exclusão do arquivo principal anterior.":
        "fileAutoPrincipalAfterDelete",

      "Arquivo removido do armazenamento privado da Biblioteca Virtual.":
        "fileRemoved",

      "Configurações da Biblioteca atualizadas.":
        "configurationUpdated",

      "Empréstimo de exemplar registrado na Biblioteca Virtual.":
        "loanCreated",

      "Empréstimo renovado na Biblioteca Virtual.":
        "loanRenewed",

      "Devolução de exemplar registrada na Biblioteca Virtual.":
        "loanReturned",

      "Exemplar cadastrado no acervo da Biblioteca Virtual.":
        "copyCreated",

      "Exemplar atualizado na Biblioteca Virtual.":
        "copyUpdated",

      "Baixa de exemplar realizada na Biblioteca Virtual.":
        "copyWithdrawn",

      "Item cadastrado no acervo como rascunho.":
        "itemCreatedDraft",

      "Dados bibliográficos e de acesso do item foram atualizados.":
        "itemUpdated",

      "Exemplar enviado para manutenção na Biblioteca Virtual.":
        "maintenanceStarted",

      "Manutenção concluída e exemplar liberado para circulação.":
        "maintenanceCompleted",

      "Manutenção de exemplar cancelada na Biblioteca Virtual.":
        "maintenanceCanceled",

      "Reserva expirada automaticamente.":
        "reservationExpired",

      "Reserva adicionada à fila da Biblioteca Virtual.":
        "reservationQueued",

      "Reserva disponibilizada automaticamente após expiração da reserva anterior.":
        "reservationAvailableAfterExpiration",

      "Reserva disponibilizada imediatamente na Biblioteca Virtual.":
        "reservationAvailableImmediately",

      "Reserva disponibilizada automaticamente após cancelamento da reserva anterior.":
        "reservationAvailableAfterCancellation",

      "Reserva disponibilizada automaticamente após devolução de exemplar.":
        "reservationAvailableAfterReturn",

      "Reserva cancelada na Biblioteca Virtual.":
        "reservationCanceled",

      "Biblioteca Virtual concedida à IBE como cortesia permanente, sem cobrança.":
        "moduleGrantedCourtesy",
    };

    const chave =
      mapa[
        registro.descricao
      ];

    if (!chave) {
      return registro.descricao;
    }

    try {
      return t(
        `descriptions.${chave}`,
      );
    } catch {
      return registro.descricao;
    }
  }

  function classeAcao(
    valor: string,
  ) {
    if (
      [
        "EXCLUIR",
        "BAIXAR",
        "REVOGAR_ACESSO",
        "CANCELAR",
        "CANCELAR_MANUTENCAO",
      ].includes(
        valor,
      )
    ) {
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
    }

    if (
      [
        "CRIAR",
        "PUBLICAR",
        "EMPRESTAR",
        "RESERVAR",
        "CONCEDER_ACESSO",
      ].includes(
        valor,
      )
    ) {
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    }

    if (
      [
        "ATUALIZAR",
        "CONFIGURAR",
        "RENOVAR",
        "DEVOLVER",
        "RESTAURAR",
      ].includes(
        valor,
      )
    ) {
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300";
    }

    return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

  const labelClass =
    "text-sm font-bold text-slate-700 dark:text-slate-200";

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-black">
          {String.fromCodePoint(
            0x1f6e1,
          )}{" "}
          {t(
            "title",
          )}
        </h1>

        <p className="mt-1 max-w-4xl text-sm text-slate-600 dark:text-slate-400">
          {t(
            "subtitle",
          )}
        </p>
      </div>

      <form
        onSubmit={
          aplicarFiltros
        }
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-4"
      >
        <label className="space-y-1">
          <span className={labelClass}>
            {t(
              "filters.start",
            )}
          </span>

          <input
            type="date"
            value={
              inicio
            }
            onChange={(
              e,
            ) =>
              setInicio(
                e.target.value,
              )
            }
            className={inputClass}
          />
        </label>

        <label className="space-y-1">
          <span className={labelClass}>
            {t(
              "filters.end",
            )}
          </span>

          <input
            type="date"
            value={
              fim
            }
            onChange={(
              e,
            ) =>
              setFim(
                e.target.value,
              )
            }
            className={inputClass}
          />
        </label>

        <label className="space-y-1">
          <span className={labelClass}>
            {t(
              "filters.action",
            )}
          </span>

          <select
            value={
              acao
            }
            onChange={(
              e,
            ) =>
              setAcao(
                e.target.value,
              )
            }
            className={inputClass}
          >
            <option value="">
              {t(
                "filters.allActions",
              )}
            </option>

            {dados
              ?.opcoes
              .acoes
              .map(
                (
                  item,
                ) => (
                  <option
                    key={
                      item
                    }
                    value={
                      item
                    }
                  >
                    {rotuloAcao(
                      item,
                    )}
                  </option>
                ),
              )}
          </select>
        </label>

        <label className="space-y-1">
          <span className={labelClass}>
            {t(
              "filters.entity",
            )}
          </span>

          <select
            value={
              entidade
            }
            onChange={(
              e,
            ) =>
              setEntidade(
                e.target.value,
              )
            }
            className={inputClass}
          >
            <option value="">
              {t(
                "filters.allEntities",
              )}
            </option>

            {dados
              ?.opcoes
              .entidades
              .map(
                (
                  item,
                ) => (
                  <option
                    key={
                      item.entidade
                    }
                    value={
                      item.entidade
                    }
                  >
                    {item.entidade}
                    {" "}
                    ({item.total})
                  </option>
                ),
              )}
          </select>
        </label>

        <label className="space-y-1">
          <span className={labelClass}>
            {t(
              "filters.user",
            )}
          </span>

          <select
            value={
              usuarioId
            }
            onChange={(
              e,
            ) =>
              setUsuarioId(
                e.target.value,
              )
            }
            className={inputClass}
          >
            <option value="">
              {t(
                "filters.allUsers",
              )}
            </option>

            {dados
              ?.opcoes
              .usuarios
              .map(
                (
                  item,
                ) => (
                  <option
                    key={
                      item.id
                    }
                    value={
                      String(
                        item.id,
                      )
                    }
                  >
                    {item.nome}
                  </option>
                ),
              )}
          </select>
        </label>

        <label className="space-y-1 lg:col-span-2">
          <span className={labelClass}>
            {t(
              "filters.search",
            )}
          </span>

          <input
            type="search"
            value={
              busca
            }
            onChange={(
              e,
            ) =>
              setBusca(
                e.target.value,
              )
            }
            placeholder={t(
              "filters.searchPlaceholder",
            )}
            className={inputClass}
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="min-h-10 flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700"
          >
            {t(
              "filters.apply",
            )}
          </button>

          <button
            type="button"
            onClick={
              limparFiltros
            }
            className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t(
              "filters.clear",
            )}
          </button>
        </div>
      </form>

      {erro ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {erro}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t(
              "cards.total",
            )}
          </p>

          <p className="mt-2 text-3xl font-black">
            {dados
              ?.paginacao
              .total ??
              0}
          </p>
        </div>

        {[
          "ATUALIZAR",
          "EMPRESTAR",
          "DEVOLVER",
        ].map(
          (
            item,
          ) => (
            <div
              key={
                item
              }
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {rotuloAcao(
                  item,
                )}
              </p>

              <p className="mt-2 text-3xl font-black">
                {dados
                  ?.resumo
                  .porAcao?.[
                    item
                  ] ??
                  0}
              </p>
            </div>
          ),
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="font-black">
            {t(
              "table.title",
            )}
          </h2>
        </div>

        {carregando ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {t(
              "loading",
            )}
          </div>
        ) : null}

        {!carregando &&
        dados &&
        dados.registros.length ===
          0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {t(
              "empty",
            )}
          </div>
        ) : null}

        {!carregando &&
        dados &&
        dados.registros.length >
          0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950/60">
                <tr>
                  <th className="px-4 py-3 text-left font-black">
                    {t(
                      "table.date",
                    )}
                  </th>

                  <th className="px-4 py-3 text-left font-black">
                    {t(
                      "table.action",
                    )}
                  </th>

                  <th className="px-4 py-3 text-left font-black">
                    {t(
                      "table.entity",
                    )}
                  </th>

                  <th className="px-4 py-3 text-left font-black">
                    {t(
                      "table.user",
                    )}
                  </th>

                  <th className="px-4 py-3 text-left font-black">
                    {t(
                      "table.description",
                    )}
                  </th>

                  <th className="px-4 py-3 text-right font-black">
                    {t(
                      "table.details",
                    )}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dados.registros.map(
                  (
                    registro,
                  ) => (
                    <tr
                      key={
                        registro.id
                      }
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatarDataHora(
                          registro.criadoEm,
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${classeAcao(
                            registro.acao,
                          )}`}
                        >
                          {rotuloAcao(
                            registro.acao,
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold">
                          {rotuloEntidade(
                            registro.entidade,
                          )}
                        </div>

                        {registro.entidadeId ? (
                          <div className="text-xs text-slate-500">
                            #
                            {
                              registro.entidadeId
                            }
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3">
                        {registro.usuario ? (
                          <>
                            <div className="font-bold">
                              {
                                registro.usuario.nome
                              }
                            </div>

                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {
                                registro.usuario.email
                              }
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-500">
                            {t(
                              "system",
                            )}
                          </span>
                        )}
                      </td>

                      <td className="max-w-md px-4 py-3 text-slate-600 dark:text-slate-300">
                        {descricaoLocalizada(
                          registro,
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSelecionado(
                              registro,
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {t(
                            "table.view",
                          )}
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {dados &&
        dados.paginacao.totalPaginas >
          1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t(
                "pagination.page",
                {
                  current:
                    dados
                      .paginacao
                      .pagina,

                  total:
                    dados
                      .paginacao
                      .totalPaginas,

                  records:
                    dados
                      .paginacao
                      .total,
                },
              )}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  pagina <= 1 ||
                  carregando
                }
                onClick={() =>
                  setPagina(
                    (
                      atual,
                    ) =>
                      Math.max(
                        1,
                        atual -
                          1,
                      ),
                  )
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
              >
                {t(
                  "pagination.previous",
                )}
              </button>

              <button
                type="button"
                disabled={
                  pagina >=
                    dados
                      .paginacao
                      .totalPaginas ||
                  carregando
                }
                onClick={() =>
                  setPagina(
                    (
                      atual,
                    ) =>
                      atual +
                      1,
                  )
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700"
              >
                {t(
                  "pagination.next",
                )}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {selecionado ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="biblioteca-auditoria-detalhe"
          onMouseDown={(
            e,
          ) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setSelecionado(
                null,
              );
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2
                  id="biblioteca-auditoria-detalhe"
                  className="text-xl font-black"
                >
                  {t(
                    "details.title",
                  )}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {formatarDataHora(
                    selecionado.criadoEm,
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelecionado(
                    null,
                  )
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-black dark:border-slate-700"
              >
                {t(
                  "details.close",
                )}
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    {t(
                      "details.action",
                    )}
                  </p>

                  <p className="mt-1 font-black">
                    {rotuloAcao(
                      selecionado.acao,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    {t(
                      "details.entity",
                    )}
                  </p>

                  <p className="mt-1 font-black">
                    {rotuloEntidade(
                      selecionado.entidade,
                    )}
                    {selecionado.entidadeId
                      ? ` #${selecionado.entidadeId}`
                      : ""}
                  </p>

                  <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {selecionado.entidade}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    {t(
                      "details.user",
                    )}
                  </p>

                  <p className="mt-1 font-black">
                    {selecionado.usuario
                      ?.nome ||
                      t(
                        "system",
                      )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    IP
                  </p>

                  <p className="mt-1 break-all font-mono text-sm">
                    {selecionado.ip ||
                      "-"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-500">
                  {t(
                    "details.description",
                  )}
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {selecionado.descricao ||
                    "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-500">
                  {t(
                    "details.userAgent",
                  )}
                </p>

                <p className="mt-1 break-all font-mono text-xs text-slate-600 dark:text-slate-300">
                  {selecionado.userAgent ||
                    "-"}
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-black">
                    {t(
                      "details.before",
                    )}
                  </p>

                  <pre className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                    {jsonFormatado(
                      selecionado.dadosAnteriores,
                    ) ||
                      t(
                        "details.noData",
                      )}
                  </pre>
                </div>

                <div>
                  <p className="mb-2 text-sm font-black">
                    {t(
                      "details.after",
                    )}
                  </p>

                  <pre className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                    {jsonFormatado(
                      selecionado.dadosPosteriores,
                    ) ||
                      t(
                        "details.noData",
                      )}
                  </pre>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-black">
                  {t(
                    "details.metadata",
                  )}
                </p>

                <pre className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  {jsonFormatado(
                    selecionado.metadados,
                  ) ||
                    t(
                      "details.noData",
                    )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
