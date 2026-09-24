import {
  MobilidadeStatusDocumento,
} from "@prisma/client";

import {
  del,
  head,
} from "@vercel/blob";

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
  LIMITE_ARQUIVO_MOBILIDADE_BYTES,
  mimeMobilidadePermitido,
  obterExtensaoArquivoMobilidade,
  obterStoreIdMobilidadeBlob,
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

type CorpoFinalizar = {
  pathname?: unknown;
  nomeOriginal?: unknown;
  validadeAte?: unknown;
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

function dataValidade(
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
    typeof valor !==
      "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      valor
    )
  ) {
    throw new ErroMobilidade(
      400,
      "VALIDADE_INVALIDA",
      "Data de validade inválida."
    );
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

    const corpo =
      (await request.json()) as
        CorpoFinalizar;

    const pathname =
      typeof corpo.pathname ===
        "string"
        ? corpo.pathname.trim()
        : "";

    const nomeOriginal =
      typeof corpo.nomeOriginal ===
        "string"
        ? corpo.nomeOriginal.trim()
        : "";

    if (
      !pathname ||
      !nomeOriginal
    ) {
      throw new ErroMobilidade(
        400,
        "UPLOAD_DADOS_INVALIDOS",
        "Dados de conclusão do upload inválidos."
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
          exigeValidade:
            true,

          arquivoUrl:
            true,
        },
      });

    if (!documento) {
      throw new ErroMobilidade(
        404,
        "DOCUMENTO_NAO_ENCONTRADO",
        "Documento da candidatura não encontrado."
      );
    }

    const prefixo =
      prefixoDocumentoMobilidade({
        instituicaoId,
        candidaturaId,
        documentoId,
      });

    if (
      !pathname.startsWith(
        `${prefixo}/`
      )
    ) {
      throw new ErroMobilidade(
        400,
        "CAMINHO_UPLOAD_INVALIDO",
        "O arquivo não pertence a este documento."
      );
    }

    const validadeAte =
      dataValidade(
        corpo.validadeAte
      );

    if (
      documento.exigeValidade &&
      !validadeAte
    ) {
      throw new ErroMobilidade(
        400,
        "VALIDADE_OBRIGATORIA",
        "Informe a validade deste documento."
      );
    }

    const storeId =
      obterStoreIdMobilidadeBlob();

    const detalhes =
      await head(
        pathname,
        {
          storeId,
        }
      );

    const tamanho =
      Number(
        detalhes.size
      );

    if (
      !Number.isSafeInteger(
        tamanho
      ) ||
      tamanho <= 0 ||
      tamanho >
        LIMITE_ARQUIVO_MOBILIDADE_BYTES
    ) {
      try {
        await del(
          pathname,
          {
            storeId,
          }
        );
      } catch {}

      throw new ErroMobilidade(
        400,
        "ARQUIVO_TAMANHO_INVALIDO",
        "O arquivo armazenado possui tamanho inválido."
      );
    }

    const extensao =
      obterExtensaoArquivoMobilidade(
        nomeOriginal
      );

    const mimeType =
      String(
        detalhes.contentType ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      !mimeMobilidadePermitido(
        mimeType,
        extensao
      )
    ) {
      try {
        await del(
          pathname,
          {
            storeId,
          }
        );
      } catch {}

      throw new ErroMobilidade(
        400,
        "ARQUIVO_FORMATO_INVALIDO",
        "O tipo do arquivo armazenado não é permitido."
      );
    }

    /*
     * Idempotência:
     * se este mesmo arquivo já foi finalizado,
     * não retrocedemos seu status.
     */
    if (
      documento.arquivoUrl ===
      detalhes.url
    ) {
      return NextResponse.json({
        ok: true,
      });
    }

    const arquivoAnterior =
      documento.arquivoUrl;

    await prisma.mobilidadeCandidaturaDocumento.update({
      where: {
        id:
          documento.id,
      },

      data: {
        arquivoUrl:
          detalhes.url,

        arquivoNome:
          nomeOriginal,

        mimeType,

        tamanho,

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

    if (
      arquivoAnterior &&
      arquivoAnterior !==
        detalhes.url
    ) {
      try {
        await del(
          arquivoAnterior,
          {
            storeId,
          }
        );
      } catch (
        erro
      ) {
        console.error(
          "[mobilidade] Não foi possível remover o arquivo anterior:",
          erro
        );
      }
    }

    return NextResponse.json({
      ok: true,
    });
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
