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
    Number(
      valor
    );

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
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
      "O arquivo ultrapassa o limite de 25 MB."
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
          exigeValidade:
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

    const corpo =
      (await request.json()) as
        CorpoUpload;

    const dados =
      lerDados(
        corpo
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

    let storeId: string;

    try {
      storeId =
        obterStoreIdMobilidadeBlob();
    } catch {
      throw new ErroMobilidade(
        503,
        "BLOB_NAO_CONFIGURADO",
        "O armazenamento privado da Mobilidade não está configurado."
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

    /*
     * Nós mesmos geramos o sufixo aleatório.
     * Assim o signed token fica restrito
     * a um pathname exato.
     */
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

      validUntil,

      mimeType,

      validadeAte:
        dados.validadeAte,
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
