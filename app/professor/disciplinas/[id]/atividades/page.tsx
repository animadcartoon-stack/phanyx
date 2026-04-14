export default function AtividadesDisciplinaPage() {
  const atividades: any[] = [];

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-violet-600">
              Disciplina
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Atividades da disciplina
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Crie, gerencie e acompanhe as atividades vinculadas a esta disciplina.
            </p>
          </div>

          <button
            className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            + Nova atividade
          </button>
        </div>
      </div>

      {atividades.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="text-lg font-bold text-slate-900">
            Nenhuma atividade criada ainda
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Comece criando sua primeira atividade para os alunos desta disciplina.
          </p>

          <button className="mt-6 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700">
            Criar primeira atividade
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {atividades.map((atividade, index) => (
            <div
              key={index}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  {atividade.titulo}
                </h2>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {atividade.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                {atividade.descricao}
              </p>

              <div className="mt-4 flex gap-2">
                <button className="rounded-xl border px-3 py-1 text-sm">
                  Editar
                </button>
                <button className="rounded-xl border px-3 py-1 text-sm">
                  Ver entregas
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}