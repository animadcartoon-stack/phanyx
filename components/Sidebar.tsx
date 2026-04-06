import Link from "next/link"

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r h-screen fixed left-0 top-0">
      <div className="p-6 font-bold text-xl text-blue-600">
        PHANYX Sistema Acadêmico Inteligente
      </div>

      <nav className="px-4 space-y-2 text-gray-700">
        <Link href="/dashboard" className="block p-2 rounded hover:bg-gray-100">
          📊 Dashboard
        </Link>

        <Link href="#" className="block p-2 rounded hover:bg-gray-100">
          📚 Cursos
        </Link>

        <Link href="#" className="block p-2 rounded hover:bg-gray-100">
          👨‍🏫 Professores
        </Link>

        <Link href="#" className="block p-2 rounded hover:bg-gray-100">
          👩‍🎓 Alunos
        </Link>

        <Link href="#" className="block p-2 rounded hover:bg-gray-100">
          ⚙️ Configurações
        </Link>
      </nav>
    </aside>
  )
}
