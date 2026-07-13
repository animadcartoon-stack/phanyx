"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import JsBarcode from "jsbarcode";

type LadoCracha = "FRENTE" | "VERSO";

type PontoGradiente = {
  id?: number;
  cor: string;
  posicao: number;
};

type DadosCracha = Record<string, string | number | null | undefined>;

type CrachaRendererProps = {
  lado: LadoCracha;

  formato: string;
  larguraMm: number;
  alturaMm: number;

  objetos: any[];

  tipoFundo?: string | null;
  corFundo?: string | null;
  corFundoSecundaria?: string | null;
  direcaoGradiente?: string | null;
  gradientePontos?: PontoGradiente[] | null;

  dados: DadosCracha;

  fotoUrl?: string | null;
  logoUrl?: string | null;
};

function medidasVisuaisPorFormato(formato: string) {
  if (formato === "PAISAGEM") {
    return {
      largura: 380,
      altura: 240,
    };
  }

  if (formato === "QUADRADO" || formato === "REDONDO") {
    return {
      largura: 260,
      altura: 260,
    };
  }

  return {
    largura: 240,
    altura: 380,
  };
}

function fonteCss(fonteFamilia?: string) {
  return `"${fonteFamilia || "Arial"}", Arial, sans-serif`;
}

function substituirTags(
  valor: unknown,
  dados: DadosCracha
) {
  let texto = String(valor ?? "");

  for (const [chave, conteudo] of Object.entries(dados)) {
    const tag = chave.startsWith("{{")
      ? chave
      : `{{${chave}}}`;

    texto = texto.split(tag).join(String(conteudo ?? ""));
  }

  return texto;
}

function direcaoGradienteCss(direcao?: string | null) {
  if (direcao === "HORIZONTAL") {
    return "to right";
  }

  if (direcao === "DIAGONAL_DESC") {
    return "to bottom right";
  }

  if (direcao === "DIAGONAL_ASC") {
    return "to top right";
  }

  return "to bottom";
}

function fundoCrachaCss({
  tipoFundo,
  corFundo,
  corFundoSecundaria,
  direcaoGradiente,
  gradientePontos,
}: {
  tipoFundo?: string | null;
  corFundo?: string | null;
  corFundoSecundaria?: string | null;
  direcaoGradiente?: string | null;
  gradientePontos?: PontoGradiente[] | null;
}) {
  const corPrincipal = corFundo || "#ffffff";

  if (tipoFundo !== "GRADIENTE") {
    return corPrincipal;
  }

  const pontos =
    Array.isArray(gradientePontos) && gradientePontos.length >= 2
      ? [...gradientePontos]
          .sort((a, b) => a.posicao - b.posicao)
          .map(
            (ponto) =>
              `${ponto.cor} ${Math.max(
                0,
                Math.min(100, Number(ponto.posicao))
              )}%`
          )
          .join(", ")
      : `${corPrincipal} 0%, ${
          corFundoSecundaria || corPrincipal
        } 100%`;

  return `linear-gradient(${direcaoGradienteCss(
    direcaoGradiente
  )}, ${pontos})`;
}

function sombraCss(objeto: any) {
  if (!objeto?.sombraAtiva) {
    return "none";
  }

  return `${Number(objeto.sombraX ?? 2)}px ${Number(
    objeto.sombraY ?? 2
  )}px ${Number(objeto.sombraBlur ?? 6)}px ${
    objeto.sombraCor || "#000000"
  }`;
}

function dropShadowCss(objeto: any) {
  const filtros: string[] = [];

  if (
    objeto?.bordaAcabamento === "FOSCA" &&
    objeto?.corBorda
  ) {
    filtros.push(
      `drop-shadow(0 0 ${Number(
        objeto.bordaBlur ?? 3
      )}px ${objeto.corBorda})`
    );
  }

  if (objeto?.sombraAtiva) {
    filtros.push(
      `drop-shadow(${Number(
        objeto.sombraX ?? 2
      )}px ${Number(objeto.sombraY ?? 2)}px ${Number(
        objeto.sombraBlur ?? 6
      )}px ${objeto.sombraCor || "#000000"})`
    );
  }

  return filtros.length ? filtros.join(" ") : "none";
}

