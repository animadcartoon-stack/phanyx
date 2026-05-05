"use client";

type PontoForma = {
  id: string;
  x: number;
  y: number;
  tipo?: "reto" | "curvo";
};

type CampoForma = {
  id: number;
  forma?: string | null;
  cor?: string | null;
  opacity?: number | null;
  pontosForma?: PontoForma[] | null;
};

type Props = {
  campo: CampoForma;
  selecionado: boolean;
  onChange: (campoAtualizado: CampoForma) => void;
};

function hexToRgba(hex: string, alpha: number) {
  const limpo = hex.replace("#", "");
  const bigint = parseInt(limpo, 16);

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function gerarPath(campo: CampoForma) {
  const pontos = campo.pontosForma || [];

  if (pontos.length === 0) return "";

  if (campo.forma === "LINHA") {
    const p1 = pontos[0];
    const p2 = pontos[1];
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  }

  let d = `M ${pontos[0].x} ${pontos[0].y}`;

  for (let i = 1; i < pontos.length; i++) {
    const anterior = pontos[i - 1];
    const atual = pontos[i];

    if (anterior.tipo === "curvo" || atual.tipo === "curvo") {
      const cx = (anterior.x + atual.x) / 2;
      const cy = (anterior.y + atual.y) / 2;
      d += ` Q ${cx} ${cy} ${atual.x} ${atual.y}`;
    } else {
      d += ` L ${atual.x} ${atual.y}`;
    }
  }

  d += " Z";
  return d;
}

export default function FormaVetorial({
  campo,
  selecionado,
  onChange,
}: Props) {
  const pontos = campo.pontosForma || [];
  const cor = campo.cor || "#1d4ed8";

  function moverPonto(pontoId: string, novoX: number, novoY: number) {
    onChange({
      ...campo,
      pontosForma: pontos.map((ponto) =>
        ponto.id === pontoId
          ? {
              ...ponto,
              x: Math.max(0, Math.min(100, novoX)),
              y: Math.max(0, Math.min(100, novoY)),
            }
          : ponto
      ),
    });
  }

  function alternarTipoPonto(pontoId: string) {
    onChange({
      ...campo,
      pontosForma: pontos.map((ponto) =>
        ponto.id === pontoId
          ? {
              ...ponto,
              tipo: ponto.tipo === "curvo" ? "reto" : "curvo",
            }
          : ponto
      ),
    });
  }

  return (
    <div className="absolute inset-0">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d={gerarPath(campo)}
          fill={
            campo.forma === "LINHA"
              ? "none"
              : hexToRgba(cor, campo.opacity ?? 0.55)
          }
          stroke={cor}
          strokeWidth={campo.forma === "LINHA" ? 4 : 1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {selecionado &&
        pontos.map((ponto) => (
          <button
            key={ponto.id}
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();

              const rect =
                e.currentTarget.parentElement?.getBoundingClientRect();

              if (!rect) return;

              const move = (ev: globalThis.MouseEvent) => {
                const novoX = ((ev.clientX - rect.left) / rect.width) * 100;
                const novoY = ((ev.clientY - rect.top) / rect.height) * 100;

                moverPonto(ponto.id, novoX, novoY);
              };

              const up = () => {
                window.removeEventListener("mousemove", move);
                window.removeEventListener("mouseup", up);
              };

              window.addEventListener("mousemove", move);
              window.addEventListener("mouseup", up);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              alternarTipoPonto(ponto.id);
            }}
            className={`absolute z-[9999] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${
              ponto.tipo === "curvo" ? "bg-purple-500" : "bg-orange-500"
            }`}
            style={{
              left: `${ponto.x}%`,
              top: `${ponto.y}%`,
              cursor: "grab",
            }}
            title={
              ponto.tipo === "curvo"
                ? "Ponto curvo — duplo clique para virar reto"
                : "Ponto reto — duplo clique para virar curvo"
            }
          />
        ))}
    </div>
  );
}