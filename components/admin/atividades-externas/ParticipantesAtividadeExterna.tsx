"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useTranslations } from "next-intl";

type TurmaResumo = {
  id: number;
  nome: string;
  codigo?: string | null;
};

type AlunoDisponivel = {
  alunoId: number;
  nome: string;
  nomeSocial?: string | null;
  matricula?: string | null;
  fotoPerfil?: string | null;
  turmas: TurmaResumo[];
};

type Participante = {
  id: number;
  alunoId: number;

  origem:
    | "TURMA"
    | "MANUAL"
    | "IMPORTACAO";

  statusParticipacao:
    | "CONVIDADO"
    | "AGUARDANDO_AUTORIZACAO"
    | "CONFIRMADO"
    | "RECUSADO"
    | "CANCELADO";

  statusPresenca:
    | "NAO_REGISTRADA"
    | "PRESENTE"
    | "AUSENTE"
    | "SAIDA_ANTECIPADA";

  statusPagamento:
    | "NAO_APLICAVEL"
    | "PENDENTE"
    | "PARCIAL"
    | "PAGO"
    | "ISENTO"
    | "REEMBOLSADO"
    | "CANCELADO";

  grupoNome?: string | null;
  observacao?: string | null;

  aluno: {
    id: number;
    nome: string;
    nomeSocial?: string | null;
    matricula?: string | null;
    fotoPerfil?: string | null;
    statusAluno?: string;
    poloId?: number | null;
  };
};

type RespostaParticipantes = {
  ok?: boolean;
  podeGerenciar?: boolean;

  turmas?: TurmaResumo[];

  participantes?: Participante[];

  disponiveis?: AlunoDisponivel[];

  error?: string;
  detalhe?: string;
  message?: string;
};

type Props = {
  atividadeId: number;

  onParticipantesAlterados?:
    () =>
      | void
      | Promise<void>;
};

function normalizarBusca(
  valor: string
) {
  return valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLocaleLowerCase()
    .trim();
}

