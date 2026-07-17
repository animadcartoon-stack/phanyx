"use client";

import Image from "next/image";
import FormaVetorial from "./components/FormaVetorial";
import FloatingShapeInspector from "./components/FloatingShapeInspector";
import PhanyxToast from "@/components/ui/PhanyxToast";
import CertificadoRender from "@/components/certificados/CertificadoRender";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";


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
  pontosForma?: {
  id: string;
  x: number;
  y: number;
  tipo?: "reto" | "curvo";
  inX?: number;
  inY?: number;
  outX?: number;
  outY?: number;
}[] | null;

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
        Math.max(0, Math.min(255, valor))
          .toString(16)
          .padStart(2, "0")
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
  if (normalizado === "traco" || normalizado === "traço" || normalizado === "tracinho") {
    return "-";
  }

  return marcador;
}

function quantidadeDisciplinasDoCampo(campo: Partial<CampoCertificado>) {
  const quantidade = Number((campo as any)?.quantidadeDisciplinas ?? 3);

  if (!Number.isFinite(quantidade)) return 3;

  return Math.max(1, Math.min(80, Math.round(quantidade)));
}

function textoDisciplinasExemplo(campo: Partial<CampoCertificado>) {
  const quantidade = quantidadeDisciplinasDoCampo(campo);
    const marcador = normalizarMarcadorDisciplinas(
    campo.marcador ?? campo.dadosJson?.marcador
  );

  return Array.from({ length: quantidade })
    .map((_, index) =>
      marcador
        ? `${marcador} Disciplina ${index + 1}`
        : `Disciplina ${index + 1}`
    )
    .join("\n");
}

function quantidadeColunasDisciplinasDoCampo(campo: Partial<CampoCertificado>) {
  const colunas = Number((campo as any)?.colunasDisciplinas ?? 1);

  if (!Number.isFinite(colunas)) return 1;

  return Math.max(1, Math.min(4, Math.round(colunas)));
}

function listaDisciplinasExemplo(campo: Partial<CampoCertificado>) {
  const quantidade = quantidadeDisciplinasDoCampo(campo);
    const marcador = normalizarMarcadorDisciplinas(
    campo.marcador ?? campo.dadosJson?.marcador
  );

  return Array.from({ length: quantidade }).map((_, index) =>
    marcador
      ? `${marcador} Disciplina ${index + 1}`
      : `Disciplina ${index + 1}`
  );
}

function espacoColunasDisciplinasDoCampo(campo: Partial<CampoCertificado>) {
  const espaco = Number((campo as any)?.espacoColunasDisciplinas ?? 12);

  if (!Number.isFinite(espaco)) return 12;

  return Math.max(0, Math.min(80, Math.round(espaco)));
}

function renderDisciplinasCampo(campo: CampoCertificado) {
  const colunas = quantidadeColunasDisciplinasDoCampo(campo);
  const espacoColunas = espacoColunasDisciplinasDoCampo(campo);
  const disciplinas = listaDisciplinasExemplo(campo);

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

  return rgbToHex(
    Number(match[0]),
    Number(match[1]),
    Number(match[2])
  );
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
    const opacidade = normalizarOpacidadeEfeito(
      campo.sombraOpacidade,
      0.35
    );

    const distancia =
      campo.sombraDistancia !== null &&
      campo.sombraDistancia !== undefined
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
      contornoAtivo && contornoTipo === "interno"
        ? contornoCor
        : "transparent",

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
    const angulo =
      (Math.PI * i) / pontas - Math.PI / 2;

    const raio =
      i % 2 === 0
        ? raioExterno
        : raioInterno;

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

export default function ConfiguracaoCertificadoPage() {

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

  const [arrayJanelaPos, setArrayJanelaPos] = useState({
  x: 180,
  y: 180,
});

  const [arrastandoArray, setArrastandoArray] = useState(false);
  const [arrayAngulo, setArrayAngulo] = useState(0);

  const historicoTextoLivreRef = useRef<Record<number, string[]>>({});

  const [tipoContornoTexto, setTipoContornoTexto] = useState<"interno" | "externo">("externo");
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
        : campo
    )
  );
}

function desagruparCampoSelecionado() {
  if (!campoSelecionado) return;

  registrarHistoricoAntesDaAcao();

  const grupoId = campoSelecionado.grupoId;
  if (!grupoId) return;

  setCampos((prev) =>
    prev.map((campo) =>
      campo.grupoId === grupoId ? { ...campo, grupoId: null } : campo
    )
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
    | CampoCertificado[]
    | ((prev: CampoCertificado[]) => CampoCertificado[])
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

function gerarPontosEstrela(
  pontas = 5,
  raioInterno = 35,
  raioExterno = 50
) {
  const pontos = [];

  const total = pontas * 2;

  for (let i = 0; i < total; i++) {
    const angulo = (Math.PI * 2 * i) / total - Math.PI / 2;

    const raio =
      i % 2 === 0
        ? raioExterno
        : raioInterno;

    pontos.push({
      id: crypto.randomUUID(),
      x: 50 + Math.cos(angulo) * raio,
      y: 50 + Math.sin(angulo) * raio,
      tipo: "reto",
    });
  }

  return pontos;
}

  const [camposSelecionadosIds, setCamposSelecionadosIds] = useState<number[]>([]); 
  const [campoSelecionadoId, setCampoSelecionadoId] = useState<number | null>(
    null
  );
  
  const [pontoFormaSelecionado, setPontoFormaSelecionado] = useState<{
  campoId: number;
  pontoId: string;
} | null>(null);

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

    if (
      tag === "input" ||
      tag === "textarea" ||
      alvo?.isContentEditable
    ) {
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
        camposAtuais.filter((campo) => campo.id !== -999999)
      );

      setMensagemSucesso("Criação da forma livre cancelada.");
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

  setCampos((prev) =>
    prev.filter((campo) => campo.id !== -999999)
  );

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
    nomeCamada: "Forma livre em criação",
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
        nomeCamada: "Forma livre",
      },
    ]);

    setCampoSelecionadoId(novoId);
    setCamposSelecionadosIds([novoId]);
    setModoFormaLivre(false);
    setPontosFormaLivre([]);
    setMensagemSucesso("Forma livre criada. Agora você pode editar pontos e tangentes.");

    return true;
  }

  setPontosFormaLivre(proximosPontos);

  setCampos((prev) => [
    ...prev.filter((campo) => campo.id !== -999999),
    criarCampoPreviewFormaLivre(proximosPontos),
  ]);

  setMensagemSucesso(`Ponto ${proximosPontos.length} criado.`);

  return true;
}

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [salvandoCampo, setSalvandoCampo] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");
  const [orientacao, setOrientacao] = useState<OrientacaoEditor>("paisagem");
  const [tamanhoPapel, setTamanhoPapel] = useState<"A5" | "A4" | "A3">("A4");
  const [modoCorDocumento, setModoCorDocumento] = useState<"RGB" | "CMYK">("RGB");
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
  painel: "barraSelecao" | "opcoesForma" | "arrayModal"
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

  const [camadaArrastandoId, setCamadaArrastandoId] = useState<number | null>(null);
  const [camadaRenomeandoId, setCamadaRenomeandoId] = useState<number | null>(null);
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

  const [inicioArrastoCanvas, setInicioArrastoCanvas] = useState({ x: 0, y: 0 });
  const [corTextoSelecionado, setCorTextoSelecionado] = useState<string | null>(null);
  
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
  altura = 180
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

  setCampoSelecionadoId(novoId);
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
      throw new Error(data?.error || "Erro ao enviar imagem.");
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
    setMensagemErro(error?.message || "Erro ao enviar imagem.");
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
  function calcularOffsetTexto(root: HTMLElement, node: Node, offset: number) {
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

    const editor = inicioEl?.closest("[data-texto-livre-id]") as HTMLElement | null;

    if (!editor) return;

    const campoId = Number(editor.getAttribute("data-texto-livre-id"));

    const inicio = calcularOffsetTexto(
      editor,
      range.startContainer,
      range.startOffset
    );

    const fim = calcularOffsetTexto(
      editor,
      range.endContainer,
      range.endOffset
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

const elementoFinalCor =
  elementoCor?.closest("span") || elementoCor;

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
} | null>(null);;

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

const podeUsarEditorCertificados =
  planoInstituicao === "PROFISSIONAL" || planoInstituicao === "ENTERPRISE";

  useEffect(() => {
  async function carregarConfiguracao() {
    try {
      const [resConfig, resCampos, resInstituicao] = await Promise.all([
  fetch("/api/admin/configuracoes/certificado", {
    cache: "no-store",
  }),
  fetch("/api/admin/certificado-campos", {
    cache: "no-store",
  }),
  fetch("/api/admin/configuracoes/instituicao", {
    cache: "no-store",
  }),
]);
      const dataConfig = await resConfig.json();
      const dataCampos = await resCampos.json();
      const dataInstituicao = await resInstituicao.json();

      if (!resConfig.ok) {
        setMensagemErro(
  dataConfig?.detalhe ||
    dataConfig?.error ||
    "Erro ao buscar configuração."
);
        return;
      }

      if (!resCampos.ok) {
        setMensagemErro(
  dataCampos?.detalhe ||
    dataCampos?.error ||
    "Erro ao buscar campos."
);
        return;
      }

      setCertificadoTemplateUrl(dataConfig?.certificadoTemplateUrl || "");
      setCertificadoPreviewUrl(dataConfig?.certificadoPreviewUrl || "");

      setCertificadoCoordenadorNome(
  dataConfig?.certificadoCoordenadorNome || ""
);

setCertificadoCidade(dataConfig?.certificadoCidade || "");

if (
  dataConfig?.certificadoModoFundo === "modelo" ||
  dataConfig?.certificadoModoFundo === "phanyx" ||
  dataConfig?.certificadoModoFundo === "cor"
) {
  setModoFundo(
    dataConfig.certificadoModoFundo === "cor"
      ? "phanyx"
      : dataConfig.certificadoModoFundo
  );
}

if (dataConfig?.certificadoCorFundoPagina) {
  setCorFundoPagina(dataConfig.certificadoCorFundoPagina);
}

if (
  dataConfig?.certificadoTamanhoPapel === "A5" ||
  dataConfig?.certificadoTamanhoPapel === "A4" ||
  dataConfig?.certificadoTamanhoPapel === "A3"
) {
  setTamanhoPapel(dataConfig.certificadoTamanhoPapel);
}

if (
  dataConfig?.certificadoOrientacao === "paisagem" ||
  dataConfig?.certificadoOrientacao === "retrato"
) {
  setOrientacao(dataConfig.certificadoOrientacao);
}
      setCertificadoAssinaturaUrl(
  dataInstituicao?.certificadoAssinaturaUrl ||
    dataInstituicao?.configuracaoInstituicao?.certificadoAssinaturaUrl ||
    dataConfig?.certificadoAssinaturaUrl ||
    ""
);

setNomeDiretorInstituicao(
  dataInstituicao?.responsavelNome || dataConfig?.certificadoCoordenadorNome || ""
);
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
    : []
);
    } catch {
      setMensagemErro("Erro ao carregar configuração do certificado.");
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

    if (e.code === "Space") {
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
    (campo) => campo.id === pontoFormaSelecionado.campoId
  );

  const pontos = Array.isArray((campoForma as any)?.pontosForma)
    ? ((campoForma as any).pontosForma as any[])
    : [];

  const pontoExiste = pontos.some(
    (ponto) => ponto.id === pontoFormaSelecionado.pontoId
  );

  if (campoForma?.tipo === "FORMA" && pontoExiste) {
    e.preventDefault();

    const minimo = campoForma.forma === "LINHA" ? 2 : 3;

    if (pontos.length <= minimo) {
      setMensagemErro(
        campoForma.forma === "LINHA"
          ? "A linha precisa ter pelo menos 2 pontos."
          : "A forma precisa ter pelo menos 3 pontos."
      );

      setTimeout(() => setMensagemErro(""), 2500);
      return;
    }

    const novosPontos = pontos.filter(
      (ponto) => ponto.id !== pontoFormaSelecionado.pontoId
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
          : campo
      )
    );

    setPontoFormaSelecionado(null);
    setMensagemSucesso("Ponto removido.");
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
    if (e.code === "Space") {
      e.preventDefault();
      setEspacoPressionado(false);
    }
  }

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  };
}, [campoSelecionadoId, camposSelecionadosIds, campos, pontoFormaSelecionado]);

  const baseCanvas = TAMANHOS_PAPEL[tamanhoPapel][orientacao];

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
    alturaMaxima / baseCanvas.altura
  );
}, [baseCanvas.largura, baseCanvas.altura]);

  const campoSelecionado = useMemo(

    () => campos.find((campo) => campo.id === campoSelecionadoId) || null,
    [campos, campoSelecionadoId]
  );

  function atualizarColunasDisciplinasCampo(valor: number) {
  if (!campoSelecionado || campoSelecionado.tipo !== "DISCIPLINAS_CONCLUIDAS") {
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
          Math.ceil(linhasVisuais * tamanho * lineHeight + 18)
        ),
        dadosJson: {
          ...((campo as any).dadosJson || {}),
          quantidadeDisciplinas: quantidade,
          colunasDisciplinas: colunas,
          lineHeight,
        },
      };
    })
  );
}

function atualizarEspacoColunasDisciplinasCampo(valor: number) {
  if (!campoSelecionado || campoSelecionado.tipo !== "DISCIPLINAS_CONCLUIDAS") {
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
    })
  );
}

function atualizarQuantidadeDisciplinasCampo(valor: number) {
  if (!campoSelecionado || campoSelecionado.tipo !== "DISCIPLINAS_CONCLUIDAS") {
    return;
  }

  const quantidade = Math.max(1, Math.min(80, Math.round(Number(valor || 1))));

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
          Math.ceil(linhasVisuais * tamanho * lineHeight + 18)
        ),
        dadosJson: {
          ...((campo as any).dadosJson || {}),
          quantidadeDisciplinas: quantidade,
          colunasDisciplinas: colunas,
          lineHeight,
        },
      };
    })
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
            item.grupoId === campo.grupoId && !(item as any).arrayPreview
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
      (campo) => Number(campo.x || 0) + Number(campo.largura || 120)
    )
  );

  const maxY = Math.max(
    ...itens.map(
      (campo) => Number(campo.y || 0) + Number(campo.altura || 40)
    )
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
      setMensagemErro("Selecione um arquivo PDF do modelo antes de enviar.");
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
        setMensagemErro(data?.detalhe || data?.error || "Erro ao enviar arquivo.");
        return;
      }

      setCertificadoTemplateUrl(data.url || "");
      
      setCertificadoPreviewUrl(
  data.previewUrl ||
    data.certificadoPreviewUrl ||
    ""
);

