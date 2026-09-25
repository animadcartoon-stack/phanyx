import {
  AcaoAuditoriaBiblioteca,
  TipoDireitoBiblioteca,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
} from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Operacao =
  | "ATUALIZAR"
  | "DESATIVAR"
  | "RESTAURAR";

const TIPOS_DIREITO =
  new Set<TipoDireitoBiblioteca>(
    Object.values(
      TipoDireitoBiblioteca,
    ),
  );

const LICENCA_SELECT = {
  id: true,
  instituicaoId: true,
  itemId: true,

  tipoDireito: true,
  titulo: true,
  titularDireitos: true,
  descricao: true,

  numeroLicenca: true,
  origem: true,
  urlLicenca: true,
  comprovanteUrl: true,

  inicioVigencia: true,
  fimVigencia: true,

  permitirVisualizacao: true,
  permitirDownload: true,
  permitirImpressao: true,
  permitirCopia: true,
  permitirEmprestimo: true,

  acessosSimultaneos: true,
  quantidadeLicencas: true,
  territorio: true,

  ativo: true,
  observacoes: true,

  criadoEm: true,
  atualizadoEm: true,

  item: {
    select: {
      id: true,
      titulo: true,
      tipo: true,
      status: true,
      modalidade: true,
    },
  },

  criadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },

  atualizadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },

  _count: {
    select: {
      exemplares: true,
    },
  },
} as const;

function responder(
  corpo: unknown,
  status = 200,
) {
  return NextResponse.json(
    corpo,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    },
  );
}

function falhar(
  status: number,
  mensagem: string,
  codigo: string,
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo,
  );
}

function responderErro(
  erro: unknown,
) {
  const resposta =
    respostaErroBiblioteca(
      erro,
    );

  return responder(
    resposta.corpo,
    resposta.status,
  );
}

async function lerCorpo(
  request: NextRequest,
) {
  try {
    const corpo =
      await request.json();

    if (
      !corpo ||
      typeof corpo !== "object" ||
      Array.isArray(corpo)
    ) {
      falhar(
        400,
        "O corpo da requisição deve ser um objeto JSON válido.",
        "CORPO_INVALIDO",
      );
    }

    return corpo as Record<
      string,
      unknown
    >;
  } catch (erro) {
    if (
      erro instanceof
      ErroBiblioteca
    ) {
      throw erro;
    }

    falhar(
      400,
      "O corpo da requisição contém um JSON inválido.",
      "JSON_INVALIDO",
    );
  }
}

function inteiroPositivo(
  valor: unknown,
  campo: string,
) {
  const numero =
    Number(valor);

  if (
    !Number.isInteger(
      numero,
    ) ||
    numero <= 0
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser um número inteiro positivo.`,
      "CAMPO_INVALIDO",
    );
  }

  return numero;
}

function inteiroPositivoOpcional(
  valor: unknown,
  campo: string,
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  return inteiroPositivo(
    valor,
    campo,
  );
}

function textoOpcional(
  valor: unknown,
  campo: string,
  limite: number,
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (
    typeof valor !==
    "string"
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser um texto.`,
      "CAMPO_INVALIDO",
    );
  }

  const texto =
    valor.trim();

  if (!texto) {
    return null;
  }

  if (
    texto.length >
    limite
  ) {
    falhar(
      400,
      `O campo ${campo} ultrapassa o limite permitido.`,
      "CAMPO_MUITO_LONGO",
    );
  }

  return texto;
}

function textoObrigatorio(
  valor: unknown,
  campo: string,
  limite: number,
) {
  const texto =
    textoOpcional(
      valor,
      campo,
      limite,
    );

  if (!texto) {
    falhar(
      400,
      `O campo ${campo} é obrigatório.`,
      "CAMPO_OBRIGATORIO",
    );
  }

  return texto;
}

