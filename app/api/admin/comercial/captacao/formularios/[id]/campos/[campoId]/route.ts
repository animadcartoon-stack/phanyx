import {
  MapeamentoCampoFormularioCaptacaoLead,
  Prisma,
  StatusFormularioCaptacaoLead,
  TipoCampoFormularioCaptacaoLead,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  type UsuarioLogado,
} from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const OFFSET_ORDEM = 1_000_000;

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
      "comercial.captacao.formularios.ver"
    ),

    usuarioPossuiPermissao(
      user,
      "comercial.captacao.formularios.gerenciar"
    ),
  ]);

  return {
    podeVer:
      podeVer || podeGerenciar,

    podeGerenciar,
  };
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
  valor: unknown
) {
  const texto =
    String(valor ?? "").trim();

  return texto || null;
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

function possuiCampo(
  objeto: Record<string, unknown>,
  campo: string
) {
  return Object.prototype.hasOwnProperty.call(
    objeto,
    campo
  );
}

function normalizarChave(
  valor: string
) {
  const chave = valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );

  return chave || "campo";
}

function tipoCampoOuNull(
  valor: unknown
): TipoCampoFormularioCaptacaoLead | null {
  const normalizado =
    String(valor ?? "")
      .trim()
      .toUpperCase() as
      TipoCampoFormularioCaptacaoLead;

  return Object.values(
    TipoCampoFormularioCaptacaoLead
  ).includes(normalizado)
    ? normalizado
    : null;
}

function mapeamentoOuNull(
  valor: unknown
): MapeamentoCampoFormularioCaptacaoLead | null {
  const normalizado =
    String(valor ?? "")
      .trim()
      .toUpperCase() as
      MapeamentoCampoFormularioCaptacaoLead;

  return Object.values(
    MapeamentoCampoFormularioCaptacaoLead
  ).includes(normalizado)
    ? normalizado
    : null;
}

