import {
  MapeamentoCampoFormularioCaptacaoLead,
  Prisma,
  StatusFormularioCaptacaoLead,
  StatusSubmissaoCaptacaoLead,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createHmac } from "crypto";

import { prisma } from "@/lib/prisma";

import {
  ErroProcessamentoCaptacao,
  processarSubmissaoCaptacao,
} from "@/lib/comercial/captacao/processar-submissao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TAMANHO_MAXIMO_BODY_BYTES =
  64 * 1024;

const HONEYPOT_CAMPO =
  "_phanyx_hp";

class ErroHttp extends Error {
  status: number;
  codigo: string;

  constructor(
    status: number,
    mensagem: string,
    codigo: string
  ) {
    super(mensagem);

    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
  }
}

type RespostaRecaptcha = {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  challenge_ts?: string;
  "error-codes"?: string[];
};

function headersPublicos() {
  return {
    "Cache-Control":
      "no-store, no-cache, must-revalidate",

    "Access-Control-Allow-Origin":
      "*",
  };
}

function responderJson(
  body: Record<string, unknown>,
  status: number
) {
  return NextResponse.json(
    body,
    {
      status,
      headers:
        headersPublicos(),
    }
  );
}

function ehRegistro(
  valor: unknown
): valor is Record<string, unknown> {
  return (
    Boolean(valor) &&
    typeof valor === "object" &&
    !Array.isArray(valor)
  );
}

function textoOuNull(
  valor: unknown,
  limite = 2000
) {
  const texto =
    String(
      valor ?? ""
    ).trim();

  if (!texto) {
    return null;
  }

  return texto.slice(
    0,
    limite
  );
}

function booleano(
  valor: unknown
) {
  if (
    typeof valor === "boolean"
  ) {
    return valor;
  }

  if (
    typeof valor === "number"
  ) {
    return valor === 1;
  }

  const normalizado =
    String(
      valor ?? ""
    )
      .trim()
      .toLowerCase();

  return [
    "1",
    "true",
    "sim",
    "yes",
    "on",
    "aceito",
    "aceita",
  ].includes(
    normalizado
  );
}

function paraJsonPrisma(
  valor: unknown
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(
      valor
    )
  ) as Prisma.InputJsonValue;
}

function obterIp(
  req: NextRequest
) {
  const forwarded =
    req.headers.get(
      "x-forwarded-for"
    );

  if (forwarded) {
    const primeiro =
      forwarded
        .split(",")[0]
        ?.trim();

    if (primeiro) {
      return primeiro.slice(
        0,
        200
      );
    }
  }

  const realIp =
    req.headers.get(
      "x-real-ip"
    );

  if (realIp) {
    return realIp
      .trim()
      .slice(
        0,
        200
      );
  }

  const cloudflare =
    req.headers.get(
      "cf-connecting-ip"
    );

  if (cloudflare) {
    return cloudflare
      .trim()
      .slice(
        0,
        200
      );
  }

  return null;
}

function hashIp(
  ip: string | null
) {
  if (!ip) {
    return null;
  }

  /*
   * Não armazenamos o IP puro.
   *
   * Usamos uma chave privada para
   * impedir que o hash seja apenas
   * um SHA-256 facilmente reversível
   * por tentativa.
   */
  const segredo =
    process.env
      .CAPTACAO_IP_HASH_SECRET ||
    process.env.JWT_SECRET;

  if (!segredo) {
    return null;
  }

  return createHmac(
    "sha256",
    segredo
  )
    .update(ip)
    .digest("hex");
}

function valorMetadata(
  metadata:
    Record<string, unknown>,
  nomes: string[],
  limite = 500
) {
  for (
    const nome of nomes
  ) {
    const valor =
      textoOuNull(
        metadata[nome],
        limite
      );

    if (valor) {
      return valor;
    }
  }

  return null;
}

function valorQuery(
  req: NextRequest,
  nomes: string[],
  limite = 500
) {
  for (
    const nome of nomes
  ) {
    const valor =
      textoOuNull(
        req.nextUrl.searchParams.get(
          nome
        ),
        limite
      );

    if (valor) {
      return valor;
    }
  }

  return null;
}

