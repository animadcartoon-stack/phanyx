export default function Header() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <h1 className="font-semibold text-lg text-gray-800">
        Dashboard
      </h1>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Administrador</span>
        <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center">
          A
        </div>
      </div>
    </header>
  )
}
