"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type GradientePonto = {
  id: number;
  cor: string;
  posicao: number;
};

type GradienteTipoForma =
  | "LINEAR"
  | "DIAGONAL"
  | "RADIAL"
  | "ESFERICO";

type GradienteDirecaoForma =
  | "DIREITA"
  | "ESQUERDA"
  | "TOPO"
  | "BASE"
  | "DIAGONAL_DESC"
  | "DIAGONAL_ASC";

type ObjetoCracha =
  | {
      id: number;
      tipo: "TEXTO";
      texto: string;
      x: number;
      y: number;
      fonte: number;
      cor: string;
      alinhamento: "left" | "center" | "right";
      largura: number;
      altura: number;
      sombraAtiva?: boolean;
      sombraX?: number;
      sombraY?: number;
      sombraBlur?: number;
      sombraCor?: string;
      ordem: number;
    }
  | {
      id: number;
      tipo: "CAMPO";
      campo: string;
      rotulo: string;
      x: number;
      y: number;
      fonte: number;
      cor: string;
      alinhamento: "left" | "center" | "right";
      largura: number;
      altura: number;
      ordem: number;
    }
  | {
      id: number;
      tipo: "IMAGEM";
      origem: "FOTO" | "LOGO" | "UPLOAD";
      rotulo: string;
      url?: string;
      x: number;
      y: number;
      largura: number;
      altura: number;
      raioBorda: number;
      ajusteImagem: "cover" | "contain";
      sombraAtiva?: boolean;
      sombraModo?: "DROP" | "BOX";
      sombraX?: number;
      sombraY?: number;
      sombraBlur?: number;
      sombraCor?: string;
      ordem: number;
    }
      | {
      id: number;
      tipo: "QRCODE";
      valor: string;
      x: number;
      y: number;
      largura: number;
      altura: number;
      cor: string;
      corFundo: string;
      mostrarFundo: boolean;
      margem: number;
      raioBorda: number;
      sombraAtiva?: boolean;
      sombraX?: number;
      sombraY?: number;
      sombraBlur?: number;
      sombraCor?: string;
      ordem: number;
    }
  | {
    id: number;
    tipo: "FORMA";

    forma:
      | "RETANGULO"
      | "PILULA"
      | "CIRCULO"
      | "OVAL"
      | "LINHA"
      | "TRIANGULO"
      | "LOSANGO"
      | "PARALELOGRAMO"
      | "SETA_DIREITA"
      | "SETA_ESQUERDA"
      | "SETA_CIMA"
      | "SETA_BAIXO"
      | "SETA_DUPLA_HORIZONTAL"
      | "SETA_DUPLA_VERTICAL"
      | "ESTRELA"
      | "FORMA_LIVRE"
      | "POLIGONO"
      | "CRUZ"
      | "CORACAO";

    estilo?:
      | "PREENCHIMENTO_CONTORNO"
      | "SOMENTE_PREENCHIMENTO"
      | "SOMENTE_CONTORNO";

    preenchimentoTipo?: "COR" | "GRADIENTE";

    gradienteTipo?: GradienteTipoForma;
    gradienteDirecao?: GradienteDirecaoForma;
    gradientePontos?: GradientePonto[];
    gradienteFocoX?: number;
    gradienteFocoY?: number;
    gradienteRaio?: number;

    bordaAcabamento?: "DURA" | "FOSCA";
    bordaBlur?: number;

    sombraAtiva?: boolean;
    sombraX?: number;
    sombraY?: number;
    sombraBlur?: number;
    sombraCor?: string;

    rotacao?: number;

    pontas?: number;
    raioInterno?: number;
    raioExterno?: number;
    lados?: number;
    cruzCentroX?: number;
    cruzCentroY?: number;
    cruzEspessuraVertical?: number;
    cruzEspessuraHorizontal?: number;
    cruzComprimentoHorizontal?: number;
    cruzComprimentoVertical?: number;

    pontosLivres?: {
  id: number;
  x: number;
  y: number;

  tipo?: "CANTO" | "CURVA";
modoTangente?: "SUAVE" | "LIVRE";

alcaEntradaX?: number;
alcaEntradaY?: number;
alcaSaidaX?: number;
alcaSaidaY?: number;
}[];

pontoLivreSelecionadoId?: number | null;
pontosLivresSelecionadosIds?: number[];

    x: number;
    y: number;
    largura: number;
    altura: number;
    corFundo: string;
    corBorda: string;
    espessuraBorda: number;
    raioBorda: number;
    opacidade: number;
    ordem: number;
  };

  type TipoFuroCracha =
  | "SEM_FURO"
  | "RASGO_HORIZONTAL"
  | "RASGO_VERTICAL"
  | "FURO_REDONDO"
  | "FURO_DUPLO";

export default function CrachasClient() {
  const [lado, setLado] = useState<"FRENTE" | "VERSO">("FRENTE");

  const [formato, setFormato] = useState<
    "RETRATO" | "PAISAGEM" | "QUADRADO" | "REDONDO" | "PERSONALIZADO"
  >("RETRATO");

  const [corFundoFrente, setCorFundoFrente] =
  useState<string>("#ffffff");

  const [tipoFuroCracha, setTipoFuroCracha] =
  useState<TipoFuroCracha>("RASGO_HORIZONTAL");

const [corFundoVerso, setCorFundoVerso] =
  useState<string>("#ffffff");

const [objetosFrente, setObjetosFrente] =
  useState<ObjetoCracha[]>([]);

const [objetosVerso, setObjetosVerso] =
  useState<ObjetoCracha[]>([]);

const [objetoSelecionado, setObjetoSelecionado] =
  useState<number | null>(null);

const [menuContexto, setMenuContexto] = useState<{
  aberto: boolean;
  x: number;
  y: number;
  objetoId: number | null;
}>({
  aberto: false,
  x: 0,
  y: 0,
  objetoId: null,
});  

const [pontoGradienteSelecionado, setPontoGradienteSelecionado] =
  useState<number | null>(null);

  const [estiloFormaCopiado, setEstiloFormaCopiado] = useState<
  Partial<Extract<ObjetoCracha, { tipo: "FORMA" }>> | null
>(null);

const [objetoCopiado, setObjetoCopiado] = useState<ObjetoCracha | null>(
  null
);

const inputImagemRef = useRef<HTMLInputElement | null>(null);
const inputImagemObjetoRef = useRef<HTMLInputElement | null>(null);

const [avisoCracha, setAvisoCracha] = useState<{
  tipo: "sucesso" | "erro";
  texto: string;
} | null>(null);  

const objetos =
  lado === "FRENTE" ? objetosFrente : objetosVerso;

const setObjetos =
  lado === "FRENTE" ? setObjetosFrente : setObjetosVerso;

const corFundoCracha =
  lado === "FRENTE" ? corFundoFrente : corFundoVerso;

const setCorFundoCracha =
  lado === "FRENTE" ? setCorFundoFrente : setCorFundoVerso;

const objetoAtual = objetos.find((obj) => obj.id === objetoSelecionado);

  function adicionarTexto() {
    setObjetos((atual) => [
      ...atual,
      {
        id: Date.now(),
        tipo: "TEXTO",
        texto: "Novo Texto",
        x: 30,
        y: 30,
        fonte: 18,
        cor: "#000000",
        alinhamento: "left",
        largura: 120,
        altura: 32,
        ordem: Date.now(),
        sombraAtiva: false,
        sombraX: 2,
        sombraY: 2,
        sombraBlur: 4,
        sombraCor: "#000000",

      },
    ]);
  }

  function adicionarCampoDinamico() {
  setObjetos((atual) => [
    ...atual,
    {
      id: Date.now(),
      tipo: "CAMPO",
      campo: "{{alunoNome}}",
      rotulo: "Nome do aluno",
      x: 30,
      y: 80,
      fonte: 16,
      cor: "#000000",
      alinhamento: "left",
      largura: 150,
      altura: 32,
      ordem: Date.now(),
    },
  ]);
}

function adicionarFoto() {
  setObjetos((atual) => [
    ...atual,
    {
      id: Date.now(),
      tipo: "IMAGEM",
      origem: "FOTO",
      rotulo: "Foto",
      x: 70,
      y: 90,
      largura: 100,
      altura: 120,
      ordem: Date.now(),
      raioBorda: 50,
      ajusteImagem: "cover",
      sombraAtiva: false,
      sombraModo: "DROP",
      sombraX: 2,
      sombraY: 2,
      sombraBlur: 6,
      sombraCor: "#000000",
    },
  ]);
}

function adicionarLogo() {
  setObjetos((atual) => [
    ...atual,
    {
      id: Date.now(),
      tipo: "IMAGEM",
      origem: "LOGO",
      rotulo: "Logo",
      x: 70,
      y: 20,
      largura: 100,
      altura: 50,
      ordem: Date.now(),
      raioBorda: 8,
      ajusteImagem: "contain",
      sombraAtiva: false,
      sombraModo: "DROP",
      sombraX: 2,
      sombraY: 2,
      sombraBlur: 6,
      sombraCor: "#000000",
    },
  ]);
}

function adicionarQrCode() {
  const agora = Date.now();

  setObjetos((atual) => [
    ...atual,
    {
      id: agora,
      tipo: "QRCODE",
      valor: "https://www.phanyx.com.br/verificar/cracha/{{codigoCracha}}",
      x: 70,
      y: 230,
      largura: 90,
      altura: 90,
      cor: "#000000",
      corFundo: "#ffffff",
      mostrarFundo: true,
      margem: 8,
      raioBorda: 8,
      sombraAtiva: false,
      sombraX: 2,
      sombraY: 2,
      sombraBlur: 6,
      sombraCor: "#000000",
      ordem: agora,
    },
  ]);
}

function adicionarForma() {
  const agora = Date.now();

  setObjetos((atual) => [
    ...atual,
    {
      id: agora,
      tipo: "FORMA",
      forma: "RETANGULO",
      estilo: "PREENCHIMENTO_CONTORNO",

      preenchimentoTipo: "COR",
      gradienteTipo: "LINEAR",
      gradienteDirecao: "DIREITA",
      gradienteFocoX: 45,
      gradienteFocoY: 35,
      gradienteRaio: 75,
      gradientePontos: [
        {
          id: agora + 1,
          cor: "#2563eb",
          posicao: 0,
        },
        {
          id: agora + 2,
          cor: "#9333ea",
          posicao: 100,
        },
      ],

      bordaAcabamento: "DURA",
      bordaBlur: 3,

      sombraAtiva: false,
      sombraX: 4,
      sombraY: 4,
      sombraBlur: 10,
      sombraCor: "#000000",

rotacao: 0,

      x: 30,
      y: 30,
      largura: 120,
      altura: 50,
      corFundo: "#2563eb",
      corBorda: "#1e40af",
      espessuraBorda: 2,
      raioBorda: 12,
      opacidade: 100,
      ordem: agora,
    },
  ]);
}

function pontosGradienteForma(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>
): GradientePonto[] {
  const pontos = objeto.gradientePontos?.length
    ? objeto.gradientePontos
    : [
        { id: 1, cor: objeto.corFundo || "#2563eb", posicao: 0 },
        { id: 2, cor: "#ffffff", posicao: 100 },
      ];

  return [...pontos].sort((a, b) => a.posicao - b.posicao);
}

function idGradienteForma(objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>) {
  return `gradiente-forma-${objeto.id}`;
}

function estiloAtualForma(objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>) {
  return objeto.estilo || "SOMENTE_PREENCHIMENTO";
}

function preenchimentoForma(objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>) {
  const estilo = estiloAtualForma(objeto);

  if (estilo === "SOMENTE_CONTORNO") {
    return "transparent";
  }

  if ((objeto.preenchimentoTipo || "COR") === "GRADIENTE") {
    return `url(#${idGradienteForma(objeto)})`;
  }

  return objeto.corFundo;
}

function contornoForma(objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>) {
  const estilo = estiloAtualForma(objeto);

  if (estilo === "SOMENTE_PREENCHIMENTO") {
    return "transparent";
  }

  return objeto.corBorda;
}

function espessuraContornoForma(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>
) {
  const estilo = estiloAtualForma(objeto);

  if (estilo === "SOMENTE_PREENCHIMENTO") {
    return 0;
  }

  return Math.max(1, objeto.espessuraBorda || 3);
}

function direcaoGradienteForma(
  direcao: GradienteDirecaoForma | undefined
) {
  if (direcao === "ESQUERDA") {
    return { x1: "100%", y1: "0%", x2: "0%", y2: "0%" };
  }

  if (direcao === "TOPO") {
    return { x1: "0%", y1: "100%", x2: "0%", y2: "0%" };
  }

  if (direcao === "BASE") {
    return { x1: "0%", y1: "0%", x2: "0%", y2: "100%" };
  }

  if (direcao === "DIAGONAL_DESC") {
    return { x1: "0%", y1: "0%", x2: "100%", y2: "100%" };
  }

  if (direcao === "DIAGONAL_ASC") {
    return { x1: "0%", y1: "100%", x2: "100%", y2: "0%" };
  }

  return { x1: "0%", y1: "0%", x2: "100%", y2: "0%" };
}

function renderGradienteForma(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>
) {
  if ((objeto.preenchimentoTipo || "COR") !== "GRADIENTE") {
    return null;
  }

  const pontos = pontosGradienteForma(objeto);
  const tipo = objeto.gradienteTipo || "LINEAR";

  if (tipo === "RADIAL" || tipo === "ESFERICO") {
    const focoX = objeto.gradienteFocoX ?? 45;
    const focoY = objeto.gradienteFocoY ?? 35;
    const raio = objeto.gradienteRaio ?? 75;

    return (
      <radialGradient
        id={idGradienteForma(objeto)}
        cx={`${focoX}%`}
        cy={`${focoY}%`}
        r={`${raio}%`}
        fx={`${focoX}%`}
        fy={`${focoY}%`}
      >
        {pontos.map((ponto) => (
          <stop
            key={ponto.id}
            offset={`${ponto.posicao}%`}
            stopColor={ponto.cor}
          />
        ))}
      </radialGradient>
    );
  }

  const direcao =
    tipo === "DIAGONAL"
      ? direcaoGradienteForma(objeto.gradienteDirecao || "DIAGONAL_DESC")
      : direcaoGradienteForma(objeto.gradienteDirecao || "DIREITA");

  return (
    <linearGradient id={idGradienteForma(objeto)} {...direcao}>
      {pontos.map((ponto) => (
        <stop
          key={ponto.id}
          offset={`${ponto.posicao}%`}
          stopColor={ponto.cor}
        />
      ))}
    </linearGradient>
  );
}

function filtroAcabamentoForma(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>
) {
  const filtros: string[] = [];

  if ((objeto.bordaAcabamento || "DURA") === "FOSCA") {
    const blurBorda = objeto.bordaBlur ?? 3;
    const corBorda = objeto.corBorda || "#000000";

    filtros.push(`drop-shadow(0 0 ${blurBorda}px ${corBorda})`);
  }

  if (objeto.sombraAtiva) {
    filtros.push(
      `drop-shadow(${objeto.sombraX ?? 4}px ${objeto.sombraY ?? 4}px ${
        objeto.sombraBlur ?? 10
      }px ${objeto.sombraCor ?? "#000000"})`
    );
  }

  return filtros.length ? filtros.join(" ") : "none";
}

async function handleUploadImagem(e: React.ChangeEvent<HTMLInputElement>) {
  const arquivo = e.target.files?.[0];

  if (!arquivo) return;

  try {
    const formData = new FormData();
    formData.append("file", arquivo);

    const resp = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const json = await resp.json();

    if (!resp.ok) {
      throw new Error(json.error || "Erro ao enviar imagem.");
    }

    const url =
      json.url ||
      json.fileUrl ||
      json.arquivoUrl ||
      json.publicUrl;

    if (!url) {
      throw new Error("Upload realizado, mas a URL da imagem não retornou.");
    }

    setObjetos((atual) => [
      ...atual,
      {
        id: Date.now(),
        tipo: "IMAGEM",
        origem: "UPLOAD",
        rotulo: "Imagem",
        url,
        x: 60,
        y: 60,
        largura: 120,
        altura: 80,
        ordem: Date.now(),
        raioBorda: 8,
        ajusteImagem: "cover",
        sombraAtiva: false,
        sombraModo: "DROP",
        sombraX: 2,
        sombraY: 2,
        sombraBlur: 6,
        sombraCor: "#000000",
      },
    ]);

    setAvisoCracha({
      tipo: "sucesso",
      texto: "Imagem adicionada ao crachá.",
    });

    setTimeout(() => setAvisoCracha(null), 3000);
  } catch (error) {
    console.error(error);

    setAvisoCracha({
      tipo: "erro",
      texto:
        error instanceof Error
          ? error.message
          : "Erro ao enviar imagem.",
    });

    setTimeout(() => setAvisoCracha(null), 4000);
  } finally {
    e.target.value = "";
  }
}

async function handleUploadImagemObjeto(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const arquivo = e.target.files?.[0];

  if (!arquivo || !objetoAtual || objetoAtual.tipo !== "IMAGEM") return;

  const tiposPermitidos = ["image/png", "image/jpeg", "image/webp"];

  if (!tiposPermitidos.includes(arquivo.type)) {
    setAvisoCracha({
      tipo: "erro",
      texto: "Use imagem em PNG, JPG, JPEG ou WEBP. O formato TIFF não é exibido corretamente no navegador.",
    });

    setTimeout(() => setAvisoCracha(null), 5000);
    e.target.value = "";
    return;
  }

  try {
    const previewUrl = URL.createObjectURL(arquivo);

    atualizarObjeto(objetoAtual.id, {
      url: previewUrl,
      origem: "UPLOAD",
      rotulo: "Imagem",
    });

    setAvisoCracha({
      tipo: "sucesso",
      texto: "Imagem aplicada ao crachá.",
    });

    setTimeout(() => setAvisoCracha(null), 3000);
  } catch (error) {
    console.error(error);

    setAvisoCracha({
      tipo: "erro",
      texto: "Erro ao aplicar imagem ao crachá.",
    });

    setTimeout(() => setAvisoCracha(null), 4000);
  } finally {
    e.target.value = "";
  }
}

  function atualizarObjeto(id: number, dados: Partial<ObjetoCracha>) {
    setObjetos((atual) =>
      atual.map((obj) =>
        obj.id === id ? ({ ...obj, ...dados } as ObjetoCracha) : obj
      )
    );
  }

  function excluirObjetoSelecionado() {
  if (!objetoSelecionado) return;

  setObjetos((atual) =>
    atual.filter((obj) => obj.id !== objetoSelecionado)
  );

  setObjetoSelecionado(null);
}

useEffect(() => {
  function aoPressionarTecla(e: KeyboardEvent) {
    const alvo = e.target as HTMLElement | null;
    const tag = alvo?.tagName?.toLowerCase();

    const estaDigitando =
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      alvo?.isContentEditable;

    if (estaDigitando) return;

    const tecla = e.key.toLowerCase();

    if ((e.ctrlKey || e.metaKey) && tecla === "c") {
      if (!objetoAtual) return;

      e.preventDefault();
      copiarObjetoSelecionado();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && tecla === "v") {
      if (!objetoCopiado) return;

      e.preventDefault();
      colarObjetoCopiado();
      return;
    }

    if (!objetoSelecionado) return;

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      excluirObjetoSelecionado();
    }

    if (e.key === "Escape") {
      setObjetoSelecionado(null);
    }
  }

  window.addEventListener("keydown", aoPressionarTecla);

  return () => {
    window.removeEventListener("keydown", aoPressionarTecla);
  };
}, [objetoSelecionado, objetoAtual, objetoCopiado, lado]);

  function alinharCaixaTexto(alinhamentoCaixa: "left" | "center" | "right") {
    if (!objetoAtual || objetoAtual.tipo !== "TEXTO") return;

    const larguraCracha =
      formato === "RETRATO"
        ? 240
        : formato === "PAISAGEM"
        ? 380
        : 260;

    let novoX = objetoAtual.x;

    if (alinhamentoCaixa === "left") {
      novoX = 10;
    }

    if (alinhamentoCaixa === "center") {
      novoX = (larguraCracha - objetoAtual.largura) / 2;
    }

    if (alinhamentoCaixa === "right") {
      novoX = larguraCracha - objetoAtual.largura - 10;
    }

    atualizarObjeto(objetoAtual.id, {
      x: novoX,
    });
  }

  function sombraTextoCss(objeto: Extract<ObjetoCracha, { tipo: "TEXTO" }>) {
  if (!objeto.sombraAtiva) return "none";

  return `${objeto.sombraX ?? 2}px ${objeto.sombraY ?? 2}px ${
    objeto.sombraBlur ?? 4
  }px ${objeto.sombraCor ?? "#000000"}`;
}

