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
  LIMITE_ARQUIVO_MOBILIDADE_BYTES,
  mimeMobilidadePermitido,
  obterExtensaoArquivoMobilidade,
  obterStoreIdMobilidadeBlob,
  prefixoDocumentoMobilidade,
} from "@/lib/mobilidade-storage";

import { prisma } from "@/lib/prisma";
import { ErroMobilidade } from "@/lib/mobilidade-acesso";
import { contextoDocumentoMobilidade, type PortalDocumentoMobilidade } from "@/lib/mobilidade-documentos-contexto";

type CorpoFinalizar = {
  pathname?: unknown;
  nomeOriginal?: unknown;
  validadeAte?: unknown;
};

function idValido(valor: string) {
  const id =
    Number(valor);

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

function respostaErro(
  codigo: string,
  mensagem: string,
  status: number
) {
  return NextResponse.json(
    {
      ok: false,
      codigo,
      mensagem,
    },
    {
      status,
    }
  );
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
    return undefined;
  }

  const data =
    new Date(
      `${valor}T00:00:00.000Z`
    );

  return Number.isNaN(
    data.getTime()
  )
    ? undefined
    : data;
}

export async function finalizarUploadDocumentoMobilidade(
  request: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
      documentoId: string;
    };
  },
  portal: PortalDocumentoMobilidade,
) {
  try {
    if (portal === "PROFESSOR" && (
      request.headers.get("sec-fetch-site") === "cross-site" ||
      !request.headers.get("content-type")?.startsWith("application/json")
    )) {
      return respostaErro("NAO_AUTORIZADO", "Não autorizado.", 403);
    }
    const { instituicaoId, candidatura } = await contextoDocumentoMobilidade(portal);

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
      return respostaErro(
        "ID_INVALIDO",
        "Identificação inválida.",
        400
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
      return respostaErro(
        "UPLOAD_DADOS_INVALIDOS",
        "Dados de conclusão do upload inválidos.",
        400
      );
    }

    const documento =
      await prisma.mobilidadeCandidaturaDocumento.findFirst({
        where: {
          id:
            documentoId,

          candidaturaId,

          instituicaoId:
            instituicaoId,

          candidatura,
        },

        select: {
          id: true,
          status: true,
          exigeValidade:
            true,

          arquivoUrl:
            true,
        },
      });

    if (!documento) {
      return respostaErro(
        "DOCUMENTO_NAO_ENCONTRADO",
        "Documento não encontrado.",
        404
      );
    }

    if (
      documento.status ===
        "APROVADO" ||
      documento.status ===
        "EM_ANALISE"
    ) {
      return respostaErro(
        "DOCUMENTO_NAO_EDITAVEL",
        "Este documento não pode ser substituído enquanto estiver aprovado ou em análise.",
        409
      );
    }

    const prefixo =
      prefixoDocumentoMobilidade({
        instituicaoId:
          instituicaoId,

        candidaturaId,
        documentoId,
      });

    if (
      !pathname.startsWith(
        `${prefixo}/`
      )
    ) {
      return respostaErro(
        "CAMINHO_UPLOAD_INVALIDO",
        "O arquivo não pertence a este documento.",
        400
      );
    }

    const validadeAte =
      dataValidade(
        corpo.validadeAte
      );

    if (
      validadeAte ===
      undefined
    ) {
      return respostaErro(
        "VALIDADE_INVALIDA",
        "Data de validade inválida.",
        400
      );
    }

    if (
      documento.exigeValidade &&
      !validadeAte
    ) {
      return respostaErro(
        "VALIDADE_OBRIGATORIA",
        "Informe a validade deste documento.",
        400
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

      return respostaErro(
        "ARQUIVO_TAMANHO_INVALIDO",
        "O arquivo armazenado possui tamanho inválido.",
        400
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

      return respostaErro(
        "ARQUIVO_FORMATO_INVALIDO",
        "O tipo do arquivo armazenado não é permitido.",
        400
      );
    }

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

    const alteracao = await prisma.mobilidadeCandidaturaDocumento.updateMany({
      where: {
        id: documento.id,
        instituicaoId,
        candidatura,
        arquivoUrl: arquivoAnterior,
        status: { notIn: ["APROVADO", "EM_ANALISE"] },
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

    if (alteracao.count === 0) {
      const atual = await prisma.mobilidadeCandidaturaDocumento.findFirst({
        where: { id: documento.id, instituicaoId, candidatura },
        select: { arquivoUrl: true },
      });
      if (atual?.arquivoUrl === detalhes.url) {
        return NextResponse.json({ ok: true });
      }
      return respostaErro("DOCUMENTO_NAO_EDITAVEL", "O documento foi alterado. Atualize a página e tente novamente.", 409);
    }

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
          "[mobilidade] Falha ao remover arquivo anterior:",
          erro
        );
      }
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (erro) {
    if (erro instanceof ErroMobilidade) {
      return respostaErro(erro.codigo, erro.message, erro.status);
    }

    console.error(
      "[mobilidade/upload/finalizar] Erro:",
      erro
    );

    return respostaErro(
      "ERRO_INTERNO",
      "Não foi possível concluir o envio do arquivo.",
      500
    );
  }
}
