"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import JsBarcode from "jsbarcode";
import { ErroPreparacaoLogo, prepararLogoParaUpload } from "@/lib/imagens/preparar-logo-upload";

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
    grupoId?: number;
    tipo: "TEXTO";
    texto: string;
    x: number;
    y: number;
    fonte: number;
    fonteFamilia?: string;
    cor: string;
    alinhamento: "left" | "center" | "right";
    largura: number;
    altura: number;
    rotacao?: number;
    sombraAtiva?: boolean;
    sombraX?: number;
    sombraY?: number;
    sombraBlur?: number;
    sombraCor?: string;
    ordem: number;
  }
  | {
    id: number;
    grupoId?: number;
    tipo: "CAMPO";
    campo: string;
    rotulo: string;
    x: number;
    y: number;
    fonte: number;
    fonteFamilia?: string;
    cor: string;
    alinhamento: "left" | "center" | "right";
    largura: number;
    altura: number;

    rotacao?: number;

    sombraAtiva?: boolean;
    sombraX?: number;
    sombraY?: number;
    sombraBlur?: number;
    sombraCor?: string;

    ordem: number;
  }
  | {
    id: number;
    grupoId?: number;
    tipo: "IMAGEM";
    origem: "FOTO" | "LOGO" | "UPLOAD";
    rotulo: string;
    url?: string;
    x: number;
    y: number;
    largura: number;
    altura: number;
    rotacao?: number;
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
    grupoId?: number;
    tipo: "QRCODE";
    valor: string;
    x: number;
    y: number;
    largura: number;
    altura: number;
    rotacao?: number;
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
    grupoId?: number;
    tipo: "CODIGO_BARRAS";
    valor: string;
    rotulo: string;
    x: number;
    y: number;
    largura: number;
    altura: number;
    rotacao?: number;
    cor: string;
    corFundo: string;
    mostrarFundo: boolean;
    mostrarTexto: boolean;
    raioBorda: number;
    ordem: number;
    sombraAtiva?: boolean;
    sombraX?: number;
    sombraY?: number;
    sombraBlur?: number;
    sombraCor?: string;
  }
  | {
    id: number;
    grupoId?: number;
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
    arredondamentoPontas?: number;
    arredondamentoReentrancias?: number;
    circularidadePontas?: number;
    circularidadeReentrancias?: number;
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

type TipoModeloCracha =
  | "ALUNO"
  | "PROFESSOR"
  | "FUNCIONARIO"
  | "VISITANTE"
  | "MEMBRO"
  | "PERSONALIZADO";

type TipoFundoCracha = "SOLIDO" | "GRADIENTE";

type PontoGradienteCracha = {
  id: number;
  cor: string;
  posicao: number;
};

type DirecaoGradienteCracha =
  | "VERTICAL"
  | "HORIZONTAL"
  | "DIAGONAL_DESC"
  | "DIAGONAL_ASC"
  | "CIRCULAR";

type ModoEmissaoCracha = "INDIVIDUAL" | "LOTE";

type OpcaoLoteCracha = {
  valor: string;
  rotulo: string;
};

type PessoaEmissaoCracha = {
  id: number;
  tipo: string;
  nome: string;
  descricao?: string;
  fotoPerfil?: string | null;
  aptoParaCracha?: boolean;
};

type ResumoEmissaoCracha = {
  total: number;
  aptos: number;
  pendentesFoto: number;
};

type ModeloCrachaSalvo = {
  id: number;
  nome: string;
  tipoPessoa: TipoModeloCracha;
  formato?: string;
  tipoFuro?: TipoFuroCracha;
  padrao?: boolean;
  ativo?: boolean;

  tipoFundoFrente?: TipoFundoCracha;
  corFundoFrente?: string;
  corFundoFrenteSecundaria?: string | null;
  direcaoGradienteFrente?: DirecaoGradienteCracha;
  gradientePontosFundoFrente?: PontoGradienteCracha[];

  tipoFundoVerso?: TipoFundoCracha;
  corFundoVerso?: string;
  corFundoVersoSecundaria?: string | null;
  direcaoGradienteVerso?: DirecaoGradienteCracha;
  gradientePontosFundoVerso?: PontoGradienteCracha[];

  frenteJson?: ObjetoCracha[];
  versoJson?: ObjetoCracha[];

  criadoEm?: string;
  atualizadoEm?: string;
};

const FONTES_WINDOWS = [
  "Arial",
  "Arial Black",
  "Aptos",
  "Aptos Display",
  "Aptos Mono",
  "Aptos Serif",
  "Bahnschrift",
  "Calibri",
  "Calibri Light",
  "Cambria",
  "Cambria Math",
  "Candara",
  "Comic Sans MS",
  "Consolas",
  "Constantia",
  "Corbel",
  "Courier New",
  "Ebrima",
  "Franklin Gothic Medium",
  "Gabriola",
  "Gadugi",
  "Georgia",
  "Impact",
  "Ink Free",
  "Javanese Text",
  "Leelawadee UI",
  "Lucida Console",
  "Lucida Sans Unicode",
  "Malgun Gothic",
  "Microsoft Himalaya",
  "Microsoft JhengHei",
  "Microsoft New Tai Lue",
  "Microsoft PhagsPa",
  "Microsoft Sans Serif",
  "Microsoft Tai Le",
  "Microsoft YaHei",
  "Microsoft Yi Baiti",
  "MingLiU-ExtB",
  "Mongolian Baiti",
  "MS Gothic",
  "MS PGothic",
  "MS UI Gothic",
  "MV Boli",
  "Myanmar Text",
  "Nirmala UI",
  "Palatino Linotype",
  "Segoe MDL2 Assets",
  "Segoe Print",
  "Segoe Script",
  "Segoe UI",
  "Segoe UI Black",
  "Segoe UI Emoji",
  "Segoe UI Historic",
  "Segoe UI Light",
  "Segoe UI Semibold",
  "Segoe UI Symbol",
  "SimSun",
  "Sitka Text",
  "Sylfaen",
  "Symbol",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "Webdings",
  "Wingdings",
  "Yu Gothic",
] as const;

function fonteCssCracha(fonteFamilia?: string) {
  return `"${fonteFamilia || "Arial"}", Arial, sans-serif`;
}

function CodigoBarrasPreview({
  valor,
  cor,
  corFundo,
  mostrarFundo,
  mostrarTexto,
  altura,
}: {
  valor: string;
  cor: string;
  corFundo: string;
  mostrarFundo: boolean;
  mostrarTexto: boolean;
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

      JsBarcode(svgRef.current, valor || "PHANYX", {
        format: "CODE128",
        lineColor: cor || "#000000",
        background: mostrarFundo ? corFundo || "#ffffff" : "transparent",
        width: 2,
        height: alturaBarras,
        displayValue: mostrarTexto,
        margin: 0,
        fontSize: 12,
      });
    } catch (error) {
      console.error("Erro ao gerar código de barras:", error);
    }
  }, [valor, cor, corFundo, mostrarFundo, mostrarTexto, altura]);

  return (
    <svg
      ref={svgRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}

export default function CrachasClient() {
  const t = useTranslations("AdminBadges");
  const [lado, setLado] = useState<"FRENTE" | "VERSO">("FRENTE");

  const [formato, setFormato] = useState<
    "RETRATO" | "PAISAGEM" | "QUADRADO" | "REDONDO" | "PERSONALIZADO"
  >("RETRATO");

  const [corFundoFrente, setCorFundoFrente] =
    useState<string>("#ffffff");

  const [tipoFundoFrente, setTipoFundoFrente] =
    useState<TipoFundoCracha>("SOLIDO");

  const [corFundoFrenteSecundaria, setCorFundoFrenteSecundaria] =
    useState<string>("#0f172a");

  const [direcaoGradienteFrente, setDirecaoGradienteFrente] =
    useState<DirecaoGradienteCracha>("VERTICAL");

  const [gradientePontosFundoFrente, setGradientePontosFundoFrente] =
    useState<PontoGradienteCracha[]>([
      { id: 1, cor: "#012a32", posicao: 0 },
      { id: 2, cor: "#0f172a", posicao: 100 },
    ]);

  const [tipoFuroCracha, setTipoFuroCracha] =
    useState<TipoFuroCracha>("RASGO_HORIZONTAL");

  const [tipoModeloCracha, setTipoModeloCracha] =
    useState<TipoModeloCracha>("ALUNO");

  const [corFundoVerso, setCorFundoVerso] =
    useState<string>("#ffffff");

  const [tipoFundoVerso, setTipoFundoVerso] =
    useState<TipoFundoCracha>("SOLIDO");

  const [corFundoVersoSecundaria, setCorFundoVersoSecundaria] =
    useState<string>("#0f172a");

  const [direcaoGradienteVerso, setDirecaoGradienteVerso] =
    useState<DirecaoGradienteCracha>("VERTICAL");

  const [gradientePontosFundoVerso, setGradientePontosFundoVerso] =
    useState<PontoGradienteCracha[]>([
      { id: 1, cor: "#ffffff", posicao: 0 },
      { id: 2, cor: "#0f172a", posicao: 100 },
    ]);

  const [objetosFrente, setObjetosFrente] =
    useState<ObjetoCracha[]>([]);

  const [objetosVerso, setObjetosVerso] =
    useState<ObjetoCracha[]>([]);

  const [objetoSelecionado, setObjetoSelecionado] =
    useState<number | null>(null);

  const [objetosSelecionadosIds, setObjetosSelecionadosIds] =
    useState<number[]>([]);

  const [
    selecaoPorArea,
    setSelecaoPorArea,
  ] = useState<{
    ativo: boolean;
    x: number;
    y: number;
    largura: number;
    altura: number;
  }>({
    ativo: false,
    x: 0,
    y: 0,
    largura: 0,
    altura: 0,
  });

  const historicoObjetosRef =
    useRef<
      Map<
        string,
        ObjetoCracha[]
      >
    >(new Map());

  const alteracoesPendentesRef =
    useRef<
      Map<
        string,
        {
          estadoAnterior: ObjetoCracha;
          timer: ReturnType<
            typeof setTimeout
          >;
        }
      >
    >(new Map());

  const aplicandoUndoRef =
    useRef(false);

  const LIMITE_HISTORICO_OBJETO = 30;

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

  const [
    pontoGradienteFundoSelecionado,
    setPontoGradienteFundoSelecionado,
  ] = useState<number | null>(null);

  const [corGradienteFundoCopiada, setCorGradienteFundoCopiada] =
    useState<string | null>(null);

  const [estiloFormaCopiado, setEstiloFormaCopiado] =
    useState<
      Partial<
        Extract<
          ObjetoCracha,
          { tipo: "FORMA" }
        >
      > | null
    >(null);

  const [objetoCopiado, setObjetoCopiado] =
    useState<ObjetoCracha | null>(
      null
    );

  const inputImagemRef = useRef<HTMLInputElement | null>(null);
  const inputImagemObjetoRef = useRef<HTMLInputElement | null>(null);
  const versaoModeloImagemRef = useRef(0);
  const [enviandoImagem, setEnviandoImagem] = useState(false);

  const [avisoCracha, setAvisoCracha] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  const [modeloCrachaAtualId, setModeloCrachaAtualId] =
    useState<number | null>(null);

  type ModeloCrachaLista = {
    id: number;
    nome: string;
    tipoPessoa: TipoModeloCracha;
    padrao?: boolean;
  };

  const [nomeModeloCracha, setNomeModeloCracha] =
    useState(() => t("model.newModel"));

  const [modelosCracha, setModelosCracha] =
    useState<ModeloCrachaLista[]>([]);

  const [carregandoListaModelos, setCarregandoListaModelos] =
    useState(false);

  const [salvandoModeloCracha, setSalvandoModeloCracha] =
    useState(false);

  const [carregandoModeloCracha, setCarregandoModeloCracha] =
    useState(false);

  const [modelosSalvosCracha, setModelosSalvosCracha] =
    useState<ModeloCrachaSalvo[]>([]);

  const [carregandoModelosSalvos, setCarregandoModelosSalvos] =
    useState(false);

  const [modalEmissaoAberto, setModalEmissaoAberto] = useState(false);
  const [buscaPessoaEmissao, setBuscaPessoaEmissao] = useState("");

  const [modoEmissaoCracha, setModoEmissaoCracha] =
    useState<ModoEmissaoCracha>("INDIVIDUAL");

  const [filtroLoteEmissao, setFiltroLoteEmissao] = useState("");

  const [erroEmissaoCracha, setErroEmissaoCracha] = useState("");

  const [pessoaSelecionadaEmissao, setPessoaSelecionadaEmissao] =
    useState<PessoaEmissaoCracha | null>(null);

  const [pessoasEmissaoCracha, setPessoasEmissaoCracha] =
    useState<PessoaEmissaoCracha[]>([]);

  const [resumoEmissaoCracha, setResumoEmissaoCracha] =
    useState<ResumoEmissaoCracha | null>(null);

  const [carregandoPessoasEmissao, setCarregandoPessoasEmissao] =
    useState(false);

  const [emitindoCracha, setEmitindoCracha] = useState(false);

  const [ultimoCrachaEmitidoId, setUltimoCrachaEmitidoId] =
    useState<number | null>(null);

  type PlanoCracha =
    | "ESSENCIAL"
    | "PROFISSIONAL"
    | "ENTERPRISE";

  const [planoInstituicaoCracha, setPlanoInstituicaoCracha] =
    useState<PlanoCracha | null>(null);

  const [carregandoPlanoCracha, setCarregandoPlanoCracha] =
    useState(true);

  const [erroPlanoCracha, setErroPlanoCracha] =
    useState("");

  const podeUsarEditorCrachas =
    planoInstituicaoCracha === "PROFISSIONAL" ||
    planoInstituicaoCracha === "ENTERPRISE";

  const objetos =
    lado === "FRENTE" ? objetosFrente : objetosVerso;

  const setObjetos =
    lado === "FRENTE" ? setObjetosFrente : setObjetosVerso;

  const corFundoCracha =
    lado === "FRENTE" ? corFundoFrente : corFundoVerso;

  const setCorFundoCracha =
    lado === "FRENTE" ? setCorFundoFrente : setCorFundoVerso;

  const tipoFundoCracha =
    lado === "FRENTE" ? tipoFundoFrente : tipoFundoVerso;

  const setTipoFundoCracha =
    lado === "FRENTE" ? setTipoFundoFrente : setTipoFundoVerso;

  const corFundoCrachaSecundaria =
    lado === "FRENTE"
      ? corFundoFrenteSecundaria
      : corFundoVersoSecundaria;

  const setCorFundoCrachaSecundaria =
    lado === "FRENTE"
      ? setCorFundoFrenteSecundaria
      : setCorFundoVersoSecundaria;

  const direcaoGradienteCracha =
    lado === "FRENTE"
      ? direcaoGradienteFrente
      : direcaoGradienteVerso;

  const gradientePontosFundoCracha =
    lado === "FRENTE"
      ? gradientePontosFundoFrente
      : gradientePontosFundoVerso;

  function setPontosGradienteFundoCracha(
    atualizador:
      | PontoGradienteCracha[]
      | ((pontos: PontoGradienteCracha[]) => PontoGradienteCracha[])
  ) {
    if (lado === "FRENTE") {
      setGradientePontosFundoFrente(atualizador);
    } else {
      setGradientePontosFundoVerso(atualizador);
    }
  }

  const setDirecaoGradienteCracha =
    lado === "FRENTE"
      ? setDirecaoGradienteFrente
      : setDirecaoGradienteVerso;

  const objetoAtual = objetos.find((obj) => obj.id === objetoSelecionado);

  const crachaAreaRef = useRef<HTMLDivElement | null>(null);

  function idsDoGrupoDoObjeto(
    objetoId: number
  ) {
    const objeto =
      objetos.find(
        (item) =>
          item.id === objetoId
      );

    if (
      !objeto ||
      objeto.grupoId === undefined
    ) {
      return [objetoId];
    }

    return objetos
      .filter(
        (item) =>
          item.grupoId ===
          objeto.grupoId
      )
      .map(
        (item) =>
          item.id
      );
  }

  function caixaDoGrupoSelecionado() {
    if (!objetoAtual) {
      return null;
    }

    if (
      objetoAtual.grupoId ===
      undefined
    ) {
      return null;
    }

    const itensGrupo =
      objetos.filter(
        (item) =>
          item.grupoId ===
          objetoAtual.grupoId
      );

    if (
      itensGrupo.length < 2
    ) {
      return null;
    }

    const minX =
      Math.min(
        ...itensGrupo.map(
          (item) =>
            item.x
        )
      );

    const minY =
      Math.min(
        ...itensGrupo.map(
          (item) =>
            item.y
        )
      );

    const maxX =
      Math.max(
        ...itensGrupo.map(
          (item) =>
            item.x +
            item.largura
        )
      );

    const maxY =
      Math.max(
        ...itensGrupo.map(
          (item) =>
            item.y +
            item.altura
        )
      );

    return {
      x: minX,
      y: minY,
      largura:
        maxX - minX,
      altura:
        maxY - minY,
      grupoId:
        objetoAtual.grupoId,
      ids:
        itensGrupo.map(
          (item) =>
            item.id
        ),
    };
  }

  function iniciarRedimensionamentoGrupo(
    e: React.MouseEvent<HTMLSpanElement>,
    caixa: {
      x: number;
      y: number;
      largura: number;
      altura: number;
      grupoId: number;
      ids: number[];
    }
  ) {
    e.preventDefault();
    e.stopPropagation();

    const inicioMouseX =
      e.clientX;

    const inicioMouseY =
      e.clientY;

    const larguraOriginalGrupo =
      caixa.largura;

    const alturaOriginalGrupo =
      caixa.altura;

    const diagonalQuadrado =
      Math.max(
        1,
        larguraOriginalGrupo *
        larguraOriginalGrupo +
        alturaOriginalGrupo *
        alturaOriginalGrupo
      );

    const objetosOriginais =
      new Map<
        number,
        ObjetoCracha
      >();

    objetos.forEach(
      (item) => {
        if (
          caixa.ids.includes(
            item.id
          )
        ) {
          objetosOriginais.set(
            item.id,
            structuredClone(
              item
            )
          );
        }
      }
    );

    let houveAlteracao =
      false;

    function arredondar(
      valor: number
    ) {
      return (
        Math.round(
          valor * 100
        ) / 100
      );
    }

    function mover(
      ev: MouseEvent
    ) {
      const dx =
        ev.clientX -
        inicioMouseX;

      const dy =
        ev.clientY -
        inicioMouseY;

      /*
       * Projeta o movimento do mouse
       * sobre a diagonal original.
       *
       * Assim largura e altura crescem
       * proporcionalmente.
       */
      const vetorX =
        larguraOriginalGrupo +
        dx;

      const vetorY =
        alturaOriginalGrupo +
        dy;

      let escala =
        (
          vetorX *
          larguraOriginalGrupo +
          vetorY *
          alturaOriginalGrupo
        ) /
        diagonalQuadrado;

      /*
       * Evita inverter ou desaparecer
       * completamente o grupo.
       */
      escala =
        Math.max(
          0.1,
          Math.min(
            10,
            escala
          )
        );

      houveAlteracao =
        true;

      setObjetos(
        (atuais) =>
          atuais.map(
            (item) => {
              const original =
                objetosOriginais.get(
                  item.id
                );

              if (!original) {
                return item;
              }

              const novoX =
                caixa.x +
                (
                  original.x -
                  caixa.x
                ) *
                escala;

              const novoY =
                caixa.y +
                (
                  original.y -
                  caixa.y
                ) *
                escala;

              const novaLargura =
                Math.max(
                  4,
                  original.largura *
                  escala
                );

              const novaAltura =
                Math.max(
                  4,
                  original.altura *
                  escala
                );

              const base = {
                ...original,

                x:
                  arredondar(
                    novoX
                  ),

                y:
                  arredondar(
                    novoY
                  ),

                largura:
                  arredondar(
                    novaLargura
                  ),

                altura:
                  arredondar(
                    novaAltura
                  ),
              };

              /*
               * TEXTO
               */
              if (
                original.tipo ===
                "TEXTO"
              ) {
                return {
                  ...base,

                  fonte:
                    arredondar(
                      Math.max(
                        6,
                        original.fonte *
                        escala
                      )
                    ),

                  sombraX:
                    original.sombraX ===
                      undefined
                      ? undefined
                      : arredondar(
                        original.sombraX *
                        escala
                      ),

                  sombraY:
                    original.sombraY ===
                      undefined
                      ? undefined
                      : arredondar(
                        original.sombraY *
                        escala
                      ),

                  sombraBlur:
                    original.sombraBlur ===
                      undefined
                      ? undefined
                      : arredondar(
                        Math.max(
                          0,
                          original.sombraBlur *
                          escala
                        )
                      ),
                } as ObjetoCracha;
              }

              /*
               * CAMPO
               */
              if (
                original.tipo ===
                "CAMPO"
              ) {
                return {
                  ...base,

                  fonte:
                    arredondar(
                      Math.max(
                        6,
                        original.fonte *
                        escala
                      )
                    ),

                  sombraX:
                    original.sombraX ===
                      undefined
                      ? undefined
                      : arredondar(
                        original.sombraX *
                        escala
                      ),

                  sombraY:
                    original.sombraY ===
                      undefined
                      ? undefined
                      : arredondar(
                        original.sombraY *
                        escala
                      ),

                  sombraBlur:
                    original.sombraBlur ===
                      undefined
                      ? undefined
                      : arredondar(
                        Math.max(
                          0,
                          original.sombraBlur *
                          escala
                        )
                      ),
                } as ObjetoCracha;
              }

              /*
               * IMAGEM
               */
              if (
                original.tipo ===
                "IMAGEM"
              ) {
                return {
                  ...base,

                  raioBorda:
                    arredondar(
                      original.raioBorda *
                      escala
                    ),
                } as ObjetoCracha;
              }

              /*
               * QR CODE
               */
              if (
                original.tipo ===
                "QRCODE"
              ) {
                return {
                  ...base,

                  margem:
                    arredondar(
                      original.margem *
                      escala
                    ),

                  raioBorda:
                    arredondar(
                      original.raioBorda *
                      escala
                    ),
                } as ObjetoCracha;
              }

              /*
               * CÓDIGO DE BARRAS
               */
              if (
                original.tipo ===
                "CODIGO_BARRAS"
              ) {
                return {
                  ...base,

                  raioBorda:
                    arredondar(
                      original.raioBorda *
                      escala
                    ),
                } as ObjetoCracha;
              }

              /*
               * FORMA
               */
              if (
                original.tipo ===
                "FORMA"
              ) {
                return {
                  ...base,

                  espessuraBorda:
                    arredondar(
                      Math.max(
                        0,
                        original.espessuraBorda *
                        escala
                      )
                    ),

                  raioBorda:
                    arredondar(
                      Math.max(
                        0,
                        original.raioBorda *
                        escala
                      )
                    ),
                } as ObjetoCracha;
              }

              return base as ObjetoCracha;
            }
          )
      );
    }

    function soltar() {
      window.removeEventListener(
        "mousemove",
        mover
      );

      window.removeEventListener(
        "mouseup",
        soltar
      );

      /*
       * Guarda os estados anteriores
       * para o Ctrl + Z.
       */
      if (
        houveAlteracao
      ) {
        objetosOriginais.forEach(
          (original) => {
            registrarEstadoHistorico(
              lado,
              original
            );
          }
        );
      }
    }

    window.addEventListener(
      "mousemove",
      mover
    );

    window.addEventListener(
      "mouseup",
      soltar
    );
  }

  function iniciarRotacaoObjeto(
    e: React.MouseEvent<HTMLButtonElement>,
    objeto: ObjetoCracha
  ) {
    if (e.button !== 0) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const elemento =
      e.currentTarget.parentElement;

    if (!elemento) {
      return;
    }

    const rect =
      elemento.getBoundingClientRect();

    const centroX =
      rect.left +
      rect.width / 2;

    const centroY =
      rect.top +
      rect.height / 2;

    /*
     * Guarda o estado anterior
     * para Ctrl + Z.
     */
    registrarEstadoHistorico(
      lado,
      objeto
    );

    function normalizarAngulo(
      valor: number
    ) {
      let resultado =
        valor % 360;

      if (resultado > 180) {
        resultado -= 360;
      }

      if (resultado < -180) {
        resultado += 360;
      }

      return resultado;
    }

    function mover(
      ev: MouseEvent
    ) {
      const dx =
        ev.clientX -
        centroX;

      const dy =
        ev.clientY -
        centroY;

      /*
       * O +90 faz a posição de cima
       * corresponder a 0 graus.
       */
      let angulo =
        Math.atan2(
          dy,
          dx
        ) *
        (180 / Math.PI) +
        90;

      /*
       * Segurar Shift encaixa
       * de 15 em 15 graus.
       */
      if (ev.shiftKey) {
        angulo =
          Math.round(
            angulo / 15
          ) * 15;
      }

      angulo =
        normalizarAngulo(
          angulo
        );

      atualizarObjeto(
        objeto.id,
        {
          rotacao:
            Math.round(
              angulo * 10
            ) / 10,
        }
      );
    }

    function soltar() {
      window.removeEventListener(
        "mousemove",
        mover
      );

      window.removeEventListener(
        "mouseup",
        soltar
      );
    }

    window.addEventListener(
      "mousemove",
      mover
    );

    window.addEventListener(
      "mouseup",
      soltar
    );
  }

  function AlcaRotacaoObjeto({
    objeto,
  }: {
    objeto: ObjetoCracha;
  }) {
    if (
      !mostrarControlesIndividuais(
        objeto
      )
    ) {
      return null;
    }

    return (
      <>
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: -25,
            width: 2,
            height: 21,
            background:
              "#2563eb",
            transform:
              "translateX(-50%)",
            pointerEvents:
              "none",
            zIndex: 40,
          }}
        />

        <button
          type="button"
          onMouseDown={(e) =>
            iniciarRotacaoObjeto(
              e,
              objeto
            )
          }
          title={t("messages.rotateHint")}
          style={{
            position: "absolute",
            left: "50%",
            top: -39,

            width: 20,
            height: 20,

            transform:
              "translateX(-50%)",

            display: "flex",
            alignItems: "center",
            justifyContent:
              "center",

            borderRadius:
              9999,

            border:
              "2px solid #2563eb",

            background:
              "#ffffff",

            color:
              "#2563eb",

            fontSize: 13,
            fontWeight: 900,

            cursor: "grab",

            padding: 0,

            zIndex: 50,

            boxShadow:
              "0 1px 4px rgba(0,0,0,.25)",
          }}
        >
          ↻
        </button>
      </>
    );
  }

  function selecionarObjetoCracha(
    e: React.MouseEvent<HTMLElement>,
    objetoId: number
  ) {
    const idsRelacionados =
      idsDoGrupoDoObjeto(
        objetoId
      );

    if (e.shiftKey) {
      setObjetosSelecionadosIds(
        (atuais) => {
          const todosSelecionados =
            idsRelacionados.every(
              (id) =>
                atuais.includes(id)
            );

          const novosSelecionados =
            todosSelecionados
              ? atuais.filter(
                (id) =>
                  !idsRelacionados.includes(
                    id
                  )
              )
              : Array.from(
                new Set([
                  ...atuais,
                  ...idsRelacionados,
                ])
              );

          setObjetoSelecionado(
            objetoId
          );

          return novosSelecionados;
        }
      );

      return;
    }

    setObjetoSelecionado(
      objetoId
    );

    setObjetosSelecionadosIds(
      idsRelacionados
    );
  }

  function iniciarArrastoObjetoCracha(
    e: React.MouseEvent<HTMLDivElement>,
    objeto: ObjetoCracha
  ) {
    /*
     * Arrasto e seleção normal
     * somente com botão esquerdo.
     *
     * O botão direito deve chegar
     * intacto ao onContextMenu para
     * preservar a seleção múltipla.
     */
    if (e.button !== 0) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    selecionarObjetoCracha(
      e,
      objeto.id
    );
    const inicioX =
      e.clientX;

    const inicioY =
      e.clientY;

    const idsMovidos =
      idsDoGrupoDoObjeto(
        objeto.id
      );

    const posicoesOriginais =
      new Map<
        number,
        {
          x: number;
          y: number;
        }
      >();

    objetos.forEach(
      (item) => {
        if (
          idsMovidos.includes(
            item.id
          )
        ) {
          posicoesOriginais.set(
            item.id,
            {
              x: item.x,
              y: item.y,
            }
          );
        }
      }
    );

    function mover(
      ev: MouseEvent
    ) {
      const deslocamentoX =
        ev.clientX -
        inicioX;

      const deslocamentoY =
        ev.clientY -
        inicioY;

      setObjetos((atuais) =>
        atuais.map((item) => {
          const posicaoOriginal =
            posicoesOriginais.get(
              item.id
            );

          if (!posicaoOriginal) {
            return item;
          }

          return {
            ...item,
            x:
              posicaoOriginal.x +
              deslocamentoX,
            y:
              posicaoOriginal.y +
              deslocamentoY,
          } as ObjetoCracha;
        })
      );
    }

    function soltar() {
      window.removeEventListener(
        "mousemove",
        mover
      );

      window.removeEventListener(
        "mouseup",
        soltar
      );
    }

    window.addEventListener(
      "mousemove",
      mover
    );

    window.addEventListener(
      "mouseup",
      soltar
    );
  }

  function objetoEstaSelecionado(objetoId: number) {
    return (
      objetoSelecionado === objetoId || objetosSelecionadosIds.includes(objetoId)
    );
  }

  function objetoEstaEmGrupo(
    objeto: ObjetoCracha
  ) {
    if (
      objeto.grupoId ===
      undefined
    ) {
      return false;
    }

    return objetos.some(
      (item) =>
        item.id !== objeto.id &&
        item.grupoId ===
        objeto.grupoId
    );
  }

  function mostrarControlesIndividuais(
    objeto: ObjetoCracha
  ) {
    return (
      objetoEstaSelecionado(
        objeto.id
      ) &&
      !objetoEstaEmGrupo(
        objeto
      )
    );
  }

  function limparSelecaoCracha() {
    setObjetoSelecionado(null);
    setObjetosSelecionadosIds([]);
  }

  function iniciarSelecaoPorArea(
    e: React.MouseEvent<HTMLDivElement>
  ) {
    /*
     * Somente botão esquerdo.
     */
    if (e.button !== 0) {
      return;
    }

    const area =
      crachaAreaRef.current;

    if (!area) {
      return;
    }

    e.preventDefault();

    const rect =
      area.getBoundingClientRect();

    /*
     * Ponto inicial dentro do crachá.
     */
    const inicioX =
      Math.max(
        0,
        Math.min(
          rect.width,
          e.clientX -
          rect.left
        )
      );

    const inicioY =
      Math.max(
        0,
        Math.min(
          rect.height,
          e.clientY -
          rect.top
        )
      );

    /*
     * Shift permite acrescentar
     * elementos à seleção atual.
     */
    const selecaoAnterior =
      e.shiftKey
        ? [
          ...objetosSelecionadosIds,
        ]
        : [];

    let houveArrasto =
      false;

    function mover(
      ev: MouseEvent
    ) {
      const atualX =
        Math.max(
          0,
          Math.min(
            rect.width,
            ev.clientX -
            rect.left
          )
        );

      const atualY =
        Math.max(
          0,
          Math.min(
            rect.height,
            ev.clientY -
            rect.top
          )
        );

      const x =
        Math.min(
          inicioX,
          atualX
        );

      const y =
        Math.min(
          inicioY,
          atualY
        );

      const largura =
        Math.abs(
          atualX -
          inicioX
        );

      const altura =
        Math.abs(
          atualY -
          inicioY
        );

      if (
        largura > 3 ||
        altura > 3
      ) {
        houveArrasto =
          true;
      }

      setSelecaoPorArea({
        ativo:
          houveArrasto,
        x,
        y,
        largura,
        altura,
      });
    }

    function soltar(
      ev: MouseEvent
    ) {
      window.removeEventListener(
        "mousemove",
        mover
      );

      window.removeEventListener(
        "mouseup",
        soltar
      );

      const fimX =
        Math.max(
          0,
          Math.min(
            rect.width,
            ev.clientX -
            rect.left
          )
        );

      const fimY =
        Math.max(
          0,
          Math.min(
            rect.height,
            ev.clientY -
            rect.top
          )
        );

      const selecaoX =
        Math.min(
          inicioX,
          fimX
        );

      const selecaoY =
        Math.min(
          inicioY,
          fimY
        );

      const selecaoDireita =
        Math.max(
          inicioX,
          fimX
        );

      const selecaoBase =
        Math.max(
          inicioY,
          fimY
        );

      /*
       * Clique simples no vazio:
       * limpa a seleção.
       */
      if (!houveArrasto) {
        if (
          selecaoAnterior.length ===
          0
        ) {
          limparSelecaoCracha();
        }

        setSelecaoPorArea({
          ativo: false,
          x: 0,
          y: 0,
          largura: 0,
          altura: 0,
        });

        return;
      }

      /*
 * Entra na seleção quando o
 * retângulo arrastado tocar
 * qualquer parte do objeto.
 *
 * Isso é importante para objetos
 * sobrepostos, como texto sobre
 * uma forma.
 */
      const idsEncontrados =
        objetos
          .filter(
            (objeto) => {
              const esquerda =
                objeto.x;

              const topo =
                objeto.y;

              const direita =
                objeto.x +
                objeto.largura;

              const base =
                objeto.y +
                objeto.altura;

              /*
 * Seleciona quando houver
 * qualquer interseção entre
 * o objeto e a área arrastada.
 */
              return !(
                direita <
                selecaoX ||
                esquerda >
                selecaoDireita ||
                base <
                selecaoY ||
                topo >
                selecaoBase
              );
            }
          )
          .flatMap(
            (objeto) =>
              idsDoGrupoDoObjeto(
                objeto.id
              )
          );

      /*
       * Remove IDs repetidos.
       * Isso também faz grupos já
       * existentes serem selecionados
       * como uma unidade.
       */
      const novosIds =
        Array.from(
          new Set([
            ...selecaoAnterior,
            ...idsEncontrados,
          ])
        );

      setObjetosSelecionadosIds(
        novosIds
      );

      setObjetoSelecionado(
        novosIds.length > 0
          ? novosIds[
          novosIds.length -
          1
          ]
          : null
      );

      setSelecaoPorArea({
        ativo: false,
        x: 0,
        y: 0,
        largura: 0,
        altura: 0,
      });
    }

    window.addEventListener(
      "mousemove",
      mover
    );

    window.addEventListener(
      "mouseup",
      soltar
    );
  }

  function alinharObjetoSelecionadoComReferencia(
    modo: "centro-horizontal" | "centro-vertical" | "centro-total"
  ) {
    if (objetosSelecionadosIds.length < 2) {
      setAvisoCracha({
        tipo: "erro",
        texto:
          t("messages.alignSelectReference"),
      });

      setTimeout(() => setAvisoCracha(null), 4000);
      return;
    }

    const referenciaId = objetosSelecionadosIds[0];
    const alvoId = objetosSelecionadosIds[objetosSelecionadosIds.length - 1];

    if (referenciaId === alvoId) return;

    const referencia = objetos.find((obj) => obj.id === referenciaId);
    const alvo = objetos.find((obj) => obj.id === alvoId);

    if (!referencia || !alvo) return;

    const centroReferenciaX = referencia.x + referencia.largura / 2;
    const centroReferenciaY = referencia.y + referencia.altura / 2;

    const novosDados: Partial<ObjetoCracha> = {};

    if (modo === "centro-horizontal" || modo === "centro-total") {
      novosDados.x = Math.round(centroReferenciaX - alvo.largura / 2);
    }

    if (modo === "centro-vertical" || modo === "centro-total") {
      novosDados.y = Math.round(centroReferenciaY - alvo.altura / 2);
    }

    atualizarObjeto(alvo.id, novosDados);

    setAvisoCracha({
      tipo: "sucesso",
      texto: t("messages.alignedReference"),
    });

    setTimeout(() => setAvisoCracha(null), 2500);
  }

  function zIndexObjetoCracha(objeto: ObjetoCracha) {
    const objetosOrdenados = [...objetos].sort(
      (a, b) => (a.ordem || 0) - (b.ordem || 0)
    );

    const indice = objetosOrdenados.findIndex((item) => item.id === objeto.id);

    return indice >= 0 ? 10 + indice : 10;
  }

  type CampoCrachaDisponivel = {
    campo: string;
    rotulo: string;
  };

  function camposDisponiveisPorTipo(
    tipo: TipoModeloCracha
  ): CampoCrachaDisponivel[] {
    if (tipo === "ALUNO") {
      return [
        { campo: "{{alunoNome}}", rotulo: t("fields.studentName") },
        { campo: "{{alunoNomeSocial}}", rotulo: t("fields.studentSocialName") },
        { campo: "{{numeroMatricula}}", rotulo: t("fields.studentEnrollment") },
        { campo: "{{cursoNome}}", rotulo: t("fields.studentCourse") },
        { campo: "{{turmaNome}}", rotulo: t("fields.studentClass") },
        { campo: "{{semestre}}", rotulo: t("fields.studentSemester") },
        { campo: "{{modalidade}}", rotulo: t("fields.studentModality") },
        { campo: "{{poloNome}}", rotulo: t("fields.studentCampus") },
        { campo: "{{statusAluno}}", rotulo: t("fields.studentStatus") },
        { campo: "{{validadeCracha}}", rotulo: t("fields.badgeValidity") },
        { campo: "{{codigoCracha}}", rotulo: t("fields.badgeCode") },
      ];
    }

    if (tipo === "PROFESSOR") {
      return [
        { campo: "{{professorNome}}", rotulo: t("fields.teacherName") },
        { campo: "{{departamentoNome}}", rotulo: t("fields.teacherDepartment") },
        { campo: "{{disciplinasProfessor}}", rotulo: t("fields.teacherSubjects") },
        { campo: "{{statusProfessor}}", rotulo: t("fields.teacherStatus") },
        { campo: "{{validadeCracha}}", rotulo: t("fields.badgeValidity") },
        { campo: "{{codigoCracha}}", rotulo: t("fields.badgeCode") },
      ];
    }

    if (tipo === "FUNCIONARIO") {
      return [
        { campo: "{{funcionarioNome}}", rotulo: t("fields.employeeName") },
        { campo: "{{setor}}", rotulo: t("fields.employeeSector") },
        { campo: "{{cargo}}", rotulo: t("fields.employeeRole") },
        { campo: "{{codigoFuncionario}}", rotulo: t("fields.employeeCode") },
        { campo: "{{statusFuncionario}}", rotulo: t("fields.employeeStatus") },
        { campo: "{{validadeCracha}}", rotulo: t("fields.badgeValidity") },
        { campo: "{{codigoCracha}}", rotulo: t("fields.badgeCode") },
      ];
    }

    if (tipo === "VISITANTE") {
      return [
        { campo: "{{visitanteNome}}", rotulo: t("fields.visitorName") },
        { campo: "{{visitanteEmpresa}}", rotulo: t("fields.visitorCompany") },
        { campo: "{{visitanteDestino}}", rotulo: t("fields.visitorDestination") },
        { campo: "{{validadeCracha}}", rotulo: t("fields.badgeValidity") },
        { campo: "{{codigoCracha}}", rotulo: t("fields.badgeCode") },
      ];
    }

    if (tipo === "MEMBRO") {
      return [
        { campo: "{{membroNome}}", rotulo: t("fields.memberName") },
        { campo: "{{alaGrupo}}", rotulo: t("fields.memberWing") },
        { campo: "{{ministerio}}", rotulo: t("fields.memberMinistry") },
        { campo: "{{funcaoMinisterio}}", rotulo: t("fields.memberFunction") },
        { campo: "{{statusMembro}}", rotulo: t("fields.memberStatus") },
        { campo: "{{validadeCracha}}", rotulo: t("fields.badgeValidity") },
        { campo: "{{codigoCracha}}", rotulo: t("fields.badgeCode") },
      ];
    }

    return [
      { campo: "{{nome}}", rotulo: t("fields.customName") },
      { campo: "{{identificacao}}", rotulo: t("fields.customIdentification") },
      { campo: "{{categoria}}", rotulo: t("fields.customCategory") },
      { campo: "{{validadeCracha}}", rotulo: t("fields.badgeValidity") },
      { campo: "{{codigoCracha}}", rotulo: t("fields.badgeCode") },
    ];
  }

  function alterarTipoModeloCracha(novoTipo: TipoModeloCracha) {
    if (novoTipo !== tipoModeloCracha) versaoModeloImagemRef.current += 1;
    const camposDoNovoTipo = camposDisponiveisPorTipo(novoTipo);
    const campoPadrao = camposDoNovoTipo[0];

    let houveAjuste = false;

    setTipoModeloCracha(novoTipo);

    setObjetos((atual) =>
      atual.map((obj) => {
        if (obj.tipo !== "CAMPO") {
          return obj;
        }

        const campoAindaExiste = camposDoNovoTipo.some(
          (campo) => campo.campo === obj.campo
        );

        if (campoAindaExiste) {
          return obj;
        }

        houveAjuste = true;

        return {
          ...obj,
          campo: campoPadrao.campo,
          rotulo: campoPadrao.rotulo,
        };
      })
    );

    if (houveAjuste) {
      setAvisoCracha({
        tipo: "sucesso",
        texto: t("model.updatedFields"),
      });

      setTimeout(() => setAvisoCracha(null), 3000);
    }
  }

  function nomeTipoModeloCracha(tipo: TipoModeloCracha) {
    if (tipo === "ALUNO") return t("model.student");
    if (tipo === "PROFESSOR") return t("model.teacher");
    if (tipo === "FUNCIONARIO") return t("model.employee");
    if (tipo === "VISITANTE") return t("model.visitor");
    if (tipo === "MEMBRO") return t("model.member");
    return t("model.custom");
  }

  function medidasPadraoCracha(formatoAtual: string) {
    if (formatoAtual === "PAISAGEM") {
      return { larguraMm: 86, alturaMm: 54 };
    }

    if (formatoAtual === "QUADRADO") {
      return { larguraMm: 70, alturaMm: 70 };
    }

    if (formatoAtual === "REDONDO") {
      return { larguraMm: 60, alturaMm: 60 };
    }

    return { larguraMm: 54, alturaMm: 86 };
  }

  function aplicarModeloCrachaNaTela(modelo: ModeloCrachaSalvo) {
    limparHistoricoObjetos();
    setModeloCrachaAtualId(modelo.id);

    setNomeModeloCracha(
      modelo.nome ||
      t("model.defaultWithType", { type: nomeTipoModeloCracha(tipoModeloCracha) })
    );

    setFormato((modelo.formato || "RETRATO") as any);
    setTipoFuroCracha((modelo.tipoFuro || "RASGO_HORIZONTAL") as TipoFuroCracha);

    setObjetosFrente(
      Array.isArray(modelo.frenteJson)
        ? (modelo.frenteJson as ObjetoCracha[])
        : []
    );

    setObjetosVerso(
      Array.isArray(modelo.versoJson)
        ? (modelo.versoJson as ObjetoCracha[])
        : []
    );

    setTipoFundoFrente((modelo.tipoFundoFrente || "SOLIDO") as TipoFundoCracha);
    setCorFundoFrente(modelo.corFundoFrente || "#ffffff");
    setCorFundoFrenteSecundaria(modelo.corFundoFrenteSecundaria || "#0f172a");
    setDirecaoGradienteFrente(
      (modelo.direcaoGradienteFrente || "VERTICAL") as DirecaoGradienteCracha
    );

    setTipoFundoVerso((modelo.tipoFundoVerso || "SOLIDO") as TipoFundoCracha);
    setCorFundoVerso(modelo.corFundoVerso || "#ffffff");
    setCorFundoVersoSecundaria(modelo.corFundoVersoSecundaria || "#0f172a");
    setDirecaoGradienteVerso(
      (modelo.direcaoGradienteVerso || "VERTICAL") as DirecaoGradienteCracha
    );

    setGradientePontosFundoFrente(
      Array.isArray(modelo.gradientePontosFundoFrente)
        ? modelo.gradientePontosFundoFrente
        : [
          { id: 1, cor: modelo.corFundoFrente || "#ffffff", posicao: 0 },
          {
            id: 2,
            cor:
              modelo.corFundoFrenteSecundaria ||
              modelo.corFundoFrente ||
              "#0f172a",
            posicao: 100,
          },
        ]
    );

    setGradientePontosFundoVerso(
      Array.isArray(modelo.gradientePontosFundoVerso)
        ? modelo.gradientePontosFundoVerso
        : [
          { id: 1, cor: modelo.corFundoVerso || "#ffffff", posicao: 0 },
          {
            id: 2,
            cor:
              modelo.corFundoVersoSecundaria ||
              modelo.corFundoVerso ||
              "#0f172a",
            posicao: 100,
          },
        ]
    );

    setObjetoSelecionado(null);
    setLado("FRENTE");
  }

  async function carregarModeloPadraoCracha(tipo: TipoModeloCracha) {
    try {
      setCarregandoModeloCracha(true);

      const res = await fetch(
        `/api/admin/crachas/modelos?tipoPessoa=${tipo}&padrao=true`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(t("model.loadError"));
      }

      const modelo = Array.isArray(data.modelos) ? data.modelos[0] : null;

      if (!modelo) {
        setModeloCrachaAtualId(null);
        return;
      }

      setModeloCrachaAtualId(modelo.id);

      setNomeModeloCracha(
        modelo.nome ||
        t("model.defaultWithType", { type: nomeTipoModeloCracha(tipoModeloCracha) })
      );

      setFormato(modelo.formato || "RETRATO");
      setTipoFuroCracha(modelo.tipoFuro || "RASGO_HORIZONTAL");
      setCorFundoFrente(modelo.corFundoFrente || "#ffffff");
      setCorFundoVerso(modelo.corFundoVerso || "#ffffff");

      setObjetosFrente(
        Array.isArray(modelo.frenteJson)
          ? (modelo.frenteJson as ObjetoCracha[])
          : []
      );

      setObjetosVerso(
        Array.isArray(modelo.versoJson)
          ? (modelo.versoJson as ObjetoCracha[])
          : []
      );
      setTipoFundoFrente((modelo.tipoFundoFrente || "SOLIDO") as TipoFundoCracha);
      setCorFundoFrente(modelo.corFundoFrente || "#ffffff");
      setCorFundoFrenteSecundaria(modelo.corFundoFrenteSecundaria || "#0f172a");
      setDirecaoGradienteFrente(
        (modelo.direcaoGradienteFrente || "VERTICAL") as DirecaoGradienteCracha
      );

      setTipoFundoVerso((modelo.tipoFundoVerso || "SOLIDO") as TipoFundoCracha);
      setCorFundoVerso(modelo.corFundoVerso || "#ffffff");
      setCorFundoVersoSecundaria(modelo.corFundoVersoSecundaria || "#0f172a");
      setDirecaoGradienteVerso(
        (modelo.direcaoGradienteVerso || "VERTICAL") as DirecaoGradienteCracha
      );

      setGradientePontosFundoFrente(
        Array.isArray(modelo.gradientePontosFundoFrente)
          ? modelo.gradientePontosFundoFrente
          : [
            { id: 1, cor: modelo.corFundoFrente || "#ffffff", posicao: 0 },
            {
              id: 2,
              cor:
                modelo.corFundoFrenteSecundaria ||
                modelo.corFundoFrente ||
                "#0f172a",
              posicao: 100,
            },
          ]
      );

      setGradientePontosFundoVerso(
        Array.isArray(modelo.gradientePontosFundoVerso)
          ? modelo.gradientePontosFundoVerso
          : [
            { id: 1, cor: modelo.corFundoVerso || "#ffffff", posicao: 0 },
            {
              id: 2,
              cor:
                modelo.corFundoVersoSecundaria ||
                modelo.corFundoVerso ||
                "#0f172a",
              posicao: 100,
            },
          ]
      );

      setObjetoSelecionado(null);
    } catch (error) {
      console.error(error);

      setAvisoCracha({
        tipo: "erro",
        texto: t("model.loadError"),
      });

      setTimeout(() => setAvisoCracha(null), 4000);
    } finally {
      setCarregandoModeloCracha(false);
    }
  }

  async function carregarModelosSalvosCracha(tipo: TipoModeloCracha) {
    try {
      setCarregandoModelosSalvos(true);

      const res = await fetch(`/api/admin/crachas/modelos?tipoPessoa=${tipo}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(t("model.loadSavedError"));
      }

      const modelos = Array.isArray(data.modelos)
        ? (data.modelos as ModeloCrachaSalvo[])
        : [];

      setModelosSalvosCracha(modelos);

      const modeloAtual =
        modelos.find((modelo) => modelo.id === modeloCrachaAtualId) ||
        modelos.find((modelo) => modelo.padrao) ||
        modelos[0];

      if (modeloAtual) {
        aplicarModeloCrachaNaTela(modeloAtual);
      } else {
        setModeloCrachaAtualId(null);
        setObjetosFrente([]);
        setObjetosVerso([]);
        setObjetoSelecionado(null);
      }
    } catch (error) {
      console.error(error);

      setAvisoCracha({
        tipo: "erro",
        texto: t("model.loadSavedError"),
      });

      setTimeout(() => setAvisoCracha(null), 4000);
    } finally {
      setCarregandoModelosSalvos(false);
    }
  }

  async function carregarListaModelosCracha() {
    try {
      setCarregandoListaModelos(true);

      const res = await fetch(
        `/api/admin/crachas/modelos?tipoPessoa=${tipoModeloCracha}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          t("model.loadListError")
        );
      }

      setModelosCracha(
        Array.isArray(data?.modelos)
          ? data.modelos
          : []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar modelos:",
        error
      );
    } finally {
      setCarregandoListaModelos(false);
    }
  }

  async function salvarModeloCracha() {
    try {
      setSalvandoModeloCracha(true);
      setAvisoCracha(null);

      const medidas = medidasPadraoCracha(formato);

      const modeloSelecionado = modelosSalvosCracha.find(
        (modelo) => modelo.id === modeloCrachaAtualId
      );

      const salvandoNovoModelo = !modeloCrachaAtualId;

      const nomeModelo =
        nomeModeloCracha.trim() ||
        modeloSelecionado?.nome ||
        t("model.numberedName", { number: String(modelosSalvosCracha.length + 1).padStart(2, "0"), type: nomeTipoModeloCracha(tipoModeloCracha) });

      const deveSerPadrao =
        modelosSalvosCracha.length === 0
          ? true
          : modeloSelecionado?.padrao === true;

      const res = await fetch("/api/admin/crachas/modelos", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: salvandoNovoModelo ? undefined : modeloCrachaAtualId,
          nome: nomeModelo,
          tipoPessoa: tipoModeloCracha,
          formato,
          larguraMm: medidas.larguraMm,
          alturaMm: medidas.alturaMm,
          tipoFuro: tipoFuroCracha,

          tipoFundoFrente,
          corFundoFrente,
          corFundoFrenteSecundaria,
          direcaoGradienteFrente,
          gradientePontosFundoFrente,

          tipoFundoVerso,
          corFundoVerso,
          corFundoVersoSecundaria,
          direcaoGradienteVerso,
          gradientePontosFundoVerso,

          frenteJson: objetosFrente,
          versoJson: objetosVerso,
          padrao: deveSerPadrao,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(t("model.saveError"));
      }

      const modeloSalvo = data.modelo as ModeloCrachaSalvo;

      setModeloCrachaAtualId(modeloSalvo?.id || null);
      await carregarListaModelosCracha();

      await carregarModelosSalvosCracha(tipoModeloCracha);

      if (modeloSalvo) {
        aplicarModeloCrachaNaTela(modeloSalvo);
      }

      setAvisoCracha({
        tipo: "sucesso",
        texto: t("model.saved"),
      });

      setTimeout(() => setAvisoCracha(null), 4000);
    } catch (error: any) {
      console.error(error);

      setAvisoCracha({
        tipo: "erro",
        texto: t("model.saveError"),
      });

      setTimeout(() => setAvisoCracha(null), 5000);
    } finally {
      setSalvandoModeloCracha(false);
    }
  }

  async function carregarModeloCrachaPorId(
    modeloId: number
  ) {
    try {
      setCarregandoModeloCracha(true);
      setAvisoCracha(null);

      const res = await fetch(
        `/api/admin/crachas/modelos?id=${modeloId}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          t("model.loadError")
        );
      }

      const modelo =
        Array.isArray(data.modelos)
          ? data.modelos[0]
          : data.modelo;

      if (!modelo) {
        throw new Error(
          t("model.notFound")
        );
      }

      setModeloCrachaAtualId(modelo.id);
      setNomeModeloCracha(
        modelo.nome || t("model.unnamed")
      );

      setFormato(
        modelo.formato || "RETRATO"
      );

      setTipoFuroCracha(
        modelo.tipoFuro ||
        "RASGO_HORIZONTAL"
      );

      setObjetosFrente(
        Array.isArray(modelo.frenteJson)
          ? modelo.frenteJson
          : []
      );

      setObjetosVerso(
        Array.isArray(modelo.versoJson)
          ? modelo.versoJson
          : []
      );

      setTipoFundoFrente(
        modelo.tipoFundoFrente ||
        "SOLIDO"
      );

      setCorFundoFrente(
        modelo.corFundoFrente ||
        "#ffffff"
      );

      setCorFundoFrenteSecundaria(
        modelo.corFundoFrenteSecundaria ||
        "#0f172a"
      );

      setDirecaoGradienteFrente(
        modelo.direcaoGradienteFrente ||
        "VERTICAL"
      );

      setTipoFundoVerso(
        modelo.tipoFundoVerso ||
        "SOLIDO"
      );

      setCorFundoVerso(
        modelo.corFundoVerso ||
        "#ffffff"
      );

      setCorFundoVersoSecundaria(
        modelo.corFundoVersoSecundaria ||
        "#0f172a"
      );

      setDirecaoGradienteVerso(
        modelo.direcaoGradienteVerso ||
        "VERTICAL"
      );

      setObjetoSelecionado(null);
    } catch (error: any) {
      setAvisoCracha({
        tipo: "erro",
        texto:
          t("model.loadError"),
      });
    } finally {
      setCarregandoModeloCracha(false);
    }
  }

  async function excluirModeloCracha(
    modeloId: number
  ) {
    try {
      setAvisoCracha(null);

      const res = await fetch(
        `/api/admin/crachas/modelos?id=${modeloId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        throw new Error(
          t("model.deleteError")
        );
      }

      const eraModeloAtual =
        modeloCrachaAtualId === modeloId;

      /*
       * Remove imediatamente da interface,
       * sem esperar nova consulta.
       */
      setModelosSalvosCracha(
        (atuais) =>
          atuais.filter(
            (modelo) =>
              modelo.id !== modeloId
          )
      );

      setModelosCracha(
        (atuais) =>
          atuais.filter(
            (modelo) =>
              modelo.id !== modeloId
          )
      );

      if (eraModeloAtual) {
        /*
         * Limpa o modelo excluído da tela.
         */
        novoModeloCracha();
      }

      /*
       * Sincroniza novamente com o banco.
       *
       * Essa é a lista realmente usada
       * na barra dos modelos.
       */
      await carregarModelosSalvosCracha(
        tipoModeloCracha
      );

      await carregarListaModelosCracha();

      setAvisoCracha({
        tipo: "sucesso",
        texto:
          t("model.deleted"),
      });

      setTimeout(
        () => setAvisoCracha(null),
        4000
      );
    } catch (error: any) {
      setAvisoCracha({
        tipo: "erro",
        texto:
          t("model.deleteError"),
      });

      setTimeout(
        () => setAvisoCracha(null),
        5000
      );
    }
  }

  function novoModeloCracha() {
    limparHistoricoObjetos();
    setModeloCrachaAtualId(null);
    setNomeModeloCracha(t("model.newModel"));

    setLado("FRENTE");
    setObjetoSelecionado(null);

    setFormato("RETRATO");
    setTipoFuroCracha("RASGO_HORIZONTAL");

    setObjetosFrente([]);
    setObjetosVerso([]);

    setTipoFundoFrente("SOLIDO");
    setCorFundoFrente("#ffffff");
    setCorFundoFrenteSecundaria("#0f172a");
    setDirecaoGradienteFrente("VERTICAL");
    setGradientePontosFundoFrente([
      { id: 1, cor: "#ffffff", posicao: 0 },
      { id: 2, cor: "#0f172a", posicao: 100 },
    ]);

    setTipoFundoVerso("SOLIDO");
    setCorFundoVerso("#ffffff");
    setCorFundoVersoSecundaria("#0f172a");
    setDirecaoGradienteVerso("VERTICAL");
    setGradientePontosFundoVerso([
      { id: 1, cor: "#ffffff", posicao: 0 },
      { id: 2, cor: "#0f172a", posicao: 100 },
    ]);

    setAvisoCracha({
      tipo: "sucesso",
      texto:
        t("model.blankCreated"),
    });

    setTimeout(() => setAvisoCracha(null), 4000);
  }

  async function duplicarModeloCracha() {
    try {
      setSalvandoModeloCracha(true);
      setAvisoCracha(null);

      const medidas = medidasPadraoCracha(formato);

      const modeloSelecionado = modelosSalvosCracha.find(
        (modelo) => modelo.id === modeloCrachaAtualId
      );

      const nomeBase =
        modeloSelecionado?.nome ||
        t("model.baseWithType", { type: nomeTipoModeloCracha(tipoModeloCracha) });

      const res = await fetch("/api/admin/crachas/modelos", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: t("model.copyName", { name: nomeBase }),
          tipoPessoa: tipoModeloCracha,
          formato,
          larguraMm: medidas.larguraMm,
          alturaMm: medidas.alturaMm,
          tipoFuro: tipoFuroCracha,

          tipoFundoFrente,
          corFundoFrente,
          corFundoFrenteSecundaria,
          direcaoGradienteFrente,
          gradientePontosFundoFrente,

          tipoFundoVerso,
          corFundoVerso,
          corFundoVersoSecundaria,
          direcaoGradienteVerso,
          gradientePontosFundoVerso,

          frenteJson: objetosFrente,
          versoJson: objetosVerso,

          padrao: false,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(t("model.duplicateError"));
      }

      const modeloDuplicado = data.modelo as ModeloCrachaSalvo;

      setModeloCrachaAtualId(modeloDuplicado.id);

      await carregarModelosSalvosCracha(tipoModeloCracha);

      aplicarModeloCrachaNaTela(modeloDuplicado);

      setAvisoCracha({
        tipo: "sucesso",
        texto: t("model.duplicated"),
      });

      setTimeout(() => setAvisoCracha(null), 4000);
    } catch (error: any) {
      console.error(error);

      setAvisoCracha({
        tipo: "erro",
        texto: t("model.duplicateError"),
      });

      setTimeout(() => setAvisoCracha(null), 5000);
    } finally {
      setSalvandoModeloCracha(false);
    }
  }

  function placeholderBuscaEmissao(tipo: TipoModeloCracha) {
    if (tipo === "ALUNO") return t("search.student");
    if (tipo === "PROFESSOR") return t("search.teacher");
    if (tipo === "FUNCIONARIO") return t("search.employee");
    if (tipo === "VISITANTE") return t("search.visitor");
    if (tipo === "MEMBRO") return t("search.member");
    return t("search.custom");
  }

  function opcoesLotePorTipo(tipo: TipoModeloCracha): OpcaoLoteCracha[] {
    if (tipo === "ALUNO") {
      return [
        { valor: "TODOS_ALUNOS_ATIVOS", rotulo: t("batch.allStudents") },
        { valor: "POR_CURSO", rotulo: t("batch.byCourse") },
        { valor: "POR_TURMA", rotulo: t("batch.byClass") },
        { valor: "POR_SEMESTRE", rotulo: t("batch.bySemester") },
        { valor: "POR_POLO", rotulo: t("batch.byCampus") },
      ];
    }

    if (tipo === "PROFESSOR") {
      return [
        { valor: "TODOS_PROFESSORES_ATIVOS", rotulo: t("batch.allTeachers") },
        { valor: "POR_DEPARTAMENTO", rotulo: t("batch.byDepartment") },
        { valor: "POR_DISCIPLINA", rotulo: t("batch.bySubject") },
      ];
    }

    if (tipo === "FUNCIONARIO") {
      return [
        { valor: "TODOS_FUNCIONARIOS_ATIVOS", rotulo: t("batch.allEmployees") },
        { valor: "POR_SETOR", rotulo: t("batch.bySector") },
        { valor: "POR_CARGO", rotulo: t("batch.byRole") },
      ];
    }

    if (tipo === "MEMBRO") {
      return [
        { valor: "TODOS_MEMBROS_ATIVOS", rotulo: t("batch.allMembers") },
        { valor: "POR_MINISTERIO", rotulo: t("batch.byMinistry") },
        { valor: "POR_ALA_GRUPO", rotulo: t("batch.byWingGroup") },
      ];
    }

    if (tipo === "VISITANTE") {
      return [
        { valor: "POR_EVENTO", rotulo: t("batch.byEvent") },
        { valor: "VISITANTES_DO_DIA", rotulo: t("batch.visitorsToday") },
      ];
    }

    return [
      { valor: "TODOS", rotulo: t("batch.all") },
      { valor: "POR_CATEGORIA", rotulo: t("batch.byCategory") },
    ];
  }

  function abrirModalEmissaoCracha() {
    setBuscaPessoaEmissao("");
    setErroEmissaoCracha("");
    setAvisoCracha(null);
    setModoEmissaoCracha("INDIVIDUAL");
    setFiltroLoteEmissao("");
    setPessoaSelecionadaEmissao(null);
    setPessoasEmissaoCracha([]);
    setResumoEmissaoCracha(null);
    setModalEmissaoAberto(true);
  }

  function fecharModalEmissaoCracha(forcarFechamento = false) {
    if (emitindoCracha && !forcarFechamento) {
      return;
    }

    setModalEmissaoAberto(false);
    setBuscaPessoaEmissao("");
    setErroEmissaoCracha("");
    setFiltroLoteEmissao("");
    setPessoaSelecionadaEmissao(null);
    setPessoasEmissaoCracha([]);
    setResumoEmissaoCracha(null);
  }

  async function buscarPessoasParaEmissaoCracha() {
    try {
      setCarregandoPessoasEmissao(true);
      setErroEmissaoCracha("");
      setPessoaSelecionadaEmissao(null);
      setPessoasEmissaoCracha([]);
      setResumoEmissaoCracha(null);

      if (modoEmissaoCracha === "INDIVIDUAL" && !buscaPessoaEmissao.trim()) {
        setErroEmissaoCracha(t("issuance.searchBefore"));
        return;
      }

      if (modoEmissaoCracha === "LOTE" && !filtroLoteEmissao) {
        setErroEmissaoCracha(t("issuance.filterBeforePreview"));
        return;
      }

      const params = new URLSearchParams();

      params.set("tipo", tipoModeloCracha);
      params.set("modo", modoEmissaoCracha);

      if (modoEmissaoCracha === "LOTE") {
        params.set("limite", "1000");
      }

      if (buscaPessoaEmissao.trim()) {
        params.set("busca", buscaPessoaEmissao.trim());
      }

      if (filtroLoteEmissao) {
        params.set("filtro", filtroLoteEmissao);
      }

      const res = await fetch(`/api/admin/crachas/pessoas?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(t("issuance.searchPeopleError"));
      }

      setPessoasEmissaoCracha(Array.isArray(data.pessoas) ? data.pessoas : []);
      setResumoEmissaoCracha(data.resumo || null);

      if (!Array.isArray(data.pessoas) || data.pessoas.length === 0) {
        setErroEmissaoCracha(t("issuance.noneFound"));
      }
    } catch (error: any) {
      setErroEmissaoCracha(
        t("issuance.searchPeopleError")
      );
    } finally {
      setCarregandoPessoasEmissao(false);
    }
  }

  async function continuarEmissaoCracha() {
    if (emitindoCracha) return;

    setErroEmissaoCracha("");

    if (
      tipoModeloCracha === "MEMBRO" ||
      tipoModeloCracha === "PERSONALIZADO"
    ) {
      setErroEmissaoCracha(
        t("issuance.notAvailableType")
      );
      return;
    }

    if (modoEmissaoCracha === "INDIVIDUAL") {
      if (!pessoaSelecionadaEmissao) {
        setErroEmissaoCracha(
          t("issuance.selectPerson")
        );
        return;
      }

      if (!pessoaSelecionadaEmissao.aptoParaCracha) {
        setErroEmissaoCracha(
          t("issuance.missingPhoto")
        );
        return;
      }

      const abaPdf = window.open("", "_blank");

      try {
        setEmitindoCracha(true);

        const res = await fetch("/api/admin/crachas/emitir", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipoPessoa: tipoModeloCracha,
            pessoaId: pessoaSelecionadaEmissao.id,
            modeloId: modeloCrachaAtualId || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(t("issuance.issueError"));
        }

        const codigoCracha = data?.cracha?.codigoCracha
          ? String(data.cracha.codigoCracha)
          : "";

        const crachaEmitidoId = Number(data?.cracha?.id || 0);

        if (!crachaEmitidoId) {
          abaPdf?.close();

          throw new Error(
            t("issuance.issuedNoId")
          );
        }

        setUltimoCrachaEmitidoId(crachaEmitidoId);

        const urlPdf = `/api/admin/crachas/emitidos/${crachaEmitidoId}/pdf`;

        if (abaPdf) {
          abaPdf.location.href = urlPdf;
        } else {
          window.location.href = urlPdf;
        }

        const nomePessoa =
          data?.pessoa?.nome ||
          pessoaSelecionadaEmissao.nome ||
          t("issuance.selectedPerson");

        fecharModalEmissaoCracha(true);

        setAvisoCracha({
          tipo: "sucesso",
          texto: codigoCracha
            ? t("issuance.issuedWithCode", { name: nomePessoa, code: codigoCracha })
            : t("issuance.issued", { name: nomePessoa }),
        });

        setTimeout(() => setAvisoCracha(null), 6000);
      } catch (error: any) {
        abaPdf?.close();
        console.error("ERRO AO EMITIR CRACHÁ:", error);

        setErroEmissaoCracha(
          t("issuance.issueGenericError")
        );
      } finally {
        setEmitindoCracha(false);
      }

      return;
    }

    if (modoEmissaoCracha === "LOTE") {
      if (!filtroLoteEmissao) {
        setErroEmissaoCracha(
          t("issuance.selectFilterBeforeBatch")
        );
        return;
      }

      if (!resumoEmissaoCracha) {
        setErroEmissaoCracha(
          t("issuance.previewBeforeBatch")
        );
        return;
      }

      const pessoasAptas =
        pessoasEmissaoCracha.filter(
          (pessoa) =>
            pessoa.aptoParaCracha === true
        );

      if (pessoasAptas.length === 0) {
        setErroEmissaoCracha(
          t("issuance.noneEligible")
        );
        return;
      }

      const abaPdf = window.open("", "_blank");

      if (abaPdf) {
        abaPdf.document.title =
          t("issuance.generatingBatchPdf");

        abaPdf.document.body.innerHTML = `
      <div style="
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:32px;
        font-family:Arial,sans-serif;
        background:#f8fafc;
        color:#0f172a;
        text-align:center;
      ">
        <div>
          <h1 style="font-size:22px;margin:0 0 12px;">
            ${t("issuance.generatingBatchPdf")}
          </h1>
          <p style="font-size:15px;margin:0;">
            ${t("issuance.processingBadges", { count: pessoasAptas.length })}
            ${t("issuance.tabAutoUpdate")}
          </p>
        </div>
      </div>
    `;
      }

      try {
        setEmitindoCracha(true);

        const respostaEmissao = await fetch(
          "/api/admin/crachas/emitir-lote",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tipoPessoa: tipoModeloCracha,
              pessoaIds: pessoasAptas.map(
                (pessoa) => pessoa.id
              ),
              modeloId:
                modeloCrachaAtualId ||
                undefined,
            }),
          }
        );

        const dadosEmissao =
          await respostaEmissao.json();

        if (!respostaEmissao.ok) {
          throw new Error(
            t("issuance.batchIssueError")
          );
        }

        const crachaIds = Array.isArray(
          dadosEmissao?.crachaIds
        )
          ? dadosEmissao.crachaIds
            .map((id: unknown) => Number(id))
            .filter(
              (id: number) =>
                Number.isInteger(id) && id > 0
            )
          : [];

        if (crachaIds.length === 0) {
          throw new Error(
            t("issuance.batchNoIds")
          );
        }

        const respostaPdf = await fetch(
          "/api/admin/crachas/emitidos/lote/pdf",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              crachaIds,
            }),
          }
        );

        if (!respostaPdf.ok) {
          const tipoConteudo =
            respostaPdf.headers.get(
              "content-type"
            ) || "";

          const erroPdf =
            tipoConteudo.includes(
              "application/json"
            )
              ? await respostaPdf.json()
              : null;

          throw new Error(
            t("issuance.batchPdfError")
          );
        }

        const pdfBlob = await respostaPdf.blob();

        const disposicao =
          respostaPdf.headers.get(
            "content-disposition"
          ) || "";

        const resultadoNome =
          disposicao.match(
            /filename="?([^";]+)"?/i
          );

        const nomeArquivo =
          resultadoNome?.[1] ||
          t("issuance.batchFileName", { count: crachaIds.length });

        const arquivoPdf = new File(
          [pdfBlob],
          nomeArquivo,
          {
            type: "application/pdf",
          }
        );

        const urlPdf =
          URL.createObjectURL(arquivoPdf);

        if (abaPdf && !abaPdf.closed) {
          abaPdf.location.href = urlPdf;
        } else {
          const link =
            document.createElement("a");

          link.href = urlPdf;
          link.download = nomeArquivo;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }

        setTimeout(() => {
          URL.revokeObjectURL(urlPdf);
        }, 300000);

        const totalEmitido = Number(
          dadosEmissao?.resumo?.totalEmitido ||
          crachaIds.length
        );

        const totalIgnorado = Number(
          dadosEmissao?.resumo?.totalIgnorado ||
          0
        );

        fecharModalEmissaoCracha(true);

        setAvisoCracha({
          tipo: "sucesso",
          texto:
            totalIgnorado > 0
              ? t("issuance.batchIssuedIgnored", { issued: totalEmitido, ignored: totalIgnorado })
              : t("issuance.batchIssued", { issued: totalEmitido }),
        });

        setTimeout(
          () => setAvisoCracha(null),
          8000
        );
      } catch (error: any) {
        abaPdf?.close();

        console.error(
          "ERRO AO EMITIR LOTE DE CRACHÁS:",
          error
        );

        setErroEmissaoCracha(
          t("issuance.batchGenericError")
        );
      } finally {
        setEmitindoCracha(false);
      }

      return;
    }
  }

  function abrirPdfUltimoCrachaEmitido() {
    if (!ultimoCrachaEmitidoId) {
      setAvisoCracha({
        tipo: "erro",
        texto:
          t("issuance.noLastBadge"),
      });

      setTimeout(() => setAvisoCracha(null), 4000);
      return;
    }

    window.open(
      `/api/admin/crachas/emitidos/${ultimoCrachaEmitidoId}/pdf`,
      "_blank"
    );
  }

  function adicionarTexto() {
    setObjetos((atual) => [
      ...atual,
      {
        id: Date.now(),
        tipo: "TEXTO",
        texto: t("objects.newText"),
        x: 30,
        y: 30,
        fonte: 18,
        fonteFamilia: "Arial",
        cor: "#000000",
        alinhamento: "center",
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
    const agora = Date.now();
    const campoPadrao = camposDisponiveisPorTipo(tipoModeloCracha)[0];

    setObjetos((atual) => [
      ...atual,
      {
        id: agora,
        tipo: "CAMPO",
        campo: campoPadrao.campo,
        rotulo: campoPadrao.rotulo,
        x: 30,
        y: 80,
        fonte: 16,
        fonteFamilia: "Arial",
        cor: "#000000",
        alinhamento: "center",
        largura: 150,
        altura: 32,

        sombraAtiva: false,
        sombraX: 2,
        sombraY: 2,
        sombraBlur: 4,
        sombraCor: "#000000",

        ordem: agora,
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
        rotulo: "Foto da pessoa",
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

    const larguraCracha =
      formato === "RETRATO"
        ? 240
        : formato === "PAISAGEM"
          ? 380
          : 260;

    const alturaCracha =
      formato === "RETRATO"
        ? 380
        : formato === "PAISAGEM"
          ? 240
          : 260;

    const tamanho = formato === "PAISAGEM" ? 72 : 90;

    const novoObjeto: ObjetoCracha = {
      id: agora,
      tipo: "QRCODE",
      valor: "https://www.phanyx.com.br/verificar/cracha/{{codigoCracha}}",
      x: Math.round((larguraCracha - tamanho) / 2),
      y: Math.round((alturaCracha - tamanho) / 2),
      largura: tamanho,
      altura: tamanho,
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
    };

    setObjetos((atual) => [...atual, novoObjeto]);
    setObjetoSelecionado(agora);
  }

  function adicionarCodigoBarras() {
    const agora = Date.now();

    const larguraCracha =
      formato === "RETRATO"
        ? 240
        : formato === "PAISAGEM"
          ? 380
          : 260;

    const alturaCracha =
      formato === "RETRATO"
        ? 380
        : formato === "PAISAGEM"
          ? 240
          : 260;

    const larguraCodigo = formato === "PAISAGEM" ? 180 : 160;
    const alturaCodigo = 48;

    const novoObjeto: ObjetoCracha = {
      id: agora,
      tipo: "CODIGO_BARRAS",
      valor: "{{codigoCracha}}",
      rotulo: "Código de barras",
      x: Math.round((larguraCracha - larguraCodigo) / 2),
      y: Math.round(alturaCracha - alturaCodigo - 20),
      largura: larguraCodigo,
      altura: alturaCodigo,
      cor: "#000000",
      corFundo: "#ffffff",
      mostrarTexto: false,
      mostrarFundo: true,
      raioBorda: 4,
      ordem: agora,
      sombraAtiva: false,
      sombraX: 2,
      sombraY: 2,
      sombraBlur: 4,
      sombraCor: "#000000",
    };

    setObjetos((atual) => [...atual, novoObjeto]);
    setObjetoSelecionado(agora);
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
        `drop-shadow(${objeto.sombraX ?? 4}px ${objeto.sombraY ?? 4}px ${objeto.sombraBlur ?? 10
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
        throw new Error(t("image.uploadError"));
      }

      const url =
        json.url ||
        json.fileUrl ||
        json.arquivoUrl ||
        json.publicUrl;

      if (!url) {
        throw new Error(t("image.urlMissing"));
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
        texto: t("image.added"),
      });

      setTimeout(() => setAvisoCracha(null), 3000);
    } catch (error) {
      console.error(error);

      setAvisoCracha({
        tipo: "erro",
        texto: t("image.uploadError"),
      });

      setTimeout(() => setAvisoCracha(null), 4000);
    } finally {
      e.target.value = "";
    }
  }

  async function handleUploadImagemObjeto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo || enviandoImagem || objetoAtual?.tipo !== "IMAGEM") return;

    const versao = versaoModeloImagemRef.current;
    setEnviandoImagem(true);

    try {
      const preparada = await prepararLogoParaUpload(arquivo, 20 * 1024 * 1024);
      const formData = new FormData();
      formData.append("file", preparada);

      const resposta = await fetch("/api/admin/crachas/imagens", {
        method: "POST",
        body: formData,
      });
      const dados = await resposta.json().catch(() => null);
      if (!resposta.ok || typeof dados?.url !== "string") {
        throw new Error("Falha no envio da imagem do crachá.");
      }
      const url = dados.url;
      if (versao !== versaoModeloImagemRef.current) return;

      atualizarObjeto(objetoAtual.id, {
        url,
        origem: "UPLOAD",
        rotulo: objetoAtual.origem === "LOGO" || objetoAtual.rotulo === "Logo" ? "Logo" : "Imagem",
      });

      setAvisoCracha({ tipo: "sucesso", texto: t("image.applied") });
      setTimeout(() => setAvisoCracha(null), 3000);
    } catch (error) {
      if (versao !== versaoModeloImagemRef.current) return;

      let texto = t("image.applyError");
      if (error instanceof ErroPreparacaoLogo) {
        if (error.codigo === "invalidFormat") texto = t("image.invalidType");
        if (error.codigo === "originalTooLarge") texto = t("image.tooLarge");
      }
      setAvisoCracha({ tipo: "erro", texto });
      setTimeout(() => setAvisoCracha(null), 4000);
    } finally {
      setEnviandoImagem(false);
    }
  }

  function chaveHistoricoObjeto(
    ladoObjeto: "FRENTE" | "VERSO",
    objetoId: number
  ) {
    return `${ladoObjeto}:${objetoId}`;
  }

  function clonarObjetoHistorico(
    objeto: ObjetoCracha
  ): ObjetoCracha {
    return structuredClone(objeto);
  }

  function registrarEstadoHistorico(
    ladoObjeto:
      | "FRENTE"
      | "VERSO",
    objeto: ObjetoCracha
  ) {
    const chave =
      chaveHistoricoObjeto(
        ladoObjeto,
        objeto.id
      );

    const historico =
      historicoObjetosRef.current.get(
        chave
      ) || [];

    const snapshot =
      clonarObjetoHistorico(objeto);

    const novoHistorico = [
      ...historico,
      snapshot,
    ];

    if (
      novoHistorico.length >
      LIMITE_HISTORICO_OBJETO
    ) {
      novoHistorico.splice(
        0,
        novoHistorico.length -
        LIMITE_HISTORICO_OBJETO
      );
    }

    historicoObjetosRef.current.set(
      chave,
      novoHistorico
    );
  }

  function limparHistoricoObjetos() {
    versaoModeloImagemRef.current += 1;
    for (
      const pendente of
      alteracoesPendentesRef.current.values()
    ) {
      clearTimeout(
        pendente.timer
      );
    }

    alteracoesPendentesRef.current.clear();

    historicoObjetosRef.current.clear();

    aplicandoUndoRef.current = false;
  }

  function atualizarObjeto(
    id: number,
    dados: Partial<ObjetoCracha>
  ) {
    setObjetos((atual) => {
      const objetoAnterior =
        atual.find(
          (objeto) =>
            objeto.id === id
        );

      if (!objetoAnterior) {
        return atual;
      }

      /*
       * Não registrar o próprio Ctrl + Z
       * como uma nova alteração.
       */
      if (!aplicandoUndoRef.current) {
        const chave =
          chaveHistoricoObjeto(
            lado,
            id
          );

        const pendente =
          alteracoesPendentesRef.current.get(
            chave
          );

        /*
         * Primeira alteração desta sequência:
         * guarda exatamente o estado ANTES
         * da alteração.
         */
        if (!pendente) {
          const estadoAnterior =
            clonarObjetoHistorico(
              objetoAnterior
            );

          const timer =
            setTimeout(() => {
              registrarEstadoHistorico(
                lado,
                estadoAnterior
              );

              alteracoesPendentesRef.current.delete(
                chave
              );
            }, 200);

          alteracoesPendentesRef.current.set(
            chave,
            {
              estadoAnterior,
              timer,
            }
          );
        } else {
          /*
           * Ainda estamos na mesma operação,
           * como arrastar/redimensionar.
           *
           * Mantém o PRIMEIRO estado anterior
           * e apenas renova o tempo.
           */
          clearTimeout(
            pendente.timer
          );

          const timer =
            setTimeout(() => {
              registrarEstadoHistorico(
                lado,
                pendente.estadoAnterior
              );

              alteracoesPendentesRef.current.delete(
                chave
              );
            }, 200);

          alteracoesPendentesRef.current.set(
            chave,
            {
              estadoAnterior:
                pendente.estadoAnterior,
              timer,
            }
          );
        }
      }

      return atual.map(
        (objeto) =>
          objeto.id === id
            ? ({
              ...objeto,
              ...dados,
            } as ObjetoCracha)
            : objeto
      );
    });
  }

  function excluirObjetoSelecionado() {
    const idsParaExcluir =
      objetosSelecionadosIds.length > 0
        ? objetosSelecionadosIds
        : objetoSelecionado !== null
          ? idsDoGrupoDoObjeto(
            objetoSelecionado
          )
          : [];

    if (
      idsParaExcluir.length === 0
    ) {
      return;
    }

    const idsSet =
      new Set(
        idsParaExcluir
      );

    setObjetos(
      (atuais) =>
        atuais.filter(
          (objeto) =>
            !idsSet.has(
              objeto.id
            )
        )
    );

    setObjetoSelecionado(
      null
    );

    setObjetosSelecionadosIds(
      []
    );
  }

  useEffect(() => {
    function aoPressionarTecla(
      e: KeyboardEvent
    ) {
      const alvo =
        e.target as HTMLElement | null;

      const tag =
        alvo?.tagName?.toLowerCase();

      const estaDigitando =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        alvo?.isContentEditable;

      const tecla =
        e.key.toLowerCase();

      /*
       * DESFAZER DO EDITOR
       */
      if (
        (e.ctrlKey || e.metaKey) &&
        tecla === "z" &&
        !e.shiftKey &&
        objetoSelecionado !== null
      ) {
        e.preventDefault();
        e.stopPropagation();

        desfazerObjetoSelecionado();

        return;
      }

      /*
       * Não capturar outros atalhos
       * enquanto o usuário digita.
       */
      if (estaDigitando) {
        return;
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        tecla === "c"
      ) {
        if (!objetoAtual) return;

        e.preventDefault();
        copiarObjetoSelecionado();

        return;
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        tecla === "v"
      ) {
        if (!objetoCopiado) return;

        e.preventDefault();
        colarObjetoCopiado();

        return;
      }

      if (
        objetoSelecionado === null
      ) {
        return;
      }

      if (
        e.key === "Delete" ||
        e.key === "Backspace"
      ) {
        e.preventDefault();
        excluirObjetoSelecionado();
      }

      if (e.key === "Escape") {
        setObjetoSelecionado(null);
      }
    }

    window.addEventListener(
      "keydown",
      aoPressionarTecla
    );

    return () => {
      window.removeEventListener(
        "keydown",
        aoPressionarTecla
      );
    };
  }, [
    objetoSelecionado,
    objetosSelecionadosIds,
    objetoAtual,
    objetoCopiado,
    lado,
  ]);

  useEffect(() => {
    carregarListaModelosCracha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoModeloCracha]);

  useEffect(() => {
    function aoPressionarTecla(
      event: KeyboardEvent
    ) {
      const alvo =
        event.target as HTMLElement | null;

      const estaDigitando =
        alvo?.tagName === "INPUT" ||
        alvo?.tagName === "TEXTAREA" ||
        alvo?.tagName === "SELECT" ||
        alvo?.isContentEditable;

      if (estaDigitando) {
        return;
      }

      if (
        event.key !== "Delete" &&
        event.key !== "Backspace"
      ) {
        return;
      }

      /*
       * Objeto selecionado tem prioridade.
       */
      if (objetoSelecionado !== null) {
        return;
      }

      if (!modeloCrachaAtualId) {
        return;
      }

      event.preventDefault();

      excluirModeloCracha(
        modeloCrachaAtualId
      );
    }

    window.addEventListener(
      "keydown",
      aoPressionarTecla
    );

    return () => {
      window.removeEventListener(
        "keydown",
        aoPressionarTecla
      );
    };
  }, [
    modeloCrachaAtualId,
    objetoSelecionado,
  ]);

  function desfazerObjetoSelecionado() {
    if (objetoSelecionado === null) {
      return;
    }

    const chave =
      chaveHistoricoObjeto(
        lado,
        objetoSelecionado
      );

    /*
     * Pode acontecer de a pessoa apertar
     * Ctrl+Z imediatamente após soltar
     * o mouse, antes dos 200 ms.
     *
     * Nesse caso registramos agora.
     */
    const pendente =
      alteracoesPendentesRef.current.get(
        chave
      );

    if (pendente) {
      clearTimeout(
        pendente.timer
      );

      registrarEstadoHistorico(
        lado,
        pendente.estadoAnterior
      );

      alteracoesPendentesRef.current.delete(
        chave
      );
    }

    const historico =
      historicoObjetosRef.current.get(
        chave
      );

    if (
      !historico ||
      historico.length === 0
    ) {
      return;
    }

    const estadoAnterior =
      historico.pop();

    if (!estadoAnterior) {
      return;
    }

    historicoObjetosRef.current.set(
      chave,
      historico
    );

    aplicandoUndoRef.current = true;

    setObjetos((atuais) =>
      atuais.map((objeto) =>
        objeto.id ===
          objetoSelecionado
          ? clonarObjetoHistorico(
            estadoAnterior
          )
          : objeto
      )
    );

    /*
     * Libera novamente o registro
     * de alterações após o React
     * aplicar o estado restaurado.
     */
    requestAnimationFrame(() => {
      aplicandoUndoRef.current =
        false;
    });
  }

  function alinharCaixaTexto(alinhamentoCaixa: "left" | "center" | "right") {
    if (
      !objetoAtual ||
      (objetoAtual.tipo !== "TEXTO" && objetoAtual.tipo !== "CAMPO")
    ) {
      return;
    }

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

  function sombraTextoCss(
    objeto: Extract<ObjetoCracha, { tipo: "TEXTO" | "CAMPO" }>
  ) {
    if (!objeto.sombraAtiva) return "none";

    return `${objeto.sombraX ?? 2}px ${objeto.sombraY ?? 2}px ${objeto.sombraBlur ?? 4
      }px ${objeto.sombraCor ?? "#000000"}`;
  }

  function sombraImagemDropCss(
    objeto: Extract<ObjetoCracha, { tipo: "IMAGEM" }>
  ) {
    if (!objeto.sombraAtiva || objeto.sombraModo !== "DROP") return "none";

    return `drop-shadow(${objeto.sombraX ?? 2}px ${objeto.sombraY ?? 2}px ${objeto.sombraBlur ?? 6
      }px ${objeto.sombraCor ?? "#000000"})`;
  }

  function sombraImagemBoxCss(
    objeto: Extract<ObjetoCracha, { tipo: "IMAGEM" }>
  ) {
    if (!objeto.sombraAtiva || objeto.sombraModo !== "BOX") return "none";

    return `${objeto.sombraX ?? 2}px ${objeto.sombraY ?? 2}px ${objeto.sombraBlur ?? 6
      }px ${objeto.sombraCor ?? "#000000"}`;
  }

  function sombraQrCodeCss(
    objeto: Extract<ObjetoCracha, { tipo: "QRCODE" }>
  ) {
    if (!objeto.sombraAtiva) return "none";

    return `${objeto.sombraX ?? 2}px ${objeto.sombraY ?? 2}px ${objeto.sombraBlur ?? 6
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
    objeto: Extract<
      ObjetoCracha,
      { tipo: "FORMA" }
    >,
    canto: "nw" | "ne" | "sw" | "se"
  ) {
    e.preventDefault();
    e.stopPropagation();

    setObjetoSelecionado(objeto.id);

    const inicioX = e.clientX;
    const inicioY = e.clientY;

    const xOriginal = objeto.x;
    const yOriginal = objeto.y;

    const larguraOriginal =
      objeto.largura;

    const alturaOriginal =
      objeto.altura;

    /*
     * Cantos opostos que devem
     * permanecer fixos durante
     * o redimensionamento.
     */
    const direitaOriginal =
      xOriginal + larguraOriginal;

    const baixoOriginal =
      yOriginal + alturaOriginal;

    const proporcaoOriginal =
      alturaOriginal > 0
        ? larguraOriginal /
        alturaOriginal
        : 1;

    const tamanhoMinimo = 10;

    function mover(ev: MouseEvent) {
      const dx =
        ev.clientX - inicioX;

      const dy =
        ev.clientY - inicioY;

      let novoX = xOriginal;
      let novoY = yOriginal;

      let novaLargura =
        larguraOriginal;

      let novaAltura =
        alturaOriginal;

      /*
       * Primeiro calcula o tamanho livre,
       * exatamente como já funcionava.
       */
      if (canto === "se") {
        novaLargura =
          larguraOriginal + dx;

        novaAltura =
          alturaOriginal + dy;
      }

      if (canto === "sw") {
        novaLargura =
          larguraOriginal - dx;

        novaAltura =
          alturaOriginal + dy;
      }

      if (canto === "ne") {
        novaLargura =
          larguraOriginal + dx;

        novaAltura =
          alturaOriginal - dy;
      }

      if (canto === "nw") {
        novaLargura =
          larguraOriginal - dx;

        novaAltura =
          alturaOriginal - dy;
      }

      /*
       * SHIFT:
       * preserva a proporção original
       * da forma.
       */
      if (ev.shiftKey) {
        const escalaLargura =
          novaLargura /
          larguraOriginal;

        const escalaAltura =
          novaAltura /
          alturaOriginal;

        /*
         * Usa o eixo que sofreu
         * a alteração proporcional maior.
         *
         * Isso deixa o movimento natural
         * tanto na horizontal quanto
         * na vertical.
         */
        let escala =
          Math.abs(
            escalaLargura - 1
          ) >=
            Math.abs(
              escalaAltura - 1
            )
            ? escalaLargura
            : escalaAltura;

        const escalaMinima =
          Math.max(
            tamanhoMinimo /
            larguraOriginal,

            tamanhoMinimo /
            alturaOriginal
          );

        escala =
          Math.max(
            escalaMinima,
            escala
          );

        novaLargura =
          larguraOriginal * escala;

        novaAltura =
          novaLargura /
          proporcaoOriginal;

        /*
         * Mantém o canto oposto fixo.
         */
        if (canto === "se") {
          novoX = xOriginal;
          novoY = yOriginal;
        }

        if (canto === "sw") {
          novoX =
            direitaOriginal -
            novaLargura;

          novoY = yOriginal;
        }

        if (canto === "ne") {
          novoX = xOriginal;

          novoY =
            baixoOriginal -
            novaAltura;
        }

        if (canto === "nw") {
          novoX =
            direitaOriginal -
            novaLargura;

          novoY =
            baixoOriginal -
            novaAltura;
        }
      } else {
        /*
         * Sem SHIFT:
         * redimensionamento livre.
         */
        novaLargura =
          Math.max(
            tamanhoMinimo,
            novaLargura
          );

        novaAltura =
          Math.max(
            tamanhoMinimo,
            novaAltura
          );

        /*
         * Recalcula X/Y depois do limite
         * mínimo para o canto oposto
         * não se deslocar.
         */
        if (canto === "sw") {
          novoX =
            direitaOriginal -
            novaLargura;
        }

        if (canto === "ne") {
          novoY =
            baixoOriginal -
            novaAltura;
        }

        if (canto === "nw") {
          novoX =
            direitaOriginal -
            novaLargura;

          novoY =
            baixoOriginal -
            novaAltura;
        }
      }

      atualizarObjeto(
        objeto.id,
        {
          x: novoX,
          y: novoY,

          largura:
            novaLargura,

          altura:
            novaAltura,
        }
      );
    }

    function soltar() {
      window.removeEventListener(
        "mousemove",
        mover
      );

      window.removeEventListener(
        "mouseup",
        soltar
      );
    }

    window.addEventListener(
      "mousemove",
      mover
    );

    window.addEventListener(
      "mouseup",
      soltar
    );
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
        title={t("messages.deleteObject")}
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
    if (!objetoAtual) {
      return;
    }

    trazerObjetoParaFrentePorId(
      objetoAtual.id
    );
  }

  function enviarParaTras() {
    if (!objetoAtual) {
      return;
    }

    enviarObjetoParaTrasPorId(
      objetoAtual.id
    );
  }

  function abrirMenuContexto(
    e: React.MouseEvent<HTMLDivElement>,
    objetoId: number
  ) {
    e.preventDefault();
    e.stopPropagation();

    const clicadoJaSelecionado =
      objetosSelecionadosIds.includes(
        objetoId
      );

    /*
     * Se o clique ocorreu fora da
     * seleção atual, seleciona apenas
     * esse objeto ou seu grupo.
     *
     * Se ocorreu em um dos objetos
     * selecionados com Shift, preserva
     * toda a seleção para poder agrupar.
     */
    if (!clicadoJaSelecionado) {
      setObjetosSelecionadosIds(
        idsDoGrupoDoObjeto(
          objetoId
        )
      );
    }

    setObjetoSelecionado(
      objetoId
    );

    const rect =
      e.currentTarget.getBoundingClientRect();

    const larguraMenu = 224;
    const alturaMenu = 330;
    const margem = 12;

    const cabeNaDireita =
      rect.right +
      larguraMenu +
      margem <
      window.innerWidth;

    const x =
      cabeNaDireita
        ? rect.right + margem
        : Math.max(
          margem,
          rect.left -
          larguraMenu -
          margem
        );

    const y =
      Math.min(
        Math.max(
          margem,
          rect.top
        ),
        window.innerHeight -
        alturaMenu -
        margem
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

  function agruparObjetosSelecionados() {
    const idsValidos =
      Array.from(
        new Set(
          objetosSelecionadosIds.filter(
            (id) =>
              objetos.some(
                (objeto) =>
                  objeto.id === id
              )
          )
        )
      );

    if (idsValidos.length < 2) {
      setAvisoCracha({
        tipo: "erro",
        texto:
          t("messages.selectTwoGroup"),
      });

      setTimeout(
        () =>
          setAvisoCracha(null),
        3500
      );

      return;
    }

    const novoGrupoId =
      Date.now();

    setObjetos(
      (atuais) =>
        atuais.map(
          (objeto) =>
            idsValidos.includes(
              objeto.id
            )
              ? {
                ...objeto,
                grupoId:
                  novoGrupoId,
              }
              : objeto
        )
    );

    setObjetosSelecionadosIds(
      idsValidos
    );

    setObjetoSelecionado(
      idsValidos[
      idsValidos.length - 1
      ]
    );

    setAvisoCracha({
      tipo: "sucesso",
      texto:
        t("messages.grouped", { count: idsValidos.length }),
    });

    setTimeout(
      () =>
        setAvisoCracha(null),
      2500
    );

    fecharMenuContexto();
  }

  function desagruparObjetoPorId(
    objetoId: number
  ) {
    const objeto =
      objetos.find(
        (item) =>
          item.id === objetoId
      );

    if (
      !objeto ||
      objeto.grupoId === undefined
    ) {
      setAvisoCracha({
        tipo: "erro",
        texto:
          t("messages.notInGroup"),
      });

      setTimeout(
        () =>
          setAvisoCracha(null),
        3000
      );

      fecharMenuContexto();

      return;
    }

    const grupoId =
      objeto.grupoId;

    const idsDoGrupo =
      objetos
        .filter(
          (item) =>
            item.grupoId ===
            grupoId
        )
        .map(
          (item) =>
            item.id
        );

    setObjetos(
      (atuais) =>
        atuais.map(
          (item) =>
            item.grupoId ===
              grupoId
              ? {
                ...item,
                grupoId:
                  undefined,
              }
              : item
        )
    );

    setObjetoSelecionado(
      objetoId
    );

    setObjetosSelecionadosIds([
      objetoId,
    ]);

    setAvisoCracha({
      tipo: "sucesso",
      texto:
        t("messages.ungrouped", { count: idsDoGrupo.length }),
    });

    setTimeout(
      () =>
        setAvisoCracha(null),
      2500
    );

    fecharMenuContexto();
  }

  function objetosRelacionadosAoObjeto(
    objetoId: number
  ) {
    const idsRelacionados =
      idsDoGrupoDoObjeto(
        objetoId
      );

    return objetos
      .filter(
        (objeto) =>
          idsRelacionados.includes(
            objeto.id
          )
      )
      .sort(
        (a, b) =>
          (a.ordem || 0) -
          (b.ordem || 0)
      );
  }

  function trazerObjetoParaFrentePorId(
    objetoId: number
  ) {
    const objetosRelacionados =
      objetosRelacionadosAoObjeto(
        objetoId
      );

    if (
      objetosRelacionados.length === 0
    ) {
      return;
    }

    const maiorOrdem =
      Math.max(
        1,
        ...objetos.map(
          (objeto) =>
            objeto.ordem || 0
        )
      );

    objetosRelacionados.forEach(
      (objeto, indice) => {
        atualizarObjeto(
          objeto.id,
          {
            ordem:
              maiorOrdem +
              indice +
              1,
          }
        );
      }
    );

    fecharMenuContexto();
  }

  function enviarObjetoParaTrasPorId(
    objetoId: number
  ) {
    const objetosRelacionados =
      objetosRelacionadosAoObjeto(
        objetoId
      );

    if (
      objetosRelacionados.length === 0
    ) {
      return;
    }

    const menorOrdem =
      Math.min(
        0,
        ...objetos.map(
          (objeto) =>
            objeto.ordem || 0
        )
      );

    objetosRelacionados.forEach(
      (objeto, indice) => {
        atualizarObjeto(
          objeto.id,
          {
            ordem:
              menorOrdem -
              objetosRelacionados.length +
              indice,
          }
        );
      }
    );

    fecharMenuContexto();
  }

  function duplicarObjetoPorId(
    objetoId: number
  ) {
    const objetosRelacionados =
      objetosRelacionadosAoObjeto(
        objetoId
      );

    if (
      objetosRelacionados.length === 0
    ) {
      return;
    }

    const agora =
      Date.now();

    const maiorOrdem =
      Math.max(
        1,
        ...objetos.map(
          (objeto) =>
            objeto.ordem || 0
        )
      );

    const novoGrupoId =
      objetosRelacionados.length >= 2
        ? agora + 1000000
        : undefined;

    const novosObjetos =
      objetosRelacionados.map(
        (objeto, indice) => {
          const clone =
            clonarObjetoCracha(
              objeto,
              12
            );

          return {
            ...clone,
            id:
              agora +
              indice,

            grupoId:
              novoGrupoId,

            ordem:
              maiorOrdem +
              indice +
              1,
          } as ObjetoCracha;
        }
      );

    setObjetos(
      (atuais) => [
        ...atuais,
        ...novosObjetos,
      ]
    );

    const novosIds =
      novosObjetos.map(
        (objeto) =>
          objeto.id
      );

    setObjetosSelecionadosIds(
      novosIds
    );

    setObjetoSelecionado(
      novosIds[
      novosIds.length - 1
      ]
    );

    setAvisoCracha({
      tipo: "sucesso",
      texto:
        novosObjetos.length >= 2
          ? t("messages.duplicatedGroup", { count: novosObjetos.length })
          : t("messages.objectDuplicated"),
    });

    setTimeout(
      () =>
        setAvisoCracha(null),
      2500
    );

    fecharMenuContexto();
  }

  function excluirObjetoPorId(
    objetoId: number
  ) {
    const idsRelacionados =
      idsDoGrupoDoObjeto(
        objetoId
      );

    setObjetos(
      (atuais) =>
        atuais.filter(
          (objeto) =>
            !idsRelacionados.includes(
              objeto.id
            )
        )
    );

    setObjetoSelecionado(
      null
    );

    setObjetosSelecionadosIds(
      []
    );

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

  function gerarCaminhoEstrelaSvg(
    pontas: number,
    raioExterno: number,
    raioInterno: number,
    arredondamentoPontas = 0,
    arredondamentoReentrancias = 0,
    circularidadePontas = 0,
    circularidadeReentrancias = 0
  ) {
    const cx = 50;
    const cy = 50;

    const totalPontas =
      Math.max(
        3,
        Math.min(
          20,
          pontas
        )
      );

    function limitarPercentual(
      valor: number
    ) {
      return Math.max(
        0,
        Math.min(
          100,
          Number(valor) || 0
        )
      );
    }

    /*
     * O editor de certificado trabalha
     * com tangentes simétricas ao redor
     * de cada vértice.
     *
     * Arredondamento:
     * suavização moderada.
     *
     * Circularidade:
     * aumenta bastante a tangente,
     * permitindo chegar ao efeito
     * de pétala/círculo.
     */
    const intensidadePontas =
      Math.min(
        42,
        limitarPercentual(
          arredondamentoPontas
        ) *
        0.18 +
        limitarPercentual(
          circularidadePontas
        ) *
        0.40
      );

    const intensidadeReentrancias =
      Math.min(
        38,
        limitarPercentual(
          arredondamentoReentrancias
        ) *
        0.18 +
        limitarPercentual(
          circularidadeReentrancias
        ) *
        0.36
      );

    type VerticeEstrela = {
      x: number;
      y: number;

      externo: boolean;

      curvo: boolean;

      inX: number;
      inY: number;

      outX: number;
      outY: number;
    };

    const vertices:
      VerticeEstrela[] = [];

    for (
      let indice = 0;
      indice <
      totalPontas * 2;
      indice++
    ) {
      const externo =
        indice % 2 === 0;

      const angulo =
        -Math.PI / 2 +
        (
          indice *
          Math.PI
        ) /
        totalPontas;

      const raio =
        externo
          ? raioExterno
          : raioInterno;

      const x =
        cx +
        Math.cos(
          angulo
        ) *
        raio;

      const y =
        cy +
        Math.sin(
          angulo
        ) *
        raio;

      const intensidade =
        externo
          ? intensidadePontas
          : intensidadeReentrancias;

      /*
       * Tangente perpendicular
       * ao raio do vértice.
       *
       * É a mesma ideia usada no
       * editor de certificado.
       */
      const anguloTangente =
        angulo +
        Math.PI / 2;

      const dx =
        Math.cos(
          anguloTangente
        ) *
        intensidade;

      const dy =
        Math.sin(
          anguloTangente
        ) *
        intensidade;

      vertices.push({
        x,
        y,

        externo,

        curvo:
          intensidade > 0.001,

        inX:
          x - dx,

        inY:
          y - dy,

        outX:
          x + dx,

        outY:
          y + dy,
      });
    }

    if (
      vertices.length === 0
    ) {
      return "";
    }

    let caminho =
      `M ${vertices[0].x} ${vertices[0].y}`;

    /*
     * Liga cada vértice ao próximo.
     *
     * Se qualquer um dos dois possui
     * arredondamento, usa Bézier cúbica.
     */
    for (
      let indice = 1;
      indice <
      vertices.length;
      indice++
    ) {
      const anterior =
        vertices[
        indice - 1
        ];

      const atual =
        vertices[
        indice
        ];

      if (
        anterior.curvo ||
        atual.curvo
      ) {
        caminho +=
          ` C ` +
          `${anterior.outX} ${anterior.outY} ` +
          `${atual.inX} ${atual.inY} ` +
          `${atual.x} ${atual.y}`;
      } else {
        caminho +=
          ` L ${atual.x} ${atual.y}`;
      }
    }

    /*
     * Fecha a última aresta
     * exatamente com a mesma lógica.
     */
    const ultimo =
      vertices[
      vertices.length - 1
      ];

    const primeiro =
      vertices[0];

    if (
      ultimo.curvo ||
      primeiro.curvo
    ) {
      caminho +=
        ` C ` +
        `${ultimo.outX} ${ultimo.outY} ` +
        `${primeiro.inX} ${primeiro.inY} ` +
        `${primeiro.x} ${primeiro.y}`;
    }

    caminho += " Z";

    return caminho;
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
    objeto: Extract<
      ObjetoCracha,
      { tipo: "FORMA" }
    >
  ) {
    /*
     * Posição independente das duas hastes.
     *
     * cruzCentroX:
     * move SOMENTE a haste vertical.
     *
     * cruzCentroY:
     * move SOMENTE a haste horizontal.
     */
    const posicaoVerticalX =
      limitarFormaSvg(
        objeto.cruzCentroX ?? 50,
        15,
        85
      );

    const posicaoHorizontalY =
      limitarFormaSvg(
        objeto.cruzCentroY ?? 50,
        15,
        85
      );

    const espessuraVertical =
      limitarFormaSvg(
        objeto.cruzEspessuraVertical ??
        24,
        6,
        70
      );

    const espessuraHorizontal =
      limitarFormaSvg(
        objeto.cruzEspessuraHorizontal ??
        24,
        6,
        70
      );

    const comprimentoHorizontal =
      limitarFormaSvg(
        objeto.cruzComprimentoHorizontal ??
        94,
        20,
        400
      );

    const comprimentoVertical =
      limitarFormaSvg(
        objeto.cruzComprimentoVertical ??
        94,
        20,
        400
      );

    /*
     * IMPORTANTE:
     *
     * Os comprimentos das hastes continuam
     * ancorados no centro da área da forma
     * (50, 50).
     *
     * Portanto alterar X ou Y NÃO desloca
     * a forma inteira.
     */
    const centroAreaX = 50;
    const centroAreaY = 50;

    /*
     * Limites externos da haste horizontal.
     * Permanecem fixos.
     */
    const esquerdaH =
      limitarFormaSvg(
        centroAreaX -
        comprimentoHorizontal / 2,
        -200,
        300
      );

    const direitaH =
      limitarFormaSvg(
        centroAreaX +
        comprimentoHorizontal / 2,
        -200,
        300
      );

    /*
     * A posição vertical da haste horizontal
     * é controlada SOMENTE por cruzCentroY.
     */
    const topoH =
      limitarFormaSvg(
        posicaoHorizontalY -
        espessuraHorizontal / 2,
        1,
        99
      );

    const baseH =
      limitarFormaSvg(
        posicaoHorizontalY +
        espessuraHorizontal / 2,
        1,
        99
      );

    /*
     * A posição horizontal da haste vertical
     * é controlada SOMENTE por cruzCentroX.
     */
    const esquerdaV =
      limitarFormaSvg(
        posicaoVerticalX -
        espessuraVertical / 2,
        1,
        99
      );

    const direitaV =
      limitarFormaSvg(
        posicaoVerticalX +
        espessuraVertical / 2,
        1,
        99
      );

    /*
     * Limites externos da haste vertical.
     * Também permanecem fixos.
     */
    const topoV =
      limitarFormaSvg(
        centroAreaY -
        comprimentoVertical / 2,
        -200,
        300
      );

    const baseV =
      limitarFormaSvg(
        centroAreaY +
        comprimentoVertical / 2,
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
        <path
          d={gerarCaminhoEstrelaSvg(
            objeto.pontas ?? 5,
            objeto.raioExterno ?? 46,
            objeto.raioInterno ?? 22,
            objeto.arredondamentoPontas ?? 0,
            objeto.arredondamentoReentrancias ?? 0,
            objeto.circularidadePontas ?? 0,
            objeto.circularidadeReentrancias ?? 0
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
      return `radial-gradient(circle at ${objeto.gradienteFocoX ?? 45}% ${objeto.gradienteFocoY ?? 35
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

      ...(objetoAtual.forma === "ESTRELA"
        ? {
          arredondamentoPontas:
            objetoAtual.arredondamentoPontas,

          arredondamentoReentrancias:
            objetoAtual.arredondamentoReentrancias,

          circularidadePontas:
            objetoAtual.circularidadePontas,
        }
        : {}),

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
      texto: t("messages.shapeStyleCopied"),
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
      texto: t("messages.shapeStyleApplied"),
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
        texto: t("messages.freeformMinPoints"),
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
        texto: t("messages.selectTwoNeighborPoints"),
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
        texto: t("messages.selectNeighborPoints"),
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

  function tamanhoObjetoCracha(objeto: ObjetoCracha) {
    return {
      largura: Number((objeto as any).largura || 80),
      altura: Number((objeto as any).altura || 32),
    };
  }

  function alinharObjetoNoCracha(
    alinhamento:
      | "esquerda"
      | "centro-horizontal"
      | "direita"
      | "topo"
      | "centro-vertical"
      | "base"
      | "centro-total"
  ) {
    if (!objetoAtual) {
      return;
    }

    const area =
      crachaAreaRef.current;

    const larguraCracha =
      area?.clientWidth ||
      (formato === "PAISAGEM"
        ? 380
        : formato === "RETRATO"
          ? 240
          : 260);

    const alturaCracha =
      area?.clientHeight ||
      (formato === "PAISAGEM"
        ? 240
        : formato === "RETRATO"
          ? 380
          : 260);

    /*
     * Descobre se o objeto faz parte
     * de um grupo.
     *
     * idsDoGrupoDoObjeto já retorna
     * somente o próprio objeto quando
     * ele não está agrupado.
     */
    const idsAlvo =
      idsDoGrupoDoObjeto(
        objetoAtual.id
      );

    const objetosAlvo =
      objetos.filter(
        (item) =>
          idsAlvo.includes(
            item.id
          )
      );

    if (
      objetosAlvo.length === 0
    ) {
      return;
    }

    /*
     * Calcula a caixa externa de TODOS
     * os objetos do grupo.
     */
    const minX =
      Math.min(
        ...objetosAlvo.map(
          (item) =>
            item.x
        )
      );

    const minY =
      Math.min(
        ...objetosAlvo.map(
          (item) =>
            item.y
        )
      );

    const maxX =
      Math.max(
        ...objetosAlvo.map(
          (item) =>
            item.x +
            item.largura
        )
      );

    const maxY =
      Math.max(
        ...objetosAlvo.map(
          (item) =>
            item.y +
            item.altura
        )
      );

    const larguraConjunto =
      maxX - minX;

    const alturaConjunto =
      maxY - minY;

    /*
     * Primeiro calculamos PARA ONDE
     * a caixa inteira deve ir.
     */
    let destinoX =
      minX;

    let destinoY =
      minY;

    if (
      alinhamento ===
      "esquerda"
    ) {
      destinoX = 0;
    }

    if (
      alinhamento ===
      "centro-horizontal" ||
      alinhamento ===
      "centro-total"
    ) {
      destinoX =
        (
          larguraCracha -
          larguraConjunto
        ) / 2;
    }

    if (
      alinhamento ===
      "direita"
    ) {
      destinoX =
        larguraCracha -
        larguraConjunto;
    }

    if (
      alinhamento ===
      "topo"
    ) {
      destinoY = 0;
    }

    if (
      alinhamento ===
      "centro-vertical" ||
      alinhamento ===
      "centro-total"
    ) {
      destinoY =
        (
          alturaCracha -
          alturaConjunto
        ) / 2;
    }

    if (
      alinhamento ===
      "base"
    ) {
      destinoY =
        alturaCracha -
        alturaConjunto;
    }

    /*
     * O segredo está aqui:
     *
     * NÃO centralizamos cada objeto.
     * Calculamos apenas o deslocamento
     * necessário para a caixa do grupo.
     */
    const deslocamentoX =
      destinoX - minX;

    const deslocamentoY =
      destinoY - minY;

    objetosAlvo.forEach(
      (item) => {
        const atualizacao:
          Partial<ObjetoCracha> = {};

        /*
         * Só altera X quando aquela
         * ação trabalha no eixo X.
         */
        if (
          alinhamento ===
          "esquerda" ||
          alinhamento ===
          "centro-horizontal" ||
          alinhamento ===
          "direita" ||
          alinhamento ===
          "centro-total"
        ) {
          atualizacao.x =
            Math.round(
              item.x +
              deslocamentoX
            );
        }

        /*
         * Só altera Y quando aquela
         * ação trabalha no eixo Y.
         */
        if (
          alinhamento ===
          "topo" ||
          alinhamento ===
          "centro-vertical" ||
          alinhamento ===
          "base" ||
          alinhamento ===
          "centro-total"
        ) {
          atualizacao.y =
            Math.round(
              item.y +
              deslocamentoY
            );
        }

        atualizarObjeto(
          item.id,
          atualizacao
        );
      }
    );
  }

  function copiarObjetoSelecionado() {
    if (!objetoAtual) return;

    setObjetoCopiado(objetoAtual);

    setAvisoCracha({
      tipo: "sucesso",
      texto: t("messages.objectCopied"),
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
      texto: t("messages.objectPasted"),
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
        texto: t("messages.selectFreePoint"),
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
    const alturaMenu = 330;
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

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarPlanoInstituicaoCracha() {
      try {
        setCarregandoPlanoCracha(true);
        setErroPlanoCracha("");

        const resposta = await fetch(
          "/api/admin/uso-plano",
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            t("plan.checkError")
          );
        }

        const planoNormalizado = String(
          dados?.plano || "ESSENCIAL"
        )
          .trim()
          .toUpperCase()
          .replace(
            "PROFESSIONAL",
            "PROFISSIONAL"
          ) as PlanoCracha;

        const planoValido: PlanoCracha =
          planoNormalizado === "PROFISSIONAL" ||
            planoNormalizado === "ENTERPRISE"
            ? planoNormalizado
            : "ESSENCIAL";

        if (componenteAtivo) {
          setPlanoInstituicaoCracha(planoValido);
        }
      } catch (error: any) {
        console.error(
          "ERRO AO VERIFICAR PLANO PARA CRACHÁS:",
          error
        );

        if (componenteAtivo) {
          setPlanoInstituicaoCracha("ESSENCIAL");
          setErroPlanoCracha(
            t("plan.checkError")
          );
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoPlanoCracha(false);
        }
      }
    }

    void carregarPlanoInstituicaoCracha();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  useEffect(() => {
    if (
      carregandoPlanoCracha ||
      !podeUsarEditorCrachas
    ) {
      return;
    }

    void carregarModelosSalvosCracha(
      tipoModeloCracha
    );
  }, [
    tipoModeloCracha,
    carregandoPlanoCracha,
    podeUsarEditorCrachas,
  ]);

  function anguloGradienteCracha(
    direcao: DirecaoGradienteCracha
  ) {
    /*
     * Convenção visual do editor PHANYX:
     *
     * HORIZONTAL = faixas horizontais
     *               transição de cima para baixo
     *
     * VERTICAL = faixas verticais
     *             transição da esquerda para direita
     */

    if (direcao === "HORIZONTAL") {
      return "180deg";
    }

    if (direcao === "VERTICAL") {
      return "90deg";
    }

    if (direcao === "DIAGONAL_DESC") {
      return "135deg";
    }

    if (direcao === "DIAGONAL_ASC") {
      return "45deg";
    }

    return "180deg";
  }

  function pontosGradienteFundoValidos() {
    const pontos = Array.isArray(gradientePontosFundoCracha)
      ? gradientePontosFundoCracha
      : [];

    const pontosValidos = pontos
      .filter((ponto) => ponto?.cor)
      .map((ponto) => ({
        id: Number(ponto.id || Date.now()),
        cor: ponto.cor || "#ffffff",
        posicao: Math.max(0, Math.min(100, Number(ponto.posicao || 0))),
      }))
      .sort((a, b) => a.posicao - b.posicao);

    if (pontosValidos.length >= 2) {
      return pontosValidos;
    }

    return [
      { id: 1, cor: corFundoCracha || "#ffffff", posicao: 0 },
      {
        id: 2,
        cor: corFundoCrachaSecundaria || corFundoCracha || "#0f172a",
        posicao: 100,
      },
    ];
  }

  function pontoGradienteFundoAtual() {
    const pontos = pontosGradienteFundoValidos();

    return (
      pontos.find((ponto) => ponto.id === pontoGradienteFundoSelecionado) ||
      pontos[0]
    );
  }

  function atualizarPontoGradienteFundo(
    pontoId: number,
    dados: Partial<PontoGradienteCracha>
  ) {
    setPontosGradienteFundoCracha((pontos) =>
      pontos
        .map((ponto) =>
          ponto.id === pontoId
            ? {
              ...ponto,
              ...dados,
              posicao:
                dados.posicao !== undefined
                  ? Math.max(0, Math.min(100, Number(dados.posicao)))
                  : ponto.posicao,
            }
            : ponto
        )
        .sort((a, b) => a.posicao - b.posicao)
    );
  }

  function atualizarCorPontoGradienteFundo(novaCor: string) {
    const pontoAtual = pontoGradienteFundoAtual();

    if (!pontoAtual) return;

    atualizarPontoGradienteFundo(pontoAtual.id, {
      cor: novaCor,
    });
  }

  function iniciarArrastoPontoGradienteFundo(
    e: React.MouseEvent<HTMLButtonElement>,
    ponto: PontoGradienteCracha
  ) {
    e.preventDefault();
    e.stopPropagation();

    setPontoGradienteFundoSelecionado(ponto.id);

    const barra = e.currentTarget.parentElement;

    if (!barra) return;

    const rect = barra.getBoundingClientRect();

    function mover(ev: MouseEvent) {
      const posicao = Math.round(
        ((ev.clientX - rect.left) / rect.width) * 100
      );

      atualizarPontoGradienteFundo(ponto.id, {
        posicao: Math.max(0, Math.min(100, posicao)),
      });
    }

    function soltar() {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
    }

    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
  }

  function adicionarPontoGradienteFundo() {
    const pontosAtuais = pontosGradienteFundoValidos();

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

    setPontosGradienteFundoCracha((pontos) =>
      [...pontos, novoPonto].sort((a, b) => a.posicao - b.posicao)
    );

    setPontoGradienteFundoSelecionado(novoPonto.id);
  }

  function removerPontoGradienteFundoSelecionado() {
    const pontoAtual = pontoGradienteFundoAtual();

    if (!pontoAtual) return;

    setPontosGradienteFundoCracha((pontos) => {
      if (pontos.length <= 2) return pontos;

      const novosPontos = pontos.filter((ponto) => ponto.id !== pontoAtual.id);

      setPontoGradienteFundoSelecionado(novosPontos[0]?.id ?? null);

      return novosPontos;
    });
  }

  function copiarCorPontoGradienteFundo() {
    const pontoAtual = pontoGradienteFundoAtual();

    if (!pontoAtual) return;

    setCorGradienteFundoCopiada(pontoAtual.cor);

    setAvisoCracha({
      tipo: "sucesso",
      texto: t("messages.gradientColorCopied"),
    });

    setTimeout(() => setAvisoCracha(null), 2500);
  }

  function colarCorPontoGradienteFundo() {
    const pontoAtual = pontoGradienteFundoAtual();

    if (!pontoAtual || !corGradienteFundoCopiada) return;

    atualizarPontoGradienteFundo(pontoAtual.id, {
      cor: corGradienteFundoCopiada,
    });

    setAvisoCracha({
      tipo: "sucesso",
      texto: t("messages.gradientColorPasted"),
    });

    setTimeout(() => setAvisoCracha(null), 2500);
  }

  function duplicarPontoGradienteFundoSelecionado() {
    const pontoAtual = pontoGradienteFundoAtual();

    if (!pontoAtual) return;

    const novaPosicao =
      pontoAtual.posicao >= 95
        ? Math.max(0, pontoAtual.posicao - 5)
        : Math.min(100, pontoAtual.posicao + 5);

    const novoPonto: PontoGradienteCracha = {
      id: Date.now(),
      cor: pontoAtual.cor,
      posicao: novaPosicao,
    };

    setPontosGradienteFundoCracha((pontos) =>
      [...pontos, novoPonto].sort((a, b) => a.posicao - b.posicao)
    );

    setPontoGradienteFundoSelecionado(novoPonto.id);

    setAvisoCracha({
      tipo: "sucesso",
      texto: t("messages.gradientPointDuplicated"),
    });

    setTimeout(() => setAvisoCracha(null), 2500);
  }

  function fundoCrachaCss() {
    if (tipoFundoCracha === "GRADIENTE") {
      const pontos =
        pontosGradienteFundoValidos();

      const cores = pontos
        .map(
          (ponto) =>
            `${ponto.cor} ${ponto.posicao}%`
        )
        .join(", ");

      /*
       * Gradiente circular/radial:
       * começa no centro e avança
       * para as extremidades.
       */
      if (
        direcaoGradienteCracha ===
        "CIRCULAR"
      ) {
        return `radial-gradient(
        circle at center,
        ${cores}
      )`;
      }

      return `linear-gradient(
      ${anguloGradienteCracha(
        direcaoGradienteCracha
      )},
      ${cores}
    )`;
    }

    return (
      corFundoCracha ||
      "#ffffff"
    );
  }

  function removerPontoGradienteFundo(id: number) {
    setPontosGradienteFundoCracha((pontos) => {
      if (pontos.length <= 2) return pontos;

      return pontos.filter((ponto) => ponto.id !== id);
    });
  }

  if (carregandoPlanoCracha) {
    return (
      <div className="phanyx-crachas-page p-4">
        <div className="phanyx-crachas-card mx-auto max-w-3xl p-8 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />

          <h1 className="mt-5 text-xl font-black text-slate-900 dark:text-white">
            {t("plan.checkingTitle")}
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("plan.checkingDescription")}</p>
        </div>
      </div>
    );
  }

  if (!podeUsarEditorCrachas) {
    return (
      <div className="phanyx-crachas-page p-4">
        <div className="phanyx-crachas-card mx-auto max-w-3xl overflow-hidden">
          <div className="border-b border-slate-200 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 p-6 text-white dark:border-slate-700">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
              {t("plan.professionalFeature")}
            </p>

            <h1 className="mt-2 text-2xl font-black">
              {t("plan.editorTitle")}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">{t("plan.editorDescription")}</p>
          </div>

          <div className="p-6">
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
              <p className="text-sm font-black">
                {t("plan.notIncludedTitle")}
              </p>

              <p className="mt-2 text-sm leading-6">
                {t("plan.currentPlanPrefix")}{" "}
                <strong>
                  {planoInstituicaoCracha || "ESSENCIAL"}
                </strong>{t("plan.currentPlanSuffix")}</p>

              {erroPlanoCracha && (
                <p className="mt-3 text-xs font-semibold">
                  {t("plan.confirmErrorPrefix")} {erroPlanoCracha}
                </p>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href="/planos"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                {t("plan.viewPlans")}
              </a>

              <a
                href="/admin"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                {t("plan.backDashboard")}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="phanyx-crachas-page relative p-4"
      onMouseDown={() => fecharMenuContexto()}
    >
      <style jsx global>{`
  /*
   * SELECTS DO EDITOR DE CRACHÁS
   * Sistema escuro = neutro, não azul PHANYX
   */

  html[data-theme-choice="system"][data-theme="dark"]
    .phanyx-crachas-page
    select.phanyx-crachas-input,
  html[data-theme-choice="system"][data-theme="dark"]
    .phanyx-crachas-page
    select.phanyx-crachas-input
    option,
  html[data-theme="system"].dark
    .phanyx-crachas-page
    select.phanyx-crachas-input,
  html[data-theme="system"].dark
    .phanyx-crachas-page
    select.phanyx-crachas-input
    option {
    background-color: #18181b !important;
    color: #fafafa !important;
  }

  /*
   * Sistema claro
   */

  html[data-theme-choice="system"][data-theme="light"]
    .phanyx-crachas-page
    select.phanyx-crachas-input,
  html[data-theme-choice="system"][data-theme="light"]
    .phanyx-crachas-page
    select.phanyx-crachas-input
    option,
  html[data-theme="system"]:not(.dark)
    .phanyx-crachas-page
    select.phanyx-crachas-input,
  html[data-theme="system"]:not(.dark)
    .phanyx-crachas-page
    select.phanyx-crachas-input
    option {
    background-color: #ffffff !important;
    color: #0f172a !important;
  }
`}</style>
      <img
        src="/images/phanyx-cracha.png"
        alt={t("plan.editorTitle")}
        className="pointer-events-none absolute -top-20 left-6 z-10 hidden h-24 w-auto select-none opacity-95 drop-shadow-xl lg:block"
      />

      {/* Barra Superior */}
      <div className="phanyx-crachas-card mb-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={novoModeloCracha}
                className="phanyx-crachas-button-primary"
              >
                {t("model.newModelButton")}
              </button>

              <button
                type="button"
                onClick={salvarModeloCracha}
                disabled={salvandoModeloCracha || carregandoModeloCracha || enviandoImagem}
                className="phanyx-crachas-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvandoModeloCracha ? t("common.saving") : t("common.save")}
              </button>

              <button
                type="button"
                onClick={duplicarModeloCracha}
                disabled={salvandoModeloCracha}
                className="phanyx-crachas-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("common.duplicate")}
              </button>

              <button
                type="button"
                onClick={abrirModalEmissaoCracha}
                className="phanyx-crachas-button-secondary"
              >
                {t("common.emit")}
              </button>

              <button
                type="button"
                className="phanyx-crachas-button-secondary"
              >
                {t("common.print")}
              </button>
            </div>

            <div className="w-full max-w-[320px]">
              <label
                className="
      mb-1
      block
      text-xs
      font-bold
      text-slate-600
      dark:text-slate-300
    "
              >
                {t("model.name")}
              </label>

              <input
                type="text"
                value={nomeModeloCracha}
                onChange={(e) =>
                  setNomeModeloCracha(
                    e.target.value
                  )
                }
                placeholder={t("model.namePlaceholder")}
                className="phanyx-crachas-input w-full"
              />
            </div>

            <div
              className="
    flex
    max-w-[620px]
    items-center
    gap-2
    overflow-x-auto
    rounded-2xl
    border
    border-slate-300
    bg-slate-100
    px-2
    py-2
    dark:border-slate-700
    dark:bg-slate-900
  "
            >
              {carregandoModelosSalvos ? (
                <span className="whitespace-nowrap px-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t("common.loading")}
                </span>
              ) : modelosSalvosCracha.length === 0 ? (
                <span className="whitespace-nowrap px-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t("model.noSaved")}
                </span>
              ) : (
                modelosSalvosCracha.map(
                  (modelo) => {
                    const ativo =
                      modelo.id ===
                      modeloCrachaAtualId;

                    return (
                      <div
                        key={modelo.id}
                        className={[
                          "flex shrink-0 items-stretch overflow-hidden rounded-xl border transition",

                          ativo
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white",
                        ].join(" ")}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            aplicarModeloCrachaNaTela(
                              modelo
                            );
                          }}
                          className="
                max-w-[190px]
                truncate
                px-3
                py-2
                text-left
                text-xs
                font-bold
              "
                          title={modelo.nome}
                        >
                          <span className="block truncate">
                            {modelo.nome}
                          </span>

                          {modelo.padrao && (
                            <span
                              className={[
                                "mt-0.5 block text-[9px] font-semibold",

                                ativo
                                  ? "text-blue-100"
                                  : "text-amber-600 dark:text-amber-300",
                              ].join(" ")}
                            >
                              {t("model.default")}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            excluirModeloCracha(
                              modelo.id
                            );
                          }}
                          className={[
                            "flex w-9 items-center justify-center border-l text-base font-black transition",

                            ativo
                              ? "border-blue-500 text-white hover:bg-red-600"
                              : "border-slate-300 text-red-600 hover:bg-red-50 dark:border-slate-700 dark:text-red-300 dark:hover:bg-red-950/40",
                          ].join(" ")}
                          title={t("model.deleteNamed", { name: modelo.nome })}
                          aria-label={t("model.deleteNamed", { name: modelo.nome })}
                        >
                          ×
                        </button>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-4">
            <div className="w-full max-w-[280px] shrink-0">
              <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
                {t("model.type")}
              </label>

              <select
                value={tipoModeloCracha}
                onChange={(e) =>
                  alterarTipoModeloCracha(e.target.value as TipoModeloCracha)
                }
                className="phanyx-crachas-input w-full"
              >
                <option value="ALUNO">{t("model.student")}</option>
                <option value="PROFESSOR">{t("model.teacher")}</option>
                <option value="FUNCIONARIO">{t("model.employee")}</option>
                <option value="VISITANTE">{t("model.visitor")}</option>
                <option value="MEMBRO">{t("model.member")}</option>
                <option value="PERSONALIZADO">{t("model.custom")}</option>
              </select>

              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {t("model.typeHint", { code: "{{codigoCracha}}" })}
              </p>
            </div>

            <div className="flex gap-2 pt-7">
              <button
                type="button"
                onClick={() => {
                  setLado("FRENTE");
                  limparSelecaoCracha();
                }}
                className={`rounded-xl px-4 py-2 font-semibold ${lado === "FRENTE"
                  ? "bg-blue-600 text-white"
                  : "phanyx-crachas-tab-off"
                  }`}
              >
                {t("common.front")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLado("VERSO");
                  limparSelecaoCracha();
                }}
                className={`rounded-xl px-4 py-2 font-semibold ${lado === "VERSO"
                  ? "bg-blue-600 text-white"
                  : "phanyx-crachas-tab-off"
                  }`}
              >
                {t("common.back")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalEmissaoAberto && (
        <div
          className="phanyx-crachas-modal-overlay fixed inset-0 z-[99999] flex items-center justify-center px-4"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            fecharModalEmissaoCracha();
          }}
        >
          <div
            className="phanyx-crachas-modal w-full max-w-2xl rounded-3xl border p-5 shadow-2xl"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="phanyx-crachas-modal-title text-lg font-black">
                  {t("issuance.title")}
                </h2>

                <p className="phanyx-crachas-modal-subtitle mt-1 text-sm">
                  {t("issuance.forModel")}
                  <strong className="ml-1">
                    {nomeTipoModeloCracha(tipoModeloCracha)}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => fecharModalEmissaoCracha()}
                className="phanyx-crachas-modal-close flex h-9 w-9 items-center justify-center rounded-full border text-lg font-black"
                aria-label={t("issuance.close")}
              >
                ×
              </button>
            </div>

            <div className="phanyx-crachas-modal-info rounded-2xl border p-4 text-sm">
              {t("issuance.qrPrefix")}
              <strong className="mx-1">
                {"{{codigoCracha}}"}
              </strong>{t("issuance.qrSuffix")}</div>

            <div className="mt-4">
              <label className="phanyx-crachas-modal-label mb-2 block text-sm font-bold">
                {t("issuance.mode")}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModoEmissaoCracha("INDIVIDUAL");
                    setErroEmissaoCracha("");
                    setFiltroLoteEmissao("");
                  }}
                  className={
                    modoEmissaoCracha === "INDIVIDUAL"
                      ? "phanyx-crachas-button-primary"
                      : "phanyx-crachas-button-secondary"
                  }
                >
                  {t("issuance.individual")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModoEmissaoCracha("LOTE");
                    setErroEmissaoCracha("");
                    setPessoaSelecionadaEmissao(null);
                  }}
                  className={
                    modoEmissaoCracha === "LOTE"
                      ? "phanyx-crachas-button-primary"
                      : "phanyx-crachas-button-secondary"
                  }
                >
                  {t("issuance.batch")}
                </button>
              </div>
            </div>

            {modoEmissaoCracha === "INDIVIDUAL" ? (
              <>
                <div className="mt-4">
                  <label className="phanyx-crachas-modal-label mb-2 block text-sm font-bold">
                    {t("issuance.searchPerson")}
                  </label>

                  <input
                    value={buscaPessoaEmissao}
                    onChange={(e) =>
                      setBuscaPessoaEmissao(e.target.value)
                    }
                    placeholder={placeholderBuscaEmissao(
                      tipoModeloCracha
                    )}
                    className="phanyx-crachas-input w-full"
                  />

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={buscarPessoasParaEmissaoCracha}
                      disabled={carregandoPessoasEmissao}
                      className="phanyx-crachas-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {carregandoPessoasEmissao
                        ? t("issuance.searching")
                        : t("issuance.searchPerson")}
                    </button>
                  </div>
                </div>

                {erroEmissaoCracha && (
                  <div className="phanyx-crachas-alert-error mt-4 rounded-2xl border p-3 text-sm font-semibold">
                    {erroEmissaoCracha}
                  </div>
                )}

                <div className="phanyx-crachas-pessoas-box mt-4 rounded-2xl border border-dashed p-4 text-sm">
                  {pessoasEmissaoCracha.length > 0 ? (
                    <div className="space-y-2">
                      {pessoasEmissaoCracha.map((pessoa) => {
                        const selecionada =
                          pessoaSelecionadaEmissao?.id ===
                          pessoa.id &&
                          pessoaSelecionadaEmissao?.tipo ===
                          pessoa.tipo;

                        return (
                          <button
                            key={`${pessoa.tipo}-${pessoa.id}`}
                            type="button"
                            onClick={() => {
                              setPessoaSelecionadaEmissao(
                                pessoa
                              );
                              setErroEmissaoCracha("");
                            }}
                            className={[
                              "phanyx-crachas-pessoa-item",
                              selecionada
                                ? "phanyx-crachas-pessoa-item-selecionada"
                                : "",
                            ].join(" ")}
                          >
                            <div className="min-w-0">
                              <p className="phanyx-crachas-pessoa-nome font-bold">
                                {pessoa.nome}
                              </p>

                              {pessoa.descricao && (
                                <p className="phanyx-crachas-pessoa-descricao mt-1 text-xs">
                                  {pessoa.descricao}
                                </p>
                              )}
                            </div>

                            <span
                              className={
                                pessoa.aptoParaCracha
                                  ? "phanyx-crachas-status phanyx-crachas-status-com-foto"
                                  : "phanyx-crachas-status phanyx-crachas-status-sem-foto"
                              }
                            >
                              {pessoa.aptoParaCracha
                                ? t("issuance.withPhoto")
                                : t("issuance.withoutPhoto")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="phanyx-crachas-modal-muted">
                      {t("issuance.noPeoplePrompt")}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mt-4">
                  <label className="phanyx-crachas-modal-label mb-2 block text-sm font-bold">
                    {t("issuance.filter")}
                  </label>

                  <select
                    value={filtroLoteEmissao}
                    onChange={(e) => {
                      setFiltroLoteEmissao(
                        e.target.value
                      );
                      setErroEmissaoCracha("");
                    }}
                    className="phanyx-crachas-input w-full"
                  >
                    <option value="">
                      {t("issuance.selectFilter")}
                    </option>

                    {opcoesLotePorTipo(
                      tipoModeloCracha
                    ).map((opcao) => (
                      <option
                        key={opcao.valor}
                        value={opcao.valor}
                      >
                        {opcao.rotulo}
                      </option>
                    ))}
                  </select>

                  <p className="phanyx-crachas-modal-muted mt-2 text-xs">{t("issuance.batchInfo")}</p>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={buscarPessoasParaEmissaoCracha}
                      disabled={carregandoPessoasEmissao}
                      className="phanyx-crachas-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {carregandoPessoasEmissao ? t("issuance.processing") : t("issuance.previewBatch")}
                    </button>
                  </div>
                </div>

                {erroEmissaoCracha && (
                  <div className="phanyx-crachas-alert-error mt-4 rounded-2xl border p-3 text-sm font-semibold">
                    {erroEmissaoCracha}
                  </div>
                )}

                <div className="phanyx-crachas-lote-box mt-4 rounded-2xl border border-dashed p-4 text-sm">
                  {resumoEmissaoCracha ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="phanyx-crachas-resumo-card phanyx-crachas-resumo-total rounded-2xl border p-3">
                          <p className="text-xs font-bold">
                            {t("issuance.totalFound")}
                          </p>

                          <strong className="text-2xl">
                            {resumoEmissaoCracha.total}
                          </strong>
                        </div>

                        <div className="phanyx-crachas-resumo-card phanyx-crachas-resumo-apto rounded-2xl border p-3">
                          <p className="text-xs font-bold">
                            {t("issuance.eligiblePhoto")}
                          </p>

                          <strong className="text-2xl">
                            {resumoEmissaoCracha.aptos}
                          </strong>
                        </div>

                        <div className="phanyx-crachas-resumo-card phanyx-crachas-resumo-pendente rounded-2xl border p-3">
                          <p className="text-xs font-bold">
                            {t("issuance.pendingPhoto")}
                          </p>

                          <strong className="text-2xl">
                            {
                              resumoEmissaoCracha
                                .pendentesFoto
                            }
                          </strong>
                        </div>
                      </div>

                      {resumoEmissaoCracha.pendentesFoto >
                        0 && (
                          <p className="phanyx-crachas-alert-warning rounded-2xl border p-3 text-xs font-semibold">{t("issuance.photoWarning")}</p>
                        )}
                    </div>
                  ) : (
                    <p className="phanyx-crachas-modal-muted">{t("issuance.previewHint")}</p>
                  )}
                </div>
              </>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => fecharModalEmissaoCracha()}
                disabled={emitindoCracha}
                className="phanyx-crachas-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                onClick={continuarEmissaoCracha}
                disabled={
                  emitindoCracha ||
                  carregandoPessoasEmissao
                }
                className="phanyx-crachas-button-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {emitindoCracha
                  ? t("issuance.emitting")
                  : modoEmissaoCracha ===
                    "INDIVIDUAL"
                    ? t("issuance.emitBadge")
                    : t("common.continue")}
              </button>
            </div>
          </div>
        </div>
      )}

      {avisoCracha && (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${avisoCracha.tipo === "sucesso"
            ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
            : "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200"
            }`}
        >
          {avisoCracha.texto}
        </div>
      )}

      {menuContexto.aberto && menuContexto.objetoId && (
        <div
          className="phanyx-crachas-context-menu fixed w-56 rounded-2xl border p-2 text-sm font-semibold shadow-2xl"
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
            className="phanyx-crachas-context-drag mb-2 cursor-move rounded-xl border px-3 py-2 text-xs font-bold"
          >
            {t("menu.drag")}
          </div>

          <button
            type="button"
            onClick={() =>
              trazerObjetoParaFrentePorId(
                menuContexto.objetoId!
              )
            }
            className="phanyx-crachas-context-item"
          >
            {t("menu.bringFront")}
          </button>

          <button
            type="button"
            onClick={() =>
              enviarObjetoParaTrasPorId(
                menuContexto.objetoId!
              )
            }
            className="phanyx-crachas-context-item"
          >
            {t("menu.sendBack")}
          </button>

          <button
            type="button"
            onClick={() =>
              duplicarObjetoPorId(
                menuContexto.objetoId!
              )
            }
            className="phanyx-crachas-context-item"
          >
            {t("common.duplicate")}
          </button>

          <div className="phanyx-crachas-context-divider my-1 border-t" />

          <button
            type="button"
            onClick={
              agruparObjetosSelecionados
            }
            disabled={
              objetosSelecionadosIds.length <
              2
            }
            className="phanyx-crachas-context-item disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("menu.group")}
            {objetosSelecionadosIds.length >=
              2
              ? ` (${objetosSelecionadosIds.length})`
              : ""}
          </button>

          <button
            type="button"
            onClick={() =>
              desagruparObjetoPorId(
                menuContexto.objetoId!
              )
            }
            disabled={
              objetos.find(
                (objeto) =>
                  objeto.id ===
                  menuContexto.objetoId
              )?.grupoId === undefined
            }
            className="phanyx-crachas-context-item disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("menu.ungroup")}
          </button>

          <div className="phanyx-crachas-context-divider my-1 border-t" />

          <button
            type="button"
            onClick={() =>
              excluirObjetoPorId(
                menuContexto.objetoId!
              )
            }
            className="phanyx-crachas-context-item phanyx-crachas-context-delete"
          >
            {t("common.delete")}
          </button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">

        {/* Ferramentas */}

        <div className="phanyx-crachas-card col-span-2 p-4">
          <h2 className="mb-4 font-bold">
            {t("menu.tools")}
          </h2>

          <div className="space-y-2">
            <button
              type="button"
              onClick={adicionarTexto}
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t("menu.text")}
            </button>

            <button
              type="button"
              onClick={adicionarCampoDinamico}
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t("menu.field")}
            </button>

            <button
              type="button"
              onClick={adicionarFoto}
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t("menu.photo")}
            </button>

            <button
              type="button"
              onClick={adicionarLogo}
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t("menu.logo")}
            </button>

            <button
              type="button"
              onClick={() => inputImagemRef.current?.click()}
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t("menu.image")}
            </button>

            <button
              type="button"
              onClick={adicionarForma}
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t("menu.shape")}
            </button>

            <button
              type="button"
              onClick={adicionarQrCode}
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t("menu.qr")}
            </button>

            <button
              type="button"
              onClick={adicionarCodigoBarras}
              className="phanyx-crachas-tool-button w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {t("menu.barcode")}
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
            ref={crachaAreaRef}
            onMouseDown={
              iniciarSelecaoPorArea
            }
            className="phanyx-cracha-paper relative overflow-hidden shadow-xl"
            style={{
              ["--cor-fundo-cracha" as any]: fundoCrachaCss(),
              background: fundoCrachaCss(),
              backgroundImage: fundoCrachaCss(),

              color: "#0f172a",
              WebkitTextFillColor: "#0f172a",
              isolation: "isolate",

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

            {selecaoPorArea.ativo && (
              <div
                style={{
                  position:
                    "absolute",

                  left:
                    selecaoPorArea.x,

                  top:
                    selecaoPorArea.y,

                  width:
                    selecaoPorArea.largura,

                  height:
                    selecaoPorArea.altura,

                  border:
                    "1.5px solid #2563eb",

                  background:
                    "rgba(37, 99, 235, 0.12)",

                  pointerEvents:
                    "none",

                  zIndex:
                    999998,

                  boxSizing:
                    "border-box",
                }}
              />
            )}

            {renderFuroCracha()}

            {(() => {
              const caixa =
                caixaDoGrupoSelecionado();

              if (!caixa) {
                return null;
              }

              return (
                <div
                  style={{
                    position:
                      "absolute",

                    left:
                      caixa.x - 4,

                    top:
                      caixa.y - 4,

                    width:
                      caixa.largura + 8,

                    height:
                      caixa.altura + 8,

                    border:
                      "2px dashed #2563eb",

                    borderRadius:
                      6,

                    pointerEvents:
                      "none",

                    zIndex:
                      999999,
                  }}
                >
                  <div
                    style={{
                      position:
                        "absolute",

                      left:
                        "50%",

                      top:
                        -24,

                      transform:
                        "translateX(-50%)",

                      padding:
                        "2px 7px",

                      borderRadius:
                        6,

                      background:
                        "#2563eb",

                      color:
                        "#ffffff",

                      fontSize:
                        10,

                      fontWeight:
                        700,

                      whiteSpace:
                        "nowrap",
                    }}
                  >{t("properties.group")}</div>
                  <span
                    onMouseDown={(e) =>
                      iniciarRedimensionamentoGrupo(
                        e,
                        caixa
                      )
                    }
                    style={{
                      position:
                        "absolute",

                      right:
                        -7,

                      bottom:
                        -7,

                      width:
                        14,

                      height:
                        14,

                      borderRadius:
                        9999,

                      border:
                        "2px solid #2563eb",

                      background:
                        "#ffffff",

                      cursor:
                        "nwse-resize",

                      pointerEvents:
                        "auto",

                      boxSizing:
                        "border-box",

                      zIndex:
                        1000000,
                    }}
                  />
                </div>
              );
            })()}

            {[...objetos]

              .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
              .map((objeto) => {

                if (objeto.tipo === "TEXTO") {
                  return (
                    <div
                      key={objeto.id}
                      onContextMenu={(e) => abrirMenuContexto(e, objeto.id)}
                      onMouseDown={(e) =>
                        iniciarArrastoObjetoCracha(
                          e,
                          objeto
                        )
                      }
                      style={{
                        position: "absolute",
                        left: objeto.x,
                        top: objeto.y,
                        width: objeto.largura,
                        height: objeto.altura,

                        transform:
                          `rotate(${objeto.rotacao ?? 0}deg)`,

                        transformOrigin:
                          "center center",

                        fontSize: objeto.fonte,
                        fontFamily: fonteCssCracha(objeto.fonteFamilia),
                        color: objeto.cor || "#000000",
                        WebkitTextFillColor: objeto.cor || "#000000",
                        textShadow: sombraTextoCss(objeto),
                        cursor: "move",
                        padding: "2px 4px",
                        textAlign: objeto.alinhamento || "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          objeto.alinhamento === "left"
                            ? "flex-start"
                            : objeto.alinhamento === "right"
                              ? "flex-end"
                              : "center",
                        whiteSpace: "normal",
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                        lineHeight: "1.15",
                        overflow: "visible",
                        boxSizing: "border-box",
                        border:
                          mostrarControlesIndividuais(
                            objeto
                          )
                            ? "1px dashed #2563eb"
                            : "1px solid transparent",
                        zIndex: zIndexObjetoCracha(objeto),
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                          color: objeto.cor || "#000000",
                          WebkitTextFillColor: objeto.cor || "#000000",
                          fontFamily: fonteCssCracha(objeto.fonteFamilia),
                          textAlign: objeto.alinhamento || "center",
                          whiteSpace: "normal",
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                          lineHeight: "1.15",
                          overflow: "hidden",
                        }}
                      >
                        {objeto.texto}
                      </span>

                      {mostrarControlesIndividuais(objeto) && (
                        <BotaoExcluirObjeto />
                      )}

                      <AlcaRotacaoObjeto
                        objeto={objeto}
                      />

                      {mostrarControlesIndividuais(objeto) && (
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
                      onMouseDown={(e) =>
                        iniciarArrastoObjetoCracha(
                          e,
                          objeto
                        )
                      }
                      style={{
                        position: "absolute",
                        left: objeto.x,
                        top: objeto.y,
                        width: objeto.largura,
                        height: objeto.altura,

                        transform:
                          `rotate(${objeto.rotacao ?? 0}deg)`,

                        transformOrigin:
                          "center center",

                        fontSize: objeto.fonte,
                        fontFamily: fonteCssCracha(objeto.fonteFamilia),
                        color: objeto.cor || "#000000",
                        WebkitTextFillColor: objeto.cor || "#000000",
                        textShadow: sombraTextoCss(objeto),
                        cursor: "move",
                        padding: "2px 4px",
                        textAlign: objeto.alinhamento || "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent:
                          objeto.alinhamento === "left"
                            ? "flex-start"
                            : objeto.alinhamento === "right"
                              ? "flex-end"
                              : "center",
                        whiteSpace: "normal",
                        overflowWrap: "break-word",
                        wordBreak: "break-word",
                        lineHeight: "1.15",
                        overflow: "visible",
                        boxSizing: "border-box",
                        border:
                          objetoEstaSelecionado(objeto.id)
                            ? "1px dashed #2563eb"
                            : "1px solid transparent",
                        zIndex: zIndexObjetoCracha(objeto),
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                          color: objeto.cor || "#000000",
                          WebkitTextFillColor: objeto.cor || "#000000",
                          fontFamily: fonteCssCracha(objeto.fonteFamilia),
                          textAlign: objeto.alinhamento || "center",
                          textShadow: sombraTextoCss(objeto),
                          whiteSpace: "normal",
                          overflowWrap: "break-word",
                          wordBreak: "break-word",
                          lineHeight: "1.15",
                          overflow: "hidden",
                        }}
                      >
                        {objeto.campo}
                      </span>

                      {mostrarControlesIndividuais(objeto) && <BotaoExcluirObjeto />}
                      <AlcaRotacaoObjeto
                        objeto={objeto}
                      />
                    </div>
                  );
                }

                if (objeto.tipo === "IMAGEM") {
                  const ehPlaceholder = !objeto.url;
                  const corPlaceholder = "#334155";
                  const fundoPlaceholder = "#f8fafc";
                  const bordaPlaceholder = "#94a3b8";

                  return (
                    <div
                      key={objeto.id}
                      onContextMenu={(e) => abrirMenuContexto(e, objeto.id)}
                      onMouseDown={(e) =>
                        iniciarArrastoObjetoCracha(
                          e,
                          objeto
                        )
                      }
                      style={{
                        position: "absolute",
                        left: objeto.x,
                        top: objeto.y,
                        width: objeto.largura,
                        height: objeto.altura,

                        transform: `rotate(${objeto.rotacao ?? 0}deg)`,
                        transformOrigin: "center center",

                        cursor: "move",
                        overflow: "visible",
                        border: mostrarControlesIndividuais(objeto)
                          ? "1px dashed #2563eb"
                          : ehPlaceholder
                            ? `1px solid ${bordaPlaceholder}`
                            : "1px solid transparent",
                        borderRadius: objeto.raioBorda,
                        boxShadow: sombraImagemBoxCss(objeto),
                        zIndex: zIndexObjetoCracha(objeto),
                        opacity: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: objeto.raioBorda,
                          overflow: "hidden",
                          background: ehPlaceholder ? fundoPlaceholder : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: corPlaceholder,
                          WebkitTextFillColor: corPlaceholder,
                          fontSize: 12,
                          fontWeight: 700,
                          textAlign: "center",

                          filter: sombraImagemDropCss(objeto),
                        }}
                      >
                        {objeto.url ? (
                          <img
                            src={objeto.url}
                            alt={
                              objeto.origem === "FOTO"
                                ? t("common.photo")
                                : objeto.origem === "LOGO"
                                  ? t("common.logo")
                                  : t("common.image")
                            }
                            className="h-full w-full"
                            style={{
                              objectFit: objeto.ajusteImagem || "contain",
                              background: "transparent",
                            }}
                          />
                        ) : (
                          <span
                            className="px-2 text-center leading-tight"
                            style={{
                              color: corPlaceholder,
                              WebkitTextFillColor: corPlaceholder,
                              opacity: 1,
                            }}
                          >
                            {objeto.origem === "FOTO"
                              ? t("common.photo")
                              : objeto.origem === "LOGO"
                                ? t("common.logo")
                                : t("common.image")}
                          </span>
                        )}
                      </div>

                      {mostrarControlesIndividuais(objeto) && (
                        <BotaoExcluirObjeto />
                      )}

                      <AlcaRotacaoObjeto
                        objeto={objeto}
                      />

                      {mostrarControlesIndividuais(objeto) && (
                        <>
                          <span
                            onMouseDown={(e) => redimensionarImagem(e, objeto, "nw")}
                            className="absolute -left-1.5 -top-1.5 z-20 h-3 w-3 phanyx-cracha-alca-imagem rounded-full"
                            style={{ cursor: "nwse-resize" }}
                          />

                          <span
                            onMouseDown={(e) => redimensionarImagem(e, objeto, "ne")}
                            className="absolute -right-1.5 -top-1.5 z-20 h-3 w-3 phanyx-cracha-alca-imagem rounded-full"
                            style={{ cursor: "nesw-resize" }}
                          />

                          <span
                            onMouseDown={(e) => redimensionarImagem(e, objeto, "sw")}
                            className="absolute -bottom-1.5 -left-1.5 z-20 h-3 w-3 phanyx-cracha-alca-imagem rounded-full"
                            style={{ cursor: "nesw-resize" }}
                          />

                          <span
                            onMouseDown={(e) => redimensionarImagem(e, objeto, "se")}
                            className="absolute -bottom-1.5 -right-1.5 z-20 h-3 w-3 phanyx-cracha-alca-imagem rounded-full"
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
                      onMouseDown={(e) =>
                        iniciarArrastoObjetoCracha(
                          e,
                          objeto
                        )
                      }
                      style={{
                        position: "absolute",
                        left: objeto.x,
                        top: objeto.y,
                        width: objeto.largura,
                        height: objeto.altura,

                        transform:
                          `rotate(${objeto.rotacao ?? 0}deg)`,

                        transformOrigin:
                          "center center",

                        cursor: "move",
                        overflow: "visible",
                        border:
                          mostrarControlesIndividuais(
                            objeto
                          )
                            ? "1px dashed #2563eb"
                            : "1px solid transparent",
                        borderRadius: objeto.raioBorda,
                        boxShadow: sombraQrCodeCss(objeto),
                        zIndex: zIndexObjetoCracha(objeto),
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

                      {mostrarControlesIndividuais(objeto) && (
                        <BotaoExcluirObjeto />
                      )}

                      <AlcaRotacaoObjeto
                        objeto={objeto}
                      />

                      {mostrarControlesIndividuais(objeto) && (
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

                if (objeto.tipo === "CODIGO_BARRAS") {
                  return (
                    <div
                      key={objeto.id}
                      onContextMenu={(e) => abrirMenuContexto(e, objeto.id)}
                      onMouseDown={(e) =>
                        iniciarArrastoObjetoCracha(
                          e,
                          objeto
                        )
                      }
                      style={{
                        position: "absolute",
                        left: objeto.x,
                        top: objeto.y,
                        width: objeto.largura,
                        height: objeto.altura,

                        transform:
                          `rotate(${objeto.rotacao ?? 0}deg)`,

                        transformOrigin:
                          "center center",

                        cursor: "move",
                        overflow: "visible",
                        border:
                          objetoEstaSelecionado(objeto.id)
                            ? "1px dashed #2563eb"
                            : "1px solid transparent",
                        borderRadius: objeto.raioBorda,
                        background:
                          objeto.mostrarFundo !== false
                            ? objeto.corFundo || "#ffffff"
                            : "transparent",
                        zIndex: zIndexObjetoCracha(objeto),
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: objeto.raioBorda,
                          overflow: "hidden",
                          background:
                            objeto.mostrarFundo !== false
                              ? objeto.corFundo || "#ffffff"
                              : "transparent",
                          padding: 4,
                        }}
                      >
                        <CodigoBarrasPreview
                          valor={objeto.valor || "{{codigoCracha}}"}
                          cor={objeto.cor || "#000000"}
                          corFundo={objeto.corFundo || "#ffffff"}
                          mostrarFundo={objeto.mostrarFundo !== false}
                          mostrarTexto={!!objeto.mostrarTexto}
                          altura={objeto.altura}
                        />
                      </div>

                      {mostrarControlesIndividuais(objeto) && <BotaoExcluirObjeto />}
                      <AlcaRotacaoObjeto
                        objeto={objeto}
                      />
                    </div>
                  );
                }

                if (objeto.tipo === "FORMA") {
                  return (
                    <div
                      key={objeto.id}
                      data-forma-livre-area={objeto.id}
                      onContextMenu={(e) => abrirMenuContexto(e, objeto.id)}
                      onMouseDown={(e) =>
                        iniciarArrastoObjetoCracha(
                          e,
                          objeto
                        )
                      }
                      style={{
                        position: "absolute",
                        left: objeto.x,
                        top: objeto.y,
                        width: objeto.largura,
                        height: objeto.altura,

                        transform:
                          `rotate(${objeto.rotacao ?? 0}deg)`,

                        transformOrigin:
                          "center center",

                        zIndex: zIndexObjetoCracha(objeto),
                        cursor: "move",
                        overflow: "visible",
                        backgroundColor: "transparent",
                        border: "none",
                        opacity: 1,
                        boxSizing: "border-box",
                        outline:
                          mostrarControlesIndividuais(objeto)
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
                        }}
                      >
                        <defs>{renderGradienteForma(objeto)}</defs>
                        {renderFormaSvg(objeto)}
                      </svg>

                      {mostrarControlesIndividuais(objeto) &&
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

                      {mostrarControlesIndividuais(objeto) &&
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
                            title={t("common.point", { value: ponto.id })}
                            className={`absolute z-30 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow ${objeto.pontosLivresSelecionadosIds?.includes(ponto.id)
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

                      {mostrarControlesIndividuais(objeto) &&
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
                                  title={t("shape.handleIn")}
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
                                  title={t("shape.handleOut")}
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

                      {mostrarControlesIndividuais(objeto) && (
                        <BotaoExcluirObjeto />
                      )}

                      <AlcaRotacaoObjeto
                        objeto={objeto}
                      />

                      {mostrarControlesIndividuais(objeto) && (
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
            {t("properties.title")}
          </h2>

          {objetoAtual && (
            <div className="mb-4 rounded-2xl border border-slate-700/40 p-3">
              <p className="mb-2 text-sm font-bold">
                {t("properties.layer")}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={trazerParaFrente}
                  className="phanyx-crachas-button-secondary text-xs"
                >
                  {t("menu.bringFront")}
                </button>

                <button
                  type="button"
                  onClick={enviarParaTras}
                  className="phanyx-crachas-button-secondary text-xs"
                >
                  {t("menu.sendBack")}
                </button>
              </div>
            </div>
          )}

          {!objetoAtual && (
            <p className="phanyx-crachas-muted">
              {t("properties.noneSelected")}
            </p>
          )}

          {objetoAtual?.tipo === "TEXTO" && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-semibold">
                  {t("common.text")}
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
                  {t("properties.font")}
                </label>

                <select
                  value={objetoAtual.fonteFamilia || "Arial"}
                  onChange={(e) =>
                    atualizarObjeto(objetoAtual.id, {
                      fonteFamilia: e.target.value,
                    })
                  }
                  className="phanyx-crachas-input"
                  style={{
                    fontFamily: fonteCssCracha(objetoAtual.fonteFamilia || "Arial"),
                  }}
                >
                  {FONTES_WINDOWS.map((fonte) => (
                    <option
                      key={fonte}
                      value={fonte}
                      style={{ fontFamily: fonteCssCracha(fonte) }}
                    >
                      {fonte}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  {t("properties.size")}
                </label>
                <div className="rounded-2xl border border-slate-700/40 p-3">
                  <p className="mb-3 text-sm font-bold">
                    {t("properties.textAlignment")}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {(["left", "center", "right"] as const).map((alinhamento) => (
                      <button
                        key={alinhamento}
                        type="button"
                        onClick={() =>
                          atualizarObjeto(objetoAtual.id, {
                            alinhamento,
                          })
                        }
                        className={`rounded-xl border px-3 py-2 text-xs font-bold ${objetoAtual.alinhamento === alinhamento
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-slate-600 bg-slate-900 text-slate-200"
                          }`}
                      >
                        {alinhamento === "left"
                          ? t("properties.left")
                          : alinhamento === "center"
                            ? t("common.center")
                            : t("properties.right")}
                      </button>
                    ))}
                  </div>
                </div>
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
                    {t("common.width")}
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
                    {t("common.height")}
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
                    {t("common.x")}
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
                    {t("common.y")}
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
                  {t("properties.alignBox")}
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
                      className={`h-10 w-10 rounded-xl border text-lg font-bold transition ${item.valor === "center"
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
                  {t("common.color")}
                </label>

                <input
                  type="color"
                  value={objetoAtual.cor || "#000000"}
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
                  {t("properties.shadowText")}
                </label>

                {objetoAtual.sombraAtiva && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold">{t("common.x")}</label>
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
                        <label className="mb-1 block text-xs font-semibold">{t("common.y")}</label>
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
                        <label className="mb-1 block text-xs font-semibold">{t("common.blur")}</label>
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
                        {t("properties.shadowColor")}
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
                  {t("properties.dynamicField")}
                </label>

                <select
                  value={objetoAtual.campo}
                  onChange={(e) => {
                    const campoSelecionado = camposDisponiveisPorTipo(
                      tipoModeloCracha
                    ).find((item) => item.campo === e.target.value);

                    atualizarObjeto(objetoAtual.id, {
                      campo: e.target.value,
                      rotulo: campoSelecionado?.rotulo || objetoAtual.rotulo,
                    });
                  }}
                  className="phanyx-crachas-input"
                >
                  {camposDisponiveisPorTipo(tipoModeloCracha).map((campo) => (
                    <option key={campo.campo} value={campo.campo}>
                      {campo.rotulo}
                    </option>
                  ))}
                </select>

                <div className="mt-4 rounded-2xl border border-slate-700/40 p-3">
                  <p className="mb-3 text-sm font-bold">
                    {t("properties.textAlignment")}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    {(["left", "center", "right"] as const).map((alinhamento) => (
                      <button
                        key={alinhamento}
                        type="button"
                        onClick={() =>
                          atualizarObjeto(objetoAtual.id, {
                            alinhamento,
                          })
                        }
                        className={`rounded-xl border px-3 py-2 text-xs font-bold ${objetoAtual.alinhamento === alinhamento
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-slate-600 bg-slate-900 text-slate-200"
                          }`}
                      >
                        {alinhamento === "left"
                          ? t("properties.left")
                          : alinhamento === "center"
                            ? t("common.center")
                            : t("properties.right")}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {t("properties.dynamicHint")}
                </p>
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  {t("properties.font")}
                </label>

                <select
                  value={objetoAtual.fonteFamilia || "Arial"}
                  onChange={(e) =>
                    atualizarObjeto(objetoAtual.id, {
                      fonteFamilia: e.target.value,
                    })
                  }
                  className="phanyx-crachas-input"
                  style={{
                    fontFamily: fonteCssCracha(objetoAtual.fonteFamilia || "Arial"),
                  }}
                >
                  {FONTES_WINDOWS.map((fonte) => (
                    <option
                      key={fonte}
                      value={fonte}
                      style={{ fontFamily: fonteCssCracha(fonte) }}
                    >
                      {fonte}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold">
                  {t("properties.size")}
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
                    {t("common.x")}
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
                    {t("common.y")}
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
                    {t("common.width")}
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
                    {t("common.height")}
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
                  {t("common.color")}
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
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={Boolean(objetoAtual.sombraAtiva)}
                    onChange={(e) =>
                      atualizarObjeto(objetoAtual.id, {
                        sombraAtiva: e.target.checked,
                      })
                    }
                  />

                  {t("properties.shadowProjected")}
                </label>

                {objetoAtual.sombraAtiva && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold">
                          {t("common.x")}
                        </label>

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
                        <label className="mb-1 block text-xs font-semibold">
                          {t("common.y")}
                        </label>

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
                          {t("common.blur")}
                        </label>

                        <input
                          type="number"
                          min={0}
                          value={objetoAtual.sombraBlur ?? 4}
                          onChange={(e) =>
                            atualizarObjeto(objetoAtual.id, {
                              sombraBlur: Math.max(
                                0,
                                Number(e.target.value)
                              ),
                            })
                          }
                          className="phanyx-crachas-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold">
                        {t("properties.shadowColor")}
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

          {objetosSelecionadosIds.length >= 2 && (
            <div className="mb-4 rounded-2xl border border-slate-700/40 p-3">
              <p className="mb-2 text-sm font-bold">
                {t("properties.alignSelected")}
              </p>

              <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400">
                {t("properties.alignSelectedHint")}
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    alinharObjetoSelecionadoComReferencia("centro-horizontal")
                  }
                  className="rounded-xl border border-slate-600 bg-slate-900 px-2 py-2 text-xs font-bold text-slate-200 hover:border-blue-400 hover:bg-blue-500/10"
                >
                  {t("properties.centerX")}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    alinharObjetoSelecionadoComReferencia("centro-vertical")
                  }
                  className="rounded-xl border border-slate-600 bg-slate-900 px-2 py-2 text-xs font-bold text-slate-200 hover:border-blue-400 hover:bg-blue-500/10"
                >
                  {t("properties.centerY")}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    alinharObjetoSelecionadoComReferencia("centro-total")
                  }
                  className="rounded-xl border border-emerald-600 bg-emerald-700 px-2 py-2 text-xs font-bold text-white hover:bg-emerald-600"
                >
                  {t("properties.centerTotal")}
                </button>
              </div>
            </div>
          )}

          {objetoAtual && (
            <div className="rounded-2xl border border-slate-700/40 p-3">
              <p className="mb-3 text-sm font-bold">
                {t("properties.alignBadge")}
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => alinharObjetoNoCracha("esquerda")}
                  className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"
                >
                  {t("properties.left")}
                </button>

                <button
                  type="button"
                  onClick={() => alinharObjetoNoCracha("centro-horizontal")}
                  className="rounded-xl border border-blue-500 bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                >
                  {t("common.center")}
                </button>

                <button
                  type="button"
                  onClick={() => alinharObjetoNoCracha("direita")}
                  className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"
                >
                  {t("properties.right")}
                </button>

                <button
                  type="button"
                  onClick={() => alinharObjetoNoCracha("topo")}
                  className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"
                >
                  {t("common.top")}
                </button>

                <button
                  type="button"
                  onClick={() => alinharObjetoNoCracha("centro-vertical")}
                  className="rounded-xl border border-blue-500 bg-blue-600 px-3 py-2 text-xs font-bold text-white"
                >
                  {t("properties.middle")}
                </button>

                <button
                  type="button"
                  onClick={() => alinharObjetoNoCracha("base")}
                  className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"
                >
                  {t("common.bottom")}
                </button>
              </div>

              <button
                type="button"
                onClick={() => alinharObjetoNoCracha("centro-total")}
                className="mt-3 w-full rounded-xl border border-emerald-500 bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
              >
                {t("properties.centerBadge")}
              </button>
            </div>
          )}

          {objetoAtual?.tipo === "IMAGEM" && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block font-semibold">
                  {t("image.type")}
                </label>
                <div>
                  <label className="mb-2 block font-semibold">
                    {t("image.fit")}
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
                    <option value="cover">{t("image.fillCrop")}</option>
                    <option value="contain">{t("image.showEntire")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block font-semibold">
                    {t("common.image")}
                  </label>

                  <button
                    type="button"
                    onClick={() => inputImagemObjetoRef.current?.click()}
                    disabled={enviandoImagem}
                    className="phanyx-crachas-button-secondary w-full"
                  >
                    {t("image.choose")}
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
                  <option value="FOTO">{t("common.photo")}</option>
                  <option value="LOGO">{t("common.logo")}</option>
                  <option value="UPLOAD">{t("image.uploaded")}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-2 block font-semibold">{t("common.x")}</label>
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
                  <label className="mb-2 block font-semibold">{t("common.y")}</label>
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
                    {t("common.width")}
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
                    {t("common.height")}
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
                  {t("properties.rounding")}
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
                  />{t("properties.imageShadow")}</label>

                {objetoAtual.sombraAtiva && (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-2 block text-xs font-semibold">{t("properties.shadowType")}</label>

                      <select
                        value={objetoAtual.sombraModo ?? "DROP"}
                        onChange={(e) =>
                          atualizarObjeto(objetoAtual.id, {
                            sombraModo: e.target.value as "DROP" | "BOX",
                          })
                        }
                        className="phanyx-crachas-input"
                      >
                        <option value="DROP">{t("image.border")}</option>
                        <option value="BOX">{t("image.boxShadow")}</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold">{t("common.x")}</label>
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
                        <label className="mb-1 block text-xs font-semibold">{t("common.y")}</label>
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
                        <label className="mb-1 block text-xs font-semibold">{t("common.blur")}</label>
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
                        {t("properties.shadowColor")}
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
                  {t("common.shape")}
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
                        arredondamentoPontas: 0,
                        arredondamentoReentrancias: 0,
                        circularidadePontas: 0,
                        circularidadeReentrancias: 0,
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
                  <option value="RETANGULO">{t("shape.rectangle")}</option>
                  <option value="PILULA">{t("shape.pill")}</option>
                  <option value="CIRCULO">{t("shape.circle")}</option>
                  <option value="OVAL">{t("shape.oval")}</option>
                  <option value="LINHA">{t("shape.line")}</option>
                  <option value="TRIANGULO">{t("shape.triangle")}</option>
                  <option value="LOSANGO">{t("shape.diamond")}</option>
                  <option value="PARALELOGRAMO">{t("shape.parallelogram")}</option>
                  <option value="SETA_DIREITA">{t("shape.arrowRight")}</option>
                  <option value="SETA_ESQUERDA">{t("shape.arrowLeft")}</option>
                  <option value="SETA_CIMA">{t("shape.arrowUp")}</option>
                  <option value="SETA_BAIXO">{t("shape.arrowDown")}</option>
                  <option value="SETA_DUPLA_HORIZONTAL">{t("shape.doubleArrowHorizontal")}</option>
                  <option value="SETA_DUPLA_VERTICAL">{t("shape.doubleArrowVertical")}</option>
                  <option value="ESTRELA">{t("shape.star")}</option>
                  <option value="FORMA_LIVRE">{t("shape.freeform")}</option>
                  <option value="POLIGONO">{t("shape.polygon")}</option>
                  <option value="CRUZ">{t("shape.cross")}</option>
                  <option value="CORACAO">{t("shape.heart")}</option>
                </select>

                <div>
                  <label className="mb-2 block font-semibold">
                    {t("shape.appearance")}
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
                      {t("shape.fillOutline")}
                    </option>
                    <option value="SOMENTE_PREENCHIMENTO">
                      {t("shape.fillOnly")}
                    </option>
                    <option value="SOMENTE_CONTORNO">
                      {t("shape.outlineOnly")}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block font-semibold">
                    {t("shape.fillType")}
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
                    <option value="COR">{t("common.solid")}</option>
                    <option value="GRADIENTE">{t("common.gradient")}</option>
                  </select>

                  <div className="rounded-2xl border border-slate-700/40 p-3">
                    <p className="mb-3 text-sm font-bold">
                      {t("shape.style")}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={copiarEstiloForma}
                        className="phanyx-crachas-button-secondary text-xs"
                      >
                        {t("shape.copyStyle")}
                      </button>

                      <button
                        type="button"
                        onClick={colarEstiloForma}
                        disabled={!estiloFormaCopiado}
                        className={`phanyx-crachas-button-secondary text-xs ${!estiloFormaCopiado ? "cursor-not-allowed opacity-50" : ""
                          }`}
                      >
                        {t("shape.applyStyle")}
                      </button>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">
                      {t("shape.styleHint")}
                    </p>
                  </div>

                </div>
              </div>

              {(objetoAtual.preenchimentoTipo || "COR") === "GRADIENTE" && (
                <div className="rounded-2xl border border-slate-700/40 p-3">
                  <p className="mb-3 text-sm font-bold">
                    {t("common.gradient")}
                  </p>

                  <div>
                    <label className="mb-2 block font-semibold">
                      {t("shape.gradientType")}
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
                      <option value="LINEAR">{t("shape.linear")}</option>
                      <option value="DIAGONAL">{t("shape.diagonal")}</option>
                      <option value="RADIAL">{t("shape.radial")}</option>
                      <option value="ESFERICO">{t("shape.sphere")}</option>
                    </select>
                  </div>

                  {(objetoAtual.gradienteTipo || "LINEAR") === "LINEAR" && (
                    <div className="mt-3">
                      <label className="mb-2 block font-semibold">
                        {t("shape.gradientDirection")}
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
                        <option value="DIREITA">{t("shape.leftToRight")}</option>
                        <option value="ESQUERDA">{t("shape.rightToLeft")}</option>
                        <option value="BASE">{t("shape.topToBottom")}</option>
                        <option value="TOPO">{t("shape.bottomToTop")}</option>
                      </select>
                    </div>
                  )}

                  {(objetoAtual.gradienteTipo || "LINEAR") === "DIAGONAL" && (
                    <div className="mt-3">
                      <label className="mb-2 block font-semibold">
                        {t("shape.diagonalDirection")}
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
                        <option value="DIAGONAL_DESC">{t("shape.diagonalDown")}</option>
                        <option value="DIAGONAL_ASC">{t("shape.diagonalUp")}</option>
                      </select>
                    </div>
                  )}

                  {["RADIAL", "ESFERICO"].includes(objetoAtual.gradienteTipo || "LINEAR") && (
                    <div className="mt-3 space-y-3 rounded-xl border border-slate-700/40 p-3">
                      <p className="text-sm font-bold">
                        {t("shape.focusControl")}
                      </p>

                      <div>
                        <label className="mb-2 block text-xs font-semibold">
                          {t("shape.focusHorizontal", { value: objetoAtual.gradienteFocoX ?? 45 })}
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
                          {t("shape.focusVertical", { value: objetoAtual.gradienteFocoY ?? 35 })}
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
                          {t("shape.focusRadius", { value: objetoAtual.gradienteRaio ?? 75 })}
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
                      {t("shape.moveGradientPoints")}
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
                          title={t("common.point", { value: `${ponto.posicao}%` })}
                          className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-lg ${pontoGradienteSelecionado === ponto.id
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

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {pontosGradienteFundoValidos().map((ponto, index) => {
                        const selecionado = pontoGradienteFundoSelecionado === ponto.id;

                        return (
                          <button
                            key={ponto.id}
                            type="button"
                            onClick={() => setPontoGradienteFundoSelecionado(ponto.id)}
                            className={`flex items-center gap-2 rounded-xl border px-2 py-2 text-left text-[11px] font-bold ${selecionado
                              ? "border-yellow-300 bg-yellow-400/10 text-yellow-200"
                              : "border-slate-600 bg-slate-900 text-slate-200 hover:border-blue-400"
                              }`}
                          >
                            <span
                              className="h-4 w-4 rounded-full border border-white/70"
                              style={{
                                backgroundColor: ponto.cor,
                              }}
                            />

                            <span>
                              {t("common.point", { value: index + 1 })}
                              <br />
                              <span className="text-[10px] opacity-70">
                                {ponto.posicao}%
                              </span>
                            </span>
                          </button>
                        );
                      })}
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
                      className="phanyx-crachas-gradient-add-point mt-3 w-full rounded-xl border border-blue-500/60 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/10"
                    >
                      {t("shape.addColorPoint")}
                    </button>

                  </div>

                  {pontoGradienteAtual(objetoAtual) && (
                    <div className="mt-4 rounded-xl border border-slate-700/40 p-3">
                      <p className="mb-3 text-sm font-bold">
                        {t("shape.selectedPoint")}
                      </p>

                      <div>
                        <label className="mb-2 block text-xs font-semibold">
                          {t("shape.pointColor")}
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
                        <label className="mb-2 block text-xs font-semibold">{t("properties.hex")}</label>

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
                          {t("shape.pointPosition", { value: pontoGradienteAtual(objetoAtual).posicao })}
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
                          {t("shape.removeSelectedPoint")}
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
                    className="phanyx-crachas-gradient-add-point mt-4 w-full rounded-xl border border-blue-500/60 px-3 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/10"
                  >
                    {t("shape.addColorPoint")}
                  </button>

                </div>
              )}

              {objetoAtual.forma === "ESTRELA" && (
                <div className="space-y-4 rounded-2xl border border-slate-700/40 p-3">
                  <p className="text-sm font-bold">
                    {t("shape.starConfig")}
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold">
                        {t("shape.points")}
                      </label>

                      <input
                        type="number"
                        min={3}
                        max={20}
                        value={objetoAtual.pontas ?? 5}
                        onChange={(e) =>
                          atualizarObjeto(
                            objetoAtual.id,
                            {
                              pontas: Number(
                                e.target.value
                              ),
                            }
                          )
                        }
                        className="phanyx-crachas-input"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold">
                        {t("shape.outerRadius")}
                      </label>

                      <input
                        type="number"
                        min={10}
                        value={
                          objetoAtual.raioExterno ??
                          46
                        }
                        onChange={(e) =>
                          atualizarObjeto(
                            objetoAtual.id,
                            {
                              raioExterno: Number(
                                e.target.value
                              ),
                            }
                          )
                        }
                        className="phanyx-crachas-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold">
                      {t("shape.centerDiameter")}
                    </label>

                    <input
                      type="number"
                      min={10}
                      value={
                        (objetoAtual.raioInterno ??
                          22) * 2
                      }
                      onChange={(e) =>
                        atualizarObjeto(
                          objetoAtual.id,
                          {
                            raioInterno:
                              Number(
                                e.target.value
                              ) / 2,
                          }
                        )
                      }
                      className="phanyx-crachas-input"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-300 p-3 dark:border-slate-700">
                    <label className="mb-2 block text-xs font-semibold">
                      {t("shape.tipRoundingValue", {
                        value: objetoAtual.arredondamentoPontas ?? 0,
                      })}
                    </label>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={
                        objetoAtual.arredondamentoPontas ??
                        0
                      }
                      onChange={(e) =>
                        atualizarObjeto(
                          objetoAtual.id,
                          {
                            arredondamentoPontas:
                              Number(
                                e.target.value
                              ),
                          }
                        )
                      }
                      className="w-full accent-blue-600"
                    />

                    <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">{t("shape.starTipRoundHint")}</p>
                  </div>

                  <div className="rounded-xl border border-slate-300 p-3 dark:border-slate-700">
                    <label className="mb-2 block text-xs font-semibold">
                      {t("shape.innerRoundingValue", {
                        value: objetoAtual.arredondamentoReentrancias ?? 0,
                      })}
                    </label>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={
                        objetoAtual.arredondamentoReentrancias ??
                        0
                      }
                      onChange={(e) =>
                        atualizarObjeto(
                          objetoAtual.id,
                          {
                            arredondamentoReentrancias:
                              Number(
                                e.target.value
                              ),
                          }
                        )
                      }
                      className="w-full accent-blue-600"
                    />

                    <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">{t("shape.starInnerRoundHint")}</p>
                  </div>

                  <div className="rounded-xl border border-slate-300 p-3 dark:border-slate-700">
                    <label className="mb-2 block text-xs font-semibold">
                      {t("shape.tipCircularityValue", {
                        value: objetoAtual.circularidadePontas ?? 0,
                      })}
                    </label>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={
                        objetoAtual.circularidadePontas ??
                        0
                      }
                      onChange={(e) =>
                        atualizarObjeto(
                          objetoAtual.id,
                          {
                            circularidadePontas:
                              Number(
                                e.target.value
                              ),
                          }
                        )
                      }
                      className="w-full accent-blue-600"
                    />

                    <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">{t("shape.starTipCircularHint")}</p>
                  </div>

                  <div className="rounded-xl border border-slate-300 p-3 dark:border-slate-700">
                    <label className="mb-2 block text-xs font-semibold">
                      {t("shape.innerCircularityValue", {
                        value: objetoAtual.circularidadeReentrancias ?? 0,
                      })}
                    </label>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={
                        objetoAtual.circularidadeReentrancias ?? 0
                      }
                      onChange={(e) =>
                        atualizarObjeto(
                          objetoAtual.id,
                          {
                            circularidadeReentrancias:
                              Number(e.target.value),
                          }
                        )
                      }
                      className="w-full accent-blue-600"
                    />

                    <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">{t("shape.starInnerCircularHint")}</p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">{t("shape.starCenterHint")}</p>
                </div>
              )}

              {objetoAtual.forma === "FORMA_LIVRE" && (
                <div className="space-y-3 rounded-2xl border border-slate-700/40 p-3">
                  <p className="text-sm font-bold">
                    {t("shape.freeform")}
                  </p>

                  <div className="rounded-xl border border-slate-700/40 p-3">
                    <p className="mb-2 text-xs font-bold">
                      {t("shape.freeformPointType")}
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => definirModoPontoLivre("CANTO")}
                        className="phanyx-crachas-button-secondary text-[11px]"
                      >
                        {t("shape.cornerStraight")}
                      </button>

                      <button
                        type="button"
                        onClick={() => definirModoPontoLivre("SUAVE")}
                        className="phanyx-crachas-button-secondary text-[11px]"
                      >
                        {t("shape.smoothCurve")}
                      </button>

                      <button
                        type="button"
                        onClick={() => definirModoPontoLivre("LIVRE")}
                        className="phanyx-crachas-button-secondary text-[11px]"
                      >
                        {t("shape.freeCurve")}
                      </button>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">
                      {t("shape.curveHint")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={adicionarPontoLivreForma}
                      className="phanyx-crachas-button-secondary text-xs"
                    >
                      {t("shape.addPoint")}
                    </button>

                    <button
                      type="button"
                      onClick={removerPontosLivresSelecionados}
                      className="phanyx-crachas-button-secondary text-xs"
                    >
                      {t("shape.removePoint")}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={subdividirPontosLivresSelecionados}
                    className="phanyx-crachas-button-secondary w-full text-xs"
                  >
                    {t("shape.subdivideSelected")}
                  </button>

                  <p className="text-xs text-slate-400">
                    {t("shape.freeformHint")}
                  </p>
                </div>
              )}

              {objetoAtual.forma === "POLIGONO" && (
                <div className="space-y-3 rounded-2xl border border-slate-700/40 p-3">
                  <p className="text-sm font-bold">
                    {t("shape.polygonConfig")}
                  </p>

                  <div>
                    <label className="mb-2 block text-xs font-semibold">
                      {t("shape.sides")}
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
                    {t("shape.polygonHint")}
                  </p>
                </div>
              )}

              {objetoAtual.forma === "CRUZ" && (
                <div className="space-y-3 rounded-2xl border border-slate-700/40 p-3">
                  <p className="text-sm font-bold">
                    {t("shape.crossConfig")}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold">
                        {t("shape.crossVerticalMove")}
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
                        {t("shape.crossHorizontalMove")}
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
                        {t("shape.crossVerticalThickness")}
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
                        {t("shape.crossHorizontalThickness")}
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
                        {t("shape.crossArmLength")}
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
                        {t("shape.crossVerticalLength")}
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
                    {t("shape.crossHint")}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold">{t("common.x")}</label>
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
                  <label className="mb-2 block text-xs font-semibold">{t("common.y")}</label>
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
                  <label className="mb-2 block text-xs font-semibold">{t("common.width")}</label>
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
                  <label className="mb-2 block text-xs font-semibold">{t("common.height")}</label>
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
                  {t("shape.fillColor")}
                </label>

                <div className="rounded-2xl border border-slate-700/40 p-3">
                  <label className="mb-2 block font-semibold">
                    {t("properties.rotationValue", {
                      value: objetoAtual.rotacao ?? 0,
                    })}
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
                      {t("shape.resetRotation")}
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
                  {t("shape.borderColor")}
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
                  {t("shape.borderThickness")}
                </label>

                <div>
                  <label className="mb-2 block font-semibold">
                    {t("shape.borderFinish")}
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
                    <option value="DURA">{t("shape.hardBorder")}</option>
                    <option value="FOSCA">{t("shape.softBorder")}</option>
                  </select>
                </div>

                {(objetoAtual.bordaAcabamento || "DURA") === "FOSCA" && (
                  <div>
                    <label className="mb-2 block font-semibold">
                      {t("shape.borderSoftness")}
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

              {objetoAtual.forma !== "ESTRELA" && (
                <div>
                  <label className="mb-2 block font-semibold">
                    {t("properties.rounding")}
                  </label>

                  <input
                    type="number"
                    value={objetoAtual.raioBorda}
                    onChange={(e) =>
                      atualizarObjeto(
                        objetoAtual.id,
                        {
                          raioBorda: Number(
                            e.target.value
                          ),
                        }
                      )
                    }
                    className="phanyx-crachas-input"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block font-semibold">
                  {t("properties.opacity")}
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
                  {t("shape.shadow")}
                </label>

                {objetoAtual.sombraAtiva && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold">
                          {t("common.x")}
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
                          {t("common.y")}
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
                          {t("common.blur")}
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
                        {t("properties.shadowColor")}
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
            <div className="mb-4 space-y-4">
              <div className="rounded-2xl border border-slate-700/40 p-3">
                <p className="mb-3 text-sm font-bold">
                  {t("common.qrCode")}
                </p>

                <label className="mb-2 block text-xs font-semibold">
                  {t("qr.content")}
                </label>

                <textarea
                  value={objetoAtual.valor}
                  readOnly
                  rows={4}
                  className="phanyx-crachas-input min-h-[90px] cursor-not-allowed opacity-80"
                />

                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {t("qr.validationHint", { code: "{{codigoCracha}}" })}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700/40 p-3">
                <p className="mb-3 text-sm font-bold">
                  {t("qr.appearance")}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      {t("qr.color")}
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
                      {t("qr.backgroundColor")}
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
                  {t("qr.showBackground")}
                </label>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      {t("qr.margin")}
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
                      {t("properties.rounding")}
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
                  {t("properties.positionSize")}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      {t("common.x")}
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
                      {t("common.y")}
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
                      {t("properties.size")}
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
                  {t("qr.shadow")}
                </label>

                {objetoAtual.sombraAtiva && (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold">
                          {t("common.x")}
                        </label>

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
                        <label className="mb-1 block text-xs font-semibold">
                          {t("common.y")}
                        </label>

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
                          {t("common.blur")}
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
                        {t("properties.shadowColor")}
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

          {objetoAtual?.tipo === "CODIGO_BARRAS" && (
            <div className="mb-4 space-y-4">
              <div className="rounded-2xl border border-slate-700/40 p-3">
                <p className="mb-3 text-sm font-bold">
                  {t("common.barcode")}
                </p>

                <label className="mb-2 block text-xs font-semibold">
                  {t("barcode.content")}
                </label>

                <input
                  value={objetoAtual.valor}
                  readOnly
                  className="phanyx-crachas-input cursor-not-allowed opacity-80"
                />

                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {t("barcode.codeHint", { code: "{{codigoCracha}}" })}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700/40 p-3">
                <p className="mb-3 text-sm font-bold">
                  {t("shape.appearance")}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      {t("barcode.barColor")}
                    </label>

                    <input
                      type="color"
                      value={objetoAtual.cor || "#000000"}
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
                      {t("qr.backgroundColor")}
                    </label>

                    <input
                      type="color"
                      value={objetoAtual.corFundo || "#ffffff"}
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
                    checked={objetoAtual.mostrarFundo !== false}
                    onChange={(e) =>
                      atualizarObjeto(objetoAtual.id, {
                        mostrarFundo: e.target.checked,
                      })
                    }
                  />
                  {t("qr.showBackground")}
                </label>

                <label className="mt-3 flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={!!objetoAtual.mostrarTexto}
                    onChange={(e) =>
                      atualizarObjeto(objetoAtual.id, {
                        mostrarTexto: e.target.checked,
                      })
                    }
                  />
                  {t("barcode.showText")}
                </label>
              </div>

              <div className="rounded-2xl border border-slate-700/40 p-3">
                <p className="mb-3 text-sm font-bold">
                  {t("properties.positionSize")}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      {t("common.x")}
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
                      {t("common.y")}
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
                      {t("common.width")}
                    </label>

                    <input
                      type="number"
                      min={40}
                      value={Math.round(objetoAtual.largura)}
                      onChange={(e) =>
                        atualizarObjeto(objetoAtual.id, {
                          largura: Number(e.target.value),
                        })
                      }
                      className="phanyx-crachas-input"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      {t("common.height")}
                    </label>

                    <input
                      type="number"
                      min={20}
                      value={Math.round(objetoAtual.altura)}
                      onChange={(e) =>
                        atualizarObjeto(objetoAtual.id, {
                          altura: Number(e.target.value),
                        })
                      }
                      className="phanyx-crachas-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="mb-2 block font-semibold">
              {t("badge.format")}
            </label>

            <select
              value={formato}
              onChange={(e) =>
                setFormato(e.target.value as any)
              }
              className="phanyx-crachas-input"
            >
              <option value="RETRATO">{t("badge.portrait")}</option>
              <option value="PAISAGEM">{t("badge.landscape")}</option>
              <option value="QUADRADO">{t("badge.square")}</option>
              <option value="REDONDO">{t("badge.round")}</option>
              <option value="PERSONALIZADO">
                {t("model.custom")}
              </option>
            </select>
          </div>

          <div className="mt-6">
            <label className="mb-2 block font-semibold">
              {t("badge.holeType")}
            </label>

            <select
              value={tipoFuroCracha}
              onChange={(e) =>
                setTipoFuroCracha(e.target.value as TipoFuroCracha)
              }
              className="phanyx-crachas-input"
            >
              <option value="SEM_FURO">{t("badge.noHole")}</option>
              <option value="RASGO_HORIZONTAL">{t("badge.horizontalSlot")}</option>
              <option value="RASGO_VERTICAL">{t("badge.verticalSlot")}</option>
              <option value="FURO_REDONDO">{t("badge.roundHole")}</option>
              <option value="FURO_DUPLO">{t("badge.doubleHole")}</option>
            </select>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
              {t("badge.holeHint")}
            </p>
          </div>

          <div className="space-y-3">
            <label className="block font-semibold">
              {t("badge.backgroundType")}
            </label>

            <select
              value={tipoFundoCracha}
              onChange={(e) =>
                setTipoFundoCracha(e.target.value as TipoFundoCracha)
              }
              className="phanyx-crachas-input"
            >
              <option value="SOLIDO">{t("common.solid")}</option>
              <option value="GRADIENTE">{t("common.gradient")}</option>
            </select>

            {tipoFundoCracha === "SOLIDO" && (
              <div>
                <label className="mb-2 block font-semibold">
                  {t("badge.backgroundColor")}
                </label>

                <input
                  type="color"
                  value={corFundoCracha || "#ffffff"}
                  onChange={(e) => setCorFundoCracha(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            )}

            {tipoFundoCracha === "GRADIENTE" && (
              <>
                <div>
                  <label className="mb-2 block font-semibold">
                    {t("shape.gradientDirection")}
                  </label>

                  <select
                    value={direcaoGradienteCracha}
                    onChange={(e) =>
                      setDirecaoGradienteCracha(
                        e.target
                          .value as DirecaoGradienteCracha
                      )
                    }
                    className="phanyx-crachas-input"
                  >
                    <option value="VERTICAL">
                      {t("common.vertical")}
                    </option>

                    <option value="HORIZONTAL">
                      {t("common.horizontal")}
                    </option>

                    <option value="DIAGONAL_DESC">
                      {t("shape.diagonalDown")}
                    </option>

                    <option value="DIAGONAL_ASC">
                      {t("shape.diagonalUp")}
                    </option>

                    <option value="CIRCULAR">
                      {t("badge.circular")}
                    </option>
                  </select>
                </div>

                <div className="mt-4 rounded-xl border border-slate-700/40 p-3">
                  <p className="mb-3 text-xs font-bold">
                    {t("shape.moveGradientPoints")}
                  </p>

                  <div
                    className="relative h-10 rounded-full border border-slate-500"
                    style={{
                      background: fundoCrachaCss(),
                    }}
                  >
                    {pontosGradienteFundoValidos().map((ponto) => (
                      <button
                        key={ponto.id}
                        type="button"
                        onMouseDown={(e) =>
                          iniciarArrastoPontoGradienteFundo(e, ponto)
                        }
                        onClick={() => setPontoGradienteFundoSelecionado(ponto.id)}
                        title={t("common.point", { value: `${ponto.posicao}%` })}
                        className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-lg ${pontoGradienteFundoSelecionado === ponto.id
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
                    onClick={adicionarPontoGradienteFundo}
                    className="phanyx-crachas-gradient-add-point mt-4 w-full rounded-xl border border-blue-500/60 px-3 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/10"
                  >
                    {t("shape.addColorPoint")}
                  </button>
                </div>

                {pontoGradienteFundoAtual() && (
                  <div className="mt-4 rounded-xl border border-slate-700/40 p-3">
                    <p className="mb-3 text-sm font-bold">
                      {t("shape.selectedPoint")}
                    </p>

                    <label className="mb-2 block text-xs font-semibold">
                      {t("shape.pointColor")}
                    </label>

                    <input
                      type="color"
                      value={pontoGradienteFundoAtual().cor}
                      onChange={(e) =>
                        atualizarCorPontoGradienteFundo(e.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
                    />

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={copiarCorPontoGradienteFundo}
                        className="rounded-xl border border-slate-600 px-2 py-2 text-[11px] font-bold text-slate-200 hover:border-blue-400 hover:bg-blue-500/10"
                      >
                        {t("common.copy")}
                      </button>

                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={colarCorPontoGradienteFundo}
                        disabled={!corGradienteFundoCopiada}
                        className="rounded-xl border border-slate-600 px-2 py-2 text-[11px] font-bold text-slate-200 hover:border-blue-400 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {t("common.paste")}
                      </button>

                      <button
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={duplicarPontoGradienteFundoSelecionado}
                        className="rounded-xl border border-slate-600 px-2 py-2 text-[11px] font-bold text-slate-200 hover:border-blue-400 hover:bg-blue-500/10"
                      >
                        {t("common.duplicate")}
                      </button>
                    </div>

                    {corGradienteFundoCopiada && (
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-700/40 p-2 text-[11px] font-semibold text-slate-300">
                        <span>{t("badge.copiedColor")}</span>

                        <span
                          className="h-4 w-8 rounded border border-white/60"
                          style={{
                            backgroundColor: corGradienteFundoCopiada,
                          }}
                        />

                        <span>{corGradienteFundoCopiada}</span>
                      </div>
                    )}

                    <div className="mt-3">
                      <label className="mb-2 block text-xs font-semibold">
                        {t("shape.pointPosition", { value: pontoGradienteFundoAtual().posicao })}
                      </label>

                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={pontoGradienteFundoAtual().posicao}
                        onChange={(e) =>
                          atualizarPontoGradienteFundo(
                            pontoGradienteFundoAtual().id,
                            {
                              posicao: Number(e.target.value),
                            }
                          )
                        }
                        className="w-full"
                      />
                    </div>

                    {pontosGradienteFundoValidos().length > 2 && (
                      <button
                        type="button"
                        onClick={removerPontoGradienteFundoSelecionado}
                        className="mt-3 w-full rounded-xl border border-red-500/50 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10"
                      >
                        {t("shape.removeSelectedPoint")}
                      </button>
                    )}
                  </div>
                )}

                <div
                  className="mt-4 h-12 rounded-2xl border border-slate-600"
                  style={{
                    background: fundoCrachaCss(),
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}