function abreviarNomeParaCracha(nomeCompleto: string) {
  const partes = nomeCompleto
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);

  if (partes.length <= 2) {
    return nomeCompleto.trim();
  }

  return `${partes[0]} ${partes[partes.length - 1]}`;
}

function TextoAutomaticoCracha({
  texto,
  tamanhoFonte,
  fonteFamilia,
  cor,
  alinhamento,
  sombra,
}: {
  texto: string;
  tamanhoFonte: number;
  fonteFamilia?: string;
  cor: string;
  alinhamento: "left" | "center" | "right";
  sombra: string;
}) {
  const referencia = useRef<HTMLDivElement | null>(null);

  const [textoExibido, setTextoExibido] = useState(texto);
  const [fonteExibida, setFonteExibida] = useState(tamanhoFonte);

  useEffect(() => {
    setTextoExibido(texto);
    setFonteExibida(tamanhoFonte);
  }, [texto, tamanhoFonte]);

  useEffect(() => {
    const elemento = referencia.current;

    if (!elemento) return;

    let tamanhoAtual = tamanhoFonte;
    let nomeAtual = texto;

    function aindaNaoCabe() {
      return (
        elemento.scrollWidth > elemento.clientWidth + 1 ||
        elemento.scrollHeight > elemento.clientHeight + 1
      );
    }

    elemento.style.fontSize = `${tamanhoAtual}px`;

    while (aindaNaoCabe() && tamanhoAtual > 9) {
      tamanhoAtual -= 1;
      elemento.style.fontSize = `${tamanhoAtual}px`;
    }

    if (aindaNaoCabe()) {
      nomeAtual = abreviarNomeParaCracha(texto);
      setTextoExibido(nomeAtual);
      setFonteExibida(Math.max(9, tamanhoAtual));
      return;
    }

    setFonteExibida(tamanhoAtual);
  }, [texto, tamanhoFonte]);

  return (
    <div
      ref={referencia}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent:
          alinhamento === "left"
            ? "flex-start"
            : alinhamento === "right"
            ? "flex-end"
            : "center",
        color: cor,
        fontFamily: fonteCss(fonteFamilia),
        fontSize: fonteExibida,
        textAlign: alinhamento,
        lineHeight: 1.1,
        whiteSpace: "normal",
        overflow: "hidden",
        overflowWrap: "normal",
        wordBreak: "normal",
        textShadow: sombra,
      }}
    >
      {textoExibido}
    </div>
  );
}

function CodigoBarrasCracha({
  valor,
  cor,
  corFundo,
  mostrarFundo,
  mostrarTexto,
  largura,
  altura,
}: {
  valor: string;
  cor: string;
  corFundo: string;
  mostrarFundo: boolean;
  mostrarTexto: boolean;
  largura: number;
  altura: number;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    try {
      const alturaBarras = Math.max(
        18,
        Number(altura || 48) - (mostrarTexto ? 16 : 4)
      );

      const larguraModulo = Math.max(
  0.8,
  Math.min(
    1.8,
    Number(largura || 160) /
      Math.max(90, String(valor || "PHANYX").length * 14)
  )
);

      JsBarcode(svgRef.current, valor || "PHANYX", {
        format: "CODE128",
        lineColor: cor || "#000000",
        background: mostrarFundo
          ? corFundo || "#ffffff"
          : "transparent",
        width: larguraModulo,
        height: alturaBarras,
        displayValue: mostrarTexto,
        margin: 0,
        fontSize: 12,
      });
    } catch (error) {
      console.error(
        "Erro ao renderizar código de barras do crachá:",
        error
      );
    }
  }, [
    valor,
    cor,
    corFundo,
    mostrarFundo,
    mostrarTexto,
    largura,
    altura,
  ]);

  return (
    <svg
      ref={svgRef}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
      }}
    />
  );
}