function obterValorCampo(
  dados:
    Record<string, unknown>,
  campo:
    | {
        chave: string;
      }
    | null
    | undefined
) {
  if (!campo) {
    return undefined;
  }

  return dados[
    campo.chave
  ];
}

async function verificarRecaptcha(
  token: string | null,
  ip: string | null
) {
  const segredo =
    process.env
      .RECAPTCHA_SECRET_KEY;

  if (!segredo) {
    throw new ErroHttp(
      503,
      "A proteção anti-spam deste formulário ainda não está configurada.",
      "RECAPTCHA_NAO_CONFIGURADO"
    );
  }

  if (!token) {
    return false;
  }

  const parametros =
    new URLSearchParams();

  parametros.set(
    "secret",
    segredo
  );

  parametros.set(
    "response",
    token
  );

  if (ip) {
    parametros.set(
      "remoteip",
      ip
    );
  }

  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () =>
        controller.abort(),
      5000
    );

  try {
    const resposta =
      await fetch(
        "https://www.google.com/recaptcha/api/siteverify",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            parametros.toString(),

          signal:
            controller.signal,

          cache:
            "no-store",
        }
      );

    if (!resposta.ok) {
      throw new ErroHttp(
        503,
        "Não foi possível validar a proteção anti-spam.",
        "RECAPTCHA_INDISPONIVEL"
      );
    }

    const resultado =
      (await resposta.json()) as
        RespostaRecaptcha;

    if (
      resultado.success !==
      true
    ) {
      return false;
    }

    /*
     * Se for reCAPTCHA v3,
     * aceitamos score >= 0,5.
     *
     * No v2 o campo score
     * normalmente não existe.
     */
    if (
      typeof resultado.score ===
        "number" &&
      resultado.score < 0.5
    ) {
      return false;
    }

    return true;
  } finally {
    clearTimeout(
      timeout
    );
  }
}

function responderErro(
  error: unknown
) {
  if (
    error instanceof ErroHttp
  ) {
    return responderJson(
      {
        success: false,
        error:
          error.message,
        codigo:
          error.codigo,
      },
      error.status
    );
  }

  if (
    error instanceof
    ErroProcessamentoCaptacao
  ) {
    const status =
      error.statusFinal ===
      StatusSubmissaoCaptacaoLead.REJEITADA
        ? 422
        : 503;

    return responderJson(
      {
        success: false,

        error:
          error.statusFinal ===
          StatusSubmissaoCaptacaoLead.REJEITADA
            ? error.message
            : "Não foi possível concluir o envio neste momento.",

        codigo:
          error.codigo,
      },
      status
    );
  }

  console.error(
    "Erro na submissão pública da Central de Captação:",
    error
  );

  return responderJson(
    {
      success: false,

      error:
        "Não foi possível concluir o envio neste momento.",

      codigo:
        "ERRO_INTERNO",
    },
    500
  );
}

export async function OPTIONS() {
  return new NextResponse(
    null,
    {
      status: 204,

      headers: {
        "Access-Control-Allow-Origin":
          "*",

        "Access-Control-Allow-Methods":
          "POST, OPTIONS",

        "Access-Control-Allow-Headers":
          "Content-Type",

        "Access-Control-Max-Age":
          "86400",
      },
    }
  );
}