function sombraImagemDropCss(
  objeto: Extract<ObjetoCracha, { tipo: "IMAGEM" }>
) {
  if (!objeto.sombraAtiva || objeto.sombraModo !== "DROP") return "none";

  return `drop-shadow(${objeto.sombraX ?? 2}px ${objeto.sombraY ?? 2}px ${
    objeto.sombraBlur ?? 6
  }px ${objeto.sombraCor ?? "#000000"})`;
}

function sombraImagemBoxCss(
  objeto: Extract<ObjetoCracha, { tipo: "IMAGEM" }>
) {
  if (!objeto.sombraAtiva || objeto.sombraModo !== "BOX") return "none";

  return `${objeto.sombraX ?? 2}px ${objeto.sombraY ?? 2}px ${
    objeto.sombraBlur ?? 6
  }px ${objeto.sombraCor ?? "#000000"}`;
}

function sombraQrCodeCss(
  objeto: Extract<ObjetoCracha, { tipo: "QRCODE" }>
) {
  if (!objeto.sombraAtiva) return "none";

  return `${objeto.sombraX ?? 2}px ${objeto.sombraY ?? 2}px ${
    objeto.sombraBlur ?? 6
  }px ${objeto.sombraCor ?? "#000000"}`;
}

function redimensionarQrCode(
  e: React.MouseEvent<HTMLSpanElement>,
  objeto: Extract<ObjetoCracha, { tipo: "QRCODE" }>,
  canto: "nw" | "ne" | "sw" | "se"
) {
  e.preventDefault();
  e.stopPropagation();

  setObjetoSelecionado(objeto.id);

  const inicioX = e.clientX;
  const inicioY = e.clientY;

  const xOriginal = objeto.x;
  const yOriginal = objeto.y;
  const larguraOriginal = objeto.largura;
  const alturaOriginal = objeto.altura;

  function mover(ev: MouseEvent) {
    const dx = ev.clientX - inicioX;
    const dy = ev.clientY - inicioY;

    let novoX = xOriginal;
    let novoY = yOriginal;
    let novaLargura = larguraOriginal;
    let novaAltura = alturaOriginal;

    if (canto === "se") {
      novaLargura = larguraOriginal + dx;
      novaAltura = alturaOriginal + dy;
    }

    if (canto === "sw") {
      novoX = xOriginal + dx;
      novaLargura = larguraOriginal - dx;
      novaAltura = alturaOriginal + dy;
    }

    if (canto === "ne") {
      novoY = yOriginal + dy;
      novaLargura = larguraOriginal + dx;
      novaAltura = alturaOriginal - dy;
    }

    if (canto === "nw") {
      novoX = xOriginal + dx;
      novoY = yOriginal + dy;
      novaLargura = larguraOriginal - dx;
      novaAltura = alturaOriginal - dy;
    }

    const novoTamanho = Math.max(40, Math.max(novaLargura, novaAltura));

    atualizarObjeto(objeto.id, {
      x: novoX,
      y: novoY,
      largura: novoTamanho,
      altura: novoTamanho,
    });
  }

  function soltar() {
    window.removeEventListener("mousemove", mover);
    window.removeEventListener("mouseup", soltar);
  }

  window.addEventListener("mousemove", mover);
  window.addEventListener("mouseup", soltar);
}

function redimensionarTexto(
  e: React.MouseEvent<HTMLSpanElement>,
  objeto: Extract<ObjetoCracha, { tipo: "TEXTO" }>,
  canto: "nw" | "ne" | "sw" | "se"
) {
  e.preventDefault();
  e.stopPropagation();

  setObjetoSelecionado(objeto.id);

  const inicioX = e.clientX;
  const inicioY = e.clientY;

  const xOriginal = objeto.x;
  const yOriginal = objeto.y;
  const larguraOriginal = objeto.largura;
  const alturaOriginal = objeto.altura;

  function mover(ev: MouseEvent) {
    const dx = ev.clientX - inicioX;
    const dy = ev.clientY - inicioY;

    let novoX = xOriginal;
    let novoY = yOriginal;
    let novaLargura = larguraOriginal;
    let novaAltura = alturaOriginal;

    if (canto === "se") {
      novaLargura = larguraOriginal + dx;
      novaAltura = alturaOriginal + dy;
    }

    if (canto === "sw") {
      novoX = xOriginal + dx;
      novaLargura = larguraOriginal - dx;
      novaAltura = alturaOriginal + dy;
    }

    if (canto === "ne") {
      novoY = yOriginal + dy;
      novaLargura = larguraOriginal + dx;
      novaAltura = alturaOriginal - dy;
    }

    if (canto === "nw") {
      novoX = xOriginal + dx;
      novoY = yOriginal + dy;
      novaLargura = larguraOriginal - dx;
      novaAltura = alturaOriginal - dy;
    }

    atualizarObjeto(objeto.id, {
      x: novoX,
      y: novoY,
      largura: Math.max(30, novaLargura),
      altura: Math.max(18, novaAltura),
    });
  }

  function soltar() {
    window.removeEventListener("mousemove", mover);
    window.removeEventListener("mouseup", soltar);
  }

  window.addEventListener("mousemove", mover);
  window.addEventListener("mouseup", soltar);
}

function redimensionarImagem(
  e: React.MouseEvent<HTMLSpanElement>,
  objeto: Extract<ObjetoCracha, { tipo: "IMAGEM" }>,
  canto: "nw" | "ne" | "sw" | "se"
) {
  e.preventDefault();
  e.stopPropagation();

  setObjetoSelecionado(objeto.id);

  const inicioX = e.clientX;
  const inicioY = e.clientY;

  const xOriginal = objeto.x;
  const yOriginal = objeto.y;
  const larguraOriginal = objeto.largura;
  const alturaOriginal = objeto.altura;

  function mover(ev: MouseEvent) {
    const dx = ev.clientX - inicioX;
    const dy = ev.clientY - inicioY;

    let novoX = xOriginal;
    let novoY = yOriginal;
    let novaLargura = larguraOriginal;
    let novaAltura = alturaOriginal;

    if (canto === "se") {
      novaLargura = larguraOriginal + dx;
      novaAltura = alturaOriginal + dy;
    }

    if (canto === "sw") {
      novoX = xOriginal + dx;
      novaLargura = larguraOriginal - dx;
      novaAltura = alturaOriginal + dy;
    }

    if (canto === "ne") {
      novoY = yOriginal + dy;
      novaLargura = larguraOriginal + dx;
      novaAltura = alturaOriginal - dy;
    }

    if (canto === "nw") {
      novoX = xOriginal + dx;
      novoY = yOriginal + dy;
      novaLargura = larguraOriginal - dx;
      novaAltura = alturaOriginal - dy;
    }

    atualizarObjeto(objeto.id, {
      x: novoX,
      y: novoY,
      largura: Math.max(20, novaLargura),
      altura: Math.max(20, novaAltura),
    });
  }

  function soltar() {
    window.removeEventListener("mousemove", mover);
    window.removeEventListener("mouseup", soltar);
  }

  window.addEventListener("mousemove", mover);
  window.addEventListener("mouseup", soltar);
}

function redimensionarForma(
  e: React.MouseEvent<HTMLSpanElement>,
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>,
  canto: "nw" | "ne" | "sw" | "se"
) {
  e.preventDefault();
  e.stopPropagation();

  setObjetoSelecionado(objeto.id);

  const inicioX = e.clientX;
  const inicioY = e.clientY;

  const xOriginal = objeto.x;
  const yOriginal = objeto.y;
  const larguraOriginal = objeto.largura;
  const alturaOriginal = objeto.altura;

  function mover(ev: MouseEvent) {
    const dx = ev.clientX - inicioX;
    const dy = ev.clientY - inicioY;

    let novoX = xOriginal;
    let novoY = yOriginal;
    let novaLargura = larguraOriginal;
    let novaAltura = alturaOriginal;

    if (canto === "se") {
      novaLargura = larguraOriginal + dx;
      novaAltura = alturaOriginal + dy;
    }

    if (canto === "sw") {
      novoX = xOriginal + dx;
      novaLargura = larguraOriginal - dx;
      novaAltura = alturaOriginal + dy;
    }

    if (canto === "ne") {
      novoY = yOriginal + dy;
      novaLargura = larguraOriginal + dx;
      novaAltura = alturaOriginal - dy;
    }

    if (canto === "nw") {
      novoX = xOriginal + dx;
      novoY = yOriginal + dy;
      novaLargura = larguraOriginal - dx;
      novaAltura = alturaOriginal - dy;
    }

    atualizarObjeto(objeto.id, {
      x: novoX,
      y: novoY,
      largura: Math.max(10, novaLargura),
      altura: Math.max(10, novaAltura),
    });
  }

  function soltar() {
    window.removeEventListener("mousemove", mover);
    window.removeEventListener("mouseup", soltar);
  }

  window.addEventListener("mousemove", mover);
  window.addEventListener("mouseup", soltar);
}

function BotaoExcluirObjeto() {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        excluirObjetoSelecionado();
      }}
      className="absolute -right-3 -top-3 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-red-500 bg-red-600 text-xs font-bold text-white shadow hover:bg-red-700"
      title="Excluir objeto"
    >
      ×
    </button>
  );
}

function renderFuroCracha() {
  if (tipoFuroCracha === "SEM_FURO") return null;

  const baseClass =
    "pointer-events-none absolute z-10 border border-slate-400 bg-slate-200 shadow-inner";

  if (tipoFuroCracha === "RASGO_HORIZONTAL") {
    return (
      <div
        className={baseClass}
        style={{
          top: formato === "PAISAGEM" ? 10 : 12,
          left: "50%",
          width: formato === "PAISAGEM" ? 56 : 46,
          height: 12,
          borderRadius: 999,
          transform: "translateX(-50%)",
        }}
      />
    );
  }

  if (tipoFuroCracha === "RASGO_VERTICAL") {
    return (
      <div
        className={baseClass}
        style={{
          top: "50%",
          left: formato === "PAISAGEM" ? 12 : 10,
          width: 12,
          height: 44,
          borderRadius: 999,
          transform: "translateY(-50%)",
        }}
      />
    );
  }

  if (tipoFuroCracha === "FURO_REDONDO") {
    return (
      <div
        className={baseClass}
        style={{
          top: formato === "REDONDO" ? 16 : 14,
          left: "50%",
          width: 18,
          height: 18,
          borderRadius: 999,
          transform: "translateX(-50%)",
        }}
      />
    );
  }

  if (tipoFuroCracha === "FURO_DUPLO") {
    return (
      <>
        <div
          className={baseClass}
          style={{
            top: 14,
            left: "42%",
            width: 14,
            height: 14,
            borderRadius: 999,
            transform: "translateX(-50%)",
          }}
        />

        <div
          className={baseClass}
          style={{
            top: 14,
            left: "58%",
            width: 14,
            height: 14,
            borderRadius: 999,
            transform: "translateX(-50%)",
          }}
        />
      </>
    );
  }

  return null;
}

function trazerParaFrente() {
  if (!objetoAtual) return;

  const maiorOrdem = Math.max(
    1,
    ...objetos.map((obj) => Math.max(1, obj.ordem || 1))
  );

  atualizarObjeto(objetoAtual.id, {
    ordem: maiorOrdem + 1,
  });
}

function enviarParaTras() {
  if (!objetoAtual) return;

  atualizarObjeto(objetoAtual.id, {
    ordem: 1,
  });
}

function abrirMenuContexto(
  e: React.MouseEvent<HTMLDivElement>,
  objetoId: number
) {
  e.preventDefault();
  e.stopPropagation();

  setObjetoSelecionado(objetoId);

  const rect = e.currentTarget.getBoundingClientRect();

  const larguraMenu = 224;
  const alturaMenu = 190;
  const margem = 12;

  const cabeNaDireita =
    rect.right + larguraMenu + margem < window.innerWidth;

  const x = cabeNaDireita
    ? rect.right + margem
    : Math.max(margem, rect.left - larguraMenu - margem);

  const y = Math.min(
    Math.max(margem, rect.top),
    window.innerHeight - alturaMenu - margem
  );

  setMenuContexto({
    aberto: true,
    x,
    y,
    objetoId,
  });
}

function fecharMenuContexto() {
  setMenuContexto({
    aberto: false,
    x: 0,
    y: 0,
    objetoId: null,
  });
}

function trazerObjetoParaFrentePorId(objetoId: number) {
  const maiorOrdem = Math.max(
    1,
    ...objetos.map((obj) => Math.max(1, obj.ordem || 1))
  );

  atualizarObjeto(objetoId, {
    ordem: maiorOrdem + 1,
  });

  fecharMenuContexto();
}

function enviarObjetoParaTrasPorId(objetoId: number) {
  atualizarObjeto(objetoId, {
    ordem: 1,
  });

  fecharMenuContexto();
}

function duplicarObjetoPorId(objetoId: number) {
  const objeto = objetos.find((obj) => obj.id === objetoId);

  if (!objeto) return;

  const novoObjeto = clonarObjetoCracha(objeto, 12);

  setObjetos((atual) => [...atual, novoObjeto]);
  setObjetoSelecionado(novoObjeto.id);
  fecharMenuContexto();
}

function excluirObjetoPorId(objetoId: number) {
  setObjetos((atual) => atual.filter((obj) => obj.id !== objetoId));
  setObjetoSelecionado(null);
  fecharMenuContexto();
}