function pontosEstrela(
  pontas = 5,
  raioExterno = 48,
  raioInterno = 22
) {
  const quantidade = Math.max(3, Number(pontas || 5));
  const pontos: string[] = [];

  for (let indice = 0; indice < quantidade * 2; indice++) {
    const raio =
      indice % 2 === 0 ? raioExterno : raioInterno;

    const angulo =
      -Math.PI / 2 + (indice * Math.PI) / quantidade;

    const x = 50 + Math.cos(angulo) * raio;
    const y = 50 + Math.sin(angulo) * raio;

    pontos.push(`${x},${y}`);
  }

  return pontos.join(" ");
}

function pontosPoligono(lados = 6, raio = 48) {
  const quantidade = Math.max(3, Number(lados || 6));
  const pontos: string[] = [];

  for (let indice = 0; indice < quantidade; indice++) {
    const angulo =
      -Math.PI / 2 + (indice * Math.PI * 2) / quantidade;

    const x = 50 + Math.cos(angulo) * raio;
    const y = 50 + Math.sin(angulo) * raio;

    pontos.push(`${x},${y}`);
  }

  return pontos.join(" ");
}

function caminhoFormaLivre(objeto: any) {
  const pontos = Array.isArray(objeto?.pontosLivres)
    ? objeto.pontosLivres
    : [];

  if (pontos.length === 0) {
    return "";
  }

  let caminho = `M ${pontos[0].x} ${pontos[0].y}`;

  for (let indice = 1; indice < pontos.length; indice++) {
    const anterior = pontos[indice - 1];
    const atual = pontos[indice];

    if (
      anterior?.tipo === "CURVA" ||
      atual?.tipo === "CURVA"
    ) {
      const saidaX =
        anterior?.alcaSaidaX ?? anterior.x;
      const saidaY =
        anterior?.alcaSaidaY ?? anterior.y;

      const entradaX =
        atual?.alcaEntradaX ?? atual.x;
      const entradaY =
        atual?.alcaEntradaY ?? atual.y;

      caminho += ` C ${saidaX} ${saidaY}, ${entradaX} ${entradaY}, ${atual.x} ${atual.y}`;
    } else {
      caminho += ` L ${atual.x} ${atual.y}`;
    }
  }

  caminho += " Z";

  return caminho;
}

