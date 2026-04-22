"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import withAuth from "@/lib/withAuth";
import MultiSelectDisciplinas from "@/components/MultiSelectDisciplinas";

type CursoOption = {
  id: number;
  nome: string;
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
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [matriculaEditando, setMatriculaEditando] =
    useState<MatriculaEdicao | null>(null);
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<number[]>([]);
  const [disciplinasExtrasSelecionadas, setDisciplinasExtrasSelecionadas] = useState<number[]>([]);
  const [matriculas, setMatriculas] = useState<MatriculaApi[]>([]);
  const [alunos, setAlunos] = useState<AlunoOption[]>([]);
  const [cursos, setCursos] = useState<CursoOption[]>([]);
  const [turmas, setTurmas] = useState<TurmaOption[]>([]);
  const [semestresCurso, setSemestresCurso] = useState<CursoSemestreOption[]>(
    []
  );

  const [alunoId, setAlunoId] = useState<string>("");
  const [cursoId, setCursoId] = useState<string>("");
  const [cursoSemestreId, setCursoSemestreId] = useState<string>("");
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<number[]>([]);
  const [valorPagoMatricula, setValorPagoMatricula] = useState<string>("");
  const [valorMensalidade, setValorMensalidade] = useState<string>("");
  const [quantidadeParcelas, setQuantidadeParcelas] = useState<string>("");
  const [dataPrimeiroVencimento, setDataPrimeiroVencimento] = useState<string>("");

  const [statusInicialMatricula, setStatusInicialMatricula] =
  useState<string>("ATIVA");

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
        ).map((t: any) => ({
          id: Number(t.id),
          nome: String(t.nome ?? "Turma"),
          semestre: t?.semestre ?? null,
          disciplinaId: t?.disciplina?.id ?? null,
          disciplinaNome: t?.disciplina?.nome ?? null,
          professorNome: t?.professor?.nome ?? null,
          cursoId:
            t?.disciplina?.cursoId ??
            t?.cursoId ??
            t?.disciplina?.curso?.id ??
            null,
        }));

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

  const semestreSelecionado = useMemo(() => {



    return (
      semestresCurso.find((s) => s.id === Number(cursoSemestreId)) ?? null
    );
  }, [semestresCurso, cursoSemestreId]);

  const disciplinasDoSemestreIds = useMemo(() => {
    return semestreSelecionado
      ? semestreSelecionado.disciplinas.map((d) => d.disciplinaId)
      : [];
  }, [semestreSelecionado]);

const disciplinasDoSemestre = useMemo(() => {
  if (!semestreSelecionado) return [];

  return [...semestreSelecionado.disciplinas]
    .map((item) => ({
      id: item.disciplina?.id ?? item.disciplinaId,
      nome: item.disciplina?.nome ?? "Disciplina",
      cargaHoraria: item.disciplina?.cargaHoraria ?? 0,
    }))
    .filter((d) => Number.isFinite(d.id))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}, [semestreSelecionado]);

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

const matriculasFiltradas = useMemo(() => {
  const termo = busca.trim().toLowerCase();
  if (!termo) return matriculas;

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

    return (
      id.includes(termo) ||
      aluno.includes(termo) ||
      curso.includes(termo) ||
      status.includes(termo) ||
      semestre.includes(termo) ||
      itensTexto.includes(termo)
    );
  });
}, [matriculas, busca]);

  const podeCriar = useMemo(() => {
    const a = Number(alunoId);
    const c = Number(cursoId);



    return (
      Number.isFinite(a) &&
      a > 0 &&
      Number.isFinite(c) &&
      c > 0 &&
      Number(cursoSemestreId) > 0 &&
      turmasSelecionadas.length > 0
    );
  }, [alunoId, cursoId, cursoSemestreId, turmasSelecionadas]);

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
    if (!podeCriar || !semestreSelecionado) return;

    setCreating(true);

    try {
      const res = await fetch("/api/matricula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
  alunoId: Number(alunoId),
  cursoId: Number(cursoId),
  semestre: Number(semestreSelecionado.numero),
  turmaIds: turmasSelecionadas,
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

      alert("Matrícula criada com sucesso!");

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
      alert(e.message);
    } finally {
      setCreating(false);
    }
  }

