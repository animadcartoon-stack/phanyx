import {
  AcaoAuditoriaBiblioteca,
  Prisma,
  ResultadoManutencaoExemplarBiblioteca,
  StatusExemplarBiblioteca,
  StatusManutencaoExemplarBiblioteca,
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
    manutencaoId: string;
  };
};

function responder(
  corpo: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control":
        "no-store, max-age=0",
    },
  });
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

function obterManutencaoId(
  params: ContextoRota["params"]
) {
  const manutencaoId =
    Number(params.manutencaoId);

  if (
    !Number.isInteger(manutencaoId) ||
    manutencaoId <= 0
  ) {
    falhar(
      400,
      "Manutenção inválida.",
      "MANUTENCAO_INVALIDA"
    );
  }

  return manutencaoId;
}

function obterResultado(
  valor: unknown
) {
  if (typeof valor !== "string") {
    falhar(
      400,
      "Informe o resultado da manutenção.",
      "RESULTADO_OBRIGATORIO"
    );
  }

  const resultado =
    valor.trim().toUpperCase();

  if (
    !Object.values(
      ResultadoManutencaoExemplarBiblioteca
    ).includes(
      resultado as ResultadoManutencaoExemplarBiblioteca
    )
  ) {
    falhar(
      400,
      "O resultado da manutenção é inválido.",
      "RESULTADO_INVALIDO"
    );
  }

  return resultado as
    ResultadoManutencaoExemplarBiblioteca;
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

  if (typeof valor !== "string") {
    falhar(
      400,
      "A observação da conclusão é inválida.",
      "OBSERVACAO_INVALIDA"
    );
  }

  const texto = valor.trim();

  if (!texto) {
    return null;
  }

  if (texto.length > limite) {
    falhar(
      400,
      "A observação da conclusão excede o limite permitido.",
      "OBSERVACAO_MUITO_LONGA"
    );
  }

  return texto;
}