function booleanoObrigatorio(
  valor: unknown,
  campo: string,
) {
  if (
    typeof valor !==
    "boolean"
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser verdadeiro ou falso.`,
      "CAMPO_BOOLEANO_INVALIDO",
    );
  }

  return valor;
}

function dataOpcional(
  valor: unknown,
  campo: string,
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (
    typeof valor !==
    "string"
  ) {
    falhar(
      400,
      `O campo ${campo} contém uma data inválida.`,
      "DATA_INVALIDA",
    );
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    falhar(
      400,
      `O campo ${campo} contém uma data inválida.`,
      "DATA_INVALIDA",
    );
  }

  return data;
}

function tipoDireito(
  valor: unknown,
) {
  const normalizado =
    String(
      valor || "",
    )
      .trim()
      .toUpperCase() as TipoDireitoBiblioteca;

  if (
    !TIPOS_DIREITO.has(
      normalizado,
    )
  ) {
    falhar(
      400,
      "O tipo de direito informado é inválido.",
      "TIPO_DIREITO_INVALIDO",
    );
  }

  return normalizado;
}

function obterIp(
  request: NextRequest,
) {
  const encaminhado =
    request.headers.get(
      "x-forwarded-for",
    );

  const candidato =
    encaminhado
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip",
    ) ||
    null;

  return candidato
    ? candidato.slice(
        0,
        255,
      )
    : null;
}

function obterUserAgent(
  request: NextRequest,
) {
  const userAgent =
    request.headers.get(
      "user-agent",
    );

  return userAgent
    ? userAgent.slice(
        0,
        4000,
      )
    : null;
}

function snapshotLicenca(
  licenca: {
    itemId: number;
    tipoDireito: TipoDireitoBiblioteca;
    titulo: string | null;
    titularDireitos: string | null;
    numeroLicenca: string | null;
    origem: string | null;
    inicioVigencia: Date | null;
    fimVigencia: Date | null;
    permitirVisualizacao: boolean;
    permitirDownload: boolean;
    permitirImpressao: boolean;
    permitirCopia: boolean;
    permitirEmprestimo: boolean;
    acessosSimultaneos: number | null;
    quantidadeLicencas: number | null;
    territorio: string | null;
    ativo: boolean;
  },
) {
  return {
    itemId:
      licenca.itemId,

    tipoDireito:
      licenca.tipoDireito,

    titulo:
      licenca.titulo,

    titularDireitos:
      licenca.titularDireitos,

    numeroLicenca:
      licenca.numeroLicenca,

    origem:
      licenca.origem,

    inicioVigencia:
      licenca.inicioVigencia
        ?.toISOString() ??
      null,

    fimVigencia:
      licenca.fimVigencia
        ?.toISOString() ??
      null,

    permitirVisualizacao:
      licenca.permitirVisualizacao,

    permitirDownload:
      licenca.permitirDownload,

    permitirImpressao:
      licenca.permitirImpressao,

    permitirCopia:
      licenca.permitirCopia,

    permitirEmprestimo:
      licenca.permitirEmprestimo,

    acessosSimultaneos:
      licenca.acessosSimultaneos,

    quantidadeLicencas:
      licenca.quantidadeLicencas,

    territorio:
      licenca.territorio,

    ativo:
      licenca.ativo,
  };
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: {
      licencaId: string;
    };
  },
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO",
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario,
      );

    if (
      usuario.impersonacao
    ) {
      falhar(
        403,
        "Não é permitido alterar licenças durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.licencas.gerenciar",
    );

    const licencaId =
      inteiroPositivo(
        context.params.licencaId,
        "licencaId",
      );

    const corpo =
      await lerCorpo(
        request,
      );

    const operacao =
      String(
        corpo.operacao || "",
      )
        .trim()
        .toUpperCase() as Operacao;

    if (
      ![
        "ATUALIZAR",
        "DESATIVAR",
        "RESTAURAR",
      ].includes(
        operacao,
      )
    ) {
      falhar(
        400,
        "A operação informada é inválida.",
        "OPERACAO_INVALIDA",
      );
    }

    const ip =
      obterIp(
        request,
      );

    const userAgent =
      obterUserAgent(
        request,
      );

    const resultado =
      await prisma.$transaction(
        async (
          transacao,
        ) => {
          const anterior =
            await transacao
              .bibliotecaLicenca
              .findFirst({
                where: {
                  id:
                    licencaId,

                  instituicaoId:
                    contexto.instituicaoId,
                },

                select:
                  LICENCA_SELECT,
              });

          if (!anterior) {
            falhar(
              404,
              "Licença da Biblioteca não encontrada.",
              "LICENCA_NAO_ENCONTRADA",
            );
          }

          if (
            operacao ===
            "ATUALIZAR"
          ) {
            if (
              !anterior.ativo
            ) {
              falhar(
                409,
                "Não é possível editar uma licença inativa. Restaure-a primeiro.",
                "LICENCA_INATIVA",
              );
            }

            const itemId =
              inteiroPositivo(
                corpo.itemId,
                "itemId",
              );

            const inicioVigencia =
              dataOpcional(
                corpo.inicioVigencia,
                "inicioVigencia",
              );

            const fimVigencia =
              dataOpcional(
                corpo.fimVigencia,
                "fimVigencia",
              );

            if (
              inicioVigencia &&
              fimVigencia &&
              inicioVigencia >
                fimVigencia
            ) {
              falhar(
                400,
                "A data final de vigência não pode ser anterior à data inicial.",
                "VIGENCIA_INVALIDA",
              );
            }

            const item =
              await transacao
                .bibliotecaItem
                .findFirst({
                  where: {
                    id:
                      itemId,

                    instituicaoId:
                      contexto.instituicaoId,
                  },

                  select: {
                    id: true,
                    titulo: true,
                  },
                });

            if (!item) {
              falhar(
                404,
                "Item do acervo não encontrado nesta instituição.",
                "ITEM_NAO_ENCONTRADO",
              );
            }

            const atualizado =
              await transacao
                .bibliotecaLicenca
                .update({
                  where: {
                    id:
                      anterior.id,
                  },

                  data: {
                    itemId:
                      item.id,

                    tipoDireito:
                      tipoDireito(
                        corpo.tipoDireito,
                      ),

                    titulo:
                      textoOpcional(
                        corpo.titulo,
                        "titulo",
                        200,
                      ),

                    titularDireitos:
                      textoOpcional(
                        corpo.titularDireitos,
                        "titularDireitos",
                        200,
                      ),

                    descricao:
                      textoOpcional(
                        corpo.descricao,
                        "descricao",
                        10000,
                      ),

                    numeroLicenca:
                      textoOpcional(
                        corpo.numeroLicenca,
                        "numeroLicenca",
                        200,
                      ),

                    origem:
                      textoOpcional(
                        corpo.origem,
                        "origem",
                        300,
                      ),

                    urlLicenca:
                      textoOpcional(
                        corpo.urlLicenca,
                        "urlLicenca",
                        2000,
                      ),

                    comprovanteUrl:
                      textoOpcional(
                        corpo.comprovanteUrl,
                        "comprovanteUrl",
                        2000,
                      ),

                    inicioVigencia,
                    fimVigencia,

                    permitirVisualizacao:
                      booleanoObrigatorio(
                        corpo.permitirVisualizacao,
                        "permitirVisualizacao",
                      ),

                    permitirDownload:
                      booleanoObrigatorio(
                        corpo.permitirDownload,
                        "permitirDownload",
                      ),

                    permitirImpressao:
                      booleanoObrigatorio(
                        corpo.permitirImpressao,
                        "permitirImpressao",
                      ),

                    permitirCopia:
                      booleanoObrigatorio(
                        corpo.permitirCopia,
                        "permitirCopia",
                      ),

                    permitirEmprestimo:
                      booleanoObrigatorio(
                        corpo.permitirEmprestimo,
                        "permitirEmprestimo",
                      ),

                    acessosSimultaneos:
                      inteiroPositivoOpcional(
                        corpo.acessosSimultaneos,
                        "acessosSimultaneos",
                      ),

                    quantidadeLicencas:
                      inteiroPositivoOpcional(
                        corpo.quantidadeLicencas,
                        "quantidadeLicencas",
                      ),

                    territorio:
                      textoOpcional(
                        corpo.territorio,
                        "territorio",
                        200,
                      ),

                    observacoes:
                      textoOpcional(
                        corpo.observacoes,
                        "observacoes",
                        10000,
                      ),

                    atualizadoPorId:
                      usuario.id,
                  },

                  select:
                    LICENCA_SELECT,
                });

            await transacao
              .bibliotecaAuditoria
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  usuarioId:
                    usuario.id,

                  entidade:
                    "BibliotecaLicenca",

                  entidadeId:
                    String(
                      anterior.id,
                    ),

                  acao:
                    AcaoAuditoriaBiblioteca
                      .ATUALIZAR,

                  descricao:
                    "Licença da Biblioteca atualizada.",

                  dadosAnteriores:
                    snapshotLicenca(
                      anterior,
                    ),

                  dadosPosteriores:
                    snapshotLicenca(
                      atualizado,
                    ),

                  metadados: {
                    origem:
                      "admin.biblioteca.licencas",

                    metodo:
                      "PATCH",

                    operacao,

                    itemId:
                      item.id,

                    itemTitulo:
                      item.titulo,
                  },

                  ip,
                  userAgent,
                },
              });

            return atualizado;
          }

          if (
            operacao ===
            "DESATIVAR"
          ) {
            if (
              !anterior.ativo
            ) {
              falhar(
                409,
                "A licença já está inativa.",
                "LICENCA_JA_INATIVA",
              );
            }

            const motivo =
              textoObrigatorio(
                corpo.motivo,
                "motivo",
                1000,
              );

            const inativa =
              await transacao
                .bibliotecaLicenca
                .update({
                  where: {
                    id:
                      anterior.id,
                  },

                  data: {
                    ativo:
                      false,

                    atualizadoPorId:
                      usuario.id,
                  },

                  select:
                    LICENCA_SELECT,
                });

            await transacao
              .bibliotecaAuditoria
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  usuarioId:
                    usuario.id,

                  entidade:
                    "BibliotecaLicenca",

                  entidadeId:
                    String(
                      anterior.id,
                    ),

                  acao:
                    AcaoAuditoriaBiblioteca
                      .ARQUIVAR,

                  descricao:
                    "Licença da Biblioteca desativada.",

                  dadosAnteriores:
                    snapshotLicenca(
                      anterior,
                    ),

                  dadosPosteriores: {
                    ...snapshotLicenca(
                      inativa,
                    ),

                    motivoDesativacao:
                      motivo,
                  },

                  metadados: {
                    origem:
                      "admin.biblioteca.licencas",

                    metodo:
                      "PATCH",

                    operacao,

                    motivo,
                  },

                  ip,
                  userAgent,
                },
              });

            return inativa;
          }

          if (
            anterior.ativo
          ) {
            falhar(
              409,
              "A licença já está ativa.",
              "LICENCA_JA_ATIVA",
            );
          }

          const restaurada =
            await transacao
              .bibliotecaLicenca
              .update({
                where: {
                  id:
                    anterior.id,
                },

                data: {
                  ativo:
                    true,

                  atualizadoPorId:
                    usuario.id,
                },

                select:
                  LICENCA_SELECT,
              });

          await transacao
            .bibliotecaAuditoria
            .create({
              data: {
                instituicaoId:
                  contexto.instituicaoId,

                usuarioId:
                  usuario.id,

                entidade:
                  "BibliotecaLicenca",

                entidadeId:
                  String(
                    anterior.id,
                  ),

                acao:
                  AcaoAuditoriaBiblioteca
                    .RESTAURAR,

                descricao:
                  "Licença da Biblioteca restaurada.",

                dadosAnteriores:
                  snapshotLicenca(
                    anterior,
                  ),

                dadosPosteriores:
                  snapshotLicenca(
                    restaurada,
                  ),

                metadados: {
                  origem:
                    "admin.biblioteca.licencas",

                  metodo:
                    "PATCH",

                  operacao:
                    "RESTAURAR",
                },

                ip,
                userAgent,
              },
            });

          return restaurada;
        },
      );

    return responder({
      success: true,

      message:
        operacao ===
        "ATUALIZAR"
          ? "Licença atualizada com sucesso."
          : operacao ===
              "DESATIVAR"
            ? "Licença desativada com sucesso."
            : "Licença restaurada com sucesso.",

      licenca:
        resultado,
    });
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}
