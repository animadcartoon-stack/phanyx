

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useTranslations,
} from "next-intl";

type TipoMembro =
  | "PROFESSOR"
  | "FUNCIONARIO"
  | "ACOMPANHANTE_EXTERNO"
  | "RESPONSAVEL_VOLUNTARIO"
  | "GUIA"
  | "OUTRO";

type PapelEquipe =
  | "RESPONSAVEL_GERAL"
  | "COORDENADOR"
  | "SUPERVISOR"
  | "MONITOR"
  | "PRIMEIROS_SOCORROS"
  | "ACOMPANHANTE"
  | "OUTRO";

type MembroEquipe = {
  id: number;

  tipoMembro: TipoMembro;
  papel: PapelEquipe;

  principal: boolean;

  userId?: number | null;
  professorId?: number | null;
  funcionarioId?: number | null;

  nomeSnapshot: string;

  emailSnapshot?: string | null;
  telefoneSnapshot?: string | null;

  observacao?: string | null;

  createdAt: string;
  updatedAt: string;
};

type ProfessorOpcao = {
  id: number;
  nome: string;

  fotoPerfil?: string | null;
  telefone?: string | null;
  email?: string | null;

  especialidade?: string | null;
  titulacao?: string | null;

  poloId?: number | null;

  funcionarioId?: number | null;
};

type FuncionarioOpcao = {
  id: number;
  nome: string;

  fotoPerfil?: string | null;
  telefone?: string | null;
  email?: string | null;

  cargo?: string | null;
  setor?: string | null;

  poloId?: number | null;

  professorId?: number | null;
};

type RespostaApi = {
  ok?: boolean;

  podeGerenciar?: boolean;

  equipe?: MembroEquipe[];

  opcoes?: {
    professores?: ProfessorOpcao[];
    funcionarios?: FuncionarioOpcao[];
  };

  error?: string;
  message?: string;
  detalhe?: string;
};

type Formulario = {
  tipoMembro: TipoMembro;

  papel: PapelEquipe;

  principal: boolean;

  professorId: string;
  funcionarioId: string;

  nome: string;
  email: string;
  telefone: string;

  observacao: string;
};

type Props = {
  atividadeId: number;

  onEquipeAlterada?:
    () =>
      | void
      | Promise<void>;
};

const TIPOS: TipoMembro[] = [
  "PROFESSOR",
  "FUNCIONARIO",
  "ACOMPANHANTE_EXTERNO",
  "RESPONSAVEL_VOLUNTARIO",
  "GUIA",
  "OUTRO",
];

const PAPEIS: PapelEquipe[] = [
  "RESPONSAVEL_GERAL",
  "COORDENADOR",
  "SUPERVISOR",
  "MONITOR",
  "PRIMEIROS_SOCORROS",
  "ACOMPANHANTE",
  "OUTRO",
];

const FORMULARIO_INICIAL: Formulario = {
  tipoMembro:
    "PROFESSOR",

  papel:
    "RESPONSAVEL_GERAL",

  principal:
    false,

  professorId:
    "",

  funcionarioId:
    "",

  nome:
    "",

  email:
    "",

  telefone:
    "",

  observacao:
    "",
};

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

function tipoExterno(
  tipo: TipoMembro
) {
  return (
    tipo ===
      "ACOMPANHANTE_EXTERNO" ||
    tipo ===
      "RESPONSAVEL_VOLUNTARIO" ||
    tipo ===
      "GUIA" ||
    tipo ===
      "OUTRO"
  );
}