setMensagemSucesso("Modelo do certificado enviado com sucesso.");
    } catch {
      setMensagemErro("Erro ao fazer upload do modelo.");
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
        setMensagemErro(data?.detalhe || data?.error || "Erro ao salvar.");
        return;
      }

      setMensagemSucesso("Configuração do certificado salva com sucesso.");
    } catch {
      setMensagemErro("Erro ao salvar configuração do certificado.");
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
      ? "Digite seu título"
      : "Digite seu texto"
    : undefined,
textoTipo: tipo === "TEXTO_LIVRE" ? textoTipo || "TEXTO" : undefined,
negrito: tipo === "TEXTO_LIVRE" && textoTipo === "TITULO",

lineHeight: tipo === "DISCIPLINAS_CONCLUIDAS" ? 1.35 : undefined,
quantidadeDisciplinas: tipo === "DISCIPLINAS_CONCLUIDAS" ? 3 : undefined,
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
        setMensagemErro(data?.detalhe || data?.error || "Erro ao adicionar campo.");
        return;
      }

      setCampos((prev) => [
  ...prev,
  {
    ...(data?.dadosJson || {}),
    ...data,
    quantidadeDisciplinas:
  tipo === "DISCIPLINAS_CONCLUIDAS"
    ? data?.dadosJson?.quantidadeDisciplinas ?? 3
    : data?.quantidadeDisciplinas,
colunasDisciplinas:
  tipo === "DISCIPLINAS_CONCLUIDAS"
    ? data?.dadosJson?.colunasDisciplinas ?? 1
    : data?.colunasDisciplinas,
    espacoColunasDisciplinas:
  tipo === "DISCIPLINAS_CONCLUIDAS"
    ? data?.dadosJson?.espacoColunasDisciplinas ?? 12
    : data?.espacoColunasDisciplinas,
lineHeight:
  tipo === "DISCIPLINAS_CONCLUIDAS"
    ? data?.dadosJson?.lineHeight ?? 1.35
    : data?.lineHeight,
  },
]);
      setCampoSelecionadoId(data.id);
    } catch {
      setMensagemErro("Erro ao adicionar campo.");
    }
  }

  async function atualizarCampo(
    id: number,
    payload: Partial<CampoCertificado>
  ) {
    try {
  if (payload.tipo === "IMAGEM" || payload.tipo === "FORMA") {
    setCampos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...payload } : c))
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
        setMensagemErro(data?.detalhe || data?.error || "Erro ao atualizar campo.");
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
      : c
  )
);
    } catch {
      setMensagemErro("Erro ao atualizar campo.");
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
      prev.filter((c) => !camposParaExcluir.some((item) => item.id === c.id))
    );

    if (campoSelecionadoId === id) {
      setCampoSelecionadoId(null);
    }

    setMensagemSucesso("Campo excluído definitivamente.");
    setTimeout(() => setMensagemSucesso(""), 2500);
  } catch {
    setMensagemErro("Erro ao excluir campo.");
  }
}

  function atualizarCampoLocal<K extends keyof CampoCertificado>(
  chave: K,
  valor: CampoCertificado[K]
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
            Math.ceil(novoTamanho * 1.65)
          ),
          largura: Math.max(
            Number(campoAtualizado.largura || 0),
            Math.ceil(novoTamanho * 8)
          ),
          lineHeight: campoAtualizado.lineHeight || 1.2,
        };
      }

      return campoAtualizado;
    })
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
        Number(base.opacity || 1) * Math.pow(opacidade, passo)
      ),
      ordem: Number(base.ordem || 5) + passo,
      nomeCamada: `${base.nomeCamada || base.forma || "Forma"} cópia ${passo}`,
    };
  });
}

function gerarCopiasArraySelecionado(preview = false) {
  const ids = idsAlvoDaAcao();

  const bases = campos.filter(
    (campo) =>
      ids.includes(campo.id) &&
      campo.tipo === "FORMA" &&
      !(campo as any).arrayPreview
  );

  if (bases.length === 0) return [];

  const quantidade = Math.max(
    1,
    Math.min(100, Number(arrayQuantidade || 1))
  );

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
            Math.pow(opacidadePorCopia, passo)
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
        nomeCamada: `${base.nomeCamada || base.forma || "Forma"} cópia ${passo}`,
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
      !(campo as any).arrayPreview
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
      !(campo as any).arrayPreview
  );

  if (formasSelecionadas.length === 0) {
    setMensagemErro("Selecione uma forma ou grupo de formas para aplicar Array.");
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

    setMensagemSucesso("Array aplicado ao grupo.");
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
            nomeCamada: campo.nomeCamada || "Array",
            dadosJson: {
              ...((campo as any).dadosJson || {}),
              arrayAtivo: true,
              arrayConfig,
            },
          } as any)
        : campo
    )
  );

  setCopiasPreviewArray([]);
  setModalArrayAberto(false);
  setShapeInspectorAberto(false);

  setMensagemSucesso("Array aplicado à forma.");
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
            item.grupoId === campo.grupoId && !(item as any).arrayPreview
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
      setMensagemErro("Copie um campo ou grupo antes de colar.");
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
      }
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
    })
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
        itensCopiados.length > 1 ? "Grupo copiado." : "Campo copiado."
      );
      setTimeout(() => setMensagemSucesso(""), 1200);

      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      e.preventDefault();

      colarCamposCopiados(
        24,
        Array.isArray(campoCopiado?.itens) && campoCopiado.itens.length > 1
          ? "Grupo colado."
          : "Campo colado."
      );

      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
      e.preventDefault();

      colarCamposCopiados(
        0,
        Array.isArray(campoCopiado?.itens) && campoCopiado.itens.length > 1
          ? "Grupo colado no mesmo lugar."
          : "Campo colado no mesmo lugar."
      );

      return;
    }
  }

  window.addEventListener("keydown", handleCopiarColar);

  return () => {
    window.removeEventListener("keydown", handleCopiarColar);
  };
}, [
  campoCopiado,
  campos,
  camposSelecionadosIds,
  campoSelecionadoId,
]);

function abrirMenuFerramentasSelecao() {
  const ids = idsAlvoDaAcao();

  if (ids.length === 0) {
    setMensagemErro("Selecione uma forma para abrir as ferramentas.");
    setTimeout(() => setMensagemErro(""), 2000);
    return;
  }

  const campoIdMenu =
    campoSelecionadoId && ids.includes(campoSelecionadoId)
      ? campoSelecionadoId
      : ids[ids.length - 1];

  const campo = campos.find((item) => item.id === campoIdMenu);

  if (!campo || campo.tipo !== "FORMA") {
    setMensagemErro("As ferramentas avançadas estão disponíveis para formas.");
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
    x: Math.max(24, Math.min(window.innerWidth - 340, window.innerWidth - 390)),
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
  campo: CampoCertificado
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
      Math.abs(deltaX) >= Math.abs(deltaY)
        ? deltaX
        : deltaY * proporcaoGrupo;

    const novaLarguraGrupo = Math.max(
      1,
      caixaInicial.largura + deltaDominante
    );

    const fator = Math.max(0.02, novaLarguraGrupo / caixaInicial.largura);

    setCampos((prev) =>
      prev.map((campo) => {
        const itemInicial = itensIniciais.find(
          (item) => item.id === campo.id
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
            Math.max(1, itemInicial.tamanho * fator)
          );
        }

        if (
          campo.tipo === "FORMA" &&
          itemInicial.contornoEspessura !== null
        ) {
          novosDados.contornoEspessura = arredondar(
            Math.max(0.1, itemInicial.contornoEspessura * fator)
          );
        }

        if (itemInicial.sombraBlur !== null) {
          novosDados.sombraBlur = arredondar(
            Math.max(0, itemInicial.sombraBlur * fator)
          );
        }

        if (itemInicial.sombraDistancia !== null) {
          novosDados.sombraDistancia = arredondar(
            itemInicial.sombraDistancia * fator
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
      })
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
    setMensagemErro("Selecione pelo menos dois elementos para rotacionar.");
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
    e.clientX - centroTelaX
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
      ev.clientX - centroTelaX
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
      })
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
  valores: Partial<CampoCertificado>
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
      (campo) => Number(campo.x || 0) + Number(campo.largura || 120)
    )
  );

  const maxY = Math.max(
    ...itens.map(
      (campo) => Number(campo.y || 0) + Number(campo.altura || 40)
    )
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
            (item as any).grupoId === grupoId &&
            !(item as any).arrayPreview
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
  fator: number
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
      Math.round(Number(campo.tamanho || 18) * fator)
    );
  }

  return atualizarGeometriaCampo(campo, novosDados as any);
}

function centralizarSelecaoNaCena(tipo: "X" | "Y" | "XY") {
  const ids = idsAlvoDaAcao();

  if (ids.length === 0) {
    setMensagemErro("Selecione um elemento ou grupo para centralizar na página.");
    setTimeout(() => setMensagemErro(""), 2200);
    return;
  }

  const itens = campos.filter(
    (campo: any) =>
      ids.includes(campo.id) &&
      campo.id !== -999999 &&
      campo.arrayPreview !== true &&
      !campo.idOriginalArray
  );

  if (itens.length === 0) {
    setMensagemErro("Nenhum elemento válido selecionado.");
    setTimeout(() => setMensagemErro(""), 2200);
    return;
  }

  registrarHistoricoAntesDaAcao();

  const minX = Math.min(...itens.map((campo: any) => Number(campo.x || 0)));
  const minY = Math.min(...itens.map((campo: any) => Number(campo.y || 0)));

  const maxX = Math.max(
    ...itens.map(
      (campo: any) => Number(campo.x || 0) + Number(campo.largura || 120)
    )
  );

  const maxY = Math.max(
    ...itens.map(
      (campo: any) => Number(campo.y || 0) + Number(campo.altura || 40)
    )
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
    })
  );

  setMensagemSucesso("Seleção centralizada na página.");
  setTimeout(() => setMensagemSucesso(""), 1800);
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
    | "MESMO_TAMANHO"
) {
  const unidades = unidadesSelecionadasParaAlinhamento();

  if (unidades.length < 2) {
    setMensagemErro("Selecione pelo menos dois elementos ou grupos para alinhar.");
    setTimeout(() => setMensagemErro(""), 2500);
    return;
  }

  const referencia =
    unidades.find(
      (unidade) =>
        campoSelecionadoId !== null &&
        unidade.ids.includes(campoSelecionadoId)
    ) || unidades[unidades.length - 1];

  const unidadesAlvo = unidades.filter(
    (unidade) => unidade.chave !== referencia.chave
  );

  if (unidadesAlvo.length === 0) {
    setMensagemErro("Selecione outro elemento além da referência.");
    setTimeout(() => setMensagemErro(""), 2500);
    return;
  }

  registrarHistoricoAntesDaAcao();

  setCampos((prev) =>
    prev.map((campo) => {
      const unidade = unidadesAlvo.find((item) =>
        item.ids.includes(campo.id)
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
        const fatorLargura = referencia.largura / Math.max(1, unidade.largura);
        const fatorAltura = referencia.altura / Math.max(1, unidade.altura);

        const fator = Math.min(fatorLargura, fatorAltura);

        return escalarCampoDentroDaUnidade(campo, unidade, fator);
      }

      return campo;
    })
  );

  setMensagemSucesso("Elementos alinhados.");
  setTimeout(() => setMensagemSucesso(""), 1800);
}

function virarSelecionados(direcao: "HORIZONTAL" | "VERTICAL") {
  const ids = idsAlvoDaAcao();

  if (ids.length === 0) {
    setMensagemErro("Selecione uma forma para virar.");
    setTimeout(() => setMensagemErro(""), 2000);
    return;
  }

  registrarHistoricoAntesDaAcao();

  const itens = campos.filter((campo) => ids.includes(campo.id));

  const minX = Math.min(...itens.map((campo) => Number(campo.x || 0)));
  const minY = Math.min(...itens.map((campo) => Number(campo.y || 0)));

  const maxX = Math.max(
    ...itens.map(
      (campo) => Number(campo.x || 0) + Number(campo.largura || 120)
    )
  );

  const maxY = Math.max(
    ...itens.map(
      (campo) => Number(campo.y || 0) + Number(campo.altura || 40)
    )
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
    })
  );

  setMensagemSucesso(
    direcao === "HORIZONTAL"
      ? "Virado horizontalmente."
      : "Virado verticalmente."
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
      ids.includes(item.id) ? ({ ...item, [chave]: valor } as any) : item
    )
  );
}
 
function temSelecaoTextoLivreSalva() {
  return (
    campoSelecionado?.tipo === "TEXTO_LIVRE" &&
    selecaoTextoInfoRef.current?.campoId === campoSelecionado.id &&
    selecaoTextoInfoRef.current.fim > selecaoTextoInfoRef.current.inicio
  );
}

function obterTamanhoTextoSelecionadoAtual() {
  const info = selecaoTextoInfoRef.current;

  if (!info || info.campoId !== campoSelecionadoId) {
    return tamanhoSelecaoTexto || campoSelecionado?.tamanho || 18;
  }

  const editor = document.querySelector(
    `[data-texto-livre-id="${campoSelecionadoId}"]`
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
  if (campoSelecionado?.tipo !== "TEXTO_LIVRE" || !temSelecaoTextoLivreAtiva()) {
    atualizarCampoLocal(
      "tamanho",
      Math.max(6, Math.min(120, (campoSelecionado?.tamanho || 18) + delta)) as any
    );
    return;
  }

  const editor = document.querySelector(
    `[data-texto-livre-id="${campoSelecionadoId}"]`
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
        : campo
    )
  );
}

function inserirMarcadorTextoSelecionado(marcador: string) {
  const editor = document.querySelector(
    `[data-texto-livre-id="${campoSelecionadoId}"]`
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
        : campo
    )
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
  tipo: "interno" | "externo" = tipoContornoTexto
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
    `[data-texto-livre-id="${campoSelecionadoId}"]`
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
  estilo: React.CSSProperties
) {
  if (temSelecaoTextoLivreAtiva()) {
    aplicarEstiloTextoSelecionado(estilo);
    return;
  }

  atualizarCampoLocal(chave as any, valor);
}

function nomeDaCamada(campo: CampoCertificado, index: number) {
  if (campo.nomeCamada?.trim()) return campo.nomeCamada;

  if (campo.tipo === "TEXTO_LIVRE") return `Texto ${index + 1}`;
  if (campo.tipo === "IMAGEM") return `Imagem ${index + 1}`;
  if (campo.tipo === "FORMA") return campo.forma || `Forma ${index + 1}`;

  return campo.tipo || `Elemento ${index + 1}`;
}

function camadasOrdenadas() {
  return campos
    .slice()
    .sort((a, b) => (b.ordem || 0) - (a.ordem || 0));
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
    })
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
    })
  );
}

 function iniciarDrag(
  event: MouseEvent<HTMLDivElement>,
  campo: CampoCertificado
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
    grupoId: campo.grupoId || (idsDoGrupo.length > 1 ? "selecao-temporaria" : null),
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
  direcao: "top" | "bottom" | "left" | "right"
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
    Math.min(ev.clientX - startX, larguraInicial - 40)
  );

  novoCrop.left = cropInicial.left + delta;
  novoX = xInicial + delta;
  novaLargura = larguraInicial - delta;
}

if (direcao === "right") {
  const delta = Math.max(
    -cropInicial.right,
    Math.min(startX - ev.clientX, larguraInicial - 40)
  );

  novoCrop.right = cropInicial.right + delta;
  novoX = xInicial;
  novaLargura = larguraInicial - delta;
}

        if (direcao === "top") {
          const delta = Math.max(-cropInicial.top, Math.min(dy, alturaInicial - 40));
          novoCrop.top = cropInicial.top + delta;
          novoY = yInicial + delta;
          novaAltura = alturaInicial - delta;
        }

        if (direcao === "bottom") {
          const delta = Math.max(-cropInicial.bottom, Math.min(-dy, alturaInicial - 40));
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
      })
    );
  };

  const up = () => {
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", up);
  };

  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
}

