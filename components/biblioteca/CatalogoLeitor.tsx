import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { contextoLeitor, listarCatalogo, obterItemCatalogo, type PortalLeitor } from "@/lib/biblioteca-catalogo-leitor";

const caixa = "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900";
const texto = "text-slate-700 dark:text-slate-200";

function capa(url: string | null | undefined) {
  return url && (/^https?:\/\//i.test(url) || url.startsWith("/")) ? (
    <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
  ) : (
    <div aria-hidden="true" className="flex h-full items-center justify-center bg-slate-200 text-4xl dark:bg-slate-700">📖</div>
  );
}

export async function CatalogoLeitor({ portal, searchParams }: { portal: PortalLeitor; searchParams: { q?: string; prateleira?: string; pagina?: string } }) {
  const t = await getTranslations("ReaderLibrary");
  const leitor = await contextoLeitor(portal);
  if (!leitor) return <section className={`${caixa} p-8`}><h1 className="text-2xl font-bold text-slate-950 dark:text-white">{t("unavailableTitle")}</h1><p className={`mt-2 ${texto}`}>{t("unavailableText")}</p></section>;

  const { prateleiras, selecionada, itens, total, pagina, busca } = await listarCatalogo(leitor, searchParams);
  const base = `/${portal}/biblioteca`;
  const destino = (paginaDestino: number) => {
    const query = new URLSearchParams();
    if (busca) query.set("q", busca);
    if (selecionada) query.set("prateleira", selecionada.slug);
    if (paginaDestino > 1) query.set("pagina", String(paginaDestino));
    return `${base}?${query.toString()}`;
  };

  return <div className="mx-auto max-w-7xl space-y-6 text-slate-950 dark:text-white">
    <header className={`${caixa} p-6 sm:p-8`}>
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">{t("eyebrow")}</p>
      <h1 className="mt-2 text-3xl font-bold">{t("title")}</h1>
      <p className={`mt-2 ${texto}`}>{t("intro")}</p>
    </header>

    <form action={base} method="get" role="search" className={`${caixa} flex flex-wrap gap-3 p-4`}>
      {selecionada && <input type="hidden" name="prateleira" value={selecionada.slug} />}
      <label htmlFor="busca-biblioteca" className="sr-only">{t("searchLabel")}</label>
      <input id="busca-biblioteca" name="q" defaultValue={busca} maxLength={100} placeholder={t("searchPlaceholder")} className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-950 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
      <button type="submit" className="rounded-xl bg-slate-900 px-5 py-2 font-semibold text-white dark:bg-slate-100 dark:text-slate-950">{t("search")}</button>
    </form>

    {prateleiras.length > 0 && <section aria-labelledby="titulo-prateleiras">
      <h2 id="titulo-prateleiras" className="mb-3 text-xl font-bold">{t("shelves")}</h2>
      <div className="flex flex-wrap gap-2">
        <Link href={`${base}${busca ? `?q=${encodeURIComponent(busca)}` : ""}`} aria-current={!selecionada ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-semibold ${!selecionada ? "border-slate-950 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950" : "border-slate-300 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-white"}`}>{t("allItems")}</Link>
        {prateleiras.map((p) => <Link key={p.id} href={`${base}?${new URLSearchParams({ ...(busca ? { q: busca } : {}), prateleira: p.slug })}`} aria-current={selecionada?.id === p.id ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-semibold ${selecionada?.id === p.id ? "border-slate-950 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950" : "border-slate-300 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-white"}`}>{p.nome}</Link>)}
      </div>
      {selecionada?.descricao && <p className={`mt-3 ${texto}`}>{selecionada.descricao}</p>}
    </section>}

    <section aria-labelledby="titulo-acervo">
      <div className="mb-3 flex items-end justify-between gap-3"><h2 id="titulo-acervo" className="text-xl font-bold">{selecionada?.nome || t("collection")}</h2><p className={`text-sm ${texto}`}>{t("resultCount", { count: total })}</p></div>
      {itens.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {itens.map((item) => <Link key={item.id} href={`${base}/${encodeURIComponent(item.slug)}`} className={`${caixa} group flex min-h-44 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white`}>
          <div className="w-28 shrink-0 sm:w-32">{capa(item.miniaturaUrl || item.capaUrl)}</div>
          <div className="min-w-0 p-4"><p className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">{t(`types.${item.tipo}`)}</p><h3 className="mt-2 font-bold group-hover:underline">{item.titulo}</h3>{item.subtitulo && <p className={`mt-1 text-sm ${texto}`}>{item.subtitulo}</p>}<p className={`mt-3 text-sm ${texto}`}>{item.autores.map((a) => a.autor.nome).join(", ")}</p></div>
        </Link>)}
      </div> : <p className={`${caixa} p-8 text-center ${texto}`}>{t("empty")}</p>}
      {total > 24 && <nav aria-label={t("pagination")} className="mt-6 flex items-center justify-center gap-4">
        {pagina > 1 && <Link href={destino(pagina - 1)} className={`${caixa} px-4 py-2 font-semibold`}>{t("previous")}</Link>}
        <span>{t("pageOf", { page: pagina, total: Math.ceil(total / 24) })}</span>
        {pagina < 10000 && pagina * 24 < total && <Link href={destino(pagina + 1)} className={`${caixa} px-4 py-2 font-semibold`}>{t("next")}</Link>}
      </nav>}
    </section>
  </div>;
}

