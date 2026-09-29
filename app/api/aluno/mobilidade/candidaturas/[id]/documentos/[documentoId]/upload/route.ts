import {
  randomUUID,
} from "node:crypto";

import {
  issueSignedToken,
  presignUrl,
} from "@vercel/blob";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  extensaoMobilidadePermitida,
  LIMITE_ARQUIVO_MOBILIDADE_BYTES,
  limparNomeArquivoMobilidade,
  mimeEsperadoMobilidade,
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

const DEZ_MINUTOS_MS =
  10 * 60 * 1000;

type CorpoUpload = {
  nomeOriginal?: unknown;
  mimeType?: unknown;
  tamanhoBytes?: unknown;
  validadeAte?: unknown;
};

function idValido(
  valor: string
) {
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

function lerDados(
  corpo: CorpoUpload
) {
  const nomeOriginal =
    typeof corpo.nomeOriginal ===
      "string"
      ? corpo.nomeOriginal.trim()
      : "";

  const mimeInformado =
    typeof corpo.mimeType ===
      "string"
      ? corpo.mimeType
          .trim()
          .toLowerCase()
      : "";

  const tamanhoBytes =
    Number(
      corpo.tamanhoBytes
    );

  const validadeAte =
    corpo.validadeAte ===
        undefined ||
      corpo.validadeAte ===
        null ||
      corpo.validadeAte ===
        ""
      ? null
      : (
          typeof corpo.validadeAte ===
            "string"
            ? corpo.validadeAte
            : undefined
        );

  return {
    nomeOriginal,
    mimeInformado,
    tamanhoBytes,
    validadeAte,
  };
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

    if (
      !usuario ||
      String(
        usuario.role || ""
      ).toUpperCase() !==
        "ALUNO" ||
      !usuario.instituicaoId
    ) {
      return respostaErro(
        "NAO_AUTORIZADO",
        "Não autorizado.",
        401
      );
    }

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

    const aluno =
      await prisma.aluno.findFirst({
        where: {
          userId:
            usuario.id,

          instituicaoId:
            usuario.instituicaoId,
        },

        select: {
          id: true,
        },
      });

    if (!aluno) {
      return respostaErro(
        "ALUNO_NAO_ENCONTRADO",
        "Aluno não encontrado.",
        404
      );
    }

    const documento =
      await prisma.mobilidadeCandidaturaDocumento.findFirst({
        where: {
          id:
            documentoId,

          candidaturaId,

          instituicaoId:
            usuario.instituicaoId,

          candidatura: {
            alunoId:
              aluno.id,

            instituicaoId:
              usuario.instituicaoId,

            vinculoCandidato:
              "ALUNO_PHANYX",
          },
        },

        select: {
          id: true,
          status: true,
          exigeValidade:
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

    const corpo =
      (await request.json()) as
        CorpoUpload;

    const dados =
      lerDados(
        corpo
      );

    if (
      !dados.nomeOriginal ||
      dados.nomeOriginal.length >
        250
    ) {
      return respostaErro(
        "ARQUIVO_NOME_INVALIDO",
        "Nome do arquivo inválido.",
        400
      );
    }

    if (
      !Number.isInteger(
        dados.tamanhoBytes
      ) ||
      dados.tamanhoBytes <=
        0
    ) {
      return respostaErro(
        "ARQUIVO_TAMANHO_INVALIDO",
        "Tamanho do arquivo inválido.",
        400
      );
    }

    if (
      dados.tamanhoBytes >
      LIMITE_ARQUIVO_MOBILIDADE_BYTES
    ) {
      return respostaErro(
        "ARQUIVO_MUITO_GRANDE",
        "O arquivo ultrapassa o limite de 25 MB.",
        413
      );
    }

    if (
      dados.validadeAte ===
      undefined
    ) {
      return respostaErro(
        "VALIDADE_INVALIDA",
        "Data de validade inválida.",
        400
      );
    }

    if (
      dados.validadeAte &&
      !/^\d{4}-\d{2}-\d{2}$/.test(
        dados.validadeAte
      )
    ) {
      return respostaErro(
        "VALIDADE_INVALIDA",
        "Data de validade inválida.",
        400
      );
    }

    if (
      documento.exigeValidade &&
      !dados.validadeAte
    ) {
      return respostaErro(
        "VALIDADE_OBRIGATORIA",
        "Informe a validade deste documento.",
        400
      );
    }

    const extensao =
      obterExtensaoArquivoMobilidade(
        dados.nomeOriginal
      );

    if (
      !extensaoMobilidadePermitida(
        extensao
      )
    ) {
      return respostaErro(
        "ARQUIVO_FORMATO_INVALIDO",
        "Formato de arquivo não permitido.",
        400
      );
    }

    const mimeType =
      dados.mimeInformado ||
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
      return respostaErro(
        "ARQUIVO_FORMATO_INVALIDO",
        "Formato de arquivo não permitido.",
        400
      );
    }

    let storeId:
      string;

    try {
      storeId =
        obterStoreIdMobilidadeBlob();
    } catch {
      return respostaErro(
        "BLOB_NAO_CONFIGURADO",
        "O armazenamento da Mobilidade não está configurado.",
        503
      );
    }

    const prefixo =
      prefixoDocumentoMobilidade({
        instituicaoId:
          usuario.instituicaoId,

        candidaturaId,
        documentoId,
      });

    const nomeSeguro =
      limparNomeArquivoMobilidade(
        dados.nomeOriginal
      );

    const pathname =
      `${prefixo}/${randomUUID()}-${nomeSeguro}`;

    const validUntil =
      Date.now() +
      DEZ_MINUTOS_MS;

    const token =
      await issueSignedToken({
        storeId,

        pathname,

        operations: [
          "put",
        ],

        validUntil,

        allowedContentTypes: [
          mimeType,
        ],

        maximumSizeInBytes:
          dados.tamanhoBytes,
      });

    const {
      presignedUrl,
    } =
      await presignUrl(
        token,
        {
          pathname,

          operation:
            "put",

          access:
            "private",

          validUntil,

          allowedContentTypes: [
            mimeType,
          ],

          maximumSizeInBytes:
            dados.tamanhoBytes,

          addRandomSuffix:
            false,

          allowOverwrite:
            false,
        }
      );

    return NextResponse.json({
      ok: true,

      presignedUrl,
      pathname,
      mimeType,
      validadeAte:
        dados.validadeAte,
    });
  } catch (erro) {
    console.error(
      "[aluno/mobilidade/upload] Erro:",
      erro
    );

    return respostaErro(
      "ERRO_INTERNO",
      "Não foi possível autorizar o envio do arquivo.",
      500
    );
  }
}
