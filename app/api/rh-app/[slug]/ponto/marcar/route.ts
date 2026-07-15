import crypto from "crypto";
import { head } from "@vercel/blob";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContextoRota = {
  params: {
    slug: string;
  };
};

const SEQUENCIA_MARCACOES = [
  "ENTRADA",
  "SAIDA_ALMOCO",
  "RETORNO_ALMOCO",
  "SAIDA",
] as const;

type TipoMarcacao =
  (typeof SEQUENCIA_MARCACOES)[number];

type LocalProximoBanco = {
  id: number;
  nome: string;
  raioMetros: number;
  distanciaMetros: number;
};

type ResultadoLocalizacao = {
  latitude: number | null;
  longitude: number | null;
  precisaoMetros: number | null;
  distanciaMetros: number | null;
  localId: number | null;
  localNome: string | null;
  statusLocalizacao: string;
};

type ResultadoFoto = {
  fotoUrl: string | null;
  fotoPathname: string | null;
  fotoHash: string | null;
};

class ErroHttp extends Error {
  status: number;
  codigo?: string;
  detalhes?: Record<string, unknown>;

  constructor(
    status: number,
    mensagem: string,
    codigo?: string,
    detalhes?: Record<string, unknown>
  ) {
    super(mensagem);

    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

const TAMANHO_MAXIMO_FOTO =
  2 * 1024 * 1024;

const PRECISAO_MAXIMA_METROS = 500;

const TEMPO_MAXIMO_FOTO_MS =
  30 * 60 * 1000;

const INTERVALO_MINIMO_MARCACOES_MS =
  60 * 1000;

const DURACAO_MAXIMA_JORNADA_MS =
  48 * 60 * 60 * 1000;

const MAX_TENTATIVAS_TRANSACAO = 4;

const CONTENT_TYPES_PERMITIDOS = new Set([
  "image/webp",
  "image/jpeg",
  "image/png",
]);

function normalizarSlug(valor: unknown) {
  try {
    return decodeURIComponent(String(valor || ""))
      .trim()
      .toLowerCase();
  } catch {
    return String(valor || "")
      .trim()
      .toLowerCase();
  }
}

function obterDataLocalTexto(
  data: Date,
  fusoHorario: string
) {
  try {
    const partes = new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: fusoHorario,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(data);

    const ano =
      partes.find(
        (parte) => parte.type === "year"
      )?.value || "";

    const mes =
      partes.find(
        (parte) => parte.type === "month"
      )?.value || "";

    const dia =
      partes.find(
        (parte) => parte.type === "day"
      )?.value || "";

    if (!ano || !mes || !dia) {
      return data.toISOString().slice(0, 10);
    }

    return `${ano}-${mes}-${dia}`;
  } catch {
    return data.toISOString().slice(0, 10);
  }
}

function criarDataLocalCanonica(
  dataTexto: string
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dataTexto)
  ) {
    throw new ErroHttp(
      500,
      "Não foi possível determinar a data da jornada."
    );
  }

  const data = new Date(
    `${dataTexto}T00:00:00.000Z`
  );

  if (Number.isNaN(data.getTime())) {
    throw new ErroHttp(
      500,
      "Não foi possível determinar a data da jornada."
    );
  }

  return data;
}

function obterProximoTipo(
  tiposRegistrados: string[]
): TipoMarcacao | null {
  const tiposDoDia = new Set(
    tiposRegistrados.map((tipo) =>
      String(tipo || "")
        .trim()
        .toUpperCase()
    )
  );

  return (
    SEQUENCIA_MARCACOES.find(
      (tipo) => !tiposDoDia.has(tipo)
    ) || null
  );
}

function obterRotuloTipo(
  tipo: string | null
) {
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
      return "Jornada concluída";
  }
}

function obterMensagemSucesso(
  tipo: TipoMarcacao
) {
  switch (tipo) {
    case "ENTRADA":
      return "Entrada registrada com sucesso.";

    case "SAIDA_ALMOCO":
      return "Saída para almoço registrada com sucesso.";

    case "RETORNO_ALMOCO":
      return "Retorno do almoço registrado com sucesso.";

    case "SAIDA":
      return "Saída registrada com sucesso.";

    default:
      return "Ponto registrado com sucesso.";
  }
}

function valorAusente(valor: unknown) {
  return (
    valor === null ||
    valor === undefined ||
    valor === ""
  );
}

function lerNumero(
  valor: unknown,
  nomeCampo: string,
  minimo: number,
  maximo: number
) {
  const numero = Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero < minimo ||
    numero > maximo
  ) {
    throw new ErroHttp(
      400,
      `${nomeCampo} inválida.`
    );
  }

  return numero;
}

