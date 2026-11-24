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

    // Temporary header/footer isolation. Authenticated request, preview only.
    if (process.env.VERCEL_ENV === "preview") {
      const original = renderizacao.pdfOptions;
      const header = original.headerTemplate;
      const footer = original.footerTemplate;
      const logoMatch = header.match(/<img\b[^>]*>/i);
      const logoTag = logoMatch?.[0] || "";
      const logoSrc = logoTag.match(/\bsrc\s*=\s*"([^"]*)"/i)?.[1] || "";
      const cases = ["header-only", "footer-only", "header-without-logo", "logo-only", "header-small-png", "full-normalized-logo"] as const;
      const results: Array<Record<string, unknown>> = [];
      const started = Date.now();
      const empty = "<div></div>";
      const minimal = "<!doctype html><html><body><p>PHANYX PDF diagnostic</p></body></html>";
      console.info("[PDF-HEADER-DIAG] metadata", { enabled: original.displayHeaderFooter, headerChars: header.length, footerChars: footer.length, hasLogo: Boolean(logoTag), logoChars: logoSrc.length, logoType: logoSrc.match(/^data:([a-z0-9+./-]+);/i)?.[1] || "none" });
      for (const test of cases) {
        if (Date.now() - started > 35000) { results.push({ test, skipped: "time-budget" }); continue; }
        if (!original.displayHeaderFooter) { results.push({ test, skipped: "header-footer-disabled" }); continue; }
        if (["header-without-logo", "logo-only", "header-small-png", "full-normalized-logo"].includes(test) && !logoTag) { results.push({ test, skipped: "no-logo" }); continue; }
        if (test === "full-normalized-logo" && !/^data:image\//i.test(logoSrc)) { results.push({ test, skipped: "logo-not-inline-image" }); continue; }
        let diagnosticBrowser: Awaited<ReturnType<typeof abrirNavegador>> | undefined;
        let stage = "launch";
        try {
          diagnosticBrowser = await abrirNavegador();
          diagnosticBrowser.process()?.once("exit", (code, signal) => console.info("[PDF-HEADER-DIAG] exit", { test, code, signal }));
          stage = "content";
          const page = await diagnosticBrowser.newPage();
          await page.emulateMediaType("print");
          await page.setContent(test === "full-normalized-logo" ? renderizacao.html : minimal, { waitUntil: "domcontentloaded", timeout: 5000 });
          await page.evaluate(async () => {
            await Promise.race([Promise.all([document.fonts.ready, ...Array.from(document.images).map(img => img.decode().catch(() => undefined))]), new Promise<void>(resolve => setTimeout(resolve, 3000))]);
          });
          let testHeader = header;
          let testFooter = empty;
          if (test === "footer-only") { testHeader = empty; testFooter = footer; }
          if (test === "header-without-logo") testHeader = header.replace(/<img\b[^>]*>/gi, "");
          if (test === "logo-only") testHeader = `<div style="padding-left:18mm">${logoTag}</div>`;
          if (test === "header-small-png") {
            stage = "synthetic-png";
            const png = await page.evaluate(() => {
              const c = document.createElement("canvas"); c.width = 32; c.height = 32;
              const ctx = c.getContext("2d"); if (!ctx) throw new Error("NO_CANVAS");
              ctx.fillStyle = "#2563eb"; ctx.fillRect(0, 0, 32, 32);
              return c.toDataURL("image/png");
            });
            testHeader = header.replace(logoTag, logoTag.replace(/\bsrc\s*=\s*"[^"]*"/i, `src="${png}"`));
          }
          if (test === "full-normalized-logo") {
            stage = "normalize-logo";
            const normalized = await page.evaluate(async (src) => {
              const img = new Image(); img.src = src;
              await Promise.race([img.decode(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("IMAGE_DECODE_TIMEOUT")), 3000))]);
              if (!img.naturalWidth || !img.naturalHeight) throw new Error("INVALID_IMAGE");
              const ratio = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
              const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(img.naturalWidth * ratio)); c.height = Math.max(1, Math.round(img.naturalHeight * ratio));
              const ctx = c.getContext("2d"); if (!ctx) throw new Error("NO_CANVAS");
              ctx.drawImage(img, 0, 0, c.width, c.height);
              return { png: c.toDataURL("image/png"), width: c.width, height: c.height };
            }, logoSrc);
            console.info("[PDF-HEADER-DIAG] normalized", { width: normalized.width, height: normalized.height, chars: normalized.png.length });
            testHeader = header.replace(logoTag, logoTag.replace(/\bsrc\s*=\s*"[^"]*"/i, `src="${normalized.png}"`));
            testFooter = footer;
          }
          stage = "print";
          const bytes = await page.pdf({ ...original, displayHeaderFooter: true, headerTemplate: testHeader, footerTemplate: testFooter, timeout: 6500 });
          const valid = bytes.length > 5 && Buffer.from(bytes.subarray(0, 5)).toString("ascii") === "%PDF-";
          results.push({ test, ok: valid, bytes: bytes.length });
        } catch (error) {
          results.push({ test, ok: false, stage, error: error instanceof Error ? error.name : "unknown" });
        } finally {
          if (diagnosticBrowser) await diagnosticBrowser.close().catch(() => null);
        }
        console.info("[PDF-HEADER-DIAG]", results[results.length - 1]);
      }
      console.info("[PDF-HEADER-DIAG] summary", JSON.stringify(results));
      return NextResponse.json({ error: "PDF_DIAGNOSTIC_COMPLETE", results }, { status: 422, headers: { "Cache-Control": "no-store" } });
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
      renderizacao.html,
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

    geracaoPdfEmAndamento = false;
  }
}

