import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import {
  listarAniversariantes,
  obterFiltrosAniversariantes,
} from "@/lib/aniversariantes/listarAniversariantes";

export const runtime = "nodejs";

function escapeHtml(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nomeTipo(tipo: string) {
  if (tipo === "ALUNO") return "Aluno";
  if (tipo === "PROFESSOR") return "Professor";
  return "Funcionário";
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

    const linhas = resultado.aniversariantes
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.nome)}</td>
            <td>${escapeHtml(nomeTipo(item.tipo))}</td>
            <td>${escapeHtml(item.dataAniversario)}</td>
            <td>${escapeHtml(item.contexto || item.departamento || "")}</td>
            <td>${escapeHtml(item.telefone || "")}</td>
            <td>${escapeHtml(item.status)}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table {
              border-collapse: collapse;
              width: 100%;
              font-family: Arial, sans-serif;
              font-size: 12px;
            }

            th {
              background: #0f172a;
              color: #ffffff;
              font-weight: bold;
              border: 1px solid #cbd5e1;
              padding: 8px;
              text-align: left;
            }

            td {
              border: 1px solid #cbd5e1;
              padding: 8px;
              mso-number-format: "\\@";
            }

            h1 {
              font-family: Arial, sans-serif;
              font-size: 18px;
            }

            p {
              font-family: Arial, sans-serif;
              font-size: 12px;
            }
          </style>
        </head>

        <body>
          <h1>Aniversariantes PHANYX</h1>
          <p>Mês: ${escapeHtml(resultado.mes)} | Total: ${escapeHtml(
      resultado.total
    )}</p>

          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Aniversário</th>
                <th>Departamento / Contexto</th>
                <th>WhatsApp / Telefone</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              ${linhas}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const nomeArquivo = `aniversariantes-mes-${resultado.mes}.xls`;

    return new NextResponse("\ufeff" + html, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
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