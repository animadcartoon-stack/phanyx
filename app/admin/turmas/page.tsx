"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import withAuth from "@/components/auth/withAuth";

interface Curso {
  id: number;
  nome: string;
  codigo?: string | null;
}

interface Disciplina {
  id: number;
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  cursoId?: number | null;
  semestre?: number | null;
  curso?: Curso | null;

  turmaDisciplinaId?: number | null;
  professorId?: number | null;
  professor?: Professor | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  status?: string | null;

  horarios?: {
    id?: number;
    diaSemana: number;
    horaInicio: string;
    horaFim?: string | null;
    ativo?: boolean;
  }[];

  professoresHabilitados?: {
    professorId: number;
    professor?: Professor | null;
  }[];
}

interface Professor {
  id: number;
  nome: string;
}

type StatusTurma =
  | "AGUARDANDO"
  | "A_INICIAR"
  | "ATIVA"
  | "INATIVA"
  | "CONCLUIDA"
  | "CANCELADA"
  | "NAO_FORMADA";

interface Turma {
  id: number;
  nome: string;
  codigo?: string | null;
  semestre: string;
  periodoLetivo?: string | null;
  turno?: string | null;
  modalidade?: string | null;
  predio?: string | null;
  ala?: string | null;
  andar?: string | null;
  sala?: string | null;

  ativa: boolean;
  statusTurma?: StatusTurma;
  capacidadeMinima?: number | null;
  capacidadeMaxima?: number | null;
  cursoId?: number | null;
  curso?: Curso | null;
  professorId?: number | null;
  professor?: Professor | null;
  disciplinas?: Disciplina[];
  matriculados?: number;
  _count?: {
    itensMatricula: number;
  };
}

type FeedbackTipo = "sucesso" | "erro" | "";