function clipPathForma(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>
) {
  if (objeto.forma === "TRIANGULO") {
    return "polygon(50% 0%, 0% 100%, 100% 100%)";
  }

  if (objeto.forma === "LOSANGO") {
    return "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
  }

  if (objeto.forma === "PARALELOGRAMO") {
    return "polygon(18% 0%, 100% 0%, 82% 100%, 0% 100%)";
  }

  if (objeto.forma === "SETA_DIREITA") {
  return "polygon(0% 25%, 70% 25%, 70% 0%, 100% 50%, 70% 100%, 70% 75%, 0% 75%)";
}

if (objeto.forma === "SETA_ESQUERDA") {
  return "polygon(100% 25%, 30% 25%, 30% 0%, 0% 50%, 30% 100%, 30% 75%, 100% 75%)";
}

if (objeto.forma === "SETA_CIMA") {
  return "polygon(50% 0%, 100% 30%, 75% 30%, 75% 100%, 25% 100%, 25% 30%, 0% 30%)";
}

if (objeto.forma === "SETA_BAIXO") {
  return "polygon(25% 0%, 75% 0%, 75% 70%, 100% 70%, 50% 100%, 0% 70%, 25% 70%)";
}

if (objeto.forma === "SETA_DUPLA_HORIZONTAL") {
  return "polygon(0% 50%, 25% 0%, 25% 30%, 75% 30%, 75% 0%, 100% 50%, 75% 100%, 75% 70%, 25% 70%, 25% 100%)";
}

if (objeto.forma === "SETA_DUPLA_VERTICAL") {
  return "polygon(50% 0%, 100% 25%, 70% 25%, 70% 75%, 100% 75%, 50% 100%, 0% 75%, 30% 75%, 30% 25%, 0% 25%)";
}

if (objeto.forma === "POLIGONO") {
  return `polygon(${gerarPontosPoligono(
    objeto.lados ?? 6,
    objeto.largura,
    objeto.altura
  )})`;
}

  return "none";
}

function borderRadiusForma(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>
) {
  if (objeto.forma === "CIRCULO") {
    return "50%";
  }

  if (objeto.forma === "OVAL") {
    return "50% / 50%";
  }

  if (objeto.forma === "PILULA" || objeto.forma === "LINHA") {
    return "9999px";
  }

  return `${objeto.raioBorda}px`;
}

function deveMostrarBordaForma(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>
) {
  return ![
    "TRIANGULO",
    "LOSANGO",
    "PARALELOGRAMO",
    "SETA_DIREITA",
    "SETA_ESQUERDA",
    "SETA_CIMA",
    "SETA_BAIXO",
    "SETA_DUPLA_HORIZONTAL",
    "SETA_DUPLA_VERTICAL",
  ].includes(objeto.forma);
}

function gerarPontosEstrelaSvg(
  pontas: number,
  raioExterno: number,
  raioInterno: number
) {
  const cx = 50;
  const cy = 50;
  const pontos: string[] = [];

  const totalPontas = Math.max(3, Math.min(20, pontas));

  for (let i = 0; i < totalPontas * 2; i++) {
    const angulo = -Math.PI / 2 + (i * Math.PI) / totalPontas;
    const raio = i % 2 === 0 ? raioExterno : raioInterno;

    const x = cx + Math.cos(angulo) * raio;
    const y = cy + Math.sin(angulo) * raio;

    pontos.push(`${x},${y}`);
  }

  return pontos.join(" ");
}

function gerarPontosPoligonoSvg(lados: number) {
  const totalLados = Math.max(3, Math.min(20, lados || 6));
  const cx = 50;
  const cy = 50;
  const raio = 46;
  const pontos: string[] = [];

  for (let i = 0; i < totalLados; i++) {
    const angulo = -Math.PI / 2 + (i * 2 * Math.PI) / totalLados;

    const x = cx + Math.cos(angulo) * raio;
    const y = cy + Math.sin(angulo) * raio;

    pontos.push(`${x},${y}`);
  }

  return pontos.join(" ");
}

function limitarFormaSvg(valor: number, minimo: number, maximo: number) {
  return Math.max(minimo, Math.min(maximo, valor));
}

function gerarPontosCruzSvg(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>
) {
  const centroX = limitarFormaSvg(objeto.cruzCentroX ?? 50, 15, 85);
  const centroY = limitarFormaSvg(objeto.cruzCentroY ?? 50, 15, 85);

  const espessuraVertical = limitarFormaSvg(
    objeto.cruzEspessuraVertical ?? 24,
    6,
    70
  );

  const espessuraHorizontal = limitarFormaSvg(
    objeto.cruzEspessuraHorizontal ?? 24,
    6,
    70
  );

  const comprimentoHorizontal = limitarFormaSvg(
  objeto.cruzComprimentoHorizontal ?? 94,
  20,
  400
);

const comprimentoVertical = limitarFormaSvg(
  objeto.cruzComprimentoVertical ?? 94,
  20,
  400
);

  const esquerdaH = limitarFormaSvg(
  centroX - comprimentoHorizontal / 2,
  -200,
  300
);

const direitaH = limitarFormaSvg(
  centroX + comprimentoHorizontal / 2,
  -200,
  300
);

  const topoH = limitarFormaSvg(
    centroY - espessuraHorizontal / 2,
    1,
    99
  );

  const baseH = limitarFormaSvg(
    centroY + espessuraHorizontal / 2,
    1,
    99
  );

  const esquerdaV = limitarFormaSvg(
    centroX - espessuraVertical / 2,
    1,
    99
  );

  const direitaV = limitarFormaSvg(
    centroX + espessuraVertical / 2,
    1,
    99
  );

  const topoV = limitarFormaSvg(
  centroY - comprimentoVertical / 2,
  -200,
  300
);

const baseV = limitarFormaSvg(
  centroY + comprimentoVertical / 2,
  -200,
  300
);

  return [
    `${esquerdaV},${topoV}`,
    `${direitaV},${topoV}`,
    `${direitaV},${topoH}`,
    `${direitaH},${topoH}`,
    `${direitaH},${baseH}`,
    `${direitaV},${baseH}`,
    `${direitaV},${baseV}`,
    `${esquerdaV},${baseV}`,
    `${esquerdaV},${baseH}`,
    `${esquerdaH},${baseH}`,
    `${esquerdaH},${topoH}`,
    `${esquerdaV},${topoH}`,
  ].join(" ");
}

