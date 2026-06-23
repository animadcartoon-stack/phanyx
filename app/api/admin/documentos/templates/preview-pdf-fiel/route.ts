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

  for (const [chave, valor] of Object.entries(valores)) {
    final = final.replaceAll(`{{${chave}}}`, valor || "");
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

    const conteudoHtml = substituirExemplos(
      String(body?.conteudo || ""),
      config
    );

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
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
    }

    .pagina-a4 {
      width: 210mm;
      min-height: 297mm;
      position: relative;
      background: #ffffff;
      overflow: hidden;
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
    }
    `
        : ""
    }

    ${
      usaPhanyxClassico
        ? `
    .cabecalho-phanyx {
      height: 34mm;
      background: #111111;
      color: #ffffff;
      display: flex;
      align-items: center;
      padding: 8mm 18mm;
      gap: 8mm;
    }

    .cabecalho-phanyx img {
      width: 22mm;
      height: 22mm;
      object-fit: contain;
    }

    .cabecalho-phanyx h1 {
      margin: 0;
      font-size: 16pt;
      font-weight: 700;
      line-height: 1.1;
    }

    .cabecalho-phanyx p {
      margin: 3mm 0 0 0;
      font-size: 9pt;
    }

    .rodape-phanyx {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      height: 8mm;
      background: #111111;
      color: #ffffff;
      font-size: 6pt;
      padding: 2.5mm 18mm;
    }
    `
        : ""
    }

    .conteudo {
      position: relative;
      z-index: 1;
      padding-left: 18mm;
      padding-right: 18mm;
      ${
        usaPhanyxClassico
          ? "padding-top: 14mm; padding-bottom: 14mm;"
          : "padding-top: 18mm; padding-bottom: 18mm;"
      }
      ${usaPapelProprio ? "padding-top: 18mm; padding-bottom: 18mm;" : ""}
    }

    .conteudo img {
      max-width: 100%;
    }

    .conteudo table {
      width: 100%;
      border-collapse: collapse;
    }

    .conteudo p {
      margin-top: 0;
    }
  </style>
</head>
<body>
  <section class="pagina-a4">
    ${usaPapelProprio ? `<img class="papel-proprio" src="${papelUrl}" />` : ""}

    ${
      usaPhanyxClassico
        ? `
    <header class="cabecalho-phanyx">
      ${logoUrl ? `<img src="${logoUrl}" />` : ""}
      <div>
        <h1>${config?.nomeFantasia || "Instituição"}</h1>
        <p>Prévia de documento</p>
      </div>
    </header>
    `
        : ""
    }

    <main class="conteudo">
      ${conteudoHtml}
    </main>

    ${
      usaPhanyxClassico
        ? `
    <footer class="rodape-phanyx">
      ${config?.cnpj || ""} ${config?.telefone || ""}
    </footer>
    `
        : ""
    }
  </section>
</body>
</html>`;

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(CHROMIUM_PACK),
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
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