"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import ChatGlobalWidget from "@/components/chat/ChatGlobalWidget";
import PhanyxNotificationBell from "@/components/notificacoes/PhanyxNotificationBell";

export default function ProfessorSidebar({
  professor,
}: {
  professor?: {
    nome?: string;
    fotoPerfil?: string | null;
  };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const menu = [
  { label: "Painel Docente", href: "/professor" },
  { label: "Turmas", href: "/professor/turmas" },
  { label: "Alunos", href: "/professor/alunos" },
  { label: "Atividades", href: "/professor/atividades" },
  { label: "Avaliações", href: "/professor/avaliacoes" },
  { label: "Trabalhos", href: "/professor/trabalhos" },
  { label: "Ouvidoria", href: "/professor/ouvidoria" },
];

    return (
    <>
      <aside className="w-64 bg-blue-700 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-blue-500">
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

      <nav className="flex-1 p-4 space-y-2">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 rounded ${
              pathname === item.href
                ? "bg-blue-900"
                : "hover:bg-blue-600"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => {
          logout();
          router.push("/login");
        }}
        className="m-4 px-4 py-2 bg-red-600 rounded hover:bg-red-700"
      >
        Sair
      </button>
          </aside>

      <PhanyxNotificationBell />
<ChatGlobalWidget />
    </>
  );
}
