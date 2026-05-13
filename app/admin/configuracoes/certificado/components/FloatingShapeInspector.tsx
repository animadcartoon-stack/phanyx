"use client";


import { useState } from "react";

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
  x?: number | null;
  y?: number | null;
  largura?: number | null;
  altura?: number | null;
  raioBorda?: number | null;
  cantosArredondados?: {
  topoEsquerdo?: number;
  topoDireito?: number;
  baixoDireito?: number;
  baixoEsquerdo?: number;
} | null;
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
  setMostrarHandlesForma?: (valor: boolean | ((prev: boolean) => boolean)) => void;
};

function gerarPathComCantosArredondados(campo: CampoForma) {
  const pontos = campo.pontosForma || [];
  const cantos = campo.cantosArredondados || {};
  const raioPadrao = Math.max(0, Math.min(45, campo.raioBorda || 0));

  if (pontos.length < 3) return "";

  const raioDoPonto = (index: number) => {
    if (campo.forma === "TRIANGULO") {
      return raioPadrao;
    }

    if (index === 0) return Math.max(0, Math.min(45, cantos.topoEsquerdo ?? raioPadrao));
    if (index === 1) return Math.max(0, Math.min(45, cantos.topoDireito ?? raioPadrao));
    if (index === 2) return Math.max(0, Math.min(45, cantos.baixoDireito ?? raioPadrao));
    if (index === 3) return Math.max(0, Math.min(45, cantos.baixoEsquerdo ?? raioPadrao));

    return raioPadrao;
  };

  let d = "";

  for (let i = 0; i < pontos.length; i++) {
    const anterior = pontos[(i - 1 + pontos.length) % pontos.length];
    const atual = pontos[i];
    const proximo = pontos[(i + 1) % pontos.length];

    const raio = raioDoPonto(i);

    if (raio <= 0) {
      if (i === 0) {
        d += `M ${atual.x} ${atual.y}`;
      } else {
        d += ` L ${atual.x} ${atual.y}`;
      }
      continue;
    }

    const distAnterior = Math.hypot(atual.x - anterior.x, atual.y - anterior.y);
    const distProximo = Math.hypot(proximo.x - atual.x, proximo.y - atual.y);

    if (distAnterior === 0 || distProximo === 0) continue;

    const r = Math.min(raio, distAnterior / 2, distProximo / 2);

    const inicioX = atual.x + ((anterior.x - atual.x) / distAnterior) * r;
    const inicioY = atual.y + ((anterior.y - atual.y) / distAnterior) * r;

    const fimX = atual.x + ((proximo.x - atual.x) / distProximo) * r;
    const fimY = atual.y + ((proximo.y - atual.y) / distProximo) * r;

    if (i === 0) {
      d += `M ${inicioX} ${inicioY}`;
    } else {
      d += ` L ${inicioX} ${inicioY}`;
    }

    d += ` Q ${atual.x} ${atual.y} ${fimX} ${fimY}`;
  }

  d += " Z";
  return d;
}

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
  setMostrarHandlesForma,
}: Props) {
  if (!aberto || !campo || campo.tipo !== "FORMA") return null;

  const pontasAtuais = campo.forma === "ESTRELA"
    ? Math.max(3, Math.floor((campo.pontosForma?.length || 10) / 2))
    : 0;

const raioInternoAtual = Number((campo as any).raioInterno ?? 22);
const raioExternoAtual = Number((campo as any).raioExterno ?? 44);

function atualizarCampoBasico(chave: keyof CampoForma, valor: any) {
  onAtualizarCampo({
    ...campo,
    [chave]: valor,
  } as any);
}

const ehEstrela = campo.forma === "ESTRELA";
const ehRetanguloOuQuadrado =
  campo.forma === "RETANGULO" || campo.forma === "QUADRADO";
const ehTriangulo = campo.forma === "TRIANGULO";
const ehCirculo = campo.forma === "CIRCULO";

const [alvoCantos, setAlvoCantos] = useState<
  "todos" | "cima" | "baixo" | "esquerda" | "direita"
>("todos");

function valorAtualDosCantos() {
  const cantos = (campo as any).cantosArredondados || {};

  if (alvoCantos === "todos") {
    return campo.raioBorda || 0;
  }

  if (alvoCantos === "cima") {
    return cantos.topoEsquerdo ?? cantos.topoDireito ?? 0;
  }

  if (alvoCantos === "baixo") {
    return cantos.baixoEsquerdo ?? cantos.baixoDireito ?? 0;
  }

  if (alvoCantos === "esquerda") {
    return cantos.topoEsquerdo ?? cantos.baixoEsquerdo ?? 0;
  }

  if (alvoCantos === "direita") {
    return cantos.topoDireito ?? cantos.baixoDireito ?? 0;
  }

  return 0;
}

function aplicarArredondamentoCantos(
  alvo:
    | "todos"
    | "cima"
    | "baixo"
    | "esquerda"
    | "direita"
    | "topoEsquerdo"
    | "topoDireito"
    | "baixoDireito"
    | "baixoEsquerdo",
  valor: number
) {
  const atual = (campo as any).cantosArredondados || {};

  const proximo = {
    topoEsquerdo: atual.topoEsquerdo ?? 0,
    topoDireito: atual.topoDireito ?? 0,
    baixoDireito: atual.baixoDireito ?? 0,
    baixoEsquerdo: atual.baixoEsquerdo ?? 0,
  };

  if (alvo === "todos") {
    proximo.topoEsquerdo = valor;
    proximo.topoDireito = valor;
    proximo.baixoDireito = valor;
    proximo.baixoEsquerdo = valor;
  }

  if (alvo === "cima") {
    proximo.topoEsquerdo = valor;
    proximo.topoDireito = valor;
  }

  if (alvo === "baixo") {
    proximo.baixoEsquerdo = valor;
    proximo.baixoDireito = valor;
  }

  if (alvo === "esquerda") {
    proximo.topoEsquerdo = valor;
    proximo.baixoEsquerdo = valor;
  }

  if (alvo === "direita") {
    proximo.topoDireito = valor;
    proximo.baixoDireito = valor;
  }

  if (
    alvo === "topoEsquerdo" ||
    alvo === "topoDireito" ||
    alvo === "baixoDireito" ||
    alvo === "baixoEsquerdo"
  ) {
    proximo[alvo] = valor;
  }

  onAtualizarCampo({
  ...campo,
  raioBorda: alvo === "todos" ? valor : 0,
  cantosArredondados: proximo,
} as any);
}

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

  function atualizarEstrela(opcoes: {
  pontas?: number;
  raioInterno?: number;
  raioExterno?: number;
}) {
  if (campo.forma !== "ESTRELA") return;

  const novasPontas = opcoes.pontas ?? pontasAtuais;
  const novoRaioInterno = opcoes.raioInterno ?? raioInternoAtual;
  const novoRaioExterno = opcoes.raioExterno ?? raioExternoAtual;

  onAtualizarCampo({
    ...campo,
    pontas: novasPontas,
    pontasEstrela: novasPontas,
    raioInterno: novoRaioInterno,
    raioExterno: novoRaioExterno,
    pontosForma: gerarPontosEstrela(
      novasPontas,
      novoRaioInterno,
      novoRaioExterno
    ),
  } as any);
}

function criarTangenteSimetrica(
  ponto: PontoForma,
  intensidade: number
): PontoForma {
  const centroX = 50;
  const centroY = 50;

  const anguloRadial = Math.atan2(
    ponto.y - centroY,
    ponto.x - centroX
  );

  const anguloTangente = anguloRadial + Math.PI / 2;

  const dx = Math.cos(anguloTangente) * intensidade;
  const dy = Math.sin(anguloTangente) * intensidade;

  return {
    ...ponto,
    tipo: "curvo",
    handleMode: "alinhado",
    inX: ponto.x - dx,
    inY: ponto.y - dy,
    outX: ponto.x + dx,
    outY: ponto.y + dy,
  };
}

function arredondarGrupoEstrela(
  grupo: "internos" | "externos",
  intensidade: number
) {
  if (campo.forma !== "ESTRELA") return;

  const pontos = campo.pontosForma || [];

  onAtualizarCampo({
    ...campo,
    pontosForma: pontos.map((ponto, index) => {
      const externo = index % 2 === 0;
      const pertence =
        grupo === "externos"
          ? externo
          : !externo;

      if (!pertence) return ponto;

      if (intensidade <= 0) {
        return {
          ...ponto,
          tipo: "reto",
          inX: undefined,
          inY: undefined,
          outX: undefined,
          outY: undefined,
        };
      }

      return criarTangenteSimetrica(
        ponto,
        intensidade
      );
    }),
  } as any);
}

function classeBotaoAlvo(alvo: typeof alvoCantos) {
  return alvoCantos === alvo
    ? "rounded-lg border border-blue-600 bg-blue-600 px-2 py-1 text-xs font-semibold text-white"
    : "rounded-lg border bg-white px-2 py-1 text-xs font-semibold hover:bg-slate-50";
}

  return (
    <div
      className="fixed z-[9999999] min-h-[360px] w-[280px] resize-y overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      style={{
  left: posicao.x,
  top: posicao.y,
  height: 620,
  minHeight: 360,
  maxHeight: "85vh",
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

      <div className="h-[calc(100%-52px)] space-y-4 overflow-y-auto p-4 text-sm text-slate-700">
        <button
  type="button"
  onClick={() => setMostrarHandlesForma?.((prev) => !prev)}
  className="w-full rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-blue-700 hover:bg-blue-100"
>
  Mostrar / ocultar pontos de edição
</button>
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            Tipo
          </p>
          <div className="rounded-xl border bg-slate-50 px-3 py-2">
            {campo.forma || "Forma"}
          </div>
        </div>

<div className="grid grid-cols-2 gap-3">
  <div>
    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
      Largura
    </p>

    <input
      type="number"
      value={campo.largura || 160}
      onChange={(e) =>
        atualizarCampoBasico("largura", Number(e.target.value))
      }
      className="w-full rounded-xl border px-3 py-2"
    />
  </div>

  <div>
    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
      Altura
    </p>

    <input
      type="number"
      value={campo.altura || 160}
      onChange={(e) =>
        atualizarCampoBasico("altura", Number(e.target.value))
      }
      className="w-full rounded-xl border px-3 py-2"
    />
  </div>
</div>
{(ehRetanguloOuQuadrado || ehTriangulo) && (
  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
      Arredondamento dos cantos
    </p>

    <input
      type="range"
      min={0}
      max={50}
      value={valorAtualDosCantos()}
      onChange={(e) =>
  aplicarArredondamentoCantos(alvoCantos, Number(e.target.value))
}
      className="w-full"
    />

    <div className="mt-3 grid grid-cols-2 gap-2">
    <button
  type="button"
  onClick={() => {
    setAlvoCantos("todos");
    aplicarArredondamentoCantos("todos", valorAtualDosCantos() || 20);
  }}
  className={classeBotaoAlvo("todos")}
>
  Todos
</button>

<button
  type="button"
  onClick={() => {
    setAlvoCantos("cima");
    aplicarArredondamentoCantos("cima", 20);
  }}
  className={classeBotaoAlvo("cima")}
>
  Só cima
</button>

<button
  type="button"
  onClick={() => {
    setAlvoCantos("baixo");
    aplicarArredondamentoCantos("baixo", 20);
  }}
  className={classeBotaoAlvo("baixo")}
>
  Só baixo
</button>

<button
  type="button"
  onClick={() => {
    setAlvoCantos("esquerda");
    aplicarArredondamentoCantos("esquerda", 20);
  }}
  className={classeBotaoAlvo("esquerda")}
>
  Só esquerda
</button>

<button
  type="button"
  onClick={() => {
    setAlvoCantos("direita");
    aplicarArredondamentoCantos("direita", 20);
  }}
  className={classeBotaoAlvo("direita")}
>
  Só direita
</button>

      <button
        type="button"
        onClick={() => aplicarArredondamentoCantos(alvoCantos, 0)}
        className="rounded-lg border bg-white px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        Pontudo
      </button>
    </div>
  </div>
)}
        {campo.forma === "ESTRELA" && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              Quantidade de pontas
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => atualizarEstrela({ pontas: Math.max(3, pontasAtuais - 1) })}
                className="h-9 w-9 rounded-xl border bg-white font-bold hover:bg-slate-50"
              >
                −
              </button>

              <div className="flex-1 rounded-xl border bg-slate-50 px-3 py-2 text-center font-bold">
                {pontasAtuais}
              </div>

              <button
                type="button"
                onClick={() => atualizarEstrela({ pontas: pontasAtuais + 1 })}
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
              onChange={(e) => atualizarEstrela({ pontas: Number(e.target.value) })}
              className="mt-3 w-full"
            />
          </div>
        )}

{ehEstrela && (
  <>
    <div className="mt-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        Raio externo / tamanho das pontas
      </p>

      <input
        type="range"
        min={30}
        max={120}
        value={raioExternoAtual}
        onChange={(e) =>
          atualizarEstrela({ raioExterno: Number(e.target.value) })
        }
        className="w-full"
      />
    </div>

    <div className="mt-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        Raio interno / profundidade
      </p>

      <input
        type="range"
        min={8}
        max={42}
        value={raioInternoAtual}
        onChange={(e) =>
          atualizarEstrela({ raioInterno: Number(e.target.value) })
        }
        className="w-full"
      />
    </div>

    <div className="mt-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        Arredondamento interno
      </p>

      <input
        type="range"
        min={0}
        max={40}
        defaultValue={0}
        onChange={(e) =>
  arredondarGrupoEstrela(
    "internos",
    Number(e.target.value)
  )
}
        className="w-full"
      />
    </div>

    <div className="mt-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        Arredondamento das pontas
      </p>

      <input
        type="range"
        min={0}
        max={40}
        defaultValue={0}
        onChange={(e) =>
  arredondarGrupoEstrela(
    "externos",
    Number(e.target.value)
  )
}
        className="w-full"
      />
    </div>
  </>
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