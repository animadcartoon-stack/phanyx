"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Curso = {
  id: number;
  nome: string;
};

type Professor = {
  id: number;
  nome: string;
};

type TurmaApi = {
  id: number;
  nome?: string | null;
  codigo?: string | null;
  semestre?: string | null;
  periodoLetivo?: string | null;
};

type DisciplinaDetalhe = {
  id: number;
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  cargaHoraria?: number | null;
  semestre?: number | null;
  cursoId?: number | null;
  professorId?: number | null;
  professor?: Professor | null;
  professoresHabilitados?: {
  id: number;
  professorId: number;
  professor?: Professor | null;
}[];
prerequisitosDaDisciplina?: {
  id: number;
  prerequisitoId: number;
}[];
  curso?: Curso | null;
  turmaDisciplinas?: {
    id: number;
    turmaId: number;
    disciplinaId: number;
    turma?: TurmaApi | null;
  }[];
};

function nomeTurma(turma: TurmaApi) {
  return turma.nome || turma.codigo || `Turma #${turma.id}`;
}

export default function DisciplinaDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const disciplinaId = Number(params.disciplinaId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [semestre, setSemestre] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [professoresHabilitadosIds, setProfessoresHabilitadosIds] = useState<string[]>([]);
  const [turmaIds, setTurmaIds] = useState<string[]>([]);
  const [preRequisitoIds, setPreRequisitoIds] = useState<string[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [turmas, setTurmas] = useState<TurmaApi[]>([]);
  const [disciplinas, setDisciplinas] = useState<DisciplinaDetalhe[]>([]);

  function alternarTurma(id: number) {
    setTurmaIds((atual) =>
      atual.includes(String(id))
        ? atual.filter((item) => item !== String(id))
        : [...atual, String(id)]
    );
  }

function alternarProfessor(id: number) {
  setProfessoresHabilitadosIds((atual) =>
    atual.includes(String(id))
      ? atual.filter((item) => item !== String(id))
      : [...atual, String(id)]
  );
}

function alternarPreRequisito(id: number) {
  setPreRequisitoIds((atual) =>
    atual.includes(String(id))
      ? atual.filter((item) => item !== String(id))
      : [...atual, String(id)]
  );
}

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch(`/api/disciplina/${disciplinaId}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Erro ao carregar disciplina");
          router.push("/admin/disciplinas");
          return;
        }

        const disciplina: DisciplinaDetalhe = data;

        setNome(disciplina.nome ?? "");
        setCodigo(disciplina.codigo ?? "");
        setDescricao(disciplina.descricao ?? "");
        setCargaHoraria(
          disciplina.cargaHoraria !== null && disciplina.cargaHoraria !== undefined
            ? String(disciplina.cargaHoraria)
            : ""
        );
        setSemestre(
          disciplina.semestre !== null && disciplina.semestre !== undefined
            ? String(disciplina.semestre)
            : ""
        );
        setCursoId(
          disciplina.cursoId !== null && disciplina.cursoId !== undefined
            ? String(disciplina.cursoId)
            : ""
        );

setProfessorId(
  disciplina.professorId !== null && disciplina.professorId !== undefined
    ? String(disciplina.professorId)
    : ""
);
setProfessoresHabilitadosIds(
  Array.isArray(disciplina.professoresHabilitados)
    ? disciplina.professoresHabilitados
        .map((item) => item.professorId)
        .filter((id): id is number => Number.isFinite(id))
        .map(String)
    : []
);

setPreRequisitoIds(
  Array.isArray(disciplina.prerequisitosDaDisciplina)
    ? disciplina.prerequisitosDaDisciplina
        .map((item) => item.prerequisitoId)
        .filter((id): id is number => Number.isFinite(id))
        .map(String)
    : []
);

        const vinculos = Array.isArray(disciplina.turmaDisciplinas)
          ? disciplina.turmaDisciplinas
          : [];

        setTurmaIds(
          vinculos
            .map((item) => item?.turmaId)
            .filter((id): id is number => Number.isFinite(id))
            .map(String)
        );

        try {
          const resCursos = await fetch("/api/curso", {
            credentials: "include",
          });
          const dataCursos = await resCursos.json();
          setCursos(Array.isArray(dataCursos) ? dataCursos : []);
        } catch {
          setCursos([]);
        }

try {
  const resProfessores = await fetch("/api/professor", {
    credentials: "include",
  });
  const dataProfessores = await resProfessores.json();
  setProfessores(Array.isArray(dataProfessores) ? dataProfessores : []);
} catch {
  setProfessores([]);
}
try {
  const resDisciplinas = await fetch("/api/disciplina", {
    credentials: "include",
  });
  const dataDisciplinas = await resDisciplinas.json();
  setDisciplinas(Array.isArray(dataDisciplinas) ? dataDisciplinas : []);
} catch {
  setDisciplinas([]);
}
        try {
          const resTurmas = await fetch("/api/turma", {
            credentials: "include",
          });
          const dataTurmas = await resTurmas.json();
          setTurmas(Array.isArray(dataTurmas) ? dataTurmas : []);
        } catch {
          setTurmas([]);
        }
      } finally {
        setLoading(false);
      }
    }

    if (Number.isFinite(disciplinaId) && disciplinaId > 0) {
      carregar();
    } else {
      alert("ID de disciplina inválido");
      router.push("/admin/disciplinas");
    }
  }, [disciplinaId, router]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    try {
      const res = await fetch(`/api/disciplina/${disciplinaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome,
          codigo: codigo || null,
          descricao: descricao || null,
          cargaHoraria: cargaHoraria ? Number(cargaHoraria) : null,
          semestre: semestre ? Number(semestre) : null,
          cursoId: cursoId ? Number(cursoId) : null,
          turmaIds: turmaIds.map(Number),
          professorId: professorId ? Number(professorId) : null,
          professoresHabilitadosIds: professoresHabilitadosIds.map(Number),
          preRequisitoIds: preRequisitoIds.map(Number),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao salvar disciplina");
        return;
      }

      alert("Disciplina atualizada com sucesso");
      router.push("/admin/disciplinas");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Carregando disciplina...</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/admin/disciplinas")}
        className="text-blue-600 hover:underline"
      >
        ← Voltar para disciplinas
      </button>

      <div>
        <h1 className="text-2xl font-bold">✏️ Editar disciplina</h1>
        <p className="mt-1 text-gray-600">
          Atualize os dados da disciplina e vincule esta disciplina às turmas desejadas.
        </p>
      </div>

      <form
        onSubmit={salvar}
        className="bg-white border rounded-2xl p-6 shadow-sm space-y-4 max-w-3xl"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código
          </label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 min-h-[100px]"
            placeholder="Opcional"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Carga horária
            </label>
            <input
              type="number"
              min="0"
              value={cargaHoraria}
              onChange={(e) => setCargaHoraria(e.target.value)}
              className="w-full border rounded-xl px-3 py-2"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semestre
            </label>
            <input
              type="number"
              min="1"
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              className="w-full border rounded-xl px-3 py-2"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curso
            </label>
            <select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 bg-white"
            >
              <option value="">Sem curso vinculado</option>
              {cursos.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.nome}
                </option>
              ))}
            </select>

