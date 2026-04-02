"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Curso = {
  id: number;
  nome: string;
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
};

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

        try {
          const resCursos = await fetch("/api/curso", {
            credentials: "include",
          });
          const dataCursos = await resCursos.json();
          setCursos(Array.isArray(dataCursos) ? dataCursos : []);
        } catch {
          setCursos([]);
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
        <p className="text-gray-600 mt-1">
          Atualize os dados da disciplina.
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