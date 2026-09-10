"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

type TurmaFiltro = {
  id: number;
  nome: string;
  disciplinaNome?: string | null;
};

type OrdenacaoAlunos =
  | "NOME_ASC"
  | "NOME_DESC"
  | "MEDIA_DESC"
  | "MEDIA_ASC"
  | "FREQUENCIA_DESC"
  | "FREQUENCIA_ASC";

type VisualizacaoAlunos =
  | "CARDS"
  | "LISTA";

type AulaProgressoProfessor = {
  aulaId: number;
  titulo: string;
  ordem: number;
  possuiVideo: boolean;
  status:
    | "NAO_INICIADA"
    | "EM_ANDAMENTO"
    | "CONCLUIDA";
  concluida: boolean;
  concluidaEm?: string | null;
  tempoAssistidoSegundos: number;
  tempoMinimoSegundos: number;
  percentual: number | null;
  sessoesRegistradas: number;
  tempoReproducaoTotalSegundos: number;
  ultimaAtividade?: string | null;
};

type ProgressoAlunoProfessor = {
  aluno: {
    id: number;
    nome: string;
  };
  turmaId: number;
  disciplinaId: number;
  resumo: {
    total: number;
    iniciadas: number;
    concluidas: number;
    emAndamento: number;
    naoIniciadas: number;
  };
  aulas: AulaProgressoProfessor[];
};

type AlunoProfessor = {
  itemMatriculaId: number;
  alunoId: number;
  nome: string;
  email?: string | null;
  matricula?: string | null;
  statusAluno?: string | null;
  statusDisciplina?: string | null;
  turma?: {
    id: number;
    nome: string;
    semestre?: string | null;
  } | null;
  disciplina?: {
    id: number | null;
    nome?: string | null;
  } | null;
  notas: number[];
  media: number | null;
  frequencia: {
    total: number;
    presente: number;
    falta: number;
    justificada: number;
    atestado: number;
    percentual: number | null;
  };
};

function labelStatusAluno(
  status: string | null | undefined,
  t: ReturnType<typeof useTranslations>
) {
  switch (status) {
    case "ATIVO":
      return t("studentStatuses.active");
    case "TRANCADO":
      return t("studentStatuses.locked");
    case "SUSPENSO":
      return t("studentStatuses.suspended");
    case "INADIMPLENTE":
      return t("studentStatuses.delinquent");
    case "TRANSFERIDO":
      return t("studentStatuses.transferred");
    case "DESLIGADO":
      return t("studentStatuses.disconnected");
    case "FORMADO":
      return t("studentStatuses.graduated");
    case "CANCELADO":
      return t("studentStatuses.canceled");
    case "PAUSA_MEDICA":
      return t("studentStatuses.medicalLeave");
    case "FALTANTE":
      return t("studentStatuses.missing");
    default:
      return "-";
  }
}

function labelStatusDisciplina(
  status: string | null | undefined,
  t: ReturnType<typeof useTranslations>
) {
  switch (status) {
    case "A_CURSAR":
      return t("subjectStatuses.toTake");
    case "EM_CURSO":
      return t("subjectStatuses.inProgress");
    case "CONCLUIDO":
      return t("subjectStatuses.completed");
    case "TRANCADO":
      return t("subjectStatuses.locked");
    case "REPROVADO":
      return t("subjectStatuses.failed");
    case "CANCELADO":
      return t("subjectStatuses.canceled");
    default:
      return "-";
  }
}

function formatarTempo(
  segundos?: number | null
) {
  const total = Math.max(
    0,
    Math.floor(
      Number(segundos || 0)
    )
  );

  const horas =
    Math.floor(total / 3600);

  const minutos =
    Math.floor(
      (total % 3600) / 60
    );

  const segundosRestantes =
    total % 60;

  if (horas > 0) {
    return [
      horas,
      minutos,
      segundosRestantes,
    ]
      .map((valor) =>
        String(valor).padStart(
          2,
          "0"
        )
      )
      .join(":");
  }

  return [
    minutos,
    segundosRestantes,
  ]
    .map((valor) =>
      String(valor).padStart(
        2,
        "0"
      )
    )
    .join(":");
}