<div className="pt-2">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Professores habilitados para esta disciplina
  </label>

  <div className="rounded-xl border bg-white p-3 max-h-56 overflow-y-auto space-y-2">
    {professores.length === 0 ? (
      <p className="text-sm text-slate-500">Nenhum professor encontrado.</p>
    ) : (
      professores.map((professor) => (
        <label
          key={professor.id}
          className="flex items-center gap-3 rounded-lg border p-2 cursor-pointer hover:bg-slate-50"
        >
          <input
            type="checkbox"
            checked={professoresHabilitadosIds.includes(String(professor.id))}
            onChange={() => alternarProfessor(professor.id)}
          />

          <span className="text-sm font-medium text-slate-800">
            {professor.nome}
          </span>
        </label>
      ))
    )}
  </div>

  <p className="mt-1 text-xs text-slate-500">
    Marque todos os professores que podem lecionar esta disciplina.
  </p>
</div>

          </div>

        </div>

<div className="pt-2">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Pré-requisitos desta disciplina
  </label>

  <div className="rounded-xl border bg-white p-3 max-h-56 overflow-y-auto space-y-2">
    {disciplinas.length === 0 ? (
      <p className="text-sm text-slate-500">Nenhuma disciplina encontrada.</p>
    ) : (
      disciplinas
        .filter((disciplina) => disciplina.id !== disciplinaId)
        .map((disciplina) => (
          <label
            key={disciplina.id}
            className="flex items-center gap-3 rounded-lg border p-2 cursor-pointer hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={preRequisitoIds.includes(String(disciplina.id))}
              onChange={() => alternarPreRequisito(disciplina.id)}
            />

            <span className="text-sm font-medium text-slate-800">
              {disciplina.nome}
            </span>
          </label>
        ))
    )}
  </div>

  <p className="mt-1 text-xs text-slate-500">
    Marque as disciplinas que o aluno precisa concluir antes de cursar esta.
  </p>
</div>

        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Turmas
          </label>

          <div className="rounded-xl border bg-white p-3 max-h-56 overflow-y-auto space-y-2">
            {turmas.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma turma encontrada.</p>
            ) : (
              turmas.map((turma) => (
                <label
                  key={turma.id}
                  className="flex items-start gap-3 rounded-lg border p-2 cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={turmaIds.includes(String(turma.id))}
                    onChange={() => alternarTurma(turma.id)}
                    className="mt-1"
                  />

                  <div className="text-sm">
                    <div className="font-medium text-slate-800">
                      {nomeTurma(turma)}
                    </div>

                    <div className="text-slate-500">
                      {turma.semestre ? `Semestre: ${turma.semestre}` : "Sem semestre"}
                      {turma.periodoLetivo ? ` • ${turma.periodoLetivo}` : ""}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Você pode vincular esta disciplina a várias turmas.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observação
          </label>
          <div className="w-full border rounded-xl px-3 py-2 bg-slate-50 text-sm text-slate-600">
            O vínculo de professor será tratado na próxima etapa junto com a estrutura de polos.
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/disciplinas")}
            className="border px-4 py-2 rounded-xl"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}