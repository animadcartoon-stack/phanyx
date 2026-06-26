import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

const COLUNAS_PDF_PADRAO = ["data", "hora", "tipo", "evento", "turma", "professor", "status"];

const NOMES_COLUNAS: Record<string, string> = {
  data: "Data",
  hora: "Hora",
  tipo: "Tipo",
  curso: "Curso",
  turma: "Turma",
  disciplina: "Disciplina",
  evento: "Evento",
  professor: "Professor",
  funcionario: "Funcionário",
  departamento: "Departamento",
  polo: "Polo",
  responsavel: "Responsável",
  status: "Status",
  local: "Local",
  observacoes: "Observações",
};

function textoItem(item: any, coluna: string) {
  if (coluna === "data") {
    return item.data ? new Date(item.data).toLocaleDateString("pt-BR") : "-";
  }

  if (coluna === "evento") {
    return item.titulo || item.evento || "-";
  }

  return item[coluna] || "-";
}

function cortarTexto(texto: string, limite: number) {
  if (!texto) return "-";
  return texto.length > limite ? `${texto.slice(0, limite - 3)}...` : texto;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const usuario = await prisma.user.findUnique({
  where: { id: user.id },
  select: {
    nome: true,
  },
});

const configuracaoInstituicao =
  await prisma.configuracaoInstituicao.findUnique({
    where: {
      instituicaoId: user.instituicaoId,
    },
    select: {
      nomeFantasia: true,
      razaoSocial: true,
      cnpj: true,
      telefone: true,
      email: true,
      cidade: true,
      estado: true,
      logoUrl: true,
    },
  });

const instituicao = await prisma.instituicao.findUnique({
  where: {
    id: user.instituicaoId,
  },
  select: {
    nome: true,
  },
});

const nomeInstituicao =
  configuracaoInstituicao?.nomeFantasia ||
  configuracaoInstituicao?.razaoSocial ||
  instituicao?.nome ||
  "Instituição";

    const preferencia = await prisma.preferenciaAgendaOperacional.findUnique({
      where: {
        instituicaoId_userId: {
          instituicaoId: user.instituicaoId,
          userId: user.id,
        },
      },
    });

    const colunasPdf = Array.isArray(preferencia?.colunasPdf)
      ? (preferencia?.colunasPdf as string[])
      : COLUNAS_PDF_PADRAO;

    const agendaUrl = new URL("/api/admin/agenda-operacional", req.nextUrl.origin);
    req.nextUrl.searchParams.forEach((value, key) => {
      agendaUrl.searchParams.set(key, value);
    });

    const agendaRes = await fetch(agendaUrl.toString(), {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
      cache: "no-store",
    });

    const dadosAgenda = await agendaRes.json();

    if (!agendaRes.ok) {
      return NextResponse.json(
        { error: dadosAgenda?.error || "Erro ao carregar agenda para PDF." },
        { status: agendaRes.status }
      );
    }

    const agenda = dadosAgenda?.agenda || [];

    const pdfDoc = await PDFDocument.create();
    const fonteNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fonteBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const largura = 842;
    const altura = 595;
    const margem = 32;

    let pagina = pdfDoc.addPage([largura, altura]);
    let y = altura - margem;

    function novaPagina() {
      pagina = pdfDoc.addPage([largura, altura]);
      y = altura - margem;
    }

    function escrever(texto: string, x: number, yPos: number, tamanho = 9, bold = false) {
      pagina.drawText(texto, {
        x,
        y: yPos,
        size: tamanho,
        font: bold ? fonteBold : fonteNormal,
        color: rgb(0.08, 0.12, 0.2),
      });
    }

    escrever(nomeInstituicao, margem, y, 16, true);
escrever("Agenda Operacional", margem, y - 20, 14, true);

const linhaContato = [
  configuracaoInstituicao?.cnpj
    ? `CNPJ: ${configuracaoInstituicao.cnpj}`
    : "",
  configuracaoInstituicao?.telefone || "",
  configuracaoInstituicao?.email || "",
  [configuracaoInstituicao?.cidade, configuracaoInstituicao?.estado]
    .filter(Boolean)
    .join(" - "),
]
  .filter(Boolean)
  .join(" • ");

if (linhaContato) {
  escrever(linhaContato, margem, y - 40, 8);
}

escrever(`Emitido em: ${new Date().toLocaleString("pt-BR")}`, margem, y - 58, 9);
escrever(`Usuário: ${usuario?.nome || "-"}`, margem + 260, y - 58, 9);

y -= 88;

    const larguraTabela = largura - margem * 2;
    const larguraColuna = larguraTabela / Math.max(colunasPdf.length, 1);

    pagina.drawRectangle({
      x: margem,
      y: y - 8,
      width: larguraTabela,
      height: 20,
      color: rgb(0.9, 0.93, 0.97),
    });

    colunasPdf.forEach((coluna, index) => {
      escrever(
        cortarTexto(NOMES_COLUNAS[coluna] || coluna, 16),
        margem + index * larguraColuna + 4,
        y,
        7,
        true
      );
    });

    y -= 24;

    agenda.forEach((item: any, linhaIndex: number) => {
      if (y < 50) {
        novaPagina();

        pagina.drawRectangle({
          x: margem,
          y: y - 8,
          width: larguraTabela,
          height: 20,
          color: rgb(0.9, 0.93, 0.97),
        });

        colunasPdf.forEach((coluna, index) => {
          escrever(
            cortarTexto(NOMES_COLUNAS[coluna] || coluna, 16),
            margem + index * larguraColuna + 4,
            y,
            7,
            true
          );
        });

        y -= 24;
      }

      if (linhaIndex % 2 === 0) {
        pagina.drawRectangle({
          x: margem,
          y: y - 6,
          width: larguraTabela,
          height: 18,
          color: rgb(0.98, 0.99, 1),
        });
      }

      colunasPdf.forEach((coluna, index) => {
        escrever(
          cortarTexto(String(textoItem(item, coluna)), 22),
          margem + index * larguraColuna + 4,
          y,
          7
        );
      });

      y -= 18;
    });

    const paginas = pdfDoc.getPages();

    paginas.forEach((p, index) => {
      p.drawText(`Página ${index + 1} de ${paginas.length}`, {
        x: largura - margem - 90,
        y: 20,
        size: 8,
        font: fonteNormal,
        color: rgb(0.35, 0.4, 0.5),
      });

      p.drawText(`Gerado pelo PHANYX • ${nomeInstituicao}`, {
        x: margem,
        y: 20,
        size: 8,
        font: fonteNormal,
        color: rgb(0.35, 0.4, 0.5),
      });
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
  status: 200,
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": 'inline; filename="agenda-operacional.pdf"',
  },
});
  } catch (error) {
    console.error("Erro ao gerar PDF da agenda operacional:", error);
    return NextResponse.json(
      { error: "Erro ao gerar PDF da agenda operacional." },
      { status: 500 }
    );
  }
}