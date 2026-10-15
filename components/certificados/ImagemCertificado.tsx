import type { CSSProperties } from "react";

type CampoImagem = {
  largura?: number | null;
  altura?: number | null;
  cropBaseW?: number | null;
  cropBaseH?: number | null;
  crop?: { left?: number; top?: number; right?: number; bottom?: number } | null;
  opacity?: number | null;
  filter?: string | null;
  flipX?: boolean | null;
  flipY?: boolean | null;
  dadosJson?: any;
};

/** A mesma caixa, escala e janela de recorte na edicao e na visualizacao. */
export default function ImagemCertificado({ campo, url }: { campo: CampoImagem; url: string }) {
  const dados = campo.dadosJson || {};
  const crop = campo.crop ?? dados.crop;
  const estilo: CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: 8,
    backgroundImage: `url(${JSON.stringify(url)})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${campo.cropBaseW || dados.cropBaseW || campo.largura || 150}px ${campo.cropBaseH || dados.cropBaseH || campo.altura || 150}px`,
    backgroundPosition: `-${crop?.left || 0}px -${crop?.top || 0}px`,
    opacity: campo.opacity ?? dados.opacity ?? 1,
    filter: campo.filter || dados.filter || "none",
    transform: `scaleX(${(campo.flipX ?? dados.flipX) ? -1 : 1}) scaleY(${(campo.flipY ?? dados.flipY) ? -1 : 1})`,
    pointerEvents: "none",
  };
  return <div data-imagem-certificado="true" style={estilo} />;
}
