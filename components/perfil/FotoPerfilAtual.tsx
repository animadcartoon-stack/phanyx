"use client";

import { useState } from "react";

/** Exibe o perfil do usuário atual sem enviar a imagem original ao navegador. */
export default function FotoPerfilAtual({ foto, nome }: { foto: string; nome: string }) {
  const [falha, setFalha] = useState<string | null>(null);
  if (falha === foto) {
    return <span role="img" aria-label={nome} className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-700 dark:text-slate-200">{nome.charAt(0).toUpperCase() || "?"}</span>;
  }
  return <img
    src={`/api/funcionario/foto-perfil/imagem?v=${encodeURIComponent(foto)}`}
    alt={nome} width={512} height={512} decoding="async"
    className="h-full w-full object-cover"
    onError={() => setFalha(foto)}
  />;
}
