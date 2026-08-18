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

function inteiroPositivo(
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

function jsonOpcional(
  valor: unknown
): Prisma.InputJsonValue | undefined {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return undefined;
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
        "Não foi possível processar os campos do formulário de captação.",
      codigo:
        "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

async function localizarFormulario(
  id: number,
  instituicaoId: number
) {
  return prisma.formularioCaptacaoLead.findFirst({
    where: {
      id,
      instituicaoId,
    },

    select: {
      id: true,
      nome: true,
      titulo: true,
      slug: true,

      tokenPublico: true,

      status: true,
      versao: true,
      ativo: true,
    },
  });
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
        "Você não possui permissão para consultar os campos dos formulários de captação.",
        "SEM_PERMISSAO"
      );
    }

    const formularioId =
      numeroPositivo(
        ctx.params.id
      );

    if (!formularioId) {
      throw new ErroHttp(
        400,
        "Formulário inválido.",
        "FORMULARIO_INVALIDO"
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

    const campos =
      await prisma.campoFormularioCaptacaoLead.findMany({
        where: {
          formularioId,
          instituicaoId,
        },

        select: {
          id: true,
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

        orderBy: {
          ordem: "asc",
        },
      });

    const polos =
      await prisma.polo.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },

        select: {
          id: true,
          nome: true,
        },

        orderBy: {
          nome: "asc",
        },
      });

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

        referencias: {
          polos,
        },

        resumo: {
          total:
            campos.length,

          ativos:
            campos.filter(
              (campo) =>
                campo.ativo
            ).length,

          obrigatorios:
            campos.filter(
              (campo) =>
                campo.ativo &&
                campo.obrigatorio
            ).length,
        },

        campos,
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
      "Erro ao consultar campos do formulário de captação:"
    );
  }
}

export async function POST(
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
        "Você não possui permissão para adicionar campos aos formulários de captação.",
        "SEM_PERMISSAO"
      );
    }

    const formularioId =
      numeroPositivo(
        ctx.params.id
      );

    if (!formularioId) {
      throw new ErroHttp(
        400,
        "Formulário inválido.",
        "FORMULARIO_INVALIDO"
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
        "Um formulário arquivado não pode receber novos campos.",
        "FORMULARIO_ARQUIVADO"
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

    const rotulo =
      textoOuNull(
        body.rotulo
      );

    if (
      !rotulo ||
      rotulo.length >
      180
    ) {
      throw new ErroHttp(
        400,
        "Informe o rótulo do campo com até 180 caracteres.",
        "ROTULO_INVALIDO"
      );
    }

    const chaveInformada =
      textoOuNull(
        body.chave
      );

    const chave =
      normalizarChave(
        chaveInformada ??
        rotulo
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

    const tipo =
      tipoCampoOuNull(
        body.tipo
      ) ??
      TipoCampoFormularioCaptacaoLead.TEXTO_CURTO;

    const mapeamento =
      mapeamentoOuNull(
        body.mapeamento
      ) ??
      MapeamentoCampoFormularioCaptacaoLead.PERSONALIZADO;

    const placeholder =
      textoOuNull(
        body.placeholder
      );

    const textoAjuda =
      textoOuNull(
        body.textoAjuda
      );

    const valorPadrao =
      textoOuNull(
        body.valorPadrao
      );

    const mascara =
      textoOuNull(
        body.mascara
      );

    const obrigatorio =
      booleano(
        body.obrigatorio,
        false
      );

    const ativo =
      booleano(
        body.ativo,
        true
      );

    let largura = 12;

    if (
      body.largura !==
      undefined &&
      body.largura !==
      null &&
      body.largura !== ""
    ) {
      const larguraInformada =
        inteiroPositivo(
          body.largura
        );

      if (
        !larguraInformada ||
        larguraInformada >
        12
      ) {
        throw new ErroHttp(
          400,
          "A largura do campo deve estar entre 1 e 12.",
          "LARGURA_INVALIDA"
        );
      }

      largura =
        larguraInformada;
    }

    const opcoes =
      jsonOpcional(
        body.opcoes
      );

    const validacoes =
      jsonOpcional(
        body.validacoes
      );

    const chaveExistente =
      await prisma.campoFormularioCaptacaoLead.findFirst({
        where: {
          formularioId,
          instituicaoId,
          chave,
        },

        select: {
          id: true,
        },
      });

    if (chaveExistente) {
      throw new ErroHttp(
        409,
        "Já existe um campo com essa chave neste formulário.",
        "CHAVE_DUPLICADA",
        {
          campoId:
            chaveExistente.id,
        }
      );
    }

    let ordem =
      inteiroPositivo(
        body.ordem
      );

    if (
      body.ordem !==
      undefined &&
      body.ordem !==
      null &&
      body.ordem !== "" &&
      !ordem
    ) {
      throw new ErroHttp(
        400,
        "Informe uma posição válida para o campo.",
        "ORDEM_INVALIDA"
      );
    }

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          if (!ordem) {
            const ultimo =
              await tx.campoFormularioCaptacaoLead.findFirst({
                where: {
                  formularioId,
                  instituicaoId,
                },

                select: {
                  ordem: true,
                },

                orderBy: {
                  ordem:
                    "desc",
                },
              });

            ordem =
              (
                ultimo?.ordem ??
                0
              ) + 1;
          } else {
            const ocupada =
              await tx.campoFormularioCaptacaoLead.findFirst({
                where: {
                  formularioId,
                  instituicaoId,
                  ordem,
                },

                select: {
                  id: true,
                },
              });

            if (ocupada) {
              throw new ErroHttp(
                409,
                "Já existe um campo nessa posição.",
                "ORDEM_OCUPADA",
                {
                  campoId:
                    ocupada.id,
                }
              );
            }
          }

          const campo =
            await tx.campoFormularioCaptacaoLead.create({
              data: {
                instituicaoId,
                formularioId,

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

                ordem,
                largura,

                ...(opcoes !==
                  undefined
                  ? {
                    opcoes,
                  }
                  : {}),

                ...(validacoes !==
                  undefined
                  ? {
                    validacoes,
                  }
                  : {}),
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

          /*
           * Alterações estruturais
           * no formulário aumentam
           * sua versão.
           */
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

          return {
            campo,
            formulario:
              formularioAtualizado,
          };
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "Campo adicionado ao formulário com sucesso.",

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
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return responderErro(
      error,
      "Erro ao adicionar campo ao formulário de captação:"
    );
  }
}