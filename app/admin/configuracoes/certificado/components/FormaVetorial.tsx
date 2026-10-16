"use client";

import { selecionarPontoForma, pontosDoContornoArredondado, ajustarTangentesEmConjunto } from "./edicaoPontosForma";

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
  forma?: string | null;
  cor?: string | null;
  preenchimentoCor?: string | null;
  contornoCor?: string | null;
  contornoEspessura?: number | null;
  contornoTipo?: "interno" | "externo" | null;
  mostrarPreenchimento?: boolean | null;
  mostrarContorno?: boolean | null;
  opacity?: number | null;
  raioBorda?: number | null;
  cantosArredondados?: {
    topoEsquerdo?: number;
    topoDireito?: number;
    baixoDireito?: number;
    baixoEsquerdo?: number;
  } | null;
  raiosPontos?: Record<string, number> | null;
  pontosForma?: PontoForma[] | null;
};

type Props = {
  campo: CampoForma;
  selecionado: boolean;
  modo?: "editor" | "preview";
  mostrarHandles?: boolean;
  pontoSelecionadoId?: string | null;
  pontosSelecionadosIds?: string[];
  onSelecionarPontos?: (ids: string[]) => void;
  onSelecionarPonto?: (pontoId: string | null) => void;
  onChange: (campoAtualizado: CampoForma) => void;
};

function limitar(v: number) {
  return v;
}

function criarAlcasPadrao(ponto: PontoForma): PontoForma {
  return {
    ...ponto,
    tipo: "curvo",
    inX: ponto.inX ?? ponto.x - 18,
    inY: ponto.inY ?? ponto.y,
    outX: ponto.outX ?? ponto.x + 18,
    outY: ponto.outY ?? ponto.y,
    handleMode: ponto.handleMode ?? "alinhado",
  };
}

