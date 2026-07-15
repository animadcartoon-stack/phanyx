import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

type PontoRhPageProps = {
  params: {
    slug: string;
  };
};

function normalizarSlug(valor: unknown) {
  return decodeURIComponent(String(valor || ""))
    .trim()
    .toLowerCase();
}

function formatarData(data?: Date | null) {
  if (!data) return null;

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function PontoRhPage({
  params,
}: PontoRhPageProps) {
  const slug = normalizarSlug(params.slug);
  const user = await getUserFromToken();

  if (!slug) {
    redirect("/rh-app");
  }

  if (!user) {
    redirect(
      `/rh-app/${encodeURIComponent(slug)}/login`
    );
  }

  const usuarioId = Number(user?.id);
const instituicaoId = Number(user?.instituicaoId);

if (
  !Number.isInteger(usuarioId) ||
  usuarioId <= 0 ||
  !Number.isInteger(instituicaoId) ||
  instituicaoId <= 0
) {
  redirect(
    `/rh-app/${encodeURIComponent(slug)}/login`
  );
}

  const [instituicao, funcionario, configuracao] =
    await Promise.all([
      prisma.instituicao.findFirst({
        where: {
          id: instituicaoId,
          slug,
        },
        select: {
          id: true,
          nome: true,
          slug: true,
        },
      }),

      prisma.funcionario.findFirst({
        where: {
  userId: usuarioId,
  instituicaoId,
},
        select: {
          id: true,
          nome: true,
          cargo: true,
          fotoPerfil: true,
          ativo: true,
          statusFuncionario: true,

          pontoMobileLiberado: true,
          pontoMobileLiberadoEm: true,
          pontoMobileValidoAte: true,

          user: {
            select: {
              email: true,
              ativo: true,
            },
          },
        },
      }),

      prisma.configuracaoPontoMobileRH.findUnique({
        where: {
          instituicaoId,
        },
        select: {
          ativo: true,
        },
      }),
    ]);

  if (!instituicao || !funcionario) {
    redirect(
      `/rh-app/${encodeURIComponent(slug)}/login`
    );
  }

  const acessoExpirado =
    funcionario.pontoMobileValidoAte !== null &&
    funcionario.pontoMobileValidoAte.getTime() <
      Date.now();

  const acessoPermitido =
    configuracao?.ativo === true &&
    funcionario.ativo === true &&
    funcionario.user.ativo === true &&
    funcionario.pontoMobileLiberado === true &&
    !acessoExpirado;

  const nomeInstituicao = String(
    instituicao.nome || "Instituição"
  ).replace(/^([^-]+)-(.+)$/, "$1 – $2");

  const iniciais = funcionario.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md space-y-5">
        <header className="rounded-[30px] bg-gradient-to-br from-blue-700 to-indigo-800 p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <img
              src="/logo-phanyx.png"
              alt="PHANYX"
              className="h-auto w-36 object-contain"
            />

            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wider">
              RH Ponto
            </span>
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
              Instituição
            </p>

            <h1 className="mt-2 text-xl font-black leading-tight">
              {nomeInstituicao}
            </h1>
          </div>
        </header>

        <section className="rounded-[30px] border border-slate-700 bg-slate-900 p-6 shadow-xl">
          <div className="flex items-center gap-4">
            {funcionario.fotoPerfil ? (
              <img
                src={funcionario.fotoPerfil}
                alt={`Foto de ${funcionario.nome}`}
                className="h-16 w-16 shrink-0 rounded-2xl border border-slate-600 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-blue-700 bg-blue-950 text-lg font-black text-blue-200">
                {iniciais || "FN"}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Funcionário
              </p>

              <h2 className="mt-1 truncate text-lg font-black">
                {funcionario.nome}
              </h2>

              <p className="mt-1 truncate text-sm text-slate-300">
                {funcionario.cargo ||
                  "Cargo não informado"}
              </p>

              <p className="mt-1 truncate text-xs text-slate-400">
                {funcionario.user.email}
              </p>
            </div>
          </div>
        </section>

        {acessoPermitido ? (
          <section className="rounded-[30px] border border-emerald-800 bg-emerald-950/40 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-xl">
                ✓
              </span>

              <div>
                <p className="font-black text-emerald-100">
                  Acesso confirmado
                </p>

                <p className="mt-1 text-sm text-emerald-200">
                  Seu usuário está autorizado a utilizar o
                  Ponto Mobile.
                </p>
              </div>
            </div>

            {funcionario.pontoMobileValidoAte && (
              <p className="mt-4 rounded-2xl border border-emerald-800 bg-slate-950/30 px-4 py-3 text-xs text-emerald-100">
                Acesso válido até{" "}
                <strong>
                  {formatarData(
                    funcionario.pontoMobileValidoAte
                  )}
                </strong>
                .
              </p>
            )}
          </section>
        ) : (
          <section className="rounded-[30px] border border-red-800 bg-red-950/40 p-6">
            <p className="font-black text-red-100">
              Acesso indisponível
            </p>

            <p className="mt-2 text-sm leading-6 text-red-200">
              Seu acesso ao Ponto Mobile está bloqueado,
              expirado ou o recurso foi desativado pela
              instituição. Entre em contato com o RH.
            </p>
          </section>
        )}

        <section className="rounded-[30px] border border-slate-700 bg-slate-900 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
            Registro de ponto
          </p>

          <h2 className="mt-2 text-xl font-black">
            Área do funcionário
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            O acesso está funcionando. Na próxima etapa
            entraremos com localização, foto ao vivo e o
            botão de registro de ponto.
          </p>

          <button
            type="button"
            disabled
            className="mt-5 min-h-14 w-full cursor-not-allowed rounded-2xl bg-slate-700 px-5 py-4 font-black text-slate-400"
          >
            Registrar ponto — em preparação
          </button>
        </section>

        <Link
          href={`/rh-app/${encodeURIComponent(slug)}`}
          className="flex min-h-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300"
        >
          Voltar para a página da instituição
        </Link>
      </div>
    </main>
  );
}