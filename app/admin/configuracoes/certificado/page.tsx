"use client";

import Image from "next/image";
import FormaVetorial from "./components/FormaVetorial";
import FloatingShapeInspector from "./components/FloatingShapeInspector";
import PhanyxToast from "@/components/ui/PhanyxToast";
import CertificadoRender from "@/components/certificados/CertificadoRender";
import { useLocale, useTranslations } from "next-intl";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";


type CampoCertificado = {
  id: number;
  tipo: string;
  x: number;
  y: number;
  largura?: number | null;
  altura?: number | null;
  sombraAtiva?: boolean | null;
  sombraX?: number | null;
  sombraY?: number | null;
  sombraBlur?: number | null;
  sombraCor?: string | null;
  sombraOpacidade?: number | null;
  fonte?: string | null;
  tamanho?: number | null;
  cor?: string | null;
  preenchimentoCor?: string | null;
  contornoCor?: string | null;
  contornoEspessura?: number | null;
  mostrarPreenchimento?: boolean | null;
  mostrarContorno?: boolean | null;
  ladosOcultos?: {
    topo?: boolean;
    direita?: boolean;
    baixo?: boolean;
    esquerda?: boolean;
  } | null;
  alinhamento?: string | null;
  pagina?: number | null;
  negrito?: boolean;
  italico?: boolean;
  sublinhado?: boolean;

  contornoTextoAtivo?: boolean | null;
  contornoTextoCor?: string | null;
  contornoTextoEspessura?: number | null;
  contornoTextoTipo?: "interno" | "externo" | null;

  ordem?: number | null;
  grupoId?: string | null;
  lineHeight?: number | null;
  marcador?: string | null;
  quantidadeDisciplinas?: number | null;
  colunasDisciplinas?: number | null;
  espacoColunasDisciplinas?: number | null;
  dadosJson?: any;
  imagemUrl?: string | null;
  opacity?: number | null;
  objectFit?: string | null;
  rotate?: number | null;
  flipX?: boolean | null;
  flipY?: boolean | null;
  filter?: string | null;

  forma?:
  | "RETANGULO"
  | "QUADRADO"
  | "CIRCULO"
  | "LINHA"
  | "ESTRELA"
  | "TRIANGULO"
  | "SETA"
  | "LOSANGO"
  | "LIVRE"
  | null;

  raioBorda?: number | null;
  pontasEstrela?: number | null;
  profundidadeEstrela?: number | null;
  arredondarEstrela?: number | null;
  cor2?: string | null;
  usarGradiente?: boolean | null;
  direcaoGradiente?: string | null;
  texto?: string | null;
  textoHtml?: string | null;
  textoTipo?: "TITULO" | "TEXTO" | null;
  bloqueado?: boolean | null;
  nomeCamada?: string | null;

  crop?: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };

  cropBaseW?: number | null;
  cropBaseH?: number | null;

  degradeTipo?: "linear" | "radial" | null;
  degradeAngulo?: number | null;
  degradeStops?: { cor: string; posicao: number }[] | null;

  sombraAngulo?: number | null;
  sombraDistancia?: number | null;
  pontosForma?:
  | {
    id: string;
    x: number;
    y: number;
    tipo?: "reto" | "curvo";
    inX?: number;
    inY?: number;
    outX?: number;
    outY?: number;
  }[]
  | null;

  array?: {
    ativo: boolean;
    quantidade: number;
    deslocamentoX: number;
    deslocamentoY: number;
    rotacao: number;
    escala: number;
    opacidade: number;
  } | null;

  textoModo?: "NORMAL" | "VERTICAL" | "ARCO" | null;
  arcoRaio?: number | null;
  arcoAngulo?: number | null;
  arcoInvertido?: boolean | null;
};

type ModalidadeCertificadoValor =
  | "GERAL"
  | "BACHARELADO"
  | "LICENCIATURA"
  | "TECNOLOGO"
  | "POS_GRADUACAO"
  | "MBA"
  | "MESTRADO"
  | "DOUTORADO"
  | "TECNICO"
  | "CURSO_LIVRE"
  | "OFICINA"
  | "ENSINO_MEDIO"
  | "ENSINO_FUNDAMENTAL"
  | "EDUCACAO_INFANTIL"
  | "PRE_ESCOLA"
  | "EXTENSAO"
  | "CAPACITACAO"
  | "TREINAMENTO"
  | "EJA"
  | "OUTRO";

type FiltroSituacaoModelo = "TODOS" | "RASCUNHOS" | "PUBLICADOS";

type OrdemListaModelos = "MAIS_RECENTES" | "MAIS_ANTIGOS";

const MODALIDADES_CERTIFICADO: {
  valor: ModalidadeCertificadoValor;
  label: string;
}[] = [
    { valor: "GERAL", label: "Geral" },
    { valor: "BACHARELADO", label: "Bacharelado" },
    { valor: "LICENCIATURA", label: "Licenciatura" },
    { valor: "TECNOLOGO", label: "Tecnólogo" },
    { valor: "POS_GRADUACAO", label: "Pós-graduação" },
    { valor: "MBA", label: "MBA" },
    { valor: "MESTRADO", label: "Mestrado" },
    { valor: "DOUTORADO", label: "Doutorado" },
    { valor: "TECNICO", label: "Curso Técnico" },
    { valor: "CURSO_LIVRE", label: "Curso Livre" },
    { valor: "OFICINA", label: "Oficina" },
    { valor: "ENSINO_MEDIO", label: "Ensino Médio" },
    {
      valor: "ENSINO_FUNDAMENTAL",
      label: "Ensino Fundamental",
    },
    {
      valor: "EDUCACAO_INFANTIL",
      label: "Educação Infantil",
    },
    { valor: "PRE_ESCOLA", label: "Pré-escola" },
    { valor: "EXTENSAO", label: "Extensão" },
    { valor: "CAPACITACAO", label: "Capacitação" },
    { valor: "TREINAMENTO", label: "Treinamento" },
    { valor: "EJA", label: "EJA" },
    { valor: "OUTRO", label: "Outro" },
  ];

const FONTES = [
  // Padrão
  "Arial",
  "Calibri",
  "Times New Roman",
  "Verdana",
  "Tahoma",
  "Georgia",

  // Modernas
  "Poppins",
  "Montserrat",
  "Roboto",
  "Open Sans",
  "Lato",

  // Elegantes
  "Playfair Display",
  "Merriweather",
  "Libre Baskerville",

  // Cursivas / caligrafia
  "Dancing Script",
  "Great Vibes",
  "Pacifico",
  "Satisfy",
  "Allura",
  "Alex Brush",
  "Sacramento",

  // Manuscritas
  "Indie Flower",
  "Caveat",
];

const TAMANHOS_PAPEL = {
  A5: {
    retrato: { largura: 560, altura: 794, label: "A5 Retrato" },
    paisagem: { largura: 794, altura: 560, label: "A5 Paisagem" },
  },
  A4: {
    retrato: { largura: 794, altura: 1123, label: "A4 Retrato" },
    paisagem: { largura: 1123, altura: 794, label: "A4 Paisagem" },
  },
  A3: {
    retrato: { largura: 1123, altura: 1587, label: "A3 Retrato" },
    paisagem: { largura: 1123, altura: 794, label: "A3 Paisagem" },
  },
} as const;

type OrientacaoEditor = "paisagem" | "retrato";

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex: string) {
  const limpo = hex.replace("#", "");
  const bigint = parseInt(limpo, 16);

  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map((valor) =>
        Math.max(0, Math.min(255, valor)).toString(16).padStart(2, "0"),
      )
      .join("")
  );
}

function normalizarMarcadorDisciplinas(valor: any) {
  const marcador = String(valor ?? "").trim();

  if (!marcador) return "";

  const normalizado = marcador.toLowerCase();

  if (
    normalizado === "nenhum" ||
    normalizado === "sem" ||
    normalizado === "sem marcador" ||
    normalizado === "none" ||
    normalizado === "null" ||
    normalizado === "undefined"
  ) {
    return "";
  }

  if (normalizado === "bolinha") return "•";
  if (normalizado === "seta" || normalizado === "setinha") return "➤";
  if (
    normalizado === "traco" ||
    normalizado === "traço" ||
    normalizado === "tracinho"
  ) {
    return "-";
  }

  return marcador;
}

function quantidadeDisciplinasDoCampo(campo: Partial<CampoCertificado>) {
  const quantidade = Number((campo as any)?.quantidadeDisciplinas ?? 3);

  if (!Number.isFinite(quantidade)) return 3;

  return Math.max(1, Math.min(80, Math.round(quantidade)));
}

function textoDisciplinasExemplo(
  campo: Partial<CampoCertificado>,
  disciplinaLabel = "Disciplina",
) {
  const quantidade = quantidadeDisciplinasDoCampo(campo);
  const marcador = normalizarMarcadorDisciplinas(
    campo.marcador ?? campo.dadosJson?.marcador,
  );

  return Array.from({ length: quantidade })
    .map((_, index) =>
      marcador
        ? `${marcador} ${disciplinaLabel} ${index + 1}`
        : `${disciplinaLabel} ${index + 1}`,
    )
    .join("\n");
}

function quantidadeColunasDisciplinasDoCampo(campo: Partial<CampoCertificado>) {
  const colunas = Number((campo as any)?.colunasDisciplinas ?? 1);

  if (!Number.isFinite(colunas)) return 1;

  return Math.max(1, Math.min(4, Math.round(colunas)));
}

function listaDisciplinasExemplo(
  campo: Partial<CampoCertificado>,
  disciplinaLabel = "Disciplina",
) {
  const quantidade = quantidadeDisciplinasDoCampo(campo);
  const marcador = normalizarMarcadorDisciplinas(
    campo.marcador ?? campo.dadosJson?.marcador,
  );

  return Array.from({ length: quantidade }).map((_, index) =>
    marcador
      ? `${marcador} ${disciplinaLabel} ${index + 1}`
      : `${disciplinaLabel} ${index + 1}`,
  );
}

function espacoColunasDisciplinasDoCampo(campo: Partial<CampoCertificado>) {
  const espaco = Number((campo as any)?.espacoColunasDisciplinas ?? 12);

  if (!Number.isFinite(espaco)) return 12;

  return Math.max(0, Math.min(80, Math.round(espaco)));
}

function renderDisciplinasCampo(
  campo: CampoCertificado,
  disciplinaLabel = "Disciplina",
) {
  const colunas = quantidadeColunasDisciplinasDoCampo(campo);
  const espacoColunas = espacoColunasDisciplinasDoCampo(campo);
  const disciplinas = listaDisciplinasExemplo(campo, disciplinaLabel);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))`,
        columnGap: `${espacoColunas}px`,
        rowGap: "2px",
        alignContent: "center",
        justifyItems:
          campo.alinhamento === "center"
            ? "center"
            : campo.alinhamento === "right"
              ? "end"
              : "start",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {disciplinas.map((disciplina, index) => (
        <div
          key={`${campo.id}-disciplina-${index}`}
          style={{
            minWidth: 0,
            width: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {disciplina}
        </div>
      ))}
    </div>
  );
}

function cssColorToHex(cor: string) {
  if (!cor) return "";

  if (cor.startsWith("#")) {
    return cor.toLowerCase();
  }

  const match = cor.match(/\d+/g);

  if (!match || match.length < 3) {
    return "";
  }

  return rgbToHex(Number(match[0]), Number(match[1]), Number(match[2]));
}

function calcularSombra(angulo: number, distancia: number) {
  const rad = (angulo * Math.PI) / 180;

  return {
    x: Math.cos(rad) * distancia,
    y: Math.sin(rad) * distancia,
  };
}

function normalizarOpacidadeEfeito(valor: any, padrao = 0.35) {
  if (valor === null || valor === undefined || valor === "") return padrao;

  const numero = Number(valor);

  if (!Number.isFinite(numero)) return padrao;

  if (numero > 1) {
    return Math.max(0, Math.min(1, numero / 100));
  }

  return Math.max(0, Math.min(1, numero));
}

function gerarContornoTextoCss(cor: string, espessura: number) {
  const e = Math.max(1, Math.round(Number(espessura || 1)));
  const sombras: string[] = [];

  for (let x = -e; x <= e; x++) {
    for (let y = -e; y <= e; y++) {
      if (x === 0 && y === 0) continue;

      sombras.push(`${x}px ${y}px 0 ${cor}`);
    }
  }

  return sombras.join(", ");
}

function efeitosTextoCampoCss(campo: Partial<CampoCertificado>) {
  const sombras: string[] = [];

  const contornoAtivo = !!campo.contornoTextoAtivo;
  const contornoCor = campo.contornoTextoCor || "#000000";
  const contornoEspessura = Number(campo.contornoTextoEspessura || 1);
  const contornoTipo = campo.contornoTextoTipo || "externo";

  if (contornoAtivo && contornoTipo === "externo") {
    const contorno = gerarContornoTextoCss(contornoCor, contornoEspessura);

    if (contorno) {
      sombras.push(contorno);
    }
  }

  if (campo.sombraAtiva) {
    const cor = campo.sombraCor || "#000000";
    const opacidade = normalizarOpacidadeEfeito(campo.sombraOpacidade, 0.35);

    const distancia =
      campo.sombraDistancia !== null && campo.sombraDistancia !== undefined
        ? Number(campo.sombraDistancia)
        : 4;

    const angulo =
      campo.sombraAngulo !== null && campo.sombraAngulo !== undefined
        ? Number(campo.sombraAngulo)
        : 45;

    const deslocamento = calcularSombra(angulo, distancia);

    const x =
      campo.sombraX !== null && campo.sombraX !== undefined
        ? Number(campo.sombraX)
        : deslocamento.x;

    const y =
      campo.sombraY !== null && campo.sombraY !== undefined
        ? Number(campo.sombraY)
        : deslocamento.y;

    const blur =
      campo.sombraBlur !== null && campo.sombraBlur !== undefined
        ? Number(campo.sombraBlur)
        : 8;

    sombras.push(`${x}px ${y}px ${blur}px ${hexToRgba(cor, opacidade)}`);
  }

  return {
    textShadow: sombras.length ? sombras.join(", ") : "none",

    WebkitTextStrokeColor:
      contornoAtivo && contornoTipo === "interno" ? contornoCor : "transparent",

    WebkitTextStrokeWidth:
      contornoAtivo && contornoTipo === "interno"
        ? `${contornoEspessura}px`
        : "0px",

    paintOrder: contornoAtivo ? "stroke fill" : "normal",
  } as React.CSSProperties;
}

function transformacaoCampoCss(campo: Partial<CampoCertificado>) {
  const rotate = Number(campo.rotate || 0);
  const scaleX = campo.flipX ? -1 : 1;
  const scaleY = campo.flipY ? -1 : 1;

  return `rotate(${rotate}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
}

function sombraProjetadaCss(campo: Partial<CampoCertificado>) {
  if (!campo?.sombraAtiva) return "none";

  const cor = campo.sombraCor || "#000000";

  const opacidadeBruta =
    campo.sombraOpacidade === null || campo.sombraOpacidade === undefined
      ? 0.35
      : Number(campo.sombraOpacidade);

  const opacidade =
    opacidadeBruta > 1
      ? Math.max(0, Math.min(1, opacidadeBruta / 100))
      : Math.max(0, Math.min(1, opacidadeBruta));

  const x =
    campo.sombraX !== null && campo.sombraX !== undefined
      ? Number(campo.sombraX)
      : 3;

  const y =
    campo.sombraY !== null && campo.sombraY !== undefined
      ? Number(campo.sombraY)
      : 3;

  const blur =
    campo.sombraBlur !== null && campo.sombraBlur !== undefined
      ? Number(campo.sombraBlur)
      : 6;

  return `${x}px ${y}px ${blur}px ${hexToRgba(cor, opacidade)}`;
}

function criarPontosIniciaisForma(forma?: CampoCertificado["forma"]) {
  if (forma === "LINHA") {
    return [
      { id: "p1", x: 0, y: 50, tipo: "reto" as const },
      { id: "p2", x: 100, y: 50, tipo: "reto" as const },
    ];
  }

  if (forma === "SETA") {
    return [
      { id: "p1", x: 0, y: 30, tipo: "reto" as const },
      { id: "p2", x: 62, y: 30, tipo: "reto" as const },
      { id: "p3", x: 62, y: 0, tipo: "reto" as const },
      { id: "p4", x: 100, y: 50, tipo: "reto" as const },
      { id: "p5", x: 62, y: 100, tipo: "reto" as const },
      { id: "p6", x: 62, y: 70, tipo: "reto" as const },
      { id: "p7", x: 0, y: 70, tipo: "reto" as const },
    ];
  }

  if (forma === "LOSANGO") {
    return [
      { id: "p1", x: 50, y: 0, tipo: "reto" as const },
      { id: "p2", x: 100, y: 50, tipo: "reto" as const },
      { id: "p3", x: 50, y: 100, tipo: "reto" as const },
      { id: "p4", x: 0, y: 50, tipo: "reto" as const },
    ];
  }

  if (forma === "TRIANGULO") {
    return [
      { id: "p1", x: 50, y: 0, tipo: "reto" as const },
      { id: "p2", x: 100, y: 100, tipo: "reto" as const },
      { id: "p3", x: 0, y: 100, tipo: "reto" as const },
    ];
  }

  if (forma === "RETANGULO" || forma === "QUADRADO") {
    return [
      { id: "p1", x: 0, y: 0, tipo: "reto" as const },
      { id: "p2", x: 100, y: 0, tipo: "reto" as const },
      { id: "p3", x: 100, y: 100, tipo: "reto" as const },
      { id: "p4", x: 0, y: 100, tipo: "reto" as const },
    ];
  }

  if (forma === "CIRCULO") {
    return [
      {
        id: "p1",
        x: 50,
        y: 0,
        tipo: "curvo" as const,
        inX: 22.386,
        inY: 0,
        outX: 77.614,
        outY: 0,
        handleMode: "alinhado" as const,
      },
      {
        id: "p2",
        x: 100,
        y: 50,
        tipo: "curvo" as const,
        inX: 100,
        inY: 22.386,
        outX: 100,
        outY: 77.614,
        handleMode: "alinhado" as const,
      },
      {
        id: "p3",
        x: 50,
        y: 100,
        tipo: "curvo" as const,
        inX: 77.614,
        inY: 100,
        outX: 22.386,
        outY: 100,
        handleMode: "alinhado" as const,
      },
      {
        id: "p4",
        x: 0,
        y: 50,
        tipo: "curvo" as const,
        inX: 0,
        inY: 77.614,
        outX: 0,
        outY: 22.386,
        handleMode: "alinhado" as const,
      },
    ];
  }

  if (forma === "ESTRELA") {
    const cx = 50;
    const cy = 50;

    const pontas = 5;
    const raioExterno = 50;
    const raioInterno = 22;

    const pontos = [];

    for (let i = 0; i < pontas * 2; i++) {
      const angulo = (Math.PI * i) / pontas - Math.PI / 2;

      const raio = i % 2 === 0 ? raioExterno : raioInterno;

      const x = cx + Math.cos(angulo) * raio;
      const y = cy + Math.sin(angulo) * raio;

      pontos.push({
        id: `p${i + 1}`,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        tipo: "reto" as const,
      });
    }

    return pontos;
  }

  return null;
}

type TemaEditorCertificado = "light" | "dark" | "system";

type ModoVisualEditorCertificado =
  | "light"
  | "dark"
  | "system-dark";

export default function ConfiguracaoCertificadoPage() {
  const locale = useLocale();
  const t = useTranslations("AdminCertificateEditor");

  const tr = (chave: string, valores?: Record<string, string | number>) =>
    t(chave as any, valores as any);

  const [temaAtual, setTemaAtual] =
    useState<TemaEditorCertificado>("light");

  const [sistemaEscuro, setSistemaEscuro] = useState(false);

  const temaAzul = temaAtual === "dark";

  const temaEscuro =
    temaAtual === "dark" ||
    (temaAtual === "system" && sistemaEscuro);

  const modoVisual: ModoVisualEditorCertificado =
    temaAtual === "dark"
      ? "dark"
      : temaAtual === "system" && sistemaEscuro
        ? "system-dark"
        : "light";

  const moldurasPaisagem = [
    "/molduras-certificado/modo-paisagem/moldura-01.png",
    "/molduras-certificado/modo-paisagem/moldura-02.png",
    "/molduras-certificado/modo-paisagem/moldura-03.png",
    "/molduras-certificado/modo-paisagem/moldura-04.png",
    "/molduras-certificado/modo-paisagem/moldura-05.png",
    "/molduras-certificado/modo-paisagem/moldura-06.png",
    "/molduras-certificado/modo-paisagem/moldura-07.png",
  ];

  const moldurasRetrato = [
    "/molduras-certificado/modo-retrato/moldura-08.png",
    "/molduras-certificado/modo-retrato/moldura-09.png",
    "/molduras-certificado/modo-retrato/moldura-10.png",
    "/molduras-certificado/modo-retrato/moldura-11.png",
    "/molduras-certificado/modo-retrato/moldura-12.png",
    "/molduras-certificado/modo-retrato/moldura-13.png",
    "/molduras-certificado/modo-retrato/moldura-14.png",
  ];

  const figurasDecorativas = [
    "/figuras/figura-01.png",
    "/figuras/figura-02.png",
    "/figuras/figura-03.png",
    "/figuras/figura-04.png",
    "/figuras/figura-05.png",
    "/figuras/figura-06.png",
    "/figuras/figura-07.png",
    "/figuras/figura-08.png",
    "/figuras/figura-09.png",
    "/figuras/figura-10.png",
    "/figuras/figura-11.png",
    "/figuras/figura-12.png",
    "/figuras/figura-13.png",
  ];

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function lerTemaAtual() {
      const escolhaSalva = String(
        localStorage.getItem("phanyx_tema") ||
        document.documentElement.dataset.themeChoice ||
        document.documentElement.dataset.theme ||
        (document.documentElement.classList.contains("dark") ? "dark" : "light"),
      ).toLowerCase();

      const escolha: TemaEditorCertificado =
        escolhaSalva === "dark"
          ? "dark"
          : escolhaSalva === "system"
            ? "system"
            : "light";

      setTemaAtual(escolha);
      setSistemaEscuro(media.matches);
    }

    lerTemaAtual();

    const observer = new MutationObserver(lerTemaAtual);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "class",
        "data-theme",
        "data-theme-choice",
      ],
    });

    const aoMudarPreferenciaSistema = () => {
      setSistemaEscuro(media.matches);
    };

    const aoMudarStorage = (evento: StorageEvent) => {
      if (!evento.key || evento.key === "phanyx_tema") {
        lerTemaAtual();
      }
    };

    const aoMudarTemaPhanyx = () => {
      lerTemaAtual();
    };

    media.addEventListener("change", aoMudarPreferenciaSistema);
    window.addEventListener("storage", aoMudarStorage);
    window.addEventListener(
      "phanyx-theme-change",
      aoMudarTemaPhanyx,
    );

    return () => {
      observer.disconnect();

      media.removeEventListener(
        "change",
        aoMudarPreferenciaSistema,
      );

      window.removeEventListener("storage", aoMudarStorage);

      window.removeEventListener(
        "phanyx-theme-change",
        aoMudarTemaPhanyx,
      );
    };
  }, []);

  function traduzirModalidadeCertificado(valor: unknown) {
    const modalidade = String(valor || "GERAL").toUpperCase();

    const modalidadeValida = MODALIDADES_CERTIFICADO.some(
      (item) => item.valor === modalidade,
    )
      ? (modalidade as ModalidadeCertificadoValor)
      : "GERAL";

    return t(`modalities.${modalidadeValida}`);
  }

  function traduzirFormaCertificado(valor: unknown) {
    const forma = String(valor || "").toUpperCase();
    const formasConhecidas = [
      "RETANGULO",
      "QUADRADO",
      "CIRCULO",
      "LINHA",
      "ESTRELA",
      "TRIANGULO",
      "SETA",
      "LOSANGO",
      "LIVRE",
    ];

    return formasConhecidas.includes(forma)
      ? tr(`shapes.${forma}`)
      : String(valor || tr("layers.shape"));
  }

  function traduzirTipoCampoCertificado(valor: unknown) {
    const tipo = String(valor || "").toUpperCase();
    const tiposConhecidos = [
      "TEXTO_LIVRE", "IMAGEM", "FORMA", "NOME_ALUNO", "NUMERO_MATRICULA",
      "CPF_ALUNO", "RG_ALUNO", "NOME_CURSO", "DISCIPLINAS_CONCLUIDAS",
      "CARGA_HORARIA", "ANO_CONCLUSAO", "DATA_CONCLUSAO", "APROVEITAMENTO",
      "FREQUENCIA_TOTAL", "MODALIDADE", "TURMA", "POLO", "NOME_INSTITUICAO",
      "CNPJ_INSTITUICAO", "CIDADE", "DATA_EMISSAO", "NOME_DIRETOR",
      "ASSINATURA", "LOGO_INSTITUICAO", "NUMERO_CERTIFICADO", "QR_CODE",
      "CODIGO_VALIDACAO",
    ];

    return tiposConhecidos.includes(tipo)
      ? tr(`fieldTypes.${tipo}`)
      : String(valor || tr("layers.element"));
  }

  const [menuContexto, setMenuContexto] = useState<{
    x: number;
    y: number;
    campoId: number;
  } | null>(null);

  const [shapeInspectorAberto, setShapeInspectorAberto] = useState(false);

  const [shapeInspectorPosicao, setShapeInspectorPosicao] = useState({
    x: 520,
    y: 180,
  });

  const [previewAberto, setPreviewAberto] = useState(false);

  const [certificadoTemplateUrl, setCertificadoTemplateUrl] = useState("");
  const [certificadoPreviewUrl, setCertificadoPreviewUrl] = useState("");
  const [certificadoCoordenadorNome, setCertificadoCoordenadorNome] =
    useState("");
  const [certificadoCidade, setCertificadoCidade] = useState("");
  const [planoInstituicao, setPlanoInstituicao] = useState("ESSENCIAL");
  const [certificadoAssinaturaUrl, setCertificadoAssinaturaUrl] = useState("");
  const [nomeDiretorInstituicao, setNomeDiretorInstituicao] = useState("");
  const [arquivoModelo, setArquivoModelo] = useState<File | null>(null);
  const [popupDisciplinasAberto, setPopupDisciplinasAberto] = useState(false);
  const [painelCampoAberto, setPainelCampoAberto] = useState(true);
  const [opcoesImagemAberto, setOpcoesImagemAberto] = useState(true);
  const [sombraAberta, setSombraAberta] = useState(true);
  const [campos, setCampos] = useState<CampoCertificado[]>([]);
  const [historico, setHistorico] = useState<CampoCertificado[][]>([]);
  const [futuro, setFuturo] = useState<CampoCertificado[][]>([]);
  const [campoCopiado, setCampoCopiado] = useState<any>(null);

  const [barraSelecaoPosicao, setBarraSelecaoPosicao] = useState({
    x: 260,
    y: 150,
  });

  const [
    barraSelecaoMinimizada,
    setBarraSelecaoMinimizada,
  ] = useState(false);

  const [arrayJanelaPos, setArrayJanelaPos] = useState({
    x: 180,
    y: 180,
  });

  const [arrastandoArray, setArrastandoArray] = useState(false);
  const [arrayAngulo, setArrayAngulo] = useState(0);

  const historicoTextoLivreRef = useRef<Record<number, string[]>>({});

  const [tipoContornoTexto, setTipoContornoTexto] = useState<
    "interno" | "externo"
  >("externo");
  const [opcoesTextoAberto, setOpcoesTextoAberto] = useState(false);
  const [espacamentoLetrasTexto, setEspacamentoLetrasTexto] = useState(0);
  const [espacamentoPalavrasTexto, setEspacamentoPalavrasTexto] = useState(0);

  const [tamanhoSelecaoTexto, setTamanhoSelecaoTexto] = useState(18);

  const [menuPontoGradiente, setMenuPontoGradiente] = useState<{
    campoId: number;
    pontoIndex: number;
    x: number;
    y: number;
  } | null>(null);

  function desfazer() {
    setHistorico((prev) => {
      if (prev.length === 0) return prev;

      const ultimo = prev[prev.length - 1];

      setFuturo((fut) => [campos, ...fut]);
      setCampos(ultimo);

      return prev.slice(0, -1);
    });
  }

  function refazer() {
    setFuturo((prev) => {
      if (prev.length === 0) return prev;

      const proximo = prev[0];

      setHistorico((hist) => [...hist, campos]);
      setCampos(proximo);

      return prev.slice(1);
    });
  }

  function pontosFormaParaSvg(campo: any) {
    const pontos = Array.isArray(campo?.pontosForma) ? campo.pontosForma : [];

    if (pontos.length === 0) return "";

    const xs = pontos.map((p: any) => Number(p.x || 0));
    const ys = pontos.map((p: any) => Number(p.y || 0));

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const largura = Math.max(1, maxX - minX);
    const altura = Math.max(1, maxY - minY);

    return pontos
      .map((p: any) => {
        const x = ((Number(p.x || 0) - minX) / largura) * 100;
        const y = ((Number(p.y || 0) - minY) / altura) * 100;

        return `${x},${y}`;
      })
      .join(" ");
  }

  function registrarHistoricoAntesDaAcao() {
    setHistorico((prev) => [...prev, JSON.parse(JSON.stringify(campos))]);
    setFuturo([]);
  }

  function agruparCamposSelecionados() {
    if (camposSelecionadosIds.length < 2) return;

    registrarHistoricoAntesDaAcao();

    const novoGrupoId = `grupo-${Date.now()}`;

    setCampos((prev) =>
      prev.map((campo) =>
        camposSelecionadosIds.includes(campo.id)
          ? { ...campo, grupoId: novoGrupoId }
          : campo,
      ),
    );
  }

  function desagruparCampoSelecionado() {
    if (!campoSelecionado) return;

    registrarHistoricoAntesDaAcao();

    const grupoId = campoSelecionado.grupoId;
    if (!grupoId) return;

    setCampos((prev) =>
      prev.map((campo) =>
        campo.grupoId === grupoId ? { ...campo, grupoId: null } : campo,
      ),
    );
  }

  useEffect(() => {
    function fecharMenusAoClicarFora(e: globalThis.MouseEvent) {
      const alvo = e.target as HTMLElement | null;

      if (
        alvo?.closest("[data-menu-contexto-certificado]") ||
        alvo?.closest("[data-menu-camada-certificado]") ||
        alvo?.closest("[data-menu-gradiente-certificado]") ||
        alvo?.closest("[data-barra-selecao-certificado]") ||
        alvo?.closest("[data-shape-inspector-certificado]") ||
        alvo?.closest("[data-array-modal-certificado]")
      ) {
        return;
      }

      setMenuContexto(null);
      setMenuCamada(null);
      setMenuPontoGradiente(null);
    }

    function fecharMenusComEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;

      setMenuContexto(null);
      setMenuCamada(null);
      setMenuPontoGradiente(null);
      setShapeInspectorAberto(false);
    }

    window.addEventListener("mousedown", fecharMenusAoClicarFora);
    window.addEventListener("keydown", fecharMenusComEsc);

    return () => {
      window.removeEventListener("mousedown", fecharMenusAoClicarFora);
      window.removeEventListener("keydown", fecharMenusComEsc);
    };
  }, []);

  function atualizarCamposComHistorico(
    atualizador:
      CampoCertificado[] | ((prev: CampoCertificado[]) => CampoCertificado[]),
  ) {
    setCampos((prev) => {
      setHistorico((hist) => [...hist, prev]);
      setFuturo([]);

      if (typeof atualizador === "function") {
        return atualizador(prev);
      }

      return atualizador;
    });
  }

  function gerarPontosEstrela(pontas = 5, raioInterno = 35, raioExterno = 50) {
    const pontos = [];

    const total = pontas * 2;

    for (let i = 0; i < total; i++) {
      const angulo = (Math.PI * 2 * i) / total - Math.PI / 2;

      const raio = i % 2 === 0 ? raioExterno : raioInterno;

      pontos.push({
        id: crypto.randomUUID(),
        x: 50 + Math.cos(angulo) * raio,
        y: 50 + Math.sin(angulo) * raio,
        tipo: "reto",
      });
    }

    return pontos;
  }

  const [camposSelecionadosIds, setCamposSelecionadosIds] = useState<number[]>(
    [],
  );
  const [campoSelecionadoId, setCampoSelecionadoId] = useState<number | null>(
    null,
  );

  const [pontoFormaSelecionado, setPontoFormaSelecionado] = useState<{
    campoId: number;
    pontoId: string;
  } | null>(null);

  function selecionarCampoUnico(id: number) {
    setCampoSelecionadoId(id);
    setCamposSelecionadosIds([id]);
    setPontoFormaSelecionado(null);
  }

  type TipoFormaGeometrica =
    | "RETANGULO"
    | "QUADRADO"
    | "CIRCULO"
    | "LINHA"
    | "ESTRELA"
    | "TRIANGULO"
    | "SETA"
    | "LOSANGO"
    | "LIVRE";

  function adicionarFormaGeometrica(forma: TipoFormaGeometrica) {
    const novoId = Date.now();

    const configPorForma: Partial<Record<TipoFormaGeometrica, any>> = {
      RETANGULO: {
        x: 120,
        y: 120,
        largura: 180,
        altura: 90,
        opacity: 0.35,
        contornoEspessura: 2,
      },
      QUADRADO: {
        x: 130,
        y: 130,
        largura: 120,
        altura: 120,
        opacity: 0.35,
        contornoEspessura: 2,
      },
      CIRCULO: {
        x: 140,
        y: 140,
        largura: 110,
        altura: 110,
        opacity: 0.35,
        contornoEspessura: 2,
      },
      LINHA: {
        x: 160,
        y: 160,
        largura: 180,
        altura: 1,
        opacity: 1,
        contornoEspessura: 2,
      },
      ESTRELA: {
        x: 180,
        y: 180,
        largura: 160,
        altura: 160,
        opacity: 1,
        contornoEspessura: 3,
        pontasEstrela: 5,
        raioInterno: 22,
        raioExterno: 44,
        profundidadeEstrela: 45,
        arredondarEstrela: 0,
        pontas: 5,
      },
      TRIANGULO: {
        x: 200,
        y: 200,
        largura: 140,
        altura: 140,
        opacity: 0.55,
        contornoEspessura: 2,
      },
      SETA: {
        x: 200,
        y: 200,
        largura: 180,
        altura: 100,
        opacity: 0.55,
        contornoEspessura: 2,
      },
      LOSANGO: {
        x: 200,
        y: 200,
        largura: 130,
        altura: 130,
        opacity: 0.55,
        contornoEspessura: 2,
      },
    };

    const config = configPorForma[forma] || {
      x: 160,
      y: 160,
      largura: 140,
      altura: 140,
      opacity: 0.55,
      contornoEspessura: 2,
    };

    const novoCampo = {
      id: novoId,
      tempId: novoId,
      tipo: "FORMA",
      forma,
      pontosForma: criarPontosIniciaisForma(forma),
      mostrarPreenchimento: true,
      mostrarContorno: true,
      preenchimentoCor: "#1d4ed8",
      contornoCor: "#1d4ed8",
      cor: "#1d4ed8",
      ordem: 5,
      pagina: 1,
      ...config,
    } as any;

    setCampos((prev) => [...prev, novoCampo]);
    selecionarCampoUnico(novoId);
  }

  const [mostrarHandlesForma, setMostrarHandlesForma] = useState(true);

  const [modoFormaLivre, setModoFormaLivre] = useState(false);
  const [modalArrayAberto, setModalArrayAberto] = useState(false);
  const [arrayQuantidade, setArrayQuantidade] = useState(10);
  const [arrayX, setArrayX] = useState(40);
  const [arrayY, setArrayY] = useState(0);
  const [arrayRotacao, setArrayRotacao] = useState(0);
  const [arrayEscala, setArrayEscala] = useState(100);
  const [arrayOpacidade, setArrayOpacidade] = useState(100);
  const [pontosFormaLivre, setPontosFormaLivre] = useState<any[]>([]);

  const pontosFormaLivreRef = useRef<any[]>([]);

  useEffect(() => {
    pontosFormaLivreRef.current = pontosFormaLivre;
  }, [pontosFormaLivre]);

  useEffect(() => {
    function handleUndoRedo(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      const tag = alvo?.tagName?.toLowerCase();

      if (tag === "input" || tag === "textarea" || alvo?.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();

        if (modoFormaLivre || pontosFormaLivreRef.current.length > 0) {
          e.preventDefault();

          setPontosFormaLivre((prev) => {
            const novos = prev.slice(0, -1);

            if (novos.length === 0) {
              setModoFormaLivre(false);
              pontosFormaLivreRef.current = [];

              setCampos((camposAtuais) =>
                camposAtuais.filter((campo) => campo.id !== -999999),
              );

              setMensagemSucesso(t("freeForm.creationCancelled"));
              setTimeout(() => setMensagemSucesso(""), 1500);

              return [];
            }

            pontosFormaLivreRef.current = novos;

            setCampos((camposAtuais) => [
              ...camposAtuais.filter((campo) => campo.id !== -999999),
              criarCampoPreviewFormaLivre(novos),
            ]);

            return novos;
          });

          return;
        }

        if (e.shiftKey) {
          refazer();
        } else {
          desfazer();
        }
      }
    }

    window.addEventListener("keydown", handleUndoRedo, true);

    return () => {
      window.removeEventListener("keydown", handleUndoRedo, true);
    };
  }, [campos, historico, futuro, modoFormaLivre]);

  function cancelarFormaLivreEmCriacao() {
    setModoFormaLivre(false);
    setPontosFormaLivre([]);
    pontosFormaLivreRef.current = [];

    setCampos((prev) => prev.filter((campo) => campo.id !== -999999));

    setCampoSelecionadoId(null);
    setCamposSelecionadosIds([]);
    setPontoFormaSelecionado(null);
  }

  const [copiasPreviewArray, setCopiasPreviewArray] = useState<any[]>([]);

  function criarCampoPreviewFormaLivre(pontos: any[]) {
    const xs = pontos.map((p) => p.x);
    const ys = pontos.map((p) => p.y);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    const largura = Math.max(20, maxX - minX);
    const altura = Math.max(20, maxY - minY);

    const pontosNormalizados = pontos.map((p, index) => ({
      id: `preview-livre-${index}`,
      x: Number((((p.x - minX) / largura) * 100).toFixed(2)),
      y: Number((((p.y - minY) / altura) * 100).toFixed(2)),
      tipo: "reto" as const,
    }));

    return {
      id: -999999,
      tempId: -999999,
      tipo: "FORMA",
      forma: "LIVRE",
      pontosForma: pontosNormalizados,
      mostrarPreenchimento: true,
      mostrarContorno: true,
      preenchimentoCor: "#1d4ed8",
      contornoCor: "#00ff88",
      contornoEspessura: 5,
      x: minX,
      y: minY,
      largura,
      altura,
      cor: "#00ff88",
      opacity: 1,
      ordem: 999999,
      nomeCamada: tr("freeForm.layerCreating"),
    } as any;
  }

  function clicarFormaLivreNoCanvas(e: React.MouseEvent<HTMLDivElement>) {
    if (!modoFormaLivre || !canvasRef.current) return false;
    if (e.button !== 0) return false;

    const alvo = e.target as HTMLElement;

    if (alvo.closest("[data-campo-certificado-id]")) {
      return false;
    }

    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current.getBoundingClientRect();

    const x = (e.clientX - rect.left) / escala;
    const y = (e.clientY - rect.top) / escala;

    const novoPonto = {
      id: `livre-${Date.now()}`,
      x,
      y,
    };

    const proximosPontos = [...pontosFormaLivre, novoPonto];

    const primeiro = pontosFormaLivre[0];

    const clicouNoPrimeiro =
      pontosFormaLivre.length >= 3 &&
      primeiro &&
      Math.hypot(x - primeiro.x, y - primeiro.y) <= 18;

    if (clicouNoPrimeiro) {
      const campoFinal = criarCampoPreviewFormaLivre(pontosFormaLivre);

      const novoId = Date.now();

      setCampos((prev) => [
        ...prev.filter((campo) => campo.id !== -999999),
        {
          ...campoFinal,
          id: novoId,
          tempId: novoId,
          mostrarPreenchimento: true,
          preenchimentoCor: "#1d4ed8",
          contornoCor: "#1d4ed8",
          contornoEspessura: 2,
          cor: "#1d4ed8",
          opacity: 0.55,
          ordem: 5,
          nomeCamada: tr("freeForm.layerName"),
        },
      ]);

      selecionarCampoUnico(novoId);
      setModoFormaLivre(false);
      setPontosFormaLivre([]);
      setMensagemSucesso(t("freeForm.created"));

      return true;
    }

    setPontosFormaLivre(proximosPontos);

    setCampos((prev) => [
      ...prev.filter((campo) => campo.id !== -999999),
      criarCampoPreviewFormaLivre(proximosPontos),
    ]);

    setMensagemSucesso(
      t("freeForm.pointCreated", {
        count: proximosPontos.length,
      }),
    );

    return true;
  }

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [modalPublicacaoAberto, setModalPublicacaoAberto] = useState(false);

  const [modelosCertificado, setModelosCertificado] = useState<any[]>([]);

  const [filtroSituacaoModelos, setFiltroSituacaoModelos] =
    useState<FiltroSituacaoModelo>("TODOS");

  const [ordemListaModelos, setOrdemListaModelos] =
    useState<OrdemListaModelos>("MAIS_RECENTES");

  const [modelosArquivados, setModelosArquivados] = useState<any[]>([]);

  const [modalArquivadosAberto, setModalArquivadosAberto] = useState(false);

  const [restaurandoModeloId, setRestaurandoModeloId] = useState<number | null>(
    null,
  );

  const [modeloAtivoId, setModeloAtivoId] = useState<number | null>(null);

  const [resumoModelos, setResumoModelos] = useState<{
    plano: string;
    limite: number | null;
    ilimitado: boolean;
    utilizados: number;
    restantes: number | null;
    podeCriar: boolean;
  }>({
    plano: "ESSENCIAL",
    limite: 1,
    ilimitado: false,
    utilizados: 0,
    restantes: 1,
    podeCriar: false,
  });

  const [trocandoModelo, setTrocandoModelo] = useState(false);

  const [criandoModelo, setCriandoModelo] = useState(false);

  const [novoModeloFormAberto, setNovoModeloFormAberto] = useState(false);

  const [novoModeloNome, setNovoModeloNome] = useState("");

  const [novoModeloDescricao, setNovoModeloDescricao] = useState("");

  const [novoModeloModalidade, setNovoModeloModalidade] =
    useState<ModalidadeCertificadoValor>("GERAL");

  const [novoModeloPadraoModalidade, setNovoModeloPadraoModalidade] =
    useState(false);

  const [menuModelosAberto, setMenuModelosAberto] = useState(false);

  const [modalEditarModeloAberto, setModalEditarModeloAberto] = useState(false);

  const [modalArquivarModeloAberto, setModalArquivarModeloAberto] =
    useState(false);

  const [nomeModeloEditando, setNomeModeloEditando] = useState("");

  const [descricaoModeloEditando, setDescricaoModeloEditando] = useState("");

  const [modalidadeModeloEditando, setModalidadeModeloEditando] =
    useState<ModalidadeCertificadoValor>("GERAL");

  const [padraoModalidadeModeloEditando, setPadraoModalidadeModeloEditando] =
    useState(false);

  const [salvandoDadosModelo, setSalvandoDadosModelo] = useState(false);

  const [definindoPadraoModelo, setDefinindoPadraoModelo] = useState(false);

  const [arquivandoModelo, setArquivandoModelo] = useState(false);

  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [salvandoCampo, setSalvandoCampo] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");
  const [orientacao, setOrientacao] = useState<OrientacaoEditor>("paisagem");
  const [tamanhoPapel, setTamanhoPapel] = useState<"A5" | "A4" | "A3">("A4");
  const [modoCorDocumento, setModoCorDocumento] = useState<"RGB" | "CMYK">(
    "RGB",
  );
  const [corFundoPagina, setCorFundoPagina] = useState("#ffffff");
  const [modoFundo, setModoFundo] = useState<"modelo" | "phanyx">("modelo");

  const [formasAbertas, setFormasAbertas] = useState(true);
  const [zoom, setZoom] = useState(0);
  const [modoAmplo, setModoAmplo] = useState(false);
  const [mostrarPainelCampos, setMostrarPainelCampos] = useState(true);
  const [abaLateral, setAbaLateral] = useState<"campos" | "cena">("campos");
  const [camposDinamicosAberto, setCamposDinamicosAberto] = useState(false);

  const zIndexFlutuanteRef = useRef(1000000);

  const [zIndexFlutuante, setZIndexFlutuante] = useState({
    barraSelecao: 1000001,
    opcoesForma: 1000002,
    arrayModal: 1000003,
  });

  function trazerPainelFlutuanteParaFrente(
    painel: "barraSelecao" | "opcoesForma" | "arrayModal",
  ) {
    zIndexFlutuanteRef.current += 1;

    setZIndexFlutuante((prev) => ({
      ...prev,
      [painel]: zIndexFlutuanteRef.current,
    }));
  }
  const [contornoTextoAtivo, setContornoTextoAtivo] = useState(false);

  const [menuCamada, setMenuCamada] = useState<{
    x: number;
    y: number;
    campoId: number;
  } | null>(null);

  const [camadaArrastandoId, setCamadaArrastandoId] = useState<number | null>(
    null,
  );
  const [camadaRenomeandoId, setCamadaRenomeandoId] = useState<number | null>(
    null,
  );
  const [nomeCamadaEditando, setNomeCamadaEditando] = useState("");

  const [menuDownloadAberto, setMenuDownloadAberto] = useState(false);
  const [formatoDownload, setFormatoDownload] = useState("png");
  const [secaoAberta, setSecaoAberta] = useState<string | null>(null);
  const [modoMao, setModoMao] = useState(false);
  const [espacoPressionado, setEspacoPressionado] = useState(false);
  const [arrastandoCanvas, setArrastandoCanvas] = useState(false);

  const [caixaSelecao, setCaixaSelecao] = useState<{
    inicioX: number;
    inicioY: number;
    x: number;
    y: number;
    largura: number;
    altura: number;
  } | null>(null);

  const [inicioArrastoCanvas, setInicioArrastoCanvas] = useState({
    x: 0,
    y: 0,
  });
  const [corTextoSelecionado, setCorTextoSelecionado] = useState<string | null>(
    null,
  );

  const [editorCorGradiente, setEditorCorGradiente] = useState<{
    campoId: number;
    pontoIndex: number;
    cor: string;
  } | null>(null);

  const [corContornoTexto, setCorContornoTexto] = useState("#000000");
  const [espessuraContornoTexto, setEspessuraContornoTexto] = useState(1);

  const [corAtual, setCorAtual] = useState({
    hex: "#ffffff",
    r: 255,
    g: 255,
    b: 255,
  });

  function adicionarImagemBiblioteca(
    imagemUrl: string,
    largura = 180,
    altura = 180,
  ) {
    const novoId = Date.now();

    setCampos((prev) => [
      ...prev,
      {
        id: novoId,
        tempId: novoId,
        tipo: "IMAGEM",
        imagemUrl,
        url: imagemUrl,
        src: imagemUrl,
        arquivoUrl: imagemUrl,
        previewUrl: imagemUrl,
        x: 120,
        y: 120,
        largura,
        altura,
        rotate: 0,
        opacity: 1,
        ordem: 10,
        pagina: 1,
        crop: {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        cropBaseW: largura,
        cropBaseH: altura,
        sombraAtiva: false,
        sombraX: 0,
        sombraY: 0,
        sombraBlur: 0,
        sombraCor: "#000000",
        sombraOpacidade: 0.25,
      } as any,
    ]);

    selecionarCampoUnico(novoId);
  }

  const handleUploadImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setEnviandoArquivo(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || tr("errors.uploadImage"));
      }

      setCampos((prev) => [
        ...prev,
        {
          id: Date.now(),
          tipo: "IMAGEM",
          imagemUrl: data.url,
          url: data.url,
          src: data.url,
          arquivoUrl: data.url,
          previewUrl: data.url,
          x: 120,
          y: 120,
          largura: 140,
          altura: 140,
          rotacao: 0,
          opacity: 1,
          ordem: 10,
          pagina: 1,
        } as any,
      ]);
    } catch (error: any) {
      setMensagemErro(error?.message || tr("errors.uploadImage"));
    } finally {
      setEnviandoArquivo(false);
      e.target.value = "";
    }
  };

  const stageRef = useRef<HTMLDivElement | null>(null);

  const [stageSize, setStageSize] = useState({
    width: 900,
    height: 560,
  });

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const selecaoTextoRef = useRef<Range | null>(null);
  const aplicandoEstiloTextoRef = useRef(false);

  const selecaoTextoInfoRef = useRef<{
    campoId: number;
    inicio: number;
    fim: number;
  } | null>(null);

  useEffect(() => {
    function calcularOffsetTexto(
      root: HTMLElement,
      node: Node,
      offset: number,
    ) {
      let total = 0;

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

      while (walker.nextNode()) {
        const atual = walker.currentNode;

        if (atual === node) {
          return total + offset;
        }

        total += atual.textContent?.length || 0;
      }

      return total;
    }

    function salvarSelecaoTextoLivre() {
      const selecao = window.getSelection();

      if (aplicandoEstiloTextoRef.current) return;

      if (!selecao || selecao.rangeCount === 0) return;
      if (!selecao.toString().trim()) return;

      const range = selecao.getRangeAt(0);

      const inicioEl =
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : (range.startContainer as HTMLElement);

      const editor = inicioEl?.closest(
        "[data-texto-livre-id]",
      ) as HTMLElement | null;

      if (!editor) return;

      const campoId = Number(editor.getAttribute("data-texto-livre-id"));

      const inicio = calcularOffsetTexto(
        editor,
        range.startContainer,
        range.startOffset,
      );

      const fim = calcularOffsetTexto(
        editor,
        range.endContainer,
        range.endOffset,
      );

      selecaoTextoRef.current = range.cloneRange();
      selecaoTextoInfoRef.current = {
        campoId,
        inicio: Math.min(inicio, fim),
        fim: Math.max(inicio, fim),
      };

      const elementoCor =
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : (range.startContainer as HTMLElement);

      const elementoFinalCor = elementoCor?.closest("span") || elementoCor;

      const cor = elementoFinalCor
        ? window.getComputedStyle(elementoFinalCor).color
        : "";

      const corHex = cssColorToHex(cor);

      setCorTextoSelecionado(corHex || null);
    }

    document.addEventListener("selectionchange", salvarSelecaoTextoLivre);

    return () => {
      document.removeEventListener("selectionchange", salvarSelecaoTextoLivre);
    };
  }, []);

  useEffect(() => {
    if (!stageRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;

      setStageSize({
        width: rect.width,
        height: rect.height,
      });
    });

    observer.observe(stageRef.current);

    return () => observer.disconnect();
  }, []);

  const dragRef = useRef<{
    campoId: number;
    offsetX: number;
    offsetY: number;
    grupoId?: string | null;
    inicioX: number;
    inicioY: number;
    posicoesIniciais: { id: number; x: number; y: number }[];
  } | null>(null);

  const modeloAtivoIdRef = useRef<number | null>(null);
  const versaoRascunhoIdRef = useRef<number | null>(null);

  useEffect(() => {
    async function carregarPlano() {
      try {
        const res = await fetch("/api/admin/plano", {
          cache: "no-store",
        });

        const data = await res.json();

        setPlanoInstituicao(data?.plano || "ESSENCIAL");
      } catch {
        setPlanoInstituicao("ESSENCIAL");
      }
    }

    carregarPlano();
  }, []);

  const podeUsarEditorCertificados = [
    "ESSENCIAL",
    "PROFISSIONAL",
    "ENTERPRISE",
  ].includes(planoInstituicao);

  const modeloAtivo = useMemo(() => {
    return (
      modelosCertificado.find(
        (modelo: any) => Number(modelo.id) === Number(modeloAtivoId),
      ) || null
    );
  }, [modelosCertificado, modeloAtivoId]);

  const modelosFiltradosOrdenados = useMemo(() => {
    return modelosCertificado
      .map((modelo: any) => {
        const versoes = Array.isArray(modelo?.versoes) ? modelo.versoes : [];

        const versaoRascunho = versoes.find(
          (versao: any) =>
            String(versao?.tipo || "").toUpperCase() === "RASCUNHO",
        );

        const versaoPublicada = versoes.find(
          (versao: any) =>
            String(versao?.tipo || "").toUpperCase() === "PUBLICADO",
        );

        const publicado =
          Boolean(modelo?.publicadoEm) || Boolean(versaoPublicada);

        const datasAlteracao = [
          modelo?.atualizadoEm,
          versaoRascunho?.atualizadoEm,
        ]
          .map((data) => {
            const timestamp = data ? new Date(data).getTime() : 0;

            return Number.isFinite(timestamp) ? timestamp : 0;
          })
          .filter((timestamp) => timestamp > 0);

        const ultimaAlteracaoTimestamp =
          datasAlteracao.length > 0 ? Math.max(...datasAlteracao) : 0;

        return {
          ...modelo,
          _publicado: publicado,
          _ultimaAlteracaoTimestamp: ultimaAlteracaoTimestamp,
        };
      })
      .filter((modelo: any) => {
        if (filtroSituacaoModelos === "RASCUNHOS") {
          return modelo._publicado !== true;
        }

        if (filtroSituacaoModelos === "PUBLICADOS") {
          return modelo._publicado === true;
        }

        return true;
      })
      .sort((modeloA: any, modeloB: any) => {
        const dataA = Number(modeloA._ultimaAlteracaoTimestamp || 0);

        const dataB = Number(modeloB._ultimaAlteracaoTimestamp || 0);

        return ordemListaModelos === "MAIS_ANTIGOS"
          ? dataA - dataB
          : dataB - dataA;
      });
  }, [modelosCertificado, filtroSituacaoModelos, ordemListaModelos]);

  const totalModelosRascunho = useMemo(() => {
    return modelosCertificado.filter((modelo: any) => {
      const versoes = Array.isArray(modelo?.versoes) ? modelo.versoes : [];

      const possuiVersaoPublicada = versoes.some(
        (versao: any) =>
          String(versao?.tipo || "").toUpperCase() === "PUBLICADO",
      );

      return !modelo?.publicadoEm && !possuiVersaoPublicada;
    }).length;
  }, [modelosCertificado]);

  const totalModelosPublicados =
    modelosCertificado.length - totalModelosRascunho;

  function resetarConfiguracaoVisualCertificado() {
    setCertificadoTemplateUrl("");
    setCertificadoPreviewUrl("");
    setCertificadoAssinaturaUrl("");
    setCertificadoCoordenadorNome("");
    setCertificadoCidade("");
    setNomeDiretorInstituicao("");

    setModoFundo("modelo");
    setCorFundoPagina("#ffffff");
    setTamanhoPapel("A4");
    setOrientacao("paisagem");

    setArquivoModelo(null);
  }

  function aplicarConfiguracaoVisualCertificado(
    configuracao: any,
    dataInstituicao: any,
  ) {
    const templateUrl = String(
      configuracao?.templateUrl ?? configuracao?.certificadoTemplateUrl ?? "",
    );

    const previewUrl = String(
      configuracao?.previewUrl ?? configuracao?.certificadoPreviewUrl ?? "",
    );

    const coordenadorNome = String(
      configuracao?.coordenadorNome ??
      configuracao?.certificadoCoordenadorNome ??
      "",
    );

    const cidade = String(
      configuracao?.cidade ?? configuracao?.certificadoCidade ?? "",
    );

    setCertificadoTemplateUrl(templateUrl);
    setCertificadoPreviewUrl(previewUrl);
    setCertificadoCoordenadorNome(coordenadorNome);
    setCertificadoCidade(cidade);

    const modoFundoRecebido = String(
      configuracao?.modoFundo ?? configuracao?.certificadoModoFundo ?? "modelo",
    ).toLowerCase();

    setModoFundo(
      modoFundoRecebido === "phanyx" || modoFundoRecebido === "cor"
        ? "phanyx"
        : "modelo",
    );

    const corFundoRecebida = String(
      configuracao?.corFundoPagina ??
      configuracao?.certificadoCorFundoPagina ??
      "#ffffff",
    ).trim();

    setCorFundoPagina(
      /^#[0-9a-fA-F]{6}$/.test(corFundoRecebida) ? corFundoRecebida : "#ffffff",
    );

    const tamanhoPapelRecebido = String(
      configuracao?.tamanhoPapel ??
      configuracao?.certificadoTamanhoPapel ??
      "A4",
    ).toUpperCase();

    setTamanhoPapel(
      tamanhoPapelRecebido === "A5" || tamanhoPapelRecebido === "A3"
        ? tamanhoPapelRecebido
        : "A4",
    );

    const orientacaoRecebida = String(
      configuracao?.orientacao ??
      configuracao?.certificadoOrientacao ??
      "paisagem",
    ).toLowerCase();

    setOrientacao(orientacaoRecebida === "retrato" ? "retrato" : "paisagem");

    setCertificadoAssinaturaUrl(
      String(
        configuracao?.assinaturaUrl ??
        configuracao?.certificadoAssinaturaUrl ??
        dataInstituicao?.certificadoAssinaturaUrl ??
        dataInstituicao?.configuracaoInstituicao?.certificadoAssinaturaUrl ??
        "",
      ),
    );

    setNomeDiretorInstituicao(
      String(
        dataInstituicao?.responsavelNome ??
        configuracao?.coordenadorNome ??
        configuracao?.certificadoCoordenadorNome ??
        "",
      ),
    );
  }

  function aplicarCamposCarregados(dataCampos: any) {
    setCampos(
      Array.isArray(dataCampos?.campos)
        ? dataCampos.campos.map((campo: any) => {
          const dados = campo.dadosJson || {};

          return {
            ...dados,
            ...campo,
            bancoId: campo.id,
            id: campo.id,
          };
        })
        : [],
    );

    setCampoSelecionadoId(null);
    setCamposSelecionadosIds([]);
    setPontoFormaSelecionado(null);
    setHistorico([]);
    setFuturo([]);
  }

  async function recarregarListaModelosCertificado() {
    const resposta = await fetch("/api/admin/certificado-modelos", {
      cache: "no-store",
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        dados?.detalhe ||
        dados?.error ||
        tr("errors.refreshModels"),
      );
    }

    const todosModelos = Array.isArray(dados?.modelos) ? dados.modelos : [];

    const modelosAtivos = todosModelos.filter(
      (modelo: any) => modelo?.ativo === true && modelo?.arquivado !== true,
    );

    const modelosArquivadosRecebidos = todosModelos.filter(
      (modelo: any) => modelo?.arquivado === true || modelo?.ativo === false,
    );

    setModelosCertificado(modelosAtivos);
    setModelosArquivados(modelosArquivadosRecebidos);

    setResumoModelos({
      plano: String(dados?.resumo?.plano || "ESSENCIAL"),

      limite:
        dados?.resumo?.ilimitado === true || dados?.resumo?.limite === null
          ? null
          : Number(dados?.resumo?.limite ?? 1),

      ilimitado:
        dados?.resumo?.ilimitado === true || dados?.resumo?.limite === null,

      utilizados: Number(dados?.resumo?.utilizados ?? 0),

      restantes:
        dados?.resumo?.ilimitado === true || dados?.resumo?.restantes === null
          ? null
          : Number(dados?.resumo?.restantes ?? 0),

      podeCriar: dados?.resumo?.podeCriar === true,
    });

    return modelosAtivos;
  }

  async function abrirModeloCertificado(modeloId: number) {
    if (!Number.isInteger(modeloId) || modeloId <= 0) {
      return;
    }

    if (modeloId === modeloAtivoIdRef.current && versaoRascunhoIdRef.current) {
      return;
    }

    try {
      setTrocandoModelo(true);
      setMensagemErro("");

      /*
       * Remove imediatamente as configurações visuais
       * pertencentes ao modelo anteriormente aberto.
       */
      resetarConfiguracaoVisualCertificado();

      const [respostaRascunho, respostaCampos, respostaInstituicao] =
        await Promise.all([
          fetch(`/api/admin/certificado-modelos/${modeloId}/rascunho`, {
            cache: "no-store",
          }),

          fetch(
            `/api/admin/certificado-campos?modeloId=${modeloId}&versao=RASCUNHO`,
            {
              cache: "no-store",
            },
          ),

          fetch("/api/admin/configuracoes/instituicao", {
            cache: "no-store",
          }),
        ]);

      const dadosRascunho = await respostaRascunho.json();

      const dadosCampos = await respostaCampos.json();

      const dadosInstituicao = await respostaInstituicao
        .json()
        .catch(() => ({}));

      if (!respostaRascunho.ok) {
        throw new Error(
          dadosRascunho?.detalhe ||
          dadosRascunho?.error ||
          tr("errors.openDraft"),
        );
      }

      if (!respostaCampos.ok) {
        throw new Error(
          dadosCampos?.detalhe ||
          dadosCampos?.error ||
          tr("errors.openElements"),
        );
      }

      const rascunho = dadosRascunho?.rascunho;

      if (!rascunho?.id) {
        throw new Error(tr("errors.modelHasNoDraft"));
      }

      modeloAtivoIdRef.current = modeloId;
      versaoRascunhoIdRef.current = Number(rascunho.id);

      setModeloAtivoId(modeloId);

      /*
       * Remove as configurações visuais do modelo anterior
       * antes de carregar o modelo selecionado.
       */
      resetarConfiguracaoVisualCertificado();

      aplicarConfiguracaoVisualCertificado(rascunho, dadosInstituicao);

      aplicarCamposCarregados(dadosCampos);

      const modeloAberto = modelosCertificado.find(
        (modelo: any) => Number(modelo.id) === modeloId,
      );

      setMensagemSucesso(
        modeloAberto?.nome
          ? tr("messages.modelOpened", { name: modeloAberto.nome })
          : tr("messages.modelOpenedGeneric"),
      );

      setTimeout(() => {
        setMensagemSucesso("");
      }, 2500);
    } catch (error: any) {
      console.error("ERRO AO TROCAR MODELO DE CERTIFICADO:", error);

      setMensagemErro(
        error?.message || tr("errors.openModel"),
      );
    } finally {
      setTrocandoModelo(false);
    }
  }

  async function criarNovoModeloCertificado() {
    const nome = novoModeloNome.trim();
    const descricao = novoModeloDescricao.trim();

    if (nome.length < 3) {
      setMensagemErro(tr("errors.nameMin3"));
      return;
    }

    try {
      setCriandoModelo(true);
      setMensagemErro("");

      const resposta = await fetch("/api/admin/certificado-modelos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          descricao: descricao || null,
          modalidade: novoModeloModalidade,
          padraoGeral: false,
          padraoModalidade: novoModeloPadraoModalidade,
          copiarLegado: false,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.detalhe ||
          dados?.error ||
          tr("errors.createModel"),
        );
      }

      const novoModeloId = Number(dados?.modelo?.id || dados?.id);

      await recarregarListaModelosCertificado();

      setNovoModeloNome("");
      setNovoModeloDescricao("");
      setNovoModeloModalidade("GERAL");
      setNovoModeloPadraoModalidade(false);
      setNovoModeloFormAberto(false);

      if (Number.isInteger(novoModeloId) && novoModeloId > 0) {
        await abrirModeloCertificado(novoModeloId);
      }

      setMensagemSucesso(tr("messages.modelCreated"));

      setTimeout(() => {
        setMensagemSucesso("");
      }, 3000);
    } catch (error: any) {
      console.error("ERRO AO CRIAR MODELO DE CERTIFICADO:", error);

      setMensagemErro(
        error?.message || tr("errors.createModel"),
      );
    } finally {
      setCriandoModelo(false);
    }
  }

  function abrirEdicaoModeloAtual() {
    if (!modeloAtivo) {
      setMensagemErro(tr("errors.noModelSelected"));
      return;
    }

    setNomeModeloEditando(String(modeloAtivo.nome || ""));

    setDescricaoModeloEditando(String(modeloAtivo.descricao || ""));

    const modalidadeAtual = String(
      modeloAtivo.modalidade || "GERAL",
    ) as ModalidadeCertificadoValor;

    setModalidadeModeloEditando(
      MODALIDADES_CERTIFICADO.some((item) => item.valor === modalidadeAtual)
        ? modalidadeAtual
        : "GERAL",
    );

    setPadraoModalidadeModeloEditando(modeloAtivo.padraoModalidade === true);

    setModalEditarModeloAberto(true);
  }

  async function salvarDadosModeloAtual() {
    const modeloId = Number(modeloAtivo?.id);
    const nome = nomeModeloEditando.trim();
    const descricao = descricaoModeloEditando.trim();

    if (!Number.isInteger(modeloId) || modeloId <= 0) {
      setMensagemErro(tr("errors.noModelSelected"));
      return;
    }

    if (nome.length < 3) {
      setMensagemErro(tr("errors.modelNameMin3"));
      return;
    }

    try {
      setSalvandoDadosModelo(true);
      setMensagemErro("");

      const resposta = await fetch(
        `/api/admin/certificado-modelos/${modeloId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome,
            descricao: descricao || null,
            modalidade: modalidadeModeloEditando,
            padraoModalidade: padraoModalidadeModeloEditando,
          }),
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.detalhe ||
          dados?.error ||
          tr("errors.updateModel"),
        );
      }

      await recarregarListaModelosCertificado();

      setModalEditarModeloAberto(false);
      setNomeModeloEditando("");
      setDescricaoModeloEditando("");
      setModalidadeModeloEditando("GERAL");
      setPadraoModalidadeModeloEditando(false);

      setMensagemSucesso(
        dados?.mensagem || tr("messages.modelUpdated"),
      );

      setTimeout(() => {
        setMensagemSucesso("");
      }, 3000);
    } catch (error: any) {
      console.error("ERRO AO ATUALIZAR MODELO DE CERTIFICADO:", error);

      setMensagemErro(
        error?.message || tr("errors.updateModel"),
      );
    } finally {
      setSalvandoDadosModelo(false);
    }
  }

  async function definirModeloAtualComoPadraoGeral() {
    const modeloId = Number(modeloAtivo?.id);

    if (!Number.isInteger(modeloId) || modeloId <= 0) {
      setMensagemErro(tr("errors.noModelSelected"));
      return;
    }

    if (modeloAtivo?.padraoGeral === true) {
      return;
    }

    try {
      setDefinindoPadraoModelo(true);
      setMensagemErro("");

      const resposta = await fetch(
        `/api/admin/certificado-modelos/${modeloId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            padraoGeral: true,
          }),
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.detalhe ||
          dados?.error ||
          tr("errors.setDefaultModel"),
        );
      }

      await recarregarListaModelosCertificado();

      setMensagemSucesso(
        tr("messages.modelSetGeneralDefault", { name: String(modeloAtivo?.nome || "") }),
      );

      setTimeout(() => {
        setMensagemSucesso("");
      }, 3000);
    } catch (error: any) {
      console.error("ERRO AO DEFINIR MODELO PADRÃO:", error);

      setMensagemErro(
        error?.message || tr("errors.setDefaultModel"),
      );
    } finally {
      setDefinindoPadraoModelo(false);
    }
  }

  function solicitarArquivamentoModeloAtual() {
    if (!modeloAtivo) {
      setMensagemErro(tr("errors.noModelSelected"));
      return;
    }

    setModalArquivarModeloAberto(true);
  }

  async function arquivarModeloAtual() {
    const modeloId = Number(modeloAtivo?.id);
    const nomeModelo = String(modeloAtivo?.nome || tr("models.certificateModel"));

    if (!Number.isInteger(modeloId) || modeloId <= 0) {
      setMensagemErro(tr("errors.noModelSelected"));
      return;
    }

    try {
      setArquivandoModelo(true);
      setMensagemErro("");

      const resposta = await fetch(
        `/api/admin/certificado-modelos/${modeloId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            acao: "ARQUIVAR",
          }),
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.detalhe || dados?.error || tr("errors.archiveModel"),
        );
      }

      const modelosRestantes = await recarregarListaModelosCertificado();

      setModalArquivarModeloAberto(false);

      const proximoModelo =
        modelosRestantes.find((modelo: any) => modelo.padraoGeral === true) ||
        modelosRestantes.find(
          (modelo: any) => modelo.padraoModalidade === true,
        ) ||
        modelosRestantes[0] ||
        null;

      if (proximoModelo?.id) {
        await abrirModeloCertificado(Number(proximoModelo.id));
      }

      setMensagemSucesso(tr("messages.modelArchived", { name: nomeModelo }));

      setTimeout(() => {
        setMensagemSucesso("");
      }, 3500);
    } catch (error: any) {
      console.error("ERRO AO ARQUIVAR MODELO DE CERTIFICADO:", error);

      setModalArquivarModeloAberto(false);

      setMensagemErro(
        error?.message || tr("errors.archiveCertificateModel"),
      );
    } finally {
      setArquivandoModelo(false);
    }
  }

  async function restaurarModeloArquivado(modelo: any) {
    const modeloId = Number(modelo?.id);
    const nomeModelo = String(modelo?.nome || tr("models.certificateModel"));

    if (!Number.isInteger(modeloId) || modeloId <= 0) {
      setMensagemErro(tr("errors.identifyArchivedModel"));
      return;
    }

    try {
      setRestaurandoModeloId(modeloId);
      setMensagemErro("");
      setMensagemSucesso("");

      const resposta = await fetch(
        `/api/admin/certificado-modelos/${modeloId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            acao: "RESTAURAR",
          }),
        },
      );

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados?.detalhe || dados?.error || tr("errors.restoreModel"),
        );
      }

      await recarregarListaModelosCertificado();

      setModalArquivadosAberto(false);

      await abrirModeloCertificado(modeloId);

      setMensagemSucesso(
        tr("messages.modelRestored", { name: nomeModelo }),
      );

      setTimeout(() => {
        setMensagemSucesso("");
      }, 3500);
    } catch (error: any) {
      console.error("ERRO AO RESTAURAR MODELO DE CERTIFICADO:", error);

      setMensagemErro(
        error?.message || tr("errors.restoreCertificateModel"),
      );
    } finally {
      setRestaurandoModeloId(null);
    }
  }

  useEffect(() => {
    async function carregarConfiguracao() {
      try {
        setCarregando(true);
        setMensagemErro("");

        const [resModelos, resInstituicao] = await Promise.all([
          fetch("/api/admin/certificado-modelos", {
            cache: "no-store",
          }),

          fetch("/api/admin/configuracoes/instituicao", {
            cache: "no-store",
          }),
        ]);

        const dataModelos = await resModelos.json();

        const dataInstituicao = await resInstituicao.json().catch(() => ({}));

        if (!resModelos.ok) {
          throw new Error(
            dataModelos?.detalhe ||
            dataModelos?.error ||
            tr("errors.fetchModels"),
          );
        }

        const todosModelos = Array.isArray(dataModelos?.modelos)
          ? dataModelos.modelos
          : [];

        const modelosAtivos = todosModelos.filter(
          (modelo: any) => modelo?.ativo === true && modelo?.arquivado !== true,
        );

        const modelosArquivadosRecebidos = todosModelos.filter(
          (modelo: any) =>
            modelo?.arquivado === true || modelo?.ativo === false,
        );

        setModelosCertificado(modelosAtivos);
        setModelosArquivados(modelosArquivadosRecebidos);
        setResumoModelos({
          plano: String(dataModelos?.resumo?.plano || "ESSENCIAL"),

          limite:
            dataModelos?.resumo?.ilimitado === true ||
              dataModelos?.resumo?.limite === null
              ? null
              : Number(dataModelos?.resumo?.limite ?? 1),

          ilimitado:
            dataModelos?.resumo?.ilimitado === true ||
            dataModelos?.resumo?.limite === null,

          utilizados: Number(dataModelos?.resumo?.utilizados ?? 0),

          restantes:
            dataModelos?.resumo?.ilimitado === true ||
              dataModelos?.resumo?.restantes === null
              ? null
              : Number(dataModelos?.resumo?.restantes ?? 0),

          podeCriar: dataModelos?.resumo?.podeCriar === true,
        });

        const modeloInicial =
          modelosAtivos.find((modelo: any) => modelo.padraoGeral === true) ||
          modelosAtivos.find(
            (modelo: any) => modelo.padraoModalidade === true,
          ) ||
          modelosAtivos[0] ||
          null;

        /*
         * Quando existe modelo novo, o editor abre somente
         * o RASCUNHO desse modelo.
         */
        if (modeloInicial) {
          const modeloId = Number(modeloInicial.id);

          const [resRascunho, resCampos] = await Promise.all([
            fetch(`/api/admin/certificado-modelos/${modeloId}/rascunho`, {
              cache: "no-store",
            }),

            fetch(
              `/api/admin/certificado-campos?modeloId=${modeloId}&versao=RASCUNHO`,
              {
                cache: "no-store",
              },
            ),
          ]);

          const dataRascunho = await resRascunho.json();

          const dataCampos = await resCampos.json();

          if (!resRascunho.ok) {
            throw new Error(
              dataRascunho?.detalhe ||
              dataRascunho?.error ||
              tr("errors.fetchDraft"),
            );
          }

          if (!resCampos.ok) {
            throw new Error(
              dataCampos?.detalhe ||
              dataCampos?.error ||
              tr("errors.fetchDraftFields"),
            );
          }

          const rascunho = dataRascunho?.rascunho;

          if (!rascunho?.id) {
            throw new Error(tr("errors.modelHasNoDraft"));
          }

          modeloAtivoIdRef.current = modeloId;
          versaoRascunhoIdRef.current = Number(rascunho.id);
          setModeloAtivoId(modeloId);

          aplicarConfiguracaoVisualCertificado(rascunho, dataInstituicao);

          aplicarCamposCarregados(dataCampos);

          return;
        }

        /*
         * Instituições que ainda não possuem modelo novo
         * continuam usando o certificado legado.
         */
        modeloAtivoIdRef.current = null;
        versaoRascunhoIdRef.current = null;
        setModeloAtivoId(null);

        const [resConfig, resCampos] = await Promise.all([
          fetch("/api/admin/configuracoes/certificado", {
            cache: "no-store",
          }),

          fetch("/api/admin/certificado-campos", {
            cache: "no-store",
          }),
        ]);

        const dataConfig = await resConfig.json();

        const dataCampos = await resCampos.json();

        if (!resConfig.ok) {
          throw new Error(
            dataConfig?.detalhe ||
            dataConfig?.error ||
            tr("errors.fetchLegacyConfig"),
          );
        }

        if (!resCampos.ok) {
          throw new Error(
            dataCampos?.detalhe ||
            dataCampos?.error ||
            tr("errors.fetchLegacyFields"),
          );
        }

        aplicarConfiguracaoVisualCertificado(dataConfig, dataInstituicao);

        aplicarCamposCarregados(dataCampos);
      } catch (error: any) {
        console.error("ERRO AO CARREGAR EDITOR DE CERTIFICADO:", error);

        setMensagemErro(
          error?.message || tr("errors.loadCertificateConfig"),
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarConfiguracao();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      const tag = alvo?.tagName?.toLowerCase();

      const estaDigitando =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        Boolean(alvo?.isContentEditable) ||
        Boolean(
          alvo?.closest?.('[contenteditable="true"], [data-texto-livre-id]'),
        );

      if (e.code === "Space") {
        if (estaDigitando) return;

        e.preventDefault();
        setEspacoPressionado(true);
        return;
      }

      if (e.key !== "Delete" && e.key !== "Backspace") {
        return;
      }

      const estaDentroDeCampoDeFormulario =
        tag === "input" || tag === "textarea" || tag === "select";

      if (estaDentroDeCampoDeFormulario) return;

      const estaDigitandoTextoLivre =
        alvo?.isContentEditable || alvo?.closest?.("[data-texto-livre-id]");

      const temTextoSelecionado =
        typeof window !== "undefined" &&
        window.getSelection()?.toString().trim();

      if (estaDigitandoTextoLivre && temTextoSelecionado) {
        return;
      }

      if (
        pontoFormaSelecionado &&
        campoSelecionadoId === pontoFormaSelecionado.campoId
      ) {
        const campoForma = campos.find(
          (campo) => campo.id === pontoFormaSelecionado.campoId,
        );

        const pontos = Array.isArray((campoForma as any)?.pontosForma)
          ? ((campoForma as any).pontosForma as any[])
          : [];

        const pontoExiste = pontos.some(
          (ponto) => ponto.id === pontoFormaSelecionado.pontoId,
        );

        if (campoForma?.tipo === "FORMA" && pontoExiste) {
          e.preventDefault();

          const minimo = campoForma.forma === "LINHA" ? 2 : 3;

          if (pontos.length <= minimo) {
            setMensagemErro(
              campoForma.forma === "LINHA"
                ? tr("errors.lineMinPoints")
                : tr("errors.shapeMinPoints"),
            );

            setTimeout(() => setMensagemErro(""), 2500);
            return;
          }

          const novosPontos = pontos.filter(
            (ponto) => ponto.id !== pontoFormaSelecionado.pontoId,
          );

          setCampos((prev) =>
            prev.map((campo) =>
              campo.id === pontoFormaSelecionado.campoId
                ? {
                  ...campo,
                  pontosForma: novosPontos,
                  dadosJson: {
                    ...((campo as any).dadosJson || {}),
                    pontosForma: novosPontos,
                  },
                }
                : campo,
            ),
          );

          setPontoFormaSelecionado(null);
          setMensagemSucesso(tr("messages.pointRemoved"));
          setTimeout(() => setMensagemSucesso(""), 1800);
          return;
        }
      }

      const idsParaExcluir =
        camposSelecionadosIds.length > 0
          ? camposSelecionadosIds
          : campoSelecionadoId
            ? [campoSelecionadoId]
            : [];

      if (idsParaExcluir.length === 0) return;

      e.preventDefault();

      idsParaExcluir.forEach((id) => {
        void excluirCampo(id);
      });

      setCampoSelecionadoId(null);
      setCamposSelecionadosIds([]);
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.code !== "Space") return;

      const alvo = e.target as HTMLElement | null;
      const tag = alvo?.tagName?.toLowerCase();

      const estaDigitando =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        Boolean(alvo?.isContentEditable) ||
        Boolean(
          alvo?.closest?.('[contenteditable="true"], [data-texto-livre-id]'),
        );

      if (estaDigitando) return;

      e.preventDefault();
      setEspacoPressionado(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    campoSelecionadoId,
    camposSelecionadosIds,
    campos,
    pontoFormaSelecionado,
  ]);

  const baseCanvas = TAMANHOS_PAPEL[tamanhoPapel][orientacao];

  const labelPapelAtual = `${tamanhoPapel} ${orientacao === "retrato"
    ? t("paper.orientation.portrait")
    : t("paper.orientation.landscape")
    }`;

  const fitZoom = useMemo(() => {
    const margemHorizontal = 90;
    const margemVertical = 90;

    const larguraDisponivel = Math.max(320, stageSize.width - margemHorizontal);
    const alturaDisponivel = Math.max(260, stageSize.height - margemVertical);

    const escalaX = larguraDisponivel / baseCanvas.largura;
    const escalaY = alturaDisponivel / baseCanvas.altura;

    const escalaFinal = Math.min(escalaX, escalaY);

    return Math.max(45, Math.min(75, Math.floor(escalaFinal * 100)));
  }, [baseCanvas, stageSize.width, stageSize.height]);

  useEffect(() => {
    setZoom(fitZoom);
  }, [fitZoom, tamanhoPapel, orientacao]);

  const escala = zoom / 100;
  const canvasWidth = Math.round(baseCanvas.largura * escala);
  const canvasHeight = Math.round(baseCanvas.altura * escala);

  const previewScale = useMemo(() => {
    if (typeof window === "undefined") return 1;

    const larguraMaxima = window.innerWidth - 120;
    const alturaMaxima = window.innerHeight - 120;

    return Math.min(
      1,
      larguraMaxima / baseCanvas.largura,
      alturaMaxima / baseCanvas.altura,
    );
  }, [baseCanvas.largura, baseCanvas.altura]);

  const campoSelecionado = useMemo(
    () => campos.find((campo) => campo.id === campoSelecionadoId) || null,
    [campos, campoSelecionadoId],
  );

  function atualizarColunasDisciplinasCampo(valor: number) {
    if (
      !campoSelecionado ||
      campoSelecionado.tipo !== "DISCIPLINAS_CONCLUIDAS"
    ) {
      return;
    }

    const colunas = Math.max(1, Math.min(4, Math.round(Number(valor || 1))));

    setCampos((prev) =>
      prev.map((campo) => {
        if (campo.id !== campoSelecionado.id) return campo;

        const quantidade = quantidadeDisciplinasDoCampo(campo);
        const tamanho = Number(campo.tamanho || 14);
        const lineHeight = Number(campo.lineHeight || 1.35);
        const linhasVisuais = Math.ceil(quantidade / colunas);

        return {
          ...campo,
          colunasDisciplinas: colunas,
          lineHeight,
          altura: Math.max(
            Number(campo.altura || 0),
            Math.ceil(linhasVisuais * tamanho * lineHeight + 18),
          ),
          dadosJson: {
            ...((campo as any).dadosJson || {}),
            quantidadeDisciplinas: quantidade,
            colunasDisciplinas: colunas,
            lineHeight,
          },
        };
      }),
    );
  }

  function atualizarEspacoColunasDisciplinasCampo(valor: number) {
    if (
      !campoSelecionado ||
      campoSelecionado.tipo !== "DISCIPLINAS_CONCLUIDAS"
    ) {
      return;
    }

    const espaco = Math.max(0, Math.min(80, Math.round(Number(valor || 0))));

    setCampos((prev) =>
      prev.map((campo) => {
        if (campo.id !== campoSelecionado.id) return campo;

        return {
          ...campo,
          espacoColunasDisciplinas: espaco,
          dadosJson: {
            ...((campo as any).dadosJson || {}),
            quantidadeDisciplinas: quantidadeDisciplinasDoCampo(campo),
            colunasDisciplinas: quantidadeColunasDisciplinasDoCampo(campo),
            espacoColunasDisciplinas: espaco,
            lineHeight: campo.lineHeight ?? 1.35,
          },
        };
      }),
    );
  }

  function atualizarQuantidadeDisciplinasCampo(valor: number) {
    if (
      !campoSelecionado ||
      campoSelecionado.tipo !== "DISCIPLINAS_CONCLUIDAS"
    ) {
      return;
    }

    const quantidade = Math.max(
      1,
      Math.min(80, Math.round(Number(valor || 1))),
    );

    setCampos((prev) =>
      prev.map((campo) => {
        if (campo.id !== campoSelecionado.id) return campo;

        const tamanho = Number(campo.tamanho || 14);
        const lineHeight = Number(campo.lineHeight || 1.35);
        const colunas = quantidadeColunasDisciplinasDoCampo(campo);
        const linhasVisuais = Math.ceil(quantidade / colunas);

        return {
          ...campo,
          quantidadeDisciplinas: quantidade,
          colunasDisciplinas: colunas,
          lineHeight,
          altura: Math.max(
            Number(campo.altura || 0),
            Math.ceil(linhasVisuais * tamanho * lineHeight + 18),
          ),
          dadosJson: {
            ...((campo as any).dadosJson || {}),
            quantidadeDisciplinas: quantidade,
            colunasDisciplinas: colunas,
            lineHeight,
          },
        };
      }),
    );
  }

  const caixaDoGrupoSelecionado = useMemo(() => {
    const idsBase =
      camposSelecionadosIds.length > 0
        ? camposSelecionadosIds
        : campoSelecionadoId
          ? [campoSelecionadoId]
          : [];

    const idsExpandidos = idsBase.flatMap((id) => {
      const campo = campos.find((item) => item.id === id);

      if (!campo) return [];
      if ((campo as any).arrayPreview) return [];

      if (campo.grupoId) {
        return campos
          .filter(
            (item) =>
              item.grupoId === campo.grupoId && !(item as any).arrayPreview,
          )
          .map((item) => item.id);
      }

      return [campo.id];
    });

    const ids = Array.from(new Set(idsExpandidos));

    if (ids.length < 2) return null;

    const itens = campos.filter((campo) => ids.includes(campo.id));
    if (itens.length < 2) return null;

    const minX = Math.min(...itens.map((campo) => Number(campo.x || 0)));
    const minY = Math.min(...itens.map((campo) => Number(campo.y || 0)));

    const maxX = Math.max(
      ...itens.map(
        (campo) => Number(campo.x || 0) + Number(campo.largura || 120),
      ),
    );

    const maxY = Math.max(
      ...itens.map(
        (campo) => Number(campo.y || 0) + Number(campo.altura || 40),
      ),
    );

    return {
      x: minX,
      y: minY,
      largura: maxX - minX,
      altura: maxY - minY,
    };
  }, [campos, camposSelecionadosIds, campoSelecionadoId]);

  async function fazerUploadModelo() {
    if (!arquivoModelo) {
      setMensagemErro(tr("errors.selectPdfBeforeUpload"));
      return;
    }

    try {
      setEnviandoArquivo(true);

      const formData = new FormData();
      formData.append("file", arquivoModelo);

      const res = await fetch("/api/admin/configuracoes/certificado/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMensagemErro(
          data?.detalhe || data?.error || tr("errors.uploadFile"),
        );
        return;
      }

      setCertificadoTemplateUrl(data.url || "");

      setCertificadoPreviewUrl(
        data.previewUrl || data.certificadoPreviewUrl || "",
      );

      setMensagemSucesso(tr("messages.modelPdfUploaded"));
    } catch {
      setMensagemErro(tr("errors.uploadModelPdf"));
    } finally {
      setEnviandoArquivo(false);
    }
  }

  function iniciarSelecaoRetangular(e: React.MouseEvent<HTMLDivElement>) {
    if (!canvasRef.current) return;
    if (modoMao || espacoPressionado) return;

    if (e.target !== e.currentTarget) return;

    const rect = canvasRef.current.getBoundingClientRect();

    const x = (e.clientX - rect.left) / escala;
    const y = (e.clientY - rect.top) / escala;

    setCaixaSelecao({
      inicioX: x,
      inicioY: y,
      x,
      y,
      largura: 0,
      altura: 0,
    });

    setCampoSelecionadoId(null);
    setCamposSelecionadosIds([]);
  }

  function moverSelecaoRetangular(e: React.MouseEvent<HTMLDivElement>) {
    if (!caixaSelecao || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();

    const atualX = (e.clientX - rect.left) / escala;
    const atualY = (e.clientY - rect.top) / escala;

    setCaixaSelecao((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        x: Math.min(prev.inicioX, atualX),
        y: Math.min(prev.inicioY, atualY),
        largura: Math.abs(atualX - prev.inicioX),
        altura: Math.abs(atualY - prev.inicioY),
      };
    });
  }

  function finalizarSelecaoRetangular() {
    if (!caixaSelecao) return;

    const box = caixaSelecao;

    if (box.largura < 8 || box.altura < 8) {
      setCaixaSelecao(null);
      return;
    }

    const ids = campos
      .filter((campo) => {
        const campoX = campo.x;
        const campoY = campo.y;
        const campoLargura = campo.largura || 120;
        const campoAltura = campo.altura || 40;

        const encostaHorizontal =
          campoX < box.x + box.largura && campoX + campoLargura > box.x;

        const encostaVertical =
          campoY < box.y + box.altura && campoY + campoAltura > box.y;

        return encostaHorizontal && encostaVertical;
      })
      .map((campo) => campo.id);

    setCamposSelecionadosIds(ids);
    setCampoSelecionadoId(ids.length ? ids[ids.length - 1] : null);
    setCaixaSelecao(null);
  }

  function iniciarArrastoCanvas(e: React.MouseEvent<HTMLDivElement>) {
    const maoAtiva = modoMao || espacoPressionado;
    if (!maoAtiva || !stageRef.current) return;

    setArrastandoCanvas(true);
    setInicioArrastoCanvas({
      x: e.clientX,
      y: e.clientY,
    });
  }

  function moverCanvas(e: React.MouseEvent<HTMLDivElement>) {
    if (!arrastandoCanvas || !stageRef.current) return;

    const deltaX = e.clientX - inicioArrastoCanvas.x;
    const deltaY = e.clientY - inicioArrastoCanvas.y;

    stageRef.current.scrollLeft -= deltaX;
    stageRef.current.scrollTop -= deltaY;

    setInicioArrastoCanvas({
      x: e.clientX,
      y: e.clientY,
    });
  }

  function finalizarArrastoCanvas() {
    setArrastandoCanvas(false);
  }

  async function salvarConfiguracao() {
    try {
      setSalvando(true);

      const res = await fetch("/api/admin/configuracoes/certificado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          certificadoTemplateUrl,
          certificadoPreviewUrl,
          certificadoCoordenadorNome,
          certificadoCidade,
          certificadoModoFundo: modoFundo,
          certificadoCorFundoPagina: corFundoPagina,
          certificadoTamanhoPapel: tamanhoPapel,
          certificadoOrientacao: orientacao,
          certificadoLarguraBase: baseCanvas.largura,
          certificadoAlturaBase: baseCanvas.altura,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensagemErro(data?.detalhe || data?.error || tr("errors.saveGeneric"));
        return;
      }

      setMensagemSucesso(tr("messages.certificateConfigSaved"));
    } catch {
      setMensagemErro(tr("errors.saveCertificateConfig"));
    } finally {
      setSalvando(false);
    }
  }

  async function adicionarCampo(tipo: string, textoTipo?: "TITULO" | "TEXTO") {
    try {
      const larguraInicial =
        tipo === "DISCIPLINAS_CONCLUIDAS"
          ? 340
          : tipo === "QR_CODE"
            ? 120
            : tipo === "TEXTO_LIVRE"
              ? textoTipo === "TITULO"
                ? 420
                : 320
              : 220;

      const alturaInicial =
        tipo === "DISCIPLINAS_CONCLUIDAS"
          ? 110
          : tipo === "QR_CODE"
            ? 120
            : tipo === "TEXTO_LIVRE"
              ? textoTipo === "TITULO"
                ? 70
                : 120
              : 40;

      const res = await fetch("/api/admin/certificado-campos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo,
          x: orientacao === "paisagem" ? 180 : 120,
          y: 140,
          largura: larguraInicial,
          altura: alturaInicial,
          fonte: "Helvetica",
          tamanho:
            tipo === "DISCIPLINAS_CONCLUIDAS"
              ? 14
              : tipo === "TEXTO_LIVRE" && textoTipo === "TITULO"
                ? 34
                : tipo === "TEXTO_LIVRE"
                  ? 18
                  : 18,
          cor: "#1e3a8a",
          alinhamento: "left",
          pagina: 1,
          texto:
            tipo === "TEXTO_LIVRE"
              ? textoTipo === "TITULO"
                ? tr("text.placeholderTitle")
                : tr("text.placeholderText")
              : undefined,
          textoTipo: tipo === "TEXTO_LIVRE" ? textoTipo || "TEXTO" : undefined,
          negrito: tipo === "TEXTO_LIVRE" && textoTipo === "TITULO",

          lineHeight: tipo === "DISCIPLINAS_CONCLUIDAS" ? 1.35 : undefined,
          quantidadeDisciplinas:
            tipo === "DISCIPLINAS_CONCLUIDAS" ? 3 : undefined,
          colunasDisciplinas: tipo === "DISCIPLINAS_CONCLUIDAS" ? 1 : undefined,
          espacoColunasDisciplinas:
            tipo === "DISCIPLINAS_CONCLUIDAS" ? 12 : undefined,
          dadosJson:
            tipo === "DISCIPLINAS_CONCLUIDAS"
              ? {
                quantidadeDisciplinas: 3,
                colunasDisciplinas: 1,
                espacoColunasDisciplinas: 12,
                lineHeight: 1.35,
              }
              : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensagemErro(
          data?.detalhe || data?.error || tr("errors.addField"),
        );
        return;
      }

      setCampos((prev) => [
        ...prev,
        {
          ...(data?.dadosJson || {}),
          ...data,
          quantidadeDisciplinas:
            tipo === "DISCIPLINAS_CONCLUIDAS"
              ? (data?.dadosJson?.quantidadeDisciplinas ?? 3)
              : data?.quantidadeDisciplinas,
          colunasDisciplinas:
            tipo === "DISCIPLINAS_CONCLUIDAS"
              ? (data?.dadosJson?.colunasDisciplinas ?? 1)
              : data?.colunasDisciplinas,
          espacoColunasDisciplinas:
            tipo === "DISCIPLINAS_CONCLUIDAS"
              ? (data?.dadosJson?.espacoColunasDisciplinas ?? 12)
              : data?.espacoColunasDisciplinas,
          lineHeight:
            tipo === "DISCIPLINAS_CONCLUIDAS"
              ? (data?.dadosJson?.lineHeight ?? 1.35)
              : data?.lineHeight,
        },
      ]);
      setCampoSelecionadoId(data.id);
    } catch {
      setMensagemErro(tr("errors.addField"));
    }
  }

  async function atualizarCampo(
    id: number,
    payload: Partial<CampoCertificado>,
  ) {
    try {
      if (payload.tipo === "IMAGEM" || payload.tipo === "FORMA") {
        setCampos((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...payload } : c)),
        );
        return;
      }

      setSalvandoCampo(true);

      const res = await fetch("/api/admin/certificado-campos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...payload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensagemErro(
          data?.detalhe || data?.error || tr("errors.updateField"),
        );
        return;
      }

      setCampos((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
              ...c,
              ...data,
              ...payload,
            }
            : c,
        ),
      );
    } catch {
      setMensagemErro(tr("errors.updateField"));
    } finally {
      setSalvandoCampo(false);
    }
  }

  async function excluirCampo(id: number) {
    const campo = campos.find((c) => c.id === id);

    if (!campo) return;

    const urlSelecionada =
      (campo as any).imagemUrl ||
      (campo as any).url ||
      (campo as any).src ||
      (campo as any).arquivoUrl ||
      (campo as any).previewUrl ||
      "";

    const camposParaExcluir = campos.filter((c) => {
      const mesmaId = c.id === id || (c as any).bancoId === id;

      const urlCampo =
        (c as any).imagemUrl ||
        (c as any).url ||
        (c as any).src ||
        (c as any).arquivoUrl ||
        (c as any).previewUrl ||
        "";

      const mesmaImagem =
        campo.tipo === "IMAGEM" &&
        c.tipo === "IMAGEM" &&
        urlSelecionada &&
        urlCampo === urlSelecionada;

      return mesmaId || mesmaImagem;
    });

    try {
      for (const item of camposParaExcluir) {
        const idBanco = Number((item as any).bancoId || item.id);

        if (Number.isFinite(idBanco) && idBanco > 0) {
          await fetch(`/api/admin/certificado-campos?id=${idBanco}`, {
            method: "DELETE",
          });
        }
      }

      setCampos((prev) =>
        prev.filter((c) => !camposParaExcluir.some((item) => item.id === c.id)),
      );

      if (campoSelecionadoId === id) {
        setCampoSelecionadoId(null);
      }

      setMensagemSucesso(tr("messages.fieldDeleted"));
      setTimeout(() => setMensagemSucesso(""), 2500);
    } catch {
      setMensagemErro(tr("errors.deleteField"));
    }
  }

  function atualizarCampoLocal<K extends keyof CampoCertificado>(
    chave: K,
    valor: CampoCertificado[K],
  ) {
    if (!campoSelecionado) return;

    setCampos((prev) =>
      prev.map((c) => {
        if (c.id !== campoSelecionado.id) return c;

        const campoAtualizado: CampoCertificado = {
          ...c,
          [chave]: valor,
        };

        const ehTagDeTexto =
          campoAtualizado.tipo !== "FORMA" &&
          campoAtualizado.tipo !== "IMAGEM" &&
          campoAtualizado.tipo !== "TEXTO_LIVRE" &&
          campoAtualizado.tipo !== "ASSINATURA" &&
          campoAtualizado.tipo !== "LOGO_INSTITUICAO" &&
          campoAtualizado.tipo !== "QR_CODE";

        if (chave === "tamanho" && ehTagDeTexto) {
          const novoTamanho = Number(valor || campoAtualizado.tamanho || 18);

          return {
            ...campoAtualizado,
            altura: Math.max(
              Number(campoAtualizado.altura || 0),
              Math.ceil(novoTamanho * 1.65),
            ),
            largura: Math.max(
              Number(campoAtualizado.largura || 0),
              Math.ceil(novoTamanho * 8),
            ),
            lineHeight: campoAtualizado.lineHeight || 1.2,
          };
        }

        return campoAtualizado;
      }),
    );
  }

  function gerarCopiasArray(preview = false) {
    if (!campoSelecionado || campoSelecionado.tipo !== "FORMA") return [];

    const quantidade = Math.max(1, Math.min(100, Number(arrayQuantidade || 1)));
    const base = JSON.parse(JSON.stringify(campoSelecionado));

    return Array.from({ length: quantidade }).map((_, index) => {
      const passo = index + 1;
      const novoId = preview ? -(Date.now() + passo) : Date.now() + passo;

      const escala = Number(arrayEscala || 100) / 100;
      const opacidade = Number(arrayOpacidade || 100) / 100;
      const anguloRad = (Number(arrayAngulo || 0) * Math.PI) / 180;

      const baseX = Number(arrayX || 0) * passo;
      const baseY = Number(arrayY || 0) * passo;

      const deslocamentoRotacionadoX =
        baseX * Math.cos(anguloRad) - baseY * Math.sin(anguloRad);

      const deslocamentoRotacionadoY =
        baseX * Math.sin(anguloRad) + baseY * Math.cos(anguloRad);
      return {
        ...base,
        id: novoId,
        bancoId: undefined,
        tempId: novoId,
        arrayPreview: preview,
        x: Number(base.x || 0) + deslocamentoRotacionadoX,
        y: Number(base.y || 0) + deslocamentoRotacionadoY,
        largura: Number(base.largura || 100) * Math.pow(escala, passo),
        altura: Number(base.altura || 100) * Math.pow(escala, passo),
        rotate: Number(base.rotate || 0) + Number(arrayRotacao || 0) * passo,
        opacity: Math.max(
          0.05,
          Number(base.opacity || 1) * Math.pow(opacidade, passo),
        ),
        ordem: Number(base.ordem || 5) + passo,
        nomeCamada: `${base.nomeCamada || traduzirFormaCertificado(base.forma) || tr("layers.shape")} ${tr("layers.copyNumber", { number: passo })}`,
      };
    });
  }

  function gerarCopiasArraySelecionado(preview = false) {
    const ids = idsAlvoDaAcao();

    const bases = campos.filter(
      (campo) =>
        ids.includes(campo.id) &&
        campo.tipo === "FORMA" &&
        !(campo as any).arrayPreview,
    );

    if (bases.length === 0) return [];

    const quantidade = Math.max(1, Math.min(100, Number(arrayQuantidade || 1)));

    const anguloRad = (Number(arrayAngulo || 0) * Math.PI) / 180;
    const escalaPorCopia = Number(arrayEscala || 100) / 100;
    const opacidadePorCopia = Number(arrayOpacidade || 100) / 100;

    const resultado: CampoCertificado[] = [];

    for (let indexCopia = 0; indexCopia < quantidade; indexCopia++) {
      const passo = indexCopia + 1;

      const baseX = Number(arrayX || 0) * passo;
      const baseY = Number(arrayY || 0) * passo;

      const deslocamentoX =
        baseX * Math.cos(anguloRad) - baseY * Math.sin(anguloRad);

      const deslocamentoY =
        baseX * Math.sin(anguloRad) + baseY * Math.cos(anguloRad);

      const novoGrupoId =
        bases.length > 1
          ? preview
            ? `preview-grupo-array-${passo}`
            : `grupo-array-${Date.now()}-${passo}`
          : null;

      bases.forEach((base, indexBase) => {
        const novoId = preview
          ? -1 * (passo * 100000 + indexBase + 1)
          : Date.now() + passo * 1000 + indexBase;

        const novaLargura =
          Number(base.largura || 120) * Math.pow(escalaPorCopia, passo);

        const novaAltura =
          Number(base.altura || 40) * Math.pow(escalaPorCopia, passo);

        const novosDados = {
          x: Math.round(Number(base.x || 0) + deslocamentoX),
          y: Math.round(Number(base.y || 0) + deslocamentoY),
          largura: Math.round(Math.max(4, novaLargura)),
          altura: Math.round(Math.max(4, novaAltura)),
          rotate:
            Number((base as any).rotate || 0) +
            Number(arrayRotacao || 0) * passo,
          opacity: Math.max(
            0.05,
            Number((base as any).opacity || 1) *
            Math.pow(opacidadePorCopia, passo),
          ),
          grupoId: novoGrupoId,
        };

        resultado.push({
          ...JSON.parse(JSON.stringify(base)),
          ...novosDados,
          id: novoId,
          bancoId: undefined,
          tempId: novoId,
          arrayPreview: preview,
          arrayAtivo: false,
          arrayConfig: null,
          nomeCamada: `${base.nomeCamada || traduzirFormaCertificado(base.forma) || tr("layers.shape")} ${tr("layers.copyNumber", { number: passo })}`,
          ordem: Number(base.ordem || 5) + passo / 100,
          dadosJson: {
            ...((base as any).dadosJson || {}),
            ...novosDados,
            id: undefined,
            bancoId: undefined,
            tempId: novoId,
            arrayPreview: preview,
            arrayAtivo: false,
            arrayConfig: null,
          },
        } as any);
      });
    }

    return resultado;
  }

  useEffect(() => {
    if (!modalArrayAberto) {
      setCopiasPreviewArray([]);
      return;
    }

    const ids = idsAlvoDaAcao();
    const itens = campos.filter(
      (campo) =>
        ids.includes(campo.id) &&
        campo.tipo === "FORMA" &&
        !(campo as any).arrayPreview,
    );

    if (itens.length === 0) {
      setCopiasPreviewArray([]);
      return;
    }

    setCopiasPreviewArray(gerarCopiasArraySelecionado(true));
  }, [
    modalArrayAberto,
    campoSelecionadoId,
    camposSelecionadosIds,
    campos,
    arrayQuantidade,
    arrayX,
    arrayY,
    arrayRotacao,
    arrayEscala,
    arrayOpacidade,
    arrayAngulo,
  ]);

  function aplicarArrayForma() {
    const ids = idsAlvoDaAcao();

    const formasSelecionadas = campos.filter(
      (campo) =>
        ids.includes(campo.id) &&
        campo.tipo === "FORMA" &&
        !(campo as any).arrayPreview,
    );

    if (formasSelecionadas.length === 0) {
      setMensagemErro(
        tr("errors.selectShapeForArray"),
      );
      setTimeout(() => setMensagemErro(""), 2200);
      return;
    }

    registrarHistoricoAntesDaAcao();

    // Grupo: cria cópias reais de todas as formas do grupo
    if (formasSelecionadas.length > 1) {
      const copias = gerarCopiasArraySelecionado(false);
      const novosIds = copias.map((campo) => campo.id);

      setCampos((prev) => [...prev, ...copias]);
      setCamposSelecionadosIds(novosIds);
      setCampoSelecionadoId(novosIds[novosIds.length - 1] || null);

      setCopiasPreviewArray([]);
      setModalArrayAberto(false);
      setShapeInspectorAberto(false);

      setMensagemSucesso(tr("messages.arrayAppliedGroup"));
      setTimeout(() => setMensagemSucesso(""), 1800);
      return;
    }

    // Forma única: mantém o comportamento antigo
    const campoBase = formasSelecionadas[0];

    const arrayConfig = {
      ativo: true,
      quantidade: Math.max(1, Math.min(100, Number(arrayQuantidade || 1))),
      distanciaX: Number(arrayX || 0),
      distanciaY: Number(arrayY || 0),
      angulo: Number(arrayAngulo || 0),
      rotacaoPorCopia: Number(arrayRotacao || 0),
      escala: Number(arrayEscala || 100),
      opacidade: Number(arrayOpacidade || 100),
    };

    setCampos((prev) =>
      prev.map((campo) =>
        campo.id === campoBase.id
          ? ({
            ...campo,
            arrayAtivo: true,
            arrayConfig,
            nomeCamada: campo.nomeCamada || tr("array.layerName"),
            dadosJson: {
              ...((campo as any).dadosJson || {}),
              arrayAtivo: true,
              arrayConfig,
            },
          } as any)
          : campo,
      ),
    );

    setCopiasPreviewArray([]);
    setModalArrayAberto(false);
    setShapeInspectorAberto(false);

    setMensagemSucesso(tr("messages.arrayAppliedShape"));
    setTimeout(() => setMensagemSucesso(""), 1800);
  }

  function idsAlvoDaAcao() {
    const idsBase =
      camposSelecionadosIds.length > 0
        ? camposSelecionadosIds
        : campoSelecionadoId
          ? [campoSelecionadoId]
          : [];

    const idsExpandidos = idsBase.flatMap((id) => {
      const campo = campos.find((item) => item.id === id);

      if (!campo) return [];
      if ((campo as any).arrayPreview) return [];

      if (campo.grupoId) {
        return campos
          .filter(
            (item) =>
              item.grupoId === campo.grupoId && !(item as any).arrayPreview,
          )
          .map((item) => item.id);
      }

      return [campo.id];
    });

    return Array.from(new Set(idsExpandidos));
  }

  useEffect(() => {
    function colarCamposCopiados(deslocamento: number, mensagem: string) {
      if (!campoCopiado) {
        setMensagemErro(tr("errors.copyBeforePaste"));
        setTimeout(() => setMensagemErro(""), 1600);
        return;
      }

      registrarHistoricoAntesDaAcao();

      const itensOriginais = Array.isArray(campoCopiado?.itens)
        ? campoCopiado.itens
        : [campoCopiado];

      const novoGrupoId =
        itensOriginais.length > 1 ? `grupo-${Date.now()}` : null;

      const agora = Date.now();

      const novosCampos = itensOriginais.map(
        (item: CampoCertificado, index: number) => {
          const novoId = agora + index + 1;
          const novoX = Number(item.x || 0) + deslocamento;
          const novoY = Number(item.y || 0) + deslocamento;

          return {
            ...JSON.parse(JSON.stringify(item)),
            id: novoId,
            bancoId: undefined,
            tempId: novoId,
            grupoId: novoGrupoId,
            x: novoX,
            y: novoY,
            dadosJson: {
              ...((item as any).dadosJson || {}),
              id: undefined,
              bancoId: undefined,
              tempId: novoId,
              grupoId: novoGrupoId,
              x: novoX,
              y: novoY,
            },
          } as CampoCertificado;
        },
      );

      const novosIds = novosCampos.map((campo) => campo.id);

      setCampos((prev) => [...prev, ...novosCampos]);
      setCamposSelecionadosIds(novosIds);
      setCampoSelecionadoId(novosIds[novosIds.length - 1] || null);

      setMensagemSucesso(mensagem);
      setTimeout(() => setMensagemSucesso(""), 1200);
    }

    function handleCopiarColar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      const tag = alvo?.tagName?.toLowerCase();

      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        alvo?.isContentEditable
      ) {
        return;
      }

      const teclasSeta = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

      if (teclasSeta.includes(e.key)) {
        const ids = idsAlvoDaAcao();

        if (ids.length === 0) return;

        e.preventDefault();

        const passo = e.shiftKey ? 10 : 1;

        const dx =
          e.key === "ArrowLeft" ? -passo : e.key === "ArrowRight" ? passo : 0;

        const dy =
          e.key === "ArrowUp" ? -passo : e.key === "ArrowDown" ? passo : 0;

        registrarHistoricoAntesDaAcao();

        setCampos((prev) =>
          prev.map((campo) => {
            if (!ids.includes(campo.id)) return campo;
            if ((campo as any).bloqueado) return campo;

            const novoX = Number(campo.x || 0) + dx;
            const novoY = Number(campo.y || 0) + dy;

            return {
              ...campo,
              x: novoX,
              y: novoY,
              dadosJson: {
                ...((campo as any).dadosJson || {}),
                x: novoX,
                y: novoY,
              },
            };
          }),
        );

        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        const ids = idsAlvoDaAcao();

        if (ids.length === 0) return;

        e.preventDefault();

        const itensCopiados = campos
          .filter((campo) => ids.includes(campo.id))
          .map((campo) => JSON.parse(JSON.stringify(campo)));

        setCampoCopiado({
          tipo: itensCopiados.length > 1 ? "GRUPO" : "CAMPO",
          itens: itensCopiados,
        });

        setMensagemSucesso(
          itensCopiados.length > 1 ? tr("messages.groupCopied") : tr("messages.fieldCopied"),
        );
        setTimeout(() => setMensagemSucesso(""), 1200);

        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();

        colarCamposCopiados(
          24,
          Array.isArray(campoCopiado?.itens) && campoCopiado.itens.length > 1
            ? tr("messages.groupPasted")
            : tr("messages.fieldPasted"),
        );

        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();

        colarCamposCopiados(
          0,
          Array.isArray(campoCopiado?.itens) && campoCopiado.itens.length > 1
            ? tr("messages.groupPastedSamePlace")
            : tr("messages.fieldPastedSamePlace"),
        );

        return;
      }
    }

    window.addEventListener("keydown", handleCopiarColar);

    return () => {
      window.removeEventListener("keydown", handleCopiarColar);
    };
  }, [campoCopiado, campos, camposSelecionadosIds, campoSelecionadoId]);

  function abrirMenuFerramentasSelecao() {
    const ids = idsAlvoDaAcao();

    if (ids.length === 0) {
      setMensagemErro(tr("errors.selectShapeForTools"));
      setTimeout(() => setMensagemErro(""), 2000);
      return;
    }

    const campoIdMenu =
      campoSelecionadoId && ids.includes(campoSelecionadoId)
        ? campoSelecionadoId
        : ids[ids.length - 1];

    const campo = campos.find((item) => item.id === campoIdMenu);

    if (!campo || campo.tipo !== "FORMA") {
      setMensagemErro(
        tr("errors.toolsOnlyForShapes"),
      );
      setTimeout(() => setMensagemErro(""), 2200);
      return;
    }

    setCampoSelecionadoId(campoIdMenu);
    setPontoFormaSelecionado(null);

    // fecha o menu do botão direito, se estiver aberto
    setMenuContexto(null);
    setMenuCamada(null);
    setMenuPontoGradiente(null);

    // abre o painel correto: Opções da forma / Array / Multiplicar
    trazerPainelFlutuanteParaFrente("opcoesForma");
    setShapeInspectorAberto(true);
    setShapeInspectorPosicao({
      x: Math.max(
        24,
        Math.min(window.innerWidth - 340, window.innerWidth - 390),
      ),
      y: 160,
    });
  }

  function idsDoCampoOuGrupo(campo: CampoCertificado) {
    if (campo?.grupoId) {
      return campos
        .filter((item) => item.grupoId === campo.grupoId)
        .map((item) => item.id);
    }

    return [campo.id];
  }

  function selecionarCampoNoCanvas(
    event: React.MouseEvent<HTMLDivElement>,
    campo: CampoCertificado,
  ) {
    event.stopPropagation();

    if (event.button === 2) return;

    const idsDoCampo = idsDoCampoOuGrupo(campo);

    setCampoSelecionadoId(campo.id);
    setPontoFormaSelecionado(null);

    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      setCamposSelecionadosIds((prev) => {
        const todosJaSelecionados = idsDoCampo.every((id) => prev.includes(id));

        if (todosJaSelecionados) {
          return prev.filter((id) => !idsDoCampo.includes(id));
        }

        return Array.from(new Set([...prev, ...idsDoCampo]));
      });

      return;
    }

    setCamposSelecionadosIds(idsDoCampo);
    iniciarDrag(event as any, campo);
  }

  function iniciarRedimensionamentoGrupo(e: React.MouseEvent<HTMLDivElement>) {
    if (!caixaDoGrupoSelecionado) return;

    e.stopPropagation();
    e.preventDefault();

    const ids = idsAlvoDaAcao();

    if (ids.length < 2) return;

    registrarHistoricoAntesDaAcao();

    const startX = e.clientX;
    const startY = e.clientY;

    const caixaInicial = {
      x: Number(caixaDoGrupoSelecionado.x || 0),
      y: Number(caixaDoGrupoSelecionado.y || 0),
      largura: Math.max(1, Number(caixaDoGrupoSelecionado.largura || 1)),
      altura: Math.max(1, Number(caixaDoGrupoSelecionado.altura || 1)),
    };

    const proporcaoGrupo = caixaInicial.largura / caixaInicial.altura;

    const arredondar = (valor: number) => Number(valor.toFixed(3));

    const itensIniciais = campos
      .filter((campo) => ids.includes(campo.id))
      .map((campo) => ({
        id: campo.id,
        x: Number(campo.x || 0),
        y: Number(campo.y || 0),
        largura: Number(campo.largura || 120),
        altura: Number(campo.altura || 40),
        tamanho: Number(campo.tamanho || 18),
        contornoEspessura:
          campo.contornoEspessura !== null &&
            campo.contornoEspessura !== undefined
            ? Number(campo.contornoEspessura)
            : null,
        sombraBlur:
          campo.sombraBlur !== null && campo.sombraBlur !== undefined
            ? Number(campo.sombraBlur)
            : null,
        sombraDistancia:
          campo.sombraDistancia !== null && campo.sombraDistancia !== undefined
            ? Number(campo.sombraDistancia)
            : null,
        sombraX:
          campo.sombraX !== null && campo.sombraX !== undefined
            ? Number(campo.sombraX)
            : null,
        sombraY:
          campo.sombraY !== null && campo.sombraY !== undefined
            ? Number(campo.sombraY)
            : null,
      }));

    const move = (ev: globalThis.MouseEvent) => {
      const deltaX = (ev.clientX - startX) / escala;
      const deltaY = (ev.clientY - startY) / escala;

      const deltaDominante =
        Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : deltaY * proporcaoGrupo;

      const novaLarguraGrupo = Math.max(
        1,
        caixaInicial.largura + deltaDominante,
      );

      const fator = Math.max(0.02, novaLarguraGrupo / caixaInicial.largura);

      setCampos((prev) =>
        prev.map((campo) => {
          const itemInicial = itensIniciais.find(
            (item) => item.id === campo.id,
          );

          if (!itemInicial) return campo;
          if ((campo as any).bloqueado) return campo;

          const novoX =
            caixaInicial.x + (itemInicial.x - caixaInicial.x) * fator;

          const novoY =
            caixaInicial.y + (itemInicial.y - caixaInicial.y) * fator;

          const novosDados: Partial<CampoCertificado> = {
            x: arredondar(novoX),
            y: arredondar(novoY),

            // Não use mínimo 4 aqui, porque isso deforma peças pequenas.
            largura: arredondar(Math.max(0.25, itemInicial.largura * fator)),
            altura: arredondar(Math.max(0.25, itemInicial.altura * fator)),
          };

          if (
            campo.tipo === "TEXTO" ||
            campo.tipo === "TEXTO_LIVRE" ||
            campo.tipo === "NOME_ALUNO" ||
            campo.tipo === "NOME_CURSO" ||
            campo.tipo === "DISCIPLINAS_CONCLUIDAS"
          ) {
            novosDados.tamanho = arredondar(
              Math.max(1, itemInicial.tamanho * fator),
            );
          }

          if (
            campo.tipo === "FORMA" &&
            itemInicial.contornoEspessura !== null
          ) {
            novosDados.contornoEspessura = arredondar(
              Math.max(0.1, itemInicial.contornoEspessura * fator),
            );
          }

          if (itemInicial.sombraBlur !== null) {
            novosDados.sombraBlur = arredondar(
              Math.max(0, itemInicial.sombraBlur * fator),
            );
          }

          if (itemInicial.sombraDistancia !== null) {
            novosDados.sombraDistancia = arredondar(
              itemInicial.sombraDistancia * fator,
            );
          }

          if (itemInicial.sombraX !== null) {
            novosDados.sombraX = arredondar(itemInicial.sombraX * fator);
          }

          if (itemInicial.sombraY !== null) {
            novosDados.sombraY = arredondar(itemInicial.sombraY * fator);
          }

          return {
            ...campo,
            ...novosDados,
            dadosJson: {
              ...((campo as any).dadosJson || {}),
              ...novosDados,
            },
          };
        }),
      );
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function iniciarRotacaoGrupo(e: React.MouseEvent<HTMLDivElement>) {
    if (!caixaDoGrupoSelecionado || !canvasRef.current) return;

    e.stopPropagation();
    e.preventDefault();

    const ids = idsAlvoDaAcao();

    if (ids.length < 2) {
      setMensagemErro(tr("errors.selectTwoToRotate"));
      setTimeout(() => setMensagemErro(""), 2200);
      return;
    }

    registrarHistoricoAntesDaAcao();

    const caixaInicial = {
      x: caixaDoGrupoSelecionado.x,
      y: caixaDoGrupoSelecionado.y,
      largura: Math.max(1, caixaDoGrupoSelecionado.largura),
      altura: Math.max(1, caixaDoGrupoSelecionado.altura),
    };

    const centroCanvasX = caixaInicial.x + caixaInicial.largura / 2;
    const centroCanvasY = caixaInicial.y + caixaInicial.altura / 2;

    const canvasRect = canvasRef.current.getBoundingClientRect();

    const centroTelaX = canvasRect.left + centroCanvasX * escala;
    const centroTelaY = canvasRect.top + centroCanvasY * escala;

    const anguloInicialMouse = Math.atan2(
      e.clientY - centroTelaY,
      e.clientX - centroTelaX,
    );

    const itensIniciais = campos
      .filter((campo) => ids.includes(campo.id))
      .map((campo) => {
        const largura = Number(campo.largura || 120);
        const altura = Number(campo.altura || 40);
        const centroItemX = Number(campo.x || 0) + largura / 2;
        const centroItemY = Number(campo.y || 0) + altura / 2;

        return {
          id: campo.id,
          x: Number(campo.x || 0),
          y: Number(campo.y || 0),
          largura,
          altura,
          rotate: Number((campo as any).rotate || 0),
          relX: centroItemX - centroCanvasX,
          relY: centroItemY - centroCanvasY,
        };
      });

    const mover = (ev: globalThis.MouseEvent) => {
      const anguloAtualMouse = Math.atan2(
        ev.clientY - centroTelaY,
        ev.clientX - centroTelaX,
      );

      const deltaRad = anguloAtualMouse - anguloInicialMouse;
      const deltaDeg = (deltaRad * 180) / Math.PI;

      const cos = Math.cos(deltaRad);
      const sin = Math.sin(deltaRad);

      setCampos((prev) =>
        prev.map((campo) => {
          const inicial = itensIniciais.find((item) => item.id === campo.id);

          if (!inicial) return campo;
          if ((campo as any).bloqueado) return campo;

          const novoRelX = inicial.relX * cos - inicial.relY * sin;
          const novoRelY = inicial.relX * sin + inicial.relY * cos;

          const novoCentroX = centroCanvasX + novoRelX;
          const novoCentroY = centroCanvasY + novoRelY;

          const novosDados = {
            x: Math.round(novoCentroX - inicial.largura / 2),
            y: Math.round(novoCentroY - inicial.altura / 2),
            rotate: Math.round(inicial.rotate + deltaDeg),
          };

          return {
            ...campo,
            ...novosDados,
            dadosJson: {
              ...((campo as any).dadosJson || {}),
              ...novosDados,
            },
          };
        }),
      );
    };

    const soltar = () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
    };

    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
  }

  function camposSelecionadosParaAlinhamento() {
    const ids =
      camposSelecionadosIds.length > 1
        ? camposSelecionadosIds
        : campoSelecionadoId
          ? [campoSelecionadoId]
          : [];

    return campos.filter((campo) => ids.includes(campo.id));
  }

  function campoReferenciaAlinhamento() {
    const selecionados = camposSelecionadosParaAlinhamento();

    if (selecionados.length < 2) return null;

    const referencia =
      selecionados.find((campo) => campo.id === campoSelecionadoId) ||
      selecionados[0];

    return referencia;
  }

  function atualizarGeometriaCampo(
    campo: CampoCertificado,
    valores: Partial<CampoCertificado>,
  ) {
    return {
      ...campo,
      ...valores,
      dadosJson: {
        ...((campo as any).dadosJson || {}),
        ...valores,
      },
    };
  }

  type UnidadeAlinhamento = {
    chave: string;
    ids: number[];
    x: number;
    y: number;
    largura: number;
    altura: number;
    direita: number;
    baixo: number;
    centroX: number;
    centroY: number;
  };

  function caixaDosCamposParaAlinhamento(itens: CampoCertificado[]) {
    const minX = Math.min(...itens.map((campo) => Number(campo.x || 0)));
    const minY = Math.min(...itens.map((campo) => Number(campo.y || 0)));

    const maxX = Math.max(
      ...itens.map(
        (campo) => Number(campo.x || 0) + Number(campo.largura || 120),
      ),
    );

    const maxY = Math.max(
      ...itens.map(
        (campo) => Number(campo.y || 0) + Number(campo.altura || 40),
      ),
    );

    const largura = Math.max(1, maxX - minX);
    const altura = Math.max(1, maxY - minY);

    return {
      x: minX,
      y: minY,
      largura,
      altura,
      direita: minX + largura,
      baixo: minY + altura,
      centroX: minX + largura / 2,
      centroY: minY + altura / 2,
    };
  }

  function unidadesSelecionadasParaAlinhamento(): UnidadeAlinhamento[] {
    const idsBase =
      camposSelecionadosIds.length > 0
        ? camposSelecionadosIds
        : campoSelecionadoId
          ? [campoSelecionadoId]
          : [];

    const mapa = new Map<string, CampoCertificado[]>();

    idsBase.forEach((id) => {
      const campo = campos.find((item) => item.id === id);

      if (!campo) return;
      if ((campo as any).arrayPreview) return;

      const grupoId = (campo as any).grupoId;
      const chave = grupoId ? `grupo:${grupoId}` : `campo:${campo.id}`;

      const itensDaUnidade = grupoId
        ? campos.filter(
          (item) =>
            (item as any).grupoId === grupoId && !(item as any).arrayPreview,
        )
        : [campo];

      const atuais = mapa.get(chave) || [];

      itensDaUnidade.forEach((item) => {
        if (!atuais.some((atual) => atual.id === item.id)) {
          atuais.push(item);
        }
      });

      mapa.set(chave, atuais);
    });

    return Array.from(mapa.entries())
      .map(([chave, itens]) => {
        const caixa = caixaDosCamposParaAlinhamento(itens);

        return {
          chave,
          ids: itens.map((item) => item.id),
          ...caixa,
        };
      })
      .filter((unidade) => unidade.ids.length > 0);
  }

  function escalarCampoDentroDaUnidade(
    campo: CampoCertificado,
    unidade: UnidadeAlinhamento,
    fator: number,
  ) {
    const x = Number(campo.x || 0);
    const y = Number(campo.y || 0);
    const largura = Number(campo.largura || 120);
    const altura = Number(campo.altura || 40);

    const novosDados: any = {
      x: Math.round(unidade.x + (x - unidade.x) * fator),
      y: Math.round(unidade.y + (y - unidade.y) * fator),
      largura: Math.round(Math.max(4, largura * fator)),
      altura: Math.round(Math.max(4, altura * fator)),
    };

    if (
      campo.tipo === "TEXTO" ||
      campo.tipo === "TEXTO_LIVRE" ||
      campo.tipo === "NOME_ALUNO" ||
      campo.tipo === "NOME_CURSO" ||
      campo.tipo === "DISCIPLINAS_CONCLUIDAS"
    ) {
      novosDados.tamanho = Math.max(
        4,
        Math.round(Number(campo.tamanho || 18) * fator),
      );
    }

    return atualizarGeometriaCampo(campo, novosDados as any);
  }

  function centralizarSelecaoNaCena(tipo: "X" | "Y" | "XY") {
    const ids = idsAlvoDaAcao();

    if (ids.length === 0) {
      setMensagemErro(
        tr("errors.selectToCenter"),
      );
      setTimeout(() => setMensagemErro(""), 2200);
      return;
    }

    const itens = campos.filter(
      (campo: any) =>
        ids.includes(campo.id) &&
        campo.id !== -999999 &&
        campo.arrayPreview !== true &&
        !campo.idOriginalArray,
    );

    if (itens.length === 0) {
      setMensagemErro(tr("errors.noValidElementSelected"));
      setTimeout(() => setMensagemErro(""), 2200);
      return;
    }

    registrarHistoricoAntesDaAcao();

    const minX = Math.min(...itens.map((campo: any) => Number(campo.x || 0)));
    const minY = Math.min(...itens.map((campo: any) => Number(campo.y || 0)));

    const maxX = Math.max(
      ...itens.map(
        (campo: any) => Number(campo.x || 0) + Number(campo.largura || 120),
      ),
    );

    const maxY = Math.max(
      ...itens.map(
        (campo: any) => Number(campo.y || 0) + Number(campo.altura || 40),
      ),
    );

    const larguraSelecao = maxX - minX;
    const alturaSelecao = maxY - minY;

    const centroSelecaoX = minX + larguraSelecao / 2;
    const centroSelecaoY = minY + alturaSelecao / 2;

    const centroPaginaX = Number(baseCanvas.largura || 1123) / 2;
    const centroPaginaY = Number(baseCanvas.altura || 794) / 2;

    const deslocamentoX =
      tipo === "X" || tipo === "XY" ? centroPaginaX - centroSelecaoX : 0;

    const deslocamentoY =
      tipo === "Y" || tipo === "XY" ? centroPaginaY - centroSelecaoY : 0;

    setCampos((prev) =>
      prev.map((campo: any) => {
        if (!ids.includes(campo.id)) return campo;
        if (campo.bloqueado) return campo;

        const novosDados = {
          x: Math.round(Number(campo.x || 0) + deslocamentoX),
          y: Math.round(Number(campo.y || 0) + deslocamentoY),
        };

        return {
          ...campo,
          ...novosDados,
          dadosJson: {
            ...(campo.dadosJson || {}),
            ...novosDados,
          },
        };
      }),
    );

    setMensagemSucesso(tr("messages.selectionCentered"));
    setTimeout(() => setMensagemSucesso(""), 1800);
  }

  function duplicarSelecaoNoOposto(eixo: "X" | "Y" | "XY") {
    const ids = idsAlvoDaAcao();

    if (ids.length === 0) {
      setMensagemErro(
        tr("errors.selectToDuplicateOpposite"),
      );
      setTimeout(() => setMensagemErro(""), 1800);
      return;
    }

    const itensOriginais = campos.filter((campo: any) => {
      if (!ids.includes(campo.id)) return false;
      if (campo.id === -999999) return false;
      if (campo.arrayPreview === true) return false;
      if (campo.idOriginalArray) return false;

      return true;
    });

    if (itensOriginais.length === 0) {
      setMensagemErro(tr("errors.noValidItemSelected"));
      setTimeout(() => setMensagemErro(""), 1800);
      return;
    }

    registrarHistoricoAntesDaAcao();

    const minX = Math.min(
      ...itensOriginais.map((campo: any) => Number(campo.x || 0)),
    );
    const minY = Math.min(
      ...itensOriginais.map((campo: any) => Number(campo.y || 0)),
    );

    const maxX = Math.max(
      ...itensOriginais.map(
        (campo: any) => Number(campo.x || 0) + Number(campo.largura || 120),
      ),
    );

    const maxY = Math.max(
      ...itensOriginais.map(
        (campo: any) => Number(campo.y || 0) + Number(campo.altura || 40),
      ),
    );

    const larguraSelecao = maxX - minX;
    const alturaSelecao = maxY - minY;

    const larguraPagina = Number(baseCanvas.largura || 1123);
    const alturaPagina = Number(baseCanvas.altura || 794);

    const novoMinX =
      eixo === "X" || eixo === "XY"
        ? larguraPagina - minX - larguraSelecao
        : minX;

    const novoMinY =
      eixo === "Y" || eixo === "XY"
        ? alturaPagina - minY - alturaSelecao
        : minY;

    const deslocamentoX = novoMinX - minX;
    const deslocamentoY = novoMinY - minY;

    const novoGrupoId =
      itensOriginais.length > 1 ? `grupo-${Date.now()}` : null;

    const agora = Date.now();

    const novosCampos = itensOriginais.map((campo: any, index: number) => {
      const novoId = agora + index + 1;

      const novoX = Number(campo.x || 0) + deslocamentoX;
      const novoY = Number(campo.y || 0) + deslocamentoY;

      const campoClonado: any = {
        ...JSON.parse(JSON.stringify(campo)),
        id: novoId,
        bancoId: undefined,
        tempId: novoId,
        grupoId: novoGrupoId,
        x: Number(novoX.toFixed(3)),
        y: Number(novoY.toFixed(3)),
      };

      campoClonado.dadosJson = {
        ...((campo as any).dadosJson || {}),
        id: undefined,
        bancoId: undefined,
        tempId: novoId,
        grupoId: novoGrupoId,
        x: campoClonado.x,
        y: campoClonado.y,
      };

      return campoClonado as CampoCertificado;
    });

    const novosIds = novosCampos.map((campo) => campo.id);

    setCampos((prev) => [...prev, ...novosCampos]);
    setCamposSelecionadosIds(novosIds);
    setCampoSelecionadoId(novosIds[novosIds.length - 1] || null);

    setMensagemSucesso(
      eixo === "X"
        ? tr("messages.duplicatedOppositeHorizontal")
        : eixo === "Y"
          ? tr("messages.duplicatedOppositeVertical")
          : tr("messages.duplicatedOppositePage"),
    );

    setTimeout(() => setMensagemSucesso(""), 1600);
  }

  function alinharSelecionados(
    tipo:
      | "ESQUERDA"
      | "CENTRO_HORIZONTAL"
      | "DIREITA"
      | "TOPO"
      | "CENTRO_VERTICAL"
      | "BAIXO"
      | "MESMA_LARGURA"
      | "MESMA_ALTURA"
      | "MESMO_TAMANHO",
  ) {
    const unidades = unidadesSelecionadasParaAlinhamento();

    if (unidades.length < 2) {
      setMensagemErro(
        tr("errors.selectTwoToAlign"),
      );
      setTimeout(() => setMensagemErro(""), 2500);
      return;
    }

    const referencia =
      unidades.find(
        (unidade) =>
          campoSelecionadoId !== null &&
          unidade.ids.includes(campoSelecionadoId),
      ) || unidades[unidades.length - 1];

    const unidadesAlvo = unidades.filter(
      (unidade) => unidade.chave !== referencia.chave,
    );

    if (unidadesAlvo.length === 0) {
      setMensagemErro(tr("errors.selectOtherReference"));
      setTimeout(() => setMensagemErro(""), 2500);
      return;
    }

    registrarHistoricoAntesDaAcao();

    setCampos((prev) =>
      prev.map((campo) => {
        const unidade = unidadesAlvo.find((item) =>
          item.ids.includes(campo.id),
        );

        if (!unidade) return campo;
        if ((campo as any).bloqueado) return campo;

        const xAtual = Number(campo.x || 0);
        const yAtual = Number(campo.y || 0);

        if (tipo === "ESQUERDA") {
          const dx = referencia.x - unidade.x;

          return atualizarGeometriaCampo(campo, {
            x: Math.round(xAtual + dx),
          } as any);
        }

        if (tipo === "CENTRO_HORIZONTAL") {
          const dx = referencia.centroX - unidade.centroX;

          return atualizarGeometriaCampo(campo, {
            x: Math.round(xAtual + dx),
          } as any);
        }

        if (tipo === "DIREITA") {
          const dx = referencia.direita - unidade.direita;

          return atualizarGeometriaCampo(campo, {
            x: Math.round(xAtual + dx),
          } as any);
        }

        if (tipo === "TOPO") {
          const dy = referencia.y - unidade.y;

          return atualizarGeometriaCampo(campo, {
            y: Math.round(yAtual + dy),
          } as any);
        }

        if (tipo === "CENTRO_VERTICAL") {
          const dy = referencia.centroY - unidade.centroY;

          return atualizarGeometriaCampo(campo, {
            y: Math.round(yAtual + dy),
          } as any);
        }

        if (tipo === "BAIXO") {
          const dy = referencia.baixo - unidade.baixo;

          return atualizarGeometriaCampo(campo, {
            y: Math.round(yAtual + dy),
          } as any);
        }

        /*
          IMPORTANTE:
          Para grupos, não podemos fazer:
          largura: refLargura
          altura: refAltura
  
          Isso deforma cada pedacinho interno.
          Então usamos fator proporcional no grupo inteiro.
        */

        if (tipo === "MESMA_LARGURA") {
          const fator = referencia.largura / Math.max(1, unidade.largura);
          return escalarCampoDentroDaUnidade(campo, unidade, fator);
        }

        if (tipo === "MESMA_ALTURA") {
          const fator = referencia.altura / Math.max(1, unidade.altura);
          return escalarCampoDentroDaUnidade(campo, unidade, fator);
        }

        if (tipo === "MESMO_TAMANHO") {
          const fatorLargura =
            referencia.largura / Math.max(1, unidade.largura);
          const fatorAltura = referencia.altura / Math.max(1, unidade.altura);

          const fator = Math.min(fatorLargura, fatorAltura);

          return escalarCampoDentroDaUnidade(campo, unidade, fator);
        }

        return campo;
      }),
    );

    setMensagemSucesso(tr("messages.elementsAligned"));
    setTimeout(() => setMensagemSucesso(""), 1800);
  }

  function virarSelecionados(direcao: "HORIZONTAL" | "VERTICAL") {
    const ids = idsAlvoDaAcao();

    if (ids.length === 0) {
      setMensagemErro(tr("errors.selectShapeToFlip"));
      setTimeout(() => setMensagemErro(""), 2000);
      return;
    }

    registrarHistoricoAntesDaAcao();

    const itens = campos.filter((campo) => ids.includes(campo.id));

    const minX = Math.min(...itens.map((campo) => Number(campo.x || 0)));
    const minY = Math.min(...itens.map((campo) => Number(campo.y || 0)));

    const maxX = Math.max(
      ...itens.map(
        (campo) => Number(campo.x || 0) + Number(campo.largura || 120),
      ),
    );

    const maxY = Math.max(
      ...itens.map(
        (campo) => Number(campo.y || 0) + Number(campo.altura || 40),
      ),
    );

    const larguraGrupo = maxX - minX;
    const alturaGrupo = maxY - minY;
    const temGrupo = ids.length > 1;

    setCampos((prev) =>
      prev.map((campo) => {
        if (!ids.includes(campo.id)) return campo;
        if ((campo as any).bloqueado) return campo;

        const x = Number(campo.x || 0);
        const y = Number(campo.y || 0);
        const largura = Number(campo.largura || 120);
        const altura = Number(campo.altura || 40);

        const novosDados =
          direcao === "HORIZONTAL"
            ? {
              x: temGrupo
                ? Math.round(minX + larguraGrupo - (x - minX) - largura)
                : x,
              flipX: !(campo as any).flipX,
            }
            : {
              y: temGrupo
                ? Math.round(minY + alturaGrupo - (y - minY) - altura)
                : y,
              flipY: !(campo as any).flipY,
            };

        return {
          ...campo,
          ...novosDados,
          dadosJson: {
            ...((campo as any).dadosJson || {}),
            ...novosDados,
          },
        };
      }),
    );

    setMensagemSucesso(
      direcao === "HORIZONTAL"
        ? tr("messages.flippedHorizontal")
        : tr("messages.flippedVertical"),
    );

    setTimeout(() => setMensagemSucesso(""), 1500);
  }

  function impedirPerdaSelecaoTexto(e: React.MouseEvent) {
    if (temSelecaoTextoLivreSalva()) {
      e.preventDefault();
    }
  }

  function atualizarCamposAlvo(chave: keyof CampoCertificado, valor: any) {
    const ids = idsAlvoDaAcao();

    setCampos((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? ({ ...item, [chave]: valor } as any) : item,
      ),
    );
  }

  function temSelecaoTextoLivreSalva() {
    return (
      campoSelecionado?.tipo === "TEXTO_LIVRE" &&
      selecaoTextoInfoRef.current?.campoId === campoSelecionado.id &&
      selecaoTextoInfoRef.current.fim > selecaoTextoInfoRef.current.inicio
    );
  }

  function ehTextoPlaceholderPadrao(texto: string) {
    const valor = String(texto || "").trim();

    return [
      "Digite seu texto",
      "Digite seu título",
      "Enter your text",
      "Enter your title",
      "Escribe tu texto",
      "Escribe tu título",
      "Saisissez votre texte",
      "Saisissez votre titre",
      tr("text.placeholderText"),
      tr("text.placeholderTitle"),
    ].includes(valor);
  }

  function obterTamanhoTextoSelecionadoAtual() {
    const info = selecaoTextoInfoRef.current;

    if (!info || info.campoId !== campoSelecionadoId) {
      return tamanhoSelecaoTexto || campoSelecionado?.tamanho || 18;
    }

    const editor = document.querySelector(
      `[data-texto-livre-id="${campoSelecionadoId}"]`,
    ) as HTMLElement | null;

    if (!editor) return tamanhoSelecaoTexto || 18;

    const selecao = window.getSelection();
    const node = selecao?.anchorNode;
    const elemento =
      node?.nodeType === Node.TEXT_NODE
        ? node.parentElement
        : (node as HTMLElement | null);

    const span = elemento?.closest("span") as HTMLElement | null;

    if (span?.style.fontSize) {
      const tamanho = Number(span.style.fontSize.replace("px", ""));
      if (Number.isFinite(tamanho)) return tamanho;
    }

    return tamanhoSelecaoTexto || campoSelecionado?.tamanho || 18;
  }

  function alterarTamanhoTextoSelecionado(delta: number) {
    if (
      campoSelecionado?.tipo !== "TEXTO_LIVRE" ||
      !temSelecaoTextoLivreAtiva()
    ) {
      atualizarCampoLocal(
        "tamanho",
        Math.max(
          6,
          Math.min(120, (campoSelecionado?.tamanho || 18) + delta),
        ) as any,
      );
      return;
    }

    const editor = document.querySelector(
      `[data-texto-livre-id="${campoSelecionadoId}"]`,
    ) as HTMLElement | null;

    const selecao = window.getSelection();
    const node = selecao?.anchorNode;

    const elemento =
      node?.nodeType === Node.TEXT_NODE
        ? node.parentElement
        : (node as HTMLElement | null);

    const spanAtual = elemento?.closest("span") as HTMLElement | null;

    let tamanhoAtual = campoSelecionado?.tamanho || 18;

    if (spanAtual && editor?.contains(spanAtual)) {
      const computed = window.getComputedStyle(spanAtual).fontSize;
      tamanhoAtual = Number(computed.replace("px", "")) || tamanhoAtual;
    }

    const novo = Math.max(6, Math.min(120, tamanhoAtual + delta));

    setTamanhoSelecaoTexto(novo);

    aplicarEstiloTextoSelecionado({
      fontSize: `${novo}px`,
    });
  }

  function inserirTextoNoCursor(editor: HTMLElement, texto: string) {
    const selecao = window.getSelection();
    if (!selecao || selecao.rangeCount === 0) return;

    const range = selecao.getRangeAt(0);

    if (!editor.contains(range.commonAncestorContainer)) return;

    range.deleteContents();

    const node = document.createTextNode(texto);
    range.insertNode(node);

    range.setStartAfter(node);
    range.setEndAfter(node);

    selecao.removeAllRanges();
    selecao.addRange(range);
  }

  function obterTextoAntesDoCursor(editor: HTMLElement) {
    const selecao = window.getSelection();
    if (!selecao || selecao.rangeCount === 0) return "";

    const range = selecao.getRangeAt(0);
    const antes = range.cloneRange();

    antes.selectNodeContents(editor);
    antes.setEnd(range.startContainer, range.startOffset);

    return antes.toString();
  }

  function atualizarTextoLivreNoEstado(editor: HTMLElement) {
    const campoId = Number(editor.getAttribute("data-texto-livre-id"));

    setCampos((prev) =>
      prev.map((campo) =>
        campo.id === campoId
          ? {
            ...campo,
            texto: editor.innerText,
            textoHtml: editor.innerHTML,
          }
          : campo,
      ),
    );
  }

  function inserirMarcadorTextoSelecionado(marcador: string) {
    const editor = document.querySelector(
      `[data-texto-livre-id="${campoSelecionadoId}"]`,
    ) as HTMLElement | null;

    if (!editor) return;

    editor.focus();
    editor.setAttribute("data-marcador-ativo", marcador);

    const textoAntes = obterTextoAntesDoCursor(editor);
    const inicioDaLinha = textoAntes.split("\n").pop() || "";

    inserirTextoNoCursor(editor, `${marcador} `);

    atualizarTextoLivreNoEstado(editor);
  }

  function salvarHistoricoTextoLivre(editor: HTMLElement) {
    const campoId = Number(editor.getAttribute("data-texto-livre-id"));
    if (!campoId) return;

    const html = editor.innerHTML;
    const pilha = historicoTextoLivreRef.current[campoId] || [];

    if (pilha[pilha.length - 1] !== html) {
      historicoTextoLivreRef.current[campoId] = [...pilha, html].slice(-50);
    }
  }

  function desfazerTextoLivre(editor: HTMLElement) {
    const campoId = Number(editor.getAttribute("data-texto-livre-id"));
    const pilha = historicoTextoLivreRef.current[campoId] || [];

    if (pilha.length <= 1) return false;

    pilha.pop();

    const htmlAnterior = pilha[pilha.length - 1];
    if (htmlAnterior === undefined) return false;

    editor.innerHTML = htmlAnterior;

    historicoTextoLivreRef.current[campoId] = pilha;

    setCampos((prev) =>
      prev.map((campo) =>
        campo.id === campoId
          ? { ...campo, texto: editor.innerText, textoHtml: editor.innerHTML }
          : campo,
      ),
    );

    return true;
  }

  function gerarContornoExterno(cor: string, espessura: number) {
    const e = Math.max(1, Math.round(Number(espessura || 1)));
    const sombras: string[] = [];

    for (let x = -e; x <= e; x++) {
      for (let y = -e; y <= e; y++) {
        if (x === 0 && y === 0) continue;

        sombras.push(`${x}px ${y}px 0 ${cor}`);
      }
    }

    return sombras.join(", ");
  }

  function aplicarContornoTextoSelecionado(
    cor: string,
    espessura: number,
    tipo: "interno" | "externo" = tipoContornoTexto,
  ) {
    if (!contornoTextoAtivo) return;

    const esp = Math.max(1, Number(espessura || 1));

    if (tipo === "interno") {
      aplicarEstiloTextoSelecionado({
        WebkitTextStrokeColor: cor,
        WebkitTextStrokeWidth: `${esp}px`,
        paintOrder: "fill stroke",
        textShadow: "none",
      } as React.CSSProperties);
      return;
    }

    aplicarEstiloTextoSelecionado({
      WebkitTextStrokeWidth: "0px",
      paintOrder: "stroke fill",
      textShadow: gerarContornoExterno(cor, esp),
    } as React.CSSProperties);
  }

  function aplicarEstiloTextoSelecionado(estilo: React.CSSProperties) {
    aplicandoEstiloTextoRef.current = true;

    const editor = document.querySelector(
      `[data-texto-livre-id="${campoSelecionadoId}"]`,
    ) as HTMLElement | null;

    if (!editor) {
      aplicandoEstiloTextoRef.current = false;
      return;
    }
    salvarHistoricoTextoLivre(editor);
    const selecao = window.getSelection();

    let range: Range | null = null;

    if (
      selecao &&
      selecao.rangeCount > 0 &&
      !selecao.getRangeAt(0).collapsed &&
      editor.contains(selecao.getRangeAt(0).commonAncestorContainer)
    ) {
      range = selecao.getRangeAt(0).cloneRange();
    } else if (
      selecaoTextoRef.current &&
      !selecaoTextoRef.current.collapsed &&
      editor.contains(selecaoTextoRef.current.commonAncestorContainer)
    ) {
      range = selecaoTextoRef.current.cloneRange();
    }

    if (!range || !range.toString()) {
      aplicandoEstiloTextoRef.current = false;
      return;
    }

    salvarHistoricoTextoLivre(editor);

    const fragmento = range.extractContents();
    const span = document.createElement("span");

    Object.assign(span.style, estilo);

    if (estilo.color) {
      const cor = String(estilo.color).toLowerCase();

      span.style.setProperty("color", cor, "important");
      span.style.setProperty("-webkit-text-fill-color", cor, "important");
      span.style.setProperty("opacity", "1", "important");
      span.style.setProperty("filter", "none", "important");
      span.style.setProperty("mix-blend-mode", "normal", "important");

      fragmento.querySelectorAll?.("span").forEach((el) => {
        (el as HTMLElement).style.removeProperty("color");
        (el as HTMLElement).style.removeProperty("-webkit-text-fill-color");
      });

      setCorTextoSelecionado(cor);
    }

    span.appendChild(fragmento);
    range.insertNode(span);

    const novoRange = document.createRange();
    novoRange.selectNodeContents(span);

    selecao?.removeAllRanges();
    selecao?.addRange(novoRange);

    selecaoTextoRef.current = novoRange.cloneRange();

    setTimeout(() => {
      aplicandoEstiloTextoRef.current = false;
    }, 250);
  }

  function temSelecaoTextoLivreAtiva() {
    return (
      campoSelecionado?.tipo === "TEXTO_LIVRE" &&
      selecaoTextoRef.current &&
      !selecaoTextoRef.current.collapsed
    );
  }

  function aplicarEstiloTextoOuCampoInteiro(
    chave: keyof CampoCertificado,
    valor: any,
    estilo: React.CSSProperties,
  ) {
    if (temSelecaoTextoLivreAtiva()) {
      aplicarEstiloTextoSelecionado(estilo);
      return;
    }

    atualizarCampoLocal(chave as any, valor);
  }

  function nomeDaCamada(campo: CampoCertificado, index: number) {
    if (campo.nomeCamada?.trim()) return campo.nomeCamada;

    if (campo.tipo === "TEXTO_LIVRE") {
      return tr("layers.textNumbered", { number: index + 1 });
    }

    if (campo.tipo === "IMAGEM") {
      return tr("layers.imageNumbered", { number: index + 1 });
    }

    if (campo.tipo === "FORMA") {
      return campo.forma
        ? traduzirFormaCertificado(campo.forma)
        : tr("layers.shapeNumbered", { number: index + 1 });
    }

    return campo.tipo
      ? traduzirTipoCampoCertificado(campo.tipo)
      : tr("layers.elementNumbered", { number: index + 1 });
  }

  function camadasOrdenadas() {
    return campos.slice().sort((a, b) => (b.ordem || 0) - (a.ordem || 0));
  }

  function moverCamadaPara(campoId: number, destino: "cima" | "baixo") {
    const lista = camadasOrdenadas();
    const index = lista.findIndex((campo) => campo.id === campoId);

    if (index < 0) return;

    const item = lista[index];
    lista.splice(index, 1);

    if (destino === "cima") {
      lista.unshift(item);
    } else {
      lista.push(item);
    }

    setCampos((prev) =>
      prev.map((campo) => {
        const novoIndex = lista.findIndex((item) => item.id === campo.id);
        if (novoIndex < 0) return campo;

        return {
          ...campo,
          ordem: lista.length - novoIndex,
        };
      }),
    );
  }

  function reordenarCamada(arrastadoId: number, alvoId: number) {
    if (arrastadoId === alvoId) return;

    const lista = camadasOrdenadas();
    const origem = lista.findIndex((campo) => campo.id === arrastadoId);
    const destino = lista.findIndex((campo) => campo.id === alvoId);

    if (origem < 0 || destino < 0) return;

    const [item] = lista.splice(origem, 1);
    lista.splice(destino, 0, item);

    setCampos((prev) =>
      prev.map((campo) => {
        const novoIndex = lista.findIndex((item) => item.id === campo.id);
        if (novoIndex < 0) return campo;

        return {
          ...campo,
          ordem: lista.length - novoIndex,
        };
      }),
    );
  }

  function iniciarDrag(
    event: MouseEvent<HTMLDivElement>,
    campo: CampoCertificado,
  ) {
    if (campo.bloqueado) {
      setCampoSelecionadoId(campo.id);
      setCamposSelecionadosIds([campo.id]);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();

    const idsDoGrupo = campo.grupoId
      ? campos
        .filter((item) => item.grupoId === campo.grupoId)
        .map((item) => item.id)
      : camposSelecionadosIds.length > 1 &&
        camposSelecionadosIds.includes(campo.id)
        ? camposSelecionadosIds
        : [campo.id];

    registrarHistoricoAntesDaAcao();

    dragRef.current = {
      campoId: campo.id,
      offsetX: (event.clientX - rect.left) / escala,
      offsetY: (event.clientY - rect.top) / escala,
      grupoId:
        campo.grupoId || (idsDoGrupo.length > 1 ? "selecao-temporaria" : null),
      inicioX: campo.x,
      inicioY: campo.y,
      posicoesIniciais: campos
        .filter((item) => idsDoGrupo.includes(item.id))
        .map((item) => ({ id: item.id, x: item.x, y: item.y })),
    };

    setCampoSelecionadoId(campo.id);
    setCamposSelecionadosIds(idsDoGrupo);
  }

  function iniciarCrop(
    e: React.MouseEvent,
    campo: CampoCertificado,
    direcao: "top" | "bottom" | "left" | "right",
  ) {
    e.stopPropagation();
    e.preventDefault();

    registrarHistoricoAntesDaAcao();

    const startX = e.clientX;
    const startY = e.clientY;

    const xInicial = campo.x;
    const yInicial = campo.y;
    const larguraInicial = campo.largura || 150;
    const alturaInicial = campo.altura || 150;

    const cropInicial = campo.crop || {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };

    const cropBaseW =
      (campo as any).cropBaseW ||
      larguraInicial + cropInicial.left + cropInicial.right;

    const cropBaseH =
      (campo as any).cropBaseH ||
      alturaInicial + cropInicial.top + cropInicial.bottom;

    const move = (ev: globalThis.MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      setCampos((prev) =>
        prev.map((item) => {
          if (item.id !== campo.id) return item;

          const novoCrop = { ...cropInicial };
          let novoX = xInicial;
          let novoY = yInicial;
          let novaLargura = larguraInicial;
          let novaAltura = alturaInicial;

          if (direcao === "left") {
            const delta = Math.max(
              -cropInicial.left,
              Math.min(ev.clientX - startX, larguraInicial - 40),
            );

            novoCrop.left = cropInicial.left + delta;
            novoX = xInicial + delta;
            novaLargura = larguraInicial - delta;
          }

          if (direcao === "right") {
            const delta = Math.max(
              -cropInicial.right,
              Math.min(startX - ev.clientX, larguraInicial - 40),
            );

            novoCrop.right = cropInicial.right + delta;
            novoX = xInicial;
            novaLargura = larguraInicial - delta;
          }

          if (direcao === "top") {
            const delta = Math.max(
              -cropInicial.top,
              Math.min(dy, alturaInicial - 40),
            );
            novoCrop.top = cropInicial.top + delta;
            novoY = yInicial + delta;
            novaAltura = alturaInicial - delta;
          }

          if (direcao === "bottom") {
            const delta = Math.max(
              -cropInicial.bottom,
              Math.min(-dy, alturaInicial - 40),
            );
            novoCrop.bottom = cropInicial.bottom + delta;
            novaAltura = alturaInicial - delta;
          }

          return {
            ...item,
            x: Math.round(novoX),
            y: Math.round(novoY),
            largura: Math.max(40, Math.round(novaLargura)),
            altura: Math.max(40, Math.round(novaAltura)),
            crop: novoCrop,
            cropBaseW,
            cropBaseH,
          };
        }),
      );
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function iniciarCropPro(e: React.MouseEvent, campo: CampoCertificado) {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;

    const cropInicial = campo.crop || {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };

    const larguraInicial = campo.largura || 150;
    const alturaInicial = campo.altura || 150;

    const move = (ev: globalThis.MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      setCampos((prev) =>
        prev.map((item) => {
          if (item.id !== campo.id) return item;

          const fator = Math.max(dx, dy);

          const novoCrop = {
            top: Math.max(0, cropInicial.top + fator),
            bottom: Math.max(0, cropInicial.bottom + fator),
            left: Math.max(0, cropInicial.left + fator),
            right: Math.max(0, cropInicial.right + fator),
          };

          return {
            ...item,
            crop: novoCrop,
          };
        }),
      );
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function iniciarCropTodos(e: React.MouseEvent, campo: CampoCertificado) {
    e.stopPropagation();
    e.preventDefault();

    registrarHistoricoAntesDaAcao();

    const startX = e.clientX;
    const startY = e.clientY;

    const xInicial = campo.x;
    const yInicial = campo.y;
    const larguraInicial = campo.largura || 150;
    const alturaInicial = campo.altura || 150;

    const cropInicial = campo.crop || { top: 0, left: 0, right: 0, bottom: 0 };

    const move = (ev: globalThis.MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      const bruto = Math.max(dx, dy);

      const maxParaDentro = Math.min(
        (larguraInicial - 40) / 2,
        (alturaInicial - 40) / 2,
      );

      const maxParaFora = -Math.min(
        cropInicial.top,
        cropInicial.bottom,
        cropInicial.left,
        cropInicial.right,
      );

      const delta = Math.max(maxParaFora, Math.min(bruto, maxParaDentro));

      setCampos((prev) =>
        prev.map((item) =>
          item.id === campo.id
            ? {
              ...item,
              x: Math.round(xInicial + delta),
              y: Math.round(yInicial + delta),
              largura: Math.max(40, Math.round(larguraInicial - delta * 2)),
              altura: Math.max(40, Math.round(alturaInicial - delta * 2)),
              crop: {
                top: Math.max(0, cropInicial.top + delta),
                bottom: Math.max(0, cropInicial.bottom + delta),
                left: Math.max(0, cropInicial.left + delta),
                right: Math.max(0, cropInicial.right + delta),
              },
            }
            : item,
        ),
      );
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function iniciarRotacao(e: React.MouseEvent, campo: CampoCertificado) {
    e.stopPropagation();
    e.preventDefault();

    registrarHistoricoAntesDaAcao();

    const elemento = e.currentTarget.parentElement as HTMLElement;
    if (!elemento) return;

    const rect = elemento.getBoundingClientRect();
    const centroX = rect.left + rect.width / 2;
    const centroY = rect.top + rect.height / 2;

    const mover = (ev: globalThis.MouseEvent) => {
      const angulo =
        Math.atan2(ev.clientY - centroY, ev.clientX - centroX) *
        (180 / Math.PI);

      setCampos((prev) =>
        prev.map((item) =>
          item.id === campo.id
            ? {
              ...item,
              rotate: Math.round(angulo + 90),
            }
            : item,
        ),
      );
    };

    const soltar = () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
    };

    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
  }

  function onMouseMoveCanvas(event: MouseEvent<HTMLDivElement>) {
    if (!dragRef.current || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const campo = campos.find((c) => c.id === dragRef.current?.campoId);
    if (!campo) return;

    const largura = campo.largura || 220;
    const altura = campo.altura || 40;

    let novoX =
      (event.clientX - canvasRect.left) / escala - dragRef.current.offsetX;
    let novoY =
      (event.clientY - canvasRect.top) / escala - dragRef.current.offsetY;

    novoX = Math.round(novoX);
    novoY = Math.round(novoY);

    if (event.shiftKey) {
      const deltaX = novoX - dragRef.current.inicioX;
      const deltaY = novoY - dragRef.current.inicioY;

      if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        // trava na horizontal
        novoY = dragRef.current.inicioY;
      } else {
        // trava na vertical
        novoX = dragRef.current.inicioX;
      }
    }

    if (dragRef.current.grupoId) {
      const deltaX = Math.round(novoX - dragRef.current.inicioX);
      const deltaY = Math.round(novoY - dragRef.current.inicioY);

      setCampos((prev) =>
        prev.map((item) => {
          const posInicial = dragRef.current?.posicoesIniciais.find(
            (pos) => pos.id === item.id,
          );

          if (!posInicial) return item;

          return {
            ...item,
            x: posInicial.x + deltaX,
            y: posInicial.y + deltaY,
          };
        }),
      );

      return;
    }

    setCampos((prev) =>
      prev.map((item) =>
        item.id === dragRef.current?.campoId
          ? { ...item, x: Math.round(novoX), y: Math.round(novoY) }
          : item,
      ),
    );
  }

  function finalizarDrag() {
    if (!dragRef.current) return;

    const campo = campos.find((c) => c.id === dragRef.current?.campoId);

    if (campo && campo.tipo !== "IMAGEM" && campo.tipo !== "FORMA") {
      void atualizarCampo(campo.id, {
        x: campo.x,
        y: campo.y,
        largura: campo.largura,
        altura: campo.altura,
        fonte: campo.fonte || "Arial",
        tamanho: campo.tamanho || 18,
        cor: campo.cor || "#1e3a8a",
        alinhamento: campo.alinhamento || "left",
        ordem: campo.ordem || 1,
        negrito: campo.negrito || false,
        italico: campo.italico || false,
        sublinhado: campo.sublinhado || false,
        lineHeight: campo.lineHeight || 1.2,
        marcador: campo.marcador || null,
        texto: campo.texto,
        textoHtml: campo.textoHtml,
      });
    }

    dragRef.current = null;
  }

  async function salvarCampoSelecionado() {
    if (!campoSelecionado) return;

    if (
      campoSelecionado.tipo === "IMAGEM" ||
      campoSelecionado.tipo === "FORMA"
    ) {
      setMensagemSucesso(
        campoSelecionado.tipo === "IMAGEM"
          ? tr("messages.imageAdjusted")
          : tr("messages.shapeAdjusted"),
      );
      setTimeout(() => setMensagemSucesso(""), 2500);
      return;
    }

    if (campoSelecionado.tipo === "IMAGEM") {
      setMensagemSucesso(tr("messages.imageAdjusted"));
      setTimeout(() => setMensagemSucesso(""), 2500);
      return;
    }

    await atualizarCampo(campoSelecionado.id, {
      x: campoSelecionado.x,
      y: campoSelecionado.y,
      largura: campoSelecionado.largura || 220,
      altura: campoSelecionado.altura || 40,
      fonte: campoSelecionado?.fonte || "Helvetica",
      tamanho: campoSelecionado?.tamanho || 18,
      cor: campoSelecionado?.cor || "#1e3a8a",
      alinhamento: campoSelecionado?.alinhamento || "left",
      ordem: campoSelecionado.ordem || 1,
      negrito: campoSelecionado.negrito || false,
      italico: campoSelecionado.italico || false,
      sublinhado: campoSelecionado.sublinhado || false,
      lineHeight: campoSelecionado.lineHeight || 1.3,
      marcador: campoSelecionado.marcador || null,
    });
    setMensagemSucesso(tr("messages.fieldSaved"));
    setTimeout(() => setMensagemSucesso(""), 2500);
  }

  function baixarArquivo() {
    if (formatoDownload === "png") {
      setMensagemErro(
        tr("errors.downloadPngDev"),
      );
      return;
    }

    if (formatoDownload === "jpg") {
      setMensagemErro(
        tr("errors.downloadJpgDev"),
      );
      return;
    }

    if (formatoDownload === "pdf") {
      setMensagemErro(
        tr("errors.downloadPdfDev"),
      );
      return;
    }

    if (formatoDownload === "pdf-impressao") {
      setMensagemErro(
        tr("errors.downloadPrintPdfDev"),
      );
      return;
    }
  }

  async function salvarRascunhoCompleto(opcoes?: {
    silencioso?: boolean;
  }): Promise<boolean> {
    try {
      setSalvando(true);
      setMensagemErro("");

      const modeloId = modeloAtivoIdRef.current;
      const versaoRascunhoId = versaoRascunhoIdRef.current;

      if (!modeloId || !versaoRascunhoId) {
        throw new Error(
          tr("errors.noDraftModelSelected"),
        );
      }

      /*
       * Salva as configurações visuais somente na versão RASCUNHO.
       */
      const resConfig = await fetch(
        `/api/admin/certificado-modelos/${modeloId}/rascunho`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateUrl: certificadoTemplateUrl || null,
            previewUrl: certificadoPreviewUrl || null,
            assinaturaUrl: certificadoAssinaturaUrl || null,
            coordenadorNome: certificadoCoordenadorNome || null,
            cidade: certificadoCidade || null,

            modoFundo,
            corFundoPagina,
            tamanhoPapel,
            orientacao,

            larguraBase: baseCanvas.largura,
            alturaBase: baseCanvas.altura,
          }),
        },
      );

      const dataConfig = await resConfig.json();

      if (!resConfig.ok) {
        throw new Error(
          dataConfig?.detalhe ||
          dataConfig?.error ||
          tr("errors.saveDraftConfig"),
        );
      }

      const camposParaSalvar = campos.filter((campo: any) => {
        if (!campo) return false;
        if (campo.id === -999999) return false;
        if (campo.arrayPreview === true) return false;
        if (campo.idOriginalArray) return false;
        if (!String(campo.tipo || "").trim()) return false;

        return true;
      });

      const payloadCampos = camposParaSalvar.map((campo: any) => {
        const campoLimpo: any = {
          ...campo,
        };

        /*
         * Remove dados de controle ou pertencentes ao registro antigo.
         * A API criará novos IDs exclusivamente dentro do RASCUNHO.
         */
        delete campoLimpo.id;
        delete campoLimpo.bancoId;
        delete campoLimpo.tempId;
        delete campoLimpo.arrayPreview;
        delete campoLimpo.idOriginalArray;

        delete campoLimpo.instituicaoId;
        delete campoLimpo.certificadoModeloVersaoId;
        delete campoLimpo.createdAt;
        delete campoLimpo.updatedAt;

        return campoLimpo;
      });

      /*
       * Salva somente os campos da versão RASCUNHO selecionada.
       * A API não tocará no legado nem na versão PUBLICADO.
       */
      const resCampos = await fetch(
        `/api/admin/certificado-campos?versaoId=${versaoRascunhoId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            removerAusentes: true,
            campos: payloadCampos,
          }),
        },
      );

      const dataCampos = await resCampos.json();

      if (!resCampos.ok) {
        throw new Error(
          dataCampos?.detalhe ||
          dataCampos?.error ||
          tr("errors.saveDraftFields"),
        );
      }

      if (Array.isArray(dataCampos?.campos)) {
        const camposSalvos = dataCampos.campos.map((campo: any) => {
          const dados = campo?.dadosJson || {};

          return {
            ...campo,
            ...dados,

            id: campo.id,
            bancoId: campo.id,
          };
        });

        setCampos(camposSalvos);
        setCampoSelecionadoId(null);
        setCamposSelecionadosIds([]);
        setPontoFormaSelecionado(null);
        setHistorico([]);
        setFuturo([]);
      }

      if (!opcoes?.silencioso) {
        setMensagemSucesso(
          tr("messages.draftSaved"),
        );

        setTimeout(() => {
          setMensagemSucesso("");
        }, 4000);
      }

      return true;
    } catch (error: any) {
      console.error("ERRO AO SALVAR RASCUNHO DO CERTIFICADO:", error);

      setMensagemErro(
        error?.message || tr("errors.saveDraft"),
      );
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function publicarModeloFinal() {
    try {
      setPublicando(true);
      setMensagemErro("");

      const modeloId = modeloAtivoIdRef.current;

      if (!modeloId) {
        throw new Error(tr("errors.noModelSelected"));
      }

      /*
       * Fecha a confirmação imediatamente.
       * O resultado da publicação será exibido pelo Toast PHANYX.
       */
      setModalPublicacaoAberto(false);
      setMensagemSucesso("");

      /*
       * Antes de publicar, salva tudo o que está atualmente
       * aberto no editor dentro do RASCUNHO.
       */
      const rascunhoSalvo = await salvarRascunhoCompleto({
        silencioso: true,
      });

      if (!rascunhoSalvo) {
        return;
      }

      const resposta = await fetch(
        `/api/admin/certificado-modelos/${modeloId}/publicar`,
        {
          method: "POST",
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.detalhe || dados?.error || tr("errors.publishFinal"),
        );
      }

      const totalCampos = Number(dados?.publicacao?.totalCampos || 0);

      setMensagemSucesso(
        totalCampos > 0
          ? tr("messages.finalPublishedWithCount", { count: totalCampos })
          : tr("messages.finalPublished"),
      );

      setTimeout(() => {
        setMensagemSucesso("");
      }, 5000);
    } catch (error: any) {
      console.error("ERRO AO PUBLICAR MODELO FINAL:", error);

      setMensagemErro(error?.message || tr("errors.publishFinal"));
    } finally {
      setPublicando(false);
    }
  }

  function camposComArrayVirtual() {
    const resultado: any[] = [];

    campos.forEach((campo: any) => {
      resultado.push(campo);

      if (campo.tipo !== "FORMA" || !campo.arrayConfig?.ativo) return;

      const config = campo.arrayConfig;
      const quantidade = Number(config.quantidade || 1);
      const anguloRad = (Number(config.angulo || 0) * Math.PI) / 180;
      const escala = Number(config.escala || 100) / 100;
      const opacidade = Number(config.opacidade || 100) / 100;

      for (let index = 0; index < quantidade; index++) {
        const passo = index + 1;

        const baseX = Number(config.distanciaX || 0) * passo;
        const baseY = Number(config.distanciaY || 0) * passo;

        const deslocamentoX =
          baseX * Math.cos(anguloRad) - baseY * Math.sin(anguloRad);

        const deslocamentoY =
          baseX * Math.sin(anguloRad) + baseY * Math.cos(anguloRad);

        resultado.push({
          ...campo,
          id: Number(`${campo.id}${passo}`),
          idOriginalArray: campo.id,
          arrayPreview: true,
          x: Number(campo.x || 0) + deslocamentoX,
          y: Number(campo.y || 0) + deslocamentoY,
          largura: Number(campo.largura || 100) * Math.pow(escala, passo),
          altura: Number(campo.altura || 100) * Math.pow(escala, passo),
          rotate:
            Number(campo.rotate || 0) +
            Number(config.rotacaoPorCopia || 0) * passo,
          opacity: Math.max(
            0.05,
            Number(campo.opacity || 1) * Math.pow(opacidade, passo),
          ),
        });
      }
    });

    return resultado;
  }

  if (carregando) {
    return (
      <div className="p-6 text-sm text-slate-500">
        {t("loading")}
      </div>
    );
  }

  function alternarContornoTextoCampoSelecionado() {
    const ids = idsAlvoDaAcao();

    if (ids.length === 0) return;

    setCampos((prev) =>
      prev.map((campo) =>
        ids.includes(campo.id)
          ? {
            ...campo,
            contornoTextoAtivo: !campo.contornoTextoAtivo,
            contornoTextoCor:
              campo.contornoTextoCor || corContornoTexto || "#000000",
            contornoTextoEspessura:
              campo.contornoTextoEspessura ?? espessuraContornoTexto ?? 1,
            contornoTextoTipo:
              campo.contornoTextoTipo || tipoContornoTexto || "externo",
          }
          : campo,
      ),
    );
  }

  function atualizarContornoTextoCampoSelecionado(
    patch: Partial<CampoCertificado>,
  ) {
    const ids = idsAlvoDaAcao();

    if (ids.length === 0) return;

    setCampos((prev) =>
      prev.map((campo) =>
        ids.includes(campo.id)
          ? {
            ...campo,
            ...patch,
            contornoTextoAtivo: true,
          }
          : campo,
      ),
    );
  }

  const camposPreviewCertificado = [
    ...camposComArrayVirtual(),
    ...copiasPreviewArray,
  ].sort((a: any, b: any) => Number(a.ordem || 0) - Number(b.ordem || 0));

  const dadosPreviewCertificado = {
    nomeAluno: tr("preview.studentName"),
    numeroMatricula: tr("preview.registrationNumber"),
    cpfAluno: "000.000.000-00",
    rgAluno: "00.000.000-0",

    nomeCurso: tr("preview.courseName"),
    disciplinasConcluidas: [
      tr("preview.disciplineNumber", { number: 1 }),
      tr("preview.disciplineNumber", { number: 2 }),
      tr("preview.disciplineNumber", { number: 3 }),
      tr("preview.disciplineNumber", { number: 4 }),
      tr("preview.disciplineNumber", { number: 5 }),
      tr("preview.disciplineNumber", { number: 6 }),
    ],
    cargaHoraria: tr("preview.workload"),
    anoConclusao: "2026",
    dataConclusao: new Intl.DateTimeFormat(locale).format(new Date(2026, 3, 30)),
    aproveitamento: "100%",
    frequenciaTotal: "100%",
    modalidade: "EAD",
    turma: tr("preview.classA"),
    polo: tr("preview.mainCampus"),

    nomeInstituicao: tr("preview.institutionName"),
    cnpjInstituicao: "00.000.000/0001-00",
    cidade: certificadoCidade || tr("preview.city"),
    dataEmissao: new Intl.DateTimeFormat(locale).format(new Date(2026, 3, 30)),
    nomeDiretor:
      nomeDiretorInstituicao ||
      certificadoCoordenadorNome ||
      tr("preview.academicDirector"),
    assinaturaUrl: certificadoAssinaturaUrl || null,
    logoUrl: null,

    numeroCertificado: "CERT-2026-0001",
    codigoValidacao: "ABC123XYZ",
    qrCodeUrl: null,
  };

  function iniciarArrasteBarraSelecao(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    const inicioMouseX = e.clientX;
    const inicioMouseY = e.clientY;

    const inicioBarraX = barraSelecaoPosicao.x;
    const inicioBarraY = barraSelecaoPosicao.y;

    const mover = (ev: globalThis.MouseEvent) => {
      const novoX = inicioBarraX + ev.clientX - inicioMouseX;
      const novoY = inicioBarraY + ev.clientY - inicioMouseY;

      setBarraSelecaoPosicao({
        x: Math.max(8, Math.min(window.innerWidth - 120, novoX)),
        y: Math.max(8, Math.min(window.innerHeight - 80, novoY)),
      });
    };

    const soltar = () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
    };

    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
  }

  function iniciarArrasteMenuContexto(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (!menuContexto) return;

    const inicioMouseX = e.clientX;
    const inicioMouseY = e.clientY;

    const inicioMenuX = Number(menuContexto.x || 80);
    const inicioMenuY = Number(menuContexto.y || 80);

    const mover = (ev: globalThis.MouseEvent) => {
      const larguraPainel = 460;
      const alturaPainel = 520;
      const margem = 8;

      const novoX = inicioMenuX + ev.clientX - inicioMouseX;
      const novoY = inicioMenuY + ev.clientY - inicioMouseY;

      setMenuContexto((prev: any) => {
        if (!prev) return prev;

        return {
          ...prev,
          x: Math.max(
            margem,
            Math.min(window.innerWidth - larguraPainel - margem, novoX),
          ),
          y: Math.max(margem, Math.min(window.innerHeight - 80, novoY)),
        };
      });
    };

    const soltar = () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
    };

    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
  }

  return (
    <div
      data-cert-theme={modoVisual}
      data-cert-dark={temaEscuro ? "true" : "false"}
      data-cert-blue={temaAzul ? "true" : "false"}
      className="phanyx-config-certificado-page mx-auto max-w-[1600px] p-6"
    >

      {mensagemErro && (
        <div className="mb-4">
          <PhanyxToast
            tipo="erro"
            titulo={t("toast.errorTitle")}
            mensagem={mensagemErro}
            onClose={() => setMensagemErro("")}
          />
        </div>
      )}

      <style jsx global>{`
        [data-texto-livre-id]::selection,
        [data-texto-livre-id] *::selection {
          background: rgba(37, 99, 235, 0.35);
          color: inherit;
        }

        .phanyx-config-certificado-page[data-cert-theme="dark"] {
          color: #f8fafc;
        }

        .phanyx-config-certificado-page[data-cert-theme="dark"] > div:not([data-cert-canvas]),
        .phanyx-config-certificado-page[data-cert-theme="dark"] > section,
        .phanyx-config-certificado-page[data-cert-theme="dark"] .phanyx-cert-modelos-lista,
        .phanyx-config-certificado-page[data-cert-theme="dark"] .phanyx-cert-modelo-menu,
        .phanyx-config-certificado-page[data-cert-theme="dark"] .phanyx-cert-modelo-seletor {
          border-color: #23466f !important;
        }

        .phanyx-config-certificado-page[data-cert-theme="dark"] > div.rounded-3xl.bg-white,
        .phanyx-config-certificado-page[data-cert-theme="dark"] > section.bg-white {
          background: #0b1f3a !important;
        }

        .phanyx-config-certificado-page[data-cert-theme="dark"] > div.rounded-3xl.bg-white .bg-slate-50:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="dark"] > section.bg-white > div.grid > aside,
        .phanyx-config-certificado-page[data-cert-theme="dark"] > section.bg-white > div.grid > main {
          background-color: #102a4c !important;
        }

        .phanyx-config-certificado-page[data-cert-theme="dark"] > div.rounded-3xl.bg-white .bg-white:not([data-cert-canvas]):not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="dark"] > section.bg-white .bg-white:not([data-cert-canvas]):not([data-cert-canvas] *) {
          background-color: #0f2746 !important;
        }

        .phanyx-config-certificado-page[data-cert-theme="dark"] > div.rounded-3xl.bg-white .text-slate-900:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="dark"] > div.rounded-3xl.bg-white .text-slate-800:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="dark"] > div.rounded-3xl.bg-white .text-slate-700:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="dark"] > section.bg-white .text-slate-900:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="dark"] > section.bg-white .text-slate-800:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="dark"] > section.bg-white .text-slate-700:not([data-cert-canvas] *) {
          color: #f8fafc !important;
        }

        .phanyx-config-certificado-page[data-cert-theme="dark"] > div.rounded-3xl.bg-white .text-slate-600:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="dark"] > div.rounded-3xl.bg-white .text-slate-500:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="dark"] > section.bg-white .text-slate-600:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="dark"] > section.bg-white .text-slate-500:not([data-cert-canvas] *) {
          color: #bfd2e8 !important;
        }

        .phanyx-config-certificado-page[data-cert-theme="system-dark"] {
          color: #fafafa;
        }

        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > div:not([data-cert-canvas]),
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > section,
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] .phanyx-cert-modelos-lista,
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] .phanyx-cert-modelo-menu,
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] .phanyx-cert-modelo-seletor {
          border-color: #3f3f46 !important;
        }

        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > div.rounded-3xl.bg-white,
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > section.bg-white {
          background: #18181b !important;
        }

        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > div.rounded-3xl.bg-white .bg-slate-50:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > section.bg-white > div.grid > aside,
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > section.bg-white > div.grid > main {
          background-color: #27272a !important;
        }

        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > div.rounded-3xl.bg-white .bg-white:not([data-cert-canvas]):not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > section.bg-white .bg-white:not([data-cert-canvas]):not([data-cert-canvas] *) {
          background-color: #202024 !important;
        }

        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > div.rounded-3xl.bg-white .text-slate-900:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > div.rounded-3xl.bg-white .text-slate-800:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > div.rounded-3xl.bg-white .text-slate-700:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > section.bg-white .text-slate-900:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > section.bg-white .text-slate-800:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > section.bg-white .text-slate-700:not([data-cert-canvas] *) {
          color: #fafafa !important;
        }

        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > div.rounded-3xl.bg-white .text-slate-600:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > div.rounded-3xl.bg-white .text-slate-500:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > section.bg-white .text-slate-600:not([data-cert-canvas] *),
        .phanyx-config-certificado-page[data-cert-theme="system-dark"] > section.bg-white .text-slate-500:not([data-cert-canvas] *) {
          color: #a1a1aa !important;
        }

        .phanyx-config-certificado-page[data-cert-theme="dark"]
  .phanyx-cert-upload-title {
  color: #60a5fa !important;
  font-weight: 900 !important;
}

.phanyx-config-certificado-page[data-cert-theme="system-dark"]
  .phanyx-cert-upload-title {
  color: #93c5fd !important;
  font-weight: 900 !important;
}
      `}</style>

      <style jsx global>{`
  [data-texto-livre-id]::selection,
  [data-texto-livre-id] *::selection {
    background: rgba(37, 99, 235, 0.35);
    color: inherit;
  }

  .phanyx-cert-sidebar-title {
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
}

.phanyx-config-certificado-page[data-cert-theme="dark"] .phanyx-cert-sidebar-title {
  color: #60a5fa !important;
}

.phanyx-config-certificado-page[data-cert-theme="system-dark"] .phanyx-cert-sidebar-title {
  color: #93c5fd !important;
}

  /* =========================================================
     EDITOR DE CERTIFICADOS — TEMA EXPLÍCITO ESCURO PHANYX
     ========================================================= */

  .phanyx-config-certificado-page[data-cert-theme="dark"] {
    --cert-page: #061a3a;
    --cert-surface-1: #0b2a57;
    --cert-surface-2: #12386d;
    --cert-surface-3: #0f315f;
    --cert-input: #0c2850;
    --cert-border: #2d5aa0;
    --cert-border-soft: #214878;
    --cert-text: #ffffff;
    --cert-text-secondary: #dbeafe;
    --cert-text-muted: #a9c5e8;
    --cert-hover: #184785;

    background: var(--cert-page);
    color: var(--cert-text);
  }

  /* =========================================================
     EDITOR DE CERTIFICADOS — SISTEMA ESCURO NEUTRO
     ========================================================= */

  .phanyx-config-certificado-page[data-cert-theme="system-dark"] {
    --cert-page: #09090b;
    --cert-surface-1: #141416;
    --cert-surface-2: #1c1c1f;
    --cert-surface-3: #232328;
    --cert-input: #18181b;
    --cert-border: #3f3f46;
    --cert-border-soft: #303036;
    --cert-text: #fafafa;
    --cert-text-secondary: #d4d4d8;
    --cert-text-muted: #a1a1aa;
    --cert-hover: #29292f;

    background: var(--cert-page);
    color: var(--cert-text);
  }

  /* =========================================================
     SUPERFÍCIES
     Limitamos a div/section/aside para não alterar
     o papel real do certificado nem botões de destaque.
     ========================================================= */

  .phanyx-config-certificado-page[data-cert-theme="dark"]
    :is(div, section, aside).bg-white,
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    :is(div, section, aside).bg-white {
    background-color: var(--cert-surface-1) !important;
  }

  .phanyx-config-certificado-page[data-cert-theme="dark"]
    :is(div, section, aside).bg-slate-50,
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    :is(div, section, aside).bg-slate-50 {
    background-color: var(--cert-surface-2) !important;
  }

  .phanyx-config-certificado-page[data-cert-theme="dark"]
    :is(div, section, aside).bg-slate-100,
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    :is(div, section, aside).bg-slate-100 {
    background-color: var(--cert-surface-3) !important;
  }

  .phanyx-config-certificado-page[data-cert-theme="dark"]
    :is(div, section, aside).bg-slate-900,
  .phanyx-config-certificado-page[data-cert-theme="dark"]
    :is(div, section, aside).bg-slate-950 {
    background-color: var(--cert-surface-1) !important;
  }

  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    :is(div, section, aside).bg-slate-900,
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    :is(div, section, aside).bg-slate-950 {
    background-color: var(--cert-surface-1) !important;
  }

  /* =========================================================
     BORDAS
     ========================================================= */

  .phanyx-config-certificado-page[data-cert-theme="dark"]
    :is(.border-slate-200, .border-slate-300, .border-slate-600, .border-slate-700),
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    :is(.border-slate-200, .border-slate-300, .border-slate-600, .border-slate-700) {
    border-color: var(--cert-border) !important;
  }

  /* =========================================================
     TEXTO SOBRE AS SUPERFÍCIES
     ========================================================= */

  .phanyx-config-certificado-page[data-cert-theme="dark"]
    :is(.text-slate-900, .text-slate-800, .text-slate-700),
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    :is(.text-slate-900, .text-slate-800, .text-slate-700) {
    color: var(--cert-text) !important;
  }

  .phanyx-config-certificado-page[data-cert-theme="dark"]
    :is(.text-slate-600, .text-slate-500),
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    :is(.text-slate-600, .text-slate-500) {
    color: var(--cert-text-secondary) !important;
  }

  .phanyx-config-certificado-page[data-cert-theme="dark"] .text-slate-400,
  .phanyx-config-certificado-page[data-cert-theme="system-dark"] .text-slate-400 {
    color: var(--cert-text-muted) !important;
  }

  /* =========================================================
     INPUTS / SELECTS / TEXTAREAS
     ========================================================= */

  .phanyx-config-certificado-page[data-cert-theme="dark"]
    input:not([type="range"]):not([type="color"]):not([type="checkbox"]),
  .phanyx-config-certificado-page[data-cert-theme="dark"] select,
  .phanyx-config-certificado-page[data-cert-theme="dark"] textarea,
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    input:not([type="range"]):not([type="color"]):not([type="checkbox"]),
  .phanyx-config-certificado-page[data-cert-theme="system-dark"] select,
  .phanyx-config-certificado-page[data-cert-theme="system-dark"] textarea {
    background-color: var(--cert-input) !important;
    border-color: var(--cert-border) !important;
    color: var(--cert-text) !important;
  }

  .phanyx-config-certificado-page[data-cert-theme="dark"]
    input::placeholder,
  .phanyx-config-certificado-page[data-cert-theme="dark"]
    textarea::placeholder,
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    input::placeholder,
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    textarea::placeholder {
    color: var(--cert-text-muted) !important;
  }

  /* INPUT DE ARQUIVO */

  .phanyx-config-certificado-page[data-cert-theme="dark"]
    input[type="file"],
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    input[type="file"] {
    background-color: var(--cert-input) !important;
    color: var(--cert-text-secondary) !important;
  }

  .phanyx-config-certificado-page[data-cert-theme="dark"]
    input[type="file"]::file-selector-button,
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    input[type="file"]::file-selector-button {
    border: 0;
    border-radius: 8px;
    background: var(--cert-surface-3);
    color: var(--cert-text);
    padding: 7px 10px;
    margin-right: 12px;
  }

  /* =========================================================
     COMPONENTES ESPECÍFICOS DO EDITOR
     ========================================================= */

  .phanyx-config-certificado-page[data-cert-theme="dark"]
    .phanyx-cert-modelos-lista,
  .phanyx-config-certificado-page[data-cert-theme="dark"]
    .phanyx-cert-modelo-menu,
  .phanyx-config-certificado-page[data-cert-theme="dark"]
    .phanyx-certificado-outliner {
    background: var(--cert-surface-2) !important;
    border-color: var(--cert-border) !important;
  }

  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    .phanyx-cert-modelos-lista,
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    .phanyx-cert-modelo-menu,
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    .phanyx-certificado-outliner {
    background: var(--cert-surface-2) !important;
    border-color: var(--cert-border) !important;
  }

  .phanyx-config-certificado-page[data-cert-theme="dark"]
    .phanyx-cert-modelo-seletor,
  .phanyx-config-certificado-page[data-cert-theme="system-dark"]
    .phanyx-cert-modelo-seletor {
    background: var(--cert-input) !important;
    border-color: var(--cert-border) !important;
    color: var(--cert-text) !important;
  }

  /* =========================================================
     TOOLBAR AZUL PHANYX
     Ela continua azul nos dois modos.
     ========================================================= */

  .phanyx-config-certificado-page
    .phanyx-certificado-toolbar {
    color: white;
  }
`}</style>

      {mensagemSucesso && (
        <div className="mb-4">
          <PhanyxToast
            tipo="sucesso"
            titulo={t("toast.successTitle")}
            mensagem={mensagemSucesso}
            onClose={() => setMensagemSucesso("")}
          />
        </div>
      )}

      {!podeUsarEditorCertificados && (
        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">
            {tr("plan.availableProfessional")}
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-900">
            {tr("plan.blockedTitle")}
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
            {tr("plan.blockedDescription")}
          </p>

          <a
            href="/planos"
            className="mt-4 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            {tr("plan.viewPlans")}
          </a>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            {tr("header.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {tr("header.title")}
          </h1>
          <p className="mt-2 text-slate-600">
            {tr("header.description")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!podeUsarEditorCertificados) {
              setMensagemErro(
                tr("plan.editorProfessionalOnly"),
              );
              return;
            }

            document.getElementById("editor-certificado")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
          className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          {tr("header.goToEditor")}
        </button>

        <div className="flex shrink-0 justify-center">
          <Image
            src="/images/phanyx-editor-pintando.png"
            alt={tr("header.mascotAlt")}
            width={220}
            height={220}
            className="h-auto w-[160px] md:w-[220px]"
            priority
          />
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              {tr("models.sectionTitle")}
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-900">
              {tr("models.openedTitle")}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {tr("models.saveBeforeSwitch")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="phanyx-cert-modelos-contador rounded-full border px-4 py-2 text-sm font-bold">
              {resumoModelos.ilimitado
                ? tr("models.activeUnlimited", { count: resumoModelos.utilizados })
                : tr("models.usedOfLimit", {
                  used: resumoModelos.utilizados,
                  limit: Number(resumoModelos.limite || 0),
                })}
            </span>

            <button
              type="button"
              onClick={() => setModalArquivadosAberto(true)}
              disabled={modelosArquivados.length === 0}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {tr("models.archived")} ({modelosArquivados.length})
            </button>

            <button
              type="button"
              onClick={() => setNovoModeloFormAberto((anterior) => !anterior)}
              disabled={
                !resumoModelos.podeCriar ||
                criandoModelo ||
                salvando ||
                publicando
              }
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {tr("models.newModel")}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(280px,1fr)_minmax(280px,1fr)]">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              {tr("models.selectModel")}
            </label>

            <div className="relative">
              <button
                type="button"
                disabled={trocandoModelo || salvando || publicando}
                onClick={() => setMenuModelosAberto((aberto) => !aberto)}
                className="phanyx-cert-modelo-seletor flex w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="truncate">
                  {modeloAtivo?.nome || tr("models.selectModel")}
                </span>

                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`h-5 w-5 shrink-0 transition ${menuModelosAberto ? "rotate-180" : ""
                    }`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.51a.75.75 0 0 1-1.08 0l-4.25-4.51a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {menuModelosAberto && (
                <div className="phanyx-cert-modelo-menu absolute left-0 right-0 top-full z-[200] mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                  {modelosCertificado.map((modelo: any) => {
                    const selecionado =
                      Number(modelo.id) === Number(modeloAtivoId);

                    return (
                      <button
                        key={modelo.id}
                        type="button"
                        onClick={() => {
                          setMenuModelosAberto(false);

                          if (!selecionado) {
                            void abrirModeloCertificado(Number(modelo.id));
                          }
                        }}
                        className={`phanyx-cert-modelo-opcao flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${selecionado ? "is-active" : ""
                          }`}
                      >
                        <span className="truncate">{modelo.nome}</span>

                        {selecionado && (
                          <span
                            className="text-base"
                            aria-label={tr("models.selectedAria")}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {trocandoModelo && (
              <p className="mt-2 text-xs font-semibold text-blue-600">
                {tr("models.opening")}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {tr("models.currentModel")}
                </p>

                <p className="mt-1 text-lg font-black text-slate-900">
                  {modeloAtivo?.nome || tr("models.noneSelected")}
                </p>

                {modeloAtivo?.descricao && (
                  <p className="mt-1 text-sm text-slate-600">
                    {modeloAtivo.descricao}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {modeloAtivo?.padraoGeral && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                    {tr("models.generalDefault")}
                  </span>
                )}

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${modeloAtivo?.publicadoEm
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                    }`}
                >
                  {modeloAtivo?.publicadoEm ? tr("status.published") : tr("status.draftOnly")}
                </span>
              </div>
            </div>

            {modeloAtivo && (
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-300/50 pt-4">
                <button
                  type="button"
                  onClick={abrirEdicaoModeloAtual}
                  disabled={
                    salvandoDadosModelo ||
                    definindoPadraoModelo ||
                    arquivandoModelo ||
                    salvando ||
                    publicando ||
                    trocandoModelo
                  }
                  className="phanyx-cert-modelo-editar-btn inline-flex min-h-9 items-center justify-center rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {tr("models.editData")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void definirModeloAtualComoPadraoGeral();
                  }}
                  disabled={
                    modeloAtivo.padraoGeral === true ||
                    salvandoDadosModelo ||
                    definindoPadraoModelo ||
                    arquivandoModelo ||
                    salvando ||
                    publicando ||
                    trocandoModelo
                  }
                  className={`inline-flex min-h-9 items-center justify-center rounded-lg px-3 py-2 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${modeloAtivo.padraoGeral
                    ? "bg-slate-500"
                    : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                  {definindoPadraoModelo
                    ? tr("models.settingDefault")
                    : modeloAtivo.padraoGeral
                      ? tr("models.currentGeneralDefault")
                      : tr("models.setGeneralDefault")}
                </button>

                <button
                  type="button"
                  onClick={solicitarArquivamentoModeloAtual}
                  disabled={
                    salvandoDadosModelo ||
                    definindoPadraoModelo ||
                    arquivandoModelo ||
                    salvando ||
                    publicando ||
                    trocandoModelo
                  }
                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-500 bg-transparent px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {arquivandoModelo ? tr("archive.archiving") : tr("archive.archiveModel")}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="phanyx-cert-modelos-lista mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {tr("models.listTitle")}
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {tr("models.listHint")}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFiltroSituacaoModelos("TODOS")}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${filtroSituacaoModelos === "TODOS"
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                >
                  {tr("models.filterAll")} ({modelosCertificado.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroSituacaoModelos("RASCUNHOS")}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${filtroSituacaoModelos === "RASCUNHOS"
                    ? "border-amber-500 bg-amber-500 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-amber-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                >
                  {tr("models.filterDrafts")} ({totalModelosRascunho})
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroSituacaoModelos("PUBLICADOS")}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${filtroSituacaoModelos === "PUBLICADOS"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-emerald-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                >
                  {tr("models.filterPublished")} ({totalModelosPublicados})
                </button>
              </div>

              <select
                value={ordemListaModelos}
                onChange={(evento) =>
                  setOrdemListaModelos(evento.target.value as OrdemListaModelos)
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="MAIS_RECENTES">
                  {tr("models.sortNewest")}
                </option>

                <option value="MAIS_ANTIGOS">
                  {tr("models.sortOldest")}
                </option>
              </select>
            </div>
          </div>

          <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(150px,0.8fr)_minmax(190px,0.7fr)] gap-4 border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 md:grid">
            <span>
              {tr("models.name")}
            </span>
            <span>
              {tr("models.modality")}
            </span>
            <span>
              {tr("models.lastChange")}
            </span>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {modelosFiltradosOrdenados.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {tr("models.noneInFilter")}
              </div>
            ) : (
              modelosFiltradosOrdenados.map((modelo: any) => {
                const selecionado = Number(modelo.id) === Number(modeloAtivoId);

                const modalidadeLabel = traduzirModalidadeCertificado(
                  modelo?.modalidade,
                );

                const ultimaAlteracao =
                  Number(modelo?._ultimaAlteracaoTimestamp || 0) > 0
                    ? new Date(modelo._ultimaAlteracaoTimestamp).toLocaleString(
                      locale,
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )
                    : t("models.dateUnavailable");

                return (
                  <button
                    key={modelo.id}
                    type="button"
                    disabled={trocandoModelo || salvando || publicando}
                    onClick={() => {
                      if (!selecionado) {
                        void abrirModeloCertificado(Number(modelo.id));
                      }
                    }}
                    className={`grid w-full gap-3 px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 md:grid-cols-[minmax(0,1.5fr)_minmax(150px,0.8fr)_minmax(190px,0.7fr)] md:items-center md:gap-4 ${selecionado
                      ? "bg-blue-50 dark:bg-blue-950/30"
                      : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                      }`}
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-black text-slate-900 dark:text-white">
                          {modelo.nome}
                        </span>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${modelo._publicado
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                            }`}
                        >
                          {modelo._publicado ? tr("status.published") : tr("status.draft")}
                        </span>

                        {selecionado && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase text-blue-800">
                            {tr("models.open")}
                          </span>
                        )}
                      </span>
                    </span>

                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <span className="mr-2 font-bold text-slate-500 md:hidden">
                        {tr("models.modalityColon")}
                      </span>

                      {modalidadeLabel}
                    </span>

                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="mr-2 font-bold text-slate-500 md:hidden">
                        {tr("models.lastChangeColon")}
                      </span>

                      {ultimaAlteracao}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {novoModeloFormAberto && (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  {tr("models.newName")}
                </label>

                <input
                  type="text"
                  value={novoModeloNome}
                  onChange={(evento) => setNovoModeloNome(evento.target.value)}
                  placeholder={tr("models.exampleExtensionCertificate")}
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  {tr("common.description")}
                </label>

                <input
                  type="text"
                  value={novoModeloDescricao}
                  onChange={(evento) =>
                    setNovoModeloDescricao(evento.target.value)
                  }
                  placeholder={tr("common.optionalDescription")}
                  maxLength={500}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    {tr("models.modelModality")}
                  </label>

                  <select
                    value={novoModeloModalidade}
                    onChange={(evento) => {
                      const modalidade = evento.target
                        .value as ModalidadeCertificadoValor;

                      setNovoModeloModalidade(modalidade);

                      if (modalidade === "GERAL") {
                        setNovoModeloPadraoModalidade(false);
                      }
                    }}
                    className="phanyx-curso-modalidade-select phanyx-certificado-modalidade-select w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500"
                  >
                    {MODALIDADES_CERTIFICADO.map((item) => (
                      <option key={item.valor} value={item.valor}>
                        {traduzirModalidadeCertificado(item.valor)}
                      </option>
                    ))}
                  </select>

                  <p className="mt-2 text-xs text-slate-500">
                    {tr("models.modalityCourseHint")}
                  </p>
                </div>

                <label
                  data-disabled={
                    novoModeloModalidade === "GERAL" ? "true" : "false"
                  }
                  className="phanyx-certificado-padrao-modalidade flex items-start gap-3 rounded-xl border p-4"
                >
                  <input
                    type="checkbox"
                    checked={novoModeloPadraoModalidade}
                    disabled={novoModeloModalidade === "GERAL"}
                    onChange={(evento) =>
                      setNovoModeloPadraoModalidade(evento.target.checked)
                    }
                    className="mt-0.5 h-5 w-5 shrink-0 accent-blue-600 disabled:cursor-not-allowed"
                  />

                  <span>
                    <span className="phanyx-certificado-padrao-modalidade-titulo block text-sm font-bold">
                      {tr("models.defaultForModality")}
                    </span>

                    <span className="phanyx-certificado-padrao-modalidade-descricao mt-1 block text-xs leading-5">
                      {tr("models.defaultForModalityHint")}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={criandoModelo}
                onClick={() => {
                  setNovoModeloFormAberto(false);
                  setNovoModeloNome("");
                  setNovoModeloDescricao("");
                  setNovoModeloModalidade("GERAL");
                  setNovoModeloPadraoModalidade(false);
                }}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {tr("common.cancel")}
              </button>

              <button
                type="button"
                disabled={criandoModelo}
                onClick={() => {
                  void criarNovoModeloCertificado();
                }}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {criandoModelo ? tr("common.creating") : tr("models.createModel")}
              </button>
            </div>
          </div>
        )}

        {!resumoModelos.podeCriar && resumoModelos.limite !== null && (
          <p className="mt-4 text-xs font-semibold text-amber-700">
            {tr("models.limitReached", {
              limit: Number(resumoModelos.limite || 0),
              plan: resumoModelos.plano,
            })}
          </p>
        )}
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {tr("institutionalModel.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {tr("institutionalModel.description")}
            </p>
          </div>

          {certificadoTemplateUrl && (
            <a
              href={certificadoTemplateUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {tr("institutionalModel.viewCurrent")}
            </a>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {tr("institutionalModel.uploadLabel")}
          </label>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setArquivoModelo(e.target.files?.[0] || null)}
            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fazerUploadModelo}
              disabled={enviandoArquivo}
              className="phanyx-certificado-upload-pdf-btn"
            >
              {enviandoArquivo ? (
                <>
                  <span
                    className="phanyx-certificado-upload-spinner"
                    aria-hidden="true"
                  />
                  {tr("institutionalModel.uploadingPdf")}
                </>
              ) : (
                <>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16V4m0 0-4 4m4-4 4 4"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"
                    />
                  </svg>
                  {tr("institutionalModel.sendPdf")}
                </>
              )}
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {tr("institutionalModel.afterUploadHint")}
          </p>
        </div>
      </div>

      <section
        id="editor-certificado"
        className="rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="phanyx-certificado-toolbar sticky top-0 z-40 mb-6 flex items-center justify-between rounded-2xl border border-blue-700 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 px-6 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            {!mostrarPainelCampos && (
              <button
                type="button"
                onClick={() => setMostrarPainelCampos(true)}
                className="rounded-lg bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30"
              >
                {tr("toolbar.showFields")}
              </button>
            )}

            <h2 className="text-sm font-semibold text-white">
              {tr("toolbar.editorName")}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setModoAmplo((prev) => !prev)}
            className="rounded-lg bg-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/30"
          >
            {modoAmplo ? tr("toolbar.showPanels") : tr("toolbar.wideScreen")}
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTamanhoPapel("A5")}
              className={`rounded-lg px-3 py-1 text-sm ${tamanhoPapel === "A5"
                ? "bg-white text-blue-700"
                : "bg-white/20 text-white hover:bg-white/30"
                }`}
            >
              A5
            </button>

            <button
              type="button"
              onClick={() => setTamanhoPapel("A4")}
              className={`rounded-lg px-3 py-1 text-sm ${tamanhoPapel === "A4"
                ? "bg-white text-blue-700"
                : "bg-white/20 text-white hover:bg-white/30"
                }`}
            >
              A4
            </button>

            <button
              type="button"
              onClick={() => setTamanhoPapel("A3")}
              className={`rounded-lg px-3 py-1 text-sm ${tamanhoPapel === "A3"
                ? "bg-white text-blue-700"
                : "bg-white/20 text-white hover:bg-white/30"
                }`}
            >
              A3
            </button>
            <button
              type="button"
              onClick={() => setOrientacao("paisagem")}
              className={`rounded-lg px-3 py-1 text-sm ${orientacao === "paisagem"
                ? "bg-white text-blue-700"
                : "bg-white/20 text-white hover:bg-white/30"
                }`}
            >
              {t("paper.orientation.landscape")}
            </button>

            <button
              type="button"
              onClick={() => setOrientacao("retrato")}
              className={`rounded-lg px-3 py-1 text-sm ${orientacao === "retrato"
                ? "bg-white text-blue-700"
                : "bg-white/20 text-white hover:bg-white/30"
                }`}
            >
              {t("paper.orientation.portrait")}
            </button>

            <button
              type="button"
              disabled={!campoSelecionado}
              onClick={() => {
                if (!campoSelecionado) return;

                atualizarCampoLocal("bloqueado", !campoSelecionado.bloqueado);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${campoSelecionado?.bloqueado
                ? "bg-yellow-300 text-slate-900"
                : "bg-white/20 text-white border border-white/30 hover:bg-white/30"
                }`}
            >
              {campoSelecionado?.bloqueado ? tr("toolbar.locked") : tr("toolbar.unlocked")}
            </button>

            <button
              type="button"
              onClick={() => setModoMao((prev) => !prev)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${modoMao
                ? "bg-white text-blue-700"
                : "bg-white/20 text-white border border-white/30 hover:bg-white/30"
                }`}
              title={tr("toolbar.handToolTitle")}
            >
              {tr("toolbar.hand")}
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/90">
                {tr("toolbar.zoom")}
              </span>
              <input
                type="range"
                min={30}
                max={120}
                step={5}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="accent-white"
              />
              <span className="min-w-[44px] text-right text-xs font-medium text-white">
                {zoom}%
              </span>
            </div>

            <div className="relative flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMenuDownloadAberto((prev) => !prev)}
                className="inline-flex min-h-9 items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-700"
              >
                {tr("download.title")}
              </button>

              <button
                type="button"
                onClick={() => {
                  void salvarRascunhoCompleto();
                }}
                disabled={salvando || publicando}
                className="inline-flex min-h-9 items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando ? tr("common.saving") : tr("toolbar.saveDraft")}
              </button>

              <button
                type="button"
                onClick={() => setModalPublicacaoAberto(true)}
                disabled={salvando || publicando}
                className="inline-flex min-h-9 items-center justify-center rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {publicando ? tr("publish.publishing") : tr("toolbar.publishFinal")}
              </button>

              <button
                type="button"
                onClick={() => setPreviewAberto(true)}
                disabled={salvando || publicando}
                className="inline-flex min-h-9 items-center justify-center rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {tr("toolbar.preview")}
              </button>

              {menuDownloadAberto && (
                <div className="absolute right-0 top-12 z-50 w-[290px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                  <h3 className="text-xl font-bold text-slate-900">
                    {tr("download.title")}
                  </h3>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      {tr("download.fileFormat")}
                    </label>

                    <select
                      value={formatoDownload}
                      onChange={(e) => setFormatoDownload(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm outline-none"
                    >
                      <option value="png">
                        {tr("download.pngOption")}
                      </option>
                      <option value="jpg">
                        {tr("download.jpgOption")}
                      </option>
                      <option value="pdf">
                        {tr("download.pdfOption")}
                      </option>
                      <option value="pdf-impressao">
                        {tr("download.printPdfOption")}
                      </option>
                    </select>
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={baixarArquivo}
                      className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      {tr("download.downloadFile")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={`grid h-[620px] min-h-[620px] grid-cols-1 ${mostrarPainelCampos
            ? "lg:grid-cols-[320px_minmax(0,1fr)_300px]"
            : "lg:grid-cols-[minmax(0,1fr)_300px]"
            }`}
        >
          {mostrarPainelCampos && !modoAmplo && (
            <aside className="max-h-[calc(100vh-360px)] overflow-y-auto border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex flex-col gap-3 pr-20">
                <div className="w-full">
                  <button
                    type="button"
                    onClick={() => setMostrarPainelCampos(false)}
                    className="mb-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                  >
                    {tr("common.closePanel")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCamposDinamicosAberto((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase text-slate-700 hover:bg-slate-50"
                  >
                    <span>
                      {tr("leftPanel.dynamicFields")}
                    </span>
                    <span>{camposDinamicosAberto ? "▾" : "▸"}</span>
                  </button>

                  {camposDinamicosAberto && (
                    <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                      {tr("leftPanel.dynamicFieldsHint")}
                    </p>
                  )}
                </div>

                <div className="phanyx-certificado-outliner mt-3 overflow-hidden border">
                  <div className="phanyx-certificado-outliner-header flex items-center justify-between border-b px-2 py-1">
                    <h3 className="text-xs font-bold uppercase">{tr("leftPanel.scene")}</h3>

                    <span className="text-[10px]">{campos.length}</span>
                  </div>

                  <div className="max-h-[190px] overflow-y-auto overflow-x-hidden">
                    {camadasOrdenadas().map((campo, index) => (
                      <div
                        key={campo.id}
                        draggable
                        onDragStart={() => setCamadaArrastandoId(campo.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (camadaArrastandoId) {
                            reordenarCamada(camadaArrastandoId, campo.id);
                          }
                          setCamadaArrastandoId(null);
                        }}
                        onClick={(e) => {
                          const lista = camadasOrdenadas();

                          if (e.shiftKey && campoSelecionadoId) {
                            const inicio = lista.findIndex(
                              (item) => item.id === campoSelecionadoId,
                            );
                            const fim = lista.findIndex(
                              (item) => item.id === campo.id,
                            );

                            if (inicio >= 0 && fim >= 0) {
                              const [min, max] = [
                                Math.min(inicio, fim),
                                Math.max(inicio, fim),
                              ];
                              const ids = lista
                                .slice(min, max + 1)
                                .map((item) => item.id);

                              setCamposSelecionadosIds(ids);
                              setCampoSelecionadoId(campo.id);
                              return;
                            }
                          }

                          if (e.ctrlKey || e.metaKey) {
                            setCamposSelecionadosIds((prev) =>
                              prev.includes(campo.id)
                                ? prev.filter((id) => id !== campo.id)
                                : [...prev, campo.id],
                            );

                            setCampoSelecionadoId(campo.id);
                            return;
                          }

                          setCampoSelecionadoId(campo.id);
                          setCamposSelecionadosIds([campo.id]);
                        }}

                        onDoubleClick={() => {
                          setCamadaRenomeandoId(campo.id);
                          setNomeCamadaEditando(nomeDaCamada(campo, index));
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setCampoSelecionadoId(campo.id);
                          setCamposSelecionadosIds([campo.id]);
                          setMenuCamada({
                            x: e.clientX,
                            y: e.clientY,
                            campoId: campo.id,
                          });
                        }}
                        className={`flex h-7 cursor-pointer items-center gap-2 border-b border-slate-200 px-2 text-xs ${camposSelecionadosIds.includes(campo.id)
                          ? "bg-blue-100 text-blue-700"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        <span className="cursor-grab text-[10px] text-slate-400">
                          ☰
                        </span>

                        {camadaRenomeandoId === campo.id ? (
                          <input
                            autoFocus
                            value={nomeCamadaEditando}
                            onChange={(e) =>
                              setNomeCamadaEditando(e.target.value)
                            }
                            onBlur={() => {
                              atualizarCampoLocal(
                                "nomeCamada" as any,
                                nomeCamadaEditando as any,
                              );
                              setCamadaRenomeandoId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                atualizarCampoLocal(
                                  "nomeCamada" as any,
                                  nomeCamadaEditando as any,
                                );
                                setCamadaRenomeandoId(null);
                              }
                            }}
                            className="w-full border-none bg-transparent text-xs outline-none"
                          />
                        ) : (
                          <span className="flex-1 truncate">
                            {nomeDaCamada(campo, index)}
                          </span>
                        )}

                        {campo.bloqueado && (
                          <span
                            className="text-[10px]"
                            title={tr("layers.lockedElement")}
                          >
                            🔒
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-4 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                {tr("toolbar.editorName")}
              </div>

              <div className="mb-4 rounded-2xl border border-dashed border-blue-300 bg-white p-4 shadow-sm">
                <p className="phanyx-cert-sidebar-title mb-3">
                  {tr("library.phanyxBackground")}
                </p>

                <div className="mb-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModoFundo("modelo")}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold ${modoFundo === "modelo"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "bg-white text-slate-700"
                      }`}
                  >
                    {tr("library.useModel")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setModoFundo("phanyx")}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold ${modoFundo === "phanyx"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "bg-white text-slate-700"
                      }`}
                  >
                    {tr("library.createFromScratch")}
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-600">
                    {tr("library.backgroundColor")}
                  </label>

                  <input
                    type="color"
                    value={corFundoPagina}
                    onChange={(e) => {
                      setModoFundo("phanyx");
                      setCorFundoPagina(e.target.value);
                    }}
                    className="h-10 w-full cursor-pointer rounded-xl border border-slate-300 bg-white"
                  />

                  <div className="grid grid-cols-5 gap-2">
                    {[
                      "#ffffff",
                      "#f8fafc",
                      "#fef3c7",
                      "#eff6ff",
                      "#f0fdf4",
                    ].map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        onClick={() => {
                          setModoFundo("phanyx");
                          setCorFundoPagina(cor);
                        }}
                        className="h-8 rounded-lg border border-slate-300 shadow-sm"
                        style={{ backgroundColor: cor }}
                        title={cor}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-4 rounded-2xl border border-dashed border-blue-300 bg-white p-4 shadow-sm">
                <p className="phanyx-cert-sidebar-title mb-3">
                  {tr("library.certificateImages")}
                </p>

                <details
                  className="mb-3 rounded-xl border bg-slate-50 p-3"
                  open
                >
                  <summary className="cursor-pointer text-xs font-bold text-slate-700">
                    {tr("library.landscapeFrames")}
                  </summary>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {moldurasPaisagem.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => adicionarImagemBiblioteca(src, 520, 360)}
                        className="rounded-lg border bg-white p-1 hover:border-blue-500 hover:bg-blue-50"
                        title={`Moldura paisagem ${index + 1}`}
                      >
                        <img
                          src={src}
                          alt={`Moldura paisagem ${index + 1}`}
                          className="h-14 w-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </details>

                <details className="mb-3 rounded-xl border bg-slate-50 p-3">
                  <summary className="cursor-pointer text-xs font-bold text-slate-700">
                    {tr("library.portraitFrames")}
                  </summary>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {moldurasRetrato.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => adicionarImagemBiblioteca(src, 360, 520)}
                        className="rounded-lg border bg-white p-1 hover:border-blue-500 hover:bg-blue-50"
                        title={`Moldura retrato ${index + 1}`}
                      >
                        <img
                          src={src}
                          alt={`Moldura retrato ${index + 1}`}
                          className="h-16 w-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </details>

                <details className="rounded-xl border bg-slate-50 p-3">
                  <summary className="cursor-pointer text-xs font-bold text-slate-700">
                    {tr("library.decorativeFigures")}
                  </summary>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {figurasDecorativas.map((src, index) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => adicionarImagemBiblioteca(src, 150, 150)}
                        className="rounded-lg border bg-white p-1 hover:border-blue-500 hover:bg-blue-50"
                        title={`Figura ${index + 1}`}
                      >
                        <img
                          src={src}
                          alt={`Figura ${index + 1}`}
                          className="h-14 w-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </details>
              </div>

              <div className="mb-4 rounded-2xl border border-dashed border-blue-300 bg-white p-4 shadow-sm">
                <p className="phanyx-cert-sidebar-title mb-3">
                  {tr("library.texts")}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => adicionarCampo("TEXTO_LIVRE", "TITULO")}
                    className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-3xl font-black text-blue-700">
                      T
                    </span>
                    <span className="mt-2 text-xs font-bold text-slate-700">
                      {tr("common.title")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => adicionarCampo("TEXTO_LIVRE", "TEXTO")}
                    className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-xl font-black text-blue-700">
                      Tx
                    </span>
                    <span className="mt-2 text-xs font-bold text-slate-700">
                      {tr("common.text")}
                    </span>
                  </button>
                </div>

                <p className="mt-3 text-[11px] leading-5 text-slate-500">
                  {tr("library.freeTextHint")}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 shadow-sm">
                <button
                  type="button"
                  onClick={() => setFormasAbertas((v) => !v)}
                  className="mb-2 flex w-full items-center justify-between text-left"
                >
                  <span className="phanyx-cert-sidebar-title">
                    {tr("library.geometricShapes")}
                  </span>

                  <span className="text-lg text-slate-500">
                    {formasAbertas ? "−" : "+"}
                  </span>
                </button>

                {formasAbertas && (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCampos((prev) => [
                            ...prev,
                            {
                              tempId: Date.now(),
                              id: Date.now(),
                              tipo: "FORMA",
                              forma: "RETANGULO",
                              pontosForma:
                                criarPontosIniciaisForma("RETANGULO"),
                              mostrarPreenchimento: true,
                              mostrarContorno: true,
                              preenchimentoCor: "#1d4ed8",
                              contornoCor: "#1d4ed8",
                              contornoEspessura: 2,
                              x: 120,
                              y: 120,
                              largura: 180,
                              altura: 90,
                              cor: "#1d4ed8",
                              opacity: 0.35,
                              ordem: 5,
                            } as any,
                          ])
                        }
                        className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100">
                          <span className="h-5 w-8 rounded-md border-2 border-blue-700 bg-blue-200/50" />
                        </span>
                        <span className="mt-2 text-[11px] font-semibold text-slate-700">
                          {tr("shapes.RETANGULO")}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCampos((prev) => [
                            ...prev,
                            {
                              tempId: Date.now(),
                              id: Date.now() + 4,
                              tipo: "FORMA",
                              forma: "QUADRADO",
                              pontosForma: criarPontosIniciaisForma("QUADRADO"),
                              mostrarPreenchimento: true,
                              mostrarContorno: true,
                              preenchimentoCor: "#1d4ed8",
                              contornoCor: "#1d4ed8",
                              contornoEspessura: 2,
                              x: 130,
                              y: 130,
                              largura: 120,
                              altura: 120,
                              cor: "#1d4ed8",
                              opacity: 0.35,
                              ordem: 5,
                            } as any,
                          ])
                        }
                        className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100">
                          <span className="h-7 w-7 rounded-md border-2 border-blue-700 bg-blue-200/50" />
                        </span>
                        <span className="mt-2 text-[11px] font-semibold text-slate-700">
                          {tr("shapes.QUADRADO")}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCampos((prev) => [
                            ...prev,
                            {
                              tempId: Date.now(),
                              id: Date.now() + 1,
                              tipo: "FORMA",
                              forma: "CIRCULO",
                              pontosForma: criarPontosIniciaisForma("CIRCULO"),
                              mostrarPreenchimento: true,
                              mostrarContorno: true,
                              preenchimentoCor: "#1d4ed8",
                              contornoCor: "#1d4ed8",
                              contornoEspessura: 2,
                              x: 140,
                              y: 140,
                              largura: 110,
                              altura: 110,
                              cor: "#1d4ed8",
                              opacity: 0.35,
                              ordem: 5,
                            } as any,
                          ])
                        }
                        className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100">
                          <span className="h-7 w-7 rounded-full border-2 border-blue-700 bg-blue-200/50" />
                        </span>
                        <span className="mt-2 text-[11px] font-semibold text-slate-700">
                          {tr("shapes.CIRCULO")}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCampos((prev) => [
                            ...prev,
                            {
                              id: Date.now() + 2,
                              tipo: "FORMA",
                              forma: "LINHA",
                              pontosForma: criarPontosIniciaisForma("LINHA"),
                              mostrarPreenchimento: true,
                              mostrarContorno: true,
                              preenchimentoCor: "#1d4ed8",
                              contornoCor: "#1d4ed8",
                              contornoEspessura: 2,
                              x: 160,
                              y: 160,
                              largura: 180,
                              altura: 1,
                              cor: "#1d4ed8",
                              opacity: 1,
                              ordem: 5,
                            } as any,
                          ])
                        }
                        className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100">
                          <span className="h-1 w-9 rounded-full bg-blue-700" />
                        </span>
                        <span className="mt-2 text-[11px] font-semibold text-slate-700">
                          {tr("shapes.LINHA")}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCampos((prev) => [
                            ...prev,
                            {
                              id: Date.now() + 3,
                              tipo: "FORMA",
                              forma: "ESTRELA",
                              pontosForma: criarPontosIniciaisForma("ESTRELA"),
                              mostrarPreenchimento: true,
                              mostrarContorno: true,
                              preenchimentoCor: "#1d4ed8",
                              contornoCor: "#1d4ed8",
                              contornoEspessura: 3,
                              x: 180,
                              y: 180,
                              largura: 160,
                              altura: 160,
                              cor: "#1d4ed8",
                              opacity: 1,
                              ordem: 5,
                              pontasEstrela: 5,
                              raioInterno: 22,
                              raioExterno: 44,
                              profundidadeEstrela: 45,
                              arredondarEstrela: 0,
                              pontas: 5,
                            } as any,
                          ])
                        }
                        className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100">
                          <span className="text-2xl text-blue-700">★</span>
                        </span>
                        <span className="mt-2 text-[11px] font-semibold text-slate-700">
                          {tr("shapes.ESTRELA")}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCampos((prev) => [
                            ...prev,
                            {
                              id: Date.now() + 5,
                              tipo: "FORMA",
                              forma: "TRIANGULO",
                              pontosForma:
                                criarPontosIniciaisForma("TRIANGULO"),
                              mostrarPreenchimento: true,
                              mostrarContorno: true,
                              preenchimentoCor: "#1d4ed8",
                              contornoCor: "#1d4ed8",
                              contornoEspessura: 2,
                              x: 200,
                              y: 200,
                              largura: 140,
                              altura: 140,
                              cor: "#1d4ed8",
                              opacity: 0.55,
                              ordem: 5,
                            } as any,
                          ])
                        }
                        className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100">
                          <span className="h-0 w-0 border-x-[14px] border-b-[24px] border-x-transparent border-b-blue-700" />
                        </span>
                        <span className="mt-2 text-[11px] font-semibold text-slate-700">
                          {tr("shapes.TRIANGULO")}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCampos((prev) => [
                            ...prev,
                            {
                              id: Date.now() + 6,
                              tipo: "FORMA",
                              forma: "SETA",
                              pontosForma: criarPontosIniciaisForma("SETA"),
                              mostrarPreenchimento: true,
                              mostrarContorno: true,
                              preenchimentoCor: "#1d4ed8",
                              contornoCor: "#1d4ed8",
                              contornoEspessura: 2,
                              x: 200,
                              y: 200,
                              largura: 180,
                              altura: 100,
                              cor: "#1d4ed8",
                              opacity: 0.55,
                              ordem: 5,
                            } as any,
                          ])
                        }
                        className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100">
                          <span className="text-3xl font-black text-blue-700">
                            ➜
                          </span>
                        </span>
                        <span className="mt-2 text-[11px] font-semibold text-slate-700">
                          {tr("shapes.SETA")}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCampos((prev) => [
                            ...prev,
                            {
                              id: Date.now() + 7,
                              tipo: "FORMA",
                              forma: "LOSANGO",
                              pontosForma: criarPontosIniciaisForma("LOSANGO"),
                              mostrarPreenchimento: true,
                              mostrarContorno: true,
                              preenchimentoCor: "#1d4ed8",
                              contornoCor: "#1d4ed8",
                              contornoEspessura: 2,
                              x: 200,
                              y: 200,
                              largura: 140,
                              altura: 140,
                              cor: "#1d4ed8",
                              opacity: 0.55,
                              ordem: 5,
                            } as any,
                          ])
                        }
                        className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100">
                          <span className="h-8 w-8 rotate-45 rounded-sm bg-blue-700" />
                        </span>
                        <span className="mt-2 text-[11px] font-semibold text-slate-700">
                          {tr("shapes.LOSANGO")}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCampos((prev) =>
                            prev.filter((campo) => campo.id !== -999999),
                          );
                          setModoFormaLivre(true);
                          setPontosFormaLivre([]);
                          pontosFormaLivreRef.current = [];
                          setCampoSelecionadoId(null);
                          setCamposSelecionadosIds([]);
                          setPontoFormaSelecionado(null);

                          setMensagemSucesso(
                            tr("freeForm.activated"),
                          );
                        }}
                        className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100">
                          <span className="text-2xl text-blue-700">✒️</span>
                        </span>
                        <span className="mt-2 text-[11px] font-semibold text-slate-700">
                          {tr("shapes.LIVRE")}
                        </span>
                      </button>
                    </div>
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-blue-50 px-4 py-4 text-center transition hover:bg-blue-100">
                      <span className="text-2xl">🖼️</span>
                      <span className="mt-1 text-sm font-black text-blue-700">
                        {tr("library.addPngJpeg")}
                      </span>
                      <span className="mt-1 text-[11px] text-slate-500">
                        {tr("library.multipleImagesHint")}
                      </span>

                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        multiple
                        onChange={handleUploadImagem}
                        className="hidden"
                      />
                    </label>

                    <div className="mt-3 space-y-2">
                      {campos
                        .filter((c) => c.tipo === "IMAGEM")
                        .map((img) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setCampoSelecionadoId(img.id)}
                            className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-left hover:bg-slate-100"
                          >
                            <div className="flex h-12 w-12 items-center justify-center overflow-visible rounded-lg bg-white">
                              <img
                                src={
                                  (img as any).imagemUrl ||
                                  (img as any).url ||
                                  (img as any).src ||
                                  (img as any).arquivoUrl ||
                                  (img as any).previewUrl
                                }
                                alt={tr("library.imageUploaded")}
                                className="h-full w-full"
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-700">
                                {tr("library.imageAdded")}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {tr("library.clickToSelect")}
                              </p>
                            </div>
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                {/* Informações do aluno */}
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() =>
                      setSecaoAberta(secaoAberta === "aluno" ? null : "aluno")
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {tr("fieldGroups.student")}
                    </span>
                    <span className="text-slate-500">
                      {secaoAberta === "aluno" ? "−" : "+"}
                    </span>
                  </button>

                  {secaoAberta === "aluno" && (
                    <div className="space-y-2 border-t border-slate-100 px-4 py-3">
                      {[
                        { tipo: "NOME_ALUNO", label: tr("fieldTypes.NOME_ALUNO") },
                        {
                          tipo: "NUMERO_MATRICULA",
                          label: tr("fieldTypes.NUMERO_MATRICULA"),
                        },
                        { tipo: "CPF_ALUNO", label: tr("fieldTypes.CPF_ALUNO") },
                        { tipo: "RG_ALUNO", label: tr("fieldTypes.RG_ALUNO") },
                      ].map((item) => (
                        <button
                          key={item.tipo}
                          type="button"
                          onClick={() => adicionarCampo(item.tipo)}
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Informações do curso */}
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() =>
                      setSecaoAberta(secaoAberta === "curso" ? null : "curso")
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {tr("fieldGroups.course")}
                    </span>
                    <span className="text-slate-500">
                      {secaoAberta === "curso" ? "−" : "+"}
                    </span>
                  </button>

                  {secaoAberta === "curso" && (
                    <div className="space-y-2 border-t border-slate-100 px-4 py-3">
                      {[
                        { tipo: "NOME_CURSO", label: tr("fieldTypes.NOME_CURSO") },
                        {
                          tipo: "DISCIPLINAS_CONCLUIDAS",
                          label: tr("fieldTypes.DISCIPLINAS_CONCLUIDAS"),
                        },
                        { tipo: "CARGA_HORARIA", label: tr("fieldTypes.CARGA_HORARIA") },
                        { tipo: "ANO_CONCLUSAO", label: tr("fieldTypes.ANO_CONCLUSAO") },
                        { tipo: "DATA_CONCLUSAO", label: tr("fieldTypes.DATA_CONCLUSAO") },
                        { tipo: "APROVEITAMENTO", label: tr("fieldTypes.APROVEITAMENTO") },
                        { tipo: "FREQUENCIA_TOTAL", label: tr("fieldTypes.FREQUENCIA_TOTAL") },
                        { tipo: "MODALIDADE", label: tr("fieldTypes.MODALIDADE") },
                        { tipo: "TURMA", label: tr("fieldTypes.TURMA") },
                        { tipo: "POLO", label: tr("fieldTypes.POLO") },
                      ].map((item) => (
                        <button
                          key={item.tipo}
                          type="button"
                          onClick={() => adicionarCampo(item.tipo)}
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Informações institucionais */}
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() =>
                      setSecaoAberta(
                        secaoAberta === "institucional"
                          ? null
                          : "institucional",
                      )
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {tr("fieldGroups.institutional")}
                    </span>
                    <span className="text-slate-500">
                      {secaoAberta === "institucional" ? "−" : "+"}
                    </span>
                  </button>

                  {secaoAberta === "institucional" && (
                    <div className="space-y-2 border-t border-slate-100 px-4 py-3">
                      {[
                        {
                          tipo: "NOME_INSTITUICAO",
                          label: tr("fieldTypes.NOME_INSTITUICAO"),
                        },
                        {
                          tipo: "CNPJ_INSTITUICAO",
                          label: tr("fieldTypes.CNPJ_INSTITUICAO"),
                        },
                        { tipo: "CIDADE", label: tr("fieldTypes.CIDADE") },
                        { tipo: "DATA_EMISSAO", label: tr("fieldTypes.DATA_EMISSAO") },
                        { tipo: "NOME_DIRETOR", label: tr("fieldTypes.NOME_DIRETOR") },
                        { tipo: "ASSINATURA", label: tr("fieldTypes.ASSINATURA") },
                        {
                          tipo: "LOGO_INSTITUICAO",
                          label: tr("fieldTypes.LOGO_INSTITUICAO"),
                        },
                      ].map((item) => (
                        <button
                          key={item.tipo}
                          type="button"
                          onClick={() => adicionarCampo(item.tipo)}
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Textos livres */}
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() =>
                      setSecaoAberta(secaoAberta === "textos" ? null : "textos")
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {tr("fieldGroups.freeTexts")}
                    </span>
                    <span className="text-slate-500">
                      {secaoAberta === "textos" ? "−" : "+"}
                    </span>
                  </button>

                  {secaoAberta === "textos" && (
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => adicionarCampo("TEXTO_LIVRE", "TITULO")}
                        className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl font-black text-blue-700">
                          T
                        </span>
                        <span className="mt-2 text-[11px] font-semibold text-slate-700">
                          {tr("common.title")}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => adicionarCampo("TEXTO_LIVRE", "TEXTO")}
                        className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-lg font-black text-blue-700">
                          Tx
                        </span>
                        <span className="mt-2 text-[11px] font-semibold text-slate-700">
                          {tr("common.text")}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Validação */}
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() =>
                      setSecaoAberta(
                        secaoAberta === "validacao" ? null : "validacao",
                      )
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {tr("fieldGroups.validation")}
                    </span>
                    <span className="text-slate-500">
                      {secaoAberta === "validacao" ? "−" : "+"}
                    </span>
                  </button>

                  {secaoAberta === "validacao" && (
                    <div className="space-y-2 border-t border-slate-100 px-4 py-3">
                      {[
                        {
                          tipo: "NUMERO_CERTIFICADO",
                          label: tr("fieldTypes.NUMERO_CERTIFICADO"),
                        },
                        { tipo: "QR_CODE", label: tr("fieldTypes.QR_CODE") },
                        {
                          tipo: "CODIGO_VALIDACAO",
                          label: tr("fieldTypes.CODIGO_VALIDACAO"),
                        },
                      ].map((item) => (
                        <button
                          key={item.tipo}
                          type="button"
                          onClick={() => adicionarCampo(item.tipo)}
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}

          {(camposSelecionadosIds.length >= 1 ||
            campoSelecionadoId !== null) && (
              <div
                data-barra-selecao-certificado="true"
                onMouseDown={(e) => {
                  e.stopPropagation();

                  trazerPainelFlutuanteParaFrente(
                    "barraSelecao"
                  );
                }}
                className={[
                  "fixed rounded-2xl border border-blue-500/40",
                  "bg-slate-950/95 text-white shadow-2xl backdrop-blur",
                  "transition-[width,padding] duration-150",

                  barraSelecaoMinimizada
                    ? "w-[min(360px,calc(100vw-32px))] p-2"
                    : "w-[min(920px,calc(100vw-32px))] p-3",
                ].join(" ")}
                style={{
                  left:
                    `${barraSelecaoPosicao.x}px`,

                  top:
                    `${barraSelecaoPosicao.y}px`,

                  zIndex:
                    Math.max(
                      zIndexFlutuante.barraSelecao,
                      10000020
                    ),
                }}
              >
                <div
                  className={[
                    "flex items-center gap-2",
                    barraSelecaoMinimizada
                      ? ""
                      : "mb-2",
                  ].join(" ")}
                >
                  <div
                    onMouseDown={
                      iniciarArrasteBarraSelecao
                    }
                    className="min-w-0 flex-1 cursor-move select-none rounded-lg px-2 py-1 hover:bg-white/10"
                    title={tr("selection.dragBarHint")}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        ↕
                      </span>

                      <p className="truncate text-sm font-bold !text-white">
                        {barraSelecaoMinimizada
                          ? tr("selection.toolsTitle")
                          : tr("selection.alignSelectedTitle")}
                      </p>
                    </div>

                    {!barraSelecaoMinimizada && (
                      <p className="text-xs !text-slate-300">
                        {tr("selection.dragBarHint")}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold">
                    {tr("selection.selectedCount", {
                      count:
                        camposSelecionadosIds.length ||
                        (campoSelecionadoId !== null ? 1 : 0),
                    })}
                  </span>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      setBarraSelecaoMinimizada(
                        (valor) => !valor
                      );
                    }}
                    className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg !border !border-blue-200 !bg-white px-3 text-sm font-black !text-slate-950 shadow hover:!bg-blue-50"
                    title={
                      barraSelecaoMinimizada
                        ? tr("selection.maximizeTools")
                        : tr("selection.minimizeTools")
                    }
                  >
                    <span>
                      {barraSelecaoMinimizada
                        ? "□"
                        : "−"}
                    </span>

                    <span>
                      {barraSelecaoMinimizada
                        ? tr("common.open")
                        : tr("selection.minimizeTools")}
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => alinharSelecionados("ESQUERDA")}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                  >
                    {tr("common.left")}
                  </button>

                  <button
                    type="button"
                    onClick={() => alinharSelecionados("CENTRO_HORIZONTAL")}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                  >
                    {tr("selection.centerX")}
                  </button>

                  <button
                    type="button"
                    onClick={() => alinharSelecionados("DIREITA")}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                  >
                    {tr("common.right")}
                  </button>

                  <button
                    type="button"
                    onClick={() => alinharSelecionados("TOPO")}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                  >
                    {tr("selection.sameTop")}
                  </button>

                  <button
                    type="button"
                    onClick={() => alinharSelecionados("CENTRO_VERTICAL")}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                  >
                    {tr("selection.centerY")}
                  </button>

                  <button
                    type="button"
                    onClick={() => alinharSelecionados("BAIXO")}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
                  >
                    {tr("selection.sameBottom")}
                  </button>

                  <button
                    type="button"
                    onClick={() => centralizarSelecaoNaCena("X")}
                    className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-500"
                  >
                    {tr("selection.pageCenterX")}
                  </button>

                  <button
                    type="button"
                    onClick={() => centralizarSelecaoNaCena("Y")}
                    className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-500"
                  >
                    {tr("selection.pageCenterY")}
                  </button>

                  <button
                    type="button"
                    onClick={() => centralizarSelecaoNaCena("XY")}
                    className="rounded-xl bg-purple-700 px-3 py-2 text-xs font-bold text-white hover:bg-purple-600"
                  >
                    {tr("selection.pageCenter")}
                  </button>

                  <button
                    type="button"
                    onClick={() => duplicarSelecaoNoOposto("X")}
                    className="rounded-xl bg-cyan-700 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-600"
                  >
                    {tr("selection.duplicateOppositeX")}
                  </button>

                  <button
                    type="button"
                    onClick={() => duplicarSelecaoNoOposto("Y")}
                    className="rounded-xl bg-cyan-700 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-600"
                  >
                    {tr("selection.duplicateOppositeY")}
                  </button>

                  <button
                    type="button"
                    onClick={() => duplicarSelecaoNoOposto("XY")}
                    className="rounded-xl bg-cyan-800 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-700"
                  >
                    {tr("selection.duplicateOppositeXY")}
                  </button>

                  <button
                    type="button"
                    onClick={() => alinharSelecionados("MESMA_LARGURA")}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold hover:bg-emerald-500"
                  >
                    {tr("selection.sameWidth")}
                  </button>

                  <button
                    type="button"
                    onClick={() => alinharSelecionados("MESMA_ALTURA")}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold hover:bg-emerald-500"
                  >
                    {tr("selection.sameHeight")}
                  </button>

                  <button
                    type="button"
                    onClick={() => alinharSelecionados("MESMO_TAMANHO")}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold hover:bg-emerald-500"
                  >
                    {tr("selection.sameSize")}
                  </button>

                  <button
                    type="button"
                    onClick={() => virarSelecionados("HORIZONTAL")}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
                  >
                    {tr("selection.flipH")}
                  </button>

                  <button
                    type="button"
                    onClick={() => virarSelecionados("VERTICAL")}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
                  >
                    {tr("selection.flipV")}
                  </button>

                  <button
                    type="button"
                    onClick={() => agruparCamposSelecionados()}
                    disabled={camposSelecionadosIds.length < 2}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70 disabled:!bg-slate-700 disabled:!text-slate-300"
                  >
                    {tr("selection.group")}
                  </button>

                  <button
                    type="button"
                    onClick={() => desagruparCampoSelecionado()}
                    disabled={!campoSelecionado?.grupoId}
                    className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-70 disabled:!bg-slate-700 disabled:!text-slate-300"
                  >
                    {tr("contextMenu.ungroup")}
                  </button>

                  <button
                    type="button"
                    onClick={abrirMenuFerramentasSelecao}
                    className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-slate-600"
                  >
                    {tr("selection.tools")}
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();

                      setCamposSelecionadosIds([]);
                      setCampoSelecionadoId(null);
                    }}
                    className="ml-auto rounded-xl bg-red-600 px-3 py-2 text-xs font-bold hover:bg-red-500"
                  >
                    {tr("selection.close")}
                  </button>
                </div>
              </div>
            )}

          <main className="flex h-full min-h-0 flex-col bg-white">
            <div className="border-b border-slate-200 bg-white px-5 py-3 text-sm text-slate-500">
              {tr("canvas.editingArea")}
            </div>

            <div
              ref={stageRef}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setCamposSelecionadosIds([]);
                  setCampoSelecionadoId(null);
                }

                iniciarArrastoCanvas(e);
              }}
              onMouseMove={moverCanvas}
              onMouseUp={finalizarArrastoCanvas}
              onMouseLeave={finalizarArrastoCanvas}
              className="relative flex min-h-0 flex-1 items-start justify-start overflow-auto bg-[#eef2f7] p-8"
              style={{
                cursor:
                  modoMao || espacoPressionado
                    ? arrastandoCanvas
                      ? "grabbing"
                      : "grab"
                    : "default",
              }}
            >
              <div
                className="relative flex-shrink-0"
                style={{
                  width: `${canvasWidth}px`,
                  height: `${canvasHeight}px`,
                  minWidth: `${canvasWidth}px`,
                  minHeight: `${canvasHeight}px`,
                  margin: "auto",
                }}
              >
                <div
                  ref={canvasRef}
                  data-certificado-papel="true"
                  data-cert-canvas="true"

                  onMouseDown={(e) => {
                    if (modoFormaLivre) {
                      if (e.target !== e.currentTarget) return;
                      clicarFormaLivreNoCanvas(e);
                      return;
                    }

                    iniciarSelecaoRetangular(e);
                  }}
                  onMouseMove={(e) => {
                    moverSelecaoRetangular(e);
                    onMouseMoveCanvas(e);
                  }}
                  onMouseUp={() => {
                    finalizarSelecaoRetangular();
                    finalizarDrag();
                  }}
                  onMouseLeave={() => {
                    finalizarSelecaoRetangular();
                    finalizarDrag();
                  }}

                  className="absolute left-0 top-0 overflow-visible border border-dashed border-slate-700 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
                  style={{
                    width: `${baseCanvas.largura}px`,
                    height: `${baseCanvas.altura}px`,
                    backgroundColor:
                      modoFundo === "phanyx" ? corFundoPagina : "#ffffff",
                    transform: `scale(${escala})`,
                    transformOrigin: "top left",
                  }}
                >
                  {modoFundo === "modelo" && certificadoTemplateUrl ? (
                    <>
                      <iframe
                        src={`${certificadoTemplateUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        title={tr("canvas.certificateModelTitle")}
                        className="pointer-events-none absolute inset-0 h-full w-full"
                      />

                      <div className="absolute left-4 top-4 z-10 rounded-lg bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                        {tr("canvas.modelLoadedHint")}
                      </div>
                    </>
                  ) : null}

                  {caixaDoGrupoSelecionado && (
                    <div
                      className="pointer-events-none absolute z-[9998] rounded-xl border-2 border-blue-600"
                      style={{
                        left: `${caixaDoGrupoSelecionado.x}px`,
                        top: `${caixaDoGrupoSelecionado.y}px`,
                        width: `${caixaDoGrupoSelecionado.largura}px`,
                        height: `${caixaDoGrupoSelecionado.altura}px`,
                        backgroundColor: "transparent",
                        boxShadow: "0 0 0 2px rgba(37, 99, 235, 0.35)",
                      }}
                    />
                  )}

                  {caixaDoGrupoSelecionado && (
                    <div
                      className="pointer-events-none absolute z-[9998] rounded-xl border-2 border-blue-600"
                      style={{
                        left: `${caixaDoGrupoSelecionado.x}px`,
                        top: `${caixaDoGrupoSelecionado.y}px`,
                        width: `${caixaDoGrupoSelecionado.largura}px`,
                        height: `${caixaDoGrupoSelecionado.altura}px`,
                        backgroundColor: "transparent",
                        boxShadow: "0 0 0 2px rgba(37, 99, 235, 0.35)",
                      }}
                    />
                  )}

                  {caixaDoGrupoSelecionado && (
                    <div
                      className="pointer-events-none absolute z-[999998] border-2 border-emerald-400"
                      style={{
                        left: `${caixaDoGrupoSelecionado.x}px`,
                        top: `${caixaDoGrupoSelecionado.y}px`,
                        width: `${caixaDoGrupoSelecionado.largura}px`,
                        height: `${caixaDoGrupoSelecionado.altura}px`,
                      }}
                    >
                      <div className="absolute -left-2 -top-6 rounded bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white shadow">
                        {tr("selection.groupLabel")}
                      </div>

                      <div
                        onMouseDown={iniciarRotacaoGrupo}
                        className="pointer-events-auto absolute left-1/2 -top-10 flex h-8 w-8 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-sm font-bold text-white shadow-lg active:cursor-grabbing"
                        title={tr("selection.rotateWholeGroup")}
                      >
                        ↻
                      </div>

                      <div
                        onMouseDown={iniciarRedimensionamentoGrupo}
                        className="pointer-events-auto absolute -bottom-3 -right-3 h-7 w-7 cursor-se-resize rounded-full border-2 border-white bg-emerald-500 shadow-lg"
                        title={tr("selection.resizeWholeGroup")}
                      />
                    </div>
                  )}

                  {/* CAIXA DE SELEÇÃO COM MOUSE */}
                  {caixaSelecao && (
                    <div
                      className="pointer-events-none absolute border border-blue-500 bg-blue-500/10"
                      style={{
                        left: `${caixaSelecao.x}px`,
                        top: `${caixaSelecao.y}px`,
                        width: `${caixaSelecao.largura}px`,
                        height: `${caixaSelecao.altura}px`,
                        zIndex: 999999,
                      }}
                    />
                  )}

                  {[
                    ...campos.flatMap((campo) => {
                      if (
                        campo.tipo !== "FORMA" ||
                        !(campo as any).arrayAtivo
                      ) {
                        return [campo];
                      }

                      const config = (campo as any).arrayConfig;
                      if (!config?.ativo) return [campo];

                      const quantidade = Number(config.quantidade || 1);
                      const anguloRad =
                        (Number(config.angulo || 0) * Math.PI) / 180;

                      const escala = Number(config.escala || 100) / 100;
                      const opacidade = Number(config.opacidade || 100) / 100;

                      const copias = Array.from({ length: quantidade }).map(
                        (_, index) => {
                          const passo = index + 1;

                          const baseX = Number(config.distanciaX || 0) * passo;
                          const baseY = Number(config.distanciaY || 0) * passo;

                          const deslocamentoX =
                            baseX * Math.cos(anguloRad) -
                            baseY * Math.sin(anguloRad);

                          const deslocamentoY =
                            baseX * Math.sin(anguloRad) +
                            baseY * Math.cos(anguloRad);

                          return {
                            ...campo,
                            id: Number(`${campo.id}${passo}`),
                            arrayPreview: true,
                            x: Number(campo.x || 0) + deslocamentoX,
                            y: Number(campo.y || 0) + deslocamentoY,
                            largura:
                              Number(campo.largura || 100) *
                              Math.pow(escala, passo),
                            altura:
                              Number(campo.altura || 100) *
                              Math.pow(escala, passo),
                            rotate:
                              Number((campo as any).rotate || 0) +
                              Number(config.rotacaoPorCopia || 0) * passo,
                            opacity: Math.max(
                              0.05,
                              Number(campo.opacity || 1) *
                              Math.pow(opacidade, passo),
                            ),
                          };
                        },
                      );

                      return [campo, ...copias];
                    }),
                    ...copiasPreviewArray,
                  ]
                    .sort(
                      (a: any, b: any) =>
                        Number(a.ordem || 0) - Number(b.ordem || 0),
                    )
                    .map((c) => {
                      if (c.tipo === "IMAGEM") {
                        const selecionadoImagem =
                          camposSelecionadosIds.includes(c.id);

                        return (
                          <div
                            key={c.id}
                            onMouseDown={(event) => {
                              event.stopPropagation();

                              if (event.button === 2) return;

                              if (
                                event.shiftKey ||
                                event.ctrlKey ||
                                event.metaKey
                              ) {
                                setCamposSelecionadosIds((prev) =>
                                  prev.includes(c.id)
                                    ? prev.filter((id) => id !== c.id)
                                    : [...prev, c.id],
                                );

                                setCampoSelecionadoId(c.id);
                                return;
                              }

                              setCampoSelecionadoId(c.id);
                              setCamposSelecionadosIds([c.id]);
                              iniciarDrag(event as any, c);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setCampoSelecionadoId(c.id);

                              if (!camposSelecionadosIds.includes(c.id)) {
                                setCamposSelecionadosIds([c.id]);
                              }
                              setMenuContexto({
                                x: e.clientX,
                                y: e.clientY,
                                campoId: c.id,
                              });
                            }}
                            className="absolute z-20 select-none"
                            style={{
                              left: `${c.x}px`,
                              top: `${c.y}px`,
                              width: `${c.largura || 150}px`,
                              height: `${c.altura || 150}px`,
                              cursor: "move",
                              zIndex:
                                campoSelecionadoId === c.id
                                  ? 99999
                                  : c.ordem || 10,
                              pointerEvents: c.bloqueado ? "none" : "auto",
                              transform: `rotate(${(c as any).rotate || 0}deg)`,
                              border: selecionadoImagem
                                ? "2px solid #2563eb"
                                : "1px dashed #93c5fd",

                              borderRadius: "10px",
                              background: "transparent",
                              boxShadow: (() => {
                                const sombraBase = (() => {
                                  if (!c.sombraAtiva) return "";

                                  const { x, y } = calcularSombra(
                                    (c as any).sombraAngulo ?? 45,
                                    (c as any).sombraDistancia ?? 20,
                                  );

                                  return `${x}px ${y}px ${c.sombraBlur || 20}px ${hexToRgba(
                                    c.sombraCor || "#000000",
                                    (c.sombraOpacidade ?? 40) / 100,
                                  )}`;
                                })();

                                const glowSelecao = selecionadoImagem
                                  ? "0 0 0 3px rgba(37, 99, 235, 0.25)"
                                  : "";

                                return (
                                  [glowSelecao, sombraBase]
                                    .filter(Boolean)
                                    .join(", ") || "none"
                                );
                              })(),
                            }}
                          >
                            <div
                              className="relative h-full w-full overflow-hidden rounded-[8px]"
                              style={{
                                backgroundImage: `url(${(c as any).imagemUrl})`,
                                backgroundRepeat: "no-repeat",
                                backgroundSize: `${(c as any).cropBaseW || c.largura || 150}px ${(c as any).cropBaseH || c.altura || 150
                                  }px`,
                                backgroundPosition: `-${c.crop?.left || 0}px -${c.crop?.top || 0}px`,
                                opacity: c.opacity || 1,
                                filter: (c as any).filter || "none",
                                transform: `
      scaleX(${(c as any).flipX ? -1 : 1})
      scaleY(${(c as any).flipY ? -1 : 1})
    `,
                              }}
                            />

                            {selecionadoImagem && (
                              <>
                                <button
                                  type="button"
                                  onMouseDown={(e) => iniciarRotacao(e, c)}
                                  className="absolute left-1/2 top-[-36px] flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-blue-600 text-xs text-white shadow"
                                  title={tr("common.rotateFreely")}
                                >
                                  ↻
                                </button>

                                {/* CORTAR 4 LADOS JUNTOS */}
                                <div
                                  onMouseDown={(e) => iniciarCropTodos(e, c)}
                                  className="absolute left-[-12px] top-[-12px] z-[9999] flex h-7 w-7 cursor-nwse-resize items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 active:scale-95 text-sm font-bold text-white shadow-lg transition"
                                  title={tr("image.cropAllTogether")}
                                >
                                  ┍
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    excluirCampo((c as any).bancoId || c.id);
                                  }}
                                  className="absolute right-1 top-1 z-[9999] flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white shadow hover:bg-red-700"
                                  title={tr("image.deleteImage")}
                                >
                                  ✕
                                </button>

                                <div
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    iniciarCrop(e, c, "top");
                                  }}
                                  className="absolute left-1/2 top-[-6px] z-[9999] h-3 w-12 -translate-x-1/2 cursor-ns-resize rounded bg-blue-500/60"
                                />

                                <div
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    iniciarCrop(e, c, "bottom");
                                  }}
                                  className="absolute bottom-[-6px] left-1/2 z-[9999] h-3 w-12 -translate-x-1/2 cursor-ns-resize rounded bg-blue-500/60"
                                />

                                <div
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    iniciarCrop(e, c, "left");
                                  }}
                                  className="absolute left-[-6px] top-1/2 z-[9999] h-12 w-3 -translate-y-1/2 cursor-ew-resize rounded bg-blue-500/60"
                                />

                                <div
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    iniciarCrop(e, c, "right");
                                  }}
                                  className="absolute right-[-6px] top-1/2 z-[9999] h-12 w-3 -translate-y-1/2 cursor-ew-resize rounded bg-blue-500/60"
                                />

                                <div
                                  onMouseDown={(e) => {
                                    e.stopPropagation();

                                    registrarHistoricoAntesDaAcao();

                                    const startX = e.clientX;
                                    const startY = e.clientY;
                                    const startW = c.largura || 150;
                                    const startH = c.altura || 150;

                                    const move = (
                                      ev: globalThis.MouseEvent,
                                    ) => {
                                      const novoW = Math.max(
                                        40,
                                        startW + ev.clientX - startX,
                                      );
                                      const proporcao = startW / startH;

                                      const novoH = ev.shiftKey
                                        ? Math.max(40, novoW / proporcao)
                                        : Math.max(
                                          40,
                                          startH + ev.clientY - startY,
                                        );

                                      setCampos((prev) =>
                                        prev.map((item) =>
                                          item.id === c.id
                                            ? {
                                              ...item,
                                              largura: novoW,
                                              altura: novoH,
                                              crop: item.crop || {
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                              },
                                              cropBaseW:
                                                novoW +
                                                (item.crop?.left || 0) +
                                                (item.crop?.right || 0),
                                              cropBaseH:
                                                novoH +
                                                (item.crop?.top || 0) +
                                                (item.crop?.bottom || 0),
                                            }
                                            : item,
                                        ),
                                      );
                                    };

                                    const up = () => {
                                      window.removeEventListener(
                                        "mousemove",
                                        move,
                                      );
                                      window.removeEventListener("mouseup", up);
                                    };

                                    window.addEventListener("mousemove", move);
                                    window.addEventListener("mouseup", up);
                                  }}
                                  className="absolute bottom-[-12px] right-[-12px] z-[999999] h-6 w-6 cursor-se-resize rounded-full border-2 border-white bg-blue-600 shadow-lg"
                                  title={tr("common.resizeTogether")}
                                />
                              </>
                            )}
                          </div>
                        );
                      }

                      if (c.tipo === "FORMA") {
                        const selecionado = camposSelecionadosIds.includes(
                          c.id,
                        );
                        const formaEstaAgrupada = Boolean((c as any).grupoId);
                        const podeEditarFormaIndividual =
                          selecionado && !formaEstaAgrupada;
                        return (
                          <div
                            key={c.id}
                            data-campo-certificado-id={c.id}
                            onMouseDown={(event) =>
                              selecionarCampoNoCanvas(event, c)
                            }
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              const idsDoAlvo = idsDoCampoOuGrupo(c);
                              const clicouEmItemJaSelecionado =
                                camposSelecionadosIds.includes(c.id);

                              setCampoSelecionadoId(c.id);
                              setPontoFormaSelecionado(null);
                              setShapeInspectorAberto(false);

                              if (!clicouEmItemJaSelecionado) {
                                setCamposSelecionadosIds(idsDoAlvo);
                              }

                              setMenuContexto({
                                x: e.clientX,
                                y: e.clientY,
                                campoId: c.id,
                              });
                            }}
                            className={`absolute z-20 select-none overflow-visible ${(c as any).arrayPreview
                              ? "pointer-events-none opacity-60"
                              : ""
                              }`}
                            style={{
                              left: `${c.x}px`,
                              top: `${c.y}px`,
                              width: `${c.largura || 100}px`,
                              height: `${c.altura || 80}px`,
                              cursor: "move",
                              overflow: "visible",
                              zIndex: (c as any).arrayPreview
                                ? 1
                                : c.ordem || 5,
                              pointerEvents: c.bloqueado ? "none" : "auto",
                              transform: `
  rotate(${(c as any).rotate || 0}deg)
  scaleX(${(c as any).flipX ? -1 : 1})
  scaleY(${(c as any).flipY ? -1 : 1})
`,

                              boxShadow: (() => {
                                if (!c.sombraAtiva) return "none";

                                const { x, y } = calcularSombra(
                                  (c as any).sombraAngulo ?? 45,
                                  (c as any).sombraDistancia ?? 20,
                                );

                                return `${x}px ${y}px ${c.sombraBlur || 20}px ${hexToRgba(
                                  c.sombraCor || "#000000",
                                  (c.sombraOpacidade ?? 40) / 100,
                                )}`;
                              })(),
                            }}
                          >
                            <div
                              className="relative h-full w-full overflow-visible"
                              onDoubleClick={(e) => {
                                if (!(c as any).usarGradiente) return;

                                e.stopPropagation();
                                e.preventDefault();

                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                const posicao = Math.round(
                                  Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      ((e.clientX - rect.left) / rect.width) *
                                      100,
                                    ),
                                  ),
                                );

                                const stops = [
                                  ...(((c as any).degradeStops || [
                                    { cor: c.cor || "#1d4ed8", posicao: 0 },
                                    {
                                      cor: (c as any).cor2 || "#60a5fa",
                                      posicao: 100,
                                    },
                                  ]) as any[]),
                                  { cor: "#ffffff", posicao },
                                ].sort((a, b) => a.posicao - b.posicao);

                                atualizarCampoLocal(
                                  "degradeStops" as any,
                                  stops,
                                );
                              }}
                              title={
                                (c as any).usarGradiente
                                  ? tr("gradient.doubleClickAddStop")
                                  : undefined
                              }
                              style={{
                                background:
                                  c.pontosForma && c.pontosForma.length > 0
                                    ? "transparent"
                                    : c.forma === "LINHA"
                                      ? "transparent"
                                      : (c as any).usarGradiente
                                        ? (c as any).degradeTipo === "radial"
                                          ? `radial-gradient(circle, ${(
                                            (c as any).degradeStops || [
                                              {
                                                cor: c.cor || "#1d4ed8",
                                                posicao: 0,
                                              },
                                              {
                                                cor:
                                                  (c as any).cor2 ||
                                                  "#60a5fa",
                                                posicao: 100,
                                              },
                                            ]
                                          )
                                            .map(
                                              (stop: any) =>
                                                `${stop.cor} ${stop.posicao}%`,
                                            )
                                            .join(", ")})`
                                          : `linear-gradient(${(c as any).degradeAngulo ?? 90}deg, ${(
                                            (c as any).degradeStops || [
                                              {
                                                cor: c.cor || "#1d4ed8",
                                                posicao: 0,
                                              },
                                              {
                                                cor:
                                                  (c as any).cor2 ||
                                                  "#60a5fa",
                                                posicao: 100,
                                              },
                                            ]
                                          )
                                            .map(
                                              (stop: any) =>
                                                `${hexToRgba(stop.cor, c.opacity || 1)} ${stop.posicao}%`,
                                            )
                                            .join(", ")})`
                                        : hexToRgba(
                                          c.cor || "#1d4ed8",
                                          c.opacity || 1,
                                        ),

                                border:
                                  c.pontosForma && c.pontosForma.length > 0
                                    ? "none"
                                    : c.forma === "LINHA"
                                      ? `3px solid ${c.cor || "#1d4ed8"}`
                                      : selecionado
                                        ? "2px solid #2563eb"
                                        : "1px dashed #93c5fd",

                                borderRadius:
                                  c.forma === "CIRCULO"
                                    ? "9999px"
                                    : `${(c as any).raioBorda ?? 8}px`,
                                clipPath:
                                  c.pontosForma && c.pontosForma.length > 0
                                    ? "none"
                                    : c.forma === "ESTRELA"
                                      ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
                                      : c.forma === "TRIANGULO"
                                        ? "polygon(50% 0%, 100% 100%, 0% 100%)"
                                        : "none",
                                overflow:
                                  c.pontosForma && c.pontosForma.length > 0
                                    ? "visible"
                                    : "hidden",
                              }}
                            >
                              {c.tipo === "FORMA" &&
                                c.pontosForma &&
                                c.pontosForma.length > 0 && (
                                  <div data-campo-certificado-id={c.id}>
                                    <FormaVetorial
                                      campo={c as any}
                                      selecionado={
                                        selecionado && !formaEstaAgrupada
                                      }
                                      modo="editor"
                                      mostrarHandles={
                                        mostrarHandlesForma &&
                                        !formaEstaAgrupada
                                      }
                                      pontoSelecionadoId={
                                        pontoFormaSelecionado?.campoId === c.id
                                          ? pontoFormaSelecionado.pontoId
                                          : null
                                      }
                                      onSelecionarPonto={(pontoId) => {
                                        setCampoSelecionadoId(c.id);
                                        setCamposSelecionadosIds(
                                          idsDoCampoOuGrupo(c),
                                        );

                                        if (formaEstaAgrupada) {
                                          setPontoFormaSelecionado(null);
                                          return;
                                        }

                                        setPontoFormaSelecionado(
                                          pontoId
                                            ? {
                                              campoId: c.id,
                                              pontoId,
                                            }
                                            : null,
                                        );
                                      }}
                                      onChange={(campoAtualizado) => {
                                        if (formaEstaAgrupada) return;

                                        setCampos((prev) =>
                                          prev.map((item) =>
                                            item.id === c.id
                                              ? ({
                                                ...item,
                                                ...campoAtualizado,
                                              } as any)
                                              : item,
                                          ),
                                        );
                                      }}
                                    />
                                  </div>
                                )}

                              {selecionado && (c as any).usarGradiente && (
                                <div className="pointer-events-none absolute inset-0 z-[9998]">
                                  {(
                                    ((c as any).degradeStops || [
                                      { cor: c.cor || "#1d4ed8", posicao: 0 },
                                      {
                                        cor: (c as any).cor2 || "#60a5fa",
                                        posicao: 100,
                                      },
                                    ]) as any[]
                                  ).map((stop, index) => (
                                    <button
                                      key={index}
                                      type="button"

                                      onClick={(e) => {
                                        e.stopPropagation();

                                        const cor = stop.cor || "#ffffff";
                                        const { r, g, b } = hexToRgb(cor);

                                        setCorAtual({
                                          hex: cor,
                                          r,
                                          g,
                                          b,
                                        });

                                        setEditorCorGradiente({
                                          campoId: c.id,
                                          pontoIndex: index,
                                          cor,
                                        });

                                        setMenuPontoGradiente({
                                          campoId: c.id,
                                          pontoIndex: index,
                                          x: e.clientX,
                                          y: e.clientY,
                                        });
                                      }}

                                      className="pointer-events-auto absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-700 shadow-[0_0_0_3px_white] cursor-pointer"
                                      style={{
                                        left: `${stop.posicao}%`,
                                        background: stop.cor,
                                      }}
                                      title={tr("shapeTools.pointNumber", { number: index + 1 })}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();

                                        const rect =
                                          e.currentTarget.parentElement?.getBoundingClientRect();
                                        if (!rect) return;

                                        const move = (
                                          ev: globalThis.MouseEvent,
                                        ) => {
                                          const posicao = Math.max(
                                            0,
                                            Math.min(
                                              100,
                                              ((ev.clientX - rect.left) /
                                                rect.width) *
                                              100,
                                            ),
                                          );

                                          setCampos((prev) =>
                                            prev.map((item) => {
                                              if (item.id !== c.id) return item;

                                              const stops = [
                                                ...(((item as any)
                                                  .degradeStops || [
                                                    {
                                                      cor: item.cor || "#1d4ed8",
                                                      posicao: 0,
                                                    },
                                                    {
                                                      cor:
                                                        (item as any).cor2 ||
                                                        "#60a5fa",
                                                      posicao: 100,
                                                    },
                                                  ]) as any[]),
                                              ];

                                              stops[index] = {
                                                ...stops[index],
                                                posicao: Math.round(posicao),
                                              };

                                              return {
                                                ...item,
                                                degradeStops: stops.sort(
                                                  (a, b) =>
                                                    a.posicao - b.posicao,
                                                ),
                                              } as any;
                                            }),
                                          );
                                        };

                                        const up = () => {
                                          window.removeEventListener(
                                            "mousemove",
                                            move,
                                          );
                                          window.removeEventListener(
                                            "mouseup",
                                            up,
                                          );
                                        };

                                        window.addEventListener(
                                          "mousemove",
                                          move,
                                        );
                                        window.addEventListener("mouseup", up);
                                      }}
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();

                                        const cor = stop.cor || "#ffffff";
                                        const { r, g, b } = hexToRgb(cor);

                                        setCorAtual({
                                          hex: cor,
                                          r,
                                          g,
                                          b,
                                        });

                                        setEditorCorGradiente({
                                          campoId: c.id,
                                          pontoIndex: index,
                                          cor,
                                        });
                                      }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            {selecionado &&
                              !caixaDoGrupoSelecionado &&
                              !formaEstaAgrupada && (
                                <>
                                  {/* girar */}
                                  <button
                                    type="button"
                                    onMouseDown={(e) => iniciarRotacao(e, c)}
                                    className="absolute left-1/2 top-[-34px] h-7 w-7 -translate-x-1/2 rounded-full bg-blue-600 text-xs text-white shadow"
                                    title={tr("common.dragToRotate")}
                                  >
                                    ↻
                                  </button>

                                  {/* CENTRAL (CROP PRO) */}
                                  <div
                                    onMouseDown={(e) => iniciarCropPro(e, c)}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                  >
                                    <div className="w-6 h-6 bg-purple-500 rounded-full cursor-move pointer-events-auto shadow-lg" />
                                  </div>

                                  {/* canto inferior direito */}
                                  <div
                                    onMouseDown={(e) => {
                                      e.stopPropagation();

                                      const startX = e.clientX;
                                      const startY = e.clientY;
                                      const startW = c.largura || 100;
                                      const startH = c.altura || 80;

                                      const proporcao = startW / startH;

                                      const move = (
                                        ev: globalThis.MouseEvent,
                                      ) => {
                                        setCampos((prev) =>
                                          prev.map((item) =>
                                            item.id === c.id
                                              ? {
                                                ...item,
                                                largura: ev.shiftKey
                                                  ? Math.max(
                                                    20,
                                                    startW +
                                                    ev.clientX -
                                                    startX,
                                                  )
                                                  : Math.max(
                                                    20,
                                                    startW +
                                                    ev.clientX -
                                                    startX,
                                                  ),

                                                altura: ev.shiftKey
                                                  ? Math.max(
                                                    4,
                                                    (startW +
                                                      ev.clientX -
                                                      startX) /
                                                    proporcao,
                                                  )
                                                  : Math.max(
                                                    4,
                                                    startH +
                                                    ev.clientY -
                                                    startY,
                                                  ),
                                              }
                                              : item,
                                          ),
                                        );
                                      };

                                      const up = () => {
                                        window.removeEventListener(
                                          "mousemove",
                                          move,
                                        );
                                        window.removeEventListener(
                                          "mouseup",
                                          up,
                                        );
                                      };

                                      window.addEventListener(
                                        "mousemove",
                                        move,
                                      );
                                      window.addEventListener("mouseup", up);
                                    }}
                                    className="absolute bottom-[-10px] right-[-10px] z-[999999] h-6 w-6 cursor-se-resize rounded-full border-2 border-white bg-blue-600 shadow-lg"
                                    title={tr("common.resize")}
                                  />

                                  {/* direita */}
                                  <div
                                    onMouseDown={(e) => {
                                      e.stopPropagation();

                                      const startX = e.clientX;
                                      const startW = c.largura || 100;

                                      const move = (
                                        ev: globalThis.MouseEvent,
                                      ) => {
                                        setCampos((prev) =>
                                          prev.map((item) =>
                                            item.id === c.id
                                              ? {
                                                ...item,
                                                largura: Math.max(
                                                  20,
                                                  startW +
                                                  ev.clientX -
                                                  startX,
                                                ),
                                              }
                                              : item,
                                          ),
                                        );
                                      };

                                      const up = () => {
                                        window.removeEventListener(
                                          "mousemove",
                                          move,
                                        );
                                        window.removeEventListener(
                                          "mouseup",
                                          up,
                                        );
                                      };

                                      window.addEventListener(
                                        "mousemove",
                                        move,
                                      );
                                      window.addEventListener("mouseup", up);
                                    }}
                                    className="absolute right-[-6px] top-1/2 h-4 w-4 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-blue-600 shadow"
                                    title={tr("common.adjustWidth")}
                                  />

                                  {/* baixo */}
                                  <div
                                    onMouseDown={(e) => {
                                      e.stopPropagation();

                                      const startY = e.clientY;
                                      const startH = c.altura || 80;

                                      const move = (
                                        ev: globalThis.MouseEvent,
                                      ) => {
                                        setCampos((prev) =>
                                          prev.map((item) =>
                                            item.id === c.id
                                              ? {
                                                ...item,
                                                altura: Math.max(
                                                  4,
                                                  startH +
                                                  ev.clientY -
                                                  startY,
                                                ),
                                              }
                                              : item,
                                          ),
                                        );
                                      };

                                      const up = () => {
                                        window.removeEventListener(
                                          "mousemove",
                                          move,
                                        );
                                        window.removeEventListener(
                                          "mouseup",
                                          up,
                                        );
                                      };

                                      window.addEventListener(
                                        "mousemove",
                                        move,
                                      );
                                      window.addEventListener("mouseup", up);
                                    }}
                                    className="absolute bottom-[-6px] left-1/2 h-4 w-4 -translate-x-1/2 cursor-ns-resize rounded-full border-2 border-white bg-blue-600 shadow"
                                    title={tr("common.adjustHeight")}
                                  />
                                  <div
                                    onMouseDown={(e) => iniciarCropTodos(e, c)}
                                    className="absolute left-[-10px] top-[-10px] z-[9999] flex h-6 w-6 cursor-nwse-resize items-center justify-center rounded-md bg-purple-600 text-xs font-bold text-white shadow"
                                    title={tr("image.cropAllSides")}
                                  >
                                    ┍
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      excluirCampo((c as any).bancoId || c.id);
                                    }}
                                    className="absolute right-[-10px] top-[-10px] z-[9999] flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white shadow hover:bg-red-700"
                                    title={tr("common.delete")}
                                  >
                                    ✕
                                  </button>

                                  {selecionado &&
                                    !caixaDoGrupoSelecionado &&
                                    !formaEstaAgrupada && (
                                      <button
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();

                                          const startX = e.clientX;
                                          const startY = e.clientY;
                                          const startW = c.largura || 120;
                                          const startH = c.altura || 120;
                                          const proporcao = startW / startH;

                                          const move = (
                                            ev: globalThis.MouseEvent,
                                          ) => {
                                            const deltaX = ev.clientX - startX;
                                            const deltaY = ev.clientY - startY;

                                            let novaLargura = Math.max(
                                              20,
                                              startW + deltaX,
                                            );
                                            let novaAltura = Math.max(
                                              20,
                                              startH + deltaY,
                                            );

                                            if (ev.shiftKey) {
                                              novaAltura = Math.max(
                                                20,
                                                novaLargura / proporcao,
                                              );
                                            }

                                            setCampos((prev) =>
                                              prev.map((item) =>
                                                item.id === c.id
                                                  ? {
                                                    ...item,
                                                    largura:
                                                      Math.round(novaLargura),
                                                    altura:
                                                      Math.round(novaAltura),
                                                  }
                                                  : item,
                                              ),
                                            );
                                          };

                                          const up = () => {
                                            window.removeEventListener(
                                              "mousemove",
                                              move,
                                            );
                                            window.removeEventListener(
                                              "mouseup",
                                              up,
                                            );
                                          };

                                          window.addEventListener(
                                            "mousemove",
                                            move,
                                          );
                                          window.addEventListener(
                                            "mouseup",
                                            up,
                                          );
                                        }}
                                        className="absolute -bottom-3 -right-3 z-[999999] h-6 w-6 cursor-se-resize rounded-full border-2 border-white bg-blue-600 shadow-lg"
                                        title={tr("shapeTools.resizeWholeShape")}
                                      />
                                    )}

                                  {c.forma === "LINHA" && (
                                    <>
                                      {/* PONTO INÍCIO */}
                                      <div
                                        onMouseDown={(e) => {
                                          e.stopPropagation();

                                          const startX = e.clientX;
                                          const startY = e.clientY;
                                          const startLeft = c.x;
                                          const startTop = c.y;
                                          const startW = c.largura || 100;
                                          const startH = c.altura || 2;

                                          const move = (
                                            ev: globalThis.MouseEvent,
                                          ) => {
                                            setCampos((prev) =>
                                              prev.map((item) =>
                                                item.id === c.id
                                                  ? {
                                                    ...item,
                                                    x:
                                                      startLeft +
                                                      (ev.clientX - startX),
                                                    y:
                                                      startTop +
                                                      (ev.clientY - startY),
                                                    largura:
                                                      startW -
                                                      (ev.clientX - startX),
                                                    altura:
                                                      startH -
                                                      (ev.clientY - startY),
                                                  }
                                                  : item,
                                              ),
                                            );
                                          };

                                          const up = () => {
                                            window.removeEventListener(
                                              "mousemove",
                                              move,
                                            );
                                            window.removeEventListener(
                                              "mouseup",
                                              up,
                                            );
                                          };

                                          window.addEventListener(
                                            "mousemove",
                                            move,
                                          );
                                          window.addEventListener(
                                            "mouseup",
                                            up,
                                          );
                                        }}
                                        className="absolute left-[-6px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white border border-blue-600 cursor-pointer"
                                      />

                                      {/* PONTO FINAL */}
                                      <div
                                        onMouseDown={(e) => {
                                          e.stopPropagation();

                                          const startX = e.clientX;
                                          const startY = e.clientY;
                                          const startW = c.largura || 100;
                                          const startH = c.altura || 2;

                                          const move = (
                                            ev: globalThis.MouseEvent,
                                          ) => {
                                            setCampos((prev) =>
                                              prev.map((item) =>
                                                item.id === c.id
                                                  ? {
                                                    ...item,
                                                    largura: Math.max(
                                                      2,
                                                      startW +
                                                      (ev.clientX - startX),
                                                    ),
                                                    altura: Math.max(
                                                      2,
                                                      startH +
                                                      (ev.clientY - startY),
                                                    ),
                                                  }
                                                  : item,
                                              ),
                                            );
                                          };

                                          const up = () => {
                                            window.removeEventListener(
                                              "mousemove",
                                              move,
                                            );
                                            window.removeEventListener(
                                              "mouseup",
                                              up,
                                            );
                                          };

                                          window.addEventListener(
                                            "mousemove",
                                            move,
                                          );
                                          window.addEventListener(
                                            "mouseup",
                                            up,
                                          );
                                        }}
                                        className="absolute right-[-6px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white border border-blue-600 cursor-pointer"
                                      />
                                    </>
                                  )}
                                </>
                              )}
                          </div>
                        );
                      }

                      if (c.tipo === "TEXTO_LIVRE") {
                        const selecionadoTexto = camposSelecionadosIds.includes(
                          c.id,
                        );

                        return (
                          <div
                            key={c.id}
                            onMouseDown={(event) => {
                              event.stopPropagation();

                              if (event.button === 2) return;

                              setCampoSelecionadoId(c.id);
                              setCamposSelecionadosIds([c.id]);

                              const alvo = event.target as HTMLElement;

                              if (
                                alvo.isContentEditable ||
                                alvo.closest("[data-texto-livre-id]")
                              ) {
                                return;
                              }

                              iniciarDrag(event as any, c);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setCampoSelecionadoId(c.id);

                              if (!camposSelecionadosIds.includes(c.id)) {
                                setCamposSelecionadosIds([c.id]);
                              }

                              setMenuContexto({
                                x: e.clientX,
                                y: e.clientY,
                                campoId: c.id,
                              });
                            }}
                            className="absolute z-20"
                            style={{
                              left: `${c.x}px`,
                              top: `${c.y}px`,
                              width: `${c.largura || 320}px`,
                              height: `${c.altura || 120}px`,
                              zIndex:
                                campoSelecionadoId === c.id
                                  ? 99999
                                  : c.ordem || 20,
                              pointerEvents: c.bloqueado ? "none" : "auto",
                            }}
                          >
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              data-texto-livre-id={c.id}
                              data-texto-conteudo="true"
                              dir="ltr"
                              ref={(el) => {
                                if (!el) return;

                                const valor =
                                  (c as any).textoHtml ||
                                  (c as any).texto ||
                                  tr("text.placeholderText");

                                if (document.activeElement === el) return;

                                if (el.innerHTML !== valor) {
                                  el.innerHTML = valor;
                                }
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();

                                setCampoSelecionadoId(c.id);
                                setCamposSelecionadosIds([c.id]);

                                const alvo = e.target as HTMLElement;

                                if (!alvo.closest("[data-texto-conteudo]")) {
                                  e.preventDefault();
                                  iniciarDrag(e as any, c);
                                }
                              }}

                              onPaste={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                const editor = e.currentTarget;
                                const texto =
                                  e.clipboardData.getData("text/plain");

                                if (!texto.trim()) return;
                                const textoAtual = editor.innerText.trim();

                                const ehTextoPadrao =
                                  ehTextoPlaceholderPadrao(textoAtual);

                                salvarHistoricoTextoLivre(editor);

                                if (ehTextoPadrao) {
                                  editor.textContent = texto;
                                } else {
                                  const selecao = window.getSelection();

                                  if (
                                    selecao &&
                                    selecao.rangeCount > 0 &&
                                    editor.contains(
                                      selecao.getRangeAt(0)
                                        .commonAncestorContainer,
                                    )
                                  ) {
                                    const range = selecao.getRangeAt(0);

                                    range.deleteContents();

                                    const node = document.createTextNode(texto);
                                    range.insertNode(node);

                                    range.setStartAfter(node);
                                    range.setEndAfter(node);

                                    selecao.removeAllRanges();
                                    selecao.addRange(range);
                                  } else {
                                    editor.textContent = texto;
                                  }
                                }

                                atualizarTextoLivreNoEstado(editor);

                                setTimeout(() => {
                                  salvarHistoricoTextoLivre(editor);
                                }, 0);
                              }}

                              onKeyDown={(e) => {
                                e.stopPropagation();

                                if (
                                  (e.ctrlKey || e.metaKey) &&
                                  e.key.toLowerCase() === "v"
                                ) {
                                  const editor = e.currentTarget;
                                  const textoAtual = editor.innerText.trim();

                                  const ehTextoPadrao =
                                    textoAtual === tr("text.placeholderText") ||
                                    textoAtual === tr("text.placeholderTitle");

                                  if (ehTextoPadrao) {
                                    e.preventDefault();

                                    navigator.clipboard
                                      .readText()
                                      .then((texto) => {
                                        if (!texto.trim()) return;

                                        salvarHistoricoTextoLivre(editor);

                                        editor.textContent = texto;
                                        atualizarTextoLivreNoEstado(editor);

                                        setTimeout(() => {
                                          salvarHistoricoTextoLivre(editor);
                                        }, 0);
                                      });

                                    return;
                                  }
                                }

                                if (
                                  (e.ctrlKey || e.metaKey) &&
                                  e.key.toLowerCase() === "z"
                                ) {
                                  if (desfazerTextoLivre(e.currentTarget)) {
                                    e.preventDefault();
                                    return;
                                  }
                                }

                                const editor = e.currentTarget;
                                const marcador = editor.getAttribute(
                                  "data-marcador-ativo",
                                );

                                if (!marcador) return;

                                const textoAntes =
                                  obterTextoAntesDoCursor(editor);
                                const linhaAtual =
                                  textoAntes.split("\n").pop() || "";

                                if (e.key === "Enter") {
                                  e.preventDefault();

                                  if (linhaAtual.trim() === marcador) {
                                    editor.removeAttribute(
                                      "data-marcador-ativo",
                                    );
                                    inserirTextoNoCursor(editor, "\n");
                                  } else {
                                    inserirTextoNoCursor(
                                      editor,
                                      `\n${marcador} `,
                                    );
                                  }

                                  atualizarTextoLivreNoEstado(editor);
                                  return;
                                }

                                if (
                                  e.key === "Backspace" &&
                                  linhaAtual === `${marcador} `
                                ) {
                                  editor.removeAttribute("data-marcador-ativo");
                                  return;
                                }

                                if (
                                  e.key === " " &&
                                  linhaAtual === `${marcador} `
                                ) {
                                  e.preventDefault();
                                  editor.removeAttribute("data-marcador-ativo");
                                  inserirTextoNoCursor(editor, "\n");
                                  atualizarTextoLivreNoEstado(editor);
                                }
                              }}

                              onInput={(e) => {
                                const editor = e.currentTarget;

                                salvarHistoricoTextoLivre(editor);

                                const texto = editor.innerText;
                                const textoHtml = editor.innerHTML;

                                setCampos((prev) =>
                                  prev.map((item) =>
                                    item.id === c.id
                                      ? {
                                        ...item,
                                        texto,
                                        textoHtml,
                                      }
                                      : item,
                                  ),
                                );
                              }}
                              onBlur={(e) => {
                                const texto = e.currentTarget.innerText;
                                const textoHtml = e.currentTarget.innerHTML;

                                setCampos((prev) =>
                                  prev.map((item) =>
                                    item.id === c.id
                                      ? { ...item, texto, textoHtml }
                                      : item,
                                  ),
                                );
                              }}
                              onBeforeInput={(e) => {
                                if (
                                  (e.nativeEvent as InputEvent).inputType ===
                                  "insertFromPaste"
                                ) {
                                  return;
                                }

                                salvarHistoricoTextoLivre(e.currentTarget);
                              }}
                              onMouseUp={() => {
                                const selecao = window.getSelection();

                                if (
                                  selecao &&
                                  selecao.rangeCount > 0 &&
                                  selecao.toString().trim()
                                ) {
                                  const range = selecao
                                    .getRangeAt(0)
                                    .cloneRange();
                                  selecaoTextoRef.current = range;

                                  const elemento =
                                    selecao.anchorNode?.parentElement;
                                  const cor = elemento
                                    ? window.getComputedStyle(elemento).color
                                    : "";
                                  const corHex = cssColorToHex(cor);

                                  setCorTextoSelecionado(corHex || null);
                                }
                              }}
                              onKeyUp={() => {
                                const selecao = window.getSelection();

                                if (
                                  selecao &&
                                  selecao.rangeCount > 0 &&
                                  selecao.toString().trim()
                                ) {
                                  selecaoTextoRef.current = selecao
                                    .getRangeAt(0)
                                    .cloneRange();
                                }
                              }}
                              className={`h-full w-full overflow-hidden rounded-md px-2 py-1 outline-none ${selecionadoTexto
                                ? "border-2 border-blue-600 bg-blue-50/10"
                                : "border border-blue-400/60 bg-transparent"
                                }`}
                              style={{
                                fontFamily: c.fonte || "Arial",
                                fontSize: `${c.tamanho || 18}px`,
                                color: c.cor || "#1e3a8a",
                                fontWeight: c.negrito ? "bold" : "normal",
                                fontStyle: c.italico ? "italic" : "normal",
                                textDecoration: c.sublinhado
                                  ? "underline"
                                  : "none",
                                textAlign:
                                  (c.alinhamento as
                                    "left" | "center" | "right") || "left",
                                lineHeight: c.lineHeight || 1.3,
                                letterSpacing: (c as any).letterSpacing ?? 0,
                                wordSpacing: (c as any).wordSpacing ?? 0,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                cursor: "text",
                                direction: "ltr",
                                unicodeBidi: "isolate",
                                writingMode: "horizontal-tb",
                                caretColor: c.cor || "#1e3a8a",
                              }}
                            ></div>

                            {selecionadoTexto && (
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  excluirCampo(c.id);
                                }}
                                className="absolute -top-3 -right-3 z-[999999] flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs font-black text-white shadow-lg hover:bg-red-700"
                                title={tr("text.deleteTextField")}
                              >
                                ×
                              </button>
                            )}

                            {selecionadoTexto && (
                              <div
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  iniciarDrag(e as any, c);
                                }}
                                className="absolute -top-3 left-1/2 z-[999999] -translate-x-1/2 cursor-move rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black text-white shadow-lg"
                                title={tr("text.dragTextBox")}
                              >
                                {tr("common.move")}
                              </div>
                            )}

                            {selecionadoTexto && (
                              <div
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();

                                  const startX = e.clientX;
                                  const startY = e.clientY;
                                  const larguraInicial = c.largura || 320;
                                  const alturaInicial = c.altura || 120;

                                  const move = (ev: globalThis.MouseEvent) => {
                                    setCampos((prev) =>
                                      prev.map((item) =>
                                        item.id === c.id
                                          ? {
                                            ...item,
                                            largura: Math.max(
                                              80,
                                              Math.round(
                                                larguraInicial +
                                                (ev.clientX - startX) /
                                                escala,
                                              ),
                                            ),
                                            altura: Math.max(
                                              40,
                                              Math.round(
                                                alturaInicial +
                                                (ev.clientY - startY) /
                                                escala,
                                              ),
                                            ),
                                          }
                                          : item,
                                      ),
                                    );
                                  };

                                  const up = () => {
                                    window.removeEventListener(
                                      "mousemove",
                                      move,
                                    );
                                    window.removeEventListener("mouseup", up);
                                  };

                                  window.addEventListener("mousemove", move);
                                  window.addEventListener("mouseup", up);
                                }}
                                className="absolute -bottom-3 -right-3 z-[999999] h-6 w-6 cursor-se-resize rounded-full border-2 border-white bg-blue-600 shadow-lg"
                                title={tr("text.resizeTextBox")}
                              />
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={c.id}
                          onMouseDown={(event) => {
                            event.stopPropagation();

                            if (event.button === 2) return;

                            if (
                              event.shiftKey ||
                              event.ctrlKey ||
                              event.metaKey
                            ) {
                              setCamposSelecionadosIds((prev) =>
                                prev.includes(c.id)
                                  ? prev.filter((id) => id !== c.id)
                                  : [...prev, c.id],
                              );

                              setCampoSelecionadoId(c.id);
                              return;
                            }

                            setCampoSelecionadoId(c.id);
                            setCamposSelecionadosIds([c.id]);
                            iniciarDrag(event as any, c);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setCampoSelecionadoId(c.id);

                            if (!camposSelecionadosIds.includes(c.id)) {
                              setCamposSelecionadosIds([c.id]);
                            }

                            setMenuContexto({
                              x: e.clientX,
                              y: e.clientY,
                              campoId: c.id,
                            });
                          }}
                          className={`absolute z-20 select-none rounded-md border px-1 py-0 text-[10px] ${camposSelecionadosIds.includes(c.id)
                            ? c.tipo === "ASSINATURA" ||
                              c.tipo === "LOGO_INSTITUICAO"
                              ? "border-blue-600 bg-transparent text-blue-900"
                              : "border-blue-600 bg-blue-600/90 text-white"
                            : "border-blue-300 bg-transparent text-blue-900"
                            }`}
                          style={{
                            left: `${c.x}px`,
                            top: `${c.y}px`,
                            width: `${c.largura || (c.tipo === "ASSINATURA" ? 260 : 120)}px`,
                            height: `${c.altura || (c.tipo === "ASSINATURA" ? 90 : Math.ceil((c.tamanho || 18) * 1.65))}px`,
                            zIndex:
                              campoSelecionadoId === c.id
                                ? 99999
                                : c.ordem || 1,
                            pointerEvents: c.bloqueado ? "none" : "auto",
                            textAlign:
                              (c.alinhamento as "left" | "center" | "right") ||
                              "left",
                            fontSize: `${c.tamanho || 12}px`,
                            color: c.cor || "#1e3a8a",
                            cursor: "default",
                            fontFamily: c.fonte || "Helvetica",
                            fontWeight: c.negrito ? "bold" : "normal",
                            fontStyle: c.italico ? "italic" : "normal",
                            textDecoration: c.sublinhado ? "underline" : "none",
                            lineHeight: c.lineHeight || 1.3,
                            textShadow: sombraProjetadaCss(c),
                            ...efeitosTextoCampoCss(c),
                            filter: (c as any).filter || "none",
                            opacity: (c as any).opacity ?? 1,
                            transform: transformacaoCampoCss(c),
                            transformOrigin: "center center",
                            letterSpacing: `${(c as any).letterSpacing ?? 0}px`,
                            wordSpacing: `${(c as any).wordSpacing ?? 0}px`,
                            whiteSpace:
                              c.tipo === "DISCIPLINAS_CONCLUIDAS"
                                ? "pre-wrap"
                                : "nowrap",
                            display:
                              c.tipo === "DISCIPLINAS_CONCLUIDAS"
                                ? "block"
                                : "flex",
                            alignItems:
                              c.tipo === "DISCIPLINAS_CONCLUIDAS"
                                ? undefined
                                : "center",
                            justifyContent:
                              c.alinhamento === "center"
                                ? "center"
                                : c.alinhamento === "right"
                                  ? "flex-end"
                                  : "flex-start",
                            overflow: "visible",
                            boxSizing: "border-box",
                          }}
                        >
                          {c.tipo === "DISCIPLINAS_CONCLUIDAS" ? (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "grid",
                                gridTemplateColumns: `repeat(${quantidadeColunasDisciplinasDoCampo(
                                  c,
                                )}, minmax(0, 1fr))`,
                                columnGap: `${espacoColunasDisciplinasDoCampo(c)}px`,
                                rowGap: "2px",
                                alignContent: "center",
                                justifyItems:
                                  c.alinhamento === "center"
                                    ? "center"
                                    : c.alinhamento === "right"
                                      ? "end"
                                      : "start",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                              }}
                            >
                              {listaDisciplinasExemplo(c, tr("preview.discipline")).map(
                                (disciplina, index) => (
                                  <div
                                    key={`${c.id}-disciplina-${index}`}
                                    style={{
                                      minWidth: 0,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {disciplina}
                                  </div>
                                ),
                              )}
                            </div>
                          ) : c.tipo === "APROVEITAMENTO" ? (
                            "100%"
                          ) : c.tipo === "FREQUENCIA_TOTAL" ? (
                            tr("preview.totalAttendance")
                          ) : c.tipo === "NOME_ALUNO" ? (
                            tr("preview.studentNameLabel")
                          ) : c.tipo === "NOME_CURSO" ? (
                            tr("preview.courseNameLabel")
                          ) : c.tipo === "DATA_EMISSAO" ? (
                            "00/00/0000"
                          ) : c.tipo === "ASSINATURA" ? (
                            certificadoAssinaturaUrl ? (
                              <img
                                src={certificadoAssinaturaUrl}
                                alt={tr("fieldTypes.ASSINATURA")}
                                draggable={false}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                  display: "block",
                                  pointerEvents: "none",
                                }}
                              />
                            ) : (
                              tr("preview.signature")
                            )
                          ) : (
                            c.tipo
                          )}

                          {camposSelecionadosIds.includes(c.id) &&
                            c.tipo === "ASSINATURA" && (
                              <>
                                {/* Redimensionar largura e altura */}
                                <div
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();

                                    const startX = e.clientX;
                                    const startY = e.clientY;
                                    const startW = Number(c.largura || 260);
                                    const startH = Number(c.altura || 90);

                                    let novaLargura = startW;
                                    let novaAltura = startH;

                                    const move = (
                                      ev: globalThis.MouseEvent,
                                    ) => {
                                      novaLargura = Math.max(
                                        40,
                                        Math.round(
                                          startW +
                                          (ev.clientX - startX) / escala,
                                        ),
                                      );

                                      novaAltura = Math.max(
                                        18,
                                        Math.round(
                                          startH +
                                          (ev.clientY - startY) / escala,
                                        ),
                                      );

                                      setCampos((prev) =>
                                        prev.map((item) =>
                                          item.id === c.id
                                            ? {
                                              ...item,
                                              largura: novaLargura,
                                              altura: novaAltura,
                                            }
                                            : item,
                                        ),
                                      );
                                    };

                                    const up = () => {
                                      window.removeEventListener(
                                        "mousemove",
                                        move,
                                      );
                                      window.removeEventListener("mouseup", up);

                                      void atualizarCampo(c.id, {
                                        largura: novaLargura,
                                        altura: novaAltura,
                                      });
                                    };

                                    window.addEventListener("mousemove", move);
                                    window.addEventListener("mouseup", up);
                                  }}
                                  className="absolute -bottom-3 -right-3 z-[999999] h-6 w-6 cursor-se-resize rounded-full border-2 border-white bg-blue-600 shadow-lg"
                                  title={tr("preview.resizeSignature")}
                                />

                                {/* Ajustar só largura */}
                                <div
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();

                                    const startX = e.clientX;
                                    const startW = Number(c.largura || 260);

                                    let novaLargura = startW;

                                    const move = (
                                      ev: globalThis.MouseEvent,
                                    ) => {
                                      novaLargura = Math.max(
                                        40,
                                        Math.round(
                                          startW +
                                          (ev.clientX - startX) / escala,
                                        ),
                                      );

                                      setCampos((prev) =>
                                        prev.map((item) =>
                                          item.id === c.id
                                            ? {
                                              ...item,
                                              largura: novaLargura,
                                            }
                                            : item,
                                        ),
                                      );
                                    };

                                    const up = () => {
                                      window.removeEventListener(
                                        "mousemove",
                                        move,
                                      );
                                      window.removeEventListener("mouseup", up);

                                      void atualizarCampo(c.id, {
                                        largura: novaLargura,
                                      });
                                    };

                                    window.addEventListener("mousemove", move);
                                    window.addEventListener("mouseup", up);
                                  }}
                                  className="absolute -right-2 top-1/2 z-[999999] h-5 w-5 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-blue-600 shadow"
                                  title={tr("common.adjustWidth")}
                                />

                                {/* Ajustar só altura */}
                                <div
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();

                                    const startY = e.clientY;
                                    const startH = Number(c.altura || 90);

                                    let novaAltura = startH;

                                    const move = (
                                      ev: globalThis.MouseEvent,
                                    ) => {
                                      novaAltura = Math.max(
                                        18,
                                        Math.round(
                                          startH +
                                          (ev.clientY - startY) / escala,
                                        ),
                                      );

                                      setCampos((prev) =>
                                        prev.map((item) =>
                                          item.id === c.id
                                            ? {
                                              ...item,
                                              altura: novaAltura,
                                            }
                                            : item,
                                        ),
                                      );
                                    };

                                    const up = () => {
                                      window.removeEventListener(
                                        "mousemove",
                                        move,
                                      );
                                      window.removeEventListener("mouseup", up);

                                      void atualizarCampo(c.id, {
                                        altura: novaAltura,
                                      });
                                    };

                                    window.addEventListener("mousemove", move);
                                    window.addEventListener("mouseup", up);
                                  }}
                                  className="absolute -bottom-2 left-1/2 z-[999999] h-5 w-5 -translate-x-1/2 cursor-ns-resize rounded-full border-2 border-white bg-blue-600 shadow"
                                  title={tr("common.adjustHeight")}
                                />
                              </>
                            )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="phanyx-cert-editor-info-bar flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <span className="phanyx-cert-editor-status-pill">
                {tr("canvas.pageOneOfOne")}
              </span>
              <span className="phanyx-cert-editor-status-pill">
                {labelPapelAtual}
              </span>
              <span className="phanyx-cert-editor-status-pill">
                {tr("toolbar.zoom")} {zoom}%
              </span>

              {campoSelecionado?.tipo === "FORMA" &&
                !(campoSelecionado as any)?.grupoId && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs font-semibold text-white shadow-xl">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-600 px-3 py-2 hover:bg-slate-800"
                    >
                      {tr("shapeTools.addPoint")}
                    </button>

                    <button
                      type="button"
                      className="rounded-lg border border-slate-600 px-3 py-2 hover:bg-slate-800"
                    >
                      {tr("shapeTools.removePoint")}
                    </button>

                    <button
                      type="button"
                      className="rounded-lg border border-slate-600 px-3 py-2 hover:bg-slate-800"
                    >
                      {tr("shapeTools.curve")}
                    </button>

                    <button
                      type="button"
                      className="rounded-lg border border-slate-600 px-3 py-2 hover:bg-slate-800"
                    >
                      {tr("shapeTools.sharp")}
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalArrayAberto(true)}
                      className="rounded-lg border border-blue-500 px-3 py-2 text-blue-300 hover:bg-blue-950"
                    >
                      {tr("shapeTools.array")}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMostrarHandlesForma((prev) => !prev)}
                      className="rounded-lg border border-slate-600 px-3 py-2 hover:bg-slate-800"
                    >
                      {tr("shapeTools.points")}
                    </button>
                  </div>
                )}

              <span className="phanyx-cert-editor-status-pill">
                {canvasWidth} × {canvasHeight}
              </span>
              {salvandoCampo && (
                <span className="rounded-lg bg-blue-50 px-3 py-1 font-medium text-blue-700">
                  {tr("canvas.savingPositionStyle")}
                </span>
              )}
            </div>

            {editorCorGradiente && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
                <div className="w-[360px] rounded-2xl bg-white p-5 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">
                      {tr("gradient.stopColor")}
                    </h3>

                    <button
                      type="button"
                      onClick={() => setEditorCorGradiente(null)}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600 hover:bg-slate-200"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-slate-200">
                    <div
                      className="relative h-32 w-full"
                      style={{
                        background: `
      linear-gradient(to top, black, transparent),
      linear-gradient(to right, white, ${corAtual.hex || "#ff0000"})
    `,
                      }}
                    >
                      <div
                        className="absolute h-4 w-4 rounded-full border-2 border-white shadow"
                        style={{
                          left: `${(corAtual.r / 255) * 100}%`,
                          top: `${100 - (corAtual.g / 255) * 100}%`,
                        }}
                      />
                    </div>

                    <input
                      type="color"
                      value={corAtual.hex}
                      onChange={(e) => {
                        const cor = e.target.value;

                        const selecao = window.getSelection();
                        const temTextoSelecionado =
                          selecao && selecao.toString().trim().length > 0;

                        if (
                          temTextoSelecionado &&
                          campoSelecionado?.tipo === "TEXTO_LIVRE"
                        ) {
                          aplicarEstiloTextoSelecionado({ color: cor });
                          return;
                        }

                        atualizarCampoLocal("cor", cor);
                      }}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />

                    <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow">
                      {tr("gradient.openColorWheel")}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(["r", "g", "b"] as const).map((canal) => {
                      const rgb = hexToRgb(editorCorGradiente.cor || "#ffffff");

                      return (
                        <div key={canal}>
                          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                            {canal}
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={255}
                            value={rgb[canal]}
                            onChange={(e) => {
                              const valor = Number(e.target.value);
                              const novoRgb = {
                                ...rgb,
                                [canal]: valor,
                              };

                              setEditorCorGradiente((prev) =>
                                prev
                                  ? {
                                    ...prev,
                                    cor: rgbToHex(
                                      novoRgb.r,
                                      novoRgb.g,
                                      novoRgb.b,
                                    ),
                                  }
                                  : prev,
                              );
                            }}
                            className="w-full rounded-xl border px-2 py-2 text-sm"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <label className="mt-4 block text-xs font-semibold text-slate-500">
                    {tr("gradient.colorCode")}
                  </label>
                  <input
                    type="text"
                    value={editorCorGradiente.cor}
                    onChange={(e) =>
                      setEditorCorGradiente((prev) =>
                        prev ? { ...prev, cor: e.target.value } : prev,
                      )
                    }
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="#ff0000"
                  />
                  <input
                    type="text"
                    value={editorCorGradiente.cor}
                    onChange={(e) =>
                      setEditorCorGradiente((prev) =>
                        prev ? { ...prev, cor: e.target.value } : prev,
                      )
                    }
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="#ff0000"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setCampos((prev) =>
                        prev.map((item) => {
                          if (item.id !== editorCorGradiente.campoId)
                            return item;

                          const stops = [
                            ...(((item as any).degradeStops || [
                              { cor: item.cor || "#1d4ed8", posicao: 0 },
                              {
                                cor: (item as any).cor2 || "#60a5fa",
                                posicao: 100,
                              },
                            ]) as any[]),
                          ];

                          stops[editorCorGradiente.pontoIndex] = {
                            ...stops[editorCorGradiente.pontoIndex],
                            cor: corAtual.hex,
                          };

                          return { ...item, degradeStops: stops } as any;
                        }),
                      );

                      setEditorCorGradiente(null);
                      setMenuPontoGradiente(null);
                    }}
                    className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                  >
                    {tr("gradient.applyColor")}
                  </button>
                </div>
              </div>
            )}

            {menuPontoGradiente && (
              <div
                className="fixed z-[99999] w-52 rounded-2xl border border-blue-100 bg-white p-2 shadow-2xl"
                style={{
                  left: menuPontoGradiente.x + 12,
                  top: menuPontoGradiente.y + 12,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const campo = campos.find(
                      (item) => item.id === menuPontoGradiente.campoId,
                    );
                    if (!campo) return;

                    const stops = [
                      ...(((campo as any).degradeStops || [
                        { cor: campo.cor || "#1d4ed8", posicao: 0 },
                        { cor: (campo as any).cor2 || "#60a5fa", posicao: 100 },
                      ]) as any[]),
                    ];

                    const base = stops[menuPontoGradiente.pontoIndex] || {
                      cor: "#ffffff",
                      posicao: 50,
                    };

                    stops.splice(menuPontoGradiente.pontoIndex + 1, 0, {
                      cor: base.cor,
                      posicao: Math.min(100, base.posicao + 8),
                    });

                    atualizarCampoLocal(
                      "degradeStops" as any,
                      stops.sort((a, b) => a.posicao - b.posicao),
                    );

                    setMenuPontoGradiente(null);
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-blue-50"
                >
                  {tr("gradient.duplicateStop")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const campo = campos.find(
                      (item) => item.id === menuPontoGradiente.campoId,
                    );
                    if (!campo) return;

                    const stops = [
                      ...(((campo as any).degradeStops || [
                        { cor: campo.cor || "#1d4ed8", posicao: 0 },
                        { cor: (campo as any).cor2 || "#60a5fa", posicao: 100 },
                      ]) as any[]),
                    ];

                    const base = stops[menuPontoGradiente.pontoIndex] || {
                      posicao: 50,
                    };

                    stops.splice(menuPontoGradiente.pontoIndex + 1, 0, {
                      cor: "#ffffff",
                      posicao: Math.min(100, base.posicao + 10),
                    });

                    atualizarCampoLocal(
                      "degradeStops" as any,
                      stops.sort((a, b) => a.posicao - b.posicao),
                    );

                    setMenuPontoGradiente(null);
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-blue-50"
                >
                  {tr("gradient.addStop")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const campo = campos.find(
                      (item) => item.id === menuPontoGradiente.campoId,
                    );
                    if (!campo) return;

                    const stops = [
                      ...(((campo as any).degradeStops || [
                        { cor: campo.cor || "#1d4ed8", posicao: 0 },
                        { cor: (campo as any).cor2 || "#60a5fa", posicao: 100 },
                      ]) as any[]),
                    ];

                    if (stops.length <= 2) {
                      setMenuPontoGradiente(null);
                      return;
                    }

                    stops.splice(menuPontoGradiente.pontoIndex, 1);

                    atualizarCampoLocal("degradeStops" as any, stops);
                    setMenuPontoGradiente(null);
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  {tr("gradient.deleteStop")}
                </button>
              </div>
            )}

            <div data-shape-inspector-certificado="true">
              <FloatingShapeInspector
                aberto={shapeInspectorAberto}
                campo={campoSelecionado || null}
                posicao={shapeInspectorPosicao}
                zIndex={zIndexFlutuante.opcoesForma}
                onTrazerParaFrente={() =>
                  trazerPainelFlutuanteParaFrente("opcoesForma")
                }
                onOpenArray={() => {
                  trazerPainelFlutuanteParaFrente("arrayModal");
                  setModalArrayAberto(true);
                }}
                onFechar={() => setShapeInspectorAberto(false)}
                onMover={setShapeInspectorPosicao}
                onAtualizarCampo={(campoAtualizado) => {
                  setCampos((prev) =>
                    prev.map((c) =>
                      c.id === campoAtualizado.id
                        ? (campoAtualizado as any)
                        : c,
                    ),
                  );
                }}
                setMostrarHandlesForma={setMostrarHandlesForma}
              />
            </div>
          </main>

          {!modoAmplo && (
            <aside className="relative max-h-[calc(100vh-360px)] overflow-y-auto border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
              {" "}
              <button
                type="button"
                onClick={() => setPainelCampoAberto((prev) => !prev)}
                className="mb-4 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-lg font-bold text-slate-900 shadow-sm"
              >
                <span>{tr("fieldOptions.selectedField")}</span>
                <span>{painelCampoAberto ? "−" : "+"}</span>
              </button>
              {campoSelecionado ? (
                <div className="space-y-4 text-sm text-slate-700">
                  {painelCampoAberto && (
                    <>
                      {campoSelecionado.tipo === "IMAGEM" && (
                        <div className="rounded-2xl border border-slate-200 bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              setOpcoesImagemAberto((prev) => !prev)
                            }
                            className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700"
                          >
                            {tr("image.options")}
                            <span>{opcoesImagemAberto ? "−" : "+"}</span>
                          </button>

                          {opcoesImagemAberto && (
                            <div className="space-y-4 border-t border-slate-100 p-4">
                              <div className="rounded-xl bg-slate-50 p-3">
                                <img
                                  src={(campoSelecionado as any).imagemUrl}
                                  alt={tr("image.preview")}
                                  className="mx-auto h-24 w-full object-contain"
                                />
                              </div>

                              <div>
                                <p className="mb-2 text-xs font-semibold text-slate-500">
                                  {tr("shapeAppearance.transparency")}
                                </p>
                                <div>
                                  <div>
                                    <p className="mb-2 text-xs font-semibold text-slate-500">
                                      {tr("image.adjustments")}
                                    </p>

                                    <div className="grid grid-cols-4 gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal(
                                            "rotate" as any,
                                            Number(
                                              campoSelecionado?.rotate || 0,
                                            ) - 15,
                                          )
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("image.rotateLeft")}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal(
                                            "rotate" as any,
                                            Number(
                                              campoSelecionado?.rotate || 0,
                                            ) + 15,
                                          )
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("image.rotateRight")}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal(
                                            "flipX" as any,
                                            !campoSelecionado?.flipX,
                                          )
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("image.flipHorizontal")}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal(
                                            "flipY" as any,
                                            !campoSelecionado?.flipY,
                                          )
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("image.flipVertical")}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal(
                                            "objectFit" as any,
                                            "contain",
                                          )
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("image.whole")}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal(
                                            "objectFit" as any,
                                            "cover",
                                          )
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("image.crop")}
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="mb-2 text-xs font-semibold text-slate-500">
                                      {tr("layers.title")}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal(
                                            "ordem",
                                            Number(
                                              campoSelecionado?.ordem || 10,
                                            ) + 1,
                                          )
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("layers.bringForward")}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal(
                                            "ordem",
                                            Math.max(
                                              0,
                                              Number(
                                                campoSelecionado?.ordem || 10,
                                              ) - 1,
                                            ),
                                          )
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("layers.sendBackward")}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal("ordem", 999)
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("layers.bringFrontAll")}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal("ordem", 0)
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("layers.sendBackAll")}
                                      </button>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="mb-2 text-xs font-semibold text-slate-500">
                                      {tr("image.filters")}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal(
                                            "filter" as any,
                                            "none",
                                          )
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("image.filterNormal")}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal(
                                            "filter" as any,
                                            "grayscale(1)",
                                          )
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("image.filterBw")}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal(
                                            "filter" as any,
                                            "sepia(1)",
                                          )
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("image.filterSepia")}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          atualizarCampoLocal(
                                            "filter" as any,
                                            "contrast(1.25) saturate(1.3)",
                                          )
                                        }
                                        className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                      >
                                        {tr("image.filterVivid")}
                                      </button>
                                    </div>
                                  </div>
                                  <p className="mb-2 text-xs font-semibold text-slate-500">
                                    {tr("image.fit")}
                                  </p>

                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        atualizarCampoLocal(
                                          "objectFit" as any,
                                          "contain" as any,
                                        )
                                      }
                                      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                    >
                                      {tr("image.fitContain")}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        atualizarCampoLocal(
                                          "objectFit" as any,
                                          "cover" as any,
                                        )
                                      }
                                      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                    >
                                      {tr("image.fitCover")}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!campoSelecionado) return;

                                        const largura =
                                          campoSelecionado.largura || 150;
                                        const altura =
                                          campoSelecionado.altura || 150;
                                        const tamanho = Math.min(
                                          largura,
                                          altura,
                                        );

                                        const corteHorizontal = Math.max(
                                          0,
                                          (largura - tamanho) / 2,
                                        );
                                        const corteVertical = Math.max(
                                          0,
                                          (altura - tamanho) / 2,
                                        );

                                        atualizarCampoLocal("crop" as any, {
                                          top: corteVertical,
                                          bottom: corteVertical,
                                          left: corteHorizontal,
                                          right: corteHorizontal,
                                        });

                                        atualizarCampoLocal(
                                          "cropBaseW" as any,
                                          largura,
                                        );
                                        atualizarCampoLocal(
                                          "cropBaseH" as any,
                                          altura,
                                        );
                                        atualizarCampoLocal(
                                          "largura" as any,
                                          tamanho,
                                        );
                                        atualizarCampoLocal(
                                          "altura" as any,
                                          tamanho,
                                        );
                                      }}
                                      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                    >
                                      {tr("image.squareCrop")}
                                    </button>
                                  </div>
                                </div>
                                <input
                                  type="range"
                                  min={0.1}
                                  max={1}
                                  step={0.05}
                                  value={campoSelecionado.opacity || 1}
                                  onChange={(e) => {
                                    const tamanho = Number(e.target.value);

                                    if (temSelecaoTextoLivreSalva()) {
                                      aplicarEstiloTextoSelecionado({
                                        fontSize: `${tamanho}px`,
                                      });
                                      return;
                                    }

                                    atualizarCampoLocal("tamanho", tamanho);
                                  }}
                                  className="w-full"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (!campoSelecionado?.id) return;
                                  excluirCampo(campoSelecionado.id);
                                }}
                                className="w-full rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                              >
                                {tr("image.removeImage")}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">{tr("fieldOptions.typeColon")}</span>{" "}
                        {traduzirTipoCampoCertificado(campoSelecionado.tipo)}
                      </div>

                      {campoSelecionado?.tipo === "DISCIPLINAS_CONCLUIDAS" && (
                        <div className="relative rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-slate-100">
                                {tr("disciplines.title")}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-slate-400">
                                {tr("disciplines.description")}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setPopupDisciplinasAberto((prev) => !prev)
                              }
                              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                            >
                              {tr("common.configure")}
                            </button>
                          </div>

                          {popupDisciplinasAberto && (
                            <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-900 p-3 shadow-xl">
                              <label className="mb-2 block text-xs font-semibold text-slate-300">
                                {tr("disciplines.quantity")}
                              </label>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    atualizarQuantidadeDisciplinasCampo(
                                      quantidadeDisciplinasDoCampo(
                                        campoSelecionado,
                                      ) - 1,
                                    )
                                  }
                                  className="h-10 w-10 rounded-xl border border-slate-700 text-lg font-bold text-white hover:bg-slate-800"
                                >
                                  −
                                </button>

                                <input
                                  type="number"
                                  min={1}
                                  max={80}
                                  value={quantidadeDisciplinasDoCampo(
                                    campoSelecionado,
                                  )}
                                  onChange={(e) =>
                                    atualizarQuantidadeDisciplinasCampo(
                                      Number(e.target.value),
                                    )
                                  }
                                  className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-center text-sm font-bold text-white outline-none focus:border-blue-500"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    atualizarQuantidadeDisciplinasCampo(
                                      quantidadeDisciplinasDoCampo(
                                        campoSelecionado,
                                      ) + 1,
                                    )
                                  }
                                  className="h-10 w-10 rounded-xl border border-slate-700 text-lg font-bold text-white hover:bg-slate-800"
                                >
                                  +
                                </button>
                              </div>

                              <div className="mt-3 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPopupDisciplinasAberto(false)
                                  }
                                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                                >
                                  {tr("common.apply")}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 border-t border-slate-700 pt-3">
                        <label className="mb-2 block text-xs font-semibold text-slate-300">
                          {tr("disciplines.columns")}
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              atualizarColunasDisciplinasCampo(
                                quantidadeColunasDisciplinasDoCampo(
                                  campoSelecionado,
                                ) - 1,
                              )
                            }
                            className="h-10 w-10 rounded-xl border border-slate-700 text-lg font-bold text-white hover:bg-slate-800"
                          >
                            −
                          </button>

                          <input
                            type="number"
                            min={1}
                            max={4}
                            value={quantidadeColunasDisciplinasDoCampo(
                              campoSelecionado,
                            )}
                            onChange={(e) =>
                              atualizarColunasDisciplinasCampo(
                                Number(e.target.value),
                              )
                            }
                            className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-center text-sm font-bold text-white outline-none focus:border-blue-500"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              atualizarColunasDisciplinasCampo(
                                quantidadeColunasDisciplinasDoCampo(
                                  campoSelecionado,
                                ) + 1,
                              )
                            }
                            className="h-10 w-10 rounded-xl border border-slate-700 text-lg font-bold text-white hover:bg-slate-800"
                          >
                            +
                          </button>
                        </div>

                        <p className="mt-2 text-[11px] leading-5 text-slate-400">
                          {tr("disciplines.columnsHint")}
                        </p>
                      </div>

                      <div className="mt-4 border-t border-slate-700 pt-3">
                        <label className="mb-2 block text-xs font-semibold text-slate-300">
                          {tr("disciplines.columnGap")}
                        </label>

                        <input
                          type="range"
                          min={0}
                          max={80}
                          step={1}
                          value={espacoColunasDisciplinasDoCampo(
                            campoSelecionado,
                          )}
                          onChange={(e) =>
                            atualizarEspacoColunasDisciplinasCampo(
                              Number(e.target.value),
                            )
                          }
                          className="w-full"
                        />

                        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                          <span>{tr("disciplines.closer")}</span>
                          <strong>
                            {espacoColunasDisciplinasDoCampo(campoSelecionado)}
                            px
                          </strong>
                          <span>{tr("disciplines.farther")}</span>
                        </div>
                      </div>

                      {campoSelecionado && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {tr("fieldOptions.boxSize")}
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {tr("common.width")}
                              </span>

                              <input
                                type="number"
                                min={20}
                                max={2000}
                                value={Math.round(
                                  Number(campoSelecionado.largura || 220),
                                )}
                                onChange={(e) =>
                                  atualizarCampoLocal(
                                    "largura" as any,
                                    Math.max(
                                      20,
                                      Number(e.target.value || 20),
                                    ) as any,
                                  )
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                              />
                            </label>

                            <label className="block">
                              <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {tr("common.height")}
                              </span>

                              <input
                                type="number"
                                min={12}
                                max={2000}
                                value={Math.round(
                                  Number(campoSelecionado.altura || 40),
                                )}
                                onChange={(e) =>
                                  atualizarCampoLocal(
                                    "altura" as any,
                                    Math.max(
                                      12,
                                      Number(e.target.value || 12),
                                    ) as any,
                                  )
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                              />
                            </label>
                          </div>

                          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {tr("fieldOptions.widthHint")}
                          </p>
                        </div>
                      )}

                      {campoSelecionado?.tipo === "FORMA" &&
                        !(campoSelecionado as any)?.grupoId && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="mb-3 text-sm font-semibold text-slate-700">
                              {tr("shapeAppearance.title")}
                            </p>

                            <div className="space-y-3">
                              <div>
                                <div>
                                  <p className="mb-1 text-xs font-semibold text-slate-500">
                                    {tr("shapeAppearance.fill")}
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      atualizarCampoLocal(
                                        "mostrarPreenchimento" as any,
                                        !(campoSelecionado as any)
                                          ?.mostrarPreenchimento,
                                      )
                                    }
                                    className="mb-2 w-full rounded-xl border border-slate-500 px-3 py-2 text-xs font-semibold"
                                  >
                                    {(campoSelecionado as any)
                                      ?.mostrarPreenchimento
                                      ? tr("shapeAppearance.removeFill")
                                      : tr("shapeAppearance.enableFill")}
                                  </button>

                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        atualizarCampoLocal(
                                          "mostrarPreenchimento" as any,
                                          (campoSelecionado as any)
                                            ?.mostrarPreenchimento === false
                                            ? true
                                            : false,
                                        )
                                      }
                                      className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-100"
                                    >
                                      {(campoSelecionado as any)
                                        ?.mostrarPreenchimento === false
                                        ? tr("shapeAppearance.noFill")
                                        : tr("shapeAppearance.withFill")}
                                    </button>

                                    <input
                                      type="color"
                                      value={
                                        (campoSelecionado as any)
                                          ?.preenchimentoCor ||
                                        campoSelecionado?.cor ||
                                        "#1d4ed8"
                                      }
                                      onChange={(e) =>
                                        atualizarCampoLocal(
                                          "preenchimentoCor" as any,
                                          e.target.value,
                                        )
                                      }
                                      className="h-10 w-full cursor-pointer rounded-lg border"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <p className="mb-1 text-xs font-semibold text-slate-500">
                                    {tr("shapeAppearance.outline")}
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      atualizarCampoLocal(
                                        "mostrarContorno" as any,
                                        !(campoSelecionado as any)
                                          ?.mostrarContorno,
                                      )
                                    }
                                    className="mb-2 w-full rounded-xl border border-slate-500 px-3 py-2 text-xs font-semibold"
                                  >
                                    {(campoSelecionado as any)?.mostrarContorno
                                      ? tr("shapeAppearance.removeOutline")
                                      : tr("shapeAppearance.enableOutline")}
                                  </button>

                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const ativo =
                                          (campoSelecionado as any)
                                            ?.mostrarContorno === false
                                            ? true
                                            : false;

                                        if (
                                          campoSelecionado?.tipo ===
                                          "TEXTO_LIVRE" &&
                                          temSelecaoTextoLivreSalva()
                                        ) {
                                          aplicarEstiloTextoSelecionado({
                                            WebkitTextStrokeWidth: ativo
                                              ? `${(campoSelecionado as any)?.contornoEspessura || 1.5}px`
                                              : "0px",
                                            WebkitTextStrokeColor:
                                              (campoSelecionado as any)
                                                ?.contornoCor || "#1d4ed8",
                                          } as React.CSSProperties);

                                          return;
                                        }

                                        atualizarCampoLocal(
                                          "mostrarContorno" as any,
                                          ativo,
                                        );
                                      }}
                                      className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-100"
                                    >
                                      {(campoSelecionado as any)
                                        ?.mostrarContorno === false
                                        ? tr("shapeAppearance.noOutline")
                                        : tr("shapeAppearance.withOutline")}
                                    </button>

                                    <input
                                      type="color"
                                      value={
                                        (campoSelecionado as any)
                                          ?.contornoCor ||
                                        campoSelecionado?.cor ||
                                        "#1d4ed8"
                                      }
                                      onChange={(e) =>
                                        atualizarCampoLocal(
                                          "contornoCor" as any,
                                          e.target.value,
                                        )
                                      }
                                      className="h-10 w-full cursor-pointer rounded-lg border"
                                    />
                                  </div>

                                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                                    {tr("shapeAppearance.outlineType")}
                                  </label>

                                  <div className="mb-3 flex gap-2">
                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setTipoContornoTexto("externo");

                                        aplicarContornoTextoSelecionado(
                                          corContornoTexto,
                                          espessuraContornoTexto,
                                          "externo",
                                        );
                                      }}
                                      className={`rounded-lg px-3 py-2 text-xs font-bold ${tipoContornoTexto === "externo"
                                        ? "bg-blue-600 text-white"
                                        : "border"
                                        }`}
                                    >
                                      {tr("shapeAppearance.external")}
                                    </button>

                                    <button
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setTipoContornoTexto("interno");

                                        aplicarContornoTextoSelecionado(
                                          corContornoTexto,
                                          espessuraContornoTexto,
                                          "interno",
                                        );
                                      }}
                                      className={`rounded-lg px-3 py-2 text-xs font-bold ${tipoContornoTexto === "interno"
                                        ? "bg-blue-600 text-white"
                                        : "border"
                                        }`}
                                    >
                                      {tr("shapeAppearance.internal")}
                                    </button>
                                  </div>

                                  <label className="mt-3 block text-xs text-slate-500">
                                    {tr("shapeAppearance.outlineThickness")}
                                  </label>
                                  <input
                                    type="range"
                                    min={0}
                                    max={20}
                                    value={
                                      (campoSelecionado as any)
                                        ?.contornoEspessura ?? 1.5
                                    }
                                    onChange={(e) =>
                                      atualizarCampoLocal(
                                        "contornoEspessura" as any,
                                        Number(e.target.value),
                                      )
                                    }
                                    className="w-full"
                                  />
                                </div>
                              </div>

                              <div>
                                <p className="mb-1 text-xs font-semibold text-slate-500">
                                  {tr("shapeAppearance.transparency")}
                                </p>

                                <label className="mt-3 block text-xs text-slate-500">
                                  {tr("shapeAppearance.cornerRadius")}
                                </label>
                                <input
                                  type="range"
                                  min={0}
                                  max={80}
                                  value={
                                    (campoSelecionado as any)?.raioBorda ?? 8
                                  }
                                  onChange={(e) =>
                                    atualizarCampoLocal(
                                      "raioBorda" as any,
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-full"
                                />

                                <input
                                  type="range"
                                  min={0.1}
                                  max={1}
                                  step={0.05}
                                  value={campoSelecionado?.opacity || 1}
                                  onChange={(e) =>
                                    atualizarCampoLocal(
                                      "opacity" as any,
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-full"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  atualizarCampoLocal(
                                    "usarGradiente" as any,
                                    !(campoSelecionado as any)?.usarGradiente,
                                  )
                                }
                                className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-xs font-semibold hover:bg-slate-100"
                              >
                                {(campoSelecionado as any)?.usarGradiente
                                  ? tr("shapeAppearance.disableGradient")
                                  : tr("shapeAppearance.enableGradient")}
                              </button>

                              {(campoSelecionado as any)?.usarGradiente && (
                                <>
                                  <div>
                                    <p className="mb-1 text-xs font-semibold text-slate-500">
                                      {tr("shapeAppearance.secondColor")}
                                    </p>
                                    <input
                                      type="color"
                                      value={
                                        (campoSelecionado as any)?.cor2 ||
                                        "#60a5fa"
                                      }
                                      onChange={(e) =>
                                        atualizarCampoLocal(
                                          "cor2" as any,
                                          e.target.value,
                                        )
                                      }
                                      className="h-10 w-full cursor-pointer rounded-lg border"
                                    />
                                  </div>

                                  <select
                                    value={
                                      (campoSelecionado as any)
                                        ?.direcaoGradiente || "90deg"
                                    }
                                    onChange={(e) =>
                                      atualizarCampoLocal(
                                        "direcaoGradiente" as any,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full rounded-xl border px-3 py-2 text-sm"
                                  >
                                    <option value="90deg">
                                      {tr("gradient.leftToRight")}
                                    </option>
                                    <option value="180deg">
                                      {tr("gradient.topToBottom")}
                                    </option>
                                    <option value="45deg">{tr("gradient.diagonal")}</option>
                                    <option value="135deg">
                                      {tr("gradient.reverseDiagonal")}
                                    </option>
                                  </select>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            X
                          </label>
                          <input
                            type="number"
                            value={campoSelecionado.x}
                            onChange={(e) =>
                              atualizarCampoLocal("x", Number(e.target.value))
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Y
                          </label>
                          <input
                            type="number"
                            value={campoSelecionado.y}
                            onChange={(e) =>
                              atualizarCampoLocal("y", Number(e.target.value))
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            {tr("common.width")}
                          </label>
                          <input
                            type="number"
                            value={campoSelecionado.largura || 220}
                            onChange={(e) =>
                              atualizarCampoLocal(
                                "largura",
                                Number(e.target.value),
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            {tr("common.height")}
                          </label>
                          <input
                            type="number"
                            value={campoSelecionado.altura || 40}
                            onChange={(e) =>
                              atualizarCampoLocal(
                                "altura",
                                Number(e.target.value),
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          {tr("text.font")}
                        </label>
                        <select
                          value={campoSelecionado?.fonte || "Helvetica"}
                          onChange={(e) => {
                            const novaFonte = e.target.value;

                            if (campoSelecionado?.tipo === "TEXTO_LIVRE") {
                              atualizarCampoLocal("fonte", novaFonte as any);
                              return;
                            }

                            aplicarEstiloTextoOuCampoInteiro(
                              "fonte",
                              novaFonte,
                              {
                                fontFamily: novaFonte,
                              },
                            );
                          }}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        >
                          {FONTES.map((fonte) => (
                            <option
                              key={fonte}
                              value={fonte}
                              style={{ fontFamily: fonte }}
                            >
                              {fonte}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() =>
                            aplicarEstiloTextoOuCampoInteiro(
                              "negrito",
                              !campoSelecionado.negrito,
                              {
                                fontWeight: "700",
                              },
                            )
                          }
                          className={`px-3 py-1 rounded border text-sm ${campoSelecionado.negrito
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700"
                            }`}
                        >
                          B
                        </button>

                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() =>
                            aplicarEstiloTextoOuCampoInteiro(
                              "italico",
                              !campoSelecionado.italico,
                              {
                                fontStyle: "italic",
                              },
                            )
                          }
                          className={`px-3 py-1 rounded border text-sm italic ${campoSelecionado.italico
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700"
                            }`}
                        >
                          I
                        </button>

                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() =>
                            aplicarEstiloTextoOuCampoInteiro(
                              "sublinhado",
                              !campoSelecionado.sublinhado,
                              {
                                textDecoration: "underline",
                              },
                            )
                          }
                          className={`px-3 py-1 rounded border text-sm underline ${campoSelecionado.sublinhado
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-700"
                            }`}
                        >
                          U
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500">
                          {tr("text.format")}
                        </label>

                        <select
                          value={
                            (campoSelecionado as any)?.textoModo || "NORMAL"
                          }
                          onChange={(e) =>
                            atualizarCampoLocal(
                              "textoModo" as any,
                              e.target.value as any,
                            )
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        >
                          <option value="NORMAL">
                            {tr("image.filterNormal")}
                          </option>
                          <option value="VERTICAL">{tr("text.modeVertical")}</option>
                          <option value="ARCO">{tr("text.modeArc")}</option>
                        </select>

                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          {tr("common.size")}
                        </label>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              if (campoSelecionado?.tipo === "TEXTO_LIVRE") {
                                alterarTamanhoTextoSelecionado(-2);
                                return;
                              }

                              const novoTamanho = Math.max(
                                6,
                                (campoSelecionado?.tamanho || 18) - 2,
                              );
                              atualizarCampoLocal("tamanho", novoTamanho);
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                          >
                            A−
                          </button>

                          <input
                            type="number"
                            min={6}
                            max={120}
                            value={
                              tamanhoSelecaoTexto ??
                              campoSelecionado?.tamanho ??
                              18
                            }
                            onChange={(e) => {
                              const tamanho = Number(e.target.value);
                              setTamanhoSelecaoTexto(tamanho);

                              if (
                                campoSelecionado?.tipo === "TEXTO_LIVRE" &&
                                temSelecaoTextoLivreSalva()
                              ) {
                                aplicarEstiloTextoSelecionado({
                                  fontSize: `${tamanho}px`,
                                });
                                return;
                              }

                              atualizarCampoLocal("tamanho", tamanho);
                            }}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2"
                          />

                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();

                              if (campoSelecionado?.tipo === "TEXTO_LIVRE") {
                                alterarTamanhoTextoSelecionado(2);
                                return;
                              }

                              const novoTamanho = Math.min(
                                120,
                                (campoSelecionado?.tamanho || 18) + 2,
                              );
                              atualizarCampoLocal("tamanho", novoTamanho);
                            }}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                          >
                            A+
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          {tr("common.color")}
                        </label>
                        <input
                          type="color"
                          value={
                            corTextoSelecionado ||
                            campoSelecionado?.cor ||
                            "#1e3a8a"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          onChange={(e) => {
                            const cor = e.target.value.toLowerCase();

                            setCorTextoSelecionado(cor);

                            if (campoSelecionado?.tipo === "TEXTO_LIVRE") {
                              aplicarEstiloTextoSelecionado({
                                color: cor,
                              });
                              return;
                            }

                            atualizarCampoLocal("cor", cor);
                          }}
                          className="h-11 w-full cursor-pointer rounded-xl border border-slate-300 px-2 py-2"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          {tr("text.alignment")}
                        </label>
                        <label className="mt-3 block text-xs font-semibold text-slate-500">
                          {tr("text.letterSpacing")}
                        </label>

                        <input
                          type="range"
                          min={-5}
                          max={30}
                          step={1}
                          value={espacamentoLetrasTexto}
                          onChange={(e) => {
                            const valor = Number(e.target.value);
                            setEspacamentoLetrasTexto(valor);

                            if (
                              campoSelecionado?.tipo === "TEXTO_LIVRE" &&
                              temSelecaoTextoLivreSalva()
                            ) {
                              aplicarEstiloTextoSelecionado({
                                letterSpacing: `${valor}px`,
                              });
                              return;
                            }

                            atualizarCampoLocal("letterSpacing" as any, valor);
                          }}
                          className="w-full"
                        />

                        <label className="mt-3 block text-xs font-semibold text-slate-500">
                          {tr("text.wordSpacing")}
                        </label>

                        <input
                          type="range"
                          min={0}
                          max={60}
                          step={1}
                          value={espacamentoPalavrasTexto}
                          onChange={(e) => {
                            const valor = Number(e.target.value);
                            setEspacamentoPalavrasTexto(valor);

                            if (
                              campoSelecionado?.tipo === "TEXTO_LIVRE" &&
                              temSelecaoTextoLivreSalva()
                            ) {
                              aplicarEstiloTextoSelecionado({
                                wordSpacing: `${valor}px`,
                              });
                              return;
                            }

                            atualizarCampoLocal("wordSpacing" as any, valor);
                          }}
                          className="w-full"
                        />
                        <select
                          value={campoSelecionado?.alinhamento || "left"}
                          onChange={(e) =>
                            atualizarCampoLocal("alinhamento", e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2"
                        >
                          <option value="left">
                            {tr("common.left")}
                          </option>
                          <option value="center">
                            {tr("common.center")}
                          </option>
                          <option value="right">
                            {tr("common.right")}
                          </option>
                        </select>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white">
                        <button
                          type="button"
                          onClick={() => setOpcoesTextoAberto((prev) => !prev)}
                          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700"
                        >
                          {tr("fieldOptions.title")}
                          <span>{opcoesTextoAberto ? "−" : "+"}</span>
                        </button>

                        {opcoesTextoAberto && (
                          <div className="space-y-4 border-t border-slate-100 p-4">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  atualizarCampoLocal(
                                    "ordem",
                                    (campoSelecionado?.ordem || 1) + 1,
                                  )
                                }
                                className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                              >
                                {tr("layers.front")}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  atualizarCampoLocal(
                                    "ordem",
                                    (campoSelecionado?.ordem || 1) - 1,
                                  )
                                }
                                className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                              >
                                {tr("layers.back")}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  atualizarCampoLocal("ordem", 999)
                                }
                                className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                              >
                                {tr("layers.top")}
                              </button>
                              <button
                                type="button"
                                onClick={() => atualizarCampoLocal("ordem", 0)}
                                className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                              >
                                {tr("layers.bottom")}
                              </button>
                            </div>

                            {campoSelecionado.tipo !== "IMAGEM" && (
                              <>
                                <div>
                                  <p className="mb-2 text-xs font-semibold text-slate-500">
                                    {tr("text.lineSpacing")}
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        atualizarCampoLocal(
                                          "lineHeight",
                                          Math.max(
                                            0.8,
                                            Number(
                                              campoSelecionado?.lineHeight ||
                                              1.3,
                                            ) - 0.1,
                                          ),
                                        )
                                      }
                                      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                    >
                                      {tr("text.decreaseLineSpacing")}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        atualizarCampoLocal(
                                          "lineHeight",
                                          Math.min(
                                            3,
                                            Number(
                                              campoSelecionado?.lineHeight ||
                                              1.3,
                                            ) + 0.1,
                                          ),
                                        )
                                      }
                                      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                    >
                                      {tr("text.increaseLineSpacing")}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <p className="mb-2 text-xs font-semibold text-slate-500">
                                    {tr("text.listMarker")}
                                  </p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        atualizarCampoLocal("marcador", null)
                                      }
                                      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                    >
                                      {tr("common.none")}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        atualizarCampoLocal("marcador", "•")
                                      }
                                      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                    >
                                      {tr("text.markerBullet")}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        atualizarCampoLocal("marcador", "➤")
                                      }
                                      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                    >
                                      {tr("text.markerArrow")}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        atualizarCampoLocal("marcador", "-")
                                      }
                                      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
                                    >
                                      {tr("text.markerDash")}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}

                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    campoSelecionado?.tipo === "TEXTO_LIVRE"
                                  ) {
                                    if (!temSelecaoTextoLivreAtiva()) return;

                                    aplicarEstiloTextoSelecionado({
                                      textShadow:
                                        "3px 3px 6px rgba(0,0,0,0.45)",
                                    });

                                    setMenuContexto(null);
                                    return;
                                  }

                                  atualizarCampoLocal(
                                    "sombraAtiva" as any,
                                    true,
                                  );
                                  setMenuContexto(null);
                                }}
                                className="w-full flex items-center justify-between text-sm font-semibold text-left"
                              >
                                {tr("shadow.title")}
                                <span
                                  className={`transition-transform ${sombraAberta ? "rotate-180" : ""}`}
                                >
                                  ▼
                                </span>
                              </button>

                              {sombraAberta && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const ativa =
                                        !campoSelecionado?.sombraAtiva;
                                      atualizarCampoLocal("sombraAtiva", ativa);

                                      if (temSelecaoTextoLivreAtiva()) {
                                        aplicarEstiloTextoSelecionado({
                                          textShadow: ativa
                                            ? "3px 3px 6px rgba(0,0,0,0.45)"
                                            : "none",
                                        });
                                      }
                                    }}
                                    className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                                  >
                                    {campoSelecionado?.sombraAtiva
                                      ? tr("shadow.disable")
                                      : tr("shadow.enable")}
                                  </button>

                                  <label className="mt-3 block text-xs text-slate-500">
                                    {tr("shadow.color")}
                                  </label>
                                  <input
                                    type="color"
                                    value={
                                      campoSelecionado?.sombraCor || "#000000"
                                    }
                                    onChange={(e) => {
                                      const valor = e.target.value;
                                      atualizarCampoLocal("sombraCor", valor);

                                      if (temSelecaoTextoLivreAtiva()) {
                                        const blur =
                                          campoSelecionado?.sombraBlur ?? 20;
                                        const opacidade =
                                          (campoSelecionado?.sombraOpacidade ??
                                            40) / 100;

                                        const { x, y } = calcularSombra(
                                          (campoSelecionado as any)
                                            ?.sombraAngulo ?? 45,
                                          (campoSelecionado as any)
                                            ?.sombraDistancia ?? 20,
                                        );

                                        aplicarEstiloTextoSelecionado({
                                          textShadow: `${x}px ${y}px ${blur}px ${hexToRgba(valor, opacidade)}`,
                                        });
                                      }
                                    }}
                                    className="h-10 w-full cursor-pointer rounded-xl border border-slate-300"
                                  />

                                  <label className="text-xs text-gray-600">
                                    {tr("common.angle")}
                                  </label>
                                  <input
                                    type="range"
                                    min={0}
                                    max={360}
                                    value={
                                      (campoSelecionado as any)?.sombraAngulo ??
                                      45
                                    }
                                    onChange={(e) => {
                                      const valor = Number(e.target.value);
                                      atualizarCampoLocal(
                                        "sombraAngulo",
                                        valor as any,
                                      );

                                      if (temSelecaoTextoLivreAtiva()) {
                                        const blur =
                                          campoSelecionado?.sombraBlur ?? 20;
                                        const cor =
                                          campoSelecionado?.sombraCor ||
                                          "#000000";
                                        const opacidade =
                                          (campoSelecionado?.sombraOpacidade ??
                                            40) / 100;

                                        const { x, y } = calcularSombra(
                                          valor,
                                          (campoSelecionado as any)
                                            ?.sombraDistancia ?? 20,
                                        );

                                        aplicarEstiloTextoSelecionado({
                                          textShadow: `${x}px ${y}px ${blur}px ${hexToRgba(cor, opacidade)}`,
                                        });
                                      }
                                    }}
                                  />

                                  <label className="text-xs text-gray-600 mt-2">
                                    {tr("common.distance")}
                                  </label>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={
                                      (campoSelecionado as any)
                                        ?.sombraDistancia ?? 20
                                    }
                                    onChange={(e) => {
                                      const valor = Number(e.target.value);
                                      atualizarCampoLocal(
                                        "sombraDistancia",
                                        valor as any,
                                      );

                                      if (temSelecaoTextoLivreAtiva()) {
                                        const blur =
                                          campoSelecionado?.sombraBlur ?? 20;
                                        const cor =
                                          campoSelecionado?.sombraCor ||
                                          "#000000";
                                        const opacidade =
                                          (campoSelecionado?.sombraOpacidade ??
                                            40) / 100;

                                        const { x, y } = calcularSombra(
                                          (campoSelecionado as any)
                                            ?.sombraAngulo ?? 45,
                                          valor,
                                        );

                                        aplicarEstiloTextoSelecionado({
                                          textShadow: `${x}px ${y}px ${blur}px ${hexToRgba(cor, opacidade)}`,
                                        });
                                      }
                                    }}
                                  />

                                  <label className="mt-3 block text-xs text-slate-500">
                                    {tr("shadow.blur")}
                                  </label>
                                  <input
                                    type="range"
                                    min={0}
                                    max={80}
                                    value={campoSelecionado?.sombraBlur ?? 20}
                                    onChange={(e) => {
                                      const valor = Number(e.target.value);
                                      atualizarCampoLocal("sombraBlur", valor);

                                      if (temSelecaoTextoLivreAtiva()) {
                                        const cor =
                                          campoSelecionado?.sombraCor ||
                                          "#000000";
                                        const opacidade =
                                          (campoSelecionado?.sombraOpacidade ??
                                            40) / 100;

                                        const { x, y } = calcularSombra(
                                          (campoSelecionado as any)
                                            ?.sombraAngulo ?? 45,
                                          (campoSelecionado as any)
                                            ?.sombraDistancia ?? 20,
                                        );

                                        aplicarEstiloTextoSelecionado({
                                          textShadow: `${x}px ${y}px ${valor}px ${hexToRgba(cor, opacidade)}`,
                                        });
                                      }
                                    }}
                                    className="w-full"
                                  />

                                  <label className="mt-3 block text-xs text-slate-500">
                                    {tr("common.opacity")}
                                  </label>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={
                                      campoSelecionado?.sombraOpacidade ?? 40
                                    }
                                    onChange={(e) => {
                                      const valor = Number(e.target.value);
                                      atualizarCampoLocal(
                                        "sombraOpacidade",
                                        valor,
                                      );

                                      if (temSelecaoTextoLivreAtiva()) {
                                        const blur =
                                          campoSelecionado?.sombraBlur ?? 20;
                                        const cor =
                                          campoSelecionado?.sombraCor ||
                                          "#000000";
                                        const opacidade = valor / 100;

                                        const { x, y } = calcularSombra(
                                          (campoSelecionado as any)
                                            ?.sombraAngulo ?? 45,
                                          (campoSelecionado as any)
                                            ?.sombraDistancia ?? 20,
                                        );

                                        aplicarEstiloTextoSelecionado({
                                          textShadow: `${x}px ${y}px ${blur}px ${hexToRgba(cor, opacidade)}`,
                                        });
                                      }
                                    }}
                                    className="w-full"
                                  />
                                </>
                              )}
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={salvarCampoSelecionado}
                                className="flex-1 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                              >
                                {tr("common.save")}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  excluirCampo(campoSelecionado.id)
                                }
                                className="flex-1 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                              >
                                {tr("common.delete")}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {tr("fieldOptions.emptyHint")}
                </p>
              )}
            </aside>
          )}

          {menuCamada && (
            <div
              data-menu-camada-certificado="true"
              className="fixed z-[9999] w-44 rounded-xl border border-slate-200 bg-white p-2 text-xs shadow-xl"
              style={{ left: menuCamada.x, top: menuCamada.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setCamadaRenomeandoId(menuCamada.campoId);
                  const campo = campos.find(
                    (item) => item.id === menuCamada.campoId,
                  );
                  setNomeCamadaEditando(campo?.nomeCamada || "");
                  setMenuCamada(null);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
              >
                {tr("layers.rename")}
              </button>

              <button
                type="button"
                onClick={() => {
                  moverCamadaPara(menuCamada.campoId, "cima");
                  setMenuCamada(null);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
              >
                {tr("layers.sendUp")}
              </button>

              <button
                type="button"
                onClick={() => {
                  moverCamadaPara(menuCamada.campoId, "baixo");
                  setMenuCamada(null);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
              >
                {tr("layers.sendDown")}
              </button>

              <button
                type="button"
                onClick={() => {
                  const campo = campos.find(
                    (item) => item.id === menuCamada.campoId,
                  );
                  if (campo) atualizarCampoLocal("bloqueado", !campo.bloqueado);
                  setMenuCamada(null);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
              >
                {tr("layers.toggleLock")}
              </button>

              <button
                type="button"
                onClick={() => {
                  void excluirCampo(menuCamada.campoId);
                  setMenuCamada(null);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
              >
                {tr("common.delete")}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          {tr("institutionalData.title")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {tr("institutionalData.description")}
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {tr("institutionalData.templateUrl")}
            </label>
            <input
              type="text"
              value={certificadoTemplateUrl}
              onChange={(e) => setCertificadoTemplateUrl(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {tr("institutionalData.coordinatorName")}
            </label>
            <input
              type="text"
              value={certificadoCoordenadorNome}
              onChange={(e) => setCertificadoCoordenadorNome(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-400"
              placeholder={tr("institutionalData.coordinatorExample")}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {tr("institutionalData.city")}
            </label>
            <input
              type="text"
              value={certificadoCidade}
              onChange={(e) => setCertificadoCidade(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-400"
              placeholder={tr("institutionalData.cityExample")}
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                void salvarRascunhoCompleto();
              }}
              disabled={salvando}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? tr("common.saving") : tr("institutionalData.saveDraftData")}
            </button>
          </div>
        </div>
      </div>

      {modalArrayAberto && (
        <div
          data-array-modal-certificado="true"
          onMouseDown={(e) => {
            e.stopPropagation();
            trazerPainelFlutuanteParaFrente("arrayModal");
          }}
          className="fixed rounded-2xl border border-blue-500/40 bg-slate-950 text-white shadow-2xl"
          style={{
            left: `${arrayJanelaPos.x}px`,
            top: `${arrayJanelaPos.y}px`,
            zIndex: zIndexFlutuante.arrayModal,
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div
              className="cursor-move rounded-t-3xl -mx-6 -mt-6 mb-4 bg-slate-800 px-4 py-3 text-sm font-bold text-white"
              onMouseDown={(e) => {
                e.preventDefault();

                const offsetX = e.clientX - arrayJanelaPos.x;
                const offsetY = e.clientY - arrayJanelaPos.y;

                const mover = (ev: globalThis.MouseEvent) => {
                  setArrayJanelaPos({
                    x: ev.clientX - offsetX,
                    y: ev.clientY - offsetY,
                  });
                };

                const parar = () => {
                  window.removeEventListener("mousemove", mover);
                  window.removeEventListener("mouseup", parar);
                };

                window.addEventListener("mousemove", mover);
                window.addEventListener("mouseup", parar);
              }}
            >
              {tr("array.title")}
            </div>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-500">
                {tr("array.quantity")}
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={arrayQuantidade}
                onChange={(e) => setArrayQuantidade(Number(e.target.value))}
                className="w-full rounded-xl border px-3 py-2"
              />

              <label className="block text-xs font-semibold text-slate-500">
                {tr("array.distanceX")}
              </label>
              <input
                type="number"
                value={arrayX}
                onChange={(e) => setArrayX(Number(e.target.value))}
                className="w-full rounded-xl border px-3 py-2"
              />

              <label className="block text-xs font-semibold text-slate-500">
                {tr("array.distanceY")}
              </label>
              <input
                type="number"
                value={arrayY}
                onChange={(e) => setArrayY(Number(e.target.value))}
                className="w-full rounded-xl border px-3 py-2"
              />
              <label className="block text-xs font-semibold text-slate-400">
                {tr("array.angle")}
              </label>
              <input
                type="number"
                value={arrayAngulo}
                onChange={(e) => setArrayAngulo(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              />
              <label className="block text-xs font-semibold text-slate-500">
                {tr("array.rotationPerCopy")}
              </label>
              <input
                type="number"
                value={arrayRotacao}
                onChange={(e) => setArrayRotacao(Number(e.target.value))}
                className="w-full rounded-xl border px-3 py-2"
              />

              <label className="block text-xs font-semibold text-slate-500">
                {tr("array.scalePerCopy")}
              </label>
              <input
                type="number"
                value={arrayEscala}
                onChange={(e) => setArrayEscala(Number(e.target.value))}
                className="w-full rounded-xl border px-3 py-2"
              />

              <label className="block text-xs font-semibold text-slate-500">
                {tr("array.opacityPerCopy")}
              </label>
              <input
                type="number"
                value={arrayOpacidade}
                onChange={(e) => setArrayOpacidade(Number(e.target.value))}
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCopiasPreviewArray([]);
                  setModalArrayAberto(false);
                }}
                className="rounded-xl border px-4 py-2 text-sm font-semibold"
              >
                {tr("common.cancel")}
              </button>

              <button
                type="button"
                onClick={aplicarArrayForma}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                {tr("array.create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewAberto && (
        <div className="fixed inset-0 z-[999] bg-black/75 p-6">
          <button
            type="button"
            onClick={() => setPreviewAberto(false)}
            className="fixed right-6 top-6 z-[1000] rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-red-700"
          >
            {tr("common.closeX")}
          </button>

          <div className="flex h-full w-full items-center justify-center overflow-auto rounded-2xl bg-slate-900 p-8">
            <div
              style={{
                width: `${baseCanvas.largura * previewScale}px`,
                height: `${baseCanvas.altura * previewScale}px`,
                flexShrink: 0,
              }}
            >
              <div
                className="rounded-xl border-4 border-white shadow-2xl"
                style={{
                  width: `${baseCanvas.largura * previewScale}px`,
                  height: `${baseCanvas.altura * previewScale}px`,
                  overflow: "hidden",
                }}
              >
                <CertificadoRender
                  campos={camposPreviewCertificado as any}
                  dados={dadosPreviewCertificado}
                  templateUrl={
                    modoFundo === "modelo" && certificadoTemplateUrl
                      ? `${certificadoTemplateUrl}#toolbar=0&navpanes=0&scrollbar=0`
                      : null
                  }
                  modoFundo={modoFundo as any}
                  corFundoPagina={corFundoPagina}
                  larguraBase={baseCanvas.largura}
                  alturaBase={baseCanvas.altura}
                  escala={previewScale}
                  mostrarBordas={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {menuContexto && (
        <div
          data-menu-contexto-certificado="true"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => {
            const alvo = e.target as HTMLElement;

            if (!alvo.closest("[data-arrastar-menu-contexto]")) return;

            e.preventDefault();

            const inicioX = e.clientX;
            const inicioY = e.clientY;
            const menuInicial = { ...menuContexto };

            const mover = (ev: globalThis.MouseEvent) => {
              setMenuContexto({
                ...menuInicial,
                x: menuInicial.x + ev.clientX - inicioX,
                y: menuInicial.y + ev.clientY - inicioY,
              });
            };

            const soltar = () => {
              window.removeEventListener("mousemove", mover);
              window.removeEventListener("mouseup", soltar);
            };

            window.addEventListener("mousemove", mover);
            window.addEventListener("mouseup", soltar);
          }}
          style={{
            position: "fixed",
            top: Math.max(8, Math.min(menuContexto.y, window.innerHeight - 80)),
            left: Math.max(
              8,
              Math.min(menuContexto.x, window.innerWidth - 460),
            ),
            zIndex: 9999999,
            maxHeight: "500px",
            overflowY: "auto",
          }}
          className="bg-white border shadow-lg rounded-lg p-2 text-sm"
        >
          <div
            data-arrastar-menu-contexto
            onMouseDown={iniciarArrasteMenuContexto}
            className="mb-3 flex cursor-move select-none items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
          >
            <span>{tr("contextMenu.dragPanel")}</span>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => setMenuContexto(null)}
              className="ml-3 rounded-full bg-red-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-700"
              title={tr("common.closePanel")}
            >
              ✕
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              atualizarCamposAlvo("ordem", (campoSelecionado?.ordem || 1) + 1);
              setMenuContexto(null);
            }}

            onMouseDown={(e) => {
              const alvo = e.target as HTMLElement;

              if (!alvo.closest("[data-menu-drag-handle]")) return;

              e.preventDefault();

              const inicioX = e.clientX;
              const inicioY = e.clientY;
              const menuInicial = { ...menuContexto };

              const mover = (ev: globalThis.MouseEvent) => {
                setMenuContexto({
                  ...menuInicial,
                  x: menuInicial.x + ev.clientX - inicioX,
                  y: menuInicial.y + ev.clientY - inicioY,
                });
              };

              const soltar = () => {
                window.removeEventListener("mousemove", mover);
                window.removeEventListener("mouseup", soltar);
              };

              window.addEventListener("mousemove", mover);
              window.addEventListener("mouseup", soltar);
            }}

            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
          >
            {tr("contextMenu.moveForwardOne")}
          </button>

          <button
            type="button"
            onClick={() => {
              atualizarCamposAlvo(
                "ordem",
                Math.max(0, (campoSelecionado?.ordem || 1) - 1),
              );
              setMenuContexto(null);
            }}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
          >
            {tr("contextMenu.moveBackOne")}
          </button>

          <button
            type="button"
            onClick={() => {
              atualizarCamposAlvo("ordem", 999);
              setMenuContexto(null);
            }}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
          >
            {tr("contextMenu.bringToFront")}
          </button>

          <button
            type="button"
            onClick={() => {
              atualizarCamposAlvo("ordem", 0);
              setMenuContexto(null);
            }}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
          >
            {tr("contextMenu.sendToBack")}
          </button>

          {campoSelecionado &&
            campoSelecionado.tipo !== "FORMA" &&
            campoSelecionado.tipo !== "IMAGEM" && (
              <div className="border-t border-slate-200 px-3 py-2">
                <p className="mb-2 text-xs font-bold text-slate-500">
                  {tr("contextMenu.tagAlignment")}
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      atualizarCamposAlvo("alinhamento", "left");
                      setMenuContexto(null);
                    }}
                    className={`rounded-lg border px-2 py-1 text-xs font-bold ${campoSelecionado.alinhamento === "left" ||
                      !campoSelecionado.alinhamento
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    {tr("contextMenu.left")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      atualizarCamposAlvo("alinhamento", "center");
                      setMenuContexto(null);
                    }}
                    className={`rounded-lg border px-2 py-1 text-xs font-bold ${campoSelecionado.alinhamento === "center"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    {tr("contextMenu.center")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      atualizarCamposAlvo("alinhamento", "right");
                      setMenuContexto(null);
                    }}
                    className={`rounded-lg border px-2 py-1 text-xs font-bold ${campoSelecionado.alinhamento === "right"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    {tr("contextMenu.right")}
                  </button>
                </div>
              </div>
            )}

          <div className="border-t border-slate-200 px-3 py-2">
            <p className="mb-2 text-xs font-bold text-slate-500">
              {tr("contextMenu.markers")}
            </p>

            <div className="space-y-1">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  aplicarEstiloTextoSelecionado({
                    display: "list-item",
                    listStyleType: "disc",
                    marginLeft: "20px",
                  });
                  setMenuContexto(null);
                }}
              >
                {tr("contextMenu.bulletSelection")}
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  aplicarEstiloTextoSelecionado({
                    display: "list-item",
                    listStyleType: "'▸ '",
                    marginLeft: "20px",
                  } as React.CSSProperties);
                  setMenuContexto(null);
                }}
              >
                {tr("contextMenu.arrowSelection")}
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  aplicarEstiloTextoSelecionado({
                    display: "list-item",
                    listStyleType: "'– '",
                    marginLeft: "20px",
                  } as React.CSSProperties);
                  setMenuContexto(null);
                }}
              >
                {tr("contextMenu.dashSelection")}
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  document.execCommand("removeFormat");
                  setMenuContexto(null);
                }}
                className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-slate-100"
              >
                {tr("contextMenu.noMarker")}
              </button>
            </div>
          </div>

          <hr className="my-1" />

          <hr className="my-1" />

          <button
            type="button"
            onClick={() => {
              agruparCamposSelecionados();
              setMenuContexto(null);
            }}
            disabled={camposSelecionadosIds.length < 2}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 disabled:!bg-slate-700 disabled:!text-slate-300"
          >
            {tr("contextMenu.groupSelection")}
          </button>

          <button
            type="button"
            onClick={() => {
              desagruparCampoSelecionado();
              setMenuContexto(null);
            }}
            disabled={!campoSelecionado?.grupoId}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 disabled:!bg-slate-700 disabled:!text-slate-300"
          >
            {tr("contextMenu.ungroup")}
          </button>

          {campoSelecionado?.grupoId?.startsWith("array-") && (
            <button
              type="button"
              onClick={() => {
                desagruparCampoSelecionado();
                setMenuContexto(null);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
            >
              {tr("contextMenu.separateArray")}
            </button>
          )}

          {campoSelecionado?.tipo === "FORMA" &&
            !(campoSelecionado as any)?.grupoId && (
              <button
                type="button"
                onClick={() => {
                  setModalArrayAberto(true);
                  trazerPainelFlutuanteParaFrente("arrayModal");
                  setMenuContexto(null);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
              >
                {tr("contextMenu.array")}
              </button>
            )}

          {campoSelecionado?.tipo === "TEXTO_LIVRE" && (
            <>
              <hr className="my-1" />

              <div className="px-3 py-2">
                <label className="mb-2 block text-xs font-bold text-slate-500">
                  {tr("contextMenu.selectionColor")}
                </label>

                <input
                  type="color"
                  onMouseDown={(e) => e.preventDefault()}
                  onChange={(e) => {
                    aplicarEstiloTextoSelecionado({ color: e.target.value });
                    setMenuContexto(null);
                  }}
                  className="h-10 w-full rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  aplicarEstiloTextoSelecionado({ fontSize: "30px" });
                  setMenuContexto(null);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
              >
                {tr("contextMenu.increaseSelection")}
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  aplicarEstiloTextoSelecionado({ fontWeight: "700" });
                  setMenuContexto(null);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
              >
                <b>B</b>
                {tr("contextMenu.boldSelection")}
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  aplicarEstiloTextoSelecionado({ fontStyle: "italic" });
                  setMenuContexto(null);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
              >
                <i>I</i>
                {tr("contextMenu.italicSelection")}
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  aplicarEstiloTextoSelecionado({
                    textDecoration: "underline",
                  });
                  setMenuContexto(null);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
              >
                <u>U</u>
                {tr("contextMenu.underlineSelection")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (campoSelecionado?.tipo === "TEXTO_LIVRE") {
                    if (!temSelecaoTextoLivreSalva()) return;

                    const blur = campoSelecionado?.sombraBlur ?? 6;
                    const cor = campoSelecionado?.sombraCor || "#000000";
                    const opacidade =
                      (campoSelecionado?.sombraOpacidade ?? 65) / 100;

                    const { x, y } = calcularSombra(
                      (campoSelecionado as any)?.sombraAngulo ?? 45,
                      (campoSelecionado as any)?.sombraDistancia ?? 3,
                    );

                    aplicarEstiloTextoSelecionado({
                      textShadow: `${x}px ${y}px ${blur}px ${hexToRgba(cor, opacidade)}`,
                    });

                    setMenuContexto(null);
                    return;
                  }

                  const ids = idsAlvoDaAcao();

                  setCampos((prev) =>
                    prev.map((campo) =>
                      ids.includes(campo.id)
                        ? {
                          ...campo,
                          sombraAtiva: !campo.sombraAtiva,
                          sombraAngulo: campo.sombraAngulo ?? 45,
                          sombraDistancia: campo.sombraDistancia ?? 8,
                          sombraX: campo.sombraX ?? 6,
                          sombraY: campo.sombraY ?? 6,
                          sombraBlur: campo.sombraBlur ?? 10,
                          sombraCor: campo.sombraCor || "#000000",
                          sombraOpacidade: campo.sombraOpacidade ?? 45,
                        }
                        : campo,
                    ),
                  );

                  setMenuContexto(null);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
              >
                {tr("contextMenu.dropShadow")}
              </button>

              <div className="px-3 py-2">
                <p className="mb-2 text-xs font-bold text-slate-500">
                  {tr("contextMenu.textOutline")}
                </p>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    alternarContornoTextoCampoSelecionado();
                    setContornoTextoAtivo((prev) => !prev);
                  }}
                  className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50"
                >
                  {contornoTextoAtivo
                    ? tr("shapeAppearance.disableOutline")
                    : tr("shapeAppearance.enableOutline")}
                </button>

                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                  {tr("shapeAppearance.outlineColor")}
                </label>
                <input
                  type="color"
                  value={corContornoTexto}
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const novaCor = e.target.value;
                    setCorContornoTexto(novaCor);
                    atualizarContornoTextoCampoSelecionado({
                      contornoTextoCor: novaCor,
                    });

                    if (!temSelecaoTextoLivreSalva()) return;

                    const sombraContorno =
                      tipoContornoTexto === "externo"
                        ? `
      ${espessuraContornoTexto}px 0 0 ${novaCor},
      -${espessuraContornoTexto}px 0 0 ${novaCor},
      0 ${espessuraContornoTexto}px 0 ${novaCor},
      0 -${espessuraContornoTexto}px 0 ${novaCor}
    `
                        : "none";

                    aplicarEstiloTextoSelecionado({
                      WebkitTextStrokeColor: novaCor,
                      WebkitTextStrokeWidth:
                        tipoContornoTexto === "interno"
                          ? `${espessuraContornoTexto}px`
                          : "0px",

                      paintOrder: "stroke fill",

                      textShadow: sombraContorno,
                    } as React.CSSProperties);
                  }}
                  className="mb-3 h-9 w-full cursor-pointer rounded-lg border"
                />

                <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                  {tr("shapeAppearance.outlineThickness")}
                </label>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={espessuraContornoTexto}
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const novaEspessura = Number(e.target.value);
                    setEspessuraContornoTexto(novaEspessura);

                    atualizarContornoTextoCampoSelecionado({
                      contornoTextoEspessura: novaEspessura,
                    });

                    if (!temSelecaoTextoLivreSalva()) return;

                    aplicarEstiloTextoSelecionado({
                      WebkitTextStrokeColor: corContornoTexto,
                      WebkitTextStrokeWidth: `${novaEspessura}px`,
                      paintOrder: "stroke fill",
                    } as React.CSSProperties);
                  }}
                  className="w-full"
                />
              </div>
            </>
          )}

          <div className="my-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTipoContornoTexto("externo");

                atualizarContornoTextoCampoSelecionado({
                  contornoTextoTipo: "externo",
                  contornoTextoCor: corContornoTexto,
                  contornoTextoEspessura: espessuraContornoTexto,
                });

                if (temSelecaoTextoLivreAtiva()) {
                  aplicarContornoTextoSelecionado(
                    corContornoTexto,
                    espessuraContornoTexto,
                    "externo",
                  );
                }
              }}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${tipoContornoTexto === "externo"
                ? "bg-blue-600 text-white"
                : "border border-slate-600 text-slate-200"
                }`}
            >
              {tr("shapeAppearance.external")}
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoContornoTexto("interno");

                atualizarContornoTextoCampoSelecionado({
                  contornoTextoTipo: "interno",
                  contornoTextoCor: corContornoTexto,
                  contornoTextoEspessura: espessuraContornoTexto,
                });

                if (temSelecaoTextoLivreAtiva()) {
                  aplicarContornoTextoSelecionado(
                    corContornoTexto,
                    espessuraContornoTexto,
                    "interno",
                  );
                }
              }}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${tipoContornoTexto === "interno"
                ? "bg-blue-600 text-white"
                : "border border-slate-600 text-slate-200"
                }`}
            >
              {tr("shapeAppearance.internal")}
            </button>
          </div>

          <hr className="my-1" />

          <div className="py-3">
            <label className="mb-1 block text-xs font-semibold">
              {tr("text.lineSpacing")}
            </label>

            <input
              type="range"
              min={0.8}
              max={3}
              step={0.05}
              value={campoSelecionado?.lineHeight ?? 1.3}
              onChange={(e) => {
                const valor = Number(e.target.value);

                if (
                  campoSelecionado?.tipo === "TEXTO_LIVRE" &&
                  temSelecaoTextoLivreSalva()
                ) {
                  aplicarEstiloTextoSelecionado({
                    lineHeight: String(valor),
                  });
                  return;
                }

                atualizarCamposAlvo("lineHeight", valor as any);
              }}
              className="w-full"
            />

            <div className="mt-1 text-[10px] font-semibold text-slate-400">
              {tr("common.currentColon")} {(campoSelecionado?.lineHeight ?? 1.3).toFixed(2)}
            </div>

            <label className="mb-1 mt-3 block text-xs font-semibold">
              {tr("text.letterSpacing")}
            </label>

            <input
              type="range"
              min={-5}
              max={30}
              step={1}
              value={(campoSelecionado as any)?.letterSpacing ?? 0}
              onChange={(e) => {
                const valor = Number(e.target.value);
                setEspacamentoLetrasTexto(valor);

                if (
                  campoSelecionado?.tipo === "TEXTO_LIVRE" &&
                  temSelecaoTextoLivreSalva()
                ) {
                  aplicarEstiloTextoSelecionado({
                    letterSpacing: `${valor}px`,
                  });
                  return;
                }

                atualizarCamposAlvo("letterSpacing" as any, valor);
              }}
              className="w-full"
            />

            <label className="mb-1 mt-3 block text-xs font-semibold">
              {tr("text.wordSpacing")}
            </label>

            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={(campoSelecionado as any)?.wordSpacing ?? 0}
              onChange={(e) => {
                const valor = Number(e.target.value);
                setEspacamentoPalavrasTexto(valor);

                if (
                  campoSelecionado?.tipo === "TEXTO_LIVRE" &&
                  temSelecaoTextoLivreSalva()
                ) {
                  aplicarEstiloTextoSelecionado({
                    wordSpacing: `${valor}px`,
                  });
                  return;
                }

                atualizarCamposAlvo("wordSpacing" as any, valor);
              }}
              className="w-full"
            />
          </div>

          <hr className="my-1" />

          <button
            onClick={() => {
              setMenuContexto(null);
            }}
            className="block w-full text-left px-3 py-1 hover:bg-gray-100"
          >
            {tr("contextMenu.noMarker")}
          </button>

          <button
            onClick={() => {
              inserirMarcadorTextoSelecionado("• ");
              setMenuContexto(null);
            }}
            className="block w-full text-left px-3 py-1 hover:bg-gray-100"
          >
            {tr("text.markerBullet")}
          </button>

          <button
            onClick={() => {
              inserirMarcadorTextoSelecionado("➤ ");
              setMenuContexto(null);
            }}
            className="block w-full text-left px-3 py-1 hover:bg-gray-100"
          >
            {tr("text.markerArrow")}
          </button>

          <button
            onClick={() => {
              inserirMarcadorTextoSelecionado("- ");
              setMenuContexto(null);
            }}
            className="block w-full text-left px-3 py-1 hover:bg-gray-100"
          >
            {tr("text.markerSmallDash")}
          </button>
        </div>
      )}

      {modalEditarModeloAberto && (
        <div
          className="fixed inset-0 z-[10000010] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          onMouseDown={() => {
            if (!salvandoDadosModelo) {
              setModalEditarModeloAberto(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-editar-modelo-certificado"
            className="phanyx-cert-modelo-modal w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl"
            onMouseDown={(evento) => {
              evento.stopPropagation();
            }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-700 px-6 py-5">
              <div>
                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-800">
                  {tr("models.certificateModel")}
                </span>

                <h2
                  id="titulo-editar-modelo-certificado"
                  className="mt-3 text-xl font-black"
                >
                  {tr("modelEdit.title")}
                </h2>

                <p className="mt-1 text-sm text-slate-300">
                  {tr("modelEdit.description")}
                </p>
              </div>

              <button
                type="button"
                aria-label={tr("common.close")}
                disabled={salvandoDadosModelo}
                onClick={() => {
                  setModalEditarModeloAberto(false);
                }}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-600 text-xl font-bold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="nome-modelo-certificado"
                    className="text-sm font-bold"
                  >
                    {tr("models.name")}
                  </label>

                  <span className="text-xs text-slate-400">
                    {nomeModeloEditando.length}/120
                  </span>
                </div>

                <input
                  id="nome-modelo-certificado"
                  type="text"
                  value={nomeModeloEditando}
                  maxLength={120}
                  disabled={salvandoDadosModelo}
                  onChange={(evento) => {
                    setNomeModeloEditando(evento.target.value);
                  }}
                  placeholder={tr("models.exampleExtensionCertificate")}
                  className="phanyx-cert-modelo-modal-input w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="descricao-modelo-certificado"
                    className="text-sm font-bold"
                  >
                    {tr("common.description")}
                  </label>

                  <span className="text-xs text-slate-400">
                    {descricaoModeloEditando.length}/500
                  </span>
                </div>

                <textarea
                  id="descricao-modelo-certificado"
                  value={descricaoModeloEditando}
                  maxLength={500}
                  rows={4}
                  disabled={salvandoDadosModelo}
                  onChange={(evento) => {
                    setDescricaoModeloEditando(evento.target.value);
                  }}
                  placeholder={tr("modelEdit.descriptionPlaceholder")}
                  className="phanyx-cert-modelo-modal-input w-full resize-none rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label
                  htmlFor="modalidade-modelo-certificado"
                  className="mb-2 block text-sm font-bold"
                >
                  {tr("models.modelModality")}
                </label>

                <select
                  id="modalidade-modelo-certificado"
                  value={modalidadeModeloEditando}
                  disabled={salvandoDadosModelo}
                  onChange={(evento) => {
                    const modalidade = evento.target
                      .value as ModalidadeCertificadoValor;

                    setModalidadeModeloEditando(modalidade);

                    if (modalidade === "GERAL") {
                      setPadraoModalidadeModeloEditando(false);
                    }
                  }}
                  className="phanyx-curso-modalidade-select phanyx-certificado-modalidade-select phanyx-cert-modelo-modal-input w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {MODALIDADES_CERTIFICADO.map((item) => (
                    <option key={item.valor} value={item.valor}>
                      {traduzirModalidadeCertificado(item.valor)}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-slate-400">
                  {tr("modelEdit.modalityHint")}
                </p>
              </div>

              <label
                className={`flex items-start gap-3 rounded-xl border p-4 transition ${modalidadeModeloEditando === "GERAL"
                  ? "cursor-not-allowed border-slate-700 bg-slate-800/60 opacity-60"
                  : "cursor-pointer border-slate-600 bg-slate-950"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={padraoModalidadeModeloEditando}
                  disabled={
                    salvandoDadosModelo || modalidadeModeloEditando === "GERAL"
                  }
                  onChange={(evento) => {
                    setPadraoModalidadeModeloEditando(evento.target.checked);
                  }}
                  className="mt-1 h-4 w-4"
                />

                <span>
                  <span className="block text-sm font-bold text-white">
                    {tr("models.defaultForModality")}
                  </span>

                  <span className="mt-1 block text-xs text-slate-400">
                    {tr("modelEdit.defaultHint")}
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-700 bg-slate-950/40 px-6 py-5">
              <button
                type="button"
                disabled={salvandoDadosModelo}
                onClick={() => {
                  setModalEditarModeloAberto(false);
                }}
                className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-bold text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tr("common.cancel")}
              </button>

              <button
                type="button"
                disabled={
                  salvandoDadosModelo || nomeModeloEditando.trim().length < 3
                }
                onClick={() => {
                  void salvarDadosModeloAtual();
                }}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvandoDadosModelo ? tr("common.saving") : tr("modelEdit.saveChanges")}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalArquivarModeloAberto && (
        <div
          className="fixed inset-0 z-[10000010] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          onMouseDown={() => {
            if (!arquivandoModelo) {
              setModalArquivarModeloAberto(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-arquivar-modelo-certificado"
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl"
            onMouseDown={(evento) => {
              evento.stopPropagation();
            }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-700 px-6 py-5">
              <div>
                <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-800">
                  {tr("archive.badge")}
                </span>

                <h2
                  id="titulo-arquivar-modelo-certificado"
                  className="mt-3 text-xl font-black"
                >
                  {tr("archive.title")}
                </h2>

                <p className="mt-1 text-sm text-slate-300">
                  {tr("archive.description")}
                </p>
              </div>

              <button
                type="button"
                aria-label={tr("common.close")}
                disabled={arquivandoModelo}
                onClick={() => {
                  setModalArquivarModeloAberto(false);
                }}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-600 text-xl font-bold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {tr("archive.selectedModel")}
                </p>

                <p className="mt-1 text-lg font-black text-white">
                  {modeloAtivo?.nome || tr("models.certificateModel")}
                </p>

                {modeloAtivo?.descricao && (
                  <p className="mt-1 text-sm text-slate-300">
                    {modeloAtivo.descricao}
                  </p>
                )}
              </div>

              {modeloAtivo?.padraoGeral && (
                <div className="rounded-2xl border border-amber-400 bg-amber-50 p-4 text-amber-950">
                  <p className="font-bold">
                    {tr("archive.defaultWarningTitle")}
                  </p>

                  <p className="mt-1 text-sm">
                    {tr("archive.defaultWarningDescription")}
                  </p>
                </div>
              )}

              <p className="text-sm text-slate-300">
                {tr("archive.linkedCourseWarning")}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-700 bg-slate-950/40 px-6 py-5">
              <button
                type="button"
                disabled={arquivandoModelo}
                onClick={() => {
                  setModalArquivarModeloAberto(false);
                }}
                className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-bold text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tr("common.cancel")}
              </button>

              <button
                type="button"
                disabled={arquivandoModelo}
                onClick={() => {
                  void arquivarModeloAtual();
                }}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {arquivandoModelo ? tr("archive.archiving") : tr("archive.archiveModel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalArquivadosAberto && (
        <div
          className="fixed inset-0 z-[10000000] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          onMouseDown={() => {
            if (restaurandoModeloId === null) {
              setModalArquivadosAberto(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modelos-arquivados"
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            onMouseDown={(evento) => {
              evento.stopPropagation();
            }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
              <div>
                <span className="mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {tr("archived.badge")}
                </span>

                <h2
                  id="titulo-modelos-arquivados"
                  className="text-xl font-black !text-slate-900 dark:!text-white"
                >
                  {tr("models.archived")}
                </h2>

                <p className="mt-1 text-sm !text-slate-600 dark:!text-slate-300">
                  {tr("archived.description")}
                </p>
              </div>

              <button
                type="button"
                disabled={restaurandoModeloId !== null}
                onClick={() => setModalArquivadosAberto(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-xl font-bold !text-slate-500 transition hover:bg-slate-100 hover:!text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:!text-slate-300 dark:hover:bg-slate-800 dark:hover:!text-white"
                aria-label={tr("archived.closeAria")}
              >
                ×
              </button>
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto px-6 py-5">
              {modelosArquivados.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="font-bold !text-slate-700 dark:!text-slate-200">
                    {tr("archived.emptyTitle")}
                  </p>

                  <p className="mt-1 text-sm !text-slate-500 dark:!text-slate-400">
                    {tr("archived.emptyDescription")}
                  </p>
                </div>
              ) : (
                modelosArquivados.map((modelo: any) => {
                  const modeloId = Number(modelo?.id);
                  const restaurandoEsteModelo =
                    restaurandoModeloId === modeloId;

                  return (
                    <div
                      key={modeloId}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800/70"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-black !text-slate-900 dark:!text-white">
                          {String(modelo?.nome || tr("archived.unnamedModel"))}
                        </p>

                        <p className="mt-1 text-xs font-bold uppercase tracking-wide !text-slate-500 dark:!text-slate-400">
                          {traduzirModalidadeCertificado(modelo?.modalidade)}
                        </p>

                        {modelo?.descricao && (
                          <p className="mt-2 text-sm !text-slate-600 dark:!text-slate-300">
                            {String(modelo.descricao)}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={restaurandoModeloId !== null}
                        onClick={() => restaurarModeloArquivado(modelo)}
                        className="inline-flex min-w-[130px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {restaurandoEsteModelo ? tr("archived.restoring") : tr("archived.restore")}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-700 dark:bg-slate-950/40">
              <button
                type="button"
                disabled={restaurandoModeloId !== null}
                onClick={() => setModalArquivadosAberto(false)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold !text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:!text-white dark:hover:bg-slate-700"
              >
                {tr("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalPublicacaoAberto && (
        <div
          className="fixed inset-0 z-[10000000] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          onMouseDown={() => {
            if (!publicando) {
              setModalPublicacaoAberto(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-publicar-certificado"
            className="phanyx-cert-publicar-modal w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white !text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:!text-white"
            onMouseDown={(evento) => {
              evento.stopPropagation();
            }}
          >
            <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="mb-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
                    {tr("publish.badge")}
                  </span>

                  <h2
                    id="titulo-publicar-certificado"
                    className="text-xl font-black !text-slate-900 dark:!text-white"
                  >
                    {tr("publish.title")}
                  </h2>
                </div>

                <button
                  type="button"
                  disabled={publicando}
                  onClick={() => setModalPublicacaoAberto(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-xl font-bold !text-slate-500 transition hover:bg-slate-100 hover:!text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:!text-slate-300 dark:hover:bg-slate-800 dark:hover:!text-white"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <p className="text-sm leading-6 !text-slate-700 dark:!text-slate-300">
                {tr("publish.description")}
              </p>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <strong>
                  {tr("common.attentionColon")}
                </strong>{" "}
                {tr("publish.studentsUseAfterPublish")}
              </div>

              <p className="text-xs leading-5 !text-slate-600 dark:!text-slate-400">
                {tr("publish.existingPdfNotice")}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 !bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end dark:border-slate-700 dark:!bg-slate-950/40">
              <button
                type="button"
                disabled={publicando}
                onClick={() => setModalPublicacaoAberto(false)}
                className="rounded-xl border border-slate-300 !bg-white px-5 py-3 text-sm font-bold !text-slate-700 transition hover:!bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:!bg-slate-800 dark:!text-white dark:hover:!bg-slate-700"
              >
                {tr("common.cancel")}
              </button>

              <button
                type="button"
                disabled={publicando}
                onClick={publicarModeloFinal}
                className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {publicando ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950"
                      aria-hidden="true"
                    />
                    {tr("publish.publishing")}
                  </>
                ) : (
                  tr("publish.confirm")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
