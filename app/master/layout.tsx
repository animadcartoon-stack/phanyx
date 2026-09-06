import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

import PhanyxThemeToggle from "@/components/theme/PhanyxThemeToggle";
import SeletorIdioma from "@/components/internacionalizacao/SeletorIdioma";

export const dynamic = "force-dynamic";

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await getUserFromToken();

  if (!sessao) {
    redirect("/login?portal=admin");
  }

  const usuario = await prisma.user.findUnique({
    where: {
      id: sessao.id,
    },
    select: {
      id: true,
      isMasterAdmin: true,
    },
  });

  if (!usuario?.isMasterAdmin) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <div className="sticky top-0 z-[90] border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-end sm:px-6 lg:px-8">
          <div className="w-full sm:w-auto">
            <PhanyxThemeToggle />
          </div>

          <div className="w-full sm:min-w-[230px] sm:w-auto">
            <SeletorIdioma exibirRotulo={false} />
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}