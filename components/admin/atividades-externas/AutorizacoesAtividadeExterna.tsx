"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

type StatusAutorizacao =
  | "PENDENTE"
  | "AUTORIZADO"
  | "NAO_AUTORIZADO"
  | "REVOGADO"
  | "DISPENSADO"
  | "EXPIRADO";

type MetodoAutorizacao =
  | "PORTAL"
  | "LINK_SEGURO"
  | "PRESENCIAL"
  | "IMPORTADO"
  | "ADMINISTRATIVO"
  | "OUTRO";

type Autorizacao = {
  id: number;

  status: StatusAutorizacao;

  metodo?: MetodoAutorizacao | null;

  responsavelNomeSnapshot?: string | null;

  responsavelEmailSnapshot?: string | null;

  responsavelTelefoneSnapshot?: string | null;

  responsavelParentescoSnapshot?: string | null;

  versaoTermo?: string | null;

  observacao?: string | null;

  respondidaEm?: string | null;

  revogadaEm?: string | null;

  createdAt: string;
  updatedAt: string;
};

type Participante = {
  id: number;

  alunoId: number;

  statusParticipacao: string;

  aluno: {
    id: number;

    nome: string;

    nomeSocial?: string | null;

    matricula?: string | null;

    fotoPerfil?: string | null;
  };

  autorizacaoAtual:
    | Autorizacao
    | null;

  historico: Autorizacao[];
};

type Resumo = {
  total: number;
  pendentes: number;
  autorizados: number;
  naoAutorizados: number;
  dispensados: number;
};

type RespostaApi = {
  ok?: boolean;

  exigeAutorizacaoResponsavel?: boolean;

  podeGerenciar?: boolean;

  resumo?: Resumo;

  participantes?: Participante[];

  error?: string;
  message?: string;
  detalhe?: string;
};

type Props = {
  atividadeId: number;

  onAutorizacoesAlteradas?:
    () =>
      | void
      | Promise<void>;
};

type Formulario = {
  status: StatusAutorizacao;

  metodo: MetodoAutorizacao;

  responsavelNome: string;

  responsavelParentesco: string;

  responsavelEmail: string;

  responsavelTelefone: string;

  versaoTermo: string;

  observacao: string;
};

const FORMULARIO_VAZIO: Formulario = {
  status: "AUTORIZADO",

  metodo: "ADMINISTRATIVO",

  responsavelNome: "",

  responsavelParentesco:
    "",

  responsavelEmail: "",

  responsavelTelefone:
    "",

  versaoTermo: "",

  observacao: "",
};

const STATUS: StatusAutorizacao[] =
  [
    "PENDENTE",
    "AUTORIZADO",
    "NAO_AUTORIZADO",
    "REVOGADO",
    "DISPENSADO",
    "EXPIRADO",
  ];

const METODOS: MetodoAutorizacao[] =
  [
    "ADMINISTRATIVO",
    "PRESENCIAL",
    "PORTAL",
    "LINK_SEGURO",
    "IMPORTADO",
    "OUTRO",
  ];

function nomeAluno(
  participante: Participante
) {
  return (
    participante.aluno.nomeSocial?.trim() ||
    participante.aluno.nome.trim()
  );
}

function iniciais(
  nome: string
) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (parte) =>
        parte
          .charAt(0)
          .toUpperCase()
    )
    .join("");
}

