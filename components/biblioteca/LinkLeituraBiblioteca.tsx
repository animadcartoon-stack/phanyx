"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { prepararBibliotecaPdf } from "@/lib/biblioteca-pdf-client";

function preparar() { void prepararBibliotecaPdf().catch(() => {}); }

function abrir() {
  if ((window.matchMedia("(pointer: coarse)").matches || window.innerWidth <= 900) &&
      !document.fullscreenElement && document.documentElement.requestFullscreen) {
    // A chamada fica no clique, quando o navegador permite entrar em tela cheia.
    void document.documentElement.requestFullscreen().catch(() => {});
  }
}

export default function LinkLeituraBiblioteca({ href, className, children }: {
  href: string; className: string; children: ReactNode;
}) {
  useEffect(() => {
    const idle = window.requestIdleCallback;
    if (typeof idle === "function") {
      const id = window.requestIdleCallback(preparar, { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(preparar, 200);
    return () => window.clearTimeout(id);
  }, []);
  return <Link href={href} className={className} onPointerEnter={preparar} onFocus={preparar} onPointerDown={preparar} onClick={abrir}>
    {children}
  </Link>;
}
