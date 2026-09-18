import {
  MobilidadeStatusCandidatura,
  MobilidadeStatusDocumento,
} from "@prisma/client";

import {
  del,
  put,
} from "@vercel/blob";

import { randomUUID } from "crypto";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroMobilidade,
  exigirGerenciamentoMobilidade,
  respostaErroMobilidade,
} from "@/lib/mobilidade-acesso";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIMITE_BYTES =
  4 * 1024 * 1024;

const TIPOS_PERMITIDOS =
  new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/heic",
    "image/heif",
  ]);

function idValido(
  valor: string
) {
  const id = Number(valor);

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

function nomeSeguro(
  nome: string
) {
  const limpo =
    nome
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  return (
    limpo ||
    "documento"
  );
}

function extensaoDoNome(
  nome: string
) {
  const match =
    nome
      .trim()
      .toLowerCase()
      .match(/\.([a-z0-9]+)$/);

  return match?.[1] ?? "";
}

function mimeEfetivo(
  arquivo: File
) {
  const declarado =
    String(
      arquivo.type || ""
    )
      .trim()
      .toLowerCase();

  if (
    declarado ===
    "image/heic-sequence"
  ) {
    return "image/heic";
  }

  if (
    declarado ===
    "image/heif-sequence"
  ) {
    return "image/heif";
  }

  if (
    TIPOS_PERMITIDOS.has(
      declarado
    )
  ) {
    return declarado;
  }

  if (
    !declarado ||
    declarado ===
      "application/octet-stream"
  ) {
    switch (
      extensaoDoNome(
        arquivo.name
      )
    ) {
      case "pdf":
        return "application/pdf";

      case "jpg":
      case "jpeg":
        return "image/jpeg";

      case "png":
        return "image/png";

      case "heic":
        return "image/heic";

      case "heif":
        return "image/heif";
    }
  }

  return declarado;
}

function extensaoPorMime(
  mime: string
) {
  switch (mime) {
    case "application/pdf":
      return "pdf";

    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/heic":
      return "heic";

    case "image/heif":
      return "heif";

    default:
      return null;
  }
}

function assinaturaValida(
  buffer: Buffer,
  mime: string
) {
  if (
    mime ===
    "application/pdf"
  ) {
    return (
      buffer.length >= 5 &&
      buffer
        .subarray(0, 5)
        .toString("ascii") ===
        "%PDF-"
    );
  }

  if (
    mime === "image/png"
  ) {
    const assinatura =
      Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
      ]);

    return (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(assinatura)
    );
  }

  if (
    mime === "image/jpeg"
  ) {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (
    mime === "image/heic" ||
    mime === "image/heif"
  ) {
    if (
      buffer.length < 16 ||
      buffer
        .subarray(4, 8)
        .toString("ascii") !==
        "ftyp"
    ) {
      return false;
    }

    const cabecalho =
      buffer
        .subarray(
          8,
          Math.min(
            buffer.length,
            96
          )
        )
        .toString("ascii");

    const marcas = [
      "heic",
      "heix",
      "hevc",
      "hevx",
      "heim",
      "heis",
      "hevm",
      "hevs",
      "mif1",
      "msf1",
    ];

    return marcas.some(
      (marca) =>
        cabecalho.includes(
          marca
        )
    );
  }

  return false;
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
      documentoId: string;
    };
  }
) {
  let novaUrl:
    | string
    | null = null;

  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirGerenciamentoMobilidade(
        usuario,
        "mobilidade.candidaturas.gerenciar"
      );

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
          arquivoUrl: true,
          obrigatorio: true,
        },
      });

    if (!documento) {
      throw new ErroMobilidade(
        404,
        "DOCUMENTO_NAO_ENCONTRADO",
        "Documento da candidatura não encontrado."
      );
    }
