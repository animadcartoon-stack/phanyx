import {
  AcaoAuditoriaBiblioteca,
  StatusArquivoBiblioteca,
  TipoMovimentoArmazenamento,
} from "@prisma/client";

import { del } from "@vercel/blob";

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

import {
  obterTokenBibliotecaBlob,
} from "@/lib/biblioteca-storage";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    arquivoId: string;
  };
};

type CorpoExclusao = {
  motivo?: string;
};

function falhar(
  status: number,
  mensagem: string,
  codigo: string,
  detalhes?: Record<string, unknown>
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo,
    detalhes
  );
}

function obterArquivoId(
  params: ContextoRota["params"]
) {
  const arquivoId =
    Number(params.arquivoId);

  if (
    !Number.isInteger(arquivoId) ||
    arquivoId <= 0
  ) {
    falhar(
      400,
      "O identificador do arquivo é inválido.",
      "ARQUIVO_ID_INVALIDO"
    );
  }

  return arquivoId;
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

async function lerCorpoExclusao(
  request: NextRequest
): Promise<CorpoExclusao> {
  try {
    const texto =
      await request.text();

    if (!texto.trim()) {
      return {};
    }

    return JSON.parse(
      texto
    ) as CorpoExclusao;
  } catch {
    falhar(
      400,
      "Os dados da exclusão são inválidos.",
      "JSON_INVALIDO"
    );
  }
}

function responderErro(
  erro: unknown
) {
  const resposta =
    respostaErroBiblioteca(
      erro
    );

  return NextResponse.json(
    resposta.corpo,
    {
      status:
        resposta.status,

      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: ContextoRota
) {
  try {
    const usuario =
      await getUserFromToken();

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    if (usuario.impersonacao) {
      falhar(
        403,
        "A exclusão de arquivos não é permitida durante uma sessão de suporte por impersonação.",
        "EXCLUSAO_BLOQUEADA_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.arquivos.excluir"
    );

    const arquivoId =
      obterArquivoId(params);

    const corpo =
      await lerCorpoExclusao(
        request
      );

    const motivo =
      String(
        corpo.motivo || ""
      )
        .trim()
        .slice(
          0,
          2_000
        ) ||
      "Arquivo removido do acervo da Biblioteca Virtual.";

    const arquivo =
      await prisma
        .bibliotecaArquivo
        .findFirst({
          where: {
            id:
              arquivoId,

            instituicaoId:
              contexto.instituicaoId,

            arquivadoEm:
              null,

            status:
              StatusArquivoBiblioteca.DISPONIVEL,
          },

          select: {
            id: true,
            itemId: true,

            nomeOriginal:
              true,

            tamanhoBytes:
              true,

            storageKey:
              true,

            provedorArmazenamento:
              true,

            status:
              true,
          },
        });

    if (!arquivo) {
      falhar(
        404,
        "Arquivo não encontrado ou já removido.",
        "ARQUIVO_NAO_ENCONTRADO"
      );
    }

    if (!arquivo.storageKey) {
      falhar(
        409,
        "O arquivo não possui uma referência válida no armazenamento.",
        "ARQUIVO_SEM_STORAGE_KEY"
      );
    }

    if (
      arquivo.provedorArmazenamento !==
      "VERCEL_BLOB_PRIVATE"
    ) {
      falhar(
        409,
        "Este arquivo não pertence ao armazenamento privado da Biblioteca Virtual.",
        "PROVEDOR_ARMAZENAMENTO_INVALIDO"
      );
    }

    /*
     * Reserva a exclusão.
     * Isso impede dois administradores
     * de descontarem o mesmo arquivo
     * do armazenamento simultaneamente.
     */
    const reservado =
      await prisma
        .bibliotecaArquivo
        .updateMany({
          where: {
            id:
              arquivo.id,

            instituicaoId:
              contexto.instituicaoId,

            status:
              StatusArquivoBiblioteca.DISPONIVEL,

            arquivadoEm:
              null,
          },

          data: {
            status:
              StatusArquivoBiblioteca.PROCESSANDO,

            erroProcessamento:
              "Exclusão do arquivo em andamento.",
          },
        });

    if (reservado.count !== 1) {
      falhar(
        409,
        "Este arquivo já está sendo alterado por outro processo.",
        "ARQUIVO_EM_PROCESSAMENTO"
      );
    }

    const token =
      obterTokenBibliotecaBlob();

    try {
      await del(
        arquivo.storageKey,
        {
          token,
        }
      );
    } catch (erroBlob) {
      /*
       * Se o Blob não pôde ser removido,
       * devolvemos o registro para
       * DISPONIVEL e não mexemos na quota.
       */
      await prisma
        .bibliotecaArquivo
        .updateMany({
          where: {
            id:
              arquivo.id,

            instituicaoId:
              contexto.instituicaoId,

            status:
              StatusArquivoBiblioteca.PROCESSANDO,
          },

          data: {
            status:
              StatusArquivoBiblioteca.DISPONIVEL,

            erroProcessamento:
              "Não foi possível remover o arquivo do armazenamento privado.",
          },
        });

      console.error(
        "Erro ao excluir Blob da Biblioteca:",
        erroBlob
      );

      falhar(
        502,
        "Não foi possível remover o arquivo do armazenamento. Nenhum espaço foi descontado.",
        "FALHA_EXCLUSAO_BLOB"
      );
    }

    const ip =
      obterIp(request);

    const userAgent =
      request.headers
        .get(
          "user-agent"
        )
        ?.slice(
          0,
          2_000
        ) || null;

    const resultado =
      await prisma
        .$transaction(
          async (
            transacao
          ) => {
            /*
             * Bloqueia a configuração
             * para serializar alterações
             * no consumo da instituição.
             */
            await transacao
              .$queryRaw`
                SELECT "id"
                FROM "BibliotecaConfiguracao"
                WHERE "instituicaoId" = ${contexto.instituicaoId}
                FOR UPDATE
              `;

            const configuracao =
              await transacao
                .bibliotecaConfiguracao
                .findUnique({
                  where: {
                    instituicaoId:
                      contexto.instituicaoId,
                  },

                  select: {
                    armazenamentoUtilizadoBytes:
                      true,
                  },
                });

            if (!configuracao) {
              throw new ErroBiblioteca(
                409,
                "A configuração da Biblioteca Virtual não foi encontrada.",
                "CONFIGURACAO_BIBLIOTECA_AUSENTE"
              );
            }

            const registroArquivo =
              await transacao
                .bibliotecaArquivo
                .findFirst({
                  where: {
                    id:
                      arquivo.id,

                    instituicaoId:
                      contexto.instituicaoId,
                  },

                  select: {
                    id: true,
                    itemId: true,
                    nomeOriginal:
                      true,
                    tamanhoBytes:
                      true,
                    status:
                      true,
                    arquivadoEm:
                      true,
                  },
                });

            if (
              !registroArquivo
            ) {
              throw new ErroBiblioteca(
                404,
                "O registro do arquivo não foi encontrado.",
                "ARQUIVO_NAO_ENCONTRADO"
              );
            }

            /*
             * Operação idempotente:
             * se já estiver arquivado,
             * não descontamos novamente.
             */
            if (
              registroArquivo
                .arquivadoEm ||
              registroArquivo
                .status ===
                StatusArquivoBiblioteca.ARQUIVADO
            ) {
              return {
                jaExcluido:
                  true,

                liberadoBytes:
                  0n,
              };
            }

            if (
              registroArquivo
                .status !==
              StatusArquivoBiblioteca.PROCESSANDO
            ) {
              throw new ErroBiblioteca(
                409,
                "O arquivo não está no estado esperado para conclusão da exclusão.",
                "STATUS_ARQUIVO_INVALIDO"
              );
            }

            const utilizado =
              BigInt(
                configuracao
                  .armazenamentoUtilizadoBytes
              );

            const tamanho =
              BigInt(
                registroArquivo
                  .tamanhoBytes
              );

            const novoSaldo =
              utilizado >=
              tamanho
                ? utilizado -
                  tamanho
                : 0n;

            const agora =
              new Date();

            await transacao
              .bibliotecaArquivo
              .update({
                where: {
                  id_instituicaoId:
                    {
                      id:
                        registroArquivo.id,

                      instituicaoId:
                        contexto.instituicaoId,
                    },
                },

                data: {
                  status:
                    StatusArquivoBiblioteca.ARQUIVADO,

                  arquivadoEm:
                    agora,

                  arquivadoPorId:
                    usuario.id,

                  motivoArquivamento:
                    motivo,

                  erroProcessamento:
                    null,
                },
              });

            await transacao
              .bibliotecaConfiguracao
              .update({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,
                },

                data: {
                  armazenamentoUtilizadoBytes:
                    novoSaldo,

                  atualizadoPorId:
                    usuario.id,
                },
              });

            await transacao
              .bibliotecaConsumoArmazenamento
              .create({
                data: {
                  instituicaoId:
                    contexto.instituicaoId,

                  tipoMovimento:
                    TipoMovimentoArmazenamento.EXCLUSAO,

                  quantidadeBytes:
                    tamanho,

                  saldoAnteriorBytes:
                    utilizado,

                  saldoPosteriorBytes:
                    novoSaldo,

                  arquivoReferenciaId:
                    String(
                      registroArquivo.id
                    ),

                  arquivoNomeSnapshot:
                    registroArquivo.nomeOriginal,

                  motivo,

                  registradoPorId:
                    usuario.id,
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
                    "BibliotecaArquivo",

                  entidadeId:
                    String(
                      registroArquivo.id
                    ),

                  acao:
                    AcaoAuditoriaBiblioteca.EXCLUIR,

                  descricao:
                    "Arquivo removido do armazenamento privado da Biblioteca Virtual.",

                  dadosAnteriores:
                    {
                      status:
                        registroArquivo.status,

                      tamanhoBytes:
                        tamanho.toString(),

                      nomeOriginal:
                        registroArquivo.nomeOriginal,
                    },

                  dadosPosteriores:
                    {
                      status:
                        StatusArquivoBiblioteca.ARQUIVADO,

                      arquivadoEm:
                        agora.toISOString(),

                      motivo,
                    },

                  metadados:
                    {
                      origem:
                        "api_admin_biblioteca_arquivo_excluir",

                      armazenamentoLiberadoBytes:
                        tamanho.toString(),
                    },

                  ip,
                  userAgent,
                },
              });

            return {
              jaExcluido:
                false,

              liberadoBytes:
                tamanho,
            };
          },
          {
            maxWait:
              5_000,

            timeout:
              15_000,
          }
        );

    return NextResponse.json(
      {
        ok: true,

        mensagem:
          resultado.jaExcluido
            ? "O arquivo já havia sido removido."
            : "Arquivo removido com sucesso.",

        armazenamentoLiberadoBytes:
          resultado
            .liberadoBytes
            .toString(),
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}