import {
  substituirVariaveisPreviewDocumento,
} from "@/lib/documentos/variaveis-preview-documento";
import { montarHtmlNavegador } from "@/lib/documentos/visualizacao-navegador";
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import { lerImagemPdfLimitada, prepararImagemPdf } from "@/lib/pdf/preparar-imagem-pdf";
import { normalizarModeloPapelTimbrado } from "@/lib/documentos/modelos-papel-timbrado";
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
export const runtime = "nodejs";
export const maxDuration = 60;

let geracaoPdfEmAndamento = false;

function registrarMemoriaPdf(etapa: string) {
  const memoria = process.memoryUsage();

  console.info("[PDF-PREVIEW]", {
    etapa,
    rssMB: Math.round(memoria.rss / 1048576),
    heapMB: Math.round(memoria.heapUsed / 1048576),
    externalMB: Math.round(memoria.external / 1048576),
  });
}

const CHROMIUM_PACK =
  "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar";

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
    dumpio: true,
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

// Use the same bounded decoder as the contract PDF. Never pass the original oversized logo to Chromium.
async function prepararLogoPrevia(url?: string | null): Promise<string> {
  if (!url) return "";
  const resposta = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!resposta.ok) throw new Error("PDF_LOGO_FETCH_FAILED");
  const original = await lerImagemPdfLimitada(resposta);
  const otimizada = await prepararImagemPdf(original, { ladoMaximo: 400, timeoutSegundos: 35 });
  console.info("[PDF-LOGO] optimized-shared", { originalBytes: original.length, optimizedBytes: otimizada.bytes.length, format: otimizada.formato });
  return `data:image/${otimizada.formato};base64,${otimizada.bytes.toString("base64")}`;
}

