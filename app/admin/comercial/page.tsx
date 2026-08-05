import Link from "next/link";


const STATUS_MODULO = {
  DISPONIVEL: {
    texto: "Disponível",
    classes:
      "border-emerald-700 bg-emerald-100 [--phanyx-status-text:#064e3b] dark:border-emerald-700 dark:bg-emerald-950/50 dark:[--phanyx-status-text:#d1fae5]",
  },

  INTEGRADO: {
    texto: "Integração ativa",
    classes:
      "border-amber-700 bg-amber-100 [--phanyx-status-text:#78350f] dark:border-amber-700 dark:bg-amber-950/50 dark:[--phanyx-status-text:#fef3c7]",
  },

  EM_IMPLANTACAO: {
    texto: "Em implantação",
    classes:
      "border-slate-500 bg-slate-200 [--phanyx-status-text:#0f172a] dark:border-slate-700 dark:bg-slate-900 dark:[--phanyx-status-text:#e2e8f0]",
  },
} as const;

type StatusModuloComercial = keyof typeof STATUS_MODULO;

type ModuloComercial = {
  icone: string;
  titulo: string;
  descricao: string;
  status: StatusModuloComercial;
  href?: string;
  acao?: string;
};

const MODULOS_COMERCIAIS: ModuloComercial[] = [
  {
    icone: "🎯",
    titulo: "Leads e oportunidades",
    descricao:
      "Cadastre interessados, acompanhe contatos, etapas do funil e responsáveis.",
    status: "DISPONIVEL",
    href: "/admin/leads",
    acao: "Abrir leads e oportunidades",
  },
  {
    icone: "🧑‍💼",
    titulo: "Vendedores",
    descricao:
      "Gerencie os funcionários autorizados a atuar em vendas e matrículas.",
    status: "INTEGRADO",
    href: "/admin/funcionarios",
    acao: "Abrir funcionários",
  },
  {
    icone: "👥",
    titulo: "Equipes comerciais",
    descricao:
      "Organize vendedores em equipes, defina lideranças e gerencie seus membros.",
    status: "DISPONIVEL",
    href: "/admin/comercial/equipes",
    acao: "Abrir equipes comerciais",
  },
  {
    icone: "📈",
    titulo: "Metas comerciais",
    descricao:
      "Defina metas por vendedor, equipe, curso, polo e período.",
    status: "DISPONIVEL",
    href: "/admin/comercial/metas",
    acao: "Abrir metas comerciais",
  },
  {
    icone: "📝",
    titulo: "Vendas e matrículas",
    descricao:
      "Acompanhe matrículas, valores negociados e vendedores responsáveis.",
    status: "INTEGRADO",
    href: "/admin/matriculas",
    acao: "Abrir matrículas",
  },
  {
    icone: "💰",
    titulo: "Comissões",
    descricao:
      "Configure planos e regras para calcular e aprovar as comissões dos vendedores.",
    status: "DISPONIVEL",
    href: "/admin/comercial/configuracoes",
    acao: "Abrir planos de comissão",
  },
  {
    icone: "📊",
    titulo: "Relatórios",
    descricao:
      "Analise conversão, desempenho, metas, vendas e resultados comerciais.",
    status: "EM_IMPLANTACAO",
  },
];

export default function ComercialPage() {
  return (
    <main className="phanyx-comercial-page mx-auto w-full max-w-7xl space-y-7 p-6 lg:p-8">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">
          Gestão institucional
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
          📈 Comercial
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Gerencie leads, vendedores, metas, vendas, matrículas, comissões e
          resultados comerciais da instituição.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="phanyx-comercial-resumo-card rounded-3xl border p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Leads ativos
          </p>

          <p className="phanyx-comercial-indicador-valor mt-3 text-3xl font-black">
            —
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            O funil comercial será conectado nesta área.
          </p>
        </article>

        <article className="phanyx-comercial-resumo-card rounded-3xl border p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Vendas no período
          </p>

          <p className="phanyx-comercial-indicador-valor mt-3 text-3xl font-black">
            —
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Matrículas e vendas confirmadas.
          </p>
        </article>

        <article className="phanyx-comercial-resumo-card rounded-3xl border p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Metas atingidas
          </p>

          <p className="phanyx-comercial-indicador-valor mt-3 text-3xl font-black">
            —
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Resultado por vendedor e equipe.
          </p>
        </article>

        <article className="phanyx-comercial-resumo-card rounded-3xl border p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Comissões pendentes
          </p>

          <p className="phanyx-comercial-indicador-valor mt-3 text-3xl font-black">
            —
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Valores aguardando análise comercial.
          </p>
        </article>
      </section>

      <section className="phanyx-comercial-recursos rounded-3xl border p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            Recursos do setor Comercial
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Os recursos são liberados gradualmente e respeitam as permissões
            departamentais e individuais já cadastradas.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MODULOS_COMERCIAIS.map((modulo) => {
            const status = STATUS_MODULO[modulo.status];

            return (
              <article
                key={modulo.titulo}
                className="phanyx-comercial-recurso-card flex min-h-[230px] flex-col rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-2xl" aria-hidden="true">
                  {modulo.icone}
                </div>

                <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">
                  {modulo.titulo}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {modulo.descricao}
                </p>

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${status.classes}`}
                    style={{
                      color: "var(--phanyx-status-text)",
                      WebkitTextFillColor:
                        "var(--phanyx-status-text)",
                      opacity: 1,
                    }}
                  >
                    {status.texto}
                  </span>

                  {modulo.href && modulo.acao && (
                    <Link
                      href={modulo.href}
                      className="inline-flex min-h-9 items-center rounded-xl border !border-slate-950 !bg-slate-950 px-3 text-sm font-black !text-white shadow-sm transition hover:!border-slate-800 hover:!bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:!border-blue-500 dark:!bg-blue-700 dark:hover:!bg-blue-600 dark:focus-visible:ring-offset-slate-950"
                      style={{
                        color: "#ffffff",
                        WebkitTextFillColor: "#ffffff",
                        opacity: 1,
                      }}
                    >
                      {modulo.acao}

                      <span
                        className="ml-1"
                        aria-hidden="true"
                        style={{
                          color: "#ffffff",
                          WebkitTextFillColor: "#ffffff",
                        }}
                      >
                        →
                      </span>
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="phanyx-comercial-integracao rounded-3xl border p-6">
        <h2 className="text-base font-black text-blue-950 dark:text-blue-100">
          Integração com o RH
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-900 dark:text-blue-200">
          As comissões originadas por vendas e matrículas são calculadas e
          aprovadas no Comercial. Depois, podem ser enviadas ao RH e incluídas
          no holerite da competência correspondente. Bônus, prêmios e
          participações continuam sendo tratados em Remuneração Variável.
        </p>
      </section>
    </main>
  );
}