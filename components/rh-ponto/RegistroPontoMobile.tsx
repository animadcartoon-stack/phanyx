"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TipoMarcacao =
  | "ENTRADA"
  | "SAIDA_ALMOCO"
  | "RETORNO_ALMOCO"
  | "SAIDA";

type MarcacaoHoje = {
  tipo: TipoMarcacao | string;
  dataHora: string;
  comprovanteCodigo: string;
  statusLocalizacao: string;
  reconhecimentoStatus: string;
};

type ContextoPonto = {
  sucesso: true;

  servidor: {
    dataHora: string;
    dataLocal: string;
    fusoHorario: string;
  };

  instituicao: {
    slug: string;
    nome: string;
  };

  funcionario: {
    nome: string;
    cargo?: string | null;
    email: string;
    fotoPerfil?: string | null;
    acessoValidoAte?: string | null;
  };

  configuracao: {
    exigirFoto: boolean;
    exigirLocalizacao: boolean;
    permitirForaDoRaio: boolean;
    raioPadraoMetros: number;
    reconhecimentoFacialAtivo: boolean;
    exigirProvaVida: boolean;
    quantidadeLocaisAtivos: number;
  };

  jornada: {
    proximoTipo: TipoMarcacao | null;
    proximoTipoRotulo: string;
    concluida: boolean;
    marcacoesHoje: MarcacaoHoje[];
  };
};

type RespostaContexto = Partial<ContextoPonto> & {
  error?: string;
};

type LocalizacaoAtual = {
  latitude: number;
  longitude: number;
  precisaoMetros: number;
  obtidaEm: number;
};

type RespostaUpload = {
  sucesso?: boolean;

  upload?: {
    url: string;
    pathname: string;
    contentType: string;
    tamanhoMaximoBytes: number;
    expiraEm: string;
  };

  error?: string;
};

type ComprovanteMarcacao = {
  tipo: string;
  tipoRotulo: string;
  dataHora: string;
  dataLocal: string;
  comprovanteCodigo: string;
  statusLocalizacao: string;
  distanciaMetros?: number | null;
  localNome?: string | null;
};

type RespostaMarcacao = {
  sucesso?: boolean;
  repetida?: boolean;
  mensagem?: string;

  marcacao?: ComprovanteMarcacao;

  jornada?: {
    proximoTipo: TipoMarcacao | null;
    proximoTipoRotulo: string;
    concluida: boolean;
  };

  error?: string;
  codigo?: string | null;
  detalhes?: Record<string, unknown> | null;
};

type RegistroPontoMobileProps = {
  slug: string;
};

const TAMANHO_MAXIMO_FOTO =
  2 * 1024 * 1024;

const VALIDADE_LOCALIZACAO_MS =
  2 * 60 * 1000;

const CHAVE_DISPOSITIVO =
  "phanyx-rh-ponto-dispositivo-v1";

function gerarIdentificadorSeguro() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    Date.now().toString(36),
    Math.random().toString(36).slice(2),
    Math.random().toString(36).slice(2),
  ].join("-");
}

function obterDispositivoId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const existente =
      window.localStorage.getItem(
        CHAVE_DISPOSITIVO
      );

    if (existente) {
      return existente;
    }

    const novoId =
      `dispositivo:${gerarIdentificadorSeguro()}`;

    window.localStorage.setItem(
      CHAVE_DISPOSITIVO,
      novoId
    );

    return novoId;
  } catch {
    return `temporario:${gerarIdentificadorSeguro()}`;
  }
}

function formatarDataHora(
  dataIso: string,
  fusoHorario: string
) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return dataIso;
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: fusoHorario,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(data);
  } catch {
    return data.toLocaleString("pt-BR");
  }
}

function formatarHorario(
  dataIso: string,
  fusoHorario: string
) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "--:--";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: fusoHorario,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(data);
  } catch {
    return data.toLocaleTimeString("pt-BR");
  }
}

function rotuloTipoMarcacao(tipo: string) {
  switch (tipo) {
    case "ENTRADA":
      return "Entrada";

    case "SAIDA_ALMOCO":
      return "Saída para almoço";

    case "RETORNO_ALMOCO":
      return "Retorno do almoço";

    case "SAIDA":
      return "Saída";

    default:
      return tipo;
  }
}

