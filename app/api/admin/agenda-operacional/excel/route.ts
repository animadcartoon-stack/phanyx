import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { obterTemaRelatorio } from "@/lib/relatorios/temaRelatorio";

const COLUNAS_EXCEL_PADRAO = [
  "data",
  "hora",
  "tipo",
  "evento",
  "turma",
  "professor",
  "funcionario",
  "status",
];

const ORDEM_COLUNAS = [
  "data",
  "hora",
  "tipo",
  "curso",
  "turma",
  "disciplina",
  "evento",
  "professor",
  "funcionario",
  "departamento",
  "polo",
  "responsavel",
  "status",
  "local",
  "observacoes",
];

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

function formatarData(valor: any) {
  if (!valor) return "-";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "-";
  return data.toLocaleDateString("pt-BR");
}

function textoItem(item: any, coluna: string) {
  if (coluna === "data") return formatarData(item.data);
  if (coluna === "evento") return item.titulo || item.evento || "-";
  return item[coluna] || "-";
}

function corLinhaPorTipo(tipo?: string | null, linhaIndex = 0) {
  switch (tipo) {
    case "AULA":
      return "FFEFF6FF"; // azul muito claro

    case "PROVA":
      return "FFFEF2F2"; // vermelho muito claro

    case "ATIVIDADE":
      return "FFF0FDF4"; // verde muito claro

    case "REUNIAO":
      return "FFFAF5FF"; // roxo muito claro

    case "FERIAS_RH":
      return "FFFEFCE8"; // amarelo claro

    case "ESCALA_RH":
      return "FFEFFBFF"; // ciano claro

    case "SEM_PROFESSOR":
      return "FFFFF7ED"; // laranja claro

    default:
      return linhaIndex % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";
  }
}

function nomePeriodo(periodo?: string | null) {
  switch (periodo) {
    case "DIA":
      return "Hoje";
    case "SEMANA":
      return "Semana";
    case "MES":
      return "Mês";
    case "SEMESTRE_1":
      return "1º semestre";
    case "SEMESTRE_2":
      return "2º semestre";
    case "ANO":
      return "Ano";
    default:
      return "Semana";
  }
}

async function carregarImagemBase64(url?: string | null) {
  if (!url) return null;

  try {
    let urlImagem = url;

    if (urlImagem.startsWith("/")) {
      urlImagem = `${process.env.NEXT_PUBLIC_APP_URL}${urlImagem}`;
    }

    const res = await fetch(urlImagem, { cache: "no-store" });

    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();

    return Buffer.from(arrayBuffer).toString("base64");
  } catch (error) {
    console.error("Erro ao carregar logo no Excel:", error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const usuario = await prisma.user.findUnique({
      where: { id: user.id },
      select: { nome: true, email: true },
    });

    const configuracaoInstituicao =
      await prisma.configuracaoInstituicao.findUnique({
        where: { instituicaoId: user.instituicaoId },
        select: {
          nomeFantasia: true,
          razaoSocial: true,
          cnpj: true,
          telefone: true,
          email: true,
          cidade: true,
          estado: true,
          logoUrl: true,
          corRelatorio: true,
        },
      });

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: { nome: true },
    });

    const nomeInstituicao =
      configuracaoInstituicao?.nomeFantasia ||
      configuracaoInstituicao?.razaoSocial ||
      instituicao?.nome ||
      "Instituição";

const temaRelatorio = obterTemaRelatorio(
  configuracaoInstituicao?.corRelatorio
);

    const preferencia = await prisma.preferenciaAgendaOperacional.findUnique({
      where: {
        instituicaoId_userId: {
          instituicaoId: user.instituicaoId,
          userId: user.id,
        },
      },
    });

   const colunasExcelSelecionadas = Array.isArray(preferencia?.colunasExcel)
  ? (preferencia.colunasExcel as string[])
  : COLUNAS_EXCEL_PADRAO;

const colunasExcel = ORDEM_COLUNAS.filter((coluna) =>
  colunasExcelSelecionadas.includes(coluna)
);

    const agendaUrl = new URL(
      "/api/admin/agenda-operacional",
      req.nextUrl.origin
    );

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
        { error: dadosAgenda?.error || "Erro ao carregar agenda para Excel." },
        { status: agendaRes.status }
      );
    }

    const agenda = dadosAgenda?.agenda || [];

    const resumoAgenda = {
      aulas: agenda.filter((i: any) => i.tipo === "AULA").length,
      provas: agenda.filter((i: any) => i.tipo === "PROVA").length,
      atividades: agenda.filter((i: any) => i.tipo === "ATIVIDADE").length,
      reunioes: agenda.filter((i: any) => i.tipo === "REUNIAO").length,
      ferias: agenda.filter((i: any) => i.tipo === "FERIAS_RH").length,
      escalas: agenda.filter((i: any) => i.tipo === "ESCALA_RH").length,
      semProfessor: agenda.filter((i: any) => i.tipo === "SEM_PROFESSOR").length,
};

    const periodo = req.nextUrl.searchParams.get("periodo");

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "PHANYX";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Agenda Operacional", {
  views: [
    {
      state: "frozen",
      ySplit: 14,   // congela tudo acima da tabela
      xSplit: 1,    // congela a primeira coluna
    },
  ],
});
      

    const logoBase64 = await carregarImagemBase64(
  configuracaoInstituicao?.logoUrl
);

