"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

type Disciplina = {
  id: number;
  nome: string;
  codigo?: string | null;
};

type ModalidadeCertificado =
  | "GERAL"
  | "BACHARELADO"
  | "LICENCIATURA"
  | "TECNOLOGO"
  | "POS_GRADUACAO"
  | "MBA"
  | "MESTRADO"
  | "DOUTORADO"
  | "TECNICO"
  | "CURSO_LIVRE"
  | "OFICINA"
  | "ENSINO_MEDIO"
  | "ENSINO_FUNDAMENTAL"
  | "EDUCACAO_INFANTIL"
  | "PRE_ESCOLA"
  | "EXTENSAO"
  | "CAPACITACAO"
  | "TREINAMENTO"
  | "EJA"
  | "OUTRO";

const OPCOES_MODALIDADE_CERTIFICADO: ModalidadeCertificado[] = [
  "GERAL",
  "BACHARELADO",
  "LICENCIATURA",
  "TECNOLOGO",
  "POS_GRADUACAO",
  "MBA",
  "MESTRADO",
  "DOUTORADO",
  "TECNICO",
  "CURSO_LIVRE",
  "OFICINA",
  "ENSINO_MEDIO",
  "ENSINO_FUNDAMENTAL",
  "EDUCACAO_INFANTIL",
  "PRE_ESCOLA",
  "EXTENSAO",
  "CAPACITACAO",
  "TREINAMENTO",
  "EJA",
  "OUTRO",
];

type Curso = {
  id: number;
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  modalidadeCertificado?: ModalidadeCertificado | null;
  quantidadeSemestres?: number | null;
  valorMatricula?: number | null;
  valorMensalidade?: number | null;
  quantidadeParcelas?: number | null;
  ativo?: boolean;
  publicacaoRedeDestino?: {
    id: number;
    status: string;
    cursoOrigemId: number;
    instituicaoOrigemId: number;

    cursoOrigem?: {
      id: number;
      nome: string;
      codigo?: string | null;
    } | null;

    instituicaoOrigem?: {
      id: number;
      nome: string;
    } | null;
  } | null;
};

type CursoSemestreDisciplina = {
  id: number;
  disciplinaId: number;
  disciplina: Disciplina;
};

type CursoSemestre = {
  id: number;
  numero: number;
  titulo?: string | null;
  descricao?: string | null;
  cargaMinima?: number | string | null;
  cargaMaxima?: number | string | null;
  disciplinas: CursoSemestreDisciplina[];
};

type FeedbackTipo = "sucesso" | "erro" | "";

function formatarMoeda(valor: number, localeAtual: string) {
  return Number(valor || 0).toLocaleString(localeAtual, {
    style: "currency",
    currency: "BRL",
  });
}

