"use client";

import Image from "next/image";
import FormaVetorial from "./components/FormaVetorial";
import FloatingShapeInspector from "./components/FloatingShapeInspector";
import PhanyxToast from "@/components/ui/PhanyxToast";
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
  ordem?: number | null;
  grupoId?: string | null;
  lineHeight?: number | null;
  marcador?: string | null;
  imagemUrl?: string | null;
  opacity?: number | null;
  objectFit?: string | null;
  rotate?: number | null;
  flipX?: boolean | null;
  flipY?: boolean | null;
  filter?: string | null;
  forma?: "RETANGULO" | "QUADRADO" | "CIRCULO" | "LINHA" | "ESTRELA" | "TRIANGULO" | null;
  raioBorda?: number | null;
  pontasEstrela?: number | null;
  profundidadeEstrela?: number | null;
  arredondarEstrela?: number | null;
  cor2?: string | null;
  usarGradiente?: boolean | null;
  direcaoGradiente?: string | null;
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

const ORIENTACOES = {
  paisagem: { largura: 1123, altura: 794, label: "Paisagem" },
  retrato: { largura: 794, altura: 1123, label: "Retrato" },
} as const;

type OrientacaoEditor = keyof typeof ORIENTACOES;

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

function calcularSombra(angulo: number, distancia: number) {
  const rad = (angulo * Math.PI) / 180;

  return {
    x: Math.cos(rad) * distancia,
    y: Math.sin(rad) * distancia,
  };
}

function criarPontosIniciaisForma(forma?: CampoCertificado["forma"]) {
  if (forma === "LINHA") {
    return [
      { id: "p1", x: 0, y: 50, tipo: "reto" as const },
      { id: "p2", x: 100, y: 50, tipo: "reto" as const },
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
  const [certificadoCoordenadorNome, setCertificadoCoordenadorNome] =
    useState("");
  const [certificadoCidade, setCertificadoCidade] = useState("");
  const [certificadoAssinaturaUrl, setCertificadoAssinaturaUrl] = useState("");
  const [nomeDiretorInstituicao, setNomeDiretorInstituicao] = useState("");
  const [arquivoModelo, setArquivoModelo] = useState<File | null>(null);
  const [opcoesTextoAberto, setOpcoesTextoAberto] = useState(false);
  const [painelCampoAberto, setPainelCampoAberto] = useState(true);
  const [opcoesImagemAberto, setOpcoesImagemAberto] = useState(true);
  const [sombraAberta, setSombraAberta] = useState(true);
  const [campos, setCampos] = useState<CampoCertificado[]>([]);
  const [historico, setHistorico] = useState<CampoCertificado[][]>([]);
  const [futuro, setFuturo] = useState<CampoCertificado[][]>([]);
  const [campoCopiado, setCampoCopiado] = useState<any>(null);
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
}, [campos, historico, futuro]);

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
  
  const [mostrarHandlesForma, setMostrarHandlesForma] = useState(true);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [salvandoCampo, setSalvandoCampo] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");
  const [orientacao, setOrientacao] = useState<OrientacaoEditor>("paisagem");
  const [formasAbertas, setFormasAbertas] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [modoAmplo, setModoAmplo] = useState(false);
  const [mostrarPainelCampos, setMostrarPainelCampos] = useState(true);
  const [menuDownloadAberto, setMenuDownloadAberto] = useState(false);
  const [formatoDownload, setFormatoDownload] = useState("png");
  const [secaoAberta, setSecaoAberta] = useState<string | null>(null);
  const [modoMao, setModoMao] = useState(false);
  const [espacoPressionado, setEspacoPressionado] = useState(false);
  const [arrastandoCanvas, setArrastandoCanvas] = useState(false);
  const [inicioArrastoCanvas, setInicioArrastoCanvas] = useState({ x: 0, y: 0 });
  
  const [editorCorGradiente, setEditorCorGradiente] = useState<{
  campoId: number;
  pontoIndex: number;
  cor: string;
} | null>(null);
  const [corAtual, setCorAtual] = useState({
  hex: "#ffffff",
  r: 255,
  g: 255,
  b: 255,
});
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
  const canvasRef = useRef<HTMLDivElement | null>(null);
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
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Delete" && campoSelecionadoId) {
      atualizarCamposComHistorico((prev) =>
        prev.filter((c) => c.id !== campoSelecionadoId)
      );
      setCampoSelecionadoId(null);
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [campoSelecionadoId]);

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
      setCertificadoCoordenadorNome(
        dataConfig?.certificadoCoordenadorNome || ""
      );
      setCertificadoCidade(dataConfig?.certificadoCidade || "");
      setCertificadoAssinaturaUrl(
  dataInstituicao?.certificadoAssinaturaUrl || ""
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
    if (e.code === "Space") {
      e.preventDefault();
      setEspacoPressionado(true);
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      if (campoSelecionadoId) {
        excluirCampo(campoSelecionadoId);
      }
    }
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
}, [campoSelecionadoId]);

  const baseCanvas = ORIENTACOES[orientacao];
  const escala = zoom / 100;
  const canvasWidth = Math.round(baseCanvas.largura * escala);
  const canvasHeight = Math.round(baseCanvas.altura * escala);

  const campoSelecionado = useMemo(

    () => campos.find((campo) => campo.id === campoSelecionadoId) || null,
    [campos, campoSelecionadoId]
  );

