"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import withAuth from "@/lib/withAuth";
import MultiSelectDisciplinas from "@/components/MultiSelectDisciplinas";
import PhanyxToast from "@/components/ui/PhanyxToast";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

type CursoOption = {
  id: number;
  nome: string;
  cargaHorariaMaximaSemestre?: number | null;
};

type AlunoOption = {
  id: number;
  nome: string;
};

type TurmaOption = {
  id: number;
  nome: string;
  semestre?: string | null;
  disciplinaId?: number | null;
  disciplinaNome?: string | null;
  professorNome?: string | null;
  cursoId?: number | null;
  cursoNome?: string | null;
  disciplinas?: {
    id: number;
    nome: string;
    codigo?: string | null;
    cargaHoraria?: number | null;
    cursoId?: number | null;
  }[];
};
type CursoSemestreDisciplina = {
  id: number;
  disciplinaId: number;
  disciplina?: {
    id: number;
    nome: string;
    codigo?: string | null;
    cargaHoraria?: number | null;
  } | null;
};

type CursoSemestreOption = {
  id: number;
  numero: number;
  titulo?: string | null;
  descricao?: string | null;
  cargaMinima?: number | null;
  cargaMaxima?: number | null;
  disciplinas: CursoSemestreDisciplina[];
};

type MatriculaApi = {
  id: number;
  status?: string;
  semestre?: number | null;
  valorMatricula?: number | null;
  valorMensalidade?: number | null;
  quantidadeMensalidades?: number | null;
  primeiroVencimento?: string | null;
  aluno?: { id: number; nome: string; nomeSocial?: string | null; genero?: string | null } | null;
  curso?: { id: number; nome: string } | null;
  itens?: Array<{
    id: number;
    status?: string;
    turma?: {
      id: number;
      nome: string;
      professor?: { id: number; nome: string } | null;
      disciplina?: { id: number; nome: string } | null;
      _count?: { aulas: number } | null;
    } | null;
  }>;
  createdAt?: string;
};


type MatriculaEdicao = {
  id: number;
  alunoId: string;
  cursoId: string;
  cursoSemestreId: string;
  semestre: number | "";
  turmaIds: number[];
  valorPagoMatricula: string;
  valorMensalidade: string;
  quantidadeMensalidades: string;
  primeiroVencimento: string;
  nomeSocial: string;
  genero: string;
};

