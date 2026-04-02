import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import { ProfessorProvider } from "@/app/context/ProfessorContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 w-full min-h-screen bg-gray-100">
        <Header />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
