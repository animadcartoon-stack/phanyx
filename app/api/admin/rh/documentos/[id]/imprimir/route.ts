import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function escaparHtml(texto: string) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizarConteudo(conteudo: string) {
  const texto = String(conteudo || "");

  const pareceHtml =
    texto.includes("<p") ||
    texto.includes("<div") ||
    texto.includes("<br") ||
    texto.includes("<table") ||
    texto.includes("<h1") ||
    texto.includes("<strong");

  if (pareceHtml) return texto;

  return escaparHtml(texto).replace(/\n/g, "<br />");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return new NextResponse("Sem permissão", { status: 403 });
    }

    const id = Number(params.id);

    if (!id) {
      return new NextResponse("Documento inválido", { status: 400 });
    }

    const documento = await prisma.documentoRH.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        funcionario: {
          select: {
            nome: true,
            cpf: true,
          },
        },
      },
    });

    if (!documento) {
      return new NextResponse("Documento não encontrado", { status: 404 });
    }

    const conteudo = normalizarConteudo(documento.conteudo || "");

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${documento.titulo || "Documento RH"}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #e5e7eb;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12pt;
      line-height: 1.45;
    }

    .barra {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      background: #0f172a;
      color: #ffffff;
      border-bottom: 1px solid #1e293b;
    }

    .barra strong {
      font-size: 14px;
    }

    .barra span {
      display: block;
      font-size: 12px;
      color: #cbd5e1;
      margin-top: 2px;
    }

    .acoes {
      display: flex;
      gap: 8px;
    }

    button {
      border: 0;
      border-radius: 10px;
      padding: 9px 14px;
      cursor: pointer;
      font-weight: 700;
      color: #ffffff;
      background: #dc2626;
    }

    button.secundario {
      background: #334155;
    }

    .pagina {
      width: 210mm;
      min-height: 297mm;
      margin: 18px auto;
      padding: 18mm;
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.20);
    }

    .conteudo {
      width: 100%;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    td, th {
      border: 1px solid #d1d5db;
      padding: 6px;
      vertical-align: top;
    }

    h1, h2, h3 {
      margin-top: 0;
    }

    @media print {
      body {
        background: #ffffff;
      }

      .barra {
        display: none;
      }

      .pagina {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="barra">
    <div>
      <strong>${documento.titulo || "Documento RH"}</strong>
      <span>${documento.funcionario?.nome || ""}</span>
    </div>

    <div class="acoes">
      <button type="button" onclick="window.print()">Imprimir</button>
      <button type="button" class="secundario" onclick="window.close()">Fechar</button>
    </div>
  </div>

  <main class="pagina">
    <section class="conteudo">
      ${conteudo}
    </section>
  </main>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return new NextResponse(
      error?.message || "Erro ao abrir documento para impressão.",
      { status: 500 }
    );
  }
}