export async function POST(
  req: NextRequest,
  ctx: {
    params: {
      token: string;
    };
  }
) {
  try {
    const token =
      textoOuNull(
        ctx.params.token,
        250
      );

    if (!token) {
      throw new ErroHttp(
        400,
        "Formulário inválido.",
        "FORMULARIO_INVALIDO"
      );
    }

    /*
     * Impede payloads exagerados
     * antes mesmo de fazer JSON.parse.
     */
    const contentLength =
      Number(
        req.headers.get(
          "content-length"
        ) || 0
      );

    if (
      Number.isFinite(
        contentLength
      ) &&
      contentLength >
        TAMANHO_MAXIMO_BODY_BYTES
    ) {
      throw new ErroHttp(
        413,
        "Os dados enviados excedem o limite permitido.",
        "PAYLOAD_MUITO_GRANDE"
      );
    }

    const textoBody =
      await req.text();

    if (
      Buffer.byteLength(
        textoBody,
        "utf8"
      ) >
      TAMANHO_MAXIMO_BODY_BYTES
    ) {
      throw new ErroHttp(
        413,
        "Os dados enviados excedem o limite permitido.",
        "PAYLOAD_MUITO_GRANDE"
      );
    }

    let body:
      Record<string, unknown>;

    try {
      const recebido =
        JSON.parse(
          textoBody
        ) as unknown;

      if (
        !ehRegistro(
          recebido
        )
      ) {
        throw new Error();
      }

      body =
        recebido;
    } catch {
      throw new ErroHttp(
        400,
        "JSON inválido.",
        "JSON_INVALIDO"
      );
    }

    if (
      !ehRegistro(
        body.dados
      )
    ) {
      throw new ErroHttp(
        400,
        'Envie os campos do formulário dentro de "dados".',
        "DADOS_INVALIDOS"
      );
    }

    const dados =
      body.dados;

    const metadata =
      ehRegistro(
        body.metadados
      )
        ? body.metadados
        : {};

    /*
     * O formulário precisa continuar
     * publicado no instante em que
     * a pessoa envia os dados.
     */
    const formulario =
      await prisma.formularioCaptacaoLead.findFirst({
        where: {
          tokenPublico:
            token,

          status:
            StatusFormularioCaptacaoLead.PUBLICADO,

          publico: true,
          ativo: true,

          arquivadoEm:
            null,
        },

        select: {
          id: true,
          instituicaoId:
            true,

          canalId: true,
          campanhaId:
            true,

          titulo: true,

          mensagemSucesso:
            true,

          urlRedirecionamento:
            true,

          exigeConsentimento:
            true,

          textoConsentimento:
            true,

          versaoConsentimento:
            true,

          recaptchaAtivo:
            true,

          honeypotAtivo:
            true,

          limiteSubmissoesPorIpHora:
            true,

          campos: {
            where: {
              ativo: true,
            },

            select: {
              chave: true,
              mapeamento:
                true,
            },

            orderBy: {
              ordem:
                "asc",
            },
          },
        },
      });

    if (!formulario) {
      throw new ErroHttp(
        404,
        "Formulário de captação não encontrado ou indisponível.",
        "FORMULARIO_INDISPONIVEL"
      );
    }

    const ip =
      obterIp(req);

    const ipHash =
      hashIp(ip);

    /*
     * Rate limit persistente.
     *
     * Não depende da memória da
     * instância Vercel e continua
     * funcionando entre execuções.
     */
    if (ipHash) {
      const umaHoraAtras =
        new Date(
          Date.now() -
            60 * 60 * 1000
        );

      const quantidade =
        await prisma.submissaoCaptacaoLead.count({
          where: {
            instituicaoId:
              formulario.instituicaoId,

            formularioId:
              formulario.id,

            ipHash,

            recebidoEm: {
              gte:
                umaHoraAtras,
            },
          },
        });

      if (
        quantidade >=
        formulario
          .limiteSubmissoesPorIpHora
      ) {
        throw new ErroHttp(
          429,
          "Muitas tentativas foram realizadas. Aguarde antes de enviar novamente.",
          "LIMITE_SUBMISSOES_EXCEDIDO"
        );
      }
    }

    const campoNome =
      formulario.campos.find(
        (campo) =>
          campo.mapeamento ===
          MapeamentoCampoFormularioCaptacaoLead.NOME
      );

    const campoEmail =
      formulario.campos.find(
        (campo) =>
          campo.mapeamento ===
          MapeamentoCampoFormularioCaptacaoLead.EMAIL
      );

    const campoTelefone =
      formulario.campos.find(
        (campo) =>
          campo.mapeamento ===
          MapeamentoCampoFormularioCaptacaoLead.TELEFONE
      );

    const campoConsentimento =
      formulario.campos.find(
        (campo) =>
          campo.mapeamento ===
          MapeamentoCampoFormularioCaptacaoLead.CONSENTIMENTO
      );

    const nomeSnapshot =
      textoOuNull(
        obterValorCampo(
          dados,
          campoNome
        ) ??
          dados.nome ??
          dados.name,
        300
      );

    const emailSnapshot =
      textoOuNull(
        obterValorCampo(
          dados,
          campoEmail
        ) ??
          dados.email,
        320
      )?.toLowerCase() ??
      null;

    const telefoneSnapshot =
      textoOuNull(
        obterValorCampo(
          dados,
          campoTelefone
        ) ??
          dados.telefone ??
          dados.phone ??
          dados.whatsapp,
        100
      );

    const consentimentoLgpd =
      campoConsentimento
        ? booleano(
            obterValorCampo(
              dados,
              campoConsentimento
            )
          )
        : booleano(
            body.consentimentoLgpd
          );

    const utmSource =
      valorMetadata(
        metadata,
        [
          "utmSource",
          "utm_source",
        ]
      ) ??
      valorQuery(
        req,
        [
          "utmSource",
          "utm_source",
        ]
      );

    const utmMedium =
      valorMetadata(
        metadata,
        [
          "utmMedium",
          "utm_medium",
        ]
      ) ??
      valorQuery(
        req,
        [
          "utmMedium",
          "utm_medium",
        ]
      );

    const utmCampaign =
      valorMetadata(
        metadata,
        [
          "utmCampaign",
          "utm_campaign",
        ]
      ) ??
      valorQuery(
        req,
        [
          "utmCampaign",
          "utm_campaign",
        ]
      );

    const utmContent =
      valorMetadata(
        metadata,
        [
          "utmContent",
          "utm_content",
        ]
      ) ??
      valorQuery(
        req,
        [
          "utmContent",
          "utm_content",
        ]
      );

    const utmTerm =
      valorMetadata(
        metadata,
        [
          "utmTerm",
          "utm_term",
        ]
      ) ??
      valorQuery(
        req,
        [
          "utmTerm",
          "utm_term",
        ]
      );

    const gclid =
      valorMetadata(
        metadata,
        ["gclid"]
      ) ??
      valorQuery(
        req,
        ["gclid"]
      );

    const fbclid =
      valorMetadata(
        metadata,
        ["fbclid"]
      ) ??
      valorQuery(
        req,
        ["fbclid"]
      );

    const msclkid =
      valorMetadata(
        metadata,
        ["msclkid"]
      ) ??
      valorQuery(
        req,
        ["msclkid"]
      );

    const paginaOrigem =
      valorMetadata(
        metadata,
        [
          "paginaOrigem",
          "pageUrl",
          "url",
        ],
        4000
      ) ??
      textoOuNull(
        req.headers.get(
          "origin"
        ),
        4000
      );

    const referrer =
      valorMetadata(
        metadata,
        [
          "referrer",
          "referer",
        ],
        4000
      ) ??
      textoOuNull(
        req.headers.get(
          "referer"
        ),
        4000
      );

    const userAgent =
      textoOuNull(
        req.headers.get(
          "user-agent"
        ),
        4000
      );

    const idioma =
      valorMetadata(
        metadata,
        [
          "idioma",
          "language",
        ],
        100
      ) ??
      textoOuNull(
        req.headers.get(
          "accept-language"
        ),
        100
      );

    /*
     * Honeypot:
     *
     * bots costumam preencher todos
     * os inputs invisíveis.
     *
     * Para o bot devolvemos sucesso,
     * evitando revelar que ele caiu
     * na proteção.
     */
    const honeypotPreenchido =
      formulario.honeypotAtivo &&
      Boolean(
        textoOuNull(
          body[
            HONEYPOT_CAMPO
          ],
          500
        )
      );

    if (
      honeypotPreenchido
    ) {
      await prisma.submissaoCaptacaoLead.create({
        data: {
          instituicaoId:
            formulario.instituicaoId,

          canalId:
            formulario.canalId,

          campanhaId:
            formulario.campanhaId,

          formularioId:
            formulario.id,

          status:
            StatusSubmissaoCaptacaoLead.SPAM,

          nomeSnapshot,
          emailSnapshot,
          telefoneSnapshot,

          dadosOriginais:
            paraJsonPrisma(
              dados
            ),

          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm,

          gclid,
          fbclid,
          msclkid,

          paginaOrigem,
          referrer,

          ipHash,
          userAgent,
          idioma,

          consentimentoLgpd:
            false,

          codigoErro:
            "HONEYPOT",

          mensagemErro:
            "Submissão classificada automaticamente como spam pelo honeypot.",

          processadoEm:
            new Date(),
        },
      });

      return responderJson(
        {
          success: true,

          message:
            formulario.mensagemSucesso ??
            "Dados recebidos com sucesso.",

          redirectUrl:
            formulario.urlRedirecionamento,
        },
        200
      );
    }

    /*
     * reCAPTCHA.
     *
     * Só é consultado se estiver
     * habilitado na configuração
     * administrativa do formulário.
     */
    if (
      formulario.recaptchaAtivo
    ) {
      const recaptchaToken =
        textoOuNull(
          body.recaptchaToken,
          5000
        );

      const valido =
        await verificarRecaptcha(
          recaptchaToken,
          ip
        );

      if (!valido) {
        await prisma.submissaoCaptacaoLead.create({
          data: {
            instituicaoId:
              formulario.instituicaoId,

            canalId:
              formulario.canalId,

            campanhaId:
              formulario.campanhaId,

            formularioId:
              formulario.id,

            status:
              StatusSubmissaoCaptacaoLead.SPAM,

            nomeSnapshot,
            emailSnapshot,
            telefoneSnapshot,

            dadosOriginais:
              paraJsonPrisma(
                dados
              ),

            utmSource,
            utmMedium,
            utmCampaign,
            utmContent,
            utmTerm,

            gclid,
            fbclid,
            msclkid,

            paginaOrigem,
            referrer,

            ipHash,
            userAgent,
            idioma,

            consentimentoLgpd:
              false,

            codigoErro:
              "RECAPTCHA_INVALIDO",

            mensagemErro:
              "Submissão classificada automaticamente como spam pela validação reCAPTCHA.",

            processadoEm:
              new Date(),
          },
        });

        throw new ErroHttp(
          422,
          "Não foi possível validar a proteção anti-spam. Tente novamente.",
          "RECAPTCHA_INVALIDO"
        );
      }
    }

    /*
     * A submissão é registrada antes
     * do processamento.
     *
     * Assim uma falha posterior nunca
     * faz o envio desaparecer.
     */
    const submissao =
      await prisma.submissaoCaptacaoLead.create({
        data: {
          instituicaoId:
            formulario.instituicaoId,

          canalId:
            formulario.canalId,

          campanhaId:
            formulario.campanhaId,

          formularioId:
            formulario.id,

          status:
            StatusSubmissaoCaptacaoLead.RECEBIDA,

          nomeSnapshot,
          emailSnapshot,
          telefoneSnapshot,

          dadosOriginais:
            paraJsonPrisma(
              dados
            ),

          utmSource,
          utmMedium,
          utmCampaign,
          utmContent,
          utmTerm,

          gclid,
          fbclid,
          msclkid,

          paginaOrigem,
          referrer,

          ipHash,
          userAgent,
          idioma,

          consentimentoLgpd,

          consentimentoEm:
            consentimentoLgpd
              ? new Date()
              : null,

          versaoConsentimento:
            consentimentoLgpd
              ? formulario
                  .versaoConsentimento
              : null,

          textoConsentimentoSnapshot:
            consentimentoLgpd
              ? formulario
                  .textoConsentimento
              : null,
        },

        select: {
          id: true,
        },
      });

    /*
     * O motor central assume daqui:
     *
     * - validação
     * - normalização
     * - LGPD
     * - deduplicação
     * - criação/atualização do lead
     * - funil/etapa
     * - distribuição
     * - primeira tarefa
     */
    await processarSubmissaoCaptacao({
      submissaoId:
        submissao.id,

      instituicaoId:
        formulario.instituicaoId,
    });

    /*
     * Não revelamos publicamente
     * se houve lead novo, atualização
     * de lead existente ou duplicidade.
     *
     * Isso evita que a API pública
     * seja usada para descobrir se
     * determinado e-mail já existe
     * na base da instituição.
     */
    return responderJson(
      {
        success: true,

        message:
          formulario.mensagemSucesso ??
          "Dados recebidos com sucesso.",

        redirectUrl:
          formulario.urlRedirecionamento,
      },
      201
    );
  } catch (error) {
    return responderErro(
      error
    );
  }
}