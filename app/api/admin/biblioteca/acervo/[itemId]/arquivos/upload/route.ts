import {
  AcaoAuditoriaBiblioteca,
  StatusArquivoBiblioteca,
  StatusItemBiblioteca,
  TipoArquivoBiblioteca,
  TipoModuloAdicional,
  TipoMovimentoArmazenamento,
} from "@prisma/client";

import { head } from "@vercel/blob";
import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
  verificarEspacoParaUpload,
} from "@/lib/biblioteca-acesso";

import {
  extensaoBibliotecaPermitida,
  limparNomeArquivoBiblioteca,
  mimeTypeBibliotecaPermitido,
  obterExtensaoArquivo,
  obterStoreIdBibliotecaBlob,
  obterTokenBibliotecaBlob,
  prefixoArquivoBiblioteca,
} from "@/lib/biblioteca-storage";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    itemId: string;
  };
};

type PayloadCliente = {
  nomeOriginal: string;
  tamanhoBytes: number;
  mimeType: string;
};

type PayloadToken = {
  arquivoId: number;
  instituicaoId: number;
  itemId: number;
  usuarioId: number;

  nomeOriginal: string;
  mimeType: string;
  extensao: string;
  tipo: TipoArquivoBiblioteca;

  tamanhoDeclaradoBytes: number;
};

const UMA_HORA_MS =
  60 * 60 * 1000;

const TRINTA_MINUTOS_MS =
  30 * 60 * 1000;

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

function obterItemId(
  params: ContextoRota["params"]
) {
  const itemId =
    Number(params.itemId);

  if (
    !Number.isInteger(itemId) ||
    itemId <= 0
  ) {
    falhar(
      400,
      "O identificador do item é inválido.",
      "ITEM_ID_INVALIDO"
    );
  }

  return itemId;
}

function lerPayloadCliente(
  clientPayload: string | null
): PayloadCliente {
  if (!clientPayload) {
    falhar(
      400,
      "Os dados do arquivo não foram informados.",
      "PAYLOAD_UPLOAD_AUSENTE"
    );
  }

  let dados: Record<
    string,
    unknown
  >;

  try {
    dados =
      JSON.parse(clientPayload);
  } catch {
    falhar(
      400,
      "Os dados do arquivo são inválidos.",
      "PAYLOAD_UPLOAD_INVALIDO"
    );
  }

  const nomeOriginal =
    String(
      dados.nomeOriginal || ""
    ).trim();

  const tamanhoBytes =
    Number(dados.tamanhoBytes);

  const mimeType =
    String(
      dados.mimeType || ""
    )
      .trim()
      .toLowerCase();

  if (!nomeOriginal) {
    falhar(
      400,
      "O nome do arquivo é obrigatório.",
      "NOME_ARQUIVO_INVALIDO"
    );
  }

  if (
    !Number.isSafeInteger(
      tamanhoBytes
    ) ||
    tamanhoBytes <= 0
  ) {
    falhar(
      400,
      "O tamanho do arquivo é inválido.",
      "TAMANHO_ARQUIVO_INVALIDO"
    );
  }

  return {
    nomeOriginal,
    tamanhoBytes,
    mimeType,
  };
}

function mimePadraoPorExtensao(
  extensao: string
) {
  switch (extensao) {
    case "pdf":
      return "application/pdf";

    case "epub":
      return "application/epub+zip";

    case "mp3":
      return "audio/mpeg";

    case "m4a":
      return "audio/mp4";

    case "wav":
      return "audio/wav";

    case "ogg":
      return "audio/ogg";

    case "mp4":
      return "video/mp4";

    case "webm":
      return "video/webm";

    case "mov":
      return "video/quicktime";

    default:
      return "";
  }
}

function tipoArquivoPorExtensao(
  extensao: string
): TipoArquivoBiblioteca {
  if (extensao === "pdf") {
    return TipoArquivoBiblioteca.PDF;
  }

  if (extensao === "epub") {
    return TipoArquivoBiblioteca.EPUB;
  }

  if (
    [
      "mp3",
      "m4a",
      "wav",
      "ogg",
    ].includes(extensao)
  ) {
    return TipoArquivoBiblioteca.AUDIO;
  }

  if (
    [
      "mp4",
      "webm",
      "mov",
    ].includes(extensao)
  ) {
    return TipoArquivoBiblioteca.VIDEO;
  }

  falhar(
    400,
    "Este tipo de arquivo não é permitido na Biblioteca Virtual.",
    "TIPO_ARQUIVO_NAO_PERMITIDO"
  );
}