function caminhoFormaLivreSvg(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>
) {
  const pontos = pontosLivresForma(objeto);

  if (pontos.length < 3) {
    return "";
  }

  let d = `M ${pontos[0].x} ${pontos[0].y}`;

  for (let i = 1; i < pontos.length; i++) {
    const anterior = pontos[i - 1];
    const atual = pontos[i];

    const usaCurva =
      anterior.tipo === "CURVA" ||
      atual.tipo === "CURVA" ||
      anterior.alcaSaidaX !== undefined ||
      atual.alcaEntradaX !== undefined;

    if (usaCurva) {
      const c1x = anterior.alcaSaidaX ?? anterior.x;
      const c1y = anterior.alcaSaidaY ?? anterior.y;
      const c2x = atual.alcaEntradaX ?? atual.x;
      const c2y = atual.alcaEntradaY ?? atual.y;

      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${atual.x} ${atual.y}`;
    } else {
      d += ` L ${atual.x} ${atual.y}`;
    }
  }

  const ultimo = pontos[pontos.length - 1];
  const primeiro = pontos[0];

  const fechaComCurva =
    ultimo.tipo === "CURVA" ||
    primeiro.tipo === "CURVA" ||
    ultimo.alcaSaidaX !== undefined ||
    primeiro.alcaEntradaX !== undefined;

  if (fechaComCurva) {
    const c1x = ultimo.alcaSaidaX ?? ultimo.x;
    const c1y = ultimo.alcaSaidaY ?? ultimo.y;
    const c2x = primeiro.alcaEntradaX ?? primeiro.x;
    const c2y = primeiro.alcaEntradaY ?? primeiro.y;

    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${primeiro.x} ${primeiro.y}`;
  }

  d += " Z";

  return d;
}

function renderFormaSvg(objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>) {
  const fill = preenchimentoForma(objeto);
  const stroke = contornoForma(objeto);
  const strokeWidth = espessuraContornoForma(objeto);

  const comum = {
    fill,
    stroke,
    strokeWidth,
    vectorEffect: "non-scaling-stroke" as const,
    strokeLinejoin: "round" as const,
  };

  if (objeto.forma === "RETANGULO") {
    return (
      <rect
        x="1"
        y="1"
        width="98"
        height="98"
        rx={objeto.raioBorda}
        ry={objeto.raioBorda}
        {...comum}
      />
    );
  }

  if (objeto.forma === "PILULA") {
    return (
      <rect
        x="1"
        y="1"
        width="98"
        height="98"
        rx="50"
        ry="50"
        {...comum}
      />
    );
  }

  if (objeto.forma === "CIRCULO" || objeto.forma === "OVAL") {
    return <ellipse cx="50" cy="50" rx="48" ry="48" {...comum} />;
  }

  if (objeto.forma === "LINHA") {
    return (
      <rect
        x="1"
        y="40"
        width="98"
        height="20"
        rx="10"
        ry="10"
        {...comum}
      />
    );
  }

  if (objeto.forma === "TRIANGULO") {
    return <polygon points="50,3 97,97 3,97" {...comum} />;
  }

  if (objeto.forma === "LOSANGO") {
    return <polygon points="50,3 97,50 50,97 3,50" {...comum} />;
  }

  if (objeto.forma === "PARALELOGRAMO") {
    return <polygon points="20,3 97,3 80,97 3,97" {...comum} />;
  }

  if (objeto.forma === "SETA_DIREITA") {
    return (
      <polygon
        points="3,25 68,25 68,3 97,50 68,97 68,75 3,75"
        {...comum}
      />
    );
  }

  if (objeto.forma === "SETA_ESQUERDA") {
    return (
      <polygon
        points="97,25 32,25 32,3 3,50 32,97 32,75 97,75"
        {...comum}
      />
    );
  }

  if (objeto.forma === "SETA_CIMA") {
    return (
      <polygon
        points="50,3 97,32 75,32 75,97 25,97 25,32 3,32"
        {...comum}
      />
    );
  }

  if (objeto.forma === "SETA_BAIXO") {
    return (
      <polygon
        points="25,3 75,3 75,68 97,68 50,97 3,68 25,68"
        {...comum}
      />
    );
  }

  if (objeto.forma === "SETA_DUPLA_HORIZONTAL") {
    return (
      <polygon
        points="3,50 25,3 25,30 75,30 75,3 97,50 75,97 75,70 25,70 25,97"
        {...comum}
      />
    );
  }

  if (objeto.forma === "SETA_DUPLA_VERTICAL") {
    return (
      <polygon
        points="50,3 97,25 70,25 70,75 97,75 50,97 3,75 30,75 30,25 3,25"
        {...comum}
      />
    );
  }

  if (objeto.forma === "ESTRELA") {
  return (
    <polygon
      points={gerarPontosEstrelaSvg(
        objeto.pontas ?? 5,
        objeto.raioExterno ?? 46,
        objeto.raioInterno ?? 22
      )}
      {...comum}
    />
  );
}

if (objeto.forma === "FORMA_LIVRE") {
  return (
    <path
      d={caminhoFormaLivreSvg(objeto)}
      {...comum}
    />
  );
}

if (objeto.forma === "POLIGONO") {
  return (
    <polygon
      points={gerarPontosPoligonoSvg(objeto.lados ?? 6)}
      {...comum}
    />
  );
}

if (objeto.forma === "CRUZ") {
  return (
    <polygon
      points={gerarPontosCruzSvg(objeto)}
      {...comum}
    />
  );
}

if (objeto.forma === "CORACAO") {
  return (
    <path
      d="
        M 50 88
        C 20 62, 5 45, 12 25
        C 18 8, 40 8, 50 25
        C 60 8, 82 8, 88 25
        C 95 45, 80 62, 50 88
        Z
      "
      {...comum}
    />
  );
}
  return null;
}

function atualizarPontoGradiente(
  objetoId: number,
  pontoId: number,
  dados: Partial<GradientePonto>
) {
  setObjetos((atual) =>
    atual.map((obj) => {
      if (obj.id !== objetoId || obj.tipo !== "FORMA") {
        return obj;
      }

      const pontosAtualizados = pontosGradienteForma(obj).map((ponto) =>
        ponto.id === pontoId ? { ...ponto, ...dados } : ponto
      );

      return {
        ...obj,
        gradientePontos: pontosAtualizados,
      } as ObjetoCracha;
    })
  );
}

function iniciarArrastoPontoGradiente(
  e: React.MouseEvent<HTMLButtonElement>,
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>,
  ponto: GradientePonto
) {
  e.preventDefault();
  e.stopPropagation();

  setPontoGradienteSelecionado(ponto.id);

  const barra = e.currentTarget.parentElement as HTMLElement | null;

  if (!barra) return;

  function calcularPosicao(clientX: number) {
    const rect = barra.getBoundingClientRect();

    const percentual = Math.round(
      ((clientX - rect.left) / rect.width) * 100
    );

    return Math.min(100, Math.max(0, percentual));
  }

  function mover(ev: MouseEvent) {
    atualizarPontoGradiente(objeto.id, ponto.id, {
      posicao: calcularPosicao(ev.clientX),
    });
  }

  function soltar() {
    window.removeEventListener("mousemove", mover);
    window.removeEventListener("mouseup", soltar);
  }

  atualizarPontoGradiente(objeto.id, ponto.id, {
    posicao: calcularPosicao(e.clientX),
  });

  window.addEventListener("mousemove", mover);
  window.addEventListener("mouseup", soltar);
}

function cssPreviewGradienteForma(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>
) {
  const pontos = pontosGradienteForma(objeto)
    .map((ponto) => `${ponto.cor} ${ponto.posicao}%`)
    .join(", ");

  const tipo = objeto.gradienteTipo || "LINEAR";
  const direcao = objeto.gradienteDirecao || "DIREITA";

  if (tipo === "RADIAL" || tipo === "ESFERICO") {
    return `radial-gradient(circle at ${objeto.gradienteFocoX ?? 45}% ${
      objeto.gradienteFocoY ?? 35
    }%, ${pontos})`;
  }

  if (tipo === "DIAGONAL") {
    if (direcao === "DIAGONAL_ASC") {
      return `linear-gradient(to top right, ${pontos})`;
    }

    return `linear-gradient(to bottom right, ${pontos})`;
  }

  if (direcao === "ESQUERDA") {
    return `linear-gradient(to left, ${pontos})`;
  }

  if (direcao === "TOPO") {
    return `linear-gradient(to top, ${pontos})`;
  }

  if (direcao === "BASE") {
    return `linear-gradient(to bottom, ${pontos})`;
  }

  return `linear-gradient(to right, ${pontos})`;
}

function hexParaRgb(hex: string) {
  const limpo = hex.replace("#", "");

  if (limpo.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }

  return {
    r: parseInt(limpo.slice(0, 2), 16),
    g: parseInt(limpo.slice(2, 4), 16),
    b: parseInt(limpo.slice(4, 6), 16),
  };
}

function rgbParaHex(r: number, g: number, b: number) {
  const limitar = (valor: number) =>
    Math.max(0, Math.min(255, Number.isNaN(valor) ? 0 : valor));

  return (
    "#" +
    [limitar(r), limitar(g), limitar(b)]
      .map((valor) => valor.toString(16).padStart(2, "0"))
      .join("")
  );
}

function pontoGradienteAtual(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>
) {
  const pontos = pontosGradienteForma(objeto);

  return (
    pontos.find((ponto) => ponto.id === pontoGradienteSelecionado) ||
    pontos[0]
  );
}

function atualizarCorPontoGradiente(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>,
  pontoId: number,
  novaCor: string
) {
  const novosPontos = pontosGradienteForma(objeto).map((ponto) =>
    ponto.id === pontoId ? { ...ponto, cor: novaCor } : ponto
  );

  atualizarObjeto(objeto.id, {
    gradientePontos: novosPontos,
  });
}

function copiarEstiloForma() {
  if (!objetoAtual || objetoAtual.tipo !== "FORMA") return;

  setEstiloFormaCopiado({
    estilo: objetoAtual.estilo,
    preenchimentoTipo: objetoAtual.preenchimentoTipo,

    gradienteTipo: objetoAtual.gradienteTipo,
    gradienteDirecao: objetoAtual.gradienteDirecao,
    gradienteFocoX: objetoAtual.gradienteFocoX,
    gradienteFocoY: objetoAtual.gradienteFocoY,
    gradienteRaio: objetoAtual.gradienteRaio,
    gradientePontos: objetoAtual.gradientePontos?.map((ponto) => ({
      ...ponto,
    })),

    bordaAcabamento: objetoAtual.bordaAcabamento,
    bordaBlur: objetoAtual.bordaBlur,

    corFundo: objetoAtual.corFundo,
    corBorda: objetoAtual.corBorda,
    espessuraBorda: objetoAtual.espessuraBorda,
    raioBorda: objetoAtual.raioBorda,
    opacidade: objetoAtual.opacidade,

    sombraAtiva: objetoAtual.sombraAtiva,
    sombraX: objetoAtual.sombraX,
    sombraY: objetoAtual.sombraY,
    sombraBlur: objetoAtual.sombraBlur,
    sombraCor: objetoAtual.sombraCor,

    rotacao: objetoAtual.rotacao,
  });

  setAvisoCracha({
    tipo: "sucesso",
    texto: "Estilo da forma copiado.",
  });

  setTimeout(() => setAvisoCracha(null), 2500);
}

function colarEstiloForma() {
  if (!objetoAtual || objetoAtual.tipo !== "FORMA" || !estiloFormaCopiado) {
    return;
  }

  const agora = Date.now();

  atualizarObjeto(objetoAtual.id, {
    ...estiloFormaCopiado,
    gradientePontos: estiloFormaCopiado.gradientePontos?.map(
      (ponto, index) => ({
        ...ponto,
        id: agora + index,
      })
    ),
  });

  setAvisoCracha({
    tipo: "sucesso",
    texto: "Estilo aplicado à forma selecionada.",
  });

  setTimeout(() => setAvisoCracha(null), 2500);
}

function pontosLivresForma(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>
) {
  return objeto.pontosLivres && objeto.pontosLivres.length >= 3
    ? objeto.pontosLivres
    : [
        { id: 1, x: 15, y: 15, tipo: "CANTO" as const },
        { id: 2, x: 85, y: 20, tipo: "CANTO" as const },
        { id: 3, x: 90, y: 80, tipo: "CANTO" as const },
        { id: 4, x: 50, y: 95, tipo: "CANTO" as const },
        { id: 5, x: 10, y: 75, tipo: "CANTO" as const },
      ];
}

function atualizarPontoLivreForma(
  objetoId: number,
  pontoId: number,
  dados: Partial<{
    x: number;
    y: number;
    tipo: "CANTO" | "CURVA";
    modoTangente: "SUAVE" | "LIVRE";
    alcaEntradaX: number;
    alcaEntradaY: number;
    alcaSaidaX: number;
    alcaSaidaY: number;
  }>
) {
  setObjetos((atual) =>
    atual.map((obj) => {
      if (obj.id !== objetoId || obj.tipo !== "FORMA") {
        return obj;
      }

      const pontosAtualizados = pontosLivresForma(obj).map((ponto) =>
        ponto.id === pontoId ? { ...ponto, ...dados } : ponto
      );

      return {
        ...obj,
        pontosLivres: pontosAtualizados,
        pontoLivreSelecionadoId: pontoId,
      } as ObjetoCracha;
    })
  );
}

function iniciarArrastoPontoLivre(
  e: React.MouseEvent<HTMLButtonElement>,
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>,
  pontoId: number
) {
  e.preventDefault();
  e.stopPropagation();

  const area = document.querySelector(
  `[data-forma-livre-area="${objeto.id}"]`
) as HTMLElement | null;
  const pontoOriginal = pontosLivresForma(objeto).find(
    (ponto) => ponto.id === pontoId
  );

  if (!area || !pontoOriginal) return;

  function limitar(valor: number) {
  return Math.max(-80, Math.min(180, valor));
}

  function calcularPosicao(clientX: number, clientY: number) {
    const rect = area.getBoundingClientRect();

    return {
      x: Math.round(limitar(((clientX - rect.left) / rect.width) * 100)),
      y: Math.round(limitar(((clientY - rect.top) / rect.height) * 100)),
    };
  }

  function mover(ev: MouseEvent) {
    const posicao = calcularPosicao(ev.clientX, ev.clientY);

    const dx = posicao.x - pontoOriginal.x;
    const dy = posicao.y - pontoOriginal.y;

    atualizarPontoLivreForma(objeto.id, pontoId, {
      x: posicao.x,
      y: posicao.y,

      alcaEntradaX:
        pontoOriginal.alcaEntradaX !== undefined
          ? limitar(pontoOriginal.alcaEntradaX + dx)
          : undefined,
      alcaEntradaY:
        pontoOriginal.alcaEntradaY !== undefined
          ? limitar(pontoOriginal.alcaEntradaY + dy)
          : undefined,
      alcaSaidaX:
        pontoOriginal.alcaSaidaX !== undefined
          ? limitar(pontoOriginal.alcaSaidaX + dx)
          : undefined,
      alcaSaidaY:
        pontoOriginal.alcaSaidaY !== undefined
          ? limitar(pontoOriginal.alcaSaidaY + dy)
          : undefined,
    });
  }

  function soltar() {
    window.removeEventListener("mousemove", mover);
    window.removeEventListener("mouseup", soltar);
  }

  window.addEventListener("mousemove", mover);
  window.addEventListener("mouseup", soltar);
}

function alternarCurvaPontoLivre(
  objetoId: number,
  pontoId: number
) {
  setObjetos((atual) =>
    atual.map((obj) => {
      if (obj.id !== objetoId || obj.tipo !== "FORMA") {
        return obj;
      }

      const pontosAtualizados = pontosLivresForma(obj).map((ponto) => {
        if (ponto.id !== pontoId) {
          return ponto;
        }

        if (ponto.tipo === "CURVA") {
          return {
  ...ponto,
  tipo: "CANTO" as const,
  modoTangente: undefined,
  alcaEntradaX: undefined,
  alcaEntradaY: undefined,
  alcaSaidaX: undefined,
  alcaSaidaY: undefined,
};
        }

        return {
  ...ponto,
  tipo: "CURVA" as const,
  modoTangente: "SUAVE" as const,
  alcaEntradaX: Math.max(-80, ponto.x - 18),
  alcaEntradaY: ponto.y,
  alcaSaidaX: Math.min(180, ponto.x + 18),
  alcaSaidaY: ponto.y,
};
      });

      return {
        ...obj,
        pontosLivres: pontosAtualizados,
        pontoLivreSelecionadoId: pontoId,
      } as ObjetoCracha;
    })
  );
}

function iniciarArrastoAlcaFormaLivre(
  e: React.MouseEvent<HTMLButtonElement>,
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>,
  pontoId: number,
  alca: "ENTRADA" | "SAIDA"
) {
  e.preventDefault();
  e.stopPropagation();

  const area = document.querySelector(
    `[data-forma-livre-area="${objeto.id}"]`
  ) as HTMLElement | null;

  const pontoBase = pontosLivresForma(objeto).find(
    (ponto) => ponto.id === pontoId
  );

  if (!area || !pontoBase) return;

  function limitar(valor: number) {
    return Math.max(-80, Math.min(180, valor));
  }

  function calcularPosicao(clientX: number, clientY: number) {
    const rect = area.getBoundingClientRect();

    return {
      x: Math.round(limitar(((clientX - rect.left) / rect.width) * 100)),
      y: Math.round(limitar(((clientY - rect.top) / rect.height) * 100)),
    };
  }

  function mover(ev: MouseEvent) {
    const posicao = calcularPosicao(ev.clientX, ev.clientY);
    const modoTangente = pontoBase.modoTangente || "SUAVE";

    if (alca === "ENTRADA") {
      if (modoTangente === "LIVRE") {
        atualizarPontoLivreForma(objeto.id, pontoId, {
          tipo: "CURVA",
          modoTangente: "LIVRE",
          alcaEntradaX: posicao.x,
          alcaEntradaY: posicao.y,
        });

        return;
      }

      const alcaSaidaX = limitar(pontoBase.x - (posicao.x - pontoBase.x));
      const alcaSaidaY = limitar(pontoBase.y - (posicao.y - pontoBase.y));

      atualizarPontoLivreForma(objeto.id, pontoId, {
        tipo: "CURVA",
        modoTangente: "SUAVE",
        alcaEntradaX: posicao.x,
        alcaEntradaY: posicao.y,
        alcaSaidaX,
        alcaSaidaY,
      });

      return;
    }

    if (modoTangente === "LIVRE") {
      atualizarPontoLivreForma(objeto.id, pontoId, {
        tipo: "CURVA",
        modoTangente: "LIVRE",
        alcaSaidaX: posicao.x,
        alcaSaidaY: posicao.y,
      });

      return;
    }

    const alcaEntradaX = limitar(pontoBase.x - (posicao.x - pontoBase.x));
    const alcaEntradaY = limitar(pontoBase.y - (posicao.y - pontoBase.y));

    atualizarPontoLivreForma(objeto.id, pontoId, {
      tipo: "CURVA",
      modoTangente: "SUAVE",
      alcaSaidaX: posicao.x,
      alcaSaidaY: posicao.y,
      alcaEntradaX,
      alcaEntradaY,
    });
  }

  function soltar() {
    window.removeEventListener("mousemove", mover);
    window.removeEventListener("mouseup", soltar);
  }

  window.addEventListener("mousemove", mover);
  window.addEventListener("mouseup", soltar);
}

function selecionarPontoLivre(
  objetoId: number,
  pontoId: number,
  multiplo: boolean
) {
  setObjetos((atual) =>
    atual.map((obj) => {
      if (obj.id !== objetoId || obj.tipo !== "FORMA") {
        return obj;
      }

      const selecionados = obj.pontosLivresSelecionadosIds || [];

      const novosSelecionados = multiplo
        ? selecionados.includes(pontoId)
          ? selecionados.filter((id) => id !== pontoId)
          : [...selecionados, pontoId]
        : [pontoId];

      return {
        ...obj,
        pontoLivreSelecionadoId: pontoId,
        pontosLivresSelecionadosIds: novosSelecionados,
      } as ObjetoCracha;
    })
  );
}

function adicionarPontoLivreForma() {
  if (!objetoAtual || objetoAtual.tipo !== "FORMA") return;
  if (objetoAtual.forma !== "FORMA_LIVRE") return;

  const pontos = pontosLivresForma(objetoAtual);
  const selecionadoId = objetoAtual.pontoLivreSelecionadoId;
  const indiceSelecionado = pontos.findIndex(
    (ponto) => ponto.id === selecionadoId
  );

  const indiceBase = indiceSelecionado >= 0 ? indiceSelecionado : pontos.length - 1;
  const pontoA = pontos[indiceBase];
  const pontoB = pontos[(indiceBase + 1) % pontos.length];

  const novoPonto = {
    id: Date.now(),
    x: Math.round((pontoA.x + pontoB.x) / 2),
    y: Math.round((pontoA.y + pontoB.y) / 2),
    tipo: "CANTO" as const,
  };

  const novosPontos = [
    ...pontos.slice(0, indiceBase + 1),
    novoPonto,
    ...pontos.slice(indiceBase + 1),
  ];

  atualizarObjeto(objetoAtual.id, {
    pontosLivres: novosPontos,
    pontoLivreSelecionadoId: novoPonto.id,
    pontosLivresSelecionadosIds: [novoPonto.id],
  });
}

function removerPontosLivresSelecionados() {
  if (!objetoAtual || objetoAtual.tipo !== "FORMA") return;
  if (objetoAtual.forma !== "FORMA_LIVRE") return;

  const selecionados = objetoAtual.pontosLivresSelecionadosIds || [];

  if (!selecionados.length) return;

  const pontos = pontosLivresForma(objetoAtual);

  if (pontos.length - selecionados.length < 3) {
    setAvisoCracha({
      tipo: "erro",
      texto: "A forma livre precisa ter pelo menos 3 pontos.",
    });

    setTimeout(() => setAvisoCracha(null), 3000);
    return;
  }

  atualizarObjeto(objetoAtual.id, {
    pontosLivres: pontos.filter(
      (ponto) => !selecionados.includes(ponto.id)
    ),
    pontoLivreSelecionadoId: null,
    pontosLivresSelecionadosIds: [],
  });
}

function subdividirPontosLivresSelecionados() {
  if (!objetoAtual || objetoAtual.tipo !== "FORMA") return;
  if (objetoAtual.forma !== "FORMA_LIVRE") return;

  const selecionados = objetoAtual.pontosLivresSelecionadosIds || [];

  if (selecionados.length < 2) {
    setAvisoCracha({
      tipo: "erro",
      texto: "Selecione pelo menos 2 pontos vizinhos para subdividir.",
    });

    setTimeout(() => setAvisoCracha(null), 3000);
    return;
  }

  const pontos = pontosLivresForma(objetoAtual);
  const novosPontos: typeof pontos = [];
  const novosSelecionados: number[] = [];

  for (let i = 0; i < pontos.length; i++) {
    const pontoAtual = pontos[i];
    const proximoPonto = pontos[(i + 1) % pontos.length];

    novosPontos.push(pontoAtual);

    const deveSubdividir =
      selecionados.includes(pontoAtual.id) &&
      selecionados.includes(proximoPonto.id);

    if (deveSubdividir) {
      const novoId = Date.now() + i;

      const novoPonto = {
        id: novoId,
        x: Math.round((pontoAtual.x + proximoPonto.x) / 2),
        y: Math.round((pontoAtual.y + proximoPonto.y) / 2),
        tipo: "CANTO" as const,
      };

      novosPontos.push(novoPonto);
      novosSelecionados.push(novoId);
    }
  }

  if (!novosSelecionados.length) {
    setAvisoCracha({
      tipo: "erro",
      texto: "Para subdividir, selecione pontos vizinhos da forma.",
    });

    setTimeout(() => setAvisoCracha(null), 3000);
    return;
  }

  atualizarObjeto(objetoAtual.id, {
    pontosLivres: novosPontos,
    pontoLivreSelecionadoId: novosSelecionados[0],
    pontosLivresSelecionadosIds: novosSelecionados,
  });
}

function clonarObjetoCracha(
  objeto: ObjetoCracha,
  deslocamento = 12
): ObjetoCracha {
  const agora = Date.now();

  const novoObjeto = {
    ...objeto,
    id: agora,
    x: objeto.x + deslocamento,
    y: objeto.y + deslocamento,
    ordem: agora,
  } as ObjetoCracha;

  if (objeto.tipo === "FORMA") {
    return {
      ...novoObjeto,
      gradientePontos: objeto.gradientePontos?.map((ponto, index) => ({
        ...ponto,
        id: agora + 1000 + index,
      })),
      pontosLivres: objeto.pontosLivres?.map((ponto, index) => ({
        ...ponto,
        id: agora + 2000 + index,
      })),
      pontoLivreSelecionadoId: null,
      pontosLivresSelecionadosIds: [],
    } as ObjetoCracha;
  }

  return novoObjeto;
}

function copiarObjetoSelecionado() {
  if (!objetoAtual) return;

  setObjetoCopiado(objetoAtual);

  setAvisoCracha({
    tipo: "sucesso",
    texto: "Objeto copiado.",
  });

  setTimeout(() => setAvisoCracha(null), 2000);
}

function colarObjetoCopiado() {
  if (!objetoCopiado) return;

  const novoObjeto = clonarObjetoCracha(objetoCopiado, 12);

  setObjetos((atual) => [...atual, novoObjeto]);
  setObjetoSelecionado(novoObjeto.id);

  setAvisoCracha({
    tipo: "sucesso",
    texto: "Objeto colado.",
  });

  setTimeout(() => setAvisoCracha(null), 2000);
}

function pontoLivreSelecionadoAtual(
  objeto: Extract<ObjetoCracha, { tipo: "FORMA" }>
) {
  const pontos = pontosLivresForma(objeto);

  return (
    pontos.find(
      (ponto) => ponto.id === objeto.pontoLivreSelecionadoId
    ) || null
  );
}

function definirModoPontoLivre(
  modo: "CANTO" | "SUAVE" | "LIVRE"
) {
  if (!objetoAtual || objetoAtual.tipo !== "FORMA") return;
  if (objetoAtual.forma !== "FORMA_LIVRE") return;

  const ponto = pontoLivreSelecionadoAtual(objetoAtual);

  if (!ponto) {
    setAvisoCracha({
      tipo: "erro",
      texto: "Selecione um ponto da forma livre primeiro.",
    });

    setTimeout(() => setAvisoCracha(null), 3000);
    return;
  }

  if (modo === "CANTO") {
    atualizarPontoLivreForma(objetoAtual.id, ponto.id, {
      tipo: "CANTO",
      modoTangente: undefined,
      alcaEntradaX: undefined,
      alcaEntradaY: undefined,
      alcaSaidaX: undefined,
      alcaSaidaY: undefined,
    });

    return;
  }

  if (modo === "SUAVE") {
    atualizarPontoLivreForma(objetoAtual.id, ponto.id, {
      tipo: "CURVA",
      modoTangente: "SUAVE",
      alcaEntradaX: ponto.alcaEntradaX ?? Math.max(-80, ponto.x - 18),
      alcaEntradaY: ponto.alcaEntradaY ?? ponto.y,
      alcaSaidaX: ponto.alcaSaidaX ?? Math.min(180, ponto.x + 18),
      alcaSaidaY: ponto.alcaSaidaY ?? ponto.y,
    });

    return;
  }

  atualizarPontoLivreForma(objetoAtual.id, ponto.id, {
    tipo: "CURVA",
    modoTangente: "LIVRE",
    alcaEntradaX: ponto.alcaEntradaX ?? Math.max(-80, ponto.x - 18),
    alcaEntradaY: ponto.alcaEntradaY ?? ponto.y,
    alcaSaidaX: ponto.alcaSaidaX ?? Math.min(180, ponto.x + 18),
    alcaSaidaY: ponto.alcaSaidaY ?? ponto.y,
  });
}

function iniciarArrastoMenuContexto(
  e: React.MouseEvent<HTMLDivElement>
) {
  e.preventDefault();
  e.stopPropagation();

  const inicioX = e.clientX;
  const inicioY = e.clientY;

  const menuXInicial = menuContexto.x;
  const menuYInicial = menuContexto.y;

  const larguraMenu = 224;
  const alturaMenu = 190;
  const margem = 8;

  function limitar(valor: number, minimo: number, maximo: number) {
    return Math.max(minimo, Math.min(maximo, valor));
  }

  function mover(ev: MouseEvent) {
    const novoX = menuXInicial + ev.clientX - inicioX;
    const novoY = menuYInicial + ev.clientY - inicioY;

    setMenuContexto((atual) => ({
  ...atual,
  x: limitar(
        novoX,
        margem,
        window.innerWidth - larguraMenu - margem
      ),
      y: limitar(
        novoY,
        margem,
        window.innerHeight - alturaMenu - margem
      ),
    }));
  }

  function soltar() {
    window.removeEventListener("mousemove", mover);
    window.removeEventListener("mouseup", soltar);
  }

  window.addEventListener("mousemove", mover);
  window.addEventListener("mouseup", soltar);
}

function gerarPontosPoligono(
  lados: number,
  largura: number,
  altura: number
) {
  const totalLados = Math.max(3, lados || 6);
  const centroX = largura / 2;
  const centroY = altura / 2;
  const raio = Math.min(largura, altura) / 2;

  const pontos: string[] = [];

  for (let i = 0; i < totalLados; i++) {
    const angulo = (-Math.PI / 2) + (i * 2 * Math.PI) / totalLados;
    const x = centroX + Math.cos(angulo) * raio;
    const y = centroY + Math.sin(angulo) * raio;

    const xPercent = (x / largura) * 100;
    const yPercent = (y / altura) * 100;

    pontos.push(`${xPercent}% ${yPercent}%`);
  }

  return pontos.join(", ");
}

  return (
  <div
    className="phanyx-crachas-page relative p-4"
    onMouseDown={() => fecharMenuContexto()}
  >
   <img
  src="/images/phanyx-cracha.png"
  alt="Mascote PHANYX Crachás"
  className="pointer-events-none absolute -top-20 left-6 z-10 hidden h-24 w-auto select-none opacity-95 drop-shadow-xl lg:block"
/>

    {/* Barra Superior */}

      <div className="phanyx-crachas-card mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          <button className="phanyx-crachas-button-primary">
            Novo Modelo
          </button>

          <button className="phanyx-crachas-button-secondary">
            Salvar
          </button>

          <button className="phanyx-crachas-button-secondary">
            Duplicar
          </button>

          <button className="phanyx-crachas-button-secondary">
            Emitir
          </button>

          <button className="phanyx-crachas-button-secondary">
            Imprimir
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
  setLado("FRENTE");
  setObjetoSelecionado(null);
}}
            className={`rounded-xl px-4 py-2 font-semibold ${
              lado === "FRENTE"
                ? "bg-blue-600 text-white"
                : "phanyx-crachas-tab-off"
            }`}
          >
            Frente
          </button>

          <button
            type="button"
            onClick={() => {
  setLado("VERSO");
  setObjetoSelecionado(null);
}}
            className={`rounded-xl px-4 py-2 font-semibold ${
              lado === "VERSO"
                ? "bg-blue-600 text-white"
                : "phanyx-crachas-tab-off"
            }`}
          >
            Verso
          </button>
        </div>
      </div>

