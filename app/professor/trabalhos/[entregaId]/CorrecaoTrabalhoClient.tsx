"use client";

import Link from "next/link";

type Props = {
  entregaId: number;
};

export default function CorrecaoTrabalhoClient({ entregaId }: Props) {
  return (
    <main className="space-y-6 p-4 text-slate-900 dark:text-slate-100">
      <div>
        <Link
          href="/professor/trabalhos"
          className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          ← Voltar para trabalhos
        </Link>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
          Trabalhos
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
          Correção da entrega
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Entrega #{entregaId}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard titulo="Aluno" valor="Carregando aluno..." />
        <InfoCard titulo="Status" valor="Correção pendente" />
        <InfoCard titulo="Data da entrega" valor="Carregando..." />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card titulo="Atividade">
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>
              <strong className="text-slate-800 dark:text-slate-100">
                Título:
              </strong>{" "}
              Carregando atividade...
            </p>

            <p>
              <strong className="text-slate-800 dark:text-slate-100">
                Nota máxima:
              </strong>{" "}
              -
            </p>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              Descrição da atividade será exibida aqui.
            </div>
          </div>
        </Card>

        <Card titulo="Dados acadêmicos">
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p><strong className="text-slate-800 dark:text-slate-100">Matrícula:</strong> -</p>
            <p><strong className="text-slate-800 dark:text-slate-100">Curso:</strong> -</p>
            <p><strong className="text-slate-800 dark:text-slate-100">Turma:</strong> -</p>
            <p><strong className="text-slate-800 dark:text-slate-100">Semestre:</strong> -</p>
            <p><strong className="text-slate-800 dark:text-slate-100">Período letivo:</strong> -</p>
          </div>
        </Card>
      </section>

      <Card titulo="Entrega do aluno">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            Texto enviado pelo aluno será exibido aqui.
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              Link enviado
            </button>

            <button
              type="button"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              Arquivo enviado
            </button>
          </div>
        </div>
      </Card>

      <Card titulo="Histórico de versões">
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          O histórico de versões da entrega aparecerá aqui.
        </div>
      </Card>

      <Card titulo="Avaliação">
        <div className="grid gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Nota
            </label>
            <input
              type="number"
              min={0}
              placeholder="Digite a nota"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Feedback para o aluno
            </label>
            <textarea
              rows={6}
              placeholder="Digite o feedback da correção..."
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700"
            >
              Salvar correção
            </button>
          </div>
        </div>
      </Card>
    </main>
  );
}

function Card({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-black text-slate-900 dark:text-white">
        {titulo}
      </h2>

      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoCard({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {titulo}
      </p>

      <p className="mt-2 text-lg font-black text-slate-900 dark:text-white">
        {valor}
      </p>
    </section>
  );
}