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

export default function RemovedorDeFundoClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagemOriginalRef = useRef<HTMLImageElement | null>(null);
  const imagemResultadoRef = useRef<HTMLImageElement | null>(null);
  const editandoPincelRef = useRef(false);
  const arrastandoResultadoRef = useRef(false);
  const ultimoMouseResultadoRef = useRef({ x: 0, y: 0 });
  const ultimoPontoPincelRef = useRef<{ x: number; y: number } | null>(null);
  const historicoEdicaoRef = useRef<string[]>([]);
  const espacoPressionadoRef = useRef(false);

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
  const [panResultado, setPanResultado] = useState({ x: 0, y: 0 });
  const [intensidadeTraco, setIntensidadeTraco] = useState(60);
  const [modo, setModo] = useState<ModoRemocao>("assinatura");
  const [motorPessoa, setMotorPessoa] = useState<MotorPessoa>("mediapipe");
  const [manterObjetoPrincipal, setManterObjetoPrincipal] = useState(false);
  const [removerBrancoInterno, setRemoverBrancoInterno] = useState(false);

  const [coresAlvoManuais, setCoresAlvoManuais] = useState<
    { r: number; g: number; b: number }[]
  >([]);

  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [mostrarAjuda, setMostrarAjuda] = useState(false);
  const [modalRefinamentoAberto, setModalRefinamentoAberto] = useState(false);
  const [pincelAtivo, setPincelAtivo] = useState(false);
  const [ferramentaPincel, setFerramentaPincel] = useState<FerramentaPincel>("apagar");
  const [tamanhoPincel, setTamanhoPincel] = useState(24);
  const [usarPressaoCaneta, setUsarPressaoCaneta] = useState(true);

  function carregarImagem(file: File) {
    setErro("");
    setImagemFinal(null);
    setImagemBaseEdicao(null);
    setPincelAtivo(false);
    historicoEdicaoRef.current = [];
    setCoresAlvoManuais([]);
    setZoomResultado(1);
    setPanResultado({ x: 0, y: 0 });

    if (!file.type.startsWith("image/")) {
      setErro("Envie apenas arquivos de imagem.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErro("A imagem deve ter no máximo 10MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;

    img.onload = () => {
      setDimensoesImagem({
        largura: img.width,
        altura: img.height,
      });

      setImagemOriginal(url);
    };
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

    const toleranciaRgb = sensibilidadeAtual * 1.8;
    const toleranciaHue = Math.max(18, sensibilidadeAtual * 0.65);
    const toleranciaSat = Math.max(28, sensibilidadeAtual * 0.9);
    const toleranciaLum = Math.max(38, sensibilidadeAtual * 1.2);

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

    setCoresAlvoManuais((cores) => {
      const novaCor = {
        r: pixel[0],
        g: pixel[1],
        b: pixel[2],
      };

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
    setImagemBaseEdicao(baseCanvas.toDataURL("image/png"));
  }

  function iniciarPincelResultado(e: React.PointerEvent<HTMLImageElement>) {
    if (!pincelAtivo || !imagemFinal || espacoPressionadoRef.current) return;

    historicoEdicaoRef.current = [
      ...historicoEdicaoRef.current.slice(-14),
      imagemFinal,
    ];

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
  if (!pincelAtivo || !canvasRef.current || !imagemBaseEdicao) return;

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
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const baseImg = new Image();
  baseImg.src = imagemBaseEdicao;

  baseImg.onload = () => {
    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = canvas.width;
    baseCanvas.height = canvas.height;

    const baseCtx = baseCanvas.getContext("2d", { willReadFrequently: true });
    if (!baseCtx) return;

    baseCtx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

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
    const passos = Math.max(1, Math.ceil(distancia / Math.max(1, raio / 3)));

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
const suavidade = forca * forca;

if (ferramentaPincel === "apagar") {
  data[di + 3] = Math.round(data[di + 3] * (1 - suavidade));
} else {
  data[di] = Math.round(data[di] + (baseData[di] - data[di]) * suavidade);
  data[di + 1] = Math.round(
    data[di + 1] + (baseData[di + 1] - data[di + 1]) * suavidade
  );
  data[di + 2] = Math.round(
    data[di + 2] + (baseData[di + 2] - data[di + 2]) * suavidade
  );
  data[di + 3] = Math.round(
    data[di + 3] +
      (Math.round(255 * (opacidade / 100)) - data[di + 3]) * suavidade
  );
}
        }
      }
    }

    ultimoPontoPincelRef.current = { x, y };

    ctx.putImageData(imageData, 0, 0);
    setImagemFinal(canvas.toDataURL("image/png"));
  };
}


  async function removerFundoPessoaMediaPipe() {
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
            sensibilidade
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

      if (removerBrancoInterno && modo === "objeto") {
        for (let i = 0; i < totalPixels; i++) {
          const di = i * 4;

          const r = data[di];
          const g = data[di + 1];
          const b = data[di + 2];

          const brancoOuQuaseBranco = r > 230 && g > 230 && b > 230;

          const parecidoComAlgumaCorEscolhida = coresBase.some((corBase) =>
            pareceCorDoFundo(
              r,
              g,
              b,
              corBase.r,
              corBase.g,
              corBase.b,
              sensibilidade
            )
          );

          if (brancoOuQuaseBranco || parecidoComAlgumaCorEscolhida) {
            remover[i] = 1;
          }
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
  }
}

window.addEventListener("keyup", soltarEspaco);

    return () => {
      window.removeEventListener("keydown", controlarZoomPeloTeclado);
      window.removeEventListener("keyup", soltarEspaco);
    };
    
  }, [imagemFinal]);

  useEffect(() => {
    if (zoomResultado <= 1) {
      setPanResultado({ x: 0, y: 0 });
    }
  }, [zoomResultado]);

  useEffect(() => {
    if (!imagemOriginal) return;

    const timer = window.setTimeout(() => {
      removerFundo();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [
    imagemOriginal,
    sensibilidade,
    suavizacao,
    brilho,
    contraste,
    saturacao,
    opacidade,
    intensidadeTraco,
    modo,
    motorPessoa,
    manterObjetoPrincipal,
    removerBrancoInterno,
    coresAlvoManuais,
  ]);

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

  return (
    <>
      {aviso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="max-w-md rounded-3xl border border-cyan-400/30 bg-slate-950 p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-cyan-200">
              Aviso PHANYX
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-slate-200">
              {aviso}
            </p>

            <button
              type="button"
              onClick={() => setAviso(null)}
              className="mt-6 rounded-2xl bg-cyan-400 px-6 py-3 font-black text-slate-950 shadow-lg shadow-cyan-400/30 hover:bg-cyan-300"
            >
              Entendi
            </button>
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
        <div className="fixed inset-0 z-[60] bg-slate-950/95 p-4 text-white">
          <div className="mx-auto flex h-full max-w-7xl flex-col">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/20 bg-slate-900 p-3">
              <div>
                <h2 className="text-xl font-black text-cyan-200">
                  Refinamento manual em tela grande
                </h2>
                <p className="text-xs text-slate-300">
                  Use o pincel para apagar sobras ou restaurar partes. Dê zoom com o scroll.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFerramentaPincel("apagar")}
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
                  onClick={() => setFerramentaPincel("restaurar")}
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
                  onClick={() => setModalRefinamentoAberto(false)}
                  className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white hover:bg-red-400"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="mb-3 rounded-2xl border border-cyan-400/20 bg-slate-900 p-3">
              <Controle
                label="Tamanho do pincel"
                valor={tamanhoPincel}
                min={4}
                max={120}
                onChange={setTamanhoPincel}
              />
            </div>

            <div
              onWheel={(e) => {
                e.preventDefault();

                const direcao = e.deltaY > 0 ? -0.12 : 0.12;

                setZoomResultado((z) =>
                  Math.max(0.5, Math.min(8, Number((z + direcao).toFixed(2))))
                );
              }}
              onMouseDown={(e) => {
                if (pincelAtivo && !espacoPressionadoRef.current) return;

                arrastandoResultadoRef.current = true;
                ultimoMouseResultadoRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                };
              }}
              onMouseMove={(e) => {
                if (
  !arrastandoResultadoRef.current ||
  (pincelAtivo && !espacoPressionadoRef.current)
)
  return;

                const dx = e.clientX - ultimoMouseResultadoRef.current.x;
                const dy = e.clientY - ultimoMouseResultadoRef.current.y;

                ultimoMouseResultadoRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                };

                setPanResultado((pan) => ({
                  x: pan.x + dx,
                  y: pan.y + dy,
                }));
              }}
              onMouseUp={() => {
                arrastandoResultadoRef.current = false;
              }}
              onMouseLeave={() => {
                arrastandoResultadoRef.current = false;
                editandoPincelRef.current = false;
              }}
              className="flex min-h-0 flex-1 select-none items-center justify-center overflow-hidden rounded-3xl border border-cyan-400/20 bg-[linear-gradient(45deg,#1e293b_25%,transparent_25%),linear-gradient(-45deg,#1e293b_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1e293b_75%),linear-gradient(-45deg,transparent_75%,#1e293b_75%)] bg-[length:28px_28px] bg-[position:0_0,0_14px,14px_-14px,-14px_0] p-6"
              style={{
                cursor: pincelAtivo ? "crosshair" : "grab",
              }}
            >
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
                className="max-h-[78vh] max-w-full object-contain"
                style={{
                  opacity: opacidade / 100,
                  transform: `translate(${panResultado.x}px, ${panResultado.y}px) scale(${zoomResultado})`,
                  transformOrigin: "center",
                }}
              />
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

      <section className="min-h-screen bg-[#020b2d] px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <h1 className="text-5xl font-black">Removedor de Fundo PHANYX</h1>
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

          <div className="grid items-start gap-5 lg:grid-cols-[240px_1fr_1fr]">
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

            <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
              <h2 className="mb-4 text-center text-xl font-black">
                Imagem original
              </h2>

              <div
                className="flex w-full items-center justify-center rounded-2xl bg-white p-4"
                style={{
                  height: modo === "assinatura" ? "260px" : "360px",
                }}
              >
                {imagemOriginal ? (
                  <img
                    ref={imagemOriginalRef}
                    src={imagemOriginal}
                    alt="Imagem original"
                    onClick={
                      modo === "objeto" && removerBrancoInterno
                        ? selecionarCorManual
                        : undefined
                    }
                    className={`max-h-[500px] max-w-full object-contain ${
                      modo === "objeto" && removerBrancoInterno
                        ? "cursor-crosshair"
                        : ""
                    }`}
                  />
                ) : (
                  <p className="text-slate-400">
                    Envie uma imagem para começar
                  </p>
                )}
              </div>
            </div>

            <div className="h-fit rounded-3xl border border-cyan-400/20 bg-slate-900 p-5">
              <h2 className="mb-4 text-center text-xl font-black text-cyan-200">
                Resultado transparente
              </h2>

              <div
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

                  const dx = e.clientX - ultimoMouseResultadoRef.current.x;
                  const dy = e.clientY - ultimoMouseResultadoRef.current.y;

                  ultimoMouseResultadoRef.current = {
                    x: e.clientX,
                    y: e.clientY,
                  };

                  setPanResultado((pan) => ({
                    x: pan.x + dx,
                    y: pan.y + dy,
                  }));
                }}
                onMouseUp={() => {
                  arrastandoResultadoRef.current = false;
                }}
                onMouseLeave={() => {
                  arrastandoResultadoRef.current = false;
                }}
                className={`flex w-full select-none items-center justify-center overflow-hidden rounded-2xl p-4 ${
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
                  height: modo === "assinatura" ? "260px" : "360px",
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
                <div className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-slate-950/60 px-2 py-2">
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
            className="mt-6 w-full rounded-2xl bg-cyan-400 px-6 py-4 text-lg font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
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