function valorMonetarioOpcional(
  valor: unknown
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (
    typeof valor !== "string" &&
    typeof valor !== "number"
  ) {
    falhar(
      400,
      "O custo final é inválido.",
      "CUSTO_FINAL_INVALIDO"
    );
  }

  const texto = String(valor).trim();

  const normalizado = texto.includes(",")
    ? texto
        .replace(/\./g, "")
        .replace(",", ".")
    : texto;

  if (
    !/^\d{1,10}(\.\d{1,2})?$/.test(
      normalizado
    )
  ) {
    falhar(
      400,
      "O custo final é inválido.",
      "CUSTO_FINAL_INVALIDO"
    );
  }

  return new Prisma.Decimal(
    normalizado
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
    respostaErroBiblioteca(erro);

  return responder(
    resposta.corpo,
    resposta.status
  );
}

/* =========================================================
   POST
   Conclui a manutenção de um exemplar
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
        "Não é permitido concluir manutenções durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.exemplares.manutencao"
    );

    const manutencaoId =
      obterManutencaoId(params);

    let corpo: {
      resultado?: unknown;
      observacaoConclusao?: unknown;
      custoFinal?: unknown;
    };

    try {
      corpo = await request.json();
    } catch {
      falhar(
        400,
        "Os dados da conclusão são inválidos.",
        "JSON_INVALIDO"
      );
    }

    const resultado =
      obterResultado(
        corpo.resultado
      );

    const observacaoConclusao =
      textoOpcional(
        corpo.observacaoConclusao,
        5_000
      );

    if (
      resultado ===
        ResultadoManutencaoExemplarBiblioteca.IRRECUPERAVEL &&
      !observacaoConclusao
    ) {
      falhar(
        400,
        "Informe por que o exemplar foi considerado irrecuperável.",
        "JUSTIFICATIVA_IRRECUPERAVEL_OBRIGATORIA"
      );
    }

    const custoFinal =
      valorMonetarioOpcional(
        corpo.custoFinal
      );

    const agora = new Date();
    const ip = obterIp(request);

    const userAgent =
      request.headers.get(
        "user-agent"
      );

    const novoStatusExemplar =
      resultado ===
      ResultadoManutencaoExemplarBiblioteca.REPARADO
        ? StatusExemplarBiblioteca.DISPONIVEL
        : StatusExemplarBiblioteca.DANIFICADO;

    const resposta =
      await prisma.$transaction(
        async (transacao) => {
          await transacao.$queryRaw`
            SELECT "id"
            FROM "BibliotecaManutencaoExemplar"
            WHERE "id" = ${manutencaoId}
              AND "instituicaoId" = ${contexto.instituicaoId}
            FOR UPDATE
          `;

          const manutencao =
            await transacao
              .bibliotecaManutencaoExemplar
              .findFirst({
                where: {
                  id: manutencaoId,
                  instituicaoId:
                    contexto.instituicaoId,
                },

                select: {
                  id: true,
                  exemplarId: true,
                  status: true,
                  resultado: true,
                  motivo: true,
                  fornecedor: true,
                  custoEstimado: true,
                  custoFinal: true,
                  iniciadaEm: true,
                  concluidaEm: true,
                },
              });

          if (!manutencao) {
            falhar(
              404,
              "Manutenção não encontrada.",
              "MANUTENCAO_NAO_ENCONTRADA"
            );
          }

          if (
            manutencao.status !==
            StatusManutencaoExemplarBiblioteca.ABERTA
          ) {
            falhar(
              409,
              "Esta manutenção não está mais em andamento.",
              "MANUTENCAO_NAO_ABERTA"
            );
          }

          await transacao.$queryRaw`
            SELECT "id"
            FROM "BibliotecaExemplar"
            WHERE "id" = ${manutencao.exemplarId}
              AND "instituicaoId" = ${contexto.instituicaoId}
            FOR UPDATE
          `;

          const exemplar =
            await transacao
              .bibliotecaExemplar
              .findFirst({
                where: {
                  id:
                    manutencao.exemplarId,

                  instituicaoId:
                    contexto.instituicaoId,
                },

                select: {
                  id: true,
                  itemId: true,
                  status: true,
                  codigoInterno: true,
                  numeroTombo: true,
                  permiteEmprestimo:
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
              "O exemplar foi baixado do acervo e a manutenção não pode ser concluída.",
              "EXEMPLAR_BAIXADO"
            );
          }

          if (
            exemplar.status !==
            StatusExemplarBiblioteca.MANUTENCAO
          ) {
            falhar(
              409,
              "O exemplar não está marcado como em manutenção.",
              "EXEMPLAR_FORA_DE_MANUTENCAO"
            );
          }

          const manutencaoAtualizada =
            await transacao
              .bibliotecaManutencaoExemplar
              .update({
                where: {
                  id: manutencao.id,
                },

                data: {
                  status:
                    StatusManutencaoExemplarBiblioteca.CONCLUIDA,

                  resultado,
                  custoFinal,
                  concluidaEm: agora,
                  observacaoConclusao,

                  concluidoPorId:
                    usuario.id,
                },

                select: {
                  id: true,
                  exemplarId: true,
                  status: true,
                  resultado: true,
                  motivo: true,
                  fornecedor: true,
                  custoEstimado: true,
                  custoFinal: true,
                  iniciadaEm: true,
                  concluidaEm: true,
                  observacaoConclusao:
                    true,
                },
              });

          const exemplarAtualizado =
            await transacao
              .bibliotecaExemplar
              .update({
                where: {
                  id: exemplar.id,
                },

                data: {
                  status:
                    novoStatusExemplar,

                  atualizadoPorId:
                    usuario.id,

                  ...(resultado ===
                  ResultadoManutencaoExemplarBiblioteca.IRRECUPERAVEL
                    ? {
                        permiteEmprestimo:
                          false,
                      }
                    : {}),
                },

                select: {
                  id: true,
                  status: true,
                  codigoInterno:
                    true,
                  numeroTombo:
                    true,
                  permiteEmprestimo:
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
                  "BibliotecaManutencaoExemplar",

                entidadeId:
                  String(
                    manutencao.id
                  ),

                acao:
                  AcaoAuditoriaBiblioteca.CONCLUIR_MANUTENCAO,

                descricao:
                  resultado ===
                  ResultadoManutencaoExemplarBiblioteca.REPARADO
                    ? "Manutenção concluída e exemplar liberado para circulação."
                    : "Manutenção concluída com exemplar considerado irrecuperável.",

                dadosAnteriores: {
                  manutencaoStatus:
                    manutencao.status,

                  exemplarStatus:
                    exemplar.status,

                  custoEstimado:
                    manutencao
                      .custoEstimado
                      ?.toString() ??
                    null,
                },

                dadosPosteriores: {
                  manutencaoStatus:
                    StatusManutencaoExemplarBiblioteca.CONCLUIDA,

                  resultado,

                  exemplarStatus:
                    novoStatusExemplar,

                  custoFinal:
                    custoFinal
                      ?.toString() ??
                    null,

                  concluidaEm:
                    agora.toISOString(),
                },

                metadados: {
                  origem:
                    "api_admin_biblioteca_manutencao_concluir",

                  itemId:
                    exemplar.itemId,

                  exemplarId:
                    exemplar.id,

                  codigoInterno:
                    exemplar.codigoInterno,

                  numeroTombo:
                    exemplar.numeroTombo,
                },

                ip,
                userAgent,
              },
            });

          return {
            manutencao:
              manutencaoAtualizada,

            exemplar:
              exemplarAtualizado,
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
        resultado ===
        ResultadoManutencaoExemplarBiblioteca.REPARADO
          ? "Manutenção concluída. O exemplar voltou a ficar disponível."
          : "Manutenção concluída. O exemplar foi marcado como irrecuperável.",

      manutencao:
        resposta.manutencao,

      exemplar:
        resposta.exemplar,
    });
  } catch (erro) {
    return responderErro(erro);
  }
}