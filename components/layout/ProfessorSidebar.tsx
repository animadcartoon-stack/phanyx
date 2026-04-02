"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ProfessorSidebar() {
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
];

  return (
    <aside className="w-64 bg-blue-700 text-white min-h-screen flex flex-col">
      <div className="p-6 text-xl font-bold border-b border-blue-500">
        👨‍🏫 Professor
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
  );
}
