export default function ReputacaoPage() {
  const cards = [
    {
      titulo: "Nota média",
      valor: "—",
      detalhe: "Aguardando avaliações conectadas",
      cor: "text-yellow-600",
    },
    {
      titulo: "Avaliações",
      valor: "0",
      detalhe: "Total de avaliações monitoradas",
      cor: "text-blue-700",
    },
    {
      titulo: "Pendências",
      valor: "0",
      detalhe: "Avaliações aguardando resposta",
      cor: "text-red-600",
    },
    {
      titulo: "Índice PHANYX",
      valor: "Em breve",
      detalhe: "Reputação consolidada da instituição",
      cor: "text-purple-700",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700">
          PHANYX GROWTH
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          ⭐ Reputação
        </h1>

        <p className="mt-2 max-w-3xl text-slate-600">
          Monitore a reputação digital da instituição, acompanhe avaliações,
          respostas pendentes e indicadores de confiança.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.titulo}
            className="rounded-2xl border bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {card.titulo}
            </p>

            <p className={`mt-2 text-3xl font-black ${card.cor}`}>
              {card.valor}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {card.detalhe}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-black text-amber-900">
          Google Business em preparação
        </h2>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          O PHANYX já está pronto para conectar avaliações e métricas do Google
          Business. Algumas informações dependem da liberação da API pelo
          Google.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">
            Fontes de reputação
          </h2>

          <div className="mt-4 space-y-3">
            {[
              "Google Business",
              "Meta / Facebook",
              "Instagram",
              "Reclamações internas",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-xl border p-4"
              >
                <span className="font-semibold text-slate-700">{item}</span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  Em preparação
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">
            Próximos recursos
          </h2>

          <ul className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
            <li>✅ Últimas avaliações recebidas</li>
            <li>✅ Respostas pendentes</li>
            <li>✅ Alerta de avaliação negativa</li>
            <li>✅ Nota média por canal</li>
            <li>✅ Índice reputacional PHANYX</li>
          </ul>
        </div>
      </div>
    </div>
  );
}