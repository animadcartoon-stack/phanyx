"use client";

import { createContext, isValidElement, useContext, useMemo, useRef, type ReactNode } from "react";

type ImagemForma = { href: string; x: number; y: number; largura: number; altura: number };
type Medidas = { largura: number; altura: number; path: string; espessura: number };
const escapar = (valor: unknown) => String(valor).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const atributos: Record<string, string> = { className: "class", fillOpacity: "fill-opacity", strokeOpacity: "stroke-opacity", strokeWidth: "stroke-width", strokeLinejoin: "stroke-linejoin", strokeLinecap: "stroke-linecap", vectorEffect: "vector-effect", clipPath: "clip-path" };
const tags = new Set(["defs", "clipPath", "mask", "path", "rect", "g"]);
function svgDoNo(no: ReactNode): string {
  if (no === null || no === undefined || typeof no === "boolean") return "";
  if (Array.isArray(no)) return no.map(svgDoNo).join("");
  if (!isValidElement(no)) return "";
  const propriedades = no.props as { children?: ReactNode; [nome: string]: unknown };
  const filhos = svgDoNo(propriedades.children);
  if (typeof no.type !== "string") return filhos;
  if (!tags.has(no.type)) return "";
  const attrs = Object.entries(propriedades).filter(([nome, valor]) => nome !== "children" && nome !== "style" && nome !== "ref" && nome !== "key" && !nome.startsWith("on") && valor !== null && valor !== undefined)
    .map(([nome, valor]) => ` ${atributos[nome] || nome}="${escapar(valor)}"`).join("");
  return `<${no.type}${attrs}>${filhos}</${no.type}>`;
}
function criarBanco() {
  const imagens = new Map<string, ImagemForma>();
  return {
    obter(chave: string, medidas: Medidas, criar: (id: string) => ReactNode) {
      const existente = imagens.get(chave);
      if (existente) { imagens.delete(chave); imagens.set(chave, existente); return existente; }
      // Inclui controles Bezier e uma margem de contorno para nao cortar as bordas.
      const numeros = (medidas.path.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi) || []).map(Number);
      const xs = numeros.filter((_, i) => i % 2 === 0), ys = numeros.filter((_, i) => i % 2 === 1);
      const escalaX = Math.max(.01, medidas.largura) / 100, escalaY = Math.max(.01, medidas.altura) / 100;
      const margem = Math.ceil(medidas.espessura) + 2;
      const esquerda = Math.floor(xs.reduce((min, valor) => Math.min(min, valor), 0) * escalaX) - margem;
      const topo = Math.floor(ys.reduce((min, valor) => Math.min(min, valor), 0) * escalaY) - margem;
      const direita = Math.ceil(xs.reduce((max, valor) => Math.max(max, valor), 100) * escalaX) + margem;
      const baixo = Math.ceil(ys.reduce((max, valor) => Math.max(max, valor), 100) * escalaY) + margem;
      const x = esquerda / escalaX, y = topo / escalaY;
      const largura = (direita - esquerda) / escalaX, altura = (baixo - topo) / escalaY;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${direita - esquerda}" height="${baixo - topo}" viewBox="${x} ${y} ${largura} ${altura}" preserveAspectRatio="none">${svgDoNo(criar("corpo"))}</svg>`;
      const imagem = { href: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg), x, y, largura, altura };
      imagens.set(chave, imagem);
      // A cena nunca acumula todas as variantes de zoom ou edicoes anteriores.
      if (imagens.size > 256) imagens.delete(imagens.keys().next().value!);
      return imagem;
    },
  };
}
const Contexto = createContext<(ReturnType<typeof criarBanco> & { escala: number }) | null>(null);
export const useBancoSvgFormas = () => useContext(Contexto);

// Apenas o editor usa imagens vetoriais em cache. Selecionar devolve os caminhos
// editaveis; previa e PDF continuam desenhando os vetores originais.
export default function BancoSvgFormas({ children, escala = 1 }: { children: ReactNode; escala?: number }) {
  const bancoRef = useRef<ReturnType<typeof criarBanco> | null>(null);
  if (!bancoRef.current) bancoRef.current = criarBanco();
  const banco = bancoRef.current;
  const valor = useMemo(() => ({ ...banco, escala }), [banco, escala]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
