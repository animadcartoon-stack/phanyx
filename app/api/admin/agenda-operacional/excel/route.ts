import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

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

function limpar(valor: any) {
  return String(valor ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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

    const preferencia = await prisma.preferenciaAgendaOperacional.findUnique({
      where: {
        instituicaoId_userId: {
          instituicaoId: user.instituicaoId,
          userId: user.id,
        },
      },
    });

    const colunasExcel = Array.isArray(preferencia?.colunasExcel)
      ? (preferencia.colunasExcel as string[])
      : COLUNAS_EXCEL_PADRAO;

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

    const periodo = req.nextUrl.searchParams.get("periodo");

    const cabecalhos = colunasExcel
      .map((coluna) => `<th>${limpar(NOMES_COLUNAS[coluna] || coluna)}</th>`)
      .join("");

    const linhas =
      agenda.length === 0
        ? `<tr><td colspan="${colunasExcel.length}">Nenhum evento encontrado.</td></tr>`
        : agenda
            .map(
              (item: any) =>
                `<tr>${colunasExcel
                  .map(
                    (coluna) =>
                      `<td>${limpar(textoItem(item, coluna))}</td>`
                  )
                  .join("")}</tr>`
            )
            .join("");

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #111827;
            }

            h1 {
              font-size: 20px;
              margin-bottom: 4px;
            }

            p {
              margin: 3px 0;
              font-size: 12px;
            }

            table {
              border-collapse: collapse;
              width: 100%;
              margin-top: 14px;
            }

            th {
              background: #1e3a8a;
              color: #ffffff;
              font-weight: bold;
            }

            th, td {
              border: 1px solid #9ca3af;
              padding: 6px;
              font-size: 12px;
              vertical-align: top;
            }
          </style>
        </head>

        <body>
          <h1>Agenda Operacional</h1>

          <p><strong>Instituição:</strong> ${limpar(nomeInstituicao)}</p>
          <p><strong>CNPJ:</strong> ${limpar(configuracaoInstituicao?.cnpj || "-")}</p>
          <p><strong>Contato:</strong> ${limpar(
            [
              configuracaoInstituicao?.telefone,
              configuracaoInstituicao?.email,
              [configuracaoInstituicao?.cidade, configuracaoInstituicao?.estado]
                .filter(Boolean)
                .join(" - "),
            ]
              .filter(Boolean)
              .join(" • ") || "-"
          )}</p>
          <p><strong>Período:</strong> ${limpar(nomePeriodo(periodo))}</p>
          <p><strong>Emitido em:</strong> ${limpar(new Date().toLocaleString("pt-BR"))}</p>
          <p><strong>Emitido por:</strong> ${limpar(usuario?.nome || usuario?.email || "-")}</p>

          <table>
            <thead>
              <tr>${cabecalhos}</tr>
            </thead>
            <tbody>
              ${linhas}
            </tbody>
          </table>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": 'attachment; filename="agenda-operacional.xls"',
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