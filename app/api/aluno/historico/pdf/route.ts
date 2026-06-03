import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { planoTemRecurso } from "@/lib/plano-acesso";
import { assinaturaPermiteUso } from "@/lib/assinatura-acesso";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function carregarImagemPdf(pdfDoc: PDFDocument, url?: string | null) {
  if (!url) return null;

  try {
    const resposta = await fetch(url);
    if (!resposta.ok) return null;

    const bytes = await resposta.arrayBuffer();
    const tipo = resposta.headers.get("content-type") || "";

    if (tipo.includes("png") || url.toLowerCase().includes(".png")) {
      return await pdfDoc.embedPng(bytes);
    }

    return await pdfDoc.embedJpg(bytes);
  } catch {
    return null;
  }
}

function textoSeguro(valor?: string | null) {
  return valor && valor.trim() ? valor : "-";
}

function dataBR(data?: Date | string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

function substituirTemplate(template: string, valores: Record<string, string>) {
  let texto = template;

  for (const [chave, valor] of Object.entries(valores)) {
    texto = texto.replaceAll(`{{${chave}}}`, valor);
  }

  return texto;
}

function montarEnderecoInstituicao(config: any) {
  return [
    [config?.endereco, config?.numero].filter(Boolean).join(", "),
    [config?.cidade, config?.estado].filter(Boolean).join(" - "),
    config?.cep ? `CEP: ${config.cep}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function montarBlocoInstituicao(config: any) {
  return [
  config?.nomeFantasia || "Instituição",

  config?.cnpj
    ? `CNPJ: ${config.cnpj}`
    : "",

  [
    config?.endereco,
    config?.numero,
    config?.bairro,
    [config?.cidade, config?.estado]
      .filter(Boolean)
      .join("/")
  ]
    .filter(Boolean)
    .join(" - "),

  "",

  config?.telefone
    ? `Telefone: ${config.telefone}`
    : "",

  config?.email
    ? `E-mail: ${config.email}`
    : "",
]
  .filter((linha) => linha !== undefined)
  .join("\n");
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ALUNO") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        plano: true,
        statusAssinatura: true,
      },
    });

    const podeGerar =
      planoTemRecurso(instituicao?.plano, "DOCUMENTOS_DINAMICOS") &&
      assinaturaPermiteUso(instituicao?.statusAssinatura);

    if (!podeGerar) {
      return NextResponse.json(
        {
          error:
            "Histórico acadêmico em PDF está disponível a partir do Plano Profissional e exige assinatura ativa.",
        },
        { status: 403 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
  where: {
    userId: user.id,
    instituicaoId: user.instituicaoId,
  },
  include: {
    polo: true,
    matriculas: {
      include: {
        curso: true,
        itens: {
          include: {
            disciplina: true,
          },
        },
      },
    },
  },
});

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado." },
        { status: 404 }
      );
    }

    const config = await prisma.configuracaoInstituicao.findUnique({
      where: {
        instituicaoId: user.instituicaoId,
      },
    });

    const matriculaAtual = aluno.matriculas?.[0];
    const curso = matriculaAtual?.curso;

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const logo = await carregarImagemPdf(pdfDoc, config?.logoUrl);

    console.log("LOGO URL:", config?.logoUrl);
    console.log("LOGO CARREGADA:", !!logo);

    const assinatura = await carregarImagemPdf(
      pdfDoc,
      config?.certificadoAssinaturaUrl
    );

    const preto = rgb(0, 0, 0);
    const azul = rgb(0.02, 0.12, 0.35);
    const cinza = rgb(0.35, 0.35, 0.35);
    const cinzaClaro = rgb(0.92, 0.92, 0.92);

    const templateHistorico = await prisma.documentoTemplate.findFirst({
  where: {
    instituicaoId: user.instituicaoId,
    ativo: true,
    OR: [
      { tipo: "HISTORICO" },
      { nome: { contains: "histórico", mode: "insensitive" } },
      { nome: { contains: "historico", mode: "insensitive" } },
    ],
  },
  orderBy: {
    atualizadoEm: "desc",
  },
});

const polo = aluno?.polo || null;

const nomePolo = polo?.nome || "Polo São José";

const codigoValidacao = `PHANYX-${Date.now()}-${aluno.id}`;

const valoresTemplate = {
  logoInstituicao: "{{logoInstituicao}}",
  nomeInstituicao: config?.nomeFantasia || "Instituição",
  cnpjInstituicao: config?.cnpj || "-",
  enderecoInstituicao: montarEnderecoInstituicao(config),
  telefoneInstituicao: config?.telefone || "-",
  emailInstituicao: config?.email || "-",
  cidadeInstituicao: config?.cidade || "-",
  estadoInstituicao: config?.estado || "-",
  cepInstituicao: config?.cep || "-",
  blocoInstituicao: montarBlocoInstituicao(config),

  nomePolo,
enderecoPolo: polo ? montarEnderecoInstituicao(polo) : "-",
telefonePolo: polo?.telefone || "-",
emailPolo: polo?.email || "-",
cidadePolo: polo?.cidade || "-",
estadoPolo: polo?.estado || "-",
cepPolo: polo?.cep || "-",
blocoPolo: polo
  ? [
      nomePolo,
      montarEnderecoInstituicao(polo),
      polo?.telefone ? `Telefone: ${polo.telefone}` : "",
      polo?.email ? `E-mail: ${polo.email}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  : nomePolo,

  nomeAluno: aluno.nome || "-",
  cpfAluno: aluno.cpf || "-",
  matriculaAluno: aluno.matricula || "-",
  numeroMatricula: aluno.matricula || "-",
  statusAluno: aluno.statusAluno || "-",

    codigoValidacao,
  urlValidacao: "https://www.phanyx.com.br/validar-documento",
  
  curso: curso?.nome || "-",
  statusMatricula: (matriculaAtual as any)?.status || "-",
  dataAtual: new Date().toLocaleDateString("pt-BR"),
  assinaturaDiretor: "{{assinaturaDiretor}}",
  blocoAssinaturaDiretor: "{{blocoAssinaturaDiretor}}",

  disciplinas:
    matriculaAtual?.itens?.length
      ? matriculaAtual.itens
          .map((item: any) => `- ${item.disciplina?.nome || "Disciplina"}`)
          .join("\n")
      : "-",
};

const conteudoTemplate = substituirTemplate(
  templateHistorico?.conteudo ||
    `[CABEÇALHO INSTITUCIONAL]
{{logoInstituicao}}
{{blocoInstituicao}}

[TÍTULO]
HISTÓRICO ACADÊMICO ESCOLAR

[DADOS DO ALUNO]
Aluno(a): {{nomeAluno}}
CPF: {{cpfAluno}}
Matrícula: {{matriculaAluno}}
Status: {{statusAluno}}

[DADOS DA MATRÍCULA]
Curso: {{curso}}
Status da matrícula: {{statusMatricula}}

[COMPONENTES CURRICULARES]
{{disciplinas}}

[ASSINATURA INSTITUCIONAL]
{{blocoAssinaturaDiretor}}

[RODAPÉ]
Documento emitido em {{dataAtual}} por {{nomeInstituicao}}.`,
  valoresTemplate
);

const documentoGerado = await prisma.documentoGerado.create({
  data: {
    titulo: "Histórico Acadêmico",
    tipo: "HISTORICO",
    contexto: "MATRICULA",
    conteudo: conteudoTemplate,
    status: "ASSINADO",
    exigeAssinatura: true,
    assinadoEm: new Date(),
    instituicaoId: user.instituicaoId,
    alunoId: aluno.id,
    matriculaId: matriculaAtual?.id || null,
    templateId: templateHistorico?.id || null,
    cursoId: curso?.id || null,
    codigoValidacao,
  },
});

function novaPaginaHistorico() {
  page = pdfDoc.addPage([595.28, 841.89]);
  drawBox(35, 35, 525, 770);
  return 760;
}

    function drawBox(x: number, y: number, w: number, h: number) {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderColor: preto,
        borderWidth: 0.8,
      });
    }

    function drawText(
      texto: string,
      x: number,
      y: number,
      size = 9,
      bold = false,
      color = preto
    ) {
      page.drawText(textoSeguro(texto), {
        x,
        y,
        size,
        font: bold ? fontBold : font,
        color,
      });
    }

    // Moldura geral
