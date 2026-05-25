"use client";

import { useEffect, useRef, useState } from "react";
import * as bodySegmentation from "@tensorflow-models/body-segmentation";
import * as bodyPix from "@tensorflow-models/body-pix";
import "@tensorflow/tfjs";
import CropImageModal from "./components/CropImageModal";

type DownloadTipo = "png" | "jpg" | "webp";
type ModoRemocao = "assinatura" | "objeto" | "pessoa";
type MotorPessoa = "mediapipe" | "bodypix";
type FerramentaPincel = "apagar" | "restaurar";
type TexturaPincel = "duro" | "medio" | "suave";

export default function RemovedorDeFundoClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagemOriginalRef = useRef<HTMLImageElement | null>(null);
  const imagemResultadoRef = useRef<HTMLImageElement | null>(null);
  const editandoPincelRef = useRef(false);
  const arrastandoResultadoRef = useRef(false);
  const ultimoMouseResultadoRef = useRef({ x: 0, y: 0 });
  const arrastandoOriginalRef = useRef(false);
  const ultimoMouseOriginalRef = useRef({ x: 0, y: 0 });
  const ultimoPontoPincelRef = useRef<{ x: number; y: number } | null>(null);
  const historicoEdicaoRef = useRef<string[]>([]);
  const espacoPressionadoRef = useRef(false);
  const [espacoPressionado, setEspacoPressionado] = useState(false);
  const baseEdicaoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagemOriginalCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [pacoteCheckout, setPacoteCheckout] = useState<number | null>(null);

  const [menuIAAberto, setMenuIAAberto] = useState(false);

  const [tamanhoPincel, setTamanhoPincel] = useState(24);

  const canvasRemoverObjetoRef = useRef<HTMLCanvasElement | null>(null);
  const pintandoObjetoRef = useRef(false);

  const toquePinchRef = useRef<{
  distancia: number;
  zoom: number;
} | null>(null);

  const toqueArrasteRef = useRef<{ x: number; y: number } | null>(null);

  const [imagemOriginal, setImagemOriginal] = useState<string | null>(null);
  const [imagemFinal, setImagemFinal] = useState<string | null>(null);
  const [imagemBaseEdicao, setImagemBaseEdicao] = useState<string | null>(null);

  const [modalCorteAberto, setModalCorteAberto] = useState(false);

  const [fundoPreview, setFundoPreview] = useState<
    "xadrez" | "verde" | "azul" | "preto" | "branco"
  >("verde");

  const [dimensoesImagem, setDimensoesImagem] = useState<{
    largura: number;
    altura: number;
  } | null>(null);

  const [sensibilidade, setSensibilidade] = useState(32);
  const [suavizacao, setSuavizacao] = useState(2);
  const [brilho, setBrilho] = useState(100);
  const [contraste, setContraste] = useState(130);
  const [saturacao, setSaturacao] = useState(100);
  const [opacidade, setOpacidade] = useState(100);
  const [zoomResultado, setZoomResultado] = useState(1);
  const [zoomOriginal, setZoomOriginal] = useState(1);
  const [panOriginal, setPanOriginal] = useState({ x: 0, y: 0 });

  const [comparadorAntesDepois, setComparadorAntesDepois] = useState(50);

  const [compradorCreditos, setCompradorCreditos] = useState({
  nome: "",
  email: "",
  whatsapp: "",
});

  const toqueOriginalRef = useRef<{
  x: number;
  y: number;
} | null>(null);

