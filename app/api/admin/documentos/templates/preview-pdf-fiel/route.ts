import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CHROMIUM_PACK =
  "https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar";

function urlFinal(url?: string | null, baseUrl?: string) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${baseUrl}${url}`;
}

function substituirExemplos(texto: string, config: any) {
  const valores: Record<string, string> = {
    nomeInstituicao: config?.nomeFantasia || "Instituição Exemplo",
    cnpjInstituicao: config?.cnpj || "00.000.000/0001-00",
    enderecoInstituicao: config?.endereco || "Endereço institucional",
    telefoneInstituicao: config?.telefone || "(00) 00000-0000",
    emailInstituicao: config?.email || "contato@instituicao.com",
    cidadeInstituicao: config?.cidade || "Cidade",
    estadoInstituicao: config?.estado || "UF",
    cepInstituicao: config?.cep || "00000-000",

    dataAtual: new Date().toLocaleDateString("pt-BR"),
    cidadeAssinatura: config?.cidadeAssinatura || config?.cidade || "Cidade",
    responsavelLegal: config?.responsavelNome || "Responsável legal",

    nomeAluno: "Aluno Exemplo",
    cpfAluno: "000.000.000-00",
    rgAluno: "00.000.000-0",
    matriculaAluno: "2026-0001",
    numeroMatricula: "2026-0001",
    curso: "Bacharel Livre em Teologia",
    statusAluno: "ATIVO",
    statusMatricula: "ATIVA",

    dataMatricula: "03/06/2026",
dataInicioAluno: "03/06/2026",
dataConclusao: "-",
dataConclusaoAluno: "-",

semestreAtual: "1º semestre",

cargaHorariaCurso: "3.200h",
cargaHorariaMinimaCurso: "20h",
cargaHorariaMaximaCurso: "550h",

percentualConclusao: "25%",

nomePolo: "Polo Exemplo",
enderecoPolo: "Endereço do polo",
telefonePolo: "(00) 00000-0000",
emailPolo: "polo@exemplo.com",
cidadePolo: "Cidade",
estadoPolo: "UF",
cepPolo: "00000-000",

nomeTitularContrato: "Aluno Exemplo",
cpfTitularContrato: "000.000.000-00",
emailTitularContrato: "titular@exemplo.com",
telefoneTitularContrato: "(00) 00000-0000",
parentescoTitularContrato: "O próprio aluno",
tipoTitularContrato: "O próprio aluno",

disciplinas:
  "- Antigo Testamento A — 96h<br>" +
  "- Novo Testamento A — 96h<br>" +
  "- Teologia Bíblica — 64h",

valorContrato: "R$ 2.000,00",

codigoValidacao:
  "PHANYX-PREVIA-000001",

urlValidacao:
  "https://www.phanyx.com.br/validar-documento",

numeroDocumento:
  "CONTRATO-PREVIA-000001",

dataEmissao:
  new Date().toLocaleDateString(
    "pt-BR"
  ),

horaEmissao:
  new Date().toLocaleTimeString(
    "pt-BR"
  ),

dataHoraEmissao:
  new Date().toLocaleString(
    "pt-BR"
  ),

    nomeFuncionario: "Funcionário Exemplo",
    funcionarioNome: "Funcionário Exemplo",
    cpfFuncionario: "000.000.000-00",
    funcionarioCpf: "000.000.000-00",
    rgFuncionario: "00.000.000-0",
    funcionarioRg: "00.000.000-0",
    cargoFuncionario: "Auxiliar Administrativo",
    funcionarioCargo: "Auxiliar Administrativo",
    departamentoFuncionario: "Departamento Exemplo",
    funcionarioDepartamento: "Departamento Exemplo",
    dataAdmissaoFuncionario: "-",
    funcionarioDataAdmissao: "-",
    dataDesligamentoFuncionario: "-",
    funcionarioDataDesligamento: "-",

    motivoDemissao: "Motivo exemplo",
    tipoRescisao: "Sem justa causa",
    dataDemissao: "-",
    saldoSalario: "R$ 0,00",
    feriasVencidas: "R$ 0,00",
    feriasProporcionais: "R$ 0,00",
    decimoTerceiroProporcional: "R$ 0,00",
    avisoPrevio: "R$ 0,00",
    multaFgts: "-",
    valorBrutoRescisao: "-",
    descontoInss: "-",
    descontoIrrf: "-",
    outrosDescontos: "-",
    valorLiquidoRescisao: "R$ 0,00",
    valorRescisao: "R$ 0,00",
  };

  let final = texto || "";

  for (
  const [chave, valor]
  of Object.entries(valores)
) {
  const chaveSegura =
    chave.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

  const padrao =
    new RegExp(
      `{{\\s*${chaveSegura}\\s*}}`,
      "g"
    );

  final = final.replace(
    padrao,
    () => valor || ""
  );
}

  return final.replaceAll(/{{[^}]+}}/g, "-");
}

export async function POST(req: NextRequest) {
  let browser: any = null;

  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

    const config = await prisma.configuracaoInstituicao.findUnique({
      where: { instituicaoId: user.instituicaoId },
    });

    const baseUrl = new URL(req.url).origin;

    let conteudoHtml = substituirExemplos(
  String(body?.conteudo || ""),
  config
);

conteudoHtml = conteudoHtml
  .replace(/<p([^>]*)>\s*<\/p>/gi, "<p$1><br /></p>")
  .replace(/<p([^>]*)>\s*&nbsp;\s*<\/p>/gi, "<p$1><br /></p>");

    const logoUrl = urlFinal(config?.logoUrl, baseUrl);
    const papelUrl = urlFinal(config?.papelTimbradoUrl, baseUrl);

    const usaPapelProprio =
      config?.usarPapelTimbrado &&
      config?.estiloPapelTimbrado === "PAPEL_PROPRIO" &&
      papelUrl;

    const usaPhanyxClassico =
      config?.usarPapelTimbrado &&
      config?.estiloPapelTimbrado === "PHANYX_CLASSICO";

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />

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
      background: #ffffff;
      color: #000000;

      -webkit-print-color-adjust:
        exact;

      print-color-adjust:
        exact;
    }

    body {
      font-family:
        Arial,
        Helvetica,
        sans-serif;

      font-size: 11pt;
      line-height: normal;
    }

    .pagina-a4 {
      width: 210mm;
      position: relative;
      background: #ffffff;
      overflow: visible;
    }

    ${
      usaPapelProprio
        ? `
    .papel-proprio {
      position: fixed;
      inset: 0;
      width: 210mm;
      height: 297mm;
      object-fit: cover;
      z-index: 0;
      pointer-events: none;
    }
    `
        : ""
    }

    ${
      usaPhanyxClassico
        
    }

    .conteudo {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 0;
}

    /*
     * O Tailwind remove as margens
     * naturais no editor. Portanto,
     * o PDF também não deve inventar
     * margens automáticas.
     */
    .conteudo p,
    .conteudo div,
    .conteudo h1,
    .conteudo h2,
    .conteudo h3,
    .conteudo h4,
    .conteudo h5,
    .conteudo h6 {
      margin-top: 0;
      margin-bottom: 0;
    }

    /*
     * Um parágrafo normal ocupa uma
     * linha completa. Isso preserva
     * o Enter natural do editor.
     */
    .conteudo p {
      min-height: 1em;
    }

    /*
     * Uma linha vazia não pode virar
     * apenas 4 pixels.
     */
    .conteudo p:empty,
    .conteudo p:has(
      > br:only-child
    ) {
      min-height: 1em;
      line-height: 1em;
    }

    .conteudo img {
      max-width: 100%;
      height: auto;
    }

    .conteudo table {
      width: 100%;
      border-collapse: collapse;
    }

    .conteudo ul,
    .conteudo ol {
      margin-top: 0;
      margin-bottom: 0;
      padding-left: 1.5em;
    }

    /*
     * Os marcadores criados pelo
     * editor viram quebras físicas.
     * Os textos das guias não são
     * impressos.
     */
    .conteudo
      .phanyx-page-break {
      display: block !important;

      width: 100%;
      height: 0 !important;

      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;

      overflow: hidden !important;

      font-size: 0 !important;
      line-height: 0 !important;

      break-before: page;
      page-break-before: always;
    }

  </style>
</head>

<body>
  <section class="pagina-a4">
    ${
      usaPapelProprio
        ? `
    <img
      class="papel-proprio"
      src="${papelUrl}"
      alt=""
    />
    `
        : ""
    }

    <main class="conteudo">
      ${conteudoHtml}
    </main>
  </section>
</body>
</html>`;