function rotuloStatusLocalizacao(
  status: string
) {
  switch (status) {
    case "DENTRO_DO_RAIO":
      return "Dentro do local autorizado";

    case "FORA_DO_RAIO_PERMITIDA":
      return "Fora do raio — permitido";

    case "NAO_EXIGIDA":
      return "Localização não exigida";

    case "SEM_LOCAL_ATIVO":
      return "Sem local cadastrado";

    case "NAO_VERIFICADA":
      return "Não verificada";

    default:
      return status
        .replaceAll("_", " ")
        .toLocaleLowerCase("pt-BR");
  }
}

function mensagemErroLocalizacao(
  error: unknown
) {
  const codigo = Number(
    (error as GeolocationPositionError)?.code
  );

  if (codigo === 1) {
    return (
      "A permissão de localização foi negada. " +
      "Abra as configurações do navegador e permita " +
      "o acesso à localização para o PHANYX RH."
    );
  }

  if (codigo === 2) {
    return (
      "O celular não conseguiu determinar sua localização. " +
      "Ative o GPS e tente novamente."
    );
  }

  if (codigo === 3) {
    return (
      "A localização demorou muito para responder. " +
      "Vá para um local com melhor sinal e tente novamente."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível obter sua localização.";
}

function mensagemErroCamera(error: unknown) {
  const nome = String(
    (error as DOMException)?.name || ""
  );

  if (
    nome === "NotAllowedError" ||
    nome === "PermissionDeniedError"
  ) {
    return (
      "A permissão da câmera foi negada. " +
      "Abra as configurações do navegador e permita " +
      "o acesso à câmera para o PHANYX RH."
    );
  }

  if (
    nome === "NotFoundError" ||
    nome === "DevicesNotFoundError"
  ) {
    return "Nenhuma câmera foi encontrada neste dispositivo.";
  }

  if (
    nome === "NotReadableError" ||
    nome === "TrackStartError"
  ) {
    return (
      "A câmera está sendo usada por outro aplicativo. " +
      "Feche o outro aplicativo e tente novamente."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível abrir a câmera.";
}

function converterCanvasEmBlob(
  canvas: HTMLCanvasElement,
  tipo: string,
  qualidade: number
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      tipo,
      qualidade
    );
  });
}

async function criarFotoCompactada(
  video: HTMLVideoElement
) {
  const larguraOriginal =
    video.videoWidth || 720;

  const alturaOriginal =
    video.videoHeight || 960;

  const limites = [960, 800, 640];

  const formatos = [
    {
      tipo: "image/webp",
      qualidades: [0.82, 0.72, 0.62],
    },
    {
      tipo: "image/jpeg",
      qualidades: [0.82, 0.72, 0.62],
    },
  ];

  for (const limite of limites) {
    const escala = Math.min(
      1,
      limite /
        Math.max(
          larguraOriginal,
          alturaOriginal
        )
    );

    const largura = Math.max(
      1,
      Math.round(larguraOriginal * escala)
    );

    const altura = Math.max(
      1,
      Math.round(alturaOriginal * escala)
    );

    const canvas =
      document.createElement("canvas");

    canvas.width = largura;
    canvas.height = altura;

    const contexto =
      canvas.getContext("2d");

    if (!contexto) {
      throw new Error(
        "Não foi possível preparar a captura da foto."
      );
    }

    contexto.drawImage(
      video,
      0,
      0,
      largura,
      altura
    );

    for (const formato of formatos) {
      for (const qualidade of formato.qualidades) {
        const blob =
          await converterCanvasEmBlob(
            canvas,
            formato.tipo,
            qualidade
          );

        if (
          blob &&
          blob.size > 0 &&
          blob.size <= TAMANHO_MAXIMO_FOTO
        ) {
          return blob;
        }
      }
    }
  }

  throw new Error(
    "A foto ficou muito grande. Tente novamente com melhor iluminação."
  );
}

export default function RegistroPontoMobile({
  slug,
}: RegistroPontoMobileProps) {
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const previewUrlRef =
    useRef<string | null>(null);

  const idempotenciaRef =
    useRef<string | null>(null);

  const [contexto, setContexto] =
    useState<ContextoPonto | null>(null);

  const [carregandoContexto, setCarregandoContexto] =
    useState(true);

  const [cameraAtiva, setCameraAtiva] =
    useState(false);

  const [abrindoCamera, setAbrindoCamera] =
    useState(false);

  const [fotoBlob, setFotoBlob] =
    useState<Blob | null>(null);

  const [fotoPreview, setFotoPreview] =
    useState<string | null>(null);

  const [fotoPathname, setFotoPathname] =
    useState<string | null>(null);

  const [localizacao, setLocalizacao] =
    useState<LocalizacaoAtual | null>(null);

  const [
    obtendoLocalizacao,
    setObtendoLocalizacao,
  ] = useState(false);

  const [processando, setProcessando] =
    useState(false);

  const [
    etapaProcessamento,
    setEtapaProcessamento,
  ] = useState("");

  const [mensagemErro, setMensagemErro] =
    useState("");

  const [
    mensagemSucesso,
    setMensagemSucesso,
  ] = useState("");

  const [comprovante, setComprovante] =
    useState<ComprovanteMarcacao | null>(null);

  const [
    deslocamentoServidorMs,
    setDeslocamentoServidorMs,
  ] = useState(0);

  const [agoraClienteMs, setAgoraClienteMs] =
    useState(Date.now());

  function pararCamera() {
    const stream = streamRef.current;

    if (stream) {
      stream
        .getTracks()
        .forEach((track) => track.stop());
    }

    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraAtiva(false);
  }

  function revogarPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(
        previewUrlRef.current
      );

      previewUrlRef.current = null;
    }

    setFotoPreview(null);
  }

  function limparFoto() {
    revogarPreview();

    setFotoBlob(null);
    setFotoPathname(null);

    idempotenciaRef.current = null;
  }

  const carregarContexto = useCallback(
    async (silencioso = false) => {
      try {
        if (!silencioso) {
          setCarregandoContexto(true);
        }

        const resposta = await fetch(
          `/api/rh-app/${encodeURIComponent(
            slug
          )}/ponto/contexto`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        const dados: RespostaContexto =
          await resposta.json();

        if (!resposta.ok) {
          if (resposta.status === 401) {
            window.location.href =
              `/rh-app/${encodeURIComponent(
                slug
              )}/login`;
          }

          throw new Error(
            dados.error ||
              "Não foi possível carregar o registro de ponto."
          );
        }

        const contextoRecebido =
          dados as ContextoPonto;

        setContexto(contextoRecebido);

        const horarioServidor =
          new Date(
            contextoRecebido.servidor.dataHora
          ).getTime();

        if (
          Number.isFinite(horarioServidor)
        ) {
          setDeslocamentoServidorMs(
            horarioServidor - Date.now()
          );
        }

        return contextoRecebido;
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o registro de ponto.";

        setMensagemErro(mensagem);

        throw error;
      } finally {
        if (!silencioso) {
          setCarregandoContexto(false);
        }
      }
    },
    [slug]
  );

  useEffect(() => {
    carregarContexto().catch(() => undefined);
  }, [carregarContexto]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAgoraClienteMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    return () => {
      const stream = streamRef.current;

      if (stream) {
        stream
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(
          previewUrlRef.current
        );
      }
    };
  }, []);

  const dataHoraAtualServidor =
    useMemo(() => {
      return new Date(
        agoraClienteMs +
          deslocamentoServidorMs
      );
    }, [
      agoraClienteMs,
      deslocamentoServidorMs,
    ]);

  const horarioAtual = useMemo(() => {
    const fusoHorario =
      contexto?.servidor.fusoHorario ||
      "America/Sao_Paulo";

    try {
      return new Intl.DateTimeFormat("pt-BR", {
        timeZone: fusoHorario,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(dataHoraAtualServidor);
    } catch {
      return dataHoraAtualServidor
        .toLocaleTimeString("pt-BR");
    }
  }, [
    contexto?.servidor.fusoHorario,
    dataHoraAtualServidor,
  ]);

  const fotoPronta =
    Boolean(fotoBlob || fotoPathname);

  const configuracao =
    contexto?.configuracao;

  const jornada =
    contexto?.jornada;

  const semLocalAutorizado =
    configuracao?.exigirLocalizacao === true &&
    configuracao.quantidadeLocaisAtivos === 0;

  const processamentoEspecialPendente =
    configuracao?.reconhecimentoFacialAtivo ===
      true ||
    configuracao?.exigirProvaVida === true;

  const fotoObrigatoriaAusente =
    configuracao?.exigirFoto === true &&
    !fotoPronta;

  const botaoDesabilitado =
    carregandoContexto ||
    processando ||
    !contexto ||
    jornada?.concluida === true ||
    fotoObrigatoriaAusente ||
    semLocalAutorizado ||
    processamentoEspecialPendente;

  async function abrirCamera() {
    try {
      setMensagemErro("");
      setMensagemSucesso("");
      setAbrindoCamera(true);

      limparFoto();
      pararCamera();

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Este navegador não oferece acesso à câmera."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: false,

          video: {
            facingMode: {
              ideal: "user",
            },

            width: {
              ideal: 720,
            },

            height: {
              ideal: 960,
            },
          },
        });

      streamRef.current = stream;
      setCameraAtiva(true);

      window.requestAnimationFrame(() => {
        const video = videoRef.current;

        if (!video) {
          return;
        }

        video.srcObject = stream;

        video
          .play()
          .catch(() => undefined);
      });
    } catch (error) {
      pararCamera();

      setMensagemErro(
        mensagemErroCamera(error)
      );
    } finally {
      setAbrindoCamera(false);
    }
  }

  async function capturarFoto() {
    try {
      setMensagemErro("");
      setMensagemSucesso("");

      const video = videoRef.current;

      if (
        !video ||
        video.readyState < 2
      ) {
        throw new Error(
          "A câmera ainda não está pronta. Aguarde um instante."
        );
      }

      const blob =
        await criarFotoCompactada(video);

      revogarPreview();

      const preview =
        URL.createObjectURL(blob);

      previewUrlRef.current = preview;

      setFotoBlob(blob);
      setFotoPreview(preview);
      setFotoPathname(null);

      idempotenciaRef.current = null;

      pararCamera();

      setMensagemSucesso(
        "Foto ao vivo capturada. Agora você pode registrar o ponto."
      );
    } catch (error) {
      setMensagemErro(
        error instanceof Error
          ? error.message
          : "Não foi possível capturar a foto."
      );
    }
  }

  async function obterLocalizacaoAtual() {
    try {
      setMensagemErro("");
      setObtendoLocalizacao(true);

      if (!navigator.geolocation) {
        throw new Error(
          "Este navegador não oferece acesso à localização."
        );
      }

      const posicao =
        await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 0,
              }
            );
          }
        );

      const novaLocalizacao: LocalizacaoAtual = {
        latitude:
          posicao.coords.latitude,

        longitude:
          posicao.coords.longitude,

        precisaoMetros:
          posicao.coords.accuracy,

        obtidaEm: Date.now(),
      };

      setLocalizacao(novaLocalizacao);

      setMensagemSucesso(
        `Localização obtida com precisão aproximada de ${Math.round(
          novaLocalizacao.precisaoMetros
        )} metros.`
      );

      return novaLocalizacao;
    } catch (error) {
      const mensagem =
        mensagemErroLocalizacao(error);

      setMensagemErro(mensagem);

      throw new Error(mensagem);
    } finally {
      setObtendoLocalizacao(false);
    }
  }

  async function enviarFotoPrivada() {
    if (fotoPathname) {
      return fotoPathname;
    }

    if (!fotoBlob) {
      return null;
    }

    setEtapaProcessamento(
      "Preparando envio seguro da foto..."
    );

    const respostaPreparacao = await fetch(
      `/api/rh-app/${encodeURIComponent(
        slug
      )}/ponto/foto/upload-url`,
      {
        method: "POST",
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          contentType:
            fotoBlob.type ||
            "image/webp",
        }),
      }
    );

    const dadosPreparacao: RespostaUpload =
      await respostaPreparacao.json();

    if (!respostaPreparacao.ok) {
      throw new Error(
        dadosPreparacao.error ||
          "Não foi possível preparar o envio da foto."
      );
    }

    const upload =
      dadosPreparacao.upload;

    if (
      !upload?.url ||
      !upload.pathname
    ) {
      throw new Error(
        "O armazenamento não retornou uma autorização válida."
      );
    }

    setEtapaProcessamento(
      "Enviando foto com segurança..."
    );

    const respostaUpload = await fetch(
      upload.url,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            upload.contentType ||
            fotoBlob.type ||
            "image/webp",
        },

        body: fotoBlob,
      }
    );

    if (!respostaUpload.ok) {
      throw new Error(
        "Não foi possível enviar a foto para o armazenamento privado."
      );
    }

    setFotoPathname(upload.pathname);

    return upload.pathname;
  }

  async function registrarPonto() {
    try {
      setProcessando(true);
      setMensagemErro("");
      setMensagemSucesso("");
      setComprovante(null);

      setEtapaProcessamento(
        "Conferindo sua autorização..."
      );

      const contextoAtual =
        await carregarContexto(true);

      if (
        contextoAtual.jornada.concluida ||
        !contextoAtual.jornada.proximoTipo
      ) {
        throw new Error(
          "A jornada de hoje já está concluída."
        );
      }

      if (
        contextoAtual.configuracao
          .reconhecimentoFacialAtivo
      ) {
        throw new Error(
          "O reconhecimento facial está ativado, mas ainda não foi configurado."
        );
      }

      if (
        contextoAtual.configuracao
          .exigirProvaVida
      ) {
        throw new Error(
          "A prova de vida está ativada, mas ainda não foi configurada."
        );
      }

      if (
        contextoAtual.configuracao
          .exigirFoto &&
        !fotoBlob &&
        !fotoPathname
      ) {
        throw new Error(
          "Tire uma foto ao vivo antes de registrar o ponto."
        );
      }

      let localizacaoParaEnvio =
        localizacao;

      const localizacaoExpirada =
        !localizacaoParaEnvio ||
        Date.now() -
          localizacaoParaEnvio.obtidaEm >
          VALIDADE_LOCALIZACAO_MS;

      if (
        contextoAtual.configuracao
          .exigirLocalizacao &&
        localizacaoExpirada
      ) {
        setEtapaProcessamento(
          "Obtendo sua localização..."
        );

        localizacaoParaEnvio =
          await obterLocalizacaoAtual();
      }

      const pathnameFoto =
        await enviarFotoPrivada();

      if (
        contextoAtual.configuracao
          .exigirFoto &&
        !pathnameFoto
      ) {
        throw new Error(
          "A foto obrigatória não foi enviada."
        );
      }

      if (!idempotenciaRef.current) {
        idempotenciaRef.current =
          `ponto:${gerarIdentificadorSeguro()}`;
      }

      setEtapaProcessamento(
        "Registrando o ponto..."
      );

      const resposta = await fetch(
        `/api/rh-app/${encodeURIComponent(
          slug
        )}/ponto/marcar`,
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            idempotenciaChave:
              idempotenciaRef.current,

            fotoPathname:
              pathnameFoto,

            latitude:
              localizacaoParaEnvio?.latitude ??
              null,

            longitude:
              localizacaoParaEnvio?.longitude ??
              null,

            precisaoMetros:
              localizacaoParaEnvio
                ?.precisaoMetros ?? null,

            dispositivoId:
              obterDispositivoId(),
          }),
        }
      );

      const dados: RespostaMarcacao =
        await resposta.json();

      if (!resposta.ok) {
        if (resposta.status === 401) {
          window.location.href =
            `/rh-app/${encodeURIComponent(
              slug
            )}/login`;

          return;
        }

        throw new Error(
          dados.error ||
            "Não foi possível registrar o ponto."
        );
      }

      if (
        !dados.sucesso ||
        !dados.marcacao
      ) {
        throw new Error(
          "O servidor não retornou o comprovante da marcação."
        );
      }

      setComprovante(dados.marcacao);

      setMensagemSucesso(
        dados.mensagem ||
          "Ponto registrado com sucesso."
      );

      idempotenciaRef.current = null;

      limparFoto();
      setLocalizacao(null);

      await carregarContexto(true);
    } catch (error) {
      setMensagemErro(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o ponto."
      );
    } finally {
      setProcessando(false);
      setEtapaProcessamento("");
    }
  }

  if (carregandoContexto && !contexto) {
    return (
      <section className="rounded-[30px] border border-slate-700 bg-slate-900 p-6">
        <p className="text-sm font-bold text-slate-300">
          Carregando registro de ponto...
        </p>
      </section>
    );
  }

  if (!contexto) {
    return (
      <section className="rounded-[30px] border border-red-800 bg-red-950/40 p-6">
        <p className="font-black text-red-100">
          Registro de ponto indisponível
        </p>

        <p className="mt-2 text-sm leading-6 text-red-200">
          {mensagemErro ||
            "Não foi possível carregar os dados."}
        </p>

        <button
          type="button"
          onClick={() => {
            setMensagemErro("");

            carregarContexto()
              .catch(() => undefined);
          }}
          className="mt-5 min-h-12 w-full rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
        >
          Tentar novamente
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[30px] border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
              Horário oficial
            </p>

            <p className="mt-2 text-4xl font-black tabular-nums text-white">
              {horarioAtual}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              {contexto.servidor.fusoHorario}
            </p>
          </div>

          <span className="rounded-full border border-blue-800 bg-blue-950 px-3 py-2 text-xs font-black text-blue-200">
            {contexto.jornada.concluida
              ? "Concluída"
              : rotuloTipoMarcacao(
                  contexto.jornada
                    .proximoTipo || ""
                )}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Próxima marcação
          </p>

          <p className="mt-2 text-lg font-black text-white">
            {contexto.jornada
              .proximoTipoRotulo}
          </p>
        </div>
      </div>

      {processamentoEspecialPendente && (
        <div className="rounded-[30px] border border-amber-700 bg-amber-950/40 p-6">
          <p className="font-black text-amber-100">
            Configuração pendente
          </p>

          <p className="mt-2 text-sm leading-6 text-amber-200">
            O reconhecimento facial ou a prova de vida
            está ativado, mas esse processamento ainda
            precisa ser configurado pelo PHANYX.
          </p>
        </div>
      )}

      {semLocalAutorizado && (
        <div className="rounded-[30px] border border-amber-700 bg-amber-950/40 p-6">
          <p className="font-black text-amber-100">
            Local autorizado não cadastrado
          </p>

          <p className="mt-2 text-sm leading-6 text-amber-200">
            O RH precisa cadastrar ao menos um local
            autorizado antes que o ponto possa ser
            registrado pelo celular.
          </p>
        </div>
      )}

      <div className="rounded-[30px] border border-slate-700 bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
              Foto ao vivo
            </p>

            <p className="mt-2 text-sm text-slate-300">
              {configuracao?.exigirFoto
                ? "Obrigatória para esta instituição"
                : "Não obrigatória"}
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${
              fotoPronta
                ? "border-emerald-700 bg-emerald-950 text-emerald-200"
                : "border-slate-600 bg-slate-950 text-slate-300"
            }`}
          >
            {fotoPronta
              ? "Foto pronta"
              : "Pendente"}
          </span>
        </div>

        {cameraAtiva && (
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-600 bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="aspect-[3/4] w-full object-cover"
            />
          </div>
        )}

        {fotoPreview && !cameraAtiva && (
          <div className="mt-5 overflow-hidden rounded-3xl border border-emerald-700 bg-black">
            <img
              src={fotoPreview}
              alt="Foto capturada para o registro de ponto"
              className="aspect-[3/4] w-full object-cover"
            />
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {!cameraAtiva ? (
            <button
              type="button"
              disabled={
                abrindoCamera || processando
              }
              onClick={abrirCamera}
              className="min-h-12 rounded-2xl bg-blue-600 px-4 py-3 font-black text-white disabled:opacity-50"
            >
              {abrindoCamera
                ? "Abrindo câmera..."
                : fotoPronta
                  ? "Refazer foto"
                  : "Abrir câmera"}
            </button>
          ) : (
            <button
              type="button"
              disabled={processando}
              onClick={capturarFoto}
              className="min-h-12 rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-50"
            >
              Tirar foto
            </button>
          )}

          {cameraAtiva ? (
            <button
              type="button"
              onClick={pararCamera}
              className="min-h-12 rounded-2xl border border-slate-600 bg-slate-950 px-4 py-3 font-black text-slate-200"
            >
              Cancelar câmera
            </button>
          ) : fotoPronta ? (
            <button
              type="button"
              disabled={processando}
              onClick={limparFoto}
              className="min-h-12 rounded-2xl border border-red-800 bg-red-950/40 px-4 py-3 font-black text-red-200 disabled:opacity-50"
            >
              Remover foto
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-[30px] border border-slate-700 bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
              Localização
            </p>

            <p className="mt-2 text-sm text-slate-300">
              {configuracao?.exigirLocalizacao
                ? "Obrigatória para esta instituição"
                : "Não obrigatória"}
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${
              localizacao
                ? "border-emerald-700 bg-emerald-950 text-emerald-200"
                : "border-slate-600 bg-slate-950 text-slate-300"
            }`}
          >
            {localizacao
              ? "Localizada"
              : "Pendente"}
          </span>
        </div>

        {localizacao && (
          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
            <p className="text-sm font-bold text-emerald-200">
              Localização obtida
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Precisão aproximada:{" "}
              {Math.round(
                localizacao.precisaoMetros
              )}{" "}
              metros.
            </p>
          </div>
        )}

        <button
          type="button"
          disabled={
            obtendoLocalizacao ||
            processando
          }
          onClick={() => {
            obterLocalizacaoAtual()
              .catch(() => undefined);
          }}
          className="mt-5 min-h-12 w-full rounded-2xl border border-blue-700 bg-blue-950 px-4 py-3 font-black text-blue-200 disabled:opacity-50"
        >
          {obtendoLocalizacao
            ? "Obtendo localização..."
            : localizacao
              ? "Atualizar localização"
              : "Obter localização"}
        </button>
      </div>

      {mensagemErro && (
        <div className="rounded-[26px] border border-red-800 bg-red-950/50 p-5">
          <p className="font-black text-red-100">
            Não foi possível concluir
          </p>

          <p className="mt-2 text-sm leading-6 text-red-200">
            {mensagemErro}
          </p>
        </div>
      )}

      {mensagemSucesso && (
        <div className="rounded-[26px] border border-emerald-800 bg-emerald-950/40 p-5">
          <p className="font-black text-emerald-100">
            Tudo certo
          </p>

          <p className="mt-2 text-sm leading-6 text-emerald-200">
            {mensagemSucesso}
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={botaoDesabilitado}
        onClick={registrarPonto}
        className="min-h-16 w-full rounded-[22px] bg-blue-600 px-5 py-4 text-lg font-black text-white shadow-xl transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {processando
          ? etapaProcessamento ||
            "Processando..."
          : contexto.jornada.concluida
            ? "Jornada concluída"
            : contexto.jornada
                .proximoTipoRotulo}
      </button>

      {fotoObrigatoriaAusente &&
        !processando && (
          <p className="text-center text-xs text-slate-400">
            Tire a foto ao vivo para habilitar o
            registro.
          </p>
        )}

      {comprovante && (
        <div className="rounded-[30px] border border-emerald-700 bg-emerald-950/40 p-6 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            Comprovante de marcação
          </p>

          <h3 className="mt-3 text-xl font-black text-white">
            {comprovante.tipoRotulo}
          </h3>

          <p className="mt-3 text-sm text-emerald-100">
            {formatarDataHora(
              comprovante.dataHora,
              contexto.servidor.fusoHorario
            )}
          </p>

          <div className="mt-5 rounded-2xl border border-emerald-800 bg-slate-950/50 p-4">
            <p className="text-xs text-slate-400">
              Código do comprovante
            </p>

            <p className="mt-2 break-all font-mono text-sm font-black text-emerald-200">
              {comprovante.comprovanteCodigo}
            </p>
          </div>

          {comprovante.localNome && (
            <p className="mt-4 text-sm text-emerald-100">
              Local:{" "}
              <strong>
                {comprovante.localNome}
              </strong>
            </p>
          )}

          {typeof comprovante.distanciaMetros ===
            "number" && (
            <p className="mt-2 text-xs text-emerald-200">
              Distância aproximada:{" "}
              {Math.round(
                comprovante.distanciaMetros
              )}{" "}
              metros.
            </p>
          )}
        </div>
      )}

      <div className="rounded-[30px] border border-slate-700 bg-slate-900 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
          Marcações de hoje
        </p>

        {contexto.jornada.marcacoesHoje.length ===
        0 ? (
          <p className="mt-4 text-sm text-slate-400">
            Nenhuma marcação registrada hoje.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {contexto.jornada.marcacoesHoje.map(
              (marcacao) => (
                <div
                  key={
                    marcacao.comprovanteCodigo
                  }
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-4"
                >
                  <div>
                    <p className="font-black text-white">
                      {rotuloTipoMarcacao(
                        marcacao.tipo
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {rotuloStatusLocalizacao(
                        marcacao.statusLocalizacao
                      )}
                    </p>
                  </div>

                  <p className="shrink-0 font-mono text-sm font-black text-blue-200">
                    {formatarHorario(
                      marcacao.dataHora,
                      contexto.servidor
                        .fusoHorario
                    )}
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}