useEffect(() => {
  const idsBase = turmasBaseDoSemestre
    .filter((t) => t.disciplinaId && disciplinasSelecionadas.includes(Number(t.disciplinaId)))
    .map((t) => t.id);

  const idsExtras = turmasExtrasMesmoCurso
    .filter((t) => t.disciplinaId && disciplinasExtrasSelecionadas.includes(Number(t.disciplinaId)))
    .map((t) => t.id);

  setTurmasSelecionadas([...new Set([...idsBase, ...idsExtras])]);
}, [
  disciplinasSelecionadas,
  disciplinasExtrasSelecionadas,
  turmasBaseDoSemestre,
  turmasExtrasMesmoCurso,
]);

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
        alert(data?.error || "Erro ao gerar contrato.");
        return null;
      }

      return data;
    } catch (error) {
      console.error("Erro ao gerar contrato:", error);
      alert("Erro ao gerar contrato.");
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
          alert("Não foi possível obter o link de assinatura.");
          return;
        }

        window.open(`/assinatura/${dataCriado.tokenAssinatura}`, "_blank");
        return;
      }

      if (!data?.tokenAssinatura) {
        alert("Este contrato ainda não possui token de assinatura.");
        return;
      }

      window.open(`/assinatura/${data.tokenAssinatura}`, "_blank");
    } catch (error) {
      console.error("Erro ao abrir assinatura:", error);
      alert("Erro ao abrir assinatura do contrato.");
    }
  }

  async function abrirPdfContratoDaMatricula(matriculaId: number) {
    window.open(`/api/admin/contratos/pdf?matriculaId=${matriculaId}`, "_blank");
  }

  async function abrirEdicao(matricula: MatriculaApi) {
  const cursoIdAtual = matricula.curso?.id ? String(matricula.curso.id) : "";
  const semestreAtual = matricula.semestre || "";
  const turmaIdsAtuais = Array.isArray(matricula.itens)
    ? matricula.itens
        .map((item) => item.turma?.id)
        .filter((id): id is number => Number.isFinite(id))
    : [];

  let semestreEncontrado: any = null;

  if (cursoIdAtual) {
    const semestres = await carregarSemestresDoCurso(cursoIdAtual);

    semestreEncontrado =
      semestres?.find((s: any) => Number(s.numero) === Number(semestreAtual)) ??
      null;
  }

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

  try {
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
        semestre:
          matriculaEditando.semestre === ""
            ? null
            : Number(matriculaEditando.semestre),
        turmaIds: matriculaEditando.turmaIds,
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
        primeiroVencimento:
          matriculaEditando.primeiroVencimento || null,
        nomeSocial: matriculaEditando.nomeSocial,
        genero: matriculaEditando.genero,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao atualizar matrícula");
    }

    alert("Matrícula atualizada com sucesso!");
    setMatriculaEditando(null);
    await carregarTudo();
  } catch (err: any) {
    alert(err.message);
  }
}

  async function excluirMatricula(id: number) {
    if (!confirm("Tem certeza que deseja excluir esta matrícula?")) return;

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
        alert(data?.error ?? "Erro ao excluir matrícula.");
        return;
      }

      setMatriculas((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setRemovingId(null);
    }
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
        alert(data?.error ?? "Erro ao atualizar status da matrícula.");
        return;
      }

      await carregarTudo();
      alert("Status da matrícula atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status da matrícula.");
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
      <div>
        <h1 className="text-2xl font-bold">📌 Matrículas</h1>
        <p className="text-gray-600 mt-1">
          Gerencie a matrícula por curso, semestre do curso e disciplinas
          contratadas.
        </p>
      </div>

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
            <select
              value={cursoSemestreId}
              onChange={(e) => setCursoSemestreId(e.target.value)}
              className="mt-1 w-full border rounded-xl px-3 py-2 bg-white"
              disabled={!cursoId}
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

      
        <div className="mt-4">
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
  <div className="flex flex-col gap-3 md:flex-row md:items-center">
    <h2 className="text-lg font-semibold">Matrículas cadastradas</h2>

    <input
      type="text"
      placeholder="Buscar por aluno, curso, turma, disciplina, professor, status ou ID"
      value={busca}
      onChange={(e) => setBusca(e.target.value)}
      className="w-full md:w-[520px] border rounded-xl px-3 py-2"
    />
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
          <div className="divide-y">
            {matriculasFiltradas.map((m) => {
              const alunoNome = m.aluno?.nome ?? "Aluno";
              const cursoNome = m.curso?.nome ?? "Curso";
              const itens = Array.isArray(m.itens) ? m.itens : [];

              return (
                <div key={m.id} className="p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="space-y-2">
                        <p className="font-semibold">
                          {alunoNome}{" "}
                          <span className="text-gray-400">→</span> {cursoNome}
                          {m.semestre ? ` • ${m.semestre}º semestre` : ""}
                        </p>

                        <div>
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
                        </div>
                      </div>

                      <div className="mt-2 space-y-2">
                        {itens.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            Nenhuma disciplina vinculada.
                          </p>
                        ) : (
                          itens.map((item) => {
                            const turma = item.turma;
                            const disciplinaNome =
                              turma?.disciplina?.nome ?? "Disciplina";
                            const turmaNome = turma?.nome ?? "Turma";
                            const profNome = turma?.professor?.nome ?? "—";
                            const qtdAulas = turma?._count?.aulas ?? 0;

                            return (
                              <div
                                key={item.id}
                                className="text-sm text-gray-600 border rounded-xl p-3"
                              >
                                <p className="font-medium text-gray-800">
                                  {disciplinaNome}
                                </p>
                                <p>
                                  Turma: {turmaNome} • Prof: {profNome} • Aulas:{" "}
                                  {qtdAulas}
                                </p>
                                <p className="mt-1">
                                  Status da disciplina:{" "}
                                  <span className="font-medium text-gray-800">
                                    {labelStatusItem(item.status)}
                                  </span>
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() =>
                          alterarStatusMatricula(m.id, "A_INICIAR")
                        }
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
                        onClick={() => assinarContratoDaMatricula(m.id)}
                        className="px-3 py-2 rounded-xl text-sm border bg-white hover:border-blue-400 hover:text-blue-700"
                      >
                        ✍️ Assinar contrato
                      </button>

                      <button
                        onClick={() => abrirPdfContratoDaMatricula(m.id)}
                        className="px-3 py-2 rounded-xl text-sm border bg-white hover:border-green-400 hover:text-green-700"
                      >
                        📄 Contrato
                      </button>

                      <button
                        onClick={() => abrirEdicao(m)}
                        className="px-3 py-2 rounded-xl text-sm font-semibold transition border bg-yellow-500 text-white hover:bg-yellow-600"
                      >
                        ✏️ Editar
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
                  </div>
                </div>
              );
            })}
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
    </div>
  );
}

export default withAuth(AdminMatriculasPage, ["admin"]);