function AdminMatriculasPage() {
  const searchParams = useSearchParams();
  const [busca, setBusca] = useState("");

  const [filtroPeriodoMatricula, setFiltroPeriodoMatricula] = useState<
  "HOJE" | "ONTEM" | "7_DIAS" | "MES" | "TODAS"
>("HOJE");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [matriculaEditando, setMatriculaEditando] =
    useState<MatriculaEdicao | null>(null);
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<number[]>([]);
  const [disciplinasExtrasSelecionadas, setDisciplinasExtrasSelecionadas] = useState<number[]>([]);
  const [disciplinasEdicaoSelecionadas, setDisciplinasEdicaoSelecionadas] = useState<number[]>([]);
  const [disciplinasExtrasEdicaoSelecionadas, setDisciplinasExtrasEdicaoSelecionadas] = useState<number[]>([]);
  const [matriculas, setMatriculas] = useState<MatriculaApi[]>([]);
  const [alunos, setAlunos] = useState<AlunoOption[]>([]);
  const [cursos, setCursos] = useState<CursoOption[]>([]);
  const [turmas, setTurmas] = useState<TurmaOption[]>([]);
  const [semestresCurso, setSemestresCurso] = useState<CursoSemestreOption[]>([]);

  const [matriculaExpandidaId, setMatriculaExpandidaId] = useState<number | null>(null);
  const [alunoId, setAlunoId] = useState<string>("");
  const [cursoId, setCursoId] = useState<string>("");
  const [cursoSemestreId, setCursoSemestreId] = useState<string>("");
  const [cursoSemestreIds, setCursoSemestreIds] = useState<number[]>([]);
  const [semestresAberto, setSemestresAberto] = useState(false);
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<number[]>([]);
  const [valorPagoMatricula, setValorPagoMatricula] = useState<string>("");
  const [valorMensalidade, setValorMensalidade] = useState<string>("");
  const [quantidadeParcelas, setQuantidadeParcelas] = useState<string>("");
  const [dataPrimeiroVencimento, setDataPrimeiroVencimento] = useState<string>("");

  const [statusInicialMatricula, setStatusInicialMatricula] =
  useState<string>("ATIVA");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [toast, setToast] = useState<{
  tipo: "sucesso" | "erro";
  mensagem: string;
} | null>(null);

  const [confirmModalAberto, setConfirmModalAberto] = useState(false);
  const [confirmTitulo, setConfirmTitulo] = useState("");
  const [confirmMensagem, setConfirmMensagem] = useState("");
  const [confirmAcao, setConfirmAcao] = useState<(() => void) | null>(null);
  const canvasSecretariaRef = useRef<HTMLCanvasElement | null>(null);
  const [modalSecretariaAberto, setModalSecretariaAberto] = useState(false);
  const [contratoSecretariaId, setContratoSecretariaId] = useState<number | null>(null);
  const [desenhandoSecretaria, setDesenhandoSecretaria] = useState(false);
  const [salvandoSecretaria, setSalvandoSecretaria] = useState(false);
  async function carregarTudo() {
    setLoading(true);

    try {
      try {
        const resMat = await fetch("/api/matricula", {
          credentials: "include",
          cache: "no-store",
        });

        const dataMat = await resMat.json();
        setMatriculas(Array.isArray(dataMat) ? dataMat : []);
      } catch (error) {
        console.error("Erro ao carregar matrículas:", error);
        setMatriculas([]);
      }

      try {
        const resAlunos = await fetch("/api/aluno", {
          credentials: "include",
          cache: "no-store",
        });

        const dataAlunos = await resAlunos.json();

        const listaAlunos: AlunoOption[] = (
  Array.isArray(dataAlunos) ? dataAlunos : []
)
  .map((a: any) => ({
    id: Number(a?.id),
    nome: String(a?.nome ?? "Aluno"),
  }))
  .filter((a) => Number.isFinite(a.id) && a.id > 0);

console.log("📚 Lista de alunos pronta para o select:", listaAlunos);

setAlunos(listaAlunos);
      } catch (error) {
        console.error("Erro ao carregar alunos:", error);
        setAlunos([]);
      }

      try {
        const resCursos = await fetch("/api/admin/cursos", {
          credentials: "include",
          cache: "no-store",
        });

        const dataCursos = await resCursos.json();

        const listaCursos: CursoOption[] = (
  Array.isArray(dataCursos) ? dataCursos : []
).map((c: any) => ({
  id: Number(c.id),
  nome: String(c.nome ?? "Curso"),
  cargaHorariaMaximaSemestre:
    c?.cargaHorariaMaximaSemestre !== undefined &&
    c?.cargaHorariaMaximaSemestre !== null
      ? Number(c.cargaHorariaMaximaSemestre)
      : null,
}));

        setCursos(listaCursos.filter((c) => Number.isFinite(c.id) && c.id > 0));
      } catch (error) {
        console.error("Erro ao carregar cursos:", error);
        setCursos([]);
      }

      try {
        const resTurmas = await fetch("/api/admin/turmas", {
          credentials: "include",
          cache: "no-store",
        });

        const dataTurmas = await resTurmas.json();

        const listaTurmas: TurmaOption[] = (
  Array.isArray(dataTurmas) ? dataTurmas : []
).map((t: any) => {
  const primeiraDisciplina =
  Array.isArray(t.disciplinas) && t.disciplinas.length > 0
    ? t.disciplinas[0]?.disciplina ?? t.disciplinas[0]
    : t.disciplina;
  return {
    id: Number(t.id),
    nome: String(t.nome ?? "Turma"),
    semestre: t?.semestre ?? null,
    disciplinaId: primeiraDisciplina?.id ?? null,
    disciplinaNome: primeiraDisciplina?.nome ?? null,
    professorNome: t?.professor?.nome ?? null,
    cursoId:
  t?.cursoId ??
  t?.curso?.id ??
  primeiraDisciplina?.cursoId ??
  primeiraDisciplina?.curso?.id ??
  null,
cursoNome:
  t?.curso?.nome ??
  primeiraDisciplina?.curso?.nome ??
  null,
  disciplinas: Array.isArray(t.disciplinas)
  ? t.disciplinas.map((d: any) => ({
      id: Number(d?.disciplina?.id ?? d?.id),
      nome: String(d?.disciplina?.nome ?? d?.nome ?? "Disciplina"),
      codigo: d?.disciplina?.codigo ?? d?.codigo ?? null,
      cargaHoraria: d?.disciplina?.cargaHoraria ?? d?.cargaHoraria ?? 0,
      cursoId: d?.disciplina?.cursoId ?? d?.cursoId ?? null,
    }))
  : [],
  };
});

        setTurmas(listaTurmas.filter((t) => Number.isFinite(t.id) && t.id > 0));
      } catch (error) {
        console.error("Erro ao carregar turmas:", error);
        setTurmas([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function carregarSemestresDoCurso(cursoIdValue: string) {
  if (!cursoIdValue) {
    setSemestresCurso([]);
    return [];
  }

  try {
    const res = await fetch(
      `/api/admin/curso-semestres?cursoId=${Number(cursoIdValue)}`,
      {
        cache: "no-store",
      }
    );

    const data = await res.json();
    const lista = Array.isArray(data) ? data : [];

    setSemestresCurso(lista);
    return lista;
  } catch (err) {
    console.error("Erro ao carregar semestres:", err);
    setSemestresCurso([]);
    return [];
  }
}

  useEffect(() => {
  carregarTudo();
}, []);

useEffect(() => {
  console.log("📚 Alunos carregados para matrícula:", alunos);
}, [alunos]);

  useEffect(() => {
  setCursoSemestreId("");
  setTurmasSelecionadas([]);
  setDisciplinasSelecionadas([]);
  setDisciplinasExtrasSelecionadas([]);
  carregarSemestresDoCurso(cursoId);
}, [cursoId]);

  useEffect(() => {
  setTurmasSelecionadas([]);
  setDisciplinasSelecionadas([]);
  setDisciplinasExtrasSelecionadas([]);
}, [cursoSemestreId]);

useEffect(() => {
  const buscaUrl = searchParams.get("busca");
  if (buscaUrl) {
    setBusca(buscaUrl);
  }
}, [searchParams]);

  const semestresSelecionados = useMemo(() => {
  return semestresCurso.filter((s) => cursoSemestreIds.includes(s.id));
}, [semestresCurso, cursoSemestreIds]);

const semestreSelecionado = semestresSelecionados[0] ?? null;

  const disciplinasDoSemestreIds = useMemo(() => {
  return Array.from(
    new Set(
      semestresSelecionados.flatMap((s) =>
        s.disciplinas.map((d) => d.disciplinaId)
      )
    )
  );
}, [semestresSelecionados]);

const turmaSelecionadaObj = useMemo(() => {
  return turmas.find((t) => t.id === Number(turmasSelecionadas[0]));
}, [turmas, turmasSelecionadas]);

const disciplinasDoSemestre = useMemo(() => {
  if (!turmaSelecionadaObj?.disciplinas?.length) return [];

  return turmaSelecionadaObj.disciplinas
    .map((d) => ({
      id: Number(d.id),
      nome: d.nome,
      cargaHoraria: d.cargaHoraria ?? 0,
    }))
    .filter((d) => Number.isFinite(d.id))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}, [turmaSelecionadaObj]);

  const turmasBaseDoSemestre = useMemo(() => {
    if (!cursoId || !semestreSelecionado) return [];

    return turmas.filter((t) => {
      const bateCurso = Number(t.cursoId) === Number(cursoId);
      const bateDisciplina =
        t.disciplinaId != null &&
        disciplinasDoSemestreIds.includes(Number(t.disciplinaId));

      return bateCurso && bateDisciplina;
    });
  }, [turmas, cursoId, semestreSelecionado, disciplinasDoSemestreIds]);

  const turmasExtrasMesmoCurso = useMemo(() => {
    if (!cursoId || !semestreSelecionado) return [];

    return turmas.filter((t) => {
      const bateCurso = Number(t.cursoId) === Number(cursoId);
      const naoEstaNaBase =
        t.disciplinaId == null ||
        !disciplinasDoSemestreIds.includes(Number(t.disciplinaId));

      return bateCurso && naoEstaNaBase;
    });
  }, [turmas, cursoId, semestreSelecionado, disciplinasDoSemestreIds]);

  const disciplinasExtras = useMemo(() => {
  const mapa = new Map<number, { id: number; nome: string; cargaHoraria?: number | null }>();

  for (const turma of turmasExtrasMesmoCurso) {
    if (!turma.disciplinaId) continue;

    if (!mapa.has(turma.disciplinaId)) {
      mapa.set(turma.disciplinaId, {
        id: turma.disciplinaId,
        nome: turma.disciplinaNome ?? "Disciplina extra",
        cargaHoraria: 0,
      });
    }
  }

  return Array.from(mapa.values()).sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR")
  );
}, [turmasExtrasMesmoCurso]);

const semestreEditandoSelecionado = useMemo(() => {
  if (!matriculaEditando) return null;

  return (
    semestresCurso.find(
      (s) => s.id === Number(matriculaEditando.cursoSemestreId)
    ) ?? null
  );
}, [semestresCurso, matriculaEditando]);

const disciplinasEditandoIds = useMemo(() => {
  return semestreEditandoSelecionado
    ? semestreEditandoSelecionado.disciplinas.map((d) => d.disciplinaId)
    : [];
}, [semestreEditandoSelecionado]);

const turmasBaseEdicao = useMemo(() => {
  if (!matriculaEditando?.cursoId || !semestreEditandoSelecionado) return [];

  return turmas.filter((t) => {
    const bateCurso = Number(t.cursoId) === Number(matriculaEditando.cursoId);
    const bateDisciplina =
      t.disciplinaId != null &&
      disciplinasEditandoIds.includes(Number(t.disciplinaId));

    return bateCurso && bateDisciplina;
  });
}, [turmas, matriculaEditando, semestreEditandoSelecionado, disciplinasEditandoIds]);

const turmasExtrasEdicao = useMemo(() => {
  if (!matriculaEditando?.cursoId || !semestreEditandoSelecionado) return [];

  return turmas.filter((t) => {
    const bateCurso = Number(t.cursoId) === Number(matriculaEditando.cursoId);
    const naoEstaNaBase =
      t.disciplinaId == null ||
      !disciplinasEditandoIds.includes(Number(t.disciplinaId));

    return bateCurso && naoEstaNaBase;
  });
}, [turmas, matriculaEditando, semestreEditandoSelecionado, disciplinasEditandoIds]);

function dataNoPeriodo(dataIso?: string, periodo?: "HOJE" | "ONTEM" | "7_DIAS" | "MES" | "TODAS") {
  if (!dataIso) return periodo === "TODAS";

  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return false;

  const agora = new Date();

  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const inicioAmanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  const inicioOntem = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1);
  const inicio7Dias = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 6);
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  switch (periodo) {
    case "HOJE":
      return data >= inicioHoje && data < inicioAmanha;
    case "ONTEM":
      return data >= inicioOntem && data < inicioHoje;
    case "7_DIAS":
      return data >= inicio7Dias && data < inicioAmanha;
    case "MES":
      return data >= inicioMes && data < inicioAmanha;
    case "TODAS":
    default:
      return true;
  }
}

const matriculasFiltradas = useMemo(() => {
  const termo = busca.trim().toLowerCase();

  return matriculas.filter((m) => {
    const id = String(m.id || "").toLowerCase();
    const aluno = String(m.aluno?.nome || "").toLowerCase();
    const curso = String(m.curso?.nome || "").toLowerCase();
    const status = String(m.status || "").toLowerCase();
    const semestre = String(m.semestre ?? "").toLowerCase();

    const itensTexto = Array.isArray(m.itens)
      ? m.itens
          .map((item) =>
            [
              item?.turma?.nome || "",
              item?.turma?.disciplina?.nome || "",
              item?.turma?.professor?.nome || "",
              item?.status || "",
            ].join(" ")
          )
          .join(" ")
          .toLowerCase()
      : "";

    const bateBusca =
      !termo ||
      id.includes(termo) ||
      aluno.includes(termo) ||
      curso.includes(termo) ||
      status.includes(termo) ||
      semestre.includes(termo) ||
      itensTexto.includes(termo);

    const batePeriodo = dataNoPeriodo(m.createdAt, filtroPeriodoMatricula);

    return bateBusca && batePeriodo;
  });
}, [matriculas, busca, filtroPeriodoMatricula]);
const cursoSelecionadoObj = useMemo(() => {
  return cursos.find((c) => c.id === Number(cursoId)) ?? null;
}, [cursos, cursoId]);

const cargaMinimaSemestre = Number(semestreSelecionado?.cargaMinima || 0);
const limiteCargaHoraria = Number(semestreSelecionado?.cargaMaxima || 0);
const cargaHorariaTotalSelecionada = useMemo(() => {
  const ids = [...disciplinasSelecionadas, ...disciplinasExtrasSelecionadas];

  return ids.reduce((total, disciplinaId) => {
    const disciplinaBase = disciplinasDoSemestre.find(
      (d) => d.id === disciplinaId
    );

    const disciplinaExtra = disciplinasExtras.find(
      (d) => d.id === disciplinaId
    );

    return (
      total +
      Number(
        disciplinaBase?.cargaHoraria ??
          disciplinaExtra?.cargaHoraria ??
          0
      )
    );
  }, 0);
}, [
  disciplinasSelecionadas,
  disciplinasExtrasSelecionadas,
  disciplinasDoSemestre,
  disciplinasExtras,
]);

const cargaHorariaAbaixoMinimo =
  cargaHorariaTotalSelecionada < cargaMinimaSemestre;

const cargaHorariaExcedida =
  limiteCargaHoraria > 0 &&
  cargaHorariaTotalSelecionada > limiteCargaHoraria;
  const podeCriar = useMemo(() => {

    const a = Number(alunoId);
    const c = Number(cursoId);



   return (
  Number.isFinite(a) &&
  a > 0 &&
  Number.isFinite(c) &&
  c > 0 &&
  cursoSemestreIds.length > 0 &&
  disciplinasSelecionadas.length > 0 &&
  turmasSelecionadas.length > 0 &&
  !cargaHorariaExcedida &&
  !cargaHorariaAbaixoMinimo
);
  }, [
  alunoId,
  cursoId,
  cursoSemestreIds,
  disciplinasSelecionadas,
  turmasSelecionadas,
  cargaHorariaExcedida,
  cargaHorariaAbaixoMinimo,
]);

  function toggleTurma(turmaId: number) {
    setTurmasSelecionadas((prev) =>
      prev.includes(turmaId)
        ? prev.filter((id) => id !== turmaId)
        : [...prev, turmaId]
    );
  }

function toggleTurmaEdicao(turmaId: number) {
  if (!matriculaEditando) return;

  setMatriculaEditando((prev) =>
    prev
      ? {
          ...prev,
          turmaIds: prev.turmaIds.includes(turmaId)
            ? prev.turmaIds.filter((id) => id !== turmaId)
            : [...prev.turmaIds, turmaId],
        }
      : prev
  );
}

  async function criarMatricula() {
  if (!semestreSelecionado) {
    setErro("Selecione o semestre do curso antes de matricular o aluno.");
    return;
  }

  if (cargaHorariaAbaixoMinimo) {
    setErro("A carga horária selecionada está abaixo do mínimo permitido para este semestre.");
    return;
  }

  if (cargaHorariaExcedida) {
    setErro("A carga horária selecionada ultrapassa o limite permitido para este semestre.");
    return;
  }

  if (!podeCriar) {
  setErro("Preencha aluno, curso, semestre, turma e disciplinas antes de matricular.");
  return;
}

setCreating(true);
const disciplinasIdsParaEnviar = [
  ...disciplinasSelecionadas,
  ...disciplinasExtrasSelecionadas,
];

const turmaIdsParaEnviar = Array.from(
  new Set(
    turmas
      .filter((turma) => {
        const pertenceAoCurso = Number(turma.cursoId) === Number(cursoId);
        const temDisciplinaSelecionada = (turma.disciplinas || []).some((d) =>
          disciplinasIdsParaEnviar.includes(Number(d.id))
        );

        return pertenceAoCurso && temDisciplinaSelecionada;
      })
      .map((turma) => turma.id)
  )
);

console.log("DEBUG MATRÍCULA", {
  alunoId,
  cursoId,
  cursoSemestreId,
  disciplinasSelecionadas,
  turmasBaseDoSemestre,
  turmaIdsParaEnviar,
});
    try {
      const res = await fetch("/api/matricula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
  alunoId: Number(alunoId),
  cursoId: Number(cursoId),
  cursoSemestreId: cursoSemestreIds[0] ?? null,
  cursoSemestreIds,
  semestre: semestresSelecionados[0]?.numero ?? null,
  semestres: semestresSelecionados.map((s) => s.numero),
  turmaIds: turmaIdsParaEnviar,
  turmaId: turmaIdsParaEnviar[0] ?? null,
  disciplinaIds: disciplinasIdsParaEnviar,

  status: statusInicialMatricula,
  valorPagoMatricula: Number(valorPagoMatricula || 0),
  valorMensalidade: Number(valorMensalidade || 0),
  quantidadeParcelas: Number(quantidadeParcelas || 0),
  dataPrimeiroVencimento,
}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao criar matrícula.");
      }

      setSucesso("Matrícula criada com sucesso.");

      setAlunoId("");
      setCursoId("");
      setCursoSemestreId("");
      setTurmasSelecionadas([]);
      setValorPagoMatricula("");
      setValorMensalidade("");
      setQuantidadeParcelas("");
      setDataPrimeiroVencimento("");
      setSemestresCurso([]);
      setStatusInicialMatricula("ATIVA");
      await carregarTudo();
    } catch (e: any) {
      setErro(e.message || "Erro ao criar matrícula.");
    } finally {
      setCreating(false);
    }
  }

  async function gerarContratoDaMatricula(matriculaId: number) {
    try {
      const res = await fetch("/api/admin/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ matriculaId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data?.error || "Erro ao gerar contrato.");
        return null;
      }

      return data;
    } catch (error) {
      console.error("Erro ao gerar contrato:", error);
      setErro("Erro ao gerar contrato.");
      return null;
    }
  }

  async function assinarContratoDaMatricula(matriculaId: number) {
    try {
      let res = await fetch(`/api/admin/contratos?matriculaId=${matriculaId}`, {
        credentials: "include",
        cache: "no-store",
      });

      let data = await res.json();

      if (!res.ok) {
        const criado = await gerarContratoDaMatricula(matriculaId);
        if (!criado?.id) return;

        const resCriado = await fetch(
          `/api/admin/contratos?matriculaId=${matriculaId}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const dataCriado = await resCriado.json();

        if (!resCriado.ok || !dataCriado?.tokenAssinatura) {
          setErro("Não foi possível obter o link de assinatura.");
          return;
        }

        window.open(`/assinatura/${dataCriado.tokenAssinatura}`, "_blank");
        return;
      }

      if (!data?.tokenAssinatura) {
        setErro("Este contrato ainda não possui token de assinatura.");
        return;
      }

      window.open(`/assinatura/${data.tokenAssinatura}`, "_blank");
    } catch (error) {
      console.error("Erro ao abrir assinatura:", error);
      setErro("Erro ao abrir assinatura do contrato.");
    }
  }

  async function abrirPdfContratoDaMatricula(matriculaId: number) {
    window.open(`/api/admin/contratos/pdf?matriculaId=${matriculaId}`, "_blank");
  }

  async function abrirAssinaturaSecretaria(matriculaId: number) {
  try {
    let res = await fetch(`/api/admin/contratos?matriculaId=${matriculaId}`, {
      credentials: "include",
      cache: "no-store",
    });

    let data = await res.json();

    if (!res.ok || !data?.id) {
      const criado = await gerarContratoDaMatricula(matriculaId);

      if (!criado?.id) {
        setErro("Não foi possível localizar ou criar o contrato.");
        return;
      }

      data = criado;
    }

    setContratoSecretariaId(Number(data.id));
    setModalSecretariaAberto(true);

    setTimeout(() => {
      const canvas = canvasSecretariaRef.current;
      const ctx = canvas?.getContext("2d");

      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, 100);
  } catch (error) {
    console.error("Erro ao abrir assinatura da secretaria:", error);
    setErro("Erro ao abrir assinatura da secretaria.");
  }
}

function iniciarDesenhoSecretaria(e: React.MouseEvent<HTMLCanvasElement>) {
  setDesenhandoSecretaria(true);
  desenharSecretaria(e);
}

function pararDesenhoSecretaria() {
  setDesenhandoSecretaria(false);
  const ctx = canvasSecretariaRef.current?.getContext("2d");
  ctx?.beginPath();
}

function desenharSecretaria(e: React.MouseEvent<HTMLCanvasElement>) {
  if (!desenhandoSecretaria) return;

  const canvas = canvasSecretariaRef.current;
  const ctx = canvas?.getContext("2d");

  if (!ctx || !canvas) return;

  const rect = canvas.getBoundingClientRect();

  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";

  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function limparAssinaturaSecretaria() {
  const canvas = canvasSecretariaRef.current;
  const ctx = canvas?.getContext("2d");

  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function salvarAssinaturaSecretaria() {
  try {
    if (!contratoSecretariaId) {
      setErro("Contrato não localizado.");
      return;
    }

    const canvas = canvasSecretariaRef.current;

    if (!canvas) {
      setErro("Campo de assinatura não encontrado.");
      return;
    }

    const assinaturaBase64 = canvas.toDataURL("image/png");

    setSalvandoSecretaria(true);

    const res = await fetch("/api/admin/contratos/assinar-secretaria", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        contratoId: contratoSecretariaId,
        assinaturaBase64,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao salvar assinatura da secretaria.");
    }

    setSucesso("Assinatura da secretaria salva com sucesso.");
    setModalSecretariaAberto(false);
    setContratoSecretariaId(null);
  } catch (error: any) {
    setErro(error?.message || "Erro ao salvar assinatura da secretaria.");
  } finally {
    setSalvandoSecretaria(false);
  }
}

async function assinarDigitalmenteSecretaria() {
  try {
    if (!contratoSecretariaId) {
      setErro("Contrato não localizado.");
      return;
    }

    setSalvandoSecretaria(true);

    const res = await fetch("/api/admin/contratos/assinar-secretaria", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        contratoId: contratoSecretariaId,
        tipoAssinatura: "DIGITAL",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao assinar digitalmente.");
    }

    setSucesso("Contrato assinado digitalmente pela secretaria.");
    setModalSecretariaAberto(false);
    setContratoSecretariaId(null);
  } catch (error: any) {
    setErro(error?.message || "Erro ao assinar digitalmente.");
  } finally {
    setSalvandoSecretaria(false);
  }
}

  async function abrirEdicao(matricula: MatriculaApi) {
  const cursoIdAtual = matricula.curso?.id ? String(matricula.curso.id) : "";
  const semestreAtual = matricula.semestre || "";
  const turmaIdsAtuais = Array.isArray(matricula.itens)
    ? matricula.itens
        .map((item) => item.turma?.id)
        .filter((id): id is number => Number.isFinite(id))
    : [];

    const disciplinaIdsAtuais = Array.isArray(matricula.itens)
  ? Array.from(
      new Set(
        matricula.itens
          .map((item: any) => Number(item?.disciplina?.id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    )
  : [];

  let semestreEncontrado: any = null;

  if (cursoIdAtual) {
    const semestres = await carregarSemestresDoCurso(cursoIdAtual);

    semestreEncontrado =
      semestres?.find((s: any) => Number(s.numero) === Number(semestreAtual)) ??
      null;
  }

const idsGradeDoSemestre = new Set(
  Array.isArray(semestreEncontrado?.disciplinas)
    ? semestreEncontrado.disciplinas.map((d: any) => Number(d.disciplinaId))
    : []
);

setDisciplinasEdicaoSelecionadas(
  disciplinaIdsAtuais.filter((id) => idsGradeDoSemestre.has(id))
);

setDisciplinasExtrasEdicaoSelecionadas(
  disciplinaIdsAtuais.filter((id) => !idsGradeDoSemestre.has(id))
);

  setMatriculaEditando({
    id: matricula.id,
    alunoId: matricula.aluno?.id ? String(matricula.aluno.id) : "",
    cursoId: cursoIdAtual,
    cursoSemestreId: semestreEncontrado ? String(semestreEncontrado.id) : "",
    semestre: semestreAtual,
    turmaIds: turmaIdsAtuais,
    valorPagoMatricula: String(matricula.valorMatricula ?? ""),
    valorMensalidade: String(matricula.valorMensalidade ?? ""),
    quantidadeMensalidades: String(matricula.quantidadeMensalidades ?? ""),
    primeiroVencimento: matricula.primeiroVencimento
      ? String(matricula.primeiroVencimento).slice(0, 10)
      : "",
    nomeSocial: String(matricula.aluno?.nomeSocial ?? ""),
    genero: String(matricula.aluno?.genero ?? ""),
  });
}

async function salvarEdicao() {
  if (!matriculaEditando) return;

  const disciplinasIdsEdicaoParaEnviar = [
    ...disciplinasEdicaoSelecionadas,
    ...disciplinasExtrasEdicaoSelecionadas,
  ];

  const turmaIdsEdicaoParaEnviar = Array.from(
    new Set(
      turmas
        .filter((turma) => {
          const pertenceAoCurso =
            Number(turma.cursoId) === Number(matriculaEditando.cursoId);

          const temDisciplinaSelecionada = (turma.disciplinas || []).some((d) =>
            disciplinasIdsEdicaoParaEnviar.includes(Number(d.id))
          );

          return pertenceAoCurso && temDisciplinaSelecionada;
        })
        .map((turma) => turma.id)
    )
  );

  console.log("DEBUG SALVAR EDIÇÃO MATRÍCULA", {
    matriculaId: matriculaEditando.id,
    cursoId: matriculaEditando.cursoId,
    semestre: matriculaEditando.semestre,
    disciplinasIdsEdicaoParaEnviar,
    turmaIdsEdicaoParaEnviar,
  });

  if (disciplinasIdsEdicaoParaEnviar.length === 0) {
    setErro("Selecione pelo menos uma disciplina antes de salvar.");
    return;
  }

  if (turmaIdsEdicaoParaEnviar.length === 0) {
    setErro(
      "Nenhuma turma foi encontrada para as disciplinas selecionadas. Verifique se as disciplinas estão vinculadas à turma."
    );
    return;
  }

  try {
    setErro("");
    setSucesso("");

    const res = await fetch("/api/matricula", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: matriculaEditando.id,
        alunoId:
          matriculaEditando.alunoId === ""
            ? null
            : Number(matriculaEditando.alunoId),
        cursoId:
          matriculaEditando.cursoId === ""
            ? null
            : Number(matriculaEditando.cursoId),
        cursoSemestreId:
          matriculaEditando.cursoSemestreId === ""
            ? null
            : Number(matriculaEditando.cursoSemestreId),
        semestre:
          matriculaEditando.semestre === ""
            ? null
            : Number(matriculaEditando.semestre),

        turmaIds: turmaIdsEdicaoParaEnviar,
        turmaId: turmaIdsEdicaoParaEnviar[0] ?? null,
        disciplinaIds: disciplinasIdsEdicaoParaEnviar,

        valorPagoMatricula:
          matriculaEditando.valorPagoMatricula === ""
            ? null
            : Number(matriculaEditando.valorPagoMatricula),
        valorMensalidade:
          matriculaEditando.valorMensalidade === ""
            ? null
            : Number(matriculaEditando.valorMensalidade),
        quantidadeMensalidades:
          matriculaEditando.quantidadeMensalidades === ""
            ? null
            : Number(matriculaEditando.quantidadeMensalidades),
        primeiroVencimento: matriculaEditando.primeiroVencimento || null,
        nomeSocial: matriculaEditando.nomeSocial,
        genero: matriculaEditando.genero,
      }),
    });

    const data = await res.json();

    console.log("RESPOSTA SALVAR EDIÇÃO MATRÍCULA", data);

   if (!res.ok) {
  throw new Error(data?.error || "Erro ao atualizar matrícula");
}
    setSucesso("Matrícula atualizada com sucesso.");
    setMatriculaEditando(null);
    await carregarTudo();
 } catch (err: any) {
  console.error("ERRO AO SALVAR EDIÇÃO MATRÍCULA:", err);

  setConfirmTitulo("Matrícula bloqueada");
  setConfirmMensagem(
    err?.message || "Não foi possível atualizar a matrícula."
  );
  setConfirmAcao(null);
  setConfirmModalAberto(true);
}
}

  async function excluirMatricula(id: number) {
    setConfirmTitulo("Excluir matrícula");
setConfirmMensagem(
  "Tem certeza que deseja excluir esta matrícula? Esta ação não poderá ser desfeita."
);

setConfirmAcao(() => async () => {

    setRemovingId(id);
    try {
      const res = await fetch("/api/matricula", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok) {
  setToast({
    tipo: "erro",
    mensagem: data?.error ?? "Erro ao excluir matrícula.",
  });

  return;
}

      setMatriculas((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setRemovingId(null);
    }
    });

setConfirmModalAberto(true);
return;
  }

  async function alterarStatusMatricula(id: number, status: string) {
    try {
      const res = await fetch("/api/matricula", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data?.error ?? "Erro ao atualizar status da matrícula.");
        return;
      }

      await carregarTudo();
      setSucesso("Status da matrícula atualizado com sucesso.");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setErro("Erro ao atualizar status da matrícula.");
    }
  }

  function labelStatusItem(status?: string) {
    switch (status) {
      case "A_CURSAR":
        return "A cursar";
      case "EM_CURSO":
        return "Em curso";
      case "CONCLUIDO":
        return "Concluído";
      case "TRANCADO":
        return "Trancado";
      case "REPROVADO":
        return "Reprovado";
      case "CANCELADO":
        return "Cancelado";
      default:
        return "-";
    }
  }

function agruparTurmasPorDisciplina(lista: TurmaOption[]) {
  const mapa = new Map<
    string,
    {
      disciplinaId: number | null;
      disciplinaNome: string;
      turmas: TurmaOption[];
    }
  >();

  for (const turma of lista) {
    const chave = String(
      turma.disciplinaId ?? `sem-disciplina-${turma.id}`
    );

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        disciplinaId: turma.disciplinaId ?? null,
        disciplinaNome: turma.disciplinaNome ?? turma.nome,
        turmas: [],
      });
    }

    mapa.get(chave)!.turmas.push(turma);
  }

  return Array.from(mapa.values()).sort((a, b) =>
    a.disciplinaNome.localeCompare(b.disciplinaNome, "pt-BR")
  );
}

const disciplinasBaseAgrupadas = useMemo(() => {
  return agruparTurmasPorDisciplina(turmasBaseDoSemestre);
}, [turmasBaseDoSemestre]);

const disciplinasExtrasAgrupadas = useMemo(() => {
  return agruparTurmasPorDisciplina(turmasExtrasMesmoCurso);
}, [turmasExtrasMesmoCurso]);

const disciplinasBaseEdicaoAgrupadas = useMemo(() => {
  return agruparTurmasPorDisciplina(turmasBaseEdicao);
}, [turmasBaseEdicao]);

const disciplinasExtrasEdicaoAgrupadas = useMemo(() => {
  return agruparTurmasPorDisciplina(turmasExtrasEdicao);
}, [turmasExtrasEdicao]);

const disciplinasDoSemestreEdicao = useMemo(() => {
  if (!matriculaEditando?.cursoId || !semestreEditandoSelecionado) return [];

  const idsPermitidos = new Set(
    semestreEditandoSelecionado.disciplinas.map((d) => Number(d.disciplinaId))
  );

  const mapa = new Map<number, { id: number; nome: string; cargaHoraria?: number | null }>();

  turmas
    .filter((t) => Number(t.cursoId) === Number(matriculaEditando.cursoId))
    .forEach((t) => {
      (t.disciplinas || []).forEach((d) => {
        if (idsPermitidos.has(Number(d.id))) {
          mapa.set(Number(d.id), {
            id: Number(d.id),
            nome: d.nome,
            cargaHoraria: d.cargaHoraria ?? 0,
          });
        }
      });
    });

  return Array.from(mapa.values()).sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR")
  );
}, [matriculaEditando, semestreEditandoSelecionado, turmas]);

const disciplinasExtrasEdicaoDisponiveis = useMemo(() => {
  if (!matriculaEditando?.cursoId || !semestreEditandoSelecionado) return [];

  const idsGrade = new Set(
    semestreEditandoSelecionado.disciplinas.map((d) => Number(d.disciplinaId))
  );

  const mapa = new Map<number, { id: number; nome: string; cargaHoraria?: number | null }>();

  turmas
    .filter((t) => Number(t.cursoId) === Number(matriculaEditando.cursoId))
    .forEach((t) => {
      (t.disciplinas || []).forEach((d) => {
        if (!idsGrade.has(Number(d.id))) {
          mapa.set(Number(d.id), {
            id: Number(d.id),
            nome: d.nome,
            cargaHoraria: d.cargaHoraria ?? 0,
          });
        }
      });
    });

  return Array.from(mapa.values()).sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR")
  );
}, [matriculaEditando, semestreEditandoSelecionado, turmas]);

function renderGrupoDisciplina(
  grupo: {
    disciplinaId: number | null;
    disciplinaNome: string;
    turmas: TurmaOption[];
  },
  turmaIdsSelecionadas: number[],
  onToggle: (turmaId: number) => void
) {
  return (
    <div
      key={`${grupo.disciplinaId ?? grupo.disciplinaNome}`}
      className="border rounded-2xl p-4 space-y-3"
    >
      <div>
        <p className="font-semibold text-gray-900">
          {grupo.disciplinaNome}
        </p>
        <p className="text-xs text-gray-500">
          Selecione a turma desta disciplina contratada.
        </p>
      </div>

      <div className="space-y-2">
        {grupo.turmas.map((t) => (
          <label
            key={t.id}
            className="flex items-start gap-3 border rounded-xl p-3 cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={turmaIdsSelecionadas.includes(t.id)}
              onChange={() => onToggle(t.id)}
              className="mt-1"
            />

            <div>
              <p className="font-medium">
                Turma: {t.nome}
              </p>

              <p className="text-sm text-gray-600">
                {t.professorNome
                  ? `Prof. ${t.professorNome}`
                  : "Professor não informado"}
                {t.semestre ? ` • Semestre ${t.semestre}` : ""}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

  return (
  <div className="space-y-6">

    {toast && (
      <PhanyxToast
        tipo={toast.tipo}
        mensagem={toast.mensagem}
        onClose={() => setToast(null)}
      />
    )}

      <div>
        <h1 className="text-2xl font-bold">📌 Matrículas</h1>
        <p className="text-gray-600 mt-1">
          Gerencie a matrícula por curso, semestre do curso e disciplinas
          contratadas.
        </p>
      </div>
{erro && (
  <PhanyxToast
    tipo="erro"
    titulo="Não foi possível concluir"
    mensagem={erro}
    onClose={() => setErro("")}
  />
)}

{sucesso && (
  <PhanyxToast
    tipo="sucesso"
    titulo="Tudo certo"
    mensagem={sucesso}
    onClose={() => setSucesso("")}
  />
)}
      <div className="bg-white border rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Nova matrícula</h2>
        <p className="text-sm text-gray-600 mt-1">
          Selecione aluno, curso, semestre estruturado e as turmas que ele vai
          cursar.
        </p>

<div>
  <label className="text-sm font-medium text-gray-700">
    Status inicial da matrícula
  </label>
  <select
    value={statusInicialMatricula}
    onChange={(e) => setStatusInicialMatricula(e.target.value)}
    className="mt-1 w-full border rounded-xl px-3 py-2 bg-white"
  >
    <option value="ATIVA">Ativa</option>
    <option value="A_INICIAR">A iniciar</option>
  </select>
</div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Aluno</label>
            <select
              value={alunoId}
              onChange={(e) => setAlunoId(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white"
            >
              <option value="">Selecione...</option>
              {alunos.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Curso</label>
            <select
              value={cursoId}
              onChange={(e) => {
                const id = e.target.value;
                setCursoId(id);

                if (id) {
                  carregarSemestresDoCurso(id);
                }
              }}
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white"
            >
              <option value="">Selecione...</option>
              {cursos.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Semestre do curso
            </label>
            <div className="relative mt-1">
  <button
    type="button"
    onClick={() => setSemestresAberto((prev) => !prev)}
    disabled={!cursoId}
    className="w-full border rounded-xl px-3 py-2 bg-white text-left flex items-center justify-between"
  >
    <span className="truncate">
      {cursoSemestreIds.length === 0
        ? "Selecione os semestres..."
        : `${cursoSemestreIds.length} semestre(s) selecionado(s)`}
    </span>

    <span>{semestresAberto ? "▴" : "▾"}</span>
  </button>

  {semestresAberto && (
    <div className="absolute z-20 mt-1 w-full border rounded-xl bg-white p-3 shadow-lg">
      {semestresCurso.length === 0 ? (
        <p className="text-sm text-gray-500">
          Selecione um curso primeiro...
        </p>
      ) : (
        <div className="space-y-2">
          {semestresCurso.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={cursoSemestreIds.includes(s.id)}
                onChange={() => {
                  setCursoSemestreIds((prev) =>
                    prev.includes(s.id)
                      ? prev.filter((id) => id !== s.id)
                      : [...prev, s.id]
                  );
                }}
              />
              <span>
                {s.numero}º semestre{s.titulo ? ` — ${s.titulo}` : ""}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )}
</div>
          </div>

<div>
  <label className="text-sm font-medium text-gray-700">
    Turma do aluno
  </label>

  <select
    value={turmasSelecionadas[0] ? String(turmasSelecionadas[0]) : ""}
    onChange={(e) => {
      const turmaId = Number(e.target.value);
      setTurmasSelecionadas(
        Number.isFinite(turmaId) && turmaId > 0 ? [turmaId] : []
      );
    }}
    className="mt-1 w-full border rounded-xl px-3 py-2 bg-white"
    disabled={!cursoId}
  >
    <option value="">Selecione a turma...</option>

    {turmas.map((t) => (
  <option key={t.id} value={String(t.id)}>
    {t.nome}
    {t.semestre ? ` — ${t.semestre}` : ""}
    {t.professorNome ? ` — Prof. ${t.professorNome}` : ""}
  </option>
))}
   
  </select>
</div>

<div>
  <label className="text-sm font-medium text-gray-700">
    Valor da mensalidade
  </label>
  <input
    type="number"
    value={valorMensalidade}
    onChange={(e) => setValorMensalidade(e.target.value)}
    className="mt-1 w-full border rounded-xl px-3 py-2"
    placeholder="0,00"
  />
</div>

<div>
  <label className="text-sm font-medium text-gray-700">
    Quantidade de mensalidades
  </label>
  <input
    type="number"
    value={quantidadeParcelas}
    onChange={(e) => setQuantidadeParcelas(e.target.value)}
    className="mt-1 w-full border rounded-xl px-3 py-2"
    placeholder="Ex: 12"
  />
</div>

<div>
  <label className="text-sm font-medium text-gray-700">
    Primeiro vencimento
  </label>
  <input
    type="date"
    value={dataPrimeiroVencimento}
    onChange={(e) => setDataPrimeiroVencimento(e.target.value)}
    className="mt-1 w-full border rounded-xl px-3 py-2"
  />
</div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Valor pago no ato da matrícula
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valorPagoMatricula}
              onChange={(e) => setValorPagoMatricula(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white"
              placeholder="0,00"
            />
          </div>
        </div>



        {semestreSelecionado ? (
          <div className="mt-5 rounded-2xl border bg-blue-50 p-4">
            <p className="font-semibold text-blue-900">
              Semestre selecionado: {semestreSelecionado.numero}º semestre
              {semestreSelecionado.titulo
                ? ` — ${semestreSelecionado.titulo}`
                : ""}
            </p>
            {semestreSelecionado.descricao ? (
              <p className="text-sm text-blue-800 mt-1">
                {semestreSelecionado.descricao}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
  <MultiSelectDisciplinas
    titulo="Disciplinas contratadas"
    disciplinas={disciplinasDoSemestre}
    selecionadas={disciplinasSelecionadas}
    setSelecionadas={setDisciplinasSelecionadas}
  />

  <MultiSelectDisciplinas
    titulo="Disciplinas extras curriculares"
    disciplinas={disciplinasExtras}
    selecionadas={disciplinasExtrasSelecionadas}
    setSelecionadas={setDisciplinasExtrasSelecionadas}
  />
</div>

{limiteCargaHoraria > 0 && (
  <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
    <div className="font-semibold">
      Carga horária selecionada: {cargaHorariaTotalSelecionada}h / {limiteCargaHoraria}h
    </div>

    <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-blue-100">
      <div
        className={`h-full rounded-full ${
          cargaHorariaExcedida ? "bg-red-500" : "bg-blue-600"
        }`}
        style={{
          width: `${Math.min(
            100,
            Math.round((cargaHorariaTotalSelecionada / limiteCargaHoraria) * 100)
          )}%`,
        }}
      />
    </div>

    {!cargaHorariaExcedida && (
      <p className="mt-2 text-blue-700">
        Ainda disponível: {limiteCargaHoraria - cargaHorariaTotalSelecionada}h
      </p>
    )}
  </div>
)}
      
        <div className="mt-4">
         {cargaHorariaAbaixoMinimo && (
  <div className="mb-4 rounded-xl bg-yellow-100 border border-yellow-300 p-4 text-yellow-700 font-medium">
    ⚠️ A carga horária está abaixo do mínimo exigido.
  </div>
)}

{cargaHorariaExcedida && (
  <div className="mb-4 rounded-xl bg-red-100 border border-red-300 p-4 text-red-700 font-medium">
    ⚠️ Carga horária excedida para este semestre.
    <br />
    Limite: {limiteCargaHoraria}h | Selecionado: {cargaHorariaTotalSelecionada}h
  </div>
)}
          <button
            onClick={criarMatricula}
            disabled={!podeCriar || creating}
            className={[
              "px-4 py-2 rounded-xl font-semibold transition",
              !podeCriar || creating
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700",
            ].join(" ")}
          >
            {creating ? "Criando..." : "Matricular aluno"}
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
  
  {/* ESQUERDA */}
  <h2 className="text-lg font-semibold">Matrículas cadastradas</h2>

  {/* MEIO (busca + filtro) */}
  <div className="flex gap-2 w-full md:w-auto">
    <input
      type="text"
      placeholder="Buscar por aluno, curso, turma, disciplina, professor, status ou ID"
      value={busca}
      onChange={(e) => setBusca(e.target.value)}
      className="w-full md:w-[400px] border rounded-xl px-3 py-2"
    />

    <select
      value={filtroPeriodoMatricula}
      onChange={(e) =>
        setFiltroPeriodoMatricula(
          e.target.value as "HOJE" | "ONTEM" | "7_DIAS" | "MES" | "TODAS"
        )
      }
      className="w-[180px] border rounded-xl px-3 py-2 bg-white"
    >
      <option value="HOJE">Hoje</option>
      <option value="ONTEM">Ontem</option>
      <option value="7_DIAS">7 dias</option>
      <option value="MES">Mês</option>
      <option value="TODAS">Todas</option>
    </select>
  </div>

  {/* DIREITA */}
  <button
    onClick={carregarTudo}
    className="px-3 py-2 rounded-xl border bg-white hover:border-blue-400 transition"
  >
    Recarregar
  </button>

</div>

  <button
            onClick={carregarTudo}
            className="px-3 py-2 rounded-xl border bg-white hover:border-blue-400 transition text-sm"
          >
            Recarregar
          </button>
        </div>

        {loading ? (
  <div className="p-6 text-gray-600">Carregando...</div>
) : matriculasFiltradas.length === 0 ? (
  <div className="p-6 text-gray-600">Nenhuma matrícula encontrada.</div>
) : (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead className="bg-gray-50 border-b">
        <tr className="text-left">
          <th className="px-4 py-3 font-semibold text-gray-700">Aluno</th>
          <th className="px-4 py-3 font-semibold text-gray-700">Curso</th>
          <th className="px-4 py-3 font-semibold text-gray-700">Semestre</th>
          <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
          <th className="px-4 py-3 font-semibold text-gray-700">Disciplinas</th>
          <th className="px-4 py-3 font-semibold text-gray-700">Ações</th>
        </tr>
      </thead>

      <tbody>
        {matriculasFiltradas.map((m) => {
          const alunoNome = m.aluno?.nome ?? "Aluno";
          const cursoNome = m.curso?.nome ?? "Curso";
          const itens = Array.isArray(m.itens) ? m.itens : [];
          const expandida = matriculaExpandidaId === m.id;

          return (
            <React.Fragment key={m.id}>
              <tr key={`linha-${m.id}`} className="border-b align-top hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{alunoNome}</div>
                  <div className="text-xs text-gray-500">ID #{m.id}</div>
                </td>

                <td className="px-4 py-3 text-gray-700">{cursoNome}</td>

                <td className="px-4 py-3 text-gray-700">
                  {m.semestre ? `${m.semestre}º semestre` : "-"}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-block text-xs px-3 py-1 rounded-full ${
                      m.status === "ATIVA"
                        ? "bg-green-100 text-green-700"
                        : m.status === "A_INICIAR"
                        ? "bg-blue-100 text-blue-700"
                        : m.status === "TRANCADA"
                        ? "bg-yellow-100 text-yellow-700"
                        : m.status === "SUSPENSA"
                        ? "bg-orange-100 text-orange-700"
                        : m.status === "CONCLUIDA"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {m.status || "ATIVA"}
                  </span>
                </td>

                <td className="px-4 py-3 text-gray-700">
                  {itens.length} disciplina(s)
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setMatriculaExpandidaId(expandida ? null : m.id)
                      }
                      className="px-3 py-2 rounded-xl text-sm border bg-white hover:border-blue-400"
                    >
                      {expandida ? "Ocultar detalhes" : "Ver detalhes"}
                    </button>

                    <button
                      onClick={() => abrirEdicao(m)}
                      className="px-3 py-2 rounded-xl text-sm font-semibold transition border bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                      ✏️ Editar
                    </button>

                    <button
                      onClick={() => abrirPdfContratoDaMatricula(m.id)}
                      className="px-3 py-2 rounded-xl text-sm border bg-white hover:border-green-400 hover:text-green-700"
                    >
                      📄 Contrato
                    </button>

                    <button
                      onClick={() => assinarContratoDaMatricula(m.id)}
                      className="px-3 py-2 rounded-xl text-sm border bg-white hover:border-blue-400 hover:text-blue-700"
                    >
                      ✍️ Assinar
                    </button>

<button
  onClick={() => abrirAssinaturaSecretaria(m.id)}
  className="px-3 py-2 rounded-xl text-sm border bg-white hover:border-purple-400 hover:text-purple-700"
>
  🖊️ Assinar Secretaria
</button>

                  </div>
                </td>
              </tr>

              {expandida && (
                <tr key={`detalhes-${m.id}`} className="border-b bg-gray-50">
                  <td colSpan={6} className="px-4 py-4">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => alterarStatusMatricula(m.id, "A_INICIAR")}
                          className="px-3 py-2 rounded-xl text-sm border bg-white hover:border-blue-400"
                        >
                          A iniciar
                        </button>

                        <button
                          onClick={() => alterarStatusMatricula(m.id, "ATIVA")}
                          className="px-3 py-2 rounded-xl text-sm border bg-white hover:border-green-400"
                        >
                          Ativar
                        </button>

                        <button
                          onClick={() => alterarStatusMatricula(m.id, "TRANCADA")}
                          className="px-3 py-2 rounded-xl text-sm border bg-white hover:border-yellow-400"
                        >
                          Trancar
                        </button>

                        <button
                          onClick={() => alterarStatusMatricula(m.id, "SUSPENSA")}
                          className="px-3 py-2 rounded-xl text-sm border bg-white hover:border-orange-400"
                        >
                          Suspender
                        </button>

                        <button
                          onClick={() => alterarStatusMatricula(m.id, "CONCLUIDA")}
                          className="px-3 py-2 rounded-xl text-sm border bg-white hover:border-purple-400"
                        >
                          Concluir
                        </button>

                        <button
                          onClick={() => alterarStatusMatricula(m.id, "CANCELADA")}
                          className="px-3 py-2 rounded-xl text-sm border bg-white hover:border-red-400 hover:text-red-600"
                        >
                          Cancelar
                        </button>

                        <button
                          onClick={() => excluirMatricula(m.id)}
                          disabled={removingId === m.id}
                          className={[
                            "px-4 py-2 rounded-xl text-sm font-semibold transition border",
                            removingId === m.id
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                              : "bg-white hover:border-red-400 hover:text-red-600",
                          ].join(" ")}
                        >
                          {removingId === m.id ? "Excluindo..." : "Excluir"}
                        </button>
                      </div>

                      <div>
                        {itens.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            Nenhuma disciplina vinculada.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {itens.map((item) => {
                              const turma = item.turma;
                              const disciplinaNome =
                              (item as any)?.disciplina?.nome ?? "Disciplina";
                              const turmaNome = turma?.nome ?? "Turma";
                              const profNome = turma?.professor?.nome ?? "—";
                              const qtdAulas = turma?._count?.aulas ?? 0;

                              return (
                                <div
                                  key={item.id}
                                  className="text-sm text-gray-600 border rounded-xl p-3 bg-white"
                                >
                                  <p className="font-medium text-gray-800">
                                    {disciplinaNome}
                                  </p>
                                  <p>
                                    Turma: {turmaNome} • Prof: {profNome} • Aulas: {qtdAulas}
                                  </p>
                                  <p className="mt-1">
                                    Status da disciplina:{" "}
                                    <span className="font-medium text-gray-800">
                                      {labelStatusItem(item.status)}
                                    </span>
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  </div>
)}
      </div>

      {matriculaEditando && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white p-6 rounded-2xl w-full max-w-5xl shadow-xl max-h-[90vh] overflow-auto relative">
      <button
  onClick={() => setMatriculaEditando(null)}
  className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl font-bold"
>
  ×
</button>
      <h2 className="text-lg font-bold mb-4">Editar matrícula</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Aluno</label>
          <select
            value={matriculaEditando.alunoId}
            onChange={(e) =>
              setMatriculaEditando((prev) =>
                prev ? { ...prev, alunoId: e.target.value } : prev
              )
            }
            className="mt-1 w-full border rounded-xl px-3 py-2 bg-white"
          >
            <option value="">Selecione...</option>
            {alunos.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Curso</label>
          <select
            value={matriculaEditando.cursoId}
            onChange={async (e) => {
              const novoCursoId = e.target.value;
              await carregarSemestresDoCurso(novoCursoId);

              setMatriculaEditando((prev) =>
                prev
                  ? {
                      ...prev,
                      cursoId: novoCursoId,
                      cursoSemestreId: "",
                      semestre: "",
                      turmaIds: [],
                    }
                  : prev
              );
            }}
            className="mt-1 w-full border rounded-xl px-3 py-2 bg-white"
          >
            <option value="">Selecione...</option>
            {cursos.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Semestre do curso
          </label>
          <select
            value={matriculaEditando.cursoSemestreId}
            onChange={(e) => {
              const semestreId = e.target.value;
              const semestreObj = semestresCurso.find(
                (s) => s.id === Number(semestreId)
              );

              setMatriculaEditando((prev) =>
                prev
                  ? {
                      ...prev,
                      cursoSemestreId: semestreId,
                      semestre: semestreObj ? Number(semestreObj.numero) : "",
                      turmaIds: [],
                    }
                  : prev
              );
            }}
            className="mt-1 w-full border rounded-xl px-3 py-2 bg-white"
            disabled={!matriculaEditando.cursoId}
          >
            <option value="">Selecione...</option>
            {semestresCurso.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.numero}º semestre{s.titulo ? ` — ${s.titulo}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Nome social</label>
          <input
            type="text"
            value={matriculaEditando.nomeSocial}
            onChange={(e) =>
              setMatriculaEditando((prev) =>
                prev ? { ...prev, nomeSocial: e.target.value } : prev
              )
            }
            className="mt-1 w-full border rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Gênero</label>
          <select
            value={matriculaEditando.genero}
            onChange={(e) =>
              setMatriculaEditando((prev) =>
                prev ? { ...prev, genero: e.target.value } : prev
              )
            }
            className="mt-1 w-full border rounded-xl px-3 py-2 bg-white"
          >
            <option value="">Selecione...</option>
            <option value="FEMININO">Feminino</option>
            <option value="MASCULINO">Masculino</option>
            <option value="NAO_BINARIO">Não binário</option>
            <option value="OUTRO">Outro</option>
            <option value="PREFIRO_NAO_INFORMAR">Prefiro não informar</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Valor pago no ato da matrícula
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={matriculaEditando.valorPagoMatricula}
            onChange={(e) =>
              setMatriculaEditando((prev) =>
                prev ? { ...prev, valorPagoMatricula: e.target.value } : prev
              )
            }
            className="mt-1 w-full border rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Valor da mensalidade
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={matriculaEditando.valorMensalidade}
            onChange={(e) =>
              setMatriculaEditando((prev) =>
                prev ? { ...prev, valorMensalidade: e.target.value } : prev
              )
            }
            className="mt-1 w-full border rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Quantidade de mensalidades
          </label>
          <input
            type="number"
            min="1"
            value={matriculaEditando.quantidadeMensalidades}
            onChange={(e) =>
              setMatriculaEditando((prev) =>
                prev
                  ? { ...prev, quantidadeMensalidades: e.target.value }
                  : prev
              )
            }
            className="mt-1 w-full border rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Primeiro vencimento
          </label>
          <input
            type="date"
            value={matriculaEditando.primeiroVencimento}
            onChange={(e) =>
              setMatriculaEditando((prev) =>
                prev ? { ...prev, primeiroVencimento: e.target.value } : prev
              )
            }
            className="mt-1 w-full border rounded-xl px-3 py-2"
          />
        </div>
      </div>

      <div className="mt-5">
  <label className="text-sm font-medium text-gray-700">
    Disciplinas contratadas do semestre
  </label>

  <div className="mt-2 border rounded-2xl p-4 max-h-64 overflow-auto space-y-4">
    {matriculaEditando.cursoId && matriculaEditando.cursoSemestreId ? (
      disciplinasBaseEdicaoAgrupadas.length > 0 ? (
        disciplinasBaseEdicaoAgrupadas.map((grupo) =>
          renderGrupoDisciplina(
            grupo,
            matriculaEditando.turmaIds,
            toggleTurmaEdicao
          )
        )
      ) : (
        <p className="text-sm text-gray-500">
          Nenhuma disciplina encontrada para este semestre.
        </p>
      )
    ) : (
      <p className="text-sm text-gray-500">
        Selecione primeiro o curso e o semestre do curso.
      </p>
    )}
  </div>
</div>

      <div className="mt-5">
  <label className="text-sm font-medium text-gray-700">
    Disciplinas extras contratadas
  </label>
  <p className="text-xs text-gray-500 mt-1">
    Use esta área para adicionar disciplinas fora da grade padrão daquele semestre.
  </p>

  <div className="mt-2 border rounded-2xl p-4 max-h-64 overflow-auto space-y-4">
    {matriculaEditando.cursoId && matriculaEditando.cursoSemestreId ? (
      disciplinasExtrasEdicaoAgrupadas.length > 0 ? (
        disciplinasExtrasEdicaoAgrupadas.map((grupo) =>
          renderGrupoDisciplina(
            grupo,
            matriculaEditando.turmaIds,
            toggleTurmaEdicao
          )
        )
      ) : (
        <p className="text-sm text-gray-500">
          Nenhuma disciplina extra encontrada para este curso.
        </p>
      )
    ) : (
      <p className="text-sm text-gray-500">
        Selecione primeiro o curso e o semestre do curso.
      </p>
    )}
  </div>
</div>

<div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
  <MultiSelectDisciplinas
    titulo="Disciplinas contratadas"
    disciplinas={disciplinasDoSemestreEdicao}
    selecionadas={disciplinasEdicaoSelecionadas}
    setSelecionadas={setDisciplinasEdicaoSelecionadas}
  />

  <MultiSelectDisciplinas
    titulo="Disciplinas extras contratadas"
    disciplinas={disciplinasExtrasEdicaoDisponiveis}
    selecionadas={disciplinasExtrasEdicaoSelecionadas}
    setSelecionadas={setDisciplinasExtrasEdicaoSelecionadas}
  />
</div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={salvarEdicao}
          className="bg-green-600 text-white px-4 py-2 rounded-xl"
        >
          Salvar
        </button>

        <button
          onClick={() => setMatriculaEditando(null)}
          className="bg-gray-400 text-white px-4 py-2 rounded-xl"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}

{modalSecretariaAberto && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Assinatura do Atendente / Secretaria
          </h2>
          <p className="text-sm text-gray-600">
            Assine abaixo para registrar a assinatura administrativa no contrato.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalSecretariaAberto(false)}
          className="text-2xl font-bold text-gray-500 hover:text-red-600"
        >
          ×
        </button>
      </div>

      <canvas
        ref={canvasSecretariaRef}
        width={700}
        height={220}
        className="w-full rounded-xl border bg-white"
        onMouseDown={iniciarDesenhoSecretaria}
        onMouseUp={pararDesenhoSecretaria}
        onMouseMove={desenharSecretaria}
        onMouseLeave={pararDesenhoSecretaria}
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={limparAssinaturaSecretaria}
          disabled={salvandoSecretaria}
          className="rounded-xl bg-gray-500 px-4 py-2 text-white disabled:opacity-50"
        >
          Limpar
        </button>

        <button
          type="button"
          onClick={salvarAssinaturaSecretaria}
          disabled={salvandoSecretaria}
          className="rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {salvandoSecretaria ? "Salvando..." : "Salvar assinatura"}
        </button>
        <button
  type="button"
  onClick={assinarDigitalmenteSecretaria}
  disabled={salvandoSecretaria}
  className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
>
  🔐 Assinar digitalmente
</button>
      </div>
    </div>
  </div>
)}

<PhanyxConfirmModal
  aberto={confirmModalAberto}
  titulo={confirmTitulo}
  mensagem={confirmMensagem}
  textoConfirmar={confirmAcao ? "Confirmar" : "Entendi"}
  textoCancelar={confirmAcao ? "Cancelar" : ""}
  onConfirmar={async () => {
  setConfirmModalAberto(false);

  if (confirmAcao) {
    await confirmAcao();
  }

  setConfirmAcao(null);
}}
  onCancelar={() => {
    setConfirmModalAberto(false);
    setConfirmAcao(null);
  }}
/>

    </div>
  );
}

export default withAuth(AdminMatriculasPage, ["admin"]);