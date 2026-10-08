"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Dados = {
  registrosImportados: unknown;
  imagensImportadas: Array<{ referencia: string; descricao: string; url: string | null; erro?: string }> | null;
};

export default function CatalogacaoDadosImportados({ itemId }: { itemId: number }) {
  const t = useTranslations("AdminLibraryImport.preservation");
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);
  async function carregar() {
    if (dados || carregando) return;
    setCarregando(true); setErro(false);
    try {
      const resposta = await fetch(`/api/admin/biblioteca/acervo/${itemId}/dados-importados`, { cache: "no-store" });
      const json = await resposta.json();
      if (!resposta.ok || !json.ok) throw new Error();
      setDados(json.item);
    } catch { setErro(true); }
    finally { setCarregando(false); }
  }
  return (
    <details className="bib-card bib-detail-section" onToggle={evento => { if (evento.currentTarget.open) void carregar(); }}>
      <summary className="cursor-pointer font-bold">{t("title")}</summary>
      {carregando ? <p>{t("loading")}</p> : null}
      {erro ? <p role="status">{t("error")}</p> : null}
      {dados ? <div className="mt-4 space-y-4">
        <p>{t("notice")}</p>
        {Array.isArray(dados.registrosImportados) && dados.registrosImportados.length ? <>
          <p>{t("records")}: {dados.registrosImportados.length}</p>
          <a className="underline" href={`/api/admin/biblioteca/acervo/${itemId}/dados-importados`} download={`obra-${itemId}-dados-importados.json`}>{t("downloadData")}</a>
        </> : <p>{t("empty")}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          {(dados.imagensImportadas ?? []).map((imagem, indice) => <figure key={`${imagem.referencia}-${indice}`}>
            {imagem.url ? <a href={imagem.url} target="_blank" rel="noreferrer">
              {/* Migrated image files are served by PHANYX storage. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagem.url} alt={imagem.descricao || t("images")} loading="lazy" className="max-h-64 w-full rounded-lg object-contain" />
            </a> : null}
            <figcaption className="mt-2 break-words text-sm">{imagem.descricao || imagem.referencia.slice(0, 160)}{imagem.erro ? ` — ${imagem.erro}` : ""}</figcaption>
          </figure>)}
        </div>
      </div> : null}
    </details>
  );
}
