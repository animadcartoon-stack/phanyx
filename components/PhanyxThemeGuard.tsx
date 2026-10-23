"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { aplicarTemaPhanyx, lerTemaPhanyx } from "@/lib/tema-phanyx";

export default function PhanyxThemeGuard() {
  const pathname = usePathname();

  useEffect(() => {
    const sincronizar = () => aplicarTemaPhanyx(lerTemaPhanyx(), pathname);
    const aoMudarOutraAba = (evento: StorageEvent) => {
      if (!evento.key || evento.key === "phanyx_tema") sincronizar();
    };
    sincronizar();
    window.addEventListener("storage", aoMudarOutraAba);
    return () => window.removeEventListener("storage", aoMudarOutraAba);
  }, [pathname]);

  return null;
}