function mimeCompativelComTipo(
  tipo: TipoArquivoBiblioteca,
  mimeType: string
) {
  switch (tipo) {
    case TipoArquivoBiblioteca.PDF:
      return (
        mimeType ===
        "application/pdf"
      );

    case TipoArquivoBiblioteca.EPUB:
      return [
        "application/epub+zip",
        "application/x-epub+zip",
      ].includes(mimeType);

    case TipoArquivoBiblioteca.AUDIO:
      return mimeType.startsWith(
        "audio/"
      );

    case TipoArquivoBiblioteca.VIDEO:
      return mimeType.startsWith(
        "video/"
      );

    default:
      return false;
  }
}

function lerPayloadToken(
  tokenPayload?: string | null
): PayloadToken {
  if (!tokenPayload) {
    throw new Error(
      "Payload do upload não encontrado."
    );
  }

  const dados =
    JSON.parse(
      tokenPayload
    ) as PayloadToken;

  if (
    !Number.isInteger(
      dados.arquivoId
    ) ||
    !Number.isInteger(
      dados.instituicaoId
    ) ||
    !Number.isInteger(
      dados.itemId
    ) ||
    !Number.isInteger(
      dados.usuarioId
    )
  ) {
    throw new Error(
      "Payload do upload é inválido."
    );
  }

  return dados;
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

  return NextResponse.json(
    resposta.corpo,
    {
      status: resposta.status,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    }
  );
}

