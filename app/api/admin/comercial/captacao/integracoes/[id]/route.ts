import {
  Prisma,
  StatusIntegracaoCaptacaoLead,
  TipoIntegracaoCaptacaoLead,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createCipheriv,
  createHash,
  randomBytes,
} from "crypto";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  type UsuarioLogado,
} from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

class ErroHttp extends Error {
  status: number;
  codigo: string;
  detalhes?: Record<string, unknown>;

  constructor(
    status: number,
    mensagem: string,
    codigo: string,
    detalhes?: Record<string, unknown>
  ) {
    super(mensagem);

    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

function ehMasterReal(
  user: UsuarioLogado
) {
  return (
    user.isMasterAdmin === true &&
    user.impersonacao === false &&
    user.email.trim().toLowerCase() ===
      "academicophanyx@gmail.com"
  );
}

async function autenticarUsuario() {
  const user =
    await getUserFromToken();

  if (!user) {
    throw new ErroHttp(
      401,
      "Usuário não autenticado.",
      "NAO_AUTENTICADO"
    );
  }

  const instituicaoId =
    Number(user.instituicaoId);

  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    throw new ErroHttp(
      403,
      "O usuário não está vinculado a uma instituição válida.",
      "INSTITUICAO_INVALIDA"
    );
  }

  return {
    user,
    instituicaoId,
  };
}

async function obterPermissoes(
  user: UsuarioLogado
) {
  if (ehMasterReal(user)) {
    return {
      podeVer: true,
      podeGerenciar: true,
    };
  }

  const [
    podeVer,
    podeGerenciar,
  ] = await Promise.all([
    usuarioPossuiPermissao(
      user,
      "comercial.captacao.integracoes.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.integracoes.gerenciar"
    ),
  ]);

  return {
    podeVer:
      podeVer ||
      podeGerenciar,

    podeGerenciar,
  };
}

function possuiCampo(
  objeto: Record<string, unknown>,
  campo: string
) {
  return Object.prototype.hasOwnProperty.call(
    objeto,
    campo
  );
}

function numeroPositivo(
  valor: unknown
) {
  const numero =
    Number(valor);

  return (
    Number.isInteger(numero) &&
    numero > 0
  )
    ? numero
    : null;
}

function textoOuNull(
  valor: unknown,
  limite = 5000
) {
  const texto =
    String(valor ?? "").trim();

  if (!texto) {
    return null;
  }

  return texto.slice(
    0,
    limite
  );
}

function booleano(
  valor: unknown,
  padrao = false
) {
  if (
    typeof valor === "boolean"
  ) {
    return valor;
  }

  if (
    valor === "true" ||
    valor === "1" ||
    valor === 1
  ) {
    return true;
  }

  if (
    valor === "false" ||
    valor === "0" ||
    valor === 0
  ) {
    return false;
  }

  return padrao;
}

function tipoOuNull(
  valor: unknown
): TipoIntegracaoCaptacaoLead | null {
  const normalizado =
    String(valor ?? "")
      .trim()
      .toUpperCase() as
      TipoIntegracaoCaptacaoLead;

  return Object.values(
    TipoIntegracaoCaptacaoLead
  ).includes(normalizado)
    ? normalizado
    : null;
}

function statusOuNull(
  valor: unknown
): StatusIntegracaoCaptacaoLead | null {
  const normalizado =
    String(valor ?? "")
      .trim()
      .toUpperCase() as
      StatusIntegracaoCaptacaoLead;

  return Object.values(
    StatusIntegracaoCaptacaoLead
  ).includes(normalizado)
    ? normalizado
    : null;
}

function validarUrl(
  valor: unknown
) {
  const texto =
    textoOuNull(
      valor,
      4000
    );

  if (!texto) {
    return null;
  }

  try {
    const url =
      new URL(texto);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      throw new Error();
    }

    return url.toString();
  } catch {
    throw new ErroHttp(
      400,
      "Informe uma URL de endpoint válida usando HTTP ou HTTPS.",
      "URL_ENDPOINT_INVALIDA"
    );
  }
}

