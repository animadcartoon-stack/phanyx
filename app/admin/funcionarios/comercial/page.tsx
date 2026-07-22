const MODULOS_COMERCIAIS = [
  {
    icone: "🎯",
    titulo: "Leads e oportunidades",
    descricao:
      "Cadastre interessados, acompanhe contatos, etapas do funil e responsáveis.",
  },
  {
    icone: "🧑‍💼",
    titulo: "Vendedores",
    descricao:
      "Gerencie os funcionários autorizados a atuar em vendas e matrículas.",
  },
  {
    icone: "📈",
    titulo: "Metas comerciais",
    descricao:
      "Defina metas por vendedor, equipe, curso, polo e período.",
  },
  {
    icone: "📝",
    titulo: "Vendas e matrículas",
    descricao:
      "Acompanhe matrículas, valores negociados e vendedores responsáveis.",
  },
  {
    icone: "💰",
    titulo: "Comissões",
    descricao:
      "Calcule e aprove comissões antes do envio para o RH e o holerite.",
  },
  {
    icone: "📊",
    titulo: "Relatórios",
    descricao:
      "Analise conversão, desempenho, metas, vendas e resultados comerciais.",
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
          Gerencie leads, vendedores, metas, vendas, matrículas,
          comissões e resultados comerciais da instituição.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Leads ativos
          </p>

          <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">
            —
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            O funil comercial será conectado nesta área.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Vendas no período
          </p>

          <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">
            —
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Matrículas e vendas confirmadas.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Metas atingidas
          </p>

          <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">
            —
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Resultado por vendedor e equipe.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Comissões pendentes
          </p>

          <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">
            —
          </p>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Valores aguardando análise comercial.
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            Recursos do setor Comercial
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Cada recurso será conectado às permissões departamentais e
            individuais já cadastradas.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MODULOS_COMERCIAIS.map((modulo) => (
            <article
              key={modulo.titulo}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950"
            >
              <div className="text-2xl">{modulo.icone}</div>

              <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">
                {modulo.titulo}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {modulo.descricao}
              </p>

              <span className="mt-4 inline-flex rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                Em implantação
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30">
        <h2 className="text-base font-black text-blue-950 dark:text-blue-100">
          Integração com o RH
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-900 dark:text-blue-200">
          As comissões originadas por vendas e matrículas serão
          calculadas no Comercial. Depois de aprovadas, serão enviadas
          para Remuneração Variável e incluídas no holerite da
          competência correspondente.
        </p>
      </section>
    </main>
  );
}