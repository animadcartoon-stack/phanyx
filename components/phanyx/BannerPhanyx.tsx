"use client";

export type BannerPhanyxCor =
  | "cinza"
  | "azul"
  | "preto"
  | "rosa"
  | "amarelo"
  | "verde"
  | "laranja"
  | "vermelho"
  | "roxo";

export type BannerPhanyxAviso = {
  id?: string;
  titulo: string;
  descricao: string;
  frase?: string;
  icone: string;
  categoria: string;
  cor: BannerPhanyxCor;
  prioridade?: number;
  publico?: ("ADMIN" | "FUNCIONARIO" | "PROFESSOR" | "ALUNO" | "TODOS")[];
  textoBotao?: string;
  link?: string;
  onClickBotao?: () => void;
  onFechar?: () => void;
  expiracao?: Date;
};

type Props = {
  aviso: BannerPhanyxAviso;
  variant?: "dashboard" | "compacta";
};

export default function BannerPhanyx({
  aviso,
  variant = "dashboard",
}: Props) {
  const cores: Record<BannerPhanyxCor, string> = {
    rosa:
      "border-pink-300 bg-pink-50 text-pink-950 dark:border-pink-400/40 dark:bg-pink-500/10 dark:text-pink-100",
    azul:
      "border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-400/40 dark:bg-blue-500/10 dark:text-blue-100",
    verde:
      "border-green-300 bg-green-50 text-green-950 dark:border-green-400/40 dark:bg-green-500/10 dark:text-green-100",
    amarelo:
      "border-yellow-300 bg-yellow-50 text-yellow-950 dark:border-yellow-400/40 dark:bg-yellow-500/10 dark:text-yellow-100",
    vermelho:
      "border-red-300 bg-red-50 text-red-950 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-100",
    laranja:
      "border-orange-300 bg-orange-50 text-orange-950 dark:border-orange-400/40 dark:bg-orange-500/10 dark:text-orange-100",
    roxo:
      "border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-400/40 dark:bg-violet-500/10 dark:text-violet-100",
    cinza:
      "border-slate-300 bg-slate-50 text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100",
    preto:
      "border-slate-400 bg-slate-100 text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100",
  };

  return (
  <div
    className={`relative overflow-hidden rounded-2xl border bg-white text-slate-950 shadow-sm transition-all dark:bg-slate-950 dark:text-slate-100 ${
      cores[aviso.cor] ?? cores.roxo
    }`}
  >
    <div className="absolute left-0 top-0 h-full w-2 bg-current opacity-80" />

    {aviso.onFechar && (
      <button
        type="button"
        onClick={aviso.onFechar}
        className="absolute right-3 top-3 rounded-full p-1 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus:ring-white/30"
        aria-label="Fechar aviso"
      >
        <span className="text-sm font-bold">✕</span>
      </button>
    )}

    <div className="flex items-center gap-4 px-5 py-4 pl-7 pr-10">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-3xl shadow-sm dark:bg-white/10">
        {aviso.icone}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          PHANYX informa
        </p>

        <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
          {aviso.titulo}
        </h2>

        <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-white/10 dark:text-slate-200">
          {aviso.categoria}
        </div>

        <div className="mt-2 space-y-2">
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {aviso.descricao}
          </p>

          {aviso.frase && (
            <p className="text-sm font-medium italic text-slate-800 dark:text-slate-100">
              "{aviso.frase}"
            </p>
          )}
        </div>

        {aviso.textoBotao && (
          <div className="mt-4">
            {aviso.link ? (
              <a
                href={aviso.link}
                className="inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02] hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {aviso.textoBotao} →
              </a>
            ) : (
              <button
                type="button"
                onClick={aviso.onClickBotao}
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:scale-[1.02] hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {aviso.textoBotao} →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);
}