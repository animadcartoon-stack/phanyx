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
  if (!pontos.length) return "";

  if (campo.forma === "LINHA") {
    return `M ${pontos[0].x} ${pontos[0].y} L ${pontos[pontos.length - 1].x} ${pontos[pontos.length - 1].y}`;
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

export default function FormaVetorial({ campo, selecionado, onChange }: Props) {
  const pontos = campo.pontosForma || [];

  const preenchimentoCor = campo.preenchimentoCor || campo.cor || "#1d4ed8";
  const contornoCor = campo.contornoCor || campo.cor || "#1d4ed8";
  const contornoEspessura = campo.contornoEspessura ?? 2;
  const mostrarPreenchimento = campo.mostrarPreenchimento !== false;
  const mostrarContorno = campo.mostrarContorno !== false;

  function atualizarPontos(novosPontos: PontoForma[]) {
    onChange({
      ...campo,
      pontosForma: novosPontos,
    });
  }

  function moverPonto(pontoId: string, novoX: number, novoY: number) {
    atualizarPontos(
      pontos.map((ponto) =>
        ponto.id === pontoId
          ? {
              ...ponto,
              x: Math.max(0, Math.min(100, novoX)),
              y: Math.max(0, Math.min(100, novoY)),
            }
          : ponto
      )
    );
  }

  function alternarTipoPonto(pontoId: string) {
    atualizarPontos(
      pontos.map((ponto) =>
        ponto.id === pontoId
          ? {
              ...ponto,
              tipo: ponto.tipo === "curvo" ? "reto" : "curvo",
            }
          : ponto
      )
    );
  }

  function deletarPonto(pontoId: string) {
    const minimo = campo.forma === "LINHA" ? 2 : 3;
    if (pontos.length <= minimo) return;

    atualizarPontos(pontos.filter((ponto) => ponto.id !== pontoId));
  }

  function adicionarPonto(e: React.MouseEvent<SVGSVGElement>) {
    if (!selecionado) return;

    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    atualizarPontos([
      ...pontos,
      {
        id: `p-${Date.now()}`,
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
        tipo: "reto",
      },
    ]);
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        onDoubleClick={adicionarPonto}
      >
        <path
          d={gerarPath(campo)}
          fill={
            campo.forma === "LINHA" || !mostrarPreenchimento
              ? "none"
              : hexToRgba(preenchimentoCor, campo.opacity ?? 0.55)
          }
          stroke={mostrarContorno ? contornoCor : "none"}
          strokeWidth={
            campo.forma === "LINHA"
              ? contornoEspessura || 4
              : contornoEspessura
          }
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

              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
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
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deletarPonto(ponto.id);
            }}
            className={`absolute z-[99990] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${
              ponto.tipo === "curvo" ? "bg-purple-500" : "bg-orange-500"
            }`}
            style={{
              left: `${ponto.x}%`,
              top: `${ponto.y}%`,
              cursor: "grab",
            }}
            title="Arraste para deformar. Duplo clique alterna reto/curvo. Botão direito remove."
          />
        ))}

    </div>
  );
}