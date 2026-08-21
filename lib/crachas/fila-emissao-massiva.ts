import { send } from "@vercel/queue";

export const TOPICO_CRACHAS_EMISSAO_MASSIVA =
  "phanyx-crachas-emissao-massiva";

export type MensagemArquivoCracha = {
  loteId: number;
  arquivoId: number;
};

function validarId(valor: unknown, campo: string) {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error(`${campo} inválido para a fila de crachás.`);
  }

  return numero;
}

export async function enfileirarArquivoCracha(
  mensagem: MensagemArquivoCracha
) {
  const loteId = validarId(mensagem.loteId, "Lote");
  const arquivoId = validarId(mensagem.arquivoId, "Arquivo");

  return send(
    TOPICO_CRACHAS_EMISSAO_MASSIVA,
    {
      loteId,
      arquivoId,
    },
    {
      idempotencyKey:
        `cracha-lote-${loteId}-arquivo-${arquivoId}`,
      retentionSeconds: 86400,
    }
  );
}