drawBox(35, 35, 525, 770);

function pegarSecao(nome: string) {
  const regex = new RegExp(
    `\\[${nome}\\]([\\s\\S]*?)(?=\\n\\[[^\\]]+\\]|$)`,
    "i"
  );

  return conteudoTemplate.match(regex)?.[1]?.trim() || "";
}

function limparTextoSecao(texto: string) {
  return texto
    .replaceAll("{{logoInstituicao}}", "")
    .replaceAll("{{assinaturaDiretor}}", "")
    .replaceAll("{{blocoAssinaturaDiretor}}", "")
    .trim();
}

function quebrarLinhas(texto: string, maxChars = 85) {
  const linhas: string[] = [];

  texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((linha) => {
      if (linha.length <= maxChars) {
        linhas.push(linha);
        return;
      }

      let resto = linha;

      while (resto.length > maxChars) {
        const corte = resto.lastIndexOf(" ", maxChars);
        const fim = corte > 20 ? corte : maxChars;
        linhas.push(resto.slice(0, fim).trim());
        resto = resto.slice(fim).trim();
      }

      if (resto) linhas.push(resto);
    });

  return linhas;
}

function desenharLinhas(
  texto: string,
  x: number,
  yInicial: number,
  size = 8,
  maxChars = 85
) {
  let yTexto = yInicial;
  const linhas = quebrarLinhas(texto, maxChars);

  linhas.forEach((linha) => {
    drawText(linha, x, yTexto, size);
    yTexto -= size + 4;
  });

  return yTexto;
}