useEffect(() => {
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

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
      if (!campoSelecionado) return;

      e.preventDefault();
      setCampoCopiado(JSON.parse(JSON.stringify(campoSelecionado)));
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
      if (!campoCopiado) return;

      e.preventDefault();

      const novoId = Date.now();

      const novoCampo = {
        ...JSON.parse(JSON.stringify(campoCopiado)),
        id: novoId,
        bancoId: undefined,
        tempId: novoId,
        x: Number(campoCopiado.x || 0) + 24,
        y: Number(campoCopiado.y || 0) + 24,
      };

      setCampos((prev) => [...prev, novoCampo as any]);
      setCampoSelecionadoId(novoId);
      setCamposSelecionadosIds([novoId]);
    }
  }

  window.addEventListener("keydown", handleCopiarColar);

  return () => {
    window.removeEventListener("keydown", handleCopiarColar);
  };
}, [campoSelecionado, campoCopiado]);

  const caixaDoGrupoSelecionado = useMemo(() => {
  const ids =
    campoSelecionado?.grupoId
      ? campos
          .filter((campo) => campo.grupoId === campoSelecionado.grupoId)
          .map((campo) => campo.id)
      : camposSelecionadosIds;

  if (ids.length < 2) return null;

  const itens = campos.filter((campo) => ids.includes(campo.id));
  if (itens.length < 2) return null;

  const minX = Math.min(...itens.map((campo) => campo.x));
  const minY = Math.min(...itens.map((campo) => campo.y));
  const maxX = Math.max(
    ...itens.map((campo) => campo.x + (campo.largura || 120))
  );
  const maxY = Math.max(
    ...itens.map((campo) => campo.y + (campo.altura || 40))
  );

  return {
    x: minX,
    y: minY,
    largura: maxX - minX,
    altura: maxY - minY,
  };
}, [campos, camposSelecionadosIds, campoSelecionado]);

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
      setMensagemSucesso("Modelo do certificado enviado com sucesso.");
    } catch {
      setMensagemErro("Erro ao fazer upload do modelo.");
    } finally {
      setEnviandoArquivo(false);
    }
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
          certificadoCoordenadorNome,
          certificadoCidade,
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

  async function adicionarCampo(tipo: string) {
    try {
      const larguraInicial =
        tipo === "DISCIPLINAS_CONCLUIDAS" ? 340 : tipo === "QR_CODE" ? 120 : 220;
      const alturaInicial =
        tipo === "DISCIPLINAS_CONCLUIDAS" ? 110 : tipo === "QR_CODE" ? 120 : 40;

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
          tamanho: tipo === "DISCIPLINAS_CONCLUIDAS" ? 14 : 18,
          cor: "#1e3a8a",
          alinhamento: "left",
          pagina: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensagemErro(data?.detalhe || data?.error || "Erro ao adicionar campo.");
        return;
      }

      setCampos((prev) => [...prev, data]);
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
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
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
      prev.map((c) =>
        c.id === campoSelecionado.id ? { ...c, [chave]: valor } : c
      )
    );
  }

