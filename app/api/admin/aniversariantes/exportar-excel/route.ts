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

async function imagemParaBase64(
  url: string | null | undefined,
  baseUrl: string
) {
  const urlFinal = resolverUrlArquivo(url, baseUrl);

  if (!urlFinal) return "";

  try {
    const resposta = await fetch(urlFinal, {
      cache: "no-store",
    });

    if (!resposta.ok) return "";

    const contentType = resposta.headers.get("content-type") || "";

    if (
      !contentType.includes("png") &&
      !contentType.includes("jpeg") &&
      !contentType.includes("jpg") &&
      !contentType.includes("webp")
    ) {
      return "";
    }

    const arrayBuffer = await resposta.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.warn("Não foi possível carregar a logo no Excel:", error);
    return "";
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

      const logoBase64 = await imagemParaBase64(
  resultado.instituicao?.logoUrl || "",
  req.nextUrl.origin
);

    const nomePolo =
      resultado.poloSelecionado?.nome || "Todos";

    const linhas = resultado.aniversariantes
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.nome)}</td>
            <td>${escapeHtml(nomeTipo(item.tipo))}</td>
            <td>${escapeHtml(item.dataAniversario)}</td>
            <td>${escapeHtml(item.polo || "")}</td>
            <td>${escapeHtml(item.departamento || item.contexto || "")}</td>
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
            body {
              font-family: Arial, sans-serif;
              color: #0f172a;
            }

            h1 {
              font-size: 18px;
              margin: 0 0 4px 0;
            }

            h2 {
              font-size: 14px;
              margin: 0 0 12px 0;
              font-weight: normal;
            }

            p {
              font-size: 12px;
              margin: 0 0 12px 0;
            }

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
          </style>
        </head>

        <body>
  ${
  logoBase64
    ? `<div style="margin-bottom: 8px;">
        <img src="${logoBase64}" style="max-height: 70px; max-width: 220px;" />
      </div>`
    : ""
}

  <h1>${escapeHtml(nomeInstituicao)}</h1>
          <h2>Relatório de aniversariantes</h2>

          <p>
            Mês: ${escapeHtml(nomeMes(resultado.mes))}
            |
            Polo: ${escapeHtml(nomePolo)}
            |
            Total: ${escapeHtml(resultado.total)}
          </p>

          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Aniversário</th>
                <th>Polo</th>
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

    const nomeArquivo = `aniversariantes-${nomeMes(resultado.mes)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")}.xls`;

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