export async function DetalheCatalogoLeitor({ portal, slug }: { portal: PortalLeitor; slug: string }) {
  const t = await getTranslations("ReaderLibrary");
  const leitor = await contextoLeitor(portal);
  if (!leitor) return <section className={`${caixa} p-8`}><h1 className="text-2xl font-bold text-slate-950 dark:text-white">{t("unavailableTitle")}</h1><p className={`mt-2 ${texto}`}>{t("unavailableText")}</p></section>;
  const item = await obterItemCatalogo(leitor, slug);
  return <article className="mx-auto max-w-5xl space-y-5 text-slate-950 dark:text-white">
    <Link href={`/${portal}/biblioteca`} className="inline-block font-semibold underline underline-offset-4">{t("back")}</Link>
    <div className={`${caixa} overflow-hidden md:flex`}>
      <div className="h-72 md:h-auto md:w-64 md:shrink-0">{capa(item.capaUrl || item.miniaturaUrl)}</div>
      <div className="min-w-0 space-y-4 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase text-slate-600 dark:text-slate-300">{t(`types.${item.tipo}`)}</p>
        <h1 className="text-3xl font-bold">{item.titulo}</h1>
        {item.subtitulo && <p className={`text-lg ${texto}`}>{item.subtitulo}</p>}
        {item.autores.length > 0 && <p className={texto}>{t("authors")}: {item.autores.map((a) => a.autor.nome).join(", ")}</p>}
        {item.sinopse && <p className={`whitespace-pre-line leading-relaxed ${texto}`}>{item.sinopse}</p>}
        {item.descricao && <p className={`whitespace-pre-line leading-relaxed ${texto}`}>{item.descricao}</p>}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {item.editora && <div><dt className="font-semibold">{t("publisher")}</dt><dd>{item.editora.nome}</dd></div>}
          {item.anoPublicacao && <div><dt className="font-semibold">{t("year")}</dt><dd>{item.anoPublicacao}</dd></div>}
          {item.numeroPaginas && <div><dt className="font-semibold">{t("pages")}</dt><dd>{item.numeroPaginas}</dd></div>}
          {item.isbn13 && <div><dt className="font-semibold">ISBN</dt><dd>{item.isbn13}</dd></div>}
          {item.issn && <div><dt className="font-semibold">ISSN</dt><dd>{item.issn}</dd></div>}
          {item.categorias.length > 0 && <div><dt className="font-semibold">{t("categories")}</dt><dd>{item.categorias.map((c) => c.categoria.nome).join(", ")}</dd></div>}
        </dl>
        <p className="rounded-xl bg-slate-100 p-3 text-sm font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-100">{item.linkExterno ? t("externalAvailable") : item.pdfArquivoId ? t("pdfAvailable") : item.exemplaresDisponiveis > 0 ? t("physicalAvailable", { count: item.exemplaresDisponiveis }) : item.acessoDisponivel ? t("digitalCatalogued") : t("consultLibrary")}</p>
        {item.linkExterno && <a href={item.linkExterno} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-950">{t("openExternal")}</a>}
        {item.pdfArquivoId && <>
          <aside className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-slate-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-slate-100" aria-label={t("rightsTitle")}>
            <h2 className="font-bold">{t("rightsTitle")}</h2>
            <p className="mt-2 leading-relaxed">{t("rightsNotice")}</p>
            <p className="mt-2">{t("downloadResponsibility")}</p>
          </aside>
          <a href={`/api/biblioteca/arquivos/${item.pdfArquivoId}/download`} className="inline-flex rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-950">{t("downloadPdf")}</a>
        </>}
      </div>
    </div>
  </article>;
}