{avisoCracha && (
  <div
    className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
      avisoCracha.tipo === "sucesso"
        ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
        : "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200"
    }`}
  >
    {avisoCracha.texto}
  </div>
)}

{menuContexto.aberto && menuContexto.objetoId && (
  <div
    className="fixed w-56 rounded-2xl border border-slate-300 bg-white p-2 text-sm font-semibold text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
    style={{
      left: menuContexto.x,
      top: menuContexto.y,
      zIndex: 2147483647,
    }}
    onMouseDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
  >
<div
  onMouseDown={iniciarArrastoMenuContexto}
  className="mb-2 cursor-move rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
>
  ⠿ Arrastar menu
</div>

    <button
      type="button"
      onClick={() =>
        trazerObjetoParaFrentePorId(menuContexto.objetoId!)
      }
      className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      Trazer para frente
    </button>

    <button
      type="button"
      onClick={() =>
        enviarObjetoParaTrasPorId(menuContexto.objetoId!)
      }
      className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      Enviar para trás
    </button>

    <button
      type="button"
      onClick={() =>
        duplicarObjetoPorId(menuContexto.objetoId!)
      }
      className="w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      Duplicar
    </button>

    <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

    <button
      type="button"
      onClick={() =>
        excluirObjetoPorId(menuContexto.objetoId!)
      }
      className="w-full rounded-xl px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
    >
      Excluir
    </button>
  </div>
)}

      <div className="grid grid-cols-12 gap-4">

        {/* Ferramentas */}

        <div className="phanyx-crachas-card col-span-2 p-4">
          <h2 className="mb-4 font-bold">
            Ferramentas
          </h2>

          <div className="space-y-2">
            <button
              type="button"
              onClick={adicionarTexto}
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              📝 Texto
            </button>

            <button
  type="button"
  onClick={adicionarCampoDinamico}
  className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  🏷️ Campo
</button>

            <button
  type="button"
  onClick={adicionarFoto}
  className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  👤 Foto
</button>

            <button
  type="button"
  onClick={adicionarLogo}
  className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  🏫 Logo
</button>

            <button
  type="button"
  onClick={() => inputImagemRef.current?.click()}
  className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  🖼️ Imagem
</button>

            <button
  type="button"
  onClick={adicionarForma}
  className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  ⬛ Forma
</button>

            <button
  type="button"
  onClick={adicionarQrCode}
  className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
>
  🔳 QR Code
</button>

            <button
              type="button"
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              ▌ Código de Barras
            </button>
            <input
  ref={inputImagemRef}
  type="file"
  accept="image/*"
  onChange={handleUploadImagem}
  className="hidden"
/>
          </div>
        </div>

        {/* Canvas */}

<div className="phanyx-crachas-card phanyx-crachas-canvas-area col-span-7 flex items-center justify-center p-8">
          <div
            className="phanyx-cracha-paper relative overflow-hidden shadow-xl"
            style={{
              ["--cor-fundo-cracha" as any]: corFundoCracha,
              width:
                formato === "RETRATO"
                  ? "240px"
                  : formato === "PAISAGEM"
                  ? "380px"
                  : "260px",

              height:
                formato === "RETRATO"
                  ? "380px"
                  : formato === "PAISAGEM"
                  ? "240px"
                  : "260px",

              borderRadius:
                formato === "REDONDO"
                  ? "9999px"
                  : "16px",
            }}
          >

            {renderFuroCracha()}

            {[...objetos]
  .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
  .map((objeto) => {

if (objeto.tipo === "TEXTO") {
                return (
                  <div
                    key={objeto.id}
                    onContextMenu={(e) => abrirMenuContexto(e, objeto.id)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      setObjetoSelecionado(objeto.id);

                      const inicioX = e.clientX;
                      const inicioY = e.clientY;
                      const xOriginal = objeto.x;
                      const yOriginal = objeto.y;

                      function mover(ev: MouseEvent) {
                        const novoX = xOriginal + ev.clientX - inicioX;
                        const novoY = yOriginal + ev.clientY - inicioY;

                        atualizarObjeto(objeto.id, {
                          x: novoX,
                          y: novoY,
                        });
                      }

                      function soltar() {
                        window.removeEventListener("mousemove", mover);
                        window.removeEventListener("mouseup", soltar);
                      }

                      window.addEventListener("mousemove", mover);
                      window.addEventListener("mouseup", soltar);
                    }}
                    style={{
  position: "absolute",
  left: objeto.x,
  top: objeto.y,
  width: objeto.largura,
  height: objeto.altura,
  fontSize: objeto.fonte,
  color: objeto.cor,
  textShadow: sombraTextoCss(objeto),
  cursor: "move",
  padding: "2px 4px",
  textAlign: objeto.alinhamento,
  display: "flex",
  alignItems: "center",
  overflow: "visible",
  border:
    objetoSelecionado === objeto.id
      ? "1px dashed #2563eb"
      : "1px solid transparent",
      zIndex: Math.max(1, objeto.ordem || 1),
}}
                  >
  {objeto.texto}
  {objetoSelecionado === objeto.id && <BotaoExcluirObjeto />}

  {objetoSelecionado === objeto.id && (
    <>
      <span
        onMouseDown={(e) => redimensionarTexto(e, objeto, "nw")}
        className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full border border-blue-600 bg-white"
        style={{ cursor: "nwse-resize" }}
      />

      <span
        onMouseDown={(e) => redimensionarTexto(e, objeto, "ne")}
        className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border border-blue-600 bg-white"
        style={{ cursor: "nesw-resize" }}
      />

      <span
        onMouseDown={(e) => redimensionarTexto(e, objeto, "sw")}
        className="absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full border border-blue-600 bg-white"
        style={{ cursor: "nesw-resize" }}
      />

      <span
        onMouseDown={(e) => redimensionarTexto(e, objeto, "se")}
        className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full border border-blue-600 bg-white"
        style={{ cursor: "nwse-resize" }}
      />
    </>
  )}
</div>
                );
              }

if (objeto.tipo === "CAMPO") {
  return (
    <div
      key={objeto.id}
      onContextMenu={(e) => abrirMenuContexto(e, objeto.id)}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();

        setObjetoSelecionado(objeto.id);

        const inicioX = e.clientX;
        const inicioY = e.clientY;
        const xOriginal = objeto.x;
        const yOriginal = objeto.y;

        function mover(ev: MouseEvent) {
          const novoX = xOriginal + ev.clientX - inicioX;
          const novoY = yOriginal + ev.clientY - inicioY;

          atualizarObjeto(objeto.id, {
            x: novoX,
            y: novoY,
          });
        }

        function soltar() {
          window.removeEventListener("mousemove", mover);
          window.removeEventListener("mouseup", soltar);
        }

        window.addEventListener("mousemove", mover);
        window.addEventListener("mouseup", soltar);
      }}
      style={{
        position: "absolute",
        left: objeto.x,
        top: objeto.y,
        width: objeto.largura,
        height: objeto.altura,
        fontSize: objeto.fonte,
        color: objeto.cor,
        cursor: "move",
        padding: "2px 4px",
        textAlign: objeto.alinhamento,
        display: "flex",
        alignItems: "center",
        overflow: "visible",
        border:
          objetoSelecionado === objeto.id
            ? "1px dashed #2563eb"
            : "1px solid transparent",
            zIndex: Math.max(1, objeto.ordem || 1),
      }}
    >
      {objeto.campo}
      {objetoSelecionado === objeto.id && <BotaoExcluirObjeto />}
    </div>
  );
}

if (objeto.tipo === "IMAGEM") {
  return (
    <div
      key={objeto.id}
      onContextMenu={(e) => abrirMenuContexto(e, objeto.id)}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();

        setObjetoSelecionado(objeto.id);

        const inicioX = e.clientX;
        const inicioY = e.clientY;
        const xOriginal = objeto.x;
        const yOriginal = objeto.y;

        function mover(ev: MouseEvent) {
          const novoX = xOriginal + ev.clientX - inicioX;
          const novoY = yOriginal + ev.clientY - inicioY;

          atualizarObjeto(objeto.id, {
            x: novoX,
            y: novoY,
          });
        }

        function soltar() {
          window.removeEventListener("mousemove", mover);
          window.removeEventListener("mouseup", soltar);
        }

        window.addEventListener("mousemove", mover);
        window.addEventListener("mouseup", soltar);
      }}
      style={{
        position: "absolute",
        left: objeto.x,
        top: objeto.y,
        width: objeto.largura,
        height: objeto.altura,
        cursor: "move",
        overflow: "visible",
        border:
          objetoSelecionado === objeto.id
            ? "1px dashed #2563eb"
            : objeto.url
            ? "1px solid transparent"
            : "1px solid #94a3b8",
        borderRadius: objeto.raioBorda,
        boxShadow: sombraImagemBoxCss(objeto),
        zIndex: Math.max(1, objeto.ordem || 1),
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: objeto.raioBorda,
          overflow: "hidden",
          background: objeto.url ? "transparent" : "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#334155",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {objeto.url ? (
          <img
            src={objeto.url}
            alt={objeto.rotulo}
            className="h-full w-full"
            style={{
              objectFit: objeto.ajusteImagem || "contain",
              background: "transparent",
              filter: sombraImagemDropCss(objeto),
            }}
          />
        ) : (
          <span>{objeto.rotulo}</span>
        )}
      </div>

      {objetoSelecionado === objeto.id && <BotaoExcluirObjeto />}
      {objetoSelecionado === objeto.id && (
  <>
    <span
      onMouseDown={(e) => redimensionarImagem(e, objeto, "nw")}
      className="absolute -left-1.5 -top-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
      style={{ cursor: "nwse-resize" }}
    />

    <span
      onMouseDown={(e) => redimensionarImagem(e, objeto, "ne")}
      className="absolute -right-1.5 -top-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
      style={{ cursor: "nesw-resize" }}
    />

    <span
      onMouseDown={(e) => redimensionarImagem(e, objeto, "sw")}
      className="absolute -bottom-1.5 -left-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
      style={{ cursor: "nesw-resize" }}
    />

    <span
      onMouseDown={(e) => redimensionarImagem(e, objeto, "se")}
      className="absolute -bottom-1.5 -right-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
      style={{ cursor: "nwse-resize" }}
    />
  </>
)}
    </div>
  );
}

if (objeto.tipo === "QRCODE") {
  return (
    <div
      key={objeto.id}
      onContextMenu={(e) => abrirMenuContexto(e, objeto.id)}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();

        setObjetoSelecionado(objeto.id);

        const inicioX = e.clientX;
        const inicioY = e.clientY;
        const xOriginal = objeto.x;
        const yOriginal = objeto.y;

        function mover(ev: MouseEvent) {
          const novoX = xOriginal + ev.clientX - inicioX;
          const novoY = yOriginal + ev.clientY - inicioY;

          atualizarObjeto(objeto.id, {
            x: novoX,
            y: novoY,
          });
        }

        function soltar() {
          window.removeEventListener("mousemove", mover);
          window.removeEventListener("mouseup", soltar);
        }

        window.addEventListener("mousemove", mover);
        window.addEventListener("mouseup", soltar);
      }}
      style={{
        position: "absolute",
        left: objeto.x,
        top: objeto.y,
        width: objeto.largura,
        height: objeto.altura,
        cursor: "move",
        overflow: "visible",
        border:
          objetoSelecionado === objeto.id
            ? "1px dashed #2563eb"
            : "1px solid transparent",
        borderRadius: objeto.raioBorda,
        boxShadow: sombraQrCodeCss(objeto),
        zIndex: Math.max(1, objeto.ordem || 1),
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: objeto.margem,
          borderRadius: objeto.raioBorda,
          background: objeto.mostrarFundo ? objeto.corFundo : "transparent",
        }}
      >
        <QRCodeSVG
          value={objeto.valor || "https://www.phanyx.com.br"}
          bgColor={objeto.mostrarFundo ? objeto.corFundo : "transparent"}
          fgColor={objeto.cor || "#000000"}
          level="M"
          includeMargin={false}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>

      {objetoSelecionado === objeto.id && <BotaoExcluirObjeto />}

      {objetoSelecionado === objeto.id && (
        <>
          <span
            onMouseDown={(e) => redimensionarQrCode(e, objeto, "nw")}
            className="absolute -left-1.5 -top-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
            style={{ cursor: "nwse-resize" }}
          />

          <span
            onMouseDown={(e) => redimensionarQrCode(e, objeto, "ne")}
            className="absolute -right-1.5 -top-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
            style={{ cursor: "nesw-resize" }}
          />

          <span
            onMouseDown={(e) => redimensionarQrCode(e, objeto, "sw")}
            className="absolute -bottom-1.5 -left-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
            style={{ cursor: "nesw-resize" }}
          />

          <span
            onMouseDown={(e) => redimensionarQrCode(e, objeto, "se")}
            className="absolute -bottom-1.5 -right-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
            style={{ cursor: "nwse-resize" }}
          />
        </>
      )}
    </div>
  );
}

if (objeto.tipo === "FORMA") {
  return (
    <div
      key={objeto.id}
      data-forma-livre-area={objeto.id}
      onContextMenu={(e) => abrirMenuContexto(e, objeto.id)}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();

        setObjetoSelecionado(objeto.id);

        const inicioX = e.clientX;
        const inicioY = e.clientY;
        const xOriginal = objeto.x;
        const yOriginal = objeto.y;

        function mover(ev: MouseEvent) {
          const novoX = xOriginal + ev.clientX - inicioX;
          const novoY = yOriginal + ev.clientY - inicioY;

          atualizarObjeto(objeto.id, {
            x: novoX,
            y: novoY,
          });
        }

        function soltar() {
          window.removeEventListener("mousemove", mover);
          window.removeEventListener("mouseup", soltar);
        }

        window.addEventListener("mousemove", mover);
        window.addEventListener("mouseup", soltar);
      }}
      style={{
  position: "absolute",
  left: objeto.x,
  top: objeto.y,
  width: objeto.largura,
  height: objeto.altura,
  zIndex: Math.max(1, objeto.ordem || 1),
  cursor: "move",
  overflow: "visible",
  backgroundColor: "transparent",
  border: "none",
  opacity: 1,
  boxSizing: "border-box",
  outline:
    objetoSelecionado === objeto.id
      ? "1px dashed #2563eb"
      : "none",
}}

    >
      <svg
  viewBox="0 0 100 100"
  preserveAspectRatio="none"
  className="h-full w-full"
  style={{
    display: "block",
    overflow: "visible",
    opacity: objeto.opacidade / 100,
    pointerEvents: "none",
    filter: filtroAcabamentoForma(objeto),
    transform: `rotate(${objeto.rotacao ?? 0}deg)`,
    transformOrigin: "center center",
  }}
>
  <defs>{renderGradienteForma(objeto)}</defs>
  {renderFormaSvg(objeto)}
</svg>

{objetoSelecionado === objeto.id &&
  objeto.forma === "FORMA_LIVRE" && (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
    >
      {pontosLivresForma(objeto).map((ponto) => (
        <g key={`alcas-${ponto.id}`}>
          {ponto.tipo === "CURVA" &&
            ponto.alcaEntradaX !== undefined &&
            ponto.alcaEntradaY !== undefined && (
              <line
                x1={ponto.x}
                y1={ponto.y}
                x2={ponto.alcaEntradaX}
                y2={ponto.alcaEntradaY}
                stroke="#facc15"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )}

          {ponto.tipo === "CURVA" &&
            ponto.alcaSaidaX !== undefined &&
            ponto.alcaSaidaY !== undefined && (
              <line
                x1={ponto.x}
                y1={ponto.y}
                x2={ponto.alcaSaidaX}
                y2={ponto.alcaSaidaY}
                stroke="#facc15"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )}
        </g>
      ))}
    </svg>
  )}

{objetoSelecionado === objeto.id &&
  objeto.forma === "FORMA_LIVRE" &&
  pontosLivresForma(objeto).map((ponto) => (
    <button
  key={ponto.id}
  type="button"
  onMouseDown={(e) => {
    if (e.shiftKey || e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      selecionarPontoLivre(objeto.id, ponto.id, true);
      return;
    }

    selecionarPontoLivre(objeto.id, ponto.id, false);
    iniciarArrastoPontoLivre(e, objeto, ponto.id);
  }}
  onDoubleClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    alternarCurvaPontoLivre(objeto.id, ponto.id);
  }}
  title={`Ponto ${ponto.id}`}
  className={`absolute z-30 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow ${
    objeto.pontosLivresSelecionadosIds?.includes(ponto.id)
      ? "border-yellow-300 bg-yellow-300"
      : "border-white bg-blue-600"
  }`}
  style={{
    left: `${ponto.x}%`,
    top: `${ponto.y}%`,
    cursor: "grab",
  }}
/>
  ))}

{objetoSelecionado === objeto.id &&
  objeto.forma === "FORMA_LIVRE" &&
  pontosLivresForma(objeto).map((ponto) => (
    <div key={`alca-botoes-${ponto.id}`}>
      {ponto.tipo === "CURVA" &&
        ponto.alcaEntradaX !== undefined &&
        ponto.alcaEntradaY !== undefined && (
          <button
            type="button"
            onMouseDown={(e) =>
              iniciarArrastoAlcaFormaLivre(
                e,
                objeto,
                ponto.id,
                "ENTRADA"
              )
            }
            title="Alça de entrada"
            className="absolute z-30 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-yellow-400 shadow"
            style={{
              left: `${ponto.alcaEntradaX}%`,
              top: `${ponto.alcaEntradaY}%`,
              cursor: "grab",
            }}
          />
        )}

      {ponto.tipo === "CURVA" &&
        ponto.alcaSaidaX !== undefined &&
        ponto.alcaSaidaY !== undefined && (
          <button
            type="button"
            onMouseDown={(e) =>
              iniciarArrastoAlcaFormaLivre(
                e,
                objeto,
                ponto.id,
                "SAIDA"
              )
            }
            title="Alça de saída"
            className="absolute z-30 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-yellow-400 shadow"
            style={{
              left: `${ponto.alcaSaidaX}%`,
              top: `${ponto.alcaSaidaY}%`,
              cursor: "grab",
            }}
          />
        )}
    </div>
  ))}

      {objetoSelecionado === objeto.id && <BotaoExcluirObjeto />}

      {objetoSelecionado === objeto.id && (
        <>
          <span
            onMouseDown={(e) => redimensionarForma(e, objeto, "nw")}
            className="absolute -left-1.5 -top-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
            style={{ cursor: "nwse-resize" }}
          />

          <span
            onMouseDown={(e) => redimensionarForma(e, objeto, "ne")}
            className="absolute -right-1.5 -top-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
            style={{ cursor: "nesw-resize" }}
          />

          <span
            onMouseDown={(e) => redimensionarForma(e, objeto, "sw")}
            className="absolute -bottom-1.5 -left-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
            style={{ cursor: "nesw-resize" }}
          />

          <span
            onMouseDown={(e) => redimensionarForma(e, objeto, "se")}
            className="absolute -bottom-1.5 -right-1.5 z-20 h-3 w-3 rounded-full border border-blue-600 bg-white shadow"
            style={{ cursor: "nwse-resize" }}
          />
        </>
      )}
    </div>
  );
}

              return null;
            })}
          </div>
        </div>

        {/* Propriedades */}

<div className="phanyx-crachas-card col-span-3 h-[calc(100vh-260px)] min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain p-4 pr-3 pb-28">
          <h2 className="mb-4 font-bold">
            Propriedades
          </h2>

{objetoAtual && (
  <div className="mb-4 rounded-2xl border border-slate-700/40 p-3">
    <p className="mb-2 text-sm font-bold">
      Camada
    </p>

    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={trazerParaFrente}
        className="phanyx-crachas-button-secondary text-xs"
      >
        Trazer para frente
      </button>

      <button
        type="button"
        onClick={enviarParaTras}
        className="phanyx-crachas-button-secondary text-xs"
      >
        Enviar para trás
      </button>
    </div>
  </div>
)}

{objetoAtual?.tipo === "QRCODE" && (
  <div className="mb-4 space-y-4">
    <div className="rounded-2xl border border-slate-700/40 p-3">
      <p className="mb-3 text-sm font-bold">
        QR Code
      </p>

      <label className="mb-2 block text-xs font-semibold">
        Conteúdo do QR Code
      </label>

      <textarea
        value={objetoAtual.valor}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            valor: e.target.value,
          })
        }
        rows={4}
        className="phanyx-crachas-input min-h-[90px]"
      />

      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
        Recomendado: https://www.phanyx.com.br/verificar/cracha/{"{{codigoCracha}}"}
      </p>
    </div>

    <div className="rounded-2xl border border-slate-700/40 p-3">
      <p className="mb-3 text-sm font-bold">
        Aparência do QR Code
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold">
            Cor do QR
          </label>

          <input
            type="color"
            value={objetoAtual.cor}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                cor: e.target.value,
              })
            }
            className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Cor do fundo
          </label>

          <input
            type="color"
            value={objetoAtual.corFundo}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                corFundo: e.target.value,
              })
            }
            className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs font-semibold">
        <input
          type="checkbox"
          checked={objetoAtual.mostrarFundo}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              mostrarFundo: e.target.checked,
            })
          }
        />
        Mostrar fundo
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold">
            Margem interna
          </label>

          <input
            type="number"
            min={0}
            max={40}
            value={objetoAtual.margem}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                margem: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Arredondamento
          </label>

          <input
            type="number"
            min={0}
            max={40}
            value={objetoAtual.raioBorda}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                raioBorda: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-slate-700/40 p-3">
      <p className="mb-3 text-sm font-bold">
        Posição e tamanho
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold">
            X
          </label>

          <input
            type="number"
            value={Math.round(objetoAtual.x)}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                x: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Y
          </label>

          <input
            type="number"
            value={Math.round(objetoAtual.y)}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                y: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Tamanho
          </label>

          <input
            type="number"
            min={40}
            value={Math.round(objetoAtual.largura)}
            onChange={(e) => {
              const tamanho = Number(e.target.value);

              atualizarObjeto(objetoAtual.id, {
                largura: tamanho,
                altura: tamanho,
              });
            }}
            className="phanyx-crachas-input"
          />
        </div>
      </div>
    </div>
  </div>
)}

          {!objetoAtual && (
            <p className="phanyx-crachas-muted">
              Nenhum objeto selecionado.
            </p>
          )}

          {objetoAtual?.tipo === "TEXTO" && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-semibold">
                  Texto
                </label>

                <input
                  value={objetoAtual.texto}
                  onChange={(e) =>
                    atualizarObjeto(objetoAtual.id, {
                      texto: e.target.value,
                    })
                  }
                  className="phanyx-crachas-input"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Tamanho
                </label>

                <input
                  type="number"
                  value={objetoAtual.fonte}
                  onChange={(e) =>
                    atualizarObjeto(objetoAtual.id, {
                      fonte: Number(e.target.value),
                    })
                  }
                  className="phanyx-crachas-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-2 block font-semibold">
                    Largura
                  </label>

                  <input
                    type="number"
                    value={objetoAtual.largura}
                    onChange={(e) =>
                      atualizarObjeto(objetoAtual.id, {
                        largura: Number(e.target.value),
                      })
                    }
                    className="phanyx-crachas-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Altura
                  </label>

                  <input
                    type="number"
                    value={objetoAtual.altura}
                    onChange={(e) =>
                      atualizarObjeto(objetoAtual.id, {
                        altura: Number(e.target.value),
                      })
                    }
                    className="phanyx-crachas-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-2 block font-semibold">
                    X
                  </label>

                  <input
                    type="number"
                    value={Math.round(objetoAtual.x)}
                    onChange={(e) =>
                      atualizarObjeto(objetoAtual.id, {
                        x: Number(e.target.value),
                      })
                    }
                    className="phanyx-crachas-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-semibold">
                    Y
                  </label>

                  <input
                    type="number"
                    value={Math.round(objetoAtual.y)}
                    onChange={(e) =>
                      atualizarObjeto(objetoAtual.id, {
                        y: Number(e.target.value),
                      })
                    }
                    className="phanyx-crachas-input"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Alinhar caixa
                </label>

                <div className="flex gap-2">
                  {[
                    { valor: "left", label: "←" },
                    { valor: "center", label: "↔" },
                    { valor: "right", label: "→" },
                  ].map((item) => (
                    <button
                      key={item.valor}
                      type="button"
                      onClick={() =>
                        alinharCaixaTexto(
                          item.valor as "left" | "center" | "right"
                        )
                      }
                      className={`h-10 w-10 rounded-xl border text-lg font-bold transition ${
                        item.valor === "center"
                          ? "border-slate-400"
                          : "border-slate-400"
                      } hover:bg-blue-600 hover:text-white`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  Cor
                </label>

                <input
                  type="color"
                  value={objetoAtual.cor}
                  onChange={(e) =>
                    atualizarObjeto(objetoAtual.id, {
                      cor: e.target.value,
                    })
                  }
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

<div className="rounded-2xl border border-slate-700/40 p-3">
  <label className="mb-3 flex items-center gap-2 font-semibold">
    <input
      type="checkbox"
      checked={!!objetoAtual.sombraAtiva}
      onChange={(e) =>
        atualizarObjeto(objetoAtual.id, {
          sombraAtiva: e.target.checked,
        })
      }
    />
    Sombra do texto
  </label>

  {objetoAtual.sombraAtiva && (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">X</label>
          <input
            type="number"
            value={objetoAtual.sombraX ?? 2}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraX: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Y</label>
          <input
            type="number"
            value={objetoAtual.sombraY ?? 2}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraY: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Blur</label>
          <input
            type="number"
            value={objetoAtual.sombraBlur ?? 4}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraBlur: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Cor da sombra
        </label>
        <input
          type="color"
          value={objetoAtual.sombraCor ?? "#000000"}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              sombraCor: e.target.value,
            })
          }
          className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
        />
      </div>
    </div>
  )}
</div>

            </div>
          )}

          {objetoAtual?.tipo === "CAMPO" && (
  <div className="space-y-4">
    <div>
      <label className="mb-2 block font-semibold">
        Campo dinâmico
      </label>

      <select
        value={objetoAtual.campo}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            campo: e.target.value,
          })
        }
        className="phanyx-crachas-input"
      >
        <option value="{{alunoNome}}">Aluno - Nome</option>
        <option value="{{alunoMatricula}}">Aluno - Matrícula</option>
        <option value="{{cursoNome}}">Aluno - Curso</option>
        <option value="{{turmaNome}}">Aluno - Turma</option>
        <option value="{{funcionarioNome}}">Funcionário - Nome</option>
        <option value="{{funcionarioCargo}}">Funcionário - Cargo</option>
        <option value="{{funcionarioDepartamento}}">
          Funcionário - Departamento
        </option>
        <option value="{{professorNome}}">Professor - Nome</option>
        <option value="{{instituicaoNome}}">Instituição - Nome</option>
      </select>
    </div>

    <div>
      <label className="mb-2 block font-semibold">
        Tamanho
      </label>

      <input
        type="number"
        value={objetoAtual.fonte}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            fonte: Number(e.target.value),
          })
        }
        className="phanyx-crachas-input"
      />
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-2 block font-semibold">
          X
        </label>

        <input
          type="number"
          value={Math.round(objetoAtual.x)}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              x: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-2 block font-semibold">
          Y
        </label>

        <input
          type="number"
          value={Math.round(objetoAtual.y)}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              y: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-2 block font-semibold">
          Largura
        </label>

        <input
          type="number"
          value={objetoAtual.largura}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              largura: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-2 block font-semibold">
          Altura
        </label>

        <input
          type="number"
          value={objetoAtual.altura}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              altura: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>
    </div>

    <div>
      <label className="mb-2 block font-semibold">
        Cor
      </label>

      <input
        type="color"
        value={objetoAtual.cor}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            cor: e.target.value,
          })
        }
        className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
      />
    </div>
  </div>
          )}

          {objetoAtual?.tipo === "IMAGEM" && (
  <div className="space-y-4">
    <div>
      <label className="mb-2 block font-semibold">
        Tipo de imagem
      </label>
<div>
  <label className="mb-2 block font-semibold">
    Encaixe da imagem
  </label>

  <select
    value={objetoAtual.ajusteImagem}
    onChange={(e) =>
      atualizarObjeto(objetoAtual.id, {
        ajusteImagem: e.target.value as "cover" | "contain",
      })
    }
    className="phanyx-crachas-input"
  >
    <option value="cover">Preencher cortando</option>
    <option value="contain">Mostrar inteira</option>
  </select>
</div>
<div>
  <label className="mb-2 block font-semibold">
    Imagem
  </label>

  <button
    type="button"
    onClick={() => inputImagemObjetoRef.current?.click()}
    className="phanyx-crachas-button-secondary w-full"
  >
    Escolher imagem
  </button>

  <input
  ref={inputImagemObjetoRef}
  type="file"
  accept="image/png,image/jpeg,image/webp"
  onChange={handleUploadImagemObjeto}
  className="hidden"
/>
</div>

      <select
        value={objetoAtual.origem}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            origem: e.target.value as "FOTO" | "LOGO" | "UPLOAD",
            rotulo:
              e.target.value === "FOTO"
                ? "Foto"
                : e.target.value === "LOGO"
                ? "Logo"
                : "Imagem",
          })
        }
        className="phanyx-crachas-input"
      >
        <option value="FOTO">Foto da pessoa</option>
        <option value="LOGO">Logo da instituição</option>
        <option value="UPLOAD">Imagem enviada</option>
      </select>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-2 block font-semibold">X</label>
        <input
          type="number"
          value={Math.round(objetoAtual.x)}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              x: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-2 block font-semibold">Y</label>
        <input
          type="number"
          value={Math.round(objetoAtual.y)}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              y: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-2 block text-xs font-semibold">
  Largura
</label>
        <input
          type="number"
          value={objetoAtual.largura}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              largura: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold">
  Altura
</label>
        <input
          type="number"
          value={objetoAtual.altura}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              altura: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>
    </div>

    <div>
      <label className="mb-2 block font-semibold">
        Arredondamento
      </label>

      <input
        type="number"
        value={objetoAtual.raioBorda}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            raioBorda: Number(e.target.value),
          })
        }
        className="phanyx-crachas-input"
      />
    </div>

<div className="rounded-2xl border border-slate-700/40 p-3">
  <label className="mb-3 flex items-center gap-2 font-semibold">
    <input
      type="checkbox"
      checked={!!objetoAtual.sombraAtiva}
      onChange={(e) =>
        atualizarObjeto(objetoAtual.id, {
          sombraAtiva: e.target.checked,
        })
      }
    />
    Sombra da imagem
  </label>

  {objetoAtual.sombraAtiva && (
    <div className="space-y-3">
      <div>
        <label className="mb-2 block text-xs font-semibold">
          Tipo de sombra
        </label>

        <select
          value={objetoAtual.sombraModo ?? "DROP"}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              sombraModo: e.target.value as "DROP" | "BOX",
            })
          }
          className="phanyx-crachas-input"
        >
          <option value="DROP">Contorno da imagem</option>
          <option value="BOX">Caixa retangular</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">X</label>
          <input
            type="number"
            value={objetoAtual.sombraX ?? 2}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraX: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Y</label>
          <input
            type="number"
            value={objetoAtual.sombraY ?? 2}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraY: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Blur</label>
          <input
            type="number"
            value={objetoAtual.sombraBlur ?? 6}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraBlur: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Cor da sombra
        </label>

        <input
          type="color"
          value={objetoAtual.sombraCor ?? "#000000"}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              sombraCor: e.target.value,
            })
          }
          className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
        />
      </div>
    </div>
  )}
</div>

  </div>
          )}

{objetoAtual?.tipo === "FORMA" && (
  <div className="space-y-4">
    <div className="rounded-2xl border border-slate-700/40 p-3">
      <p className="mb-3 text-sm font-bold">
        Forma
      </p>

      <select
  value={objetoAtual.forma}
  onChange={(e) => {
  const novaForma = e.target.value as Extract<
    ObjetoCracha,
    { tipo: "FORMA" }
  >["forma"];

  const estiloForma =
    objetoAtual.estilo || "SOMENTE_PREENCHIMENTO";

  const espessuraPadrao =
    estiloForma === "SOMENTE_PREENCHIMENTO" ? 0 : 3;

  const medidasPorForma: Record<
    Extract<ObjetoCracha, { tipo: "FORMA" }>["forma"],
    Partial<Extract<ObjetoCracha, { tipo: "FORMA" }>>
  > = {
    RETANGULO: {
      largura: 120,
      altura: 50,
      raioBorda: 12,
      espessuraBorda: espessuraPadrao,
    },

    PILULA: {
      largura: 140,
      altura: 44,
      raioBorda: 999,
      espessuraBorda: espessuraPadrao,
    },

    CIRCULO: {
      largura: 100,
      altura: 100,
      raioBorda: 999,
      espessuraBorda: espessuraPadrao,
    },

    OVAL: {
  largura: 120,
  altura: 170,
  raioBorda: 0,
  espessuraBorda: espessuraPadrao,
},

    LINHA: {
      largura: 120,
      altura: 6,
      raioBorda: 999,
      espessuraBorda: espessuraPadrao,
    },

    TRIANGULO: {
      largura: 120,
      altura: 90,
      raioBorda: 0,
      espessuraBorda: espessuraPadrao,
    },

    LOSANGO: {
      largura: 120,
      altura: 80,
      raioBorda: 0,
      espessuraBorda: espessuraPadrao,
    },

    PARALELOGRAMO: {
      largura: 140,
      altura: 60,
      raioBorda: 0,
      espessuraBorda: espessuraPadrao,
    },

    SETA_DIREITA: {
      largura: 140,
      altura: 60,
      raioBorda: 0,
      espessuraBorda: espessuraPadrao,
    },

    SETA_ESQUERDA: {
      largura: 140,
      altura: 60,
      raioBorda: 0,
      espessuraBorda: espessuraPadrao,
    },

    SETA_CIMA: {
      largura: 70,
      altura: 120,
      raioBorda: 0,
      espessuraBorda: espessuraPadrao,
    },

    SETA_BAIXO: {
      largura: 70,
      altura: 120,
      raioBorda: 0,
      espessuraBorda: espessuraPadrao,
    },

    SETA_DUPLA_HORIZONTAL: {
      largura: 150,
      altura: 60,
      raioBorda: 0,
      espessuraBorda: espessuraPadrao,
    },

    SETA_DUPLA_VERTICAL: {
      largura: 70,
      altura: 150,
      raioBorda: 0,
      espessuraBorda: espessuraPadrao,
    },

    ESTRELA: {
  largura: 140,
  altura: 140,
  raioBorda: 0,
  espessuraBorda: espessuraPadrao,
  pontas: 5,
  raioExterno: 46,
  raioInterno: 22,
},

FORMA_LIVRE: {
  largura: 140,
  altura: 120,
  raioBorda: 0,
  espessuraBorda: espessuraPadrao,
  pontosLivres: [
    { id: 1, x: 15, y: 15, tipo: "CANTO" },
    { id: 2, x: 85, y: 20, tipo: "CANTO" },
    { id: 3, x: 90, y: 80, tipo: "CANTO" },
    { id: 4, x: 50, y: 95, tipo: "CANTO" },
    { id: 5, x: 10, y: 75, tipo: "CANTO" },
  ],
  pontoLivreSelecionadoId: null,
},

POLIGONO: {
  largura: 140,
  altura: 140,
  raioBorda: 0,
  espessuraBorda: espessuraPadrao,
  lados: 6,
},

CRUZ: {
  largura: 130,
  altura: 130,
  raioBorda: 0,
  espessuraBorda: espessuraPadrao,

  cruzCentroX: 50,
  cruzCentroY: 50,
  cruzEspessuraVertical: 24,
  cruzEspessuraHorizontal: 24,
  cruzComprimentoHorizontal: 94,
  cruzComprimentoVertical: 94,
},

CORACAO: {
  largura: 130,
  altura: 120,
  raioBorda: 0,
  espessuraBorda: espessuraPadrao,
},

  };

  atualizarObjeto(objetoAtual.id, {
  forma: novaForma,
  ...medidasPorForma[novaForma],
});
}}
  className="phanyx-crachas-input"
>
  <option value="RETANGULO">Retângulo / faixa</option>
  <option value="PILULA">Pílula / etiqueta arredondada</option>
  <option value="CIRCULO">Círculo</option>
  <option value="OVAL">Oval</option>
  <option value="LINHA">Linha</option>
  <option value="TRIANGULO">Triângulo</option>
  <option value="LOSANGO">Losango</option>
  <option value="PARALELOGRAMO">Paralelogramo</option>
  <option value="SETA_DIREITA">Seta para direita</option>
  <option value="SETA_ESQUERDA">Seta para esquerda</option>
  <option value="SETA_CIMA">Seta para cima</option>
  <option value="SETA_BAIXO">Seta para baixo</option>
  <option value="SETA_DUPLA_HORIZONTAL">Seta dupla horizontal</option>
  <option value="SETA_DUPLA_VERTICAL">Seta dupla vertical</option>
  <option value="ESTRELA">Estrela</option>
  <option value="FORMA_LIVRE">Forma livre / recorte livre</option>
  <option value="POLIGONO">Polígono regular</option>
  <option value="CRUZ">Cruz</option>
  <option value="CORACAO">Coração</option>
  </select>

<div>
  <label className="mb-2 block font-semibold">
    Aparência
  </label>

  <select
    value={objetoAtual.estilo || "SOMENTE_PREENCHIMENTO"}
    onChange={(e) => {
      const novoEstilo = e.target.value as
        | "PREENCHIMENTO_CONTORNO"
        | "SOMENTE_PREENCHIMENTO"
        | "SOMENTE_CONTORNO";

      atualizarObjeto(objetoAtual.id, {
  estilo: novoEstilo,
  ...(novoEstilo !== "SOMENTE_PREENCHIMENTO" &&
  objetoAtual.espessuraBorda <= 0
    ? { espessuraBorda: 3 }
    : {}),
});
    }}
    className="phanyx-crachas-input"
  >
    <option value="PREENCHIMENTO_CONTORNO">
      Preenchimento + contorno
    </option>
    <option value="SOMENTE_PREENCHIMENTO">
      Só preenchimento
    </option>
    <option value="SOMENTE_CONTORNO">
      Só contorno
    </option>
  </select>
</div>
<div>
  <label className="mb-2 block font-semibold">
    Tipo de preenchimento
  </label>

  <select
    value={objetoAtual.preenchimentoTipo || "COR"}
    onChange={(e) =>
      atualizarObjeto(objetoAtual.id, {
        preenchimentoTipo: e.target.value as "COR" | "GRADIENTE",
      })
    }
    className="phanyx-crachas-input"
  >
    <option value="COR">Cor sólida</option>
    <option value="GRADIENTE">Gradiente</option>
  </select>

<div className="rounded-2xl border border-slate-700/40 p-3">
  <p className="mb-3 text-sm font-bold">
    Estilo da forma
  </p>

  <div className="grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={copiarEstiloForma}
      className="phanyx-crachas-button-secondary text-xs"
    >
      Copiar estilo
    </button>

    <button
      type="button"
      onClick={colarEstiloForma}
      disabled={!estiloFormaCopiado}
      className={`phanyx-crachas-button-secondary text-xs ${
        !estiloFormaCopiado ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      Aplicar estilo
    </button>
  </div>

  <p className="mt-2 text-[11px] text-slate-400">
    Copia cores, gradiente, borda, sombra, opacidade, arredondamento e rotação.
  </p>
</div>

</div>
    </div>

{(objetoAtual.preenchimentoTipo || "COR") === "GRADIENTE" && (
  <div className="rounded-2xl border border-slate-700/40 p-3">
    <p className="mb-3 text-sm font-bold">
      Gradiente
    </p>

<div>
  <label className="mb-2 block font-semibold">
    Tipo do gradiente
  </label>

  <select
    value={objetoAtual.gradienteTipo || "LINEAR"}
    onChange={(e) => {
      const novoTipo = e.target.value as GradienteTipoForma;

      atualizarObjeto(objetoAtual.id, {
        gradienteTipo: novoTipo,
        gradienteDirecao:
          novoTipo === "DIAGONAL"
            ? "DIAGONAL_DESC"
            : novoTipo === "LINEAR"
            ? "DIREITA"
            : objetoAtual.gradienteDirecao || "DIREITA",
      });
    }}
    className="phanyx-crachas-input"
  >
    <option value="LINEAR">Linear</option>
    <option value="DIAGONAL">Diagonal</option>
    <option value="RADIAL">Radial</option>
    <option value="ESFERICO">Esfera / brilho</option>
  </select>
</div>

    {(objetoAtual.gradienteTipo || "LINEAR") === "LINEAR" && (
  <div className="mt-3">
    <label className="mb-2 block font-semibold">
      Direção do gradiente
    </label>

    <select
      value={objetoAtual.gradienteDirecao || "DIREITA"}
      onChange={(e) =>
        atualizarObjeto(objetoAtual.id, {
          gradienteDirecao: e.target.value as GradienteDirecaoForma,
        })
      }
      className="phanyx-crachas-input"
    >
      <option value="DIREITA">Esquerda para direita</option>
      <option value="ESQUERDA">Direita para esquerda</option>
      <option value="BASE">Topo para base</option>
      <option value="TOPO">Base para topo</option>
    </select>
  </div>
)}

{(objetoAtual.gradienteTipo || "LINEAR") === "DIAGONAL" && (
  <div className="mt-3">
    <label className="mb-2 block font-semibold">
      Direção diagonal
    </label>

    <select
      value={objetoAtual.gradienteDirecao || "DIAGONAL_DESC"}
      onChange={(e) =>
        atualizarObjeto(objetoAtual.id, {
          gradienteDirecao: e.target.value as GradienteDirecaoForma,
        })
      }
      className="phanyx-crachas-input"
    >
      <option value="DIAGONAL_DESC">Diagonal descendo</option>
      <option value="DIAGONAL_ASC">Diagonal subindo</option>
    </select>
  </div>
)}

{["RADIAL", "ESFERICO"].includes(objetoAtual.gradienteTipo || "LINEAR") && (
  <div className="mt-3 space-y-3 rounded-xl border border-slate-700/40 p-3">
    <p className="text-sm font-bold">
      Controle do foco
    </p>

    <div>
      <label className="mb-2 block text-xs font-semibold">
        Foco horizontal: {objetoAtual.gradienteFocoX ?? 45}%
      </label>

      <input
        type="range"
        min={0}
        max={100}
        value={objetoAtual.gradienteFocoX ?? 45}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            gradienteFocoX: Number(e.target.value),
          })
        }
        className="w-full"
      />
    </div>

    <div>
      <label className="mb-2 block text-xs font-semibold">
        Foco vertical: {objetoAtual.gradienteFocoY ?? 35}%
      </label>

      <input
        type="range"
        min={0}
        max={100}
        value={objetoAtual.gradienteFocoY ?? 35}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            gradienteFocoY: Number(e.target.value),
          })
        }
        className="w-full"
      />
    </div>

    <div>
      <label className="mb-2 block text-xs font-semibold">
        Raio / abertura: {objetoAtual.gradienteRaio ?? 75}%
      </label>

      <input
        type="range"
        min={10}
        max={150}
        value={objetoAtual.gradienteRaio ?? 75}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            gradienteRaio: Number(e.target.value),
          })
        }
        className="w-full"
      />
    </div>
  </div>
)}