function nomeAluno(
  aluno: {
    nome: string;
    nomeSocial?: string | null;
  }
) {
  return (
    aluno.nomeSocial?.trim() ||
    aluno.nome.trim()
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

export default function ParticipantesAtividadeExterna({
  atividadeId,
  onParticipantesAlterados,
}: Props) {
  const t =
    useTranslations(
      "AdminExternalActivityParticipants"
    );

  const [
    participantes,
    setParticipantes,
  ] =
    useState<Participante[]>(
      []
    );

  const [
    disponiveis,
    setDisponiveis,
  ] =
    useState<
      AlunoDisponivel[]
    >([]);

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
    adicionando,
    setAdicionando,
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
    busca,
    setBusca,
  ] =
    useState("");

  const [
    selecionados,
    setSelecionados,
  ] =
    useState<Set<number>>(
      () => new Set()
    );

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await fetch(
          `/api/admin/atividades-externas/${atividadeId}/participantes`,
          {
            credentials:
              "include",

            cache:
              "no-store",
          }
        );

      const dados:
        RespostaParticipantes =
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

      setDisponiveis(
        Array.isArray(
          dados.disponiveis
        )
          ? dados.disponiveis
          : []
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

  const disponiveisFiltrados =
    useMemo(() => {
      const termo =
        normalizarBusca(
          busca
        );

      if (!termo) {
        return disponiveis;
      }

      return disponiveis.filter(
        (aluno) => {
          const texto =
            normalizarBusca(
              [
                aluno.nome,
                aluno.nomeSocial,
                aluno.matricula,
                ...aluno.turmas.map(
                  (turma) =>
                    `${turma.nome} ${turma.codigo || ""}`
                ),
              ]
                .filter(Boolean)
                .join(" ")
            );

          return texto.includes(
            termo
          );
        }
      );
    }, [
      busca,
      disponiveis,
    ]);

  const todosFiltradosSelecionados =
    useMemo(() => {
      if (
        disponiveisFiltrados.length ===
        0
      ) {
        return false;
      }

      return disponiveisFiltrados.every(
        (aluno) =>
          selecionados.has(
            aluno.alunoId
          )
      );
    }, [
      disponiveisFiltrados,
      selecionados,
    ]);

  function alternarAluno(
    alunoId: number
  ) {
    setSelecionados(
      (atuais) => {
        const proximo =
          new Set(atuais);

        if (
          proximo.has(
            alunoId
          )
        ) {
          proximo.delete(
            alunoId
          );
        } else {
          proximo.add(
            alunoId
          );
        }

        return proximo;
      }
    );
  }

  function selecionarTodos() {
    setSelecionados(
      (atuais) => {
        const proximo =
          new Set(atuais);

        for (
          const aluno
          of disponiveisFiltrados
        ) {
          proximo.add(
            aluno.alunoId
          );
        }

        return proximo;
      }
    );
  }

  function limparSelecao() {
    setSelecionados(
      new Set()
    );
  }

  async function adicionarSelecionados() {
    if (
      selecionados.size ===
      0
    ) {
      return;
    }

    try {
      setAdicionando(true);
      setErro("");
      setSucesso("");

      const resposta =
        await fetch(
          `/api/admin/atividades-externas/${atividadeId}/participantes`,
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              alunoIds:
                Array.from(
                  selecionados
                ),
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
              "messages.addError"
            )
        );
      }

      const adicionados =
        Number(
          dados?.adicionados ||
            0
        );

      if (
        adicionados > 0
      ) {
        setSucesso(
          t(
            "messages.added",
            {
              count:
                adicionados,
            }
          )
        );
      } else {
        setSucesso(
          t(
            "messages.noneAdded"
          )
        );
      }

      setSelecionados(
        new Set()
      );

      await carregar();

      await onParticipantesAlterados?.();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t(
              "messages.addError"
            )
      );
    } finally {
      setAdicionando(false);
    }
  }

  if (carregando) {
    return (
      <section className="phanyx-participantes-atividade py-12 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />

        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {t("loading")}
        </p>
      </section>
    );
  }

  return (
    <div className="phanyx-participantes-atividade space-y-6">

      <div>
        <h2 className="text-xl font-black text-slate-950 dark:text-white">
          👥 {t("title")}
        </h2>

        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t(
            "description"
          )}
        </p>
      </div>

      {erro ? (
        <section className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {erro}
            </span>

            <button
              type="button"
              onClick={() =>
                void carregar()
              }
              className="rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
            >
              {t(
                "retry"
              )}
            </button>
          </div>
        </section>
      ) : null}

      {sucesso ? (
        <section className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          {sucesso}
        </section>
      ) : null}

      {/* ==================================================
          PARTICIPANTES JÁ ADICIONADOS
          ================================================== */}
      <section className="phanyx-participantes-card rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">

        <div className="flex flex-wrap items-end justify-between gap-3">

          <div>
            <h3 className="text-base font-black text-slate-950 dark:text-white">
              {t(
                "current.title"
              )}
            </h3>

            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t(
                "current.count",
                {
                  count:
                    participantes.length,
                }
              )}
            </p>
          </div>

        </div>

        {participantes.length ===
        0 ? (
          <div className="phanyx-participantes-empty mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-800">
            <div className="text-3xl">
              👥
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {t(
                "current.empty"
              )}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 xl:grid-cols-2">

            {participantes.map(
              (participante) => {
                const aluno =
                  participante.aluno;

                const nome =
                  nomeAluno(
                    aluno
                  );

                return (
                  <article
                    key={
                      participante.id
                    }
                    className="phanyx-participante-item rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex gap-4">

                      <AvatarAluno
                        nome={
                          nome
                        }
                        fotoPerfil={
                          aluno.fotoPerfil
                        }
                      />

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                          {nome}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {aluno.matricula?.trim() ||
                            t(
                              "noRegistration"
                            )}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">

                          <StatusTag
                            titulo={t(
                              "fields.participation"
                            )}
                            valor={t(
                              `participation.${participante.statusParticipacao}`
                            )}
                            tipo="blue"
                          />

                          <StatusTag
                            titulo={t(
                              "fields.attendance"
                            )}
                            valor={t(
                              `attendance.${participante.statusPresenca}`
                            )}
                            tipo={
                              participante.statusPresenca ===
                              "PRESENTE"
                                ? "green"
                                : "neutral"
                            }
                          />

                          <StatusTag
                            titulo={t(
                              "fields.payment"
                            )}
                            valor={t(
                              `payment.${participante.statusPagamento}`
                            )}
                            tipo={
                              participante.statusPagamento ===
                              "PAGO"
                                ? "green"
                                : participante.statusPagamento ===
                                    "PENDENTE"
                                  ? "amber"
                                  : "neutral"
                            }
                          />

                          <StatusTag
                            titulo={t(
                              "fields.origin"
                            )}
                            valor={t(
                              `origin.${participante.origem}`
                            )}
                            tipo="neutral"
                          />

                        </div>
                      </div>
                    </div>
                  </article>
                );
              }
            )}

          </div>
        )}
      </section>

      {/* ==================================================
          ALUNOS DISPONÍVEIS
          ================================================== */}
      <section className="phanyx-participantes-card rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <h3 className="text-base font-black text-slate-950 dark:text-white">
              {t(
                "available.title"
              )}
            </h3>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t(
                "available.description"
              )}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t(
                "available.count",
                {
                  count:
                    disponiveis.length,
                }
              )}
            </p>
          </div>

          <div className="w-full lg:max-w-md">

            <input
              type="search"
              value={busca}
              onChange={(e) =>
                setBusca(
                  e.target.value
                )
              }
              placeholder={t(
                "available.search"
              )}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
            />

          </div>
        </div>

        {podeGerenciar &&
        disponiveis.length >
          0 ? (
          <div className="phanyx-participantes-toolbar mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={
                  todosFiltradosSelecionados
                    ? limparSelecao
                    : selecionarTodos
                }
                className="phanyx-participantes-toolbar-button rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {todosFiltradosSelecionados
                  ? t(
                      "available.clearSelection"
                    )
                  : t(
                      "available.selectAll"
                    )}
              </button>

              {selecionados.size >
              0 ? (
                <span className="inline-flex items-center rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-200">
                  {t(
                    "available.selected",
                    {
                      count:
                        selecionados.size,
                    }
                  )}
                </span>
              ) : null}

            </div>

            <button
              type="button"
              onClick={() =>
                void adicionarSelecionados()
              }
              disabled={
                adicionando ||
                selecionados.size ===
                  0
              }
              className="phanyx-participantes-add-button inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-700 px-4 text-xs font-black text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adicionando
                ? t(
                    "available.adding"
                  )
                : `＋ ${t(
                    "available.addSelected"
                  )}`}
            </button>

          </div>
        ) : null}

        {disponiveisFiltrados.length ===
        0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-800">

            <div className="text-3xl">
              🎓
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {t(
                "available.empty"
              )}
            </p>

          </div>
        ) : (
          <div className="mt-5 grid gap-3 xl:grid-cols-2">

            {disponiveisFiltrados.map(
              (aluno) => {
                const selecionado =
                  selecionados.has(
                    aluno.alunoId
                  );

                const nome =
                  nomeAluno(
                    aluno
                  );

                return (
                  <label
                    key={
                      aluno.alunoId
                    }
                    className={[
  "phanyx-participante-disponivel phanyx-participante-card flex gap-4 rounded-2xl border p-4 transition",
                      podeGerenciar
                        ? "cursor-pointer"
                        : "cursor-default",
                      selecionado
                        ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30"
                        : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900",
                    ].join(
                      " "
                    )}
                  >

                    {podeGerenciar ? (
                      <input
                        type="checkbox"
                        checked={
                          selecionado
                        }
                        onChange={() =>
                          alternarAluno(
                            aluno.alunoId
                          )
                        }
                        className="mt-2 h-4 w-4 flex-none"
                      />
                    ) : null}

                    <AvatarAluno
                      nome={nome}
                      fotoPerfil={
                        aluno.fotoPerfil
                      }
                    />

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                        {nome}
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t(
                          "fields.registration"
                        )}
                        :{" "}
                        {aluno.matricula?.trim() ||
                          t(
                            "noRegistration"
                          )}
                      </p>

                      {aluno.turmas.length >
                      0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">

                          {aluno.turmas.map(
                            (turma) => (
                              <span
                                key={
                                  turma.id
                                }
                                className="phanyx-participantes-chip rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {
                                  turma.nome
                                }
                                {turma.codigo
                                  ? ` · ${turma.codigo}`
                                  : ""}
                              </span>
                            )
                          )}

                        </div>
                      ) : null}

                    </div>
                  </label>
                );
              }
            )}

          </div>
        )}
      </section>
    </div>
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

function StatusTag({
  titulo,
  valor,
  tipo,
}: {
  titulo: string;
  valor: string;

  tipo:
    | "neutral"
    | "blue"
    | "green"
    | "amber";
}) {
  const classe =
    tipo === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
      : tipo === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        : tipo === "blue"
          ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"
          : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold",
        classe,
      ].join(" ")}
      title={titulo}
    >
      {valor}
    </span>
  );
}