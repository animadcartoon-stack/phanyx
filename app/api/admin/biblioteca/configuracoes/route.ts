import {
  AcaoAuditoriaBiblioteca,
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
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

const CONFIGURACAO_SELECT = {
  id: true,

  nomeExibicao: true,
  descricao: true,

  permitirDownload: true,
  permitirAvaliacao: true,
  permitirFavoritos: true,
  permitirReserva: true,
  permitirRenovacao: true,
  permitirSugestaoAquisicao: true,

  diasEmprestimoPadrao: true,
  diasReservaPadrao: true,
  limiteRenovacoes: true,
  limiteEmprestimos: true,

  notificarVencimento: true,
  diasAvisoAntesVencimento: true,
  bloquearAlunoComPendencia: true,

  cobrarMultaPorAtraso: true,
  valorMultaPorDia: true,
  diasCarenciaAtraso: true,
  limiteMultaPorAtraso: true,
  diasVencimentoCobranca: true,

  atualizadoEm: true,
} as const;

type DecimalSerializavel = {
  toString(): string;
};

type ConfiguracaoSelecionada = {
  id: number;

  nomeExibicao: string;
  descricao: string | null;

  permitirDownload: boolean;
  permitirAvaliacao: boolean;
  permitirFavoritos: boolean;
  permitirReserva: boolean;
  permitirRenovacao: boolean;
  permitirSugestaoAquisicao: boolean;

  diasEmprestimoPadrao: number;
  diasReservaPadrao: number;
  limiteRenovacoes: number;
  limiteEmprestimos: number;

  notificarVencimento: boolean;
  diasAvisoAntesVencimento: number;
  bloquearAlunoComPendencia: boolean;

  cobrarMultaPorAtraso: boolean;
  valorMultaPorDia: DecimalSerializavel;
  diasCarenciaAtraso: number;
  limiteMultaPorAtraso:
    | DecimalSerializavel
    | null;
  diasVencimentoCobranca: number;

  atualizadoEm: Date;
};

type CorpoConfiguracao = Record<
  string,
  unknown
>;

const CONFIGURACAO_PADRAO = {
  id: null,

  nomeExibicao: "Biblioteca Virtual",
  descricao: null,

  permitirDownload: false,
  permitirAvaliacao: true,
  permitirFavoritos: true,
  permitirReserva: true,
  permitirRenovacao: true,
  permitirSugestaoAquisicao: true,

  diasEmprestimoPadrao: 7,
  diasReservaPadrao: 2,
  limiteRenovacoes: 1,
  limiteEmprestimos: 3,

  notificarVencimento: true,
  diasAvisoAntesVencimento: 2,
  bloquearAlunoComPendencia: false,

  cobrarMultaPorAtraso: false,
  valorMultaPorDia: "0.00",
  diasCarenciaAtraso: 0,
  limiteMultaPorAtraso: null,
  diasVencimentoCobranca: 7,

  atualizadoEm: null,
};

/* =========================================================
   RESPOSTAS / ERROS
   ========================================================= */

function responder(
  corpo: unknown,
  status = 200
) {
  return NextResponse.json(
    corpo,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    }
  );
}

function falhar(
  status: number,
  mensagem: string,
  codigo: string
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo
  );
}

function responderErro(
  erro: unknown
) {
  const resposta =
    respostaErroBiblioteca(
      erro
    );

  return responder(
    resposta.corpo,
    resposta.status
  );
}

/* =========================================================
   VALIDAÇÃO
   ========================================================= */

async function lerCorpo(
  request: NextRequest
): Promise<CorpoConfiguracao> {
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
        "CORPO_INVALIDO"
      );
    }

    return corpo as CorpoConfiguracao;
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
      "JSON_INVALIDO"
    );
  }
}