function criarAlcasEstrelaSimetrica(
  ponto: PontoForma,
  intensidade: number
): PontoForma {
  const centroX = 50;
  const centroY = 50;

  const anguloRadial = Math.atan2(ponto.y - centroY, ponto.x - centroX);
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

function criarAlcasRadiaisEstrela(
  ponto: PontoForma,
  intensidade = 14
): PontoForma {
  const centroX = 50;
  const centroY = 50;

  const anguloRadial = Math.atan2(ponto.y - centroY, ponto.x - centroX);
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

function controleSaida(ponto: PontoForma) {
  return {
    x: ponto.outX ?? ponto.x,
    y: ponto.outY ?? ponto.y,
  };
}

function controleEntrada(ponto: PontoForma) {
  return {
    x: ponto.inX ?? ponto.x,
    y: ponto.inY ?? ponto.y,
  };
}

function gerarPathComCantosArredondados(campo: CampoForma) {
  const pontos = pontosDoContornoArredondado(garantirPontosIniciais(campo), campo.raiosPontos || {});
  const cantos = campo.cantosArredondados || {};
  const raiosPontos = campo.raiosPontos || {};
  const raioPadrao = Math.max(0, Math.min(45, Number(campo.raioBorda || 0)));

  if (pontos.length < 3) return "";

  function limitarRaio(valor: unknown) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) return 0;

    return Math.max(0, Math.min(45, numero));
  }

  function raioDoPonto(index: number) {
    const ponto = pontos[index];
    const raioPorId = ponto ? raiosPontos[ponto.id] : undefined;

    if (raioPorId !== undefined && raioPorId !== null) {
      return limitarRaio(raioPorId);
    }

    if (index === 0 && cantos.topoEsquerdo !== undefined) {
      return limitarRaio(cantos.topoEsquerdo);
    }

    if (index === 1 && cantos.topoDireito !== undefined) {
      return limitarRaio(cantos.topoDireito);
    }

    if (index === 2 && cantos.baixoDireito !== undefined) {
      return limitarRaio(cantos.baixoDireito);
    }

    if (index === 3 && cantos.baixoEsquerdo !== undefined) {
      return limitarRaio(cantos.baixoEsquerdo);
    }

    return raioPadrao;
  }

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

function gerarPath(campo: CampoForma) {
  const pontos = campo.pontosForma || [];
  if (!pontos.length) return "";

  const temRaioPorPonto = Object.values(campo.raiosPontos || {}).some(
    (valor) => Number(valor) > 0,
  );

  const temCantoLegado = Object.values(campo.cantosArredondados || {}).some(
    (valor) => Number(valor) > 0,
  );

  if (
    campo.forma !== "ESTRELA" &&
    campo.forma !== "LINHA" &&
    campo.forma !== "CIRCULO" &&
    (
      Number(campo.raioBorda || 0) > 0 ||
      temRaioPorPonto ||
      temCantoLegado
    )
  ) {
    return gerarPathComCantosArredondados(campo);
  }

  let d = `M ${pontos[0].x} ${pontos[0].y}`;

  for (let i = 1; i < pontos.length; i++) {
    const anterior = pontos[i - 1];
    const atual = pontos[i];

    const temCurva =
      anterior.tipo === "curvo" ||
      atual.tipo === "curvo" ||
      anterior.outX !== undefined ||
      atual.inX !== undefined;

    if (temCurva) {
      const c1 = controleSaida(anterior);
      const c2 = controleEntrada(atual);

      d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${atual.x} ${atual.y}`;
    } else {
      d += ` L ${atual.x} ${atual.y}`;
    }
  }

  if (campo.forma !== "LINHA") {
    const ultimo = pontos[pontos.length - 1];
    const primeiro = pontos[0];

    const temCurva =
      ultimo.tipo === "curvo" ||
      primeiro.tipo === "curvo" ||
      ultimo.outX !== undefined ||
      primeiro.inX !== undefined;

    if (temCurva) {
      const c1 = controleSaida(ultimo);
      const c2 = controleEntrada(primeiro);

      d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${primeiro.x} ${primeiro.y}`;
    }

    d += " Z";
  }

  return d;
}

function garantirPontosIniciais(campo: CampoForma): PontoForma[] {
  const pontos = campo.pontosForma || [];

  if (pontos.length >= 3) return pontos;

  if (campo.forma === "SETA") {
    return [
      { id: "p-1", x: 0, y: 30, tipo: "reto" },
      { id: "p-2", x: 62, y: 30, tipo: "reto" },
      { id: "p-3", x: 62, y: 0, tipo: "reto" },
      { id: "p-4", x: 100, y: 50, tipo: "reto" },
      { id: "p-5", x: 62, y: 100, tipo: "reto" },
      { id: "p-6", x: 62, y: 70, tipo: "reto" },
      { id: "p-7", x: 0, y: 70, tipo: "reto" },
    ];
  }

  if (campo.forma === "LOSANGO") {
    return [
      { id: "p-1", x: 50, y: 0, tipo: "reto" },
      { id: "p-2", x: 100, y: 50, tipo: "reto" },
      { id: "p-3", x: 50, y: 100, tipo: "reto" },
      { id: "p-4", x: 0, y: 50, tipo: "reto" },
    ];
  }

  if (campo.forma === "RETANGULO" || campo.forma === "QUADRADO") {
    return [
      { id: "p-1", x: 0, y: 0, tipo: "reto" },
      { id: "p-2", x: 100, y: 0, tipo: "reto" },
      { id: "p-3", x: 100, y: 100, tipo: "reto" },
      { id: "p-4", x: 0, y: 100, tipo: "reto" },
    ];
  }

  if (campo.forma === "TRIANGULO") {
    return [
      { id: "p-1", x: 50, y: 0, tipo: "reto" },
      { id: "p-2", x: 100, y: 100, tipo: "reto" },
      { id: "p-3", x: 0, y: 100, tipo: "reto" },
    ];
  }

  if (campo.forma === "CIRCULO") {
    return gerarPontosCirculo(8);
  }

  return pontos;
}

function gerarPontosCirculo(total: number): PontoForma[] {
  return Array.from({ length: total }).map((_, index) => {
    const angulo = (Math.PI * 2 * index) / total - Math.PI / 2;

    return {
      id: `p-circulo-${index}`,
      x: Number((50 + Math.cos(angulo) * 50).toFixed(2)),
      y: Number((50 + Math.sin(angulo) * 50).toFixed(2)),
      tipo: "reto",
    };
  });
}

export default function FormaVetorial({
  campo,
  selecionado,
  modo = "editor",
  mostrarHandles = true,
  pontoSelecionadoId = null,
  pontosSelecionadosIds,
  onSelecionarPontos,
  onSelecionarPonto,
  onChange,
}: Props) {
  const pontos = campo.pontosForma || [];
  const idsSelecionados = pontosSelecionadosIds ?? (pontoSelecionadoId ? [pontoSelecionadoId] : []);
  const selecionar = (ids: string[]) => { onSelecionarPontos?.(ids); onSelecionarPonto?.(ids[ids.length - 1] ?? null); };

  const preenchimentoCor = campo.preenchimentoCor || campo.cor || "#1d4ed8";
  const contornoCor = campo.contornoCor || campo.cor || "#1d4ed8";
  const contornoEspessura = campo.contornoEspessura ?? 2;
  const contornoTipo = campo.contornoTipo || "externo";
  const mostrarPreenchimento = campo.mostrarPreenchimento !== false;
  const mostrarContorno = campo.mostrarContorno !== false;
  const opacidade = campo.opacity ?? 1;

  const pathForma = gerarPath(campo);
  const idForma = `forma-contorno-${campo.id}`;
  const clipInternoId = `${idForma}-interno`;
  const maskExternoId = `${idForma}-externo`;

  const larguraContornoBase =
    campo.forma === "LINHA"
      ? contornoEspessura || 4
      : campo.forma === "ESTRELA"
        ? Math.max(4, contornoEspessura)
        : Math.max(1, contornoEspessura);

  const larguraContornoRender =
    campo.forma === "LINHA"
      ? larguraContornoBase
      : larguraContornoBase * 2;

  const larguraCampo = Number((campo as any).largura || 100);
  const alturaCampo = Number((campo as any).altura || 100);

  const escalaX = larguraCampo / 100;
  const escalaY = alturaCampo / 100;

  const rxPonto = 5 / Math.max(escalaX, 0.1);
  const ryPonto = 5 / Math.max(escalaY, 0.1);

  const rxAlca = 2.3 / Math.max(escalaX, 0.1);
  const ryAlca = 2.3 / Math.max(escalaY, 0.1);

  function atualizarPontos(
    novosPontos: PontoForma[],
    desativarArredondamentoAutomatico = false,
  ) {
    onChange({
      ...campo,
      ...(desativarArredondamentoAutomatico
        ? {
            raioBorda: 0,
            cantosArredondados: null,
            raiosPontos: null,
          }
        : {}),
      pontosForma: novosPontos,
    });
  }

  function moverPontos(ids: string[], dx: number, dy: number) {
    atualizarPontos(
      pontos.map((ponto) => {
        if (!ids.includes(ponto.id)) return ponto;
        const x = ponto.x + dx;
        const y = ponto.y + dy;

        return {
          ...ponto,
          x,
          y,
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
    novoY: number,
    quebrarTangente = false,
    replicarSelecionados = false,
  ) {
    if (replicarSelecionados && idsSelecionados.length > 1 && idsSelecionados.includes(pontoId)) {
      atualizarPontos(ajustarTangentesEmConjunto(pontos, idsSelecionados, pontoId, lado, novoX, novoY), true);
      return;
    }
    atualizarPontos(
      pontos.map((ponto) => {
        if (ponto.id !== pontoId) return ponto;

        const base = criarAlcasPadrao(ponto);
        const x = limitar(novoX);
        const y = limitar(novoY);

        const tangenteQuebrada =
          quebrarTangente || base.handleMode === "quebrado";

        if (tangenteQuebrada) {
          return {
            ...base,
            tipo: "curvo",
            handleMode: "quebrado",
            ...(lado === "in" ? { inX: x, inY: y } : { outX: x, outY: y }),
          };
        }

        const dx = x - base.x;
        const dy = y - base.y;

        if (lado === "in") {
          return {
            ...base,
            tipo: "curvo",
            handleMode: "alinhado",
            inX: x,
            inY: y,
            outX: base.x - dx,
            outY: base.y - dy,
          };
        }

        return {
          ...base,
          tipo: "curvo",
          handleMode: "alinhado",
          outX: x,
          outY: y,
          inX: base.x - dx,
          inY: base.y - dy,
        };
      }),
      true,
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
              handleMode: "quebrado",
              inX: undefined,
              inY: undefined,
              outX: undefined,
              outY: undefined,
            }
            : criarAlcasPadrao(ponto)
          : ponto
      ),
      true,
    );
  }

  function deletarPonto(pontoId: string) {
    const minimo = campo.forma === "LINHA" ? 2 : 3;
    if (pontos.length <= minimo) return;

    atualizarPontos(pontos.filter((ponto) => ponto.id !== pontoId));
  }

  function atualizarPontosDaEstrela(opcao: {
    raioExterno?: number;
    raioInterno?: number;
    pontas?: number;
    tipoExternos?: "reto" | "curvo";
    tipoInternos?: "reto" | "curvo";
  }) {
    if (campo.forma !== "ESTRELA") return;

    const pontas = opcao.pontas || Math.max(3, Math.floor(pontos.length / 2));
    const total = pontas * 2;
    const raioExterno = opcao.raioExterno ?? 44;
    const raioInterno = opcao.raioInterno ?? 22;

    const novosPontos: PontoForma[] = [];

    for (let i = 0; i < total; i++) {
      const externo = i % 2 === 0;
      const angulo = (Math.PI * 2 * i) / total - Math.PI / 2;
      const raio = externo ? raioExterno : raioInterno;

      const tipo =
        externo
          ? opcao.tipoExternos || pontos[i]?.tipo || "reto"
          : opcao.tipoInternos || pontos[i]?.tipo || "reto";

      const base: PontoForma = {
        id: pontos[i]?.id || `p-${Date.now()}-${i}`,
        x: Number((50 + Math.cos(angulo) * raio).toFixed(2)),
        y: Number((50 + Math.sin(angulo) * raio).toFixed(2)),
        tipo,
        handleMode: pontos[i]?.handleMode || "alinhado",
      };

      novosPontos.push(
        tipo === "curvo"
          ? criarAlcasPadrao(base)
          : {
            ...base,
            inX: undefined,
            inY: undefined,
            outX: undefined,
            outY: undefined,
          }
      );
    }

    atualizarPontos(novosPontos);
  }

  function converterGrupoEstrela(
    grupo: "externos" | "internos",
    tipo: "reto" | "curvo"
  ) {
    if (campo.forma !== "ESTRELA") return;

    atualizarPontos(
      pontos.map((ponto, index) => {
        const externo = index % 2 === 0;
        const pertenceAoGrupo = grupo === "externos" ? externo : !externo;

        if (!pertenceAoGrupo) return ponto;

        if (tipo === "curvo") {
          const externo = index % 2 === 0;

          return criarAlcasEstrelaSimetrica(
            ponto,
            externo ? 10 : 10
          );
        }

        return {
          ...ponto,
          tipo: "reto",
          handleMode: "quebrado",
          inX: undefined,
          inY: undefined,
          outX: undefined,
          outY: undefined,
        };
      })
    );
  }

  function converterTodosPontos(tipo: "reto" | "curvo") {
    atualizarPontos(
      pontos.map((ponto) => {
        if (tipo === "curvo") {
          return criarAlcasPadrao(ponto);
        }

        return {
          ...ponto,
          tipo: "reto",
          handleMode: "quebrado",
          inX: undefined,
          inY: undefined,
          outX: undefined,
          outY: undefined,
        };
      })
    );
  }

  function converterPontosPorLado(
    lado: "cima" | "baixo" | "esquerda" | "direita",
    tipo: "reto" | "curvo"
  ) {
    atualizarPontos(
      pontos.map((ponto) => {
        const pertenceAoLado =
          lado === "cima"
            ? ponto.y <= 50
            : lado === "baixo"
              ? ponto.y >= 50
              : lado === "esquerda"
                ? ponto.x <= 50
                : ponto.x >= 50;

        if (!pertenceAoLado) return ponto;

        if (tipo === "curvo") {
          return criarAlcasPadrao(ponto);
        }

        return {
          ...ponto,
          tipo: "reto",
          handleMode: "quebrado",
          inX: undefined,
          inY: undefined,
          outX: undefined,
          outY: undefined,
        };
      })
    );
  }

  function adicionarPonto(e: React.MouseEvent<SVGPathElement>) {
    if (!selecionado || modo !== "editor") return;

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

    let indiceInserir = pontos.length;
    let menorDistancia = Infinity;

    for (let i = 0; i < pontos.length; i++) {
      const atual = pontos[i];
      const proximo = pontos[(i + 1) % pontos.length];

      if (campo.forma === "LINHA" && i === pontos.length - 1) continue;

      const meioX = (atual.x + proximo.x) / 2;
      const meioY = (atual.y + proximo.y) / 2;
      const distancia = Math.hypot(x - meioX, y - meioY);

      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        indiceInserir = i + 1;
      }
    }

    const novosPontos = [...pontos];

    novosPontos.splice(indiceInserir, 0, {
      id: `p-${Date.now()}`,
      x,
      y,
      tipo: "reto",
    });

    atualizarPontos(novosPontos);
  }

  function iniciarArrastePercentual(
    e: React.MouseEvent,
    callback: (x: number, y: number, ev: globalThis.MouseEvent) => void
  ) {
    e.stopPropagation();
    e.preventDefault();

    const raiz = e.currentTarget.closest(
      "[data-forma-vetorial-root]"
    ) as HTMLElement | null;

    if (!raiz) return;

    const svg = raiz.querySelector("svg");
    const matriz = svg?.getScreenCTM?.()?.inverse();
    const rect = raiz.getBoundingClientRect();
    const local = (clientX: number, clientY: number) => {
      if (svg && matriz) {
        const ponto = svg.createSVGPoint(); ponto.x = clientX; ponto.y = clientY;
        return ponto.matrixTransform(matriz);
      }
      return { x: ((clientX - rect.left) / Math.max(1, rect.width)) * 100, y: ((clientY - rect.top) / Math.max(1, rect.height)) * 100 };
    };
    const inicio = local(e.clientX, e.clientY);
    const move = (ev: globalThis.MouseEvent) => {
      const ponto = local(ev.clientX, ev.clientY);
      callback(ponto.x - inicio.x, ponto.y - inicio.y, ev);
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  return (
    <div
      data-forma-vetorial-root={campo.id}
      className={
        modo === "preview"
          ? "pointer-events-none absolute inset-0 overflow-visible"
          : "pointer-events-none absolute inset-0 overflow-visible"
      }
    >
      <svg
        className="absolute inset-0 z-10 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ overflow: "visible" }}
      >
        {campo.forma !== "LINHA" && (
          <defs>
            <clipPath id={clipInternoId}>
              <path d={pathForma} />
            </clipPath>

            <mask
              id={maskExternoId}
              maskUnits="userSpaceOnUse"
              x="-100"
              y="-100"
              width="300"
              height="300"
            >
              <rect
                x="-100"
                y="-100"
                width="300"
                height="300"
                fill="white"
              />
              <path d={pathForma} fill="black" />
            </mask>
          </defs>
        )}

        <path
          d={pathForma}
          onDoubleClick={modo === "editor" ? adicionarPonto : undefined}
          className={
            modo === "editor"
              ? "pointer-events-auto cursor-crosshair"
              : "pointer-events-none"
          }
          fill={
            campo.forma === "LINHA" || !mostrarPreenchimento
              ? "none"
              : preenchimentoCor
          }
          fillOpacity={campo.forma === "LINHA" ? 1 : opacidade}
          stroke="none"
        />

        <path
          d={pathForma}
          fill="none"
          stroke={mostrarContorno ? contornoCor : "none"}
          strokeWidth={larguraContornoRender}
          strokeOpacity={opacidade}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          clipPath={
            campo.forma !== "LINHA" && contornoTipo === "interno"
              ? `url(#${clipInternoId})`
              : undefined
          }
          mask={
            campo.forma !== "LINHA" && contornoTipo === "externo"
              ? `url(#${maskExternoId})`
              : undefined
          }
          className="pointer-events-none"
        />

        {selecionado &&
          modo === "editor" &&
          mostrarHandles &&
          pontos.map((ponto) => {
            const p = ponto.tipo === "curvo" ? criarAlcasPadrao(ponto) : ponto;
            const pontoEstaSelecionado = idsSelecionados.includes(ponto.id);

            return (
              <g key={`controle-${ponto.id}`}>
                {ponto.tipo === "curvo" && (
                  <>
                    <line
                      x1={ponto.x}
                      y1={ponto.y}
                      x2={p.inX}
                      y2={p.inY}
                      stroke="#22c55e"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      vectorEffect="non-scaling-stroke"
                    />

                    <line
                      x1={ponto.x}
                      y1={ponto.y}
                      x2={p.outX}
                      y2={p.outY}
                      stroke="#22c55e"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      vectorEffect="non-scaling-stroke"
                    />

                    <ellipse
                      data-controle-ponto-forma="alca"
                      cx={50 + (p.inX! - 50) * 0.94}
                      cy={50 + (p.inY! - 50) * 0.94}
                      rx={rxAlca}
                      ry={ryAlca}
                      fill="#22c55e"
                      stroke="#ffffff"
                      strokeWidth={1.2}
                      className="pointer-events-auto cursor-grab"
                      onMouseDown={(e) =>
                        iniciarArrastePercentual(e, (x, y, ev) =>
                          moverAlca(ponto.id, "in", p.inX! + x, p.inY! + y, ev.altKey, e.altKey)
                        )
                      }
                    />

                    <ellipse
                      data-controle-ponto-forma="alca"
                      cx={50 + (p.outX! - 50) * 0.94}
                      cy={50 + (p.outY! - 50) * 0.94}
                      rx={rxAlca}
                      ry={ryAlca}
                      fill="#22c55e"
                      stroke="#ffffff"
                      strokeWidth={1.2}
                      className="pointer-events-auto cursor-grab"
                      onMouseDown={(e) =>
                        iniciarArrastePercentual(e, (x, y, ev) =>
                          moverAlca(ponto.id, "out", p.outX! + x, p.outY! + y, ev.altKey, e.altKey)
                        )
                      }
                    />
                  </>
                )}

                <ellipse
                  cx={50 + (ponto.x - 50) * 0.94}
                  cy={50 + (ponto.y - 50) * 0.94}
                  rx={rxPonto}
                  ry={ryPonto}
                  data-controle-ponto-forma="ancora"
                  data-ponto-forma-campo={campo.id}
                  data-ponto-forma-id={ponto.id}
                  fill={pontoEstaSelecionado ? "#2563eb" : "#ffffff"}
                  stroke={pontoEstaSelecionado ? "#ffffff" : "#2563eb"}
                  strokeWidth={pontoEstaSelecionado ? 2.4 : 1.4}
                  className="pointer-events-auto cursor-grab"
                  onMouseDown={(e) => {
                    e.stopPropagation(); e.preventDefault();
                    if (e.button !== 0) return;
                    const adicionar = e.shiftKey || e.ctrlKey || e.metaKey;
                    const ids = selecionarPontoForma(idsSelecionados, ponto.id, adicionar);
                    selecionar(ids);
                    if (adicionar) return;
                    iniciarArrastePercentual(e, (dx, dy) => moverPontos(ids, dx, dy));
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    alternarTipoPonto(ponto.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deletarPonto(ponto.id);
                    selecionar(idsSelecionados.filter((id) => id !== ponto.id));
                  }}
                />
              </g>
            );
          })}
      </svg>

      {/* Barra de edição de pontos removida daqui.
    Ela será recriada fixa no rodapé da cena no page.tsx. */}

    </div>
  );
}
