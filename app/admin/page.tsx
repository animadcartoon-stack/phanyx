"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import PhanyxTour from "@/components/tutorial/PhanyxTour";
import CentralAvisosPhanyx from "@/components/phanyx/CentralAvisosPhanyx";
import { useTranslations } from "next-intl";

interface Stats {
  alunos: number;
  professores: number;
  cursos: number;
  disciplinas: number;
  certificados: number;
}

type ItemBusca = {
  id: number;
  nome: string;
  tipo:
  | "Aluno"
  | "Professor"
  | "Curso"
  | "Disciplina"
  | "Turma"
  | "Matrícula";
  href: string;
};

type TourStep = {
  id: string;
  selector: string;
  titulo: string;
  descricao: string;
  mascoteSrc: string;
  mascoteAlt: string;
  destaque?: string;
};

const TOUR_STORAGE_KEY = "phanyx_admin_tour_oculto_v2";

function getRectFromSelector(selector: string) {
  const elemento = document.querySelector(selector);
  if (!elemento) return null;

  const rect = elemento.getBoundingClientRect();

  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function AdminTour({
  aberto,
  onClose,
}: {
  aberto: boolean;
  onClose: (naoMostrarNovamente?: boolean) => void;
}) {
  const t = useTranslations("AdminDashboard");
  const tCommon = useTranslations("Common");

  const tourSteps = useMemo<TourStep[]>(
    () => [
      {
        id: "painel",
        selector: '[data-tour="menu-painel"]',
        titulo: t("tourDashboardTitle"),
        descricao: t("tourDashboardDescription"),
        mascoteSrc: "/images/formix-bemvindo.png",
        mascoteAlt: t("tourMascotAlt"),
        destaque: t("tourDashboardHighlight"),
      },
      {
        id: "configuracoes",
        selector: '[data-tour="menu-configuracoes"]',
        titulo: t("tourSettingsTitle"),
        descricao: t("tourSettingsDescription"),
        mascoteSrc: "/images/formix.png",
        mascoteAlt: t("tourMascotAlt"),
        destaque: t("tourSettingsHighlight"),
      },
      {
        id: "departamentos",
        selector: '[data-tour="menu-departamentos"]',
        titulo: t("tourDepartmentsTitle"),
        descricao: t("tourDepartmentsDescription"),
        mascoteSrc: "/images/formix-bemvindo.png",
        mascoteAlt: t("tourMascotAlt"),
        destaque: t("tourDepartmentsHighlight"),
      },
      {
        id: "professores",
        selector: '[data-tour="menu-professores"]',
        titulo: t("tourTeachersTitle"),
        descricao: t("tourTeachersDescription"),
        mascoteSrc: "/images/formix.png",
        mascoteAlt: t("tourMascotAlt"),
        destaque: t("tourTeachersHighlight"),
      },
      {
        id: "alunos",
        selector: '[data-tour="menu-alunos"]',
        titulo: t("tourStudentsTitle"),
        descricao: t("tourStudentsDescription"),
        mascoteSrc: "/images/formix-bemvindo.png",
        mascoteAlt: t("tourMascotAlt"),
        destaque: t("tourStudentsHighlight"),
      },
      {
        id: "matriculas",
        selector: '[data-tour="menu-matriculas"]',
        titulo: t("tourEnrollmentsTitle"),
        descricao: t("tourEnrollmentsDescription"),
        mascoteSrc: "/images/formix.png",
        mascoteAlt: t("tourMascotAlt"),
        destaque: t("tourEnrollmentsHighlight"),
      },
    ],
    [t]
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [tourConcluido, setTourConcluido] = useState(false);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const bubbleRef = useRef<HTMLDivElement | null>(null);

  const [bubbleSize, setBubbleSize] = useState({
    width: 420,
    height: 290,
  });

  const step = tourSteps[stepIndex];

  useEffect(() => {
    if (!aberto) return;

    setTargetRect(null);

    function atualizarPosicao() {
      const rect = getRectFromSelector(step.selector);
      setTargetRect(rect);
    }

    const detalheTour = {
      selector: step.selector,
    };

    if (step.id === "configuracoes") {
      window.dispatchEvent(
        new CustomEvent("phanyx:abrir-menu-configuracoes", {
          detail: detalheTour,
        })
      );
    } else if (
      step.id === "departamentos" ||
      step.id === "professores" ||
      step.id === "alunos" ||
      step.id === "matriculas"
    ) {
      window.dispatchEvent(
        new CustomEvent("phanyx:abrir-menu-academico", {
          detail: detalheTour,
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("phanyx:resetar-menu-tour")
      );
    }

    /*
     * Primeira leitura: depois que o React abrir o grupo do menu.
     * Segunda leitura: depois que a rolagem suave da sidebar terminar.
     */
    const timerInicial = window.setTimeout(atualizarPosicao, 150);
    const timerFinal = window.setTimeout(atualizarPosicao, 750);

    window.addEventListener("resize", atualizarPosicao);
    window.addEventListener("scroll", atualizarPosicao, true);
    window.addEventListener(
      "phanyx:reposicionar-tour",
      atualizarPosicao as EventListener
    );

    return () => {
      window.clearTimeout(timerInicial);
      window.clearTimeout(timerFinal);

      window.removeEventListener("resize", atualizarPosicao);
      window.removeEventListener("scroll", atualizarPosicao, true);
      window.removeEventListener(
        "phanyx:reposicionar-tour",
        atualizarPosicao as EventListener
      );
    };
  }, [aberto, step]);

  useEffect(() => {
    if (!aberto) {
      setStepIndex(0);
      setTargetRect(null);
      setTourConcluido(false);
    }
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    const elemento = bubbleRef.current;

    if (!elemento) return;

    function medirBalao() {
      const rect = elemento.getBoundingClientRect();

      const width = Math.ceil(rect.width);
      const height = Math.ceil(rect.height);

      setBubbleSize((atual) => {
        if (
          atual.width === width &&
          atual.height === height
        ) {
          return atual;
        }

        return {
          width,
          height,
        };
      });
    }

    const frame = window.requestAnimationFrame(medirBalao);
    const observer = new ResizeObserver(medirBalao);

    observer.observe(elemento);
    window.addEventListener("resize", medirBalao);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", medirBalao);
    };
  }, [aberto, stepIndex, tourConcluido]);

  if (!aberto) return null;

  const spotlightPadding = 8;

  const spotlight =
    !tourConcluido && targetRect
      ? {
        top: Math.max(targetRect.top - spotlightPadding, 8),
        left: Math.max(targetRect.left - spotlightPadding, 8),
        width: targetRect.width + spotlightPadding * 2,
        height: targetRect.height + spotlightPadding * 2,
      }
      : null;

  const bubbleWidth = bubbleSize.width;
  const bubbleHeight = bubbleSize.height;

  const bubbleStyle = spotlight
    ? (() => {
      const isMenuLateral = spotlight.left < 320;

      let top = spotlight.top + spotlight.height + 18;
      let left = spotlight.left;

      if (isMenuLateral) {
        left = spotlight.left + spotlight.width + 18;
        top = spotlight.top + spotlight.height / 2 - bubbleHeight / 2;
      }

      top = Math.max(
        16,
        Math.min(top, window.innerHeight - bubbleHeight - 16)
      );
      left = Math.max(
        16,
        Math.min(left, window.innerWidth - bubbleWidth - 16)
      );

      return {
        top: `${top}px`,
        left: `${left}px`,
      };
    })()
    : {
      top: "120px",
      left: "50%",
      transform: "translateX(-50%)",
    };

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-slate-950/70" />

      {spotlight && (
        <div
          className="absolute rounded-2xl border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.72)] transition-all"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}

      <div
        ref={bubbleRef}
        className="absolute max-h-[calc(100vh-32px)] w-[min(420px,calc(100vw-32px))] overflow-y-auto rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-2xl transition-all duration-300"
        style={
          tourConcluido
            ? {
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }
            : bubbleStyle
        }
      >
        {!tourConcluido &&
          (spotlight && spotlight.left < 320 ? (
            <div
              className="absolute h-3 w-3 -translate-y-1/2 rotate-45 border border-gray-200 bg-white shadow-sm"
              style={{
                left: "-6px",
                top: "50%",
              }}
            />
          ) : (
            <div
              className="absolute h-3 w-3 rotate-45 border border-gray-200 bg-white shadow-sm"
              style={{
                left: "40px",
                top: "-6px",
              }}
            />
          ))}

        {!tourConcluido ? (
          <>
            <div className="flex items-start gap-4">
              <img
                src={step.mascoteSrc}
                alt={step.mascoteAlt}
                className="h-24 w-24 shrink-0 object-contain drop-shadow-lg animate-mascote"
              />

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                  {t("guidedTutorial")}
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {step.titulo}
                </h3>

                {step.destaque && (
                  <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
                    {step.destaque}
                  </p>
                )}

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {step.descricao}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-500">
                {t("tourStepProgress", {
                  current: stepIndex + 1,
                  total: tourSteps.length,
                })}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onClose(false)}
                  className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 backdrop-blur hover:bg-slate-100"
                >
                  {tCommon("close")}
                </button>

                <button
                  type="button"
                  onClick={() => onClose(true)}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                >
                  {t("dontShowAgain")}
                </button>

                {stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setStepIndex((prev) => prev - 1)}
                    className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 backdrop-blur hover:bg-slate-100"
                  >
                    {t("previous")}
                  </button>
                )}

                {stepIndex < tourSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStepIndex((prev) => prev + 1)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {t("next")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTourConcluido(true)}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {t("completeTour")}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center">
            <img
              src="/images/formix-bemvindo.png"
              alt={t("tourCelebratingAlt")}
              className="mx-auto h-28 w-28 object-contain drop-shadow-lg animate-mascote"
            />

            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">
              {t("tourCompleted")}
            </p>

            <h3 className="mt-2 text-2xl font-bold text-slate-900">
              {t("tourCongratulations")}
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              {t("tourCompletedDescription")}
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
              <p className="text-sm font-semibold text-slate-900">
                {t("recommendedNextSteps")}
              </p>

              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>✅ {t("configureInstitutionData")}</li>
                <li>✅ {t("organizeDepartments")}</li>
                <li>✅ {t("registerTeachers")}</li>
                <li>✅ {t("registerStudents")}</li>
                <li>✅ {t("startEnrollments")}</li>
              </ul>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/admin/configuracoes/instituicao"
                onClick={() => onClose(false)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t("startWithSettings")}
              </Link>

              <button
                type="button"
                onClick={() => onClose(true)}
                className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur hover:bg-slate-100"
              >
                {t("finishAndHide")}
              </button>

              <button
                type="button"
                onClick={() => onClose(false)}
                className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur hover:bg-slate-100"
              >
                {t("continueDashboard")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function extrairNomeMatricula(item: any, tipoTraduzido: string) {
  return (
    item?.aluno?.nome ||
    item?.nomeAluno ||
    item?.matricula ||
    `${tipoTraduzido} #${String(item?.id ?? "")}`
  );
}

function extrairNomeTurma(item: any, tipoTraduzido: string) {
  return (
    item?.nome ||
    item?.titulo ||
    item?.codigo ||
    `${tipoTraduzido} #${String(item?.id ?? "")}`
  );
}

function extrairNomeDisciplina(item: any, tipoTraduzido: string) {
  return (
    item?.nome ||
    item?.titulo ||
    `${tipoTraduzido} #${String(item?.id ?? "")}`
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations("AdminDashboard");
  const tCommon = useTranslations("Common");
  const tiposResultado: Record<ItemBusca["tipo"], string> = {
    Aluno: t("studentResult"),
    Professor: t("teacherResult"),
    Curso: t("courseResult"),
    Disciplina: t("subjectResult"),
    Turma: t("classResult"),
    Matrícula: t("enrollmentResult"),
  };
  const [stats, setStats] = useState<Stats>({
    alunos: 0,
    professores: 0,
    cursos: 0,
    disciplinas: 0,
    certificados: 0,
  });

  const [loading, setLoading] = useState(true);
  const [tourAberto, setTourAberto] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement | null>(null);
  const [perfilAdmin, setPerfilAdmin] = useState<any>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [alunosLista, setAlunosLista] = useState<ItemBusca[]>([]);
  const [professoresLista, setProfessoresLista] = useState<ItemBusca[]>([]);
  const [cursosLista, setCursosLista] = useState<ItemBusca[]>([]);
  const [disciplinasLista, setDisciplinasLista] = useState<ItemBusca[]>([]);
  const [turmasLista, setTurmasLista] = useState<ItemBusca[]>([]);
  const [matriculasLista, setMatriculasLista] = useState<ItemBusca[]>([]);

  async function carregarPerfilAdmin() {
    try {
      const res = await fetch("/api/admin/funcionarios/me", {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (res.ok) {
        setPerfilAdmin(json);
      }
    } catch {
      setPerfilAdmin(null);
    }
  }

  async function alterarFotoFuncionario(file: File | null) {
    if (!file) return;

    try {
      setEnviandoFoto(true);

      const formData = new FormData();
      formData.append("file", file);

      const resUpload = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const jsonUpload = await resUpload.json();

      if (!resUpload.ok) {
        throw new Error(jsonUpload?.error || "Erro ao enviar imagem.");
      }

      const fotoUrl = jsonUpload?.url || jsonUpload?.arquivo?.url;

      if (!fotoUrl) {
        throw new Error("Upload feito, mas a URL da imagem não foi retornada.");
      }

      const resSalvar = await fetch("/api/funcionario/foto-perfil", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fotoPerfil: fotoUrl,
        }),
      });

      const jsonSalvar = await resSalvar.json();

      if (!resSalvar.ok) {
        throw new Error(jsonSalvar?.error || "Erro ao salvar foto.");
      }

      setPerfilAdmin((prev: any) => ({
        ...prev,
        fotoPerfil: fotoUrl,
      }));
    } catch (e: any) {
      console.error(e);
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function carregarStats() {
    try {
      const [
        alunosRes,
        professoresRes,
        cursosRes,
        disciplinasRes,
        certificadosRes,
        turmasRes,
        matriculasRes,
      ] = await Promise.all([
        fetch("/api/aluno?page=1&limit=1", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/professor", { credentials: "include" }),
        fetch("/api/admin/cursos", { credentials: "include" }),
        fetch("/api/disciplina", { credentials: "include" }),
        fetch("/api/certificado", { credentials: "include" }),
        fetch("/api/turma", { credentials: "include" }),
        fetch("/api/matricula", { credentials: "include" }),
      ]);

      if (
        !alunosRes.ok ||
        !professoresRes.ok ||
        !cursosRes.ok ||
        !disciplinasRes.ok ||
        !certificadosRes.ok ||
        !turmasRes.ok ||
        !matriculasRes.ok
      ) {
        throw new Error("Erro de autenticação ou permissão");
      }

      const [
        alunos,
        professores,
        cursos,
        disciplinas,
        certificados,
        turmas,
        matriculas,
      ] = await Promise.all([
        alunosRes.json(),
        professoresRes.json(),
        cursosRes.json(),
        disciplinasRes.json(),
        certificadosRes.json(),
        turmasRes.json(),
        matriculasRes.json(),
      ]);

      const alunosArray = Array.isArray(alunos)
        ? alunos
        : Array.isArray(alunos?.data)
          ? alunos.data
          : [];

      const totalAlunos = Number(
        alunos?.meta?.total ?? alunos?.total ?? alunosArray.length
      );

      setAlunosLista(
        alunosArray.map((item: any) => ({
          id: Number(item.id),
          nome: String(item.nome ?? t("unnamed")),
          tipo: "Aluno" as const,
          href: `/admin/alunos?busca=${encodeURIComponent(
            String(item.nome ?? "")
          )}`,
        }))

      );

      setProfessoresLista(
        Array.isArray(professores)
          ? professores.map((item: any) => ({
            id: Number(item.id),
            nome: String(item.nome ?? t("unnamed")),
            tipo: "Professor" as const,
            href: `/admin/professores?busca=${encodeURIComponent(
              String(item.nome ?? "")
            )}`,
          }))
          : []
      );

      setCursosLista(
        Array.isArray(cursos)
          ? cursos.map((item: any) => ({
            id: Number(item.id),
            nome: String(item.nome ?? t("unnamed")),
            tipo: "Curso" as const,
            href: `/admin/cursos?busca=${encodeURIComponent(
              String(item.nome ?? "")
            )}`,
          }))
          : []
      );

      setDisciplinasLista(
        Array.isArray(disciplinas)
          ? disciplinas.map((item: any) => {
            const nome = String(
              extrairNomeDisciplina(item, t("subjectResult"))
            );

            return {
              id: Number(item.id),
              nome,
              tipo: "Disciplina" as const,
              href: `/admin/disciplinas?busca=${encodeURIComponent(nome)}`,
            };
          })
          : []
      );

      setTurmasLista(
        Array.isArray(turmas)
          ? turmas.map((item: any) => {
            const nome = String(
              extrairNomeTurma(item, t("classResult"))
            );

            return {
              id: Number(item.id),
              nome,
              tipo: "Turma" as const,
              href: `/admin/turmas?busca=${encodeURIComponent(nome)}`,
            };
          })
          : []
      );

      setMatriculasLista(
        Array.isArray(matriculas)
          ? matriculas.map((item: any) => {
            const nome = String(
              extrairNomeMatricula(item, t("enrollmentResult"))
            );

            return {
              id: Number(item.id),
              nome,
              tipo: "Matrícula" as const,
              href: `/admin/matriculas?busca=${encodeURIComponent(nome)}`,
            };
          })
          : []
      );

      setStats({
        alunos: totalAlunos,
        professores: Array.isArray(professores) ? professores.length : 0,
        cursos: Array.isArray(cursos) ? cursos.length : 0,
        disciplinas: Array.isArray(disciplinas) ? disciplinas.length : 0,
        certificados: Array.isArray(certificados) ? certificados.length : 0,
      });
    } catch (error) {
      console.error("Erro ao carregar stats", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarStats();
    carregarPerfilAdmin();
  }, []);

  useEffect(() => {
    try {
      const oculto = localStorage.getItem(TOUR_STORAGE_KEY);
      if (oculto !== "true") {
        const timer = setTimeout(() => {
          setTourAberto(true);
        }, 600);

        return () => clearTimeout(timer);
      }
    } catch {
      setTourAberto(true);
    }
  }, []);

  useEffect(() => {
    function abrirTour() {
      setTourAberto(true);
    }

    window.addEventListener("phanyx:abrir-tour-admin", abrirTour);
    return () =>
      window.removeEventListener("phanyx:abrir-tour-admin", abrirTour);
  }, []);

  function fecharTour(naoMostrarNovamente?: boolean) {
    if (naoMostrarNovamente) {
      try {
        localStorage.setItem(TOUR_STORAGE_KEY, "true");
      } catch { }
    }

    setTourAberto(false);
  }

  const termoBusca = busca.trim().toLowerCase();

  const resultadosBusca = useMemo(() => {
    if (!termoBusca) return [];

    return [
      ...alunosLista,
      ...professoresLista,
      ...cursosLista,
      ...disciplinasLista,
      ...turmasLista,
      ...matriculasLista,
    ]
      .filter((item) => item.nome.toLowerCase().includes(termoBusca))
      .slice(0, 12);
  }, [
    termoBusca,
    alunosLista,
    professoresLista,
    cursosLista,
    disciplinasLista,
    turmasLista,
    matriculasLista,
  ]);

  const totalResultadosBusca = resultadosBusca.length;

  const cards = [
    {
      titulo: t("students"),
      valor: stats.alunos,
      link: "/admin/alunos",
    },
    {
      titulo: t("teachers"),
      valor: stats.professores,
      link: "/admin/professores",
    },
    {
      titulo: t("courses"),
      valor: stats.cursos,
      link: "/admin/cursos",
    },
    {
      titulo: t("subjects"),
      valor: stats.disciplinas,
      link: "/admin/disciplinas",
    },
    {
      titulo: t("certificates"),
      valor: stats.certificados,
      link: "/admin/certificados",
    },
  ];

  const resumoOperacao = useMemo(
    () => [
      {
        titulo: t("students"),
        valor: stats.alunos,
        descricao: t("studentsDescription"),
      },
      {
        titulo: t("teachers"),
        valor: stats.professores,
        descricao: t("teachersDescription"),
      },
      {
        titulo: t("courses"),
        valor: stats.cursos,
        descricao: t("coursesDescription"),
      },
      {
        titulo: t("subjects"),
        valor: stats.disciplinas,
        descricao: t("subjectsDescription"),
      },
      {
        titulo: t("certificates"),
        valor: stats.certificados,
        descricao: t("certificatesDescription"),
      },
    ],
    [stats, t]
  );

  async function alterarFoto(file: File | null) {
    if (!file) return;

    try {
      setEnviandoFoto(true);

      const formData = new FormData();
      formData.append("file", file);

      const upload = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const uploadJson = await upload.json();

      if (!upload.ok) {
        console.error("Erro upload:", uploadJson);
        return;
      }

      const fotoUrl = uploadJson?.url || uploadJson?.arquivo?.url;

      if (!fotoUrl) {
        console.error("Upload sem URL:", uploadJson);
        return;
      }

      const salvar = await fetch("/api/admin/funcionarios/me", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: perfilAdmin?.nome || "Administrador",
          telefone: perfilAdmin?.telefone || "",
          cargo: perfilAdmin?.cargo || "Administrativo",
          fotoPerfil: fotoUrl,
        }),
      });

      const salvarJson = await salvar.json();

      if (!salvar.ok) {
        console.error("Erro ao salvar foto:", salvarJson);
        return;
      }

      setPerfilAdmin(salvarJson);
    } catch (e) {
      console.error("Erro ao alterar foto:", e);
    } finally {
      setEnviandoFoto(false);
    }
  }

  return (
    <>
      <div className="space-y-8">
        <CentralAvisosPhanyx />
        <section className="phanyx-admin-hero relative rounded-[28px] border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-blue-50 p-8 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">

              <div className="mb-6 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-[#111111]">
                <button
                  type="button"
                  onClick={() => setPerfilAberto((atual) => !atual)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                      {t("profile")}
                    </p>

                    {perfilAberto && (
                      <h2 className="text-xl font-bold text-slate-900">
                        {perfilAdmin?.nome || t("administratorFallback")}
                      </h2>
                    )}
                  </div>

                  <span className="text-2xl font-black text-slate-500">
                    {perfilAberto ? "▾" : "▸"}
                  </span>
                </button>

                {perfilAberto && (
                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border bg-slate-100">
                      {perfilAdmin?.fotoPerfil ? (
                        <img
                          src={perfilAdmin.fotoPerfil}
                          alt={perfilAdmin?.nome || t("employeePhotoAlt")}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-700">
                          {perfilAdmin?.nome?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        ref={inputFotoRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          alterarFoto(file);
                          e.target.value = "";
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => inputFotoRef.current?.click()}
                        disabled={enviandoFoto}
                        className="rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
                      >
                        {enviandoFoto ? t("uploadingPhoto") : t("changePhoto")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
                {t("institutionPanel")}
              </p>

              <h1 className="mt-3 text-4xl font-bold text-slate-900">
                {t("title")}
              </h1>

              <p className="mt-4 text-lg leading-8 text-slate-600">
                {t("description")}
              </p>

              <div className="mt-6 flex items-center gap-4">
                <div className="relative w-full max-w-2xl z-50">
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="w-full rounded-2xl border border-slate-200 bg-white/95 py-3.5 pl-20 pr-5 text-sm text-slate-700 shadow-sm backdrop-blur transition placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  />

                  <div className="pointer-events-none absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                    <img
                      src="/images/formix-inteligente-direita.png"
                      alt="Formix inteligente"
                      className="h-10 w-10 object-contain"
                      draggable={false}
                    />
                  </div>

                  {termoBusca && (
                    <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-50 rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Resultados da busca
                          </p>
                          <p className="text-xs text-slate-500">
                            {totalResultadosBusca} resultado(s)
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setBusca("")}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          Limpar
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto p-3">
                        {totalResultadosBusca > 0 ? (
                          <div className="space-y-2">
                            {resultadosBusca.map((item, index) => (
                              <Link
                                key={`${tiposResultado[item.tipo]}-${item.id}-${index}`}
                                href={item.href}
                                className="block rounded-xl border border-slate-100 px-3 py-3 transition hover:border-blue-200 hover:bg-blue-50/60"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                      {item.nome}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {tiposResultado[item.tipo]}
                                    </p>
                                  </div>

                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                                    Abrir
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                            <p className="text-sm font-medium text-slate-700">
                              {t("noResults")}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {t("searchSuggestion")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white/80 px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-[#111111]">
              <div className="flex items-start gap-3">
                <img
                  src="/images/formix-bemvindo.png"
                  alt="Formix"
                  className="h-20 w-20 drop-shadow-lg transition hover:scale-105"
                />

                <div>
                  <span className="text-xs font-semibold tracking-widest text-blue-600">
                    {t("guidedTutorial").toUpperCase()}
                  </span>

                  <h3 className="text-lg font-bold text-slate-900">
                    {t("firstSteps")}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {t("tutorialDescription")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTourAberto(true)}
                className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t("viewTour")}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {t("quickActions")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t("quickActionsDescription")}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-4">
            <Link
              href="/admin/alunos"
              className="rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              + {t("newStudent")}
            </Link>

            <Link
              href="/admin/professores"
              className="rounded-xl bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
            >
              + {t("newTeacher")}
            </Link>

            <Link
              href="/admin/cursos"
              className="rounded-xl bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700"
            >
              + {t("newCourse")}
            </Link>

            <Link
              href="/admin/departamentos"
              className="rounded-xl bg-orange-500 px-4 py-2 text-white transition hover:bg-orange-600"
            >
              + {t("newDepartment")}
            </Link>

            <Link
              href="/admin/matriculas"
              className="rounded-xl bg-gray-800 px-4 py-2 text-white transition hover:bg-gray-900"
            >
              {t("manageEnrollments")}
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {t("operationOverview")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t("operationOverviewDescription")}
              </p>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-gray-500">{t("loadingStatistics")}</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {resumoOperacao.map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
                >
                  <h3 className="text-sm uppercase tracking-[0.15em] text-slate-500">
                    {item.titulo}
                  </h3>
                  <p className="mt-3 text-4xl font-bold text-blue-700">
                    {item.valor}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.descricao}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {!loading && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              {t("mainAccess")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("mainAccessDescription")}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((item) => (
                <Link
                  key={item.titulo}
                  href={item.link}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <h3 className="text-base font-bold text-slate-900">
                    {item.titulo}
                  </h3>
                  <p className="mt-3 text-4xl font-bold text-blue-700">
                    {item.valor}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{t("openModule")}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <AdminTour aberto={tourAberto} onClose={fecharTour} />
    </>
  );
}