"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  imagem: string;
  aberto: boolean;
  onClose: () => void;
  onAplicar: (novaImagem: string) => void;
};

type Crop = {
  x: number;
  y: number;
  largura: number;
  altura: number;
};

type Acao = "mover" | "resize";

export default function CropImageModal({
  imagem,
  aberto,
  onClose,
  onAplicar,
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const toquePinchRef = useRef<{ distancia: number; zoom: number } | null>(null);

  const [crop, setCrop] = useState<Crop>({
    x: 60,
    y: 40,
    largura: 320,
    altura: 320,
  });

  const [acao, setAcao] = useState<Acao | null>(null);
  const [inicio, setInicio] = useState({ x: 0, y: 0 });
  const [cropInicial, setCropInicial] = useState<Crop>(crop);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (aberto) {
      setZoom(1);
      setCrop({
        x: 60,
        y: 40,
        largura: 320,
        altura: 320,
      });
    }
  }, [aberto, imagem]);

  if (!aberto) return null;

  function limitarCrop(novo: Crop) {
    const img = imgRef.current;
    if (!img) return novo;

    const rect = img.getBoundingClientRect();

    const largura = Math.min(Math.max(80, novo.largura), rect.width);
    const altura = Math.min(Math.max(80, novo.altura), rect.height);

    const x = Math.min(Math.max(0, novo.x), rect.width - largura);
    const y = Math.min(Math.max(0, novo.y), rect.height - altura);

    return { x, y, largura, altura };
  }

  function aplicarCorte() {
  const img = imgRef.current;
  if (!img) return;

  const larguraRender = img.offsetWidth;
  const alturaRender = img.offsetHeight;

  const escalaX = img.naturalWidth / larguraRender;
  const escalaY = img.naturalHeight / alturaRender;

  const sx = crop.x * escalaX;
  const sy = crop.y * escalaY;
  const sw = crop.largura * escalaX;
  const sh = crop.altura * escalaY;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(
    img,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    canvas.width,
    canvas.height
  );

  onAplicar(canvas.toDataURL("image/png"));
}

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-2 text-white sm:p-4">
      <div className="flex h-full w-full max-w-6xl flex-col rounded-3xl border border-cyan-400/30 bg-slate-950 p-3 sm:h-auto sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-cyan-200 sm:text-2xl">
              Cortar imagem
            </h2>
            <p className="text-xs text-slate-300">
              Arraste a moldura. Use dois dedos para aproximar no celular.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white"
          >
            Fechar
          </button>
        </div>

        <div
          className="relative mx-auto flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden rounded-2xl bg-slate-900 p-2 sm:min-h-[560px] sm:p-4"
          onPointerMove={(e) => {
            if (!acao) return;

            const dx = e.clientX - inicio.x;
            const dy = e.clientY - inicio.y;

            if (acao === "mover") {
              setCrop(
                limitarCrop({
                  ...cropInicial,
                  x: cropInicial.x + dx,
                  y: cropInicial.y + dy,
                })
              );
            }

            if (acao === "resize") {
              setCrop(
                limitarCrop({
                  ...cropInicial,
                  largura: cropInicial.largura + dx,
                  altura: cropInicial.altura + dy,
                })
              );
            }
          }}
          onPointerUp={() => setAcao(null)}
          onPointerLeave={() => setAcao(null)}
          onTouchStart={(e) => {
            if (e.touches.length === 2) {
              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;

              toquePinchRef.current = {
                distancia: Math.hypot(dx, dy),
                zoom,
              };
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 2 && toquePinchRef.current) {
              e.preventDefault();

              const dx = e.touches[0].clientX - e.touches[1].clientX;
              const dy = e.touches[0].clientY - e.touches[1].clientY;
              const novaDistancia = Math.hypot(dx, dy);
              const fator = novaDistancia / toquePinchRef.current.distancia;

              setZoom(
                Math.max(
                  0.7,
                  Math.min(4, Number((toquePinchRef.current.zoom * fator).toFixed(2)))
                )
              );
            }
          }}
          onTouchEnd={() => {
            toquePinchRef.current = null;
          }}
        >
          <div
            className="relative"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center",
            }}
          >
            <img
              ref={imgRef}
              src={imagem}
              alt="Imagem para cortar"
              className="max-h-[65vh] max-w-full object-contain sm:max-h-[540px]"
              draggable={false}
            />

            <div
              className="absolute border-2 border-cyan-300 bg-cyan-300/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.58)]"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.largura,
                height: crop.altura,
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                setAcao("mover");
                setInicio({ x: e.clientX, y: e.clientY });
                setCropInicial(crop);
              }}
            >
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/30" />
                ))}
              </div>

              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setAcao("resize");
                  setInicio({ x: e.clientX, y: e.clientY });
                  setCropInicial(crop);
                }}
                className="absolute -bottom-4 -right-4 h-9 w-9 rounded-full border-2 border-white bg-cyan-400 shadow-lg"
                title="Redimensionar"
              />

              <div className="pointer-events-none absolute -left-2 -top-2 h-4 w-4 rounded-full border-2 border-white bg-cyan-400" />
              <div className="pointer-events-none absolute -right-2 -top-2 h-4 w-4 rounded-full border-2 border-white bg-cyan-400" />
              <div className="pointer-events-none absolute -bottom-2 -left-2 h-4 w-4 rounded-full border-2 border-white bg-cyan-400" />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="rounded-xl border border-white/20 px-5 py-3 font-bold text-white"
          >
            Reset zoom
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/20 px-5 py-3 font-bold text-white"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={aplicarCorte}
            className="rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950"
          >
            Aplicar corte
          </button>
        </div>
      </div>
    </div>
  );
}