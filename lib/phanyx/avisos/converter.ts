import type { AvisoInteligente } from "@/lib/phanyx/avisos-inteligentes";
import type { AvisoPhanyx } from "@/lib/phanyx/avisos/types";

function slug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function converterAvisoInteligente(
  aviso: AvisoInteligente
): AvisoPhanyx {
  return {
    id: `campanha-${slug(aviso.titulo)}`,
    origem: "CAMPANHA",
    prioridade: aviso.prioridade,
    publico: ["TODOS"],
    titulo: aviso.titulo,
    descricao: aviso.descricao,
    frase: aviso.frase,
    icone: aviso.icone,
    categoria: aviso.categoria,
    cor: aviso.cor,
    textoBotao: aviso.textoBotao,
    link: aviso.link,
  };
}