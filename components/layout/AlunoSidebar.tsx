"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AlunoSidebar({
  aluno,
}: {
  aluno: {
    nome?: string;
    fotoPerfil?: string | null;
  };
}) {
  const pathname = usePathname();

  const menu = [
    { label: "Painel Acadêmico", href: "/aluno", icon: "📊" },
    { label: "Disciplinas", href: "/aluno/disciplinas", icon: "📘" },
    { label: "Progresso", href: "/aluno/progresso", icon: "📈" },
    { label: "Trabalhos", href: "/aluno/trabalhos", icon: "📄" },
    { label: "Presença", href: "/aluno/presencas", icon: "📅" },
    { label: "Boletim", href: "/aluno/boletim", icon: "📋" },   // ← ADICIONE ESTA LINHA
    { label: "Certificados", href: "/aluno/certificados", icon: "🏅" },
  ];

  return (
    <aside className="w-64 bg-blue-800 text-white min-h-screen fixed">
      <div className="p-6">
  <div className="text-lg font-bold">
    🎓 Área do Aluno
  </div>

  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
    <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/20 bg-white/10 flex-shrink-0">
      {aluno?.fotoPerfil ? (
        <img
          src={aluno.fotoPerfil}
          alt={aluno.nome}
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