const pinchOriginalRef = useRef<{
  distancia: number;
  zoom: number;
} | null>(null);

  const [panResultado, setPanResultado] = useState({ x: 0, y: 0 });
  const [intensidadeTraco, setIntensidadeTraco] = useState(60);
  const [modo, setModo] = useState<ModoRemocao>("assinatura");
  const [motorPessoa, setMotorPessoa] = useState<MotorPessoa>("mediapipe");
  const [manterObjetoPrincipal, setManterObjetoPrincipal] = useState(false);
  const [removerBrancoInterno, setRemoverBrancoInterno] = useState(false);
  const [varinhaAtiva, setVarinhaAtiva] = useState(false);
  const [toleranciaVarinha, setToleranciaVarinha] = useState(35);
  const [creditosPublicosLiberados, setCreditosPublicosLiberados] = useState(false);

  const [coresAlvoManuais, setCoresAlvoManuais] = useState<
    { r: number; g: number; b: number }[]
  >([]);

  const [pontoVarinha, setPontoVarinha] = useState<{
  x: number;
  y: number;
} | null>(null);

  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [popupProcessandoIA, setPopupProcessandoIA] = useState(false);
  const [progressoFakeIA, setProgressoFakeIA] = useState(0);
  const [mostrarAjuda, setMostrarAjuda] = useState(false);
  const [modalRefinamentoAberto, setModalRefinamentoAberto] = useState(false);
  const [modalRemoverObjetoAberto, setModalRemoverObjetoAberto] = useState(false);
  const [popupComprarCreditosAberto, setPopupComprarCreditosAberto] = useState(false);
  const [comprandoPacote, setComprandoPacote] = useState<number | null>(null);
  const [pincelAtivo, setPincelAtivo] = useState(false);
  const [ferramentaPincel, setFerramentaPincel] = useState<FerramentaPincel>("apagar");
  
  const [usarPressaoCaneta, setUsarPressaoCaneta] = useState(true);
  const [texturaPincel, setTexturaPincel] = useState<TexturaPincel>("medio");
  const [featherPincel, setFeatherPincel] = useState(0.45);

  const [historicoMascaras, setHistoricoMascaras] = useState<ImageData[]>([]);

  const [mostrarLupa, setMostrarLupa] = useState(false);

  const [posicaoCursor, setPosicaoCursor] = useState({
  x: 0,
  y: 0,
});

  const [posicaoImagemCursor, setPosicaoImagemCursor] = useState({
  x: 0,
  y: 0,
});

  function carregarImagem(file: File) {
    setErro("");
    setImagemFinal(null);
    setImagemBaseEdicao(null);
    setPincelAtivo(false);
    historicoEdicaoRef.current = [];
    baseEdicaoCanvasRef.current = null;
    imagemOriginalCanvasRef.current = null;
    setCoresAlvoManuais([]);
    setVarinhaAtiva(false);
    setZoomResultado(1);
    setPanResultado({ x: 0, y: 0 });
    setZoomOriginal(1);
    setPanOriginal({ x: 0, y: 0 });

    if (!file.type.startsWith("image/")) {
      setErro("Envie apenas arquivos de imagem.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErro("A imagem deve ter no máximo 10MB.");
      return;
    }

    const reader = new FileReader();

reader.onload = () => {
  const dataUrl = String(reader.result || "");

  const img = new Image();
  img.src = dataUrl;

  img.onload = () => {
    setDimensoesImagem({
      largura: img.width,
      altura: img.height,
    });

    setImagemOriginal(dataUrl);
  };

  img.onerror = () => {
    setErro("Não foi possível carregar essa imagem.");
  };
};

reader.onerror = () => {
  setErro("Não foi possível ler essa imagem.");
};

reader.readAsDataURL(file);
  }

  function pixelIndex(x: number, y: number, width: number) {
    return y * width + x;
  }

  function dataIndex(x: number, y: number, width: number) {
    return (y * width + x) * 4;
  }

  function distanciaCor(
    r: number,
    g: number,
    b: number,
    baseR: number,
    baseG: number,
    baseB: number
  ) {
    return Math.sqrt(
      Math.pow(r - baseR, 2) +
        Math.pow(g - baseG, 2) +
        Math.pow(b - baseB, 2)
    );
  }

  function rgbParaHsl(r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      if (max === g) h = (b - r) / d + 2;
      if (max === b) h = (r - g) / d + 4;

      h /= 6;
    }

    return {
      h: h * 360,
      s: s * 100,
      l: l * 100,
    };
  }

  function diferencaHue(a: number, b: number) {
    const diff = Math.abs(a - b);
    return Math.min(diff, 360 - diff);
  }

  function pareceCorDoFundo(
    r: number,
    g: number,
    b: number,
    baseR: number,
    baseG: number,
    baseB: number,
    sensibilidadeAtual: number
  ) {
    const distRgb = distanciaCor(r, g, b, baseR, baseG, baseB);

    const cor = rgbParaHsl(r, g, b);
    const base = rgbParaHsl(baseR, baseG, baseB);

    const diffHue = diferencaHue(cor.h, base.h);
    const diffSat = Math.abs(cor.s - base.s);
    const diffLum = Math.abs(cor.l - base.l);

    const toleranciaRgb = sensibilidadeAtual * 3.2;
    const toleranciaHue = Math.max(8, sensibilidadeAtual * 1.1);
    const toleranciaSat = Math.max(12, sensibilidadeAtual * 1.4);
    const toleranciaLum = Math.max(14, sensibilidadeAtual * 1.7);

    const parecidoPorRgb = distRgb <= toleranciaRgb;

    const parecidoPorCor =
      diffHue <= toleranciaHue &&
      diffSat <= toleranciaSat &&
      diffLum <= toleranciaLum;

    return parecidoPorRgb || parecidoPorCor;
  }

  function ajustarCanal(
    valor: number,
    brilhoAtual: number,
    contrasteAtual: number
  ) {
    let v = valor;

    v = v * (brilhoAtual / 100);

    const fator = contrasteAtual / 100;
    v = (v - 128) * fator + 128;

    return Math.max(0, Math.min(255, v));
  }

  function aplicarSaturacao(
    r: number,
    g: number,
    b: number,
    saturacaoAtual: number
  ) {
    const cinza = 0.299 * r + 0.587 * g + 0.114 * b;
    const fator = saturacaoAtual / 100;

    return {
      r: Math.max(0, Math.min(255, cinza + (r - cinza) * fator)),
      g: Math.max(0, Math.min(255, cinza + (g - cinza) * fator)),
      b: Math.max(0, Math.min(255, cinza + (b - cinza) * fator)),
    };
  }

  function encontrarObjetoPrincipal(
    alpha: Uint8Array,
    width: number,
    height: number
  ) {
    const visitado = new Uint8Array(width * height);
    let melhorComponente: number[] = [];

    const direcoes = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const inicio = pixelIndex(x, y, width);

        if (visitado[inicio] || alpha[inicio] === 0) continue;

        const fila: number[] = [inicio];
        const componente: number[] = [];
        visitado[inicio] = 1;

        while (fila.length) {
          const atual = fila.pop()!;
          componente.push(atual);

          const cx = atual % width;
          const cy = Math.floor(atual / width);

          for (const [dx, dy] of direcoes) {
            const nx = cx + dx;
            const ny = cy + dy;

            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

            const np = pixelIndex(nx, ny, width);

            if (!visitado[np] && alpha[np] > 0) {
              visitado[np] = 1;
              fila.push(np);
            }
          }
        }

        if (componente.length > melhorComponente.length) {
          melhorComponente = componente;
        }
      }
    }

    return new Set(melhorComponente);
  }

  function selecionarCorManual(e: React.MouseEvent<HTMLImageElement>) {
    if (!imagemOriginalRef.current) return;
      
    const img = imagemOriginalRef.current;
    const rect = img.getBoundingClientRect();

    const x = Math.floor(
      ((e.clientX - rect.left) / rect.width) * img.naturalWidth
    );
    const y = Math.floor(
      ((e.clientY - rect.top) / rect.height) * img.naturalHeight
    );

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;

    const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
    if (!tempCtx) return;

    tempCtx.drawImage(img, 0, 0);

    const pixel = tempCtx.getImageData(x, y, 1, 1).data;

    if (varinhaAtiva) {
  setCoresAlvoManuais([
    {
      r: pixel[0],
      g: pixel[1],
      b: pixel[2],
    },
  ]);

  removerFundo();

  return;
}

    setCoresAlvoManuais((cores) => {
      const novaCor = {
        r: pixel[0],
        g: pixel[1],
        b: pixel[2],
      };

      setModo("objeto");
      setRemoverBrancoInterno(true);
      setPontoVarinha({ x, y });
      setVarinhaAtiva(false);
      setAviso("Cor capturada. A varinha mágica vai remover tons parecidos com essa cor.");

      const jaExisteParecida = cores.some(
        (cor) =>
          distanciaCor(
            cor.r,
            cor.g,
            cor.b,
            novaCor.r,
            novaCor.g,
            novaCor.b
          ) < 12
      );

      if (jaExisteParecida) return cores;

      return [...cores, novaCor];
    });
  }

  function guardarBaseEdicao(canvas: HTMLCanvasElement) {
    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = canvas.width;
    baseCanvas.height = canvas.height;

    const baseCtx = baseCanvas.getContext("2d");
    if (!baseCtx) return;

    baseCtx.drawImage(canvas, 0, 0);
    baseEdicaoCanvasRef.current = baseCanvas;
    const originalCanvas = document.createElement("canvas");
originalCanvas.width = canvas.width;
originalCanvas.height = canvas.height;

const originalCtx = originalCanvas.getContext("2d");
if (originalCtx) {
  originalCtx.drawImage(canvas, 0, 0);
  imagemOriginalCanvasRef.current = originalCanvas;
}
    setImagemBaseEdicao(baseCanvas.toDataURL("image/png"));
  }

  function salvarHistoricoEdicao() {
  if (!imagemFinal) return;

  historicoEdicaoRef.current = [
    ...historicoEdicaoRef.current.slice(-14),
    imagemFinal,
  ];
}

  function iniciarPincelResultado(e: React.PointerEvent<HTMLImageElement>) {
    if (!pincelAtivo || !imagemFinal || espacoPressionadoRef.current) return;

    salvarHistoricoEdicao();

    editandoPincelRef.current = true;
    aplicarPincelResultado(e);
  }

  function desfazerUltimoPincel() {
    const anterior = historicoEdicaoRef.current.pop();

    if (!anterior) {
      setAviso("Ainda não há edição manual para desfazer.");
      return;
    }

    setImagemFinal(anterior);

    const img = new Image();
    img.src = anterior;

    img.onload = () => {
      const canvasPrincipal = canvasRef.current;
      const ctxPrincipal = canvasPrincipal?.getContext("2d");

      if (canvasPrincipal && ctxPrincipal) {
        canvasPrincipal.width = img.naturalWidth;
        canvasPrincipal.height = img.naturalHeight;
        ctxPrincipal.clearRect(0, 0, canvasPrincipal.width, canvasPrincipal.height);
        ctxPrincipal.drawImage(img, 0, 0);
      }
    };
  }

  function aplicarPincelResultado(e: React.PointerEvent<HTMLImageElement>) {
  if (!pincelAtivo || !canvasRef.current || !baseEdicaoCanvasRef.current) return;
  if (espacoPressionadoRef.current) return;

  const imgResultado = e.currentTarget;
  const rect = imgResultado.getBoundingClientRect();

  const x = Math.floor(
    ((e.clientX - rect.left) / rect.width) * canvasRef.current.width
  );

  const y = Math.floor(
    ((e.clientY - rect.top) / rect.height) * canvasRef.current.height
  );

  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  
  const canvasRestauracao =
  ferramentaPincel === "restaurar" && imagemOriginalCanvasRef.current
    ? imagemOriginalCanvasRef.current
    : baseEdicaoCanvasRef.current;

const baseCtx = canvasRestauracao.getContext("2d", {
  willReadFrequently: true,
});

  if (!ctx || !baseCtx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const baseData = baseCtx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  ).data;

  const pressao =
    usarPressaoCaneta && e.pointerType === "pen"
      ? Math.max(0.15, e.pressure || 0.5)
      : 1;

  const raio = Math.max(2, (tamanhoPincel * pressao) / 2);
  const raioQuadrado = raio * raio;

  const anterior = ultimoPontoPincelRef.current ?? { x, y };

  const distancia = Math.hypot(x - anterior.x, y - anterior.y);

  const passos = Math.max(
    1,
    Math.ceil(distancia / Math.max(1, raio / 6))
  );

  for (let passo = 0; passo <= passos; passo++) {
    const cx = anterior.x + ((x - anterior.x) * passo) / passos;
    const cy = anterior.y + ((y - anterior.y) * passo) / passos;

    const inicioX = Math.max(0, Math.floor(cx - raio));
    const fimX = Math.min(canvas.width - 1, Math.ceil(cx + raio));
    const inicioY = Math.max(0, Math.floor(cy - raio));
    const fimY = Math.min(canvas.height - 1, Math.ceil(cy + raio));

    for (let py = inicioY; py <= fimY; py++) {
      for (let px = inicioX; px <= fimX; px++) {
        const dx = px - cx;
        const dy = py - cy;

        if (dx * dx + dy * dy > raioQuadrado) continue;

        const di = dataIndex(px, py, canvas.width);

        const distanciaCentro = Math.sqrt(dx * dx + dy * dy);
        const forca = Math.max(0, 1 - distanciaCentro / raio);
        let curvaTextura = 1.8;

if (texturaPincel === "duro") {
  curvaTextura = 0.45;
}

if (texturaPincel === "medio") {
  curvaTextura = 1.8;
}

if (texturaPincel === "suave") {
  curvaTextura = 3.2;
}

const curvaFinal =
  curvaTextura + featherPincel * 4.5;

let suavidade = Math.pow(forca, curvaFinal);

if (texturaPincel === "duro" && featherPincel < 0.08) {
  suavidade = forca > 0.06 ? 1 : forca;
}

        if (ferramentaPincel === "apagar") {
          data[di + 3] = Math.round(data[di + 3] * (1 - suavidade));
        } else {
          data[di] = Math.round(data[di] + (baseData[di] - data[di]) * suavidade);
          data[di + 1] = Math.round(data[di + 1] + (baseData[di + 1] - data[di + 1]) * suavidade);
          data[di + 2] = Math.round(data[di + 2] + (baseData[di + 2] - data[di + 2]) * suavidade);
          data[di + 3] = Math.round(data[di + 3] + (baseData[di + 3] - data[di + 3]) * suavidade);
        }
      }
    }
  }

  ultimoPontoPincelRef.current = { x, y };

  ctx.putImageData(imageData, 0, 0);
  setImagemFinal(canvas.toDataURL("image/png"));
}


  async function removerFundoPessoaMediaPipe() {
    if (!imagemOriginal || !canvasRef.current) return;

    setProcessando(true);
    setAviso(
  "⏳ Aguarde enquanto removemos o objeto selecionado.\n\nSó mais um instante...\n\n✨ Últimos retoques..."
);
    setErro("");

    try {
      const img = new Image();
      img.src = imagemOriginal;

      img.onload = async () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          setErro("Não foi possível processar a imagem.");
          setProcessando(false);
          return;
        }

        const maxWidth = 1800;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        guardarBaseEdicao(canvas);

        const segmenter = await bodySegmentation.createSegmenter(
          bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
          {
            runtime: "mediapipe",
            solutionPath:
              "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation",
            modelType: "general",
          }
        );

        const pessoas = await segmenter.segmentPeople(canvas);

        if (!pessoas || pessoas.length === 0) {
          setErro("Não consegui detectar uma pessoa principal nessa imagem.");
          setProcessando(false);
          return;
        }

        const foreground = await bodySegmentation.toBinaryMask(
          pessoas,
          { r: 255, g: 255, b: 255, a: 255 },
          { r: 0, g: 0, b: 0, a: 0 },
          true,
          0.55
        );

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const maskData = foreground.data;

        for (let i = 0; i < data.length; i += 4) {
          const alphaMascara = maskData[i + 3];

          if (alphaMascara === 0) {
            data[i + 3] = 0;
            continue;
          }

          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          r = ajustarCanal(r, brilho, contraste);
          g = ajustarCanal(g, brilho, contraste);
          b = ajustarCanal(b, brilho, contraste);

          const sat = aplicarSaturacao(r, g, b, saturacao);

          data[i] = sat.r;
          data[i + 1] = sat.g;
          data[i + 2] = sat.b;
          data[i + 3] = Math.round(alphaMascara * (opacidade / 100));
        }

        ctx.putImageData(imageData, 0, 0);

        setImagemFinal(canvas.toDataURL("image/png"));
        setProcessando(false);
      };

      img.onerror = () => {
        setErro("Erro ao carregar imagem.");
        setProcessando(false);
      };
    } catch (error) {
      console.error(error);
      setErro("Não foi possível usar o modo Pessoa Rápido nessa imagem.");
      setProcessando(false);
    }
  }

  async function removerFundoPessoaBodyPix() {
    if (!imagemOriginal || !canvasRef.current) return;

    setProcessando(true);
    setErro("");

    try {
      const img = new Image();
      img.src = imagemOriginal;

      img.onload = async () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          setErro("Não foi possível processar a imagem.");
          setProcessando(false);
          return;
        }

        const maxWidth = 1800;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        guardarBaseEdicao(canvas);

        const net = await bodyPix.load({
          architecture: "MobileNetV1",
          outputStride: 16,
          multiplier: 0.75,
          quantBytes: 2,
        });

        const segmentation = await net.segmentMultiPerson(canvas, {
          internalResolution: "medium",
          segmentationThreshold: 0.7,
          maxDetections: 2,
          scoreThreshold: 0.2,
          nmsRadius: 20,
        });

        if (!segmentation || segmentation.length === 0) {
          setErro("Não consegui detectar pessoas nessa imagem.");
          setProcessando(false);
          return;
        }

        const pessoasPrincipais = [...segmentation]
          .map((pessoa) => ({
            pessoa,
            area: pessoa.data.reduce(
              (total, pixel) => total + (pixel ? 1 : 0),
              0
            ),
          }))
          .sort((a, b) => b.area - a.area)
          .slice(0, 2)
          .map((item) => item.pessoa);

        const mask = bodyPix.toMask(
          pessoasPrincipais,
          { r: 255, g: 255, b: 255, a: 255 },
          { r: 0, g: 0, b: 0, a: 0 }
        );

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const maskData = mask.data;

        for (let i = 0; i < data.length; i += 4) {
          const alphaMascara = maskData[i + 3];

          if (alphaMascara === 0) {
            data[i + 3] = 0;
            continue;
          }

          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          r = ajustarCanal(r, brilho, contraste);
          g = ajustarCanal(g, brilho, contraste);
          b = ajustarCanal(b, brilho, contraste);

          const sat = aplicarSaturacao(r, g, b, saturacao);

          data[i] = sat.r;
          data[i + 1] = sat.g;
          data[i + 2] = sat.b;
          data[i + 3] = Math.round(alphaMascara * (opacidade / 100));
        }

        ctx.putImageData(imageData, 0, 0);

        setImagemFinal(canvas.toDataURL("image/png"));
        setProcessando(false);
      };

      img.onerror = () => {
        setErro("Erro ao carregar imagem.");
        setProcessando(false);
      };
    } catch (error) {
      console.error(error);
      setErro("Não foi possível usar o modo Pessoa Alternativo nessa imagem.");
      setProcessando(false);
    }
  }

  function removerFundoPessoa() {
    if (motorPessoa === "mediapipe") {
      removerFundoPessoaMediaPipe();
      return;
    }

    removerFundoPessoaBodyPix();
  }

  function removerFundo() {
    if (modo === "pessoa") {
      removerFundoPessoa();
      return;
    }

    if (!imagemOriginal || !canvasRef.current) return;

    setProcessando(true);
    setErro("");

    if (imagemFinal) {
    salvarHistoricoEdicao();
}

    const img = new Image();
    img.src = imagemOriginal;

    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        setErro("Não foi possível processar a imagem.");
        setProcessando(false);
        return;
      }

      const maxWidth = 1800;
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;

      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      guardarBaseEdicao(canvas);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const width = canvas.width;
      const height = canvas.height;
      const totalPixels = width * height;

      let pixelsTransparentes = 0;

      for (let i = 0; i < totalPixels; i++) {
        const alpha = data[i * 4 + 3];

        if (alpha < 250) {
          pixelsTransparentes++;
        }
      }

      const percentualTransparente = (pixelsTransparentes / totalPixels) * 100;

      if (percentualTransparente > 5) {
        setAviso(
          "Essa imagem já está sem fundo. Envie outra imagem com fundo para remover."
        );
        setImagemFinal(null);
        setProcessando(false);
        return;
      }

      if (modo === "assinatura") {
        const cantos = [
          dataIndex(0, 0, width),
          dataIndex(width - 1, 0, width),
          dataIndex(0, height - 1, width),
          dataIndex(width - 1, height - 1, width),
        ];

        const fundoR = Math.round(
          cantos.reduce((s, i) => s + data[i], 0) / cantos.length
        );
        const fundoG = Math.round(
          cantos.reduce((s, i) => s + data[i + 1], 0) / cantos.length
        );
        const fundoB = Math.round(
          cantos.reduce((s, i) => s + data[i + 2], 0) / cantos.length
        );

        const toleranciaFundo = 45;

        for (let i = 0; i < totalPixels; i++) {
          const di = i * 4;

          const r = data[di];
          const g = data[di + 1];
          const b = data[di + 2];

          const distancia = Math.sqrt(
            Math.pow(r - fundoR, 2) +
              Math.pow(g - fundoG, 2) +
              Math.pow(b - fundoB, 2)
          );

          if (distancia <= toleranciaFundo) {
            data[di + 3] = 0;
          } else {
            data[di] = 0;
            data[di + 1] = 0;
            data[di + 2] = 0;
            data[di + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);

        setImagemFinal(canvas.toDataURL("image/png"));
        setProcessando(false);
        return;
      }

      const remover = new Uint8Array(totalPixels);
      const visitado = new Uint8Array(totalPixels);

      const cantos = [
        dataIndex(0, 0, width),
        dataIndex(width - 1, 0, width),
        dataIndex(0, height - 1, width),
        dataIndex(width - 1, height - 1, width),
      ];

      const coresBase =
        coresAlvoManuais.length > 0
          ? coresAlvoManuais
          : [
              {
                r: Math.round(
                  cantos.reduce((s, i) => s + data[i], 0) / cantos.length
                ),
                g: Math.round(
                  cantos.reduce((s, i) => s + data[i + 1], 0) / cantos.length
                ),
                b: Math.round(
                  cantos.reduce((s, i) => s + data[i + 2], 0) / cantos.length
                ),
              },
            ];

      const fila: Array<[number, number]> = [];

      for (let x = 0; x < width; x++) {
        fila.push([x, 0], [x, height - 1]);
      }

      for (let y = 0; y < height; y++) {
        fila.push([0, y], [width - 1, y]);
      }

      while (fila.length) {
        const item = fila.pop();
        if (!item) continue;

        const [x, y] = item;

        if (x < 0 || y < 0 || x >= width || y >= height) continue;

        const p = pixelIndex(x, y, width);
        if (visitado[p]) continue;

        visitado[p] = 1;

        const di = dataIndex(x, y, width);
        const r = data[di];
        const g = data[di + 1];
        const b = data[di + 2];

        const parecidoComFundo = coresBase.some((corBase) =>
  pareceCorDoFundo(
    r,
    g,
    b,
    corBase.r,
    corBase.g,
    corBase.b,
    varinhaAtiva ? toleranciaVarinha : sensibilidade
  )
);

        if (parecidoComFundo) {
          remover[p] = 1;

          fila.push([x + 1, y]);
          fila.push([x - 1, y]);
          fila.push([x, y + 1]);
          fila.push([x, y - 1]);
        }
      }

      if (
  removerBrancoInterno &&
  modo === "objeto" &&
  pontoVarinha
) {
  const filaFlood: Array<[number, number]> = [
    [pontoVarinha.x, pontoVarinha.y],
  ];

  const visitadoFlood = new Uint8Array(totalPixels);

  while (filaFlood.length) {
    const item = filaFlood.pop();
    if (!item) continue;

    const [x, y] = item;

    if (x < 0 || y < 0 || x >= width || y >= height) continue;

    const p = pixelIndex(x, y, width);

    if (visitadoFlood[p]) continue;

    visitadoFlood[p] = 1;

    const di = dataIndex(x, y, width);

    const r = data[di];
    const g = data[di + 1];
    const b = data[di + 2];

    const parecido = coresBase.some((corBase) =>
  pareceCorDoFundo(
    r,
    g,
    b,
    corBase.r,
    corBase.g,
    corBase.b,
    varinhaAtiva ? toleranciaVarinha : sensibilidade
  )
);

    if (!parecido) continue;

    remover[p] = 1;

    filaFlood.push([x + 1, y]);
    filaFlood.push([x - 1, y]);
    filaFlood.push([x, y + 1]);
    filaFlood.push([x, y - 1]);
  }
}

      if (manterObjetoPrincipal && modo === "objeto") {
        const alphaTemp = new Uint8Array(totalPixels);

        for (let i = 0; i < totalPixels; i++) {
          alphaTemp[i] = remover[i] ? 0 : 255;
        }

        const principal = encontrarObjetoPrincipal(alphaTemp, width, height);

        for (let i = 0; i < totalPixels; i++) {
          if (!principal.has(i)) {
            remover[i] = 1;
          }
        }
      }

      for (let i = 0; i < totalPixels; i++) {
        const di = i * 4;

        if (remover[i]) {
          data[di + 3] = 0;
          continue;
        }

        let r = data[di];
        let g = data[di + 1];
        let b = data[di + 2];

        r = ajustarCanal(r, brilho, contraste);
        g = ajustarCanal(g, brilho, contraste);
        b = ajustarCanal(b, brilho, contraste);

        const sat = aplicarSaturacao(r, g, b, saturacao);

        data[di] = sat.r;
        data[di + 1] = sat.g;
        data[di + 2] = sat.b;
        data[di + 3] = Math.round(255 * (opacidade / 100));
      }

      if (suavizacao > 0) {
        const copia = new Uint8ClampedArray(data);

        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const di = dataIndex(x, y, width);

            if (copia[di + 3] === 0) continue;

            let alphaTotal = 0;
            let count = 0;

            for (let yy = -suavizacao; yy <= suavizacao; yy++) {
              for (let xx = -suavizacao; xx <= suavizacao; xx++) {
                const nx = x + xx;
                const ny = y + yy;

                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

                const ndi = dataIndex(nx, ny, width);
                alphaTotal += copia[ndi + 3];
                count++;
              }
            }

            if (count > 0) {
              data[di + 3] = alphaTotal / count;
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      setImagemFinal(canvas.toDataURL("image/png"));
      setProcessando(false);
    };

    img.onerror = () => {
      setErro("Erro ao carregar imagem.");
      setProcessando(false);
    };
  }

  useEffect(() => {
    function controlarZoomPeloTeclado(e: KeyboardEvent) {
      if (!imagemFinal) return;

      if (e.code === "Space") {
  e.preventDefault();
  espacoPressionadoRef.current = true;
  setEspacoPressionado(true);
  return;
}

if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
  e.preventDefault();
  desfazerUltimoPincel();
  return;
}

if (e.key === "[") {
  e.preventDefault();
  setTamanhoPincel((v) => Math.max(4, v - 2));
  return;
}

if (e.key === "]") {
  e.preventDefault();
  setTamanhoPincel((v) => Math.min(120, v + 2));
  return;
}

if (e.key.toLowerCase() === "x") {
  e.preventDefault();
  setFerramentaPincel((atual) =>
    atual === "apagar" ? "restaurar" : "apagar"
  );
  setPincelAtivo(true);
  return;
}

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoomResultado((z) => Math.min(5, Number((z + 0.1).toFixed(2))));
      }

      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setZoomResultado((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))));
      }

      if (e.key === "0") {
        e.preventDefault();
        setZoomResultado(1);
        setPanResultado({ x: 0, y: 0 });
      }
    }

    window.addEventListener("keydown", controlarZoomPeloTeclado);

    function soltarEspaco(e: KeyboardEvent) {
  if (e.code === "Space") {
    espacoPressionadoRef.current = false;
    setEspacoPressionado(false);
  }
}

