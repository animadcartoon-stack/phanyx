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
  preenchimentoCor?: string | null;
  contornoCor?: string | null;
  contornoEspessura?: number | null;
  mostrarPreenchimento?: boolean | null;
  mostrarContorno?: boolean | null;
  opacity?: number | null;
  largura?: number | null;
  altura?: number | null;
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
  const preenchimentoCor = campo.preenchimentoCor || campo.cor || "#1d4ed8";
  const contornoCor = campo.contornoCor || campo.cor || "#1d4ed8";
  const contornoEspessura = campo.contornoEspessura ?? 1.5;
  const mostrarPreenchimento = campo.mostrarPreenchimento !== false;
  const mostrarContorno = campo.mostrarContorno !== false;

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
    <div className="pointer-events-none absolute inset-0">
      <svg
  className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d={gerarPath(campo)}
          fill={
  campo.forma === "LINHA" || !mostrarPreenchimento
    ? "none"
    : hexToRgba(preenchimentoCor, campo.opacity ?? 0.55)
}
stroke={mostrarContorno ? contornoCor : "none"}
strokeWidth={campo.forma === "LINHA" ? contornoEspessura || 4 : contornoEspessura}
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
            className={`pointer-events-auto absolute z-[9999] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${
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
              {selecionado && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();

            const startX = e.clientX;
            const startY = e.clientY;
            const startW = campo.largura || 120;
            const startH = campo.altura || 120;
            const proporcao = startW / startH;

            const move = (ev: globalThis.MouseEvent) => {
              const deltaX = ev.clientX - startX;
              const deltaY = ev.clientY - startY;

              let novaLargura = Math.max(20, startW + deltaX);
              let novaAltura = Math.max(20, startH + deltaY);

              if (ev.shiftKey) {
                novaAltura = Math.max(20, novaLargura / proporcao);
              }

              onChange({
                ...campo,
                largura: Math.round(novaLargura),
                altura: Math.round(novaAltura),
              });
            };

            const up = () => {
              window.removeEventListener("mousemove", move);
              window.removeEventListener("mouseup", up);
            };

            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", up);
          }}
          className="pointer-events-auto absolute bottom-[-10px] right-[-10px] z-[10000] h-5 w-5 cursor-se-resize rounded-full border-2 border-white bg-blue-600 shadow"
          title="Redimensionar forma"
        />
      )}
    </div>
  );
}