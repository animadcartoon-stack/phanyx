"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function PortalNavigation({ children, actions, preferences }: {
  children: ReactNode;
  actions?: ReactNode;
  preferences?: ReactNode;
}) {
  const t = useTranslations("Common");
  const pathname = usePathname();
  const panelId = useId();
  const titleId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"pages" | "preferences">("pages");

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open || !menu.current) return;

    const dialog = menu.current;
    const desktop = window.matchMedia("(min-width: 64rem)");
    if (desktop.matches) {
      setOpen(false);
      return;
    }

    const fecharNoDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    if (panel.current) panel.current.scrollTop = 0;
    closeButton.current?.focus();
    desktop.addEventListener("change", fecharNoDesktop);

    return () => {
      desktop.removeEventListener("change", fecharNoDesktop);
      dialog.close();
      document.body.style.overflow = overflow;
      if (!desktop.matches) trigger.current?.focus();
    };
  }, [open]);

  function selectView(next: typeof view) {
    setView(next);
    if (panel.current) panel.current.scrollTop = 0;
  }

  const viewClass = "flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-lg px-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-blue-600 aria-pressed:bg-white aria-pressed:text-blue-700 aria-pressed:shadow-sm dark:text-slate-300 dark:hover:bg-slate-700 dark:aria-pressed:bg-slate-700 dark:aria-pressed:text-blue-200";

  return (
    <div className="min-w-0 lg:contents">
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950 lg:contents">
        <button
          ref={trigger}
          type="button"
          aria-controls={panelId}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => { setView("pages"); setOpen(true); }}
          className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-start text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 motion-reduce:transition-none lg:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {t("portalMenu")}
        </button>
        {actions}
      </div>

      <dialog
        ref={menu}
        id={panelId}
        role={open ? undefined : "presentation"}
        aria-labelledby={open ? titleId : undefined}
        data-portal-view={view}
        className="hidden lg:contents max-lg:fixed max-lg:inset-0 max-lg:m-0 max-lg:h-dvh max-lg:max-h-none max-lg:w-full max-lg:max-w-none max-lg:flex-col max-lg:overflow-hidden max-lg:border-0 max-lg:bg-white max-lg:p-0 max-lg:text-slate-950 max-lg:open:flex max-lg:dark:bg-slate-950 max-lg:dark:text-white max-lg:[&[data-portal-view=pages]_[data-portal-preferences]]:hidden max-lg:[&[data-portal-view=preferences]_[data-portal-pages]]:hidden"
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
      >
        <header className="shrink-0 border-b border-slate-200 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] dark:border-slate-800 lg:hidden">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="px-1 text-lg font-bold" id={titleId}>{t("portalMenu")}</h2>
            <button
              ref={closeButton}
              type="button"
              aria-label={t("close")}
              onClick={() => setOpen(false)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button type="button" className={viewClass} aria-pressed={view === "pages"} onClick={() => selectView("pages")}>
              {t("portalPages")}
            </button>
            <button type="button" className={viewClass} aria-pressed={view === "preferences"} onClick={() => selectView("preferences")}>
              {t("portalPreferences")}
            </button>
          </div>
        </header>
        <div
          ref={panel}
          data-portal-navigation-panel
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)] lg:contents"
          onClick={(event) => {
            if (open && event.target instanceof Element && event.target.closest("a[href], [data-close-portal-menu]")) setOpen(false);
          }}
        >
          {children}
          {open && view === "preferences" && preferences && (
            <div className="space-y-4 border-t border-slate-200 p-4 dark:border-slate-800 lg:hidden">
              {preferences}
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
