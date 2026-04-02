"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function AlunoBloqueadoFinanceiroPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-red-600">
          Acesso bloqueado por inadimplência
        </h1>

        <p className="mt-4 text-sm text-slate-700">
          Olá, {user?.nome || "aluno"}.
        </p>

        <p className="mt-3 text-sm text-slate-700">
          Seu acesso acadêmico está temporariamente bloqueado porque existem
          pendências financeiras em aberto.
        </p>

        <p className="mt-3 text-sm text-slate-700">
          Assim que o pagamento for regularizado e o status financeiro for
          atualizado, o acesso será liberado automaticamente.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Ir para login
          </Link>

          <Link
            href="/aluno"
            className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Tentar novamente
          </Link>
        </div>
      </div>
    </div>
  );
}