window.addEventListener("keyup", soltarEspaco);


    return () => {
      window.removeEventListener("keydown", controlarZoomPeloTeclado);
      window.removeEventListener("keyup", soltarEspaco);
    };
    
  }, [imagemFinal]);

  useEffect(() => {
  if (!modalRemoverObjetoAberto || !imagemOriginal || !canvasRemoverObjetoRef.current) return;

  const img = new Image();
  img.src = imagemOriginal;

  img.onload = () => {
    const canvas = canvasRemoverObjetoRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
}, [modalRemoverObjetoAberto, imagemOriginal]);

  useEffect(() => {
    if (zoomResultado <= 1) {
      setPanResultado({ x: 0, y: 0 });
    }
  }, [zoomResultado]);

 function atualizarLupa(e: React.PointerEvent<HTMLImageElement>) {
  if (!canvasRef.current || !pincelAtivo) return;

  const rect = e.currentTarget.getBoundingClientRect();

  const xRelativo = e.clientX - rect.left;
  const yRelativo = e.clientY - rect.top;

  const xImagem = Math.floor(
    (xRelativo / rect.width) * canvasRef.current.width
  );

  const yImagem = Math.floor(
    (yRelativo / rect.height) * canvasRef.current.height
  );

  setPosicaoCursor({
    x: e.clientX,
    y: e.clientY,
  });

  setPosicaoImagemCursor({
    x: xImagem,
    y: yImagem,
  });

  setMostrarLupa(true);
}

function podeUsarIAAgora() {
  if (!creditosPublicosLiberados) {
    setPopupComprarCreditosAberto(true);
    return false;
  }

  return true;
}

async function melhorarComIA() {

  if (!imagemOriginal) {
    setAviso("Envie uma imagem antes de usar a IA.");
    return;
  }

  if (!podeUsarIAAgora()) return;

  setProcessando(true);
  setErro("");

  try {
    const resposta = await fetch("/api/ia/upscale", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: imagemOriginal,
      }),
    });

    const data = await resposta.json();

    if (!resposta.ok) {
      if (data.error === "SEM_CREDITOS" || data.erro === "SEM_CREDITOS") {
        setPopupComprarCreditosAberto(true);
        return;
      }

      setAviso(data.mensagem || "Não foi possível melhorar a imagem com IA.");
      return;
    }

    setImagemOriginal(data.imagemUrl);
    setImagemFinal(null);
    setCoresAlvoManuais([]);
    setPontoVarinha(null);
    setZoomOriginal(1);
    setPanOriginal({ x: 0, y: 0 });

    setAviso(`Imagem original melhorada com IA. Agora clique em Remover fundo. Saldo restante: ${data.saldo}`);
  } catch (error) {
    console.error(error);
    setAviso("Erro ao conectar com a IA.");
  } finally {
    setProcessando(false);
  }
}

