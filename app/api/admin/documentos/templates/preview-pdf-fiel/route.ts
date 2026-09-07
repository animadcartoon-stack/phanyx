import {
  substituirVariaveisPreviewDocumento,
} from "@/lib/documentos/variaveis-preview-documento";
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import QRCode from "qrcode";
import {
  montarRenderizacaoDocumento,
} from "@/lib/documentos/renderizador-template-documento";
import {
  montarConteudoHistoricoAcademico,
} from "@/lib/documentos/renderizador-historico-academico";
import {
  resolverLogoDocumentoInstituicao,
} from "@/lib/documentos/resolver-logo-documento";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CHROMIUM_PACK =
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar";

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
    args:
      chromium.args,

    executablePath:
      await chromium
        .executablePath(
          CHROMIUM_PACK
        ),

    headless: true,
  });
}

function urlFinal(url?: string | null, baseUrl?: string) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${baseUrl}${url}`;
}

async function imagemParaDataUri(
  url?: string | null
) {
  try {
    if (!url) {
      return "";
    }

    const resposta =
      await fetch(url);

    if (!resposta.ok) {
      return "";
    }

    const tipo =
      resposta.headers.get(
        "content-type"
      ) || "image/png";

    const bytes =
      Buffer.from(
        await resposta.arrayBuffer()
      );

    return `data:${tipo};base64,${bytes.toString(
      "base64"
    )}`;
  } catch {
    return "";
  }
}

function substituirExemplos(
  texto: string,
  config: any
) {
  let final =
    substituirVariaveisPreviewDocumento(
      texto,
      config
    );

  final =
    final
      .replace(
        /{{\s*assinaturaDiretor\s*}}/gi,
        "__PHANYX_ASSINATURA_DIRETOR__"
      )
      .replace(
        /{{\s*blocoAssinaturaDiretor\s*}}/gi,
        "__PHANYX_BLOCO_ASSINATURA_DIRETOR__"
      );

  return final.replace(
    /{{[^}]+}}/g,
    "-"
  );
}

export async function POST(
  req: NextRequest
) {
  let browser: any = null;

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
            "Não autorizado",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await req.json();

    const camposVisuais =
      Array.isArray(
        body?.camposVisuais
      )
        ? body.camposVisuais
        : [];

    const config =
      await prisma
        .configuracaoInstituicao
        .findUnique({
          where: {
            instituicaoId:
              user.instituicaoId,
          },
        });

    const configDocumento =
      config as any;

    const baseUrl =
      new URL(req.url).origin;

    let conteudoHtml =
      substituirExemplos(
        String(
          body?.conteudo || ""
        ),
        config
      );

    conteudoHtml =
      conteudoHtml
        .replace(
          /<p([^>]*)>\s*<\/p>/gi,
          "<p$1><br /></p>"
        )
        .replace(
          /<p([^>]*)>\s*&nbsp;\s*<\/p>/gi,
          "<p$1><br /></p>"
        );

    const ehHistorico =
      String(
        body?.tipo ||
        ""
      ).toUpperCase() ===
      "HISTORICO";

    /*
     * Estes registros são SOMENTE dados de demonstração da prévia.
     * O documento final deverá chamar o mesmo compositor com os
     * registros acadêmicos reais do aluno.
     */
    const componentesPreviaHistorico =
      ehHistorico
        ? [
          {
            codigo: "TEO-101",
            disciplina:
              "Antigo Testamento A",
            cargaHoraria: "96h",
            nota: "8,5",
            frequencia: "82%",
            situacao: "Aprovada",
            periodo: "2026.1",
            turma: "Turma 2026.01",
            tipo: "Obrigatória",
          },
          {
            codigo: "TEO-102",
            disciplina:
              "Novo Testamento A",
            cargaHoraria: "96h",
            nota: "9,0",
            frequencia: "88%",
            situacao: "Aprovada",
            periodo: "2026.1",
            turma: "Turma 2026.01",
            tipo: "Obrigatória",
          },
          {
            codigo: "TEO-205",
            disciplina:
              "Teologia Bíblica",
            cargaHoraria: "64h",
            nota: "-",
            frequencia: "74%",
            situacao: "Em curso",
            periodo: "2026.2",
            turma: "Turma 2026.02",
            tipo: "Obrigatória",
          },
          {
            codigo: "TEO-220",
            disciplina:
              "Atividade Extracurricular 1",
            cargaHoraria: "32h",
            nota: "-",
            frequencia: "-",
            situacao: "Cancelada",
            periodo: "2026.2",
            turma: "Turma anterior",
            tipo: "Extracurricular",
          },
        ]
        : [];

    const modoLogo =
      String(
        body?.modoLogo ||
        "AUTOMATICA"
      ).toUpperCase();

    const logoInstituicaoId =
      Number.isFinite(
        Number(body?.logoInstituicaoId)
      ) &&
      Number(body?.logoInstituicaoId) > 0
        ? Number(body.logoInstituicaoId)
        : null;

    const logoResolvida =
      await resolverLogoDocumentoInstituicao({
        instituicaoId:
          user.instituicaoId,

        modoLogo,

        logoInstituicaoId,

        /*
         * A área de configurações mantém estes dois campos
         * sincronizados. O primeiro é a regra histórica dos
         * contratos; o segundo garante que a prévia acompanhe
         * o layout efetivamente usado pelo renderizador.
         */
        estiloDocumento:
          ehHistorico
            ? "INSTITUCIONAL"
            : (
              config?.estiloDocumento ||
              config?.estiloPapelTimbrado ||
              "INSTITUCIONAL"
            ),

        fallbackLogoUrl:
          config?.logoUrl ||
          null,
      });

    const logoUrl =
      urlFinal(
        logoResolvida.logoUrl,
        baseUrl
      );

    const assinaturaUrl =
      urlFinal(
        configDocumento
          ?.certificadoAssinaturaUrl,
        baseUrl
      );

    const papelTimbradoUrl =
      urlFinal(
        config?.papelTimbradoUrl,
        baseUrl
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

    const codigoPrevia =
      "PHANYX-PREVIA-000001";

    const linkPrevia =
      `${baseUrl}/validar-documento?codigo=${encodeURIComponent(
        codigoPrevia
      )}`;

    const qrCodeDataUri =
      await QRCode.toDataURL(
        linkPrevia,
        {
          margin: 1,
          width: 260,
        }
      );

    /*
     * O Histórico monta cabeçalho, rodapé e validação dentro
     * do próprio conteúdo. Assim a prévia não recebe uma segunda
     * faixa institucional por fora e o QR Code não é empurrado
     * sozinho para outra página.
     */
    if (ehHistorico) {
      conteudoHtml =
        montarConteudoHistoricoAcademico({
          conteudoEstruturado:
            conteudoHtml,

          componentes:
            componentesPreviaHistorico,

          validacao: {
            codigo:
              codigoPrevia,

            emitidoEm:
              new Date()
                .toLocaleString(
                  "pt-BR"
                ),

            qrCodeDataUri,
          },
        });
    }

    const formatoImpressao =
      body?.formatoImpressao ===
        "DUAS_VIAS_A4"
        ? "DUAS_VIAS_A4"
        : "A4_INTEIRA";

    const renderizacao =
      montarRenderizacaoDocumento({
        conteudo:
          conteudoHtml,

        formatoImpressao,

        camposVisuais,

        modoPrevia: true,

        /*
         * No Histórico a validação já foi integrada ao rodapé
         * estruturado pelo compositor específico.
         */
        mostrarValidacao:
          !ehHistorico,

        layoutConteudoIntegral:
          ehHistorico,

        instituicao: {
          nome:
            config?.nomeFantasia ||
            "Instituição",

          cnpj:
            config?.cnpj || null,

          telefone:
            config?.telefone ||
            null,

          email:
            config?.email || null,

          cidade:
            config?.cidade || null,

          estado:
            config?.estado || null,

          responsavelNome:
            configDocumento
              ?.responsavelNome ||
            "Responsável legal",

          responsavelCargo:
            configDocumento
              ?.responsavelCargo ||
            configDocumento
              ?.cargoResponsavel ||
            "Representante legal",

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
            codigoPrevia,

          emitidoEm:
            new Date()
              .toLocaleString(
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

    const pdfBuffer =
      await page.pdf(
        renderizacao.pdfOptions
      );

    return new NextResponse(
      Buffer.from(pdfBuffer),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition":
            'inline; filename="previa-fiel.pdf"',

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error: any) {
    console.error(
      "Erro ao gerar PDF fiel:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao gerar PDF fiel",
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