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
  isAdminLike,
} from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function booleanoOpcional(
  valor: unknown,
  padrao: boolean,
  campo: string,
) {
  if (
    valor === undefined ||
    valor === null
  ) {
    return padrao;
  }

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

export async function GET() {
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

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.licencas.ver",
    );

    const [
      licencas,
      itens,
    ] =
      await prisma.$transaction([
        prisma
          .bibliotecaLicenca
          .findMany({
            where: {
              instituicaoId:
                contexto.instituicaoId,
            },

            orderBy: [
              {
                ativo:
                  "desc",
              },
              {
                fimVigencia:
                  "asc",
              },
              {
                criadoEm:
                  "desc",
              },
            ],

            select:
              LICENCA_SELECT,
          }),

        prisma
          .bibliotecaItem
          .findMany({
            where: {
              instituicaoId:
                contexto.instituicaoId,
            },

            orderBy: {
              titulo:
                "asc",
            },

            select: {
              id: true,
              titulo: true,
              tipo: true,
              status: true,
              modalidade: true,

              _count: {
                select: {
                  licencas:
                    true,
                },
              },
            },
          }),
      ]);

    const agora =
      new Date();

    const ativas =
      licencas.filter(
        (item) =>
          item.ativo &&
          (
            !item.inicioVigencia ||
            item.inicioVigencia <=
              agora
          ) &&
          (
            !item.fimVigencia ||
            item.fimVigencia >=
              agora
          ),
      ).length;

    const vencidas =
      licencas.filter(
        (item) =>
          Boolean(
            item.fimVigencia &&
            item.fimVigencia <
              agora,
          ),
      ).length;

    const futuras =
      licencas.filter(
        (item) =>
          Boolean(
            item.inicioVigencia &&
            item.inicioVigencia >
              agora,
          ),
      ).length;

    const podeGerenciar =
      usuario.isMasterAdmin ||
      isAdminLike(
        usuario.role,
      ) ||
      usuario.permissoes.includes(
        "biblioteca.licencas.gerenciar",
      ) ||
      contexto.operador
        ?.podeGerenciarLicenca ===
        true;

    return responder({
      success: true,

      acesso: {
        podeGerenciar,
      },

      resumo: {
        total:
          licencas.length,

        ativas,
        vencidas,
        futuras,

        inativas:
          licencas.filter(
            (item) =>
              !item.ativo,
          ).length,
      },

      tiposDireito:
        Object.values(
          TipoDireitoBiblioteca,
        ),

      licencas,
      itens,
    });
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}

export async function POST(
  request: NextRequest,
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
        "Não é permitido cadastrar licenças durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.licencas.gerenciar",
    );

    const corpo =
      await lerCorpo(
        request,
      );

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

    const dados = {
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
        booleanoOpcional(
          corpo.permitirVisualizacao,
          true,
          "permitirVisualizacao",
        ),

      permitirDownload:
        booleanoOpcional(
          corpo.permitirDownload,
          false,
          "permitirDownload",
        ),

      permitirImpressao:
        booleanoOpcional(
          corpo.permitirImpressao,
          false,
          "permitirImpressao",
        ),

      permitirCopia:
        booleanoOpcional(
          corpo.permitirCopia,
          false,
          "permitirCopia",
        ),

      permitirEmprestimo:
        booleanoOpcional(
          corpo.permitirEmprestimo,
          true,
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

      ativo:
        booleanoOpcional(
          corpo.ativo,
          true,
          "ativo",
        ),

      observacoes:
        textoOpcional(
          corpo.observacoes,
          "observacoes",
          10000,
        ),
    };

    const ip =
      obterIp(
        request,
      );

    const userAgent =
      obterUserAgent(
        request,
      );

    const licenca =
      await prisma.$transaction(
        async (
          transacao,
        ) => {
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
                  tipo: true,
                  status: true,
                },
              });

          if (!item) {
            falhar(
              404,
              "Item do acervo não encontrado nesta instituição.",
              "ITEM_NAO_ENCONTRADO",
            );
          }

          const criada =
            await transacao
              .bibliotecaLicenca
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  itemId:
                    item.id,

                  ...dados,

                  criadoPorId:
                    usuario.id,

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
                    criada.id,
                  ),

                acao:
                  AcaoAuditoriaBiblioteca
                    .CRIAR,

                descricao:
                  "Licença da Biblioteca cadastrada.",

                dadosPosteriores:
                  snapshotLicenca(
                    criada,
                  ),

                metadados: {
                  origem:
                    "admin.biblioteca.licencas",

                  metodo:
                    "POST",

                  itemId:
                    item.id,

                  itemTitulo:
                    item.titulo,
                },

                ip,
                userAgent,
              },
            });

          return criada;
        },
      );

    return responder(
      {
        success: true,

        message:
          "Licença cadastrada com sucesso.",

        licenca,
      },
      201,
    );
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}
