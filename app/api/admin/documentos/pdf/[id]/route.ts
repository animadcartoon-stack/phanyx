import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import QRCode from "qrcode";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import fs from "node:fs";

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

function escaparHtml(valor: unknown) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizarHtmlTemplate(
  html: string
) {
  return String(html || "")
    .replace(
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      ""
    )
    .replace(
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      ""
    )
    .replace(
      /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
      ""
    )
    .replace(
      /<embed[\s\S]*?>/gi,
      ""
    )
    .replace(
      /\son[a-z]+\s*=\s*"[^"]*"/gi,
      ""
    )
    .replace(
      /\son[a-z]+\s*=\s*'[^']*'/gi,
      ""
    )
    .replace(
      /javascript:/gi,
      ""
    );
}

function resolverUrlAbsoluta(
  valor: unknown,
  origem: string
) {
  const url = String(
    valor ?? ""
  ).trim();

  if (!url) {
    return "";
  }

  try {
    return new URL(
      url,
      `${origem}/`
    ).toString();
  } catch {
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

function inserirAssinaturasNoHtml({
  conteudo,
  assinaturaUrl,
  nomeResponsavel,
  cargoResponsavel,
  nomeInstituicao,
  cnpj,
}: {
  conteudo: string;
  assinaturaUrl: string;
  nomeResponsavel: string;
  cargoResponsavel: string;
  nomeInstituicao: string;
  cnpj: string;
}) {
  const imagemAssinatura =
    assinaturaUrl
      ? `
        <span class="phanyx-assinatura-somente">
          <img
            src="${escaparHtml(
        assinaturaUrl
      )}"
            alt="Assinatura do diretor"
          />
        </span>
      `
      : "";

  const blocoAssinatura = `
    <span class="phanyx-bloco-assinatura">
      ${assinaturaUrl
      ? `
            <img
              src="${escaparHtml(
        assinaturaUrl
      )}"
              alt="Assinatura do diretor"
            />
          `
      : ""
    }

      <span class="phanyx-linha-assinatura"></span>

      <strong>
        ${escaparHtml(
      nomeResponsavel
    )}
      </strong>

      <span>
        ${escaparHtml(
      cargoResponsavel
    )}
      </span>

      <span>
        ${escaparHtml(
      nomeInstituicao
    )}
      </span>

      ${cnpj && cnpj !== "-"
      ? `
            <span>
              CNPJ:
              ${escaparHtml(cnpj)}
            </span>
          `
      : ""
    }
    </span>
  `;

  return String(
    conteudo || ""
  )
    .replaceAll(
      "__PHANYX_ASSINATURA_DIRETOR__",
      imagemAssinatura
    )
    .replaceAll(
      "__PHANYX_BLOCO_ASSINATURA_DIRETOR__",
      blocoAssinatura
    )
    .replace(
      /{{\s*assinaturaDiretor\s*}}/g,
      imagemAssinatura
    )
    .replace(
      /{{\s*blocoAssinaturaDiretor\s*}}/g,
      blocoAssinatura
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

    const id =
      Number(params.id);

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

    const origem =
      new URL(req.url).origin;

    const nomeInstituicao =
      config?.nomeFantasia ||
      doc.instituicao?.nome ||
      "Instituição";

    const cnpj =
      config?.cnpj || "-";

    const telefone =
      config?.telefone || "";

    const email =
      config?.email || "";

    const nomeResponsavel =
      config?.responsavelNome ||
      "Responsável legal";

    const cargoResponsavel =
      config?.responsavelCargo ||
      "Representante legal";

    const logoUrl =
      resolverUrlAbsoluta(
        config?.logoUrl,
        origem
      );

    const assinaturaUrl =
      resolverUrlAbsoluta(
        config?.certificadoAssinaturaUrl,
        origem
      );

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

    const qrCodeDataUrl =
      await QRCode.toDataURL(
        linkValidacao,
        {
          margin: 1,
          width: 300,
        }
      );

    const duasVias =
      doc.formatoImpressao ===
      "DUAS_VIAS_A4" ||
      doc.quantidadeVias === 2;

    const conteudoComAssinaturas =
      inserirAssinaturasNoHtml({
        conteudo:
          doc.conteudo || "",

        assinaturaUrl,

        nomeResponsavel,

        cargoResponsavel,

        nomeInstituicao,

        cnpj,
      });

    const conteudoFinal =
      sanitizarHtmlTemplate(
        conteudoComAssinaturas
      );

    const logoHtml =
      logoUrl
        ? `
          <img
            class="logo-instituicao"
            src="${escaparHtml(
          logoUrl
        )}"
            alt="Logo da instituição"
          />
        `
        : "";

    function montarVia(
      rotuloVia: string,
      compacta: boolean
    ) {
      return `
        <section
          class="via ${compacta
          ? "duas"
          : "unica"
        }"
        >
          <header class="cabecalho">
            <div class="identidade">
              ${logoHtml}

              <div class="dados-instituicao">
                <strong>
                  ${escaparHtml(
          nomeInstituicao
        )}
                </strong>

                <span>
                  CNPJ:
                  ${escaparHtml(cnpj)}
                </span>
              </div>
            </div>

            ${rotuloVia
          ? `
                  <span class="rotulo-via">
                    ${escaparHtml(
            rotuloVia
          )}
                  </span>
                `
          : ""
        }
          </header>

          <main class="conteudo-area">
            <div class="conteudo-escalado">
              <article class="template-content">
                ${conteudoFinal}
              </article>
            </div>
          </main>

          <footer class="validacao">
            <div class="validacao-texto">
              <strong>
                VALIDAÇÃO DO DOCUMENTO
              </strong>

              <span>
                Código:
                ${escaparHtml(
          codigoValidacao
        )}
              </span>

              <span>
                Emitido em:
                ${escaparHtml(
          new Date(
            doc.criadoEm
          ).toLocaleString(
            "pt-BR"
          )
        )}
              </span>

              <span>
                Documento gerado pelo PHANYX
              </span>
            </div>

            <img
              class="qr-code"
              src="${qrCodeDataUrl}"
              alt="QR Code de validação"
            />
          </footer>
        </section>
      `;
    }

    const corpoDocumento =
      duasVias
        ? `
          <div class="folha duas-vias">
            ${montarVia(
          "VIA DO INTERESSADO",
          true
        )}

            ${montarVia(
          "VIA DA INSTITUIÇÃO",
          true
        )}

            <div class="linha-corte">
              <span>
                LINHA DE CORTE
              </span>
            </div>
          </div>
        `
        : `
          <div class="folha">
            ${montarVia(
          "",
          false
        )}
          </div>
        `;

    const htmlCompleto = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />

          <base
            href="${escaparHtml(
      `${origem}/`
    )}"
          />

          <style>
            @page {
              size: A4;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: 210mm;
              background: #ffffff;
              color: #111827;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
              -webkit-print-color-adjust:
                exact;
              print-color-adjust:
                exact;
            }

            .folha {
              position: relative;
              width: 210mm;
              height: 297mm;
              overflow: hidden;
              background: #ffffff;
            }

            .via {
              display: grid;
              width: 100%;
              overflow: hidden;
              background: #ffffff;
            }

            .via.unica {
              height: 297mm;
              grid-template-rows:
                24mm
                minmax(0, 1fr)
                27mm;
              gap: 4mm;
              padding:
                11mm
                15mm
                9mm;
            }

            .via.duas {
              height: 148.5mm;
              grid-template-rows:
                15mm
                minmax(0, 1fr)
                19mm;
              gap: 2.5mm;
              padding:
                6mm
                10mm
                5mm;
            }

            .cabecalho {
              display: flex;
              align-items: center;
              justify-content:
                space-between;
              gap: 6mm;
              border-bottom:
                0.3mm solid #cbd5e1;
              padding-bottom: 2.5mm;
              min-width: 0;
            }

            .identidade {
              display: flex;
              align-items: center;
              gap: 3mm;
              min-width: 0;
            }

            .logo-instituicao {
              width: 15mm;
              height: 15mm;
              object-fit: contain;
              flex-shrink: 0;
            }

            .duas
            .logo-instituicao {
              width: 11mm;
              height: 11mm;
            }

            .dados-instituicao {
              display: flex;
              flex-direction: column;
              min-width: 0;
            }

            .dados-instituicao
            strong {
              font-size: 11pt;
              line-height: 1.15;
            }

            .dados-instituicao
            span {
              margin-top: 1mm;
              font-size: 7.5pt;
              color: #475569;
            }

            .duas
            .dados-instituicao
            strong {
              font-size: 8.5pt;
            }

            .duas
            .dados-instituicao
            span {
              font-size: 6.5pt;
            }

            .rotulo-via {
              flex-shrink: 0;
              font-size: 7pt;
              font-weight: 800;
              color: #1e3a5f;
              letter-spacing: 0.04em;
            }

            .conteudo-area {
              min-height: 0;
              overflow: hidden;
            }

            .conteudo-escalado {
              width: 100%;
              transform-origin:
                top left;
            }

            .duas
            .conteudo-escalado {
              zoom: 0.78;
              width: 128.2%;
            }

            .template-content {
              width: 100%;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
              font-size: 12pt;
              line-height: 1.45;
              overflow-wrap: anywhere;
              word-break: normal;
            }

            .template-content p {
              margin:
                0
                0
                8pt;
            }

            .template-content p:last-child {
              margin-bottom: 0;
            }

            .template-content h1 {
              margin:
                0
                0
                12pt;
              font-size: 20pt;
              line-height: 1.2;
            }

            .template-content h2 {
              margin:
                0
                0
                10pt;
              font-size: 16pt;
              line-height: 1.25;
            }

            .template-content h3 {
              margin:
                0
                0
                8pt;
              font-size: 14pt;
              line-height: 1.3;
            }

            .template-content ul,
            .template-content ol {
              margin:
                0
                0
                8pt
                20pt;
              padding: 0;
            }

            .template-content table {
              width: 100%;
              border-collapse:
                collapse;
            }

            .template-content th,
            .template-content td {
              border:
                1px solid #cbd5e1;
              padding: 5px;
              vertical-align: top;
            }

            .template-content img {
              max-width: 100%;
              object-fit: contain;
            }

            .phanyx-assinatura-somente {
              display: block;
              width: 60mm;
              min-height: 16mm;
              margin:
                4mm auto
                0;
              text-align: center;
            }

            .phanyx-assinatura-somente
            img {
              width: 45mm;
              height: 15mm;
              object-fit: contain;
            }

            .phanyx-bloco-assinatura {
              display: flex;
              width: 75mm;
              margin:
                6mm auto
                0;
              flex-direction: column;
              align-items: center;
              text-align: center;
              font-size: 9pt;
              line-height: 1.25;
            }

            .phanyx-bloco-assinatura
            img {
              width: 45mm;
              height: 15mm;
              object-fit: contain;
              margin-bottom: -1mm;
            }

            .phanyx-linha-assinatura {
              display: block;
              width: 70mm;
              border-top:
                0.3mm solid #111827;
              margin-bottom: 1.5mm;
            }

            .phanyx-bloco-assinatura
            strong,
            .phanyx-bloco-assinatura
            span {
              display: block;
            }

            .validacao {
              display: flex;
              align-items: center;
              justify-content:
                space-between;
              gap: 4mm;
              border:
                0.3mm solid #cbd5e1;
              border-radius: 2mm;
              padding: 3mm;
              background: #f8fafc;
            }

            .validacao-texto {
              display: flex;
              min-width: 0;
              flex-direction: column;
              gap: 1mm;
              font-size: 7pt;
              color: #475569;
            }

            .validacao-texto
            strong {
              color: #1e3a5f;
              font-size: 7.5pt;
            }

            .qr-code {
              width: 19mm;
              height: 19mm;
              flex-shrink: 0;
            }

            .duas
            .validacao {
              padding: 2mm;
            }

            .duas
            .validacao-texto {
              font-size: 5.7pt;
              gap: 0.6mm;
            }

            .duas
            .validacao-texto
            strong {
              font-size: 6.2pt;
            }

            .duas
            .qr-code {
              width: 13mm;
              height: 13mm;
            }

            .linha-corte {
              position: absolute;
              z-index: 20;
              top: 148.5mm;
              left: 5mm;
              right: 5mm;
              height: 0;
              border-top:
                0.3mm dashed #64748b;
              text-align: center;
            }

            .linha-corte span {
              position: relative;
              top: -2.4mm;
              padding:
                0
                2mm;
              background: #ffffff;
              color: #64748b;
              font-size: 5.5pt;
              letter-spacing:
                0.08em;
            }
          </style>
        </head>

        <body>
          ${corpoDocumento}
        </body>
      </html>
    `;

    browser =
      await abrirNavegador();

    const page =
      await browser.newPage();

    await page.setContent(
      htmlCompleto,
      {
        waitUntil:
          "domcontentloaded",

        timeout: 30000,
      }
    );

    await page.emulateMediaType(
      "print"
    );

    await page.evaluate(
      async () => {
        const imagens =
          Array.from(
            document.images
          );

        await Promise.all(
          imagens.map(
            (imagem) => {
              if (
                imagem.complete
              ) {
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

    const houveEstouro =
      await page.evaluate(() => {
        const areas =
          Array.from(
            document.querySelectorAll<HTMLElement>(
              ".conteudo-area"
            )
          );

        return areas.some(
          (area) =>
            area.scrollHeight >
            area.clientHeight + 3
        );
      });

    if (houveEstouro) {
      return NextResponse.json(
        {
          error:
            duasVias
              ? "O conteúdo não cabe em duas vias na mesma folha A4. Escolha uma via ou reduza o conteúdo do template."
              : "O conteúdo não cabe na área disponível da folha A4. Reduza o conteúdo ou o tamanho da fonte no template.",
        },
        {
          status: 400,
        }
      );
    }

    const pdfBytes =
      await page.pdf({
        format: "A4",

        printBackground:
          true,

        preferCSSPageSize:
          true,

        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },
      });

    const sufixo =
      duasVias
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
            "no-store",
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