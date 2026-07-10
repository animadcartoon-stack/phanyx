import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getUserFromToken } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import {
  AniversarianteItem,
  listarAniversariantes,
  obterFiltrosAniversariantes,
} from "@/lib/aniversariantes/listarAniversariantes";

export const runtime = "nodejs";

function limparTextoPdf(valor: unknown) {
  return String(valor ?? "")
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7EÀ-ÿ]/g, "")
    .trim();
}

function cortar(valor: unknown, limite: number) {
  const texto = limparTextoPdf(valor);

  if (texto.length <= limite) return texto;

  return texto.slice(0, limite - 3) + "...";
}

function nomeTipo(tipo: string) {
  if (tipo === "ALUNO") return "Aluno";
  if (tipo === "PROFESSOR") return "Professor";
  return "Funcionário";
}

async function gerarPdfAniversariantes({
  mes,
  total,
  aniversariantes,
  nomeInstituicao,
  nomePolo,
}: {
  mes: number;
  total: number;
  aniversariantes: AniversarianteItem[];
  nomeInstituicao: string;
  nomePolo?: string | null;
}) {
  const pdf = await PDFDocument.create();

  const fonte = await pdf.embedFont(StandardFonts.Helvetica);
  const fonteBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const largura = 841.89;
  const altura = 595.28;
  const margem = 36;

  let pagina = pdf.addPage([largura, altura]);
  let y = altura - margem;

  function texto(
    valor: string,
    x: number,
    yTexto: number,
    tamanho = 9,
    bold = false
  ) {
    pagina.drawText(limparTextoPdf(valor), {
      x,
      y: yTexto,
      size: tamanho,
      font: bold ? fonteBold : fonte,
      color: rgb(0.05, 0.09, 0.16),
    });
  }

  function novaPagina() {
    pagina = pdf.addPage([largura, altura]);
    y = altura - margem;
    desenharCabecalho();
    desenharCabecalhoTabela();
  }

  function desenharCabecalho() {
  texto(nomeInstituicao || "Instituição", margem, y, 16, true);

  if (nomePolo) {
    texto(`Polo: ${nomePolo}`, margem, y - 18, 9, false);
    texto("Relatório de aniversariantes", margem, y - 34, 12, true);
    texto(`Mês: ${mes} | Total: ${total}`, margem, y - 52, 9, false);

    y -= 76;
    return;
  }

  texto("Relatório de aniversariantes", margem, y - 20, 12, true);
  texto(`Mês: ${mes} | Total: ${total}`, margem, y - 38, 9, false);

  y -= 62;
}

  function desenharCabecalhoTabela() {
    pagina.drawRectangle({
      x: margem,
      y: y - 6,
      width: largura - margem * 2,
      height: 22,
      color: rgb(0.06, 0.09, 0.16),
    });

    pagina.drawText("Nome", {
      x: margem + 8,
      y,
      size: 8,
      font: fonteBold,
      color: rgb(1, 1, 1),
    });

    pagina.drawText("Tipo", {
      x: 230,
      y,
      size: 8,
      font: fonteBold,
      color: rgb(1, 1, 1),
    });

    pagina.drawText("Data", {
      x: 315,
      y,
      size: 8,
      font: fonteBold,
      color: rgb(1, 1, 1),
    });

    pagina.drawText("Departamento / Contexto", {
      x: 375,
      y,
      size: 8,
      font: fonteBold,
      color: rgb(1, 1, 1),
    });

    pagina.drawText("WhatsApp", {
      x: 570,
      y,
      size: 8,
      font: fonteBold,
      color: rgb(1, 1, 1),
    });

    pagina.drawText("Status", {
      x: 685,
      y,
      size: 8,
      font: fonteBold,
      color: rgb(1, 1, 1),
    });

    y -= 24;
  }

  desenharCabecalho();
  desenharCabecalhoTabela();

  aniversariantes.forEach((item, index) => {
    if (y < 48) {
      novaPagina();
    }

    if (index % 2 === 0) {
      pagina.drawRectangle({
        x: margem,
        y: y - 5,
        width: largura - margem * 2,
        height: 18,
        color: rgb(0.96, 0.97, 0.99),
      });
    }

    texto(cortar(item.nome, 34), margem + 8, y, 8);
    texto(nomeTipo(item.tipo), 230, y, 8);
    texto(item.dataAniversario, 315, y, 8);
    texto(cortar(item.departamento || item.contexto || "-", 35), 375, y, 8);
    texto(cortar(item.telefone || "-", 18), 570, y, 8);
    texto(cortar(item.status, 20), 685, y, 8);

    y -= 18;
  });

  if (aniversariantes.length === 0) {
    texto("Nenhum aniversariante encontrado para os filtros selecionados.", margem + 8, y, 9);
  }

  return pdf.save();
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN" || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const filtros = obterFiltrosAniversariantes(req);

const [resultado, instituicao] = await Promise.all([
  listarAniversariantes({
    instituicaoId: user.instituicaoId,
    filtros,
  }),

  prisma.instituicao.findUnique({
    where: {
      id: user.instituicaoId,
    },
    select: {
      nome: true,
    },
  }),
]);

const pdfBytes = await gerarPdfAniversariantes({
  mes: resultado.mes,
  total: resultado.total,
  aniversariantes: resultado.aniversariantes,
  nomeInstituicao: instituicao?.nome || "Instituição",
  nomePolo: null,
});

    const nomeArquivo = `aniversariantes-mes-${resultado.mes}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar aniversariantes para PDF:", error);

    return NextResponse.json(
      { error: "Erro ao exportar aniversariantes para PDF." },
      { status: 500 }
    );
  }
}