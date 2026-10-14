import { getTranslations } from "next-intl/server";
import styles from "./BibliotecaLeitor.module.css";

export default async function CarregandoBiblioteca() {
  const t = await getTranslations("ReaderLibrary");
  return <section className={styles.root} aria-busy="true"><div className={styles.card} role="status">{t("loadingDocument")}</div></section>;
}
