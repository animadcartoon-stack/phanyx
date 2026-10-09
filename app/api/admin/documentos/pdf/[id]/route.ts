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
import {
  replaceDocumentTags,
} from "@/lib/documentos/tags-documentos";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const maxDuration = 60;

const CHROMIUM_PACK =
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar";
function escaparRegexDocumento(
  valor: string
) {
  return String(valor || "")
    .replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
}
function extrairValoresResolvidosLegados(
  templateFonte: string,
  conteudoGerado: string
) {
  const fonte =
    String(templateFonte || "");

  const gerado =
    String(conteudoGerado || "");

  if (!fonte || !gerado) {
    return null;
  }

  const regexTag =
    /{{\s*([^{}]+?)\s*}}/g;

  const tags: string[] = [];

  let padrao = "^";
  let indice = 0;
  let match:
    RegExpExecArray | null;

  while (
    (
      match =
        regexTag.exec(fonte)
    )
  ) {
    padrao +=
      escaparRegexDocumento(
        fonte.slice(
          indice,
          match.index
        )
      );

    /*
     * O documento gerado nasceu desta mesma estrutura,
     * substituindo cada {{tag}} pelo valor resolvido.
     * Capturamos somente o trecho correspondente à tag.
     */
    padrao += "([\\s\\S]*?)";

    tags.push(
      String(
        match[1] || ""
      ).trim()
    );

    indice =
      match.index +
      match[0].length;
  }

  padrao +=
    escaparRegexDocumento(
      fonte.slice(indice)
    );

  padrao += "$";

  if (tags.length === 0) {
    return null;
  }

  let resultado:
    RegExpMatchArray | null =
      null;

  try {
    resultado =
      gerado.match(
        new RegExp(
          padrao
        )
      );
  } catch {
    return null;
  }

  if (!resultado) {
    return null;
  }

  const valores:
    Record<string, string> = {};

  for (
    let i = 0;
    i < tags.length;
    i += 1
  ) {
    const tag =
      tags[i];

    const valor =
      String(
        resultado[
          i + 1
        ] ?? ""
      );

    /*
     * Tags repetidas devem manter o primeiro valor útil
     * capturado no documento original.
     */
    if (
      !(tag in valores) ||
      (
        !valores[tag] &&
        valor
      )
    ) {
      valores[tag] =
        valor;
    }
  }

  return valores;
}

function obterSnapshotValoresDocumento(
  valor: unknown
) {
  if (
    !valor ||
    typeof valor !==
      "object" ||
    Array.isArray(valor)
  ) {
    return null;
  }

  const objeto =
    valor as
      Record<string, unknown>;

  const snapshot =
    objeto
      .__phanyxValoresResolvidos;

  if (
    !snapshot ||
    typeof snapshot !==
      "object" ||
    Array.isArray(snapshot)
  ) {
    return null;
  }

  const normalizado:
    Record<string, string> = {};

  for (
    const [chave, item]
    of Object.entries(
      snapshot as
        Record<string, unknown>
    )
  ) {
    normalizado[chave] =
      String(
        item ?? ""
      );
  }

  return normalizado;
}

