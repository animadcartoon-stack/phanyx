import { PDFDocument } from "pdf-lib";
import { abrirBrowserPuppeteer } from "@/lib/certificados/puppeteer-browser";
import { criarTokenRenderCrachaLote } from "@/lib/crachas/cracha-render-token";

type GerarCrachaVisualPdfLoteParams = {
  crachaEmitidoIds: number[];
  origin: string;
  larguraMm: number;
  alturaMm: number;
  possuiVerso: boolean;
};

const QUANTIDADE_POR_BLOCO = 50;
const LIMITE_TOTAL_CRACHAS = 1000;

function numeroPositivo(
  valor: unknown,
  padrao: number
) {
  const numero = Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero <= 0
  ) {
    return padrao;
  }

  return numero;
}

function normalizarIds(idsRecebidos: number[]) {
  const ids: number[] = [];
  const encontrados = new Set<number>();

  for (const valor of idsRecebidos) {
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

  if (ids.length === 0) {
    throw new Error(
      "Nenhum crachá válido foi informado para gerar o PDF."
    );
  }

  if (ids.length > LIMITE_TOTAL_CRACHAS) {
    throw new Error(
      `O lote pode conter no máximo ${LIMITE_TOTAL_CRACHAS} crachás.`
    );
  }

  return ids;
}

function dividirEmBlocos(
  ids: number[],
  tamanho: number
) {
  const blocos: number[][] = [];

  for (
    let inicio = 0;
    inicio < ids.length;
    inicio += tamanho
  ) {
    blocos.push(
      ids.slice(inicio, inicio + tamanho)
    );
  }

  return blocos;
}

async function aguardarRenderizacao(
  page: any
) {
  try {
    await page.waitForFunction(
      () => {
        const documento =
          document.documentElement.dataset;

        return (
          documento.crachaRenderPronto ===
            "true" ||
          Boolean(documento.crachaRenderErro)
        );
      },
      {
        polling: 100,
        timeout: 60000,
      }
    );
  } catch {
    throw new Error(
      "A renderização de um bloco do lote excedeu o tempo permitido."
    );
  }

  const estado = await page.evaluate(() => ({
    pronto:
      document.documentElement.dataset
        .crachaRenderPronto === "true",
    erro:
      document.documentElement.dataset
        .crachaRenderErro || "",
    paginas: document.querySelectorAll(
      "[data-cracha-pagina]"
    ).length,
  }));

  if (estado.erro) {
    throw new Error(estado.erro);
  }

  if (!estado.pronto) {
    throw new Error(
      "O bloco do lote não concluiu a renderização."
    );
  }

  return Number(estado.paginas || 0);
}

export async function gerarCrachaVisualPdfLote({
  crachaEmitidoIds,
  origin,
  larguraMm,
  alturaMm,
  possuiVerso,
}: GerarCrachaVisualPdfLoteParams) {
  const ids = normalizarIds(
    crachaEmitidoIds
  );

  const larguraFinalMm = numeroPositivo(
    larguraMm,
    54
  );

  const alturaFinalMm = numeroPositivo(
    alturaMm,
    86
  );

  const blocos = dividirEmBlocos(
    ids,
    QUANTIDADE_POR_BLOCO
  );

  const pdfFinal = await PDFDocument.create();
  const browser = await abrirBrowserPuppeteer();

  try {
    const page = await browser.newPage();

    const larguraViewport =
      larguraFinalMm > alturaFinalMm
        ? 760
        : 480;

    const alturaViewport =
      larguraFinalMm > alturaFinalMm
        ? 480
        : 760;

    await page.setViewport({
      width: larguraViewport,
      height: alturaViewport,
      deviceScaleFactor: 2,
    });

    await page.emulateMediaType("print");

    for (
      let indice = 0;
      indice < blocos.length;
      indice++
    ) {
      const idsBloco = blocos[indice];
      const token =
        criarTokenRenderCrachaLote(idsBloco);

      const url = new URL(
        "/crachas/render/lote",
        origin
      );

      url.searchParams.set(
        "ids",
        idsBloco.join(",")
      );

      url.searchParams.set("t", token);

      await page.goto(url.toString(), {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      const paginasEncontradas =
        await aguardarRenderizacao(page);

      const paginasEsperadas =
        idsBloco.length *
        (possuiVerso ? 2 : 1);

      if (
        paginasEncontradas !==
        paginasEsperadas
      ) {
        throw new Error(
          `O bloco ${indice + 1} deveria gerar ${paginasEsperadas} páginas, mas gerou ${paginasEncontradas}.`
        );
      }

      const pdfBloco = await page.pdf({
        printBackground: true,
        width: `${larguraFinalMm}mm`,
        height: `${alturaFinalMm}mm`,
        margin: {
          top: "0mm",
          right: "0mm",
          bottom: "0mm",
          left: "0mm",
        },
        preferCSSPageSize: true,
      });

      const documentoBloco =
        await PDFDocument.load(pdfBloco);

      const indicesPaginas =
        documentoBloco.getPageIndices();

      const paginasCopiadas =
        await pdfFinal.copyPages(
          documentoBloco,
          indicesPaginas
        );

      for (const pagina of paginasCopiadas) {
        pdfFinal.addPage(pagina);
      }
    }

    pdfFinal.setTitle(
      `Lote de ${ids.length} crachás`
    );

    pdfFinal.setProducer("PHANYX");
    pdfFinal.setCreator("PHANYX");

    const resultado = await pdfFinal.save({
      useObjectStreams: true,
    });

    return Buffer.from(resultado);
  } finally {
    await browser.close().catch(() => null);
  }
}