"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type PessoaOpcao = {
  id: number;
  userId: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  matricula?: string | null;
  setor?: string | null;
  role?: string | null;
};

type TurmaOpcao = {
  id: number;
  nome: string;
  semestre?: string | null;
  periodoLetivo?: string | null;
};

type CursoOpcao = {
  id: number;
  nome: string;
  codigo?: string | null;
};

type OpcoesReuniao = {
  setores: string[];
  funcionarios: PessoaOpcao[];
  professores: PessoaOpcao[];
  alunos: PessoaOpcao[];
  turmas: TurmaOpcao[];
  cursos: CursoOpcao[];
};

type Reuniao = {
  id: number;
  titulo: string;
  descricao?: string | null;
  link: string;
  dataHora: string;
  publicoTipo: string;
  status: string;
  setor?: string | null;
  participantes?: {
    id: number;
  }[];
  turma?: {
    nome: string;
  } | null;
  curso?: {
    nome: string;
  } | null;
};

function normalizarTexto(
  texto: string
) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim();
}

function formatarDataHora(
  data: string,
  locale: string
) {
  try {
    const valor =
      new Date(data);

    if (
      Number.isNaN(
        valor.getTime()
      )
    ) {
      return data;
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    ).format(valor);
  } catch {
    return data;
  }
}

