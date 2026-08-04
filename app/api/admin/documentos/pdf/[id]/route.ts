import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import QRCode from "qrcode";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import fs from "node:fs";

import {
  montarRenderizacaoDocumento,
  resolverUrlDocumento,
} from "@/lib/documentos/renderizador-template-documento";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const maxDuration = 60;

const CHROMIUM_PACK =
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar";

function gerarCodigoValidacao(
  documentoId: number,
  criadoEm?: Date | string | null
) {
  const dataBase = criadoEm
    ? new Date(criadoEm)
    : new Date();

  const ano = dataBase.getFullYear();

  const mes = String(
    dataBase.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    dataBase.getDate()
  ).padStart(2, "0");

  const hora = String(
    dataBase.getHours()
  ).padStart(2, "0");

  const minuto = String(
    dataBase.getMinutes()
  ).padStart(2, "0");

  return `PHANYX-${ano}${mes}${dia}-${documentoId}-${hora}${minuto}`;
}

async function imagemParaDataUri(
  url?: string | null
) {
  try {
    if (!url) {
      return "";
    }

    const resposta = await fetch(
      url,
      {
        cache: "no-store",
      }
    );

    if (!resposta.ok) {
      return "";
    }

    const tipo =
      resposta.headers.get(
        "content-type"
      ) || "image/png";

    const bytes = Buffer.from(
      await resposta.arrayBuffer()
    );

    return `data:${tipo};base64,${bytes.toString(
      "base64"
    )}`;
  } catch (error) {
    console.error(
      "Não foi possível carregar imagem do documento:",
      error
    );

    return "";
  }
}

