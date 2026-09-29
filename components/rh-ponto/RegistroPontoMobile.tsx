"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";

type TipoMarcacao =
  | "ENTRADA"
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
    concluida: boolean;
    ultimaMarcacaoTipo: string | null;

    opcoesMarcacao: Array<{
      tipo: TipoMarcacao;
      rotulo: string;
    }>;

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
    pathname: string;
    contentType: string;
    tamanhoBytes: number;
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
    ultimaMarcacaoTipo: string | null;
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
  fusoHorario: string,
  locale: string
) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return dataIso;
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: fusoHorario,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(data);
  } catch {
    return data.toLocaleString(locale);
  }
}

function formatarHorario(
  dataIso: string,
  fusoHorario: string,
  locale: string
) {
  const data = new Date(dataIso);

  if (Number.isNaN(data.getTime())) {
    return "--:--";
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: fusoHorario,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(data);
  } catch {
    return data.toLocaleTimeString(locale);
  }
}

type TranslatePoint = (key: string, values?: Record<string, string | number>) => string;

function rotuloTipoMarcacao(tipo: string, tr: TranslatePoint) {
  switch (tipo) {
    case "ENTRADA": return tr("registration.typeEntry");
    case "SAIDA_ALMOCO": return tr("registration.typeLunchOut");
    case "RETORNO_ALMOCO": return tr("registration.typeLunchReturn");
    case "SAIDA": return tr("registration.typeExit");
    default: return tr("registration.chooseEntryExit");
  }
}

function rotuloStatusLocalizacao(status: string, tr: TranslatePoint) {
  switch (status) {
    case "DENTRO_DO_RAIO": return tr("registration.locationInside");
    case "FORA_DO_RAIO_PERMITIDA": return tr("registration.locationOutsideAllowed");
    case "NAO_EXIGIDA": return tr("registration.locationNotRequired");
    case "SEM_LOCAL_ATIVO": return tr("registration.locationNoSite");
    case "NAO_VERIFICADA": return tr("registration.locationUnverified");
    default: return tr("registration.locationUnknown");
  }
}

function mensagemErroLocalizacao(error: unknown, tr: TranslatePoint) {
  const codigo = Number((error as GeolocationPositionError)?.code);
  if (codigo === 1) return tr("registration.geoDenied");
  if (codigo === 2) return tr("registration.geoUnavailable");
  if (codigo === 3) return tr("registration.geoTimeout");
  return tr("registration.geoFailed");
}

function mensagemErroCamera(error: unknown, tr: TranslatePoint) {
  const nome = String((error as DOMException)?.name || "");
  if (nome === "NotAllowedError" || nome === "PermissionDeniedError") {
    return tr("registration.cameraDenied");
  }
  if (nome === "NotFoundError" || nome === "DevicesNotFoundError") {
    return tr("registration.cameraNotFound");
  }
  if (nome === "NotReadableError" || nome === "TrackStartError") {
    return tr("registration.cameraBusy");
  }
  return tr("registration.cameraFailed");
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
  video: HTMLVideoElement,
  tr: TranslatePoint
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
        tr("registration.photoPrepareFailed")
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
    tr("registration.photoTooLarge")
  );
}