function idsAlvoDaAcao() {
  const campo = campos.find((item) => item.id === campoSelecionadoId);

  if (campo?.grupoId) {
    return campos
      .filter((item) => item.grupoId === campo.grupoId)
      .map((item) => item.id);
  }

  return camposSelecionadosIds.length > 1
    ? camposSelecionadosIds
    : campoSelecionadoId
    ? [campoSelecionadoId]
    : [];
}

function atualizarCamposAlvo(chave: keyof CampoCertificado, valor: any) {
  const ids = idsAlvoDaAcao();

  setCampos((prev) =>
    prev.map((item) =>
      ids.includes(item.id) ? ({ ...item, [chave]: valor } as any) : item
    )
  );
}
  
 function iniciarDrag(
  event: MouseEvent<HTMLDivElement>,
  campo: CampoCertificado
) {
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

    novoX = Math.max(0, Math.min(novoX, baseCanvas.largura - largura));
    novoY = Math.max(0, Math.min(novoY, baseCanvas.altura - altura));

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
      fonte: campoSelecionado.fonte || "Helvetica",
      tamanho: campoSelecionado.tamanho || 18,
      cor: campoSelecionado.cor || "#1e3a8a",
      alinhamento: campoSelecionado.alinhamento || "left",
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
        certificadoCoordenadorNome,
        certificadoCidade,
      }),
    });

    const dataConfig = await resConfig.json();

    if (!resConfig.ok) {
      throw new Error(
        dataConfig?.detalhe || dataConfig?.error || "Erro ao salvar configuração."
      );
    }

const resCamposBanco = await fetch("/api/admin/certificado-campos", {
  cache: "no-store",
});

const dataCamposBanco = await resCamposBanco.json();