// Temporary authenticated diagnostic; never enabled in production.
export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") {
    return new NextResponse(null, { status: 404 });
  }
  const user = await getUserFromToken();
  if (!user || user.role !== "ADMIN") {
    return new NextResponse(null, { status: 401 });
  }
  if (geracaoPdfEmAndamento) {
    return new NextResponse(null, { status: 429 });
  }
  geracaoPdfEmAndamento = true;
  const resultados: Array<Record<string, unknown>> = [];
  try {
    for (const teste of ["minimo", "cabecalho-rodape", "sem-single-process"] as const) {
      let navegador: Awaited<ReturnType<typeof abrirNavegador>> | undefined;
      const saida: { code: number | null; signal: string | null } = { code: null, signal: null };
      let etapa = "launch";
      try {
        navegador = teste === "sem-single-process"
          ? await puppeteer.launch({ executablePath: await chromium.executablePath(CHROMIUM_PACK), args: chromium.args.filter(arg => arg !== "--single-process"), headless: true, dumpio: true, timeout: 10000 })
          : await abrirNavegador();
        navegador.process()?.once("exit", (code, signal) => {
          saida.code = code; saida.signal = signal;
          console.info("[PDF-DIAG] exit", teste, code, signal);
        });
        etapa = "page";
        const pagina = await navegador.newPage();
        await pagina.emulateMediaType("print");
        await pagina.setContent("<!doctype html><html><body><p>PHANYX PDF diagnostic</p></body></html>", { waitUntil: "domcontentloaded", timeout: 5000 });
        etapa = "printToPDF";
        const pdf = await pagina.pdf({ format: "A4", timeout: 8000, printBackground: true, ...(teste === "cabecalho-rodape" ? { displayHeaderFooter: true, headerTemplate: "<div>Header</div>", footerTemplate: "<div>Footer</div>", margin: { top: "20mm", bottom: "20mm" } } : {}) });
        resultados.push({ teste, ok: pdf.length > 5, bytes: pdf.length });
      } catch (error) {
        resultados.push({ teste, ok: false, etapa, erro: error instanceof Error ? error.message : String(error), saida });
      } finally {
        if (navegador) await navegador.close().catch(() => null);
      }
      console.info("[PDF-DIAG]", resultados[resultados.length - 1]);
    }
    return NextResponse.json({ resultados }, { headers: { "Cache-Control": "no-store" } });
  } finally {
    geracaoPdfEmAndamento = false;
  }
}
