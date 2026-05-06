"use client";

type PontoForma = {
  id: string;
  x: number;
  y: number;
  tipo?: "reto" | "curvo";
  inX?: number;
  inY?: number;
  outX?: number;
  outY?: number;
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

function limitar(v: number) {
  return Math.max(-200, Math.min(300, v));
}

function criarAlcasPadrao(ponto: PontoForma): PontoForma {
  return {
    ...ponto,
    tipo: "curvo",
    inX: ponto.inX ?? ponto.x - 25,
    inY: ponto.inY ?? ponto.y - 10,
    outX: ponto.outX ?? ponto.x + 25,
    outY: ponto.outY ?? ponto.y + 10,
  };
}

function gerarPath(campo: CampoForma) {
  const pontos = campo.pontosForma || [];
  if (!pontos.length) return "";

  if (campo.forma === "LINHA") {
    let d = `M ${pontos[0].x} ${pontos[0].y}`;

    for (let i = 1; i < pontos.length; i++) {
      const anterior = pontos[i - 1];
      const atual = pontos[i];

      if (anterior.tipo === "curvo" || atual.tipo === "curvo") {
        const p1 = criarAlcasPadrao(anterior);
        const p2 = criarAlcasPadrao(atual);
        d += ` C ${p1.outX} ${p1.outY} ${p2.inX} ${p2.inY} ${atual.x} ${atual.y}`;
      } else {
        d += ` L ${atual.x} ${atual.y}`;
      }
    }

    return d;
  }

  let d = `M ${pontos[0].x} ${pontos[0].y}`;

  for (let i = 1; i < pontos.length; i++) {
    const anterior = pontos[i - 1];
    const atual = pontos[i];

    if (anterior.tipo === "curvo" || atual.tipo === "curvo") {
      const p1 = criarAlcasPadrao(anterior);
      const p2 = criarAlcasPadrao(atual);
      d += ` C ${p1.outX} ${p1.outY} ${p2.inX} ${p2.inY} ${atual.x} ${atual.y}`;
    } else {
      d += ` L ${atual.x} ${atual.y}`;
    }
  }

  const ultimo = pontos[pontos.length - 1];
  const primeiro = pontos[0];

  if (ultimo.tipo === "curvo" || primeiro.tipo === "curvo") {
    const p1 = criarAlcasPadrao(ultimo);
    const p2 = criarAlcasPadrao(primeiro);
    d += ` C ${p1.outX} ${p1.outY} ${p2.inX} ${p2.inY} ${primeiro.x} ${primeiro.y}`;
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
      pontos.map((ponto) => {
        if (ponto.id !== pontoId) return ponto;

        const dx = limitar(novoX) - ponto.x;
        const dy = limitar(novoY) - ponto.y;

        return {
          ...ponto,
          x: limitar(novoX),
          y: limitar(novoY),
          inX: ponto.inX !== undefined ? limitar(ponto.inX + dx) : undefined,
          inY: ponto.inY !== undefined ? limitar(ponto.inY + dy) : undefined,
          outX: ponto.outX !== undefined ? limitar(ponto.outX + dx) : undefined,
          outY: ponto.outY !== undefined ? limitar(ponto.outY + dy) : undefined,
        };
      })
    );
  }

  function moverAlca(
    pontoId: string,
    lado: "in" | "out",
    novoX: number,
    novoY: number
  ) {
    atualizarPontos(
      pontos.map((ponto) =>
        ponto.id === pontoId
          ? {
              ...criarAlcasPadrao(ponto),
              tipo: "curvo",
              ...(lado === "in"
                ? { inX: limitar(novoX), inY: limitar(novoY) }
                : { outX: limitar(novoX), outY: limitar(novoY) }),
            }
          : ponto
      )
    );
  }

  function alternarTipoPonto(pontoId: string) {
    atualizarPontos(
      pontos.map((ponto) =>
        ponto.id === pontoId
          ? ponto.tipo === "curvo"
            ? {
                ...ponto,
                tipo: "reto",
                inX: undefined,
                inY: undefined,
                outX: undefined,
                outY: undefined,
              }
            : criarAlcasPadrao(ponto)
          : ponto
      )
    );
  }

  function deletarPonto(pontoId: string) {
    const minimo = campo.forma === "LINHA" ? 2 : 3;
    if (pontos.length <= minimo) return;
    atualizarPontos(pontos.filter((ponto) => ponto.id !== pontoId));
  }

  function adicionarPonto(e: React.MouseEvent<SVGPathElement>) {
    if (!selecionado) return;

    e.stopPropagation();
    e.preventDefault();

    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();

    const x = Math.max(
  0,
  Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
);

const y = Math.max(
  0,
  Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)
);

    atualizarPontos([
      ...pontos,
      {
        id: `p-${Date.now()}`,
        x,
        y,
        tipo: "reto",
      },
    ]);
  }

  function iniciarArrastePercentual(
    e: React.MouseEvent,
    callback: (x: number, y: number) => void
  ) {
    e.stopPropagation();
    e.preventDefault();

    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const move = (ev: globalThis.MouseEvent) => {
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      callback(x, y);
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d={gerarPath(campo)}
          onDoubleClick={adicionarPonto}
          className="pointer-events-auto cursor-crosshair"
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

        {selecionado &&
          pontos.map((ponto) => {
            const p = ponto.tipo === "curvo" ? criarAlcasPadrao(ponto) : ponto;

            return (
              <g key={`alcas-${ponto.id}`}>
                {ponto.tipo === "curvo" && (
                  <>
                    <line
                      x1={ponto.x}
                      y1={ponto.y}
                      x2={p.inX}
                      y2={p.inY}
                      stroke="#9333ea"
                      strokeWidth={0.6}
                      vectorEffect="non-scaling-stroke"
                    />
                    <line
                      x1={ponto.x}
                      y1={ponto.y}
                      x2={p.outX}
                      y2={p.outY}
                      stroke="#9333ea"
                      strokeWidth={0.6}
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                )}
              </g>
            );
          })}
      </svg>

      {selecionado &&
        pontos.map((ponto) => {
          const p = ponto.tipo === "curvo" ? criarAlcasPadrao(ponto) : ponto;

          return (
            <div key={ponto.id}>
              {ponto.tipo === "curvo" && (
                <>
                  <button
                    type="button"
                    onMouseDown={(e) =>
                      iniciarArrastePercentual(e, (x, y) =>
                        moverAlca(ponto.id, "in", x, y)
                      )
                    }
                    className="pointer-events-auto absolute z-[99991] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-purple-300 shadow"
                    style={{
                      left: `${p.inX}%`,
                      top: `${p.inY}%`,
                      cursor: "grab",
                    }}
                    title="Alça Bézier de entrada"
                  />

                  <button
                    type="button"
                    onMouseDown={(e) =>
                      iniciarArrastePercentual(e, (x, y) =>
                        moverAlca(ponto.id, "out", x, y)
                      )
                    }
                    className="pointer-events-auto absolute z-[99991] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-purple-300 shadow"
                    style={{
                      left: `${p.outX}%`,
                      top: `${p.outY}%`,
                      cursor: "grab",
                    }}
                    title="Alça Bézier de saída"
                  />
                </>
              )}

              <button
                type="button"
                onMouseDown={(e) =>
                  iniciarArrastePercentual(e, (x, y) =>
                    moverPonto(ponto.id, x, y)
                  )
                }
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  alternarTipoPonto(ponto.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  deletarPonto(ponto.id);
                }}
                className={`pointer-events-auto absolute z-[99992] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${
                  ponto.tipo === "curvo" ? "bg-purple-500" : "bg-orange-500"
                }`}
                style={{
                  left: `${ponto.x}%`,
                  top: `${ponto.y}%`,
                  cursor: "grab",
                }}
                title="Arraste para deformar. Duplo clique alterna reto/curvo. Botão direito remove."
              />
            </div>
          );
        })}
    </div>
  );
}