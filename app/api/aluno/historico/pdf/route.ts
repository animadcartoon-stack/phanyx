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
    const page = pdfDoc.addPage([595.28, 841.89]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const logo = await carregarImagemPdf(pdfDoc, config?.logoUrl);
    const assinatura = await carregarImagemPdf(
      pdfDoc,
      config?.certificadoAssinaturaUrl
    );

    const preto = rgb(0, 0, 0);
    const azul = rgb(0.02, 0.12, 0.35);
    const cinza = rgb(0.35, 0.35, 0.35);
    const cinzaClaro = rgb(0.92, 0.92, 0.92);

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

    // Cabeçalho
    drawBox(45, 715, 505, 80);

    if (logo) {
      page.drawImage(logo, {
        x: 55,
        y: 732,
        width: 55,
        height: 45,
      });
    }

    const nomeInstituicao =
  config?.razaoSocial?.trim() ||
  config?.nomeFantasia?.trim() ||
  "Instituição";

const nomeFantasia = config?.nomeFantasia?.trim() || "";

const enderecoLinha = [
  config?.endereco,
  config?.numero,
  config?.bairro,
].filter(Boolean).join(", ");

const cidadeEstado = [
  config?.cidade,
  config?.estado,
].filter(Boolean).join(" - ");

const contatos = [
  config?.telefone ? `Telefone: ${config.telefone}` : "",
  config?.email ? `E-mail: ${config.email}` : "",
].filter(Boolean).join("   ");

drawText(nomeInstituicao.toUpperCase(), 125, 770, 12, true, azul);

if (nomeFantasia && nomeFantasia !== nomeInstituicao) {
  drawText(nomeFantasia, 125, 756, 9, true);
}

if (config?.cnpj) {
  drawText(`CNPJ: ${config.cnpj}`, 125, 742, 8);
}

if (enderecoLinha) {
  drawText(enderecoLinha, 125, 729, 8);
}

if (cidadeEstado) {
  drawText(cidadeEstado, 125, 716, 8);
}

if (contatos) {
  drawText(contatos, 125, 703, 8);
}

    // Título
    drawText("HISTÓRICO ACADÊMICO ESCOLAR", 180, 685, 15, true, preto);

    // Dados do aluno
    drawBox(45, 595, 505, 70);
    page.drawRectangle({
      x: 45,
      y: 645,
      width: 505,
      height: 20,
      color: cinzaClaro,
      borderColor: preto,
      borderWidth: 0.8,
    });

    drawText("DADOS DO ALUNO", 250, 651, 9, true);

    drawText(`Aluno(a): ${textoSeguro(aluno.nome)}`, 55, 628, 9, true);
    drawText(`CPF: ${textoSeguro(aluno.cpf)}`, 55, 612, 9);
    drawText(`Matrícula: ${textoSeguro((aluno as any).matricula)}`, 230, 612, 9);
    drawText(`Nascimento: ${dataBR((aluno as any).dataNascimento)}`, 390, 612, 9);
    drawText(`Curso: ${textoSeguro(curso?.nome)}`, 55, 598, 9);

    // Tabela
    const tabelaX = 45;
    let y = 555;

    drawText("COMPONENTES CURRICULARES", 210, 570, 11, true);

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

    for (const item of itens.slice(0, 18)) {
      const disciplina = item.disciplina;
      const notaEncontrada = null;

      const nomeDisciplina = textoSeguro(disciplina?.nome).slice(0, 45);
      const carga = disciplina?.cargaHoraria
        ? `${disciplina.cargaHoraria}h`
        : "-";
      const nota =
        notaEncontrada?.valor !== undefined && notaEncontrada?.valor !== null
          ? String(notaEncontrada.valor)
          : "-";
      const frequencia =
        (notaEncontrada as any)?.frequencia !== undefined &&
        (notaEncontrada as any)?.frequencia !== null
          ? `${(notaEncontrada as any).frequencia}%`
          : "-";

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
      drawText(nota, tabelaX + 327, y + 7, 7.5);
      drawText(frequencia, tabelaX + 387, y + 7, 7.5);
      drawText(situacao.slice(0, 13), tabelaX + 442, y + 7, 7.2);

      y -= 20;
    }

    if (itens.length === 0) {
      for (const col of colunas) {
        drawBox(col.x, y, col.w, 24);
      }

      drawText("Nenhuma disciplina encontrada.", tabelaX + 5, y + 8, 8);
      y -= 24;
    }

    // Resumo
    y -= 25;

    drawBox(45, y - 55, 505, 55);
    page.drawRectangle({
      x: 45,
      y: y - 20,
      width: 505,
      height: 20,
      color: cinzaClaro,
      borderColor: preto,
      borderWidth: 0.8,
    });

    drawText("RESUMO ACADÊMICO", 235, y - 13, 9, true);

    const totalDisciplinas = itens.length;
    const cargaTotal = itens.reduce((total: number, item: any) => {
      return total + Number(item.disciplina?.cargaHoraria || 0);
    }, 0);

    drawText(`Total de disciplinas: ${totalDisciplinas}`, 55, y - 35, 8.5);
    drawText(`Carga horária total: ${cargaTotal}h`, 220, y - 35, 8.5);
    drawText(`Situação da matrícula: ${textoSeguro((matriculaAtual as any)?.status)}`, 370, y - 35, 8.5);

    // Observação
    y -= 90;

    drawText("OBSERVAÇÕES:", 45, y, 9, true);
    drawText(
      "Este histórico acadêmico foi emitido eletronicamente pelo PHANYX com base nos registros acadêmicos da instituição.",
      45,
      y - 15,
      8
    );

    // Assinatura
    const assinaturaY = 95;

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
    drawText(textoSeguro(config?.responsavelCargo || "Responsável Institucional"), 220, assinaturaY + 17, 8);
    drawText(textoSeguro(config?.nomeFantasia || "Instituição"), 225, assinaturaY + 5, 8);

    // Rodapé
    drawText(
      `Documento emitido em ${new Date().toLocaleDateString("pt-BR")} por ${textoSeguro(config?.nomeFantasia || "PHANYX")}.`,
      45,
      55,
      7.5,
      false,
      cinza
    );

    drawText(
      "PHANYX - Plataforma Acadêmica",
      395,
      55,
      7.5,
      true,
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