async function removerFundoComIA() {

  if (!imagemOriginal) {
    setAviso("Envie uma imagem antes de remover o fundo com IA.");
    return;
  }

  if (!podeUsarIAAgora()) return;

  setProcessando(true);
  setErro("");

  try {
    const resposta = await fetch("/api/ia/remover-fundo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: imagemOriginal,
        modo: "rapido",
      }),
    });

    const data = await resposta.json();

    if (!resposta.ok) {
      if (data.error === "SEM_CREDITOS" || data.erro === "SEM_CREDITOS") {
        setPopupComprarCreditosAberto(true);
        return;
      }

      setAviso(data.mensagem || "Não foi possível remover o fundo com IA.");
      return;
    }

    setImagemFinal(data.imagemUrl);
    setZoomResultado(1);
    setPanResultado({ x: 0, y: 0 });

    setAviso(`Fundo removido com IA. Saldo restante: ${data.saldo}`);
  } catch (error) {
    console.error(error);
    setAviso("Erro ao conectar com a IA de remoção de fundo.");
  } finally {
    setProcessando(false);
  }
}

async function recorteAvancadoComIA() {

  if (!imagemOriginal) {
  setAviso("Envie uma imagem antes de usar o recorte avançado.");
  return;
}

if (!podeUsarIAAgora()) return;

  setProcessando(true);
  setErro("");

  try {
    const resposta = await fetch("/api/ia/remover-fundo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: imagemOriginal,
        modo: "avancado",
      }),
    });

    const data = await resposta.json();

    if (!resposta.ok) {
      if (data.error === "SEM_CREDITOS" || data.erro === "SEM_CREDITOS") {
        setPopupComprarCreditosAberto(true);
        return;
      }

      setAviso(data.mensagem || "Não foi possível fazer o recorte avançado.");
      return;
    }

    setImagemFinal(data.imagemUrl);
    setImagemBaseEdicao(data.imagemUrl);
    setZoomResultado(1);
    setPanResultado({ x: 0, y: 0 });

    setAviso(`Recorte avançado concluído. Saldo restante: ${data.saldo}`);
  } catch (error) {
    console.error(error);
    setAviso("Erro ao conectar com a IA de recorte avançado.");
  } finally {
    setProcessando(false);
  }
}

async function recorteProfissionalComIA() {
  if (!imagemOriginal) {
    setAviso("Envie uma imagem antes de usar o recorte profissional.");
    return;
  }

  if (!podeUsarIAAgora()) return;

  setProcessando(true);
  setErro("");

  try {
    const resposta = await fetch("/api/ia/recorte-profissional", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: imagemOriginal,
      }),
    });

    const data = await resposta.json();

    if (!resposta.ok) {
      if (data.error === "SEM_CREDITOS" || data.erro === "SEM_CREDITOS") {
        setPopupComprarCreditosAberto(true);
        return;
      }

      setAviso(data.mensagem || "Não foi possível fazer o recorte profissional.");
      return;
    }

    setImagemFinal(data.imagemUrl);
    setImagemBaseEdicao(data.imagemUrl);
    setZoomResultado(1);
    setPanResultado({ x: 0, y: 0 });

    setAviso(`Recorte profissional concluído. Saldo restante: ${data.saldo}`);
  } catch (error) {
    console.error(error);
    setAviso("Erro ao conectar com a IA de recorte profissional.");
  } finally {
    setProcessando(false);
  }
}

function salvarHistoricoMascara() {
  const canvas = canvasRemoverObjetoRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

  setHistoricoMascaras((prev) => [...prev.slice(-9), snapshot]);
}

function pintarMascaraObjeto(e: React.PointerEvent<HTMLCanvasElement>) {
  if (!pincelAtivo || !canvasRemoverObjetoRef.current) return;

  const canvas = canvasRemoverObjetoRef.current;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();

  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

  ctx.fillStyle = "rgba(255, 0, 120, 0.65)";
  ctx.beginPath();
  ctx.arc(x, y, tamanhoPincel / 2, 0, Math.PI * 2);
  ctx.fill();
}

function iniciarAvisoProcessamentoIA() {
  const etapas = [
    {
      texto: "🔎 Analisando a área pintada...",
      progresso: 15,
    },
    {
      texto: "🧠 Reconstruindo o fundo com IA...",
      progresso: 35,
    },
    {
      texto: "🎨 Ajustando luz, sombras e detalhes...",
      progresso: 55,
    },
    {
      texto: "✨ Refinando acabamento...",
      progresso: 75,
    },
    {
      texto: "🌟 Últimos retoques...",
      progresso: 92,
    },
  ];

  setPopupProcessandoIA(true);
  setAviso("⏳ Preparando remoção...");
  setProgressoFakeIA(5);

  let etapaAtual = 0;

  const intervalo = window.setInterval(() => {
    if (etapaAtual >= etapas.length) return;

    setAviso(etapas[etapaAtual].texto);
    setProgressoFakeIA(etapas[etapaAtual].progresso);

    etapaAtual++;
  }, 7000);

  return intervalo;
}

async function removerObjetoComIA() {
  if (!imagemOriginal || !canvasRemoverObjetoRef.current) {
  setAviso("Envie uma imagem e pinte o objeto que deseja remover.");
  return;
}

if (!podeUsarIAAgora()) return;


  const canvasPintura = canvasRemoverObjetoRef.current;
  const ctxPintura = canvasPintura.getContext("2d", {
    willReadFrequently: true,
  });

  if (!ctxPintura) {
    setAviso("Não foi possível ler a área pintada.");
    return;
  }

  const imageData = ctxPintura.getImageData(
    0,
    0,
    canvasPintura.width,
    canvasPintura.height
  );

  const data = imageData.data;

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvasPintura.width;
  maskCanvas.height = canvasPintura.height;

  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) return;

  const maskData = maskCtx.createImageData(maskCanvas.width, maskCanvas.height);

  let temPintura = false;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const ehRosa =
      r > 180 &&
      g < 90 &&
      b > 90;

    if (ehRosa) {
      temPintura = true;

      maskData.data[i] = 255;
      maskData.data[i + 1] = 255;
      maskData.data[i + 2] = 255;
      maskData.data[i + 3] = 255;
    } else {
      maskData.data[i] = 0;
      maskData.data[i + 1] = 0;
      maskData.data[i + 2] = 0;
      maskData.data[i + 3] = 255;
    }
  }

  if (!temPintura) {
    setAviso("Pinte primeiro o objeto que deseja remover.");
    return;
  }

  maskCtx.putImageData(maskData, 0, 0);

  const dilatarCanvas = document.createElement("canvas");
dilatarCanvas.width = maskCanvas.width;
dilatarCanvas.height = maskCanvas.height;

const dilatarCtx = dilatarCanvas.getContext("2d");
if (dilatarCtx) {
  dilatarCtx.drawImage(maskCanvas, 0, 0);

  maskCtx.filter = "blur(8px)";
  maskCtx.drawImage(dilatarCanvas, 0, 0);
  maskCtx.filter = "none";

  const dilatada = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

  for (let i = 0; i < dilatada.data.length; i += 4) {
    const valor = dilatada.data[i] > 8 ? 255 : 0;

    dilatada.data[i] = valor;
    dilatada.data[i + 1] = valor;
    dilatada.data[i + 2] = valor;
    dilatada.data[i + 3] = 255;
  }

  maskCtx.putImageData(dilatada, 0, 0);
}

  setProcessando(true);
setErro("");

const intervaloAviso = iniciarAvisoProcessamentoIA();
  try {

    const maskExpandida = document.createElement("canvas");
maskExpandida.width = maskCanvas.width;
maskExpandida.height = maskCanvas.height;

const expandCtx = maskExpandida.getContext("2d");

if (!expandCtx) {
  throw new Error("Erro ao preparar máscara");
}

expandCtx.filter = "blur(10px)";
expandCtx.drawImage(maskCanvas, 0, 0);

    const resposta = await fetch("/api/ia/remover-objeto", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
     
body: JSON.stringify({
  imageUrl: imagemOriginal,
  maskUrl: maskExpandida.toDataURL("image/png"),
}),
    });

    const dataResposta = await resposta.json();

    console.log("RESPOSTA IA:", dataResposta);

    if (!resposta.ok) {
      setPopupProcessandoIA(false);
      if (dataResposta.error === "SEM_CREDITOS" || dataResposta.erro === "SEM_CREDITOS") {
  setPopupProcessandoIA(false);
  setPopupComprarCreditosAberto(true);
  return;
}

      setAviso(
    dataResposta.mensagem ||
    "Não foi possível remover agora. Ajuste a área pintada ou tente pintar um pouco maior."
);
      return;
    }

    
    setPopupProcessandoIA(false);
    setProgressoFakeIA(100);
    setImagemFinal(dataResposta.imagemUrl);

const imgResultado = new Image();
imgResultado.crossOrigin = "anonymous";

imgResultado.onload = () => {
  const canvas = canvasRemoverObjetoRef.current;
  const ctx = canvas?.getContext("2d");

  if (!canvas || !ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgResultado, 0, 0, canvas.width, canvas.height);
};

imgResultado.src = dataResposta.imagemUrl;