function jsonParaPrisma(
  valor: unknown
):
  | Prisma.InputJsonValue
  | Prisma.NullTypes.JsonNull {
  if (
    valor === null ||
    valor === ""
  ) {
    return Prisma.JsonNull;
  }

  if (
    typeof valor === "string"
  ) {
    try {
      return JSON.parse(
        valor
      ) as Prisma.InputJsonValue;
    } catch {
      throw new ErroHttp(
        400,
        "Foi informada uma configuração JSON inválida.",
        "JSON_INVALIDO"
      );
    }
  }

  return valor as
    Prisma.InputJsonValue;
}

function tipoExigeSegredo(
  tipo: TipoIntegracaoCaptacaoLead
) {
  const tiposComSegredo:
    TipoIntegracaoCaptacaoLead[] = [
      TipoIntegracaoCaptacaoLead.WEBHOOK_ENTRADA,
      TipoIntegracaoCaptacaoLead.WEBHOOK_SAIDA,
      TipoIntegracaoCaptacaoLead.API,
    ];

  return tiposComSegredo.includes(
    tipo
  );
}

function obterChaveCriptografia() {
  const segredoBase =
    process.env
      .CAPTACAO_INTEGRACAO_CRYPTO_SECRET ||
    process.env.JWT_SECRET;

  if (!segredoBase) {
    throw new ErroHttp(
      503,
      "A criptografia das integrações ainda não está configurada.",
      "CRIPTOGRAFIA_NAO_CONFIGURADA"
    );
  }

  return createHash(
    "sha256"
  )
    .update(segredoBase)
    .digest();
}

function criptografarSegredo(
  segredo: string
) {
  const chave =
    obterChaveCriptografia();

  const iv =
    randomBytes(12);

  const cipher =
    createCipheriv(
      "aes-256-gcm",
      chave,
      iv
    );

  const criptografado =
    Buffer.concat([
      cipher.update(
        segredo,
        "utf8"
      ),

      cipher.final(),
    ]);

  const tag =
    cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    criptografado.toString(
      "base64url"
    ),
  ].join(":");
}

function gerarSegredo() {
  return randomBytes(
    32
  ).toString(
    "base64url"
  );
}

function responderErro(
  error: unknown,
  contexto: string
) {
  if (
    error instanceof ErroHttp
  ) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        codigo: error.codigo,
        detalhes:
          error.detalhes,
      },
      {
        status: error.status,
      }
    );
  }

  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      {
        success: false,

        error:
          "Já existe uma integração com esse nome nesta instituição.",

        codigo:
          "INTEGRACAO_DUPLICADA",
      },
      {
        status: 409,
      }
    );
  }

  console.error(
    contexto,
    error
  );

  return NextResponse.json(
    {
      success: false,

      error:
        "Não foi possível processar a integração da Central de Captação.",

      codigo:
        "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

async function localizarIntegracao(
  id: number,
  instituicaoId: number
) {
  return prisma.integracaoCaptacaoLead.findFirst({
    where: {
      id,
      instituicaoId,
    },

    select: {
      id: true,
      instituicaoId: true,

      canalId: true,
      campanhaId: true,
      formularioId:
        true,

      nome: true,
      tipo: true,
      status: true,

      chavePublica:
        true,

      segredoCriptografado:
        true,

      urlEndpoint:
        true,

      configuracao:
        true,

      eventosAssinados:
        true,

      ativo: true,

      ultimoSucessoEm:
        true,

      ultimoErroEm:
        true,

      ultimoErro:
        true,

      criadoPorId:
        true,

      atualizadoPorId:
        true,

      criadoEm: true,
      atualizadoEm: true,

      canal: {
        select: {
          id: true,
          nome: true,
          tipo: true,
          cor: true,
          ativo: true,
        },
      },

      campanha: {
        select: {
          id: true,
          nome: true,
          codigo: true,
          status: true,
          ativo: true,
        },
      },

      formulario: {
        select: {
          id: true,
          nome: true,
          titulo: true,
          status: true,
          ativo: true,
        },
      },

      _count: {
        select: {
          submissoes: true,
          eventos: true,
        },
      },
    },
  });
}

async function obterReferencias(
  instituicaoId: number
) {
  const [
    canais,
    campanhas,
    formularios,
  ] =
    await prisma.$transaction([
      prisma.canalCaptacaoLead.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
          nome: true,
          tipo: true,
          cor: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.campanhaCaptacaoLead.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
          canalId: true,
          nome: true,
          codigo: true,
          status: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),

      prisma.formularioCaptacaoLead.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
          canalId: true,
          campanhaId:
            true,

          nome: true,
          titulo: true,
          status: true,
        },

        orderBy: {
          nome: "asc",
        },
      }),
    ]);

  return {
    canais,
    campanhas,
    formularios,
  };
}