export default function CursoDetalhePage() {
  const params = useParams();
  const t = useTranslations("AdminCourses");
  const locale = useLocale();
  const cursoId = Number(params.id);

  const [curso, setCurso] = useState<Curso | null>(null);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [semestres, setSemestres] = useState<CursoSemestre[]>([]);
  const [loading, setLoading] = useState(true);

  const [editandoCurso, setEditandoCurso] = useState(false);
  const [salvandoCurso, setSalvandoCurso] = useState(false);
  const [criandoSemestre, setCriandoSemestre] = useState(false);
  const [salvandoSemestreId, setSalvandoSemestreId] = useState<number | null>(null);

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");

  const [formCurso, setFormCurso] = useState({
    nome: "",
    codigo: "",
    descricao: "",
    modalidadeCertificado: "GERAL" as ModalidadeCertificado,
    quantidadeSemestres: "",
    valorMatricula: "",
    valorMensalidade: "",
    quantidadeParcelas: "",
    ativo: true,
  });

  const [novoSemestre, setNovoSemestre] = useState({
    numero: "",
    titulo: "",
    descricao: "",
  });

  const [selecionadas, setSelecionadas] = useState<Record<number, number[]>>({});
  const [semestresAbertos, setSemestresAbertos] = useState<Record<number, boolean>>({});

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

  async function carregarCurso() {
    const res = await fetch("/api/admin/cursos", {
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(t("errors.loadCourses"));
    }

    const cursos: Curso[] = await res.json();
    const encontrado =
      cursos.find((c) => Number(c.id) === Number(cursoId)) || null;

    setCurso(encontrado);

    if (encontrado) {
      setFormCurso({
        nome: encontrado.nome ?? "",
        codigo: encontrado.codigo ?? "",
        descricao: encontrado.descricao ?? "",
        modalidadeCertificado:
          encontrado.modalidadeCertificado || "GERAL",
        quantidadeSemestres:
          encontrado.quantidadeSemestres != null
            ? String(encontrado.quantidadeSemestres)
            : "",
        valorMatricula:
          encontrado.valorMatricula != null
            ? String(encontrado.valorMatricula)
            : "",
        valorMensalidade:
          encontrado.valorMensalidade != null
            ? String(encontrado.valorMensalidade)
            : "",
        quantidadeParcelas:
          encontrado.quantidadeParcelas != null
            ? String(encontrado.quantidadeParcelas)
            : "",
        ativo: Boolean(encontrado.ativo),
      });
    }
  }

  async function carregarDisciplinas() {
    const res = await fetch("/api/disciplina", {
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(t("errors.loadSubjects"));
    }

    const data = await res.json();
    setDisciplinas(Array.isArray(data) ? data : []);
  }

  async function carregarSemestres() {
    const res = await fetch(`/api/admin/curso-semestres?cursoId=${cursoId}`, {
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Erro ao carregar semestres do curso:", data);
      throw new Error(t("errors.loadCourseSemesters"));
    }

    const lista: CursoSemestre[] = Array.isArray(data) ? data : [];

    console.log("📘 Semestres carregados na página do curso:", lista);

    setSemestres(lista);

    const mapa: Record<number, number[]> = {};
    lista.forEach((semestre) => {
      mapa[semestre.id] = Array.isArray(semestre.disciplinas)
        ? semestre.disciplinas.map((d) => d.disciplinaId)
        : [];
    });

    setSelecionadas(mapa);
  }

  async function carregarTudo() {
    try {
      setLoading(true);
      await Promise.all([carregarCurso(), carregarDisciplinas(), carregarSemestres()]);
    } catch (error) {
      console.error("Erro ao carregar dados do curso:", error);
      mostrarFeedback("erro", t("errors.loadCourseData"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!cursoId || Number.isNaN(cursoId)) return;
    carregarTudo();
  }, [cursoId]);

  async function salvarEdicaoCurso() {
    if (!curso) return;

    try {
      setSalvandoCurso(true);
      setFeedback("");
      setFeedbackTipo("");

      const res = await fetch("/api/admin/cursos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: curso.id,
          nome: formCurso.nome,
          codigo: formCurso.codigo || null,
          descricao: formCurso.descricao || null,
          modalidadeCertificado: formCurso.modalidadeCertificado,
          quantidadeSemestres: formCurso.quantidadeSemestres
            ? Number(formCurso.quantidadeSemestres)
            : null,
          valorMatricula: formCurso.valorMatricula
            ? Number(formCurso.valorMatricula)
            : null,
          valorMensalidade: formCurso.valorMensalidade
            ? Number(formCurso.valorMensalidade)
            : null,
          quantidadeParcelas: formCurso.quantidadeParcelas
            ? Number(formCurso.quantidadeParcelas)
            : null,
          ativo: formCurso.ativo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(t("errors.editCourse"));
      }

      await carregarCurso();
      setEditandoCurso(false);
      mostrarFeedback(
        "sucesso",
        cursoRecebidoDaRede
          ? t("messages.localValuesUpdated")
          : t("messages.courseUpdated")
      );
    } catch (error: any) {
      console.error("Erro ao editar curso:", error);
      mostrarFeedback("erro", error?.message || t("errors.editCourse"));
    } finally {
      setSalvandoCurso(false);
    }
  }

  async function criarSemestre(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCriandoSemestre(true);
      setFeedback("");
      setFeedbackTipo("");

      const res = await fetch("/api/admin/curso-semestres", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          cursoId,
          numero: Number(novoSemestre.numero),
          titulo: novoSemestre.titulo || null,
          descricao: novoSemestre.descricao || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro ao criar semestre:", data);
        throw new Error(t("errors.createSemester"));
      }

      setNovoSemestre({
        numero: "",
        titulo: "",
        descricao: "",
      });

      const semestreCriado: CursoSemestre = {
        ...data,
        disciplinas: Array.isArray(data?.disciplinas) ? data.disciplinas : [],
      };

      setSemestres((prev) => {
        const semDuplicado = prev.filter((s) => s.id !== semestreCriado.id);
        return [...semDuplicado, semestreCriado].sort((a, b) => a.numero - b.numero);
      });

      setSelecionadas((prev) => ({
        ...prev,
        [semestreCriado.id]: Array.isArray(semestreCriado.disciplinas)
          ? semestreCriado.disciplinas.map((d) => d.disciplinaId)
          : [],
      }));

      await carregarSemestres();
      mostrarFeedback("sucesso", t("messages.semesterCreated"));
    } catch (error: any) {
      console.error("Erro ao criar semestre:", error);
      mostrarFeedback("erro", error?.message || t("errors.createSemester"));
    } finally {
      setCriandoSemestre(false);
    }
  }

  function toggleDisciplina(cursoSemestreId: number, disciplinaId: number) {
    const atuais = selecionadas[cursoSemestreId] || [];
    const existe = atuais.includes(disciplinaId);

    const atualizadas = existe
      ? atuais.filter((id) => id !== disciplinaId)
      : [...atuais, disciplinaId];

    setSelecionadas((prev) => ({
      ...prev,
      [cursoSemestreId]: atualizadas,
    }));
  }

  async function salvarDisciplinas(cursoSemestreId: number) {
    try {
      setSalvandoSemestreId(cursoSemestreId);
      setFeedback("");
      setFeedbackTipo("");

      const disciplinaIds = selecionadas[cursoSemestreId] || [];

      const res = await fetch("/api/admin/curso-semestre-disciplinas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          cursoSemestreId,
          disciplinaIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(t("errors.saveSubjects"));
      }

      await carregarSemestres();
      mostrarFeedback(
        "sucesso",
        t("messages.subjectsSaved", {
          semester:
            semestres.find((s) => s.id === cursoSemestreId)?.numero ?? "",
        })
      );
    } catch (error: any) {
      console.error("Erro ao salvar disciplinas:", error);
      mostrarFeedback("erro", error?.message || t("errors.saveSubjects"));
    } finally {
      setSalvandoSemestreId(null);
    }
  }

  async function salvarCargaSemestre(semestre: CursoSemestre) {
    try {
      const cargaMinimaVazia =
        semestre.cargaMinima === "" ||
        semestre.cargaMinima === null ||
        semestre.cargaMinima === undefined;

      const cargaMaximaVazia =
        semestre.cargaMaxima === "" ||
        semestre.cargaMaxima === null ||
        semestre.cargaMaxima === undefined;

      if (cargaMinimaVazia || cargaMaximaVazia) {
        mostrarFeedback("erro", t("validation.workloadRequired"));
        return;
      }

      const cargaMinimaNumero = Number(semestre.cargaMinima);
      const cargaMaximaNumero = Number(semestre.cargaMaxima);

      if (
        !Number.isFinite(cargaMinimaNumero) ||
        !Number.isFinite(cargaMaximaNumero) ||
        cargaMinimaNumero <= 0 ||
        cargaMaximaNumero <= 0
      ) {
        mostrarFeedback("erro", t("validation.workloadPositive"));
        return;
      }

      if (cargaMinimaNumero > cargaMaximaNumero) {
        mostrarFeedback("erro", t("validation.workloadOrder"));
        return;
      }
      setSalvandoSemestreId(semestre.id);
      setFeedback("");
      setFeedbackTipo("");

      const res = await fetch("/api/admin/curso-semestres", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: semestre.id,
          cargaMinima: cargaMinimaNumero,
          cargaMaxima: cargaMaximaNumero,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(t("errors.saveWorkload"));
      }

      await carregarSemestres();

      mostrarFeedback("sucesso", t("messages.workloadSaved"));
    } catch (error: any) {
      console.error("Erro ao salvar carga horária:", error);
      mostrarFeedback("erro", error?.message || t("errors.saveWorkload"));
    } finally {
      setSalvandoSemestreId(null);
    }
  }

  const semestresOrdenados = useMemo(() => {
    return [...semestres].sort((a, b) => a.numero - b.numero);
  }, [semestres]);

  const cursoRecebidoDaRede =
    Boolean(curso?.publicacaoRedeDestino);

  const classeCampoAcademico =
    cursoRecebidoDaRede
      ? "cursor-not-allowed bg-slate-100 text-slate-500 opacity-80 dark:bg-slate-900 dark:text-slate-400"
      : "";

  if (loading) {
    return <p className="text-gray-500 dark:text-slate-400">{t("detail.loading")}</p>;
  }

  if (!curso) {
    return <p className="text-red-600 dark:text-red-300">{t("detail.notFound")}</p>;
  }

  return (
    <div className="space-y-8 text-slate-900 dark:text-slate-100">
      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${feedbackTipo === "sucesso"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-red-200 bg-red-50 text-red-700"
            }`}
        >
          {feedback}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🎓 {t("detail.header.title")}
          </h1>
          <p className="text-gray-600 dark:text-slate-300">
            {t("detail.header.description")}
          </p>
        </div>

        <Link
          href="/admin/cursos"
          className="bg-gray-800 text-white px-4 py-2 rounded-lg"
        >
          {t("detail.header.backCourses")}
        </Link>
      </div>

      {cursoRecebidoDaRede && (
        <div className="rounded-2xl border border-blue-300 bg-blue-50 p-5 shadow-sm dark:border-blue-800 dark:bg-blue-950/30">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-blue-950 dark:text-blue-100">
                  {t("detail.network.receivedTitle")}
                </h2>

                <span className="rounded-full border border-blue-300 bg-white px-3 py-1 text-xs font-bold text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200">
                  {t("detail.network.synced")}
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-blue-900 dark:text-blue-200">
                {t.rich("detail.network.publishedBy", {
                  institution:
                    curso.publicacaoRedeDestino?.instituicaoOrigem?.nome ||
                    t("detail.network.otherInstitution"),
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-900 dark:text-blue-200">
                {t("detail.network.controlledByOrigin")}
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-900 dark:text-blue-200">
                {t("detail.network.localConfiguration")}
              </p>
            </div>

            <div className="shrink-0 rounded-xl border border-blue-200 bg-white p-3 text-sm text-slate-700 dark:border-blue-800 dark:bg-slate-950 dark:text-slate-300">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("detail.network.originCourse")}
              </p>

              <p className="mt-1 font-bold">
                {curso.publicacaoRedeDestino
                  ?.cursoOrigem?.nome ||
                  curso.nome}
              </p>

              <p className="mt-1 text-xs">
                {t("detail.network.originId")}:{" "}
                {curso.publicacaoRedeDestino
                  ?.cursoOrigemId}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {editandoCurso ? (
              <div className="space-y-4">
                {cursoRecebidoDaRede && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    {t("detail.network.editRestriction")}
                  </div>
                )}
                <input
                  disabled={cursoRecebidoDaRede}
                  type="text"
                  value={formCurso.nome}
                  onChange={(e) =>
                    setFormCurso({ ...formCurso, nome: e.target.value })
                  }
                  className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-2xl font-semibold text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${classeCampoAcademico}`}
                  placeholder={t("detail.courseForm.namePlaceholder")}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t("common.code")}
                    </label>
                    <input
                      disabled={cursoRecebidoDaRede}
                      type="text"
                      value={formCurso.codigo}
                      onChange={(e) =>
                        setFormCurso({ ...formCurso, codigo: e.target.value })
                      }
                      className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${classeCampoAcademico}`}
                      placeholder={t("detail.courseForm.examples.code")}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t("common.modality")}
                    </label>

                    <select
                      disabled={cursoRecebidoDaRede}
                      value={formCurso.modalidadeCertificado}
                      onChange={(e) =>
                        setFormCurso({
                          ...formCurso,
                          modalidadeCertificado:
                            e.target.value as ModalidadeCertificado,
                        })
                      }
                      className={`phanyx-curso-modalidade-select phanyx-course-native-select w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 ${classeCampoAcademico}`}
                    >
                      {OPCOES_MODALIDADE_CERTIFICADO.map((valor) => (
                        <option key={valor} value={valor}>
                          {t(`modalities.${valor}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t("detail.courseForm.semestersCount")}
                    </label>
                    <input
                      disabled={cursoRecebidoDaRede}
                      type="number"
                      value={formCurso.quantidadeSemestres}
                      onChange={(e) =>
                        setFormCurso({
                          ...formCurso,
                          quantidadeSemestres: e.target.value,
                        })
                      }
                      className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${classeCampoAcademico}`}
                      placeholder={t("detail.courseForm.examples.semesters")}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t("common.enrollmentValue")}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formCurso.valorMatricula}
                      onChange={(e) =>
                        setFormCurso({
                          ...formCurso,
                          valorMatricula: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                      placeholder={t("detail.courseForm.examples.enrollmentValue")}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t("common.monthlyValue")}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formCurso.valorMensalidade}
                      onChange={(e) =>
                        setFormCurso({
                          ...formCurso,
                          valorMensalidade: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                      placeholder={t("detail.courseForm.examples.monthlyValue")}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      {t("common.installments")}
                    </label>
                    <input
                      type="number"
                      value={formCurso.quantidadeParcelas}
                      onChange={(e) =>
                        setFormCurso({
                          ...formCurso,
                          quantidadeParcelas: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                      placeholder={t("detail.courseForm.examples.installments")}
                    />
                  </div>

                  <label className={`mt-6 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 ${cursoRecebidoDaRede
                    ? "cursor-not-allowed bg-slate-100 text-slate-500 opacity-80 dark:bg-slate-900 dark:text-slate-400"
                    : ""
                    }`}>
                    <input
                      type="checkbox"
                      disabled={cursoRecebidoDaRede}
                      checked={formCurso.ativo}
                      onChange={(e) =>
                        setFormCurso({
                          ...formCurso,
                          ativo: e.target.checked,
                        })
                      }
                    />
                    {t("detail.courseForm.activeCourse")}
                  </label>
                </div>

                <textarea
                  disabled={cursoRecebidoDaRede}
                  value={formCurso.descricao}
                  onChange={(e) =>
                    setFormCurso({ ...formCurso, descricao: e.target.value })
                  }
                  className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${classeCampoAcademico}`}
                  rows={4}
                  placeholder={t("detail.courseForm.descriptionPlaceholder")}
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={salvarEdicaoCurso}
                    disabled={salvandoCurso}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {salvandoCurso
                      ? t("common.saving")
                      : cursoRecebidoDaRede
                        ? t("detail.courseForm.saveLocalValues")
                        : t("detail.courseForm.saveChanges")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditandoCurso(false)}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditandoCurso(true)}
                  className="text-left"
                >
                  <h2 className="text-2xl font-semibold text-gray-900 hover:text-blue-700 dark:text-white dark:hover:text-blue-300">
                    {curso.nome}
                  </h2>
                </button>

                <div className="mt-3 space-y-1 text-sm text-gray-700 dark:text-slate-300">
                  <p>{t("common.code")}: {curso.codigo || t("common.notInformed")}</p>

                  <p>
                    {t("common.modality")}:{" "}
                    {t(`modalities.${curso.modalidadeCertificado || "GERAL"}`)}
                  </p>

                  <p>{t("common.description")}: {curso.descricao || t("common.notInformedFeminine")}</p>
                  <p>
                    {t("detail.courseInfo.expectedSemesters")}:{" "}
                    {curso.quantidadeSemestres ?? t("common.notInformed")}
                  </p>
                  <p>
                    {t("common.enrollmentValue")}:{" "}
                    {curso.valorMatricula != null
                      ? formatarMoeda(curso.valorMatricula, locale)
                      : t("common.notInformed")}
                  </p>
                  <p>
                    {t("common.monthlyValue")}:{" "}
                    {curso.valorMensalidade != null
                      ? formatarMoeda(curso.valorMensalidade, locale)
                      : t("common.notInformed")}
                  </p>
                  <p>
                    {t("common.installments")}:{" "}
                    {curso.quantidadeParcelas != null
                      ? curso.quantidadeParcelas
                      : t("common.notInformed")}
                  </p>
                  <p>{t("common.status")}: {curso.ativo ? t("status.active") : t("status.inactive")}</p>
                </div>
              </>
            )}
          </div>

          {!editandoCurso ? (
            <button
              type="button"
              onClick={() => setEditandoCurso(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              {cursoRecebidoDaRede
                ? t("detail.courseForm.configureLocalValues")
                : t("detail.courseForm.editCourse")}
            </button>
          ) : null}
        </div>
      </div>

      {cursoRecebidoDaRede ? (
        <div className="rounded-xl border border-slate-300 bg-slate-50 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t("detail.network.academicStructureReceived")}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {t("detail.network.academicStructureHelp")}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-xl font-semibold mb-4">+ {t("detail.semesters.addTitle")}</h3>

          <form
            onSubmit={criarSemestre}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <input
              type="number"
              placeholder={t("detail.semesters.numberPlaceholder")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              value={novoSemestre.numero}
              onChange={(e) =>
                setNovoSemestre({ ...novoSemestre, numero: e.target.value })
              }
              required
            />

            <input
              type="text"
              placeholder={t("detail.semesters.titlePlaceholder")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              value={novoSemestre.titulo}
              onChange={(e) =>
                setNovoSemestre({ ...novoSemestre, titulo: e.target.value })
              }
            />

            <input
              type="text"
              placeholder={t("detail.semesters.descriptionPlaceholder")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              value={novoSemestre.descricao}
              onChange={(e) =>
                setNovoSemestre({ ...novoSemestre, descricao: e.target.value })
              }
            />

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={criandoSemestre}
                className="bg-purple-600 text-white px-5 py-2 rounded-lg disabled:opacity-50"
              >
                {criandoSemestre ? t("common.adding") : t("detail.semesters.addButton")}
              </button>
            </div>
          </form>
        </div>
      )}

      {semestresOrdenados.length === 0 ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-900 dark:bg-yellow-950/40">
          <p className="text-yellow-800 dark:text-yellow-200">
            {t("detail.semesters.none")}
          </p>
        </div>
      ) : (
        semestresOrdenados.map((semestre) => {
          const idsSelecionados = selecionadas[semestre.id] || [];

          return (
            <div
              key={semestre.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={() =>
                  setSemestresAbertos((prev) => ({
                    ...prev,
                    [semestre.id]: !prev[semestre.id],
                  }))
                }
                className="mb-4 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left dark:border-slate-700 dark:bg-slate-950"
              >
                <span className="font-bold text-gray-900 dark:text-white">
                  {t("detail.semesters.semesterLabel", { number: semestre.numero })}
                  {semestre.titulo ? ` - ${semestre.titulo}` : ""}
                </span>

                <span className="text-sm text-gray-500 dark:text-slate-400">
                  {semestresAbertos[semestre.id] ? t("common.closeWithArrow") : t("common.openWithArrow")}
                </span>
              </button>
              {semestresAbertos[semestre.id] && (
                <>
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                            {t("detail.semesters.minimumWorkload")}
                          </label>
                          <input
                            type="number"
                            disabled={cursoRecebidoDaRede}
                            placeholder={t("detail.semesters.examples.minimumWorkload")}
                            className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${cursoRecebidoDaRede
                              ? "cursor-not-allowed bg-slate-100 opacity-80 dark:bg-slate-900"
                              : ""
                              }`}
                            value={(semestre as any).cargaMinima ?? ""}
                            onChange={(e) => {
                              const valor = e.target.value;

                              setSemestres((prev) =>
                                prev.map((s) =>
                                  s.id === semestre.id
                                    ? { ...s, cargaMinima: valor }
                                    : s
                                )
                              );
                            }}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                            {t("detail.semesters.maximumWorkload")}
                          </label>
                          <input
                            type="number"
                            disabled={cursoRecebidoDaRede}
                            placeholder={t("detail.semesters.examples.maximumWorkload")}
                            className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${cursoRecebidoDaRede
                              ? "cursor-not-allowed bg-slate-100 opacity-80 dark:bg-slate-900"
                              : ""
                              }`}
                            value={(semestre as any).cargaMaxima ?? ""}
                            onChange={(e) => {
                              const valor = e.target.value;

                              setSemestres((prev) =>
                                prev.map((s) =>
                                  s.id === semestre.id
                                    ? { ...s, cargaMaxima: valor }
                                    : s
                                )
                              );
                            }}
                          />
                        </div>

                      </div>

                      {t("detail.semesters.semesterLabel", { number: semestre.numero })}
                      {semestre.titulo ? ` - ${semestre.titulo}` : ""}
                    </h3>

                    {semestre.descricao ? (
                      <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                        {semestre.descricao}
                      </p>
                    ) : null}
                  </div>

                  <div className="mb-5">
                    <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                      {t("detail.subjects.linkedTitle")}
                    </h4>

                    {semestre.disciplinas.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {t("detail.subjects.noneLinked")}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {semestre.disciplinas.map((item) => (
                          <span
                            key={item.id}
                            className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-950/50 dark:text-green-200"
                          >
                            {item.disciplina.nome}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {disciplinas.length === 0 ? (
                    <p className="text-gray-500 dark:text-slate-400">{t("detail.subjects.noneRegistered")}</p>
                  ) : (
                    <>
                      {cursoRecebidoDaRede && (
                        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
                          {t("detail.subjects.readOnlyNetwork")}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {disciplinas.map((disciplina) => {
                          const marcada = idsSelecionados.includes(disciplina.id);

                          return (
                            <button
                              key={disciplina.id}
                              type="button"
                              disabled={cursoRecebidoDaRede}
                              onClick={() => {
                                if (cursoRecebidoDaRede) {
                                  return;
                                }

                                toggleDisciplina(
                                  semestre.id,
                                  disciplina.id
                                );
                              }}
                              className={`text-left border rounded-lg p-3 transition select-none ${cursoRecebidoDaRede
                                  ? "cursor-default opacity-80"
                                  : "cursor-pointer"
                                } ${marcada
                                  ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/50"
                                  : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
                                }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={marcada}
                                  readOnly
                                  className="mt-1 pointer-events-none"
                                />

                                <div>
                                  <p className="font-medium text-gray-900 dark:text-slate-100">
                                    {disciplina.nome}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {t("common.code")}: {disciplina.codigo || t("common.notInformed")}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-4">
                        {!cursoRecebidoDaRede && (
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => salvarDisciplinas(semestre.id)}
                              disabled={salvandoSemestreId === semestre.id}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                            >
                              {salvandoSemestreId === semestre.id
                                ? t("common.saving")
                                : t("detail.subjects.updateSemester", {
                                    number: semestre.numero,
                                  })}
                            </button>

                            <button
                              type="button"
                              onClick={() => salvarCargaSemestre(semestre)}
                              disabled={salvandoSemestreId === semestre.id}
                              className="ml-2 bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                            >
                              {salvandoSemestreId === semestre.id ? t("common.saving") : t("detail.semesters.saveWorkload")}
                            </button>
                          </div>
                        )}

                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })
      )}
      <style jsx global>{`
        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-course-native-select,
        html[data-theme-choice="system"][data-theme="dark"]
          .phanyx-course-native-select option,
        html[data-theme="system"].dark
          .phanyx-course-native-select,
        html[data-theme="system"].dark
          .phanyx-course-native-select option {
          background-color: #18181b !important;
          color: #fafafa !important;
        }

        html[data-theme-choice="system"][data-theme="light"]
          .phanyx-course-native-select,
        html[data-theme-choice="system"][data-theme="light"]
          .phanyx-course-native-select option,
        html[data-theme="system"]:not(.dark)
          .phanyx-course-native-select,
        html[data-theme="system"]:not(.dark)
          .phanyx-course-native-select option {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
      `}</style>

    </div>
  );
}