const storeId =
      process.env
        .MOBILIDADE_STORE_ID
        ?.trim();

    if (!storeId) {
      throw new ErroMobilidade(
        500,
        "STORAGE_MOBILIDADE_NAO_CONFIGURADO",
        "O armazenamento privado da Mobilidade Internacional não está configurado."
      );
    }

    const formData =
      await req.formData();

    const valorArquivo =
      formData.get(
        "arquivo"
      );

    if (
      !(valorArquivo instanceof File)
    ) {
      throw new ErroMobilidade(
        400,
        "ARQUIVO_OBRIGATORIO",
        "Selecione um arquivo."
      );
    }

    const arquivo =
      valorArquivo;

    if (
      arquivo.size <= 0
    ) {
      throw new ErroMobilidade(
        400,
        "ARQUIVO_VAZIO",
        "O arquivo selecionado está vazio."
      );
    }

    if (
      arquivo.size >
      LIMITE_BYTES
    ) {
      throw new ErroMobilidade(
        400,
        "ARQUIVO_MUITO_GRANDE",
        "O arquivo deve possuir no máximo 4 MB."
      );
    }

    const mime =
      mimeEfetivo(
        arquivo
      );

    if (
      !TIPOS_PERMITIDOS.has(
        mime
      )
    ) {
      throw new ErroMobilidade(
        400,
        "TIPO_ARQUIVO_INVALIDO",
        "Envie um arquivo PDF, PNG, JPG/JPEG, HEIC ou HEIF."
      );
    }

    const extensao =
      extensaoPorMime(
        mime
      );

    if (!extensao) {
      throw new ErroMobilidade(
        400,
        "TIPO_ARQUIVO_INVALIDO",
        "Tipo de arquivo inválido."
      );
    }

    const buffer =
      Buffer.from(
        await arquivo.arrayBuffer()
      );

    if (
      !assinaturaValida(
        buffer,
        mime
      )
    ) {
      throw new ErroMobilidade(
        400,
        "CONTEUDO_ARQUIVO_INVALIDO",
        "O conteúdo do arquivo não corresponde ao tipo informado."
      );
    }

    const caminho =
      [
        "mobilidade",
        String(
          instituicaoId
        ),
        "candidaturas",
        String(
          candidaturaId
        ),
        "documentos",
        String(
          documentoId
        ),
        `${randomUUID()}.${extensao}`,
      ].join("/");

    const blob =
      await put(
        caminho,
        buffer,
        {
          access:
            "private",
          storeId,
contentType:
            mime,

          addRandomSuffix:
            false,
        }
      );

    novaUrl =
      blob.url;

    const atualizado =
      await prisma.$transaction(
        async (tx) => {
          const documentoAtualizado =
            await tx.mobilidadeCandidaturaDocumento.update({
              where: {
                id:
                  documento.id,
              },

              data: {
                arquivoUrl:
                  blob.url,

                arquivoNome:
                  nomeSeguro(
                    arquivo.name
                  ).slice(
                    0,
                    255
                  ),

                mimeType:
                  mime,

                tamanho:
                  arquivo.size,

                enviadoEm:
                  new Date(),

                status:
                  MobilidadeStatusDocumento.ENVIADO,

                validadeAte:
                  null,

                analisadoEm:
                  null,

                analisadoPorId:
                  null,

                motivoRejeicao:
                  null,

                observacoes:
                  null,
              },

              select: {
                id: true,
                arquivoNome: true,
                mimeType: true,
                tamanho: true,
                enviadoEm: true,
                status: true,
              },
            });

          /*
           * Qualquer novo arquivo de um
           * requisito obrigatorio precisa
           * passar por nova analise.
           *
           * Se a candidatura ja estava
           * aprovada, ela deixa de poder
           * permanecer aprovada.
           */
          if (
            documento.obrigatorio
          ) {
            await tx.mobilidadeCandidatura.updateMany({
              where: {
                id:
                  candidaturaId,

                instituicaoId,

                status:
                  MobilidadeStatusCandidatura.APROVADA,
              },

              data: {
                status:
                  MobilidadeStatusCandidatura.DOCUMENTACAO_PENDENTE,
              },
            });
          }

          return documentoAtualizado;
        }
      );

    /*
     * O banco já aponta para o
     * novo arquivo. Agora tentamos
     * remover a versão anterior.
     */
    if (
      documento.arquivoUrl &&
      documento.arquivoUrl !==
        blob.url
    ) {
      await del(
        documento.arquivoUrl,
        {
          storeId,
}
      ).catch(
        (erro) => {
          console.error(
            "Não foi possível remover a versão anterior do documento de mobilidade:",
            erro
          );
        }
      );
    }

    return NextResponse.json({
      ok: true,
      documento:
        atualizado,
    });
  } catch (erro) {
    /*
     * Se o Blob foi criado mas
     * houve erro antes da gravação
     * definitiva no banco, evita
     * deixar arquivo órfão.
     */
    if (novaUrl) {
      const storeId =
      process.env
        .MOBILIDADE_STORE_ID
        ?.trim();

      if (storeId) {
        await del(
          novaUrl,
          {
            storeId,
}
        ).catch(
          () => undefined
        );
      }
    }

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