if (resCamposBanco.ok && Array.isArray(dataCamposBanco?.campos)) {
  const idsNaTela = campos
    .map((campo: any) => Number(campo.bancoId || campo.id))
    .filter((id) => Number.isFinite(id) && id > 0 && id < 1000000000);

  const camposRemovidos = dataCamposBanco.campos.filter(
  (campoBanco: any) => !idsNaTela.includes(Number(campoBanco.id))
);

  for (const removido of camposRemovidos) {
    await fetch(`/api/admin/certificado-campos?id=${removido.id}`, {
      method: "DELETE",
    });
  }
}

    for (const campo of campos) {
      const idEhTemporario = Number(campo.id) > 1000000000;

      const dadosJson =
        campo.tipo === "FORMA" || campo.tipo === "IMAGEM"
          ? {
              ...campo,
            }
          : null;

      const payload = {
        id: idEhTemporario ? undefined : campo.id,
        tipo: campo.tipo,
        x: campo.x,
        y: campo.y,
        largura: campo.largura || 220,
        altura: campo.altura || 40,
        fonte: campo.fonte || "Helvetica",
        tamanho: campo.tamanho || 18,
        cor: campo.cor || "#1e3a8a",
        alinhamento: campo.alinhamento || "left",
        negrito: campo.negrito || false,
        italico: campo.italico || false,
        sublinhado: campo.sublinhado || false,
        ordem: campo.ordem || 1,
        pagina: (campo as any).pagina || 1,
        lineHeight: (campo as any).lineHeight || 1.3,
        marcador: (campo as any).marcador || "nenhum",
        dadosJson,
      };

      const resCampo = await fetch("/api/admin/certificado-campos", {
        method: idEhTemporario ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const dataCampo = await resCampo.json();

      if (!resCampo.ok) {
        throw new Error(
          dataCampo?.detalhe || dataCampo?.error || "Erro ao salvar campo."
        );
      }
    }

    const resCamposAtualizados = await fetch("/api/admin/certificado-campos", {
  cache: "no-store",
});

const dataCamposAtualizados = await resCamposAtualizados.json();

if (resCamposAtualizados.ok && Array.isArray(dataCamposAtualizados?.campos)) {
  setCampos(
    dataCamposAtualizados.campos.map((campo: any) => {
      const dados = campo.dadosJson || {};

      return {
        ...campo,
        ...dados,
        bancoId: campo.id,
        id: campo.id,
      };
    })
  );
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

  if (carregando) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Carregando editor de certificados...
      </div>
    );
  }

  return (
  <div
  className="mx-auto max-w-[1600px] p-6"
  onClick={() => setMenuContexto(null)}
>
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

          <button
            type="button"
            className="rounded-lg bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30"
          >
            Editar página
          </button>

          <button
            type="button"
            className="rounded-lg bg-white/20 px-3 py-1 text-sm text-white hover:bg-white/30"
          >
            Redimensionar
          </button>
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
  min={40}
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
    document.getElementById("editor-certificado")?.scrollIntoView({
      behavior: "smooth",
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
  className="rounded-3xl border border-slate-200 bg-white shadow-sm"
>
        <div
          className={`grid min-h-[720px] grid-cols-1 ${
            mostrarPainelCampos
              ? "lg:grid-cols-[300px_minmax(760px,1fr)_320px]"
              : "lg:grid-cols-[minmax(860px,1fr)_320px]"
          }`}
        >
          {mostrarPainelCampos && !modoAmplo && (
            <aside className="border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Campos dinâmicos
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Organize o certificado por grupos e clique para adicionar um
                    campo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarPainelCampos(false)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Fechar
                </button>
              </div>

              <div className="mb-4 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Editor PHANYX
              </div>

<div className="mb-4 rounded-2xl border border-dashed border-blue-300 bg-white p-4 shadow-sm">
  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-700">
    Imagens do certificado
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
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white">
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
                <div className="rounded-2xl border border-slate-200 bg-white">
  <button
    type="button"
    onClick={() =>
      setSecaoAberta(secaoAberta === "aluno" ? null : "aluno")
    }
    className="flex w-full items-center justify-between px-4 py-3 text-left"
  >
    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
      Informações do aluno
    </span>
    <span className="text-slate-500">
      {secaoAberta === "aluno" ? "−" : "+"}
    </span>
  </button>

  {secaoAberta === "aluno" && (
    <div className="space-y-2 border-t border-slate-100 px-4 py-3">
      {[
        { tipo: "NOME_ALUNO", label: "Nome do aluno" },
        { tipo: "APROVEITAMENTO", label: "Aproveitamento" },
        { tipo: "FREQUENCIA_TOTAL", label: "Frequência total" },
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

                <div className="rounded-2xl border border-slate-200 bg-white">
  <button
    type="button"
    onClick={() =>
      setSecaoAberta(secaoAberta === "curso" ? null : "curso")
    }
    className="flex w-full items-center justify-between px-4 py-3 text-left"
  >
    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
      Informações do curso
    </span>
    <span className="text-slate-500">
      {secaoAberta === "curso" ? "−" : "+"}
    </span>
  </button>

  {secaoAberta === "curso" && (
    <div className="space-y-2 border-t border-slate-100 px-4 py-3">
      {[
        { tipo: "NOME_CURSO", label: "Nome do curso" },
        {
          tipo: "DISCIPLINAS_CONCLUIDAS",
          label: "Disciplinas concluídas",
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

                <div className="rounded-2xl border border-slate-200 bg-white">
  <button
    type="button"
    onClick={() =>
      setSecaoAberta(
        secaoAberta === "institucional" ? null : "institucional"
      )
    }
    className="flex w-full items-center justify-between px-4 py-3 text-left"
  >
    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
      Informações institucionais
    </span>
    <span className="text-slate-500">
      {secaoAberta === "institucional" ? "−" : "+"}
    </span>
  </button>

  {secaoAberta === "institucional" && (
    <div className="space-y-2 border-t border-slate-100 px-4 py-3">
      {[
        { tipo: "DATA_EMISSAO", label: "Data de emissão" },
        { tipo: "CIDADE", label: "Cidade" },
        { tipo: "NOME_DIRETOR", label: "Nome do diretor" },
        { tipo: "ASSINATURA", label: "Assinatura" },
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

                <div className="rounded-2xl border border-slate-200 bg-white">
  <button
    type="button"
    onClick={() =>
      setSecaoAberta(secaoAberta === "validacao" ? null : "validacao")
    }
    className="flex w-full items-center justify-between px-4 py-3 text-left"
  >
    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
      Validação
    </span>
    <span className="text-slate-500">
      {secaoAberta === "validacao" ? "−" : "+"}
    </span>
  </button>

  {secaoAberta === "validacao" && (
    <div className="space-y-2 border-t border-slate-100 px-4 py-3">
      {[
        { tipo: "QR_CODE", label: "QR Code" },
        {
          tipo: "CODIGO_VALIDACAO",
          label: "Código de validação",
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

          <main className="flex min-h-[720px] flex-col bg-[#f3f5f9]">
            <div className="border-b border-slate-200 bg-white px-5 py-3 text-sm text-slate-500">
              Área de edição do modelo da instituição
            </div>

            <div
  ref={stageRef}
  onMouseDown={(e) => {
  if (e.target === e.currentTarget) {
    setCamposSelecionadosIds([]);
    setCampoSelecionadoId(null);
    setMenuContexto(null);
  }

  iniciarArrastoCanvas(e);
}}
  onMouseMove={moverCanvas}
  onMouseUp={finalizarArrastoCanvas}
  onMouseLeave={finalizarArrastoCanvas}
  className="flex-1 overflow-auto bg-[#f3f5f9] flex items-center justify-center"
  style={{
  cursor: modoMao || espacoPressionado
    ? arrastandoCanvas
      ? "grabbing"
      : "grab"
    : "default",
}}
>
              <div
  className="flex items-center justify-center"
 style={{
  width: `${canvasWidth}px`,
  height: `${canvasHeight}px`,
}}
>
                <div
  ref={canvasRef}
  onMouseDown={(e) => {
    if (e.target === e.currentTarget) {
      setCamposSelecionadosIds([]);
      setCampoSelecionadoId(null);
      setMenuContexto(null);
    }
  }}
  onMouseMove={onMouseMoveCanvas}
  onMouseUp={finalizarDrag}
  onMouseLeave={finalizarDrag}
                  className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
                  style={{
  width: `${baseCanvas.largura}px`,
  height: `${baseCanvas.altura}px`,
  transform: `scale(${escala})`,
  transformOrigin: "top left",
}}
                >
                  {certificadoTemplateUrl ? (
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
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      Faça upload do modelo acima para começar a edição.
                    </div>
                  )}

{caixaDoGrupoSelecionado && (
  <div
    className="pointer-events-none absolute z-[9998] rounded-xl border-2 border-blue-600"
    style={{
      left: `${caixaDoGrupoSelecionado.x}px`,
      top: `${caixaDoGrupoSelecionado.y}px`,
      width: `${caixaDoGrupoSelecionado.largura}px`,
      height: `${caixaDoGrupoSelecionado.altura}px`,
      boxShadow: "0 0 0 4px rgba(37, 99, 235, 0.12)",
    }}
  />
)}

  {campos.map((c) => {
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
        zIndex: c.ordem || 10,
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
        width: `${c.largura || 100}px`,
        height: `${c.altura || 80}px`,
        cursor: "move",
        zIndex: c.ordem || 5,
        transform: `rotate(${(c as any).rotate || 0}deg)`,
        
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
  className="relative h-full w-full"
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
  <div
    onContextMenu={(event) => {
      event.preventDefault();
      event.stopPropagation();

      setCampoSelecionadoId(c.id);
      setShapeInspectorAberto(true);
      setShapeInspectorPosicao({
        x: event.clientX + 12,
        y: event.clientY + 12,
      });
    }}
  >
    <FormaVetorial
  campo={c as any}
  selecionado={selecionado}
  modo="editor"
  mostrarHandles={mostrarHandlesForma}
      onChange={(campoAtualizado) => {
        setCampos((prev) =>
          prev.map((item) => {
            if (item.id !== c.id) return item;

            return {
              ...item,
              ...(campoAtualizado as any),
            };
          })
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

      {selecionado && (
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

{selecionado && (
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
          ? "border-blue-600 bg-blue-600/90 text-white"
          : "border-blue-300 bg-transparent text-blue-900"
      }`}
      style={{
        left: `${c.x}px`,
        top: `${c.y}px`,
        width: `${c.largura || 120}px`,
        minHeight: `${c.altura || 18}px`,
        zIndex: c.ordem || 1,
        textAlign:
          (c.alinhamento as "left" | "center" | "right") || "left",
        fontSize: `${c.tamanho || 12}px`,
        color:
          campoSelecionadoId === c.id ? "#ffffff" : c.cor || "#1e3a8a",
        cursor: "move",
        fontFamily: c.fonte || "Helvetica",
        fontWeight: c.negrito ? "bold" : "normal",
        fontStyle: c.italico ? "italic" : "normal",
        textDecoration: c.sublinhado ? "underline" : "none",
        lineHeight: c.lineHeight || 1.3,
        whiteSpace:
          c.tipo === "DISCIPLINAS_CONCLUIDAS" ? "pre-wrap" : "nowrap",
      }}
    >
      {c.tipo === "DISCIPLINAS_CONCLUIDAS"
        ? c.marcador
          ? `${c.marcador} Disciplina 1\n${c.marcador} Disciplina 2\n${c.marcador} Disciplina 3`
          : "Disciplina 1\nDisciplina 2\nDisciplina 3"
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
        : c.tipo === "ASSINATURA"
? certificadoAssinaturaUrl
  ? ""
  : "Assinatura"
: c.tipo}

    </div>
  );
})}
  
</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white px-5 py-3 text-sm text-slate-600">
              <span className="rounded-lg bg-slate-100 px-3 py-1">
                Página 1 de 1
              </span>
              <span className="rounded-lg bg-slate-100 px-3 py-1">
                {ORIENTACOES[orientacao].label}
              </span>
              <span className="rounded-lg bg-slate-100 px-3 py-1">
                Zoom {zoom}%
              </span>
              <span className="rounded-lg bg-slate-100 px-3 py-1">
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
  const { r, g, b } = hexToRgb(cor);

  setCorAtual({ hex: cor, r, g, b });

  setEditorCorGradiente((prev) =>
    prev ? { ...prev, cor } : prev
  );
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

<FloatingShapeInspector
  aberto={shapeInspectorAberto}
  campo={campoSelecionado || null}
  posicao={shapeInspectorPosicao}
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

          </main>

          {!modoAmplo && (
<aside className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
            <button
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
            onChange={(e) =>
              atualizarCampoLocal("opacity", Number(e.target.value))
            }
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
                    value={campoSelecionado.fonte || "Helvetica"}
                    onChange={(e) => atualizarCampoLocal("fonte", e.target.value)}
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
    onClick={() =>
      atualizarCampoLocal("negrito", !campoSelecionado.negrito)
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
    onClick={() =>
      atualizarCampoLocal("italico", !campoSelecionado.italico)
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
    onClick={() =>
      atualizarCampoLocal("sublinhado", !campoSelecionado.sublinhado)
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
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Tamanho
                  </label>
                  <input
  type="number"
  min={6}
  max={120}
  value={campoSelecionado.tamanho ?? 18}
  onChange={(e) => {
    const novoTamanho = Number(e.target.value);

    atualizarCampoLocal("tamanho", novoTamanho);

    if (
      campoSelecionado.tipo !== "IMAGEM" &&
      campoSelecionado.tipo !== "FORMA"
    ) {
      atualizarCampo(campoSelecionado.id, {
        tamanho: novoTamanho,
      });
    }
  }}
  className="w-full rounded-xl border border-slate-300 px-3 py-2"
/>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Cor
                  </label>
                  <input
                    type="color"
                    value={campoSelecionado.cor || "#1e3a8a"}
                    onChange={(e) => atualizarCampoLocal("cor", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-300 px-2 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Alinhamento
                  </label>
                  <select
                    value={campoSelecionado.alinhamento || "left"}
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
      </>
    )}
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

{campoSelecionado?.tipo === "FORMA" && (
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

  <div className="grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={() =>
        atualizarCampoLocal(
          "mostrarContorno" as any,
          (campoSelecionado as any)?.mostrarContorno === false ? true : false
        )
      }
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

<div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
  <button
  type="button"
  onClick={() => setSombraAberta((prev) => !prev)}
  className="w-full flex items-center justify-between text-sm font-semibold text-left"
>
  Sombra projetada
  <span
  className={`transition-transform ${
    sombraAberta ? "rotate-180" : ""
  }`}
>
  ▼
</span>
</button>

{sombraAberta && (
  <>

  <button
    type="button"
    onClick={() =>
      atualizarCampoLocal("sombraAtiva", !campoSelecionado?.sombraAtiva)
    }
    className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
  >
    {campoSelecionado?.sombraAtiva ? "Desativar sombra" : "Ativar sombra"}
  </button>

<label className="mt-3 block text-xs text-slate-500">Cor da sombra</label>
<input
  type="color"
  value={campoSelecionado?.sombraCor || "#000000"}
  onChange={(e) => atualizarCampoLocal("sombraCor", e.target.value)}
  className="h-10 w-full cursor-pointer rounded-xl border border-slate-300"
/>

  <label className="text-xs text-gray-600">Ângulo</label>
<input
  type="range"
  min={0}
  max={360}
  value={(campoSelecionado as any)?.sombraAngulo ?? 45}
  onChange={(e) =>
    atualizarCampoLocal("sombraAngulo", Number(e.target.value) as any)
  }
/>

<label className="text-xs text-gray-600 mt-2">Distância</label>
<input
  type="range"
  min={0}
  max={100}
  value={(campoSelecionado as any)?.sombraDistancia ?? 20}
  onChange={(e) =>
    atualizarCampoLocal("sombraDistancia", Number(e.target.value) as any)
  }
/>

  <label className="mt-3 block text-xs text-slate-500">Desfoque</label>
  <input
    type="range"
    min={0}
    max={80}
    value={campoSelecionado?.sombraBlur ?? 20}
    onChange={(e) => atualizarCampoLocal("sombraBlur", Number(e.target.value))}
    className="w-full"
  />

  <label className="mt-3 block text-xs text-slate-500">Opacidade</label>
  <label className="mt-3 block text-xs text-slate-500">Opacidade</label>
<input
  type="range"
  min={0}
  max={100}
  step={1}
  value={campoSelecionado?.sombraOpacidade ?? 40}
  onChange={(e) =>
    atualizarCampoLocal("sombraOpacidade", Number(e.target.value))
  }
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
 {previewAberto && (
  <div className="fixed inset-0 z-[999] bg-black/75 p-6">
    <button
      type="button"
      onClick={() => setPreviewAberto(false)}
      className="fixed right-6 top-6 z-[1000] rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-red-700"
    >
      Fechar ✕
    </button>

    <div className="h-full w-full overflow-auto rounded-2xl bg-slate-900 p-8">
      <div
        className="relative mx-auto overflow-hidden rounded-xl border-4 border-white bg-white shadow-2xl"
        style={{
  width: `${baseCanvas.largura}px`,
  height: `${baseCanvas.altura}px`,
}}
      >
        {certificadoTemplateUrl && (
          <iframe
            src={`${certificadoTemplateUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
        )}

{campos.map((c) => {
 
if (c.tipo === "FORMA") {
  return (
    <div
      key={c.id}
      className="absolute"
      style={{
        left: `${c.x}px`,
        top: `${c.y}px`,
        width: `${c.largura || 120}px`,
        height: `${c.altura || 120}px`,
        zIndex: c.ordem || 1,
        transform: `rotate(${(c as any).rotate || 0}deg)`,
        transformOrigin: "center center",
        opacity: c.opacity ?? 1,
      }}
    >
      <FormaVetorial
        campo={c as any}
        selecionado={false}
        modo="preview"
        onChange={() => {}}
      />
    </div>
  );
}

  if (c.tipo === "IMAGEM") {

    return (
      <div
  key={c.id}
  className="absolute"
  style={{
    left: `${c.x}px`,
    top: `${c.y}px`,
    width: `${c.largura || 150}px`,
    height: `${c.altura || 150}px`,
    zIndex: c.ordem || 10,
  }}
>
  <div className="relative h-full w-full overflow-hidden">
    <img
      src={
  (c as any).imagemUrl ||
  (c as any).url ||
  (c as any).src ||
  (c as any).arquivoUrl ||
  (c as any).previewUrl ||
  ""
}
      alt="Imagem"
      draggable={false}
      className="absolute"
      style={{
        top: "0px",
        left: "0px",
        width: `${(c.largura || 150) + (c.crop?.left || 0) + (c.crop?.right || 0)}px`,
        height: `${(c.altura || 150) + (c.crop?.top || 0) + (c.crop?.bottom || 0)}px`,
        objectFit: (c as any).objectFit || "contain",
        opacity: c.opacity || 1,
        filter: (c as any).filter || "none",
        transform: `
  translate(-${c.crop?.left || 0}px, -${c.crop?.top || 0}px)
  scaleX(${(c as any).flipX ? -1 : 1})
  scaleY(${(c as any).flipY ? -1 : 1})
`,
        pointerEvents: "none",
      }}
    />
  </div>
</div>
    );
  }

  return (
    <div
      key={c.id}
      className="absolute"
      style={{
        left: `${c.x}px`,
        top: `${c.y}px`,
        width: `${c.largura || 120}px`,
        minHeight: `${c.altura || 18}px`,
        fontSize: `${c.tamanho || 12}px`,
        zIndex: c.ordem || 1,
        fontFamily: c.fonte || "Helvetica",
        color: c.cor || "#1e3a8a",
        textAlign:
          (c.alinhamento as "left" | "center" | "right") || "left",
        lineHeight: c.lineHeight || 1.3,
        whiteSpace:
          c.tipo === "DISCIPLINAS_CONCLUIDAS" ? "pre-wrap" : "nowrap",
      }}
    >
      {c.tipo === "ASSINATURA" ? (
  certificadoAssinaturaUrl ? (
    <img
      src={certificadoAssinaturaUrl}
      alt="Assinatura do diretor"
      className="h-full w-full object-contain pointer-events-none"
      draggable={false}
    />
  ) : (
    "Assinatura"
  )
) : c.tipo === "NOME_DIRETOR" ? (
  nomeDiretorInstituicao || "Nome do diretor"
) : c.tipo === "NOME_ALUNO" ? (
  "José Exemplo da Silva"
) : c.tipo === "NOME_CURSO" ? (
  "Curso concluído pelo aluno"
) : c.tipo === "DATA_EMISSAO" ? (
  "30/04/2026"
) : c.tipo === "DISCIPLINAS_CONCLUIDAS" ? (
  c.marcador
    ? `${c.marcador} Disciplina 1\n${c.marcador} Disciplina 2\n${c.marcador} Disciplina 3`
    : "Disciplina 1\nDisciplina 2\nDisciplina 3"
) : c.tipo === "APROVEITAMENTO" ? (
  "100%"
) : (
  c.tipo
)}
    </div>
  );
})}

      </div>
    </div>
  </div>
)}
{menuContexto && (
  <div
  onClick={(e) => e.stopPropagation()}
    style={{
      position: "fixed",
      top: menuContexto.y,
      left: menuContexto.x,
      zIndex: 9999,
    }}
    className="bg-white border shadow-lg rounded-lg p-2 text-sm"
  >
    <button
  type="button"
  onClick={() => {
    atualizarCamposAlvo("ordem", (campoSelecionado?.ordem || 1) + 1);
    setMenuContexto(null);
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

    <hr className="my-1" />

    <button onClick={() => { atualizarCampoLocal("lineHeight", 1.2); setMenuContexto(null); }} className="block w-full text-left px-3 py-1 hover:bg-gray-100">
      Espaçamento normal
    </button>

    <button onClick={() => { atualizarCampoLocal("lineHeight", 1.8); setMenuContexto(null); }} className="block w-full text-left px-3 py-1 hover:bg-gray-100">
      Espaçamento maior
    </button>

    <hr className="my-1" />

    <button onClick={() => { atualizarCampoLocal("marcador", null); setMenuContexto(null); }} className="block w-full text-left px-3 py-1 hover:bg-gray-100">
      Sem marcador
    </button>

    <button onClick={() => { atualizarCampoLocal("marcador", "•"); setMenuContexto(null); }} className="block w-full text-left px-3 py-1 hover:bg-gray-100">
      • Bolinha
    </button>

    <button onClick={() => { atualizarCampoLocal("marcador", "➤"); setMenuContexto(null); }} className="block w-full text-left px-3 py-1 hover:bg-gray-100">
      ➤ Setinha
    </button>

    <button onClick={() => { atualizarCampoLocal("marcador", "-"); setMenuContexto(null); }} className="block w-full text-left px-3 py-1 hover:bg-gray-100">
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