function RenderForma({ objeto }: { objeto: any }) {
  const idGradiente = `cracha-gradiente-${objeto.id}`;

  const estilo =
    objeto.estilo || "SOMENTE_PREENCHIMENTO";

  const mostrarPreenchimento =
    estilo !== "SOMENTE_CONTORNO";

  const mostrarContorno =
    estilo !== "SOMENTE_PREENCHIMENTO";

  const preenchimento =
    objeto.preenchimentoTipo === "GRADIENTE"
      ? `url(#${idGradiente})`
      : mostrarPreenchimento
      ? objeto.corFundo || "#2563eb"
      : "transparent";

  const contorno = mostrarContorno
    ? objeto.corBorda || "#000000"
    : "transparent";

  const espessura = mostrarContorno
    ? Math.max(1, Number(objeto.espessuraBorda || 1))
    : 0;

  const propriedadesComuns = {
    fill: preenchimento,
    stroke: contorno,
    strokeWidth: espessura,
    vectorEffect: "non-scaling-stroke" as const,
  };

  const pontosGradiente =
    Array.isArray(objeto.gradientePontos) &&
    objeto.gradientePontos.length >= 2
      ? [...objeto.gradientePontos].sort(
          (a, b) => a.posicao - b.posicao
        )
      : [
          {
            id: 1,
            cor: objeto.corFundo || "#2563eb",
            posicao: 0,
          },
          {
            id: 2,
            cor: "#ffffff",
            posicao: 100,
          },
        ];

  function gradienteSvg() {
    if (objeto.preenchimentoTipo !== "GRADIENTE") {
      return null;
    }

    if (
      objeto.gradienteTipo === "RADIAL" ||
      objeto.gradienteTipo === "ESFERICO"
    ) {
      return (
        <radialGradient
          id={idGradiente}
          cx={`${objeto.gradienteFocoX ?? 45}%`}
          cy={`${objeto.gradienteFocoY ?? 35}%`}
          r={`${objeto.gradienteRaio ?? 75}%`}
        >
          {pontosGradiente.map((ponto: any) => (
            <stop
              key={ponto.id}
              offset={`${ponto.posicao}%`}
              stopColor={ponto.cor}
            />
          ))}
        </radialGradient>
      );
    }

    let coordenadas = {
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "0%",
    };

    if (objeto.gradienteDirecao === "ESQUERDA") {
      coordenadas = {
        x1: "100%",
        y1: "0%",
        x2: "0%",
        y2: "0%",
      };
    }

    if (objeto.gradienteDirecao === "TOPO") {
      coordenadas = {
        x1: "0%",
        y1: "100%",
        x2: "0%",
        y2: "0%",
      };
    }

    if (objeto.gradienteDirecao === "BASE") {
      coordenadas = {
        x1: "0%",
        y1: "0%",
        x2: "0%",
        y2: "100%",
      };
    }

    if (objeto.gradienteDirecao === "DIAGONAL_DESC") {
      coordenadas = {
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "100%",
      };
    }

    if (objeto.gradienteDirecao === "DIAGONAL_ASC") {
      coordenadas = {
        x1: "0%",
        y1: "100%",
        x2: "100%",
        y2: "0%",
      };
    }

    return (
      <linearGradient
        id={idGradiente}
        {...coordenadas}
      >
        {pontosGradiente.map((ponto: any) => (
          <stop
            key={ponto.id}
            offset={`${ponto.posicao}%`}
            stopColor={ponto.cor}
          />
        ))}
      </linearGradient>
    );
  }

  function conteudoForma() {
    switch (objeto.forma) {
      case "PILULA":
        return (
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            rx="49"
            ry="49"
            {...propriedadesComuns}
          />
        );

      case "CIRCULO":
      case "OVAL":
        return (
          <ellipse
            cx="50"
            cy="50"
            rx="48"
            ry="48"
            {...propriedadesComuns}
          />
        );

      case "LINHA":
        return (
          <line
            x1="2"
            y1="50"
            x2="98"
            y2="50"
            {...propriedadesComuns}
            fill="none"
          />
        );

      case "TRIANGULO":
        return (
          <polygon
            points="50,2 98,98 2,98"
            {...propriedadesComuns}
          />
        );

      case "LOSANGO":
        return (
          <polygon
            points="50,2 98,50 50,98 2,50"
            {...propriedadesComuns}
          />
        );

      case "PARALELOGRAMO":
        return (
          <polygon
            points="22,2 98,2 78,98 2,98"
            {...propriedadesComuns}
          />
        );

      case "SETA_DIREITA":
        return (
          <polygon
            points="2,30 65,30 65,10 98,50 65,90 65,70 2,70"
            {...propriedadesComuns}
          />
        );

      case "SETA_ESQUERDA":
        return (
          <polygon
            points="98,30 35,30 35,10 2,50 35,90 35,70 98,70"
            {...propriedadesComuns}
          />
        );

      case "SETA_CIMA":
        return (
          <polygon
            points="30,98 30,35 10,35 50,2 90,35 70,35 70,98"
            {...propriedadesComuns}
          />
        );

      case "SETA_BAIXO":
        return (
          <polygon
            points="30,2 30,65 10,65 50,98 90,65 70,65 70,2"
            {...propriedadesComuns}
          />
        );

      case "SETA_DUPLA_HORIZONTAL":
        return (
          <polygon
            points="2,50 25,20 25,35 75,35 75,20 98,50 75,80 75,65 25,65 25,80"
            {...propriedadesComuns}
          />
        );

      case "SETA_DUPLA_VERTICAL":
        return (
          <polygon
            points="50,2 80,25 65,25 65,75 80,75 50,98 20,75 35,75 35,25 20,25"
            {...propriedadesComuns}
          />
        );

      case "ESTRELA":
        return (
          <polygon
            points={pontosEstrela(
              objeto.pontas,
              objeto.raioExterno,
              objeto.raioInterno
            )}
            {...propriedadesComuns}
          />
        );

      case "POLIGONO":
        return (
          <polygon
            points={pontosPoligono(objeto.lados)}
            {...propriedadesComuns}
          />
        );

      case "CRUZ":
        return (
          <polygon
            points="38,2 62,2 62,38 98,38 98,62 62,62 62,98 38,98 38,62 2,62 2,38 38,38"
            {...propriedadesComuns}
          />
        );

      case "CORACAO":
        return (
          <path
            d="M50 92 C15 68 2 50 8 28 C14 7 39 4 50 22 C61 4 86 7 92 28 C98 50 85 68 50 92 Z"
            {...propriedadesComuns}
          />
        );

      case "FORMA_LIVRE":
        return (
          <path
            d={caminhoFormaLivre(objeto)}
            {...propriedadesComuns}
          />
        );

      case "RETANGULO":
      default:
        return (
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            rx={Math.max(
              0,
              Math.min(50, Number(objeto.raioBorda || 0))
            )}
            ry={Math.max(
              0,
              Math.min(50, Number(objeto.raioBorda || 0))
            )}
            {...propriedadesComuns}
          />
        );
    }
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        overflow: "visible",
        opacity: Number(objeto.opacidade ?? 100) / 100,
        filter: dropShadowCss(objeto),
        transform: `rotate(${Number(
          objeto.rotacao || 0
        )}deg)`,
        transformOrigin: "center center",
      }}
    >
      <defs>{gradienteSvg()}</defs>

      {conteudoForma()}
    </svg>
  );
}