function sanitizarTexto(
  valor: unknown,
  tamanhoMaximo: number
) {
  const texto = String(valor || "").trim();

  if (!texto) {
    return null;
  }

  return texto.slice(0, tamanhoMaximo);
}

function obterIp(req: NextRequest) {
  const encaminhado =
    req.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() || "";

  const ipReal =
    req.headers.get("x-real-ip")?.trim() || "";

  return (
    encaminhado ||
    ipReal ||
    null
  )?.slice(0, 120);
}

function gerarCodigoComprovante(
  dataLocalTexto: string
) {
  const dataSemTracos =
    dataLocalTexto.replace(/-/g, "");

  const aleatorio = crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();

  return `PHX-${dataSemTracos}-${aleatorio}`;
}

function alvoErroPrisma(error: unknown) {
  if (
    !(
      error instanceof
      Prisma.PrismaClientKnownRequestError
    )
  ) {
    return "";
  }

  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.join(",");
  }

  return String(target || "");
}

function calcularHorasTrabalhadas(
  marcacoes: Array<{
    tipo: string;
    dataHora: Date;
  }>,
  tipoAtual: TipoMarcacao,
  dataHoraAtual: Date
) {
  if (tipoAtual !== "SAIDA") {
    return null;
  }

  function horario(tipo: TipoMarcacao) {
    if (tipo === tipoAtual) {
      return dataHoraAtual;
    }

    return marcacoes.find(
      (marcacao) =>
        marcacao.tipo === tipo
    )?.dataHora;
  }

  const entrada = horario("ENTRADA");

  const saidaAlmoco =
    horario("SAIDA_ALMOCO");

  const retornoAlmoco =
    horario("RETORNO_ALMOCO");

  const saida = horario("SAIDA");

  if (
    !entrada ||
    !saidaAlmoco ||
    !retornoAlmoco ||
    !saida
  ) {
    return null;
  }

  const periodoManha =
    saidaAlmoco.getTime() -
    entrada.getTime();

  const periodoTarde =
    saida.getTime() -
    retornoAlmoco.getTime();

  if (
    periodoManha < 0 ||
    periodoTarde < 0
  ) {
    return null;
  }

  const totalHoras =
    (periodoManha + periodoTarde) /
    (60 * 60 * 1000);

  return totalHoras.toFixed(2);
}

async function localizarPontoMaisProximo(
  instituicaoId: number,
  latitude: number,
  longitude: number
) {
  const locais =
    await prisma.$queryRaw<LocalProximoBanco[]>`
      SELECT
        "id",
        "nome",
        "raioMetros",
        (
          6371000 * 2 * ASIN(
            LEAST(
              1,
              SQRT(
                POWER(
                  SIN(
                    RADIANS(
                      "latitude" - ${latitude}
                    ) / 2
                  ),
                  2
                )
                +
                COS(RADIANS(${latitude}))
                *
                COS(RADIANS("latitude"))
                *
                POWER(
                  SIN(
                    RADIANS(
                      "longitude" - ${longitude}
                    ) / 2
                  ),
                  2
                )
              )
            )
          )
        )::double precision AS "distanciaMetros"

      FROM "LocalPontoMobileRH"

      WHERE
        "instituicaoId" = ${instituicaoId}
        AND "ativo" = true

      ORDER BY "distanciaMetros" ASC

      LIMIT 1
    `;

  const local = locais[0];

  if (!local) {
    return null;
  }

  return {
    id: Number(local.id),
    nome: String(local.nome),
    raioMetros: Number(local.raioMetros),
    distanciaMetros: Number(
      local.distanciaMetros
    ),
  };
}

