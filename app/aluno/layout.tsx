import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import AlunoSidebar from "@/components/layout/AlunoSidebar";
import { AlunoProvider } from "@/app/context/AlunoContext";
import PhanyxFeriadoAviso from "@/components/ui/PhanyxFeriadoAviso";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login?portal=aluno");
  }

  let decoded: {
    id: number;
    role: string;
    email: string;
    instituicaoId: number;
  };

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      role: string;
      email: string;
      instituicaoId: number;
    };
  } catch {
    redirect("/login?portal=aluno");
  }

  if (
    String(decoded.role).toUpperCase() !== "ALUNO"
  ) {
    redirect("/login?portal=aluno");
  }

  const aluno = await prisma.aluno.findFirst({
    where: {
      userId: decoded.id,
      instituicaoId: decoded.instituicaoId,
    },
    select: {
  id: true,
  nome: true,
  fotoPerfil: true,
  statusAluno: true,
  instituicaoId: true,
},
  });

  if (!aluno) {
    redirect("/login?portal=aluno");
  }

  const configFinanceira =
    await prisma.configuracaoFinanceiraInstituicao.findUnique({
      where: {
        instituicaoId: aluno.instituicaoId,
      },
      select: {
        bloquearAlunoInadimplente: true,
      },
    });

  const bloqueioFinanceiroAtivo = Boolean(
    configFinanceira?.bloquearAlunoInadimplente
  );

  if (bloqueioFinanceiroAtivo && aluno.statusAluno === "INADIMPLENTE") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl bg-white border border-red-100 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-amber-500 px-8 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/15 flex items-center justify-center text-3xl">
                🚫
              </div>

              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-white/80">
                  Acesso acadêmico bloqueado
                </p>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Regularização financeira necessária
                </h1>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-6">
            <div className="space-y-3">
              <p className="text-gray-700 text-lg">
                Olá, <strong>{aluno.nome}</strong>.
              </p>

              <p className="text-gray-600 leading-7">
                Seu acesso ao ambiente acadêmico está temporariamente bloqueado
                por pendência financeira registrada pela instituição.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <h2 className="font-semibold text-red-800 mb-2">
                  O que isso significa
                </h2>
                <p className="text-sm text-red-700 leading-6">
                  Enquanto a pendência estiver em aberto, o acesso às áreas
                  acadêmicas poderá permanecer indisponível.
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="font-semibold text-amber-800 mb-2">
                  Como liberar o acesso
                </h2>
                <p className="text-sm text-amber-700 leading-6">
                  Entre em contato com o setor financeiro ou secretaria da sua
                  instituição para regularizar a situação.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-gray-50 p-5">
              <h2 className="font-semibold text-gray-900 mb-2">Importante</h2>
              <p className="text-sm text-gray-600 leading-6">
                Após a baixa do pagamento no sistema, o acesso poderá ser
                restabelecido automaticamente, de acordo com as regras da
                instituição.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="/login?portal=aluno"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 bg-gray-900 text-white font-medium hover:bg-black transition"
              >
                Voltar para o login
              </a>

              <form action="/api/auth/logout-aluno" method="post">
                <button
                  type="submit"
                  className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                >
                  Sair
                </button>
              </form>
            </div>

            <div className="pt-2 text-xs text-gray-400">
              PHANYX • Controle acadêmico e financeiro
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AlunoProvider>
      <Header />
      <div className="flex bg-gray-100 min-h-[calc(100vh-56px)]">
        <AlunoSidebar aluno={aluno} />

        <form
          action="/api/auth/logout-aluno"
          method="post"
          className="fixed right-6 top-20 z-[60]"
        >
          <button
            type="submit"
            className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
          >
            Sair
          </button>
        </form>

        <main className="flex-1 ml-64 p-8">
  <PhanyxFeriadoAviso />
  {children}
</main>
      </div>
    </AlunoProvider>
  );
}