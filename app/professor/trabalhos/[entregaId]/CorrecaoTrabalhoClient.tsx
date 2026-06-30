"use client";

type Props = {
  entregaId: number;
};

export default function CorrecaoTrabalhoClient({
  entregaId,
}: Props) {
  return (
    <main className="space-y-6 p-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          Trabalhos
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Correção da entrega
        </h1>

        <p className="mt-2 text-slate-600">
          Entrega #{entregaId}
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          Em construção...
        </div>
      </section>
    </main>
  );
}