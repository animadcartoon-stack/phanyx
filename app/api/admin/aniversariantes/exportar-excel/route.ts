import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getUserFromToken } from "@/lib/server-auth";
import {
  listarAniversariantes,
  obterFiltrosAniversariantes,
} from "@/lib/aniversariantes/listarAniversariantes";

export const runtime = "nodejs";

function nomeTipo(tipo: string) {
  if (tipo === "ALUNO") return "Aluno";
  if (tipo === "PROFESSOR") return "Professor";
  return "Funcionário";
}

function nomeMes(numeroMes: number) {
  const meses = [
    "",
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return meses[numeroMes] || String(numeroMes);
}

function limparNomeArquivo(valor: string) {
  return String(valor || "arquivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function resolverUrlArquivo(url: string | null | undefined, baseUrl: string) {
  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${baseUrl}${url}`;
  }

  return `${baseUrl}/${url}`;
}

async function baixarLogoExcel(
  url: string | null | undefined,
  baseUrl: string
): Promise<{ base64: string; extension: "png" | "jpeg" } | null> {
  const urlFinal = resolverUrlArquivo(url, baseUrl);

  if (!urlFinal) return null;

  try {
    const resposta = await fetch(urlFinal, {
      cache: "no-store",
    });

    if (!resposta.ok) return null;

    const contentType = resposta.headers.get("content-type") || "";

    if (contentType.includes("png")) {
      const arrayBuffer = await resposta.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      return {
        base64,
        extension: "png",
      };
    }

    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      const arrayBuffer = await resposta.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      return {
        base64,
        extension: "jpeg",
      };
    }

    console.warn(
      "Logo não incorporada no Excel. Formato não suportado:",
      contentType,
      urlFinal
    );

    return null;
  } catch (error) {
    console.warn("Não foi possível carregar a logo no Excel:", error);
    return null;
  }
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

    const resultado = await listarAniversariantes({
      instituicaoId: user.instituicaoId,
      filtros,
    });

    const nomeInstituicao =
      resultado.instituicao?.nome || "Instituição";

    const nomePolo =
      resultado.poloSelecionado?.nome || "Todos";

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "PHANYX";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Aniversariantes", {
      pageSetup: {
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    worksheet.views = [
      {
        state: "frozen",
        ySplit: 6,
      },
    ];

    worksheet.columns = [
  { key: "nome", width: 34 },
  { key: "tipo", width: 18 },
  { key: "aniversario", width: 16 },
  { key: "polo", width: 24 },
  { key: "contexto", width: 44 },
  { key: "telefone", width: 22 },
  { key: "status", width: 18 },
];

    const logo = await baixarLogoExcel(
      resultado.instituicao?.logoUrl || null,
      req.nextUrl.origin
    );

    if (logo) {
  const imageId = workbook.addImage({
    base64: logo.base64,
    extension: logo.extension,
  });

  worksheet.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: 150, height: 70 },
  });
}worksheet.getRow(1).height = 26;
worksheet.getRow(2).height = 22;
worksheet.getRow(3).height = 22;
worksheet.getRow(4).height = 10;

if (logo) {
  const imageId = workbook.addImage({
    base64: logo.base64,
    extension: logo.extension,
  });

  worksheet.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: 130, height: 58 },
  });

  worksheet.mergeCells("C1:G1");
  worksheet.mergeCells("C2:G2");
  worksheet.mergeCells("C3:G3");

  worksheet.getCell("C1").value = "Relatório de aniversariantes";
worksheet.getCell("C2").value = `Instituição: ${nomeInstituicao}`;
worksheet.getCell("C3").value = `Mês: ${nomeMes(
  resultado.mes
)} | Polo: ${nomePolo} | Total: ${resultado.total}`;

  worksheet.getCell("C1").font = {
  bold: true,
  size: 16,
  color: { argb: "FF0F172A" },
};

worksheet.getCell("C2").font = {
  bold: true,
  size: 11,
  color: { argb: "FF334155" },
};

worksheet.getCell("C3").font = {
  size: 10,
  color: { argb: "FF334155" },
};

  worksheet.getCell("C1").alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  worksheet.getCell("C2").alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  worksheet.getCell("C3").alignment = {
    vertical: "middle",
    horizontal: "left",
  };
} else {
  worksheet.mergeCells("A1:G1");
  worksheet.mergeCells("A2:G2");
  worksheet.mergeCells("A3:G3");

  worksheet.getCell("A1").value = nomeInstituicao;
  worksheet.getCell("A2").value = "Relatório de aniversariantes";
  worksheet.getCell("A3").value = `Mês: ${nomeMes(
    resultado.mes
  )} | Polo: ${nomePolo} | Total: ${resultado.total}`;

  worksheet.getCell("A1").font = {
    bold: true,
    size: 16,
    color: { argb: "FF0F172A" },
  };

  worksheet.getCell("A2").font = {
    bold: true,
    size: 12,
    color: { argb: "FF0F172A" },
  };

  worksheet.getCell("A3").font = {
    size: 10,
    color: { argb: "FF334155" },
  };
}
    const headerRowNumber = 5;

    worksheet.getRow(headerRowNumber).values = [
      "Nome",
      "Tipo",
      "Aniversário",
      "Polo",
      "Departamento / Contexto",
      "WhatsApp / Telefone",
      "Status",
    ];

    const headerRow = worksheet.getRow(headerRowNumber);

    headerRow.height = 24;

    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F172A" },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });

    resultado.aniversariantes.forEach((item, index) => {
      const row = worksheet.addRow({
        nome: item.nome,
        tipo: nomeTipo(item.tipo),
        aniversario: item.dataAniversario,
        polo: item.polo || "",
        contexto: item.departamento || item.contexto || "",
        telefone: item.telefone || "",
        status: item.status,
      });

      row.height = 22;

      row.eachCell((cell) => {
        cell.alignment = {
          vertical: "middle",
          wrapText: true,
        };

        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };

        if (index % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" },
          };
        }
      });
    });

    if (resultado.aniversariantes.length === 0) {
      const row = worksheet.addRow([
        "Nenhum aniversariante encontrado para os filtros selecionados.",
      ]);

      worksheet.mergeCells(`A${row.number}:G${row.number}`);
      row.getCell(1).alignment = {
        horizontal: "center",
      };
    }

    worksheet.getColumn("F").numFmt = "@";

    const buffer = await workbook.xlsx.writeBuffer();

    const nomeArquivo = `aniversariantes-${limparNomeArquivo(
      nomeMes(resultado.mes)
    )}.xlsx`;

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar aniversariantes para Excel:", error);

    return NextResponse.json(
      { error: "Erro ao exportar aniversariantes para Excel." },
      { status: 500 }
    );
  }
}