function alturaDoTexto(texto: string, size = 8, maxChars = 85) {
  const linhas = quebrarLinhas(texto, maxChars);
  return Math.max(24, linhas.length * (size + 4) + 20);
}

// Layout dinâmico vindo do template
let cursorY = 790;

// Cabeçalho institucional vindo do template
const cabecalho = pegarSecao("CABEÇALHO INSTITUCIONAL");

console.log(cabecalho);


const textoCabecalho = limparTextoSecao(cabecalho);

const temLogoNoCabecalho = Boolean(logo);
const alturaTextoCabecalho = alturaDoTexto(textoCabecalho, 8, temLogoNoCabecalho ? 58 : 85);
const alturaLogo = temLogoNoCabecalho ? 70 : 0;
const alturaCabecalho = Math.max(70, alturaTextoCabecalho, alturaLogo + 20);

const cabecalhoY = cursorY - alturaCabecalho;

drawBox(45, cabecalhoY, 505, alturaCabecalho);

if (temLogoNoCabecalho) {
  drawBox(55, cabecalhoY + 10, 100, alturaCabecalho - 20);

  page.drawImage(logo, {
    x: 65,
    y: cabecalhoY + 20,
    width: 80,
    height: alturaCabecalho - 40,
  });
}

desenharLinhas(
  textoCabecalho,
  temLogoNoCabecalho ? 170 : 58,
  cabecalhoY + alturaCabecalho - 18,
  7.2,
  temLogoNoCabecalho ? 70 : 85
);

cursorY = cabecalhoY - 28;

// Título vindo do template
const titulo =
  limparTextoSecao(pegarSecao("TÍTULO")) || "HISTÓRICO ACADÊMICO ESCOLAR";

const tituloFinal = titulo.toUpperCase();

drawText(
  tituloFinal.length > 45 ? tituloFinal.slice(0, 45) : tituloFinal,
  85,
  cursorY,
  13,
  true,
  preto
);

cursorY -= 28;

// Dados do aluno vindo do template
const dadosAluno = limparTextoSecao(pegarSecao("DADOS DO ALUNO"));
const alturaDadosAluno = alturaDoTexto(dadosAluno, 8, 85) + 20;
const dadosAlunoY = cursorY - alturaDadosAluno;

drawBox(45, dadosAlunoY, 505, alturaDadosAluno);

page.drawRectangle({
  x: 45,
  y: dadosAlunoY + alturaDadosAluno - 20,
  width: 505,
  height: 20,
  color: cinzaClaro,
  borderColor: preto,
  borderWidth: 0.8,
});

drawText("DADOS DO ALUNO", 250, dadosAlunoY + alturaDadosAluno - 14, 9, true);

desenharLinhas(dadosAluno, 55, dadosAlunoY + alturaDadosAluno - 35, 8, 85);

cursorY = dadosAlunoY - 18;

// Dados da matrícula
const dadosMatricula = limparTextoSecao(pegarSecao("DADOS DA MATRÍCULA"));

if (dadosMatricula) {
  const alturaDadosMatricula = alturaDoTexto(dadosMatricula, 8, 85) + 20;
  const dadosMatriculaY = cursorY - alturaDadosMatricula;

  drawBox(45, dadosMatriculaY, 505, alturaDadosMatricula);

  page.drawRectangle({
    x: 45,
    y: dadosMatriculaY + alturaDadosMatricula - 20,
    width: 505,
    height: 20,
    color: cinzaClaro,
    borderColor: preto,
    borderWidth: 0.8,
  });

  drawText(
    "DADOS DA MATRÍCULA",
    235,
    dadosMatriculaY + alturaDadosMatricula - 14,
    9,
    true
  );

  desenharLinhas(
    dadosMatricula,
    55,
    dadosMatriculaY + alturaDadosMatricula - 35,
    8,
    85
  );

  cursorY = dadosMatriculaY - 22;
}

// Tabela de componentes curriculares
const tabelaX = 45;
let y = cursorY - 40;

if (y < 135) {
  y = novaPaginaHistorico();
  // redesenha cabeçalho da tabela
}

drawText(
  "COMPONENTES CURRICULARES",
  190,
  y + 28,
  11,
  true
);

const colunas = [
  { titulo: "DISCIPLINA", x: tabelaX, w: 260 },
  { titulo: "C.H.", x: tabelaX + 260, w: 55 },
  { titulo: "NOTA", x: tabelaX + 315, w: 60 },
  { titulo: "FREQ.", x: tabelaX + 375, w: 60 },
  { titulo: "SITUAÇÃO", x: tabelaX + 435, w: 70 },
];