function textoObrigatorio(
  valor: unknown,
  campo: string,
  limite: number
) {
  if (
    typeof valor !== "string"
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser um texto.`,
      "CAMPO_INVALIDO"
    );
  }

  const texto =
    valor.trim();

  if (!texto) {
    falhar(
      400,
      `O campo ${campo} é obrigatório.`,
      "CAMPO_OBRIGATORIO"
    );
  }

  if (
    texto.length > limite
  ) {
    falhar(
      400,
      `O campo ${campo} ultrapassa o limite permitido.`,
      "CAMPO_MUITO_LONGO"
    );
  }

  return texto;
}

function textoOpcional(
  valor: unknown,
  campo: string,
  limite: number
): string | null {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  if (
    typeof valor !== "string"
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser um texto.`,
      "CAMPO_INVALIDO"
    );
  }

  const texto =
    valor.trim();

  if (!texto) {
    return null;
  }

  if (
    texto.length > limite
  ) {
    falhar(
      400,
      `O campo ${campo} ultrapassa o limite permitido.`,
      "CAMPO_MUITO_LONGO"
    );
  }

  return texto;
}

function booleanoObrigatorio(
  valor: unknown,
  campo: string
) {
  if (
    typeof valor !== "boolean"
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser verdadeiro ou falso.`,
      "CAMPO_BOOLEANO_INVALIDO"
    );
  }

  return valor;
}

function inteiroEntre(
  valor: unknown,
  campo: string,
  minimo: number,
  maximo: number
) {
  const numero =
    typeof valor === "string" &&
    valor.trim()
      ? Number(valor)
      : valor;

  if (
    typeof numero !== "number" ||
    !Number.isInteger(numero) ||
    numero < minimo ||
    numero > maximo
  ) {
    falhar(
      400,
      `O campo ${campo} deve ser um número inteiro entre ${minimo} e ${maximo}.`,
      "CAMPO_INTEIRO_INVALIDO"
    );
  }

  return numero;
}

function decimalEntre(
  valor: unknown,
  campo: string,
  minimo: number,
  maximo: number,
  permitirNulo = false
): number | null {
  if (
    permitirNulo &&
    (
      valor === null ||
      valor === undefined ||
      valor === ""
    )
  ) {
    return null;
  }

  let numero: number;

  if (
    typeof valor === "number"
  ) {
    numero = valor;
  } else if (
    typeof valor === "string" &&
    valor.trim()
  ) {
    numero = Number(
      valor
        .trim()
        .replace(",", ".")
    );
  } else {
    falhar(
      400,
      `O campo ${campo} deve ser um valor numérico válido.`,
      "CAMPO_DECIMAL_INVALIDO"
    );
  }

  if (
    !Number.isFinite(numero) ||
    numero < minimo ||
    numero > maximo
  ) {
    falhar(
      400,
      `O campo ${campo} deve estar entre ${minimo} e ${maximo}.`,
      "CAMPO_DECIMAL_FORA_DO_LIMITE"
    );
  }

  const arredondado =
    Math.round(
      numero * 100
    ) / 100;

  if (
    Math.abs(
      numero - arredondado
    ) > 0.0000001
  ) {
    falhar(
      400,
      `O campo ${campo} permite no máximo duas casas decimais.`,
      "CAMPO_DECIMAL_CASAS_INVALIDAS"
    );
  }

  return arredondado;
}

/* =========================================================
   NORMALIZAÇÃO
   ========================================================= */

function normalizarCorpo(
  corpo: CorpoConfiguracao
) {
  const dados = {
    nomeExibicao:
      textoObrigatorio(
        corpo.nomeExibicao,
        "nomeExibicao",
        150
      ),

    descricao:
      textoOpcional(
        corpo.descricao,
        "descricao",
        3000
      ),

    permitirDownload:
      booleanoObrigatorio(
        corpo.permitirDownload,
        "permitirDownload"
      ),

    permitirAvaliacao:
      booleanoObrigatorio(
        corpo.permitirAvaliacao,
        "permitirAvaliacao"
      ),

    permitirFavoritos:
      booleanoObrigatorio(
        corpo.permitirFavoritos,
        "permitirFavoritos"
      ),

    permitirReserva:
      booleanoObrigatorio(
        corpo.permitirReserva,
        "permitirReserva"
      ),

    permitirRenovacao:
      booleanoObrigatorio(
        corpo.permitirRenovacao,
        "permitirRenovacao"
      ),

    permitirSugestaoAquisicao:
      booleanoObrigatorio(
        corpo.permitirSugestaoAquisicao,
        "permitirSugestaoAquisicao"
      ),

    diasEmprestimoPadrao:
      inteiroEntre(
        corpo.diasEmprestimoPadrao,
        "diasEmprestimoPadrao",
        1,
        365
      ),

    diasReservaPadrao:
      inteiroEntre(
        corpo.diasReservaPadrao,
        "diasReservaPadrao",
        0,
        365
      ),

    limiteRenovacoes:
      inteiroEntre(
        corpo.limiteRenovacoes,
        "limiteRenovacoes",
        0,
        50
      ),

    limiteEmprestimos:
      inteiroEntre(
        corpo.limiteEmprestimos,
        "limiteEmprestimos",
        1,
        100
      ),

    notificarVencimento:
      booleanoObrigatorio(
        corpo.notificarVencimento,
        "notificarVencimento"
      ),

    diasAvisoAntesVencimento:
      inteiroEntre(
        corpo.diasAvisoAntesVencimento,
        "diasAvisoAntesVencimento",
        0,
        365
      ),

    bloquearAlunoComPendencia:
      booleanoObrigatorio(
        corpo.bloquearAlunoComPendencia,
        "bloquearAlunoComPendencia"
      ),

    cobrarMultaPorAtraso:
      booleanoObrigatorio(
        corpo.cobrarMultaPorAtraso,
        "cobrarMultaPorAtraso"
      ),

    valorMultaPorDia:
      decimalEntre(
        corpo.valorMultaPorDia,
        "valorMultaPorDia",
        0,
        99999.99
      ) as number,

    diasCarenciaAtraso:
      inteiroEntre(
        corpo.diasCarenciaAtraso,
        "diasCarenciaAtraso",
        0,
        365
      ),

    limiteMultaPorAtraso:
      decimalEntre(
        corpo.limiteMultaPorAtraso,
        "limiteMultaPorAtraso",
        0,
        999999.99,
        true
      ),

    diasVencimentoCobranca:
      inteiroEntre(
        corpo.diasVencimentoCobranca,
        "diasVencimentoCobranca",
        0,
        365
      ),
  };

  if (
    dados.cobrarMultaPorAtraso &&
    dados.valorMultaPorDia <= 0
  ) {
    falhar(
      400,
      "Para cobrar multa por atraso, informe um valor de multa por dia maior que zero.",
      "VALOR_MULTA_OBRIGATORIO"
    );
  }

  if (
    dados.cobrarMultaPorAtraso &&
    dados.limiteMultaPorAtraso !== null &&
    dados.limiteMultaPorAtraso <
      dados.valorMultaPorDia
  ) {
    falhar(
      400,
      "O limite máximo da multa não pode ser menor que o valor da multa por dia.",
      "LIMITE_MULTA_INVALIDO"
    );
  }

  return dados;
}

/* =========================================================
   SERIALIZAÇÃO
   ========================================================= */

function serializarConfiguracao(
  configuracao: ConfiguracaoSelecionada
) {
  return {
    id:
      configuracao.id,

    nomeExibicao:
      configuracao.nomeExibicao,

    descricao:
      configuracao.descricao,

    permitirDownload:
      configuracao.permitirDownload,

    permitirAvaliacao:
      configuracao.permitirAvaliacao,

    permitirFavoritos:
      configuracao.permitirFavoritos,

    permitirReserva:
      configuracao.permitirReserva,

    permitirRenovacao:
      configuracao.permitirRenovacao,

    permitirSugestaoAquisicao:
      configuracao.permitirSugestaoAquisicao,

    diasEmprestimoPadrao:
      configuracao.diasEmprestimoPadrao,

    diasReservaPadrao:
      configuracao.diasReservaPadrao,

    limiteRenovacoes:
      configuracao.limiteRenovacoes,

    limiteEmprestimos:
      configuracao.limiteEmprestimos,

    notificarVencimento:
      configuracao.notificarVencimento,

    diasAvisoAntesVencimento:
      configuracao.diasAvisoAntesVencimento,

    bloquearAlunoComPendencia:
      configuracao.bloquearAlunoComPendencia,

    cobrarMultaPorAtraso:
      configuracao.cobrarMultaPorAtraso,

    valorMultaPorDia:
      configuracao
        .valorMultaPorDia
        .toString(),

    diasCarenciaAtraso:
      configuracao.diasCarenciaAtraso,

    limiteMultaPorAtraso:
      configuracao
        .limiteMultaPorAtraso
        ?.toString() ?? null,

    diasVencimentoCobranca:
      configuracao.diasVencimentoCobranca,

    atualizadoEm:
      configuracao
        .atualizadoEm
        .toISOString(),
  };
}

/* =========================================================
   AUDITORIA
   ========================================================= */

function obterIp(
  request: NextRequest
) {
  const encaminhado =
    request.headers.get(
      "x-forwarded-for"
    );

  const candidato =
    encaminhado
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip"
    ) ||
    null;

  return candidato
    ? candidato.slice(
        0,
        255
      )
    : null;
}

function obterUserAgent(
  request: NextRequest
) {
  const userAgent =
    request.headers.get(
      "user-agent"
    );

  return userAgent
    ? userAgent.slice(
        0,
        4000
      )
    : null;
}

/* =========================================================
   GET
   Lê as configurações da Biblioteca
   ========================================================= */

export async function GET() {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      throw new ErroBiblioteca(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.configuracoes.gerenciar"
    );

    const configuracao =
      await prisma
        .bibliotecaConfiguracao
        .findUnique({
          where: {
            instituicaoId:
              contexto.instituicaoId,
          },
          select:
            CONFIGURACAO_SELECT,
        });

    return responder({
      success: true,

      configuracao:
        configuracao
          ? serializarConfiguracao(
              configuracao
            )
          : CONFIGURACAO_PADRAO,
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}

/* =========================================================
   PUT
   Salva as configurações da Biblioteca
   ========================================================= */

export async function PUT(
  request: NextRequest
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      throw new ErroBiblioteca(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    if (
      usuario.impersonacao
    ) {
      falhar(
        403,
        "Não é permitido alterar as configurações da Biblioteca durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.configuracoes.gerenciar"
    );

    const corpo =
      await lerCorpo(
        request
      );

    const dados =
      normalizarCorpo(
        corpo
      );

    const configuracao =
      await prisma.$transaction(
        async (
          transacao
        ) => {
          const anterior =
            await transacao
              .bibliotecaConfiguracao
              .findUnique({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,
                },
                select:
                  CONFIGURACAO_SELECT,
              });

          const salva =
            await transacao
              .bibliotecaConfiguracao
              .upsert({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,
                },

                create: {
                  instituicaoId:
                    contexto.instituicaoId,

                  ...dados,

                  atualizadoPorId:
                    usuario.id,
                },

                update: {
                  ...dados,

                  atualizadoPorId:
                    usuario.id,
                },

                select:
                  CONFIGURACAO_SELECT,
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
                  "BibliotecaConfiguracao",

                entidadeId:
                  String(
                    salva.id
                  ),

                acao:
                  AcaoAuditoriaBiblioteca
                    .CONFIGURAR,

                descricao:
                  "Configurações da Biblioteca atualizadas.",

                ...(anterior
                  ? {
                      dadosAnteriores:
                        serializarConfiguracao(
                          anterior
                        ),
                    }
                  : {}),

                dadosPosteriores:
                  serializarConfiguracao(
                    salva
                  ),

                metadados: {
                  origem:
                    "admin.biblioteca.configuracoes",
                  metodo:
                    "PUT",
                },

                ip:
                  obterIp(
                    request
                  ),

                userAgent:
                  obterUserAgent(
                    request
                  ),
              },
            });

          return salva;
        }
      );

    return responder({
      success: true,

      message:
        "Configurações da Biblioteca salvas com sucesso.",

      configuracao:
        serializarConfiguracao(
          configuracao
        ),
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}