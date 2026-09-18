import {
  MobilidadeStatusDocumento,
} from "@prisma/client";

import {
  del,
  head,
} from "@vercel/blob";

import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroMobilidade,
  exigirGerenciamentoMobilidade,
  respostaErroMobilidade,
} from "@/lib/mobilidade-acesso";

import {
  extensaoMobilidadePermitida,
  LIMITE_ARQUIVO_MOBILIDADE_BYTES,
  limparNomeArquivoMobilidade,
  mimeEsperadoMobilidade,
  mimeMobilidadePermitido,
  obterExtensaoArquivoMobilidade,
  obterTokenMobilidadeBlob,
  prefixoDocumentoMobilidade,
} from "@/lib/mobilidade-storage";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

const TRINTA_MINUTOS_MS =
  30 * 60 * 1000;

type PayloadCliente = {
  nomeOriginal: string;
  mimeType: string;
  tamanhoBytes: number;
  validadeAte?: string | null;
};

type PayloadToken = {
  instituicaoId: number;
  candidaturaId: number;
  documentoId: number;
  usuarioId: number | null;

  nomeOriginal: string;
  mimeType: string;
  tamanhoDeclaradoBytes: number;

  validadeAte:
    | string
    | null;
};

function idValido(
  valor: string
) {
  const id =
    Number(
      valor
    );

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

function lerPayloadCliente(
  valor: string | null
): PayloadCliente {
  let bruto: unknown;

  try {
    bruto =
      JSON.parse(
        String(
          valor || "{}"
        )
      );
  } catch {
    throw new ErroMobilidade(
      400,
      "UPLOAD_DADOS_INVALIDOS",
      "Dados do upload inválidos."
    );
  }

  if (
    !bruto ||
    typeof bruto !==
      "object"
  ) {
    throw new ErroMobilidade(
      400,
      "UPLOAD_DADOS_INVALIDOS",
      "Dados do upload inválidos."
    );
  }

  const objeto =
    bruto as Record<
      string,
      unknown
    >;

  const nomeOriginal =
    typeof objeto.nomeOriginal ===
      "string"
      ? objeto.nomeOriginal.trim()
      : "";

  const mimeType =
    typeof objeto.mimeType ===
      "string"
      ? objeto.mimeType
          .trim()
          .toLowerCase()
      : "";

  const tamanhoBytes =
    Number(
      objeto.tamanhoBytes
    );

  const validadeAte =
    objeto.validadeAte ===
        null ||
      objeto.validadeAte ===
        undefined ||
      objeto.validadeAte ===
        ""
      ? null
      : (
          typeof objeto.validadeAte ===
            "string"
            ? objeto.validadeAte
            : undefined
        );

  if (
    !nomeOriginal ||
    nomeOriginal.length >
      250
  ) {
    throw new ErroMobilidade(
      400,
      "ARQUIVO_NOME_INVALIDO",
      "Nome do arquivo inválido."
    );
  }

  if (
    !Number.isInteger(
      tamanhoBytes
    ) ||
    tamanhoBytes <=
      0
  ) {
    throw new ErroMobilidade(
      400,
      "ARQUIVO_TAMANHO_INVALIDO",
      "Tamanho do arquivo inválido."
    );
  }

  if (
    tamanhoBytes >
    LIMITE_ARQUIVO_MOBILIDADE_BYTES
  ) {
    throw new ErroMobilidade(
      413,
      "ARQUIVO_MUITO_GRANDE",
      "O arquivo ultrapassa o limite permitido."
    );
  }

  if (
    validadeAte ===
    undefined
  ) {
    throw new ErroMobilidade(
      400,
      "VALIDADE_INVALIDA",
      "Data de validade inválida."
    );
  }

  if (
    validadeAte &&
    !/^\d{4}-\d{2}-\d{2}$/.test(
      validadeAte
    )
  ) {
    throw new ErroMobilidade(
      400,
      "VALIDADE_INVALIDA",
      "Data de validade inválida."
    );
  }

  return {
    nomeOriginal,
    mimeType,
    tamanhoBytes,
    validadeAte,
  };
}

function lerPayloadToken(
  valor: string | null
): PayloadToken {
  let bruto: unknown;

  try {
    bruto =
      JSON.parse(
        String(
          valor || "{}"
        )
      );
  } catch {
    throw new Error(
      "Token de upload inválido."
    );
  }

  if (
    !bruto ||
    typeof bruto !==
      "object"
  ) {
    throw new Error(
      "Token de upload inválido."
    );
  }

  const dados =
    bruto as PayloadToken;

  if (
    !Number.isInteger(
      dados.instituicaoId
    ) ||
    !Number.isInteger(
      dados.candidaturaId
    ) ||
    !Number.isInteger(
      dados.documentoId
    ) ||
    !dados.nomeOriginal ||
    !dados.mimeType ||
    !Number.isInteger(
      dados.tamanhoDeclaradoBytes
    )
  ) {
    throw new Error(
      "Token de upload inválido."
    );
  }

  return dados;
}

function dataValidade(
  valor:
    | string
    | null
) {
  if (!valor) {
    return null;
  }

  const data =
    new Date(
      `${valor}T00:00:00.000Z`
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    throw new ErroMobilidade(
      400,
      "VALIDADE_INVALIDA",
      "Data de validade inválida."
    );
  }

  return data;
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
      documentoId: string;
    };
  }
) {
  try {
    const candidaturaId =
      idValido(
        params.id
      );

    const documentoId =
      idValido(
        params.documentoId
      );

    if (
      !candidaturaId ||
      !documentoId
    ) {
      throw new ErroMobilidade(
        400,
        "ID_INVALIDO",
        "Identificação inválida."
      );
    }

    let token: string;

    try {
      token =
        obterTokenMobilidadeBlob();
    } catch {
      throw new ErroMobilidade(
        503,
        "BLOB_NAO_CONFIGURADO",
        "O armazenamento privado da Mobilidade Internacional não está configurado."
      );
    }

    const body =
      (await request.json()) as
        HandleUploadBody;

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

            const instituicaoId =
              exigirGerenciamentoMobilidade(
                usuario,
                "mobilidade.candidaturas.gerenciar"
              );

            const documento =
              await prisma.mobilidadeCandidaturaDocumento.findFirst({
                where: {
                  id:
                    documentoId,

                  candidaturaId,

                  instituicaoId,
                },

                select: {
                  id: true,
                  exigeValidade:
                    true,

                  candidatura: {
                    select: {
                      id: true,
                    },
                  },
                },
              });

            if (
              !documento
            ) {
              throw new ErroMobilidade(
                404,
                "DOCUMENTO_NAO_ENCONTRADO",
                "Documento da candidatura não encontrado."
              );
            }

            const dados =
              lerPayloadCliente(
                clientPayload
              );

            const extensao =
              obterExtensaoArquivoMobilidade(
                dados.nomeOriginal
              );

            if (
              !extensaoMobilidadePermitida(
                extensao
              )
            ) {
              throw new ErroMobilidade(
                400,
                "ARQUIVO_FORMATO_INVALIDO",
                "Formato de arquivo não permitido."
              );
            }

            const mimeType =
              dados.mimeType ||
              mimeEsperadoMobilidade(
                extensao
              ) ||
              "";

            if (
              !mimeMobilidadePermitido(
                mimeType,
                extensao
              )
            ) {
              throw new ErroMobilidade(
                400,
                "ARQUIVO_FORMATO_INVALIDO",
                "Formato de arquivo não permitido."
              );
            }

            if (
              documento.exigeValidade &&
              !dados.validadeAte
            ) {
              throw new ErroMobilidade(
                400,
                "VALIDADE_OBRIGATORIA",
                "Informe a validade deste documento."
              );
            }

            const prefixo =
              prefixoDocumentoMobilidade({
                instituicaoId,
                candidaturaId,
                documentoId,
              });

            const nomeSeguro =
              limparNomeArquivoMobilidade(
                dados.nomeOriginal
              );

            const esperado =
              `${prefixo}/${nomeSeguro}`;

            if (
              pathname !==
              esperado
            ) {
              throw new ErroMobilidade(
                400,
                "CAMINHO_UPLOAD_INVALIDO",
                "Caminho de upload inválido."
              );
            }

            const tokenPayload:
              PayloadToken = {
              instituicaoId,
              candidaturaId,
              documentoId,

              usuarioId:
                usuario?.id ??
                null,

              nomeOriginal:
                dados.nomeOriginal,

              mimeType,

              tamanhoDeclaradoBytes:
                dados.tamanhoBytes,

              validadeAte:
                dados.validadeAte ??
                null,
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
              prefixoDocumentoMobilidade({
                instituicaoId:
                  dados.instituicaoId,

                candidaturaId:
                  dados.candidaturaId,

                documentoId:
                  dados.documentoId,
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

            const detalhes =
              await head(
                blob.pathname,
                {
                  token,
                }
              );

            const tamanhoReal =
              Number(
                detalhes.size
              );

            if (
              !Number.isSafeInteger(
                tamanhoReal
              ) ||
              tamanhoReal <=
                0
            ) {
              throw new Error(
                "O arquivo enviado está vazio ou possui tamanho inválido."
              );
            }

            if (
              tamanhoReal >
                dados.tamanhoDeclaradoBytes ||
              tamanhoReal >
                LIMITE_ARQUIVO_MOBILIDADE_BYTES
            ) {
              throw new Error(
                "O arquivo recebido ultrapassa o tamanho autorizado."
              );
            }

            const contentType =
              (
                detalhes.contentType ||
                dados.mimeType
              )
                .trim()
                .toLowerCase();

            const extensao =
              obterExtensaoArquivoMobilidade(
                dados.nomeOriginal
              );

            if (
              !mimeMobilidadePermitido(
                contentType,
                extensao
              )
            ) {
              throw new Error(
                "O tipo real do arquivo recebido não é permitido."
              );
            }

            const validadeAte =
              dataValidade(
                dados.validadeAte
              );

            const atual =
              await prisma.mobilidadeCandidaturaDocumento.findFirst({
                where: {
                  id:
                    dados.documentoId,

                  candidaturaId:
                    dados.candidaturaId,

                  instituicaoId:
                    dados.instituicaoId,
                },

                select: {
                  id: true,
                  arquivoUrl: true,
                  exigeValidade:
                    true,
                },
              });

            if (!atual) {
              throw new Error(
                "Documento da candidatura não encontrado."
              );
            }

            /*
             * Callback do Blob pode ser reenviado.
             * Se este mesmo Blob já foi gravado,
             * não alteramos novamente o status.
             */
            if (
              atual.arquivoUrl ===
              blob.url
            ) {
              return;
            }

            if (
              atual.exigeValidade &&
              !validadeAte
            ) {
              throw new Error(
                "A validade obrigatória do documento não foi informada."
              );
            }

            const urlAnterior =
              atual.arquivoUrl;

            await prisma.mobilidadeCandidaturaDocumento.update({
              where: {
                id:
                  atual.id,
              },

              data: {
                arquivoUrl:
                  blob.url,

                arquivoNome:
                  dados.nomeOriginal,

                mimeType:
                  contentType,

                tamanho:
                  tamanhoReal,

                validadeAte,

                status:
                  MobilidadeStatusDocumento.ENVIADO,

                enviadoEm:
                  new Date(),

                analisadoEm:
                  null,

                analisadoPorId:
                  null,

                motivoRejeicao:
                  null,

                observacoes:
                  null,
              },
            });

            /*
             * Em reenvio, o novo arquivo só
             * substitui o anterior depois de
             * o banco confirmar a atualização.
             */
            if (
              urlAnterior &&
              urlAnterior !==
                blob.url
            ) {
              try {
                await del(
                  urlAnterior,
                  {
                    token,
                  }
                );
              } catch (
                erro
              ) {
                console.error(
                  "[mobilidade] Falha ao remover Blob anterior:",
                  erro
                );
              }
            }
          },
      });

    return NextResponse.json(
      resposta
    );
  } catch (erro) {
    const resposta =
      respostaErroMobilidade(
        erro
      );

    return NextResponse.json(
      resposta.corpo,
      {
        status:
          resposta.status,
      }
    );
  }
}
