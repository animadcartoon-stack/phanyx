"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ChatGlobalWidget from "@/components/chat/ChatGlobalWidget";
import PhanyxNotificationBell from "@/components/notificacoes/PhanyxNotificationBell";
import { useTranslations } from "next-intl";

type VisibilidadeProfessor = {
  painel?: boolean;
  turmas?: boolean;
  substituicoes?: boolean;
  alunos?: boolean;
  atividades?: boolean;
  provas?: boolean;
  trabalhos?: boolean;
  reunioes?: boolean;
  ouvidoria?: boolean;
  materiais?: boolean;
};

export default function ProfessorSidebar({
  professor,
  visibilidade,
}: {
  professor?: {
    nome?: string;
    fotoPerfil?: string | null;
  };
  visibilidade?: VisibilidadeProfessor;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const t = useTranslations("ProfessorSidebar");

  const podeVer = {
    painel: visibilidade?.painel ?? true,
    turmas: visibilidade?.turmas ?? true,
    substituicoes: visibilidade?.substituicoes ?? true,
    alunos: visibilidade?.alunos ?? true,
    atividades: visibilidade?.atividades ?? true,
    provas: visibilidade?.provas ?? true,
    trabalhos: visibilidade?.trabalhos ?? true,
    reunioes: visibilidade?.reunioes ?? true,
    ouvidoria: visibilidade?.ouvidoria ?? true,
    materiais: visibilidade?.materiais ?? true,
  };

  const menu = [
    podeVer.painel && {
      label: t("menu.dashboard"),
      href: "/professor",
    },
    podeVer.turmas && {
      label: t("menu.classes"),
      href: "/professor/turmas",
    },
    podeVer.substituicoes && {
      label: t("menu.substitutions"),
      href: "/professor/substituicoes",
    },
    podeVer.alunos && {
      label: t("menu.students"),
      href: "/professor/alunos",
    },
    podeVer.materiais && {
      label: t("menu.materials"),
      href: "/professor/aulas",
    },
    podeVer.atividades && {
      label: t("menu.activities"),
      href: "/professor/atividades",
    },
    podeVer.provas && {
      label: t("menu.assessments"),
      href: "/professor/provas",
    },
    podeVer.trabalhos && {
      label: t("menu.assignments"),
      href: "/professor/trabalhos",
    },
    podeVer.reunioes && {
      label: t("menu.meetings"),
      href: "/professor/reunioes",
    },
    podeVer.ouvidoria && {
      label: t("menu.ombudsman"),
      href: "/professor/ouvidoria",
    },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <>
      <aside className="professor-sidebar flex min-h-screen w-64 flex-col">
        <div className="border-b border-blue-500 p-6">
          <div className="text-xl font-bold">
            👨‍🏫 {t("title")}
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3">
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10">
              {professor?.fotoPerfil ? (
                <img
                  src={professor.fotoPerfil}
                  alt={professor.nome || t("title")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                  {professor?.nome?.charAt(0)?.toUpperCase() || "P"}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="phanyx-professor-perfil-tipo text-xs uppercase tracking-[0.18em]">
                {t("role")}
              </p>
              <p className="truncate font-semibold text-white">
                {professor?.nome || t("title")}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {menu.map((item) => {
            const ativo =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded px-4 py-2 font-semibold transition ${ativo
                  ? "phanyx-professor-menu-ativo bg-blue-700 text-white dark:bg-blue-700 dark:text-white"
                  : "text-slate-900 hover:bg-blue-100 hover:text-blue-700 dark:text-white dark:hover:bg-blue-600 dark:hover:text-white"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="m-4 rounded bg-red-600 px-4 py-2 hover:bg-red-700"
        >
          {t("logout")}
        </button>
      </aside>

      <PhanyxNotificationBell />
      <ChatGlobalWidget />
    </>
  );
}