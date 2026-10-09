import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { contextoLeitor, listarCatalogo, obterItemCatalogo, type PortalLeitor } from "@/lib/biblioteca-catalogo-leitor";
import FavoritoBiblioteca from "./FavoritoBiblioteca";
import RecomendacoesBiblioteca from "./RecomendacoesBiblioteca";
import styles from "./BibliotecaLeitor.module.css";

function Capa({ url }: { url?: string | null }) {
  return url && (/^https?:\/\//i.test(url) || url.startsWith("/"))
    ? <img src={url} alt="" loading="lazy" /> : <span aria-hidden="true">📖</span>;
}

async function Indisponivel() {
  const t = await getTranslations("ReaderLibrary");
  return <section className={styles.root}><div className={styles.card}><h1>{t("unavailableTitle")}</h1><p>{t("unavailableText")}</p></div></section>;
}

export async function CatalogoLeitor({ portal, searchParams }: { portal: PortalLeitor; searchParams: { q?: string; prateleira?: string; pagina?: string; filtro?: string } }) {
  const t = await getTranslations("ReaderLibrary"); const leitor = await contextoLeitor(portal);
  if (!leitor) return <Indisponivel />;
  const { prateleiras, selecionada, itens, total, pagina, busca, filtro } = await listarCatalogo(leitor, searchParams);
  const base = `/${portal}/biblioteca`;
  function destino(alteracao: Record<string, string>) {
    const query = new URLSearchParams({ ...(busca ? { q: busca } : {}), ...(selecionada ? { prateleira: selecionada.slug } : {}), ...(filtro !== "todos" ? { filtro } : {}), ...alteracao });
    for (const [key, value] of query) if (!value) query.delete(key);
    return `${base}?${query}`;
  }
  return <div className={styles.root}>
    <header className={styles.card}><p className={styles.muted}>{t("eyebrow")}</p><h1>{t("title")}</h1><p>{t("intro")}</p></header>
    <section className={styles.card}>
      <form action={base} method="get" role="search" className={styles.toolbar}>
        {selecionada && <input type="hidden" name="prateleira" value={selecionada.slug} />}
        {filtro !== "todos" && <input type="hidden" name="filtro" value={filtro} />}
        <label htmlFor="busca-biblioteca" className={styles.hidden}>{t("searchLabel")}</label>
        <input id="busca-biblioteca" name="q" defaultValue={busca} maxLength={100} placeholder={t("searchPlaceholder")} style={{ flex: 1, minWidth: 180 }} />
        <button className={`${styles.button} ${styles.primary}`}>{t("search")}</button>
      </form>
      <nav className={styles.toolbar} aria-label={t("myLibrary")}>
        <Link className={styles.button} aria-current={filtro === "todos" ? "page" : undefined} href={destino({ filtro: "" })}>{t("allItems")}</Link>
        {leitor.configuracao?.permitirFavoritos && <Link className={styles.button} aria-current={filtro === "favoritos" ? "page" : undefined} href={destino({ filtro: "favoritos" })}>{t("favorites")}</Link>}
        <Link className={styles.button} aria-current={filtro === "andamento" ? "page" : undefined} href={destino({ filtro: "andamento" })}>{t("continueReading")}</Link>
      </nav>
      {prateleiras.length > 0 && <><h2>{t("shelves")}</h2><div className={styles.toolbar}>
        <Link className={styles.button} aria-current={!selecionada ? "page" : undefined} href={destino({ prateleira: "" })}>{t("allItems")}</Link>
        {prateleiras.map((p) => <Link key={p.id} className={styles.button} aria-current={selecionada?.id === p.id ? "page" : undefined} href={destino({ prateleira: p.slug })}>{p.nome}</Link>)}
      </div>{selecionada?.descricao && <p>{selecionada.descricao}</p>}</>}
    </section>
    <section className={styles.card} aria-labelledby="titulo-acervo">
      <div className={styles.toolbar} style={{ justifyContent: "space-between" }}><h2 id="titulo-acervo">{selecionada?.nome || t("collection")}</h2><p className={styles.muted}>{t("resultCount", { count: total })}</p></div>
      {itens.length ? <div className={styles.grid}>{itens.map((item) => <Link key={item.id} href={`${base}/${encodeURIComponent(item.slug)}`} className={styles.book}>
        <div className={styles.cover}><Capa url={item.miniaturaUrl || item.capaUrl} /></div>
        <div className={styles.bookInfo}><p className={styles.muted}>{t(`types.${item.tipo}`)}</p><h3><strong>{item.titulo}</strong></h3>{item.subtitulo && <p>{item.subtitulo}</p>}<p className={styles.muted}>{item.autores.map((a) => a.autor.nome).join(", ")}</p></div>
      </Link>)}</div> : <p>{t("empty")}</p>}
      {total > 24 && <nav aria-label={t("pagination")} className={styles.toolbar}>
        {pagina > 1 && <Link href={destino({ pagina: String(pagina - 1) })} className={styles.button}>{t("previous")}</Link>}
        <span>{t("pageOf", { page: pagina, total: Math.ceil(total / 24) })}</span>
        {pagina < 10000 && pagina * 24 < total && <Link href={destino({ pagina: String(pagina + 1) })} className={styles.button}>{t("next")}</Link>}
      </nav>}
    </section>
    <RecomendacoesBiblioteca portal={portal} bloqueado={leitor.impersonacao} />
  </div>;
}

export async function DetalheCatalogoLeitor({ portal, slug }: { portal: PortalLeitor; slug: string }) {
  const t = await getTranslations("ReaderLibrary"); const leitor = await contextoLeitor(portal);
  if (!leitor) return <Indisponivel />;
  const item = await obterItemCatalogo(leitor, slug); const base = `/${portal}/biblioteca`;
  return <article className={styles.root}>
    <div className={styles.toolbar}><Link className={styles.button} href={base}>{t("back")}</Link></div>
    <div className={`${styles.card} ${styles.detail}`}>
      <div>{item.capaUrl || item.miniaturaUrl ? <img src={item.capaUrl || item.miniaturaUrl!} className={styles.detailCover} alt="" /> : <div className={styles.detailCover}><Capa /></div>}</div>
      <div><p className={styles.muted}>{t(`types.${item.tipo}`)}</p><h1>{item.titulo}</h1>
        {item.subtitulo && <p>{item.subtitulo}</p>}
        {!!item.autores.length && <p>{t("authors")}: {item.autores.map((a) => a.autor.nome).join(", ")}</p>}
        <div className={styles.toolbar}>{leitor.configuracao?.permitirFavoritos && <FavoritoBiblioteca itemId={item.id} inicial={item.favorito} bloqueado={leitor.impersonacao} />}</div>
        {item.sinopse && <p style={{ whiteSpace: "pre-line" }}>{item.sinopse}</p>}{item.descricao && <p style={{ whiteSpace: "pre-line" }}>{item.descricao}</p>}
        <dl className={styles.formGrid} style={{ marginTop: 16 }}>
          {item.editora && <div><dt>{t("publisher")}</dt><dd>{item.editora.nome}</dd></div>}
          {item.anoPublicacao && <div><dt>{t("year")}</dt><dd>{item.anoPublicacao}</dd></div>}
          {item.numeroPaginas && <div><dt>{t("pages")}</dt><dd>{item.numeroPaginas}</dd></div>}
          {(item.isbn13 || item.isbn10) && <div><dt>ISBN</dt><dd>{item.isbn13 || item.isbn10}</dd></div>}
          {item.issn && <div><dt>ISSN</dt><dd>{item.issn}</dd></div>}
          {!!item.categorias.length && <div><dt>{t("categories")}</dt><dd>{item.categorias.map((c) => c.categoria.nome).join(", ")}</dd></div>}
        </dl>
        <p className={styles.notice}>{item.pdfLeituraId ? t("pdfAvailable") : item.linkExterno ? t("externalAvailable") : item.exemplaresDisponiveis > 0 ? t("physicalAvailable", { count: item.exemplaresDisponiveis }) : t("consultLibrary")}</p>
        {(item.pdfLeituraId || item.pdfArquivoId || item.linkExterno) && <aside className={styles.notice} aria-label={t("rightsTitle")}><h2>{t("rightsTitle")}</h2><p>{t("rightsNotice")}</p></aside>}
        <div className={styles.toolbar}>
          {item.pdfLeituraId && <Link href={`${base}/${encodeURIComponent(slug)}/ler`} className={`${styles.button} ${styles.primary}`}>{t(item.progresso?.paginaAtual ? "resumeReading" : "readOnline")}</Link>}
          {item.linkExterno && <a href={item.linkExterno} target="_blank" rel="noopener noreferrer" className={styles.button}>{t("openExternal")}</a>}
          {item.pdfArquivoId && <a href={`/api/biblioteca/arquivos/${item.pdfArquivoId}/download`} className={styles.button}>{t("downloadPdf")}</a>}
        </div>
        {item.progresso && <p className={styles.muted}>{t("readingPosition", { page: item.progresso.paginaAtual || 1, total: item.progresso.totalPaginas || 1, percent: item.progresso.percentual })}</p>}
        {item.pdfArquivoId && <p className={styles.muted}>{t("downloadResponsibility")}</p>}
      </div>
    </div>
    <RecomendacoesBiblioteca portal={portal} itemId={item.id} bloqueado={leitor.impersonacao} />
  </article>;
}
