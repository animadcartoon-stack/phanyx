export default function NotasPage() {
  const resumo = [
    { titulo: "Turmas com notas", valor: "0" },
    { titulo: "Avaliações lançadas", valor: "0" },
    { titulo: "Pendências de correção", valor: "0" },
    { titulo: "Alunos avaliados", valor: "0" },
  ];

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-violet-600">
              Área do Professor
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Central de notas
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
              Visualize lançamentos, acompanhe pendências de correção e organize
              as notas das suas turmas em um só lugar.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Exportar
            </button>

            <button
              type="button"
              className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              Lançar notas
            </button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {resumo.map((item) => (
          <div
            key={item.titulo}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{item.titulo}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {item.valor}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Buscar aluno, turma ou disciplina
            </label>
            <input
              type="text"
              placeholder="Ex.: João, Teologia 1, Hermenêutica"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500"
            />
          </div>

          <div className="w-full lg:w-56">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Turma
            </label>
            <select className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500">
              <option>Todas</option>
            </select>
          </div>

          <div className="w-full lg:w-56">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tipo
            </label>
            <select className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500">
              <option>Todos</option>
              <option>Prova</option>
              <option>Atividade</option>
              <option>Recuperação</option>
              <option>Ajuste</option>
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            Lançamentos de notas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Aqui aparecerão as notas lançadas e os alunos vinculados às suas
            turmas.
          </p>
        </div>

        <div className="p-6">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <div className="mx-auto max-w-xl">
              <p className="text-lg font-bold text-slate-900">
                Nenhuma nota carregada ainda
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Esta página já está pronta visualmente. No próximo passo, vamos
                ligar os dados reais das suas turmas, alunos, provas e
                atividades sem quebrar a estrutura que já existe.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Lançar primeira nota
                </button>

                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Ver turmas
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}