setPincelAtivo(true);
setHistoricoMascaras([]);

    setAviso(
  "✅ Objeto removido com sucesso!\n\nVocê pode selecionar outro objeto e continuar editando."
);
  } catch (error) {
    setPopupProcessandoIA(false);
    console.error(error);
    setAviso("Não foi possível conectar com a IA agora. Tente novamente em alguns segundos.");
  } finally {
    window.clearInterval(intervaloAviso);
setProcessando(false);
  }
}

  function baixarImagem(tipo: DownloadTipo) {
    if (!imagemFinal || !canvasRef.current) return;

    const canvas = canvasRef.current;
    let url = imagemFinal;

    if (tipo !== "png") {
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;

      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;

      if (tipo === "jpg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }

      const img = new Image();
      img.src = imagemFinal;

      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        url =
          tipo === "jpg"
            ? exportCanvas.toDataURL("image/jpeg", 0.95)
            : exportCanvas.toDataURL("image/webp", 0.95);

        const link = document.createElement("a");
        link.href = url;
        link.download = `phanyx-sem-fundo.${tipo}`;
        link.click();
      };

      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = "phanyx-sem-fundo.png";
    link.click();
  }

  function desfazerMascara() {
  const canvas = canvasRemoverObjetoRef.current;
  if (!canvas || historicoMascaras.length === 0) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const ultimo = historicoMascaras[historicoMascaras.length - 1];

  ctx.putImageData(ultimo, 0, 0);

  setHistoricoMascaras((prev) => prev.slice(0, -1));
}

function resetarMascara() {
  const canvas = canvasRemoverObjetoRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (imagemOriginal) {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imagemOriginal;
  }

  setHistoricoMascaras([]);
}

async function comprarPacoteCreditos(quantidade: number) {
  if (!compradorCreditos.nome.trim()) {
    setAviso("Informe seu nome para comprar créditos IA.");
    return;
  }

  if (!compradorCreditos.email.trim()) {
    setAviso("Informe seu e-mail para receber seus créditos IA.");
    return;
  }

  try {
    setComprandoPacote(quantidade);

    const resposta = await fetch("/api/ia/creditos/comprar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pacoteId: String(quantidade),
        nome: compradorCreditos.nome,
        email: compradorCreditos.email,
        whatsapp: compradorCreditos.whatsapp,
      }),
    });

    const data = await resposta.json();

    if (!resposta.ok) {
      setAviso(data?.erro || data?.error || "Erro ao iniciar pagamento.");
      return;
    }

    const urlPagamento =
      data.checkoutUrl ||
      data.invoiceUrl ||
      data.pagamento?.invoiceUrl ||
      data.pagamento?.bankSlipUrl;

    if (!urlPagamento) {
      setAviso("Pagamento criado, mas o link do Asaas não foi encontrado.");
      return;
    }

    window.open(urlPagamento, "_blank");
  } catch {
    setAviso("Erro ao iniciar pagamento.");
  } finally {
    setComprandoPacote(null);
  }
}

  return (
    <>

{popupComprarCreditosAberto && (
  <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
    <div className="w-full max-w-3xl rounded-3xl border border-cyan-400/30 bg-slate-950 p-6 text-white shadow-2xl shadow-cyan-500/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-cyan-200">
            Comprar créditos IA PHANYX
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Escolha um pacote para continuar usando as ferramentas de IA.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPopupComprarCreditosAberto(false)}
          className="rounded-full bg-slate-800 px-3 py-1 font-black text-white hover:bg-slate-700"
        >
          ✕
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
  {
    quantidade: 5,
    preco: "R$ 19,90",
    destaque: "Para testar",
    imagens: "Até 5 imagens",
  },
  {
    quantidade: 15,
    preco: "R$ 49,90",
    destaque: "Mais escolhido",
    imagens: "Até 15 imagens",
  },
  {
    quantidade: 50,
    preco: "R$ 129,90",
    destaque: "Melhor custo",
    imagens: "Até 50 imagens",
  },
].map((pacote) => (
          <div
            key={pacote.quantidade}
            className="rounded-3xl border border-cyan-400/20 bg-slate-900 p-5 text-center"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              {pacote.destaque}
            </p>

            <h3 className="mt-3 text-3xl font-black text-white">
              {pacote.quantidade}
            </h3>

            <p className="text-sm text-slate-300">
  créditos IA
</p>

<div className="mt-3 space-y-1 text-xs text-slate-300">
  <p className="font-semibold text-cyan-300">
    Até {pacote.quantidade} imagens com IA
  </p>
  <p>✨ Remover fundo com IA</p>
  <p>✨ Remover objetos com IA</p>
  <p>✨ Melhorar qualidade</p>
  <p>✨ Recorte profissional</p>
</div>

<div className="mt-3 space-y-1 text-xs text-slate-300">
  <p className="font-semibold text-cyan-300">
    {pacote.imagens}
  </p>
  <p>✨ Remover fundo com IA</p>
  <p>✨ Remover objetos com IA</p>
  <p>✨ Melhorar qualidade da imagem</p>
  <p>✨ Recorte profissional inteligente</p>
</div>

            <p className="mt-4 text-2xl font-black text-cyan-200">
              {pacote.preco}
            </p>

            <button
              type="button"
              disabled={comprandoPacote === pacote.quantidade}
              onClick={() => setPacoteCheckout(pacote.quantidade)}
              className="mt-5 w-full rounded-2xl bg-cyan-400 px-4 py-3 font-black text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {comprandoPacote === pacote.quantidade
                ? "Abrindo pagamento..."
                : "Comprar agora"}
            </button>
          </div>
        ))}

{pacoteCheckout && (
  <div className="mt-6 rounded-3xl border border-cyan-400/20 bg-slate-900 p-5">
    <h3 className="text-lg font-black text-cyan-200">
      Finalizar compra — {pacoteCheckout} créditos IA
    </h3>

    <div className="mt-4 grid gap-3 md:grid-cols-3">
      <input
        type="text"
        value={compradorCreditos.nome}
        onChange={(e) =>
          setCompradorCreditos((atual) => ({
            ...atual,
            nome: e.target.value,
          }))
        }
        placeholder="Seu nome"
        className="rounded-2xl border border-cyan-400/20 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
      />

      <input
        type="email"
        value={compradorCreditos.email}
        onChange={(e) =>
          setCompradorCreditos((atual) => ({
            ...atual,
            email: e.target.value,
          }))
        }
        placeholder="Seu e-mail"
        className="rounded-2xl border border-cyan-400/20 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
      />

      <input
        type="text"
        value={compradorCreditos.whatsapp}
        onChange={(e) =>
          setCompradorCreditos((atual) => ({
            ...atual,
            whatsapp: e.target.value,
          }))
        }
        placeholder="WhatsApp"
        className="rounded-2xl border border-cyan-400/20 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
      />
    </div>

    <button
      type="button"
      disabled={comprandoPacote === pacoteCheckout}
      onClick={() => comprarPacoteCreditos(pacoteCheckout)}
      className="mt-4 w-full rounded-2xl bg-cyan-400 px-4 py-3 font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
    >
      {comprandoPacote === pacoteCheckout
        ? "Abrindo pagamento..."
        : "Ir para pagamento Asaas"}
    </button>
  </div>
)}

      </div>
    </div>
  </div>
)}



      {aviso && (
  <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-3xl border border-cyan-400/30 bg-slate-950 p-6 text-center shadow-2xl shadow-cyan-500/20">
      <h2 className="text-2xl font-black text-cyan-200">
        Aviso PHANYX
      </h2>

      {popupProcessandoIA && (
        <div className="mx-auto mt-5 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-300" />
      )}

      <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-200">
        {aviso}
      </p>

      {popupProcessandoIA && (
        <div className="mt-5">
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all duration-700"
              style={{ width: `${progressoFakeIA}%` }}
            />
          </div>

          <p className="mt-2 text-xs font-bold text-cyan-200">
            {progressoFakeIA}%
          </p>
        </div>
      )}

      {!popupProcessandoIA && (
        <button
          type="button"
          onClick={() => setAviso(null)}
          className="mt-6 rounded-2xl bg-cyan-400 px-6 py-3 font-black text-slate-950 shadow-lg shadow-cyan-400/30 hover:bg-cyan-300"
        >
          Entendi
        </button>
      )}
    </div>
  </div>
)}

      {mostrarAjuda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="max-w-lg rounded-3xl border border-cyan-400/30 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-cyan-200">
                Como remover fundos coloridos
              </h2>

              <button
                type="button"
                onClick={() => setMostrarAjuda(false)}
                className="rounded-full bg-slate-800 px-3 py-1 font-bold text-white hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-200">
              <div>
                <strong className="text-cyan-300">Fundos simples:</strong>
                <br />
                Clique em qualquer área do fundo que deseja remover.
              </div>

              <div>
                <strong className="text-cyan-300">
                  Fundos com vários tons:
                </strong>
                <br />
                Clique em uma área média da cor dominante (nem muito clara nem
                muito escura).
              </div>

              <div>
                <strong className="text-cyan-300">Se sobrar halo:</strong>
                <br />
                Aumente a sensibilidade entre 50 e 80.
              </div>

              <div>
                <strong className="text-cyan-300">
                  Se apagar partes do objeto:
                </strong>
                <br />
                Reduza a sensibilidade.
              </div>

              <div>
                <strong className="text-cyan-300">Objetos complexos:</strong>
                <br />
                Ative "Manter apenas objeto principal".
              </div>
            </div>
          </div>
        </div>
      )}

      {modalRefinamentoAberto && imagemFinal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/95 p-2 text-white sm:p-4">
          <div className="mx-auto flex h-full max-w-7xl flex-col">
            {mostrarLupa && canvasRef.current && (
  <div
    className="pointer-events-none fixed z-[120] overflow-hidden rounded-full border-4 border-cyan-400 shadow-2xl bg-slate-950"
    style={{
      width: 180,
      height: 180,
      left: posicaoCursor.x + 26,
      top: posicaoCursor.y - 90,
    }}
  >
    <img
      src={imagemFinal}
      alt="Lupa"
      draggable={false}
      className="absolute inset-0 max-w-none"
      style={{
        width: canvasRef.current.width * 4,
        height: canvasRef.current.height * 4,
        transform: `translate(-${posicaoImagemCursor.x * 4 - 90}px, -${
          posicaoImagemCursor.y * 4 - 90
        }px)`,
      }}
    />

    <div
      className="absolute left-1/2 top-1/2 border border-cyan-200/70"
      style={{
        width: tamanhoPincel * 4,
        height: tamanhoPincel * 4,
        borderRadius: "9999px",
        transform: "translate(-50%, -50%)",
      }}
    />

    <div
      className="absolute left-1/2 top-1/2 h-4 w-px bg-cyan-200"
      style={{ transform: "translateX(-50%)" }}
    />

    <div
      className="absolute left-1/2 top-1/2 w-4 h-px bg-cyan-200"
      style={{ transform: "translateY(-50%)" }}
    />
  </div>
)}
            <div className="mb-2 flex flex-col gap-3 rounded-2xl border border-cyan-400/20 bg-slate-900 p-3 sm:mb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-cyan-200">
                  Refinamento manual em tela grande
                </h2>
                <p className="text-xs text-slate-300">
                  No celular: ligue o pincel e arraste sobre a imagem. No computador: use scroll para zoom e Espaço para mover.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                
<button
  type="button"
  onClick={() => setPincelAtivo((ativo) => !ativo)}
  className={`rounded-xl px-3 py-2 text-xs font-black ${
    pincelAtivo
      ? "bg-cyan-400 text-slate-950"
      : "bg-slate-800 text-white"
  }`}
>
  {pincelAtivo ? "🖌️ Pincel ligado" : "🖌️ Ligar pincel"}
</button>

                <button
                  type="button"
                  onClick={() => {
  setPincelAtivo(true);
  setFerramentaPincel("apagar");
}}
                  className={`rounded-xl px-3 py-2 text-xs font-black ${
                    ferramentaPincel === "apagar"
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-slate-800 text-white"
                  }`}
                >
                  Apagar sobra
                </button>

                <button
                  type="button"
                  onClick={() => {
  setPincelAtivo(true);
  setFerramentaPincel("restaurar");
}}
                  className={`rounded-xl px-3 py-2 text-xs font-black ${
                    ferramentaPincel === "restaurar"
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-slate-800 text-white"
                  }`}
                >
                  Restaurar parte
                </button>

                <button
                  type="button"
                  onClick={desfazerUltimoPincel}
                  className="rounded-xl border border-white/20 px-3 py-2 text-xs font-black text-white hover:bg-white/10"
                >
                  Desfazer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setZoomResultado(1);
                    setPanResultado({ x: 0, y: 0 });
                  }}
                  className="rounded-xl border border-white/20 px-3 py-2 text-xs font-black text-white hover:bg-white/10"
                >
                  Reset zoom
                </button>

                <button
                  type="button"
                  onClick={() => {
  if (canvasRef.current) {
    setImagemFinal(canvasRef.current.toDataURL("image/png"));
  }

  setModalRefinamentoAberto(false);
}}
                  className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white hover:bg-red-400"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="mb-2 rounded-2xl border border-cyan-400/20 bg-slate-900 p-2 sm:mb-3 sm:p-3">
              <Controle
                label="Tamanho do pincel"
                valor={tamanhoPincel}
                min={4}
                max={120}
                onChange={setTamanhoPincel}
              />

<div className="mt-3">
  <p className="mb-2 text-xs font-black text-cyan-100">
    Textura do pincel
  </p>