export default function EquipeAtividadeExterna({
  atividadeId,
  onEquipeAlterada,
}: Props) {
  const t =
    useTranslations(
      "AdminExternalActivityTeam"
    );

  const [
    equipe,
    setEquipe,
  ] =
    useState<
      MembroEquipe[]
    >([]);

  const [
    professores,
    setProfessores,
  ] =
    useState<
      ProfessorOpcao[]
    >([]);

  const [
    funcionarios,
    setFuncionarios,
  ] =
    useState<
      FuncionarioOpcao[]
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
    salvando,
    setSalvando,
  ] =
    useState(false);

  const [
    formularioAberto,
    setFormularioAberto,
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
    formulario,
    setFormulario,
  ] =
    useState<Formulario>({
      ...FORMULARIO_INICIAL,
    });

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const resposta =
        await fetch(
          `/api/admin/atividades-externas/${atividadeId}/equipe`,
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
            t(
              "loadError"
            )
        );
      }

      setEquipe(
        Array.isArray(
          dados.equipe
        )
          ? dados.equipe
          : []
      );

      setProfessores(
        Array.isArray(
          dados.opcoes
            ?.professores
        )
          ? dados.opcoes!
              .professores!
          : []
      );

      setFuncionarios(
        Array.isArray(
          dados.opcoes
            ?.funcionarios
        )
          ? dados.opcoes!
              .funcionarios!
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
          : t(
              "loadError"
            )
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atividadeId]);

  const membroPrincipal =
    useMemo(
      () =>
        equipe.find(
          (membro) =>
            membro.principal
        ) || null,
      [equipe]
    );

  function professorJaAdicionado(
    professor: ProfessorOpcao
  ) {
    return equipe.some(
      (membro) =>
        membro.professorId ===
          professor.id ||
        (
          professor.funcionarioId &&
          membro.funcionarioId ===
            professor.funcionarioId
        )
    );
  }

  function funcionarioJaAdicionado(
    funcionario: FuncionarioOpcao
  ) {
    return equipe.some(
      (membro) =>
        membro.funcionarioId ===
          funcionario.id ||
        (
          funcionario.professorId &&
          membro.professorId ===
            funcionario.professorId
        )
    );
  }

  function abrirFormulario() {
    setFormulario({
      ...FORMULARIO_INICIAL,

      principal:
        equipe.length ===
        0,
    });

    setErro("");
    setSucesso("");
    setFormularioAberto(
      true
    );
  }

  function fecharFormulario() {
    setFormularioAberto(
      false
    );

    setFormulario({
      ...FORMULARIO_INICIAL,
    });
  }

  function alterarTipo(
    tipoMembro: TipoMembro
  ) {
    setFormulario(
      (atual) => ({
        ...atual,

        tipoMembro,

        professorId:
          "",

        funcionarioId:
          "",

        nome:
          "",

        email:
          "",

        telefone:
          "",
      })
    );
  }

  async function salvar() {
    try {
      setErro("");
      setSucesso("");
      setSalvando(true);

      if (
        formulario.tipoMembro ===
          "PROFESSOR" &&
        !formulario.professorId
      ) {
        setErro(
          t(
            "form.selectPerson"
          )
        );

        return;
      }

      if (
        formulario.tipoMembro ===
          "FUNCIONARIO" &&
        !formulario.funcionarioId
      ) {
        setErro(
          t(
            "form.selectPerson"
          )
        );

        return;
      }

      if (
        tipoExterno(
          formulario.tipoMembro
        ) &&
        !formulario.nome.trim()
      ) {
        setErro(
          t(
            "form.namePlaceholder"
          )
        );

        return;
      }

      const corpo: Record<
        string,
        unknown
      > = {
        tipoMembro:
          formulario.tipoMembro,

        papel:
          formulario.papel,

        principal:
          formulario.principal,

        observacao:
          formulario
            .observacao,
      };

      if (
        formulario.tipoMembro ===
        "PROFESSOR"
      ) {
        corpo.professorId =
          Number(
            formulario.professorId
          );
      } else if (
        formulario.tipoMembro ===
        "FUNCIONARIO"
      ) {
        corpo.funcionarioId =
          Number(
            formulario.funcionarioId
          );
      } else {
        corpo.nome =
          formulario.nome;

        corpo.email =
          formulario.email;

        corpo.telefone =
          formulario.telefone;
      }

      const resposta =
        await fetch(
          `/api/admin/atividades-externas/${atividadeId}/equipe`,
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
                corpo
              ),
          }
        );

      const dados =
        await resposta.json();

      if (!resposta.ok) {
        if (
          dados?.error ===
          "MEMBRO_JA_ADICIONADO"
        ) {
          throw new Error(
            t(
              "messages.duplicate"
            )
          );
        }

        throw new Error(
          dados?.message ||
            dados?.detalhe ||
            t(
              "messages.addError"
            )
        );
      }

      fecharFormulario();

      setSucesso(
        t(
          "messages.added"
        )
      );

      await carregar();

      await onEquipeAlterada?.();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t(
              "messages.addError"
            )
      );
    } finally {
      setSalvando(false);
    }
  }

  function obterFotoMembro(
    membro: MembroEquipe
  ) {
    if (
      membro.professorId
    ) {
      return (
        professores.find(
          (professor) =>
            professor.id ===
            membro.professorId
        )?.fotoPerfil ||
        null
      );
    }

    if (
      membro.funcionarioId
    ) {
      return (
        funcionarios.find(
          (funcionario) =>
            funcionario.id ===
            membro.funcionarioId
        )?.fotoPerfil ||
        null
      );
    }

    return null;
  }

  if (carregando) {
    return (
      <section className="phanyx-equipe-atividade py-12 text-center">

        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />

        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {t(
            "loading"
          )}
        </p>

      </section>
    );
  }

  return (
    <div className="phanyx-equipe-atividade space-y-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            👨‍🏫{" "}
            {t(
              "title"
            )}
          </h2>

          <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t(
              "description"
            )}
          </p>
        </div>

        {podeGerenciar &&
        !formularioAberto ? (
          <button
            type="button"
            onClick={
              abrirFormulario
            }
            className="phanyx-equipe-primary rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-800"
          >
            +{" "}
            {t(
              "add.open"
            )}
          </button>
        ) : null}

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

      {/* RESUMO */}

      <section className="grid gap-3 sm:grid-cols-2">

        <article className="phanyx-equipe-resumo rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">

          <span className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t(
              "summary.total"
            )}
          </span>

          <strong className="mt-2 block text-2xl font-black text-slate-950 dark:text-white">
            {equipe.length}
          </strong>

        </article>

        <article className="phanyx-equipe-resumo rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">

          <span className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t(
              "summary.principal"
            )}
          </span>

          <strong className="mt-2 block truncate text-base font-black text-slate-950 dark:text-white">
            {membroPrincipal
              ?.nomeSnapshot ||
              "—"}
          </strong>

        </article>

      </section>

      {/* FORMULÁRIO */}

      {formularioAberto ? (
        <section className="phanyx-equipe-form rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800 sm:p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            <div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">
                {t(
                  "add.title"
                )}
              </h3>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {t(
                  "add.description"
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={
                fecharFormulario
              }
              className="phanyx-equipe-cancel rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {t(
                "add.cancel"
              )}
            </button>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            <Campo
              titulo={t(
                "form.type"
              )}
            >
              <SelectPhanyx
                value={
                  formulario.tipoMembro
                }
                onChange={(valor) =>
                  alterarTipo(
                    valor as TipoMembro
                  )
                }
                placeholder={t(
                  "form.type"
                )}
                options={TIPOS.map(
                  (tipo) => ({
                    value: tipo,
                    label: t(
                      `types.${tipo}`
                    ),
                  })
                )}
              />
            </Campo>

            <Campo
              titulo={t(
                "form.role"
              )}
            >
              <SelectPhanyx
                value={
                  formulario.papel
                }
                onChange={(valor) =>
                  setFormulario(
                    (atual) => ({
                      ...atual,
                      papel:
                        valor as PapelEquipe,
                    })
                  )
                }
                placeholder={t(
                  "form.role"
                )}
                options={PAPEIS.map(
                  (papel) => ({
                    value: papel,
                    label: t(
                      `roles.${papel}`
                    ),
                  })
                )}
              />
            </Campo>

            {formulario.tipoMembro ===
            "PROFESSOR" ? (
              <Campo
                titulo={t(
                  "form.person"
                )}
              >
                <SelectPhanyx
                  value={
                    formulario.professorId
                  }
                  onChange={(valor) =>
                    setFormulario(
                      (atual) => ({
                        ...atual,
                        professorId:
                          valor,
                      })
                    )
                  }
                  placeholder={t(
                    "form.selectPerson"
                  )}
                  options={professores.map(
                    (professor) => ({
                      value: String(
                        professor.id
                      ),
                      label:
                        professor.nome +
                        (
                          professor.especialidade
                            ? ` — ${professor.especialidade}`
                            : ""
                        ),
                      disabled:
                        professorJaAdicionado(
                          professor
                        ),
                    })
                  )}
                />
              </Campo>
            ) : null}

            {formulario.tipoMembro ===
            "FUNCIONARIO" ? (
              <Campo
                titulo={t(
                  "form.person"
                )}
              >
                <SelectPhanyx
                  value={
                    formulario.funcionarioId
                  }
                  onChange={(valor) =>
                    setFormulario(
                      (atual) => ({
                        ...atual,
                        funcionarioId:
                          valor,
                      })
                    )
                  }
                  placeholder={t(
                    "form.selectPerson"
                  )}
                  options={funcionarios.map(
                    (funcionario) => ({
                      value: String(
                        funcionario.id
                      ),
                      label:
                        funcionario.nome +
                        (
                          funcionario.cargo
                            ? ` — ${funcionario.cargo}`
                            : ""
                        ),
                      disabled:
                        funcionarioJaAdicionado(
                          funcionario
                        ),
                    })
                  )}
                />
              </Campo>
            ) : null}

            {tipoExterno(
              formulario.tipoMembro
            ) ? (
              <>
                <Campo
                  titulo={t(
                    "form.name"
                  )}
                >
                  <input
                    value={
                      formulario.nome
                    }
                    onChange={(
                      event
                    ) =>
                      setFormulario(
                        (
                          atual
                        ) => ({
                          ...atual,

                          nome:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder={t(
                      "form.namePlaceholder"
                    )}
                    className="phanyx-equipe-input"
                  />
                </Campo>

                <Campo
                  titulo={t(
                    "form.email"
                  )}
                >
                  <input
                    type="email"
                    value={
                      formulario.email
                    }
                    onChange={(
                      event
                    ) =>
                      setFormulario(
                        (
                          atual
                        ) => ({
                          ...atual,

                          email:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder={t(
                      "form.emailPlaceholder"
                    )}
                    className="phanyx-equipe-input"
                  />
                </Campo>

                <Campo
                  titulo={t(
                    "form.phone"
                  )}
                >
                  <input
                    value={
                      formulario.telefone
                    }
                    onChange={(
                      event
                    ) =>
                      setFormulario(
                        (
                          atual
                        ) => ({
                          ...atual,

                          telefone:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder={t(
                      "form.phonePlaceholder"
                    )}
                    className="phanyx-equipe-input"
                  />
                </Campo>
              </>
            ) : null}

          </div>

          <div className="mt-4">
            <Campo
              titulo={t(
                "form.observation"
              )}
            >
              <textarea
                rows={4}
                value={
                  formulario.observacao
                }
                onChange={(
                  event
                ) =>
                  setFormulario(
                    (
                      atual
                    ) => ({
                      ...atual,

                      observacao:
                        event
                          .target
                          .value,
                    })
                  )
                }
                placeholder={t(
                  "form.observationPlaceholder"
                )}
                className="phanyx-equipe-input resize-y"
              />
            </Campo>
          </div>

          <label className="phanyx-equipe-principal mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">

            <input
              type="checkbox"
              checked={
                formulario.principal
              }
              onChange={(
                event
              ) =>
                setFormulario(
                  (
                    atual
                  ) => ({
                    ...atual,

                    principal:
                      event
                        .target
                        .checked,
                  })
                )
              }
              className="mt-1 h-4 w-4"
            />

            <span>
              <strong className="block text-sm font-black text-slate-950 dark:text-white">
                {t(
                  "form.principal"
                )}
              </strong>

              <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">
                {t(
                  "form.principalDescription"
                )}
              </span>
            </span>

          </label>

          <div className="mt-5 flex justify-end">

            <button
              type="button"
              disabled={
                salvando
              }
              onClick={() =>
                void salvar()
              }
              className="phanyx-equipe-primary rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando
                ? t(
                    "add.saving"
                  )
                : t(
                    "add.save"
                  )}
            </button>

          </div>

        </section>
      ) : null}

      {/* MEMBROS */}

      <section className="phanyx-equipe-card rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">

        <div>
          <h3 className="text-lg font-black text-slate-950 dark:text-white">
            {t(
              "current.title"
            )}
          </h3>

          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t(
              "current.count",
              {
                count:
                  equipe.length,
              }
            )}
          </p>
        </div>

        {equipe.length ===
        0 ? (
          <div className="phanyx-equipe-empty mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-800">

            <div className="text-3xl">
              👨‍🏫
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {t(
                "current.empty"
              )}
            </p>

          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">

            {equipe.map(
              (membro) => {
                const foto =
                  obterFotoMembro(
                    membro
                  );

                return (
                  <article
                    key={
                      membro.id
                    }
                    className="phanyx-equipe-member rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                  >

                    <div className="flex gap-4">

                      <Avatar
                        nome={
                          membro.nomeSnapshot
                        }
                        foto={
                          foto
                        }
                      />

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h4 className="truncate font-black text-slate-950 dark:text-white">
                            {
                              membro.nomeSnapshot
                            }
                          </h4>

                          {membro.principal ? (
                            <span className="phanyx-equipe-chip-principal rounded-full border px-2.5 py-1 text-[11px] font-black">
                              {t(
                                "member.principal"
                              )}
                            </span>
                          ) : null}

                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">

                          <span className="phanyx-equipe-chip rounded-full border px-2.5 py-1 text-[11px] font-bold">
                            {t(
                              `types.${membro.tipoMembro}`
                            )}
                          </span>

                          <span className="phanyx-equipe-chip rounded-full border px-2.5 py-1 text-[11px] font-bold">
                            {t(
                              `roles.${membro.papel}`
                            )}
                          </span>

                        </div>

                        <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">

                          <p>
                            {membro.emailSnapshot ||
                              t(
                                "member.noEmail"
                              )}
                          </p>

                          <p>
                            {membro.telefoneSnapshot ||
                              t(
                                "member.noPhone"
                              )}
                          </p>

                        </div>

                        {membro.observacao ? (
                          <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-600 dark:text-slate-300">
                            {
                              membro.observacao
                            }
                          </p>
                        ) : null}

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </section>

    </div>
  );
}

function Campo({
  titulo,
  children,
}: {
  titulo: string;

  children:
    React.ReactNode;
}) {
  return (
    <div className="space-y-2">

      <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
        {titulo}
      </label>

      {children}

    </div>
  );
}

function Avatar({
  nome,
  foto,
}: {
  nome: string;

  foto?:
    | string
    | null;
}) {
  return (
    <div className="h-12 w-12 flex-none overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">

      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={foto}
          alt={nome}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-black text-slate-600 dark:text-slate-200">
          {iniciais(
            nome
          )}
        </div>
      )}

    </div>
  );
}

type OpcaoSelectPhanyx = {
  value: string;
  label: string;
  disabled?: boolean;
};

function SelectPhanyx({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: OpcaoSelectPhanyx[];
  placeholder: string;
}) {
  const [aberto, setAberto] =
    useState(false);

  const ref =
    useRef<HTMLDivElement>(
      null
    );

  useEffect(() => {
    function fecharAoClicarFora(
      event: MouseEvent
    ) {
      if (
        ref.current &&
        !ref.current.contains(
          event.target as Node
        )
      ) {
        setAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fecharAoClicarFora
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora
      );
    };
  }, []);

  const selecionada =
    options.find(
      (option) =>
        option.value === value
    );

  return (
    <div
      ref={ref}
      className="phanyx-select relative"
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() =>
          setAberto(
            (atual) => !atual
          )
        }
        className="phanyx-select-trigger flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[0.875rem] border px-3.5 py-3 text-left text-sm font-medium"
      >
        <span className="truncate">
          {selecionada?.label ||
            placeholder}
        </span>

        <span
          className={`shrink-0 text-xs transition-transform ${
            aberto
              ? "rotate-180"
              : ""
          }`}
        >
          ▼
        </span>
      </button>

      {aberto ? (
        <div
          role="listbox"
          className="phanyx-select-menu absolute left-0 right-0 top-[calc(100%+6px)] z-[100] max-h-72 overflow-y-auto rounded-2xl border p-1.5 shadow-xl"
        >
          {options.map(
            (option) => {
              const ativo =
                option.value ===
                value;

              return (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  role="option"
                  aria-selected={
                    ativo
                  }
                  disabled={
                    option.disabled
                  }
                  onClick={() => {
                    if (
                      option.disabled
                    ) {
                      return;
                    }

                    onChange(
                      option.value
                    );

                    setAberto(
                      false
                    );
                  }}
                  className={[
                    "phanyx-select-option",
                    ativo
                      ? "is-selected"
                      : "",
                    option.disabled
                      ? "is-disabled"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span>
                    {
                      option.label
                    }
                  </span>

                  {ativo ? (
                    <span>
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            }
          )}
        </div>
      ) : null}
    </div>
  );
}