function localizarChromeLocal() {
  const caminhos = [
    process.env
      .CHROME_EXECUTABLE_PATH,

    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",

    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",

    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",

    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(
    (valor): valor is string =>
      Boolean(valor)
  );

  return (
    caminhos.find((caminho) =>
      fs.existsSync(caminho)
    ) || null
  );
}

async function abrirNavegador() {
  const chromeLocal =
    localizarChromeLocal();

  if (
    process.env.NODE_ENV !==
    "production" &&
    chromeLocal
  ) {
    return puppeteer.launch({
      executablePath:
        chromeLocal,

      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  }

  return puppeteer.launch({
    args: chromium.args,

    executablePath:
      await chromium.executablePath(
        CHROMIUM_PACK
      ),

    headless: true,
  });
}

async function aguardarRecursosDaPagina(
  page: Awaited<
    ReturnType<
      Awaited<
        ReturnType<
          typeof abrirNavegador
        >
      >["newPage"]
    >
  >
) {
  await page.evaluate(
    async () => {
      const imagens = Array.from(
        document.images
      );

      await Promise.all(
        imagens.map(
          (imagem) => {
            if (imagem.complete) {
              return Promise.resolve();
            }

            return new Promise<void>(
              (resolve) => {
                imagem.addEventListener(
                  "load",
                  () => resolve(),
                  {
                    once: true,
                  }
                );

                imagem.addEventListener(
                  "error",
                  () => resolve(),
                  {
                    once: true,
                  }
                );
              }
            );
          }
        )
      );

      await document.fonts.ready;
    }
  );
}

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  let browser:
    Awaited<
      ReturnType<
        typeof puppeteer.launch
      >
    > | null = null;

  try {
    const user =
      await getUserFromToken();

    if (
      !user ||
      user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Sem permissão",
        },
        {
          status: 403,
        }
      );
    }

    const id = Number(
      params.id
    );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "ID do documento inválido",
        },
        {
          status: 400,
        }
      );
    }

    const doc =
      await prisma.documentoGerado.findFirst({
        where: {
          id,

          instituicaoId:
            user.instituicaoId,
        },

        include: {
          instituicao: {
            include: {
              configuracaoInstituicao:
                true,
            },
          },

          template: true,
        },
      });

    if (!doc) {
      return NextResponse.json(
        {
          error:
            "Documento não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const config =
      doc.instituicao
        ?.configuracaoInstituicao;

    const configDocumento =
      config as any;

    const origem =
      new URL(req.url).origin;

    const nomeInstituicao =
      config?.nomeFantasia ||
      doc.instituicao?.nome ||
      "Instituição";

    const cnpj =
      config?.cnpj || null;

    const telefone =
      config?.telefone || null;

    const email =
      config?.email || null;

    const cidade =
      config?.cidade || null;

    const estado =
      config?.estado || null;

    const responsavelNome =
      configDocumento
        ?.responsavelNome ||
      "Responsável legal";

    const responsavelCargo =
      configDocumento
        ?.responsavelCargo ||
      configDocumento
        ?.cargoResponsavel ||
      "Representante legal";

    const logoUrl =
      resolverUrlDocumento(
        config?.logoUrl,
        origem
      );

    const assinaturaUrl =
      resolverUrlDocumento(
        configDocumento
          ?.certificadoAssinaturaUrl,
        origem
      );

    const papelTimbradoUrl =
      resolverUrlDocumento(
        config?.papelTimbradoUrl,
        origem
      );

    const [
      logoDataUri,
      assinaturaDataUri,
      papelTimbradoDataUri,
    ] = await Promise.all([
      imagemParaDataUri(
        logoUrl
      ),

      imagemParaDataUri(
        assinaturaUrl
      ),

      imagemParaDataUri(
        papelTimbradoUrl
      ),
    ]);

    const codigoValidacao =
      doc.codigoValidacao ||
      gerarCodigoValidacao(
        doc.id,
        doc.criadoEm
      );

    if (!doc.codigoValidacao) {
      await prisma.documentoGerado.update({
        where: {
          id: doc.id,
        },

        data: {
          codigoValidacao,
        },
      });
    }

    const linkValidacao =
      `${origem}/validar-documento?codigo=${encodeURIComponent(
        codigoValidacao
      )}`;

    const qrCodeDataUri =
      await QRCode.toDataURL(
        linkValidacao,
        {
          margin: 1,
          width: 300,
        }
      );

    const formatoImpressao =
      doc.formatoImpressao ===
        "DUAS_VIAS_A4" ||
        doc.quantidadeVias === 2 ||
        doc.template
          ?.formatoImpressao ===
        "DUAS_VIAS_A4"
        ? "DUAS_VIAS_A4"
        : "A4_INTEIRA";

    const conteudoDocumento =
      String(
        doc.conteudo ||
        doc.template?.conteudo ||
        ""
      ).trim();

    if (!conteudoDocumento) {
      return NextResponse.json(
        {
          error:
            "O documento não possui conteúdo para impressão.",
        },
        {
          status: 400,
        }
      );
    }

    const renderizacao =
      montarRenderizacaoDocumento({
        conteudo:
          conteudoDocumento,

        formatoImpressao,

        modoPrevia: false,

        mostrarValidacao: true,

        tituloDocumento:
          doc.titulo,

        instituicao: {
          nome:
            nomeInstituicao,

          cnpj,

          telefone,

          email,

          cidade,

          estado,

          responsavelNome,

          responsavelCargo,

          logoUrl:
            logoDataUri ||
            logoUrl ||
            null,

          logoDataUri:
            logoDataUri ||
            null,

          assinaturaDiretorUrl:
            assinaturaDataUri ||
            assinaturaUrl ||
            null,

          papelTimbradoUrl:
            papelTimbradoDataUri ||
            papelTimbradoUrl ||
            null,

          usarPapelTimbrado:
            Boolean(
              config
                ?.usarPapelTimbrado
            ),

          estiloPapelTimbrado:
            config
              ?.estiloPapelTimbrado ||
            null,
        },

        validacao: {
          codigo:
            codigoValidacao,

          emitidoEm:
            new Date(
              doc.criadoEm
            ).toLocaleString(
              "pt-BR"
            ),

          qrCodeDataUri,
        },
      });

    browser =
      await abrirNavegador();

    const page =
      await browser.newPage();

    await page.setContent(
      renderizacao.html,
      {
        waitUntil:
          "domcontentloaded",

        timeout: 30000,
      }
    );

    await page.emulateMediaType(
      "print"
    );

    await aguardarRecursosDaPagina(
      page
    );

    if (
  formatoImpressao ===
  "DUAS_VIAS_A4"
) {
  const ajusteDuasVias =
    await page.evaluate(
      async () => {
        const areas =
          Array.from(
            document.querySelectorAll<HTMLElement>(
              ".phanyx-via-conteudo-area"
            )
          );

        if (
          areas.length === 0
        ) {
          return {
            cabe: true,
            menorZoomNecessario: 1,
          };
        }

        const zoomsNecessarios:
          number[] = [];

        for (
          const area of areas
        ) {
          const conteudo =
            area.querySelector<HTMLElement>(
              ".phanyx-conteudo-compacto"
            );

          if (!conteudo) {
            continue;
          }

          /*
           * Primeiro mede o conteúdo
           * em tamanho natural.
           */
          conteudo.style.zoom =
            "1";

          conteudo.style.width =
            "100%";

          void conteudo.offsetHeight;

          const alturaDisponivel =
            Math.max(
              area.clientHeight - 8,
              1
            );

          const alturaNatural =
            Math.max(
              conteudo.scrollHeight,
              1
            );

          /*
           * Calcula automaticamente
           * a redução necessária para
           * caber na metade da folha.
           */
          const zoomNecessario =
            Math.min(
              0.82,
              (
                alturaDisponivel /
                alturaNatural
              ) * 0.96
            );

          zoomsNecessarios.push(
            zoomNecessario
          );

          /*
           * Não deixa o documento
           * ilegível. O limite mínimo
           * aplicado é de 50%.
           */
          const zoomAplicado =
            Math.max(
              0.5,
              zoomNecessario
            );

          conteudo.style.zoom =
            String(
              zoomAplicado
            );

          /*
           * Compensa a largura reduzida
           * pelo zoom para aproveitar
           * toda a área horizontal.
           */
          conteudo.style.width =
            `${100 / zoomAplicado}%`;
        }

        /*
         * Aguarda o navegador recalcular
         * o layout depois da nova escala.
         */
        await new Promise<void>(
          (resolve) => {
            requestAnimationFrame(
              () => {
                requestAnimationFrame(
                  () => resolve()
                );
              }
            );
          }
        );

        const houveCorte =
          areas.some(
            (area) => {
              const conteudo =
                area.querySelector<HTMLElement>(
                  ".phanyx-conteudo-compacto"
                );

              if (!conteudo) {
                return false;
              }

              const areaRect =
                area.getBoundingClientRect();

              const conteudoRect =
                conteudo.getBoundingClientRect();

              return (
                conteudoRect.bottom >
                areaRect.bottom + 4
              );
            }
          );

        const menorZoomNecessario =
          zoomsNecessarios.length >
          0
            ? Math.min(
                ...zoomsNecessarios
              )
            : 1;

        return {
          cabe:
            !houveCorte &&
            menorZoomNecessario >=
              0.5,

          menorZoomNecessario,
        };
      }
    );

  if (
    !ajusteDuasVias.cabe
  ) {
    return NextResponse.json(
      {
        error:
          "O conteúdo é extenso demais para duas vias legíveis na mesma folha A4. Selecione uma via ou reduza o conteúdo do template.",
      },
      {
        status: 400,
      }
    );
  }
}

    const pdfBytes =
      await page.pdf(
        renderizacao.pdfOptions
      );

    const sufixo =
      formatoImpressao ===
        "DUAS_VIAS_A4"
        ? "-duas-vias"
        : "";

    return new Response(
      Buffer.from(pdfBytes),
      {
        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            `inline; filename="documento-${doc.id}${sufixo}.pdf"`,

          "Cache-Control":
            "no-store, no-cache, must-revalidate",

          Pragma:
            "no-cache",

          Expires:
            "0",
        },
      }
    );
  } catch (error: any) {
    console.error(
      "Erro ao gerar PDF do documento:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao gerar PDF",
      },
      {
        status: 500,
      }
    );
  } finally {
    if (browser) {
      await browser
        .close()
        .catch(() => null);
    }
  }
}