function iniciarCropPro(
  e: React.MouseEvent,
  campo: CampoCertificado
) {
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
      })
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
      (alturaInicial - 40) / 2
    );

    const maxParaFora = -Math.min(
      cropInicial.top,
      cropInicial.bottom,
      cropInicial.left,
      cropInicial.right
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
          : item
      )
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

  const elemento = (e.currentTarget.parentElement as HTMLElement);
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
          : item
      )
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
        (pos) => pos.id === item.id
      );

      if (!posInicial) return item;

      return {
        ...item,
        x: posInicial.x + deltaX,
        y: posInicial.y + deltaY,
      };
    })
  );

  return;
}
    
    setCampos((prev) =>
      prev.map((item) =>
        item.id === dragRef.current?.campoId
          ? { ...item, x: Math.round(novoX), y: Math.round(novoY) }
          : item
      )
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

if (campoSelecionado.tipo === "IMAGEM" || campoSelecionado.tipo === "FORMA") {
  setMensagemSucesso(
    campoSelecionado.tipo === "IMAGEM"
      ? "Imagem ajustada no editor."
      : "Forma ajustada no editor."
  );
  setTimeout(() => setMensagemSucesso(""), 2500);
  return;
}

if (campoSelecionado.tipo === "IMAGEM") {
  setMensagemSucesso("Imagem ajustada no editor.");
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
    setMensagemSucesso("Campo salvo com sucesso!");
    setTimeout(() => setMensagemSucesso(""), 2500);
  }

function baixarArquivo() {
  if (formatoDownload === "png") {
    setMensagemErro(
      "O download em PNG ainda está em desenvolvimento no Editor PHANYX."
    );
    return;
  }

  if (formatoDownload === "jpg") {
    setMensagemErro(
      "O download em JPG ainda está em desenvolvimento no Editor PHANYX."
    );
    return;
  }

  if (formatoDownload === "pdf") {
    setMensagemErro(
      "O download em PDF padrão ainda está em desenvolvimento no Editor PHANYX."
    );
    return;
  }

  if (formatoDownload === "pdf-impressao") {
    setMensagemErro(
      "O download em PDF para impressão ainda está em desenvolvimento no Editor PHANYX."
    );
    return;
  }
}

async function salvarModeloCompleto() {
  try {
    setSalvando(true);

    const resConfig = await fetch("/api/admin/configuracoes/certificado", {
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

    const dataConfig = await resConfig.json();

    if (!resConfig.ok) {
      throw new Error(
        dataConfig?.detalhe ||
          dataConfig?.error ||
          "Erro ao salvar configuração."
      );
    }

    const camposParaSalvar = campos.filter((campo: any) => {
      if (campo.id === -999999) return false;
      if (campo.arrayPreview === true) return false;
      if (campo.idOriginalArray) return false;

      return true;
    });

    const payloadCampos = camposParaSalvar.map((campo: any) => {
      const idBanco = Number(campo?.bancoId || campo?.id);

      const ehIdBancoValido =
        Number.isFinite(idBanco) && idBanco > 0 && idBanco < 1000000000;

      const campoLimpo: any = {
        ...campo,
      };

      delete campoLimpo.dadosJson;
      delete campoLimpo.tempId;
      delete campoLimpo.arrayPreview;
      delete campoLimpo.idOriginalArray;

      if (ehIdBancoValido) {
        campoLimpo.id = idBanco;
        campoLimpo.bancoId = idBanco;
      } else {
        delete campoLimpo.id;
        delete campoLimpo.bancoId;
      }

      return campoLimpo;
    });

    const resCampos = await fetch("/api/admin/certificado-campos", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        removerAusentes: true,
        campos: payloadCampos,
      }),
    });

    const dataCampos = await resCampos.json();

    if (!resCampos.ok) {
      throw new Error(
        dataCampos?.detalhe ||
          dataCampos?.error ||
          "Erro ao salvar campos do certificado."
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
    }

    setMensagemSucesso("Modelo de certificado salvo com sucesso!");
    setTimeout(() => setMensagemSucesso(""), 3000);
  } catch (error: any) {
    console.error(error);
    setMensagemErro(error?.message || "Erro ao salvar modelo.");
  } finally {
    setSalvando(false);
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
          Number(campo.opacity || 1) * Math.pow(opacidade, passo)
        ),
      });
    }
  });

  return resultado;
}

  if (carregando) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Carregando editor de certificados...
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
              campo.contornoTextoEspessura ??
              espessuraContornoTexto ??
              1,
            contornoTextoTipo:
              campo.contornoTextoTipo || tipoContornoTexto || "externo",
          }
        : campo
    )
  );
}

function atualizarContornoTextoCampoSelecionado(
  patch: Partial<CampoCertificado>
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
        : campo
    )
  );
}

const camposPreviewCertificado = [
  ...camposComArrayVirtual(),
  ...copiasPreviewArray,
].sort(
  (a: any, b: any) =>
    Number(a.ordem || 0) - Number(b.ordem || 0)
);

