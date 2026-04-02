"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AdminSidebar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `block px-4 py-2 rounded hover:bg-blue-700 ${
      pathname === path ? "bg-blue-700" : ""
    }`;

  return (
    <aside className="w-64 bg-blue-800 text-white min-h-screen">
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
    🔥 Painel Master FORMAX
  </a>
)}

      </nav>
    </aside>
  );
}

