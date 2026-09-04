"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import withAuth from "@/components/auth/withAuth";
import { useTranslations } from "next-intl";

interface Curso {
  id: number;
  nome: string;
}

interface Professor {
  id: number;
  nome: string;
}

interface Disciplina {
  id: number;
  nome: string;
  semestre?: number | null;
  curso?: Curso | null;
  professor?: Professor | null;
  professorId?: number | null;
}

type FeedbackTipo = "sucesso" | "erro" | "";

function AdminDisciplinasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("AdminSubjects");

  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nome, setNome] = useState("");
  const [cursoId, setCursoId] = useState<string>("");
  const [professorId, setProfessorId] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [cursosAbertos, setCursosAbertos] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [criando, setCriando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [disciplinaParaExcluir, setDisciplinaParaExcluir] =
    useState<Disciplina | null>(null);

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

  async function carregarDados() {
    const resDisc = await fetch("/api/disciplina", {
      credentials: "include",
    });
    const dataDisc = await resDisc.json();
    setDisciplinas(Array.isArray(dataDisc) ? dataDisc : []);

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
  }

  async function handleCriarDisciplina(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCriando(true);

      const res = await fetch("/api/disciplina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome,
          cursoId: cursoId ? Number(cursoId) : null,
          professorId: professorId ? Number(professorId) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro da API ao criar disciplina:", data?.error);
        throw new Error(t("errors.create"));
      }

      setNome("");
      setCursoId("");
      setProfessorId("");
      setMostrarForm(false);
      await carregarDados();
      mostrarFeedback("sucesso", t("messages.created"));
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || t("errors.create"));
    } finally {
      setCriando(false);
    }
  }

  async function confirmarExclusao() {
    if (!disciplinaParaExcluir) return;

    try {
      setExcluindoId(disciplinaParaExcluir.id);

      const res = await fetch(`/api/disciplina/${disciplinaParaExcluir.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro da API ao excluir disciplina:", data?.error);
        throw new Error(t("errors.delete"));
      }

      setDisciplinaParaExcluir(null);
      await carregarDados();
      mostrarFeedback("sucesso", t("messages.deleted"));
    } catch (error: any) {
      mostrarFeedback("erro", error?.message || t("errors.delete"));
    } finally {
      setExcluindoId(null);
    }
  }

  useEffect(() => {
    void carregarDados();
  }, []);

  useEffect(() => {
    const buscaUrl = searchParams.get("busca");
    if (buscaUrl) {
      setBusca(buscaUrl);
    }
  }, [searchParams]);

  const disciplinasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return disciplinas;

    return disciplinas.filter((d) => {
      const id = String(d.id || "").toLowerCase();
      const nomeTexto = String(d.nome || "").toLowerCase();
      const cursoTexto = String(d.curso?.nome || "").toLowerCase();

      return (
        id.includes(termo) ||
        nomeTexto.includes(termo) ||
        cursoTexto.includes(termo)
      );
    });
  }, [disciplinas, busca]);

  const disciplinasPorCursoESemestre = useMemo(() => {
    const grupos: Record<string, Record<string, Disciplina[]>> = {};

    disciplinasFiltradas.forEach((disciplina) => {
      const cursoNome = disciplina.curso?.nome || t("list.noCourse");
      const semestreNome =
        disciplina.semestre !== null && disciplina.semestre !== undefined
          ? t("list.semester", { number: disciplina.semestre })
          : t("list.noSemester");

      if (!grupos[cursoNome]) {
        grupos[cursoNome] = {};
      }

      if (!grupos[cursoNome][semestreNome]) {
        grupos[cursoNome][semestreNome] = [];
      }

      grupos[cursoNome][semestreNome].push(disciplina);
    });

    return grupos;
  }, [disciplinasFiltradas, t]);

  return (
    <div className="phanyx-disciplinas-page">
      <div className="space-y-6">
        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              feedbackTipo === "sucesso"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback}
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">📚 {t("title")}</h1>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
            <input
              type="text"
              placeholder={t("search.placeholder")}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded border p-2 md:w-[380px]"
            />

            <button
              onClick={() => setMostrarForm(!mostrarForm)}
              className="rounded bg-purple-600 px-4 py-2 text-white"
            >
              {t("newSubject.openButton")}
            </button>
          </div>
        </div>

        {mostrarForm && (
          <form
            onSubmit={handleCriarDisciplina}
            className="space-y-4 rounded-lg bg-white p-6 shadow"
          >
            <h2 className="font-semibold">{t("newSubject.title")}</h2>

            <input
              type="text"
              placeholder={t("newSubject.namePlaceholder")}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded border p-2"
              required
            />

            <select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">{t("common.noCourse")}</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>

            <select
              value={professorId}
              onChange={(e) => setProfessorId(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">{t("common.noTeacher")}</option>
              {professores.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nome}
                </option>
              ))}
            </select>

            <button
              disabled={criando}
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {criando ? t("common.creating") : t("newSubject.createButton")}
            </button>
          </form>
        )}

        <div className="space-y-4">
          {Object.entries(disciplinasPorCursoESemestre).map(
            ([cursoNome, semestres]) => (
              <div
                key={cursoNome}
                className="rounded-lg border bg-white p-4 shadow"
              >
                <button
                  type="button"
                  onClick={() =>
                    setCursosAbertos((prev) => ({
                      ...prev,
                      [cursoNome]: !prev[cursoNome],
                    }))
                  }
                  className="flex w-full items-center justify-between text-left text-base font-bold text-slate-900"
                >
                  <span>🎓 {cursoNome}</span>
                  <span className="text-sm text-slate-500">
                    {cursosAbertos[cursoNome]
                      ? `▲ ${t("common.close")}`
                      : `▼ ${t("common.open")}`}
                  </span>
                </button>

                {cursosAbertos[cursoNome] && (
                  <div className="mt-3 space-y-2">
                    {Object.entries(semestres)
                      .sort(([a], [b]) => {
                        const numeroA = Number(a.replace(/\D/g, ""));
                        const numeroB = Number(b.replace(/\D/g, ""));

                        return numeroA - numeroB;
                      })
                      .map(([semestreNome, lista]) => (
                        <details
                          key={semestreNome}
                          className="rounded-lg border bg-slate-50 p-3"
                        >
                          <summary className="cursor-pointer font-semibold text-slate-800">
                            {semestreNome} —{" "}
                            {t("list.subjectCount", { count: lista.length })}
                          </summary>

                          <div className="mt-3 overflow-hidden rounded-lg border bg-white">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="p-3">ID</th>
                                  <th className="p-3">{t("table.name")}</th>
                                  <th className="p-3">{t("table.teacher")}</th>
                                  <th className="p-3">{t("table.actions")}</th>
                                </tr>
                              </thead>

                              <tbody>
                                {lista.map((d) => (
                                  <tr
                                    key={d.id}
                                    className="border-t hover:bg-gray-50"
                                  >
                                    <td className="p-3">{d.id}</td>
                                    <td className="p-3">{d.nome}</td>
                                    <td className="p-3">
                                      {d.professor?.nome ?? "—"}
                                    </td>
                                    <td className="space-x-2 p-3">
                                      <button
                                        onClick={() =>
                                          router.push(
                                            `/admin/disciplinas/${d.id}`
                                          )
                                        }
                                        className="text-blue-600 hover:underline"
                                      >
                                        {t("common.edit")}
                                      </button>

                                      <button
                                        onClick={() =>
                                          setDisciplinaParaExcluir(d)
                                        }
                                        className="text-red-600 hover:underline"
                                      >
                                        {t("common.delete")}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      ))}
                  </div>
                )}
              </div>
            )
          )}

          {disciplinasFiltradas.length === 0 && (
            <div className="rounded-lg bg-white p-4 text-gray-500 shadow">
              {t("search.empty")}
            </div>
          )}
        </div>
      </div>

      {disciplinaParaExcluir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-xl">
                🗑️
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900">
                  {t("deleteModal.title")}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("deleteModal.question", {
                    name: disciplinaParaExcluir.nome,
                  })}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("deleteModal.warning")}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDisciplinaParaExcluir(null)}
                disabled={excluindoId === disciplinaParaExcluir.id}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                onClick={confirmarExclusao}
                disabled={excluindoId === disciplinaParaExcluir.id}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {excluindoId === disciplinaParaExcluir.id
                  ? t("common.deleting")
                  : t("deleteModal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .phanyx-disciplinas-page {
          color: #0f172a;
        }

        .phanyx-disciplinas-page input,
        .phanyx-disciplinas-page select,
        .phanyx-disciplinas-page textarea {
          background: #ffffff;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        html[data-theme-choice="dark"] .phanyx-disciplinas-page,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplinas-page {
          color: #f8fafc;
        }

        html[data-theme-choice="dark"]
          .phanyx-disciplinas-page
          [class*="bg-white"],
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplinas-page
          [class*="bg-white"] {
          background-color: #0b2a57 !important;
          border-color: #2d5aa0 !important;
        }

        html[data-theme-choice="dark"]
          .phanyx-disciplinas-page
          [class*="bg-slate-50"],
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplinas-page
          [class*="bg-slate-50"] {
          background-color: #102a4c !important;
          border-color: #31506f !important;
        }

        html[data-theme-choice="dark"]
          .phanyx-disciplinas-page
          [class*="bg-gray-100"],
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplinas-page
          [class*="bg-gray-100"] {
          background-color: #12386d !important;
        }

        html[data-theme-choice="dark"] .phanyx-disciplinas-page input,
        html[data-theme-choice="dark"] .phanyx-disciplinas-page select,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplinas-page
          input,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplinas-page
          select {
          background: #0f2746 !important;
          color: #ffffff !important;
          border-color: #31506f !important;
          color-scheme: dark;
        }

        html[data-theme-choice="dark"]
          .phanyx-disciplinas-page
          select
          option,
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplinas-page
          select
          option {
          background: #0f2746 !important;
          color: #ffffff !important;
        }

        html[data-theme-choice="dark"]
          .phanyx-disciplinas-page
          [class*="text-slate-9"],
        html[data-theme-choice="dark"]
          .phanyx-disciplinas-page
          [class*="text-slate-8"],
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplinas-page
          [class*="text-slate-9"],
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplinas-page
          [class*="text-slate-8"] {
          color: #f8fafc !important;
        }

        html[data-theme-choice="dark"]
          .phanyx-disciplinas-page
          [class*="text-slate-6"],
        html[data-theme-choice="dark"]
          .phanyx-disciplinas-page
          [class*="text-slate-5"],
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplinas-page
          [class*="text-slate-6"],
        html[data-theme="dark"]:not([data-theme-choice="system"])
          .phanyx-disciplinas-page
          [class*="text-slate-5"] {
          color: #bfd2e8 !important;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplinas-page,
        html[data-theme="system"].dark .phanyx-disciplinas-page {
          color: #fafafa;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplinas-page
          [class*="bg-white"],
        html[data-theme="system"].dark
          .phanyx-disciplinas-page
          [class*="bg-white"] {
          background-color: #18181b !important;
          border-color: #3f3f46 !important;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplinas-page
          [class*="bg-slate-50"],
        html[data-theme="system"].dark
          .phanyx-disciplinas-page
          [class*="bg-slate-50"] {
          background-color: #202024 !important;
          border-color: #52525b !important;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplinas-page
          [class*="bg-gray-100"],
        html[data-theme="system"].dark
          .phanyx-disciplinas-page
          [class*="bg-gray-100"] {
          background-color: #27272a !important;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplinas-page
          input,
        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplinas-page
          select,
        html[data-theme="system"].dark .phanyx-disciplinas-page input,
        html[data-theme="system"].dark .phanyx-disciplinas-page select {
          background: #202024 !important;
          color: #fafafa !important;
          border-color: #52525b !important;
          color-scheme: dark;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplinas-page
          select
          option,
        html[data-theme="system"].dark
          .phanyx-disciplinas-page
          select
          option {
          background: #18181b !important;
          color: #fafafa !important;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplinas-page
          [class*="text-slate-9"],
        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplinas-page
          [class*="text-slate-8"],
        html[data-theme="system"].dark
          .phanyx-disciplinas-page
          [class*="text-slate-9"],
        html[data-theme="system"].dark
          .phanyx-disciplinas-page
          [class*="text-slate-8"] {
          color: #fafafa !important;
        }

        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplinas-page
          [class*="text-slate-6"],
        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-disciplinas-page
          [class*="text-slate-5"],
        html[data-theme="system"].dark
          .phanyx-disciplinas-page
          [class*="text-slate-6"],
        html[data-theme="system"].dark
          .phanyx-disciplinas-page
          [class*="text-slate-5"] {
          color: #a1a1aa !important;
        }
      `}</style>
    </div>
  );
}

export default withAuth(AdminDisciplinasPage, ["admin"]);