async function validarLocalizacao(args: {
  body: any;
  instituicaoId: number;
  exigirLocalizacao: boolean;
  permitirForaDoRaio: boolean;
  raioPadraoMetros: number;
}): Promise<ResultadoLocalizacao> {
  const {
    body,
    instituicaoId,
    exigirLocalizacao,
    permitirForaDoRaio,
    raioPadraoMetros,
  } = args;

  const possuiLatitude =
    !valorAusente(body?.latitude);

  const possuiLongitude =
    !valorAusente(body?.longitude);

  const possuiAlgumaCoordenada =
    possuiLatitude || possuiLongitude;

  if (!possuiAlgumaCoordenada) {
    if (exigirLocalizacao) {
      throw new ErroHttp(
        400,
        "Ative a localização do celular para registrar o ponto.",
        "LOCALIZACAO_OBRIGATORIA"
      );
    }

    return {
      latitude: null,
      longitude: null,
      precisaoMetros: null,
      distanciaMetros: null,
      localId: null,
      localNome: null,
      statusLocalizacao:
        "NAO_EXIGIDA",
    };
  }

  if (
    !possuiLatitude ||
    !possuiLongitude
  ) {
    throw new ErroHttp(
      400,
      "A localização recebida está incompleta.",
      "LOCALIZACAO_INCOMPLETA"
    );
  }

  const latitude = lerNumero(
    body.latitude,
    "Latitude",
    -90,
    90
  );

  const longitude = lerNumero(
    body.longitude,
    "Longitude",
    -180,
    180
  );

  let precisaoMetros: number | null =
    null;

  if (!valorAusente(body?.precisaoMetros)) {
    precisaoMetros = lerNumero(
      body.precisaoMetros,
      "Precisão da localização",
      0,
      100000
    );
  }

  if (
    exigirLocalizacao &&
    precisaoMetros === null
  ) {
    throw new ErroHttp(
      400,
      "Não foi possível verificar a precisão da localização. Tente novamente.",
      "PRECISAO_NAO_INFORMADA"
    );
  }

  if (
    precisaoMetros !== null &&
    precisaoMetros >
      PRECISAO_MAXIMA_METROS
  ) {
    throw new ErroHttp(
      400,
      "A localização do celular está muito imprecisa. Vá para um local com melhor sinal e tente novamente.",
      "LOCALIZACAO_IMPRECISA",
      {
        precisaoMetros,
        precisaoMaximaMetros:
          PRECISAO_MAXIMA_METROS,
      }
    );
  }

  const local =
    await localizarPontoMaisProximo(
      instituicaoId,
      latitude,
      longitude
    );

  if (!local) {
    if (exigirLocalizacao) {
      throw new ErroHttp(
        409,
        "O RH ainda não cadastrou um local autorizado para registro de ponto.",
        "SEM_LOCAL_AUTORIZADO"
      );
    }

    return {
      latitude,
      longitude,
      precisaoMetros,
      distanciaMetros: null,
      localId: null,
      localNome: null,
      statusLocalizacao:
        "SEM_LOCAL_ATIVO",
    };
  }

  const distanciaMetros =
    Math.round(
      local.distanciaMetros * 100
    ) / 100;

  const raioMetros =
    local.raioMetros > 0
      ? local.raioMetros
      : Math.max(
          1,
          Number(raioPadraoMetros || 150)
        );

  const dentroDoRaio =
    distanciaMetros <= raioMetros;

  if (
    !dentroDoRaio &&
    !permitirForaDoRaio
  ) {
    throw new ErroHttp(
      403,
      `Você está fora do raio permitido para registrar o ponto. Distância aproximada: ${Math.round(
        distanciaMetros
      )} metros.`,
      "FORA_DO_RAIO",
      {
        distanciaMetros,
        raioMetros,
        localNome: local.nome,
      }
    );
  }

  return {
    latitude,
    longitude,
    precisaoMetros,
    distanciaMetros,
    localId: local.id,
    localNome: local.nome,

    statusLocalizacao: dentroDoRaio
      ? "DENTRO_DO_RAIO"
      : "FORA_DO_RAIO_PERMITIDA",
  };
}

