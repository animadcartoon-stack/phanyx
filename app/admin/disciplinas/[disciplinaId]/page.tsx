"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Curso = {
  id: number;
  nome: string;
};

type ProfessorApi = {
  id: number;
  nome?: string | null;
  email?: string | null;
  user?: {
    nome?: string | null;
    email?: string | null;
  } | null;
};

type ProfessorOption = {
  id: number;
  nome: string;
};

type TurmaDaDisciplina = {
  id: number;
  nome?: string | null;
  codigo?: string | null;
  semestre?: number | null;
  professorId?: number | null;
  professor?: {
    id: number;
    nome?: string | null;
    email?: string | null;
    user?: {
      nome?: string | null;
      email?: string | null;
    } | null;
  } | null;
};

type DisciplinaDetalhe = {
  id: number;
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  cargaHoraria?: number | null;
  semestre?: number | null;
  cursoId?: number | null;
  curso?: Curso | null;
  turmas?: TurmaDaDisciplina[];
};

type VinculoProfessorTurma = {
  turmaId: number;
  professorId: string;
};

function nomeProfessor(item: ProfessorApi | TurmaDaDisciplina["professor"] | null | undefined) {
  if (!item) return "";
  return (
    item.nome ||
    item.user?.nome ||
    item.email ||
    item.user?.email ||
    "Professor sem nome"
  );
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

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [professores, setProfessores] = useState<ProfessorOption[]>([]);
  const [turmas, setTurmas] = useState<TurmaDaDisciplina[]>([]);
  const [vinculosProfessorTurma, setVinculosProfessorTurma] = useState<VinculoProfessorTurma[]>([]);

  const possuiTurmas = turmas.length > 0;

  const professoresOrdenados = useMemo(() => {
    return [...professores].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [professores]);

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

        const turmasDaDisciplina = Array.isArray(disciplina.turmas) ? disciplina.turmas : [];
        setTurmas(turmasDaDisciplina);
        setVinculosProfessorTurma(
          turmasDaDisciplina.map((turma) => ({
            turmaId: turma.id,
            professorId:
              turma.professorId !== null && turma.professorId !== undefined
                ? String(turma.professorId)
                : "",
          }))
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

          const lista = Array.isArray(dataProfessores) ? dataProfessores : [];
          const normalizados: ProfessorOption[] = lista
            .filter((item: any) => item && item.id)
            .map((item: ProfessorApi) => ({
              id: item.id,
              nome: nomeProfessor(item) || `Professor #${item.id}`,
            }));

          setProfessores(normalizados);
        } catch {
          setProfessores([]);
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

  function alterarProfessorDaTurma(turmaId: number, professorId: string) {
    setVinculosProfessorTurma((estadoAtual) =>
      estadoAtual.map((item) =>
        item.turmaId === turmaId ? { ...item, professorId } : item
      )
    );
  }

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
          vinculosProfessorTurma: vinculosProfessorTurma.map((item) => ({
            turmaId: item.turmaId,
            professorId: item.professorId ? Number(item.professorId) : null,
          })),
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
        <p className="mt-1 text-gray-600">Atualize os dados da disciplina.</p>
      </div>

      <form
        onSubmit={salvar}
        className="max-w-3xl space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Código
          </label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Opcional"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Descrição
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="min-h-[100px] w-full rounded-xl border px-3 py-2"
            placeholder="Opcional"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Carga horária
            </label>
            <input
              type="number"
              min="0"
              value={cargaHoraria}
              onChange={(e) => setCargaHoraria(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Semestre
            </label>
            <input
              type="number"
              min="1"
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Opcional"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Curso
            </label>
            <select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              className="w-full rounded-xl border bg-white px-3 py-2"
            >
              <option value="">Sem curso vinculado</option>
              {cursos.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Professor por turma
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              A disciplina pode ter uma ou mais turmas. A atribuição do professor
              é feita por turma.
            </p>
          </div>

          {!possuiTurmas ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Esta disciplina ainda não possui turmas vinculadas. Crie uma turma
              para depois atribuir um professor.
            </div>
          ) : (
            <div className="space-y-4">
              {turmas.map((turma) => {
                const vinculo = vinculosProfessorTurma.find(
                  (item) => item.turmaId === turma.id
                );

                return (
                  <div
                    key={turma.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-3">
                      <div className="font-medium text-slate-900">
                        {turma.nome || `Turma #${turma.id}`}
                      </div>
                      <div className="text-sm text-slate-500">
                        {turma.codigo ? `Código: ${turma.codigo}` : `ID da turma: ${turma.id}`}
                        {turma.semestre ? ` • Semestre ${turma.semestre}` : ""}
                      </div>
                    </div>

                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Professor responsável
                    </label>
                    <select
                      value={vinculo?.professorId ?? ""}
                      onChange={(e) =>
                        alterarProfessorDaTurma(turma.id, e.target.value)
                      }
                      className="w-full rounded-xl border bg-white px-3 py-2"
                    >
                      <option value="">Sem professor atribuído</option>
                      {professoresOrdenados.map((professor) => (
                        <option key={professor.id} value={professor.id}>
                          {professor.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/disciplinas")}
            className="rounded-xl border px-4 py-2"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}