<div className="mt-4 rounded-xl border border-slate-700/40 p-3">
  <p className="mb-3 text-xs font-bold">
    Mover pontos do gradiente
  </p>

  <div
    className="relative h-10 rounded-full border border-slate-500"
    style={{
      background: cssPreviewGradienteForma(objetoAtual),
    }}
  >
    {pontosGradienteForma(objetoAtual).map((ponto) => (
      <button
        key={ponto.id}
        type="button"
        onMouseDown={(e) =>
          iniciarArrastoPontoGradiente(e, objetoAtual, ponto)
        }
        title={`Ponto ${ponto.posicao}%`}
        className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-lg ${
  pontoGradienteSelecionado === ponto.id
    ? "border-yellow-300 ring-4 ring-yellow-300/50"
    : "border-white ring-2 ring-slate-900"
}`}
        style={{
          left: `${ponto.posicao}%`,
          backgroundColor: ponto.cor,
          cursor: "grab",
        }}
      />
    ))}
  </div>

  <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400">
    <span>0%</span>
    <span>50%</span>
    <span>100%</span>
  </div>

<button
  type="button"
  onClick={() => {
    const pontosAtuais = pontosGradienteForma(objetoAtual);

    let maiorEspaco = 0;
    let novaPosicao = 50;

    for (let i = 0; i < pontosAtuais.length - 1; i++) {
      const atual = pontosAtuais[i];
      const proximo = pontosAtuais[i + 1];

      const espaco = proximo.posicao - atual.posicao;

      if (espaco > maiorEspaco) {
        maiorEspaco = espaco;
        novaPosicao = Math.round(atual.posicao + espaco / 2);
      }
    }

    atualizarObjeto(objetoAtual.id, {
      gradientePontos: [
        ...pontosAtuais,
        {
          id: Date.now(),
          cor: "#ffffff",
          posicao: novaPosicao,
        },
      ],
    });
  }}
  className="mt-3 w-full rounded-xl border border-blue-500/60 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/10"
>
  + Adicionar ponto de cor
</button>

</div>

    {pontoGradienteAtual(objetoAtual) && (
  <div className="mt-4 rounded-xl border border-slate-700/40 p-3">
    <p className="mb-3 text-sm font-bold">
      Ponto selecionado
    </p>

    <div>
      <label className="mb-2 block text-xs font-semibold">
        Cor do ponto
      </label>

      <input
        type="color"
        value={pontoGradienteAtual(objetoAtual).cor}
        onChange={(e) =>
          atualizarCorPontoGradiente(
            objetoAtual,
            pontoGradienteAtual(objetoAtual).id,
            e.target.value
          )
        }
        className="h-12 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
      />
    </div>

    <div className="mt-3">
      <label className="mb-2 block text-xs font-semibold">
        HEX
      </label>

      <input
        value={pontoGradienteAtual(objetoAtual).cor}
        onChange={(e) => {
          const valor = e.target.value;

          if (/^#[0-9A-Fa-f]{6}$/.test(valor)) {
            atualizarCorPontoGradiente(
              objetoAtual,
              pontoGradienteAtual(objetoAtual).id,
              valor
            );
          }
        }}
        className="phanyx-crachas-input"
        placeholder="#2563eb"
      />
    </div>

    <div className="mt-3 grid grid-cols-3 gap-2">
      {(["r", "g", "b"] as const).map((canal) => {
        const rgb = hexParaRgb(pontoGradienteAtual(objetoAtual).cor);

        return (
          <div key={canal}>
            <label className="mb-1 block text-xs font-semibold uppercase">
              {canal}
            </label>

            <input
              type="number"
              min={0}
              max={255}
              value={rgb[canal]}
              onChange={(e) => {
                const novoRgb = {
                  ...rgb,
                  [canal]: Number(e.target.value),
                };

                atualizarCorPontoGradiente(
                  objetoAtual,
                  pontoGradienteAtual(objetoAtual).id,
                  rgbParaHex(novoRgb.r, novoRgb.g, novoRgb.b)
                );
              }}
              className="phanyx-crachas-input"
            />
          </div>
        );
      })}
    </div>

    <div className="mt-3">
      <label className="mb-2 block text-xs font-semibold">
        Posição do ponto: {pontoGradienteAtual(objetoAtual).posicao}%
      </label>

      <input
        type="range"
        min={0}
        max={100}
        value={pontoGradienteAtual(objetoAtual).posicao}
        onChange={(e) =>
          atualizarPontoGradiente(
            objetoAtual.id,
            pontoGradienteAtual(objetoAtual).id,
            {
              posicao: Number(e.target.value),
            }
          )
        }
        className="w-full"
      />
    </div>

    {pontosGradienteForma(objetoAtual).length > 2 && (
      <button
        type="button"
        onClick={() => {
          const pontoAtual = pontoGradienteAtual(objetoAtual);

          const novosPontos = pontosGradienteForma(objetoAtual).filter(
            (item) => item.id !== pontoAtual.id
          );

          atualizarObjeto(objetoAtual.id, {
            gradientePontos: novosPontos,
          });

          setPontoGradienteSelecionado(novosPontos[0]?.id ?? null);
        }}
        className="mt-3 w-full rounded-xl border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10"
      >
        Remover ponto selecionado
      </button>
    )}
  </div>
)}

    <button
  type="button"
  onClick={() => {
    const pontosAtuais = pontosGradienteForma(objetoAtual);

    let maiorEspaco = 0;
    let novaPosicao = 50;

    for (let i = 0; i < pontosAtuais.length - 1; i++) {
      const atual = pontosAtuais[i];
      const proximo = pontosAtuais[i + 1];

      const espaco = proximo.posicao - atual.posicao;

      if (espaco > maiorEspaco) {
        maiorEspaco = espaco;
        novaPosicao = Math.round(atual.posicao + espaco / 2);
      }
    }

    const novoPonto = {
  id: Date.now(),
  cor: "#ffffff",
  posicao: novaPosicao,
};

atualizarObjeto(objetoAtual.id, {
  gradientePontos: [...pontosAtuais, novoPonto],
});

setPontoGradienteSelecionado(novoPonto.id);
  }}
  className="mt-4 w-full rounded-xl border border-blue-500/60 px-3 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/10"
>
  + Adicionar ponto de cor
</button>

  </div>
)}

{objetoAtual.forma === "ESTRELA" && (
  <div className="space-y-3 rounded-2xl border border-slate-700/40 p-3">
    <p className="text-sm font-bold">Configuração da estrela</p>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-2 block text-xs font-semibold">Pontas</label>
        <input
          type="number"
          min={3}
          max={20}
          value={objetoAtual.pontas ?? 5}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              pontas: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold">
          Raio externo
        </label>
        <input
          type="number"
          min={10}
          value={objetoAtual.raioExterno ?? 60}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              raioExterno: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>
    </div>

    <div>
      <label className="mb-2 block text-xs font-semibold">
        Diâmetro do centro
      </label>
      <input
        type="number"
        min={10}
        value={(objetoAtual.raioInterno ?? 28) * 2}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            raioInterno: Number(e.target.value) / 2,
          })
        }
        className="phanyx-crachas-input"
      />
    </div>

    <p className="text-xs text-slate-400">
      Dica: centro menor = pontas mais altas. Centro maior = pontas mais baixas.
    </p>
  </div>
)}

{objetoAtual.forma === "FORMA_LIVRE" && (
  <div className="space-y-3 rounded-2xl border border-slate-700/40 p-3">
    <p className="text-sm font-bold">
      Forma livre / recorte livre
    </p>

    <div className="rounded-xl border border-slate-700/40 p-3">
      <p className="mb-2 text-xs font-bold">
        Tipo do ponto selecionado
      </p>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => definirModoPontoLivre("CANTO")}
          className="phanyx-crachas-button-secondary text-[11px]"
        >
          Canto / reta
        </button>

        <button
          type="button"
          onClick={() => definirModoPontoLivre("SUAVE")}
          className="phanyx-crachas-button-secondary text-[11px]"
        >
          Curva suave
        </button>

        <button
          type="button"
          onClick={() => definirModoPontoLivre("LIVRE")}
          className="phanyx-crachas-button-secondary text-[11px]"
        >
          Curva livre
        </button>
      </div>

      <p className="mt-2 text-[11px] text-slate-400">
        Curva suave espelha as alças. Curva livre quebra a tangente e permite mover cada alça separadamente.
      </p>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={adicionarPontoLivreForma}
        className="phanyx-crachas-button-secondary text-xs"
      >
        + Adicionar ponto
      </button>

      <button
        type="button"
        onClick={removerPontosLivresSelecionados}
        className="phanyx-crachas-button-secondary text-xs"
      >
        Remover ponto
      </button>
    </div>

    <button
      type="button"
      onClick={subdividirPontosLivresSelecionados}
      className="phanyx-crachas-button-secondary w-full text-xs"
    >
      Subdividir pontos selecionados
    </button>

    <p className="text-xs text-slate-400">
      Clique em um ponto para mover. Use Shift ou Ctrl para selecionar vários.
      Dê dois cliques em um ponto para transformar em curva com alças.
    </p>
  </div>
)}

{objetoAtual.forma === "POLIGONO" && (
  <div className="space-y-3 rounded-2xl border border-slate-700/40 p-3">
    <p className="text-sm font-bold">
      Configuração do polígono
    </p>

    <div>
      <label className="mb-2 block text-xs font-semibold">
        Lados
      </label>

      <input
        type="number"
        min={3}
        max={20}
        value={objetoAtual.lados ?? 6}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            lados: Number(e.target.value),
          })
        }
        className="phanyx-crachas-input"
      />
    </div>

    <p className="text-[11px] text-slate-400">
      5 lados = pentágono. 6 lados = hexágono. 8 lados = octógono.
    </p>
  </div>
)}

{objetoAtual.forma === "CRUZ" && (
  <div className="space-y-3 rounded-2xl border border-slate-700/40 p-3">
    <p className="text-sm font-bold">
      Configuração da cruz
    </p>

    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="mb-1 block text-xs font-semibold">
          Vertical para esquerda/direita
        </label>

        <input
          type="number"
          min={15}
          max={85}
          value={objetoAtual.cruzCentroX ?? 50}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              cruzCentroX: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Horizontal para cima/baixo
        </label>

        <input
          type="number"
          min={15}
          max={85}
          value={objetoAtual.cruzCentroY ?? 50}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              cruzCentroY: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Grossura da parte vertical
        </label>

        <input
          type="number"
          min={6}
          max={70}
          value={objetoAtual.cruzEspessuraVertical ?? 24}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              cruzEspessuraVertical: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Grossura da parte horizontal
        </label>

        <input
          type="number"
          min={6}
          max={70}
          value={objetoAtual.cruzEspessuraHorizontal ?? 24}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              cruzEspessuraHorizontal: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Comprimento dos braços
        </label>

        <input
          type="number"
          min={20}
          max={400}
          value={objetoAtual.cruzComprimentoHorizontal ?? 94}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              cruzComprimentoHorizontal: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Comprimento vertical
        </label>

        <input
          type="number"
          min={20}
          max={400}
          value={objetoAtual.cruzComprimentoVertical ?? 94}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              cruzComprimentoVertical: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>
    </div>

    <p className="text-[11px] text-slate-500 dark:text-slate-400">
      Use os valores de 0 a 100 como proporção da área da cruz. 50 deixa centralizado.
    </p>
  </div>
)}

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-2 block text-xs font-semibold">X</label>
        <input
          type="number"
          value={Math.round(objetoAtual.x)}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              x: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold">Y</label>
        <input
          type="number"
          value={Math.round(objetoAtual.y)}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              y: Number(e.target.value),
            })
          }
          className="phanyx-crachas-input"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="mb-2 block text-xs font-semibold">Largura</label>
        <input
          type="number"
          value={objetoAtual.largura}
          onChange={(e) => {
  const valor = Number(e.target.value);

  if (objetoAtual.forma === "CIRCULO") {
    atualizarObjeto(objetoAtual.id, {
      largura: valor,
      altura: valor,
    });

    return;
  }

  atualizarObjeto(objetoAtual.id, {
    largura: valor,
  });
}}
          className="phanyx-crachas-input"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold">Altura</label>
        <input
          type="number"
          value={objetoAtual.altura}
          onChange={(e) => {
  const valor = Number(e.target.value);

  if (objetoAtual.forma === "CIRCULO") {
    atualizarObjeto(objetoAtual.id, {
      largura: valor,
      altura: valor,
    });

    return;
  }

  atualizarObjeto(objetoAtual.id, {
    altura: valor,
  });
}}
          className="phanyx-crachas-input"
        />
      </div>
    </div>

    <div>
      <label className="mb-2 block font-semibold">
        Cor de preenchimento
      </label>

<div className="rounded-2xl border border-slate-700/40 p-3">
  <label className="mb-2 block font-semibold">
    Rotação: {objetoAtual.rotacao ?? 0}°
  </label>

  <input
    type="range"
    min={-180}
    max={180}
    value={objetoAtual.rotacao ?? 0}
    onChange={(e) =>
      atualizarObjeto(objetoAtual.id, {
        rotacao: Number(e.target.value),
      })
    }
    className="w-full"
  />

  <div className="mt-3 grid grid-cols-2 gap-2">
    <input
      type="number"
      min={-360}
      max={360}
      value={objetoAtual.rotacao ?? 0}
      onChange={(e) =>
        atualizarObjeto(objetoAtual.id, {
          rotacao: Number(e.target.value),
        })
      }
      className="phanyx-crachas-input"
    />

    <button
      type="button"
      onClick={() =>
        atualizarObjeto(objetoAtual.id, {
          rotacao: 0,
        })
      }
      className="phanyx-crachas-button-secondary text-xs"
    >
      Zerar rotação
    </button>
  </div>
</div>

      <input
        type="color"
        value={objetoAtual.corFundo}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            corFundo: e.target.value,
          })
        }
        className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
      />
    </div>

    <div>
      <label className="mb-2 block font-semibold">
        Cor da borda
      </label>

      <input
  type="color"
  value={objetoAtual.corBorda}
  onChange={(e) =>
    atualizarObjeto(objetoAtual.id, {
      corBorda: e.target.value,
      estilo:
        objetoAtual.estilo === "SOMENTE_CONTORNO"
          ? "SOMENTE_CONTORNO"
          : "PREENCHIMENTO_CONTORNO",
      espessuraBorda:
        objetoAtual.espessuraBorda > 0
          ? objetoAtual.espessuraBorda
          : 3,
    })
  }
  className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
/>
    </div>

    <div>
      <label className="mb-2 block font-semibold">
        Espessura da borda
      </label>

<div>
  <label className="mb-2 block font-semibold">
    Acabamento da borda
  </label>

  <select
    value={objetoAtual.bordaAcabamento || "DURA"}
    onChange={(e) =>
      atualizarObjeto(objetoAtual.id, {
        bordaAcabamento: e.target.value as "DURA" | "FOSCA",
      })
    }
    className="phanyx-crachas-input"
  >
    <option value="DURA">Borda dura / nítida</option>
    <option value="FOSCA">Borda fosca / suave</option>
  </select>
</div>

{(objetoAtual.bordaAcabamento || "DURA") === "FOSCA" && (
  <div>
    <label className="mb-2 block font-semibold">
      Suavidade da borda
    </label>

    <input
      type="range"
      min={0}
      max={12}
      value={objetoAtual.bordaBlur ?? 3}
      onChange={(e) =>
        atualizarObjeto(objetoAtual.id, {
          bordaBlur: Number(e.target.value),
        })
      }
      className="w-full"
    />

    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
      {objetoAtual.bordaBlur ?? 3}px
    </p>
  </div>
)}

      <input
  type="number"
  min={0}
  value={objetoAtual.espessuraBorda}
  onChange={(e) => {
    const valor = Number(e.target.value);

    atualizarObjeto(objetoAtual.id, {
      espessuraBorda: valor,
      estilo:
        valor <= 0
          ? "SOMENTE_PREENCHIMENTO"
          : objetoAtual.estilo === "SOMENTE_CONTORNO"
          ? "SOMENTE_CONTORNO"
          : "PREENCHIMENTO_CONTORNO",
    });
  }}
  className="phanyx-crachas-input"
/>
    </div>

    <div>
      <label className="mb-2 block font-semibold">
        Arredondamento
      </label>

      <input
        type="number"
        value={objetoAtual.raioBorda}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            raioBorda: Number(e.target.value),
          })
        }
        className="phanyx-crachas-input"
      />
    </div>

    <div>
      <label className="mb-2 block font-semibold">
        Opacidade
      </label>

      <input
        type="range"
        min={0}
        max={100}
        value={objetoAtual.opacidade}
        onChange={(e) =>
          atualizarObjeto(objetoAtual.id, {
            opacidade: Number(e.target.value),
          })
        }
        className="w-full"
      />

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
        {objetoAtual.opacidade}%
      </p>
    </div>

<div className="rounded-2xl border border-slate-700/40 p-3">
  <label className="mb-3 flex items-center gap-2 font-semibold">
    <input
      type="checkbox"
      checked={!!objetoAtual.sombraAtiva}
      onChange={(e) =>
        atualizarObjeto(objetoAtual.id, {
          sombraAtiva: e.target.checked,
        })
      }
    />
    Sombra da forma
  </label>

  {objetoAtual.sombraAtiva && (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">
            X
          </label>

          <input
            type="number"
            value={objetoAtual.sombraX ?? 4}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraX: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Y
          </label>

          <input
            type="number"
            value={objetoAtual.sombraY ?? 4}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraY: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Blur
          </label>

          <input
            type="number"
            value={objetoAtual.sombraBlur ?? 10}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                sombraBlur: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold">
          Cor da sombra
        </label>

        <input
          type="color"
          value={objetoAtual.sombraCor ?? "#000000"}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              sombraCor: e.target.value,
            })
          }
          className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
        />
      </div>
    </div>
  )}
</div>

  </div>
)}

{objetoAtual?.tipo === "QRCODE" && (
  <div className="space-y-4">
    <div className="rounded-2xl border border-slate-700/40 p-3">
      <p className="mb-3 text-sm font-bold">
        QR Code
      </p>

      <div>
        <label className="mb-2 block text-xs font-semibold">
          Conteúdo do QR Code
        </label>

        <textarea
          value={objetoAtual.valor}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              valor: e.target.value,
            })
          }
          rows={4}
          className="phanyx-crachas-input min-h-[90px]"
        />

        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Recomendado: usar o link seguro de validação com {"{{codigoCracha}}"}.
        </p>
      </div>
    </div>

    <div className="rounded-2xl border border-slate-700/40 p-3">
      <p className="mb-3 text-sm font-bold">
        Aparência do QR Code
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold">
            Cor do QR
          </label>

          <input
            type="color"
            value={objetoAtual.cor}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                cor: e.target.value,
              })
            }
            className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Cor do fundo
          </label>

          <input
            type="color"
            value={objetoAtual.corFundo}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                corFundo: e.target.value,
              })
            }
            className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs font-semibold">
        <input
          type="checkbox"
          checked={objetoAtual.mostrarFundo}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              mostrarFundo: e.target.checked,
            })
          }
        />
        Mostrar fundo branco/colorido
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold">
            Margem interna
          </label>

          <input
            type="number"
            min={0}
            max={30}
            value={objetoAtual.margem}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                margem: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Arredondamento
          </label>

          <input
            type="number"
            min={0}
            max={40}
            value={objetoAtual.raioBorda}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                raioBorda: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-slate-700/40 p-3">
      <p className="mb-3 text-sm font-bold">
        Posição e tamanho
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold">X</label>
          <input
            type="number"
            value={Math.round(objetoAtual.x)}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                x: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Y</label>
          <input
            type="number"
            value={Math.round(objetoAtual.y)}
            onChange={(e) =>
              atualizarObjeto(objetoAtual.id, {
                y: Number(e.target.value),
              })
            }
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Largura
          </label>
          <input
            type="number"
            min={40}
            value={Math.round(objetoAtual.largura)}
            onChange={(e) => {
              const tamanho = Number(e.target.value);

              atualizarObjeto(objetoAtual.id, {
                largura: tamanho,
                altura: tamanho,
              });
            }}
            className="phanyx-crachas-input"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">
            Altura
          </label>
          <input
            type="number"
            min={40}
            value={Math.round(objetoAtual.altura)}
            onChange={(e) => {
              const tamanho = Number(e.target.value);

              atualizarObjeto(objetoAtual.id, {
                largura: tamanho,
                altura: tamanho,
              });
            }}
            className="phanyx-crachas-input"
          />
        </div>
      </div>
    </div>

    <div className="rounded-2xl border border-slate-700/40 p-3">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={!!objetoAtual.sombraAtiva}
          onChange={(e) =>
            atualizarObjeto(objetoAtual.id, {
              sombraAtiva: e.target.checked,
            })
          }
        />
        Sombra do QR Code
      </label>

      {objetoAtual.sombraAtiva && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">X</label>
              <input
                type="number"
                value={objetoAtual.sombraX ?? 2}
                onChange={(e) =>
                  atualizarObjeto(objetoAtual.id, {
                    sombraX: Number(e.target.value),
                  })
                }
                className="phanyx-crachas-input"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Y</label>
              <input
                type="number"
                value={objetoAtual.sombraY ?? 2}
                onChange={(e) =>
                  atualizarObjeto(objetoAtual.id, {
                    sombraY: Number(e.target.value),
                  })
                }
                className="phanyx-crachas-input"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">
                Blur
              </label>
              <input
                type="number"
                value={objetoAtual.sombraBlur ?? 6}
                onChange={(e) =>
                  atualizarObjeto(objetoAtual.id, {
                    sombraBlur: Number(e.target.value),
                  })
                }
                className="phanyx-crachas-input"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold">
              Cor da sombra
            </label>

            <input
              type="color"
              value={objetoAtual.sombraCor ?? "#000000"}
              onChange={(e) =>
                atualizarObjeto(objetoAtual.id, {
                  sombraCor: e.target.value,
                })
              }
              className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </div>
      )}
    </div>
  </div>
)}

          <div className="mt-6">
            <label className="mb-2 block font-semibold">
              Formato
            </label>

            <select
              value={formato}
              onChange={(e) =>
                setFormato(e.target.value as any)
              }
              className="phanyx-crachas-input"
            >
              <option value="RETRATO">Retrato</option>
              <option value="PAISAGEM">Paisagem</option>
              <option value="QUADRADO">Quadrado</option>
              <option value="REDONDO">Redondo</option>
              <option value="PERSONALIZADO">
                Personalizado
              </option>
            </select>
          </div>

<div className="mt-6">
  <label className="mb-2 block font-semibold">
    Furo / encaixe do crachá
  </label>

  <select
    value={tipoFuroCracha}
    onChange={(e) =>
      setTipoFuroCracha(e.target.value as TipoFuroCracha)
    }
    className="phanyx-crachas-input"
  >
    <option value="SEM_FURO">Sem furo</option>
    <option value="RASGO_HORIZONTAL">Rasgo horizontal superior</option>
    <option value="RASGO_VERTICAL">Rasgo vertical lateral</option>
    <option value="FURO_REDONDO">Furo redondo superior</option>
    <option value="FURO_DUPLO">Dois furos superiores</option>
  </select>

  <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
    Simulação visual do local do cordão, presilha ou clip do crachá.
  </p>
</div>

          <div className="mt-6">
            <label className="mb-2 block font-semibold">
              Cor de fundo
            </label>

            <input
              type="color"
              value={corFundoCracha}
              onChange={(e) => setCorFundoCracha(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </div>
      </div>
    </div>
  );
}