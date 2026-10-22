"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";

const telas = [
  ["visao-geral", "overview"], ["acervo", "collection"], ["autoridades", "authorities"],
  ["prateleiras", "shelves"], ["emprestimos", "loans"], ["reservas", "reservations"],
  ["multas", "fines"], ["relatorios", "reports"], ["auditoria", "audit"],
  ["licencas", "licenses"], ["operadores", "operators"], ["configuracoes", "settings"],
] as const;

export default function ApresentacaoBiblioteca() {
  const t = useTranslations("AdminLibraryPresentation");
  const tNav = useTranslations("AdminNavigation");
  const [selecionada, setSelecionada] = useState<(typeof telas)[number]>(telas[0]);
  const [arquivo, chave] = selecionada;
  const imagem = `/images/biblioteca/apresentacao/${arquivo}.webp`;

  return (
    <section aria-labelledby="apresentacao-biblioteca" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <p className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">PHANYX</p>
      <h2 id="apresentacao-biblioteca" className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">{t("title")}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{t("description")}</p>
      <div className="mt-6 flex flex-wrap gap-2" aria-label={t("pagesLabel")}>
        {telas.map((tela) => (
          <button key={tela[0]} type="button" aria-pressed={selecionada[0] === tela[0]} onClick={() => setSelecionada(tela)}
            className={selecionada[0] === tela[0]
              ? "rounded-xl border border-emerald-700 bg-emerald-700 px-3 py-2 text-sm font-bold text-white"
              : "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:bg-emerald-50 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"}>
            {tNav(tela[1])}
          </button>
        ))}
      </div>
      <figure className="mt-5 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
        <figcaption className="border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
          <h3 className="font-bold text-slate-950 dark:text-white">{tNav(chave)}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{t(`pages.${chave}`)}</p>
        </figcaption>
        <a href={imagem} target="_blank" rel="noopener noreferrer" aria-label={t("openPreview", { page: tNav(chave) })} className="block bg-slate-50 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-emerald-600">
          <Image key={arquivo} src={imagem} alt={t("previewAlt", { page: tNav(chave) })} width={1280} height={800}
            sizes="(max-width: 1024px) 100vw, 1100px" className="h-auto w-full" />
        </a>
      </figure>
      <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{t("demoNote")}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{t("planNote")}</p>
    </section>
  );
}