export default function AutorizacoesAtividadeExterna({
  atividadeId,
  onAutorizacoesAlteradas,
}: Props) {
  const t =
    useTranslations(
      "AdminExternalActivityAuthorizations"
    );

  const locale =
    useLocale();

  const [
    participantes,
    setParticipantes,
  ] =
    useState<
      Participante[]
    >([]);

  const [
    resumo,
    setResumo,
  ] =
    useState<Resumo>({
      total: 0,
      pendentes: 0,
      autorizados: 0,
      naoAutorizados: 0,
      dispensados: 0,
    });

  const [
    exigeAutorizacao,
    setExigeAutorizacao,
  ] =
    useState(true);

  const [
    podeGerenciar,
    setPodeGerenciar,
  ] =
    useState(false);

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
    participanteAberto,
    setParticipanteAberto,
  ] =
    useState<
      number | null
    >(null);

  const [
    formulario,
    setFormulario,
  ] =
    useState<Formulario>({
      ...FORMULARIO_VAZIO,
    });

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await fetch(
          `/api/admin/atividades-externas/${atividadeId}/autorizacoes`,
          {
            credentials:
              "include",

            cache:
              "no-store",
          }
        );

      const dados:
        RespostaApi =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.message ||
            dados.detalhe ||
            t("loadError")
        );
      }

      setParticipantes(
        Array.isArray(
          dados.participantes
        )
          ? dados.participantes
          : []
      );

      setResumo(
        dados.resumo || {
          total: 0,
          pendentes: 0,
          autorizados: 0,
          naoAutorizados:
            0,
          dispensados: 0,
        }
      );

      setExigeAutorizacao(
        dados
          .exigeAutorizacaoResponsavel !==
          false
      );

      setPodeGerenciar(
        dados.podeGerenciar ===
          true
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t("loadError")
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atividadeId]);

  function formatarData(
    valor?: string | null
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
        dateStyle:
          "medium",

        timeStyle:
          "short",
      }
    ).format(data);
  }

  function abrirFormulario(
    participante: Participante
  ) {
    const atual =
      participante
        .autorizacaoAtual;

    setParticipanteAberto(
      participante.id
    );

    setErro("");
    setSucesso("");

    setFormulario({
      status:
        atual?.status ===
          "AUTORIZADO"
          ? "AUTORIZADO"
          : "AUTORIZADO",

      metodo:
        atual?.metodo ||
        "ADMINISTRATIVO",

      responsavelNome:
        atual
          ?.responsavelNomeSnapshot ||
        "",

      responsavelParentesco:
        atual
          ?.responsavelParentescoSnapshot ||
        "",

      responsavelEmail:
        atual
          ?.responsavelEmailSnapshot ||
        "",

      responsavelTelefone:
        atual
          ?.responsavelTelefoneSnapshot ||
        "",

      versaoTermo:
        atual?.versaoTermo ||
        "",

      observacao:
        "",
    });
  }

  function fecharFormulario() {
    setParticipanteAberto(
      null
    );

    setFormulario({
      ...FORMULARIO_VAZIO,
    });
  }

  async function salvar(
    participanteId: number
  ) {
    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const resposta =
        await fetch(
          `/api/admin/atividades-externas/${atividadeId}/autorizacoes`,
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              participanteId,

              status:
                formulario.status,

              metodo:
                formulario.metodo,

              responsavelNome:
                formulario
                  .responsavelNome,

              responsavelParentesco:
                formulario
                  .responsavelParentesco,

              responsavelEmail:
                formulario
                  .responsavelEmail,

              responsavelTelefone:
                formulario
                  .responsavelTelefone,

              versaoTermo:
                formulario
                  .versaoTermo,

              observacao:
                formulario
                  .observacao,
            }),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.message ||
            dados?.detalhe ||
            t(
              "messages.saveError"
            )
        );
      }

      setSucesso(
        t(
          "messages.saved"
        )
      );

      fecharFormulario();

      await carregar();

      await onAutorizacoesAlteradas?.();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t(
              "messages.saveError"
            )
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <section className="phanyx-autorizacoes-atividade py-12 text-center">

        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />

        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {t("loading")}
        </p>

      </section>
    );
  }

  return (
    <div className="phanyx-autorizacoes-atividade space-y-6">

      <div>
        <h2 className="text-xl font-black text-slate-950 dark:text-white">
          ✍️ {t("title")}
        </h2>

        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t(
            "description"
          )}
        </p>
      </div>

      {erro ? (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {erro}
        </div>
      ) : null}

      {sucesso ? (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          {sucesso}
        </div>
      ) : null}

      {!exigeAutorizacao ? (
        <section className="phanyx-autorizacao-aviso rounded-3xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30">

          <h3 className="font-black text-blue-900 dark:text-blue-100">
            {t(
              "noAuthorizationRequired.title"
            )}
          </h3>

          <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
            {t(
              "noAuthorizationRequired.description"
            )}
          </p>

        </section>
      ) : null}

      {/* RESUMO */}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">

        <ResumoCard
          valor={
            resumo.total
          }
          titulo={t(
            "summary.total"
          )}
          tipo="neutral"
        />

        <ResumoCard
          valor={
            resumo.pendentes
          }
          titulo={t(
            "summary.pending"
          )}
          tipo="amber"
        />

        <ResumoCard
          valor={
            resumo.autorizados
          }
          titulo={t(
            "summary.authorized"
          )}
          tipo="green"
        />

        <ResumoCard
          valor={
            resumo.naoAutorizados
          }
          titulo={t(
            "summary.denied"
          )}
          tipo="red"
        />

        <ResumoCard
          valor={
            resumo.dispensados
          }
          titulo={t(
            "summary.waived"
          )}
          tipo="blue"
        />

      </section>

      {participantes.length ===
      0 ? (
        <section className="phanyx-autorizacao-card rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">

          <div className="text-4xl">
            ✍️
          </div>

          <h3 className="mt-4 font-black text-slate-950 dark:text-white">
            {t(
              "empty.title"
            )}
          </h3>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {t(
              "empty.description"
            )}
          </p>

        </section>
      ) : (
        <div className="space-y-4">

          {participantes.map(
            (
              participante
            ) => {
              const nome =
                nomeAluno(
                  participante
                );

              const atual =
                participante
                  .autorizacaoAtual;

              const statusAtual:
                StatusAutorizacao =
                atual?.status ||
                "PENDENTE";

              const aberto =
                participanteAberto ===
                participante.id;

              return (
                <section
                  key={
                    participante.id
                  }
                  className="phanyx-autorizacao-card overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                >

                  <div className="p-5 sm:p-6">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      <div className="flex min-w-0 gap-4">

                        <AvatarAluno
                          nome={
                            nome
                          }
                          fotoPerfil={
                            participante
                              .aluno
                              .fotoPerfil
                          }
                        />

                        <div className="min-w-0">

                          <h3 className="text-base font-black text-slate-950 dark:text-white">
                            {nome}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t(
                              "participant.registration"
                            )}
                            :{" "}
                            {participante
                              .aluno
                              .matricula?.trim() ||
                              t(
                                "participant.noRegistration"
                              )}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">

                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              {t(
                                "participant.currentStatus"
                              )}
                              :
                            </span>

                            <StatusAutorizacaoTag
                              status={
                                statusAtual
                              }
                              texto={t(
                                `status.${statusAtual}`
                              )}
                            />

                          </div>

                          {!atual ? (
                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                              {t(
                                "participant.noRecord"
                              )}
                            </p>
                          ) : null}

                        </div>
                      </div>

                      {podeGerenciar ? (
                        <button
                          type="button"
                          onClick={() =>
                            aberto
                              ? fecharFormulario()
                              : abrirFormulario(
                                  participante
                                )
                          }
                          className={
  aberto
    ? "phanyx-autorizacao-cancelar rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    : "phanyx-autorizacao-botao rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-800"
}
                        >
                          {aberto
                            ? t(
                                "actions.cancel"
                              )
                            : t(
                                "actions.register"
                              )}
                        </button>
                      ) : null}

                    </div>

                    {/* FORMULÁRIO */}

                    {aberto ? (
                      <div className="phanyx-autorizacao-form mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800 sm:p-6">

                        <div>
                          <h4 className="text-base font-black text-slate-950 dark:text-white">
                            {t(
                              "form.title"
                            )}
                          </h4>

                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {t(
                              "form.description"
                            )}
                          </p>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">

                          <Campo>
                            <Rotulo>
                              {t(
                                "form.status"
                              )}
                            </Rotulo>

                            <select
                              value={
                                formulario.status
                              }
                              onChange={(
                                e
                              ) =>
                                setFormulario(
                                  (
                                    atual
                                  ) => ({
                                    ...atual,

                                    status:
                                      e
                                        .target
                                        .value as StatusAutorizacao,
                                  })
                                )
                              }
                              className="phanyx-autorizacao-input"
                            >
                              {STATUS.map(
                                (
                                  status
                                ) => (
                                  <option
                                    key={
                                      status
                                    }
                                    value={
                                      status
                                    }
                                  >
                                    {t(
                                      `status.${status}`
                                    )}
                                  </option>
                                )
                              )}
                            </select>
                          </Campo>

                          <Campo>
                            <Rotulo>
                              {t(
                                "form.method"
                              )}
                            </Rotulo>

                            <select
                              value={
                                formulario.metodo
                              }
                              onChange={(
                                e
                              ) =>
                                setFormulario(
                                  (
                                    atual
                                  ) => ({
                                    ...atual,

                                    metodo:
                                      e
                                        .target
                                        .value as MetodoAutorizacao,
                                  })
                                )
                              }
                              className="phanyx-autorizacao-input"
                            >
                              {METODOS.map(
                                (
                                  metodo
                                ) => (
                                  <option
                                    key={
                                      metodo
                                    }
                                    value={
                                      metodo
                                    }
                                  >
                                    {t(
                                      `methods.${metodo}`
                                    )}
                                  </option>
                                )
                              )}
                            </select>
                          </Campo>

                          <Campo>
                            <Rotulo>
                              {t(
                                "form.guardianName"
                              )}
                            </Rotulo>

                            <input
                              value={
                                formulario.responsavelNome
                              }
                              onChange={(
                                e
                              ) =>
                                setFormulario(
                                  (
                                    atual
                                  ) => ({
                                    ...atual,

                                    responsavelNome:
                                      e
                                        .target
                                        .value,
                                  })
                                )
                              }
                              placeholder={t(
                                "form.guardianNamePlaceholder"
                              )}
                              className="phanyx-autorizacao-input"
                            />
                          </Campo>

                          <Campo>
                            <Rotulo>
                              {t(
                                "form.guardianRelationship"
                              )}
                            </Rotulo>

                            <input
                              value={
                                formulario.responsavelParentesco
                              }
                              onChange={(
                                e
                              ) =>
                                setFormulario(
                                  (
                                    atual
                                  ) => ({
                                    ...atual,

                                    responsavelParentesco:
                                      e
                                        .target
                                        .value,
                                  })
                                )
                              }
                              placeholder={t(
                                "form.relationshipPlaceholder"
                              )}
                              className="phanyx-autorizacao-input"
                            />
                          </Campo>

                          <Campo>
                            <Rotulo>
                              {t(
                                "form.guardianEmail"
                              )}
                            </Rotulo>

                            <input
                              type="email"
                              value={
                                formulario.responsavelEmail
                              }
                              onChange={(
                                e
                              ) =>
                                setFormulario(
                                  (
                                    atual
                                  ) => ({
                                    ...atual,

                                    responsavelEmail:
                                      e
                                        .target
                                        .value,
                                  })
                                )
                              }
                              placeholder={t(
                                "form.emailPlaceholder"
                              )}
                              className="phanyx-autorizacao-input"
                            />
                          </Campo>

                          <Campo>
                            <Rotulo>
                              {t(
                                "form.guardianPhone"
                              )}
                            </Rotulo>

                            <input
                              value={
                                formulario.responsavelTelefone
                              }
                              onChange={(
                                e
                              ) =>
                                setFormulario(
                                  (
                                    atual
                                  ) => ({
                                    ...atual,

                                    responsavelTelefone:
                                      e
                                        .target
                                        .value,
                                  })
                                )
                              }
                              placeholder={t(
                                "form.phonePlaceholder"
                              )}
                              className="phanyx-autorizacao-input"
                            />
                          </Campo>

                          <Campo>
                            <Rotulo>
                              {t(
                                "form.termVersion"
                              )}
                            </Rotulo>

                            <input
                              value={
                                formulario.versaoTermo
                              }
                              onChange={(
                                e
                              ) =>
                                setFormulario(
                                  (
                                    atual
                                  ) => ({
                                    ...atual,

                                    versaoTermo:
                                      e
                                        .target
                                        .value,
                                  })
                                )
                              }
                              placeholder={t(
                                "form.termVersionPlaceholder"
                              )}
                              className="phanyx-autorizacao-input"
                            />
                          </Campo>

                        </div>

                        <div className="mt-4">
                          <Rotulo>
                            {t(
                              "form.observation"
                            )}
                          </Rotulo>

                          <textarea
                            rows={4}
                            value={
                              formulario.observacao
                            }
                            onChange={(
                              e
                            ) =>
                              setFormulario(
                                (
                                  atual
                                ) => ({
                                  ...atual,

                                  observacao:
                                    e
                                      .target
                                      .value,
                                })
                              )
                            }
                            placeholder={t(
                              "form.observationPlaceholder"
                            )}
                            className="phanyx-autorizacao-input resize-y"
                          />
                        </div>

                        <div className="mt-5 flex justify-end">

                          <button
                            type="button"
                            disabled={
                              salvando
                            }
                            onClick={() =>
                              void salvar(
                                participante.id
                              )
                            }
                            className="phanyx-autorizacao-botao rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
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
                      </div>
                    ) : null}

                    {/* HISTÓRICO */}

                    <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">

                      <h4 className="text-sm font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">
                        {t(
                          "participant.history"
                        )}
                      </h4>

                      {participante
                        .historico
                        .length ===
                      0 ? (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                          {t(
                            "participant.noHistory"
                          )}
                        </p>
                      ) : (
                        <div className="mt-4 space-y-3">

                          {participante.historico.map(
                            (
                              registro
                            ) => (
                              <article
                                key={
                                  registro.id
                                }
                                className="phanyx-autorizacao-historico rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                              >

                                <div className="flex flex-wrap items-center justify-between gap-3">

                                  <StatusAutorizacaoTag
                                    status={
                                      registro.status
                                    }
                                    texto={t(
                                      `status.${registro.status}`
                                    )}
                                  />

                                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {t(
                                      "history.registeredAt"
                                    )}
                                    :{" "}
                                    {formatarData(
                                      registro.createdAt
                                    )}
                                  </span>

                                </div>

                                <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">

                                  {registro.responsavelNomeSnapshot ? (
                                    <p className="text-slate-700 dark:text-slate-200">
                                      <strong>
                                        {t(
                                          "history.guardian"
                                        )}
                                        :
                                      </strong>{" "}
                                      {
                                        registro.responsavelNomeSnapshot
                                      }
                                    </p>
                                  ) : null}

                                  {registro.metodo ? (
                                    <p className="text-slate-700 dark:text-slate-200">
                                      <strong>
                                        {t(
                                          "history.method"
                                        )}
                                        :
                                      </strong>{" "}
                                      {t(
                                        `methods.${registro.metodo}`
                                      )}
                                    </p>
                                  ) : null}

                                </div>

                                {registro.observacao ? (
                                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                                    <strong>
                                      {t(
                                        "history.observation"
                                      )}
                                      :
                                    </strong>{" "}
                                    {
                                      registro.observacao
                                    }
                                  </p>
                                ) : null}

                              </article>
                            )
                          )}

                        </div>
                      )}

                    </div>
                  </div>
                </section>
              );
            }
          )}

        </div>
      )}
    </div>
  );
}