function formatarDataHora(
  valor?: string | null
) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(data);
}

function normalizarTexto(valor?: string | number | null) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function distanciaLevenshtein(a: string, b: string) {
  const matriz = Array.from({ length: b.length + 1 }, (_, i) =>
    Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= b.length; i++) matriz[i][0] = i;
  for (let j = 0; j <= a.length; j++) matriz[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const custo = b[i - 1] === a[j - 1] ? 0 : 1;

      matriz[i][j] = Math.min(
        matriz[i - 1][j] + 1,
        matriz[i][j - 1] + 1,
        matriz[i - 1][j - 1] + custo
      );
    }
  }

  return matriz[b.length][a.length];
}

function calcularPontuacaoBusca(texto: string, termo: string) {
  const normalTexto = normalizarTexto(texto);
  const normalTermo = normalizarTexto(termo);

  if (!normalTermo || !normalTexto) return 0;

  if (normalTexto.startsWith(normalTermo)) return 1000;

  const palavras = normalTexto.split(/\s+/).filter(Boolean);

  if (palavras.some((palavra) => palavra.startsWith(normalTermo))) {
    return 900;
  }

  if (normalTexto.includes(normalTermo)) return 800;

  // Para buscas curtas como "mi", "ra", "da",
  // NÃO usamos aproximação, senão gmail.com e palavras parecidas entram errado.


  let melhorScore = 0;

  for (const palavra of palavras) {
    const pedacoInicial = palavra.slice(0, normalTermo.length);
    const distanciaInicio = distanciaLevenshtein(pedacoInicial, normalTermo);

    if (
      palavra.length >= normalTermo.length &&
      distanciaInicio <= 1
    ) {
      melhorScore = Math.max(melhorScore, 700);
    }

    const distanciaPalavraInteira = distanciaLevenshtein(palavra, normalTermo);

    if (
      normalTermo.length >= 4 &&
      distanciaPalavraInteira <= 1
    ) {
      melhorScore = Math.max(melhorScore, 600);
    }
  }

  return melhorScore;
}

