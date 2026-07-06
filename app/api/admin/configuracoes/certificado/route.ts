import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
  certificadoTemplateUrl: true,
  certificadoPreviewUrl: true,
  certificadoCoordenadorNome: true,
  certificadoCidade: true,
  certificadoModoFundo: true,
  certificadoCorFundoPagina: true,
  certificadoTamanhoPapel: true,
  certificadoOrientacao: true,
  certificadoLarguraBase: true,
  certificadoAlturaBase: true,
},
    });

    return NextResponse.json(instituicao);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao buscar configuração", detalhe: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();

const dadosAtualizacao: any = {
  certificadoTemplateUrl: body.certificadoTemplateUrl || null,
  certificadoCoordenadorNome: body.certificadoCoordenadorNome || null,
  certificadoCidade: body.certificadoCidade || null,
};

if (Object.prototype.hasOwnProperty.call(body, "certificadoPreviewUrl")) {
  dadosAtualizacao.certificadoPreviewUrl = body.certificadoPreviewUrl || null;
}

if (Object.prototype.hasOwnProperty.call(body, "certificadoModoFundo")) {
  dadosAtualizacao.certificadoModoFundo =
    body.certificadoModoFundo || "modelo";
}

if (Object.prototype.hasOwnProperty.call(body, "certificadoCorFundoPagina")) {
  dadosAtualizacao.certificadoCorFundoPagina =
    body.certificadoCorFundoPagina || "#ffffff";
}

if (Object.prototype.hasOwnProperty.call(body, "certificadoTamanhoPapel")) {
  dadosAtualizacao.certificadoTamanhoPapel =
    body.certificadoTamanhoPapel || "A4";
}

if (Object.prototype.hasOwnProperty.call(body, "certificadoOrientacao")) {
  dadosAtualizacao.certificadoOrientacao =
    body.certificadoOrientacao || "paisagem";
}

if (Object.prototype.hasOwnProperty.call(body, "certificadoLarguraBase")) {
  dadosAtualizacao.certificadoLarguraBase =
    Number(body.certificadoLarguraBase) || 1123;
}

if (Object.prototype.hasOwnProperty.call(body, "certificadoAlturaBase")) {
  dadosAtualizacao.certificadoAlturaBase =
    Number(body.certificadoAlturaBase) || 794;
}

const instituicao = await prisma.instituicao.update({
  where: { id: user.instituicaoId },
  data: dadosAtualizacao,
  select: {
    certificadoTemplateUrl: true,
    certificadoPreviewUrl: true,
    certificadoCoordenadorNome: true,
    certificadoCidade: true,
    certificadoModoFundo: true,
    certificadoCorFundoPagina: true,
    certificadoTamanhoPapel: true,
    certificadoOrientacao: true,
    certificadoLarguraBase: true,
    certificadoAlturaBase: true,
  },
});

await prisma.certificado.updateMany({
  where: {
    instituicaoId: user.instituicaoId,
  },
  data: {
    arquivoUrl: null,
  },
});

    return NextResponse.json(instituicao);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro ao salvar configuração", detalhe: error.message },
      { status: 500 }
    );
  }
}