export default function ProfessorReunioesClient() {
  const t =
    useTranslations(
      "ProfessorMeetings"
    );

  const locale =
    useLocale();

  const [
    titulo,
    setTitulo,
  ] = useState("");

  const [
    descricao,
    setDescricao,
  ] = useState("");

  const [
    link,
    setLink,
  ] = useState("");

  const [
    dataHora,
    setDataHora,
  ] = useState("");

  const [
    publicoTipo,
    setPublicoTipo,
  ] = useState("TURMA");

  const [
    setor,
    setSetor,
  ] = useState("");

  const [
    turmaId,
    setTurmaId,
  ] = useState("");

  const [
    cursoId,
    setCursoId,
  ] = useState("");

  const [
    buscaPessoa,
    setBuscaPessoa,
  ] = useState("");

  const [
    participantesUserIds,
    setParticipantesUserIds,
  ] = useState<number[]>([]);

  const [
    participantesAlunoIds,
    setParticipantesAlunoIds,
  ] = useState<number[]>([]);

  const [
    reunioes,
    setReunioes,
  ] = useState<Reuniao[]>([]);

  const [
    opcoes,
    setOpcoes,
  ] = useState<OpcoesReuniao>({
    setores: [],
    funcionarios: [],
    professores: [],
    alunos: [],
    turmas: [],
    cursos: [],
  });

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    carregandoDados,
    setCarregandoDados,
  ] = useState(true);

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    erro,
    setErro,
  ] = useState("");

  function getPublicoLabel(
    tipo: string
  ) {
    switch (tipo) {
      case "SETOR":
        return t(
          "audiences.department"
        );

      case "TODA_EQUIPE":
        return t(
          "audiences.wholeTeam"
        );

      case "INDIVIDUAL":
        return t(
          "audiences.individual"
        );

      case "TURMA":
        return t(
          "audiences.class"
        );

      case "CURSO":
        return t(
          "audiences.course"
        );

      case "TODOS_ALUNOS":
        return t(
          "audiences.allStudents"
        );

      default:
        return tipo;
    }
  }

  function getRoleLabel(
    role?: string | null
  ) {
    const valor =
      String(
        role || ""
      ).toUpperCase();

    if (valor === "ALUNO") {
      return t(
        "roles.student"
      );
    }

    if (
      valor === "PROFESSOR"
    ) {
      return t(
        "roles.teacher"
      );
    }

    if (
      valor === "FUNCIONARIO"
    ) {
      return t(
        "roles.employee"
      );
    }

    return (
      role ||
      t("roles.person")
    );
  }

  const pessoasIndividuais =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          PessoaOpcao
        >();

      opcoes.funcionarios.forEach(
        (pessoa) => {
          const normalizada = {
            ...pessoa,
            role:
              pessoa.role ||
              "FUNCIONARIO",
          };

          mapa.set(
            `user-${normalizada.userId}`,
            normalizada
          );
        }
      );

      opcoes.professores.forEach(
        (pessoa) => {
          const normalizada = {
            ...pessoa,
            role:
              pessoa.role ||
              "PROFESSOR",
          };

          mapa.set(
            `user-${normalizada.userId}`,
            normalizada
          );
        }
      );

      opcoes.alunos.forEach(
        (aluno) => {
          const normalizado = {
            ...aluno,
            role:
              aluno.role ||
              "ALUNO",
          };

          mapa.set(
            `aluno-${normalizado.id}`,
            normalizado
          );
        }
      );

      return Array.from(
        mapa.values()
      ).sort((a, b) =>
        a.nome.localeCompare(
          b.nome,
          locale
        )
      );
    }, [
      opcoes,
      locale,
    ]);

  const pessoasFiltradas =
    useMemo(() => {
      const termo =
        normalizarTexto(
          buscaPessoa
        );

      if (!termo) {
        return pessoasIndividuais.slice(
          0,
          30
        );
      }

      return pessoasIndividuais
        .filter((pessoa) => {
          const nome =
            normalizarTexto(
              pessoa.nome || ""
            );

          const email =
            normalizarTexto(
              pessoa.email || ""
            );

          const matricula =
            normalizarTexto(
              pessoa.matricula ||
                ""
            );

          const setorPessoa =
            normalizarTexto(
              pessoa.setor || ""
            );

          return (
            nome.includes(
              termo
            ) ||
            email.includes(
              termo
            ) ||
            matricula.includes(
              termo
            ) ||
            setorPessoa.includes(
              termo
            )
          );
        })
        .slice(0, 40);
    }, [
      buscaPessoa,
      pessoasIndividuais,
    ]);

  const participantesSelecionados =
    useMemo(() => {
      return pessoasIndividuais.filter(
        (pessoa) => {
          if (
            String(
              pessoa.role
            ).toUpperCase() ===
            "ALUNO"
          ) {
            return participantesAlunoIds.includes(
              pessoa.id
            );
          }

          return participantesUserIds.includes(
            pessoa.userId
          );
        }
      );
    }, [
      pessoasIndividuais,
      participantesUserIds,
      participantesAlunoIds,
    ]);

  function limparCamposPublico() {
    setSetor("");
    setTurmaId("");
    setCursoId("");
    setBuscaPessoa("");
    setParticipantesUserIds(
      []
    );
    setParticipantesAlunoIds(
      []
    );
  }

  function pessoaEstaSelecionada(
    pessoa: PessoaOpcao
  ) {
    if (
      String(
        pessoa.role
      ).toUpperCase() ===
      "ALUNO"
    ) {
      return participantesAlunoIds.includes(
        pessoa.id
      );
    }

    return participantesUserIds.includes(
      pessoa.userId
    );
  }

  function alternarPessoa(
    pessoa: PessoaOpcao
  ) {
    if (
      String(
        pessoa.role
      ).toUpperCase() ===
      "ALUNO"
    ) {
      setParticipantesAlunoIds(
        (atuais) =>
          atuais.includes(
            pessoa.id
          )
            ? atuais.filter(
                (id) =>
                  id !==
                  pessoa.id
              )
            : [
                ...atuais,
                pessoa.id,
              ]
      );

      return;
    }

    setParticipantesUserIds(
      (atuais) =>
        atuais.includes(
          pessoa.userId
        )
          ? atuais.filter(
              (id) =>
                id !==
                pessoa.userId
            )
          : [
              ...atuais,
              pessoa.userId,
            ]
    );
  }

  async function carregarTudo() {
    try {
      setCarregandoDados(
        true
      );
      setErro("");

      const [
        resReunioes,
        resOpcoes,
      ] =
        await Promise.all([
          fetch(
            "/api/reunioes",
            {
              cache:
                "no-store",
            }
          ),
          fetch(
            "/api/reunioes/opcoes",
            {
              cache:
                "no-store",
            }
          ),
        ]);

      const dataReunioes =
        await resReunioes.json();

      const dataOpcoes =
        await resOpcoes.json();

      if (
        !resReunioes.ok
      ) {
        throw new Error(
          t(
            "feedback.loadError"
          )
        );
      }

      setReunioes(
        Array.isArray(
          dataReunioes
        )
          ? dataReunioes
          : []
      );

      if (
        !resOpcoes.ok
      ) {
        throw new Error(
          t(
            "feedback.optionsError"
          )
        );
      }

      setOpcoes({
        setores:
          Array.isArray(
            dataOpcoes.setores
          )
            ? dataOpcoes.setores
            : [],

        funcionarios:
          Array.isArray(
            dataOpcoes.funcionarios
          )
            ? dataOpcoes.funcionarios
            : [],

        professores:
          Array.isArray(
            dataOpcoes.professores
          )
            ? dataOpcoes.professores
            : [],

        alunos:
          Array.isArray(
            dataOpcoes.alunos
          )
            ? dataOpcoes.alunos
            : [],

        turmas:
          Array.isArray(
            dataOpcoes.turmas
          )
            ? dataOpcoes.turmas
            : [],

        cursos:
          Array.isArray(
            dataOpcoes.cursos
          )
            ? dataOpcoes.cursos
            : [],
      });
    } catch (
      error: unknown
    ) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : t(
              "feedback.loadError"
            );

      setErro(
        mensagemErro
      );
    } finally {
      setCarregandoDados(
        false
      );
    }
  }

  async function criarReuniao() {
    try {
      setLoading(true);
      setMensagem("");
      setErro("");

      const res =
        await fetch(
          "/api/reunioes",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              {
                titulo,
                descricao,
                link,
                dataHora,
                publicoTipo,
                setor:
                  publicoTipo ===
                  "SETOR"
                    ? setor
                    : null,
                turmaId:
                  publicoTipo ===
                  "TURMA"
                    ? Number(
                        turmaId
                      )
                    : null,
                cursoId:
                  publicoTipo ===
                  "CURSO"
                    ? Number(
                        cursoId
                      )
                    : null,
                participantesUserIds:
                  publicoTipo ===
                  "INDIVIDUAL"
                    ? participantesUserIds
                    : [],
                participantesAlunoIds:
                  publicoTipo ===
                  "INDIVIDUAL"
                    ? participantesAlunoIds
                    : [],
              }
            ),
          }
        );

      if (!res.ok) {
        throw new Error(
          t(
            "feedback.createError"
          )
        );
      }

      setMensagem(
        t(
          "feedback.createSuccess"
        )
      );

      setTitulo("");
      setDescricao("");
      setLink("");
      setDataHora("");
      setPublicoTipo(
        "TURMA"
      );

      limparCamposPublico();

      await carregarTudo();
    } catch (
      error: unknown
    ) {
      const mensagemErro =
        error instanceof Error
          ? error.message
          : t(
              "feedback.createError"
            );

      setErro(
        mensagemErro
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="professor-reunioes-fix">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          📅 {t("title")}
        </h1>

        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
          {t(
            "description"
          )}
        </p>
      </div>

      {mensagem && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          {mensagem}
        </div>
      )}

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {erro}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md phanyx-theme-card">
        <h2 className="phanyx-reunioes-titulo mb-4 text-lg font-semibold">
          {t(
            "form.title"
          )}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={titulo}
            onChange={(e) =>
              setTitulo(
                e.target.value
              )
            }
            placeholder={t(
              "form.meetingTitle"
            )}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />

          <input
            value={link}
            onChange={(e) =>
              setLink(
                e.target.value
              )
            }
            placeholder={t(
              "form.meetingLink"
            )}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />

          <input
            type="datetime-local"
            value={dataHora}
            aria-label={t(
              "form.dateTime"
            )}
            onChange={(e) =>
              setDataHora(
                e.target.value
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          />

          <select
            value={
              publicoTipo
            }
            aria-label={t(
              "form.audience"
            )}
            onChange={(e) => {
              setPublicoTipo(
                e.target.value
              );

              limparCamposPublico();
            }}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
          >
            <option value="SETOR">
              {t(
                "audiences.department"
              )}
            </option>

            <option value="TODA_EQUIPE">
              {t(
                "audiences.wholeTeam"
              )}
            </option>

            <option value="INDIVIDUAL">
              {t(
                "audiences.individual"
              )}
            </option>

            <option value="TURMA">
              {t(
                "audiences.class"
              )}
            </option>

            <option value="CURSO">
              {t(
                "audiences.course"
              )}
            </option>

            <option value="TODOS_ALUNOS">
              {t(
                "audiences.allStudents"
              )}
            </option>
          </select>

          {publicoTipo ===
            "SETOR" && (
            <select
              value={setor}
              onChange={(e) =>
                setSetor(
                  e.target.value
                )
              }
              className="md:col-span-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">
                {t(
                  "form.selectDepartment"
                )}
              </option>

              {opcoes.setores.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          )}

          {publicoTipo ===
            "TURMA" && (
            <select
              value={turmaId}
              onChange={(e) =>
                setTurmaId(
                  e.target.value
                )
              }
              className="md:col-span-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">
                {t(
                  "form.selectClass"
                )}
              </option>

              {opcoes.turmas.map(
                (turma) => (
                  <option
                    key={
                      turma.id
                    }
                    value={
                      turma.id
                    }
                  >
                    {
                      turma.nome
                    }

                    {turma.periodoLetivo
                      ? ` • ${turma.periodoLetivo}`
                      : ""}

                    {turma.semestre
                      ? ` • ${turma.semestre}`
                      : ""}
                  </option>
                )
              )}
            </select>
          )}

          {publicoTipo ===
            "CURSO" && (
            <select
              value={cursoId}
              onChange={(e) =>
                setCursoId(
                  e.target.value
                )
              }
              className="md:col-span-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-white"
            >
              <option value="">
                {t(
                  "form.selectCourse"
                )}
              </option>

              {opcoes.cursos.map(
                (curso) => (
                  <option
                    key={
                      curso.id
                    }
                    value={
                      curso.id
                    }
                  >
                    {
                      curso.nome
                    }

                    {curso.codigo
                      ? ` • ${curso.codigo}`
                      : ""}
                  </option>
                )
              )}
            </select>
          )}

          {publicoTipo ===
            "INDIVIDUAL" && (
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {t(
                  "participants.select"
                )}
              </label>

              <input
                value={
                  buscaPessoa
                }
                onChange={(e) =>
                  setBuscaPessoa(
                    e.target.value
                  )
                }
                placeholder={t(
                  "participants.search"
                )}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />

              <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                {pessoasFiltradas.map(
                  (pessoa) => {
                    const selecionado =
                      pessoaEstaSelecionada(
                        pessoa
                      );

                    return (
                      <button
                        key={`${pessoa.role}-${pessoa.id}-${pessoa.userId}`}
                        type="button"
                        onClick={() =>
                          alternarPessoa(
                            pessoa
                          )
                        }
                        className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition last:border-b-0 dark:border-slate-800 ${
                          selecionado
                            ? "bg-blue-600 text-white"
                            : "text-slate-800 hover:bg-blue-50 dark:text-white dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>
                          <span className="block font-semibold">
                            {
                              pessoa.nome
                            }
                          </span>

                          <span
                            className={`block text-xs ${
                              selecionado
                                ? "text-blue-100"
                                : "text-blue-500"
                            }`}
                          >
                            {getRoleLabel(
                              pessoa.role
                            )}

                            {pessoa.matricula
                              ? ` • ${pessoa.matricula}`
                              : ""}

                            {pessoa.setor
                              ? ` • ${pessoa.setor}`
                              : ""}

                            {pessoa.email
                              ? ` • ${pessoa.email}`
                              : ""}
                          </span>
                        </span>

                        <span className="text-xs font-bold">
                          {selecionado
                            ? t(
                                "participants.selected"
                              )
                            : t(
                                "participants.add"
                              )}
                        </span>
                      </button>
                    );
                  }
                )}

                {pessoasFiltradas.length ===
                  0 && (
                  <div className="px-4 py-5 text-sm text-slate-500 dark:text-slate-300">
                    {t(
                      "participants.noneFound"
                    )}
                  </div>
                )}
              </div>

              {participantesSelecionados.length >
                0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {participantesSelecionados.map(
                    (pessoa) => (
                      <button
                        key={`sel-${pessoa.role}-${pessoa.id}-${pessoa.userId}`}
                        type="button"
                        onClick={() =>
                          alternarPessoa(
                            pessoa
                          )
                        }
                        className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                      >
                        {
                          pessoa.nome
                        }{" "}
                        ✕
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          <textarea
            value={descricao}
            onChange={(e) =>
              setDescricao(
                e.target.value
              )
            }
            placeholder={t(
              "form.description"
            )}
            className="
              md:col-span-2
              min-h-28
              rounded-2xl
              border-2
              border-slate-300
              bg-white
              px-4
              py-3
              text-slate-900
              shadow-sm
              transition-all
              outline-none
              hover:border-blue-400
              focus:border-blue-600
              focus:ring-4
              focus:ring-blue-100
              dark:border-slate-600
              dark:bg-slate-950
              dark:text-white
              dark:focus:ring-blue-900/30
            "
          />
        </div>

        <button
          type="button"
          onClick={
            criarReuniao
          }
          disabled={loading}
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-white disabled:bg-slate-400"
        >
          {loading
            ? t(
                "form.creating"
              )
            : t(
                "form.create"
              )}
        </button>
      </div>

      <div className="phanyx-prof-reunioes-card rounded-3xl border p-6 shadow-sm">
        <h2 className="phanyx-prof-reunioes-titulo mb-4 text-lg font-semibold">
          {t(
            "scheduled.title"
          )}
        </h2>

        {carregandoDados && (
          <div className="phanyx-prof-reunioes-detalhes rounded-2xl border p-4 text-sm">
            {t(
              "scheduled.loading"
            )}
          </div>
        )}

        {!carregandoDados &&
          reunioes.length ===
            0 && (
            <div className="phanyx-prof-reunioes-detalhes rounded-2xl border p-4 text-sm">
              {t(
                "scheduled.empty"
              )}
            </div>
          )}

        {!carregandoDados &&
          reunioes.length >
            0 && (
            <div className="space-y-3">
              {reunioes.map(
                (reuniao) => (
                  <div
                    key={
                      reuniao.id
                    }
                    className="phanyx-prof-reunioes-item rounded-2xl border p-4"
                  >
                    <h3 className="phanyx-prof-reunioes-item-titulo font-semibold">
                      {
                        reuniao.titulo
                      }
                    </h3>

                    <p className="phanyx-prof-reunioes-data text-sm">
                      {formatarDataHora(
                        reuniao.dataHora,
                        locale
                      )}
                    </p>

                    <p className="phanyx-prof-reunioes-detalhes mt-1 text-xs font-medium">
                      {getPublicoLabel(
                        reuniao.publicoTipo
                      )}

                      {reuniao.setor
                        ? ` • ${reuniao.setor}`
                        : ""}

                      {reuniao.turma
                        ?.nome
                        ? ` • ${reuniao.turma.nome}`
                        : ""}

                      {reuniao.curso
                        ?.nome
                        ? ` • ${reuniao.curso.nome}`
                        : ""}

                      {" • "}

                      {t(
                        "scheduled.participants",
                        {
                          count:
                            reuniao
                              .participantes
                              ?.length ||
                            0,
                        }
                      )}
                    </p>

                    <a
                      href={
                        reuniao.link
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="phanyx-prof-reunioes-entrar mt-3 inline-block rounded-xl px-4 py-2 font-medium"
                    >
                      {t(
                        "scheduled.join"
                      )}
                    </a>
                  </div>
                )
              )}
            </div>
          )}
      </div>
    </div>
  );
}