export default function RegistroPontoMobile({
  slug,
}: RegistroPontoMobileProps) {
  const t = useTranslations("RhAppPoint");
  const locale = useLocale();
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

  const [
    tipoSelecionado,
    setTipoSelecionado,
  ] = useState<TipoMarcacao | null>(null);

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
            t("registration.loadFailed")
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
            : t("registration.loadFailed");

        setMensagemErro(mensagem);

        throw error;
      } finally {
        if (!silencioso) {
          setCarregandoContexto(false);
        }
      }
    },
    [slug, t]
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
      return new Intl.DateTimeFormat(locale, {
        timeZone: fusoHorario,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(dataHoraAtualServidor);
    } catch {
      return dataHoraAtualServidor
        .toLocaleTimeString(locale);
    }
  }, [
    contexto?.servidor.fusoHorario,
    dataHoraAtualServidor,
    locale,
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

  const localizacaoObrigatoriaAusente =
    configuracao?.exigirLocalizacao ===
      true &&
    !localizacao;

  const tipoMarcacaoAusente =
    !tipoSelecionado;

  const botaoDesabilitado =
    carregandoContexto ||
    processando ||
    !contexto ||
    jornada?.concluida === true ||
    tipoMarcacaoAusente ||
    fotoObrigatoriaAusente ||
    localizacaoObrigatoriaAusente ||
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
          t("registration.cameraUnsupported")
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
        mensagemErroCamera(error, t)
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
          t("registration.cameraNotReady")
        );
      }

      const blob =
        await criarFotoCompactada(video, t);

      revogarPreview();

      const preview =
        URL.createObjectURL(blob);

      previewUrlRef.current = preview;

      setFotoBlob(blob);
      setFotoPreview(preview);
      setFotoPathname(null);

      idempotenciaRef.current = null;

      pararCamera();

      if (!tipoSelecionado) {
        setMensagemSucesso(
          configuracao?.exigirLocalizacao &&
          !localizacao
            ? t("registration.photoCapturedChooseAndLocate")
            : t("registration.photoCapturedChoose")
        );
      } else {
        setMensagemSucesso(
          configuracao?.exigirLocalizacao &&
          !localizacao
            ? t("registration.photoCapturedLocate")
            : t("registration.photoCapturedReady")
        );
      }
    } catch (error) {
      setMensagemErro(
        error instanceof Error
          ? error.message
          : t("registration.photoCaptureFailed")
      );
    }
  }

  async function obterLocalizacaoAtual() {
    try {
      setMensagemErro("");
      setObtendoLocalizacao(true);

      if (!navigator.geolocation) {
        throw new Error(
          t("registration.geoUnsupported")
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
        tipoSelecionado
          ? t("registration.geoAccuracy", {
              meters: Math.round(novaLocalizacao.precisaoMetros)
            })
          : t("registration.geoAccuracyChoose", {
              meters: Math.round(novaLocalizacao.precisaoMetros)
            })
      );

      return novaLocalizacao;
    } catch (error) {
      const mensagem =
        mensagemErroLocalizacao(error, t);

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
      t("registration.uploadingPhoto")
    );

    const extensao =
      fotoBlob.type === "image/jpeg"
        ? "jpg"
        : fotoBlob.type === "image/png"
          ? "png"
          : "webp";

    const formularioFoto =
      new FormData();

    formularioFoto.append(
      "foto",
      fotoBlob,
      `foto-ponto.${extensao}`
    );

    const controlador =
      new AbortController();

    const timer =
      window.setTimeout(() => {
        controlador.abort();
      }, 60_000);

    try {
      const resposta =
        await fetch(
          `/api/rh-app/${encodeURIComponent(
            slug
          )}/ponto/foto/upload-url`,
          {
            method: "POST",
            credentials: "include",

            body: formularioFoto,

            signal:
              controlador.signal,
          }
        );

      const dados: RespostaUpload =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          t("registration.photoUploadFailed")
        );
      }

      const pathname =
        dados.upload?.pathname;

      if (!pathname) {
        throw new Error(
          t("registration.photoAddressMissing")
        );
      }

      setFotoPathname(pathname);

      return pathname;
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        throw new Error(
          t("registration.photoUploadTimeout")
        );
      }

      throw error;
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function registrarPonto() {
    try {
      setProcessando(true);
      setMensagemErro("");
      setMensagemSucesso("");
      setComprovante(null);

      setEtapaProcessamento(
        t("registration.checkingAccess")
      );

      const contextoAtual =
        await carregarContexto(true);

      const tipoParaRegistrar =
        tipoSelecionado;

      if (!tipoParaRegistrar) {
        throw new Error(
          t("registration.chooseTypeError")
        );
      }

      if (
        contextoAtual.configuracao
          .reconhecimentoFacialAtivo
      ) {
        throw new Error(
          t("registration.facePending")
        );
      }

      if (
        contextoAtual.configuracao
          .exigirProvaVida
      ) {
        throw new Error(
          t("registration.livenessPending")
        );
      }

      if (
        contextoAtual.configuracao
          .exigirFoto &&
        !fotoBlob &&
        !fotoPathname
      ) {
        throw new Error(
          t("registration.takeLivePhoto")
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
          t("registration.gettingLocation")
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
          t("registration.requiredPhotoMissing")
        );
      }

      if (!idempotenciaRef.current) {
        idempotenciaRef.current =
          `ponto:${tipoParaRegistrar}:${gerarIdentificadorSeguro()}`;
      }

      setEtapaProcessamento(
        t("registration.registering")
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
            tipo: tipoParaRegistrar,

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
          t("registration.registerFailed")
        );
      }

      if (
        !dados.sucesso ||
        !dados.marcacao
      ) {
        throw new Error(
          t("registration.receiptMissing")
        );
      }

      setComprovante(dados.marcacao);

      setMensagemSucesso(
        dados.repetida
          ? t("registration.alreadyProcessed")
          : t("registration.registerSuccess")
      );

      idempotenciaRef.current = null;

      limparFoto();
      setLocalizacao(null);
      setTipoSelecionado(null);

      await carregarContexto(true);
    } catch (error) {
      setMensagemErro(
        error instanceof Error
          ? error.message
          : t("registration.registerFailed")
      );
    } finally {
      setProcessando(false);
      setEtapaProcessamento("");
    }
  }

  if (carregandoContexto && !contexto) {
    return (
      <section className="rounded-[30px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-6">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{t("registration.loading")}</p>
      </section>
    );
  }

  if (!contexto) {
    return (
      <section className="rounded-[30px] border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 p-6">
        <p className="font-black text-red-900 dark:text-red-100">{t("registration.unavailable")}</p>

        <p className="mt-2 text-sm leading-6 text-red-800 dark:text-red-200">
          {mensagemErro ||
            t("registration.dataLoadFailed")}
        </p>

        <button
          type="button"
          onClick={() => {
            setMensagemErro("");

            carregarContexto()
              .catch(() => undefined);
          }}
          className="mt-5 min-h-12 w-full rounded-2xl bg-blue-600 px-4 py-3 font-black text-white"
        >{t("registration.retry")}</button>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[30px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">{t("registration.officialTime")}</p>

            <p className="mt-2 text-4xl font-black tabular-nums text-slate-900 dark:text-white">
              {horarioAtual}
            </p>

            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {contexto.servidor.fusoHorario}
            </p>
          </div>

          <span className="rounded-full border border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 px-3 py-2 text-xs font-black text-blue-800 dark:text-blue-200">
            {contexto.jornada
              .ultimaMarcacaoTipo
              ? t("registration.lastMark", {
                  type: rotuloTipoMarcacao(
                    contexto.jornada.ultimaMarcacaoTipo,
                    t
                  )
                })
              : t("registration.noMarksToday")}
          </span>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t("registration.title")}</p>

          <p className="mt-2 text-lg font-black text-slate-900 dark:text-white">{t("registration.chooseBeforeRegister")}</p>
        </div>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">{t("registration.markType")}</p>

            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{t("registration.chooseCarefully")}</p>
          </div>

          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${
              tipoSelecionado
                ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200"
                : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            }`}
          >
            {tipoSelecionado
              ? rotuloTipoMarcacao(
                  tipoSelecionado, t
                )
              : t("registration.pending")}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {contexto.jornada.opcoesMarcacao.map(
            (opcao) => {
              const selecionada =
                tipoSelecionado ===
                opcao.tipo;

              return (
                <button
                  key={opcao.tipo}
                  type="button"
                  disabled={processando}
                  onClick={() => {
                    setTipoSelecionado(
                      opcao.tipo
                    );

                    idempotenciaRef.current =
                      null;

                    setMensagemErro("");

                    setMensagemSucesso(
                      opcao.tipo ===
                        "ENTRADA"
                        ? t("registration.entrySelected")
                        : t("registration.exitSelected")
                    );
                  }}
                  className={`min-h-16 rounded-2xl border px-4 py-4 text-base font-black transition disabled:opacity-50 ${
                    selecionada
                      ? opcao.tipo ===
                        "ENTRADA"
                        ? "border-emerald-500 bg-emerald-600 text-white"
                        : "border-red-500 bg-red-700 text-white"
                      : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {opcao.tipo ===
                  "ENTRADA"
                    ? t("registration.registerEntry")
                    : t("registration.registerExit")}
                </button>
              );
            }
          )}
        </div>

        {contexto.jornada
          .ultimaMarcacaoTipo && (
          <p className="mt-4 text-xs leading-5 text-slate-600 dark:text-slate-400">{t("registration.lastToday")}{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {rotuloTipoMarcacao(
                contexto.jornada.ultimaMarcacaoTipo,
                t
              )}
            </strong>
            {". "}{t("registration.repeatAllowed")}
          </p>
        )}
      </div>

      {processamentoEspecialPendente && (
        <div className="rounded-[30px] border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 p-6">
          <p className="font-black text-amber-900 dark:text-amber-100">{t("registration.setupPending")}</p>

          <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-200">{t("registration.setupPendingDescription")}</p>
        </div>
      )}

      {semLocalAutorizado && (
        <div className="rounded-[30px] border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 p-6">
          <p className="font-black text-amber-900 dark:text-amber-100">{t("registration.noAuthorizedSite")}</p>

          <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-200">{t("registration.noAuthorizedSiteDescription")}</p>
        </div>
      )}

      <div className="rounded-[30px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">{t("registration.livePhoto")}</p>

            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {configuracao?.exigirFoto
                ? t("registration.required")
                : t("registration.optional")}
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${
              fotoPronta
                ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200"
                : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            }`}
          >
            {fotoPronta
              ? t("registration.photoReady")
              : t("registration.pending")}
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
              alt={t("registration.photoAlt")}
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
                ? t("registration.openingCamera")
                : fotoPronta
                  ? t("registration.retakePhoto")
                  : t("registration.openCamera")}
            </button>
          ) : (
            <button
              type="button"
              disabled={processando}
              onClick={capturarFoto}
              className="min-h-12 rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-50"
            >{t("registration.takePhoto")}</button>
          )}

          {cameraAtiva ? (
            <button
              type="button"
              onClick={pararCamera}
              className="min-h-12 rounded-2xl border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 px-4 py-3 font-black text-slate-800 dark:text-slate-200"
            >{t("registration.cancelCamera")}</button>
          ) : fotoPronta ? (
            <button
              type="button"
              disabled={processando}
              onClick={limparFoto}
              className="min-h-12 rounded-2xl border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 px-4 py-3 font-black text-red-800 dark:text-red-200 disabled:opacity-50"
            >{t("registration.removePhoto")}</button>
          ) : null}
        </div>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">{t("registration.location")}</p>

            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {configuracao?.exigirLocalizacao
                ? t("registration.required")
                : t("registration.optional")}
            </p>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${
              localizacao
                ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200"
                : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
            }`}
          >
            {localizacao
              ? t("registration.located")
              : t("registration.pending")}
          </span>
        </div>

        {localizacao && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60 p-4">
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">{t("registration.locationObtained")}</p>

            <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{t("registration.approxAccuracy")}{" "}
              {Math.round(
                localizacao.precisaoMetros
              )}{" "}{t("registration.meters")}</p>
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
          className="mt-5 min-h-12 w-full rounded-2xl border border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950 px-4 py-3 font-black text-blue-800 dark:text-blue-200 disabled:opacity-50"
        >
          {obtendoLocalizacao
            ? t("registration.gettingLocationShort")
            : localizacao
              ? t("registration.updateLocation")
              : t("registration.getLocation")}
        </button>
      </div>

      {mensagemErro && (
        <div className="rounded-[26px] border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/50 p-5">
          <p className="font-black text-red-900 dark:text-red-100">{t("registration.couldNotFinish")}</p>

          <p className="mt-2 text-sm leading-6 text-red-800 dark:text-red-200">
            {mensagemErro}
          </p>
        </div>
      )}

      {mensagemSucesso && (
        <div className="rounded-[26px] border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 p-5">
          <p className="font-black text-emerald-900 dark:text-emerald-100">{t("registration.allSet")}</p>

          <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-200">
            {mensagemSucesso}
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={botaoDesabilitado}
        onClick={registrarPonto}
        className="min-h-16 w-full rounded-[22px] bg-blue-600 px-5 py-4 text-lg font-black text-white shadow-xl transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-slate-700 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
      >
        {processando
          ? etapaProcessamento ||
            t("registration.processing")
          : !tipoSelecionado
            ? t("registration.chooseEntryExit")
            : tipoSelecionado ===
                "ENTRADA"
              ? t("registration.registerEntry")
              : t("registration.registerExit")}
      </button>

      {!processando &&
        (tipoMarcacaoAusente ||
          fotoObrigatoriaAusente ||
          localizacaoObrigatoriaAusente) && (
          <p className="text-center text-xs leading-5 text-slate-600 dark:text-slate-400">
            {tipoMarcacaoAusente
              ? t("registration.chooseToContinue")
              : fotoObrigatoriaAusente &&
                  localizacaoObrigatoriaAusente
                ? t("registration.takePhotoAndLocate")
                : fotoObrigatoriaAusente
                  ? t("registration.takePhotoToEnable")
                  : t("registration.locateToEnable")}
          </p>
        )}

      {comprovante && (
        <div className="rounded-[30px] border border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40 p-6 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">{t("registration.receiptTitle")}</p>

          <h3 className="mt-3 text-xl font-black text-slate-900 dark:text-white">
            {rotuloTipoMarcacao(comprovante.tipo, t)}
          </h3>

          <p className="mt-3 text-sm text-emerald-900 dark:text-emerald-100">
            {formatarDataHora(
              comprovante.dataHora,
              contexto.servidor.fusoHorario,
              locale
            )}
          </p>

          <div className="mt-5 rounded-2xl border border-emerald-300 bg-white/70 dark:border-emerald-800 dark:bg-slate-950/50 p-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">{t("registration.receiptCode")}</p>

            <p className="mt-2 break-all font-mono text-sm font-black text-emerald-800 dark:text-emerald-200">
              {comprovante.comprovanteCodigo}
            </p>
          </div>

          {comprovante.localNome && (
            <p className="mt-4 text-sm text-emerald-900 dark:text-emerald-100">{t("registration.siteLabel")}{" "}
              <strong>
                {comprovante.localNome}
              </strong>
            </p>
          )}

          {typeof comprovante.distanciaMetros ===
            "number" && (
            <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">{t("registration.approxDistance")}{" "}
              {Math.round(
                comprovante.distanciaMetros
              )}{" "}{t("registration.meters")}</p>
          )}
        </div>
      )}

      <div className="rounded-[30px] border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">{t("registration.todayMarks")}</p>

        {contexto.jornada.marcacoesHoje.length ===
        0 ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">{t("registration.noTodayMarks")}</p>
        ) : (
          <div className="mt-4 space-y-3">
            {contexto.jornada.marcacoesHoje.map(
              (marcacao) => (
                <div
                  key={
                    marcacao.comprovanteCodigo
                  }
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60 p-4"
                >
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">
                      {rotuloTipoMarcacao(
                        marcacao.tipo, t
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {rotuloStatusLocalizacao(
                        marcacao.statusLocalizacao, t
                      )}
                    </p>
                  </div>

                  <p className="shrink-0 font-mono text-sm font-black text-blue-800 dark:text-blue-200">
                    {formatarHorario(
                      marcacao.dataHora,
                      contexto.servidor
                        .fusoHorario,
                      locale
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
