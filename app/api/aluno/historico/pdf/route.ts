import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { planoTemRecurso } from "@/lib/plano-acesso";
import { assinaturaPermiteUso } from "@/lib/assinatura-acesso";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatarDataAtual() {
  return new Date().toLocaleDateString("pt-BR");
}

function substituirTemplate(template: string, valores: Record<string, string>) {
  let texto = template;

  for (const [chave, valor] of Object.entries(valores)) {
    texto = texto.replaceAll(`{{${chave}}}`, valor);
  }

  return texto;
}

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

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ALUNO") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        plano: true,
        statusAssinatura: true,
      },
    });

    const podeGerarHistorico =
      planoTemRecurso(instituicao?.plano, "DOCUMENTOS_DINAMICOS") &&
      assinaturaPermiteUso(instituicao?.statusAssinatura);

    if (!podeGerarHistorico) {
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
        notas: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const template = await prisma.documentoTemplate.findFirst({
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
    id: "desc",
  },
});

    if (!template) {
      return NextResponse.json(
        {
          error:
            "Nenhum template de Histórico ativo foi encontrado. O administrador precisa cadastrar um modelo em Documentos > Templates.",
        },
        { status: 404 }
      );
    }

    const config = await prisma.configuracaoInstituicao.findUnique({
      where: {
        instituicaoId: user.instituicaoId,
      },
    });

    const matriculaAtual = aluno.matriculas?.[0] || null;
    const cursoNome = matriculaAtual?.curso?.nome || "Curso não informado";

    const disciplinasMatricula =
      matriculaAtual?.itens
        ?.map((item) => item.disciplina?.nome)
        .filter(Boolean) || [];

    const notasTexto =
  aluno.notas.length > 0
    ? aluno.notas
        .map((nota) => {
          const valorNota = Number(nota.nota || 0).toFixed(1);
          const status = nota.aprovado ? "Concluída" : "Incompleta";

          return `- Disciplina ID ${nota.disciplinaId}: nota ${valorNota} — ${status}`;
        })
        .join("\n")
    : "- Nenhum registro acadêmico encontrado";

    const disciplinasTexto =
      disciplinasMatricula.length > 0
        ? disciplinasMatricula.map((d) => `- ${d}`).join("\n")
        : notasTexto;

    const conteudoFinal = substituirTemplate(template.conteudo, {
      nomeInstituicao: config?.nomeFantasia || "Instituição",
      cnpjInstituicao: config?.cnpj || "-",
      responsavelLegal: config?.responsavelNome || "-",
      nomeAluno: aluno.nome || "-",
      cpfAluno: aluno.cpf || "-",
      matriculaAluno: aluno.matricula || "-",
      curso: cursoNome,
      disciplinas: disciplinasTexto,
      dataAtual: formatarDataAtual(),
      cidadeAssinatura: config?.cidadeAssinatura || config?.cidade || "-",
      tituloDocumento: template.nome || "Histórico Acadêmico",
      assinaturaDiretor: config?.responsavelNome || "Direção Acadêmica",
      numeroMatricula: aluno.matricula || "-",
      valorContrato: "-",
      referenciaFinanceira: "-",
      blocoAssinaturaDiretor: "__BLOCO_ASSINATURA_DIRETOR__",
    });

    const documento = await prisma.documentoGerado.create({
      data: {
        titulo: template.nome || "Histórico Acadêmico",
        tipo: template.tipo,
        contexto: template.contexto,
        conteudo: conteudoFinal,
        status: "GERADO",
        exigeAssinatura: template.exigeAssinatura,
        instituicaoId: user.instituicaoId,
        alunoId: aluno.id,
        matriculaId: matriculaAtual?.id || null,
        templateId: template.id,
      },
    });

    const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage([595, 842]);

const fonteTitulo = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
const fonteTexto = await pdfDoc.embedFont(StandardFonts.Helvetica);

const assinaturaDiretorImagem = await carregarImagemPdf(
  pdfDoc,
  config?.certificadoAssinaturaUrl
);

const logoInstituicaoImagem = await carregarImagemPdf(
  pdfDoc,
  config?.logoUrl
);

let y = 790;

page.drawText(config?.nomeFantasia || "Instituição", {
  x: 50,
  y,
  size: 16,
  font: fonteTitulo,
  color: rgb(0, 0.15, 0.45),
});

y -= 24;

page.drawText("HISTÓRICO ACADÊMICO", {
  x: 50,
  y,
  size: 20,
  font: fonteTitulo,
  color: rgb(0, 0, 0),
});

y -= 35;

const linhas = documento.conteudo.split("\n");

for (const linha of linhas) {
  if (y < 90) break;

  if (linha.includes("__BLOCO_ASSINATURA_DIRETOR__")) {
    y -= 12;

    if (assinaturaDiretorImagem) {
      page.drawImage(assinaturaDiretorImagem, {
        x: 50,
        y: y - 35,
        width: 160,
        height: 55,
      });
    }

    page.drawLine({
      start: { x: 50, y: y - 45 },
      end: { x: 280, y: y - 45 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    page.drawText(config?.responsavelNome || "Direção Acadêmica", {
      x: 50,
      y: y - 62,
      size: 10,
      font: fonteTitulo,
      color: rgb(0, 0, 0),
    });

    page.drawText(config?.nomeFantasia || "Instituição", {
      x: 50,
      y: y - 78,
      size: 9,
      font: fonteTexto,
      color: rgb(0.25, 0.25, 0.25),
    });

    page.drawText(`CNPJ: ${config?.cnpj || "-"}`, {
      x: 50,
      y: y - 92,
      size: 9,
      font: fonteTexto,
      color: rgb(0.25, 0.25, 0.25),
    });

    y -= 115;
    continue;
  }

  page.drawText(linha.slice(0, 95), {
    x: 50,
    y,
    size: 11,
    font: fonteTexto,
    color: rgb(0, 0, 0),
  });

  y -= 17;
}

page.drawText(`Documento emitido em ${formatarDataAtual()}`, {
  x: 50,
  y: 45,
  size: 9,
  font: fonteTexto,
  color: rgb(0.35, 0.35, 0.35),
});

const pdfBytes = await pdfDoc.save();

return new NextResponse(Buffer.from(pdfBytes), {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=historico-academico-${aluno.id}.pdf`,
  },
});
  } catch (error: any) {
    console.error("Erro ao gerar histórico acadêmico:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao gerar histórico acadêmico" },
      { status: 500 }
    );
  }
}