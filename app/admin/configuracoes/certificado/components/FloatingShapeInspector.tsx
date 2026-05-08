"use client";

type PontoForma = {
  id: string;
  x: number;
  y: number;
  tipo?: "reto" | "curvo";
  handleMode?: "alinhado" | "quebrado";
  inX?: number;
  inY?: number;
  outX?: number;
  outY?: number;
};

type CampoForma = {
  id: number;
  tipo: string;
  forma?: string | null;
  pontosForma?: PontoForma[] | null;
  preenchimentoCor?: string | null;
  contornoCor?: string | null;
  contornoEspessura?: number | null;
  mostrarPreenchimento?: boolean | null;
  mostrarContorno?: boolean | null;
  opacity?: number | null;
};

type Props = {
  aberto: boolean;
  campo: CampoForma | null;
  posicao: { x: number; y: number };
  onFechar: () => void;
  onMover: (posicao: { x: number; y: number }) => void;
  onAtualizarCampo: (campo: CampoForma) => void;
};

function gerarPontosEstrela(pontas: number, raioInterno = 22, raioExterno = 44): PontoForma[] {
  const total = Math.max(3, pontas) * 2;

  return Array.from({ length: total }).map((_, i) => {
    const externo = i % 2 === 0;
    const angulo = (Math.PI * 2 * i) / total - Math.PI / 2;
    const raio = externo ? raioExterno : raioInterno;

    return {
      id: `p-${Date.now()}-${i}`,
      x: Number((50 + Math.cos(angulo) * raio).toFixed(2)),
      y: Number((50 + Math.sin(angulo) * raio).toFixed(2)),
      tipo: "reto",
    };
  });
}

export default function FloatingShapeInspector({
  aberto,
  campo,
  posicao,
  onFechar,
  onMover,
  onAtualizarCampo,
}: Props) {
  if (!aberto || !campo || campo.tipo !== "FORMA") return null;

  const pontasAtuais = campo.forma === "ESTRELA"
    ? Math.max(3, Math.floor((campo.pontosForma?.length || 10) / 2))
    : 0;

  function iniciarArraste(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    const inicioX = e.clientX;
    const inicioY = e.clientY;
    const original = { ...posicao };

    const mover = (ev: MouseEvent) => {
      onMover({
        x: original.x + ev.clientX - inicioX,
        y: original.y + ev.clientY - inicioY,
      });
    };

    const soltar = () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
    };

    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
  }

  function atualizarPontas(novasPontas: number) {
    if (campo.forma !== "ESTRELA") return;

    onAtualizarCampo({
      ...campo,
      pontosForma: gerarPontosEstrela(novasPontas),
    });
  }

  return (
    <div
      className="fixed z-[9999999] w-[280px] rounded-2xl border border-slate-200 bg-white shadow-2xl"
      style={{
        left: posicao.x,
        top: posicao.y,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        onMouseDown={iniciarArraste}
        className="flex cursor-move items-center justify-between rounded-t-2xl bg-blue-600 px-4 py-3 text-white"
      >
        <strong className="text-sm">Opções da forma</strong>

        <button
          type="button"
          onClick={onFechar}
          className="rounded-full bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 p-4 text-sm text-slate-700">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            Tipo
          </p>
          <div className="rounded-xl border bg-slate-50 px-3 py-2">
            {campo.forma || "Forma"}
          </div>
        </div>

        {campo.forma === "ESTRELA" && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Quantidade de pontas
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => atualizarPontas(Math.max(3, pontasAtuais - 1))}
                className="h-9 w-9 rounded-xl border bg-white font-bold hover:bg-slate-50"
              >
                −
              </button>

              <div className="flex-1 rounded-xl border bg-slate-50 px-3 py-2 text-center font-bold">
                {pontasAtuais}
              </div>

              <button
                type="button"
                onClick={() => atualizarPontas(pontasAtuais + 1)}
                className="h-9 w-9 rounded-xl border bg-white font-bold hover:bg-slate-50"
              >
                +
              </button>
            </div>

            <input
              type="range"
              min={3}
              max={40}
              value={pontasAtuais}
              onChange={(e) => atualizarPontas(Number(e.target.value))}
              className="mt-3 w-full"
            />
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Preenchimento
          </p>

          <input
            type="color"
            value={campo.preenchimentoCor || "#1d4ed8"}
            onChange={(e) =>
              onAtualizarCampo({
                ...campo,
                preenchimentoCor: e.target.value,
                mostrarPreenchimento: true,
              })
            }
            className="h-10 w-full rounded-xl border"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Contorno
          </p>

          <input
            type="color"
            value={campo.contornoCor || "#1d4ed8"}
            onChange={(e) =>
              onAtualizarCampo({
                ...campo,
                contornoCor: e.target.value,
                mostrarContorno: true,
              })
            }
            className="h-10 w-full rounded-xl border"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Espessura do contorno
          </p>

          <input
            type="range"
            min={1}
            max={20}
            value={campo.contornoEspessura || 2}
            onChange={(e) =>
              onAtualizarCampo({
                ...campo,
                contornoEspessura: Number(e.target.value),
                mostrarContorno: true,
              })
            }
            className="w-full"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Transparência
          </p>

          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={campo.opacity ?? 1}
            onChange={(e) =>
              onAtualizarCampo({
                ...campo,
                opacity: Number(e.target.value),
              })
            }
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}