function textoAlunoBusca(aluno: AlunoProfessor) {
  return normalizarTexto(
    [
      aluno.nome,
      aluno.email,
      aluno.matricula,
      aluno.turma?.nome,
      aluno.turma?.semestre,
      aluno.disciplina?.nome,
      aluno.statusAluno,
      aluno.statusDisciplina,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export default function ProfessorAlunosPage() {
  const t = useTranslations("ProfessorStudents");
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
  const [turmaId, setTurmaId] = useState(searchParams.get("turmaId") || "");

  const [ordenacao, setOrdenacao] =
    useState<OrdenacaoAlunos>(
      "NOME_ASC"
    );

  const [visualizacao, setVisualizacao] =
    useState<VisualizacaoAlunos>(
      "CARDS"
    );

  useEffect(() => {
    try {
      const salva =
        window.localStorage.getItem(
          "phanyx.professor.alunos.visualizacao"
        );

      if (
        salva === "CARDS" ||
        salva === "LISTA"
      ) {
        setVisualizacao(
          salva
        );
      }
    } catch {
      // localStorage indisponivel:
      // mantem o padrao atual.
    }
  }, []);

  const [alunoExpandidoId, setAlunoExpandidoId] =
    useState<number | null>(null);

  const [progressoPorItem, setProgressoPorItem] =
    useState<Record<number, ProgressoAlunoProfessor | null>>({});

  const [progressoCarregando, setProgressoCarregando] =
    useState<Record<number, boolean>>({});

  const [progressoErro, setProgressoErro] =
    useState<Record<number, string>>({});

  const [alunos, setAlunos] = useState<AlunoProfessor[]>([]);
  const [turmas, setTurmas] = useState<TurmaFiltro[]>([]);

  async function carregarProgressoAluno(
    aluno: AlunoProfessor
  ) {
    const itemId =
      aluno.itemMatriculaId;

    if (
      progressoPorItem[itemId] ||
      progressoCarregando[itemId]
    ) {
      return;
    }

    const turmaIdAluno =
      aluno.turma?.id;

    const disciplinaIdAluno =
      aluno.disciplina?.id;

    if (
      !turmaIdAluno ||
      !disciplinaIdAluno
    ) {
      return;
    }

    try {
      setProgressoCarregando(
        (atual) => ({
          ...atual,
          [itemId]: true,
        })
      );

      setProgressoErro(
        (atual) => ({
          ...atual,
          [itemId]: "",
        })
      );

      const query =
        new URLSearchParams({
          alunoId: String(
            aluno.alunoId
          ),
          turmaId: String(
            turmaIdAluno
          ),
          disciplinaId: String(
            disciplinaIdAluno
          ),
        });

      const res = await fetch(
        `/api/professor/progresso/aulas?${query.toString()}`,
        {
          credentials:
            "include",
          cache:
            "no-store",
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t(
              "progress.errorLoad"
            )
        );
      }

      setProgressoPorItem(
        (atual) => ({
          ...atual,
          [itemId]: data,
        })
      );
    } catch (e: any) {
      setProgressoErro(
        (atual) => ({
          ...atual,
          [itemId]:
            e?.message ||
            t(
              "progress.errorLoad"
            ),
        })
      );
    } finally {
      setProgressoCarregando(
        (atual) => ({
          ...atual,
          [itemId]: false,
        })
      );
    }
  }

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const query = new URLSearchParams();

      if (turmaId) query.set("turmaId", turmaId);

      const res = await fetch(`/api/professor/alunos?${query.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t("errorLoad"));
      }

      setAlunos(Array.isArray(data?.alunos) ? data.alunos : []);
      setTurmas(Array.isArray(data?.turmas) ? data.turmas : []);
    } catch (e: any) {
      setErro(e?.message || t("errorLoad"));
      setAlunos([]);
      setTurmas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      carregarDados();
    }, 300);

    return () => clearTimeout(t);
  }, [busca, turmaId]);

  const resumo = useMemo(() => {
    const total = alunos.length;
    const comAtestado = alunos.filter((a) => a.frequencia.atestado > 0).length;
    const comFaltas = alunos.filter((a) => a.frequencia.falta > 0).length;
    const mediaGeral =
      alunos.length > 0
        ? Number(
          (
            alunos.reduce((acc, a) => acc + Number(a.media || 0), 0) /
            alunos.length
          ).toFixed(2)
        )
        : 0;

    return { total, comAtestado, comFaltas, mediaGeral };
  }, [alunos]);

  const alunosFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca);

    if (!termo) return alunos;

    function scoreSimilaridade(valor: string | number | null | undefined) {
      const texto = normalizarTexto(valor);
      if (!texto) return 0;

      const palavras = texto.split(/\s+/).filter(Boolean);

      const palavrasParaComparar =
        termo.length <= 3 ? palavras.slice(0, 1) : palavras;

      if (texto === termo) return 10000;
      if (texto.startsWith(termo)) return 9000;
      if (palavrasParaComparar.some((p) => p === termo)) return 8500;
      if (palavrasParaComparar.some((p) => p.startsWith(termo))) return 8000;
      if (texto.includes(termo)) return 6000;

      let melhor = 0;

      for (const palavra of palavrasParaComparar) {
        const inicio = palavra.slice(0, termo.length);
        const distanciaInicio = distanciaLevenshtein(inicio, termo);

        if (distanciaInicio <= 1) {
          melhor = Math.max(melhor, 5000 - distanciaInicio * 500);
        }

        if (termo.length >= 4) {
          const distanciaPalavra = distanciaLevenshtein(palavra, termo);

          if (distanciaPalavra <= 2) {
            melhor = Math.max(melhor, 4000 - distanciaPalavra * 500);
          }
        }
      }

      return melhor;
    }

    return [...alunos]
      .map((aluno) => {
        const scoreNome = scoreSimilaridade(aluno.nome);
        const scoreMatricula = scoreSimilaridade(aluno.matricula);
        const scoreTurma = scoreSimilaridade(aluno.turma?.nome);
        const scoreSemestre = scoreSimilaridade(aluno.turma?.semestre);
        const scoreDisciplina = scoreSimilaridade(aluno.disciplina?.nome);
        const scoreEmail = termo.length >= 4 ? scoreSimilaridade(aluno.email) : 0;

        return {
          ...aluno,
          scoreBusca:
            scoreNome * 1000000 +
            scoreMatricula * 10000 +
            scoreTurma * 100 +
            scoreSemestre * 10 +
            scoreDisciplina +
            scoreEmail,
        };
      })
      .filter((aluno) => aluno.scoreBusca > 0)
      .sort((a, b) => {
        if (b.scoreBusca !== a.scoreBusca) {
          return b.scoreBusca - a.scoreBusca;
        }

        return a.nome.localeCompare(b.nome);
      });
  }, [alunos, busca]);

  const alunosExibidos = useMemo(() => {
    const lista = [
      ...alunosFiltrados,
    ];

    const nome = (
      aluno: AlunoProfessor
    ) =>
      String(
        aluno.nome || ""
      );

    const media = (
      aluno: AlunoProfessor,
      quandoNulo: number
    ) =>
      aluno.media == null
        ? quandoNulo
        : Number(aluno.media);

    const frequencia = (
      aluno: AlunoProfessor,
      quandoNulo: number
    ) =>
      aluno.frequencia.percentual ==
      null
        ? quandoNulo
        : Number(
            aluno.frequencia
              .percentual
          );

    switch (ordenacao) {
      case "NOME_DESC":
        lista.sort((a, b) =>
          nome(b).localeCompare(
            nome(a)
          )
        );
        break;

      case "MEDIA_DESC":
        lista.sort(
          (a, b) =>
            media(
              b,
              Number.NEGATIVE_INFINITY
            ) -
            media(
              a,
              Number.NEGATIVE_INFINITY
            )
        );
        break;

      case "MEDIA_ASC":
        lista.sort(
          (a, b) =>
            media(
              a,
              Number.POSITIVE_INFINITY
            ) -
            media(
              b,
              Number.POSITIVE_INFINITY
            )
        );
        break;

      case "FREQUENCIA_DESC":
        lista.sort(
          (a, b) =>
            frequencia(
              b,
              Number.NEGATIVE_INFINITY
            ) -
            frequencia(
              a,
              Number.NEGATIVE_INFINITY
            )
        );
        break;

      case "FREQUENCIA_ASC":
        lista.sort(
          (a, b) =>
            frequencia(
              a,
              Number.POSITIVE_INFINITY
            ) -
            frequencia(
              b,
              Number.POSITIVE_INFINITY
            )
        );
        break;

      case "NOME_ASC":
      default:
        lista.sort((a, b) =>
          nome(a).localeCompare(
            nome(b)
          )
        );
        break;
    }

    return lista;
  }, [
    alunosFiltrados,
    ordenacao,
  ]);

  const sugestoesBusca = useMemo(() => {
    const termo = normalizarTexto(busca);

    if (!termo) return [];

    return alunosFiltrados
      .slice(0, 8)
      .map((aluno) => ({
        chave: String(aluno.itemMatriculaId),
        alunoNome: aluno.nome,
        turmaNome: aluno.turma?.nome || t("fallbacks.classUnavailable"),
        disciplinaNome:
          aluno.disciplina?.nome || t("fallbacks.subjectUnavailable"),
        semestre:
          aluno.turma?.semestre || t("fallbacks.periodUnavailable"),
      }));
  }, [busca, alunosFiltrados, t]);
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">
          👨‍🎓 {t("title")}
        </h1>
        <p className="text-gray-600 mt-1">
          {t("description")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">{t("summary.students")}</p>
          <p className="text-2xl font-bold">{resumo.total}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">{t("summary.withAbsences")}</p>
          <p className="text-2xl font-bold">{resumo.comFaltas}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">{t("summary.withMedicalCertificates")}</p>
          <p className="text-2xl font-bold">{resumo.comAtestado}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">{t("summary.overallAverage")}</p>
          <p className="text-2xl font-bold">{resumo.mediaGeral}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t("search.placeholder")}
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setSugestoesAbertas(true);
              }}
              onFocus={() =>
                setSugestoesAbertas(true)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />

            {busca.trim() &&
              sugestoesAbertas && (
                <div className="absolute left-0 right-0 top-[48px] z-50 max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                  {sugestoesBusca.length ===
                  0 ? (
                    <p className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
                      {t(
                        "search.noSuggestions"
                      )}
                    </p>
                  ) : (
                    sugestoesBusca.map(
                      (item) => (
                        <button
                          key={
                            item.chave
                          }
                          type="button"
                          onClick={() => {
                            setBusca(
                              item.alunoNome
                            );
                            setSugestoesAbertas(
                              false
                            );
                          }}
                          className="w-full rounded-xl px-3 py-3 text-left transition hover:bg-slate-100 focus:bg-slate-100 focus:outline-none dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                        >
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {
                              item.alunoNome
                            }
                          </p>

                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {t(
                              "class",
                              {
                                name:
                                  item.turmaNome,
                              }
                            )}{" "}
                            ?{" "}
                            {
                              item.semestre
                            }
                          </p>

                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {
                              item.disciplinaNome
                            }
                          </p>
                        </button>
                      )
                    )
                  )}
                </div>
              )}
          </div>

          <select
            value={turmaId}
            onChange={(e) =>
              setTurmaId(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800 md:w-80"
          >
            <option value="">
              {t(
                "search.allClasses"
              )}
            </option>

            {turmas.map(
              (turma) => (
                <option
                  key={turma.id}
                  value={String(
                    turma.id
                  )}
                >
                  {turma.nome}
                </option>
              )
            )}
          </select>
        </div>

        <div className="mt-4 flex flex-col gap-4 border-t border-slate-200 pt-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label
              htmlFor="ordenacao-alunos"
              className="whitespace-nowrap text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              {t(
                "controls.sortBy"
              )}
            </label>

            <select
              id="ordenacao-alunos"
              value={ordenacao}
              onChange={(e) =>
                setOrdenacao(
                  e.target
                    .value as OrdenacaoAlunos
                )
              }
              className="min-w-[260px] rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
            >
              <option value="NOME_ASC">
                {t(
                  "controls.sort.nameAsc"
                )}
              </option>

              <option value="NOME_DESC">
                {t(
                  "controls.sort.nameDesc"
                )}
              </option>

              <option value="MEDIA_DESC">
                {t(
                  "controls.sort.averageDesc"
                )}
              </option>

              <option value="MEDIA_ASC">
                {t(
                  "controls.sort.averageAsc"
                )}
              </option>

              <option value="FREQUENCIA_DESC">
                {t(
                  "controls.sort.attendanceDesc"
                )}
              </option>

              <option value="FREQUENCIA_ASC">
                {t(
                  "controls.sort.attendanceAsc"
                )}
              </option>
            </select>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {t(
                "controls.view"
              )}
            </span>

            <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-950">
              <button
                type="button"
                aria-pressed={
                  visualizacao ===
                  "CARDS"
                }
                onClick={() => {
                  setVisualizacao(
                    "CARDS"
                  );

                  try {
                    window.localStorage.setItem(
                      "phanyx.professor.alunos.visualizacao",
                      "CARDS"
                    );
                  } catch {
                    // Mantem a troca em memoria.
                  }
                }}
                className={[
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition",
                  visualizacao ===
                  "CARDS"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className="text-base"
                >
                  {"\u25A6"}
                </span>

                {t(
                  "controls.cards"
                )}
              </button>

              <button
                type="button"
                aria-pressed={
                  visualizacao ===
                  "LISTA"
                }
                onClick={() => {
                  setVisualizacao(
                    "LISTA"
                  );

                  try {
                    window.localStorage.setItem(
                      "phanyx.professor.alunos.visualizacao",
                      "LISTA"
                    );
                  } catch {
                    // Mantem a troca em memoria.
                  }
                }}
                className={[
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition",
                  visualizacao ===
                  "LISTA"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className="text-base"
                >
                  {"\u2630"}
                </span>

                {t(
                  "controls.list"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {loading ? (
        <div className="bg-white border rounded-xl p-6 text-gray-600">
          {t("loading")}
        </div>
      ) : alunosExibidos.length === 0 ? (
        <div className="bg-white border rounded-xl p-6 text-gray-600">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-4">
          {alunosExibidos.map((aluno) =>
            visualizacao === "CARDS" ? (
            <div key={aluno.itemMatriculaId} className="bg-white border rounded-xl p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-lg">{aluno.nome}</p>
                  <p className="text-sm text-gray-600">{aluno.email || "-"}</p>
                  <p className="text-sm text-gray-600">
                    {t("registration")}: {aluno.matricula || "-"}
                  </p>
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    {t("studentStatus")}: {labelStatusAluno(aluno.statusAluno, t)}
                  </p>
                  <p>
                    {t("subjectStatus")}: {labelStatusDisciplina(aluno.statusDisciplina, t)}
                  </p>
                  <p>
                    {t("classLabel")}: {aluno.turma?.nome || "-"}
                  </p>
                  <p>
                    {t("subject")}: {aluno.disciplina?.nome || "-"}
                  </p>
                  <p>
                    {t("semester")}: {aluno.turma?.semestre || "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">{t("grades.title")}</p>
                  <p className="mt-2 text-sm text-gray-700">
                    {t("grades.entered")}: {aluno.notas.length}
                  </p>
                  <p className="text-sm text-gray-700">
                    {t("grades.average")}: {aluno.media ?? "-"}
                  </p>
                  <p className="text-sm text-gray-700">
                    {t("grades.values")}:{" "}
                    {aluno.notas.length > 0 ? aluno.notas.join(", ") : "-"}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">{t("attendance.title")}</p>
                  <p className="mt-2 text-sm text-gray-700">
                    {t("attendance.percentage")}:{" "}
                    {aluno.frequencia.percentual ?? "-"}%
                  </p>
                  <p className="text-sm text-gray-700">
                    {t("attendance.presences")}: {aluno.frequencia.presente}
                  </p>
                  <p className="text-sm text-gray-700">
                    {t("attendance.absences")}: {aluno.frequencia.falta}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    {t("justifications.title")}
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    {t("justifications.justified")}:{" "}
                    {aluno.frequencia.justificada}
                  </p>
                  <p className="text-sm text-gray-700">
                    {t("justifications.medicalCertificates")}:{" "}
                    {aluno.frequencia.atestado}
                  </p>
                  <p className="text-sm text-gray-700">
                    {t("justifications.totalRecords")}:{" "}
                    {aluno.frequencia.total}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={aluno.itemMatriculaId}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
            >
              <button
                type="button"
                aria-expanded={
                  alunoExpandidoId ===
                  aluno.itemMatriculaId
                }
                onClick={() => {
                  const vaiAbrir =
                    alunoExpandidoId !==
                    aluno.itemMatriculaId;

                  setAlunoExpandidoId(
                    vaiAbrir
                      ? aluno.itemMatriculaId
                      : null
                  );

                  if (vaiAbrir) {
                    void carregarProgressoAluno(
                      aluno
                    );
                  }
                }}
                className="grid w-full cursor-pointer gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-slate-800/60 dark:focus:bg-slate-800/60 lg:grid-cols-[minmax(160px,1fr)_minmax(150px,.9fr)_minmax(230px,1.5fr)_minmax(110px,.7fr)_minmax(95px,.55fr)_minmax(120px,.7fr)_32px] lg:items-center"
              >
                <p className="truncate font-bold text-slate-900 dark:text-white">
                  {aluno.nome}
                </p>

                <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {aluno.turma?.nome ||
                    "-"}
                </p>

                <p className="truncate text-sm text-slate-600 dark:text-slate-300">
                  {aluno.disciplina?.nome ||
                    "-"}
                </p>

                <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {labelStatusDisciplina(
                    aluno.statusDisciplina,
                    t
                  )}
                </p>

                <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">
                    {t(
                      "grades.average"
                    )}:
                  </span>{" "}
                  {aluno.media ?? "-"}
                </p>

                <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">
                    {t(
                      "attendance.title"
                    )}:
                  </span>{" "}
                  {aluno.frequencia
                    .percentual ?? "-"}%
                </p>

                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center justify-self-end rounded-lg border border-slate-200 bg-slate-50 text-base font-black text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                >
                  {alunoExpandidoId ===
                  aluno.itemMatriculaId
                    ? "-"
                    : "+"}
                </span>
              </button>

              {alunoExpandidoId ===
                aluno.itemMatriculaId && (
                <div className="border-t border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                  <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                    <div>
                      <p className="mt-1 break-all text-slate-800 dark:text-slate-200">
                        {aluno.email ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {t(
                          "registration"
                        )}
                      </p>
                      <p className="mt-1 text-slate-800 dark:text-slate-200">
                        {aluno.matricula ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {t(
                          "semester"
                        )}
                      </p>
                      <p className="mt-1 text-slate-800 dark:text-slate-200">
                        {aluno.turma
                          ?.semestre ||
                          "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {t(
                          "studentStatus"
                        )}
                      </p>
                      <p className="mt-1 text-slate-800 dark:text-slate-200">
                        {labelStatusAluno(
                          aluno.statusAluno,
                          t
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {t(
                          "subjectStatus"
                        )}
                      </p>
                      <p className="mt-1 text-slate-800 dark:text-slate-200">
                        {labelStatusDisciplina(
                          aluno.statusDisciplina,
                          t
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {t(
                          "grades.title"
                        )}
                      </p>

                      <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <p>
                          {t(
                            "grades.entered"
                          )}
                          :{" "}
                          {
                            aluno.notas
                              .length
                          }
                        </p>

                        <p>
                          {t(
                            "grades.average"
                          )}
                          :{" "}
                          {aluno.media ??
                            "-"}
                        </p>

                        <p>
                          {t(
                            "grades.values"
                          )}
                          :{" "}
                          {aluno.notas
                            .length > 0
                            ? aluno.notas.join(
                                ", "
                              )
                            : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {t(
                          "attendance.title"
                        )}
                      </p>

                      <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <p>
                          {t(
                            "attendance.percentage"
                          )}
                          :{" "}
                          {aluno
                            .frequencia
                            .percentual ??
                            "-"}
                          %
                        </p>

                        <p>
                          {t(
                            "attendance.presences"
                          )}
                          :{" "}
                          {
                            aluno
                              .frequencia
                              .presente
                          }
                        </p>

                        <p>
                          {t(
                            "attendance.absences"
                          )}
                          :{" "}
                          {
                            aluno
                              .frequencia
                              .falta
                          }
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {t(
                          "justifications.title"
                        )}
                      </p>

                      <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <p>
                          {t(
                            "justifications.justified"
                          )}
                          :{" "}
                          {
                            aluno
                              .frequencia
                              .justificada
                          }
                        </p>

                        <p>
                          {t(
                            "justifications.medicalCertificates"
                          )}
                          :{" "}
                          {
                            aluno
                              .frequencia
                              .atestado
                          }
                        </p>

                        <p>
                          {t(
                            "justifications.totalRecords"
                          )}
                          :{" "}
                          {
                            aluno
                              .frequencia
                              .total
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white">
                          {t(
                            "progress.title"
                          )}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {t(
                            "progress.description"
                          )}
                        </p>
                      </div>

                      {progressoPorItem[
                        aluno.itemMatriculaId
                      ] && (
                        <div className="flex flex-wrap gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {t(
                              "progress.summary.total"
                            )}
                            :{" "}
                            {
                              progressoPorItem[
                                aluno
                                  .itemMatriculaId
                              ]!.resumo.total
                            }
                          </span>

                          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                            {t(
                              "progress.summary.inProgress"
                            )}
                            :{" "}
                            {
                              progressoPorItem[
                                aluno
                                  .itemMatriculaId
                              ]!.resumo
                                .emAndamento
                            }
                          </span>

                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {t(
                              "progress.summary.completed"
                            )}
                            :{" "}
                            {
                              progressoPorItem[
                                aluno
                                  .itemMatriculaId
                              ]!.resumo
                                .concluidas
                            }
                          </span>
                        </div>
                      )}
                    </div>

                    {progressoCarregando[
                      aluno.itemMatriculaId
                    ] ? (
                      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        {t(
                          "progress.loading"
                        )}
                      </div>
                    ) : progressoErro[
                        aluno.itemMatriculaId
                      ] ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                        {
                          progressoErro[
                            aluno
                              .itemMatriculaId
                          ]
                        }
                      </div>
                    ) : progressoPorItem[
                        aluno.itemMatriculaId
                      ]?.aulas.length ? (
                      <div className="space-y-2">
                        {progressoPorItem[
                          aluno.itemMatriculaId
                        ]!.aulas.map(
                          (aula) => (
                            <div
                              key={
                                aula.aulaId
                              }
                              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                            >
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 dark:text-white">
                                    {
                                      aula.titulo
                                    }
                                  </p>

                                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {aula.status ===
                                    "CONCLUIDA"
                                      ? t(
                                          "progress.status.completed"
                                        )
                                      : aula.status ===
                                          "EM_ANDAMENTO"
                                        ? t(
                                            "progress.status.inProgress"
                                          )
                                        : t(
                                            "progress.status.notStarted"
                                          )}
                                  </p>
                                </div>

                                <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                  <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {t(
                                        "progress.playback"
                                      )}
                                    </p>

                                    <p className="font-bold text-slate-900 dark:text-white">
                                      {formatarTempo(
                                        aula.tempoAssistidoSegundos
                                      )}{" "}
                                      /{" "}
                                      {formatarTempo(
                                        aula.tempoMinimoSegundos
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {t(
                                        "progress.percentage"
                                      )}
                                    </p>

                                    <p className="font-bold text-slate-900 dark:text-white">
                                      {aula.percentual ==
                                      null
                                        ? "-"
                                        : `${aula.percentual}%`}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {t(
                                        "progress.lessonCompleted"
                                      )}
                                    </p>

                                    <p className="font-bold text-slate-900 dark:text-white">
                                      {aula.concluida
                                        ? t(
                                            "progress.yes"
                                          )
                                        : t(
                                            "progress.no"
                                          )}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {t(
                                        "progress.lastActivity"
                                      )}
                                    </p>

                                    <p className="font-bold text-slate-900 dark:text-white">
                                      {formatarDataHora(
                                        aula.ultimaAtividade
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                <div
                                  className={[
                                    "h-full rounded-full transition-all",
                                    aula.concluida
                                      ? "bg-emerald-500"
                                      : "bg-blue-600",
                                  ].join(
                                    " "
                                  )}
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      Math.min(
                                        100,
                                        Number(
                                          aula.percentual ||
                                            0
                                        )
                                      )
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : progressoPorItem[
                        aluno.itemMatriculaId
                      ] ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        {t(
                          "progress.empty"
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )
          )}
        </div>
      )}
    </div>
  );
}