import {
  get,
  put,
} from "@vercel/blob";

type ArmazenarPdfCrachaLoteParams = {
  instituicaoId: number;
  loteId: number;
  numeroArquivo: number;
  pdfBuffer: Buffer;
};

function obterConfiguracaoArmazenamento() {
  const storeId =
    process.env.CRACHAS_STORE_ID?.trim() ||
    process.env.RH_PONTO_STORE_ID?.trim();

  const token =
    process.env.CRACHAS_READ_WRITE_TOKEN?.trim() ||
    process.env.RH_PONTO_READ_WRITE_TOKEN?.trim();

  if (!storeId || !token) {
    throw new Error(
      "O armazenamento privado dos crachás não está configurado."
    );
  }

  return {
    storeId,
    token,
  };
}

function validarId(
  valor: unknown,
  campo: string
) {
  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    throw new Error(
      `${campo} inválido para armazenamento do PDF de crachás.`
    );
  }

  return numero;
}

export async function armazenarPdfCrachaLote({
  instituicaoId,
  loteId,
  numeroArquivo,
  pdfBuffer,
}: ArmazenarPdfCrachaLoteParams) {
  const instituicaoIdValido = validarId(
    instituicaoId,
    "Instituição"
  );

  const loteIdValido = validarId(
    loteId,
    "Lote"
  );

  const numeroArquivoValido = validarId(
    numeroArquivo,
    "Número do arquivo"
  );

  if (
    !Buffer.isBuffer(pdfBuffer) ||
    pdfBuffer.length === 0
  ) {
    throw new Error(
      "O PDF do lote está vazio e não pode ser armazenado."
    );
  }

  const { storeId, token } =
    obterConfiguracaoArmazenamento();

  const numeroFormatado = String(
    numeroArquivoValido
  ).padStart(4, "0");

  const pathname = [
    "crachas",
    `instituicoes/${instituicaoIdValido}`,
    `lotes/${loteIdValido}`,
    `arquivo-${numeroFormatado}.pdf`,
  ].join("/");

  const blob = await put(
    pathname,
    pdfBuffer,
    {
      access: "private",
      storeId,
      token,
      contentType: "application/pdf",
      addRandomSuffix: false,
      allowOverwrite: true,
    }
  );

  return {
    url: blob.url,
    pathname: blob.pathname,
    tamanhoBytes: BigInt(
      pdfBuffer.length
    ),
  };
}

export async function obterPdfCrachaPrivado(
  url: string
) {
  const urlValida = String(
    url || ""
  ).trim();

  if (!urlValida) {
    throw new Error(
      "A URL do PDF de crachás não foi informada."
    );
  }

  const { token } =
    obterConfiguracaoArmazenamento();

  const resultado = await get(
    urlValida,
    {
      access: "private",
      token,
      useCache: false,
    }
  );

  if (
    !resultado ||
    resultado.statusCode !== 200 ||
    !resultado.stream
  ) {
    throw new Error(
      "O PDF privado de crachás não foi encontrado."
    );
  }

  return resultado.stream;
}