"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ChatGlobalWidget from "@/components/chat/ChatGlobalWidget";
import PhanyxNotificationBell from "@/components/notificacoes/PhanyxNotificationBell";

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
    podeVer.painel && { label: "Painel Docente", href: "/professor" },
    podeVer.turmas && { label: "Turmas", href: "/professor/turmas" },
podeVer.substituicoes && {
  label: "Substituições Docentes",
  href: "/professor/substituicoes",
},
podeVer.alunos && { label: "Alunos", href: "/professor/alunos" },
    podeVer.materiais && { label: "Materiais/Aulas", href: "/professor/aulas" },
    podeVer.atividades && { label: "Atividades", href: "/professor/atividades" },
    podeVer.provas && { label: "Avaliações", href: "/professor/provas" },
    podeVer.trabalhos && { label: "Trabalhos", href: "/professor/trabalhos" },
    podeVer.reunioes && { label: "Reuniões", href: "/professor/reunioes" },
    podeVer.ouvidoria && { label: "Ouvidoria", href: "/professor/ouvidoria" },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <>
      <aside className="professor-sidebar flex min-h-screen w-64 flex-col">
        <div className="border-b border-blue-500 p-6">
          <div className="text-xl font-bold">👨‍🏫 Professor</div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3">
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10">
              {professor?.fotoPerfil ? (
                <img
                  src={professor.fotoPerfil}
                  alt={professor.nome || "Professor"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                  {professor?.nome?.charAt(0)?.toUpperCase() || "P"}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-100">
                Docente
              </p>
              <p className="truncate font-semibold text-white">
                {professor?.nome || "Professor"}
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
                className={`block rounded px-4 py-2 font-semibold transition ${
  ativo
    ? "bg-blue-700 text-white dark:bg-blue-700 dark:text-white"
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
          Sair
        </button>
      </aside>

      <PhanyxNotificationBell />
      <ChatGlobalWidget />
    </>
  );
}