function ResumoCard({
  valor,
  titulo,
  tipo,
}: {
  valor: number;

  titulo: string;

  tipo:
    | "neutral"
    | "amber"
    | "green"
    | "red"
    | "blue";
}) {
  return (
    <article
      data-tipo={tipo}
      className="phanyx-autorizacao-resumo rounded-3xl border border-slate-200 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-900"
    >

      <strong className="block text-2xl font-black text-slate-950 dark:text-white">
        {valor}
      </strong>

      <span className="mt-1 block text-xs font-bold text-slate-500 dark:text-slate-400">
        {titulo}
      </span>

    </article>
  );
}

function StatusAutorizacaoTag({
  status,
  texto,
}: {
  status: StatusAutorizacao;
  texto: string;
}) {
  return (
    <span
      data-status={status}
      className="phanyx-autorizacao-status inline-flex rounded-full border px-3 py-1 text-xs font-black"
    >
      {texto}
    </span>
  );
}

function AvatarAluno({
  nome,
  fotoPerfil,
}: {
  nome: string;

  fotoPerfil?:
    | string
    | null;
}) {
  return (
    <div className="h-12 w-12 flex-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">

      {fotoPerfil ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fotoPerfil}
          alt={nome}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-black text-slate-600 dark:text-slate-200">
          {iniciais(nome)}
        </div>
      )}

    </div>
  );
}

function Campo({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {children}
    </div>
  );
}

function Rotulo({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
      {children}
    </label>
  );
}