function substituirExemplos(
  texto: string,
  config: any
) {
  let final =
    substituirVariaveisPreviewDocumento(
      texto.replace(/\{\{\s*campo:periodoData\s*\}\}/g, "____/____/________ – ____/____/________"),
      config
    );

  final =
    final
      .replace(
        /{{\s*(?:assinaturaDiretor|directorSignature)\s*}}/gi,
        "__PHANYX_ASSINATURA_DIRETOR__"
      )
      .replace(
        /{{\s*(?:blocoAssinaturaDiretor|directorSignatureBlock)\s*}}/gi,
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

  let possuiBloqueioPdf = false;

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

    if (body?.visualizacao !== "navegador") {
      if (geracaoPdfEmAndamento) {
        return NextResponse.json(
          { error: "PDF_PREVIEW_BUSY" },
          {
            status: 429,
            headers: { "Retry-After": "3" },
          }
        );
      }

      geracaoPdfEmAndamento = true;
      possuiBloqueioPdf = true;
    }

    const localesDocumento =
      new Set([
        "pt-BR",
        "pt-PT",
        "en-US",
        "es-ES",
        "fr-FR",
      ]);

    const localeDocumento =
      localesDocumento.has(
        String(body?.locale || "")
      )
        ? String(body.locale)
        : "pt-BR";


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

    const configDocumento = {
      ...(config || {}),
      __documentLocale:
        localeDocumento,
    } as any;

    const baseUrl =
      new URL(req.url).origin;

    let conteudoHtml =
      substituirExemplos(
        String(
          body?.conteudo || ""
        ),
        configDocumento
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
        estiloDocumento: ehHistorico ? "INSTITUCIONAL" : normalizarModeloPapelTimbrado(config?.estiloPapelTimbrado || config?.estiloDocumento),

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

    let logoIndisponivel = false;
    const [
      logoDataUri,
      assinaturaDataUri,
      papelTimbradoDataUri,
    ] = await Promise.all([
      prepararLogoPrevia(logoUrl).catch((error: unknown) => {
        logoIndisponivel = true;
        console.warn("[PDF-LOGO] preview-degraded", { error: error instanceof Error ? error.message : "UNKNOWN" });
        return "";
      }),

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

          estiloPapelTimbrado: normalizarModeloPapelTimbrado(config?.estiloPapelTimbrado || config?.estiloDocumento),
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

    if (body?.visualizacao === "navegador") {
      return NextResponse.json({html: montarHtmlNavegador(renderizacao, localeDocumento, logoIndisponivel)}, {headers:{"Cache-Control":"private, no-store"}});
    }

    let pdfBuffer: Uint8Array | undefined;
    const inicioTentativas = Date.now();
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      try {
        console.info("[PDF-PREVIEW] tentativa", tentativa);
    registrarMemoriaPdf("antes-chromium");

    browser =
      await abrirNavegador();

    registrarMemoriaPdf("depois-chromium");
    browser.process()?.once("exit", (code, signal) => {
      console.info("[PDF-PREVIEW] chromium-exit", { code, signal });
    });

    const page =
      await browser.newPage();
    page.on("error", (error) => console.error("[PDF-PREVIEW] page-crash", error.name));

    /*
     * IMPORTANTE: o HTML do documento executa medições de layout
     * para posicionar validação, QR e elementos visuais.
     *
     * O Chromium precisa estar em mídia PRINT antes de carregar
     * o HTML; caso contrário as medições são feitas em layout de
     * tela e podem empurrar a validação para uma página extra.
     *
     * Esta regra é compartilhada por qualquer documento que use
     * o renderizador PHANYX, não apenas cancelamento de matrícula.
     */
    await page.emulateMediaType(
      "print"
    );

    await page.setContent(
      logoIndisponivel ? renderizacao.html.replace(/<body(?:\s[^>]*)?>/i, (tag) => tag + '<div style="font: bold 10pt Arial,sans-serif;color:#92400e;border:1px solid #92400e;padding:4px;text-align:center">PREVIEW / PR&Eacute;VIA &mdash; LOGO UNAVAILABLE / LOGOTIPO INDISPON&Iacute;VEL</div>') : renderizacao.html,
      {
        waitUntil:
          "domcontentloaded",
      }
    );

    await page.evaluate(async () => {
      const imagens = Array.from(document.images);

      await Promise.race([
        Promise.all(
          imagens.map((imagem) => {
            if (imagem.complete) {
              return Promise.resolve();
            }

            return new Promise<void>((resolve) => {
              imagem.addEventListener(
                "load",
                () => resolve(),
                { once: true }
              );

              imagem.addEventListener(
                "error",
                () => resolve(),
                { once: true }
              );
            });
          })
        ),
        new Promise<void>((resolve) =>
          setTimeout(resolve, 10000)
        ),
      ]);

      await Promise.race([
        document.fonts.ready,
        new Promise<void>((resolve) =>
          setTimeout(resolve, 5000)
        ),
      ]);

      if (
        imagens.some(
          (imagem) =>
            !imagem.complete || imagem.naturalWidth === 0
        ) ||
        document.fonts.status !== "loaded"
      ) {
        throw new Error("PDF_ASSETS_NOT_READY");
      }
    });

    // Temporary diagnostics: preview deployments only; never log document text.
    if (process.env.VERCEL_ENV === "preview") {
      try {
        const sessaoFontes = await page.createCDPSession();
        try {
          await sessaoFontes.send("DOM.enable");
          await sessaoFontes.send("CSS.enable");
          const { root } = await sessaoFontes.send("DOM.getDocument");
          const seletores = [
            '.phanyx-conteudo [style*="Segoe Script" i]',
            '.phanyx-conteudo [style*="font-family" i]',
            '.phanyx-conteudo [style*="font-size" i]',
            '.phanyx-conteudo h1, .phanyx-conteudo h2, .phanyx-conteudo p'
          ];
          const ids = new Set<number>();
          for (const selector of seletores) {
            const { nodeIds } = await sessaoFontes.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector });
            for (const id of nodeIds.slice(0, 8)) {
              if (ids.size >= 18) break;
              ids.add(id);
            }
          }
          const propriedades = new Set(["font-family", "font-size", "font-weight", "font-style", "color", "text-align"]);
          const resultado = [];
          for (const nodeId of ids) {
            const { computedStyle } = await sessaoFontes.send("CSS.getComputedStyleForNode", { nodeId });
            const { fonts } = await sessaoFontes.send("CSS.getPlatformFontsForNode", { nodeId });
            resultado.push({
              css: Object.fromEntries(computedStyle.filter((p: {name:string;value:string}) => propriedades.has(p.name)).map((p: {name:string;value:string}) => [p.name, p.value.slice(0,200)])),
              fontesReais: fonts.map((f: {familyName:string;postScriptName:string;isCustomFont:boolean;glyphCount:number}) => ({familia:f.familyName, postScript:f.postScriptName, personalizada:f.isCustomFont, glifos:f.glyphCount}))
            });
          }
          console.info("[PDF-FONT-DIAG]", JSON.stringify(resultado));
        } finally {
          await sessaoFontes.detach().catch(() => {});
        }
      } catch (erroFontes) {
        console.warn("[PDF-FONT-DIAG] unavailable", erroFontes instanceof Error ? erroFontes.name : "unknown");
      }
    }

    registrarMemoriaPdf("antes-pdf");

    pdfBuffer =
      await page.pdf(
        renderizacao.pdfOptions
      );

        break;
      } catch (falha) {
        const mensagem = falha instanceof Error ? falha.message : String(falha);
        if (tentativa !== 1 || Date.now() - inicioTentativas > 15000 || !/Target closed|Session closed|Connection closed/i.test(mensagem)) throw falha;
        console.warn("[PDF-PREVIEW] target closed; retrying with a fresh browser");
        if (browser) await browser.close().catch(() => null);
        browser = null;
      }
    }
    if (!pdfBuffer) throw new Error("PDF_EMPTY_RESULT");

    registrarMemoriaPdf("depois-pdf");

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
          "X-PHANYX-PDF-Warning": logoIndisponivel ? "LOGO_UNAVAILABLE" : "",
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

    if (possuiBloqueioPdf) geracaoPdfEmAndamento = false;
  }
}
