import crypto from "node:crypto";

const LIMITE_CRACHAS_POR_BLOCO_RENDER = 50;

function segredoRenderCracha() {
  const segredo =
    process.env.CRACHA_RENDER_SECRET ||
    process.env.CERTIFICADO_RENDER_SECRET ||
    process.env.JWT_SECRET;

  if (!segredo) {
    throw new Error(
      "CRACHA_RENDER_SECRET, CERTIFICADO_RENDER_SECRET ou JWT_SECRET não configurado."
    );
  }

  return segredo;
}

function criarAssinatura(valor: string) {
  return crypto
    .createHmac("sha256", segredoRenderCracha())
    .update(valor)
    .digest("hex");
}

function compararTokenSeguro(
  tokenEsperado: string,
  tokenRecebido?: string | null
) {
  if (!tokenRecebido) return false;

  const esperado = Buffer.from(tokenEsperado);
  const recebido = Buffer.from(tokenRecebido);

  if (esperado.length !== recebido.length) {
    return false;
  }

  return crypto.timingSafeEqual(esperado, recebido);
}

export function criarTokenRenderCracha(
  crachaEmitidoId: number | string
) {
  return criarAssinatura(String(crachaEmitidoId));
}

export function validarTokenRenderCracha(
  crachaEmitidoId: number | string,
  tokenRecebido?: string | null
) {
  return compararTokenSeguro(
    criarTokenRenderCracha(crachaEmitidoId),
    tokenRecebido
  );
}

export function normalizarIdsRenderCrachaLote(
  valores: Array<number | string>
) {
  const ids: number[] = [];
  const encontrados = new Set<number>();

  for (const valor of valores) {
    const id = Number(valor);

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      encontrados.has(id)
    ) {
      continue;
    }

    encontrados.add(id);
    ids.push(id);
  }

  return ids.slice(0, LIMITE_CRACHAS_POR_BLOCO_RENDER);
}

function chaveRenderCrachaLote(
  crachaEmitidoIds: Array<number | string>
) {
  const ids = normalizarIdsRenderCrachaLote(
    crachaEmitidoIds
  );

  if (ids.length === 0) {
    throw new Error(
      "Nenhum crachá válido foi informado para renderização do lote."
    );
  }

  return `lote:${ids.join(",")}`;
}

export function criarTokenRenderCrachaLote(
  crachaEmitidoIds: Array<number | string>
) {
  return criarAssinatura(
    chaveRenderCrachaLote(crachaEmitidoIds)
  );
}

export function validarTokenRenderCrachaLote(
  crachaEmitidoIds: Array<number | string>,
  tokenRecebido?: string | null
) {
  try {
    return compararTokenSeguro(
      criarTokenRenderCrachaLote(crachaEmitidoIds),
      tokenRecebido
    );
  } catch {
    return false;
  }
}