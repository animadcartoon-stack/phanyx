import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { contextoLeitor, obterItemCatalogo, type PortalLeitor } from "@/lib/biblioteca-catalogo-leitor";
import LeitorPdfBiblioteca from "./LeitorPdfBiblioteca";
import styles from "./BibliotecaLeitor.module.css";

export default async function LeituraBiblioteca({ portal, slug }: { portal: PortalLeitor; slug: string }) {
  const t = await getTranslations("ReaderLibrary"); const leitor = await contextoLeitor(portal);
  if (!leitor) return <section className={styles.root}><div className={styles.card}><h1>{t("unavailableTitle")}</h1><p>{t("unavailableText")}</p></div></section>;
  const item = await obterItemCatalogo(leitor, slug);
  const voltar = `/${portal}/biblioteca/${encodeURIComponent(slug)}`;
  if (!item.pdfLeituraId) return <section className={styles.root}><div className={styles.card}><h1>{item.titulo}</h1><p>{t("readingUnavailable")}</p><Link className={styles.button} href={voltar}>{t("back")}</Link></div></section>;
  return <LeitorPdfBiblioteca arquivoId={item.pdfLeituraId} titulo={item.titulo} voltar={voltar}
    direitos={{ copiarTrecho: item.direitos.copiarTrecho, imprimir: item.direitos.imprimir }}
    downloadId={item.pdfArquivoId} usuarioId={leitor.usuarioId} bloqueado={leitor.impersonacao} />;
}