function jsonParaPrisma(
  valor: unknown
) {
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
          "Já existe um campo com essa chave ou posição neste formulário.",
        codigo:
          "CAMPO_DUPLICADO",
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
        "Não foi possível processar o campo do formulário de captação.",
      codigo:
        "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

async function localizarFormulario(
  formularioId: number,
  instituicaoId: number
) {
  return prisma.formularioCaptacaoLead.findFirst({
    where: {
      id: formularioId,
      instituicaoId,
    },

    select: {
      id: true,
      nome: true,
      titulo: true,
      status: true,
      versao: true,
      ativo: true,
    },
  });
}

async function localizarCampo(
  campoId: number,
  formularioId: number,
  instituicaoId: number
) {
  return prisma.campoFormularioCaptacaoLead.findFirst({
    where: {
      id: campoId,
      formularioId,
      instituicaoId,
    },

    select: {
      id: true,
      instituicaoId: true,
      formularioId: true,

      chave: true,
      rotulo: true,
      tipo: true,
      mapeamento: true,

      placeholder: true,
      textoAjuda: true,
      valorPadrao: true,
      mascara: true,

      obrigatorio: true,
      ativo: true,

      ordem: true,
      largura: true,

      opcoes: true,
      validacoes: true,

      criadoEm: true,
      atualizadoEm: true,
    },
  });
}

export async function GET(
  _req: NextRequest,
  ctx: {
    params: {
      id: string;
      campoId: string;
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
        "Você não possui permissão para consultar campos de formulários de captação.",
        "SEM_PERMISSAO"
      );
    }

    const formularioId =
      numeroPositivo(
        ctx.params.id
      );

    const campoId =
      numeroPositivo(
        ctx.params.campoId
      );

    if (!formularioId) {
      throw new ErroHttp(
        400,
        "Formulário inválido.",
        "FORMULARIO_INVALIDO"
      );
    }

    if (!campoId) {
      throw new ErroHttp(
        400,
        "Campo inválido.",
        "CAMPO_INVALIDO"
      );
    }

    const formulario =
      await localizarFormulario(
        formularioId,
        instituicaoId
      );

    if (!formulario) {
      throw new ErroHttp(
        404,
        "Formulário de captação não encontrado.",
        "FORMULARIO_NAO_ENCONTRADO"
      );
    }

    const campo =
      await localizarCampo(
        campoId,
        formularioId,
        instituicaoId
      );

    if (!campo) {
      throw new ErroHttp(
        404,
        "Campo do formulário não encontrado.",
        "CAMPO_NAO_ENCONTRADO"
      );
    }

    return NextResponse.json(
      {
        success: true,

        permissoes,

        formulario,

        tiposDisponiveis:
          Object.values(
            TipoCampoFormularioCaptacaoLead
          ),

        mapeamentosDisponiveis:
          Object.values(
            MapeamentoCampoFormularioCaptacaoLead
          ),

        campo,
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
      "Erro ao consultar campo do formulário de captação:"
    );
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: {
    params: {
      id: string;
      campoId: string;
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
        "Você não possui permissão para editar campos dos formulários de captação.",
        "SEM_PERMISSAO"
      );
    }

    const formularioId =
      numeroPositivo(
        ctx.params.id
      );

    const campoId =
      numeroPositivo(
        ctx.params.campoId
      );

    if (!formularioId) {
      throw new ErroHttp(
        400,
        "Formulário inválido.",
        "FORMULARIO_INVALIDO"
      );
    }

    if (!campoId) {
      throw new ErroHttp(
        400,
        "Campo inválido.",
        "CAMPO_INVALIDO"
      );
    }

    const formulario =
      await localizarFormulario(
        formularioId,
        instituicaoId
      );

    if (!formulario) {
      throw new ErroHttp(
        404,
        "Formulário de captação não encontrado.",
        "FORMULARIO_NAO_ENCONTRADO"
      );
    }

    if (
      formulario.status ===
      StatusFormularioCaptacaoLead.ARQUIVADO
    ) {
      throw new ErroHttp(
        400,
        "Um formulário arquivado não pode ter seus campos alterados.",
        "FORMULARIO_ARQUIVADO"
      );
    }

    const atual =
      await localizarCampo(
        campoId,
        formularioId,
        instituicaoId
      );

    if (!atual) {
      throw new ErroHttp(
        404,
        "Campo do formulário não encontrado.",
        "CAMPO_NAO_ENCONTRADO"
      );
    }

    const body =
      (await req
        .json()
        .catch(
          () => null
        )) as
        | Record<string, unknown>
        | null;

    if (!body) {
      throw new ErroHttp(
        400,
        "JSON inválido.",
        "JSON_INVALIDO"
      );
    }

    const camposPermitidos = [
      "chave",
      "rotulo",
      "tipo",
      "mapeamento",
      "placeholder",
      "textoAjuda",
      "valorPadrao",
      "mascara",
      "obrigatorio",
      "ativo",
      "ordem",
      "largura",
      "opcoes",
      "validacoes",
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

    let chave =
      atual.chave;

    if (
      possuiCampo(
        body,
        "chave"
      )
    ) {
      const informada =
        textoOuNull(
          body.chave
        );

      if (!informada) {
        throw new ErroHttp(
          400,
          "Informe a chave do campo.",
          "CHAVE_INVALIDA"
        );
      }

      chave =
        normalizarChave(
          informada
        );

      if (
        chave.length > 100
      ) {
        throw new ErroHttp(
          400,
          "A chave do campo deve possuir no máximo 100 caracteres.",
          "CHAVE_INVALIDA"
        );
      }
    }

    if (
      chave !== atual.chave
    ) {
      const duplicada =
        await prisma.campoFormularioCaptacaoLead.findFirst({
          where: {
            formularioId,
            instituicaoId,

            id: {
              not: campoId,
            },

            chave,
          },

          select: {
            id: true,
          },
        });

      if (duplicada) {
        throw new ErroHttp(
          409,
          "Já existe outro campo com essa chave neste formulário.",
          "CHAVE_DUPLICADA",
          {
            campoId:
              duplicada.id,
          }
        );
      }
    }

    let rotulo =
      atual.rotulo;

    if (
      possuiCampo(
        body,
        "rotulo"
      )
    ) {
      const informado =
        textoOuNull(
          body.rotulo
        );

      if (
        !informado ||
        informado.length >
          180
      ) {
        throw new ErroHttp(
          400,
          "Informe o rótulo do campo com até 180 caracteres.",
          "ROTULO_INVALIDO"
        );
      }

      rotulo =
        informado;
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
        tipoCampoOuNull(
          body.tipo
        );

      if (!informado) {
        throw new ErroHttp(
          400,
          "Selecione um tipo de campo válido.",
          "TIPO_INVALIDO"
        );
      }

      tipo =
        informado;
    }

    let mapeamento =
      atual.mapeamento;

    if (
      possuiCampo(
        body,
        "mapeamento"
      )
    ) {
      const informado =
        mapeamentoOuNull(
          body.mapeamento
        );

      if (!informado) {
        throw new ErroHttp(
          400,
          "Selecione um mapeamento válido.",
          "MAPEAMENTO_INVALIDO"
        );
      }

      mapeamento =
        informado;
    }

    const placeholder =
      possuiCampo(
        body,
        "placeholder"
      )
        ? textoOuNull(
            body.placeholder
          )
        : atual.placeholder;

    const textoAjuda =
      possuiCampo(
        body,
        "textoAjuda"
      )
        ? textoOuNull(
            body.textoAjuda
          )
        : atual.textoAjuda;

    const valorPadrao =
      possuiCampo(
        body,
        "valorPadrao"
      )
        ? textoOuNull(
            body.valorPadrao
          )
        : atual.valorPadrao;

    const mascara =
      possuiCampo(
        body,
        "mascara"
      )
        ? textoOuNull(
            body.mascara
          )
        : atual.mascara;

    const obrigatorio =
      possuiCampo(
        body,
        "obrigatorio"
      )
        ? booleano(
            body.obrigatorio,
            atual.obrigatorio
          )
        : atual.obrigatorio;

    const ativo =
      possuiCampo(
        body,
        "ativo"
      )
        ? booleano(
            body.ativo,
            atual.ativo
          )
        : atual.ativo;

    let largura =
      atual.largura;

    if (
      possuiCampo(
        body,
        "largura"
      )
    ) {
      const informada =
        numeroPositivo(
          body.largura
        );

      if (
        !informada ||
        informada > 12
      ) {
        throw new ErroHttp(
          400,
          "A largura do campo deve estar entre 1 e 12.",
          "LARGURA_INVALIDA"
        );
      }

      largura =
        informada;
    }

    let opcoes:
      Prisma.InputJsonValue |
      Prisma.NullTypes.JsonNull =
        atual.opcoes as
          Prisma.InputJsonValue;

    if (
      possuiCampo(
        body,
        "opcoes"
      )
    ) {
      opcoes =
        jsonParaPrisma(
          body.opcoes
        );
    }

    let validacoes:
      Prisma.InputJsonValue |
      Prisma.NullTypes.JsonNull =
        atual.validacoes as
          Prisma.InputJsonValue;

    if (
      possuiCampo(
        body,
        "validacoes"
      )
    ) {
      validacoes =
        jsonParaPrisma(
          body.validacoes
        );
    }

    let novaOrdem =
      atual.ordem;

    if (
      possuiCampo(
        body,
        "ordem"
      )
    ) {
      const informada =
        numeroPositivo(
          body.ordem
        );

      if (!informada) {
        throw new ErroHttp(
          400,
          "Informe uma posição válida.",
          "ORDEM_INVALIDA"
        );
      }

      const totalCampos =
        await prisma.campoFormularioCaptacaoLead.count({
          where: {
            formularioId,
            instituicaoId,
          },
        });

      if (
        informada >
        totalCampos
      ) {
        throw new ErroHttp(
          400,
          `A posição deve estar entre 1 e ${totalCampos}.`,
          "ORDEM_INVALIDA"
        );
      }

      novaOrdem =
        informada;
    }

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Reordenação segura.
           *
           * A ordem é única dentro
           * do formulário. Por isso
           * usamos posições temporárias
           * altas para evitar conflito
           * durante a movimentação.
           */
          if (
            novaOrdem !==
            atual.ordem
          ) {
            await tx.campoFormularioCaptacaoLead.update({
              where: {
                id: campoId,
              },

              data: {
                ordem:
                  -campoId,
              },
            });

            if (
              novaOrdem <
              atual.ordem
            ) {
              await tx.campoFormularioCaptacaoLead.updateMany({
                where: {
                  formularioId,
                  instituicaoId,

                  ordem: {
                    gte:
                      novaOrdem,
                    lt:
                      atual.ordem,
                  },
                },

                data: {
                  ordem: {
                    increment:
                      OFFSET_ORDEM,
                  },
                },
              });

              await tx.campoFormularioCaptacaoLead.updateMany({
                where: {
                  formularioId,
                  instituicaoId,

                  ordem: {
                    gte:
                      novaOrdem +
                      OFFSET_ORDEM,

                    lt:
                      atual.ordem +
                      OFFSET_ORDEM,
                  },
                },

                data: {
                  ordem: {
                    decrement:
                      OFFSET_ORDEM -
                      1,
                  },
                },
              });
            } else {
              await tx.campoFormularioCaptacaoLead.updateMany({
                where: {
                  formularioId,
                  instituicaoId,

                  ordem: {
                    gt:
                      atual.ordem,
                    lte:
                      novaOrdem,
                  },
                },

                data: {
                  ordem: {
                    increment:
                      OFFSET_ORDEM,
                  },
                },
              });

              await tx.campoFormularioCaptacaoLead.updateMany({
                where: {
                  formularioId,
                  instituicaoId,

                  ordem: {
                    gt:
                      atual.ordem +
                      OFFSET_ORDEM,

                    lte:
                      novaOrdem +
                      OFFSET_ORDEM,
                  },
                },

                data: {
                  ordem: {
                    decrement:
                      OFFSET_ORDEM +
                      1,
                  },
                },
              });
            }
          }

          const campo =
            await tx.campoFormularioCaptacaoLead.update({
              where: {
                id:
                  campoId,
              },

              data: {
                chave,
                rotulo,
                tipo,
                mapeamento,

                placeholder,
                textoAjuda,
                valorPadrao,
                mascara,

                obrigatorio,
                ativo,

                ordem:
                  novaOrdem,

                largura,

                opcoes,
                validacoes,
              },

              select: {
                id: true,
                chave: true,
                rotulo: true,
                tipo: true,
                mapeamento:
                  true,

                placeholder:
                  true,
                textoAjuda:
                  true,
                valorPadrao:
                  true,
                mascara: true,

                obrigatorio:
                  true,
                ativo: true,

                ordem: true,
                largura: true,

                opcoes: true,
                validacoes:
                  true,

                criadoEm: true,
                atualizadoEm:
                  true,
              },
            });

          const formularioAtualizado =
            await tx.formularioCaptacaoLead.update({
              where: {
                id:
                  formularioId,
              },

              data: {
                versao: {
                  increment: 1,
                },

                atualizadoPorId:
                  user.id,
              },

              select: {
                id: true,
                versao: true,
                atualizadoEm:
                  true,
              },
            });

          const campos =
            await tx.campoFormularioCaptacaoLead.findMany({
              where: {
                formularioId,
                instituicaoId,
              },

              select: {
                id: true,
                chave: true,
                rotulo: true,
                tipo: true,
                mapeamento:
                  true,
                obrigatorio:
                  true,
                ativo: true,
                ordem: true,
                largura: true,
              },

              orderBy: {
                ordem:
                  "asc",
              },
            });

          return {
            campo,
            formulario:
              formularioAtualizado,
            campos,
          };
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "Campo do formulário atualizado com sucesso.",

        campo:
          resultado.campo,

        formulario: {
          id:
            resultado
              .formulario.id,

          versao:
            resultado
              .formulario
              .versao,

          atualizadoEm:
            resultado
              .formulario
              .atualizadoEm,
        },

        campos:
          resultado.campos,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao editar campo do formulário de captação:"
    );
  }
}