if (logoBase64) {
  const logoId = workbook.addImage({
    base64: logoBase64,
    extension: "png",
  });

  worksheet.addImage(logoId, {
    tl: { col: 0, row: 0 },
    ext: { width: 90, height: 50 },
  });
}

    worksheet.mergeCells("B1:G1");
    worksheet.getCell("B1").value = "Agenda Operacional";
    worksheet.getCell("B1").font = {
  bold: true,
  size: 20,
  color: {
    argb: temaRelatorio.fundo,
  },
};

    worksheet.getCell("A2").value = `Instituição: ${nomeInstituicao}`;
    worksheet.getCell("A3").value = `CNPJ: ${configuracaoInstituicao?.cnpj || "-"}`;
    worksheet.getCell("A4").value = `Contato: ${[
      configuracaoInstituicao?.telefone,
      configuracaoInstituicao?.email,
      [configuracaoInstituicao?.cidade, configuracaoInstituicao?.estado]
        .filter(Boolean)
        .join(" - "),
    ]
      .filter(Boolean)
      .join(" • ") || "-"}`;
    worksheet.getCell("A5").value = `Período: ${nomePeriodo(periodo)}`;
    worksheet.getCell("A6").value = `Emitido em: ${new Date().toLocaleString("pt-BR")}`;
    worksheet.getCell("A7").value = `Emitido por: ${
      usuario?.nome || usuario?.email || "-"
    }`;

    worksheet.getCell("A8").value = `Eventos encontrados: ${agenda.length}`;
    worksheet.getCell("A8").font = { bold: true };

    worksheet.getCell("A10").value = "Resumo da Agenda";
    worksheet.getCell("A10").font = { bold: true, size: 12 };

    worksheet.getCell("A11").value = `Aulas: ${resumoAgenda.aulas}`;
    worksheet.getCell("C11").value = `Provas: ${resumoAgenda.provas}`;
    worksheet.getCell("E11").value = `Atividades: ${resumoAgenda.atividades}`;
    worksheet.getCell("G11").value = `Reuniões: ${resumoAgenda.reunioes}`;

    worksheet.getCell("A12").value = `Férias RH: ${resumoAgenda.ferias}`;
    worksheet.getCell("C12").value = `Escalas RH: ${resumoAgenda.escalas}`;
    worksheet.getCell("E12").value = `Sem professor: ${resumoAgenda.semProfessor}`;

const linhaCabecalho = 14;

    colunasExcel.forEach((coluna, index) => {
      const cell = worksheet.getCell(linhaCabecalho, index + 1);
      cell.value = NOMES_COLUNAS[coluna] || coluna;
      cell.font = { bold: true, color: { argb: temaRelatorio.texto } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: temaRelatorio.fundo },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });

    agenda.forEach((item: any, linhaIndex: number) => {
      const linha = linhaCabecalho + 1 + linhaIndex;

      colunasExcel.forEach((coluna, index) => {
        const cell = worksheet.getCell(linha, index + 1);
        cell.value = textoItem(item, coluna);
        cell.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: {
    argb: corLinhaPorTipo(item.tipo, linhaIndex),
  },
};
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
        if (coluna === "data" || coluna === "hora") {
  cell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };
}
      });
    });

    worksheet.autoFilter = {
      from: { row: linhaCabecalho, column: 1 },
      to: { row: linhaCabecalho, column: colunasExcel.length },
    };

    worksheet.columns.forEach((column) => {
      let maxLength = 12;

      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const value = String(cell.value || "");
        maxLength = Math.max(maxLength, value.length + 2);
      });

      column.width = Math.min(maxLength, 38);
    });

  worksheet.getRow(linhaCabecalho).height = 24;

    worksheet.pageSetup = {
  paperSize: 9,               // A4
  orientation: "landscape",   // Paisagem
  fitToPage: true,
  fitToWidth: 1,
  fitToHeight: 0,
  horizontalCentered: true,
  verticalCentered: false,
  margins: {
    left: 0.4,
    right: 0.4,
    top: 0.5,
    bottom: 0.5,
    header: 0.3,
    footer: 0.3,
  },
};

worksheet.pageSetup.printTitlesRow = `${linhaCabecalho}:${linhaCabecalho}`;

worksheet.headerFooter.oddFooter =
  '&L&"Arial"&8Gerado pelo PHANYX&C&"Arial"&8Emitido em ' +
  new Date().toLocaleString("pt-BR") +
  '&R&"Arial"&8Página &P de &N';

worksheet.headerFooter.evenFooter =
  worksheet.headerFooter.oddFooter;

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="agenda-operacional.xlsx"',
        "Cache-Control": "no-store",
      },
    });

  } catch (error: any) {
    console.error("Erro ao exportar Excel da agenda operacional:", error);

    return NextResponse.json(
      {
        error:
          error?.message || "Erro ao exportar Excel da agenda operacional.",
      },
      { status: 500 }
    );
  }
}