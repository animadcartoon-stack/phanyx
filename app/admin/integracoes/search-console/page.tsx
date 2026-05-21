"use client";

export default function SearchConsolePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          🔎 Google Search Console
        </h1>
        <p className="mt-2 text-slate-600">
          Configure a verificação do Search Console da sua instituição.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Meta tag de verificação
          </label>

          <input
            disabled
            placeholder='Ex: <meta name="google-site-verification" content="..." />'
            className="w-full rounded-xl border px-4 py-3 text-lg text-slate-400"
          />

          <p className="mt-2 text-sm text-slate-500">
            Em breve cada instituição poderá informar sua própria verificação do Google Search Console.
          </p>
        </div>

        <label className="flex cursor-not-allowed items-center gap-3 rounded-xl border p-4 opacity-60">
          <input type="checkbox" disabled />
          <span className="font-semibold text-slate-800">
            Ativar Search Console nesta instituição
          </span>
        </label>

        <button
          disabled
          className="rounded-xl bg-slate-300 px-6 py-3 font-bold text-white"
        >
          Em breve
        </button>
      </div>
    </div>
  );
}