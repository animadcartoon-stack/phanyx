"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import PhanyxToast from "@/components/ui/PhanyxToast";
import styles from "./BibliotecaLeitor.module.css";

export default function FavoritoBiblioteca({ itemId, inicial, bloqueado = false }: { itemId: number; inicial: boolean; bloqueado?: boolean }) {
  const t = useTranslations("ReaderLibrary"); const router = useRouter();
  const [favorito, setFavorito] = useState(inicial); const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(false);
  async function salvar() {
    setSalvando(true); setErro(false);
    try {
      const response = await fetch(`/api/biblioteca/itens/${itemId}/favorito`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ favorito: !favorito }) });
      if (!response.ok) throw new Error();
      const data = await response.json(); setFavorito(data.favorito); router.refresh();
    } catch { setErro(true); } finally { setSalvando(false); }
  }
  return <>
    <button type="button" className={`${styles.button} ${styles.favoriteButton}`} aria-pressed={favorito} aria-busy={salvando} disabled={salvando || bloqueado} onClick={salvar}>
      <svg className={styles.favoriteIcon} viewBox="0 0 24 24" width="20" height="20" fill={favorito ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
      </svg>{t(favorito ? "removeFavorite" : "addFavorite")}
    </button>
    {erro && <PhanyxToast tipo="erro" mensagem={t("saveError")} onClose={() => setErro(false)} />}
  </>;
}
