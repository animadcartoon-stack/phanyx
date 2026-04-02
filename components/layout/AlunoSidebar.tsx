"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AlunoSidebar() {
  const pathname = usePathname();

  const menu = [
    { label: "Painel Acadêmico", href: "/aluno", icon: "📊" },
    { label: "Disciplinas", href: "/aluno/disciplinas", icon: "📘" },
    { label: "Progresso", href: "/aluno/progresso", icon: "📈" },
    { label: "Trabalhos", href: "/aluno/trabalhos", icon: "📄" },
    { label: "Boletim", href: "/aluno/boletim", icon: "📋" },   // ← ADICIONE ESTA LINHA
    { label: "Certificados", href: "/aluno/certificados", icon: "🏅" },
  ];

  return (
    <aside className="w-64 bg-blue-800 text-white min-h-screen fixed">
      <div className="p-6 font-bold text-lg">
        🎓 Área do Aluno
      </div>

      <nav className="space-y-1 px-3">
        {menu.map((item) => {
          const ativo = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                ativo
                  ? "bg-blue-700"
                  : "hover:bg-blue-700"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
