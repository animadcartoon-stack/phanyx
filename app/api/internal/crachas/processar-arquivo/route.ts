import { handleCallback } from "@vercel/queue";
import {
  processarArquivoEmissaoMassiva,
  registrarFalhaDefinitivaArquivo,
} from "@/lib/crachas/processar-arquivo-emissao-massiva";
import type { MensagemArquivoCracha } from "@/lib/crachas/fila-emissao-massiva";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const LIMITE_TENTATIVAS = 5;

function obterOriginAplicacao() {
  const configurado =
    process.env.CRACHA_RENDER_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim();

  if (configurado) {
    return configurado.replace(/\/+$/, "");
  }

  const dominioVercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (dominioVercel) {
    return `https://${dominioVercel.replace(
      /^https?:\/\//,
      ""
    )}`;
  }

  return "http://localhost:3000";
}

function normalizarMensagem(
  valor: unknown
): MensagemArquivoCracha {
  const mensagem =
    valor as Partial<MensagemArquivoCracha>;

  const loteId = Number(
    mensagem?.loteId
  );

  const arquivoId = Number(
    mensagem?.arquivoId
  );

  if (
    !Number.isInteger(loteId) ||
    loteId <= 0
  ) {
    throw new Error(
      "A mensagem da fila possui um lote inválido."
    );
  }

  if (
    !Number.isInteger(arquivoId) ||
    arquivoId <= 0
  ) {
    throw new Error(
      "A mensagem da fila possui um arquivo inválido."
    );
  }

  return {
    loteId,
    arquivoId,
  };
}

const processarCallback = handleCallback(
  async (message, metadata) => {
    const mensagem =
      normalizarMensagem(message);

    try {
      await processarArquivoEmissaoMassiva({
        loteId: mensagem.loteId,
        arquivoId: mensagem.arquivoId,
        origin: obterOriginAplicacao(),
      });
    } catch (error) {
      const quantidadeEntregas =
        Number(
          metadata.deliveryCount || 1
        );

      if (
        quantidadeEntregas >=
        LIMITE_TENTATIVAS
      ) {
        await registrarFalhaDefinitivaArquivo(
          mensagem.loteId,
          mensagem.arquivoId,
          error
        );

        return;
      }

      throw error;
    }
  },
  {
    retry: (_error, metadata) => {
      const quantidadeEntregas =
        Math.max(
          1,
          Number(
            metadata.deliveryCount || 1
          )
        );

      const esperaSegundos = Math.min(
        300,
        30 *
          Math.pow(
            2,
            quantidadeEntregas - 1
          )
      );

      return {
        afterSeconds: esperaSegundos,
      };
    },
  }
);

export async function POST(
  request: Request
): Promise<Response> {
  return processarCallback(request);
}