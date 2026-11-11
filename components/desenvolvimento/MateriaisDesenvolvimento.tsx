import { useState } from "react";
import LeitorPdfDocumento from "@/components/documentos-docentes/LeitorPdfDocumento";
import { useLocale } from "next-intl";
import { textosMateriaisDesenvolvimento } from "@/lib/desenvolvimento-i18n";
import { type AnexoDesenvolvimento, validarLinksDesenvolvimento } from "@/lib/desenvolvimento-materiais";

export default function MateriaisDesenvolvimento({ anexos, links, onRemover, ocupado = false }: {
  anexos: AnexoDesenvolvimento[];
  links?: unknown;
  onRemover?: (id: number) => void;
  ocupado?: boolean;
}) {
  const [pdfAberto, setPdfAberto] = useState<number | null>(null);
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const t = textosMateriaisDesenvolvimento(useLocale());
  const pdf = anexos.find(anexo => anexo.id === pdfAberto && anexo.mime === "application/pdf");
  const enderecos = validarLinksDesenvolvimento(links) ?? [];
  if (!anexos.length && !enderecos.length) return null;

  return (
    <section className="space-y-2">
      <h4 className="text-sm font-semibold">{t.materiais}</h4>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {anexos.map(anexo => {
          const url = `/api/desenvolvimento/imagens/${anexo.id}`;
          return (
            <li key={anexo.id} className="min-w-0 space-y-1">
              {anexo.mime.startsWith("image/") && (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {/* Imagens privadas dependem do cookie da sessão e são servidas no próprio portal. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img loading="lazy" src={url} alt={anexo.nomeOriginal} className="aspect-video w-full rounded-lg bg-slate-100 object-contain dark:bg-slate-900" />
                </a>
              )}
              {anexo.mime.startsWith("video/") && (
                <video controls playsInline preload="none" src={url} aria-label={anexo.nomeOriginal}
                  className="aspect-video w-full rounded-lg bg-slate-950" />
              )}
              <a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-blue-700 underline dark:text-blue-300">
                {anexo.nomeOriginal}
              </a>
              {anexo.mime === "application/pdf" && (
                <button type="button" aria-expanded={pdfAberto === anexo.id} onClick={() => setPdfAberto(pdfAberto === anexo.id ? null : anexo.id)}
                  className="ml-2 text-sm font-medium text-blue-700 underline dark:text-blue-300">
                  {pdfAberto === anexo.id ? t.fecharPdf : t.verPdf}
                </button>
              )}
              {onRemover && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {confirmando === anexo.id ? <>
                    <button type="button" disabled={ocupado} className="text-red-700 underline dark:text-red-300" onClick={() => {
                      onRemover(anexo.id);
                      setConfirmando(null);
                    }}>{t.confirmar}</button>
                    <button type="button" className="underline" onClick={() => setConfirmando(null)}>{t.cancelar}</button>
                  </> : (
                    <button type="button" disabled={ocupado} className="underline disabled:opacity-50" onClick={() => setConfirmando(anexo.id)}>
                      {t.remover}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {enderecos.map(url => (
          <li key={url} className="min-w-0">
            <a href={url} target="_blank" rel="noopener noreferrer" className="block break-all text-sm text-blue-700 underline dark:text-blue-300">
              {url}
            </a>
          </li>
        ))}
      </ul>
      {pdf && <LeitorPdfDocumento key={pdf.id} url={`/api/desenvolvimento/imagens/${pdf.id}`} />}
    </section>
  );
}
