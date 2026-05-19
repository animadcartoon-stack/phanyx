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

export default function CropImageModal({
  imagem,
  aberto,
  onClose,
  onAplicar,
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>({
    x: 80,
    y: 40,
    largura: 360,
    altura: 420,
  });
  const [arrastando, setArrastando] = useState(false);
  const [redimensionando, setRedimensionando] = useState(false);
  const [inicioMouse, setInicioMouse] = useState({ x: 0, y: 0 });
  const [cropInicial, setCropInicial] = useState(crop);

  useEffect(() => {
    if (aberto) {
      setCrop({
        x: 80,
        y: 40,
        largura: 360,
        altura: 420,
      });
    }
  }, [aberto, imagem]);

  if (!aberto) return null;

  function aplicarCorte() {
    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();

    const escalaX = img.naturalWidth / rect.width;
    const escalaY = img.naturalHeight / rect.height;

    const sx = crop.x * escalaX;
    const sy = crop.y * escalaY;
    const sw = crop.largura * escalaX;
    const sh = crop.altura * escalaY;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    onAplicar(canvas.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 text-white">
      <div className="w-full max-w-6xl rounded-3xl border border-cyan-400/30 bg-slate-950 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-cyan-200">
            Cortar imagem
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-red-500 px-4 py-2 font-black text-white"
          >
            Fechar
          </button>
        </div>

        <div
          className="relative mx-auto flex min-h-[560px] max-w-5xl items-center justify-center overflow-hidden rounded-2xl bg-slate-900 p-4"
          onMouseMove={(e) => {
            if (!arrastando && !redimensionando) return;

            const dx = e.clientX - inicioMouse.x;
            const dy = e.clientY - inicioMouse.y;

            if (arrastando) {
              setCrop({
                ...cropInicial,
                x: Math.max(0, cropInicial.x + dx),
                y: Math.max(0, cropInicial.y + dy),
              });
            }

            if (redimensionando) {
              setCrop({
                ...cropInicial,
                largura: Math.max(80, cropInicial.largura + dx),
                altura: Math.max(80, cropInicial.altura + dy),
              });
            }
          }}
          onMouseUp={() => {
            setArrastando(false);
            setRedimensionando(false);
          }}
          onMouseLeave={() => {
            setArrastando(false);
            setRedimensionando(false);
          }}
        >
          <div className="relative">
            <img
              ref={imgRef}
              src={imagem}
              alt="Imagem para cortar"
              className="max-h-[540px] max-w-full object-contain"
              draggable={false}
            />

            <div
              className="absolute border-2 border-cyan-300 bg-cyan-300/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.largura,
                height: crop.altura,
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                setArrastando(true);
                setInicioMouse({ x: e.clientX, y: e.clientY });
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setRedimensionando(true);
                  setInicioMouse({ x: e.clientX, y: e.clientY });
                  setCropInicial(crop);
                }}
                className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full border-2 border-white bg-cyan-400"
                title="Redimensionar"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
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