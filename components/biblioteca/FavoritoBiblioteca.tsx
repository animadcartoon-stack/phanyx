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
    <button type="button" className={styles.button} aria-pressed={favorito} disabled={salvando || bloqueado} onClick={salvar}>
      <span aria-hidden="true">{favorito ? "★" : "☆"}</span>{t(favorito ? "removeFavorite" : "addFavorite")}
    </button>
    {erro && <PhanyxToast tipo="erro" mensagem={t("saveError")} onClose={() => setErro(false)} />}
  </>;
}