export default function CrachaRenderer({
  lado,
  formato,
  larguraMm,
  alturaMm,
  objetos,
  tipoFundo,
  corFundo,
  corFundoSecundaria,
  direcaoGradiente,
  gradientePontos,
  dados,
  fotoUrl,
  logoUrl,
}: CrachaRendererProps) {
  const medidasVisuais = medidasVisuaisPorFormato(formato);

  const larguraFisicaPx =
    Math.max(1, Number(larguraMm || 54)) * (96 / 25.4);

  const alturaFisicaPx =
    Math.max(1, Number(alturaMm || 86)) * (96 / 25.4);

  const escalaX =
    larguraFisicaPx / medidasVisuais.largura;

  const escalaY =
    alturaFisicaPx / medidasVisuais.altura;

  const objetosOrdenados = useMemo(() => {
    return Array.isArray(objetos)
      ? [...objetos].sort(
          (a, b) =>
            Number(a?.ordem || 0) -
            Number(b?.ordem || 0)
        )
      : [];
  }, [objetos]);

  const fundo = fundoCrachaCss({
    tipoFundo,
    corFundo,
    corFundoSecundaria,
    direcaoGradiente,
    gradientePontos,
  });

  return (
    <div
      data-cracha-pagina
      data-cracha-lado={lado}
      style={{
        position: "relative",
        width: `${larguraMm}mm`,
        height: `${alturaMm}mm`,
        overflow: "hidden",
        borderRadius: formato === "REDONDO" ? "50%" : 0,
        background: fundo,
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
        breakAfter: "page",
        pageBreakAfter: "always",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: medidasVisuais.largura,
          height: medidasVisuais.altura,
          transform: `scale(${escalaX}, ${escalaY})`,
          transformOrigin: "top left",
        }}
      >
        {objetosOrdenados.map((objeto, indice) => {
          const estiloBase: React.CSSProperties = {
            position: "absolute",
            left: Number(objeto.x || 0),
            top: Number(objeto.y || 0),
            width: Number(objeto.largura || 0),
            height: Number(objeto.altura || 0),
            zIndex: 10 + indice,
            boxSizing: "border-box",
          };

          if (objeto.tipo === "TEXTO") {
            const texto = substituirTags(
              objeto.texto,
              dados
            );

            return (
              <div
                key={objeto.id}
                style={{
                  ...estiloBase,
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    objeto.alinhamento === "left"
                      ? "flex-start"
                      : objeto.alinhamento === "right"
                      ? "flex-end"
                      : "center",
                  color: objeto.cor || "#000000",
                  fontFamily: fonteCss(
                    objeto.fonteFamilia
                  ),
                  fontSize: Number(objeto.fonte || 16),
                  textAlign: objeto.alinhamento || "center",
                  lineHeight: 1.15,
                  whiteSpace: "pre-wrap",
                  overflow: "hidden",
                  textShadow: sombraCss(objeto),
                }}
              >
                {texto}
              </div>
            );
          }

          if (objeto.tipo === "CAMPO") {
            const texto = substituirTags(
              objeto.campo,
              dados
            );

            return (
  <div
    key={objeto.id}
    style={{
      ...estiloBase,
      overflow: "hidden",
    }}
  >
    <TextoAutomaticoCracha
      texto={texto}
      tamanhoFonte={Number(objeto.fonte || 16)}
      fonteFamilia={objeto.fonteFamilia}
      cor={objeto.cor || "#000000"}
      alinhamento={objeto.alinhamento || "center"}
      sombra={sombraCss(objeto)}
    />
  </div>
);
          }

          if (objeto.tipo === "IMAGEM") {
            const url =
              objeto.origem === "FOTO"
                ? fotoUrl
                : objeto.origem === "LOGO"
                ? objeto.url || logoUrl
                : objeto.url;

            if (!url) {
              return null;
            }

            return (
              <div
                key={objeto.id}
                style={{
                  ...estiloBase,
                  borderRadius: Number(
                    objeto.raioBorda || 0
                  ),
                  overflow:
                    objeto.sombraModo === "DROP"
                      ? "visible"
                      : "hidden",
                  boxShadow:
                    objeto.sombraModo === "BOX"
                      ? sombraCss(objeto)
                      : "none",
                  filter:
                    objeto.sombraModo === "DROP" &&
                    objeto.sombraAtiva
                      ? `drop-shadow(${Number(
                          objeto.sombraX ?? 2
                        )}px ${Number(
                          objeto.sombraY ?? 2
                        )}px ${Number(
                          objeto.sombraBlur ?? 6
                        )}px ${
                          objeto.sombraCor || "#000000"
                        })`
                      : "none",
                }}
              >
                <img
                  src={url}
                  alt=""
                  crossOrigin="anonymous"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit:
                      objeto.ajusteImagem || "cover",
                    borderRadius: Number(
                      objeto.raioBorda || 0
                    ),
                  }}
                />
              </div>
            );
          }

          if (objeto.tipo === "QRCODE") {
            const valor = substituirTags(
              objeto.valor,
              dados
            );

            return (
              <div
                key={objeto.id}
                style={{
                  ...estiloBase,
                  padding: Number(objeto.margem || 0),
                  borderRadius: Number(
                    objeto.raioBorda || 0
                  ),
                  background:
                    objeto.mostrarFundo !== false
                      ? objeto.corFundo || "#ffffff"
                      : "transparent",
                  boxShadow: sombraCss(objeto),
                }}
              >
                <QRCodeSVG
                  value={
                    valor ||
                    "https://www.phanyx.com.br"
                  }
                  bgColor={
                    objeto.mostrarFundo !== false
                      ? objeto.corFundo || "#ffffff"
                      : "transparent"
                  }
                  fgColor={objeto.cor || "#000000"}
                  level="M"
                  includeMargin={false}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
            );
          }

          if (objeto.tipo === "CODIGO_BARRAS") {
            const valor = substituirTags(
              objeto.valor,
              dados
            );

            return (
              <div
                key={objeto.id}
                style={{
                  ...estiloBase,
                  padding: 4,
                  borderRadius: Number(
                    objeto.raioBorda || 0
                  ),
                  background:
                    objeto.mostrarFundo !== false
                      ? objeto.corFundo || "#ffffff"
                      : "transparent",
                  boxShadow: sombraCss(objeto),
                  overflow: "hidden",
                }}
              >
                <CodigoBarrasCracha
                  valor={valor || "PHANYX"}
                  cor={objeto.cor || "#000000"}
                  corFundo={
                    objeto.corFundo || "#ffffff"
                  }
                  mostrarFundo={
                    objeto.mostrarFundo !== false
                  }
                  mostrarTexto={Boolean(
                    objeto.mostrarTexto
                  )}
                  largura={Number(objeto.largura || 160)}
                  altura={Number(objeto.altura || 48)}
                />
              </div>
            );
          }

          if (objeto.tipo === "FORMA") {
            return (
              <div
                key={objeto.id}
                style={{
                  ...estiloBase,
                  overflow: "visible",
                }}
              >
                <RenderForma objeto={objeto} />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}