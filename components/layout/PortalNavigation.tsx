"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function PortalNavigation({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  const t = useTranslations("Common");
  const pathname = usePathname();
  const panelId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div
      className="min-w-0 lg:contents"
      onKeyDown={(event) => {
        if (open && event.key === "Escape" && !event.defaultPrevented) {
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950 lg:contents">
        <button
          ref={trigger}
          type="button"
          aria-controls={panelId}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 text-start text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 motion-reduce:transition-none lg:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
          {t("portalMenu")}
        </button>
        {actions}
      </div>

      <div
        id={panelId}
        data-portal-navigation-panel
        className={`${open ? "block" : "hidden"} max-h-[60dvh] overflow-y-auto overscroll-contain border-b border-slate-200 dark:border-slate-800 lg:contents`}
        onClick={(event) => {
          if (open && event.target instanceof Element && event.target.closest("a[href]")) setOpen(false);
        }}
      >
        {children}
      </div>
    </div>
  );
}