export async function GET(
  _req: NextRequest,
  ctx: {
    params: {
      id: string;
    };
  }
) {
  try {
    const {
      user,
      instituicaoId,
    } =
      await autenticarUsuario();

    const permissoes =
      await obterPermissoes(
        user
      );

    if (
      !permissoes.podeVer
    ) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para consultar integrações da Central de Captação.",
        "SEM_PERMISSAO"
      );
    }

    const id =
      numeroPositivo(
        ctx.params.id
      );

    if (!id) {
      throw new ErroHttp(
        400,
        "Integração inválida.",
        "INTEGRACAO_INVALIDA"
      );
    }

    const [
      integracaoBanco,
      referencias,
    ] =
      await Promise.all([
        localizarIntegracao(
          id,
          instituicaoId
        ),

        obterReferencias(
          instituicaoId
        ),
      ]);

    if (!integracaoBanco) {
      throw new ErroHttp(
        404,
        "Integração de captação não encontrada.",
        "INTEGRACAO_NAO_ENCONTRADA"
      );
    }

    const {
      segredoCriptografado,
      ...integracao
    } =
      integracaoBanco;

    return NextResponse.json(
      {
        success: true,

        permissoes,

        tiposDisponiveis:
          Object.values(
            TipoIntegracaoCaptacaoLead
          ),

        statusDisponiveis:
          Object.values(
            StatusIntegracaoCaptacaoLead
          ),

        referencias,

        integracao: {
          ...integracao,

          possuiSegredo:
            Boolean(
              segredoCriptografado
            ),
        },
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao consultar integração da Central de Captação:"
    );
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: {
    params: {
      id: string;
    };
  }
) {
  try {
    const {
      user,
      instituicaoId,
    } =
      await autenticarUsuario();

    const permissoes =
      await obterPermissoes(
        user
      );

    if (
      !permissoes.podeGerenciar
    ) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para editar integrações da Central de Captação.",
        "SEM_PERMISSAO"
      );
    }

    const id =
      numeroPositivo(
        ctx.params.id
      );

    if (!id) {
      throw new ErroHttp(
        400,
        "Integração inválida.",
        "INTEGRACAO_INVALIDA"
      );
    }

    const atual =
      await localizarIntegracao(
        id,
        instituicaoId
      );

    if (!atual) {
      throw new ErroHttp(
        404,
        "Integração de captação não encontrada.",
        "INTEGRACAO_NAO_ENCONTRADA"
      );
    }

    const body =
      (await req
        .json()
        .catch(
          () => null
        )) as
        | Record<
            string,
            unknown
          >
        | null;

    if (!body) {
      throw new ErroHttp(
        400,
        "JSON inválido.",
        "JSON_INVALIDO"
      );
    }

    const camposPermitidos = [
      "canalId",
      "campanhaId",
      "formularioId",

      "nome",
      "tipo",
      "status",

      "urlEndpoint",

      "configuracao",
      "eventosAssinados",

      "ativo",

      "segredo",
      "gerarNovoSegredo",
    ];

    const possuiAlteracao =
      camposPermitidos.some(
        (campo) =>
          possuiCampo(
            body,
            campo
          )
      );

    if (!possuiAlteracao) {
      throw new ErroHttp(
        400,
        "Nenhuma alteração foi informada.",
        "SEM_ALTERACOES"
      );
    }

    /*
     * REVOGADA é terminal.
     *
     * Se for necessário usar a
     * integração novamente, deve-se
     * criar uma nova credencial.
     */
    if (
      atual.status ===
        StatusIntegracaoCaptacaoLead.REVOGADA &&
      (
        possuiCampo(
          body,
          "status"
        ) ||
        possuiCampo(
          body,
          "ativo"
        ) ||
        possuiCampo(
          body,
          "segredo"
        ) ||
        possuiCampo(
          body,
          "gerarNovoSegredo"
        )
      )
    ) {
      throw new ErroHttp(
        409,
        "Esta integração foi revogada. Crie uma nova integração para voltar a utilizá-la.",
        "INTEGRACAO_REVOGADA"
      );
    }

    let nome =
      atual.nome;

    if (
      possuiCampo(
        body,
        "nome"
      )
    ) {
      const informado =
        textoOuNull(
          body.nome,
          180
        );

      if (!informado) {
        throw new ErroHttp(
          400,
          "Informe o nome da integração.",
          "NOME_INVALIDO"
        );
      }

      nome =
        informado;
    }

    if (
      nome !== atual.nome
    ) {
      const duplicada =
        await prisma.integracaoCaptacaoLead.findFirst({
          where: {
            instituicaoId,

            id: {
              not: id,
            },

            nome,
          },

          select: {
            id: true,
          },
        });

      if (duplicada) {
        throw new ErroHttp(
          409,
          "Já existe outra integração com esse nome.",
          "INTEGRACAO_DUPLICADA",
          {
            integracaoId:
              duplicada.id,
          }
        );
      }
    }

    let tipo =
      atual.tipo;

    if (
      possuiCampo(
        body,
        "tipo"
      )
    ) {
      const informado =
        tipoOuNull(
          body.tipo
        );

      if (!informado) {
        throw new ErroHttp(
          400,
          "Selecione um tipo válido de integração.",
          "TIPO_INVALIDO"
        );
      }

      tipo =
        informado;
    }

    let status =
      atual.status;

    if (
      possuiCampo(
        body,
        "status"
      )
    ) {
      const informado =
        statusOuNull(
          body.status
        );

      if (!informado) {
        throw new ErroHttp(
          400,
          "Selecione um status válido para a integração.",
          "STATUS_INVALIDO"
        );
      }

      status =
        informado;
    }

    let ativo =
      possuiCampo(
        body,
        "ativo"
      )
        ? booleano(
            body.ativo,
            atual.ativo
          )
        : atual.ativo;

    /*
     * Mantemos status e ativo
     * coerentes.
     */
    if (
      status ===
      StatusIntegracaoCaptacaoLead.REVOGADA
    ) {
      ativo = false;
    }

    if (
      status ===
      StatusIntegracaoCaptacaoLead.ATIVA
    ) {
      ativo = true;
    }

    if (
      !ativo &&
      status ===
        StatusIntegracaoCaptacaoLead.ATIVA
    ) {
      status =
        StatusIntegracaoCaptacaoLead.INATIVA;
    }

    let urlEndpoint =
      atual.urlEndpoint;

    if (
      possuiCampo(
        body,
        "urlEndpoint"
      )
    ) {
      urlEndpoint =
        validarUrl(
          body.urlEndpoint
        );
    }

    if (
      tipo ===
        TipoIntegracaoCaptacaoLead.WEBHOOK_SAIDA &&
      !urlEndpoint
    ) {
      throw new ErroHttp(
        400,
        "Webhook de saída exige uma URL de endpoint.",
        "URL_ENDPOINT_OBRIGATORIA"
      );
    }

    let canalId =
      atual.canalId;

    let campanhaId =
      atual.campanhaId;

    let formularioId =
      atual.formularioId;

    if (
      possuiCampo(
        body,
        "canalId"
      )
    ) {
      if (
        body.canalId ===
          null ||
        body.canalId === ""
      ) {
        canalId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.canalId
          );

        const canal =
          informado
            ? await prisma.canalCaptacaoLead.findFirst({
                where: {
                  id: informado,
                  instituicaoId,
                  ativo: true,
                },

                select: {
                  id: true,
                },
              })
            : null;

        if (!canal) {
          throw new ErroHttp(
            400,
            "O canal selecionado não existe ou está inativo.",
            "CANAL_INVALIDO"
          );
        }

        canalId =
          informado;
      }
    }

    if (
      possuiCampo(
        body,
        "campanhaId"
      )
    ) {
      if (
        body.campanhaId ===
          null ||
        body.campanhaId === ""
      ) {
        campanhaId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.campanhaId
          );

        const campanha =
          informado
            ? await prisma.campanhaCaptacaoLead.findFirst({
                where: {
                  id: informado,
                  instituicaoId,
                  ativo: true,
                },

                select: {
                  id: true,
                  canalId: true,
                },
              })
            : null;

        if (!campanha) {
          throw new ErroHttp(
            400,
            "A campanha selecionada não existe ou está inativa.",
            "CAMPANHA_INVALIDA"
          );
        }

        campanhaId =
          informado;

        if (
          !canalId &&
          campanha.canalId
        ) {
          canalId =
            campanha.canalId;
        }
      }
    }

    if (
      possuiCampo(
        body,
        "formularioId"
      )
    ) {
      if (
        body.formularioId ===
          null ||
        body.formularioId === ""
      ) {
        formularioId =
          null;
      } else {
        const informado =
          numeroPositivo(
            body.formularioId
          );

        const formulario =
          informado
            ? await prisma.formularioCaptacaoLead.findFirst({
                where: {
                  id: informado,
                  instituicaoId,
                  ativo: true,
                },

                select: {
                  id: true,
                  canalId: true,
                  campanhaId:
                    true,
                },
              })
            : null;

        if (!formulario) {
          throw new ErroHttp(
            400,
            "O formulário selecionado não existe ou está inativo.",
            "FORMULARIO_INVALIDO"
          );
        }

        formularioId =
          informado;

        if (
          !canalId &&
          formulario.canalId
        ) {
          canalId =
            formulario.canalId;
        }

        if (
          !campanhaId &&
          formulario.campanhaId
        ) {
          campanhaId =
            formulario.campanhaId;
        }
      }
    }

    /*
     * Validação final da cadeia
     * canal → campanha → formulário.
     */
    if (campanhaId) {
      const campanha =
        await prisma.campanhaCaptacaoLead.findFirst({
          where: {
            id: campanhaId,
            instituicaoId,
          },

          select: {
            canalId: true,
          },
        });

      if (!campanha) {
        throw new ErroHttp(
          400,
          "A campanha vinculada não existe nesta instituição.",
          "CAMPANHA_INVALIDA"
        );
      }

      if (
        canalId &&
        campanha.canalId &&
        campanha.canalId !==
          canalId
      ) {
        throw new ErroHttp(
          400,
          "A campanha vinculada pertence a outro canal.",
          "CAMPANHA_CANAL_DIVERGENTE"
        );
      }
    }

    if (formularioId) {
      const formulario =
        await prisma.formularioCaptacaoLead.findFirst({
          where: {
            id: formularioId,
            instituicaoId,
          },

          select: {
            canalId: true,
            campanhaId:
              true,
          },
        });

      if (!formulario) {
        throw new ErroHttp(
          400,
          "O formulário vinculado não existe nesta instituição.",
          "FORMULARIO_INVALIDO"
        );
      }

      if (
        canalId &&
        formulario.canalId &&
        formulario.canalId !==
          canalId
      ) {
        throw new ErroHttp(
          400,
          "O formulário vinculado pertence a outro canal.",
          "FORMULARIO_CANAL_DIVERGENTE"
        );
      }

      if (
        campanhaId &&
        formulario.campanhaId &&
        formulario.campanhaId !==
          campanhaId
      ) {
        throw new ErroHttp(
          400,
          "O formulário vinculado pertence a outra campanha.",
          "FORMULARIO_CAMPANHA_DIVERGENTE"
        );
      }
    }

    let configuracao:
      | Prisma.InputJsonValue
      | Prisma.NullTypes.JsonNull =
        atual.configuracao ===
          null
          ? Prisma.JsonNull
          : atual.configuracao as
              Prisma.InputJsonValue;

    if (
      possuiCampo(
        body,
        "configuracao"
      )
    ) {
      configuracao =
        jsonParaPrisma(
          body.configuracao
        );
    }

    let eventosAssinados:
      | Prisma.InputJsonValue
      | Prisma.NullTypes.JsonNull =
        atual.eventosAssinados ===
          null
          ? Prisma.JsonNull
          : atual.eventosAssinados as
              Prisma.InputJsonValue;

    if (
      possuiCampo(
        body,
        "eventosAssinados"
      )
    ) {
      eventosAssinados =
        jsonParaPrisma(
          body.eventosAssinados
        );
    }

    /*
     * Troca do segredo.
     *
     * Pode vir:
     *
     * { segredo: "..." }
     *
     * ou:
     *
     * { gerarNovoSegredo: true }
     */
    const segredoInformado =
      possuiCampo(
        body,
        "segredo"
      )
        ? textoOuNull(
            body.segredo,
            5000
          )
        : null;

    const gerarNovoSegredo =
      possuiCampo(
        body,
        "gerarNovoSegredo"
      )
        ? booleano(
            body.gerarNovoSegredo
          )
        : false;

    if (
      possuiCampo(
        body,
        "segredo"
      ) &&
      !segredoInformado
    ) {
      throw new ErroHttp(
        400,
        "O novo segredo não pode ser vazio.",
        "SEGREDO_INVALIDO"
      );
    }

    if (
      segredoInformado &&
      gerarNovoSegredo
    ) {
      throw new ErroHttp(
        400,
        'Informe "segredo" ou solicite "gerarNovoSegredo", não os dois ao mesmo tempo.',
        "SEGREDO_CONFLITANTE"
      );
    }

    let segredoAberto:
      string | null =
        null;

    let segredoCriptografado =
      atual.segredoCriptografado;

    if (segredoInformado) {
      segredoAberto =
        segredoInformado;

      segredoCriptografado =
        criptografarSegredo(
          segredoAberto
        );
    }

    if (
      gerarNovoSegredo
    ) {
      segredoAberto =
        gerarSegredo();

      segredoCriptografado =
        criptografarSegredo(
          segredoAberto
        );
    }

    /*
     * Se mudou para um tipo que exige
     * segredo e ainda não existe um,
     * geramos automaticamente.
     */
    if (
      tipoExigeSegredo(
        tipo
      ) &&
      !segredoCriptografado
    ) {
      segredoAberto =
        gerarSegredo();

      segredoCriptografado =
        criptografarSegredo(
          segredoAberto
        );
    }

    /*
     * Antes de ativar um tipo que
     * exige segredo, ele precisa
     * possuir uma credencial válida.
     */
    if (
      status ===
        StatusIntegracaoCaptacaoLead.ATIVA &&
      tipoExigeSegredo(
        tipo
      ) &&
      !segredoCriptografado
    ) {
      throw new ErroHttp(
        400,
        "A integração precisa possuir um segredo antes de ser ativada.",
        "SEGREDO_OBRIGATORIO"
      );
    }

    await prisma.integracaoCaptacaoLead.update({
      where: {
        id,
      },

      data: {
        canalId,
        campanhaId,
        formularioId,

        nome,
        tipo,
        status,

        segredoCriptografado,

        urlEndpoint,

        configuracao,
        eventosAssinados,

        ativo,

        atualizadoPorId:
          user.id,
      },
    });

    const atualizada =
      await localizarIntegracao(
        id,
        instituicaoId
      );

    if (!atualizada) {
      throw new ErroHttp(
        404,
        "Integração não encontrada após a atualização.",
        "INTEGRACAO_NAO_ENCONTRADA"
      );
    }

    const {
      segredoCriptografado:
        segredoPersistido,

      ...integracao
    } =
      atualizada;

    let message =
      "Integração atualizada com sucesso.";

    if (
      status ===
      StatusIntegracaoCaptacaoLead.PAUSADA
    ) {
      message =
        "Integração pausada com sucesso.";
    }

    if (
      status ===
      StatusIntegracaoCaptacaoLead.ATIVA
    ) {
      message =
        "Integração ativada com sucesso.";
    }

    if (
      status ===
      StatusIntegracaoCaptacaoLead.REVOGADA
    ) {
      message =
        "Integração revogada com sucesso.";
    }

    return NextResponse.json(
      {
        success: true,

        message,

        integracao: {
          ...integracao,

          possuiSegredo:
            Boolean(
              segredoPersistido
            ),
        },

        /*
         * Somente quando um NOVO
         * segredo foi criado/trocado
         * ele aparece na resposta.
         */
        credenciais:
          segredoAberto
            ? {
                chavePublica:
                  integracao
                    .chavePublica,

                segredo:
                  segredoAberto,

                exibirUmaUnicaVez:
                  true,
              }
            : null,
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao editar integração da Central de Captação:"
    );
  }
}