export async function POST(
  request: NextRequest,
  { params }: ContextoRota
) {
  try {
    const itemId =
      obterItemId(params);

    const body =
      (await request.json()) as
        HandleUploadBody;

    const token =
      obterTokenBibliotecaBlob();

    const resposta =
      await handleUpload({
        body,
        request,
        token,

        onBeforeGenerateToken:
          async (
            pathname,
            clientPayload
          ) => {
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

            if (
              usuario.impersonacao
            ) {
              falhar(
                403,
                "O envio de arquivos não é permitido durante uma sessão de suporte por impersonação.",
                "UPLOAD_BLOQUEADO_IMPERSONACAO"
              );
            }

            exigirPermissaoBiblioteca(
              usuario,
              contexto,
              "biblioteca.arquivos.upload"
            );

            const item =
              await prisma
                .bibliotecaItem
                .findFirst({
                  where: {
                    id: itemId,
                    instituicaoId:
                      contexto.instituicaoId,
                  },
                  select: {
                    id: true,
                    status: true,
                    permitirDownload:
                      true,
                  },
                });

            if (!item) {
              falhar(
                404,
                "Item não encontrado nesta biblioteca.",
                "ITEM_NAO_ENCONTRADO"
              );
            }

            if (
              item.status ===
              StatusItemBiblioteca.ARQUIVADO
            ) {
              falhar(
                409,
                "Restaure o item antes de enviar arquivos.",
                "ITEM_ARQUIVADO"
              );
            }

            const dados =
              lerPayloadCliente(
                clientPayload
              );

            if (
              !extensaoBibliotecaPermitida(
                dados.nomeOriginal
              )
            ) {
              falhar(
                400,
                "A extensão deste arquivo não é permitida na Biblioteca Virtual.",
                "EXTENSAO_NAO_PERMITIDA"
              );
            }

            const extensao =
              obterExtensaoArquivo(
                dados.nomeOriginal
              );

            const tipo =
              tipoArquivoPorExtensao(
                extensao
              );

            const mimeType =
              mimeTypeBibliotecaPermitido(
                dados.mimeType
              )
                ? dados.mimeType
                : mimePadraoPorExtensao(
                    extensao
                  );

            if (
              !mimeType ||
              !mimeTypeBibliotecaPermitido(
                mimeType
              ) ||
              !mimeCompativelComTipo(
                tipo,
                mimeType
              )
            ) {
              falhar(
                400,
                "O tipo MIME do arquivo não corresponde à extensão informada.",
                "MIME_TYPE_INVALIDO",
                {
                  extensao,
                  mimeType:
                    dados.mimeType,
                }
              );
            }

            const tamanho =
              BigInt(
                dados.tamanhoBytes
              );

            verificarEspacoParaUpload(
              contexto,
              tamanho
            );

            const prefixo =
              prefixoArquivoBiblioteca({
                instituicaoId:
                  contexto.instituicaoId,
                itemId,
              });

            const nomeSeguro =
              limparNomeArquivoBiblioteca(
                dados.nomeOriginal
              );

            const pathnameEsperado =
              `${prefixo}/${nomeSeguro}`;

            if (
              pathname !==
              pathnameEsperado
            ) {
              falhar(
                400,
                "O caminho de armazenamento solicitado é inválido.",
                "PATHNAME_UPLOAD_INVALIDO"
              );
            }

            const agora =
              new Date();

            const expiracaoReserva =
              new Date(
                agora.getTime() -
                  UMA_HORA_MS
              );

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

            const arquivo =
              await prisma
                .$transaction(
                  async (
                    transacao
                  ) => {
                    /*
                     * Serializa a reserva de
                     * armazenamento da instituição.
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

                    if (
                      !configuracao
                    ) {
                      falhar(
                        409,
                        "A configuração da Biblioteca Virtual ainda não foi criada.",
                        "CONFIGURACAO_BIBLIOTECA_AUSENTE"
                      );
                    }

                    /*
                     * Reservas que nunca concluíram
                     * o upload deixam de bloquear
                     * espaço após uma hora.
                     */
                    await transacao
                      .bibliotecaArquivo
                      .updateMany({
                        where: {
                          instituicaoId:
                            contexto.instituicaoId,

                          status:
                            StatusArquivoBiblioteca.AGUARDANDO_UPLOAD,

                          enviadoEm: {
                            lt: expiracaoReserva,
                          },
                        },

                        data: {
                          status:
                            StatusArquivoBiblioteca.ERRO,

                          erroProcessamento:
                            "A autorização de upload expirou antes da conclusão do envio.",
                        },
                      });

                    const reservas =
                      await transacao
                        .bibliotecaArquivo
                        .aggregate({
                          where: {
                            instituicaoId:
                              contexto.instituicaoId,

                            status:
                              StatusArquivoBiblioteca.AGUARDANDO_UPLOAD,
                          },

                          _sum: {
                            tamanhoBytes:
                              true,
                          },
                        });

                    const reservado =
                      BigInt(
                        reservas
                          ._sum
                          .tamanhoBytes ??
                          0
                      );

                    const utilizado =
                      BigInt(
                        configuracao
                          .armazenamentoUtilizadoBytes
                      );

                    const limite =
                      contexto
                        .armazenamento
                        .limiteBytes;

                    const projetado =
                      utilizado +
                      reservado +
                      tamanho;

                    if (
                      projetado >
                      limite
                    ) {
                      falhar(
                        413,
                        "O upload ultrapassaria o espaço disponível da Biblioteca Virtual.",
                        "LIMITE_ARMAZENAMENTO_EXCEDIDO",
                        {
                          limiteBytes:
                            limite.toString(),

                          utilizadoBytes:
                            utilizado.toString(),

                          reservadoBytes:
                            reservado.toString(),

                          tamanhoArquivoBytes:
                            tamanho.toString(),
                        }
                      );
                    }

                    /*
                     * A trava do próprio item
                     * também evita duas versões
                     * iguais em uploads simultâneos.
                     */
                    await transacao
                      .$queryRaw`
                        SELECT "id"
                        FROM "BibliotecaItem"
                        WHERE "id" = ${itemId}
                          AND "instituicaoId" = ${contexto.instituicaoId}
                        FOR UPDATE
                      `;

                    const ultimaVersao =
                      await transacao
                        .bibliotecaArquivo
                        .aggregate({
                          where: {
                            instituicaoId:
                              contexto.instituicaoId,

                            itemId,
                          },

                          _max: {
                            versao:
                              true,
                          },
                        });

                    const versao =
                      (
                        ultimaVersao
                          ._max
                          .versao ??
                        0
                      ) + 1;

                    const criado =
                      await transacao
                        .bibliotecaArquivo
                        .create({
                          data: {
                            instituicaoId:
                              contexto.instituicaoId,

                            itemId,

                            tipo,

                            status:
                              StatusArquivoBiblioteca.AGUARDANDO_UPLOAD,

                            nomeOriginal:
                              dados.nomeOriginal,

                            nomeInterno:
                              nomeSeguro,

                            extensao,

                            mimeType,

                            tamanhoBytes:
                              tamanho,

                            provedorArmazenamento:
                              "VERCEL_BLOB_PRIVATE",

                            bucket:
                              obterStoreIdBibliotecaBlob(),

                            versao,

                            principal:
                              false,

                            protegido:
                              true,

                            permitirDownload:
                              Boolean(
                                contexto
                                  .configuracao
                                  ?.permitirDownload &&
                                  item.permitirDownload
                              ),

                            enviadoPorId:
                              usuario.id,
                          },

                          select: {
                            id: true,
                            versao:
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
                            "BibliotecaArquivo",

                          entidadeId:
                            String(
                              criado.id
                            ),

                          acao:
                            AcaoAuditoriaBiblioteca.CRIAR,

                          descricao:
                            "Upload de arquivo autorizado para o acervo da Biblioteca Virtual.",

                          dadosPosteriores:
                            {
                              itemId,
                              nomeOriginal:
                                dados.nomeOriginal,
                              extensao,
                              mimeType,
                              tipo,
                              tamanhoBytes:
                                tamanho.toString(),
                              versao,
                              status:
                                StatusArquivoBiblioteca.AGUARDANDO_UPLOAD,
                            },

                          metadados:
                            {
                              origem:
                                "api_admin_biblioteca_upload",
                              pathname:
                                pathnameEsperado,
                            },

                          ip,
                          userAgent,
                        },
                      });

                    return criado;
                  },
                  {
                    maxWait:
                      5_000,
                    timeout:
                      15_000,
                  }
                );

            const tokenPayload:
              PayloadToken = {
              arquivoId:
                arquivo.id,

              instituicaoId:
                contexto.instituicaoId,

              itemId,

              usuarioId:
                usuario.id,

              nomeOriginal:
                dados.nomeOriginal,

              mimeType,

              extensao,

              tipo,

              tamanhoDeclaradoBytes:
                dados.tamanhoBytes,
            };

            return {
              allowedContentTypes: [
                mimeType,
              ],

              maximumSizeInBytes:
                dados.tamanhoBytes,

              addRandomSuffix:
                true,

              allowOverwrite:
                false,

              validUntil:
                Date.now() +
                TRINTA_MINUTOS_MS,

              tokenPayload:
                JSON.stringify(
                  tokenPayload
                ),
            };
          },

        onUploadCompleted:
          async ({
            blob,
            tokenPayload,
          }) => {
            const dados =
              lerPayloadToken(
                tokenPayload
              );

            const prefixo =
              prefixoArquivoBiblioteca({
                instituicaoId:
                  dados.instituicaoId,

                itemId:
                  dados.itemId,
              });

            if (
              !blob.pathname.startsWith(
                `${prefixo}/`
              )
            ) {
              throw new Error(
                "O Blob concluído não pertence ao caminho autorizado."
              );
            }

            /*
             * Nunca confie apenas no tamanho
             * informado pelo navegador.
             * Conferimos o objeto que realmente
             * chegou ao Blob.
             */
            const detalhes =
              await head(
                blob.pathname,
                {
                  token,
                }
              );

            const tamanhoReal =
              BigInt(
                detalhes.size
              );

            if (
              tamanhoReal <= 0n
            ) {
              throw new Error(
                "O arquivo enviado está vazio."
              );
            }

            if (
              tamanhoReal >
              BigInt(
                dados.tamanhoDeclaradoBytes
              )
            ) {
              throw new Error(
                "O arquivo recebido é maior do que o tamanho autorizado."
              );
            }

            await prisma
              .$transaction(
                async (
                  transacao
                ) => {
                  /*
                   * Serializa a atualização
                   * do consumo da instituição.
                   */
                  await transacao
                    .$queryRaw`
                      SELECT "id"
                      FROM "BibliotecaConfiguracao"
                      WHERE "instituicaoId" = ${dados.instituicaoId}
                      FOR UPDATE
                    `;

                  const arquivo =
                    await transacao
                      .bibliotecaArquivo
                      .findFirst({
                        where: {
                          id:
                            dados.arquivoId,

                          instituicaoId:
                            dados.instituicaoId,

                          itemId:
                            dados.itemId,
                        },
                      });

                  if (!arquivo) {
                    throw new Error(
                      "Registro do arquivo não encontrado."
                    );
                  }

                  /*
                   * Callback pode ser reenviado
                   * pela Vercel. Esta verificação
                   * deixa a operação idempotente.
                   */
                  if (
                    arquivo.status ===
                      StatusArquivoBiblioteca.DISPONIVEL &&
                    arquivo.storageKey ===
                      detalhes.pathname
                  ) {
                    return;
                  }

                  const configuracao =
                    await transacao
                      .bibliotecaConfiguracao
                      .findUnique({
                        where: {
                          instituicaoId:
                            dados.instituicaoId,
                        },

                        select: {
                          armazenamentoUtilizadoBytes:
                            true,
                        },
                      });

                  if (
                    !configuracao
                  ) {
                    throw new Error(
                      "Configuração da Biblioteca Virtual não encontrada."
                    );
                  }

                  const modulo =
                    await transacao
                      .moduloAdicionalInstituicao
                      .findUnique({
                        where: {
                          instituicaoId_tipo:
                            {
                              instituicaoId:
                                dados.instituicaoId,

                              tipo:
                                TipoModuloAdicional.BIBLIOTECA_VIRTUAL,
                            },
                        },

                        select: {
                          armazenamentoContratadoBytes:
                            true,

                          armazenamentoExtraBytes:
                            true,
                        },
                      });

                  if (!modulo) {
                    throw new Error(
                      "Módulo da Biblioteca Virtual não encontrado."
                    );
                  }

                  const utilizado =
                    BigInt(
                      configuracao
                        .armazenamentoUtilizadoBytes
                    );

                  const limite =
                    BigInt(
                      modulo
                        .armazenamentoContratadoBytes
                    ) +
                    BigInt(
                      modulo
                        .armazenamentoExtraBytes
                    );

                  const novoSaldo =
                    utilizado +
                    tamanhoReal;

                  if (
                    novoSaldo >
                    limite
                  ) {
                    throw new ErroBiblioteca(
                      413,
                      "O arquivo ultrapassaria o limite de armazenamento da Biblioteca Virtual.",
                      "LIMITE_ARMAZENAMENTO_EXCEDIDO"
                    );
                  }

                  const nomeInterno =
                    detalhes.pathname
                      .split("/")
                      .pop() ||
                    arquivo.nomeInterno ||
                    arquivo.nomeOriginal;

                  await transacao
                    .bibliotecaArquivo
                    .update({
                      where: {
                        id_instituicaoId:
                          {
                            id:
                              arquivo.id,

                            instituicaoId:
                              dados.instituicaoId,
                          },
                      },

                      data: {
                        status:
                          StatusArquivoBiblioteca.DISPONIVEL,

                        nomeInterno,

                        storageKey:
                          detalhes.pathname,

                        provedorArmazenamento:
                          "VERCEL_BLOB_PRIVATE",

                        bucket:
                          obterStoreIdBibliotecaBlob(),

                        mimeType:
                          detalhes.contentType ||
                          dados.mimeType,

                        tamanhoBytes:
                          tamanhoReal,

                        processadoEm:
                          new Date(),

                        erroProcessamento:
                          null,
                      },
                    });

                  await transacao
                    .bibliotecaConfiguracao
                    .update({
                      where: {
                        instituicaoId:
                          dados.instituicaoId,
                      },

                      data: {
                        armazenamentoUtilizadoBytes:
                          novoSaldo,
                      },
                    });

                  await transacao
                    .bibliotecaConsumoArmazenamento
                    .create({
                      data: {
                        instituicaoId:
                          dados.instituicaoId,

                        tipoMovimento:
                          TipoMovimentoArmazenamento.UPLOAD,

                        quantidadeBytes:
                          tamanhoReal,

                        saldoAnteriorBytes:
                          utilizado,

                        saldoPosteriorBytes:
                          novoSaldo,

                        arquivoReferenciaId:
                          String(
                            arquivo.id
                          ),

                        arquivoNomeSnapshot:
                          arquivo.nomeOriginal,

                        motivo:
                          "Upload concluído na Biblioteca Virtual.",

                        registradoPorId:
                          dados.usuarioId,
                      },
                    });

                  await transacao
                    .bibliotecaAuditoria
                    .create({
                      data: {
                        instituicaoId:
                          dados.instituicaoId,

                        usuarioId:
                          dados.usuarioId,

                        entidade:
                          "BibliotecaArquivo",

                        entidadeId:
                          String(
                            arquivo.id
                          ),

                        acao:
                          AcaoAuditoriaBiblioteca.ATUALIZAR,

                        descricao:
                          "Upload do arquivo concluído e armazenamento contabilizado.",

                        dadosAnteriores:
                          {
                            status:
                              arquivo.status,

                            tamanhoBytes:
                              arquivo.tamanhoBytes.toString(),
                          },

                        dadosPosteriores:
                          {
                            status:
                              StatusArquivoBiblioteca.DISPONIVEL,

                            tamanhoBytes:
                              tamanhoReal.toString(),

                            storageKey:
                              detalhes.pathname,
                          },

                        metadados:
                          {
                            origem:
                              "vercel_blob_upload_completed",

                            etag:
                              detalhes.etag,
                          },
                      },
                    });
                },
                {
                  maxWait:
                    5_000,
                  timeout:
                    15_000,
                }
              );
          },
      });

    return NextResponse.json(
      resposta,
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