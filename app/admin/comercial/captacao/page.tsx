import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CardResumoProps = {
  icone: string;
  titulo: string;
  valor: number;
  descricao: string;
};

function CardResumo({
  icone,
  titulo,
  valor,
  descricao,
}: CardResumoProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">
            {titulo}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {valor}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          {icone}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        {descricao}
      </p>
    </article>
  );
}

export default async function CentralCaptacaoPage() {
  const user = await getUserFromToken();

  if (!user) {
    redirect("/login?portal=admin");
  }

  const instituicaoId = Number(
    user.instituicaoId
  );

  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    redirect("/admin");
  }

  const podeVer =
    await usuarioPossuiPermissao(
      user,
      "comercial.captacao.ver"
    );

  if (!podeVer) {
    redirect("/admin");
  }

  const [
    canais,
    campanhas,
    formularios,
    submissoes,
    regrasDistribuicao,
    integracoes,
  ] = await Promise.all([
    prisma.canalCaptacaoLead.count({
      where: {
        instituicaoId,
      },
    }),

    prisma.campanhaCaptacaoLead.count({
      where: {
        instituicaoId,
      },
    }),

    prisma.formularioCaptacaoLead.count({
      where: {
        instituicaoId,
      },
    }),

    prisma.submissaoCaptacaoLead.count({
      where: {
        instituicaoId,
      },
    }),

    prisma.regraDistribuicaoLead.count({
      where: {
        instituicaoId,
      },
    }),

    prisma.integracaoCaptacaoLead.count({
      where: {
        instituicaoId,
      },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
              Comercial
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Central de Captação
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Gerencie a entrada de novos leads,
              campanhas, formulários, distribuição
              automática e integrações de captação da
              instituição.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
              Estrutura
            </p>

            <p className="mt-1 text-sm font-bold text-emerald-950">
              Central de Captação ativa
            </p>
          </div>
        </div>
      </header>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-950">
            Visão geral
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Registros existentes na Central de
            Captação desta instituição.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <CardResumo
            icone="📡"
            titulo="Canais de captação"
            valor={canais}
            descricao="Origens utilizadas para receber novos interessados e leads."
          />

          <CardResumo
            icone="📣"
            titulo="Campanhas"
            valor={campanhas}
            descricao="Campanhas comerciais e de marketing vinculadas à captação."
          />

          <CardResumo
            icone="📝"
            titulo="Formulários"
            valor={formularios}
            descricao="Formulários públicos configurados para entrada de interessados."
          />

          <CardResumo
            icone="📥"
            titulo="Submissões recebidas"
            valor={submissoes}
            descricao="Entradas recebidas pelos formulários e integrações da instituição."
          />

          <CardResumo
            icone="🔀"
            titulo="Regras de distribuição"
            valor={regrasDistribuicao}
            descricao="Regras responsáveis pelo encaminhamento automático dos leads."
          />

          <CardResumo
            icone="🔌"
            titulo="Integrações"
            valor={integracoes}
            descricao="Integrações e webhooks ligados às fontes de captação."
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">
          Estrutura da Central
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Esta é a página principal da nova Central de
          Captação. Nas próximas etapas serão
          adicionados os gerenciamentos de canais,
          campanhas, formulários, submissões,
          distribuição automática, integrações e
          auditoria.
        </p>
      </section>
    </div>
  );
}