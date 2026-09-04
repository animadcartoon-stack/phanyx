"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import PhanyxToast from "@/components/ui/PhanyxToast";

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

function nomeTurma(turma: TurmaApi, fallback: string) {
  return turma.nome || turma.codigo || fallback;
}

export default function DisciplinaDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("AdminSubjects");
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
  const [professoresHabilitadosIds, setProfessoresHabilitadosIds] = useState<
    string[]
  >([]);
  const [turmaIds, setTurmaIds] = useState<string[]>([]);
  const [preRequisitoIds, setPreRequisitoIds] = useState<string[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [turmas, setTurmas] = useState<TurmaApi[]>([]);
  const [disciplinas, setDisciplinas] = useState<DisciplinaDetalhe[]>([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

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
          console.error("Erro da API ao carregar disciplina:", data?.error);
          setErro(t("errors.load"));
          router.push("/admin/disciplinas");
          return;
        }

        const disciplina: DisciplinaDetalhe = data;

        setNome(disciplina.nome ?? "");
        setCodigo(disciplina.codigo ?? "");
        setDescricao(disciplina.descricao ?? "");
        setCargaHoraria(
          disciplina.cargaHoraria !== null &&
            disciplina.cargaHoraria !== undefined
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
          disciplina.professorId !== null &&
            disciplina.professorId !== undefined
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
          setProfessores(
            Array.isArray(dataProfessores) ? dataProfessores : []
          );
        } catch {
          setProfessores([]);
        }

        try {
          const resDisciplinas = await fetch("/api/disciplina", {
            credentials: "include",
          });
          const dataDisciplinas = await resDisciplinas.json();
          setDisciplinas(
            Array.isArray(dataDisciplinas) ? dataDisciplinas : []
          );
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
      void carregar();
    } else {
      setErro(t("errors.invalidId"));
      router.push("/admin/disciplinas");
    }
  }, [disciplinaId, router, t]);

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
          turmaIds: turmaIds.length > 0 ? turmaIds.map(Number) : [],
          professorId: professorId ? Number(professorId) : null,
          professoresHabilitadosIds: professoresHabilitadosIds.map(Number),
          preRequisitoIds: preRequisitoIds.map(Number),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro da API ao salvar disciplina:", data?.error);
        setErro(t("errors.save"));
        return;
      }

      setSucesso(t("messages.updated"));
      router.push("/admin/disciplinas");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">{t("edit.loading")}</div>;
  }

  return (
    <div className="phanyx-disciplina-editar-page space-y-6">
      {erro && (
        <PhanyxToast
          tipo="erro"
          titulo={t("toast.errorTitle")}
          mensagem={erro}
          onClose={() => setErro("")}
        />
      )}

      {sucesso && (
        <PhanyxToast
          tipo="sucesso"
          titulo={t("toast.successTitle")}
          mensagem={sucesso}
          onClose={() => setSucesso("")}
        />
      )}

      <button
        onClick={() => router.push("/admin/disciplinas")}
        className="text-blue-600 hover:underline"
      >
        {t("edit.back")}
      </button>

      <div>
        <h1 className="text-2xl font-bold">✏️ {t("edit.title")}</h1>
        <p className="mt-1 text-gray-600">{t("edit.description")}</p>
      </div>

      <form
        onSubmit={salvar}
        className="max-w-3xl space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("edit.name")}
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
            {t("edit.code")}
          </label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
            placeholder={t("common.optional")}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t("edit.subjectDescription")}
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="min-h-[100px] w-full rounded-xl border px-3 py-2"
            placeholder={t("common.optional")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("edit.workload")}
            </label>
            <input
              type="number"
              min="0"
              value={cargaHoraria}
              onChange={(e) => setCargaHoraria(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              placeholder={t("common.optional")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("edit.semester")}
            </label>
            <input
              type="number"
              min="1"
              value={semestre}
              onChange={(e) => setSemestre(e.target.value)}
              className="w-full rounded-xl border px-3 py-2"
              placeholder={t("common.optional")}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t("edit.course")}
            </label>
            <select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              className="w-full rounded-xl border bg-white px-3 py-2"
            >
              <option value="">{t("common.noCourse")}</option>
              {cursos.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t("edit.enabledTeachers")}
          </label>

          <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border bg-white p-3">
            {professores.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t("edit.noTeachersFound")}
              </p>
            ) : (
              professores.map((professor) => (
                <label
                  key={professor.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-2 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={professoresHabilitadosIds.includes(
                      String(professor.id)
                    )}
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
            {t("edit.enabledTeachersHelp")}
          </p>
        </div>

        <div className="pt-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t("edit.prerequisites")}
          </label>

          <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border bg-white p-3">
            {disciplinas.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t("edit.noSubjectsFound")}
              </p>
            ) : (
              disciplinas
                .filter((disciplina) => disciplina.id !== disciplinaId)
                .map((disciplina) => (
                  <label
                    key={disciplina.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-2 hover:bg-slate-50"
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
            {t("edit.prerequisitesHelp")}
          </p>
        </div>

        <div className="pt-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t("edit.classes")}
          </label>

          <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border bg-white p-3">
            {turmas.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t("edit.noClassesFound")}
              </p>
            ) : (
              turmas.map((turma) => (
                <label
                  key={turma.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-2 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={turmaIds.includes(String(turma.id))}
                    onChange={() => alternarTurma(turma.id)}
                    className="mt-1"
                  />

                  <div className="text-sm">
                    <div className="font-medium text-slate-800">
                      {nomeTurma(
                        turma,
                        t("edit.classFallback", { id: turma.id })
                      )}
                    </div>

                    <div className="text-slate-500">
                      {turma.semestre
                        ? t("edit.classSemester", {
                            semester: turma.semestre,
                          })
                        : t("edit.noSemester")}
                      {turma.periodoLetivo
                        ? ` • ${turma.periodoLetivo}`
                        : ""}
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {t("edit.classesHelp")}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? t("common.saving") : t("edit.saveChanges")}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/disciplinas")}
            className="rounded-xl border px-4 py-2"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>

      <style jsx global>{`
        .phanyx-disciplina-editar-page {
          color: #0f172a;
        }

        .phanyx-disciplina-editar-page input:not([type="checkbox"]),
        .phanyx-disciplina-editar-page select,
        .phanyx-disciplina-editar-page textarea {
          background: #ffffff;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        html[data-theme-choice="dark"] .phanyx-disciplina-editar-page,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplina-editar-page {
          color: #f8fafc;
        }

        html[data-theme-choice="dark"]
          .phanyx-disciplina-editar-page
          [class*="bg-white"],
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplina-editar-page
          [class*="bg-white"] {
          background-color: #0b2a57 !important;
          border-color: #2d5aa0 !important;
        }

        html[data-theme-choice="dark"]
          .phanyx-disciplina-editar-page
          input:not([type="checkbox"]),
        html[data-theme-choice="dark"]
          .phanyx-disciplina-editar-page
          select,
        html[data-theme-choice="dark"]
          .phanyx-disciplina-editar-page
          textarea,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplina-editar-page
          input:not([type="checkbox"]),
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplina-editar-page
          select,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplina-editar-page
          textarea {
          background: #0f2746 !important;
          color: #ffffff !important;
          border-color: #31506f !important;
          color-scheme: dark;
        }

        html[data-theme-choice="dark"]
          .phanyx-disciplina-editar-page
          select
          option,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplina-editar-page
          select
          option {
          background: #0f2746 !important;
          color: #ffffff !important;
        }

        html[data-theme-choice="dark"]
          .phanyx-disciplina-editar-page
          [class*="text-gray-"],
        html[data-theme-choice="dark"]
          .phanyx-disciplina-editar-page
          [class*="text-slate-8"],
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplina-editar-page
          [class*="text-gray-"],
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplina-editar-page
          [class*="text-slate-8"] {
          color: #f8fafc !important;
        }

        html[data-theme-choice="dark"]
          .phanyx-disciplina-editar-page
          [class*="text-slate-5"],
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplina-editar-page
          [class*="text-slate-5"] {
          color: #bfd2e8 !important;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplina-editar-page,
        html[data-theme="system"].dark .phanyx-disciplina-editar-page {
          color: #fafafa;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplina-editar-page
          [class*="bg-white"],
        html[data-theme="system"].dark
          .phanyx-disciplina-editar-page
          [class*="bg-white"] {
          background-color: #18181b !important;
          border-color: #3f3f46 !important;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplina-editar-page
          input:not([type="checkbox"]),
        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplina-editar-page
          select,
        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplina-editar-page
          textarea,
        html[data-theme="system"].dark
          .phanyx-disciplina-editar-page
          input:not([type="checkbox"]),
        html[data-theme="system"].dark
          .phanyx-disciplina-editar-page
          select,
        html[data-theme="system"].dark
          .phanyx-disciplina-editar-page
          textarea {
          background: #202024 !important;
          color: #fafafa !important;
          border-color: #52525b !important;
          color-scheme: dark;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplina-editar-page
          select
          option,
        html[data-theme="system"].dark
          .phanyx-disciplina-editar-page
          select
          option {
          background: #18181b !important;
          color: #fafafa !important;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplina-editar-page
          [class*="text-gray-"],
        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplina-editar-page
          [class*="text-slate-8"],
        html[data-theme="system"].dark
          .phanyx-disciplina-editar-page
          [class*="text-gray-"],
        html[data-theme="system"].dark
          .phanyx-disciplina-editar-page
          [class*="text-slate-8"] {
          color: #fafafa !important;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplina-editar-page
          [class*="text-slate-5"],
        html[data-theme="system"].dark
          .phanyx-disciplina-editar-page
          [class*="text-slate-5"] {
          color: #a1a1aa !important;
        }
      `}</style>
    </div>
  );
}