async function validarFotoPrivada(args: {
  pathnameRecebido: unknown;
  exigirFoto: boolean;
  instituicaoId: number;
  funcionarioId: number;
  agora: Date;
}): Promise<ResultadoFoto> {
  const {
    pathnameRecebido,
    exigirFoto,
    instituicaoId,
    funcionarioId,
    agora,
  } = args;

  const fotoPathname = sanitizarTexto(
    pathnameRecebido,
    700
  );

  if (!fotoPathname) {
    if (exigirFoto) {
      throw new ErroHttp(
        400,
        "Tire uma foto ao vivo antes de registrar o ponto.",
        "FOTO_OBRIGATORIA"
      );
    }

    return {
      fotoUrl: null,
      fotoPathname: null,
      fotoHash: null,
    };
  }

  if (
    fotoPathname.includes("..") ||
    fotoPathname.startsWith("/")
  ) {
    throw new ErroHttp(
      400,
      "O caminho da foto é inválido.",
      "FOTO_INVALIDA"
    );
  }

  const prefixoPermitido = [
    "rh-ponto",
    `instituicao-${instituicaoId}`,
    `funcionario-${funcionarioId}`,
  ].join("/") + "/";

  if (
    !fotoPathname.startsWith(
      prefixoPermitido
    )
  ) {
    throw new ErroHttp(
      403,
      "A foto enviada não pertence a este funcionário.",
      "FOTO_NAO_PERTENCE_AO_FUNCIONARIO"
    );
  }

  const tokenBlob = String(
    process.env
      .RH_PONTO_READ_WRITE_TOKEN || ""
  ).trim();

  if (!tokenBlob) {
    console.error(
      "RH_PONTO_READ_WRITE_TOKEN não configurado."
    );

    throw new ErroHttp(
      503,
      "O armazenamento privado do Ponto Mobile não está configurado.",
      "BLOB_NAO_CONFIGURADO"
    );
  }

  try {
    const metadados = await head(
      fotoPathname,
      {
        token: tokenBlob,
      }
    );

    const contentType = String(
      metadados.contentType || ""
    ).toLowerCase();

    if (
      !CONTENT_TYPES_PERMITIDOS.has(
        contentType
      )
    ) {
      throw new ErroHttp(
        400,
        "O formato da foto enviada não é permitido.",
        "FORMATO_FOTO_INVALIDO"
      );
    }

    if (
      Number(metadados.size) <= 0 ||
      Number(metadados.size) >
        TAMANHO_MAXIMO_FOTO
    ) {
      throw new ErroHttp(
        400,
        "A foto enviada ultrapassa o limite de 2 MB.",
        "FOTO_MUITO_GRANDE"
      );
    }

    const enviadaEm = new Date(
      metadados.uploadedAt
    );

    if (
      Number.isNaN(enviadaEm.getTime())
    ) {
      throw new ErroHttp(
        400,
        "Não foi possível verificar quando a foto foi enviada.",
        "DATA_FOTO_INVALIDA"
      );
    }

    const idadeFoto =
      agora.getTime() -
      enviadaEm.getTime();

    if (
      idadeFoto < -60 * 1000 ||
      idadeFoto >
        TEMPO_MAXIMO_FOTO_MS
    ) {
      throw new ErroHttp(
        400,
        "A foto expirou. Tire uma nova foto para registrar o ponto.",
        "FOTO_EXPIRADA"
      );
    }

    if (
      metadados.pathname !==
      fotoPathname
    ) {
      throw new ErroHttp(
        400,
        "A foto enviada não corresponde ao arquivo autorizado.",
        "FOTO_DIVERGENTE"
      );
    }

    return {
      fotoUrl: metadados.url,
      fotoPathname:
        metadados.pathname,
      fotoHash:
        metadados.etag || null,
    };
  } catch (error) {
    if (error instanceof ErroHttp) {
      throw error;
    }

    console.error(
      "Erro ao verificar foto privada:",
      error
    );

    throw new ErroHttp(
      400,
      "A foto não foi encontrada no armazenamento privado. Tire uma nova foto.",
      "FOTO_NAO_ENCONTRADA"
    );
  }
}

async function obterRespostaIdempotente(args: {
  instituicaoId: number;
  funcionarioId: number;
  idempotenciaChave: string;
}) {
  const {
    instituicaoId,
    funcionarioId,
    idempotenciaChave,
  } = args;

  const marcacao =
    await prisma.marcacaoPontoMobileRH.findFirst({
      where: {
        instituicaoId,
        funcionarioId,
        idempotenciaChave,
      },

      select: {
        tipo: true,
        dataHora: true,
        dataLocal: true,
        comprovanteCodigo: true,
        statusLocalizacao: true,
        distanciaMetros: true,

        local: {
          select: {
            nome: true,
          },
        },
      },
    });

  if (!marcacao) {
    return null;
  }

  const marcacoesDoDia =
    await prisma.marcacaoPontoMobileRH.findMany({
      where: {
        instituicaoId,
        funcionarioId,
        dataLocal: marcacao.dataLocal,
      },

      orderBy: {
        dataHora: "asc",
      },

      select: {
        tipo: true,
      },
    });

  const proximoTipo = obterProximoTipo(
    marcacoesDoDia.map(
      (item) => item.tipo
    )
  );

  return {
    sucesso: true,
    repetida: true,

    mensagem:
      "Esta solicitação já havia sido processada.",

    marcacao: {
      tipo: marcacao.tipo,
      tipoRotulo: obterRotuloTipo(
        marcacao.tipo
      ),

      dataHora:
        marcacao.dataHora.toISOString(),

      dataLocal:
        marcacao.dataLocal
          .toISOString()
          .slice(0, 10),

      comprovanteCodigo:
        marcacao.comprovanteCodigo,

      statusLocalizacao:
        marcacao.statusLocalizacao,

      distanciaMetros:
        marcacao.distanciaMetros,

      localNome:
        marcacao.local?.nome || null,
    },

    jornada: {
      proximoTipo,

      proximoTipoRotulo:
        proximoTipo
          ? obterRotuloTipo(proximoTipo)
          : "Jornada concluída",

      concluida: proximoTipo === null,
    },
  };
}

