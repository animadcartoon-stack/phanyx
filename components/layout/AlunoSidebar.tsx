"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";


type VisibilidadeAluno = {
  biblioteca?: boolean;
  painel?: boolean;
  rematricula?: boolean;
  disciplinas?: boolean;
  progresso?: boolean;
  desenvolvimento?: boolean;
  trabalhos?: boolean;
  presenca?: boolean;
  boletim?: boolean;
  historico?: boolean;
  reunioes?: boolean;
  certificados?: boolean;
  mobilidade?: boolean;
  ouvidoria?: boolean;
};

type ItemMenuAluno = {
  label: string;
  href: string;
  icon: string;
};

export default function AlunoSidebar({
  aluno,
  visibilidade,
}: {
  aluno: {
    nome?: string;
    fotoPerfil?: string | null;
  };

  visibilidade?: VisibilidadeAluno;
}) {
  const pathname = usePathname();

  const t = useTranslations(
    "StudentSidebar"
  );
  const tPlanning = useTranslations("PlanningTracking");
  const tLayout = useTranslations("StudentLayout");

  const nomeAluno =
    aluno?.nome || t("student");

  const podeVer = {
    biblioteca: visibilidade?.biblioteca ?? false,
    painel:
      visibilidade?.painel ?? true,

    rematricula:
      visibilidade?.rematricula ??
      false,

    disciplinas:
      visibilidade?.disciplinas ??
      true,

    progresso:
      visibilidade?.progresso ??
      true,
    desenvolvimento: visibilidade?.desenvolvimento ?? false,

    trabalhos:
      visibilidade?.trabalhos ??
      true,

    presenca:
      visibilidade?.presenca ??
      true,

    boletim:
      visibilidade?.boletim ??
      true,

    historico:
      visibilidade?.historico ??
      true,

    reunioes:
      visibilidade?.reunioes ??
      true,

    certificados:
      visibilidade?.certificados ??
      true,

    mobilidade:
      visibilidade?.mobilidade ??
      false,

    ouvidoria:
      visibilidade?.ouvidoria ??
      true,
  };

  const menu = [
    podeVer.painel && {
      label: t(
        "academicDashboard"
      ),
      href: "/aluno",
      icon: "📊",
    },

    podeVer.rematricula && {
      label: t(
        "semesterReenrollment"
      ),
      href: "/aluno/rematricula",
      icon: "🔄",
    },

    podeVer.disciplinas && {
      label: t("subjects"),
      href: "/aluno/disciplinas",
      icon: "📘",
    },

    podeVer.biblioteca && {
      label: t("library"),
      href: "/aluno/biblioteca",
      icon: "📚",
    },

    podeVer.desenvolvimento && {label:tPlanning("myDevelopment"),href:"/aluno/desenvolvimento",icon:"📈"},
    podeVer.progresso && {
      label: t("progress"),
      href: "/aluno/progresso",
      icon: "📈",
    },

    podeVer.trabalhos && {
      label: t("assignments"),
      href: "/aluno/trabalhos",
      icon: "📄",
    },

    podeVer.presenca && {
      label: t("attendance"),
      href: "/aluno/presencas",
      icon: "📅",
    },

    podeVer.boletim && {
      label: t("grades"),
      href: "/aluno/boletim",
      icon: "📋",
    },

    podeVer.historico && {
      label: t(
        "academicHistory"
      ),
      href: "/aluno/historico",
      icon: "📚",
    },

    podeVer.reunioes && {
      label: t("meetings"),
      href: "/aluno/reunioes",
      icon: "📹",
    },

    podeVer.certificados && {
      label: t("certificates"),
      href: "/aluno/certificados",
      icon: "🏅",
    },

    podeVer.mobilidade && {
      label: t(
        "internationalMobility"
      ),
      href: "/aluno/mobilidade",
      icon: "🌍",
    },

    podeVer.ouvidoria && {
      label: t("ombudsman"),
      href: "/aluno/ouvidoria",
      icon: "📣",
    },
  ].filter(Boolean) as ItemMenuAluno[];

  return (
      <aside className="phanyx-aluno-sidebar min-w-0 border-r border-blue-800 bg-blue-950 text-white shadow-xl dark:border-slate-800 dark:bg-slate-950 lg:fixed lg:min-h-screen lg:w-64">
        <div data-portal-preferences className="p-4 lg:p-6">
          <div className="hidden text-lg font-bold text-white lg:block">
            🎓 {t("areaTitle")}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur lg:mt-4">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-white/30 bg-white/10 lg:h-14 lg:w-14 lg:rounded-2xl">
              {aluno?.fotoPerfil ? (
                <img
                  src={
                    aluno.fotoPerfil
                  }
                  alt={t(
                    "profilePhoto",
                    {
                      name: nomeAluno,
                    }
                  )}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                  {nomeAluno
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="phanyx-aluno-perfil-tipo text-xs font-bold uppercase tracking-[0.18em]">
                {t("student")}
              </p>

              <p className="truncate font-semibold text-white">
                {nomeAluno}
              </p>
            </div>
          </div>
        </div>

        <nav
          data-portal-pages
          className="space-y-1 px-3 max-lg:pt-3"
          aria-label={t("areaTitle")}
        >
          {menu.map((item) => {
            const ativo =
              item.href === "/aluno"
                ? pathname ===
                "/aluno"
                : pathname ===
                item.href ||
                pathname.startsWith(
                  `${item.href}/`
                );

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  ativo
                    ? "page"
                    : undefined
                }
                className={`phanyx-aluno-menu-item flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition max-lg:min-h-11 motion-reduce:transition-none ${ativo
                  ? "phanyx-aluno-menu-item-ativo phanyx-aluno-menu-selecionado shadow-sm"
                  : "text-blue-50 hover:bg-blue-800 hover:text-white dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
              >
                <span
                  aria-hidden="true"
                  className="shrink-0"
                >
                  {item.icon}
                </span>

                <span className="phanyx-aluno-menu-texto min-w-0 lg:truncate">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <form action="/api/auth/logout-aluno" method="post" data-portal-pages className="p-4 lg:hidden">
          <button type="submit" className="min-h-11 w-full rounded-xl bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800">
            {tLayout("logout")}
          </button>
        </form>
      </aside>
  );
}
