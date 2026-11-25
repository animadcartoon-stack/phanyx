"use client";

import { useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { canaisEmailPhanyx } from "@/lib/contatos-phanyx";
import OpcoesEmailPhanyx, { textosEmailPhanyx, type OpcoesEmailPhanyxProps } from "./OpcoesEmailPhanyx";

type ContatoEmailLinkProps = OpcoesEmailPhanyxProps & Pick<ComponentPropsWithoutRef<"a">, "children" | "className" | "aria-label">;

export default function ContatoEmailLink({ canal, assunto, locale = "pt-BR", children, ...props }: ContatoEmailLinkProps) {
  const [aberto, setAberto] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const link = useRef<HTMLAnchorElement>(null);
  const tituloId = useId();
  const t = textosEmailPhanyx(locale);

  useEffect(() => {
    if (aberto) dialogo.current?.showModal();
  }, [aberto]);

  function abrir(event: MouseEvent<HTMLAnchorElement>) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (typeof HTMLDialogElement === "undefined" || !HTMLDialogElement.prototype.showModal) return;
    event.preventDefault();
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
    link.current?.focus();
  }

  return (
    <>
      <a {...props} ref={link} href={canaisEmailPhanyx[canal].pagina} aria-haspopup="dialog" onClick={abrir}>
        {children}
      </a>
      {aberto && createPortal(
        <dialog
          ref={dialogo}
          aria-labelledby={tituloId}
          onClose={fechar}
          className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 id={tituloId} className="text-lg font-bold">{t.titulo}</h2>
            <form method="dialog">
              <button type="submit" className="cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
                {t.fechar}
              </button>
            </form>
          </div>
          <OpcoesEmailPhanyx canal={canal} assunto={assunto} locale={locale} />
        </dialog>,
        document.body,
      )}
    </>
  );
}
