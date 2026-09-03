import {
  AcaoAuditoriaBiblioteca,
  CondicaoDevolucaoBiblioteca,
  StatusEmprestimoBiblioteca,
  StatusExemplarBiblioteca,
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

type ContextoRota = {
  params: {
    exemplarId: string;
  };
};

function responder(
  corpo: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(
    corpo,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, max-age=0",
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

function obterExemplarId(
  params: ContextoRota["params"]
) {
  const exemplarId =
    Number(params.exemplarId);

  if (
    !Number.isInteger(exemplarId) ||
    exemplarId <= 0
  ) {
    falhar(
      400,
      "Exemplar inválido.",
      "EXEMPLAR_INVALIDO"
    );
  }

  return exemplarId;
}

function textoOpcional(
  valor: unknown,
  limite: number
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (
    typeof valor !== "string"
  ) {
    falhar(
      400,
      "A observação da devolução é inválida.",
      "OBSERVACAO_INVALIDA"
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
      "A observação da devolução excede o limite permitido.",
      "OBSERVACAO_MUITO_LONGA"
    );
  }

  return texto;
}

function obterCondicao(
  valor: unknown
) {
  if (
    typeof valor !== "string"
  ) {
    falhar(
      400,
      "Informe a condição do exemplar na devolução.",
      "CONDICAO_OBRIGATORIA"
    );
  }

  const condicao =
    valor.trim().toUpperCase();

  if (
    !Object.values(
      CondicaoDevolucaoBiblioteca
    ).includes(
      condicao as CondicaoDevolucaoBiblioteca
    )
  ) {
    falhar(
      400,
      "A condição informada para a devolução é inválida.",
      "CONDICAO_INVALIDA"
    );
  }

  return condicao as
    CondicaoDevolucaoBiblioteca;
}

function statusAposDevolucao(
  condicao: CondicaoDevolucaoBiblioteca
) {
  switch (condicao) {
    case CondicaoDevolucaoBiblioteca.DANIFICADO:
      return {
        statusEmprestimo:
          StatusEmprestimoBiblioteca.DANIFICADO,

        statusExemplar:
          StatusExemplarBiblioteca.DANIFICADO,
      };

    case CondicaoDevolucaoBiblioteca.INCOMPLETO:
      return {
        statusEmprestimo:
          StatusEmprestimoBiblioteca.DEVOLVIDO,

        statusExemplar:
          StatusExemplarBiblioteca.INDISPONIVEL,
      };

    case CondicaoDevolucaoBiblioteca.PERDIDO:
      return {
        statusEmprestimo:
          StatusEmprestimoBiblioteca.PERDIDO,

        statusExemplar:
          StatusExemplarBiblioteca.EXTRAVIADO,
      };

    case CondicaoDevolucaoBiblioteca.DESGASTE:
    case CondicaoDevolucaoBiblioteca.NORMAL:
    default:
      return {
        statusEmprestimo:
          StatusEmprestimoBiblioteca.DEVOLVIDO,

        statusExemplar:
          StatusExemplarBiblioteca.DISPONIVEL,
      };
  }
}

function calcularDiasAtraso(
  vencimentoEm: Date,
  devolvidoEm: Date
) {
  if (
    devolvidoEm.getTime() <=
    vencimentoEm.getTime()
  ) {
    return 0;
  }

  const diferenca =
    devolvidoEm.getTime() -
    vencimentoEm.getTime();

  return Math.max(
    1,
    Math.ceil(
      diferenca /
        (24 * 60 * 60 * 1000)
    )
  );
}

function obterIp(
  request: NextRequest
) {
  const encaminhado =
    request.headers.get(
      "x-forwarded-for"
    );

  return (
    encaminhado
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip"
    ) ||
    null
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
   POST
   Registra a devolução de um exemplar emprestado
   ========================================================= */

export async function POST(
  request: NextRequest,
  { params }: ContextoRota
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    if (usuario.impersonacao) {
      falhar(
        403,
        "Não é permitido registrar devoluções durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.emprestimos.gerenciar"
    );

    const exemplarId =
      obterExemplarId(params);

    let corpo: {
      condicao?: unknown;
      observacaoDevolucao?: unknown;
    };

    try {
      corpo =
        await request.json();
    } catch {
      falhar(
        400,
        "Os dados da devolução são inválidos.",
        "JSON_INVALIDO"
      );
    }

    const condicao =
      obterCondicao(
        corpo.condicao
      );

    const observacaoDevolucao =
      textoOpcional(
        corpo.observacaoDevolucao,
        5_000
      );

    const agora =
      new Date();

    const ip =
      obterIp(request);

    const userAgent =
      request.headers.get(
        "user-agent"
      );

    const resultado =
      await prisma.$transaction(
        async (transacao) => {
          /*
           * Trava o exemplar para impedir
           * devolução, baixa ou outra
           * circulação concorrente.
           */
          await transacao.$queryRaw`
            SELECT "id"
            FROM "BibliotecaExemplar"
            WHERE "id" = ${exemplarId}
              AND "instituicaoId" = ${contexto.instituicaoId}
            FOR UPDATE
          `;

          const exemplar =
            await transacao
              .bibliotecaExemplar
              .findFirst({
                where: {
                  id: exemplarId,

                  instituicaoId:
                    contexto.instituicaoId,
                },

                select: {
                  id: true,
                  itemId: true,

                  status: true,

                  codigoInterno:
                    true,

                  numeroTombo:
                    true,

                  baixadoEm: true,
                },
              });

          if (!exemplar) {
            falhar(
              404,
              "Exemplar não encontrado.",
              "EXEMPLAR_NAO_ENCONTRADO"
            );
          }

          if (
            exemplar.baixadoEm ||
            exemplar.status ===
              StatusExemplarBiblioteca.BAIXADO
          ) {
            falhar(
              409,
              "Este exemplar foi baixado do acervo.",
              "EXEMPLAR_BAIXADO"
            );
          }

          /*
           * Localiza o empréstimo ainda
           * aberto para este exemplar.
           */
          const emprestimo =
            await transacao
              .bibliotecaEmprestimo
              .findFirst({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  exemplarId,

                  status: {
                    in: [
                      StatusEmprestimoBiblioteca.ATIVO,
                      StatusEmprestimoBiblioteca.ATRASADO,
                    ],
                  },
                },

                select: {
                  id: true,
                  usuarioId: true,
                  status: true,

                  emprestadoEm: true,
                  vencimentoEm: true,

                  observacaoRetirada:
                    true,
                },

                orderBy: {
                  emprestadoEm:
                    "desc",
                },
              });

          if (!emprestimo) {
            falhar(
              409,
              "Não existe empréstimo em aberto para este exemplar.",
              "EMPRESTIMO_NAO_ENCONTRADO"
            );
          }

          const estados =
            statusAposDevolucao(
              condicao
            );

          const diasAtraso =
            calcularDiasAtraso(
              emprestimo.vencimentoEm,
              agora
            );

            /*
 * Apuração financeira da multa por atraso.
 *
 * A devolução nunca depende da existência
 * de um aluno financeiro. Para usuários que
 * não sejam alunos, a multa pode ser calculada,
 * mas não gera lançamento estudantil.
 */
let valorMultaCalculado:
  number | null = null;

let multaGerada =
  false;

let multaLancamentoFinanceiroId:
  number | null = null;

let diasAtrasoCobrados =
  0;

if (diasAtraso > 0) {
  const configuracaoMulta =
    await transacao
      .bibliotecaConfiguracao
      .findUnique({
        where: {
          instituicaoId:
            contexto.instituicaoId,
        },

        select: {
          cobrarMultaPorAtraso:
            true,

          valorMultaPorDia:
            true,

          diasCarenciaAtraso:
            true,

          limiteMultaPorAtraso:
            true,

          diasVencimentoCobranca:
            true,
        },
      });

  if (
    configuracaoMulta
      ?.cobrarMultaPorAtraso
  ) {
    diasAtrasoCobrados =
      Math.max(
        0,
        diasAtraso -
          configuracaoMulta
            .diasCarenciaAtraso
      );

    const valorMultaPorDia =
      Number(
        configuracaoMulta
          .valorMultaPorDia
      );

    if (
      diasAtrasoCobrados > 0 &&
      Number.isFinite(
        valorMultaPorDia
      ) &&
      valorMultaPorDia > 0
    ) {
      /*
       * O cálculo é feito em centavos
       * para evitar erros de ponto flutuante.
       */
      const valorDiaCentavos =
        Math.round(
          valorMultaPorDia *
            100
        );

      let valorMultaCentavos =
        valorDiaCentavos *
        diasAtrasoCobrados;

      if (
        configuracaoMulta
          .limiteMultaPorAtraso !==
        null
      ) {
        const limiteCentavos =
          Math.round(
            Number(
              configuracaoMulta
                .limiteMultaPorAtraso
            ) * 100
          );

        if (
          Number.isFinite(
            limiteCentavos
          ) &&
          limiteCentavos >= 0
        ) {
          valorMultaCentavos =
            Math.min(
              valorMultaCentavos,
              limiteCentavos
            );
        }
      }

      if (
        valorMultaCentavos > 0
      ) {
        valorMultaCalculado =
          valorMultaCentavos /
          100;

        /*
         * BibliotecaEmprestimo aponta para User,
         * enquanto LancamentoFinanceiro exige Aluno.
         */
        const aluno =
          await transacao
            .aluno
            .findFirst({
              where: {
                userId:
                  emprestimo.usuarioId,

                instituicaoId:
                  contexto.instituicaoId,
              },

              select: {
                id: true,
                nome: true,
              },
            });

        if (aluno) {
          const vencimentoCobranca =
            new Date(agora);

          vencimentoCobranca.setDate(
            vencimentoCobranca.getDate() +
              configuracaoMulta
                .diasVencimentoCobranca
          );

          const lancamento =
            await transacao
              .lancamentoFinanceiro
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  alunoId:
                    aluno.id,

                  tipo:
                    "TAXA",

                  descricao:
                    `Multa por atraso na Biblioteca - empréstimo #${emprestimo.id}`,

                  valorOriginal:
                    valorMultaCalculado,

                  valorFinal:
                    valorMultaCalculado,

                  valorPago:
                    0,

                  descontoValor:
                    0,

                  jurosValor:
                    0,

                  multaValor:
                    0,

                  vencimento:
                    vencimentoCobranca,

                  status:
                    "PENDENTE",

                  observacao:
                    `Gerado automaticamente pela Biblioteca. ` +
                    `Atraso: ${diasAtraso} dia(s). ` +
                    `Carência: ${configuracaoMulta.diasCarenciaAtraso} dia(s). ` +
                    `Dias cobrados: ${diasAtrasoCobrados}.`,
                },

                select: {
                  id: true,
                },
              });

          multaLancamentoFinanceiroId =
            lancamento.id;

          multaGerada =
            true;

          await transacao
            .historicoCobranca
            .create({
              data: {
                instituicaoId:
                  contexto.instituicaoId,

                alunoId:
                  aluno.id,

                alunoNome:
                  aluno.nome,

                lancamentoFinanceiroId:
                  lancamento.id,

                responsavelId:
                  usuario.id,

                canal:
                  "SISTEMA",

                acao:
                  "BIBLIOTECA_MULTA_ATRASO_GERADA",

                observacao:
                  `Multa de biblioteca gerada para o empréstimo #${emprestimo.id}.`,

                metadata: {
                  origem:
                    "BIBLIOTECA",

                  emprestimoId:
                    emprestimo.id,

                  exemplarId:
                    exemplar.id,

                  usuarioEmprestimoId:
                    emprestimo.usuarioId,

                  diasAtraso,

                  diasCarencia:
                    configuracaoMulta
                      .diasCarenciaAtraso,

                  diasAtrasoCobrados,

                  valorMultaPorDia,

                  limiteMulta:
                    configuracaoMulta
                      .limiteMultaPorAtraso !==
                    null
                      ? Number(
                          configuracaoMulta
                            .limiteMultaPorAtraso
                        )
                      : null,

                  valorMultaCalculado,

                  vencimentoCobranca:
                    vencimentoCobranca
                      .toISOString(),
                },
              },
            });
        }
      }
    }
  }
}

          const emprestimoAtualizado =
            await transacao
              .bibliotecaEmprestimo
              .update({
                where: {
                  id:
                    emprestimo.id,
                },

                data: {
                  status:
                    estados.statusEmprestimo,

                  devolvidoEm:
                    agora,

                  devolucaoCondicao:
                    condicao,

                  observacaoDevolucao,

                  diasAtrasoCalculado:
  diasAtraso,

valorMultaCalculado,

multaGerada,

multaLancamentoFinanceiroId,

devolvidoPorId:
  usuario.id,
                },

                select: {
                  id: true,
                  exemplarId: true,
                  usuarioId: true,

                  status: true,

                  emprestadoEm:
                    true,

                  vencimentoEm:
                    true,

                  devolvidoEm:
                    true,

                  devolucaoCondicao:
                    true,

                  observacaoDevolucao:
                    true,

                  diasAtrasoCalculado:
                    true,

                    valorMultaCalculado:
  true,

multaGerada:
  true,

multaLancamentoFinanceiroId:
  true,
                },
              });

          const exemplarAtualizado =
            await transacao
              .bibliotecaExemplar
              .update({
                where: {
                  id:
                    exemplar.id,
                },

                data: {
                  status:
                    estados.statusExemplar,

                  atualizadoPorId:
                    usuario.id,
                },

                select: {
                  id: true,
                  status: true,
                  codigoInterno:
                    true,
                  numeroTombo:
                    true,
                },
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
                  "BibliotecaEmprestimo",

                entidadeId:
                  String(
                    emprestimo.id
                  ),

                acao:
                  AcaoAuditoriaBiblioteca.DEVOLVER,

                descricao:
                  "Devolução de exemplar registrada na Biblioteca Virtual.",

                dadosAnteriores: {
                  emprestimoStatus:
                    emprestimo.status,

                  exemplarStatus:
                    exemplar.status,

                  vencimentoEm:
                    emprestimo.vencimentoEm.toISOString(),
                },

                dadosPosteriores: {
                  emprestimoStatus:
                    estados.statusEmprestimo,

                  exemplarStatus:
                    estados.statusExemplar,

                  devolvidoEm:
                    agora.toISOString(),

                  condicao,

                  diasAtraso,

                  diasAtrasoCobrados,

valorMultaCalculado,

multaGerada,

multaLancamentoFinanceiroId,
                },

                metadados: {
                  origem:
                    "api_admin_biblioteca_exemplar_devolver",

                  itemId:
                    exemplar.itemId,

                  exemplarId:
                    exemplar.id,

                  codigoInterno:
                    exemplar.codigoInterno,

                  numeroTombo:
                    exemplar.numeroTombo,

                  usuarioEmprestimoId:
                    emprestimo.usuarioId,

                    multa: {
  diasAtraso,

  diasAtrasoCobrados,

  valorMultaCalculado,

  multaGerada,

  lancamentoFinanceiroId:
    multaLancamentoFinanceiroId,
},
                },

                ip,
                userAgent,
              },
            });

          return {
  emprestimo:
    emprestimoAtualizado,

  exemplar:
    exemplarAtualizado,

  multa: {
    diasAtraso,

    diasAtrasoCobrados,

    valorMultaCalculado,

    gerada:
      multaGerada,

    lancamentoFinanceiroId:
      multaLancamentoFinanceiroId,
  },
};
        },
        {
          maxWait: 5_000,
          timeout: 10_000,
        }
      );

    return responder({
      ok: true,

      mensagem:
        "Devolução registrada com sucesso.",

      emprestimo:
        resultado.emprestimo,

      exemplar:
        resultado.exemplar,

        multa:
  resultado.multa,
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}