async function registrarMarcacaoComRetry(args: {
  instituicaoId: number;
  funcionarioId: number;
  idempotenciaChave: string;
  agora: Date;
  dataLocalHoje: Date;
  foto: ResultadoFoto;
  localizacao: ResultadoLocalizacao;
  dispositivoId: string | null;
  ip: string | null;
  userAgent: string | null;
}) {
  let ultimoErro: unknown = null;

  for (
    let tentativa = 1;
    tentativa <=
    MAX_TENTATIVAS_TRANSACAO;
    tentativa++
  ) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const existente =
            await tx.marcacaoPontoMobileRH.findFirst({
              where: {
                instituicaoId:
                  args.instituicaoId,

                funcionarioId:
                  args.funcionarioId,

                idempotenciaChave:
                  args.idempotenciaChave,
              },

              select: {
                tipo: true,
                dataHora: true,
                dataLocal: true,
                comprovanteCodigo: true,
                statusLocalizacao: true,
                distanciaMetros: true,

                local: {
                  select: {
                    nome: true,
                  },
                },
              },
            });

          if (existente) {
            const marcacoesDoDia =
              await tx.marcacaoPontoMobileRH.findMany({
                where: {
                  instituicaoId:
                    args.instituicaoId,

                  funcionarioId:
                    args.funcionarioId,

                  dataLocal:
                    existente.dataLocal,
                },

                orderBy: {
                  dataHora: "asc",
                },

                select: {
                  tipo: true,
                },
              });

            const proximoTipo =
              obterProximoTipo(
                marcacoesDoDia.map(
                  (item) => item.tipo
                )
              );

            return {
              sucesso: true,
              repetida: true,

              mensagem:
                "Esta solicitação já havia sido processada.",

              marcacao: {
                tipo: existente.tipo,

                tipoRotulo:
                  obterRotuloTipo(
                    existente.tipo
                  ),

                dataHora:
                  existente.dataHora.toISOString(),

                dataLocal:
                  existente.dataLocal
                    .toISOString()
                    .slice(0, 10),

                comprovanteCodigo:
                  existente.comprovanteCodigo,

                statusLocalizacao:
                  existente.statusLocalizacao,

                distanciaMetros:
                  existente.distanciaMetros,

                localNome:
                  existente.local?.nome ||
                  null,
              },

              jornada: {
                proximoTipo,

                proximoTipoRotulo:
                  proximoTipo
                    ? obterRotuloTipo(
                        proximoTipo
                      )
                    : "Jornada concluída",

                concluida:
                  proximoTipo === null,
              },
            };
          }

          const pontoAberto =
            await tx.pontoFuncionarioRH.findFirst({
              where: {
                instituicaoId:
                  args.instituicaoId,

                funcionarioId:
                  args.funcionarioId,

                status: "ABERTO",
              },

              orderBy: {
                data: "desc",
              },

              select: {
                id: true,
                data: true,
              },
            });

          let dataJornada =
            args.dataLocalHoje;

          if (pontoAberto) {
            const idadeJornada =
              args.agora.getTime() -
              pontoAberto.data.getTime();

            if (
              idadeJornada >
              DURACAO_MAXIMA_JORNADA_MS
            ) {
              throw new ErroHttp(
                409,
                "Existe uma jornada anterior aberta há mais de 48 horas. O RH precisa regularizar essa jornada antes de um novo registro.",
                "JORNADA_ANTERIOR_ABERTA"
              );
            }

            dataJornada =
              pontoAberto.data;
          }

          const marcacoesDoDia =
            await tx.marcacaoPontoMobileRH.findMany({
              where: {
                instituicaoId:
                  args.instituicaoId,

                funcionarioId:
                  args.funcionarioId,

                dataLocal: dataJornada,
              },

              orderBy: {
                dataHora: "asc",
              },

              select: {
                tipo: true,
                dataHora: true,
              },
            });

          const proximoTipo =
            obterProximoTipo(
              marcacoesDoDia.map(
                (marcacao) =>
                  marcacao.tipo
              )
            );

          if (!proximoTipo) {
            throw new ErroHttp(
              409,
              "A jornada já possui todas as marcações previstas.",
              "JORNADA_CONCLUIDA"
            );
          }

          const ultimaMarcacao =
            marcacoesDoDia[
              marcacoesDoDia.length - 1
            ];

          if (ultimaMarcacao) {
            const intervalo =
              args.agora.getTime() -
              ultimaMarcacao.dataHora.getTime();

            if (
              intervalo <
              INTERVALO_MINIMO_MARCACOES_MS
            ) {
              const segundosRestantes =
                Math.max(
                  1,
                  Math.ceil(
                    (
                      INTERVALO_MINIMO_MARCACOES_MS -
                      intervalo
                    ) / 1000
                  )
                );

              throw new ErroHttp(
                429,
                `Aguarde ${segundosRestantes} segundo(s) antes de realizar uma nova marcação.`,
                "INTERVALO_MINIMO",
                {
                  segundosRestantes,
                }
              );
            }
          }

          let pontoFuncionario =
            pontoAberto;

          if (!pontoFuncionario) {
            pontoFuncionario =
              await tx.pontoFuncionarioRH.upsert({
                where: {
                  instituicaoId_funcionarioId_data:
                    {
                      instituicaoId:
                        args.instituicaoId,

                      funcionarioId:
                        args.funcionarioId,

                      data: dataJornada,
                    },
                },

                update: {
                  status: "ABERTO",
                },

                create: {
                  instituicaoId:
                    args.instituicaoId,

                  funcionarioId:
                    args.funcionarioId,

                  data: dataJornada,

                  status: "ABERTO",
                },

                select: {
                  id: true,
                  data: true,
                },
              });
          }

          const dataLocalTexto =
            dataJornada
              .toISOString()
              .slice(0, 10);

          const comprovanteCodigo =
            gerarCodigoComprovante(
              dataLocalTexto
            );

          const marcacao =
            await tx.marcacaoPontoMobileRH.create({
              data: {
                instituicaoId:
                  args.instituicaoId,

                funcionarioId:
                  args.funcionarioId,

                pontoFuncionarioRHId:
                  pontoFuncionario.id,

                localId:
                  args.localizacao.localId,

                dataHora: args.agora,
                dataLocal: dataJornada,
                tipo: proximoTipo,

                fotoUrl:
                  args.foto.fotoUrl,

                fotoPathname:
                  args.foto.fotoPathname,

                fotoHash:
                  args.foto.fotoHash,

                latitude:
                  args.localizacao.latitude,

                longitude:
                  args.localizacao.longitude,

                precisaoMetros:
                  args.localizacao
                    .precisaoMetros,

                distanciaMetros:
                  args.localizacao
                    .distanciaMetros,

                statusLocalizacao:
                  args.localizacao
                    .statusLocalizacao,

                reconhecimentoStatus:
                  "DESATIVADO",

                similaridadeFacial: null,
                provaVidaConfirmada: null,

                origem: "PWA",

                dispositivoId:
                  args.dispositivoId,

                ip: args.ip,

                userAgent:
                  args.userAgent,

                comprovanteCodigo,

                idempotenciaChave:
                  args.idempotenciaChave,
              },

              select: {
                id: true,
                tipo: true,
                dataHora: true,
                dataLocal: true,
                comprovanteCodigo: true,
                statusLocalizacao: true,
                distanciaMetros: true,
              },
            });

          const atualizacaoPonto: any = {
            status: "ABERTO",
          };

          if (
            proximoTipo === "ENTRADA"
          ) {
            atualizacaoPonto.entrada =
              args.agora;
          }

          if (
            proximoTipo ===
            "SAIDA_ALMOCO"
          ) {
            atualizacaoPonto.saidaAlmoco =
              args.agora;
          }

          if (
            proximoTipo ===
            "RETORNO_ALMOCO"
          ) {
            atualizacaoPonto.retornoAlmoco =
              args.agora;
          }

          if (
            proximoTipo === "SAIDA"
          ) {
            atualizacaoPonto.saida =
              args.agora;

            atualizacaoPonto.status =
              "FECHADO";

            const horasTrabalhadas =
              calcularHorasTrabalhadas(
                marcacoesDoDia,
                proximoTipo,
                args.agora
              );

            if (horasTrabalhadas) {
              atualizacaoPonto.horasTrabalhadas =
                horasTrabalhadas;
            }
          }

          await tx.pontoFuncionarioRH.update({
            where: {
              id: pontoFuncionario.id,
            },

            data: atualizacaoPonto,
          });

          const tiposAposRegistro = [
            ...marcacoesDoDia.map(
              (item) => item.tipo
            ),
            proximoTipo,
          ];

          const proximoTipoDepois =
            obterProximoTipo(
              tiposAposRegistro
            );

          return {
            sucesso: true,
            repetida: false,

            mensagem:
              obterMensagemSucesso(
                proximoTipo
              ),

            marcacao: {
              id: marcacao.id,

              tipo: marcacao.tipo,

              tipoRotulo:
                obterRotuloTipo(
                  marcacao.tipo
                ),

              dataHora:
                marcacao.dataHora.toISOString(),

              dataLocal:
                marcacao.dataLocal
                  .toISOString()
                  .slice(0, 10),

              comprovanteCodigo:
                marcacao.comprovanteCodigo,

              statusLocalizacao:
                marcacao.statusLocalizacao,

              distanciaMetros:
                marcacao.distanciaMetros,

              localNome:
                args.localizacao
                  .localNome,
            },

            jornada: {
              proximoTipo:
                proximoTipoDepois,

              proximoTipoRotulo:
                proximoTipoDepois
                  ? obterRotuloTipo(
                      proximoTipoDepois
                    )
                  : "Jornada concluída",

              concluida:
                proximoTipoDepois ===
                null,
            },
          };
        },
        {
          isolationLevel:
            Prisma
              .TransactionIsolationLevel
              .Serializable,

          maxWait: 5000,
          timeout: 10000,
        }
      );
    } catch (error) {
      ultimoErro = error;

      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      ) {
        continue;
      }

      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        alvoErroPrisma(error).includes(
          "comprovanteCodigo"
        )
      ) {
        continue;
      }

      throw error;
    }
  }

  throw ultimoErro;
}

