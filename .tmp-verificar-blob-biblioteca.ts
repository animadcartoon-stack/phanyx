import { loadEnvConfig } from "@next/env";
import { head, list } from "@vercel/blob";

loadEnvConfig(process.cwd(), true);

async function main() {
  const token =
    process.env.BIBLIOTECA_BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      "BIBLIOTECA_BLOB_READ_WRITE_TOKEN não foi carregado."
    );
  }

  const esperado =
    "biblioteca/instituicao-1/item-1/matriz-curricular-por-modulo-2026-1-nova-309ngidi1WuZGwVd-1-PPABiqKbYltoClPCLMgIOdEAJFKmG4.pdf";

  const prefixo =
    "biblioteca/instituicao-1/item-1/";

  console.log(
    JSON.stringify(
      {
        tokenCarregado: true,
        tamanhoToken: token.length,
        storeIdCarregado:
          Boolean(
            process.env.BIBLIOTECA_BLOB_STORE_ID
          ),
      },
      null,
      2
    )
  );

  try {
    const detalhes = await head(
      esperado,
      {
        token,
      }
    );

    console.log(
      "\nHEAD:",
      JSON.stringify(
        {
          encontrado: true,
          pathname:
            detalhes.pathname,
          tamanho:
            detalhes.size,
          contentType:
            detalhes.contentType,
        },
        null,
        2
      )
    );
  } catch (erro) {
    console.log(
      "\nHEAD_ERRO:",
      erro instanceof Error
        ? `${erro.name}: ${erro.message}`
        : String(erro)
    );
  }

  try {
    const resultado = await list({
      token,
      prefix: prefixo,
      limit: 1000,
    });

    console.log(
      "\nLIST:",
      JSON.stringify(
        {
          quantidade:
            resultado.blobs.length,

          arquivoEsperadoEncontrado:
            resultado.blobs.some(
              (blob) =>
                blob.pathname ===
                esperado
            ),

          arquivos:
            resultado.blobs.map(
              (blob) => ({
                pathname:
                  blob.pathname,
                tamanho:
                  blob.size,
              })
            ),
        },
        null,
        2
      )
    );
  } catch (erro) {
    console.log(
      "\nLIST_ERRO:",
      erro instanceof Error
        ? `${erro.name}: ${erro.message}`
        : String(erro)
    );
  }
}

main().catch((erro) => {
  console.error(
    "ERRO_TESTE:",
    erro
  );

  process.exitCode = 1;
});