function AdminTurmasPage() {
  const t = useTranslations("AdminOperations");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [polos, setPolos] = useState<any[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [professorId, setProfessorId] = useState("");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoId, setCursoId] = useState("");
  const [poloId, setPoloId] = useState("");
  const [busca, setBusca] = useState("");
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [semestre, setSemestre] = useState("");
  const [periodoLetivo, setPeriodoLetivo] = useState("");

  const [turno, setTurno] = useState("");
  const [modalidade, setModalidade] =
    useState("PRESENCIAL");

  const [
    buscaDisciplina,
    setBuscaDisciplina,
  ] = useState("");

  const [predio, setPredio] = useState("");
  const [ala, setAla] = useState("");
  const [andar, setAndar] = useState("");
  const [sala, setSala] = useState("");
  const [statusTurma, setStatusTurma] = useState<StatusTurma>("AGUARDANDO");
  const [ativa, setAtiva] = useState(true);
  const [capacidadeMinima, setCapacidadeMinima] = useState("");
  const [capacidadeMaxima, setCapacidadeMaxima] = useState("");
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<number[]>([]);
  const [disciplinasAbertas, setDisciplinasAbertas] = useState(false);
  const [professoresPorDisciplina, setProfessoresPorDisciplina] = useState<Record<number, string>>({});
  const [datasInicioPorDisciplina, setDatasInicioPorDisciplina] = useState<Record<number, string>>({});
  const [datasFimPorDisciplina, setDatasFimPorDisciplina] = useState<Record<number, string>>({});
  const [statusPorDisciplina, setStatusPorDisciplina] = useState<Record<number, string>>({});
  const [horariosPorDisciplina, setHorariosPorDisciplina] = useState<
    Record<number, { diaSemana: string; horaInicio: string; horaFim: string }[]>
  >({});
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [editNome, setEditNome] = useState("");
  const [editCodigo, setEditCodigo] = useState("");
  const [editSemestre, setEditSemestre] = useState("");
  const [editPeriodoLetivo, setEditPeriodoLetivo] = useState("");

  const [editTurno, setEditTurno] =
    useState("");

  const [
    editModalidade,
    setEditModalidade,
  ] = useState("PRESENCIAL");

  const [
    editBuscaDisciplina,
    setEditBuscaDisciplina,
  ] = useState("");

  const [editPredio, setEditPredio] = useState("");
  const [editAla, setEditAla] = useState("");
  const [editAndar, setEditAndar] = useState("");
  const [editSala, setEditSala] = useState("");
  const [editStatusTurma, setEditStatusTurma] =
    useState<StatusTurma>("AGUARDANDO");
  const [editAtiva, setEditAtiva] = useState(true);
  const [editCapacidadeMinima, setEditCapacidadeMinima] = useState("");
  const [editCapacidadeMaxima, setEditCapacidadeMaxima] = useState("");
  const [editDisciplinasSelecionadas, setEditDisciplinasSelecionadas] = useState<number[]>([]);
  const [editDisciplinasAbertas, setEditDisciplinasAbertas] = useState(false);
  const [editProfessorId, setEditProfessorId] = useState("");

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [criando, setCriando] = useState(false);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [turmaParaExcluir, setTurmaParaExcluir] = useState<Turma | null>(null);

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

  async function carregarTurmas() {
    const res = await fetch("/api/turma", {
      credentials: "include",
    });

    const data = await res.json();
    setTurmas(Array.isArray(data) ? data : []);
  }

  async function carregarDisciplinas() {
    const res = await fetch("/api/disciplina", {
      credentials: "include",
    });

    const data = await res.json();
    setDisciplinas(Array.isArray(data) ? data : []);
  }

  async function carregarPolos() {
    const res = await fetch("/api/admin/polos", {
      credentials: "include",
    });

    const data = await res.json();
    setPolos(Array.isArray(data) ? data : []);
  }

  async function carregarProfessores() {
    const res = await fetch("/api/professor", {
      credentials: "include",
    });

    const data = await res.json();
    setProfessores(Array.isArray(data) ? data : []);
  }

  async function carregarCursos() {
    const res = await fetch("/api/curso", {
      credentials: "include",
    });

    const data = await res.json();
    setCursos(Array.isArray(data) ? data : []);
  }

  async function criarTurma(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCriando(true);

      const res = await fetch("/api/turma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome,
          codigo,
          semestre,
          cursoId,
          periodoLetivo,
          turno,
          modalidade,
          statusTurma,
          predio,
          ala,
          andar,
          sala,
          ativa,
          capacidadeMinima,
          capacidadeMaxima,
          disciplinaIds: disciplinasSelecionadas,
          professoresPorDisciplina,
          datasInicioPorDisciplina,
          datasFimPorDisciplina,
          statusPorDisciplina,
          horariosPorDisciplina,
          poloId,
          professorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error((locale.startsWith("pt") ? (data.detalhe || data.error || t("classesCreateError")) : t("classesCreateError")));
      }

      setNome("");
      setCodigo("");
      setSemestre("");
      setCursoId("");
      setProfessorId("");
      setPoloId("");
      setPeriodoLetivo("");
      setTurno("");
      setModalidade("PRESENCIAL");
      setBuscaDisciplina("");
      setPredio("");
      setAla("");
      setAndar("");
      setSala("");
      setStatusTurma("AGUARDANDO");
      setAtiva(true);
      setCapacidadeMinima("");
      setCapacidadeMaxima("");
      setDisciplinasSelecionadas([]);
      setProfessoresPorDisciplina({});
      setDatasInicioPorDisciplina({});
      setDatasFimPorDisciplina({});
      setStatusPorDisciplina({});
      setHorariosPorDisciplina({});
      await carregarTurmas();
      mostrarFeedback("sucesso", t("classesCreated"));
    } catch (error: any) {
      mostrarFeedback("erro", (locale.startsWith("pt") ? (error?.message || t("classesCreateError")) : t("classesCreateError")));
    } finally {
      setCriando(false);
    }
  }

  function iniciarEdicao(turma: Turma) {
    setEditandoId(turma.id);
    setEditNome(turma.nome || "");
    setEditCodigo(turma.codigo || "");
    setEditSemestre(turma.semestre || "");
    setEditPeriodoLetivo(turma.periodoLetivo || "");
    setEditTurno(turma.turno || "");

    setEditModalidade(
      turma.modalidade || "PRESENCIAL",
    );

    setEditBuscaDisciplina("");
    setEditPredio(turma.predio || "");
    setEditAla(turma.ala || "");
    setEditAndar(turma.andar || "");
    setEditSala(turma.sala || "");
    setEditStatusTurma(turma.statusTurma || "AGUARDANDO");
    setEditAtiva(Boolean(turma.ativa));
    setEditCapacidadeMinima(
      turma.capacidadeMinima !== null && turma.capacidadeMinima !== undefined
        ? String(turma.capacidadeMinima)
        : ""
    );
    setEditCapacidadeMaxima(
      turma.capacidadeMaxima !== null && turma.capacidadeMaxima !== undefined
        ? String(turma.capacidadeMaxima)
        : ""
    );
    const vinculos = Array.isArray(
      turma.disciplinas,
    )
      ? turma.disciplinas
      : [];

    setEditDisciplinasSelecionadas(
      vinculos
        .map((disciplina) =>
          Number(disciplina.id),
        )
        .filter((id) =>
          Number.isFinite(id),
        ),
    );

    setProfessoresPorDisciplina(
      Object.fromEntries(
        vinculos.map((disciplina) => [
          disciplina.id,
          disciplina.professorId
            ? String(
              disciplina.professorId,
            )
            : "",
        ]),
      ),
    );

    setDatasInicioPorDisciplina(
      Object.fromEntries(
        vinculos.map((disciplina) => [
          disciplina.id,
          disciplina.dataInicio
            ? String(
              disciplina.dataInicio,
            ).slice(0, 10)
            : "",
        ]),
      ),
    );

    setDatasFimPorDisciplina(
      Object.fromEntries(
        vinculos.map((disciplina) => [
          disciplina.id,
          disciplina.dataFim
            ? String(
              disciplina.dataFim,
            ).slice(0, 10)
            : "",
        ]),
      ),
    );

    setStatusPorDisciplina(
      Object.fromEntries(
        vinculos.map((disciplina) => [
          disciplina.id,
          disciplina.status || "",
        ]),
      ),
    );

    setHorariosPorDisciplina(
      Object.fromEntries(
        vinculos.map((disciplina) => [
          disciplina.id,
          Array.isArray(
            disciplina.horarios,
          )
            ? disciplina.horarios.map(
              (horario) => ({
                diaSemana: String(
                  horario.diaSemana,
                ),
                horaInicio:
                  horario.horaInicio ||
                  "",
                horaFim:
                  horario.horaFim ||
                  "",
              }),
            )
            : [],
        ]),
      ),
    );

    setEditDisciplinasAbertas(false);

    setEditProfessorId(
      turma.professorId
        ? String(turma.professorId)
        : "",
    );
  }

  async function salvarEdicao(id: number) {
    try {
      setSalvandoId(id);

      const res = await fetch(`/api/turma/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome: editNome,
          codigo: editCodigo,
          semestre: editSemestre,
          periodoLetivo: editPeriodoLetivo,
          turno: editTurno,
          modalidade: editModalidade,
          predio: editPredio,
          ala: editAla,
          andar: editAndar,
          sala: editSala,
          statusTurma: editStatusTurma,
          ativa: editAtiva,
          capacidadeMinima: editCapacidadeMinima,
          capacidadeMaxima: editCapacidadeMaxima,
          disciplinaIds: editDisciplinasSelecionadas,
          professoresPorDisciplina,
          datasInicioPorDisciplina,
          datasFimPorDisciplina,
          statusPorDisciplina,
          horariosPorDisciplina,
          professorId: editProfessorId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error((locale.startsWith("pt") ? (data.error || t("classesUpdateError")) : t("classesUpdateError")));
      }

      setEditandoId(null);
      await carregarTurmas();
      mostrarFeedback("sucesso", t("classesUpdated"));
    } catch (error: any) {
      mostrarFeedback("erro", (locale.startsWith("pt") ? (error?.message || t("classesUpdateError")) : t("classesUpdateError")));
    } finally {
      setSalvandoId(null);
    }
  }

  async function confirmarExclusaoTurma() {
    if (!turmaParaExcluir) return;

    try {
      setExcluindoId(turmaParaExcluir.id);

      const res = await fetch(`/api/turma/${turmaParaExcluir.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error((locale.startsWith("pt") ? (data.error || t("classesDeleteError")) : t("classesDeleteError")));
      }

      setTurmaParaExcluir(null);
      await carregarTurmas();
      mostrarFeedback("sucesso", t("classesDeleted"));
    } catch (error: any) {
      mostrarFeedback("erro", (locale.startsWith("pt") ? (error?.message || t("classesDeleteError")) : t("classesDeleteError")));
    } finally {
      setExcluindoId(null);
    }
  }

  useEffect(() => {
    carregarTurmas();
    carregarDisciplinas();
    carregarPolos();
    carregarCursos();
    carregarProfessores();
  }, []);

  useEffect(() => {
    setDisciplinasSelecionadas([]);
    setProfessoresPorDisciplina({});
    setDatasInicioPorDisciplina({});
    setDatasFimPorDisciplina({});
    setStatusPorDisciplina({});
    setHorariosPorDisciplina({});
    setBuscaDisciplina("");
  }, [cursoId, semestre]);

  useEffect(() => {
    const buscaUrl = searchParams.get("busca");
    if (buscaUrl) {
      setBusca(buscaUrl);
    }
  }, [searchParams]);

  const turmasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return turmas;

    return turmas.filter((turma) => {
      const nome = String(turma.nome || "").toLowerCase();
      const codigo = String(turma.codigo || "").toLowerCase();
      const semestre = String(turma.semestre || "").toLowerCase();
      const periodoLetivo = String(turma.periodoLetivo || "").toLowerCase();
      const disciplina = String(
        turma.disciplinas?.map((d) => d.nome).join(" | ") || ""
      ).toLowerCase();

      const curso = String(turma.curso?.nome || "").toLowerCase();

      const status = String(turma.statusTurma || "").toLowerCase();
      const capacidadeMinima = String(turma.capacidadeMinima || "").toLowerCase();
      const capacidadeMaxima = String(turma.capacidadeMaxima || "").toLowerCase();

      return (
        nome.includes(termo) ||
        codigo.includes(termo) ||
        semestre.includes(termo) ||
        periodoLetivo.includes(termo) ||
        disciplina.includes(termo) ||
        curso.includes(termo) ||
        status.includes(termo) ||
        capacidadeMinima.includes(termo) ||
        capacidadeMaxima.includes(termo)
      );
    });
  }, [turmas, busca]);

  function professoresDaDisciplina(disciplina: Disciplina) {
    const habilitados = Array.isArray(disciplina.professoresHabilitados)
      ? disciplina.professoresHabilitados
        .map((item) => item.professor)
        .filter((professor): professor is Professor => !!professor)
      : [];

    return habilitados.length > 0 ? habilitados : professores;
  }

  function numeroSemestre(valor: string) {
    const texto = String(valor || "").trim();

    if (!texto) return null;

    const primeiroNumero = texto.match(/\d+/)?.[0];
    const numero = primeiroNumero ? Number(primeiroNumero) : null;

    return Number.isFinite(numero) ? numero : null;
  }

  const SINONIMOS_DISCIPLINAS: Record<
    string,
    string[]
  > = {
    etica: [
      "moral",
      "conduta",
      "valores",
      "bioetica",
    ],

    gestao: [
      "administracao",
      "lideranca",
      "planejamento",
    ],

    biblia: [
      "biblico",
      "biblica",
      "escrituras",
      "testamento",
    ],

    igreja: [
      "eclesiologia",
      "ministerio",
      "pastoral",
      "congregacao",
    ],

    aconselhamento: [
      "pastoral",
      "orientacao",
      "cuidado",
      "psicologia",
    ],

    comunicacao: [
      "oratoria",
      "homiletica",
      "pregacao",
      "expressao",
    ],

    missao: [
      "missoes",
      "missionario",
      "evangelismo",
    ],

    educacao: [
      "ensino",
      "didatica",
      "pedagogia",
      "aprendizagem",
    ],

    historia: [
      "historico",
      "historica",
      "antiguidade",
    ],
  };

  function normalizarBuscaDisciplina(
    valor?: string | null,
  ) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();
  }

  function expandirTermoDisciplina(
    termo: string,
  ) {
    const variacoes = new Set<string>([
      termo,
    ]);

    if (
      termo.endsWith("s") &&
      termo.length > 3
    ) {
      variacoes.add(
        termo.slice(0, -1),
      );
    } else if (termo.length > 3) {
      variacoes.add(`${termo}s`);
    }

    for (const [
      termoPrincipal,
      sinonimos,
    ] of Object.entries(
      SINONIMOS_DISCIPLINAS,
    )) {
      const grupo = [
        termoPrincipal,
        ...sinonimos,
      ].map(normalizarBuscaDisciplina);

      if (grupo.includes(termo)) {
        for (const item of grupo) {
          variacoes.add(item);
        }
      }
    }

    return Array.from(variacoes);
  }

  function pontuarDisciplina(
    disciplina: Disciplina,
    busca: string,
  ) {
    const buscaNormalizada =
      normalizarBuscaDisciplina(busca);

    if (!buscaNormalizada) {
      return 1;
    }

    const termos = buscaNormalizada
      .split(" ")
      .filter(
        (termo) =>
          termo.length >= 2,
      );

    if (termos.length === 0) {
      return 0;
    }

    const nome =
      normalizarBuscaDisciplina(
        disciplina.nome,
      );

    const codigo =
      normalizarBuscaDisciplina(
        disciplina.codigo,
      );

    const curso =
      normalizarBuscaDisciplina(
        disciplina.curso?.nome,
      );

    const descricao =
      normalizarBuscaDisciplina(
        disciplina.descricao,
      );

    const semestreTexto =
      disciplina.semestre
        ? normalizarBuscaDisciplina(`${t("classesSemester")} ${disciplina.semestre}`)
        : "";

    let pontuacao = 0;

    if (nome === buscaNormalizada) {
      pontuacao += 1000;
    } else if (
      nome.startsWith(
        buscaNormalizada,
      )
    ) {
      pontuacao += 700;
    } else if (
      nome.includes(
        buscaNormalizada,
      )
    ) {
      pontuacao += 450;
    }

    if (
      codigo === buscaNormalizada
    ) {
      pontuacao += 900;
    } else if (
      codigo.startsWith(
        buscaNormalizada,
      )
    ) {
      pontuacao += 600;
    }

    for (const termo of termos) {
      const variacoes =
        expandirTermoDisciplina(
          termo,
        );

      let encontrouTermo = false;

      for (const variacao of variacoes) {
        if (
          nome.includes(variacao)
        ) {
          pontuacao += 100;
          encontrouTermo = true;
          break;
        }

        if (
          codigo.includes(variacao)
        ) {
          pontuacao += 90;
          encontrouTermo = true;
          break;
        }

        if (
          curso.includes(variacao)
        ) {
          pontuacao += 45;
          encontrouTermo = true;
          break;
        }

        if (
          semestreTexto.includes(
            variacao,
          )
        ) {
          pontuacao += 35;
          encontrouTermo = true;
          break;
        }

        if (
          descricao.includes(
            variacao,
          )
        ) {
          pontuacao += 15;
          encontrouTermo = true;
          break;
        }
      }

      if (!encontrouTermo) {
        return 0;
      }
    }

    return pontuacao;
  }

  function filtrarDisciplinasInteligentes(
    lista: Disciplina[],
    busca: string,
    selecionadas: number[],
  ) {
    const buscaNormalizada =
      normalizarBuscaDisciplina(
        busca,
      );

    return lista
      .map((disciplina) => ({
        disciplina,
        selecionada:
          selecionadas.includes(
            disciplina.id,
          ),

        pontuacao:
          pontuarDisciplina(
            disciplina,
            busca,
          ),
      }))
      .filter(
        (item) =>
          !buscaNormalizada ||
          item.pontuacao > 0 ||
          item.selecionada,
      )
      .sort((a, b) => {
        if (
          a.selecionada !==
          b.selecionada
        ) {
          return a.selecionada
            ? -1
            : 1;
        }

        return (
          b.pontuacao -
          a.pontuacao ||
          a.disciplina.nome.localeCompare(
            b.disciplina.nome,
            "pt-BR",
          )
        );
      })
      .map(
        (item) =>
          item.disciplina,
      );
  }

  const disciplinasBaseCriacao =
    useMemo(() => {
      const cursoSelecionado =
        cursoId
          ? Number(cursoId)
          : null;

      const semestreSelecionado =
        numeroSemestre(semestre);

      return disciplinas.filter(
        (disciplina) => {
          const mesmoCurso =
            !cursoSelecionado ||
            Number(
              disciplina.cursoId,
            ) === cursoSelecionado;

          const mesmoSemestre =
            !semestreSelecionado ||
            Number(
              disciplina.semestre,
            ) === semestreSelecionado;

          return (
            mesmoCurso &&
            mesmoSemestre
          );
        },
      );
    }, [
      disciplinas,
      cursoId,
      semestre,
    ]);

  const disciplinasFiltradas =
    useMemo(
      () =>
        filtrarDisciplinasInteligentes(
          disciplinasBaseCriacao,
          buscaDisciplina,
          disciplinasSelecionadas,
        ),
      [
        disciplinasBaseCriacao,
        buscaDisciplina,
        disciplinasSelecionadas,
        t,
      ],
    );

  const turmaEmEdicao = useMemo(
    () =>
      turmas.find(
        (turma) =>
          turma.id === editandoId,
      ) || null,
    [turmas, editandoId],
  );

  const disciplinasBaseEdicao =
    useMemo(() => {
      const cursoSelecionado =
        turmaEmEdicao?.cursoId
          ? Number(
            turmaEmEdicao.cursoId,
          )
          : null;

      const semestreSelecionado =
        numeroSemestre(
          editSemestre,
        );

      return disciplinas.filter(
        (disciplina) => {
          const jaSelecionada =
            editDisciplinasSelecionadas.includes(
              disciplina.id,
            );

          const mesmoCurso =
            !cursoSelecionado ||
            Number(
              disciplina.cursoId,
            ) === cursoSelecionado;

          const mesmoSemestre =
            !semestreSelecionado ||
            Number(
              disciplina.semestre,
            ) === semestreSelecionado;

          return (
            jaSelecionada ||
            (mesmoCurso &&
              mesmoSemestre)
          );
        },
      );
    }, [
      disciplinas,
      turmaEmEdicao,
      editSemestre,
      editDisciplinasSelecionadas,
    ]);

  const editDisciplinasFiltradas =
    useMemo(
      () =>
        filtrarDisciplinasInteligentes(
          disciplinasBaseEdicao,
          editBuscaDisciplina,
          editDisciplinasSelecionadas,
        ),
      [
        disciplinasBaseEdicao,
        editBuscaDisciplina,
        editDisciplinasSelecionadas,
        t,
      ],
    );

  function labelStatusTurma(status?: StatusTurma) {
    switch (status) {
      case "AGUARDANDO":
        return t("classesWaiting");
      case "A_INICIAR":
        return t("classesUpcoming");
      case "ATIVA":
        return t("classesActive");
      case "INATIVA":
        return t("classesInactive");
      case "CONCLUIDA":
        return t("classesCompleted");
      case "CANCELADA":
        return t("classesCancelled");
      case "NAO_FORMADA":
        return t("classesNotFormed");
      default:
        return "-";
    }
  }

  return (
  <>
    <style jsx global>{`
      html[data-theme="light"] .phanyx-turmas-form label {
        color: #334155 !important;
        -webkit-text-fill-color: #334155 !important;
        opacity: 1 !important;
        font-weight: 600 !important;
      }

      html[data-theme="light"]
        .phanyx-turmas-form
        input:not([type="checkbox"]),
      html[data-theme="light"]
        .phanyx-turmas-form
        select,
      html[data-theme="light"]
        .phanyx-turmas-form
        textarea {
        background: #ffffff !important;
        color: #0f172a !important;
        -webkit-text-fill-color: #0f172a !important;
        border-color: #cbd5e1 !important;
        opacity: 1 !important;
      }

      html[data-theme="light"]
        .phanyx-turmas-form
        input::placeholder,
      html[data-theme="light"]
        .phanyx-turmas-form
        textarea::placeholder {
        color: #64748b !important;
        -webkit-text-fill-color: #64748b !important;
        opacity: 1 !important;
      }

      html[data-theme="dark"] .phanyx-turmas-form label {
        color: #e2e8f0 !important;
        -webkit-text-fill-color: #e2e8f0 !important;
        opacity: 1 !important;
      }

      html[data-theme="dark"]
        .phanyx-turmas-form
        input:not([type="checkbox"]),
      html[data-theme="dark"]
        .phanyx-turmas-form
        select,
      html[data-theme="dark"]
        .phanyx-turmas-form
        textarea {
        background: #0f172a !important;
        color: #f8fafc !important;
        -webkit-text-fill-color: #f8fafc !important;
        border-color: #475569 !important;
        opacity: 1 !important;
      }

      html[data-theme="dark"]
        .phanyx-turmas-form
        input::placeholder,
      html[data-theme="dark"]
        .phanyx-turmas-form
        textarea::placeholder {
        color: #94a3b8 !important;
        -webkit-text-fill-color: #94a3b8 !important;
        opacity: 1 !important;
      }

      html[data-theme="system"] .phanyx-turmas-form label {
        color: #e5e5e5 !important;
        -webkit-text-fill-color: #e5e5e5 !important;
        opacity: 1 !important;
      }

      html[data-theme="system"]
        .phanyx-turmas-form
        input:not([type="checkbox"]),
      html[data-theme="system"]
        .phanyx-turmas-form
        select,
      html[data-theme="system"]
        .phanyx-turmas-form
        textarea {
        background: #262626 !important;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        border-color: #5f5f5f !important;
        opacity: 1 !important;
      }

      html[data-theme="system"]
        .phanyx-turmas-form
        input::placeholder,
      html[data-theme="system"]
        .phanyx-turmas-form
        textarea::placeholder {
        color: #b8b8b8 !important;
        -webkit-text-fill-color: #b8b8b8 !important;
        opacity: 1 !important;
      }
    `}</style>

    <div className="max-w-5xl space-y-6">
        {feedback && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${feedbackTipo === "sucesso"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                    }`}
                >
                  {feedbackTipo === "sucesso" ? "✅" : "⚠️"}
                </div>

                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900">
                    {feedbackTipo === "sucesso"
                      ? t("commonDone")
                      : t("commonNoAction")}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {feedback}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFeedback("");
                    setFeedbackTipo("");
                  }}
                  className="rounded-2xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700"
                >
                  {t("commonUnderstood")}
                </button>
              </div>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold">{t("classesTitle")}</h1>

        <form
          onSubmit={criarTurma}
          className="phanyx-turmas-form space-y-4 rounded-lg border bg-white p-6"
        >
          <h2 className="font-semibold">{t("classesNew")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder={t("classesName")}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            />

            <input
              placeholder={t("classesCode")}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full border rounded-lg p-2"
            />

            <select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              className="w-full border rounded-lg p-2"
              required
            >
              <option value="">{t("commonChooseCourse")}</option>
              {cursos.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.nome}
                </option>
              ))}
            </select>
            <select
              value={professorId}
              onChange={(e) => setProfessorId(e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="">{t("commonTeacherResponsible")}</option>
              {professores.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nome}
                </option>
              ))}
            </select>
            <div>
              <label className="text-sm text-gray-600">{t("classesSemester")}</label>
              <input
                value={semestre}
                onChange={(e) => setSemestre(e.target.value)}
                className="w-full border rounded-lg p-2"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 dark:text-slate-300">
                {t("classesTerm")}
              </label>

              <input
                value={periodoLetivo}
                onChange={(e) =>
                  setPeriodoLetivo(e.target.value)
                }
                placeholder="Ex.: 2027.1"
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 dark:text-slate-300">
                {t("classesShift")}
              </label>

              <select
                value={turno}
                onChange={(e) =>
                  setTurno(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">
                  {t("classesSelectShift")}
                </option>

                <option value="MATUTINO">
                  {t("classesMorning")}
                </option>

                <option value="VESPERTINO">
                  {t("classesAfternoon")}
                </option>

                <option value="NOTURNO">
                  {t("classesEvening")}
                </option>

                <option value="INTEGRAL">
                  {t("classesFullDay")}
                </option>

                <option value="FLEXIVEL">
                  {t("classesFlexible")}
                </option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 dark:text-slate-300">
                {t("classesMode")}
              </label>

              <select
                value={modalidade}
                onChange={(e) => {
                  const valor = e.target.value;

                  setModalidade(valor);

                  if (valor === "EAD") {
                    setPredio("");
                    setAla("");
                    setAndar("");
                    setSala("");
                  }
                }}
                className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="PRESENCIAL">
                  {t("classesInPerson")}
                </option>

                <option value="EAD">
                  {t("classesRemote")}
                </option>

                <option value="HIBRIDA">
                  {t("classesHybrid")}
                </option>
              </select>
            </div>

            {modalidade !== "EAD" && (
              <>
                <input
                  placeholder={t("classesBuilding")}
                  value={predio}
                  onChange={(e) => setPredio(e.target.value)}
                  className="w-full border rounded-lg p-2"
                />

                <input
                  placeholder={t("classesWing")}
                  value={ala}
                  onChange={(e) => setAla(e.target.value)}
                  className="w-full border rounded-lg p-2"
                />

                <input
                  placeholder={t("classesFloor")}
                  value={andar}
                  onChange={(e) => setAndar(e.target.value)}
                  className="w-full border rounded-lg p-2"
                />

                <input
                  placeholder={t("classesRoom")}
                  value={sala}
                  onChange={(e) => setSala(e.target.value)}
                  className="w-full border rounded-lg p-2"
                />
              </>
            )}

            <div>
              <label className="text-sm text-gray-600">{t("classesMinCapacity")}</label>
              <input
                type="number"
                min="1"
                value={capacidadeMinima}
                onChange={(e) => setCapacidadeMinima(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">{t("classesMaxCapacity")}</label>
              <input
                type="number"
                min="1"
                value={capacidadeMaxima}
                onChange={(e) => setCapacidadeMaxima(e.target.value)}
                className="w-full border rounded-lg p-2"
              />
            </div>

            <select
              value={statusTurma}
              onChange={(e) => setStatusTurma(e.target.value as StatusTurma)}
              className="w-full border rounded-lg p-2"
            >
              <option value="AGUARDANDO">{t("classesWaiting")}</option>
              <option value="A_INICIAR">{t("classesUpcoming")}</option>
              <option value="ATIVA">{t("classesActive")}</option>
              <option value="INATIVA">{t("classesInactive")}</option>
              <option value="CONCLUIDA">{t("classesCompleted")}</option>
              <option value="CANCELADA">{t("classesCancelled")}</option>
              <option value="NAO_FORMADA">{t("classesNotFormed")}</option>
            </select>

            <div className="col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <button
                  type="button"
                  onClick={() => setDisciplinasAbertas((prev) => !prev)}
                  className="flex h-[46px] w-full items-center justify-between rounded-lg border p-3 text-left"
                >
                  <span className="text-sm font-medium">
                    {t("classesSubjects")}
                    {disciplinasSelecionadas.length > 0
                      ? t("classesSelectedShort", { count: disciplinasSelecionadas.length })
                      : ""}
                  </span>
                  <span className="text-sm text-gray-500">
                    {disciplinasAbertas ? t("classesClose") : t("classesOpen")}
                  </span>
                </button>

                {disciplinasAbertas && (
                  <div className="phanyx-turma-busca-painel mt-2 rounded-xl border p-3">
                    <label className="block">
                      <span className="phanyx-turma-busca-titulo mb-2 block text-sm font-bold">
                        {t("classesSearchSubject")}
                      </span>

                      <input
                        type="search"
                        value={buscaDisciplina}
                        onChange={(e) =>
                          setBuscaDisciplina(
                            e.target.value,
                          )
                        }
                        placeholder={t("classesSubjectExample")}
                        className="phanyx-turma-busca-campo h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/20"
                      />
                    </label>

                    <div className="phanyx-turma-busca-resumo mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span>
                        {t("classesSuggestionCount", { count: disciplinasFiltradas.length })}
                      </span>

                      <span>
                        {t("classesSelectedCount", { count: disciplinasSelecionadas.length })}
                      </span>
                    </div>
                  </div>
                )}

                {disciplinasAbertas && (
                  <div className="mt-2 max-h-72 overflow-auto rounded border border-slate-300 bg-white p-2">
                    <div className="grid grid-cols-1 gap-3">
                      {disciplinasFiltradas.length ===
                        0 && (
                          <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                            {t("classesSubjectNone")}
                          </div>
                        )}
                      {disciplinasFiltradas.map((disciplina) => {
                        const selecionada = disciplinasSelecionadas.includes(disciplina.id);

                        return (
                          <div
                            key={disciplina.id}
                            className="rounded-lg border border-slate-300 bg-white p-3 text-slate-900 shadow-sm"
                          >
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <input
                                type="checkbox"
                                checked={selecionada}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setDisciplinasSelecionadas((prev) => [
                                      ...prev,
                                      disciplina.id,
                                    ]);
                                  } else {
                                    setDisciplinasSelecionadas((prev) =>
                                      prev.filter((id) => id !== disciplina.id)
                                    );

                                    setProfessoresPorDisciplina((prev) => {
                                      const novo = { ...prev };
                                      delete novo[disciplina.id];
                                      return novo;
                                    });
                                  }
                                }}
                              />

                              <span className="text-sm font-semibold text-slate-900">
                                {disciplina.nome}
                              </span>
                            </label>

                            {selecionada && (
                              <div className="mt-2 space-y-3">
                                <select
                                  value={professoresPorDisciplina[disciplina.id] || ""}
                                  onChange={(e) =>
                                    setProfessoresPorDisciplina((prev) => ({
                                      ...prev,
                                      [disciplina.id]: e.target.value,
                                    }))
                                  }
                                  className="h-[42px] w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900"
                                >
                                  <option value="">{t("classesSubjectTeacher")}</option>
                                  {professoresDaDisciplina(disciplina).map((professor) => (
                                    <option key={professor.id} value={professor.id}>
                                      {professor.nome}
                                    </option>
                                  ))}
                                </select>

                                <div className="phanyx-turma-horarios-card rounded-xl border p-3">
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <p className="phanyx-turma-horarios-titulo text-sm font-bold">
                                      {t("classesSubjectSchedule")}
                                    </p>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setHorariosPorDisciplina((prev) => ({
                                          ...prev,
                                          [disciplina.id]: [
                                            ...(prev[disciplina.id] || []),
                                            { diaSemana: "1", horaInicio: "", horaFim: "" },
                                          ],
                                        }))
                                      }
                                      className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700"
                                    >
                                      {t("classesAddSchedule")}
                                    </button>
                                  </div>

                                  {(horariosPorDisciplina[disciplina.id] || []).length === 0 ? (
                                    <p className="phanyx-turma-horarios-texto text-xs">
                                      {t("classesNoSchedule")}
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {(horariosPorDisciplina[disciplina.id] || []).map((horario, index) => (
                                        <div
                                          key={`${disciplina.id}-horario-${index}`}
                                          className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px_120px_auto]"
                                        >
                                          <select
                                            value={horario.diaSemana}
                                            onChange={(e) =>
                                              setHorariosPorDisciplina((prev) => {
                                                const lista = [...(prev[disciplina.id] || [])];
                                                lista[index] = {
                                                  ...lista[index],
                                                  diaSemana: e.target.value,
                                                };
                                                return { ...prev, [disciplina.id]: lista };
                                              })
                                            }
                                            className="h-[40px] rounded-lg border bg-white p-2 text-sm"
                                          >
                                            <option value="1">{t("classesMon")}</option>
                                            <option value="2">{t("classesTue")}</option>
                                            <option value="3">{t("classesWed")}</option>
                                            <option value="4">{t("classesThu")}</option>
                                            <option value="5">{t("classesFri")}</option>
                                            <option value="6">{t("classesSat")}</option>
                                            <option value="0">{t("classesSun")}</option>
                                          </select>

                                          <input
                                            type="time"
                                            aria-label={t("commonStartTime")}
                                            value={horario.horaInicio}
                                            onChange={(e) =>
                                              setHorariosPorDisciplina((prev) => {
                                                const lista = [...(prev[disciplina.id] || [])];
                                                lista[index] = {
                                                  ...lista[index],
                                                  horaInicio: e.target.value,
                                                };
                                                return { ...prev, [disciplina.id]: lista };
                                              })
                                            }
                                            className="h-[40px] rounded-lg border bg-white p-2 text-sm"
                                          />

                                          <input
                                            type="time"
                                            aria-label={t("commonEndTime")}
                                            value={horario.horaFim}
                                            onChange={(e) =>
                                              setHorariosPorDisciplina((prev) => {
                                                const lista = [...(prev[disciplina.id] || [])];
                                                lista[index] = {
                                                  ...lista[index],
                                                  horaFim: e.target.value,
                                                };
                                                return { ...prev, [disciplina.id]: lista };
                                              })
                                            }
                                            className="h-[40px] rounded-lg border bg-white p-2 text-sm"
                                          />

                                          <button
                                            type="button"
                                            onClick={() =>
                                              setHorariosPorDisciplina((prev) => {
                                                const lista = [...(prev[disciplina.id] || [])];
                                                lista.splice(index, 1);
                                                return { ...prev, [disciplina.id]: lista };
                                              })
                                            }
                                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                                          >
                                            {t("commonRemove")}
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <select
                  value={poloId}
                  onChange={(e) => setPoloId(e.target.value)}
                  className="h-[46px] w-full rounded-lg border p-3"
                >
                  <option value="">{t("classesCampus")}</option>
                  {polos.map((polo) => (
                    <option key={polo.id} value={polo.id}>
                      {polo.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={ativa}
                onChange={(e) => setAtiva(e.target.checked)}
              />
              {t("classesEnabled")}
            </label>
          </div>

          <button
            disabled={criando}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {criando ? t("classesCreating") : t("classesCreate")}
          </button>
        </form>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-semibold">{t("classesList")}</h2>

            <input
              type="text"
              placeholder={t("classesSearch")}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full md:w-[520px] border rounded-lg p-2"
            />
          </div>

          {turmasFiltradas.length === 0 ? (
            <div className="bg-white border rounded-lg p-4 text-sm text-gray-600">
              {t("classesEmpty")}
            </div>
          ) : (
            turmasFiltradas.map((turma) => {
              const matriculados = turma.matriculados ?? 0;
              const capacidadeMinima = turma.capacidadeMinima ?? null;
              const capacidadeMaxima = turma.capacidadeMaxima ?? null;
              const vagasRestantes =
                capacidadeMaxima !== null
                  ? Math.max(capacidadeMaxima - matriculados, 0)
                  : null;
              const atingiuMinimo =
                capacidadeMinima !== null
                  ? matriculados >= capacidadeMinima
                  : null;

              return (
                <div key={turma.id} className="bg-white border rounded-lg p-4">
                  {editandoId === turma.id ? (
                    <div className="phanyx-turmas-form space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          className="border p-2 rounded"
                          placeholder={t("classesName")}
                        />

                        <input
                          value={editCodigo}
                          onChange={(e) => setEditCodigo(e.target.value)}
                          className="border p-2 rounded"
                          placeholder={t("classesCode")}
                        />

                        <div>
                          <label className="text-sm text-gray-600">{t("classesSemester")}</label>
                          <input
                            value={editSemestre}
                            onChange={(e) => setEditSemestre(e.target.value)}
                            className="w-full border rounded-lg p-2"
                          />
                        </div>

                        <div>
                          <label className="text-sm text-gray-600 dark:text-slate-300">
                            {t("classesTerm")}
                          </label>

                          <input
                            value={editPeriodoLetivo}
                            onChange={(e) =>
                              setEditPeriodoLetivo(
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            placeholder="Ex.: 2027.1"
                          />
                        </div>

                        <div>
                          <label className="text-sm text-gray-600 dark:text-slate-300">
                            {t("classesShift")}
                          </label>

                          <select
                            value={editTurno}
                            onChange={(e) =>
                              setEditTurno(
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          >
                            <option value="">
                              {t("classesSelectShift")}
                            </option>
                            <option value="MATUTINO">
                              {t("classesMorning")}
                            </option>
                            <option value="VESPERTINO">
                              {t("classesAfternoon")}
                            </option>
                            <option value="NOTURNO">
                              {t("classesEvening")}
                            </option>
                            <option value="INTEGRAL">
                              {t("classesFullDay")}
                            </option>
                            <option value="FLEXIVEL">
                              {t("classesFlexible")}
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="text-sm text-gray-600 dark:text-slate-300">
                            {t("classesMode")}
                          </label>

                          <select
                            value={editModalidade}
                            onChange={(e) => {
                              const valor =
                                e.target.value;

                              setEditModalidade(valor);

                              if (valor === "EAD") {
                                setEditPredio("");
                                setEditAla("");
                                setEditAndar("");
                                setEditSala("");
                              }
                            }}
                            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          >
                            <option value="PRESENCIAL">
                              {t("classesInPerson")}
                            </option>
                            <option value="EAD">
                              {t("classesRemote")}
                            </option>
                            <option value="HIBRIDA">
                              {t("classesHybrid")}
                            </option>
                          </select>
                        </div>
                        <input
                          value={editPredio}
                          onChange={(e) => setEditPredio(e.target.value)}
                          className="border p-2 rounded"
                          placeholder={t("classesBuilding")}
                        />

                        <input
                          value={editAla}
                          onChange={(e) => setEditAla(e.target.value)}
                          className="border p-2 rounded"
                          placeholder={t("classesWing")}
                        />

                        <input
                          value={editAndar}
                          onChange={(e) => setEditAndar(e.target.value)}
                          className="border p-2 rounded"
                          placeholder={t("classesFloor")}
                        />

                        <input
                          value={editSala}
                          onChange={(e) => setEditSala(e.target.value)}
                          className="border p-2 rounded"
                          placeholder={t("classesRoom")}
                        />
                        <input
                          type="number"
                          min="1"
                          value={editCapacidadeMinima}
                          onChange={(e) => setEditCapacidadeMinima(e.target.value)}
                          className="border p-2 rounded"
                          placeholder={t("classesMinCapacity")}
                        />

                        <input
                          type="number"
                          min="1"
                          value={editCapacidadeMaxima}
                          onChange={(e) => setEditCapacidadeMaxima(e.target.value)}
                          className="border p-2 rounded"
                          placeholder={t("classesMaxCapacity")}
                        />

                        <select
                          value={editStatusTurma}
                          onChange={(e) =>
                            setEditStatusTurma(e.target.value as StatusTurma)
                          }
                          className="border p-2 rounded"
                        >
                          <option value="AGUARDANDO">{t("classesWaiting")}</option>
                          <option value="A_INICIAR">{t("classesUpcoming")}</option>
                          <option value="ATIVA">{t("classesActive")}</option>
                          <option value="INATIVA">{t("classesInactive")}</option>
                          <option value="CONCLUIDA">{t("classesCompleted")}</option>
                          <option value="CANCELADA">{t("classesCancelled")}</option>
                          <option value="NAO_FORMADA">{t("classesNotFormed")}</option>
                        </select>

                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={() => setEditDisciplinasAbertas((prev) => !prev)}
                            className="flex h-[46px] w-full items-center justify-between rounded-lg border p-3 text-left"
                          >
                            <span className="text-sm font-medium">
                              {t("classesSubjects")}
                              {editDisciplinasSelecionadas.length > 0
                                ? t("classesSelectedShort", { count: editDisciplinasSelecionadas.length })
                                : ""}
                            </span>
                            <span className="text-sm text-gray-500">
                              {editDisciplinasAbertas ? t("classesClose") : t("classesOpen")}
                            </span>
                          </button>

                          {editDisciplinasAbertas && (
                            <div className="phanyx-turma-busca-painel mt-2 rounded-xl border p-3">
                              <label className="block">
                                <span className="phanyx-turma-busca-titulo mb-2 block text-sm font-bold">
                                  {t("classesSearchSubject")}
                                </span>

                                <input
                                  type="search"
                                  value={
                                    editBuscaDisciplina
                                  }
                                  onChange={(e) =>
                                    setEditBuscaDisciplina(
                                      e.target.value,
                                    )
                                  }
                                  placeholder={t("classesSearchSubjectHint")}
                                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                                />
                              </label>

                              <div className="phanyx-turma-busca-resumo mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span>
                                  {t("classesSuggestionCount", { count: editDisciplinasFiltradas.length })}
                                </span>

                                <span>
                                  {t("classesSelectedCount", { count: editDisciplinasSelecionadas.length })}
                                </span>
                              </div>
                            </div>
                          )}

                          {editDisciplinasAbertas && (
                            <div className="mt-2 max-h-72 overflow-auto rounded border border-slate-300 bg-white p-2">
                              <div className="grid grid-cols-1 gap-3">
                                {editDisciplinasFiltradas.length ===
                                  0 && (
                                    <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                                      {t("classesSubjectNoneEdit")}
                                    </div>
                                  )}
                                {editDisciplinasFiltradas.map((disciplina) => {
                                  const selecionada = editDisciplinasSelecionadas.includes(disciplina.id);

                                  return (
                                    <div
                                      key={disciplina.id}
                                      className="rounded-lg border border-slate-300 bg-white p-3 text-slate-900 shadow-sm"
                                    >
                                      <label className="flex items-center gap-2 text-sm font-medium">
                                        <input
                                          type="checkbox"
                                          checked={selecionada}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setEditDisciplinasSelecionadas((prev) => [
                                                ...prev,
                                                disciplina.id,
                                              ]);
                                            } else {
                                              setEditDisciplinasSelecionadas((prev) =>
                                                prev.filter((id) => id !== disciplina.id)
                                              );

                                              setProfessoresPorDisciplina((prev) => {
                                                const novo = { ...prev };
                                                delete novo[disciplina.id];
                                                return novo;
                                              });
                                            }
                                          }}
                                        />

                                        <span className="text-sm font-semibold text-slate-900">
                                          {disciplina.nome || t("classesFallbackSubject", { id: disciplina.id })}
                                        </span>
                                      </label>

                                      {selecionada && (
                                        <>
                                          <select
                                            value={professoresPorDisciplina[disciplina.id] || ""}
                                            onChange={(e) =>
                                              setProfessoresPorDisciplina((prev) => ({
                                                ...prev,
                                                [disciplina.id]: e.target.value,
                                              }))
                                            }
                                            className="mt-2 h-[42px] w-full rounded-lg border bg-white p-2 text-sm"
                                          >
                                            <option value="">{t("classesSubjectTeacher")}</option>
                                            {professores.map((professor) => (
                                              <option key={professor.id} value={professor.id}>
                                                {professor.nome}
                                              </option>
                                            ))}
                                          </select>

                                          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                                            <input
                                              type="date"
                                              aria-label={t("commonStartDate")}
                                              value={datasInicioPorDisciplina[disciplina.id] || ""}
                                              onChange={(e) =>
                                                setDatasInicioPorDisciplina((prev) => ({
                                                  ...prev,
                                                  [disciplina.id]: e.target.value,
                                                }))
                                              }
                                              className="h-[42px] w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900"
                                            />

                                            <input
                                              type="date"
                                              aria-label={t("commonEndDate")}
                                              value={datasFimPorDisciplina[disciplina.id] || ""}
                                              onChange={(e) =>
                                                setDatasFimPorDisciplina((prev) => ({
                                                  ...prev,
                                                  [disciplina.id]: e.target.value,
                                                }))
                                              }
                                              className="h-[42px] w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900"
                                            />

                                            <select
                                              value={statusPorDisciplina[disciplina.id] || ""}
                                              onChange={(e) =>
                                                setStatusPorDisciplina((prev) => ({
                                                  ...prev,
                                                  [disciplina.id]: e.target.value,
                                                }))
                                              }
                                              className="h-[42px] w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900"
                                            >
                                              <option value="">{t("commonStatus")}</option>
                                              <option value="A_INICIAR">{t("classesUpcoming")}</option>
                                              <option value="EM_ANDAMENTO">{t("classesOngoing")}</option>
                                              <option value="ENCERRADA">{t("classesClosed")}</option>
                                              <option value="CONCLUIDA">{t("classesCompleted")}</option>
                                            </select>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editAtiva}
                            onChange={(e) => setEditAtiva(e.target.checked)}
                          />
                          {t("classesEnabled")}
                        </label>
                      </div>
                      <select
                        value={editProfessorId}
                        onChange={(e) => setEditProfessorId(e.target.value)}
                        className="border p-2 rounded"
                      >
                        <option value="">{t("commonTeacherResponsible")}</option>
                        {professores.map((professor) => (
                          <option key={professor.id} value={professor.id}>
                            {professor.nome}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => salvarEdicao(turma.id)}
                          disabled={salvandoId === turma.id}
                          className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                        >
                          {salvandoId === turma.id ? t("visitorsSaving") : t("commonSave")}
                        </button>

                        <button
                          onClick={() => setEditandoId(null)}
                          className="bg-gray-400 text-white px-3 py-1 rounded"
                        >
                          {t("commonCancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium">{turma.nome}</p>
                      <p className="text-sm text-gray-600">
                        {t("commonCodePrefix")} {turma.codigo || "-"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("commonCoursePrefix")} {turma.curso?.nome || "-"}
                      </p>

                      <p className="text-sm text-gray-600">
                        {t("commonTeacherPrefix")} {turma.professor?.nome || "-"}
                      </p>

                      <p className="text-sm text-gray-600">
                        {t("commonSubjectsPrefix")}{" "}
                        {turma.disciplinas && turma.disciplinas.length > 0
                          ? turma.disciplinas.map((d) => d.nome).join(", ")
                          : "-"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("commonSemesterPrefix")} {turma.semestre}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("commonTermPrefix")} {turma.periodoLetivo || "-"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("classesClassStatus")} {labelStatusTurma(turma.statusTurma)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("commonActivePrefix")} {turma.ativa ? t("commonYes") : t("commonNo")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("commonMinCapacityPrefix")} {capacidadeMinima ?? "-"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("commonMaxCapacityPrefix")} {capacidadeMaxima ?? "-"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("classesEnrolled")} {matriculados}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("classesRemaining")} {vagasRestantes ?? "-"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("classesMinimumMet")}{" "}
                        {atingiuMinimo === null
                          ? "-"
                          : atingiuMinimo
                            ? t("commonYes")
                            : t("commonNo")}
                      </p>

                      <div className="flex gap-4 mt-3">
                        <button
                          onClick={() => iniciarEdicao(turma)}
                          className="text-blue-600 text-sm"
                        >
                          {t("commonEdit")}
                        </button>

                        <button
                          onClick={() => setTurmaParaExcluir(turma)}
                          className="text-red-600 text-sm"
                        >
                          {t("commonDelete")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {turmaParaExcluir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl">
                🗑️
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {t("classesConfirmDelete")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("classesDeleteAsk", { name: turmaParaExcluir.nome })}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("classesIrreversible")}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setTurmaParaExcluir(null)}
                disabled={excluindoId === turmaParaExcluir.id}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("commonCancel")}
              </button>

              <button
                type="button"
                onClick={confirmarExclusaoTurma}
                disabled={excluindoId === turmaParaExcluir.id}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindoId === turmaParaExcluir.id
                  ? t("meetingsDeleting")
                  : t("classesConfirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuth(AdminTurmasPage, ["admin"]);