page.drawRectangle({
  x: tabelaX,
  y,
  width: 505,
  height: 22,
  color: cinzaClaro,
  borderColor: preto,
  borderWidth: 0.8,
});

for (const col of colunas) {
  drawBox(col.x, y, col.w, 22);
  drawText(col.titulo, col.x + 5, y + 8, 8, true);
}

y -= 22;

const itens = matriculaAtual?.itens || [];

for (const item of itens) {

if (y < 135) {
  y = novaPaginaHistorico();

  drawText("COMPONENTES CURRICULARES - CONTINUAÇÃO", 160, y + 28, 11, true);

  page.drawRectangle({
    x: tabelaX,
    y,
    width: 505,
    height: 22,
    color: cinzaClaro,
    borderColor: preto,
    borderWidth: 0.8,
  });

  for (const col of colunas) {
    drawBox(col.x, y, col.w, 22);
    drawText(col.titulo, col.x + 5, y + 8, 8, true);
  }

  y -= 22;
}

  const disciplina = item.disciplina;
  const nomeDisciplina = textoSeguro(disciplina?.nome).slice(0, 45);
  const carga = disciplina?.cargaHoraria ? `${disciplina.cargaHoraria}h` : "-";

  const statusBruto = String((item as any).status || "A_CURSAR");

  const situacao =
    statusBruto === "CONCLUIDA" || statusBruto === "CONCLUIDO"
      ? "Concluída"
      : statusBruto === "APROVADO"
        ? "Aprovada"
        : statusBruto === "REPROVADO"
          ? "Reprovada"
          : statusBruto === "CANCELADA" || statusBruto === "CANCELADO"
            ? "Cancelada"
            : statusBruto === "DESISTENTE" || statusBruto === "DESISTENCIA"
              ? "Desistência"
              : statusBruto === "TRANCADA" || statusBruto === "TRANCADO"
                ? "Trancada"
                : "A cursar";

  for (const col of colunas) {
    drawBox(col.x, y, col.w, 20);
  }

  drawText(nomeDisciplina, tabelaX + 5, y + 7, 7.5);
  drawText(carga, tabelaX + 270, y + 7, 7.5);
  drawText("-", tabelaX + 327, y + 7, 7.5);
  drawText("-", tabelaX + 387, y + 7, 7.5);
  drawText(situacao.slice(0, 13), tabelaX + 442, y + 7, 7.2);

  y -= 20;
}

// Observações vindas do template
const observacoes = limparTextoSecao(pegarSecao("OBSERVAÇÕES"));

y -= 25;

if (observacoes) {
  drawText("OBSERVAÇÕES:", 45, y, 8.5, true);

  const yDepoisObs = desenharLinhas(
    observacoes,
    45,
    y - 13,
    6.5,
    105
  );

  y = yDepoisObs - 20;
}

// Assinatura institucional
const assinaturaY = Math.max(95, y - 95);

if (assinatura) {
  page.drawImage(assinatura, {
    x: 210,
    y: assinaturaY + 50,
    width: 130,
    height: 45,
  });
}

page.drawLine({
  start: { x: 170, y: assinaturaY + 45 },
  end: { x: 390, y: assinaturaY + 45 },
  thickness: 0.8,
  color: preto,
});

drawText(textoSeguro(config?.responsavelNome), 215, assinaturaY + 30, 9, true);
drawText(
  textoSeguro(config?.responsavelCargo || "Responsável Institucional"),
  220,
  assinaturaY + 17,
  8
);
drawText(textoSeguro(config?.nomeFantasia || "Instituição"), 225, assinaturaY + 5, 8);

// Rodapé vindo do template
const rodape =
  limparTextoSecao(pegarSecao("RODAPÉ")) ||
  `Documento emitido em ${new Date().toLocaleDateString("pt-BR")} por ${textoSeguro(
    config?.nomeFantasia || "PHANYX"
  )}.`;

drawText(rodape.slice(0, 95), 45, 65, 7.2, false, cinza);

drawText(
  `Código de validação: ${documentoGerado.codigoValidacao || codigoValidacao}`,
  45,
  52,
  7.2,
  true,
  cinza
);

drawText(
  "Valide em: https://www.phanyx.com.br/validar-documento",
  45,
  40,
  7.2,
  false,
  cinza
);

    const pdfBytes = await pdfDoc.save();

        return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="historico-academico.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar histórico acadêmico:", error);

    return NextResponse.json(
      {
        error: error?.message || String(error),
        stack: error?.stack || null,
        nomeErro: error?.name || null,
      },
      { status: 500 }
    );
  }
}