<div className="mt-4">
  <div className="mb-2 flex items-center justify-between text-xs font-black">
    <span className="text-cyan-100">Feather da borda</span>
    <span className="text-white">
      {Math.round(featherPincel * 100)}%
    </span>
  </div>

  <input
    type="range"
    min={0}
    max={1}
    step={0.01}
    value={featherPincel}
    onChange={(e) =>
      setFeatherPincel(Number(e.target.value))
    }
    className="w-full accent-cyan-400"
  />

  <div className="mt-1 flex justify-between text-[10px] text-slate-400">
    <span>Dura</span>
    <span>Suave</span>
  </div>
</div>

  <div className="grid grid-cols-3 gap-2">
    {(["duro", "medio", "suave"] as TexturaPincel[]).map((tipo) => (
      <button
        key={tipo}
        type="button"
        onClick={() => setTexturaPincel(tipo)}
        className={`rounded-xl px-3 py-2 text-xs font-black ${
          texturaPincel === tipo
            ? "bg-cyan-400 text-slate-950"
            : "bg-slate-800 text-white"
        }`}
      >
        {tipo === "duro"
          ? "Duro"
          : tipo === "medio"
            ? "Médio"
            : "Suave"}
      </button>
    ))}
  </div>
</div>

            </div>

            <div className="flex min-h-0 flex-1 select-none items-center justify-center overflow-hidden rounded-3xl border border-cyan-400/20 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[length:28px_28px] bg-[position:0_0,0_14px,14px_-14px,-14px_0] p-6">
  {imagemOriginal && imagemFinal && !pincelAtivo ? (
    <div className="relative max-h-[78vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-cyan-400/30 bg-slate-950 shadow-2xl shadow-cyan-500/20">
      <img
        src={imagemOriginal}
        alt="Antes"
        draggable={false}
        className="block max-h-[78vh] w-full select-none object-contain"
      />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${comparadorAntesDepois}%` }}
      >
        <img
          src={imagemFinal}
          alt="Depois"
          draggable={false}
          className="h-full w-full max-w-none select-none object-contain"
        />
      </div>

      <div
        className="absolute bottom-0 top-0 w-1 bg-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.95)]"
        style={{ left: `${comparadorAntesDepois}%` }}
      >
        <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-cyan-200 bg-slate-950 text-lg font-black text-cyan-200 shadow-2xl">
          ↔
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={comparadorAntesDepois}
        onChange={(e) => setComparadorAntesDepois(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        aria-label="Comparar antes e depois"
      />

      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/70 px-4 py-2 text-xs font-black text-white">
        Depois
      </div>

      <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-black/70 px-4 py-2 text-xs font-black text-white">
        Antes
      </div>
    </div>
  ) : (
    <img
      src={imagemFinal}
      alt="Resultado em refinamento"
      draggable={false}
      onPointerDown={(e) => {
        if (espacoPressionadoRef.current) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        iniciarPincelResultado(e);
      }}
      onPointerMove={(e) => {
        atualizarLupa(e);

        if (!pincelAtivo || !editandoPincelRef.current) return;

        aplicarPincelResultado(e);
      }}
      onPointerUp={() => {
        editandoPincelRef.current = false;
        ultimoPontoPincelRef.current = null;
      }}
      onPointerLeave={() => {
        editandoPincelRef.current = false;
        ultimoPontoPincelRef.current = null;
        setMostrarLupa(false);
      }}
      className="max-h-[70vh] max-w-none object-contain sm:max-h-[78vh] sm:max-w-full"
      style={{
        opacity: opacidade / 100,
        transform: `translate(${panResultado.x}px, ${panResultado.y}px) scale(${zoomResultado})`,
        transformOrigin: "center",
      }}
    />
  )}
</div>
          </div>
        </div>
      )}

{modalRemoverObjetoAberto && (
  <div className="fixed inset-0 z-[300] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
    <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-7xl flex-col rounded-3xl border border-cyan-500/30 bg-slate-950 shadow-2xl">

      <div className="flex items-center justify-between border-b border-cyan-500/20 p-6">
        <div>
          <h2 className="text-3xl font-black text-cyan-200">
            🧽 Remover objeto com IA
          </h2>
          <p className="mt-2 text-slate-300">
            Pinte exatamente o objeto que deseja apagar.
            A IA reconstruirá o fundo automaticamente.
          </p>
        </div>

        <button
          onClick={() => setModalRemoverObjetoAberto(false)}
          className="rounded-2xl bg-red-500 px-5 py-3 font-black text-white"
        >
          Fechar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4">
            <h3 className="mb-4 text-xl font-black text-white">
              Imagem original
            </h3>

            <div className="flex max-h-[70vh] min-h-[360px] items-start justify-center overflow-auto rounded-2xl bg-slate-950 p-4">
              {imagemOriginal && (
                <img
                  src={imagemOriginal}
                  alt="Original"
                  className="h-auto max-w-full rounded-2xl object-contain"
                />
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-4">
            <h3 className="mb-4 text-xl font-black text-white">
              Área de pintura
            </h3>

            <div className="flex h-full items-center justify-center rounded-2xl bg-slate-950">
              <canvas
  ref={canvasRemoverObjetoRef}
  onPointerDown={(e) => {
    if (!pincelAtivo) return;
    salvarHistoricoMascara();
    pintandoObjetoRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    pintarMascaraObjeto(e);
  }}
  onPointerMove={(e) => {
    if (!pintandoObjetoRef.current) return;
    pintarMascaraObjeto(e);
  }}
  onPointerUp={() => {
    pintandoObjetoRef.current = false;
  }}
  onPointerLeave={() => {
    pintandoObjetoRef.current = false;
  }}
  className="h-auto max-w-full rounded-2xl border border-cyan-500"
  style={{
    cursor: pincelAtivo ? "crosshair" : "default",
  }}
/>
            </div>
          </div>

        </div>
      </div>

<div className="mb-4 rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-4">
  <div className="mb-2 flex items-center justify-between">
    <span className="text-sm font-black text-cyan-100">
      Tamanho do pincel
    </span>
    <span className="rounded-xl bg-slate-800 px-3 py-1 text-xs font-black text-cyan-200">
      {tamanhoPincel}px
    </span>
  </div>

  <input
    type="range"
    min={18}
    max={180}
    value={tamanhoPincel}
    onChange={(e) => setTamanhoPincel(Number(e.target.value))}
    className="w-full accent-cyan-400"
  />
</div>

      <div className="border-t border-cyan-500/20 p-6">
        <div className="flex flex-wrap gap-4 justify-center mt-6">
  <button
    onClick={() => setPincelAtivo(!pincelAtivo)}
    className="rounded-2xl bg-cyan-500 px-6 py-3 font-black text-black"
  >
    {pincelAtivo ? "Desligar pincel" : "Ligar pincel"}
  </button>

  <button
    onClick={desfazerMascara}
    className="rounded-2xl bg-slate-700 px-6 py-3 font-black text-white"
  >
    Desfazer
  </button>

  <button
    onClick={resetarMascara}
    className="rounded-2xl bg-orange-500 px-6 py-3 font-black text-black"
  >
    Resetar
  </button>

  <button
    onClick={removerObjetoComIA}
    disabled={processando}
    className="rounded-2xl bg-pink-500 px-6 py-3 font-black text-white disabled:opacity-50"
  >
    {processando ? "Removendo..." : "✨ Remover objeto com IA"}
  </button>
</div>
      </div>
    </div>
  </div>
)}

<CropImageModal
  imagem={imagemOriginal || ""}
  aberto={modalCorteAberto}
  onClose={() => setModalCorteAberto(false)}
  onAplicar={(novaImagem) => {
    setImagemOriginal(novaImagem);
    setImagemFinal(null);
    setModalCorteAberto(false);
  }}
/>

      <section className="min-h-screen bg-[#020b2d] px-3 py-8 text-white sm:px-6 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <h1 className="text-3xl font-black leading-tight sm:text-5xl">
  Removedor de Fundo PHANYX
</h1>
            <p className="mt-4 max-w-3xl text-lg text-cyan-100">
              Ferramenta profissional PHANYX para remover fundo de assinaturas,
              logos, fotos e imagens com exportação transparente.
            </p>
          </div>

          {erro && (
            <div className="mb-6 rounded-xl border border-red-500 bg-red-950 p-4 text-red-200">
              {erro}
            </div>
          )}

          <div className="grid items-start gap-4 lg:grid-cols-[240px_1fr_1fr]">
            <aside className="space-y-5">
              <label className="block cursor-pointer rounded-2xl border border-cyan-500/40 bg-slate-900 p-4 text-center">
                <div className="text-base font-bold text-cyan-300">
                  Clique para enviar sua imagem
                </div>
                <div className="mt-3 text-sm text-slate-300">
                  PNG, JPG, JPEG ou WebP até 10MB
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) carregarImagem(file);
                  }}
                />
              </label>

<button
  type="button"
  disabled={!imagemOriginal}
  onClick={() => setModalCorteAberto(true)}
  className="w-full rounded-2xl bg-slate-800 px-4 py-3 text-sm font-black text-white disabled:opacity-40"
>
  Cortar imagem
</button>

<div className="rounded-2xl border border-cyan-400/20 bg-slate-900/80 p-3">
  <button
    type="button"
    onClick={() => setMenuIAAberto((aberto) => !aberto)}
    className="w-full rounded-xl bg-cyan-400 px-3 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300"
  >
    ✨ Usar IA PHANYX
  </button>

  {menuIAAberto && (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        disabled={!imagemOriginal || processando}
        onClick={melhorarComIA}
        className="w-full rounded-xl bg-violet-500 px-3 py-3 text-xs font-black text-white disabled:opacity-40"
      >
        ✨ Melhorar imagem
      </button>

      <button
  type="button"
  disabled={!imagemOriginal || processando}
  onClick={melhorarComIA}
  className="w-full rounded-xl bg-slate-800 px-3 py-3 text-xs font-black text-white disabled:opacity-40"
>
  🌸 Restaurar foto
</button>

      <button
        type="button"
        disabled={!imagemOriginal || processando}
        onClick={melhorarComIA}
        className="w-full rounded-xl bg-slate-800 px-3 py-3 text-xs font-black text-white disabled:opacity-40"
      >
        ⬆️ Aumentar resolução 2x
      </button>

      <button
        type="button"
        disabled={!imagemOriginal || processando}
        onClick={removerFundoComIA}
        className="w-full rounded-xl bg-cyan-400 px-3 py-3 text-xs font-black text-slate-950 disabled:opacity-40"
      >
        🧠 Remover fundo com IA
      </button>

      <button
        type="button"
        disabled={!imagemOriginal || processando}
        onClick={recorteAvancadoComIA}
        className="w-full rounded-xl bg-emerald-400 px-3 py-3 text-xs font-black text-slate-950 disabled:opacity-40"
      >
        🧠 Recorte avançado
      </button>

      <button
        type="button"
        disabled={!imagemOriginal || processando}
        onClick={recorteProfissionalComIA}
        className="w-full rounded-xl bg-yellow-400 px-3 py-3 text-xs font-black text-slate-950 disabled:opacity-40"
      >
        💎 Recorte profissional
      </button>

      <button
        type="button"
        disabled={!imagemOriginal || processando}
        onClick={() => {
          if (!podeUsarIAAgora()) return;
          setModalRemoverObjetoAberto(true);
        }}
        className="w-full rounded-xl bg-rose-400 px-3 py-3 text-xs font-black text-slate-950 disabled:opacity-40"
      >
        🧽 Remover objeto
      </button>

      <p className="text-center text-[10px] leading-relaxed text-slate-400">
        Usa créditos IA. Ideal para fotos, pessoas, objetos e imagens complexas.
      </p>
    </div>
  )}
</div>

<button
  type="button"
  disabled={!imagemOriginal}
  onClick={() => {
    setModo("objeto");
    setRemoverBrancoInterno(true);
    setVarinhaAtiva(true);
    setAviso("Varinha mágica ativada. Agora clique na cor do fundo da imagem original.");
  }}
  className={`w-full rounded-2xl px-4 py-3 text-sm font-black disabled:opacity-40 ${
    varinhaAtiva
      ? "bg-cyan-400 text-slate-950"
      : "bg-slate-800 text-white"
  }`}
>
  🪄 Varinha mágica
</button>

{varinhaAtiva && (
  <div className="rounded-2xl bg-slate-900 p-3">
    <p className="mb-2 text-xs font-black text-cyan-100">
      Sensibilidade da varinha
    </p>

    <input
      type="range"
      min={5}
      max={100}
      value={toleranciaVarinha}
      onChange={(e) =>
        setToleranciaVarinha(Number(e.target.value))
      }
      className="w-full accent-cyan-400"
    />

    <p className="mt-2 text-[10px] text-slate-300">
      Valor atual: {toleranciaVarinha}
    </p>
  </div>
)}

              <div className="rounded-2xl bg-slate-900 p-3">
                <h3 className="mb-2 text-sm font-bold">Modo</h3>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setModo("assinatura")}
                    className={`rounded-xl px-1 py-3 text-[9px] font-black leading-tight tracking-tight transition ${
                      modo === "assinatura"
                        ? "bg-cyan-500 text-black"
                        : "bg-slate-800 text-white"
                    }`}
                  >
                    Assinatura
                  </button>

                  <button
                    onClick={() => setModo("objeto")}
                    className={`rounded-xl px-1 py-3 text-[9px] font-black leading-tight tracking-tight transition ${
                      modo === "objeto"
                        ? "bg-cyan-500 text-black"
                        : "bg-slate-800 text-white"
                    }`}
                  >
                    Objeto
                  </button>

                  <button
                    onClick={() => setModo("pessoa")}
                    className={`rounded-xl px-1 py-3 text-[9px] font-black leading-tight tracking-tight transition ${
                      modo === "pessoa"
                        ? "bg-cyan-500 text-black"
                        : "bg-slate-800 text-white"
                    }`}
                  >
                    Pessoa
                    <br />
                    Foto
                  </button>
                </div>
              </div>

              {modo === "pessoa" && (
                <div className="rounded-2xl bg-slate-900 p-3">
                  <p className="mb-2 text-xs font-bold text-white">
                    Motor de recorte
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMotorPessoa("mediapipe")}
                      className={`rounded-lg px-2 py-2 text-[10px] font-black ${
                        motorPessoa === "mediapipe"
                          ? "bg-cyan-400 text-slate-950"
                          : "bg-slate-800 text-white"
                      }`}
                    >
                      Rápido
                    </button>

                    <button
                      type="button"
                      onClick={() => setMotorPessoa("bodypix")}
                      className={`rounded-lg px-2 py-2 text-[10px] font-black ${
                        motorPessoa === "bodypix"
                          ? "bg-cyan-400 text-slate-950"
                          : "bg-slate-800 text-white"
                      }`}
                    >
                      Alternativo
                    </button>
                  </div>

                  <p className="mt-2 text-[10px] leading-tight text-cyan-100/80">
                    Se o recorte não ficar bom em um modo, teste o outro. Cada
                    foto pode responder melhor a um motor diferente.
                  </p>
                </div>
              )}

              {modo === "assinatura" && (
                <div className="rounded-xl bg-slate-900 p-3">
                  <p className="mb-2 text-xs font-bold text-white">
                    Fundo de visualização
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {(["verde", "azul", "preto", "branco", "xadrez"] as const).map(
                      (cor) => (
                        <button
                          key={cor}
                          type="button"
                          onClick={() => setFundoPreview(cor)}
                          className={`rounded-lg px-2 py-1.5 text-[11px] font-bold ${
                            fundoPreview === cor
                              ? "bg-cyan-400 text-slate-950"
                              : "bg-slate-800 text-white"
                          }`}
                        >
                          {cor}
                        </button>
                      )
                    )}
                  </div>

                  <p className="mt-2 text-[10px] leading-tight text-cyan-100/80">
                    Esse fundo aparece somente na visualização. A imagem será
                    salva com fundo transparente.
                  </p>
                </div>
              )}

              {modo === "objeto" && (
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-900 p-4 text-sm">
                  <input
                    type="checkbox"
                    checked={manterObjetoPrincipal}
                    onChange={(e) =>
                      setManterObjetoPrincipal(e.target.checked)
                    }
                  />
                  Manter apenas objeto principal
                </label>
              )}

              {modo !== "pessoa" && (
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-900 p-4 text-sm">
                  <input
                    type="checkbox"
                    checked={removerBrancoInterno}
                    onChange={(e) => setRemoverBrancoInterno(e.target.checked)}
                  />
                  Remover branco interno
                </label>
              )}

              {modo === "objeto" && removerBrancoInterno && (
                <div className="rounded-xl bg-slate-900 p-3 text-xs text-cyan-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      Clique na imagem original sobre a cor do fundo que você
                      quer remover. Pode ser branco, verde, azul, bege ou
                      qualquer cor.
                    </div>

                    <button
                      type="button"
                      onClick={() => setMostrarAjuda(true)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400 font-black text-slate-950 hover:bg-cyan-300"
                    >
                      ?
                    </button>
                  </div>

                  {coresAlvoManuais.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span>Cores escolhidas:</span>

                        <button
                          type="button"
                          onClick={() => setCoresAlvoManuais([])}
                          className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/10"
                        >
                          Limpar
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {coresAlvoManuais.map((cor, index) => (
                          <span
                            key={`${cor.r}-${cor.g}-${cor.b}-${index}`}
                            className="h-5 w-5 rounded border border-white/30"
                            title={`Cor ${index + 1}`}
                            style={{
                              backgroundColor: `rgb(${cor.r}, ${cor.g}, ${cor.b})`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </aside>

            <div className="rounded-3xl border border-white/10 bg-slate-900 p-3 sm:p-5">
              <h2 className="mb-4 text-center text-xl font-black">
                Imagem original
              </h2>

              <div

onTouchStart={(e) => {
  if (!imagemOriginal) return;

  if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;

    pinchOriginalRef.current = {
      distancia: Math.hypot(dx, dy),
      zoom: zoomOriginal,
    };

    toqueOriginalRef.current = {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
    };
  }
}}
onTouchMove={(e) => {
  if (!imagemOriginal) return;

  if (e.touches.length === 2 && pinchOriginalRef.current && toqueOriginalRef.current) {
    e.preventDefault();

    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;

    const novaDistancia = Math.hypot(dx, dy);
    const fator = novaDistancia / pinchOriginalRef.current.distancia;

    const centroAtual = {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
    };

    const dxPan = centroAtual.x - toqueOriginalRef.current.x;
    const dyPan = centroAtual.y - toqueOriginalRef.current.y;

    setZoomOriginal(
      Math.max(
        1,
        Math.min(6, Number((pinchOriginalRef.current.zoom * fator).toFixed(2)))
      )
    );

    setPanOriginal((pan) => ({
      x: pan.x + dxPan,
      y: pan.y + dyPan,
    }));

    toqueOriginalRef.current = centroAtual;
  }
}}
onTouchEnd={() => {
  pinchOriginalRef.current = null;
  toqueOriginalRef.current = null;
}}

  onWheel={(e) => {
    if (!imagemOriginal) return;

    e.preventDefault();

    const direcao = e.deltaY > 0 ? -0.1 : 0.1;

    setZoomOriginal((z) =>
      Math.max(1, Math.min(6, Number((z + direcao).toFixed(2))))
    );
  }}
  onMouseDown={(e) => {
  if (!imagemOriginal || zoomOriginal <= 1) return;

  const botaoDoMeio = e.button === 1;

  if (
    ((modo === "objeto" && removerBrancoInterno) || varinhaAtiva) &&
    !botaoDoMeio
  ) {
    return;
  }

  if (botaoDoMeio) {
    e.preventDefault();
  }

  arrastandoOriginalRef.current = true;
  ultimoMouseOriginalRef.current = {
    x: e.clientX,
    y: e.clientY,
  };
}}
onMouseMove={(e) => {
  if (!arrastandoOriginalRef.current || zoomOriginal <= 1) return;

  const dx = e.clientX - ultimoMouseOriginalRef.current.x;
  const dy = e.clientY - ultimoMouseOriginalRef.current.y;

  ultimoMouseOriginalRef.current = {
    x: e.clientX,
    y: e.clientY,
  };

  setPanOriginal((pan) => ({
    x: pan.x + dx,
    y: pan.y + dy,
  }));
}}
onMouseUp={() => {
  arrastandoOriginalRef.current = false;
}}
onMouseLeave={() => {
  arrastandoOriginalRef.current = false;
}}
  className="flex w-full touch-none select-none items-center justify-center overflow-hidden rounded-2xl bg-white p-4"
  style={{
    height: modo === "assinatura" ? "260px" : "360px",
    cursor:
      (modo === "objeto" && removerBrancoInterno) || varinhaAtiva
        ? "crosshair"
        : zoomOriginal > 1
          ? "grab"
          : "default",
  }}
>
  {imagemOriginal ? (
    <img
      ref={imagemOriginalRef}
      src={imagemOriginal}
      alt="Imagem original"
      draggable={false}
      onClick={(e) => {
        if (e.button === 1) return;

        if ((modo === "objeto" && removerBrancoInterno) || varinhaAtiva) {
          selecionarCorManual(e);
        }
      }}
      className="max-h-[500px] max-w-full object-contain"
      style={{
        transform: `translate(${panOriginal.x}px, ${panOriginal.y}px) scale(${zoomOriginal})`,
        transformOrigin: "center",
      }}
    />
  ) : (
    <p className="text-slate-400">Envie uma imagem para começar</p>
  )}
</div>
{imagemOriginal && (
  <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-950/60 p-2">
    <button
      type="button"
      onClick={() =>
        setZoomOriginal((z) =>
          Math.max(1, Number((z - 0.2).toFixed(2)))
        )
      }
      className="rounded-lg border border-white/20 px-3 py-2 text-xs font-black text-white"
    >
      -
    </button>

    <span className="text-xs font-bold text-cyan-100">
      Zoom original: {Math.round(zoomOriginal * 100)}%
    </span>

    <button
      type="button"
      onClick={() =>
        setZoomOriginal((z) =>
          Math.min(6, Number((z + 0.2).toFixed(2)))
        )
      }
      className="rounded-lg border border-white/20 px-3 py-2 text-xs font-black text-white"
    >
      +
    </button>

    <button
      type="button"
      onClick={() => {
        setZoomOriginal(1);
        setPanOriginal({ x: 0, y: 0 });
      }}
      className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-black text-white"
    >
      Reset
    </button>
  </div>
)}
            </div>

            <div className="h-fit rounded-3xl border border-cyan-400/20 bg-slate-900 p-5">
              <h2 className="mb-4 text-center text-xl font-black text-cyan-200">
                Resultado transparente
              </h2>

              <div

onTouchStart={(e) => {
  if (!imagemFinal) return;

  if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;

    toquePinchRef.current = {
      distancia: Math.hypot(dx, dy),
      zoom: zoomResultado,
    };

    toqueArrasteRef.current = null;
    return;
  }

  if (e.touches.length === 1 && zoomResultado > 1 && !pincelAtivo) {
    toqueArrasteRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }
}}
onTouchMove={(e) => {
  if (!imagemFinal) return;

  if (e.touches.length === 2 && toquePinchRef.current) {
    e.preventDefault();

    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;

    const novaDistancia = Math.hypot(dx, dy);
    const fator = novaDistancia / toquePinchRef.current.distancia;

    setZoomResultado(
      Math.max(
        0.5,
        Math.min(5, Number((toquePinchRef.current.zoom * fator).toFixed(2)))
      )
    );

    return;
  }

  if (e.touches.length === 1 && toqueArrasteRef.current && zoomResultado > 1 && !pincelAtivo) {
    e.preventDefault();

    const atual = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };

    const dx = atual.x - toqueArrasteRef.current.x;
    const dy = atual.y - toqueArrasteRef.current.y;

    toqueArrasteRef.current = atual;

    setPanResultado((pan) => ({
      x: pan.x + dx,
      y: pan.y + dy,
    }));
  }
}}
onTouchEnd={() => {
  toquePinchRef.current = null;
  toqueArrasteRef.current = null;
}}

                onWheel={(e) => {
                  if (!imagemFinal) return;

                  e.preventDefault();

                  const direcao = e.deltaY > 0 ? -0.1 : 0.1;

                  setZoomResultado((z) =>
                    Math.max(
                      0.5,
                      Math.min(5, Number((z + direcao).toFixed(2)))
                    )
                  );
                }}
                onMouseDown={(e) => {
                  if (!imagemFinal || zoomResultado <= 1 || pincelAtivo) return;

                  arrastandoResultadoRef.current = true;
                  ultimoMouseResultadoRef.current = {
                    x: e.clientX,
                    y: e.clientY,
                  };
                }}
                onMouseMove={(e) => {
                  if (!arrastandoResultadoRef.current || zoomResultado <= 1 || pincelAtivo) {
                    return;
                  }

                  const dx = e.clientX - ultimoMouseOriginalRef.current.x;
                  const dy = e.clientY - ultimoMouseOriginalRef.current.y;

                  ultimoMouseOriginalRef.current = {
                    x: e.clientX,
                    y: e.clientY,
                  };

                  setPanResultado((pan) => ({
                    x: pan.x + dx,
                    y: pan.y + dy,
                  }));
                }}
                onMouseUp={() => {
                  arrastandoOriginalRef.current = false;
                }}
                onMouseLeave={() => {
                  arrastandoOriginalRef.current = false;
                }}
                className={`flex w-full touch-none select-none items-center justify-center overflow-hidden rounded-2xl p-2 sm:p-4 ${
                  modo === "assinatura" && fundoPreview === "verde"
                    ? "bg-emerald-500"
                    : modo === "assinatura" && fundoPreview === "azul"
                      ? "bg-blue-500"
                      : modo === "assinatura" && fundoPreview === "preto"
                        ? "bg-black"
                        : modo === "assinatura" && fundoPreview === "branco"
                          ? "bg-white"
                          : "bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[length:24px_24px] bg-[position:0_0,0_12px,12px_-12px,-12px_0]"
                }`}
                style={{
                 height: modo === "assinatura" ? "240px" : "320px",
                  cursor: pincelAtivo
                    ? "crosshair"
                    : imagemFinal && zoomResultado > 1
                      ? "grab"
                      : "default",
                }}
              >
                {imagemFinal ? (
                  <img
                    ref={imagemResultadoRef}
                    src={imagemFinal}
                    alt="Resultado transparente"
                    draggable={false}
                    onPointerDown={(e) => {
  if (espacoPressionadoRef.current) return;
  e.currentTarget.setPointerCapture(e.pointerId);
  iniciarPincelResultado(e);
}}
                    onPointerMove={(e) => {
  if (!pincelAtivo || !editandoPincelRef.current) return;
  aplicarPincelResultado(e);
}}
                    onPointerUp={() => {
  editandoPincelRef.current = false;
  ultimoPontoPincelRef.current = null;
}}
                    onPointerLeave={() => {
  editandoPincelRef.current = false;
  ultimoPontoPincelRef.current = null;
}}
                    className="max-h-[240px] max-w-full object-contain"
                    style={{
                      opacity: opacidade / 100,
                      filter: "none",
                      transform: `translate(${panResultado.x}px, ${panResultado.y}px) scale(${zoomResultado})`,
                      transformOrigin: "center",
                    }}
                  />
                ) : (
                  <p className="text-cyan-100">Resultado aparecerá aqui</p>
                )}
              </div>

              {imagemFinal && (
                <div className="mt-3 rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-cyan-200">
                        Refinamento manual
                      </p>
                      <p className="text-[10px] text-slate-300">
                        Use depois do recorte para apagar ou restaurar detalhes.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setModalRefinamentoAberto(true)}
                        className="rounded-lg bg-cyan-400 px-3 py-2 text-[10px] font-black text-slate-950 hover:bg-cyan-300"
                      >
                        Abrir grande
                      </button>

                      <button
                        type="button"
                        onClick={desfazerUltimoPincel}
                        className="rounded-lg border border-white/20 px-3 py-2 text-[10px] font-black text-white hover:bg-white/10"
                      >
                        Desfazer
                      </button>

                      <button
                        type="button"
                        onClick={() => setPincelAtivo((ativo) => !ativo)}
                        className={`rounded-lg px-3 py-2 text-[10px] font-black ${
                          pincelAtivo
                            ? "bg-cyan-400 text-slate-950"
                            : "bg-slate-800 text-white"
                        }`}
                      >
                        {pincelAtivo ? "Pincel ligado" : "Ligar pincel"}
                      </button>
                    </div>
                  </div>

                  {pincelAtivo && (
                    <div className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
  setPincelAtivo(true);
  setFerramentaPincel("apagar");
}}
                          className={`rounded-lg px-2 py-2 text-[10px] font-black ${
                            ferramentaPincel === "apagar"
                              ? "bg-cyan-400 text-slate-950"
                              : "bg-slate-800 text-white"
                          }`}
                        >
                          Apagar sobra
                        </button>

                        <button
                          type="button"
                          onClick={() => {
  setPincelAtivo(true);
  setFerramentaPincel("restaurar");
}}
                          className={`rounded-lg px-2 py-2 text-[10px] font-black ${
                            ferramentaPincel === "restaurar"
                              ? "bg-cyan-400 text-slate-950"
                              : "bg-slate-800 text-white"
                          }`}
                        >
                          Restaurar parte
                        </button>
                      </div>

                      <Controle
                        label="Tamanho do pincel"
                        valor={tamanhoPincel}
                        min={4}
                        max={90}
                        onChange={setTamanhoPincel}
                      />

<div className="mt-3">
  <p className="mb-2 text-xs font-black text-cyan-100">
    Textura do pincel
  </p>

<div className="mt-4">
  <div className="mb-2 flex items-center justify-between text-xs font-black">
    <span className="text-cyan-100">Feather da borda</span>
    <span className="text-white">
      {Math.round(featherPincel * 100)}%
    </span>
  </div>

  <input
    type="range"
    min={0}
    max={1}
    step={0.01}
    value={featherPincel}
    onChange={(e) =>
      setFeatherPincel(Number(e.target.value))
    }
    className="w-full accent-cyan-400"
  />

  <div className="mt-1 flex justify-between text-[10px] text-slate-400">
    <span>Dura</span>
    <span>Suave</span>
  </div>
</div>

  <div className="grid grid-cols-3 gap-2">
    {(["duro", "medio", "suave"] as TexturaPincel[]).map((tipo) => (
      <button
        key={tipo}
        type="button"
        onClick={() => setTexturaPincel(tipo)}
        className={`rounded-xl px-3 py-2 text-xs font-black ${
          texturaPincel === tipo
            ? "bg-cyan-400 text-slate-950"
            : "bg-slate-800 text-white"
        }`}
      >
        {tipo === "duro"
          ? "Duro"
          : tipo === "medio"
            ? "Médio"
            : "Suave"}
      </button>
    ))}
  </div>
</div>

<label className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs text-cyan-100">
  <input
    type="checkbox"
    checked={usarPressaoCaneta}
    onChange={(e) => setUsarPressaoCaneta(e.target.checked)}
  />
  Usar pressão da caneta/mesa digitalizadora
</label>

                      <p className="text-[10px] leading-tight text-cyan-100/80">
                        Dica: dê zoom com o scroll, arraste para aproximar o detalhe e pinte sobre o resultado.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {imagemFinal && (
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 rounded-lg bg-slate-950/60 px-2 py-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setZoomResultado((z) =>
                          Math.max(0.5, Number((z - 0.1).toFixed(2)))
                        )
                      }
                      className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/10"
                    >
                      -
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setZoomResultado((z) =>
                          Math.min(5, Number((z + 0.1).toFixed(2)))
                        )
                      }
                      className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/10"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-[10px] font-bold text-white/80">
                    Baixar:
                  </span>

                  <button
                    onClick={() => baixarImagem("png")}
                    className="rounded-md bg-cyan-400 px-2 py-1 text-[10px] font-bold text-slate-950 hover:bg-cyan-300"
                  >
                    PNG
                  </button>

                  <button
                    onClick={() => baixarImagem("jpg")}
                    className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/10"
                  >
                    JPG
                  </button>

                  <button
                    onClick={() => baixarImagem("webp")}
                    className="rounded-md border border-white/20 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/10"
                  >
                    WebP
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-3 lg:col-span-3">
              <h3 className="mb-2 text-base font-black text-white">
                Ajustes da imagem
              </h3>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Controle
                  label="Sensibilidade"
                  valor={sensibilidade}
                  min={5}
                  max={80}
                  onChange={setSensibilidade}
                />

                <Controle
                  label="Suavizar borda"
                  valor={suavizacao}
                  min={0}
                  max={6}
                  onChange={setSuavizacao}
                />

                <Controle
                  label="Brilho"
                  valor={brilho}
                  min={40}
                  max={180}
                  onChange={setBrilho}
                />

                <Controle
                  label="Contraste"
                  valor={contraste}
                  min={40}
                  max={220}
                  onChange={setContraste}
                />

                <Controle
                  label="Saturação"
                  valor={saturacao}
                  min={0}
                  max={220}
                  onChange={setSaturacao}
                />

                <Controle
                  label="Opacidade"
                  valor={opacidade}
                  min={0}
                  max={100}
                  onChange={setOpacidade}
                />

                {modo === "assinatura" && (
                  <Controle
                    label="Intensidade do traço"
                    valor={intensidadeTraco}
                    min={0}
                    max={100}
                    onChange={setIntensidadeTraco}
                  />
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={removerFundo}
            disabled={!imagemOriginal || processando}
            className="sticky bottom-3 z-30 mt-6 w-full rounded-2xl bg-cyan-400 px-6 py-4 text-base font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
          >
            {processando ? "Processando..." : "Remover fundo"}
          </button>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </section>
    </>
  );
}

function Controle({
  label,
  valor,
  min,
  max,
  onChange,
}: {
  label: string;
  valor: number;
  min: number;
  max: number;
  onChange: (valor: number) => void;
}) {
  return (
    <div className="rounded-lg bg-slate-950/60 p-2">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-xs font-bold text-white">{label}</label>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-cyan-200">
          {valor}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
