"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ChatGlobalWidget from "@/components/chat/ChatGlobalWidget";
import PhanyxNotificationBell from "@/components/notificacoes/PhanyxNotificationBell";

type VisibilidadeAluno = {
  painel?: boolean;
  rematricula?: boolean;
  disciplinas?: boolean;
  progresso?: boolean;
  trabalhos?: boolean;
  presenca?: boolean;
  boletim?: boolean;
  historico?: boolean;
  reunioes?: boolean;
  certificados?: boolean;
  ouvidoria?: boolean;
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

  const podeVer = {
    painel: visibilidade?.painel ?? true,
    rematricula: visibilidade?.rematricula ?? false,
    disciplinas: visibilidade?.disciplinas ?? true,
    progresso: visibilidade?.progresso ?? true,
    trabalhos: visibilidade?.trabalhos ?? true,
    presenca: visibilidade?.presenca ?? true,
    boletim: visibilidade?.boletim ?? true,
    historico: visibilidade?.historico ?? true,
    reunioes: visibilidade?.reunioes ?? true,
    certificados: visibilidade?.certificados ?? true,
    ouvidoria: visibilidade?.ouvidoria ?? true,
  };

  const menu = [
    podeVer.painel && {
      label: "Painel Acadêmico",
      href: "/aluno",
      icon: "📊",
    },
    podeVer.rematricula && {
  label: "Rematrícula semestral",
  href: "/aluno/rematricula",
  icon: "🔄",
},
    podeVer.disciplinas && {
      label: "Disciplinas",
      href: "/aluno/disciplinas",
      icon: "📘",
    },
    podeVer.progresso && {
      label: "Progresso",
      href: "/aluno/progresso",
      icon: "📈",
    },
    podeVer.trabalhos && {
      label: "Trabalhos",
      href: "/aluno/trabalhos",
      icon: "📄",
    },
    podeVer.presenca && {
      label: "Presença",
      href: "/aluno/presencas",
      icon: "📅",
    },
    podeVer.boletim && {
      label: "Boletim",
      href: "/aluno/boletim",
      icon: "📋",
    },
    podeVer.historico && {
      label: "Histórico Acadêmico",
      href: "/aluno/historico",
      icon: "📚",
    },
    podeVer.reunioes && {
      label: "Reuniões",
      href: "/aluno/reunioes",
      icon: "📹",
    },
    podeVer.certificados && {
      label: "Certificados",
      href: "/aluno/certificados",
      icon: "🏅",
    },
    podeVer.ouvidoria && {
      label: "Ouvidoria",
      href: "/aluno/ouvidoria",
      icon: "📣",
    },
  ].filter(Boolean) as {
    label: string;
    href: string;
    icon: string;
  }[];

  return (
    <>
      <aside className="fixed min-h-screen w-64 bg-blue-800 text-white">
        <div className="p-6">
          <div className="text-lg font-bold">🎓 Área do Aluno</div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10">
              {aluno?.fotoPerfil ? (
                <img
                  src={aluno.fotoPerfil}
                  alt={aluno.nome || "Aluno"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                  {aluno?.nome?.charAt(0)?.toUpperCase() || "A"}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-100">
                Aluno
              </p>

              <p className="truncate font-semibold text-white">
                {aluno?.nome || "Aluno"}
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-3">
          {menu.map((item) => {
            const ativo =
  item.href === "/aluno"
    ? pathname === "/aluno"
    : pathname === item.href ||
      pathname.startsWith(
        item.href + "/",
      );

            return (
              <Link
  key={item.href}
  href={item.href}
  className={`phanyx-aluno-menu-item flex items-center gap-2 rounded-lg px-3 py-2 transition ${
    ativo
      ? "phanyx-aluno-menu-item-ativo bg-blue-700 text-white"
      : "text-slate-900 hover:bg-blue-700 hover:text-white"
  }`}
>
  <span>{item.icon}</span>

  <span className="phanyx-aluno-menu-texto">
    {item.label}
  </span>
</Link>
            );
          })}
        </nav>
      </aside>

      <PhanyxNotificationBell />
      <ChatGlobalWidget />
    </>
  );
}