function possuiTagsNaoResolvidas(
  valor: string
) {
  return /{{\s*[^{}]+?\s*}}/.test(
    String(valor || "")
  );
}


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

    const dadosPreenchimentoDocumento =
      doc.dadosPreenchimento &&
        typeof doc.dadosPreenchimento ===
        "object" &&
        !Array.isArray(
          doc.dadosPreenchimento
        )
        ? (
          doc.dadosPreenchimento as
          Record<
            string,
            unknown
          >
        )
        : {};

    /*
     * FONTE DE VERDADE DO LAYOUT:
     * o HTML ATUAL do template.
     *
     * O DocumentoGerado preserva os valores da emissão, mas
     * não deve congelar para sempre a formatação antiga.
     * Assim, corrigir o template corrige também o PDF de um
     * documento já existente (ex.: /pdf/252), sem criar outro.
     */
    const snapshotValores =
      obterSnapshotValoresDocumento(
        dadosPreenchimentoDocumento
      );

    const valoresManuais =
      Object.fromEntries(
        Object.entries(
          dadosPreenchimentoDocumento
        )
          .filter(
            ([chave]) =>
              !chave.startsWith(
                "__phanyx"
              )
          )
          .map(
            ([chave, valor]) => [
              chave,
              String(
                valor ?? ""
              ),
            ]
          )
      ) as
        Record<string, string>;

    /*
     * Compatibilidade com documentos antigos:
     * antes de __phanyxValoresResolvidos existir, o sistema
     * guardava apenas o HTML já preenchido. Como esse HTML foi
     * criado por substituição direta do template, conseguimos
     * recuperar os valores quando a estrutura textual ainda é
     * compatível. Depois salvamos o snapshot para não depender
     * novamente dessa reconstrução.
     */
    const valoresLegados =
      !snapshotValores &&
      doc.template
        ?.conteudo &&
      doc.conteudo
        ? extrairValoresResolvidosLegados(
            doc.template.conteudo,
            doc.conteudo
          )
        : null;

    const valoresResolvidos = {
      ...valoresManuais,
      ...(valoresLegados || {}),
      ...(snapshotValores || {}),
    };

    let conteudoDocumento =
      String(
        doc.conteudo ||
        doc.template?.conteudo ||
        ""
      ).trim();

    if (
      doc.template
        ?.conteudo &&
      Object.keys(
        valoresResolvidos
      ).length > 0
    ) {
      const conteudoTemplateAtual =
        replaceDocumentTags(
          doc.template.conteudo,
          valoresResolvidos
        ).trim();

      /*
       * Só troca para o template atual quando todas as variáveis
       * necessárias foram resolvidas. Caso contrário mantemos o
       * documento histórico em vez de exibir tags cruas.
       */
      if (
        conteudoTemplateAtual &&
        !possuiTagsNaoResolvidas(
          conteudoTemplateAtual
        )
      ) {
        conteudoDocumento =
          conteudoTemplateAtual;
      }
    }

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

    if (
      !snapshotValores &&
      valoresLegados
    ) {
      /*
       * Migração transparente do documento antigo:
       * não altera texto, status ou emissão; apenas registra
       * internamente os valores que já estavam no documento.
       *
       * Isso faz futuras alterações VISUAIS do template serem
       * aplicadas ao mesmo documento sem regenerá-lo.
       */
      await prisma.documentoGerado.update({
        where: {
          id: doc.id,
        },

        data: {
          dadosPreenchimento: {
            ...dadosPreenchimentoDocumento,

            __phanyxValoresResolvidos:
              valoresLegados,
          } as any,
        },
      });
    }

    /*
     * O PDF é renderizado dinamicamente sempre que é aberto.
     *
     * A geometria deve acompanhar o template ATUAL, inclusive
     * para documentos que já foram gerados anteriormente.
     * Isso permite corrigir o modelo uma única vez e ver a
     * correção imediatamente nos PDFs existentes, sem gerar
     * outro documento para a mesma matrícula.
     *
     * O snapshot antigo fica apenas como fallback caso o
     * template não possua campos visuais.
     */
    const camposVisuaisDocumento =
      Array.isArray(
        doc.template
          ?.camposVisuais
      ) &&
      doc.template
        .camposVisuais.length > 0
        ? doc.template
          .camposVisuais
        : Array.isArray(
          dadosPreenchimentoDocumento
            .__phanyxCamposVisuais
        )
          ? dadosPreenchimentoDocumento
            .__phanyxCamposVisuais
          : [];

    const renderizacao =
      montarRenderizacaoDocumento({
        conteudo:
          conteudoDocumento,

        formatoImpressao,

        camposVisuais:
          camposVisuaisDocumento as any,

        modoPrevia: false,

        /*
         * No documento final, campos reais podem ter altura
         * diferente dos valores demonstrativos do editor.
         * A assinatura acompanha a seção onde a tag foi inserida,
         * preservando o deslocamento escolhido pelo usuário.
         */
        ancorarBlocoAssinaturaAoFluxo:
          true,

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

        timeout: 30000,
      }
    );

    await aguardarRecursosDaPagina(
      page
    );

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