const dadosPreviewCertificado = {
  nomeAluno: "José Exemplo da Silva",
  numeroMatricula: "Matrícula 000123",
  cpfAluno: "000.000.000-00",
  rgAluno: "00.000.000-0",

  nomeCurso: "Curso concluído pelo aluno",
  disciplinasConcluidas: [
    "Disciplina 1",
    "Disciplina 2",
    "Disciplina 3",
    "Disciplina 4",
    "Disciplina 5",
    "Disciplina 6",
  ],
  cargaHoraria: "120 horas",
  anoConclusao: "2026",
  dataConclusao: "30/04/2026",
  aproveitamento: "100%",
  frequenciaTotal: "100%",
  modalidade: "EAD",
  turma: "Turma A",
  polo: "Polo Sede",

  nomeInstituicao: "Nome da Instituição",
  cnpjInstituicao: "00.000.000/0001-00",
  cidade: certificadoCidade || "Cidade",
  dataEmissao: "30/04/2026",
  nomeDiretor:
    nomeDiretorInstituicao ||
    certificadoCoordenadorNome ||
    "Nome do Diretor Acadêmico",
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

  return (
  <div className="phanyx-config-certificado-page mx-auto max-w-[1600px] p-6">
    {mensagemErro && (
  <div className="mb-4">
    <PhanyxToast
      tipo="erro"
      titulo="Não foi possível concluir"
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
`}</style>

{mensagemSucesso && (
  <div className="mb-4">
    <PhanyxToast
      tipo="sucesso"
      titulo="Tudo certo"
      mensagem={mensagemSucesso}
      onClose={() => setMensagemSucesso("")}
    />
  </div>
)}

{!podeUsarEditorCertificados && (
  <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
    <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">
      Recurso disponível no Plano Profissional
    </p>

    <h2 className="mt-2 text-2xl font-black text-slate-900">
      Editor PHANYX de Certificados bloqueado no plano atual
    </h2>

    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
      O editor visual de certificados, campos dinâmicos, emissão automática e validação por QR Code estão disponíveis a partir do Plano Profissional.
    </p>

    <a
      href="/planos"
      className="mt-4 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
    >
      Ver planos disponíveis
    </a>
  </div>
)}

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            Configurações • Certificados
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Editor PHANYX de Certificados
          </h1>
          <p className="mt-2 text-slate-600">
            Faça upload do modelo, adicione campos dinâmicos e posicione no lugar
            exato onde o sistema deverá escrever as informações do aluno.
          </p>
        </div>
<button
  onClick={() => {
  if (!podeUsarEditorCertificados) {
    setMensagemErro(
      "O Editor PHANYX de Certificados está disponível a partir do Plano Profissional."
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
  Ir para editor
</button>
        <div className="flex shrink-0 justify-center">
          <Image
            src="/images/phanyx-editor-pintando.png"
            alt="Mascote do Editor PHANYX"
            width={220}
            height={220}
            className="h-auto w-[160px] md:w-[220px]"
            priority
          />
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Modelo institucional
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Envie um PDF-base para ser usado como modelo oficial de certificado.
            </p>
          </div>

          {certificadoTemplateUrl && (
            <a
              href={certificadoTemplateUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ver modelo atual
            </a>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Upload do modelo em PDF
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
              className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {enviandoArquivo ? "Enviando PDF..." : "Enviar modelo PDF"}
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Depois do upload, o modelo salvo continuará abrindo no editor abaixo,
            mesmo após atualizar a página.
          </p>
        </div>
      </div>

      <section
      
  id="editor-certificado"
  className="scroll-mt-[140px] rounded-3xl border border-slate-200 bg-white shadow-sm"
>

<div className="sticky top-0 z-40 mb-6 flex items-center justify-between rounded-2xl border border-blue-700 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 px-6 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          {!mostrarPainelCampos && (
            <button
              type="button"
              onClick={() => setMostrarPainelCampos(true)}
              className="rounded-lg bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30"
            >
              Mostrar campos
            </button>
          )}

          <h2 className="text-sm font-semibold text-white">
  Editor PHANYX
</h2>

        </div>
<button
  type="button"
  onClick={() => setModoAmplo((prev) => !prev)}
  className="rounded-lg bg-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/30"
>
  {modoAmplo ? "Mostrar painéis" : "Tela ampla"}
</button>
        <div className="flex items-center gap-3">
          <button
  type="button"
  onClick={() => setTamanhoPapel("A5")}
  className={`rounded-lg px-3 py-1 text-sm ${
    tamanhoPapel === "A5"
      ? "bg-white text-blue-700"
      : "bg-white/20 text-white hover:bg-white/30"
  }`}
>
  A5
</button>

<button
  type="button"
  onClick={() => setTamanhoPapel("A4")}
  className={`rounded-lg px-3 py-1 text-sm ${
    tamanhoPapel === "A4"
      ? "bg-white text-blue-700"
      : "bg-white/20 text-white hover:bg-white/30"
  }`}
>
  A4
</button>

<button
  type="button"
  onClick={() => setTamanhoPapel("A3")}
  className={`rounded-lg px-3 py-1 text-sm ${
    tamanhoPapel === "A3"
      ? "bg-white text-blue-700"
      : "bg-white/20 text-white hover:bg-white/30"
  }`}
>
  A3
</button>
          <button
            type="button"
            onClick={() => setOrientacao("paisagem")}
            className={`rounded-lg px-3 py-1 text-sm ${
              orientacao === "paisagem"
                ? "bg-white text-blue-700"
: "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Paisagem
          </button>

          <button
            type="button"
            onClick={() => setOrientacao("retrato")}
            className={`rounded-lg px-3 py-1 text-sm ${
              orientacao === "retrato"
                ? "bg-white text-blue-700"
: "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Retrato
          </button>

<button
  type="button"
  disabled={!campoSelecionado}
  onClick={() => {
    if (!campoSelecionado) return;

    atualizarCampoLocal("bloqueado", !campoSelecionado.bloqueado);
  }}
  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
    campoSelecionado?.bloqueado
      ? "bg-yellow-300 text-slate-900"
      : "bg-white/20 text-white border border-white/30 hover:bg-white/30"
  }`}
>
  {campoSelecionado?.bloqueado ? "🔒 Bloqueado" : "🔓 Livre"}
</button>

<button
  type="button"
  onClick={() => setModoMao((prev) => !prev)}
  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
  modoMao
    ? "bg-white text-blue-700"
    : "bg-white/20 text-white border border-white/30 hover:bg-white/30"
}`}
  title="Ferramenta mãozinha (atalho: espaço)"
>
  ✋ Mão
</button>

        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/90">Zoom</span>
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

          <div className="relative">
  <button
    type="button"
    onClick={() => setMenuDownloadAberto((prev) => !prev)}
    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
  >
    Baixar
  </button>

<button
  onClick={salvarModeloCompleto}
  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
>
  Salvar modelo
</button>

<button
  type="button"
  onClick={() => setPreviewAberto(true)}
  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
>
  Visualizar
</button>

  {menuDownloadAberto && (
    <div className="absolute right-0 top-12 z-50 w-[290px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <h3 className="text-xl font-bold text-slate-900">Baixar</h3>

<div className="mt-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Formato de arquivo
        </label>

        <select
          value={formatoDownload}
          onChange={(e) => setFormatoDownload(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm outline-none"
        >
          <option value="png">PNG (ideal para imagens)</option>
          <option value="jpg">JPG (ideal para tamanhos de arquivo pequenos)</option>
          <option value="pdf">PDF padrão (ideal para documentos)</option>
          <option value="pdf-impressao">Impressão de PDF (ideal para impressão)</option>
        </select>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={baixarArquivo}
          className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Baixar arquivo
        </button>
      </div>
    </div>
  )}
</div>
        </div>
      </div>

        <div
  className={`grid h-[620px] min-h-[620px] grid-cols-1 ${
    mostrarPainelCampos
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
  Fechar painel
</button>

  <button
    type="button"
    onClick={() => setCamposDinamicosAberto((prev) => !prev)}
    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase text-slate-700 hover:bg-slate-50"
  >
    <span>Campos dinâmicos</span>
    <span>{camposDinamicosAberto ? "▾" : "▸"}</span>
  </button>

  {camposDinamicosAberto && (
    <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
      Organize o certificado por grupos e clique para adicionar um campo.
    </p>
  )}
</div>

<div className="phanyx-certificado-outliner mt-3 overflow-hidden border">
  <div className="phanyx-certificado-outliner-header flex items-center justify-between border-b px-2 py-1">
    <h3 className="text-xs font-bold uppercase">
      CENA
    </h3>

    <span className="text-[10px]">
      {campos.length}
    </span>
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
    const inicio = lista.findIndex((item) => item.id === campoSelecionadoId);
    const fim = lista.findIndex((item) => item.id === campo.id);

    if (inicio >= 0 && fim >= 0) {
      const [min, max] = [Math.min(inicio, fim), Math.max(inicio, fim)];
      const ids = lista.slice(min, max + 1).map((item) => item.id);

      setCamposSelecionadosIds(ids);
      setCampoSelecionadoId(campo.id);
      return;
    }
  }

  if (e.ctrlKey || e.metaKey) {
    setCamposSelecionadosIds((prev) =>
      prev.includes(campo.id)
        ? prev.filter((id) => id !== campo.id)
        : [...prev, campo.id]
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
        className={`flex h-7 cursor-pointer items-center gap-2 border-b border-slate-200 px-2 text-xs ${
          camposSelecionadosIds.includes(campo.id)
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
            onChange={(e) => setNomeCamadaEditando(e.target.value)}
            onBlur={() => {
              atualizarCampoLocal("nomeCamada" as any, nomeCamadaEditando as any);
              setCamadaRenomeandoId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                atualizarCampoLocal("nomeCamada" as any, nomeCamadaEditando as any);
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
          <span className="text-[10px]" title="Elemento travado">
            🔒
          </span>
        )}
      </div>
    ))}
  </div>
</div>

                
              </div>

              <div className="mb-4 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Editor PHANYX
              </div>

<div className="mb-4 rounded-2xl border border-dashed border-blue-300 bg-white p-4 shadow-sm">
  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-blue-700">
    Fundo PHANYX A4
  </p>

<div className="mb-3 grid grid-cols-2 gap-2">
  <button
    type="button"
    onClick={() => setModoFundo("modelo")}
    className={`rounded-xl border px-3 py-2 text-xs font-bold ${
      modoFundo === "modelo"
        ? "border-blue-600 bg-blue-600 text-white"
        : "bg-white text-slate-700"
    }`}
  >
    Usar modelo
  </button>

  <button
    type="button"
    onClick={() => setModoFundo("phanyx")}
    className={`rounded-xl border px-3 py-2 text-xs font-bold ${
      modoFundo === "phanyx"
        ? "border-blue-600 bg-blue-600 text-white"
        : "bg-white text-slate-700"
    }`}
  >
    Criar do zero
  </button>
</div>

  <div className="space-y-3">
    <label className="block text-xs font-semibold text-slate-600">
      Cor do fundo
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
      {["#ffffff", "#f8fafc", "#fef3c7", "#eff6ff", "#f0fdf4"].map((cor) => (
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
  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-blue-700">
    Imagens do certificado
  </p>

  <details className="mb-3 rounded-xl border bg-slate-50 p-3" open>
    <summary className="cursor-pointer text-xs font-bold text-slate-700">
      Molduras paisagem
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
      Molduras retrato
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
      Figuras decorativas
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
  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-blue-700">
    Textos
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
        Título
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
        Texto
      </span>
    </button>
  </div>

  <p className="mt-3 text-[11px] leading-5 text-slate-500">
    Adicione caixas de texto livres, como no PowerPoint. Depois selecione no certificado para ajustar fonte, sombra, ordem e tamanho.
  </p>
</div>

<div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 shadow-sm">
  <button
  type="button"
  onClick={() => setFormasAbertas((v) => !v)}
  className="mb-2 flex w-full items-center justify-between text-left"
>
  <span className="text-xs font-bold uppercase tracking-wide text-blue-700">
    Formas geométricas
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
        pontosForma: criarPontosIniciaisForma("RETANGULO"),
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
    Retângulo
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
    Quadrado
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
    Círculo
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
    Linha
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
    Estrela
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
        pontosForma: criarPontosIniciaisForma("TRIANGULO"),
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
    <span
      className="h-0 w-0 border-x-[14px] border-b-[24px] border-x-transparent border-b-blue-700"
    />
  </span>
  <span className="mt-2 text-[11px] font-semibold text-slate-700">
    Triângulo
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
    <span className="text-3xl font-black text-blue-700">➜</span>
  </span>
  <span className="mt-2 text-[11px] font-semibold text-slate-700">
    Seta
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
    Losango
  </span>
</button>

<button
  type="button"
  onClick={() => {
  setCampos((prev) => prev.filter((campo) => campo.id !== -999999));
  setModoFormaLivre(true);
  setPontosFormaLivre([]);
  pontosFormaLivreRef.current = [];
  setCampoSelecionadoId(null);
  setCamposSelecionadosIds([]);
  setPontoFormaSelecionado(null);

  setMensagemSucesso(
    "Forma livre ativada. Clique no papel para criar pontos. Clique perto do primeiro ponto para fechar."
  );
}}
  className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
>
  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100">
    <span className="text-2xl text-blue-700">✒️</span>
  </span>
  <span className="mt-2 text-[11px] font-semibold text-slate-700">
    Livre
  </span>
</button>

</div>
  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-blue-50 px-4 py-4 text-center transition hover:bg-blue-100">
    <span className="text-2xl">🖼️</span>
    <span className="mt-1 text-sm font-semibold text-blue-700">
      Adicionar PNG/JPEG
    </span>
    <span className="mt-1 text-[11px] text-slate-500">
      Pode adicionar várias imagens
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
              alt="Imagem enviada"
              className="h-full w-full"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-700">
              Imagem adicionada
            </p>
            <p className="text-[11px] text-slate-500">
              Clique para selecionar
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
    <button type="button" onClick={() => setSecaoAberta(secaoAberta === "aluno" ? null : "aluno")} className="flex w-full items-center justify-between px-4 py-3 text-left">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Informações do aluno</span>
      <span className="text-slate-500">{secaoAberta === "aluno" ? "−" : "+"}</span>
    </button>

    {secaoAberta === "aluno" && (
      <div className="space-y-2 border-t border-slate-100 px-4 py-3">
        {[
          { tipo: "NOME_ALUNO", label: "Nome do aluno" },
          { tipo: "NUMERO_MATRICULA", label: "Número da matrícula" },
          { tipo: "CPF_ALUNO", label: "CPF do aluno" },
          { tipo: "RG_ALUNO", label: "RG do aluno" },
        ].map((item) => (
          <button key={item.tipo} type="button" onClick={() => adicionarCampo(item.tipo)} className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100">
            {item.label}
          </button>
        ))}
      </div>
    )}
  </div>

  {/* Informações do curso */}
  <div className="rounded-2xl border border-slate-200 bg-white">
    <button type="button" onClick={() => setSecaoAberta(secaoAberta === "curso" ? null : "curso")} className="flex w-full items-center justify-between px-4 py-3 text-left">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Informações do curso</span>
      <span className="text-slate-500">{secaoAberta === "curso" ? "−" : "+"}</span>
    </button>

    {secaoAberta === "curso" && (
      <div className="space-y-2 border-t border-slate-100 px-4 py-3">
        {[
          { tipo: "NOME_CURSO", label: "Nome do curso" },
          { tipo: "DISCIPLINAS_CONCLUIDAS", label: "Disciplinas concluídas" },
          { tipo: "CARGA_HORARIA", label: "Carga horária" },
          { tipo: "ANO_CONCLUSAO", label: "Ano de conclusão" },
          { tipo: "DATA_CONCLUSAO", label: "Data de conclusão" },
          { tipo: "APROVEITAMENTO", label: "Aproveitamento" },
          { tipo: "FREQUENCIA_TOTAL", label: "Frequência total" },
          { tipo: "MODALIDADE", label: "Modalidade" },
          { tipo: "TURMA", label: "Turma" },
          { tipo: "POLO", label: "Polo" },
        ].map((item) => (
          <button key={item.tipo} type="button" onClick={() => adicionarCampo(item.tipo)} className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100">
            {item.label}
          </button>
        ))}
      </div>
    )}
  </div>

  {/* Informações institucionais */}
  <div className="rounded-2xl border border-slate-200 bg-white">
    <button type="button" onClick={() => setSecaoAberta(secaoAberta === "institucional" ? null : "institucional")} className="flex w-full items-center justify-between px-4 py-3 text-left">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Informações institucionais</span>
      <span className="text-slate-500">{secaoAberta === "institucional" ? "−" : "+"}</span>
    </button>

    {secaoAberta === "institucional" && (
      <div className="space-y-2 border-t border-slate-100 px-4 py-3">
        {[
          { tipo: "NOME_INSTITUICAO", label: "Nome da instituição" },
          { tipo: "CNPJ_INSTITUICAO", label: "CNPJ da instituição" },
          { tipo: "CIDADE", label: "Cidade" },
          { tipo: "DATA_EMISSAO", label: "Data de emissão" },
          { tipo: "NOME_DIRETOR", label: "Nome do diretor" },
          { tipo: "ASSINATURA", label: "Assinatura do diretor" },
          { tipo: "LOGO_INSTITUICAO", label: "Logo da instituição" },
        ].map((item) => (
          <button key={item.tipo} type="button" onClick={() => adicionarCampo(item.tipo)} className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100">
            {item.label}
          </button>
        ))}
      </div>
    )}
  </div>

  {/* Textos livres */}
  <div className="rounded-2xl border border-slate-200 bg-white">
    <button type="button" onClick={() => setSecaoAberta(secaoAberta === "textos" ? null : "textos")} className="flex w-full items-center justify-between px-4 py-3 text-left">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Textos livres</span>
      <span className="text-slate-500">{secaoAberta === "textos" ? "−" : "+"}</span>
    </button>

    {secaoAberta === "textos" && (
      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-4 py-3">
        <button type="button" onClick={() => adicionarCampo("TEXTO_LIVRE", "TITULO")} className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl font-black text-blue-700">T</span>
          <span className="mt-2 text-[11px] font-semibold text-slate-700">Título</span>
        </button>

        <button type="button" onClick={() => adicionarCampo("TEXTO_LIVRE", "TEXTO")} className="group flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-lg font-black text-blue-700">Tx</span>
          <span className="mt-2 text-[11px] font-semibold text-slate-700">Texto</span>
        </button>
      </div>
    )}
  </div>

  {/* Validação */}
  <div className="rounded-2xl border border-slate-200 bg-white">
    <button type="button" onClick={() => setSecaoAberta(secaoAberta === "validacao" ? null : "validacao")} className="flex w-full items-center justify-between px-4 py-3 text-left">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Validação</span>
      <span className="text-slate-500">{secaoAberta === "validacao" ? "−" : "+"}</span>
    </button>

    {secaoAberta === "validacao" && (
      <div className="space-y-2 border-t border-slate-100 px-4 py-3">
        {[
          { tipo: "NUMERO_CERTIFICADO", label: "Número do certificado" },
          { tipo: "QR_CODE", label: "QR Code" },
          { tipo: "CODIGO_VALIDACAO", label: "Código de validação" },
        ].map((item) => (
          <button key={item.tipo} type="button" onClick={() => adicionarCampo(item.tipo)} className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100">
            {item.label}
          </button>
        ))}
      </div>
    )}
  </div>
</div>
            </aside>
          )}

{camposSelecionadosIds.length >= 2 && (
  <div
    data-barra-selecao-certificado="true"
    onMouseDown={(e) => {
      e.stopPropagation();
      trazerPainelFlutuanteParaFrente("barraSelecao");
    }}
    className="fixed w-[min(920px,calc(100vw-32px))] rounded-2xl border border-blue-500/40 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur"
    style={{
      left: `${barraSelecaoPosicao.x}px`,
      top: `${barraSelecaoPosicao.y}px`,
      zIndex: zIndexFlutuante.barraSelecao,
    }}
  >
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
  <div
  onMouseDown={iniciarArrasteBarraSelecao}
  className="cursor-move select-none rounded-lg px-2 py-1 hover:bg-white/10"
  title="Arraste para mover esta barra"
>
  <p className="text-sm font-bold">↕ Alinhar elementos selecionados</p>
  <p className="text-xs text-slate-300">
    Arraste esta área para mover a barra. Referência: último elemento ativo selecionado.
  </p>
</div>

      <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold">
        {camposSelecionadosIds.length} selecionados
      </span>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => alinharSelecionados("ESQUERDA")}
        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
      >
        Esquerda
      </button>

      <button
        type="button"
        onClick={() => alinharSelecionados("CENTRO_HORIZONTAL")}
        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
      >
        Centro X
      </button>

      <button
        type="button"
        onClick={() => alinharSelecionados("DIREITA")}
        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
      >
        Direita
      </button>

      <button
        type="button"
        onClick={() => alinharSelecionados("TOPO")}
        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
      >
        Mesmo topo
      </button>

      <button
        type="button"
        onClick={() => alinharSelecionados("CENTRO_VERTICAL")}
        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
      >
        Centro Y
      </button>

      <button
        type="button"
        onClick={() => alinharSelecionados("BAIXO")}
        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20"
      >
        Mesmo baixo
      </button>

<button
  type="button"
  onClick={() => centralizarSelecaoNaCena("X")}
  className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-500"
>
  Centro página X
</button>

<button
  type="button"
  onClick={() => centralizarSelecaoNaCena("Y")}
  className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-500"
>
  Centro página Y
</button>

<button
  type="button"
  onClick={() => centralizarSelecaoNaCena("XY")}
  className="rounded-xl bg-purple-700 px-3 py-2 text-xs font-bold text-white hover:bg-purple-600"
>
  Centro da página
</button>

      <button
        type="button"
        onClick={() => alinharSelecionados("MESMA_LARGURA")}
        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold hover:bg-emerald-500"
      >
        Mesma largura
      </button>

      <button
        type="button"
        onClick={() => alinharSelecionados("MESMA_ALTURA")}
        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold hover:bg-emerald-500"
      >
        Mesma altura
      </button>

      <button
        type="button"
        onClick={() => alinharSelecionados("MESMO_TAMANHO")}
        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold hover:bg-emerald-500"
      >
        Mesmo tamanho
      </button>

<button
  type="button"
  onClick={() => virarSelecionados("HORIZONTAL")}
  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
>
  ↔ Virar H
</button>

<button
  type="button"
  onClick={() => virarSelecionados("VERTICAL")}
  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
>
  ↕ Virar V
</button>

<button
  type="button"
  onClick={() => agruparCamposSelecionados()}
  disabled={camposSelecionadosIds.length < 2}
  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
>
  🔗 Agrupar
</button>

<button
  type="button"
  onClick={() => desagruparCampoSelecionado()}
  disabled={!campoSelecionado?.grupoId}
  className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
>
  🔓 Desagrupar
</button>

<button
  type="button"
  onClick={abrirMenuFerramentasSelecao}
  className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-slate-600"
>
  ☰ Ferramentas
</button>

      <button
        type="button"
        onClick={() => {
          setCamposSelecionadosIds(
            campoSelecionadoId ? [campoSelecionadoId] : []
          );
        }}
        className="ml-auto rounded-xl bg-red-600 px-3 py-2 text-xs font-bold hover:bg-red-500"
      >
        Fechar seleção
      </button>
    </div>
  </div>
)}

          <main className="flex h-full min-h-0 flex-col bg-white">
            <div className="border-b border-slate-200 bg-white px-5 py-3 text-sm text-slate-500">
              Área de edição do modelo da instituição
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
  cursor: modoMao || espacoPressionado
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
  backgroundColor: modoFundo === "phanyx" ? corFundoPagina : "#ffffff",
  transform: `scale(${escala})`,
  transformOrigin: "top left",
}}
                >
                  {modoFundo === "modelo" && certificadoTemplateUrl ? (
                    <>
                      <iframe
                        src={`${certificadoTemplateUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        title="Modelo do certificado"
                        className="pointer-events-none absolute inset-0 h-full w-full"
                      />

                      <div className="absolute left-4 top-4 z-10 rounded-lg bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                        Modelo carregado • arraste os campos para posicionar
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
      Grupo
    </div>

<div
  onMouseDown={iniciarRotacaoGrupo}
  className="pointer-events-auto absolute left-1/2 -top-10 flex h-8 w-8 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-sm font-bold text-white shadow-lg active:cursor-grabbing"
  title="Rotacionar grupo inteiro"
>
  ↻
</div>

    <div
      onMouseDown={iniciarRedimensionamentoGrupo}
      className="pointer-events-auto absolute -bottom-3 -right-3 h-7 w-7 cursor-se-resize rounded-full border-2 border-white bg-emerald-500 shadow-lg"
      title="Redimensionar grupo inteiro"
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
    if (campo.tipo !== "FORMA" || !(campo as any).arrayAtivo) {
      return [campo];
    }

    const config = (campo as any).arrayConfig;
    if (!config?.ativo) return [campo];

    const quantidade = Number(config.quantidade || 1);
    const anguloRad = (Number(config.angulo || 0) * Math.PI) / 180;

    const escala = Number(config.escala || 100) / 100;
    const opacidade = Number(config.opacidade || 100) / 100;

    const copias = Array.from({ length: quantidade }).map((_, index) => {
      const passo = index + 1;

      const baseX = Number(config.distanciaX || 0) * passo;
      const baseY = Number(config.distanciaY || 0) * passo;

      const deslocamentoX =
        baseX * Math.cos(anguloRad) - baseY * Math.sin(anguloRad);

      const deslocamentoY =
        baseX * Math.sin(anguloRad) + baseY * Math.cos(anguloRad);

      return {
        ...campo,
        id: Number(`${campo.id}${passo}`),
        arrayPreview: true,
        x: Number(campo.x || 0) + deslocamentoX,
        y: Number(campo.y || 0) + deslocamentoY,
        largura: Number(campo.largura || 100) * Math.pow(escala, passo),
        altura: Number(campo.altura || 100) * Math.pow(escala, passo),
        rotate: Number((campo as any).rotate || 0) + Number(config.rotacaoPorCopia || 0) * passo,
        opacity: Math.max(
          0.05,
          Number(campo.opacity || 1) * Math.pow(opacidade, passo)
        ),
      };
    });

    return [campo, ...copias];
  }),
    ...copiasPreviewArray,
]
  .sort(
    (a: any, b: any) =>
      Number(a.ordem || 0) - Number(b.ordem || 0)
  )
  .map((c) => {
    

 if (c.tipo === "IMAGEM") {
  const selecionadoImagem = camposSelecionadosIds.includes(c.id);

  return (
    <div
      key={c.id}
      onMouseDown={(event) => {
  event.stopPropagation();
   
  if (event.button === 2) return;

  if (event.shiftKey || event.ctrlKey || event.metaKey) {
    setCamposSelecionadosIds((prev) =>
      prev.includes(c.id)
        ? prev.filter((id) => id !== c.id)
        : [...prev, c.id]
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
        zIndex: campoSelecionadoId === c.id ? 99999 : c.ordem || 10,
pointerEvents: c.bloqueado ? "none" : "auto",
transform: `rotate(${(c as any).rotate || 0}deg)`,
        border: selecionadoImagem ? "2px solid #2563eb" : "1px dashed #93c5fd",

        borderRadius: "10px",
        background: "transparent",
       boxShadow: (() => {
  const sombraBase = (() => {
    if (!c.sombraAtiva) return "";

    const { x, y } = calcularSombra(
      (c as any).sombraAngulo ?? 45,
      (c as any).sombraDistancia ?? 20
    );

    return `${x}px ${y}px ${c.sombraBlur || 20}px ${hexToRgba(
      c.sombraCor || "#000000",
      (c.sombraOpacidade ?? 40) / 100
    )}`;
  })();

  const glowSelecao = selecionadoImagem
    ? "0 0 0 3px rgba(37, 99, 235, 0.25)"
    : "";

  return [glowSelecao, sombraBase].filter(Boolean).join(", ") || "none";
})(),
      }}
    >
      <div
  className="relative h-full w-full overflow-hidden rounded-[8px]"
  style={{
    backgroundImage: `url(${(c as any).imagemUrl})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${(c as any).cropBaseW || (c.largura || 150)}px ${
      (c as any).cropBaseH || (c.altura || 150)
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
            title="Rotacionar livremente"
          >
            ↻
          </button>

{/* CORTAR 4 LADOS JUNTOS */}
<div
  onMouseDown={(e) => iniciarCropTodos(e, c)}
  className="absolute left-[-12px] top-[-12px] z-[9999] flex h-7 w-7 cursor-nwse-resize items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 active:scale-95 text-sm font-bold text-white shadow-lg transition"
  title="Cortar os 4 lados juntos"
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
            title="Excluir imagem"
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

              const move = (ev: globalThis.MouseEvent) => {
  const novoW = Math.max(40, startW + ev.clientX - startX);
  const proporcao = startW / startH;

  const novoH = ev.shiftKey
    ? Math.max(40, novoW / proporcao)
    : Math.max(40, startH + ev.clientY - startY);

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
              novoW + (item.crop?.left || 0) + (item.crop?.right || 0),
            cropBaseH:
              novoH + (item.crop?.top || 0) + (item.crop?.bottom || 0),
          }
        : item
    )
  );
};

              const up = () => {
                window.removeEventListener("mousemove", move);
                window.removeEventListener("mouseup", up);
              };

              window.addEventListener("mousemove", move);
              window.addEventListener("mouseup", up);
            }}
className="absolute bottom-[-12px] right-[-12px] z-[999999] h-6 w-6 cursor-se-resize rounded-full border-2 border-white bg-blue-600 shadow-lg"            title="Aumentar/diminuir tudo junto"
          />
        </>
      )}
    </div>
  );
}

 if (c.tipo === "FORMA") {
  const selecionado = camposSelecionadosIds.includes(c.id);
  const formaEstaAgrupada = Boolean((c as any).grupoId);
  const podeEditarFormaIndividual = selecionado && !formaEstaAgrupada;
  return (
  <div
    key={c.id}
    data-campo-certificado-id={c.id}
    onMouseDown={(event) => selecionarCampoNoCanvas(event, c)}
      onContextMenu={(e) => {
  e.preventDefault();
  e.stopPropagation();

  const idsDoAlvo = idsDoCampoOuGrupo(c);
  const clicouEmItemJaSelecionado = camposSelecionadosIds.includes(c.id);

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
      className={`absolute z-20 select-none overflow-visible ${
  (c as any).arrayPreview ? "pointer-events-none opacity-60" : ""
}`}
      style={{
        left: `${c.x}px`,
        top: `${c.y}px`,
        width: `${c.largura || 100}px`,
        height: `${c.altura || 80}px`,
        cursor: "move",
        overflow: "visible",
        zIndex: (c as any).arrayPreview ? 1 : c.ordem || 5,
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
    (c as any).sombraDistancia ?? 20
  );

  return `${x}px ${y}px ${c.sombraBlur || 20}px ${hexToRgba(
    c.sombraCor || "#000000",
    (c.sombraOpacidade ?? 40) / 100
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

    const rect = e.currentTarget.getBoundingClientRect();
    const posicao = Math.round(
      Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    );

    const stops = [
      ...(((c as any).degradeStops || [
        { cor: c.cor || "#1d4ed8", posicao: 0 },
        { cor: (c as any).cor2 || "#60a5fa", posicao: 100 },
      ]) as any[]),
      { cor: "#ffffff", posicao },
    ].sort((a, b) => a.posicao - b.posicao);

    atualizarCampoLocal("degradeStops" as any, stops);
  }}
  title={(c as any).usarGradiente ? "Dê dois cliques para adicionar ponto de degradê" : undefined}
style={{
  background:
  c.pontosForma && c.pontosForma.length > 0
    ? "transparent"
    : c.forma === "LINHA"
      ? "transparent"
    : (c as any).usarGradiente
    ? (c as any).degradeTipo === "radial"
      ? `radial-gradient(circle, ${((c as any).degradeStops || [
          { cor: c.cor || "#1d4ed8", posicao: 0 },
          { cor: (c as any).cor2 || "#60a5fa", posicao: 100 },
        ])
         .map((stop: any) =>
  `${stop.cor} ${stop.posicao}%`
)
          .join(", ")})`
      : `linear-gradient(${(c as any).degradeAngulo ?? 90}deg, ${((c as any).degradeStops || [
          { cor: c.cor || "#1d4ed8", posicao: 0 },
          { cor: (c as any).cor2 || "#60a5fa", posicao: 100 },
        ])
          .map((stop: any) =>
            `${hexToRgba(stop.cor, c.opacity || 1)} ${stop.posicao}%`
          )
          .join(", ")})`
    : hexToRgba(c.cor || "#1d4ed8", c.opacity || 1),

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

{c.tipo === "FORMA" && c.pontosForma && c.pontosForma.length > 0 && (
  <div data-campo-certificado-id={c.id}>
    <FormaVetorial
  campo={c as any}
  selecionado={selecionado && !formaEstaAgrupada}
  modo="editor"
  mostrarHandles={mostrarHandlesForma && !formaEstaAgrupada}
  pontoSelecionadoId={
    pontoFormaSelecionado?.campoId === c.id
      ? pontoFormaSelecionado.pontoId
      : null
  }
  onSelecionarPonto={(pontoId) => {
  setCampoSelecionadoId(c.id);
  setCamposSelecionadosIds(idsDoCampoOuGrupo(c));

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
      : null
  );
}}
  onChange={(campoAtualizado) => {
  if (formaEstaAgrupada) return;

  setCampos((prev) =>
    prev.map((item) =>
      item.id === c.id ? ({ ...item, ...campoAtualizado } as any) : item
    )
  );
}}
    />
  </div>
)}

{selecionado && (c as any).usarGradiente && (
  <div className="pointer-events-none absolute inset-0 z-[9998]">
    {(((c as any).degradeStops || [
      { cor: c.cor || "#1d4ed8", posicao: 0 },
      { cor: (c as any).cor2 || "#60a5fa", posicao: 100 },
    ]) as any[]).map((stop, index) => (
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
        title={`Ponto ${index + 1}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();

          const rect = e.currentTarget.parentElement?.getBoundingClientRect();
          if (!rect) return;

          const move = (ev: globalThis.MouseEvent) => {
            const posicao = Math.max(
              0,
              Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)
            );

            setCampos((prev) =>
              prev.map((item) => {
                if (item.id !== c.id) return item;

                const stops = [
                  ...(((item as any).degradeStops || [
                    { cor: item.cor || "#1d4ed8", posicao: 0 },
                    { cor: (item as any).cor2 || "#60a5fa", posicao: 100 },
                  ]) as any[]),
                ];

                stops[index] = {
                  ...stops[index],
                  posicao: Math.round(posicao),
                };

                return {
                  ...item,
                  degradeStops: stops.sort((a, b) => a.posicao - b.posicao),
                } as any;
              })
            );
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

      {selecionado && !caixaDoGrupoSelecionado && !formaEstaAgrupada && (
  <>
    {/* girar */}
          <button
  type="button"
  onMouseDown={(e) => iniciarRotacao(e, c)}
  className="absolute left-1/2 top-[-34px] h-7 w-7 -translate-x-1/2 rounded-full bg-blue-600 text-xs text-white shadow"
  title="Arraste para rotacionar"
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

              const move = (ev: globalThis.MouseEvent) => {
                setCampos((prev) =>
                  prev.map((item) =>
                    item.id === c.id
                      ? {
                          ...item,
                          largura: ev.shiftKey
  ? Math.max(20, startW + ev.clientX - startX)
  : Math.max(20, startW + ev.clientX - startX),

altura: ev.shiftKey
  ? Math.max(4, (startW + ev.clientX - startX) / proporcao)
  : Math.max(4, startH + ev.clientY - startY),
                        }
                      : item
                  )
                );
              };

              const up = () => {
                window.removeEventListener("mousemove", move);
                window.removeEventListener("mouseup", up);
              };

              window.addEventListener("mousemove", move);
              window.addEventListener("mouseup", up);
            }}
            className="absolute bottom-[-10px] right-[-10px] z-[999999] h-6 w-6 cursor-se-resize rounded-full border-2 border-white bg-blue-600 shadow-lg"
            title="Redimensionar"
          />

          {/* direita */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();

              const startX = e.clientX;
              const startW = c.largura || 100;

              const move = (ev: globalThis.MouseEvent) => {
                setCampos((prev) =>
                  prev.map((item) =>
                    item.id === c.id
                      ? {
                          ...item,
                          largura: Math.max(20, startW + ev.clientX - startX),
                        }
                      : item
                  )
                );
              };

              const up = () => {
                window.removeEventListener("mousemove", move);
                window.removeEventListener("mouseup", up);
              };

              window.addEventListener("mousemove", move);
              window.addEventListener("mouseup", up);
            }}
            className="absolute right-[-6px] top-1/2 h-4 w-4 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-blue-600 shadow"
            title="Ajustar largura"
          />

          {/* baixo */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();

              const startY = e.clientY;
              const startH = c.altura || 80;

              const move = (ev: globalThis.MouseEvent) => {
                setCampos((prev) =>
                  prev.map((item) =>
                    item.id === c.id
                      ? {
                          ...item,
                          altura: Math.max(4, startH + ev.clientY - startY),
                        }
                      : item
                  )
                );
              };

              const up = () => {
                window.removeEventListener("mousemove", move);
                window.removeEventListener("mouseup", up);
              };

              window.addEventListener("mousemove", move);
              window.addEventListener("mouseup", up);
            }}
            className="absolute bottom-[-6px] left-1/2 h-4 w-4 -translate-x-1/2 cursor-ns-resize rounded-full border-2 border-white bg-blue-600 shadow"
            title="Ajustar altura"
          />
          <div
  onMouseDown={(e) => iniciarCropTodos(e, c)}
  className="absolute left-[-10px] top-[-10px] z-[9999] flex h-6 w-6 cursor-nwse-resize items-center justify-center rounded-md bg-purple-600 text-xs font-bold text-white shadow"
  title="Corte pelos 4 lados"
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
  title="Excluir"
>
  ✕
</button>

{selecionado && !caixaDoGrupoSelecionado && !formaEstaAgrupada && (
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

      const move = (ev: globalThis.MouseEvent) => {
        const deltaX = ev.clientX - startX;
        const deltaY = ev.clientY - startY;

        let novaLargura = Math.max(20, startW + deltaX);
        let novaAltura = Math.max(20, startH + deltaY);

        if (ev.shiftKey) {
          novaAltura = Math.max(20, novaLargura / proporcao);
        }

        setCampos((prev) =>
          prev.map((item) =>
            item.id === c.id
              ? {
                  ...item,
                  largura: Math.round(novaLargura),
                  altura: Math.round(novaAltura),
                }
              : item
          )
        );
      };

      const up = () => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };

      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    }}
    className="absolute -bottom-3 -right-3 z-[999999] h-6 w-6 cursor-se-resize rounded-full border-2 border-white bg-blue-600 shadow-lg"
    title="Redimensionar forma inteira"
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

        const move = (ev: globalThis.MouseEvent) => {
          setCampos((prev) =>
            prev.map((item) =>
              item.id === c.id
                ? {
                    ...item,
                    x: startLeft + (ev.clientX - startX),
                    y: startTop + (ev.clientY - startY),
                    largura: startW - (ev.clientX - startX),
                    altura: startH - (ev.clientY - startY),
                  }
                : item
            )
          );
        };

        const up = () => {
          window.removeEventListener("mousemove", move);
          window.removeEventListener("mouseup", up);
        };

        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
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

        const move = (ev: globalThis.MouseEvent) => {
          setCampos((prev) =>
            prev.map((item) =>
              item.id === c.id
                ? {
                    ...item,
                    largura: Math.max(2, startW + (ev.clientX - startX)),
                    altura: Math.max(2, startH + (ev.clientY - startY)),
                  }
                : item
            )
          );
        };

        const up = () => {
          window.removeEventListener("mousemove", move);
          window.removeEventListener("mouseup", up);
        };

        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
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
    const selecionadoTexto = camposSelecionadosIds.includes(c.id);

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
          zIndex: campoSelecionadoId === c.id ? 99999 : c.ordem || 20,
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
    "Digite seu texto";

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
  const texto = e.clipboardData.getData("text/plain");

  if (!texto.trim()) return;
  const textoAtual = editor.innerText.trim();

  const ehTextoPadrao =
    textoAtual === "Digite seu texto" ||
    textoAtual === "Digite seu título";

  salvarHistoricoTextoLivre(editor);

  if (ehTextoPadrao) {
    editor.textContent = texto;
  } else {
    const selecao = window.getSelection();

    if (
      selecao &&
      selecao.rangeCount > 0 &&
      editor.contains(selecao.getRangeAt(0).commonAncestorContainer)
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

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
  const editor = e.currentTarget;
  const textoAtual = editor.innerText.trim();

  const ehTextoPadrao =
    textoAtual === "Digite seu texto" ||
    textoAtual === "Digite seu título";

  if (ehTextoPadrao) {
    e.preventDefault();

    navigator.clipboard.readText().then((texto) => {
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

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
  if (desfazerTextoLivre(e.currentTarget)) {
    e.preventDefault();
    return;
  }
}

  const editor = e.currentTarget;
  const marcador = editor.getAttribute("data-marcador-ativo");

  if (!marcador) return;

  const textoAntes = obterTextoAntesDoCursor(editor);
  const linhaAtual = textoAntes.split("\n").pop() || "";

  if (e.key === "Enter") {
    e.preventDefault();

    if (linhaAtual.trim() === marcador) {
      editor.removeAttribute("data-marcador-ativo");
      inserirTextoNoCursor(editor, "\n");
    } else {
      inserirTextoNoCursor(editor, `\n${marcador} `);
    }

    atualizarTextoLivreNoEstado(editor);
    return;
  }

  if (e.key === "Backspace" && linhaAtual === `${marcador} `) {
    editor.removeAttribute("data-marcador-ativo");
    return;
  }

  if (e.key === " " && linhaAtual === `${marcador} `) {
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
        : item
    )
  );
}}
  onBlur={(e) => {
    const texto = e.currentTarget.innerText;
    const textoHtml = e.currentTarget.innerHTML;

    setCampos((prev) =>
      prev.map((item) =>
        item.id === c.id ? { ...item, texto, textoHtml } : item
      )
    );
  }}
  onBeforeInput={(e) => {
  if ((e.nativeEvent as InputEvent).inputType === "insertFromPaste") {
    return;
  }

  salvarHistoricoTextoLivre(e.currentTarget);
}}
  onMouseUp={() => {
  const selecao = window.getSelection();

  if (selecao && selecao.rangeCount > 0 && selecao.toString().trim()) {
    const range = selecao.getRangeAt(0).cloneRange();
    selecaoTextoRef.current = range;

    const elemento = selecao.anchorNode?.parentElement;
    const cor = elemento ? window.getComputedStyle(elemento).color : "";
    const corHex = cssColorToHex(cor);

setCorTextoSelecionado(corHex || null);
  }
}}
onKeyUp={() => {
  const selecao = window.getSelection();

  if (selecao && selecao.rangeCount > 0 && selecao.toString().trim()) {
    selecaoTextoRef.current = selecao.getRangeAt(0).cloneRange();
  }
}}
  className={`h-full w-full overflow-hidden rounded-md px-2 py-1 outline-none ${
    selecionadoTexto
      ? "border-2 border-blue-600 bg-blue-50/10"
      : "border border-blue-400/60 bg-transparent"
  }`}
  style={{
    fontFamily: c.fonte || "Arial",
    fontSize: `${c.tamanho || 18}px`,
    color: c.cor || "#1e3a8a",
    fontWeight: c.negrito ? "bold" : "normal",
    fontStyle: c.italico ? "italic" : "normal",
    textDecoration: c.sublinhado ? "underline" : "none",
    textAlign: (c.alinhamento as "left" | "center" | "right") || "left",
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
>

</div>

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
    title="Excluir campo de texto"
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
    title="Arrastar caixa de texto"
  >
    mover
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
                              larguraInicial + (ev.clientX - startX) / escala
                            )
                          ),
                          altura: Math.max(
                            40,
                            Math.round(
                              alturaInicial + (ev.clientY - startY) / escala
                            )
                          ),
                        }
                      : item
                  )
                );
              };

              const up = () => {
                window.removeEventListener("mousemove", move);
                window.removeEventListener("mouseup", up);
              };

              window.addEventListener("mousemove", move);
              window.addEventListener("mouseup", up);
            }}
            className="absolute -bottom-3 -right-3 z-[999999] h-6 w-6 cursor-se-resize rounded-full border-2 border-white bg-blue-600 shadow-lg"
            title="Redimensionar caixa de texto"
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

        if (event.shiftKey || event.ctrlKey || event.metaKey) {
          setCamposSelecionadosIds((prev) =>
            prev.includes(c.id)
              ? prev.filter((id) => id !== c.id)
              : [...prev, c.id]
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
      className={`absolute z-20 select-none rounded-md border px-1 py-0 text-[10px] ${
  camposSelecionadosIds.includes(c.id)
    ? c.tipo === "ASSINATURA" || c.tipo === "LOGO_INSTITUICAO"
      ? "border-blue-600 bg-transparent text-blue-900"
      : "border-blue-600 bg-blue-600/90 text-white"
    : "border-blue-300 bg-transparent text-blue-900"
}`}
      style={{
  left: `${c.x}px`,
  top: `${c.y}px`,
  width: `${c.largura || (c.tipo === "ASSINATURA" ? 260 : 120)}px`,
height: `${c.altura || (c.tipo === "ASSINATURA" ? 90 : Math.ceil((c.tamanho || 18) * 1.65))}px`,
  zIndex: campoSelecionadoId === c.id ? 99999 : c.ordem || 1,
pointerEvents: c.bloqueado ? "none" : "auto",
  textAlign:
    (c.alinhamento as "left" | "center" | "right") || "left",
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
    c.tipo === "DISCIPLINAS_CONCLUIDAS" ? "pre-wrap" : "nowrap",
  display: c.tipo === "DISCIPLINAS_CONCLUIDAS" ? "block" : "flex",
alignItems: c.tipo === "DISCIPLINAS_CONCLUIDAS" ? undefined : "center",
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
        c
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
    {listaDisciplinasExemplo(c).map((disciplina, index) => (
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
    ))}
  </div>
)
        : c.tipo === "APROVEITAMENTO"
        ? "100%"
        : c.tipo === "FREQUENCIA_TOTAL"
        ? "FREQUÊNCIA TOTAL"
        : c.tipo === "NOME_ALUNO"
        ? "Nome do aluno"
        : c.tipo === "NOME_CURSO"
        ? "Nome do curso"
        : c.tipo === "DATA_EMISSAO"
        ? "00/00/0000"
                : c.tipo === "ASSINATURA" ? (
            certificadoAssinaturaUrl ? (
              <img
                src={certificadoAssinaturaUrl}
                alt="Assinatura do diretor"
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
              "Assinatura"
            )
          ) : c.tipo}

      {camposSelecionadosIds.includes(c.id) && c.tipo === "ASSINATURA" && (
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

        const move = (ev: globalThis.MouseEvent) => {
          novaLargura = Math.max(
            40,
            Math.round(startW + (ev.clientX - startX) / escala)
          );

          novaAltura = Math.max(
            18,
            Math.round(startH + (ev.clientY - startY) / escala)
          );

          setCampos((prev) =>
            prev.map((item) =>
              item.id === c.id
                ? {
                    ...item,
                    largura: novaLargura,
                    altura: novaAltura,
                  }
                : item
            )
          );
        };

        const up = () => {
          window.removeEventListener("mousemove", move);
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
      title="Redimensionar assinatura"
    />

    {/* Ajustar só largura */}
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;
        const startW = Number(c.largura || 260);

        let novaLargura = startW;

        const move = (ev: globalThis.MouseEvent) => {
          novaLargura = Math.max(
            40,
            Math.round(startW + (ev.clientX - startX) / escala)
          );

          setCampos((prev) =>
            prev.map((item) =>
              item.id === c.id
                ? {
                    ...item,
                    largura: novaLargura,
                  }
                : item
            )
          );
        };

        const up = () => {
          window.removeEventListener("mousemove", move);
          window.removeEventListener("mouseup", up);

          void atualizarCampo(c.id, {
            largura: novaLargura,
          });
        };

        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
      }}
      className="absolute -right-2 top-1/2 z-[999999] h-5 w-5 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-white bg-blue-600 shadow"
      title="Ajustar largura"
    />

    {/* Ajustar só altura */}
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();

        const startY = e.clientY;
        const startH = Number(c.altura || 90);

        let novaAltura = startH;

        const move = (ev: globalThis.MouseEvent) => {
          novaAltura = Math.max(
            18,
            Math.round(startH + (ev.clientY - startY) / escala)
          );

          setCampos((prev) =>
            prev.map((item) =>
              item.id === c.id
                ? {
                    ...item,
                    altura: novaAltura,
                  }
                : item
            )
          );
        };

        const up = () => {
          window.removeEventListener("mousemove", move);
          window.removeEventListener("mouseup", up);

          void atualizarCampo(c.id, {
            altura: novaAltura,
          });
        };

        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
      }}
      className="absolute -bottom-2 left-1/2 z-[999999] h-5 w-5 -translate-x-1/2 cursor-ns-resize rounded-full border-2 border-white bg-blue-600 shadow"
      title="Ajustar altura"
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
                Página 1 de 1
              </span>
              <span className="phanyx-cert-editor-status-pill">
                {baseCanvas.label}
              </span>
              <span className="phanyx-cert-editor-status-pill">
                Zoom {zoom}%
              </span>

{campoSelecionado?.tipo === "FORMA" && !(campoSelecionado as any)?.grupoId && (
  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs font-semibold text-white shadow-xl">
    <button type="button" className="rounded-lg border border-slate-600 px-3 py-2 hover:bg-slate-800">
      + Ponto
    </button>

    <button type="button" className="rounded-lg border border-slate-600 px-3 py-2 hover:bg-slate-800">
      - Ponto
    </button>

    <button type="button" className="rounded-lg border border-slate-600 px-3 py-2 hover:bg-slate-800">
      Curvar
    </button>

    <button type="button" className="rounded-lg border border-slate-600 px-3 py-2 hover:bg-slate-800">
      Pontudo
    </button>

    <button
      type="button"
      onClick={() => setModalArrayAberto(true)}
      className="rounded-lg border border-blue-500 px-3 py-2 text-blue-300 hover:bg-blue-950"
    >
      🔁 Array
    </button>

    <button
      type="button"
      onClick={() => setMostrarHandlesForma((prev) => !prev)}
      className="rounded-lg border border-slate-600 px-3 py-2 hover:bg-slate-800"
    >
      Pontos
    </button>
  </div>
)}

              <span className="phanyx-cert-editor-status-pill">
                {canvasWidth} × {canvasHeight}
              </span>
              {salvandoCampo && (
                <span className="rounded-lg bg-blue-50 px-3 py-1 font-medium text-blue-700">
                  Salvando posição/estilo...
                </span>
              )}
            </div>

{editorCorGradiente && (
  <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
    <div className="w-[360px] rounded-2xl bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">
          Cor do ponto do degradê
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

  if (temTextoSelecionado && campoSelecionado?.tipo === "TEXTO_LIVRE") {
    aplicarEstiloTextoSelecionado({ color: cor });
    return;
  }

  atualizarCampoLocal("cor", cor);
}}
    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
  />

  <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow">
    Clique para abrir o disco de cores
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
                    cor: rgbToHex(novoRgb.r, novoRgb.g, novoRgb.b),
                  }
                : prev
            );
          }}
          className="w-full rounded-xl border px-2 py-2 text-sm"
        />
      </div>
    );
  })}
</div>

<label className="mt-4 block text-xs font-semibold text-slate-500">
  Código da cor
</label>
<input
  type="text"
  value={editorCorGradiente.cor}
  onChange={(e) =>
    setEditorCorGradiente((prev) =>
      prev ? { ...prev, cor: e.target.value } : prev
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
            prev ? { ...prev, cor: e.target.value } : prev
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
        if (item.id !== editorCorGradiente.campoId) return item;

        const stops = [
          ...(((item as any).degradeStops || [
            { cor: item.cor || "#1d4ed8", posicao: 0 },
            { cor: (item as any).cor2 || "#60a5fa", posicao: 100 },
          ]) as any[]),
        ];

        stops[editorCorGradiente.pontoIndex] = {
          ...stops[editorCorGradiente.pontoIndex],
          cor: corAtual.hex,
        };

        return { ...item, degradeStops: stops } as any;
      })
    );

    setEditorCorGradiente(null);
    setMenuPontoGradiente(null);
  }}
  className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
>
  Aplicar cor
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
        const campo = campos.find((item) => item.id === menuPontoGradiente.campoId);
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
          stops.sort((a, b) => a.posicao - b.posicao)
        );

        setMenuPontoGradiente(null);
      }}
      className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-blue-50"
    >
      ✨ Duplicar ponto
    </button>

    <button
      type="button"
      onClick={() => {
        const campo = campos.find((item) => item.id === menuPontoGradiente.campoId);
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
          stops.sort((a, b) => a.posicao - b.posicao)
        );

        setMenuPontoGradiente(null);
      }}
      className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-blue-50"
    >
      ➕ Adicionar ponto
    </button>

    <button
      type="button"
      onClick={() => {
        const campo = campos.find((item) => item.id === menuPontoGradiente.campoId);
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
      🗑️ Deletar ponto
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
          c.id === campoAtualizado.id ? (campoAtualizado as any) : c
        )
      );
    }}
    setMostrarHandlesForma={setMostrarHandlesForma}
  />
</div>

          </main>

          {!modoAmplo && (
<aside className="relative max-h-[calc(100vh-360px)] overflow-y-auto border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">            <button
  type="button"
  onClick={() => setPainelCampoAberto((prev) => !prev)}
  className="mb-4 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-lg font-bold text-slate-900 shadow-sm"
>
  <span>Campo selecionado</span>
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
      onClick={() => setOpcoesImagemAberto((prev) => !prev)}
      className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700"
    >
      Opções da imagem
      <span>{opcoesImagemAberto ? "−" : "+"}</span>
    </button>

    {opcoesImagemAberto && (
      <div className="space-y-4 border-t border-slate-100 p-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <img
            src={(campoSelecionado as any).imagemUrl}
            alt="Prévia da imagem"
            className="mx-auto h-24 w-full object-contain"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-500">
            Transparência
          </p>
          <div>
            <div>
  <p className="mb-2 text-xs font-semibold text-slate-500">
    Ajustes da imagem
  </p>

  <div className="grid grid-cols-4 gap-2">
    <button
      type="button"
      onClick={() =>
        atualizarCampoLocal("rotate" as any, Number(campoSelecionado?.rotate || 0) - 15)
      }
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      ↺ Girar
    </button>

    <button
      type="button"
      onClick={() =>
        atualizarCampoLocal("rotate" as any, Number(campoSelecionado?.rotate || 0) + 15)
      }
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      ↻ Girar
    </button>

    <button
      type="button"
      onClick={() =>
        atualizarCampoLocal("flipX" as any, !campoSelecionado?.flipX)
      }
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      ↔ Inverter H
    </button>

    <button
      type="button"
      onClick={() =>
        atualizarCampoLocal("flipY" as any, !campoSelecionado?.flipY)
      }
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      ↕ Inverter V
    </button>

    <button
      type="button"
      onClick={() => atualizarCampoLocal("objectFit" as any, "contain")}
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      Inteira
    </button>

    <button
      type="button"
      onClick={() => atualizarCampoLocal("objectFit" as any, "cover")}
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      Cortar
    </button>
  </div>
</div>
<div>
  <p className="mb-2 text-xs font-semibold text-slate-500">
    Camadas
  </p>

  <div className="grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={() =>
        atualizarCampoLocal(
          "ordem",
          Number(campoSelecionado?.ordem || 10) + 1
        )
      }
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      🔼 Trazer frente
    </button>

    <button
      type="button"
      onClick={() =>
        atualizarCampoLocal(
          "ordem",
          Math.max(0, Number(campoSelecionado?.ordem || 10) - 1)
        )
      }
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      🔽 Enviar trás
    </button>

    <button
      type="button"
      onClick={() => atualizarCampoLocal("ordem", 999)}
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      ⏫ Frente total
    </button>

    <button
      type="button"
      onClick={() => atualizarCampoLocal("ordem", 0)}
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      ⏬ Fundo total
    </button>
  </div>
</div>
<div>
  <p className="mb-2 text-xs font-semibold text-slate-500">
    Filtros
  </p>

  <div className="grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={() => atualizarCampoLocal("filter" as any, "none")}
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      Normal
    </button>

    <button
      type="button"
      onClick={() => atualizarCampoLocal("filter" as any, "grayscale(1)")}
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      P&B
    </button>

    <button
      type="button"
      onClick={() => atualizarCampoLocal("filter" as any, "sepia(1)")}
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      Sépia
    </button>

    <button
      type="button"
      onClick={() => atualizarCampoLocal("filter" as any, "contrast(1.25) saturate(1.3)")}
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      Vivo
    </button>
  </div>
</div>
  <p className="mb-2 text-xs font-semibold text-slate-500">
    Encaixe da imagem
  </p>

  <div className="grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={() => atualizarCampoLocal("objectFit" as any, "contain" as any)}
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      Mostrar inteira
    </button>

    <button
      type="button"
      onClick={() => atualizarCampoLocal("objectFit" as any, "cover" as any)}
      className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
    >
      Cortar/preencher
    </button>
    <button
  type="button"
  onClick={() => {
    if (!campoSelecionado) return;

    const largura = campoSelecionado.largura || 150;
    const altura = campoSelecionado.altura || 150;
    const tamanho = Math.min(largura, altura);

    const corteHorizontal = Math.max(0, (largura - tamanho) / 2);
    const corteVertical = Math.max(0, (altura - tamanho) / 2);

    atualizarCampoLocal("crop" as any, {
      top: corteVertical,
      bottom: corteVertical,
      left: corteHorizontal,
      right: corteHorizontal,
    });

    atualizarCampoLocal("cropBaseW" as any, largura);
    atualizarCampoLocal("cropBaseH" as any, altura);
    atualizarCampoLocal("largura" as any, tamanho);
    atualizarCampoLocal("altura" as any, tamanho);
  }}
  className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100"
>
  Corte quadrado
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
    aplicarEstiloTextoSelecionado({ fontSize: `${tamanho}px` });
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
          🗑️ Remover imagem
        </button>
      </div>
    )}
  </div>
)}
                <div>
                  <span className="font-semibold">Tipo:</span>{" "}
                  {campoSelecionado.tipo}
                </div>

{campoSelecionado?.tipo === "DISCIPLINAS_CONCLUIDAS" && (
  <div className="relative rounded-2xl border border-slate-700/60 bg-slate-950/60 p-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-slate-100">
          Linhas de disciplinas
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          Defina quantas disciplinas esta tag deve mostrar no certificado.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setPopupDisciplinasAberto((prev) => !prev)}
        className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
      >
        Configurar
      </button>
    </div>

    {popupDisciplinasAberto && (
      <div className="mt-3 rounded-2xl border border-slate-700 bg-slate-900 p-3 shadow-xl">
        <label className="mb-2 block text-xs font-semibold text-slate-300">
          Quantidade de disciplinas
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              atualizarQuantidadeDisciplinasCampo(
                quantidadeDisciplinasDoCampo(campoSelecionado) - 1
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
            value={quantidadeDisciplinasDoCampo(campoSelecionado)}
            onChange={(e) =>
              atualizarQuantidadeDisciplinasCampo(Number(e.target.value))
            }
            className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-center text-sm font-bold text-white outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={() =>
              atualizarQuantidadeDisciplinasCampo(
                quantidadeDisciplinasDoCampo(campoSelecionado) + 1
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
            onClick={() => setPopupDisciplinasAberto(false)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            Aplicar
          </button>
        </div>
      </div>
    )}
  </div>
)}

<div className="mt-4 border-t border-slate-700 pt-3">
  <label className="mb-2 block text-xs font-semibold text-slate-300">
    Quantidade de colunas
  </label>

  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() =>
        atualizarColunasDisciplinasCampo(
          quantidadeColunasDisciplinasDoCampo(campoSelecionado) - 1
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
      value={quantidadeColunasDisciplinasDoCampo(campoSelecionado)}
      onChange={(e) =>
        atualizarColunasDisciplinasCampo(Number(e.target.value))
      }
      className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-center text-sm font-bold text-white outline-none focus:border-blue-500"
    />

    <button
      type="button"
      onClick={() =>
        atualizarColunasDisciplinasCampo(
          quantidadeColunasDisciplinasDoCampo(campoSelecionado) + 1
        )
      }
      className="h-10 w-10 rounded-xl border border-slate-700 text-lg font-bold text-white hover:bg-slate-800"
    >
      +
    </button>
  </div>

  <p className="mt-2 text-[11px] leading-5 text-slate-400">
    Use 2 ou 3 colunas quando o certificado tiver muitas disciplinas.
  </p>
</div>

<div className="mt-4 border-t border-slate-700 pt-3">
  <label className="mb-2 block text-xs font-semibold text-slate-300">
    Espaçamento entre colunas
  </label>

  <input
    type="range"
    min={0}
    max={80}
    step={1}
    value={espacoColunasDisciplinasDoCampo(campoSelecionado)}
    onChange={(e) =>
      atualizarEspacoColunasDisciplinasCampo(Number(e.target.value))
    }
    className="w-full"
  />

  <div className="mt-1 flex justify-between text-[11px] text-slate-400">
    <span>Mais juntas</span>
    <strong>{espacoColunasDisciplinasDoCampo(campoSelecionado)}px</strong>
    <span>Mais afastadas</span>
  </div>
</div>

{campoSelecionado && (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
    <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
      Tamanho da caixa
    </p>

    <div className="grid grid-cols-2 gap-3">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
          Largura
        </span>

        <input
          type="number"
          min={20}
          max={2000}
          value={Math.round(Number(campoSelecionado.largura || 220))}
          onChange={(e) =>
            atualizarCampoLocal(
              "largura" as any,
              Math.max(20, Number(e.target.value || 20)) as any
            )
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
          Altura
        </span>

        <input
          type="number"
          min={12}
          max={2000}
          value={Math.round(Number(campoSelecionado.altura || 40))}
          onChange={(e) =>
            atualizarCampoLocal(
              "altura" as any,
              Math.max(12, Number(e.target.value || 12)) as any
            )
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>
    </div>

    <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
      Use a largura para fazer tags como nome do curso, nome do aluno e cidade
      caberem em uma linha.
    </p>
  </div>
)}

{campoSelecionado?.tipo === "FORMA" && !(campoSelecionado as any)?.grupoId && (
  <div className="rounded-2xl border border-slate-200 bg-white p-4">
    <p className="mb-3 text-sm font-semibold text-slate-700">
      Aparência da forma
    </p>

    <div className="space-y-3">
      <div>
        <div>
  <p className="mb-1 text-xs font-semibold text-slate-500">
    Preenchimento
  </p>

<button
  type="button"
  onClick={() =>
    atualizarCampoLocal(
      "mostrarPreenchimento" as any,
      !(campoSelecionado as any)?.mostrarPreenchimento
    )
  }
  className="mb-2 w-full rounded-xl border border-slate-500 px-3 py-2 text-xs font-semibold"
>
  {(campoSelecionado as any)?.mostrarPreenchimento
    ? "Remover preenchimento"
    : "Ativar preenchimento"}
</button>

  <div className="grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={() =>
        atualizarCampoLocal(
          "mostrarPreenchimento" as any,
          (campoSelecionado as any)?.mostrarPreenchimento === false ? true : false
        )
      }
      className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-100"
    >
      {(campoSelecionado as any)?.mostrarPreenchimento === false
        ? "Sem preenchimento"
        : "Com preenchimento"}
    </button>

    <input
      type="color"
      value={(campoSelecionado as any)?.preenchimentoCor || campoSelecionado?.cor || "#1d4ed8"}
      onChange={(e) =>
        atualizarCampoLocal("preenchimentoCor" as any, e.target.value)
      }
      className="h-10 w-full cursor-pointer rounded-lg border"
    />
  </div>
</div>

<div>
  <p className="mb-1 text-xs font-semibold text-slate-500">
    Contorno
  </p>

<button
  type="button"
  onClick={() =>
    atualizarCampoLocal(
      "mostrarContorno" as any,
      !(campoSelecionado as any)?.mostrarContorno
    )
  }
  className="mb-2 w-full rounded-xl border border-slate-500 px-3 py-2 text-xs font-semibold"
>
  {(campoSelecionado as any)?.mostrarContorno
    ? "Remover contorno"
    : "Ativar contorno"}
</button>

  <div className="grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={() => {
  const ativo =
    (campoSelecionado as any)?.mostrarContorno === false ? true : false;

  if (
    campoSelecionado?.tipo === "TEXTO_LIVRE" &&
    temSelecaoTextoLivreSalva()
  ) {
    aplicarEstiloTextoSelecionado({
      WebkitTextStrokeWidth: ativo
        ? `${(campoSelecionado as any)?.contornoEspessura || 1.5}px`
        : "0px",
      WebkitTextStrokeColor:
        (campoSelecionado as any)?.contornoCor || "#1d4ed8",
    } as React.CSSProperties);

    return;
  }

  atualizarCampoLocal("mostrarContorno" as any, ativo);
}}
      className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-100"
    >
      {(campoSelecionado as any)?.mostrarContorno === false
        ? "Sem contorno"
        : "Com contorno"}
    </button>

    <input
      type="color"
      value={(campoSelecionado as any)?.contornoCor || campoSelecionado?.cor || "#1d4ed8"}
      onChange={(e) =>
        atualizarCampoLocal("contornoCor" as any, e.target.value)
      }
      className="h-10 w-full cursor-pointer rounded-lg border"
    />
  </div>

<label className="mb-2 block text-xs font-semibold text-slate-600">
  Tipo do contorno
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
        "externo"
      );
    }}
    className={`rounded-lg px-3 py-2 text-xs font-bold ${
      tipoContornoTexto === "externo" ? "bg-blue-600 text-white" : "border"
    }`}
  >
    Externo
  </button>

  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => {
      setTipoContornoTexto("interno");

      aplicarContornoTextoSelecionado(
        corContornoTexto,
        espessuraContornoTexto,
        "interno"
      );
    }}
    className={`rounded-lg px-3 py-2 text-xs font-bold ${
      tipoContornoTexto === "interno" ? "bg-blue-600 text-white" : "border"
    }`}
  >
    Interno
  </button>
</div>

  <label className="mt-3 block text-xs text-slate-500">
    Espessura do contorno
  </label>
  <input
    type="range"
    min={0}
    max={20}
    value={(campoSelecionado as any)?.contornoEspessura ?? 1.5}
    onChange={(e) =>
      atualizarCampoLocal("contornoEspessura" as any, Number(e.target.value))
    }
    className="w-full"
  />
</div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold text-slate-500">
          Transparência
        </p>

<label className="mt-3 block text-xs text-slate-500">
  Arredondamento dos cantos
</label>
<input
  type="range"
  min={0}
  max={80}
  value={(campoSelecionado as any)?.raioBorda ?? 8}
  onChange={(e) =>
    atualizarCampoLocal("raioBorda" as any, Number(e.target.value))
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
            atualizarCampoLocal("opacity" as any, Number(e.target.value))
          }
          className="w-full"
        />
      </div>

      <button
        type="button"
        onClick={() =>
          atualizarCampoLocal(
            "usarGradiente" as any,
            !(campoSelecionado as any)?.usarGradiente
          )
        }
        className="w-full rounded-xl border bg-slate-50 px-3 py-2 text-xs font-semibold hover:bg-slate-100"
      >
        {(campoSelecionado as any)?.usarGradiente
          ? "Desativar degradê"
          : "Ativar degradê"}
      </button>

      {(campoSelecionado as any)?.usarGradiente && (
        <>
          <div>
            <p className="mb-1 text-xs font-semibold text-slate-500">
              Segunda cor
            </p>
            <input
              type="color"
              value={(campoSelecionado as any)?.cor2 || "#60a5fa"}
              onChange={(e) =>
                atualizarCampoLocal("cor2" as any, e.target.value)
              }
              className="h-10 w-full cursor-pointer rounded-lg border"
            />
          </div>

          <select
            value={(campoSelecionado as any)?.direcaoGradiente || "90deg"}
            onChange={(e) =>
              atualizarCampoLocal("direcaoGradiente" as any, e.target.value)
            }
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            <option value="90deg">Esquerda para direita</option>
            <option value="180deg">Cima para baixo</option>
            <option value="45deg">Diagonal</option>
            <option value="135deg">Diagonal invertida</option>
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
                      Largura
                    </label>
                    <input
                      type="number"
                      value={campoSelecionado.largura || 220}
                      onChange={(e) =>
                        atualizarCampoLocal("largura", Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Altura
                    </label>
                    <input
                      type="number"
                      value={campoSelecionado.altura || 40}
                      onChange={(e) =>
                        atualizarCampoLocal("altura", Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Fonte
                  </label>
                  <select
  value={campoSelecionado?.fonte || "Helvetica"}
  onChange={(e) => {
    const novaFonte = e.target.value;

    if (campoSelecionado?.tipo === "TEXTO_LIVRE") {
      atualizarCampoLocal("fonte", novaFonte as any);
      return;
    }

    aplicarEstiloTextoOuCampoInteiro("fonte", novaFonte, {
      fontFamily: novaFonte,
    });
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
  aplicarEstiloTextoOuCampoInteiro("negrito", !campoSelecionado.negrito, {
    fontWeight: "700",
  })
}
    className={`px-3 py-1 rounded border text-sm ${
      campoSelecionado.negrito
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
  aplicarEstiloTextoOuCampoInteiro("italico", !campoSelecionado.italico, {
    fontStyle: "italic",
  })
}
    className={`px-3 py-1 rounded border text-sm italic ${
      campoSelecionado.italico
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
  aplicarEstiloTextoOuCampoInteiro("sublinhado", !campoSelecionado.sublinhado, {
    textDecoration: "underline",
  })
}
    className={`px-3 py-1 rounded border text-sm underline ${
      campoSelecionado.sublinhado
        ? "bg-blue-600 text-white"
        : "bg-white text-gray-700"
    }`}
  >
    U
  </button>
</div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500">
  Formato do texto
</label>

<select
  value={(campoSelecionado as any)?.textoModo || "NORMAL"}
  onChange={(e) =>
    atualizarCampoLocal("textoModo" as any, e.target.value as any)
  }
  className="w-full rounded-xl border border-slate-300 px-3 py-2"
>
  <option value="NORMAL">Normal</option>
  <option value="VERTICAL">Vertical</option>
  <option value="ARCO">Arco / meia lua</option>
</select>

<label className="mb-1 block text-xs font-medium text-slate-600">
  Tamanho
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

  const novoTamanho = Math.max(6, (campoSelecionado?.tamanho || 18) - 2);
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
      value={tamanhoSelecaoTexto ?? campoSelecionado?.tamanho ?? 18}
      onChange={(e) => {
        const tamanho = Number(e.target.value);
        setTamanhoSelecaoTexto(tamanho);

if (campoSelecionado?.tipo === "TEXTO_LIVRE" && temSelecaoTextoLivreSalva()) {
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

  const novoTamanho = Math.min(120, (campoSelecionado?.tamanho || 18) + 2);
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
                    Cor
                  </label>
                  <input
  type="color"
  value={corTextoSelecionado || campoSelecionado?.cor || "#1e3a8a"}
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
                    Alinhamento
                  </label>
                  <label className="mt-3 block text-xs font-semibold text-slate-500">
  Espaçamento entre letras
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

    if (campoSelecionado?.tipo === "TEXTO_LIVRE" && temSelecaoTextoLivreSalva()) {
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
  Espaçamento entre palavras
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

    if (campoSelecionado?.tipo === "TEXTO_LIVRE" && temSelecaoTextoLivreSalva()) {
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
                    <option value="left">Esquerda</option>
                    <option value="center">Centro</option>
                    <option value="right">Direita</option>
                  </select>
                  </div>
    
                <div className="rounded-2xl border border-slate-200 bg-white">
  <button
    type="button"
    onClick={() => setOpcoesTextoAberto((prev) => !prev)}
    className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700"
  >
    Opções do campo
    <span>{opcoesTextoAberto ? "−" : "+"}</span>
  </button>

  {opcoesTextoAberto && (
    <div className="space-y-4 border-t border-slate-100 p-4">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => atualizarCampoLocal("ordem", (campoSelecionado?.ordem || 1) + 1)} className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100">🔼 Frente</button>
        <button type="button" onClick={() => atualizarCampoLocal("ordem", (campoSelecionado?.ordem || 1) - 1)} className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100">🔽 Trás</button>
        <button type="button" onClick={() => atualizarCampoLocal("ordem", 999)} className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100">⏫ Topo</button>
        <button type="button" onClick={() => atualizarCampoLocal("ordem", 0)} className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100">⏬ Fundo</button>
      </div>

      {campoSelecionado.tipo !== "IMAGEM" && (
        <>
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500">
              Espaçamento entre linhas
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => atualizarCampoLocal("lineHeight", Math.max(0.8, Number(campoSelecionado?.lineHeight || 1.3) - 0.1))} className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100">Aproximar ↑</button>
              <button type="button" onClick={() => atualizarCampoLocal("lineHeight", Math.min(3, Number(campoSelecionado?.lineHeight || 1.3) + 0.1))} className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100">Afastar ↓</button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-500">
              Marcador da lista
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => atualizarCampoLocal("marcador", null)} className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100">Nenhum</button>
              <button type="button" onClick={() => atualizarCampoLocal("marcador", "•")} className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100">• Bolinha</button>
              <button type="button" onClick={() => atualizarCampoLocal("marcador", "➤")} className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100">➤ Setinha</button>
              <button type="button" onClick={() => atualizarCampoLocal("marcador", "-")} className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-slate-100">- Traço</button>
            </div>
          </div>
        </>
      )}

<div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
  <button
    type="button"
    onClick={() => {
      if (campoSelecionado?.tipo === "TEXTO_LIVRE") {
        if (!temSelecaoTextoLivreAtiva()) return;

        aplicarEstiloTextoSelecionado({
          textShadow: "3px 3px 6px rgba(0,0,0,0.45)",
        });

        setMenuContexto(null);
        return;
      }

      atualizarCampoLocal("sombraAtiva" as any, true);
      setMenuContexto(null);
    }}
    className="w-full flex items-center justify-between text-sm font-semibold text-left"
  >
    Sombra projetada
    <span className={`transition-transform ${sombraAberta ? "rotate-180" : ""}`}>
      ▼
    </span>
  </button>

  {sombraAberta && (
    <>
      <button
        type="button"
        onClick={() => {
          const ativa = !campoSelecionado?.sombraAtiva;
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
        {campoSelecionado?.sombraAtiva ? "Desativar sombra" : "Ativar sombra"}
      </button>

      <label className="mt-3 block text-xs text-slate-500">Cor da sombra</label>
      <input
        type="color"
        value={campoSelecionado?.sombraCor || "#000000"}
        onChange={(e) => {
          const valor = e.target.value;
          atualizarCampoLocal("sombraCor", valor);

          if (temSelecaoTextoLivreAtiva()) {
            const blur = campoSelecionado?.sombraBlur ?? 20;
            const opacidade = (campoSelecionado?.sombraOpacidade ?? 40) / 100;

            const { x, y } = calcularSombra(
              (campoSelecionado as any)?.sombraAngulo ?? 45,
              (campoSelecionado as any)?.sombraDistancia ?? 20
            );

            aplicarEstiloTextoSelecionado({
              textShadow: `${x}px ${y}px ${blur}px ${hexToRgba(valor, opacidade)}`,
            });
          }
        }}
        className="h-10 w-full cursor-pointer rounded-xl border border-slate-300"
      />

      <label className="text-xs text-gray-600">Ângulo</label>
      <input
        type="range"
        min={0}
        max={360}
        value={(campoSelecionado as any)?.sombraAngulo ?? 45}
        onChange={(e) => {
          const valor = Number(e.target.value);
          atualizarCampoLocal("sombraAngulo", valor as any);

          if (temSelecaoTextoLivreAtiva()) {
            const blur = campoSelecionado?.sombraBlur ?? 20;
            const cor = campoSelecionado?.sombraCor || "#000000";
            const opacidade = (campoSelecionado?.sombraOpacidade ?? 40) / 100;

            const { x, y } = calcularSombra(
              valor,
              (campoSelecionado as any)?.sombraDistancia ?? 20
            );

            aplicarEstiloTextoSelecionado({
              textShadow: `${x}px ${y}px ${blur}px ${hexToRgba(cor, opacidade)}`,
            });
          }
        }}
      />

      <label className="text-xs text-gray-600 mt-2">Distância</label>
      <input
        type="range"
        min={0}
        max={100}
        value={(campoSelecionado as any)?.sombraDistancia ?? 20}
        onChange={(e) => {
          const valor = Number(e.target.value);
          atualizarCampoLocal("sombraDistancia", valor as any);

          if (temSelecaoTextoLivreAtiva()) {
            const blur = campoSelecionado?.sombraBlur ?? 20;
            const cor = campoSelecionado?.sombraCor || "#000000";
            const opacidade = (campoSelecionado?.sombraOpacidade ?? 40) / 100;

            const { x, y } = calcularSombra(
              (campoSelecionado as any)?.sombraAngulo ?? 45,
              valor
            );

            aplicarEstiloTextoSelecionado({
              textShadow: `${x}px ${y}px ${blur}px ${hexToRgba(cor, opacidade)}`,
            });
          }
        }}
      />

      <label className="mt-3 block text-xs text-slate-500">Desfoque</label>
      <input
        type="range"
        min={0}
        max={80}
        value={campoSelecionado?.sombraBlur ?? 20}
        onChange={(e) => {
          const valor = Number(e.target.value);
          atualizarCampoLocal("sombraBlur", valor);

          if (temSelecaoTextoLivreAtiva()) {
            const cor = campoSelecionado?.sombraCor || "#000000";
            const opacidade = (campoSelecionado?.sombraOpacidade ?? 40) / 100;

            const { x, y } = calcularSombra(
              (campoSelecionado as any)?.sombraAngulo ?? 45,
              (campoSelecionado as any)?.sombraDistancia ?? 20
            );

            aplicarEstiloTextoSelecionado({
              textShadow: `${x}px ${y}px ${valor}px ${hexToRgba(cor, opacidade)}`,
            });
          }
        }}
        className="w-full"
      />

      <label className="mt-3 block text-xs text-slate-500">Opacidade</label>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={campoSelecionado?.sombraOpacidade ?? 40}
        onChange={(e) => {
          const valor = Number(e.target.value);
          atualizarCampoLocal("sombraOpacidade", valor);

          if (temSelecaoTextoLivreAtiva()) {
            const blur = campoSelecionado?.sombraBlur ?? 20;
            const cor = campoSelecionado?.sombraCor || "#000000";
            const opacidade = valor / 100;

            const { x, y } = calcularSombra(
              (campoSelecionado as any)?.sombraAngulo ?? 45,
              (campoSelecionado as any)?.sombraDistancia ?? 20
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
          Salvar
        </button>

        <button
          type="button"
          onClick={() => excluirCampo(campoSelecionado.id)}
          className="flex-1 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
        >
          Excluir
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
                Primeiro clique em um campo da esquerda para adicionar ao editor.
                Depois clique e arraste o campo sobre o certificado para
                posicionar.
              </p>
                        )
}
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
        const campo = campos.find((item) => item.id === menuCamada.campoId);
        setNomeCamadaEditando(campo?.nomeCamada || "");
        setMenuCamada(null);
      }}
      className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
    >
      Renomear
    </button>

    <button
      type="button"
      onClick={() => {
        moverCamadaPara(menuCamada.campoId, "cima");
        setMenuCamada(null);
      }}
      className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
    >
      Enviar para cima
    </button>

    <button
      type="button"
      onClick={() => {
        moverCamadaPara(menuCamada.campoId, "baixo");
        setMenuCamada(null);
      }}
      className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
    >
      Enviar para baixo
    </button>

    <button
      type="button"
      onClick={() => {
        const campo = campos.find((item) => item.id === menuCamada.campoId);
        if (campo) atualizarCampoLocal("bloqueado", !campo.bloqueado);
        setMenuCamada(null);
      }}
      className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-100"
    >
      Travar / destravar
    </button>

    <button
      type="button"
      onClick={() => {
        void excluirCampo(menuCamada.campoId);
        setMenuCamada(null);
      }}
      className="block w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
    >
      Deletar
    </button>
  </div>
)}

        </div>
        
      </section>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Dados institucionais do certificado
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Essas informações serão usadas pelo sistema no momento da emissão.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              URL do modelo do certificado
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
              Nome do coordenador
            </label>
            <input
              type="text"
              value={certificadoCoordenadorNome}
              onChange={(e) => setCertificadoCoordenadorNome(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="Ex.: Roberto Ramos da Silva"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cidade do certificado
            </label>
            <input
              type="text"
              value={certificadoCidade}
              onChange={(e) => setCertificadoCidade(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="Ex.: São José"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={salvarConfiguracao}
              disabled={salvando}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar configuração"}
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
  🔁 Array / Multiplicar forma
</div>

      <div className="mt-4 space-y-3">
        <label className="block text-xs font-semibold text-slate-500">
          Quantidade de cópias
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
          Distância X
        </label>
        <input
          type="number"
          value={arrayX}
          onChange={(e) => setArrayX(Number(e.target.value))}
          className="w-full rounded-xl border px-3 py-2"
        />

        <label className="block text-xs font-semibold text-slate-500">
          Distância Y
        </label>
        <input
          type="number"
          value={arrayY}
          onChange={(e) => setArrayY(Number(e.target.value))}
          className="w-full rounded-xl border px-3 py-2"
        />
<label className="block text-xs font-semibold text-slate-400">
  Ângulo do Array
</label>
<input
  type="number"
  value={arrayAngulo}
  onChange={(e) => setArrayAngulo(Number(e.target.value))}
  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white"
/>
        <label className="block text-xs font-semibold text-slate-500">
          Rotação por cópia
        </label>
        <input
          type="number"
          value={arrayRotacao}
          onChange={(e) => setArrayRotacao(Number(e.target.value))}
          className="w-full rounded-xl border px-3 py-2"
        />

        <label className="block text-xs font-semibold text-slate-500">
          Escala por cópia (%)
        </label>
        <input
          type="number"
          value={arrayEscala}
          onChange={(e) => setArrayEscala(Number(e.target.value))}
          className="w-full rounded-xl border px-3 py-2"
        />

        <label className="block text-xs font-semibold text-slate-500">
          Opacidade por cópia (%)
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
          Cancelar
        </button>

        <button
          type="button"
          onClick={aplicarArrayForma}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          Criar Array
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
      Fechar ✕
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
  top: Math.min(menuContexto.y, window.innerHeight - 520),
  left: menuContexto.x,
  zIndex: 999999,
  maxHeight: "500px",
  overflowY: "auto",
}}
    className="bg-white border shadow-lg rounded-lg p-2 text-sm"
  >

<div
  data-arrastar-menu-contexto
  className="mb-3 flex cursor-move items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600"
>
  <span>⋮⋮ Arrastar painel</span>

  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
    onClick={() => setMenuContexto(null)}
    className="ml-3 rounded-full bg-red-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-700"
    title="Fechar painel"
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
  🔼 Avançar uma camada
</button>

<button
  type="button"
  onClick={() => {
    atualizarCamposAlvo("ordem", Math.max(0, (campoSelecionado?.ordem || 1) - 1));
    setMenuContexto(null);
  }}
  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
>
  🔽 Recuar uma camada
</button>

<button
  type="button"
  onClick={() => {
    atualizarCamposAlvo("ordem", 999);
    setMenuContexto(null);
  }}
  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
>
  ⏫ Trazer para frente de tudo
</button>

<button
  type="button"
  onClick={() => {
    atualizarCamposAlvo("ordem", 0);
    setMenuContexto(null);
  }}
  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
>
  ⏬ Enviar para trás de tudo
</button>

{campoSelecionado &&
  campoSelecionado.tipo !== "FORMA" &&
  campoSelecionado.tipo !== "IMAGEM" && (
    <div className="border-t border-slate-200 px-3 py-2">
      <p className="mb-2 text-xs font-bold text-slate-500">
        Alinhamento da tag
      </p>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            atualizarCamposAlvo("alinhamento", "left");
            setMenuContexto(null);
          }}
          className={`rounded-lg border px-2 py-1 text-xs font-bold ${
            campoSelecionado.alinhamento === "left" || !campoSelecionado.alinhamento
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          ⬅ Esquerda
        </button>

        <button
          type="button"
          onClick={() => {
            atualizarCamposAlvo("alinhamento", "center");
            setMenuContexto(null);
          }}
          className={`rounded-lg border px-2 py-1 text-xs font-bold ${
            campoSelecionado.alinhamento === "center"
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          ↔ Centro
        </button>

        <button
          type="button"
          onClick={() => {
            atualizarCamposAlvo("alinhamento", "right");
            setMenuContexto(null);
          }}
          className={`rounded-lg border px-2 py-1 text-xs font-bold ${
            campoSelecionado.alinhamento === "right"
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          Direita ➡
        </button>
      </div>
    </div>
  )}

<div className="border-t border-slate-200 px-3 py-2">
  <p className="mb-2 text-xs font-bold text-slate-500">
    Marcadores
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
  • Bolinha na seleção
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
  ▸ Setinha na seleção
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
  – Tracinho na seleção
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
      Sem marcador
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
  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
>
  🔗 Agrupar seleção
</button>

<button
  type="button"
  onClick={() => {
    desagruparCampoSelecionado();
    setMenuContexto(null);
  }}
  disabled={!campoSelecionado?.grupoId}
  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
>
  🔓 Desagrupar
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
    ✂️ Separar Array
  </button>
)}

{campoSelecionado?.tipo === "FORMA" && !(campoSelecionado as any)?.grupoId && (
  <button
    type="button"
    onClick={() => {
      setModalArrayAberto(true);
      trazerPainelFlutuanteParaFrente("arrayModal");
      setMenuContexto(null);
    }}
    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
  >
    📐 Array...
  </button>
)}

{campoSelecionado?.tipo === "TEXTO_LIVRE" && (
  <>
    <hr className="my-1" />

<div className="px-3 py-2">
  <label className="mb-2 block text-xs font-bold text-slate-500">
    Cor da seleção
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
  🔠 Aumentar seleção
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
  <b>B</b> Negrito na seleção
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
  <i>I</i> Itálico na seleção
</button>

<button
  type="button"
  onMouseDown={(e) => {
    e.preventDefault();
    aplicarEstiloTextoSelecionado({ textDecoration: "underline" });
    setMenuContexto(null);
  }}
  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
>
  <u>U</u> Sublinhado na seleção
</button>
    <button
      type="button"
      onClick={() => {
  if (campoSelecionado?.tipo === "TEXTO_LIVRE") {
    if (!temSelecaoTextoLivreSalva()) return;

    const blur = campoSelecionado?.sombraBlur ?? 6;
const cor = campoSelecionado?.sombraCor || "#000000";
const opacidade = (campoSelecionado?.sombraOpacidade ?? 65) / 100;

const { x, y } = calcularSombra(
  (campoSelecionado as any)?.sombraAngulo ?? 45,
  (campoSelecionado as any)?.sombraDistancia ?? 3
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
      : campo
  )
);

setMenuContexto(null);
}}
      className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
    >
      🌫️ Sombra projetada
    </button>

    <div className="px-3 py-2">
  <p className="mb-2 text-xs font-bold text-slate-500">
    ⭕ Contorno do texto
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
  {contornoTextoAtivo ? "Desativar contorno" : "Ativar contorno"}
</button>

  <label className="mb-1 block text-[11px] font-semibold text-slate-500">
    Cor do contorno
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
    Espessura do contorno
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
          "externo"
        );
      }
    }}
    className={`rounded-lg px-3 py-2 text-xs font-bold ${
      tipoContornoTexto === "externo"
        ? "bg-blue-600 text-white"
        : "border border-slate-600 text-slate-200"
    }`}
  >
    Externo
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
          "interno"
        );
      }
    }}
    className={`rounded-lg px-3 py-2 text-xs font-bold ${
      tipoContornoTexto === "interno"
        ? "bg-blue-600 text-white"
        : "border border-slate-600 text-slate-200"
    }`}
  >
    Interno
  </button>
</div>

    <hr className="my-1" />

    <div className="py-3">
  <label className="mb-1 block text-xs font-semibold">
    Espaçamento entre linhas
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
    Atual: {(campoSelecionado?.lineHeight ?? 1.3).toFixed(2)}
  </div>

  <label className="mb-1 mt-3 block text-xs font-semibold">
    Espaçamento entre letras
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
    Espaçamento entre palavras
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

    <button onClick={() => { setMenuContexto(null); }} className="block w-full text-left px-3 py-1 hover:bg-gray-100">
      Sem marcador
    </button>

    <button onClick={() => { inserirMarcadorTextoSelecionado("• "); setMenuContexto(null); }} className="block w-full text-left px-3 py-1 hover:bg-gray-100">
      • Bolinha
    </button>

    <button onClick={() => { inserirMarcadorTextoSelecionado("➤ "); setMenuContexto(null); }} className="block w-full text-left px-3 py-1 hover:bg-gray-100">
      ➤ Setinha
    </button>

    <button onClick={() => { inserirMarcadorTextoSelecionado("- "); setMenuContexto(null); }} className="block w-full text-left px-3 py-1 hover:bg-gray-100">
      - Tracinho
    </button>
  </div>
)}
{mensagemSucesso && (
  <div className="fixed right-6 top-24 z-[9999] rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-xl">
    {mensagemSucesso}
  </div>
)}

    </div>
  );
}