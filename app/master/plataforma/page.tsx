import Link from "next/link";

export default function EscalabilidadePhanyxPage() {
  const itens = [
    ["✓", "Discursiva não salva por tecla"],
    ["✓", "Índices de prova"],
    ["✓", "Índices de respostas"],
    ["✓", "Índices de tentativas"],
    ["✓", "Índices de notas"],
    ["✓", "Revisão iniciar prova"],
    ["✓", "Revisão finalizar prova"],
    ["", "Revisão chat"],
    ["", "Revisão notificações"],
    ["", "Revisão uploads"],
    ["", "Revisão certificados"],
    ["", "Revisão histórico acadêmico"],
    ["", "Teste de carga 100 usuários"],
    ["", "Teste de carga 500 usuários"],
    ["", "Teste de carga 1000 usuários"],
    ["", "Teste de carga 3000 usuários"],
  ];

  return (
    <div className="min-h-screen space-y-6 bg-slate-100 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
      <Link
  href="/admin"
  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
>
  ← Voltar para Admin
</Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700 dark:text-sky-300">
          PHANYX Enterprise
        </p>

        <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
          Escalabilidade PHANYX V1
        </h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Checklist técnico para preparar o PHANYX para alto volume de instituições,
          alunos simultâneos, provas, documentos, notificações e operações críticas.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Checklist de estabilidade
        </h2>

        <div className="mt-5 grid gap-3">
          {itens.map(([status, texto]) => (
            <div
              key={texto}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950"
            >
              <span
                className={
                  status
                    ? "flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-black text-green-700"
                    : "flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-400 dark:bg-slate-800"
                }
              >
                {status || "•"}
              </span>

              <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                {texto}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}