export async function POST(
  req: NextRequest,
  contexto: ContextoRota
) {
  try {
    const slug = normalizarSlug(
      contexto.params.slug
    );

    if (!slug) {
      throw new ErroHttp(
        400,
        "Instituição não identificada."
      );
    }

    const user = await getUserFromToken();

    if (!user) {
      throw new ErroHttp(
        401,
        "Sua sessão expirou. Entre novamente no RH Ponto.",
        "SESSAO_EXPIRADA"
      );
    }

    const usuarioId = Number(user.id);

    const instituicaoId = Number(
      user.instituicaoId
    );

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0 ||
      !Number.isInteger(
        instituicaoId
      ) ||
      instituicaoId <= 0
    ) {
      throw new ErroHttp(
        401,
        "Usuário ou instituição não identificado."
      );
    }

    const body = await req
      .json()
      .catch(() => ({}));

    const idempotenciaChave =
      String(
        body?.idempotenciaChave || ""
      ).trim();

    if (
      !/^[a-zA-Z0-9._:-]{16,120}$/.test(
        idempotenciaChave
      )
    ) {
      throw new ErroHttp(
        400,
        "A identificação segura da solicitação é inválida.",
        "IDEMPOTENCIA_INVALIDA"
      );
    }

    const agora = new Date();

    const [
      instituicao,
      configuracao,
      funcionario,
    ] = await Promise.all([
      prisma.instituicao.findFirst({
        where: {
          id: instituicaoId,
          slug,
        },

        select: {
          id: true,
          slug: true,
        },
      }),

      prisma.configuracaoPontoMobileRH.findUnique({
        where: {
          instituicaoId,
        },

        select: {
          ativo: true,
          exigirFoto: true,
          exigirLocalizacao: true,
          reconhecimentoFacialAtivo: true,
          exigirProvaVida: true,
          permitirForaDoRaio: true,
          exigirFuncionarioLiberado: true,
          raioPadraoMetros: true,
          fusoHorario: true,
        },
      }),

      prisma.funcionario.findFirst({
        where: {
          userId: usuarioId,
          instituicaoId,
        },

        select: {
          id: true,
          ativo: true,
          statusFuncionario: true,

          pontoMobileLiberado: true,
          pontoMobileValidoAte: true,

          user: {
            select: {
              ativo: true,
            },
          },
        },
      }),
    ]);

    if (!instituicao) {
      throw new ErroHttp(
        403,
        "Esta instituição não corresponde ao seu acesso.",
        "INSTITUICAO_DIVERGENTE"
      );
    }

    if (!configuracao?.ativo) {
      throw new ErroHttp(
        403,
        "O Ponto Mobile está desativado nesta instituição.",
        "PONTO_MOBILE_DESATIVADO"
      );
    }

    if (!funcionario) {
      throw new ErroHttp(
        403,
        "Não encontramos um cadastro de funcionário vinculado a este usuário.",
        "FUNCIONARIO_NAO_ENCONTRADO"
      );
    }

    if (
      funcionario.ativo !== true ||
      funcionario.user.ativo !== true ||
      String(
        funcionario.statusFuncionario ||
          ""
      ).toUpperCase() !== "ATIVO"
    ) {
      throw new ErroHttp(
        403,
        "Seu cadastro de funcionário está inativo.",
        "FUNCIONARIO_INATIVO"
      );
    }

    if (
      configuracao
        .exigirFuncionarioLiberado &&
      funcionario
        .pontoMobileLiberado !== true
    ) {
      throw new ErroHttp(
        403,
        "Seu acesso ao Ponto Mobile não foi liberado pelo RH.",
        "FUNCIONARIO_NAO_LIBERADO"
      );
    }

    if (
      funcionario.pontoMobileValidoAte &&
      funcionario.pontoMobileValidoAte.getTime() <=
        agora.getTime()
    ) {
      throw new ErroHttp(
        403,
        "Sua autorização para utilizar o Ponto Mobile está expirada.",
        "AUTORIZACAO_EXPIRADA"
      );
    }

    const respostaExistente =
      await obterRespostaIdempotente({
        instituicaoId,
        funcionarioId:
          funcionario.id,
        idempotenciaChave,
      });

    if (respostaExistente) {
      return NextResponse.json(
        respostaExistente,
        {
          status: 200,
          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    /*
     * Enquanto o reconhecimento facial e a prova
     * de vida ainda não estiverem implementados,
     * não permitimos que uma configuração obrigatória
     * seja ignorada silenciosamente.
     */
    if (
      configuracao
        .reconhecimentoFacialAtivo
    ) {
      throw new ErroHttp(
        501,
        "O reconhecimento facial está ativado, mas o processamento facial ainda não foi configurado.",
        "RECONHECIMENTO_NAO_CONFIGURADO"
      );
    }

    if (configuracao.exigirProvaVida) {
      throw new ErroHttp(
        501,
        "A prova de vida está ativada, mas o processamento ainda não foi configurado.",
        "PROVA_VIDA_NAO_CONFIGURADA"
      );
    }

    const localizacao =
      await validarLocalizacao({
        body,
        instituicaoId,

        exigirLocalizacao:
          configuracao
            .exigirLocalizacao,

        permitirForaDoRaio:
          configuracao
            .permitirForaDoRaio,

        raioPadraoMetros:
          configuracao
            .raioPadraoMetros,
      });

    const foto =
      await validarFotoPrivada({
        pathnameRecebido:
          body?.fotoPathname,

        exigirFoto:
          configuracao.exigirFoto,

        instituicaoId,

        funcionarioId:
          funcionario.id,

        agora,
      });

    const fusoHorario =
      configuracao.fusoHorario ||
      "America/Sao_Paulo";

    const dataLocalHojeTexto =
      obterDataLocalTexto(
        agora,
        fusoHorario
      );

    const dataLocalHoje =
      criarDataLocalCanonica(
        dataLocalHojeTexto
      );

    const resultado =
      await registrarMarcacaoComRetry({
        instituicaoId,

        funcionarioId:
          funcionario.id,

        idempotenciaChave,
        agora,
        dataLocalHoje,
        foto,
        localizacao,

        dispositivoId:
          sanitizarTexto(
            body?.dispositivoId,
            200
          ),

        ip: obterIp(req),

        userAgent:
          sanitizarTexto(
            req.headers.get(
              "user-agent"
            ),
            2000
          ),
      });

    return NextResponse.json(resultado, {
      status: 201,

      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ErroHttp) {
      return NextResponse.json(
        {
          error: error.message,

          codigo:
            error.codigo || null,

          detalhes:
            error.detalhes || null,
        },
        {
          status: error.status,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      console.warn(
        "Registro duplicado bloqueado:",
        error.meta
      );

      return NextResponse.json(
        {
          error:
            "Esta marcação já foi registrada. Atualize a tela para consultar o comprovante.",

          codigo:
            "MARCACAO_DUPLICADA",
        },
        {
          status: 409,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        {
          error:
            "Muitas solicitações chegaram ao mesmo tempo. Tente novamente em alguns segundos.",

          codigo:
            "CONCORRENCIA_TEMPORARIA",
        },
        {
          status: 503,

          headers: {
            "Cache-Control":
              "no-store",
          },
        }
      );
    }

    console.error(
      "Erro ao registrar Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível registrar o ponto.",

        codigo:
          "ERRO_INTERNO",
      },
      {
        status: 500,

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}