const headerTemplate =
  usaPhanyxClassico
    ? `
<div
  style="
    width: 100%;
    height: 34mm;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 8mm;
    padding: 6mm 18mm;
    background: #111111;
    color: #ffffff;
    font-family: Arial, Helvetica, sans-serif;
    -webkit-print-color-adjust: exact;
  "
>
  ${
    logoUrl
      ? `
  <img
    src="${logoUrl}"
    style="
      width: 22mm;
      height: 22mm;
      object-fit: contain;
    "
  />
  `
      : ""
  }

  <div>
    <div
      style="
        font-size: 16pt;
        font-weight: 700;
        line-height: 1.1;
      "
    >
      ${
        config?.nomeFantasia ||
        "Instituição"
      }
    </div>

    <div
      style="
        margin-top: 2mm;
        font-size: 9pt;
        line-height: 1.1;
      "
    >
      Prévia de documento
    </div>
  </div>
</div>
`
    : `<div></div>`;

const footerTemplate =
  usaPhanyxClassico
    ? `
<div
  style="
    width: 100%;
    height: 10mm;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2mm 18mm;
    background: #111111;
    color: #ffffff;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 6pt;
    -webkit-print-color-adjust: exact;
  "
>
  <span>
    ${config?.cnpj || ""}
    ${config?.telefone || ""}
  </span>

  <span>
    Página
    <span class="pageNumber"></span>
    de
    <span class="totalPages"></span>
  </span>
</div>
`
    : `<div></div>`;

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(CHROMIUM_PACK),
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

await page.evaluate(() => {
  document
    .querySelectorAll(
      '[data-phanyx-page-break="true"]'
    )
    .forEach((elemento) => {
      elemento.remove();
    });
});

   const pdfBuffer = await page.pdf({
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,

  displayHeaderFooter:
    Boolean(
      usaPhanyxClassico
    ),

  headerTemplate,
  footerTemplate,

  margin: usaPhanyxClassico
    ? {
        top: "34mm",
        right: "18mm",
        bottom: "10mm",
        left: "18mm",
      }
    : {
        top: "18mm",
        right: "18mm",
        bottom: "18mm",
        left: "18mm",
      },
});

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=previa-fiel.pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    if (browser) {
      await browser.close().catch(() => null);
    }

    console.error("Erro ao gerar PDF fiel:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao gerar PDF fiel" },
      { status: 500 }
    );
  }
}