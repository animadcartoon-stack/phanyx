"use client";

type Props = {
  imagem: string;
  aberto: boolean;
  onClose: () => void;
  onAplicar: (novaImagem: string) => void;
};

export default function CropImageModal({
  imagem,
  aberto,
  onClose,
  onAplicar,
}: Props) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 text-white">
      <div className="w-full max-w-5xl rounded-3xl border border-cyan-400/30 bg-slate-950 p-5">
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

        <div className="flex min-h-[520px] items-center justify-center rounded-2xl bg-slate-900 p-4">
          <img
            src={imagem}
            alt="Imagem para cortar"
            className="max-h-[500px] max-w-full object-contain"
          />
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
            onClick={() => onAplicar(imagem)}
            className="rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950"
          >
            Aplicar corte
          </button>
        </div>
      </div>
    </div>
  );
}