"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AdminSidebar({
  funcionario,
}: {
  funcionario?: {
    nome?: string;
    fotoPerfil?: string | null;
  };
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `block px-4 py-2 rounded hover:bg-blue-700 ${
      pathname === path ? "bg-blue-700" : ""
    }`;

  return (
    <aside className="w-64 bg-blue-800 text-white min-h-screen">
      <div className="p-4">
  <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
    <div className="flex items-center gap-3">
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10">
        {funcionario?.fotoPerfil ? (
          <img
            src={funcionario.fotoPerfil}
            alt={funcionario.nome || "Funcionário"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
            {funcionario?.nome?.charAt(0)?.toUpperCase() || "A"}
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.18em] text-blue-100">
          Administrativo
        </p>
        <p className="truncate font-semibold text-white">
          {funcionario?.nome || user?.nome || "Funcionário"}
        </p>
      </div>
    </div>
  </div>
</div>
      <nav className="space-y-2 p-4">
        <button
          onClick={() => router.push("/admin")}
          className={linkClass("/admin")}
        >
          📊 Painel Administrativo
        </button>

<button
  onClick={() => router.push("/admin/professores")}
  className={linkClass("/admin/professores")}
>
  👨‍🏫 Professores
</button>

        <button
          onClick={() => router.push("/admin/alunos")}
          className={linkClass("/admin/alunos")}
        >
          👨‍🎓 Alunos
        </button>

        <button
          onClick={() => router.push("/admin/disciplinas")}
          className={linkClass("/admin/disciplinas")}
        >
          📚 Cursos
        </button>

        <button
          onClick={() => router.push("/admin/certificados")}
          className={linkClass("/admin/certificados")}
        >
          📄 Certificados
        </button>

        <button
          onClick={() => router.push("/admin/financeiro")}
          className={linkClass("/admin/financeiro")}
        >
          💰 Financeiro
        </button>

{user?.isMasterAdmin && (
  <a
    href="/master"
    className="block rounded-lg px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:opacity-90 mt-4"
  >
    🔥 Painel Master PHANYX
  </a>
)}

      </nav>
    </aside>
  );
}

