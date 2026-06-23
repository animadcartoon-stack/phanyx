import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function substituirExemplos(texto: string, config: any) {
  const valores: Record<string, string> = {
    nomeInstituicao: config?.nomeFantasia || "Instituição Exemplo",
    cnpjInstituicao: config?.cnpj || "00.000.000/0001-00",
    dataAtual: new Date().toLocaleDateString("pt-BR"),
    cidadeAssinatura: config?.cidadeAssinatura || config?.cidade || "Cidade",
  };

  let final = texto;

  for (const [chave, valor] of Object.entries(valores)) {
    final = final.replaceAll(`{{${chave}}}`, valor);
  }

  return final.replaceAll(/{{[^}]+}}/g, "-");
}

export async function POST(req: NextRequest) {
  const user = await getUserFromToken();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const config = await prisma.configuracaoInstituicao.findUnique({
    where: { instituicaoId: user.instituicaoId },
  });

  const conteudoHtml = substituirExemplos(String(body?.conteudo || ""), config);

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Prévia HTML</title>
  <style>
    body {
      margin: 0;
      background: #1f2937;
    }

    .pagina-a4 {
      width: 210mm;
      min-height: 297mm;
      margin: 20px auto;
      padding: 18mm;
      background: #ffffff;
      color: #000000;
      box-shadow: 0 0 24px rgba(0,0,0,.35);
    }

    @media print {
      body {
        background: white;
      }

      .pagina-a4 {
        margin: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <main class="pagina-a4">
    ${conteudoHtml}
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
}